# 📐 Unitica (Google Play sürümü)

Poyraz Workshop'un çevrimdışı mühendislik birim dönüştürücüsü: geoteknik ve inşaat, akışkan ve hidrolik, ısı ve enerji,
kütle ve atalet. 26 kategori, 251 birim, geçmiş, favoriler, "tüm birimlerde" listesi, 11 dil (tr, en, de, fr, es, pt,
ru, ja, ar, it, ko; Arapça sağdan sola), açık/koyu tema, anlamlı basamak, ondalık işareti ve bilimsel gösterim ayarları.

Kaynağı Drive'daki `KUCUK_UYGULAMALAR/Unitica-1.3.1.apk`'dır ([`KAYNAK.txt`](KAYNAK.txt)); kaynak kodu yoktu. Web kodu
APK'dan alındı (`www/`), Android projesi `npx cap add android` ile yeniden kuruldu, simge, açılış ekranı ve tema özgün
APK'dan. Farklar yalnız şunlardır:

| | Özgün 1.3.1 | Bu klasör (1.4.0) |
|---|---|---|
| Paket | `com.unitica.app` | `com.poyrazworkshop.unitica` (Poyraz Workshop, Google Play) |
| Reklam | GeoTerva tam ekran ev reklamı: açılıştan 5 sn sonra ve her 3 dakikada bir, 10 sn kapatılamaz | Google AdMob: altta banner + çok seyrek geçiş reklamı (aşağıda); ev reklamı, resmi ve zamanlayıcısı kaldırıldı |
| AB onayı | — | UMP: reklamdan önce onay formu; Diğer › Reklam gizlilik seçenekleri |
| Reklamsız üyelik | 0,99 $ / 9,99 $ yazıyor ama "Yakında" (ödeme yok) | Gerçek Google Play aboneliği `adfree` (`monthly`, `yearly`); fiyat Play'den, geri yükleme, "Aboneliği yönet" |
| İnternet | izin yok, CSP `connect-src 'self'` | yalnız yerli AdMob ve Play Billing için `INTERNET`; WebView'in CSP'si aynı (ağa çıkmaz) |
| Hakkında | sürüm, "internet izni istemez" | geliştirici Poyraz Workshop, e-posta, gizlilik politikası, düz satır olarak GeoTerva (geoterva.com); "internet yalnız reklam ve abonelik için" (11 dil) |
| Eklentiler | `@capacitor/app` | + `@capacitor-community/admob` 8.2.1, `@capgo/native-purchases` 8.9.6 (sürümler sabit) |

Düzeltilen hata: alt sayfa kapanırken (200 ms) yeni bir alt sayfa açılırsa eski sayfanın gecikmeli temizliği yenisini
siliyordu (`www/js/sheet.js`); `sheetOpen()` boş ekranda da "açık" diyordu.

## Reklam kuralları (uzman kararı; ayrıntı `www/js/reklam-kural.js` başında)

- **Reklamsız üye:** AdMob SDK'sı hiç başlatılmaz. Açılışta önce Google Play'e sorulur.
- **UMP önce:** onay bilgisi → gerekiyorsa form → reklam istenebiliyorsa `initialize({ maxAdContentRating: 'General' })`.
- **Banner:** altta ayrı şerit (uyarlanabilir); sayfa, alt sayfalar ve bildirim banner yüksekliği kadar yukarı çekilir,
  banner hiçbir düğmenin üstüne binmez; klavye açılınca gizlenir.
- **Geçiş reklamı çok seyrek:** birim dönüştürücüde temiz doğal durak azdır. Yalnız Geçmiş, Favoriler ya da Diğer
  ekranından sekme çubuğu / geri tuşuyla ayrılırken; ilk 5 dk yok, en az 8 dk ara, saatte en çok 3 (kalıcı sayaç),
  terk edilen ekranda 5 sn'den az kalındıysa ve üyelik ekranına bakıldıktan sonraki 10 dk yok; değer yazarken, birim
  seçerken, alt sayfa ya da klavye açıkken asla. Açılış ve ödüllü reklam yok.
- Kimlikler `android/gradle.properties`'te (tek kaynak); şimdilik Google'ın **test** kimlikleri. Gerçekleri AdMob'da
  oluşturulunca yazılır ([`magaza/PLAY-YAYIN.md`](magaza/PLAY-YAYIN.md) adım 1) ve `node araclar/kimlik.mjs`
  `www/js/reklam-kimlik.js`'i yazar. Hata ayıklama derlemesi her zaman test kimlikleriyle çalışır (manifestte test
  uygulama kimliği, istekte `isTesting`). Test kimlikli paket Play'e yüklenmez (`play-unitica.yml` reddeder).

## Klasörler

```
unitica/
├── www/                      uygulamanın web kodu (Capacitor webDir)
│   ├── index.html, css/, fonts/ (Inter), assets/mark.svg, version.json
│   └── js/
│       ├── app.js            giriş: dil, tema, dört sekme, geri tuşu, üyelik ve reklamın başlatılması
│       ├── units.js format.js names.js i18n.js lang/*.js   dönüştürücü çekirdeği ve 11 dil (özgün)
│       ├── home.js lists.js more.js sheet.js state.js       ekranlar (özgün; more.js Hakkında ve gizlilik satırı yeni)
│       ├── reklam-kural.js   geçiş reklamının kuralları (saf; test/reklam.test.mjs)
│       ├── reklam.js         AdMob + UMP yapıştırıcısı
│       ├── reklam-kimlik.js  OTOMATİK: araclar/kimlik.mjs yazar
│       ├── billing.js        Google Play Billing (@capgo/native-purchases; tarayıcıda taklit)
│       ├── plans.js          üyelik mantığı (hak, satın alma, geri yükleme, fiyat satırı)
│       ├── membership.js     reklamsız üyelik alt sayfası
│       └── config.js         paket, iletişim, gizlilik adresi, abonelik kimlikleri
├── android/                  Capacitor 8 Android projesi (compileSdk/targetSdk 36, minSdk 24, AGP 8.13)
│   ├── gradle.properties     AdMob kimlikleri
│   └── app/build.gradle      sürüm, imza (android/keystore.properties; depoda yok), manifest yer tutucusu
├── araclar/
│   ├── kimlik.mjs            gradle.properties → www/js/reklam-kimlik.js
│   ├── veri-guvenligi.mjs    Play Veri güvenliği CSV'si
│   ├── magaza-gorsel.mjs     mağaza görselleri (Playwright, 11 dil)
│   ├── tarayici-dene.mjs     tarayıcı duman denemesi (yalnız yerel)
│   └── sunucu.mjs            ikisinin ortak yerel sunucusu ve sahte eklentileri
├── magaza/                   aciklamalar.md, diller/, PLAY-YAYIN.md, DEGERLENDIRME.md, fiyatlandirma.md,
│                             surum-notu.txt, veri-guvenligi.csv, play/
├── test/                     magaza, reklam, uygulama (node:test)
├── KAYNAK.txt                özgün APK'nın kimliği
└── play-istek.txt            Google Play API komutları (play-unitica.yml)
```

Gizlilik politikası ve tanıtım sayfası `app/unitica/` altındadır (GitHub Pages, yalnız main'den):
`https://mahmuttari.github.io/Lispler/unitica/gizlilik.html`.

## Derleme

```bash
cd unitica
npm ci
node araclar/kimlik.mjs            # gradle.properties → www/js/reklam-kimlik.js
npx cap sync android               # www → android/app/src/main/assets/public, eklentiler
cd android
./gradlew assembleDebug            # test reklamlı deneme APK'sı
./gradlew assembleRelease bundleRelease   # keystore.properties yoksa hata ayıklama anahtarıyla imzalanır (Play kabul etmez)
```

GitHub'da her değişiklikte `.github/workflows/unitica-android.yml` derler: APK her zaman (`Unitica-apk`), yükleme
anahtarı secret'ı varsa imzalı AAB (`Unitica-aab` + `surum.txt`).

## Sınama

```bash
node --test unitica/test/*.test.mjs        # mağaza metinleri ve görseller, Veri güvenliği, AdMob kimlikleri,
                                           # reklam kuralları, abonelik, 11 dilin anahtarları, sürüm, birimler
node unitica/araclar/tarayici-dene.mjs     # her dil (TR açık 390 px, AR koyu 340 px dahil) + sahte eklentiyle
                                           # reklam/abonelik akışı; konsol hatası, taşma, çevrilmemiş anahtar yok
node unitica/araclar/magaza-gorsel.mjs     # mağaza görsellerini yeniden üretir
```

## Google Play

İlk yayın: [`magaza/PLAY-YAYIN.md`](magaza/PLAY-YAYIN.md) (dört küçük uygulamanın ortak oturumu
[`../docs/kucuk-uygulamalar-play.md`](../docs/kucuk-uygulamalar-play.md)). Yayın kararının değerlendirmesi:
[`magaza/DEGERLENDIRME.md`](magaza/DEGERLENDIRME.md). Fiyatlar: [`magaza/fiyatlandirma.md`](magaza/fiyatlandirma.md).
