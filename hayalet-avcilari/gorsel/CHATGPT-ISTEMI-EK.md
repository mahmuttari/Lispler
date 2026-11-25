# Hayalet Avcıları: yeni efektler ve dere süsleri için ChatGPT istem paketi (K01–K03)

Hazırlandı: 25 Kasım 2026. Kullanıcının isteği: *"Görseller için ChatGPT kullan"*. Bu paket, son eklenen özelliklerin görsellerini
ürettirir:
- hayaletlerin çıktığı yuvalar (mezarlık, mağara, izbe ev…);
- yıldırım çarpma efekti (avcıya yıldırım düşünce);
- kıvrımlı derelerin kıyı süsleri;
- fırtına bulutu çeşitleri ve yıldırım çizgileri.

Kodu Evren yazar. Resim gelmezse oyun bugünkü kod çizimiyle çalışır: efekt `animHazir("carpilma")` ile denetlenir, resim yoksa
kod çizimine düşer.

## Yerel Claude için iş sırası

1. ChatGPT'de **yeni bir sohbet** aç ve `CHATGPT-ISTEMI-YOLCULUK.md`'deki **ANA İSTEM**'i bir kez gönder (aynı üslup).
2. Her paftaya üslup referansı olarak `hamui/U06.png` ve `ham3d/D01.png` ekle.
3. Her resmi `gorsel/hamek/<KOD>.png` olarak kaydet (K01 … K11). Her paftadan sonra commit ve push yap, ilerlemeyi
   `gorsel/hamek/DURUM.md`'ye yaz.
4. Paftaları birlikte kullanıcıya göster.
5. Giriş, şifre, ödeme ve ChatGPT'nin görsel sınırı kullanıcıya bırakılır. Oyun koduna dokunma.

Kesim: `araclar/gorsel_kes.py`. Adlar:
- K01 → `an-carpilma-1` … `an-carpilma-6`;
- K02 → `dere-sus-1` … `dere-sus-6`;
- K03 → `bulut-2`, `bulut-3`, `bulut-4`, `simsek-1`, `simsek-2`, `simsek-3`;
- K04 → `yuva-mezarlik`, `yuva-magara`, `yuva-izbe`, `yuva-kovuk`, `yuva-kuyu`, `yuva-kripta`;
- K05 → `kopru-kapali`, `an-kopru-in-1`, `an-kopru-in-2`, `kopru-acik`, `kilit`, `kilit-acik`;
- K06 → `donati-fici`, `donati-sandik`, `donati-fener`, `donati-bank`, `donati-tabela`, `donati-saman`;
- K07 → `donati-cali`, `donati-ciceklik`, `donati-mantar`, `donati-kutuk`, `donati-tas`, `donati-yaprak`;
- K08 → `donati-balkabagi`, `donati-araba`, `donati-cit`, `donati-korkuluk`, `donati-mum`, `donati-orumcek`;
- K09 → `yakinda-pamukkale` (tek resim, opak);
- K10 → `silah-yildiz`, `silah-ejder`, `silah-gokkusagi`, `an-mermi-yildiz-1..3` (4-6. hücre);
- K11 → `an-efsane-aura-1..3` (1-3), `efsane-rozet`, `efsane-sandik`, `efsane-parilti`.

## K01: yıldırım çarpma (6 kare, döngü)

```
Animation sheet K01 (6 frames, grid 3 x 2, TRANSPARENT background): a cute cartoon "electrocuted" effect that is drawn ON TOP of a
small character (the character itself is NOT drawn; leave the middle of each cell empty, about 40% of the cell). Around the empty
middle: a bright cyan-white electric glow ring and 4-6 small jagged lightning sparks that crackle outward. Frame 1: thin ring, few
sparks. Frames 2-4: the ring pulses bigger and brighter, sparks jump to different positions in every frame. Frames 5-6: ring fades,
2-3 tiny sparks and small grey smoke puffs drift up. Same size and centre in every cell. Funny, not scary; no skeleton.
```

## K02: dere kıyısı süsleri (6 parça)

```
Sheet K02: small decorations placed along the banks of a winding stream, seen from DIRECTLY ABOVE, TRANSPARENT background, grid 3 x 2,
each about 120-180 px wide inside its cell:
1. a clump of green reeds/cattails
2. three floating lily pads, one with a small pink flower
3. a cluster of smooth round pebbles (grey and sand colours)
4. a mossy rock with a tiny splash ring of water at its base
5. a short piece of driftwood with a little mushroom
6. a small patch of wildflowers (yellow and white) with grass
```

## K03: fırtına bulutu çeşitleri ve yıldırım çizgileri

```
Sheet K03: storm pieces for the sky layer, TRANSPARENT background, grid 3 x 2.
Cells 1-3: three different cute dark-lilac storm clouds seen slightly from below (puffy, rounded, a soft face is NOT needed),
  1: wide and flat, 2: round and tall, 3: small and stretched with a few rain streaks under it. Same style as a premium casual game.
Cells 4-6: three vertical cartoon lightning bolts (bright yellow-white core, soft cyan glow), each a different zig-zag shape, top
  thicker than the bottom, filling the cell height. No background, no ground.
```

## K04: hayalet yuvaları (hayaletlerin çıktığı yerler)

```
Sheet K04: places where friendly ghosts come out, for a TOP-DOWN map (seen from above with a slight 3/4 tilt so fronts are readable),
TRANSPARENT background, grid 3 x 2, each object about 300-380 px wide inside its cell, cute and spooky-but-friendly (not scary):
1. a small graveyard: 3-4 rounded tombstones, a broken little wooden fence, tufts of grass, a faint lilac mist
2. a cave mouth in a mossy rock mound, dark inside, a few glowing dots (eyes of tiny ghosts) in the dark
3. an abandoned crooked little house: broken roof, boarded window, dark open door, cobweb
4. a hollow dead tree with a big dark hole at the bottom, twisted branches, a crow-shaped silhouette is NOT needed
5. an old stone well with a broken wooden roof and a bucket, faint mist rising from it
6. a small stone crypt / mausoleum with a cracked door slightly open, two little lanterns
No text, no crosses or religious symbols on tombstones (use simple rounded stones with cracks or a tiny ghost carving).
```

## K05: kilitli köprü ve açılışı

Kullanıcı (25 Kasım 2026): *"Kilitli köprü görüntüsünü de ChatGPT'ye yaptır."* Bütün temalarda kullanılacak ortak, tahta asma köprü.

```
Sheet K05: a wooden rope DRAWBRIDGE over a river gap, seen from DIRECTLY ABOVE (top-down, slight depth on raised parts), spanning
LEFT to RIGHT, TRANSPARENT background (no water, no ground: only the bridge pieces), grid 3 x 2, same bridge size and position in
cells 1-4 (about 440 px long, 150 px wide when lying flat):
1. CLOSED: the bridge deck raised up on the left bank like a drawbridge (planks tilted up toward the viewer, two iron chains pulling
   it), a soft glowing golden barrier line across the gap and a big shiny golden padlock hanging in the middle
2. LOWERING frame 1: the padlock is gone, the deck is half-way down (tilted 45°), chains loosening, a few sparkles
3. LOWERING frame 2: the deck almost flat, small dust puffs at the far end
4. OPEN: the bridge lying flat across the gap, wooden planks, rope rails with wooden posts at both ends
5. a big golden padlock alone (closed), glowing softly — used as a small icon
6. the same padlock popped open with sparkles — the unlock moment
Cute premium casual style, warm wood, no text.
```

## K06–K08: harita donatıları

Kullanıcı (25 Kasım 2026): *"Haritadaki donatıları artıralım, görselleri ChatGPT yapsın."* Bölgelere serpiştirilecek küçük süs ve
engel parçaları; bütün temalarda kullanılabilecek nötr renklerde (kod temaya göre hafif renk tonu verebilir).

```
Sheet K06: village props for a TOP-DOWN map (seen from above with a slight 3/4 tilt so fronts are readable), TRANSPARENT background,
grid 3 x 2, each object 220-320 px inside its cell, cute premium casual style, warm materials, soft contact shadow under each object:
1. an old wooden barrel with metal hoops
2. a stack of two wooden crates
3. an old iron street lantern on a post, warm light glowing
4. a small wooden park bench
5. a crooked wooden signpost with two arrow boards (no writing)
6. a round haystack with a pitchfork leaning on it
```

```
Sheet K07: nature props, same view and style, TRANSPARENT background, grid 3 x 2:
1. a round leafy bush
2. a flowering shrub with small pink and white flowers
3. a cluster of three red-capped mushrooms with white dots
4. a tree stump with rings and a little sprout
5. a pile of three mossy rocks
6. a scattered patch of autumn leaves (flat on the ground)
```

```
Sheet K08: friendly-spooky props, same view and style, TRANSPARENT background, grid 3 x 2, cute not scary:
1. a carved pumpkin with a gentle smile, soft glow inside
2. an old broken wooden cart with one wheel off
3. a short piece of old crooked wooden fence
4. a friendly scarecrow with a patched hat
5. a cluster of three melting candles on a small stone, warm flames
6. a corner cobweb with a tiny cute spider (flat on the ground, semi-transparent web)
```

## K09: "Yakında" — yeni tema önizlemesi: Pamukkale

Kullanıcı (25 Kasım 2026): *"Farklı temalar hazırlanacağını belirtelim; bütün bölümler bitince 'Yakında' yazsın, o bölümün önizlemesi;
dünyadaki ikonik yerleri betimleyeceğiz, birini koy, mesela Pamukkale."*

```
Illustration K09 (one PNG, 1536 x 1024, opaque): a preview of the next game world "Pamukkale" in the same stylized 3D premium casual
style, seen from a high 3/4 top-down angle like the game map: dazzling white travertine terraces stepping down a hillside, each
terrace a shallow pool of turquoise water, little waterfalls between them, the ancient ruins of Hierapolis (columns, a small
amphitheatre) at the top, warm golden late-afternoon light, a few cute white ghosts floating curiously above the pools, a winding
path for the hunters. No people, no text, no flags.
```

## K10: efsane silahlar

```
Sheet K10: LEGENDARY weapons for the hunters, same style as the approved weapon sheets, TRANSPARENT background, grid 3 x 2, each weapon
300-380 px long, side view, glowing, clearly more precious than normal weapons (gold trim, gems, soft aura):
1. "Star Blaster": a golden blaster with a glowing star-shaped crystal at the muzzle
2. "Dragon Breath": a friendly dragon-head shaped flamethrower in red-gold, small flames at the mouth
3. "Rainbow Beam": a sleek white-and-pearl ray gun with a rainbow crystal core
4-6. projectile animation (3 frames) of a spinning golden star bullet with a short sparkle trail, same size in each cell
```

## K11: efsane parıltı ve rozetler

```
Sheet K11: LEGENDARY cosmetics, TRANSPARENT background, grid 3 x 2:
1-3. a looping aura animation (3 frames) drawn around an EMPTY middle (the character is not drawn): soft golden-violet glow ring on the
     ground with rising sparkles and small floating stars, slightly different in each frame, same size and centre
4. a "LEGENDARY" badge: a golden shield with a purple gem and laurel leaves (no letters)
5. a legendary treasure chest, half open, golden light and gems spilling out
6. a big four-pointed sparkle burst (purchase celebration)
```
