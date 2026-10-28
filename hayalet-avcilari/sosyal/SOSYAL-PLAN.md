# Hayalet Avcıları — ücretsiz kanal planı (Poyraz Workshop)

Hazırlandı: 28 Ekim 2026. İşaretler: **[D]** kaynaktan doğrulandı, **[K]** kısmen doğrulandı ya da kullanıcının
denetlemesi gerekiyor, **[DY]** doğrulanamadı.

## 0. Karar

- 28 Ekim 2026'da kullanıcı reklamveren yolu olarak **"Ücretsiz kanallar"**ı seçti.
  - Gerekçe: ücretli reklamda Google'ın bilgi panelinde yasal ad görünür ([`../reklam/REKLAM-PLANI.md`](../reklam/REKLAM-PLANI.md) §1).
  - Google Ads hesabı açılmaz.
- Reklam metinleri ve görselleri (`../reklam/`) bu planda gönderi olarak da kullanılır.
- Aynı gün kullanıcı **Google reklamını da** verme kararı aldı: reklamın kendisinde ad görünmez, yalnız ⓘ sayfasında
  görünür ([`../reklam/GOOGLE-ADS-KURULUM.md`](../reklam/GOOGLE-ADS-KURULUM.md)). Bu plan onunla birlikte sürer.
  - §1'deki "öne çıkarma kullanılmaz" kuralı sürer: ödeyen adı sosyal hesaplarda da görünmesin.

## 1. Adın görünmemesi için kurallar

- **Öne çıkarma kullanılmaz:** YouTube "Tanıt", TikTok "Promote", Instagram "Öne çıkar" ücretlidir, yani reklamdır.
  AB'de ödeyenin adı gösterilir **[D]** (DSA m.26). Platform da ödeme profilindeki adı ister **[K]**.
- **Hesap kimliği:**
  - Hesaplar `poyrazworkshop@gmail.com` ile açılır.
  - Google hesabının adı **"Poyraz Workshop"** yazılır. Gmail'den giden e-postada ve YouTube kanalında bu ad görünür
    **[K]**.
- **Bağlantılar:**
  - Kişisel Facebook ya da Instagram hesabına bağlanmaz.
  - Telefondaki kişiler eşitlenmez.
  - "Hesabımı tanıdığım kişilere öner" ayarları kapatılır **[K]**. Açık kalırsa hesap rehberdeki kişilere önerilir
    ve sahibi tahmin edilebilir.
  - Doğrulama için girilen telefon numarası başkalarına görünmez **[K]**.
- **Müzik:**
  - Videolarda oyunun müziği yoktur. Müzikler sunoapi.org'dan üretildi ve ticari kullanım hakkı yok
    ([`../README.md`](../README.md) › 3.14.0 › Hak notu).
  - Müzik paylaşırken platformun kendi kütüphanesinden eklenir.
  - TikTok işletme hesabı yalnız Ticari Müzik Kütüphanesi'ni kullanabilir **[K]**
    ([Soundstripe](https://www.soundstripe.com/blogs/why-can-i-only-use-commercial-sounds-on-tiktok),
    [Social Media Today](https://www.socialmediatoday.com/news/tiktok-changes-rules-on-music-usage-by-businesses/577734/)).
    Tanıtım içeriği ticari olduğu için zaten o kütüphane kullanılmalı.
- **Etiketler:**
  - Paylaşım başına 1–5 etiket; test denetler.
  - YouTube 60'tan fazla etiketli videonun bütün etiketlerini yok sayar **[D]**
    ([YouTube](https://support.google.com/youtube/answer/6390658)).
- **Filigran:**
  - Her platforma `videolar/` klasöründeki özgün dosya yüklenir.
  - Bir platformdan indirilip filigranıyla başka platforma yüklenen video öne çıkmayabilir **[K]**.

## 2. Uzman değerlendirmesi

**Güçlü yanlar**

- Maliyet sıfır; hiçbir yerde yasal ad görünmez.
- Oyun görsel ve hızlı, kısa dikey videoya uygun.
- Dünya Turu'nun 51 ülkesi ayrı bir dizi için hazır konu: "her ülkenin bossu", ülke başına 10 saniye.
- Arkadaşla oynama, izleyiciyi arkadaşını etiketlemeye çağırır.

**Riskler**

- Yavaş büyür; düzenli paylaşım ister (haftada en az 2).
- İlk videolar az izlenir; sonuç 4 hafta sonra değerlendirilir.
- Tek hesapta iki dil karışabilir. Türkçe ana dil olur, İngilizce video ayrı günlerde paylaşılır.

**Birim ekonomi**

- Para maliyeti yok. Emek: hesap kurulumu bir kez, sonra haftada yaklaşık 1 saat **[DY]**.
- Ölçüm: profildeki bağlantıya platform etiketi (UTM) eklenir:
  `https://play.google.com/store/apps/details?id=com.poyrazworkshop.hayaletavcilari&referrer=utm_source%3D<platform>%26utm_medium%3Dsosyal`
  (`<platform>` = youtube, tiktok, instagram).
- Play Console'un edinme raporları bu etiketlerle gelen yüklemeleri ayırır **[K]**.

## 3. Hesaplar (kullanıcı açar)

| Platform | Hesap türü | Ad | Kullanıcı adı önerisi | Profil | Bağlantı |
|---|---|---|---|---|---|
| YouTube | `poyrazworkshop@gmail.com` Google hesabının kanalı | Poyraz Workshop | `@poyrazworkshop` | `profil/profil-800.png`, kapak `profil/youtube-kapak-2560x1440.png` | Kanal açıklamasında Play bağlantısı (`utm_source=youtube`) |
| TikTok | İşletme hesabı | Poyraz Workshop | `@poyrazworkshop` | `profil-800.png`, profil yazısı `metinler.json` › tr › profil | Profil bağlantısı (`utm_source=tiktok`); işletme hesabında takipçi şartı olmayabilir **[K]** |
| Instagram | Profesyonel hesap | Poyraz Workshop | `@poyrazworkshop` | `profil-800.png`, aynı yazı | Profil bağlantısı (`utm_source=instagram`) |

Kullanıcı adı alınmışsa yedekler `@poyraz.workshop` ve `@poyrazworkshopgames` **[K]**.

## 4. İlk 4 hafta

| Hafta | İçerik | Dosya | Metin (`metinler.json`) |
|---|---|---|---|
| 1 | Tanıtım videosu (26 sn): YouTube Shorts, TikTok, Reels | `videolar/hayalet-avcilari-tr.mp4`; 2 gün sonra `-en.mp4` | tr › paylasimlar[0], en › paylasimlar[0] |
| 2 | Boss: aynı videonun 9–16. saniyesi, platformun düzenleyicisinde kırpılır; Instagram'a ayrıca görsel | `../reklam/gorseller/tr/boss-1200x1500.jpg` | paylasimlar[1] |
| 3 | Dünya Turu: videonun 16–23. saniyesi; Instagram'a görsel | `../reklam/gorseller/tr/tur-1200x1500.jpg` | paylasimlar[2] |
| 4 | Arkadaşlarla oyna: Instagram kaydırmalı gönderi | `../magaza/play/telefon-6-arkadaslar.png` ve `../reklam/gorseller/tr/oyun-1200x1500.jpg` | paylasimlar[3] |

- Paylaşım metinleri herkese açık metindir; tam hâlleri `metinler.json`'dadır.
- Paylaşımı kullanıcı kendi hesabından yapar. Bulut oturumu hesaplara giriş yapmaz.
- Dördüncü haftanın sonunda bakılacaklar: izlenme, profil ziyareti, UTM'li yükleme.
- Sonraki dizi: "51 ülkenin bossu". `video.mjs`'e ülke seçeneği eklenerek ülke başına 10 saniyelik kesit üretilebilir
  (istenirse).

## 5. Dosyalar ve üretim

| Dosya | Üretici |
|---|---|
| `videolar/hayalet-avcilari-<dil>.mp4`: 1080×1920, 30 kare/sn, 26 sn; açılış kartı → Yeşil Orman → Mor Şato bossu (yenilir) → Dünya Turu, Türkiye (Efe hayalet) → kapanış kartı ("Google Play'de ücretsiz", "Ara: Hayalet Avcıları"); sessiz ses izi | `node hayalet-avcilari/sosyal/video.mjs [dil…]` (varsayılan tr en; Playwright, Chromium, ffmpeg) |
| `profil/profil-800.png`, `profil/youtube-kapak-2560x1440.png`: rüzgâr çizgileri ve "POYRAZ WORKSHOP" | `node hayalet-avcilari/sosyal/profil.mjs` |
| `metinler.json`: profil yazısı, 4 paylaşım × 2 dil, 6 dilde video kartı | Elle |

Notlar:

- **Video çekimi:**
  - Oyun sanal saatle oynatılır; her kare tam çözünürlükte çekilir.
  - Avcının yükseltmeleri açıktır (hasar ×3, atış hızı ×2). Oyunda bunlar paralarla açılır.
  - Can düşmez. Boss sahnelerinde boss kadrajda sabit tutulur.
  - Kare klasörü `VIDEO_GECICI` ortam değişkeniyle seçilir. `TMPDIR` değiştirilirse Chromium açılmayabilir.
- **Test:** `node --test hayalet-avcilari/sosyal/sosyal.test.mjs`. Denetlenenler:
  - sahibin adı;
  - TikTok profil yazısı ≤80 karakter **[K]**;
  - paylaşım ≤2200 karakter, 1–5 etiket;
  - video ölçüsü ve süresi;
  - profil görsellerinin ölçüsü.

## 6. Sıra

1. **Kullanıcı:** `poyrazworkshop@gmail.com` hesabını "Poyraz Workshop" adıyla açar; 2 adımlı doğrulama açık olur.
2. **Kullanıcı:** iki IAM rolünü verir ([`../site/README.md`](../site/README.md) › Kurulum).
3. **Bulut oturumu:** siteyi yayınlar ve Play'deki adresleri günceller.
4. **Kullanıcı:**
   - YouTube kanalı, TikTok ve Instagram hesaplarını §3'e göre açar.
   - Profil resmi, kapak ve yazıyı yükler.
   - §1'deki ayarları yapar.
5. **Kullanıcı:** §4'e göre paylaşır.

## Kaynaklar

- DSA m.26: https://www.eu-digital-services-act.com/Digital_Services_Act_Article_26.html
- YouTube etiket kuralları: https://support.google.com/youtube/answer/6390658
- TikTok Ticari Müzik Kütüphanesi: https://www.soundstripe.com/blogs/why-can-i-only-use-commercial-sounds-on-tiktok ·
  https://www.socialmediatoday.com/news/tiktok-changes-rules-on-music-usage-by-businesses/577734/
