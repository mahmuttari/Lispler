# Calqora — Google Play'e ilk yayın

Hesap: **Poyraz Workshop** (doğrudan **Üretim**). Reklam hesabı: **AdMob, mahmuttari@gmail.com** (yayıncı
`pub-2417242373034448`). Paket: `com.poyrazworkshop.calqora`. Düzen İz Haritası'nınkiyle aynıdır
([`../../iz-haritasi/magaza/PLAY-YAYIN.md`](../../iz-haritasi/magaza/PLAY-YAYIN.md)); dört küçük uygulama (Unitica,
Calqora, Kıble Bul, Smart Measure) **tek tarayıcı oturumunda** sırayla yapılır, bu dosya yalnız Calqora'ya özgü
adımları verir.

- **Tarayıcı işleri** (AdMob uygulaması ve iki reklam birimi, Play'de uygulamayı oluşturma, ilk AAB, abonelik, Uygulama
  içeriği formları, hizmet hesabı izni) → bilgisayardaki **Claude Code** (`claude --chrome`).
- **API işleri** (11 dilde mağaza metni, görseller, Veri güvenliği CSV'si, sonraki AAB'ler, incelemeye gönderme) → bulut
  oturumu, GitHub Actions ile (`calqora/play-istek.txt` → `.github/workflows/play-calqora.yml` → `android/play.mjs`).

Önce **bu dalın PR'ı main'e birleştirilir** (gizlilik sayfası GitHub Pages'te yalnız main'den yayınlanır).

## Sabit bilgiler

| Alan | Değer |
|---|---|
| Uygulama adı (mağaza) | `Calqora – Bilimsel Hesap` (24 karakter; telefondaki ad `Calqora`) |
| Paket adı | `com.poyrazworkshop.calqora` |
| Varsayılan dil | Türkçe – tr-TR; çeviriler en-US, de-DE, fr-FR, es-ES, it-IT, pt-BR, ru-RU, ar, ja-JP, ko-KR |
| Uygulama / oyun · fiyat | **Uygulama** · **Ücretsiz** (indirme ücretsiz; AdMob reklamı + uygulama içi abonelik) |
| Kategori | **Araçlar** |
| İletişim e-postası | `mahmuttari@gmail.com` |
| Web sitesi | `https://mahmuttari.github.io/Lispler/calqora/` |
| Gizlilik politikası | `https://mahmuttari.github.io/Lispler/calqora/gizlilik.html` |
| Hesap silme adresi | yok: uygulamada hesap yok |
| Ülkeler | Tüm ülkeler ve bölgeler |
| Metinler ve form cevapları | [`aciklamalar.md`](aciklamalar.md), çeviriler [`diller/`](diller/) |
| Veri güvenliği | [`aciklamalar.md` › Veri güvenliği formu](aciklamalar.md#veri-güvenliği-formu); CSV [`veri-guvenligi.csv`](veri-guvenligi.csv) |
| Görseller | [`play/`](play/) ve `play/<dil>/`: `simge-512.png` (32 bit), `tanitim-gorseli-1024x500.png`, `telefon-1…6-*.png` (1080×1920). Üretici `../araclar/magaza-gorsel.mjs` |
| Sürüm notu | [`surum-notu.txt`](surum-notu.txt) (tr-TR), öbür diller `diller/<dil>.md` › Sürüm notu |
| Abonelik | `adfree` · temel planlar `monthly` (0,99 $) ve `yearly` (9,99 $) — [`fiyatlandirma.md`](fiyatlandirma.md) |
| AdMob birimleri | uyarlanabilir **banner** + **geçiş reklamı** (ödüllü ve açılış reklamı yok) |
| İlk paket | `1.1.0 (1)`: CI'ın (`calqora-android.yml`) gerçek AdMob kimlikleriyle derlediği imzalı AAB, artifact `Calqora-aab` |
| Yükleme anahtarı | Poyraz Workshop'un ortak yükleme anahtarı (GitHub secret `HAYALET_KEYSTORE_*`; ayrı anahtar istenirse `CALQORA_KEYSTORE_*`). SHA-1 `D0:88:A0:75:77:D1:89:B0:15:D4:A5:88:74:9A:1A:8C:C2:EE:56:99` |

## Talimat (bilgisayardaki Claude Code, `claude --chrome`)

Kurallar İz Haritası'ndakiyle aynı: şifre, kart, IBAN, kimlik bilgisi girme; ödeme yapma. Beyan kutuları, "Uygulama
oluştur", izinler, Play App Signing, AdMob mesajını yayınlama, aboneliği etkinleştirme, **main'e push** ve **incelemeye
gönderme** öncesi dur, kullanıcının açık onayını al. Beklenmedik bir engelde başka yol deneme; dur ve sor.

### 0. Hazırlık
`git checkout main && git pull`. `https://mahmuttari.github.io/Lispler/calqora/gizlilik.html` açılmalı. Play Console ›
**Politika durumu**'nda hesapta açık bir uyarı varsa dur ve kullanıcıya göster (hesapta daha önce askıya alınmış
uygulamalar var: `DEGERLENDIRME.md` §4).

### 1. AdMob: uygulama, iki reklam birimi, AB onay mesajı
https://admob.google.com → **mahmuttari@gmail.com** (yayıncı `pub-2417242373034448`).
1. **Uygulamalar → Uygulama ekle** → Android → listelenmiyor (**Hayır**) → ad `Calqora` → kimliği not et
   (`ca-app-pub-2417242373034448~…`).
2. **Reklam birimleri**: **Banner** → `Calqora banner`; **Geçiş reklamı** → `Calqora geçiş` (ayarlar varsayılan;
   sıklık sınırı gerekmez, uygulama en sık 4 dakikada bir ve saatte en çok 6 gösterir).
3. **Gizlilik ve mesajlaşma → Avrupa tüzükleri**: Calqora dört uygulamanın ortak mesajında olmalı
   (`docs/kucuk-uygulamalar-play.md` adım 1), gizlilik adresi tablodan. **Calqora'ya özgü ek:** uygulama 11 dilli
   olduğundan mesaja Türkçe + İngilizce'nin yanında AB dilleri **Almanca, Fransızca, İspanyolca, İtalyanca, Portekizce**
   de eklenir (onay formu o ülkelerde kullanıcının dilinde çıksın; kullanıcı onaylarsa) → **onayla Yayınla**.
4. `calqora/android/gradle.properties`'teki üç satırı gerçek kimliklerle değiştir (`ADMOB_APP_ID`, `ADMOB_BANNER_ID`,
   `ADMOB_INTERSTITIAL_ID`), sonra `node calqora/araclar/kimlik.mjs` (web tarafındaki `www/js/reklam-kimlik.js`'i
   yazar; `node --test calqora/test/*.test.mjs` yeşil kalmalı). Commit `Calqora: AdMob kimlikleri`, onayla
   `git push origin main`.
5. GitHub → Actions → **Android (Calqora)** yeşil bitmeli; `surum.txt`'te `admob=ca-app-pub-2417242373034448~…` olmalı
   ("AdMob TEST kimlikleriyle derlendi" uyarısı olmamalı). Artifacts › `Calqora-aab` → `Calqora.aab`.

### 2. Play Console: uygulamayı oluştur
**Poyraz Workshop** → "Uygulama oluştur": ad `Calqora – Bilimsel Hesap`, varsayılan dil Türkçe – tr-TR, **Uygulama**,
**Ücretsiz**. Beyan kutularını **kullanıcı** işaretler.

### 3. İlk paket (üretim, taslak)
Test ve yayınla → **Üretim** → ülkeler: **tümü** → "Yeni sürüm oluştur": Play App Signing (varsayılan, kullanıcı
onayıyla) → `Calqora.aab` → paket `com.poyrazworkshop.calqora`, sürüm `1.1.0 (1)` görünmeli → sürüm notu (tr-TR)
`surum-notu.txt` → yalnız **Kaydet**. İncelemeye GÖNDERME. (Abonelik ancak faturalandırma izinli bir paket
yüklendikten sonra oluşturulabilir; bu yüzden 4. adım burada.)

### 4. Abonelik: `adfree`
Para kazanma › Ürünler › **Abonelikler** → [`fiyatlandirma.md`](fiyatlandirma.md)'deki adımlar: ürün `adfree`, temel
planlar `monthly` (1 ay, 0,99 USD) ve `yearly` (1 yıl, 9,99 USD), yerel fiyatlar Play'in önerisi → kullanıcının
fiyatları onaylamasıyla **Etkinleştir**. Ödeme profili (satıcı hesabı) yoksa Console onu ister: banka/vergi bilgisini
**kullanıcı** girer.

### 5. Hizmet hesabı, mağaza ayarları, Uygulama içeriği
- Kullanıcılar ve izinler → `notdefteri-play@handcalcbook.iam.gserviceaccount.com` → "Uygulama ekle" → **Calqora** →
  öbür uygulamalardaki izinlerin aynısı (taslak uygulamaları düzenleme dahil) → kullanıcı onayıyla kaydet.
- Mağaza ayarları: kategori **Araçlar**, e-posta ve web sitesi (tablodan).
- Uygulama içeriği: [`aciklamalar.md` → "Google Play – Uygulama içeriği formları"](aciklamalar.md) (Reklamlar: Evet;
  Hedef kitle 13+; Reklam kimliği: Evet; IARC'de dijital satın alma: Evet). **Veri güvenliği**: "CSV'den içe aktar" ile
  `calqora/magaza/veri-guvenligi.csv`; hesap sorusunda "hesap oluşturmaya izin vermiyor". Önizlemede toplanan ve
  paylaşılan: Konum, Uygulama etkinliği, Uygulama bilgileri ve performans, Cihaz veya diğer kimlikler. Göndermeden önce
  kullanıcıya özetle.

### 6. Bulut oturumuna devret
Kullanıcıya "Calqora Play kurulumu tamam." yazdır. Bulut oturumu `calqora/play-istek.txt` ile `durum` → `magaza uygula`
→ `gorsel uygula` çalıştırır; sonra incelemeye gönderme kararını kullanıcıya sorar (`yukle yayinla uygula` ya da
Console'da "İncelemeye gönder").

### 7. Yayından sonra
AdMob → Uygulamalar → Calqora → **Mağaza ekle** (Play girişine bağlanana kadar AdMob sınırlı reklam sunar).
`app-ads.txt` isteğe bağlıdır (İz Haritası'ndaki not geçerli). İlk sürümü bir test telefonunda dahili test kanalından
bir kez dene: banner'ın gezinme çubuğunun üstünde kendi şeridinde durması, klavyede gizlenmesi, lisans test hesabıyla
abonelik ve "Aboneliği yönet"in Play'in abonelik sayfasını açması (`DEGERLENDIRME.md` §4).

## Sonraki sürümler (yalnız GitHub)

1. `calqora/android/app/build.gradle`'da `versionCode` (+1) ve `versionName`; aynı sürüm `package.json` ve
   `www/js/config.js › APP.version`'da (test denetler); `magaza/surum-notu.txt` ve `diller/<dil>.md` › Sürüm notu.
2. Push → `calqora-android.yml` imzalı AAB'yi derler → `play-istek.txt`'ye `yukle uygula`, kullanıcının onayıyla
   `yukle yayinla uygula`.
