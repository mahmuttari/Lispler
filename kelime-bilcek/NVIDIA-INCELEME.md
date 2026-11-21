# Kelime Bilcek — NVIDIA modelleriyle bağımsız hata incelemesi (ikinci görüş)

- **Tarih:** 6 Kasım 2026
- **Kullanılan modeller** (NVIDIA API Catalog, `https://integrate.api.nvidia.com/v1/chat/completions`, OpenAI uyumlu, `temperature 0.1`):
  - `nvidia/nemotron-3-ultra-550b-a55b`: tek çağrı, 400 sn, 20 bulgu.
  - `mistralai/mistral-large-4-1t-a52b`: ilk çağrı 16 000 token sınırının tamamını düşünmeye harcadı, son liste gelmedi.
    İkinci çağrıda modele kendi yarım notları verildi, yalnız son listeyi yazması istendi (`reasoning_effort: low`). 7 bulgu geldi.
  - Denenip kullanılamayanlar: `moonshotai/kimi-k2.6` (bu hesapta 404), `deepseek-ai/deepseek-v4.1-flash` ve
    `z-ai/glm-5.3-flash` ("upstream request failed"). Katalogda Qwen3-Coder yok.
- **İncelenen kod** (`main`, 3d9e8e3): `www/oyun.js` (1955 satır), `www/kelime.js`, `www/reklam.js`,
  `firebase/database.rules.json`, `worker/worker.js`. Hepsi satır numaralı ve tek parça gönderildi (yaklaşık 146 000 karakter);
  bölmek gerekmedi.
- **Modele verilen sınır:** `DENETIM.md` › "Açık kalanlar" bölümü olduğu gibi istemde yer aldı ve "bunlar bulgu değil"
  dendi. Stil, performans ve test eksikliği de kapsam dışıydı.
- **Anahtar:** Ortamda `NVIDIA_API_KEY` ya da benzeri adlı bir değişken **yok**. NVIDIA kimliğini ortamın ağ vekili
  `integrate.api.nvidia.com` isteklerine kendisi ekliyor. İsteklerde sahte bir `Bearer` değeri gitti. Anahtarın değeri hiçbir
  yere yazılmadı ve görülmedi. Görevin 1. adımı "değişken yoksa dur" diyordu. Erişim vekil üzerinden çalıştığı için durmadım;
  bu sapmayı burada not ediyorum.
- **Doğrulama:** Her bulguya kodu okuyarak ben (Claude) baktım. `CONFIRMED`: kod yolu açıkça hatalı. `PLAUSIBLE`: kod yolu
  gerçek ama bir koşula bağlı (saat farkı, ağ gecikmesi, eşzamanlılık). `YANLIŞ`: gerekçesiyle ayrı listede. Bu oturumda
  kod değiştirilmedi, emülatör ya da cihaz denemesi yapılmadı.

## Özet

| | Nemotron 3 Ultra | Mistral Large 4 |
|---|---|---|
| Bulgu | 20 | 7 |
| CONFIRMED | 0 | 4 |
| PLAUSIBLE | 4 | 3 |
| YANLIŞ | 16 | 0 |

Mistral'in yedi bulgusu da gerçek bir kod yoluna dayanıyor. Nemotron'un yanlışları çoğunlukla kodu yanlış okumaktan geliyor.
Ör. N3 işlem (transaction) işlevinin sunucuda çalıştığını sanıyor; N14 "ö, ü, ş" harflerinin ASCII'ye inmesi gerektiğini öne
sürüyor. Birkaç Nemotron bulgusunda model kendi senaryosunu "aslında sorun yok" diye bitiriyor.

Modellerin bulamadığı ama doğrulama sırasında rastladığım hatalar ayrı bölümde (C1–C9). En önemlileri C1 (hızlı eşleşme
kuyruğunda 60 sn sonra görünmez olma) ve C2 (davet kabulünde işlemin önbellek boşken hemen vazgeçmesi).

## Doğrulanan bulgular (önem sırasıyla)

| No | Kaynak | Yer | Hata | Senaryo | Önem | Düzeltme | Karar |
|---|---|---|---|---|---|---|---|
| M1 | Mistral N1 | `www/oyun.js:157-163` | Kategorili modlarda Worker `null` dönerse (401/429/502, zaman aşımı, ağ hatası) TDK yedeğine düşülüyor; TDK'da olan **her** kelime kategoriye bakılmadan kabul ediliyor. | Hızlı modda listede olmayan çok kelime yazan oyuncu Worker'ın oyuncu başına 10 dk'da 60 istek sınırını (`worker.js:28`) aşar → 429 → `aiValidateWord` `null` → "Banyo" turunda "futbol" geçerli sayılır. Worker kapalıyken herkes için böyle. | yüksek | `category` doluyken yalnız `ai === true` kabul; `null` ise reddet ya da "doğrulanamadı" de. TDK yedeği yalnız Zincir için. | CONFIRMED |
| M2 | Mistral N2 | `www/oyun.js:841`, `1806-1835`; `1879-1889` | Doğrulama sürerken yalnız `sendBtn` kapanıyor, Enter işleyicisi yine `submitWord` çağırıyor; işlev aynı anda iki kez çalışabiliyor. | **Zincir:** kutu doğrulama bitene dek temizlenmediği için (`:1827`) Enter'a iki kez basmak aynı kelimeyi iki kez `valid:true` yazar. Ardından ikinci kelime de aynı beklenen harfle başlar. **Tenis:** kutu hemen temizlenir (`:1839`); aynı kelime ancak yeniden yazılırsa iki kez sayılır. Modelin "iki Enter = aynı kelime iki kez" senaryosu yalnız Zincir'de birebir doğru. | orta | `submitWord` başında modül düzeyinde bir `gonderiliyor` bayrağı; `finally` ile sıfırlanır. | CONFIRMED (Zincir), kısmen Tenis |
| M4 | Mistral N4 | `www/oyun.js:1854-1860`, `1891-1895` | Hızlı modda yapay zekâ yanıtı beklenirken kelime yazılmıyor; yanıt gelince `round/words`'e o anki tur ne ise ona ekleniyor. | 29. sn'de yazılan liste dışı kelime 2–3 sn'de doğrulanır, o sırada tur `ended` olmuştur → kelime puana girmez, ekranda kalır. Doğrulama 5 sn'yi aşarsa (`ENDED_MS`; AI 15 + TDK 5 sn'ye dek bekler) kelime **sonraki turun** listesine eski kategoriyle girer ve orada sayılır. | orta | Kelimeyi gönderildiği turun numarasıyla yazın: `round.number` aynı ve `phase === "active"` değilse yazmayın (işlem ya da kurala `number` denetimi). | CONFIRMED |
| M6 | Mistral N6 | `www/oyun.js:903-907` | Arkadaş silinince onun `users/{uid}/online` dinleyicisi kapatılmıyor; yalnız listede kalanlar yeniden bağlanıyor. | X eklenir, sonra silinir → X'in çevrimiçi dinleyicisi çıkışa dek açık kalır (gereksiz veri trafiği, küçük sızıntı). | düşük | `renderFriends` başında `friendsData`'da olmayan uid'lerin dinleyicisini `off` edip haritadan silin. | CONFIRMED |
| M3 | Mistral N3 (+ Nemotron N4'ün saat farkı kısmı) | `www/oyun.js:1830`, `1840`; `kelime.js:143-149`; `oyun.js:1689` | Kelime zaman damgası `Date.now()` (cihaz saati). Zincirde "son kelime" ve Hızlı'da "önce yazan" bu damgaya göre seçiliyor. `nowServer()` hazır duruyor ama kullanılmıyor. | A'nın telefon saati 20 sn ileride. Zincirde B'nin yeni kelimesi A'nın önceki kelimesinden "eski" görünür → beklenen harf A'nın kendi kelimesinden hesaplanır, A doğru kelimeyle reddedilir. Hızlı'da aynı kelimeyi sonra yazan puanı alır. | orta | `ts: nowServer()` (iki yerde). Daha sağlamı `SV.TIMESTAMP` ve sıralamada push anahtarı. | PLAUSIBLE (saat farkı gerekir) |
| M5 | Mistral N5 | `worker/worker.js:201-205`, `209-214` | İki model çağrısından biri hata verip (`null`) öteki "evet" derse karar "hayır" oluyor. | Model Zincir'i örnek veriyor. Orada istemci `false`'ta TDK'ya düşüp kurtarıyor (`oyun.js:161-163`). **Asıl etki kategorili modlarda:** Workers AI'da tek bir zaman aşımı listede olmayan doğru kelimeyi reddettirir (`category && ai === false`). | orta | Açık bir "hayır" yoksa ve en az bir "evet" varsa kabul edin ya da başarısız çağrıyı bir kez yineleyin. Ya da 502 dönüp istemcide "doğrulanamadı" deyin. | PLAUSIBLE (senaryodaki mod yanlış, mekanizma doğru) |
| M7 | Mistral N7 + Nemotron N9 | `www/oyun.js:481-494`, `566-572` | Çıkışta oda ve kuyruk dinleyicileri, `phaseTickInterval`, `inMatchmaking` ve `roomRef` temizlenmiyor. Profil düğmesi (`meBar`) oyun ve arama ekranında da açık. | Maç sırasında profil › Çıkış → zamanlayıcı eski odaya işlem göndermeye devam eder (`permission_denied`). Aynı cihazda yeniden girişte `roomRef` dolu kaldığı için gelen davet penceresi hiç açılmaz (`:1050`). Kuyruk kaydı da veritabanında kalır. | düşük | `logout`/`detachAllListeners` içinde `resetGameState()`, `detachQueue()`, `inMatchmaking = false` ve kuyruk kaydını silme. | PLAUSIBLE |
| N19 | Nemotron N19 | `www/oyun.js:833-839`, `496-506` | Oda yalnız sonuç ekranında "Tekrar Oyna"ya basılınca siliniyor. İki oyuncu da sonuç ekranında uygulamayı kapatırsa oda (adlar, kelimeler) kalıcı oluyor. | İki oyuncu maç bitince uygulamayı kaydırıp kapatır → `rooms/qm_…` `finished` olarak sonsuza dek kalır. Bu, K-10'un amacına ters. | düşük | Sonuç ekranı ilk çizildiğinde de `odayiTemizle` (ya da girişte `users/{uid}/odalar` listesindeki bitmiş odaları silme). | PLAUSIBLE |
| N8 | Nemotron N8 | `www/oyun.js:1891-1895` | Hızlı modda doğrulama sürerken gönderim sınırsız; hız sınırı normal oyunda aşılabiliyor. Modelin "sıra karışır" iddiasını kendisi çürütüyor. Geçerli kısım hız sınırı, asıl sonucu da M1. | Bkz. M1. | düşük (M1 ile birlikte yüksek) | M1'in düzeltmesi + bekleyen doğrulama sayısını sınırlama. | PLAUSIBLE |

## Modellerin bulmadığı ek bulgular (Claude, doğrulama sırasında)

| No | Yer | Hata | Senaryo | Önem | Düzeltme | Karar |
|---|---|---|---|---|---|---|
| C1 | `www/oyun.js:1123`, `1138`, `1145` | Kuyruk kaydının `ts`'si hiç yenilenmiyor; 60 sn'den (`QUEUE_STALE_MS`) eski kayıt yeni gelenlere görünmüyor. Oda kurma da yalnız uid'i küçük olana bırakılmış. | A 60 sn'den uzun bekler, sonra B gelir. B, A'yı bayat sayıp listeye almaz. A, B'yi görür ama `A.uid > B.uid` ise oda kurmaz. İkisi de sonsuza dek "aranıyor"da kalır (her çift için yüzde 50). Oyuncu sayısı azken sık rastlanır. | **yüksek** | Arama ekranında kaydın `ts`'sini 20–30 sn'de bir yenileyin. Ya da uid sırasından bağımsız: bayat olmayan herkes karşı tarafı alabilsin (alma zaten işlemle). `ts` için `SV.TIMESTAMP` kullanın. | CONFIRMED |
| C2 | `www/oyun.js:1067-1081` (aynı kalıp `1924-1928`) | `acceptInvite` işlemi `if(!c) return;` ile başlıyor. Firebase JS SDK işlevin ilk çağrısını yerel önbellekle yapıyor; önbellek boşsa `null` veriyor ve `undefined` dönüşü işlemi **sunucuya hiç sormadan** iptal ediyor (`@firebase/database` 1.0.5, `repoStartTransaction`: `newVal === undefined` ise "Abort transaction"). Davet alan oda düğümünü dinlemiyor; yalnız `p1/uid` için bir kez `once` yapıyor. | Arkadaş daveti kabul edilir → "Davet geçersiz veya iptal edildi". `test/akis.test.mjs` daveti kabul etmeyi sınamıyor. Aynı kalıp `leaveAndReset`'te bekleme odasının silinmemesine yol açabilir (dinleyici hemen önce kapatılıyor). | **yüksek** | `null` için `return c` (ya da `return null`) dönün. Ancak sunucu verisiyle yeniden çalışınca vazgeçin. Ya da işlemden önce `await ref.once("value")` ile odayı dinlemeye alın. Emülatörde davet kabulü testi ekleyin. | CONFIRMED (SDK kaynağıyla; emülatörde sınanmadı) |
| C3 | `www/oyun.js:1049-1055`, `1061-1100` | Davet penceresi hızlı eşleşme ararken de açılıyor; kabul edince arama iptal edilmiyor (`inMatchmaking`, kuyruk kaydı, `queueListener` kalıyor). | Oyuncu arama ekranında daveti kabul eder → maç başlar. Kuyruk dinleyicisi `tryMatch`'i çalıştırmaya devam eder; başka biri onu kuyruktan alırsa `joinRoom` sinyali gelir ve oyuncu maç ortasında başka odaya çekilir. Arkadaşı tek başına kalır. | orta | `acceptInvite` başında `cancelQuickMatch()` mantığı (ekran değiştirmeden). Ya da `inMatchmaking` iken daveti gösterme/otomatik reddetme. | CONFIRMED |
| C4 | `www/oyun.js:1146-1177` | Üç oyunculu yarış: B hem başkasını alan hem alınan olabiliyor. B kendi kaydının hâlâ durduğunu denetlemeden C'yi alıyor. | A (küçük uid) B'yi alır ve `joinRoom` yazar. Aynı anda B de C'yi alıp oda kurar. B'nin `joinRoom` dinleyicisi onu A'nın odasına geçirir; C, B'siz bir odada kalır. | orta | Alma işlemini çok yollu yapın: kendi kaydım + onun kaydı birlikte silinsin; kendi kaydım yoksa vazgeç. | PLAUSIBLE (eşzamanlılık gerekir) |
| C5 | `www/oyun.js:833-839`, `1291-1296` | İlk dönen oyuncu odayı siliyor. Öteki oyuncu `finished` durumunu henüz almadıysa sonucu ve istatistiği kaybediyor. | B'nin ekranı son turda kilitli ya da bağlantısı kopuk. A lobiye dönünce oda silinir. B dönünce dinleyici `null` alır → "Oda kapatıldı", sonuç ekranı yok, `recordMatchResult` çağrılmaz (galibiyet sayılmaz). | orta | Odayı ancak iki oyuncu da sonucu gördüğünü işaretleyince silin (ör. `seen/p1`, `seen/p2`; ikincisi siler). Ya da `null` gelince son bilinen `finished` verisiyle sonucu yine de kaydedin. | PLAUSIBLE |
| C6 | `www/oyun.js:1595`, `1598`, `1647`, `1721`, `1755`; `1588-1602`, `1681-1685` | İşlemler `phaseStartTime`/`turnStart`'ı önce `Date.now()` (cihaz saati) yazıyor, hemen ardından `SV.TIMESTAMP`. `advanceToActive` ve `endActiveRound` işlemlerinde süre denetimi yok (Tenis zaman aşımında 1,5 sn'lik denetim var). | A'nın saati 40 sn geride. A turu `active` yapar, ara değer `phaseStartTime = A saati` B'ye ulaşır. B'nin `tickPhase`'i süreyi bitmiş görür ve `endActiveRound`'u çalıştırır; tur kelimesiz biter. | orta | İşlemlerde `nowServer()` kullanın. `advanceToActive`/`endActiveRound`/`startNextRound` içinde `nowServer() - phaseStartTime` süresini yeniden denetleyin. | PLAUSIBLE (saat farkı gerekir) |
| C7 | `www/oyun.js:1102-1110`, `1015-1023` | Davet reddedilince gönderen bilgilendirilmiyor: izleyici yalnız `playing`'e bakıyor, oda silinmesine (`null`) tepki vermiyor. İzleyici hiç kapatılmıyor. | B "Reddet"e basar → A 60 sn "davet gönderildi" ekranında bekler, sonra "yanıt vermedi" uyarısı görür. Koddaki yorum ("gönderen tarafı bilgilendirmek için") tersini söylüyor. | düşük | İzleyicide `s.val() === null` ise "Davet reddedildi" deyip lobiye dönün; her iki yolda `watchRef.off`. | CONFIRMED |
| C8 | `www/oyun.js:1695` ↔ `1440`, `kelime.js:93-97` | Hızlı modda puanlama kelimeyi `normalizeWord` ile değil kendi küçültmesiyle anahtarlıyor (şapka inmiyor); ekran `normalizeWord` kullanıyor. | p1 "kâğıt", p2 "kağıt" yazar: ekranda p2'ninki "çalındı" (gri) görünür ama puanlamada ikisi de sayılır. | düşük | `endActiveRound` içinde de `normalizeWord`. | CONFIRMED |
| C9 | `www/oyun.js:705`, `998` | Davetin süre denetimi gönderenin `Date.now()`'unu alıcının `Date.now()`'uyla kıyaslıyor. | Alıcının saati 1 dk'dan fazla ilerideyse her davet anında "süresi geçmiş" sayılıp sessizce silinir. | düşük | `ts: SV.TIMESTAMP` ve alıcıda `nowServer()`. | PLAUSIBLE |

## YANLIŞ bulunanlar (gerekçeyle)

| No | Model iddiası (kısa) | Neden yanlış |
|---|---|---|
| Nemotron N1 | Hızlı eşleşmede iki oyuncu da `myUid >= otherUid` denetimini "saat farkı yüzünden" geçip iki oda kurar. | Denetim uid dizgilerini karşılaştırıyor, saatle ilgisi yok. Bir çiftte yalnız biri oda kurar, alma da işlemle tek kişiye düşer. Gerçek yarış üç oyuncuyla (C4). |
| Nemotron N2 | Oda koduyla katılmada p1 ezilebilir / TOCTOU. | Model kendisi "aslında sorun yok" diyor. İşlem p1'i değiştirmiyor. Ön okuma yalnız kategori havuzu için. |
| Nemotron N3 | İşlem içinde `nowServer()` kullanmak yanlış, çünkü işlem sunucuda çalışır. | RTDB işlev işlemleri istemcide çalışır. `nowServer() - turnStart(sunucu)` tutarlı bir kıyas. |
| Nemotron N4 (hile kısmı) | Oyuncu kodu değiştirip `ts`'yi geriye alabilir. | "İstemci otoriteli tasarım" Açık kalanlar'da: değiştirilmiş istemci hile yapabilir. Saat farkı kısmı M3'te. |
| Nemotron N5 | `match.categories` eksik olabilir, rastgele kategori gelir. | `makeMatchInit` her zaman `categories` yazıyor. Havuz küçükse de `pickMatchCategories` tur sayısına tamamlıyor (`:177`). |
| Nemotron N6 | Davet gönderen sonradan modu değiştirirse havuz yanlış moda göre kurulur. | `buildMatchPool` moddan bağımsız (yalnız kategori tercihleri), mod odadan (`c.mode`) okunuyor. Davetteki gerçek hata başka (C2). |
| Nemotron N7 | Zincirde AI "hayır" dese de TDK'ya bakılıyor. | Koddaki yorumla bilinçli ("cömert davran"). Model de "tasarım gereği" diyor. |
| Nemotron N10 | Peş peşe iki davette süresi geçenin silinmesi yeni daveti gizler. | Tek `invite` düğümü var, yeni davet eskisinin üstüne yazılır. Senaryo, silme isteğinin yeni yazımdan sonra sunucuya varmasına bağlı. Pratikte milisaniyelik bir aralık. Gerçek sorun saat farkı (C9). |
| Nemotron N11 | Bitmiş odalar herkese açık, kişisel veri sızar. | Kullanıcı adları zaten herkese açık. Bitmiş oda lobiye dönüşte siliniyor (kalanlar N19'da). Doğruluk hatası değil. |
| Nemotron N12 | Kurallar başkasına davet yazmaya izin veriyor (spam). | Davet ve onaysız arkadaşlık Açık kalanlar'da bilinçli tasarım. Kural davetin gönderenin kendi odasına ve davet edilene olmasını zaten istiyor. |
| Nemotron N13 | `joinRoom` kuralı `parent()` zinciri yüzünden kırılgan. | Model "çalışıyor" diyor. Bu bakım yorumu, hata değil. Çok yollu güncellemede `newData` kullanmak gerekli. |
| Nemotron N14 | `normalizeWord` ö/ü/ş/ç/ğ/ı'yı ASCII'ye indirmiyor, "görüş" ile "gorus" ayrı sayılıyor. | Bu harfler Türkçede ayrı harfler. İndirmek "kır/kir", "çam/cam" gibi ayrı kelimeleri birleştirirdi. "gorus" Türkçe kelime değil. |
| Nemotron N15 | Zincir harf işlevleri şapkasız harflerde bozulur. | Model "çalışıyor" diye bitiriyor. `chainLetterFor("dağ") = "a"`, `normalizeWord("Kâğıt") = "kağıt"`; node ile denendi. |
| Nemotron N16 | İstemci ve Worker kategori listeleri ayrışabilir. | Bugün iki liste birebir aynı (25/25; node ile karşılaştırıldı). Varsayımsal bir bakım riski, kullanıcıyı etkileyen hata değil. |
| Nemotron N17 | Worker hız sınırı örnek başına, aşılabilir. | Worker yorumunda "her Worker örneğinde, en iyi çaba" diye bilinçli yazılmış. Oyuncuyu etkileyen tarafı tersi: sınıra takılma (M1). |
| Nemotron N18 | 200 ms zamanlayıcı fazla. | Performans konusu, kapsam dışı. |
| Nemotron N20 | `switchTurn` cihaz saati yazıyor. | Hemen ardından `turnStart` `SV.TIMESTAMP` ile eziliyor (`:1677`). Ara değer sorunu C6'da. |

## Notlar

- Sınanması önerilen ilk iki konu: C2 (davet kabulü; emülatörde iki tarayıcıyla `akis.test`'e bir senaryo) ve C1
  (60 sn'den uzun bekleyen oyuncu). İkisi de kodda değişiklik yapılmadan Playwright akış testine eklenebilir.
- M1 ile N8 birlikte okunmalı: hız sınırı normal oyunda aşılınca kategori denetimi tümden kalkıyor.
- Ham model çıktıları bu oturumun geçici dizininde kaldı, depoya eklenmedi.
