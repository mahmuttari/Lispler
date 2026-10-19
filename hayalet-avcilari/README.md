# Hayalet Avcıları

Hayalet yakalama oyunu (Poyraz Workshop). Oyun HTML5 canvas'tır (`www/`), Android'e **Capacitor 8** ile paketlenir.
Çevrimiçi oda, şampiyonlar listesi ve bulut yedeği Firebase (`hayalet-avcilari` projesi) üzerindedir; Google ile
giriş `@codetrix-studio/capacitor-google-auth` eklentisiyle yapılır.

| | |
|---|---|
| Paket | `com.poyrazworkshop.hayaletavcilari` |
| Sürüm | 3.10.0 (versionCode 36) |
| Diller | Türkçe, English, Español, 简体中文, हिन्दी, العربية (sağdan sola) |
| Play'e yayın | [`magaza/PLAY-YAYIN.md`](magaza/PLAY-YAYIN.md) |
| Gizlilik / hesap silme | `app/hayalet-avcilari/` → GitHub Pages |
| Play paketi | `dist/HayaletAvcilari-play.aab` (yükleme anahtarıyla imzalı) |
| Denemelik APK | `dist/HayaletAvcilari.apk` (aynı anahtarla imzalı; Play sürümü üstüne kurulmaz, önce kaldırılır) |

## Kaynak

Kaynak, elimizdeki tek kopya olan `HayaletAvcilari.apk` (3.9.0, `com.hayaletavcilari.oyun`, debug imzalı) içinden
çıkarıldı: `assets/public` → `www/`, simge ve açılış görselleri → `android/app/src/main/res/`. Android projesi
`npx cap add android` ile yeniden üretildi; özgün projedeki ayarlar (dokunmatik ekran zorunlu değil, uyarlanabilir
simge) aynen taşındı.

## 3.9.1 düzeltmesi: hayalet engelin içinde

Belirti: bazı hayaletler engelin (tuğla blok) içinde kalıyor, hareket etmiyor, mermiler engele çarptığı için
vurulamıyor; bölüm "boss öldü ve bütün hayaletler bitti" şartına bağlı olduğundan **bölüm bitmiyordu**.

Nedenler (`www/game.js`):
1. Boss'un minik hayaletleri boss'un çevresinde rastgele doğuyor, 8 denemede boş yer bulamazsa engelin içinde kalıyordu
   (boss engel kenarındayken %12'ye yakın).
2. Boss 30 denemede yer bulamazsa sabit bir noktaya konuyordu; orası engel olabiliyordu.
3. Fanatik karakterinin itme gücü hayaletleri engel denetimi yapmadan 25 px itiyor, engelin içine gömüyordu.
4. Engellerin yerleşimi oyuncunun o anki konumuna bağlıydı: çevrimiçi oyunda host ile katılanın haritası farklı
   çıkıyor, katılanın ekranında hayalet engelin içinde görünüyor ve mermisi engele çarpıyordu. Yeni oyun da önceki
   turun son konumuna göre kuruluyordu.

Düzeltme: `freeSpot()` engelin içindeki noktaya en yakın boş yeri halka halka arar; doğma, boss ve minikler bunu
kullanır. İtme yalnız boş yere yapılır. Güvenlik ağı olarak hareket edemeyen ve engelin içinde kalan hayalet en yakın
boş yere çıkarılır. Çevrimiçi oyunda ve yeni oyunun başında engel yerleşimi dünya merkezine göre kurulur.

Test: `node hayalet-avcilari/test/engel.test.mjs` (Playwright + Chromium). Eski kodda başarısız olur (uzun oyunda
3.208 karede gömülü hayalet), yeni kodda geçer.

## Diller

Kaynak dil Türkçedir. Metinler kodda Türkçe yazılır ve `t("…")` ile çevrilir (`www/i18n.js`); `{ad}` gibi yer
tutucular `t(metin, { ad: … })` ile doldurulur. Sözlükler `www/i18n/<dil>.js` dosyalarındadır, anahtar Türkçe metnin
kendisidir. `index.html`'deki sabit metinler açılışta `dilUygula()` ile çevrilir; iç biçimli metinler `data-i18n-html`
ile işaretlenir. Dil ilk açılışta telefonun dilinden seçilir (desteklenmeyen dilde İngilizce), menüdeki **🌐 Dil**
düğmesiyle değiştirilir. Arapçada sayfa `dir="rtl"` olur. Android simge adı `res/values-<dil>/strings.xml`'de.

Yeni ya da değişen bir metin için:
```sh
node hayalet-avcilari/araclar/anahtarlar.mjs            # çevrilecek bütün anahtarlar
node hayalet-avcilari/araclar/sozluk.mjs denetle         # eksik anahtar, yer tutucu, HTML etiketi denetimi
node hayalet-avcilari/test/dil.test.mjs                  # her dilde bütün ekranlar: çevrilmemiş metin, taşma, hata
node hayalet-avcilari/araclar/magaza-gorsel.mjs          # Play ekran görüntüleri ve tanıtım görseli (her dil)
```
Mağaza metinleri: Türkçe `magaza/aciklamalar.md`, diğerleri `magaza/diller/<play-dili>.md` (en-US, es-ES, es-419,
zh-CN, hi-IN, ar); görseller `magaza/play/` ve `magaza/play/<play-dili>/`.

## Derleme

Node 22, JDK 21, Android SDK 36:
```sh
cd hayalet-avcilari && npm ci && npx cap sync android
cd android && echo "sdk.dir=$ANDROID_HOME" > local.properties
./gradlew bundleRelease assembleRelease
```
`android/keystore.properties` varsa paketler yükleme anahtarıyla imzalanır (`storeFile`, `storePassword`, `keyAlias`,
`keyPassword`). Bu dosya ve `.jks` depoya **alınmaz**. Yükleme anahtarı kullanıcıya ayrıca verildi; kaybolursa Play
Console'dan "yükleme anahtarını sıfırla" istenir (Play App Signing açık olduğu için uygulama kaybolmaz).

### GitHub üzerinden (NetcadDevelop/DWG Office Zip düzeni)

`.github/workflows/hayalet-android.yml` her değişiklikte derler. GitHub › Settings › Secrets and variables › Actions'ta
şu iki secret varsa (19 Ekim 2026'da eklendi) yükleme anahtarıyla **imzalı AAB** derlenir ve `HayaletAvcilari-aab` artifact'ı (surum.txt ile) olur:

| Secret | Değer |
|---|---|
| `HAYALET_KEYSTORE_BASE64` | `hayaletavcilari-upload.jks` dosyasının base64'ü (Mac: `base64 -i hayaletavcilari-upload.jks \| pbcopy`) |
| `HAYALET_KEYSTORE_PASSWORD` | yükleme anahtarının parolası (anahtarla birlikte verilen OKU-BENI.txt'te) |

`play-istek.txt`'ye `yukle uygula` yazılıp gönderilince `play-hayalet.yml` AAB'yi o artifact'tan alır (versionCode
eşleşmeli) ve Play'e yükler; artifact yoksa depodaki `dist/HayaletAvcilari-play.aab` kullanılır. Yani yeni sürüm için:
`versionCode` +1 → push → derleme biter → `play-istek.txt`'ye `yukle uygula` → onayla `yukle yayinla uygula`.
