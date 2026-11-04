# Tavla — mağaza metinleri

`android/play.mjs magaza` (PLAY_UYGULAMA=tavla) bu dosyadan "Uygulama adı", "Destek e-postası", "Gizlilik politikası"
satırlarını ve "Kısa açıklama" / "Uzun açıklama" bölümlerini okur (ad ≤30, kısa ≤80, uzun ≤4000 karakter;
`test/magaza.test.mjs` denetler). Web sitesi alanı gizlilik adresinden türetilir.

## Ortak

- **Uygulama adı:** Tavla – Sesli Kahvehane
- **Geliştirici adı:** Poyraz Workshop
- **Paket adı:** `com.poyrazworkshop.tavla`
- **Tür ve kategori:** Oyun · Masa oyunu
- **Fiyat:** Ücretsiz · **Reklam içerir** (Google AdMob) · Uygulama içi satın alma yok
- **Hedef kitle:** 13-15, 16-17, 18 ve üzeri (13 altı seçilmez: yabancılarla yazılı ve sesli sohbet var)
- **Gizlilik politikası:** https://mahmuttari.github.io/Lispler/tavla/gizlilik.html
- **Hesap silme adresi:** https://mahmuttari.github.io/Lispler/tavla/hesap-silme.html
- **Destek e-postası:** poyrazworkshop7@gmail.com
- **Mağaza dili:** tr-TR

## Kısa açıklama

Pala Dayı'yla kahvehane tavlası: sesli yorumcu, çevrimiçi oyun, arkadaş daveti.

## Uzun açıklama

Tavla, kahvehanenin havasını telefonuna getiren klasik Türk tavlası. Zarlar tıkırdar, pullar tahtaya oturur, rakibin de boş durmaz: her zarına, her kırdığın pula, her marsa bir lafı vardır!

🎙️ SESLİ YORUMCULAR
Bilgisayara karşı oynarken üç karakterden birini seç:
• Pala Dayı: mahallenin yaşlı kurdu. "Kır bakalım, devran döner!"
• Genç Mert: esprili, hızlı, biraz da iddialı.
• Selim Bey: kültürlü, ağırbaşlı; her hamleye bir söz bulur.
480'den fazla seslendirilmiş replik. Yorumcu konuşsun, balonla yazsın ya da ikisi birden; istersen tamamen sustur.

🎲 ÜÇ OYUN BİÇİMİ
• Bilgisayara karşı: yapay zekâ rakip hamlelerini tartarak oynar.
• İki oyunculu: aynı telefonda, sırayla.
• Çevrimiçi: hızlı eşleşmeyle rastgele bir rakip bul ya da 4 harfli oda koduyla arkadaşını çağır.

🏆 MAÇ VE RÜTBE
Tek el, 5, 7 ya da 11 puanlık maç. Kazanınca +1, mars yaparsan +2 puan. Acemi'den Ordinaryüs'e on rütbe; Yaşayan Efsaneler listesinde yerini al.

🎨 KENDİ MASAN
Klasik ahşap, mermer, vintage ya da mücevher pullar; altı tahta deseni; yeşil keçeden ceviz ahşaba altı masa örtüsü. Hep Yek'ten Düşeş'e zar adları ve manileri de cabası.

👥 ARKADAŞLARINLA
Rumuzla arkadaş ekle, çevrimiçi olanları gör, tek dokunuşla oyuna davet et. Çevrimiçi oyunda hazır mesajlar ve yazılı sohbet var; iki taraf da onay verirse sesli sohbet de.

🛡️ SAYGILI MASA
Sohbette argo filtresi var. Rahatsız eden oyuncuyu tek dokunuşla şikâyet edebilir ve engelleyebilirsin: engellediğin kişinin mesajlarını görmezsin, sesli sohbet ve davet isteklerini almazsın.

🔒 GİZLİLİK
Kayıt zorunlu değil; misafir olarak hemen oynarsın. Puanlarını korumak istersen hesabını e-posta ya da Google ile yedeklersin. E-postan diğer oyunculara gösterilmez. Hesabını oyunun içinden tek dokunuşla silebilirsin.

Ücretsiz; uygulama içi satın alma yok. Reklam yalnız ana menünün altında ve maç bittikten sonra gösterilir, oyun sırasında asla. Para ya da ödül için oynanmaz.

## Uygulama içeriği (Play Console › Politika › Uygulama içeriği)

| Bölüm | Cevap |
|---|---|
| Gizlilik politikası | yukarıdaki adres |
| Uygulama erişimi | Tüm işlevler özel erişim olmadan kullanılabilir (misafir girişi) |
| Reklamlar | **Evet, reklam içeriyor** (AdMob) |
| İçerik derecelendirmesi (IARC) | Kategori: Oyun. Reklam: Evet (yalnız genel izleyiciye uygun, `maxAdContentRating: General`). Şiddet, korku, cinsellik, uyuşturucu: Hayır. Küfür: Hayır (karakter replikleri argosuz; sohbette argo filtresi). **Kumar:** Hayır — gerçek ya da sanal para, bahis, jeton yok; zar şans unsurudur ama ödül yoktur. Kullanıcılar birbiriyle etkileşim kurar: **Evet** (yazılı ve sesli sohbet, kullanıcı adları). Konum paylaşımı: Hayır. Dijital ürün satın alma: Hayır |
| Hedef kitle | **13-15, 16-17, 18 ve üzeri** · Çocuklara hitap etmiyor |
| Haber uygulaması | Hayır |
| Veri güvenliği | aşağıdaki tablo (`veri-guvenligi.csv`, `play-istek.txt` › `veriguvenligi uygula`) |
| Reklam kimliği | **Evet** → amaç: **Reklam veya pazarlama** (+ Analiz, Dolandırıcılığı önleme: AdMob SDK) |
| Kamu uygulaması · Finansal özellikler · Sağlık | Hayır · Yok · Yok |

## Veri güvenliği formu

`araclar/veri-guvenligi.mjs` bu tabloyla `veri-guvenligi.csv`'yi üretir. Oyun verisi **toplanır, paylaşılmaz**; AdMob'un
verisi **toplanır ve paylaşılır** (son dört satır); aktarımda
şifrelenir; kullanıcı silme isteyebilir (uygulama içi + hesap silme adresi). Hesap oluşturma: **OAuth (Google)** ve
**kullanıcı adı + şifre** (e-posta ile yedekleme) — şablonda yalnız OAuth seçeneği olduğu için ikincisi Console'da elle
işaretlenir (PLAY-YAYIN.md › 6).

| Veri türü | Ne | Zorunlu mu | Amaç |
|---|---|---|---|
| Ad | Rumuz (takma ad) | İsteğe bağlı ("Misafir") | Uygulama işlevi, hesap yönetimi |
| E-posta adresi | Yalnız hesabını yedekleyende | İsteğe bağlı | Hesap yönetimi |
| Kullanıcı kimlikleri | Firebase kullanıcı kimliği (anonim dahil) | Zorunlu | Uygulama işlevi, hesap yönetimi |
| Diğer kullanıcı içeriği | Sohbet mesajları, şikâyetler | İsteğe bağlı | Uygulama işlevi, kötüye kullanımı önleme |
| Diğer uygulama etkinliği | Puan, galibiyet/mağlubiyet, arkadaş listesi, son görülme, oda durumu | Zorunlu | Uygulama işlevi |
| Ses kayıtları | Sesli sohbet (iki taraf onaylarsa; kaydedilmez, geçici işlenir) | İsteğe bağlı | Uygulama işlevi |
| Yaklaşık konum | AdMob: IP adresinden | Zorunlu | Reklam, analiz, dolandırıcılığı önleme (paylaşılır) |
| Uygulama etkileşimleri | AdMob: açılış, dokunma, reklam izleme | Zorunlu | aynı (paylaşılır) |
| Tanılama | AdMob: SDK başarımı | Zorunlu | aynı (paylaşılır) |
| Cihaz veya diğer kimlikler | AdMob: reklam kimliği | Zorunlu | aynı (paylaşılır) |

Toplanmayanlar: kesin konum, rehber, fotoğraf; analiz ya da çökme raporu SDK'sı yok. Avatar görseli
api.dicebear.com'dan kullanıcı kimliğinin tek yönlü özetiyle istenir (kimlik ve rumuz gönderilmez; hizmet yalnız IP
adresini görür); Play'in tanımında bu bir paylaşım sayılmaz, gizlilik politikasında yazılıdır.
