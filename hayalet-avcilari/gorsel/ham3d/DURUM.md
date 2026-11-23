# 3D görünümlü karakterler: durum

Kullanıcının isteği (23 Kasım 2026): karakterler ChatGPT ile mevcut görünümlerinden esinlenerek baştan, 3D görünümlü
(2.5D), animasyonlu duruş, yürüyüş ve atışla. İstemler: `../CHATGPT-ISTEMI-3D.md`. Kod Evren'de (bulut Claude yönetir).

## Kullanıcının sabit kuralları (23 Kasım 2026, tüm karakterler için)

- Cinsiyetler belirgin. **Kinkin ve Veryi erkek** (her kostümde; "Pembe Prenses" pembe prens olarak çizildi). Bazı
  karakterler kız olabilir.
- Açık kostüm yok: dekolte, askı ve kolsuz üst yok; kollar en az dirseğe, bacaklar en az dize kadar kapalı; göğüs
  görünmez.
- Makyaj yok.
- Tasarım (D) paftalarında karakterler imza silahlarını 3D olarak elinde tutar (kullanıcı istedi). Animasyon (A)
  paftalarında eller boş kalır; silahlar W paftalarından ayrıca gelir.
- Oranlar daha az bebeksi: baş boyun yaklaşık %30'u, genç kahraman oranı. Yüz kendinden emin ve güler yüzlü.

## İşleme

ChatGPT'nin çıktısında saydamlığı neredeyse sıfır lekeler (alfa ≤ 16) silinir, alfa ≥ 241 tam opak yapılır. ChatGPT
boyu dinlemediği için her hücredeki karakter 420 px boya ölçeklenir, yatayda ortalanır, ayakları hücre altından 24 px
yukarıya oturtulur. Dosyalar 1536 × 1024, saydam.

| Pafta | Durum | Not |
|---|---|---|
| D01 | **tamam** | Kinkin ve Veryi; 3. denemede kullanıcı onayladı |
| D02–D06 | bekliyor | tasarım; her biri kullanıcı onayıyla |
| A01–A34 | bekliyor | animasyon (yürüyüş 1-4, nefes 5-6, atış 7-8) |
| W1–W3 | bekliyor | silahlar |
