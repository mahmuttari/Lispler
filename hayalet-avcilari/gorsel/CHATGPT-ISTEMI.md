# Hayalet Avcıları — ChatGPT ile görsel yenileme istem paketi

Hazırlandı: 21 Kasım 2026 (oyun sürümü 3.17.0). Kullanıcının isteği: *"oyunun en güncel halinin görsellerinin tamamını
ChatGPT ile yeniden üretip oyunu güncelleyecek bir promt ver"*.

## Önemli: oyun bugün nasıl çiziliyor

Oyundaki görsellerin neredeyse hepsi **resim dosyası değil, kodla çizilen şekiller** (canvas): karakterler, hayaletler,
petler, engeller, 51 ülkenin objeleri ve boss kıyafetleri. Yalnız uygulama simgesi PNG. Bu yüzden iş iki adım:

1. **ChatGPT görselleri üretir** (bu dosyadaki istemlerle). ChatGPT oyunun koduna dokunamaz.
2. **Görseller oyuna bağlanır** (Claude ya da kod yazabilen bir ajan): paftalar kesilir, WebP'ye çevrilir, her çizim
   işlevi önce resmi kullanır, resim yoksa bugünkü kod çizimine düşer. Böylece görseller parça parça gelse de oyun hiç
   bozulmaz; çevrimiçi oyun etkilenmez (yalnız görüntü).

## Karakterler özgün tasarımdır: aslına sadık kalınır

Kullanıcının notu (21 Kasım 2026): karakterlerin tasarım şekli önemli, ailesinden biri tasarladı; olabildiğince
aslına uygun kalınacak. Bu yüzden:

- K1–K6 paftalarında ChatGPT **yeniden tasarlamaz, yalnız temizler**. Oranlar, şekiller (yuvarlak baş, köşeli gövde ve
  kollar, nokta gözler, gülümseme), saç biçimi, renkler, kıyafet ve elindeki silah referanstakiyle birebir aynı kalır.
  Yalnız çizgi temizliği, tek tip dış çizgi ve hafif gölge eklenir.
- Gelen her karakter hücresi referansla yan yana karşılaştırılır. Şekli ya da oranı değişmiş hücre **kabul edilmez**,
  yeniden ürettirilir. Claude entegrasyondan önce ayrıca bir karşılaştırma görseli hazırlar, onaylarsanız bağlar.
- İsterseniz karakterler hiç değiştirilmez: kodla çizilen bugünkü karakterler kalır, yalnız öteki görseller yenilenir.
  Karar sizin.

## Kullanım sırası

1. ChatGPT'de yeni bir sohbet aç (görsel üretebilen model). Önce aşağıdaki **ANA İSTEM**'i bir kez yapıştır.
2. Her pafta için pafta istemini gönder. Paftanın referans resmi varsa sohbete ekle:
   `hayalet-avcilari/gorsel/referans/<KOD>-referans.png` (GitHub'da dosyayı açıp "Download raw file").
3. Çıkan resmi pafta koduyla kaydet (`K1.png`, `U07.png` …) ve GitHub'da `hayalet-avcilari/gorsel/ham/` klasörüne
   yükle (Add file › Upload files) ya da Claude'a sohbette ver.
4. Beğenmediğin pafta için "aynı paftayı yeniden üret, şunu düzelt: …" de. Hücre düzeni (3 sütun × 2 satır) bozulursa
   yeniden ürettir; kesme işi bu düzene göre yapılır.
5. Bitince (ya da bir grup bitince) Claude'a **"görseller hazır"** de.

Toplam 45 pafta; ardından 13 animasyon paftası (N01–N13, aşağıda), asıl iş bittikten sonra. ChatGPT'nin günlük görsel sınırı varsa birkaç güne yayılabilir; sıra önemli değil, önce K, H, P ve T
paftaları önerilir (oyunun her bölümünde görünenler).

---

## ANA İSTEM (ChatGPT'ye bir kez, en başta)

```
You are the lead 2D artist for "Ghost Hunters" (Hayalet Avcıları), a top-down mobile arcade game for ages 13+.
I will ask you for SPRITE SHEETS one by one. Follow these rules for EVERY sheet, without exception:

FORMAT
- One PNG, exactly 1536 x 1024 px, with a TRANSPARENT background (alpha), unless the sheet says "opaque".
- A strict grid of 3 columns x 2 rows. Each cell is exactly 512 x 512 px. Cell order: top row left→right = 1, 2, 3;
  bottom row left→right = 4, 5, 6.
- One subject per cell, centered, fully inside its cell with at least 24 px empty margin. Nothing crosses a cell edge.
- Cells marked "(empty)" stay fully transparent.
- Cells marked "seamless tile" are the exception: fill the WHOLE 512 x 512 cell edge to edge, opaque, tileable on all
  four sides, seen straight from above.
- NO text, letters, numbers, labels, logos, watermarks, grid lines or frames anywhere in the image.
- NO ground, NO cast shadow under characters (the game draws its own shadow), NO background scenery behind subjects.

STYLE (identical on all sheets)
- Polished premium casual-mobile 2D art: clean vector-like shapes, soft cel shading with one highlight and one shadow
  tone, a 3–4 px dark outline (#1a1030), saturated but harmonious colors, cute-spooky mood, not babyish.
- Must stay readable when shrunk to 64 px: big simple silhouettes, big heads, clear eyes.
- Camera: top-down game, characters and creatures shown in a 3/4 front view, FACING RIGHT, standing upright.
- Characters: feet at the bottom of the subject, same height for all characters (about 400 px tall inside the 512 cell).

CHARACTER DESIGNS ARE ORIGINAL — DO NOT REDESIGN
- The hunter characters (sheets K1–K6) are original designs made by a member of the owner's family. They matter a lot.
- Trace them FAITHFULLY from the attached reference: keep the exact proportions, silhouette, simple shapes (round head,
  blocky rectangular body and arms, dot eyes, simple smile), hairstyle shape, outfit, colors and the item in the hand.
- Do NOT make them chibi, realistic, older, slimmer or "more detailed"; do not add new clothes, accessories or features.
- Only allowed changes: cleaner edges, the uniform dark outline, one soft shading tone and one highlight.
- If you are unsure about a detail, copy the reference as it is.
- Lighting from the top-left on every sheet.

REFERENCES
- When I attach a reference sheet, keep each cell's IDENTITY exactly: same character, shapes, proportions, hairstyle,
  outfit, colors, item and cell position. Only upgrade the line and shading quality to the style above.
- Object names may be written in Turkish; interpret them as the real landmark, animal or item of that country.
- Do not copy any existing game, film or brand character; no real-world logos or brand text.

Reply only with the image. Confirm you understood by saying "ready".
```

---

## Pafta istemleri

Her istemi ayrı mesaj olarak gönder. Köşeli parantezli referans varsa önce o resmi ekle.

### K1 — Avcılar: Kinkin ve Veryi

Referans: `gorsel/referans/K1-referans.png`

```
Sheet K1: hunters Kinkin and Veryi, each in 3 costumes. Use the attached reference sheet; keep each cell's identity. ORIGINAL DESIGNS: trace each cell faithfully from the reference — same proportions, shapes and colors; do not redesign.
Cell 1: hunter Kinkin, costume "Blue" — exactly as in reference cell 1
Cell 2: hunter Kinkin, costume "Pink Princess" — exactly as in reference cell 2
Cell 3: hunter Kinkin, costume "Golden Legend" — exactly as in reference cell 3
Cell 4: hunter Veryi, costume "Classic" — exactly as in reference cell 4
Cell 5: hunter Veryi, costume "Soldier" — exactly as in reference cell 5
Cell 6: hunter Veryi, costume "Bronze Champion" — exactly as in reference cell 6
```

### K2 — Avcılar: Kornet ve Marli

Referans: `gorsel/referans/K2-referans.png`

```
Sheet K2: hunters Kornet and Marli, each in 3 costumes. Use the attached reference sheet; keep each cell's identity. ORIGINAL DESIGNS: trace each cell faithfully from the reference — same proportions, shapes and colors; do not redesign.
Cell 1: hunter Kornet, costume "Purple" — exactly as in reference cell 1
Cell 2: hunter Kornet, costume "Candy" — exactly as in reference cell 2
Cell 3: hunter Kornet, costume "Galaxy Wizard (starry, sparkle)" — exactly as in reference cell 3
Cell 4: hunter Marli, costume "Green" — exactly as in reference cell 4
Cell 5: hunter Marli, costume "Blue" — exactly as in reference cell 5
Cell 6: hunter Marli, costume "Golden Adventurer" — exactly as in reference cell 6
```

### K3 — Avcılar: Kenit ve Ponko

Referans: `gorsel/referans/K3-referans.png`

```
Sheet K3: hunters Kenit and Ponko, each in 3 costumes. Use the attached reference sheet; keep each cell's identity. ORIGINAL DESIGNS: trace each cell faithfully from the reference — same proportions, shapes and colors; do not redesign.
Cell 1: hunter Kenit, costume "Dark" — exactly as in reference cell 1
Cell 2: hunter Kenit, costume "Crimson" — exactly as in reference cell 2
Cell 3: hunter Kenit, costume "Ghost Lord" — exactly as in reference cell 3
Cell 4: hunter Ponko, costume "Red" — exactly as in reference cell 4
Cell 5: hunter Ponko, costume "Yellow" — exactly as in reference cell 5
Cell 6: hunter Ponko, costume "Golden Hat" — exactly as in reference cell 6
```

### K4 — Avcılar: Güllu ve Rani

Referans: `gorsel/referans/K4-referans.png`

```
Sheet K4: hunters Gullu and Rani, each in 3 costumes. Use the attached reference sheet; keep each cell's identity. ORIGINAL DESIGNS: trace each cell faithfully from the reference — same proportions, shapes and colors; do not redesign.
Cell 1: hunter Gullu, costume "Pink" — exactly as in reference cell 1
Cell 2: hunter Gullu, costume "Purple" — exactly as in reference cell 2
Cell 3: hunter Gullu, costume "Queen (crown, regal)" — exactly as in reference cell 3
Cell 4: hunter Rani, costume "Turquoise" — exactly as in reference cell 4
Cell 5: hunter Rani, costume "Lemon" — exactly as in reference cell 5
Cell 6: hunter Rani, costume "Sparkle" — exactly as in reference cell 6
```

### K5 — Avcılar: Beri ve Fanatik

Referans: `gorsel/referans/K5-referans.png`

```
Sheet K5: hunters Beri and Fanatik, each in 3 costumes. Use the attached reference sheet; keep each cell's identity. ORIGINAL DESIGNS: trace each cell faithfully from the reference — same proportions, shapes and colors; do not redesign.
Cell 1: hunter Beri, costume "Candy" — exactly as in reference cell 1
Cell 2: hunter Beri, costume "Chocolate" — exactly as in reference cell 2
Cell 3: hunter Beri, costume "Rainbow Lollipop" — exactly as in reference cell 3
Cell 4: hunter Fanatik, costume "White Gi (martial arts)" — exactly as in reference cell 4
Cell 5: hunter Fanatik, costume "Red Gi" — exactly as in reference cell 5
Cell 6: hunter Fanatik, costume "Dragon Master" — exactly as in reference cell 6
```

### K6 — Avcılar: Silsen, Serçin; Bot; görünmezlik

Referans: `gorsel/referans/K6-referans.png`

```
Sheet K6: hunters Silsen and Sercin, the robot helper and an item. Use the attached reference sheet; keep each cell's identity. ORIGINAL DESIGNS: trace each cell faithfully from the reference — same proportions, shapes and colors; do not redesign.
Cell 1: hunter Silsen, costume "Spring" — exactly as in reference cell 1
Cell 2: hunter Silsen, costume "Tulip" — exactly as in reference cell 2
Cell 3: hunter Sercin, costume "Sparrow" — exactly as in reference cell 3
Cell 4: hunter Sercin, costume "Winged Cat" — exactly as in reference cell 4
Cell 5: Bot (the robot companion) — exactly as in reference cell 5, without the text label
Cell 6: invisibility potion: small bottle with a cute translucent ghost swirl inside
```

### H1 — Hayaletler

Referans: `gorsel/referans/H1-referans.png`

```
Sheet H1: the ghosts. Use the attached reference sheet; keep each cell's identity.
Cell 1: normal ghost: classic sheet ghost, soft lavender, round eyes and small "o" mouth, wavy bottom edge
Cell 2: shooter ghost: same shape, brighter violet, slightly angry eyes, a glowing purple orb ready to throw
Cell 3: mini ghost: smaller, cute, pale lilac (boss minion)
Cell 4: level boss ghost: big red ghost with a golden crown and yellow eyes, menacing but fun, faint red aura
Cell 5: player spirit: a defeated hunter shown as a translucent blue ghost version of a kid hunter (for spectators)
Cell 6: (empty)
```

### P1 — Petler ve canlılar

Referans: `gorsel/referans/P1-referans.png`

```
Sheet P1: pets and creatures. Use the attached reference sheet; keep each cell's identity.
Cell 1: pet cat: orange cat, walking, facing right
Cell 2: pet dog: brown floppy-eared dog, walking, facing right
Cell 3: pet bird: blue bird flying, facing right
Cell 4: crocodile: crocodile head and eyes rising out of water with small ripples (top-down 3/4), menacing but cartoony
Cell 5: bat: dark purple bat with spread wings and small red eyes, facing right
Cell 6: storm cloud: dark grey-blue fluffy thundercloud, seen from the side, no lightning
```

### P2 — Dünya nesneleri ve toplanabilirler

Referans: `gorsel/referans/P2-referans.png`

```
Sheet P2: world objects and pickups. Use the attached reference sheet; keep each cell's identity.
Cell 1: hiding bush: dense round green bush seen from above-front, leaves, no flowers
Cell 2: rope bridge segment: horizontal wooden plank rope bridge piece, tileable left-right, seen from above
Cell 3: coin: golden coin with a small ghost emblem
Cell 4: diamond: blue faceted diamond
Cell 5: emerald: green emerald gem
Cell 6: heart: red heart pickup, glossy
```

### P3 — Güç yıldızı ve silahlar

Referans: `gorsel/referans/P3-referans.png`

```
Sheet P3: power star and guns. Use the attached reference sheet; keep each cell's identity.
Cell 1: power star: golden star with a lightning bolt, glowing
Cell 2: gun "Bubble Blaster": toy-like blue bubble gun, side view facing right
Cell 3: gun "Red Laser": red laser pistol, side view facing right
Cell 4: gun "Green Twin": green double-barrel blaster, side view facing right
Cell 5: gun "Scatter Cannon": light-blue short cannon with orange barrel, side view facing right
Cell 6: gun "Giant Bazooka": dark big bazooka with white stripes, side view facing right
```

### P4 — Cephane simgeleri

Referans: `gorsel/referans/P4-referans.png`

```
Sheet P4: ammo item icons. Use the attached reference sheet; keep each cell's identity. These are round-ish icons, each about 360 px wide.
Cell 1: bomb item: round cartoon bomb with lit fuse
Cell 2: freeze item: ice cube / snowflake crystal
Cell 3: lightning item: yellow lightning bolt
Cell 4: tornado item: small swirling tornado
Cell 5: first aid item: bandage / medkit
Cell 6: rocket item: small red rocket
```

### T1 — Tema: Mor Şato

```
Sheet T1: level theme "Purple Castle" (purple-violet castle at night, candles, stone); main floor color #1f1538, wall color #5a3825.
Cell 1: seamless tile: floor ground of Purple Castle, dark (floor stays darker than characters), subtle texture
Cell 2: seamless tile: wall top surface of Purple Castle seen from above (stone/bricks/rock fitting the theme)
Cell 3: seamless tile: water surface for Purple Castle
Cell 4: Purple Castle decoration object 1 (large prop, e.g. typical of this theme)
Cell 5: Purple Castle decoration object 2 (different prop)
Cell 6: spike trap: metal floor spikes on a small stone plate
```

### T2 — Tema: Yeşil Orman

```
Sheet T2: level theme "Green Forest" (deep green forest, mossy logs, mushrooms, fireflies); main floor color #0f3d24, wall color #365314.
Cell 1: seamless tile: floor ground of Green Forest, dark (floor stays darker than characters), subtle texture
Cell 2: seamless tile: wall top surface of Green Forest seen from above (stone/bricks/rock fitting the theme)
Cell 3: seamless tile: water surface for Green Forest
Cell 4: Green Forest decoration object 1 (large prop, e.g. typical of this theme)
Cell 5: Green Forest decoration object 2 (different prop)
Cell 6: third Green Forest decoration object
```

### T3 — Tema: Çöl

```
Sheet T3: level theme "Desert" (sand dunes, sandstone ruins, cacti); main floor color #3f2e0a, wall color #92400e.
Cell 1: seamless tile: floor ground of Desert, dark (floor stays darker than characters), subtle texture
Cell 2: seamless tile: wall top surface of Desert seen from above (stone/bricks/rock fitting the theme)
Cell 3: seamless tile: water surface for Desert
Cell 4: Desert decoration object 1 (large prop, e.g. typical of this theme)
Cell 5: Desert decoration object 2 (different prop)
Cell 6: third Desert decoration object
```

### T4 — Tema: Buz Mağarası

```
Sheet T4: level theme "Ice Cave" (blue ice cave, icicles, frozen crystals); main floor color #0c4a6e, wall color #7dd3fc.
Cell 1: seamless tile: floor ground of Ice Cave, dark (floor stays darker than characters), subtle texture
Cell 2: seamless tile: wall top surface of Ice Cave seen from above (stone/bricks/rock fitting the theme)
Cell 3: seamless tile: water surface for Ice Cave
Cell 4: Ice Cave decoration object 1 (large prop, e.g. typical of this theme)
Cell 5: Ice Cave decoration object 2 (different prop)
Cell 6: third Ice Cave decoration object
```

### T5 — Tema: Volkan

```
Sheet T5: level theme "Volcano" (dark volcanic rock, glowing magma cracks); main floor color #451a03, wall color #7f1d1d.
Cell 1: seamless tile: floor ground of Volcano, dark (floor stays darker than characters), subtle texture
Cell 2: seamless tile: wall top surface of Volcano seen from above (stone/bricks/rock fitting the theme)
Cell 3: seamless tile: lava pool surface for Volcano
Cell 4: Volcano decoration object 1 (large prop, e.g. typical of this theme)
Cell 5: Volcano decoration object 2 (different prop)
Cell 6: third Volcano decoration object
```

### T6 — Tema: Uzay

```
Sheet T6: level theme "Space" (space station / alien planet, stars, neon); main floor color #0c0a1e, wall color #1e1b4b.
Cell 1: seamless tile: floor ground of Space, dark (floor stays darker than characters), subtle texture
Cell 2: seamless tile: wall top surface of Space seen from above (stone/bricks/rock fitting the theme)
Cell 3: seamless tile: cosmic energy pool for Space
Cell 4: Space decoration object 1 (large prop, e.g. typical of this theme)
Cell 5: Space decoration object 2 (different prop)
Cell 6: third Space decoration object
```

### U01 — Dünya Turu: Türkiye ve Ukrayna

```
Sheet U01: World Tour countries Türkiye and Ukrayna.
Cell 1: Türkiye (TR) landmark/object: "peri bacaları" — compact game prop, recognizable
Cell 2: Türkiye (TR) landmark/object: "lale bahçesi" — compact game prop, recognizable
Cell 3: Türkiye (TR) BOSS: "Efe hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Türkiye clothing: headwear "efe", embroidered jacket/vest, embroidery, colors #2b2b3a, #c8302a, #e8c35a, accessories: kusak; respectful, not a caricature
Cell 4: Ukrayna (UA) landmark/object: "ayçiçeği tarlası" — compact game prop, recognizable
Cell 5: Ukrayna (UA) landmark/object: "saman çatılı beyaz ev" — compact game prop, recognizable
Cell 6: Ukrayna (UA) BOSS: "Vışıvankalı hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Ukrayna clothing: headwear "cicekTaci", embroidered jacket/vest, embroidery, colors #f4f1ea, #c8302a, #2a2a2a; respectful, not a caricature
```

### U02 — Dünya Turu: Polonya ve Almanya

```
Sheet U02: World Tour countries Polonya and Almanya.
Cell 1: Polonya (PL) landmark/object: "Wawel ejderi" — compact game prop, recognizable
Cell 2: Polonya (PL) landmark/object: "leylek yuvaları" — compact game prop, recognizable
Cell 3: Polonya (PL) BOSS: "Krakowiak hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Polonya clothing: headwear "krakuska", embroidered jacket/vest, embroidery, colors #2f4fa0, #c8302a, #e8c35a; respectful, not a caricature
Cell 4: Almanya (DE) landmark/object: "guguklu saat evi" — compact game prop, recognizable
Cell 5: Almanya (DE) landmark/object: "yarım ahşap evler" — compact game prop, recognizable
Cell 6: Almanya (DE) BOSS: "Tirol şapkalı hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Almanya clothing: headwear "tirol", suspender shorts (lederhosen style), plain, colors #6b4a2a, #2f5f3a, #e9dfc8; respectful, not a caricature
```

### U03 — Dünya Turu: Birleşik Krallık ve Fransa

```
Sheet U03: World Tour countries Birleşik Krallık and Fransa.
Cell 1: Birleşik Krallık (GB) landmark/object: "kırmızı telefon kulübeleri" — compact game prop, recognizable
Cell 2: Birleşik Krallık (GB) landmark/object: "saat kulesi" — compact game prop, recognizable
Cell 3: Birleşik Krallık (GB) BOSS: "Kiltli hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Birleşik Krallık clothing: headwear "tam", wrapped cloth (sari/kilt/wrap style), tartan/plaid, colors #1f4f8a, #2f6f3a, #c8302a; respectful, not a caricature
Cell 4: Fransa (FR) landmark/object: "Eyfel Kulesi" — compact game prop, recognizable
Cell 5: Fransa (FR) landmark/object: "lavanta tarlası" — compact game prop, recognizable
Cell 6: Fransa (FR) BOSS: "Bereli hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Fransa clothing: headwear "bere", embroidered jacket/vest, stripes, colors #1f2f5a, #f4f1ea, #c8302a, accessories: fular; respectful, not a caricature
```

### U04 — Dünya Turu: İtalya ve İspanya

```
Sheet U04: World Tour countries İtalya and İspanya.
Cell 1: İtalya (IT) landmark/object: "Kolezyum" — compact game prop, recognizable
Cell 2: İtalya (IT) landmark/object: "gondollu kanal iskelesi" — compact game prop, recognizable
Cell 3: İtalya (IT) BOSS: "Maskeli karnaval hayaleti" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional İtalya clothing: headwear "ucKose", poncho/cape, plain, colors #2a2a3a, #c8a24a, #f4f1ea, accessories: maske; respectful, not a caricature
Cell 4: İspanya (ES) landmark/object: "La Mancha yel değirmenleri" — compact game prop, recognizable
Cell 5: İspanya (ES) landmark/object: "Elhamra'nın Aslanlı Çeşmesi" — compact game prop, recognizable
Cell 6: İspanya (ES) BOSS: "Flamenkocu hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional İspanya clothing: headwear "cicekToka", traditional dress, polka dots, colors #c8302a, #f4f1ea, #e8c35a, accessories: yelpaze; respectful, not a caricature
```

### U05 — Dünya Turu: Fas ve Cezayir

```
Sheet U05: World Tour countries Fas and Cezayir.
Cell 1: Fas (MA) landmark/object: "Şefşavan'ın mavi sokakları" — compact game prop, recognizable
Cell 2: Fas (MA) landmark/object: "fenerli çarşı tezgâhı" — compact game prop, recognizable
Cell 3: Fas (MA) BOSS: "Cellabeli hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Fas clothing: headwear "kapuson", long robe/tunic, stripes, colors #7a5a3a, #e8d8b8, #e8c35a; respectful, not a caricature
Cell 4: Cezayir (DZ) landmark/object: "Sahra kumulları" — compact game prop, recognizable
Cell 5: Cezayir (DZ) landmark/object: "Tassili n'Ajjer kaya kemerleri" — compact game prop, recognizable
Cell 6: Cezayir (DZ) BOSS: "Karakoulu hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Cezayir clothing: headwear "yok", embroidered jacket/vest, embroidery, colors #5a1f3a, #e8c35a, #2a2a2a; respectful, not a caricature
```

### U06 — Dünya Turu: Fildişi Sahili ve Gana

```
Sheet U06: World Tour countries Fildişi Sahili and Gana.
Cell 1: Fildişi Sahili (CI) landmark/object: "kakao bahçesi" — compact game prop, recognizable
Cell 2: Fildişi Sahili (CI) landmark/object: "fil ailesi" — compact game prop, recognizable
Cell 3: Fildişi Sahili (CI) BOSS: "Pagneli hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Fildişi Sahili clothing: headwear "basBagi", wrapped cloth (sari/kilt/wrap style), batik, colors #e07b2a, #2f6f9f, #f2c94c; respectful, not a caricature
Cell 4: Gana (GH) landmark/object: "kente dokuma tezgâhı" — compact game prop, recognizable
Cell 5: Gana (GH) landmark/object: "Kakum kanopi köprüsü" — compact game prop, recognizable
Cell 6: Gana (GH) BOSS: "Kenteli hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Gana clothing: headwear "yok", wrapped cloth (sari/kilt/wrap style), geometric pattern, colors #e3b021, #2f7a3b, #c8302a; respectful, not a caricature
```

### U07 — Dünya Turu: Nijerya ve Kongo DC

```
Sheet U07: World Tour countries Nijerya and Kongo DC.
Cell 1: Nijerya (NG) landmark/object: "Zuma Kayası" — compact game prop, recognizable
Cell 2: Nijerya (NG) landmark/object: "konuşan davullar" — compact game prop, recognizable
Cell 3: Nijerya (NG) BOSS: "Agbadalı hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Nijerya clothing: headwear "fila", long robe/tunic, embroidery, colors #2f6f9f, #f4f1ea, #e8c35a; respectful, not a caricature
Cell 4: Kongo DC (CD) landmark/object: "okapi ormanı" — compact game prop, recognizable
Cell 5: Kongo DC (CD) landmark/object: "Kongo Nehri pirogları" — compact game prop, recognizable
Cell 6: Kongo DC (CD) BOSS: "Kuba desenli hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Kongo DC clothing: headwear "kubaBaslik", wrapped cloth (sari/kilt/wrap style), geometric pattern, colors #8a5a2a, #2a2a2a, #e8d8b8; respectful, not a caricature
```

### U08 — Dünya Turu: Angola ve Güney Afrika

```
Sheet U08: World Tour countries Angola and Güney Afrika.
Cell 1: Angola (AO) landmark/object: "Kalandula Şelalesi" — compact game prop, recognizable
Cell 2: Angola (AO) landmark/object: "welwitschia bitkisi" — compact game prop, recognizable
Cell 3: Angola (AO) BOSS: "Bessanganalı hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Angola clothing: headwear "basBagi", traditional dress, batik, colors #c8302a, #f2c94c, #2f6f9f; respectful, not a caricature
Cell 4: Güney Afrika (ZA) landmark/object: "Masa Dağı" — compact game prop, recognizable
Cell 5: Güney Afrika (ZA) landmark/object: "Afrika penguenleri" — compact game prop, recognizable
Cell 6: Güney Afrika (ZA) BOSS: "Boncuklu hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Güney Afrika clothing: headwear "isicholo", wrapped cloth (sari/kilt/wrap style), beadwork, colors #c8302a, #2a2a2a, #f2c94c, accessories: boncukluYaka; respectful, not a caricature
```

### U09 — Dünya Turu: Mozambik ve Madagaskar

```
Sheet U09: World Tour countries Mozambik and Madagaskar.
Cell 1: Mozambik (MZ) landmark/object: "dau yelkenlileri" — compact game prop, recognizable
Cell 2: Mozambik (MZ) landmark/object: "kaju ağaçları" — compact game prop, recognizable
Cell 3: Mozambik (MZ) BOSS: "Capulanalı hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Mozambik clothing: headwear "basBagi", wrapped cloth (sari/kilt/wrap style), batik, colors #2a9d8f, #e07b2a, #f4f1ea; respectful, not a caricature
Cell 4: Madagaskar (MG) landmark/object: "Baobab Caddesi" — compact game prop, recognizable
Cell 5: Madagaskar (MG) landmark/object: "lemurlar" — compact game prop, recognizable
Cell 6: Madagaskar (MG) BOSS: "Lambalı hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Madagaskar clothing: headwear "satroka", poncho/cape, plain, colors #f4f1ea, #d9c27a, #8a6a4a; respectful, not a caricature
```

### U10 — Dünya Turu: Tanzanya ve Uganda

```
Sheet U10: World Tour countries Tanzanya and Uganda.
Cell 1: Tanzanya (TZ) landmark/object: "Kilimanjaro" — compact game prop, recognizable
Cell 2: Tanzanya (TZ) landmark/object: "Zanzibar oyma kapıları" — compact game prop, recognizable
Cell 3: Tanzanya (TZ) BOSS: "Kangalı hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Tanzanya clothing: headwear "basBagi", wrapped cloth (sari/kilt/wrap style), batik, colors #7a3fa0, #f2c94c, #2a2a2a; respectful, not a caricature
Cell 4: Uganda (UG) landmark/object: "dağ gorilleri" — compact game prop, recognizable
Cell 5: Uganda (UG) landmark/object: "Murchison Şelalesi" — compact game prop, recognizable
Cell 6: Uganda (UG) BOSS: "Gomesili hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Uganda clothing: headwear "yok", traditional dress, plain, colors #d9a0c0, #f4f1ea, #8a3a5a, accessories: kusak; respectful, not a caricature
```

### U11 — Dünya Turu: Kenya ve Etiyopya

```
Sheet U11: World Tour countries Kenya and Etiyopya.
Cell 1: Kenya (KE) landmark/object: "zürafalar ve akasya" — compact game prop, recognizable
Cell 2: Kenya (KE) landmark/object: "flamingolu göl" — compact game prop, recognizable
Cell 3: Kenya (KE) BOSS: "Maasai şukalı hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Kenya clothing: headwear "boncukBant", poncho/cape, tartan/plaid, colors #c8302a, #2a2a6a, #f2c94c, accessories: boncukluYaka; respectful, not a caricature
Cell 4: Etiyopya (ET) landmark/object: "Aksum dikili taşları" — compact game prop, recognizable
Cell 5: Etiyopya (ET) landmark/object: "gelada maymunları" — compact game prop, recognizable
Cell 6: Etiyopya (ET) BOSS: "Habesha hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Etiyopya clothing: headwear "yok", long robe/tunic, embroidery, colors #f4f1ea, #2f8f5a, #e8c35a, accessories: sal; respectful, not a caricature
```

### U12 — Dünya Turu: Sudan ve Mısır

```
Sheet U12: World Tour countries Sudan and Mısır.
Cell 1: Sudan (SD) landmark/object: "Meroe piramitleri" — compact game prop, recognizable
Cell 2: Sudan (SD) landmark/object: "deve pazarı" — compact game prop, recognizable
Cell 3: Sudan (SD) BOSS: "İmmalı hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Sudan clothing: headwear "imma", long robe/tunic, plain, colors #f4f1ea, #d9d4c7, #8a6a4a, accessories: sal; respectful, not a caricature
Cell 4: Mısır (EG) landmark/object: "Gize piramitleri ve Sfenks" — compact game prop, recognizable
Cell 5: Mısır (EG) landmark/object: "Nil'de feluka yelkenlileri" — compact game prop, recognizable
Cell 6: Mısır (EG) BOSS: "Firavun hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Mısır clothing: headwear "nemes", wrapped cloth (sari/kilt/wrap style), plain, colors #f4f1ea, #2a5fa0, #e8c35a, accessories: boncukluYaka; respectful, not a caricature
```

### U13 — Dünya Turu: Yemen ve Suudi Arabistan

```
Sheet U13: World Tour countries Yemen and Suudi Arabistan.
Cell 1: Yemen (YE) landmark/object: "Sokotra ejder kanı ağaçları" — compact game prop, recognizable
Cell 2: Yemen (YE) landmark/object: "Sana'a kule evleri" — compact game prop, recognizable
Cell 3: Yemen (YE) BOSS: "Meşeddeli hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Yemen clothing: headwear "mesedde", wrapped cloth (sari/kilt/wrap style), stripes, colors #3a4a6a, #c8a24a, #f4f1ea, accessories: sal; respectful, not a caricature
Cell 4: Suudi Arabistan (SA) landmark/object: "hurma bahçesi" — compact game prop, recognizable
Cell 5: Suudi Arabistan (SA) landmark/object: "AlUla Fil Kayası" — compact game prop, recognizable
Cell 6: Suudi Arabistan (SA) BOSS: "Şimaglı hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Suudi Arabistan clothing: headwear "simag", long robe/tunic, plain, colors #f4f1ea, #c8302a, #2a2a2a; respectful, not a caricature
```

### U14 — Dünya Turu: Filistin ve Irak

```
Sheet U14: World Tour countries Filistin and Irak.
Cell 1: Filistin (PS) landmark/object: "zeytin bahçesi" — compact game prop, recognizable
Cell 2: Filistin (PS) landmark/object: "Hayat Ağacı mozaiği" — compact game prop, recognizable
Cell 3: Filistin (PS) BOSS: "Tatreezli hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Filistin clothing: headwear "yok", long robe/tunic, embroidery, colors #2a2a2a, #b22c2c, #e8c35a; respectful, not a caricature
Cell 4: Irak (IQ) landmark/object: "kamış mudhif evleri" — compact game prop, recognizable
Cell 5: Irak (IQ) landmark/object: "şenaşil ahşap balkonlar" — compact game prop, recognizable
Cell 6: Irak (IQ) BOSS: "Biştli hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Irak clothing: headwear "simag", long robe/tunic, plain, colors #f4f1ea, #2a2a2a, #8a5a2a, accessories: pelerin; respectful, not a caricature
```

### U15 — Dünya Turu: İran ve Özbekistan

```
Sheet U15: World Tour countries İran and Özbekistan.
Cell 1: İran (IR) landmark/object: "Siose Pol köprüsü" — compact game prop, recognizable
Cell 2: İran (IR) landmark/object: "Yezd rüzgâr kuleleri" — compact game prop, recognizable
Cell 3: İran (IR) BOSS: "Kaşkay hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional İran clothing: headwear "kece", long robe/tunic, plain, colors #8a6a4a, #5a4a3a, #e8c35a, accessories: kusak; respectful, not a caricature
Cell 4: Özbekistan (UZ) landmark/object: "İpek Yolu kervanı" — compact game prop, recognizable
Cell 5: Özbekistan (UZ) landmark/object: "kavun pazarı" — compact game prop, recognizable
Cell 6: Özbekistan (UZ) BOSS: "Çapanlı hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Özbekistan clothing: headwear "doppi", long robe/tunic, stripes, colors #2f4fa0, #c8302a, #2f8f5a, accessories: kusak; respectful, not a caricature
```

### U16 — Dünya Turu: Afganistan ve Pakistan

```
Sheet U16: World Tour countries Afganistan and Pakistan.
Cell 1: Afganistan (AF) landmark/object: "uçurtmalı tepe" — compact game prop, recognizable
Cell 2: Afganistan (AF) landmark/object: "nar bahçesi" — compact game prop, recognizable
Cell 3: Afganistan (AF) BOSS: "Kuçi hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Afganistan clothing: headwear "yok", traditional dress, embroidery, colors #c8302a, #2a2a6a, #e8c35a; respectful, not a caricature
Cell 4: Pakistan (PK) landmark/object: "süslü kamyonlar" — compact game prop, recognizable
Cell 5: Pakistan (PK) landmark/object: "Hunza kayısı bahçesi" — compact game prop, recognizable
Cell 6: Pakistan (PK) BOSS: "Ajrak şallı hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Pakistan clothing: headwear "sindhi", long robe/tunic, plain, colors #f4f1ea, #8a2a2a, #2a2a6a, accessories: sal; respectful, not a caricature
```

### U17 — Dünya Turu: Hindistan ve Bangladeş

```
Sheet U17: World Tour countries Hindistan and Bangladeş.
Cell 1: Hindistan (IN) landmark/object: "Hawa Mahal" — compact game prop, recognizable
Cell 2: Hindistan (IN) landmark/object: "lotus göleti ve tavus kuşları" — compact game prop, recognizable
Cell 3: Hindistan (IN) BOSS: "Sarili hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Hindistan clothing: headwear "yok", wrapped cloth (sari/kilt/wrap style), embroidery, colors #e0457a, #f2c94c, #2a8a8a; respectful, not a caricature
Cell 4: Bangladeş (BD) landmark/object: "süslü rikşalar" — compact game prop, recognizable
Cell 5: Bangladeş (BD) landmark/object: "Sundarbans ve Bengal kaplanı" — compact game prop, recognizable
Cell 6: Bangladeş (BD) BOSS: "Lungili hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Bangladeş clothing: headwear "yok", wrapped cloth (sari/kilt/wrap style), tartan/plaid, colors #2f6f9f, #f4f1ea, #c8302a, accessories: sal; respectful, not a caricature
```

### U18 — Dünya Turu: Myanmar ve Tayland

```
Sheet U18: World Tour countries Myanmar and Tayland.
Cell 1: Myanmar (MM) landmark/object: "Inle Gölü balıkçıları" — compact game prop, recognizable
Cell 2: Myanmar (MM) landmark/object: "Pathein şemsiyeleri" — compact game prop, recognizable
Cell 3: Myanmar (MM) BOSS: "Longyili hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Myanmar clothing: headwear "gaungBaung", wrapped cloth (sari/kilt/wrap style), tartan/plaid, colors #5a2a6a, #f4f1ea, #e8c35a; respectful, not a caricature
Cell 4: Tayland (TH) landmark/object: "yüzen pazar" — compact game prop, recognizable
Cell 5: Tayland (TH) landmark/object: "tuk-tuk" — compact game prop, recognizable
Cell 6: Tayland (TH) BOSS: "Chut Thai hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Tayland clothing: headwear "yok", wrapped cloth (sari/kilt/wrap style), geometric pattern, colors #c8302a, #e8c35a, #2a6a5a, accessories: sal; respectful, not a caricature
```

### U19 — Dünya Turu: Malezya ve Endonezya

```
Sheet U19: World Tour countries Malezya and Endonezya.
Cell 1: Malezya (MY) landmark/object: "Petronas İkiz Kuleleri" — compact game prop, recognizable
Cell 2: Malezya (MY) landmark/object: "Rafflesia çiçeği" — compact game prop, recognizable
Cell 3: Malezya (MY) BOSS: "Tanjaklı hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Malezya clothing: headwear "tanjak", embroidered jacket/vest, plain, colors #2a6a8a, #e8c35a, #2a2a2a, accessories: kusak; respectful, not a caricature
Cell 4: Endonezya (ID) landmark/object: "Komodo ejderleri" — compact game prop, recognizable
Cell 5: Endonezya (ID) landmark/object: "pirinç terasları" — compact game prop, recognizable
Cell 6: Endonezya (ID) BOSS: "Batikli hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Endonezya clothing: headwear "blangkon", embroidered jacket/vest, batik, colors #6a4a2a, #e8d8b8, #2a2a2a; respectful, not a caricature
```

### U20 — Dünya Turu: Filipinler ve Vietnam

```
Sheet U20: World Tour countries Filipinler and Vietnam.
Cell 1: Filipinler (PH) landmark/object: "Çikolata Tepeleri" — compact game prop, recognizable
Cell 2: Filipinler (PH) landmark/object: "jeepney" — compact game prop, recognizable
Cell 3: Filipinler (PH) BOSS: "Barong hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Filipinler clothing: headwear "salakot", embroidered jacket/vest, embroidery, colors #f4f1ea, #e8e2c8, #c8a24a; respectful, not a caricature
Cell 4: Vietnam (VN) landmark/object: "Ha Long Körfezi" — compact game prop, recognizable
Cell 5: Vietnam (VN) landmark/object: "Hoi An fenerleri" — compact game prop, recognizable
Cell 6: Vietnam (VN) BOSS: "Ao dai'li hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Vietnam clothing: headwear "nonLa", traditional dress, plain, colors #f4f1ea, #3a7a5a, #e8c35a; respectful, not a caricature
```

### U21 — Dünya Turu: Çin ve Güney Kore

```
Sheet U21: World Tour countries Çin and Güney Kore.
Cell 1: Çin (CN) landmark/object: "pandalar ve bambu" — compact game prop, recognizable
Cell 2: Çin (CN) landmark/object: "ejder dansı" — compact game prop, recognizable
Cell 3: Çin (CN) BOSS: "Tang ceketli hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Çin clothing: headwear "yok", embroidered jacket/vest, plain, colors #c8302a, #e8c35a, #2a2a2a, accessories: fener; respectful, not a caricature
Cell 4: Güney Kore (KR) landmark/object: "hanok evleri" — compact game prop, recognizable
Cell 5: Güney Kore (KR) landmark/object: "kimçi küpleri" — compact game prop, recognizable
Cell 6: Güney Kore (KR) BOSS: "Hanboklu hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Güney Kore clothing: headwear "gat", kimono, plain, colors #f4f1ea, #e05a7a, #2a8a8a; respectful, not a caricature
```

### U22 — Dünya Turu: Japonya ve Rusya

```
Sheet U22: World Tour countries Japonya and Rusya.
Cell 1: Japonya (JP) landmark/object: "kiraz ağaçları" — compact game prop, recognizable
Cell 2: Japonya (JP) landmark/object: "Fuji Dağı" — compact game prop, recognizable
Cell 3: Japonya (JP) BOSS: "Kimonolu hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Japonya clothing: headwear "yok", kimono, embroidery, colors #2a4a8a, #f4a6c0, #e8c35a, accessories: yelpaze; respectful, not a caricature
Cell 4: Rusya (RU) landmark/object: "matruşka bebekleri" — compact game prop, recognizable
Cell 5: Rusya (RU) landmark/object: "oymalı ahşap izba" — compact game prop, recognizable
Cell 6: Rusya (RU) BOSS: "Kokoşnikli hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Rusya clothing: headwear "kokosnik", traditional dress, embroidery, colors #c8302a, #e8c35a, #2f5fa0; respectful, not a caricature
```

### U23 — Dünya Turu: Kanada ve ABD

```
Sheet U23: World Tour countries Kanada and ABD.
Cell 1: Kanada (CA) landmark/object: "akçaağaç ormanı ve şurup" — compact game prop, recognizable
Cell 2: Kanada (CA) landmark/object: "kunduz barajı" — compact game prop, recognizable
Cell 3: Kanada (CA) BOSS: "Oduncu hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Kanada clothing: headwear "kurk", embroidered jacket/vest, tartan/plaid, colors #c8302a, #2a2a2a, #f2c94c, accessories: kusak; respectful, not a caricature
Cell 4: ABD (US) landmark/object: "Özgürlük Heykeli" — compact game prop, recognizable
Cell 5: ABD (US) landmark/object: "Büyük Kanyon" — compact game prop, recognizable
Cell 6: ABD (US) BOSS: "Kovboy hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional ABD clothing: headwear "kovboy", embroidered jacket/vest, plain, colors #8a5a3a, #2f5fa0, #c8302a, accessories: bandana; respectful, not a caricature
```

### U24 — Dünya Turu: Meksika ve Kolombiya

```
Sheet U24: World Tour countries Meksika and Kolombiya.
Cell 1: Meksika (MX) landmark/object: "papel picado süslü pazar" — compact game prop, recognizable
Cell 2: Meksika (MX) landmark/object: "ajolote göleti" — compact game prop, recognizable
Cell 3: Meksika (MX) BOSS: "Charro hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Meksika clothing: headwear "sombrero", embroidered jacket/vest, embroidery, colors #2a2a2a, #e8c35a, #c8302a; respectful, not a caricature
Cell 4: Kolombiya (CO) landmark/object: "Kokora mum palmiyeleri" — compact game prop, recognizable
Cell 5: Kolombiya (CO) landmark/object: "Cartagena'nın balkonlu evleri" — compact game prop, recognizable
Cell 6: Kolombiya (CO) BOSS: "Vueltiao şapkalı hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Kolombiya clothing: headwear "vueltiao", poncho/cape, stripes, colors #8a6a4a, #f4f1ea, #2a2a2a; respectful, not a caricature
```

### U25 — Dünya Turu: Peru ve Brezilya

```
Sheet U25: World Tour countries Peru and Brezilya.
Cell 1: Peru (PE) landmark/object: "Machu Picchu terasları" — compact game prop, recognizable
Cell 2: Peru (PE) landmark/object: "lamalar" — compact game prop, recognizable
Cell 3: Peru (PE) BOSS: "Chullolu hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Peru clothing: headwear "chullo", poncho/cape, geometric pattern, colors #c8302a, #f2c94c, #2a6a8a; respectful, not a caricature
Cell 4: Brezilya (BR) landmark/object: "Amazon tukanları ve araları" — compact game prop, recognizable
Cell 5: Brezilya (BR) landmark/object: "Şeker Somunu Dağı" — compact game prop, recognizable
Cell 6: Brezilya (BR) BOSS: "Frevocu hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Brezilya clothing: headwear "yok", traditional dress, geometric pattern, colors #f2c94c, #2f8f5a, #c8302a, accessories: semsiye; respectful, not a caricature
```

### U26 — Dünya Turu: Arjantin

```
Sheet U26: World Tour countries Arjantin.
Cell 1: Arjantin (AR) landmark/object: "Perito Moreno Buzulu" — compact game prop, recognizable
Cell 2: Arjantin (AR) landmark/object: "Caminito'nun renkli evleri" — compact game prop, recognizable
Cell 3: Arjantin (AR) BOSS: "Gaucho hayalet" — the boss ghost (same ghost body as H1 cell 4, without the crown) wearing traditional Arjantin clothing: headwear "boina", poncho/cape, stripes, colors #6a4a2a, #e8d8b8, #2a2a2a, accessories: mate; respectful, not a caricature
Cell 4: (empty)
Cell 5: (empty)
Cell 6: (empty)
```

### I1 — Uygulama simgesi (ayrı istem)

```
App icon for Ghost Hunters: EXCEPTION to the grid rules — one opaque square image, 1024 x 1024 px.
A cute white ghost with big eyes in front of a deep purple-to-indigo radial background with a few stars,
same style as the sheets, centered, the ghost fills ~60% (Android safe zone), no text, no border.
```

### A1 — Menü arka planı (ayrı istem)

```
Menu background: EXCEPTION to the grid rules — one opaque portrait image, 1024 x 1536 px.
A calm haunted night sky over a soft silhouette of hills and a small castle, purple-indigo tones, a few stars,
faint ghost shapes far away, darker toward the bottom so white buttons stay readable. No text, no characters in front.
```

---

## Animasyon paftaları (N01–N13): 45 pafta bittikten sonra

Kullanıcının isteği (22 Kasım 2026): *"Devam eden işi bozmadan animasyonlar ekleyebilirsin; GPT'de oluşturup statik
olmak zorunda değil, kendin önerilerde de bulunabilirsin."*

**Sıra:** Bu paftalar 45 paftalık asıl iş (K, H, P, T, U, I1, A1) **bittikten sonra** istenir; asıl işin sırası
değişmez. Her animasyon paftası, daha önce onaylanmış durağan paftayı referans alır; o pafta `gorsel/ham/`'da yoksa
animasyon paftası bekler.

**Neden karakterler (K1–K6) için kare kare animasyon yok:** Karakterler özgün tasarım. otuzu aşkın kostümün her birini ChatGPT'ye
birkaç pozda yeniden çizdirmek, kareden kareye küçük tasarım kaymalarına yol açar. Avcıların yürüyüşü kodla yapılır:
onaylı resmin bacak bölümü ikiye ayrılıp sırayla kaldırılır, gövde hafifçe salınır (bugünkü kod yürüyüşünün aynısı).
Böylece tasarım hiç değişmeden karakterler yürür.

**Kare kuralı (Claude'un kesiminde):** Her paftada 6 kare var. "Tek animasyon" yazan paftada kareler 1→6 sırasıyla
oynar; "üst sıra / alt sıra" yazan paftada her sıra ayrı bir 3 karelik animasyondur. Claude kareleri keserken her
karenin dolu bölgesini bulup alt-orta noktasına (yaratıklar) ya da merkezine (efektler) hizalar; ChatGPT'nin küçük
kaymaları böylece düzelir. Oynatma hızları `www/anim.js` tablosunda.

### ANİMASYON İSTEMİ (N01'den önce bir kez)

```
New task type: ANIMATION SHEETS (codes N01–N13). All format and style rules from the start still apply
(1536 x 1024, transparent, 3 x 2 grid of 512 px cells, no text, no shadow, dark outline, lighting top-left).
Additional rules for animation sheets:
- Every cell is ONE FRAME of an animation. Frames play in cell order: 1, 2, 3, 4, 5, 6.
- If a sheet says "top row" and "bottom row", each row is a separate 3-frame animation (cells 1-2-3 and 4-5-6).
- The subject must look EXACTLY like the attached approved sprite: same design, colors, outline and proportions.
- Keep the subject the SAME SIZE and in the SAME PLACE in every frame (same center, same bottom line); only the
  described motion changes. Do not zoom, crop or move the camera between frames.
- "Loop" animations: the last frame must flow smoothly back into the first one.
- Effects (smoke, sparkles, rings, sparks) stay inside the cell with the usual 24 px margin.
Confirm with "ready".
```

### N01 — Normal hayalet: süzülme döngüsü (tek animasyon, döngü)

Referans: `gorsel/ham/H1.png` (hücre 1)

```
Sheet N01: the normal ghost (cell 1 of the attached sheet), a 6-frame LOOP of it floating in place.
Frames 1-6: the wavy bottom edge ripples like cloth in a soft breeze (the wave travels from left to right across the
frames), the body squashes very slightly (frame 1 tallest, frame 4 a little wider and shorter). In frame 4 the eyes
are closed (a blink), in all other frames open. Same position and size in every frame.
```

### N02 — Hayalet: yok olma "puf" (tek animasyon, bir kez)

Referans: `gorsel/ham/H1.png` (hücre 1)

```
Sheet N02: the normal ghost (cell 1 of the attached sheet) being defeated, 6 frames played once.
Frame 1: the ghost with a surprised face, eyes wide. Frame 2: it stretches upward, thinner and taller.
Frame 3: its lower half dissolves into soft lavender smoke wisps. Frame 4: mostly smoke now, the face fading,
small white sparkles appear. Frame 5: a round puff of lavender smoke with a few stars. Frame 6: only a few small
fading sparkles and a thin smoke ring. No gore, cute and satisfying.
```

### N03 — Atıcı hayalet: saldırı (tek animasyon, bir kez)

Referans: `gorsel/ham/H1.png` (hücre 2)

```
Sheet N03: the shooter ghost (cell 2 of the attached sheet) attacking, 6 frames played once, facing right.
Frame 1: idle, angry eyes, NO orb. Frame 2: it leans back, gathering power, a tiny purple spark in front of it.
Frame 3: the purple energy orb grows to small size just in front of its body. Frame 4: the orb is at full size,
glowing. Frame 5: it lunges forward and the orb is released to the right, still touching the ghost.
Frame 6: it settles back to idle, NO orb. The orb never leaves the cell.
```

### N04 — Bölüm boss'u: bekleme ve kükreme (üst sıra / alt sıra)

Referans: `gorsel/ham/H1.png` (hücre 4)

```
Sheet N04: the red crowned boss ghost (cell 4 of the attached sheet). Two 3-frame animations, same size and place.
Top row (cells 1-3), LOOP "idle": the boss breathes slowly, the crown bobs up and down a little, the red aura pulses
(small, medium, small).
Bottom row (cells 4-6), played once, "roar": cell 4 mouth opening, cell 5 mouth wide open with glowing yellow eyes
and two red sound rings around it, cell 6 mouth closing, rings fading.
```

### N05 — Bölüm boss'u: yenilgi (tek animasyon, bir kez)

Referans: `gorsel/ham/H1.png` (hücre 4)

```
Sheet N05: the red crowned boss ghost (cell 4 of the attached sheet) being defeated, 6 frames played once.
Frame 1: hit, eyes squeezed shut, body flashes slightly white. Frame 2: the crown pops up off its head.
Frame 3: the boss spins dizzily, little stars around its head, crown in the air. Frame 4: the boss shrinks and starts
to burst into red and gold sparkles. Frame 5: a bright round burst of red-gold sparkles, the crown falling.
Frame 6: only the golden crown, tilted, with a few last sparkles. Fun, not scary.
```

### N06 — Para: dönme (tek animasyon, döngü)

Referans: `gorsel/ham/P2.png` (hücre 3)

```
Sheet N06: the golden ghost coin (cell 3 of the attached sheet) spinning around its vertical axis, 6-frame LOOP.
Frame 1: front face. Frame 2: turned 45°. Frame 3: almost edge-on (thin golden ellipse). Frame 4: back side turned
45° (plain golden back with a small star). Frame 5: almost edge-on again. Frame 6: turning back toward the front.
A small white shine moves across the coin. Same center and height in every frame.
```

### N07 — Elmas ve zümrüt: parıltı (üst sıra / alt sıra, döngü)

Referans: `gorsel/ham/P2.png` (hücre 4 ve 5)

```
Sheet N07: two 3-frame LOOPS, same size and place.
Top row (cells 1-3): the blue diamond (cell 4 of the attached sheet); a white four-point twinkle star moves across
its facets (left, middle, right), the diamond itself never changes.
Bottom row (cells 4-6): the green emerald (cell 5 of the attached sheet), the same twinkle animation.
```

### N08 — Vuruş kıvılcımı ve bomba patlaması (üst sıra / alt sıra, bir kez)

Referans: `gorsel/ham/P4.png` (hücre 1, bomba)

```
Sheet N08: two 3-frame effects played once, centered in their cells.
Top row (cells 1-3) "hit spark": a small bright yellow-white star burst. Cell 1 small, cell 2 biggest with short
rays, cell 3 breaking into a few tiny sparks.
Bottom row (cells 4-6) "bomb explosion" for the bomb item (cell 1 of the attached sheet): cell 4 a white-yellow flash,
cell 5 a big round cartoon explosion with an orange core and purple-grey smoke puffs, cell 6 smoke puffs drifting
apart and fading. Cartoony, no fire realism.
```

### N09 — Buz patlaması ve kasırga (üst sıra bir kez / alt sıra döngü)

Referans: `gorsel/ham/P4.png` (hücre 2 ve 4)

```
Sheet N09: two 3-frame animations, centered in their cells.
Top row (cells 1-3), played once, "freeze burst" in the style of the freeze item (cell 2 of the attached sheet):
cell 1 a small ice crystal, cell 2 light-blue ice shards bursting outward in a ring, cell 3 shards fading into
snowflakes.
Bottom row (cells 4-6), LOOP, "tornado" in the style of the tornado item (cell 4 of the attached sheet): a small
swirling tornado, the swirl rotating between frames, a few leaves and dust bits circling it.
```

### N10 — Kedi ve köpek: yürüyüş (üst sıra / alt sıra, döngü)

Referans: `gorsel/ham/P1.png` (hücre 1 ve 2)

```
Sheet N10: two 3-frame walk LOOPS, facing right, same size and bottom line in every frame.
Top row (cells 1-3): the orange cat (cell 1 of the attached sheet) walking: cell 1 front paws forward, cell 2 paws
together, body slightly up, cell 3 back paws forward; the tail sways.
Bottom row (cells 4-6): the brown dog (cell 2 of the attached sheet) walking the same way; the floppy ears bounce and
the tail wags.
```

### N11 — Kuş ve yarasa: kanat çırpma (üst sıra / alt sıra, döngü)

Referans: `gorsel/ham/P1.png` (hücre 3 ve 5)

```
Sheet N11: two 3-frame flapping LOOPS, facing right, same center in every frame.
Top row (cells 1-3): the blue bird (cell 3 of the attached sheet): wings up, wings level, wings down.
Bottom row (cells 4-6): the purple bat (cell 5 of the attached sheet): wings up, wings level, wings down; its red
eyes stay visible.
```

### N12 — Timsah: yükselip kapma (tek animasyon, bir kez)

Referans: `gorsel/ham/P1.png` (hücre 4)

```
Sheet N12: the crocodile in water (cell 4 of the attached sheet), 6 frames played once, same water spot.
Frame 1: only small ripples on dark water. Frame 2: two eyes rise out of the water. Frame 3: the head rises,
mouth closed. Frame 4: jaws wide open. Frame 5: jaws snap shut with a small splash. Frame 6: the head sinks,
ripples spreading. Cartoony, no blood.
```

### N13 — Toplama patlamaları: kalp ve güç yıldızı (üst sıra / alt sıra, bir kez)

Referans: `gorsel/ham/P2.png` (hücre 6) ve `gorsel/ham/P3.png` (hücre 1)

```
Sheet N13: two 3-frame "collected" effects played once, centered.
Top row (cells 1-3): the red heart pickup (cell 6 of the P2 sheet) being collected: cell 1 the heart squashes
wide, cell 2 it pops into five small hearts flying outward, cell 3 the small hearts fading with sparkles.
Bottom row (cells 4-6): the golden power star (cell 1 of the P3 sheet) being collected: cell 4 the star grows and
glows, cell 5 a burst of golden rays and the star breaking into small stars, cell 6 the small stars fading.
```

---

## Bitince Claude'un yapacakları (ChatGPT'ye gönderilmez)

1. `gorsel/ham/*.png` paftalarını 3×2 düzene göre keser; her hücrenin saydam kenarını kırpar; WebP'ye çevirir
   (`www/gorsel/<anahtar>.webp`). Hedef: bütün görseller 12 MB'ın altında (APK boyutu).
2. `www/gorsel.js`: görselleri önceden yükleyen küçük bir yükleyici ve anahtar tablosu (karakter+kostüm, hayalet türü,
   pet, ülke objesi, ülke bossu, tema dokusu…).
3. Her çizim işlevi (`drawCharacter`, `drawGhost`, `petResmi`, `drawPickup`, `drawGunShape`, `caliCiz`, `yarasaCiz`,
   `bulutCiz`, `timsahCiz`, engel ve ülke objesi ressamları, `bossKostumuCiz`) önce resmi çizer; resim yoksa bugünkü kod
   çizimine düşer. Çarpışma kutuları, boyutlar ve oyun kuralları değişmez; yürüme için hafif zıplama ve sola dönüşte
   yatay ayna.
4. Testler: bütün mevcut testler + resimli çizim testi (her anahtar yükleniyor, eksikte eski çizim) + kare hızı.
   Tarayıcıda TR 390 px açık ve AR 340 px koyu denetimi.
5. Mağaza ekran görüntüleri, tanıtım görseli, reklam görselleri ve tanıtım videoları yeni görünümle yeniden üretilir.
6. Yeni sürüm; Play'e yalnız sizin "gönder" onayınızla.

Hak notu: OpenAI kullanım koşullarına göre üretilen görsellerin hakları kullanıcıya aittir; ticari kullanım serbesttir
**[K]** (koşullar değişebilir, yayından önce bakılmalı). Gerçek marka logosu ve tanınmış karakter taklidi istenmez.

---

## Yerel Claude'a ChatGPT'yi kullandırmak (isteğe bağlı)

Kullanıcının isteği (21 Kasım 2026): bilgisayardaki Claude Code (`claude --chrome`) ChatGPT'yi tarayıcıda kendisi
kullansın. Ona verilecek istem kullanıcıya sohbette verildi; özeti: depoyu güncelle → bu dosyayı oku → chatgpt.com'da
ana istem ve paftaları sırayla iste → her resmi indir, boyutunu (1536×1024) ve saydamlığını denetle → `gorsel/ham/`'a
pafta adıyla koy → her paftadan sonra commit ve push. Karakter paftalarında (K1–K6) her pafta referansla yan yana
kullanıcıya gösterilir, onayı olmadan sonrakine geçilmez. Giriş, şifre, ödeme ve ChatGPT'nin görsel sınırı kullanıcıya
bırakılır.
