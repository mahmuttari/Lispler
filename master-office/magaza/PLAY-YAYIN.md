# Master Office — Google Play'e ilk yayın

Uygulamanın sahibi başkasıdır: kaynak kodu bu depoda yoktur, imzalı AAB'yi ve mağaza paketini sahibi verdi
(`MasterOffice_PlayStore_Paketi`, 10 Kasım 2026; rehberi `00_REHBER_Claude_icin.md`). Bu klasör o paketi Lispler'in Play
düzenine bağlar. Hesap: **MARFEN** (kuruluş hesabı: kapalı test şartı ve bekleme süresi yok → doğrudan **Üretim**).
Reklam hesabı: **AdMob, mahmuttari@gmail.com** (yayıncı `pub-2417242373034448`; `mahmuttari.github.io/app-ads.txt` bunu
listeler).

- **Tarayıcı işleri** (AdMob uygulaması ve 3 reklam birimi, Play'de uygulamayı oluşturma, ilk AAB, kullanıcı ve hizmet
  hesabı izinleri, test kullanıcıları, Uygulama içeriği formları, Tüm dosyalara erişim beyanı, abonelikler) →
  bilgisayardaki Claude Code.
- **API işleri** (iki dilde mağaza metni, görseller, Veri güvenliği CSV'si, üretim sürümü ve incelemeye gönderme) →
  GitHub Actions (`master-office/play-istek.txt` → `.github/workflows/play-masteroffice.yml` → `android/play.mjs`).
- **Google ve Apple ile giriş** 3.5.x'te yoktur; kullanıcı kodlanmasını istedi (10 Kasım 2026). Kaynak kodu olmadığı için
  bu, uygulamanın yeniden kurulan sürümünde ayrı bir iş olarak yapılır; üretime o sürümle çıkılır (8. adım).

## Sabit bilgiler

| Alan | Değer |
|---|---|
| Uygulama adı (mağaza, tr-TR ve en-US) | `Master Office` |
| Paket adı | `com.ofivora.app` (uygulamanın içinde sabit; "paket adı kullanılıyor" hatasında sahibine haber verilir) |
| İlk paket | `3.5.1` (versionCode `3005001`), sahibin imzalı AAB'si `01_Yuklenecek_Uygulama/MasterOffice-3.5.1.aab`. **AdMob TEST kimlikli** (`ca-app-pub-3940256099942544~3347511713`): yalnız dahili test |
| Yükleme anahtarı | Sahibin anahtarı (CN=Sayfa, SHA-256 `40:80:24:0A:…:04:CF:09`). Play Uygulama İmzalama: **Google'ın oluşturduğu anahtar**. Yeniden kurulan sürüm başka anahtarla imzalanırsa Play Console'dan **yükleme anahtarı sıfırlama** istenir |
| Hedef API · min API | 36 · 24 (yeni uygulamalar için 31 Ağustos 2026'dan beri 36 zorunlu) |
| Varsayılan dil | Türkçe – tr-TR; çeviri en-US (API yükler) |
| Uygulama / oyun · fiyat | **Uygulama** · **Ücretsiz** (AdMob + yıllık abonelikler) |
| Kategori · etiketler | **Verimlilik**; etiketler listede varsa Belge görüntüleyici, PDF, Ofis gibi en yakın 5 tanesi |
| İletişim e-postası · web sitesi | `info@marfen.com.tr` · `https://mahmuttari.github.io/master-office/` |
| Gizlilik politikası | `https://mahmuttari.github.io/master-office/gizlilik.html` (kaynak: `mahmuttari/mahmuttari.github.io` › `master-office/`; Pages main'den yayınlar) |
| Kullanıcılar | `mahmuttari@gmail.com`: hesabın sahibi (zaten tam yetkili). `bunyaminodabasi@gmail.com`: **hesap genelinde Yönetici (tüm izinler)**. İkisi de dahili test kullanıcısı ve lisans test kullanıcısı |
| Ülkeler | Tüm ülkeler ve bölgeler |
| Metinler ve form cevapları | [`aciklamalar.md`](aciklamalar.md) (tr-TR + formlar), [`diller/en-US.md`](diller/en-US.md) |
| Veri güvenliği | [`aciklamalar.md` › Veri güvenliği formu](aciklamalar.md#veri-güvenliği-formu); CSV [`veri-guvenligi.csv`](veri-guvenligi.csv) |
| Abonelikler | `mo_reklamsiz`, `mo_pro`, `mo_master`; temel plan `yillik`, teklif `ilk-yil`: [`fiyatlandirma.md`](fiyatlandirma.md) |
| Görseller | [`play/`](play/): `simge-512.png` (32 bit), `tanitim-gorseli-1024x500.png` (tr-TR) ve `en-US/` altında İngilizcesi, 8 × `telefon-*.jpg` (1080×1920, sırayla) |

## Onay paketi (oturumun başında kullanıcıya gösterilir)

Geri dönüşü zor her kalem için kullanıcının **adıyla anan** bir onay satırı gerekir; kullanıcı çıkarmak istediği kalemi
silip yazar. Onaylanmayan kalemde durulur.

> ONAY: Master Office için şu kutuları işaretlemene ve şu düğmelere basmana onay veriyorum: 1. Lispler
> `master-office-play` ve mahmuttari.github.io `master-office` PR'larının main'e birleştirilmesi (gizlilik sayfası
> yayına girer); 2. AdMob'da Master Office uygulamasının ve üç reklam biriminin (`mo_banner`, `mo_gecis`, `mo_odullu`)
> oluşturulması, Avrupa tüzükleri mesajına Master Office'in eklenip "Yayınla"; 3. MARFEN hesabında "Uygulama oluştur"
> beyan kutuları ve düğmesi; 4. Play Uygulama İmzalama'nın Google'ın anahtarıyla kabulü, 3.5.1 AAB'nin dahili teste
> yüklenmesi ve dahili test kullanıcılarına sunulması; 5. `bunyaminodabasi@gmail.com`'a MARFEN hesabında Yönetici (tüm
> izinler) daveti, hizmet hesabına Master Office izinleri, iki adresin dahili test ve lisans testi listelerine eklenmesi;
> 6. Uygulama içeriği beyanlarının `aciklamalar.md` tablosundaki cevaplarla kaydı (IARC Kullanım Şartları ve anket
> gönderimi, Tüm dosyalara erişim beyanı dahil); 7. `fiyatlandirma.md`'deki fiyatlarla üç aboneliğin oluşturulması ve
> etkinleştirilmesi; 8. API ile mağaza metni, görseller ve Veri güvenliği formunun yazılması. Bunun dışında hiçbir şartı
> kabul etme, ücretli seçenek alma, üretime koyma, incelemeye gönderme; başka bir kutu çıkarsa dur ve sor.

Üretime koyma ve incelemeye gönderme bu paketin içinde **değildir**: gerçek AdMob kimlikli ve Google/Apple girişli sürüm
dahili testte denendikten sonra ayrıca sorulur.

## Talimat (bilgisayardaki Claude Code)

Kurallar: şifre, kart, IBAN, kimlik bilgisi girilmez; ödeme yapılmaz. Yasal beyan kutuları, "Uygulama oluştur", kullanıcı
izinleri, Play Uygulama İmzalama kabulü, AdMob mesajını yayınlama, fiyat etkinleştirme, main'e birleştirme ve
incelemeye gönderme yalnız onay paketiyle yapılır. Beklenmedik bir kutu çıkarsa dur ve sor. Her adımın sonunda neyin
kaydedildiği kısaca Türkçe özetlenir.

### 0. Gizlilik sayfası
mahmuttari.github.io PR'ı main'e birleşince `https://mahmuttari.github.io/master-office/gizlilik.html` giriş istemeden
açılmalı (açılmıyorsa dur).

### 1. AdMob (sahibin rehberi §11)
https://admob.google.com → mahmuttari@gmail.com (yayıncı `pub-2417242373034448`) → **Uygulamalar → Uygulama ekle** →
Android → "Desteklenen bir mağazada listeleniyor mu?" **Hayır** → ad `Master Office`. Reklam birimleri:

| Tür | Ad | Ayar |
|---|---|---|
| Banner (uyarlanabilir) | `mo_banner` | varsayılan |
| Geçiş reklamı | `mo_gecis` | varsayılan (uygulama en çok 5 dakikada bir gösterir) |
| Ödüllü | `mo_odullu` | ödül miktarı **1**, ödül adı **tam kullanım** |

**Gizlilik ve mesajlaşma → Avrupa tüzükleri**: Master Office mevcut mesaja eklenir ya da Türkçe + İngilizce yeni mesaj,
gizlilik politikası adresi yukarıdaki → onayla **Yayınla**. Dört kimlik (uygulama kimliği `ca-app-pub-…~…`, üç birim
`ca-app-pub-…/…`) kaydedilir: yeniden kurulan sürüm (ya da sahibin 3.5.2'si) bunlarla derlenir. Kendi reklamlarına
tıklanmaz.

### 2. Play Console: uygulamayı oluştur
https://play.google.com/console → **MARFEN** → "Uygulama oluştur": ad `Master Office`, varsayılan dil **Türkçe – tr-TR**,
**Uygulama**, **Ücretsiz** (sonradan ücretliye çevrilemez; doğrusu bu). Beyan kutuları onay paketiyle.

### 3. İlk paket: dahili test
Test et ve yayınla → Test → **Dahili test** → "Yeni sürüm oluştur":
- Uygulama imzalama sorulursa **Google'ın oluşturduğu anahtar** (varsayılan) → onay paketiyle.
- App bundle: `MasterOffice-3.5.1.aab`. Dosya penceresi kullanılamazsa kullanıcı seçer.
- Paket adı `com.ofivora.app`, sürüm `3.5.1 (3005001)` görünmeli. Sürüm adı `3.5.1`; sürüm notu `surum-notu.txt` (tr-TR)
  ve `diller/en-US.md › Sürüm notu`.
- Test kullanıcıları: e-posta listesi `Master Office test` → `mahmuttari@gmail.com`, `bunyaminodabasi@gmail.com` →
  kaydet → **Dahili teste sunmaya başla** (onay paketiyle). Katılım bağlantısı kullanıcıya verilir.
- Ayarlar → **Lisans testi**: aynı iki adres (satın alma denemesinde para çekilmez).

### 4. Kullanıcılar ve izinler
- **Yeni kullanıcı davet et** → `bunyaminodabasi@gmail.com` → **Hesap izinleri: Yönetici (tüm izinler)** → davet gönder
  (onay paketiyle). `mahmuttari@gmail.com` hesabın sahibidir, davet edilmez.
- `notdefteri-play@handcalcbook.iam.gserviceaccount.com` → "Uygulama ekle" → **Master Office**:
  - Uygulama bilgilerini görüntüleme ve toplu raporları indirme
  - Mağaza girişini yönetme
  - Üretime sürüm yayınlama, cihaz hariç tutma ve Play Uygulama İmzalama'yı kullanma
  - Test kanallarına sürüm yayınlama
  - Taslak uygulamaları düzenleme ve silme

  Kaydet (davetten sonra API bir süre 403 verebilir).

### 5. Mağaza ayarları ve Uygulama içeriği
Mağaza ayarları: kategori **Verimlilik**, etiketler, e-posta, web sitesi (tablodan) → Kaydet. Mağaza metni ve görselleri
API yükler (7. adım). Uygulama içeriği: [`aciklamalar.md`](aciklamalar.md) › "Google Play – Uygulama içeriği formları".
Veri güvenliği API ile yazılır (7. adım); Console'da yalnız hesap sorusu ("hesap oluşturulamıyor") ve silme isteği yolu
("Hayır") kontrol edilir. **Tüm dosyalara erişim** beyanı (Play ilk yüklemeden sonra sorar): Belge yönetimi + tablodaki
açıklama. Beyanları göndermeden önce kullanıcıya özetle. (Girişli sürümde hesap oluşturma, hesap silme ve veri türleri
değişir; o sürümle birlikte güncellenir.)

### 6. Abonelikler
Para kazanma → Ürünler → Abonelikler: [`fiyatlandirma.md`](fiyatlandirma.md). Fiyat tablosu etkinleştirmeden önce
kullanıcıya gösterilir. Sonra satın alma denemesi (sahibin rehberi §10): dahili testten kurulan uygulamada Hesap →
Paketler → Reklamsız'ı al → Pro'ya yükselt → sil-kur → Satın alımları geri yükle → Aboneliği yönet → iptal.

### 7. API
`master-office/play-istek.txt`: `durum` → `magaza uygula` → `gorsel uygula` → `veriguvenligi uygula` → `durum`.

### 8. Üretim (ayrı onayla)
Gerçek AdMob kimlikli, Google/Apple girişli sürüm dahili teste yüklenir ve denenir; `surum.gradle`, sürüm notları,
Veri güvenliği ve gizlilik sayfası o sürüme göre güncellenir. Kullanıcının "ONAY: Master Office <sürüm> yayınla"
satırıyla `yukle yayinla uygula`. Google incelemesi genelde birkaç gün sürer.

## Sonraki sürümler

AAB'ler Play Console'dan elle yüklenir (bu depo herkese açıktır; AAB'de kodun eşleme dosyası var); `surum.gradle`,
`surum-notu.txt` ve `diller/en-US.md › Sürüm notu` güncellenir; onayla `yukle yayinla uygula`.

## App Store

Bu klasör yalnız Google Play içindir. Master Office'in iOS sürümü yoktur; App Store Connect API'si yeni uygulama kaydı
oluşturamaz (kayıt web sitesinden açılır). iOS sürümü, Google/Apple girişiyle birlikte uygulamanın yeniden kurulan
kaynak kodundan çıkarılır: web katmanı (`js/native.js`: `MoBilling`, `MoAds`, `DocIntentPlugin`) iOS'ta Swift
eklentileriyle (StoreKit, AdMob iOS, belge açma/paylaşma) karşılanır; "Dosyalar" sekmesi iOS'ta bütün dosyaları
tarayamaz. App Store ekran görüntüleri iOS derlemesinden çekilir (Android çerçeveli görseller Apple'da reddedilir).
