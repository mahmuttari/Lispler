# Hayalet Avcıları: yolculuk haritası görselleri için ChatGPT istem paketi

Hazırlandı: 25 Kasım 2026 (yolculuk haritası, `../YOLCULUK.md`). Kullanıcının isteği: *"görselleri ChatGPT'ye yaptır"*.
Bu paket geçitlerdeki nehri, açık ve kapalı köprüleri, boss arenası girişini, başlangıç tabelasını ve yolculuk çubuğunun simgelerini ürettirir. Kodu Evren yazar; resim gelmezse oyun bugünkü kod çizimiyle çalışır.

## Yerel Claude için iş sırası

1. ChatGPT'de **yeni bir sohbet** aç, aşağıdaki **ANA İSTEM**'i bir kez gönder.
2. Her paftaya üslup referansı olarak `hamui/U06.png` ve `ham3d/D01.png` ekle.
3. Her resmi `gorsel/hamyol/<KOD>.png` olarak kaydet (J01 … J12). Her paftadan sonra commit ve push yap, ilerlemeyi `gorsel/hamyol/DURUM.md`'ye yaz.
4. Önce **J01**'i üret ve kullanıcıya göster; onay gelmeden kalan paftalara geçme. Sonrakileri toplu göstermek yeterli.
5. Giriş, şifre, ödeme ve ChatGPT'nin görsel sınırı kullanıcıya bırakılır. Oyun koduna dokunma.

Toplam **12 pafta**: J01–J06 normal oyunun 6 teması, J07–J11 Dünya Turu'nun 10 bölge ailesi, J12 ortak parçalar.

---

## ANA İSTEM (yeni sohbette bir kez)

```
You are the lead environment artist for "Ghost Hunters" (Hayalet Avcıları), a cheerful TOP-DOWN mobile game for ages 13+.
Each level is now a long left-to-right JOURNEY map: the player crosses six rivers on bridges and reaches the boss arena at the far
right. A bridge is closed (raised drawbridge) until the zone is cleared, then it lowers and stays open. I will attach approved
sheets as style reference.

STYLE (identical on every sheet)
- Stylized 3D render like a premium casual mobile game, seen from DIRECTLY ABOVE (top-down, slight depth on raised parts only):
  smooth vinyl-toy / soft clay materials, soft light from the top-left, gentle ambient occlusion, rounded forms, saturated colours.
- Readable at small size; bold shapes; no tiny clutter.
- No text, letters, numbers, logos, flags, religious symbols or watermarks.

FORMAT
- One PNG per sheet, exactly 1536 x 1024 px. Grid 3 x 2 (512 px cells); every object fully inside its cell with 24 px margin,
  centred. TRANSPARENT background, EXCEPT the river tile cell, which is an opaque seamless tile (see the sheet).
- Bridges are drawn spanning LEFT to RIGHT (horizontal), as seen from above.

Reply only with the image. Confirm you understood by saying "ready".
```

## Paftalar

Izgara 3 × 2; üst satır soldan sağa 1-2-3, alt satır 4-5-6.

### J01–J06: Normal oyunun temaları

```
Sheet J01: journey pieces for the theme "Mor Şato (Purple Castle)" (dark purple castle floor, brown stone walls, royal blue water). Grid 3 x 2.
Cell 1: RIVER TILE, opaque, seamless top-to-bottom: a vertical river strip 360 px wide in the middle of the 512 x 512 cell with soft
        curved banks on both sides in the theme's ground colour and a few small rocks/plants; the strip must tile vertically
        without seams (top edge continues the bottom edge)
Cell 2: OPEN BRIDGE spanning left to right, seen from above, about 440 px long and 150 px wide, in materials fitting the theme
Cell 3: CLOSED BRIDGE: the same bridge lying FLAT and level in the same position as cell 2 (NOT raised, NOT tilted), with a
        closed wooden double gate standing across its middle, an iron chain and a small golden padlock on the gate
Cell 4: BOSS ARENA ENTRANCE: a big decorated gate arch seen from above, in the theme's style, with a small crown ornament
Cell 5: START SIGNPOST: a cheerful wooden signpost with a rolled map hanging from it (no writing)
Cell 6: ZONE MARKER: a small banner on a pole in the theme's colours, to mark a cleared zone (no symbols)
```

```
Sheet J02: journey pieces for the theme "Yeşil Orman (Green Forest)" (dark green forest floor, mossy logs, green-tinted forest water). Grid 3 x 2.
Cell 1: RIVER TILE, opaque, seamless top-to-bottom: a vertical river strip 360 px wide in the middle of the 512 x 512 cell with soft
        curved banks on both sides in the theme's ground colour and a few small rocks/plants; the strip must tile vertically
        without seams (top edge continues the bottom edge)
Cell 2: OPEN BRIDGE spanning left to right, seen from above, about 440 px long and 150 px wide, in materials fitting the theme
Cell 3: CLOSED BRIDGE: the same bridge lying FLAT and level in the same position as cell 2 (NOT raised, NOT tilted), with a
        closed wooden double gate standing across its middle, an iron chain and a small golden padlock on the gate
Cell 4: BOSS ARENA ENTRANCE: a big decorated gate arch seen from above, in the theme's style, with a small crown ornament
Cell 5: START SIGNPOST: a cheerful wooden signpost with a rolled map hanging from it (no writing)
Cell 6: ZONE MARKER: a small banner on a pole in the theme's colours, to mark a cleared zone (no symbols)
```

```
Sheet J03: journey pieces for the theme "Çöl (Desert)" (golden sand, sandstone blocks, turquoise oasis water). Grid 3 x 2.
Cell 1: RIVER TILE, opaque, seamless top-to-bottom: a vertical river strip 360 px wide in the middle of the 512 x 512 cell with soft
        curved banks on both sides in the theme's ground colour and a few small rocks/plants; the strip must tile vertically
        without seams (top edge continues the bottom edge)
Cell 2: OPEN BRIDGE spanning left to right, seen from above, about 440 px long and 150 px wide, in materials fitting the theme
Cell 3: CLOSED BRIDGE: the same bridge lying FLAT and level in the same position as cell 2 (NOT raised, NOT tilted), with a
        closed wooden double gate standing across its middle, an iron chain and a small golden padlock on the gate
Cell 4: BOSS ARENA ENTRANCE: a big decorated gate arch seen from above, in the theme's style, with a small crown ornament
Cell 5: START SIGNPOST: a cheerful wooden signpost with a rolled map hanging from it (no writing)
Cell 6: ZONE MARKER: a small banner on a pole in the theme's colours, to mark a cleared zone (no symbols)
```

```
Sheet J04: journey pieces for the theme "Buz Mağarası (Ice Cave)" (deep blue ice floor, pale ice walls, light icy water with floating ice). Grid 3 x 2.
Cell 1: RIVER TILE, opaque, seamless top-to-bottom: a vertical river strip 360 px wide in the middle of the 512 x 512 cell with soft
        curved banks on both sides in the theme's ground colour and a few small rocks/plants; the strip must tile vertically
        without seams (top edge continues the bottom edge)
Cell 2: OPEN BRIDGE spanning left to right, seen from above, about 440 px long and 150 px wide, in materials fitting the theme
Cell 3: CLOSED BRIDGE: the same bridge lying FLAT and level in the same position as cell 2 (NOT raised, NOT tilted), with a
        closed wooden double gate standing across its middle, an iron chain and a small golden padlock on the gate
Cell 4: BOSS ARENA ENTRANCE: a big decorated gate arch seen from above, in the theme's style, with a small crown ornament
Cell 5: START SIGNPOST: a cheerful wooden signpost with a rolled map hanging from it (no writing)
Cell 6: ZONE MARKER: a small banner on a pole in the theme's colours, to mark a cleared zone (no symbols)
```

```
Sheet J05: journey pieces for the theme "Volkan (Volcano)" (dark basalt ground, red rock walls, orange glowing lava river (the bridge crosses lava)). Grid 3 x 2.
Cell 1: RIVER TILE, opaque, seamless top-to-bottom: a vertical river strip 360 px wide in the middle of the 512 x 512 cell with soft
        curved banks on both sides in the theme's ground colour and a few small rocks/plants; the strip must tile vertically
        without seams (top edge continues the bottom edge)
Cell 2: OPEN BRIDGE spanning left to right, seen from above, about 440 px long and 150 px wide, in materials fitting the theme
Cell 3: CLOSED BRIDGE: the same bridge lying FLAT and level in the same position as cell 2 (NOT raised, NOT tilted), with a
        closed wooden double gate standing across its middle, an iron chain and a small golden padlock on the gate
Cell 4: BOSS ARENA ENTRANCE: a big decorated gate arch seen from above, in the theme's style, with a small crown ornament
Cell 5: START SIGNPOST: a cheerful wooden signpost with a rolled map hanging from it (no writing)
Cell 6: ZONE MARKER: a small banner on a pole in the theme's colours, to mark a cleared zone (no symbols)
```

```
Sheet J06: journey pieces for the theme "Uzay (Space)" (dark violet space station floor, indigo metal walls, purple energy stream (the bridge crosses an energy stream)). Grid 3 x 2.
Cell 1: RIVER TILE, opaque, seamless top-to-bottom: a vertical river strip 360 px wide in the middle of the 512 x 512 cell with soft
        curved banks on both sides in the theme's ground colour and a few small rocks/plants; the strip must tile vertically
        without seams (top edge continues the bottom edge)
Cell 2: OPEN BRIDGE spanning left to right, seen from above, about 440 px long and 150 px wide, in materials fitting the theme
Cell 3: CLOSED BRIDGE: the same bridge lying FLAT and level in the same position as cell 2 (NOT raised, NOT tilted), with a
        closed wooden double gate standing across its middle, an iron chain and a small golden padlock on the gate
Cell 4: BOSS ARENA ENTRANCE: a big decorated gate arch seen from above, in the theme's style, with a small crown ornament
Cell 5: START SIGNPOST: a cheerful wooden signpost with a rolled map hanging from it (no writing)
Cell 6: ZONE MARKER: a small banner on a pole in the theme's colours, to mark a cleared zone (no symbols)
```

### J07–J11: Dünya Turu bölge aileleri (iki aile bir paftada)

Dünya Turu'nda su her ülkede aynı mavidir; nehir J12'deki ortak karodan çizilir.

```
Sheet J07: journey pieces for two World Tour region families. Grid 3 x 2. Water is the same friendly blue everywhere.
Row 1 = family K (European stone and brick castle towns):
Cell 1: OPEN BRIDGE spanning left to right, seen from above, about 440 px long and 150 px wide, in this region's typical materials
Cell 2: CLOSED BRIDGE: the same bridge raised on the left bank like a drawbridge (planks tilted up, two chains), glowing barrier, small padlock
Cell 3: BOSS ARENA ENTRANCE gate arch seen from above in this region's architecture, small crown ornament, no religious symbols
Row 2 = family KS (caravanserai, Anatolian/Persian stone arches):
Cell 4: OPEN BRIDGE (same rules)
Cell 5: CLOSED BRIDGE (same rules)
Cell 6: BOSS ARENA ENTRANCE (same rules)
```

```
Sheet J08: journey pieces for two World Tour region families. Grid 3 x 2. Water is the same friendly blue everywhere.
Row 1 = family KP (mud-brick (adobe) towns of North Africa and the Middle East):
Cell 1: OPEN BRIDGE spanning left to right, seen from above, about 440 px long and 150 px wide, in this region's typical materials
Cell 2: CLOSED BRIDGE: the same bridge raised on the left bank like a drawbridge (planks tilted up, two chains), glowing barrier, small padlock
Cell 3: BOSS ARENA ENTRANCE gate arch seen from above in this region's architecture, small crown ornament, no religious symbols
Row 2 = family SH (Sahel: earthen architecture, baobab, dry grass):
Cell 4: OPEN BRIDGE (same rules)
Cell 5: CLOSED BRIDGE (same rules)
Cell 6: BOSS ARENA ENTRANCE (same rules)
```

```
Sheet J09: journey pieces for two World Tour region families. Grid 3 x 2. Water is the same friendly blue everywhere.
Row 1 = family SV (African savanna: acacia, thatched huts, red earth):
Cell 1: OPEN BRIDGE spanning left to right, seen from above, about 440 px long and 150 px wide, in this region's typical materials
Cell 2: CLOSED BRIDGE: the same bridge raised on the left bank like a drawbridge (planks tilted up, two chains), glowing barrier, small padlock
Cell 3: BOSS ARENA ENTRANCE gate arch seen from above in this region's architecture, small crown ornament, no religious symbols
Row 2 = family GA (South Asia: carved sandstone, marigold colours):
Cell 4: OPEN BRIDGE (same rules)
Cell 5: CLOSED BRIDGE (same rules)
Cell 6: BOSS ARENA ENTRANCE (same rules)
```

```
Sheet J10: journey pieces for two World Tour region families. Grid 3 x 2. Water is the same friendly blue everywhere.
Row 1 = family GDA (Southeast Asia: bamboo, rice terraces, carved teak):
Cell 1: OPEN BRIDGE spanning left to right, seen from above, about 440 px long and 150 px wide, in this region's typical materials
Cell 2: CLOSED BRIDGE: the same bridge raised on the left bank like a drawbridge (planks tilted up, two chains), glowing barrier, small padlock
Cell 3: BOSS ARENA ENTRANCE gate arch seen from above in this region's architecture, small crown ornament, no religious symbols
Row 2 = family DA (East Asia: curved tiled roofs, red lacquered wood):
Cell 4: OPEN BRIDGE (same rules)
Cell 5: CLOSED BRIDGE (same rules)
Cell 6: BOSS ARENA ENTRANCE (same rules)
```

```
Sheet J11: journey pieces for two World Tour region families. Grid 3 x 2. Water is the same friendly blue everywhere.
Row 1 = family KA (North America: log cabins, pine forest, canyon rock):
Cell 1: OPEN BRIDGE spanning left to right, seen from above, about 440 px long and 150 px wide, in this region's typical materials
Cell 2: CLOSED BRIDGE: the same bridge raised on the left bank like a drawbridge (planks tilted up, two chains), glowing barrier, small padlock
Cell 3: BOSS ARENA ENTRANCE gate arch seen from above in this region's architecture, small crown ornament, no religious symbols
Row 2 = family LA (Latin America: colourful plaster, Inca stone, tropical plants):
Cell 4: OPEN BRIDGE (same rules)
Cell 5: CLOSED BRIDGE (same rules)
Cell 6: BOSS ARENA ENTRANCE (same rules)
```

### J12: Ortak parçalar

```
Sheet J12: shared journey pieces. Grid 3 x 2.
Cell 1: RIVER TILE, opaque, seamless top-to-bottom, friendly bright blue water with soft green banks and pebbles (360 px strip)
Cell 2: journey-bar icon: a tiny rolled map with a dotted path (start)
Cell 3: journey-bar icon: a small wooden bridge seen from the side (cleared gate)
Cell 4: journey-bar icon: a small padlock on a bridge (closed gate)
Cell 5: journey-bar icon: a golden crown on a small cushion (boss)
Cell 6: journey-bar icon: a cute white ghost with a tiny counter bubble (remaining ghosts; leave the bubble empty)
```

