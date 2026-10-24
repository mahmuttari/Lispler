# İz Haritası — mağaza metinleri

`android/play.mjs magaza` (`PLAY_UYGULAMA=iz`) bu dosyadan "Uygulama adı", "Destek e-postası", "Gizlilik politikası"
satırlarını ve "Kısa açıklama" / "Uzun açıklama" bölümlerini okur (ad ≤30, kısa ≤80, uzun ≤4000 karakter). Web sitesi
adresi gizlilik politikası adresinden çıkarılır. Arayüz yalnız Türkçe olduğu için mağaza metni de yalnız tr-TR'dir
(`diller/` klasörü yok); arayüz çevrilince çeviriler Hayalet Avcıları'ndaki gibi `diller/<dil>.md` olarak eklenir.

## Ortak

- **Uygulama adı:** İz Haritası – AirTag için
- **Geliştirici adı:** Poyraz Workshop
- **Paket adı:** `com.poyrazworkshop.izharitasi`
- **Tür ve kategori:** Uygulama · Araçlar
- **Hedef kitle:** 13-15, 16-17, 18 ve üzeri (13 altı seçilmez)
- **Gizlilik politikası:** https://mahmuttari.github.io/Lispler/iz-haritasi/gizlilik.html
- **Destek e-postası:** mahmuttari@gmail.com
- **Mağaza dili:** tr-TR (tek dil)

## Kısa açıklama

AirTag ve Find My izleyicilerini bul, haritada gör, seni izleyeni fark et.

## Uzun açıklama

İz Haritası, telefonunun Bluetooth'uyla yakındaki AirTag ve Find My izleyicilerinin yayınlarını dinler; sinyal gücünü telefonunun konumuyla birleştirip izleyicinin yerini haritada kestirir. Kayıp eşyanı bul, seninle birlikte dolaşan yabancı bir izleyiciyi fark et, her izleyicinin ne zaman ve nerede görüldüğünü sakla.

📡 TARAMA
• Yakındaki bütün Find My yayınları: tür, pil, sahibinden ayrı olup olmadığı, son görülme, canlı sinyal gücü ve tahmini mesafe.

🎯 BUL
• Sıcak-soğuk göstergesi, mesafe aralığı, yaklaşıyor / uzaklaşıyor işareti ve titreşim.
• 1 metre kalibrasyonu: sinyal modelini kendi telefonuna ve izleyicine göre ayarlar.
• Sahibinden ayrı bir AirTag'e ses çaldır.

🗺️ HARİTA
• Yürüdükçe ölçüm noktaları sinyal gücüne göre renklenir; izleyicinin kestirilen yeri %95 güven elipsiyle gösterilir.
• OpenStreetMap ya da kendi XYZ harita altlığın; açık ve koyu tema.

🕘 KONUM GEÇMİŞİ
• Her izleyicinin ne zaman, nerede ve ne kadar süre görüldüğü: haritada zaman sıralı numaralı işaretler, listede süre ve ± yarıçap.
• Sinyal hep yakını gösterirken sen yürüdüysen "seninle hareket ediyordu" diye işaretlenir.

⚠️ TAKİP UYARISI
• Sahibinden ayrı bir izleyici seninle birlikte farklı yerlerde görülürse uyarır. Mesafe, yer sayısı ve süre ayarlanabilir; kendi izleyicini "Bu benim" ile susturursun.

⬇️ DIŞA AKTARIM
• GeoJSON, KML (Google Earth'ün zaman kaydırıcısıyla oynatılır) ve CSV. Her noktada WGS84 ile birlikte TM 3° dilim koordinatı.

🧪 BENZETİM
• Yanında izleyici yoksa sanal bir yürüyüşle bütün özellikleri dene.

🔒 GİZLİLİK
• Hesap yok, sunucumuz yok. Ölçümler, konumlar ve konum geçmişi yalnız telefonunda durur; Ayarlar'dan tek dokunuşla silinir.
• İnternete yalnız harita karoları ve reklam için çıkılır; konumun reklam sağlayıcıya verilmez.

ℹ️ BİLMEN GEREKENLER
• AirTag'de GPS yoktur ve Apple, Bul (Find My) ağındaki konumları başka uygulamalara açmaz. İz Haritası yalnız telefonunun Bluetooth ile duyabildiği yakındaki izleyicileri görür (çoğunlukla 10-50 m).
• Sinyal gücünden yapılan konum kestirimi duvarlardan, insan vücudundan ve yansımalardan etkilenir; sonuç metrelerce sapabilir.
• Sahibinin yanındaki AirTag'in kimliği gizlidir ve ona ses çaldırılamaz: Apple'ın takip önleme kuralı.
• Arayüz Türkçedir.

Ücretsiz uygulama: ekranın altında reklam bandı vardır; tam ekran reklam yalnız bir dışa aktarımdan sonra ve en sık 3 dakikada bir gelir. Tarama sürerken, Bul ekranında ve takip uyarısı varken tam ekran reklam gösterilmez.

İz Haritası kendi eşyanı bulmak ve seni izleyen bir izleyiciyi fark etmek içindir; başka birini izlemek için değildir. Güvenliğinden endişe ediyorsan 112'yi ara.

AirTag ve Find My, Apple Inc.'in ticari markalarıdır. İz Haritası Apple ile bağlantılı değildir ve Apple tarafından onaylanmamıştır.

## Google Play – Uygulama içeriği formları

| Bölüm | Cevap |
|---|---|
| Gizlilik politikası | yukarıdaki adres |
| Uygulama erişimi | Tüm işlevler özel erişim olmadan kullanılabilir (hesap yok; izleyici yoksa 🧪 Benzetim bütün ekranları gösterir) |
| Reklamlar | **Evet**, reklam içeriyor (Google AdMob: altta banner + dışa aktarımdan sonra geçiş reklamı) |
| İçerik derecelendirmesi (IARC) | Kategori: **Yardımcı program, üretkenlik, iletişim veya diğer**. Şiddet, cinsellik, küfür, uyuşturucu, kumar, kaba mizah: **Hayır**. Kullanıcılar birbiriyle etkileşir / içerik paylaşır: **Hayır**. Kullanıcının konumunu başka kullanıcılarla paylaşır: **Hayır** (konum yalnız cihazda; dışa aktarılan dosyayı kullanıcı kendisi paylaşır). Dijital ürün satın alma: **Hayır**. Kısıtlamasız internet erişimi (tarayıcı, arama motoru): **Hayır** |
| Hedef kitle | 13-15, 16-17, 18 ve üzeri · "Çocuklara hitap ediyor mu?" sorusuna **Hayır** |
| Haber uygulaması · Devlet uygulaması | Hayır · Hayır |
| Finans özellikleri · Sağlık özellikleri | Yok · Yok |
| Reklam kimliği | **Evet** — amaç: **Reklam veya pazarlama**, **Analiz**, **Dolandırıcılığı önleme, güvenlik ve uygunluk** (AdMob SDK'sı `AD_ID` iznini ekler) |
| Hesap silme | Uygulamada hesap oluşturulamaz (bölüm "hesap yok" olarak geçilir) |
| Konum izinleri | Arka planda konum **istenmez** (`ACCESS_BACKGROUND_LOCATION` yok); ayrı beyan gerekmez |

### Veri güvenliği formu

- Veri toplanıyor ya da paylaşılıyor mu: **Evet**. Aktarımda şifreleniyor mu: **Evet** (sayfa
  `https://appassets.androidplatform.net`'ten sunulur, `usesCleartextTraffic="false"`: harita karosu ve reklam
  istekleri yalnız HTTPS). Silme isteği yolu: **Hayır** (aşağıda).
- Hesap oluşturma: **Uygulamam kullanıcıların hesap oluşturmasına izin vermiyor.**
- Uygulamanın kendi verisi (görülen izleyiciler, ölçümler, konum geçmişi, telefonun izi, ayarlar) **cihazdan çıkmaz**;
  Google'ın tanımında cihazda kalan veri "toplanmış" sayılmaz. Dışa aktarılan dosya kullanıcının kendi işlemidir.
- Cihazdan çıkan iki akış beyan edilir. Geliştiricinin elinde veri olmadığından silme isteği yolu sunulmaz.

| Veri türü | Kim | Toplanıyor · paylaşılıyor | İsteğe bağlı | Amaç |
|---|---|---|---|---|
| Konum › Hassas konum | OpenStreetMap karo sunucusu: yüksek yakınlaştırmada karo adresi telefonun yakınındaki 3 km²'den küçük alanı gösterir | Evet · **Evet** | Hayır | Uygulama işlevleri |
| Konum › Yaklaşık konum | AdMob (IP adresinden) + karo sunucusu (düşük yakınlaştırma) | Evet · **Evet** | Hayır | Uygulama işlevleri, Reklam veya pazarlama, Analiz, Dolandırıcılığı önleme |
| Uygulama etkinliği › Uygulama etkileşimleri | AdMob: açılış, dokunma, reklam izleme | Evet · **Evet** | Hayır | Reklam veya pazarlama, Analiz, Dolandırıcılığı önleme |
| Uygulama bilgileri ve performans › Teşhis | AdMob: uygulamanın ve SDK'nın başarımı | Evet · **Evet** | Hayır | Reklam veya pazarlama, Analiz, Dolandırıcılığı önleme |
| Cihaz veya diğer kimlikler | AdMob: reklam kimliği, uygulama grubu kimliği | Evet · **Evet** | Hayır | Reklam veya pazarlama, Analiz, Dolandırıcılığı önleme |

Hiçbir türde "geçici işleme" yoktur. Ad, e-posta, kullanıcı kimliği, kişiler, fotoğraf, ses, mesaj, finans, sağlık,
dosya, tarama geçmişi, kilitlenme günlüğü: **toplanmıyor**.

Dayanaklar: AdMob SDK'sının kendi beyanı — IP adresi, ürün etkileşimleri, teşhis bilgisi ve cihaz kimlikleri "reklam,
analiz ve dolandırıcılığı önleme amacıyla otomatik olarak toplanır ve paylaşılır", aktarımda TLS ile şifrelenir
([Google: Play veri beyanı, AdMob](https://developers.google.com/admob/android/privacy/play-data-disclosure));
Play'in veri türü ve "toplama / paylaşma" tanımları ([Play Console Yardım: Veri güvenliği](https://support.google.com/googleplay/android-developer/answer/10787469));
karo istekleri ([OSMF Karo Kullanım Politikası](https://operations.osmfoundation.org/policies/tiles/)). Karo
sunucusu Poyraz Workshop'un sözleşmeli hizmet sağlayıcısı olmadığından bu akış ihtiyatla "paylaşım" sayıldı.

**CSV:** form [`veri-guvenligi.csv`](veri-guvenligi.csv) ile de yazılabilir (Console'da "CSV'den içe aktar" ya da
`play-istek.txt` › `veriguvenligi uygula`). CSV'yi elle düzenleme: [`../araclar/veri-guvenligi.mjs`](../araclar/veri-guvenligi.mjs)
bu tabloyla üretir (`--denetle` farkı yakalar). Hesap bölümü CSV'ye yazılmaz, çünkü Google bu satırların kimliğini
belgelemiyor: "hesap oluşturma yok" yanıtı Console'da bir kez işaretlenir. API ile yazım formun tamamını değiştirdiği
için o yanıt sonradan boşalırsa Console'da yeniden işaretlenir.
