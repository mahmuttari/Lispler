# Hayalet Avcıları: gerçek 3D avcılar (3.20.0)

Kullanıcının kararı (24 Kasım 2026): avcılar **gerçek 3D model** olacak. Kaynak olarak **kodla kurulan kendi avcılarımız**
seçildi: hazır yetişkin karakterler değil, onaylı tasarımlardan (gorsel/ham3d/D01–D06) esinlenen, sevimli **bloklu 3D
çocuklar** (Crossy Road benzeri). Sebep: 3D görünümlü resimlerde karakter dönmüyordu, silah ayrı çizildiği için elde
durmuyordu. 3D modelde avcı her yöne akıcı döner; silah elin bağlantı noktasına takılı olduğu için hep elde kalır.
Kodu Evren yazar (kullanıcının kuralı); bu belge şartnamedir.

## Mimari

- **Kütüphane:** three.js r170, `www/lib/three.module.min.js` (MIT, `www/lib/three-LICENSE.txt`). Dış bağlantı yok,
  uygulama çevrimdışı çalışır. Yükleyici gerekmez: modeller kutu, silindir, koni ve küre parçalarından kodla kurulur.
- **Melez çizim:** oyun dünyası, kurallar, çarpışma ve ağ bugünkü 2D tuvalde kalır. Yalnız avcılar 3D çizilir: tek
  gizli WebGL tuvali (tek `WebGLRenderer`), her avcı sırayla bu tuvale çizilir ve hemen ardından `ctx.drawImage` ile
  2D tuvale, avcının ayak noktasına basılır. Gölge bugünkü 2D elips kalır (gölge haritası yok).
- **Modül:** `www/uc-avci.js` (`<script type="module">`), `window.UcAvci` arabirimini kurar. Modül yüklenemezse ya da
  WebGL yoksa oyun bugünkü çizimle sürer (3D kareler, KS, kod çizimi). `drawCharacter` önce `UcAvci.ciz(...)` dener.
- **Kamera:** ortografik, oyunun eğik üstten bakışına uygun (yaklaşık 50° yukarıdan, önden). Avcı oyun koordinatında
  baktığı yöne döner: `rotation.y = atan2(dx, dy)` (oyunda y aşağı doğru artar; aşağı yürüyen avcı yüzünü gösterir).
- **Bakış yönü:** nişan varsa hedefe, yoksa hareket yönüne; dönüş yumuşak (yaklaşık 12 rad/sn'ye kadar). Duran avcı son
  yönünü korur.
- **Başarım:** her (karakter, kostüm) modeli bir kez kurulur ve önbellekte tutulur. Çizim boyutu en çok 256 px
  (`boyut × devicePixelRatio`). Hedef: orta düzey telefonda avcı başına 1,5 ms'nin altında. Kare süresi 3 sn boyunca
  45 ms'yi aşarsa 3D kendiliğinden kapanır ve 2D çizime dönülür; Ayarlar'da elle de açılıp kapanır.
- **Çevrimiçi:** ağdan gelen veri değişmez. Öteki oyuncular da `drawCharacter` ile çizildiği için onlar da 3D görünür.

## İskelet ve animasyon (kodla)

Hiyerarşi: `kok → kalca → govde → bas`, `govde → omuzSag → kolSag → elSag (silah bağlantısı)`, `govde → omuzSol →
kolSol → elSol`, `kalca → bacakSag`, `kalca → bacakSol`. Oranlar çocuk oranı: baş boyun yaklaşık %40'ı, kısa gövde,
kısa bacaklar. Eklemler parçanın ucunda döner (omuz, kalça, boyun).

| Durum | Hareket |
|---|---|
| bekle | Nefes: gövde 1–2 sn'lik ritimle hafif iner çıkar, boş kol azıcık sallanır, ara ara göz kırpma |
| yürü | Bacaklar ±30°, boş kol ters yönde ±25°, gövde adımda hafif zıplar |
| koş | Bacaklar ±50°, gövde 10° öne eğik, boş kol ±40° |
| nişan | Silah kolu omuzdan ileri, yere paralel; silah ileri bakar. Avcı çoğu zaman nişandadır (oyun kendiliğinden ateş eder) |
| ateş | Nişan + 0,12 sn geri tepme: kol ve silah yukarı-geri teper, gövde hafif geri; namlu ucunda parlama (2D, namlu noktasında) |
| yakın vuruş | Veryi'nin çekici ve Kenit'in hançeri için kol yay çizerek iner (silahın kendi vuruşunda) |
| tekme | Fanatik'in Tornado Tekme gücünde gövde kendi çevresinde döner, bir bacak yana açık |
| sevinç | Bölüm bitince iki kol havaya, küçük zıplama |

`UcAvci.namlu(...)` namlu ucunun 2D ekran noktasını verir. Oyun mermiyi bugünkü gibi çıkarır; parlama bu noktada çizilir.

## Avcıların görünüşü

Renkler: kıyafet `COSTUMES[...].body`, saç `COSTUMES[...].hair`, ten ve diğerleri `CHARACTERS[...].color`. Aşağıda
yazmayan ayrıntı serbesttir ama karakter tanınır kalmalı.

**Kullanıcının sabit kuralları:**
- Kinkin, Veryi, Kornet, Kenit, Ponko ve Fanatik erkek; Marli, Güllu, Rani, Beri, Silsen ve Serçin kız.
- Kız avcıların saçı uzun ya da topuzlu olur.
- Açık kostüm yok, makyaj yok.
- Yüz güler, kendinden emin bakar.

| Avcı | Saç, başlık | Kıyafet | Silah (sağ elde) | Kostümler |
|---|---|---|---|---|
| Kinkin (kinkin) | Kısa dağınık kahküllü saç | Tulum, açık renk omuzluklar, kahverengi kemer ve çanta, koyu gri bot | Gümüş enerji tabancası, camgöbeği parlayan çekirdek | 0 Mavi · 1 Pembe Prenses (pembe tulum, altın saç, küçük altın taç; yine erkek) · 2 Altın Efsane (altın tulum, krem saç) |
| Veryi (veryi) | Kısa koyu saç, yana taranmış | Kahverengi yelek/ceket, yeşil pantolon, bot | Büyük savaş çekici: tahta sap, çivili çelik baş (omza dayalı taşır, vuruşta iner) | 0 Klasik · 1 Asker (yeşil asker kıyafeti, siyah saç, küçük asker şapkası) · 2 Bronz Şampiyon (bronz, altın saç) |
| Kornet (kornet) | Baş beyaz, kafatasına benzeyen dostça yüz (siyah göz oyukları, dişli gülüş); başın üstü kabarık | Kabarık bulut gövde (küreler kümesi), kısa bacaklar aynı renk | Kristal asa: tahta sap, sarı sarmal bant, üç dişli uçta parlayan mor kristal | 0 Mor · 1 Şeker (nane yeşili) · 2 Galaksi Sihirbazı (gök mavisi, eflatun ayrıntılar) |
| Marli (mark) | Uzun kahverengi saç, at kuyruğu | Yeşil üst, gri pantolon, sırtta kahverengi çanta ve rulo | Küçük arbalet, takılı ok | 0 Yeşil · 1 Mavi (mavi, koyu saç) · 2 Altın Maceracı (altın, kızıl saç) |
| Kenit (kent) | Kapüşon başı örter, yüz gölgede, iki kırmızı parlayan göz (ışık saçan malzeme) | Bütün gövdeyi örten pelerin, alt ucu sivri dilimli | Küçük hançer | 0 Karanlık (siyah) · 1 Kanlı (koyu kırmızı) · 2 Hayalet Lordu (koyu mor) |
| Ponko (ponko) | Geniş kenarlı kahverengi kovboy şapkası, bantlı; şapka altından kısa saç | Kırmızı gömlek, koyu pantolon, altın tokalı kemer, bot | Kovboy tabancası: tahta kabza, altın tetik korkuluğu | 0 Kırmızı · 1 Sarı (turuncu gömlek) · 2 Altın Şapka (sarı gömlek, altın şapka) |
| Güllu (gul) | Altın taç; kahküllü kahverengi küt saç (omuz hizası) | Pembe tunik, koyu pembe pantolon, bot | Uzun klasik yay, sarı kabza bandı | 0 Pembe · 1 Mor · 2 Kraliçe (açık pembe, altın saç) |
| Rani (rani) | Siyah saç, iki yanda topuz | Turkuaz üst ve pantolon, beyaz spor ayakkabı | Y biçimli sapan, taş takılı | 0 Turkuaz · 1 Limon · 2 Pırıltı (sarı, mor topuzlar) |
| Beri (beti) | Lolipop gibi sarmal çizgili bere (saç rengi berenin rengi, beyazla dönüşümlü); uzun dalgalı kahverengi saç | Kalpli üst (kıyafet rengi), mor pantolon | Sarmal lolipop asa | 0 Şeker (pembe-kırmızı, mor-beyaz bere) · 1 Çikolata (kahverengi, turuncu-beyaz bere) · 2 Gökkuşağı Lolipop (camgöbeği, pembe-beyaz bere) |
| Fanatik (fanatik) | Siyah dikleşen saç, uçları dalgalanan kırmızı alın bandı | Karate gi (kıyafet rengi), siyah kuşak | Kırmızı nunçaku: iki çubuk ve kısa zincir; tekmede kullanılır | 0 Beyaz Gi · 1 Kırmızı Gi · 2 Ejder Ustası (lacivert gi, altın saç) |
| Silsen (silsen) | Uzun kahverengi saç | Diz boyu elbise (kıyafet rengi), tayt, bot | Çiçekli bayrak asa: ince sap, damalı küçük bayrak, tepede papatya | 0 Bahar (yeşil elbise) · 1 Lale (kırmızı elbise, siyah saç) |
| Serçin (sercin) | Kahküllü düz uzun siyah saç; yüzde küçük turuncu gaga maskesi | Hardal renkli kıyafet, kahverengi bot | Büyük çizgili tüy | 0 Serçe · 1 Kanatlı Kedi (turuncu, kedi kulakları, sırtta küçük beyaz kanatlar; `ears`, `wings`) |

Bot (yardımcı robot, `bot` anahtarı): gri metal gövde, iki mavi ışık, dişli ekran yüz, siyah saç tutamı.

Mağaza silahları takılıysa avcının kendi silahının yerine onun 3D hali elde görünür:
- **Baloncuk Tabancası:** iri, oyuncak gibi mavi baloncuk tabancası.
- **Kırmızı Lazer:** ince kırmızı tabanca.
- **Yeşil Çiftli:** yeşil, çift namlulu.
- **Saçmalı Top:** açık mavi kısa top, turuncu namlu.
- **Dev Bazuka:** koyu, beyaz çizgili bazuka (omuzda).

## Aşamalar (Evren görevleri)

1. **3D-1:** kütüphane, `uc-avci.js` çekirdeği (çizici, kamera, iskelet, animasyonlar, arabirim), `drawCharacter`
   bağlantısı, Kinkin'in üç kostümü ve enerji tabancası, sınama.
2. **3D-2:** kalan on bir avcı, kostümleri ve silahları.
3. **3D-3:** yakın vuruş ve tekme animasyonlarının oyun olaylarına bağlanması, mağaza silahları, başarım ölçümü ve
   kendiliğinden kapanma, Ayarlar'da aç/kapa, önizlemeler ve kartlar; oynanabilir reklama Kinkin'in 3D hali.
