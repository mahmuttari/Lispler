# Hayalet Avcıları: bütün kod çizimlerinin ChatGPT ile yenilenmesi (R01–R50)

Hazırlandı: 25 Kasım 2026. Kullanıcının kararı: *"Senin hazırladığın bütün görselleri ChatGPT'ye yeniden yaptır. Senin hazırladığın
görsel kalmasın."* ve *"Görselleri her zamanki gibi ChatGPT'ye üret; bunu artık söylememe gerek yok."* Bu paket, oyunda bugün kodla
çizilen her şeyi (envanter: ~230 parça) ChatGPT'ye ürettirir. Paftalar geldikçe bulut Claude keser
(`araclar/gorsel_kes.py --ek`), Evren oyuna bağlar; kod çizimi yalnız resim yüklenemezse yedek kalır.

## Yerel Claude için iş sırası

1. ChatGPT'de yeni bir sohbet aç; `CHATGPT-ISTEMI-YOLCULUK.md`'deki **ANA İSTEM**'i bir kez gönder (aynı üslup, tepeden görünüm).
   Karakter/efekt paftaları için üslup referansı `hamui/U06.png` ve `ham3d/D01.png`.
2. Her resmi `gorsel/hamyeni/<KOD>.png` olarak kaydet; her paftadan sonra commit + push, `gorsel/hamyeni/DURUM.md`'yi güncelle.
3. Sıra: önce R47–R50 (giriş ekranı, kullanıcı istedi), sonra R01 → R46 (öncelik sırasıyla dizildi). Her 6 paftada bir kullanıcıya toplu göster.
4. Ortak kurallar: 1536 × 1024 PNG, 3 × 2 ızgara (512 px hücre), saydam arka plan (opak denenler belirtilmiş), her nesne hücresinin
   içinde 24 px payla, yazı/harf/rakam/bayrak/dini simge yok, sevimli ve korkutucu olmayan premium casual üslup.
5. Giriş, şifre, ödeme ve ChatGPT'nin görsel sınırı kullanıcıya bırakılır; oyun koduna dokunma.

---

## A. Mermiler ve efektler (oyunun her karesinde görünür)

### R01: karakter mermileri 1

```
Sheet R01: projectiles of six hunters, TRANSPARENT background, grid 3 x 2, each 120-200 px, glowing, readable at 16 px:
1. Kinkin: a blue energy ball with a bright core and short trail
2. Veryi: a small round brown rock with motion streaks
3. Kornet: a violet magic orb with a tiny star inside
4. Marli: a wooden arrow with a green fletching (horizontal, pointing right)
5. Kenit: a small spinning throwing knife with a motion swirl
6. Ponko: a shiny golden bullet with a short orange trail (pointing right)
```

### R02: karakter mermileri 2

```
Sheet R02: projectiles, same style, TRANSPARENT, grid 3 x 2:
1. Güllu: a pink-gold arrow with a heart-shaped head (pointing right)
2. Rani: a smooth grey sling stone
3. Beri: a round candy ball with a swirl pattern
4. Fanatik: a crescent-shaped wind fist shockwave (curved, light blue-white)
5. Silsen: a white daisy flower spinning
6. Serçin: a soft white-and-blue feather (pointing right)
```

### R03: silah mermileri ve düşman atışları

```
Sheet R03: TRANSPARENT, grid 3 x 2:
1. a thin red laser bolt (horizontal) with glow
2. twin green energy pellets side by side
3. three small orange shotgun pellets in a spread
4. an enemy ghost shot: a purple glowing orb with a sad little face
5. a boss shot: a big red glowing orb with a crown-shaped spark
6. a soft red danger aura ring seen from above (empty middle)
```

### R04: hayalet doğuşu ve şarj (3+3 kare)

```
Sheet R04: two 3-frame effects, TRANSPARENT, top row = frames 1-3, bottom row = frames 1-3, same size and centre in each cell:
top: a ghost SPAWN portal: a swirling lilac vortex on the ground growing from small to big with sparkles
bottom: a ghost CHARGING shot: a small purple energy orb gathering light, getting brighter
```

### R05: toplama halkası ve mücevher pırıltısı (3+3)

```
Sheet R05: TRANSPARENT, top row 3 frames: a golden pickup ring expanding with small coins sparkles; bottom row 3 frames: a gem
sparkle (four-point stars popping and fading).
```

### R06: boss inişi ve seviye atlama (3+3)

```
Sheet R06: TRANSPARENT, top row 3 frames: a ground shockwave ring with dust when the boss lands (seen from above); bottom row 3
frames: a level-up burst (golden rays and stars rising).
```

### R07: hasar ve görünmezlik (3+3)

```
Sheet R07: TRANSPARENT, top row 3 frames: a red-white damage burst (cartoon pow star, no letters); bottom row 3 frames: an
invisibility shimmer (soft blue-white sparkles fading a silhouette area, empty middle).
```

### R08: güç imzaları 1

```
Sheet R08: special power auras drawn AROUND an empty middle (the hunter is not drawn), TRANSPARENT, grid 3 x 2:
1. speed lines (white streaks), 2. a red rage halo, 3. three orbiting blue spheres, 4. magnet lines (blue-red arcs),
5. a shimmering cape glow (purple), 6. a flaming barrel glow (orange flames ring)
```

### R09: güç imzaları 2

```
Sheet R09: same as R08, grid 3 x 2: 1. a fuse spark ring (sparks), 2. a pink heart pulse ring, 3. candy sparkles,
4. swirling flower petals, 5. a feather trail ring, 6. a soft bullet trail glow (short comet tail, horizontal)
```

## B. Tehlikeler ve küçük canlı parçalar

### R10: diken, lav, kalp aurası, hatıra parıltısı

```
Sheet R10: TRANSPARENT, grid 3 x 2, top-down:
1. a stone plate with metal spikes and a red rim (round-ish, 300 px)
2-4. a small lava pool with a rocky rim, 3 animation frames (bubbles and cracks move, flames on the top edge)
5. a soft pink pulsing aura ring for a heart pickup (empty middle)
6. a golden glow bubble around an empty middle (keepsake on the ground)
```

### R11: engel üstü küçük canlılar

```
Sheet R11: tiny animated details, TRANSPARENT, grid 3 x 2, each 100-160 px (will be drawn at 6-15 px):
1. a candle flame, 2. two glowing eyes in a dark hollow, 3. a crystal sparkle, 4. hot steam bubbles,
5. a smiling little fire spirit, 6. a firefly with a soft glow
```

## C. Klasik temalar: duvar, iki obje, göl kıyısı, sınır (6 tema)

Not: Evren engelleri bu resimlerden kuracak; çarpışma resmin dolu alanından türetilecek (basit daire/elips/kutu).

### R12: Mor Şato (Purple Castle)

```
Sheet R12: theme "Mor Şato (Purple Castle)", top-down with slight 3/4 depth, TRANSPARENT background, grid 3 x 2:
1. a purple-brown brick castle wall segment with an arched window
2. a cone-roofed castle tower
3. a cute small graveyard with candles
4. a pumpkin patch with jack-o-lanterns
5. a stone moat pond (top-down, water inside, stone rim)
6. a straight castle border strip (seamless left-right)
```

### R13: Yeşil Orman (Green Forest)

```
Sheet R13: theme "Yeşil Orman (Green Forest)", top-down with slight 3/4 depth, TRANSPARENT background, grid 3 x 2:
1. a mossy log fence segment
2. a big twisted tree with a glowing-eyes hollow
3. a ring of giant mushrooms
4. a twisted tree cluster
5. a reed pond with lily pads
6. a straight log-fence border strip
```

### R14: Çöl (Desert)

```
Sheet R14: theme "Çöl (Desert)", top-down with slight 3/4 depth, TRANSPARENT background, grid 3 x 2:
1. a sandstone ruin wall segment with a broken column
2. a crumbling sandstone tower
3. a cactus garden
4. a sarcophagus with a peeking friendly mummy and jars
5. an oasis pond with two palms
6. a straight sandstone border strip
```

### R15: Buz Mağarası (Ice Cave)

```
Sheet R15: theme "Buz Mağarası (Ice Cave)", top-down with slight 3/4 depth, TRANSPARENT background, grid 3 x 2:
1. an ice-brick wall segment with icicles
2. a snow-domed ice tower
3. two cute snowmen
4. a blue crystal cluster
5. a frozen-rim lake
6. a straight ice-brick border strip
```

### R16: Volkan (Volcano)

```
Sheet R16: theme "Volkan (Volcano)", top-down with slight 3/4 depth, TRANSPARENT background, grid 3 x 2:
1. a basalt rock wall segment with glowing red cracks
2. a tall basalt rock spire
3. a dragon nest with eggs and a cute baby dragon
4. rocks with little friendly fire spirits
5. a steaming hot spring
6. a straight basalt border strip
```

### R17: Uzay (Space)

```
Sheet R17: theme "Uzay (Space)", top-down with slight 3/4 depth, TRANSPARENT background, grid 3 x 2:
1. a metal space-station wall panel segment with windows
2. a station tower with blinking lights
3. a meteor with glowing crystals
4. a crashed little UFO with a waving alien
5. a metal-rimmed glowing pool
6. a straight metal border strip
```

## D. Dünya Turu bölge aileleri (duvar, kule, göl) ve zemin dokuları

### R18: aile K ve KS (Avrupa kalesi, kervansaray)

```
Sheet R18: two World Tour region families, top-down, TRANSPARENT, grid 3 x 2:
1. a European stone castle wall segment, 2. a matching tower/corner piece, 3. a stone-quay pond (water inside, rim around)
4. a caravanserai stone wall with an arch segment, 5. a matching tower/corner piece, 6. a tiled pool with blue çini
```

### R19: aile KP ve SH (kerpiç, Sahel)

```
Sheet R19: two World Tour region families, top-down, TRANSPARENT, grid 3 x 2:
1. an adobe mud-brick wall segment, 2. a matching tower/corner piece, 3. a palm oasis pond (water inside, rim around)
4. a Sahel mud wall with wooden spikes segment, 5. a matching tower/corner piece, 6. a reedy river bank pond
```

### R20: aile SV ve GA (savan, Güney Asya)

```
Sheet R20: two World Tour region families, top-down, TRANSPARENT, grid 3 x 2:
1. a wooden stake fence segment, 2. a matching tower/corner piece, 3. a reedy waterhole (water inside, rim around)
4. a South Asian carved sandstone wall segment, 5. a matching tower/corner piece, 6. a stepped temple pool
```

### R21: aile GDA ve DA (Güneydoğu Asya, Doğu Asya)

```
Sheet R21: two World Tour region families, top-down, TRANSPARENT, grid 3 x 2:
1. a bamboo fence segment, 2. a matching tower/corner piece, 3. a lotus pond (water inside, rim around)
4. a tiled-roof wall segment, 5. a matching tower/corner piece, 6. a koi pond
```

### R22: aile KA ve LA (Kuzey Amerika, Latin Amerika)

```
Sheet R22: two World Tour region families, top-down, TRANSPARENT, grid 3 x 2:
1. a wooden palisade segment, 2. a matching tower/corner piece, 3. a log jetty pond (water inside, rim around)
4. a colourful plastered Latin wall segment, 5. a matching tower/corner piece, 6. a tiled canal pool
```

### R23: zemin dokuları

```
Sheet R23: OPAQUE seamless tiles, grid 3 x 2, each cell a square tile that repeats on all sides, top-down, low contrast so characters stay readable:
1. cobblestone floor (Avrupa kalesi)
2. geometric çini floor (kervansaray)
3. rippled sand floor (kerpiç)
4. red earth floor (Sahel)
5. cracked dry earth floor (savan)
6. hot volcanic spring water texture (orange-teal, steaming)
```

### R24: zemin dokuları

```
Sheet R24: OPAQUE seamless tiles, grid 3 x 2, each cell a square tile that repeats on all sides, top-down, low contrast so characters stay readable:
1. sandstone paving floor (Güney Asya)
2. woven mat floor (Güneydoğu Asya)
3. stone paving floor (Doğu Asya)
4. grass with pine needles floor (Kuzey Amerika)
5. terracotta tile floor (Latin Amerika)
6. a vertical river water strip with soft banks (seamless top-bottom) for the journey gate rivers
```

## E. 51 ülkenin objeleri (her ülkeye iki ikonik obje; 17 pafta)

Her obje tepeden, hafif 3/4 derinlikle, yaklaşık 300–420 px, sevimli ve tanınır; yazı ve bayrak yok.

### R25: ülke objeleri: Türkiye, Ukrayna, Polonya

```
Sheet R25: iconic landmark objects of countries for a TOP-DOWN map, TRANSPARENT background, grid 3 x 2 (cells in this order):
1. Türkiye (TR): peri bacaları
2. Türkiye (TR): lale bahçesi
3. Ukrayna (UA): ayçiçeği tarlası
4. Ukrayna (UA): saman çatılı beyaz ev
5. Polonya (PL): Wawel ejderi
6. Polonya (PL): leylek yuvaları
```

### R26: ülke objeleri: Almanya, Birleşik Krallık, Fransa

```
Sheet R26: iconic landmark objects of countries for a TOP-DOWN map, TRANSPARENT background, grid 3 x 2 (cells in this order):
1. Almanya (DE): guguklu saat evi
2. Almanya (DE): yarım ahşap evler
3. Birleşik Krallık (GB): kırmızı telefon kulübeleri
4. Birleşik Krallık (GB): saat kulesi
5. Fransa (FR): Eyfel Kulesi
6. Fransa (FR): lavanta tarlası
```

### R27: ülke objeleri: İtalya, İspanya, Fas

```
Sheet R27: iconic landmark objects of countries for a TOP-DOWN map, TRANSPARENT background, grid 3 x 2 (cells in this order):
1. İtalya (IT): Kolezyum
2. İtalya (IT): gondollu kanal iskelesi
3. İspanya (ES): La Mancha yel değirmenleri
4. İspanya (ES): Elhamra'nın Aslanlı Çeşmesi
5. Fas (MA): Şefşavan'ın mavi sokakları
6. Fas (MA): fenerli çarşı tezgâhı
```

### R28: ülke objeleri: Cezayir, Fildişi Sahili, Gana

```
Sheet R28: iconic landmark objects of countries for a TOP-DOWN map, TRANSPARENT background, grid 3 x 2 (cells in this order):
1. Cezayir (DZ): Sahra kumulları
2. Cezayir (DZ): Tassili n'Ajjer kaya kemerleri
3. Fildişi Sahili (CI): kakao bahçesi
4. Fildişi Sahili (CI): fil ailesi
5. Gana (GH): kente dokuma tezgâhı
6. Gana (GH): Kakum kanopi köprüsü
```

### R29: ülke objeleri: Nijerya, Kongo DC, Angola

```
Sheet R29: iconic landmark objects of countries for a TOP-DOWN map, TRANSPARENT background, grid 3 x 2 (cells in this order):
1. Nijerya (NG): Zuma Kayası
2. Nijerya (NG): konuşan davullar
3. Kongo DC (CD): okapi ormanı
4. Kongo DC (CD): Kongo Nehri pirogları
5. Angola (AO): Kalandula Şelalesi
6. Angola (AO): welwitschia bitkisi
```

### R30: ülke objeleri: Güney Afrika, Mozambik, Madagaskar

```
Sheet R30: iconic landmark objects of countries for a TOP-DOWN map, TRANSPARENT background, grid 3 x 2 (cells in this order):
1. Güney Afrika (ZA): Masa Dağı
2. Güney Afrika (ZA): Afrika penguenleri
3. Mozambik (MZ): dau yelkenlileri
4. Mozambik (MZ): kaju ağaçları
5. Madagaskar (MG): Baobab Caddesi
6. Madagaskar (MG): lemurlar
```

### R31: ülke objeleri: Tanzanya, Uganda, Kenya

```
Sheet R31: iconic landmark objects of countries for a TOP-DOWN map, TRANSPARENT background, grid 3 x 2 (cells in this order):
1. Tanzanya (TZ): Kilimanjaro
2. Tanzanya (TZ): Zanzibar oyma kapıları
3. Uganda (UG): dağ gorilleri
4. Uganda (UG): Murchison Şelalesi
5. Kenya (KE): zürafalar ve akasya
6. Kenya (KE): flamingolu göl
```

### R32: ülke objeleri: Etiyopya, Sudan, Mısır

```
Sheet R32: iconic landmark objects of countries for a TOP-DOWN map, TRANSPARENT background, grid 3 x 2 (cells in this order):
1. Etiyopya (ET): Aksum dikili taşları
2. Etiyopya (ET): gelada maymunları
3. Sudan (SD): Meroe piramitleri
4. Sudan (SD): deve pazarı
5. Mısır (EG): Gize piramitleri ve Sfenks
6. Mısır (EG): Nil'de feluka yelkenlileri
```

### R33: ülke objeleri: Yemen, Suudi Arabistan, Filistin

```
Sheet R33: iconic landmark objects of countries for a TOP-DOWN map, TRANSPARENT background, grid 3 x 2 (cells in this order):
1. Yemen (YE): Sokotra ejder kanı ağaçları
2. Yemen (YE): Sana'a kule evleri
3. Suudi Arabistan (SA): hurma bahçesi
4. Suudi Arabistan (SA): AlUla Fil Kayası
5. Filistin (PS): zeytin bahçesi
6. Filistin (PS): Hayat Ağacı mozaiği
```

### R34: ülke objeleri: Irak, İran, Özbekistan

```
Sheet R34: iconic landmark objects of countries for a TOP-DOWN map, TRANSPARENT background, grid 3 x 2 (cells in this order):
1. Irak (IQ): kamış mudhif evleri
2. Irak (IQ): şenaşil ahşap balkonlar
3. İran (IR): Siose Pol köprüsü
4. İran (IR): Yezd rüzgâr kuleleri
5. Özbekistan (UZ): İpek Yolu kervanı
6. Özbekistan (UZ): kavun pazarı
```

### R35: ülke objeleri: Afganistan, Pakistan, Hindistan

```
Sheet R35: iconic landmark objects of countries for a TOP-DOWN map, TRANSPARENT background, grid 3 x 2 (cells in this order):
1. Afganistan (AF): uçurtmalı tepe
2. Afganistan (AF): nar bahçesi
3. Pakistan (PK): süslü kamyonlar
4. Pakistan (PK): Hunza kayısı bahçesi
5. Hindistan (IN): Hawa Mahal
6. Hindistan (IN): lotus göleti ve tavus kuşları
```

### R36: ülke objeleri: Bangladeş, Myanmar, Tayland

```
Sheet R36: iconic landmark objects of countries for a TOP-DOWN map, TRANSPARENT background, grid 3 x 2 (cells in this order):
1. Bangladeş (BD): süslü rikşalar
2. Bangladeş (BD): Sundarbans ve Bengal kaplanı
3. Myanmar (MM): Inle Gölü balıkçıları
4. Myanmar (MM): Pathein şemsiyeleri
5. Tayland (TH): yüzen pazar
6. Tayland (TH): tuk-tuk
```

### R37: ülke objeleri: Malezya, Endonezya, Filipinler

```
Sheet R37: iconic landmark objects of countries for a TOP-DOWN map, TRANSPARENT background, grid 3 x 2 (cells in this order):
1. Malezya (MY): Petronas İkiz Kuleleri
2. Malezya (MY): Rafflesia çiçeği
3. Endonezya (ID): Komodo ejderleri
4. Endonezya (ID): pirinç terasları
5. Filipinler (PH): Çikolata Tepeleri
6. Filipinler (PH): jeepney
```

### R38: ülke objeleri: Vietnam, Çin, Güney Kore

```
Sheet R38: iconic landmark objects of countries for a TOP-DOWN map, TRANSPARENT background, grid 3 x 2 (cells in this order):
1. Vietnam (VN): Ha Long Körfezi
2. Vietnam (VN): Hoi An fenerleri
3. Çin (CN): pandalar ve bambu
4. Çin (CN): ejder dansı
5. Güney Kore (KR): hanok evleri
6. Güney Kore (KR): kimçi küpleri
```

### R39: ülke objeleri: Japonya, Rusya, Kanada

```
Sheet R39: iconic landmark objects of countries for a TOP-DOWN map, TRANSPARENT background, grid 3 x 2 (cells in this order):
1. Japonya (JP): kiraz ağaçları
2. Japonya (JP): Fuji Dağı
3. Rusya (RU): matruşka bebekleri
4. Rusya (RU): oymalı ahşap izba
5. Kanada (CA): akçaağaç ormanı ve şurup
6. Kanada (CA): kunduz barajı
```

### R40: ülke objeleri: ABD, Meksika, Kolombiya

```
Sheet R40: iconic landmark objects of countries for a TOP-DOWN map, TRANSPARENT background, grid 3 x 2 (cells in this order):
1. ABD (US): Özgürlük Heykeli
2. ABD (US): Büyük Kanyon
3. Meksika (MX): papel picado süslü pazar
4. Meksika (MX): ajolote göleti
5. Kolombiya (CO): Kokora mum palmiyeleri
6. Kolombiya (CO): Cartagena'nın balkonlu evleri
```

### R41: ülke objeleri: Peru, Brezilya, Arjantin

```
Sheet R41: iconic landmark objects of countries for a TOP-DOWN map, TRANSPARENT background, grid 3 x 2 (cells in this order):
1. Peru (PE): Machu Picchu terasları
2. Peru (PE): lamalar
3. Brezilya (BR): Amazon tukanları ve araları
4. Brezilya (BR): Şeker Somunu Dağı
5. Arjantin (AR): Perito Moreno Buzulu
6. Arjantin (AR): Caminito'nun renkli evleri
```

## F. Yolculuk, Dünya Turu ve arayüz parçaları

### R42: dere, şelale, yağmur

```
Sheet R42: TRANSPARENT unless noted, grid 3 x 2:
1-3. a small waterfall step across a stream seen from above: white foam band with spray, 3 animation frames
4. a single slanted rain streak and a tiny splash ring (two small pieces side by side)
5. water ripple rings when something falls into water (3 rings, flat)
6. OPAQUE: a seamless vertical stream water texture (turquoise-blue, soft highlights)
```

### R43: Dünya Turu: damga, uçak, rota simgeleri

```
Sheet R43: TRANSPARENT, grid 3 x 2:
1. an empty passport ink-stamp frame (round-rect, dashed ink border, slightly rotated, no letters)
2. a cute cartoon airplane, side view
3. the same airplane seen from above
4. a small padlock icon (locked country)
5. a small airplane icon (current country)
6. a small passport-with-stamp icon (visited)
```

### R44: oyun arayüzü parçaları

```
Sheet R44: TRANSPARENT, grid 3 x 2:
1. a joystick base: a translucent round pad with a soft rim
2. a joystick knob: a shiny golden ball
3. the game title emblem: a cute white ghost holding a tiny lantern (no letters)
4. a small parchment scroll icon (story narrator)
5. an empty notebook slot icon (a faint question-mark-free dotted card)
6. a power star icon with a soft glow
```

### R45: ekran arka planı 1 (dikey, opak)

```
Illustration R45 (one PNG 1024 x 1536, OPAQUE): a cozy night-sky background for menu screens (shop, characters, account):
deep purple-blue gradient sky, soft stars, a few distant friendly ghosts, gentle hills at the bottom; calm and low-contrast so
buttons and text stay readable; no text.
```

### R46: ekran arka planı 2 (dikey, opak)

```
Illustration R46 (one PNG 1024 x 1536, OPAQUE): a background for online/friends/rooms screens: a twilight town skyline with
warm windows, floating lanterns, a few friendly ghosts waving; low contrast; no text.
```

## G. Eğlenceli giriş ekranı (kullanıcı istedi: "Oyun giriş arayüzünü de çok eğlenceli bir hale getir ChatGPT ile")

### R47: giriş ekranı sahnesi

```
Sheet R47: main menu pieces, TRANSPARENT, grid 3 x 2:
1. a big playful game crest/emblem: a round shield with a cute ghost and two crossed glowing blasters, stars around (NO letters —
   the title text is added by the game in six languages)
2. a glowing round stage pedestal for the selected hunter (top surface seen at 3/4, soft golden rim light, a few sparkles)
3. a spotlight cone of warm light from above (soft, semi-transparent)
4. a big candy-style PLAY button background: rounded pill, glossy green, thick darker green bottom edge, no text, no icon
5. the same pill in glossy purple
6. the same pill in glossy orange
```

### R48: uçuşan menü hayaletleri ve gökyüzü canlıları (6 kare + parçalar)

```
Sheet R48: TRANSPARENT, grid 3 x 2:
1-3. a cute white ghost flying and waving, 3 animation frames (same size and centre)
4. a shooting star with a sparkly tail
5. a tiny cute bat flapping (wings up)
6. a glowing magic lantern floating
```

### R49: ekstra parlatıcılar

```
Sheet R49: TRANSPARENT, grid 3 x 2:
1. a glossy teal pill button background (same shape as R47 cell 4)
2. a small dark glass pill (for secondary buttons: account, sound, language)
3. a coin counter frame (dark rounded pill with a golden rim)
4. a confetti burst (colourful pieces) for celebrations
5. a sparkle cluster (three four-point stars)
6. a cute ghost peeking from the bottom edge of the screen (only the top half of the ghost, waving)
```

## H. Bölüm geçişi kutlaması (kullanıcı istedi: "bölüm geçişlerine eğlenceli bir şey koy, bir kutlama olsun")

### R50: kutlama ve geçit

```
Sheet R50: TRANSPARENT, grid 3 x 2, cute premium casual style:
1. a victory ribbon banner (golden ribbon with two small stars, EMPTY middle area for text — no letters)
2-4. a firework burst, 3 animation frames (small spark → big colourful burst → fading glitter), same centre and size
5. a glowing magic travel portal seen from above at a slight 3/4 angle: a swirling violet-gold ring standing on the ground
6. the same portal fully open, brighter, with sparkles flying out
```
