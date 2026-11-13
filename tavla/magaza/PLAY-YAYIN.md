# Tavla — Google Play'e ilk yayın (Poyraz Workshop)

Kaynak: kullanıcının `app-debug.apk`'sı (`com.korfe.tavla` 1.0 (1), Capacitor + React, Firebase `tavla-online-oyundar`;
eski adres `D:\mahmuttari\OYUNDAR\app-debug.apk`). Kaynak kodu bulunmadığı için web paketi APK'dan çıkarıldı, okunur
biçime getirildi ve üzerinde düzeltildi ([`../DENETIM.md`](../DENETIM.md)). Yeni paket `com.poyrazworkshop.tavla`.
**Reklamlı** (kullanıcı, 4 Kasım 2026: "tavla da da reklam olacak"): Google AdMob, Kelime Bilcek'in kuralları
([`../www/reklam.js`](../www/reklam.js)): oyun sırasında hiç reklam yok; banner yalnız ana menünün altında; geçiş reklamı
yalnız maç bitince, ilk 3 maçta yok, en az 5 dk ara, saatte en çok 4; AB onayı (UMP).

| Alan | Değer |
|---|---|
| Hesap | Poyraz Workshop (kişisel, kapalı test şartı yok → doğrudan Üretim) |
| Uygulama adı | Tavla – Sesli Kahvehane |
| Paket | `com.poyrazworkshop.tavla` |
| Varsayılan dil · tür · fiyat | Türkçe – tr-TR · **Oyun** (kategori **Masa oyunu**) · Ücretsiz |
| Web sitesi · e-posta | https://mahmuttari.github.io/Lispler/tavla/ · poyrazworkshop7@gmail.com |
| Gizlilik politikası | https://mahmuttari.github.io/Lispler/tavla/gizlilik.html |
| Hesap silme | https://mahmuttari.github.io/Lispler/tavla/hesap-silme.html |
| Metinler · görseller | [`aciklamalar.md`](aciklamalar.md) · [`play/`](play/) (simge 512, tanıtım 1024×500, 6 yatay telefon karesi 1920×1080; üretici `../araclar/magaza-gorsel.mjs`) |
| Veri güvenliği | [`veri-guvenligi.csv`](veri-guvenligi.csv) (`../araclar/veri-guvenligi.mjs`; API ile `play-istek.txt` › `veriguvenligi uygula`) |
| İlk paket | `1.0.0 (1)`: `tavla-android.yml`'in google-services.json ve gerçek AdMob kimlikleriyle derlediği imzalı AAB (artifact `Tavla-aab`, `surum.txt` › `firebase=var`, `admob=gercek`) |
| Yükleme anahtarı | Poyraz Workshop (secret `HAYALET_KEYSTORE_*`), SHA-1 `D0:88:A0:75:77:D1:89:B0:15:D4:A5:88:74:9A:1A:8C:C2:EE:56:99` |

> Site sayfaları (`app/tavla/`) GitHub Pages'e yalnız **main** dalından çıkar (`pages.yml`): Play'e gizlilik adresi
> girilmeden önce bu dalın birleştirilmesi gerekir.

## Sıra ve kim ne yapar

| # | İş | Kim / nasıl |
|---|---|---|
| 1 | Dalı main'e birleştir (site yayına girer) | Kullanıcı (PR) |
| 2 | `tavla-online-oyundar` projesinde hizmet hesabına roller | Kullanıcı, Cloud Shell ([`../firebase/README.md`](../firebase/README.md) › Kurulum) |
| 3 | Firebase'e Android uygulaması + yükleme anahtarı SHA-1 + google-services.json | Bulut oturumu: `firebase/uygulama-istek.txt` › `android ekle`, `sha ekle d088a0…5699`, `yapilandirma` |
| 4 | Sıkı Firestore kuralları | Bulut oturumu: `firebase/yayin-istek.txt` › `durum`, sonra `yayinla` (testler geçerse) |
| 5 | İmzalı AAB | Otomatik: google-services.json commit'i `tavla-android.yml`'i tetikler |
| 6 | Play Console: uygulamayı oluştur, ilk AAB, hizmet hesabı izni, Uygulama içeriği | Bilgisayardaki Claude (aşağıdaki talimat) + kullanıcı onayı |
| 7 | Mağaza metni, görseller, Veri güvenliği | Bulut oturumu: `play-istek.txt` › `magaza uygula`, `gorsel uygula`, `veriguvenligi uygula` |
| 8 | Play imzasının SHA-1'i Firebase'e (Play'den kurulan uygulamada Google ile giriş) | Bulut oturumu: `play-istek.txt` › `imza` → `uygulama-istek.txt` › `sha ekle …`, `yapilandirma` |
| 9 | İncelemeye gönder | **Yalnız kullanıcının açık onayıyla**: `yukle yayinla uygula` ya da Console |

## Talimat (tarayıcı — bilgisayardaki Claude, `claude --chrome`)

Kullanıcı bilgisayardaki oturuma şunu yazar:

> Lispler deposunun main dalını al ve `tavla/magaza/PLAY-YAYIN.md`'deki "Talimat" bölümünü uygula.

Kurallar: şifre, kart, kimlik bilgisi girilmez; "Uygulama oluştur", izinler, Play App Signing, beyanlar, incelemeye
gönderme ve silme gibi geri dönüşü zor adımlardan önce kullanıcının açık onayı alınır; beklenmedik bir engelde durulur
ve sorulur. Her adımdan sonra neyin kaydedildiği kısaca Türkçe özetlenir.

### 0. AdMob (`pub-2417242373034448`, Poyraz Workshop)
1. https://admob.google.com → **Uygulamalar → Uygulama ekle** → Android → "Desteklenen bir mağazada listeleniyor mu?"
   **Hayır** → ad `Tavla` → uygulama kimliği `ca-app-pub-2417242373034448~…`.
2. **Reklam birimleri**: **Geçiş** `Tavla geçiş` ve **Banner** `Tavla banner` (ayarlar varsayılan; sıklığı uygulama sınırlar).
3. **Gizlilik ve mesajlaşma → Avrupa tüzükleri**: mevcut mesaja Tavla'yı ekle ya da yeni mesaj (Türkçe + İngilizce,
   gizlilik politikası tablodaki adres) → kullanıcının onayıyla **Yayınla**.
4. Üç kimliği bulut oturumuna ver: uygulama kimliği `android/app/src/main/AndroidManifest.xml`'e, birim kimlikleri
   `www/reklam.js` (`gecisId`, `bannerId`) dosyasına yazılır; CI `admob=gercek` ile imzalı AAB üretir. İlk paket bu AAB olmalı.

### 1. Uygulamayı oluştur
https://play.google.com/console → **Poyraz Workshop** → "Uygulama oluştur": ad `Tavla – Sesli Kahvehane`, Türkçe – tr-TR,
**Oyun**, **Ücretsiz**. Beyan kutularını **kullanıcı** işaretler; onayından sonra "Uygulama oluştur".

### 2. İlk paket (üretim, taslak)
Tavla → Test ve yayınla → **Üretim** → Ülkeler/bölgeler: **tümü** → "Yeni sürüm oluştur":
- Uygulama imzalama sorulursa Google'ın oluşturduğu anahtar (varsayılan) → **kullanıcı onayıyla**.
- App bundle: GitHub › Actions › "Android (Tavla)" son başarılı koşu › artifact **Tavla-aab** › `Tavla.aab`
  (`surum.txt`'te `firebase=var` olmalı). Dosya penceresini kullanamazsan kullanıcı seçer.
- Paket adı `com.poyrazworkshop.tavla`, sürüm `1.0.0 (1)` görünmeli. Sürüm notu: [`surum-notu.txt`](surum-notu.txt).
- "Sonraki" → yalnız **Kaydet**. İncelemeye GÖNDERME.

### 3. Hizmet hesabını davet et
Play Console ana menü → **Kullanıcılar ve izinler** → `notdefteri-play@handcalcbook.iam.gserviceaccount.com` (zaten
varsa düzenle) → "Uygulama ekle" → Tavla → yalnız: uygulama bilgilerini görüntüleme ve toplu raporlar; mağaza girişini
yönetme; üretime yayınlama, cihaz hariç tutma ve Play Uygulama İmzalama; test kanallarına yayınlama. Kaydetmeden önce
kullanıcıya sor.

### 4. Mağaza ayarları
Kategori **Masa oyunu**, etiketler (bulunanlar: Tavla, Masa oyunu, Zar), e-posta ve web sitesi (tablodan) → Kaydet.
(Mağaza metni ve görselleri bulut oturumu API ile yükler.)

### 5. Uygulama içeriği
[`aciklamalar.md`](aciklamalar.md) › "Uygulama içeriği" tablosu. Özellikle:
- **Reklamlar: Evet.** **Reklam kimliği: Evet** → Reklam veya pazarlama (+ Analiz, Dolandırıcılığı önleme).
- **Uygulama erişimi:** tüm işlevler özel erişim olmadan (misafir girişi). İnceleme notu: "Giriş gerekmez. Çevrimiçi
  oyun için iki cihazda Çevrimiçi › Oda Kur (kod ile) / Kodla Katıl; sohbet penceresinde ⚠️ Şikâyet ve 🚫 Engelle,
  ana menüde yeşil bulut düğmesi › Gizlilik ve hesap › 🗑️ Hesabı sil."
- **IARC:** kullanıcılar etkileşim kurar **Evet** (yazılı + sesli sohbet, rumuz); kumar **Hayır** (para, bahis, jeton
  yok). Beklenen: PEGI 3 / ESRB Everyone + "Kullanıcılar etkileşime geçer".
- **Hedef kitle:** 13-15, 16-17, 18+; çocuklara hitap etmiyor.
- **Veri güvenliği:** API ile yüklenir; Console'da yalnız **Hesap oluşturma yöntemi**ne "Kullanıcı adı ve şifre"yi de
  işaretle (şablonda yalnız OAuth var; oyunda e-posta + şifre ile yedekleme de var) ve hesap silme adresini doğrula.
Beyanları göndermeden önce kullanıcıya özetle.

### 6. Eski paket
Gerekmez: `com.korfe.tavla` hiçbir Play hesabında yayında ya da taslak değil (kullanıcı, 4 Kasım 2026).

## Kullanıcı Oluşturulan İçerik (UGC) — moderasyon sözü

Play, sohbetli uygulamada şikâyet ve engellemenin yanında şikâyetlerin **incelenmesini** ister. Şikâyetler Firestore
`reports` koleksiyonuna düşer (istemci okuyamaz); inceleme ve yaptırım [`../firebase/README.md`](../firebase/README.md) ›
Moderasyon. En az haftada bir, tercihen her gün bakılmalı.

## Yayından sonra
- AdMob → Uygulamalar → Tavla → **Mağaza ekle** (Play girişi). `app-ads.txt` isteğe bağlıdır: AdMob onu geliştirici sitesinin
  kök alanında arar (`https://mahmuttari.github.io/app-ads.txt`), bu depo oraya yayın yapamaz (İz Haritası'ndaki not). Eksikliği
  reklamı durdurmaz; AdMob panelde uyarı gösterir.

## Sonraki sürümler
`android/app/build.gradle`'da `versionCode` +1 ve `versionName`; `www/…` içindeki `TV_SURUM`; `package.json` `version`
(`test/magaza.test.mjs` üçünü karşılaştırır); `magaza/surum-notu.txt`; push → imzalı AAB → `play-istek.txt` ›
`yukle uygula`, kullanıcının onayıyla `yukle yayinla uygula`.
