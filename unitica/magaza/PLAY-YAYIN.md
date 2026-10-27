# Unitica — Google Play'e ilk yayın

Hesap: **Poyraz Workshop** (kapalı test zorunluluğu yok → doğrudan **Üretim**). Reklam hesabı: **AdMob,
mahmuttari@gmail.com** (yayıncı `pub-2417242373034448`). Dört küçük uygulama (Unitica, Calqora, Kıble Bul, Smart
Measure) **tek tarayıcı oturumunda** yapılır: ortak akış, onay paketi ve kurallar
[`../../docs/kucuk-uygulamalar-play.md`](../../docs/kucuk-uygulamalar-play.md)'dedir. Bu dosya yalnız Unitica'nın sabit
bilgilerini ve kendine özgü adımlarını verir.

- **Tarayıcı işleri** (AdMob uygulaması ve iki reklam birimi, Play'de uygulamayı oluşturma, ilk AAB, Uygulama içeriği
  formları, `adfree` aboneliği, hizmet hesabı izni) → bilgisayardaki **Claude Code** (`claude --chrome`).
- **API işleri** (11 dilde mağaza metni, görseller, Veri güvenliği CSV'si, sonraki AAB'ler, incelemeye gönderme) →
  bulut oturumu, GitHub Actions ile (`unitica/play-istek.txt` → `.github/workflows/play-unitica.yml` → `android/play.mjs`).

## Sabit bilgiler

| Alan | Değer |
|---|---|
| Uygulama adı (mağaza, tr-TR) | `Unitica – Birim Dönüştürücü` (27 karakter; telefondaki ad `Unitica`) |
| AdMob'daki ad | `Unitica` · birimler `Unitica banner` (Banner), `Unitica geçiş` (Geçiş reklamı) |
| Paket adı | `com.poyrazworkshop.unitica` |
| Varsayılan dil | Türkçe – tr-TR; çeviriler en-US, de-DE, fr-FR, es-ES, it-IT, pt-BR, ru-RU, ar, ja-JP, ko-KR (API yükler) |
| Uygulama / oyun · fiyat | **Uygulama** · **Ücretsiz** (AdMob reklamı + isteğe bağlı abonelik) |
| Kategori | **Araçlar** |
| İletişim e-postası | `mahmuttari@gmail.com` |
| Web sitesi | `https://mahmuttari.github.io/Lispler/unitica/` |
| Gizlilik politikası | `https://mahmuttari.github.io/Lispler/unitica/gizlilik.html` |
| Hesap silme adresi | yok: uygulamada hesap yok |
| Ülkeler | Tüm ülkeler ve bölgeler |
| Metinler ve form cevapları | [`aciklamalar.md`](aciklamalar.md) (tr-TR + formlar), [`diller/`](diller/) (10 dil) |
| Veri güvenliği | [`aciklamalar.md` › Veri güvenliği formu](aciklamalar.md#veri-güvenliği-formu); CSV [`veri-guvenligi.csv`](veri-guvenligi.csv) |
| Abonelik | ürün `adfree`, temel planlar `monthly` (1 ay) ve `yearly` (1 yıl): [`fiyatlandirma.md`](fiyatlandirma.md) |
| Görseller | [`play/`](play/): `simge-512.png` (32 bit), her dilde `tanitim-gorseli-1024x500.png` ve 6 × `telefon-*.png` (1080×1920). Üretici `../araclar/magaza-gorsel.mjs` |
| Sürüm notu | [`surum-notu.txt`](surum-notu.txt) (tr-TR), öbür diller `diller/<dil>.md › Sürüm notu` |
| İlk paket | `1.4.0 (1)`: CI'ın (`unitica-android.yml`) gerçek AdMob kimlikleriyle derlediği imzalı AAB, artifact `Unitica-aab` |
| Yükleme anahtarı | `UNITICA_KEYSTORE_*` secret'ı, yoksa Poyraz Workshop'un ortak anahtarı (`HAYALET_KEYSTORE_*`) |

## Talimat (ortak oturumda Unitica'ya düşen adımlar)

### 1. AdMob
Uygulama ekle → Android → "Desteklenen bir mağazada listeleniyor mu?" **Hayır** → ad `Unitica`. Reklam birimleri:
**Banner** `Unitica banner` ve **Geçiş reklamı** `Unitica geçiş` (ayarlar varsayılan; sıklık sınırı gerekmez, uygulama
saatte en çok 3 kez ve en sık 8 dakikada bir gösterir). Ödüllü ve uygulama açılışı birimi **oluşturulmaz**.
`unitica/android/gradle.properties`'teki üç satır gerçek kimliklerle değiştirilir, sonra:
```
node unitica/araclar/kimlik.mjs && node --test unitica/test/*.test.mjs
```
(`www/js/reklam-kimlik.js` yazılır; test ikisinin aynı olduğunu denetler.) Avrupa tüzükleri mesajına Unitica da eklenir.

### 2. Play Console: uygulamayı oluştur
Ad `Unitica – Birim Dönüştürücü`, varsayılan dil Türkçe – tr-TR, **Uygulama**, **Ücretsiz**.

### 3. İlk paket (üretim, taslak)
`Unitica.aab` (artifact `Unitica-aab`); paket adı `com.poyrazworkshop.unitica`, sürüm `1.4.0 (1)` görünmeli; sürüm notu
`surum-notu.txt`. Yalnız **Kaydet**; incelemeye gönderilmez.

### 4. Hizmet hesabı
`notdefteri-play@handcalcbook.iam.gserviceaccount.com` hesabına **Unitica** eklenir (izinler ortak belgedeki gibi).

### 5. Mağaza ayarları ve Uygulama içeriği
Kategori **Araçlar**; etiketler listede varsa "Hesap makinesi", "Araçlar", "Eğitim" gibi en uygun birkaçı. Uygulama
içeriği: [`aciklamalar.md`](aciklamalar.md) tablosu. Dikkat: IARC'de **dijital ürün satın alma: Evet** (abonelik);
reklam kimliği **Evet**; hedef kitle 13+. Veri güvenliği: "CSV'den içe aktar" → `unitica/magaza/veri-guvenligi.csv`;
hesap sorusu "hesap oluşturulamıyor". Önizlemede "Paylaşılan / Toplanan: Konum, Uygulama etkinliği, Uygulama bilgileri
ve performans, Cihaz veya diğer kimlikler" görünmeli. Ön plan hizmeti sorulursa `aciklamalar.md`'deki yanıt.

### 6. Abonelik
Para kazanma → Abonelikler → ürün kimliği **`adfree`**, ad tr "Reklamsız üyelik" / en "Ad-free membership"; temel
planlar **`monthly`** (otomatik yenilenen, 1 ay, 0,99 USD) ve **`yearly`** (otomatik yenilenen, 1 yıl, 9,99 USD);
bütün ülkeler. Fiyat tablosu etkinleştirmeden önce kullanıcıya gösterilir ([`fiyatlandirma.md`](fiyatlandirma.md)).
Teklif (deneme süresi) eklenmez.

Sonra ortak belgedeki 7. adım: bulut oturumu `unitica/play-istek.txt` ile `durum` → `magaza uygula` → `gorsel uygula`
→ `veriguvenligi` çalıştırır; incelemeye gönderme kullanıcıya ayrıca sorulur.

### 7. Yayından sonra (AdMob)
AdMob → Uygulamalar → Unitica → **Mağaza ekle** ile Play girişine bağlanır; o zamana kadar "sınırlı reklam sunumu".

## Sonraki sürümler (yalnız GitHub)

1. `unitica/www/` değişir (ya da eklenti sürümü); `android/app/build.gradle`'da `versionCode` (+1) ve `versionName`,
   `package.json` ve `www/version.json`'da aynı sürüm (test denetler); `magaza/surum-notu.txt` ve
   `diller/<dil>.md › Sürüm notu`.
2. Push → `unitica-android.yml` imzalı AAB'yi derler → `play-istek.txt`'ye `yukle uygula`, kullanıcının onayıyla
   `yukle yayinla uygula`.
