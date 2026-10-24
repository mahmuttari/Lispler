# 📡 İz Haritası (Google Play sürümü)

Poyraz Workshop'un üçüncü uygulaması. Yakındaki AirTag ve Find My izleyicilerini Bluetooth ile dinler, sinyal gücünü
telefonun konumuyla birleştirip yerini haritada kestirir. Her izleyicinin ne zaman ve nerede görüldüğünü saklar,
seninle dolaşan yabancı bir izleyiciye karşı uyarır ve GeoJSON/KML/CSV dışa aktarır.

Kaynağı **GENEL-KONULAR/airtag-harita**'daki AirTag Harita'dır (web arayüzü, çekirdek hesaplar, testler orada). Bu
klasör onun Google Play'e uyarlanmış Android projesidir. Fark yalnızca şunlardır:

| | AirTag Harita (GENEL-KONULAR) | İz Haritası (bu klasör) |
|---|---|---|
| Paket | `com.marfen.airtagharita` | `com.poyrazworkshop.izharitasi` |
| Dağıtım | elle kurulan APK (`android/derle.sh`) | Google Play (Poyraz Workshop) |
| Derleme | Gradle'sız (aapt2, javac, d8) | Gradle + AGP 8.13, R8 ile küçültme |
| Reklam | yok | AdMob: altta banner, dışa aktarımdan sonra geçiş reklamı (`Reklam.java`) |
| AB onayı | — | UMP SDK; Ayarlar › 🔒 Reklam gizlilik seçenekleri |
| Ad | AirTag Harita | İz Haritası (mağazada "İz Haritası – AirTag için") |

## Reklam kuralları (kullanıcının kararı)

- **Banner:** sayfanın altında ayrı bir şerit (uyarlanabilir sabit banner); sayfanın üstüne binmez, klavye açılınca gizlenir.
- **Geçiş reklamı:** yalnız bir dışa aktarım bittikten sonra, en sık **3 dakikada bir**. Tarama sürerken, 🎯 Bul
  ekranında ve takip uyarısı varken **asla**. Sayfa tarafı `js/uygulama.js › reklamFirsati` (GENEL-KONULAR; tarayıcı
  testi G), Java tarafı `Reklam.gecisFirsati` (3 dakika ve tarama denetimi).
- Kimlikler `android/gradle.properties`'te; şimdilik Google'ın **test** kimlikleri. Gerçekleri AdMob'da oluşturulunca
  yazılır (`magaza/PLAY-YAYIN.md` adım 1). Test kimlikli paket Play'e yüklenmez (`play-iz.yml` reddeder).

## Klasörler

```
iz-haritasi/
├── android/                  Gradle projesi (AGP 8.13.2, Gradle 8.14.3, compileSdk/targetSdk 36, minSdk 24)
│   ├── gradle.properties     AdMob kimlikleri
│   └── app/src/main/
│       ├── assets/www/index.html   web arayüzünün tek dosyalık derlemesi (esitle.mjs yazar, elle düzenlenmez)
│       └── java/com/poyrazworkshop/izharitasi/
│           ├── AnaEtkinlik.java    WebView, izinler, kenardan kenara düzen, reklam şeridi
│           ├── YerelKopru.java     sayfaya "AirTagYerel" köprüsü (Bluetooth, dosya kaydetme, reklam kancaları)
│           ├── GattIsi.java        ses çaldırma ve ürün adı (GATT)
│           └── Reklam.java         AdMob + UMP
├── araclar/
│   ├── esitle.mjs            web arayüzünü GENEL-KONULAR'dan alır, KAYNAK.txt'i yazar
│   ├── veri-guvenligi.mjs    Play Veri güvenliği CSV'si (magaza/aciklamalar.md tablosuyla)
│   └── magaza-gorsel.mjs     mağaza görselleri (Playwright)
├── magaza/                   aciklamalar.md, PLAY-YAYIN.md, DEGERLENDIRME.md, surum-notu.txt, veri-guvenligi.csv, play/
├── test/magaza.test.mjs      mağaza dosyalarının Play kurallarına uygunluğu (node:test)
├── KAYNAK.txt                web arayüzünün geldiği GENEL-KONULAR commit'i
└── play-istek.txt            Google Play API komutları (play-iz.yml)
```

Gizlilik politikası ve tanıtım sayfası `app/iz-haritasi/` altındadır (GitHub Pages, yalnız main'den):
`https://mahmuttari.github.io/Lispler/iz-haritasi/gizlilik.html`.

## Derleme

```bash
# Web arayüzünü güncelle (GENEL-KONULAR bu deponun yanında olmalı)
node iz-haritasi/araclar/esitle.mjs

# Yerelde derle (Android SDK ve JDK 17+ gerekir; local.properties içinde sdk.dir)
cd iz-haritasi/android
./gradlew assembleDebug                  # test reklamlı deneme APK'sı
./gradlew assembleRelease bundleRelease  # keystore.properties yoksa hata ayıklama anahtarıyla imzalanır (Play kabul etmez)
```

GitHub'da her değişiklikte `.github/workflows/iz-android.yml` derler: APK her zaman (`IzHaritasi-apk`), yükleme anahtarı
secret'ı varsa imzalı AAB (`IzHaritasi-aab` + `surum.txt`). Anahtar `IZ_KEYSTORE_BASE64/PASSWORD`, yoksa Poyraz
Workshop'un Hayalet Avcıları yükleme anahtarı (`HAYALET_KEYSTORE_*`). Play aynı yükleme anahtarını birden çok
uygulamada kabul eder; uygulama imzalama anahtarı Google'dadır.

Uygulamanın testleri GENEL-KONULAR'dadır (`npm test` 64, `node tests/tarayici.mjs` 47; reklam kuralları G bölümü).
Bu klasörde Gradle derlemesi ve lint-vital (`lintVitalRelease`) ile mağaza dosyaları denetlenir:
`node --test iz-haritasi/test/*.test.mjs` (metin sınırları, Veri güvenliği CSV'si, görsel ölçüleri, AdMob kimlikleri;
`play-iz.yml` her Play komutundan önce çalıştırır).

## Google Play

İlk yayın: [`magaza/PLAY-YAYIN.md`](magaza/PLAY-YAYIN.md) (AdMob → Play Console → hizmet hesabı → formlar →
bulut oturumuna devir). Sonraki sürümler yalnız GitHub üzerinden: `versionCode` +1 → push → `play-istek.txt`.
Yayın kararının değerlendirmesi (rakipler, riskler, birim ekonomi): [`magaza/DEGERLENDIRME.md`](magaza/DEGERLENDIRME.md).

OpenStreetMap karo kuralı gereği WebView'in kullanıcı aracısına `IzHaritasi/<sürüm> (+adres)` eki konur. Sayfa
`https://appassets.androidplatform.net/`'ten sunulduğu için karo isteği Referer de taşır. OSM, tarayıcı kimliğiyle
gelip Referer taşımayan isteği engeller (`x-blocked: No referer sent`).

AirTag ve Find My, Apple Inc.'in ticari markalarıdır. İz Haritası Apple ile bağlantılı değildir.
