# Hayalet Avcıları: Dünya Turu hikâyesi (3.21.0)

Kullanıcının isteği (24 Kasım 2026): Dünya Turu'nda ülkeden ülkeye ilerleyen bir **gezgin hikâyesi** olsun. Hikâyede
avcılar arasında dostluk kurulsun. Her ülkede bir şey bulunsun, bulunanlar biriktikçe bilmeceler çözülsün.

Kullanıcının kararları:
- **Gezgin:** Turu başlatan oyuncunun seçili avcısı. Yolda öbür avcılarla karşılaşır, onlar arkadaş olup yolculuğa
  katılır.
- **Bulunan şey:** Her ülkede haritanın bir yerinde saklı, o ülkeye özgü bir **hatıra**. Bölüm bitmeden toplanırsa
  deftere eklenir. Kaçırılırsa ülke yeniden oynanınca yine çıkar.
- **Bilmece:** Her 5 hatırada bir bilmece, toplam 10 bilmece. Üç seçenekli; yanlış cevabın cezası yok, yeniden
  denenir. Çözülünce hikâyenin sıradaki bölümü açılır.
- **Ödül:** Her bilmece 100 💰 + 2 💎. On bilmecenin hepsi çözülünce 🧭 **Gezgin** rozeti.

Metinleri ve kodu Evren yazar (kullanıcının kuralı). Bu belge şartnamedir.

## Ana hikâye

Hayaletler dünyanın her yerinde kol geziyor, ama kötü değiller: **evlerinin yolunu kaybetmiş yalnız ruhlar**. Gezgin,
yolculuğun başında İstanbul'da eski bir **Dostluk Haritası** bulur. Haritanın parçaları silinmiştir. Her bilmece çözülünce
haritanın bir parçası yeniden belirir ve hikâyenin bir bölümü açılır.

Son ülke Arjantin'dir. Orada, **dünyanın ucundaki deniz feneri**nde arkadaşlar hep birlikte **Dostluk Feneri**'ni yakar.
Fenerin ışığı kaybolan hayaletlere evlerinin yolunu gösterir. Hikâyenin dersi: tek başına kimse bütün dünyayı
dolaşamaz, dostlar birlikte her yere ulaşır.

Ton:
- Neşeli, sıcak, 13 yaş üstüne uygun.
- Korku yok, kötü karakter yok, kimse alay edilmez.

## Avcıların katılışı

Gezgin dışındaki 11 avcı sırayla yolculuğa katılır. Katılış ülkeleri rota sırasıyla 3, 7, 11, 15, 19, 23, 27, 31, 35,
39 ve 43'tür. Katılış sırası şu listedir; gezgin listeden çıkarılır:

> kinkin, veryi, kornet, mark, kent, ponko, gul, rani, beti, fanatik, silsen, sercin

Her avcının bir **katılış sahnesi** vardır: 3–4 kısa satırlık bir konuşma.
- Avcı kendini kendi kişiliğiyle tanıtır (karakter-detay.js'teki hikâyesiyle uyumlu).
- Gezgin onu yolculuğa çağırır.
- Katılış sahnesi ülkeye bağlı değildir: her ülkede geçebilir.

## Ülke sahnesi

Her ülkeye varışta kısa bir sahne gösterilir. Sahne 2 ya da 3 satırdır:
- **anlatıcı:** Ülkeye varışı ve o ülkenin bir güzelliğini anlatan tek bir cümle.
- **gezgin** ya da **arkadaş:** Hatırayı aramaya ya da dostluğa dair tek bir cümle. "Arkadaş", en son katılan avcıdır. İlk
  iki ülkede henüz arkadaş yoktur; o satırı gezgin söyler.

Konuşanın adı satırın başında etiket olarak yazılır. **Cümlenin içinde ad geçmez.** Bunun iki nedeni var:
- Ad yer tutucusuna ek gelmesin.
- Çeviri bozulmasın.

## Hatıralar

Her ülkenin bir hatırası vardır:
- ad (2–4 kelime),
- tek bir emoji,
- bir cümlelik not.

Hatıra o ülkeye özgü olmalı ve gerçekle uyuşmalıdır. Örnekler:
- Japonya: origami turna.
- Meksika: papel picado bayrağı.
- Türkiye: nazar boncuğu değil, **ebru kâğıdı**.

**İçerik kuralları:**
- Yalnız kültür, doğa, el sanatı, yemek, oyun ve müzik.
- Din, siyaset, savaş, sınır, bayrak ve kişi adı yok.
- Bir ülkeyi küçümseyen ya da kalıp yargıya dayanan ifade yok.

## Bilmeceler

Bilmece *n*, rota sırasında 5n−4 ile 5n arasındaki beş ülkenin hatıralarıyla açılır. Beşi de toplanınca bilmece açılır.
Son ülkenin (51., Arjantin) hatırası bilmece açmaz; final sahnesinin parçasıdır.

Her bilmecede şunlar vardır:
- soru,
- üç seçenek,
- doğru seçeneğin sırası,
- bir **bölüm** metni.

**Soru:** O beş hatıranın notlarından çıkarılabilmeli. Defter notları ipucudur; dışarıdan bilgi gerekmez. Kısa, eğlenceli,
kafiyeli olabilir. Çeviride anlamını korumalı: kelime oyunu yok.

**Bölüm metni:** Ana hikâyeyi ilerletir. 3–4 cümleden oluşur ve haritanın hangi parçasının belirdiğini söyler.

**Final:** Bilmece 10 çözülmüş, Arjantin'in hatırası da toplanmışsa final sahnesi gösterilir (4–6 satır) ve rozet verilir.

## Oyun içi davranış

**Hatıranın haritaya konması:**
- Dünya Turu bölümü başlarken, o ülkenin hatırası henüz toplanmamışsa haritaya konur.
- Yeri boş ve ulaşılabilir bir noktadır; oyuncunun doğduğu yere en az 300 px uzaktır.
- Yer, ülke koduna göre tohumlanmış basit bir sözde rastgele sayaçla (ör. mulberry32) seçilir. Böylece çevrimiçinde
  herkes aynı yeri görür. Boş yer denetimi için oyunun mevcut çarpışma yardımcıları kullanılır.

**Hatıranın görünüşü ve toplanması:**
- Parlayan bir baloncuğun içinde emoji olarak görünür, hafifçe süzülür ve ışıldar.
- Mıknatıs onu çekmez; hayaletler ona dokunmaz.
- Oyuncu değince toplanır. "🎁 Hatıra: {ad}" bildirimi çıkar, ses çalar (audio.gem ya da audio.yildiz) ve deftere işlenir.

**Varış sahnesi:**
- Tek kişilik oyunda varış sahnesi uçak geçişinden sonra, oyun duraklatılmış hâldeyken gösterilir. Duraklama süresi
  sayaçlardan düşülür.
- Dokununca sıradaki satıra geçilir, son satırda oyun sürer.
- Aynı ülkenin sahnesi yalnız ilk varışta otomatik gösterilir; sonra defterden yeniden okunabilir.
- Katılış sahnesi varsa ülke sahnesinden önce gösterilir.
- Çevrimiçinde oyun durmaz: sahne yalnız defterde okunur.

**Bilmece:**
- Bir bilmecenin beş hatırası tamamlanınca ülke bitişindeki damga ekranından sonra bilmece penceresi açılır (tek kişilik).
- Pencere "Sonra" ile kapatılabilir; bilmece defterden de çözülebilir.
- Doğru cevapta ödül verilir ve bölüm metni gösterilir.
- Yanlış cevapta seçenek sallanır; ceza yoktur.

**Defter (📖):**
- Dünya Turu ekranında yeni bir sekmedir.
- **Arkadaşlar:** Katılan avcıların kart görselleri.
- **Hatıralar:** 51 yuva. Toplanmamış yuva ❔ olarak görünür.
- **Bilmeceler:** 🔒 kilitli, ❓ çözülebilir, ✅ çözüldü.
- **Bölümler:** Açılan bölümler yeniden okunabilir.
- **Rozet:** Kazanıldıysa gösterilir.

**Kayıt:** Kayıt `save.dunyaTuru` içinde tutulur. `turKaydiniTemizle` bu alanları korur ve doğrular:
- `hatiralar: { KOD: ms }`
- `bilmeceler: { "1": ms, … }`
- `sahneler: { KOD: 1 }`
- `katilanlar: { avcı: ms }`
- `gezgin: avcı`: turun ilk başladığı avcı. Gezgin turun ortasında değişmez.
- `rozet: ms`

**Ağ verisi:** Değişmez. Hatıra toplama ve bilmeceler yerel kayıttır.

## Dosyalar

- `www/hikaye-veri.js`: Bütün metinler, `t("…")` ile: `HIKAYE_KATILIS`, `HIKAYE_ULKE`, `HIKAYE_BILMECE`,
  `HIKAYE_FINAL`. Yalnız veri içerir.
- `www/hikaye.js`: Kurallar, yerleştirme, sahne, bilmece ve defter arayüzü.
- `index.html`'e iki betik eklenir (dunya-turu.js'ten sonra, game.js'ten önce); `style.css`'e defter ve sahne biçimleri
  eklenir. `game.js` ve `dunya-turu.js`'e yalnız kısa kancalar konur.
- `araclar/anahtarlar.mjs` iki yeni dosyayı da tarar. Çeviriler beş dilde yapılır.
- Sınama: `test/hikaye.test.mjs`.
