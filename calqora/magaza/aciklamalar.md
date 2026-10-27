# Calqora — mağaza metinleri

`android/play.mjs magaza` (`PLAY_UYGULAMA=calqora`) bu dosyadan "Uygulama adı", "Destek e-postası", "Gizlilik politikası"
satırlarını ve "Kısa açıklama" / "Uzun açıklama" bölümlerini okur (ad ≤30, kısa ≤80, uzun ≤4000 karakter). Web sitesi
adresi gizlilik politikası adresinden çıkarılır. Öbür 10 dil `diller/<dil>.md` dosyalarındadır (aynı biçim + "Sürüm notu"
bölümü, ≤500 karakter). Metin kuralları: başka marka adı yok, uydurma puan ya da kullanıcı sayısı yok, açıklamada fiyat
yok, adda emoji, büyük harfle yazılmış sözcük, "en iyi" ya da "ücretsiz" yok; doğruluk ve reklamlar açıkça anlatılır
(`test/magaza.test.mjs` denetler).

## Ortak

- **Uygulama adı:** Calqora – Bilimsel Hesap
- **Geliştirici adı:** Poyraz Workshop
- **Paket adı:** `com.poyrazworkshop.calqora`
- **Tür ve kategori:** Uygulama · Araçlar (Eğitim de uygundu; neden Araçlar: `DEGERLENDIRME.md` §1)
- **Hedef kitle:** 13-15, 16-17, 18 ve üzeri (13 altı seçilmez)
- **Gizlilik politikası:** https://mahmuttari.github.io/Lispler/calqora/gizlilik.html
- **Destek e-postası:** mahmuttari@gmail.com
- **Mağaza dilleri:** tr-TR (varsayılan), en-US, de-DE, fr-FR, es-ES, it-IT, pt-BR, ru-RU, ar, ja-JP, ko-KR — çeviriler
  `diller/` klasöründe; uygulamanın 11 diliyle bire bir (pt-BR ↔ `pt`, es-ES ↔ `es`)
- **Abonelik:** `adfree` (temel planlar `monthly`, `yearly`) — fiyatlar ve Console adımları [`fiyatlandirma.md`](fiyatlandirma.md)

## Kısa açıklama

Bilimsel hesap, grafik, karmaşık sayılar, matrisler, birim dönüşümü ve sabitler.

## Uzun açıklama

Calqora, okulda, işte ve sahada gereken hesapları tek uygulamada toplayan bilimsel bir hesap makinesidir. İfadeyi kâğıda yazar gibi yazarsın: kök işaretinin çizgisi kökün altındakinin tamamına uzanır, sonuç sen yazarken belirir.

🧮 HESAP
• Trigonometrik ve hiperbolik fonksiyonlar, logaritma, üs ve kökler; DEG, RAD ve GRAD açı birimleri.
• Faktöriyel, kombinasyon, permütasyon, EBOB, EKOK, mod, yuvarlama ve gama fonksiyonu.
• Toplam (Σ), çarpım, sayısal türev, belirli integral ve denklem çözme.
• Sonucu kesir, tam sayılı kesir ya da derece-dakika-saniye olarak gör.
• Norm, Fix, Sci ve Eng sayı biçimleri; basamak sayısını sen seç. Ondalık ayracı nokta ya da virgül.
• Ans, M+ / M− / MR belleği ve A, B, C, D, X, Y değişkenleri; son 100 işlemlik geçmiş.

📈 GRAFİK
• Dört fonksiyonu aynı anda çiz; parmakla kaydır, iki parmakla yakınlaştır.
• İz sürerek eğrinin her noktasının değerini oku.
• Görünen aralıkta kök, en küçük / en büyük değer ve iki eğrinin kesişimini bul.

ℂ KARMAŞIK SAYILAR
• Karmaşık kip açıkken √(−4) = 2i; a+bi ya da r∠θ gösterimi.
• re, im, conj, arg ve karmaşık sayılarla temel fonksiyonların hepsi.

▦ MATRİSLER
• A, B ve C matrisleri (5×5'e kadar); hücrelere 1/3 ya da √(2) gibi ifadeler yazılabilir.
• Toplama, çıkarma, çarpma, ters, devrik, üs, determinant, rank, iz, satır indirgeme (rref), özdeğerler ve X⁻¹·Y ile doğrusal denklem sistemi çözümü.

⇄ BİRİMLER VE SABİTLER
• 15 kategoride 140 birim: uzunluk, alan, hacim, kütle, yoğunluk, zaman, hız, kuvvet, basınç ve gerilme, enerji, güç, sıcaklık, açı, frekans, veri.
• Bir değer gir, kategorinin bütün birimlerindeki karşılığını aynı anda gör.
• Matematik, fizik, kimya, astronomi ve mühendislikten 46 sabit: ışık hızı, Planck sabiti, Avogadro sayısı, yerçekimi ivmesi, suyun birim hacim ağırlığı… Tek dokunuşla hesaba ekle.

🌍 11 DİL
• Türkçe, English, Deutsch, Français, Español, Italiano, Português, Русский, 日本語, 한국어, العربية. Açık ve koyu tema; yatay ekranda geniş tuş takımı.

🔒 GİZLİLİK
• Hesap yok, sunucumuz yok. İfadelerin, geçmişin ve ayarların yalnız telefonunda durur; hesap yapmak için internet gerekmez.

ℹ️ BİLMEN GEREKENLER
• Hesaplar çift duyarlıklı kayan noktayla yapılır (yaklaşık 15 anlamlı basamak). Sayısal türev, integral ve denklem çözme yaklaşık sonuç verir; sınavda ve resmî işlerde sonucu ayrıca denetle.

Uygulama reklamlıdır: ekranın altında bir reklam bandı vardır; tam ekran reklam yalnız grafik, matris ya da birim ekranından çıkarken veya ayarları kapatırken gelir, en sık 4 dakikada bir; yazarken asla. İsteğe bağlı reklamsız abonelik bütün reklamları kaldırır ve istediğin zaman iptal edilebilir.

## Google Play – Uygulama içeriği formları

| Bölüm | Cevap |
|---|---|
| Gizlilik politikası | yukarıdaki adres |
| Uygulama erişimi | Tüm işlevler özel erişim olmadan kullanılabilir (hesap yok, giriş yok) |
| Reklamlar | **Evet**, reklam içeriyor (Google AdMob: altta uyarlanabilir banner + yalnız doğal duraklarda geçiş reklamı; en yüksek reklam içerik derecesi **G**; reklamsız abonede reklam SDK'sı hiç başlatılmaz) |
| İçerik derecelendirmesi (IARC) | Kategori: **Yardımcı program, üretkenlik, iletişim veya diğer** (eğitim içerikli hesap aracı; oyun değil). Şiddet, cinsellik, küfür, uyuşturucu, kumar, kaba mizah: **Hayır**. Kullanıcılar birbiriyle etkileşir / içerik paylaşır: **Hayır**. Kullanıcının konumunu paylaşır: **Hayır**. Dijital ürün satın alma: **Evet** (reklamsız abonelik). Kısıtlamasız internet erişimi (tarayıcı, arama motoru): **Hayır** |
| Hedef kitle | 13-15, 16-17, 18 ve üzeri · "Çocuklara hitap ediyor mu?" sorusuna **Hayır** (Aileler programına girilmez: reklam ağı ve UMP yetişkin/genç kitleye göre kurulu) |
| Haber uygulaması · Devlet uygulaması | Hayır · Hayır |
| Finans özellikleri · Sağlık özellikleri | Yok · Yok |
| Reklam kimliği | **Evet** — amaç: **Reklam veya pazarlama**, **Analiz**, **Dolandırıcılığı önleme, güvenlik ve uygunluk** (AdMob SDK'sı `AD_ID` iznini ekler) |
| Hesap silme | Uygulamada hesap oluşturulamaz (bölüm "hesap yok" olarak geçilir) |
| Ön plan hizmeti / konum / tam ekran amaç izinleri | Yok. Birleşik manifestteki `FOREGROUND_SERVICE` ve `WAKE_LOCK` AdMob'un getirdiği WorkManager'dandır; tür izni (`FOREGROUND_SERVICE_*`) yoktur, ayrı beyan istenmez |

### Veri güvenliği formu

- Veri toplanıyor ya da paylaşılıyor mu: **Evet** (yalnız AdMob). Aktarımda şifreleniyor mu: **Evet** (AdMob TLS kullanır;
  `usesCleartextTraffic="false"`). Silme isteği yolu: **Hayır** (aşağıda).
- Hesap oluşturma: **Uygulamam kullanıcıların hesap oluşturmasına izin vermiyor.**
- Uygulamanın kendi verisi (ifadeler, geçmiş, değişkenler, matrisler, grafikler, ayarlar) **cihazdan çıkmaz**; Google'ın
  tanımında cihazda kalan veri "toplanmış" sayılmaz. Ayarlar › Her şeyi sıfırla hepsini siler.
- Abonelik: uygulama Google Play'e telefondaki satın almaları sorar ve "üye mi?" kararını yalnız cihazda verir; satın alma
  bilgisi uygulamadan dışarı gönderilmez. Ödeme bilgisini Google Play kendisi toplar, uygulama görmez. Bu yüzden "Satın
  alma geçmişi" ve "Finans bilgisi" beyan edilmez (Play'in muafiyeti: ödeme hizmetinin doğrudan topladığı ve uygulamanın
  erişmediği veri).
- Cihazdan çıkan tek akış AdMob'dur. Geliştiricinin elinde veri olmadığından silme isteği yolu sunulmaz.

| Veri türü | Kim | Toplanıyor · paylaşılıyor | İsteğe bağlı | Amaç |
|---|---|---|---|---|
| Konum › Yaklaşık konum | AdMob (IP adresinden) | Evet · **Evet** | Hayır | Reklam veya pazarlama, Analiz, Dolandırıcılığı önleme |
| Uygulama etkinliği › Uygulama etkileşimleri | AdMob: açılış, dokunma, reklam izleme | Evet · **Evet** | Hayır | Reklam veya pazarlama, Analiz, Dolandırıcılığı önleme |
| Uygulama bilgileri ve performans › Teşhis | AdMob: uygulamanın ve SDK'nın başarımı | Evet · **Evet** | Hayır | Reklam veya pazarlama, Analiz, Dolandırıcılığı önleme |
| Cihaz veya diğer kimlikler | AdMob: reklam kimliği, uygulama grubu kimliği | Evet · **Evet** | Hayır | Reklam veya pazarlama, Analiz, Dolandırıcılığı önleme |

Hiçbir türde "geçici işleme" yoktur. Ad, e-posta, kullanıcı kimliği, kişiler, fotoğraf, ses, mesaj, finans, satın alma
geçmişi, sağlık, dosya, tarama geçmişi, kilitlenme günlüğü, hassas konum: **toplanmıyor**.

"İsteğe bağlı: Hayır" ihtiyatlıdır: AB, Birleşik Krallık ve İsviçre'de UMP onay formu kişiselleştirilmiş reklamı
reddetmeye izin verir, ama AdMob o durumda da sınırlı veri işler; abonelik ise reklamı tümüyle kaldırır.

Dayanaklar: AdMob SDK'sının kendi beyanı (SDK 25.5.0) — IP adresi, ürün etkileşimleri, teşhis bilgisi ve cihaz
kimlikleri "reklam, analiz ve dolandırıcılığı önleme amacıyla otomatik olarak toplanır ve paylaşılır", aktarımda TLS ile
şifrelenir ([Google: Play veri beyanı, AdMob](https://developers.google.com/admob/android/privacy/play-data-disclosure));
Play'in "toplama" tanımı (cihazdan dışarı aktarım), cihazda işleme ve ödeme hizmeti muafiyeti
([Play Console Yardım: Veri güvenliği](https://support.google.com/googleplay/android-developer/answer/10787469)).

**CSV:** form [`veri-guvenligi.csv`](veri-guvenligi.csv) ile de yazılabilir (Console'da "CSV'den içe aktar" ya da
`play-istek.txt` › `veriguvenligi uygula`). CSV'yi elle düzenleme: [`../araclar/veri-guvenligi.mjs`](../araclar/veri-guvenligi.mjs)
bu tabloyla üretir (`--denetle` farkı yakalar). Hesap bölümü CSV'ye yazılmaz: "hesap oluşturma yok" yanıtı Console'da bir
kez işaretlenir. API ile yazım formun tamamını değiştirdiği için o yanıt sonradan boşalırsa Console'da yeniden işaretlenir.
