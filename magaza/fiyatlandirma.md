# Pro abonelik fiyatlandırması

Fiyatlar uygulamanın kodunda değil, **Google Play Console** ve **App Store Connect** panellerinde ülke ülke
ayarlanır. Uygulama mağazanın gösterdiği yerel fiyatı (ör. "₺19,99", "$2.99") otomatik gösterir.

**Ürün kimliği (iki mağazada da aynı):** `notdefteri.pro.aylik` · Süre: **1 ay**, otomatik yenilenir

## Kural

| Grup | Fiyat | Hangi ülkeler |
|---|---|---|
| Türkiye | **₺19,99 / ay** | Türkiye |
| Düşük ve orta gelirli ülkeler | **20 TL'nin karşılığı** (yaklaşık 0,49 $) | Dünya Bankası'na göre "yüksek gelirli" olmayan tüm ülkeler |
| Zengin (yüksek gelirli) ülkeler | **2,99 $ / ay** (yerel karşılığı) | Aşağıdaki liste |

> 20 TL'nin dolar karşılığı kura göre değişir. Fiyat girerken panelin gösterdiği güncel kuru kullanın ve
> mağazanın izin verdiği en yakın fiyat noktasını seçin. Bir ülkede mağazanın **en düşük fiyatı** 20 TL
> karşılığından yüksekse o en düşük fiyatı seçin.

### Yüksek gelirli ülkeler (2,99 $ grubu)

_Öneri listesidir; Dünya Bankası sınıflandırması her yıl değiştiği için istediğiniz ülkeyi gruplar arasında taşıyabilirsiniz._

ABD, Kanada, Birleşik Krallık, İrlanda, Almanya, Fransa, Hollanda, Belçika, Lüksemburg, Avusturya, İsviçre,
Lihtenştayn, İtalya, İspanya, Portekiz, Malta, Kıbrıs (GKRY), Yunanistan, Slovenya, Hırvatistan, Çekya,
Slovakya, Polonya, Macaristan, Romanya, Estonya, Letonya, Litvanya, Danimarka, İsveç, Norveç, Finlandiya,
İzlanda, Avustralya, Yeni Zelanda, Japonya, Güney Kore, Tayvan, Hong Kong, Makao, Singapur, Brunei, İsrail,
Birleşik Arap Emirlikleri, Katar, Kuveyt, Bahreyn, Suudi Arabistan, Umman, Şili, Uruguay, Panama, Bahamalar,
Barbados, Trinidad ve Tobago, Porto Riko.

Geri kalan tüm ülkeler (ör. Azerbaycan, Kazakistan, Özbekistan, Ukrayna, Rusya, Mısır, Fas, Cezayir, Tunus, Irak,
Ürdün, Pakistan, Hindistan, Bangladeş, Endonezya, Filipinler, Vietnam, Tayland, Malezya, Brezilya, Meksika,
Arjantin, Kolombiya, Peru, Nijerya, Kenya, Güney Afrika…) → **20 TL karşılığı**.

## Google Play Console'da

1. **Para kazanma › Ürünler › Abonelikler › Abonelik oluştur**: Ürün kimliği `notdefteri.pro.aylik`, ad "Not Defteri Pro".
2. **Temel plan ekle**: kimlik `aylik`, tür **Otomatik yenilenen**, faturalandırma dönemi **1 ay**.
3. **Fiyatları ayarla**: önce tüm ülkeleri seçip **2,99 USD** girin ("Döviz kurlarını güncelle" ile hepsine dağıtılır).
4. Sonra Türkiye'yi seçip **19,99 TRY** yazın; düşük/orta gelirli ülkeleri seçip 20 TL karşılığını yerel parayla girin.
5. Temel planı **Etkinleştir**.

## App Store Connect'te

1. **Uygulama › Monetization › Subscriptions**: Abonelik grubu "Not Defteri Pro" oluşturun.
2. Abonelik ekleyin: Reference Name "Pro Aylık", Product ID `notdefteri.pro.aylik`, süre **1 Month**.
3. **Subscription Prices › Add Subscription Price**: temel ülke **United States**, fiyat **2,99 $** seçin;
   Apple diğer ülkelere dağıtır.
4. **Edit Prices** ile Türkiye için **₺19,99** fiyat noktasını, düşük/orta gelirli ülkeler için 20 TL'ye en yakın
   fiyat noktasını seçin.
5. Türkçe ve İngilizce "Display Name / Description" ekleyin, inceleme için ekran görüntüsü yükleyin (Pro penceresi).
