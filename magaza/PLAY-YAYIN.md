# Google Play'de üretime yayınlama — adım adım

Bu liste, Play Console'u tarayıcıda kullanabilen bir Claude oturumu (veya bir kişi) içindir.
Hesap: **Poyraz Workshop** (eski hesap, kapalı test zorunluluğu yok → doğrudan **Üretim**).

> **Kullanıcıya sormadan yapma:** Google hesabına giriş/2 adımlı doğrulama, herhangi bir sözleşme veya
> beyanın onaylanması, ödeme/vergi profili, **"İncelemeye gönder / Üretime yayınla"** düğmesi,
> kalıcı seçimler (paket adı yüklemesi, Play App Signing). Bunlarda dur, kullanıcıya ne yapacağını söyle.

## Sabit bilgiler

| Alan | Değer |
|---|---|
| Uygulama adı | `Not Defteri – HTML Çalıştır` |
| Paket adı | `com.poyrazworkshop.notdefteri` |
| Yüklenecek dosya | [`dist/NotDefteri-play.aab`](../dist/NotDefteri-play.aab) (sürüm 1.2, kod 3) |
| Varsayılan dil | Türkçe – tr-TR |
| Uygulama / oyun | Uygulama · **Ücretsiz** |
| Kategori | Verimlilik (Productivity) |
| İletişim e-postası | `mahmuttari@gmail.com` |
| Web sitesi | `https://mahmuttari.github.io/Lispler/` |
| Gizlilik politikası | `https://mahmuttari.github.io/Lispler/gizlilik.html` |

## 0. Önce AdMob (gerçek reklam kimlikleri)

`dist/NotDefteri-play.aab` şu an **Google'ın test reklam kimlikleriyle** derlendi: yayına çıkarsa reklam
görünür ama **hiç para kazandırmaz**. Üretimden önce:

1. https://admob.google.com → Uygulamalar › **Uygulama ekle** › Android › "Uygulama desteklenen bir
   mağazada listeleniyor mu?" **Hayır** › ad: `Not Defteri`.
2. Bu uygulamada 3 reklam birimi: **Banner**, **Geçiş (Interstitial)**, **Uygulama açılışı (App open)**.
3. Gizlilik ve mesajlaşma › **AB kullanıcı izni (GDPR)** mesajı oluştur, bu uygulamaya ata, yayınla.
4. Uygulama kimliği (`ca-app-pub-…~…`) ve 3 birim kimliğini (`ca-app-pub-…/…`)
   [`android/gradle.properties`](../android/gradle.properties) içindeki `ADMOB_*` satırlarına yaz,
   `versionCode`'u artırma (ilk yükleme), AAB'yi yeniden derle:
   - **GitHub ile:** depo Settings › Secrets › Actions: `ANDROID_KEYSTORE_BASE64`
     (`base64 -w0 upload-keystore.jks`) ve `ANDROID_KEYSTORE_PASSWORD` (`sifre.txt`). Push sonrası
     Actions › Android › Artifacts › `NotDefteri-play-aab`.
   - **Yerelde:** `android/keystore.properties` + `upload-keystore.jks` ile `./gradlew bundleRelease`.
5. Uygulama Play'de yayınlanınca AdMob'da uygulamayı mağaza girişine **bağla**.

## 1. Uygulama oluştur
Tüm uygulamalar › **Uygulama oluştur** → yukarıdaki ad, dil, Uygulama, Ücretsiz. Beyan kutuları
(Geliştirici Programı Politikaları, ABD ihracat yasaları) → **kullanıcıya onaylat**.

## 2. Mağaza girişi (Büyüme › Mağaza varlığı › Ana mağaza girişi)
- Kısa açıklama, uzun açıklama: [`aciklamalar.md`](aciklamalar.md)
- Uygulama simgesi: [`play/simge-512.png`](play/simge-512.png)
- Öne çıkan grafik: [`play/tanitim-gorseli-1024x500.png`](play/tanitim-gorseli-1024x500.png)
- Telefon ekran görüntüleri (sırayla): `play/telefon-1-editor.png` … `play/telefon-6-pdf.png`
- Tablet ekran görüntüleri: boş bırakılabilir.

## 3. Uygulama içeriği (Politika › Uygulama içeriği)
| Bölüm | Cevap |
|---|---|
| Gizlilik politikası | yukarıdaki URL |
| Uygulama erişimi | Tüm işlevler özel erişim olmadan kullanılabilir |
| Reklamlar | **Evet, reklam içeriyor** |
| İçerik derecelendirmesi | Kategori: Yardımcı program/Verimlilik. Şiddet, cinsellik, kumar, uyuşturucu: Hayır. Kullanıcılar etkileşim/içerik paylaşımı: **Hayır** (içerik yalnızca cihazda). Konum paylaşımı: Hayır. Dijital ürün satın alma: **Evet** |
| Hedef kitle | **13-15, 16-17, 18+** (13 yaş altı seçme). Çocuklara hitap ediyor mu: Hayır |
| Haber uygulaması | Hayır |
| Veri güvenliği | [`aciklamalar.md` › Veri güvenliği formu](aciklamalar.md) |
| Reklam kimliği | Evet → amaç: **Reklam veya pazarlama** |
| Kamu uygulaması / Finansal özellikler / Sağlık | Hayır / Yok / Yok |

## 4. Üretim sürümü (Test ve yayınla › Üretim)
- Ülkeler: **Tüm ülkeler**.
- **Yeni sürüm oluştur** → Play App Signing'i kabul et (**kullanıcıya sor**) → AAB'yi yükle.
- Sürüm adı: `1.2 (3)` · Sürüm notları (tr-TR):
  ```
  İlk sürüm: Windows Not Defteri tarzında metin düzenleyici. HTML yaz, kaydet ve tek dokunuşla çalıştır. Konsol, koyu tema, bul/değiştir, PDF olarak kaydet.
  ```
- Kaydet → İncele → **İncelemeye gönder: kullanıcıya sor.**

## 5. Abonelik (AAB yüklendikten sonra)
Para kazanma › Ürünler › Abonelikler → [`fiyatlandirma.md`](fiyatlandirma.md) adımları:
ürün `notdefteri.pro.aylik`, temel plan `aylik` (1 ay, otomatik yenilenen), 2,99 USD → Türkiye 19,99 TRY,
düşük/orta gelirli ülkeler 20 TL karşılığı. Ödeme profili yoksa **kullanıcıya sor**.
