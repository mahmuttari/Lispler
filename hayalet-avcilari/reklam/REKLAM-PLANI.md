# Hayalet Avcıları — Google Ads reklam planı

Hazırlandı: 28 Ekim 2026. İşaretler: **[D]** kaynaktan doğrulandı, **[K]** kısmen doğrulandı ya da kullanıcının
denetlemesi gerekiyor, **[DY]** doğrulanamadı (varsayım).

## 0. İstek ve kararlar

- Kullanıcı: *"Hayalet avcılarını google da reklam versek ama reklamda hiçbir şekilde mahmuttari marfen görünmesin"*.
- Kullanıcının seçimleri (28 Ekim 2026):
  - Reklam, Poyraz Workshop adına **yeni bir Google Ads hesabıyla** verilir.
  - Play sayfasındaki iletişim adresleri **nötr adreslere** taşınır:
    - e-posta `poyrazworkshop7@gmail.com` (kullanıcı 29 Ekim 2026'da açtı);
    - site `https://hayalet-avcilari.web.app` ([`../site/`](../site/README.md)).
  - Bütçe **günde 10 $**, hedef **oyunun 6 dili**.
- Hazırlananlar:
  - [`metinler.json`](metinler.json): 6 dilde 5 başlık ve 5 açıklama.
  - [`gorseller/`](gorseller/): 6 dil × 3 sahne × 3 boyut = 54 görsel; üretici [`gorsel.mjs`](gorsel.mjs).
  - [`reklam.test.mjs`](reklam.test.mjs): sınırlar, yazım kuralları ve sahibin adı taraması.
- Bu klasörde Google Ads'te hiçbir şey kurulmadı; para harcayan hiçbir adım atılmadı.
- **Karar (28 Ekim 2026):** §1'deki bulgu üzerine kullanıcı **"Ücretsiz kanallar"**ı (B) seçti.
  - Google Ads hesabı açılmaz; plan [`../sosyal/SOSYAL-PLAN.md`](../sosyal/SOSYAL-PLAN.md)'dedir.
  - Bu klasör, şirket kurulursa (A) ya da koşul değişirse (C) kullanılmak üzere saklanır.
- **Karar (28 Ekim 2026, ikinci):** kullanıcı, öteki oyun reklamlarında da firma adının reklamın üzerinde değil yalnız
  ⓘ sayfasında göründüğünü öğrenince **Google reklamını da verme** kararı aldı (C, B ile birlikte).
  - Kurulum talimatı: [`GOOGLE-ADS-KURULUM.md`](GOOGLE-ADS-KURULUM.md).
  - Kampanyalar ileri tarihle ve duraklatılmış kurulur; açık "ONAY" gelmeden para harcanmaz.

## 1. Sahibin adı nerede görünebilir?

| Yer | Ne görünür | Durum |
|---|---|---|
| Reklam metni ve görseli | Yalnız oyunun adı ve sahneler | Hazır. Test her yayından önce tarar **[D]** |
| Play sayfası: geliştirici adı | Poyraz Workshop | Var **[D]** |
| Play sayfası: e-posta, web sitesi, gizlilik ve hesap silme bağlantıları | `poyrazworkshop7@gmail.com`, `hayalet-avcilari.web.app` | Hazır; e-posta açılınca yayınlanır |
| Oyunun içi (ekranlar, çeviriler) | Ad yok | Test tarar **[D]** |
| Play "Geliştirici hakkında" (hesap düzeyi bilgiler) | Geliştirici hesabının herkese açık bilgileri. AB'de tacir beyanı varsa yasal ad ve adres de görünür | **[K]** Kullanıcı Play Console › Ayarlar › Geliştirici hesabı'nda denetler |
| Reklamın "Bu reklamveren hakkında" paneli ve Google Reklam Şeffaflık Merkezi | **Doğrulanmış reklamveren:** yasal ad ya da marka adı ve konum. Ödeme profilinin adı bundan farklıysa "ödeyen" olarak o da gösterilir. **Doğrulanmamış hesap:** ödeme profilinin adı ve konumu, "doğrulanmamış" etiketiyle | **[D]** [Google: Ads transparency](https://support.google.com/adspolicy/answer/13733850) |
| AB'de (İspanya) gösterilen her reklam | Reklamın kimin adına gösterildiği ve, farklıysa, parayı kimin ödediği. Bu bir yasal zorunluluktur | **[D]** DSA m.26/1-b, c ([metin](https://www.eu-digital-services-act.com/Digital_Services_Act_Article_26.html)) |
| AdMob `sellers.json` (oyunun içindeki reklamların satıcı listesi) | Yayıncı hesabının adı, "gizli" seçilmemişse | **[K]** AdMob › Ayarlar › Hesap bilgileri › satıcı bilgisi "Gizli" olmalı |
| Google ile Giriş onay ekranı | Firebase projesinin "kullanıcı destek e-postası" | **[K]** Google Cloud › `hayalet-avcilari` › Google Auth Platform › Marka. `poyrazworkshop7@gmail.com` projeye eklenince seçilebilir |

### Belirleyici bulgu: reklamveren adı

- Drive'daki D-U-N-S belgelerinde tek ticari kayıt **"MAHMUT TARI MARFEN MÜHENDİSLİK DANIŞMANLIK HİZMETLERİ"**
  görünüyor (şahıs işletmesi).
- Poyraz Workshop adına tescilli bir şirket ya da marka bulamadım **[K]**.
- Şahıs işletmesinin unvanı, tacirin kısaltılmamış adını ve soyadını içermek zorundadır **[K]**
  ([birfatura](https://birfatura.com/ticaret-unvani-nedir/)).

Bu yüzden yeni Google Ads hesabı hangi ödeme profiliyle açılırsa açılsın, panelde ve Şeffaflık Merkezi'nde şu adlardan
biri görünür:

- **Kişisel profil:** "Mahmut Tarı".
- **İşletme profili:** "MAHMUT TARI MARFEN …".
- **Doğrulamasız hesap:** ödeme profilinin adı yine görünür, yalnızca "doğrulanmamış" etiketiyle. Google doğrulama
  istediğinde süresi içinde tamamlanmazsa reklamlar durur **[K]**.

Reklam görseli ve metni temiz kalır, ama "hiçbir şekilde" koşulu panel yüzünden sağlanamaz.

Koşulu sağlayan yollar:

| Yol | Ne olur | Bedeli |
|---|---|---|
| **A. Poyraz Workshop adına sermaye şirketi** (Ltd. ya da A.Ş.) | Unvan kişi adı içermek zorunda değil. Unvan, işletme konusu ve şirket türü yazılmak şartıyla serbestçe seçilir; TTK m.43 **[K]** ([minvalhukuk](https://minvalhukuk.com/sirketler-ve-ticaret-hukuku/ticaret-unvani-nedir/), [muhasebetr](https://www.muhasebetr.com/yazarlarimiz/enginmalay/014/)). Örnek: "Poyraz Workshop Yazılım Limited Şirketi". Google Ads bu şirket adına doğrulanır ve şirket kartıyla ödenir; panelde yalnız şirket adı görünür. Şirket ileride bütün Poyraz uygulamalarının Play kuruluş hesabı da olabilir | Kuruluş masrafı ve aylık muhasebe; haftalar sürer. Tutar için mali müşavire danışılmalı **[DY]** |
| **B. Ücretli reklam yerine ücretsiz kanallar** | `poyrazworkshop7@gmail.com` ile "Poyraz Workshop" YouTube, TikTok ve Instagram hesapları açılır; oynanış videoları ve buradaki görseller paylaşılır; mağaza sayfası iyileştirilir. Para ödenmediği için "ödeyen" bilgisi oluşmaz | Yavaş; düzenli paylaşım ister |
| **C. Koşulu yalnız panel için gevşetmek** | Reklam metni, görseli ve Play sayfası adsız kalır. Kullanıcı reklamın ⓘ simgesine dokunursa "Bu reklamveren hakkında"da yasal adı görür | Hemen başlanabilir |
| Yalnız marka tescili | **Yetmez:** Google marka adını gösterebilir, ama ödeme profilinin adı farklıysa ödeyen olarak onu da gösterir **[D]** | — |

**Önerim:**

- Koşul kesinse **B ile hemen başla**. Ücretsizdir ve hiçbir yerde ad çıkmaz.
- Poyraz Workshop kalıcı bir iş olacaksa **A**'yı mali müşavirle değerlendir. Altı uygulamanın hepsi bundan yararlanır.
- **C**'yi yalnız koşulu gevşetirsen seç.

Karar kullanıcınındır; işin özünü değiştirir.

## 2. Uzman değerlendirmesi

**Güçlü yanlar**

- Gerçek oynanış görselleri hazır.
- 6 dilde mağaza metinleri var.
- Oyun ücretsiz ve satın alma yok; reklamda fiyat iddiası gerekmiyor.
- Çevrimiçi odalar ve arkadaşlar, her yeni oyuncuyla değerlenir. Ücretli edinimin asıl gerekçesi budur: odalarda
  oyuncu olsun.

**Riskler**

- **Birim ekonomi negatif:**
  - Oyun yalnız seyrek geçiş reklamıyla ve isteğe bağlı ödüllü reklamla gelir sağlıyor. Kullanıcının isteği:
    "Hiç sıkmayacak şekilde"; ilk 5 oyun ve ilk 10 dakika reklam yok, saatte en çok 4.
  - Kullanıcı başına gelir = günlük gösterim × eCPM ÷ 1000 × aktif gün sayısı.
  - Varsayım **[DY]**: 3 aktif gün, günde 1,5 gösterim, eCPM 2 $. Bu, kullanıcı başına yaklaşık 0,01 $ eder.
  - Aşağıdaki yükleme maliyetlerinin onda biri ile otuzda biri arasındadır.
  - Gerçek değerler 2 hafta sonra AdMob raporundan ölçülür.
  - Bu bütçe kâr için değil, ilk oyuncular, ilk puanlar ve dolu odalar içindir.
- **Bütçe bölünmesi:**
  - Google, günlük bütçeyi hedef yükleme maliyetinin (tCPI) en az 50 katı önerir **[D]**
    ([Google](https://support.google.com/google-ads/answer/9176652)).
  - 10 $ altı kampanyaya bölünürse kampanya başına 1,7 $ kalır; bu durumda hedefli teklif öğrenemez.
  - Bu yüzden hedefsiz "yükleme sayısını en üst düzeye çıkar" kullanılır ve kampanya sayısı azaltılır.
- **Çince:** Google Play Çin anakarasında yok. Basitleştirilmiş Çince konuşan pazarlar (Malezya, Singapur) küçük ve
  pahalı **[K]**. Metin ve görseller hazır, kampanya ilk turda açılmaz.
- **Görseldeki yazı:**
  - Google görselleri kırpabilir ya da değiştirebilir **[D]**
    ([Google: öğe şartları](https://support.google.com/google-ads/answer/13676244)).
  - Yazı şeridi görselin beşte birini geçmez ve sahne yazısız da anlaşılır.

**Yükleme maliyeti (CPI) kıyasları**

Kaynaklar birbirini tutmuyor; yalnız mertebe için kullanılmalı:

- Liftoff 2025 (casual, Android, dünya ortalaması): 0,14 $ **[K]**
  ([Liftoff](https://liftoff.ai/2025-casual-gaming-apps-report/)).
- Hindistan casual Android: 0,08–0,30 $ **[K]**.
- Latin Amerika: 0,15–0,60 $ **[K]**.
- Güneydoğu Asya: 0,20–0,60 $ **[K]**.
- Son üçünün kaynağı: [gamegrowthadvisor](https://gamegrowthadvisor.com/blog/2026-03-17-user-acquisition-cpi-benchmarks-2026/).
- Türkiye ve Mısır için kaynak bulunamadı **[DY]**.

## 3. Kampanya önerisi (C seçildi)

Kampanyalar pazar grubuna göre kurulur, her dil kendi reklam grubunda olur **[K]**
([RocketShip HQ](https://www.rocketshiphq.com/google-app-campaigns-multiple-markets/)). Toplam günde 10 $:

| Kampanya | Ülkeler | Dil · reklam grubu | Günlük |
|---|---|---|---|
| HA-TR | Türkiye | tr | 3 $ |
| HA-ES | Meksika, Kolombiya, Arjantin, Peru, Şili, Ekvador | es | 2,5 $ |
| HA-AR | Mısır, Fas, Cezayir, Irak, Ürdün, Tunus | ar | 2 $ |
| HA-IN | Hindistan | hi ve en (iki reklam grubu) | 2,5 $ |
| (HA-ZH) | Malezya, Singapur | zh | Kapalı; metin ve görsel hazır |

**Ortak ayarlar**

- Hedef: Uygulama yüklemeleri.
- Teklif: Yükleme sayısı, **hedef yükleme maliyeti girilmez**.
- Uygulama: `com.poyrazworkshop.hayaletavcilari`.
- Her reklam grubuna o dilin 5 başlığı, 5 açıklaması ve 9 görseli (`gorseller/<dil>/`) yüklenir.
- Video eklenmez. Google varlıklardan otomatik video üretebilir **[K]**. Kendi videomuz yüklenecekse
  `poyrazworkshop7@gmail.com` ile açılmış "Poyraz Workshop" YouTube kanalı kullanılmalı; MARFEN ya da kişisel kanal
  kullanılmaz.

**Takvim ve kurallar**

- Süre: 14 gün. Üst sınır 140 $; vergi ve ücretler faturada ayrıca görünebilir **[DY]**.
- 7. günde CPI'ı 0,50 $'ı aşan kampanya durdurulur, bütçesi iyi gidene aktarılır.
- Bütçe bir seferde %20'den fazla değiştirilmez **[D]** (aynı Google sayfası).
- Ölçülecekler: CPI (Google Ads), 1. gün tutma (Play Console), AdMob gelir/kullanıcı.

**Yazım kuralları** (testte denetlenir)

- Başlıkta ünlem yok **[K]**: eski Google kılavuzu adıyla yasaklar
  ([Google editoryal](https://support.google.com/adspolicy/answer/14847994)).
- Emoji ve simge yok **[D]** (aynı sayfa).
- Kelimenin tamamı büyük harf yok.
- "En iyi", "1 numara" gibi kanıtsız iddia yok; "reklamsız" yok (oyunda reklam var).
- Başlık ≤30, açıklama ≤90 karakter; Çince karakter 2 sayılır **[D]**
  ([Google: öğe şartları](https://support.google.com/google-ads/answer/13676244)).

## 4. Sıra ve kimin işi

1. **Kullanıcı:** `poyrazworkshop7@gmail.com` hesabını açtı (29 Ekim 2026).
2. **Kullanıcı:** Cloud Shell'de iki rolü verir ([`../site/README.md`](../site/README.md) › Kurulum).
3. **Bulut oturumu:**
   - `site/yayin-istek.txt` › `durum`, sonra `yayinla`.
   - Bu dalı main'e birleştirir.
   - `play-istek.txt` › `magaza uygula` ve `veriguvenligi uygula`; Play'deki e-posta, web sitesi ve hesap silme adresi
     değişir.
4. **Kullanıcı:** §1'deki üç **[K]** denetimini yapar: Play "Geliştirici hakkında", AdMob satıcı bilgisi, OAuth destek
   e-postası.
5. **Kullanıcı:** reklamveren yolunu seçti: C ve B (§0).
6. **Kullanıcı:**
   - `poyrazworkshop7@gmail.com` ile Google Ads hesabı açar: uzman modu, kampanya oluşturmadan.
   - Ödeme profilini kurar. Para birimi sonradan değişmez; Türk kartıyla TRY önerilir ve bütçe 10 $ karşılığı TL
     yazılır **[K]**.
   - **Bireysel** profilde ⓘ sayfasında yalnız ad ve soyad, **işletme** profilinde unvan (MARFEN dahil) görünür
     ([`GOOGLE-ADS-KURULUM.md`](GOOGLE-ADS-KURULUM.md) §1).
   - Ödeme ve kimlik bilgilerini kendisi girer.
7. **Kullanıcı:** Google Ads › Araçlar › Veri yöneticisi › Google Play'den Play Console bağlantısını ister, Play
   Console'da onaylar **[K]**.
8. **Kampanyalar:**
   - Bağlı araç (adplane) Uygulama kampanyası kuramıyor; kampanyalar tarayıcıda kurulur.
   - Bilgisayardaki Claude Code (`claude --chrome`) §3'teki değerlerle kurar
     ([`GOOGLE-ADS-KURULUM.md`](GOOGLE-ADS-KURULUM.md)).
   - Başlangıç tarihi ileri bir gün seçilir ve kampanya **duraklatılmış** bırakılır.
9. **Kullanıcı:** açık onay verir, örneğin "ONAY: Hayalet Google Ads, günde 10 $, 14 gün". Kampanyalar ancak bundan
   sonra açılır.
   - **Onay verildi: 31 Ekim 2026** (sohbette, tam metin "ONAY: Hayalet Google Ads, günde 10 $, 14 gün").
   - Yayın aralığı **31 Ekim – 13 Kasım 2026** (14 gün). Günde toplam en çok 10 $, 14 günde en çok 140 $.
   - 7. gün denetimi **6 Kasım 2026** (§3: CPI 0,50 $'ı aşan kampanya durur; bütçe bir seferde en çok %20 değişir).
   - Açma işini kullanıcının bilgisayarındaki Claude Code (`claude --chrome`) yapar
     ([`GOOGLE-ADS-KURULUM.md`](GOOGLE-ADS-KURULUM.md) §4). Bulut oturumunun Google Ads hesabına erişimi yok.

## 5. Kaynaklar

- Google Ads öğe şartları (Uygulama kampanyası: 5 × 30 başlık, 5 × 90 açıklama; 1200×628, 1200×1200, 1200×1500;
  en çok 5 MB): https://support.google.com/google-ads/answer/13676244 ·
  https://support.google.com/google-ads/answer/9234183
- Google Ads şeffaflığı (gösterilen ad, ödeyen adı): https://support.google.com/adspolicy/answer/13733850
- Reklamveren doğrulaması, ad değişikliği: https://support.google.com/adspolicy/answer/15577171
- DSA m.26: https://www.eu-digital-services-act.com/Digital_Services_Act_Article_26.html
- Bütçe ve tCPI (50 kat; %20 kuralı): https://support.google.com/google-ads/answer/9176652
- Editoryal kurallar (noktalama, simge, emoji): https://support.google.com/adspolicy/answer/14847994 ·
  https://support.google.com/adspolicy/answer/6021546
- Çok pazarlı Uygulama kampanyası: https://www.rocketshiphq.com/google-app-campaigns-multiple-markets/
- CPI: https://liftoff.ai/2025-casual-gaming-apps-report/ ·
  https://gamegrowthadvisor.com/blog/2026-03-17-user-acquisition-cpi-benchmarks-2026/
- Ticaret unvanı: https://minvalhukuk.com/sirketler-ve-ticaret-hukuku/ticaret-unvani-nedir/ ·
  https://www.muhasebetr.com/yazarlarimiz/enginmalay/014/ · https://birfatura.com/ticaret-unvani-nedir/
