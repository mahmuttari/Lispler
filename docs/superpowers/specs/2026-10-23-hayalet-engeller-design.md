# Hayalet Avcıları — Eğri hatlı, temaya özel engeller (tasarım)

- **Tarih:** 23 Ekim 2026
- **Durum:** Kullanıcı onayladı (23 Ekim 2026: "Onaylıyorum, plana geç"); uygulama planı `docs/superpowers/plans/2026-10-23-hayalet-engeller.md`
- **Hedef sürüm:** 3.13.0 (versionCode 45), arkadaş özelliğiyle birlikte tek inceleme turu
- **Proje:** `hayalet-avcilari/` (Capacitor 8, HTML5 canvas, `www/game.js`)
- **Onaylı taslak:** `docs/superpowers/specs/2026-10-23-hayalet-engeller/` (katalog ve oyun içi görüntüler, taslak ressamlar `taslak.js`)

## 1. Amaç

Kullanıcının isteği: *"Suların, duvarların, bütün engel objelerin şekilleri hepsi dikdörtgen. Onları daha güzel
formlarda yapalım. Mesela duvarlar kale gibi olabilir, hayaletlere uygun ürkünç çocuklara uygun objeler eklenebilir."*
Taslağa işaretle eklenen yön: *"konturler daha değişken parabolik dairesel formlarda olsun"* (göl kıyısı girintili
çıkıntılı, kale üstü kuleli ve mazgallı, lavdan alev dilleri yükselir).

**Başarı ölçütleri**

1. Oyunda hiçbir engelin dış hattı düz dikdörtgen değildir; hatlar daire, elips ve yay parçalarından oluşur.
2. Her bölüm temasının kendi duvarı ve iki objesi vardır; su, diken ve lav da yeni biçimdedir.
3. Oyuncu engeli gördüğü yerde engeller: görünmeyen köşeye takılma, suyun ya da duvarın "içinden" yürüme yoktur.
4. Kare hızı düşmez (`cizim.test` ve 6 kişilik `alti.test` bugünkü eşikleri geçer).
5. Çevrimiçi oyunda herkes aynı engelde aynı biçimi ve aynı süsü görür; eski sürümle aynı odada oynanabilir.

## 2. Kullanıcının kararları

| Konu | Karar |
|---|---|
| Yeni objeler ne olsun | **Engel kılığı**: mevcut iç blokların bir kısmı obje olarak çizilir; engel sayısı, yeri ve boyutu değişmez |
| Temalar | **Her temaya özel set** (6 tema × duvar + 2 obje + su kıyısı) |
| Yöntem | **Kodla çizim, bölüm başında hazırlanır** (önbellek); her karede yalnız küçük hareketler |
| Kurallar (Bölüm 1) | Onaylandı; çarpışma kuralı aşağıdaki gibi güncellendi |
| Tema listesi (Bölüm 2) | Onaylandı (§4) |
| Üslup | Onaylandı: taslaklardaki sevimli çizgi film üslubu, eğri hatlarla (ikinci taslak) |
| Çarpışma | **Çizilen eğri hattı izler**; biçim eski dikdörtgenin içinde kalır |
| Yapı ve performans (Bölüm 4) | Onaylandı (§6, §7) |
| Test ve sürüm (Bölüm 5) | Onaylandı: arkadaşlarla birlikte 3.13.0 (§9, §10) |

## 3. Kurallar

1. **Harita aynı kalır.** `buildWalls`, `buildWaters`, `buildHazards` dokunulmadan kalır: engellerin yeri ve
   boyutu (dikdörtgen) bugünkü gibi bölümden ve dünya merkezinden üretilir. Yerleşimdeki çakışma denetimleri de
   dikdörtgenle yapılmaya devam eder (eski sürümle aynı harita).
2. **Biçim dikdörtgenin içindedir.** Her engelin biçimi, kendi dikdörtgeninin içinde kalan parçaların birleşimidir:
   daire, elips, yuvarlak köşeli kutu. Kıyı ve kenar süsleri de dikdörtgenin içinde kalır. Tek istisna harita sınırı
   şeritleridir: dünyanın dışına bakan kenarları (oyuncunun gidemeyeceği yer) yuvarlak köşe için dışarı uzayabilir.
3. **Çarpışma biçimi izler.** `collidesWalls`, `collidesWaters`, `collidesSpikes`, `collidesLavas` dikdörtgen
   yerine biçime bakar. Oyuncu, hayalet, mermi, bot, doğma ve `freeSpot` aynı işlevleri kullandığı için hepsi
   kendiliğinden biçime uyar. Duvarlarda ön yüz (3/4 görünüşte alttaki koyu yüz) çarpışmaya dahildir: gövde kutusu
   çarpışmada `d` kadar aşağı uzatılır. Su ve lavın kıyısı yürünür (kıyı biçimin dışındadır; çarpışma suyun ve lavın
   kendisidir). Objelerin kenar süsü (çit, çalı, taş) engelin parçasıdır: obje çarpışması biçimin 3 px büyütülmüşüdür.
   Diken plakasında hasar alanı plaka ve 2,5 px kırmızı kenarıdır. *Son incelemeden:* engele değen oyuncu ve bot
   yüzey boyunca kayar (`kayarakYuru`: hedef, uzaklık alanının eğimi yönünde dışarı itilir; adım uzamaz); elipsin
   işaretli uzaklığı eğimle bölünmüş yaklaşımla hesaplanır (eski formül uzun eksende ~21 px görünmez duvar yapıyordu).
4. **Eski sürümle karışık oda.** Biçim dikdörtgenin içinde kaldığı için eski sürüm (dikdörtgen çarpışma) yalnız daha
   geniş bir alana takılır; harita, ağ verisi ve kurallar değişmez.
5. **Aynılık.** Kılık seçimi ve bütün süslerin yeri tohumlu rastgele sayıyla (xorshift32) bölüm numarası, engel türü,
   sırası ve dikdörtgeninden üretilir. `engeller.js`'te `Math.random` yoktur. Aynı bölümde her cihaz aynı biçimi ve
   aynı resmi üretir.
6. **Kılık seçimi.** İç bloklar `buildWalls`'un ürettiği sırayla `i = 0, 1, …` numaralanır. Başka bir iç blokla
   kesişen blok her zaman temanın **duvarı** olur (kesişen bloklar tek bir kale bütünü gibi görünür); kesişmeyen blokta
   `(i + bölüm) % 3` değeri 0 ise duvar, 1 ise 1. obje, 2 ise 2. obje olur. Harita sınırının dört şeridi
   (`game.walls[0..3]`: üst, alt, sol, sağ) her zaman temanın duvarıdır.
7. **3/4 görünüş.** Duvar ailesinin ön yüzü biçimin altında, dikdörtgenin içinde çizilir; hiçbir sabit çizim
   dikdörtgenin üst kenarından yukarı taşmaz. Tek istisna lavın alev dilleridir (her karede çizilen ince süs, çarpışmaya
   girmez).
8. **Çocuklara uygun içerik.** Gülen ya da uykulu yüzler, yarasa, örümcek ağı, mum, ateş böceği; kan, kafatası,
   iskelet ve dinî sembol yoktur.
9. **Su mavidir.** Su her temada aynı mavi kalır (3.x kararı); temaya göre değişen yalnız kıyısı ve süsüdür.

## 4. Tema setleri

Tema `(bölüm − 1) % 6` ile döner (`LEVEL_THEMES`, `getTheme`). Renkler temanın paletinden gelir.

| Tema | Duvar (biçim ailesi) | 1. obje | 2. obje | Su kıyısı |
|---|---|---|---|---|
| **Mor Şato** | Taş kale (kale): yuvarlak köşeli gövde, üstten taşan külahlı kuleler ve mazgallar, ön yüzde ışıklı kemerli pencereler | Mezarlık (yama): taş kenar, önde demir çit, sevimli mezar taşları (yarasa oyma; taslaktaki hilal §3.8 gereği son incelemede kaldırıldı), taşın arkasından bakan hayalet, mum | Balkabağı tarlası (yama): tahta çit, sürülmüş toprak, sarmaşık, gülen fener balkabakları | Kale hendeği: taş kıyı |
| **Yeşil Orman** | Kütük çit (kütük): üstte kütük uçları, kenarda boyları değişen yuvarlak kütük başları, önde dikey kütükler ve ip | Ürkünç ağaçlar (yama): çalı kenar, kıvrık dallı ağaçlar, kovukta parlayan sevimli gözler, yarasa | Dev mantar halkası (yama): yosun kenar, benekli mantarlar, ortada yüzlü dev mantar, ateş böcekleri | Sazlıklı gölet: çimen kıyı, kamış, nilüfer |
| **Çöl** | Kum taşı harabe (kale ailesi, kırık): gövde, farklı boylarda kırık sütun başları, ön yüzde çatlak kum taşı | Kaktüs bahçesi (yama): çakıl kenar, kollu ve çiçekli, uykulu yüzlü kaktüsler | Mumya lahdi (yama): kumlu taş zemin, kapağı aralık lahit, içinden bakan sevimli mumya | Vaha: kum kıyı, palmiye yaprakları |
| **Buz Mağarası** | Buz kalesi (kale ailesi): buz tuğla gövde, yuvarlak buz kuleleri, ön yüzde sarkıtlar | Kardan adam (yama): kar yığını kenar, atkılı, havuç burunlu, gülümseyen kardan adam(lar) | Buz kristali kümesi (yama): buzlu zemin, parlayan kristaller | Buz kenarlı göl: buz kıyı, yüzen buz parçaları |
| **Volkan** | Bazalt kaya (kaya): yuvarlak yumrulardan kaya kütlesi, kızıl çatlaklı ön yüz | Ejderha yuvası (yama): dal ve çalıdan yuva kenarı, benekli ejderha yumurtaları | Alev ruhlu kayalar (yama): kaya kümesi, üstünde gülen küçük alev ruhları | Sıcak su: bazalt kıyı, buhar kabarcıkları |
| **Uzay** | Uzay istasyonu (istasyon): yuvarlak köşeli gövde, köşelerde yuvarlak modüller, perçinler, yanıp sönen ışıklar | Göktaşı (kaya): kraterli, parlak kristalli kaya kümesi | Düşmüş UFO (yama): iniş izi zemin, elips gövde, cam kubbede el sallayan uzaylı hayalet | Metal kenarlı havuz: metal kıyı, yıldız yansımaları |
| **Ortak** | — | — | — | Diken plakası (plaka): yuvarlak hatlı, kırmızı kenarlı, metal sivri uçlar · Lav (göl): kayalık kıyı, bugünkü lav görünümü, üst hattan yükselen alev dilleri |

Mor Şato ve Yeşil Orman'ın onaylı taslağı: `docs/superpowers/specs/2026-10-23-hayalet-engeller/katalog-*.jpg` ve
`oyun-*.jpg`. Kalan dört tema aynı üslupla (kalın kenar, yumuşak gölge, parlak göz ve alev, çizgi film renkleri).

## 5. Biçim aileleri

Bütün ölçüler engelin yerel koordinatındadır (0,0)–(w,h). Parçalar: `{t:"d",x,y,r}` daire, `{t:"e",x,y,rx,ry}` elips,
`{t:"k",x,y,w,h,rr}` yuvarlak köşeli kutu. Tohumlu rastgele `r()` ile üretilir.

- **Göl** (su, lav): ortada elips (yaklaşık w×0,36, h×0,32 yarıçap) ve kenarlara yaslanan 3–5 farklı boyda daire
  (min(w,h)×0,17–0,32); kıyı payı su için 9 px, lav için 7 px. Sonuç: girintili çıkıntılı, yuvarlak hatlı göl.
- **Yama** (objeler): dikdörtgeni büyük ölçüde dolduran yuvarlak köşeli çekirdek ve kenarda taşan 5–7 daire; kenar
  payı 7 px. Süsler biçimin içinde, kenardan en az 10–16 px içeride rastgele ama birbirine çarpmayan yerlere konur.
- **Kale** (kale, harabe, buz kalesi): yuvarlak köşeli gövde (üstten 13 px boşluk), üst köşelerde yuvarlak kuleler,
  geniş blokta orta kule, kuleler arasında yuvarlak başlı mazgallar. Ön yüz derinliği `d = h×0,2` (12–24 px).
- **Kütük**: gövde ve üst kenarda boyları değişen yuvarlak kütük başları; `d = h×0,24` (14–28 px).
- **Kaya** (bazalt, göktaşı): üst üste binen 4–7 yumru (daire ve elips), ön yüz derinliği küçük (8–14 px).
- **İstasyon**: yuvarlak köşeli gövde ve köşelerde yuvarlak modüller; ön yüz derinliği 12–20 px.
- **Plaka** (diken): elips ve iki yanında taşan 3 daire.
- **Sınır şeridi**: haritanın dört kenarındaki 30 px şerit; haritaya bakan kenarda 20 px arayla yuvarlak mazgal başları.

Kesişen göller iki geçişte çizilir: önce bütün kıyılar, sonra bütün sular; böylece tek göl gibi birleşir. Suyun
renk geçişi dünya koordinatında hesaplanır (birleşen göllerde dikiş olmaz).

## 6. Kod yapısı

- **Yeni dosya `www/engeller.js`** (`arkadaslar.js` gibi `game.js`'ten önce yüklenir): yardımcılar (tohumlu
  rastgele, renk karıştırma, parça yolu, işaretli uzaklık, dış hat noktaları), biçim aileleri, tema setlerinin
  ressamları, ortak ressamlar (diken, lav, sınır), önbellek ve canlı katman. `game.js`'in yardımcılarını (`game`,
  `getTheme`, `LEVEL_THEMES`) yalnız çağrı anında kullanır.
- **Dışa açılan işlevler:**
  - `engelBicimleriniKur()`: `buildWalls`, `buildWaters` ve `buildHazards`'ın **sonunda** çağrılır; `game.walls`,
    `game.waters`, `game.spikes`, `game.lavas` içinde biçimi olmayan her engele `bicim` (dünya koordinatında
    parçalar), `carpisma` (çarpışma parçaları), `tur`, `tohum` ekler ve çizim sırasını kurar. Engeller her bölümde
    yeniden üretildiği için eski önbellek kendiliğinden düşer.
  - `engelCarpisir(liste, x, y, r)`: dikdörtgenle hızlı ön eleme, sonra biçimin işaretli uzaklığı `< r`. Biçimi
    henüz kurulmamış engelde dikdörtgene düşer.
  - `engelleriCiz(ctx)`: `render`'daki dört döngünün yerine; görüş alanı dışındakileri atlar.
- **`game.js` değişiklikleri:**
  - `collidesWalls`, `collidesWaters`, `collidesSpikes`, `collidesLavas` gövdeleri `engelCarpisir`'i çağırır.
  - `buildWalls`, `buildWaters`, `buildHazards`'ın son satırına `engelBicimleriniKur()`; yerleşim ve çakışma
    denetimleri bu işlevlerde dikdörtgenle kalır.
  - `render`: dört döngü yerine `engelleriCiz(ctx)`. `drawWall`, `drawWater`, `drawSpike` kaldırılır; `drawLava`'nın
    canlı lav çizimi `engeller.js`'e taşınır (aynı görünüş, biçimle kırpılmış).
- **Önbellek:** her engel kendi boyutunda ayrı bir tuvale ilk görüldüğünde bir kez çizilir ve engelin üstünde tutulur;
  ölçek `min(devicePixelRatio × viewScale, 2)`. Ölçek değişince (döndürme, pencere boyutu) bütün önbellek silinir.
  Bir bölümde en çok ~11 MB.
- **Çizim sırası:** sular (iki geçiş + dalgalar) → diken → lav (önbellek + canlı lav + alevler) → duvar ve objeler
  (alt kenarına göre sıralı) → canlı süsler.
- **Canlı katman (her kare, yalnız görünen engellerde):** dalga, lav, alev dilleri, mum alevi, kovukta göz kırpma,
  ateş böceği, buhar kabarcığı, alev ruhu titremesi, istasyon ışıkları, yıldız parıltısı. Her ressam süs noktalarını
  (`canli: [{tur, x, y}]`) önbellekle birlikte bırakır; canlı katman bu noktalara küçük şekiller çizer.

## 7. Performans

- Her karede görünen engel başına bir `drawImage`; sular için ikinci geçişte kırpılmış bir `drawImage` daha.
- Önbellek tuvalleri ilk görüldükleri karede çizilir (bölüm başında takılma olmasın); bir engelin hazırlanması birkaç
  milisaniyedir. *Son incelemeden:* görünmeyenler de bölüm başından itibaren her karede, kameraya en yakından başlayarak
  hazırlanır (en az bir engel, sonra karenin engel işi 6 ms'yi bulana kadar): ilk çizim 4× yavaş işlemcide oyun
  ortasında 67–233 ms sıçrama yapıyordu.
- Çarpışmada dikdörtgen ön elemesi: biçime yalnız dikdörtgenine yakın noktalar bakar.
- Ölçüt: `cizim.test` (botlu, hayaletli kare hızı) ve 6 kişilik `alti.test` bugünkü eşikleri geçer.

## 8. Hata ve uç durumlar

- Çok küçük blok (80×80): biçim aileleri küçük boyutta da dikdörtgenin içinde kalacak biçimde ölçeklenir; süs sayısı
  alana göre azalır (en az 1–2).
- Kesişen bloklar: §3.6 (duvar) ve alt kenara göre çizim sırası; kesişen göller birleşir.
- Önbellek tuvali oluşturulamazsa (bellek): o engel o karede doğrudan çizilir.
- Bilinmeyen tema dizini olmaz (`% 6`); biçimi kurulmamış engel çarpışmada dikdörtgene düşer.

## 9. Testler

- **Mevcut `test/engel.test.mjs`** (hayalet engelin içinde doğmaz, harita çevrimiçi aynı, gömülü hayalet çıkar, uzun
  oyunda bölüm geçilir) değişmeden geçer.
- **Yeni `test/engel-bicim.test.mjs`:**
  - *Kapsama:* 6 tema × (duvar, 1. obje, 2. obje, su, sınır) + diken + lav × farklı boyutlar (80×80, 180×90, 90×180,
    180×180, 470×30, 30×470): önbellek resminde çarpışma alanının içi (işaretli uzaklık < −2) boyalı; biçimin, kıyı
    ya da kenar payıyla birlikte dışı (> pay + 3) saydam. Görünmeyen köşe ya da boşa taşan boya yok.
  - *Dikdörtgende:* bütün parçalar ve kıyılar dikdörtgenin içinde.
  - *Çarpışma:* biçimin içindeki noktada `collides…` doğru; biçimin dışındaki köşede yanlış (yama ve göl ailesinde
    dört köşeden en az biri serbest).
  - *Aynılık:* iki ayrı sayfada aynı bölümün biçimleri ve önbellek resimlerinin özeti aynı.
  - *Kılık:* kesişen bloklar duvar; en az 6 iç bloklu bir bölümde üç kılık da görülür.
- **`cizim.test.mjs`, `cevrimici.test.mjs` (13/13), `alti.test.mjs`, `dil.test.mjs`** geçer.
- **Ekran denetimi:** 6 temanın katalog ve oyun içi görüntüsü (TR 390 px, AR 340 px) gözle denetlenir.

## 10. Yayın

- Arkadaş özelliğiyle birlikte **3.13.0 (45)**. Sıra: arkadaş planının Görev 6–7 → bu tasarımın planı → arkadaş
  planının Görev 8 (sürüm, notlar, belgeler, gizlilik, derleme) → Play'e gönderme kullanıcının açık onayıyla.
- `UPDATE_NOTES["3.13.0"]`'a satır: "🏰 Engeller yenilendi: kaleler, eğri kıyılı göller ve her temaya özel ürkünç ama
  sevimli objeler." ve 5 dile çevirisi; mağaza sürüm notu (≤ 500 karakter).
- README'de "3.13.0: engeller" bölümü.

## 11. Kapsam dışı

- Engel sayısı, yeri ve boyutu (harita üretimi), zemin ve ızgara görünümü, karakter çizimleri.
- Yeni oynanış (engel kırma, gizli geçit vb.) ve engelin üstünden yükselen gölge/ışık efektleri.
