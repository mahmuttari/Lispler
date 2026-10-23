# Hayalet Avcıları — Arkadaş ekleme ve oyuna davet: uygulama planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Oyunculara 6 karakterli kodla ya da odadan ➕ ile arkadaş ekleme (istek + kabul, reddet, çıkar, engelle), arkadaşların çevrimiçi durumunu görme ve oyun açıkken arkadaşı kendi odasına davet etme (3.13.0, versionCode 45).

**Architecture:** Veri oyunun Realtime Database'inde yeni kök düğümlerde (`friendCodes`, `users`, `presence`); tutarlılığı ve izinleri sunucu kuralları sağlar, sunucu kodu yok. İstemci mantığı ve ekranları yeni `www/arkadaslar.js` dosyasındadır; `game.js`'e yalnız kancalar eklenir.

**Tech Stack:** Firebase compat SDK 10.13.0 (RTDB + Auth, CDN), saf JS + HTML/CSS (Capacitor 8), `@firebase/rules-unit-testing` (kural testleri), Playwright + Chromium + Firebase emülatörü (uçtan uca), `node:test`.

**Spec:** `docs/superpowers/specs/2026-10-23-hayalet-arkadaslar-design.md` (kullanıcı onayladı, 23 Ekim 2026)

## Global Constraints

- Yeni bağımlılık yok; Firestore SDK eklenmez; yalnız yüklü compat SDK (RTDB + Auth) kullanılır.
- Kod alfabesi `ABCDEFGHJKMNPQRSTUVWXYZ23456789`, tam 6 karakter, `crypto.getRandomValues` ile; ekranda `#K7MP2Q`; girişte `#`, boşluk ve küçük harf kabul edilir.
- `at` = `firebase.database.ServerValue.TIMESTAMP` (`sunucuZamani()`); kurallar `<= now` ister.
- `name` 1–50 karakter, `roomName` ≤ 60, `charKey` ≤ 30, `costumeIdx` sayı; `state` ∈ `on` | `room` | `off`.
- Sınırlar: en çok 50 arkadaş; en yeni 30 istek ve 10 davet gösterilir; davet 5 dakika geçerli (sunucu saatiyle); aynı arkadaşa 30 saniyede bir davet; kod çakışmasında en çok 3 deneme; her ağ işlemi 10 saniye zaman aşımlı.
- Kurallar spec §4.2'deki metindir; uygulama bu metne uyar, kuralı gevşetmez.
- Bütün yeni metinler `t("…")` ile yazılır ve 5 dile çevrilir (`node hayalet-avcilari/araclar/sozluk.mjs yaz <dil> <json>`); kod kutusunun yer tutucusu `#______`.
- Kullanıcı metni HTML'e yalnız `escapeHtml()` ile ya da `textContent` ile girer.
- Commit mesajları Türkçe; dal `claude/beautiful-feynman-pxwdju`; her commit sonunda oturumun atıf satırları; PR, Play'e gönderme, kural yayını ve `main`'e birleştirme yalnız kullanıcının açık onayıyla.

## Belgeye göre netleştirmeler (uygulama ayrıntısı; kullanıcıya planla birlikte sunulur)

1. `arkadaslar.js`, `index.html`'de `playgames.js` gibi **`game.js`'ten önce** yüklenir (spec §8 "sonra" diyor): yalnız işlev ve durum tanımlar, `game.js`'in `init`'i ve kancaları onu her an çağırabilir.
2. `presence` yalnız **en az bir arkadaşı olan** oyuncu için yazılır, son arkadaş gidince silinir; arkadaş kodu yalnız Arkadaşlar ekranı ilk açıldığında alınır (veri en aza indirme).
3. Tek kişilik oyundan davete geçerken `oyunSonu(false, false, true)`: üçüncü parametre (`reklamsiz`) oyun sonu reklamını atlar.
4. Anonim oyuncunun (Google girişi yok, "Hesabı Sil" düğmesi yok) arkadaşlık verisinin silinmesi e-posta yoluyla yapılır; `hesap-silme.html` bunu yazar.

## Review Focus

1. **Avcı adı boş** (yeni kurulum) oyuncu ➕/kodla ekler ya da davet eder → "Önce avcı adını ayarla" der, yazım denenmez (kural `name` ≥ 1 ister). Test: Task 2.
2. **Adında HTML ya da sağdan sola metin olan arkadaş** (`<img src=x onerror=alert(1)>`, Arapça ad) → liste, davet penceresi ve şeritte düz metin görünür, sayfa hatası yok. Test: Task 3 ve Task 5.
3. **İnternet yokken** ➕ / Kabul / Davet → 10 sn içinde "⚠ Bağlanılamadı, yeniden dene"; düğme takılı kalmaz (RTDB çevrimdışı yazımı kuyruğa alır, söz hiç dönmeyebilir). Test: Task 2.
4. **Hızlı çift dokunma** (Kabul, ➕) → tek kayıt, ikinci dokunuş hata bildirimi vermez. Test: Task 2 (eşzamanlı kabul) ve Task 4 (çift ➕).
5. **Davet edilen zaten o odadaysa ya da oda dolmuşsa** → şerit çıkmaz / "Oda dolu" ve davet silinir. Test: Task 5.

---

### Task 1: Arkadaşlık kuralları ve kural testleri

**Files:**
- Modify: `hayalet-avcilari/firebase/database.rules.json` (kökte `accounts_google`'dan sonra `friendCodes`, `users`, `presence`)
- Test: `hayalet-avcilari/firebase/test/kurallar.test.mjs` (yeni `describe("arkadaşlar — kod, istek, kabul, engel, davet, çevrimiçi durum")`)
- Modify: `hayalet-avcilari/firebase/README.md` (yeni bölüm "`friendCodes`, `users`, `presence` — arkadaşlar (3.13.0)": spec §4.3 tablosu; Yayınlama'ya "3.13.0: arkadaşlar" adımı)

**Interfaces:**
- Produces: spec §4.2'deki yollar ve izinler; sonraki görevler bu yolları ve gövdeleri birebir yazar.

- [ ] **Step 1: Failing testleri yaz.** Mevcut sabitler kullanılır (`HOST`=A, `KONUK`=B, `YABANCI`=C, `ODA`, `SUNUCU`, `anonim`, `misafir`, `odaKur`). Yardımcı: `arkadasYap(a, b)` (kuralsız iki taraflı kayıt), `istek(from, to)` gövdesi `{ name: "Ayşe", at: SUNUCU }`. Testler (her biri izinli işlemi `assertSucceeds`, izinsizi `assertFails` ile):
  - `kod`: A `friendCodes/K7MP2Q` = `{uid: A, name}` kurar; B tek kodu okur; `friendCodes` kökü okunamaz; girişsiz okunamaz; B aynı kodun üstüne ve `{uid: A}` ile başka koda yazamaz; A adı günceller ve siler.
  - `istek`: A tek `update` ile `users/B/requests/A` + `users/A/sent/B` yazar; `users/A/requests/A` (kendine), C'nin `users/B/requests/A` yazması (başkası adına), arkadaşken, B A'yı engelliyken reddedilir; A `users/B/requests` okuyamaz.
  - `kabul`: istek varken B tek `update` ile `users/B/friends/A`, `users/A/friends/B`, `users/B/requests/A: null`, `users/A/sent/B: null` yazar; istek yokken B'nin `users/A/friends/B` yazması, C'nin yazması ve var olan kaydın üzerine yazma reddedilir.
  - `çıkar`: A tek yazımda iki tarafı siler; B kendini A'nın listesinden siler; C silemez.
  - `engel`: B tek yazımda `users/B/blocks/A` + iki yöndeki arkadaşlık, istek, `sent` ve davet silmelerini yazar; sonra A'nın isteği ve daveti reddedilir; engel kalkınca istek yine gider; A `users/B/blocks` okuyamaz.
  - `davet`: arkadaşken ve A `rooms/ODA/players/A`'dayken `users/B/invites/A` = `{room: ODA, roomName, name, at}` yazılır ve üzerine yazılır; arkadaş değilken, B engelliyken, A odada değilken, `room: "../x"` iken reddedilir; B daveti siler.
  - `çevrimiçi durum`: A `presence/A` yazar; arkadaş B okur; C okuyamaz; arkadaşlık bitince B okuyamaz; B `presence/A` yazamaz; `state: "uzak"` reddedilir.
  - `hesap silme`: A önce tek yazımda `users/B/friends/A`, `users/B/invites/A`, `users/C/requests/A` siler, sonra `users/A`, `presence/A`, kendi `friendCodes` kaydını siler; A `users/B` ve `presence/B` silemez.
  - `şema`: `users/A/friends/B`'de fazladan alan, 51 karakterlik ad, `at: Date.now() + 86400000`, `users/k!/code`, `users/A/code: "abc123"` reddedilir.
- [ ] **Step 2: Kırmızı olduğunu gör.** Run: `cd hayalet-avcilari/firebase && npm test` (bu bulut ortamında: `npx firebase emulators:exec --config <database.rules satırı olmayan geçici firebase.json> --only database,firestore --project demo-hayalet-avcilari "node --test test/kurallar.test.mjs"`). Expected: yeni testlerdeki `assertSucceeds` satırları `PERMISSION_DENIED` ile FAIL; eski 19 test PASS.
- [ ] **Step 3: Kuralları ekle.** Spec §4.2'deki `friendCodes`, `users`, `presence` bloklarını `database.rules.json`'a birebir ekle; JSON geçerliliğini `python3 -c "import json;json.load(open('database.rules.json'))"` ile denetle.
- [ ] **Step 4: Yeşil olduğunu gör.** Aynı komut. Expected: bütün testler PASS (19 + yeni 9).
- [ ] **Step 5: README ve commit.** `firebase/README.md`'ye bölümü ve yayın adımını yaz; `git add hayalet-avcilari/firebase && git commit` ("Hayalet Avcıları: arkadaşlık kuralları ve kural testleri").

### Task 2: `arkadaslar.js` veri katmanı, dinleyiciler ve oturum kancası

**Files:**
- Create: `hayalet-avcilari/www/arkadaslar.js`
- Modify: `hayalet-avcilari/www/index.html` (`<script src="playgames.js">`'ten sonra `<script src="arkadaslar.js"></script>`)
- Modify: `hayalet-avcilari/www/game.js` `init` içindeki `auth.onAuthStateChanged` geri çağrısı: `if (u) sosyalBaslat(); else sosyalDurdur();`
- Modify: `hayalet-avcilari/araclar/anahtarlar.mjs` (taranan dosyalara `arkadaslar.js`)
- Create: `hayalet-avcilari/test/arkadas.test.mjs` (`cevrimici.test.mjs`'in sunucu, emülatör ve SDK düzeni; üç sayfa: Ayşe, Bora, Cem; `sina()` raporu)
- Modify: `hayalet-avcilari/firebase/package.json` (`"test:arkadas": "firebase emulators:exec --only database,auth --project demo-hayalet-avcilari \"node ../test/arkadas.test.mjs\""`)

**Interfaces:**
- Consumes: `fbDb()`, `fbKullaniciBekle(ms)`, `sunucuZamani()`, `sunucuSimdi()`, `sunucuSaatiniDinle()`, `online`, `save`, `t()` (game.js / i18n.js).
- Produces (global, `arkadaslar.js`):
  - `const SOSYAL = { ARKADAS_EN_COK: 50, ISTEK_GOSTER: 30, DAVET_GOSTER: 10, DAVET_OMRU_MS: 300000, DAVET_ARALIK_MS: 30000, KOD_DENEME: 3, ZAMAN_ASIMI_MS: 10000 }`
  - `const sosyal = { uid, kod, arkadaslar, istekler, gonderilen, davetler, engeller, durumlar, hazir, hata }` — kayıtlar `{ [uid]: govde }`; `hata` ∈ `null | "izin" | "baglanti"`
  - `arkadasKoduUret(): string`, `arkadasKodunuCoz(girdi: string): string | null`
  - `sinirliBekle(soz: Promise, ms = SOSYAL.ZAMAN_ASIMI_MS): Promise` — süre dolunca `Error("zamanasimi")` ile reddeder
  - `async sosyalBaslat(): Promise<void>` (aynı uid için ikinci çağrı bir şey yapmaz; uid değişince önce `sosyalDurdur`), `sosyalDurdur(): void`
  - `async kodumuHazirla(): Promise<string|null>`, `async koduYenile(): Promise<string|null>`
  - `async kodlaArkadasEkle(girdi: string): Promise<Sonuc>`, `async arkadasIstegiGonder(uid: string, ad: string): Promise<Sonuc>` — `Sonuc` ∈ `"gonderildi" | "kabul" | "kendi" | "yok" | "gecersiz" | "zaten" | "bekliyor" | "dolu" | "engelli" | "adyok" | "gonderilemedi" | "hata"`
  - `async istegiKabulEt(uid): Promise<"kabul"|"dolu"|"yok"|"hata">`, `async istegiReddet(uid): Promise<boolean>`, `async istegiIptalEt(uid): Promise<boolean>`
  - `async arkadasliktanCikar(uid): Promise<boolean>`, `async engelle(uid, ad): Promise<boolean>`, `async engeliKaldir(uid): Promise<boolean>`
  - `async davetGonder(uid): Promise<"gonderildi"|"bekle"|"odayok"|"arkadasdegil"|"adyok"|"hata">`, `async davetiSil(uid): Promise<void>`, `gecerliDavet(): {uid, room, roomName, name, at} | null`
  - `arkadasDurumu(uid): "on"|"room"|"off"`, `durumumuYaz(): void`, `sosyalAdGuncelle(): void`, `async arkadaslikVerisiniSil(): Promise<boolean>`, `sosyalRozetSayisi(): number`
  - `sosyalTazele(): void` — veri değişince çağrılır; tanımlıysa ekran çizicilerini (`renderFriends`, `renderInviteModal`, `davetSeridiniGuncelle`, `rozetiGuncelle`, açıksa `renderLobby`) çağırır

- [ ] **Step 1: Failing uçtan uca testi yaz** (`test/arkadas.test.mjs`, veri katmanı bölümü; her madde bir `sina`):
  - `kod`: Ayşe `await kodumuHazirla()` → `/^[A-HJKMNP-Z2-9]{6}$/`, ikinci çağrı aynı kod; `arkadasKodunuCoz(' #k7mp2q ') === 'K7MP2Q'`, `arkadasKodunuCoz('K7MP2O') === null`, `arkadasKodunuCoz('K7MP2') === null`.
  - `kod çakışması`: sahip yetkisiyle `friendCodes/QQQQQQ` başkasına yazılır; Cem'de `arkadasKoduUret` ilk çağrıda `"QQQQQQ"` döndürecek biçimde sarılır → `kodumuHazirla()` başka bir kod alır ve `friendCodes/QQQQQQ.uid` değişmez.
  - `istek`: Bora `kodlaArkadasEkle('#' + kodA.toLowerCase())` → `"gonderildi"`; 5 sn içinde Ayşe'de `sosyal.istekler[boraUid]`, Bora'da `sosyal.gonderilen[ayseUid]`; tekrar → `"bekliyor"`; kendi kodu → `"kendi"`; `"ZZZZZZ"` → `"yok"`.
  - `kabul`: Ayşe aynı anda iki kez `istegiKabulEt(boraUid)` → sonuçlardan biri `"kabul"`, sayfa hatası yok; iki tarafta da arkadaş kaydı, istek ve `sent` boş; Ayşe'de `arkadasDurumu(boraUid) === "on"`.
  - `karşılıklı istek`: Ayşe ile Cem birbirinin koduyla aynı anda ekler → ikisi de arkadaş.
  - `çıkar`: Ayşe `arkadasliktanCikar(cemUid)` → iki listede de yok, Ayşe'de `sosyal.durumlar[cemUid]` yok.
  - `engel`: Cem istek gönderir, Ayşe `engelle(cemUid, 'Cem')` → istek silinir; Cem yeniden → `"gonderilemedi"`; `engeliKaldir` → Cem yeniden → `"gonderildi"`.
  - `davet`: Ayşe oda kurar (`openOnline(); openCreateRoom(); await submitCreateRoom()`), `davetGonder(boraUid)` → `"gonderildi"`; Bora `gecerliDavet().room === oda`; 30 sn içinde ikinci davet → `"bekle"`; `davetGonder(cemUid)` (arkadaş değil) → `"arkadasdegil"`.
  - `ad yok` (Review Focus 1): dördüncü sayfa `save.playerName = ''` → `arkadasIstegiGonder(ayseUid, 'Ayşe')` → `"adyok"`, veritabanında istek yok.
  - `çevrimdışı` (Review Focus 3): Bora `context.setOffline(true)` → `kodlaArkadasEkle(kodC)` 11 sn içinde `"hata"`; çevrimiçine dön.
  - `hesap verisi`: Bora `arkadaslikVerisiniSil()` → `true`; Ayşe'nin listesinde Bora yok; `users/<bora>` ve Bora'nın kodu sahip yetkisiyle okununca yok.
  - `kurallar yok`: kurallar arkadaş düğümleri olmadan yüklenir, beşinci sayfa `sosyalBaslat()` sonrası `sosyal.hata === "izin"` ve `submitCreateRoom()` yine oda kurar; kurallar geri yüklenir.
- [ ] **Step 2: Kırmızı olduğunu gör.** Run: `cd hayalet-avcilari/firebase && npm run test:arkadas`. Expected: `kodumuHazirla is not defined` ile akış yarıda kalır.
- [ ] **Step 3: `arkadaslar.js`'i yaz** (Interfaces'teki imzalar). Kararlar:
  - Bütün yazımlar `sinirliBekle(db.ref().update({...}))`: tek çok yollu yazım, yol listeleri spec §4.3; reddedilen yazımda `PERMISSION_DENIED` → `"gonderilemedi"` (istek) / `false`, zaman aşımı → `"hata"`.
  - `arkadasIstegiGonder`: önce yerel denetim sırası `adyok` → `kendi` → `zaten` → `engelli` (benim engelim) → `dolu` → karşı istek varsa `istegiKabulEt` (sonuç `"kabul"`) → `bekliyor` → yazım.
  - Dinleyiciler `sosyalBaslat`'ta: `users/{uid}/friends`, `users/{uid}/sent`, `users/{uid}/blocks` (`value`), `users/{uid}/requests` ve `users/{uid}/invites` (`orderByChild("at").limitToLast(30 / 10)`), `.info/connected` (true olunca `durumumuYaz`); her arkadaş için `presence/{f}` (`durumlar`'a; izin hatasında silinir); hata geri çağrısında `sosyal.hata = "izin"`. İlk anlık görüntüden sonra gelen yeni istek için `showToast(t("👫 {ad} arkadaşlık isteği gönderdi", { ad }))`. `sunucuSaatiniDinle()` çağrılır.
  - `durumumuYaz`: arkadaş yoksa `presence/{uid}`'i siler; varsa `onDisconnect().update({ state: "off", at })` kurar ve `{ name: save.playerName || t("Avcı"), charKey: save.selectedChar, costumeIdx, state, at }` yazar; `state` = `document.hidden ? "off" : online.roomId ? "room" : "on"`.
  - `gecerliDavet`: `sosyal.davetler` içinden, gönderen hâlâ arkadaşsa ve `sunucuSimdi() - at <= SOSYAL.DAVET_OMRU_MS` ise en yeni; süresi geçeni `davetiSil` ile siler.
  - `arkadaslikVerisiniSil`: önce başkalarındaki izler tek yazımda (`users/F/friends/{uid}`, `users/F/invites/{uid}` her arkadaş için; `users/T/requests/{uid}` her `sent` için), sonra `users/{uid}`, `presence/{uid}`, kod (sahibiysem) tek yazımda; sonra `sosyalDurdur()`.
  - `sosyalBaslat` kod almaz (kod yalnız Arkadaşlar ekranı açılınca, Task 3 `openFriends`); `sosyal.kod`'u yalnız `users/{uid}/code`'dan okur.
  - `kodumuHazirla`: `users/{uid}/code` okunur; `friendCodes/{kod}.uid === uid` değilse `arkadasKoduUret()` ile en çok `SOSYAL.KOD_DENEME` deneme, eski kod yalnız sahibiysem aynı yazımda silinir.
- [ ] **Step 4: Yeşil olduğunu gör.** Aynı komut. Expected: veri katmanı sınamalarının hepsi ✓, "sayfa hatası yok" ✓.
- [ ] **Step 5: Mevcut testler ve commit.** `npm run test:cevrimici` 13/13 ve `node hayalet-avcilari/test/cizim.test.mjs` TAMAM; commit ("Hayalet Avcıları: arkadaş sistemi veri katmanı ve uçtan uca test").

### Task 3: Arkadaşlar ekranı ve menü düğmesi

**Files:**
- Modify: `hayalet-avcilari/www/index.html` (yeni `<div id="screen-friends" class="screen">`; ana menüde "🌐 Online Oyna"yı ve kare `<button id="menu-arkadas" class="btn btn-kare" aria-label="Arkadaşlar" onclick="openFriends()">👫<span id="menu-arkadas-rozet" class="rozet"></span></button>`'ı saran `.menu-satir`; Online ekranında `👫 Arkadaşlar` düğmesi)
- Modify: `hayalet-avcilari/www/style.css` (`.btn-kare`, `.rozet`, `.menu-satir`, `.arkadas-*`)
- Modify: `hayalet-avcilari/www/arkadaslar.js` (ekran işlevleri)
- Modify: `hayalet-avcilari/www/game.js` (`refreshMenu` sonunda `rozetiGuncelle()`)
- Modify: `hayalet-avcilari/www/i18n/{en,es,zh,hi,ar}.js` (`sozluk.mjs yaz`)
- Test: `hayalet-avcilari/test/arkadas.test.mjs` (ekran bölümü), `hayalet-avcilari/test/dil.test.mjs` (`arkadaslar` ekranı)

**Interfaces:**
- Consumes: Task 2'nin bütün işlevleri ve `sosyal`.
- Produces: `openFriends(): void` (ekranı `sosyal`'dan hemen çizer; `!sosyal.hazir` ise `sosyalBaslat()` ve `kodumuHazirla()` arka planda), `renderFriends(): void`, `friendsAddFromInput(): Promise<void>`, `sonucMesaji(sonuc: Sonuc, ad: string): string`, `rozetiGuncelle(): void`, `arkadasKodunuKopyala(): void`.

Metinler (spec §5 ve §7; birebir): "👫 ARKADAŞLAR", "👫 Arkadaşlar", "Kodun:", "Arkadaşına bu kodu ver. Yedek kodunu (Hesap) kimseyle paylaşma.", "➕ Ekle", "📬 İstekler ({n})", "👫 Arkadaşların ({n}/{max})", "▸ Gönderilenler ({n})", "▸ Engellenenler ({n})", "🟢 Çevrimiçi", "🎮 Odada", "⚪ Çevrimdışı", "Çıkar", "Engelle", "Kaldır", "✕ İptal", "Henüz arkadaşın yok. Kodunu paylaş ya da odada ➕'ya dokun.", "🔐 Arkadaşların kaybolmasın: Google ile giriş yap ›", "⚠ Arkadaşlar şu an kullanılamıyor", "{ad} arkadaşlarından çıkarılsın mı?", "{ad} engellensin mi? İstek ve davet gönderemez.", "Yeni kod alınsın mı? Eski kod artık çalışmaz.". `sonucMesaji`: gonderildi "📨 İstek gönderildi: {ad}", kabul "{ad} de seni eklemiş, artık arkadaşsınız!", kendi "Bu senin kodun", yok "Kod bulunamadı", gecersiz "Arkadaş kodu 6 karakter olmalı", zaten "Zaten arkadaşsınız", bekliyor "İstek zaten gönderildi", dolu "Arkadaş listen dolu ({n})", engelli "Önce engeli kaldır", adyok "Önce avcı adını ayarla" (var olan anahtar), gonderilemedi "İstek gönderilemedi", hata "⚠ Bağlanılamadı, yeniden dene". Kabul düğmesinin bildirimi: "👫 Artık arkadaşsınız: {ad}".

- [ ] **Step 1: Failing testleri yaz.**
  - `arkadas.test.mjs`: Ayşe menüde `#menu-arkadas-rozet` metni `"1"` (Bora'nın isteği); `openFriends()` sonrası `#arkadas-kod` metni `#` + kod; Bora kutuya Cem'in kodunu yazıp `friendsAddFromInput()` → `#toast` "📨 İstek gönderildi: Cem"; Cem'in ekranında isteğin ✓ düğmesine tıklanınca iki tarafta arkadaş; adı `<img src=x onerror=alert(1)>` olan arkadaş listede `textContent` olarak görünür ve `img` öğesi oluşmaz (Review Focus 2); anonim oyuncuda Google satırı görünür; `sosyal.hata = "izin"` iken ekranda "⚠ Arkadaşlar şu an kullanılamıyor" görünür ve kod kutusu pasiftir.
  - `dil.test.mjs`: `oda_listesi`'nden sonra `arkadaslar` ekranı — `Object.assign(sosyal, { uid: 'u1', kod: 'K7MP2Q', hazir: true, hata: null, istekler: { u5: { name: 'Mila', at: 1 } }, arkadaslar: { u2: { name: 'Can', at: 1 }, u3: { name: 'Deniz', at: 1 }, u4: { name: 'Ece', at: 1 } }, durumlar: { u2: { name: 'Can', charKey: 'kornet', costumeIdx: 0, state: 'on', at: 1 }, u3: { name: 'Deniz', charKey: 'mark', costumeIdx: 0, state: 'room', at: 1 } }, gonderilen: { u6: { name: 'Omer', at: 1 } }, engeller: { u7: { name: 'Zed', at: 1 } } }); openFriends();` (adlarda Türkçe harf yok; testin `TURKCE` denetimi yanlış alarm vermesin).
- [ ] **Step 2: Kırmızı olduğunu gör.** Run: `npm run test:arkadas` ve `node hayalet-avcilari/test/dil.test.mjs tr ar`. Expected: `openFriends is not defined` / `#menu-arkadas-rozet` yok.
- [ ] **Step 3: Ekranı, düğmeyi ve işlevleri yaz.** Satırlar `escapeHtml`; karakter simgesi `karakterSimgesi(charKey, costumeIdx)`; sıra 🟢, 🎮, ⚪, her grupta ada göre; Çıkar/Engelle/Yeni kod `confirm` ile; rozet `sosyalRozetSayisi()` sıfırsa gizli. Menü yüksekliği değişmez (`.menu-satir` tek satır).
- [ ] **Step 4: Çeviriler.** Yeni anahtarları `node hayalet-avcilari/araclar/anahtarlar.mjs` ile gör, 5 dilin çevirisini `sozluk.mjs yaz` ile yaz. Run: `node hayalet-avcilari/araclar/sozluk.mjs denetle`. Expected: her dil "tamam", eksik yok.
- [ ] **Step 5: Yeşil olduğunu gör.** Run: `npm run test:arkadas`; `node hayalet-avcilari/test/dil.test.mjs` (6 dil). Expected: hepsi ✓ / TAMAM. Ekran görüntüleri (`--ekran`) TR 390 ve AR 340'ta gözle denetlenir (menü tek satır, rozet, liste).
- [ ] **Step 6: Commit** ("Hayalet Avcıları: Arkadaşlar ekranı ve menü düğmesi").

### Task 4: Lobi düğmeleri, davet penceresi, ⏸ Menü ve oda durumu

**Files:**
- Modify: `hayalet-avcilari/www/game.js` (`renderLobby`: diğer oyuncunun satırına `lobiArkadasDugmesi(uid, p.name)`; `#lobby-davet-btn` oda doluyken `disabled`; ipucu metni; `enterLobby`, `odadanCik`, `odaKapandi` sonunda `durumumuYaz()`; `pauseGame`: `#pause-davet` yalnız çevrimiçiyken görünür)
- Modify: `hayalet-avcilari/www/index.html` (lobide `<button id="lobby-davet-btn" class="btn" onclick="openInviteModal()">📨 Davet et</button>`; ⏸ ekranında `<button id="pause-davet" class="btn" style="display:none" onclick="openInviteModal()">📨 Davet et</button>`; `<div id="screen-davet" class="screen modal">`)
- Modify: `hayalet-avcilari/www/arkadaslar.js`, `hayalet-avcilari/www/style.css`, `hayalet-avcilari/www/i18n/*.js`
- Test: `hayalet-avcilari/test/arkadas.test.mjs` (lobi bölümü), `hayalet-avcilari/test/dil.test.mjs` (`davet_penceresi`)

**Interfaces:**
- Consumes: Task 2 (`davetGonder`, `arkadasIstegiGonder`, `arkadasDurumu`, `durumumuYaz`), Task 3 (`sonucMesaji`).
- Produces: `davetSonucMesaji(sonuc, ad): string`, `lobiArkadasDugmesi(uid: string, ad: string): string` (HTML: arkadaşsa `👫`, gönderilmişse `⏳`, engellediysem boş, değilse ➕ düğmesi `onclick="lobidenEkle('<uid>')"`), `async lobidenEkle(uid: string): Promise<void>` (adı `online.cachedRoom.players[uid].name`'den; sonucu `sonucMesaji` ile bildirir; çalışırken düğme pasif), `openInviteModal(): void`, `closeInviteModal(): void`, `renderInviteModal(): void`.

Metinler: "📨 Davet et", "📨 ARKADAŞINI ÇAĞIR", "✓ Gönderildi", "Bu odada", "Oda dolu", "Davet için arkadaşın çevrimiçi olmalı.", lobi ipucu "Arkadaşını 📨 Davet et ile çağır ya da oda kodunu söyle.". `davetGonder` sonuçlarının bildirimi (`davetSonucMesaji(sonuc, ad): string`): gonderildi "📨 Davet gönderildi: {ad}", bekle "Biraz bekle, az önce çağırdın.", adyok "Önce avcı adını ayarla", hata "⚠ Bağlanılamadı, yeniden dene", arkadasdegil ve odayok "Davet gönderilemedi".

- [ ] **Step 1: Failing testleri yaz** (`arkadas.test.mjs`): Ayşe oda kurar, Bora ve Cem kodla katılır; Ayşe'nin lobisinde Bora satırı `👫` (arkadaş), Cem satırı ➕; ➕'ya iki kez hızlı tıklanınca tek istek ve ikinci tıklamada hata bildirimi yok (Review Focus 4), satır `⏳` olur; lobideyken Bora'nın Ayşe'deki durumu `"room"`, odadan çıkınca `"on"`; `openInviteModal()` → Bora (bu odada) soluk, çevrimdışı arkadaş soluk; odadan çıkan Bora'nın satırında 📨 → `"✓ Gönderildi"` ve Bora'da `gecerliDavet()` dolu; çevrimiçi oyunda `pauseGame()` → `#pause-davet` görünür, tek kişilik oyunda gizli; oda doluyken `#lobby-davet-btn.disabled`.
  `dil.test.mjs`: `lobi`'den sonra `davet_penceresi` (`sosyal`'a üç arkadaş: biri `on`, biri `room`, biri durum yok; `openInviteModal()`), ardından `closeInviteModal()`.
- [ ] **Step 2: Kırmızı olduğunu gör.** Run: `npm run test:arkadas`. Expected: `lobiArkadasDugmesi is not defined`.
- [ ] **Step 3: Kancaları ve pencereyi yaz.** Pencere `classList.add("active")` ile açılır (duraklat ekranı gibi; `showScreen` lobiyi kapatmasın).
- [ ] **Step 4: Çeviriler** (Task 3 Step 4 ile aynı komutlar).
- [ ] **Step 5: Yeşil olduğunu gör.** Run: `npm run test:arkadas`, `npm run test:cevrimici` (13/13), `node hayalet-avcilari/test/dil.test.mjs`. Expected: hepsi geçer.
- [ ] **Step 6: Commit** ("Hayalet Avcıları: lobide arkadaş ekleme ve davet penceresi").

### Task 5: Davet şeridi ve Katıl

**Files:**
- Modify: `hayalet-avcilari/www/index.html` (`<div id="davet-seridi" class="davet-seridi" role="status">` ekranların dışında)
- Modify: `hayalet-avcilari/www/style.css` (`.davet-seridi`: `position: fixed; top: calc(env(safe-area-inset-top, 0px) + 64px)` — duraklat düğmesinin (üstte 12 px + 44 px) altında; z-index ekranların üstünde, `.toast`'un (200) altında)
- Modify: `hayalet-avcilari/www/arkadaslar.js`
- Modify: `hayalet-avcilari/www/game.js` (`function oyunSonu(won, cevrimici, reklamsiz = false)`: `if (!reklamsiz) reklamOyunBitti();`)
- Modify: `hayalet-avcilari/www/i18n/*.js`
- Test: `hayalet-avcilari/test/arkadas.test.mjs` (davet bölümü), `hayalet-avcilari/test/dil.test.mjs` (`davet_seridi_menu`, `davet_seridi_oyun`)

**Interfaces:**
- Consumes: Task 2 (`gecerliDavet`, `davetiSil`), `joinRoom(roomId)`, `odadanCik()`, `oyunSonu(…, reklamsiz)`, `game.running`, `online.mode`, `online.roomId`.
- Produces: `davetSeridiniGuncelle(): void` (gösterilecek davet yoksa, davet edilen zaten `davet.room`'daysa gizler), `async davetiKabulEt(): Promise<void>`, `async davetiReddet(): Promise<void>`.

Metinler: "📨 {ad} seni çağırıyor", "Katıl", "Oyunun biter, kazandıkların kasana eklenir. Arkadaşının odasına geçilsin mi?", "Bu odadan ayrılıp arkadaşının odasına geçilsin mi?". `davetiKabulEt` sırası: davet silinir → tek kişilik oyun sürüyorsa `confirm` ve `oyunSonu(false, false, true)` + `#screen-gameover` kapatılır → başka odadaysa `confirm` ve `await odadanCik()` → `await joinRoom(davet.room)`.

- [ ] **Step 1: Failing testleri yaz** (`arkadas.test.mjs`): Ayşe'nin odasından davet → Bora menüdeyken `#davet-seridi` görünür, metni "📨 Ayşe seni çağırıyor" ve oda adını içerir; Katıl → Bora Ayşe'nin lobisinde (`online.roomId === oda`); Cem tek kişilik oyundayken davet → şerit görünür, `window.confirm = () => true`, `game.runPara = 120` → Katıl → `save.para` 120'den fazla artmış (bölüm bonusu dahil), oyun bitmiş, Cem odada, reklam çağrılmamış (`reklamOyunBitti` sarılıp sayılır); ✕ → davet silinir, şerit gizlenir; Bora zaten aynı odadayken gelen davet şerit göstermez (Review Focus 5); oda dolmuşken Katıl → "Oda dolu" bildirimi, davet silinmiş (Review Focus 5); sahip yetkisiyle `at` 6 dakika önce yazılan davet gösterilmez ve silinir; adı `<b>x</b>` olan arkadaşın daveti şeritte düz metin (Review Focus 2); Ayşe davetten sonra Bora'yı arkadaşlıktan çıkarınca Bora'daki şerit kaybolur.
  `dil.test.mjs`: `dil`'den sonra `davet_seridi_menu` (`sosyal.arkadaslar.u2` ve `sosyal.davetler.u2 = { room: 'K7PQ2X', roomName: 'Can', name: 'Can', at: Date.now() }`, `davetSeridiniGuncelle()`); `oyun_takim`'dan sonra `davet_seridi_oyun` (aynı davet, oyun ekranında); ardından davet temizlenir.
- [ ] **Step 2: Kırmızı olduğunu gör.** Run: `npm run test:arkadas`. Expected: `#davet-seridi` yok.
- [ ] **Step 3: Şeridi ve Katıl akışını yaz;** `sosyalTazele` şeridi her veri değişiminde günceller.
- [ ] **Step 4: Çeviriler.**
- [ ] **Step 5: Yeşil olduğunu gör.** Run: `npm run test:arkadas`, `node hayalet-avcilari/test/dil.test.mjs` (TR 390 ve AR 340 ekran görüntüsünde şerit duraklat düğmesini ve can göstergesini kapatmıyor). Expected: hepsi geçer.
- [ ] **Step 6: Commit** ("Hayalet Avcıları: davet şeridi ve Katıl").

### Task 6: Arka plan, ad değişikliği ve hesap silme kancaları

**Files:**
- Modify: `hayalet-avcilari/www/arkadaslar.js` (`document.addEventListener("visibilitychange", durumumuYaz)`)
- Modify: `hayalet-avcilari/www/game.js` (`submitName` sonunda `sosyalAdGuncelle()`; `deleteAccountGoogle`'da `u.delete()`'ten önce `await arkadaslikVerisiniSil()`)
- Test: `hayalet-avcilari/test/arkadas.test.mjs` (yaşam döngüsü bölümü)

**Interfaces:**
- Consumes: `durumumuYaz`, `sosyalAdGuncelle`, `arkadaslikVerisiniSil` (Task 2).
- Produces: davranış; yeni imza yok.

- [ ] **Step 1: Failing testleri yaz:** Bora'da `document.hidden` true yapılıp `visibilitychange` tetiklenince Ayşe'de `arkadasDurumu(bora) === "off"`, geri gelince `"on"`; Bora adını `submitName` ile "Bora2" yapınca (zümrüt verilerek) Ayşe'nin listesinde ad "Bora2" ve `friendCodes/<kod>.name === "Bora2"`; Bora'nın anonim hesabı emülatörde sahte Google kimliğine bağlanır (`firebase.auth.GoogleAuthProvider.credential(JSON.stringify({ sub: 'g-bora', email: 'bora@example.com', email_verified: true }))` + `linkWithCredential`), `window.confirm = () => true; await deleteAccountGoogle()` → Ayşe'nin listesinde Bora yok, Bora'da `sosyal.uid` yeni anonim kimlik.
- [ ] **Step 2: Kırmızı olduğunu gör.** Run: `npm run test:arkadas`. Expected: durum `"on"` kalır / Ayşe'nin listesinde Bora durur.
- [ ] **Step 3: Kancaları ekle.**
- [ ] **Step 4: Yeşil olduğunu gör.** Run: `npm run test:arkadas`. Expected: hepsi ✓.
- [ ] **Step 5: Commit** ("Hayalet Avcıları: arkadaş sisteminde arka plan, ad ve hesap silme").

### Task 7: Arkadaşlar açıkken çevrimiçi oyunun hızı

**Files:**
- Modify: `hayalet-avcilari/test/cevrimici.test.mjs`, `hayalet-avcilari/test/alti.test.mjs` (oyun başlamadan bütün oyuncular sahip yetkisiyle REST `PATCH /.json?ns=…` ile karşılıklı arkadaş yapılır; her sayfada `sosyal.durumlar`'da diğer oyuncular görünene kadar beklenir)

**Interfaces:**
- Consumes: `sosyal.durumlar` (Task 2).

- [ ] **Step 1: Arkadaşlık kurulumunu ekle** ve bir sınama: "arkadaş dinleyicileri açık (her oyuncu diğerlerinin çevrimiçi durumunu görüyor)".
- [ ] **Step 2: Çalıştır.** Run: `npm run test:cevrimici`, `npm run test:alti`. Expected: 14/14 ve 11/11 ✓; kare hızı sınamaları (≥ 30 fps, %95 ≤ 100 ms) eskisi gibi geçer. Düşerse dinleyici kaynaklı yükü profillemeden (`render`, `oyuncularDegisti`, `sosyalTazele` süreleri) ilerleme.
- [ ] **Step 3: Commit** ("Hayalet Avcıları: çevrimiçi testler arkadaş dinleyicileri açıkken").

### Task 8: Sürüm 3.13.0, belgeler, gizlilik ve derleme

**Files:**
- Modify: `hayalet-avcilari/www/game.js` (`APP_VERSION = "3.13.0"`, `UPDATE_NOTES["3.13.0"]` en üstte: "👫 Arkadaş ekle: Arkadaşlar ekranındaki kodunu paylaş ya da lobide oyuncunun yanındaki ➕'ya dokun.", "📨 Arkadaşını çağır: lobide 📨 Davet et; davet gelince üstteki şeritten Katıl.", "🟢 Arkadaşların çevrimiçi mi, odada mı, listeden gör; istemediğin kişiyi engelle.", "👥 Online odalar artık 6 kişilik: altı avcı aynı odada birlikte oynar.")
- Modify: `hayalet-avcilari/android/app/build.gradle` (`versionCode 45`, `versionName '3.13.0'`), `hayalet-avcilari/package.json`, `hayalet-avcilari/package-lock.json`
- Modify: `hayalet-avcilari/www/i18n/*.js`, `hayalet-avcilari/magaza/surum-notu.txt`, `hayalet-avcilari/magaza/diller/*.md` ("## Sürüm notu"; her dil ≤ 500 karakter)
- Modify: `hayalet-avcilari/README.md` (sürüm satırı; "## 3.13.0: arkadaşlar" bölümü: veri modeli özeti, testler, ölçümler, yayın sırası)
- Modify: `app/hayalet-avcilari/gizlilik.html` (2. bölüme "Arkadaşlar" maddesi: arkadaş kodu ve avcı adı, arkadaş listesi, istekler, engeller, davetler, çevrimiçi durum (ad, karakter, kostüm, durum) ve kim görür; 5. bölüme silme; İngilizce paragrafa aynısı; "Son güncelleme" tarihi)
- Modify: `app/hayalet-avcilari/hesap-silme.html` ("Silinenler"e arkadaşlık verisi; e-posta yolunda anonim oyuncunun arkadaşlık verisi)
- Modify: `hayalet-avcilari/magaza/aciklamalar.md` (Veri güvenliği tablosuna "Kişiler (arkadaş listesi, istekler, engeller)" satırı: toplanıyor, isteğe bağlı, Uygulama işlevleri, paylaşılmıyor; çevrimiçi durum ve davet satırı Google'ın tanım sayfasına göre)
- Modify: `docs/superpowers/specs/2026-10-23-hayalet-arkadaslar-design.md` (Durum: "Kullanıcı onayladı, 23 Ekim 2026; uygulandı 3.13.0")

- [ ] **Step 1: Sürümü ve notları yaz;** çevirileri `sozluk.mjs yaz` ile ekle; mağaza notlarını sürüm notu bloğundan üret ve uzunlukları denetle (`android/play.mjs › surumNotlari`). Expected: her dil ≤ 500.
- [ ] **Step 2: Bütün testleri çalıştır.** Run: `npm test` (kurallar), `npm run test:arkadas`, `npm run test:cevrimici`, `npm run test:alti`, `node hayalet-avcilari/test/cizim.test.mjs`, `node hayalet-avcilari/test/engel.test.mjs`, `node hayalet-avcilari/test/dil.test.mjs`, `node hayalet-avcilari/araclar/sozluk.mjs denetle`. Expected: hepsi geçer.
- [ ] **Step 3: Belgeleri, gizlilik ve hesap silme sayfalarını, veri güvenliği tablosunu yaz;** spec durum satırını güncelle.
- [ ] **Step 4: Commit ve push;** CI'da `hayalet-android.yml` ve `hayalet-firebase-kurallar.yml` başarılı; derleme günlüğünde `versionCode=45`, `versionName=3.13.0`, `CN=Poyraz Workshop` ve kayıtlı SHA-256.
- [ ] **Step 5: Kullanıcıya sun ve onay iste:** (a) kuralların konsolda yayınlanması (adımlar `firebase/README.md` › Yayınlama), (b) gizlilik ve hesap silme sayfaları için `main`'e PR, (c) 3.13.0'ın Play'e gönderilmesi (`play-istek.txt`), (d) Play Console › Veri güvenliği formunda değişecek satırlar.
