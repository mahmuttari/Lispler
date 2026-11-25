/* ============================================================
   HAYALET AVCILARI — DÜNYA TURU HİKÂYESİ: METİNLER (3.21.0)
   Yazar: gemini. Kaynak: hikaye-taslaklari/gemini/ (araclar/hikaye_derle.py üretir; elle düzenleme).
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
    { k: "katilan", m: t("Vızz! Az kalsın geçip gidiyordum; bisikletimle ilk hayaleti yakaladığımdan bu yana hiç durmadım.") },
    { k: "gezgin", m: t("Bu enerji haritada yeni yollar açar; hızlı adımlarını bizim dünya yolculuğumuza katar mısın?") },
    { k: "katilan", m: t("Enerji tabancam dolu, ayakkabılarım sıkı bağlı! En önde koşacak biri lazımsa ben varım.") },
    { k: "gezgin", m: t("Harika, ama bazen soluklanıp çevredeki güzelliklere bakmak için frene de basacağız!") },
  ],
  veryi: [
    { k: "katilan", m: t("Kusura bakma, biraz ağır gelirim; dedemin demirci dükkânından kalma koca çekicim hafif sayılmaz.") },
    { k: "gezgin", m: t("Acelemiz yok, sağlam bir dost yeter; kayıp ruhlara yol aradığımız bu tura eşlik eder misin?") },
    { k: "katilan", m: t("Tek elimle çekici savururum, öbür elimle de sana destek olurum. Yükün yarısı artık bende!") },
    { k: "gezgin", m: t("Böyle güçlü bir omuzla hiçbir yol uzun görünmez, haydi yola koyulalım.") },
  ],
  kornet: [
    { k: "katilan", m: t("Kabarık mor tüylerime şaşırma; kristal asamla en uzaktaki utangaç hayaletleri bile seçebilirim.") },
    { k: "gezgin", m: t("Gözlerimizden kaçan ipuçları hep oluyor; sihri iyilik için kullanan bir rehber olarak bize katılsana.") },
    { k: "katilan", m: t("Yüzümü pek kimse görmez ama kalbim açıktır. Işığı arayan bu kervana memnuniyetle girerim.") },
    { k: "gezgin", m: t("Mor tüylerin arasında parlayan bu dostluk bile yolumuzu şimdiden aydınlattı.") },
  ],
  mark: [
    { k: "katilan", m: t("Dur bir saniye! Sırt çantamda pusula, harita ve bolca atıştırmalık var; burada gizli bir hazine mi var?") },
    { k: "gezgin", m: t("Altından bile değerli hatıralar topluyoruz; gel, çantanı da merakını da alıp maceraya ortak ol.") },
    { k: "katilan", m: t("Kompakt arbaletim hazır, parıldayan her ipucunu senden önce ben kaparım! Anlaştık, gidiyoruz!") },
    { k: "gezgin", m: t("Önce atıştırmalıkları paylaşacağımıza söz ver, gerisi kolay!") },
  ],
  kent: [
    { k: "katilan", m: t("Kırmızı gözlerimden ürkme. Hayaletlerin dünyasında kaybolup dönebilen tek kişi benim; onları anlarım.") },
    { k: "gezgin", m: t("Onları eve kavuşturmak için senden iyi yol arkadaşı olamaz; bu yolculukta yanımızda yürür müsün?") },
    { k: "katilan", m: t("Yalnız kalmanın ne demek olduğunu iyi bilirim. Kapüşonumun gölgesi artık dostlar için nöbette.") },
    { k: "gezgin", m: t("Artık kimse gölgelerde tek başına kalmayacak, hoş geldin aramıza.") },
  ],
  ponko: [
    { k: "katilan", m: t("Selam yolcu! Kocaman şapkamla küçük kasabalarda düzeni sağlarım, altın tetiğimse rüzgârdan hızlıdır.") },
    { k: "gezgin", m: t("Küçük kasabalar sana dar gelmeye başladıysa, gel bütün dünyayı birlikte dolaşalım!") },
    { k: "katilan", m: t("Şerif yıldızım parlıyor, kovboy tabancam hazır! Bu koca haritanın tozunu beraber kaldıralım.") },
    { k: "gezgin", m: t("Şapkanı sıkı tut o zaman, önümüzde epey rüzgârlı diyarlar var!") },
  ],
  gul: [
    { k: "katilan", m: t("Tahtta oturup beklemek bana göre değildi; tacımı düzeltip kraliyet yayımı omzuma astım.") },
    { k: "gezgin", m: t("İsabetli bir göze ve cesur bir yüreğe ihtiyacımız var; saray yerine bizimle yollara düşer misin?") },
    { k: "katilan", m: t("Oklarım hedefi şaşmaz, ama asıl amacım kayıp ruhlara neşe getirmek. Ekibe beni de yaz!") },
    { k: "gezgin", m: t("Böyle zarif bir okçuyla yolculuğumuz şimdiden masal gibi oldu.") },
  ],
  rani: [
    { k: "katilan", m: t("Boyuma aldanma, sapanım çok isabetlidir! Yorgun düşen olursa şifalı kalbimle hemen yetişirim.") },
    { k: "gezgin", m: t("Uzun yolda yaralarımızı saracak sıcak bir kalp arıyorduk; el ele verip bizimle gelir misin?") },
    { k: "katilan", m: t("Kimsenin umudunu kaybetmesine izin vermem. Çantamı kaptım bile, haydi hayaletlere ışık taşıyalım!") },
    { k: "gezgin", m: t("Sen yanımızdayken en dik yokuşlar bile bize düz yol gelir.") },
  ],
  beti: [
    { k: "katilan", m: t("Lolipop beremi beğendin mi? Şeker fabrikasından çıktım, sulara dalsam da neşem hiç ıslanmaz!") },
    { k: "gezgin", m: t("Şeker toplarınla bu yolculuğa tat katsana; dünyayı dolaşırken gülümsetecek bir arkadaşa ihtiyacımız var.") },
    { k: "katilan", m: t("Tatlı tatlı uğurlanan hayaletler bile kıkırdar! Beremi düzelttim, hemen peşine takılıyorum!") },
    { k: "gezgin", m: t("Göller, yağmurlar vız gelir artık; yolculuğun en keyifli dönemi şimdi başlıyor!") },
  ],
  fanatik: [
    { k: "katilan", m: t("Siyah kuşağımı dağlardaki ustamdan aldım; nunçakum dönerken hayaletler şaşkınlıktan alkış tutar.") },
    { k: "gezgin", m: t("Disiplinin ve hızın ekibimize güç katar; ustalığını bu dostluk yolculuğuyla birleştirir misin?") },
    { k: "katilan", m: t("Gerçek ustalık, başkalarına yardım edebilmektir. Derin bir nefes aldım, seninle yola hazırım.") },
    { k: "gezgin", m: t("Böyle dengeli ve güçlü bir dostla sırtımız asla yere gelmez.") },
  ],
  silsen: [
    { k: "katilan", m: t("Asamın ucundaki şu papatya hiç solmaz; bastığım her yere ılık bir bahar esintisi taşırım.") },
    { k: "gezgin", m: t("Solgun haritamızın tam da senin baharına ihtiyacı var; çiçekli ışığını yolumuza katmak ister misin?") },
    { k: "katilan", m: t("Çiçek toplarım dokunduğu her ruhu ışığa çevirir. Haydi gidelim, geçtiğimiz her yer çiçek açsın!") },
    { k: "gezgin", m: t("Hangi mevsimde olursak olalım, artık yanımızda hep bahar olacak.") },
  ],
  sercin: [
    { k: "katilan", m: t("Rüzgâr bana yakında büyük bir yolculuk başlayacağını fısıldadı; kuşlar da seni işaret etti!") },
    { k: "gezgin", m: t("Kuşların haberine kulak ver o zaman; kanat tüylerinle gökyüzünden bize rehberlik eder misin?") },
    { k: "katilan", m: t("En utangaç hayalet bile tüylerimden saklanamaz. Rüzgârla yarışa hazırım, haydi kanatlanalım!") },
    { k: "gezgin", m: t("Gökyüzü artık bizim müttefikimiz; rotamız hiç bu kadar berrak olmamıştı.") },
  ],
};

const HIKAYE_ULKE = {
  TR: { // 1. Türkiye
    hatira: { ad: t("Bakır Kahve Cezvesi"), simge: "☕", not: t("El yapımı uzun saplı küçük bakır kap; kısık ateşte bol köpüklü kahve pişirmek için kullanılır.") },
    sahne: [
      { k: "anlatici", m: t("Peri bacaları sabah ışığında parlıyor, rengârenk lale bahçelerinden serin bir esinti yükseliyor.") },
      { k: "gezgin", m: t("İstanbul'da eski bir sandıkta bulduğum şu silik Dostluk Haritası buradan başlıyor.") },
      { k: "gezgin", m: t("Kayıp hayaletlere evlerini göstermek için ilk adımı atıyorum; bakalım bu yol beni kimlerle tanıştıracak!") },
    ],
  },
  UA: { // 2. Ukrayna
    hatira: { ad: t("Ahşap Sopilka Flütü"), simge: "🎶", not: t("İnce ahşaptan oyulan, üzerindeki deliklere parmak basılarak neşeli halk ezgileri çalınan geleneksel flüt.") },
    sahne: [
      { k: "anlatici", m: t("Uçsuz bucaksız ayçiçeği tarlaları güneşe dönmüş, saman çatılı beyaz evler ufukta sıralanmış.") },
      { k: "gezgin", m: t("Sarı çiçekler başını güneşe çevirmiş; kayıp ruhlar da belki böyle sıcak bir ışık arıyordur.") },
    ],
  },
  PL: { // 3. Polonya
    hatira: { ad: t("Baltık Kehribar Taşı"), simge: "💎", not: t("Milyonlarca yıllık çam reçinesinin taşlaşmasıyla oluşan, güneş gibi parlayan sıcak sarı süs taşı.") },
    sahne: [
      { k: "anlatici", m: t("Wawel ejderi masallardan fırlamış gibi duruyor, çatıların tepesinde leylek yuvaları göze çarpıyor.") },
      { k: "arkadas", m: t("Leylekler bile yuvayı şaşırmıyor; demek biz de hayaletlere yollarını buldurabiliriz!") },
      { k: "gezgin", m: t("Yanımda bir dost olunca ejderha masalları bile iki kat eğlenceli geldi.") },
    ],
  },
  DE: { // 4. Almanya
    hatira: { ad: t("Düğümlü Tuzlu Brezel"), simge: "🍞", not: t("Düğüm biçiminde kıvrılıp iri tuz serpilerek fırınlanan, dışı çıtır içi yumuşak geleneksel çörek.") },
    sahne: [
      { k: "anlatici", m: t("Ahşap çatkılı evlerin arasından geçerken guguklu saat evinden neşeli bir 'guguk!' sesi duyuluyor.") },
      { k: "gezgin", m: t("Saat başı öten şu minik ahşap kuş, saklanan hayaletleri mutlaka yerinden sıçratıyordur.") },
      { k: "arkadas", m: t("Haklısın! Bir de taze fırın kokusu geliyor, aramaya çıkmadan karnım acıktı bile.") },
    ],
  },
  GB: { // 5. Birleşik Krallık
    hatira: { ad: t("Çiçekli Çay Kutusu"), simge: "🍵", not: t("Beş çayı geleneğinde kokulu yaprakları taze tutmak için kullanılan, çiçek desenli küçük metal kutu.") },
    sahne: [
      { k: "anlatici", m: t("Sisli sokaklarda kırmızı telefon kulübeleri parlıyor, görkemli saat kulesi ağır ağır çınlıyor.") },
      { k: "arkadas", m: t("Şu kırmızı kulübeden hayaletlerin evini arayıp adres sorsak keşke, işimiz hemen biterdi!") },
      { k: "gezgin", m: t("Keşke o kadar kolay olsa; ama önce haritanın sakladığı izi bulmamız gerek.") },
    ],
  },
  FR: { // 6. Fransa
    hatira: { ad: t("Tereyağlı Çıtır Kruvasan"), simge: "🥐", not: t("İncecik hamur katlarının tereyağıyla sarılıp hilal biçiminde fırınlanmasıyla yapılan mis kokulu çörek.") },
    sahne: [
      { k: "anlatici", m: t("Mor lavanta tarlalarının kokusu rüzgârla yayılıyor, ileride Eyfel Kulesi bulutlara uzanıyor.") },
      { k: "gezgin", m: t("Lavanta kokusunun içinde kaybolmak bile güzel ama hayaletler hâlâ evlerini özlüyor.") },
    ],
  },
  IT: { // 7. İtalya
    hatira: { ad: t("Venedik Karnaval Maskesi"), simge: "🎭", not: t("Kâğıt hamurundan elde biçimlendirilip parlak boyalar ve yaldızla süslenen geleneksel yüz maskesi.") },
    sahne: [
      { k: "anlatici", m: t("Kolezyum'un kemerleri gün batımında kızarıyor, gondollu kanal iskelesinden şarkılar yükseliyor.") },
      { k: "arkadas", m: t("Gondola atlayıp süzülsek hayaletler bizi şarkıcı sanıp yanımıza gelir mi dersin?") },
      { k: "gezgin", m: t("Sesin güzelse deneyelim, yoksa bütün gondolcular şaşırıp kürekleri bırakır!") },
    ],
  },
  ES: { // 8. İspanya
    hatira: { ad: t("Boyalı El Yelpazesi"), simge: "💃", not: t("Sıcak günlerde serinlemek için açılıp kapanan, ince ahşap çıtalı ve el boyamalı geleneksel yelpaze.") },
    sahne: [
      { k: "anlatici", m: t("La Mancha yel değirmenleri rüzgârla dönüyor, Elhamra'nın Aslanlı Çeşmesi serin sular fısıldıyor.") },
      { k: "gezgin", m: t("Şu koca kanatların dönüşü bile haritadaki eski çizgileri canlandıracak kadar coşkulu.") },
      { k: "arkadas", m: t("Yel değirmenlerini dev sanmayalım da, gözümüzü sevimli hayaletlerden ayırmayalım!") },
    ],
  },
  MA: { // 9. Fas
    hatira: { ad: t("Deri Babuş Terliği"), simge: "👞", not: t("Yumuşak deriden elde dikilen, ucu hafif sivri ve çarşı yürüyüşlerinde çok rahat giyilen geleneksel terlik.") },
    sahne: [
      { k: "anlatici", m: t("Şefşavan'ın mavi sokakları gökyüzünü yere indirmiş, fenerli çarşı tezgâhları ışık saçıyor.") },
      { k: "arkadas", m: t("Duvarlar o kadar mavi ki hayaletler burada gökyüzündeymiş gibi hissedip şaşırıyordur!") },
    ],
  },
  DZ: { // 10. Cezayir
    hatira: { ad: t("Kristal Kum Çiçeği"), simge: "🌹", not: t("Çöl kumları ile tuzlu suların yüzyıllar içinde taç yaprak biçiminde oluşturduğu doğal mineral kümesi.") },
    sahne: [
      { k: "anlatici", m: t("Altın renkli Sahra kumulları dalga dalga uzanıyor, Tassili n'Ajjer kaya kemerleri gölge sunuyor.") },
      { k: "gezgin", m: t("Kumlar rüzgârla her saat şekil değiştiriyor ama kaya kemerleri binlerce yıldır yerini koruyor.") },
      { k: "arkadas", m: t("Ayakkabılarıma şimdiden yarım çöl doldu, ama manzara her adıma fazlasıyla değer!") },
    ],
  },
  CI: { // 11. Fildişi Sahili
    hatira: { ad: t("Boncuklu Kabak Çıngırağı"), simge: "🎊", not: t("Kurutulmuş su kabağının üstüne renkli boncuk ağı geçirilerek yapılan, sallandıkça ritim tutan çalgı.") },
    sahne: [
      { k: "anlatici", m: t("Yeşil kakao bahçelerinden tatlı bir koku geliyor, uzak açıklıkta bir fil ailesi ağır ağır yürüyor.") },
      { k: "arkadas", m: t("Fil ailesine baksana, kimse geride kalmıyor! Tıpkı bizim büyüyen dostluk ekibimiz gibi.") },
      { k: "gezgin", m: t("Bu manzara bana haritanın neden tek başımıza çözülemeyeceğini bir kez daha hatırlattı.") },
    ],
  },
  GH: { // 12. Gana
    hatira: { ad: t("Oware Oyun Taşları"), simge: "🎲", not: t("Oyulmuş tahta çukurlarda iki kişiyle oynanan geleneksel zekâ oyununun pürüzsüz tohum taşları.") },
    sahne: [
      { k: "anlatici", m: t("Kente dokuma tezgâhında renkler dans ediyor, Kakum kanopi köprüsü ağaç tepelerinin üstünde sallanıyor.") },
      { k: "gezgin", m: t("Ağaçların tepesinden yürümek harika; aşağıya bakmadan ilerlersek bulutlara dokunacağız!") },
      { k: "arkadas", m: t("Sallanması biraz gıdıklıyor ama rüzgârla yarışan hayaletleri buradan görmek çok kolay.") },
    ],
  },
  NG: { // 13. Nijerya
    hatira: { ad: t("Çivit Boyalı Kumaş"), simge: "🎀", not: t("Doğal bitkisel boyayla bağlanıp renklendirilen, dalga ve yıldız desenli geleneksel pamuklu parça.") },
    sahne: [
      { k: "anlatici", m: t("Görkemli Zuma Kayası ufukta yükselirken konuşan davulların ritmi sokaklara neşe taşıyor.") },
      { k: "arkadas", m: t("Bu davullar sanki gerçekten bizimle sohbet ediyor; tempoyu duyunca ayaklarım yerinde durmuyor!") },
    ],
  },
  CD: { // 14. Kongo DC
    hatira: { ad: t("Likembe Parmak Piyanosu"), simge: "🎹", not: t("Küçük ahşap kutu üstüne dizilmiş metal şeritlerin başparmakla tınlatıldığı taşınabilir çalgı.") },
    sahne: [
      { k: "anlatici", m: t("Sık okapi ormanı yaprak hışırtılarıyla dolu, geniş Kongo Nehri'nde oyma piroglar süzülüyor.") },
      { k: "gezgin", m: t("Çizgili bacaklı okapi o kadar sessiz yürüyor ki az kalsın onu da utangaç bir ruh sanacaktım.") },
      { k: "arkadas", m: t("Nehrin akışı gibi sakin olalım, ormanda saklanan her sürprizi kolayca fark ederiz.") },
    ],
  },
  AO: { // 15. Angola
    hatira: { ad: t("Düşünen Tahta Heykelcik"), simge: "🗿", not: t("Avuç içine sığan, başını ellerine yaslamış bilge figürlü geleneksel ahşap oyma heykelcik.") },
    sahne: [
      { k: "anlatici", m: t("Kalandula Şelalesi köpükler saçarak dökülüyor, kurak topraklarda asırlık welwitschia bitkisi yaşıyor.") },
      { k: "arkadas", m: t("Şelalenin serin buharı yüzümüze değince bütün yorgunluğum bir anda uçup gitti!") },
      { k: "gezgin", m: t("İki yaprakla bin yıl yaşayan bir bitkinin yanında bizim sabrımız da tazelendi.") },
    ],
  },
  ZA: { // 16. Güney Afrika
    hatira: { ad: t("Kırmızı Rooibos Çayı"), simge: "🌿", not: t("Yalnız güney dağlarında yetişen kırmızı çalı yapraklarından yapılan, kafeinsiz ve bal kokulu çay kesesi.") },
    sahne: [
      { k: "anlatici", m: t("Masa Dağı'nın düz zirvesini pamuk gibi bulutlar sarmış, kumsalda Afrika penguenleri paytakça yürüyor.") },
      { k: "arkadas", m: t("Penguenler smokin giymiş misafirler gibi bizi karşılıyor; çok ciddi ama bir o kadar sevimliler!") },
    ],
  },
  MZ: { // 17. Mozambik
    hatira: { ad: t("Piri Piri Biberi"), simge: "🌶️", not: t("Küçücük boyuna rağmen yemeklere güçlü bir tat ve neşe katan, güneşte kurutulmuş kırmızı biber.") },
    sahne: [
      { k: "anlatici", m: t("Üçgen yelkenli dau tekneleri turkuaz suları yarıyor, kıyıda kaju ağaçları gölge veriyor.") },
      { k: "gezgin", m: t("Okyanus esintisi yelkenleri şişiriyor; kıyı boyunca sıralanan ağaçların kokusu harika.") },
      { k: "arkadas", m: t("Birkaç kaju toplayıp yola devam edelim, bu rüzgâr bizi harika yerlere götürecek!") },
    ],
  },
  MG: { // 18. Madagaskar
    hatira: { ad: t("Siyah Vanilya Çubuğu"), simge: "🌱", not: t("Orkide çiçeğinin olgunlaşıp güneşte kurutulmuş, tatlılara eşsiz koku veren koyu renkli meyve çubuğu.") },
    sahne: [
      { k: "anlatici", m: t("Baobab Caddesi'nin dev gövdeli ağaçları göğe uzanıyor, dallarda çizgili kuyruklu lemurlar zıplıyor.") },
      { k: "arkadas", m: t("Şu ağaçlar sanki kökleri havada duruyor gibi; lemurlar da bize merakla el sallıyor!") },
      { k: "gezgin", m: t("Bu adada doğa bambaşka bir hayal gücüyle çizilmiş, haydi dikkatle keşfedelim.") },
    ],
  },
  TZ: { // 19. Tanzanya
    hatira: { ad: t("Tingatinga Küçük Tablo"), simge: "🎨", not: t("Parlak boyalar ve benekli fırça darbeleriyle neşeli doğa sahneleri çizen geleneksel küçük tablo.") },
    sahne: [
      { k: "anlatici", m: t("Kilimanjaro'nun karlı zirvesi bulutların üstünde parlıyor, Zanzibar'ın oyma kapıları incelikle süslenmiş.") },
      { k: "gezgin", m: t("Sıcak ovanın üstünde bembeyaz bir dağ tepesi görmek insana mucizelere inanma gücü veriyor.") },
    ],
  },
  UG: { // 20. Uganda
    hatira: { ad: t("Mutuba Kabuk Kumaşı"), simge: "🍂", not: t("İncir ağacının kabuğu tahta tokmakla dövülüp yumuşatılarak yapılan, tarçın renkli geleneksel örtü.") },
    sahne: [
      { k: "anlatici", m: t("Sisli ormanda sakin dağ gorilleri dinleniyor, Murchison Şelalesi dar boğazdan coşkuyla akıyor.") },
      { k: "arkadas", m: t("Gorillere sessizce selam verelim; onlar huzur seviyor, biz de kibar misafirler olalım.") },
      { k: "gezgin", m: t("Şelalenin gür sesi ormana ritim tutuyor, bu enerjiyle izleri çabucak buluruz.") },
    ],
  },
  KE: { // 21. Kenya
    hatira: { ad: t("Oyma Sabuntaşı Figürü"), simge: "💠", not: t("Yumuşak doğal taşın elde yontulup pürüzsüzce parlatılmasıyla yapılan, avuç içi boyunda taş süs.") },
    sahne: [
      { k: "anlatici", m: t("Zürafalar akasya dallarına uzanıyor, yakındaki göl binlerce pembe flamingoyla renklenmiş.") },
      { k: "arkadas", m: t("Zürafalar uzun boylarıyla ufka bakıyor; keşke bize en yakın hayaletin yerini fısıldasalar!") },
      { k: "gezgin", m: t("Pembe gölün kıyısında saklanacak çok yer yok, yakında her şey ortaya çıkar.") },
    ],
  },
  ET: { // 22. Etiyopya
    hatira: { ad: t("Kavrulmuş Kahve Çekirdeği"), simge: "🌰", not: t("Yüksek yaylalardaki ağaçlardan toplanıp mis kokusu çıkana dek tavada kavrulan aromatik kahve taneleri.") },
    sahne: [
      { k: "anlatici", m: t("Aksum'un kadim dikili taşları göğe uzanıyor, dağ yamaçlarında yeleli gelada maymunları toplanmış.") },
      { k: "gezgin", m: t("Yüksek yaylanın havası o kadar berrak ki insanın içi açılıyor; haritamız burada da ışıldıyor.") },
    ],
  },
  SD: { // 23. Sudan
    hatira: { ad: t("Kurutulmuş Karkade Çiçeği"), simge: "🌺", not: t("Sıcak ya da soğuk demlendiğinde yakut rengi alan, ekşimsi ve ferahlatıcı kurutulmuş çiçek yaprakları.") },
    sahne: [
      { k: "anlatici", m: t("Meroe piramitleri kızıl kumların üstünde sıralanmış, uzak deve pazarından canlı sesler yükseliyor.") },
      { k: "arkadas", m: t("Piramitlerin gölgesinde oturup serin bir içecek hayal etmek serbest mi?") },
      { k: "gezgin", m: t("Elbette, ama önce kayıp ruhların sıcak kumlarda bıraktığı izlere bakalım!") },
    ],
  },
  EG: { // 24. Mısır
    hatira: { ad: t("Papirüs Çizim Rulosu"), simge: "📜", not: t("Nehir kıyısındaki sazların şeritler hâlinde preslenip kurutulmasıyla yapılan, el boyamalı eski tip kâğıt.") },
    sahne: [
      { k: "anlatici", m: t("Gize piramitleri ile Sfenks zamana meydan okuyor, Nil'de beyaz yelkenli felukalar süzülüyor.") },
      { k: "arkadas", m: t("Sfenks sanki bize bir bilmece sormak için bekliyor; iyisi mi gözlerimizi dört açalım!") },
      { k: "gezgin", m: t("Nehirdeki esinti haritamızı hafifçe kıpırdatıyor, doğru izdeyiz.") },
    ],
  },
  YE: { // 25. Yemen
    hatira: { ad: t("Altın Sidr Balı"), simge: "🍯", not: t("Dağ vadilerindeki hünnap ağaçlarının çiçeklerinden toplanan, yoğun kıvamlı ve mis kokulu altın bal.") },
    sahne: [
      { k: "anlatici", m: t("Sokotra'nın şemsiye biçimli ejder kanı ağaçları büyülüyor, Sana'a'nın süslü kule evleri yükseliyor.") },
      { k: "gezgin", m: t("Bu ağaçların altında durunca insan kendini başka bir gezegendeymiş gibi hissediyor.") },
      { k: "arkadas", m: t("Kule evlerin beyaz desenleri pasta kreması gibi duruyor, hayaletler burada neşeyle saklanıyordur.") },
    ],
  },
  SA: { // 26. Suudi Arabistan
    hatira: { ad: t("Sadu Dokuma Şeridi"), simge: "🐪", not: t("Çöl yaşamının geometrik desenlerini taşıyan, koyun yününden el tezgâhında dokunmuş renkli şerit.") },
    sahne: [
      { k: "anlatici", m: t("Hurma bahçelerinin serin gölgesinden çıkınca El-Ula'nın dev Fil Kayası gülümseyerek beliriyor.") },
      { k: "arkadas", m: t("Rüzgârın koca kayayı tam bir fil gibi yontması inanılmaz; doğa gerçekten harika bir heykeltıraş!") },
    ],
  },
  PS: { // 27. Filistin
    hatira: { ad: t("Nablus Doğal Sabunu"), simge: "🛁", not: t("Saf bitkisel yağın büyük kazanlarda pişirilip kalıplara dökülerek kurutulmasıyla yapılan beyaz sabun.") },
    sahne: [
      { k: "anlatici", m: t("Asırlık zeytin bahçeleri gümüş yapraklarını sallıyor, Hayat Ağacı mozaiği ince taşlarıyla parlıyor.") },
      { k: "gezgin", m: t("Yüzyıllardır meyve veren şu ağaçların altında insan derin bir huzur duyuyor.") },
      { k: "arkadas", m: t("Mozaikteki her minik taş birleşince güzelleşmiş; tıpkı bizim topladığımız hatıralar gibi.") },
    ],
  },
  IQ: { // 28. Irak
    hatira: { ad: t("Çivi Yazılı Tablet"), simge: "📝", not: t("Islak nehir kiline ince bir kamış ucuyla basılarak hazırlanan, avuç içi büyüklüğünde kil yazı levhası.") },
    sahne: [
      { k: "anlatici", m: t("Su üstünde kamış mudhif evleri kemer gibi kıvrılıyor, eski sokaklarda şenaşil balkonlar gölge veriyor.") },
      { k: "arkadas", m: t("Hiç çivi kullanmadan kamıştan böyle zarif evler örmek gerçek bir ustalık!") },
      { k: "gezgin", m: t("Burada ilk hikâyelerin yazıldığı topraklardayız; bizim masalımıza da yeni bir sayfa ekleyelim.") },
    ],
  },
  IR: { // 29. İran
    hatira: { ad: t("Altın Safran Şişesi"), simge: "🌸", not: t("Mor çiçeklerin incecik kırmızı liflerinin elle toplanıp kurutulduğu, yemeklere altın rengi veren baharat.") },
    sahne: [
      { k: "anlatici", m: t("Siose Pol köprüsünün kemerleri suya yansıyor, Yezd'in rüzgâr kuleleri evlere doğal serinlik taşıyor.") },
      { k: "gezgin", m: t("Rüzgârı yakalayıp evleri serinleten şu kuleler ne akıllıca bir buluş!") },
      { k: "arkadas", m: t("Bir an durup o esintinin tadını çıkaralım, sonra hayaletlere yetişiriz.") },
    ],
  },
  UZ: { // 30. Özbekistan
    hatira: { ad: t("Turkuaz Seramik Kâse"), simge: "🔵", not: t("Çarkta şekillendirildikten sonra doğal bitki külü sırlamasıyla parlak maviye boyanan geleneksel çay kâsesi.") },
    sahne: [
      { k: "anlatici", m: t("İpek Yolu kervanının çanları tınlıyor, kavun pazarından bal gibi tatlı bir koku yayılıyor.") },
      { k: "arkadas", m: t("Kavunların kokusu burnuma kadar geldi; hayalet avı biter bitmez birer dilim kapalım!") },
    ],
  },
  AF: { // 31. Afganistan
    hatira: { ad: t("Lacivert Lapis Taşı"), simge: "🔷", not: t("İçinde altın benekler parlayan, derin gökyüzü mavisiyle binlerce yıldır süslemede kullanılan doğal taş.") },
    sahne: [
      { k: "anlatici", m: t("Tepenin üstünde rengârenk uçurtmalar rüzgârla süzülüyor, aşağıda yakut renkli nar bahçeleri uzanıyor.") },
      { k: "gezgin", m: t("Gökyüzü dans eden uçurtmalarla şenlenmiş; kayıp ruhlar bile onları izlemek için yukarı bakıyordur.") },
      { k: "arkadas", m: t("İpler dolaşmadan biz de şu tepeyi tırmanalım, manzara harika görünüyor!") },
    ],
  },
  PK: { // 32. Pakistan
    hatira: { ad: t("Pembe Kaya Tuzu"), simge: "💖", not: t("Eski deniz yataklarından çıkarılan, mineraller sayesinde uçuk pembe renk alan doğal kristal tuz parçası.") },
    sahne: [
      { k: "anlatici", m: t("Zilli ve çiçek resimli süslü kamyonlar neşeyle geçiyor, Hunza vadisinde kayısı bahçeleri ışıldıyor.") },
      { k: "arkadas", m: t("Her kamyon yürüyen bir sanat galerisi gibi! Keşke bizim çantalarımız da böyle süslü olsaydı.") },
      { k: "gezgin", m: t("Çantalarımız topladığımız hatıralarla yeterince renkli zaten, haydi ileri!") },
    ],
  },
  IN: { // 33. Hindistan
    hatira: { ad: t("Bilek Dans Zilleri"), simge: "🔔", not: t("Klasik danslarda her adımda neşeli ritim tutan, kalın ipe dizilmiş küçücük pirinç çanlar.") },
    sahne: [
      { k: "anlatici", m: t("Hawa Mahal'in pembe pencereleri rüzgârı davet ediyor, lotus göletinin kıyısında tavus kuşları süzülüyor.") },
      { k: "gezgin", m: t("Tavus kuşu kuyruğunu açınca bütün gölet gökkuşağına döndü.") },
      { k: "arkadas", m: t("Bu kadar güzel rengin arasında hayaletlerin yüzü bile gülmüştür!") },
    ],
  },
  BD: { // 34. Bangladeş
    hatira: { ad: t("Altın Jüt Sepeti"), simge: "👜", not: t("Nehir ovalarında yetişen parlak bitki liflerinin elde örülmesiyle yapılan, hafif ve dayanıklı küçük sepet.") },
    sahne: [
      { k: "anlatici", m: t("El boyamalı süslü rikşalar sokakları renklendiriyor, Sundarbans sularında Bengal kaplanı sessizce yürüyor.") },
      { k: "arkadas", m: t("Kaplana uzaktan saygıyla selam verelim; rikşaların neşeli zilleri bize eşlik etmeye yeter!") },
    ],
  },
  MM: { // 35. Myanmar
    hatira: { ad: t("Lake Bambu Kâsesi"), simge: "🍚", not: t("İncecik örülmüş bambunun ağaç özüyle kat kat cilalanıp ince desenlerle kazındığı tüy gibi hafif kâse.") },
    sahne: [
      { k: "anlatici", m: t("Inle Gölü balıkçıları tek ayaklarıyla kürek çekiyor, kıyıda renkli Pathein şemsiyeleri kurutuluyor.") },
      { k: "arkadas", m: t("Tek ayak üstünde kürek çekmek mi? Ben düz yolda bile bazen tökezliyorum, helal olsun!") },
      { k: "gezgin", m: t("Denge ve sabır bu gölün sırrıymış; biz de sakin adımlarla ilerleyelim.") },
    ],
  },
  TH: { // 36. Tayland
    hatira: { ad: t("Örgü Rattan Topu"), simge: "⚽", not: t("İnce palmiye şeritlerinden delikli örülen, ayakla havada sektirilerek oynanan geleneksel oyun topu.") },
    sahne: [
      { k: "anlatici", m: t("Yüzen pazarda meyve dolu kayıklar yan yana dizilmiş, sokaklarda renkli tuk-tuklar vızır vızır geziyor.") },
      { k: "gezgin", m: t("Kayıkların arasından taze mango kokusu yükseliyor, her köşede ayrı bir canlılık var.") },
      { k: "arkadas", m: t("Bir tuk-tuka atlayıp pazarı turlasak kayıp ruhlar bile peşimizden kıkırdayarak gelir!") },
    ],
  },
  MY: { // 37. Malezya
    hatira: { ad: t("Ahşap Gasing Topacı"), simge: "🌀", not: t("Sert ağaçtan yontulan ve ip sarılıp fırlatıldığında dakikalarca dengede dönen geleneksel oyun topacı.") },
    sahne: [
      { k: "anlatici", m: t("Petronas İkiz Kuleleri bulutlara ayna tutuyor, yağmur ormanında dev Rafflesia çiçeği açmış.") },
      { k: "arkadas", m: t("Şu çiçeğe baksana, neredeyse koca bir şemsiye kadar! Ama yakından koklamasak daha iyi sanki.") },
    ],
  },
  ID: { // 38. Endonezya
    hatira: { ad: t("Bambu Angklung Çalgısı"), simge: "🎋", not: t("Farklı boydaki bambu boruların el hareketiyle sallanarak berrak bir nota çıkardığı geleneksel çalgı.") },
    sahne: [
      { k: "anlatici", m: t("Zümrüt yeşili pirinç terasları basamak gibi iniyor, sıcak adada Komodo ejderleri ağır ağır geziyor.") },
      { k: "gezgin", m: t("Yamaçlara işlenmiş şu su basamakları gökyüzünü aynalar gibi yansıtıyor.") },
      { k: "arkadas", m: t("Ejderlere geniş bir yol verelim; biz terasların serin esintisinde aramaya devam edelim.") },
    ],
  },
  PH: { // 39. Filipinler
    hatira: { ad: t("Sedef Rüzgâr Çanı"), simge: "🐚", not: t("İncecik doğal istiridye kabuklarının iplere dizilerek rüzgâr estikçe hafifçe tınladığı geleneksel süs.") },
    sahne: [
      { k: "anlatici", m: t("Çikolata Tepeleri yan yana koni gibi dizilmiş, renkli jeepneyler neşeli korna sesleriyle geçiyor.") },
      { k: "arkadas", m: t("Adı Çikolata Tepeleri ama tadına bakamıyoruz; yine de bu yuvarlak tepeler çok sevimli!") },
      { k: "gezgin", m: t("Adadan adaya esen şu sıcak rüzgâr sanki bize gizli bir melodi taşıyor.") },
    ],
  },
  VN: { // 40. Vietnam
    hatira: { ad: t("Metal Phin Süzgeci"), simge: "🥛", not: t("Bardağın üstüne oturtulup ince öğütülmüş kahveyi damla damla süzen, avuç içi boyunda demleme aracı.") },
    sahne: [
      { k: "anlatici", m: t("Ha Long Körfezi'nde zümrüt adacıklar sisle örtülü, Hoi An sokakları rengârenk fenerlerle ışıldıyor.") },
      { k: "gezgin", m: t("Bu ipek fenerlerin sıcak ışığı kayıp ruhlara biraz olsun evlerini anımsatıyordur.") },
    ],
  },
  CN: { // 41. Çin
    hatira: { ad: t("Ahşap Boncuklu Abaküs"), simge: "🔢", not: t("Çerçeve içindeki çubuklara dizili tahta boncukları kaydırarak hızlıca hesap yapmaya yarayan geleneksel araç.") },
    sahne: [
      { k: "anlatici", m: t("Bambu ormanında pandalar keyifle filiz kemiriyor, meydanda renkli ejder dansı davullarla coşuyor.") },
      { k: "arkadas", m: t("Pandalar o kadar rahat ki bir an ben de bambu gölgesine uzanıp kestirmek istedim!") },
      { k: "gezgin", m: t("Ejder dansının temposu uykunu hemen açar; haydi ritme ayak uyduralım!") },
    ],
  },
  KR: { // 42. Güney Kore
    hatira: { ad: t("Katlı Kâğıt Ttakji"), simge: "🎴", not: t("İki kare kâğıdın katlanıp iç içe geçirilmesiyle yapılan, yere vurup ters çevirmeye dayalı oyun kartı.") },
    sahne: [
      { k: "anlatici", m: t("Kıvrımlı çatılı hanok evleri huzurla sıralanmış, bahçelerde toprak kimçi küpleri dizilmiş.") },
      { k: "gezgin", m: t("Ahşap avluların sakinliğinde insanın zamanın nasıl geçtiğini unutası geliyor.") },
      { k: "arkadas", m: t("Kimçi küplerinden birinin arkasına saklanan utangaç bir hayalet varsa hemen fark ederiz!") },
    ],
  },
  JP: { // 43. Japonya
    hatira: { ad: t("Origami Kâğıt Turnası"), simge: "🐦", not: t("Hiç makas ve yapıştırıcı kullanmadan tek bir kare kâğıdın katlanmasıyla yapılan, umut simgesi küçük kuş.") },
    sahne: [
      { k: "anlatici", m: t("Kiraz ağaçlarından pembe yapraklar kar gibi süzülüyor, uzakta karlı Fuji Dağı dinginlikle yükseliyor.") },
      { k: "arkadas", m: t("Saçlarıma pembe taç yaprakları kondu; bu kadar zarif bir karşılama görmemiştim!") },
    ],
  },
  RU: { // 44. Rusya
    hatira: { ad: t("Hohloma Ahşap Kaşığı"), simge: "🥄", not: t("Siyah zemin üstüne altın ve kırmızı meyve desenleri işlenip fırınlanarak parlatılan geleneksel tahta kaşık.") },
    sahne: [
      { k: "anlatici", m: t("Oymalı ahşap izba pencereleri dantel gibi işlenmiş, tezgâhlarda boy boy matruşka bebekleri gülümsüyor.") },
      { k: "gezgin", m: t("İç içe saklanan şu bebekler gibi, haritamızda da her sırrın altından yeni bir sır çıkıyor.") },
      { k: "arkadas", m: t("Umarım en küçük bebeğin içinden bize el sallayan minik bir hayalet fırlamaz!") },
    ],
  },
  CA: { // 45. Kanada
    hatira: { ad: t("Taş İnukşuk Figürü"), simge: "⛰️", not: t("Kuzey ovalarında yolculara yön göstermek için üst üste dengelenen taşlardan esinlenen küçük figür.") },
    sahne: [
      { k: "anlatici", m: t("Kızıl akçaağaç ormanından tatlı şurup kokusu geliyor, derede çalışkan kunduzlar baraj örüyor.") },
      { k: "arkadas", m: t("Kunduzların ekip çalışmasına hayran kaldım; hiç söylenmeden dalları sırayla yerleştiriyorlar.") },
      { k: "gezgin", m: t("Okyanusu aşıp yeni bir kıtaya geçtik, dostluğumuz sayesinde yol gözümüze hiç uzak değil.") },
    ],
  },
  US: { // 46. ABD
    hatira: { ad: t("Cep Boyu Mızıka"), simge: "🎵", not: t("Nefes alıp vererek çalınan, cepte taşınacak kadar küçük ve neşeli ezgiler çıkaran metal çalgı.") },
    sahne: [
      { k: "anlatici", m: t("Özgürlük Heykeli meşalesini göğe kaldırıyor, batıda Büyük Kanyon'un kızıl katmanları uzanıyor.") },
      { k: "gezgin", m: t("Yüksek bir meşale görmek bana aradığımız feneri hatırlattı; hedefimize yaklaşıyoruz.") },
      { k: "arkadas", m: t("Kanyona doğru 'merhaba!' diye bağırsam yankısı herhâlde yarın sabah geri döner!") },
    ],
  },
  MX: { // 47. Meksika
    hatira: { ad: t("Renkli Alebrije Figürü"), simge: "🦎", not: t("Hafif ağaçtan oyulup parlak nokta ve çizgilerle süslenen, hayal gücü ürünü sevimli halk sanatı figürü.") },
    sahne: [
      { k: "anlatici", m: t("Pazarın üstünde kâğıttan papel picado süsleri dalgalanıyor, serin gölette ajoloteler gülümsüyor.") },
      { k: "arkadas", m: t("Şu pembe ajolote her zaman gülüyor gibi duruyor; bütün ekibe moral verdi!") },
    ],
  },
  CO: { // 48. Kolombiya
    hatira: { ad: t("Wayuu Örgü Kesesi"), simge: "👝", not: t("Parlak iplerle tığ işi dokunan, doğadan esinlenen geometrik desenli küçük el kesesi.") },
    sahne: [
      { k: "anlatici", m: t("Cocora Vadisi'nin dev mum palmiyeleri bulutlara değiyor, Cartagena'nın balkonlarından çiçekler sarkıyor.") },
      { k: "gezgin", m: t("Gökyüzüne uzanan şu palmiyelerin altında yürürken insan kendini bulutların komşusu sanıyor.") },
      { k: "arkadas", m: t("Çiçekli balkonlardan gelen gitar sesleri de eklenince buradan hiç ayrılasım gelmiyor!") },
    ],
  },
  PE: { // 49. Peru
    hatira: { ad: t("And Kamış Flütü"), simge: "🎼", not: t("Yan yana bağlanmış farklı boydaki kamış borulara üflenerek dağ rüzgârı gibi ses çıkaran çalgı.") },
    sahne: [
      { k: "anlatici", m: t("Bulutların arasındaki Machu Picchu terasları parlıyor, tüylü lamalar patikada sakin sakin otluyor.") },
      { k: "arkadas", m: t("Lamalar bize sanki 'yukarıya nefesiniz yetti mi?' der gibi kibar bir bakış atıyor!") },
      { k: "gezgin", m: t("Bu yüksekliğe kadar geldik, artık dünyanın öbür ucu bile bir adım ötede.") },
    ],
  },
  BR: { // 50. Brezilya
    hatira: { ad: t("Pandeiro El Tefi"), simge: "🥁", not: t("Kenarındaki metal zillerle ritme neşe katan, tek elle çalınan geleneksel samba çalgısı.") },
    sahne: [
      { k: "anlatici", m: t("Amazon dallarında renkli tukanlar ile aralar ötüşüyor, kıyıda Şeker Somunu Dağı yükseliyor.") },
      { k: "arkadas", m: t("Kuşların renkleri o kadar canlı ki gökkuşağı buraya tatile gelmiş sandım!") },
      { k: "gezgin", m: t("Haritamız neredeyse tamamen canlandı; önümüzde artık son bir durak kaldı.") },
    ],
  },
  AR: { // 51. Arjantin
    hatira: { ad: t("Oyma Mate Kabağı"), simge: "🏺", not: t("Kurutulmuş küçük su kabağından yapılan, metal kamışıyla dostlar arasında paylaşılan bitki çayı kabı.") },
    sahne: [
      { k: "anlatici", m: t("Caminito'nun renkli evleri neşe saçıyor, güneyde Perito Moreno Buzulu mavi ışığıyla parlıyor.") },
      { k: "gezgin", m: t("Son durağımıza ulaştık; buzlu rüzgârın ötesinde dünyanın ucundaki deniz feneri bizi bekliyor.") },
      { k: "arkadas", m: t("Bütün arkadaşlar yan yanayız. Haydi, bu uzun yolculuğu unutulmaz bir ışıkla taçlandıralım!") },
    ],
  },
};

const HIKAYE_BILMECE = [
  {
    soru: t("Kızıl gövdemle ocağa yaklaşınca,\nİçimde koyu bir koku kabarır,\nMisafire sıcak neşe sunarım."),
    secenek: [t("Baltık Kehribar Taşı"), t("Bakır Kahve Cezvesi"), t("Düğümlü Tuzlu Brezel")],
    dogru: 1,
    bolum: [t("Haritanın ilk köşesi canlanınca titrek yazılar belirginleşti ve büyük bir gerçeği öğrendik."), t("Karşımıza çıkan hayaletler hiç de kötü değilmiş; onlar yalnızca evinin yolunu yitirmiş yalnız ruhlarmış."), t("Bize doğru süzülmelerinin tek sebebi, karanlıkta kaybolan seslerini bir dostun duymasını dilemekmiş.")],
  },
  {
    soru: t("Katlı dururken bir çubuğum,\nBileğini sallayınca kanatlanırım,\nYüzüne tatlı meltem taşırım."),
    secenek: [t("Tereyağlı Çıtır Kruvasan"), t("Venedik Karnaval Maskesi"), t("Boyalı El Yelpazesi")],
    dogru: 2,
    bolum: [t("Haritada açılan ikinci parça bize eski zamanlardan kalma, sıcak bir anıyı fısıldadı."), t("Eskiden her gece gökyüzünde yumuşak bir parıltı yanar, dolaşan bütün ruhlar o izi takip ederek evine dönermiş."), t("Şimdi o ışık olmadığı için rüzgâr nereye eserse oraya savruluyor, hep bir rehber arıyorlarmış.")],
  },
  {
    soru: t("Avucunda otururum, telim yok,\nİnce dillerime dokununca öterim,\nYol boyu neşeli ezgiler yayarım."),
    secenek: [t("Likembe Parmak Piyanosu"), t("Oware Oyun Taşları"), t("Düşünen Tahta Heykelcik")],
    dogru: 0,
    bolum: [t("Üçüncü parça parlayınca haritanın en güneyinde sönük bir kule çizimi belirdi."), t("Meğer ruhlara yol gösteren o eski parıltının adı Dostluk Feneri'ymiş ve dünyanın ucunda kuruluymuş."), t("Yıllardır karanlıkta bekleyen o fenerin yeniden yanması için uzun bir yol yürümemiz gerektiğini anladık.")],
  },
  {
    soru: t("İnce bir dal gibiyim, ağaç değilim,\nDondurmaya girince yüzler güler,\nBurnuna sıcak rayiha taşırım."),
    secenek: [t("Kırmızı Rooibos Çayı"), t("Siyah Vanilya Çubuğu"), t("Tingatinga Küçük Tablo")],
    dogru: 1,
    bolum: [t("Dördüncü bölümde feneri neyin söndürdüğünü öğrenince hepimiz bir an durup düşündük."), t("Onu ne sert fırtınalar ne de karanlık bulutlar söndürmüş; alevi yavaşça küçülten şey unutkanlıkmış."), t("İnsanlar selamlaşmayı, paylaşmayı ve birbirine kulak vermeyi azalttıkça fenerin sıcaklığı da çekilmiş."), t("Demek ki ışığı geri getirmek için önce dünyadaki güzel bağları yeniden hatırlamalıyız.")],
  },
  {
    soru: t("Suya yakın saplardan doğarım,\nSarılarak taşınır, açılınca düzleşirim,\nÜstümde kadim öyküler yaşar."),
    secenek: [t("Oyma Sabuntaşı Figürü"), t("Altın Sidr Balı"), t("Papirüs Çizim Rulosu")],
    dogru: 2,
    bolum: [t("Beşinci parça canlandığında fenerin sıradan bir kıvılcımla ya da tek bir büyüyle yanmayacağını gördük."), t("Kuledeki cam küre yalnızca farklı diyarlardan toplanan neşeli anıların sıcaklığıyla tutuşabilirmiş."), t("Şimdi her durakta neden küçücük bir hatıra aradığımızı daha iyi anlıyor, çantamıza sevgiyle bakıyoruz.")],
  },
  {
    soru: t("Küp biçiminde, solgun dururum,\nSuyun altında ellerinde köpürürüm,\nGiderken tertemiz koku bırakırım."),
    secenek: [t("Nablus Doğal Sabunu"), t("Altın Safran Şişesi"), t("Turkuaz Seramik Kâse")],
    dogru: 0,
    bolum: [t("Altıncı bölüm açılır açılmaz sırt çantamızdaki hatıraların hafifçe ısındığını hissettik."), t("Meğer her ülkenin müziği, oyunu, emeği ve lezzeti kendi küçücük kıvılcımını bu eşyalarda saklıyormuş."), t("Biz gülümsedikçe haritanın çizgileri de altın renginde parlamaya, kıtaları birbirine bağlamaya başladı.")],
  },
  {
    soru: t("Tek başıma sessizce beklerim,\nAyakların yere vurdukça şıngırdarım,\nMüzik başlayınca hiç durmam."),
    secenek: [t("Pembe Kaya Tuzu"), t("Bilek Dans Zilleri"), t("Altın Jüt Sepeti")],
    dogru: 1,
    bolum: [t("Yedinci parçada haritanın ortasına zarif bir not düştü ve hepimizin yüreğini ısıttı."), t("Hiç kimse tek başına bütün dünyayı dolaşamaz, hiçbir el tek başına o koca feneri yakamazmış."), t("Yolda kazandığımız her dost, karanlığa karşı yaktığımız birer küçük yıldız gibiymiş."), t("Artık yan yana yürürken ne kadar güçlü olduğumuzu her adımda hissediyoruz.")],
  },
  {
    soru: t("Tek ayağımda hiç sendelemem,\nSavrulunca vızıldayarak raks ederim,\nYorulunca usulca yana yatarım."),
    secenek: [t("Örgü Rattan Topu"), t("Bambu Angklung Çalgısı"), t("Ahşap Gasing Topacı")],
    dogru: 2,
    bolum: [t("Sekizinci bölümde okyanusları aşan mavi bir rota çizildi ve rüzgârın sesi değişti."), t("Etrafımızdaki hayaletler artık telaşla kaçışmıyor, tatlı bir mırıltıyla neşeli kafilemizi izliyormuş."), t("Sanki dünyanın ucundaki fenerin yakında uyanacağını sezmiş gibi umutla parlıyorlar.")],
  },
  {
    soru: t("Başta dümdüz bir sayfaydım,\nKıvrımlarla kanatlı bir biçim aldım,\nHafif bir nefesle masada kayarım."),
    secenek: [t("Origami Kâğıt Turnası"), t("Ahşap Boncuklu Abaküs"), t("Hohloma Ahşap Kaşığı")],
    dogru: 0,
    bolum: [t("Dokuzuncu parça canlanınca haritanın neredeyse tamamı güneş gibi ışıldadı."), t("Yalnız en güneydeki buzlu kıyı karanlıkta kaldı; fenerin camına son dokunuşu hep birlikte yapacağız."), t("Ellerimiz aynı anda birleştiğinde, dünyanın dört yanından getirdiğimiz bütün kıvılcımlar tek bir alev olacak.")],
  },
  {
    soru: t("Ufak deliklerimden rüzgâr geçer,\nSadece havan yeter, başka araç gerekmez,\nYolda bile tatlı melodi kurarım."),
    secenek: [t("Renkli Alebrije Figürü"), t("Cep Boyu Mızıka"), t("Pandeiro El Tefi")],
    dogru: 1,
    bolum: [t("Onuncu ve son düğüm çözüldü; Dostluk Haritası bütün görkemiyle gözlerimizin önünde canlandı!"), t("Haritanın ucunda Arjantin'in en güneyindeki kayalıklarda bekleyen deniz feneri artık apaçık görünüyor."), t("Dünyanın bütün renklerini, melodilerini ve dostluğumuzu yanımıza aldık."), t("Haydi arkadaşlar, dünyanın ucuna gidip Dostluk Feneri'ni hep birlikte yakalım!")],
  },
];

const HIKAYE_FINAL = [
  { k: "anlatici", m: t("Buzlu güney rüzgârında bütün dostlar omuz omuza, dünyanın ucundaki deniz fenerinin tepesine ulaşıyor.") },
  { k: "gezgin", m: t("Topladığımız bütün hatıraları ve ellerimizi birleştirme vakti; haydi, üç deyince ışığı uyandıralım!") },
  { k: "anlatici", m: t("Dostluk Feneri altın bir ışıkla parlıyor; denizde açılan yolda hayaletler gülümseyip evlerine süzülüyor.") },
  { k: "arkadas", m: t("Gördün mü? Tek başına kalsaydın hem yolu şaşırırdın hem de atıştırmalıkları paylaşacak kimsen olmazdı!") },
  { k: "gezgin", m: t("Haklısın; bu koca dünyada bulduğum en güzel hazine ne harita ne de hatıralar, sizlerin dostluğu oldu.") },
  { k: "anlatici", m: t("Fenerin sıcak ışığı geceyi sararken arkadaşlar kahkahalarla yeni yarınlara doğru omuz omuza yürüyor.") },
];
