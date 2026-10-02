# Not Defteri

Windows Not Defteri tarzında, **HTML kodunu çalıştırabilen** bir metin düzenleyici. Android telefona kurulur.

## Telefona kurulum

1. Telefondan bu depodaki [`dist/NotDefteri.apk`](dist/NotDefteri.apk) dosyasını açıp **İndir** (Download raw file) düğmesine basın.
2. İnen dosyaya dokunun. Android "bilinmeyen kaynaklardan yükleme" izni isterse, tarayıcınıza / dosya yöneticinize izin verin.
3. **Yükle** deyin. Ana ekranda **Not Defteri** simgesi çıkar.

> Uygulama Play Store dışından kurulduğu için Play Protect bir uyarı gösterebilir: "Yine de yükle" demeniz yeterli.

## Özellikler

- **Dosya** menüsü: Yeni, Yeni HTML Sayfası (hazır şablon), Aç, Kaydet, Farklı Kaydet, Cihazdan aç, Cihaza kaydet, Paylaş
- **Düzen** menüsü: Geri Al / Yinele, Kes / Kopyala / Yapıştır / Sil, Bul, Sonrakini/Öncekini Bul, Değiştir, Git, Tümünü Seç, Saat/Tarih
- **Biçim**: Sözcük Kaydırma, Yazı Tipi (yazı tipi, stil, boyut)
- **Görünüm**: Yakınlaştır / Uzaklaştır, Durum Çubuğu, Sembol Çubuğu, Koyu Tema
- Durum çubuğunda satır/sütun, yakınlaştırma, satır sonu ve kodlama bilgisi
- Kaydetmeden çıksanız bile yazdıklarınız bir sonraki açılışta geri gelir
- Dosya yöneticisinde bir `.txt` / `.html` dosyasına "Birlikte aç › Not Defteri" diyebilirsiniz

### HTML çalıştırma

1. HTML kodunu yazın (veya **Dosya › Yeni HTML Sayfası**).
2. **Kaydet** ile `sayfam.html` gibi `.html` ile biten bir adla kaydedin.
3. Yeşil **▶ Çalıştır** düğmesine basın. Sayfa tam ekran açılır; **Kapat** veya telefonun geri tuşu ile editöre dönersiniz.

- `console.log` çıktıları ve JavaScript hataları **Konsol** bölümünde görünür (hatalar satır numarasıyla).
- Uygulamaya kayıtlı `stil.css`, `kod.js` gibi dosyalara verilen bağlantılar (`<link href="stil.css">`, `<script src="kod.js">`) otomatik çalışır.
- `.js` dosyaları boş bir sayfada, `.css` dosyaları örnek bir sayfa üzerinde çalıştırılır.

### Sembol çubuğu

Telefon klavyesinde zor bulunan `Tab < > / = " ' { } ( ) ;` gibi işaretler klavyenin üstünde durur.
**`</>`** düğmesi en son açılan HTML etiketini kapatır (`<div><p>` → `</p>` → `</div>`).

## Proje yapısı

```
app/        Uygulamanın kendisi (tek dosya: index.html). Tarayıcıda da çalışır, PWA olarak kurulabilir.
android/    app/ klasörünü WebView ile saran Android projesi (dosya aç/kaydet, pano, paylaş köprüsü)
dist/       Hazır derlenmiş APK
```

## APK'yı yeniden derlemek

Android SDK (platform 35) ve JDK 17+ gerekir:

```sh
cd android
echo "sdk.dir=/android/sdk/yolu" > local.properties
./gradlew assembleRelease
cp app/build/outputs/apk/release/app-release.apk ../dist/NotDefteri.apk
```

APK, depodaki `android/app/notdefteri.keystore` anahtarıyla imzalanır; böylece yeni sürümler eskisinin üzerine
(notlarınız silinmeden) kurulur. Bu anahtar herkese açık olduğundan uygulamayı Play Store'a koyacaksanız kendi
anahtarınızı oluşturun.
