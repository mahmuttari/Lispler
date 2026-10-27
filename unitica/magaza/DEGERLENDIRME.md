# Unitica — yayın kararının uzman değerlendirmesi (27 Ekim 2026)

İstek: Drive'daki `KUCUK_UYGULAMALAR/Unitica-1.3.1.apk`'yı **Poyraz Workshop** hesabından Google Play'de yayınlamak;
GeoTerva ev reklamı yerine **AdMob**, "Yakında" diyen reklamsız üyelik yerine **gerçek Play aboneliği**. Sahibin
kararları kesindir (APK'dan yeniden kurulum, `com.poyrazworkshop.unitica`, AdMob + `adfree` aboneliği, bu turda yayın).
Doğrulama işaretleri: **[D]** doğrulandı, **[K]** kısmen, **[DY]** doğrulanamadı.

## 1. Önerilen ve uygulanan biçim

- **Ücretsiz, reklamlı; isteğe bağlı reklamsız abonelik.** Bütün kategoriler ve birimler herkese açık: abonelik yalnız
  reklamı kaldırır (özgün 1.3.1'deki vaat: "Tüm kategoriler ve birimler her zaman ücretsiz kalır").
- **Reklam: banner esas, geçiş reklamı çok seyrek.** AdMob'un kendi kılavuzu, geçiş reklamını "uygulamanın doğal geçiş
  noktalarına" koymayı, kullanıcıyı şaşırtmamayı önerir ve hizmet (utility) türü uygulamalar için banner'ı daha uygun
  bulur [D] ([AdMob: geçiş reklamı kılavuzu](https://support.google.com/admob/answer/6066980)). Birim dönüştürücüde
  kullanıcı sürekli giriş yapar; temiz durak yalnız Geçmiş / Favoriler / Diğer ekranından ayrılmaktır. Kurallar
  (`www/js/reklam-kural.js`): ilk 5 dk yok, en az 8 dk ara, saatte en çok 3, kısa ziyarette ve üyelik ekranına
  bakıldıktan sonraki 10 dk yok; giriş, birim seçimi, alt sayfa, klavye sırasında asla. Açılış ve ödüllü reklam yok.
- **GeoTerva** yalnız Hakkında'da düz bir satır (geoterva.com). Özgündeki tam ekran ev reklamı açılıştan 5 sn sonra ve
  her 3 dakikada bir çıkıyor, 10 sn kapatılamıyordu: Play'in "beklenmedik tam ekran reklam" yasağına yakın bir davranış
  [D] ([Play: Reklamlar politikası](https://support.google.com/googleplay/android-developer/answer/9857753)). Kaldırıldı.
- **11 mağaza dili**, arayüzün 11 diliyle aynı; ekran görüntüleri her dilde kendi arayüzüyle (Arapça sağdan sola).
- **Kategori Araçlar, 13 yaş ve üzeri**, reklam içerik derecesi en çok G. Hesap yok, sunucu yok.

## 2. Güçlü yanlar

| Yön | Neden önemli |
|---|---|
| Geoteknik / inşaat odaklı birimler | Birim hacim ağırlık (kN/m³, tf/m³, pcf), geçirgenlik k (cm/s, m/gün), kesit modülü, EI, çizgisel yük, kgf/cm², tf/m², ksf, tsf: genel dönüştürücülerde çoğu dağınık ya da yok [K] |
| Tam tanımlardan katsayılar + "Kabuller ve sabitler" sayfası | Mühendis neyin varsayıldığını görür (g, IT kalorisi, ABD galonu, dönüm = 1000 m²); güven verir |
| Tamamen çevrimdışı hesap | Sahada, şantiyede, uçakta çalışır; döviz gibi ağa bağlı bir özellik yok |
| "Tüm birimlerde" listesi, ± / E tuşları, geçmiş, favori kartları | Rakiplerde ayrı ayrı bulunan işler tek ekranda |
| 11 dil, Türkçe semboller (sa, dk, BG, dönüm) | Türkiye pazarına özgü; Arapça RTL |
| Ölçülü reklam + gerçek reklamsız abonelik | Puanı koruyan reklam yükü; isteyen öder |

## 3. Rakipler (Google Play sayfaları 27 Ekim 2026'da okundu)

| Rakip | Play'deki durum | Fark |
|---|---|---|
| "Unit Converter" — Smart Tools co. (`kr.sira.unit`) | 10 milyon+ indirme, reklam içeriyor, uygulama içi satın alma var, son güncelleme 1 Ekim 2026 [D] ([Play](https://play.google.com/store/apps/details?id=kr.sira.unit)) | Pazarın büyük, genel amaçlı oyuncusu; görünürlük çok zor. Unitica'nın farkı mühendislik derinliği ve sade arayüz |
| "Unit Converter" — DIGIT GROVE (`com.androidapps.unitconverter`) | 10 milyon+ indirme, reklam + uygulama içi satın alma, son güncelleme 3 Ekim 2026 [D] ([Play](https://play.google.com/store/apps/details?id=com.androidapps.unitconverter)) | Genel kitle; geoteknik birim kapsamı doğrulanamadı [DY] |
| "Unit Converter Pro" — Elkens software (`com.unitconverterpro.ucplite`) | 1 milyon+ indirme, son güncelleme 4 Nisan 2026 [D]; reklam durumu sayfadan net okunamadı [K] ([Play](https://play.google.com/store/apps/details?id=com.unitconverterpro.ucplite)) | Geniş birim listesi ve döviz; mühendislik odağı yok [K] |
| "Unit Converter & Calculator" — UUCMobile (`com.ba.universalconverter`) | 500 bin+ indirme, reklam + uygulama içi satın alma, son güncelleme 29 Eylül 2026 [D] ([Play](https://play.google.com/store/apps/details?id=com.ba.universalconverter)) | Hesap makinesiyle karışık; Unitica daha odaklı |
| "Engineering Unit Converter" — NaukriLatest.com Apps (`com.appitudelabs.engineeringunitconverter`) | 1 bin+ indirme, reklam içeriyor, son güncelleme 12 Ocak 2025 [D] ([Play](https://play.google.com/store/apps/details?id=com.appitudelabs.engineeringunitconverter)) | Aynı niş, zayıf rakip: "mühendislik birim dönüştürücü" aramasında yer açık olabilir [K] |
| "Unit Converter Ultimate" (açık kaynak, reklamsız) | Play sayfası 27 Ekim 2026'da 404; F-Droid'de son derleme 2023 [D] ([F-Droid](https://f-droid.org/packages/com.physphil.android.unitconverterultimate/)) | Reklamsız ve ücretsiz rakip artık Play'de görünmüyor |

Sonuç: "birim dönüştürücü" genel aramasında milyonluk rakipler var; Unitica'nın yolu **mühendislik ve geoteknik
anahtar kelimeleri** ("kN/m3 tf/m3", "kgf/cm2", "geçirgenlik", "eğilme rijitliği") ve Türkçe pazardır. Mağaza metni
bu kelimeleri doğal biçimde içerir; anahtar kelime doldurma yoktur.

## 4. Riskler ve önlemler

| Risk | Düzey | Önlem |
|---|---|---|
| **Hesap geçmişi:** Poyraz Workshop'un iki uygulaması daha önce askıya alındı (ayrıntı bu klasörde yok [DY]); yeni bir ihlal hesabı tehlikeye atar | Yüksek etki | Sınırda hiçbir davranış yok: açılış reklamı, ödüllü reklam, düğme yanında beliren reklam, kapatılamayan reklam yok; banner içeriğe binmez; geçiş reklamı yalnız tanımlı durakta; içerik derecesi G; Veri güvenliği AdMob'un kendi beyanıyla birebir; gizlilik politikası her izni açıklar |
| **Abonelik politikası:** fiyat, yenilenme ve iptal açık olmalı | Orta | Fiyat her zaman Play'den (`priceString`); üyelik ekranında "kendiliğinden yenilenir, Google Play › Abonelikler'den iptal" yazılı; "Satın alımı geri yükle" ve "Aboneliği yönet" var; reklamsız olmayan kullanıcıdan hiçbir özellik esirgenmez [K] ([Play: Ödemeler politikası](https://support.google.com/googleplay/android-developer/answer/9858738)) |
| **Doğruluk beklentisi** (yanlış birimle hesap) | Orta | Katsayılar tam tanımlardan; kabuller uygulamada; mağaza metni "tasarım için kritik değeri kendi kaynağınla doğrula" der; hesap çift duyarlıklı, gösterim yuvarlanmış |
| **"İnternet izni istemez" vaadi** (özgün metin) | Düşük | Değişti: Hakkında metni ve mağaza metni internetin yalnız reklam ve abonelik için kullanıldığını söyler (11 dilde; `test/uygulama.test.mjs` denetler). CSP özgün kadar sıkı: WebView ağa çıkmaz |
| **Çevirilerin niteliği** (10 dil yapay zekâyla, ana dili konuşan biri okumadı) | Orta-düşük | Arayüz çevirileri özgün APK'dan; yalnız yeni satırlar (üyelik, Hakkında) ve mağaza metinleri yeni. Yayından sonra Arapça, Japonca ve Korece metni bir ana dil konuşanına okutmak önerilir [K] |
| **Kalabalık pazar, düşük görünürlük** | Orta | Niş anahtar kelimeler, Türkçe; ilk 30 günde aramadan gelen kurulumlar izlenir |
| **Eski WebView** | Düşük | `minWebViewVersion: 100` özgündeki gibi; Android 7+ (minSdk 24) |
| **Ön plan hizmeti beyanı** (AdMob'un WorkManager'ı `FOREGROUND_SERVICE` ekler) | Düşük | Tür bildirilmiyor; Play sorarsa "uygulama ön plan hizmeti kullanmaz" (`aciklamalar.md`) [K] |

## 5. Birim ekonomi (varsayımlı)

Gelir ≈ GKK × [(banner gösterimi/kişi × banner eBGM) + (geçiş gösterimi/kişi × geçiş eBGM)] / 1000
+ abone sayısı × net abonelik geliri (GKK: günlük etkin kullanıcı; eBGM: bin gösterim başına etkin gelir).

Varsayımlar **[DY]**: Türkiye ağırlıklı kitle için banner eBGM 0,05-0,20 $, geçiş eBGM 0,5-2 $ (AdMob ülke bazında
eBGM yayımlamaz). Oturum 3 dk; banner 60 sn'de yenilenir (≈3 gösterim/oturum, klavye açıkken daha az). Geçiş reklamı
kurallar gereği seyrek: oturumların çoğu 5 dakikadan kısa olduğundan ≈0,05 gösterim/oturum. Abonelik dönüşümü
etkin kullanıcıların %0,5-1'i [DY]; Play bedeli %15 [D] ([Play hizmet bedelleri](https://support.google.com/googleplay/android-developer/answer/112622)).

| GKK | Banner (0,10 $ eBGM) | Geçiş (1 $ eBGM) | Abonelik (aylık 0,99 $ × %0,5 GKK, net %85) | Ay (≈30 gün) |
|---|---|---|---|---|
| 100 | 100 × 3 × 0,10 / 1000 = 0,03 $/gün | 100 × 0,05 × 1 / 1000 = 0,005 $/gün | 0,5 abone ≈ 0,42 $/ay | ≈ 1,5 $ |
| 1.000 | 0,30 $/gün | 0,05 $/gün | 5 abone ≈ 4,2 $/ay | ≈ 15 $ |
| 10.000 | 3 $/gün | 0,5 $/gün | 50 abone ≈ 42 $/ay | ≈ 147 $ |

Sonuç: gelir küçüktür ve banner ile abonelik ağırlıklıdır; geçiş reklamını sıklaştırmak geliri az artırır ama puanı
ve hesabı riske atar. AdMob ödeme eşiği 100 $ [K]: düşük kullanımda aylar sürebilir. Maliyet sıfıra yakın (hesap
açık, gizlilik sayfası GitHub Pages'te, sunucu yok). Asıl değer: Poyraz Workshop vitrininde mühendislik/CBS
uzmanlığını gösteren, bakım istemeyen bir ürün.

## 6. Sonra bakılacaklar

- İlk 30 gün: Play Console'da çökme/ANR, puan ve yorumlar; AdMob politika merkezi; abonelik iptal nedenleri.
- Yorumlarda reklam şikâyeti yoğunlaşırsa önce geçiş reklamı kapatılır (`reklam-kural.js › DOGAL_DURAK = []`), banner kalır.
- Abonelik dönüşümü çok düşükse tek seferlik "reklamları kaldır" satın alımı düşünülebilir (sahibin kararı).
- AdMob'da uygulama yayından sonra Play girişine bağlanır (`PLAY-YAYIN.md` 7).

## Kaynaklar

- AdMob geçiş reklamı kılavuzu: [support.google.com/admob/answer/6066980](https://support.google.com/admob/answer/6066980)
- Google Play Reklamlar politikası (beklenmedik tam ekran reklam, kapatılamayan reklam): [support.google.com/googleplay/android-developer/answer/9857753](https://support.google.com/googleplay/android-developer/answer/9857753)
- Google Play Ödemeler politikası: [support.google.com/googleplay/android-developer/answer/9858738](https://support.google.com/googleplay/android-developer/answer/9858738)
- Google Play hizmet bedelleri: [support.google.com/googleplay/android-developer/answer/112622](https://support.google.com/googleplay/android-developer/answer/112622)
- AdMob veri beyanı: [developers.google.com/admob/android/privacy/play-data-disclosure](https://developers.google.com/admob/android/privacy/play-data-disclosure)
- Rakiplerin Play sayfaları (27 Ekim 2026): yukarıdaki tablodaki bağlantılar; Unit Converter Ultimate: [F-Droid](https://f-droid.org/packages/com.physphil.android.unitconverterultimate/)
