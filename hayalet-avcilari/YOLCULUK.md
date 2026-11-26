# Hayalet Avcıları: soldan sağa yolculuk haritası (3.21.0)

Kullanıcının isteği (25 Kasım 2026): Her bölüm, mevcut temasını koruyarak soldan sağa ilerlenen uzun bir haritaya dönüşsün. Oyuncular
bölümü sağa doğru ilerleyerek köprüleri, engelleri ve tuzakları aşar, en sağdaki boss'a ulaşır. Böylece oyun bir seyahat gibi oynanır
ve Dünya Turu hikâyesine (HIKAYE.md) daha uygun olur. Hayalet sayısı bugünkü gibi kalır.

Kullanıcının kararları:
- **Bakış:** Üstten bakış kalır. Oyuncu dört yöne yürür; harita uzundur ve sola-sağa uzanır, kamera oyuncuyu izler.
- **İlerleme:** Bölgeler ve köprüler.
  - Bölgedeki hayaletler yakalanınca sıradaki bölgenin köprüsü açılır.
  - **Açılan köprü kapanmaz, geri dönülebilir.**
  - En sağda boss arenası vardır. Boss **yalnız değildir**: yanında başka hayaletler de çıkmaya devam eder.
- **Zorluk iyi ayarlanmalı:** İlerledikçe hayaletler güçlenir. Oyuncu karakterini **geliştirmek zorunda kalmalıdır**; geliştirmesiz
  ileri bölümler zorlaşır.
- **Uzunluk:** Uzun, yaklaşık 8 ekran: 6 bölge ve boss arenası.
- **Kapsam:** Hepsi: normal oyun, Dünya Turu ve çevrimiçi odalar.

Kodu Evren yazar (kullanıcının kuralı). Bu belge şartnamedir; sayılar `YOLCULUK_AYAR` tablosunda tutulur, ayarlanabilir.

## Harita

- **Boyut:** Dünya genişliği yaklaşık 8 ekran genişliğidir (`worldW` yaklaşık 7200), yüksekliği yaklaşık 1,3 ekran (`worldH`
  yaklaşık 1000). Kesin değerler `YOLCULUK_AYAR`'dadır. Kamera bugünkü gibi oyuncuyu izler ve dünyanın sınırında durur.
- **Bölge düzeni** (soldan sağa):
  - Başlangıç alanı.
  - Bölge 1 … Bölge 6, her biri yaklaşık 1050 birim genişliğinde.
  - Boss arenası, yaklaşık 900 birim.
- **Geçitler:** Her bölgenin sağ kenarında haritayı boydan boya kesen bir **geçit** vardır. Geçit, temaya uygun bir su ya da lav
  şerididir (temaya göre nehir, kanal, uçurum görünümlü su). Tam ortasında kapalı bir köprü bulunur:
  - **Kapalı köprü:** Geçilmez. Kalkık bir asma köprü ya da önünde parlayan bir kapı olarak çizilir.
  - **Açılan köprü:** Bölge temizlenince köprü kısa bir animasyonla iner ve bir ses çalar; bildirim çıkar: "🌉 Köprü açıldı!".
    Bir daha kapanmaz. Mevcut köprü sistemi (kopru.js) kullanılır, yeni bir sistem kurulmaz.
- **Engeller ve tuzaklar:** Bugünkü üreteçlerle (duvar, su, diken, lav, tema objeleri, ülke aileleri ve objeleri) her bölgeye ayrı
  ayrı dağıtılır. Bölge ilerledikçe biraz artar. Engeller geçitlerin önünü ve köprü ağzını kapatmaz; her bölgede soldan sağa yürünebilir
  bir yol mutlaka bulunur (sınamayla denetlenir).
- **Tohum:** Yerleşim bölüm numarasından (ve Dünya Turu'nda ülke kodundan) tohumlanır. Her cihaz aynı haritayı kurar (çevrimiçi için
  gerekli).
- **Tema:** Bugünkü gibi bölüme ya da ülkeye göre değişir; zemin, renkler ve objeler aynı kalır.
- **Oyuncunun başlangıcı:** En solda, başlangıç alanında.

## Hayaletler ve zorluk

- Hayaletler **yalnız oyuncunun bulunduğu, henüz temizlenmemiş bölgede** doğar: o bölgenin sağ ve sol kenarlarından, oyuncudan
  `HAYALET_DOGUM_UZAKLIK` kadar uzakta.
- **Aynı anda en çok** hayalet sayısı bugünkü sınırdır (12 + 4 × bölüm, en çok 40). "Hayalet sayısı aynı kalır" kuralı budur.
- **Bölge kotası:** Her bölgede belirli sayıda hayalet doğar (`YOLCULUK_AYAR.kota(bolum, bolge)`). Kota dolup hepsi yakalanınca bölge
  temizlenir ve köprü açılır.
- **Ekranda ilerleme:** Bölgenin kalan hayalet sayısı küçük bir sayaçla gösterilir (👻 7). Üstte ince bir yolculuk çubuğu, oyuncunun
  haritadaki yerini, bölgeleri ve boss'u (👑) gösterir.
- **Zorluk eğrisi:**
  - Bölge ilerledikçe hayaletlerin canı ve hızı artar; ateş eden hayalet oranı yükselir.
  - Örnek: can = bugünkü kademe + ⌊(bölge − 1) / 2⌋; hız %4 artar.
  - Ayar şu ölçüye göre yapılır: geliştirmesiz (seviye 0) bir avcı ilk 3 bölümü rahat geçer, 6. bölümden sonra zorlanır, 10.
    bölümden sonra geliştirme almadan bitirmesi çok zordur. Geliştirmeli oyuncu akıcı oynar.
  - Para kazancı bölge sayısıyla dengelenir, böylece oyuncu geliştirme alabilecek kadar kazanır.
  - Bu ölçü bir sınama botuyla ölçülür (aşağıda).
- **Boss arenası:**
  - Son köprü açılıp oyuncu arenaya girince boss gelir. Çevrimiçinde canlı oyuncuların hepsi arenaya girince ya da ilk giren
    oyuncudan 10 sn sonra gelir.
  - Boss yaşadıkça arenada **eşlik eden hayaletler** doğmaya devam eder (aynı anda en çok sınırın yarısı).
  - Boss ölünce doğum durur; kalanlar yakalanınca bölüm biter. Bugünkü bitiş akışı korunur: damga, uçak, sıradaki bölüm.
  - Bugünkü "60 sn sonra boss" zamanlayıcısı yolculuk haritasında kullanılmaz.
- **Geri dönüş:** Temizlenmiş bölgelerde yeni hayalet doğmaz; oyuncu geri dönüp kalan paraları, eşyaları ve hatırayı alabilir.
  Hayaletler köprüleri kullanabilir. Oyuncuyu kovalayan hayalet temizlenmiş bölgeye de girebilir.

## Hikâye ile bağ (HIKAYE.md)

- Dünya Turu'nda hatıra, ilk 4 bölgeden birine konur (tohumlu). Toplanmadan da bölüm bitirilebilir. Defterde bugünkü gibi görünür.
- Varış sahnesi oyuncu başlangıç alanındayken gösterilir.

## Çevrimiçi

- **Bölgeyi kurucu yönetir:** Hangi bölge temiz, hangi köprü açık, boss arenası durumu. Bu bilgi durumla birlikte gönderilir
  (yeni alan). İstemciler köprüleri buna göre açar.
- **Geride kalan oyuncu:** Köprü açılınca geride kalan oyuncu yetişebilir. Hayaletler yalnız en öndeki temizlenmemiş bölgede doğar;
  geride kalanı korumak için o bölgedeki oyunculara da yakın doğabilir.
- **Ölüp hayalete dönen oyuncu** bugünkü gibi izler. Sonraki bölümde en solda doğar.
- **Sürüm uyumu:** Yeni harita eski sürümle oynanamaz. Odaya bir "yolculuk" işareti, oyuncuya sürüm bilgisi eklenir ve eski sürüm bu
  odalara katılamaz. Bunun için **Realtime Database kuralları değişir.** Kural yayınından önce kullanıcıdan onay alınır. Kurallar
  yayınlanmadan çevrimiçi yolculuk odası kurulamaz; oyun bunu kullanıcıya söyler (Dünya Turu odasındaki eski kural uyarısı gibi).

## Başarım

- Uzun dünyada yalnız görünen alan çizilir (bugünkü gibi).
- Zemin dokusu ve tema objeleri ekran dışında çizilmez.
- Çarpışma denetimi bölgeye göre süzülür; uzak engeller her karede taranmaz.
- Çizim sınamasındaki kare hızı ölçütü bugünkünden kötü olmamalıdır.

## Aşamalar (Evren görevleri)

1. **Y1:** Harita üreteci, bölgeler, geçitler, köprüler, bölge doğumu ve kotası, boss arenası, kamera, yolculuk çubuğu (tek kişilik:
   normal oyun ve Dünya Turu) ve sınamalar.
2. **Y2:** Zorluk ve ekonomi ayarı. Sınama botu: geliştirmesiz ve geliştirmeli avcıyla bölümleri oynatıp süre ve ölüm ölçer; ayar
   tablosu buna göre düzenlenir.
3. **Y3:** Çevrimiçi. Bölge durumu, köprüler, arena bekleme kuralı, kurallar ve sürüm işareti (kural yayını onaydan sonra).
4. **Y4:** Hikâye bağı ve cilalama: hatıra bölgeleri, varış sahnesi, köprü animasyonu ve sesleri, mağaza görselleri, sürüm notu.

## Y2 denge ölçümü

Ölçüm botu `test/y2-denge.mjs` (yaklaşık 1 dakika): yolculuk bölümünü simülasyon zamanında kendi oynar; en yakın hayalete uygun
mesafede yana kayar, mermi/kıyı/timsahtan kaçar, bölge temizlenince köprüye yürür, duvarı 20-40 px ızgarada BFS ile dolanır.
Her satır 3 tohum, 600 sn üst sınır; "tamam" bitirilen deneme sayısı, süre ortalama, ❤ kaybedilen kalp. Geliştirmeli = kinkin, dört
özellik 5. Bot iki oyun hatası buldu (duvar dibinde takılan hayalet, kapalı cepteki yuva; 65aac73).

| Avcı | Bölüm | Önce (26 Kas) | Sonra (Tur 1) | Tur 2 |
|---|---|---|---|---|
| geliştirmeli | 1 | 3/3 · 95 sn · 0,3❤ | 3/3 · 82 sn · 0,7❤ | 3/3 · 71 sn · 0❤ |
| geliştirmeli | 3 | 3/3 · 131 sn · 0,7❤ | 3/3 · 98 sn · 0,3❤ | 3/3 · 90 sn · 0,3❤ |
| geliştirmeli | 5 | 3/3 · 212 sn · 3❤ | 3/3 · 137 sn · 2,3❤ | 3/3 · 73 sn · 0,7❤ |
| geliştirmeli | 7 | 1/3 · 557 sn | 3/3 · 109 sn · 1,7❤ | 3/3 · 89 sn · 0,3❤ |
| geliştirmeli | 10 | 0/3 | 2/3 · 345 sn · 11❤ | 2/3 · 263 sn · 9❤ |
| geliştirmesiz | 1 | 0/3 | 1/3 · 508 sn · 6❤ | 3/3 · 235 sn · 1,7❤ |
| geliştirmesiz | 3 | 0/3 | 0/3 | 3/3 · 377 sn · 2,3❤ |
| geliştirmesiz | 5, 7, 10 | 0/3 | 0/3 | 0/3 |

Değişen ayarlar (eski değerler kodda yorum olarak duruyor):
- `YOLCULUK_AYAR.kota`: `(10 + 3·bölüm)·(0,8 + 0,08·bölge)` → `(10 + 1,6·bölüm)·(0,75 + 0,06·bölge)`: bölüm başına hayalet sayısı
  bölümle daha yavaş büyür (uzun haritada bir bölüm 6 bölge demek).
- `zorluk.hiz`: bölge başına %4 → %2,5; `zorluk.ates`: bölge başına 0,02 → 0,012. `zorluk.can` aynı.
- Yalnız yolculuk haritasında: doğum aralığı `0,8 − 0,06·bölüm` → `0,9 − 0,05·bölüm` (en az 0,3 sn), aynı anda en çok hayalet
  `12 + 4·bölüm (≤ 40)` → `7 + bölüm (≤ 15)`. Eski harita ve çevrimiçi eski harita değişmedi.

Tur 2 (Y2D) değişen ayarlar — hepsi yalnız yolculuk haritasında, eski harita ve çevrimiçi eski harita değişmedi:
- `YOLCULUK_AYAR.kota`: Tur 1'in `(10 + 1,6·bölüm)·(0,75 + 0,06·bölge)` formülü → `(8 + 0,35·bölüm + 0,08·bölüm²)·(0,83 + 0,03·bölge)`.
  Erken bölümlerde hayalet sayısı azalır, bölge çarpanı yumuşatılır; bölüm ve bölgeyle tekdüze artar.
- Hayalet hızı (`spawnGhost`): yolculukta 1-4. bölümler `50 + bölüm·6` yerine sırasıyla 32/30/26/44 taban hızıyla başlar, 5. bölümde
  bugünkü değere döner (`+ rastgele 0-20` her bölümde aynı).
- Yuvasından yeni çıkan yolculuk hayaleti ilk 1,5 sn yarı hızda yaklaşır.
- Yolculukta 1-3. bölümlerin boss minyonları 90 + bölüm·5 yerine 55 hızla doğar.

Tur 2 hedefi tuttu: geliştirmesiz avcı 1. bölüm 3/3 (1,7❤), 3. bölüm 3/3 (2,3❤); geliştirmeli avcı 1-7. bölümler 3/3 ve ortalama
süre 60-200 sn aralığında (72-90 sn). 10. bölüm geliştirmeli 2/3 kalıyor (zor kalmasına izin verildi).

