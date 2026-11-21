# Huawei AppGallery

Kıble Bul, Calqora, Unitica ve İz Haritası, MARFEN'in Huawei geliştirici hesabında (Enterprise) yayınlanır. Uygulama kaydı,
mağaza metinleri, görseller, yaş derecelendirmesi, gizlilik etiketleri ve ülkeler AppGallery Connect'te elle girilir.
APK'yı ve incelemeye göndermeyi bu klasördeki araç GitHub Actions'tan yapar. Böylece paketi Huawei'ye geliştiricinin
bağlantısı değil, GitHub'ın sunucusu gönderir.

| Dosya | Görev |
|---|---|
| `uygulamalar.json` | App ID, paket adı, derleme iş akışı ve APK artifact'ı |
| `appgallery.mjs` | Publishing API v2: `durum`, `yukle`, `gonder` |
| `apk-al.sh` | APK'yı son başarılı derlemeden alır; artifact silinmişse derlemeyi yeniden başlatır |
| `istek.txt` | Komutlar. Değişince `.github/workflows/huawei.yml` çalışır |

## Bir kez yapılan kurulum

1. AppGallery Connect › **Users and permissions** › **API key** › **Connect API** › **Create**: ad "Lispler CI",
   proje **N/A**, rol **App administrator**. Pencerede Client ID ve Key görünür.
2. GitHub › Lispler › Settings › Secrets and variables › Actions › **New repository secret**:
   `HUAWEI_CONNECT_CLIENT_ID` (Client ID) ve `HUAWEI_CONNECT_CLIENT_SECRET` (Key).

## Kullanım

`istek.txt`'ye `kiblebul yukle uygula` gibi satırlar yazılıp gönderilir. Sıra: `yukle uygula` → birkaç dakika sonra
`gonder uygula`. Gönderme uygulamayı incelemeye yollar; onaylanınca yayına girer.

Huawei telefonlarda Google hizmetleri yoktur: AdMob reklamı gösterilmez, Google Play aboneliği çalışmaz (üyelik ekranı
"kullanılamıyor" der). Mağaza açıklamalarında Google Play'e değinen cümleler Huawei için çıkarıldı.
