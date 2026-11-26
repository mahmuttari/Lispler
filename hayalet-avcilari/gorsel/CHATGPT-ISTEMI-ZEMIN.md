# Hayalet Avcıları: zemin süsleri ve yollar için ChatGPT istem paketi (Z01–Z07)

Hazırlandı: 26 Kasım 2026. Kullanıcının isteği: *"ekrana yerleşen donatılar zemin ile uyum içinde olsun, kenarlarda çimenler
kayalarla, hatta zeminde yollar olmalı, binalar arasında geçiş yolları vs. ... tüm harita zemini tek olmak zorunda değil, harita
zeminlerini daha çevre ile uyumlu hale getirelim"*.

Bu paket haritaya ikinci bir "zemin katmanı" için parçalar ürettirir: yol dokuları, alan lekeleri için ikinci zemin dokuları,
engellerin ve donatıların dibine konacak çimen, kaya, çiçek öbekleri ve basamak taşları. Kodu Evren yazar (ZEM1); resim gelmezse
oyun kod çizimiyle çalışır.

## Yerel Claude için iş sırası

1. Aynı ChatGPT sohbetinde (ya da yeni sohbette önce `CHATGPT-ISTEMI-YOLCULUK.md` › **ANA İSTEM**) devam et.
2. Üslup referansı olarak `hamui/U06.png` ve `ham3d/D01.png` ekle.
3. Her resmi `gorsel/hamzemin/<KOD>.png` olarak kaydet (Z01 … Z07). Her paftadan sonra commit ve push yap, ilerlemeyi
   `gorsel/hamzemin/DURUM.md`'ye yaz.
4. Z01'i kullanıcıya göster; onay gelince Z02–Z07. Her paftanın başına aşağıdaki **Üslup** bloğunu ekle.

Z04 (26 Kasım 2026, kullanıcı: *"yollar tamamen kaotik, patika yollar gibi olmalı, düzgün kenarı olmamalı, kıyılarında taşlar,
çimenler ... bazen ayrımlarda tabela gibi şeyler de olabilir"*): tabelalar ve patika kenarı süsleri. Tabelalarda yazı yok.

Ortak kurallar: 1536 × 1024 PNG, 3 × 2 ızgara (512 px hücre), TEPEDEN görünüm, yazı/harf/rakam yok. Zemin parçaları **sakin ve
düşük kontrastlı** olmalı (karakterler ve hayaletler üstünde net seçilsin), parlak değil orta-koyu tonlarda.

## Üslup (26 Kasım 2026, kullanıcı: "zemin görsellerini Diablo 2 gibi yapabilirsin ... her şey belli bir açı ile ... yürürken
sanki 3 boyutlu bir yerde yürüyormuş gibi hissettirir ... patikalar, çimler aynı tarzı kullanabilirsin")

Bir oyunun kendi çizimi kopyalanmaz; türün genel üslubu alınır: önceden işlenmiş (pre-rendered) görünümlü, el boyaması, yüksek
üç çeyrek açıdan bakılan, ışığı resme işlenmiş, ayrıntılı ve hafif yıpranmış zemin. İstemde hiçbir oyunun adı geçmez. Aşağıdaki
blok Z01–Z07'nin her birinin başına eklenir:

```
STYLE FOR THIS SHEET: the pre-rendered, hand-painted look of a classic isometric action-RPG. Ground seen from a high three-quarter
angle (about 50° looking down), so stones, roots and grass clumps show a little of their side and feel 3D. One soft light from the
UPPER LEFT is baked into everything: lit top-left faces, soft shadows falling to the lower right, ambient occlusion in cracks and
joints. Rich fine detail, muted natural earthy palette (moss green, umber, ochre, slate grey), weathered and slightly gritty.
NOT flat cartoon, NOT glossy, NOT horror or gore: friendly cartoon characters must still look good on top and stay readable.
Do not copy any existing game's artwork; original art only.
```

## Paftalar

Izgara 3 × 2; üst satır soldan sağa 1-2-3, alt satır 4-5-6.

```
Sheet Z01: OPAQUE seamless ground tiles, grid 3 x 2, each cell a square tile that repeats on ALL sides without seams, seen from
directly above, calm and LOW CONTRAST, medium-dark tones (characters must stay readable on top):
1. a packed dirt footpath texture with a few tiny pebbles (warm brown)
2. a cobblestone path texture (rounded grey-brown stones, soft mortar)
3. a lush short grass meadow texture (soft green, tiny clover)
4. a dry earth texture with faint cracks and sparse dry grass
5. a fine sand texture with very soft ripples
6. a mossy dark flagstone texture (purple-grey stone with moss in the joints, for castle themes)
```

```
Sheet Z02: TRANSPARENT background, grid 3 x 2, ground edge decorations seen from above (slight 3/4 depth), each 200-360 px:
1. a cluster of grass tufts (3-5 tufts, soft green)
2. a small cluster of mossy rocks with a little grass
3. a clump of tiny wildflowers in grass (white, yellow, pink)
4. a horizontal grass edge strip (grass blades along a line, seamless left-right, about 440 x 90 px)
5. a scatter of small pebbles
6. a patch of fallen autumn leaves
```

```
Sheet Z03: TRANSPARENT background, grid 3 x 2, path and ground details seen from above, each 200-360 px:
1. three flat stepping stones in a vertical row
2. a short wooden plank walkway, vertical, seamless top-to-bottom
3. a small dark puddle with a soft reflection
4. a soft moss patch with tiny sprouts
5. a small round bush
6. a tiny cluster of three small mushrooms
```

```
Sheet Z04: TRANSPARENT background, grid 3 x 2, footpath details seen from above (slight 3/4 depth so posts read as upright),
rustic and hand-made, NO letters, NO numbers, NO symbols on any sign, each 200-380 px:
1. a weathered wooden signpost with two blank arrow-shaped boards pointing left and right, small grass tuft at its foot
2. a crooked wooden signpost with one blank arrow board and a tiny hanging lantern
3. a small mossy stone waymarker (rounded standing stone) with a few pebbles around it
4. a loose row of flat path-side stones half sunk in dirt with grass between them (horizontal, about 340 x 110 px)
5. a small irregular patch of crumbly packed dirt with ragged, broken edges (no hard outline)
6. a clump of tall wild grass with two small stones
```

```
Sheet Z05: OPAQUE seamless ground tiles (repeat on ALL sides), grid 3 x 2, the base floor of six game worlds, calm enough to play on:
1. a purple-grey castle courtyard of worn flagstones with moss in the joints
2. a forest floor of dark soil, short grass, fallen leaves and small roots
3. desert ground of packed ochre sand with scattered small stones
4. icy ground: blue-white packed snow over dark ice with a few frozen pebbles
5. volcanic ground: dark ash and basalt cobbles with faint warm cracks (no bright lava)
6. alien ground: smooth dark violet-grey rock with tiny pale crystals
```

```
Sheet Z06: OPAQUE seamless ground tiles (repeat on ALL sides), grid 3 x 2, regional ground for a world tour, calm enough to play on:
1. temperate meadow ground: green grass with clover and a few earthy bare spots
2. rocky hillside ground: grey-brown stony soil with tufts of grass
3. dry steppe ground: yellow-brown dry grass and cracked earth
4. hot desert ground: pale fine sand with soft ripples and a few stones
5. savanna ground: reddish earth with sparse dry grass clumps
6. tropical ground: dark red-brown soil with moss and small ferns
```

```
Sheet Z07: OPAQUE seamless ground tiles (repeat on ALL sides), grid 3 x 2:
1. lush humid ground: deep green moss and grass with small puddle-free wet stones
2. mountain ground: dark slate rock with lichen and thin grass
3. cold northern ground: frosty grass and grey stones
4. rice-terrace style wet green ground with short grass (no water surface)
5. dark forest floor with roots, needles and moss
6. cracked old stone pavement with grass growing in the cracks
```

## Kesim (bulut Claude)

`araclar/gorsel_kes.py --ek Z01 Z02 Z03 Z04 Z05 Z06 Z07`: Z01 opak dokular (`zemin-yol-toprak`, `zemin-yol-tas`, `zemin-cimen`, `zemin-kuru`,
`zemin-kum`, `zemin-yosunlu-tas`), Z02 ve Z03 saydam süsler (`sus-cimen`, `sus-kaya`, `sus-cicek`, `sus-cimen-serit`,
`sus-cakil`, `sus-yaprak`, `sus-basamak`, `sus-tahta-yol`, `sus-su-birikintisi`, `sus-yosun`, `sus-cali`, `sus-mantar`), Z04 patika süsleri (`tabela-1`, `tabela-2`, `tabela-tas`, `sus-yol-taslari`,
`sus-toprak-leke`, `sus-uzun-cimen`). Z05 tema zeminleri (`tema1-zemin` … `tema6-zemin`), Z06–Z07 Dünya Turu aile
zeminleri (Z06: K, KS, KP, SH, SV, GA; Z07: GDA, DA, KA, LA, sonra `zemin-orman`, `zemin-catlak-tas`). Z05–Z07 diskte varsa
eski kaynakların (tema paftaları, R23/R24) aynı adlı zeminlerinin yerine geçer.
