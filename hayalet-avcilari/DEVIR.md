# Hayalet Avcıları: devir notu (27 Kasım 2026, sabah)

Kullanıcının son isteği: "sana söylediğim yapılmayan ne varsa hepsini yap, harita yerleşimlerini de ChatGPT yapsın, kalan
hiçbir iş olmasın". Kalıcı kurallar `CLAUDE.md`'de (görseller yalnız ChatGPT, kod Evren/NVIDIA/ChatGPT, akıl yürütme Fable,
"yayınla" denmeden yayın yok). Deneme sayfası: kullanıcının artifact'ı (sürüm 55).

## Bitenler (bu oturum)
SES1 (23 ElevenLabs sesi oyunda), YER1 (bölgeler ChatGPT yerleşim planlarıyla; Y01'in 7 planı derlendi), GOR3a (patlama,
boss halkası, robot, seviye rozeti, zemin süsleri), GOR3b (dükkân/menü/oyun sonu görselleri), J01-J12 yolculuk paftaları
kesildi, gölet ve diken tuzaklar sınır yöntemiyle (organik leke biçimi + kıyı/çerçeve, içi ChatGPT dokusu; kullanıcı kararı), bot görseli.

## Süren / kalan işler
1. **DT1 bitti** (Dünya Turu köprüleri, arena, ortak nehir, yolculuk çubuğu simgeleri; commit edildi).
2. **TST1** zaman aşımına uğradı: yarım iş `araclar/evren-gorev/yarim-TST1.patch` (engel-bicim'in önceden düşen 5
   denetimi, botun ip köprüsünde takılması, yolculuk-perf, cizim fps, dunya-turu 2 denetim, anim 1 denetim). Şartname
   `gorevTST1.md`. Yamayı temiz ağaçta uygula, testleri koş, eksikleri tamamla. (engel-bicim kapsama ve fix3 göl kuralı
   bu oturumda değişti; yamada çakışma olabilir.)
3. **Mac/ChatGPT paftaları:** Y01-Y03 (22 plan oyunda), K15/K16 ve N14-N20 kesildi. Kalan: K15/K16'yı oyuna bağlayacak
   GOR4 görevi (efekt-gokkusagi, -ejder-alev, -bot-isin, -kasirga, -cali-goz, timsah-bakis, efekt-pence, -toz, -olum-pop,
   gol-kopru-tahta, efekt-parilti-kucuk, ui-can-cubugu: kod çizimlerinin yerine, kod yedek), hikâye sahneleri H10-H12 ve
   B01-B10 (gorsel/hamhikaye; kesim tarifi ve HIK3 bağlama görevi yazılmadı), A01-A03 bekleniyor.
4. FIX4 (klasik haritada takılan hayaletler, %6,1) ve REK2 (oynanabilir reklam kamerası, tehlike-halka davranışı):
   önce Fable şartnamesi.
5. Görsel üst üste binme denetimi (kullanıcı, 27 Kasım): gölet/diken/lav sınır yöntemiyle çiziliyor (kıyılı göl resmi ve diken plakası resmi kullanılmıyor). Kalan iki bulgu:
   (a) dikey duvarda (h ≥ 1,3w) aynı duvar resmi alt alta yığılıyor, "üst üste binmiş" görünüyor: dikey duvara tek
   kule resmi (tema<n>-buyuk / aile-<A>-kule) boyunca bir kez, gerekirse ChatGPT'den dikey duvar paftası istenmeli;
   (b) uzun/yayvan kutudaki obje küçük kalıyor, çarpışma kutusu gölge sütunu olarak görünüyor (görünmez duvar): objeyi
   kutunun büyük kenarına göre büyüt (objePayi büyütülmeli) ya da obje kutusunu resmin oranına yakın kur.
6. Bağlanmayan görseller (gerekçeli): gel-miknatis, giris-kahraman, tur-ucak-ust, sus-tahta-yol.

## Çalışma düzeni
- Evren tek istek kabul eder; görevler sırayla (`araclar/evren-gorev/`, başlık `bas.txt`).
- Evren çalışırken commit: temiz ağaçta test, `git hash-object`/`update-index` ile yalnız ilgili dosyalar.
- Kesimden sonra her zaman temiz ağaçta `node test/gorsel.test.mjs`.
