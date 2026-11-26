# Hayalet Avcıları: zemin süsleri ve yollar için ChatGPT istem paketi (Z01–Z04)

Hazırlandı: 26 Kasım 2026. Kullanıcının isteği: *"ekrana yerleşen donatılar zemin ile uyum içinde olsun, kenarlarda çimenler
kayalarla, hatta zeminde yollar olmalı, binalar arasında geçiş yolları vs. ... tüm harita zemini tek olmak zorunda değil, harita
zeminlerini daha çevre ile uyumlu hale getirelim"*.

Bu paket haritaya ikinci bir "zemin katmanı" için parçalar ürettirir: yol dokuları, alan lekeleri için ikinci zemin dokuları,
engellerin ve donatıların dibine konacak çimen, kaya, çiçek öbekleri ve basamak taşları. Kodu Evren yazar (ZEM1); resim gelmezse
oyun kod çizimiyle çalışır.

## Yerel Claude için iş sırası

1. Aynı ChatGPT sohbetinde (ya da yeni sohbette önce `CHATGPT-ISTEMI-YOLCULUK.md` › **ANA İSTEM**) devam et.
2. Üslup referansı olarak `hamui/U06.png` ve `ham3d/D01.png` ekle.
3. Her resmi `gorsel/hamzemin/<KOD>.png` olarak kaydet (Z01 … Z04). Her paftadan sonra commit ve push yap, ilerlemeyi
   `gorsel/hamzemin/DURUM.md`'ye yaz.
4. Z01'i kullanıcıya göster; onay gelince Z02, Z03 ve Z04.

Z04 (26 Kasım 2026, kullanıcı: *"yollar tamamen kaotik, patika yollar gibi olmalı, düzgün kenarı olmamalı, kıyılarında taşlar,
çimenler ... bazen ayrımlarda tabela gibi şeyler de olabilir"*): tabelalar ve patika kenarı süsleri. Tabelalarda yazı yok.

Ortak kurallar: 1536 × 1024 PNG, 3 × 2 ızgara (512 px hücre), TEPEDEN görünüm, yazı/harf/rakam yok. Zemin parçaları **sakin ve
düşük kontrastlı** olmalı (karakterler ve hayaletler üstünde net seçilsin), parlak değil orta-koyu tonlarda.

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

## Kesim (bulut Claude)

`araclar/gorsel_kes.py --ek Z01 Z02 Z03 Z04`: Z01 opak dokular (`zemin-yol-toprak`, `zemin-yol-tas`, `zemin-cimen`, `zemin-kuru`,
`zemin-kum`, `zemin-yosunlu-tas`), Z02 ve Z03 saydam süsler (`sus-cimen`, `sus-kaya`, `sus-cicek`, `sus-cimen-serit`,
`sus-cakil`, `sus-yaprak`, `sus-basamak`, `sus-tahta-yol`, `sus-su-birikintisi`, `sus-yosun`, `sus-cali`, `sus-mantar`), Z04 patika süsleri (`tabela-1`, `tabela-2`, `tabela-tas`, `sus-yol-taslari`,
`sus-toprak-leke`, `sus-uzun-cimen`).
