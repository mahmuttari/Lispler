# Hayalet Avcıları — Dünya Turu: 51 ülkelik kip (tasarım)

- **Tarih:** 24 Ekim 2026
- **Durum:** Bölüm 1–6 sohbette onaylandı (24 Ekim 2026); yazılı belgenin onayı bekleniyor
- **Hedef sürüm:** 3.14.0 (versionCode 47); 3.13.1'in reklam içerik sınırı (G) bu sürümle birlikte çıkar
- **Proje:** `hayalet-avcilari/` (Capacitor 8, HTML5 canvas, Firebase Realtime Database + Anonymous Auth)

## 1. Amaç

Kullanıcının isteği: *"ülkeler serisi oyunu planlayalım, bu bir mod olsun hem online hem bireysel, her ülkenin kendi
kültürüne mimarisine uygun görsellerle bezenmiş bölümler olsun, ülkeden ülkeye geçerek gidelim dünyanın en kalabalık
nüfuslu ilk 50 ülkeye göre yap"*. Sonradan eklenenler: *"boslar ülkenin geleneksel kıyafetleri ile bezensin"*,
*"israil olmasın ülkeler arasında"*, *"Filistin olsun"*.

**Başarı ölçütleri**

1. Ana menüden "🌍 Dünya Turu" açılır; 51 ülke rota sırasıyla oynanır. Her ülke bir bölümdür ve sonunda o ülkenin
   geleneksel kıyafetini giymiş bir boss gelir.
2. Her ülke, kendi ailesinin duvarı, su kıyısı ve zemin deseniyle, kendine özgü iki objesiyle tanınır. §4.3 tablosundaki
   her obje ve her kıyafet çizilmiştir.
3. İlerleme kaybolmaz: ulaşılan ülke açık kalır, damgalar kayıtta ve bulut yedeğinde durur.
4. Çevrimiçi odada herkes aynı ülkeyi aynı resimle görür. Ülke geçilince odadaki herkes damga alır. 3.13.x sürümleri
   aynı odada oynayabilir.
5. Kare hızı düşmez: `cizim.test` ve 6 kişilik `alti.test` bugünkü eşikleri Dünya Turu'nda da geçer.
6. İçerik kuralları (§4.6) 51 ülkenin hepsinde tutar.

## 2. Kullanıcının kararları

| Konu | Karar |
|---|---|
| Amaç | **Macera + kısa tanıtım**: ülkeye girişte adı ve çizilen simgeler tek satırla tanıtılır; ülke bitince pasaporta damga basılır |
| Ülke listesi | BM World Population Prospects 2024'e göre **en kalabalık 50 ülke** (2025 ve 2026 tahminlerinde aynı 50 ülke) + kullanıcının isteğiyle **Filistin** = 51 ülke. İsrail listede yoktur: ilk 50'nin dışındadır ve kullanıcı eklenmesini istemedi |
| Sıra | **Dünya turu rotası**: Türkiye'den başlar, kıta kıta komşudan komşuya gider (§4.2). Zorluk rotadaki sıra numarasıyla artar |
| Yapı | **Her ülke bir bölüm**; bölümün sonunda ülkenin bossu |
| Yenilgi | **Kaldığı ülkeden devam** (önerilen seçenek; kullanıcı soruyu yanıtlamadı, Bölüm 1'i onaylayarak kabul etti) |
| Boss | **Ülkenin geleneksel kıyafetiyle** (kullanıcının fikri) |
| Çevrimiçi | **Kurucu seçer, birlikte gezilir**: kip ve başlangıç ülkesi oda kurulurken seçilir; damga ve açılan ülke odadaki herkese yazılır |
| Görsel yaklaşım | **Bölge ailesi + ülke imzası**: 10 aile duvarı, su kıyısını ve zemini verir; her ülkenin kendi paleti ve iki objesi olur |
| Bölüm 1–6 | Önerilen seçeneklerle onaylandı: yeni damgada +3 💎; Dünya Turu Şampiyonlar listesine ve Play Games'e girmez; boss gövdesi soluk renk; eski sürüm aynı odaya girebilir; ilk adım Türkiye + Japonya taslağı ve kullanıcı onayı |
| Yayın | 3.13.1 ayrı gönderilmez; Dünya Turu ile **3.14.0** olarak çıkar (*"Hayır, modla birlikte gönder"*) |

## 3. Oyun akışı ve ilerleme

- **Giriş:** Ana menüde "🌍 Dünya Turu" düğmesi. Açılan ekranda 51 ülkelik rota, kıta başlıklarıyla liste hâlinde
  durur; sınır çizilmiş harita yoktur. Her kartta sıra numarası, ülke adı, ülkenin 1. objesinden küçük resim ve durum
  vardır: 🔒 kilitli, ✈️ açık, 🛂 damgalı. Üstte pasaport sayacı ("🛂 12/51"). Oyuncu açık ülkelerden birini seçer
  (varsayılan: en ilerideki açık ülke); karakter seçimi bugünkü gibidir.
- **Bölüm:** Dünya Turu'nda `game.level` ülkenin rota sırasıdır (1–51). Harita düzeni, hayalet sayısı ve hızı, boss
  süresi ve boss gücü bugünkü bölüm üreticisinden ve formüllerinden gelir: 7. ülke normal oyundaki 7. bölüm kadar zordur.
  Görseller o ülkenin setidir (§5). Girişte tanıtım satırı, boss gelince boss duyurusu çıkar (§4.4). Bot yardımcı normal
  oyundaki gibi gelir.
- **Ülke bitince** (boss ve hayaletler bitti): "🛂 {ülke} damgası!" ve damga canlandırması, sonra 1,5 sn'lik uçak
  geçişi (iki ülke adı arasında kesikli çizgide ✈️), ardından sıradaki ülke başlar. İlk kez basılan damga +3 💎 verir.
- **51. ülke bitince:** "🌍 Dünya turu tamamlandı!" Tek kişilik oyunda oyun sonu ekranı bu başlıkla gelir, kazançlar
  kasaya girer. Çevrimiçi oyunda §6'daki tur sonu akışı işler.
- **Yenilgi:** Tur biter, bugünkü oyun sonu ekranı gelir, kazançlar kasaya girer. Ulaşılan ülke açık kalır; Dünya Turu
  ekranından kaldığı yerden devam edilir.
- **Kazanç:** Para, elmas ve zümrüt normal oyundaki gibi kazanılır; tamamlanma ödülü (`completionBonus`) aynı formülle
  hesaplanır. Dünya Turu skorları Şampiyonlar listesine (yerel ve genel) ve Play Games skoruna yazılmaz,
  `save.highestLevel` değişmez: ortadaki bir ülkeden başlayan oyuncu, 1. bölümden başlayanlarla adil yarışamaz.
- **Kayıt** (`loadSave` eksik alanı tamamlar; bulut yedeği bütün kaydı taşıdığı için kendiliğinden yedeklenir):

  ```js
  save.dunyaTuru = {
    acik: 1,        // en ileri açık ülkenin rota sırası (1–51)
    damgalar: {},   // { "TR": <ilk damganın zamanı ms>, … }: ISO 3166-1 alfa-2 koduyla, rota değişse de kaybolmaz
    bitti: 0,       // dünya turunun ilk tamamlandığı zaman (ms); 0 = tamamlanmadı
  };
  ```

## 4. Rota ve içerik

### 4.1 Liste ve kaynak

BM WPP 2024 (orta varyant) en kalabalık 50 ülke, 2025 ve 2026 tahminlerinde aynı kümedir. 50. sırada Fildişi Sahili
(~33,5 milyon, 2026), 51. sırada Kamerun (~30,6 milyon) vardır. Kaynak:
[Statistics Times — countries by population (UN WPP 2024)](https://statisticstimes.com/demographics/countries-by-population.php).
Bu 50 ülkeye kullanıcının isteğiyle Filistin eklenir.

### 4.2 Rota (51 ülke)

- **Avrupa:** 1 Türkiye → 2 Ukrayna → 3 Polonya → 4 Almanya → 5 Birleşik Krallık → 6 Fransa → 7 İtalya → 8 İspanya
- **Afrika:** (Cebelitarık) 9 Fas → 10 Cezayir → 11 Fildişi Sahili → 12 Gana → 13 Nijerya → 14 Kongo DC → 15 Angola →
  16 Güney Afrika → 17 Mozambik → 18 Madagaskar → 19 Tanzanya → 20 Uganda → 21 Kenya → 22 Etiyopya → 23 Sudan → 24 Mısır
- **Asya:** 25 Yemen → 26 Suudi Arabistan → 27 Filistin → 28 Irak → 29 İran → 30 Özbekistan → 31 Afganistan →
  32 Pakistan → 33 Hindistan → 34 Bangladeş → 35 Myanmar → 36 Tayland → 37 Malezya → 38 Endonezya → 39 Filipinler →
  40 Vietnam → 41 Çin → 42 Güney Kore → 43 Japonya → 44 Rusya (Sahalin üzerinden)
- **Amerika:** (Bering Boğazı) 45 Kanada → 46 ABD → 47 Meksika → 48 Kolombiya → 49 Peru → 50 Brezilya → 51 Arjantin

### 4.3 Ülke tablosu

Aile kısaltmaları §5.2'dedir. Ülke kodu ISO 3166-1 alfa-2'dir (Filistin `PS`).

| # | Kod | Ülke | Aile | 1. obje | 2. obje | Boss kıyafeti |
|---|---|---|---|---|---|---|
| 1 | TR | Türkiye | KS | Peri bacaları ve balonlar | Lale bahçesi | Efe: yemeni sarılı başlık, cepken, kuşak, diz boyu şalvar |
| 2 | UA | Ukrayna | K | Ayçiçeği tarlası | Saman çatılı beyaz ev, hasır çit | Vışıvanka (işlemeli gömlek), kurdeleli çiçek tacı |
| 3 | PL | Polonya | K | Wawel ejderi | Leylek yuvaları | Krakowiak: tavus tüylü kırmızı şapka, püsküllü yelek |
| 4 | DE | Almanya | K | Guguklu saat evi | Yarım ahşap evler | Askılı deri pantolon, tüylü Tirol şapkası |
| 5 | GB | Birleşik Krallık | K | Kırmızı telefon kulübeleri | Saat kulesi (Big Ben) | İskoç kilti, ekose, tam o' shanter bere |
| 6 | FR | Fransa | K | Eyfel Kulesi | Lavanta tarlası | Bere, çizgili Breton tişörtü, kırmızı fular |
| 7 | IT | İtalya | K | Kolezyum | Gondollu kanal iskelesi | Venedik karnavalı: maske, üç köşeli şapka, pelerin |
| 8 | ES | İspanya | K | La Mancha yel değirmenleri | Elhamra'nın Aslanlı Çeşmesi | Puantiyeli flamenko elbisesi, yelpaze |
| 9 | MA | Fas | KP | Şefşavan'ın mavi sokakları | Fenerli çarşı tezgâhı | Kapüşonlu cellabe, sarı babuş |
| 10 | DZ | Cezayir | KP | Sahra kumulları | Tassili n'Ajjer kaya kemerleri | Karakou: altın işlemeli kadife ceket |
| 11 | CI | Fildişi Sahili | SH | Kakao bahçesi | Fil ailesi | Renkli pagne (vaks baskı), baş bağı |
| 12 | GH | Gana | SH | Kente dokuma tezgâhı | Kakum kanopi köprüsü | Omuzdan sarılı kente kumaşı |
| 13 | NG | Nijerya | SH | Zuma Kayası | Konuşan davullar | Agbada (geniş kaftan), fila şapka |
| 14 | CD | Kongo DC | SV | Okapi ormanı | Kongo Nehri pirogları | Kuba rafya kumaşı: geometrik etek ve başlık |
| 15 | AO | Angola | SV | Kalandula Şelalesi | Welwitschia bitkisi | Bessangana elbisesi, baş bağı |
| 16 | ZA | Güney Afrika | SV | Masa Dağı | Afrika penguenleri | Zulu boncuk işi yaka, isicholo şapka |
| 17 | MZ | Mozambik | SV | Dau yelkenlileri | Kaju ağaçları | Capulana (sarılı kumaş), baş bağı |
| 18 | MG | Madagaskar | SV | Baobab Caddesi | Lemurlar | Lamba (beyaz şal), hasır satroka şapka |
| 19 | TZ | Tanzanya | SV | Kilimanjaro | Zanzibar oyma kapıları | Kanga kumaşı, baş bağı |
| 20 | UG | Uganda | SV | Dağ gorilleri | Murchison Şelalesi | Gomesi: kabarık omuzlu elbise, kuşak |
| 21 | KE | Kenya | SV | Zürafalar ve akasya | Flamingolu göl | Maasai şukası (kırmızı damalı), boncuklu yaka |
| 22 | ET | Etiyopya | SV | Aksum dikili taşları | Gelada maymunları | Habesha kemis (işlemeli kenarlı), netela şal |
| 23 | SD | Sudan | KP | Meroe piramitleri | Deve pazarı | Beyaz cellabiye, imma, markub terlik |
| 24 | EG | Mısır | KP | Gize piramitleri ve Sfenks | Nil'de feluka yelkenlileri | Firavun nemes başlığı, boncuklu yaka |
| 25 | YE | Yemen | KP | Sokotra ejder kanı ağaçları | Sana'a kule evleri | Desenli ma'vez, koyu ceket, meşedde şal |
| 26 | SA | Suudi Arabistan | KP | Hurma bahçesi | AlUla Fil Kayası | Beyaz thobe, kırmızı damalı şimag, agal |
| 27 | PS | Filistin | KS | Zeytin bahçesi | Hayat Ağacı mozaiği (Hişam Sarayı; yalnız ağaç ve otlayan ceylanlar) | Tatreez nakışlı thobe |
| 28 | IQ | Irak | KS | Kamış mudhif evleri (Ahvar) | Şenaşil ahşap balkonlar | Dişdaşa, yaşmak, altın kenarlı bişt |
| 29 | IR | İran | KS | Siose Pol köprüsü | Yezd rüzgâr kuleleri | Kaşkay keçe şapkası, uzun çuha |
| 30 | UZ | Özbekistan | KS | İpek Yolu kervanı | Kavun pazarı | Çizgili çapan, nakışlı do'ppi |
| 31 | AF | Afganistan | KS | Uçurtmalı tepe | Nar bahçesi | Aynalı, renkli nakışlı Kuçi elbisesi |
| 32 | PK | Pakistan | GA | Süslü kamyonlar | Hunza kayısı bahçesi | Şalvar kamiz, ajrak şal, aynalı Sindhi şapkası |
| 33 | IN | Hindistan | GA | Hawa Mahal (Rüzgâr Sarayı) | Lotus göleti ve tavus kuşları | Renkli ipek sari |
| 34 | BD | Bangladeş | GA | Süslü rikşalar | Sundarbans ve Bengal kaplanı | Panjabi gömleği, lungi, gamça şal |
| 35 | MM | Myanmar | GDA | Inle Gölü balıkçıları | Pathein şemsiyeleri | Longyi, gaung baung başlık |
| 36 | TH | Tayland | GDA | Yüzen pazar | Tuk-tuk | Chut Thai: ipek etek, sabai şal |
| 37 | MY | Malezya | GDA | Petronas İkiz Kuleleri | Rafflesia çiçeği | Baju Melayu, samping, tanjak |
| 38 | ID | Endonezya | GDA | Komodo ejderleri | Pirinç terasları | Batik gömlek, blangkon |
| 39 | PH | Filipinler | GDA | Çikolata Tepeleri | Jeepney | Barong Tagalog, salakot şapka |
| 40 | VN | Vietnam | GDA | Ha Long Körfezi | Hoi An fenerleri | Áo dài, nón lá |
| 41 | CN | Çin | DA | Pandalar ve bambu | Ejder dansı | Kırmızı ipek Tang ceketi, fener |
| 42 | KR | Güney Kore | DA | Hanok evleri | Kimçi küpleri (onggi) | Hanbok, gat şapka |
| 43 | JP | Japonya | DA | Kiraz ağaçları | Fuji Dağı | Kimono, uchiwa yelpaze, geta |
| 44 | RU | Rusya | K | Matruşka bebekleri | Oymalı ahşap izba | Kokoşnik, sarafan |
| 45 | CA | Kanada | KA | Akçaağaç ormanı ve şurup | Kunduz barajı | Ekose oduncu gömleği, kürk şapka, oklu kuşak |
| 46 | US | ABD | KA | Özgürlük Heykeli | Büyük Kanyon | Kovboy şapkası, yelek, bandana, çizme |
| 47 | MX | Meksika | LA | Papel picado süslü pazar | Ajolote göleti (Xochimilco) | Charro: geniş sombrero, işlemeli ceket |
| 48 | CO | Kolombiya | LA | Kokora mum palmiyeleri | Cartagena'nın balkonlu evleri | Sombrero vueltiao, ruana |
| 49 | PE | Peru | LA | Machu Picchu terasları | Lamalar | Chullo şapka, renkli panço |
| 50 | BR | Brezilya | LA | Amazon tukanları ve araları | Şeker Somunu Dağı | Frevo giysisi, küçük renkli şemsiye |
| 51 | AR | Arjantin | LA | Perito Moreno Buzulu | Caminito'nun renkli evleri | Gaucho: boina, panço, bombacha, mate |

Kaynakla doğrulanan kıyafetler: Angola'nın bessangana'sı ([ANGOP](https://angop.ao/en/noticias/lazer-cultura/angola-mostra-gastronomia-e-cultura-na-nicaragua/));
Yemen erkek kıyafeti ([yemen.jp](https://yemen.jp/traditions),
[Apogee](https://www.apogeephoto.com/yemeni-dress-photographing-the-culture-and-customs/)); Sudan ulusal kıyafeti
([Markoob](https://en.wikipedia.org/wiki/Markoob), [Clothing in Sudan](https://en.wikipedia.org/wiki/Clothing_in_Sudan));
Kaşkay keçe şapkası ([Iranica](https://www.iranicaonline.org/?p=9832), [Kolah namadi](https://en.wikipedia.org/wiki/Kolah_namadi);
"iki kanatlı" biçim doğrulanamadı, yalnız keçe şapka çizilir).

### 4.4 Tanıtım, boss duyurusu, damga

- **Tanıtım satırı** iki objenin adından kurulur: "✈️ {sıra}. {ülke} — {1. obje} ve {2. obje}" (örnek: "✈️ 6. Fransa —
  Eyfel Kulesi ve lavanta tarlası"). Bölüm başında, bugünkü "📚 Bölüm {n} — {tema}" bildiriminin yerine çıkar.
- **Boss duyurusu:** "👻 {boss adı} geldi!"; boss adı kıyafetin kısa adıdır ("Bereli hayalet", "Kimonolu hayalet",
  "Efe hayalet"…), ülke verisinde durur. Boss doğduğunda bildirim olarak çıkar.
- **Damga:** mürekkep görünümlü oval; içinde ülke adı ve 1. objenin küçük resmi.

### 4.5 Ülke adları

Altı dilde standart kısa adlar kullanılır. Türkçe adlar resmî kısa yazımla yazılır: Türkiye, Birleşik Krallık, ABD,
Güney Kore, Kongo DC, Fildişi Sahili, Filistin. Ülke, obje ve boss adları sözlüğe girer (`araclar/sozluk.mjs`).

### 4.6 İçerik kuralları

Bütün ülkelerde geçerlidir; ressam ve veri incelemesinde, ekran denetiminde aranır:

1. **Dinî yapı, sembol ve giysi yok.** Bu yüzden Japonya'da torii, Brezilya'da Kurtarıcı İsa, İtalya'da Pisa Kulesi
   (katedralin çan kulesi), Hindistan'da Tac Mahal (türbe ve camii olan yapı) seçilmedi; yerlerine saray, köprü, doğa ve
   el sanatı geldi. Antik anıtlar (piramitler, dikili taşlar, Machu Picchu terasları) kültür mirası olarak çizilir.
2. **Bayrak yok** (bazı bayraklarda dinî ibare var); **sınırları gösteren harita yok** (bazı sınırlar tartışmalı).
3. **Silah yok:** Yemen hançeri (cambiya), gaucho bıçağı ve benzerleri çizilmez.
4. **İnsan çizilmez.** Objelerde gerekiyorsa kıyafetli sevimli hayalet ya da hayvan konur (Inle'de hayalet balıkçı,
   yüzen pazarda hayalet satıcı). Boss da hayalettir: yüz ya da ten rengi değil, yalnız kıyafet çizilir.
5. **Savaş, siyaset, kan yok.** Filistin'de zeytinlik, işleme ve mozaik gibi kültürel öğeler kullanılır.
6. Hayvanlar ve objeler sevimli çizgi film üslubundadır (3.13.0 §3.8 ile aynı: gülen ya da uykulu yüzler; kafatası,
   iskelet yok). Hayat Ağacı mozaiğinde yalnız ağaç ve otlayan ceylanlar çizilir.

## 5. Görsel takım

### 5.1 Üslup

3.13.0 engellerinin onaylı üslubu sürer: sevimli çizgi film, kalın kenar, yumuşak gölge, eğri hatlar. Her şey kodla
çizilir, bölüm başında önbelleğe alınır. Tohumlu rastgelelik kullanılır (`Math.random` yok), böylece çevrimiçi oyunda
herkes aynı resmi görür.

### 5.2 Aileler

| Aile | Ülkeler | Duvar ve sınır | Su kıyısı | Zemin deseni |
|---|---|---|---|---|
| **K** Avrupa taş/tuğla kale | UA, PL, DE, GB, FR, IT, ES, RU | Kale biçim ailesi: taş ya da tuğla gövde, kuleler; mazgal kare ya da kırlangıç kuyruğu (RU, IT) | Taş rıhtım | Arnavut kaldırımı |
| **KS** kervansaray | TR, PS, IQ, IR, UZ, AF | Kale ailesi: kesme taş ya da tuğla, çini kuşak (PS'de kırmızı işleme kuşağı), sivri kemerli nişler | Çinili havuz kenarı | Geometrik çini |
| **KP** kerpiç kasaba | MA, DZ, SD, EG, YE, SA | Kale ailesi: kerpiç gövde, basamaklı mazgal, beyaz badana süsü, çıkıntılı ahşap kirişler | Hurmalı vaha kıyısı | Kum dalgası |
| **SH** Sahel | CI, GH, NG | Kerpiç duvar, saman çatılı yuvarlak ambar kuleleri | Kırmızı topraklı, sazlıklı nehir kıyısı | Kırmızı toprak, ot tutamları |
| **SV** savan | CD, AO, ZA, MZ, MG, TZ, UG, KE, ET | Kütük ailesi: kazık çit, aralarda kuru taş öbekleri | Sazlıklı su birikintisi | Çatlak toprak, kuru ot |
| **GA** Güney Asya | PK, IN, BD | Kale ailesi: kırmızı kumtaşı (BD tuğla), köşelerde küçük kubbeli köşk kuleleri | Basamaklı havuz kenarı | Kumtaşı döşeme |
| **GDA** Güneydoğu Asya | MM, TH, MY, ID, PH, VN | Kütük ailesi: bambu çit, ahşap direkler | Lotus ve bambu kıyısı | Hasır örgü |
| **DA** Doğu Asya | CN, KR, JP | Kale ailesi: gri taş ya da tuğla gövde, kıvrık kiremit saçaklı kule ve üst | Taş kenarlı koi göleti | Taş döşeme, yosun |
| **KA** Kuzey Amerika | CA, US | Kütük ailesi: sivri kütük palisat | Kütük iskeleli göl kıyısı | Çimen ve çam iğneleri |
| **LA** Latin Amerika | MX, CO, PE, BR, AR | Kale ailesi: renkli sıva (PE'de İnka çokgen taşı) | Renkli karo kenarlı kanal | Pişmiş toprak karo |

- Duvar ressamları 3.13.0'ın biçim ailelerini (kale, kütük, kaya) ve yardımcılarını kullanır; biçim, çarpışma, önbellek
  ve kılık seçimi değişmez.
- **Su her ülkede aynı mavi kalır** (3.13.0 §3.9); aileye göre değişen yalnız kıyısı ve süsüdür. Diken ve lav ortaktır.
- **Zemin deseni yenidir:** Dünya Turu'nda ızgaranın yerine ailenin deseni soluk olarak çizilir. Desen bir kez küçük bir
  tuvale çizilip `CanvasPattern` olarak döşenir (her karede tek dolgu). Normal oyunun zemini değişmez.

### 5.3 Ülke objeleri

- 102 ressam (51 × 2, §4.3). Bugünkü kılık kuralıyla iç blokların bir kısmı obje olarak çizilir (3.13.0 §3.6); engel
  sayısı, yeri, boyutu ve çarpışma değişmez. Objeler "yama" biçim ailesindedir; süsler biçimin içinde kalır.
- Uzun yapılar (Eyfel, saat kulesi, Petronas, Özgürlük Heykeli) bloğun içine sığan maket olarak çizilir; hiçbir sabit
  çizim dikdörtgenin üst kenarından taşmaz (3.13.0 §3.7).
- **Canlı süsler** her karede küçük hareketlerdir: Kapadokya balonları, uçurtmalar, fenerler, şelale, flamingo, yel
  değirmeni pervanesi, ejder dansı, akçaağaç yaprağı, yanıp sönen fener ışıkları. Ressam süs noktalarını bırakır, canlı
  katman çizer (3.13.0 düzeni).

### 5.4 Palet

Her ülkenin paleti: zemin, desen çizgisi, duvar, duvar koyusu ve 2–3 vurgu rengi. Renkler ülkenin doğasından ve
mimarisinden alınır (Fas'ta mavi ve toprak, Japonya'da yosun yeşili ve kiraz pembesi gibi); bayrak renkleri esas
alınmaz. Kesin değerler taslakta ve ekran denetiminde oturur. Aile paleti ile ülke paleti birleşir (ülke üstün gelir).

### 5.5 Boss kostüm takımı

- **Gövde:** Dünya Turu bossunun gövdesi soluk lila-beyazdır. Kırmızı ışık, sarı gözler, ağız ve can çubuğu kalır; boss
  olduğu anlaşılır. Taç çizilmez, yerine ülkenin başlığı gelir.
- **Kostüm kaydı** (`ulkeler.js`):

  ```js
  kostum: {
    baslik: "efe",              // ~35 tür, 7 parametreli kalıp: geniş kenarlı, konik, yumuşak (bere, boina, chullo),
                                // silindirik/kep (fila, do'ppi, kep), sarılı (yemeni, imma, meşedde, baş bağı),
                                // taç (çiçek tacı, kokoşnik), özel (nemes, şimag ve agal, üç köşeli, Tirol, kürk…); "yok"
    giysi: "ceket",             // entari | ceket | sarili | panco | kimono | elbise | askili
    desen: "nakis",             // duz | cizgili | ekose | puantiye | geometrik | nakis | batik | boncuk
    renk: ["#…", "#…", "#…"],   // ana, ikinci, süs
    aksesuar: ["kusak"],        // yelpaze | fener | semsiye | mate | maske | boncukluYaka | kusak | sal | pelerin |
                                // fular | bandana
    ayakkabi: "babus",          // isteğe bağlı: dalgalı eteğin altından küçük olarak görünür (babuş, geta, markub, çizme)
  }
  ```

- Giysi gövdenin alt yarısını hayaletin dalgalı silüetine uyarak kaplar. Başlık başın üstüne, aksesuar yana çizilir.
  Kostüm ölçekle (`s`) birlikte büyür; çevrimiçide istemci kostümü ülke sırasından bulur, ağdan bir şey gelmez.
- Kostüm kaydı eksikse ya da bozuksa boss bugünkü kırmızı gövde ve taçla çizilir.

### 5.6 Ekranlar

- **Dünya Turu ekranı:** §3'teki liste; kıta başlıkları, kartlar, pasaport sayacı, "▶ Başla" (seçili ülke).
- **Pasaport:** damgalı ülkeler ızgarası. Damgasız ülke soluk çerçeve olarak görünür.
- **Uçak geçişi:** 1,5 sn; iki ülke adı ve aralarında kesikli çizgide ✈️. Harita yok.
- Yeni ekranlar 390 ve 340 px'te taşmaz, Arapçada sağdan sola akar (bugünkü düzen).

## 6. Çevrimiçi

- **Oda Kur:** kip seçimi "🎮 Normal" / "🌍 Dünya Turu". Dünya Turu'nda başlangıç ülkesi kurucunun açık ülkelerinden
  seçilir (varsayılan: en ilerideki).
- **Oda kaydı:**
  - Yeni alan `tur: true`.
  - Başlangıç ülkesi bugünkü `level` alanındadır (1–51).
  - Oyundaki ülke bugünkü `state.lvl` ile eşitlenir; ağ trafiği artmaz.
- **Kural:** odaya tek satır: `"tur": { ".validate": "newData.isBoolean()" }`; öteki alanlar ve sınırlar aynı kalır.
- **Oyun:**
  - Odaya giren her istemci `tur` alanını görünce Dünya Turu kipini açar: tema, aile, objeler, zemin, kostümlü boss,
    tanıtım satırı.
  - Ülke kurucunun boss ve hayaletleri bitirmesiyle geçilir. Her istemci `state.lvl` k'dan k+1'e geçtiğinde k. ülkenin
    damgasını kendi kaydına yazar (ilk damgaysa +3 💎 da kendi kaydına) ve `acik = max(acik, k+1)` yapar. Bu, o anda
    hayalet olmuş oyuncuları da kapsar.
  - `acik` "bu sıraya kadar her ülke açık" demektir. İlerideki bir arkadaşının odasına katılıp ülke geçen oyuncuda
    aradaki ülkeler de açılır, ama damgasız kalır; damga yalnız geçilen ülkeye basılır.
- **Bitiş:**
  - 51. ülke bitince kurucu `state.lvl = 52` yazar. İstemciler 51. damgayı alır ve "🌍 Dünya turu tamamlandı!" görür.
  - Ardından bugünkü tur sonu akışı işler: kazanç, sıralama ve kupa, lobi.
  - Herkes hayalet olursa da bugünkü gibi tur biter.
- **Oda listesi ve davet:** Dünya Turu odası 🌍 işareti ve o anki ülkenin adıyla görünür. Arkadaş daveti aynı çalışır.
- **Eski sürümler (3.13.x):**
  - `tur` alanını tanımaz, odaya normal oda gibi girer. Harita düzeni aynıdır (aynı bölüm üreticisi); oyun birlikte
    akar. Eski sürümdeki oyuncu bugünkü 6 temayı görür ve damga almaz.
  - Kurucu çıkınca en eski oyuncu kurucu olur. Bu oyuncu eski sürümdeyse oyun sürer, yeni sürümdekiler ülkeleri görmeye
    devam eder.
- **Yayın sırası:**
  - Kurallar 3.14.0 Play'e çıkmadan, kullanıcının onayıyla GitHub'dan yayınlanır (`firebase/yayin-istek.txt` › `yayinla`).
  - Kurallar yayınlanmadan Dünya Turu odası kurulmaya çalışılırsa "⚠ Dünya Turu odası şu an kurulamıyor" yazar. Normal
    odaya sessizce dönülmez.
- **Gizlilik:** yeni kişisel veri yok. Ülke ilerlemesi oyun ilerlemesidir: Veri güvenliği formundaki "Diğer kullanıcı
  içeriği (oyun ilerlemesi)" kapsamındadır. Form ve gizlilik politikası değişmez.

## 7. Kod yapısı

**Yeni dosyalar** (`www/`, `game.js`'ten önce yüklenir; sıra: `engeller.js` → `engel-temalari.js` →
`ulke-aileleri.js` → `ulke-objeleri-*.js` → `ulkeler.js` → `kostumler.js` → `dunya-turu.js` → `arkadaslar.js` →
`game.js`):

| Dosya | Sorumluluk |
|---|---|
| `ulkeler.js` | 51 ülkenin verisi: kod, sıra, kıta, aile, palet, iki obje ressamının adı, kostüm kaydı, ad, obje ve boss adları (`t()` anahtarları); `ULKE_ROTASI` ve yardımcılar (`ulkeSirada(k)`, `ulkeKodla(kod)`) |
| `ulke-aileleri.js` | 10 ailenin duvar, sınır, su kıyısı ve zemin deseni ressamları (`window.ULKE_AILELERI`) |
| `ulke-objeleri-avrupa.js`, `-afrika.js`, `-asya.js`, `-amerika.js` | 102 ülke objesi ressamı (`window.ULKE_OBJELERI[ad]`), kıta kıta |
| `kostumler.js` | Kostüm takımı ve `bossKostumuCiz(ctx, s, kayit, zaman)` |
| `dunya-turu.js` | Kip durumu, Dünya Turu ve pasaport ekranları, damga, uçak geçişi, kayıt yardımcıları, ödül |

**Mevcut koda kancalar:**
- **`engeller.js`:** `ressam(o)` — `o.tema` bir ülke koduysa seti kurar: aile duvarı ve suyu, ülkenin objeleri,
  birleşik palet. `engelBicimleriniKur` Dünya Turu'nda `tema` olarak ülke kodunu yazar. Kılık seçimi, çarpışma,
  önbellek ve canlı katman aynen kalır.
- **`game.js`:**
  - `getTheme()`: Dünya Turu'nda ülkenin teması.
  - `startGame()`: başlangıç ülkesi.
  - `nextLevel()`: damga, geçiş, sıradaki ülke ya da bitiş.
  - `endGame()`: Şampiyonlar'a ve Play Games'e yazmaz; açık ülkeyi kaydeder.
  - `drawGhost()`: Dünya Turu bossunda soluk gövde, taç yerine kostüm.
  - `render`: ızgara yerine zemin deseni.
  - Oda kurma, oda listesi ve katılma: `tur` alanı.
- **`index.html` ve `style.css`:** menü düğmesi, Dünya Turu ve pasaport ekranları, Oda Kur'da kip seçimi.
- **Kayıt:** `defaultSave.dunyaTuru`; `loadSave` eksik alanı ve bilinmeyen kodları temizler.
- **Diller:** yaklaşık 230 yeni anahtar (51 ülke, 102 obje, 51 boss adı, arayüz) × 5 dil, `araclar/sozluk.mjs` ile;
  `araclar/anahtarlar.mjs` yeni dosyaları da tarar.
- **Kurallar:** `firebase/database.rules.json` `tur` alanı; `firebase/test/kurallar.test.mjs`.

## 8. Performans

- Engeller 3.13.0 gibi önbellekten tek `drawImage` ile çizilir. Önbellek bölüm başında bütçeyle ısınır (karede 6 ms).
- Zemin deseni karede tek dolgudur.
- Kostüm bossta her karede çizilir. Tek boss vardır, birkaç yol ve dolgudur; gerekirse ölçek başına önbelleğe alınır.
- **Ölçüt:** `cizim.test` (botlu, hayaletli kare hızı) ve 6 kişilik `alti.test` Dünya Turu'nun üç ülkesinde (biri her
  kıtadan farklı aile) bugünkü eşikleri geçer.

## 9. Hata ve uç durumlar

- Eski kayıt (`dunyaTuru` yok) → varsayılan; `acik` 1–51 dışındaysa sınırlanır; bilinmeyen ülke kodlu damga atılır.
- Odada `tur` var ama `level` ya da `state.lvl` 51'den büyük: ülke sırası 51'e sınırlanır. `state.lvl = 52` "tur
  tamamlandı" anlamına gelir.
- Ressamı ya da kostümü eksik ülke: yedek ressam ya da bugünkü taçlı boss (oyun durmaz). Testler eksik bırakmaz.
- Kurallar yayınlanmamışken Dünya Turu odası: §6'daki uyarı.
- Yedekten geri yükleme: `dunyaTuru` kayıtla gelir; eski yedekte yoksa varsayılan.

## 10. Testler

- **`test/ulkeler.test.mjs`** (veri):
  - 51 ülke, kodlar tekil.
  - Küme BM WPP 2024'ün en kalabalık 50 ülkesi + `PS`.
  - Rota §4.2 sırasında.
  - Her ülkenin ailesi var, iki ressamı tanımlı, kostüm kaydı geçerli (tanınan başlık, giysi, desen ve aksesuar).
  - Ülke, obje ve boss adları 5 dilde var.
- **`test/ulke-cizim.test.mjs`** (3.13.0 `engel-bicim` gibi):
  - 10 aile × (duvar, sınır, su) ve 102 obje, farklı boyutlarda (80×80, 180×90, 90×180, 180×180, 470×30, 30×470).
  - Çarpışma alanının içi boyalı, biçimin dışı saydam; çizim dikdörtgenin içinde.
  - İki ayrı sayfada aynı resim (özet) çıkar.
  - Sayfa hatası yok.
- **`test/dunya-turu.test.mjs`** (akış):
  - k. ülkeden başlanır, boss ve hayaletler biter: damga, k+1 açılır, geçiş ve yeni tema doğru.
  - Yenilgide açık ülke kalır.
  - Şampiyonlar, Play Games ve `highestLevel` değişmez.
  - +3 💎 yalnız ilk damgada verilir.
  - 51. ülkede bitiş mesajı çıkar.
  - Yedek biçiminden geri yüklemede `dunyaTuru` korunur.
  - 51 bossun hepsi kostümlü ve taçsız çizilir.
- **Çevrimiçi (emülatör, `cevrimici.test.mjs`'e ek):**
  - Dünya Turu odası 3. ülkeden kurulur; konuk aynı ülkeyi ve aileyi görür.
  - Ülke geçilince iki oyuncu da damga alır.
  - `tur` alanı olmayan oda normal çalışır.
- **Kural testi:** `tur` true ve false kabul; metin ve sayı ret.
- **Süren testler:**
  - `dil` (Dünya Turu, pasaport, uçak geçişi, boss duyurusu; 6 dil, 390 ve 340 px).
  - `cizim` ve `alti` (§8).
  - `engel`, `engel-bicim`, `siralama`, `reklam`, `arkadas`, `cevrimici` ve sözlük denetimi.
- **Ekran denetimi:** 51 ülkenin katalog ve oyun içi görüntüsü ve 51 kostümlü boss (TR 390 px; birkaçı AR 340 px) gözle
  denetlenir.

## 11. Yayın

1. **Taslak:** Türkiye ve Japonya; KS ve DA aileleri, iki ülkenin objeleri, zemin deseni ve iki kostümlü boss. Ekran
   görüntüleri kullanıcıya gösterilir; **kullanıcı onaylamadan kalan 49 ülkeye geçilmez.**
2. Kalan 49 ülke kıta kıta çizilir: Avrupa → Afrika → Asya → Amerika. Her kıtanın sonunda ekran denetimi yapılır.
3. **3.14.0 (47):** Dünya Turu + 3.13.1'in reklam içerik sınırı.
   - `UPDATE_NOTES` 5 dilde; mağaza sürüm notu 7 dilde, 500 karakterin altında.
   - Mağaza görsellerine bir Dünya Turu karesi eklenir.
   - Uzun açıklamaya "🌍 DÜNYA TURU" bölümü eklenir (7 dil).
4. **Kurallar** GitHub'dan yayınlanır (kullanıcının onayıyla). Sonra **Play'e yükleme**, mağaza metni ve görselleri
   (kullanıcının onayıyla). README, `magaza/aciklamalar.md` ve bu belgenin durum satırı güncellenir.

## 12. Kapsam dışı

- Siyasi harita, bayrak.
- Ülkeye özel yeni düşman, oynanış ya da müzik.
- Dünya Turu için ayrı Şampiyonlar listesi ve Play Games başarımları (sonraya bırakılabilir).
- Normal oyunun 6 teması, zemini ve harita üretimi (değişmez).
