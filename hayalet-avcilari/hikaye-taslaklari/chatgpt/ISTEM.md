# Dünya Turu hikâyesi: ChatGPT sürümü için istem paketi

Hazırlandı: 25 Kasım 2026. Kullanıcının isteği: hikâyenin bir sürümünü de **ChatGPT** yazsın; Evren ve Claude sürümleriyle karşılaştırılacak.
Şartname: `../../HIKAYE.md`. Öbür sürümler: `../evren/`, `../claude/`.

## Yerel Claude için iş sırası

1. ChatGPT'de **yeni bir sohbet** aç (görsel sohbetinden ayrı). Aşağıdaki **ANA İSTEM**'i gönder; "hazır" cevabını bekle.
2. Görevleri **sırayla ve ayrı mesajlarla** gönder.
3. Her cevabın JSON kod bloğunu, olduğu gibi şu dosyaya kaydet:

   | Görev | Dosya |
   |---|---|
   | 1 | `katilis.json` |
   | 2 (ülke 1–17) | `ulke1.json` |
   | 3 (ülke 18–34) | `ulke2.json` |
   | 4 (ülke 35–51) | `ulke3.json` |
   | 5 | `bilmece.json` |

4. JSON geçerli değilse ya da eksik ülke varsa ChatGPT'den aynı görevi düzeltmesini iste. Metni kendin değiştirme: bu sürüm ChatGPT'nin.
5. Bitince commit ve push yap. Kullanıcıya "ChatGPT sürümü hazır" de; karşılaştırmayı bulut Claude hazırlar.
6. Giriş, şifre ve ChatGPT'nin kullanım sınırı kullanıcıya bırakılır.

## ANA İSTEM

```
Sen bir mobil oyunun Türkçe hikâye yazarısın. Oyun: "Hayalet Avcıları" (13 yaş üstü, neşeli, sevimli, üstten bakışlı aksiyon oyunu).
Dünya Turu kipinde oyuncu 51 ülkeyi rota sırasıyla dolaşır. Bu kipe bir hikâye yazacaksın.

ANA HİKÂYE
- Hayaletler kötü değil: evlerinin yolunu kaybetmiş yalnız ruhlar.
- Gezgin (oyuncunun seçtiği avcı, 12 avcıdan herhangi biri olabilir) İstanbul'da eski bir sandıkta silik bir "Dostluk Haritası" bulur.
- Yolda öbür avcılarla karşılaşır; onlar arkadaş olup yolculuğa katılır.
- Her ülkede haritada saklı küçük bir HATIRA vardır; her 5 hatıra bir BİLMECE açar (10 bilmece). Bilmece çözülünce haritanın bir parçası
  canlanır ve hikâyenin bir BÖLÜMÜ açılır.
- Son ülke Arjantin: dünyanın ucundaki deniz fenerinde arkadaşlar birlikte Dostluk Feneri'ni yakar; ışık hayaletlere evlerinin yolunu gösterir.
- Tema: dostluk. Tek başına kimse bütün dünyayı dolaşamaz.

YAZIM KURALLARI
- Doğal, akıcı, kusursuz Türkçe. Her satır en çok 110 karakter. Sıcak, esprili, merak uyandıran ton; korku, şiddet, alay yok.
- Cümlelerin İÇİNDE hiçbir avcının adı geçmez (konuşanın adı oyunda ayrıca etiket olarak görünür).
- Gezgin her avcı olabilir: gezginin cinsiyetini, kişiliğini, silahını varsayma.
- İçerik yalnız kültür, doğa, el sanatı, yemek, oyun, müzik. Din, siyaset, savaş, sınır, bayrak, gerçek kişi adı YOK. Kalıp yargı yok.
- Bilgiler gerçekle uyuşmalı.
- Kalıp cümleleri tekrarlama; her sahnede farklı cümle yapısı ve duygu.

AVCILAR
- `kinkin` Kinkin (erkek): Şimşek Çocuk. Mahallenin en hızlı koşucusu Kinkin, ilk hayaleti bisikletiyle kovalarken buldu. O günden beri enerji tabancasıyla gece devriyesinde; korkmaz, yorulmaz, hep önde koşar. Silahı: Enerji tabancası.
- `veryi` Veryi (erkek): Çekiç Ustası. Dedesinin demirci dükkânında büyüyen Veryi, dev savaş çekicini tek eliyle sallar. Biraz yavaştır ama vurduğu hayalet bir daha geri gelmez. Silahı: Dev savaş çekici.
- `kornet` Kornet (erkek): Gece Büyücüsü. Kabarık mor tüylerinin ardındaki yüzü kimse görmedi. Kristal asasıyla hayaletleri en uzaktan gören Kornet, sihrini yalnız iyilik için kullanır. Silahı: Kristal asa.
- `mark` Marli (kız): Hazine Avcısı. Sırt çantası haritalar, pusulalar ve atıştırmalıklarla dolu Marli, her macerada bir hazine arar. Hayaletlerin bıraktığı paraları ondan hızlı toplayan yoktur. Silahı: Kompakt arbalet.
- `kent` Kenit (erkek): Gölge Lordu. Kenit bir zamanlar hayaletlerin dünyasında kaybolmuş, geri dönmeyi başaran tek çocuktur. Kapüşonunun altındaki kırmızı gözler, hayaletleri ondan korkutan tek şeydir. Silahı: Gölge hançeri.
- `ponko` Ponko (erkek): Kovboy Ponko. Çöl kasabalarının küçük şerifi Ponko, kocaman şapkasıyla uzaktan tanınır. Altın tetikli tabancasını kasabanın en hızlısı gibi çeker. Silahı: Kovboy tabancası.
- `gul` Güllu (kız): Taçlı Okçu. Küçük bir krallığın prensesi Güllu, taht yerine ok ve yayı seçti. Attığı her ok hedefini bulur, patlayan hayaletler etrafındakileri de devirir. Silahı: Kraliyet yayı.
- `rani` Rani (kız): Minik Şifacı. Rani küçük ama yüreği kocamandır. Sapanıyla hayalet avlarken yaralanan arkadaşlarını da unutmaz; şifalı kalbi en zor bölümde bile umut verir. Silahı: Taş sapan.
- `beti` Beri (kız): Şeker Perisi. Lolipop bereli Beri, şeker fabrikasının en neşeli avcısıdır. Suya bile aldırmaz; göllerin içinden yürüyüp şekerden toplarıyla hayaletleri tatlı tatlı uğurlar. Silahı: Şeker topları.
- `fanatik` Fanatik (erkek): Efsane Kunfucu. Siyah kuşağını dağlardaki ustasından alan Fanatik, avcıların en güçlüsüdür. Nunçakusu öyle hızlı döner ki hayaletler neye uğradığını şaşırır. Silahı: Nunçaku.
- `silsen` Silsen (kız): Bahar Bekçisi. Silsen'in bayrağının tepesindeki papatya hiç solmaz. Gittiği her yere bahar götürür; çiçek topları değdiği hayaleti ışığa çevirir. Silahı: Çiçekli bayrak asa.
- `sercin` Serçin (kız): Rüzgâr Kanadı. Serçin kuşlarla konuşur, rüzgârla yarışır. Fırlattığı tüyler hedefini kendi bulur; en kaçamak hayalet bile ondan saklanamaz. Silahı: Kanat tüyleri.

ÜLKELER (rota sırası, kod, ad, oyundaki iki manzara)
1. TR Türkiye (manzara: peri bacaları; lale bahçesi)
2. UA Ukrayna (manzara: ayçiçeği tarlası; saman çatılı beyaz ev)
3. PL Polonya (manzara: Wawel ejderi; leylek yuvaları)
4. DE Almanya (manzara: guguklu saat evi; yarım ahşap evler)
5. GB Birleşik Krallık (manzara: kırmızı telefon kulübeleri; saat kulesi)
6. FR Fransa (manzara: Eyfel Kulesi; lavanta tarlası)
7. IT İtalya (manzara: Kolezyum; gondollu kanal iskelesi)
8. ES İspanya (manzara: La Mancha yel değirmenleri; Elhamra'nın Aslanlı Çeşmesi)
9. MA Fas (manzara: Şefşavan'ın mavi sokakları; fenerli çarşı tezgâhı)
10. DZ Cezayir (manzara: Sahra kumulları; Tassili n'Ajjer kaya kemerleri)
11. CI Fildişi Sahili (manzara: kakao bahçesi; fil ailesi)
12. GH Gana (manzara: kente dokuma tezgâhı; Kakum kanopi köprüsü)
13. NG Nijerya (manzara: Zuma Kayası; konuşan davullar)
14. CD Kongo DC (manzara: okapi ormanı; Kongo Nehri pirogları)
15. AO Angola (manzara: Kalandula Şelalesi; welwitschia bitkisi)
16. ZA Güney Afrika (manzara: Masa Dağı; Afrika penguenleri)
17. MZ Mozambik (manzara: dau yelkenlileri; kaju ağaçları)
18. MG Madagaskar (manzara: Baobab Caddesi; lemurlar)
19. TZ Tanzanya (manzara: Kilimanjaro; Zanzibar oyma kapıları)
20. UG Uganda (manzara: dağ gorilleri; Murchison Şelalesi)
21. KE Kenya (manzara: zürafalar ve akasya; flamingolu göl)
22. ET Etiyopya (manzara: Aksum dikili taşları; gelada maymunları)
23. SD Sudan (manzara: Meroe piramitleri; deve pazarı)
24. EG Mısır (manzara: Gize piramitleri ve Sfenks; Nil'de feluka yelkenlileri)
25. YE Yemen (manzara: Sokotra ejder kanı ağaçları; Sana'a kule evleri)
26. SA Suudi Arabistan (manzara: hurma bahçesi; AlUla Fil Kayası)
27. PS Filistin (manzara: zeytin bahçesi; Hayat Ağacı mozaiği)
28. IQ Irak (manzara: kamış mudhif evleri; şenaşil ahşap balkonlar)
29. IR İran (manzara: Siose Pol köprüsü; Yezd rüzgâr kuleleri)
30. UZ Özbekistan (manzara: İpek Yolu kervanı; kavun pazarı)
31. AF Afganistan (manzara: uçurtmalı tepe; nar bahçesi)
32. PK Pakistan (manzara: süslü kamyonlar; Hunza kayısı bahçesi)
33. IN Hindistan (manzara: Hawa Mahal; lotus göleti ve tavus kuşları)
34. BD Bangladeş (manzara: süslü rikşalar; Sundarbans ve Bengal kaplanı)
35. MM Myanmar (manzara: Inle Gölü balıkçıları; Pathein şemsiyeleri)
36. TH Tayland (manzara: yüzen pazar; tuk-tuk)
37. MY Malezya (manzara: Petronas İkiz Kuleleri; Rafflesia çiçeği)
38. ID Endonezya (manzara: Komodo ejderleri; pirinç terasları)
39. PH Filipinler (manzara: Çikolata Tepeleri; jeepney)
40. VN Vietnam (manzara: Ha Long Körfezi; Hoi An fenerleri)
41. CN Çin (manzara: pandalar ve bambu; ejder dansı)
42. KR Güney Kore (manzara: hanok evleri; kimçi küpleri)
43. JP Japonya (manzara: kiraz ağaçları; Fuji Dağı)
44. RU Rusya (manzara: matruşka bebekleri; oymalı ahşap izba)
45. CA Kanada (manzara: akçaağaç ormanı ve şurup; kunduz barajı)
46. US ABD (manzara: Özgürlük Heykeli; Büyük Kanyon)
47. MX Meksika (manzara: papel picado süslü pazar; ajolote göleti)
48. CO Kolombiya (manzara: Kokora mum palmiyeleri; Cartagena'nın balkonlu evleri)
49. PE Peru (manzara: Machu Picchu terasları; lamalar)
50. BR Brezilya (manzara: Amazon tukanları ve araları; Şeker Somunu Dağı)
51. AR Arjantin (manzara: Perito Moreno Buzulu; Caminito'nun renkli evleri)

Avcıların katılış ülkeleri (rota sırası): 3, 7, 11, 15, 19, 23, 27, 31, 35, 39, 43. Katılış sırası: kinkin, veryi, kornet, mark, kent,
ponko, gul, rani, beti, fanatik, silsen, sercin (gezgin listeden çıkarılır; kim katılırsa katılsın sahnesi her ülkede geçebilmeli).

Bu kuralları anladıysan yalnız "hazır" yaz. Sonra sana beş ayrı görev göndereceğim; her birine YALNIZ bir JSON kod bloğuyla cevap ver.
```

## GÖREV 1

```
GÖREV 1 — KATILIŞ SAHNELERİ. 12 avcının her biri için 4 satırlık bir katılış sahnesi: avcı gezginle karşılaşır, kendini kendi kişiliğiyle
tanıtır, gezgin onu yolculuğa çağırır (her sahnede farklı bir davet cümlesi), avcı katılır. Satır sırası: katilan, gezgin, katilan, gezgin.
ÇIKTI: {"kinkin": [{"k":"katilan","m":"..."}, {"k":"gezgin","m":"..."}, ...], "veryi": [...], ... 12 avcının hepsi}
```

## GÖREV 2

```
GÖREV 2 — ÜLKELER 1–17: HATIRA VE VARIŞ SAHNESİ. Listedeki 1–17. sıradaki ülkelerin her biri için:
- hatira: ad (2–4 kelime), simge (TEK emoji), not (tek cümle: ne olduğu, nasıl yapıldığı ya da neye yaradığı; bilmecelerde ipucu olacak).
  Hatıra o ülkeye özgü, tanınır, ele sığan küçük bir şey; manzaralardan farklı. Bütün 51 ülke boyunca çeşit olsun: kumaş/dokuma en çok 4,
  çanta/sepet en çok 3, tabak/kâse en çok 3; çalgılar, oyuncaklar, yöresel tatlılar, doğal parçalar (nesli tehlikedeki canlılardan parça YOK).
- sahne: 2–3 satır, oyuncu ülkeye VARDIĞI anda (hatıra henüz bulunmamışken) gösterilir. 1. satır {"k":"anlatici"}: varış ve ülkenin bir
  güzelliği. Sonra "gezgin" ya da "arkadas" (en son katılan avcı; esprili, sıcak). Sıra 1 ve 2'de arkadaş yok: yalnız anlatici ve gezgin.
  Sıra 1 (Türkiye) yolculuğun başı: gezgin İstanbul'da bulduğu silik haritadan söz etsin.
ÇIKTI: {"TR": {"hatira": {"ad":"...","simge":"🎨","not":"..."}, "sahne": [{"k":"anlatici","m":"..."}, {"k":"gezgin","m":"..."}]}, ...}
```

## GÖREV 3

```
GÖREV 3 — ÜLKELER 18–34: HATIRA VE VARIŞ SAHNESİ. Listedeki 18–34. sıradaki ülkelerin her biri için:
- hatira: ad (2–4 kelime), simge (TEK emoji), not (tek cümle: ne olduğu, nasıl yapıldığı ya da neye yaradığı; bilmecelerde ipucu olacak).
  Hatıra o ülkeye özgü, tanınır, ele sığan küçük bir şey; manzaralardan farklı. Bütün 51 ülke boyunca çeşit olsun: kumaş/dokuma en çok 4,
  çanta/sepet en çok 3, tabak/kâse en çok 3; çalgılar, oyuncaklar, yöresel tatlılar, doğal parçalar (nesli tehlikedeki canlılardan parça YOK).
- sahne: 2–3 satır, oyuncu ülkeye VARDIĞI anda (hatıra henüz bulunmamışken) gösterilir. 1. satır {"k":"anlatici"}: varış ve ülkenin bir
  güzelliği. Sonra "gezgin" ya da "arkadas" (en son katılan avcı; esprili, sıcak). Sıra 1 ve 2'de arkadaş yok: yalnız anlatici ve gezgin.
  Sıra 1 (Türkiye) yolculuğun başı: gezgin İstanbul'da bulduğu silik haritadan söz etsin.
ÇIKTI: {"TR": {"hatira": {"ad":"...","simge":"🎨","not":"..."}, "sahne": [{"k":"anlatici","m":"..."}, {"k":"gezgin","m":"..."}]}, ...}
```

## GÖREV 4

```
GÖREV 4 — ÜLKELER 35–51: HATIRA VE VARIŞ SAHNESİ. Listedeki 35–51. sıradaki ülkelerin her biri için:
- hatira: ad (2–4 kelime), simge (TEK emoji), not (tek cümle: ne olduğu, nasıl yapıldığı ya da neye yaradığı; bilmecelerde ipucu olacak).
  Hatıra o ülkeye özgü, tanınır, ele sığan küçük bir şey; manzaralardan farklı. Bütün 51 ülke boyunca çeşit olsun: kumaş/dokuma en çok 4,
  çanta/sepet en çok 3, tabak/kâse en çok 3; çalgılar, oyuncaklar, yöresel tatlılar, doğal parçalar (nesli tehlikedeki canlılardan parça YOK).
- sahne: 2–3 satır, oyuncu ülkeye VARDIĞI anda (hatıra henüz bulunmamışken) gösterilir. 1. satır {"k":"anlatici"}: varış ve ülkenin bir
  güzelliği. Sonra "gezgin" ya da "arkadas" (en son katılan avcı; esprili, sıcak). Sıra 1 ve 2'de arkadaş yok: yalnız anlatici ve gezgin.
  Sıra 1 (Türkiye) yolculuğun başı: gezgin İstanbul'da bulduğu silik haritadan söz etsin.
ÇIKTI: {"TR": {"hatira": {"ad":"...","simge":"🎨","not":"..."}, "sahne": [{"k":"anlatici","m":"..."}, {"k":"gezgin","m":"..."}]}, ...}
```

## GÖREV 5

```
GÖREV 5 — BİLMECELER, BÖLÜMLER VE FİNAL. Bilmece n, rota sırası 5n−4…5n olan beş ülkenin hatıralarından BİRİNİ anlatır (senin yazdığın
hatıralar). Hatırayı adını ve notundaki kelimeleri kullanmadan, işlevinden, sesinden, biçiminden dolaylı anlat ("Ben neyim?" tarzı olabilir);
2–3 kısa dize; kelime oyunu yok (çevrilecek). Üç seçenek aynı beşli gruptaki hatıraların adları; doğru seçeneğin yeri değişsin (dogru: 0–2).
bolum: 3–4 cümle, "biz" diliyle; her bölüm hikâyede yeni bir şey açığa çıkarsın (hayaletlerin neden yalnız kaldığı, fenerin hikâyesi, onu
neyin söndürdüğü, nasıl yeniden yakılacağı...). 10. bölüm Arjantin'e, dünyanın ucundaki fenere çağırır. Harita İstanbul'da zaten bulundu.
final: 6 satır ({"k":"anlatici"|"gezgin"|"arkadas","m":"..."}): fenere varış, herkes birlikte feneri yakar, ışık denizde yol açar, hayaletler
teşekkür edip evlerine süzülür; gezgin ile arkadaş arasında kısa duygulu ve esprili konuşma; son satır anlatıcının sıcak kapanışı.
ÇIKTI: {"bilmeceler": [{"soru":"...","secenek":["...","...","..."],"dogru":1,"bolum":["...","...","..."]}, ... 10 tane], "final": [...]}
```
