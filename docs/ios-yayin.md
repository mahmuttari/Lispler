# Küçük uygulamalar — App Store'a yayın

Hazırlandı: 31 Ekim 2026. İşaretler: **[D]** kaynaktan doğrulandı, **[K]** kısmen doğrulandı ya da kullanıcının
denetlemesi gerekiyor.

## 0. Karar ve kapsam

- Kullanıcı: *"Hayalet avcılara ve kıble bulucu haricindeki uygulamaları apple hesabımdan da yayınla"*.
- Gelir modeli Android'deki gibidir (kullanıcının seçimi): AdMob reklamı ve reklamsız abonelik (Apple'ın uygulama içi
  satın alması).

| Uygulama | iOS durumu | Paket |
|---|---|---|
| Not Defteri | Swift projesi hazır (`ios/`), hiç yüklenmedi | `com.poyrazworkshop.notdefteri` |
| Unitica | Capacitor iOS kabuğu eklendi | `com.poyrazworkshop.unitica` |
| Calqora | Capacitor iOS kabuğu eklendi | `com.poyrazworkshop.calqora` |
| Ölçü Kutusu | Kabuk ve Swift sensör eklentisi hazır; ışık ölçer iOS'ta gösterilmez (ortam ışığı sensörüne açık API yok) **[K]** | `com.poyrazworkshop.smartmeasure` |
| İz Haritası | **Alınmadı:** iOS, AirTag'in "Bul" yayınlarını başka uygulamalara göstermiyor; ana işlev çalışmaz ve inceleme reddeder **[K]** | — |

- Apple hesabı **bireysel**: Team "MAHMUT TARI". Apple, şahıs işletmesini kuruluş olarak kaydetmiyor; App Store'da
  satıcı adı olarak sahibin adı görünür **[K]** (D-U-N-S özeti §2).

## 1. Kullanıcıdan gerekenler (sırayla)

1. **App Store Connect API anahtarı → GitHub Secrets** (Lispler › Settings › Secrets and variables › Actions):
   - `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_PRIVATE_KEY` (`.p8` dosyasının içeriği).
   - Bu üçü NetcadDevelop'taki (DWG OfficeZip) ile aynı ad ve değerdir; aynı anahtar kullanılabilir.
   - Anahtarın rolü **Admin** olmalı: yükleme Apple'ın bulut imzasını kullanır, bulut dağıtım sertifikası Admin ister **[K]**.
   - Not Defteri'nin eski `APPLE_TEAM_ID` ve `ASC_KEY_P8` secret'ları artık kullanılmıyor (takım kimliği API'den okunur);
     silinebilir.
   - `.p8` dosyası elde yoksa: App Store Connect › Users and Access › Integrations › App Store Connect API › Team Keys
     › "+" (erişim **Admin**). Dosya yalnız bir kez indirilir.
   - Değerler sohbete yazılmaz; doğrudan GitHub'a girilir.
2. **Paket kimlikleri:** anahtar girilince bulut oturumu dört paket kimliğini API ile kaydeder (`com.poyrazworkshop.…`).
3. **App Store Connect'te uygulama kayıtları** (API uygulama kaydı açamıyor **[D]**). Apps › "+" › New App, iOS, birincil
   dil Türkçe, paket kimliği listeden. Önerilen adlar (Play'dekiler; App Store'da ad benzersiz olmalı, alınmışsa yakını
   seçilir):

   | Uygulama | Önerilen ad | SKU |
   |---|---|---|
   | Not Defteri | Not Defteri – HTML Çalıştır | `notdefteri-ios` |
   | Unitica | Unitica – Birim Dönüştürücü | `unitica-ios` |
   | Calqora | Calqora – Bilimsel Hesap | `calqora-ios` |
   | Ölçü Kutusu | Ölçü Kutusu – Terazi, Cetvel | `olcukutusu-ios` |

4. **AdMob:**
   - Her uygulama için iOS kaydı (Uygulamalar › Uygulama ekle › iOS › henüz yayınlanmadı).
   - Her kayıtta bir **banner** ve bir **geçiş** reklam birimi.
   - Gizlilik ve mesajlaşma › **IDFA açıklama mesajı** (iOS) yayınlanır; AB onay mesajına iOS uygulamaları eklenir.
   - Kimlikler (`ca-app-pub-…~…` ve `…/…`) gizli değildir, sohbete yazılabilir. `<klasör>/ios/admob.properties`'e
     yazılır; Not Defteri için `ios/project.yml` › Release.
5. **Anlaşmalar:**
   - Paid Applications Agreement 29 Ekim 2026'da kabul edildi (Apple e-postası).
   - Banka ve vergi bilgileri App Store Connect › Business'ta tamam olmalı **[K]**. Tamam değilse abonelik satılmaz.
6. **App Privacy** (gizlilik etiketleri) ve **yaş derecesi:** App Store Connect'te tarayıcıdan doldurulur; gizlilik
   etiketleri API'de yok **[K]**. Yanıtlar her uygulamanın `magaza/veri-guvenligi.csv`'sinden çıkarılır; bilgisayardaki
   Claude doldurabilir.

## 2. Bulut oturumunun işleri

| Adım | Durum |
|---|---|
| Capacitor iOS kabuğu, Info.plist, simge, açılış, simülatör derlemesi (`ios-ortak/`, `ios-kucuk.yml`) | Yapıldı |
| Reklam: platforma göre AdMob kimlikleri (`<klasör>/ios/admob.properties`), ATT izni (UMP'den sonra, initialize'dan önce) | Yapıldı |
| Abonelik: iOS ürünleri (`<paket>.adfree.monthly` / `.yearly`, tek grupta), yalnız bu Apple hesabının geçerli hakları, geri yükleme, Apple'ın abonelik açıklaması, gizlilik ve Kullanım Koşulları (EULA) bağlantıları; iPhone'da "Google Play" sözcüğü yok (`.ios` / `_ios` metin ikizleri) | Yapıldı |
| Ölçü Kutusu sensör eklentisi (Swift, `smart-measure/ios/App/App/OlcerPlugin.swift`): su terazisi, kamerayla ölçüm, ses ölçer, cetvel; ışık ölçer iPhone'da gizli | Yapıldı |
| App Store Connect betiği (`ios-ortak/asc.mjs`) ve yükleme iş akışı (`ios-asc.yml`): durum, paket kimliği kaydı, önkontrol (test AdMob kimliğiyle yüklenmez), bulut imzasıyla arşiv ve TestFlight'a yükleme, işlenmeyi bekleme | Yapıldı; anahtar gerekir |
| Not Defteri: yükleme `ios-asc.yml`'e taşındı, secret adları birleştirildi | Yapıldı |
| Mağaza metinleri (Play metinlerinden; App Store sınırları: ad 30, alt başlık 30, anahtar sözcük 100, açıklama 4000), iPhone ekran görüntüleri (6,9″ 1320×2868), abonelik ürünleri ve yaş derecesi API ile | Sırada |

**Komutlar** (`ios-ortak/asc-istek.txt`'e yazılıp push edilir; ya da Actions › iOS App Store Connect › Run workflow):

| Komut | Ne yapar |
|---|---|
| `durum` | Salt okunur rapor: paket kimliği, uygulama kaydı, sürümler, yapılar, abonelikler |
| `paket uygula` | Eksik paket kimliklerini kaydeder (`uygula` yoksa yalnız plan) |
| `yukle <uygulama>` | `unitica`, `calqora`, `smart-measure`, `notdefteri`: derler, imzalar, TestFlight'a yükler |

İncelemeye gönderme ve satışa açma yalnız kullanıcının açık onayıyla yapılır; `asc.mjs`'te bunun komutu henüz yoktur.

## 3. İnceleme riskleri **[K]**

- **4.3 (spam):** hesap makinesi, birim çevirici ve terazi kategorileri kalabalık. Açıklama ve görseller uygulamanın
  ayrıştığı yönü (mühendislik birimleri, bilimsel hesap, çok dil) öne çıkarır.
- **2.3.10:** iOS sürümünde başka platform adları (Google Play) geçmemeli.
- **3.1.2:** abonelik ekranında fiyat, dönem, otomatik yenileme, gizlilik ve Kullanım Koşulları bağlantıları olmalı;
  geri yükleme düğmesi bulunmalı.
- **5.1.2:** kişiselleştirilmiş reklam için ATT izni istenmeli; izin verilmezse kişiselleştirilmemiş reklam gösterilir.
- **2.1 / 4.2 (Ölçü Kutusu):** iPhone'da çalışmayan özellik (ışık ölçer) gösterilmez. Kamera ve mikrofon izin metinleri
  Info.plist'te İngilizcedir (`smart-measure/ios/plist-ek.json`); Türkçe karşılık isteğe bağlıdır.
- **Cetvel (Ölçü Kutusu):** iOS ekran yoğunluğunu (ppi) bildirmez; eklenti model kimliğinden Apple'ın yayımladığı değeri
  kullanır, bilinmeyen modelde ölçeğe göre tahmin eder. Kullanıcı banka kartıyla kalibre edebilir.
