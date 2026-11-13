# Tavla — denetim raporu (1.0.0)

Hazırlandı: 4 Kasım 2026. Kaynak: kullanıcının yüklediği `app-debug.apk` (24,5 MB; `com.korfe.tavla` 1.0 (1), hedef API
36, en düşük 24; Capacitor + React + Vite, Firebase `tavla-online-oyundar`). Kaynak kodu yok: `assets/public` alındı,
2 MB'lık küçültülmüş paket prettier ile okunur biçime getirildi (ilk commit, değişmemiş hâl) ve düzeltmeler bunun
üzerine yapıldı. Kendi yazdığım bölümler okunur adlarla (`tv…`) ve açıklamalarla, `www/assets/index-BLMBGPAE.js`
içinde ("Poyraz Workshop 1.0.0 — güvenlik bölümü").

## Denetimler

| Araç | Ne denetler | Nerede | Sonuç |
|---|---|---|---|
| `node --test test/arayuz.test.mjs` | Menü, hesap penceresi (gizlilik, iletişim, engellenenler, hesap silme), bilgisayara karşı oyun; yatay taşma, sayfa hatası | `tavla-denetim.yml` | 3/3 |
| `node --test test/magaza.test.mjs` | Metin sınırları, görsel ölçüleri, adres tutarlılığı, sürüm, hata ayıklama ve AD_ID | `tavla-denetim.yml` | 5/5 |
| Firestore emülatörü + `@firebase/rules-unit-testing` | Kurallar, saldırılar dahil | `tavla-denetim.yml`, yayından önce `tavla-kural-yayini.yml` | 13/13 |
| Emülatör + Playwright (iki tarayıcı) | Oda kur, kodla katıl, sohbet, şikâyet, engelleme, hesap silme; konsolda izin hatası yok | aynı | 1/1 |
| `araclar/veri-guvenligi.mjs --denetle` | Veri güvenliği CSV'si tabloyla aynı | `tavla-denetim.yml` | tamam |
| Android derlemesi | `assembleRelease bundleRelease` | `tavla-android.yml` | CI'da (yerelde Android SDK yok) |

## Bulgular ve düzeltmeler

| No | Önem | Bulgu (APK) | Düzeltme (1.0.0) |
|---|---|---|---|
| T-01 | Yüksek (Play, UGC) | Yazılı ve sesli sohbet var ama **şikâyet ve engelleme yok**. | Sohbet penceresinde rakibin adı, **⚠️ Şikâyet** (neden, not, son 20 mesaj; isteğe bağlı engelle → `reports`) ve **🚫 Engelle**. Engellenenin mesajı, sesli sohbet isteği, arkadaşlık ve oyun daveti görünmez; hızlı eşleşme onun odasına düşmez; kurallar da engelleyene davet/istek/odaya katılmayı reddeder. Hesap penceresinde engellenenler listesi ve "Engeli kaldır". |
| T-02 | Yüksek (Play) | Hesap açılabiliyor (e-posta, Google) ama **hesap silme yok**. | Hesap penceresi › Gizlilik ve hesap › **🗑️ Hesabı sil**: arkadaşların listesindeki kayıt, arkadaş listesi, davetler, engeller, arkadaşlık istekleri, odalar (mesaj ve WebRTC belgeleriyle), rumuz, kullanıcı kaydı, telefondaki `tavla_*` ayarları, en son Firebase hesabı. "Yeniden giriş gerekli" hatasında veri yine silinir, kullanıcıya ne yapacağı söylenir. Web: `app/tavla/hesap-silme.html`. |
| T-03 | Yüksek (Play) | Gizlilik politikası yok. | `app/tavla/gizlilik.html` (TR + EN); uygulamada bağlantı. |
| T-04 | Kritik (güvenlik) | Depoda kural yok; istemci her şeyi doğrudan yazıyor (puan, sohbet yasağı sayacı, odalar). Yayındaki kurallar bilinmiyor. | `firebase/firestore.rules`: yol yol izin; puan ±2, sayaçlar +1; süren sohbet yasağı kısaltılamaz ve sunucuda da uygulanır; sohbeti yalnız oda üyeleri okur/yazar; konuk sonradan değiştirilemez; şikâyet yalnız oluşturulur. Yayın: `tavla-kural-yayini.yml` (önce `durum` ile yayındakine bakılır). |
| T-05 | Orta | Hata ayıklama: `debuggable=true` (debug derlemesi), `webContentsDebuggingEnabled: true`, alt bilgide "v2 · pas-and-play, AI ve oda-kod modu". | Yayın derlemesi, WebView hata ayıklaması kapalı, alt bilgi "Tavla 1.0.0 · Poyraz Workshop". |
| T-06 | Orta (gizlilik) | Avatar adresinde Firebase kullanıcı kimliği (kendininki ve arkadaşlarınınki) olduğu gibi `api.dicebear.com`'a gidiyordu. | Tohum tek yönlü özetten geçer (`tvAvatarTohumu`); avatar her oyuncuda yine sabit. |
| T-08 | Yüksek (içerik) | 1.0.0'da avatarlar DiceBear'den rastgele geliyordu; "Karikatür" stili başörtülü kadın gibi uygulamaya uymayan figürler, rakip/arkadaş avatarı da hep bu stil (kullanıcı, 6.11). | 1.0.1: DiceBear tamamen kaldırıldı; avatarlar uygulama içinde SVG olarak çizilir (Pul, Zar, Kahve, Çay; insan figürü yok, tohum yalnız renk/zar sayısı seçer). Eski stil adları varsayılana düşer; dış istek yok. |
| T-07 | Orta | Rumuzda argo denetimi yoktu (sohbette vardı). | Rumuz kaydında aynı argo filtresi. |
| T-08 | Düşük (erişilebilirlik) | `maximum-scale=1, user-scalable=no`; sohbet kapatma düğmesi ve mesaj kutusu adsız. | Kaldırıldı; `aria-label`'lar; yeni düğmeler ≥44 px, `<bdi>` ile rumuz. |
| T-09 | Düşük | Uyarı metinlerinde Türkçe karakter yok ("yasagin", "kaldi", "gun"). | Düzeltildi. |
| T-10 | Düşük (görünüş) | APK simgesinin sağ alt köşesinde görsel üretici filigranı (✦). | `araclar/filigran-temizle.py` ile simge katmanlarından silindi. |
| T-11 | Bilgi | Uygulama yatay ekrana kilitliydi (`sensorLandscape`); şablonda yoktu. | Manifeste eklendi. |
| T-12 | Bilgi | Reklam yoktu. | Kullanıcı kararıyla AdMob eklendi (`www/reklam.js`, Kelime Bilcek kuralları; `test/reklam.test.mjs` 9/9). Gerçek kimlikler AdMob'da oluşturulunca girilir; o zamana kadar `admob=ornek`, Play'e yüklenmez. |

## Açık kalanlar (bilinçli olarak bırakılan ya da kullanıcıda olan)

- **İstemci otoriteli oyun:** Spark planında Cloud Functions yok. Zar `Math.random` ile, hamleler ve maç sonucu
  istemciden yazılır; değiştirilmiş bir istemci zarı seçebilir, kurallar her yazımda en çok ±2 puana izin verse de tekrar
  tekrar yazabilir. Sunucu tarafı hakemlik Blaze + Functions ister.
- **Oyun kuralı:** İnsan oyuncu için "iki zarı da oynamak zorunlu / yalnız biri oynanabiliyorsa büyüğü" kuralı
  denetlenmiyor (yapay zekâ en uzun hamleyi seçiyor). Oyun deneyimini değiştirdiği için sorulmadan değiştirilmedi.
- **`users` belgeleri herkese açık:** Efsaneler ve sıralama bütün koleksiyonu okuyor (sıralama hesaplaması her açılışta
  bütün oyuncuları indirir; oyuncu sayısı büyüyünce yavaşlar ve Firestore okuma kotası dolar). Belgede e-posta yok; sohbet
  uyarı sayacı ve son görülme zamanı okunabilir. Çevrimiçi gizleme açıkken de `lastSeenAt` yazılıyor.
- **Efsaneler listesindeki örnek oyuncular:** liste boşken "İhtiyar Tilki" gibi uydurma adlar gösteriliyor; ekranda "geçici
  parodi" diye yazıyor. Yanıltıcı sayılmaması için gerçek oyuncu sayısı arttığında kaldırılmalı.
- **Odalar:** Bitmiş ve terk edilmiş odalar yalnız kurucu iptal ederse ya da hesap silinirse siliniyor; eski odalar
  birikir. Zamanlanmış temizlik Blaze ister; şimdilik konsoldan elle.
- **Sesli sohbet:** Yalnız STUN var (TURN yok); iki taraf da sıkı NAT arkasındaysa bağlanmaz.
- **İçerik Güvenliği Politikası (CSP)** eklenmedi: Firebase, Google girişi ve WebRTC için izin listesi cihazda denenmeden
  yazılırsa oyunu bozabilir.
- **Eski veriler:** `tavla-online-oyundar`'daki deneme kayıtları (APK sürümünün yazdıkları) yerinde duruyor; yeni kurallar
  okumalarını engellemez, alan dışı yazımlarını engeller.
- **Kumar algısı:** Zar ve "puan" var ama para/jeton/ödül yok; IARC'de kumar "Hayır".
