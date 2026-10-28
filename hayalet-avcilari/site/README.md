# Hayalet Avcıları — web sitesi (https://hayalet-avcilari.web.app)

Play'e verilen tanıtım, gizlilik ve hesap silme sayfaları oyunun Firebase projesinin (`hayalet-avcilari`) Hosting
sitesinde yayınlanır. Adres sahibinin adını içermez; Google Ads kampanyasının götürdüğü Play sayfasındaki web sitesi,
gizlilik ve hesap silme bağlantıları buraya gider ([`../reklam/REKLAM-PLANI.md`](../reklam/REKLAM-PLANI.md)).

| Yayın yolu | Kaynak |
|---|---|
| `/`, `/gizlilik.html`, `/hesap-silme.html`, `/icon-192.png` | `app/hayalet-avcilari/` (GitHub Pages kopyası da buradan; kanonik adres web.app) |
| `/legal.css` | `app/legal.css` (sayfalardaki `../legal.css` kökte `/legal.css`e çözülür) |
| `/app-ads.txt` | `android/app/src/main/AndroidManifest.xml`'deki AdMob yayıncı kimliğinden üretilir |

`app-ads.txt` AdMob'un "yetkili satıcı" denetimi içindir. AdMob dosyayı Play'deki **web sitesi** alanının alan adının
kökünde arar. Eski adres `mahmuttari.github.io/Lispler/...` iken kök `mahmuttari.github.io` olduğu için dosya
konamıyordu; web.app'te kökte durur.

## Yayın (GitHub)

`yayin-istek.txt`'ye `durum` ya da `yayinla` yazılıp push edilince `.github/workflows/hayalet-site-yayini.yml` çalışır.
İş akışı önce `site.test.mjs` ve `../reklam/*.test.mjs` testlerini koşar: sayfalarda sahibin adı, kişisel e-posta ya da
github.io adresi varsa, bir bağlantı sitede olmayan bir dosyaya gidiyorsa ya da Play adresleri siteyle uyuşmuyorsa
hiçbir şey yayınlanmaz. Yayın Firebase CLI'sız, Hosting REST API'siyle yapılır (`yayin.mjs`: sürüm aç → gzip özetleri
→ eksik dosyaları yükle → sürümü kapat → yayınla → herkese açık adresten geri oku).

Yerelde: `node hayalet-avcilari/site/yayin.mjs plan` (dosyalar ve özetleri) · `node --test hayalet-avcilari/site/site.test.mjs`.

## Kurulum (bir kez, kullanıcı)

Kimlik, Play işlerinin anahtarsız Workload Identity hizmet hesabıdır (`android/play-kimlik.env`). Hesaba
`hayalet-avcilari` projesinde iki rol verilir, projede Firebase Hosting API'si açılır (açıksa komut bir şey yapmaz).
Google Cloud Shell'de, projenin sahibi olarak:

```sh
gcloud services enable firebasehosting.googleapis.com --project=hayalet-avcilari
gcloud projects add-iam-policy-binding hayalet-avcilari --role=roles/firebasehosting.admin \
  --member=serviceAccount:notdefteri-play@handcalcbook.iam.gserviceaccount.com
gcloud projects add-iam-policy-binding hayalet-avcilari --role=roles/serviceusage.serviceUsageConsumer \
  --member=serviceAccount:notdefteri-play@handcalcbook.iam.gserviceaccount.com
```

İlk `durum` (28 Ekim 2026, koşu 40775392211) rollerin henüz verilmediğini gösterdi: kota başlığı reddedildi, başlıksız
istek hizmet hesabının projesine (`handcalcbook`, 711087488089) düştü ve orada Hosting API'si kapalı çıktı. Rol ve API
yukarıdaki komutlarla `hayalet-avcilari`'de açılınca istekler o projeden gider.

- `firebasehosting.admin`: siteyi okumak ve yeni sürüm yayınlamak. Hosting dışında yetki vermez (oyun verisine,
  kurallara, kimlik doğrulamaya dokunamaz).
- `serviceUsageConsumer`: Hosting API çağrılarının kotası hizmet hesabının projesine (`handcalcbook`) değil oyunun
  projesine yazılsın diye (`x-goog-user-project` başlığı). Verilmezse betik başlıksız dener; o zaman Hosting API'sinin
  `handcalcbook` projesinde de açık olması gerekir.

Hesabı yalnız `mahmuttari/Lispler` deposunun iş akışları kullanabilir (`play-kurulum.sh` › `attribute-condition`).
Roller kaldırılınca bu yol kapanır.

## Sıra (28 Ekim 2026'da hazırlandı)

1. Kullanıcı `poyrazworkshop@gmail.com` hesabını açar. Sayfalar bu adresi gösterir; adres açılmadan site yayınlanmaz ve
   bu dal main'e birleştirilmez (GitHub Pages kopyası da aynı adresi gösterir).
2. Kullanıcı yukarıdaki iki rolü verir.
3. Bulut oturumu `durum` çalıştırır: rol ve site denetlenir. Site daha önce yayınlanmadıysa bütün dosyalar "yok" görünür.
4. `yayinla`. Sonra `play-istek.txt` › `magaza uygula` (Play'deki iletişim e-postası ve web sitesi `aciklamalar.md`'den)
   ve `veriguvenligi uygula` (hesap silme adresi `veri-guvenligi.csv`'den).

Firebase'in ayrılmış yolları (`/__/auth/…`, `/__/firebase/…`) bu yayından etkilenmez; Google ile Giriş aynı çalışır.
