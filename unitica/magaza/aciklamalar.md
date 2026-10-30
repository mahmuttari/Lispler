# Unitica — mağaza metinleri

`android/play.mjs magaza` (`PLAY_UYGULAMA=unitica`) bu dosyadan "Uygulama adı", "Destek e-postası", "Gizlilik
politikası" satırlarını ve "Kısa açıklama" / "Uzun açıklama" bölümlerini okur (ad ≤30, kısa ≤80, uzun ≤4000 karakter).
Web sitesi adresi gizlilik politikası adresinden çıkarılır. Varsayılan dil tr-TR; öbür on mağaza dili `diller/<dil>.md`
(arayüzün 11 diliyle aynı). Metin kuralları: başka marka adı yok, uydurma puan ya da kullanıcı sayısı yok, açıklamada
fiyat yok, başlıkta emoji, büyük harf, "en iyi" ya da "ücretsiz" yok; doğruluk ve reklamlar dürüstçe anlatılır.
Sınama: `node --test unitica/test/*.test.mjs`.

## Ortak

- **Uygulama adı:** Unitica – Birim Dönüştürücü
- **Telefondaki ad:** Unitica
- **Geliştirici adı:** Poyraz Workshop
- **Paket adı:** `com.poyrazworkshop.unitica`
- **Tür ve kategori:** Uygulama · Araçlar
- **Hedef kitle:** 13-15, 16-17, 18 ve üzeri (13 altı seçilmez)
- **Gizlilik politikası:** https://mahmuttari.github.io/Lispler/unitica/gizlilik.html
- **Destek e-postası:** mahmuttari@gmail.com
- **Mağaza dilleri:** tr-TR (varsayılan), en-US, de-DE, fr-FR, es-ES, it-IT, pt-BR, ru-RU, ar, ja-JP, ko-KR

## Kısa açıklama

Mühendislik birimlerini çevrimdışı dönüştür: geoteknik, hidrolik, ısı ve kütle.

## Uzun açıklama

Unitica, mühendislerin, teknikerlerin ve öğrencilerin her gün kullandığı birimleri hızlı ve doğru dönüştürür. İnternet gerekmez: bütün hesap telefonunda yapılır.

📐 26 KATEGORİ, 251 BİRİM
• Geoteknik ve inşaat: uzunluk, alan, hacim, kuvvet, basınç / gerilme, birim hacim ağırlık, yoğunluk, moment, açı / eğim.
• Akışkan ve hidrolik: debi, hız, ivme, dinamik ve kinematik viskozite, geçirgenlik (k).
• Isı, enerji ve güç: sıcaklık, enerji, güç, ısı iletim katsayısı, özgül ısı.
• Kütle ve atalet: kütle, kesit atalet momenti, kesit modülü, eğilme rijitliği (EI), çizgisel yük / yay sabiti, kütle atalet momenti.
• kN/m², kgf/cm², tf/m², kN/m³, tf/m³, mH₂O, psi, ksf, m³/sa, L/s, gpm, cfs, dönüm, BG ve daha fazlası.

🔁 HIZLI DÖNÜŞÜM
• Yazdıkça sonuç; iki birimi tek dokunuşla yer değiştir.
• "Tüm birimlerde" listesi: bir değeri kategorinin bütün birimlerinde aynı anda gör.
• Birim ya da kategori adıyla, sembolle ara.
• ± ve E tuşları: eksi değeri ve 10'un kuvvetini (1,5E-6) kolayca yaz.
• Sonucu tek dokunuşla kopyala.

⭐ GEÇMİŞ VE FAVORİLER
• Dönüştür'e dokunduğun işlemler geçmişe kaydedilir (son 100); tek dokunuşla yeniden açılır, silinen kayıt geri alınabilir.
• Sık kullandığın birim çiftlerini yıldızla; favoriler ekranında her biri kendi dönüşüm kartıyla hazır.

⚙️ AYARLAR
• 11 dil: Türkçe, English, Deutsch, Français, Español, Português, Italiano, Русский, العربية, 日本語, 한국어.
• Açık, koyu ya da sistem teması.
• Anlamlı basamak sayısı (3-12), ondalık işareti (nokta ya da virgül), otomatik ya da bilimsel gösterim.

📏 DOĞRULUK
• Katsayılar tam tanımlardan türetilir (inç = 25,4 mm, pound = 0,45359237 kg, g = 9,80665 m/s²); kalori ve BTU Uluslararası Tablo değerleridir. Bütün kabuller uygulamadaki "Kabuller ve sabitler" sayfasında yazılıdır.
• Hesap çift duyarlıklı kayan noktayla yapılır; sonuç, seçtiğin anlamlı basamak sayısına yuvarlanarak gösterilir. Tasarım için kritik bir değeri kendi kaynağınla da doğrula.

🔒 GİZLİLİK
• Hesap yok. Değerlerin, geçmişin ve favorilerin yalnız telefonunda saklanır.
• İnternet yalnız reklamlar ve reklamsız üyelik için kullanılır.

Ücretsiz uygulama: ekranın altında, içeriğin üstüne binmeyen bir reklam bandı vardır; klavye açıkken gizlenir. Tam ekran reklam seyrektir: yalnız Geçmiş, Favoriler ya da Diğer ekranından ayrılırken gelebilir; uygulamanın ilk 5 dakikasında hiç, en sık 8 dakikada bir ve saatte en çok 3 kez. Değer yazarken ya da birim seçerken reklam gösterilmez. İsteğe bağlı reklamsız üyelik (aylık ya da yıllık abonelik) bütün reklamları kaldırır; bütün kategoriler ve birimler herkese açıktır. Abonelik kendiliğinden yenilenir, istediğin zaman iptal edilebilir.

## Google Play – Uygulama içeriği formları

| Bölüm | Cevap |
|---|---|
| Gizlilik politikası | yukarıdaki adres |
| Uygulama erişimi | Tüm işlevler özel erişim olmadan kullanılabilir (hesap yok, giriş yok) |
| Reklamlar | **Evet**, reklam içeriyor (Google AdMob: altta banner + seyrek geçiş reklamı) |
| İçerik derecelendirmesi (IARC) | Kategori: **Yardımcı program, üretkenlik, iletişim veya diğer**. Şiddet, cinsellik, küfür, uyuşturucu, kumar, kaba mizah: **Hayır**. Kullanıcılar birbiriyle etkileşir / içerik paylaşır: **Hayır**. Kullanıcının konumunu başka kullanıcılarla paylaşır: **Hayır**. Dijital ürün satın alma: **Evet** (reklamsız üyelik aboneliği). Kısıtlamasız internet erişimi (tarayıcı, arama motoru): **Hayır** |
| Hedef kitle | 13-15, 16-17, 18 ve üzeri · "Çocuklara hitap ediyor mu?" sorusuna **Hayır** |
| Haber uygulaması · Devlet uygulaması | Hayır · Hayır |
| Finans özellikleri · Sağlık özellikleri | Yok · Yok |
| Reklam kimliği | **Evet** — amaç: **Reklam veya pazarlama**, **Analiz**, **Dolandırıcılığı önleme, güvenlik ve uygunluk** (AdMob SDK'sı `AD_ID` iznini ekler) |
| Hesap silme | Uygulamada hesap oluşturulamaz (bölüm "hesap yok" olarak geçilir) |
| Ön plan hizmeti izinleri | Sorulursa: uygulama ön plan hizmeti **kullanmaz**; `FOREGROUND_SERVICE` ve `WAKE_LOCK`'u Google Mobile Ads SDK'sının kullandığı WorkManager kütüphanesi ekler, tür (`foregroundServiceType`) bildirilmez |

### Veri güvenliği formu

- Veri toplanıyor ya da paylaşılıyor mu: **Evet**. Aktarımda şifreleniyor mu: **Evet** (reklam ve Google Play
  istekleri yalnız HTTPS; `usesCleartextTraffic="false"`). Silme isteği yolu: **Hayır** (aşağıda).
- Hesap oluşturma: **Uygulamam kullanıcıların hesap oluşturmasına izin vermiyor.**
- Uygulamanın kendi verisi (değerler, geçmiş, favoriler, ayarlar, üyelik durumu) **cihazdan çıkmaz**; Google'ın
  tanımında cihazda kalan veri "toplanmış" sayılmaz. Ödemeyi Google Play alır; Play Faturalandırma'nın işlediği ödeme
  verisi geliştiriciye gelmez ve Google'ın kılavuzuna göre uygulamanın beyanına girmez [K].
- Cihazdan çıkan tek akış AdMob'dur; geliştiricinin elinde veri olmadığından silme isteği yolu sunulmaz.

| Veri türü | Kim | Toplanıyor · paylaşılıyor | İsteğe bağlı | Amaç |
|---|---|---|---|---|
| Konum › Yaklaşık konum | AdMob (IP adresinden) | Evet · **Evet** | Hayır | Reklam veya pazarlama, Analiz, Dolandırıcılığı önleme |
| Uygulama etkinliği › Uygulama etkileşimleri | AdMob: açılış, dokunma, reklam izleme | Evet · **Evet** | Hayır | Reklam veya pazarlama, Analiz, Dolandırıcılığı önleme |
| Uygulama bilgileri ve performans › Teşhis | AdMob: uygulamanın ve SDK'nın başarımı | Evet · **Evet** | Hayır | Reklam veya pazarlama, Analiz, Dolandırıcılığı önleme |
| Cihaz veya diğer kimlikler | AdMob: reklam kimliği, uygulama grubu kimliği | Evet · **Evet** | Hayır | Reklam veya pazarlama, Analiz, Dolandırıcılığı önleme |

Hiçbir türde "geçici işleme" yoktur. Ad, e-posta, kullanıcı kimliği, kişiler, hassas konum, fotoğraf, ses, mesaj,
finans, sağlık, dosya, tarama geçmişi, kilitlenme günlüğü: **toplanmıyor**.

Dayanaklar: AdMob SDK'sının kendi beyanı — IP adresi, ürün etkileşimleri, teşhis bilgisi ve cihaz kimlikleri "reklam,
analiz ve dolandırıcılığı önleme amacıyla otomatik olarak toplanır ve paylaşılır", aktarımda TLS ile şifrelenir
([Google: Play veri beyanı, AdMob](https://developers.google.com/admob/android/privacy/play-data-disclosure));
Play'in veri türü ve "toplama / paylaşma" tanımları
([Play Console Yardım: Veri güvenliği](https://support.google.com/googleplay/android-developer/answer/10787469)).

**CSV:** form [`veri-guvenligi.csv`](veri-guvenligi.csv) ile de yazılabilir (Console'da "CSV'den içe aktar" ya da
`play-istek.txt` › `veriguvenligi uygula`). CSV'yi elle düzenleme: [`../araclar/veri-guvenligi.mjs`](../araclar/veri-guvenligi.mjs)
bu tabloyla üretir (`--denetle` farkı yakalar). Hesap oluşturma sorusu CSV'de "Uygulamam kullanıcıların hesap
oluşturmasına izin vermiyor" (`PSL_ACM_NONE`) diye yanıtlanır; Play bu satır olmadan CSV'yi reddeder. Console'un
şablonda olmayan iki sorusu (uygulama dışında açılmış hesapla giriş, veri silme isteği yolu) Console'da "Hayır" diye
işaretlenir; API ile yazım formun tamamını değiştirdiği için boşalırlarsa Console'da yeniden işaretlenir.
