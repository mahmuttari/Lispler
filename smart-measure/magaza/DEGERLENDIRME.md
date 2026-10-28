# Ölçü Kutusu (Measure Box; özgün adı Smart Measure) — yayın kararının uzman değerlendirmesi (27 Ekim 2026)

İstek: KUCUK_UYGULAMALAR'daki Smart Measure 0.1.0 APK'sını (GeoTerva, yerel Kotlin + Jetpack Compose + CameraX,
yayınlanmamış ilk sürüm) **Poyraz Workshop** hesabından, **AdMob reklamlı + reklamsız abonelikli** olarak Google Play'de
yayınlamak. Sahibin kararları kesindir (`kucuk-sozlesme`): APK'dan yeniden kur, paket `com.poyrazworkshop.smartmeasure`,
AdMob + `adfree` aboneliği, bu turda yayınla, yarım kalanları bitir. Kaynak kod olmadığı için uygulama aynı özellikler,
akışlar ve metinlerle **Capacitor 8** ile yeniden yazıldı (README). Doğrulama işaretleri: **[D]** doğrulandı, **[K]**
kısmen, **[DY]** doğrulanamadı.

## 0. Ad çakışması (YÜKSEK) → karar: Ölçü Kutusu / Measure Box

**Karar (28 Ekim 2026):** mağaza adı **"Ölçü Kutusu – Terazi, Cetvel"** (tr-TR) ve **"Measure Box – Level & Ruler"**
(en-US), telefondaki ad Türkçe telefonda "Ölçü Kutusu", ötekilerde "Measure Box". Sahip uzman önerisiyle devam
edilmesini istedi ("Devam et"); iki ad için de Play'de aynı adda uygulama bulunamadı [K] (web araması, 28 Ekim 2026).
Paket adı `com.poyrazworkshop.smartmeasure` kullanıcıya görünmediği için değişmedi.

Google Play'de aynı adda, aynı kategoride ve **aynı yöntemle** (kamera + trigonometri ile mesafe ve yükseklik) çalışan,
10 milyondan fazla indirilmiş bir uygulama var: **"Smart Measure"**, geliştirici *Smart Tools co.*, paket
`kr.sira.measure`, reklamlı, 135 bin değerlendirmede 2,8 puan [D] ([Google Play](https://play.google.com/store/apps/details?id=kr.sira.measure),
27 Ekim 2026'da açıldı). Aynı geliştiricinin "Smart Level" ve "Sound Meter" uygulamaları da var [D]
([Smart Level](https://play.google.com/store/apps/details?id=kr.sira.level), [Sound Meter](https://play.google.com/store/apps/details?id=kr.sira.sound)).

Play'in **Kimliğe bürünme** politikası "mevcut ürünlerinkine kullanıcıları yanıltacak kadar benzeyen uygulama adlarını"
yaygın ihlal olarak sayar [D] ([Play Console Yardım: Impersonation](https://support.google.com/googleplay/android-developer/answer/9888374)).
Hesapta daha önce askıya alınmış iki uygulama olduğu için bir ad şikâyeti ya da inceleme reddi üçüncü bir uyarıya dönüşebilir.
"Smart Measure" ifadesinin tescilli marka olup olmadığı doğrulanamadı [DY].

**Uzman önerisi:** mağaza adı ve telefondaki ad **ayırt edici** olsun; "Smart Measure" ancak ikinci bir sözcükle bile
riskli kalır. Öneriler (Play'de aynı adda uygulama olmadığı yayından önce bir kez daha aranmalı): **"Ölçü Kutusu –
Terazi, Cetvel"** / İngilizce **"Measure Box – Level & Ruler"** ya da **"Poyraz Ölçer"** / **"Poyraz Measure"**. Bu
sürümdeki dosyalar ilk başta özgün adla ("Smart Measure – Ölçüm Araçları", "Smart Measure – Level & Ruler") hazırlanmıştı;
ad değişirse değişecek yerler README'nin "Ad değişirse" bölümündedir (kod değişmez, yalnız metinler ve görseller).
Paket adı (`com.poyrazworkshop.smartmeasure`) kullanıcıya görünmez, kalabilir.

## 1. Önerilen ve uygulanan biçim

- **Ücretsiz, reklamlı + isteğe bağlı reklamsız abonelik** (`adfree`, 0,99 $/ay, 9,99 $/yıl; fiyatlar Play'den).
  Altta uyarlanabilir banner kendi şeridinde; geçiş reklamı yalnız bir araçtan çıkarken, oturumun ilk 3 dakikasında
  yok, en az 4 dakika arayla, saatte en çok 6. Ölçüm, kalibrasyon, kamera ya da mikrofon açıkken asla. Açılış ve ödüllü
  reklam yok. Reklam içerik derecesi G. Abonede reklam SDK'sı hiç başlatılmaz.
- **Dürüst doğruluk dili:** her aracın tipik doğruluğu uygulamada ("Doğruluk ve kalibrasyon") ve mağaza metninde yazılı;
  kamerayla ölçüm "lazer ya da derinlik sensörü değil, trigonometri" diye anlatılıyor, her sonuç ± belirsizlikle;
  ses ölçer kalibrasyonsuz yalnız göreli dBFS(A) gösteriyor.
- **İzinler en aza indirildi:** kamera ve mikrofon yalnız ön planda, ekrandaki düğmeyle ve nedeni yazılarak istenir;
  konum, depolama, ön plan hizmeti yok (WorkManager'ın getirdiği `FOREGROUND_SERVICE` kaldırıldı). Donanımların hepsi
  "zorunlu değil": kamerası ya da ışık sensörü olmayan cihaz da kurabilir, eksik olan araçta söylenir.
- **Kategori Araçlar, 13 yaş ve üzeri.** Hesap ve sunucu yok. Veri güvenliğinde yalnız AdMob beyan edilir; kamera
  görüntüsü ve mikrofon sesi cihazda işlenip atılır (`aciklamalar.md`).
- **İki dil (tr-TR varsayılan, en-US)**, özgün uygulamanın iki diliyle bire bir.

## 2. Güçlü yanlar

| Yön | Neden önemli |
|---|---|
| Altı araç tek uygulamada | Terazi, cetvel, açıölçer, kamerayla mesafe/yükseklik/genişlik, ses ve ışık; rakiplerin çoğu tek araç ya da ayrı uygulamalar dizisi (Smart Tools co. her aracı ayrı uygulama olarak dağıtıyor [D]) |
| Kalibrasyon merkezi | Terazi (iki adımlı ters çevirme), cetvel (banka kartı), ses (referans ölçer), telefon yüksekliği tek yerde; "kalibre edildi / edilmedi" durumu görünür |
| Belirsizlik gösterimi | Kamerayla ölçümde her sonuç ± ile; ufka yakın, belirsiz ölçüm 8° kuralıyla reddedilir |
| Dürüst ses ölçer | NIOSH'ın 2014 incelemesinde yalnız 4 iOS uygulaması profesyonel ölçerin ±2 dB'sine girdi, Android uygulamaları ölçüt dışında kaldı [D] ([NIOSH](https://www.cdc.gov/niosh/blogs/2014/sound-app.html)); bu yüzden kalibrasyonsuz değer "göreli" diye etiketleniyor, güvenlik yorumu kalibrasyon ister |
| Işık ölçerde gerçekçi dil | Telefon ışık sensörlerinin kalibrasyonsuz "lüksmetre olarak geçerli olmadığı" bulgusu [K] ([ULisboa](https://repositorio.ulisboa.pt/handle/10400.5/31278), [Rev. Cub. Fís. 2020](https://revistacubanadefisica.org/index.php/rcf/article/view/2020v37p131)); uygulama değeri "gösterge" olarak sunuyor |
| Hesapsız, sunucusuz | Geçmiş ve kalibrasyonlar telefonda; kamera ve mikrofon verisi telefondan çıkmıyor |
| Açık ve koyu tema | Özgün sürümde "geliştiriliyor" diye işaretli açık tema tamamlandı |

## 3. Rakipler (kaynaklı, Google Play, 27 Ekim 2026)

| Rakip | Ne yapar | Fark |
|---|---|---|
| Smart Measure — Smart Tools co. (`kr.sira.measure`) | Kamera + trigonometriyle mesafe ve yükseklik; 10M+ indirme, reklamlı, 2,8 puan [D] | Aynı ad ve yöntem (bkz. §0). Bizim farkımız: belirsizlik gösterimi, genişlik, öbür beş araç |
| Sound Meter — Smart Tools co. (`kr.sira.sound`) | Ses düzeyi; 10M+, reklamlı, 4,4 [D] | Bizde kalibrasyon akışı ve kalibrasyonsuz "göreli" etiketi |
| Sound Decibel Meter — Splend Apps (`com.splendapps.decibel`) | Ses düzeyi; 10M+, reklamlı + uygulama içi satın alma, 4,7 [D] | Yüksek puanlı tek araç; bizde ses + beş araç |
| Smart Level — Smart Tools co. (`kr.sira.level`) | Su terazisi; 1M+, reklamlı, 4,3 [D] | Bizde üç kip, iki adımlı kalibrasyon |
| Bubble Level — Antoine Vianey (`fr.avianey.level`) | Su terazisi; 500K+, **reklamsız**, uygulama içi satın alma, 4,3 [D] | Reklamsız rakip; bizim reklam kurallarımız bu yüzden ölçülü tutuldu |
| Google Measure (ARCore) | Google'ın AR cetveli; Haziran 2021'de geri çekildi, yeni kullanıcıya kapalı [D] ([9to5Google](https://9to5google.com/2021/06/08/google-measure-ar-app-sunset/)) | Boşluk büyük ölçüde üçüncü taraf AR cetvelleriyle doldu; bizim yöntemimiz ARCore istemez, her telefonda çalışır |

Puan ve indirme sayıları Play'in kendi sayfalarından alındı; değişebilir. Rakiplerin reklam sıklığı ölçülmedi [DY].

## 4. Riskler ve önlemler

| Risk | Düzey | Önlem |
|---|---|---|
| **Ad çakışması / kimliğe bürünme** (§0) | **Yüksek** | Sahip yayından önce ad seçmeli; öneriler §0'da. Simge özgün (küp), rakibin simgesine benzemiyor; açıklamada rakibin adı geçmiyor |
| **Hesap geçmişi:** Poyraz Workshop'ta askıya alınmış iki uygulama | Yüksek etki | Sınırda hiçbir davranış yok: reklam kuralları sınanmış (`test/reklam.test.mjs`), açılış/ödüllü reklam yok, izinler yalnız ön planda, Veri güvenliği AdMob'un kendi beyanıyla birebir, mağaza metninde rakip adı, puan, fiyat, abartı yok |
| **Kamera ve mikrofon izni** (inceleme ve kullanıcı güveni) | Orta | İzinler araç açılınca, ekrandaki düğmeyle ve nedeniyle istenir; görüntü ve ses kaydedilmez; arka planda kullanılmaz; gizlilik politikası her izni ayrı anlatır |
| **Doğruluk beklentisi** (kötü yorum) | Orta | Doğruluk her araçta ve mağazada yazılı; belirsiz kamera ölçümü reddedilir; kalibrasyon merkezi |
| **Gerçek cihazda denenmedi** (bu ortamda emülatör/telefon yok) | Orta | Web tarafı tarayıcıda, ses işleme JVM'de sınandı; yayından önce dahili test kanalında bir telefonda denenecekler: kamera önizlemesi ve fener (WebView'in `torch` kısıtı), dönme vektörüyle yön, ışık sensörü, mikrofon (UNPROCESSED kaynağı), banner'ın gezinme çubuğunun üstünde durması, abonelik |
| **Reklam bir araç uygulamasında** (itibar) | Orta | Geçiş reklamı yalnız araçtan çıkarken ve seyrek; ölçüm sırasında asla; abonelik reklamı tümüyle kaldırır |
| **Ses ölçerin sağlık algısı** | Düşük | "Yalnızca bilgilendirme amaçlıdır: sertifikalı bir ölçer değildir"; güvenlik yorumu kalibrasyonsuz gösterilmez; Uygulama içeriğinde sağlık özelliği yok |
| **AB onayı:** AdMob AB/BK/İsviçre'de onay mesajı ister | Düşük | UMP önce sorulur; Ayarlar'da "Reklam gizlilik seçenekleri"; mesaj dört uygulamanın ortak AdMob mesajıyla yayınlanır |
| **Büyük ekran:** Android 16 büyük ekranlarda dikey kilidi yok sayar | Düşük | Arayüz duyarlı (en çok 640 px sütun); tablette yatayda da kullanılabilir |

## 5. Birim ekonomi (varsayımlı)

Gelir ≈ GKK × [(banner gösterimi/kişi × banner eBGM) + (geçiş gösterimi/kişi × geçiş eBGM)] / 1000 + abonelik
(GKK: günlük etkin kullanıcı; eBGM: bin gösterim başına etkin gelir).

Varsayımlar **[DY]**: Türkiye için banner eBGM 0,05–0,20 $, geçiş eBGM 0,5–2 $ (AdMob ülke bazında eBGM yayımlamaz).
Oturum 3 dk, banner 60 sn'de yenilenir (3 gösterim/oturum); araçtan çıkış sık ama 3 dk/4 dk kuralı yüzünden oturum
başına ~0,2 geçiş gösterimi; kişi başına günde 1 oturum. Abonelik dönüşümü etkin kullanıcıların %0,3'ü, Play payı %15.

| GKK | Banner | Geçiş | Abonelik (yıllık plan ağırlıklı, aylık ort. ~0,75 $ net) | Ay (≈30 gün) |
|---|---|---|---|---|
| 100 | 100 × 3 × 0,10 $ / 1000 = 0,03 $/gün | 100 × 0,2 × 1 $ / 1000 = 0,02 $/gün | ~0,2 $ | ≈ 1,7 $ |
| 1.000 | 0,30 $/gün | 0,20 $/gün | ~2 $ | ≈ 17 $ |
| 10.000 | 3 $/gün | 2 $/gün | ~22 $ | ≈ 170 $ |

Sonuç: ölçüm araçları kalabalık bir alan; gelir küçük kalır, değer Poyraz Workshop vitrini ve araç ailesi
(Unitica, Calqora, Kıble Bul) içinde çapraz tanınırlıktadır. Maliyet sıfıra yakın: sunucu yok, sayfalar GitHub Pages'te.

## 6. Sonra bakılacaklar

- Yayından önce: ad kararı (§0); dahili test kanalında gerçek telefonda deneme (§4).
- İlk 30 günde: Play Console'da çökme/ANR, puan ve yorumlar (özellikle kamera ölçümü doğruluğu ve reklam şikâyeti);
  AdMob politika merkezi.
- Kullanım görülürse: kamera ölçümünde ARCore yöntemi (özgün uygulamada "sonraki sürüm" diye planlıydı), alan ölçümü,
  ölçümü fotoğrafa işleyip kaydetme (o zaman Veri güvenliği yeniden değerlendirilir).

## Kaynaklar

- Smart Measure (Smart Tools co.): [Google Play](https://play.google.com/store/apps/details?id=kr.sira.measure); Smart Level: [Google Play](https://play.google.com/store/apps/details?id=kr.sira.level); Sound Meter: [Google Play](https://play.google.com/store/apps/details?id=kr.sira.sound)
- Sound Decibel Meter (Splend Apps): [Google Play](https://play.google.com/store/apps/details?id=com.splendapps.decibel); Bubble Level (Antoine Vianey): [Google Play](https://play.google.com/store/apps/details?id=fr.avianey.level)
- Play kimliğe bürünme politikası: [Play Console Yardım](https://support.google.com/googleplay/android-developer/answer/9888374)
- Google Measure'ın geri çekilmesi: [9to5Google, 8 Haziran 2021](https://9to5google.com/2021/06/08/google-measure-ar-app-sunset/)
- Telefon ses ölçer uygulamalarının doğruluğu: [NIOSH Science Blog, 2014](https://www.cdc.gov/niosh/blogs/2014/sound-app.html)
- Telefon ışık sensörlerinin doğruluğu: [ULisboa deposu](https://repositorio.ulisboa.pt/handle/10400.5/31278), [Revista Cubana de Física 2020](https://revistacubanadefisica.org/index.php/rcf/article/view/2020v37p131)
- AdMob veri beyanı: [developers.google.com](https://developers.google.com/admob/android/privacy/play-data-disclosure); Play Veri güvenliği tanımları: [Play Console Yardım](https://support.google.com/googleplay/android-developer/answer/10787469)
