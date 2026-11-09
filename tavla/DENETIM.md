# Tavla — denetim raporu (1.0.0 → 1.0.2)

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

## 1.0.2 — Evren ve NVIDIA ile tarama (9 Kasım 2026)

Uygulama kodu (`www/assets/index-BLMBGPAE.js`, 28740. satırdan sonrası; kütüphaneler hariç, gömülü ses verisi kısaltılmış,
Firebase web anahtarı gizlenmiş) ve yapılandırma (`firestore.rules`, `reklam.js`, manifest, `build.gradle`) 17 parça
hâlinde **NVIDIA nemotron-3-ultra** (17/17 parça) ve **Evren** (17/17 parça; glm-5.3 ve deepseek-v4.1-flash
kapasite hatası verdiği için çoğu qwen3.8-flash-next, düşük düşünme düzeyiyle) ile tarandı. Her bulgu koda karşı tek
tek doğrulandı; doğrulananlar düzeltildi.

| No | Önem | Bulgu | Düzeltme (1.0.2) |
|---|---|---|---|
| T-13 | Yüksek | Anonim giriş bir kez başarısız olursa (ör. çevrimdışı açılış) reddedilen söz `Rv`'de önbellekte kalıyor; uygulama yeniden başlatılana kadar çevrimiçi özellikler çalışmıyordu. | Hata durumunda `Rv = null`; sonraki çağrı yeniden dener. |
| T-14 | Yüksek | Hızlı eşleşmede bekleyen oyuncu uygulamayı kapatırsa oda `waiting: true` kalıyor; sonra gelenler bu ölü odalara düşüp boşuna bekliyordu. Aynı odaya iki kişi aynı anda girince kaybeden İngilizce izin hatası görüyordu. | 10 dakikadan eski bekleyen odalar atlanır, en yenisi seçilir; katılma reddedilirse yeni oda kurulur. |
| T-15 | Orta (içerik) | Pala Dayı'nın "Zar dediğin kahpeymiş" repliği; uygulamanın kendi argo filtresi bu kelimeyi sohbette engelliyor. | Replik metin listesinden, ses listesinden, `voices/manifest.json`'dan ve ses dosyasıyla kaldırıldı. |
| T-16 | Orta | Arkadaş silme tek taraflıydı; silinen kişinin listesinde kalınıyordu. | Kendi listenden sonra karşı tarafın listesinden de çıkılır (kurallar buna zaten izin veriyor). |
| T-17 | Orta | Oda silinince (rakip ayrıldı, hesap silindi) sesli sohbet bağlantısı ve mikrofon açık kalabiliyordu. | Oda belgesi yoksa bağlantı kapatılır. |
| T-18 | Düşük (görünüş) | Maç puanlı oyunda üstteki ad kutusu 130 px'e sığmıyor, adlar "Be…", "Siy…" diye kesiliyordu (mağaza görüntüsünde de). | Kutu 200 px (dar ekranda 150 px), rozetler daralmaz, ad en az 3 em. |
| T-19 | Düşük (erişilebilirlik) | Düğmelerde klavye odak göstergesi yoktu; "hareketi azalt" ayarı yok sayılıyordu. | Genel `:focus-visible` çerçevesi ve `prefers-reduced-motion` kuralı (`index-nqMpL4T3.css`). |
| T-20 | Düşük (görünüş) | Simge ve açılış ekranı APK'daki görseldi; açılış ekranı beyaz zeminde, simgede görsel üretici filigranı seçiliyordu. | Yeni simge (elle yazılmış SVG, `araclar/kaynak/`), Android katmanları ve koyu açılış ekranı `araclar/simge-uret.mjs` ile; Android 12+ açılış zemini koyu. Yeni tanıtım görseli, ekran görüntüleri 1.0.2'den yeniden çekildi. |
| T-21 | Yüksek | Argo filtresi bütün mesajı boşluksuz birleştirip "mk", "oc", "sik", "dol", "sok" gibi parçaları alt dize olarak arıyordu: "sık sık", "tahta dolu", "hocam", "kocaman", "tamam kardeş", "sokak" küfür sayılıp uyarı alıyordu (3 uyarıda 3 gün yasak); rumuzda da aynı. Listede "götürmek" (fiil) ve "sıkış" vardı. (Evren) | Kelime bazlı: kısa parçalar yalnız tek başına kelimeyse ("ı" ayrı tutulur: "sık" ≠ "sik"), uzunlar kelime başındaysa, açık küfürler boşlukla bölünse de yakalanır; iki masum kelime çıktı. `test/argo.test.mjs` (35 örnek). |
| T-22 | Yüksek | Bilgisayara karşı maçta (5/7/11 puan) oyun sonu efekti sıralama kaydıyla maç puanını aynı anahtarla ayırıyordu; efekt yeniden çalışınca maç puanı **iki kez** ekleniyor, sıralama puanı iki kez yazılıyordu (Playwright ile doğrulandı: eski 2, yeni 1). (Evren) | Ayrı anahtarlar (`be.current` sıralama, `be.mac` maç puanı); yeni maçta ikisi de sıfırlanır. |
| T-23 | Yüksek | Sohbet artan sırada **ilk** 50 mesajı dinliyordu; 50 mesajdan sonra yeni mesajlar hiç görünmüyordu. (Evren) | En yeni 50 mesaj (`desc` + `limit`), ekranda eskiden yeniye. |
| T-24 | Düşük (metin) | Maç sonunda "${rakip}'ı yendin" eki sabitti ("Kahveci'ı yendin"); repliklerde "Hala dışarıdayız" ("hâlâ" olmalı). (Evren) | "… karşısında kazandın, helal olsun!"; "Hâlâ" (ekranda; ses kayıtları aynı). |
| T-25 | Orta (görünüm) | Alçak yatay telefonda (≤ 600 px yükseklik) ana menüde puan kartı eziliyor, yazıları kesiliyordu (640×360'ta yalnız etiketler kalıyordu); "Misafir" düğmesi orta sütuna, sağ üstteki 3 mini düğme rumuz satırına, büyük ekranda "Misafir" düğmesi EFSANELER kartına biniyordu; 568×320'de mod düğmeleri ekranın altına taşıyordu. Web'de dikey telefonda menü sütunu dar kalıp düğmeler üst üste biniyordu. (Kullanıcı testi) | Yatay alçak ekran kuralları: puan kartı ezilmez, "Misafir" düğmesi küçüldü, rumuz satırı mini düğmelere yer bırakır, Görünüm + AI tek satırda, ≤ 340 px'te başlık ve düğmeler küçülür; menü gerekirse kayar. Dikey telefonda (yalnız web) "Telefonu yan çevir" uyarısı. 568×320 → 1280×720 arası 9 boyutta Playwright ile çakışma/taşma ölçümü: sorun yok. |

**Doğrulanıp yanlış bulunanlar (değiştirilmedi):** toplama ve ev bölgesi hesabı (model beyazın yönünü ters varsaymış),
çift zarın 4 kez oynanması, hesap silmede "tanımsız değişken" ve "kullanıcı belgesi silinmiyor" (ikisi de doğru
çalışıyor), rumuz yarışı ve başkasının rumuzunu silme (kurallar engelliyor), odaya iki konuğun aynı anda yazması
(kural ikinci yazımı reddediyor), çıkışta engel listesinin sızması (giriş değişince yeniden yükleniyor), "Tekrar Oyna"nın
maç puanını silmesi (yalnız maç bitince sıfırlanıyor), "alnımızın akı" (doğru deyim), yasak süresinin ham sayı olması
(`Ey` ile biçimleniyor), şikâyet gönderiminde hata yakalanmaması (pencere yakalıyor ve gösteriyor), kısaltılmış
satırlardaki bozuk karakterler (taramaya hazırlıktaki kısaltmadan).

**Bilinçli bırakılanlar:** sohbet yasağı belge silinip yeniden açılarak atlanabilir (uyarı sayacını zaten istemci yazıyor;
yeni hesap açmakla aynı), bazı karakterlerde boş replik kategorileri (ses kaydı yok, sessiz kalıyor, hata yok),
`minifyEnabled false` ve `allowBackup="true"` (Capacitor varsayılanları), Genç Mert repliklerindeki oyun argosu ("aimbot",
"wallhack", "ulan") ve "Vatan toprağına ayak bastık" gibi üslup tercihleri (ses kayıtlarıyla birlikte; değiştirmek kullanıcı kararı).

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
