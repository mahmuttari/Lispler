# Harita yerleşim planları: durum

İstem: `../CHATGPT-ISTEMI-YERLESIM.md`. Çıktı JSON metnidir (resim değil); `Y01.json` … `Y03.json` olarak kaydedilir.

| Kod | İçerik | Durum |
|---|---|---|
| Y01 | 8 genel bölge yerleşimi | **üretildi** (27 Kas, ChatGPT, tek deneme); `y02-harabe-meydani`nın sağ üst objesi duvara değiyordu; ChatGPT'den düzeltmesi istendi, yalnız o obje u 0.78 v 0.07'ye taşındı; `yerlesim_derle.py` 8'ini de geçerli sayıyor |
| Y02 | 8 ruh hâli etiketli yerleşim (sakin, dar, kalabalık, gizemli) | **üretildi** (27 Kas, tek deneme); `yerlesim_derle.py` 8'ini de geçerli sayıyor |
| Y03 | 3 başlangıç bölgesi + 3 arena yerleşimi | **üretildi** (27 Kas, tek deneme); 3 başlangıç geçerli. **Bulut için:** 3 arena planı istemdeki gibi merkez meydanı r 0.18–0.22 veriyor, ama `yerlesim_derle.py` meydanı her yerleşimde r 0.08–0.16 ile sınırladığı için üçünü de atlıyor; `uygun` içinde `arena` varsa r 0.22'ye kadar kabul edilmeli (plan doğru, derleyici dar) |
