# Kelime Bilcek — Google Play'e ilk yayın (Poyraz Workshop)

Kararlar (kullanıcı, 4 Kasım 2026): **yeni paketle taşıma** (Google'ın aktarımı yok; Hayalet Avcıları da böyle
taşındı); MARFEN'deki eski taslak (`com.oyundar.kelimebilcek`, app 4974029694274274848, hiç yayınlanmadı) yeni uygulama
yayına girince silinir. Reklam kuralları: [`../www/reklam.js`](../www/reklam.js).

| Alan | Değer |
|---|---|
| Hesap | Poyraz Workshop (geliştirici `6245686895756048334`; kişisel, kapalı test şartı yok → doğrudan Üretim) |
| Uygulama adı | Kelime Bilcek |
| Paket | `com.poyrazworkshop.kelimebilcek` |
| Varsayılan dil · tür · fiyat | Türkçe – tr-TR · **Oyun** (kategori **Kelime**) · Ücretsiz |
| Web sitesi · e-posta | https://kelime-bilcek.web.app · poyrazworkshop7@gmail.com |
| Gizlilik politikası | https://kelime-bilcek.web.app/gizlilik.html |
| Hesap silme | https://kelime-bilcek.web.app/hesap-silme.html |
| Metinler · görseller | [`aciklamalar.md`](aciklamalar.md) · [`play/`](play/) (simge 512, tanıtım 1024×500, 5 telefon karesi 1080×1920; üretici `../araclar/magaza-gorsel.mjs`) |
| Veri güvenliği | [`veri-guvenligi.csv`](veri-guvenligi.csv) (API ile: `play-istek.txt` › `veriguvenligi uygula`) |
| İlk paket | `1.0.0 (1)`: `kelime-android.yml`'in gerçek AdMob kimlikleriyle derlediği imzalı AAB (artifact `KelimeBilcek-aab`) |
| Yükleme anahtarı | Poyraz Workshop (secret `HAYALET_KEYSTORE_*`), SHA-1 `D0:88:A0:75:77:D1:89:B0:15:D4:A5:88:74:9A:1A:8C:C2:EE:56:99` |

## Kim ne yapar?

- **API ile (bulut oturumu, GitHub Actions):** kurallar, site, Firebase Android uygulaması + SHA, mağaza metni,
  görseller, Veri güvenliği, sonraki AAB'ler, incelemeye gönderme.
- **Tarayıcıyla (bilgisayardaki Claude, `mahmuttari@gmail.com` oturumu):** AdMob uygulaması, reklam birimleri ve AB
  mesajı (API yok); Play'de uygulamayı oluşturma, ilk AAB, hizmet hesabı izni, Uygulama içeriği beyanları (reklam,
  AD_ID, hedef kitle, IARC); Cloudflare Worker yayını; MARFEN taslağını silme. Google Play Developer API uygulama
  oluşturamaz ve hiç paketi olmayan uygulamayı görmez.
- **Kullanıcı:** Cloud Shell'de IAM rolleri ([`../firebase/README.md`](../firebase/README.md) › Kurulum); yasal beyan
  kutuları; incelemeye gönderme onayı.

## Talimat (tarayıcı — bilgisayardaki Claude)

Kurallar: şifre, kart, kimlik bilgisi girilmez; "Uygulama oluştur", izinler, Play App Signing, AdMob mesajını yayınlama,
beyanlar, incelemeye gönderme ve silme gibi geri dönüşü zor adımlardan önce kullanıcının açık onayı alınır; beklenmedik
bir engelde durulur ve sorulur.

### 1. AdMob (`pub-2417242373034448`)
1. **Uygulamalar → Uygulama ekle** → Android → "Desteklenen bir mağazada listeleniyor mu?" **Hayır** → ad
   `Kelime Bilcek` → uygulama kimliği `ca-app-pub-2417242373034448~…`.
2. **Reklam birimleri**: **Geçiş reklamı** `Kelime Bilcek geçiş` ve **Banner** `Kelime Bilcek banner` (ayarlar
   varsayılan; sıklığı uygulama sınırlar: ilk 3 maçta yok, ≥5 dk ara, saatte ≤4).
3. **Gizlilik ve mesajlaşma → Avrupa tüzükleri** → yeni mesaj: uygulama Kelime Bilcek, diller Türkçe + İngilizce,
   gizlilik politikası `https://kelime-bilcek.web.app/gizlilik.html` → kullanıcının onayıyla **Yayınla**.
4. Üç kimlik bulut oturumuna verilir; oturum `android/app/src/main/AndroidManifest.xml` (uygulama kimliği) ve
   `www/reklam.js` (`gecisId`, `bannerId`) dosyalarına yazar, CI imzalı AAB üretir (`surum.txt` › `admob=gercek`).

### 2. Play Console (Poyraz Workshop)
1. **Uygulama oluştur**: ad `Kelime Bilcek`, Türkçe – tr-TR, **Oyun**, **Ücretsiz**; beyan kutularını kullanıcı işaretler.
2. **Üretim → Ülkeler: tümü → Yeni sürüm**: Play App Signing (Google'ın anahtarı, kullanıcı onayıyla); AAB:
   `kelime-android.yml` koşusunun `KelimeBilcek-aab` artifact'ındaki `KelimeBilcek.aab`; sürüm `1.0.0 (1)`; sürüm notu
   [`surum-notu.txt`](surum-notu.txt) → yalnız **Kaydet** (incelemeye gönderme).
3. **Kullanıcılar ve izinler** → `notdefteri-play@handcalcbook.iam.gserviceaccount.com` → Uygulama ekle → Kelime
   Bilcek → İz Haritası'ndaki beş izin: uygulama bilgilerini görüntüleme ve toplu raporlar; mağaza girişini yönetme;
   üretime yayınlama, cihaz hariç tutma ve Play Uygulama İmzalama; test kanallarına yayınlama; taslak uygulamaları
   düzenleme ve silme. Kaydetmeden önce kullanıcıya sor.
4. **Mağaza ayarları**: kategori **Kelime**, e-posta ve web sitesi (tablodan).
5. **Uygulama içeriği** (yanıtlar aşağıda; göndermeden önce kullanıcıya özetlenir, onayıyla kaydedilir).

### 3. Cloudflare
`../worker/README.md` › Yayın (editöre `worker/worker.js`'in tamamı → Deploy).

### 4. Yayından sonra
- AdMob → Uygulamalar → Kelime Bilcek → **Mağaza ekle** (Play girişi) → **app-ads.txt › Güncellemeleri kontrol edin**.
- MARFEN hesabı (`7263444126314683368`) → `com.oyundar.kelimebilcek` (app 4974029694274274848) → Ayarlar › **Uygulamayı
  sil** (hiç yayınlanmadığı için silinebilir) → kullanıcı onayıyla.

## Uygulama içeriği yanıtları (öneri; kullanıcı onaylar)

| Form | Yanıt |
|---|---|
| Gizlilik politikası | https://kelime-bilcek.web.app/gizlilik.html |
| Reklamlar | **Evet, uygulamam reklam içeriyor** (AdMob) |
| Uygulama erişimi | Bazı işlevler kısıtlı: Google ile giriş gerekir. İnceleme için talimat: "Herhangi bir Google hesabıyla giriş yapın, kullanıcı adı seçin; Hızlı Eşleşme için ikinci bir cihaz/hesap gerekir, Oda Kodu ile tek cihazda bekleme ekranı görülebilir." |
| Reklam kimliği (AD_ID) | **Evet** → amaç: **Reklam veya pazarlama** (+ Analiz, Dolandırıcılığı önleme: AdMob SDK) |
| Hedef kitle ve içerik | 13-15, 16-17, 18+ (13 altı seçilmez); çocuklara yönelik değil |
| İçerik derecelendirmesi (IARC) | Kategori **Oyun**; şiddet, cinsellik, küfür, uyuşturucu, kumar yok; **kullanıcılar etkileşime geçer: Evet** (çevrimiçi rakip, kullanıcı adı ve yazılan kelimeler rakibe görünür; sohbet yok); konum paylaşımı yok; dijital satın alma yok. Beklenen: PEGI 3 / ESRB Everyone (etkileşim uyarısıyla) |
| Veri güvenliği | `veri-guvenligi.csv`: toplanır — ad, e-posta, kullanıcı kimlikleri (hesap yönetimi, zorunlu); yaklaşık konum, kilitlenme kayıtları, tanılama, uygulama etkileşimleri, cihaz/reklam kimliği (AdMob: toplanır **ve paylaşılır**; reklam, analiz, dolandırıcılığı önleme); diğer kullanıcı içeriği (yazılan kelimeler) ve diğer işlemler (maç sonuçları) (uygulama işlevi). Aktarımda şifreli: Evet. Silme isteği: Evet. Hesap oluşturma: **OAuth (Google ile giriş)**; hesap silme adresi tablodan |
| Hesap silme | https://kelime-bilcek.web.app/hesap-silme.html (uygulama içi: profil › 🗑️ Hesabı Sil) |
| Haber uygulaması / Sağlık / Finans / Devlet | Hayır |
