# Hayalet Avcıları — Dünya Turu (51 ülke) Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ana menüye 51 ülkelik "🌍 Dünya Turu" kipini eklemek ve 3.14.0 (47) olarak yayına hazırlamak. Kip tek kişilik ve çevrimiçi oynanır; her ülkenin kendi görselleri ve geleneksel kıyafetli bossu vardır. Aynı sürüme kullanıcının istediği "hiç sıkmayan" reklam sıklığı da girer.

**Architecture:** Dünya Turu'nda `game.level` ülkenin rota sırasıdır. Harita, zorluk ve çarpışma bugünkü bölüm üreticisinden gelir.
- 3.13.0'ın engel hattına bir dal eklenir: engelin `tema` alanı sayı yerine ülke kodu olunca aile duvarı ve suyu, ülkenin objeleri ve paleti kullanılır.
- Ülke verisi, aileler, ülke objeleri, kostüm takımı ve kip akışı ayrı dosyalardadır; `game.js`'e yalnız kancalar eklenir.

**Tech Stack:** HTML5 canvas, düz JS (modülsüz, `window` üstünden), Capacitor 8 (Android), Firebase Realtime Database + kurallar, @capacitor-community/admob 8.2.1. Testler Playwright + Chromium ve Firebase emülatöründe çalışır.

**Spec:** `docs/superpowers/specs/2026-10-24-hayalet-ulkeler-design.md` (§ numaraları bu belgeye aittir).

## Global Constraints

- Yeni bağımlılık yok. `www/` dosyaları modülsüz düz betiktir ve `index.html`'de spec §7'deki sırayla yüklenir.
- Ressam, kostüm ve canlı süs kodunda `Math.random` yoktur. Rastgelelik ressama verilen tohumlu `r()` ile gelir; her cihaz aynı resmi çizer.
- 3.13.0 engel kuralları sürer:
  - Biçim ve çizim dikdörtgenin içinde kalır; sabit çizim üst kenardan taşmaz.
  - Su her ülkede aynı mavidir.
  - Engel sayısı, yeri, boyutu ve çarpışma değişmez.
- İçerik kuralları (spec §4.6):
  - Dinî yapı, sembol ve giysi yok.
  - Bayrak ve sınırlı harita yok.
  - Silah yok.
  - İnsan çizimi yok; gerekirse kıyafetli sevimli hayalet ya da hayvan.
  - Savaş, siyaset, kan yok.
- **Zemin koyu:** her ülkenin `palet.zemin` rengi bağıl parlaklıkta ≤ 0,08 (bugünkü 6 temanın en açığı Buz Mağarası 0,06). Böylece hayaletler ve arayüz okunur.
- **Diller:** Kullanıcıya görünen her metin `t("…")` ile yazılır. 5 sözlüğe `node hayalet-avcilari/araclar/sozluk.mjs yaz <dil> <json>` ile girer. `node hayalet-avcilari/araclar/sozluk.mjs denetle` her görevin sonunda temiz çıkar. `araclar/anahtarlar.mjs` yeni dosyaları da tarar.
- **Testler** depo kökünden çalışır: `node hayalet-avcilari/test/<ad>.test.mjs`, çıktı `TAMAM: …`. Bütün sınamalar 3.13.0'daki `sina()` düzenindedir.
- **Emülatör testleri:** bulut ortamında vekil sunucu yüzünden `npm run test:*` kuralları yükleyemez. `hayalet-avcilari/firebase` içinde, `database` satırı olmayan bir yapılandırma kopyasıyla çalıştırılır:

  ```bash
  EMU=$(mktemp -d)/firebase.json
  node -e 'const c=require("./firebase.json");delete c.database;c.firestore.rules=process.cwd()+"/firestore.rules";require("fs").writeFileSync(process.argv[1],JSON.stringify(c))' "$EMU"
  npx firebase emulators:exec --config "$EMU" --only database,auth --project demo-hayalet-avcilari "node ../test/cevrimici.test.mjs"
  ```

  Kural testi `--only database,firestore` ve `"node --test test/kurallar.test.mjs"` ile çalışır.
- **Git ve yayın:**
  - Commit mesajları Türkçedir; model adı yazılmaz; sonuna oturumun `Co-Authored-By` ve `Claude-Session` satırları eklenir.
  - Push yalnız `claude/beautiful-feynman-pxwdju` dalına yapılır.
  - `main`, kural yayını ve Play'e gönderim **yalnız kullanıcının açık onayıyla** yapılır.
- **Sürüm:** 3.14.0 (versionCode 47). Mağaza sürüm notu her dilde ≤ 500 karakter (`android/play.mjs` › `surumNotlari`).

## Review Focus

1. **Karışık sürümlü oda:** eski (3.13.x) kurucu 51'i geçip 52, 53… bölüme ilerler. Yeni istemci çökmez, ülke 51'de kalır, "Dünya turu tamamlandı" bir kez çıkar. → Görev 14 sınaması.
2. **Yedekten geri yükleme:** eski yedekte `dunyaTuru` yoktur, yeni yedekte bilinmeyen ülke kodu olabilir. Kayıt açılır, varsayılan gelir, bilinmeyen kod atılır, `acik` 1–51'e sınırlanır. → Görev 2 sınaması.
3. **Ortadan katılan oyuncu:** katıldığı ülkeden önceki ülkelerin damgasını almaz. İlk geçtiği ülkenin damgası basılır. → Görev 14 sınaması.
4. **Damga ve uçak geçişi sırasında yenilgi, duraklatma ya da çift tetikleme:** tek damga, tek `nextLevel`. Oyun bittiyse geçiş iptal olur, perde ekranda kalmaz. → Görev 6 sınaması.
5. **Uzun adlar dar ekranda:** tanıtım bildirimi ve kartlar 340 px Hintçe ve Arapçada taşmaz. → Görev 6 dil sınaması.

---

## Dosya haritası

| Dosya | Görev | Sorumluluk |
|---|---|---|
| `www/reklam.js` (değişir) | 1 | Geçiş reklamı sıklığı: `gecisUygunMu`, kalıcı sayaçlar |
| `www/ulkeler.js` (yeni) | 2, 3 | 51 ülkenin verisi, rota, tema ve engel seti yardımcıları |
| `www/dunya-turu.js` (yeni) | 2, 3, 6, 14 | Kayıt (`turKaydi`, `damgaBas`), kip durumu, zemin, ekranlar, akış, çevrimiçi kancalar |
| `www/ulke-aileleri.js` (yeni) | 3, 5, 7–13 | 10 aile: biçim ailesi, varsayılan palet, `duvar`, `su`, `zemin` ressamları |
| `www/ulke-objeleri-avrupa.js`, `-afrika.js`, `-asya.js`, `-amerika.js` (yeni) | 5, 7–13 | 102 ülke objesi ressamı ve yeni canlı süs türleri |
| `www/kostumler.js` (yeni) | 4 | Kostüm takımı, `kostumGecerliMi`, `bossKostumuCiz` |
| `www/engeller.js` (değişir) | 3 | Ülke kodlu tema dalı (üç satır) |
| `www/game.js` (değişir) | 1, 3, 4, 6, 14 | Kancalar: `startGame`, `getTheme`, `render`, `drawGhost`, döngü, `nextLevel`, `spawnBoss`, `oyunSonu`, çevrimiçi |
| `www/index.html`, `www/style.css` (değişir) | 6, 14 | Menü düğmesi, Dünya Turu ekranı, perdeler, Oda Kur kip seçimi |
| `www/i18n/*.js` (değişir) | 1–14 | Yeni anahtarlar (sozluk.mjs ile) |
| `araclar/anahtarlar.mjs` (değişir) | 2 | Yeni dosyaları tarar |
| `firebase/database.rules.json`, `firebase/test/kurallar.test.mjs` | 14 | `tur` alanı, kurucunun `level` yazımı |
| `test/reklam.test.mjs` (değişir) | 1 | Sıklık kuralları |
| `test/ulkeler.test.mjs` (yeni) | 2 | Veri bütünlüğü |
| `test/dunya-turu.test.mjs` (yeni) | 2, 3, 6, 14 | Kayıt, kancalar, akış, istemci damgası |
| `test/ulke-cizim.test.mjs` (yeni) | 4, 5, 7–13 | Kostümler; aile ve obje kapsaması, aynılık, katalog görüntüleri |
| `test/cevrimici.test.mjs`, `test/dil.test.mjs`, `test/cizim.test.mjs`, `test/alti.test.mjs` (değişir) | 6, 14, 15 | Çevrimiçi Dünya Turu, yeni ekranlar, kare hızı |

---

### Task 1: Hiç sıkmayan reklam sıklığı

Kullanıcının isteği: *"Reklam sıklığını insan psikolojisine en uygun şekilde sen bilirsin. Hiç sıkmayacak şekilde yapalım."*

Dayanak: Google AdMob geçiş reklamını doğal duraklarda ve aşırı sıklık olmadan önerir, sayısal sınır vermez. Sayılar bu ilkeye göre seçildi. İlkeler:
- Yeni oyuncu önce oyunu sevsin.
- Çabuk yenilen oyuncu hemen yeniden oynamak ister; ona reklam gösterilmez.
- Sevinç anı bozulmaz.
- Birlikte oynanan çevrimiçi akış kesilmez.

**Files:**
- Modify: `hayalet-avcilari/www/reklam.js` (`REKLAM`, `reklamOyunBitti`, `odulluKapandi`)
- Modify: `hayalet-avcilari/www/game.js` (`defaultSave.reklam`, `loadSave` derin birleştirme, `startGame`'de `game.oynananSure = 0`, güncelleme döngüsünde süre birikimi, `oyunSonu` çağrısı)
- Test: `hayalet-avcilari/test/reklam.test.mjs`

**Interfaces:**
- Produces:
  - `gecisUygunMu(bilgi: {cevrimici: boolean, sureSn: number, kutlama: boolean}, kayit: {oyun: number, toplam: number, sure: number, son: number[]}, simdi: number) -> boolean`. Saf işlev; `kayit` bu oyunun sayaçları eklenmiş hâlidir.
  - `reklamOyunBitti(bilgi)`
  - `save.reklam = { oyun: 0, toplam: 0, sure: 0, son: [] }`
  - `game.oynananSure` (sn)

- [ ] **Step 1: Sınamaları yaz** (`reklam.test.mjs`'e ekle; sahte AdMob zaten var):
  - `gecisUygunMu({cevrimici:true, sureSn:300, kutlama:false}, {oyun:20,toplam:9999,sure:9999,son:[]}, T) === false` — çevrimiçi turdan sonra yok
  - `kutlama:true` (rekor ya da dünya turu bitti) → `false`
  - `sureSn: 44` → `false`; `sureSn: 45` ve öteki koşullar uygun → `true`
  - `oyun: 5` → `false`; `oyun: 6` → `true` (ilk 5 oyun hoş geldin süresi)
  - `toplam: 599` → `false`; `toplam: 600` → `true` (ilk 10 dk oyun süresi)
  - `sure: 359` → `false`; `sure: 360` → `true` (iki reklam arası en az 6 dk **oyun** süresi)
  - `son: [T-10, T-20, T-30, T-40]` (son bir saatte 4) → `false`; biri `T-3601` → `true`
  - Bütünleşik:
    - `save.reklam = {oyun:6,toplam:900,sure:400,son:[]}`, `game.oynananSure = 50` iken tek kişilik `endGame(false)` → 800 ms sonra `showInterstitial` bir kez; `save.reklam.sure === 0`, `son.length === 1`.
    - Aynı kurulum `oyunSonu(false, true)` (çevrimiçi) → `showInterstitial` yok, `save.reklam.sure === 450`.
  - Ödüllü reklam ödülü verilince `save.reklam.sure === 0`.
- [ ] **Step 2: Çalıştır, düştüğünü gör.** `node hayalet-avcilari/test/reklam.test.mjs` → `gecisUygunMu is not defined` ile ✗.
- [ ] **Step 3: Uygula.**
  - `REKLAM`'a sabitler: `ilkOyunlar: 5`, `ilkSureSn: 600`, `araSureSn: 360`, `enKisaOyunSn: 45`, `saatlikEnCok: 4`. Eski `gecisAraOyun` ve `gecisAraMs` kalkar.
  - `reklamOyunBitti(bilgi = {})`:
    - `save.reklam`'ı günceller: `oyun++`, `toplam += sureSn`, `sure += sureSn`, `son` son 3600 sn'ye kırpılır.
    - `gecisUygunMu` doğruysa geçişi gösterir (800 ms gecikme sürer), `sure = 0` yapar, `son`'a `simdi` ekler.
    - `persistSave()`.
  - `odulluKapandi` ödül verince `save.reklam.sure = 0`.
  - `oyunSonu`: `reklamOyunBitti({ cevrimici, sureSn: game.oynananSure || 0, kutlama: !cevrimici && rank === 0 })`. Dünya turu bitişi Görev 6'da `kutlama: true` ekler.
  - Döngüde `if (game.running && !game.paused) game.oynananSure += dt`.
  - Dosya başı açıklaması yeni kuralları yazar.
- [ ] **Step 4: Çalıştır, geçtiğini gör.** `node hayalet-avcilari/test/reklam.test.mjs` → `TAMAM`. Ayrıca `node hayalet-avcilari/test/arkadas.test.mjs`'in reklam satırı emülatörle (Global Constraints) geçer.
- [ ] **Step 5:** README › "Reklamlar (AdMob)" tablosuna "Sıklık" satırı: kurallar ve dayanak bağlantısı (AdMob interstitial rehberi). Commit: `Hayalet Avcıları: hiç sıkmayan reklam sıklığı`.

### Task 2: Ülke verisi, kayıt ve sözlük

**Files:**
- Create: `hayalet-avcilari/www/ulkeler.js`, `hayalet-avcilari/www/dunya-turu.js`
- Modify: `hayalet-avcilari/www/index.html` (betik etiketleri), `hayalet-avcilari/www/game.js` (`defaultSave.dunyaTuru`, `loadSave`), `hayalet-avcilari/araclar/anahtarlar.mjs` (dosya listesine `ulkeler.js`, `dunya-turu.js`, `kostumler.js`), `www/i18n/*.js`
- Test: `hayalet-avcilari/test/ulkeler.test.mjs`, `hayalet-avcilari/test/dunya-turu.test.mjs`

**Interfaces:**
- Produces:
  - `ULKELER: Ulke[]` (rota sırasıyla) ve `ULKE_SAYISI = 51`
  - `Ulke = { kod, sira, kita: "avrupa"|"afrika"|"asya"|"amerika", aile: "K"|"KS"|"KP"|"SH"|"SV"|"GA"|"GDA"|"DA"|"KA"|"LA", ad, bossAd, obje1: {ressam, ad, bicim?}, obje2: {ressam, ad, bicim?}, palet: {zemin, desen, duvar, duvarKoyu, vurgu1, vurgu2}, kostum: {baslik, giysi, desen, renk: [ana, ikinci, sus], aksesuar: string[], ayakkabi?} }`
  - `ulkeSirada(k: number) -> Ulke` (k 1..51'e sınırlanır)
  - `ulkeKodla(kod: string) -> Ulke | null`
  - `ulkeTemasi(u) -> {name, floor, grid, wall, wallDark, waterTop: "#1e7fd6", waterBot: "#0a3a8a"}`
  - `ulkeTanitimi(u) -> string` = `t("✈️ {sira}. {ulke} — {obje1} ve {obje2}", …)`
  - `turKaydiniTemizle(v) -> {acik, damgalar, bitti}`
  - `turKaydi() -> save.dunyaTuru`
  - `damgaBas(kod) -> {yeni: boolean}`
- Kostüm tür adları (Görev 4 bunları çizer; veri yalnız bunları kullanır):
  - `baslik`: `efe, cicekTaci, krakuska, tirol, tam, bere, ucKose, cicekToka, kapuson, basBagi, fila, kubaBaslik, isicholo, satroka, boncukBant, imma, nemes, mesedde, simag, kece, doppi, sindhi, gaungBaung, tanjak, blangkon, salakot, nonLa, gat, kokosnik, kurk, kovboy, sombrero, vueltiao, chullo, boina, yok`
  - `giysi`: `entari, ceket, sarili, panco, kimono, elbise, askili`
  - `desen`: `duz, cizgili, ekose, puantiye, geometrik, nakis, batik, boncuk`
  - `aksesuar`: `yelpaze, fener, semsiye, mate, maske, boncukluYaka, kusak, sal, pelerin, fular, bandana`
  - `ayakkabi`: `babus, geta, markub, cizme`
- Obje ressam adları (Görev 5 ve 7–13 bunları yazar; kısa çizgi = `bicim: "kaya"`, ötekiler `"yama"`):
  - **Avrupa:** TR `periBacalari`/`laleBahcesi`, UA `aycicegiTarlasi`/`samanCatiliEv`, PL `wawelEjderi`/`leylekYuvalari`, DE `gugukluSaatEvi`/`yarimAhsapEvler`, GB `telefonKulubeleri`/`saatKulesi`, FR `eyfelKulesi`/`lavantaTarlasi`, IT `kolezyum`/`gondolIskelesi`, ES `yelDegirmenleri`/`aslanliCesme`
  - **Afrika:** MA `maviSokaklar`/`fenerliCarsi`, DZ `sahraKumullari`/`kayaKemerleri`–, CI `kakaoBahcesi`/`filAilesi`, GH `kenteTezgahi`/`kanopiKoprusu`, NG `zumaKayasi`–/`konusanDavullar`, CD `okapiOrmani`/`piroglar`, AO `kalandulaSelalesi`/`welwitschia`, ZA `masaDagi`–/`penguenler`, MZ `dauYelkenlileri`/`kajuAgaclari`, MG `baobabCaddesi`/`lemurlar`, TZ `kilimanjaro`–/`oymaKapilar`, UG `dagGorilleri`/`murchisonSelalesi`, KE `zurafalarAkasya`/`flamingoGolu`, ET `aksumTaslari`/`geladaMaymunlari`, SD `meroePiramitleri`/`devePazari`, EG `gizePiramitleri`/`felukalar`
  - **Asya:** YE `ejderKaniAgaclari`/`kuleEvler`, SA `hurmaBahcesi`/`filKayasi`–, PS `zeytinBahcesi`/`hayatAgaciMozaigi`, IQ `mudhifEvleri`/`senasilBalkonlar`, IR `sioseKopru`/`ruzgarKuleleri`, UZ `ipekYoluKervani`/`kavunPazari`, AF `ucurtmaTepesi`/`narBahcesi`, PK `susluKamyonlar`/`kayisiBahcesi`, IN `hawaMahal`/`lotusGoleti`, BD `susluRiksalar`/`sundarbans`, MM `inleBalikcilari`/`patheinSemsiyeleri`, TH `yuzenPazar`/`tukTuk`, MY `petronasKuleleri`/`rafflesia`, ID `komodoEjderleri`/`pirincTeraslari`, PH `cikolataTepeleri`–/`jeepney`, VN `haLongKorfezi`/`hoiAnFenerleri`, CN `pandalar`/`ejderDansi`, KR `hanokEvleri`/`onggiKupleri`, JP `kirazAgaclari`/`fujiDagi`–, RU `matruskalar`/`izbaEvi`
  - **Amerika:** CA `akcaagacOrmani`/`kunduzBaraji`, US `ozgurlukHeykeli`/`buyukKanyon`–, MX `papelPicadoPazari`/`ajoloteGoleti`, CO `mumPalmiyeleri`/`cartagenaEvleri`, PE `machuPicchu`/`lamalar`, BR `amazonKuslari`/`sekerSomunu`, AR `peritoMoreno`/`caminito`

- [ ] **Step 1: `test/ulkeler.test.mjs`'i yaz** (sayfada `ULKELER`'i okur):
  - Kodlar tam bu sırada:
    ```js
    ['TR','UA','PL','DE','GB','FR','IT','ES','MA','DZ','CI','GH','NG','CD','AO','ZA','MZ','MG','TZ','UG','KE','ET','SD','EG','YE','SA','PS','IQ','IR','UZ','AF','PK','IN','BD','MM','TH','MY','ID','PH','VN','CN','KR','JP','RU','CA','US','MX','CO','PE','BR','AR']
    ```
  - `PS` dışındaki küme BM WPP 2024 ilk 50'ye eşit:
    ```js
    IN CN US ID PK NG BR BD RU ET MX JP EG PH CD VN IR TR DE TH TZ GB FR ZA IT KE MM CO KR SD UG ES DZ IQ AR AF YE CA AO UA MA PL UZ MY MZ GH PE SA MG CI
    ```
    `IL` yok.
  - `sira === i + 1`. `kita` dağılımı: 1–8 avrupa, 9–24 afrika, 25–44 asya, 45–51 amerika.
  - `aile` spec §4.3 tablosuyla aynı (test içinde kod → aile eşlemesi).
  - `obje1.ressam` ve `obje2.ressam` yukarıdaki adlar. `bicim: "kaya"` yalnız işaretli 8 nesnede.
  - Palet: altı alanın hepsi `#rrggbb`; `zemin` bağıl parlaklığı ≤ 0,08; `desen !== zemin`.
  - Kostüm: her alan yukarıdaki tür listelerinden; `renk` 3 renk.
  - `ad`, `bossAd`, `obje1.ad`, `obje2.ad` boş değil.
  - `ulkeSirada(0).kod === 'TR'`, `ulkeSirada(99).kod === 'AR'`, `ulkeKodla('XX') === null`.
  - `ulkeTanitimi(ulkeKodla('FR')) === '✈️ 6. Fransa — Eyfel Kulesi ve lavanta tarlası'` (TR dilinde).
- [ ] **Step 2: `test/dunya-turu.test.mjs` kayıt sınamalarını yaz:**
  - Taze kayıtta `save.dunyaTuru` `{acik:1, damgalar:{}, bitti:0}`.
  - `turKaydiniTemizle({acik:99, damgalar:{FR:5, XX:5, DE:'x'}, bitti:'a'})` → `{acik:51, damgalar:{FR:5}, bitti:0}`.
  - `turKaydiniTemizle(undefined)` → varsayılan.
  - Eski biçimli yedek JSON'u `loadSave()` ile açılınca varsayılan gelir. `localStorage`'a yazıp sayfayı yeniden yükle.
  - `damgaBas('FR')` → `{yeni:true}`, elmas +3, `damgalar.FR` sayı, `acik === 7`. İkinci çağrı → `{yeni:false}`, elmas aynı.
  - `damgaBas('AR')` → `acik === 51`.
  - `damgaBas('XX')` → `{yeni:false}`, kayıt değişmez.
- [ ] **Step 3: Çalıştır, düştüğünü gör** (`ULKELER is not defined`).
- [ ] **Step 4: Uygula:**
  - `ulkeler.js`'te 51 kayıt, spec §4.2–§4.3'e göre. Kostüm tür eşlemesi her ülkenin §4.3 kıyafetine en yakın türlerle yapılır; örnek: TR `{baslik:"efe", giysi:"ceket", desen:"nakis", aksesuar:["kusak"]}`.
  - Paletler doğadan ve mimariden alınır, bayrak renkleri esas alınmaz; zemin koyu.
  - Adlar `t()` ile yazılır; boss adları kıyafetin kısa adıdır ("Efe hayalet", "Bereli hayalet"…).
  - `dunya-turu.js`'te kayıt işlevleri.
  - `defaultSave.dunyaTuru`; `loadSave`'de `merged.dunyaTuru = turKaydiniTemizle(data.dunyaTuru)`.
  - `index.html` betik sırası: `engeller.js`, `engel-temalari.js`, `ulke-aileleri.js`, `ulke-objeleri-avrupa.js`, `-afrika.js`, `-asya.js`, `-amerika.js`, `ulkeler.js`, `kostumler.js`, `dunya-turu.js`, `arkadaslar.js`, `game.js`. Henüz olmayan dosyalar `window.ULKE_AILELERI = window.ULKE_AILELERI || {}` / `window.ULKE_OBJELERI = …` tek satırıyla açılır.
  - 204 yeni anahtar (51 ülke + 102 obje + 51 boss adı) ve tanıtım kalıbı 5 dile çevrilir; ülke adları spec §4.5'e göre resmî kısa adlardır.
- [ ] **Step 5: Çalıştır, geçtiğini gör:**
  - `node hayalet-avcilari/test/ulkeler.test.mjs` ve `node hayalet-avcilari/test/dunya-turu.test.mjs` → `TAMAM`.
  - `node hayalet-avcilari/araclar/sozluk.mjs denetle` → 5 dil tamam.
  - `node hayalet-avcilari/test/engel-bicim.test.mjs` → `TAMAM`.
- [ ] **Step 6: Commit:** `Hayalet Avcıları: Dünya Turu verisi (51 ülke), kayıt ve sözlük`.

### Task 3: Dünya Turu kipi: engel, tema ve zemin kancaları

**Files:**
- Create: `hayalet-avcilari/www/ulke-aileleri.js`
- Modify:
  - `hayalet-avcilari/www/ulkeler.js` (`ulkeBicimSeti`, `ulkeEngelSeti`)
  - `hayalet-avcilari/www/dunya-turu.js` (`turUlkesi`, `turZeminCiz`)
  - `hayalet-avcilari/www/engeller.js` (`engelBicimleriniKur`, `engelOlustur`, `ressam`)
  - `hayalet-avcilari/www/game.js` (`startGame`, `getTheme`, `render`)
- Test: `hayalet-avcilari/test/dunya-turu.test.mjs`

**Interfaces:**
- Consumes: Görev 2'nin `ULKELER`, `ulkeSirada`, `ulkeKodla`, `ulkeTemasi`.
- Produces:
  - `window.ULKE_AILELERI[aile] = { ad, bicim: {duvar: "kale"|"kutuk"}, palet: {...}, duvar?, su?, zemin? }`. Bu görev yalnız `bicim` alanlarını yazar: K, KS, KP, SH, GA, DA, LA → `"kale"`; SV, GDA, KA → `"kutuk"`. Ressamlar Görev 5 ve 7–13'te eklenir.
  - `ulkeBicimSeti(kod) -> {duvar, obje1, obje2}` (ailenin duvarı, objelerde `obje.bicim || "yama"`).
  - `ulkeEngelSeti(kod) -> {palet, duvar, obje1, obje2, su}` (palet = aile paleti + ülke paleti; ressam yoksa `undefined` → `yedekRessam`).
  - `game.dunyaTuru: boolean`
  - `startGame(secenek?: {tur: true, ulke: number})`
  - `turUlkesi() -> Ulke | null` (`game.dunyaTuru ? ulkeSirada(game.level) : null`)
  - `turZeminCiz(ctx) -> boolean`. Ailenin `zemin(ctx, boyut, palet)` ressamı varsa 96 px'lik desen tuvali bir kez çizilir (ülke kodu ve ölçekle önbellek), `ctx.createPattern` ile dünya alanına döşenir ve `true` döner; yoksa `false`.
- `engeller.js` dalı tam olarak şudur:
  - `engelBicimleriniKur`: `const u = window.turUlkesi && window.turUlkesi(); const tema = u ? u.kod : (L - 1) % 6;`
  - `engelOlustur`: `set = typeof tema === "string" ? window.ulkeBicimSeti(tema) : (ENGEL_AILELERI[tema] || ENGEL_AILELERI[0])`
  - `ressam`: `set = typeof o.tema === "string" ? (window.ulkeEngelSeti(o.tema) || {}) : (T[o.tema] || T[0] || {})`

- [ ] **Step 1: Sınamaları yaz** (`dunya-turu.test.mjs`):
  - `startGame({tur:true, ulke:6})` → `game.dunyaTuru === true`, `game.level === 6`, `getTheme().name === 'Fransa'`.
  - Engellerin hepsinde `tema === 'FR'`. Dikdörtgenler (x, y, w, h, tür) normal oyunun 6. bölümüyle aynı: aynı sayfada `online.mode = 'host'`, `game.dunyaTuru = false`, `game.level = 6`, build ile karşılaştır.
  - Ressamı olmayan ülkede `engelResmi` hata vermez (yedek ressam).
  - `startGame()` → `dunyaTuru === false`, `level === 1`, tema 0 (Mor Şato).
  - `turZeminCiz` zemin ressamı yokken `false`.
  - Sayfa hatası yok.
- [ ] **Step 2: Çalıştır, düştüğünü gör.**
- [ ] **Step 3: Uygula** (yukarıdaki arayüzler). `render`: `if (!(window.turZeminCiz && turZeminCiz(ctx))) { bugünkü zemin + ızgara }`. Menüdeki "▶ OYNA" `startGame()` olarak kalır.
- [ ] **Step 4: Çalıştır, geçtiğini gör:** `dunya-turu`, `engel-bicim`, `engel`, `cizim` → `TAMAM`.
- [ ] **Step 5: Commit:** `Hayalet Avcıları: Dünya Turu kipi için engel, tema ve zemin kancaları`.

### Task 4: Boss kostüm takımı

**Files:**
- Create: `hayalet-avcilari/www/kostumler.js`
- Modify: `hayalet-avcilari/www/game.js` (`drawGhost`)
- Test: `hayalet-avcilari/test/ulke-cizim.test.mjs` (yeni; bu görev kostüm bölümünü açar)

**Interfaces:**
- Consumes: Görev 2'nin kostüm tür adları ve `ULKELER[i].kostum`; Görev 3'ün `turUlkesi()`.
- Produces:
  - `KOSTUM_TURLERI = {baslik: string[], giysi: string[], desen: string[], aksesuar: string[], ayakkabi: string[]}` (Görev 2'deki listelerin aynısı)
  - `kostumGecerliMi(k) -> boolean`
  - `bossKostumuCiz(ctx, s, kayit, zaman, katman: "govde"|"bas")`: hayaletin yerel koordinatında (`drawGhost`'un `translate`'inden sonra, `s = size / 40`) çizer.
    - `"govde"`: giysi gövdenin alt yarısında, dalgalı silüete göre kırpılmış; ayakkabılar eteğin altından görünür.
    - `"bas"`: başlık ve aksesuarlar.
- `drawGhost` sırası (Dünya Turu bossunda ve `kostumGecerliMi` doğruysa):
  1. Aura ve gölge
  2. Gövde `#ede9fe`
  3. `bossKostumuCiz(…, "govde")`
  4. Taç çizilmez
  5. Gözler ve ağız
  6. `bossKostumuCiz(…, "bas")`
  7. Can çubuğu

  Öteki her durumda bugünkü kırmızı gövde ve taç.

- [ ] **Step 1: Sınamaları yaz** (`ulke-cizim.test.mjs` iskeleti; 3.13.0 `engel-bicim` düzeninde):
  - `KOSTUM_TURLERI` Görev 2 listelerine eşit.
  - 51 ülkenin hepsinde `kostumGecerliMi(u.kostum)`.
  - Her ülkenin bossu 200×200 tuvale iki ölçekte (s=1, s=2.4) hatasız çizilir.
  - Dünya Turu'nda taç yok: bossun taç bölgesinde (`-34s..-22s`) `#ffd166` pikseli yok.
  - Gövde pikseli `#dc2626` değil.
  - Normal oyunda taç var (bölgede `#ffd166` pikseli var).
  - Bozuk kayıtla (`{baslik:"yokboyle"}`) taç geri gelir.
- [ ] **Step 2: Çalıştır, düştüğünü gör.**
- [ ] **Step 3: Uygula.**
  - Başlıklar 7 parametreli kalıp üstüne kurulur (geniş kenarlı, konik, yumuşak, kep, sarılı, taç, özel; spec §5.5).
  - Desenler giysiyi kırpılmış alanda doldurur.
  - Aksesuarlar bossun yanına ya da önüne çizilir; silah yoktur.
  - Renkler kaydın `renk` dizisinden gelir.
- [ ] **Step 4: Çalıştır, geçtiğini gör:** `node hayalet-avcilari/test/ulke-cizim.test.mjs --ekran <klasör>` → `TAMAM`. `boss-<KOD>.png` görüntülerinin 51'i de gözle denetlenir:
  - Kıyafet §4.3'teki tarife benziyor.
  - Dinî giysi, silah, insan yüzü yok.
- [ ] **Step 5: Commit:** `Hayalet Avcıları: boss kostüm takımı (51 ülke)`.

### Task 5: Taslak — KS ve DA aileleri, Türkiye ve Japonya (kullanıcı onayı)

**Files:**
- Modify: `hayalet-avcilari/www/ulke-aileleri.js` (KS, DA: `palet`, `duvar`, `su`, `zemin`)
- Create: `hayalet-avcilari/www/ulke-objeleri-avrupa.js` (`periBacalari`, `laleBahcesi`), `hayalet-avcilari/www/ulke-objeleri-asya.js` (`kirazAgaclari`, `fujiDagi`)
- Test: `hayalet-avcilari/test/ulke-cizim.test.mjs`

**Interfaces:**
- Consumes: 3.13.0 `window.ENGEL` yardımcıları ve `window.ENGEL_CANLI`. Ressam imzası engel-temalari ile aynıdır: `(ctx, w, h, r, p, B) -> canli[]`.
- Produces:
  - Kıta görevlerinin ortak adımları (aşağıda) ve test sabitleri `CIZILEN_AILELER = ['KS','DA']`, `CIZILEN_ULKELER = ['TR','JP']`.
  - Yeni canlı türleri `ENGEL_CANLI.balon` (Kapadokya balonu yavaş süzülür) ve `ENGEL_CANLI.yaprak` (kiraz yaprağı düşer). Kıta dosyaları `Object.assign(window.ENGEL_CANLI, {...})` ile ekler.

**Kıta görevlerinin ortak adımları** (Görev 5 ve 7–13 aynen izler):

- [ ] **A — Sınama.** `ulke-cizim.test.mjs`'te `CIZILEN_AILELER` ve `CIZILEN_ULKELER`'e görevin aile ve ülke kodlarını ekle. Sınamalar listelenen her aile ve ülke için:
  - Ressam var (`ULKE_AILELERI[a].duvar/su/zemin`, `ULKE_OBJELERI[ad]`).
  - **Kapsama:** çarpışma alanının içi (uzaklık < −2) boyalı, biçim dışı (> pay + 3) saydam. Duvar ve su için 80×80, 180×90, 90×180, 180×180; sınır için `ust/alt/sol/sag`; objeler için aynı dört boyut.
  - **Aynılık:** iki ayrı sayfada aynı ülkenin bölümündeki bütün engel resimlerinin özeti aynı.
  - Canlı katmanın döndürdüğü her `tur` `ENGEL_CANLI`'da tanımlı.
  - Sayfa hatası yok.
- [ ] **B — Çalıştır, düştüğünü gör** (`ressam yok: …`).
- [ ] **C — Uygula.** Aile ressamları (duvar sınırı `B.yon` ile çizer, `kaleDuvari` gibi), su kıyısı (`ENGEL.suTabani`), zemin döşemesi, ülke objeleri. Kurallar:
  - §4.3 tarifi ve §4.6 kuralları.
  - 3.13.0 üslubu: kalın kenar, yumuşak gölge, sevimli yüzler.
  - Uzun yapılar maket boyunda.
- [ ] **D — Çalıştır, geçtiğini gör:** `node hayalet-avcilari/test/ulke-cizim.test.mjs --ekran <klasör>` → `TAMAM`. Katalog (`katalog-<KOD>.png`: aile duvarı, sınır, su, iki obje, zemin) ve oyun içi (`oyun-<KOD>-tr390.png`, `oyun-<KOD>-ar340.png`) görüntüleri gözle denetlenir:
  - Objeler tanınıyor.
  - İnsan, bayrak, dinî öğe, silah yok.
  - Hayaletler zeminde okunuyor.
- [ ] **E — Commit:** `Hayalet Avcıları: Dünya Turu — <kıta/aile> (<kodlar>)`.

Bu görevin kendine özgü adımları:

- [ ] **Step 1–5:** Ortak adımlar A–E; aileler KS, DA; ülkeler TR, JP.
  - KS: kesme taş, çini kuşak, sivri kemerli nişler; su kıyısı çinili havuz; zemin geometrik çini (yıldız ve çokgen; dinî yazı yok).
  - DA: gri taş gövde, kıvrık kiremit saçaklı kuleler; koi göleti; taş döşeme ve yosun.
  - TR: peri bacaları (3–4 konik, şapkalı kaya; canlı `balon`), lale bahçesi (çini kenarlı tarh, kırmızı-sarı laleler).
  - JP: kiraz ağaçları (pembe taç; canlı `yaprak`), Fuji Dağı (`kaya` biçimi, karlı zirve maketi).
- [ ] **Step 6: Kullanıcı onayı (DUR).** Katalog ve oyun içi görüntüler ile Görev 4'ün TR ve JP boss görüntüleri kullanıcıya gönderilir (`SendUserFile`). Üslup, renkler, objeler ve kostümler için onay istenir. **Onay gelmeden Görev 7–13'e geçilmez.** Görev 6 (akış) onay beklerken yapılabilir. Düzeltme istenirse bu görevde yapılır ve yeniden gösterilir.

### Task 6: Akış ve ekranlar

**Files:**
- Modify: `hayalet-avcilari/www/dunya-turu.js`, `hayalet-avcilari/www/game.js` (döngüdeki bölüm bitişi, `nextLevel`, `spawnBoss`, `clientApplyLevel` bildirimi, `oyunSonu`), `hayalet-avcilari/www/index.html`, `hayalet-avcilari/www/style.css`, `www/i18n/*.js`
- Test: `hayalet-avcilari/test/dunya-turu.test.mjs`, `hayalet-avcilari/test/dil.test.mjs`

**Interfaces:**
- Consumes: Görev 2–4.
- Produces:
  - `openDunyaTuru()`, `renderDunyaTuru()`, `turSekmesi(ad: "rota"|"pasaport")`, `turUlkeSec(k)`, `dunyaTuruBaslat()` (seçili ülkeden `startGame({tur:true, ulke})`)
  - `turUlkesiBitti()`: bölüm bitişinde; tek kişilik ve kurucu
  - `tekrarOyna()`: oyun sonundaki "🔁 Tekrar Oyna"
  - `ulkeKucukResmi(u) -> string`: 64 px dataURL; 1. obje ressamından, önbellekli; ressam yoksa boş dize
  - `damgaGoster(u)`: `#tur-damga` perdesinde mürekkep görünümlü, hafif eğik oval damga (spec §4.4): kenarda ülke
    adı, ortada `ulkeKucukResmi(u)`. Pasaporttaki damgalar aynı görünümdedir, damgasız ülke soluk boş çerçevedir.
  - `ucakGecisi(onceki, sonraki, bitince)`: `#tur-gecis` perdesinde iki ülke adı arasında kesikli çizgide ✈️ (1,5 sn)
  - `game.turBitti: boolean`
- Ekran (spec §5.6):
  - `#screen-dunya-turu` içinde başlık, `#tur-sayac` ("🛂 n/51"), sekmeler (`✈️ Rota` / `🛂 Pasaport`), `#tur-liste` (kıta başlıkları + kartlar), `#tur-pasaport`, `#tur-basla` ("▶ Başla"), "⬅ Geri".
  - Kart `<button class="tur-kart {kilitli|acik|damgali} [secili]" data-sira>`: sıra, küçük resim, `<bdi>` ad, 🔒/✈️/🛂.
  - Ana menüde "🌐 Online Oyna" satırının üstünde `🌍 Dünya Turu` düğmesi.
- Akış (spec §3):
  - **Döngü:** kurucu ve tek kişilikte boss ve hayaletler bitince `if (game.dunyaTuru) turUlkesiBitti(); else` bugünkü bildirim ve `setTimeout(nextLevel, 1800)`.
  - **`turUlkesiBitti`:**
    - Bir kez çalışır (`game._turGeciste`).
    - `damgaBas`. "🛂 {ulke} damgası!" ve yeniyse "+3 💎" bildirimi; damga perdesi 0,9 sn.
    - 1,8 sn sonra sıra < 51 ise uçak perdesi 1,5 sn, ardından `nextLevel()`. 51 ise `turTamamlandi()`.
    - Her gecikmeden sonra `if (!game.running) return`.
  - **`turTamamlandi()`** (tek kişilik): `bitti` ilk kezse zamanı yazılır, `game.turBitti = true`, `oyunSonu(true, false)`. Başlık "🌍 Dünya turu tamamlandı!", reklam `kutlama: true`.
  - **`nextLevel`** Dünya Turu'nda: `pgsBolum` çağrılmaz; bildirim `ulkeTanitimi(u)`; `game._turGeciste = false`. `clientApplyLevel` da aynı bildirimi yazar.
  - **`spawnBoss`** Dünya Turu'nda: `t("👻 {ad} geldi!", {ad: u.bossAd})`.
  - **`oyunSonu`** Dünya Turu'nda:
    - `addLeaderboardEntry`, `submitOnlineScore`, `pgsOyunBitti` çağrılmaz; `highestLevel` değişmez.
    - `completionBonus` aynı formülle.
    - Sıra satırı boş.
    - `#btn-tekrar` `tekrarOyna()` çağırır: Dünya Turu'nda `game.turBitti` ise `openDunyaTuru()`, değilse `startGame({tur:true, ulke: Math.min(game.level, 51)})`; normal oyunda `startGame()`.

- [ ] **Step 1: Sınamaları yaz** (`dunya-turu.test.mjs`):
  - **Ekran:**
    - `save.dunyaTuru = {acik:7, damgalar:{TR:1,UA:1}, bitti:0}` → `openDunyaTuru()`.
    - 51 kart: 2 `damgali`, 5 `acik`, 44 `kilitli`; sayaç "🛂 2/51"; varsayılan seçili kart 7.
    - Kilitli karta dokununca seçim değişmez.
    - Pasaport sekmesinde 51 yuva: 2 damga (`.damga`), 49 soluk boş çerçeve (`.damga.bos`).
  - **Geçiş:**
    - `startGame({tur:true, ulke:6})`, ardından `game.bossDefeated = true; game.ghosts = []`. Beklenen:
      - `FR` damgası, elmas +3, damga perdesi görünür
      - ~3,3 sn sonra `game.level === 7`, `getTheme().name === 'İtalya'`
      - perdeler gizli
      - bildirim metni "✈️ 7. İtalya — Kolezyum ve gondollu kanal iskelesi"
    - `pgsBolum` sahte işlevi çağrılmadı.
  - **Yenilgi:**
    - 7'de `endGame(false)` → Şampiyonlar listesi uzunluğu aynı.
    - `submitOnlineScore` ve `pgsOyunBitti` çağrılmadı; `highestLevel` aynı; `acik >= 7`.
    - `tekrarOyna()` → `game.level === 7`, `dunyaTuru === true`.
  - **Bitiş:** `startGame({tur:true, ulke:51})` ve bitiş → `AR` damgası, `bitti > 0`, `#gameover-title` "🌍 Dünya turu tamamlandı!", reklam sahte işlevine `kutlama: true`.
  - **Review Focus 4:**
    - Geçiş sırasında (`turUlkesiBitti`'den 0,5 sn sonra) `endGame(false)` → 4 sn sonra `game.level` değişmemiş, perdeler gizli, damga tek.
    - `turUlkesiBitti` iki kez çağrılınca tek damga, tek `nextLevel`.
  - **Boss bildirimi:** Dünya Turu'nda `spawnBoss()` → bildirim "👻 Bereli hayalet geldi!" (FR).
- [ ] **Step 2: `dil.test.mjs`'e ekranlar ekle:**
  - `dunya_turu` (rota)
  - `pasaport`
  - `tur_damga` (perde)
  - `tur_gecis` (perde)
  - `tur_tanitim`: en uzun adlı ülkenin tanıtım bildirimi; Review Focus 5; Hintçe ve Arapçada 340 px'te taşma yok
  - `tur_boss`: Dünya Turu'nda boss doğmuş oyun ekranı
- [ ] **Step 3: Çalıştır, düştüğünü gör.**
- [ ] **Step 4: Uygula** (yukarıdaki arayüzler). `style.css`: kartlar 44 px'ten küçük dokunma hedefi olmaz, mantıksal kenar boşlukları (RTL), perdeler `position: fixed` ve arka planı yarı saydam. Yeni metinler 5 dile.
- [ ] **Step 5: Çalıştır, geçtiğini gör:** `dunya-turu`, `dil`, `siralama`, `reklam`, `engel` → `TAMAM`; sözlük denetimi temiz.
- [ ] **Step 6: Commit:** `Hayalet Avcıları: Dünya Turu ekranı, pasaport, damga ve uçak geçişi`.

### Task 7: Avrupa — K ailesi; UA, PL, DE, GB, FR, IT, ES

- [ ] **Step 1–5:** Ortak adımlar A–E (Görev 5); dosya `ulke-objeleri-avrupa.js`.
  - **K ailesi:**
    - Taş ya da tuğla kale. Mazgal `palet.mazgal: "kare"|"kirlangic"` (IT ve RU kırlangıç).
    - Su kıyısı taş rıhtım; zemin Arnavut kaldırımı.
  - **UA:** ayçiçeği tarlası; saman çatılı beyaz ev ve hasır çit.
  - **PL:** Wawel ejderi (sevimli, ağzından küçük alev; canlı `alevruhu` yerine yeni `ejderAlevi`); direk üstünde leylek yuvaları.
  - **DE:** guguklu saat evi (canlı `guguk`: kuş kapakta belirip kaybolur); yarım ahşap evler.
  - **GB:** kırmızı telefon kulübeleri; saat kulesi maketi.
  - **FR:** Eyfel Kulesi maketi; lavanta tarlası (mor sıralar).
  - **IT:** Kolezyum kemer dizisi; gondollu kanal iskelesi (gondol suda değil yamanın içindeki kanal şeridinde).
  - **ES:** yel değirmenleri (canlı `pervane`); Aslanlı Çeşme (havuz ve 12 sevimli aslan).

### Task 8: Kuzey Afrika ve Sahel — KP ve SH aileleri; MA, DZ, CI, GH, NG, SD, EG

- [ ] **Step 1–5:** Ortak adımlar A–E; dosya `ulke-objeleri-afrika.js`.
  - **KP ailesi:** kerpiç gövde, basamaklı mazgal, beyaz badana, çıkıntılı ahşap kirişler; hurmalı vaha kıyısı; kum dalgası zemin.
  - **SH ailesi:** kerpiç duvar, köşelerde saman çatılı yuvarlak ambar kuleleri; kırmızı topraklı, sazlıklı nehir kıyısı; kırmızı toprak ve ot tutamı zemin.
  - **MA:** mavi sokak ve saksılar; fenerli çarşı tezgâhı (canlı `fener`).
  - **DZ:** Sahra kumulları; Tassili kaya kemerleri (`kaya`).
  - **CI:** kakao bahçesi (gövdede kakao meyveleri); fil ailesi.
  - **GH:** kente dokuma tezgâhı (geometrik şeritler); kanopi asma köprüsü (ağaçlar arası).
  - **NG:** Zuma Kayası (`kaya`); konuşan davullar.
  - **SD:** Meroe piramitleri (sivri, küçük; çoklu); deve pazarı (develer, ip, yem).
  - **EG:** Gize piramitleri ve sevimli Sfenks; feluka yelkenlileri.
  - Cezayir'den sonra Fildişi Sahili'ne çöl üstünden uçulur; görsel bir şey gerekmez.

### Task 9: Savan — SV ailesi; CD, AO, ZA, MZ, MG, TZ, UG, KE, ET

- [ ] **Step 1–5:** Ortak adımlar A–E; dosya `ulke-objeleri-afrika.js`.
  - **SV ailesi:** kazık çit ve aralarda kuru taş öbekleri; sazlıklı su birikintisi; çatlak toprak ve kuru ot zemin.
  - **CD:** okapi ormanı; nehirde piroglar (kıyı şeridi yamanın içinde).
  - **AO:** Kalandula Şelalesi (canlı `sele`: akan su çizgileri); welwitschia (iki uzun kıvrık yaprak).
  - **ZA:** Masa Dağı (`kaya`, düz tepe); Afrika penguenleri.
  - **MZ:** dau yelkenlileri; kaju ağaçları.
  - **MG:** Baobab Caddesi (dizi hâlinde baobablar); lemurlar (halkalı kuyruk).
  - **TZ:** Kilimanjaro (`kaya`, karlı zirve); Zanzibar oyma kapıları.
  - **UG:** dağ gorilleri (sevimli aile); Murchison Şelalesi (canlı `sele`).
  - **KE:** zürafalar ve akasya; flamingolu göl (canlı `flamingo`: bacak değiştirir).
  - **ET:** Aksum dikili taşları; gelada maymunları.

### Task 10: Arabistan, Filistin, İran ve Orta Asya — YE, SA (KP); PS, IQ, IR, UZ, AF (KS)

- [ ] **Step 1–5:** Ortak adımlar A–E; dosya `ulke-objeleri-asya.js`.
  - **YE:** Sokotra ejder kanı ağaçları (şemsiye taç); Sana'a kule evleri (beyaz süslü kerpiç, renkli kemerli pencere).
  - **SA:** hurma bahçesi; AlUla Fil Kayası (`kaya`).
  - **PS:** zeytin bahçesi (gümüş yeşili taç, zeytinler); Hayat Ağacı mozaiği (taş mozaik zemin, ortada ağaç, iki otlayan ceylan; aslan ve av sahnesi **yok**). KS ailesinde kuşak rengi kırmızı işleme (`palet.kusak`).
  - **IQ:** kamış mudhif evleri (kemerli kamış ev, bataklık kıyısı); şenaşil ahşap balkonlar.
  - **IR:** Siose Pol köprüsü (iki katlı kemerler, altında su şeridi); Yezd rüzgâr kuleleri (badgir).
  - **UZ:** İpek Yolu kervanı (develer, yükler); kavun pazarı.
  - **AF:** uçurtmalı tepe (canlı `ucurtma`: süzülen renkli uçurtmalar, ip); nar bahçesi.

### Task 11: Güney ve Güneydoğu Asya — GA ve GDA aileleri; PK, IN, BD, MM, TH, MY, ID, PH, VN

- [ ] **Step 1–5:** Ortak adımlar A–E; dosya `ulke-objeleri-asya.js`.
  - **GA ailesi:** kırmızı kumtaşı (BD'de tuğla), köşelerde küçük kubbeli köşk kuleleri; basamaklı havuz kenarı; kumtaşı döşeme zemin.
  - **GDA ailesi:** bambu çit ve ahşap direkler; lotus ve bambu kıyısı; hasır örgü zemin.
  - **PK:** süslü kamyonlar (renkli boya, püsküller); Hunza kayısı bahçesi (çiçekli ağaçlar, karlı dağ silueti).
  - **IN:** Hawa Mahal cephesi (pembe, çok pencereli); lotus göleti ve tavus kuşları.
  - **BD:** süslü rikşalar; Sundarbans mangrovları ve sevimli Bengal kaplanı.
  - **MM:** Inle Gölü (tek ayakla kürek çeken **hayalet** balıkçı, konik ağ); Pathein şemsiyeleri (canlı yok).
  - **TH:** yüzen pazar (meyveli kayıklar, **hayalet** satıcılar); tuk-tuk.
  - **MY:** Petronas İkiz Kuleleri maketi (canlı `isik`); Rafflesia çiçeği.
  - **ID:** Komodo ejderleri (sevimli); pirinç terasları.
  - **PH:** Çikolata Tepeleri (`kaya`, kahverengi yuvarlak tepeler); jeepney.
  - **VN:** Ha Long Körfezi (su üstünde karstik kayalar ve ahşap yelkenli); Hoi An fenerleri (canlı `fener`).

### Task 12: Doğu Asya ve Rusya — CN, KR (DA); RU (K)

- [ ] **Step 1–5:** Ortak adımlar A–E; dosya `ulke-objeleri-asya.js`.
  - **CN:** pandalar ve bambu; ejder dansı (sopalar üstünde uzun, sevimli kumaş ejder; canlı `ejderDans`: dalgalanır).
  - **KR:** hanok evleri; kimçi küpleri (onggi).
  - **RU:** matruşka bebekleri; oymalı ahşap izba evi. K ailesinde kırmızı tuğla ve kırlangıç mazgal.

### Task 13: Amerika — KA ve LA aileleri; CA, US, MX, CO, PE, BR, AR

- [ ] **Step 1–5:** Ortak adımlar A–E; dosya `ulke-objeleri-amerika.js`.
  - **KA ailesi:** sivri kütük palisat; kütük iskeleli göl kıyısı; çimen ve çam iğnesi zemin.
  - **LA ailesi:** renkli sıvalı duvar (PE'de İnka çokgen taşı: `palet.tas: "inka"`); renkli karo kenarlı kanal; pişmiş toprak karo zemin.
  - **CA:** akçaağaç ormanı ve şurup kovaları (canlı `yaprak`, kırmızı); kunduz barajı (sevimli kunduz).
  - **US:** Özgürlük Heykeli maketi; Büyük Kanyon (`kaya`, katmanlı kızıl kayalar).
  - **MX:** papel picado süslü pazar (canlı: bayrakçıklar dalgalanır, `papel`); ajolote göleti (Xochimilco kayığı ve sevimli ajolotlar).
  - **CO:** Kokora mum palmiyeleri; Cartagena'nın balkonlu renkli evleri.
  - **PE:** Machu Picchu terasları (yalnız teraslar ve taş evler, tapınak yok); lamalar.
  - **BR:** Amazon tukanları ve araları; Şeker Somunu Dağı ve teleferik (canlı: teleferik gider gelir, `teleferik`).
  - **AR:** Perito Moreno Buzulu (buz duvarı, yüzen buz); Caminito'nun renkli evleri.
- [ ] **Step 6:** `ulke-cizim.test.mjs`'e son sınama: `CIZILEN_ULKELER.length === 51` ve `CIZILEN_AILELER.length === 10`. Ressamı eksik ülke ya da aile kalmadı.

### Task 14: Çevrimiçi ve kural

**Files:**
- Modify:
  - `hayalet-avcilari/firebase/database.rules.json`: `rooms/$roomId` içine `"tur"`; `"level"`e kurucu yazımı.
  - `hayalet-avcilari/firebase/test/kurallar.test.mjs`
  - `hayalet-avcilari/www/game.js`: `openCreateRoom`, `submitCreateRoom`, `enterLobby`, `startRoomListener`, `renderLobby`, `renderRoomList`, `startMpGameClient`, `durumGeldi`, `turuBitir`
  - `hayalet-avcilari/www/dunya-turu.js`
  - `hayalet-avcilari/www/index.html` (Oda Kur'da kip ve ülke seçimi)
  - `www/i18n/*.js`
- Test: `hayalet-avcilari/test/cevrimici.test.mjs`, `hayalet-avcilari/test/dunya-turu.test.mjs`

**Interfaces:**
- Kurallar:
  ```json
  "tur":   { ".validate": "newData.isBoolean()" },
  "level": { ".write": "auth != null && data.parent().child('hostUid').val() === auth.uid",
             ".validate": "newData.isNumber() && newData.val() >= 1 && newData.val() <= 1000" }
  ```
  Kurucunun `level` yazımı turdan sonra "kaldığı ülkeden devam" içindir.
- Produces:
  - `online.selectedKip: "normal"|"tur"`, `online.selectedUlke: number`
  - `online.cachedRoom.tur`, `online.cachedRoom.level`
  - `online.turSonUlke: number|null`
  - `turDurumGeldi(st) -> boolean` (istemci; `true` ise `durumGeldi` bölüm uygulamasını atlar)
  - `turOdaUlkesi(room) -> Ulke|null`
- Davranış (spec §6):
  - **Oda kurma:**
    - Kip seçimi "🎮 Normal" / "🌍 Dünya Turu"; Dünya Turu'nda açık ülkelerden seçici (varsayılan `acik`).
    - Oda `{…, tur: true, level: k}` ile kurulur.
    - `tur` reddedilirse (izin hatası) "⚠ Dünya Turu odası şu an kurulamıyor" yazar ve normal odaya dönülmez.
  - **Başlatma:** `startMpGameClient` → `startGame(cachedRoom.tur ? {tur:true, ulke: clamp(cachedRoom.level)} : undefined)`; `online.turSonUlke = null`.
  - **`turDurumGeldi`** (istemci):
    - `st.lvl > 51` ilk kez geldiğinde: 51. damga (ve `online.turSonUlke === 51` ise), "🌍 Dünya turu tamamlandı!" bir kez. `game.level` 51'de kalır, bölüm uygulanmaz.
    - `online.turSonUlke !== null && st.lvl === online.turSonUlke + 1` ise önceki ülkenin damgası.
    - Sonra `online.turSonUlke = min(st.lvl, 51)`.
  - **Kurucu bitişi:** 51 bitince `state.lvl = 52` yazar, 2 sn sonra `turuBitir()`.
  - **`turuBitir`** Dünya Turu odasında `level` alanını da yazar: devam edilecek ülke `min(game.level, 51)`; tur tamamlandıysa 1.
  - **Lobi ve liste:** lobide "🌍 {sıra}. {ülke}" satırı (`level` dinleyicisiyle güncel). Oda listesinde Dünya Turu odası "🌍 {ülke}" ile.
  - **Eski sürüm:** `tur` alanı olmayan oda bugünkü gibi.

- [ ] **Step 1: Kural sınamalarını yaz:**
  - Kurulumda `tur: true` ve `tur: false` kabul; `tur: "evet"` ve `tur: 1` ret.
  - Kurucu `level`'i 12 yapar (kabul); konuk yapamaz (ret); 0 ve 1001 ret.
  - Eski oda (alansız) aynen çalışır.
- [ ] **Step 2: `dunya-turu.test.mjs`'e istemci sınamaları** (ağsız; `online.mode = 'client'`, `game.dunyaTuru = true`, `durumGeldi` doğrudan çağrılır):
  - Ortadan katılma (Review Focus 3): ilk durum `lvl: 7` → damga yok. Sonra `lvl: 8` → yalnız 7. ülkenin damgası (`FR` değil `IT`).
  - Karışık sürüm (Review Focus 1): `lvl: 51`, `52`, `53`, `54` → 51 damgası bir kez, tamamlandı bildirimi bir kez, `game.level === 51`, sayfa hatası yok.
  - `turOdaUlkesi({tur:true, level:999}).kod === 'AR'`.
- [ ] **Step 3: `cevrimici.test.mjs`'e ekle** (emülatör, iki tarayıcı):
  - Kurucu Dünya Turu odasını 3. ülkeden (PL) kurar; konuk listede "🌍 Polonya"yı görür, katılır; ikisinde de tema "Polonya", engellerde `tema === 'PL'`.
  - Kurucu bölümü bitirir → iki tarafta `PL` damgası, `game.level === 4`.
  - Herkes hayalet olunca tur biter → oda `level === 4`; lobide "🌍 4. Almanya".
  - `tur` alanı olmayan kurallarla (eski kural dosyası yüklenmiş emülatör) Dünya Turu odası kurma → uyarı metni, oda yok.
- [ ] **Step 4: Çalıştır, düştüğünü gör** (kural ve istemci sınamaları).
- [ ] **Step 5: Uygula.**
- [ ] **Step 6: Çalıştır, geçtiğini gör** (Global Constraints'teki emülatör komutlarıyla):
  - `kurallar` → bütün sınamalar
  - `cevrimici`, `arkadas`, `alti` → `TAMAM`
  - `dunya-turu`, `dil` → `TAMAM`
- [ ] **Step 7: Commit:** `Hayalet Avcıları: çevrimiçi Dünya Turu odası ve kural`.

### Task 15: Doğrulama — performans, diller, ekran denetimi

**Files:**
- Modify: `hayalet-avcilari/test/cizim.test.mjs`, `hayalet-avcilari/test/alti.test.mjs` (`--tur` ile Dünya Turu ölçümü)
- Test: bütün testler

- [ ] **Step 1: Kare hızı.**
  - `cizim.test.mjs` Dünya Turu'nda FR (K), KE (SV) ve JP (DA) için de ölçer: botlu ve hayaletli, CPU 4 kat yavaş.
  - Eşikler bugünküyle aynı. Zemin deseni açıkken de geçer.
  - `alti.test.mjs` 6 kişilik Dünya Turu odasında (KE) bugünkü eşikleri geçer.
- [ ] **Step 2: Bütün testler:**
  - Çevrimdışı: `reklam`, `ulkeler`, `dunya-turu`, `ulke-cizim`, `engel`, `engel-bicim`, `cizim`, `siralama`, `dil` (6 dil × 390/340)
  - Emülatör: `kurallar`, `arkadas`, `cevrimici`, `alti`
  - `sozluk.mjs denetle` → hepsi `TAMAM`.
- [ ] **Step 3: Ekran denetimi.**
  - `ulke-cizim.test.mjs --ekran <klasör>` 51 katalog, 102 oyun içi ve 51 boss görüntüsü üretir.
  - Her biri §4.3 ve §4.6'ya göre gözle denetlenir; bulunan sorunlar düzeltilip sınamalar yeniden çalıştırılır.
  - Kullanıcıya her kıtadan iki ülkelik bir seçki gönderilir.
- [ ] **Step 4: Commit:** `Hayalet Avcıları: Dünya Turu doğrulaması (kare hızı, diller, ekran)`.

### Task 16: Sürüm 3.14.0 ve yayın

**Files:**
- Modify:
  - Sürüm: `hayalet-avcilari/android/app/build.gradle` (versionCode 47, versionName '3.14.0'), `package.json`, `package-lock.json`
  - Notlar ve sözlük: `www/game.js` (`APP_VERSION`, `UPDATE_NOTES["3.14.0"]`), `www/i18n/*.js`
  - Mağaza: `magaza/surum-notu.txt`, `magaza/diller/*.md` (sürüm notu + uzun açıklamaya "🌍 DÜNYA TURU"), `magaza/aciklamalar.md`, `araclar/magaza-gorsel.mjs` (yedinci kare: Dünya Turu)
  - Belgeler: `README.md`, `docs/superpowers/specs/2026-10-24-hayalet-ulkeler-design.md` (durum satırı)
  - İstek dosyaları: `firebase/yayin-istek.txt`, `play-istek.txt`

- [ ] **Step 1: Notlar.**
  - `UPDATE_NOTES["3.14.0"]` satırları:
    - "🌍 Dünya Turu: en kalabalık 50 ülke ve Filistin, her ülke kendi görselleri ve geleneksel kıyafetli bossuyla."
    - "🛂 Ülkeyi geç, pasaportuna damga bas; arkadaşlarınla birlikte gez."
    - 3.13.1'in "🛡️ Artık yalnızca her yaşa uygun reklamlar gösterilir." satırı
    - "😌 Reklamlar seyrekleşti; yeni oyuncuya ve kısa oyunlardan sonra reklam yok."
    - 3.13.0 incelemedeyse onun satırları.
  - Mağaza notu 7 dilde ≤ 500 karakter (`surumNotlari` ile denetle). Sığmazsa en eski satır çıkar.
- [ ] **Step 2: Sürüm ve sınamalar.** Sürüm numaraları; `dil.test` (güncelleme penceresi 6 dil); sözlük denetimi; Görev 15'teki bütün testler.
- [ ] **Step 3: Mağaza ve belgeler.**
  - Mağaza uzun açıklamasına 7 dilde "🌍 DÜNYA TURU" bölümü (≤ 4000 karakter).
  - Görsel üreticisine Dünya Turu karesi; 7 dilde görseller yeniden üretilir.
  - README: "Dünya Turu" ve "3.14.0" bölümleri, sürüm ve Play satırları.
  - Spec durum satırı "uygulandı, 3.14.0 (47)".
  - Commit ve push. `hayalet-android` derlemesinin yeşil olduğu doğrulanır (koşu numarası not edilir).
- [ ] **Step 4: Kural yayını (kullanıcının açık onayıyla).** `firebase/yayin-istek.txt`'e `durum` + `yayinla` satırları; push. Koşu "AYNI" diyene kadar izlenir; satırlar "# (yapıldı …)" ile kapatılır.
- [ ] **Step 5: Play (kullanıcının açık onayıyla).** `play-istek.txt`'e `yukle yayinla uygula`, `magaza uygula`, `gorsel uygula`; push. Koşular izlenir, satırlar kapatılır. 3.13.1'in Play gönderimi beklemesi (görev #44) böylece kapanır.
- [ ] **Step 6: `main` eşitlemesi (kullanıcının açık onayıyla).** İstek dosyalarında etkin satır kalmadığı doğrulanır, sonra `main` hızlı ileri alınıp push edilir.
