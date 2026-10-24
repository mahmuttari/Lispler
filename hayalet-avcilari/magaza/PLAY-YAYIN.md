# Hayalet Avcıları — Google Play'e ilk yayın

Hesap: **Poyraz Workshop** (Not Defteri ile aynı hesap; kapalı test zorunluluğu yok → doğrudan **Üretim**).
Paket: `com.poyrazworkshop.hayaletavcilari`. Düzen Not Defteri'ninkiyle aynıdır (`magaza/PLAY-YAYIN.md`):

- **Tarayıcı işleri** (uygulamayı oluşturma, ilk AAB, Uygulama içeriği formları, hizmet hesabı izni, Firebase) →
  bilgisayardaki **Claude Code** (`claude --chrome`) aşağıdaki talimatla yapar.
- **API işleri** (mağaza metni, görseller, sonraki AAB'ler, yayına gönderme) → bulut oturumu, GitHub Actions ile
  (`hayalet-avcilari/play-istek.txt` → `.github/workflows/play-hayalet.yml` → `android/play.mjs`).

Kullanıcı bilgisayardaki oturuma yalnız şunu yazar:

> Lispler deposunun main dalını al ve `hayalet-avcilari/magaza/PLAY-YAYIN.md`'deki "Talimat" bölümünü uygula.

## Sabit bilgiler

| Alan | Değer |
|---|---|
| Uygulama adı | `Hayalet Avcıları` |
| Paket adı | `com.poyrazworkshop.hayaletavcilari` |
| Varsayılan dil | Türkçe – tr-TR |
| Uygulama / oyun · fiyat | **Oyun** · **Ücretsiz** (AdMob reklamı var, satın alma yok; README › "Reklamlar (AdMob)") |
| Kategori · etiketler | **Arcade** · Aksiyon, Gündelik (bulunanlar) |
| İletişim e-postası | `mahmuttari@gmail.com` |
| Web sitesi | `https://mahmuttari.github.io/Lispler/hayalet-avcilari/` |
| Gizlilik politikası | `https://mahmuttari.github.io/Lispler/hayalet-avcilari/gizlilik.html` |
| Hesap silme adresi | `https://mahmuttari.github.io/Lispler/hayalet-avcilari/hesap-silme.html` |
| Metinler ve form cevapları | [`aciklamalar.md`](aciklamalar.md); çeviriler [`diller/`](diller/) (en-US, es-ES, es-419, zh-CN, hi-IN, ar) |
| Görseller | [`play/`](play/): `simge-512.png`, `tanitim-gorseli-1024x500.png`, `telefon-1…6-*.png` (sırayla; 3.13.0'dan beri oyun Yeşil Orman'da, boss Mor Şato'da yeni engellerle, 6. kare Arkadaşlar); her dil için `play/<dil>/`. Üretici `araclar/magaza-gorsel.mjs` |
| Sürüm notu | [`surum-notu.txt`](surum-notu.txt) |
| İlk paket | Console'a elle yüklenen taslak: `dist/HayaletAvcilari-play.aab` **3.10.0 (36)**. Yayına giden paket CI'ın derlediği **3.10.2 (38)** (AdMob + Firebase anonim giriş): bulut oturumu `yukle` ile taslağı bununla değiştirir. Önce [`firebase/README.md` › Yayınlama](../firebase/README.md#yayınlama) 1–3 (anonim sağlayıcı, kurallar) ve Veri güvenliği formundaki "Kullanıcı kimlikleri" satırı (aşağıda, `aciklamalar.md`) |
| Yükleme anahtarı SHA-1 | `D0:88:A0:75:77:D1:89:B0:15:D4:A5:88:74:9A:1A:8C:C2:EE:56:99` |
| Yükleme anahtarı SHA-256 | `13:8C:5B:39:EA:0B:63:AC:CA:04:81:68:A5:BF:D9:F7:06:12:5A:E9:32:B9:5F:F6:C4:E1:04:D3:49:E4:80:C7` |

Gizlilik ve hesap silme sayfaları `app/hayalet-avcilari/` altındadır; GitHub Pages yalnız **main** dalından yayınlar.
Bu sayfalar açılmadan (main'e birleştirilmeden) Play formları tamamlanamaz.

## Talimat (bilgisayardaki Claude Code, `claude --chrome`)

Kurallar:
- Şifre, kart, IBAN, kimlik bilgisi girme; o alanları kullanıcıya bırak. Ödeme yapma.
- Yasal beyan kutuları, "Uygulama oluştur", kullanıcı izinleri, Play App Signing kabulü, **incelemeye gönderme /
  yayınlama** ve silme gibi geri dönüşü zor adımlardan önce dur, kullanıcının açık onayını al.
- Beklenmedik bir kutu, şart ya da güvenlik engeli çıkarsa başka yoldan deneme; dur ve sor.
- Her adımın sonunda neyin kaydedildiğini ve neyin kullanıcıya kaldığını kısaca Türkçe özetle.

### 0. Dosyalar
```
git checkout main && git pull
```
`https://mahmuttari.github.io/Lispler/hayalet-avcilari/gizlilik.html` açılmalı. Açılmıyorsa dur, kullanıcıya söyle.

### 1. Uygulamayı oluştur
https://play.google.com/console → **Poyraz Workshop** → "Uygulama oluştur": ad, dil, **Oyun**, **Ücretsiz** (tablodan).
Beyan kutularını **kullanıcı** işaretler; onayından sonra "Uygulama oluştur".

### 2. İlk paket (üretim, taslak)
Hayalet Avcıları → Test ve yayınla → **Üretim** → Ülkeler/bölgeler: **tümü** → "Yeni sürüm oluştur":
- Uygulama imzalama sorulursa Google'ın oluşturduğu anahtar (varsayılan) → **kullanıcı onayıyla**.
- App bundle: `dist/HayaletAvcilari-play.aab`. Dosya penceresini kullanamazsan kullanıcı seçer.
- Paket adı `com.poyrazworkshop.hayaletavcilari`, sürüm `3.10.0 (36)` görünmeli. Sürüm notu: `surum-notu.txt`
  (diğer dillerin notunu bulut oturumu API ile ekler).
- "Sonraki" → yalnız **Kaydet**. İncelemeye GÖNDERME.

### 3. Hizmet hesabına bu uygulamayı da ver
Play Console ana menü → **Kullanıcılar ve izinler** → `notdefteri-play@handcalcbook.iam.gserviceaccount.com` →
"Uygulama ekle" → **Hayalet Avcıları** → Not Defteri'ndeki izinlerin aynısı:
- Uygulama bilgilerini görüntüleme ve toplu raporları indirme
- Mağaza girişini yönetme
- Üretime sürüm yayınlama, cihaz hariç tutma ve Play Uygulama İmzalama'yı kullanma
- Test kanallarına sürüm yayınlama

Kaydetmeden önce **kullanıcının onayını** al.

### 4. Google ile Giriş (Firebase)
Oyundaki "Google ile Giriş" yeni paket adını ve Play'in imza anahtarını tanımalı; yoksa girişte hata verir
(oyunun geri kalanı çalışır).
1. Play Console → Hayalet Avcıları → Test ve yayınla → Kurulum → **Uygulama imzalama**: "Uygulama imzalama anahtarı
   sertifikası" **SHA-1**'ini kopyala.
2. https://console.firebase.google.com → proje **hayalet-avcilari** → Proje ayarları → Uygulamalarınız →
   **Uygulama ekle → Android**: paket `com.poyrazworkshop.hayaletavcilari`, takma ad `Hayalet Avcıları (Play)`.
   `google-services.json` indirmeye gerek yok (oyun onu kullanmıyor), adımı geç.
3. Bu Android uygulamasına **iki** SHA-1 ekle: 1. adımdaki Play imza SHA-1'i ve tablodaki yükleme anahtarı SHA-1'i.
4. Realtime Database → **Kurallar**: `accounts_google/$uid` yolunda kullanıcı kendi kaydını silebiliyor mu bak
   (`".write": "auth.uid === $uid"` gibi). Kuralları değiştirmeden önce kullanıcıya göster.

### 5. Mağaza ayarları ve Uygulama içeriği
Mağaza ayarları: kategori, etiketler, e-posta, web sitesi (tablodan) → Kaydet.
(Mağaza metni ve görselleri bulut oturumu API ile yükler; istersen elle de: Ana mağaza girişi, tablodaki dosyalar.)

Politika → Uygulama içeriği: [`aciklamalar.md` → "Google Play – Uygulama içeriği formları"](aciklamalar.md)
tablosundaki cevaplar, **Veri güvenliği** ve **Hesap silme** dahil. Beyanları göndermeden önce kullanıcıya özetle.

### 6. Bulut oturumuna devret
Kullanıcıya şunu yazdır: "Hayalet Avcıları Play kurulumu tamam." Bulut oturumu `hayalet-avcilari/play-istek.txt`
ile sırasıyla `durum` → `magaza uygula` → `gorsel uygula` çalıştırır (Türkçe + 6 çeviri dili: metin ve görseller); eksik kalan bir şey yoksa incelemeye gönderme
kararını kullanıcıya sorar (`yukle yayinla uygula` ya da Console'da "İncelemeye gönder").

## Neden ilk adımlar tarayıcıda?

Google Play Developer API yeni uygulama **oluşturamaz** ve Console'da hiç paket yüklenmemiş uygulamayı **görmez**
("Package not found"; 19 Ekim 2026'da GitHub'dan `durum` ile doğrulandı: Google kimliği çalışıyor, uygulama yok).
Bu yüzden 1-5. adımlar bir kez Console'da yapılır; sonrası (mağaza metni, görseller, yeni sürümler, yayına gönderme)
tamamen GitHub üzerinden yürür. Bu, NetcadDevelop/DWG Office Zip'te de aynıydı.

## Sonraki sürümler (yalnız GitHub)

`www/game.js`'te `APP_VERSION` ve `UPDATE_NOTES` (yeni metinler 5 dile: `araclar/sozluk.mjs`), `android/app/build.gradle`'da `versionCode` (+1) ve `versionName` →
push → `hayalet-android.yml` imzalı AAB'yi derler (secret'lar: `README.md` › "GitHub üzerinden") →
`play-istek.txt`'ye `yukle uygula`, onayla `yukle yayinla uygula`. AAB elle hiçbir yere taşınmaz.
