# Let's Picky — Google Play ve App Store yayını: tarayıcı adımları

Hazırlandı: 14 Kasım 2026. Sahip: *"tamam yayınla"*, *"GitHub üzerinden yayınla"*.
API ile yapılabilen her şeyi bulut oturumu yapar: Play işleri bu depodaki `letspicky/play-istek.txt` →
`.github/workflows/play-letspicky.yml`, App Store işleri `mahmuttari/NetcadDevelop` › `.github/letspicky-istek.txt` →
`letspicky-ios.yml` (dal `claude/letspicky-ios`). Aşağıdakiler yalnız tarayıcıdan yapılabilir (bkz. "Neden tarayıcı?").
Adımları sahip ya da bilgisayardaki Claude (`claude --chrome`) izler.

| | Değer |
|---|---|
| Ad | Play: **Let's Picky** · App Store: **Let's Picky: Ortak Karar** (kayıtta bu ad var) |
| Paket / bundle ID | `com.mahmuttari.letspicky` (App Store Connect'te kayıtlı; Play'de ilk paketle kalıcı olur) |
| Play hesabı | **MARFEN** (kuruluş hesabı; sahip 17 Kasım 2026'da seçti; kapalı test zorunluluğu yok) |
| Site · gizlilik | `https://letspicky.com` · `https://letspicky.com/gizlilik.html` |
| Destek e-postası | `letspicky/magaza/aciklamalar.md` › "Destek e-postası" |
| app-ads.txt | `https://letspicky.com/app-ads.txt` (`pub-2417242373034448`) |
| AdMob hesabı | `pub-2417242373034448` (Android ve iPhone kimlikleri A1'de açılır) |
| App Store Connect | Apple ID `6834758192`, SKU `letspicky-ios` |
| Kaynak kod | `mahmuttari/Yonetmelik-araclari` › `ortakkarar/` (web: letspicky.com) |

## Durum (19 Kasım 2026)

- **Yeni sürüm (sahip "Planı uygula"):** `letspicky/www` Yonetmelik-araclari main 7df533a ile eş (Lispler#48): yeni
  simge ve açılış ekranı (Android mipmap/splash, iOS AppIcon/Splash da), ana sayfa düzeni, ChatGPT arayüz önerileri,
  "Nerede Ne Yenir?" düzeltmesi, 15 yeni kart görseli. Android sürüm kodu 2'ye çıktı (Lispler#49; sürüm 1.0.0), çünkü
  önceki bütün AAB'ler versionCode 1 idi.
- **App Store:** 1.0.0 (7) Lispler main af16586'dan derlendi, TestFlight'ta (VALID; NetcadDevelop koşu 44490615618).
  İncelemeye gönderilmedi: 1.0.0 reddedildi (4796162f, Guideline 4.3 ve 4.2.6), sahip Apple'a yanıt verdi. Yapı 7
  sürüme Apple'ın yanıtından sonra ve sahibin açık onayıyla bağlanır.
- **Play (13:00 UTC):** uygulama hizmet hesabına görünüyor (`durum`, koşu 44527903832). Sahibin A3 paketi üretimde
  "1 (1.0.0)" taslağıydı. Sahip "AAB'leri kendin yükle" dedi. Koşu 44528933559:
  - `yukle uygula`: versionCode 2 (13,0 MB, derleme koşusu 44491518500, içerik main c0ed131 ile aynı) yüklendi. Üretim
    taslağı artık **1.0.0 (2)**. versionCode 1 paketi Play'de kalır, kanalda değil.
  - `magaza uygula`: tr-TR "Let's Picky: Ortak Karar", en-US "Let's Picky: Decide Together", e-posta, web sitesi.
  - `gorsel uygula`: iki dilde simge, öne çıkan görsel ve 5 telefon ekran görüntüsü.
  - `veriguvenligi uygula`: Veri güvenliği formu yazıldı (`letspicky/magaza/veri-guvenligi.csv`).
  - İncelemeye gönderilmedi. API taslak uygulamayı gönderemez: gönderim B adımında, Play Console'dan yapılır.
- **Huawei:** AppGallery Connect'e elle yükleme: aynı koşunun "LetsPicky-aab" ya da "LetsPicky-apk" dosyası. Depoda
  AppGallery yükleme aracı yok. Kendiliğinden yükleme için sahip AppGallery Connect'te bir API istemcisi açar ve
  kimliğini ile gizlisini Lispler'in GitHub sırlarına ekler. Sonra iş akışı yazılır.
- **Web:** letspicky.com, Yonetmelik-araclari main'e birleşince "Let's Picky Web" iş akışıyla kendiliğinden yayımlanır
  (CLOUDFLARE_API_TOKEN sırrı 18 Kasım'da eklendi).

## Durum (18 Kasım 2026)

- **App Store:** Apple 1.0.0 (6)'yı **reddetti** (16 Kasım 16:00 UTC). Sürüm `REJECTED`, gönderim 4796162f
  `UNRESOLVED_ISSUES`, öğe `REJECTED` (NetcadDevelop koşu 44200752736). Apple e-postasında gerekçe yok. Gerekçe yalnız App
  Store Connect › App Review sayfasındadır (API'de yok). Gerekçe (sahibin ekran görüntüsü, 18 Kasım): **Guideline 4.3
  Spam (4.3(a), 4.3(b)) ve 4.2.6 App Generation Services**. Apple: önemli değişiklik olmadan yeniden gönderme; uygulama
  kurallara uyuyorsa iletiye yanıt ver ve 9 soruyu eksiksiz cevapla. Aynı saatte Huhu Yolu ve Ölçü Kutusu da reddedildi
  (hesap düzeyinde bir örüntü olası). Yol: yeniden gönderim yok; sahip 9 soruya yanıtı App Store Connect › App Review ›
  "Reply to App Review" ile gönderir (API'de yanıt yok). Yeni yapı (7) Apple'ın cevabından sonra, sahibin onayıyla.
- **Play:** sahip MARFEN (kuruluş) hesabını seçti. `durum` (koşu 44200770492) yine 404 "Package not found": uygulama
  MARFEN'de yok ya da hizmet hesabı davetli değil. A2, A3 ve A4 bekleniyor. A3'te yüklenecek AAB: Lispler main 170f860,
  "Android (Let's Picky)" koşu 44070965153, artifact **LetsPicky-aab** (`versionCode=1`, `versionName=1.0.0`,
  `admob=ca-app-pub-2417242373034448~3719379342`; 17 Aralık 2026'ya kadar indirilebilir).
- **Web ve uygulama içeriği (18 Kasım):** animasyonlar (Karar Kavanozu, Kâhin küresi, turnuva kupası, kart dönüşü,
  3-2-1, zıplayan harita iğnesi) ve GPT ile yenilenen 8 deste kapağı ile 46 kart görseli letspicky.com'da
  (Yonetmelik-araclari#73). `letspicky/www` bu dist ile eşlendi (`reklam-kimlik.json` korundu). Kalan 48 kart görseli
  OpenAI kredisi eklenince yenilenir.
- **Play (18 Kasım, sahip):** uygulama MARFEN'de görünmüyor, hizmet hesabı tanımlı. Yani A2 (uygulama oluşturma) ve A3 (ilk
  AAB taslağı) bekleniyor. Play komutları beklemeye alındı (`play-istek.txt`).
- **Play (18 Kasım):** sahip uygulamayı ve ilk AAB'yi MARFEN'de oluşturduğunu, hizmet hesabına hesap düzeyinde yönetici
  yetkisi verdiğini söyledi. `durum` (koşu 44230090982) yine 404 "Package not found"; yazma komutları çalışmadı. Olası
  nedenler: hizmet hesabı izninin yayılması (saatler sürebilir) ya da ilk paketin henüz kaydedilmemiş olması.

## Durum (14 Kasım 2026)

- **Son durum (20:28 UTC):** App Store'da **1.0.0 (6) incelemede** (`WAITING_FOR_REVIEW`, gönderim 4796162f, NetcadDevelop
  koşu 43637652154; yayın elle). Yapı 6 Lispler main 31fdd4f'ten: ITMS-91064 düzeltmesi (Lispler#40), mekân bulucu ve
  yeni puanlar (Lispler#41 = ortakkarar#42: Google Maps puanı, yorum sayısı, açık / kapalı, fiyat düzeyi; film
  önerilerinde IMDb puanı ve bağlantısı). Reddedilen 1.0.0 (3) gönderimi iptal edildi; yapı 4 ve 5 gönderilmedi.
  Web aynı sürümle önce yayınlandı (NetcadDevelop "Let's Picky Web" koşusu 43637014883: `/api/places` 200; Worker alan
  maskesi yalnız id, ad, adres, konum, puan, yorum sayısı, açık mı, fiyat düzeyi — photos / reviews / editorialSummary
  yok). Play'e yüklenecek AAB: Lispler main 31fdd4f'ten sonraki "LetsPicky-aab".

- **Mekân bulucu (son yayın):** Yonetmelik-araclari#38 ve #39 main'de (`de82ca2`). Sonuç ekranında yakın mekânlar önce
  sunucumuz üzerinden Google Places'ten (`letspicky.com/api/places`; Google anahtarı Worker gizli değeri), yanıt yoksa
  OpenStreetMap'ten (Overpass, Photon; uzak aramada Nominatim) gelir. Konum servislere 2 ondalık yuvarlanmış gider,
  mesafe gerçek konumla hesaplanır; Google sonuçlarında "Google Maps" atfı. `letspicky/www` bu dist ile eşlendi
  (`reklam-kimlik.json` korundu).
- **Web (14 Kasım 2026, 18:52 UTC):** yeni sürüm letspicky.com'da; `/api/places` 200 (20 mekân), kökensiz istek 403,
  canlı `index.html` = `letspicky/www`. Yükleme ve doğrulama NetcadDevelop › `claude/letspicky-ios` › "Let's Picky Web
  (Cloudflare)" iş akışıyla (`.github/letspicky-web-istek.txt`: `dogrula`, `yayinla`, `tani`); Cloudflare belirteci o
  depodadır, web dosyaları buradaki `letspicky/www`'den alınır. `GOOGLE_MAPS_API_KEY` panelden **Text** türünde eklendi;
  ilk yükleme yalnız Secret koruduğu için onu düşürmüştü, Yonetmelik-araclari#40'tan beri Text de korunur. Secret'a
  çevrilmesi önerilir.
- **Web (önceki):** gizlilik politikası, `app-ads.txt` ve fragman oynatıcısı (`fragman.html`) dahil.
- **Kod:** Lispler#30 ve Yonetmelik-araclari#5 main'e birleşti. `letspicky-android.yml` main'de yeşil
  (koşu 43592891712), ama AAB Google'ın **test** AdMob kimlikleriyle derlendi: Play'e YÜKLENMEZ. Gerçek kimlikler A1'den
  sonra gelir.
- **App Store (14 Kasım 2026, 16:58 UTC):** Apple **1.0.0 (3)'ü reddetti**: sürüm `INVALID_BINARY`, gönderim 39eae3e3
  `UNRESOLVED_ISSUES`, öğe `REJECTED` (NetcadDevelop koşu 43618492501). Gerekçe (Apple e-postası, yapı 2 ve 3):
  **ITMS-91064 Invalid tracking information**: `PrivacyInfo.xcprivacy`'de `NSPrivacyTracking` true iken
  `NSPrivacyTrackingDomains` boştu (Apple kuralı iki yönlü: biri varsa öteki de). Düzeltme: Google Mobile Ads SDK
  13.11.0'ın kendi bildirimi gibi `NSPrivacyTracking` false, alan adı yok; izleme veri türü düzeyinde (Device ID,
  tracking: true) ve ATT izni (`NSUserTrackingUsageDescription`) aynen. Reklam alan adlarını izleme alanı yazmak, izin
  vermeyen kullanıcıda iOS'un reklam isteklerini engellemesine yol açardı. `test/reklam.test.mjs` kuralı sınar. Yapı 4 de
  eski bildirimle derlendi, gönderilmez; düzeltilmiş yapı 5 yüklenir. Mekân bulucuyu içeren **1.0.0 (4)** Lispler main
  e531fbe'den yüklendi ve VALID (TestFlight; NetcadDevelop koşu 43623752030). Yeniden gönderim (`gonder letspicky
  uygula`) ret gerekçesi okunduktan sonra, yalnız sahibin açık onayıyla.
- **App Store (önceki):** 1.0.0 (3) incelemeye gönderilmişti (`WAITING_FOR_REVIEW`, NetcadDevelop koşu 43600776460). Yapı 3 Lispler
  main 2e05246'dan derlendi: Karar Kavanozu, 94 kartın Recraft görseli, kavanoz simgesi; metinler ve iPhone ekran
  görüntüleri yenilendi. Eski görsellerle gönderilen 1.0.0 (2) sahibin onayıyla incelemeden çekildi (`gonder.mjs iptal`).
  Yayın elle: onaydan sonra satışa açma yalnız sahibin açık onayıyla. App Privacy, fiyat ve inceleme bilgileri tarayıcıdan
  yapıldı (A6 tamam).
- **App Store (ilk durum):** kayıt "Let's Picky: Ortak Karar"; sürüm 1.0.0 `PREPARE_FOR_SUBMISSION`; TestFlight'ta yapı 1 `VALID`
  (reklamlardan önceki yapı; gerçek kimlikli yeni yapı 2 olur). NetcadDevelop koşu 43593690083: sürüm metinleri tr ve
  en-US yeniden yazıldı ("reklam yok" kalktı), yaş derecesi **reklam: Evet**. Ekran görüntüleri tr ve en-US 5'er, tamam.
  `letspicky-ios.yml` artık Lispler **main**'i çeker; macOS işi `cap sync`'ten önce `araclar/kimlik.mjs`'i çalıştırır.
- **Play:** uygulama henüz oluşturulmadı (`durum`, koşu 43594104222 ve 43600437026: 404 "Package not found"). A3'te
  yüklenecek AAB, mekân bulucu eşlemesinden SONRAKİ main koşusunun "LetsPicky-aab"ıdır (Actions › Android (Let's Picky) ›
  main); daha eski AAB'yi yüklemeyin (versionCode 1 bir kez kullanılır).
- **AdMob:** gerçek kimlikler main'de (Lispler#36); A1 tamam.
- **Veri güvenliği:** `letspicky/magaza/veri-guvenligi.csv` hazır (üretici `letspicky/araclar/veri-guvenligi.mjs`; tablo
  kaynak depodaki `ortakkarar/store/play-veri-guvenligi.md` ile aynı). Uygulamanın kendi verisi (takma ad, oylar ve
  tepkiler, "Kendin Yaz" seçenekleri, anonim Firebase kimliği, yaklaşık konum) toplanır, paylaşılmaz; AdMob'un verisi
  (yaklaşık konum, cihaz kimliği, etkileşimler, teşhis, kilitlenme günlükleri) toplanır ve paylaşılır. Nominatim ve
  sunucumuz üzerinden Google Places yeni veri türü getirmez (yuvarlanmış konum zaten beyanlı; hizmet sağlayıcı, paylaşım
  değil); CSV değişmedi, `--denetle` temiz.

## Onay satırı (bilgisayardaki oturumun başında sahip yazar; istemediği kalemi siler)

> ONAY: Let's Picky için şunlara onay veriyorum: 1. AdMob'da Android ve iPhone uygulamalarının, her birine banner, geçiş
> ve ödüllü reklam biriminin oluşturulması, IDFA açıklama mesajının yayınlanması ve AB onay mesajına iki uygulamanın
> eklenmesi; 2. reklam kimliklerinin Lispler main'e birleştirilmesi; 3. ……… Play Console hesabında "Uygulama oluştur"
> formundaki beyan kutuları ve düğmesi; 4. Play Uygulama İmzalama'nın Google'ın anahtarıyla kabulü ve ilk paketin TASLAK
> olarak kaydı; 5. hizmet hesabına bu uygulamanın izinlerinin verilmesi; 6. Uygulama içeriği beyanlarının aşağıdaki A5
> tablosundaki cevaplarla kaydı ve IARC anketi; 7. App Store Connect'te fiyatın Ücretsiz seçilmesi, App Privacy
> yanıtlarının yayınlanması ve inceleme bilgilerindeki "Sign-in required" kutusunun kaldırılması; 8. (B aşamasında)
> Play'de "İncelemeye gönder" ve App Store Connect'te "Submit for Review". Başka bir şart, ücretli seçenek ya da kutu
> çıkarsa dur ve sor.

Genel kurallar [`kucuk-uygulamalar-play.md`](kucuk-uygulamalar-play.md) › "Talimat" başındakilerle aynıdır (şifre, kart,
kimlik alanlarını sahibe bırak; tek sekme; beklenmedik kutuda dur ve sor).

## A. Şimdi

0. `git checkout main && git pull`. `https://letspicky.com/gizlilik.html` ve `https://letspicky.com/app-ads.txt` açılmalı.
1. **AdMob** (apps.admob.com, yayıncı `pub-2417242373034448`): Uygulamalar › Uygulama ekle › **Android** › "henüz
   listelenmiyor" › ad **Let's Picky**; aynısını **iOS** için. Her uygulamaya üç reklam birimi (ayarlar varsayılan; sıklığı
   uygulama kendisi sınırlar):
   - **Banner** (`Let's Picky banner`): sonuç ekranının altında.
   - **Geçiş reklamı** (`Let's Picky geçiş`): sonuçtan ana sayfaya dönerken, seyrek.
   - **Ödüllü** (`Let's Picky ödüllü`): "Reklam İzle, Desteyi Aç"; ödül 1, ad "deste".

   Gizlilik ve mesajlaşma: **IDFA açıklama mesajı** iPhone uygulaması için yayınlanır; **AB onay mesajına** iki uygulama
   eklenir (diller Türkçe ve İngilizce, gizlilik adresi yukarıda). Sekiz kimliği (`ca-app-pub-2417242373034448~…` ve
   `…/…`) oturuma yaz: gizli değildir, sohbetten verilir.
2. **Play Console › (seçilen hesap) › Uygulama oluştur:** ad **Let's Picky**, varsayılan dil **Türkçe – tr-TR**,
   **Uygulama**, **Ücretsiz**; beyan kutuları onay satırıyla; "Uygulama oluştur". Kişisel ve yeni bir hesapsa üretimden
   önce 14 gün ve 12 test kullanıcılı kapalı test istenir: o zaman dur ve sahibe sor.
3. **İlk paket (taslak):** bulut oturumu "AAB hazır" deyince. Test ve yayınla › **Üretim** › Ülkeler/bölgeler: **tümü** ›
   "Yeni sürüm oluştur" › uygulama imzalama: Google'ın oluşturduğu anahtar › App bundle: `LetsPicky.aab`. Dosya: GitHub ›
   `mahmuttari/Lispler` › Actions › **Android (Let's Picky)** › `main` dalındaki son başarılı koşu › artifact
   **LetsPicky-aab** (içindeki `surum.txt`: `versionCode=1`, `admob=ca-app-pub-2417…`; `ca-app-pub-3940…` görünüyorsa
   YÜKLEME, dur). Paket adı `com.mahmuttari.letspicky`, sürüm `1.0.0 (1)` görünmeli. Sürüm notu:
   `letspicky/magaza/surum-notu.txt`. "Sonraki" › yalnız **Kaydet**. İncelemeye gönderme.
4. **Hizmet hesabı:** Kullanıcılar ve izinler › `android/play-kimlik.env`'deki `PLAY_SERVICE_ACCOUNT` hesap düzeyinde
   yöneticiyse bir şey yapma; değilse "Uygulama ekle" › **Let's Picky**, izinler öbür uygulamalardakiyle aynı (taslak
   uygulamaları düzenleme dahil).
5. **Mağaza ayarları:** kategori **Yaşam tarzı**, e-posta ve web sitesi yukarıdaki tablodan › Kaydet.
   **Politika › Uygulama içeriği:**

   | Form | Cevap |
   |---|---|
   | Gizlilik politikası | `https://letspicky.com/gizlilik.html` |
   | Uygulama erişimi | Bütün işlevler kısıtlamasız (giriş, hesap ya da kod yok) |
   | Reklamlar | **Evet**, uygulamada reklam var |
   | İçerik derecelendirmesi (IARC) | Kategori: Eğlence (oyun değil). Şiddet, cinsellik, küfür, uyuşturucu, kumar yok. Kullanıcılar etkileşir: **Evet**; oda içinde yalnız takma ad, "Kendin Yaz" seçenekleri (kaba söz süzgecinden geçer) ve 5 hazır emoji tepkisi görünür; sohbet, mesaj ve fotoğraf yok. Konum başka kullanıcılarla paylaşılmaz. Dijital satın alma yok. |
   | Hedef kitle | **13 yaş ve üstü** (13–15, 16–17, 18+); çocuklara hitap: Hayır |
   | Haber, devlet, finans, sağlık uygulaması | Hayır |
   | Reklam kimliği | Evet: Reklam veya pazarlama, Analiz (AdMob) |
   | Veri güvenliği | **Atla**: bulut oturumu API ile yazar (`veriguvenligi uygula`) |

6. **App Store Connect** (appstoreconnect.apple.com) › Apps › **Let's Picky: Ortak Karar**:
   - **Pricing and Availability:** fiyat **Free**; bütün ülkeler.
   - **App Privacy:** `ortakkarar/store/play-veri-guvenligi.md` › "App Store: Uygulama Gizliliği" tablosu. Veri toplanır:
     Evet; izleme: Evet (yalnız Aygıt Kimliği, izleme izniyle). Kullanıcı Kimliği, Diğer Kullanıcı İçeriği ve Kaba Konum
     → Uygulama İşlevselliği, kullanıcıya bağlı değil, izleme yok. Aygıt Kimliği → Üçüncü Taraf Reklamcılık, izleme.
     Ürün Etkileşimi → Üçüncü Taraf Reklamcılık ve Analiz. Diğer Teşhis Verileri → Üçüncü Taraf Reklamcılık.
     Yayınlamadan önce sahibe özetle.
   - **App Review Information:** "Sign-in required" kutusu kaldırılır. İnceleme notu: *"Hesap gerekmez. Tek cihazda denemek
     için ana ekranda 'Tek Başıma Karar Ver' seçilir."* Ad, telefon, e-posta: sahip doldurur.
7. Sahibe ve bulut oturumuna yaz: **"Let's Picky A adımları tamam"**, sekiz AdMob kimliği ve seçilen Play hesabı.

Sonra bulut oturumu: kimlikleri `letspicky/android/gradle.properties` ve `letspicky/ios/admob.properties`'e yazar,
`node letspicky/araclar/kimlik.mjs` ve testler, PR ve (sahibe sorarak) main'e birleştirme → gerçek kimlikli AAB ("AAB
hazır", A3) ve iPhone yapı 2 (`yukle letspicky`, önkontrol test kimliğini reddeder). Play'de `durum`, `magaza uygula`,
`gorsel uygula`, `veriguvenligi uygula`. Bitince "B'ye geçilebilir" der.

## B. Bulut oturumu "B'ye geçilebilir" deyince

1. **Play Console › Let's Picky** (tek sekme):
   1. **Kontrol paneli** › "Uygulamanızı ayarlayın": bütün görevler tamam olmalı. Açık görev varsa dur, adını sahibe yaz.
   2. **Test ve yayınla › Üretim › Sürümler:** taslak **1.0.0 (2)** görünmeli (19 Kasım'da API ile 1.0.0 (1)'in yerine
      kondu). Başka sürüm kodu varsa dur.
   3. **Sürümü düzenle › Sonraki.** Önizlemede kırmızı hata varsa dur. Sarı uyarılar gönderimi engellemez; sahibe yaz.
   4. **Kaydet** › **Yayınlama genel bakışı** › "Değişiklikleri incelemeye gönder" › onay penceresinde gönder.
2. **App Store Connect:** sürüm 1.0.0 › Build: **2** (gerçek kimlikli yapı) › Add for Review › **Submit for Review**.
   (Ya da bulut oturumu `olcu-kutusu/gonder.mjs`'in letspicky uyarlamasıyla API'den gönderir; yalnız onay satırının 8.
   kalemiyle.)
3. Sahibe yaz: **"Let's Picky incelemeye gönderildi"** (hangi mağaza, saat) ve sarı uyarılar.

## Neden tarayıcı?

- Play Developer API uygulama oluşturamaz; ilk paket yüklenmeden paketi bulamaz; hiç yayınlanmamış (taslak) uygulamayı
  incelemeye gönderemez. Uygulama içeriği beyanları ve IARC anketi API'de yoktur.
- App Store Connect API uygulama kaydı açamaz; gizlilik etiketleri (App Privacy) API'de yoktur.
- AdMob API'si uygulama ve reklam birimi oluşturmaz.
