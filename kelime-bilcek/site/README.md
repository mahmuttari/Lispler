# Kelime Bilcek — web sitesi (https://kelime-bilcek.web.app)

Play'e verilen tanıtım, gizlilik ve hesap silme sayfaları `kelime-bilcek` Firebase projesinin Hosting sitesinde
yayınlanır. Sayfalarda sahibin adı yoktur; iletişim `poyrazworkshop7@gmail.com`. Kökte `app-ads.txt`
(`google.com, pub-2417242373034448, DIRECT, f08c47fec0942fa0`): AdMob bu dosyayı Play'deki **web sitesi** alanının
alan adının kökünde arar (İz Haritası'nda `mahmuttari.github.io/app-ads.txt` 404 verdiği için doğrulama düşmüştü).

| Dosya | Yayın yolu |
|---|---|
| `index.html`, `gizlilik.html`, `hesap-silme.html`, `legal.css`, `icon-192.png`, `app-ads.txt` | aynı adla kökte |

Yayın: `yayin-istek.txt`'ye `kur` (site yoksa oluşturur), `durum`, `yayinla` yazılıp push edilir →
`.github/workflows/kelime-site-yayini.yml` (önce `site.test.mjs`). Hosting REST API ile, Firebase CLI'sız
(`yayin.mjs`; `hayalet-avcilari/site/yayin.mjs`'in uyarlaması). Roller: [`../firebase/README.md`](../firebase/README.md) › Kurulum.

Yerelde: `node kelime-bilcek/site/yayin.mjs plan` · `node --test kelime-bilcek/site/site.test.mjs`.
