# Tavla (Poyraz Workshop)

Sesli yorumculu klasik Türk tavlası: bilgisayara karşı (Pala Dayı, Genç Mert, Selim Bey; 480+ seslendirilmiş replik),
aynı telefonda iki kişi ya da çevrimiçi (hızlı eşleşme, oda kodu, arkadaş daveti, yazılı ve sesli sohbet). Capacitor 8
ile Android (`com.poyrazworkshop.tavla`, yatay ekran), Firebase (`tavla-online-oyundar`: Authentication + Firestore).
Ücretsiz, AdMob reklamlı (oyun sırasında reklam yok; `www/reklam.js`). Sürüm **1.0.2 (3)**.

Kaynak: kullanıcının `app-debug.apk`'sı (`com.korfe.tavla`); kaynak kodu olmadığı için web paketi APK'dan çıkarılıp
okunur biçime getirildi. Elden geçirme ve bulgular: [`DENETIM.md`](DENETIM.md).

| Klasör / dosya | İçerik |
|---|---|
| `www/` | Oyun (React + Vite derlemesi, okunur biçimde). Güvenlik bölümü (şikâyet, engelleme, hesap silme) `assets/index-BLMBGPAE.js` içinde `tv…` adlarıyla; `voices/` 3 karakterin ses dosyaları |
| `android/` | Capacitor Android projesi (imza `keystore.properties` CI'da yazılır; `google-services.json` iş akışıyla gelir) |
| `firebase/` | Firestore kuralları, emülatör testleri, kural yayını, Firebase Android uygulaması — [`firebase/README.md`](firebase/README.md) |
| `magaza/` | Play metinleri, görseller, Veri güvenliği CSV'si, yayın talimatı — [`magaza/PLAY-YAYIN.md`](magaza/PLAY-YAYIN.md) |
| `araclar/` | `magaza-gorsel.mjs` (Playwright), `simge-uret.mjs` (Android simgesi ve açılış ekranı), `veri-guvenligi.mjs`, `filigran-temizle.py`; `kaynak/` simge ve tanıtım görselinin SVG/HTML kaynakları (1.0.2) |
| `test/` | `arayuz.test.mjs` (Playwright), `magaza.test.mjs` |
| `play-istek.txt` | Play API komutları (`play-tavla.yml`) |
| `../app/tavla/` | Tanıtım, gizlilik ve hesap silme sayfaları (GitHub Pages, yalnız main'den) |

## Komutlar

```sh
cd tavla && npm ci && npm test                 # arayüz + mağaza (Playwright, Chromium)
cd tavla/firebase && npm ci && npm test && npm run test:akis   # kurallar + uçtan uca (Java 21)
node tavla/araclar/simge-uret.mjs              # Android simgesi + açılış ekranı (araclar/kaynak/*.svg)
node tavla/araclar/magaza-gorsel.mjs           # mağaza görselleri
node tavla/araclar/veri-guvenligi.mjs          # Veri güvenliği CSV'si
cd tavla && npm run sync                       # www → android
```

## GitHub iş akışları

| İş akışı | Ne zaman | Ne yapar |
|---|---|---|
| `tavla-denetim.yml` | her değişiklik | arayüz, mağaza, kurallar, uçtan uca akış, Veri güvenliği CSV'si |
| `tavla-android.yml` | her değişiklik | APK; secret varsa imzalı AAB + yükleme anahtarı parmak izleri |
| `tavla-kural-yayini.yml` | `firebase/yayin-istek.txt` | testler geçince Firestore kurallarını yayınlar |
| `tavla-firebase-uygulama.yml` | `firebase/uygulama-istek.txt` | Firebase'e Android uygulaması + SHA, google-services.json |
| `play-tavla.yml` | `play-istek.txt` | Play API (`android/play.mjs`, `PLAY_UYGULAMA=tavla`) |
