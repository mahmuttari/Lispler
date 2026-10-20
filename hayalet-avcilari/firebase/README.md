# Hayalet Avcıları — Firebase kuralları

Firebase projesi `hayalet-avcilari`. Bu klasör iki veritabanının kurallarını tutar:

| Dosya | Veritabanı | Konsolda yeri |
|---|---|---|
| [`database.rules.json`](database.rules.json) | Realtime Database `hayalet-avcilari-default-rtdb` (europe-west1) | Realtime Database › Kurallar |
| [`firestore.rules`](firestore.rules) | Cloud Firestore `(default)` | Firestore Database › Kurallar |

Bu kurallardan önce Realtime Database tamamen açıktı (`{".read": true, ".write": true}`): herkes bütün veritabanını
okuyabiliyor (bütün kodlu yedekler, Google yedeklerindeki e-posta adresleri dahil), silebiliyor ya da istediği yola
istediği veriyi yazabiliyordu.

## Kimlik doğrulama: kim, nasıl giriyor?

- **3.10.2'den beri Firebase Anonymous Auth var.** `www/game.js` açılışta kayıtlı oturumun yüklenmesini bekler
  (`authIlkDurum`), oturum yoksa `firebase.auth().signInAnonymously()` yapar (`fbKullanici`). Çevrimiçi oyuncu
  kimliği (`online.uid`), kodlu yedeğin sahibi (`ownerUid`) ve skorun sahibi (`uid`) bu `auth.uid`'dir.
- **Google ile Giriş anonim hesabı yükseltir:** `signInWithGoogle()` önce `linkWithCredential` dener; uid aynı kalır,
  oda/yedek/skor sahipliği korunur. Google hesabı Firebase'de zaten varsa (eski sürümde ya da başka cihazda giriş
  yapılmış: `auth/credential-already-in-use`) `signInWithCredential` ile o hesaba geçilir; `accounts_google/$uid`
  yedeği oradadır. Google'dan çıkınca ya da hesap silinince yeni bir anonim oturum açılır.
- **Anonim giriş olmazsa** (internet yok, konsolda sağlayıcı kapalı, 10 sn içinde yanıt yok) oyun eski kimlikle
  sürer: `getOnlineUid()` → `u_` + base36 (localStorage `hayaletAvcilariOnlineUid_v1`). 3.10.1 ve öncesi hep böyledir.
- **Şampiyonlar listesi Firestore'dadır**, REST API'ye API anahtarıyla yazılır; 3.10.2 girişliyse
  `Authorization: Bearer <kimlik jetonu>` başlığını da gönderir.

### Geçiş dönemi: iki biçim birlikte

Play'de ve elle kurulmuş 3.10.1 ve öncesi girişsiz yazar. Kurallar korumayı **kimliğin biçimine** göre verir:

| Kimlik | Kim yazar | Koruma |
|---|---|---|
| `auth.uid` (harf/rakam, `u_` ile başlamaz) | yalnız o kullanıcı | oyuncu kaydı, host işleri, olay, yedek kişiye bağlı |
| `u_…` (eski cihaz kimliği) | kimliği bilen herkes (girişli ya da girişsiz) | 3.10.1'deki gibi yalnız şema denetimi |

Böylece yeni sürümün odaları ve sahipli yedekleri hemen korunur; eski sürüm kendi odalarında eskisi gibi oynar,
yeni sürümün odasına konuk olarak katılabilir (host işlerine karışamaz), yeni sürüm de eski odaya katılabilir.
Girişli bağlantı `u_` anahtarıyla da yazabilir: giriş 10 sn'den geç tamamlanırsa oyun bozulmaz.

## Realtime Database — yollar ve gerekçeler

Kök: `.read: false`, `.write: false`. Aşağıda adı geçmeyen hiçbir yol okunamaz, yazılamaz.

### `rooms` — çevrimiçi odalar

Odanın türünü `hostUid` belirler: `u_…` ise **eski oda** (bütün alt ağaç 3.10.1'deki gibi herkese yazılabilir,
yalnız şema denetlenir), değilse **girişli oda** (aşağıdaki tablo).

| İşlem | game.js | Kural (girişli oda) |
|---|---|---|
| Oda listesi (canlı dinleme) | `openRoomList` › `db.ref("rooms").on("value")` | `rooms/.read: true` — odalarda yalnız oyun verisi var (oda adı, avcı adı, konum). |
| Oda kur | `submitCreateRoom` › `put rooms/{id}` | Oda yoksa ve `hostUid === auth.uid` (geçiş: ya da `u_…`). Oda kimliği `makeRoomId()` alfabesinden tam 6 harf; var olan odanın üzerine kurulamaz; `rooms` kökü yazılamaz. |
| Katıl | `joinRoom` › `get rooms/{id}`, `put players/{uid}`, `patch {lastSeen}` | `players/$uid/.write: auth.uid === $uid` (geçiş: ya da `$uid` `u_…`). `lastSeen`'i odadaki oyuncu yazar (geçiş: ya da girişsiz). |
| Hazır ol | `toggleReady` › `patch players/{uid}` | Yalnız kendi kaydı. |
| Başlat | `startMpGame` › `patch {status, lastSeen}`, `put state null`, `put events null` | `status`, `state`, `events` silme: `auth.uid === hostUid`. |
| Oyun içi senkron (10 Hz) | `mpPushImpl` › `patch players/{uid}`, host `put state` | Kendi kaydı; `state` yalnız host. Alanlar ve `state` (`g`, `p`, `e`, `lvl`, `bd`, `bt`, `lt`) tek tek tür denetimli; bilinmeyen alan reddedilir. |
| İstemci olayları | `rtdb.post rooms/{id}/events`; host `snap.ref.remove()` | Yeni olayda `type` ve `by` zorunlu, `by` odadaki bir oyuncu ve `by === auth.uid` (geçiş: ya da `u_…`); alanlar `by x y r dmg gi pi duration`. Olayı yalnız host siler. |
| Host devri | `maybeBecomeNewHost` › `patch {hostUid, hostName, lastSeen}` | `hostUid` yalnız eski host `players`'ta yokken değişir; yeni değer odadaki bir oyuncu ve `auth.uid` olmalı (geçiş: ya da `u_…` — eski sürüm konuk host olursa oda eski odaya döner). `hostName`'i yalnız (yeni) host yazar. |
| Çıkış / kopma | `leaveRoom`, `quitOnlineGame`, `quitToMenu`, `onDisconnect().remove()` | Konuk kendi kaydını siler; **odayı yalnız host siler** (`auth.uid === hostUid`). |

Odanın kendisinde `name, hostUid, status, maxPlayers, createdAt, lastSeen` zorunludur; `name`, `maxPlayers`,
`createdAt`, `level` kurulduktan sonra değişmez. Host odayı sildikten sonra gecikmeli gelen bir `players/{uid}`
yazımı "zombi oda" yaratamaz, reddedilir. `setupOnDisconnect` oda düğümündeki eski `onDisconnect`'i iptal etmeyi de
dener; konukta bu reddedilebilir, oyun hatayı yutar.

**Sınırlar:** Oda kimliğini bilen girişli herkes odaya katılabilir (oyun tasarımı). Host yokken odadaki herhangi bir
oyuncu host olabilir; "en eski oyuncu" kuralı istemcidedir. Anonim hesap bedavadır, yani biri çok sayıda kimlik
açabilir. Geçiş döneminde girişsiz biri herhangi bir odaya `u_…` adlı sahte oyuncu ve o oyuncu adına olay
ekleyebilir; host'un kaydına, `state`'e ve odanın kendisine dokunamaz.

### `accounts/$code` — kodlu yedek

| İşlem | game.js | Kural |
|---|---|---|
| Yedekle | `backupAccount` › `kodluYedekYaz` › `put accounts/ABC_D23` | Kod `XXX_XXX` (`A-Z0-9`); gövde `name` (≤50), `save` (dizgi, ≤200 000), `updatedAt` (sayı), `ownerUid` (isteğe bağlı). Kayıt sahipsizse ya da sahibi `auth.uid` ise yazılır; yeni `ownerUid` ancak `auth.uid` olabilir. |
| Başka cihazda yedekle | aynı | Kod başka kullanıcıya aitse yazım reddedilir; oyun bu cihaz için yeni kod üretir ("bu cihazın yeni kodu: …"). |
| Geri yükle | `restoreAccount` › `get accounts/ABC_D23` | Kodu bilen okur (başka cihaza taşıma). **`accounts` listesi okunamaz.** |
| Sil | `deleteAccountGoogle` › `remove accounts/ABC_D23` | Sahipli kaydı yalnız sahibi siler. |

Kod artık yalnız **okuma** anahtarıdır: kodu öğrenen biri yedeği okuyup kendi cihazına yükleyebilir ama sahipli
yedeğin üzerine yazamaz, silemez. Geçiş: 3.10.1'in yazdığı sahipsiz kayıtlar eskisi gibi kodu bilen herkese açıktır;
3.10.2 o kodla ilk yedeklemede kaydı sahiplenir. Giriş zaman aşımına uğrarsa sahibi kaydını sahipsiz de yazabilir.

### `accounts_google/$uid` — Google bulut yedeği

| İşlem | game.js | Kural |
|---|---|---|
| Yedekle | `backupAccountGoogle` › `put accounts_google/{auth.uid}` | `.write: auth.uid === $uid` |
| Geri yükle | `restoreAccountGoogle` › `get` | `.read: auth.uid === $uid` |
| Hesabı sil | `deleteAccountGoogle` › `remove`, ardından `user.delete()` | `.write: auth.uid === $uid` — gizlilik politikasındaki oyun içi hesap silme akışı korunur. |

Gövde: `save` (≤200 000) ve `updatedAt` zorunlu; `name` (≤50), `googleName` (≤200), `googleEmail` (≤320) isteğe bağlı;
başka alan yok. Kimse başkasının yedeğini göremez; `accounts_google` listelenemez. Oyun Google düğmelerini yalnız
anonim olmayan kullanıcıya açar (`currentFirebaseUser`); kural sağlayıcıya bakmaz (anonimden yükseltilen hesapta
jetonun ne zaman yenileneceğine bağlı kalmamak için), yani anonim biri yalnız kendi uid'i altına yazabilir.

## Cloud Firestore — `scores` (şampiyonlar listesi)

| İşlem | game.js | Kural |
|---|---|---|
| Listele | `fetchOnlineLeaderboard` › `runQuery` (`date` azalan, 200) | `allow read: if true` |
| Skor ekle | `submitOnlineScore` › `POST scores` | Alanlar `name level ghosts para score date` zorunlu, `uid` isteğe bağlı, başka alan yok; `name` 1–19 karakter; `level` 1–1000, `ghosts` 0–1 000 000, `para` ≥ 0 tam sayı; `score` = `level*1000 + ghosts*10 + para` (`scoreFor`) ve < 10 000 000; `date` en çok 1 gün ileride. **Sahip:** girişliyse `uid == request.auth.uid` zorunlu; girişsizse (geçiş: 3.10.1) `uid` olamaz. |
| İsim değiştir | `renameInLeaderboard` › `runQuery uid ==` + `PATCH updateMask=name` | `allow update`: girişli, belgenin `uid`'i `request.auth.uid`, yalnız `name` değişiyor ve geçerli. 3.10.2'den önceki uid'siz skorlar değişmez, eski adla kalır. |
| Sil | — | Kapalı. |

`scores` dışındaki bütün koleksiyonlar kapalı. Tutarlı ama uydurma bir skor yine eklenebilir; bunu önlemek ancak
sunucu tarafı doğrulamayla (ör. Cloud Functions) mümkün. Skorlardaki `uid` herkese açık listede görünür (odalardaki
oyuncu anahtarı gibi rastgele bir kimlik; ad ya da e-posta içermez).

## Test

Emülatörde (Java 21 + Node 22):

```sh
cd hayalet-avcilari/firebase
npm ci
npm test
```

`test/kurallar.test.mjs` `www/game.js`'teki gövdelerin aynısını yazar: girişli (anonim) iki oyuncuyla oda kur →
listele → katıl → hazır ol → başlat → 10 Hz senkron → beş olay türü → çıkış; host devri; odada olmayan, girişsiz ve
konuk birinin host işlerine karışamadığı; geçiş dönemi (eski sürümler arası oda, eski sürüm konuğun girişli odaya
katılması ve host olması, yeni sürümün eski odaya katılması, geç tamamlanan giriş); sahipli ve sahipsiz kodlu yedek;
Google yedeği; skor ekle/listele ve yalnız kendi skorunun adını değiştirme. Her bölümde izinsiz ya da bozuk
yazımların reddedildiği de sınanır. GitHub Actions'ta `hayalet-firebase-kurallar.yml` bu klasördeki her değişiklikte
aynı testi çalıştırır.

**game.js'te bir veritabanı yoluna ya da gövdesine alan eklerseniz** (ör. oyuncuya yeni bir senkron alanı), aynı
değişiklikte kurala ve teste de ekleyin: bilinmeyen alan içeren yazım bütünüyle reddedilir ve çevrimiçi oyun bozulur.

## Yayınlama

Kurallar konsoldan elle yayınlanır (bu depo Firebase CLI ile dağıtım yapmaz). 3.10.2 için sıra:

1. Firebase konsolu › `hayalet-avcilari` › Authentication › **Sign-in method** › **Anonim** → Etkinleştir → Kaydet.
   (Kapalıyken 3.10.2 eski `u_` kimliğiyle çalışır ama korunmaz.)
2. Realtime Database › **Kurallar** → `database.rules.json`'un tamamını yapıştır → **Yayınla**.
3. Firestore Database › **Kurallar** → `firestore.rules`'un tamamını yapıştır → **Yayınla**.
4. Oyunda dene (3.10.2 ve mümkünse bir 3.10.1 cihazı): çevrimiçi oda kur/katıl/oyna, host çıkınca devri, kodlu
   yedekle/başka cihazda geri yükle, Google ile giriş/yedekle/geri yükle/hesabı sil, oyun bitince şampiyonlar listesi
   ve isim değişikliği.
5. Sonra 3.10.2'yi yayınla (`magaza/PLAY-YAYIN.md`).

Kurallar geriye uyumludur: 2–3. adımlar 3.10.2 yayınlanmadan önce yapılabilir, 3.10.1 çalışmaya devam eder. Konsol
eski kuralların geçmişini tutar; sorun çıkarsa aynı ekrandan önceki sürüme dönülebilir.

## Sonraki adım: geçişi kapatmak

3.10.1 ve öncesi kullanımdan kalkınca (Play Console › Android vitals / sürüm dağılımı; elle kurulmuş APK'lar dahil)
geçiş izinleri silinir, bütün kayıtlar kişiye bağlı olur:

- `rooms/$roomId/.write`: `newData.child('hostUid').val().matches(/^u_[a-z0-9]+$/) ||` ve son "eski oda" seçeneği
  (`|| (data.child('hostUid').isString() && …matches(/^u_[a-z0-9]+$/))`).
- `hostUid/.write`, `hostName/.write`, `players/$uid/.write`, `events/$eventId/.write`: `…matches(/^u_[a-z0-9]+$/) ||`
  seçenekleri; `lastSeen/.write`: `auth == null ||`.
- `accounts/$code/.write`: yazmak için `auth != null` ve yeni veride `ownerUid === auth.uid` zorunlu olur.
- `firestore.rules` › `skorSahibi`: `|| (request.auth == null && !('uid' in d))`.
- `game.js`: `getOnlineUid()` yedeği kalkar, giriş yoksa çevrimiçi özellikler "bağlanılamadı" der.

Testte "geçiş dönemi" bölümü de reddedilmeye çevrilir.
