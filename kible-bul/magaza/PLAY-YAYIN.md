# Kıble Bul — Google Play'e ilk yayın

Hesap: **Poyraz Workshop** (kapalı test zorunluluğu yok → doğrudan **Üretim**). Reklam hesabı: **AdMob,
mahmuttari@gmail.com** (yayıncı `pub-2417242373034448`). Dört küçük uygulama (Unitica, Calqora, Kıble Bul, Smart
Measure) **tek tarayıcı oturumunda** yapılır: ortak akış, onay paketi ve kurallar
[`../../docs/kucuk-uygulamalar-play.md`](../../docs/kucuk-uygulamalar-play.md)'dedir. Bu dosya yalnız Kıble Bul'un
sabit bilgilerini ve kendine özgü adımlarını verir.

- **Tarayıcı işleri** (AdMob uygulaması, iki reklam birimi ve **hassas kategori engelleri**, Play'de uygulamayı
  oluşturma, ilk AAB, Uygulama içeriği formları, `adfree` aboneliği, hizmet hesabı izni) → bilgisayardaki
  **Claude Code** (`claude --chrome`).
- **API işleri** (11 dilde mağaza metni, görseller, Veri güvenliği CSV'si, sonraki AAB'ler, incelemeye gönderme) →
  bulut oturumu, GitHub Actions ile (`kible-bul/play-istek.txt` → `.github/workflows/play-kiblebul.yml` → `android/play.mjs`).

## Sabit bilgiler

| Alan | Değer |
|---|---|
| Uygulama adı (mağaza, tr-TR) | `Kıble Bul – Kıble Pusulası` (26 karakter; telefondaki ad `Kıble Bul`, İngilizce telefonda `Qibla Finder`) |
| AdMob'daki ad | `Kıble Bul` · birimler `Kıble Bul banner` (Banner), `Kıble Bul geçiş` (Geçiş reklamı) |
| Paket adı | `com.poyrazworkshop.kiblebul` |
| Varsayılan dil | Türkçe – tr-TR; çeviriler en-US, de-DE, fr-FR, es-ES, it-IT, pt-BR, ru-RU, ar, ja-JP, ko-KR (API yükler) |
| Uygulama / oyun · fiyat | **Uygulama** · **Ücretsiz** (AdMob reklamı + isteğe bağlı abonelik) |
| Kategori | **Yaşam Tarzı** (kıble ve namaz uygulamalarının çoğunun kategorisi) |
| İletişim e-postası | `mahmuttari@gmail.com` |
| Web sitesi | `https://mahmuttari.github.io/Lispler/kible-bul/` |
| Gizlilik politikası | `https://mahmuttari.github.io/Lispler/kible-bul/gizlilik.html` |
| Hesap silme adresi | yok: uygulamada hesap yok |
| Ülkeler | Tüm ülkeler ve bölgeler |
| Metinler ve form cevapları | [`aciklamalar.md`](aciklamalar.md) (tr-TR + formlar), [`diller/`](diller/) (10 dil) |
| Veri güvenliği | [`aciklamalar.md` › Veri güvenliği formu](aciklamalar.md#veri-güvenliği-formu); CSV [`veri-guvenligi.csv`](veri-guvenligi.csv) |
| Abonelik | ürün `adfree`, temel planlar `monthly` (1 ay) ve `yearly` (1 yıl): [`fiyatlandirma.md`](fiyatlandirma.md) |
| Görseller | [`play/`](play/): `simge-512.png` (32 bit), her dilde `tanitim-gorseli-1024x500.png` ve 5 × `telefon-*.png` (1080×1920). Üretici `../araclar/magaza-gorsel.mjs` |
| Sürüm notu | [`surum-notu.txt`](surum-notu.txt) (tr-TR), öbür diller `diller/<dil>.md › Sürüm notu` |
| İlk paket | `1.1.0 (1)`: CI'ın (`kiblebul-android.yml`) gerçek AdMob kimlikleriyle derlediği imzalı AAB, artifact `KibleBul-aab` (`KibleBul.aab`) |
| Yükleme anahtarı | `KIBLEBUL_KEYSTORE_*` secret'ı, yoksa Poyraz Workshop'un ortak anahtarı (`HAYALET_KEYSTORE_*`) |

## Talimat (ortak oturumda Kıble Bul'a düşen adımlar)

### 1. AdMob
Uygulama ekle → Android → "Desteklenen bir mağazada listeleniyor mu?" **Hayır** → ad `Kıble Bul`. Reklam birimleri:
**Banner** `Kıble Bul banner` ve **Geçiş reklamı** `Kıble Bul geçiş` (ayarlar varsayılan; sıklık sınırı gerekmez,
uygulama oturumun ilk 3 dakikasında hiç, sonra en sık 4 dakikada bir ve saatte en çok 6 kez gösterir). Ödüllü ve
uygulama açılışı birimi **oluşturulmaz**.

**Kıble Bul'a özgü: hassas reklamlar.** Kıble yönü bulan bir uygulamanın kullanıcısını incitecek reklamlar
engellenir. AdMob → **Engelleme denetimleri** → **Tüm uygulamalar** değil, yalnız **Kıble Bul** için yeni bir engelleme
ayarı (uygulamaya özel; öbür uygulamalar etkilenmez) ya da hesap genelinde istenirse sahibe sorulur:
- **İçerik → Maksimum reklam içerik derecesi: G** (genel izleyici). Uygulama da her istekte G ister
  (`initialize({ maxAdContentRating: 'General' })`), panel ayarı ikinci güvencedir.
- **İçerik → Hassas kategoriler**, AdMob'un bugünkü listesine göre ([AdMob Yardım: Hassas kategoriler](https://support.google.com/admob/answer/3150953)):
  - Kısıtlanmış kategoriler (varsayılan **engelli**; **"İzin ver" basılmaz**): **Kumar ve Bahis (18+)**, **Alkol**.
  - Standart kategoriler (varsayılan açık) — **Engelle** basılır: **Flört** (Dating), **Cinsellikle ilgili** (Reference
    to sex), **Cinsel ve üreme sağlığı** (Sexual and reproductive health), **Doğum kontrolü** (Birth control),
    **Sosyal Kumarhane Oyunları** (Social Casino Games), **Astroloji ve ezoterizm** (Astrology & esoteric), **Çabuk
    zengin olma** (Get rich quick), **Kozmetik işlemler ve vücut değişimi**, **Sansasyonellik**, **Kilo verme**,
    **Siyaset**, **Önemli ölçüde açık ten** (Significant skin exposure; listede varsa).
  - **Din** (Religion) **açık bırakılır**: bu kitleye en uygun reklamların (Kur'an, namaz vakti, hac-umre) çoğu bu
    kategoridedir; başka inançların tanıtımı rahatsızlık yaratırsa sahip kapatır (açık karar, `DEGERLENDIRME.md`).
  - Listede ülkeye göre bazı kategoriler bulunmayabilir; olmayan atlanır. Kullanımdan kalkan ("Deprecated") kategoriler
    görünüyorsa onlar da engellenir.
- Engelleme reklam doluluk oranını (dolayısıyla geliri) biraz düşürür; bu bilinçli bir seçimdir (`DEGERLENDIRME.md`).

`kible-bul/android/gradle.properties`'teki üç satır gerçek kimliklerle değiştirilir, sonra:
```
node kible-bul/araclar/kimlik.mjs && node --test kible-bul/test/*.test.mjs
```
(`www/js/reklam-kimlik.js` yazılır; test ikisinin aynı olduğunu denetler.) Avrupa tüzükleri mesajına Kıble Bul da
eklenir (gizlilik politikası adresi yukarıdaki tablodan).

### 2. Play Console: uygulamayı oluştur
Ad `Kıble Bul – Kıble Pusulası`, varsayılan dil Türkçe – tr-TR, **Uygulama**, **Ücretsiz**.

### 3. İlk paket (üretim, taslak)
`KibleBul.aab` (artifact `KibleBul-aab`); paket adı `com.poyrazworkshop.kiblebul`, sürüm `1.1.0 (1)` görünmeli; sürüm
notu `surum-notu.txt`. Yalnız **Kaydet**; incelemeye gönderilmez.

### 4. Hizmet hesabı
`notdefteri-play@handcalcbook.iam.gserviceaccount.com` hesabına **Kıble Bul** eklenir (izinler ortak belgedeki gibi).

### 5. Mağaza ayarları ve Uygulama içeriği
Kategori **Yaşam Tarzı**; etiketler listede varsa "Din ve maneviyat", "Pusula", "Seyahat" gibi en uygun birkaçı.
Uygulama içeriği: [`aciklamalar.md`](aciklamalar.md) tablosu. Dikkat: IARC'de **dijital ürün satın alma: Evet**
(abonelik); reklam kimliği **Evet**; hedef kitle 13+; konum izni yalnız yaklaşık, arka planda yok. Veri güvenliği:
"CSV'den içe aktar" → `kible-bul/magaza/veri-guvenligi.csv`; hesap sorusu "hesap oluşturulamıyor". Önizlemede
"Paylaşılan / Toplanan: Konum, Uygulama etkinliği, Uygulama bilgileri ve performans, Cihaz veya diğer kimlikler"
görünmeli (konum yalnız **yaklaşık**). Ön plan hizmeti sorulursa `aciklamalar.md`'deki yanıt.

### 6. Abonelik
Para kazanma → Abonelikler → ürün kimliği **`adfree`**, ad tr "Reklamsız Üyelik" / en "Ad-free membership"; temel
planlar **`monthly`** (otomatik yenilenen, 1 ay, 0,99 USD) ve **`yearly`** (otomatik yenilenen, 1 yıl, 9,99 USD);
bütün ülkeler. Fiyat tablosu etkinleştirmeden önce kullanıcıya gösterilir ([`fiyatlandirma.md`](fiyatlandirma.md)).
Teklif (deneme süresi) eklenmez.

Sonra ortak belgedeki 7. adım: bulut oturumu `kible-bul/play-istek.txt` ile `durum` → `magaza uygula` → `gorsel
uygula` → `veriguvenligi` çalıştırır; incelemeye gönderme kullanıcıya ayrıca sorulur.

### 7. Yayından sonra (AdMob)
AdMob → Uygulamalar → Kıble Bul → **Mağaza ekle** ile Play girişine bağlanır; o zamana kadar "sınırlı reklam sunumu".
İlk haftalarda AdMob → **Reklam inceleme merkezi**'nde (Ad review center) gösterilen reklamlara göz atılır; uygunsuz bir
reklamveren görülürse oradan engellenir.

## Sonraki sürümler (yalnız GitHub)

1. `kible-bul/www/` ya da Android kodu değişir; `android/app/build.gradle`'da `versionCode` (+1) ve `versionName`,
   `www/js/ui-settings.js › VERSION` aynı sürüm (test denetler); `magaza/surum-notu.txt` ve
   `diller/<dil>.md › Sürüm notu`.
2. Push → `kiblebul-android.yml` imzalı AAB'yi derler → `play-istek.txt`'ye `yukle uygula`, kullanıcının onayıyla
   `yukle yayinla uygula`.
