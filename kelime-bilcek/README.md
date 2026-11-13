# Kelime Bilcek (Poyraz Workshop)

Çevrimiçi Türkçe kelime düellosu: Hızlı (10 round, eşzamanlı), Tenis / Sıra Beklicek (3 round, sıralı), Zincir (son
harf). Arkadaşlar, davet, oda kodu, hızlı eşleşme, 25 kategori, Şampiyonlar. Capacitor 8 ile Android
(`com.poyrazworkshop.kelimebilcek`), Firebase (`kelime-bilcek`: Google girişi + Realtime Database), kelime hakemi
Cloudflare Worker (`floral-wave-f116`, Workers AI). Sürüm **1.0.0 (1)**.

Kaynak: MARFEN'deki v4.11 (APK `KelimeBilcek-v3.7-debug.apk`, `com.oyundar.kelimebilcek`); elden geçirme ve bulgular
[`DENETIM.md`](DENETIM.md).

| Klasör / dosya | İçerik |
|---|---|
| `www/index.html`, `style.css` | Arayüz |
| `www/kelime.js` | Kategoriler, sözlük, normalleştirme, Türkçe ilk/son harf (saf; `test/kelime.test.mjs`) |
| `www/oyun.js` | Oyun: giriş, ad, arkadaş, davet, eşleşme, oda, round, Şampiyonlar, hesap silme |
| `www/reklam.js` | AdMob: maç sonu geçiş reklamı, lobi/Şampiyonlar banner'ı, AB onayı (`test/reklam.test.mjs`) |
| `www/vendor/` | Firebase compat 10.12.0, `npm run vendor` ile paketten (depoda yok) |
| `android/` | Capacitor Android projesi (imza `keystore.properties` CI'da yazılır) |
| `firebase/` | RTDB kuralları, emülatör testleri, kural yayını, Firebase Android uygulaması — [`firebase/README.md`](firebase/README.md) |
| `site/` | kelime-bilcek.web.app: tanıtım, gizlilik, hesap silme, app-ads.txt — [`site/README.md`](site/README.md) |
| `worker/` | Cloudflare Worker v3 — [`worker/README.md`](worker/README.md) |
| `magaza/` | Play metinleri, görseller, Veri güvenliği CSV'si, yayın talimatı — [`magaza/PLAY-YAYIN.md`](magaza/PLAY-YAYIN.md) |
| `play-istek.txt` | Play API komutları (`play-kelime.yml`) |

## Komutlar

```sh
npm ci && npm run vendor                 # bağımlılıklar + Firebase SDK
npm test                                 # kelime, reklam, arayüz (Playwright + axe-core)
npm run lint                             # ESLint + html-validate
node --test worker/worker.test.mjs site/site.test.mjs
cd firebase && npm ci && npm test && npm run test:akis   # emülatör (Java 21)
node araclar/magaza-gorsel.mjs           # mağaza görselleri
npm run sync                             # www → android
```

## GitHub iş akışları

| İş akışı | Ne zaman | Ne yapar |
|---|---|---|
| `kelime-denetim.yml` | her değişiklik | ESLint, html-validate, testler, Lighthouse CI, Android lint |
| `kelime-firebase-kurallar.yml` | kurallar ya da oyun kodu değişince | emülatörde kural ve uçtan uca akış testleri |
| `kelime-android.yml` | her değişiklik | APK; secret varsa imzalı AAB + yükleme anahtarı parmak izleri |
| `kelime-kural-yayini.yml` | `firebase/yayin-istek.txt` | testler geçince kuralları yayınlar |
| `kelime-firebase-uygulama.yml` | `firebase/uygulama-istek.txt` | Firebase'e Android uygulaması + SHA |
| `kelime-site-yayini.yml` | `site/yayin-istek.txt` | Hosting sitesi |
| `play-kelime.yml` | `play-istek.txt` | Play API (`android/play.mjs`, `PLAY_UYGULAMA=kelime`) |

## Sonraki sürümler

`android/app/build.gradle`'da `versionCode` +1 ve `versionName`; `magaza/surum-notu.txt`; push → imzalı AAB →
`play-istek.txt` › `yukle uygula`, kullanıcının onayıyla `yukle yayinla uygula`.
