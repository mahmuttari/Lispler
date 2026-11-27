# Hayalet Avcıları: harita yerleşim planları için ChatGPT istem paketi (Y01–Y03)

Hazırlandı: 27 Kasım 2026. Kullanıcı: *"Harita yerleşimlerini de ChatGPT yapsın, mantıklı ve güzel bir şekilde."*

Bugün yolculuk haritasının her bölgesinde göl, anıt, nesne, duvar ve yuvalar tohumlu rastgele dağılıyor. Bu paket ChatGPT'ye
bölge **yerleşim planları** tasarlatır: kompozisyonu olan, gezinmesi mantıklı, göze güzel gelen sahneler. Çıktı resim değil,
**JSON metnidir**. Oyun planı okur, bölgeye ölçekler, geçemeyeceği bir şey varsa o öğeyi atlar (oyun hep oynanabilir kalır).

## Yerel Claude için iş sırası

1. Chrome'da chatgpt.com, yeni sohbet (görsel üretimi gerekmez, metin yanıtı).
2. Aşağıdaki **ANA İSTEM**'i gönder, ardından Y01, Y02, Y03'ü sırayla iste.
3. Her yanıttaki JSON'u olduğu gibi `gorsel/hamyerlesim/<KOD>.json` olarak kaydet (Y01.json, Y02.json, Y03.json). Yanıtta JSON
   dışında metin varsa yalnız JSON dizisini al; geçerli JSON olduğunu `python3 -m json.tool` ile denetle.
4. Her dosyadan sonra commit ve push; ilerlemeyi `gorsel/hamyerlesim/DURUM.md`'ye yaz. Kullanıcı onayı beklenmez.

## ANA İSTEM

```
You are the level designer of a cute top-down 2D action game ("ghost hunters"). The world is a long horizontal journey split into
zones. Each ZONE INTERIOR is a rectangle 830 units wide and 860 units tall (x grows to the right, y grows DOWN). The player (a
child hunter, about 50 units tall) enters every zone from the LEFT edge and leaves through a bridge on the RIGHT edge. The entry
and exit heights change per zone, so a free winding walking corridor about 260 units wide must always exist from the left edge to
the right edge; the game will carve the exact path, your layout must leave room for it and should GUIDE it with open ground.

Design zone layouts that look composed and natural, like a hand-made level: a clear focal point, clusters instead of uniform
scatter, open plazas, framing of the path, negative space, foreground/background balance, things placed where they make sense
(a lake in a hollow with reeds, ruins around a plaza, a garden beside a cottage, rocks at cliff edges). Never a grid.

Coordinates are NORMALIZED to the zone interior: u = x / 830 (0 = left edge, 1 = right edge), v = y / 860 (0 = top, 1 = bottom).
Sizes w, h are also normalized (w = width / 830, h = height / 860).

Element types (use only these):
- "gol": a lake (w 0.14-0.30, h 0.10-0.24). At most 1 per zone, or none. Keep it at least 0.08 away from zone edges.
- "anit": the zone's landmark (a big theme monument or country landmark), w and h 0.12-0.22. Exactly 1 per zone.
- "obje": a smaller themed object (statue, tree group, stall, cart, flowerbed...), w and h 0.08-0.14. 3-6 per zone.
- "duvar": a wall / ruin / cliff segment, a thin rectangle (one side 0.05-0.08, the other 0.12-0.30). 0-4 per zone.
- "yuva": a ghost lair (a crypt, cave or hollow tree the ghosts come out of), point only (u, v). Exactly 4 per zone, near the
  zone's outer areas (top or bottom thirds, never on the walking corridor), at least 0.30 apart from each other.
- "donati": a small decoration cluster (barrels, crates, fences, lamps, haystacks...), point + "adet" (2-5). 3-6 per zone.
- "meydan": an open plaza that must stay empty (u, v, r with r 0.08-0.16): a resting clearing on the path.
- "yol": the suggested walking path as 4-7 points [[u, v], ...] from u = 0 to u = 1, smooth and winding, never through elements.
Rules: elements must not overlap each other (keep a gap of at least 0.03), must stay inside 0.03..0.97, and must not sit on the
"yol" line or inside a "meydan". Lakes and walls must never cut the corridor.

Answer with ONLY a JSON array, no commentary. Each layout object:
{"id": "short-name", "fikir": "one short sentence describing the scene in Turkish", "uygun": ["her"] or a list of mood tags,
 "ogeler": [ {"tip": "gol", "u": .., "v": .., "w": .., "h": ..}, {"tip": "yuva", "u": .., "v": ..},
             {"tip": "donati", "u": .., "v": .., "adet": 3}, {"tip": "meydan", "u": .., "v": .., "r": ..}, ... ],
 "yol": [[0, 0.5], [0.3, 0.42], ...]}
```

## Paftalar

```
Y01: Give 8 different zone layouts for any theme ("uygun": ["her"]). Make them clearly different from each other: lake hollow,
ruins around a plaza, a winding valley between two cliff walls, a garden village, a crossroads with a landmark in the middle,
a narrow pass that opens into a wide meadow, a riverside bend (the lake on one side), a scattered grove with clearings.
```

```
Y02: Give 8 more layouts with mood tags, 2 for each: "sakin" (calm, wide open), "dar" (tighter, more walls, still a 260-unit
corridor), "kalabalik" (busy market or village feeling, many objects and decorations), "gizemli" (mysterious, lairs framing a
dark plaza, the landmark hidden behind walls).
```

```
Y03: Give 6 layouts for the final boss arena approach and the start area: "uygun": ["baslangic"] for 3 layouts of the starting
zone (calm, welcoming, a signpost plaza "meydan" near u 0.2 and the path leaving to the right, lairs far right only), and
"uygun": ["arena"] for 3 layouts of the boss arena (a big central "meydan" r 0.18-0.22 around u 0.5 v 0.5 kept empty for the
fight, objects and lairs around the rim, no lake in the middle).
```

## Oyuna bağlama (bulut Claude ve Evren)

`araclar/yerlesim_derle.py`: `gorsel/hamyerlesim/Y*.json` dosyalarını doğrular (tip, aralık, çakışma, yol uçları) ve
`www/yerlesim-sablonlari.js` olarak yazar. `www/yolculuk.js` yolculukHaritaKur her bölge için tohumlu bir şablon seçer, ölçekler,
geçerli öğeleri yerleştirir; çakışan ya da koridoru kesen öğeyi atlar, eksik kalanları bugünkü tohumlu rastgele yerleşimle
tamamlar. Şablonun "yol" noktaları zemin katmanındaki patikaya yön verir.
