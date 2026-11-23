# Hayalet Avcıları: arayüz görselleri için ChatGPT istem paketi

Hazırlandı: 23 Kasım 2026 (oyun 3.19.0). Kullanıcının isteği şuydu: *"oyun arayüzünü zenginleştirelim, karakter
özellikleri daha zengin bir içerikle yazılsın, GPT'ye görselleri yaptırt, oyunun genel durumuna bak, her tarafını
güzelleştir."* Bu paket menü, karakter, mağaza ve oyun sonu ekranlarındaki emoji simgelerin yerine 3D görünümlü simge
ve görseller ürettirir. Üslup, onaylı karakter paftalarıyla (`gorsel/ham3d/D01–D06`) aynıdır. Kodu Evren yazar:
kullanıcının kararı "kodlama için sadece Evren kullan". Resim gelmezse oyun bugünkü emojiyle çalışır.

## Yerel Claude için iş sırası

1. ChatGPT'de **yeni bir sohbet** aç ve aşağıdaki **ARAYÜZ ANA İSTEMİ**'ni bir kez gönder.
2. Her paftaya üslup referansı olarak **onaylı D paftalarından birini** ekle:
   - U01 için `ham3d/D01.png`, `D02.png` ve `D03.png`;
   - U02 için `ham3d/D04.png`, `D05.png` ve `D06.png`;
   - kalan paftalar için herhangi biri (ör. `D01.png`).
3. Her resmi `gorsel/hamui/<KOD>.png` olarak kaydet (`U01.png` … `U10.png`). Her paftadan sonra commit ve push yap.
   İlerlemeyi `gorsel/hamui/DURUM.md` dosyasına yaz.
4. **U01, U02 ve U09'u kullanıcıya göster; onay gelmeden sonrakine geçme.** Simge paftalarını (U03–U08, U10) toplu
   göstermek yeterli.
5. Kullanıcının karakter kuralları burada da geçerlidir (`ham3d/DURUM.md`):
   - cinsiyetler belirgin: Kinkin, Veryi, Kornet, Kenit, Ponko ve Fanatik erkek; Marli, Güllu, Rani, Beri, Silsen ve
     Serçin kız;
   - açık kostüm yok: kollar en az dirseğe, bacaklar en az dize kadar kapalı;
   - makyaj yok; oranlar genç kahraman oranı.
6. Giriş, şifre, ödeme ve ChatGPT'nin görsel sınırı kullanıcıya bırakılır. Oyun koduna dokunma.

Toplam **10 pafta**. Sınır dolarsa ertesi gün kalınan yerden devam edilir.

---

## ARAYÜZ ANA İSTEMİ (yeni sohbette bir kez)

```
You are the lead UI artist for "Ghost Hunters" (Hayalet Avcıları), a top-down mobile arcade game for ages 13+.
The 12 hunter characters were already redesigned as stylized 3D-rendered characters (I will attach the approved sheets
as style reference). Now we need GAME UI ART in exactly the same style.

STYLE (identical on every sheet)
- Stylized 3D render like a premium casual mobile game: smooth vinyl-toy / soft clay materials, soft studio lighting
  from the top-left, gentle rim light, subtle ambient occlusion, rounded forms, saturated harmonious colors.
- Icons must read clearly at 48 px: one bold central object, chunky silhouette, slight 3/4 view, no tiny details.
- Characters keep EXACTLY the approved designs: same faces, hair, outfits, colors and signature weapons.
  Boys stay boys and girls stay girls; no revealing clothes (sleeves at least to the elbow, legs covered at least to
  the knee), no make-up, confident friendly faces.
- Ghosts in this game are cute-spooky: white or pale-lilac sheet ghosts with big dark eyes, never gory.
- No text, letters, numbers, logos, frames, grid lines or watermarks anywhere. Do not copy any existing game, film
  or brand.

FORMAT
- One PNG per sheet, exactly 1536 x 1024 px (U09: 1024 x 1536), TRANSPARENT background, no ground, no cast shadow.
- Each sheet says its grid. Every subject stays fully inside its cell with at least 24 px empty margin and is
  centered in its cell.

Reply only with the image. Confirm you understood by saying "ready".
```

## Paftalar

Izgara **3 sütun × 2 satır**, hücre 512 × 512; üst satır soldan sağa 1-2-3, alt satır 4-5-6. U09 tek resimdir.

### U01–U02: Kahraman kartları (karakterler ekranı, eylem pozu)

Karakter ayakta değil, **eylem anında**: koşarken, ateş ederken ya da gücünü kullanırken. Silahı elinde. Hücreye sığan,
dinamik, hafif aşağıdan bakan bir kahraman pozu.

```
Sheet U01: hero action poses of six hunters, same 3D style as the attached approved sheets, each holding its signature
weapon. Grid 3 x 2 (512 px cells). Dynamic heroic action, full body, slightly low camera angle, facing right.
Cell 1: Kinkin (boy, blue outfit, brown hair) sprinting forward and firing his silver energy pistol, cyan lightning
        sparks trailing behind his feet
Cell 2: Veryi (boy, brown outfit, dark brown hair) mid-swing with his huge studded war hammer, small shockwave dust
Cell 3: Kornet (boy, purple fluffy body, white skull-like face) raising his crystal staff, three small purple magic
        orbs fanning out from the crystal
Cell 4: Marli (girl, green outfit, brown hair, backpack) aiming her compact crossbow, a few gold coins flying toward her
Cell 5: Kenit (boy, black hooded cloak, glowing red eyes) dashing through a translucent ghost with his small dagger,
        faint shadow trail
Cell 6: Ponko (boy, red shirt, wide cowboy hat) spinning his cowboy revolver and firing, small orange muzzle flash
```

```
Sheet U02: hero action poses of six hunters, same 3D style as the attached approved sheets, each holding its signature
weapon. Grid 3 x 2 (512 px cells). Dynamic heroic action, full body, slightly low camera angle, facing right.
Cell 1: Güllu (girl, pink outfit, golden crown) drawing her tall bow, a glowing arrow ready to fly
Cell 2: Rani (girl, turquoise outfit, black side buns) pulling her slingshot, a small pink healing heart floating
        above her
Cell 3: Beri (girl, red-pink outfit, lollipop beret) throwing candy balls in five directions, standing ankle-deep
        in a small splash of water
Cell 4: Fanatik (boy, white karate gi, red headband, black belt) in a flying spin kick with his red nunchaku,
        swirling wind ring around him
Cell 5: Silsen (girl, green dress, brown hair) twirling her flower flag wand with a daisy on top, eight small daisy balls blooming out
        in a ring
Cell 6: Serçin (girl, mustard outfit, black hair, little beak mask) throwing three striped feathers that curve toward a ghost
```

### U03–U04: Özel güç simgeleri (yuvarlak rozet)

Her biri **yuvarlak bir rozet**: renkli parlak 3D disk, ortasında gücü anlatan tek nesne. Rozet kenarı ince, açık
renkli halka.

```
Sheet U03: six round power badges, same 3D style. Grid 3 x 2 (512 px cells). Each badge: glossy colored disc with
a thin light rim, one bold central object, about 400 px wide.
Cell 1: "Lightning Speed": yellow disc, a winged sneaker with a lightning bolt
Cell 2: "Super Damage": red disc, a cracked boulder bursting with an orange impact star
Cell 3: "Triple Shot": purple disc, three magic orbs fanning out from one point
Cell 4: "Giant Magnet": blue disc, a big red-and-silver horseshoe magnet pulling two gold coins
Cell 5: "Ghost Mode": deep violet disc, a crescent moon with a translucent hooded silhouette
Cell 6: "Rapid Fire": orange disc, a flaming bullet with speed lines
```

```
Sheet U04: six round power badges, same 3D style. Grid 3 x 2 (512 px cells). Each badge: glossy colored disc with
a thin light rim, one bold central object, about 400 px wide.
Cell 1: "Blast Hit": dark red disc, a round cartoon bomb with a lit fuse
Cell 2: "Healing Heart": pink disc, a glowing heart with a small plus sign made of light
Cell 3: "Lollipop Rain": turquoise disc, five small lollipops raining down in a fan
Cell 4: "Tornado Kick": sky-blue disc, a swirling tornado with a red nunchaku inside
Cell 5: "Flower Ring": light-green disc, a ring of eight daisies
Cell 6: "Homing Feathers": amber disc, three striped feathers curving toward a tiny ghost
```

### U05: Geliştirme simgeleri (mağaza → geliştirmeler)

```
Sheet U05: six upgrade icons, same 3D style, no disc behind them. Grid 3 x 2 (512 px cells).
Cell 1: "Speed": a winged running shoe
Cell 2: "Damage": a glowing clenched gauntlet fist with an impact star
Cell 3: "Fire Rate": three bullets with speed lines and a small stopwatch
Cell 4: "Range": a red-and-white target with a glowing arrow line reaching it
Cell 5: "Health": a big glossy red heart with a soft shine
Cell 6: "Magnet": a horseshoe magnet with sparkles
```

### U06: Para birimleri ve ödüller

```
Sheet U06: six currency and reward icons, same 3D style. Grid 3 x 2 (512 px cells).
Cell 1: a small pile of three shiny gold coins with a ghost emblem on the top coin
Cell 2: a big sparkling blue diamond
Cell 3: a glowing green emerald, cut like a gem
Cell 4: a golden trophy cup with two handles and a small ghost on the lid
Cell 5: three medals side by side on ribbons: gold, silver and bronze (no numbers on them)
Cell 6: a wooden treasure chest, lid open, gold coins and a green emerald glowing inside
```

### U07–U08: Menü simgeleri

```
Sheet U07: six menu icons, same 3D style, no disc behind them. Grid 3 x 2 (512 px cells).
Cell 1: "Play": a big glossy green play-triangle button with a tiny ghost peeking from behind
Cell 2: "Characters": two hunter silhouettes standing together (simplified Kinkin and Güllu busts)
Cell 3: "Shop": a small striped shop awning stand with a gold coin on the counter
Cell 4: "Champions": a golden trophy on a small podium
Cell 5: "World Tour": a stylized globe with a red map pin on it
Cell 6: "Online": a globe with two small hunter busts and a signal arc between them
```

```
Sheet U08: six menu icons, same 3D style, no disc behind them. Grid 3 x 2 (512 px cells).
Cell 1: "Friends": two hunter busts side by side, waving
Cell 2: "Account": a round avatar badge with a hunter bust inside and a small key
Cell 3: "Sound": a speaker with sound waves and a small music note
Cell 4: "Language": a speech bubble with a small globe inside
Cell 5: "Achievements": a star-shaped medal on a ribbon
Cell 6: "Settings": a chunky cog wheel
```

### U09: Giriş ekranı kahraman resmi (tek resim, dikey)

```
Image U09: welcome-screen hero art, 1024 x 1536 px portrait, TRANSPARENT background. Same 3D style as the attached
approved sheets. A heroic group of six hunters in the lower two thirds, standing together on nothing (no ground),
facing the viewer in confident poses with their signature weapons: Kinkin in the front center with his energy pistol,
Güllu and Fanatik on either side of him, Kornet, Marli and Serçin slightly behind. Above and behind them, in the upper
third, three cute-spooky sheet ghosts float with surprised faces. Leave the top 20% of the image EMPTY (the game puts
its title there). No text.
```

### U10: Oyun sonu ve olay amblemleri

```
Sheet U10: six game-event emblems, same 3D style. Grid 3 x 2 (512 px cells). No text, letters or numbers.
Cell 1: "Victory": a golden star burst with a laurel wreath and small confetti
Cell 2: "Game Over": a cute ghost holding a broken hunter's flashlight, sad-funny face
Cell 3: "New Record": a red ribbon banner (blank, no text) with a gold star in the middle
Cell 4: "Boss Warning": a menacing big ghost face with a crown, red glow behind it
Cell 5: "Level Up": an upward glowing arrow with sparkles
Cell 6: "Gift": a wrapped present box with a ghost-shaped bow
```

---

## Bulut Claude'un yapacakları (ChatGPT'ye gönderilmez)

`araclar/gorsel_kes.py` paftaları keser, WebP yapar ve `www/gorsel/liste.js`'e ekler. Ad düzeni şöyledir:

| Pafta | Dosya adı | Kullanılan yer |
|---|---|---|
| U01–U02 | `kart-<kar>` | Karakterler ekranındaki kart ve ayrıntı paneli |
| U03–U04 | `guc-<kar>` | Güç rozeti: ayrıntı paneli, oyundaki güç düğmesi |
| U05 | `gel-hiz`, `gel-hasar`, `gel-atis`, `gel-menzil`, `gel-can`, `gel-miknatis` | Mağaza → geliştirmeler |
| U06 | `ui-para`, `ui-elmas`, `ui-zumrut`, `ui-kupa`, `ui-madalya`, `ui-sandik` | Kaynak çubukları, şampiyonlar |
| U07–U08 | `ui-oyna`, `ui-karakterler`, `ui-magaza`, `ui-sampiyon`, `ui-dunya`, `ui-online`, `ui-arkadas`, `ui-hesap`, `ui-ses`, `ui-dil`, `ui-basarim`, `ui-ayar` | Menü düğmeleri |
| U09 | `giris-kahraman` | Giriş ve menü ekranı |
| U10 | `ui-zafer`, `ui-yenilgi`, `ui-rekor`, `ui-boss`, `ui-seviye`, `ui-hediye` | Oyun sonu, boss uyarısı |

Simge yardımcısı (`esyaSimgesiHTML` gibi) resim varsa `<img>`, yoksa bugünkü emojiyi basar. Kod Evren'e yazdırılır,
Claude inceler ve test eder.
