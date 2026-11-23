# 3D görünümlü karakterler: durum

Kullanıcının isteği (23 Kasım 2026): karakterler ChatGPT ile mevcut görünümlerinden esinlenerek baştan, 3D görünümlü
(2.5D), animasyonlu duruş, yürüyüş ve atışla. İstemler: `../CHATGPT-ISTEMI-3D.md`. Kod Evren'de (bulut Claude yönetir).

## Kullanıcının sabit kuralları (23 Kasım 2026, tüm karakterler için)

- Cinsiyetler belirgin. **Kinkin, Veryi, Kornet, Kenit, Ponko ve Fanatik erkek; Marli, Güllu, Rani, Beri, Silsen ve Serçin kız** (6 erkek, 6 kız) (her kostümde; "Pembe Prenses" pembe prens olarak çizildi). 
- Açık kostüm yok: dekolte, askı ve kolsuz üst yok; kollar en az dirseğe, bacaklar en az dize kadar kapalı; göğüs
  görünmez.
- Makyaj yok.
- Tasarım (D) paftalarında karakterler imza silahlarını 3D olarak elinde tutar (kullanıcı istedi). Animasyon (A)
  paftalarında eller boş kalır; silahlar W paftalarından ayrıca gelir.
- Oranlar daha az bebeksi: baş boyun yaklaşık %30'u, genç kahraman oranı. Yüz kendinden emin ve güler yüzlü.

## İşleme

ChatGPT'nin çıktısında saydamlığı neredeyse sıfır lekeler (alfa ≤ 16) silinir, alfa ≥ 241 tam opak yapılır. ChatGPT
boyu dinlemediği için karakterler ölçeklenir (D02'den itibaren bütün paftaya tek ölçek: en uzun karakter 420 px, karakterlerin birbirine göre boyu korunur; D01'de her hücre ayrı 420 px), yatayda ortalanır, ayakları hücre altından 24 px
yukarıya oturtulur. Dosyalar 1536 × 1024, saydam.

| Pafta | Durum | Not |
|---|---|---|
| D01 | **tamam** | Kinkin ve Veryi; 3. denemede kullanıcı onayladı |
| D02 | **tamam** | Kornet (erkek, tüylü yaratık) ve Marli (kız); 1. denemede kullanıcı onayladı |
| D03 | **tamam** | Kenit (erkek, kapüşonlu) ve Ponko (erkek, kovboy); 1. denemede kullanıcı onayladı |
| D04 | **tamam** | Güllu (kız, kare taç, yay) ve Rani (kız, topuzlar, sapan); 1. denemede kullanıcı onayladı |
| D05 | **tamam** | Beri (kız; kullanıcının isteğiyle lolipop kafa yerine şeker temalı insan kız, eskisini yalnız bere ve tokayla anımsatır, silahsız) ve Fanatik (erkek, karateci, nunçaku); kullanıcı onayladı |
| D06 | **tamam** | Silsen (kız, diz boyu elbise ve tayt, çiçekli bayrak asa), Serçin (kız, gaga maskesi; Kanatlı Kedi'de gaga yok), Bot; 6. hücre boş. ChatGPT'nin iki seçeneğinden 1.'yi kullanıcı seçti |
| A01–A34 | bekliyor | animasyon (yürüyüş 1-4, nefes 5-6, atış 7-8) |
| W1–W3 | bekliyor | silahlar |
