# Hayalet Avcıları: Dünya Turu hikâyesi görselleri için ChatGPT istem paketi

Hazırlandı: 24 Kasım 2026 (oyun 3.21.0, hikâye şartnamesi `../HIKAYE.md`). Kullanıcının isteği: *"hikâye metni gelince
bana göster, görselleri ChatGPT yaptır"*. Bu paket Dünya Turu hikâyesinin görsellerini ürettirir:
- Dostluk Haritası,
- açılış ve final resimleri,
- on bölümün resimleri (bilmece çözülünce açılan "📖 Bölüm" sahnesi),
- üç küçük animasyon paftası (eve dönen hayalet, yanan fener, hatıra pırıltısı),
- 51 ülkenin hatıra simgeleri.

Hikâye metni Gemini sürümüdür (`../hikaye-taslaklari/gemini/HIKAYE-METIN.md`; kullanıcının seçimi, 25 Kasım 2026).
"Basit illüstrasyonlu animasyon" şöyle kurulur: bölüm resimleri tek kare çizilir, kod onları yavaşça yakınlaştırıp kaydırır
(Ken Burns) ve üstüne pırıltı ile süzülen hayalet çizer. Kare kare oynayan döngüler A paftalarından gelir; aynı paftada
çizildikleri için kareler birbirini tutar.

Üslup, onaylı karakter paftalarıyla (`ham3d/D01–D06`) ve arayüz paftalarıyla (`hamui/U01–U10`) aynıdır. Kodu Evren
yazar. Resim gelmezse oyun emoji ve kod çizimiyle çalışır.

## Yerel Claude için iş sırası

1. ChatGPT'de **yeni bir sohbet** aç ve aşağıdaki **HİKÂYE ANA İSTEMİ**'ni bir kez gönder.
2. Üslup referansı ekle:
   - H12 için `ham3d/D01.png` … `D06.png`;
   - kalan paftalar için `hamui/U06.png` ve `ham3d/D01.png`.
3. Her resmi `gorsel/hamhikaye/<KOD>.png` olarak kaydet. Her paftadan sonra commit ve push yap, ilerlemeyi
   `gorsel/hamhikaye/DURUM.md`'ye yaz.
4. **Sıra:** H10, H11, H12, B01–B10, A01–A03, sonra H01–H09.
5. **Kullanıcı onayı:** H10, H11 ve H12'yi kullanıcıya tek tek göster; onay gelmeden sonrakine geçme. Hatıra paftalarını
   (H01–H09) toplu göstermek yeterli; B paftaları beşer beşer, A paftaları birlikte gösterilir.
6. **Karakter kuralları** (`ham3d/DURUM.md`):
   - Kinkin, Veryi, Kornet, Kenit, Ponko ve Fanatik erkek; Marli, Güllu, Rani, Beri, Silsen ve Serçin kız.
   - Açık kostüm yok, makyaj yok.
7. **İçerik kuralı:** din, siyaset, bayrak, harita üzerinde sınır çizgisi ve yazı yok.
8. Giriş, şifre, ödeme ve ChatGPT'nin görsel sınırı kullanıcıya bırakılır. Oyun koduna dokunma.

Toplam **25 pafta**: 3 resim (H10–H12), 10 bölüm resmi (B01–B10), 3 animasyon paftası (A01–A03) ve 9 hatıra paftası (H01–H09).

---

## HİKÂYE ANA İSTEMİ (yeni sohbette bir kez)

```
You are the lead artist for the World Tour STORY of "Ghost Hunters" (Hayalet Avcıları), a cheerful top-down mobile game
for ages 13+. I will attach approved character and UI sheets as style reference.

STORY: a traveling hunter finds an old "Friendship Map" in Istanbul whose pieces have faded. Ghosts in this game are not
evil: they are lonely spirits who lost their way home. The hunters befriend each other on a journey through 51
countries; at the end, at the lighthouse at the end of the world (southern tip of South America), the friends light
the "Friendship Beacon" together and its light guides the ghosts home. Theme: friendship, warmth, wonder.

STYLE (identical on every sheet)
- Stylized 3D render like a premium casual mobile game: smooth vinyl-toy / soft clay materials, soft studio lighting
  from the top-left, gentle rim light, subtle ambient occlusion, rounded forms, saturated harmonious colors.
- Characters keep EXACTLY the approved designs. Boys stay boys and girls stay girls; no revealing clothes, no make-up,
  confident friendly faces.
- Ghosts are cute: white or pale-lilac sheet ghosts with big dark eyes and soft smiles, never scary or gory.
- No text, letters, numbers, logos, flags, borders between countries, religious symbols or watermarks anywhere.
  Do not copy any existing game, film or brand.

FORMAT
- Icon sheets: one PNG, exactly 1536 x 1024 px, TRANSPARENT background, grid 3 x 2 (512 px cells), every object fully
  inside its cell with at least 24 px margin, centered, one bold object per cell, slight 3/4 view, readable at 48 px.
- Illustrations: one PNG, exactly 1536 x 1024 px, full scene, opaque background.

Reply only with the image. Confirm you understood by saying "ready".
```

## Resimler

### H10: Dostluk Haritası (defter ve bilmece ekranı)

Kod bu resmi 10 parçaya bölüp parçaları bilmece çözüldükçe açar; resmin kendisinde parça çizgisi olmasın.

```
Illustration H10: the "Friendship Map", a whole stylized world map drawn on an old warm parchment, seen from straight
above, filling the whole 1536 x 1024 image (no table, no hands). Soft painted continents in gentle greens and sand
colors, light-blue oceans with tiny painted waves, a few cute ghost doodles and small compass-rose ornament in a corner.
A dotted golden travel route starts in Turkey, goes through Europe, down around Africa, across the Middle East and
Asia, over the Pacific to North America and down to the southern tip of South America, where a tiny glowing lighthouse
stands. No text, no labels, no country borders, no flags.
```

### H11: Açılış (hikâyenin ilk sahnesi)

Gezgin her avcı olabildiği için resimde avcı yoktur.

```
Illustration H11: a cozy old attic in Istanbul at golden sunset. An opened wooden travel chest in the center; inside,
a rolled old parchment map is glowing softly with golden light and tiny sparkles. Through a round window: the
Bosphorus with ferries and seagulls and the silhouette of the Galata Tower. A small friendly ghost peeks curiously
from behind the chest. Warm, magical, inviting mood. No people, no text.
```

### H12: Final (dünyanın ucundaki fener)

```
Illustration H12: all twelve hunters of the attached approved sheets standing together on rocky ground in front of a
red-and-white striped lighthouse at the southern tip of South America at dusk, cheering and holding hands, some
waving. The lighthouse lamp shines a big warm golden beam across a calm sea; dozens of happy little ghosts float along
the beam toward the horizon, waving goodbye. Sky in soft purple, pink and orange; first stars appearing. Keep every
hunter EXACTLY as in the approved sheets (faces, hair, outfits, colors, signature weapons). No text.
```

## Bölüm resimleri (B01–B10)

Bilmece çözülünce okunan "📖 Bölüm" metninin resmidir. Kod resmi yavaşça yakınlaştırır ve pırıltı ekler; resmin kendisi
durgun bir sahnedir. Gezgin her avcı olabildiği için yüzü görünen avcı yoktur (B07 ve B09 yalnız siluet ya da el).

### B01: the friendly truth

```
Illustration B01 (chapter "the friendly truth"): A twilight meadow with a few small lost ghosts floating timidly toward the viewer, each holding out a tiny paw as if asking for help; one ghost has a single small tear. A soft glowing corner of an old parchment map hovers in the foreground with sparkles. Gentle, a little sad but hopeful. No text, no letters, no flags.
```

### B02: the old glow

```
Illustration B02 (chapter "the old glow"): A night sky over rolling hills: long ago a soft golden glow in the sky made a shimmering path, and a line of happy little ghosts follows it home. In the foreground the same hills today, with the glow missing and a few ghosts drifting in the wind. No text, no letters, no flags.
```

### B03: the faded lighthouse

```
Illustration B03 (chapter "the faded lighthouse"): The southern end of an old parchment map close up: a tiny drawing of a dark, unlit lighthouse on icy rocks, the drawing just starting to glow faintly; sparkles rise from the map. Warm candle light at the edges. No text, no letters, no flags.
```

### B04: what dimmed the flame

```
Illustration B04 (chapter "what dimmed the flame"): Inside the top of the lighthouse: a big glass globe with a tiny, shrinking golden flame. Around the globe, faded memories drift like soap bubbles: two kids waving hello, friends sharing bread, someone listening to a friend. Quiet blue night colors with a warm core. No text, no letters, no flags.
```

### B05: the glass globe

```
Illustration B05 (chapter "the glass globe"): The empty glass globe of the lighthouse, shown like a jewel, with small warm sparks from different lands floating into it: a musical note, a little cup, a spinning top, a flower. Magical and hopeful. No text, no letters, no flags.
```

### B06: warm keepsakes

```
Illustration B06 (chapter "warm keepsakes"): An open cozy travel backpack on a wooden table, softly glowing from inside; a few keepsakes peek out (a copper coffee pot, a fan, a small flute, a croissant); golden lines rise from them and draw glowing routes between continents on a parchment map behind. No text, no letters, no flags.
```

### B07: friends are little stars

```
Illustration B07 (chapter "friends are little stars"): A dark night path seen from behind: several hunters (silhouettes only, as small cute figures, no details needed) walking side by side; above each one a small star shines, and together the stars make a bright constellation lighting the path. No text, no letters, no flags.
```

### B08: the blue route

```
Illustration B08 (chapter "the blue route"): A wide ocean at sunset with a shining blue route line drawn across the waves like a ribbon; a cheerful group of little ghosts happily follows a small sailing boat along the route, humming (tiny music notes). No text, no letters, no flags.
```

### B09: almost complete

```
Illustration B09 (chapter "almost complete"): The whole parchment Friendship Map glowing like sunshine, except the icy southern tip, which stays dark blue; several small hands of different skin tones reach toward the dark corner together (hands only, no faces). No text, no letters, no flags.
```

### B10: to the end of the world

```
Illustration B10 (chapter "to the end of the world"): Dramatic but cozy view of the red-and-white lighthouse on the rocky southern tip of the world at dusk, still unlit, with the fully glowing Friendship Map floating above the sea like a golden banner and a dotted golden path leading to the lighthouse door. No text, no letters, no flags.
```

## Animasyon paftaları (A01–A03)

Her pafta **1536 x 1024, saydam arka plan, 3 x 2 ızgara (512 px hücre)**; 6 hücre soldan sağa, üstten alta bir döngünün
kareleridir. Kod kareleri sırayla oynatır (8–10 kare/sn). Hücreler arasında nesnenin boyu, yeri ve ışığı aynı kalmalıdır.

### A01: eve dönen hayalet

```
Animation sheet A01 (6 frames, grid 3 x 2, transparent background): one cute white sheet ghost with big dark eyes, the same
size and centered in every cell, floating gently up and down and waving goodbye with one little arm: frame 1 arm down,
frames 2-4 arm rising and waving, frames 5-6 arm coming down; the body bobs 10 px up then back. A few tiny golden sparkles
trail below it, moving slightly between frames. Keep the ghost identical in every frame except the arm, bob and sparkles.
```

### A02: Dostluk Feneri yanıyor

```
Animation sheet A02 (6 frames, grid 3 x 2, transparent background): the top of the red-and-white lighthouse (lamp room and
roof only), identical size and position in every cell. Frame 1: lamp dark. Frames 2-3: a small golden spark appears and
grows inside the glass globe. Frame 4: the globe is bright. Frames 5-6: a warm golden beam and soft rays shine out, the
glow pulsing slightly bigger in frame 6. Keep the tower drawing identical; only the light changes.
```

### A03: hatıra pırıltısı

```
Animation sheet A03 (6 frames, grid 3 x 2, transparent background): a magical golden sparkle burst used when a keepsake is
picked up, centered in every cell: frame 1 a tiny bright dot, frames 2-4 a ring of star-shaped sparkles expanding with
soft golden glow, frames 5-6 the sparkles fading and drifting outward. No object in the middle, only the effect.
```

## Hatıra paftaları (H01–H09)

Hücre sırası, rota sırasıdır (ülke 1 = H01 hücre 1, ülke 7 = H02 hücre 1, …; H09'da yalnız 3 hücre dolu).

Hücre listesi Gemini sürümünden alındı (25 Kasım 2026). Her paftada 6 hücre vardır; ülke sırası soldan sağa, üstten
alta gider. Simge, oyunda resim gelmezse görünen emojidir.

### H01: ülke 1–6

```
Icon sheet H01 (keepsakes of the World Tour; grid 3 x 2, cells left-to-right, top-to-bottom). Each cell: one
small hand-crafted cultural object, cute and premium, as a collectible keepsake with a faint warm golden glow at its edge.
1. small long-handled hand-hammered copper Turkish coffee pot (cezve) with frothy coffee
2. carved wooden Ukrainian sopilka folk flute
3. warm golden polished Baltic amber stone with a tiny trapped leaf
4. knotted salted pretzel with coarse salt crystals
5. small flower-patterned tin tea caddy with lid slightly open
6. buttery flaky croissant
```

| Hücre | Ülke | Simge | Hatıra |
|---|---|---|---|
| 1 | 1. Türkiye | ☕ | Bakır Kahve Cezvesi |
| 2 | 2. Ukrayna | 🎶 | Ahşap Sopilka Flütü |
| 3 | 3. Polonya | 💎 | Baltık Kehribar Taşı |
| 4 | 4. Almanya | 🍞 | Düğümlü Tuzlu Brezel |
| 5 | 5. Birleşik Krallık | 🍵 | Çiçekli Çay Kutusu |
| 6 | 6. Fransa | 🥐 | Tereyağlı Çıtır Kruvasan |

### H02: ülke 7–12

```
Icon sheet H02 (keepsakes of the World Tour; grid 3 x 2, cells left-to-right, top-to-bottom). Each cell: one
small hand-crafted cultural object, cute and premium, as a collectible keepsake with a faint warm golden glow at its edge.
1. colorful Venetian carnival mask with gold trim (no face inside)
2. hand-painted wooden Spanish hand fan, half open
3. pair of soft yellow leather Moroccan babouche slippers
4. desert rose: a natural sand-colored crystal cluster shaped like petals
5. gourd shaker rattle wrapped in a colorful bead net
6. wooden oware board with smooth seed pebbles
```

| Hücre | Ülke | Simge | Hatıra |
|---|---|---|---|
| 1 | 7. İtalya | 🎭 | Venedik Karnaval Maskesi |
| 2 | 8. İspanya | 💃 | Boyalı El Yelpazesi |
| 3 | 9. Fas | 👞 | Deri Babuş Terliği |
| 4 | 10. Cezayir | 🌹 | Kristal Kum Çiçeği |
| 5 | 11. Fildişi Sahili | 🎊 | Boncuklu Kabak Çıngırağı |
| 6 | 12. Gana | 🎲 | Oware Oyun Taşları |

### H03: ülke 13–18

```
Icon sheet H03 (keepsakes of the World Tour; grid 3 x 2, cells left-to-right, top-to-bottom). Each cell: one
small hand-crafted cultural object, cute and premium, as a collectible keepsake with a faint warm golden glow at its edge.
1. folded indigo-dyed cotton cloth with wave and star patterns
2. likembe thumb piano: small wooden box with metal tines
3. small carved wooden 'thinker' figurine resting head in hands
4. paper pouch of red rooibos tea with loose red leaves
5. bunch of small sun-dried red piri piri chili peppers
6. bundle of dark vanilla pods tied with string
```

| Hücre | Ülke | Simge | Hatıra |
|---|---|---|---|
| 1 | 13. Nijerya | 🎀 | Çivit Boyalı Kumaş |
| 2 | 14. Kongo DC | 🎹 | Likembe Parmak Piyanosu |
| 3 | 15. Angola | 🗿 | Düşünen Tahta Heykelcik |
| 4 | 16. Güney Afrika | 🌿 | Kırmızı Rooibos Çayı |
| 5 | 17. Mozambik | 🌶️ | Piri Piri Biberi |
| 6 | 18. Madagaskar | 🌱 | Siyah Vanilya Çubuğu |

### H04: ülke 19–24

```
Icon sheet H04 (keepsakes of the World Tour; grid 3 x 2, cells left-to-right, top-to-bottom). Each cell: one
small hand-crafted cultural object, cute and premium, as a collectible keepsake with a faint warm golden glow at its edge.
1. small bright Tingatinga-style painting of a cheerful animal on a mini easel
2. folded cinnamon-brown bark cloth
3. smooth polished carved soapstone figurine of a little animal
4. small heap of roasted coffee beans in a woven saucer
5. dried ruby-red hibiscus flowers in a little bowl
6. rolled papyrus scroll with painted plants (no writing)
```

| Hücre | Ülke | Simge | Hatıra |
|---|---|---|---|
| 1 | 19. Tanzanya | 🎨 | Tingatinga Küçük Tablo |
| 2 | 20. Uganda | 🍂 | Mutuba Kabuk Kumaşı |
| 3 | 21. Kenya | 💠 | Oyma Sabuntaşı Figürü |
| 4 | 22. Etiyopya | 🌰 | Kavrulmuş Kahve Çekirdeği |
| 5 | 23. Sudan | 🌺 | Kurutulmuş Karkade Çiçeği |
| 6 | 24. Mısır | 📜 | Papirüs Çizim Rulosu |

### H05: ülke 25–30

```
Icon sheet H05 (keepsakes of the World Tour; grid 3 x 2, cells left-to-right, top-to-bottom). Each cell: one
small hand-crafted cultural object, cute and premium, as a collectible keepsake with a faint warm golden glow at its edge.
1. small jar of thick golden honey with honey dipper
2. woven red-and-black Sadu weaving strip with geometric pattern
3. stack of white olive-oil soap bars with simple stamp marks (no letters)
4. small clay tablet with abstract wedge marks (not readable writing)
5. tiny glass vial of red saffron threads with purple crocus flowers
6. turquoise glazed ceramic tea bowl
```

| Hücre | Ülke | Simge | Hatıra |
|---|---|---|---|
| 1 | 25. Yemen | 🍯 | Altın Sidr Balı |
| 2 | 26. Suudi Arabistan | 🐪 | Sadu Dokuma Şeridi |
| 3 | 27. Filistin | 🛁 | Nablus Doğal Sabunu |
| 4 | 28. Irak | 📝 | Çivi Yazılı Tablet |
| 5 | 29. İran | 🌸 | Altın Safran Şişesi |
| 6 | 30. Özbekistan | 🔵 | Turkuaz Seramik Kâse |

### H06: ülke 31–36

```
Icon sheet H06 (keepsakes of the World Tour; grid 3 x 2, cells left-to-right, top-to-bottom). Each cell: one
small hand-crafted cultural object, cute and premium, as a collectible keepsake with a faint warm golden glow at its edge.
1. deep blue lapis lazuli stone with golden flecks
2. chunk of pale pink rock salt crystal
3. string of small brass ankle bells (ghungroo)
4. small golden woven jute basket
5. light lacquered bamboo bowl with fine engraved pattern
6. woven rattan ball (sepak takraw)
```

| Hücre | Ülke | Simge | Hatıra |
|---|---|---|---|
| 1 | 31. Afganistan | 🔷 | Lacivert Lapis Taşı |
| 2 | 32. Pakistan | 💖 | Pembe Kaya Tuzu |
| 3 | 33. Hindistan | 🔔 | Bilek Dans Zilleri |
| 4 | 34. Bangladeş | 👜 | Altın Jüt Sepeti |
| 5 | 35. Myanmar | 🍚 | Lake Bambu Kâsesi |
| 6 | 36. Tayland | ⚽ | Örgü Rattan Topu |

### H07: ülke 37–42

```
Icon sheet H07 (keepsakes of the World Tour; grid 3 x 2, cells left-to-right, top-to-bottom). Each cell: one
small hand-crafted cultural object, cute and premium, as a collectible keepsake with a faint warm golden glow at its edge.
1. wooden gasing spinning top with string
2. bamboo angklung instrument
3. capiz shell wind chime
4. metal Vietnamese phin coffee filter on a glass
5. wooden bead abacus
6. folded paper ttakji game tile (two colors)
```

| Hücre | Ülke | Simge | Hatıra |
|---|---|---|---|
| 1 | 37. Malezya | 🌀 | Ahşap Gasing Topacı |
| 2 | 38. Endonezya | 🎋 | Bambu Angklung Çalgısı |
| 3 | 39. Filipinler | 🐚 | Sedef Rüzgâr Çanı |
| 4 | 40. Vietnam | 🥛 | Metal Phin Süzgeci |
| 5 | 41. Çin | 🔢 | Ahşap Boncuklu Abaküs |
| 6 | 42. Güney Kore | 🎴 | Katlı Kâğıt Ttakji |

### H08: ülke 43–48

```
Icon sheet H08 (keepsakes of the World Tour; grid 3 x 2, cells left-to-right, top-to-bottom). Each cell: one
small hand-crafted cultural object, cute and premium, as a collectible keepsake with a faint warm golden glow at its edge.
1. origami paper crane
2. Khokhloma wooden spoon with red and gold berry pattern on black
3. small inukshuk figure of balanced stones
4. pocket harmonica
5. colorful dotted alebrije creature figurine
6. small crocheted Wayuu bag with bright geometric pattern
```

| Hücre | Ülke | Simge | Hatıra |
|---|---|---|---|
| 1 | 43. Japonya | 🐦 | Origami Kâğıt Turnası |
| 2 | 44. Rusya | 🥄 | Hohloma Ahşap Kaşığı |
| 3 | 45. Kanada | ⛰️ | Taş İnukşuk Figürü |
| 4 | 46. ABD | 🎵 | Cep Boyu Mızıka |
| 5 | 47. Meksika | 🦎 | Renkli Alebrije Figürü |
| 6 | 48. Kolombiya | 👝 | Wayuu Örgü Kesesi |

### H09: ülke 49–51

```
Icon sheet H09 (keepsakes of the World Tour; grid 3 x 2, cells left-to-right, top-to-bottom). Each cell: one
small hand-crafted cultural object, cute and premium, as a collectible keepsake with a faint warm golden glow at its edge.
1. Andean pan flute of bamboo reeds
2. pandeiro hand frame drum with metal jingles
3. carved mate gourd with metal bombilla straw
Cells 4-6 stay fully transparent and empty.
```

| Hücre | Ülke | Simge | Hatıra |
|---|---|---|---|
| 1 | 49. Peru | 🎼 | And Kamış Flütü |
| 2 | 50. Brezilya | 🥁 | Pandeiro El Tefi |
| 3 | 51. Arjantin | 🏺 | Oyma Mate Kabağı |
