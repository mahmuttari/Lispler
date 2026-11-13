# Kelime Bilcek — Firebase

Proje `kelime-bilcek` (313302601000, Spark planı, kuruluş `mahmuttari-org`). Realtime Database
`kelime-bilcek-default-rtdb` (europe-west1). Giriş: Firebase Authentication › Google.

| Dosya | İş | İş akışı |
|---|---|---|
| [`database.rules.json`](database.rules.json) | Sıkı RTDB kuralları ([`../DENETIM.md`](../DENETIM.md) › K-01, K-02) | — |
| [`test/kurallar.test.mjs`](test/kurallar.test.mjs) | Emülatörde 24 senaryo (oyunun yazımları + saldırılar) | `kelime-firebase-kurallar.yml` |
| [`../test/akis.test.mjs`](../test/akis.test.mjs) | Gerçek oyun kodu iki tarayıcıda, emülatörde (`npm run test:akis`) | `kelime-firebase-kurallar.yml` |
| [`yayin-istek.txt`](yayin-istek.txt) | `durum` / `yayinla` (yayından önce testler koşar) | `kelime-kural-yayini.yml` |
| [`uygulama.mjs`](uygulama.mjs), [`uygulama-istek.txt`](uygulama-istek.txt) | Android uygulaması ve SHA parmak izleri (`durum`, `android ekle`, `sha ekle …`) | `kelime-firebase-uygulama.yml` |

Yerelde: `cd kelime-bilcek/firebase && npm ci && npm test` (Java 21). Bulut oturumunda vekil sunucu emülatöre giden
isteği kestiği için `env -u HTTP_PROXY -u HTTPS_PROXY -u http_proxy -u https_proxy npm test`.

## Veri yolları

| Yol | Okur | Yazar |
|---|---|---|
| `users/{uid}` | yalnız sahibi | sahibi (silme dahil) |
| `users/{uid}/name`, `online`, `categoryPrefs` | girişli herkes | sahibi (ad, `usernames` kaydıyla eşleşmeli) |
| `users/{uid}/stats/*` | sahibi | sahibi, her yazımda en çok +1 |
| `users/{uid}/friends/{f}` | sahibi | sahibi ya da `f` (değer `f`'nin adı) |
| `users/{uid}/invite` | sahibi | davet eden (kendi odası, davet edilen bu kişi) / sahibi siler |
| `users/{uid}/joinRoom` | sahibi | eşleşen odanın kurucusu / sahibi siler |
| `users/{uid}/odalar/{oda}` | sahibi | sahibi (hesap silinince odalar da silinir) |
| `usernames/{ad}` | girişli herkes | boşsa alan; sahibi siler |
| `leaderboard/{uid}` | girişli herkes (`.indexOn: wins`) | sahibi; ad `users/{uid}/name` ile aynı, sayaçlar +1 |
| `matchmaking/queue/{uid}` | girişli herkes | sahibi; herkes silebilir (eşleşmede rakibi alma) |
| `rooms/{oda}` | üyeler; oynanmıyorsa girişli herkes | kurucu, üyeler, boş yere katılan, biten kodu yeniden kullanan, davet edilen (silme) |

## Kurulum (bir kez, kullanıcı — Google Cloud Shell, projenin sahibi olarak)

Kimlik, Play işlerinin anahtarsız Workload Identity hizmet hesabıdır (`android/play-kimlik.env`):

```sh
P=kelime-bilcek
SA=serviceAccount:notdefteri-play@handcalcbook.iam.gserviceaccount.com
gcloud services enable firebase.googleapis.com firebasehosting.googleapis.com firebasedatabase.googleapis.com --project=$P
for R in roles/firebasedatabase.admin roles/firebasehosting.admin roles/serviceusage.serviceUsageConsumer roles/firebase.admin; do
  gcloud projects add-iam-policy-binding $P --member=$SA --role=$R --condition=None
done
```

- `firebasedatabase.admin`: kural okuma/yayınlama (`kelime-kural-yayini.yml`).
- `firebasehosting.admin` + `serviceUsageConsumer`: site (`kelime-site-yayini.yml`; ayrıntı `../site/README.md`).
- `firebase.admin`: Android uygulamasını ve SHA parmak izlerini eklemek için (`kelime-firebase-uygulama.yml`). Geniş bir
  roldür; Android uygulaması ve iki SHA-1 eklendikten sonra kaldırılabilir:
  `gcloud projects remove-iam-policy-binding kelime-bilcek --member=$SA --role=roles/firebase.admin`.

Kuruluş ilkesi (`mahmuttari-org`) başka projenin hizmet hesabına rol vermeyi engellerse komut hata verir; o zaman
durulur ve kullanıcıya sorulur.

## Google ile Giriş için parmak izleri

| Anahtar | SHA-1 | Nereden |
|---|---|---|
| Yükleme anahtarı (Poyraz Workshop, Hayalet/İz ile aynı) | `D0:88:A0:75:77:D1:89:B0:15:D4:A5:88:74:9A:1A:8C:C2:EE:56:99` | `iz-haritasi/magaza/PLAY-YAYIN.md`; `kelime-android.yml` günlüğünde de yazar |
| Play uygulama imzalama anahtarı | ilk AAB yüklendikten sonra | `play-istek.txt` › `imza` (`play-kelime.yml` SHA-1'i yazar) |

İkisi de `uygulama-istek.txt` › `sha ekle …` ile eklenir. Play imzasının SHA-1'i eklenmezse Play'den kurulan uygulamada
Google ile giriş "DEVELOPER_ERROR (10)" verir.
