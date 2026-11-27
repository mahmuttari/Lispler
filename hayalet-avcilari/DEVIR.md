# Hayalet Avcıları: devir notu (27 Kasım 2026, sabah)

Kullanıcının son isteği: "sana söylediğim yapılmayan ne varsa hepsini yap, harita yerleşimlerini de ChatGPT yapsın, kalan
hiçbir iş olmasın". Kalıcı kurallar `CLAUDE.md`'de (görseller yalnız ChatGPT, kod Evren/NVIDIA/ChatGPT, akıl yürütme Fable,
"yayınla" denmeden yayın yok). Deneme sayfası: kullanıcının artifact'ı (sürüm 55).

## Bitenler (bu oturum)
SES1 (23 ElevenLabs sesi oyunda), YER1 (bölgeler ChatGPT yerleşim planlarıyla; Y01'in 7 planı derlendi), GOR3a (patlama,
boss halkası, robot, seviye rozeti, zemin süsleri), GOR3b (dükkân/menü/oyun sonu görselleri), J01-J12 yolculuk paftaları
kesildi, göller kesilmeden (gol-su.js çarpışma tablosu), bot görseli.

## Süren / kalan işler
1. **DT1** (Evren'de çalışıyordu): J07-J12'yi Dünya Turu'na bağlama. Şartname `araclar/evren-gorev/gorevDT1.md`.
   Bitmediyse yarım yama oturumun geçici klasöründeydi; şartnameden yeniden çalıştır.
2. **TST1** zaman aşımına uğradı: yarım iş `araclar/evren-gorev/yarim-TST1.patch` (engel-bicim'in önceden düşen 5
   denetimi, botun ip köprüsünde takılması, yolculuk-perf, cizim fps, dunya-turu 2 denetim, anim 1 denetim). Şartname
   `gorevTST1.md`. Yamayı temiz ağaçta uygula, testleri koş, eksikleri tamamla. (engel-bicim kapsama ve fix3 göl kuralı
   bu oturumda değişti; yamada çakışma olabilir.)
3. **Mac/ChatGPT'den beklenen paftalar** (`gorsel/YEREL-CLAUDE-SIRA.md`): Y02, Y03 (yerleşim JSON; gelince
   `python3 araclar/yerlesim_derle.py`), N14 geldi (`gorsel/ham/N14.png`) ama kesilmedi: `--ek` kipi animasyonlardan yalnız K/R ile başlayanları keser (ek_kes'te
   `k[0] in 'KR'` süzgeci); N paftaları için süzgeç genişletilip `ek_hucreler`in `HAM` yolu denenmeli, N15-N20,
   K15/K16, H10-H12, B01-B10, A01-A03. K15/K16 gelince GOR4 (efekt bağlama), hikâye sahneleri gelince HIK3 yazılacak.
4. FIX4 (klasik haritada takılan hayaletler, %6,1) ve REK2 (oynanabilir reklam kamerası, tehlike-halka davranışı):
   önce Fable şartnamesi.
5. Görsel üst üste binme denetimi (kullanıcı, 27 Kasım): göller ve diken/lav düzeltildi. Kalan iki bulgu:
   (a) dikey duvarda (h ≥ 1,3w) aynı duvar resmi alt alta yığılıyor, "üst üste binmiş" görünüyor: dikey duvara tek
   kule resmi (tema<n>-buyuk / aile-<A>-kule) boyunca bir kez, gerekirse ChatGPT'den dikey duvar paftası istenmeli;
   (b) uzun/yayvan kutudaki obje küçük kalıyor, çarpışma kutusu gölge sütunu olarak görünüyor (görünmez duvar): objeyi
   kutunun büyük kenarına göre büyüt (objePayi büyütülmeli) ya da obje kutusunu resmin oranına yakın kur.
6. Bağlanmayan görseller (gerekçeli): gel-miknatis, giris-kahraman, tur-ucak-ust, sus-tahta-yol.

## Çalışma düzeni
- Evren tek istek kabul eder; görevler sırayla (`araclar/evren-gorev/`, başlık `bas.txt`).
- Evren çalışırken commit: temiz ağaçta test, `git hash-object`/`update-index` ile yalnız ilgili dosyalar.
- Kesimden sonra her zaman temiz ağaçta `node test/gorsel.test.mjs`.
