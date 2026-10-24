# İz Haritası — yayın kararının uzman değerlendirmesi (24 Ekim 2026)

İstek: GENEL-KONULAR'daki AirTag Harita'yı **Poyraz Workshop** hesabından, **reklamlı** olarak (AdMob,
mahmuttari@gmail.com) Google Play'de yayınlamak. Kullanıcının seçimleri: ad "İz Haritası – AirTag için", reklam biçimi
"banner + geçiş reklamı", main'e birleştirme "PR aç, ben birleştiririm". Doğrulama işaretleri: **[D]** doğrulandı,
**[K]** kısmen, **[DY]** doğrulanamadı.

## 1. Önerilen ve uygulanan biçim

- **Ücretsiz, reklamlı.** Altta banner. Geçiş reklamı yalnız bir dışa aktarım bittikten sonra ve en sık 3 dakikada bir
  gelir. Tarama sürerken, Bul ekranında ve takip uyarısı varken geçiş reklamı **hiç** gösterilmez. Banner sayfanın
  üstüne binmez: sayfanın altında ayrı bir şerittir, klavye açılınca gizlenir.
- **Ad:** marka sonda ve "için" ile: "İz Haritası – AirTag için". Açıklamanın sonunda Apple ticari marka notu var.
  Simgede Apple'a ait görsel yok.
- **Tek dil (tr-TR), tüm ülkeler.** Arayüz Türkçe olduğu için mağaza metni de Türkçe. Başka ülkede gösterilmesinin
  zararı yok; İngilizce arayüz gelince `diller/en-US.md` eklenir.
- **Kategori Araçlar, 13 yaş ve üzeri.** Hesap ve sunucu yok. Veri güvenliği beyanında OpenStreetMap karo istekleri de
  "hassas konum paylaşımı" olarak ihtiyatla beyan edildi (`aciklamalar.md`).
- **Konumlandırma:** "Algılayan" değil, "haritada bulan ve kaydını tutan" uygulama. Rakiplerin hiçbiri kestirilen yeri
  güven elipsiyle haritada göstermiyor, görülme geçmişini saklamıyor ya da GeoJSON/KML/CSV vermiyor (aşağıda).

## 2. Güçlü yanlar

| Yön | Neden önemli |
|---|---|
| 🗺️ Haritada kestirim + %95 elips | Bulmayı "sıcak-soğuk"tan "şu köşe"ye indirir. Belirsizliği de dürüstçe gösterir |
| 🕘 Konum geçmişi | "Ne zaman, nerede yanımdaydı?" sorusunun yanıtı; takip şüphesinde kanıt niteliğinde kayıt |
| ⬇️ GeoJSON / KML / CSV + TM 3° | Harita mühendisi, CBS ve kolluğa başvuru için hazır veri. Rakiplerde yok |
| 🔒 Hesapsız, sunucusuz | Güvenlik uygulamasında güven: ölçümler telefondan çıkmaz |
| 🧪 Benzetim | İzleyicisi olmayan kullanıcı ve Play incelemecisi bütün ekranları görür |
| Türkçe arayüz | Türkçe arayüzlü bir rakip bulunamadı [K] |

## 3. Rakipler (kaynaklı)

| Rakip | Ne yapar | Fark |
|---|---|---|
| Android "Bilinmeyen izleyici uyarıları" | Google Play hizmetleriyle Android 6.0+'da Ağustos 2023'te yayıldı; kendiliğinden uyarır, elle tarama yaklaşık 10 sn sürer, sonuç kaydedilmez [D] ([9to5Google](https://9to5google.com/2023/08/09/android-unknown-tracker-alerts/), [gHacks](https://www.ghacks.net/?p=200472)) | Ücretsiz ve telefonda hazır: "uyarı" ihtiyacını büyük ölçüde karşılıyor. İz Haritası'nın değeri **bulma, harita ve kayıttadır**; tanıtım bunu öne çıkarmalı |
| Apple "Tracker Detect" | Aralık 2021'de çıktı; ücretsiz, elle tarama, izleyici 10 dk yakındaysa ses çaldırma, pil çıkarma talimatı [D] ([MacRumors](https://www.macrumors.com/2021/12/13/android-tracker-detect-app/)). Bugünkü durumu doğrulanamadı [DY] | Harita, geçmiş ve dışa aktarım yok |
| AirGuard (TU Darmstadt) | Açık kaynak; AirTag, SmartTag ve başka izleyicileri algılar; 3 farklı yerde görülünce uyarır; "asla para kazanılmayacak, reklam yok" [D] ([IzzyOnDroid](https://apt.izzysoft.de/fdroid/index/apk/de.seemoo.at_tracking_detection?repo=main)). Google Play'deki girişi 24 Ekim 2026'da 404 verdi, Play'deki durumu doğrulanamadı [DY] | Güçlü, reklamsız rakip. İz Haritası'nın reklamı bu karşılaştırmada bir eksidir; ölçülü reklam kuralı bu yüzden bağlayıcı tutuldu |

## 4. Riskler ve önlemler

| Risk | Düzey | Önlem |
|---|---|---|
| **Marka:** "AirTag" ve "Find My" Apple'ın markaları; şikâyet gelirse Play girişi kaldırabilir | Orta-düşük | Ad "… için" biçiminde betimleyici. Simgede Apple öğesi yok. Açıklamada ve gizlilik sayfasında "bağlantılı değildir, onaylanmamıştır" notu var. Şikâyet gelirse yedek ad: "İz Haritası – İzleyici Bulucu" |
| **Kötüye kullanım algısı** ("takip uygulaması") | Düşük | Uygulama uzaktaki bir izleyicinin yerini göremez, yalnız telefonun duyduğu yakın yayınları görür. Metin "kendi eşyanı bul, seni izleyeni fark et" diye kurulu; TCK m.134-136 ve 112 notu var |
| **Güvenlik uygulamasında reklam** (itibar, kötü yorum) | Orta | Tarama, Bul ve takip uyarısı sırasında geçiş reklamı yok; banner içeriğin üstüne binmez. Yorumlar izlenir; gerekirse geçiş reklamı kapatılır (kodda tek kural) |
| **OpenStreetMap karo kuralı**: tanımlanamayan istek engellenir; ticari uygulamada "erişim her an geri çekilebilir" [D] ([OSMF](https://operations.osmfoundation.org/policies/tiles/)) | Orta | Uygulama kendini kullanıcı aracısında `IzHaritasi/<sürüm> (+adres)` diye tanıtır. WebView sayfası Referer gönderir: tarayıcı kimliğiyle Referer'sız gelen istek engelleniyor (`x-blocked: No referer sent`). Mağaza görselleri uygulamanın kendi Referer'ı ve kimliğiyle çekildi, karolar geldi. Önbellek sunucu başlıklarına uyar. Ayarlar'da kendi XYZ altlığını girme yolu var. Kullanım büyürse sözleşmeli bir karo sağlayıcısına geçilmeli |
| **Doğruluk beklentisi:** sinyal gücüyle kestirim metrelerce sapar | Orta | Açıklamada açıkça yazılı; elips belirsizliği gösterir; "Bilmen gerekenler" bölümü var |
| **Dar pazar:** yalnız Türkçe arayüz | Orta | Önce Türkiye; kullanım görülürse İngilizce arayüz (en büyük büyüme kaldıracı) |
| **Play incelemesi:** konum + Bluetooth + reklam kimliği | Düşük | Arka planda konum yok; izinler yalnız çekirdek işlev için; Veri güvenliği AdMob'un kendi beyanıyla birebir ([Google](https://developers.google.com/admob/android/privacy/play-data-disclosure)); Benzetim, incelemecinin donanımsız denemesini sağlar |
| **AB onayı:** AdMob AB/BK/İsviçre'de onay mesajı ister | Düşük | UMP SDK kurulu; AdMob'da "Avrupa tüzükleri" mesajı yayınlanınca form çıkar (PLAY-YAYIN.md adım 1.3); Ayarlar'da "Reklam gizlilik seçenekleri" |

## 5. Birim ekonomi (varsayımlı)

Gelir ≈ GKK × [(banner gösterimi/kişi × banner eBGM) + (geçiş gösterimi/kişi × geçiş eBGM)] / 1000
(GKK: günlük etkin kullanıcı; eBGM: bin gösterim başına etkin gelir).

Varsayımlar **[DY]**: Türkiye için banner eBGM 0,05-0,20 $, geçiş eBGM 0,5-2 $. AdMob ülke bazında eBGM yayımlamaz;
kamuya açık rakamlar ağ, biçim ve yıla göre çok değişir. Oturum 5 dk, banner 60 sn'de yenilenir (5 gösterim/oturum);
dışa aktarım seyrek (oturum başına ~0,1 geçiş gösterimi).

| GKK | Banner | Geçiş | Ay (≈30 gün) |
|---|---|---|---|
| 100 | 100 × 5 × 0,10 $ / 1000 = 0,05 $/gün | 100 × 0,1 × 1 $ / 1000 = 0,01 $/gün | ≈ 1,8 $ |
| 1.000 | 0,50 $/gün | 0,10 $/gün | ≈ 18 $ |
| 10.000 | 5 $/gün | 1 $/gün | ≈ 180 $ |

Sonuç: niş bir güvenlik aracı için reklam geliri **küçük** kalır. AdMob'un ödeme eşiği (100 $ ya da yerel karşılığı
[K]) düşük kullanımda aylar sürebilir. Maliyet tarafı da sıfıra yakın: geliştirici hesabı açık, gizlilik sayfası
GitHub Pages'te, karolar OSM'den (bağışla yürüyen bir hizmet; kullanım büyürse OSMF'ye bağış ya da ücretli sağlayıcı
düşünülmeli). Asıl değer gelir değil, Poyraz Workshop vitrini ve harita/CBS uzmanlığını gösteren bir ürün.

## 6. Sonra bakılacaklar

- İlk 30 günde: Play Console'da çökme/ANR, puan ve yorumlar; AdMob politika merkezi; OSM karo hatası şikâyeti.
- Kullanım görülürse sırayla: İngilizce arayüz, isteğe bağlı tek seferlik "reklamları kaldır" satın alımı (abonelik
  değil), sözleşmeli karo sağlayıcısı.
- Yorumlarda reklam şikâyeti yoğunlaşırsa önce geçiş reklamı kaldırılır, banner kalır.

## Kaynaklar

- Android bilinmeyen izleyici uyarıları: [9to5Google, 9 Ağustos 2023](https://9to5google.com/2023/08/09/android-unknown-tracker-alerts/); elle tarama: [gHacks](https://www.ghacks.net/?p=200472)
- Apple Tracker Detect: [MacRumors, 13 Aralık 2021](https://www.macrumors.com/2021/12/13/android-tracker-detect-app/)
- AirGuard: [IzzyOnDroid](https://apt.izzysoft.de/fdroid/index/apk/de.seemoo.at_tracking_detection?repo=main)
- AdMob veri beyanı: [developers.google.com](https://developers.google.com/admob/android/privacy/play-data-disclosure)
- OSM karo kullanım politikası: [operations.osmfoundation.org](https://operations.osmfoundation.org/policies/tiles/)
- Play önizleme varlıkları (simge 32 bit PNG, tanıtım görselinde cihaz görüntüsünden kaçınma, en az 4 ekran 1080×1920): [Play Console Yardım](https://support.google.com/googleplay/android-developer/answer/9866151)
- Play Veri güvenliği tanımları: [Play Console Yardım](https://support.google.com/googleplay/android-developer/answer/10787469)
