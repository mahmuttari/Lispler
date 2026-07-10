# Lispler

AutoCAD için AutoLISP araçları.

## KOTLA.lsp — Yol Alymanı Enkesit Çizgileri + Kot Etiketleme

Dönüşler ve **yay (arc) parçaları** içeren uzun bir polyline (yol alymanı)
üzerinde; her **vertex**, her segmentin **orta noktası** ve **uç noktalar** için
polyline'ın **o noktadaki yerel teğetine dik** birer **enkesit çizgisi** çizer.
Çizgiler, ilk seçilen **örnek (şablon) enkesit** çizgisi ile **aynı boyda** olur.
Her enkesit çizgisinin ucuna, o noktanın olması gereken **kotu** yazılır.

Enkesit çizgilerinin **Z koordinatı = hesaplanan kot**'tur (kotlu/3B, yatay). Tüm
enkesitlerin **tam orta noktalarından** geçen, `Z=kot` olan bir **kotlu eksen**
çizgisi (ardışık **LINE** parçaları) oluşturulur — yani alymanın 3B profili.

### Enkesit çizgisi

- **Yön:** polyline'ın o noktadaki teğetine dik (yaylarda da yerel teğet).
- **Boy:** ilk seçilen örnek çizginin boyu.
- **Sol/sağ dağılım:** Örnek çizgi alymanı **kesiyorsa**, kesişim noktasının
  soluna/sağına düşen uzunluklar korunur (asimetrik enkesit). Kesmiyorsa çizgi
  noktada **simetrik** (her iki yana eşit) çizilir.

### Kot hesabı

```
mesafe = polyline başından o noktaya kadarki yol uzunluğu
         (yaylar gerçek yay boyu ile hesaplanır)
kot    = başlangıç_kotu + eğim × mesafe
```

- **Eğim** `%` olarak girilir (örn. `2.5` → %2.5 → `0.025` birim/birim).
- Eğim boş bırakılırsa (ENTER), **bitiş kotu** sorulur ve eğim
  `(bitiş_kotu − başlangıç_kotu) / toplam_uzunluk` olarak otomatik hesaplanır.
- Polyline'ın doğal yönü ters görünüyorsa "Yön ters çevrilsin mi?" sorusuna
  **Evet** diyerek mesafe ölçümünü diğer uçtan başlatabilirsiniz.

### Kullanım

1. `KOTLA` komutunu çalıştırın.
2. **Örnek (şablon) enkesit** çizgisini seçin (LINE) → boy ve sol/sağ dağılım.
   Sol/sağ farklı olsun isterseniz bu çizgiyi **alymanı keser** şekilde çizin.
3. **Yol alymanı** (polyline) seçin.
4. **Başlangıç kotunu** girin.
5. **Eğimi (%)** girin — veya ENTER ile geçip **bitiş kotunu** girin.
6. Yön, ondalık basamak, yazı yüksekliği ve **maksimum örnekleme aralığını** girin.

**Maksimum örnekleme aralığı:** Boş bırakılırsa (ENTER) yalnızca vertex + segment
orta noktası kullanılır. Bir değer (ör. `2`) verilirse, her segment bu aralığı
**aşmayacak** şekilde eşit alt bölümlere ayrılır; böylece en fazla 2 m'de bir
enkesit çizilir. Vertexler her durumda korunur.

### Çıktı

| Katman      | İçerik                                   | Renk    |
|-------------|------------------------------------------|---------|
| `ENKESIT`   | Enkesit çizgileri (alymana dik, Z=kot)   | Yeşil   |
| `KOT_YAZI`  | Kot yazıları (TEXT, orta hizalı)         | Sarı    |
| `KOT_EKSEN` | Orta noktalardan geçen kotlu eksen (LINE)| Kırmızı |

Katmanlar yoksa otomatik oluşturulur. İşlem sonunda toplam uzunluk, enkesit boyu
(sol/sağ), eğim, başlangıç/bitiş kotu, enkesit sayısı ve eksen parça sayısı
özeti yazdırılır.

### Notlar

- Yaylar dahil tüm geometri hesapları `vlax-curve-*` ActiveX fonksiyonları ile
  yapıldığından, LWPOLYLINE bulge (yay) segmentleri doğru şekilde işlenir; her
  enkesitin yönü, noktanın **yerel teğetine** (`getFirstDeriv`) dik alınır.
- Örnek çizginin alymanı kesip kesmediği `IntersectWith` ile kontrol edilir;
  kesişim varsa sol/sağ uzunluklar ondan, yoksa simetrik alınır.
- Yazı açısı enkesit çizgisi yönünde ve okunabilir (ters dönmeyecek) ayarlanır.

## TEXT_TO_EXCEL_v19.lsp — Seçilen Yazıları Excel'e (CSV) Aktar

Seçilen **TEXT / MTEXT** nesnelerini satır–sütun düzeninde bir `.csv` dosyasına
yazıp Excel'de açan araç. Komut: **`TEXT2XL`**.

### Kullanım

1. `TEXT2XL` komutunu çalıştırın.
2. Başlangıç **sütun sayısını** (1–12) girin.
3. Yazıları sırayla seçin (tek tık veya pencere/çapraz seçim). Seçilen nesneler
   geçici olarak **kırmızı** renk alır; komut bitince eski renklerine döner.
4. Sütun sayısı dolunca satır otomatik tamamlanır. Ara aşamada **`E`** ile sütun
   sayısını değiştirebilir, **ENTER** ile komutu bitirip Excel'i açabilirsiniz.

### Notlar

- MTEXT biçim kodları temizlenir; `;` ve `"` karakterleri boşluğa çevrilerek CSV
  bozulması engellenir. Ayraç olarak **noktalı virgül (`;`)** kullanılır.
- Dosya, çizimin bulunduğu klasöre `ACAD_LISTE_<tarih>_<saat>.csv` adıyla yazılır
  ve bir VBScript aracılığıyla varsayılan uygulamada (Excel) açılır.
- Windows'a özgüdür (`wscript` / `TEMP` ortam değişkeni kullanır).
