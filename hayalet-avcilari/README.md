# Hayalet Avcıları

Hayalet yakalama oyunu (Poyraz Workshop). Oyun HTML5 canvas'tır (`www/`), Android'e **Capacitor 8** ile paketlenir.
Çevrimiçi oda, şampiyonlar listesi ve bulut yedeği Firebase (`hayalet-avcilari` projesi) üzerindedir; Google ile
giriş `@codetrix-studio/capacitor-google-auth`, reklamlar `@capacitor-community/admob` eklentisiyle yapılır.

| | |
|---|---|
| Paket | `com.poyrazworkshop.hayaletavcilari` |
| Sürüm | 3.13.0 (versionCode 45) — arkadaşlar ve oyuna davet, yeni engeller, online tur sıralaması ve kupa; Play'e gönderilmedi (kullanıcı onayı bekleniyor). Kurallar (arkadaş düğümleri, `av`, 3.12.2'nin `maxPlayers` 2–6'sı) Firebase konsolunda yayınlanmalı: [`firebase/README.md` › Yayınlama](firebase/README.md#yayınlama). Önceki: 3.12.2 (44), 23 Ekim 2026'da incelemedeki 3.12.1 (43)'in yerine Play'e gönderildi |
| Diller | Türkçe, English, Español, 简体中文, हिन्दी, العربية (sağdan sola) |
| Play'e yayın | [`magaza/PLAY-YAYIN.md`](magaza/PLAY-YAYIN.md) |
| Gizlilik / hesap silme | `app/hayalet-avcilari/` → GitHub Pages |
| Firebase kuralları | [`firebase/`](firebase/README.md) — RTDB + Firestore kuralları, yol yol gerekçe, emülatör testi. 3.10.2'den beri Firebase anonim giriş: oda, kodlu yedek ve skor `auth.uid`'e bağlı. 3.10.3 geçişi kapatır (girişsiz ve `u_` kimlikli yazım reddedilir) |
| Reklam | AdMob, yalnız Android uygulaması — aşağıda "Reklamlar (AdMob)" |
| Play Games | Play Oyun Hizmetleri v2 (3.10.4), yalnız Android — aşağıda "Google Play Oyun Hizmetleri" |
| Play paketi | 3.10.1'den itibaren CI (`hayalet-android.yml`) derler; `dist/HayaletAvcilari-play.aab` 3.10.0 (36) olarak kaldı. Geçişi kapatan kurallar 20 Ekim 2026'da yayınlandı ([`firebase/README.md` › Yayınlama](firebase/README.md#yayınlama)); 3.12.0 (42; çevrimiçi oyun yenilendi) 22 Ekim 2026'da kullanıcının isteğiyle ("Derle ve yayınla") `claude/beautiful-feynman-pxwdju` dalından derlendi (koşu 39836917452, Poyraz Workshop yükleme anahtarı) ve Play'e gönderildi (koşu 39837609373); 3.12.1 (43; biri ölünce donma düzeltmesi) 23 Ekim 2026'da aynı daldan derlendi (koşu 39944259051) ve incelemedeki 3.12.0'ın yerine Play'e gönderildi (koşu 39960541073); 3.12.2 (44; 6 kişilik oda) aynı gün aynı daldan derlendi (koşu 39971239015) ve incelemedeki 3.12.1'in yerine Play'e gönderildi (koşu 39975579074) |
| Denemelik APK | `dist/HayaletAvcilari.apk` (aynı anahtarla imzalı; Play sürümü üstüne kurulmaz, önce kaldırılır) |

## Reklamlar (AdMob)

`www/reklam.js` (3.10.1). AdMob hesabı `pub-2417242373034448` (mahmuttari@gmail.com):

| | |
|---|---|
| Uygulama kimliği | `ca-app-pub-2417242373034448~4177766696` (`AndroidManifest.xml` › `APPLICATION_ID`) |
| Geçiş ("Oyun bitti gecis") | `ca-app-pub-2417242373034448/5331066264` — oyun bitti ekranında, her 2 oyunda bir, en az 3 dk arayla |
| Ödüllü ("Zumrut odullu") | `ca-app-pub-2417242373034448/6612358344` — oyun bitti ekranında "🎬 Reklam izle: +10 💚", oyun başına bir kez |
| AB onayı | AdMob › Gizlilik ve mesajlaşma › "Hayalet Avcıları AB tüzüğü mesajı" (en + tr + es); gerektiğinde menüde 🔒 Gizlilik |

Oyun sırasında reklam yok. Web/PWA sürümünde eklenti olmadığı için reklam kodu hiçbir şey yapmaz. AdMob uygulaması
Play'de yayınlanınca AdMob › Uygulamalar › "Mağaza ekle" ile Play girişine bağlanmalı; o zamana kadar "sınırlı reklam
sunumu" geçerlidir.

## Google Play Oyun Hizmetleri

`www/playgames.js` + yerel eklenti `android/app/src/main/java/.../PlayGamesPlugin.java` (3.10.4,
`play-services-games-v2`). Açılışta otomatik giriş (`MainActivity` › `PlayGamesSdk.initialize`); oturum yoksa skor ve
başarım gönderilmez, Şampiyonlar ekranındaki "🎮 Play Games skor tablosu" / "🎖 Başarımlar" düğmeleri girişi ister.
Düğmeler web/PWA'da görünmez.

| | |
|---|---|
| Oyun projesi | Play Console › Play Oyun Hizmetleri › "Ghost Hunters", proje kimliği `247289107945` (= Firebase'in Cloud projesi `hayalet-avcilari`; `strings.xml` › `game_services_project_id`). 20 Ekim 2026'da yayınlandı |
| Kimlik bilgileri | Android ×2: Play uygulama imzası (`C4:23:85:…:A9:1A`, yeni yüklemeler) ve yükleme anahtarı (`D0:88:A0:…:56:99`, CI APK'ları). OAuth istemcileri Firebase'in Google ile Giriş için açtıklarıdır; aynı paket+SHA-1 başka bulut projesine kaydedilemez |
| Skor tablosu | "Şampiyonlar" `CgkI6avRnJkHEAIQAg` — `scoreFor()` (bölüm×1000 + hayalet×10 + para), büyük olan önde, üst sınır 9 999 999 (Firestore kuralıyla aynı) |
| Başarımlar | Çırak Avcı (bölüm 5, 10 XP) `…BQ`, Usta Avcı (10, 20) `…Bg`, Hayalet Uzmanı (25, 40) `…Aw`, Efsane Avcı (50, 80) `…Bw`, Hayalet Fırtınası (tek oyunda 500 hayalet, 50) `…BA` — önek `CgkI6avRnJkHEAIQ` |
| Diller | en-US (varsayılan), tr-TR, es-ES, es-419, zh-CN, hi-IN, ar |

Başarımlar Console › Hedefler › "Başarıları içe aktar" ile ZIP'ten (AchievementsMetadata/Localizations/IconsMappings
CSV + 512 px simgeler) yüklendi. Yeni başarım ya da skor tablosu: Console'da ekle → "Kaynakları al"daki kimliği
`playgames.js` › `PLAY_GAMES`'e yaz → Play Games › Yayınlama. Not: eski `com.hayaletavcilari.oyun` kaydının (MARFEN
hesabı) yayınlanmamış PGS projesi bu bulut projesini tuttuğu için 20 Ekim 2026'da silindi.

## Kaynak

Kaynak, elimizdeki tek kopya olan `HayaletAvcilari.apk` (3.9.0, `com.hayaletavcilari.oyun`, debug imzalı) içinden
çıkarıldı: `assets/public` → `www/`, simge ve açılış görselleri → `android/app/src/main/res/`. Android projesi
`npx cap add android` ile yeniden üretildi; özgün projedeki ayarlar (dokunmatik ekran zorunlu değil, uyarlanabilir
simge) aynen taşındı.

## 3.9.1 düzeltmesi: hayalet engelin içinde

Belirti: bazı hayaletler engelin (tuğla blok) içinde kalıyor, hareket etmiyor, mermiler engele çarptığı için
vurulamıyor; bölüm "boss öldü ve bütün hayaletler bitti" şartına bağlı olduğundan **bölüm bitmiyordu**.

Nedenler (`www/game.js`):
1. Boss'un minik hayaletleri boss'un çevresinde rastgele doğuyor, 8 denemede boş yer bulamazsa engelin içinde kalıyordu
   (boss engel kenarındayken %12'ye yakın).
2. Boss 30 denemede yer bulamazsa sabit bir noktaya konuyordu; orası engel olabiliyordu.
3. Fanatik karakterinin itme gücü hayaletleri engel denetimi yapmadan 25 px itiyor, engelin içine gömüyordu.
4. Engellerin yerleşimi oyuncunun o anki konumuna bağlıydı: çevrimiçi oyunda host ile katılanın haritası farklı
   çıkıyor, katılanın ekranında hayalet engelin içinde görünüyor ve mermisi engele çarpıyordu. Yeni oyun da önceki
   turun son konumuna göre kuruluyordu.

Düzeltme: `freeSpot()` engelin içindeki noktaya en yakın boş yeri halka halka arar; doğma, boss ve minikler bunu
kullanır. İtme yalnız boş yere yapılır. Güvenlik ağı olarak hareket edemeyen ve engelin içinde kalan hayalet en yakın
boş yere çıkarılır. Çevrimiçi oyunda ve yeni oyunun başında engel yerleşimi dünya merkezine göre kurulur.

Test: `node hayalet-avcilari/test/engel.test.mjs` (Playwright + Chromium). Eski kodda başarısız olur (uzun oyunda
3.208 karede gömülü hayalet), yeni kodda geçer.

## 3.11.0: Silsen, Serçin, envanter ve Bot

Fikirler ve çizimler bir çocuk oyuncudan geldi (defter sayfaları). `www/game.js`:

- **Silsen** (💚 25): çiçekli damalı bayrak, papatya mermisi; gücü "Çiçek Halkası" 8 yöne atar. **Serçin** (💚 30): gaga
  burun, uzun saç, tüy mermisi; gücü "Güdümlü Tüyler" (`steerHoming`). Serçin'in **Kanatlı Kedi** kostümü (💎 8)
  kostüm nesnesindeki `ears`/`wings` bayraklarıyla çizilir — kostümler artık yalnız renk değil, biçim de taşıyabilir.
- **Envanter** (`GUNS`, `save.ownedGuns`, `save.equippedGun`): Mağaza › 🔫 Silahlar'dan alınan 5 kalıcı silah bütün
  karakterlerde ortak; oyunda 🎒 düğmesi (`toggleInventory`) karakterin kendi silahı ile alınanlar arasında değiştirir.
  Silah mermi biçimini, hızını, atış aralığını (`delayMul`), hasarı (`dmgMul`) ve desenini (`spread`, `twin`, `pierce`)
  belirler; karakter yükseltmeleri ve güçler üstüne eklenir.
- **Bot** (`spawnBot`, `updateBot`, `damageBot`, `drawBot`): yalnız tek kişilik oyunda; oyuncuyu izler, en yakın
  hayalete ateş eder, hayaletler ona zarar vermez. Oyuncu ona dokununca (`botaDokun`, klavyede B) 2,5 sn ona ateş eder;
  yenilince içinden 1 kalp çıkar, her bölüm başında yeniden gelir.
- Çevrimiçi oyunda Bot yoktur ve takılı silah odaya senkronlanmaz (diğer oyuncular karakterin kendi silahını görür);
  bu yüzden Firebase kuralları değişmedi. Senkrona alan eklenirse önce `firebase/database.rules.json` güncellenmeli.
- Eski kayıtlar (kodlu/Google yedeği dahil) yeni karakter ve silah alanlarını `loadSave()` varsayılanlarıyla alır.

## 3.12.0: çevrimiçi oyun yeniden yazıldı

Şikâyet: "Online oyun donuyor, hiç oynanmıyor." Firebase emülatöründe iki tarayıcıyla ölçüldü (CPU 4 kat yavaş,
60 ms gecikme, 20 sn oyun; ölçüm düzeni `test/cevrimici.test.mjs`'in öncüsü):

| | 3.11.0 | 3.12.0 |
|---|---|---|
| Host kare hızı / %95 kare süresi | 55,7 fps / 33 ms | 59,2 fps / 17 ms |
| Katılanın ekranında hayalet sıçraması | sn'de 6,2, ortalama 541 px | yok (en büyük adım 2–3 px) |
| Oyun sırasında oda listesinin yeniden çizimi (katılan) | sn'de 31,5 | yok |
| Oyun döngüsü (host) | 2 (oyun iki kez açılıyordu) | 1 |
| Katılanın önüne konan 1 para | — | bir kez sayıldı, host'ta silindi |

Nedenler ve düzeltmeler (`www/game.js` › `// ====== ONLINE / LOBİ ======`):

1. **Hayaletin kimliği dizideki sırasıydı** (`state.g[].i`): bir hayalet ölünce arkasındakilerin hepsi bir öncekinin
   yerine geçiyor, ekranda yüzlerce piksel sıçrıyordu; vuruş ve para olayları da yanlış hayalete/paraya gidebiliyordu.
   Artık host her hayalete, paraya ve düşman mermisine kalıcı kimlik verir (`kimlik()`); alan adı aynı kaldı.
2. **Oda listesi dinleyicisi oyun boyunca açık kalıyordu** ve bütün `rooms` düğümünü (başka odaların 10 Hz durumu
   dahil) dinliyordu. Artık yalnız liste ekranında ve yalnız son dakikada görülen lobileri sorgular
   (`orderByChild("lastSeen")`, kurallarda `.indexOn`); oyundaki odanın `lastSeen`'i 0'dır.
3. **Host'ta oyun iki kez açılıyordu** (BAŞLAT ve oda dinleyicisi): iki oyun döngüsü, iki kat iş. Artık her
   `startGame` numaralı tek döngü açar; joystick ve ekran boyutu dinleyicileri de bir kez eklenir.
4. **Yazımlar birikiyordu:** host her 100 ms'de bütün durumu `set` ediyordu, yavaş ağda kuyruk büyüyordu. Artık bir
   yazım bitmeden yenisi gönderilmez, durum `update` ile yazılır, paralar yalnız değişince, oyuncu kaydında yalnız
   değişen alanlar gider; uygulama arka plandayken yazılmaz.
5. **İstemcide hareket:** görüntüler 110 ms geriden ara değerlenir (`goruntuEkle`, `aradegerle`); yeni görüntü
   gecikirse en çok 160 ms ileri kestirilir, 260 px'ten büyük sıçrama ışınlanır.
6. **Oda tek dinleyiciyle izleniyordu:** her konum yazımında bütün oda (durum dahil) işleniyordu. Artık `hostUid`,
   `status`, `players` ve (istemcide) `state` ayrı dinlenir.
7. **Oyun bitmiyordu:** herkes hayalet olunca da oyun sürüyordu. Artık host turu bitirir (`turuBitir`, status
   "lobby"), herkeste sonuç ekranı açılır, kazançlar ve şampiyonlar listesi yazılır, "🎮 Lobiye Dön" ile yeni tur
   kurulur. Hayalet olan oyuncu sonraki bölümde yeniden doğar (`yenidenDog`).
8. **Host çıkınca oda siliniyordu** (herkesin oyunu kapanıyor, kazançları gidiyordu). Artık yalnız kendi kaydı silinir,
   en eski oyuncu host olur (`maybeBecomeNewHost`) ve hayaletlerin yapay zekâsını kurup oyunu sürdürür (`hostOl`).
9. **Duraklat host'u dondurunca herkes donuyordu.** Çevrimiçi oyunda ⏸ menüsü oyunu durdurmaz; menüde oda kodu da
   yazar. Host'tan 2,5 sn görüntü gelmezse katılanlarda "⏳ Host bekleniyor…" şeridi çıkar.
10. **Lobide oda listeden 60 sn sonra kayboluyordu** (host `lastSeen` yenilemiyordu): host lobideyken 15 sn'de bir
    yeniler; zamanlar sunucu saatidir.

Yenilikler: lobide oda kodu (dokununca kopyalanır), Oda Listesi › **🔑 Kodla Katıl** (oyun sürerken de katılınır),
hayaletler en yakın canlı oyuncuyu kovalar (eskiden yalnız host'u), istemcinin öldürdüğü hayalet ona sayılır (eskiden
katılanın yakaladığı hep 0'dı), Rani, Fanatik ve Kasırga katılanda da çalışır, diğer oyuncuların atışları ve nişanı
görünür, HUD'da takım listesi (ad, can, 👑 host), oyuncu gelince/gidince bildirim. Roket hedef yokken çeviri işlevini
gölgelediği için hata veriyordu (`const t`), düzeldi; başka sürümden gelen bilinmeyen karakter çizimi çökertmez.

Veri düzeni ve izinler değişmedi; kurallara yalnız `rooms/.indexOn` eklendi (yayınlanmasa da çalışır). 3.11.0 ile
aynı odada oynanır (ayrıntı: [`firebase/README.md`](firebase/README.md) › rooms › Sürüm uyumu).

Test: `cd hayalet-avcilari/firebase && npm run test:cevrimici` (emülatör + Playwright; 13 sınama).

## 3.12.1: biri ölünce donma

Şikâyet: "Multiplayer oyunda oyunculardan birisi ölünce oyun donuyor." Emülatörde iki tarayıcıyla (CPU 4 kat yavaş)
ölçüldü: konuk ölünce kurucu 58 → 12,8 fps, konuk 59 → 1,8 fps; host ölünce 2,7 ve 4,6 fps, kare 0,4–0,9 sn. `render()`'ın
JS süresi yalnız 2,4 → 4–6 ms'ye çıkıyordu: zaman tuvalin boyanmasında gidiyordu.

Kök neden: hayalet olan oyuncu (kendi ekranında ve diğer oyuncuların ekranında) `ctx.filter = "hue-rotate(180deg)
brightness(1.3)"` ile çiziliyordu. Tuval filtresi karakterin onlarca çizim işleminin her birine ayrı uygulanır. Yalnız filtre
etkisizleştirilince ölümden sonra da 46–51 fps sürdü. Aynı sınıftan Bot'un vuruş parlaması (`brightness(2.2)`) tek kişilik
oyunu parlama süresince 1,6 fps'e düşürüyordu (Bot'u vururken takılma).

Düzeltme: hayalet görüntüsü karakter/kostüm başına bir kez ayrı tuvale çizilip `source-atop` ile mavi tona boyanır, her karede
tek `drawImage` ile süzülerek basılır (`hayaletGorunumu`, `hayaletOyuncuCiz`); Bot parlaması filtresiz beyaz ışık.
`game.js`'te `ctx.filter` kalmadı. Test: `node hayalet-avcilari/test/cizim.test.mjs` (Firebase'siz; eski kodda hayalet 0,3 fps,
vurulan Bot 1,3 fps) ve `test:cevrimici`'deki "biri hayalet olunca oyun akar" (eski kodda 3,5–4,5 fps, yenide ~60 fps).

## 3.12.2: 6 kişilik oda

İstek: "Multiplayer 6 kişi olunabilsin, zaten bazen 6 kişiyiz." Kurallarda `maxPlayers` sınırı 2–5'ten 2–6'ya çıktı,
Oda Kur ekranına 6 eklendi ve varsayılan oldu (önceden de en büyük değer varsayılandı). Veri düzeni değişmedi: 3.12.1
ve öncesi 6 kişilik odaya katılır, kendisi en çok 5 kişilik kurar. Zorluk oyuncu sayısıyla değişmiyor (önceden de öyle).
Kurallar konsolda yayınlanmadan 3.12.2 oyuncuya ulaşırsa Oda Kur yine çalışır: sunucu 6'yı reddedince `submitCreateRoom`
odayı 5 kişilik kurar (varsayılan 6 olduğu için bu olmasa her oda kurma reddedilirdi).

Ölçüm (`CPU=4` ile `test/alti.test.mjs` düzeni, emülatör; ölçülen iki cihazın işlemcisi 4 kat yavaş, ekran yoğunluğu 2;
40 ms gecikme; test makinesi 4 çekirdek; ilk çalıştırmalar):

| | 2 kişi | 2 kişi + odaya girmeyen 4 meşgul tarayıcı | 6 kişi |
|---|---|---|---|
| Kurucu: kare/sn, %95 kare | 55,8 · 33 ms | 49,5 · 33 ms | 38,2 · 50 ms |
| Konuk: kare/sn, %95 kare, saniyede durum | 57,3 · 17 ms · 10 | 52,9 · 33 ms · 9,8 | 39 · 50 ms · 9,3 |
| Biri hayalet olunca (kurucu · hayalet konuk) | 46,4 · 51,7 | 40,1 · 50,2 | 38,5 · 41,8 |
| WebSocket KB/sn, kurucu (gelen · giden) | 3,7 · 9,4 | — | 8,4 · 7,0 |
| WebSocket KB/sn, konuk (gelen · giden) | 11,1 · 1,5 | — | 13,4 · 1,4 |

Düşüşün bir kısmı test makinesinin altı tarayıcıyı birden çalıştırmasından (ortadaki sütun), kalanı ekranda dört karakter
daha çizilmesinden gelir: ayrı ölçümde `drawCharacter` saniyede 99 → 221 kez çağrıldı, `render`'ın JS süresi kare başına
1,8 → 3,1 ms oldu; oyuncu listesi dinleyicisi (`oyuncularDegisti`, saniyede 60 kez) yalnız 6,5 ms/sn tuttu. Ağ yükü
küçük: 6 kişilik bir saatlik oyunda bütün oyuncuların indirdiği toplam yaklaşık 0,27 GB (Blaze'de ayda ilk 10 GB ücretsiz;
emülatörde ölçüldü, üretim aynı protokolü kullanır, TLS ek yükü hariç).

4 katta altı tarayıcı test makinesinin 4 çekirdeğini paylaştığı için sonuç çalıştırmadan çalıştırmaya oynuyor (kurucu
26–41 kare/sn). Biri hayalet olunca düşüş görülen çalıştırmalarda, kimsenin ölmediği karşılaştırma çalıştırmasında da
aynı pencerede aynı düşüş ölçüldü (25,6 kare/sn): düşüş ölümden değil, makine yükünden ve artan hayalet sayısından. Test
bu yüzden `cevrimici.test.mjs` gibi 2 katta sınar: üç çalıştırmada kurucu 33–53, konuk 48–53 kare/sn, hayalet sıçraması yok.

Test: `cd hayalet-avcilari/firebase && npm run test:alti` (10 sınama: eski kurallarla oda 5 kişilik kurulur, Oda Kur'da
2–6 ve 6 seçili, altıncı oyuncu katılır, lobi 6/6, altısı aynı oyunda, kare hızı, hayalet sıçraması, ağ ölçümü, biri
hayalet olunca akış, sayfa hatası). Eski kodda eski kurallarla oda kurulamaz, düğmeler 2–5, oda 5 kişilik ve altıncı
oyuncu "Oda dolu" alır. Kural testine "2, 5, 6 kabul; 1, 7 ve '6' ret",
dil testine 6 kişilik lobi ve takım göstergesi (her dilde 390 ve 340 px) eklendi.

## 3.13.0: arkadaşlar

İstek: "Arkadaş ekleme olsun, arkadaşları oyuna davet etme olsun." Tasarım:
`docs/superpowers/specs/2026-10-23-hayalet-arkadaslar-design.md`; plan: `docs/superpowers/plans/2026-10-23-hayalet-arkadaslar.md`.
Mantık ve ekranlar `www/arkadaslar.js`'te; sunucu kodu yok, tutarlılığı Realtime Database kuralları sağlar.

- **Ekleme:** Arkadaşlar ekranındaki (ana menüde 🌐 Online Oyna'nın yanında rozetli 👫) 6 karakterli kodla (`#K7MP2Q`;
  oda kodu alfabesi, `crypto.getRandomValues`) ya da lobide oyuncunun yanındaki ➕ ile istek gider; karşı taraf
  ✓ Kabul, ✕ Reddet ya da 🚫 Engelle der. Karşı taraf beni önceden eklemişse istek yerine onunki kabul edilir. 🔄 yeni
  kod eskisini siler (eski kodla istek gelmez).
- **Davet:** lobide ve çevrimiçi oyunun ⏸ Menü'sünde 📨 Davet et. Davet edilen hangi ekranda olursa olsun üstteki
  şeritten Katıl der; tek kişilik oyun sürüyorsa onayla biter, kazançlar kasaya girer. Davet 5 dk geçerli, aynı
  arkadaşa 30 sn'de bir gönderilir; telefon bildirimi (push) yok, davet yalnız oyun açıkken gelir.
- **Çevrimiçi durum:** 🟢 menüde (`on`), 🎮 odada (`room`), ⚪ çevrimdışı (`off`: bağlantı kopunca `onDisconnect`
  ile, uygulama arka plandayken oyun yazar). Yalnız arkadaşlar görür; içinde ad, karakter, kostüm ve durum var, oda
  kodu yok.

Veri düzeni (yol yol kurallar: [`firebase/README.md`](firebase/README.md) › `friendCodes`, `users`, `presence`):

| Düğüm | İçerik | Okuyan |
|---|---|---|
| `friendCodes/{KOD}` | `{uid, name}` | Kodu bilen girişli kullanıcı, yalnız o kod; liste okunamaz |
| `users/{uid}` | `code`, `friends`, `requests`, `sent`, `invites`, `blocks` | Yalnız sahibi |
| `presence/{uid}` | `{name, charKey, costumeIdx, state, at}` | Sahibi ve arkadaş listesindekiler |

Kabul iki tarafın arkadaş kaydını tek çok yollu `update()` ile yazar; kural karşı tarafın isteğinin gerçekten var
olduğunu denetler (`root` yazımdan önceki veridir). Engel listesini sahibinden başkası okuyamaz ama kurallar okur:
engellenen istek ve davet gönderemez, ona yalnız "İstek gönderilemedi" denir. Davet yalnız arkadaştan ve davet edenin
oyuncusu olduğu odaya yazılır. Kuralların sayamadığını oyun sayar: en çok 50 arkadaş, gösterilen en yeni 30 istek ve
10 davet. Hesabı Sil önce başkalarındaki izleri (arkadaşların listesindeki kayıt, gönderilen istek ve davetler), sonra
kendi düğümlerini, en son Firebase hesabını siler; çevrimdışıyken durur ("⚠ Bağlanılamadı, yeniden dene"), çünkü hesap
gittikten sonra o kayıtları kimse silemez. Arkadaşlık Firebase kimliğine bağlıdır: Google ile giriş yapan cihaz
değiştirince de arkadaşlarını bulur; girişsiz oyuncuya ekran Google girişini önerir. Kurallar konsolda yayınlanmadan
3.13.0 oyuncuya ulaşırsa Arkadaşlar ekranı ve davet penceresi "⚠ Arkadaşlar şu an kullanılamıyor" der, lobide ➕
çizilmez; oda, yedek ve skor etkilenmez.

Test: `cd hayalet-avcilari/firebase && npm test` (kural testinin "arkadaşlar" bölümü 9 sınama: kod, istek, kabul,
çıkar, engel, davet, çevrimiçi durum, hesap silme, şema; her işlem izinli ve izinsiz yoldan) ve `npm run test:arkadas`
(emülatörde Ayşe, Bora, Cem ile adsız ve kuralsız oyuncu; 27 sınama: veri katmanı, Arkadaşlar ekranı, lobi, davet
penceresi, davet şeridi, arka plan, ad değişikliği, hesap silme, kurallar yokken). Dil testine dolu arkadaş listesi,
davet penceresi, menü ve oyun üstünde davet şeridi eklendi (her dilde 390 ve 340 px). `cevrimici.test` ve `alti.test`
oyun başlamadan bütün oyuncuları karşılıklı arkadaş yapıp birbirinin çevrimiçi durumunu görmelerini bekler; kare hızı ve
ağ ölçümleri bu dinleyiciler açıkken alınır. Ölçüm (2 kat yavaş işlemci, 6 kişi): kurucu 51,7 kare/sn (%95 kare 33 ms),
konuk 48,1 (34 ms), biri hayaletken 47,4 ve 53,7; 3.12.2 aralığında.

Yayın sırası:
1. **Kurallar:** Firebase konsolunda `database.rules.json`'un tamamı yayınlanır ([`firebase/README.md` ›
   Yayınlama](firebase/README.md#yayınlama)). Bu yayın arkadaş düğümlerini, tur sıralamasının `av` alanını ve
   henüz yayınlanmadıysa 3.12.2'nin `maxPlayers` 2–6 değişikliğini birlikte getirir.
2. **Gizlilik politikası ve hesap silme sayfası:** GitHub Pages yalnız `main`'den yayınlar; `main`'e PR kullanıcının
   onayıyla.
3. **Uygulama 3.13.0 (45):** CI derler; Play'e gönderme kullanıcının açık onayıyla.
4. **Play Console › Veri güvenliği:** "Kişiler" ve "Diğer işlemler" satırları ([`magaza/aciklamalar.md`](magaza/aciklamalar.md)
   › Veri güvenliği formu).

## 3.13.0: engeller

İstek: "Suların, duvarların, bütün engel objelerin şekilleri dikdörtgen. Daha güzel formlarda yapalım; duvarlar kale
gibi olabilir, hayaletlere uygun, ürkünç, çocuklara uygun objeler eklenebilir." İşaretli ekran görüntüsündeki dileğe
göre kenarlar eğri, yay ve daire biçimli. Tasarım: `docs/superpowers/specs/2026-10-23-hayalet-engeller-design.md`;
plan: `docs/superpowers/plans/2026-10-23-hayalet-engeller.md`.

- **Harita üretimi değişmedi:** engellerin yeri, boyutu ve yerleşimdeki çakışma denetimleri eskisi gibi dikdörtgenle.
  `buildWalls/buildWaters/buildHazards` sonunda `engelBicimleriniKur()` her engele dikdörtgenin içinde kalan bir
  **biçim** ekler: daire, elips ve yuvarlak köşeli kutu parçalarının birleşimi. Biçim ve bütün süsler tohumlu
  rastgeleyle (xorshift32; tohum bölüm, tür, sıra ve dikdörtgenden FNV-1a) çizilir: her cihazda aynı harita ve resim.
- **Kılık:** başka bir iç blokla kesişen blok duvardır (üst üste binenler tek kale bütünü olur); diğerleri sırayla
  duvar, 1. obje, 2. obje (`(i + bölüm) % 3`); dört kenar harita sınırıdır.
- **Çarpışma biçimi izler** (`engelCarpisir`): duvarda ön yüz dahil, objede biçimin 3 px, dikende 2,5 px büyütülmüşü,
  su ve lavda biçimin kendisi (kıyı yürünür). Açılan köşeden geçilir, mermi eğri duvara çarpar; `freeSpot` biçime
  değmeyen yer bulur.
- **Her tema kendi setiyle** (`www/engel-temalari.js`):
  Mor Şato (kale, mezarlık, balkabağı tarlası, hendek) · Yeşil Orman (kütük çit, ürkünç ağaçlar, mantar halkası,
  sazlıklı gölet) · Çöl (kum taşı harabe, kaktüs bahçesi, mumya lahdi, vaha) · Buz Mağarası (buz kalesi, kardan adam,
  buz kristalleri, buz kıyılı göl) · Volkan (bazalt kaya, ejderha yuvası, alev ruhlu kayalar, sıcak su) · Uzay (uzay
  istasyonu, göktaşı, düşmüş UFO, metal kıyılı havuz). Diken plakası ve lav bütün temalarda ortak. Su her temada mavi,
  kıyısı temaya göre.
- **Canlı katman:** dalga, lav ve üst hattından yükselen alevler, mum alevi, kovukta göz kırpma, ateş böceği, kristal
  parıltısı, buhar kabarcığı, gülen alev ruhu, yanıp sönen ışıklar, yıldız yansıması (`ENGEL_CANLI`).

Çizim (`www/engeller.js`): her engel ilk görüldüğünde kendi tuvaline bir kez çizilir (ölçek
`min(min(dpr, 2) × viewScale, 2)`; ekran dönünce ya da tablet boyunda yeniden), `render` tek `engelleriCiz(ctx)`
çağırır. Ölçek 2'de bütün engellerin resmi bölüm başına 5,3–8,4 MB (1–30. bölümler). İlk denemede kare hızı
%20 düştü; taranma ölçümünde neden her karedeki kırpma yolu (tek su 4 kat yavaş işlemcide ~11 ms) ve kesirli konuma
ölçekli basılan resimlerdi. Kırpma kaldırıldı (dalgalar ve lav çatlakları biçimin iç satır aralıklarına, kesişen
gölün ikinci geçişi hazır maskeli resimle, lav parlaması hazır gölge resmiyle); resimler telefonda piksele hizalı
1:1 basılıyor (~10 kat ucuz, bulanıklık yok). Sonuç (`cizim.test`, 4 kat yavaş işlemci, ekran yoğunluğu 2): kare
hızı eskisiyle aynı ya da daha iyi (aynı makinede sırayla: hayaletli sahne 44,8 → 47,7 kare/sn); yavaşlatmasız
ölçümde en kalabalık Uzay bölümünde tam kare 1,8–1,9 ms, engeller ~1,2 ms.

Onaylı taslaktan gelen bir hata düzeltildi: `kenarNoktalari` biçimin dışına kaydırılmış kenarda (b ≥ 2) hiç nokta
döndürmüyordu; sazlık göletin kamışları, lav kıyısının taşları ve vaha palmiyeleri o yüzden çizilmiyordu. Kapsama
kuralı (çarpışma alanının içi boyalı, biçimin kıyı/kenar payıyla birlikte dışı saydam) için ağaç, kaktüs, lahit,
kardan adam ve kristaller yamadaki boşluğa göre boylanır ve yamanın 8 px ötesinde kırpılır; ağaçlar taslaktakinden
biraz kısa.

Test: `test/engel-bicim.test.mjs` (12 sınama: biçim dikdörtgende, çarpışma biçimi izler, kılık kuralı, iki sayfada
aynı biçim ve aynı resim, `freeSpot`, 6 tema, kapsama, ekran dönmesi ve tablet ölçeği, bölüm geçişi, sayfa hatası;
`--ekran <klasör>` ile her tema için katalog ve TR 390 / AR 340 px oyun içi görüntüler). Kapsama ayrıca son hâliyle
bir kerelik geniş taramayla 6 tema × 40 tohumda (7 088 resim, taşma yok) denetlendi. `engel.test`, `cizim.test`,
`dil.test` değişmeden geçer; emülatörde `cevrimici.test` 17/17, `alti.test` 11/11 (6 kişi, 2 kat yavaş işlemci:
kurucu 48,2, konuk 46,3 kare/sn; 3.12.2 ölçümleri 33–53 ve 48–53).

## 3.13.0: tur sıralaması ve kupa

Bildirim: "Multiplayer'da herkese 1. sıra dedi; herkesin kendi hayalet avına göre sıraya koysun, birinciye kupa
versin." Neden: tur sonu ekranı yerel Şampiyonlar listesindeki sırayı yazıyordu (`addLeaderboardEntry`); liste aynı adı
tek kayıtta tuttuğu için çoğu cihazda sıra 0 çıkıyor, herkese "🥇 1. SIRA! Şampiyonsun!" yazıyordu.

- Her oyuncu kendi yakaladığı hayalet sayısını (`game.totalCaught`, son vuruşu yapan sayar) oda kaydına `av` olarak
  yazar: değişince, en çok 400 ms'de bir, konum yazımından ayrı (kural reddederse konum eşitlemesi bozulmaz).
- Tur sonu ekranında odanın sıralaması: ad, hayalet sayısı, 🥇🥈🥉 ve 4.–6.; eşitlikte sıra paylaşılır (1, 1, 3) ve
  kimliğe göre dizilir. Tur herkes hayalet olduktan 2,5 sn sonra bittiği için sayılar oturmuştur: her cihaz aynı
  listeyi görür. Sayısı gelmeyen oyuncu (eski sürüm) sona "?" ile yazılır, sıralamaya girmez.
- Kupa: birinci (berabereyse hepsi) `save.kupa`'ya +1 alır; en az 2 sayılı oyuncu ve en az 1 hayalet şartıyla (tek
  başına oda kurup kupa toplanamaz). Kupa sayısı kayıtla birlikte yedeğe girer, ana menüde 💰💎💚'nin yanında 🏆 ile
  görünür. Tek kişilik oyunun sonuç ekranı değişmedi; çevrimiçi skor yine Şampiyonlar listesine eklenir.
- Kural: `players/$uid/av` 0–100000 arası sayı. Konsolda yayınlanmadan 3.13.0 oyuncuya ulaşırsa yazım reddedilir,
  sıralamada başkalarının sayısı "?" görünür ve kupa verilmez; oyun etkilenmez.

Test: `test/siralama.test.mjs` (8 sınama: sıralama ve eşitlik, kupa kuralı, birinci/ikinci/berabere/4. sıra ekranı,
kupanın kaydı ve menüde görünmesi, tek kişilik oyun değişmez, ad HTML olarak işlenmez); `cevrimici.test.mjs`'e üç
oyunculu turda her cihazda aynı sıra ve kupa yalnız birinciye, `av` kuralı (metin, eksi ve 100001 ret; 9 kabul) ve iki
kişide berabere birinci eklendi; dil testinde 6 kişilik tur sonu (her dilde 390 ve 340 px).

## Diller

Kaynak dil Türkçedir. Metinler kodda Türkçe yazılır ve `t("…")` ile çevrilir (`www/i18n.js`); `{ad}` gibi yer
tutucular `t(metin, { ad: … })` ile doldurulur. Sözlükler `www/i18n/<dil>.js` dosyalarındadır, anahtar Türkçe metnin
kendisidir. `index.html`'deki sabit metinler açılışta `dilUygula()` ile çevrilir; iç biçimli metinler `data-i18n-html`
ile işaretlenir. Dil ilk açılışta telefonun dilinden seçilir (desteklenmeyen dilde İngilizce), menüdeki **🌐 Dil**
düğmesiyle değiştirilir. Arapçada sayfa `dir="rtl"` olur. Android simge adı `res/values-<dil>/strings.xml`'de.

Yeni ya da değişen bir metin için:
```sh
node hayalet-avcilari/araclar/anahtarlar.mjs            # çevrilecek bütün anahtarlar
node hayalet-avcilari/araclar/sozluk.mjs denetle         # eksik anahtar, yer tutucu, HTML etiketi denetimi
node hayalet-avcilari/test/dil.test.mjs                  # her dilde bütün ekranlar: çevrilmemiş metin, taşma, hata
node hayalet-avcilari/araclar/magaza-gorsel.mjs          # Play ekran görüntüleri ve tanıtım görseli (her dil)
```
Mağaza metinleri: Türkçe `magaza/aciklamalar.md`, diğerleri `magaza/diller/<play-dili>.md` (en-US, es-ES, es-419,
zh-CN, hi-IN, ar); görseller `magaza/play/` ve `magaza/play/<play-dili>/`.

## Derleme

Node 22, JDK 21, Android SDK 36:
```sh
cd hayalet-avcilari && npm ci && npx cap sync android
cd android && echo "sdk.dir=$ANDROID_HOME" > local.properties
./gradlew bundleRelease assembleRelease
```
`android/keystore.properties` varsa paketler yükleme anahtarıyla imzalanır (`storeFile`, `storePassword`, `keyAlias`,
`keyPassword`). Bu dosya ve `.jks` depoya **alınmaz**. Yükleme anahtarı kullanıcıya ayrıca verildi; kaybolursa Play
Console'dan "yükleme anahtarını sıfırla" istenir (Play App Signing açık olduğu için uygulama kaybolmaz).

### GitHub üzerinden (NetcadDevelop/DWG Office Zip düzeni)

`.github/workflows/hayalet-android.yml` her değişiklikte derler. GitHub › Settings › Secrets and variables › Actions'ta
şu iki secret varsa yükleme anahtarıyla **imzalı AAB** derlenir ve `HayaletAvcilari-aab` artifact'ı (surum.txt ile) olur:

| Secret | Değer |
|---|---|
| `HAYALET_KEYSTORE_BASE64` | `hayaletavcilari-upload.jks` dosyasının base64'ü (Mac: `base64 -i hayaletavcilari-upload.jks \| pbcopy`) |
| `HAYALET_KEYSTORE_PASSWORD` | yükleme anahtarının parolası (anahtarla birlikte verilen OKU-BENI.txt'te) |

`play-istek.txt`'ye `yukle uygula` yazılıp gönderilince `play-hayalet.yml` AAB'yi o artifact'tan alır (versionCode
eşleşmeli) ve Play'e yükler; artifact yoksa depodaki `dist/HayaletAvcilari-play.aab` kullanılır. Yani yeni sürüm için:
`versionCode` +1 → push → derleme biter → `play-istek.txt`'ye `yukle uygula` → onayla `yukle yayinla uygula`.
