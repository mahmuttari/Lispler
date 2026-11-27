# Harita yerleşim planları: durum

İstem: `../CHATGPT-ISTEMI-YERLESIM.md`. Çıktı JSON metnidir (resim değil); `Y01.json` … `Y03.json` olarak kaydedilir.

| Kod | İçerik | Durum |
|---|---|---|
| Y01 | 8 genel bölge yerleşimi | **üretildi** (27 Kas, ChatGPT, tek deneme); `yerlesim_derle.py` 7'sini geçerli sayıyor: `y02-harabe-meydani` sağ üst duvarı (u 0.74 v 0.17) yanındaki objeye (u 0.87 v 0.235) değiyor, derleyici atlıyor |
| Y02 | 8 ruh hâli etiketli yerleşim (sakin, dar, kalabalık, gizemli) | **üretildi** (27 Kas, tek deneme); `yerlesim_derle.py` 8'ini de geçerli sayıyor |
| Y03 | 3 başlangıç bölgesi + 3 arena yerleşimi | **üretildi** (27 Kas, tek deneme); 3 başlangıç geçerli. **Bulut için:** 3 arena planı istemdeki gibi merkez meydanı r 0.18–0.22 veriyor, ama `yerlesim_derle.py` meydanı her yerleşimde r 0.08–0.16 ile sınırladığı için üçünü de atlıyor; `uygun` içinde `arena` varsa r 0.22'ye kadar kabul edilmeli (plan doğru, derleyici dar) |
