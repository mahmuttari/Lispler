# Master Office — Google Play'e ilk yayın

Uygulamanın sahibi başkasıdır: kaynak kodu bu depoda yoktur, imzalı AAB'yi ve mağaza paketini sahibi verdi
(`MasterOffice_PlayStore_Paketi`, 10 Kasım 2026; rehberi `00_REHBER_Claude_icin.md`). Bu klasör o paketi Lispler'in Play
düzenine bağlar. Hesap: **Poyraz Workshop** (kapalı test zorunluluğu yok → doğrudan **Üretim**; kullanıcı MARFEN derse
bu dosyada hesap adı, `aciklamalar.md` › Geliştirici adı ve `app/master-office/gizlilik.html` birlikte değişir).
Reklam hesabı: **AdMob, mahmuttari@gmail.com** (yayıncı `pub-2417242373034448`).

- **Tarayıcı işleri** (AdMob uygulaması ve 3 reklam birimi, Play'de uygulamayı oluşturma, ilk AAB, hizmet hesabı izni,
  Uygulama içeriği formları, Tüm dosyalara erişim beyanı, abonelikler) → bilgisayardaki Claude Code.
- **API işleri** (iki dilde mağaza metni, görseller, Veri güvenliği CSV'si, üretim sürümü ve incelemeye gönderme) →
  GitHub Actions (`master-office/play-istek.txt` → `.github/workflows/play-masteroffice.yml` → `android/play.mjs`).

## Sabit bilgiler

| Alan | Değer |
|---|---|
| Uygulama adı (mağaza, tr-TR ve en-US) | `Master Office` |
| Paket adı | `com.ofivora.app` (uygulamanın içinde sabit; "paket adı kullanılıyor" hatasında sahibine haber verilir) |
| İlk paket | `3.5.1` (versionCode `3005001`), sahibin imzalı AAB'si `01_Yuklenecek_Uygulama/MasterOffice-3.5.1.aab`. **AdMob TEST kimlikli** (`ca-app-pub-3940256099942544~3347511713`): yalnız dahili test |
| Yükleme anahtarı | Sahibin anahtarı (CN=Sayfa, SHA-256 `40:80:24:0A:…:04:CF:09`). Play Uygulama İmzalama: **Google'ın oluşturduğu anahtar**. Anahtar hiçbir zaman istenmez |
| Hedef API · min API | 36 · 24 (yeni uygulamalar için 31 Ağustos 2026'dan beri 36 zorunlu) |
| Varsayılan dil | Türkçe – tr-TR; çeviri en-US (API yükler) |
| Uygulama / oyun · fiyat | **Uygulama** · **Ücretsiz** (AdMob + yıllık abonelikler) |
| Kategori · etiketler | **Verimlilik**; etiketler listede varsa Belge görüntüleyici, PDF, Ofis gibi en yakın 5 tanesi |
| İletişim e-postası · web sitesi | `mahmuttari@gmail.com` · `https://mahmuttari.github.io/Lispler/master-office/` |
| Gizlilik politikası | `https://mahmuttari.github.io/Lispler/master-office/gizlilik.html` (kaynak `app/master-office/gizlilik.html`; Pages yalnız main'den yayınlar) |
| Ülkeler | Tüm ülkeler ve bölgeler |
| Metinler ve form cevapları | [`aciklamalar.md`](aciklamalar.md) (tr-TR + formlar), [`diller/en-US.md`](diller/en-US.md) |
| Veri güvenliği | [`aciklamalar.md` › Veri güvenliği formu](aciklamalar.md#veri-güvenliği-formu); CSV [`veri-guvenligi.csv`](veri-guvenligi.csv) |
| Abonelikler | `mo_reklamsiz`, `mo_pro`, `mo_master`; temel plan `yillik`, teklif `ilk-yil`: [`fiyatlandirma.md`](fiyatlandirma.md) |
| Görseller | [`play/`](play/): `simge-512.png` (32 bit), `tanitim-gorseli-1024x500.png` (tr-TR) ve `en-US/` altında İngilizcesi, 8 × `telefon-*.jpg` (1080×1920, sırayla) |

## Onay paketi (oturumun başında kullanıcıya gösterilir)

Geri dönüşü zor her kalem için kullanıcının **adıyla anan** bir onay satırı gerekir; kullanıcı çıkarmak istediği kalemi
silip yazar. Onaylanmayan kalemde durulur.

> ONAY: Master Office için şu kutuları işaretlemene ve şu düğmelere basmana onay veriyorum: 1. `master-office-play`
> dalının PR'ının main'e birleştirilmesi (gizlilik sayfası GitHub Pages'te yayına girer); 2. AdMob'da Master Office
> uygulamasının ve üç reklam biriminin (`mo_banner`, `mo_gecis`, `mo_odullu`) oluşturulması, Avrupa tüzükleri mesajına
> Master Office'in eklenip "Yayınla"; 3. Poyraz Workshop hesabında "Uygulama oluştur" beyan kutuları ve düğmesi;
> 4. Play Uygulama İmzalama'nın Google'ın anahtarıyla kabulü, 3.5.1 AAB'nin dahili teste yüklenmesi ve dahili test
> kullanıcılarına sunulması; 5. hizmet hesabına Master Office izinlerinin verilmesi; 6. Uygulama içeriği beyanlarının
> `aciklamalar.md` tablosundaki cevaplarla kaydı (IARC Kullanım Şartları ve anket gönderimi, Tüm dosyalara erişim
> beyanı dahil); 7. `fiyatlandirma.md`'deki fiyatlarla üç aboneliğin oluşturulması ve etkinleştirilmesi; 8. API ile
> mağaza metni, görseller ve Veri güvenliği formunun yazılması. Bunun dışında hiçbir şartı kabul etme, ücretli seçenek
> alma, üretime koyma, incelemeye gönderme; başka bir kutu çıkarsa dur ve sor.

Üretime koyma ve incelemeye gönderme bu paketin içinde **değildir**: sahibin gerçek AdMob kimlikli AAB'si (3.5.2) gelip
dahili testte denendikten sonra ayrıca sorulur.

## Talimat (bilgisayardaki Claude Code)

Kurallar: şifre, kart, IBAN, kimlik bilgisi girilmez; ödeme yapılmaz. Yasal beyan kutuları, "Uygulama oluştur", kullanıcı
izinleri, Play Uygulama İmzalama kabulü, AdMob mesajını yayınlama, fiyat etkinleştirme, main'e birleştirme ve
incelemeye gönderme yalnız onay paketiyle yapılır. Beklenmedik bir kutu çıkarsa dur ve sor. Her adımın sonunda neyin
kaydedildiği kısaca Türkçe özetlenir.

### 0. Gizlilik sayfası
PR main'e birleşince Pages iş akışı biter; `https://mahmuttari.github.io/Lispler/master-office/gizlilik.html` giriş
istemeden açılmalı (açılmıyorsa dur).

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
`ca-app-pub-…/…`) kullanıcıya verilir; kullanıcı sahibine iletir, sahip 3.5.2'yi (3005002) bu kimliklerle derler.
Kendi reklamlarına tıklanmaz.

### 2. Play Console: uygulamayı oluştur
https://play.google.com/console → **Poyraz Workshop** → "Uygulama oluştur": ad `Master Office`, varsayılan dil
**Türkçe – tr-TR**, **Uygulama**, **Ücretsiz** (sonradan ücretliye çevrilemez; doğrusu bu). Beyan kutuları onay paketiyle.

### 3. İlk paket: dahili test
Test et ve yayınla → Test → **Dahili test** → "Yeni sürüm oluştur":
- Uygulama imzalama sorulursa **Google'ın oluşturduğu anahtar** (varsayılan) → onay paketiyle.
- App bundle: `MasterOffice-3.5.1.aab`. Dosya penceresi kullanılamazsa kullanıcı seçer.
- Paket adı `com.ofivora.app`, sürüm `3.5.1 (3005001)` görünmeli. Sürüm adı `3.5.1`; sürüm notu `surum-notu.txt` (tr-TR)
  ve `diller/en-US.md › Sürüm notu`.
- Test kullanıcıları: e-posta listesi (kullanıcının ve sahibin Gmail adresi; kullanıcı söyler) → kaydet →
  **Dahili teste sunmaya başla** (onay paketiyle). Katılım bağlantısı kullanıcıya verilir.
- Ayarlar → **Lisans testi**'ne kullanıcının Gmail adresi eklenir (satın alma denemesinde para çekilmez).

### 4. Hizmet hesabı
Kullanıcılar ve izinler → `notdefteri-play@handcalcbook.iam.gserviceaccount.com` → "Uygulama ekle" → **Master Office**:
- Uygulama bilgilerini görüntüleme ve toplu raporları indirme
- Mağaza girişini yönetme
- Üretime sürüm yayınlama, cihaz hariç tutma ve Play Uygulama İmzalama'yı kullanma
- Test kanallarına sürüm yayınlama
- Taslak uygulamaları düzenleme ve silme

Onay paketiyle kaydet (davetten sonra API bir süre 403 verebilir).

### 5. Mağaza ayarları ve Uygulama içeriği
Mağaza ayarları: kategori **Verimlilik**, etiketler, e-posta, web sitesi (tablodan) → Kaydet. Mağaza metni ve görselleri
API yükler (7. adım). Uygulama içeriği: [`aciklamalar.md`](aciklamalar.md) › "Google Play – Uygulama içeriği formları".
Veri güvenliği API ile yazılır (7. adım); Console'da yalnız hesap sorusu ("hesap oluşturulamıyor") ve silme isteği yolu
("Hayır") kontrol edilir. **Tüm dosyalara erişim** beyanı (Play ilk yüklemeden sonra sorar): Belge yönetimi + tablodaki
açıklama. Beyanları göndermeden önce kullanıcıya özetle.

### 6. Abonelikler
Para kazanma → Ürünler → Abonelikler: [`fiyatlandirma.md`](fiyatlandirma.md). Fiyat tablosu etkinleştirmeden önce
kullanıcıya gösterilir. Sonra satın alma denemesi (sahibin rehberi §10): dahili testten kurulan uygulamada Hesap →
Paketler → Reklamsız'ı al → Pro'ya yükselt → sil-kur → Satın alımları geri yükle → Aboneliği yönet → iptal.

### 7. API
`master-office/play-istek.txt`: `durum` → `magaza uygula` → `gorsel uygula` → `veriguvenligi uygula` → `durum`.

### 8. Üretim (ayrı onayla)
Sahibin 3.5.2 AAB'si (gerçek AdMob kimlikleri) dahili teste elle yüklenir ve denenir; `surum.gradle` 3005002 / `3.5.2`
olur, sürüm notları güncellenir. Kullanıcının "ONAY: Master Office 3.5.2 yayınla" satırıyla `yukle yayinla uygula`.
Google incelemesi genelde birkaç gün sürer; ret gelirse ret metni sahibine iletilir.

## Sonraki sürümler

Sahip yeni AAB'yi kendi anahtarıyla imzalayıp verir (versionCode her seferinde büyür). AAB Play Console'dan elle yüklenir
(bu depo herkese açıktır, AAB'de sahibin kodunun eşleme dosyası var); `surum.gradle`, `surum-notu.txt` ve
`diller/en-US.md › Sürüm notu` güncellenir; onayla `yukle yayinla uygula`.

## App Store

Bu klasör yalnız Google Play içindir. Master Office'in iOS sürümü yoktur: kaynak kodu (Capacitor projesi) bu depoda
yok, App Store Connect API'si de yeni uygulama kaydı oluşturamaz (kayıt web sitesinden açılır). iOS için web katmanı
(`js/native.js`: `MoBilling`, `MoAds`, `DocIntentPlugin`) Swift eklentileriyle (StoreKit, AdMob iOS, belge açma/paylaşma)
yeniden yazılmalı; "Dosyalar" sekmesi iOS'ta bütün dosyaları tarayamaz.
