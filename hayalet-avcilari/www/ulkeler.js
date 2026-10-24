/* ============================================================
   HAYALET AVCILARI — DÜNYA TURU: ÜLKELER (3.14.0)
   51 ülke: BM World Population Prospects 2024'e göre en kalabalık 50 ülke (2025 ve 2026 tahminlerinde aynı küme) +
   kullanıcının isteğiyle Filistin. Rota Türkiye'den başlar, kıta kıta komşudan komşuya gider; rotadaki sıra Dünya
   Turu'nda bölüm numarasıdır (zorluk normal oyunun aynı bölümüyle aynı).
   Her ülke: aile (duvar, sınır, su kıyısı, zemin: ulke-aileleri.js), iki obje (ulke-objeleri-*.js), palet (zemin koyu:
   bağıl parlaklık ≤ 0,08; renkler doğadan ve mimariden, bayraktan değil), boss kostümü (kostumler.js).
   Adlar cümle içi yazımla: özel adlar büyük harfle ("Eyfel Kulesi"), cins adlar küçük ("lavanta tarlası").
   Tasarım: docs/superpowers/specs/2026-10-24-hayalet-ulkeler-design.md §4
   ============================================================ */
(function () {
  const P = (zemin, desen, duvar, duvarKoyu, vurgu1, vurgu2) => ({ zemin, desen, duvar, duvarKoyu, vurgu1, vurgu2 });
  const K = (baslik, giysi, desen, renk, aksesuar = [], ayakkabi) =>
    (ayakkabi ? { baslik, giysi, desen, renk, aksesuar, ayakkabi } : { baslik, giysi, desen, renk, aksesuar });
  const O = (ressam, ad, bicim) => (bicim ? { ressam, ad, bicim } : { ressam, ad });
  const U = (kod, aile, ad, bossAd, obje1, obje2, palet, kostum) => ({ kod, aile, ad, bossAd, obje1, obje2, palet, kostum });

  const ULKELER = [
    // ---------- Avrupa ----------
    U("TR", "KS", t("Türkiye"), t("Efe hayalet"), O("periBacalari", t("peri bacaları")), O("laleBahcesi", t("lale bahçesi")),
      P("#3a2a1e", "#5a4230", "#c9a27a", "#8a6a4a", "#2a7fbf", "#d6453d"),
      K("efe", "ceket", "nakis", ["#2b2b3a", "#c8302a", "#e8c35a"], ["kusak"])),
    U("UA", "K", t("Ukrayna"), t("Vışıvankalı hayalet"), O("aycicegiTarlasi", t("ayçiçeği tarlası")), O("samanCatiliEv", t("saman çatılı beyaz ev")),
      P("#26331a", "#3d4f2a", "#b9a98a", "#7d6f55", "#f5c518", "#efe9da"),
      K("cicekTaci", "ceket", "nakis", ["#f4f1ea", "#c8302a", "#2a2a2a"])),
    U("PL", "K", t("Polonya"), t("Krakowiak hayalet"), O("wawelEjderi", t("Wawel ejderi")), O("leylekYuvalari", t("leylek yuvaları")),
      P("#2a2f1f", "#3f4630", "#a8553a", "#6e3424", "#3f7d3a", "#d9d4c7"),
      K("krakuska", "ceket", "nakis", ["#2f4fa0", "#c8302a", "#e8c35a"])),
    U("DE", "K", t("Almanya"), t("Tirol şapkalı hayalet"), O("gugukluSaatEvi", t("guguklu saat evi")), O("yarimAhsapEvler", t("yarım ahşap evler")),
      P("#1f2a1c", "#33402c", "#9a8f80", "#5f574d", "#6b4226", "#e9dfc8"),
      K("tirol", "askili", "duz", ["#6b4a2a", "#2f5f3a", "#e9dfc8"])),
    U("GB", "K", t("Birleşik Krallık"), t("Kiltli hayalet"), O("telefonKulubeleri", t("kırmızı telefon kulübeleri")), O("saatKulesi", t("saat kulesi")),
      P("#222a24", "#36403a", "#8e8d86", "#5a5953", "#c8102e", "#d9c27a"),
      K("tam", "sarili", "ekose", ["#1f4f8a", "#2f6f3a", "#c8302a"])),
    U("FR", "K", t("Fransa"), t("Bereli hayalet"), O("eyfelKulesi", t("Eyfel Kulesi")), O("lavantaTarlasi", t("lavanta tarlası")),
      P("#2a2236", "#3e3350", "#d8cbb0", "#9c8f74", "#8e6cc2", "#5a5f66"),
      K("bere", "ceket", "cizgili", ["#1f2f5a", "#f4f1ea", "#c8302a"], ["fular"])),
    U("IT", "K", t("İtalya"), t("Maskeli karnaval hayaleti"), O("kolezyum", t("Kolezyum")), O("gondolIskelesi", t("gondollu kanal iskelesi")),
      { ...P("#33241c", "#4a3628", "#c97b55", "#8a4f33", "#2f6d8f", "#e8d8b8"), mazgal: "kirlangic" },
      K("ucKose", "panco", "duz", ["#2a2a3a", "#c8a24a", "#f4f1ea"], ["maske"])),
    U("ES", "K", t("İspanya"), t("Flamenkocu hayalet"), O("yelDegirmenleri", t("La Mancha yel değirmenleri")), O("aslanliCesme", t("Elhamra'nın Aslanlı Çeşmesi")),
      P("#3a2c18", "#523f24", "#d6a35c", "#94693a", "#f4efe6", "#3a6ea5"),
      K("cicekToka", "elbise", "puantiye", ["#c8302a", "#f4f1ea", "#e8c35a"], ["yelpaze"])),
    // ---------- Afrika ----------
    U("MA", "KP", t("Fas"), t("Cellabeli hayalet"), O("maviSokaklar", t("Şefşavan'ın mavi sokakları")), O("fenerliCarsi", t("fenerli çarşı tezgâhı")),
      P("#3b2418", "#553525", "#c4743f", "#864a26", "#3d7fc4", "#e0a83a"),
      K("kapuson", "entari", "cizgili", ["#7a5a3a", "#e8d8b8", "#e8c35a"], [], "babus")),
    U("DZ", "KP", t("Cezayir"), t("Karakoulu hayalet"), O("sahraKumullari", t("Sahra kumulları")), O("kayaKemerleri", t("Tassili n'Ajjer kaya kemerleri"), "kaya"),
      P("#3f2a15", "#5a3e22", "#d3a26a", "#8f6a3f", "#b5562f", "#f1ece2"),
      K("yok", "ceket", "nakis", ["#5a1f3a", "#e8c35a", "#2a2a2a"])),
    U("CI", "SH", t("Fildişi Sahili"), t("Pagneli hayalet"), O("kakaoBahcesi", t("kakao bahçesi")), O("filAilesi", t("fil ailesi")),
      P("#3a1f14", "#55301f", "#b8653c", "#7a3f22", "#2e7d32", "#e8a33d"),
      K("basBagi", "sarili", "batik", ["#e07b2a", "#2f6f9f", "#f2c94c"])),
    U("GH", "SH", t("Gana"), t("Kenteli hayalet"), O("kenteTezgahi", t("kente dokuma tezgâhı")), O("kanopiKoprusu", t("Kakum kanopi köprüsü")),
      P("#2e2216", "#46331f", "#a86a45", "#6f442b", "#e3b021", "#2f7a3b"),
      K("yok", "sarili", "geometrik", ["#e3b021", "#2f7a3b", "#c8302a"])),
    U("NG", "SH", t("Nijerya"), t("Agbadalı hayalet"), O("zumaKayasi", t("Zuma Kayası"), "kaya"), O("konusanDavullar", t("konuşan davullar")),
      P("#24301c", "#3a4a2c", "#a66b45", "#6b4228", "#7a7f87", "#c9a15b"),
      K("fila", "entari", "nakis", ["#2f6f9f", "#f4f1ea", "#e8c35a"])),
    U("CD", "SV", t("Kongo DC"), t("Kuba desenli hayalet"), O("okapiOrmani", t("okapi ormanı")), O("piroglar", t("Kongo Nehri pirogları")),
      P("#18291a", "#29402c", "#8a6a44", "#574129", "#2f7f7a", "#c8b27a"),
      K("kubaBaslik", "sarili", "geometrik", ["#8a5a2a", "#2a2a2a", "#e8d8b8"])),
    U("AO", "SV", t("Angola"), t("Bessanganalı hayalet"), O("kalandulaSelalesi", t("Kalandula Şelalesi")), O("welwitschia", t("welwitschia bitkisi")),
      P("#2b2a1c", "#424030", "#9c7a52", "#654c33", "#4da3c7", "#6b8f3a"),
      K("basBagi", "elbise", "batik", ["#c8302a", "#f2c94c", "#2f6f9f"])),
    U("ZA", "SV", t("Güney Afrika"), t("Boncuklu hayalet"), O("masaDagi", t("Masa Dağı"), "kaya"), O("penguenler", t("Afrika penguenleri")),
      P("#23282a", "#384044", "#8f7a5e", "#5d4f3c", "#d4a14a", "#1f2a33"),
      K("isicholo", "sarili", "boncuk", ["#c8302a", "#2a2a2a", "#f2c94c"], ["boncukluYaka"])),
    U("MZ", "SV", t("Mozambik"), t("Capulanalı hayalet"), O("dauYelkenlileri", t("dau yelkenlileri")), O("kajuAgaclari", t("kaju ağaçları")),
      P("#2a2a1a", "#40402a", "#9b7d55", "#63502f", "#2a9d8f", "#e9d7b3"),
      K("basBagi", "sarili", "batik", ["#2a9d8f", "#e07b2a", "#f4f1ea"])),
    U("MG", "SV", t("Madagaskar"), t("Lambalı hayalet"), O("baobabCaddesi", t("Baobab Caddesi")), O("lemurlar", t("lemurlar")),
      P("#3a2016", "#553024", "#a3734e", "#6a4a32", "#b4553a", "#d9d9d9"),
      K("satroka", "panco", "duz", ["#f4f1ea", "#d9c27a", "#8a6a4a"])),
    U("TZ", "SV", t("Tanzanya"), t("Kangalı hayalet"), O("kilimanjaro", t("Kilimanjaro"), "kaya"), O("oymaKapilar", t("Zanzibar oyma kapıları")),
      P("#2f2a18", "#474027", "#9a7b4f", "#624e31", "#f3f6f8", "#6b4f2a"),
      K("basBagi", "sarili", "batik", ["#7a3fa0", "#f2c94c", "#2a2a2a"])),
    U("UG", "SV", t("Uganda"), t("Gomesili hayalet"), O("dagGorilleri", t("dağ gorilleri")), O("murchisonSelalesi", t("Murchison Şelalesi")),
      P("#1d2e1b", "#2f472c", "#8c6b46", "#5a452d", "#3b5f3a", "#8fc3d8"),
      K("yok", "elbise", "duz", ["#d9a0c0", "#f4f1ea", "#8a3a5a"], ["kusak"])),
    U("KE", "SV", t("Kenya"), t("Maasai şukalı hayalet"), O("zurafalarAkasya", t("zürafalar ve akasya")), O("flamingoGolu", t("flamingolu göl")),
      P("#302816", "#483d24", "#9e7c4c", "#654f30", "#f28cab", "#c79a3a"),
      K("boncukBant", "panco", "ekose", ["#c8302a", "#2a2a6a", "#f2c94c"], ["boncukluYaka"])),
    U("ET", "SV", t("Etiyopya"), t("Habesha hayalet"), O("aksumTaslari", t("Aksum dikili taşları")), O("geladaMaymunlari", t("gelada maymunları")),
      P("#2a2a1e", "#403f2d", "#8b7a62", "#5a4f3f", "#8a5a3a", "#d9cbb0"),
      K("yok", "entari", "nakis", ["#f4f1ea", "#2f8f5a", "#e8c35a"], ["sal"])),
    U("SD", "KP", t("Sudan"), t("İmmalı hayalet"), O("meroePiramitleri", t("Meroe piramitleri")), O("devePazari", t("deve pazarı")),
      P("#3a2716", "#533a22", "#c08d55", "#7f5c37", "#8a5a3a", "#e7e1d4"),
      K("imma", "entari", "duz", ["#f4f1ea", "#d9d4c7", "#8a6a4a"], ["sal"], "markub")),
    U("EG", "KP", t("Mısır"), t("Firavun hayalet"), O("gizePiramitleri", t("Gize piramitleri ve Sfenks")), O("felukalar", t("Nil'de feluka yelkenlileri")),
      P("#3b2b17", "#554024", "#d4b277", "#937a4f", "#2f8fb3", "#e8c35a"),
      K("nemes", "sarili", "duz", ["#f4f1ea", "#2a5fa0", "#e8c35a"], ["boncukluYaka"])),
    // ---------- Asya ----------
    U("YE", "KP", t("Yemen"), t("Meşeddeli hayalet"), O("ejderKaniAgaclari", t("Sokotra ejder kanı ağaçları")), O("kuleEvler", t("Sana'a kule evleri")),
      P("#33241a", "#4a3526", "#9a5a3c", "#643a27", "#f1ece4", "#3f8f5a"),
      K("mesedde", "sarili", "cizgili", ["#3a4a6a", "#c8a24a", "#f4f1ea"], ["sal"])),
    U("SA", "KP", t("Suudi Arabistan"), t("Şimaglı hayalet"), O("hurmaBahcesi", t("hurma bahçesi")), O("filKayasi", t("AlUla Fil Kayası"), "kaya"),
      P("#3a2a19", "#534026", "#c99a62", "#8a6740", "#4f7d3a", "#b5703f"),
      K("simag", "entari", "duz", ["#f4f1ea", "#c8302a", "#2a2a2a"])),
    U("PS", "KS", t("Filistin"), t("Tatreezli hayalet"), O("zeytinBahcesi", t("zeytin bahçesi")), O("hayatAgaciMozaigi", t("Hayat Ağacı mozaiği")),
      { ...P("#2c2a1f", "#423f30", "#d8c9a3", "#9a8d6e", "#7d8f4e", "#b22c2c"), kusak: "#b22c2c" },
      K("yok", "entari", "nakis", ["#2a2a2a", "#b22c2c", "#e8c35a"])),
    U("IQ", "KS", t("Irak"), t("Biştli hayalet"), O("mudhifEvleri", t("kamış mudhif evleri")), O("senasilBalkonlar", t("şenaşil ahşap balkonlar")),
      P("#2a2a1b", "#403f2a", "#b8875a", "#7a5a3a", "#c9b27a", "#2f6f8f"),
      K("simag", "entari", "duz", ["#f4f1ea", "#2a2a2a", "#8a5a2a"], ["pelerin"])),
    U("IR", "KS", t("İran"), t("Kaşkay hayalet"), O("sioseKopru", t("Siose Pol köprüsü")), O("ruzgarKuleleri", t("Yezd rüzgâr kuleleri")),
      P("#2a2420", "#3f3630", "#c8a27a", "#8a6c4f", "#2a8fb8", "#e0b84f"),
      K("kece", "entari", "duz", ["#8a6a4a", "#5a4a3a", "#e8c35a"], ["kusak"])),
    U("UZ", "KS", t("Özbekistan"), t("Çapanlı hayalet"), O("ipekYoluKervani", t("İpek Yolu kervanı")), O("kavunPazari", t("kavun pazarı")),
      P("#30281c", "#463b2a", "#c9a06a", "#8a6b44", "#1f7fb0", "#e8c84a"),
      K("doppi", "entari", "cizgili", ["#2f4fa0", "#c8302a", "#2f8f5a"], ["kusak"])),
    U("AF", "KS", t("Afganistan"), t("Kuçi hayalet"), O("ucurtmaTepesi", t("uçurtmalı tepe")), O("narBahcesi", t("nar bahçesi")),
      P("#2b2620", "#403830", "#a98a68", "#6f5a44", "#c2264b", "#3aa0d8"),
      K("yok", "elbise", "nakis", ["#c8302a", "#2a2a6a", "#e8c35a"])),
    U("PK", "GA", t("Pakistan"), t("Ajrak şallı hayalet"), O("susluKamyonlar", t("süslü kamyonlar")), O("kayisiBahcesi", t("Hunza kayısı bahçesi")),
      P("#2a2a22", "#3f3f33", "#b0523a", "#74331f", "#f4b400", "#e88db0"),
      K("sindhi", "entari", "duz", ["#f4f1ea", "#8a2a2a", "#2a2a6a"], ["sal"])),
    U("IN", "GA", t("Hindistan"), t("Sarili hayalet"), O("hawaMahal", t("Hawa Mahal")), O("lotusGoleti", t("lotus göleti ve tavus kuşları")),
      P("#2e2025", "#463039", "#d0717a", "#8e4850", "#1f8a8a", "#f2c94c"),
      K("yok", "sarili", "nakis", ["#e0457a", "#f2c94c", "#2a8a8a"])),
    U("BD", "GA", t("Bangladeş"), t("Lungili hayalet"), O("susluRiksalar", t("süslü rikşalar")), O("sundarbans", t("Sundarbans ve Bengal kaplanı")),
      { ...P("#1d2a20", "#2f4232", "#a65a3e", "#6b3a28", "#e07b2a", "#2f8f5a"), malzeme: "tugla" },
      K("yok", "sarili", "ekose", ["#2f6f9f", "#f4f1ea", "#c8302a"], ["sal"])),
    U("MM", "GDA", t("Myanmar"), t("Longyili hayalet"), O("inleBalikcilari", t("Inle Gölü balıkçıları")), O("patheinSemsiyeleri", t("Pathein şemsiyeleri")),
      P("#1e2a26", "#30413b", "#a07a4c", "#65502f", "#d94f3a", "#3f8fa8"),
      K("gaungBaung", "sarili", "ekose", ["#5a2a6a", "#f4f1ea", "#e8c35a"])),
    U("TH", "GDA", t("Tayland"), t("Chut Thai hayalet"), O("yuzenPazar", t("yüzen pazar")), O("tukTuk", t("tuk-tuk")),
      P("#1f2a20", "#304230", "#9c7748", "#634c2d", "#f28c28", "#2aa3a3"),
      K("yok", "sarili", "geometrik", ["#c8302a", "#e8c35a", "#2a6a5a"], ["sal"])),
    U("MY", "GDA", t("Malezya"), t("Tanjaklı hayalet"), O("petronasKuleleri", t("Petronas İkiz Kuleleri")), O("rafflesia", t("Rafflesia çiçeği")),
      P("#18291f", "#283f30", "#8f7b5a", "#5b4d38", "#b9c2cc", "#c0392b"),
      K("tanjak", "ceket", "duz", ["#2a6a8a", "#e8c35a", "#2a2a2a"], ["kusak"])),
    U("ID", "GDA", t("Endonezya"), t("Batikli hayalet"), O("komodoEjderleri", t("Komodo ejderleri")), O("pirincTeraslari", t("pirinç terasları")),
      P("#1c2b1b", "#2e442c", "#8a7a52", "#5a4f35", "#7da84a", "#8a7a6a"),
      K("blangkon", "ceket", "batik", ["#6a4a2a", "#e8d8b8", "#2a2a2a"])),
    U("PH", "GDA", t("Filipinler"), t("Barong hayalet"), O("cikolataTepeleri", t("Çikolata Tepeleri"), "kaya"), O("jeepney", t("jeepney")),
      P("#232a1a", "#383f2a", "#937a50", "#5e4e33", "#7a5230", "#3a7bd5"),
      K("salakot", "ceket", "nakis", ["#f4f1ea", "#e8e2c8", "#c8a24a"])),
    U("VN", "GDA", t("Vietnam"), t("Ao dai'li hayalet"), O("haLongKorfezi", t("Ha Long Körfezi")), O("hoiAnFenerleri", t("Hoi An fenerleri")),
      P("#1a2a2a", "#2b4040", "#8e7a58", "#5c4f39", "#e8b23a", "#3d8f8a"),
      K("nonLa", "elbise", "duz", ["#f4f1ea", "#3a7a5a", "#e8c35a"])),
    U("CN", "DA", t("Çin"), t("Tang ceketli hayalet"), O("pandalar", t("pandalar ve bambu")), O("ejderDansi", t("ejder dansı")),
      P("#22261f", "#363b31", "#8f8a7e", "#5c584f", "#c8302a", "#3a6b4a"),
      K("yok", "ceket", "duz", ["#c8302a", "#e8c35a", "#2a2a2a"], ["fener"])),
    U("KR", "DA", t("Güney Kore"), t("Hanboklu hayalet"), O("hanokEvleri", t("hanok evleri")), O("onggiKupleri", t("kimçi küpleri")),
      P("#23262a", "#373b41", "#a8a39a", "#6c6862", "#5a3a2a", "#2f7f6f"),
      K("gat", "kimono", "duz", ["#f4f1ea", "#e05a7a", "#2a8a8a"])),
    U("JP", "DA", t("Japonya"), t("Kimonolu hayalet"), O("kirazAgaclari", t("kiraz ağaçları")), O("fujiDagi", t("Fuji Dağı"), "kaya"),
      P("#1f2a24", "#314038", "#d9d5cc", "#4a4a4a", "#f4a6c0", "#2d3a4a"),
      K("yok", "kimono", "nakis", ["#2a4a8a", "#f4a6c0", "#e8c35a"], ["yelpaze"], "geta")),
    U("RU", "K", t("Rusya"), t("Kokoşnikli hayalet"), O("matruskalar", t("matruşka bebekleri")), O("izbaEvi", t("oymalı ahşap izba")),
      { ...P("#22261f", "#363b31", "#a8463a", "#6c2c24", "#2f5fa0", "#e8c35a"), mazgal: "kirlangic" },
      K("kokosnik", "elbise", "nakis", ["#c8302a", "#e8c35a", "#2f5fa0"])),
    // ---------- Amerika ----------
    U("CA", "KA", t("Kanada"), t("Oduncu hayalet"), O("akcaagacOrmani", t("akçaağaç ormanı ve şurup")), O("kunduzBaraji", t("kunduz barajı")),
      P("#1d2a21", "#2e4233", "#8b6a45", "#5a432b", "#c8402a", "#2f6f8f"),
      K("kurk", "ceket", "ekose", ["#c8302a", "#2a2a2a", "#f2c94c"], ["kusak"])),
    U("US", "KA", t("ABD"), t("Kovboy hayalet"), O("ozgurlukHeykeli", t("Özgürlük Heykeli")), O("buyukKanyon", t("Büyük Kanyon"), "kaya"),
      P("#2a2420", "#3f3630", "#8f6a48", "#5e452f", "#5aa58f", "#c0643a"),
      K("kovboy", "ceket", "duz", ["#8a5a3a", "#2f5fa0", "#c8302a"], ["bandana"], "cizme")),
    U("MX", "LA", t("Meksika"), t("Charro hayalet"), O("papelPicadoPazari", t("papel picado süslü pazar")), O("ajoloteGoleti", t("ajolote göleti")),
      P("#2e2219", "#453325", "#e08a3c", "#9a5a24", "#d63a7a", "#2fa3a0"),
      K("sombrero", "ceket", "nakis", ["#2a2a2a", "#e8c35a", "#c8302a"])),
    U("CO", "LA", t("Kolombiya"), t("Vueltiao şapkalı hayalet"), O("mumPalmiyeleri", t("Kokora mum palmiyeleri")), O("cartagenaEvleri", t("Cartagena'nın balkonlu evleri")),
      P("#1e2a1f", "#2f4231", "#e8b84a", "#a07a28", "#3a8f5a", "#d24a6a"),
      K("vueltiao", "panco", "cizgili", ["#8a6a4a", "#f4f1ea", "#2a2a2a"])),
    U("PE", "LA", t("Peru"), t("Chullolu hayalet"), O("machuPicchu", t("Machu Picchu terasları")), O("lamalar", t("lamalar")),
      P("#262a20", "#3a4032", "#8f8a78", "#5c584a", "#c8402a", "#e8c35a"),
      K("chullo", "panco", "geometrik", ["#c8302a", "#f2c94c", "#2a6a8a"])),
    U("BR", "LA", t("Brezilya"), t("Frevocu hayalet"), O("amazonKuslari", t("Amazon tukanları ve araları")), O("sekerSomunu", t("Şeker Somunu Dağı")),
      P("#16291b", "#26402b", "#e0a050", "#9a6a2a", "#1f8f5a", "#f2c94c"),
      K("yok", "elbise", "geometrik", ["#f2c94c", "#2f8f5a", "#c8302a"], ["semsiye"])),
    U("AR", "LA", t("Arjantin"), t("Gaucho hayalet"), O("peritoMoreno", t("Perito Moreno Buzulu")), O("caminito", t("Caminito'nun renkli evleri")),
      P("#1f2730", "#313b47", "#4a90c8", "#2a5f8a", "#d8eef8", "#e8b03a"),
      K("boina", "panco", "cizgili", ["#6a4a2a", "#e8d8b8", "#2a2a2a"], ["mate"])),
  ];
  ULKELER.forEach((u, i) => {
    u.sira = i + 1;
    u.kita = i < 8 ? "avrupa" : i < 24 ? "afrika" : i < 44 ? "asya" : "amerika";
  });
  const kodla = new Map(ULKELER.map((u) => [u.kod, u]));

  // k. ülke (1..51'e sınırlanır)
  function ulkeSirada(k) {
    const i = Math.max(1, Math.min(ULKELER.length, Math.round(Number(k) || 1)));
    return ULKELER[i - 1];
  }
  function ulkeKodla(kod) { return kodla.get(kod) || null; }
  // getTheme() ile aynı alanlar (normal oyunun LEVEL_THEMES biçimi); su her ülkede aynı mavi (3.13.0 kuralı)
  const _temalar = new Map();
  function ulkeTemasi(u) {
    if (!_temalar.has(u.kod)) {
      _temalar.set(u.kod, { name: u.ad, floor: u.palet.zemin, grid: u.palet.desen, wall: u.palet.duvar, wallDark: u.palet.duvarKoyu,
        waterTop: "#1e7fd6", waterBot: "#0a3a8a" });
    }
    return _temalar.get(u.kod);
  }
  // "✈️ 6. Fransa — Eyfel Kulesi ve lavanta tarlası"
  function ulkeTanitimi(u) {
    return t("✈️ {sira}. {ulke} — {obje1} ve {obje2}", { sira: u.sira, ulke: u.ad, obje1: u.obje1.ad, obje2: u.obje2.ad });
  }
  // Engel biçim seti (engeller.js engelOlustur): iç duvar ailenin biçim ailesinden, objeler "yama" (kaya biçimli objeler
  // "kaya"). Bilinmeyen kod ya da eksik aile kale duvarına düşer.
  function ulkeBicimSeti(kod) {
    const u = ulkeKodla(kod), a = u && window.ULKE_AILELERI[u.aile];
    return { duvar: (a && a.bicim && a.bicim.duvar) || "kale", obje1: (u && u.obje1.bicim) || "yama", obje2: (u && u.obje2.bicim) || "yama" };
  }
  // Ressam seti (engeller.js ressam): ailenin duvar ve su ressamı, ülkenin iki obje ressamı (ULKE_OBJELERI), birleşik
  // palet (aile paleti + ülke paleti; ülke üstün). Eksik ressam undefined kalır, yedek ressam çizer. Bilinmeyen kod null.
  function ulkeEngelSeti(kod) {
    const u = ulkeKodla(kod);
    if (!u) return null;
    const a = window.ULKE_AILELERI[u.aile] || {}, O = window.ULKE_OBJELERI;
    return { palet: { ...(a.palet || {}), ...u.palet }, duvar: a.duvar, obje1: O[u.obje1.ressam], obje2: O[u.obje2.ressam], su: a.su };
  }

  Object.assign(window, { ULKELER, ULKE_SAYISI: ULKELER.length, ulkeSirada, ulkeKodla, ulkeTemasi, ulkeTanitimi, ulkeBicimSeti, ulkeEngelSeti });
})();
