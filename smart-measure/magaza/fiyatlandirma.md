# Ölçü Kutusu (Measure Box) — reklamsız abonelik fiyatlandırması

Özgün Smart Measure 0.1.0'da Premium ekranı "henüz sunulmuyor" diyordu; bu sürümde Premium **reklamsız abonelik**tir.
Fiyatlar uygulamanın kodunda değil, **Google Play Console**'da ayarlanır. Uygulama mağazanın verdiği yerel fiyat metnini
(`priceString`, ör. "₺39,99", "$0.99") olduğu gibi gösterir; Play'den fiyat gelmezse fiyat yazmaz ve "Abone ol" düğmesi
çıkmaz (yedek "$0.99 / $9.99" metni yalnız masaüstü tarayıcı taklidindedir, `www/js/billing.js`). Yıllık planın
üstündeki "%N tasarruf" etiketi de mağazanın iki fiyatından hesaplanır (`www/js/views/premium.js`).

| Alan | Değer |
|---|---|
| Ürün kimliği (abonelik) | `adfree` — kodda `www/js/billing.js › SUBSCRIPTION.productId`; değiştirilemez |
| Temel planlar | `monthly` (1 ay, otomatik yenilenir) · `yearly` (1 yıl, otomatik yenilenir) |
| Fiyat (öbür üç uygulamadaki gibi) | **0,99 $ / ay**, **9,99 $ / yıl** (12 aylıkla karşılaştırınca %16 ucuz). Sahip Play Console'da onaylar |
| Ne verir | Bütün reklamlar kalkar: banner, geçiş reklamı; reklam SDK'sı (AdMob, UMP) hiç başlatılmaz. Araçlar ücretsiz sürümle aynıdır |
| Deneme süresi, tanıtım fiyatı | Yok (sonra eklenirse uygulama değişmeden çalışır: teklif belirteci mağazadan gelir, temel teklif öne alınır) |
| Aboneliği yönet | `https://play.google.com/store/account/subscriptions?sku=adfree&package=com.poyrazworkshop.smartmeasure` (Play Store uygulamasında açılır) |
| Geri yükleme | Premium ekranında "Satın alımları geri yükle"; uygulama her açılışta ve öne gelişte Play'e sorar |
| Play hizmet bedeli | Otomatik yenilenen aboneliklerde %15 ([Play Console Yardım](https://support.google.com/googleplay/android-developer/answer/112622)) [D] |

## Google Play Console'da (uygulama oluşturulup ilk AAB yüklendikten sonra)

1. Ölçü Kutusu → **Para kazanma › Ürünler › Abonelikler › Abonelik oluştur**: ürün kimliği `adfree`, ad
   "Reklamsız" (İngilizce "Ad-free").
2. Avantajlar (isteğe bağlı, kısa): "Reklam yok" / "No ads".
3. **Temel plan ekle**: kimlik `monthly`, tür **Otomatik yenilenen**, faturalandırma dönemi **1 ay**, ek süre ve
   yeniden abone olma varsayılan → fiyat: tüm ülkeler seçili, **0,99 USD** → "Döviz kurlarına göre güncelle" (Play yerel
   fiyatları kendisi önerir) → **Etkinleştir**.
4. **Temel plan ekle**: kimlik `yearly`, **1 yıl**, **9,99 USD** → aynı adımlar → **Etkinleştir**.
5. Abonelik yayınlanınca (birkaç dakika) Premium ekranı iki planı yerel fiyatla gösterir. Denemek için Play Console ›
   Lisans testi'ne bir test hesabı eklenir (test satın almaları ücretlendirilmez).

Kimlikler (`adfree`, `monthly`, `yearly`) kodla birebir aynı olmalıdır; `test/abonelik.test.mjs` denetler. Fiyat
değişikliği yalnız Console'dan yapılır, uygulama güncellemesi gerekmez.
