import Foundation
import StoreKit
import UIKit

/// App Store aylık "Pro" aboneliği (StoreKit 2). Fiyat App Store Connect'te ülke ülke ayarlanır;
/// uygulama mağazanın verdiği yerel fiyat metnini gösterir.
@MainActor
final class StoreManager {
    static let shared = StoreManager()
    static let productID = "notdefteri.pro.aylik"
    private static let cacheKey = "isPro"

    private(set) var product: Product?
    // İnternet yokken de Pro reklamsız açılsın diye son bilinen durum saklanır
    private(set) var isPro: Bool = UserDefaults.standard.bool(forKey: StoreManager.cacheKey)
    var onProChanged: ((Bool) -> Void)?

    private var updatesTask: Task<Void, Never>?
    private var started = false

    func start() async {
        guard !started else { return }
        started = true
        updatesTask = Task { [weak self] in
            for await result in Transaction.updates {
                if case .verified(let transaction) = result { await transaction.finish() }
                await self?.refresh()
            }
        }
        await loadProduct()
        await refresh()
    }

    private func loadProduct() async {
        if product != nil { return }
        product = try? await Product.products(for: [Self.productID]).first
    }

    /// Geçerli abonelik var mı? (iptal edilmiş/süresi dolmuşlar sayılmaz)
    func refresh() async {
        var pro = false
        for await result in Transaction.currentEntitlements {
            if case .verified(let t) = result, t.productID == Self.productID, t.revocationDate == nil {
                pro = true
            }
        }
        setPro(pro)
    }

    private func setPro(_ pro: Bool) {
        let changed = pro != isPro
        isPro = pro
        UserDefaults.standard.set(pro, forKey: Self.cacheKey)
        if changed { onProChanged?(pro) }
    }

    func info() async -> [String: Any] {
        await loadProduct()
        var r: [String: Any] = ["isPro": isPro, "available": product != nil]
        if let p = product { r["price"] = p.displayPrice }
        return r
    }

    func buy() async -> [String: Any] {
        await loadProduct()
        guard let product else {
            return ["error": "Abonelik şu an kullanılamıyor. App Store'a giriş yaptığınızdan emin olun."]
        }
        do {
            let result = try await product.purchase()
            switch result {
            case .success(let verification):
                guard case .verified(let transaction) = verification else {
                    return ["error": "Satın alma doğrulanamadı."]
                }
                await transaction.finish()
                await refresh()
                return ["isPro": isPro]
            case .pending:
                return ["pending": true]
            case .userCancelled:
                return ["cancelled": true]
            @unknown default:
                return ["cancelled": true]
            }
        } catch {
            return ["error": error.localizedDescription]
        }
    }

    /// "Satın alımları geri yükle" (Apple bunu zorunlu tutar)
    func restore() async -> [String: Any] {
        try? await AppStore.sync()
        await refresh()
        return ["isPro": isPro]
    }

    func showManageSubscriptions(in scene: UIWindowScene?) {
        Task {
            if let scene {
                try? await AppStore.showManageSubscriptions(in: scene)
            } else if let url = URL(string: "https://apps.apple.com/account/subscriptions") {
                await UIApplication.shared.open(url)
            }
        }
    }
}
