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

## Durum (20 Kasım 2026)

Dört uygulama AppGallery Connect'te oluşturuldu ve incelemeye gönderildi: Kıble Bul (App ID 119881689, 1.2.0), Calqora
(119883831, 1.1.0), Unitica (119884049, 1.4.0), İz Haritası (119889915, 1.1.0). APK'lar tarayıcıdan, **Play'deki imzalı
APK'larla** (Poyraz Workshop yükleme anahtarı) yüklendi.

- **İmza:** AppGallery'deki güncellemeler de aynı anahtarla imzalı olmalı. Bu depodaki derlemelerin `*-apk` artifact'ları
  (veya Play'e giden APK'lar) doğrudur. `derle.sh`'yi DWG anahtarıyla kullanmayın: Huawei imza uyuşmazlığı diye reddeder.
- **Güncelleme yolları:** (1) AppGallery Connect'te sürüm › Manage packages › Upload ile APK'yı elle yüklemek;
  (2) Huawei Connect API anahtarı bu deponun secret'larına girilirse `huawei.yml` (`<uygulama> yukle uygula`, sonra `gonder uygula`).
- NetcadDevelop'taki `lispler-huawei.yml` denemesi kullanılmıyor (Actions bütçesi + imza nedeniyle).
- Huawei telefonda Google hizmetleri olmadığı için AdMob reklamı ve Google Play aboneliği çalışmaz.

## Şimdiki düzen: iş NetcadDevelop'tan çalışır, APK orada derlenir

Huawei Connect API anahtarı (`HUAWEI_CONNECT_CLIENT_ID` / `_SECRET`) DWG OfficeZip'in deposu **NetcadDevelop**'ta kayıtlı;
anahtar MARFEN'in Huawei hesabındaki bütün uygulamaları kapsar. Sahip 20 Kasım 2026'da işin oradan çalışmasını seçti.

- Komutlar NetcadDevelop'taki `.github/lispler-huawei-istek.txt`'ye yazılır (yalnız `claude/lispler-huawei` dalı);
  oradaki `lispler-huawei.yml` bu depoyu (`claude/huawei-appgallery` dalı) alır.
- GitHub başka deponun artifact'larını indirmeye izin vermediği için `yukle`, APK'yı `huawei/derle.sh` ile kaynaktan derler.
- **İmza:** NetcadDevelop'ta Lispler'in yükleme anahtarı yok; AppGallery APK'ları MARFEN'in DWG OfficeZip anahtarıyla
  (`DWG_KEYSTORE_*`, takma ad `dwgviewer-upload`) imzalanır. AppGallery'deki her güncelleme de aynı anahtarla, aynı yoldan
  derlenmelidir; Play sürümleri Poyraz Workshop anahtarıyla kalır. Huawei ile Play arasında çapraz güncelleme olmaz (normal).
- `apk-al.sh` (artifact'tan alma) anahtar Lispler'e girilirse bu depodaki `huawei.yml` ile kullanılır; o zaman Huawei
  sürümleri Lispler'in anahtarına geçemez (imza değişmez), `derle.sh` aynı DWG anahtarıyla burada da çalıştırılmalıdır.
