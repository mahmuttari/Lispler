import UIKit
import UniformTypeIdentifiers
import WebKit

/// Not Defteri arayüzü (app/index.html) bir WKWebView'da çalışır. Bu sınıf JavaScript'e
/// Android sürümüyle aynı "NativeApp" köprüsünü sağlar: dosya aç/kaydet, pano, paylaş, Pro, reklam.
final class ViewController: UIViewController, WKScriptMessageHandlerWithReply, WKNavigationDelegate,
    WKUIDelegate, UIDocumentPickerDelegate, UIScrollViewDelegate {

    private var webView: WKWebView!
    private let bannerContainer = UIView()
    private var bannerHeight: NSLayoutConstraint!
    private let ads = AdsManager()
    private let store = StoreManager.shared

    private var pageReady = false
    private var pendingIncoming: URL?
    private var pickerRequest: PickerRequest?
    private var expectingReturn = false
    private var backgroundedAt: Date?
    private var darkUI = false

    private enum PickerRequest {
        case open(callbackId: String)
        case save(callbackId: String, tempURL: URL)
    }

    // JavaScript tarafındaki window.NativeApp (Android köprüsüyle aynı adlar)
    private static let bridgeJS = """
    (function () {
      var h = window.webkit.messageHandlers.native;
      function call(m, args) { return h.postMessage({ m: m, a: Array.prototype.slice.call(args) }); }
      var names = ['ready', 'openFile', 'saveFileAs', 'writeFile', 'setClipboard', 'getClipboard', 'share',
                   'setBarColor', 'getProInfo', 'buyPro', 'restorePro', 'manageSubscription', 'openUrl', 'adBreak'];
      var api = { platform: function () { return 'ios'; } };
      names.forEach(function (n) { api[n] = function () { return call(n, arguments); }; });
      window.NativeApp = api;
    })();
    """

    override var preferredStatusBarStyle: UIStatusBarStyle { darkUI ? .lightContent : .darkContent }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(named: "LaunchBackground")

        let config = WKWebViewConfiguration()
        config.setURLSchemeHandler(AppSchemeHandler(), forURLScheme: AppSchemeHandler.scheme)
        config.userContentController.addScriptMessageHandler(self, contentWorld: .page, name: "native")
        config.userContentController.addUserScript(
            WKUserScript(source: Self.bridgeJS, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []

        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.isOpaque = false
        webView.backgroundColor = view.backgroundColor
        webView.scrollView.backgroundColor = view.backgroundColor
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.bounces = false
        webView.scrollView.isScrollEnabled = false
        webView.scrollView.delegate = self
        if #available(iOS 16.4, *) { webView.isInspectable = true }

        // Düzen: WebView üstte, reklam bandı altta; ikisi de klavyenin üstünde kalır
        webView.translatesAutoresizingMaskIntoConstraints = false
        bannerContainer.translatesAutoresizingMaskIntoConstraints = false
        bannerContainer.clipsToBounds = true
        view.addSubview(webView)
        view.addSubview(bannerContainer)
        bannerHeight = bannerContainer.heightAnchor.constraint(equalToConstant: 0)
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.topAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: bannerContainer.topAnchor),
            bannerContainer.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor),
            bannerContainer.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor),
            bannerContainer.bottomAnchor.constraint(equalTo: view.keyboardLayoutGuide.topAnchor),
            bannerHeight,
        ])

        webView.load(URLRequest(url: AppSchemeHandler.startURL))

        let nc = NotificationCenter.default
        nc.addObserver(self, selector: #selector(keyboardWillShow), name: UIResponder.keyboardWillShowNotification, object: nil)
        nc.addObserver(self, selector: #selector(keyboardWillHide), name: UIResponder.keyboardWillHideNotification, object: nil)
        nc.addObserver(self, selector: #selector(didEnterBackground), name: UIApplication.didEnterBackgroundNotification, object: nil)
        nc.addObserver(self, selector: #selector(willEnterForeground), name: UIApplication.willEnterForegroundNotification, object: nil)

        ads.attach(viewController: self, container: bannerContainer, height: bannerHeight) { [weak self] in
            UIView.animate(withDuration: 0.2) { self?.view.layoutIfNeeded() }
        }
        store.onProChanged = { [weak self] pro in
            guard let self else { return }
            self.ads.setEnabled(!pro)
            self.js("window.onProChanged && window.onProChanged(\(pro))")
        }
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        if !store.isPro { ads.start() } else { ads.setEnabled(false) }
    }

    // MARK: Klavye ve yaşam döngüsü

    @objc private func keyboardWillShow() { ads.setKeyboardVisible(true) }
    @objc private func keyboardWillHide() { ads.setKeyboardVisible(false) }

    @objc private func didEnterBackground() {
        backgroundedAt = Date()
        // Taslağı hemen kaydet
        js("window.dispatchEvent(new Event('beforeunload'))")
    }

    @objc private func willEnterForeground() {
        defer { expectingReturn = false }
        Task { await store.refresh() }
        guard let at = backgroundedAt, !expectingReturn, !ads.showingFullscreen, !store.isPro else { return }
        ads.returnedFromBackground(after: Date().timeIntervalSince(at))
    }

    // Klavye açılınca WebKit sayfayı kaydırmaya çalışır; düzen sabit olduğu için geri al
    func scrollViewDidScroll(_ scrollView: UIScrollView) {
        if scrollView.contentOffset != .zero { scrollView.contentOffset = .zero }
    }

    // MARK: JavaScript köprüsü

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage,
                               replyHandler: @escaping (Any?, String?) -> Void) {
        guard let body = message.body as? [String: Any], let method = body["m"] as? String else {
            replyHandler(nil, nil)
            return
        }
        let a = body["a"] as? [Any] ?? []
        func str(_ i: Int) -> String { i < a.count ? (a[i] as? String ?? "") : "" }

        switch method {
        case "ready":
            pageReady = true
            if let url = pendingIncoming { pendingIncoming = nil; openIncoming(url) }
        case "getClipboard":
            replyHandler(UIPasteboard.general.string ?? "", nil)
            return
        case "setClipboard":
            UIPasteboard.general.string = str(0)
        case "openFile":
            presentOpenPicker(callbackId: str(0))
        case "saveFileAs":
            presentSavePicker(callbackId: str(0), name: str(1), content: str(2))
        case "writeFile":
            writeFile(callbackId: str(0), ref: str(1), content: str(2))
        case "share":
            share(name: str(0), content: str(1))
        case "setBarColor":
            setBarColor(hex: str(0), dark: (a.count > 1 ? a[1] as? Bool : nil) ?? false)
        case "getProInfo":
            let id = str(0)
            Task { callback(id, await store.info()) }
        case "buyPro":
            let id = str(0)
            Task { callback(id, await store.buy()) }
        case "restorePro":
            let id = str(0)
            Task { callback(id, await store.restore()) }
        case "manageSubscription":
            store.showManageSubscriptions(in: view.window?.windowScene)
        case "openUrl":
            if let url = URL(string: str(0)) { openExternal(url) }
        case "adBreak":
            if !store.isPro { ads.naturalBreak() }
        default:
            break
        }
        replyHandler(nil, nil)
    }

    private func js(_ code: String) {
        webView?.evaluateJavaScript(code, completionHandler: nil)
    }

    private func callback(_ id: String, _ result: [String: Any]?) {
        var json = "null"
        if let result, let data = try? JSONSerialization.data(withJSONObject: result),
           let s = String(data: data, encoding: .utf8) {
            json = s
        }
        js("window.__nativeCb(\(Self.quote(id)), \(json))")
    }

    private static func quote(_ s: String) -> String {
        // JSON dizisi içinde kodlayıp köşeli parantezleri atarak güvenli JS metni üret
        guard let data = try? JSONSerialization.data(withJSONObject: [s]),
              let arr = String(data: data, encoding: .utf8) else { return "\"\"" }
        return String(arr.dropFirst().dropLast())
    }

    private func openExternal(_ url: URL) {
        expectingReturn = true
        UIApplication.shared.open(url)
    }

    private func setBarColor(hex: String, dark: Bool) {
        var rgb: UInt64 = 0
        Scanner(string: hex.replacingOccurrences(of: "#", with: "")).scanHexInt64(&rgb)
        let color = UIColor(red: CGFloat((rgb >> 16) & 0xff) / 255, green: CGFloat((rgb >> 8) & 0xff) / 255,
                            blue: CGFloat(rgb & 0xff) / 255, alpha: 1)
        view.backgroundColor = color
        webView.backgroundColor = color
        webView.scrollView.backgroundColor = color
        bannerContainer.backgroundColor = color
        darkUI = dark
        setNeedsStatusBarAppearanceUpdate()
    }

    // MARK: Dosyalar

    private static let openTypes: [UTType] = {
        var types: [UTType] = [.plainText, .text, .html, .sourceCode, .json, .xml, .svg, .javaScript, .commaSeparatedText]
        if let css = UTType(filenameExtension: "css") { types.append(css) }
        if let md = UTType(filenameExtension: "md") { types.append(md) }
        types.append(.data)
        return types
    }()

    private func presentOpenPicker(callbackId: String) {
        let picker = UIDocumentPickerViewController(forOpeningContentTypes: Self.openTypes, asCopy: false)
        picker.delegate = self
        pickerRequest = .open(callbackId: callbackId)
        expectingReturn = true
        present(picker, animated: true)
    }

    private func presentSavePicker(callbackId: String, name: String, content: String) {
        let safeName = name.isEmpty ? "Adsız.txt" : name.replacingOccurrences(of: "/", with: "_")
        let dir = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        let temp = dir.appendingPathComponent(safeName)
        do {
            try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
            try content.write(to: temp, atomically: true, encoding: .utf8)
        } catch {
            callback(callbackId, ["error": error.localizedDescription])
            return
        }
        let picker = UIDocumentPickerViewController(forExporting: [temp], asCopy: false)
        picker.delegate = self
        pickerRequest = .save(callbackId: callbackId, tempURL: temp)
        expectingReturn = true
        present(picker, animated: true)
    }

    func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        guard let request = pickerRequest, let url = urls.first else { return }
        pickerRequest = nil
        switch request {
        case .open(let id):
            do {
                let text = try readText(url)
                callback(id, ["name": url.lastPathComponent, "content": text, "uri": bookmark(for: url) ?? ""])
            } catch {
                callback(id, ["error": error.localizedDescription])
            }
        case .save(let id, let temp):
            try? FileManager.default.removeItem(at: temp.deletingLastPathComponent())
            callback(id, ["name": url.lastPathComponent, "uri": bookmark(for: url) ?? ""])
        }
    }

    func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
        guard let request = pickerRequest else { return }
        pickerRequest = nil
        switch request {
        case .open(let id):
            callback(id, nil)
        case .save(let id, let temp):
            try? FileManager.default.removeItem(at: temp.deletingLastPathComponent())
            callback(id, nil)
        }
    }

    private func readText(_ url: URL) throws -> String {
        let scoped = url.startAccessingSecurityScopedResource()
        defer { if scoped { url.stopAccessingSecurityScopedResource() } }
        let data = try Data(contentsOf: url)
        if data.count > 20 * 1024 * 1024 {
            throw NSError(domain: "NotDefteri", code: 1, userInfo: [NSLocalizedDescriptionKey: "Dosya çok büyük (en fazla 20 MB)"])
        }
        var text = String(decoding: data, as: UTF8.self)
        if text.hasPrefix("\u{FEFF}") { text.removeFirst() }
        return text
    }

    /// Dosyaya daha sonra tekrar yazabilmek için kalıcı yer imi ("Kaydet" aynı dosyanın üzerine yazar)
    private func bookmark(for url: URL) -> String? {
        let scoped = url.startAccessingSecurityScopedResource()
        defer { if scoped { url.stopAccessingSecurityScopedResource() } }
        guard let data = try? url.bookmarkData(options: [], includingResourceValuesForKeys: nil, relativeTo: nil) else {
            return nil
        }
        return "bookmark:" + data.base64EncodedString()
    }

    private func writeFile(callbackId: String, ref: String, content: String) {
        guard ref.hasPrefix("bookmark:"), let data = Data(base64Encoded: String(ref.dropFirst(9))) else {
            callback(callbackId, ["error": "Dosya konumu bulunamadı"])
            return
        }
        do {
            var stale = false
            let url = try URL(resolvingBookmarkData: data, options: [], relativeTo: nil, bookmarkDataIsStale: &stale)
            let scoped = url.startAccessingSecurityScopedResource()
            defer { if scoped { url.stopAccessingSecurityScopedResource() } }
            var coordError: NSError?
            var writeError: Error?
            NSFileCoordinator().coordinate(writingItemAt: url, options: .forReplacing, error: &coordError) { target in
                do { try content.write(to: target, atomically: false, encoding: .utf8) } catch { writeError = error }
            }
            if let e = coordError ?? writeError { throw e }
            callback(callbackId, ["ok": true])
        } catch {
            callback(callbackId, ["error": error.localizedDescription])
        }
    }

    /// Dosyalar uygulamasından "Birlikte aç" ile gelen dosya
    func openIncoming(_ url: URL) {
        guard pageReady else { pendingIncoming = url; return }
        do {
            let text = try readText(url)
            let ref = bookmark(for: url)
            js("window.openExternalFile && window.openExternalFile(\(Self.quote(url.lastPathComponent)), "
               + "\(Self.quote(text)), \(ref.map { Self.quote($0) } ?? "null"))")
        } catch {
            js("alert(\(Self.quote("Dosya açılamadı: " + error.localizedDescription)))")
        }
    }

    private func share(name: String, content: String) {
        let vc = UIActivityViewController(activityItems: [content], applicationActivities: nil)
        vc.popoverPresentationController?.sourceView = view
        vc.popoverPresentationController?.sourceRect = CGRect(x: view.bounds.midX, y: 60, width: 1, height: 1)
        expectingReturn = true
        present(vc, animated: true)
    }

    // MARK: Gezinme: dış bağlantılar Safari'de açılsın

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url, let scheme = url.scheme?.lowercased() else {
            decisionHandler(.allow)
            return
        }
        let isInternal = [AppSchemeHandler.scheme, "about", "data", "blob"].contains(scheme)
        if !isInternal && navigationAction.targetFrame?.isMainFrame != false {
            openExternal(url)
            decisionHandler(.cancel)
            return
        }
        decisionHandler(.allow)
    }

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                 for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = navigationAction.request.url, url.scheme?.hasPrefix("http") == true { openExternal(url) }
        return nil
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        webView.reload()
    }

    // MARK: alert / confirm / prompt (WKWebView bunları kendiliğinden göstermez)

    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let ac = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        ac.addAction(UIAlertAction(title: "Tamam", style: .default) { _ in completionHandler() })
        presentAlert(ac, fallback: completionHandler)
    }

    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let ac = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        ac.addAction(UIAlertAction(title: "İptal", style: .cancel) { _ in completionHandler(false) })
        ac.addAction(UIAlertAction(title: "Tamam", style: .default) { _ in completionHandler(true) })
        presentAlert(ac) { completionHandler(false) }
    }

    func webView(_ webView: WKWebView, runJavaScriptTextInputPanelWithPrompt prompt: String, defaultText: String?,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (String?) -> Void) {
        let ac = UIAlertController(title: nil, message: prompt, preferredStyle: .alert)
        ac.addTextField { $0.text = defaultText }
        ac.addAction(UIAlertAction(title: "İptal", style: .cancel) { _ in completionHandler(nil) })
        ac.addAction(UIAlertAction(title: "Tamam", style: .default) { _ in completionHandler(ac.textFields?.first?.text) })
        presentAlert(ac) { completionHandler(nil) }
    }

    private func presentAlert(_ ac: UIAlertController, fallback: @escaping () -> Void) {
        var top: UIViewController = self
        while let p = top.presentedViewController { top = p }
        if top is UIAlertController { fallback(); return }
        top.present(ac, animated: true)
    }
}
