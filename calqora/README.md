# 🧮 Calqora (Google Play sürümü)

Poyraz Workshop'un bilimsel hesap makinesi: hesap (trigonometri, logaritma, kökler, toplam, türev, integral, denklem
çözme, kesir ve derece-dakika-saniye gösterimi), dört fonksiyona kadar grafik (kök, en küçük / en büyük değer,
kesişim), karmaşık sayılar, 5×5'e kadar matrisler, 15 kategoride 140 birim ve 46 bilimsel sabit; 11 dil (Arapça sağdan
sola), açık ve koyu tema.

Kaynak kod yoktu: Drive'daki **KUCUK_UYGULAMALAR/Calqora-1.0.0-1.apk**'nın (`com.geoterva.calqora` 1.0.0, ayrıntı
[`KAYNAK.txt`](KAYNAK.txt)) web kodu `www/`'ya alındı, Android projesi Capacitor 8 ile yeniden kuruldu. Özgün APK'dan
farklar:

| | 1.0.0 (`com.geoterva.calqora`) | 1.1.0 (`com.poyrazworkshop.calqora`, bu klasör) |
|---|---|---|
| Reklam | GeoTerva tam ekran ev reklamı: açılıştan 5 sn sonra ve her 3 dakikada bir, 10 sn kapatılamaz | Google AdMob: altta banner + yalnız doğal durakta geçiş reklamı (aşağıda). GeoTerva yalnız Hakkında'da düz bağlantı |
| AB onayı | — | UMP; Ayarlar › Reklam gizlilik seçenekleri (gerekiyorsa) |
| Abonelik | `adfree` (`monthly`, `yearly`), yönet: Play'in genel abonelik sayfası | Aynı ürün; yönet: `…/subscriptions?sku=adfree&package=…`; uygulamada fiyat yalnız mağazadan |
| İzinler | `ACCESS_NETWORK_STATE`, `BILLING` (INTERNET yoktu) | + `INTERNET`, AdMob'un `AD_ID` ve reklam hizmetleri izinleri |
| Hakkında | yalnız sürüm ve açıklama | + geliştirici, e-posta, gizlilik politikası, GeoTerva |
| Derleme | R8 ile küçültülmüş | Küçültmesiz (Hayalet Avcıları gibi; AdMob eklentisiyle R8 denenmedi) |
| Adlar | `bilimsel-hesap.*` localStorage anahtarları, `bh_*` renkler | `calqora.*`, `calqora_*` (yeni kurulum: taşıma gerekmez) |

Düzeltilen hatalar (1.0.0'da vardı): birim sekmesinin durumu (kategori, birim, değer) kaydediliyor ama açılışta
okunmuyordu; ondalık virgül seçiliyken tuş takımındaki ondalık tuşu "." ve `2nd` ayraç tuşu "," gösterip "," ve ";"
yazıyordu; mağazadan fiyat gelmediğinde üyelik ekranı uydurma "$0.99" fiyatla satın almaya izin veriyordu; Arapçada
"+ f(x)" düğmesi "f(x) +" görünüyordu. Abonelikte (`billing.js › purchaseError`, `premium.js`): kullanıcı satın almadan
vazgeçince eklentinin `USER_CANCELED` kodu okunmadığı için "Satın alma tamamlanamadı" deniyordu; bekleyen ödeme
`purchaseState '0'` sanılıyordu (Android'de bekleyen 2'dir ve eklenti onu "Purchase is pending" ile reddeder); aynı
hesapla zaten alınmış abonelikte (`ITEM_ALREADY_OWNED`) satın alma başarısız sayılıyordu (artık geri yüklenir); sonradan
tamamlanan bekleyen ödeme onaylanmıyordu (Play 3 gün içinde onaylanmayan satın almayı iade eder; artık açılışta onaylanır).

## Reklam kuralları

`www/js/reklam.js` başlığında yazılıdır (uzman kararı; değerlendirme [`magaza/DEGERLENDIRME.md`](magaza/DEGERLENDIRME.md)):

- **Reklamsız üye:** AdMob SDK'sı **hiç başlatılmaz**, UMP de sorulmaz. Reklamlar ancak Google Play "üye değil" dedikten
  sonra başlar (`premium.js`).
- **Önce UMP:** `requestConsentInfo` → gerekiyorsa `showConsentForm` → yalnız `canRequestAds` ise `initialize`
  (`maxAdContentRating: 'General'`).
- **Banner:** altta uyarlanabilir sabit banner, kendi şeridinde (`--ad-h`, `css/app.css`): sayfa, açılan sayfalar ve
  bildirim balonu banner'ın üstünde biter; yazılım klavyesi açıkken banner gizlenir.
- **Geçiş reklamı:** yalnız Grafik, Matris ya da Birim ekranından ayrılırken ve Ayarlar kapanırken; ilk 3 dakikada yok,
  iki reklam arası en az 4 dakika, saatte en çok 6 (sayaç kalıcı); yazarken, sayı tuş takımı/klavye açıkken, bir sayfa
  açıkken asla. Sabit "Hesaba ekle" ile Hesap'a geçiş durak sayılmaz. Açılış ve ödüllü reklam yok.
- Kimlikler tek yerde: `android/gradle.properties` → `node araclar/kimlik.mjs` → `www/js/reklam-kimlik.js` (ikisi de
  depoda; test eşleşmeyi denetler). Şimdilik Google'ın **test** kimlikleri; gerçekleri AdMob'da oluşturulunca yazılır
  ([`magaza/PLAY-YAYIN.md`](magaza/PLAY-YAYIN.md) adım 1). Hata ayıklama derlemesi her zaman test kimliği kullanır.
- Masaüstü tarayıcıda eklenti yoktur: her şey sessizce devre dışı kalır, abonelik bir taklitle denenir.

## Klasörler

```
calqora/
├── package.json, package-lock.json   Capacitor 8.5.3 + @capacitor/app, @capacitor/browser, @capgo/native-purchases 8.9.6
│                                     (özgündekiler) + @capacitor-community/admob 8.2.1; sürümler sabit
├── capacitor.config.json             appId, SystemBars "native" kenar boşlukları (özgündeki gibi)
├── www/                              web uygulaması (ES modülleri, derleme adımı yok)
│   ├── js/config.js                  uygulama bilgisi (sürüm, geliştirici, adresler) ve abonelik kimlikleri
│   ├── js/reklam.js, reklam-kimlik.js AdMob + UMP, kurallar; kimlikler (üretilir)
│   ├── js/premium.js, billing.js     reklamsız üyelik (Google Play Faturalandırma)
│   └── js/lang/<dil>.js              11 dil
├── android/                          Capacitor projesi (compileSdk/targetSdk 36, minSdk 24, AGP 8.13, Gradle 8.14.3)
│   ├── gradle.properties             AdMob kimlikleri (TEK KAYNAK)
│   └── app/src/main/                 MainActivity (özgündeki gibi: açılış ekranı, kenardan kenara, WebView sıkılaştırma),
│                                     özgün simge katmanları ve açılış simgesi
├── araclar/
│   ├── kimlik.mjs                    gradle.properties → www/js/reklam-kimlik.js
│   ├── veri-guvenligi.mjs            Play Veri güvenliği CSV'si (magaza/aciklamalar.md tablosuyla)
│   ├── magaza-gorsel.mjs             mağaza görselleri, 11 dil (Playwright)
│   ├── tarayici-dene.mjs             tarayıcı denemesi: 11 dil, taşma, çevrilmemiş anahtar, sahte eklentilerle reklam ve abonelik
│   └── sunucu.mjs                    www/ için küçük yerel sunucu
├── magaza/                           aciklamalar.md, diller/, PLAY-YAYIN.md, DEGERLENDIRME.md, fiyatlandirma.md,
│                                     surum-notu.txt, veri-guvenligi.csv, play/
├── test/                             node:test (tarayıcısız): reklam kuralları ve kimlikler, üye akışı, tutarlılık, mağaza
├── KAYNAK.txt                        APK'nın Drive kimliği, SHA-256'sı, özgün paket ve sertifika
└── play-istek.txt                    Google Play API komutları (play-calqora.yml)
```

Gizlilik politikası ve tanıtım sayfası `app/calqora/` altındadır (GitHub Pages, yalnız main'den):
`https://mahmuttari.github.io/Lispler/calqora/gizlilik.html`.

## Derleme ve deneme

```bash
cd calqora
npm ci
node araclar/kimlik.mjs                # gradle.properties değiştiyse
npx cap sync android                   # www/ → android/app/src/main/assets/public (depoya alınmaz)
cd android
./gradlew assembleDebug                # test reklamlı deneme APK'sı
./gradlew assembleRelease bundleRelease  # keystore.properties yoksa hata ayıklama anahtarıyla imzalanır (Play kabul etmez)
```

`android/local.properties` (`sdk.dir=…`) ve `android/keystore.properties` depoya alınmaz. GitHub'da her değişiklikte
`.github/workflows/calqora-android.yml` derler: APK her zaman (`Calqora-apk`), yükleme anahtarı secret'ı varsa imzalı AAB
(`Calqora-aab` + `surum.txt`).

Testler: `node --test calqora/test/*.test.mjs` (CI'da `play-calqora.yml` her Play komutundan önce çalıştırır).
Yerelde ayrıca `node calqora/araclar/tarayici-dene.mjs` (Playwright + Chromium): 11 dil, TR açık 390 px ve AR koyu
340 px, konsol hatası / yatay taşma / çevrilmemiş anahtar yok; sahte AdMob ve Play eklentileriyle reklam ve abonelik akışı.
Mağaza görselleri: `node calqora/araclar/magaza-gorsel.mjs [play-dili…]`.

## Google Play

İlk yayın: [`magaza/PLAY-YAYIN.md`](magaza/PLAY-YAYIN.md). Sonraki sürümler yalnız GitHub üzerinden: `versionCode` +1,
`versionName` üç yerde (build.gradle, package.json, `www/js/config.js`) → push → `play-istek.txt`.
