# Lispler

AutoCAD için AutoLISP araçları.

## KOTLA.lsp — Polyline Otomatik Kot Etiketleme

Dönüşler ve **yay (arc) parçaları** içeren uzun bir polyline güzergahı üzerinde,
belli bir başlangıç kotundan belli bir eğimle ilerleyerek; her **vertex**, her
segmentin **orta noktası** ve **uç noktalar** için olması gereken kotu hesaplar.
Her noktadan, ilk seçilen **eksen/referans** çizgiye **dik** bir çizgi indirir ve
ucuna hesaplanan kot değerini yazar.

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
2. **Eksen / referans** çizgiyi seçin (dik çizgiler bu hatta inecek).
3. Kotlanacak **polyline**'ı seçin.
4. **Başlangıç kotunu** girin.
5. **Eğimi (%)** girin — veya ENTER ile geçip **bitiş kotunu** girin.
6. Yön, ondalık basamak ve yazı yüksekliği sorularını yanıtlayın.

### Çıktı

| Katman     | İçerik                           | Renk  |
|------------|----------------------------------|-------|
| `KOT_DIK`  | Dik (ordinat) çizgileri          | Yeşil |
| `KOT_YAZI` | Kot yazıları (TEXT, orta hizalı) | Sarı  |

Katmanlar yoksa otomatik oluşturulur. İşlem sonunda toplam uzunluk, eğim,
başlangıç/bitiş kotu ve etiket sayısı özeti komut satırına yazdırılır.

### Notlar

- Yaylar dahil tüm geometri hesapları `vlax-curve-*` ActiveX fonksiyonları ile
  yapıldığından, LWPOLYLINE bulge (yay) segmentleri doğru şekilde işlenir.
- Eksen çizgisi sonsuz doğru kabul edilerek dik ayağı (izdüşüm) hesaplanır;
  bu nedenle eksen, polyline'ın tamamından kısa olsa bile çalışır.
- Yazı açısı eksene paralel ve okunabilir (ters dönmeyecek) şekilde ayarlanır.
