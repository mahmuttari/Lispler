# Hayalet Avcıları — Arkadaş ekleme ve oyuna davet (tasarım)

- **Tarih:** 23 Ekim 2026
- **Durum:** Kullanıcı onayladı (23 Ekim 2026: "Belgeyi onaylıyorum, uygulamaya geç"); uygulandı, 3.13.0 (45). Uygulama planı `docs/superpowers/plans/2026-10-23-hayalet-arkadaslar.md`
- **Hedef sürüm:** 3.13.0 (versionCode 45)
- **Proje:** `hayalet-avcilari/` (Capacitor 8, HTML5 canvas, Firebase Realtime Database + Anonymous Auth)

## 1. Amaç

Kullanıcının isteği: *"arkadaş ekleme olsun, arkadaşları oyuna davet etme olsun"*. Birlikte oynayan oyuncular birbirini
arkadaş olarak ekleyebilmeli, oyun açıkken arkadaşının çevrimiçi olduğunu görüp onu kendi odasına tek dokunuşla
çağırabilmeli.

**Başarı ölçütleri**

1. İki telefon, kodla ya da odadaki ➕ ile 30 saniyede arkadaş olur.
2. Davet 1–2 saniyede gelir; davet edilen tek dokunuşla (gerekirse bir onayla) odaya girer.
3. Yabancı ya da engellenmiş biri istek ve davet gönderemez; bunu emülatördeki kural testleri kanıtlar.
4. Oyun içinde kare hızı düşmez (mevcut çevrimiçi ve 6 kişilik testler arkadaş dinleyicileri açıkken geçer).

## 2. Kullanıcının kararları

| Konu | Karar |
|---|---|
| Davet ne zaman gelir | **Yalnız oyun açıkken**; telefon bildirimi (push) yok |
| Nasıl eklenir | **6 karakterli arkadaş kodu** ve odada birlikte oynanan oyuncunun yanındaki **➕** |
| Arkadaşlık modeli | **İstek + kabul**; reddet, arkadaşlıktan çıkar ve engelle var; yabancı ekleyemez, davet gönderemez |
| Yaklaşım | **A: Realtime Database + kurallar** (sunucu kodu yok) |
| Firebase planı | Proje **Blaze** planında (kullanıcı bildirdi): 100 bağlantı sınırı yok, bağlantı yönetimi sade tutulur |
| Ana menü | "Online Oyna"nın yanında kare **👫** düğmesi (rozetli) + Online ekranında büyük "👫 Arkadaşlar" |
| Bölüm 1–5 | Önerilen seçeneklerle onaylandı (çevrimiçi durum var, "yeni kod" var, kodla ekleme onaysız, oyun sırasında davet şeridi var, arka planda "çevrimdışı") |

Sohbette sunulan ve itiraz edilmeyen varsayımlar: en çok 50 arkadaş; davet 5 dakika geçerli; çevrimiçi durumu yalnız
arkadaşlar görür; arkadaşlık Firebase hesabına bağlıdır; "Hesabı Sil" arkadaşlık verisini de siler.

## 3. Yaklaşım

Bütün veri oyunun zaten kullandığı Realtime Database'de (`hayalet-avcilari-default-rtdb`) yeni kök düğümlerde durur;
istemci yüklü SDK'yla (compat 10.13.0) okur ve yazar. Tutarlılığı sunucudaki kurallar sağlar: kabul işlemi iki tarafın
arkadaş kaydını tek atomik çok yollu yazımla (`update()`) yazar ve kural, karşı tarafın isteğinin gerçekten var
olduğunu denetler. Engel listesi sahibinden başkasına okunamaz; kurallar onu yine de okuyabilir. Çevrimiçi durum
RTDB'nin `onDisconnect` özelliğiyle tutulur.

Seçilmeyenler: **Cloud Functions** (sunucu kodu; Firebase CLI ile dağıtım ister, bu depo kuralları konsoldan elle
yayınlıyor; getireceği telefon bildirimi ve sunucuda hız sınırı şu an istenmiyor) ve **Firestore + RTDB** (iki veritabanı,
oyunun Firestore'a REST ile yazması yüzünden canlı dinleme yok).

## 4. Veri modeli ve kurallar

### 4.1 Düğümler

```
friendCodes/{KOD}          { uid, name }                    kod → oyuncu; tek kod okunur, liste okunamaz
users/{uid}/               yalnız sahibi okur
  code                     "K7MP2Q"                          benim arkadaş kodum
  friends/{arkadaşUid}     { name, at }                      arkadaşlarım (name: kabul anındaki ad, yedek)
  requests/{gönderenUid}   { name, at }                      bana gelen istekler
  sent/{alıcıUid}          { name, at }                      gönderdiğim, yanıt bekleyen istekler
  invites/{gönderenUid}    { room, roomName, name, at }      bana gelen davet (her arkadaştan en çok bir)
  blocks/{engellenenUid}   { name, at }                      engellediklerim
presence/{uid}             { name, charKey, costumeIdx, state, at }   yalnız arkadaşlarım okur; state: on | room | off
```

- Kimlik `auth.uid` (anonim ya da Google'a yükseltilmiş). Biçim mevcut kurallardaki gibi: 3–40 karakter, `A-Za-z0-9_`.
- Kod alfabesi oda kodlarınınki: `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (karışan I, L, O, 0, 1 yok), tam 6 karakter,
  `crypto.getRandomValues` ile üretilir. Ekranda `#K7MP2Q` biçiminde gösterilir (yedek kodu `ABC-D23` ile karışmasın
  diye tire yok, başta `#` var); girişte `#`, boşluk ve küçük harf kabul edilir.
- `at` sunucu saatidir (`ServerValue.TIMESTAMP`); kural ileri tarihi reddeder (`<= now`).
- `name` 1–50 karakter dizgi (oyuncu adı oyunda en çok 14); `roomName` en çok 60; `charKey` en çok 30; `costumeIdx` sayı.

### 4.2 Kurallar (`firebase/database.rules.json`'a eklenecek bölüm)

Mevcut kural düzenine uygun: her alan tür ve uzunluk denetimli, bilinmeyen alan (`$other`) reddedilir.

```json
"friendCodes": {
  "$code": {
    ".read":  "auth != null && $code.matches(/^[A-HJKMNP-Z2-9]{6}$/)",
    ".write": "auth != null && $code.matches(/^[A-HJKMNP-Z2-9]{6}$/) && ((!data.exists() && newData.child('uid').val() === auth.uid) || (data.child('uid').val() === auth.uid && (!newData.exists() || newData.child('uid').val() === auth.uid)))",
    ".validate": "newData.hasChildren(['uid', 'name'])",
    "uid":    { ".validate": "newData.isString() && newData.val() === auth.uid" },
    "name":   { ".validate": "newData.isString() && newData.val().length >= 1 && newData.val().length <= 50" },
    "$other": { ".validate": false }
  }
},

"users": {
  "$uid": {
    ".read":  "auth != null && auth.uid === $uid",
    ".write": "auth != null && auth.uid === $uid && !newData.exists()",
    ".validate": "$uid.length >= 3 && $uid.length <= 40 && $uid.matches(/^[A-Za-z0-9_]+$/)",

    "code": {
      ".write": "auth != null && auth.uid === $uid",
      ".validate": "newData.isString() && newData.val().matches(/^[A-HJKMNP-Z2-9]{6}$/)"
    },

    "friends": {
      "$f": {
        ".write": "auth != null && $f !== $uid && ((auth.uid === $uid && (!newData.exists() || (!data.exists() && root.child('users/' + $uid + '/requests/' + $f).exists()))) || (auth.uid === $f && (!newData.exists() || (!data.exists() && root.child('users/' + $f + '/requests/' + $uid).exists()))))",
        ".validate": "newData.hasChildren(['name', 'at'])",
        "name":   { ".validate": "newData.isString() && newData.val().length >= 1 && newData.val().length <= 50" },
        "at":     { ".validate": "newData.isNumber() && newData.val() <= now" },
        "$other": { ".validate": false }
      }
    },

    "requests": {
      ".indexOn": ["at"],
      "$from": {
        ".write": "auth != null && $from !== $uid && ((auth.uid === $from && (!newData.exists() || (!data.exists() && !root.child('users/' + $uid + '/blocks/' + $from).exists() && !root.child('users/' + $uid + '/friends/' + $from).exists()))) || (auth.uid === $uid && !newData.exists()))",
        ".validate": "newData.hasChildren(['name', 'at'])",
        "name":   { ".validate": "newData.isString() && newData.val().length >= 1 && newData.val().length <= 50" },
        "at":     { ".validate": "newData.isNumber() && newData.val() <= now" },
        "$other": { ".validate": false }
      }
    },

    "sent": {
      "$to": {
        ".write": "auth != null && $to !== $uid && (auth.uid === $uid || (auth.uid === $to && !newData.exists()))",
        ".validate": "newData.hasChildren(['name', 'at'])",
        "name":   { ".validate": "newData.isString() && newData.val().length >= 1 && newData.val().length <= 50" },
        "at":     { ".validate": "newData.isNumber() && newData.val() <= now" },
        "$other": { ".validate": false }
      }
    },

    "invites": {
      ".indexOn": ["at"],
      "$from": {
        ".write": "auth != null && $from !== $uid && ((auth.uid === $from && (!newData.exists() || (root.child('users/' + $uid + '/friends/' + $from).exists() && !root.child('users/' + $uid + '/blocks/' + $from).exists() && root.child('rooms/' + newData.child('room').val() + '/players/' + $from).exists()))) || (auth.uid === $uid && !newData.exists()))",
        ".validate": "newData.hasChildren(['room', 'name', 'at'])",
        "room":     { ".validate": "newData.isString() && newData.val().matches(/^[A-HJKMNP-Z2-9]{6}$/)" },
        "roomName": { ".validate": "newData.isString() && newData.val().length <= 60" },
        "name":     { ".validate": "newData.isString() && newData.val().length >= 1 && newData.val().length <= 50" },
        "at":       { ".validate": "newData.isNumber() && newData.val() <= now" },
        "$other":   { ".validate": false }
      }
    },

    "blocks": {
      "$b": {
        ".write": "auth != null && auth.uid === $uid && $b !== $uid",
        ".validate": "newData.hasChildren(['name', 'at'])",
        "name":   { ".validate": "newData.isString() && newData.val().length >= 1 && newData.val().length <= 50" },
        "at":     { ".validate": "newData.isNumber() && newData.val() <= now" },
        "$other": { ".validate": false }
      }
    },

    "$other": { ".validate": false }
  }
},

"presence": {
  "$uid": {
    ".read":  "auth != null && (auth.uid === $uid || root.child('users/' + $uid + '/friends/' + auth.uid).exists())",
    ".write": "auth != null && auth.uid === $uid",
    ".validate": "newData.hasChildren(['name', 'state', 'at'])",
    "name":       { ".validate": "newData.isString() && newData.val().length >= 1 && newData.val().length <= 50" },
    "charKey":    { ".validate": "newData.isString() && newData.val().length <= 30" },
    "costumeIdx": { ".validate": "newData.isNumber()" },
    "state":      { ".validate": "newData.val() === 'on' || newData.val() === 'room' || newData.val() === 'off'" },
    "at":         { ".validate": "newData.isNumber() && newData.val() <= now" },
    "$other":     { ".validate": false }
  }
}
```

Kuralların dayandığı iki RTDB davranışı (kural testleri ikisini de sınar):

- `root` yazımdan **önceki** veriyi gösterir. Kabul yazımı isteği aynı anda silse de kural isteği görür.
- Çok yollu `update()` bütünüyle uygulanır ya da hiç uygulanmaz; yollardan biri reddedilirse hiçbiri yazılmaz.
  Aynı yazımda iç içe yol (ör. `users/A` ile `users/A/friends/B`) bulunamaz.

### 4.3 Kim neyi yazabilir

| İşlem | Kim | Koşul |
|---|---|---|
| İstek gönder (`users/B/requests/A`, `users/A/sent/B`) | A | A ≠ B; B, A'yı engellememiş; zaten arkadaş değiller; istek yeni |
| Kabul et | B | Tek yazım: `users/B/friends/A` + `users/A/friends/B` + `users/B/requests/A` sil + `users/A/sent/B` sil. Arkadaş kayıtları ancak A'nın isteği varsa yazılabilir |
| Reddet | B | `users/B/requests/A` ve `users/A/sent/B` silinir |
| İptal et | A | `users/B/requests/A` ve `users/A/sent/B` silinir |
| Arkadaşlıktan çıkar | ikisinden biri | İki tarafın kaydı ve aradaki davetler tek yazımda silinir (herkes kendini karşı tarafın listesinden silebilir) |
| Davet (`users/B/invites/A`) | A | B'nin listesinde A var, B engellememiş, A o odada oyuncu; yeni davet eskisinin üzerine yazılır |
| Engelle | B | `blocks/A` yazılır; arkadaşlık (iki taraf), istekler (iki yön), `sent` kayıtları ve davetler (iki yön) aynı yazımda silinir |
| Engeli kaldır | B | `blocks/A` silinir; arkadaşlık geri gelmez |
| Çevrimiçi durum | sahibi yazar | Okuma yalnız sahibine ve arkadaş listesindekilere; arkadaşlık bitince okuma izni kendiliğinden kalkar |
| Kod al / yenile | sahibi | Kod boşsa alınır; doluysa (çakışma) yeni kodla en çok 3 deneme. Eski kod aynı yazımda silinir (yalnız sahibiysem) |
| Hesap silme | sahibi | `users/{uid}`, `presence/{uid}`, kodum ve arkadaşların listesindeki kaydım, gönderdiğim istek ve davetler |

**Kuralların yapamadığı (oyun üstlenir):** saymak. En çok 50 arkadaş; gelen isteklerin en yeni 30'u ve davetlerin en
yeni 10'u gösterilir (`orderByChild("at").limitToLast(…)`). Çok sayıda anonim hesap açan biri çok istek gönderebilir;
buna karşı engelleme ve **🔄 yeni kod** (eski kodla istek gelmez) var.

## 5. Akışlar

1. **Kod.** Arkadaş sistemi ilk açıldığında `users/{uid}/code` okunur; yoksa ya da `friendCodes/{kod}.uid` bende değilse
   yeni kod alınır (`friendCodes/{YENİ}`, `users/{uid}/code` tek yazımda). Kod sunucuda saklandığı için Google ile
   girişte başka cihazda da aynı kalır. Avcı adı değişince (`submitName`) koddaki ve `presence`'teki ad güncellenir.
2. **Kodla ekle.** `#K7MP2Q` yazılır (`#` ve küçük harf fark etmez) → `friendCodes/{KOD}` okunur → istek hemen gider:
   "📨 Ayşe'ye istek gönderildi". Özel durumlar: kendi kodu ("Bu senin kodun"), kod yok ("Kod bulunamadı"), zaten arkadaş
   ("Zaten arkadaşsınız"), istek zaten gitmiş ("İstek zaten gönderildi"), 50 arkadaş ("Listen dolu"), engellediğim kişi
   (önce engeli kaldırmam istenir). Karşı taraf beni önceden eklemişse istek yerine onun isteği kabul edilir: "Ayşe de
   seni eklemiş, artık arkadaşsınız!" (aynı anda birbirine istek gönderen ikisi de böylece arkadaş olur). Yanlış kişiye
   giden istek "Gönderilenler"den iptal edilir.
3. **Odadan ➕.** Lobide diğer oyuncuların satır sonunda: arkadaş değilse **➕**, istek gitmişse **⏳**, arkadaşsa **👫**.
   ➕ kodla eklemeyle aynı işi yapar (uid oda kaydından gelir). Tur bitince herkes lobiye döndüğü için birlikte oynanan
   oyuncu orada eklenir.
4. **Gelen istek.** Uygulama açıkken "👫 Ayşe arkadaşlık isteği gönderdi" bildirimi; 👫 rozetinde sayı. Arkadaşlar
   ekranında her istekte **✓ Kabul**, **✕ Reddet**, **🚫 Engelle**. 50 arkadaşa ulaşılmışsa kabul "Listen dolu" der. Sınır
   gönderirken ve kabul ederken denetlenir; kurallar saymadığı için, bekleyen isteklerim sonradan kabul edilirse liste
   50'yi az farkla aşabilir (liste yine gösterilir).
5. **Çıkar / Engelle.** İkisi de onay ister (`confirm`). Ekranın altındaki kapalı **Engellenenler** listesinden engel
   kaldırılır.
6. **Davet gönder.** Lobide ve çevrimiçi oyunun ⏸ Menü ekranında **📨 Davet et**: arkadaş listesi küçük pencerede açılır;
   önce 🟢 çevrimiçi, sonra 🎮 başka odada olanlar; ⚪ çevrimdışı ve zaten bu odada olanlar soluk ve seçilemez. Oda doluysa
   düğme pasif. Aynı arkadaş 30 saniyede bir davet edilebilir; gönderilince satır "✓ Gönderildi" olur.
7. **Davet al.** Hangi ekranda olunursa olsun üstte ince şerit: "📨 Ayşe seni çağırıyor · Ayşe'nin Odası **[Katıl] [✕]**";
   birden çok davette en yenisi. Sunucu saatine göre (`sunucuSimdi()` − `at`) 5 dakikadan eski ya da artık arkadaş olmayan
   birinden gelen davet gösterilmez ve silinir.
   **✕** daveti sessizce siler. **Katıl**: davet silinir; tek kişilik oyun sürüyorsa onay sorulur ve oyun normal biter gibi
   kapanır (kazançlar kasaya eklenir, skor kaydedilir: `oyunSonu`); başka bir odadaysa "Bu odadan ayrılıp geçilsin mi?"
   sorulur (`odadanCik`); sonra mevcut `joinRoom` (oyun sürüyorsa hemen katılır; "Oda dolu" / "Oda bulunamadı" bugünkü
   gibi).

## 6. Bağlantı ve çevrimiçi durum

- Anonim giriş (ya da Google oturumu) hazır olunca oyun dinlemeye başlar: `users/{uid}/requests` (en yeni 30),
  `users/{uid}/invites` (en yeni 10), `users/{uid}/friends`, `users/{uid}/sent` ve her arkadaşın `presence/{f}` kaydı
  (en çok 50). Dinleyiciler yalnız değişikliği indirir.
- Kendi durumunu yazar: menüde `on`, bir odadayken (lobi ya da oyun) `room`; `onDisconnect().update({state: "off", at})`
  kurulur. Bağlantı geri gelince (`.info/connected`) durum ve kopma işlemi yeniden kurulur.
- Uygulama arka plana geçince (`document.hidden`) `off`, öne gelince yeniden `on`/`room` yazılır; bağlantı kapatılmaz
  (oda düzeni bozulmasın). Kopma ani olursa sunucunun fark etmesi biraz sürebilir; bu arada arkadaşa 🟢 görünebilir
  (davet yine 5 dakika geçerli).
- Kimlik değişince (Google'dan çıkış, hesap silme, kullanılmış Google hesabına geçiş) dinleyiciler kapatılıp yeni
  kimlikle yeniden kurulur.
- Bir arkadaşın `presence` dinleyicisi izin hatası verirse (arkadaşlık bitti) o arkadaş listeden düşer.

## 7. Arayüz

```
ANA MENÜ                          👫 ARKADAŞLAR (yeni ekran: screen-friends)
[▶ OYNA]                          ┌ Kodun: #K7MP2Q  📋 ┐ [🔄]
[👥 Karakterler] [🛒 Mağaza]       Arkadaşına bu kodu ver. Yedek
[🏆 Şampiyonlar]                   kodunu (Hesap) kimseyle paylaşma.
[🌐 Online Oyna] [👫²]             [#______] [➕ Ekle]
                                  📬 İstekler (2)
LOBİ                                👤 Ayşe        [✓] [✕] [🚫]
 👑 Kiki (Sen)      ✓             👫 Arkadaşların (3/50)
 Mila      [👫]     ⏳              🟢 Can   · Çevrimiçi   [⋯]
 Can       [➕]     ✓              🎮 Deniz · Odada       [⋯]
 Deniz     [⏳]     ⏳              ⚪ Ece   · Çevrimdışı  [⋯]
[📨 Davet et]                        (⋯ → Çıkar · Engelle)
[✓ HAZIRIM]                       ▸ Gönderilenler (1)   [✕ İptal]
                                  ▸ Engellenenler (1)   [Kaldır]
                                  🔐 Arkadaşların kaybolmasın:
                                     Google ile giriş yap ›
```

- **Ana menü:** "🌐 Online Oyna"nın yanına kare **👫** düğmesi (`aria-label`: Arkadaşlar); bekleyen istek + davet sayısı
  kırmızı rozet. Menü yüksekliği değişmez. Online ekranına büyük "👫 Arkadaşlar" düğmesi.
- **Arkadaşlar ekranı:** kod kartı (dokununca kopyalanır), 🔄 yeni kod (onaylı), kodla ekleme kutusu, İstekler, Arkadaşlar
  (karakter simgesi `presence`'ten; ad önce `presence.name`, yoksa kayıttaki ad; sıra: 🟢, 🎮, ⚪, her grupta ada göre),
  açılır Gönderilenler ve Engellenenler.
  Boşken: "Henüz arkadaşın yok. Kodunu paylaş ya da odada ➕'ya dokun." Google girişi satırı yalnız anonim oyuncuya;
  dokununca Hesap ekranı. Kurallar yayınlanmamışsa ya da bağlanılamıyorsa üstte "⚠ Arkadaşlar şu an kullanılamıyor".
- **Lobi:** satır sonu ➕/⏳/👫 düğmesi; **📨 Davet et** düğmesi; ipucu metni davete göre güncellenir.
- **Davet penceresi:** arkadaş listesi, durum simgesi, satırda 📨 → "✓ Gönderildi".
- **⏸ Menü (çevrimiçi):** **📨 Davet et**.
- **Davet şeridi** (`#davet-seridi`): üstte, duraklat düğmesinin altında; oyunu durdurmaz, can ve duraklat göstergelerini
  kapatmaz; menülerde de aynı yer.
- Bütün yeni metinler `t("…")` ile; 5 dile çevrilir (`araclar/sozluk.mjs yaz`). Kod kutusunun yer tutucusu `#______`
  (çeviri anahtarına girmesin diye harf içermez).

## 8. Kod yapısı

- **Yeni dosya `www/arkadaslar.js`:** arkadaş sisteminin bütün mantığı (kod, istek, kabul, çıkar, engel, davet,
  çevrimiçi durum, dinleyiciler) ve ekranlarının çizimi. `game.js`'ten yalnız ortak yardımcıları kullanır (`fbDb`,
  `fbKullanici`, `rtdb`, `sunucuZamani`, `online`, `save`, `t`, `showToast`, `showScreen`, `escapeHtml`,
  `karakterSimgesi`, `joinRoom`, `odadanCik`, `oyunSonu`). `index.html`'de `game.js`'ten sonra yüklenir.
- **`game.js`'e kancalar:** `init` (oturum hazır olunca `sosyalBaslat`), oturum değişimi (`onAuthStateChanged`),
  `renderLobby` (satır düğmesi ve 📨), `enterLobby` / `odadanCik` / `odaKapandi` (durum `room` / `on`), `pauseGame`
  (📨), `submitName` (ad), `deleteAccountGoogle` (arkadaşlık verisinin silinmesi, Firebase hesabından önce),
  `refreshMenu` (rozet).
- **`index.html` / `style.css`:** `screen-friends`, davet penceresi, `#davet-seridi`, menüdeki kare düğme ve rozet.
- **`araclar/anahtarlar.mjs`:** taranan dosya listesine `arkadaslar.js` eklenir.

## 9. Gizlilik, hesap silme, sınırlar

- Kimse başkasının arkadaş listesini, isteklerini, gönderdiklerini, davetlerini ya da engel listesini göremez. Çevrimiçi
  durumu yalnız arkadaşlar görür; içinde ad, karakter, kostüm ve on/room/off dışında bir şey yok (oda kodu durumda yok,
  yalnız davette). Kodu bilen yalnız adı görür ve istek gönderebilir.
- **Hesabı Sil:** önce başkalarındaki izlerim (arkadaşların listesindeki kaydım, gönderdiğim istekler ve davetler) tek
  yazımda, sonra kendi düğümlerim (`users/{uid}`, `presence/{uid}`, `friendCodes/{kod}`) silinir; ardından Firebase hesabı
  bugünkü gibi silinir.
- **Kimlik sınırı:** arkadaşlık Firebase kimliğine bağlıdır. Google ile giriş yapan oyuncunun arkadaşları cihaz
  değiştirince de gelir; girişsiz oyuncu uygulamayı silip kurarsa ya da daha önce kullanılmış bir Google hesabına geçerse
  arkadaşları eski kimlikte kalır (taşınmaz). Ekran bunu söyler ve anonim oyuncuya Google girişini önerir.
- **Gizlilik politikası** (`app/hayalet-avcilari/gizlilik.html`, Türkçe ve İngilizce bölümler) arkadaş listesi, istek,
  davet ve çevrimiçi durumu anlatacak biçimde güncellenir.
- **Play › Veri güvenliği:** Google'ın tanımında **Kişiler (Contacts)** veri türü "kullanıcı adları gibi sosyal grafik
  bilgisini" de kapsar ([Play Console Yardım: Veri güvenliği](https://support.google.com/googleplay/android-developer/answer/10787469)).
  Arkadaş listesi (istek ve engeller dahil) bu türde beyan edilir: toplanıyor, isteğe bağlı (yalnız arkadaş ekleyen),
  amaç "Uygulama işlevleri", paylaşılmıyor. Çevrimiçi durum ve davetler için "Uygulama etkinliği" altındaki satır
  (aday: "Diğer işlemler") uygulama aşamasında aynı sayfadaki tanımlarla kesinleştirilir. Formu kullanıcı Console'da
  günceller; değişecek satırlar `magaza/aciklamalar.md` › Veri güvenliği formu tablosuna da yazılır.

## 10. Hata durumları

| Durum | Davranış |
|---|---|
| Kurallar konsolda yayınlanmamış | İzin hatası: Arkadaşlar ekranı "⚠ Arkadaşlar şu an kullanılamıyor"; oyunun geri kalanı etkilenmez |
| İnternet yok / 10 sn'de yanıt yok | "⚠ Bağlanılamadı, yeniden dene"; anahtarlar kişi kimliği olduğu için gecikmeli yazım çift kayıt üretmez |
| Aynı anda karşılıklı istek | Her biri karşısının isteğini görünce kabul eder (akış 2) |
| Engellenen kişi istek gönderir | Kural reddeder; ona yalnız "İstek gönderilemedi" denir (engel söylenmez) |
| Kod çakışması | Yeni kodla en çok 3 deneme |
| Davet edilen oda dolmuş / kapanmış | `joinRoom`'un bugünkü "Oda dolu" / "Oda bulunamadı" uyarıları |
| Arkadaş, davetten sonra arkadaşlıktan çıkarmış | Şerit gösterilmez, davet silinir |
| Kimlik değişti | Dinleyiciler yeni kimlikle yeniden kurulur |

## 11. Testler

- **Kural testleri** (`firebase/test/kurallar.test.mjs`, yeni "arkadaşlar" bölümü; her işlem izinli ve izinsiz yoldan):

  | İşlem | Geçmeli | Reddedilmeli |
  |---|---|---|
  | Kod | boştaki kod alınır, tek kod okunur, ad güncellenir, sahibi siler | dolu kodun üstüne, başkası adına kod, kod listesini okuma, girişsiz okuma |
  | İstek | A'dan B'ye istek + `sent` | kendine, engelliyken, zaten arkadaşken, başkası adına; B'nin isteklerini A'nın okuması |
  | Kabul | B tek yazımda iki taraf + istek ve `sent` silme | istek yokken arkadaş kaydı; yabancının yazması; var olan kaydın üzerine yazma |
  | Çıkar | iki taraf birlikte; kişi kendini karşı listeden siler | yabancının silmesi |
  | Engel | tek yazım; sonra istek ve davet reddedilir; engel kalkınca istek yine gider | engel listesini başkasının okuması |
  | Davet | arkadaş ve odadaysa; üzerine yazma | arkadaş değilse, engelliyse, odada değilse, bozuk oda kodu |
  | Çevrimiçi durum | sahibi yazar, arkadaş okur | yabancının okuması; arkadaşlık bitince okuma; başkası adına yazma |
  | Hesap silme | kendi düğümünü ve başkalarındaki izlerini siler | başkasının düğümünü silme |

  Ayrıca: bilinmeyen alan, uzun ad, ileri tarih, bozuk uid reddedilir.
- **Uçtan uca** (`test/arkadas.test.mjs`, emülatörde 3 tarayıcı; `npm run test:arkadas`): kodla ekleme + kabul; odada ➕;
  🟢/🎮/⚪ geçişleri ve arka planda ⚪; davet şeridi ve Katıl ile aynı odaya geçiş; tek kişilik oyun sırasında gelen davet
  (onay → kazançlar kaydedilir → odada); engelleme ve çıkarma; hesap silindikten sonra arkadaşın listesinde kayıt kalmaması;
  kurallar yüklenmemişken Arkadaşlar ekranının uyarı verip oyunun geri kalanının çalışması; sayfa hatası yok.
- **Mevcut testler:** `cevrimici.test.mjs` ve `alti.test.mjs`'te oyuncular oyun başlamadan karşılıklı arkadaş yapılır
  (emülatöre doğrudan yazılarak); kare hızı ve senkron sınamaları arkadaş dinleyicileri açıkken geçmeli.
- **Dil testi** (`test/dil.test.mjs`): dolu arkadaş listesi, davet penceresi, menü üstünde ve oyun üstünde davet şeridi;
  6 dil, 390 ve 340 px. Ekran görüntüleri TR 390 ve AR 340'ta gözle denetlenir.

## 12. Yayın sırası

1. **Kurallar** — kullanıcı Firebase konsolunda yayınlar (Realtime Database › Kurallar → `database.rules.json`'un
   tamamı → Yayınla). 3.12.2'nin `maxPlayers` 2–6 değişikliği önceden yayınlanmadıysa bu yayına girer. Kurallar
   yayınlanmadan uygulama çıkarsa yalnız arkadaş özelliği "kullanılamıyor" der.
2. **Gizlilik politikası** — GitHub Pages yalnız `main` dalından yayınlar (`.github/workflows/pages.yml`): değişiklik
  `main`'e birleştirme ister; bu adım ancak kullanıcı onaylarsa PR ile yapılır.
3. **Uygulama 3.13.0 (45)** — CI derler; Play'e gönderme kullanıcının açık onayıyla (`play-istek.txt`).
4. **Play Console › Veri güvenliği** — kullanıcı günceller; değişecek satırlar ona yazılır.

## 13. Kapsam dışı

Telefon bildirimi (push), sohbet, adla arkadaş arama, davetsiz "arkadaşının odasına katıl", Play Games arkadaş listesi,
arkadaş önerisi, profil sayfası, sunucu tarafı hız sınırı.
