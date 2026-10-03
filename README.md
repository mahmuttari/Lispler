# Not Defteri

Windows Not Defteri tarzında, **HTML kodunu çalıştırabilen** bir metin düzenleyici. Android ve iOS için.
Ücretsiz sürüm reklamlıdır; **Not Defteri Pro** aylık aboneliği tüm reklamları kaldırır.

## Telefona elle kurulum (Android)

1. Telefondan [`dist/NotDefteri.apk`](dist/NotDefteri.apk) dosyasını indirip açın.
2. "Bilinmeyen kaynaklardan yükleme" izni isterse verin, **Yükle** deyin.

> Play Store'dan kurulan sürüm farklı bir imza taşır. Elle kurduğunuz sürümü kaldırmadan Play sürümü
> kurulmaz. Kaldırmadan önce önemli notlarınızı **Dosya › Cihaza kaydet** ile telefona kaydedin.

## Özellikler

- **Dosya**: Yeni, Yeni HTML Sayfası, Aç, Kaydet, Farklı Kaydet, Cihazdan aç / Cihaza kaydet, Paylaş
- **Düzen**: Geri Al / Yinele, Kes / Kopyala / Yapıştır / Sil, Bul, Değiştir, Git, Tümünü Seç, Saat/Tarih
- **Biçim**: Sözcük Kaydırma, Yazı Tipi · **Görünüm**: Yakınlaştır, Durum Çubuğu, Sembol Çubuğu, Koyu Tema
- **▶ Çalıştır**: HTML/CSS/JS'yi tam ekran çalıştırır; `console.log` ve hatalar **Konsol**'da satır numarasıyla görünür
- Sembol çubuğu (`< > / = " { }`), **`</>`** ile son açık etiketi kapatma, kaydetmeden çıkınca taslak kurtarma

## Reklamlar ve Pro

| | Ücretsiz | Pro |
|---|---|---|
| Alt reklam bandı (klavye açıkken gizlenir) | ✓ | – |
| Tam ekran geçiş reklamı: önizlemeden çıkınca, kaydedince, dosya açınca, yeni belgede | ✓ (en sık 60 sn'de bir) | – |
| Açılış reklamı: uygulama açılınca ve 30 sn'den uzun arka plandan dönünce | ✓ | – |

Sıklık ayarları: `android/.../AdsManager.java` ve `ios/NotDefteri/AdsManager.swift` dosyalarının başında.
60 saniyeden daha sık tam ekran reklam göstermek AdMob ve Google Play politikalarına aykırıdır ve hesabın
kapatılmasına yol açabilir.

Fiyat: Türkiye **₺19,99/ay**, düşük/orta gelirli ülkeler **20 TL karşılığı**, zengin ülkeler **2,99 $/ay**.
Ayrıntılar ve panel adımları: [`magaza/fiyatlandirma.md`](magaza/fiyatlandirma.md). Mağaza açıklamaları,
veri güvenliği formu cevapları: [`magaza/aciklamalar.md`](magaza/aciklamalar.md).

## Mağazalarda yayınlama: yapılacaklar listesi

### 0. Ortak hazırlık
- [x] Gizlilik ve koşullar sayfalarına iletişim e-postası eklendi.
- [x] GitHub Pages açıldı (Source: GitHub Actions).
      Gizlilik politikası şu adreste yayınlanır: `https://mahmuttari.github.io/Lispler/gizlilik.html`
- [ ] [AdMob](https://admob.google.com) hesabı açın; **Android** ve **iOS** için birer uygulama, her birinde
      **Banner**, **Geçiş (Interstitial)** ve **Uygulama açılışı (App open)** reklam birimi oluşturun.
- [ ] AdMob › Gizlilik ve mesajlaşma › **GDPR izin mesajı** (ve iOS için **IDFA açıklama mesajı**) oluşturup yayınlayın.

### 1. Google Play
- [ ] [Play Console](https://play.google.com/console) geliştirici hesabı (tek seferlik 25 $, kimlik doğrulama).
- [ ] `android/gradle.properties` içindeki `ADMOB_*` kimliklerini kendi Android kimliklerinizle değiştirin.
- [ ] Uygulama oluşturun: paket adı `com.lispler.notdefteri` (sonradan değiştirilemez).
- [ ] **Play App Signing**'i açık bırakın; ilk AAB'yi yükleyin (yükleme anahtarı bu dosyayla tanımlanır).
- [ ] Abonelik: [`magaza/fiyatlandirma.md`](magaza/fiyatlandirma.md) adımları (ürün kimliği `notdefteri.pro.aylik`).
- [ ] Mağaza girişi, ekran görüntüleri, içerik derecelendirmesi, **Veri güvenliği**, **Reklam içeriyor: Evet**,
      **Reklam kimliği: Evet** formları.
- [ ] 2023 sonrası açılan **kişisel** hesaplarda Google, üretime çıkmadan önce **en az 12 test kullanıcısıyla
      14 gün kapalı test** ister.
- [ ] Payments profile'da (Ödeme profili) banka hesabı ve vergi bilgileri; AdMob'da ödeme bilgileri.

**AAB oluşturma:** GitHub › Settings › Secrets and variables › Actions'a şu iki secret'ı ekleyin:
`ANDROID_KEYSTORE_BASE64` (`base64 -w0 upload-keystore.jks` çıktısı) ve `ANDROID_KEYSTORE_PASSWORD`.
Sonra her push'ta **Actions › Android** çalışır, imzalı AAB'yi **Artifacts** bölümünden indirirsiniz.

### 2. App Store (Mac gerekmez)
- [ ] [Apple Developer Program](https://developer.apple.com/programs/) üyeliği (yıllık 99 $).
- [ ] App Store Connect'te uygulama oluşturun: Bundle ID `com.lispler.notdefteri`.
- [ ] **Agreements, Tax, and Banking** › Paid Apps sözleşmesi (abonelik satmak için şart).
- [ ] `ios/project.yml` içindeki `Release` bölümündeki `ADMOB_*` kimliklerini iOS kimliklerinizle değiştirin.
- [ ] App Store Connect › Users and Access › Integrations › **App Store Connect API** › anahtar oluşturun
      (rol: **Admin**). GitHub secret'ları: `APPLE_TEAM_ID`, `ASC_KEY_ID`, `ASC_ISSUER_ID`,
      `ASC_KEY_P8` (.p8 dosyasının içeriği).
- [ ] GitHub › **Actions › iOS › Run workflow** (upload işaretli): uygulama imzalanıp TestFlight'a yüklenir.
- [ ] Abonelik grubu ve `notdefteri.pro.aylik` aboneliği ([fiyatlar](magaza/fiyatlandirma.md)), ekran görüntüleri,
      **App Privacy** formu ([cevaplar](magaza/aciklamalar.md)), sonra **Submit for Review**.
      İlk sürümde abonelik, uygulamayla birlikte incelemeye gönderilmelidir.

## Proje yapısı

```
app/        Uygulamanın arayüzü (index.html) + gizlilik/koşul sayfaları. Tarayıcıda da çalışır (PWA).
android/    Android: WebView + AdMob + Google Play Billing (Java)
ios/        iOS: WKWebView + AdMob + StoreKit 2 (Swift, XcodeGen ile proje üretilir)
magaza/     Fiyatlandırma ve mağaza metinleri
dist/       Elle kurulum için hazır APK
.github/    Otomatik derleme: Android (APK/AAB), iOS (derleme + TestFlight), Pages (gizlilik sayfaları)
```

## Elle derleme

**Android** (Android SDK 36, JDK 17+):
```sh
cd android && echo "sdk.dir=/sdk/yolu" > local.properties
./gradlew assembleRelease   # APK
./gradlew bundleRelease     # AAB (android/keystore.properties varsa yükleme anahtarıyla imzalanır)
```

**iOS** (Mac + Xcode 16+): `brew install xcodegen && cd ios && xcodegen generate && open NotDefteri.xcodeproj`
Simülatörde abonelik testi için şema `NotDefteri.storekit` dosyasını kullanır.

`android/app/notdefteri.keystore` yalnızca elle kurulan APK içindir ve herkese açıktır. Google Play'e yükleme
anahtarı (`upload-keystore.jks`) **depoda tutulmaz**; kaybetmeyin ve kimseyle paylaşmayın.
