# 📐 Smart Measure (Google Play sürümü)

Poyraz Workshop'un ölçüm araçları uygulaması: su terazisi, ekran cetveli ve açıölçer, kamerayla mesafe / yükseklik /
genişlik, ses ölçer ve ışık ölçer. Kaynağı Drive'daki `KUCUK_UYGULAMALAR/SmartMeasure-0.1.0.apk`'dır (GeoTerva, yayınlanmamış
ilk sürüm; `KAYNAK.txt`). O APK yerel bir Kotlin + Jetpack Compose + CameraX uygulamasıydı ve R8 ile küçültülmüştü;
kaynak kod olmadığı için uygulama **aynı özellikler, akışlar ve metinlerle Capacitor 8 ile yeniden yazıldı** (derleme
adımı olmayan ES modülleri `www/`'de, telefona özgü işler küçük bir Java eklentisinde). Özgün uygulamanın 404 dizesi
(İngilizce + Türkçe) birebir korundu ve yeni ekranların belirtimi olarak kullanıldı; renk paletleri, araç renkleri,
64 Lucide simgesi ve eşikler APK'dan okundu.

| | Özgün (GeoTerva 0.1.0) | Bu klasör (Poyraz Workshop 1.0.0) |
|---|---|---|
| Paket | `com.geoterva.smartmeasure` (1000) | `com.poyrazworkshop.smartmeasure` (1) |
| Yığın | Kotlin, Compose, CameraX, DataStore | Capacitor 8 (WebView), Java eklentisi `Olcer` |
| Android | minSdk 26, targetSdk 36 | minSdk 24, compileSdk/targetSdk 36 |
| İzinler | CAMERA, RECORD_AUDIO, VIBRATE; internet yok | + INTERNET (yalnız AdMob ve Play Faturalandırma) |
| Para | yok ("Premium henüz sunulmuyor") | AdMob (banner + geçiş) + reklamsız abonelik `adfree` |
| Açık tema | "henüz geliştiriliyor" | tamamlandı (özgün açık palet, bütün ekranlar) |

## Özellik eşlemesi (özgün → yeniden yazım)

| Özgün | Burada | Dosya |
|---|---|---|
| Ana sayfa: araç kartları, canlı eğim, ışık, son ses düzeyi, menü (Ayarlar, Premium, Kalibrasyon merkezi, Doğruluk) | aynı | `www/js/views/home.js` |
| Tüm araçlar, Favoriler (yıldız), Geçmiş (yalnız telefonda, kopyala/paylaş, tümünü temizle, Bugün/Dün) | aynı | `views/tools.js`, `views/history.js` |
| AR Ölçüm: mesafe / yükseklik / genişlik, "yöntem B" (kameranın yönü + telefon yüksekliği, trigonometri), 8°/85° sınırı, telefon yüksekliği (0,5–2,2 m, ±1/±10 cm), fener, tam ekran, kopyala/paylaş, geçmişe kayıt, belirsizlik (±) | aynı; yön dönme vektöründen (oyun dönme vektörü, yoksa dönme vektörü), yoksa yalnız yerçekiminden eğim | `views/ar.js`, `olcum/ar.js` |
| Su terazisi: Yüzey / Çizgi / Dikey, derece / yüzde, tolerans ±0,1…2°, 0° (çizgide 0° ve 90°) titreşim ve ses, iki adımlı ters çevirme ve tek adımlı kalibrasyon (hareket, 5° düzlük, 3° kayma denetimleri), referans sıfır, yerçekimi sensörü yoksa ivmeölçer notu | aynı | `views/level.js`, `olcum/level.js` |
| Ekran cetveli: iki kılavuz, mm/cm/in, mesafe kilidi, kılavuzları sıfırla, değeri kopyala, tam ekran dikey cetvel, banka kartıyla kalibrasyon (±%15) | aynı; fiziksel piksel yoğunluğu eklentiden (`DisplayMetrics.xdpi/ydpi`) | `views/ruler.js`, `olcum/cetvel.js` |
| Açıölçer: iki kol, iç/dış açı, 0,5° adım, kilit, sıfırla, kopyala | aynı | `views/ruler.js` |
| Ses ölçer: A-ağırlıklı, F (125 ms), anlık/ortalama/en yüksek, kalibrasyonsuz dBFS(A), referans ölçerle kalibrasyon (20–140 dB, ≥5 sn, ofset 70–150), bantlar, NIOSH güvenlik notu, kırpma uyarısı, işlenmemiş kaynak notu | aynı; ölçüm telefonda `AudioRecord` ile (UNPROCESSED, yoksa VOICE_RECOGNITION), A-ağırlık süzgeci sayfada tasarlanıp eklentiye verilir | `views/sensors.js`, `olcum/ses.js`, `SesIsleyici.java`, `SesOlcer.java` |
| Işık ölçer: lux, düzey, ofis ve bitki yorumları, öneri | aynı (eşikler 25/125/350/750, 100/300/1000, 50/250/1000) | `views/sensors.js`, `olcum/isik.js` |
| Ayarlar: tema, dil, birimler, kalibrasyon merkezi, bu telefon (sensörler, kamera, flaş, mikrofon, ARCore, ekran), veriler ve gizlilik (tüm verileri sil), lisanslar, sürüm | aynı + reklam gizlilik seçenekleri (UMP), gizlilik politikası, geliştirici, iletişim, GeoTerva satırı | `views/settings.js` |
| Doğruluk ve kalibrasyon sayfası | aynı | `views/accuracy.js` |
| Premium: "henüz yok" | reklamsız abonelik (aylık / yıllık, fiyat Play'den, geri yükle, yönet) | `views/premium.js`, `billing.js`, `premium.js` |

**Bilerek değişenler:** gizlilik metni (internet ve reklam artık var: "kamera ve mikrofon yalnız telefonda işlenir;
internet yalnız AdMob ve Play için"); Premium metni; lisans metni (Capacitor ve eklentiler); "açık tema geliştiriliyor"
notu kaldırıldı; "Bu telefon" notu ARCore'un kullanılmadığını söylüyor. Yeni dizeler `pr_*`, `common_*`,
`cm_no_bearing`, `cm_camera_failed`, `cm_fullscreen_exit`, `cm_torch_off`, `lb_fav_*`, `lb_history_copy/share`,
`st_language_en/tr`, `st_ad_privacy`, `st_privacy_policy`, `st_developer`, `st_contact`.
**Eklenen:** kamera sonucunun önizleme üstünde gösterimi (tam ekranda da), genişlik kipinde dönme sensörü yoksa uyarı.
**Yapılamayan:** CameraX'in kamera seçimi ve yakınlaştırması yok (WebView `getUserMedia` arka kamerayı seçer); fener
WebView'in `torch` kısıtıyla çalışır, desteklemeyen telefonda düğme görünmez.

## Reklam kuralları (uzman kararı; `www/js/reklam.js` başında, `test/reklam.test.mjs`)

- Abonede AdMob SDK'sı hiç başlatılmaz (açılışta önce Play'e abonelik sorulur, en çok 4 sn).
- Önce UMP onayı; reklam yalnız `canRequestAds` ise; içerik derecesi en çok G.
- Banner: altta kendi şeridinde (sayfanın altına banner yüksekliği kadar boşluk), tam ekran kamerada ve tam ekran
  cetvelde gizli.
- Geçiş reklamı yalnız bir araçtan çıkarken; ölçüm, kalibrasyon, kamera ya da mikrofon açıkken asla; oturumun ilk
  3 dakikasında yok, en az 4 dakika arayla, saatte en çok 6; sayaçlar kalıcı. Açılış ve ödüllü reklam yok.
- Kimlikler `android/gradle.properties`'te (şimdilik Google'ın test kimlikleri); `araclar/kimlik.mjs` reklam birimi
  kimliklerini `www/js/reklam-kimlik.js`'e yazar. Hata ayıklama derlemesi her zaman test kimliklerini kullanır.

## Klasörler

```
smart-measure/
├── www/                     uygulama (derleme adımı yok)
│   ├── index.html, css/app.css, fonts/ (Manrope, OFL), img/
│   └── js/  app.js (kabuk, yönlendirme) · native.js (eklentiler ve tarayıcı yedekleri) · store.js · i18n.js · dom.js
│            icons.js (Lucide) · reklam.js · reklam-kimlik.js · billing.js · premium.js · tools.js
│            olcum/ (saf hesaplar: level, ar, ses, isik, cetvel, birim) · views/ (ekranlar) · lang/ (en, tr)
├── android/                 Capacitor projesi (npx cap add android, sonra özelleştirildi)
│   ├── gradle.properties    AdMob kimlikleri
│   └── app/src/main/java/com/poyrazworkshop/smartmeasure/
│       ├── MainActivity.java     eklentiyi kaydeder
│       ├── OlcerPlugin.java      sensörler, ses, ekran ölçüsü, izinler, pano, paylaşma, bağlantı, sistem çubukları
│       ├── SesOlcer.java         AudioRecord (ses kaydedilmez)
│       └── SesIsleyici.java      A-ağırlık + F zaman ağırlığı (Android'siz, JVM'de sınanır)
├── araclar/   kimlik.mjs · magaza-gorsel.mjs · sahte-cihaz.mjs · tarayici-dene.mjs · veri-guvenligi.mjs · png.mjs
├── magaza/    aciklamalar.md · diller/en-US.md · PLAY-YAYIN.md · DEGERLENDIRME.md · fiyatlandirma.md · surum-notu.txt
│              veri-guvenligi.csv · play/ (tr-TR) · play/en-US/
├── test/      olcum · reklam · abonelik · dil · ses-java · magaza (node:test, tarayıcısız)
├── KAYNAK.txt               APK'nın kimliği
└── play-istek.txt           Google Play API komutları (play-smartmeasure.yml)
```

Gizlilik politikası ve tanıtım sayfası `app/smart-measure/` altındadır (GitHub Pages, yalnız main'den):
`https://mahmuttari.github.io/Lispler/smart-measure/gizlilik.html`.

## Derleme ve deneme

```bash
cd smart-measure
npm ci
node araclar/kimlik.mjs && npx cap sync android     # reklam kimlikleri + www → android
cd android && echo "sdk.dir=$ANDROID_HOME" > local.properties
./gradlew assembleDebug                             # test reklamlı deneme APK'sı
./gradlew assembleRelease bundleRelease             # keystore.properties yoksa hata ayıklama anahtarıyla imzalanır (Play kabul etmez)
```

GitHub'da `.github/workflows/smartmeasure-android.yml` derler: APK her zaman (`SmartMeasure-apk`), yükleme anahtarı
secret'ı varsa imzalı AAB (`SmartMeasure-aab` + `surum.txt`).

- `node --test smart-measure/test/*.test.mjs` — ölçüm hesapları, reklam kuralları ve kimlikler, abonelik kimlikleri,
  dil dosyaları, Java ses işleyicisinin sayfayla birebir aynılığı (javac varsa), mağaza dosyaları (play-smartmeasure.yml
  her Play komutundan önce çalıştırır).
- `node smart-measure/araclar/tarayici-dene.mjs` — yerel tarayıcı denemesi (Playwright): iki dil × dört görünüm (TR açık
  390 px, EN koyu 340 px ve tersleri) × iki ortam (eklentisiz tarayıcı: "sensör yok" durumları; sahte telefon: canlı
  değerler), her ekranın alt sayfaları ve menüleriyle; konsol hatası, taşma, çevrilmemiş anahtar arar.
- `node smart-measure/araclar/magaza-gorsel.mjs [--android]` — mağaza görselleri (sentetik veri, çizilmiş kamera
  sahnesi) ve simgeler.

## Ad değişirse

Play'de aynı adda bir uygulama olduğu için ([`magaza/DEGERLENDIRME.md`](magaza/DEGERLENDIRME.md) §0) ad değişebilir.
Değişecek yerler (paket adı kalır): `magaza/aciklamalar.md` ve `diller/en-US.md` (Uygulama adı, metin), `magaza/PLAY-YAYIN.md`,
`android/app/src/main/res/values/strings.xml` (`app_name`, `title_activity_main`), `capacitor.config.json` (`appName`),
`www/index.html` (`<title>`), `www/js/views/home.js` ve `views/settings.js` (başlık satırı), dil dosyalarında adı geçen
dizeler (`st_acc_intro`, `st_premium_headline`, `pr_active_text`), `app/smart-measure/*.html`,
`araclar/magaza-gorsel.mjs` (tanıtım görseli) → görseller yeniden üretilir, testler (`magaza.test.mjs`) güncellenir.

## Google Play

İlk yayın: [`magaza/PLAY-YAYIN.md`](magaza/PLAY-YAYIN.md) ve dört uygulamanın ortak akışı
[`../docs/kucuk-uygulamalar-play.md`](../docs/kucuk-uygulamalar-play.md). Sonraki sürümler yalnız GitHub üzerinden:
`versionCode` +1 → push → `play-istek.txt`.

Lisanslar: Manrope (SIL OFL 1.1, `www/fonts/OFL-Manrope.txt`), Lucide simgeleri (ISC, `www/js/icons.js` başı),
Capacitor ve @capacitor-community/admob (MIT), @capgo/native-purchases (MPL-2.0), AndroidX (Apache 2.0).
