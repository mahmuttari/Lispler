# Harita yerleşim planları: durum

İstem: `../CHATGPT-ISTEMI-YERLESIM.md`. Çıktı JSON metnidir (resim değil); `Y01.json` … `Y03.json` olarak kaydedilir.

| Kod | İçerik | Durum |
|---|---|---|
| Y01 | 8 genel bölge yerleşimi | **üretildi** (27 Kas, ChatGPT, tek deneme); `y02-harabe-meydani`nın sağ üst objesi duvara değiyordu; ChatGPT'den düzeltmesi istendi, yalnız o obje u 0.78 v 0.07'ye taşındı; `yerlesim_derle.py` 8'ini de geçerli sayıyor |
| Y02 | 8 ruh hâli etiketli yerleşim (sakin, dar, kalabalık, gizemli) | **üretildi** (27 Kas, tek deneme); `yerlesim_derle.py` 8'ini de geçerli sayıyor |
| Y03 | 3 başlangıç bölgesi + 3 arena yerleşimi | **üretildi** (27 Kas, tek deneme); 6/6 geçerli. Arena planları istemdeki gibi merkez meydanı r 0.18–0.22 veriyor; derleyici önce her yerleşimde r ≤ 0.16 istiyordu, bulut oturumu arena için sınırı 0.24'e çıkardı (`6d28777`), 22 planın hepsi `www/yerlesim-sablonlari.js`'de |
