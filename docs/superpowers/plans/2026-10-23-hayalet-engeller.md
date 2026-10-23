# Hayalet Avcıları — Eğri hatlı, temaya özel engeller: uygulama planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Su, duvar, obje, diken ve lav engellerini dikdörtgen yerine daire/elips/yuvarlak kutu birleşimi eğri hatlarla, 6 temanın her birine özel ürkünç ama sevimli görünüşle çizmek; çarpışmanın bu hattı izlemesi (3.13.0).

**Architecture:** Harita üretimi aynı kalır; `buildWalls/buildWaters/buildHazards` sonunda her engele dikdörtgenin içinde kalan bir biçim (parça listesi) eklenir. Çarpışma işlevleri biçime bakar. Çizim yeni `www/engeller.js` (çekirdek: biçim, çarpışma, önbellek, çizim hattı, canlı katman, ortak ressamlar) ve `www/engel-temalari.js` (6 temanın ressamları) dosyalarındadır; `render` tek `engelleriCiz(ctx)` çağırır.

**Tech Stack:** Saf JS + Canvas 2D (Capacitor 8 WebView), Playwright + Chromium testleri, Firebase emülatörü (çevrimiçi testler).

**Spec:** `docs/superpowers/specs/2026-10-23-hayalet-engeller-design.md` (kullanıcı onayladı, 23 Ekim 2026). Onaylı taslak: `docs/superpowers/specs/2026-10-23-hayalet-engeller/` (`taslak.js` Mor Şato ve Yeşil Orman ressamları, `katalog-*.jpg`, `oyun-*.jpg`).

## Global Constraints

- Yeni bağımlılık yok; yalnız Canvas 2D API (Chromium WebView).
- Harita üretimi ve yerleşimdeki çakışma denetimleri değişmez (dikdörtgenle); engellerin yeri ve boyutu eski sürümle aynı.
- Biçim, engelin dikdörtgeninin içindedir (harita sınırı şeritlerinin dünya dışına bakan kenarı hariç).
- Çarpışma `carpisma` parçalarıdır: duvar ailesinde gövde kutusu `d` kadar aşağı uzatılmış biçim; objede biçimin 3 px büyütülmüşü; dikende biçimin 2,5 px büyütülmüşü; su ve lavda biçimin kendisi (kıyı yürünür).
- `engeller.js` ve `engel-temalari.js`'te `Math.random` yok; bütün süsler `engelRastgele(tohum)` (xorshift32) ile.
- Tohum: `engelTohumu(level, tur, sira, kutu)` = `${level}:${tur}:${sira}:${round(x)}:${round(y)}:${round(w)}:${round(h)}` metninin FNV-1a 32 bit özeti.
- Kılık: iç blok `i` (buildWalls sırası) başka bir iç blokla kesişiyorsa `duvar`; değilse `["duvar","obje1","obje2"][(i + level) % 3]`; `game.walls[0..3]` sınır (`ust`, `alt`, `sol`, `sag`).
- Tema dizini `(level - 1) % 6`; eksik tema seti dizin 0'a düşer (yalnız görevler arası geçişte).
- Önbellek ölçeği `engelOlcegi() = min(min(devicePixelRatio, 2) × (game.viewScale || 1), 2)`.
- Su her temada mavi (kıyı temaya göre); su rengi geçişi dünya y koordinatında (0 → 1200: `#2b8fe6` → `#0f4fae`).
- İçerik: gülen/uykulu yüzler, yarasa, örümcek ağı, mum, ateş böceği; kan, kafatası, iskelet, dinî sembol yok.
- Kullanıcıya görünen tek yeni metin: `"🏰 Engeller yenilendi: kaleler, eğri kıyılı göller ve her temaya özel ürkünç ama sevimli objeler."` (`t()` + 5 dil).
- Commit mesajları Türkçe, oturumun atıf satırlarıyla; model adı yok; dal `claude/beautiful-feynman-pxwdju`; Play'e gönderme kullanıcının açık onayıyla (arkadaş planının Görev 8'inde).

## Belgeye göre netleştirmeler

1. Spec §6 tema ressamlarını `engeller.js`'te sayar; plan onları ayrı `engel-temalari.js`'e koyar (çekirdek ~400,
   ressamlar ~900 satır; tek dosya çok büyür). İkisi de `game.js`'ten önce yüklenir.
2. `game.js`'teki yüzlerce üst düzey adla çakışmasın diye iki dosya da tek bir IIFE'dir; dışarıya yalnız Interfaces'teki
   adlar ve yardımcı ad alanı `ENGEL` açılır (`ENGEL.yol, doldur, kirp, hatCiz, kenarNoktalari, icNoktalar, karistir,
   acik, koyu, elips, yuvarlak, tasOrgu, gozler, cimTutami, sinirla`).
3. Sıra (spec §10): arkadaş planının Görev 6–7 → bu plan → arkadaş planının Görev 8. Bu plan `APP_VERSION`'ı
   değiştirmez; yalnız `UPDATE_NOTES["3.13.0"]`'a engel satırını ekler. Sürüm, mağaza notu (iki özellik birlikte) ve
   derleme Görev 8'dedir.

## Review Focus

1. **Bölüm ortasında ekran döner ya da pencere boyutu değişir** → önbellek yeni ölçekle yeniden çizilir, bulanık ya da eski resim kalmaz, sayfa hatası yok. Test: Task 2.
2. **Tablet (kısa kenar ≥ 600 px, viewScale 1,35, dpr 2)** → önbellek ölçeği 2'de sınırlanır (bellek). Test: Task 2.
3. **Bölüm geçişi (`nextLevel`)** → yeni engellerin hepsi biçimli ve yeni temada; önceki bölümün engel nesnesi ve resmi kullanılmaz. Test: Task 2.
4. **Eğri hattın açtığı köşelere doğma** (oyuncu, hayalet, para) → `freeSpot` sonucu hiçbir engelin çarpışmasına değmez. Test: Task 1.
5. **Mermi eğri duvara çarpar, açılan köşeden geçer** → çarpışma noktası biçimin içindeyse çarpar, dikdörtgenin boş köşesinde çarpmaz. Test: Task 1.

---

### Task 1: Biçim ve çarpışma çekirdeği

**Files:**
- Create: `hayalet-avcilari/www/engeller.js` (yardımcılar, biçim aileleri, `ENGEL_AILELERI`, `engelOlustur`, `engelBicimleriniKur`, `engelCarpisir`)
- Modify: `hayalet-avcilari/www/index.html` (`<script src="playgames.js">`'ten sonra `<script src="engeller.js"></script>`)
- Modify: `hayalet-avcilari/www/game.js` (`buildWalls`, `buildWaters`, `buildHazards` son satırı `engelBicimleriniKur();`; `collidesWalls/collidesWaters/collidesSpikes/collidesLavas` gövdesi `return engelCarpisir(game.walls|waters|spikes|lavas, x, y, r);`)
- Create: `hayalet-avcilari/test/engel-bicim.test.mjs` (dil.test'in sunucu ve sayfa düzeni; `sina()` raporu; `--ekran <klasör>` seçeneği Task 2'de)

**Interfaces:**
- Produces (global):
  - `engelRastgele(tohum: number): () => number` — xorshift32, [0,1)
  - `engelTohumu(level, tur, sira, kutu): number`
  - `engelUzaklik(parcalar, x, y): number` — işaretli uzaklık (yerel koordinat, içeride eksi; elips yaklaşık)
  - Parça: `{t:"d",x,y,r}` | `{t:"e",x,y,rx,ry}` | `{t:"k",x,y,w,h,rr}`
  - `ENGEL_AILELERI = [{duvar:"kale"},{duvar:"kutuk"},{duvar:"harabe"},{duvar:"kale"},{duvar:"kaya"},{duvar:"istasyon",obje1:"kaya"}]` — belirtilmeyen obje `"yama"`, su ve lav `"gol"`, diken `"plaka"`, sınır `"sinir"`
  - `engelOlustur(kutu: {x,y,w,h}, tur: "sinir"|"duvar"|"obje1"|"obje2"|"su"|"diken"|"lav", tema: number, tohum: number, yon?: "ust"|"alt"|"sol"|"sag"): object` — kutuya `tur, tema, tohum, yon, aile, bicim` (yerel parçalar; duvar ailesinde `bicim.derinlik`), `carpisma` (yerel parçalar), `pay` (görselin biçim dışına taşma payı: su 9, lav 7, obje 3, diken 2,5, duvar 4, sınır 0) ekler ve kutuyu döndürür
  - `engelBicimleriniKur(): void` — dört listede `bicim`'i olmayan her engeli `engelOlustur` ile tamamlar (kılık ve tohum Global Constraints'teki gibi)
  - `engelCarpisir(liste, x, y, r): boolean` — dikdörtgen ön eleme, sonra `engelUzaklik(o.carpisma, x - o.x, y - o.y) < r`; `carpisma`'sı yoksa dikdörtgen
  - `ENGEL` yardımcıları (taslaktaki imzalarla): `yol(ctx, P, ox, oy, b)`, `doldur(ctx, P, renk, ox, oy, b)`, `kirp(ctx, P, fn, ox, oy, b)`, `hatCiz(ctx, P, renk, kal, ox, oy, b)`, `kenarNoktalari(P, aralik, b) → [{x,y,nx,ny}]`, `icNoktalar(P, w, h, n, pay, ara, r) → [{x,y}]`, renk ve şekil yardımcıları

- [ ] **Step 1: Failing testleri yaz** (`test/engel-bicim.test.mjs`, sayfada `p.evaluate`):
  - `biçim dikdörtgende`: tema 0..5 × tür (duvar, obje1, obje2, su, diken, lav) × boyut [[80,80],[180,90],[90,180],[180,180]] ve sınır ([1600,30] üst/alt, [30,1200] sol/sağ): her parçanın sınır kutusu `[−0.01, w+0.01]×[−0.01, h+0.01]` içinde (sınırda yalnız haritaya bakan kenar denetlenir).
  - `çarpışma biçimi izler` (Review Focus 5): her örnekte 3 px ızgarada `engelUzaklik(o.carpisma) < −3` olan bir nokta için `engelCarpisir([o], o.x+px, o.y+py, 0) === true`; yama, göl ve plaka ailesinde 2 px içeriden dört köşeden en az biri için `false`; dikdörtgen dışındaki nokta `false`.
  - `kılık kuralı`: `online.mode = 'host'`, bölüm 1..30 için `buildWalls()`; kesişen iç bloklar `tur === 'duvar'`; diğerleri `["duvar","obje1","obje2"][(i + level) % 3]`; 30 bölümde üç kılık da en az bir kez.
  - `aynılık`: iki ayrı sayfada `online.mode='host'`, bölüm 1..12 için build ve `JSON.stringify(dört listenin {x,y,tur,tohum,bicim})` eşit.
  - `freeSpot çarpışmaz` (Review Focus 4): bölüm 1..6'da 200 rastgele nokta → `freeSpot(x, y, 22, (a,b,r) => collidesWalls(a,b,r) || collidesWaters(a,b,r))` sonucu iki işlevde de `false`.
  - `sayfa hatası yok`.
- [ ] **Step 2: Kırmızı.** Run: `node hayalet-avcilari/test/engel-bicim.test.mjs`. Expected: `engelOlustur is not defined`.
- [ ] **Step 3: `engeller.js` çekirdeğini yaz.** Biçim aileleri spec §5 ölçüleriyle (taslak `bicimGol`, `bicimYama`, `bicimKale`, `bicimKutuk`, `bicimPlaka`, `bicimSinir` yerel ölçüleri birebir; yeni aileler: `harabe` = kale gövdesi + kuleler yerine farklı boylarda 3–5 kırık sütun başı (daire, r 7–12); `kaya` = 4–7 yumru (daire/elips, min(w,h)×0,22–0,38), `derinlik` 8–14; `istasyon` = gövde kutusu (rr 14) + dört köşede modül dairesi (r = min(w,h)×0,16), `derinlik` 12–20). Duvar ailesinde `carpisma` = biçim + gövde kutusunun `derinlik` kadar uzatılmış kopyası.
- [ ] **Step 4: `game.js` ve `index.html` kancaları.** Yerleşim ve kesişme denetimlerine dokunma.
- [ ] **Step 5: Yeşil.** Run: `node hayalet-avcilari/test/engel-bicim.test.mjs` ve `node hayalet-avcilari/test/engel.test.mjs`. Expected: hepsi ✓ / engel.test başarı çıktısı (dogma 0, ayniHarita, kurtuldu, uzun ≥ 8).
- [ ] **Step 6: Commit** ("Hayalet Avcıları: engel biçimleri ve biçimi izleyen çarpışma").

### Task 2: Çizim hattı, ortak ressamlar, Mor Şato ve Yeşil Orman

**Files:**
- Modify: `hayalet-avcilari/www/engeller.js` (önbellek, `engelleriCiz`, canlı katman, ortak ressamlar, lav)
- Create: `hayalet-avcilari/www/engel-temalari.js` (`ENGEL_TEMALARI[0]` Mor Şato, `[1]` Yeşil Orman — taslak ressamlardan)
- Modify: `hayalet-avcilari/www/index.html` (`engeller.js`'ten sonra `<script src="engel-temalari.js"></script>`)
- Modify: `hayalet-avcilari/www/game.js` (`render`'daki su/lav/diken/duvar döngüleri yerine `engelleriCiz(ctx);`; `drawWall`, `drawWater`, `drawSpike` silinir; `drawLava` gövdesi `engeller.js`'e `lavCanli(ctx, x, y, w, h)` olarak taşınır, `game.js`'ten silinir)
- Test: `hayalet-avcilari/test/engel-bicim.test.mjs` (kapsama, resim aynılığı, Review Focus 1–3, `--ekran`)

**Interfaces:**
- Consumes: Task 1'in hepsi.
- Produces:
  - `ENGEL_TEMALARI: Array<{ ad, palet, duvar, obje1, obje2, su }>` — her ressam `(ctx, w, h, r, p, B) => canli[]` (`B` = `o.bicim`, sınırda `B.yon` dolu); `canli` = `[{tur, x, y, ...}]` yerel noktalar
  - `engelOlcegi(): number`, `engelResmi(o): { c, canli }` — `o._olcek !== engelOlcegi()` ise yeniden çizer
  - `engelleriCiz(ctx): void` — görüş alanındakiler: sular (geçiş 1: önbellek; geçiş 2: biçimle kırpılmış önbellek + dalgalar), diken, lav (önbellek + gölgeli parlama + biçimle kırpılmış `lavCanli` + alev dilleri), duvar/obje (alt kenara göre), canlı katman
  - `ENGEL_CANLI: { mum, goz, atesbocegi }` — `(ctx, x, y, zaman, n) => void` (Task 3–4 ekler)
  - Ortak: `dikenCiz`, `lavCiz`, `suTabani(ctx, w, h, r, B, kiyiCiz)` (kıyı + dünya koordinatlı mavi)

- [ ] **Step 1: Failing testleri yaz:**
  - `kapsama` (tema 0, 1 + diken + lav; Task 1'in boyutları ve sınır): `engelResmi(o)` resminde 2 px ızgarada `engelUzaklik(o.carpisma) < −2` noktalarda alfa > 0; `engelUzaklik(o.bicim) > o.pay + 3` noktalarda alfa 0.
  - `resim aynılığı`: iki sayfada bölüm 1 ve 2 engellerinin `engelResmi(o).c.toDataURL()` özetleri eşit.
  - `ölçek değişimi` (Review Focus 1): oyun sürerken `page.setViewportSize(844×390)` → iki kare sonra görünen her engelde `o._olcek === engelOlcegi()`.
  - `tablet ölçeği` (Review Focus 2): viewport 800×1280, `deviceScaleFactor: 2` → `engelOlcegi() === 2`.
  - `bölüm geçişi` (Review Focus 3): `nextLevel()` sonrası dört listedeki her engelde `bicim` var, `tema === (game.level - 1) % 6`, önceki bölümün hiçbir engel nesnesi listede yok.
- [ ] **Step 2: Kırmızı.** Run: `node hayalet-avcilari/test/engel-bicim.test.mjs`. Expected: `engelResmi is not defined`.
- [ ] **Step 3: Çekirdeği ve iki temayı yaz.** `engelResmi` tuval oluşturamazsa (boyut 0 ya da `getContext` yok) o engeli o karede doğrudan `ctx`'e çizer (spec §8). Taslak ressamları (`kaleDuvari`, `kaleSuru`, `mezarlik`, `balkabagiTarlasi`, `hendek`, `kutukCit`, `kutukSuru`, `urkuncAgaclar`, `mantarHalkasi`, `sazlikGolet`, `dikenKapani`, `lavTabani`, `alevler`) Task 1 biçim ve yardımcılarıyla taşı; mum, kovuk gözü ve ateş böceği önbellekten çıkıp `canli` noktası olur (göz 3 sn'de bir 150 ms kırpar; ateş böceği sinüsle parlar; mum alevi titrer). Suyun ikinci geçişi biçimle (büyütmesiz) kırpılır.
- [ ] **Step 4: Yeşil.** Run: `node hayalet-avcilari/test/engel-bicim.test.mjs`, `node hayalet-avcilari/test/engel.test.mjs`, `node hayalet-avcilari/test/cizim.test.mjs`, `node hayalet-avcilari/test/dil.test.mjs`. Expected: hepsi geçer (cizim: TAMAM eşikleri; dil: TAMAM).
- [ ] **Step 5: Ekran denetimi.** Run: `node hayalet-avcilari/test/engel-bicim.test.mjs --ekran <scratchpad>/engel` (her tema için katalog ve TR 390 / AR 340 oyun içi). Expected: Mor Şato ve Yeşil Orman onaylı taslakla aynı üslupta; boş köşe, dikiş, iç çember yok.
- [ ] **Step 6: Commit** ("Hayalet Avcıları: engel çizim hattı, Mor Şato ve Yeşil Orman").

### Task 3: Çöl ve Buz Mağarası setleri

**Files:**
- Modify: `hayalet-avcilari/www/engel-temalari.js` (`ENGEL_TEMALARI[2]` Çöl, `[3]` Buz Mağarası)
- Modify: `hayalet-avcilari/www/engeller.js` (`ENGEL_CANLI.parilti`: kristal ve buz parıltısı)
- Test: `hayalet-avcilari/test/engel-bicim.test.mjs` (`ENGEL_TEMALARI.length >= 4`; kapsama döngüsü temalar üzerinde döner)

**Interfaces:**
- Consumes: Task 2'nin `ENGEL_TEMALARI` ressam imzası, `ENGEL` yardımcıları, `ENGEL_CANLI`.
- Produces: `ENGEL_TEMALARI[2]`, `[3]`, `ENGEL_CANLI.parilti`.

Görünüş (spec §4): Çöl — kum taşı harabe duvarı (palet taş `#c8a165`, koyu `#8a6a3a`; çatlaklı ön yüz, kırık sütun başları), kaktüs bahçesi (çakıl kenar, kum `#d9b26b`, kollu kaktüs `#4d9a52`, çiçek, uykulu yüz), mumya lahdi (kumlu taş zemin, altın `#e0b84f` ve mavi `#2563eb` şeritli aralık kapak, içinden bakan sargılı `#f1e7cf` sevimli mumya), vaha (kum kıyı, palmiye yaprakları). Buz — buz kalesi (buz tuğla `#bfe8ff`/`#7cc4ee`, koyu `#2b6c9a`, ön yüzde sarkıtlar, yuvarlak buz kuleleri), kardan adam (kar yığını kenar `#f4fbff`, atkı `#ef4444`, havuç burun, gülümseme), buz kristali kümesi (`#a5f3fc`/`#67e8f9` parlayan kristaller, `parilti` noktaları), buz kenarlı göl (buz kıyı, yüzen buz parçaları).

- [ ] **Step 1: Failing test:** `ENGEL_TEMALARI.length >= 4` ve kapsama döngüsünde tema 2, 3.
- [ ] **Step 2: Kırmızı.** Run: `node hayalet-avcilari/test/engel-bicim.test.mjs`. Expected: `ENGEL_TEMALARI.length >= 4` başarısız.
- [ ] **Step 3: İki temayı yaz** (ailesi `ENGEL_AILELERI`'nden; kenar süsleri `kenarNoktalari`, iç süsler `icNoktalar` ile).
- [ ] **Step 4: Yeşil + ekran denetimi.** Run: `node hayalet-avcilari/test/engel-bicim.test.mjs --ekran <scratchpad>/engel`. Expected: hepsi ✓; Çöl ve Buz katalog/oyun görüntüleri üslupla uyumlu.
- [ ] **Step 5: Commit** ("Hayalet Avcıları: Çöl ve Buz Mağarası engelleri").

### Task 4: Volkan ve Uzay setleri

**Files:**
- Modify: `hayalet-avcilari/www/engel-temalari.js` (`ENGEL_TEMALARI[4]` Volkan, `[5]` Uzay)
- Modify: `hayalet-avcilari/www/engeller.js` (`ENGEL_CANLI.buhar`, `.alevruhu`, `.isik`, `.yildiz`)
- Test: `hayalet-avcilari/test/engel-bicim.test.mjs` (`ENGEL_TEMALARI.length === 6`)

**Interfaces:**
- Consumes: Task 2–3 ile aynı.
- Produces: `ENGEL_TEMALARI[4]`, `[5]`; dört yeni `ENGEL_CANLI` çizicisi.

Görünüş (spec §4): Volkan — bazalt kaya duvarı (kaya ailesi, `#3b3138`/`#231c22`, ön yüzde `#f97316` kızıl çatlaklar), ejderha yuvası (dal-çalı `#7c4a1e` yuva kenarı, `#a3e635`/`#fbbf24` benekli yumurtalar), alev ruhlu kayalar (kaya kümesi, üstünde gülen küçük alev ruhları: `alevruhu` noktası), sıcak su (bazalt kıyı, `buhar` kabarcıkları). Uzay — uzay istasyonu (istasyon ailesi, `#9ca3af`/`#4b5563`, perçinler, `isik` noktaları `#22d3ee`/`#f472b6` yanıp söner), göktaşı (kaya ailesi, `#6b5b7b`, kraterler, `#c084fc` kristaller), düşmüş UFO (iniş izi zemin, `#94a3b8` elips gövde, `#a5f3fc` cam kubbe, el sallayan `#86efac` uzaylı hayalet), metal kenarlı havuz (metal kıyı, `yildiz` yansımaları).

- [ ] **Step 1: Failing test:** `ENGEL_TEMALARI.length === 6`.
- [ ] **Step 2: Kırmızı.** Run: `node hayalet-avcilari/test/engel-bicim.test.mjs`. Expected: `ENGEL_TEMALARI.length === 6` başarısız.
- [ ] **Step 3: İki temayı ve dört canlı çiziciyi yaz.**
- [ ] **Step 4: Yeşil + ekran denetimi.** Run: `node hayalet-avcilari/test/engel-bicim.test.mjs --ekran <scratchpad>/engel`, `node hayalet-avcilari/test/cizim.test.mjs`. Expected: hepsi ✓ / TAMAM; 6 temanın görüntüleri üslupla uyumlu.
- [ ] **Step 5: Commit** ("Hayalet Avcıları: Volkan ve Uzay engelleri").

### Task 5: Çevrimiçi ve performans doğrulaması, belgeler, sürüm notu satırı

**Files:**
- Modify: `hayalet-avcilari/www/game.js` (`UPDATE_NOTES["3.13.0"]` dizisi yoksa oluşturulur; satır `t("🏰 Engeller yenilendi: kaleler, eğri kıyılı göller ve her temaya özel ürkünç ama sevimli objeler.")`; `APP_VERSION` değişmez — sürüm arkadaş planının Görev 8'inde)
- Modify: `hayalet-avcilari/www/i18n/{en,es,zh,hi,ar}.js` (`sozluk.mjs yaz`)
- Modify: `hayalet-avcilari/README.md` ("## 3.13.0: engeller": kurallar, 6 tema seti, çarpışma kuralı, testler, ölçümler)

- [ ] **Step 1: Çevrimiçi ve 6 kişilik testler.** Run (emülatörle): `cevrimici.test.mjs` ve `alti.test.mjs` (`CPU=2`). Expected: 13/13; alti eşikleri geçer ve README'deki 3.12.2 ölçümlerinden (host 33–53, konuk 48–53 fps) belirgin düşük değil.
- [ ] **Step 2: Sürüm notu satırı ve çeviriler.** Run: `node hayalet-avcilari/araclar/sozluk.mjs denetle`. Expected: her dil "tamam".
- [ ] **Step 3: README bölümü.**
- [ ] **Step 4: Tam koşu.** Run: `engel-bicim`, `engel`, `cizim`, `dil` (6 dil). Expected: hepsi geçer.
- [ ] **Step 5: Commit** ("Hayalet Avcıları: engeller doğrulaması, belgeler ve sürüm notu").
