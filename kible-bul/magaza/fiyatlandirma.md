# Kıble Bul — reklamsız üyelik fiyatlandırması

Özgün 1.0.1'de "Reklamsız üyelik" zaten gerçek bir Google Play aboneliğiydi (`@capgo/native-purchases`, ürün `adfree`,
temel planlar `monthly` / `yearly`); APK'daki öneri aylık **0,99 $**, yıllık **9,99 $** (`www/js/config.js ›
SUBSCRIPTION`). 1.1.0'da ürün ve planlar aynıdır. Fiyatlar uygulamada **yazılı değildir**: uygulama Play'in o ülkede
gösterdiği yerel fiyatı (`priceString`, ör. "₺39,99", "$0.99") gösterir, yıllık planın indirim yüzdesini de Play'in
tutarlarından hesaplar. 0,99 $ / 9,99 $ yalnız masaüstü tarayıcıdaki deneme taklidinde görünür; uygulamada mağaza fiyatı
gelmezse fiyat yerine "—" yazar ve satın alma düğmesi kapalı kalır.

**Fiyatları kullanıcı (sahip) Play Console'da onaylar; aşağıdaki değerler APK'daki önerilerdir.**

## Ürün ve planlar (Play Console › Para kazanma › Ürünler › Abonelikler)

| Alan | Değer |
|---|---|
| Ürün kimliği | **`adfree`** (sonradan değiştirilemez; kod `config.js › SUBSCRIPTION.productId`) |
| Ad (tr-TR) | Reklamsız Üyelik |
| Ad (en-US) | Ad-free membership |
| Avantajlar (isteğe bağlı) | tr: "Hiçbir ekranda reklam yok" · en: "No ads on any screen" |
| Temel plan 1 | **`monthly`** · Otomatik yenilenen · Faturalandırma dönemi **1 ay** · **0,99 USD** |
| Temel plan 2 | **`yearly`** · Otomatik yenilenen · Faturalandırma dönemi **1 yıl** · **9,99 USD** (12 × 0,99 = 11,88 $'a göre ≈ %16 indirim) |
| Teklif (deneme, giriş fiyatı) | **Yok** (bu turda). Eklenirse uygulama temel planın ilk teklifini gösterir ve onunla satın alır (`billing.js › getPlans`) |
| Ödemesiz dönem / hesap askısı | Play'in varsayılanları |
| Ülkeler | Tümü (uygulamanın yayınlandığı bütün ülkeler) |

Fiyat girerken: her temel planda "Fiyatları ayarla" → bütün ülkeleri seç → **USD** tutarını yaz → Play her ülkeye kendi
para birimindeki yuvarlanmış karşılığı dağıtır. Türkiye, Endonezya, Pakistan, Mısır gibi kullanıcı kitlesinin büyük
olabileceği ve alım gücünün düşük olduğu ülkelerde Play'in önerdiği yerel fiyat kullanılır; değiştirmek **sahibin
kararıdır** (bu turda dokunulmaz) [K].

## Gelir notu

- Google Play hizmet bedeli otomatik yenilenen aboneliklerde **%15**'tir (ABD, AEA, BK, Japonya ve Avustralya'da
  "%10 + %5 faturalandırma bedeli") [D]
  ([Play Console Yardım: Hizmet bedelleri](https://support.google.com/googleplay/android-developer/answer/112622)).
- Fiyatlar çoğu ülkede vergi dahildir; KDV/satış vergisini Play keser ve öder [K].
- Abonelik yönetimi ve iptal Play'dedir; uygulamadaki "Aboneliği yönet" düğmesi
  `https://play.google.com/store/account/subscriptions?sku=adfree&package=com.poyrazworkshop.kiblebul` adresini Play
  Store uygulamasında açar (`KibleYerelPlugin.java › abonelikleriYonet`).

## Uygulamanın davranışı (sınamalar: `test/odeme.test.mjs`, `test/reklam.test.mjs`)

- Açılışta önce Play'e sorulur (`getPurchases`, en çok 6 sn beklenir); etkin `adfree` varsa AdMob ve UMP **hiç
  başlatılmaz**. Uygulamayı yeniden kuran abone de reklam görmez.
- Satın alma `purchaseProduct({ productIdentifier: 'adfree', planIdentifier: 'monthly'|'yearly', productType: 'subs',
  offerToken })`; eklenti satın alımı onaylar (acknowledge). Bekleyen ödeme (ör. nakit) "Ödemeniz beklemede" der; Play
  ödemeyi tamamlayınca bir sonraki açılışta üyelik açılır ve satın alma `restorePurchases` ile onaylanır (Play,
  3 gün onaylanmayan satın almayı iade eder; 1.0.1 yalnız "Geri yükle"ye basılırsa onaylıyordu).
- Kullanıcı satın almayı iptal ederse "Satın alma iptal edildi" (1.0.1 bunu "tamamlanamadı" diye gösteriyordu); Play
  "zaten sahip" derse satın alma yerine geri yükleme yapılır.
- "Satın alımları geri yükle" Play'e yeniden sorar. Çevrimdışıyken son yanıt geçerlidir; üyeliği yalnız Play'in gerçek
  yanıtı kapatır.
