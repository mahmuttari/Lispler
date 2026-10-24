# İz Haritası — Google Play'e ilk yayın

Hesap: **Poyraz Workshop** (Not Defteri ve Hayalet Avcıları ile aynı hesap; kapalı test zorunluluğu yok → doğrudan
**Üretim**). Reklam hesabı: **AdMob, mahmuttari@gmail.com** (yayıncı `pub-2417242373034448`, Hayalet Avcıları ile aynı).
Paket: `com.poyrazworkshop.izharitasi`. Düzen Hayalet Avcıları'nınkiyle aynıdır
([`../../hayalet-avcilari/magaza/PLAY-YAYIN.md`](../../hayalet-avcilari/magaza/PLAY-YAYIN.md)):

- **Tarayıcı işleri** (AdMob uygulaması ve reklam birimleri, Play'de uygulamayı oluşturma, ilk AAB, Uygulama içeriği
  formları, hizmet hesabı izni) → bilgisayardaki **Claude Code** (`claude --chrome`) aşağıdaki talimatla yapar.
- **API işleri** (mağaza metni, görseller, Veri güvenliği CSV'si, sonraki AAB'ler, incelemeye gönderme) → bulut
  oturumu, GitHub Actions ile (`iz-haritasi/play-istek.txt` → `.github/workflows/play-iz.yml` → `android/play.mjs`).

Önce **bu dalın PR'ı main'e birleştirilir** (gizlilik sayfası GitHub Pages'te yalnız main'den yayınlanır). Sonra kullanıcı
bilgisayardaki oturuma yalnız şunu yazar:

> Lispler deposunun main dalını al ve `iz-haritasi/magaza/PLAY-YAYIN.md`'deki "Talimat" bölümünü uygula.

## Sabit bilgiler

| Alan | Değer |
|---|---|
| Uygulama adı (mağaza) | `İz Haritası – AirTag için` (25 karakter; telefondaki ad `İz Haritası`) |
| Paket adı | `com.poyrazworkshop.izharitasi` |
| Varsayılan dil | Türkçe – tr-TR (tek dil; arayüz Türkçe) |
| Uygulama / oyun · fiyat | **Uygulama** · **Ücretsiz** (AdMob reklamı var, satın alma yok) |
| Kategori | **Araçlar** |
| İletişim e-postası | `mahmuttari@gmail.com` |
| Web sitesi | `https://mahmuttari.github.io/Lispler/iz-haritasi/` |
| Gizlilik politikası | `https://mahmuttari.github.io/Lispler/iz-haritasi/gizlilik.html` |
| Hesap silme adresi | yok: uygulamada hesap yok |
| Ülkeler | Tüm ülkeler ve bölgeler (arayüz Türkçe; değerlendirme: [`DEGERLENDIRME.md`](DEGERLENDIRME.md)) |
| Metinler ve form cevapları | [`aciklamalar.md`](aciklamalar.md) |
| Veri güvenliği | [`aciklamalar.md` › Veri güvenliği formu](aciklamalar.md#veri-güvenliği-formu); CSV [`veri-guvenligi.csv`](veri-guvenligi.csv) |
| Görseller | [`play/`](play/): `simge-512.png` (32 bit), `tanitim-gorseli-1024x500.png`, `telefon-1…6-*.png` (1080×1920). Üretici `../araclar/magaza-gorsel.mjs` |
| Sürüm notu | [`surum-notu.txt`](surum-notu.txt) |
| İlk paket | `1.1.0 (1)`: CI'ın (`iz-android.yml`) gerçek AdMob kimlikleriyle derlediği imzalı AAB, artifact `IzHaritasi-aab` |
| Yükleme anahtarı | Poyraz Workshop'un Hayalet Avcıları yükleme anahtarı (GitHub secret `HAYALET_KEYSTORE_*`; ayrı anahtar istenirse `IZ_KEYSTORE_*`). SHA-1 `D0:88:A0:75:77:D1:89:B0:15:D4:A5:88:74:9A:1A:8C:C2:EE:56:99` |

## Talimat (bilgisayardaki Claude Code, `claude --chrome`)

Kurallar:
- Şifre, kart, IBAN, kimlik bilgisi girme; o alanları kullanıcıya bırak. Ödeme yapma.
- Yasal beyan kutuları, "Uygulama oluştur", kullanıcı izinleri, Play App Signing kabulü, AdMob mesajını yayınlama,
  **main'e push**, **incelemeye gönderme / yayınlama** ve silme gibi geri dönüşü zor adımlardan önce dur, kullanıcının
  açık onayını al.
- Beklenmedik bir kutu, şart ya da güvenlik engeli çıkarsa başka yoldan deneme; dur ve sor.
- Her adımın sonunda neyin kaydedildiğini ve neyin kullanıcıya kaldığını kısaca Türkçe özetle.

### 0. Dosyalar
```
git checkout main && git pull
```
`https://mahmuttari.github.io/Lispler/iz-haritasi/gizlilik.html` açılmalı. Açılmıyorsa dur, kullanıcıya söyle (PR
birleştirilmemiş ya da Pages yayını bitmemiştir).

### 1. AdMob: uygulama, iki reklam birimi, AB onay mesajı
https://admob.google.com → **mahmuttari@gmail.com** hesabı (yayıncı kimliği `pub-2417242373034448` olmalı).
1. **Uygulamalar → Uygulama ekle** → Platform **Android** → "Uygulama desteklenen bir mağazada listeleniyor mu?"
   **Hayır** → Uygulama adı `İz Haritası` → ekle. Uygulama kimliğini not et (`ca-app-pub-2417242373034448~…`).
2. **Reklam birimleri → Reklam birimi ekle**:
   - **Banner** → ad `İz Haritası banner` (ayarlar varsayılan) → kimlik `ca-app-pub-2417242373034448/…`
   - **Geçiş reklamı** → ad `İz Haritası geçiş` (ayarlar varsayılan; sıklık sınırı gerekmez, uygulama kendisi en sık
     3 dakikada bir gösterir) → kimlik `ca-app-pub-2417242373034448/…`
3. **Gizlilik ve mesajlaşma → Avrupa tüzükleri** → yeni mesaj: uygulama **İz Haritası**, diller **Türkçe + İngilizce**,
   gizlilik politikası adresi (tablodan), seçenekler varsayılan → kullanıcıya göster, **onayıyla Yayınla**.
   (Bu mesaj olmadan AB, Birleşik Krallık ve İsviçre'de onay formu çıkmaz, oralarda reklam kısıtlı kalır.)
4. `iz-haritasi/android/gradle.properties`'teki üç satırı gerçek kimliklerle değiştir:
   ```
   ADMOB_APP_ID=ca-app-pub-2417242373034448~…
   ADMOB_BANNER_ID=ca-app-pub-2417242373034448/…
   ADMOB_INTERSTITIAL_ID=ca-app-pub-2417242373034448/…
   ```
   Kimlikler gizli değildir (her APK'da açıkça durur). Commit mesajı: `İz Haritası: AdMob kimlikleri`.
   Kullanıcının onayıyla `git push origin main`.
5. GitHub → Actions → **Android (İz Haritası)** bu commit için yeşil bitmeli. Günlükte `surum.txt` satırı
   `admob=ca-app-pub-2417242373034448~…` olmalı ("AdMob TEST kimlikleriyle derlendi" uyarısı **olmamalı**).
   Koşunun **Artifacts** bölümünden `IzHaritasi-aab`'yi indir, zip'ten `IzHaritasi.aab`'yi çıkar.

### 2. Play Console: uygulamayı oluştur
https://play.google.com/console → **Poyraz Workshop** → "Uygulama oluştur": ad `İz Haritası – AirTag için`, varsayılan
dil Türkçe – tr-TR, **Uygulama**, **Ücretsiz**. Beyan kutularını **kullanıcı** işaretler; onayından sonra "Uygulama
oluştur".

### 3. İlk paket (üretim, taslak)
İz Haritası → Test ve yayınla → **Üretim** → Ülkeler/bölgeler: **tümü** → "Yeni sürüm oluştur":
- Uygulama imzalama sorulursa Google'ın oluşturduğu anahtar (varsayılan) → **kullanıcı onayıyla**.
- App bundle: 1. adımın 5. maddesindeki `IzHaritasi.aab`. Dosya penceresini kullanamazsan kullanıcı seçer.
- Paket adı `com.poyrazworkshop.izharitasi`, sürüm `1.1.0 (1)` görünmeli. Sürüm notu (tr-TR): `surum-notu.txt`.
- "Sonraki" → yalnız **Kaydet**. İncelemeye GÖNDERME.

### 4. Hizmet hesabına bu uygulamayı da ver
Play Console ana menü → **Kullanıcılar ve izinler** → `notdefteri-play@handcalcbook.iam.gserviceaccount.com` →
"Uygulama ekle" → **İz Haritası** → Hayalet Avcıları'ndaki izinlerin aynısı:
- Uygulama bilgilerini görüntüleme ve toplu raporları indirme
- Mağaza girişini yönetme
- Üretime sürüm yayınlama, cihaz hariç tutma ve Play Uygulama İmzalama'yı kullanma
- Test kanallarına sürüm yayınlama
- **Taslak uygulamaları düzenleme ve silme** (Hayalet Avcıları'nda bu izin olmadan API düzenlemesi 403 verdi)

Kaydetmeden önce **kullanıcının onayını** al.

### 5. Mağaza ayarları ve Uygulama içeriği
Mağaza ayarları: kategori **Araçlar**, etiketler (listede bulunan en uygun birkaçı; yoksa boş), e-posta, web sitesi
(tablodan) → Kaydet. (Mağaza metni ve görselleri bulut oturumu API ile yükler; istenirse elle de: Ana mağaza girişi,
tablodaki dosyalar.)

Politika → Uygulama içeriği: [`aciklamalar.md` → "Google Play – Uygulama içeriği formları"](aciklamalar.md)
tablosundaki cevaplar. **Veri güvenliği**:
- Sağ üstteki "CSV'den içe aktar" ile `iz-haritasi/magaza/veri-guvenligi.csv` yüklenebilir; dosya penceresi
  kullanılamazsa form tablodaki yanıtlarla elle doldurulur. İkisi aynıdır.
- **Hesap oluşturma** sorusu CSV'de yoktur: "Uygulamam kullanıcıların hesap oluşturmasına izin vermiyor" seçilir.
- Önizlemede "Paylaşılan veriler: Konum, Uygulama etkinliği, Uygulama bilgileri ve performans, Cihaz veya diğer
  kimlikler" ve "Toplanan veriler: aynı dört grup" görünmeli.

Beyanları göndermeden önce kullanıcıya özetle.

### 6. Bulut oturumuna devret
Kullanıcıya şunu yazdır: "İz Haritası Play kurulumu tamam." Bulut oturumu `iz-haritasi/play-istek.txt` ile sırasıyla
`durum` → `magaza uygula` → `gorsel uygula` çalıştırır; eksik kalan bir şey yoksa incelemeye gönderme kararını
kullanıcıya sorar (`yukle yayinla uygula`: Play'deki 1.1.0 (1) taslağını "tamamlandı" yapar, paket yeniden yüklenmez;
ya da Console'da "İncelemeye gönder").

### 7. Yayından sonra (AdMob)
Uygulama Play'de yayınlanınca AdMob → Uygulamalar → İz Haritası → **Mağaza ekle** ile Play girişine bağlanır; o zamana
kadar AdMob "sınırlı reklam sunumu" uygular. `app-ads.txt` isteğe bağlıdır: geliştirici sitesinin **kök** alanında
(`https://mahmuttari.github.io/app-ads.txt`) durmalıdır ve bu depo oraya yayın yapamaz (24 Ekim 2026'da adres 404);
dosya yokken reklam sunulur, AdMob yalnız uyarı gösterir.

## Neden ilk adımlar tarayıcıda?

Google Play Developer API yeni uygulama **oluşturamaz** ve Console'da hiç paket yüklenmemiş uygulamayı **görmez**
("Package not found"). AdMob'da uygulama ve reklam birimi oluşturmanın da API'si yoktur. Bu yüzden 1-5. adımlar bir kez
tarayıcıda yapılır; sonrası (mağaza metni, görseller, yeni sürümler, incelemeye gönderme) GitHub üzerinden yürür.

## Sonraki sürümler (yalnız GitHub)

1. Web arayüzü GENEL-KONULAR/airtag-harita'da değişir; `node iz-haritasi/araclar/esitle.mjs` sayfayı
   `assets/www/index.html`'e alır, `KAYNAK.txt`'i yazar ve ortak Java dosyalarında değişiklik varsa listeler (onlar
   `app/src/main/java/com/poyrazworkshop/izharitasi/`'ye elle taşınır).
2. `iz-haritasi/android/app/build.gradle`'da `versionCode` (+1) ve `versionName`; `magaza/surum-notu.txt`.
3. Push → `iz-android.yml` imzalı AAB'yi derler → `play-istek.txt`'ye `yukle uygula`, kullanıcının onayıyla
   `yukle yayinla uygula`. AAB elle hiçbir yere taşınmaz.
