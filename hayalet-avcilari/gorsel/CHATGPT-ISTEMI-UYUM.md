# Hayalet Avcıları: zeminle uyum paketi (Z24–Z29, isteğe bağlı Z30–Z31)

Hazırlandı: 28 Kasım 2026. Kullanıcının isteği: *"ChatGPT ile hazırlanmamış görsel kalmasın; dikenler hâlâ eski görsel;
görseller zemin ile uyumlu olmalı; bu uyum için ilave görseller ürettir; promptları Fable hazırlasın."*

Bu dosyanın üç bölümü var:

1. **Denetim:** olağan oyunda (resim yüklü olsa bile) hâlâ kodla çizilen görünür görseller.
2. **ChatGPT paftaları:** Z24–Z29 (altı pafta) ve yalnız gerekirse üretilecek Z30–Z31.
3. **Kodlama notları:** her paftanın hangi ressamda, nasıl kullanılacağı ve pafta gerektirmeyen kod düzeltmeleri.

Pafta kodları `Z` dizisini sürdürür (diskte Z01–Z23 var), kayıt klasörü `gorsel/hamzemin/`. Bu klasörü hem
`ek_hucreler` hem `doku_hucreleri` taradığı için kesicide yeni yol tanımlamak gerekmez. `U` harfi dolu (`hamui/U01–U10`,
`ham/U01–U26`), o yüzden yeni harf açılmadı.

---

## 1. Denetim: olağan oyunda hâlâ kodla çizilenler

Yöntem: `www/game.js` › `render()` çizim sırası baştan sona izlendi; her çağrının gövdesinde `gorsel(...)`,
`animHazir(...)`, `gorselKutuya(...)` dallarına bakıldı. Aşağıda yalnız **resim yüklüyken de kodla çizilen** öğeler var.
Yalnız yedek olarak duran kod çizimleri (resim gelmezse çalışanlar) tabloya alınmadı; onlar 1.3'te özetlendi.

### 1.1 Görsel gerektirenler (öncelik sırasıyla)

| # | Öğe | Dosya : işlev | Bugün nasıl görünüyor | Ne sıklıkta | Gereken |
|---|---|---|---|---|---|
| 1 | **Diken tuzağı** | `engeller.js` : `dikenCiz`, `dikenUclari`, `bicimPlaka` | Düz koyu kırmızı (`#7f1d1d`) kenar bandı; içi `zemin-catlak-tas` dokusu (ChatGPT, bütün temalarda aynı taş) üstüne %35 koyu örtü; sivri uçlar kodla çizilen gri üçgenler (12 birimlik ızgara, çizgisel renk geçişi). `diken-plaka` resmi `liste.js`'te duruyor ama kullanılmıyor | 3. bölümden sonra her haritada 1–3 tuzak (90 × 90 birim), yolculukta ve Dünya Turu'nda da | **Z24** taban dokusu, **Z25** diken öbeği, **Z26–Z28** kenar şeridi |
| 2 | **Klasik temaların göl kıyısı** | `engeller.js` : `suTabani`; `engel-temalari.js` : `hendek`, `sazlikGolet`, `vaha`, `buzGolu`, `sicakSu`, `metalHavuz` | Su ChatGPT dokusu (`tema<n>-su`, tema 5'te `doku-kaplica`). Kıyı kodla: 8 birim genişletilmiş biçim düz renkle dolu, üstünde kod taş örgüsü, kod çimen tutamı ya da kod yuvarlak taşlar; 2 birimlik koyu kenar çizgisi | Çok sık: her haritada birkaç göl | **Z26** kenar şeridi |
| 3 | **Klasik göl süsleri** | `engel-temalari.js` : `sazlikGolet` (nilüfer, kamış), `vaha` → `palmiye`, `buzGolu` (buz parçaları), `metalHavuz` (perçin; `ENGEL_CANLI.yildiz`) | Kodla çizilen yeşil daire dilimi nilüferler, çizgi kamışlar, palmiye yaprakları, beyaz çokgen buz parçaları | Orman, Çöl, Buz ve Uzay göllerinin hepsinde | Nilüfer, kamış, taş: eldeki `dere-sus-1/2/3/4` (kod düzeltmesi). Palmiye, buz parçası, yıldız yansıması: **Z29** |
| 4 | **Dünya Turu gölleri (10 aile)** | `ulke-aileleri.js` : `tasRihtim`, `ciniliHavuz`, `hurmaliVaha`, `sazlikNehir`, `sazlikBirikinti`, `basamakliHavuz`, `lotusKiyisi`, `koiGoleti`, `kutukIskele`, `karoKanal`; `engeller.js` : `suTabani` | **Tamamı kod.** `suTabani` su dokusunu yalnız tema sayıyken alıyor (`typeof _boyaTema === "number"`); Dünya Turu'nda tema ülke kodu (metin) olduğundan su düz mavi renk geçişi. Kıyı, çini, koi, lotus, bambu, iskele, hurma kodla | Dünya Turu'nun 51 ülkesinin her haritasında | Su: eldeki `dere-su` (kod düzeltmesi). Kıyı: **Z27, Z28**. Süsler: **Z29** ve eldeki `dere-sus-*`, `sus-tahta-yol` |
| 5 | **Dünya Turu harita sınırı** | `engeller.js` : `engelResimRessami` (Dünya Turu'nda sınır için `null` döner) → `ulke-aileleri.js` : `avrupaSuru`, `kervansaraySuru`, `kerpicSuru`, `sahelSuru`, `kazikSuru`, `guneyAsyaSuru`, `bambuSuru`, `catiliSur`, `palisatSuru`, `latinSuru` | Haritanın dört kenarında kodla çizilen sur şeridi (düz renk, kod örgüsü, yuvarlak mazgal başları). Klasik temalarda `tema<n>-sinir` resmi var; ailelerde `aile-<A>-sinir` yok | Dünya Turu'nda harita kenarına her gidişte | Önce kod düzeltmesi: eldeki `aile-<A>-duvar` resmi sınırda yan yana döşenir. Beğenilmezse **Z30–Z31** |
| 6 | **Yolculuk geçit nehrinin kıyıları** | `yolculuk.js` : `yolculukGecitCiz` | Su ChatGPT dokusu. Kıyılar kodla: 12 ve 15 birim kalınlığında düz renkli çizgiler (`th.wall`, `th.wallDark`), iç gölge çizgileri, kodla akış çizgileri | Her yolculuk haritasında 6 nehir | **Z26–Z28** kenar şeridi (göl kıyısıyla aynı) |
| 7 | **Avcılar ve yardımcı bot** | `uc-avci.js` (three.js; kutu, silindir, küre parçalarından kodla kurulan modeller); `game.js` : `drawCharacter`, `drawBot` | `ayar3d` varsayılan olarak açık: avcılar ve bot kodla kurulan bloklu 3D modeller. ChatGPT kareleri (`k3-*`, `kar-*`, `bot`) yalnız 3D kapalıyken ya da WebGL yokken görünür | Her an ekranda | **Pafta yok; kullanıcı kararı gerekir** (bkz. 4. bölüm) |
| 8 | **Oyun içi küçük arayüz** | `game.js` : `updateHUD` (`#lives`: ❤️ / 🖤 yazı karakteri), `render` (öteki oyuncunun can çubuğu: düz dikdörtgenler), `botEtiketi` (can çubuğu, "🤖 Bot"), `drawPickup` (güç yıldızının içindeki ikon `fillText` ile); `pet.js` : `petCanCiz` (kodla çizilen kalpler) | Emoji yazı karakterleri ve düz dikdörtgen çubuklar | Sürekli (HUD), sık (çubuklar) | Pafta gerekmez: eldeki `kalp`, `ui-can-cubugu`, `guc-<karakter>` bağlanır (kod düzeltmesi) |
| 9 | **Lav gölü** (kod çizimi değil, uyum sorunu) | `engeller.js` : `lavCanli` | ChatGPT kareleri (`an-lav-1..3`) lavın **dikdörtgen kutusuna** esnetilerek basılıyor; çarpışma biçimi ise leke (`bicimGol`). Resmin kendi kıyısı var, zemine oturmuyor | 5. bölümden sonra her haritada 1–2 | İsteğe bağlı: **Z28** 5–6. hücre (dikişsiz lav dokusu) ve Z26'nın bazalt kenarı |

### 1.2 Kodda kalabilecekler (küçük ışık, iz, parçacık)

| Öğe | Dosya : işlev | Neden kalabilir |
|---|---|---|
| Sudaki beyaz dalga çizgileri | `engeller.js` : `dalgalar` | İnce, hareketli parıltı; dokunun üstünde canlılık |
| Nehir akış çizgileri, şelale dudağı çizgileri, köpük baloncukları | `yolculuk.js` : `yolculukGecitCiz` | İnce efekt (şelalenin kendisi `an-selale-*` resmi) |
| Şimşek eşyasının çarpma kıvılcımı (`spark`) | `game.js` : `drawEffects`, `drawSparkBolt` | 0,5 saniyelik parlama ve zikzak |
| Parçacıklar (4 px kareler), uçan sayılar, ad etiketleri | `game.js` : `render`; `anim-ek.js` : `aePuanlariCiz` | Parçacık ve yazı |
| Düşman mermisinin ışık izi | `game.js` : `dusmanMermiIzi` | İz efekti (merminin gövdesi `atis-*` resmi) |
| Timsahın su halkaları | `timsah.js` : `halka`, `timsahSplashCiz` | İnce halka; istenirse eldeki `su-halka` resmine bağlanır |
| Yer gölgeleri (avcı, pet, duvar, obje, köprü) | `game.js` : `zeminGolgesi`; `engeller.js` : `duvarResmi`, `objeResmi`; `kopru.js` | Gölge |
| Oyuncu çevresindeki ışık halkası, ekran parlaması, sarsıntı | `zemin-katmani.js` : `isikHalkasiCiz`; `anim-ek.js` : `aeEkranEfektleriCiz` | Ekran efekti |
| Yol kenarı benekleri, zemin lekesi maskeleri | `zemin-katmani.js` : `benekCiz`, `lekeTuvali` | Dokular ChatGPT (`zemin-yol-*`, `zemin-*`); kod yalnız maske ve küçük benek |
| İstasyon ışığı | `engeller.js` : `ENGEL_CANLI.isik` | 2–5 px ışık noktası |

### 1.3 Resimle çizilenler (kod yalnız yedek)

Okunan dallara göre şunlar resim yüklüyken ChatGPT görselinden çizilir; kod çizimi yalnız resim yoksa çalışır:

- Zeminler: `tema<n>-zemin`, `aile-<A>-zemin`; yol ve leke dokuları `zemin-*`; süsler `sus-*`, `tabela-*`.
- Duvarlar ve objeler: `tema<n>-duvar`, `-duvar-dikey`, `-buyuk`, `-obje1/2`, `-sinir`; `aile-<A>-duvar`, `-kule`; `ulke-<KOD>-1/2`.
- Hayaletler ve bosslar: `hayalet-*`, `boss-<KOD>` (51 ülke), `an-*` kareleri.
- Köprüler ve geçitler: `kopru-*`, `yol<n>-*`, `yolA-<A>-*`, `gol-kopru-tahta`, `kilit*`, `gecit-*`.
- Yuvalar ve canlılar: `yuva-*`, `an-yuva-sis/duman`, `an-fare-*`, `an-yarasa-*`, `an-timsah*`, `timsah-bakis`.
- Diğer: `cali`, `pet-*`, `bulut*`, `simsek-*`, `donati-*`, mermiler (`mermi-*`, `atis-*`), toplananlar, efekt kareleri.

`liste.js`'te durup oyunda **kullanılmayan** resimler: `diken-plaka`, `tema<n>-gol` (6), `aile-<A>-gol` (10),
`sus-tahta-yol`. Göl resimleri leke biçimine sığmadığı için bırakılmıştı; bu paketle de geri alınmaz.

Denetimin sınırı: menü ve dükkân ekranlarının HTML/CSS'i (R43–R49 paftalarıyla yenilenmişti) satır satır denetlenmedi;
HUD'da yalnız can göstergesine ve boss durum satırına bakıldı. Efektlerin her biri tek tek değil, resim dalının varlığıyla
doğrulandı.

---

## 2. Tasarım: eski taşma sorunu olmadan düzensiz biçime oturtma

Eski `diken-plaka` dikdörtgen bir resimdi; leke biçimine (`bicimPlaka`) uymuyor, komşuya taşıyordu. Yeni düzen üç katman:

1. **Taban dokusu** (opak, iki yönde dikişsiz kare): kod biçimin içine kırparak döşer. Biçim neyse o kadar boyanır.
2. **Tek tek konan parçalar** (saydam): diken öbekleri ve göl süsleri. Kod bunları biçimin **içindeki** noktalara koyar
   (`engelUzaklik(B, x, y)` ile kenardan içeride kalanlara). Parça kesilmez, taşmaz.
3. **Kenar şeridi** (saydam, sağa-sola dikişsiz yatay şerit): kod şeridi biçimin dış hattı boyunca ince dilimlerle
   sarar. Şeridin dış kenarı düzensiz ve saydama söner; vektör kenar ve kırpma izi şeridin altında kalır.

Dikenler için "dikenli dikişsiz doku" **bilerek seçilmedi**: kesicinin kenar harmanlaması (`dikissiz_dikey`) tek tek
nesnelerde çift görüntü bırakıyor, kırpma hattında da yarım diken kalıyor. Onun yerine taban düz doku, dikenler ayrı parça.

Köşe ve uç parçası gerekmiyor: göl ve tuzak biçimleri kapalı eğridir, nehir kıyısı haritanın üstünden altına kesintisiz
iner. Biçimi oluşturan dairelerin kesiştiği sivri girintilere eldeki `sus-kaya` ya da `dere-sus-3` konabilir.

**Şerit kuralı:** şerit eğri boyunca döndürüleceği için **tam tepeden** çizilir, yönlü gölge taşımaz. Bu, ortak Üslup
bloğundaki üç çeyrek açının bilinçli istisnasıdır ve istemlerde açıkça yazılıdır. Şeritte üst kenar **dış** (zemin
tarafı), alt kenar **iç** (su ya da çukur tarafı) kabul edilir.

### Ortak Üslup bloğu

`CHATGPT-ISTEMI-ZEMIN.md`'deki blok aynen kullanılır; aşağıdaki her istemin başında yazılıdır (kopyala-yapıştır hazır).

### Tema ve aile zeminlerinin rengi (oyundaki işlenmiş dokuların ortalaması)

| Zemin | Ortalama renk | Görünüm |
|---|---|---|
| `tema1-zemin` Mor Şato | `#4f3f38` | çatlak, yer yer eksik mor-gri kale taşları; aralarda toprak, yosun, ot, çakıl |
| `tema2-zemin` Yeşil Orman | `#584116` | koyu toprak, çimen ve yosun öbekleri, yaprak yığınları, açıkta kökler |
| `tema3-zemin` Çöl | `#643b18` | oker kum, dalgacıklar, çatlak sert lekeler, dağınık taş ve kuru ot |
| `tema4-zemin` Buz Mağarası | `#394553` | kar yığınları, aralarda koyu mavi buz, donmuş çakıl |
| `tema5-zemin` Volkan | `#484142` | koyu kül, bazalt kayalar, cüruf, sönük turuncu çatlaklar |
| `tema6-zemin` Uzay | `#4c3b53` | çatlaklı koyu mor-gri kaya, soluk toz, küçük leylak kristaller |
| `aile-K-zemin` | `#64652a` | ılıman çayır: çimen, yonca, kır çiçeği, çıplak toprak lekeleri |
| `aile-KS-zemin` | `#6f5d3b` | taşlı yamaç: gri-kahve toprak, yassı taşlar, ot öbekleri |
| `aile-KP-zemin` | `#81562a` | sıcak çöl: açık ince kum, dalgacıklar, kuru ot |
| `aile-SH-zemin` | `#954d23` | kırmızı-kahve toprak, kuru sarı ot öbekleri |
| `aile-SV-zemin` | `#805727` | kuru bozkır: sarı-kahve kuru ot, çatlak toprak |
| `aile-GA-zemin` | `#7e5b1b` | tropik: koyu kırmızı-kahve toprak, yosun, eğrelti |
| `aile-GDA-zemin` | `#6f6415` | çeltik: kısa yeşil ot, alçak çamurlu setler |
| `aile-DA-zemin` | `#685e44` | dağ: koyu arduvaz levhalar, liken, ince ot |
| `aile-KA-zemin` | `#7c5a27` | koyu orman tabanı: çam iğnesi, yosun, kök, kozalak |
| `aile-LA-zemin` | `#696619` | nemli zemin: koyu yeşil yosun, ıslak taşlar, eğrelti |

Sular: `tema1-su` mor-lacivert `#3c1f77`, `tema2-su` koyu yeşil `#073d27`, `tema3-su` turkuaz `#049888`, `tema4-su`
buz mavisi `#0789c1`, tema 5 kaplıca `#7b9c6f`, `tema6-su` mor-mavi `#2637b6`, Dünya Turu `dere-su` `#0faec2`.

Zeminler oyunda koyudur (parlaklık 68 ve 95; klasik temada üstüne %24 karartma). Yeni parçalar bu yüzden **orta-koyu ve
sönük** istenir; kesimde gerekirse ilgili zeminin ortalama parlaklığına çekilir.

---

## 3. Yerel Claude için iş sırası

1. Aynı ChatGPT sohbetinde devam et; yeni sohbetse önce `CHATGPT-ISTEMI-YOLCULUK.md` › **ANA İSTEM**.
2. Üslup referansı her paftada: `gorsel/hamui/U06.png` ve `gorsel/ham3d/D01.png`.
3. Zemin referansı: her paftanın altında yazan `www/gorsel/*.webp` dosyaları (oyundaki işlenmiş, koyultulmuş dokular;
   ham PNG'ler daha açık olduğu için **bunlar** eklenir). Ek sayısı sınıra takılırsa önce `D01.png` çıkarılır.
4. Kayıt: `gorsel/hamzemin/<KOD>.png` (1536 × 1024). Her paftadan sonra commit ve push; ilerleme
   `gorsel/hamzemin/DURUM.md`'ye yazılır. Oyun koduna dokunma.
5. Sıra: **Z25 → Z24 → Z26** (dikenler; kullanıcı önce bunu istedi), sonra **Z27 → Z28 → Z29**. Z30–Z31 yalnız
   bulut oturumu isterse.
6. Z25 ve Z26'yı kullanıcıya göster; onaydan sonra kalanlar toplu.
7. Denetle ve DURUM.md'ye yaz: saydam paftalarda arka plan gerçekten saydam mı; şeritlerin sol ucu sağ ucuna oturuyor mu
   (yan yana üç kopya); opak dokular 3 × 3 döşemede dikiş veriyor mu; hücre sınırı aşılıyor mu.

Ortak kurallar: 1536 × 1024 PNG, 3 × 2 ızgara (512 px hücre); üst satır soldan sağa 1-2-3, alt satır 4-5-6; yazı, harf,
rakam, bayrak, dinî simge yok.

---

## 4. Paftalar

### Z25: diken öbekleri (saydam, 6 tema) — ÖNCE BU

Ekler: `U06.png`, `D01.png`, `www/gorsel/tema1-zemin.webp` … `tema6-zemin.webp`.
Kesim: `tema1-diken` … `tema6-diken` (hücre sırasıyla), en büyük kenar 128 px.

```
STYLE FOR THIS SHEET: the pre-rendered, hand-painted look of a classic isometric action-RPG. Ground seen from a high three-quarter
angle (about 50° looking down), so stones, roots and grass clumps show a little of their side and feel 3D. One soft light from the
UPPER LEFT is baked into everything: lit top-left faces, soft shadows falling to the lower right, ambient occlusion in cracks and
joints. Rich fine detail, muted natural earthy palette (moss green, umber, ochre, slate grey), weathered and slightly gritty.
NOT flat cartoon, NOT glossy, NOT horror or gore: friendly cartoon characters must still look good on top and stay readable.
Do not copy any existing game's artwork; original art only.

Sheet Z25: SPIKE CLUSTERS for floor traps in a cute top-down ghost-hunting game. TRANSPARENT background, grid 3 x 2 (512 px
cells). Each cell holds ONE small cluster of exactly THREE upright spikes standing close together (one taller in the middle-back,
two shorter in front, slightly different heights and tilts), seen from the same high three-quarter angle, light from the UPPER
LEFT. Each spike rises out of a small round socket or cracked collar, and the cluster has one small soft contact shadow under it
(lower right). The cluster fills about 300 x 330 px, centred, at least 40 px clear margin on every side. No ground patch, no
plate, no border, no rim around the cluster: only the three spikes, their sockets and the soft shadow. Dangerous but friendly
and toy-like, NOT gory, no blood. The attached ground images show the six worlds these traps sit on; match each cluster's
material and tone to its world so it looks like it belongs there.
1. Purple Castle: worn STEEL spikes, blue-grey metal with a bright edge highlight and a little rust at the base, sockets of
   purple-grey castle stone
2. Green Forest: sharpened dark WOODEN STAKES with pale cut tips and bark at the base, a little moss, sockets of dark soil
3. Desert: BRONZE spikes with a warm golden sheen and a green patina at the base, sockets of ochre sandstone
4. Ice Cave: clear pale-blue ICE spikes like sharp icicles pointing up, frosty white bases, sockets of packed snow
5. Volcano: glossy black OBSIDIAN shards with a faint orange glow at the base, sockets of dark basalt
6. Space: violet-metal sci-fi spikes with a thin glowing cyan line near the tip, sockets of a dark metal ring
Same cluster size and the same baseline height in every cell. No text.
```

### Z24: tuzak tabanı dokuları (opak, dikişsiz, 6 tema)

Ekler: `U06.png`, `D01.png`, `www/gorsel/tema1-zemin.webp` … `tema6-zemin.webp`.
Kesim: `tema1-diken-taban` … `tema6-diken-taban`, opak, iki yönde dikişsiz, 512 px.

```
STYLE FOR THIS SHEET: the pre-rendered, hand-painted look of a classic isometric action-RPG. Ground seen from a high three-quarter
angle (about 50° looking down), so stones, roots and grass clumps show a little of their side and feel 3D. One soft light from the
UPPER LEFT is baked into everything: lit top-left faces, soft shadows falling to the lower right, ambient occlusion in cracks and
joints. Rich fine detail, muted natural earthy palette (moss green, umber, ochre, slate grey), weathered and slightly gritty.
NOT flat cartoon, NOT glossy, NOT horror or gore: friendly cartoon characters must still look good on top and stay readable.
Do not copy any existing game's artwork; original art only.

Sheet Z24: OPAQUE seamless floor textures for the SUNKEN FLOOR OF A SPIKE TRAP, grid 3 x 2, each cell one full 512 x 512 square
tile that repeats on ALL four sides without any seam (left edge continues into the right edge, top edge into the bottom edge).
No border, no frame, no vignette, no darker edges, no single large feature: an even all-over texture. NO spikes and NO holes in
these tiles (spikes are separate pieces placed on top). Each tile is the same material as its world's ground in the attached
images, but DARKER, lower and more worn, with a faint dusty rust-red tint in the cracks so it reads as a dangerous pit floor.
Calm and low contrast, no bright spots.
1. Purple Castle: dark purple-grey flagstones, tight joints, scratches and a little rust-red dust in the joints
2. Green Forest: dark damp packed earth with fine roots, a few dead leaves pressed flat, reddish-brown clay streaks
3. Desert: hard-packed dark ochre sand with a fine crack pattern and rust-coloured grit in the cracks
4. Ice Cave: dark blue-black ice with fine white scratch lines and frozen-in grit, a faint cold red tint deep in the cracks
5. Volcano: scorched black basalt slab with a fine network of dull dark-red cracks (no bright lava, no glow)
6. Space: dark violet-grey metal floor plating with small rivets, scuffs and a faint dull-red warning tint in the grooves
No text.
```

### Z26: kenar şeritleri, klasik 6 tema (saydam, sağa-sola dikişsiz)

Aynı şerit üç yerde kullanılır: diken çukurunun dudağı, göl kıyısı, yolculuk nehrinin kıyısı.
Ekler: `U06.png`, `D01.png`, `www/gorsel/tema1-zemin.webp` … `tema6-zemin.webp`.
Kesim: `tema1-kenar` … `tema6-kenar`, en büyük kenar 384 px, yatayda dikişsiz.

```
STYLE FOR THIS SHEET: the pre-rendered, hand-painted look of a classic isometric action-RPG. Ground seen from a high three-quarter
angle (about 50° looking down), so stones, roots and grass clumps show a little of their side and feel 3D. One soft light from the
UPPER LEFT is baked into everything: lit top-left faces, soft shadows falling to the lower right, ambient occlusion in cracks and
joints. Rich fine detail, muted natural earthy palette (moss green, umber, ochre, slate grey), weathered and slightly gritty.
NOT flat cartoon, NOT glossy, NOT horror or gore: friendly cartoon characters must still look good on top and stay readable.
Do not copy any existing game's artwork; original art only.

EXCEPTION FOR THIS SHEET (important): these are EDGE STRIPS that the game bends around curved outlines and ROTATES to any angle.
So draw every strip from STRAIGHT ABOVE (90°, flat top view), lit evenly from directly overhead: NO directional cast shadows, NO
lit side and dark side, only soft ambient occlusion between the pieces. Nothing tall and upright (no reeds, no posts, no
plants standing up): everything low and flat as seen from above. Keep the same hand-painted detail and muted palette.

Sheet Z26: six RIM / SHORE STRIPS, TRANSPARENT background, grid 3 x 2 (512 px cells). Each cell holds ONE horizontal strip,
about 470 px long and 110-130 px tall, centred, with clear empty space above and below it. Each strip is the raised lip that
runs around a pond, a river bank or a sunken spike pit in that world.
Rules for every strip:
- It is SEAMLESS LEFT-TO-RIGHT: the left end continues exactly into the right end, so copies placed side by side form one
  endless band with no visible join. The strip runs to the very left and right end with full thickness (no rounded ends, no caps).
- TOP edge = the OUTER side that meets the ground: an irregular, broken, natural silhouette (small stones, soil crumbs, low
  tufts) that fades softly into full transparency, coloured like that world's ground in the attached images so it melts into it.
- MIDDLE = the solid rim body, fully opaque, about half of the strip's height.
- BOTTOM edge = the INNER side that meets the water or the pit: a slightly uneven edge with a thin dark wet shadow line, then
  transparent. No water, no foam, no blue colour painted on it.
- Medium-dark and muted, not brighter than the attached ground images. No single eye-catching piece that would show the repeat.
1. Purple Castle: a coping of worn purple-grey castle stone blocks, dark joints, bits of moss, crumbs of earth on the outer side
2. Green Forest: a mossy earth bank with half-buried rounded stones, exposed fine roots, short flat grass and fallen leaves
3. Desert: a sandy bank with broken ochre sandstone slabs, pebbles and dry flat grass, loose sand drifting to the outer side
4. Ice Cave: a ledge of blue-white ice blocks with packed snow on the outer side and frost crystals
5. Volcano: a bank of dark basalt rocks and cinder with a few dull orange cracks between the rocks
6. Space: a dark violet-grey metal rim of bolted plates with a thin dim cyan light line along it, dust and tiny lilac crystals
   on the outer side
No text.
```

### Z27: kenar şeritleri, Dünya Turu aileleri 1 (K, KS, KP, SH, SV, GA)

Ekler: `U06.png`, `D01.png`, `www/gorsel/aile-K-zemin.webp`, `aile-KS-zemin.webp`, `aile-KP-zemin.webp`,
`aile-SH-zemin.webp`, `aile-SV-zemin.webp`, `aile-GA-zemin.webp`.
Kesim: `aile-K-kenar`, `aile-KS-kenar`, `aile-KP-kenar`, `aile-SH-kenar`, `aile-SV-kenar`, `aile-GA-kenar`; 384 px,
yatayda dikişsiz.

```
STYLE FOR THIS SHEET: the pre-rendered, hand-painted look of a classic isometric action-RPG. Ground seen from a high three-quarter
angle (about 50° looking down), so stones, roots and grass clumps show a little of their side and feel 3D. One soft light from the
UPPER LEFT is baked into everything: lit top-left faces, soft shadows falling to the lower right, ambient occlusion in cracks and
joints. Rich fine detail, muted natural earthy palette (moss green, umber, ochre, slate grey), weathered and slightly gritty.
NOT flat cartoon, NOT glossy, NOT horror or gore: friendly cartoon characters must still look good on top and stay readable.
Do not copy any existing game's artwork; original art only.

EXCEPTION FOR THIS SHEET (important): these are EDGE STRIPS that the game bends around curved outlines and ROTATES to any angle.
So draw every strip from STRAIGHT ABOVE (90°, flat top view), lit evenly from directly overhead: NO directional cast shadows, NO
lit side and dark side, only soft ambient occlusion between the pieces. Nothing tall and upright (no reeds, no posts, no
plants standing up): everything low and flat as seen from above. Keep the same hand-painted detail and muted palette.

Sheet Z27: six RIM / SHORE STRIPS for a world-tour mode, TRANSPARENT background, grid 3 x 2 (512 px cells). Each cell holds ONE
horizontal strip, about 470 px long and 110-130 px tall, centred, with clear empty space above and below it. Each strip is the
shore that runs around a pond or along a river bank in that region.
Rules for every strip:
- It is SEAMLESS LEFT-TO-RIGHT: the left end continues exactly into the right end, so copies placed side by side form one
  endless band with no visible join. The strip runs to the very left and right end with full thickness (no rounded ends, no caps).
- TOP edge = the OUTER side that meets the ground: an irregular, broken, natural silhouette that fades softly into full
  transparency, coloured like that region's ground in the attached images so it melts into it.
- MIDDLE = the solid rim body, fully opaque, about half of the strip's height.
- BOTTOM edge = the INNER side that meets the water: a slightly uneven edge with a thin dark wet shadow line, then transparent.
  No water, no foam, no blue colour painted on it.
- Medium-dark and muted, not brighter than the attached ground images. No single eye-catching piece that would show the repeat.
1. Temperate Europe (green meadow ground): a quay of grey cut-stone blocks with moss in the joints and a small round dark iron
   mooring knob every few blocks; grass creeping over the outer side
2. Anatolia / Middle East (stony hillside ground): a pale marble edge with a border of small plain square glazed tiles, blue
   and white alternating, no patterns or symbols on the tiles; dusty stones on the outer side
3. North Africa (pale desert sand ground): a soft sandy bank, slightly darker wet sand toward the inner side, a few flat dry
   grass tufts and small stones
4. Sahel (red-brown earth ground): a red earth bank with rounded pebbles and flattened dry yellow grass
5. Savanna (dry steppe ground): a cracked dried-mud bank with a few small hoof prints pressed into the mud and dry straw
6. South Asia (dark red-brown tropical soil ground): a stepped sandstone edge, three thin steps going down toward the inner
   side, with a row of tiny pale inlaid diamond shapes on the top step
No text.
```

### Z28: kenar şeritleri, Dünya Turu aileleri 2 (GDA, DA, KA, LA) ve lav dokusu

Ekler: `U06.png`, `D01.png`, `www/gorsel/aile-GDA-zemin.webp`, `aile-DA-zemin.webp`, `aile-KA-zemin.webp`,
`aile-LA-zemin.webp`, `www/gorsel/tema5-zemin.webp`.
Kesim: 1–4. hücre `aile-GDA-kenar`, `aile-DA-kenar`, `aile-KA-kenar`, `aile-LA-kenar` (384 px, yatayda dikişsiz);
5–6. hücre opak doku `doku-lav-1`, `doku-lav-2` (256 px, iki yönde dikişsiz).

```
STYLE FOR THIS SHEET: the pre-rendered, hand-painted look of a classic isometric action-RPG. Ground seen from a high three-quarter
angle (about 50° looking down), so stones, roots and grass clumps show a little of their side and feel 3D. One soft light from the
UPPER LEFT is baked into everything: lit top-left faces, soft shadows falling to the lower right, ambient occlusion in cracks and
joints. Rich fine detail, muted natural earthy palette (moss green, umber, ochre, slate grey), weathered and slightly gritty.
NOT flat cartoon, NOT glossy, NOT horror or gore: friendly cartoon characters must still look good on top and stay readable.
Do not copy any existing game's artwork; original art only.

EXCEPTION FOR CELLS 1-4 (important): these are EDGE STRIPS that the game bends around curved outlines and ROTATES to any angle.
So draw every strip from STRAIGHT ABOVE (90°, flat top view), lit evenly from directly overhead: NO directional cast shadows, NO
lit side and dark side, only soft ambient occlusion between the pieces. Nothing tall and upright (no reeds, no posts, no
plants standing up): everything low and flat as seen from above. Keep the same hand-painted detail and muted palette.

Sheet Z28, grid 3 x 2 (512 px cells).
CELLS 1-4: TRANSPARENT background. Each cell holds ONE horizontal RIM / SHORE STRIP, about 470 px long and 110-130 px tall,
centred, with clear empty space above and below it. Rules for every strip:
- It is SEAMLESS LEFT-TO-RIGHT: the left end continues exactly into the right end, so copies placed side by side form one
  endless band with no visible join. The strip runs to the very left and right end with full thickness (no rounded ends, no caps).
- TOP edge = the OUTER side that meets the ground: an irregular, broken, natural silhouette that fades softly into full
  transparency, coloured like that region's ground in the attached images so it melts into it.
- MIDDLE = the solid rim body, fully opaque, about half of the strip's height.
- BOTTOM edge = the INNER side that meets the water: a slightly uneven edge with a thin dark wet shadow line, then transparent.
  No water, no foam, no blue colour painted on it.
- Medium-dark and muted, not brighter than the attached ground images. No single eye-catching piece that would show the repeat.
1. Southeast Asia (wet green rice-field ground): a green muddy bank with moss and short flat grass, edged on the inner side by
   a low row of short bamboo stakes seen from above (only their round cut tops)
2. East Asia (dark slate mountain ground): a garden-pond edge of smooth rounded grey stones of different sizes with moss
   between them
3. North America (dark forest floor with pine needles): a grassy bank with a line of small grey gravel and a low edging of
   short logs lying flat, pine needles on the outer side
4. Latin America (damp mossy green ground): a cream mortar band set with small square glazed tiles in terracotta red, cobalt
   blue and yellow, plain colours, no patterns or symbols; moss on the outer side
CELLS 5-6: OPAQUE, each one full 512 x 512 square tile that repeats on ALL four sides without any seam, no border, no rocks,
no shore, seen from straight above:
5. molten LAVA surface: glowing orange lava with darker red-brown cooling crust plates drifting on it and thin bright yellow
   cracks between the plates, a few small bubbles; warm but not blinding
6. the SAME lava surface a moment later: the same colours and the same plate sizes, but the plates have shifted and the bright
   cracks run in different places (used to cross-fade with cell 5 so the lava looks alive)
No text.
```

### Z29: göl süsleri (saydam)

Ekler: `U06.png`, `D01.png`, `gorsel/hamek/K02.png` (eldeki dere süsleri; aynı boy ve dil için).
Kesim: `gol-sus-buz` (160), `gol-sus-palmiye` (192), `gol-sus-bambu` (160), `gol-sus-koi` (160), `gol-sus-iskele` (192),
`gol-sus-yildiz` (128).

```
STYLE FOR THIS SHEET: the pre-rendered, hand-painted look of a classic isometric action-RPG. Ground seen from a high three-quarter
angle (about 50° looking down), so stones, roots and grass clumps show a little of their side and feel 3D. One soft light from the
UPPER LEFT is baked into everything: lit top-left faces, soft shadows falling to the lower right, ambient occlusion in cracks and
joints. Rich fine detail, muted natural earthy palette (moss green, umber, ochre, slate grey), weathered and slightly gritty.
NOT flat cartoon, NOT glossy, NOT horror or gore: friendly cartoon characters must still look good on top and stay readable.
Do not copy any existing game's artwork; original art only.

Sheet Z29: small decorations placed ON or AT THE EDGE OF ponds, same size and feeling as the attached stream decoration sheet.
TRANSPARENT background, grid 3 x 2 (512 px cells), one object per cell, centred, at least 40 px clear margin on every side.
No water surface, no ground patch and no background painted under the objects (only the object itself, plus a thin soft ring
of ripples where it touches water, if noted).
1. a group of three flat floating ICE FLOES of different sizes, pale blue-white with darker blue edges, about 300 x 220 px
2. a small PALM seen from above at the three-quarter angle: a short leaning trunk and a crown of green fronds reaching to the
   right, as if leaning over water from the shore, about 320 x 300 px
3. a clump of five or six BAMBOO stalks with a few leaves, green and yellow-green, standing at a shore, about 240 x 320 px
4. two KOI fish seen from directly above, swimming in a gentle curve, one orange-and-white and one white with orange patches,
   slightly under the surface with a soft ring of ripples, about 300 x 220 px
5. a short wooden JETTY seen from directly above, running top to bottom (vertical): weathered planks across, four round post
   tops at the corners, about 150 x 330 px
6. a small cluster of three soft four-pointed STAR GLINTS of different sizes, pale yellow-white with a faint glow, like stars
   reflected on dark water, about 220 x 200 px
Cute, friendly, no text.
```

### Z30–Z31: Dünya Turu harita sınırı şeritleri (yalnız gerekirse)

Önce kod düzeltmesi denenir (5. bölüm, K4). Sınır eldeki `aile-<A>-duvar` resmiyle iyi durmazsa bu iki pafta üretilir.
Ekler: `U06.png`, `D01.png`, ilgili ailelerin `www/gorsel/aile-<A>-duvar.webp` dosyaları (aynı malzeme için) ve
`gorsel/hamyeni/R12.png` (klasik sınır şeridi örneği, 6. hücre).
Kesim: `aile-<A>-sinir`, 512 px, yatayda dikişsiz. Z30: K, KS, KP, SH, SV, GA. Z31: GDA, DA, KA, LA (5–6. hücre boş).

```
STYLE FOR THIS SHEET: the pre-rendered, hand-painted look of a classic isometric action-RPG. Ground seen from a high three-quarter
angle (about 50° looking down), so stones, roots and grass clumps show a little of their side and feel 3D. One soft light from the
UPPER LEFT is baked into everything: lit top-left faces, soft shadows falling to the lower right, ambient occlusion in cracks and
joints. Rich fine detail, muted natural earthy palette (moss green, umber, ochre, slate grey), weathered and slightly gritty.
NOT flat cartoon, NOT glossy, NOT horror or gore: friendly cartoon characters must still look good on top and stay readable.
Do not copy any existing game's artwork; original art only.

Sheet Z30: six straight MAP BORDER WALL strips for a world-tour mode, TRANSPARENT background, grid 3 x 2 (512 px cells). Each
cell holds ONE horizontal wall strip about 480 px long and 150-180 px tall, centred, seen from above with slight depth (the top
face and a little of the front face visible), made of the SAME materials as the matching wall in the attached wall images.
Each strip is SEAMLESS LEFT-TO-RIGHT (the left end continues exactly into the right end; no towers, no gates, no end caps, the
same height along its whole length) and has a regular rhythm of small rounded battlements or post tops along its upper edge.
1. Temperate Europe: grey stone castle wall with rounded battlements
2. Anatolia / Middle East: pale caravanserai stone wall with a band of plain blue glazed tiles, no symbols
3. North Africa: smooth adobe mud-brick wall with stepped battlements and small wooden beam ends
4. Sahel: red-brown mud wall with a zig-zag relief band and short wooden pegs
5. Savanna: a palisade of sharpened wooden stakes tied with rope
6. South Asia: carved red sandstone wall with small domed caps
No text.

Sheet Z31: same format as Z30. Cells 1-4:
1. Southeast Asia: a tall bamboo fence tied with rope
2. East Asia: a white plastered wall with a grey tiled roof cap
3. North America: a log palisade with flat-cut tops
4. Latin America: a colourful plastered wall (warm yellow and terracotta) with a clay tile cap
Cells 5 and 6: leave EMPTY (transparent). No text.
```

---

## 5. Kodlama notları (görev tanımı için)

### 5.1 Kesici (`araclar/gorsel_kes.py`)

| Pafta | Tablo | Kayıt |
|---|---|---|
| Z24 | `DOKU_PAFTALARI` | `'Z24': [(f'tema{n}-diken-taban', 'iki') for n in range(1, 7)]` |
| Z25 | `EK_PAFTALARI` | `'Z25': [(f'tema{n}-diken', 128) for n in range(1, 7)]` |
| Z26 | `EK_PAFTALARI` | `'Z26': [(f'tema{n}-kenar', 384) for n in range(1, 7)]` |
| Z27 | `EK_PAFTALARI` | `'Z27': [(f'aile-{a}-kenar', 384) for a in ('K', 'KS', 'KP', 'SH', 'SV', 'GA')]` |
| Z28 | `EK_PAFTALARI` + `DOKU_PAFTALARI` | `'Z28': [(f'aile-{a}-kenar', 384) for a in ('GDA', 'DA', 'KA', 'LA')] + [None, None]`; doku: `'Z28': [None, None, None, None, ('doku-lav-1', 'iki'), ('doku-lav-2', 'iki')]` |
| Z29 | `EK_PAFTALARI` | `'Z29': [('gol-sus-buz', 160), ('gol-sus-palmiye', 192), ('gol-sus-bambu', 160), ('gol-sus-koi', 160), ('gol-sus-iskele', 192), ('gol-sus-yildiz', 128)]` |
| Z30, Z31 | `EK_PAFTALARI` | `aile-<A>-sinir`, 512; `YATAY_DIKISSIZ` kümesine eklenir |

Dikkat edilecekler:

- **Ad seçimi bilinçli:** `tema<n>-diken-taban` `tema` ile başladığı için `doku_hucreleri` onu 512 px keser, ama
  `-zemin` ile bitmediği için `zemin_sakinlestir` uygulanmaz. Taban fazla açık gelirse elle bir hedef verilir.
- **Kenar şeritlerinin yatay dikişi:** `YATAY_DIKISSIZ` → `donem_kirp` düzenli desenler (mazgal, kemer) içindir; desenin
  tekrar aralığını arar. Kenar şeritlerinin çoğu düzensizdir (taş, toprak); onlarda dönem araması rastgele bir yer seçer.
  `*-kenar` anahtarları için ayrı küme (`YATAY_HARMAN`) açıp uçları `dikissiz_dikey(serit.transpose(ROTATE_90), 40)` ile
  harmanlamak daha güvenli. Düzenli olanlar (tema 6 metal, KS ve LA çini, GA basamak) `donem_kirp`'e verilebilir.
  Her şerit kesimden sonra üç kopya yan yana dizilip gözle denetlenir.
- **Parlaklık:** şeritler ilgili zeminden belirgin açık gelirse (ortalama parlaklık farkı %15'ten fazla) opak
  piksellerin parlaklığı zeminin ortalamasına çekilir; renk tonuna dokunulmaz.
- `ALFA_ESIK = 40` soluk pikselleri siler; şeridin dışa sönen kenarı fazla kırpılırsa eşik yalnız `*-kenar` için düşürülür.
- Kesimden sonra temiz ağaçta `node test/gorsel.test.mjs`.

### 5.2 Ortak yardımcı: şeridi hat boyunca sarmak

Yeni işlev, `engeller.js` içinde, örneğin `seritSar(ctx, P, im, kalinlik, icPay)`:

- Dış hat noktaları eldeki `kenarNoktalari(P, aralik, b)` ile alınır; her nokta `nx, ny` normalini taşır. `aralik` 3
  birim seçilir (dilim başına dönüş küçük kalır, taşlar kırılmaz). `kenarNoktalari` noktaları y'ye göre sıralıyor;
  sarma için hat sırası gerekir, bu yüzden sıralamasız bir kopyası (ya da parça parça dolaşım) yazılır.
- Her noktada şeridin `aralik` genişliğinde dikey bir dilimi çizilir: kaynak x'i hat boyunca gidilen yolla ilerler ve
  şerit genişliğinde başa sarar; dilim normal yönüne döndürülür, **üst kenarı dışa** bakar. Dilimler 1 birim bindirilir
  (dışbükey yayda aralık kalmasın).
- Ölçü: şerit dünyada 12 birim kalınlıkta çizilir (diken çukurunda 9). Hattın 4 birim dışına, 8 birim içine düşer.
- Sarma bir kez, engelin önbellek tuvaline yapılır (`engelResmi`); kare başına maliyet yoktur.
- **Önbellek payı:** su ve diken önbelleğinin bugün payı yok (tuval tam kutu kadar). Şeridin dışa sönen kısmı kesilmesin
  diye `objePayi` / `duvarPayi` gibi 6 birimlik pay eklenir. Dışa taşan kısım saydama sönen süs olduğundan komşuya
  dikdörtgen resim gibi binmez; çarpışma biçimi değişmez.
- **Kesişen göller:** `icResmi` önbellekteki resmin biçim içini ikinci geçişte yeniden basıyor. Şeridin iç kısmı da
  biçimin içinde olduğundan, komşu gölün suyunun üstüne kıyı basılır. İkinci geçiş için yalnız su katmanı (şeritsiz)
  ayrı tutulmalı.

### 5.3 Ressamlar

**K1. Diken (`dikenCiz`, `dikenUclari`)**
- Tema anahtarı: klasikte `n = o.tema + 1`. Dünya Turu'nda aileye göre eşleme:

  | Aile | Taban ve diken | Kenar |
  |---|---|---|
  | K, DA | tema 1 (taş, çelik) | `aile-<A>-kenar` |
  | KS, KP, GA | tema 3 (kum, bronz) | `aile-<A>-kenar` |
  | SH, SV, KA, GDA | tema 2 (toprak, ahşap kazık) | `aile-<A>-kenar` |
  | LA | tema 5 (bazalt, obsidyen) | `aile-LA-kenar` |

- Sıra: (1) biçimin içi `tema<n>-diken-taban` deseniyle doldurulur (`kirp` + `createPattern`; 512 px doku 96 dünya
  biriminde döşenir); (2) `tema<n>-diken` öbekleri kaydırmalı ızgaraya konur: adım 16 birim, öbek yaklaşık 18 × 20
  birim, yalnız `engelUzaklik(B, x, y) <= -8` olan noktalara (kenar şeridinin altına girmez, biçimden taşmaz), y'ye göre
  sırayla; boy tohumlu olarak ±%12 değişir, **aynalama yok** (ışık sol üstten işli); (3) kenar şeridi `seritSar` ile,
  9 birim kalınlıkta.
- Tehlike okunaklılığı: kırmızı düz bant kalkıyor. Tehlikeyi dikenler, koyu taban ve tabandaki pas kırmızısı verir.
  Deneme sonunda zayıf kalırsa şerit eldeki `gorselRenkli(k, "#b91c1c")` ile hafif kızıla boyanabilir (yeni çizim değil).
- Kod çizimi yalnız üç resimden biri yoksa yedek kalır.

**K2. Klasik göller (`suTabani` ve altı tema ressamı)**
- Kıyı bandı (`doldur(..., 8)`, `tasOrgu`, `cimTutami`, `kayalikKenar`) yerine su dolgusundan sonra
  `seritSar(ctx, B, gorsel("tema<n>-kenar"), 12)`.
- Süsler: nilüfer → `dere-sus-2`; kamış → `dere-sus-1`; `vaha` palmiyesi → `gol-sus-palmiye` (kıyı noktasına, dönmeden;
  hattın sol yarısında yatay aynalanmaz, yalnız sağa eğik durur); buz parçaları → `gol-sus-buz`; `metalHavuz`'un
  `yildiz` canlısı → `gol-sus-yildiz` (bugünkü göz kırpma saydamlığıyla). `sicakSu` buharı zaten `canli-buhar`.
- Süsler `icNoktalar` ile biçimin içine, kıyı süsleri `kenarNoktalari` ile hatta konur; hepsi tek parça, kırpılmaz.

**K3. Dünya Turu gölleri (on aile ressamı)**
- Su: `suTabani` içinde tema metin olduğunda `dere-su` deseni kullanılır (256 px, 256 birim). Pafta gerekmez.
- Kıyı: `seritSar(ctx, B, gorsel("aile-<A>-kenar"), 12)`.
- Süsler: KP hurma → `gol-sus-palmiye`; SH, SV, KA saz → `dere-sus-1`; GDA lotus → `dere-sus-2`, bambu →
  `gol-sus-bambu`; DA nilüfer → `dere-sus-2`, koi → `gol-sus-koi` (tohumlu açıyla döndürülebilir, tepeden çizildi);
  KA iskele → `gol-sus-iskele` (üst kıyıdan suya, dönmeden). K'nin bağlama babaları ve GA'nın kakmaları şeridin içinde.

**K4. Dünya Turu harita sınırı (`engelResimRessami`)**
- Dünya Turu'nda sınır için `null` dönmek yerine `aile-<A>-duvar` resmi `sinirResmi` ile döşenir (klasik temalardaki
  `tema<n>-sinir` gibi; dikey kenarda 90° döner). Duvar resmi uçlu bir parça olduğundan ek yerleri görünebilir.
  Ekran görüntüsüyle bakılır; kötü duruyorsa Z30–Z31 istenir ve anahtar `aile-<A>-sinir` olur.

**K5. Yolculuk nehri (`yolculukGecitCiz`)**
- 12 ve 15 birimlik düz kıyı çizgileri yerine `solBank` ve `sagBank` hatları boyunca kenar şeridi sarılır (klasikte
  `tema<n>-kenar`, Dünya Turu'nda `aile-<A>-kenar`). Hat açık bir eğridir; `egri.merkez + egri.offset(y) ± egri.yari(y)`
  noktalarından 3 birim adımla ve sonlu farkla normal alınır. Sol kıyıda şeridin dışı sola, sağ kıyıda sağa bakar.
- Nehir uzun olduğu için şerit kare başına değil, bölge başına bir kez tuvale sarılıp oradan basılır (bugünkü
  `yolculukGecitDoseme` önbelleği gibi).

**K6. Lav (isteğe bağlı, `lavCiz` / `lavCanli`)**
- `doku-lav-1` biçimin içine desen olarak döşenir; üstüne `doku-lav-2` saydamlığı 0 ile 1 arasında yavaş salınarak
  basılır (yaklaşık 2 saniyelik döngü). Kıyı: `tema5-kenar` bütün temalarda. Böylece lav leke biçimine oturur.
- Bugünkü `an-lav-*` kareleri resim yoksa yedek kalır. Bu adım kullanıcı lavdan şikâyet etmediği için en sona bırakılır.

**K7. Pafta gerektirmeyen arayüz düzeltmeleri**
- `#lives`: ❤️ / 🖤 yerine `kalp` resmi (boş can için aynı resim CSS `grayscale` ve düşük saydamlıkla).
- `petCanCiz`: kod kalpleri yerine `kalp` resmi.
- Öteki oyuncunun ve botun can çubuğu: boss çubuğundaki gibi `ui-can-cubugu` çerçevesi.
- `drawPickup` güç yıldızı: içteki yazı ikon yerine `guc-<karakter>` resmi.

### 5.4 Sınama

- Her tema ve her aile için bir harita ekran görüntüsü: diken, göl, nehir kıyısı; komşu engelle bindirme ve kesik kenar
  olmamalı.
- Çarpışma değişmez: `bicim`, `carpisma`, `pay` alanlarına dokunulmaz; eldeki engel testleri yeşil kalır.
- Başarım: sarma yalnız önbellek kurulurken; `yolculuk-perf` sınamasının süresi artmamalı.
- Kesişen iki göl: ortak alanda kıyı görünmemeli.

---

## 6. Açık sorular

1. **3D avcılar ve bot (denetim #7):** kodla kurulan three.js modelleri, kullanıcının 24 Kasım 2026 kararıyla geldi
   (`UC-BOYUT.md`); "ChatGPT ile hazırlanmamış görsel kalmasın" isteğiyle çelişiyor. ChatGPT 3D model üretemez; seçenek,
   3D'yi kapatıp eldeki ChatGPT karelerine (`k3-*`, `kar-*`, `bot`) dönmek. Karar kullanıcınındır; bu pakette pafta yok.
2. **Şerit yöntemi ilk kez deneniyor.** ChatGPT'nin şeridi gerçekten tam tepeden ve gölgesiz çizip çizmeyeceği, uçların
   birbirine oturup oturmayacağı Z26 gelince görülecek. Olmazsa şerit yerine aynı malzemeden tek tek taş ve tutam
   parçaları istenir ve hatta dönmeden dizilir (bugünkü `kayalikKenar` düzeninin resimli hâli).
3. **Tek şeridin üç işte kullanılması** (çukur, göl, nehir) pafta sayısını azaltmak içindir. Diken çukuru göl kıyısına
   fazla benzerse çukur için ayrı altı şerit (bir pafta) istenebilir.
4. **Dünya Turu'nda taban ve diken eşlemesi** (5.3 K1) varsayımdır; ailelerin kendi tabanı istenirse iki pafta daha gerekir.
5. **Zemin referansı olarak WebP** dosyaları öneriliyor; ChatGPT penceresi WebP ekini kabul etmezse aynı dosyalar PNG'ye
   çevrilip eklenir (içerik değişmez).
