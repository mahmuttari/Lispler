# 🧭 Kıble Bul / Qibla Finder (Google Play sürümü)

Bulunduğun yerden Mekke'deki Kâbe'nin yönünü pusula, harita ve mesafeyle gösteren Android uygulaması (Poyraz Workshop).
Gerçek kuzey düzeltmesi (Dünya Manyetik Modeli 2025), doğruluk göstergesi ve parazit uyarısı, kalibrasyon yardımcısı;
NASA uydu görüntüsünde Kâbe'ye en kısa yol; yaklaşık 34.000 şehirde internetsiz arama ve koordinat girişi; 11 dil
(Arapça sağdan sola). Web kodu (`www/`) **Capacitor 8** ile paketlenir; pusula yerel bir eklentiden okunur.

| | |
|---|---|
| Paket | `com.poyrazworkshop.kiblebul` (Play anahtarı `kiblebul`, `android/play.mjs`) |
| Sürüm | 1.1.0 (versionCode 1) — Poyraz Workshop'taki ilk sürüm |
| Diller | tr, en, de, fr, es, pt, it, ru, ja, ko, ar (uygulama ve mağaza; telefondaki ad dile göre: Kıble Bul, Qibla Finder, اتجاه القبلة…) |
| Reklam | AdMob, yalnız Android uygulaması — aşağıda "Reklam kuralları" |
| Abonelik | "Reklamsız Üyelik": ürün `adfree`, temel planlar `monthly` / `yearly` ([`magaza/fiyatlandirma.md`](magaza/fiyatlandirma.md)) |
| Play'e yayın | [`magaza/PLAY-YAYIN.md`](magaza/PLAY-YAYIN.md) (ortak akış [`../docs/kucuk-uygulamalar-play.md`](../docs/kucuk-uygulamalar-play.md)) |
| Değerlendirme | [`magaza/DEGERLENDIRME.md`](magaza/DEGERLENDIRME.md) (rakipler, riskler, birim ekonomi) |
| Gizlilik politikası | `app/kible-bul/` → `https://mahmuttari.github.io/Lispler/kible-bul/gizlilik.html` (yalnız main'den) |

## Reklam kuralları (uzman kararı; ayrıntı `www/js/reklam.js`'in başında, sınama `test/reklam.test.mjs`)

- **Reklamsız üye:** AdMob ve UMP hiç başlatılmaz. Açılışta önce Google Play'e sorulur (en çok 6 sn).
- **Önce UMP** (AB/BK/İsviçre onayı), yalnız izin varsa `initialize({ maxAdContentRating: 'General' })`. Gerekirse
  Ayarlar'da "Reklam gizlilik seçenekleri" satırı çıkar. AdMob panelinde kumar, alkol, flört gibi hassas kategoriler
  engellenir (`PLAY-YAYIN.md` adım 1).
- **Banner:** uyarlanabilir, ekranın altında **kendi şeridinde** (`#reklam-serit`, `--reklam-h`): sekme çubuğundan 6 px
  ayrı, hiçbir düğmenin ya da alt sayfanın üstüne binmez; karşılamada, kalibrasyonda ve klavye açıkken gizli.
- **Geçiş reklamı** yalnız doğal durakta: yer araması tamamlanıp pusulaya dönülürken ya da haritaya en az 8 sn bakılıp
  çıkılırken. İlk 3 dakikada yok, en az 4 dakika ara, saatte en çok 6 (sayaçlar kalıcı). Pusula ve kalibrasyon sırasında,
  alt sayfa açıkken, yazarken asla; reklam açıkken pusula algılayıcısı durur. Açılış ve ödüllü reklam yok.
- Kimlikler `android/gradle.properties`'te (tek kaynak; şimdilik Google'ın **test** kimlikleri). `node
  kible-bul/araclar/kimlik.mjs` birim kimliklerini `www/js/reklam-kimlik.js`'e yazar; manifest'teki uygulama kimliği
  `manifestPlaceholders`'tan gelir. Hata ayıklama derlemesi her zaman test kimliği ve test reklamı kullanır.

## Klasörler

```
kible-bul/
├── www/                         uygulamanın web kodu (özgün APK'dan; değişenler aşağıda)
│   ├── js/reklam.js             AdMob + UMP, reklam kuralları
│   ├── js/reklam-kimlik.js      OTOMATİK (araclar/kimlik.mjs)
│   ├── js/billing.js, premium.js, ui-premium.js   Play aboneliği (@capgo/native-purchases)
│   ├── js/compass.js            yerel pusula eklentisi, yoksa tarayıcının yön olayları
│   └── data/                    şehirler (GeoNames) ve 10 dilde adları, ülke sınırları (Natural Earth)
├── android/                     Capacitor 8 projesi (`npx cap add android` + özelleştirme)
│   ├── gradle.properties        AdMob kimlikleri
│   └── app/src/main/java/com/poyrazworkshop/kiblebul/
│       ├── MainActivity.java    açılış ekranı, kenardan kenara, sıkılaştırılmış WebView, eklenti kaydı
│       ├── CompassPlugin.java   yerel pusula ("Compass": start/stop, "reading" { r, acc, rotAcc, field })
│       └── KibleYerelPlugin.java  derleme türü, Play abonelik yönetim sayfası (sku=adfree)
├── araclar/
│   ├── kimlik.mjs               gradle.properties → www/js/reklam-kimlik.js (`--denetle`)
│   ├── veri-guvenligi.mjs       Play Veri güvenliği CSV'si (magaza/aciklamalar.md tablosuyla)
│   ├── magaza-gorsel.mjs        mağaza görselleri, 11 dil (Playwright)
│   ├── tarayici-dene.mjs        tarayıcıda duman sınaması (yalnız yerelde)
│   └── ortak.mjs                ikisinin ortak parçaları (sunucu, NASA karo önbelleği, Capacitor taklidi)
├── magaza/                      aciklamalar.md, diller/ (10 dil), PLAY-YAYIN.md, DEGERLENDIRME.md, fiyatlandirma.md,
│                                surum-notu.txt, veri-guvenligi.csv, play/ (görseller, dil klasörleri)
├── test/                        node:test (CI): kible, reklam, odeme, magaza
├── KAYNAK.txt                   özgün APK (Drive kimliği, SHA-256, sertifika)
└── play-istek.txt               Google Play API komutları (play-kiblebul.yml)
```

## Derleme

```bash
cd kible-bul
npm ci                                   # Capacitor 8.5.3 ve eklentiler (sürümler sabit)
node araclar/kimlik.mjs                  # reklam birimi kimlikleri gradle.properties'ten
npx cap sync android                     # www/ → android/app/src/main/assets/public
cd android                               # local.properties: sdk.dir=…; JDK 21
./gradlew assembleDebug                  # test reklamlı deneme APK'sı
./gradlew assembleRelease bundleRelease  # keystore.properties yoksa hata ayıklama anahtarıyla imzalanır (Play kabul etmez)
```

İmza: `android/keystore.properties` (`storeFile`, `storePassword`, `keyAlias`, `keyPassword`; depoya girmez) varsa
`upload` imzası. CI'da Poyraz Workshop'un ortak yükleme anahtarı kullanılır (`PLAY-YAYIN.md` tablosu).

Sınamalar: `node --test kible-bul/test/*.test.mjs` (kıble ve WMM hesapları NOAA'nın resmî değerleriyle, 11 dilin
anahtarları, yerel pusula arayüzü, reklam kuralları ve çağrı sırası, abonelik hataları, mağaza metni ve görselleri,
Veri güvenliği CSV'si). Tarayıcıda: `node kible-bul/araclar/tarayici-dene.mjs [--ekran]` (11 dil 360 px, TR açık 390 px,
AR koyu 340 px; konsol hatası, yatay taşma, çevrilmemiş anahtar; "uygulama kipi"nde banner şeridi ve reklam kuralları).

## Kaynak ve özgünden farklar

Kaynak, elimizdeki tek kopya olan `KibleBul-1.0.1.apk`'dır (`com.geoterva.kiblebul`, GeoTerva; [`KAYNAK.txt`](KAYNAK.txt)).
`assets/public` → `www/` (Capacitor'ın kendi ürettiği `cordova*.js` ve GeoTerva reklam görseli hariç); simgeler ve
açılış simgesi aynen. Yerel pusula eklentisi ve MainActivity dex'ten okunup Java'da birebir yeniden yazıldı (algılayıcı
türleri, SENSOR_DELAY_GAME, 33 ms, doğruluk olayları; sapma ve süzme sayfada). Android projesi `npx cap add android`
ile üretildi; tema, izinler (yalnız yaklaşık konum), dikey yön, `allowBackup=false`, `usesCleartextTraffic=false`
özgündeki gibi.

| | Özgün 1.0.1 | 1.1.0 (bu klasör) |
|---|---|---|
| Paket, imza | `com.geoterva.kiblebul`, GeoTerva anahtarı | `com.poyrazworkshop.kiblebul`, Poyraz Workshop yükleme anahtarı |
| Reklam | GeoTerva'nın kendi tam ekran görseli, oturumda bir kez, açılıştan 30 sn sonra, 10 sn kapatılamaz | AdMob: altta ayrı şeritte banner + doğal durakta seyrek geçiş reklamı; GeoTerva reklamı, görseli ve zamanlayıcısı kaldırıldı |
| Hakkında | sürüm, gizlilik metni, geoterva.com düğmesi | + geliştirici Poyraz Workshop, e-posta, gizlilik politikası bağlantısı; GeoTerva yalnız düz bir bağlantı satırı |
| Gizlilik metni (11 dil) | "ağ kullanımı yalnızca harita" | AdMob, UMP, NASA karolarının bölgeyi gösterdiği, Play aboneliği; karşılama kartında "konumunuzu kimseye iletmez" |
| Ayarlar | — | gerekiyorsa "Reklam gizlilik seçenekleri" |
| Abonelik yönetimi | Play'in genel abonelik listesi | bu ürünün sayfası (`sku=adfree&package=…`), Play Store uygulamasında |
| Fiyat | mağaza fiyatı gelmezse $0.99/$9.99 yazıyordu | uygulamada yalnız mağaza fiyatı; gelmezse "—" ve düğme kapalı (yedek fiyat yalnız tarayıcı taklidinde) |

## 1.1.0'da düzeltilen hatalar

- **Satın alma iptali "tamamlanamadı" görünüyordu:** eklenti iptali `code: USER_CANCELED`, mesaj "Purchase is not
  purchased" ile bildirir; 1.0.1 yalnız mesaja bakıyordu. Bekleyen ödeme de hiç tanınmıyordu (`purchaseState '0'`
  "bekliyor" sayılıyordu; Play'de bekleyen 2'dir, eklenti zaten "Purchase is pending" diye reddeder). "Zaten sahip"
  (ITEM_ALREADY_OWNED) artık geri yükleme yapar. (`billing.js › purchaseError`, `test/odeme.test.mjs`)
- **Sonradan tamamlanan ödeme onaylanmıyordu:** bekleyen bir ödeme uygulama kapalıyken tamamlanırsa satın alma ancak
  "Geri yükle"ye basılınca onaylanıyordu; Play 3 günde onaylanmayanı iade eder. Açılıştaki sorgu artık onaylar.
- **Haritada ülke adları üst üste:** yakınlaştırma 0,25 adımla değişirken ad sayısı yalnız tam sayı düzeylerde
  sınırlanıyordu (3,5 düzeyinde ~200 ad birden). Artık düzeye göre sınır + çakışan ad gizlenir.
- **Uzun başlık taşıyordu:** "Направление на Киблу", "Dirección de la Qibla" gibi başlıklar dar telefonda iki satıra
  bölünüp çubuğun dışına çıkıyordu; uzun başlık küçük yazılır.
- Tarayıcıda (geliştirme) ilk dokunuştan önce titreşim isteği konsol hatası veriyordu; artık istenmez.
- `wmm.js` açıklamasındaki örnek sapma (Cakarta "−4°") yanlıştı (gerçekte ≈ +0,7°); düzeltildi.
