# Kıble Bul — mağaza metinleri

`android/play.mjs magaza` (`PLAY_UYGULAMA=kiblebul`) bu dosyadan "Uygulama adı", "Destek e-postası", "Gizlilik
politikası" satırlarını ve "Kısa açıklama" / "Uzun açıklama" bölümlerini okur (ad ≤30, kısa ≤80, uzun ≤4000 karakter).
Web sitesi adresi gizlilik politikası adresinden çıkarılır. Diğer 10 dil `diller/<dil>.md` dosyalarındadır (aynı biçim +
"Sürüm notu" bölümü, ≤500 karakter). Metin kuralları: başka marka adı yok, uydurma puan ya da kullanıcı sayısı yok,
fiyat yok, adda emoji, BÜYÜK HARF, "en iyi" ve "ücretsiz" yok; doğruluk sınırı ve reklamlar açıkça yazılı.

## Ortak

- **Uygulama adı:** Kıble Bul – Kıble Pusulası
- **Geliştirici adı:** Poyraz Workshop
- **Paket adı:** `com.poyrazworkshop.kiblebul`
- **Tür ve kategori:** Uygulama · Yaşam Tarzı
- **Hedef kitle:** 13-15, 16-17, 18 ve üzeri (13 altı seçilmez)
- **Gizlilik politikası:** https://mahmuttari.github.io/Lispler/kible-bul/gizlilik.html
- **Destek e-postası:** mahmuttari@gmail.com
- **Mağaza dilleri:** tr-TR (varsayılan), en-US, de-DE, fr-FR, es-ES, it-IT, pt-BR, ru-RU, ar, ja-JP, ko-KR — uygulamanın 11 dili; çeviriler `diller/` klasöründe

## Kısa açıklama

Kâbe'nin yönü pusula, harita ve mesafeyle; 34.000 şehir internetsiz aranır.

## Uzun açıklama

Kıble Bul, bulunduğunuz yerden Mekke'deki Kâbe'nin yönünü pusula, harita ve mesafeyle gösterir. Telefonunuzu düz tutup çevirin: yeşil ibre tam yukarıyı gösterdiğinde kıbleye dönmüşsünüz demektir.

🧭 PUSULA
• Kıble açısı (gerçek kuzeyden) ve Kâbe'ye kuş uçuşu mesafe.
• Telefon kıbleye dönünce kadran yeşil yanar, kısa bir titreşim gelir.
• Gerçek kuzey düzeltmesi: telefonun manyetik pusulası, bulunduğunuz yerin manyetik sapmasına göre düzeltilir (Dünya Manyetik Modeli 2025).
• Doğruluk göstergesi: telefonun kendi algılayıcı değerlendirmesi ve ölçülen manyetik alan şiddeti. Yakındaki bir mıknatıs, metal ya da elektronik cihaz pusulayı saptırıyorsa uyarır.
• Kalibrasyon yardımcısı: telefonla havada 8 çizerken ilerlemeyi gösterir.
• Pusula bilgisi: ibrenin ardındaki sayılar canlı olarak (manyetik yön, sapma, gerçek yön, alan şiddeti).

🗺️ HARİTA
• Uydu görüntüsü üzerinde bulunduğunuz yerden Kâbe'ye en kısa (büyük daire) yol.
• Ülke adları uygulamanın dilinde; internet yokken ülke sınırlarıyla çizilmiş harita.

📍 KONUM
• Telefonun yaklaşık konumu yeterlidir: kıble için birkaç kilometre fark etmez, tam konum izni istenmez.
• İnternetsiz şehir arama: nüfusu 15.000'i aşan yaklaşık 34.000 yerleşim, 11 dilde yer adlarıyla.
• Koordinat girişi (41,0082 ya da 41.0082 K gibi) ve son seçilen yerler.

🎨 GÖRÜNÜM
• Üç pusula stili (yeşil, altın, klasik), gece modu, derece ölçeği, 3B ya da 2B Kâbe görseli.
• 11 dil: Türkçe, English, Deutsch, Français, Español, Português, Italiano, Русский, 日本語, 한국어, العربية.

🔒 GİZLİLİK
• Hesap yok, sunucumuz yok. Konumunuz yalnızca telefonda yönü hesaplamak için kullanılır; uygulama onu bize ya da reklam sağlayıcısına göndermez.
• Harita, baktığınız bölgenin uydu görüntüsü karolarını indirir; reklamlar internetten gelir. Ayrıntılar gizlilik politikasında.

ℹ️ BİLMENİZ GEREKENLER
• Kıble açısı hesapla bulunur ve yaklaşık konumla da değişmez; ekrandaki yön ise telefonunuzun pusulası kadar doğrudur. Mıknatıs, metal, hoparlör ya da manyetik kılıf pusulayı birkaç dereceden fazla saptırabilir: bunlardan uzaklaşın, gerekirse kalibre edin.
• Pusula algılayıcısı olmayan telefonda kıble açısı ve harita yine gösterilir.

Ücretsiz uygulama: ekranın altında, içeriğin üstüne binmeyen ayrı bir şeritte reklam bandı vardır. Tam ekran reklam yalnız bir yer araması tamamlanınca ya da haritadan çıkarken, en sık 4 dakikada bir gelir; pusula ve kalibrasyon sırasında asla gelmez. Reklamları kaldırmak isteyenler için uygulamada aylık ya da yıllık "Reklamsız Üyelik" aboneliği vardır; Google Play'den istediğiniz zaman iptal edebilirsiniz.

## Google Play – Uygulama içeriği formları

| Bölüm | Cevap |
|---|---|
| Gizlilik politikası | yukarıdaki adres |
| Uygulama erişimi | Tüm işlevler özel erişim olmadan kullanılabilir (hesap yok; konum izni verilmezse şehir aranır) |
| Reklamlar | **Evet**, reklam içeriyor (Google AdMob: altta ayrı şeritte banner + yer aramasından ya da haritadan sonra geçiş reklamı) |
| İçerik derecelendirmesi (IARC) | Kategori: **Yardımcı program, üretkenlik, iletişim veya diğer**. Şiddet, cinsellik, küfür, uyuşturucu, kumar, kaba mizah: **Hayır**. Kullanıcılar birbiriyle etkileşir / içerik paylaşır: **Hayır**. Kullanıcının konumunu başka kullanıcılarla paylaşır: **Hayır**. Dijital ürün satın alma: **Evet** (reklamsız üyelik aboneliği). Kısıtlamasız internet erişimi (tarayıcı, arama motoru): **Hayır** |
| Hedef kitle | 13-15, 16-17, 18 ve üzeri · "Çocuklara hitap ediyor mu?" sorusuna **Hayır** |
| Haber uygulaması · Devlet uygulaması | Hayır · Hayır |
| Finans özellikleri · Sağlık özellikleri | Yok · Yok |
| Reklam kimliği | **Evet** — amaç: **Reklam veya pazarlama**, **Analiz**, **Dolandırıcılığı önleme, güvenlik ve uygunluk** (AdMob SDK'sı `AD_ID` iznini ekler) |
| Hesap silme | Uygulamada hesap oluşturulamaz (bölüm "hesap yok" olarak geçilir) |
| Konum izinleri | Yalnız **yaklaşık konum** (`ACCESS_COARSE_LOCATION`), uygulama ekrandayken; arka planda konum **istenmez**, ayrı beyan gerekmez |
| Ön plan hizmeti | Uygulamanın kendi ön plan hizmeti yok (`FOREGROUND_SERVICE` izni AdMob'un WorkManager kitaplığından gelir, tür bildirilmez) |

### Veri güvenliği formu

- Veri toplanıyor ya da paylaşılıyor mu: **Evet**. Aktarımda şifreleniyor mu: **Evet** (`usesCleartextTraffic="false"`:
  harita karosu ve reklam istekleri yalnız HTTPS). Silme isteği yolu: **Hayır** (aşağıda).
- Hesap oluşturma: **Uygulamam kullanıcıların hesap oluşturmasına izin vermiyor.**
- Uygulamanın kendi verisi (seçilen yer, son yerler, ayarlar, üyelik durumu) **cihazdan çıkmaz**; Google'ın tanımında
  cihazda kalan veri "toplanmış" sayılmaz. Konum hiçbir sunucuya gönderilmez.
- Google Play faturalandırması beyan dışıdır: ödeme bilgisini Google Play doğrudan kullanıcıdan alır, uygulama ona
  erişmez ([Play Console Yardım](https://support.google.com/googleplay/android-developer/answer/10787469)).
- "Yol Tarifi" düğmesi seçili yerin koordinatıyla harita uygulamasını açar: kullanıcının kendi işlemidir ve kullanıcı
  bunu bekler; Play bu tür aktarımı "paylaşım" saymaz (aynı kaynak). Konum zaten "yaklaşık konum" olarak beyan edilir.
- Cihazdan çıkan iki akış beyan edilir. Geliştiricinin elinde veri olmadığından silme isteği yolu sunulmaz.

| Veri türü | Kim | Toplanıyor · paylaşılıyor | İsteğe bağlı | Amaç |
|---|---|---|---|---|
| Konum › Yaklaşık konum | AdMob (IP adresinden) + NASA GIBS karo sunucusu (haritada bakılan bölge; harita açılınca konumun çevresi; en yakın düzeyde bir karo ≈ 150 km, yani 3 km²'den büyük) | Evet · **Evet** | Hayır | Uygulama işlevleri, Reklam veya pazarlama, Analiz, Dolandırıcılığı önleme |
| Uygulama etkinliği › Uygulama etkileşimleri | AdMob: açılış, dokunma, reklam etkileşimi | Evet · **Evet** | Hayır | Reklam veya pazarlama, Analiz, Dolandırıcılığı önleme |
| Uygulama bilgileri ve performans › Teşhis | AdMob: uygulamanın ve SDK'nın başarımı | Evet · **Evet** | Hayır | Reklam veya pazarlama, Analiz, Dolandırıcılığı önleme |
| Cihaz veya diğer kimlikler | AdMob: reklam kimliği, uygulama grubu kimliği | Evet · **Evet** | Hayır | Reklam veya pazarlama, Analiz, Dolandırıcılığı önleme |

Hiçbir türde "geçici işleme" yoktur. Hassas konum, ad, e-posta, kullanıcı kimliği, kişiler, fotoğraf, ses, mesaj,
satın alma geçmişi, sağlık, dosya, tarama geçmişi, kilitlenme günlüğü: **toplanmıyor**.

Dayanaklar: AdMob SDK'sının kendi beyanı — IP adresi, ürün etkileşimleri, teşhis bilgisi ve cihaz kimlikleri "reklam,
analiz ve dolandırıcılığı önleme amacıyla otomatik olarak toplanır ve paylaşılır", aktarımda TLS ile şifrelenir
([Google: Play veri beyanı, AdMob](https://developers.google.com/admob/android/privacy/play-data-disclosure));
Play'in veri türü, "yaklaşık konum" (≥ 3 km²) ve "toplama / paylaşma" tanımları
([Play Console Yardım: Veri güvenliği](https://support.google.com/googleplay/android-developer/answer/10787469)).
Karo sunucusu (NASA GIBS) Poyraz Workshop'un sözleşmeli hizmet sağlayıcısı olmadığından bu akış İz Haritası'ndaki gibi
ihtiyatla "paylaşım" sayıldı.

**CSV:** form [`veri-guvenligi.csv`](veri-guvenligi.csv) ile de yazılabilir (Console'da "CSV'den içe aktar" ya da
`play-istek.txt` › `veriguvenligi uygula`). CSV'yi elle düzenleme: [`../araclar/veri-guvenligi.mjs`](../araclar/veri-guvenligi.mjs)
bu tabloyla üretir (`--denetle` farkı yakalar). Hesap oluşturma sorusu CSV'de "Uygulamam kullanıcıların hesap
oluşturmasına izin vermiyor" (`PSL_ACM_NONE`) diye yanıtlanır; Play bu satır olmadan CSV'yi reddeder. Console'un
şablonda olmayan iki sorusu (uygulama dışında açılmış hesapla giriş, veri silme isteği yolu) Console'da "Hayır" diye
işaretlenir; API ile yazım formun tamamını değiştirdiği için boşalırlarsa Console'da yeniden işaretlenir.
