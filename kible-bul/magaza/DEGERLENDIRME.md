# Kıble Bul — yayın kararının uzman değerlendirmesi (27 Ekim 2026)

İstek: KUCUK_UYGULAMALAR'daki Kıble Bul'u (GeoTerva, 1.0.1) **Poyraz Workshop** hesabından, **AdMob reklamlı +
mevcut "reklamsız üyelik" aboneliğiyle** Google Play'de yayınlamak. Sahibin kararları (değişmez): APK'dan yeniden
derleme, paket `com.poyrazworkshop.kiblebul`, GeoTerva tam ekran reklamının kaldırılması, GeoTerva yalnız Hakkında'da
düz bir satır. Doğrulama işaretleri: **[D]** doğrulandı, **[K]** kısmen, **[DY]** doğrulanamadı.

## 1. Önerilen ve uygulanan biçim

- **Ölçülü reklam.** Kıble yönü ibadete hazırlıktır; reklam bu anı bölmemeli, kullanıcıyı incitmemeli:
  - **Banner** ekranın en altında **kendi şeridinde** (uyarlanabilir sabit banner). Sayfa banner yüksekliği kadar
    boşaltılır, banner sekme çubuğundan 6 px ayrılır ve hiçbir düğmenin, kartın ya da alt sayfanın üstüne binmez.
    Karşılamada, kalibrasyonda ve klavye açıkken gizlenir. Pusula ekranında da vardır, ama kadranın üstünde değil, ayrı
    şeritte (kadran biraz küçülür). Pusula ekranında banner istenmezse tek satırlık bir değişiklik: açık karar (§7).
  - **Geçiş reklamı** yalnız iki doğal durakta: bir **yer araması tamamlanıp** pusulaya dönülürken ve haritaya en az
    8 sn bakıldıktan sonra **haritadan çıkarken**. Oturumun ilk 3 dakikasında yok, iki reklam arası en az 4 dakika, saatte
    en çok 6. Pusula ve kalibrasyon açıkken, bir alt sayfa açıkken, yazarken asla; reklam açıkken pusula algılayıcısı
    durur. Açılış ve ödüllü reklam yok. Dayanak: AdMob geçiş reklamını "doğal geçiş noktalarında" ister, uygulama açılışı
    ve kapanışında ve art arda gösterimi yasaklar [D] ([AdMob: geçiş reklamı rehberi](https://support.google.com/admob/answer/6066980),
    [AdMob: izin verilmeyen geçiş reklamı uygulamaları](https://support.google.com/admob/answer/6201362)).
  - **İçerik:** her istekte en çok **G** (genel izleyici) derecesi; AdMob panelinde kumar, alkol, flört, cinsellik,
    sosyal kumarhane, astroloji, çabuk zengin olma gibi **hassas kategoriler engellenir** (`PLAY-YAYIN.md` adım 1;
    kategori listesi [AdMob Yardım](https://support.google.com/admob/answer/3150953) [D]).
- **Reklamsız üyelik** (özgündeki gibi `adfree`, aylık/yıllık; fiyat yalnız Play'den). Üyede AdMob ve UMP **hiç
  başlatılmaz**; uygulamayı yeniden kuran üye de reklam görmez (açılışta önce Play'e sorulur).
- **Gizlilik dürüstçe:** yalnız yaklaşık konum, yalnız telefonda; NASA karolarının bakılan bölgeyi gösterdiği hem
  uygulama içi metinde (11 dil) hem gizlilik sayfasında hem Veri güvenliği beyanında ("yaklaşık konum", ihtiyatla
  "paylaşım") yazılı. Özgündeki "ağ kullanımı yalnızca harita" cümlesi AdMob'la yanlış olacağı için değişti.
- **Ad:** "Kıble Bul – Kıble Pusulası" (tr), "Qibla Finder – Qibla Compass" (en) ve 9 dilde karşılıkları; telefondaki
  ad özgündeki gibi dile göre (Kıble Bul, Qibla Finder, اتجاه القبلة…). Kategori **Yaşam Tarzı**, 13 yaş ve üzeri.

## 2. Güçlü yanlar

| Yön | Neden önemli |
|---|---|
| 🧭 Gerçek kuzey düzeltmesi (WMM 2025) | Telefon manyetik kuzeyi verir; kıble coğrafi kuzeyden ölçülür. Sapma İstanbul'da ≈ +6°, bazı yerlerde 10-15°'yi aşar. Uygulamanın modeli NOAA/NCEI'nin resmî sınama değerlerini 0,01° içinde tutturur [D] (`test/kible.test.mjs`, [WMM2025 sınama değerleri](https://www.ncei.noaa.gov/sites/default/files/2025-02/WMM2025_TEST_VALUES.txt)) |
| 🎯 Doğruluk göstergesi + parazit uyarısı | Android'in algılayıcı değerlendirmesi ve ölçülen alan şiddeti yerin beklenen şiddetiyle karşılaştırılır: mıknatıslı kılıf, metal masa yanlış yönü sessizce göstermez. Rakiplerin şikâyetlerindeki "kıble yanlış" sorununun asıl nedeni budur [K] |
| 📍 Yalnız yaklaşık konum, sunucu yok | Müslüman uygulamalarının konum verisi 2020'de veri aracılarına satılmış, ABD ordusunun satın aldığı haberleri çıkmıştı (Muslim Pro, Qibla Compass) [D] ([Al Jazeera, 17 Kasım 2020](https://www.aljazeera.com/news/2020/11/17/report-us-military-buying-location-data-on-popular-muslim-apps)). "Konumunuz telefondan çıkmaz" bu kitlede gerçek bir güven farkıdır |
| 🔎 34.000 şehir internetsiz, 11 dilde | İzin vermeyen ya da GPS'i kapalı kullanıcı da kıbleyi bulur; seyahatte internetsiz çalışır |
| 🌐 11 dil, Arapça sağdan sola | Hedef kitle çok dilli: Türkçe, Arapça, Rusça, Fransızca, Almanca ve İngilizce konuşan büyük Müslüman toplulukları kapsanıyor (Endonezyaca, Urduca, Farsça yok: §6) |
| Yalın ve tek işlevli | Namaz vakti, Kur'an, zikir gibi ek işlev yok: hızlı açılır, az izin ister |

## 3. Rakipler (kaynaklı)

| Rakip | Ne yapar | Fark |
|---|---|---|
| Qibla Connect (Quran Reading) | Kıble + namaz vakti + dini içerik; ≈ 28 milyon indirme, puan ≈ 3,7 [K] ([chrome-stats](https://chrome-stats.com/d/com.quranreading.qibladirection)). Yorumlarda yoğun ve uygunsuz reklam, yanlış kıble şikâyetleri [K] | Pazar büyük ama kullanıcı reklamdan yorgun: Kıble Bul'un ölçülü reklamı ve hassas kategori engeli tanıtımda öne çıkarılabilir (metinde reklam kuralları açıkça yazılı) |
| Qibla Compass (9D Muslim Apps) | Kıble pusulası; ≈ 230 bin değerlendirme, puan ≈ 3,9; yorumlarda kumar ve borç reklamları [K] ([grand-screen](https://grand-screen.com/apps/qibla-compass-qibla-direction/reviews/)) | Aynı sorun: kumar reklamı bu kitlede en sert tepkiyi alıyor → AdMob'da kumar/alkol kapalı kalmalı (varsayılan zaten kapalı, "İzin ver" basılmaz) |
| Muslim Pro | Namaz vakti, Kur'an, kıble; 100 milyon+ indirme [K]; 2020 konum verisi tartışması [D] (yukarıdaki kaynak) | Kapsamlı ama ağır; Kıble Bul'un konumu tek işlev ve gizlilik |
| Google Qibla Finder (web) | 2017'de çıkan tarayıcı uygulaması; artırılmış gerçeklikle kamera görüntüsüne kıble çizgisi [D] ([9to5Google, 12 Haziran 2017](https://9to5google.com/2017/06/12/google-qibla-finder-ar-web-app/)). Bugünkü durumu doğrulanamadı [DY] | Ücretsiz ve reklamsız; ama manyetik sapma ve parazit uyarısı göstermez, çevrimdışı çalışmaz [K] |
| Türkiye'de namaz vakti uygulamaları | Diyanet verisiyle namaz vakti + kıble pusulası sunan çok sayıda uygulama (ör. "Diyanet Namaz Vaktim", İslam ve İhsan "Namaz Vakti") [K] ([BlueStacks](https://www.bluestacks.com/tr/apps/tools/religious-affairs-prayer-time-on-pc.html), [İslam ve İhsan](https://www.islamveihsan.com/islam-ve-ihsan-namaz-vakti-mobil-uygulamasi.html)) | Türk kullanıcının çoğu kıbleyi zaten namaz vakti uygulamasında buluyor: Kıble Bul'un değeri doğruluk göstergesi, gerçek kuzey ve seyahatte çevrimdışılık |

Sonuç: Pazar kalabalık ve "kıble pusulası" araması güçlü; ayrışma reklamın ölçülülüğü, gizlilik ve doğruluk
şeffaflığı üzerinden kurulmalı. Mağaza metni bu üç noktayı söylüyor; "en iyi", "%100 doğru" gibi iddia yok.

## 4. Riskler ve önlemler

| Risk | Düzey | Önlem |
|---|---|---|
| **Hesap geçmişi:** Poyraz Workshop'un daha önce 2 uygulaması askıya alındı; yeni bir ihlal hesabı tehlikeye atar | Yüksek | Sınırda hiçbir davranış yok: açılış/ödüllü reklam yok, geçiş reklamı yalnız doğal durakta ve seyrek, banner içerik üstüne binmez (AdMob "kazara tıklama" kuralı), Veri güvenliği AdMob'un kendi beyanıyla birebir ve ihtiyatlı, mağaza metninde fiyat/marka/abartı yok, ekran görüntüleri uygulamanın gerçek ekranı. Test kimlikli paket Play'e yüklenmez |
| **Uygunsuz reklam** (kumar, alkol, flört, açık görsel) bu kitlede tepki ve 1 yıldızlı yorum getirir | Yüksek | G derecesi (kod) + hassas kategori engeli (panel) + yayından sonra Reklam inceleme merkezi takibi. Rakiplerin en sık şikâyeti bu [K] |
| **Doğruluk beklentisi:** telefon pusulası mıknatıs, metal ve kılıftan etkilenir; "yanlış kıble" yorumu | Orta | Doğruluk göstergesi, parazit uyarısı, kalibrasyon yardımcısı; metinde "ekrandaki yön telefonunuzun pusulası kadar doğrudur" açıkça yazılı |
| **Dini hassasiyet** (Kâbe görseli, metinlerin dili) | Düşük-orta | Görseller özgün uygulamanın kendisi; metinler saygılı ve sade; ibadet hakkında hüküm veren cümle yok |
| **Konum gizliliği** (bu kitlede geçmişte skandal var) | Orta | Yalnız yaklaşık konum, sunucu yok, AdMob'a konum verilmez; NASA karoları ve AdMob'un IP'den yaklaşık konum çıkarabileceği açıkça yazılı |
| **NASA GIBS karoları:** kamu hizmeti, anahtarsız; erişim değişebilir ya da kesilebilir [K] | Düşük | Karo gelmezse harita ülke sınırlarıyla çizilir (özgün davranış). Kullanım büyürse sözleşmeli bir uydu karo sağlayıcısı düşünülür |
| **AB onayı** | Düşük | UMP önce, onay yoksa reklam istenmez; Ayarlar'da "Reklam gizlilik seçenekleri"; AdMob'da Avrupa tüzükleri mesajı (ortak adım) |
| **Abonelik politikası** (Play: fiyat, yenileme ve iptal açık olmalı) | Düşük | Üyelik ekranında Play'in yerel fiyatı, "otomatik yenilenir, Google Play'den istediğiniz zaman iptal" metni, geri yükleme ve yönetim düğmeleri; fiyat uygulamada yazılı değil |

## 5. Birim ekonomi (varsayımlı)

Gelir ≈ GKK × [(banner gösterimi/kişi × banner eBGM) + (geçiş gösterimi/kişi × geçiş eBGM)] / 1000 + abonelik
(GKK: günlük etkin kullanıcı; eBGM: bin gösterim başına etkin gelir).

Varsayımlar **[DY]**: banner eBGM 0,05-0,30 $, geçiş eBGM 0,5-3 $ (Türkiye ve Orta Doğu düşük, Körfez ve Batı Avrupa
yüksek; AdMob ülke bazında eBGM yayımlamaz). Kıble uygulamasında oturum kısadır (30-60 sn) ve çoğu kullanıcı yalnız
pusulaya bakar: oturum başına ≈ 1 banner gösterimi, geçiş reklamı seyrek (oturum başına ≈ 0,05). Hassas kategori engeli
doluluğu bir miktar düşürür.

| GKK | Banner | Geçiş | Ay (≈30 gün) |
|---|---|---|---|
| 1.000 | 1.000 × 1 × 0,15 $ / 1000 = 0,15 $/gün | 1.000 × 0,05 × 1,5 $ / 1000 = 0,08 $/gün | ≈ 7 $ |
| 10.000 | 1,5 $/gün | 0,75 $/gün | ≈ 68 $ |
| 100.000 | 15 $/gün | 7,5 $/gün | ≈ 675 $ |

Abonelik: aylık etkin kullanıcının %0,1-0,3'ü [DY], yıllık plan ağırlıklı (9,99 $ − %15 Play bedeli ≈ 8,5 $/yıl [D]
([Play hizmet bedelleri](https://support.google.com/googleplay/android-developer/answer/112622))). 30.000 aylık
kullanıcıda ≈ 30-90 abone ≈ 20-65 $/ay.

Sonuç: gelir ancak on binlerce kullanıcıda anlamlı olur; maliyet sıfıra yakın (hesap açık, sayfalar GitHub Pages'te,
karolar NASA'dan, sunucu yok). Asıl değer Poyraz Workshop vitrini ve harita/CBS uzmanlığını gösteren (WMM, büyük daire,
kalite göstergesi) temiz bir ürün. Reklamın ölçülü tutulması geliri biraz düşürür ama puanı ve hesabı korur: bu kitlede
doğru takas budur.

## 6. Sonra bakılacaklar

- İlk 30 günde: Play Console'da çökme/ANR, puan ve yorumlar ("yanlış yön", "reklam"); AdMob politika merkezi ve Reklam
  inceleme merkezi; abonelik iptal nedenleri.
- Yorumlarda reklam şikâyeti yoğunlaşırsa önce **geçiş reklamı kapatılır** (`reklam.js › NEDENLER = []`), banner kalır;
  pusula ekranındaki banner şikâyet alırsa yalnız oradan kaldırılır.
- Kullanım görülürse: Endonezyaca, Urduca, Farsça, Malayca arayüz (dünyanın en kalabalık Müslüman nüfusları; şu an yok).

## 7. Sahibin kararına kalanlar

1. **Pusula ekranında banner:** şimdi var (ayrı şeritte). Kaldırmak geliri belirgin düşürür (kullanıcıların çoğu yalnız
   pusulayı açar), ama ibadet anını tamamen reklamsız bırakır.
2. **"Din" hassas kategorisi:** açık bırakıldı (Kur'an, namaz vakti, hac-umre reklamları bu kategoride); başka inançların
   tanıtımı görülürse kapatılır.
3. **Fiyatlar:** 0,99 $ / 9,99 $ öneridir; Play'in yerel fiyatları onaylanır (`fiyatlandirma.md`).

## Kaynaklar

- AdMob hassas kategoriler: [support.google.com/admob/answer/3150953](https://support.google.com/admob/answer/3150953)
- AdMob geçiş reklamı rehberi: [6066980](https://support.google.com/admob/answer/6066980); izin verilmeyen uygulamalar: [6201362](https://support.google.com/admob/answer/6201362)
- AdMob Play veri beyanı: [developers.google.com/admob/android/privacy/play-data-disclosure](https://developers.google.com/admob/android/privacy/play-data-disclosure)
- Play Veri güvenliği tanımları (yaklaşık konum ≥ 3 km², ödeme hizmeti istisnası): [support.google.com/googleplay/android-developer/answer/10787469](https://support.google.com/googleplay/android-developer/answer/10787469)
- Play hizmet bedelleri: [112622](https://support.google.com/googleplay/android-developer/answer/112622)
- WMM 2025 sınama değerleri: [NCEI](https://www.ncei.noaa.gov/sites/default/files/2025-02/WMM2025_TEST_VALUES.txt)
- Müslüman uygulamalarının konum verisi (2020): [Al Jazeera](https://www.aljazeera.com/news/2020/11/17/report-us-military-buying-location-data-on-popular-muslim-apps)
- Google Qibla Finder: [9to5Google](https://9to5google.com/2017/06/12/google-qibla-finder-ar-web-app/)
- Rakip istatistikleri (üçüncü taraf izleyiciler, kesin değil): [chrome-stats: Qibla Connect](https://chrome-stats.com/d/com.quranreading.qibladirection), [grand-screen: Qibla Compass](https://grand-screen.com/apps/qibla-compass-qibla-direction/reviews/)
