# Arayüz görselleri: durum

Kullanıcının isteği (23 Kasım 2026): arayüz zenginleşsin, karakter tanıtımları zengin içerikle yazılsın, görseller
ChatGPT'de üretilsin. İstemler: `../CHATGPT-ISTEMI-ARAYUZ.md`. Kodu Evren yazar, işi bulut Claude yönetir.
Karakter kuralları `../ham3d/DURUM.md` ile aynıdır.

| Pafta | İçerik | Durum |
|---|---|---|
| U01 | Kahraman kartları 1-6 | **tamam**: 1. denemede kullanıcı onayladı (referans D01–D03) |
| U02 | Kahraman kartları 7-12 | **tamam**: 1. denemede kullanıcı onayladı (referans D04–D06); Fanatik'in rüzgâr halkası sol kenara 24 px'ten yakın |
| U03 | Güç rozetleri 1-6 | üretildi (1. deneme, referans D01); toplu gösterim bekleniyor |
| U04 | Güç rozetleri 7-12 | üretildi (1. deneme, referans D01; ChatGPT'nin iki seçeneğinden 2.'si: kafatassız bomba, beş lolipop); toplu gösterim bekleniyor |
| U05 | Geliştirme simgeleri | üretildi (1. deneme, referans D01; ChatGPT'nin iki seçeneğinden 2.'si: daha iri simgeler, zırhlı eldiven); toplu gösterim bekleniyor |
| U06 | Para ve ödüller | üretildi (1. deneme, referans D01); toplu gösterim bekleniyor |
| U07 | Menü simgeleri 1 | üretildi (1. deneme, referans D01); Güllu'nun tacı sivri (D04'te kare taç); 2. ve 6. hücre sol kenara 3–6 px; toplu gösterim bekleniyor |
| U08 | Menü simgeleri 2 | üretildi (1. deneme, referans D01); Güllu'nun tacı sivri; 1. hücrede el sol kenara 18 px; toplu gösterim bekleniyor |
| U09 | Giriş ekranı kahraman resmi (dikey) | üretildi (1. deneme, referans D01), kullanıcı onayı bekleniyor; kusurlar: Marli'nin saçı siyah topuz (Rani'ninki gibi), Kornet'in yüzü kızgın, Güllu'nun tacı sivri, kenar boşluğu yok (yan ve alt kenara değiyor) |
| U10 | Oyun sonu ve olay amblemleri | bekliyor |

Üretim (23 Kasım 2026, yerel Claude): tek ChatGPT sohbeti, ARAYÜZ ANA İSTEMİ bir kez gönderildi. Paftalar ChatGPT'nin
verdiği PNG olarak, işlenmeden kaydedilir (1536 × 1024, RGBA). Arka planda alfa 1–16 arası hafif bir pus kalır;
`araclar/gorsel_kes.py` kesimde alfa < 40'ı zaten siler.

## Ek animasyon paftaları (kayıt yeri `gorsel/ham/`)

| Pafta | İçerik | Durum |
|---|---|---|
| N14 | Şimşek çarpması | bekliyor |
| N15 | Roket uçuşu, duman izi | bekliyor |
| N16 | Şifa, görünmezlik | bekliyor |
| N17 | Güç açılışı, güç halesi | bekliyor |
| N18 | Enerji mermisi, baloncuk mermisi | bekliyor |
| N19 | Bölüm atlama, hasar alma | bekliyor |
| N20 | Donma, çözülme | bekliyor |

## Yön paftaları (öncelikli; kayıt yeri `gorsel/ham3d/`)

Y01–Y34: İPTAL (24 Kasım 2026). Kullanıcı gerçek 3D modele karar verdi; avcılar kodla kurulan 3D modeller (`../../UC-BOYUT.md`).
