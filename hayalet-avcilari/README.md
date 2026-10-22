# Hayalet Avcıları

Hayalet yakalama oyunu (Poyraz Workshop). Oyun HTML5 canvas'tır (`www/`), Android'e **Capacitor 8** ile paketlenir.
Çevrimiçi oda, şampiyonlar listesi ve bulut yedeği Firebase (`hayalet-avcilari` projesi) üzerindedir; Google ile
giriş `@codetrix-studio/capacitor-google-auth`, reklamlar `@capacitor-community/admob` eklentisiyle yapılır.

| | |
|---|---|
| Paket | `com.poyrazworkshop.hayaletavcilari` |
| Sürüm | 3.12.0 (versionCode 42) — Play'de 3.10.2 (38); 3.11.0 (41) 22 Ekim 2026'da incelemeye gönderildi |
| Diller | Türkçe, English, Español, 简体中文, हिन्दी, العربية (sağdan sola) |
| Play'e yayın | [`magaza/PLAY-YAYIN.md`](magaza/PLAY-YAYIN.md) |
| Gizlilik / hesap silme | `app/hayalet-avcilari/` → GitHub Pages |
| Firebase kuralları | [`firebase/`](firebase/README.md) — RTDB + Firestore kuralları, yol yol gerekçe, emülatör testi. 3.10.2'den beri Firebase anonim giriş: oda, kodlu yedek ve skor `auth.uid`'e bağlı. 3.10.3 geçişi kapatır (girişsiz ve `u_` kimlikli yazım reddedilir) |
| Reklam | AdMob, yalnız Android uygulaması — aşağıda "Reklamlar (AdMob)" |
| Play Games | Play Oyun Hizmetleri v2 (3.10.4), yalnız Android — aşağıda "Google Play Oyun Hizmetleri" |
| Play paketi | 3.10.1'den itibaren CI (`hayalet-android.yml`) derler; `dist/HayaletAvcilari-play.aab` 3.10.0 (36) olarak kaldı. Geçişi kapatan kurallar 20 Ekim 2026'da yayınlandı ([`firebase/README.md` › Yayınlama](firebase/README.md#yayınlama)); sıradaki paket 3.12.0 (42; çevrimiçi oyun yenilendi): 22 Ekim 2026'da kullanıcının isteğiyle ("Derle ve yayınla") `claude/beautiful-feynman-pxwdju` dalından derlenip Play'e gönderiliyor |
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

Test: `cd hayalet-avcilari/firebase && npm run test:cevrimici` (emülatör + Playwright; 11 sınama).

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
