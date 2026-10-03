import AppTrackingTransparency
import GoogleMobileAds
import UIKit
import UserMessagingPlatform

/// Ücretsiz sürümdeki reklamlar: alt banner, geçiş (interstitial) reklamı ve uygulama açılış reklamı.
/// Pro abonelerde hiçbiri yüklenmez.
@MainActor
final class AdsManager: NSObject, FullScreenContentDelegate {

    /* ---- Reklam sıklığı ayarları ---- */
    // İki tam ekran reklam arasında en az bu kadar saniye geçer.
    // Çok düşürmek AdMob politikasına aykırıdır ve hesabın kapatılmasına yol açabilir.
    static let minFullscreenInterval: TimeInterval = 60
    // Uygulama en az bu kadar arka planda kaldıysa dönüşte açılış reklamı gösterilir.
    static let appOpenAfterBackground: TimeInterval = 30
    // Soğuk açılışta açılış reklamı ancak bu süre içinde yüklendiyse gösterilir.
    static let coldStartWindow: TimeInterval = 4

    private weak var viewController: UIViewController?
    private weak var container: UIView?
    private var heightConstraint: NSLayoutConstraint?
    private var onLayoutChange: (() -> Void)?

    private var enabled = true
    private var sdkStarted = false
    private var adsReady = false
    private var keyboardVisible = false
    private var banner: BannerView?
    private var interstitial: InterstitialAd?
    private var appOpenAd: AppOpenAd?
    private(set) var showingFullscreen = false
    private var lastFullscreen = Date.distantPast
    private let createdAt = Date()
    private var coldStartShown = false

    private func adUnit(_ key: String) -> String {
        Bundle.main.object(forInfoDictionaryKey: key) as? String ?? ""
    }

    func attach(viewController: UIViewController, container: UIView, height: NSLayoutConstraint,
                onLayoutChange: @escaping () -> Void) {
        self.viewController = viewController
        self.container = container
        self.heightConstraint = height
        self.onLayoutChange = onLayoutChange
    }

    /// Önce (AB/İngiltere için) izin formu ve izleme izni, sonra reklamlar.
    func start() {
        guard enabled, let vc = viewController else { return }
        ConsentInformation.shared.requestConsentInfoUpdate(with: RequestParameters()) { [weak self] _ in
            Task { @MainActor in
                guard let self else { return }
                ConsentForm.loadAndPresentIfRequired(from: vc) { [weak self] _ in
                    Task { @MainActor in self?.afterConsent() }
                }
            }
        }
        if ConsentInformation.shared.canRequestAds { startSDK() }
    }

    private func afterConsent() {
        guard ConsentInformation.shared.canRequestAds else { return }
        if ATTrackingManager.trackingAuthorizationStatus == .notDetermined {
            ATTrackingManager.requestTrackingAuthorization { _ in
                Task { @MainActor in self.startSDK() }
            }
        } else {
            startSDK()
        }
    }

    private func startSDK() {
        guard enabled, !sdkStarted else { return }
        sdkStarted = true
        MobileAds.shared.start { [weak self] _ in
            Task { @MainActor in
                guard let self else { return }
                self.adsReady = true
                self.loadBanner()
                self.loadInterstitial()
                self.loadAppOpen()
            }
        }
    }

    /// Pro olunca reklamları tamamen kapatır.
    func setEnabled(_ on: Bool) {
        enabled = on
        if !on {
            banner?.removeFromSuperview()
            banner = nil
            interstitial = nil
            appOpenAd = nil
            updateBanner()
        } else if sdkStarted {
            loadBanner()
            loadInterstitial()
            loadAppOpen()
        } else {
            start()
        }
    }

    /// Klavye açıkken banner gizlenir (yanlışlıkla tıklamayı önler, AdMob kuralı).
    func setKeyboardVisible(_ visible: Bool) {
        keyboardVisible = visible
        updateBanner()
    }

    private func updateBanner() {
        let show = enabled && banner != nil && !keyboardVisible
        banner?.isHidden = !show
        heightConstraint?.constant = show ? (banner?.adSize.size.height ?? 0) : 0
        onLayoutChange?()
    }

    // MARK: Banner

    private func loadBanner() {
        guard enabled, adsReady, banner == nil, let vc = viewController, let container else { return }
        let width = vc.view.bounds.width - vc.view.safeAreaInsets.left - vc.view.safeAreaInsets.right
        let b = BannerView(adSize: currentOrientationAnchoredAdaptiveBanner(width: width))
        b.adUnitID = adUnit("NDBannerAdUnitID")
        b.rootViewController = vc
        b.translatesAutoresizingMaskIntoConstraints = false
        container.addSubview(b)
        NSLayoutConstraint.activate([
            b.centerXAnchor.constraint(equalTo: container.centerXAnchor),
            b.topAnchor.constraint(equalTo: container.topAnchor),
        ])
        b.load(Request())
        banner = b
        updateBanner()
    }

    // MARK: Geçiş reklamı

    private func loadInterstitial() {
        guard enabled, adsReady, interstitial == nil else { return }
        InterstitialAd.load(with: adUnit("NDInterstitialAdUnitID"), request: Request()) { [weak self] ad, _ in
            Task { @MainActor in
                guard let self, self.enabled else { return }
                ad?.fullScreenContentDelegate = self
                self.interstitial = ad
            }
        }
    }

    private var canShowFullscreen: Bool {
        enabled && !showingFullscreen && Date().timeIntervalSince(lastFullscreen) >= Self.minFullscreenInterval
    }

    /// Doğal geçiş anlarında çağrılır (HTML önizlemeden çıkış, kaydetme, dosya açma, yeni belge).
    func naturalBreak() {
        guard canShowFullscreen, let vc = viewController else { return }
        guard let ad = interstitial else { loadInterstitial(); return }
        interstitial = nil
        showingFullscreen = true
        lastFullscreen = Date()
        ad.present(from: vc)
    }

    // MARK: Uygulama açılış reklamı

    private func loadAppOpen() {
        guard enabled, adsReady, appOpenAd == nil else { return }
        AppOpenAd.load(with: adUnit("NDAppOpenAdUnitID"), request: Request()) { [weak self] ad, _ in
            Task { @MainActor in
                guard let self, self.enabled, let ad else { return }
                ad.fullScreenContentDelegate = self
                self.appOpenAd = ad
                if !self.coldStartShown && Date().timeIntervalSince(self.createdAt) < Self.coldStartWindow {
                    self.coldStartShown = true
                    self.showAppOpen()
                }
            }
        }
    }

    func returnedFromBackground(after seconds: TimeInterval) {
        coldStartShown = true
        if seconds >= Self.appOpenAfterBackground { showAppOpen() }
    }

    private func showAppOpen() {
        guard canShowFullscreen, let vc = viewController else { return }
        guard let ad = appOpenAd else { loadAppOpen(); return }
        appOpenAd = nil
        showingFullscreen = true
        lastFullscreen = Date()
        ad.present(from: vc)
    }

    // MARK: FullScreenContentDelegate

    nonisolated func adDidDismissFullScreenContent(_ ad: FullScreenPresentingAd) {
        Task { @MainActor in
            self.showingFullscreen = false
            self.lastFullscreen = Date()
            self.loadInterstitial()
            self.loadAppOpen()
        }
    }

    nonisolated func ad(_ ad: FullScreenPresentingAd, didFailToPresentFullScreenContentWithError error: Error) {
        Task { @MainActor in
            self.showingFullscreen = false
            self.loadInterstitial()
            self.loadAppOpen()
        }
    }
}
