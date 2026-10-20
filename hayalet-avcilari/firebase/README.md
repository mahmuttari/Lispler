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
- **Anonim giriş olmazsa** (internet yok, konsolda sağlayıcı kapalı, 10 sn içinde yanıt yok) çevrimiçi oda kurma
  ve katılma "Firebase'e bağlanılamadı" der, kodlu yedek "Yedekleme başarısız" der, skor buluta gönderilmez (yerel
  listeye yine yazılır). Oda listesi ve kodlu yedeği geri yükleme girişsiz de çalışır (okuma).
- **Şampiyonlar listesi Firestore'dadır**, REST API'ye API anahtarı ve `Authorization: Bearer <kimlik jetonu>`
  başlığıyla yazılır.

### Geçiş dönemi (3.10.2 → 3.10.3, kapandı)

3.10.2 kuralları girişsiz eski sürümler (3.10.1 ve öncesi) için korumayı kimliğin biçimine göre veriyordu: `u_…`
(eski cihaz kimliği, `getOnlineUid()`) kimlikli oyuncu kaydı, oda, olay ve sahipsiz kodlu yedek eskisi gibi yalnız
şema denetimiyle yazılabiliyordu; girişsiz skor (uid'siz) kabul ediliyordu. 3.10.2 de giriş olmazsa bu kimliğe
düşüyordu. **3.10.3 kurallarında bu seçenekler yok, oyundan da `u_` yedeği kalktı:** her yazım girişli ve
`auth.uid`'e bağlı. Play'deki ilk sürüm zaten 3.10.2 olduğu için girişsiz istemci yalnız elle kurulmuş eski APK'lardır;
bunlar oda listesini görür ve kodla geri yükler ama yazamaz.

Geçiş döneminden veritabanında kalabilecekler:

| Kayıt | Kapalı kurallarla |
|---|---|
| `hostUid`'i `u_…` olan oda | Kimse kuramaz, eski host yazamaz. İstemci 60 sn'den eski odaları listelemez. Girişli bir oyuncu kendi kaydını yazabilir; eski host odada yoksa odayı devralıp silebilir. İstenirse konsoldan silinir. |
| Sahipsiz kodlu yedek (`ownerUid` yok) | Kodu bilen okur. Girişli ilk yedekleyen sahiplenir; girişli kodu bilen silebilir (oyun içi hesap silme). Sahipsiz yazım yok. |
| uid'siz skor | Listede kalır; adı değişmez, silinmez. |

## Realtime Database — yollar ve gerekçeler

Kök: `.read: false`, `.write: false`. Aşağıda adı geçmeyen hiçbir yol okunamaz, yazılamaz.

### `rooms` — çevrimiçi odalar

Her yazım girişli ister (`auth != null`); kimlik `auth.uid`'dir.

| İşlem | game.js | Kural |
|---|---|---|
| Oda listesi (canlı dinleme) | `openRoomList` › `db.ref("rooms").on("value")` | `rooms/.read: true` — odalarda yalnız oyun verisi var (oda adı, avcı adı, konum). |
| Oda kur | `submitCreateRoom` › `put rooms/{id}` | Oda yoksa ve `hostUid === auth.uid`. Oda kimliği `makeRoomId()` alfabesinden tam 6 harf; var olan odanın üzerine kurulamaz; `rooms` kökü yazılamaz. |
| Katıl | `joinRoom` › `get rooms/{id}`, `put players/{uid}`, `patch {lastSeen}` | `players/$uid/.write: auth.uid === $uid`. `lastSeen`'i odadaki oyuncu yazar. |
| Hazır ol | `toggleReady` › `patch players/{uid}` | Yalnız kendi kaydı. |
| Başlat | `startMpGame` › `patch {status, lastSeen}`, `put state null`, `put events null` | `status`, `state`, `events` silme: `auth.uid === hostUid`. |
| Oyun içi senkron (10 Hz) | `mpPushImpl` › `patch players/{uid}`, host `put state` | Kendi kaydı; `state` yalnız host. Alanlar ve `state` (`g`, `p`, `e`, `lvl`, `bd`, `bt`, `lt`) tek tek tür denetimli; bilinmeyen alan reddedilir. |
| İstemci olayları | `rtdb.post rooms/{id}/events`; host `snap.ref.remove()` | Yeni olayda `type` ve `by` zorunlu, `by` odadaki bir oyuncu ve `by === auth.uid`; alanlar `by x y r dmg gi pi duration`. Olayı yalnız host siler. |
| Host devri | `maybeBecomeNewHost` › `patch {hostUid, hostName, lastSeen}` | `hostUid` yalnız eski host `players`'ta yokken değişir; yeni değer `auth.uid` ve odadaki bir oyuncu olmalı. `hostName`'i yalnız (yeni) host yazar. |
| Çıkış / kopma | `leaveRoom`, `quitOnlineGame`, `quitToMenu`, `onDisconnect().remove()` | Konuk kendi kaydını siler; **odayı yalnız host siler** (`auth.uid === hostUid`). |

Odanın kendisinde `name, hostUid, status, maxPlayers, createdAt, lastSeen` zorunludur; `name`, `maxPlayers`,
`createdAt`, `level` kurulduktan sonra değişmez. Host odayı sildikten sonra gecikmeli gelen bir `players/{uid}`
yazımı "zombi oda" yaratamaz, reddedilir. `setupOnDisconnect` oda düğümündeki eski `onDisconnect`'i iptal etmeyi de
dener; konukta bu reddedilebilir, oyun hatayı yutar.

**Sınırlar:** Oda kimliğini bilen girişli herkes odaya katılabilir (oyun tasarımı). Host yokken odadaki herhangi bir
oyuncu host olabilir; "en eski oyuncu" kuralı istemcidedir. Anonim hesap bedavadır, yani biri çok sayıda kimlik
açabilir (her biri yalnız kendi kaydını ve kendi adına olayı yazar).

### `accounts/$code` — kodlu yedek

| İşlem | game.js | Kural |
|---|---|---|
| Yedekle | `backupAccount` › `kodluYedekYaz` › `put accounts/ABC_D23` | Kod `XXX_XXX` (`A-Z0-9`); gövde `name` (≤50), `save` (dizgi, ≤200 000), `updatedAt` (sayı), `ownerUid`. Giriş zorunlu ve yeni `ownerUid === auth.uid`; kayıt sahipsizse ya da sahibi `auth.uid` ise yazılır. Giriş yoksa oyun yazmayı denemez. |
| Başka cihazda yedekle | aynı | Kod başka kullanıcıya aitse yazım reddedilir; oyun bu cihaz için yeni kod üretir ("bu cihazın yeni kodu: …"). |
| Geri yükle | `restoreAccount` › `get accounts/ABC_D23` | Kodu bilen okur (başka cihaza taşıma). **`accounts` listesi okunamaz.** |
| Sil | `deleteAccountGoogle` › `remove accounts/ABC_D23` | Sahipli kaydı yalnız sahibi siler; geçişten kalan sahipsiz kaydı girişli kodu bilen. |

Kod artık yalnız **okuma** anahtarıdır: kodu öğrenen biri yedeği okuyup kendi cihazına yükleyebilir ama sahipli
yedeğin üzerine yazamaz, silemez. 3.10.1'in yazdığı sahipsiz kayıtları (geçiş döneminden) girişli ilk yedekleyen
sahiplenir; o güne kadar kodu bilen girişli biri de sahiplenebilir ya da silebilir (geçiş dönemindeki gibi).

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
| Skor ekle | `submitOnlineScore` › `POST scores` | Alanlar `name level ghosts para score date uid` zorunlu, başka alan yok; `name` 1–19 karakter; `level` 1–1000, `ghosts` 0–1 000 000, `para` ≥ 0 tam sayı; `score` = `level*1000 + ghosts*10 + para` (`scoreFor`) ve < 10 000 000; `date` en çok 1 gün ileride. **Sahip:** giriş zorunlu, `uid == request.auth.uid`. Giriş yoksa oyun skoru göndermez. |
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
konuk birinin host işlerine karışamadığı; kapanan geçişin reddi (girişsiz ve `u_` kimlikli oda kurma, katılma,
host devri, olay; girişli bağlantının `u_` kimliğiyle yazması; geçişten kalan eski odada girişli oyuncu); şema;
sahipli kodlu yedek, sahipsiz yazımın reddi ve geçişten kalan sahipsiz yedeğin sahiplenilmesi; Google yedeği; girişsiz
skorun reddi, skor ekle/listele ve yalnız kendi skorunun adını değiştirme. Her bölümde izinsiz ya da bozuk
yazımların reddedildiği de sınanır. GitHub Actions'ta `hayalet-firebase-kurallar.yml` bu klasördeki her değişiklikte
aynı testi çalıştırır.

**game.js'te bir veritabanı yoluna ya da gövdesine alan eklerseniz** (ör. oyuncuya yeni bir senkron alanı), aynı
değişiklikte kurala ve teste de ekleyin: bilinmeyen alan içeren yazım bütünüyle reddedilir ve çevrimiçi oyun bozulur.

## Yayınlama

Kurallar konsoldan elle yayınlanır (bu depo Firebase CLI ile dağıtım yapmaz). Konsol eski kuralların geçmişini tutar;
sorun çıkarsa aynı ekrandan önceki sürüme dönülebilir.

### 3.10.3: geçişi kapatmak (kurallar 20 Ekim 2026'da yayınlandı, canlı deneme 21/21)

1. **Ön koşul:** 3.10.2 Play'de yayında (Play'deki ilk sürüm 3.10.2; girişsiz istemci yalnız elle kurulmuş
   3.10.1 ve öncesi APK'lar). Kurallar yayınlanınca bu APK'lar çevrimiçi oda kuramaz/katılamaz, yedekleyemez, skor
   gönderemez; tek kişilik oyun etkilenmez.
2. Realtime Database › **Kurallar** → `database.rules.json`'un tamamını yapıştır → **Yayınla**.
3. Firestore Database › **Kurallar** → `firestore.rules`'un tamamını yapıştır → **Yayınla**.
4. Dene (3.10.2 ya da 3.10.3): çevrimiçi oda kur/katıl/oyna, host çıkınca devri, kodlu yedekle/başka cihazda geri
   yükle, oyun bitince şampiyonlar listesi ve isim değişikliği. Girişsiz REST yazımı reddedilmeli, ör.
   `curl -X PUT -d '{"name":"x","hostUid":"u_deneme0001","status":"lobby","maxPlayers":2,"createdAt":1,"lastSeen":1}' https://hayalet-avcilari-default-rtdb.europe-west1.firebasedatabase.app/rooms/ZZZZZZ.json`
   → `Permission denied`.
5. İsteğe bağlı: Realtime Database › Veriler'de `hostUid`'i `u_` ile başlayan eski odaları sil.
6. Sıradaki paket 3.11.0 (41: 3.10.4'ün Play Games'i + yeni karakterler, envanter, Bot): merge sonrası `hayalet-android.yml` imzalı AAB'yi derler → `play-istek.txt`'ye `yukle uygula`
   → onayla `yukle yayinla uygula` ([`magaza/PLAY-YAYIN.md`](../magaza/PLAY-YAYIN.md)).

Sıra serbesttir: 3.10.3 geçiş kurallarıyla da çalışır, kapalı kurallar da 3.10.2'yi bozmaz (yalnız 3.10.2'de anonim
giriş olmazsa eski `u_` yedeğiyle yapılan yazım reddedilir; oyun "Oda kurulamadı" / "Yedekleme başarısız" der).

### 3.10.2: anonim giriş (yapıldı, 2026-10-20)

1. Firebase konsolu › `hayalet-avcilari` › Authentication › **Sign-in method** › **Anonim** → Etkinleştir → Kaydet.
2. Realtime Database ve Firestore kurallarına 3.10.2 sürümü (geçişli) yayınlandı.
3. 3.10.2 Play incelemesine gönderildi (`magaza/PLAY-YAYIN.md`).
