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

A ve W paftaları ölçeklenmedi (ChatGPT'nin boyutu korunur). Sisli zemin gelen paftalarda (A09, A14, A18, W1) hücre
sınırlarındaki en yüksek alfanın biraz üstü silinip kenar geçişi yeniden ölçeklendi; sınırı taşan karelerde (A14, A15,
A26'nın 7. karesi) kare 10–12 px sağa kaydırıldı; W1'in yayı, W2'nin asası ve tüyü, W3'ün baloncuk tabancası ve
bazukası 24 px kenar boşluğu için hücrede ortalandı ya da orantılı küçültüldü.

## Oyuna bağlayacak oturum için notlar

- **A01–A34**: 4 × 2 hücre, hücre 384 × 512. 1-4 yürüyüş, 5-6 nefes, 7-8 atış. Bir pafta içinde boy farkı ≤ %6, ayak
  hizası ≤ 13 px oynar; paftalar arasında ayak boşluğu 24–57 px değişir, bu yüzden her pafta kendi ortak kutusundan
  kesilmeli. Eller her karede boş; atışta sağ kol göğüs hizasında öne uzanır (silah oradan çizilir).
- **Kostüm sırası** oyundaki sırayla aynı: A01–A03 Kinkin 0-2, A04–A06 Veryi, A07–A09 Kornet, A10–A12 Marli, A13–A15
  Kenit, A16–A18 Ponko, A19–A21 Güllu, A22–A24 Rani, A25–A27 Beri, A28–A30 Fanatik, A31–A32 Silsen, A33–A34 Serçin.
- **Beri'nin silahı yok** (oyunda da yalnız envanter silahı); D05'te eli boş. **Bot** yalnız D06 5. hücrede, animasyon
  paftası yok.
- **W1**: 1 Kinkin enerji tabancası, 2 Veryi çekici, 3 Marli arbaleti, 4 Ponko revolveri, 5 Güllu yayı (dik duruyor,
  kiriş solda), 6 Rani sapanı. **W2**: 1 Fanatik nunçakusu, 2 Kornet asası, 3 Kenit hançeri, 4 Silsen bayrak asası,
  5 Serçin tüyü, 6 boş. **W3**: 1 Baloncuk, 2 Kırmızı Lazer, 3 Yeşil İkiz, 4 Saçma Topu, 5 Bazuka, 6 boş. Hepsi
  yandan, namlu sağa, kabza solda.
- W2 ve W3 ayrı bir ChatGPT sohbetinde (W1 örnek eklenerek) üretildi; ilk sohbette W2 üç kez beyaz ya da boyalı dama
  zeminli gelmişti. Üslup W1 ile aynı.

| Pafta | Durum | Not |
|---|---|---|
| D01 | **tamam** | Kinkin ve Veryi; 3. denemede kullanıcı onayladı |
| D02 | **tamam** | Kornet (erkek, tüylü yaratık) ve Marli (kız); 1. denemede kullanıcı onayladı |
| D03 | **tamam** | Kenit (erkek, kapüşonlu) ve Ponko (erkek, kovboy); 1. denemede kullanıcı onayladı |
| D04 | **tamam** | Güllu (kız, kare taç, yay) ve Rani (kız, topuzlar, sapan); 1. denemede kullanıcı onayladı |
| D05 | **tamam** | Beri (kız; kullanıcının isteğiyle lolipop kafa yerine şeker temalı insan kız, eskisini yalnız bere ve tokayla anımsatır, silahsız) ve Fanatik (erkek, karateci, nunçaku); kullanıcı onayladı |
| D06 | **tamam** | Silsen (kız, diz boyu elbise ve tayt, çiçekli bayrak asa), Serçin (kız, gaga maskesi; Kanatlı Kedi'de gaga yok), Bot; 6. hücre boş. ChatGPT'nin iki seçeneğinden 1.'yi kullanıcı seçti |
| A01–A34 | **tamam** | animasyon (yürüyüş 1-4, nefes 5-6, atış 7-8), 4 × 2 hücre 384 × 512; hazır: A01, A02, A03, A04, A05, A06, A07, A08, A09, A10, A11, A12, A13, A14, A15, A16, A17, A18, A19, A20, A21, A22, A23, A24, A25, A26, A27, A28, A29, A30, A31, A32, A33, A34 |
| W1–W3 | **tamam** | silahlar; hazır: W1, W2, W3 |
