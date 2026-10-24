# Hayalet Avcıları — Dünya Turu: ülke müzikleri (ek tasarım)

- **Tarih:** 24 Ekim 2026
- **Durum:** Kullanıcı onayladı (24 Ekim 2026: "Onaylıyorum, plana işle"); plan `docs/superpowers/plans/2026-10-24-hayalet-ulkeler.md` Görev 17, 18 ve kıta görevlerinin E adımı
- **Ana tasarım:** `docs/superpowers/specs/2026-10-24-hayalet-ulkeler-design.md` (bu belge onun §12'deki "müzik kapsam
  dışı" maddesini kaldırır; geri kalanı aynen geçerlidir)
- **Hedef sürüm:** 3.14.0 (versionCode 47), Dünya Turu ile birlikte
- **Proje:** `hayalet-avcilari/` (Capacitor 8, yalnız Android; web sürümü yok)

## 1. Amaç

Kullanıcının isteği: *"SUNO yu kullanarak her ülke için birkaç sn lik teaser giriş müziği ve arka planda 30 sn de bir
başa saran kültürel bir oyun polifonik müziği ekleyelim"*, *"her ülkenin kültürüne uygun teaser ve müzik"*.

**Başarı ölçütleri**

1. Dünya Turu'nun 51 ülkesinin her birinde ülkeye varışta yaklaşık 5 sn'lik bir teaser, oyun boyunca 27–34 sn'lik
   (çoğunlukla 30 sn) ve başa saran çok sesli bir fon müziği çalar. İkisi de o ülkenin geleneksel çalgılarıyla, o
   ülkenin dünyevî bir halk, dans ya da şenlik türündedir (§6).
2. Döngünün ek yeri duyulmaz: tıklama, kopma ya da boşluk yoktur.
3. Kare hızı düşmez: `cizim.test` ve 6 kişilik `alti.test` müzik çalarken de bugünkü eşikleri geçer.
4. Müzik ayarlanabilir ("🎵 Müzik" kaydırıcısı) ve uygulama arka plana geçince susar.
5. Normal oyun değişmez: orada müzik yoktur.

## 2. Kullanıcının kararları

| Konu | Karar |
|---|---|
| Üretim yolu | **sunoapi.org ile Claude üretir** (24 Ekim 2026). Kullanıcıya Suno koşullarındaki ticari kullanım yasağı kaynağıyla gösterildi; suno.com'da Premier ile üretim ve lisanslı başka servis (ElevenLabs) seçenekleri sunuldu; kullanıcı riski bilerek bu yolu seçti (§10) |
| Paketleme | **Uygulamanın içinde, Web Audio ile kesintisiz döngü** (önerilen). İlk ziyarette indirme ve HTML `<audio loop>` seçilmedi |
| Bölüm 1 | Üretim ve kesim hattı: ~128 vuruş/dk, 120 sn'lik istek, iki parçadan ölçümle seçim, 27–34 sn döngü, ~5 sn teaser, −18 LUFS, Opus 48 kb/sn |
| Bölüm 2 | Çalma: varışta teaser, ardından döngü; tek oyunculu duraklatmada kısılır; arka planda susar; "🎵 Müzik" %60; çevrimiçi her cihaz kendi çalar |
| Bölüm 3–4 | §6'daki 51 ülkelik tür ve çalgı tablosu, olduğu gibi |

## 3. Akış: ne zaman ne çalar

- **Ülkeye varış** (Dünya Turu'nun başlangıç ülkesi ya da uçak geçişinden sonraki ülke; çevrimiçi istemcide odadaki
  ülke değişince): teaser çalar. Teaser bitmeden 0,2 sn önce döngü 0,4 sn'de açılarak başlar ve bölüm boyunca başa sarar.
- **Teaser hazır değilse** (dosya 1,5 sn içinde çözülemediyse): teaser atlanır, döngü hazır olunca 1 sn'de açılarak
  başlar. Çevrimiçi oyuna bölüm ortasında katılan istemcide de teaser çalmaz, döngü açılarak başlar.
- **Bitiş:** damga, oyun sonu, menüye dönüş ve tur sonu ekranında müzik 0,8 sn'de söner.
- **Tek oyunculu duraklatma:** müzik 0,2 sn'de kısılır, devam edilince 0,3 sn'de geri gelir (döngü sessizce sürer,
  yerini kaybetmez). Çevrimiçi menü oyunu durdurmadığı için müzik de sürer.
- **Arka plan:** `document.hidden` olunca ses bağlamı askıya alınır (efektler dahil bütün ses susar), görünür olunca
  sürdürülür. Bugünkü kısa efektlerde fark edilmeyen bu durum sürekli müzikte gereklidir.
- **Normal oyun:** müzik yoktur; menü, Dünya Turu ve pasaport ekranlarında da müzik yoktur.

## 4. Üretim (Suno, sunoapi.org)

- **Araç:** `GENEL-KONULAR/suno/suno.mjs` (bağımlılıksız, gizli anahtar vekil sunucuda). Komut:

  ```bash
  node suno/suno.mjs sarki --sozsuz --model V6 --sure 120 --baslik "Hayalet Avcilari <KOD>" \
    --stil "<ülke betimlemesi>, <ortak kalıp>" --olumsuz "<ortak olumsuz>" --cikis <klasör>
  ```

- **Ortak kalıp** (İngilizce; ülke betimlemesinin arkasına eklenir): `cheerful adventure video game background music,
  rich polyphonic ensemble with a lead melody, a counter-melody and a rhythm section, steady danceable groove at around
  128 BPM, constant energy with no breakdown and no fade-out, loop-friendly, bright warm acoustic mix, instrumental,
  no vocals`. Türün kendi ölçüsü varsa (§6 "Ölçü" sütunu) betimlemede yazılır, örneğin `in 6/8`.
- **Ülke betimlemesi:** §6'daki tür ve çalgıların İngilizce karşılığı. Türk ve yerel tür adları süzgece takılabildiği
  için betimlenir (ör. "halay" yerine `Anatolian folk line-dance`). Sanatçı, eser ve kurum adı yazılmaz.
- **Ortak olumsuz:** `vocals, singing, choir, lyrics, spoken word, religious, hymn, chant, devotional, anthem, military
  march, EDM, trap, dubstep, rap, autotune, distorted guitar, heavy metal, slow ballad, ambient drone, fade out`.
- **Ortak kalıp, 2. sürüm (24 Ekim 2026):** kullanıcı "müzikler maceracı, hareketli tarzda olmalı; Türkiye'ninki biraz
  fazla duygusal olmuş, şimdilik böyle kalsın, sonra hepsini bir elden geçireceğiz" dedi. Henüz üretilmemiş ülkeler
  (Görev 11–13: PK … AR) şu kalıpla istenir: `upbeat energetic adventure video game background music, playful and
  heroic, driving rhythm,` + 1. sürümün `rich polyphonic ensemble …` ile başlayan kalanı; ortak olumsuza `sad,
  melancholic, sentimental, emotional, lament, nostalgic, romantic` eklenir. Üretilmiş 32 ülkenin istek kaydı
  gönderildiği gibi kalır. Sürüm 3.14.0'dan önce bütün müzikler kullanıcıyla birlikte gözden geçirilir; yenilenecek
  ülkeler 2. sürümle yeniden üretilir (kredi payı aşağıda).
- **Toplu gözden geçirme (24 Ekim 2026):** Türkiye 2. kalıpla ve kavalın yerine zurnayla (davul-zurna, Anadolu
  şenliğinin sesi) yeniden üretildi: görev `7b7659d0dbc5ce717768e68a3d2fe01c`, 2. parça, 130 vuruş/dk, 12 kredi, kalan
  152,5. Öteki 50 ülke için ölçümle seçim denendi (majör/minör eğilimi, vuruş yoğunluğu, parlaklık, tempo): ölçüt
  kullanıcının "duygusal" bulduğu Türkiye'yi ayırt edemediği için kredi tahmine harcanmadı. Kalan ülkeler kullanıcının
  dinleme sayfasındaki (claude.ai yayını) "Yenilensin" işaretiyle, kalan krediyle (≈ 12 ülke) sonraki sürümde yenilenir.
- **Neden 128 vuruş/dk:** 4/4'te 64 vuruş (16 ölçü) tam 30,0 sn eder; tempo ±10 saptığında da döngü 27–34 sn içinde tam
  ölçüye oturur.
- **İstek metinleri** `hayalet-avcilari/araclar/muzik-istekleri.json` dosyasındadır: 51 kayıt,
  `{ kod, stil, olumsuz }`; gönderilen istek budur.
- **Sıra:** önce Türkiye ve Japonya (ana tasarım §11'deki taslak onayıyla birlikte; iki parçanın ikisi de kullanıcıya
  gönderilir, kullanıcı seçer). Onaydan sonra kalan 49 ülke kıta kıta (Avrupa → Afrika → Asya → Amerika).
- **Kredi:** istek başına 12–13; 51 ülke ≈ 640. 24 Ekim 2026'da kalan 776,5, yani yaklaşık 10 yeniden deneme payı.
  Her kıtanın sonunda kalan kredi bildirilir; yetmeyecekse üretim durur ve kullanıcıya söylenir.
- **Süzgeç hatası** (`SENSITIVE_WORD_ERROR`): kredi harcatmaz; sözcük İngilizce betimlemeyle değiştirilip yeniden
  gönderilir.
- **Ham parçalar** depoya girmez; işlenirken oturumun geçici klasöründe durur. Sağlayıcı 14 gün saklar
  (`suno.mjs indir <görev>`); görev ve parça kimlikleri kayıtta tutulur (§7).

## 5. Kesim hattı (`araclar/muzik_kes.py`)

Python 3 + numpy + ffmpeg (ortamda kurulu; yeni bağımlılık yok). Girdi: bir ülkenin iki parçası. Çıktı: seçilen
parçadan döngü ve teaser dosyası, ölçüm kaydı.

1. **Çözme:** çözümleme için tek kanal 22 050 Hz; çıktı için stereo 48 000 Hz kayan nokta.
2. **Tempo ve vuruşlar:** spektral akı (`tempo.py`'nin yöntemi) → öz ilinti ile 70–180 vuruş/dk arası tempo; oktav
   hatasına karşı 128 çevresinde log-normal ön ağırlık. Vuruş yerleri dinamik programlamayla (Ellis 2007) bulunur.
3. **Döngü adayları:** parçanın ilk 10 sn'si ve son 15 sn'si dışında, her vuruştan başlayan ve uzunluğu k vuruş olan
   aralıklar; L = k × vuruş süresi, 27 ≤ L ≤ 34 sn. k 4'ün katıysa küçük bir ek puan alır.
4. **Ek yeri uyumu:** adayın başı (s) ile sonu (s + L) çevresindeki ±1 vuruşluk pencerelerin özellikleri (12 perde
   sınıfı ve 24 bantlı log-enerji) kosinüs benzerliğiyle karşılaştırılır; iki pencerenin ses düzeyi oranı da puana
   girer.
5. **Sabitlik:** döngü içindeki vuruş başına ses düzeyinin değişim katsayısı; kırılma ya da sönme puanı düşürür.
6. **Parça seçimi:** `puan = 0,5 × ek yeri + 0,3 × sabitlik + 0,2 × tempo yakınlığı` (tempo yakınlığı
   `1 − |T − 128| / 40`, 0'da kırpılır). İki parçanın en iyi adayları karşılaştırılır, yüksek olan alınır. Türkiye ve
   Japonya'da ikisi de işlenip kullanıcıya gönderilir; kullanıcının seçimi geçerlidir.
7. **Döngünün kurulması** (A özgün ses, s başlangıç, L uzunluk, x = 0,25 sn çapraz geçiş, g = 0,06 sn koruma):
   - `B[t] = A[s + t]` (t < L − x − g);
   - çapraz geçiş: `B[t] = A[s + t]·cos φ + A[s − (L − t)]·sin φ`, φ 0'dan π/2'ye (L − x − g ≤ t < L − g);
   - koruma: `B[t] = A[s − (L − t)]` (L − g ≤ t < L). Döngünün sonu, başlangıcın hemen öncesindeki özgün sesle biter.
   - **Dosya:** `A[s − P … s) + B + A[s … s + Q)`, Q = 0,1 sn, P = 0,1 sn + k × 2,5 ms (k = 0…7). Böylece çözücü
     baştan birkaç örnek eklese ya da kırpsa da (P, Q ve g'den küçük her kayma) ek yeri kesintisiz kalır. Oyun
     `loopStart = P`, `loopEnd = P + L` kullanır (kayıttaki `bas` ve `son`).
   - **Çerçeve evresi taraması:** kaynakta kesintisiz ek yerinin iki ucu Opus'un 20 ms'lik çerçevelerine farklı
     evrede düşer. Ek yeri vuruş atağının 5 ms önünde, ön-yankı bölgesindedir; iki uç farklı hatayla kurulur ve
     çözülmüş dosyada sıçrama oluşabilir (Görev 7'de Polonya'da 0,174, sınır 0,085). Bu yüzden döngü k = 0'dan
     başlayarak kodlanıp çözülür; ek yeri sıçramasının döngü içi farkların 99. yüzdeliğine oranı ölçülür. İlk
     ≤ 0,5 olan ya da en küçük oranlı aday yazılır, oran kayıtta `ekOrani` olarak durur. İçerik ve L değişmez.
8. **Teaser:** aynı parçadan, vuruşla başlayan ve süresi 4 sn'ye en yakın tam vuruşlu pencere (128 vuruş/dk'da 4/4'te
   8 vuruş = 2 ölçü; ilk 10 sn ve son 15 sn dışında), en yüksek akı ve ses düzeyi toplamıyla seçilir; 0,02 sn'de açılır, sonuna 1,2 sn'lik sönüş eklenir
   (toplam ~5 sn; sınır 3–8 sn).
9. **Ses düzeyi:** döngü doğrusal kazançla −18 LUFS'ye (ffmpeg `ebur128` ölçümü) getirilir; teaser aynı kazancı alır.
   Gerçek tepe −1,5 dBTP'yi aşarsa yumuşak sınırlayıcı (`alimiter`) uygulanır.
10. **Kodlama:** Ogg Opus, 48 kb/sn, stereo, 48 kHz (`libopus`, `-application audio`). Döngü ~185 KB, teaser ~30 KB;
    51 ülke ≈ 11 MB (üst sınır 14 MB).
11. **Öz sınama** (`muzik_kes.py --sina`): girişi ve bitişi farklı, 128 vuruş/dk'lık yapay bir parça (akor + vuruş
    deseni, 8 ölçülük döngülü gövde) üretilir; bulunan döngü 64 vuruş olmalı (uzunluk farkı en çok vuruş süresinin
    %1'i), ek yerindeki sıçrama parçanın içindeki olağan örnekten örneğe farkı aşmamalı, teaser 3–8 sn olmalı.

## 6. Ülke tablosu

Yalnız dünyevî halk, dans ve şenlik türleri seçildi; hepsi sözsüz. Bilerek seçilmeyenler: kavvali (Pakistan; dinî),
gnava (Fas; ruhanî), bon odori ve tapınak müziği (Japonya), tanura (Mısır; dinî kökenli), begena (Etiyopya; kilise
çalgısı), kılıçlı ve hançerli danslar (Suudi Arabistan'da ardah, Yemen'de bara). Boss kıyafetiyle bağ kurulan yerde
aynı bölgenin türü seçildi (Polonya krakowiak, Birleşik Krallık İskoç ceilidh, Brezilya frevo).

| # | Kod | Ülke | Tür | Çalgılar | Ölçü |
|---|---|---|---|---|---|
| 1 | TR | Türkiye | Anadolu halayı, şenlik havası | bağlama, zurna, darbuka, davul (24 Ekim 2026'ya dek kaval) | 2/4 |
| 2 | UA | Ukrayna | hopak dansı | bandura, tsimbali, sopilka, keman | 2/4 |
| 3 | PL | Polonya | krakowiak dansı | keman, klarnet, akordeon, kontrbas | 2/4 |
| 4 | DE | Almanya | Bavyera polkası | akordeon, klarnet, tuba, trompet | 2/4 |
| 5 | GB | Birleşik Krallık | İskoç ceilidh reel'i | keman, akordeon, tin whistle, hafif gayda, bodhrán | 4/4 |
| 6 | FR | Fransa | bal-musette (hızlı vals) | musette akordeonu, caz gitarı, kontrbas | 3/4 |
| 7 | IT | İtalya | tarantella | mandolin, akordeon, tamburello, gitar | 6/8 |
| 8 | ES | İspanya | flamenko rumbası | flamenko gitarı, kahon, palmas, kastanyet | 4/4 |
| 9 | MA | Fas | Amazigh halk dansı | lotar, ribab, bendir, el çırpma | 4/4 |
| 10 | DZ | Cezayir | Kabil halk dansı | mandol, ajouag (kaval), derbuka, bendir | 4/4 |
| 11 | CI | Fildişi Sahili | balafon şenliği | balafon, cembe, konuşan davul, gitar | 4/4 |
| 12 | GH | Gana | highlife | palmiye şarabı gitarları, gyil, kpanlogo davulları, çıngırak | 4/4 |
| 13 | NG | Nijerya | juju | konuşan davul (dùndún), shekere, iç içe gitarlar | 4/4 |
| 14 | CD | Kongo DC | soukous | sebene gitarları, likembe, bas, konga | 4/4 |
| 15 | AO | Angola | semba | gitarlar, dikanza, ngoma davulları, akordeon | 2/4 |
| 16 | ZA | Güney Afrika | kwela | pennywhistle, banjo, akustik gitar, bas, davul | 4/4 |
| 17 | MZ | Mozambik | marrabenta ve timbila | timbila, gitar, bas, davul | 4/4 |
| 18 | MG | Madagaskar | salegy | valiha, kabosy, akordeon, kaiamba | 6/8 |
| 19 | TZ | Tanzanya | ngoma şenliği | marimba, zeze, ngoma davulları, el çırpma | 4/4 |
| 20 | UG | Uganda | Busoga şenliği | embaire, adungu, endingidi, engoma | 4/4 |
| 21 | KE | Kenya | benga | benga gitarları, nyatiti, bas, davul | 4/4 |
| 22 | ET | Etiyopya | eskista halk dansı | krar, masenqo, washint, kebero; beşli Etiyopya dizisi | 6/8 |
| 23 | SD | Sudan | Sudan dans müziği | ud, tanbur (Sudan liri), daluka, el çırpma; beşli dizi | 4/4 |
| 24 | EG | Mısır | Saidi şenliği | mizmar, rababa, tabla, rıkk | 4/4 |
| 25 | YE | Yemen | Yemen halk dansı | kanbus, ud, mirvas davulları, el çırpma | 4/4 |
| 26 | SA | Suudi Arabistan | Hicaz semrisi | ud, kanun, mirvas, tabl, el çırpma | 4/4 |
| 27 | PS | Filistin | dabke | mijwiz, ud, darbuka, def, el çırpma | 4/4 |
| 28 | IQ | Irak | çobi dansı | santur, cuze, kanun, darbuka | 4/4 |
| 29 | IR | İran | Mahur dizisinde şenlik havası | santur, tar, kemençe, tombak, def | 6/8 |
| 30 | UZ | Özbekistan | lazgi dansı | dutar, gıjak, nay, doira | 4/4 |
| 31 | AF | Afganistan | attan halk dansı | rubab, dutar, tabla, dhol | 6/8 |
| 32 | PK | Pakistan | bhangra | dhol, tumbi, algoza, çimta | 4/4 |
| 33 | IN | Hindistan | Racastan halk dansı | sitar, bansuri, tabla, dholak | 4/4 |
| 34 | BD | Bangladeş | Bengal yeni yıl panayırı | dotara, bansuri, dhol, ektara | 4/4 |
| 35 | MM | Myanmar | saing waing şenliği | pat waing, kyi waing, hne, saung | 4/4 |
| 36 | TH | Tayland | Isan halk müziği | khaen, phin, ranat, ching zilleri | 4/4 |
| 37 | MY | Malezya | joget dansı | keman, akordeon, gendang davulları, gong | 4/4 |
| 38 | ID | Endonezya | Bali gamelanı ve Sunda angklungu | gong kebyar gamelanı, angklung, kendang | 4/4 |
| 39 | PH | Filipinler | tinikling dansı | rondalla (bandurria, laúd, gitar), kulintang gongları | 3/4 |
| 40 | VN | Vietnam | Vietnam halk şenliği | đàn tranh, đàn bầu, sáo, trống | 4/4 |
| 41 | CN | Çin | Bahar Bayramı şenliği | guzheng, erhu, dizi, pipa, davul ve gonglar | 4/4 |
| 42 | KR | Güney Kore | samul nori ritmi üzerine ezgi | gayageum, haegeum, janggu, buk, kkwaenggwari | 12/8 |
| 43 | JP | Japonya | min'yō halk dansı | tsugaru şamiseni, şinobue, koto, taiko | 4/4 |
| 44 | RU | Rusya | barınya halk dansı | balalayka, domra, bayan, kaşıklar | 2/4 |
| 45 | CA | Kanada | Québec keman reel'i | keman, akordeon, ayak vuruşu, kaşıklar, gitar | 4/4 |
| 46 | US | ABD | bluegrass | banjo, keman, mandolin, gitar, kontrbas | 4/4 |
| 47 | MX | Meksika | mariachi (son jalisciense) | trompet, keman, vihuela, guitarrón, gitar | 6/8 |
| 48 | CO | Kolombiya | cumbia | gaita flütleri, tambora, llamador, marakas, akordeon | 4/4 |
| 49 | PE | Peru | huayno | quena, charango, zampoña, bombo | 2/4 |
| 50 | BR | Brezilya | frevo karnavalı | trompet, trombon, saksafon, surdo, caixa | 2/4 |
| 51 | AR | Arjantin | milonga (tango ailesinin hızlısı) | bandoneon, keman, piyano, kontrbas | 2/4 |

## 7. Dosyalar ve veri

| Yol | İçerik |
|---|---|
| `www/muzik/<KOD>-dongu.ogg`, `www/muzik/<KOD>-giris.ogg` | Döngü ve teaser (Opus) |
| `www/ulke-muzikleri.js` | Kesim hattının ürettiği veri: `window.ULKE_MUZIKLERI = { TR: { dongu: "muzik/TR-dongu.ogg", bas, son, giris: "muzik/TR-giris.ogg", girisSure, tempo }, … }` (`bas` ve `son` sn: `loopStart` ve `loopEnd`). Elle düzenlenmez. `index.html`'de `dunya-turu.js`'ten sonra, `muzik.js`'ten önce yüklenir |
| `www/muzik.js` | Çalar (§8); `ulke-muzikleri.js`'ten sonra, `arkadaslar.js` ve `game.js`'ten önce yüklenir |
| `araclar/muzik-istekleri.json` | 51 ülkenin Suno istek metni (§4) |
| `araclar/muzik_kes.py` | Kesim hattı ve öz sınaması (§5) |
| `araclar/muzik-kayit.json` | Her ülke için görev ve parça kimlikleri, iki parçanın puanları, seçilen parça, tempo, döngü ve teaser ölçümleri, LUFS, harcanan ve kalan kredi |

## 8. Çalar (`www/muzik.js`)

`game.js`'teki `audio` ses motorunu kullanır; yeni bağımlılık yoktur.

- **Ses kategorisi:** `audio.volumes.muzik` (varsayılan 0,6), `save.volumes.muzik` ile saklanır. Müzik tek bir ana
  kazanç düğümünden geçer: `kazanç = audio.enabled ? volumes.muzik : 0`.
- **Arabirim:**
  - `muzikHazirla(kod, { yalnizGiris } = {}) -> Promise<boolean>`: dosyaları getirir ve çözer; önbellekte en çok iki
    ülke tutulur, eskisi atılır.
  - `turMuzigiBaslat(kod, { giris = true } = {})`: §3'teki sırayla teaser ve döngü. `src.loop = true`,
    `loopStart = bas`, `loopEnd = son`, `src.start(t, bas)`. Ses kapalıysa ya da kayıt yoksa hiçbir şey yapmaz.
  - `turMuzigiSondur(sure = 0.8)`: kazancı söndürür, kaynakları durdurur.
  - `muzikDuraklat(evet)`: tek oyunculu duraklatmada kısar ya da geri getirir.
  - `muzikSesiniUygula()`: kaydırıcı ve ses düğmesi değişince çalan müziği anında ayarlar.
  - `muzikDurumu() -> { calan: "giris"|"dongu"|null, kod, loopStart, loopEnd, kazanc, kaynak }`: sınamalar için
    (`kaynak`: çalan müzik kaynaklarının sayısı; iki müziğin üst üste çalmadığını gösterir).
- **Akış kancaları** (ana tasarımın Görev 6 ve 14'te kurulan işlevlerine): ülkeye varış → `turMuzigiBaslat`; bölüm
  başladıktan 5 sn sonra sıradaki ülke için `muzikHazirla(kod, { yalnizGiris: true })`; damga, `endGame`,
  `quitToMenu`, tur sonu → `turMuzigiSondur`; `pauseGame` / `resumeGame` (yalnız tek oyunculu) → `muzikDuraklat`;
  `toggleSound` kapalı → `turMuzigiSondur(0.2)`, açık ve Dünya Turu'nda oyun sürüyorsa → `turMuzigiBaslat(kod,
  { giris: false })`.
- **Arka plan:** `visibilitychange` → gizliyken `audio.ctx.suspend()`, görünür olunca `audio.ctx.resume()`.
- **Bellek:** oynanan ülkenin çözülmüş döngüsü ~12 MB (30 sn × 48 kHz × 2 kanal × 4 bayt), teaser ~2 MB. Sıradaki
  ülkenin yalnız teaser'ı önceden çözülür; döngüsü teaser çalarken çözülür, eskisi söndükten sonra bırakılır.
- **Hata:** getirme ya da çözme hatasında müzik çalmaz, oyun sürer; uyarı bir kez konsola yazılır.

## 9. Ayar ve diller

- Ses Ayarları'na en üste "🎵 Müzik" kaydırıcısı (`vol-slider-muzik`, `vol-label-muzik`) eklenir; bugünkü üç
  kaydırıcının düzenini izler.
- Yeni metin anahtarları (en az "🎵 Müzik") 5 dile çevrilir; `araclar/sozluk.mjs denetle` temiz kalır.

## 10. Hak notu ve kullanıcı kararı

- Suno Kullanım Koşulları (son düzeltme 10 Ağustos 2026, yürürlük 3 Eylül 2026): *"Obtaining a copy of an Output by any
  means other than a download channel made available by Suno is prohibited."* ve *"You may not commercially exploit
  Output that has not been downloaded by you through an approved channel."* (https://suno.com/terms)
- sunoapi.org Suno'nun onaylı kanalı değildir; Hayalet Avcıları reklamlı bir Play uygulaması olduğu için kullanım
  ticaridir. suno.com'da ticari hak Pro (ayda 20 indirme) ve Premier (ayda 60 indirme) planlarındadır
  (https://suno.com/pricing). ElevenLabs Music ücretli planda oyunlar dahil ticari kullanıma açıktır
  (https://elevenlabs.io/docs/help-center/product/content-production/music/what-is-eleven-music).
- **Karar:** Kullanıcı bu bilgilerle 24 Ekim 2026'da "sunoapi.org ile ben üreteyim" seçeneğini seçti; şikâyet ya da
  mağazadan kaldırma riski kullanıcıdadır. İleride müzikler aynı istek metinleriyle suno.com'da ya da lisanslı bir
  serviste yeniden üretilirse yalnız `www/muzik/` ve `ulke-muzikleri.js` değişir; çalar ve kesim hattı aynen kalır.
- README'ye müziklerin kaynağı ve bu not yazılır.

## 11. Hata ve uç durumlar

- Ülkenin müzik kaydı ya da dosyası yok: o ülkede müzik çalmaz, oyun sürer (sınamalar 51/51'i ister).
- Çözücü dosyanın başına sessizlik ekler ya da kırpar: §5.7'deki ön ve son pay ek yerini korur.
- Ses kapalıyken ülke değişir: hiçbir kaynak oluşturulmaz.
- Oyun hızlıca bitip yeniden başlarsa: önceki müzik söndürülür, iki döngü üst üste çalmaz.
- Çevrimiçi: her istemci kendi cihazında çalar; istemciler arasında saniye eşleşmesi yoktur, ağ trafiği değişmez.

## 12. Testler

- **`python3 araclar/muzik_kes.py --sina`** (§5.11).
- **`test/muzik.test.mjs`** (Playwright):
  - **Varlıklar:** 51 ülkenin her biri için `ULKE_MUZIKLERI` kaydı ve iki dosya var; Chromium'da `decodeAudioData` ile
    çözülür; döngü (`son − bas`) 27–34 sn, teaser 3–8 sn.
  - **Ek yeri:** çözülmüş döngüde `loopEnd → loopStart` geçişindeki örnek sıçraması döngünün içindeki değerlerin 99.
    yüzdeliğini aşmaz. Spektral akı 99. yüzdeliği ya da aynı noktanın kesintisiz akısının 1,15 katını aşmaz: ek yeri
    vuruş atağının hemen önündedir, güçlü bir vuruşun kendi atağı 99. yüzdelik düzeyinde olabilir.
  - **Ses düzeyi:** döngülerin RMS düzeyi ortancadan en çok ±2 dB sapar.
  - **Boyut:** `www/muzik/` toplamı ≤ 14 MB.
  - **Çalar:** Dünya Turu'nda başlangıçta teaser, ardından `loop = true` ve doğru `loopStart` / `loopEnd` ile döngü;
    `turMuzigiSondur` sonrası `calan = null`; kaydırıcı kazancı anında değiştirir; ses kapalıyken kaynak yok; normal
    oyunda kaynak yok; `document.hidden` iken bağlam askıda.
- **Süren testler:** `cizim` ve 6 kişilik `alti` müzik çalan Dünya Turu ülkelerinde de eşikleri geçer; `dil` (yeni
  kaydırıcı, 6 dil, 390 ve 340 px); sözlük denetimi.
- **Kulak denetimi:** Türkiye ve Japonya'nın iki parçası kullanıcıya gönderilir; kalan ülkelerde her kıtanın sonunda
  seçilen parçalar gönderilir.

## 13. Plana etkisi

Planda yeni görevler Görev 17 (kesim hattı) ve Görev 18 (çalar) adını alır; yürütme sırası 1–4, 17, 5, 6, 18, 7–16.

- **Yeni görev (Görev 5'ten önce):** kesim hattı (`muzik_kes.py` ve öz sınaması) ve 51 istek metni
  (`muzik-istekleri.json`).
- **Görev 5 (taslak onayı):** Türkiye ve Japonya müzikleri üretilir, işlenir; görsellerle birlikte tek onaya sunulur.
- **Yeni görev (Görev 6'dan sonra):** çalar, ayar, akış kancaları, `muzik.test` ve dil anahtarları.
- **Görev 7–13 (kıtalar):** her biri kendi ülkelerinin müziğini üretir, işler ve kullanıcıya gönderir; son kıta 51/51
  müzik denetimini çalıştırır.
- **Görev 15 ve 16:** müzik çalarken kare hızı ve boyut doğrulaması; sürüm notu ("🎵 her ülkeye kendi müziği"),
  README ve hak notu.

## 14. Kapsam dışı

- Normal oyunun müziği; menü, Dünya Turu ve pasaport ekranlarının müziği; ülke kartında müzik önizlemesi.
- Sözlü şarkılar; kullanıcının müzik seçmesi; çevrimiçi oyuncular arasında müzik eşzamanlaması.
- Müziklerin suno.com'da ya da başka bir serviste yeniden üretilmesi (§10'daki karar değişirse ayrı iş).
