# Tavla — Firebase

Proje `tavla-online-oyundar` (238721373618; APK'daki eski kurulumdan, sahibi kullanıcı). Giriş: Firebase
Authentication › **Anonim**, **E-posta/Şifre**, **Google** (üçü de açık olmalı). Veri: **Cloud Firestore**.

| Dosya | İş | İş akışı |
|---|---|---|
| [`firestore.rules`](firestore.rules) | Sıkı kurallar ([`../DENETIM.md`](../DENETIM.md) › T-04) | — |
| [`test/kurallar.test.mjs`](test/kurallar.test.mjs) | Emülatörde 13 senaryo (oyunun yazımları + saldırılar) | `tavla-denetim.yml` |
| [`test/akis.test.mjs`](test/akis.test.mjs) | Gerçek oyun kodu iki tarayıcıda: oda, sohbet, şikâyet, engelleme, hesap silme | `tavla-denetim.yml` |
| [`kurallar.mjs`](kurallar.mjs), [`yayin-istek.txt`](yayin-istek.txt) | `durum` / `yayinla` (Rules API; yayından önce testler) | `tavla-kural-yayini.yml` |
| [`uygulama.mjs`](uygulama.mjs), [`uygulama-istek.txt`](uygulama-istek.txt) | `durum`, `android ekle`, `sha ekle …`, `yapilandirma` (google-services.json) | `tavla-firebase-uygulama.yml` |

Yerelde: `cd tavla/firebase && npm ci && npm test && npm run test:akis` (Java 21; akış testi için `cd tavla && npm ci`).
Bulut oturumunda vekil sunucu emülatöre giden isteği kestiği için önüne `env -u HTTP_PROXY -u HTTPS_PROXY -u http_proxy -u https_proxy`.

## Veri yolları

| Yol | Okur | Yazar |
|---|---|---|
| `users/{uid}` | girişli herkes (Efsaneler, arkadaş listesi, sıralama) | sahibi; puan her yazımda ±2, sayaçlar +1; süren sohbet yasağı kısaltılamaz |
| `users/{uid}/friends/{f}` | sahibi | sahibi; `f` kendini silebilir (hesap silme) |
| `users/{uid}/invites/{id}` | sahibi, gönderen | gönderen (sahibi onu engellememişse) / sahibi yanıtlar / ikisi siler |
| `users/{uid}/engellenen/{hedef}` | sahibi | sahibi |
| `names/{ad}` | girişli herkes | boşsa alan (ad = belge kimliği); sahibi siler |
| `friendRequests/{id}` | gönderen, alıcı | gönderen (alıcı onu engellememişse) / alıcı yanıtlar / ikisi siler |
| `rooms/{oda}` | girişli herkes (kod ve hızlı eşleşme araması) | kurucu ve konuk; boş odaya katılan (kurucu onu engellememişse); ikisi siler |
| `rooms/{oda}/messages/{m}` | oda üyeleri | üye, kendi adına, ≤280 karakter, sohbet yasağı yoksa |
| `rooms/{oda}/signaling/{d}` | oda üyeleri | oda üyeleri (WebRTC) |
| `reports/{id}` | **kimse** (yalnız konsol) | girişli herkes yalnız oluşturur |

## Kurulum (bir kez, kullanıcı — Google Cloud Shell, projenin sahibi olarak)

Kimlik, Play işlerinin anahtarsız Workload Identity hizmet hesabıdır (`android/play-kimlik.env`):

```sh
P=tavla-online-oyundar
SA=serviceAccount:notdefteri-play@handcalcbook.iam.gserviceaccount.com
gcloud services enable firebase.googleapis.com firebaserules.googleapis.com firestore.googleapis.com --project=$P
for R in roles/firebaserules.admin roles/serviceusage.serviceUsageConsumer roles/firebase.admin; do
  gcloud projects add-iam-policy-binding $P --member=$SA --role=$R --condition=None
done
```

- `firebaserules.admin`: kural okuma/yayınlama (`tavla-kural-yayini.yml`).
- `firebase.admin`: Android uygulaması, SHA parmak izleri ve google-services.json (`tavla-firebase-uygulama.yml`).
  Geniş bir roldür; uygulama ve iki SHA-1 eklendikten sonra kaldırılabilir:
  `gcloud projects remove-iam-policy-binding tavla-online-oyundar --member=$SA --role=roles/firebase.admin`.

Proje başka bir Google hesabındaysa ya da kuruluş ilkesi başka projenin hizmet hesabına rol vermeyi engellerse komut
hata verir; o zaman durulur ve kullanıcıya sorulur.

## Google ile Giriş için parmak izleri

| Anahtar | SHA-1 | Nereden |
|---|---|---|
| Yükleme anahtarı (Poyraz Workshop) | `D0:88:A0:75:77:D1:89:B0:15:D4:A5:88:74:9A:1A:8C:C2:EE:56:99` | `tavla-android.yml` günlüğü |
| Play uygulama imzalama anahtarı | ilk AAB yüklendikten sonra | `play-istek.txt` › `imza` |

İkisi de `uygulama-istek.txt` › `sha ekle …` ile eklenir, ardından `yapilandirma` yeniden çalıştırılır (Android OAuth
istemcisi google-services.json'a girer). Eklenmezse Play'den kurulan uygulamada Google ile giriş "DEVELOPER_ERROR (10)".

## Moderasyon (şikâyetler)

1. https://console.firebase.google.com → `tavla-online-oyundar` → Firestore → `reports` → `status == yeni` olanlar.
   Kayıtta neden, not, şikâyet edilenin kullanıcı kimliği (`againstUid`), rumuzu ve o odadaki son 20 mesajı vardır.
2. Karar (DSA m.17 düzeni: insan kararı, gerekçeli):
   - **Uyarı/ret:** `status` → `incelendi` (gerekçeyi `karar` alanına yaz).
   - **Sohbet yasağı:** `users/{againstUid}` → `chatBannedUntil` = bitiş zamanı (ms, ör. 30 gün sonrası); kurallar
     istemcinin bunu kısaltmasına izin vermez, sohbet mesajı sunucuda reddedilir.
   - **Uygunsuz rumuz:** `users/{againstUid}.name` → `Misafir`, `names/{eski-ad}` belgesini sil.
   - **Ağır ihlal:** Authentication → kullanıcı → **Devre dışı bırak**.
3. İncelenen şikâyet en çok 1 yıl tutulur (gizlilik politikası § 4), sonra silinir.
