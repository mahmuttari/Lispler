# Smart Measure — mağaza metinleri

`android/play.mjs magaza` (`PLAY_UYGULAMA=smartmeasure`) bu dosyadan "Uygulama adı", "Destek e-postası", "Gizlilik
politikası" satırlarını ve "Kısa açıklama" / "Uzun açıklama" bölümlerini okur (ad ≤30, kısa ≤80, uzun ≤4000 karakter).
Web sitesi adresi gizlilik politikası adresinden çıkarılır. İngilizce metin [`diller/en-US.md`](diller/en-US.md)'dedir
(aynı biçim + "Sürüm notu" bölümü, ≤500 karakter). Metin kuralları: başka marka adı yok, uydurma puan ya da kullanıcı
sayısı yok, açıklamada fiyat yok, adda emoji, büyük harfle yazılmış sözcük, "en iyi" ya da "ücretsiz" yok; doğruluk ve
reklamlar açıkça anlatılır (`test/magaza.test.mjs` denetler).

## Ortak

- **Uygulama adı:** Smart Measure – Ölçüm Araçları
- **Geliştirici adı:** Poyraz Workshop
- **Paket adı:** `com.poyrazworkshop.smartmeasure`
- **Tür ve kategori:** Uygulama · Araçlar
- **Hedef kitle:** 13-15, 16-17, 18 ve üzeri (13 altı seçilmez)
- **Gizlilik politikası:** https://mahmuttari.github.io/Lispler/smart-measure/gizlilik.html
- **Destek e-postası:** mahmuttari@gmail.com
- **Mağaza dilleri:** tr-TR (varsayılan), en-US — uygulamanın iki diliyle bire bir
- **Abonelik:** `adfree` (temel planlar `monthly`, `yearly`) — fiyatlar ve Console adımları [`fiyatlandirma.md`](fiyatlandirma.md)

## Kısa açıklama

Su terazisi, ekran cetveli, açıölçer, kamerayla mesafe, ses ve ışık ölçer.

## Uzun açıklama

Smart Measure, telefonunun sensörleriyle ölçen çok amaçlı bir araç kutusudur: su terazisi, ekran cetveli, açıölçer, kamerayla mesafe ve yükseklik ölçümü, ses ölçer ve ışık ölçer tek uygulamada. Her aracın ne kadar doğru olduğu açıkça yazar; kalibrasyon merkezinde her birini kendi telefonuna göre ayarlarsın.

📐 SU TERAZİSİ
• Yüzey, çizgi ve dikey kip: rafı, tabloyu, kapı kasasını hizala.
• Derece ya da yüzde eğim; hedef açıya gelince titreşim ve ses (tolerans ±0,1° ile ±2° arası).
• Ters çevirme yöntemiyle iki adımlı kalibrasyon ve "mevcut açıyı sıfır kabul et".

📷 KAMERAYLA ÖLÇÜM
• Zemindeki iki nokta arası mesafe, bir nesnenin yüksekliği ve genişliği.
• Kameranın yönü ve telefonu tuttuğun yükseklikle trigonometri; her sonuç tahmini belirsizliğiyle (±) gösterilir.
• El feneri ve tam ekran görünüm. Kamera görüntüsü yalnız ekranda gösterilir; kaydedilmez, gönderilmez.

📏 EKRAN CETVELİ VE AÇIÖLÇER
• İki kılavuzla milimetre, santimetre ya da inç; uzun ölçümler için tam ekran dikey cetvel.
• Banka kartıyla bir kez kalibre et: telefonun bildirdiği piksel yoğunluğu %1–2 sapabilir.
• Açıölçer: iç ve dış açı, 0,5° adım, açıyı kilitle.

🔊 SES ÖLÇER
• A-ağırlıklı ses düzeyi: anlık, ortalama ve en yüksek değer; son dakikanın grafiği.
• Referans bir ses ölçerle kalibre edince dB(A) olarak gösterir; fısıltıdan konsere ses düzeyleri ve uzun süre maruz kalmada işitme için bilgi verir.
• Mikrofon yalnız ses düzeyini hesaplamak için açılır; hiçbir şey kaydedilmez.

💡 IŞIK ÖLÇER
• Ortam ışığı lux olarak; ortalama ve en yüksek değer.
• Çalışma masası (300–500 lux önerilir) ve iç mekân bitkileri için yorum.

🕘 GEÇMİŞ VE FAVORİLER
• Kopyaladığın ya da tamamladığın ölçümler yalnız bu telefonda saklanır; kopyala, paylaş, temizle.
• Sık kullandığın araçları yıldızla, ana sayfadan tek dokunuşla aç.

🎨 Açık ve koyu tema · Türkçe ve İngilizce · metrik ve İngiliz birimleri

🔒 GİZLİLİK
• Hesap yok, sunucumuz yok. Geçmişin, favorilerin ve kalibrasyonların yalnız telefonunda durur.
• Kamera görüntüsü ve mikrofon sesi yalnız telefonda işlenir; kaydedilmez, saklanmaz, gönderilmez. Uygulama internete yalnız reklam ve Google Play aboneliği için çıkar.

ℹ️ BİLMEN GEREKENLER
• Telefon sensörleri laboratuvar aleti değildir. Su terazisi tipik olarak ±0,2° ile ±0,5° arası doğrudur; kamerayla ölçüm tipik olarak %3–10 doğrudur (düz zemin ve aynı yükseklikte sabit tutulan telefon varsayılır; lazer ya da derinlik sensörü kullanılmaz).
• Telefon mikrofonları ölçüm mikrofonu değildir: kalibrasyon olmadan ses düzeyi yalnız göreli (dBFS) gösterilir. Ses ve ışık değerlerini hukuki ya da iş güvenliği kararlarında kullanma.
• Işık sensörleri telefonlar arasında yaklaşık %20–30 farklı ölçebilir.
• Telefonunda bir sensör yoksa (ör. ışık sensörü) ilgili araç bunu söyler; diğer araçlar çalışır.

Uygulama reklamlıdır: ekranın altında bir reklam bandı vardır; tam ekran reklam yalnız bir araçtan çıkarken gelir, en sık 4 dakikada bir ve saatte en çok 6 kez; ölçüm sürerken, kamera ya da mikrofon açıkken asla. İsteğe bağlı reklamsız abonelik bütün reklamları kaldırır ve Google Play'den istediğin zaman iptal edilebilir.

## Google Play – Uygulama içeriği formları

| Bölüm | Cevap |
|---|---|
| Gizlilik politikası | yukarıdaki adres |
| Uygulama erişimi | Tüm işlevler özel erişim olmadan kullanılabilir (hesap yok, giriş yok). İnceleme notu: kamerayla ölçüm kamera iznini, ses ölçer mikrofon iznini ister; ikisi de ekrandaki düğmeyle ve nedeni yazılarak istenir. Sensörü olmayan cihazda araç "sensör yok" der |
| Reklamlar | **Evet**, reklam içeriyor (Google AdMob: altta uyarlanabilir banner + yalnız bir araçtan çıkarken geçiş reklamı; en yüksek reklam içerik derecesi **G**; reklamsız abonede reklam SDK'sı hiç başlatılmaz) |
| İçerik derecelendirmesi (IARC) | Kategori: **Yardımcı program, üretkenlik, iletişim veya diğer**. Şiddet, cinsellik, küfür, uyuşturucu, kumar, kaba mizah: **Hayır**. Kullanıcılar birbiriyle etkileşir / içerik paylaşır: **Hayır**. Kullanıcının konumunu paylaşır: **Hayır**. Dijital ürün satın alma: **Evet** (reklamsız abonelik). Kısıtlamasız internet erişimi (tarayıcı, arama motoru): **Hayır** |
| Hedef kitle | 13-15, 16-17, 18 ve üzeri · "Çocuklara hitap ediyor mu?" sorusuna **Hayır** (Aileler programına girilmez) |
| Haber uygulaması · Devlet uygulaması | Hayır · Hayır |
| Finans özellikleri · Sağlık özellikleri | Yok · Yok (ses ölçer bilgi amaçlıdır, tıbbi cihaz değildir; işitme güvenliği notu yalnız genel bilgidir) |
| Reklam kimliği | **Evet** — amaç: **Reklam veya pazarlama**, **Analiz**, **Dolandırıcılığı önleme, güvenlik ve uygunluk** (AdMob SDK'sı `AD_ID` iznini ekler) |
| Hesap silme | Uygulamada hesap oluşturulamaz (bölüm "hesap yok" olarak geçilir) |
| Ön plan hizmeti / konum / tam ekran amaç izinleri | Yok. AdMob'un getirdiği WorkManager'ın `FOREGROUND_SERVICE` izni ve `SystemForegroundService`'i manifestte kaldırılmıştır (uygulama ön plan hizmeti çalıştırmaz); konum izni istenmez |
| Kamera ve mikrofon | Yalnız ön planda, kullanıcı aracı açıp izin verince; arka planda hiçbir zaman. Kısıtlı izin değildir, ayrı beyan istenmez |

### Veri güvenliği formu

- Veri toplanıyor ya da paylaşılıyor mu: **Evet** (yalnız AdMob). Aktarımda şifreleniyor mu: **Evet** (AdMob TLS kullanır;
  `usesCleartextTraffic="false"`). Silme isteği yolu: **Hayır** (aşağıda).
- Hesap oluşturma: **Uygulamam kullanıcıların hesap oluşturmasına izin vermiyor.**
- Uygulamanın kendi verisi (geçmiş, favoriler, kalibrasyonlar, ayarlar) **cihazdan çıkmaz**; Google'ın tanımında cihazda
  kalan veri "toplanmış" sayılmaz. Ayarlar › Tüm verileri sil hepsini siler.
- **Kamera görüntüsü ve mikrofon sesi** yalnız bellekte, ekranda gösterilmek (kamera) ya da ses düzeyi hesaplanmak
  (mikrofon, 100 ms'lik bloklar) için işlenir; kaydedilmez, saklanmaz, hiçbir yere gönderilmez. Cihazdan çıkmayan veri
  "toplama" değildir: "Fotoğraflar ve videolar" ile "Ses dosyaları" beyan edilmez. Sensör değerleri (eğim, ışık) de
  cihazda kalır.
- Abonelik: uygulama Google Play'e telefondaki satın almaları sorar ve "abone mi?" kararını yalnız cihazda verir; satın
  alma bilgisi uygulamadan dışarı gönderilmez. Ödeme bilgisini Google Play kendisi toplar, uygulama görmez. Bu yüzden
  "Satın alma geçmişi" ve "Finans bilgisi" beyan edilmez.
- Cihazdan çıkan tek akış AdMob'dur. Geliştiricinin elinde veri olmadığından silme isteği yolu sunulmaz.

| Veri türü | Kim | Toplanıyor · paylaşılıyor | İsteğe bağlı | Amaç |
|---|---|---|---|---|
| Konum › Yaklaşık konum | AdMob (IP adresinden) | Evet · **Evet** | Hayır | Reklam veya pazarlama, Analiz, Dolandırıcılığı önleme |
| Uygulama etkinliği › Uygulama etkileşimleri | AdMob: açılış, dokunma, reklam izleme | Evet · **Evet** | Hayır | Reklam veya pazarlama, Analiz, Dolandırıcılığı önleme |
| Uygulama bilgileri ve performans › Teşhis | AdMob: uygulamanın ve SDK'nın başarımı | Evet · **Evet** | Hayır | Reklam veya pazarlama, Analiz, Dolandırıcılığı önleme |
| Cihaz veya diğer kimlikler | AdMob: reklam kimliği, uygulama grubu kimliği | Evet · **Evet** | Hayır | Reklam veya pazarlama, Analiz, Dolandırıcılığı önleme |

Hiçbir türde "geçici işleme" yoktur. Ad, e-posta, kullanıcı kimliği, kişiler, fotoğraf, video, ses kaydı, mesaj, finans,
satın alma geçmişi, sağlık, dosya, tarama geçmişi, kilitlenme günlüğü, hassas konum: **toplanmıyor**.

"İsteğe bağlı: Hayır" ihtiyatlıdır: AB, Birleşik Krallık ve İsviçre'de UMP onay formu kişiselleştirilmiş reklamı
reddetmeye izin verir, ama AdMob o durumda da sınırlı veri işler; abonelik ise reklamı tümüyle kaldırır.

Dayanaklar: AdMob SDK'sının kendi beyanı — IP adresi, ürün etkileşimleri, teşhis bilgisi ve cihaz kimlikleri "reklam,
analiz ve dolandırıcılığı önleme amacıyla otomatik olarak toplanır ve paylaşılır", aktarımda TLS ile şifrelenir
([Google: Play veri beyanı, AdMob](https://developers.google.com/admob/android/privacy/play-data-disclosure));
Play'in "toplama" tanımı (cihazdan dışarı aktarım), cihazda işleme ve ödeme hizmeti muafiyeti
([Play Console Yardım: Veri güvenliği](https://support.google.com/googleplay/android-developer/answer/10787469)).

**CSV:** form [`veri-guvenligi.csv`](veri-guvenligi.csv) ile de yazılabilir (Console'da "CSV'den içe aktar" ya da
`play-istek.txt` › `veriguvenligi uygula`). CSV'yi elle düzenleme: [`../araclar/veri-guvenligi.mjs`](../araclar/veri-guvenligi.mjs)
bu tabloyla üretir (`--denetle` farkı yakalar). Hesap bölümü CSV'ye yazılmaz: "hesap oluşturma yok" yanıtı Console'da bir
kez işaretlenir. API ile yazım formun tamamını değiştirdiği için o yanıt sonradan boşalırsa Console'da yeniden işaretlenir.
