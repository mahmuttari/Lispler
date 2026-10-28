# Küçük uygulamalar — Google Play'e ilk yayın (dördü tek tarayıcı oturumunda)

Drive'daki `PROGRAM/KUCUK_UYGULAMALAR` klasöründen gelen dört uygulama **Poyraz Workshop** hesabından (kapalı test
zorunluluğu yok → doğrudan **Üretim**) yayınlanır. Reklam hesabı **AdMob, mahmuttari@gmail.com** (yayıncı
`pub-2417242373034448`). Düzen İz Haritası'nınkiyle aynıdır
([`../iz-haritasi/magaza/PLAY-YAYIN.md`](../iz-haritasi/magaza/PLAY-YAYIN.md)); burada dört uygulamanın tarayıcı işleri
**tek oturumda ve aynı sırayla** yapılır. Her uygulamanın kendi sabit bilgileri (ad, paket, kategori, metinler, form
cevapları) kendi `magaza/PLAY-YAYIN.md` dosyasındadır:

| Uygulama | Klasör | Paket | Sabit bilgiler |
|---|---|---|---|
| Unitica | `unitica/` | `com.poyrazworkshop.unitica` | [`unitica/magaza/PLAY-YAYIN.md`](../unitica/magaza/PLAY-YAYIN.md) |
| Calqora | `calqora/` | `com.poyrazworkshop.calqora` | [`calqora/magaza/PLAY-YAYIN.md`](../calqora/magaza/PLAY-YAYIN.md) |
| Kıble Bul | `kible-bul/` | `com.poyrazworkshop.kiblebul` | [`kible-bul/magaza/PLAY-YAYIN.md`](../kible-bul/magaza/PLAY-YAYIN.md) |
| Ölçü Kutusu (Measure Box; özgün adı Smart Measure) | `smart-measure/` | `com.poyrazworkshop.smartmeasure` | [`smart-measure/magaza/PLAY-YAYIN.md`](../smart-measure/magaza/PLAY-YAYIN.md) |

- **Tarayıcı işleri** (AdMob uygulamaları ve reklam birimleri, Play'de uygulamaları oluşturma, ilk AAB'ler, Uygulama
  içeriği formları, abonelikler, hizmet hesabı izni) → bilgisayardaki **Claude Code** (`claude --chrome`).
- **API işleri** (mağaza metinleri, görseller, Veri güvenliği, sonraki AAB'ler, incelemeye gönderme) → bulut oturumu,
  GitHub Actions ile (`<klasör>/play-istek.txt` → `.github/workflows/play-<anahtar>.yml` → `android/play.mjs`).

Önce **bu dalın PR'ı main'e birleştirilir** (gizlilik sayfaları GitHub Pages'te yalnız main'den yayınlanır). Sonra
kullanıcı bilgisayardaki oturuma yalnız şunu yazar:

> Lispler deposunun main dalını al ve `docs/kucuk-uygulamalar-play.md`'deki "Talimat" bölümünü uygula.

## Onay paketi (oturumun başında kullanıcıya gösterilir)

Metodolojinin D1 kuralı: geri dönüşü zor her kalem için kullanıcının **adıyla anan** bir onay satırı gerekir. Oturum
başında aşağıdaki satır gösterilir; kullanıcı çıkarmak istediği kalemleri silip yazar. Onaylanmayan kalemde durulur.

> ONAY: Unitica, Calqora, Kıble Bul ve Ölçü Kutusu için şu kutuları işaretlemene ve şu düğmelere basmana onay
> veriyorum: 1. AdMob'da dört uygulamanın ve reklam birimlerinin oluşturulması; AB tüzüğü mesajının "Onayla" ve
> "Yayınla"sı; 2. reklam kimliklerinin main'e push'u; 3. Play "Uygulama oluştur" formlarındaki beyan kutuları ve
> "Uygulama oluştur" düğmesi (dört kez); 4. Play Uygulama İmzalama'nın Google'ın anahtarıyla kabulü ve ilk paketlerin
> TASLAK olarak kaydı; 5. hizmet hesabına dört uygulamanın izinlerinin verilmesi; 6. Uygulama içeriği beyanlarının
> uygulamaların `aciklamalar.md` tablolarındaki cevaplarla kaydı, IARC Kullanım Şartları kutusu ve anket gönderimi;
> 7. `fiyatlandirma.md`'deki fiyatlarla `adfree` aboneliklerinin oluşturulması ve etkinleştirilmesi. Bunun dışında hiçbir
> şartı kabul etme, ücretli seçenek alma, incelemeye gönderme; başka bir kutu çıkarsa dur ve sor.

İncelemeye gönderme bu paketin içinde **değildir**: mağaza metinleri ve görseller yüklendikten sonra bulut oturumu ayrıca
sorar.

## Talimat (bilgisayardaki Claude Code, `claude --chrome`)

Kurallar:
- Şifre, kart, IBAN, kimlik bilgisi girme; o alanları kullanıcıya bırak. Ödeme yapma.
- Yasal beyan kutuları, "Uygulama oluştur", kullanıcı izinleri, Play App Signing kabulü, AdMob mesajını yayınlama,
  fiyat etkinleştirme, **main'e push**, **incelemeye gönderme / yayınlama** ve silme gibi geri dönüşü zor adımlar yalnız
  yukarıdaki onay paketiyle yapılır; pakette olmayan bir kutu çıkarsa dur ve sor.
- Beklenmedik bir kutu, şart ya da güvenlik engeli çıkarsa başka yoldan deneme; dur ve sor.
- Play Console'u **tek sekmede** aç ve sekmeyi önde tut (arka sekmede yazı gitmez, diyalog açılmaz). Koordinat değil
  öğe başvurusuyla tıkla.
- Her adımın sonunda neyin kaydedildiğini ve neyin kullanıcıya kaldığını kısaca Türkçe özetle.

### 0. Dosyalar
```
git checkout main && git pull
```
Şu dört adres açılmalı; açılmıyorsa dur, kullanıcıya söyle (PR birleştirilmemiş ya da Pages yayını bitmemiştir):
`https://mahmuttari.github.io/Lispler/unitica/gizlilik.html`, `…/calqora/gizlilik.html`, `…/kible-bul/gizlilik.html`,
`…/smart-measure/gizlilik.html`.

### 1. AdMob: dört uygulama, reklam birimleri, AB onay mesajı
https://admob.google.com → **mahmuttari@gmail.com** hesabı (yayıncı kimliği `pub-2417242373034448` olmalı).
Her uygulama için (sırayla Unitica, Calqora, Kıble Bul, Ölçü Kutusu; AdMob'da `Smart Measure` adıyla açıldı):
1. **Uygulamalar → Uygulama ekle** → Platform **Android** → "Uygulama desteklenen bir mağazada listeleniyor mu?"
   **Hayır** → uygulama adı (uygulamanın `PLAY-YAYIN.md` tablosundaki telefondaki ad) → ekle. Uygulama kimliğini not et
   (`ca-app-pub-2417242373034448~…`).
2. **Reklam birimleri → Reklam birimi ekle**: **Banner** (`<Ad> banner`) ve **Geçiş reklamı** (`<Ad> geçiş`), ayarlar
   varsayılan (sıklık sınırı gerekmez; uygulama kendisi sınırlar). Kimlikleri not et.
3. Uygulamanın `PLAY-YAYIN.md`'sinde AdMob için ek bir adım varsa (ör. Kıble Bul'da hassas reklam kategorilerini
   engelleme) onu da yap.

Sonra **Gizlilik ve mesajlaşma → Avrupa tüzükleri** → yeni mesaj: uygulamalar **dördü**, diller uygulamaların
Avrupa dilleri: **Türkçe, İngilizce, Almanca, Fransızca, İspanyolca, İtalyanca, Portekizce** (Unitica, Calqora ve
Kıble Bul bu dillerde; onay formu kullanıcıya kendi dilinde çıkar), her uygulamanın gizlilik politikası adresi,
seçenekler varsayılan → kullanıcıya göster, **onayla Yayınla**. (Bu mesaj olmadan AB, Birleşik Krallık ve İsviçre'de
onay formu çıkmaz, oralarda reklam kısıtlı kalır.)

Dört uygulamanın `android/gradle.properties` dosyalarındaki üç satırı gerçek kimliklerle değiştir:
```
ADMOB_APP_ID=ca-app-pub-2417242373034448~…
ADMOB_BANNER_ID=ca-app-pub-2417242373034448/…
ADMOB_INTERSTITIAL_ID=ca-app-pub-2417242373034448/…
```
Sonra her klasörde `node araclar/kimlik.mjs` çalıştır (web tarafındaki `www/js/reklam-kimlik.js`'i yazar) ve
`node --test <klasör>/test/*.test.mjs` yeşil olsun. Kimlikler gizli değildir (her APK'da açıkça durur). Tek commit:
`Küçük uygulamalar: AdMob kimlikleri`; onay paketiyle `git push origin main`.

GitHub → Actions → **Android (Unitica)**, **Android (Calqora)**, **Android (Kıble Bul)**, **Android (Smart Measure)**
bu commit için yeşil bitmeli; günlükte `surum.txt` satırı `admob=ca-app-pub-2417242373034448~…` olmalı ("AdMob TEST
kimlikleriyle derlendi" uyarısı **olmamalı**). Her koşunun **Artifacts** bölümünden `<Ad>-aab`'yi indir, zip'ten
`.aab`'yi çıkar (`Unitica.aab`, `Calqora.aab`, `KibleBul.aab`, `SmartMeasure.aab`).

### 2. Play Console: dört uygulamayı oluştur
**Smart Measure'ın mağaza adı Ölçü Kutusu oldu (28 Ekim 2026):** Play'de "Smart Measure" adında, aynı yöntemle
çalışan, 10 milyondan fazla indirilmiş başka bir uygulama olduğu için (`smart-measure/magaza/DEGERLENDIRME.md` §0)
Play'de **"Ölçü Kutusu – Terazi, Cetvel"** adıyla oluşturulur (en-US listesi "Measure Box – Level & Ruler"). Bu adla
derlenmiş paket `Android (Smart Measure)` iş akışının bu değişiklikten sonraki koşusundan alınır (telefondaki ad
"Ölçü Kutusu" / "Measure Box" görünmeli); "Smart Measure" adıyla Play'de uygulama oluşturma.

https://play.google.com/console → **Poyraz Workshop** → her uygulama için "Uygulama oluştur": ad (mağaza adı, tablodan),
varsayılan dil **Türkçe – tr-TR**, **Uygulama**, **Ücretsiz**. Beyan kutuları onay paketiyle işaretlenir; sonra
"Uygulama oluştur". Paket adı ilk pakette belirlenir ve bir daha değişmez: tablodaki `com.poyrazworkshop.…` olmalı.

### 3. İlk paketler (üretim, taslak)
Her uygulama → Test ve yayınla → **Üretim** → Ülkeler/bölgeler: **tümü** → "Yeni sürüm oluştur":
- Uygulama imzalama sorulursa Google'ın oluşturduğu anahtar (varsayılan) → onay paketiyle.
- App bundle: 1. adımın sonundaki `.aab`. Dosya penceresini kullanamazsan kullanıcı seçer.
- Paket adı ve sürüm tablodaki gibi görünmeli (versionCode 1). Sürüm notu (tr-TR): `<klasör>/magaza/surum-notu.txt`.
- "Sonraki" → yalnız **Kaydet**. İncelemeye GÖNDERME.

### 4. Hizmet hesabına dört uygulamayı da ver
Play Console ana menü → **Kullanıcılar ve izinler** → `notdefteri-play@handcalcbook.iam.gserviceaccount.com` →
"Uygulama ekle" → **Unitica, Calqora, Kıble Bul, Ölçü Kutusu** → İz Haritası'ndaki izinlerin aynısı:
- Uygulama bilgilerini görüntüleme ve toplu raporları indirme
- Mağaza girişini yönetme
- Üretime sürüm yayınlama, cihaz hariç tutma ve Play Uygulama İmzalama'yı kullanma
- Test kanallarına sürüm yayınlama
- **Taslak uygulamaları düzenleme ve silme** (Hayalet Avcıları'nda bu izin olmadan API düzenlemesi 403 verdi)

Onay paketiyle kaydet. (Davetten sonra API bir süre 403 verebilir.)

### 5. Mağaza ayarları ve Uygulama içeriği (her uygulama)
Mağaza ayarları: kategori, etiketler (listede bulunan en uygun birkaçı; yoksa boş), e-posta, web sitesi (uygulamanın
`aciklamalar.md` "Ortak" tablosundan) → Kaydet. Mağaza metni ve görselleri bulut oturumu API ile yükler.

Politika → Uygulama içeriği: uygulamanın `aciklamalar.md` › "Google Play – Uygulama içeriği formları" tablosu.
**Veri güvenliği**: sağ üstteki "CSV'den içe aktar" ile `<klasör>/magaza/veri-guvenligi.csv`; dosya penceresi
kullanılamazsa form tablodaki yanıtlarla elle doldurulur (ikisi aynıdır). Hesap oluşturma sorusu CSV'de yoktur:
"Uygulamam kullanıcıların hesap oluşturmasına izin vermiyor". Beyanları göndermeden önce kullanıcıya özetle.

### 6. Abonelikler (her uygulama)
Para kazanma → Ürünler → **Abonelikler** → "Abonelik oluştur": ürün kimliği **`adfree`**, ad ve açıklama uygulamanın
`magaza/fiyatlandirma.md` dosyasından; temel planlar **`monthly`** (aylık, otomatik yenilenen) ve **`yearly`** (yıllık,
otomatik yenilenen). Fiyatlar `fiyatlandirma.md`'den; **etkinleştirmeden önce fiyat tablosunu kullanıcıya göster**.
Hesabın ödeme profili yoksa ya da bir uyarı varsa dur ve kullanıcıya sor.

### 7. Bulut oturumuna devret
Kullanıcıya şunu yazdır: "Küçük uygulamalar Play kurulumu tamam." Bulut oturumu her uygulamanın `play-istek.txt`'si
ile sırasıyla `durum` → `magaza uygula` → `gorsel uygula` → `veriguvenligi` çalıştırır; eksik kalan bir şey yoksa
incelemeye gönderme kararını kullanıcıya sorar (`yukle yayinla uygula`: Play'deki taslağı "tamamlandı" yapar).

### 8. Yayından sonra (AdMob)
Her uygulama Play'de yayınlanınca AdMob → Uygulamalar → uygulama → **Mağaza ekle** ile Play girişine bağlanır; o zamana
kadar AdMob "sınırlı reklam sunumu" uygular.

## Neden ilk adımlar tarayıcıda?

Google Play Developer API yeni uygulama **oluşturamaz** ve Console'da hiç paket yüklenmemiş uygulamayı **görmez**
("Package not found"). AdMob'da uygulama ve reklam birimi oluşturmanın da API'si yoktur. Bu yüzden 1-6. adımlar bir kez
tarayıcıda yapılır; sonrası (mağaza metni, görseller, yeni sürümler, incelemeye gönderme) GitHub üzerinden yürür.

## Sonraki sürümler (yalnız GitHub)

1. Klasördeki `www/` ya da Android kodu değişir; `android/app/build.gradle`'da `versionCode` (+1) ve `versionName`;
   `magaza/surum-notu.txt` (ve `diller/<dil>.md` › "Sürüm notu").
2. Push → `<anahtar>-android.yml` imzalı AAB'yi derler → `play-istek.txt`'ye `yukle uygula`, kullanıcının onayıyla
   `yukle yayinla uygula`. AAB elle hiçbir yere taşınmaz.
