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
| Ölçü Kutusu | Kabuk eklendi. Sensör eklentisi Swift'le yazılacak; ışık ölçer iOS'ta yok (ortam ışığı sensörüne açık API yok) **[K]** | `com.poyrazworkshop.smartmeasure` |
| İz Haritası | **Alınmadı:** iOS, AirTag'in "Bul" yayınlarını başka uygulamalara göstermiyor; ana işlev çalışmaz ve inceleme reddeder **[K]** | — |

- Apple hesabı **bireysel**: Team "MAHMUT TARI". Apple, şahıs işletmesini kuruluş olarak kaydetmiyor; App Store'da
  satıcı adı olarak sahibin adı görünür **[K]** (D-U-N-S özeti §2).

## 1. Kullanıcıdan gerekenler (sırayla)

1. **App Store Connect API anahtarı → GitHub Secrets** (Lispler › Settings › Secrets and variables › Actions):
   - `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_PRIVATE_KEY` (`.p8` dosyasının içeriği).
   - Bu üçü NetcadDevelop'taki (DWG OfficeZip) ile aynı ad ve değerdir; aynı anahtar kullanılabilir.
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
| Capacitor iOS kabuğu, Info.plist, simge, açılış, simülatör derlemesi (`ios-ortak/`, `ios-kucuk.yml`) | Yapıldı (PR #17) |
| Reklam: platforma göre AdMob kimlikleri, ATT izni (UMP'den sonra), test kimliğiyle yükleme reddi | Sırada |
| Abonelik: iOS ürünleri (`<paket>.adfree.monthly` / `.yearly`), satın alımları geri yükleme, Apple'ın istediği abonelik açıklamaları ve Kullanım Koşulları bağlantısı, iOS'ta "Google Play" sözcüğü yok | Sırada |
| Ölçü Kutusu sensör eklentisi (Swift): su terazisi, pusula, ses ölçer; ışık ölçer iOS'ta gizli | Sırada |
| App Store Connect betiği (NetcadDevelop › `DwgViewer/tools/asc.mjs`'den): paket kimliği kaydı, bulut imzasıyla arşiv ve yükleme, metinler, yaş, abonelikler, incelemeye gönderme | Sırada; anahtar gerekir |
| Not Defteri: `ios.yml`'deki gizli değer adları NetcadDevelop'takilerle birleştirilir | Sırada |
| Mağaza metinleri (Play metinlerinden; App Store sınırları: ad 30, alt başlık 30, anahtar sözcük 100, açıklama 4000) ve iPhone ekran görüntüleri (6,9″ 1320×2868) | Sırada |

İncelemeye gönderme ve satışa açma yalnız kullanıcının açık onayıyla yapılır.

## 3. İnceleme riskleri **[K]**

- **4.3 (spam):** hesap makinesi, birim çevirici ve terazi kategorileri kalabalık. Açıklama ve görseller uygulamanın
  ayrıştığı yönü (mühendislik birimleri, bilimsel hesap, çok dil) öne çıkarır.
- **2.3.10:** iOS sürümünde başka platform adları (Google Play) geçmemeli.
- **3.1.2:** abonelik ekranında fiyat, dönem, otomatik yenileme, gizlilik ve Kullanım Koşulları bağlantıları olmalı;
  geri yükleme düğmesi bulunmalı.
- **5.1.2:** kişiselleştirilmiş reklam için ATT izni istenmeli; izin verilmezse kişiselleştirilmemiş reklam gösterilir.
