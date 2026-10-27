# Unitica — reklamsız üyelik fiyatlandırması

Özgün 1.3.1'de "Reklamsız üyelik" ekranı aylık **0,99 $** ve yıllık **9,99 $** gösteriyor ama "Yakında" diyordu
(`js/plans.js`, ödeme bağlı değildi). 1.4.0'da bu ekran gerçek bir Google Play aboneliğidir (`www/js/billing.js`,
`@capgo/native-purchases`). Fiyatlar uygulamanın kodunda **yazılı değildir**: uygulama Play'in o ülkede gösterdiği
yerel fiyatı (`priceString`, ör. "₺34,99", "$0.99") gösterir ve yıllık planın indirim yüzdesini de Play'in tutarlarından
hesaplar. `www/js/config.js`'teki 0,99 $ / 9,99 $ yalnız masaüstü tarayıcıdaki deneme taklidinde görünür.

**Fiyatları kullanıcı (sahip) Play Console'da onaylar; aşağıdaki değerler APK'daki önerilerdir.**

## Ürün ve planlar (Play Console › Para kazanma › Ürünler › Abonelikler)

| Alan | Değer |
|---|---|
| Ürün kimliği | **`adfree`** (sonradan değiştirilemez; kod `config.js › SUBSCRIPTION.productId`) |
| Ad (tr-TR) | Reklamsız üyelik |
| Ad (en-US) | Ad-free membership |
| Avantajlar (isteğe bağlı) | tr: "Hiçbir yerde reklam yok" · en: "No ads anywhere" |
| Temel plan 1 | **`monthly`** · Otomatik yenilenen · Faturalandırma dönemi **1 ay** · **0,99 USD** |
| Temel plan 2 | **`yearly`** · Otomatik yenilenen · Faturalandırma dönemi **1 yıl** · **9,99 USD** (12 × 0,99 = 11,88 $'a göre ≈ %16 indirim) |
| Teklif (deneme, giriş fiyatı) | **Yok** (bu turda). Eklenirse uygulama yine temel teklifin fiyatını gösterir ve onunla satın alır: teklif kullanılmak istenirse `billing.js › getPlans` güncellenir |
| Ödemesiz dönem / hesap askısı | Play'in varsayılanları |
| Ülkeler | Tümü (uygulamanın yayınlandığı bütün ülkeler) |

Fiyat girerken: her temel planda "Fiyatları ayarla" → bütün ülkeleri seç → **USD** tutarını yaz → Play her ülkeye kendi
para birimindeki yuvarlanmış karşılığı dağıtır. Türkiye gibi düşük alım gücü olan ülkelerde Play'in önerdiği yerel fiyat
kullanıcıya gösterilir; değiştirmek **sahibin kararıdır** (bu turda dokunulmaz) [K].

## Gelir notu

- Google Play hizmet bedeli otomatik yenilenen aboneliklerde **%15**'tir (geliştiricinin yıllık geliri ne olursa olsun;
  ABD, AB/AEA, BK, Japonya ve Avustralya'da "%10 + %5 faturalandırma bedeli") [D]
  ([Play Console Yardım: Hizmet bedelleri](https://support.google.com/googleplay/android-developer/answer/112622)).
- Fiyatlar çoğu ülkede vergi dahildir; KDV/satış vergisini Play keser ve öder [K].
- Abonelik yönetimi ve iptal Play'dedir; uygulamadaki "Aboneliği yönet" düğmesi
  `https://play.google.com/store/account/subscriptions?sku=adfree&package=com.poyrazworkshop.unitica` adresini açar.

## Uygulamanın davranışı (sınamalar: `test/uygulama.test.mjs`, `araclar/tarayici-dene.mjs` C5-C6)

- Açılışta önce Play'e sorulur (`getPurchases`); etkin `adfree` varsa AdMob **hiç başlatılmaz**.
- Satın alma `purchaseProduct({ productIdentifier: 'adfree', planIdentifier: 'monthly'|'yearly', productType: 'subs',
  offerToken })`; eklenti satın alımı onaylar (acknowledge). Bekleyen ödeme (ör. nakit) onaylanınca bir sonraki açılışta
  `restorePurchases` ile onaylanır ve reklamlar kalkar.
- "Satın alımı geri yükle" Play'e yeniden sorar. Çevrimdışıyken son yanıt geçerlidir; üyeliği yalnız Play'in gerçek
  yanıtı kapatır.
