# Not Defteri — Google Play'e üretim yayını

Hesap: **Poyraz Workshop** (eski hesap, kapalı test zorunluluğu yok → doğrudan **Üretim**).
Paket: `com.poyrazworkshop.notdefteri`. Düzen GENEL-KONULAR/Takasla ile aynıdır:

- **Tarayıcı işleri** (API'nin yapamadıkları: AdMob, uygulamayı oluşturma, ilk AAB, Uygulama içeriği formları,
  abonelik, hizmet hesabı daveti) → bilgisayardaki **Claude Code** (`claude --chrome`) aşağıdaki talimatla yapar.
- **API işleri** (mağaza metni, görseller, sonraki AAB'ler, durum) → bulut oturumu, GitHub Actions ile
  (`android/play-istek.txt` → `.github/workflows/play.yml` → `android/play.mjs`).

Kullanıcı bilgisayardaki oturuma yalnız şunu yazar:

> Lispler deposunun main dalını al ve `magaza/PLAY-YAYIN.md`'deki "Talimat" bölümünü uygula.

## Sabit bilgiler

| Alan | Değer |
|---|---|
| Uygulama adı | `Not Defteri – HTML Çalıştır` |
| Paket adı | `com.poyrazworkshop.notdefteri` |
| Varsayılan dil | Türkçe – tr-TR |
| Uygulama / oyun · fiyat | Uygulama · **Ücretsiz** (Pro aboneliği uygulama içinde) |
| Kategori · etiketler | **Verimlilik** · Metin düzenleyici, Not alma, Geliştirici araçları (bulunanlar) |
| İletişim e-postası | `mahmuttari@gmail.com` |
| Web sitesi | `https://mahmuttari.github.io/Lispler/` |
| Gizlilik politikası | `https://mahmuttari.github.io/Lispler/gizlilik.html` |
| Metinler | [`aciklamalar.md`](aciklamalar.md) (kısa ≤80, uzun ≤4000 karakter) |
| Görseller | [`play/`](play/): `simge-512.png`, `tanitim-gorseli-1024x500.png`, `telefon-1…6-*.png` (sırayla) |
| Sürüm notu | [`surum-notu.txt`](surum-notu.txt) |
| Abonelik | `notdefteri.pro.aylik`, temel plan `aylik` — fiyatlar [`fiyatlandirma.md`](fiyatlandirma.md) |

## Talimat (bilgisayardaki Claude Code, `claude --chrome`)

Kurallar:
- Şifre, kart, IBAN, kimlik bilgisi girme; o alanları kullanıcıya bırak. Ödeme yapma.
- Yasal beyan kutuları, "Uygulama oluştur", "Kullanıcıyı davet et", Play App Signing kabulü, **incelemeye gönderme /
  yayınlama** ve silme gibi geri dönüşü zor adımlardan önce dur, kullanıcının açık onayını al.
- Beklenmedik bir kutu, şart ya da güvenlik engeli çıkarsa başka yoldan deneme; dur ve sor.
- Her adımın sonunda neyin kaydedildiğini ve neyin kullanıcıya kaldığını kısaca Türkçe özetle.

### 0. Dosyalar
```
git checkout main && git pull
```

### 1. AdMob — gerçek reklam kimlikleri
https://admob.google.com (Poyraz Workshop'un AdMob hesabı):
1. Uygulamalar → **Uygulama ekle** → Android → "Desteklenen bir mağazada listeleniyor mu?" **Hayır** → ad `Not Defteri`.
2. Bu uygulamada 3 reklam birimi: **Banner** (`Not Defteri banner`), **Geçiş** (`Not Defteri geçiş`),
   **Uygulama açılışı** (`Not Defteri açılış`). Gelişmiş ayarlar varsayılan.
3. Gizlilik ve mesajlaşma → **Avrupa düzenlemeleri (GDPR)** mesajı: bu uygulamayı seç, gizlilik politikası adresi
   yukarıdaki, dil Türkçe + İngilizce → yayınla (onay öncesi dur).
4. Uygulama kimliğini (`ca-app-pub-…~…`) ve 3 birim kimliğini (`ca-app-pub-…/…`)
   `android/gradle.properties`'teki `ADMOB_APP_ID`, `ADMOB_BANNER_ID`, `ADMOB_INTERSTITIAL_ID`, `ADMOB_APP_OPEN_ID`
   satırlarına yaz; `git commit -m "AdMob gerçek kimlikleri" && git push origin main`. Kimlikleri kullanıcıya da yaz.
5. Bulut oturumu (Claude, claude.ai/code) AAB'yi bu kimliklerle yeniden derleyip `dist/NotDefteri-play.aab`'ye
   koyar. Bu sırada 2–4. adımlara devam et; 5. adımdan önce `git pull` ile yeni AAB'yi al
   (`git log -1 -- dist/NotDefteri-play.aab` iletisinde "AdMob" geçmeli).

### 2. Uygulamayı oluştur
https://play.google.com/console → **Poyraz Workshop** → "Uygulama oluştur": ad, dil, Uygulama, Ücretsiz (tablodan).
Beyan kutularını **kullanıcı** işaretler; onayından sonra "Uygulama oluştur".

### 3. Google Cloud: API erişimi (bir kez)
https://console.cloud.google.com → üstte bir proje seç (yoksa kullanıcıya sor; ör. "poyraz-play" adıyla yeni proje)
→ **Cloud Shell (>_)** → `android/play-kurulum.sh`'nin içeriğini yapıştırıp çalıştır. Sonda yazan iki satırı
(`PLAY_WIF_PROVIDER=…`, `PLAY_SERVICE_ACCOUNT=…`) `android/play-kimlik.env`'ye yaz, commit + push.

### 4. Hizmet hesabını davet et
Play Console ana menü → **Kullanıcılar ve izinler** → "Yeni kullanıcıları davet et":
- E-posta: 3. adımdaki `PLAY_SERVICE_ACCOUNT` (`notdefteri-play@…iam.gserviceaccount.com`)
- Hesap izinleri: hiçbiri. "Uygulama ekle" → Not Defteri → yalnız:
  - Uygulama bilgilerini görüntüleme ve toplu raporları indirme
  - Mağaza girişini yönetme (Manage store presence)
  - Üretime sürüm yayınlama, cihaz hariç tutma ve Play Uygulama İmzalama'yı kullanma
  - Test kanallarına sürüm yayınlama
- "Kullanıcıyı davet et" → **kullanıcının onayıyla**.

### 5. İlk paket (üretim, taslak)
Not Defteri → Test ve yayınla → **Üretim** → Ülkeler/bölgeler: **tümü** → "Yeni sürüm oluştur":
- Uygulama imzalama sorulursa Google'ın oluşturduğu anahtar (varsayılan) → **kullanıcı onayıyla**.
- App bundle: `dist/NotDefteri-play.aab` (AdMob kimlikli olanı). Dosya penceresini kullanamazsan kullanıcı seçer.
- Paket adı `com.poyrazworkshop.notdefteri`, sürüm `1.2 (3)` görünmeli. Sürüm notu: `magaza/surum-notu.txt`.
- "Sonraki" → yalnız **Kaydet**. İncelemeye GÖNDERME.

### 6. Mağaza ayarları ve Uygulama içeriği
Mağaza ayarları: kategori, etiketler, e-posta, web sitesi (tablodan) → Kaydet.
(Mağaza metni ve görselleri bulut oturumu API ile yükler; istersen elle de: Ana mağaza girişi, tablodaki dosyalar.)

Politika → Uygulama içeriği:

| Bölüm | Cevap |
|---|---|
| Gizlilik politikası | tablodaki adres |
| Uygulama erişimi | Tüm işlevler özel erişim olmadan kullanılabilir |
| Reklamlar | **Evet, reklam içeriyor** |
| İçerik derecelendirmesi (IARC) | Kategori: Diğer / Yardımcı program. Şiddet, cinsellik, küfür, uyuşturucu, kumar: Hayır. Kullanıcılar birbiriyle etkileşim / içerik paylaşımı: **Hayır** (içerik yalnız cihazda). Konum paylaşımı: Hayır. Dijital ürün satın alma: **Evet** |
| Hedef kitle | **13-15, 16-17, 18 ve üzeri** (13 altı seçme) · Çocuklara hitap etmiyor |
| Haber uygulaması | Hayır |
| Veri güvenliği | [`aciklamalar.md` → "Google Play – Veri güvenliği formu"](aciklamalar.md) |
| Reklam kimliği | Evet → **Reklam veya pazarlama** |
| Kamu uygulaması · Finansal özellikler · Sağlık | Hayır · Yok · Yok |

Beyanları göndermeden önce kullanıcıya özetle.

### 7. Abonelik
Para kazanma → Ürünler → **Abonelikler** → [`fiyatlandirma.md`](fiyatlandirma.md)'deki adımlar. Ödeme profili
yoksa dur ve kullanıcıya sor. Temel planı etkinleştirmeden önce fiyatları kullanıcıya göster.

### 8. Bulut oturumuna devret
Kullanıcıya şunu yazdır: "Play kurulumu tamam; play-kimlik.env push edildi." Bulut oturumu sırasıyla
`durum` → `magaza uygula` → `gorsel uygula` çalıştırır; eksik kalan bir şey yoksa incelemeye gönderme kararını
kullanıcıya sorar (`yukle yayinla uygula` ya da Console'da "İncelemeye gönder").

## Bulut oturumu (API) komutları

`android/play-istek.txt`'ye yazıp push et; sonuç Actions → "Google Play (Not Defteri)" günlüğünde.

| Komut | Ne yapar |
|---|---|
| `durum` | salt okuma: ayrıntılar, kanallar, paketler, diller, görsel sayıları |
| `magaza uygula` | iletişim (e-posta, site, dil) + tr-TR mağaza metni |
| `gorsel uygula` | simge, öne çıkan görsel, 6 telefon ekran görüntüsü |
| `yukle uygula` | `dist/NotDefteri-play.aab` → üretim kanalına **taslak** (`dahili` ile dahili test) |
| `yukle yayinla uygula` | sürümü incelemeye/yayına gönderir — **yalnız kullanıcının açık onayıyla** |
| `imza` | Play uygulama imzalama anahtarının SHA-256'sı |

Sonraki sürümlerde: `versionCode`'u artır → AAB'yi derle → `dist/`'e koy → `yukle uygula` → onayla `yukle yayinla uygula`.
