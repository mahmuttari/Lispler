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
- iOS (App Store Connect + TestFlight): App Store Connect anahtarı ve dağıtım sertifikası bu depoda değil,
  `mahmuttari/NetcadDevelop`'ta. Komutlar oradaki `.github/letspicky-istek.txt`'ye yazılır (`.github/workflows/letspicky-ios.yml`,
  dal `claude/letspicky-ios`): `durum`, `paket uygula`, `yukle letspicky`, `metin|yas|gorsel letspicky uygula`. İş bu klasörü
  ve `ios-ortak/asc.mjs`'i checkout eder; imza elle (kalıcı Apple Distribution sertifikası + App Store profili), çünkü
  ekipte kayıtlı cihaz olmadığından otomatik imza düşer. App Store metinleri `magaza/app-store.json` → `magaza/APP-STORE.md`.

## İlk yayın (bir kez, elle)

1. Play Console: "Uygulama oluştur" (ad Let's Picky, varsayılan dil tr-TR, ücretsiz). İlk AAB'yi ("LetsPicky-aab"
   artifact'ı) Test › Dahili test'e elle yükleyin. Hizmet hesabına bu uygulama için izin verin (Kullanıcılar ve izinler).
2. App Store Connect (14 Kasım 2026'da yapıldı): `paket uygula` paket kimliğini kaydetti; "New App" ile kayıt açıldı
   (Let's Picky, Türkçe, paket `com.mahmuttari.letspicky`, SKU `letspicky-ios`, Apple ID 6834758192); `yukle letspicky`
   1.0.0 (1)'i TestFlight'a yükledi. Kalanlar sahibin: App Privacy yanıtları, inceleme bilgileri ve incelemeye gönderme.

## Reklamlar (AdMob)

Let's Picky'de Lispler'deki öbür uygulamalarla aynı düzende AdMob reklamı vardır (yalnız Android ve iOS; web sürümünde
yok). Yerleşim ve kurallar kaynak depodadır: Yonetmelik-araclari › ortakkarar/README.md › "Gelir modeli ve reklamlar".

- Eklenti: `@capacitor-community/admob` 8.2.1 (package.json).
- Kimlikler (tek kaynak): `android/gradle.properties` ve `ios/admob.properties` › `ADMOB_APP_ID`, `ADMOB_BANNER_ID`,
  `ADMOB_INTERSTITIAL_ID`, `ADMOB_REWARDED_ID`. Şimdilik Google'ın test kimlikleri vardır.
- `node araclar/kimlik.mjs`: birim kimliklerini `www/reklam-kimlik.json`'a, iOS uygulama kimliğini `Info.plist`'e yazar.
  `www/` ortakkarar/dist'ten yeniden kopyalandıktan sonra da çalıştırılır (CI "cap sync"ten önce çalıştırır).
- Android manifestinde uygulama kimliği `${admobAppId}` (yayın: gradle.properties, hata ayıklama: Google'ın test kimliği).
  iOS: `GADApplicationIdentifier`, SKAdNetwork, izleme izni metni, PrivacyInfo'da reklam kimliği.
- App Store önkontrolü (`ios-ortak/asc.mjs`) test kimliğiyle derlenen paketi yüklemez.
- Gerçek kimlikler: AdMob'da Let's Picky'nin Android ve iOS kaydı ile ödüllü, banner ve geçiş birimleri açılınca iki
  properties dosyasına yazılır ve `node araclar/kimlik.mjs` çalıştırılır. Yaş derecesi için `yas letspicky uygula`
  yeniden çalıştırılır (reklam: Evet).
