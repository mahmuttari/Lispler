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
| Play hesabı | **Sahip seçer** (A2): Poyraz Workshop (öbür Lispler uygulamaları, kapalı test zorunluluğu yok) ya da MARFEN (kuruluş) |
| Site · gizlilik | `https://letspicky.com` · `https://letspicky.com/gizlilik.html` |
| Destek e-postası | `letspicky/magaza/aciklamalar.md` › "Destek e-postası" |
| app-ads.txt | `https://letspicky.com/app-ads.txt` (`pub-2417242373034448`) |
| AdMob hesabı | `pub-2417242373034448` (Android ve iPhone kimlikleri A1'de açılır) |
| App Store Connect | Apple ID `6834758192`, SKU `letspicky-ios` |
| Kaynak kod | `mahmuttari/Yonetmelik-araclari` › `ortakkarar/` (web: letspicky.com) |

## Durum (14 Kasım 2026)

- **Web** yayında; gizlilik politikası, `app-ads.txt` ve fragman oynatıcısı (`fragman.html`) dahil.
- **Kod:** Lispler#30 ve Yonetmelik-araclari#5 main'e birleşti. `letspicky-android.yml` main'de yeşil
  (koşu 43592891712), ama AAB Google'ın **test** AdMob kimlikleriyle derlendi: Play'e YÜKLENMEZ. Gerçek kimlikler A1'den
  sonra gelir.
- **App Store:** kayıt "Let's Picky: Ortak Karar"; sürüm 1.0.0 `PREPARE_FOR_SUBMISSION`; TestFlight'ta yapı 1 `VALID`
  (reklamlardan önceki yapı; gerçek kimlikli yeni yapı 2 olur). NetcadDevelop koşu 43593690083: sürüm metinleri tr ve
  en-US yeniden yazıldı ("reklam yok" kalktı), yaş derecesi **reklam: Evet**. Ekran görüntüleri tr ve en-US 5'er, tamam.
  `letspicky-ios.yml` artık Lispler **main**'i çeker; macOS işi `cap sync`'ten önce `araclar/kimlik.mjs`'i çalıştırır.
- **Play:** uygulama henüz oluşturulmadı.
- **Veri güvenliği:** `letspicky/magaza/veri-guvenligi.csv` hazır (üretici `letspicky/araclar/veri-guvenligi.mjs`; tablo
  kaynak depodaki `ortakkarar/store/play-veri-guvenligi.md` ile aynı). Uygulamanın kendi verisi (takma ad, oylar ve
  tepkiler, "Kendin Yaz" seçenekleri, anonim Firebase kimliği, yaklaşık konum) toplanır, paylaşılmaz; AdMob'un verisi
  (yaklaşık konum, cihaz kimliği, etkileşimler, teşhis, kilitlenme günlükleri) toplanır ve paylaşılır.

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
   2. **Test ve yayınla › Üretim › Sürümler:** taslak **1.0.0 (1)** görünmeli. Başka sürüm kodu varsa dur.
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
