# Ölçü Kutusu — Google Play (MARFEN) ve App Store yayını: tarayıcı adımları

Hazırlandı: 13 Kasım 2026. Sahip: *"Uygulama MARFEN hesabından yayınlanacak"*, *"işlemler bitince iOS ve Android yayına al"*.
API ile yapılabilen her şeyi bulut oturumu yapar (`mahmuttari/NetcadDevelop` › `olcu-kutusu/` hattı). Aşağıdakiler yalnız
tarayıcıdan yapılabilir: Google ve Apple uygulama kaydı açmaya, taslak uygulamayı incelemeye göndermeye ve AdMob'da
reklam birimi açmaya API vermez. Adımları sahip ya da bilgisayardaki Claude (`claude --chrome`) izler.

| | Değer |
|---|---|
| Ad (Play ve App Store) | Ölçü Kutusu – Terazi, Cetvel (en-US: Measure Box – Level & Ruler) |
| Paket / bundle ID | `com.poyrazworkshop.smartmeasure` (App Store Connect'te kayıtlı; Play'de ilk paketle kalıcı olur) |
| Play hesabı | MARFEN (kuruluş) |
| İletişim · site · gizlilik | `info@marfen.com.tr` · `https://mahmuttari.github.io/Lispler/smart-measure/` · `…/smart-measure/gizlilik.html` |
| AdMob hesabı | `pub-2417242373034448` (Android kimlikleri hazır; iPhone kimlikleri A1'de açılır) |

## Onay satırı (bilgisayardaki oturumun başında sahip yazar; istemediği kalemi siler)

> ONAY: Ölçü Kutusu için şunlara onay veriyorum: 1. AdMob'da iPhone uygulamasının, bir banner ve bir geçiş reklam
> biriminin oluşturulması, IDFA açıklama mesajının yayınlanması ve AB onay mesajına iPhone uygulamasının eklenmesi;
> 2. MARFEN Play Console'da "Uygulama oluştur" formundaki beyan kutuları ve düğmesi; 3. Play Uygulama İmzalama'nın
> Google'ın anahtarıyla kabulü ve ilk paketin TASLAK olarak kaydı; 4. Uygulama içeriği beyanlarının
> `smart-measure/magaza/aciklamalar.md` tablosundaki cevaplarla kaydı ve IARC anketi; 5. App Store Connect'te uygulama
> kaydının açılması, fiyatın Ücretsiz seçilmesi, App Privacy yanıtlarının yayınlanması; 6. (B aşamasında) Play'de
> "İncelemeye gönder" ve App Store Connect'te "Submit for Review". Başka bir şart, ücretli seçenek ya da kutu çıkarsa dur ve sor.

Genel kurallar [`kucuk-uygulamalar-play.md`](kucuk-uygulamalar-play.md) › "Talimat" başındakilerle aynıdır (şifre, kart,
kimlik alanlarını sahibe bırak; tek sekme; beklenmedik kutuda dur ve sor).

## A. Şimdi

0. `git checkout main && git pull`. `https://mahmuttari.github.io/Lispler/smart-measure/gizlilik.html` açılmalı ve içinde
   "MARFEN" ile "iPhone" geçmeli; geçmiyorsa dur (PR birleşmemiş ya da Pages yayını bitmemiştir).
1. **AdMob** (apps.admob.com): Uygulamalar › Uygulama ekle › **iOS** › "henüz listelenmiyor" › ad **Ölçü Kutusu**. Reklam
   birimleri: **Banner** (`Ölçü Kutusu iOS banner`) ve **Geçiş reklamı** (`Ölçü Kutusu iOS geçiş`); ayarlar Android
   birimleriyle aynı ([`kucuk-uygulamalar-play.md`](kucuk-uygulamalar-play.md) §1). Gizlilik ve mesajlaşma: **IDFA açıklama
   mesajı** bu uygulama için yayınlanır; AB onay mesajına bu iPhone uygulaması eklenir. Üç kimliği
   (`ca-app-pub-…~…`, banner `…/…`, geçiş `…/…`) sahibe yaz: gizli değildir, bulut oturumuna sohbetten verilir.
2. **Play Console › MARFEN › Uygulama oluştur:** ad **Ölçü Kutusu – Terazi, Cetvel**, varsayılan dil **Türkçe – tr-TR**,
   **Uygulama**, **Ücretsiz**; beyan kutuları onay satırıyla; "Uygulama oluştur".
3. **İlk paket (taslak):** Test ve yayınla › **Üretim** › Ülkeler/bölgeler: **tümü** › "Yeni sürüm oluştur" › uygulama
   imzalama: Google'ın oluşturduğu anahtar › App bundle: `SmartMeasure.aab`. Dosya: GitHub › `mahmuttari/Lispler` › Actions
   › **Android (Smart Measure)** › `main` dalındaki son başarılı koşu › artifact **SmartMeasure-aab** (içindeki
   `surum.txt`: `versionCode=1`, `admob=ca-app-pub-2417…`; `ca-app-pub-3940…` görünüyorsa YÜKLEME, dur). Paket adı
   `com.poyrazworkshop.smartmeasure`, sürüm `1.0.0 (1)` görünmeli. Sürüm notu: `smart-measure/magaza/surum-notu.txt`.
   "Sonraki" › yalnız **Kaydet**. İncelemeye gönderme.
4. **Hizmet hesabı:** Kullanıcılar ve izinler › `play-yukleme@dwg-pdf-word-goruntuleyici…` hesap düzeyinde yöneticiyse
   bir şey yapma; değilse "Uygulama ekle" › **Ölçü Kutusu**, izinler Master Office'tekiyle aynı (taslak uygulamaları
   düzenleme dahil).
5. **Mağaza ayarları:** kategori **Araçlar**, e-posta `info@marfen.com.tr`, web sitesi yukarıdaki adres › Kaydet.
   **Politika › Uygulama içeriği:** `smart-measure/magaza/aciklamalar.md` › "Google Play – Uygulama içeriği formları"
   tablosu (gizlilik adresi, uygulama erişimi, reklamlar: Evet, IARC, hedef kitle, haber / devlet / finans / sağlık:
   Hayır, reklam kimliği: Evet). **Veri güvenliği formunu atla** (bulut oturumu API ile yazar). Mağaza metni, görseller ve
   abonelik de API ile gelir.
6. **App Store Connect** (appstoreconnect.apple.com) › Apps › "+" › **New App**: platform **iOS**; ad **Ölçü Kutusu –
   Terazi, Cetvel** (alınmışsa dur ve sor); birincil dil **Turkish**; Bundle ID listeden
   `com.poyrazworkshop.smartmeasure`; SKU `olcukutusu-ios`; erişim Full Access.
   - **Pricing and Availability:** fiyat **Free**; bütün ülkeler.
   - **App Privacy:** yanıtlar `smart-measure/magaza/veri-guvenligi.csv` ve `aciklamalar.md` › "Veri güvenliği formu"ndan
     (veriyi yalnız AdMob toplar; uygulamanın kendi verisi telefondan çıkmaz). Yayınlamadan önce sahibe özetle.
   - **App Review Information** (ad, telefon, e-posta): sahip doldurur.
7. Sahibe yaz: **"Ölçü Kutusu A adımları tamam"** ve üç AdMob iPhone kimliği.

Sonra bulut oturumu: Play'de abonelik (`adfree`: aylık + yıllık), mağaza metni, görseller, Veri güvenliği formu; iPhone
için gerçek reklam kimlikleriyle derleme ve yükleme, App Store metinleri, yaş derecesi, abonelikler, ekran görüntüleri.
Bitince "B'ye geçilebilir" der.

## B. Bulut oturumu "B'ye geçilebilir" deyince

1. **Play Console › Ölçü Kutusu:** Kontrol panelinde eksik görev kalmamalı (kalırsa dur ve sahibe yaz) › **Yayınlama genel
   bakışı** › "Değişiklikleri incelemeye gönder".
2. **App Store Connect › Ölçü Kutusu › 1.0.0:** Build › yüklenen yapıyı seç; **In-App Purchases and Subscriptions** › iki
   aboneliği de ekle (`…adfree.monthly`, `…adfree.yearly`); eksik alan uyarısı yoksa **Add for Review** › **Submit for
   Review**. Uyarı varsa dur ve sahibe yaz.
3. Sahibe yaz: **"Ölçü Kutusu incelemeye gönderildi"** (hangi mağaza, saat).

## Neden tarayıcı?

- Play Developer API uygulama oluşturamaz; ilk paket yüklenmeden paketi bulamaz; hiç yayınlanmamış (taslak) uygulamayı
  incelemeye gönderemez.
- App Store Connect API uygulama kaydı açamaz; gizlilik etiketleri (App Privacy) API'de yoktur; bir uygulamanın ilk
  abonelikleri sürüm sayfasından sürümle birlikte gönderilir.
- AdMob API'si uygulama ve reklam birimi oluşturmaz.
