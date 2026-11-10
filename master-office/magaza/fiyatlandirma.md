# Master Office — abonelikler ve fiyatlar

Kaynak: sahibin rehberi (`MasterOffice_PlayStore_Paketi/00_REHBER_Claude_icin.md` §9). Ürün ve plan kimlikleri
**birebir** böyle olmalı: uygulama (Google Play Billing 9.1.0) bu kimlikleri arar. Etkinleştirmeden önce tablo
kullanıcıya gösterilir.

| Ürün kimliği | Ad (tr / en) | Not |
|---|---|---|
| `mo_reklamsiz` | Reklamsız / Ad-free | Reklam yok; araçlarda günlük kural sürer |
| `mo_pro` | Pro / Pro | Reklam yok + bütün araçlar sınırsız |
| `mo_master` | Master / Master | Tanımlanır ve etkinleştirilir, uygulamada şimdilik gizli (ileride açılacak) |

**Her üründe temel plan:** kimlik `yillik` · **otomatik yenilenen** · faturalandırma dönemi **1 yıl** · bütün ülkeler.
Önce **ABD doları** fiyatı girilir ve öbür ülkeler buna göre güncellenir; sonra **Türkiye** fiyatı **elle** yazılır.

**Her temel planda giriş teklifi:** kimlik `ilk-yil` · uygunluk **Yeni müşteri edinme** (bu ürünü daha önce almamış
olanlar) · tek aşama: **tek seferlik ödeme / sabit fiyat**, süre **1 yıl**.

| Paket | Türkiye ilk yıl (teklif) | Türkiye sonra (temel plan) | ABD doları ilk yıl | ABD doları sonra |
|---|---|---|---|---|
| Reklamsız | ₺49 | ₺99 / yıl | $2.99 | $4.99 / yıl |
| Pro | ₺499 | ₺999 / yıl | $14.99 | $29.99 / yıl |
| Master | ₺999 | ₺1,999 / yıl | $29.99 | $59.99 / yıl |

Uygulama fiyatı kendisi yazmaz; Play'deki fiyatı ve teklifi gösterir ("İlk yıl ₺49, sonra ₺99/yıl", normal fiyatın üzeri
çizili). İndirim bilerek giriş teklifiyle verilir: Türkiye'de üzeri çizili fiyatın gerçekten uygulanan bir fiyat olması
gerekir.

Abonelik oluşturmak için Play'de uygulamanın `com.android.vending.BILLING` izinli bir AAB'si (3.5.1 yeterli) ve hesapta
ödeme profili gerekir.
