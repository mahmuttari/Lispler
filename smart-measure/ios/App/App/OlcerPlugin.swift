import Foundation
import UIKit
import AVFoundation
import CoreMotion
import Capacitor

/// Ölçü Kutusu'nun iPhone eklentisi: Android'deki OlcerPlugin.java ile aynı yöntemler, aynı olaylar ve aynı birimler (www/js/native.js
/// tek bir arayüz görür). Farklar:
/// - Yerçekimi Core Motion'dan; Android'in işaretine çevrilir (yüzü yukarı yatan telefonda z = +9,81 m/s²).
/// - Yönelim: oyun dönme vektörünün karşılığı, pusulasız referans çerçevesi (xArbitraryZVertical). Matris Android'deki gibi
///   cihazdan dünyaya, satır satır 9 sayı.
/// - Ortam ışığı: iOS bu sensörü uygulamalara açmaz; "var: false" döner, sayfa ışık ölçeri iPhone'da göstermez.
/// - Ses: AVAudioEngine, "measurement" kipi (otomatik kazanç ve ses işleme kapalı; Android'deki UNPROCESSED'in karşılığı).
///   Örnekler yalnız bellekte, 100 ms'lik bloklar hâlinde işlenir; hiçbir şey kaydedilmez, saklanmaz, gönderilmez.
/// - Ekran yoğunluğu: iOS piksel yoğunluğunu (ppi) bildirmez; model kimliğinden bilinen değer, bilinmiyorsa ölçeğe göre tahmin.
///   Cetvel banka kartıyla kalibre edilebilir.
@objc(OlcerPlugin)
public class OlcerPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "OlcerPlugin"
    public let jsName = "Olcer"
    public let pluginMethods: [CAPPluginMethod] = [
        "bilgi", "yetenekler", "checkPermissions", "requestPermissions",
        "yercekimiBaslat", "yercekimiDurdur", "yonelimBaslat", "yonelimDurdur", "isikBaslat", "isikDurdur",
        "sesBaslat", "sesDurdur", "ayarlariAc", "baglantiAc", "kopyala", "paylas", "cubuklar", "ekranAcik",
    ].map { CAPPluginMethod(name: $0, returnType: CAPPluginReturnPromise) }

    private static let g = 9.80665
    private static let araliqMs = 30.0   // en sık ~33 olay/sn (Android: YERCEKIMI_NS, YONELIM_NS)

    private let hareket = CMMotionManager()
    private let kuyruk: OperationQueue = {
        let q = OperationQueue()
        q.name = "Olcer.hareket"
        q.maxConcurrentOperationCount = 1
        return q
    }()
    private var yercekimiAcik = false, yonelimAcik = false
    private var ses: SesOlcer?

    override public func load() {
        let nc = NotificationCenter.default
        nc.addObserver(self, selector: #selector(arkaPlan), name: UIApplication.didEnterBackgroundNotification, object: nil)
    }

    /// Android'deki handleOnPause gibi: arka planda sensör ve mikrofon kapanır; sayfa öne gelince yeniden başlatır.
    @objc private func arkaPlan() {
        yercekimiKapat()
        yonelimKapat()
        sesKapat()
    }

    // ---------------------------------------------------------------- bilgi
    @objc func bilgi(_ call: CAPPluginCall) {
        let b = Bundle.main.infoDictionary ?? [:]
        #if DEBUG
        let debug = true
        #else
        let debug = false
        #endif
        call.resolve([
            "debug": debug,
            "versionName": b["CFBundleShortVersionString"] as? String ?? "",
            "versionCode": Int(b["CFBundleVersion"] as? String ?? "") ?? 0,
        ])
    }

    @objc func yetenekler(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let arka = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back)
            let ekran = self.ekran()
            call.resolve([
                "sensors": [
                    "accelerometer": self.hareket.isAccelerometerAvailable,
                    "gravity": self.hareket.isDeviceMotionAvailable,
                    "gyroscope": self.hareket.isGyroAvailable,
                    "rotationVector": self.hareket.isDeviceMotionAvailable && self.hareket.isMagnetometerAvailable,
                    "gameRotationVector": self.hareket.isDeviceMotionAvailable,
                    "light": false,
                ],
                "microphone": AVAudioSession.sharedInstance().isInputAvailable,
                "rearCamera": arka != nil,
                "flash": arka?.hasTorch ?? false,
                "arcore": false,
                "display": ekran,
            ])
        }
    }

    /// widthPx/heightPx fiziksel piksel (dikey); xdpi/ydpi, sayfanın CSS pikselini (devicePixelRatio = scale) mm'ye çevirecek biçimde:
    /// mm / CSS px = 25,4 × scale / dpi = 25,4 × nativeScale / ppi.
    private func ekran() -> [String: Any] {
        let s = bridge?.viewController?.view.window?.windowScene?.screen ?? UIScreen.main
        let nb = s.nativeBounds
        let ppi = OlcerPlugin.ppi(model: OlcerPlugin.model(), olcek: s.scale)
        let dpi = ppi * Double(s.scale / s.nativeScale)
        return [
            "widthPx": Int(min(nb.width, nb.height)), "heightPx": Int(max(nb.width, nb.height)),
            "xdpi": dpi, "ydpi": dpi, "densityDpi": Int(dpi.rounded()), "density": Double(s.scale),
        ]
    }

    static func model() -> String {
        if let sim = ProcessInfo.processInfo.environment["SIMULATOR_MODEL_IDENTIFIER"] { return sim }
        var u = utsname()
        uname(&u)
        return withUnsafeBytes(of: &u.machine) { b in String(decoding: b.prefix(while: { $0 != 0 }), as: UTF8.self) }
    }

    /// Apple'ın teknik özelliklerindeki ekran yoğunluğu (ppi). Listede olmayan @3x iPhone'lar 460, @2x olanlar 326 ppi'dir.
    static func ppi(model: String, olcek: CGFloat) -> Double {
        let bilinen: [String: Double] = [
            "iPhone11,2": 458, "iPhone11,4": 458, "iPhone11,6": 458,   // XS, XS Max
            "iPhone12,3": 458, "iPhone12,5": 458,                       // 11 Pro, 11 Pro Max
            "iPhone13,1": 476, "iPhone13,4": 458,                       // 12 mini, 12 Pro Max
            "iPhone14,4": 476, "iPhone14,3": 458,                       // 13 mini, 13 Pro Max
            "iPhone14,8": 458,                                          // 14 Plus
            "iPhone10,2": 401, "iPhone10,5": 401,                       // 8 Plus
        ]
        return bilinen[model] ?? (olcek >= 3 ? 460 : 326)
    }

    // ---------------------------------------------------------------- izinler (kamera, mikrofon)
    private func durum(_ a: AVAuthorizationStatus) -> String {
        switch a {
        case .authorized: return "granted"
        case .denied, .restricted: return "denied"
        default: return "prompt"
        }
    }

    private func mikrofonDurumu() -> String {
        if #available(iOS 17.0, *) {
            switch AVAudioApplication.shared.recordPermission {
            case .granted: return "granted"
            case .denied: return "denied"
            default: return "prompt"
            }
        }
        switch AVAudioSession.sharedInstance().recordPermission {
        case .granted: return "granted"
        case .denied: return "denied"
        default: return "prompt"
        }
    }

    private func izinler() -> [String: String] {
        ["camera": durum(AVCaptureDevice.authorizationStatus(for: .video)), "microphone": mikrofonDurumu()]
    }

    @objc override public func checkPermissions(_ call: CAPPluginCall) {
        call.resolve(izinler())
    }

    @objc override public func requestPermissions(_ call: CAPPluginCall) {
        let istenen = call.getArray("permissions", String.self) ?? ["camera", "microphone"]
        let grup = DispatchGroup()
        if istenen.contains("camera") && AVCaptureDevice.authorizationStatus(for: .video) == .notDetermined {
            grup.enter()
            AVCaptureDevice.requestAccess(for: .video) { _ in grup.leave() }
        }
        if istenen.contains("microphone") && mikrofonDurumu() == "prompt" {
            grup.enter()
            if #available(iOS 17.0, *) {
                AVAudioApplication.requestRecordPermission { _ in grup.leave() }
            } else {
                AVAudioSession.sharedInstance().requestRecordPermission { _ in grup.leave() }
            }
        }
        grup.notify(queue: .main) { call.resolve(self.izinler()) }
    }

    // ---------------------------------------------------------------- yerçekimi
    /// Android'in yönü ve birimi: m/s², yüzü yukarı yatan telefonda z = +9,81 (Core Motion'da yerçekimi −1 g gösterir).
    @objc func yercekimiBaslat(_ call: CAPPluginCall) {
        yercekimiKapat()
        if hareket.isDeviceMotionAvailable {
            yercekimiAcik = true
            hareketBaslat()
            call.resolve(["var": true, "kaynak": "gravity"])
            return
        }
        guard hareket.isAccelerometerAvailable else { call.resolve(["var": false]); return }
        // Yalnız ivmeölçer: pencere ortalaması (örtüşme olmasın), en sık 30 ms'de bir
        var tx = 0.0, ty = 0.0, tz = 0.0, n = 0.0, son = 0.0
        hareket.accelerometerUpdateInterval = 1.0 / 100
        hareket.startAccelerometerUpdates(to: kuyruk) { [weak self] v, _ in
            guard let self = self, let v = v else { return }
            tx += v.acceleration.x; ty += v.acceleration.y; tz += v.acceleration.z; n += 1
            let t = v.timestamp * 1000
            if t - son < OlcerPlugin.araliqMs { return }
            son = t
            let o: [String: Any] = ["x": -tx / n * OlcerPlugin.g, "y": -ty / n * OlcerPlugin.g, "z": -tz / n * OlcerPlugin.g, "t": t, "kaynak": "accelerometer"]
            tx = 0; ty = 0; tz = 0; n = 0
            self.olay("yercekimi", o)
        }
        call.resolve(["var": true, "kaynak": "accelerometer"])
    }

    @objc func yercekimiDurdur(_ call: CAPPluginCall) {
        yercekimiKapat()
        call.resolve()
    }

    private func yercekimiKapat() {
        hareket.stopAccelerometerUpdates()
        yercekimiAcik = false
        hareketDurduMu()
    }

    // ---------------------------------------------------------------- yönelim (kameranın yönü)
    @objc func yonelimBaslat(_ call: CAPPluginCall) {
        yonelimKapat()
        guard hareket.isDeviceMotionAvailable else { call.resolve(["var": false]); return }
        yonelimAcik = true
        hareketBaslat()
        call.resolve(["var": true, "kaynak": "game"])
    }

    @objc func yonelimDurdur(_ call: CAPPluginCall) {
        yonelimKapat()
        call.resolve()
    }

    private func yonelimKapat() {
        yonelimAcik = false
        hareketDurduMu()
    }

    /// Yerçekimi ve yönelim aynı Core Motion akışını paylaşır (pusulasız çerçeve: içeride manyetik bozulmadan etkilenmez).
    private var hareketCalisiyor = false, sonYercekimi = 0.0, sonYonelim = 0.0
    private var devrik: Bool?   // Core Motion matrisinin yönü: ilk belirgin eğimde yerçekimiyle denetlenip sabitlenir

    private func hareketBaslat() {
        if hareketCalisiyor { return }
        hareketCalisiyor = true
        sonYercekimi = 0; sonYonelim = 0
        hareket.deviceMotionUpdateInterval = 1.0 / 60
        hareket.startDeviceMotionUpdates(using: .xArbitraryZVertical, to: kuyruk) { [weak self] m, _ in
            guard let self = self, let m = m else { return }
            let t = m.timestamp * 1000
            let gr = m.gravity
            if self.yercekimiAcik && t - self.sonYercekimi >= OlcerPlugin.araliqMs {
                self.sonYercekimi = t
                self.olay("yercekimi", ["x": -gr.x * OlcerPlugin.g, "y": -gr.y * OlcerPlugin.g, "z": -gr.z * OlcerPlugin.g, "t": t, "kaynak": "gravity"])
            }
            if self.yonelimAcik && t - self.sonYonelim >= OlcerPlugin.araliqMs {
                self.sonYonelim = t
                self.olay("yonelim", ["m": self.matris(m.attitude.rotationMatrix, gr), "t": t, "kaynak": "game"])
            }
        }
    }

    private func hareketDurduMu() {
        if !yercekimiAcik && !yonelimAcik && hareketCalisiyor {
            hareket.stopDeviceMotionUpdates()
            hareketCalisiyor = false
        }
    }

    /// Android'deki getRotationMatrixFromVector çıktısı: cihaz → dünya (Z yukarı), satır satır. Core Motion'ın matrisi dünyadan
    /// cihaza olduğu için devriği alınır; bu yön, telefon belirgin eğikken dünyanın yukarı ekseni (3. satır) yerçekiminin tersiyle
    /// karşılaştırılarak bir kez doğrulanır.
    private func matris(_ r: CMRotationMatrix, _ gr: CMAcceleration) -> [Double] {
        let devrikDegil = [r.m11, r.m12, r.m13, r.m21, r.m22, r.m23, r.m31, r.m32, r.m33]
        let devrikHali = [r.m11, r.m21, r.m31, r.m12, r.m22, r.m32, r.m13, r.m23, r.m33]
        if devrik == nil {
            let n = (gr.x * gr.x + gr.y * gr.y + gr.z * gr.z).squareRoot()
            if n > 0.5 && abs(gr.z / n) < 0.8 {
                let yukari = [-gr.x / n, -gr.y / n, -gr.z / n]
                let uy = { (a: [Double]) in a[6] * yukari[0] + a[7] * yukari[1] + a[8] * yukari[2] }
                devrik = uy(devrikHali) >= uy(devrikDegil)
            }
        }
        return devrik == false ? devrikDegil : devrikHali
    }

    // ---------------------------------------------------------------- ortam ışığı (iOS'ta açık API yok)
    @objc func isikBaslat(_ call: CAPPluginCall) {
        call.resolve(["var": false])
    }

    @objc func isikDurdur(_ call: CAPPluginCall) {
        call.resolve()
    }

    // ---------------------------------------------------------------- ses düzeyi
    @objc func sesBaslat(_ call: CAPPluginCall) {
        sesKapat()
        guard AVAudioSession.sharedInstance().isInputAvailable else { call.resolve(["var": false, "neden": "missing"]); return }
        guard mikrofonDurumu() == "granted" else { call.resolve(["var": false, "neden": "denied"]); return }
        let suzgecler = call.getObject("suzgecler") ?? [:]
        let olcer = SesOlcer(suzgec: { fs in OlcerPlugin.katsayilar(suzgecler, fs) }, olcum: { [weak self] s, saniye, kaynak in
            self?.olay("ses", ["hizli": s.hizli, "blok": s.blok, "tepe": s.tepe, "kirpma": s.kirpma, "sure": saniye, "kaynak": kaynak])
        }, hata: { [weak self] neden in
            self?.olay("sesHata", ["neden": neden])
        })
        guard olcer.basla() else { call.resolve(["var": false, "neden": "failed"]); return }
        ses = olcer
        call.resolve(["var": true, "kaynak": SesOlcer.kaynak])
    }

    /// {"48000": [[b0,b1,b2,a1,a2], …], …} → fs için katsayılar
    static func katsayilar(_ t: JSObject, _ fs: Int) -> [[Double]]? {
        guard let b = t[String(fs)] as? [Any], !b.isEmpty else { return nil }
        var out: [[Double]] = []
        for c in b {
            guard let c = c as? [Any], c.count == 5 else { return nil }
            let d = c.compactMap { v -> Double? in (v as? NSNumber)?.doubleValue ?? (v as? Double) }
            guard d.count == 5 else { return nil }
            out.append(d)
        }
        return out
    }

    @objc func sesDurdur(_ call: CAPPluginCall) {
        sesKapat()
        call.resolve()
    }

    private func sesKapat() {
        ses?.dur()
        ses = nil
    }

    // ---------------------------------------------------------------- yardımcılar
    @objc func ayarlariAc(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if let u = URL(string: UIApplication.openSettingsURLString) { UIApplication.shared.open(u) }
            call.resolve()
        }
    }

    /// https ve mailto bağlantıları: Safari'de ya da e-posta uygulamasında açılır
    @objc func baglantiAc(_ call: CAPPluginCall) {
        let s = call.getString("url") ?? ""
        guard s.hasPrefix("https://") || s.hasPrefix("mailto:"), let u = URL(string: s) else {
            call.reject("izin verilmeyen bağlantı")
            return
        }
        DispatchQueue.main.async {
            UIApplication.shared.open(u) { ok in ok ? call.resolve() : call.reject("açacak uygulama yok") }
        }
    }

    @objc func kopyala(_ call: CAPPluginCall) {
        let metin = call.getString("metin") ?? ""
        DispatchQueue.main.async {
            UIPasteboard.general.string = metin
            call.resolve()
        }
    }

    @objc func paylas(_ call: CAPPluginCall) {
        let metin = call.getString("metin") ?? ""
        DispatchQueue.main.async {
            guard let vc = self.bridge?.viewController else { call.resolve(); return }
            let a = UIActivityViewController(activityItems: [metin], applicationActivities: nil)
            a.popoverPresentationController?.sourceView = vc.view
            a.popoverPresentationController?.sourceRect = CGRect(x: vc.view.bounds.midX, y: vc.view.bounds.maxY, width: 0, height: 0)
            vc.present(a, animated: true)
            call.resolve()
        }
    }

    /// Durum çubuğu: koyu temada açık simgeler; renk: çubuğun arkasında görünen zemin
    @objc func cubuklar(_ call: CAPPluginCall) {
        let koyu = call.getBool("koyu") ?? true
        let renk = OlcerPlugin.renk(call.getString("renk") ?? (koyu ? "#000000" : "#F3F6FA"))
        DispatchQueue.main.async {
            self.bridge?.statusBarStyle = koyu ? .lightContent : .darkContent
            if let r = renk {
                self.bridge?.viewController?.view.backgroundColor = r
                self.bridge?.webView?.backgroundColor = r
                self.bridge?.webView?.scrollView.backgroundColor = r
            }
            call.resolve()
        }
    }

    /// "#RRGGBB" → renk
    static func renk(_ s: String) -> UIColor? {
        let h = s.hasPrefix("#") ? String(s.dropFirst()) : s
        guard h.count == 6, let v = UInt32(h, radix: 16) else { return nil }
        return UIColor(red: CGFloat((v >> 16) & 0xff) / 255, green: CGFloat((v >> 8) & 0xff) / 255, blue: CGFloat(v & 0xff) / 255, alpha: 1)
    }

    @objc func ekranAcik(_ call: CAPPluginCall) {
        let acik = call.getBool("acik") ?? false
        DispatchQueue.main.async {
            UIApplication.shared.isIdleTimerDisabled = acik
            call.resolve()
        }
    }

    // ---------------------------------------------------------------- olaylar ana iş parçacığında (Android: executeOnMainThread)
    private func olay(_ ad: String, _ veri: [String: Any]) {
        DispatchQueue.main.async { self.notifyListeners(ad, data: veri) }
    }
}

/// Mikrofondan ses düzeyi: AVAudioEngine girişi, "measurement" kipi. 48 ya da 44,1 kHz değilse (sayfa yalnız bu iki hızın
/// süzgecini verir) donanımdan 48 kHz istenir; yine olmazsa açılmaz.
final class SesOlcer: NSObject {
    static let kaynak = "measurement"

    private let motor = AVAudioEngine()
    private let suzgec: (Int) -> [[Double]]?
    private let olcum: (SesIsleyici.Sonuc, Double, String) -> Void
    private let hata: (String) -> Void
    private var isleyici: SesIsleyici?
    private var tampon: [Float] = []
    private var blokBoyu = 4800
    private var ornekleme = 48000
    private var calisiyor = false

    init(suzgec: @escaping (Int) -> [[Double]]?, olcum: @escaping (SesIsleyici.Sonuc, Double, String) -> Void, hata: @escaping (String) -> Void) {
        self.suzgec = suzgec
        self.olcum = olcum
        self.hata = hata
        super.init()
    }

    func basla() -> Bool {
        let oturum = AVAudioSession.sharedInstance()
        do {
            try oturum.setCategory(.record, mode: .measurement)
            try? oturum.setPreferredSampleRate(48000)
            try oturum.setActive(true)
        } catch {
            return false
        }
        let giris = motor.inputNode
        let bicim = giris.outputFormat(forBus: 0)
        let fs = Int(bicim.sampleRate.rounded())
        guard fs > 0, bicim.channelCount > 0, let k = suzgec(fs), let isl = SesIsleyici(ornekleme: fs, bolumler: k) else {
            try? oturum.setActive(false, options: .notifyOthersOnDeactivation)
            return false
        }
        ornekleme = fs
        blokBoyu = fs / 10
        isleyici = isl
        tampon.reserveCapacity(blokBoyu * 2)
        giris.installTap(onBus: 0, bufferSize: AVAudioFrameCount(blokBoyu), format: bicim) { [weak self] b, _ in
            self?.al(b)
        }
        motor.prepare()
        do {
            try motor.start()
        } catch {
            giris.removeTap(onBus: 0)
            try? oturum.setActive(false, options: .notifyOthersOnDeactivation)
            return false
        }
        calisiyor = true
        NotificationCenter.default.addObserver(self, selector: #selector(kesinti), name: AVAudioSession.interruptionNotification, object: oturum)
        return true
    }

    /// Ses iş parçacığında: ilk kanal, 100 ms'lik bloklar
    private func al(_ b: AVAudioPCMBuffer) {
        guard calisiyor, let ch = b.floatChannelData?[0], let isl = isleyici else { return }
        tampon.append(contentsOf: UnsafeBufferPointer(start: ch, count: Int(b.frameLength)))
        while tampon.count >= blokBoyu {
            let s = tampon.withUnsafeBufferPointer { isl.blok($0.baseAddress!, blokBoyu) }
            tampon.removeFirst(blokBoyu)
            olcum(s, Double(blokBoyu) / Double(ornekleme), SesOlcer.kaynak)
        }
    }

    @objc private func kesinti(_ n: Notification) {
        guard let t = n.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt, AVAudioSession.InterruptionType(rawValue: t) == .began else { return }
        if calisiyor { hata("failed") }
    }

    func dur() {
        guard calisiyor else { return }
        NotificationCenter.default.removeObserver(self)
        motor.inputNode.removeTap(onBus: 0)
        calisiyor = false
        motor.stop()
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }
}
