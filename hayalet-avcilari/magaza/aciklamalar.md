# Hayalet Avcıları — mağaza metinleri

`android/play.mjs magaza` bu dosyadan "Uygulama adı", "Destek e-postası", "Gizlilik politikası" satırlarını ve
"Kısa açıklama" / "Uzun açıklama" bölümlerini okur (ad ≤30, kısa ≤80, uzun ≤4000 karakter). Diğer diller
`diller/<dil>.md` dosyalarındadır (aynı biçim + "Sürüm notu" bölümü, ≤500 karakter).

## Ortak

- **Uygulama adı:** Hayalet Avcıları
- **Geliştirici adı:** Poyraz Workshop
- **Paket adı:** `com.poyrazworkshop.hayaletavcilari`
- **Tür ve kategori:** Oyun · Arcade
- **Hedef kitle:** 13-15, 16-17, 18 ve üzeri (13 altı seçilmez)
- **Gizlilik politikası:** https://mahmuttari.github.io/Lispler/hayalet-avcilari/gizlilik.html
- **Hesap silme adresi:** https://mahmuttari.github.io/Lispler/hayalet-avcilari/hesap-silme.html
- **Destek e-postası:** mahmuttari@gmail.com
- **Mağaza dilleri:** tr-TR (varsayılan), en-US, es-ES, es-419, zh-CN, hi-IN, ar — çeviriler `diller/` klasöründe

## Kısa açıklama

Hayaletleri yakala, boss'ları yen, kostüm topla! Tek başına ya da arkadaşınla.

## Uzun açıklama

Hayalet Avcıları'nda hayaletler her yerden geliyor! Avcını seç, labirent gibi bölümlerde dolaş ve hayaletleri tek tek yakala.

👻 HAYALET AV
• Joystick ile dolaş, avcın en yakın hayalete kendiliğinden ateş etsin.
• Her bölümde süre dolunca bölüm bossu gelir: onu ve minik hayaletlerini yen, sonraki bölüme geç.
• Mor Şato, Yeşil Orman, Çöl, Buz Mağarası, Volkan ve Uzay temalı bölümler.
• Dikenler, lav ve su engellerine dikkat!

🦸 KARAKTERLER VE KOSTÜMLER
• Kinkin, Veryi, Kornet, Marli, Kenit, Ponko ve daha fazlası: her avcının kendine özel gücü ve silahı var.
• Topladığın parayla hızını, hasarını, atış hızını ve menzilini yükselt.
• Elmas ve zümrütle yeni kostümlerin kilidini aç.

💣 CEPHANE
• Bomba, Dondurma, Şimşek, Kasırga, Roket, Görünmezlik ve İlk Yardım: zor anlarda tek dokunuşla kullan.

🌐 BİRLİKTE OYNA
• Çevrimiçi oda kur, arkadaşlarınla aynı haritada hayalet avla.
• Şampiyonlar listesinde adını en üste taşı.

☁️ İLERLEMEN KAYBOLMASIN
• İstersen Google ile giriş yap, ilerlemeni buluta yedekle ve başka telefona taşı.

🌍 6 DİL
• Türkçe, English, Español, 简体中文, हिन्दी, العربية — oyun telefonunun dilinde açılır, menüden değiştirebilirsin.

Ücretsiz oyun: gerçek parayla satın alma yok. Oyundaki para, elmas ve zümrüt yalnızca oynayarak kazanılır. Oyun bitişlerinde arada bir reklam gösterilir; oyun sırasında reklam yok.

## Google Play – Uygulama içeriği formları

| Bölüm | Cevap |
|---|---|
| Gizlilik politikası | yukarıdaki adres |
| Uygulama erişimi | Tüm işlevler özel erişim olmadan kullanılabilir |
| Reklamlar | **Evet**, reklam içeriyor (Google AdMob: oyun bitti ekranında geçiş + isteğe bağlı ödüllü reklam) |
| İçerik derecelendirmesi (IARC) | Kategori: Oyun. Şiddet: **çizgi film / fantastik** (hayaletlere ateş etme), kan yok. Cinsellik, küfür, uyuşturucu, kumar: Hayır. Kullanıcılar birbiriyle etkileşir: **Evet** (çevrimiçi oda, herkese açık takma ad, 3.13.0'dan beri arkadaş ekleme ve odaya davet; sohbet yok). Konum paylaşımı: Hayır. Dijital ürün satın alma: Hayır |
| Hedef kitle | 13-15, 16-17, 18 ve üzeri · "Çocuklara hitap ediyor mu?" sorusuna **Hayır** |
| Haber uygulaması · Kamu · Finans · Sağlık | Hayır · Hayır · Yok · Yok |
| Reklam kimliği | **Evet** — amaç: **Reklam veya pazarlama** (AdMob SDK `AD_ID` iznini ekler) |
| Hesap silme | Evet, hesap oluşturulabiliyor (Google ile giriş) → adres: yukarıdaki "Hesap silme adresi" |

### Veri güvenliği formu

- Veri toplanıyor mu: **Evet**. Aktarımda şifreleniyor mu: **Evet** (HTTPS). Silme isteği: **Evet** (oyun içi + e-posta).
- Paylaşım: **Evet** — Google AdMob SDK'sı aşağıdaki "AdMob" satırlarını reklam amacıyla Google'a aktarır.
  Firebase verileri paylaşılmıyor (Firebase hizmet sağlayıcıdır, "paylaşım" sayılmaz).

| Veri türü | Toplanıyor | İsteğe bağlı | Amaç |
|---|---|---|---|
| Kişisel bilgiler › Ad (Google hesap adı) | Evet | Evet | Hesap yönetimi |
| Kişisel bilgiler › E-posta adresi | Evet | Evet | Hesap yönetimi |
| Kişisel bilgiler › Kullanıcı kimlikleri (Firebase anonim kimliği — 3.10.2'den beri açılışta herkese; Google ile girişte aynı kimlik) | Evet | **Hayır** | Uygulama işlevleri, hesap yönetimi |
| Uygulama etkinliği › Diğer kullanıcı içeriği (takma ad, oyun ilerlemesi, puan) | Evet | Evet | Uygulama işlevleri |
| Kişiler › Kişiler (3.13.0: oyun içi arkadaş listesi, istekler, engeller — avcı adları) | Evet | Evet | Uygulama işlevleri |
| Uygulama etkinliği › Diğer işlemler (3.13.0: çevrimiçi durum — çevrimiçi / odada / çevrimdışı — ve oyuna davetler) | Evet | Evet | Uygulama işlevleri |
| AdMob · Konum › Yaklaşık konum (IP'den) | Evet, **paylaşılıyor** | Hayır | Reklam veya pazarlama, dolandırıcılığı önleme |
| AdMob · Cihaz veya diğer kimlikler (reklam kimliği) | Evet, **paylaşılıyor** | Hayır | Reklam veya pazarlama, analiz, dolandırıcılığı önleme |
| AdMob · Uygulama etkinliği › Uygulama etkileşimleri (reklam tıklama/izleme) | Evet, **paylaşılıyor** | Hayır | Reklam veya pazarlama, analiz |
| AdMob · Uygulama bilgileri ve performans › Kilitlenme günlükleri, Teşhis | Evet, **paylaşılıyor** | Hayır | Analiz, dolandırıcılığı önleme |

Hassas konum, telefon rehberi (cihazdaki kişiler), fotoğraf, mesaj, finans, sağlık, tarama geçmişi: **toplanmıyor**.

**API ile yazım (24 Ekim 2026'dan beri):** form [`veri-guvenligi.csv`](veri-guvenligi.csv) ile yazılır
(`play-istek.txt` › `veriguvenligi uygula`; `android/play.mjs` önce seçili türleri ve yanıtları yazdırır). CSV, Google'ın
şablonundan bu tabloya göre üretildi; her türde "geçici işleme: hayır". Şablonda olmayan hesap bölümü: hesap oluşturma
OAuth (Google ile giriş), hesap silme ve veri silme adresi Hesap silme sayfası. Yazım formun tamamını değiştirir; Play eksik
ya da çelişkili yanıtı reddeder. Bir yanıt değişince önce bu tablo, sonra CSV güncellenir.
3.13.0 (arkadaşlar): Google'ın tanımında **Kişiler** "kullanıcı adları gibi sosyal grafik bilgisini" de kapsar; oyun içi
arkadaş listesi bu türde, çevrimiçi durum ve davetler "oyun içi diğer etkinlik ve işlemler" tanımıyla **Diğer işlemler**
türünde beyan edilir ([Play Console Yardım: Veri güvenliği](https://support.google.com/googleplay/android-developer/answer/10787469)).
Paylaşılmıyor (yalnız hizmet sağlayıcı Firebase); Hesabı Sil ve e-posta isteğiyle silinir. Tur sonu sıralaması için
odaya yazılan hayalet sayısı "Diğer kullanıcı içeriği (oyun ilerlemesi, puan)" satırına girer, form değişmez.
AdMob satırları Google'ın AdMob için yayımladığı veri güvenliği rehberine göredir; AB/İngiltere/İsviçre'de UMP onay formu gösterilir.
Play Oyun Hizmetleri (3.10.4): skor ve başarımlar "Uygulama etkinliği › Diğer kullanıcı içeriği (oyun ilerlemesi, puan)",
SDK'nın analiz/teşhis verisi "Uygulama bilgileri ve performans › Teşhis" satırına girer; ikisi zaten beyan edildiği için form
değişmedi. Play Games profili (oyuncu etiketi, avatar) Google'ın kendi hesabıdır, oyun okumaz
([Google: PGS veri beyanı](https://developer.android.com/games/pgs/data-collection)).
