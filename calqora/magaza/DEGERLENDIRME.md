# Calqora — yayın kararının uzman değerlendirmesi (27 Ekim 2026)

İstek (sahibin kesin kararları): Drive'daki KUCUK_UYGULAMALAR APK'larını **Poyraz Workshop** hesabından Google Play'de
yayınlamak; Calqora web koduyla yeniden kurulur, paket `com.poyrazworkshop.calqora`, gelir **Google AdMob + mevcut
"reklamsız" Play aboneliği**; GeoTerva tam ekran ev reklamı kalkar, GeoTerva yalnız Hakkında'da düz bir bağlantı
olarak kalır. Doğrulama işaretleri: **[D]** doğrulandı, **[K]** kısmen (ikincil kaynak), **[DY]** doğrulanamadı.

## 1. Önerilen ve uygulanan biçim

- **Ücretsiz, reklamlı, reklamsız abonelikli.** Altta uyarlanabilir banner, kendi şeridinde (hiçbir düğmenin üstüne
  binmez, klavye açılınca gizlenir). Geçiş reklamı yalnız doğal bir durakta: Grafik, Matris ya da Birim ekranından
  ayrılırken ve Ayarlar kapanırken. İlk 3 dakikada yok, iki reklam arası en az 4 dakika, saatte en çok 6; ifade
  yazılırken, sayı tuş takımı ya da klavye açıkken ve herhangi bir sayfa açıkken asla. Açılış reklamı ve ödüllü reklam
  yok. Kurallar `www/js/reklam.js` başlığında yazılı, `test/reklam.test.mjs` ve `araclar/tarayici-dene.mjs` sınar.
- **1.0.0'a göre bilerek yumuşatıldı.** Özgün sürüm açılıştan 5 sn sonra ve kullanımda her 3 dakikada bir, 10 sn
  kapatılamayan tam ekran bir ev reklamı gösteriyordu. Bunu AdMob'a aynen taşımak, AdMob'un "uygulama açılışında ve
  beklenmedik anda geçiş reklamı yok" kuralına aykırı olurdu (§4).
- **Reklamsız abone için reklam SDK'sı hiç başlatılmaz** (UMP formu da çıkmaz): reklamlar ancak Google Play "üye değil"
  dedikten sonra başlar. Abonelik kimlikleri özgünle aynı (`adfree`: `monthly`, `yearly`); fiyatlar her zaman mağazadan.
- **Ad:** "Calqora – Bilimsel Hesap" (özgün sertifikadaki eski ad "Bilimsel Hesap" korunur); öbür dillerde
  "Calqora: Scientific Calculator" vb. Adda "en iyi", "ücretsiz", emoji ve büyük harfli sözcük yok.
- **11 dil, tüm ülkeler.** Uygulama 11 dilde; mağaza girişi de aynı 11 dilde (pt-BR, es-ES, ja-JP, ko-KR, ar…).
- **Kategori Araçlar, 13 yaş ve üzeri.** Eğitim de uygundu; ama "öğrenci hesap makinesi" algısı Play'in "çocuklara hitap
  ediyor mu" değerlendirmesini ve Aileler politikasını (yalnız sertifikalı reklam SDK'ları, ayrı reklam ayarı) gündeme
  getirebilir. Hesabın geçmişi (§4) yüzünden daha az tartışmalı seçenek alındı. Mağaza görselleri ve metni de çocuksu
  değil; reklam içerik derecesi en çok G.

## 2. Güçlü yanlar

| Yön | Neden önemli |
|---|---|
| Hepsi bir arada | Bilimsel hesap + 4 fonksiyonlu grafik + karmaşık sayı + 5×5 matris + 140 birim + 46 sabit tek uygulamada; rakiplerde bunlar çoğunlukla ayrı uygulama ya da ücretli sürümde (§3) |
| Kâğıttaki gibi gösterim | Kök çizgisi kökün altındakinin tamamına uzanır, sonuç yazarken görünür; kesir ve derece-dakika-saniye gösterimi |
| Mühendislik birimleri | tf/m², kgf/cm², ksf, metre su sütunu, betonarme birim hacim ağırlığı gibi inşaat ve su mühendisliğinde kullanılan birim ve sabitler: sahibin uzmanlık alanına uygun, Türk mühendislik pratiğine yakın |
| 11 dil, Türkçe dahil | Arapça sağdan sola, hesap alanı soldan sağa; ondalık virgül dile göre |
| Hesapsız, çevrimdışı | Hesaplar internete çıkmaz; Veri güvenliği beyanı yalnız AdMob'dan ibaret |
| Hafif | Web kodu ~300 KB (11 dil dahil); R8'siz APK ~7,8 MB (çoğu AdMob ve Play Hizmetleri) |

## 3. Rakipler (kaynaklı)

| Rakip | Ne yapar | Fark |
|---|---|---|
| HiPER Scientific Calculator | Play'de 10 milyon+ kurulum, ~4,7 puan, ~259 bin değerlendirme (Ağustos-Eylül 2026) [K] ([APKCombo](https://apkcombo.com/hiper-scientific-calculator/cz.hipercalc/), [Best Apps for Android](https://bestappsforandroid.com/best-calculator-apps-for-android/)); ayrıca ücretli "HiPER Calc Pro" [K] ([App Pricing Lab](https://apppricinglab.com/app/google_play/cz.hipercalc.pro)) | Pazarın lideri, çok güçlü bir hesap çekirdeği. Grafik ve matris yok/sınırlı [DY]. Calqora onunla "hesap" alanında yarışamaz; fark hepsi bir arada ve 11 dilli olmasında |
| RealCalc Scientific Calculator | 10 milyon+ kurulum [K] ([APKCombo](https://apkcombo.com/realcalc-scientific-calculator/uk.co.nickfines.RealCalc/)); birim dönüşümü, fizik sabitleri, geçmiş, RPN; kesir ve DMS ücretli "Plus"ta; ücretsiz sürümde reklam var ve şikâyet ediliyor [K] ([Grand Screen](https://grand-screen.com/apps/realcalc-plus/)) | Calqora'da kesir, DMS, karmaşık sayı, matris ve grafik ücretsiz sürümde; reklam kuralları daha seyrek |
| Desmos Graphing Calculator | Ücretsiz, çevrimdışı çalışır [K] (iOS girişi: [App Store](https://apps.apple.com/us/app/desmos-graphing-calculator/id653517540)); Android paketi `com.desmos.calculator` [K] | Grafikte çok daha güçlü ve reklamsız [DY]. Calqora'nın grafiği "hesap makinesindeki hızlı grafik" düzeyinde; tanıtım bunu abartmamalı |
| GeoGebra Scientific Calculator | Ücretsiz; kesir, trigonometri, istatistik, sınav modu; Android paketi `org.geogebra.android.scicalc` [K] ([GeoGebra](https://mat.geogebra.org/m/y5jhpaq8), [App Store](https://apps.apple.com/app/id1412748754)) | Eğitim kurumu desteği ve sınav modu. Calqora'da sınav modu yok |
| Telefonun kendi hesap makinesi | Çoğu telefonda hazır, yatayda bilimsel tuşlar [DY] | Ücretsiz ve hazır olduğu için temel ihtiyacı karşılar; Calqora'nın değeri grafik, matris, birim ve sabitlerde |

Sonuç: Pazar doymuş; büyük rakiplerin kurulum tabanı milyonlarca. Calqora'nın şansı **niş ve dil**: Türkçe başta 11
dilde, mühendislik birimleriyle, hepsi bir arada. Organik keşif düşük olacaktır; beklenti buna göre tutulmalı.

## 4. Riskler ve önlemler

| Risk | Düzey | Önlem |
|---|---|---|
| **Hesap geçmişi: Poyraz Workshop'un daha önce 2 uygulaması askıya alındı.** Yeni bir politika ihlali hesabın kapatılmasına kadar gidebilir. Askıya almaların nedeni bu değerlendirmede bilinmiyor [DY] | **Yüksek** | Sınırda hiçbir davranış yok: geçiş reklamı yalnız doğal durakta ve seyrek (aşağıdaki AdMob kuralları), açılış reklamı yok, ödüllü reklam yok, reklam içerik derecesi G; mağaza metninde başka marka, uydurma puan, fiyat ya da "ücretsiz/en iyi" yok; reklam ve abonelik açıkça anlatılıyor; Veri güvenliği AdMob'un kendi beyanıyla birebir; izinler en az (konum, kamera, dosya yok); hedef kitle 13+. **Göndermeden önce sahip Play Console › Politika durumu sayfasında hesapta açık uyarı olup olmadığına bakmalı** |
| **AdMob geçiş reklamı politikası**: uygulama açılışında/kapanışında yok; "iki kullanıcı eyleminde en çok bir geçiş reklamı"; etkin bir işi (oyun, form doldurma, okuma) kesmemeli, yalnız mantıksal aralarda; ağ gecikmesiyle yeni sayfanın üstüne geç gelmemesi için önceden yüklenmeli [D] ([AdMob Yardım](https://support.google.com/admob/answer/6201362)) | Orta | İlk 3 dk yok; yalnız araçtan çıkış / Ayarlar kapanışı; 4 dk ara ve saatte 6; yazarken ve sayfa açıkken yok; reklam önceden yüklenir, yüklenmemişse o durakta gösterilmez; durakla gösterim arasındaki 0,45 sn'de dokunulursa vazgeçilir |
| **Abonelik politikası** (açık fiyat ve yenileme bilgisi, kolay iptal) | Orta | Fiyat yalnız mağazanın metni; "otomatik yenilenir, istediğin zaman iptal" metni üyelik ekranında; "Aboneliği yönet" Play'in `adfree` sayfasını açar; geri yükleme düğmesi var; mağazadan fiyat gelmezse düğme kapalı (1.0.0'da uydurma fiyatla satın almaya izin veriyordu, düzeltildi) |
| **Aileler politikası**: hesap makinesi öğrencilere hitap eder | Orta | 13+ hedef kitle, "çocuklara hitap etmiyor"; Araçlar kategorisi; görseller ve metin yetişkin/genç dilinde; G derecesi |
| **Doğruluk beklentisi** (sınav, mühendislik hesabı) | Orta | Açıklamada "çift duyarlıklı kayan nokta, sayısal türev/integral/çözüm yaklaşıktır, sonucu denetle" yazılı |
| **Yeni AdMob uygulamasında sınırlı reklam**: Play girişine bağlanana kadar AdMob sınırlı reklam sunar [K] | Düşük | Yayından sonra AdMob'da "Mağaza ekle" (PLAY-YAYIN.md adım 7) |
| **Yorumlarda reklam şikâyeti** | Orta | Kurallar tek dosyada; gerekirse önce geçiş reklamı kapatılır, banner kalır. İsteğe bağlı tek seferlik "reklamları kaldır" satın alımı ikinci seçenek (sahibin kararı) |
| **R8'siz derleme** | Düşük | AdMob eklentisiyle R8 bu depoda denenmedi; Hayalet Avcıları'nın Play'de çalışan düzeni (küçültmesiz) seçildi. APK ~7,8 MB, Play için sorun değil |
| **Kurulum cihazında denenmedi** | Orta | Derleme, birleşik manifest, tarayıcı benzetimi ve birim testleri yeşil; ama banner'ın gerçek cihazda gezinme çubuğuyla hizası, klavye gizleme ve `location.href` ile Play'in abonelik sayfasının açılması **gerçek telefonda** bir kez denenmeli (dahili test kanalı) |

## 5. Birim ekonomi (varsayımlı)

Reklam geliri ≈ GKK × [(banner gösterimi/kişi × banner eBGM) + (geçiş gösterimi/kişi × geçiş eBGM)] / 1000
(GKK: günlük etkin kullanıcı; eBGM: bin gösterim başına etkin gelir).

Varsayımlar **[DY]**: karma ülke eBGM'si banner 0,10-0,30 $, geçiş 1-3 $ (Türkiye bunun altında, ABD/AB üstünde;
AdMob ülke bazında eBGM yayımlamaz). Kişi başına günde 2 oturum × 3 dk; banner 60 sn'de yenilenir (≈6 gösterim/gün).
Geçiş reklamı yalnız 3 dakikadan uzun oturumlarda ve araçtan çıkışta: ≈0,2 gösterim/gün.

| GKK | Banner (0,20 $) | Geçiş (2 $) | Ay (≈30 gün) |
|---|---|---|---|
| 100 | 100 × 6 × 0,20 / 1000 = 0,12 $/gün | 100 × 0,2 × 2 / 1000 = 0,04 $/gün | ≈ 5 $ |
| 1.000 | 1,2 $/gün | 0,4 $/gün | ≈ 48 $ |
| 10.000 | 12 $/gün | 4 $/gün | ≈ 480 $ |

Abonelik: 0,99 $/ay → Play'in %15 bedelinden sonra ≈ 0,84 $; 9,99 $/yıl → ≈ 8,49 $ [D: bedel]. Hesap makinesinde
reklam kaldırma aboneliğine dönüşüm düşük olur; aylık etkin kullanıcının %0,3-1'i varsayımıyla [DY], 10.000 aylık
kullanıcıda 30-100 abone ≈ 25-85 $/ay. Abonenin reklam geliri sıfırlanır; aylık 0,84 $, banner+geçişten beklenen
kişi başı gelirden (≈ 0,05 $/ay) çok yüksek: abonelik kâr eder.

Sonuç: Gelir **küçük** başlar; maliyet de sıfıra yakın (geliştirici hesabı açık, gizlilik sayfası GitHub Pages'te,
sunucu yok). Asıl değer Poyraz Workshop vitrinine 11 dilli, mühendislik yönü güçlü bir araç eklemek.

## 6. Sonra bakılacaklar

- İlk 30 gün: Play Console'da çökme/ANR ve Android vitals, AdMob politika merkezi, yorumlar (reklam şikâyeti).
- Kullanım görülürse: R8 ile küçültme (gerçek cihazda denendikten sonra), tek seferlik reklam kaldırma ürünü, sınav modu.

## Kaynaklar

- AdMob geçiş reklamı yasak uygulamaları: [support.google.com/admob/answer/6201362](https://support.google.com/admob/answer/6201362)
- AdMob SDK'sının Play veri beyanı: [developers.google.com](https://developers.google.com/admob/android/privacy/play-data-disclosure)
- Play Veri güvenliği tanımları ve ödeme hizmeti muafiyeti: [Play Console Yardım 10787469](https://support.google.com/googleplay/android-developer/answer/10787469)
- Abonelik yönetimi bağlantısı (`?sku=…&package=…`): [Android Developers: Subscriptions](https://developer.android.com/google/play/billing/subscriptions)
- Play hizmet bedeli (abonelik %15): [Play Console Yardım 112622](https://support.google.com/googleplay/android-developer/answer/112622)
- Rakip bilgileri: yukarıdaki tablodaki bağlantılar (Play'in kendi sayfası değil, ikincil kaynak: [K])
