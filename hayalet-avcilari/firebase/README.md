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

- **Firebase Anonymous Auth yok.** `www/index.html` yalnız `firebase-app`, `firebase-database` ve `firebase-auth`
  compat SDK'larını yükler; `signInAnonymously` hiçbir yerde çağrılmaz.
- **Çevrimiçi oyun ve kodlu yedek girişsizdir** (`auth == null`). Oyuncu kimliği `getOnlineUid()` ile cihazda üretilen
  `u_` + base36 bir dizgidir (localStorage `hayaletAvcilariOnlineUid_v1`); Firebase bunu doğrulayamaz.
- **Yalnız Google bulut yedeği girişlidir**: `signInWithGoogle()` Google kimlik jetonunu
  `firebase.auth().signInWithCredential()` ile Firebase Auth'a çevirir; `auth.uid` budur.
- **Şampiyonlar listesi Realtime Database'de değil, Firestore'dadır** ve REST API'ye API anahtarıyla, girişsiz yazılır.

Bu yüzden oda ve kodlu yedek kuralları `auth.uid`'e bağlanamaz (bağlanırsa mevcut oyun çalışmaz); bunlar için yol
biçimi ve veri şeması denetlenir. Yalnız `accounts_google` kimliğe bağlıdır.

## Realtime Database — yollar ve gerekçeler

Kök: `.read: false`, `.write: false`. Aşağıda adı geçmeyen hiçbir yol okunamaz, yazılamaz.

### `rooms` — çevrimiçi odalar (girişsiz)

| İşlem | game.js | Kural |
|---|---|---|
| Oda listesi (canlı dinleme) | `openRoomList` › `db.ref("rooms").on("value")` | `rooms/.read: true` — liste ekranı bütün odaları okur. Odalarda yalnız oyun verisi var (oda adı, avcı adı, konum). |
| Oda kur | `submitCreateRoom` › `put rooms/{id}` | `rooms/$roomId/.write`: oda kimliği `makeRoomId()` alfabesinden (`ABCDEFGHJKMNPQRSTUVWXYZ23456789`) tam 6 harf olmalı. `rooms` kökü yazılamaz, yani bütün odalar tek seferde silinemez. |
| Katıl | `joinRoom` › `get rooms/{id}`, `put players/{uid}`, `patch {lastSeen}` | Oyuncu anahtarı `[A-Za-z0-9_]`, 3–40 karakter. |
| Hazır ol / başlat / host devri | `toggleReady`, `startMpGame`, `maybeBecomeNewHost` › `patch` | `status` yalnız `lobby` ya da `playing`; `maxPlayers` 2–5; `name` 1–60, `hostName` en çok 50 karakter. |
| Oyun içi senkron (10 Hz) | `mpPushImpl` › `patch players/{uid}`, `put state` | Oyuncu alanları ve `state` (`g`, `p`, `e`, `lvl`, `bd`, `bt`, `lt`) tek tek tür denetimli; bilinmeyen alan reddedilir. |
| İstemci olayları | `rtdb.post rooms/{id}/events`; host `snap.ref.remove()` | Olayda `type` zorunlu (en çok 20 karakter), alanlar `by x y r dmg gi pi duration`; başka alan yok. |
| Çıkış / kopma | `leaveRoom`, `quitOnlineGame`, `quitToMenu`, `onDisconnect().remove()` | Silme her zaman serbest (doğrulama silmede çalışmaz). |

Odanın kendisinde `name, hostUid, status, maxPlayers, createdAt, lastSeen` zorunludur. Yan etkisi istenen bir şey: host
odayı sildikten sonra gecikmeli gelen bir `players/{uid}` yazımı artık "zombi oda" yaratamaz, reddedilir.

**Sınır:** Giriş olmadığı için "yalnız host odayı siler", "oyuncu yalnız kendi kaydını yazar" denetlenemez; oda
kimliğini bilen biri o odaya yazabilir. Bunun için oyunun Firebase Anonymous Auth kullanması ve oyuncu anahtarının
`auth.uid` olması gerekir (bkz. "Sonraki adım").

### `accounts/$code` — kodlu yedek (girişsiz)

| İşlem | game.js | Kural |
|---|---|---|
| Yedekle | `backupAccount` › `put accounts/ABC_D23` | Kod anahtarı `XXX_XXX` (`A-Z0-9`); gövde tam olarak `name` (≤50), `save` (dizgi, ≤200 000), `updatedAt` (sayı). |
| Geri yükle | `restoreAccount` › `get accounts/ABC_D23` | Yalnız tek kayıt, kodu bilen okur. **`accounts` listesi okunamaz** — önceden herkes bütün yedekleri indirebiliyordu. |
| Sil | `deleteAccountGoogle` › `remove accounts/ABC_D23` | Kodu bilen siler. |

Kod gizli anahtar gibidir: 6 karakter, ~887 milyon olasılık. Girişsiz olduğundan kodu bilen yedeği okuyabilir,
üzerine yazabilir ya da silebilir; oyun tasarımı bu (başka cihaza kodla taşıma).

### `accounts_google/$uid` — Google bulut yedeği

| İşlem | game.js | Kural |
|---|---|---|
| Yedekle | `backupAccountGoogle` › `put accounts_google/{auth.uid}` | `.write: auth.uid === $uid` |
| Geri yükle | `restoreAccountGoogle` › `get` | `.read: auth.uid === $uid` |
| Hesabı sil | `deleteAccountGoogle` › `remove`, ardından `user.delete()` | `.write: auth.uid === $uid` — gizlilik politikasındaki oyun içi hesap silme akışı korunur. |

Gövde: `save` (≤200 000) ve `updatedAt` zorunlu; `name` (≤50), `googleName` (≤200), `googleEmail` (≤320) isteğe bağlı;
başka alan yok. Kimse başkasının yedeğini, girişsiz kullanıcı hiçbir yedeği göremez; `accounts_google` listelenemez.

## Cloud Firestore — `scores` (şampiyonlar listesi)

Firestore zaten açık değildi. Önceki kural (7 Mayıs 2026): `scores`'a herkes okur; ekleme `name` 1–19 karakter ve
`score` < 10 000 000 tam sayıysa serbest (başka alan denetimi yok); güncelleme ve silme kapalı. Yeni kural bu sınırları
korur ve sıkılaştırır:

| İşlem | game.js | Kural |
|---|---|---|
| Listele | `fetchOnlineLeaderboard` › `runQuery` (`date` azalan, 200) | `allow read: if true` |
| Skor ekle | `submitOnlineScore` › `POST scores` | Yalnız `name level ghosts para score date` alanları, hepsi zorunlu; `name` 1–19 karakter; `level` 1–1000, `ghosts` 0–1 000 000, `para` ≥ 0 tam sayı; `score` = `level*1000 + ghosts*10 + para` (`scoreFor`) ve < 10 000 000; `date` en çok 1 gün ileride (liste tarihe göre çekildiği için ileri tarihli kayıt listenin başına çakılamaz). |
| İsim değiştir | `renameInLeaderboard` › `runQuery name ==` + `PATCH updateMask=name` | **Kapalı (önceki gibi).** Girişsiz olduğundan açılırsa herkes herkesin skorunun adını değiştirebilir. Oyunda isim değişikliği yerel listeyi günceller; bulut listesindeki eski kayıtlar eski adla kalır (bugünkü davranış). |
| Sil | — | Kapalı. |

`scores` dışındaki bütün koleksiyonlar kapalı. Girişsiz yazım olduğu için tutarlı ama uydurma bir skor yine
eklenebilir; bunu önlemek ancak sunucu tarafı doğrulamayla (ör. Cloud Functions) mümkün. Saati 1 günden fazla ileri
olan bir cihazın skoru buluta yazılmaz.

## Test

Emülatörde (Java 21 + Node 22):

```sh
cd hayalet-avcilari/firebase
npm ci
npm test
```

`test/kurallar.test.mjs` `www/game.js`'teki gövdelerin aynısını yazar: oda kur → listele → katıl → hazır ol → başlat →
10 Hz senkron → beş olay türü → host devri → çıkış; kodlu yedek; Google yedeği; skor ekle/listele. Her
bölümde izinsiz ya da bozuk yazımların reddedildiği de sınanır. GitHub Actions'ta `hayalet-firebase-kurallar.yml` bu
klasördeki her değişiklikte aynı testi çalıştırır.

**game.js'te bir veritabanı yoluna ya da gövdesine alan eklerseniz** (ör. oyuncuya yeni bir senkron alanı), aynı
değişiklikte kurala ve teste de ekleyin: bilinmeyen alan içeren yazım bütünüyle reddedilir ve çevrimiçi oyun bozulur.

## Yayınlama

Kurallar konsoldan elle yayınlanır (bu depo Firebase CLI ile dağıtım yapmaz):

1. Firebase konsolu › `hayalet-avcilari` › Realtime Database › **Kurallar** → `database.rules.json`'un tamamını yapıştır →
   **Yayınla**.
2. Firestore Database › **Kurallar** → `firestore.rules`'un tamamını yapıştır → **Yayınla**.
3. Oyunda dene: çevrimiçi oda kur/katıl/oyna, kodlu yedekle/geri yükle, Google ile yedekle/geri yükle/hesabı sil,
   oyun bitince şampiyonlar listesi.

Konsol eski kuralların geçmişini tutar; sorun çıkarsa aynı ekrandan önceki sürüme dönülebilir.

## Sonraki adım (önerilen)

Odaları ve kodlu yedeği gerçekten kişiye bağlamak için oyun açılışta `firebase.auth().signInAnonymously()` yapmalı,
`online.uid` olarak `auth.uid` kullanmalı; kurallar da `players/$uid` için `auth.uid === $uid`, oda silme için
`auth.uid === data.child('hostUid').val()` isteyebilir. Bu bir oyun sürümü (yeni AAB) gerektirir; eski sürümler
girişsiz yazdığı için geçiş döneminde iki kural birlikte desteklenmelidir.
