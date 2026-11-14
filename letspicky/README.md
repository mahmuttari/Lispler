# Let's Picky — Android ve iOS

Aile ve arkadaş grupları için kaydır-eşleş karar uygulaması: oda kur, kartları kaydır, 30 saniyede ortak karar ver.
Web sürümü: https://letspicky.com · Paket: `com.mahmuttari.letspicky` · Gizlilik: https://letspicky.com/gizlilik.html

Bu klasör uygulamanın **mobil kabuğudur**. Kaynak kod, web yayını ve Firebase kurulumu özel depodadır:
`mahmuttari/Yonetmelik-araclari` › `ortakkarar/` (React + Vite). Buradaki dosyalar oradan kopyalanır:

| Burada | Kaynak (ortakkarar/) |
|---|---|
| `www/` | `dist/` (`npm run build`, canlı Firebase ayarıyla) |
| `android/`, `ios/` | `android/`, `ios/` (imza ve sürüm satırları burada Lispler düzenine uyarlandı) |
| `magaza/` | `store/` ve `scripts/store-listings.py` |

Yeni sürüm: kaynakta `npm run build`, sonra `dist/` → `www/` kopyalanır; `android/app/build.gradle` içinde
`versionCode` bir artırılır ve `versionName` değiştirilir.

## İş akışları

- `.github/workflows/letspicky-android.yml` — her değişiklikte APK; yükleme anahtarı secret'ı varsa imzalı AAB
  ("LetsPicky-aab"). Anahtar `LETSPICKY_KEYSTORE_*`, yoksa Poyraz Workshop'un ortak yükleme anahtarı (`HAYALET_KEYSTORE_*`).
- `.github/workflows/play-letspicky.yml` — `letspicky/play-istek.txt` komutları (anahtarsız Play kimliği).
- `.github/workflows/ios-asc.yml` — `ios-ortak/asc-istek.txt`: `paket uygula`, `yukle letspicky` (TestFlight).

## İlk yayın (bir kez, elle)

1. Play Console: "Uygulama oluştur" (ad Let's Picky, varsayılan dil tr-TR, ücretsiz). İlk AAB'yi ("LetsPicky-aab"
   artifact'ı) Test › Dahili test'e elle yükleyin. Hizmet hesabına bu uygulama için izin verin (Kullanıcılar ve izinler).
2. App Store Connect: `paket uygula` paket kimliğini kaydeder; sonra "Yeni uygulama" (Let's Picky, paket kimliği
   `com.mahmuttari.letspicky`, SKU `letspicky`). Ardından `yukle letspicky` TestFlight'a yükler.
