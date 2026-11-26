# Hayalet Avcıları: zemin süsleri ve yollar için ChatGPT istem paketi (Z01–Z03)

Hazırlandı: 26 Kasım 2026. Kullanıcının isteği: *"ekrana yerleşen donatılar zemin ile uyum içinde olsun, kenarlarda çimenler
kayalarla, hatta zeminde yollar olmalı, binalar arasında geçiş yolları vs. ... tüm harita zemini tek olmak zorunda değil, harita
zeminlerini daha çevre ile uyumlu hale getirelim"*.

Bu paket haritaya ikinci bir "zemin katmanı" için parçalar ürettirir: yol dokuları, alan lekeleri için ikinci zemin dokuları,
engellerin ve donatıların dibine konacak çimen, kaya, çiçek öbekleri ve basamak taşları. Kodu Evren yazar (ZEM1); resim gelmezse
oyun kod çizimiyle çalışır.

## Yerel Claude için iş sırası

1. Aynı ChatGPT sohbetinde (ya da yeni sohbette önce `CHATGPT-ISTEMI-YOLCULUK.md` › **ANA İSTEM**) devam et.
2. Üslup referansı olarak `hamui/U06.png` ve `ham3d/D01.png` ekle.
3. Her resmi `gorsel/hamzemin/<KOD>.png` olarak kaydet (Z01 … Z03). Her paftadan sonra commit ve push yap, ilerlemeyi
   `gorsel/hamzemin/DURUM.md`'ye yaz.
4. Z01'i kullanıcıya göster; onay gelince Z02 ve Z03.

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

## Kesim (bulut Claude)

`araclar/gorsel_kes.py --ek Z01 Z02 Z03`: Z01 opak dokular (`zemin-yol-toprak`, `zemin-yol-tas`, `zemin-cimen`, `zemin-kuru`,
`zemin-kum`, `zemin-yosunlu-tas`), Z02 ve Z03 saydam süsler (`sus-cimen`, `sus-kaya`, `sus-cicek`, `sus-cimen-serit`,
`sus-cakil`, `sus-yaprak`, `sus-basamak`, `sus-tahta-yol`, `sus-su-birikintisi`, `sus-yosun`, `sus-cali`, `sus-mantar`).
