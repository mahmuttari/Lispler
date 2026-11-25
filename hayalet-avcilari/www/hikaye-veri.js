/* ============================================================
   HAYALET AVCILARI — DÜNYA TURU HİKÂYESİ: METİNLER (3.21.0)
   Yazar: Evren (deepseek/glm), bulut Claude düzeltti. Kaynak: hikaye-taslaklari/evren/ (araclar/hikaye_derle.py üretir; elle düzenleme).
   Şartname: HIKAYE.md. Bu dosya yalnız veri içerir; kurallar ve arayüz hikaye.js'te.
   Satır: { k: "anlatici" | "gezgin" | "arkadas" | "katilan", m: metin }. Cümle içinde avcı adı geçmez.
   ============================================================ */
// Katılış sırası (gezgin listeden çıkarılır) ve katılış ülkelerinin rota sırası
const HIKAYE_AVCI_SIRASI = ["kinkin", "veryi", "kornet", "mark", "kent", "ponko", "gul", "rani", "beti", "fanatik", "silsen", "sercin"];
const HIKAYE_KATILIS_ULKE = [3,  7,  11,  15,  19,  23,  27,  31,  35,  39,  43];
// Ödül
const HIKAYE_BILMECE_PARA = 100, HIKAYE_BILMECE_ELMAS = 2;

const HIKAYE_KATILIS = {
  kinkin: [
    { k: "katilan", m: t("Ben mahallenin en hızlı koşanıyım; gece devriyesinde hep öndeyim!") },
    { k: "gezgin", m: t("Haritanın eksik parçalarını arıyorum; hızınla bana katılır mısın?") },
    { k: "katilan", m: t("Katılırım! Enerji tabancam ve koşan ayaklarım hazır.") },
    { k: "gezgin", m: t("O zaman dostluk yolculuğu başlasın; ilk dönemeç senin!") },
  ],
  veryi: [
    { k: "katilan", m: t("Dedemin ocağında büyüdüm; çekicimi tek elimle sallarım.") },
    { k: "gezgin", m: t("Dağılmış harita parçalarını toplamak için güçlü kollar lazım. Ne dersin?") },
    { k: "katilan", m: t("Katılırım; biraz yavaşım ama sağlam adımlarla gelirim.") },
    { k: "gezgin", m: t("Harika! Yol, sağlam adımlarla daha da güzel.") },
  ],
  kornet: [
    { k: "katilan", m: t("Mor tüylerimin altından dünyayı izlerim; asamla uzakları görürüm.") },
    { k: "gezgin", m: t("Uzak görüşün haritada işimize yarar; bizimle gelir misin?") },
    { k: "katilan", m: t("Gelirim; sihrimi yalnız iyilik için kullanırım.") },
    { k: "gezgin", m: t("Dostluk yolculuğunda iyilik her zaman yanımızda olsun.") },
  ],
  mark: [
    { k: "katilan", m: t("Çantamda haritalar, pusulalar ve atıştırmalıklar var; hazine kokusunu alırım.") },
    { k: "gezgin", m: t("O zaman tam sana göre bir hazine var: silik bir Dostluk Haritası!") },
    { k: "katilan", m: t("Katılırım! Parçaları bulurken atıştırmayı da paylaşırım.") },
    { k: "gezgin", m: t("Anlaştık; yol boyunca hem arar hem paylaşırız.") },
  ],
  kent: [
    { k: "katilan", m: t("Bir zamanlar gölgeler arasında kayboldum; geri dönmeyi öğrendim.") },
    { k: "gezgin", m: t("Kaybolan izleri bulmakta senden iyisi yok; yolumuz uzun, eşlik eder misin?") },
    { k: "katilan", m: t("Gelirim; kapüşonumun altından sessizce yol gösteririm.") },
    { k: "gezgin", m: t("Sessiz rehberliğinle harita parçaları daha kolay bulunur.") },
  ],
  ponko: [
    { k: "katilan", m: t("Kocaman şapkam uzaktan görünür; hızlı çektiğim tabancamla tanınırım.") },
    { k: "gezgin", m: t("Uzaktan görünen bir şapka, kalabalıkta birbirimizi kaybetmememizi sağlar. Gelsene!") },
    { k: "katilan", m: t("Katılırım; şapkamı düzeltir, yola çıkarım.") },
    { k: "gezgin", m: t("Şapkan da yolun neşesi olsun; hadi ilerleyelim.") },
  ],
  gul: [
    { k: "katilan", m: t("Taht yerine yayımı seçtim; oklarım hedefini hiç şaşmaz.") },
    { k: "gezgin", m: t("Haritanın kayıp parçaları için keskin bir göz arıyorduk. O göz sende olabilir mi?") },
    { k: "katilan", m: t("Katılırım; yayım ve gülüşüm yolda yanınızda olsun.") },
    { k: "gezgin", m: t("Gülüşün yolu aydınlatsın; ilk hedefe birlikte gidelim.") },
  ],
  rani: [
    { k: "katilan", m: t("Küçüğüm ama yüreğim büyük; sapanımla hedefi bulurum.") },
    { k: "gezgin", m: t("Uzun yolda yorulan çok olur; sen yanımızda olursan herkes daha cesur yürür.") },
    { k: "katilan", m: t("Katılırım; yaralanan olursa çantamda şifalı otlar var.") },
    { k: "gezgin", m: t("Şifalı kalbinle yol daha güvenli; teşekkürler.") },
  ],
  beti: [
    { k: "katilan", m: t("Lolipop beremle neşe saçarım; şeker toplarım tatlı tatlı uçar.") },
    { k: "gezgin", m: t("Yolculuğumuzun biraz şekere ihtiyacı var. Bize katılsana!") },
    { k: "katilan", m: t("Katılırım! Göllerden bile yürürüm, ıslanmaya aldırmam.") },
    { k: "gezgin", m: t("Neşenle ıslak yollar bile kurur; hadi başlayalım.") },
  ],
  fanatik: [
    { k: "katilan", m: t("Siyah kuşağımı dağlarda çalışarak aldım; nunçakum hızla döner.") },
    { k: "gezgin", m: t("Zor yollarda arkamızı kollayacak biri lazım. Var mısın?") },
    { k: "katilan", m: t("Gelirim; gücümü dostları korumak için kullanırım.") },
    { k: "gezgin", m: t("Gücün dostlukla birleşsin; yola birlikte devam edelim.") },
  ],
  silsen: [
    { k: "katilan", m: t("Papatyalı asam hiç solmaz; gittiğim yere bahar götürürüm.") },
    { k: "gezgin", m: t("Gittiğin yere bahar götürüyorsan, haritamızın solgun yerlerine de götür!") },
    { k: "katilan", m: t("Katılırım; çiçek toplarım değdiği yeri ışıtır.") },
    { k: "gezgin", m: t("Işığın yolu renklendirsin; hadi parçaları aramaya çıkalım.") },
  ],
  sercin: [
    { k: "katilan", m: t("Kuşlarla konuşur, rüzgârla yarışırım; tüylerim hedefini kendi bulur.") },
    { k: "gezgin", m: t("Rüzgârla yarışan biri yolumuzu kısaltır. Bizimle uçar mısın?") },
    { k: "katilan", m: t("Katılırım; kanat tüylerim izleri bulmada yardımcı olur.") },
    { k: "gezgin", m: t("Rüzgârınla yol hafifler; birlikte ilerleyelim.") },
  ],
};

const HIKAYE_ULKE = {
  TR: { // 1. Türkiye
    hatira: { ad: t("ebru kâğıdı"), simge: "🎨", not: t("Su üstüne serpilen boyalarla yapılan, her biri benzersiz desenli kâğıt.") },
    sahne: [
      { k: "anlatici", m: t("İstanbul’da vapur düdükleri martı seslerine karışırken eski çarşıların kokusu yola selam veriyor.") },
      { k: "gezgin", m: t("İstanbul’da elime geçen silik Dostluk Haritası çantamda; çizgileri çözmek için sabırsızım.") },
    ],
  },
  UA: { // 2. Ukrayna
    hatira: { ad: t("Petrykivka boyalı ahşap kaşık"), simge: "🥄", not: t("Petrykivka desenleriyle boyanmış küçük ahşap kaşık; süs olarak da kullanılır.") },
    sahne: [
      { k: "anlatici", m: t("Ukrayna’da ayçiçeği tarlaları ufka kadar sarı bir deniz gibi uzanıyor.") },
      { k: "gezgin", m: t("Saman çatılı beyaz evlerin gölgesinde mola verip tarlaların kokusunu içime çekiyorum.") },
    ],
  },
  PL: { // 3. Polonya
    hatira: { ad: t("Wawel ejderi ahşap oyuncak"), simge: "🐉", not: t("Wawel ejderi efsanesinden esinlenen, oynar kanatlı küçük ahşap oyuncak.") },
    sahne: [
      { k: "anlatici", m: t("Polonya’da leylek yuvaları çatılarda tıkır tıkır konuşurken kasabaya vardık.") },
      { k: "gezgin", m: t("Wawel ejderi hikâyelerini dinlemek için meydandaki taş basamaklara oturuyorum.") },
      { k: "arkadas", m: t("Ejderha olsaydım kesin burada kahve içerdim; sen de bana eşlik eder misin?") },
    ],
  },
  DE: { // 4. Almanya
    hatira: { ad: t("zencefilli kalp kurabiye"), simge: "🍪", not: t("Baharatlı hamurdan pişirilip süslenen, kalp biçimli küçük zencefilli kurabiye.") },
    sahne: [
      { k: "anlatici", m: t("Almanya’da yarım ahşap evlerin pencereleri çiçeklerle süslenmiş.") },
      { k: "gezgin", m: t("Guguklu saat evinin önünde durup kuşun ne zaman öteceğini merak ediyorum.") },
      { k: "arkadas", m: t("Zencefil kokusu peşinde bir fırın arıyorum; sen de gelir misin?") },
    ],
  },
  GB: { // 5. Birleşik Krallık
    hatira: { ad: t("Cornish pasty"), simge: "🥟", not: t("İç harcı hamurla kapatılan, elle yenen küçük Cornish pasty.") },
    sahne: [
      { k: "anlatici", m: t("Birleşik Krallık’ta kırmızı telefon kulübeleri yağmurda bile gülümsüyordu.") },
      { k: "gezgin", m: t("Saat kulesinin çanlarını dinlerken cebimdeki haritanın kıvrımlarına bakıyorum.") },
      { k: "arkadas", m: t("Yağmur burada sanki çay molası gibi; şemsiyeni paylaşır mısın?") },
    ],
  },
  FR: { // 6. Fransa
    hatira: { ad: t("lavanta sabunu"), simge: "🧼", not: t("Lavanta kokulu, küçük kalıplara dökülmüş el yapımı sabun.") },
    sahne: [
      { k: "anlatici", m: t("Fransa’da lavanta tarlaları mor dalgalar gibi kokuyu yola taşıyordu.") },
      { k: "gezgin", m: t("Eyfel Kulesi’nin gölgesinde oturup haritanın silik çizgilerini gözden geçiriyorum.") },
      { k: "arkadas", m: t("Lavanta kokusuna kapılıp gitmeyelim; önce bir kruvasan molası isterim.") },
    ],
  },
  IT: { // 7. İtalya
    hatira: { ad: t("Murano cam boncuğu"), simge: "🔮", not: t("Murano ustalarının renkli camdan yaptığı küçük, parlak boncuk.") },
    sahne: [
      { k: "anlatici", m: t("İtalya’da gondollu kanal iskelesi akşam ışığında yavaşça sallanıyordu.") },
      { k: "gezgin", m: t("Kolezyum’un taşları arasında dolaşırken eski bir el sanatı izi arıyorum.") },
      { k: "arkadas", m: t("Gondola binsem kesin şarkı söylerim; sen kürek çekmeye var mısın?") },
    ],
  },
  ES: { // 8. İspanya
    hatira: { ad: t("flamenko yelpazesi"), simge: "🪭", not: t("Flamenko dansında kullanılan, katlanır ahşap çıtalı küçük renkli yelpaze.") },
    sahne: [
      { k: "anlatici", m: t("İspanya’da La Mancha yel değirmenleri rüzgârla nazikçe dönüyordu.") },
      { k: "gezgin", m: t("Elhamra’nın Aslanlı Çeşmesi’nin serinliğinde haritanın soluk köşesine bakıyorum.") },
      { k: "arkadas", m: t("Yel değirmenleriyle yarışa girmem; ben daha çok yelpaze kadar hafifim.") },
    ],
  },
  MA: { // 9. Fas
    hatira: { ad: t("deri babuş anahtarlık"), simge: "👡", not: t("Renkli deriden yapılan, minik anahtarlığa dönüşen geleneksel babuş.") },
    sahne: [
      { k: "anlatici", m: t("Fas’ta Şefşavan’ın mavi sokakları serin bir gülümseme gibiydi.") },
      { k: "gezgin", m: t("Fenerli çarşı tezgâhlarında deri kokusu ve renkler arasında kayboluyorum.") },
      { k: "arkadas", m: t("Pusulayı evde unuttum; mavi sokakta kaybolursak sen önden git.") },
    ],
  },
  DZ: { // 10. Cezayir
    hatira: { ad: t("Sahra kumu şişesi"), simge: "🏜️", not: t("Sahra kumu renkli katmanlarla doldurulmuş küçük hatıra şişesi.") },
    sahne: [
      { k: "anlatici", m: t("Cezayir’de Sahra kumulları gün batımında altın rengi dalgalara dönüştü.") },
      { k: "gezgin", m: t("Tassili n'Ajjer’in kaya kemerlerine bakarken haritanın kum gibi silikleşen yerini düşünüyorum.") },
      { k: "arkadas", m: t("Kumullarda yürümek kolay mı? Benim ayakkabılarım şimdiden tatil istiyor.") },
    ],
  },
  CI: { // 11. Fildişi Sahili
    hatira: { ad: t("kakao çekirdeği kolye ucu"), simge: "🍫", not: t("Kakao bahçelerini anlatan, çekirdek biçimli küçük ahşap kolye ucu.") },
    sahne: [
      { k: "anlatici", m: t("Fildişi Sahili’nde kakao bahçeleri gölgeli bir serinlik sunuyordu.") },
      { k: "gezgin", m: t("Fil ailesini uzaktan izlerken haritanın çizgilerini ağaç gölgesinde inceliyorum.") },
      { k: "arkadas", m: t("Kakao kokusu bu kadar güzelse, çikolata molası şart; sen de katıl.") },
    ],
  },
  GH: { // 12. Gana
    hatira: { ad: t("kente kumaş parçası"), simge: "🧵", not: t("Parlak renkli ipliklerle dokunan, küçük kente desenli kumaş parçası.") },
    sahne: [
      { k: "anlatici", m: t("Gana’da Kakum kanopi köprüsü ağaçların arasında hafifçe sallanıyordu.") },
      { k: "gezgin", m: t("Kente dokuma tezgâhının ritmini dinlerken haritanın dokusunu parmaklarımla yokluyorum.") },
      { k: "arkadas", m: t("Köprüde sallanmak serbest ama adımlarını saymayı unutma; ben sayarım.") },
    ],
  },
  NG: { // 13. Nijerya
    hatira: { ad: t("konuşan davul minyatürü"), simge: "🪘", not: t("Elle vuruldukça farklı sesler çıkaran, minik konuşan davul.") },
    sahne: [
      { k: "anlatici", m: t("Nijerya’da Zuma Kayası güneşle ısınırken çevresi sakin görünüyordu.") },
      { k: "gezgin", m: t("Konuşan davulların ritmini duymak için kulak kabartıyorum.") },
      { k: "arkadas", m: t("Davullar konuşuyorsa ben de selam veririm; sen de ritme uyar mısın?") },
    ],
  },
  CD: { // 14. Kongo DC
    hatira: { ad: t("okapi ahşap oyuncak"), simge: "🦓", not: t("Okapiyi andıran, çizgili bacaklı küçük ahşap oyuncak.") },
    sahne: [
      { k: "anlatici", m: t("Kongo DC’de Kongo Nehri pirogları suyun üstünde usulca süzülüyordu.") },
      { k: "gezgin", m: t("Okapi ormanının gölgesinde haritanın silik kıvrımlarını düzeltiyorum.") },
      { k: "arkadas", m: t("Pirogaya binersek kürek sırası bende; sen sadece manzaraya bak.") },
    ],
  },
  AO: { // 15. Angola
    hatira: { ad: t("kissanje"), simge: "🎵", not: t("Tahta bir kutuya dizilmiş ince metal dilleri başparmakla çalınan küçük Angola çalgısı.") },
    sahne: [
      { k: "anlatici", m: t("Angola’da Kalandula Şelalesi’nin serpintisi havayı serinletiyordu.") },
      { k: "gezgin", m: t("Welwitschia bitkisinin sabrına bakıp haritanın soluk çizgilerine gülümsüyorum.") },
      { k: "arkadas", m: t("Şelale serpintisi bana duş gibi geldi; havlu getiren var mı? Bir de şu tıngırdayan ses nereden geliyor?") },
    ],
  },
  ZA: { // 16. Güney Afrika
    hatira: { ad: t("penguen boncuk anahtarlık"), simge: "🐧", not: t("Afrika penguenini andıran, renkli boncuklardan yapılmış küçük anahtarlık.") },
    sahne: [
      { k: "anlatici", m: t("Güney Afrika’da Masa Dağı’nın üstünde ince bir bulut şapkası vardı.") },
      { k: "gezgin", m: t("Afrika penguenlerini izlerken haritanın rüzgârda kıvrılan kenarını tutuyorum.") },
      { k: "arkadas", m: t("Penguenler gibi yürümeyi denesek mi? Ben önden giderim, sen taklit et.") },
    ],
  },
  MZ: { // 17. Mozambik
    hatira: { ad: t("dau yelkenli oyuncak"), simge: "⛵", not: t("Dau yelkenlisini andıran, suda yüzen küçük ahşap oyuncak.") },
    sahne: [
      { k: "anlatici", m: t("Mozambik’te dau yelkenlileri kıyıda rüzgârı sabırla bekliyordu.") },
      { k: "gezgin", m: t("Kaju ağaçlarının gölgesinde haritanın silik yerlerini not defterime çiziyorum.") },
      { k: "arkadas", m: t("Yelken açmadan önce kaju molası verelim; sen de fıstık kadar enerjik görünüyorsun.") },
    ],
  },
  MG: { // 18. Madagaskar
    hatira: { ad: t("rafya mini çanta"), simge: "👜", not: t("Rafya liflerinden örülen, minik omuz çantası.") },
    sahne: [
      { k: "anlatici", m: t("Baobab Caddesi'nde gün batımı, ağaçları dev şamdan gibi kızıla boyuyor.") },
      { k: "gezgin", m: t("Haritadaki silik çizgi bu caddeye benziyor; lemurların arasında bir ipucu saklı olabilir.") },
      { k: "arkadas", m: t("Rafya liflerinden örülmüş küçük bir şey görürsem şaşırmam; önce ağaçların altında yürüyelim.") },
    ],
  },
  TZ: { // 19. Tanzanya
    hatira: { ad: t("tingatinga minyatür tablo"), simge: "🖼️", not: t("Parlak boyalarla yapılan, hayvan figürlü küçük tingatinga tablo.") },
    sahne: [
      { k: "anlatici", m: t("Kilimanjaro'nun karlı tepesi, sabah ışığında bulutların üstünde parlıyor.") },
      { k: "gezgin", m: t("Zanzibar'ın oyma kapılarındaki desenler, haritadaki kıvrımlara benziyor; yavaşça bakalım.") },
      { k: "arkadas", m: t("Tingatinga renkleri gibi parlak bir ipucu arıyorum; sen de kapı oymalarına bayılacaksın.") },
    ],
  },
  UG: { // 20. Uganda
    hatira: { ad: t("dağ gorili ahşap maskot"), simge: "🦍", not: t("Dağ gorilini andıran, yumuşak ahşaptan oyulmuş küçük maskot.") },
    sahne: [
      { k: "anlatici", m: t("Murchison Şelalesi'nin serpintisi, güneşte küçük bir gökkuşağına dönüşüyor.") },
      { k: "gezgin", m: t("Dağ gorillerini uzaktan izlerken sessiz kalalım; haritanın izi bu yeşil vadide olabilir.") },
      { k: "arkadas", m: t("Ahşap bir maskot gibi sevimli bir iz arıyorum; ama önce şu gökkuşağının altında mola.") },
    ],
  },
  KE: { // 21. Kenya
    hatira: { ad: t("kisii sabun taşı heykelcik"), simge: "🪨", not: t("Yumuşak sabun taşından oyulup cilalanan küçük hayvan heykelciği.") },
    sahne: [
      { k: "anlatici", m: t("Akasyaların arasında zürafalar, uzun boyunlarıyla yaprakları nazikçe topluyor.") },
      { k: "gezgin", m: t("Flamingolu gölün pembesi haritaya renk katmış gibi; ipucu için kıyıya doğru yürüyelim.") },
      { k: "arkadas", m: t("Sabun taşından minik bir heykelcik görürsem çantama koyarım; sen yine fotoğraf çekersin.") },
    ],
  },
  ET: { // 22. Etiyopya
    hatira: { ad: t("jebena kahve demliği"), simge: "☕", not: t("Yuvarlak gövdeli, ince boyunlu kil demlik; Etiyopya kahve töreninde kahve bunda demlenir.") },
    sahne: [
      { k: "anlatici", m: t("Gelada maymunları, çimenlerde oturup birbirlerinin tüylerini düzeltiyor.") },
      { k: "gezgin", m: t("Aksum'un dikili taşlarındaki oymalar, silik haritadaki bazı çizgileri hatırlatıyor.") },
      { k: "arkadas", m: t("Kahve kokusu peşimizde; belki yuvarlak bir demlik ipucudur, belki sadece güzel bir mola.") },
    ],
  },
  SD: { // 23. Sudan
    hatira: { ad: t("hurma yaprağı sepet"), simge: "🧺", not: t("Hurma yaprakları örülerek yapılan küçük, hafif sepet.") },
    sahne: [
      { k: "anlatici", m: t("Meroe piramitleri, çöl kumunda sıra sıra küçük dağlar gibi duruyor.") },
      { k: "gezgin", m: t("Deve pazarındaki renkli dokular arasında haritanın eksik parçasına dair bir iz olabilir.") },
      { k: "arkadas", m: t("Hurma yaprağından örülmüş bir sepet görürsem dayanamam; sen de bak, belki ipucu orada.") },
    ],
  },
  EG: { // 24. Mısır
    hatira: { ad: t("papirüs yer imi"), simge: "📜", not: t("Papirüs bitkisinden yapılan, üzerine desen çizilmiş küçük yer imi.") },
    sahne: [
      { k: "anlatici", m: t("Nil'de feluka yelkenlileri, akşam ışığında suya beyaz izler bırakıyor.") },
      { k: "gezgin", m: t("Gize'nin taşları ne kadar büyükse haritanın sırrı da o kadar küçük; dikkatle bakalım.") },
      { k: "arkadas", m: t("Papirüs gibi ince bir ipucu arıyorum; yelkenlinin gölgesinde dinlenmek de cabası.") },
    ],
  },
  YE: { // 25. Yemen
    hatira: { ad: t("renkli cam süs"), simge: "🪟", not: t("Renkli cam parçalarından yapılan, ışıkta parlayan küçük süs.") },
    sahne: [
      { k: "anlatici", m: t("Sana'a'nın kule evleri, üst üste dizilmiş renkli kutular gibi göğe uzanıyor.") },
      { k: "gezgin", m: t("Sokotra'nın ejder kanı ağaçları uzaktan şemsiyeye benziyor; haritada böyle bir dal olabilir.") },
      { k: "arkadas", m: t("Renkli cam süsler gibi parlak bir iz arıyorum; sen yine her kapıyı ayrı incelersin.") },
    ],
  },
  SA: { // 26. Suudi Arabistan
    hatira: { ad: t("hurma çekirdeği bileklik"), simge: "🌴", not: t("Hurma çekirdekleri boyanıp ipe dizilerek yapılan küçük bileklik.") },
    sahne: [
      { k: "anlatici", m: t("Hurma bahçesinde rüzgâr, palmiye yapraklarını yavaşça fısıldatıyor.") },
      { k: "gezgin", m: t("AlUla'daki Fil Kayası'nın kıvrımları, haritanın silik çizgileriyle konuşuyor sanki.") },
      { k: "arkadas", m: t("Hurma çekirdeğinden bir bileklik görürsem sevinirim; ama önce şu gölgede su molası.") },
    ],
  },
  PS: { // 27. Filistin
    hatira: { ad: t("zeytin ağacı oyma süs"), simge: "🫒", not: t("Zeytin ağacının budanan dallarından oyulup cilalanan, avuca sığan küçük süs.") },
    sahne: [
      { k: "anlatici", m: t("Hayat Ağacı mozaiği, taş parçalarıyla dallarını sabırla örüyor.") },
      { k: "gezgin", m: t("Zeytin bahçesinde yaprakların arasında bir iz ararken adımlarımızı yavaşlatalım.") },
      { k: "arkadas", m: t("Zeytin ağacından oyulmuş küçük bir süs görürsem ilk ben haber veririm; gözlerim açık.") },
    ],
  },
  IQ: { // 28. Irak
    hatira: { ad: t("mudhif ahşap maket"), simge: "🏠", not: t("Kamış ev mudhifi andıran, minik ahşap maket.") },
    sahne: [
      { k: "anlatici", m: t("Şenaşil balkonlar, ahşap oymalarıyla sokağa gölgeli bir gülümseme bırakıyor.") },
      { k: "gezgin", m: t("Kamış mudhif evlerinin serin gölgesinde haritanın eksik kıvrımını düşünelim.") },
      { k: "arkadas", m: t("Ahşap maket gibi minik bir iz arıyorum; sen de oymalardaki desenleri saymaya başlarsın.") },
    ],
  },
  IR: { // 29. İran
    hatira: { ad: t("mina işi tabak"), simge: "🍽️", not: t("Mina işiyle renklendirilmiş, küçük desenli tabak.") },
    sahne: [
      { k: "anlatici", m: t("Siose Pol köprüsü, akşam ışığında suya otuz üç kemer çiziyor.") },
      { k: "gezgin", m: t("Yezd'in rüzgâr kuleleri serinlik fısıldıyor; haritadaki çizgi bu kemerlerden geçiyor olabilir.") },
      { k: "arkadas", m: t("Mina işi bir tabak gibi parlak bir ipucu arıyorum; ama önce köprüde mola verelim.") },
    ],
  },
  UZ: { // 30. Özbekistan
    hatira: { ad: t("doira"), simge: "🥁", not: t("Kenarına küçük metal halkalar takılmış, parmaklarla çalınan Özbek çember defi.") },
    sahne: [
      { k: "anlatici", m: t("Kavun pazarında tatlı kokular, tezgâhların arasında dolaşıyor.") },
      { k: "gezgin", m: t("İpek Yolu'nun eski kervan izleri, haritadaki soluk çizgilerle aynı yöne bakıyor.") },
      { k: "arkadas", m: t("Pazarda bir def sesi duyarsam peşinden giderim; sen yine kavunun tadına bakmadan geçmezsin.") },
    ],
  },
  AF: { // 31. Afganistan
    hatira: { ad: t("uçurtma ahşap süs"), simge: "🪁", not: t("Uçurtma biçiminde boyanmış, hafif ahşap süs.") },
    sahne: [
      { k: "anlatici", m: t("Uçurtmalı tepede renkli uçurtmalar, gökyüzünde dans ediyor.") },
      { k: "gezgin", m: t("Nar bahçesinin kırmızısı haritaya renk katmış gibi; ipucu için tepeye doğru bakalım.") },
      { k: "arkadas", m: t("Ahşap bir uçurtma süsü gibi hafif bir iz arıyorum; rüzgâr bize yardım eder belki.") },
    ],
  },
  PK: { // 32. Pakistan
    hatira: { ad: t("süslü kamyon ahşap kutu"), simge: "🚚", not: t("Süslü kamyonları anlatan, renkli boyalı küçük ahşap kutu.") },
    sahne: [
      { k: "anlatici", m: t("Hunza'nın kayısı bahçeleri, baharın ilk ışığında pembe bir örtüye bürünüyor.") },
      { k: "gezgin", m: t("Süslü kamyonların desenleri haritadaki renkli kıvrımlara benziyor; dikkatle bakalım.") },
      { k: "arkadas", m: t("Ahşap bir kutu gibi sürprizli bir ipucu arıyorum; sen de kayısı kokusuna kapılma.") },
    ],
  },
  IN: { // 33. Hindistan
    hatira: { ad: t("tavus kuşu ahşap oyuncak"), simge: "🦚", not: t("Tavus kuşunu andıran, el boyaması küçük ahşap oyuncak.") },
    sahne: [
      { k: "anlatici", m: t("Hawa Mahal'in pembe cephesi, rüzgârla konuşan yüzlerce penceresiyle gülümsüyor.") },
      { k: "gezgin", m: t("Lotus göletinde tavus kuşları dolaşıyor; haritanın izi bu renklerin arasında olabilir.") },
      { k: "arkadas", m: t("Tavus kuşu gibi rengârenk bir ahşap oyuncak görürsem sevinirim; sen yine pencereleri sayarsın.") },
    ],
  },
  BD: { // 34. Bangladeş
    hatira: { ad: t("rikşa ahşap oyuncak"), simge: "🛺", not: t("Süslü rikşayı andıran, renkli boyalı küçük ahşap oyuncak.") },
    sahne: [
      { k: "anlatici", m: t("Süslü rikşalar, sokaklarda rengârenk çiçekler gibi süzülüyor.") },
      { k: "gezgin", m: t("Sundarbans'ın yeşil labirenti haritada soluk bir çizgi gibi; ipucu için sakin sakin bakalım.") },
      { k: "arkadas", m: t("Rikşa gibi minik bir ahşap oyuncak görürsem çantama koyarım; sen de sürücülere el salla.") },
    ],
  },
  MM: { // 35. Myanmar
    hatira: { ad: t("Bagan lak kutusu"), simge: "🎁", not: t("Lak ile kaplanmış, küçük oymalı kapaklı kutu.") },
    sahne: [
      { k: "anlatici", m: t("Inle Gölü'nde balıkçılar kürek çekerken gölün üstünde sabah sisi dans ediyor.") },
      { k: "gezgin", m: t("Sisin içinde kürek sesleri var; haritadaki silik iz beni buraya kadar getirdi.") },
      { k: "arkadas", m: t("Balıkçıların tek ayakla kürek çekişi tam bir denge gösterisi; ben düşmeden bakayım.") },
    ],
  },
  TH: { // 36. Tayland
    hatira: { ad: t("tuk-tuk ahşap oyuncak"), simge: "🛺", not: t("Tuk-tuku andıran, tekerlekleri dönen küçük ahşap oyuncak.") },
    sahne: [
      { k: "anlatici", m: t("Yüzen pazarda meyve tabakları sallarla süzülüyor, nehir gülümsüyor.") },
      { k: "gezgin", m: t("Salların arasında koku ve renk cümbüşü var; hangi tezgâha önce bakacağımı şaşırdım.") },
      { k: "arkadas", m: t("Tuk-tuk sesiyle ritim tutuyorum; sen hâlâ haritaya bakıyorsan yürüyen pazara yetiş!") },
    ],
  },
  MY: { // 37. Malezya
    hatira: { ad: t("batik kitap ayracı"), simge: "🔖", not: t("Batik desenli kumaştan yapılmış, küçük kitap ayracı.") },
    sahne: [
      { k: "anlatici", m: t("Petronas İkiz Kuleleri akşam ışıklarıyla gökyüzüne iki gümüş sütun çiziyor.") },
      { k: "gezgin", m: t("Kulelerin ışığı nehirde titreşiyor; silik çizgilerin peşinde şehri adım adım geziyorum.") },
      { k: "arkadas", m: t("Batik tezgâhında desen seçmek zor; sen karar verirken ben çayı fazla kaçırmayayım.") },
    ],
  },
  ID: { // 38. Endonezya
    hatira: { ad: t("küçük angklung"), simge: "🎶", not: t("Bambu boruları sallanınca ses çıkaran küçük angklung çalgısı.") },
    sahne: [
      { k: "anlatici", m: t("Pirinç terasları yeşil basamaklar gibi tepelerden aşağı süzülüyor.") },
      { k: "gezgin", m: t("Terasların arasında yürürken ayaklarım yorgun, gözlerim yeşile doymuyor.") },
      { k: "arkadas", m: t("Komodo ejderi uzaktan bile temkinli bakıyor; biz de sakin sakin selam verelim.") },
    ],
  },
  PH: { // 39. Filipinler
    hatira: { ad: t("capiz rüzgâr çanı"), simge: "🎐", not: t("Capiz deniz kabuğundan yapılan, hafifçe tingırdayan küçük rüzgâr çanı.") },
    sahne: [
      { k: "anlatici", m: t("Çikolata Tepeleri kahverengi yuvarlaklar halinde ufka dizilmiş.") },
      { k: "gezgin", m: t("Jeepney rengârenk geçerken tepelerin yuvarlaklığı gülümsetiyor; yorgunluğum azalıyor.") },
      { k: "arkadas", m: t("Rüzgâr çanı gibi tingırdamak istiyorum; sen de tempoya katıl, yoksa yaya kalırsın!") },
    ],
  },
  VN: { // 40. Vietnam
    hatira: { ad: t("nón lá şapkası"), simge: "👒", not: t("Palmiye yaprağından yapılan, minik nón lá şapkası.") },
    sahne: [
      { k: "anlatici", m: t("Ha Long Körfezi'nde kireçtaşı adaları yeşil suların üstünde yüzüyor.") },
      { k: "gezgin", m: t("Kayıkların arasında süzülürken suyun yeşili insanı sakinleştiriyor; iz sürerken acele yok.") },
      { k: "arkadas", m: t("Hoi An fenerleri yanınca sokak masal gibi oluyor; sen haritayı bırakıp renklere bak!") },
    ],
  },
  CN: { // 41. Çin
    hatira: { ad: t("kâğıt kesme süsü"), simge: "✂️", not: t("Kırmızı kâğıttan makasla kesilen, küçük desenli süs.") },
    sahne: [
      { k: "anlatici", m: t("Bambu ormanında pandalar tembel tembel yaprak çiğniyor.") },
      { k: "gezgin", m: t("Bambu yaprakları rüzgârda fısıldıyor; kâğıt kesme desenlerini tezgâhlarda seziyorum.") },
      { k: "arkadas", m: t("Panda kadar rahatım, itiraf ediyorum; sen hâlâ ipucu peşindeysen ben gölgede beklerim.") },
    ],
  },
  KR: { // 42. Güney Kore
    hatira: { ad: t("hanji kâğıt yelpaze"), simge: "🪭", not: t("Hanji kâğıdından yapılan, katlanır küçük yelpaze.") },
    sahne: [
      { k: "anlatici", m: t("Hanok evlerinin kıvrık çatıları sabah ışığında yumuşacık görünüyor.") },
      { k: "gezgin", m: t("Dar sokaklarda çatı çizgileri gökyüzüne gülümsüyor; yorgun ayaklarım burada dinleniyor.") },
      { k: "arkadas", m: t("Kimçi küplerinin yanında burnum sızlanıyor; sen haritaya bakadur, ben menüye bakayım.") },
    ],
  },
  JP: { // 43. Japonya
    hatira: { ad: t("origami turna"), simge: "🦢", not: t("Kâğıt katlanarak yapılan, küçük origami turna.") },
    sahne: [
      { k: "anlatici", m: t("Kiraz ağaçları pembe kar gibi yolların üstüne yaprak bırakıyor.") },
      { k: "gezgin", m: t("Fuji Dağı uzaktan sakin duruyor; pembe yaprakların arasında ipucu ararken içim huzurla doluyor.") },
      { k: "arkadas", m: t("Origami turna katlamayı denedim, kanadı biraz eğri oldu; sen de dene, belki düzelir!") },
    ],
  },
  RU: { // 44. Rusya
    hatira: { ad: t("hohloma boyalı kaşık"), simge: "🥄", not: t("Hohloma desenleriyle boyanmış, küçük ahşap kaşık.") },
    sahne: [
      { k: "anlatici", m: t("Matruşka bebekleri tezgâhlarda iç içe gülümsüyor.") },
      { k: "gezgin", m: t("Oymalı ahşap evlerin sıcak dokusu soğuğu unutturuyor; desenlerde saklı izi düşünüyorum.") },
      { k: "arkadas", m: t("Hohloma kaşıklarla ritim tutmak eğlenceli; sen de tempo tut, yoksa şarkı yarım kalır!") },
    ],
  },
  CA: { // 45. Kanada
    hatira: { ad: t("huş kabuğu sepet"), simge: "🧺", not: t("Huş kabuğundan yapılan, hafif ve küçük sepet.") },
    sahne: [
      { k: "anlatici", m: t("Akçaağaç ormanı turuncu ve sarı yapraklarla ışıl ışıl.") },
      { k: "gezgin", m: t("Yaprakların hışırtısı yolu yumuşatıyor; şurup kokusu ve renkler merakımı artırıyor.") },
      { k: "arkadas", m: t("Kunduz barajına bakıp iş planı çıkarıyorum; sen haritayı katla, ben yolu düzleyeyim!") },
    ],
  },
  US: { // 46. ABD
    hatira: { ad: t("patchwork yorgan parçası"), simge: "🧵", not: t("Renkli kumaş parçalarından dikilen, küçük patchwork yorgan parçası.") },
    sahne: [
      { k: "anlatici", m: t("Büyük Kanyon'un kızıl katmanları gün batımında ateş gibi parıldıyor.") },
      { k: "gezgin", m: t("Kanyonun derinliği başımı döndürüyor; renkli katmanlar arasında iz ararken adımlarım yavaşlıyor.") },
      { k: "arkadas", m: t("Patchwork gibi renk renk bir yol; sen parçaları birleştirmeye çalışırken ben manzaraya dalayım.") },
    ],
  },
  MX: { // 47. Meksika
    hatira: { ad: t("talavera seramik kâse"), simge: "🥣", not: t("Talavera desenleriyle boyanmış, küçük seramik kâse.") },
    sahne: [
      { k: "anlatici", m: t("Papel picado süsleri pazarda rüzgârda renkli kâğıtlar gibi dans ediyor.") },
      { k: "gezgin", m: t("Pazarın neşesi insanı sarıyor; ajolote göletine doğru yürürken merakım kıpır kıpır.") },
      { k: "arkadas", m: t("Talavera desenleri göz alıcı; sen hangi kâseyi beğeneceğine karar ver, ben kokuları takip edeyim.") },
    ],
  },
  CO: { // 48. Kolombiya
    hatira: { ad: t("vueltiao hasır şapka"), simge: "👒", not: t("Caña flecha liflerinden örülen, küçük vueltiao şapka.") },
    sahne: [
      { k: "anlatici", m: t("Kokora mum palmiyeleri ince gövdeleriyle gökyüzünü selamlıyor.") },
      { k: "gezgin", m: t("Palmiyelerin uzun gölgeleri yolu süslüyor; Cartagena'nın renkli balkonları beni çağırıyor.") },
      { k: "arkadas", m: t("Vueltiao şapka denemek istiyorum; sen haritayı güneşten koru, ben gölgeyi ayarlarım!") },
    ],
  },
  PE: { // 49. Peru
    hatira: { ad: t("And dokuma bileklik"), simge: "🧶", not: t("And desenleriyle dokunmuş, renkli küçük bileklik.") },
    sahne: [
      { k: "anlatici", m: t("Machu Picchu'nun taş terasları bulutların arasında basamak basamak uzanıyor.") },
      { k: "gezgin", m: t("Bulutlar taşların arasından süzülüyor; lamalar sakince otlarken dokuma desenlerini düşünüyorum.") },
      { k: "arkadas", m: t("Yükseklik beni biraz yavaşlattı; sen ipucu peşinde koşarken ben nefesimi düzenleyeyim.") },
    ],
  },
  BR: { // 50. Brezilya
    hatira: { ad: t("bilboquê oyuncağı"), simge: "🪀", not: t("İpe bağlı topu yakalamaya çalışılan, küçük bilboquê oyuncağı.") },
    sahne: [
      { k: "anlatici", m: t("Amazon'da tukanlar ve aralar renkli tüyleriyle dallar arasında süzülüyor.") },
      { k: "gezgin", m: t("Renkli tüyler ve nehir sesi iç içe; Şeker Somunu'na doğru yolu düşünürken içim kıpır kıpır.") },
      { k: "arkadas", m: t("Bilboquê oyuncağını sallamak kol işi; sen de dene, topa değil kendine güven!") },
    ],
  },
  AR: { // 51. Arjantin
    hatira: { ad: t("mate bardağı"), simge: "🧉", not: t("Yerba mate içmeye yarayan, küçük oymalı mate bardağı.") },
    sahne: [
      { k: "anlatici", m: t("Buzul mavi kuleler halinde gölün üstünde parlıyor.") },
      { k: "gezgin", m: t("Buzun mavisi göz kamaştırıyor; dünyanın ucundaki fenerin ışığını hayal ederken içim heyecanla doluyor.") },
      { k: "arkadas", m: t("Caminito'nun renkli evleri gibi biz de yan yana parlayalım; mate bardağına sıra gelince paylaşırız.") },
    ],
  },
};

const HIKAYE_BILMECE = [
  {
    soru: t("Bir teknenin içinde renkler yüzer;\nİnce çubukla şekil alır;\nKuruyunca hatıra olur."),
    secenek: [t("ebru kâğıdı"), t("Petrykivka boyalı ahşap kaşık"), t("Wawel ejderi ahşap oyuncak")],
    dogru: 0,
    bolum: [t("Haritanın ilk parçası canlanınca küçük bir resim belirdi."), t("Resimde ellerinde sönmüş fenerler tutan hayaletler vardı."), t("Anladık ki onlar kötü değil, sadece yolunu kaybetmiş.")],
  },
  {
    soru: t("Kızgın bir ocakta yumuşar, biçim alırım;\nİpe dizilince boyna takılırım;\nIşıkta göz kırparım."),
    secenek: [t("lavanta sabunu"), t("Murano cam boncuğu"), t("flamenko yelpazesi")],
    dogru: 1,
    bolum: [t("Harita eski bir hikâye fısıldadı."), t("Dünyanın ucundaki bir deniz feneri, gece kaybolan ruhlara evlerinin yolunu gösterirmiş."), t("Bu hikâye, yolculuğumuzun neden bu kadar önemli olduğunu anlattı.")],
  },
  {
    soru: t("Avucumda gövde taşırım;\nParmaklar dokununca dillenirim;\nHer dokunuşta başka tonda şakırım."),
    secenek: [t("kakao çekirdeği kolye ucu"), t("kente kumaş parçası"), t("konuşan davul minyatürü")],
    dogru: 2,
    bolum: [t("Bir gece büyük bir fırtına o feneri söndürmüş."), t("O günden beri hayaletler yollarını şaşırıyormuş."), t("Demek ki ışığı yeniden yakmak için bir sebebimiz daha vardı.")],
  },
  {
    soru: t("Yuvarlak bir gövdem, bez bir kanadım var;\nKüvette, gölde salınırım;\nÜfleyince rüzgârım olursun, yola çıkarım."),
    secenek: [t("penguen boncuk anahtarlık"), t("dau yelkenli oyuncak"), t("rafya mini çanta")],
    dogru: 1,
    bolum: [t("Her ülkenin hatırasında küçük bir dostluk kıvılcımı saklıymış."), t("Hatıraları topladıkça haritanın renkleri canlanmaya başladı."), t("Her yeni hatıra, haritaya sıcak bir nefes gibi yayıldı.")],
  },
  {
    soru: t("Karnım tombul, üstüm dar;\nOcağın üstünde sabırla beklerim;\nSüzülünce fincana dostluk taşırım."),
    secenek: [t("kisii sabun taşı heykelcik"), t("jebena kahve demliği"), t("hurma yaprağı sepet")],
    dogru: 1,
    bolum: [t("Harita, feneri tek bir kahramanın yakamayacağını söyledi."), t("Farklı yerlerden gelen dostların birlikte olması gerekiyormuş."), t("Birbirimize bakıp gülümsedik; bu iş ancak birlikte olurdu.")],
  },
  {
    soru: t("Yuvarlak gövdemin kenarında ziller;\nAvucum ritim tutunca şıngırdarım;\nElde döner, şarkıya eşlik ederim."),
    secenek: [t("hurma çekirdeği bileklik"), t("zeytin ağacı oyma süs"), t("doira")],
    dogru: 2,
    bolum: [t("Bir hayalet çekinerek yanımıza yaklaştı."), t("Yol sorar gibi haritayı gösterdi."), t("Ona eşlik etmeye söz verdik; artık yalnız değildi.")],
  },
  {
    soru: t("Gökte süzülen bir kuş gibi görünürüm;\nİnce bir bağ beni elde tutar;\nKuyruğum dans eder, rüzgârla oynarım."),
    secenek: [t("uçurtma ahşap süs"), t("süslü kamyon ahşap kutu"), t("Bagan lak kutusu")],
    dogru: 0,
    bolum: [t("Haritada denizlerin ötesine uzanan altın bir rota belirdi."), t("Fenerin dünyanın en güney ucunda olduğunu anladık."), t("Rota parladıkça içimizde tatlı bir heyecan dalgalandı.")],
  },
  {
    soru: t("Yan yana duran oyuk çubuklarım;\nBir el hareketiyle birbirine değer;\nTatlı bir ezgiyle salınırım."),
    secenek: [t("tuk-tuk ahşap oyuncak"), t("batik kitap ayracı"), t("küçük angklung")],
    dogru: 2,
    bolum: [t("Kıvılcımlar haritanın ortasında bir halka oluşturdu."), t("Halkanın içinde bir satır belirdi: feneri yakmak için herkes aynı anda elini koymalı."), t("Bu söz, dostluğun ne kadar ortak bir iş olduğunu bir kez daha gösterdi.")],
  },
  {
    soru: t("Sıcak bir günde kanat gibi açılırım;\nYüzüme serinlik yollarım;\nElimde toplanıp sessizce beklerim."),
    secenek: [t("kâğıt kesme süsü"), t("hanji kâğıt yelpaze"), t("origami turna")],
    dogru: 1,
    bolum: [t("Yolun sonunda biraz yorulduk, ama şakalaşmayı da bırakmadık."), t("Birbirimize yolculukta en çok neyi sevdiğimizi anlattık."), t("Gülüşlerimiz, yorgunluğumuzu dostça bir esintiye çevirdi.")],
  },
  {
    soru: t("Bir sapım var, ipimin ucunda bir top;\nSallarsın, top havada döner;\nSapıma oturtursan alkışı hak edersin."),
    secenek: [t("vueltiao hasır şapka"), t("And dokuma bileklik"), t("bilboquê oyuncağı")],
    dogru: 2,
    bolum: [t("Harita tamamlandı ve son satır parladı: 'Arjantin'de, dünyanın ucunda buluşalım.'"), t("Hayaletler de uzaktan peşimize takıldı."), t("Son parça yerine oturunca hepimiz aynı anda 'hazırız' dedik.")],
  },
];

const HIKAYE_FINAL = [
  { k: "anlatici", m: t("Fenere vardık; rüzgâr pelerinlerimizi şakacı bir selam gibi savurdu.") },
  { k: "gezgin", m: t("Hadi, hep birlikte kapıya elimizi koyalım.") },
  { k: "arkadas", m: t("Söz verdiğimiz gibi; ne bir eksik ne bir fazla.") },
  { k: "anlatici", m: t("Kıvılcımlar birleşti, fener yandı; ışık denizde altın bir yol açtı.") },
  { k: "gezgin", m: t("Hayaletler teşekkür edip evlerine süzüldü; iyi ki yanımdaydın arkadaşım.") },
  { k: "anlatici", m: t("Dostluk Feneri yandı; dünyayı güzelleştiren, birlikte yürüyen dostluktu.") },
];
