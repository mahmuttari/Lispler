/* ============================================================
   KELİME BİLCEK — kategoriler, kategori sözlüğü ve saf kelime işlevleri
   Tarayıcıda düz <script> olarak yüklenir (genel ad alanı); Node testleri (test/kelime.test.mjs) aynı dosyayı
   CommonJS olarak okur. DOM ve Firebase'e dokunmaz.
   ============================================================ */
const CATEGORIES = [
  "Buzdolabının İçinde Bulunanlar",
  "Banyoda Karşılaşabileceğin Şeyler",
  "Alet Çantasının Olmazsa Olmazları",
  "Sabah Kahvaltısının Vazgeçilmezleri",
  "Sulu Yemek Çeşitleri",
  "Mutfak Çekmecesinde Bulunanlar",
  "Arabanın Parçaları",
  "Ofis Masasında Bulunanlar",
  "İnşaat ve Mühendislik Terimleri",
  "Piknik Sepetinde Neler Olur",
  "Deniz Kenarında Bulunanlar",
  "Bahçede Yetişen Bitki ve Ağaçlar",
  "Gökyüzünde Görebileceğin Şeyler",
  "Kırtasiyeden Alınabilecekler",
  "Mühendislik & Doğa Bilimleri",
  "Yazılım & Bilişim Teknolojileri",
  "Hukuk & Kamu Yönetimi",
  "İktisat, Finans & Borsa",
  "Tıp, Sağlık & Anatomi",
  "Edebiyat, Felsefe & Sosyal Bilimler",
  "Ev ve Yaşam",
  "Mutfak ve Lezzet",
  "Ulaşım ve Sokak",
  "İş, Mühendislik ve Eğitim",
  "Hobi ve Eğlence"
];

/* Kategori sözlüğü (çok kelimeli girişler dahil) */
const CATEGORY_WORDS = {
  "Buzdolabının İçinde Bulunanlar": ["peynir","zeytin","yumurta","süt","yoğurt","tereyağı","reçel","bal","salam","sucuk","sosis","ketçap","mayonez","hardal","domates","salatalık","biber","limon","soda","meyve suyu","tencere yemeği","kıyma","tavuk","margarin","krema","turşu","şalgam"],
  "Banyoda Karşılaşabileceğin Şeyler": ["bornoz","havlu","paspas","şampuan","saç kremi","duş jeli","sabun","lif","kese","diş fırçası","diş macunu","tıraş bıçağı","tıraş köpüğü","tarak","saç kurutma makinesi","tartı","çamaşır sepeti","deterjan","yumuşatıcı","klozet fırçası","sıvı sabun","ayna","diş ipi","tırnak makası","banyo tuzu"],
  "Alet Çantasının Olmazsa Olmazları": ["çekiç","tornavida","yıldız tornavida","düz tornavida","pense","kargaburun","kontrol kalemi","ingiliz anahtarı","şerit metre","maket bıçağı","dübel","vida","çivi","matkap","matkap ucu","koli bandı","elektrik bandı","somun","pul","su terazisi","zımpara","sıcak silikon","yan keski","kilitli pense"],
  "Sabah Kahvaltısının Vazgeçilmezleri": ["simit","poğaça","açma","omlet","menemen","haşlanmış yumurta","peynir","zeytin","bal","kaymak","tereyağı","reçel","çokokrem","domates","salatalık","biber","sucuklu yumurta","krep","pankek","çay","portakal suyu","süt","boyoz","gevrek","pastırma"],
  "Sulu Yemek Çeşitleri": ["kuru fasulye","nohut","mercimek yemeği","taze fasulye","bezelye","ıspanak","türlü","karnıyarık","izmir köfte","orman kebabı","patlıcan musakka","bamya","pırasa","pazı sarması","biber dolması","kabak dolması","ekşili köfte","tas kebabı","güveç","patates oturtma"],
  "Mutfak Çekmecesinde Bulunanlar": ["kaşık","çatal","bıçak","tatlı kaşığı","servis kaşığı","kepçe","kevgir","spatula","çırpıcı","soyacak","tirbuşon","konserve açacağı","sarımsak ezici","rende","mutfak makası","maşa","oklava","merdane","nihale","huni","süzgeç","ölçü kabı"],
  "Arabanın Parçaları": ["motor","şanzıman","direksiyon","vites","lastik","jant","far","stop lambası","silecek","dikiz aynası","yan ayna","plaka","egzoz","radyatör","akü","amortisör","fren balatası","debriyaj","el freni","torpido","emniyet kemeri","tavan döşemesi","hava yastığı","korna"],
  "Ofis Masasında Bulunanlar": ["bilgisayar","mouse","klavye","monitör","mousepad","zımba","delgeç","ataş","kalemlik","kurşun kalem","tükenmez kalem","fosforlu kalem","ajanda","not defteri","post-it","hesap makinesi","kupa","zımba teli","cetvel","makas","bant makinesi","masa lambası","kulaklık","flash bellek"],
  "İnşaat ve Mühendislik Terimleri": ["beton","demir","çimento","kolon","kiriş","temel","tabla","kalıp","iskele","vinç","baret","yelek","şantiye","statik hesap","mimari proje","kazı","dolgu","tesviye","izolasyon","drenaj","menfez","prekast","ankraj","betoniyer"],
  "Piknik Sepetinde Neler Olur": ["örtü","termos","plastik tabak","karton bardak","çatal","bıçak","peçete","mangal","kömür","çıra","yelpaze","hamak","top","tavla","okey takımı","çekirdek","kilim","güneş kremi","böcek ilacı","ıslak mendil","çöp torbası","meyve","ekmek","su matarası"],
  "Deniz Kenarında Bulunanlar": ["kum","çakıl taşı","deniz yıldızı","yengeç","yosun","midye","şezlong","şemsiye","palet","şnorkel","deniz gözlüğü","can simidi","kolluk","deniz yatağı","havlu","terlik","plaj çantası","sörf tahtası","kova","kürek","iskele","fener","tekne","yelkenli"],
  "Bahçede Yetişen Bitki ve Ağaçlar": ["gül","papatya","lale","lavanta","nane","reyhan","maydanoz","domates","biber","patlıcan","asma","çam","zeytin ağacı","elma ağacı","limon ağacı","çim","sarmaşık","ortanca","sardunya","yasemin","aloe vera","biberiye"],
  "Gökyüzünde Görebileceğin Şeyler": ["güneş","ay","yıldız","bulut","uçak","helikopter","kuş","şimşek","yıldırım","gökkuşağı","uydu","sıcak hava balonu","martı","kartal","uçurtma","drone","meteor","sis","kar tanesi","duman"],
  "Kırtasiyeden Alınabilecekler": ["defter","kitap","kurşun kalem","boya kalemi","sulu boya","pastel boya","yapıştırıcı","el işi kağıdı","karton","pergel","gönye","iletki","silgi","kalemtıraş","oyun hamuru","fon kartonu","kaplık","etiket","klasör","telli dosya"],
  "Mühendislik & Doğa Bilimleri": ["matematik","fizik","kimya","geometri","statik","dinamik","mukavemet","termodinamik","akışkanlar mekaniği","metalurji","jeoloji","astronomi","biyoloji","genetik","ekoloji","izotop","molekül","atom","elektron","proton","nötron","kuantum","katalizör","reaksiyon","bileşik","element","periyodik tablo","polimer","alaşım","sürtünme","ivme","kütle","yerçekimi","eylemsizlik","tork","moment","vektör","matris","integral","türev","logaritma","algoritma","topografya","teodolit","nivo","lazer metre","rölöve","ölçek","kroki","parsel","imar","hakediş","metraj","keşif","şartname","ihale","müteahhit","taşeron","kolon","kiriş","temel","tabla","kalıp","iskele","vinç","baret","şantiye","beton","demir","çimento","agregat","şanzıman","motor","kumpas","mikrometre","rulman","hidrolik","pnömatik","vana","debi","basınç","gerilme","deformasyon","rezonans","sismik","fay hattı","zemin etüdü","drenaj","menfez","prekast","ankraj","betoniyer","teknik çizim","kesit","görünüş","perspektif","izofips","topoğrafya"],
  "Yazılım & Bilişim Teknolojileri": ["kodlama","programlama","algoritma","veri tabanı","sunucu","istemci","ağ","siber güvenlik","yapay zeka","makine öğrenmesi","derin öğrenme","veri analizi","bulut bilişim","işletim sistemi","işlemci","bellek","sabit disk","anakart","ekran kartı","yönlendirici","anahtar","güvenlik duvarı","şifreleme","sızma testi","kötü amaçlı yazılım","virüs","anti-virüs","veri madenciliği","büyük veri","blokzincir","kripto","akıllı sözleşme","arayüz","kaynak kodu","derleyici","kütüphane","çerçeve","nesne yönelimli","fonksiyon","değişken","döngü","koşul","dizi","indeks","sorgu","indeksleme","normalizasyon","yedekleme","senkronizasyon","api","entegrasyon","dağıtım","barındırma","alan adı","ip adresi","alt ağ","protokol","port","çerez","tarayıcı","e-posta","sunucu odası","kablolama","fiber optik","bant genişliği","gecikme","paket","yönlendirme","sanallaştırma","konteyner","docker","küme","mikroservis","mimari","tasarım kalıbı","hata ayıklama","test senaryosu","otomasyon","versiyon kontrolü","havuz","dal","birleştirme","çakışma","commit","push","pull","log","terminal","konsol","betik","yetkilendirme","kimlik doğrulama","iki faktörlü","oturum","belirteç","şablon","responsive"],
  "Hukuk & Kamu Yönetimi": ["anayasa","kanun","kararname","yönetmelik","tüzük","genelge","tebliğ","içtihat","emsal","doktrin","hukuk","adalet","mahkeme","hakim","savcı","avukat","katip","mübaşir","davacı","davalı","sanık","şüpheli","tanık","bilirkişi","müşteki","mağdur","suç","ceza","kabahat","beraat","mahkumiyet","tahliye","tutuklama","gözaltı","yakalama","ifade","sorgu","savunma","iddia","iddianame","mütalaa","hüküm","gerekçe","temyiz","istinaf","itiraz","teminat","kefalet","haciz","icra","ihtiyati tedbir","ihtarname","ihbar","dilekçe","vekaletname","azilname","noter","tescil","tapu","kadastro","kamulaştırma","imar affı","vergi","rüsum","harç","ceza hukuku","medeni hukuk","ticaret hukuku","idare hukuku","borçlar hukuku","miras hukuku","iş hukuku","sözleşme","taahhüt","fesih","ibra","tazminat","nafaka","velayet","vesayet","vasiyet","veraset","tereke","muris","varis","meşru","gayrimeşru","ehliyet","hak","borç","alacak","vade","temerrüt","mücbir sebep","kusur","ihmal","kasıt","cürüm"],
  "İktisat, Finans & Borsa": ["ekonomi","iktisat","makroekonomi","mikroekonomi","enflasyon","deflasyon","stagflasyon","devalüasyon","cari açık","bütçe","maliye","vergi","faiz","kur","döviz","parite","borsa","hisse senedi","tahvil","bono","fon","emtia","altın","gümüş","petrol","endeks","likidite","sermaye","portföy","temettü","sermaye artırımı","bedelli","bedelsiz","arz","talep","denge","piyasa","rekabet","tekel","oligopol","kartel","ithalat","ihracat","dış ticaret","gümrük","tarife","kota","teşvik","sübvansiyon","yatırım","tasarruf","tüketim","üretim","istihdam","işsizlik","büyüme","gayrisafi yurt içi hasıla","milli gelir","kalkınma","banka","kredi","mevduat","hesap","eft","havale","virman","provizyon","bloke","çek","senet","poliçe","bilanço","gelir tablosu","mizan","amortisman","aktif","pasif","özkaynak","borç","alacak","kâr","zarar","maliyet","ciro","hasılat","finansman","kaldıraç","marjin","arbitraj","spekülasyon","manipülasyon","aracı kurum","portföy yönetimi","yatırım danışmanlığı","risk yönetimi","hedge","opsiyon","vadeli işlem","türev piyasa"],
  "Tıp, Sağlık & Anatomi": ["anatomi","fizyoloji","patoloji","farmakoloji","cerrahi","dahiliye","pediatri","jinekoloji","nöroloji","kardiyoloji","onkoloji","psikiyatri","ortopedi","cildiye","üroloji","göz hastalıkları","kulak burun boğaz","anestezi","radyoloji","biyokimya","mikrobiyoloji","hücre","doku","organ","sistem","kemik","kas","eklem","kıkırdak","tendon","bağ","deri","epidermis","kılcal damar","arter","ven","kalp","akciğer","karaciğer","böbrek","mide","bağırsak","pankreas","dalak","safra kesesi","beyin","beyincik","omurilik","sinir","nöron","hormon","bez","hipofiz","tiroid","adrenalin","insülin","glukoz","kan","plazma","hemoglobin","alyuvar","akyuvar","kan pulcuğu","pıhtılaşma","tansiyon","nabız","ateş","solunum","semptom","teşhis","tanı","tedavi","reçete","ilaç","antibiyotik","analjezik","doz","endikasyon","kontrendikasyon","yan etki","alerji","enfeksiyon","bakteri","virüs","mantar","parazit","bağışıklık","aşı","serum","enjeksiyon","infüzyon","ameliyat","operasyon","neşter","dikiş","pansuman","röntgen","tomografi","emar","ultrason","biyopsi","tahlil"],
  "Edebiyat, Felsefe & Sosyal Bilimler": ["edebiyat","şiir","roman","hikaye","öykü","tiyatro","dram","trajedi","komedi","deneme","makale","eleştiri","biyografi","otobiyografi","anı","günlük","gezi yazısı","mülakat","röportaj","felsefe","metafizik","epistemoloji","etik","estetik","mantık","ontoloji","teoloji","mitoloji","sosyoloji","psikoloji","antropoloji","arkeoloji","tarih","coğrafya","dilbilim","filoloji","semiyotik","hermeneutik","rasyonalizm","empirizm","pozitivizm","nihilizm","egzistansiyalizm","idealizm","materyalizm","pragmatizm","fenomenoloji","realizm","romantizm","klasisizm","sembolizm","sürrealizm","modernizm","postmodernizm","yapısalcılık","hümanizm","rönesans","reform","aydınlanma","kültür","medeniyet","toplum","topluluk","birey","kimlik","norm","değer","gelenek","görenek","ritüel","paradigma","teori","kuram","hipotez","tez","antitez","sentez","diyalektik","rasyonel","irrasyonel","soyut","somut","nesnel","öznel","evrensel","yerel","algı","bilinç","bilinçaltı","ego","süperego","id","güdü","refleks","empati","sempati","manipülasyon","asimilasyon","entegrasyon","sosyalleşme"],
  "Ev ve Yaşam": ["peynir","zeytin","yumurta","süt","yoğurt","tereyağı","reçel","bal","salam","sucuk","sosis","ketçap","mayonez","hardal","domates","salatalık","biber","limon","soda","meyve suyu","kıyma","tavuk","margarin","krema","turşu","şalgam","bornoz","havlu","paspas","şampuan","saç kremi","duş jeli","sabun","lif","kese","diş fırçası","diş macunu","tıraş bıçağı","tıraş köpüğü","tarak","saç kurutma makinesi","tartı","çamaşır sepeti","deterjan","yumuşatıcı","klozet fırçası","sıvı sabun","ayna","diş ipi","tırnak makası","banyo tuzu","çekiç","tornavida","pense","kargaburun","kontrol kalemi","ingiliz anahtarı","şerit metre","maket bıçağı","dübel","vida","çivi","matkap","matkap ucu","koli bandı","elektrik bandı","somun","pul","su terazisi","zımpara","sıcak silikon","yan keski","kilitli pense","aspiratör","fırın tepsisi","buz kalıbı","dondurma","bezelye konservesi","mısır","süzme yoğurt","maydanoz","dereotu","nane","taze soğan","sarımsak","soğan","patates","havuç","brokoli","karnabahar","pırasa","ıspanak","mantar","avokado","ananas","çilek","muz","elma","armut","kavun","karpuz"],
  "Mutfak ve Lezzet": ["simit","poğaça","açma","omlet","menemen","haşlanmış yumurta","peynir","zeytin","bal","kaymak","tereyağı","reçel","çokokrem","domates","salatalık","biber","sucuklu yumurta","krep","pankek","çay","portakal suyu","süt","boyoz","gevrek","pastırma","kuru fasulye","nohut","mercimek yemeği","taze fasulye","bezelye","ıspanak","türlü","karnıyarık","izmir köfte","orman kebabı","patlıcan musakka","bamya","pırasa","pazı sarması","biber dolması","kabak dolması","ekşili köfte","tas kebabı","güveç","patates oturtma","kaşık","çatal","bıçak","tatlı kaşığı","servis kaşığı","kepçe","kevgir","spatula","çırpıcı","soyacak","tirbuşon","konserve açacağı","sarımsak ezici","rende","mutfak makası","maşa","oklava","merdane","nihale","huni","süzgeç","ölçü kabı","porselen tabak","kase","borcam","döküm tava","düdüklü tencere","cezve","çaydanlık","tost makinesi","blender","mikser","fritöz","kahve makinesi","ekmek kızartma makinesi","su ısıtıcısı","fırın kabı","mutfak tartısı","önlük","kurulama bezi","fırın eldiveni","buzluk poşeti","streç film","alüminyum folyo","kürdan","pipet","peçetelik","tuzluk","karabiberlik","şekerlik"],
  "Ulaşım ve Sokak": ["motor","şanzıman","direksiyon","vites","lastik","jant","far","stop lambası","silecek","dikiz aynası","yan ayna","plaka","egzoz","radyatör","akü","amortisör","fren balatası","debriyaj","el freni","torpido","emniyet kemeri","tavan döşemesi","hava yastığı","korna","trafik lambası","çöp kutusu","reklam panosu","yaya geçidi","rögar kapağı","ağaç","bank","kaldırım","elektrik direği","esnaf","metrobüs","vapur","tramvay","dolmuş","teleferik","marmaray","otobüs","metro","banliyö treni","feribot","kaporta","bagaj","güneşlik","silecek suyu","antifriz","kriko","stepne","ruhsat","kasko","sigorta","ehliyet","trafik polisi","radar","kavşak","üst geçit","alt geçit","tünel","otoban","emniyet şeridi","bariyer","levha","yön tabelası","durak","taksi","bisiklet yolu","scooter","motosiklet","kask","mont","eldiven","otopark","vale","benzinlik","mazot","lpg","şarj istasyonu","plaj","park","bahçe","çocuk parkı","kaydırak","salıncak","kum havuzu","büfe","bakkal","market","eczane","kasap","manav","fırın","pastane","kuaför","berber","cami","okul","hastane"],
  "İş, Mühendislik ve Eğitim": ["bilgisayar","mouse","klavye","monitör","mousepad","zımba","delgeç","ataş","kalemlik","kurşun kalem","tükenmez kalem","fosforlu kalem","ajanda","not defteri","post-it","hesap makinesi","kupa","zımba teli","cetvel","makas","bant makinesi","masa lambası","kulaklık","flash bellek","defter","kitap","kalemtıraş","silgi","boya kalemi","sulu boya","pastel boya","yapıştırıcı","el işi kağıdı","karton","pergel","gönye","iletki","oyun hamuru","fon kartonu","kaplık","etiket","klasör","telli dosya","beton","demir","çimento","kolon","kiriş","temel","tabla","kalıp","iskele","vinç","baret","yelek","şantiye","statik hesap","mimari proje","kazı","dolgu","tesviye","izolasyon","drenaj","menfez","prekast","ankraj","betoniyer","autocad","sketchup","teknik çizim","ölçek","kumpas","lazer metre","nivo","teodolit","harita","parsel","imar","ruhsat","hakediş","keşif","metraj","şartname","ihale","müteahhit","taşeron","usta","işçi","tekniker","mühendis","mimar","müşavir","denetim","rapor","tutanak","iş güvenliği","ilk yardım çantası","yangın tüpü","jeneratör","kompresör"],
  "Hobi ve Eğlence": ["örtü","termos","plastik tabak","karton bardak","çatal","bıçak","peçete","mangal","kömür","çıra","yelpaze","hamak","top","tavla","okey takımı","çekirdek","kilim","güneş kremi","böcek ilacı","ıslak mendil","çöp torbası","meyve","ekmek","su matarası","kum","çakıl taşı","deniz yıldızı","yengeç","yosun","midye","şezlong","şemsiye","palet","şnorkel","deniz gözlüğü","can simidi","kolluk","deniz yatağı","havlu","terlik","plaj çantası","sörf tahtası","kova","kürek","iskele","fener","tekne","yelkenli","voleybol","tenis","yüzme","okçuluk","güreş","eskrim","hentbol","karate","jimnastik","bisiklet","futbol","basketbol","masa tenisi","badminton","dağcılık","kamp","çadır","uyku tulumu","mat","sırt çantası","el feneri","pusula","saklambaç","yakalamaca","körebe","istop","yakan top","yerden yüksek","seksek","misket","beş taş","isim şehir","dokuz taş","dama","satranç","puzzle","lego","boyama kitabı","masal kitabı","çizgi film","sinema","tiyatro","konser","müze","sergi","fotoğraf makinesi","enstrüman","gitar","piyano","bağlama","keman","flüt"]
};

const CATEGORY_EMOJI = {
  "Buzdolabının İçinde Bulunanlar": "🧊",
  "Banyoda Karşılaşabileceğin Şeyler": "🛁",
  "Alet Çantasının Olmazsa Olmazları": "🔧",
  "Sabah Kahvaltısının Vazgeçilmezleri": "🍳",
  "Sulu Yemek Çeşitleri": "🍲",
  "Mutfak Çekmecesinde Bulunanlar": "🍴",
  "Arabanın Parçaları": "🚗",
  "Ofis Masasında Bulunanlar": "💼",
  "İnşaat ve Mühendislik Terimleri": "🏗️",
  "Piknik Sepetinde Neler Olur": "🧺",
  "Deniz Kenarında Bulunanlar": "🏖️",
  "Bahçede Yetişen Bitki ve Ağaçlar": "🌿",
  "Gökyüzünde Görebileceğin Şeyler": "☁️",
  "Kırtasiyeden Alınabilecekler": "✏️",
  "Mühendislik & Doğa Bilimleri": "🔬",
  "Yazılım & Bilişim Teknolojileri": "💻",
  "Hukuk & Kamu Yönetimi": "⚖️",
  "İktisat, Finans & Borsa": "📈",
  "Tıp, Sağlık & Anatomi": "🩺",
  "Edebiyat, Felsefe & Sosyal Bilimler": "📚",
  "Ev ve Yaşam": "🏠",
  "Mutfak ve Lezzet": "🍔",
  "Ulaşım ve Sokak": "🛣️",
  "İş, Mühendislik ve Eğitim": "🏗️",
  "Hobi ve Eğlence": "⚽"
};

/* Türkçe küçük harfe çevirir, kenar boşluklarını atar, iç boşlukları teke indirir.
   Şapkalı harfler (â, î, û) düz harfe iner: "kâğıt" ile "kağıt" aynı kelime sayılır. */
function normalizeWord(w){
  return String(w == null ? "" : w).trim().toLocaleLowerCase("tr-TR")
    .replace(/â/g, "a").replace(/î/g, "i").replace(/û/g, "u")
    .replace(/\s+/g, " ");
}

const CATEGORY_LOOKUP = {};
Object.keys(CATEGORY_WORDS).forEach(cat => {
  CATEGORY_LOOKUP[cat] = new Set(CATEGORY_WORDS[cat].map(normalizeWord));
});

function isInCategory(category, word){
  const lookup = CATEGORY_LOOKUP[category];
  if(!lookup) return false; // bilinmeyen kategori: yerelde kabul yok, AI'ya sorulur
  return lookup.has(normalizeWord(word));
}

/* Yerel ön denetim: kelime bu kategorinin listesindeyse kesin kabul (true), değilse bilinmiyor (null → AI'ya sor).
   v4.11'de başka bir kategorinin listesinde geçen kelime kesin reddediliyordu; listeler örtüştüğü için doğru
   kelimeler düşüyordu (ör. "Sabah Kahvaltısı"nda "ekmek", yalnız "Piknik" listesinde olduğu için). DENETIM.md › K-07. */
function localCategoryPreCheck(category, word){
  if(!category) return null;
  const lower = normalizeWord(word);
  if(!lower) return null;
  if(CATEGORY_LOOKUP[category] && CATEGORY_LOOKUP[category].has(lower)) return true;
  return null;
}

/* Zincir modu harfleri: boşluk, tire ve kesme işareti atılır; şapkalı harf düz harfe iner. */
function harfAlani(word){
  return normalizeWord(word).replace(/[\s'’-]/g, "");
}
function turkishLastLetter(word){
  const c = harfAlani(word);
  return c ? Array.from(c).slice(-1)[0] : null;
}
function turkishFirstLetter(word){
  const c = harfAlani(word);
  return c ? Array.from(c)[0] : null;
}
/* Zincirde sıradaki harf: en son kabul edilen kelimenin son harfi. Türkçede "ğ" ile kelime başlamaz;
   "ğ" ile biten kelimeden sonra bir önceki harf istenir (ör. "dağ" → "a"). */
function chainLetterFor(word){
  const c = harfAlani(word);
  if(!c) return null;
  const harfler = Array.from(c);
  let i = harfler.length - 1;
  while(i > 0 && harfler[i] === "ğ") i--;
  return harfler[i];
}
function getChainNextLetter(wordsObj){
  if(!wordsObj) return null;
  const arr = Object.values(wordsObj).filter(w => w && w.valid === true);
  if(arr.length === 0) return null;
  // 1.0.1: aynı zaman damgasında iki istemci aynı sırayı görsün (kelimeye göre ikincil sıralama)
  arr.sort((a,b) => ((b.ts||0) - (a.ts||0)) || String(a.text).localeCompare(String(b.text), "tr"));
  return chainLetterFor(arr[0].text);
}
function isWordInLocalDict(word){
  const norm = normalizeWord(word);
  for(const cat of Object.keys(CATEGORY_LOOKUP)){
    if(CATEGORY_LOOKUP[cat].has(norm)) return true;
  }
  return false;
}

/* Gönderilen kelimenin biçim denetimi (uzunluk ve harfler) — Worker da aynı sınırı uygular (worker/worker.js). */
const KELIME_EN_UZUN = 30;
function kelimeBicimiGecerli(raw){
  const s = String(raw == null ? "" : raw).trim();
  // 1.0.1: en az iki harf şart (yalnız tire ve boşluktan oluşan "- -" geçiyordu)
  return s.length >= 2 && s.length <= KELIME_EN_UZUN && /^[a-zA-ZçğıöşüâîûÇĞİÖŞÜÂÎÛ\s-]+$/.test(s)
    && (s.match(/[a-zA-ZçğıöşüâîûÇĞİÖŞÜÂÎÛ]/g) || []).length >= 2;
}

/* Kullanıcı adı: 3–14 küçük harf/rakam (veritabanı kuralı da aynısını ister: firebase/database.rules.json) */
function kullaniciAdiGecerli(ad){
  return /^[a-z0-9]{3,14}$/.test(String(ad == null ? "" : ad));
}

function isMatchOver(matchData){
  if(!matchData) return false;
  const total = matchData.totalRounds || 10;
  const p1 = matchData.p1Wins || 0, p2 = matchData.p2Wins || 0;
  const completed = (matchData.completedRounds || []).length;
  if(matchData.mode === "duel"){
    const need = Math.ceil(total / 2); // 3 roundda 2
    if(p1 >= need || p2 >= need) return true;
  }
  return completed >= total;
}

if(typeof module !== "undefined" && module.exports){
  module.exports = { CATEGORIES, CATEGORY_WORDS, CATEGORY_EMOJI, CATEGORY_LOOKUP, normalizeWord, isInCategory,
    localCategoryPreCheck, turkishLastLetter, turkishFirstLetter, chainLetterFor, getChainNextLetter, isWordInLocalDict,
    kelimeBicimiGecerli, kullaniciAdiGecerli, isMatchOver, KELIME_EN_UZUN };
}
