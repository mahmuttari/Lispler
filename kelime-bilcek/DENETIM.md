# Kelime Bilcek — denetim raporu (1.0.0)

Hazırlandı: 4 Kasım 2026. Kaynak: Drive › `KELİME BİLCEKK APK/KelimeBilcek-v3.7-debug.apk` (15 Mayıs 2026), içindeki
`assets/www/index.html` (124 KB, tek dosya, alt bilgi "v4.11"). Eski paket `com.oyundar.kelimebilcek` (MARFEN, hiç
yayınlanmadı) → yeni paket `com.poyrazworkshop.kelimebilcek` (Poyraz Workshop).

## Kullanılan ücretsiz araçlar

| Araç | Ne denetler | Nerede çalışır | Sonuç (1.0.0) |
|---|---|---|---|
| ESLint 9 (`eslint.config.mjs`) | `www/*.js`, testler, araçlar, Worker, site ve Firebase betikleri | `kelime-denetim.yml` | 0 hata (v4.11 kodunda 8 bulgu; ikisi gerçek hata: K-08) |
| html-validate 10 (`.htmlvalidate.json`) | `www/index.html`, `site/*.html` | `kelime-denetim.yml` | 0 hata (v4.11'de 49) |
| `node --test` | kelime işlevleri (9), reklam kuralları (13), arayüz + axe-core (6), Worker (8), site (6) | `kelime-denetim.yml`, `kelime-android.yml` | 42/42 |
| Firebase emülatörü + `@firebase/rules-unit-testing` | Realtime Database kuralları (24 senaryo, saldırılar dahil) | `kelime-firebase-kurallar.yml`, yayından önce `kelime-kural-yayini.yml` | 24/24 |
| Firebase emülatörü + Playwright | Gerçek oyun kodu iki tarayıcıda, sıkı kurallarla: ad, arkadaş, hızlı eşleşme, Zincir, terk, Şampiyonlar, oda silme, hesap silme; konsolda `permission_denied` yok | `kelime-firebase-kurallar.yml` | 5/5 |
| axe-core 4.11 | giriş, lobi, Şampiyonlar, kategoriler, arkadaşlar, oda kodu, sonuç ekranı, profil menüsü | `test/arayuz.test.mjs` | "serious/critical" ihlal yok |
| Lighthouse CI 0.16 (`lighthouserc.json`) | performans, erişilebilirlik, iyi uygulamalar, SEO | `kelime-denetim.yml` | 1,00 / 1,00 / 1,00 / 1,00 (v4.11: 1,00 / 0,89 / 0,96 / 0,91) |
| Android lint (`lintRelease`) | Android projesi | `kelime-denetim.yml` (rapor artifact `KelimeBilcek-android-lint`) | 0 hata, 21 uyarı (aşağıda) |

Yerelde (bulut oturumu, 4 Kasım 2026) hepsi koşturuldu; Android lint için yerelde Android SDK yok, yalnız CI'da çalışır.
CI'da ilk koşular (commit b6dbe16): Denetim 41827897508 ✓, Firebase kuralları 41827897735 ✓ (24 + 5), Android
41827897537 ✓ (imzalı AAB, yükleme anahtarı SHA-1 `D0:88:…:56:99`, `admob=ornek`).

## Bulgular ve düzeltmeler

| No | Önem | Bulgu (v4.11) | Düzeltme (1.0.0) | Sınama |
|---|---|---|---|---|
| K-01 | Kritik | RTDB kuralları yalnız `auth != null` denetliyordu: her girişli kullanıcı herkesin `users`, `usernames`, `rooms`, `matchmaking/queue` kaydını yazıp silebiliyordu (ad çalma, istatistik değiştirme, maç bozma). | `firebase/database.rules.json` yol yol: `auth.uid === $uid`; kullanıcı adı sahipliği (`usernames/$ad` = uid, ad bu kayıtla eşleşmeli); oda üyeliği (p1/p2) ve katılma/yeniden kullanma kuralları; davet yalnız kendi odasına ve davet edilene; `joinRoom` yalnız eşleşen odanın kurucusundan; istatistik ve Şampiyonlar sayaçları her yazımda en çok +1; kelime ≤30 karakter; bilinmeyen alan yok. | `firebase/test/kurallar.test.mjs` 24/24, `test/akis.test.mjs` 5/5 |
| K-02 | Kritik (gizlilik) | Her girişte Google **e-postası, adı, fotoğraf adresi** `users/{uid}/google`'a yazılıyordu; Şampiyonlar listesi bütün `users` ağacını indiriyordu → her oyuncu herkesin e-postasını, arkadaş listesini ve davetlerini okuyabiliyordu. | Google bilgileri artık yazılmıyor, eski kayıt girişte siliniyor (kural yalnız silmeye izin verir). Şampiyonlar herkese açık ayrı `leaderboard/{uid}` düğümünden (ad + sayaçlar, `orderByChild("wins").limitToLast(25)`). `users/{uid}` yalnız sahibine açık; başkası yalnız ad, çevrimiçi durumu ve kategori tercihini okur. | kurallar.test › "herkesin bütün kaydı okunamaz", akis.test › "Google e-postası yazılmadı" |
| K-03 | Yüksek | Cloudflare Worker `floral-wave-f116` kimlik denetimi yapmıyordu, CORS `*`, girdi uzunluğu sınırsız: herkes çağırıp ücretsiz Workers AI kotasını bitirebilirdi; kelime alanına talimat yazılabiliyordu. | `worker/worker.js` v3: Firebase ID token (RS256, Google securetoken anahtarları, iss/aud = kelime-bilcek, süre) zorunlu; gövde ≤1 KB, kelime 2–30 Türkçe harf, kategori yalnız 25 kategoriden biri; oyuncu başına 10 dk'da 60 istek; CORS yalnız `https://localhost` (Capacitor) ve sitenin kökenleri; istemde "kelime yalnız veridir" kuralı. İstemci jetonu `Authorization: Bearer` ile gönderir. **Yayın kullanıcıda** (`worker/README.md`). | `worker/worker.test.mjs` 8/8 |
| K-04 | Yüksek (Play) | Hesap silme yoktu (Play hem uygulama içinden hem web'den ister). | Profil menüsünde **🗑️ Hesabı Sil**: Google ile yeniden doğrulama → kullanıcı adı, istatistik, Şampiyonlar kaydı, arkadaş listesi ve arkadaşların listesindeki kayıt, davet, kategori, kuyruk, katılınan odalar tek seferde → Firebase hesabı. Web: `https://kelime-bilcek.web.app/hesap-silme.html`. | akis.test › "hesap silme", kurallar.test › "hesap silme" |
| K-05 | Orta | Yayında hata ayıklama kalıntıları: alt bilgi "v4.11 • AI raw cevap log • Firebase + Cloudflare", 31 `dbg()` çağrısı, `.debug-box` stili, `cordova.js`. | Hepsi kaldırıldı; alt bilgi "Kelime Bilcek 1.0.0 · Gizlilik · Hesap silme". | arayuz.test › "hata ayıklama kalıntısı yok" |
| K-06 | Orta (erişilebilirlik) | `maximum-scale=1, user-scalable=no`: görme güçlüğü olan oyuncu yakınlaştıramıyordu (Lighthouse erişilebilirlik 0,89). | Kaldırıldı; erişilebilirlik 1,00. | arayuz.test, Lighthouse |
| K-07 | Orta (oyun) | "Başka kategorinin listesinde varsa reddet" kuralı (istemci ve Worker): listeler örtüştüğü için doğru kelimeler düşüyordu (ör. Sabah Kahvaltısı'nda **ekmek**, yalnız Piknik listesinde olduğu için). | Kural kaldırıldı: listede yoksa yapay zekâ hakemine sorulur. | kelime.test, worker.test |
| K-08 | Orta (oyun) | `endActiveRound` içinde tanımsız `txCommitted = result.committed` → ReferenceError yakalanıyordu, Hızlı modda her round sonunda sunucu zaman damgası (`phaseStartTime`) hiç yazılmıyordu; saat farkı olan cihazda "round bitti" süresi kayıyordu. ESLint `no-undef` buldu. | Satır kaldırıldı. | ESLint |
| K-09 | Düşük | Çıkışta arkadaşların çevrimiçi dinleyicileri kapatılmıyor, dinleyici işlevi çağrılıyordu (bellek ve veri sızıntısı). | `off("value", fn)` ile kapatılıyor. | kod incelemesi |
| K-10 | Orta (gizlilik) | Maç odaları hiç silinmiyordu: kullanıcı adları ve yazılan kelimeler sonsuza kadar kalıyordu. | Lobiye dönünce biten oda silinir; katılınan odalar `users/{uid}/odalar` listesinde tutulur, hesap silinince silinir. | akis.test › "biten oda silinir" |
| K-11 | Düşük (oyun) | Zincirde "ğ" ile biten kelimeden sonra "ğ" isteniyordu (Türkçede "ğ" ile kelime başlamaz → rakip kaçınılmaz kaybeder). | "ğ"den önceki harf istenir (dağ → a). | kelime.test |
| K-12 | Düşük (oyun) | Şapkalı harfler (â, î, û) ayrı harf sayılıyordu: "kâğıt" ile "kağıt" iki kelime, "Âlem" "a" harfiyle başlamıyor. | Normalleştirmede düz harfe iner. | kelime.test |
| K-13 | Düşük | Firebase SDK gstatic CDN'den yükleniyordu (internet yavaşken açılış gecikir, CDN'e bağımlılık). | `firebase@10.12.0` paketten `www/vendor/`'a kopyalanır (`npm run vendor`). | arayuz.test › "yerelden yüklenir" |
| K-14 | Bilgi | Kodda "Cloudflare proxy → Claude Haiku" yorumu yanlıştı; Worker Workers AI'daki Llama 3.3 70B'yi iki kez soruyor. | Yorumlar düzeltildi. | — |
| K-15 | Orta | Google girişi `cordova-plugin-googleplus` ile (Cordova, artık bakımı yok). | Capacitor 8 + `@codetrix-studio/capacitor-google-auth` (Hayalet Avcıları ile aynı). | akis.test (web yolu); Android'de elle denenmeli |
| K-16 | Düşük (görünüş) | APK'daki uyarlanabilir simge Cordova'nın varsayılan robotuydu; Capacitor projesinde varsayılan açılış görseli. | Simgeler ve açılış görseli `icon.jpg`'den üretildi; Play simgesi 512×512. | — |
| K-17 | Düşük (erişilebilirlik) | Kategori rozeti kontrastı yetersiz (axe "serious"); profil açan kullanıcı adı `span` (klavyeyle açılmıyor) ve dar ekranda başlığa biniyordu; animasyonlar hareket azaltma tercihini yok sayıyordu. | Rozet rengi koyulaştırıldı; `button` + `aria-label`; dar ekranda sağa yaslanır; `prefers-reduced-motion`. bütün düğmelere `type="button"`; `span` içindeki `div`'ler düzeltildi. | axe-core, html-validate |

## 1.0.4 — Evren ile tarama (10 Kasım 2026)

**Düzeltme:** 1.0.1 ve 1.0.2'de "Evren" yerine yanlışlıkla Gemini kullanılmıştı. Evren, `evren-llmapi.ssyz.org.tr`
adresindeki OpenAI uyumlu servis. Kod (bot modu ve yeni görünüm dahil) `araclar/model-tarama.py evren a|b` ile
**DeepSeek V4.1 Flash**'a gönderildi. Modelin düşünme kipi 16 bin jetonluk bütçenin tamamını harcadığı için
kapatıldı (`chat_template_kwargs.thinking=false`); açmak için `DUSUN=1`. Depo herkese açık ve gönderilen kodda kişisel veri yok.

| Parça | Bulgu | Doğrulanan | Yanlış alarm nedenleri |
|---|---|---|---|
| a (oyun.js + kurallar) | 25 | 2 | Kendi kendini yalanlayan maddeler ("…bu tamam, değişiklik gerekmez"), `onDisconnect` silmesini tehlike sanması, bilinçli tasarım (istemci otoriteli sonuç) |
| b (bot, reklam, kelime, Worker, kurallar, manifest) | 25 | 3 (küçük) | RTDB'de üst düğümün `.write` kuralı alt düğümün iznini engeller sanması (kurallar.test 25/25 aksini gösteriyor), `"General"` değerini geçersiz sanması, başlatıcı etkinliğinde `exported=true`'yu açık sanması, sınırlı hız haritasını sızıntı sanması |

| No | Önem | Bulgu | Düzeltme | Kaynak | Sınama |
|---|---|---|---|---|---|
| K-29 | Yüksek (adalet) | Kelime, davet ve kuyruk zaman damgaları **cihaz saatiyle** yazılıyordu. Zincir'de sıra ve son harf, Hızlı'da "ilk yazan kapar" (çalma) bu zamana göre belirlenir. Saati geride olan oyuncunun kelimesi öne sıralanıyor, yanlış harf isteniyor ya da kelime haksızca kapılıyordu. Davetin süresi de karşı cihazın saatiyle ölçüldüğü için davet erken düşebiliyordu. | Bütün oyun zamanları `nowServer()` ile yazılıyor (Firebase `.info/serverTimeOffset`). Eşit zamanda sıralama push anahtarına göre. | Evren (DeepSeek), elle genişletildi | arayuz.test: 1 saat kaymış saatte kelime sunucu saatinde (eski kodda kırmızı) |
| K-30 | Orta | Hızlı modda listede olmayan kelimenin denetimi round bitene kadar sürerse kelime **sonraki rounda** yazılıyordu: başka kategoride sayılabiliyordu. Oyuncu bu arada yeni maça geçtiyse kelime **yeni odaya** gidiyordu. | Kelime yalnız aynı odanın aynı roundunda ve round sürerken yazılır. Değilse "sayılmadı" bildirimi gösterilir. | Evren (DeepSeek) | arayuz.test: geç dönen denetim (eski kodda kırmızı) |
| K-31 | Düşük | Yapay zekâ maçında, bildirimi sıradayken kapatılan dinleyici yine de çağrılıyordu. Botun sırası değilse transaction boşuna yazılıyor ve bildirim tetikleniyordu. | `YerelOda` dinleyicinin hâlâ kayıtlı olduğunu denetler. Değişiklik yoksa transaction iptal edilir. | Evren (DeepSeek) | bot.test (eski kodda kırmızı) |
| K-32 | Düşük (maliyet) | Worker önbellek anahtarında şapkalı harfler düzleşmiyordu: "hâlı" ile "halı" yapay zekâya ayrı ayrı soruluyordu. | Worker'ın `normalizeWord`'ü istemciyle aynı (â→a, î→i, û→u). | Evren (DeepSeek) | worker.test |
| — | — | Davet kabulünde gönderen `inv.fromUid` diye okunuyordu (alan `from`). Yedek okuma çalıştığı için hata yoktu, gereksiz bir okuma vardı. | `inv.from`. | Evren (DeepSeek) | — |

**Canlı ortam (10 Kasım 2026):**
- Worker `floral-wave-f116` v3.2 Cloudflare API ile yüklendi. Bağlamalar: `AI`, KV `SOZLUK`, sırlar `ANTHROPIC_API_KEY` ve `FIREBASE_API_KEY`.
- Denetim sonuçları: jetonsuz POST 401, GET 405, OPTIONS 204 (`https://localhost` CORS).
- Firebase projesi **Blaze** planında; Spark'ın 100 eşzamanlı bağlantı sınırı kalktı.
- 1.0.4 ile Worker v3.3 (K-32) yüklendi.

## 1.0.3 — Yeni görünüm (9 Kasım 2026)

Kullanıcı isteği: "butonlar ince cılız olmasın, güzel bir görünüme kavuştur tüm oyunu". Yön `ui-ux-pro-max` tasarım
sistemi önerisinden (oyunlar için "claymorphism": kalın, 3 boyutlu, yuvarlak; Fredoka + Nunito) koyu tema ve simgedeki
ateş/buz/altın kimliğiyle uyarlandı.

- **Düğmeler:** en az 58 px (küçük 48 px), 18 px köşe, 6 px alt gölge, basınca çökme; birincil ateş, onay yeşil, tehlike
  kırmızı, ikincil kenarlıklı mor; "Maçı Terk Et" ve "Hesabı Sil" artık dikkat dağıtmayan çerçeveli tehlike düğmesi.
- **Yazı tipi:** Fredoka (başlık, düğme, sayı) ve Nunito (metin), SIL OFL 1.1, `@fontsource-variable`; yalnız latin ve
  latin-ext (Türkçe) alt kümeleri cihazda (`www/vendor/fonts`, 124 KB; `araclar/vendor.mjs`).
- **Simgeler:** emoji yerine Lucide SVG (ISC), sayfaya gömülü küme (`araclar/ikonlar.mjs`, 33 simge, 7,5 KB).
- **Ekranlar:** lobide renkli simge kutulu büyük kart + 2×2 kutucuk ızgarası, 76 px mod seçici; bot zorluk kartları;
  bekleme ekranlarında halka animasyonu; maçta yuvarlak sayaç, iri kelime balonları, büyük giriş alanı; sonuç ekranında
  büyük skor; pencerelerde bulanık arka plan; bildirim hapı.
- **Erişilebilirlik:** metin kontrastı ≥ 4,5:1, büyük kalın düğme metni ≥ 3:1, dokunma hedefi ≥ 44 px, görünür odak
  halkası, hareket azaltma; axe-core ağır ihlal yok, Lighthouse dört kategoride 1,00.
- Ekran görüntüsü aracı `araclar/ekranlar.mjs` (16 ekran); mağaza görselleri yeni görünümle yeniden üretildi.

## 1.0.2 — Maliyet hesabı, yapay zekâya karşı mod ve tasarruf (9 Kasım 2026)

### Maliyet (aylık, USD) — `araclar/maliyet.py`

Fiyatlar: Workers AI 0,011 $/1.000 nöron, günde 10.000 nöron ücretsiz, Llama 3.3 70B fp8-fast 26.668 nöron/M giriş ve
204.805 nöron/M çıkış token'ı, Workers Paid 5 $/ay (Cloudflare resmî sayfası); Firebase RTDB Spark 100 eşzamanlı bağlantı /
10 GB indirme, Blaze 1 $/GB indirme; Google girişi 50.000 aylık aktif kullanıcıya kadar ücretsiz; AdMob Türkiye eCPM geçiş
1,5–4 $, banner 0,10–0,45 $ (Gemini'nin Google aramasıyla bulduğu sektör/forum verisi, güven orta). Ölçüm: emülatörde bir
kısa Zincir maçı oyuncu başına 6–7 KB indirdi. Varsayımlar: Hızlı maçta 80, Tenis'te 15, Zincir'de 10 kelime yerel
listede yok ve denetime gider; mod karışımı %50/%30/%20; maç başına 0,5 geçiş + 2 banner gösterimi. Hesabı Gemini denetledi
(matematik hatası yok; veritabanı payı ihtiyatlı; ortak önbellek ve Spark bağlantı sınırı önerisi alındı).

| Günlük maç | 1.0.1 düzeni | 1.0.2 (önbellek %95 + tek çağrı) | Reklam geliri |
|---|---|---|---|
| 100 | 52 $ | 0 $ | 3 $ |
| 1.000 | 507 $ | 14 $ | 34 $ |
| 10.000 (10.000 kişi × 1) | 5.068 $ | 139 $ | 345 $ |
| 100.000 | 50.756 $ | 1.525 $ | 3.450 $ |

1.0.1'de bir çok oyunculu maç ortalama 1.532 nöron (0,017 $) harcıyordu: reklam gelirinin (~0,001 $) 17 katı. Günde
10.000 ücretsiz nöron ~6 maça yetiyordu. Veritabanı bu ölçekte 0–11 $/ay; asıl kalem kelime hakemi.

**Sınır:** Firebase Spark'ta en çok 100 eşzamanlı bağlantı var. Kullanıcı sayısı büyüyünce oyun bağlanamaz: Blaze planına
(kullandıkça öde; bu ölçekte birkaç dolar) geçilmeli. Günde ~6 maçtan fazlası için Cloudflare Workers Paid (5 $/ay) gerekir.

### Yapılanlar

- **Yapay zekâya karşı** (`www/bot.js`): rakip "Bilcek" kelimelerini cihazdaki kategori sözlüğünden (Zincir'de bütün
  kategorilerin tek kelimelik girişleri, ~1.000+) seçer; Kolay/Orta/Zor hız, bilinen kelime oranı ve takılma olasılığıyla
  ayrılır. Maç çok oyunculu motorla aynen oynanır; Firebase odası yerine bellekteki `YerelOda` kullanılır. Bot için
  yapay zekâ ve veritabanı maliyeti yok; maç istatistiğe ve Şampiyonlar'a sayılmaz. Bağlantı yoksa kategori tercihi 2 sn
  bekleyip bütün kategorilerle başlar.
- **Worker v3.2:** ortak önbellek (`v1|kategori|kelime` → karar; KV `kelime-bilcek-sozluk` bağlıysa küresel, değilse
  Cache API; 90 gün) ve tek katı hakem çağrısı (eski iki çağrı: `IKI_HAKEM=1`). Kısmi ya da hatalı yanıt önbelleğe
  yazılmaz. **Cloudflare'e yüklenmeli ve KV bağlanmalı** (`worker/README.md`).
- **Cihaz önbelleği:** telefonda denetlenen kelimeler (en çok 1.500) yeniden sorulmaz.
- Gizlilik sayfası: kelime/kategori/karar 90 gün (kullanıcı kimliği ve IP olmadan) ve cihaz önbelleği yazıldı.

Sınama: `test/bot.test.mjs` 6/6, `test/arayuz.test.mjs` 8/8 (tarayıcıda Zincir ve Hızlı bot maçı), `worker/worker.test.mjs`
13/13 (önbellek, tek çağrı, hatalı yanıtın yazılmaması).

## 1.0.1 — NVIDIA ve Gemini ile tarama (9 Kasım 2026)

Kod (oyun.js, reklam.js, kelime.js, index.html, kurallar, Worker, manifest) iki ücretsiz modele aynı istemle gönderildi:
NVIDIA `nemotron-3.5-lightning-30b-a3b` (integrate.api.nvidia.com) ve Google `gemini-3.5-flash`. Depo herkese açık,
kişisel veri yok. Betik bulut oturumunun karalama alanında; proxy 60 sn sessizlikte bağlantıyı kestiği için yanıtlar
akışla (düşünce özetleri dahil) alındı, gövde ~140 KB sınırı yüzünden kod iki parçada gönderildi.

| Model | Bulgu | Doğrulanan | Yanlış alarm nedenleri |
|---|---|---|---|
| Gemini | 30 | 9 | "tanımsız işlev" (kelime.js ayrı parçadaydı), silmede `.validate` çalışır sanması, alt düğüm `.write` yetkisini görmemesi, hesap silmenin zaten sildiği veriler |
| NVIDIA | 26 | 1 (+1 Gemini ile ortak) | Capacitor kökenini `http://localhost` sanması, kodda olan `onDisconnect` iptalini ve oda silmeyi görmemesi, belirsiz "yarış" iddiaları |

Ayrıca bu inceleme sırasında modellerin kaçırdığı bir hata bulundu (K-20).

| No | Önem | Bulgu | Düzeltme | Kaynak | Sınama |
|---|---|---|---|---|---|
| K-20 | Yüksek | Hızlı eşleşmede kuyruktaki her değişiklik `tryMatch`'i yeniden başlatıyordu; önceki deneme bitmeden ikincisi başka bir rakibi daha alıp **ikinci oda** kurabiliyordu (3+ kişilik kuyrukta bir oyuncu boş odaya düşer). | Aynı anda tek deneme (`eslesiyor`). | inceleme | akis.test |
| K-21 | Orta | Rakip kuyruk kaydını alıp oda kuramazsa (ağ hatası) oyuncu arama ekranında sonsuza kadar kalıyordu. | Kayıt 8 sn kuyrukta yoksa ve odaya çağrılmadıysa yeniden sıraya girer. | Gemini | kod incelemesi |
| K-22 | Düşük | Eşleşme ararken çıkışta kuyruk dinleyicisi ve kaydı kalıyordu; listeden çıkarılan arkadaşın çevrimiçi dinleyicisi kapanmıyordu. | `detachAllListeners` kuyruğu kapatır/siler; `renderFriends` eski dinleyicileri kapatır. | Gemini | — |
| K-23 | Orta | Tenis ve Zincir'de kelime denetlenirken "Gönder" kapanıyor ama **Enter açık**: sıra geçtikten sonra ikinci kelime yazılabiliyordu. | Denetim sürerken gönderim yok sayılır. | NVIDIA + Gemini | — |
| K-24 | Yüksek (politika) | Lobiden maça hızlı geçişte `showBanner` bitmeden `hideBanner` çağrılıp önce bitebiliyordu: **banner maç ekranında kalıyordu** ("maç sırasında reklam yok" kuralı). | Banner işlemleri sıraya girer, her adım o anki ekranı denetler; hata olursa döngüye girmez. | Gemini | reklam.test (eski kodda kırmızı) |
| K-25 | Düşük | Gösterilemeyen geçiş reklamı da gösterilmiş sayılıyor, 5 dk ve saatlik hakkı yiyordu. | Sayaç yalnız başarılı gösterimden sonra yazılır. | Gemini | reklam.test |
| K-26 | Orta (hile) | Sayaç kuralı yalnız üst sınır koyuyordu: oyuncu **yenilgi sayısını düşürebiliyor** ya da sayacı tek tek silebiliyordu. | Sayaç yalnız artar (+0/+1); tek sayaç ve `stats` düğümü silinemez (hesap silmedeki toplu silme sürer). | Gemini | kurallar.test 25/25 |
| K-27 | Düşük | Yalnız tire ve boşluktan oluşan girdi ("- -") kelime biçimini geçiyordu; Zincir'de aynı zaman damgalı kelimelerde sıradaki harf istemciye göre değişebiliyordu. | En az iki harf şartı (istemci + Worker); ikincil sıralama. | Gemini | kelime.test, worker.test |
| K-28 | Orta | Worker: Google imza anahtarlarını yenileyince yeni `kid` önbellekte yoktu, geçerli jetonlar 6 saate kadar 401 alabiliyordu; gövde boyutu okunmadan önce denetlenmiyordu. | v3.1: bilinmeyen `kid`'de anahtarlar bir kez yeniden çekilir (dakikada en çok bir); `Content-Length` > 1 KB ise okunmadan 413. **Cloudflare'e yüklenmeli** (`worker/README.md`). | Gemini | worker.test 10/10 |

Bilinçli olarak bırakılanlar (aşağıdaki "Açık kalanlar"da zaten var): istemci otoriteli maç sonucu ve oda verisi, onaysız
arkadaş ekleme, başkasının kuyruk kaydını silebilme (eşleşme yöntemi), AI yanıt vermezse TDK'ya düşme (sunucu kapalıyken
oyun oynanabilsin diye).

Telefondaki eski sürüm (v4.11, ayrı paket) Şampiyonlar'da `permission_denied at /users` verir: 4 Kasım'da yayınlanan sıkı
kurallar herkesin `users` ağacını okumayı kapattı (K-02). 1.0.x listeyi `leaderboard` düğümünden okur; eski uygulama
kaldırılmalıdır.

## Açık kalanlar (bilinçli olarak bırakılan ya da kullanıcıda olan)

- **İstemci otoriteli tasarım:** Cloud Functions kullanılmıyor (proje Blaze'de, yazılabilir); maç sonucu ve sayaçlar istemciden yazılır. Kurallar
  her yazımda en çok +1'e izin verir ama değiştirilmiş bir istemci tekrar tekrar +1 yazabilir; oda üyeleri oda
  verisini istediği gibi yazabilir (rakip hile yapabilir). Çözüm sunucu tarafı hakemlik (Blaze + Functions) ister.
- **Arkadaş ekleme onaysızdır** (v4.11 tasarımı): kullanıcı adını bilen herkes sizi listesine ekleyebilir; böylece
  yalnız çevrimiçi durumunuzu görür ve davet gönderebilir.
- **Eşleşme kuyruğu:** rakibi "almak" için her girişli kullanıcı başkasının kuyruk kaydını silebilir (eşleşme yöntemi
  bunu gerektirir; kayıtta yalnız ad, mod ve zaman var).
- **Kullanıcı adı tutma:** bir hesap birden çok adı ayırabilir (eskiyi silmeden yenisini alarak).
- **İçerik Güvenliği Politikası (CSP)** eklenmedi: RTDB'nin uzun yoklama yedeği ve Google girişi için izin listesi
  cihazda denenmeden yazılırsa oyunu bozabilir. Sonraki sürümde cihazda denenerek eklenmeli.
- **Eski veriler:** v4.11'in yazdığı `users/*/google` kayıtları sahibi yeniden giriş yapınca silinir; eski
  istatistikler Şampiyonlar'a oyuncu ilk maçını oynayınca girer. Uygulama hiç yayınlanmadığı için yalnız deneme
  hesapları etkilenir.
- **TDK isteği** (`sozluk.gov.tr/gts`) v4.11'deki gibi cihazdan doğrudan gider; WebView'daki CORS davranışı
  değişmedi, cihazda denenmeli.

## Android lint

İlk koşu (41827897508): **0 hata, 21 uyarı**. Hiçbiri derlemeyi ya da Play incelemesini etkilemez:

| Uyarı | Adet | Not |
|---|---|---|
| UnusedResources | 7 | Capacitor şablonunun kullanılmayan kaynakları |
| IconLauncherShape, IconDipSize, IconDuplicatesConfig, IconLocation | 5 + 1 + 1 + 1 | Eski (Android 7 öncesi) simgeler kare tam resim; uyarlanabilir simge (Android 8+) doğru |
| MonochromeLauncherIcon | 2 | Android 13 temalı simge katmanı yok (isteğe bağlı) |
| ObsoleteSdkInt, ManifestOrder, GradleDependency, AndroidGradlePluginVersion | 1'er | Capacitor 8 şablonunun sürümleri; Capacitor güncellenince kalkar |
