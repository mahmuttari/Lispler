# Hayalet Avcıları — 3D görünümlü karakterler: ChatGPT istem paketi

Hazırlandı: 23 Kasım 2026 (oyun 3.18.0). Kullanıcının isteği: *"Yerel oturumu kullanarak ChatGPT ile karakterleri mevcut
görünümlerinden esinlenerek tamamen baştan oluşturt, 3D olsun oyun, animasyonlu bir duruşları olsun, hareketleri,
atışları animasyonlu olsun."* Kullanıcının seçimi: **3D görünümlü (2.5D)**. Karakterler 3D render görünümünde (hacimli,
ışıklı, yumuşak gölgeli) baştan çizilir; oyun motoru aynı kalır, kareler sırayla oynatılır. Kodu Evren yazar
(kullanıcının kararı: "kodlama için sadece Evren kullan").

## Yerel Claude için iş sırası

1. ChatGPT'de **yeni bir sohbet** aç. Önce aşağıdaki **3D ANA İSTEM**'i bir kez gönder.
2. **Tasarım paftaları D01–D06** (yeni görünüm, onaya sunulur): her birine eski karakter paftasını (`gorsel/ham/K1.png`
   … `K6.png`) referans olarak ekle. Her D paftasını eski K paftasıyla yan yana kullanıcıya göster; **kullanıcı
   onaylamadan sonrakine geçme**. Beğenmediği hücreyi "aynı paftayı yeniden üret, şunu değiştir: …" diye düzelt.
3. **Animasyon paftaları A01–A34** (her kostüm için bir pafta): önce **ANİMASYON İSTEMİ**'ni bir kez gönder. Her
   paftaya onaylı D paftasını ekle ve hangi hücre olduğunu söyle. Kareler aynı boyda ve aynı yerde olmalı; tasarımı
   kayan, ayakları zıplayan ya da boyu değişen pafta yeniden ürettirilir.
4. **Silah paftaları W1–W3**: onaylı D paftalarından birini üslup için ekle.
5. Her resmi `gorsel/ham3d/<KOD>.png` olarak kaydet (`D01.png`, `A07.png`, `W2.png`…), her paftadan sonra commit ve
   push. İlerlemeyi `gorsel/ham3d/DURUM.md` dosyasına yaz.
6. Giriş, şifre, ödeme ve ChatGPT'nin görsel sınırı kullanıcıya bırakılır. Oyun koduna dokunma.

Toplam **43 pafta** (6 tasarım + 34 animasyon + 3 silah). Sınır dolarsa ertesi gün kalınan yerden devam edilir.

**Kullanıcının D01 incelemesinde koyduğu sabit kurallar (23 Kasım 2026)** ChatGPT sohbetine D01 düzeltmesiyle
gönderildi ve her paftada kontrol edilir: cinsiyetler belirgin (Kinkin ve Veryi erkek); dekolte, askı, kolsuz üst
yok; kollar en az dirseğe, bacaklar en az dize kadar kapalı; göğüs görünmez; makyaj yok. Tasarım paftalarında
karakterler imza silahını 3D olarak elinde tutar; oranlar daha az bebeksi (baş boyun ~%30'u); yüz kendinden emin ve
güler yüzlü. Ayrıntı: `ham3d/DURUM.md`.

---

## 3D ANA İSTEM (yeni sohbette bir kez)

```
You are the lead character artist for "Ghost Hunters" (Hayalet Avcıları), a top-down mobile arcade game for ages 13+.
We are REDESIGNING the 12 hunter characters as STYLIZED 3D-RENDERED characters, INSPIRED BY their current flat designs
(I will attach the current sheets). Keep each character's identity so players recognize them: same name, same
silhouette idea, hairstyle or headwear, outfit colors and signature features. Everything else may be upgraded.

STYLE (identical on every sheet)
- Stylized 3D render, like a premium casual mobile game: smooth vinyl-toy / soft clay materials, soft studio lighting
  from the top-left, gentle rim light, subtle ambient occlusion, soft rounded forms, clean silhouettes.
- Proportions: chunky and cute but not babyish: big head (about 40% of height), short sturdy body, short legs.
- Readable at 64 px tall: strong silhouette, clear face, saturated harmonious colors.
- Camera: top-down game, characters seen in 3/4 front view from slightly above, FACING RIGHT.
- HANDS ARE EMPTY: no weapon, wand, bow, knife or item in the hands (the game draws weapons separately).
- Do not copy any existing game, film or brand character. No text, letters, numbers, logos, frames or grid lines.

FORMAT
- One PNG, exactly 1536 x 1024 px, TRANSPARENT background. No ground, no cast shadow (the game draws the shadow).
- Each sheet says its grid. Every subject stays fully inside its cell with at least 24 px empty margin.

Reply only with the image. Confirm you understood by saying "ready".
```

## Tasarım paftaları (D01–D06)

Izgara: **3 sütun × 2 satır**, hücre 512 × 512; üst satır soldan sağa 1-2-3, alt satır 4-5-6. Karakter hücre içinde
ayakta, yaklaşık 420 px boyunda, ayakları hücrenin alt kenarından 24 px yukarıda.
### D01 — Kinkin ve Veryi

Referans: `gorsel/ham/K1.png` (eski çizim; yeni tasarım bundan esinlenir)

```
Sheet D01: 3D redesign of the attached sheet K1, same cell order. Grid 3 x 2 (512 px cells).
Cell 1: hunter Kinkin, costume "Mavi (blue outfit, brown hair)" — inspired by cell 1 of the attached sheet
Cell 2: hunter Kinkin, costume "Pembe Prenses (pink outfit, golden hair)" — inspired by cell 2 of the attached sheet
Cell 3: hunter Kinkin, costume "Altın Efsane (gold outfit, cream hair)" — inspired by cell 3 of the attached sheet
Cell 4: hunter Veryi, costume "Klasik (brown outfit, dark brown hair)" — inspired by cell 4 of the attached sheet
Cell 5: hunter Veryi, costume "Asker (green soldier outfit, black hair)" — inspired by cell 5 of the attached sheet
Cell 6: hunter Veryi, costume "Bronz Şampiyon (bronze outfit, golden hair)" — inspired by cell 6 of the attached sheet
```
### D02 — Kornet ve Marli

Referans: `gorsel/ham/K2.png` (eski çizim; yeni tasarım bundan esinlenir)

```
Sheet D02: 3D redesign of the attached sheet K2, same cell order. Grid 3 x 2 (512 px cells).
Cell 1: hunter Kornet, costume "Mor (purple fluffy body, white skull-like face)" — inspired by cell 1 of the attached sheet
Cell 2: hunter Kornet, costume "Şeker (mint fluffy body)" — inspired by cell 2 of the attached sheet
Cell 3: hunter Kornet, costume "Galaksi Sihirbazı (sky-blue fluffy body, lilac accents)" — inspired by cell 3 of the attached sheet
Cell 4: hunter Marli, costume "Yeşil (green outfit, brown hair, backpack)" — inspired by cell 4 of the attached sheet
Cell 5: hunter Marli, costume "Mavi (blue outfit, dark hair, backpack)" — inspired by cell 5 of the attached sheet
Cell 6: hunter Marli, costume "Altın Maceracı (gold outfit, auburn hair, backpack)" — inspired by cell 6 of the attached sheet
```
### D03 — Kenit ve Ponko

Referans: `gorsel/ham/K3.png` (eski çizim; yeni tasarım bundan esinlenir)

```
Sheet D03: 3D redesign of the attached sheet K3, same cell order. Grid 3 x 2 (512 px cells).
Cell 1: hunter Kenit, costume "Karanlık (black hooded cloak, glowing red eyes)" — inspired by cell 1 of the attached sheet
Cell 2: hunter Kenit, costume "Kanlı (dark red hooded cloak)" — inspired by cell 2 of the attached sheet
Cell 3: hunter Kenit, costume "Hayalet Lordu (deep purple hooded cloak)" — inspired by cell 3 of the attached sheet
Cell 4: hunter Ponko, costume "Kırmızı (red shirt, wide cowboy hat)" — inspired by cell 4 of the attached sheet
Cell 5: hunter Ponko, costume "Sarı (orange shirt, cowboy hat)" — inspired by cell 5 of the attached sheet
Cell 6: hunter Ponko, costume "Altın Şapka (yellow shirt, golden cowboy hat)" — inspired by cell 6 of the attached sheet
```
### D04 — Güllu ve Rani

Referans: `gorsel/ham/K4.png` (eski çizim; yeni tasarım bundan esinlenir)

```
Sheet D04: 3D redesign of the attached sheet K4, same cell order. Grid 3 x 2 (512 px cells).
Cell 1: hunter Güllu, costume "Pembe (pink outfit, golden crown, bangs)" — inspired by cell 1 of the attached sheet
Cell 2: hunter Güllu, costume "Mor (purple outfit, crown)" — inspired by cell 2 of the attached sheet
Cell 3: hunter Güllu, costume "Kraliçe (light pink outfit, crown, golden hair)" — inspired by cell 3 of the attached sheet
Cell 4: hunter Rani, costume "Turkuaz (turquoise outfit, black side buns)" — inspired by cell 4 of the attached sheet
Cell 5: hunter Rani, costume "Limon (lime outfit, black buns)" — inspired by cell 5 of the attached sheet
Cell 6: hunter Rani, costume "Pırıltı (yellow outfit, purple buns)" — inspired by cell 6 of the attached sheet
```
### D05 — Beri ve Fanatik

Referans: `gorsel/ham/K5.png` (eski çizim; yeni tasarım bundan esinlenir)

```
Sheet D05: 3D redesign of the attached sheet K5, same cell order. Grid 3 x 2 (512 px cells).
Cell 1: hunter Beri, costume "Şeker (red-pink body, purple-white lollipop head)" — inspired by cell 1 of the attached sheet
Cell 2: hunter Beri, costume "Çikolata (brown body, orange-white lollipop head)" — inspired by cell 2 of the attached sheet
Cell 3: hunter Beri, costume "Gökkuşağı Lolipop (cyan body, pink-white lollipop head)" — inspired by cell 3 of the attached sheet
Cell 4: hunter Fanatik, costume "Beyaz Gi (white karate gi, red headband, black belt)" — inspired by cell 4 of the attached sheet
Cell 5: hunter Fanatik, costume "Kırmızı Gi (red gi, black belt)" — inspired by cell 5 of the attached sheet
Cell 6: hunter Fanatik, costume "Ejder Ustası (dark navy gi, golden hair)" — inspired by cell 6 of the attached sheet
```
### D06 — Silsen ve Serçin

Referans: `gorsel/ham/K6.png` (eski çizim; yeni tasarım bundan esinlenir)

```
Sheet D06: 3D redesign of the attached sheet K6, same cell order. Grid 3 x 2 (512 px cells).
Cell 1: hunter Silsen, costume "Bahar (green dress, brown hair)" — inspired by cell 1 of the attached sheet
Cell 2: hunter Silsen, costume "Lale (red dress, black hair)" — inspired by cell 2 of the attached sheet
Cell 3: hunter Serçin, costume "Serçe (mustard outfit, black hair, little beak mask)" — inspired by cell 3 of the attached sheet
Cell 4: hunter Serçin, costume "Kanatlı Kedi (orange outfit, cat ears, small white wings)" — inspired by cell 4 of the attached sheet
Cell 5: the robot helper Bot (gray metal body, two blue lights, toothy screen face, black hair tuft) in the same 3D style
Cell 6: (empty)
```

## Animasyon paftaları (A01–A34): her kostüm için bir pafta

### ANİMASYON İSTEMİ (A01'den önce bir kez)

```
New task type: ANIMATION SHEETS for the approved 3D characters (codes A01–A34). Style rules from the start still apply.
- Grid: 4 columns x 2 rows, each cell exactly 384 px wide x 512 px tall. Top row left→right = cells 1, 2, 3, 4;
  bottom row = cells 5, 6, 7, 8.
- Every cell is one frame of the SAME character in the SAME costume, exactly as in the attached approved design cell:
  same design, colors, proportions and size in every frame.
- Same size and same place in every frame: feet always on the same baseline (24 px above the cell bottom), body
  centered horizontally. Facing right, 3/4 view, hands empty.
- Cells 1-4: WALK CYCLE loop (1: right leg forward, 2: legs passing, body slightly up, 3: left leg forward, 4: legs
  passing, body slightly up). Arms swing opposite to the legs; hair and clothes bounce a little.
- Cells 5-6: IDLE breathing loop (5: neutral standing pose, 6: chest slightly raised, head a tiny bit higher, a blink).
- Cells 7-8: SHOOT (7: brace — knees slightly bent, leaning forward, determined face, right arm forward at chest
  height as if holding something; 8: recoil — leaning back, right arm kicked up a little, hair and clothes flicking
  back). Still no weapon in the hand.
Confirm with "ready".
```

Her pafta isteği: `Sheet A..: animation sheet for <karakter>, costume "<kostüm>" — design: cell N of the attached
approved sheet D0x.` Onaylı D paftasını ekle.

| Kod | Karakter | Kostüm | Tasarım hücresi |
|---|---|---|---|
| A01 | Kinkin | Mavi (blue outfit, brown hair) | D01 hücre 1 |
| A02 | Kinkin | Pembe Prenses (pink outfit, golden hair) | D01 hücre 2 |
| A03 | Kinkin | Altın Efsane (gold outfit, cream hair) | D01 hücre 3 |
| A04 | Veryi | Klasik (brown outfit, dark brown hair) | D01 hücre 4 |
| A05 | Veryi | Asker (green soldier outfit, black hair) | D01 hücre 5 |
| A06 | Veryi | Bronz Şampiyon (bronze outfit, golden hair) | D01 hücre 6 |
| A07 | Kornet | Mor (purple fluffy body, white skull-like face) | D02 hücre 1 |
| A08 | Kornet | Şeker (mint fluffy body) | D02 hücre 2 |
| A09 | Kornet | Galaksi Sihirbazı (sky-blue fluffy body, lilac accents) | D02 hücre 3 |
| A10 | Marli | Yeşil (green outfit, brown hair, backpack) | D02 hücre 4 |
| A11 | Marli | Mavi (blue outfit, dark hair, backpack) | D02 hücre 5 |
| A12 | Marli | Altın Maceracı (gold outfit, auburn hair, backpack) | D02 hücre 6 |
| A13 | Kenit | Karanlık (black hooded cloak, glowing red eyes) | D03 hücre 1 |
| A14 | Kenit | Kanlı (dark red hooded cloak) | D03 hücre 2 |
| A15 | Kenit | Hayalet Lordu (deep purple hooded cloak) | D03 hücre 3 |
| A16 | Ponko | Kırmızı (red shirt, wide cowboy hat) | D03 hücre 4 |
| A17 | Ponko | Sarı (orange shirt, cowboy hat) | D03 hücre 5 |
| A18 | Ponko | Altın Şapka (yellow shirt, golden cowboy hat) | D03 hücre 6 |
| A19 | Güllu | Pembe (pink outfit, golden crown, bangs) | D04 hücre 1 |
| A20 | Güllu | Mor (purple outfit, crown) | D04 hücre 2 |
| A21 | Güllu | Kraliçe (light pink outfit, crown, golden hair) | D04 hücre 3 |
| A22 | Rani | Turkuaz (turquoise outfit, black side buns) | D04 hücre 4 |
| A23 | Rani | Limon (lime outfit, black buns) | D04 hücre 5 |
| A24 | Rani | Pırıltı (yellow outfit, purple buns) | D04 hücre 6 |
| A25 | Beri | Şeker (red-pink body, purple-white lollipop head) | D05 hücre 1 |
| A26 | Beri | Çikolata (brown body, orange-white lollipop head) | D05 hücre 2 |
| A27 | Beri | Gökkuşağı Lolipop (cyan body, pink-white lollipop head) | D05 hücre 3 |
| A28 | Fanatik | Beyaz Gi (white karate gi, red headband, black belt) | D05 hücre 4 |
| A29 | Fanatik | Kırmızı Gi (red gi, black belt) | D05 hücre 5 |
| A30 | Fanatik | Ejder Ustası (dark navy gi, golden hair) | D05 hücre 6 |
| A31 | Silsen | Bahar (green dress, brown hair) | D06 hücre 1 |
| A32 | Silsen | Lale (red dress, black hair) | D06 hücre 2 |
| A33 | Serçin | Serçe (mustard outfit, black hair, little beak mask) | D06 hücre 3 |
| A34 | Serçin | Kanatlı Kedi (orange outfit, cat ears, small white wings) | D06 hücre 4 |

Örnek istek (A01):

```
Sheet A01: animation sheet for hunter Kinkin, costume "Mavi (blue outfit, brown hair)" — design: cell 1 of the attached approved sheet D01.
```

## Silah paftaları (W1–W3)

Izgara 3 × 2 (512 px hücre). Silahlar yandan, **namlu ya da uç sağa bakar**, tutma yeri (kabza, sap) hücrenin sol
yarısında ortada; 3D render üslubu, saydam zemin, el ve karakter yok.

```
Sheet W1: weapons in the same stylized 3D style, side view, pointing right, grip on the left. Grid 3 x 2 (512 px cells).
Cell 1: Kinkin's energy pistol: silver body, cyan glowing core
Cell 2: Veryi's huge war hammer: wooden handle, steel head with studs
Cell 3: Marli's compact crossbow with a loaded arrow
Cell 4: Ponko's cowboy revolver: wooden grip, gold trigger guard
Cell 5: Güllu's tall classic bow with a yellow grip band
Cell 6: Rani's Y-shaped slingshot loaded with a stone
```

```
Sheet W2: weapons in the same stylized 3D style, side view, pointing right, grip on the left. Grid 3 x 2 (512 px cells).
Cell 1: Fanatik's red nunchaku (two sticks and a short chain)
Cell 2: Kornet's wizard staff: wooden shaft, yellow spiral band, purple glowing crystal on a three-pronged tip
Cell 3: Kenit's small dagger
Cell 4: Silsen's flower flag wand: thin pole, small checkered flag, daisy on top
Cell 5: Serçin's big feather (striped, pointing right)
Cell 6: (empty)
```

```
Sheet W3: shop guns in the same stylized 3D style, side view, pointing right, grip on the left. Grid 3 x 2 (512 px cells).
Cell 1: "Bubble Blaster": chunky toy-like blue bubble gun
Cell 2: "Red Laser": slim red laser pistol
Cell 3: "Green Twin": green double-barrel blaster
Cell 4: "Scatter Cannon": light-blue short cannon with an orange barrel
Cell 5: "Giant Bazooka": big dark bazooka with white stripes
Cell 6: (empty)
```

---

## Bulut Claude'un yapacakları (ChatGPT'ye gönderilmez)

`araclar/gorsel_kes.py` paftaları keser (A paftaları 4 × 2, kareler ortak kutudan, ayak hizası korunur), WebP yapar;
`www/gorsel.js` karakteri duruma göre kare kare çizer: duruyorsa nefes (5-6), yürüyorsa yürüyüş (1-4), ateş edince
7-8; silah W resminden omuz noktasında nişana döner. Kod Evren'e yazdırılır, Claude inceler ve test eder. Paftalar
gelene kadar oyun bugünkü (KS) karakterlerle çalışır.
