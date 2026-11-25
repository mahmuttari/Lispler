# Yerel Claude için ChatGPT iş sırası (güncel)

Bulut oturumu ChatGPT'ye erişemez; görselleri Mac'teki Claude ChatGPT'ye ürettirir. Her paketin kendi istem dosyası ve DURUM.md'si
vardır. Bu dosya yalnız **öncelik sırasını** verir. Kullanıcı 25 Kasım 2026'da istedi: *"bakır kahve cezvesi doğru görsel olmalı,
gpt kullan, yerel oturumu kullan"*.

1. **H01 (hemen):** `CHATGPT-ISTEMI-HIKAYE.md` › "Hatıra paftaları" › H01 (ülke 1–6; 1. hücre Türkiye'nin **bakır kahve cezvesi**:
   uzun saplı, el dövmesi bakır, köpüklü kahveli küçük cezve; fincan DEĞİL). Kayıt: `gorsel/hamhikaye/H01.png`.
   Kullanıcıya göster, onay gelince devam et.
2. **H02–H09:** kalan hatıra paftaları (aynı dosya). Toplu göstermek yeterli.
3. **K03, K04:** `CHATGPT-ISTEMI-EK.md` (bulut ve yıldırım çeşitleri, hayalet yuvaları).
4. **K02 kararı:** kullanıcı onaylarsa K02 olduğu gibi kalır (üç çeyrek açı, büyük parçalar kodda küçültülür).
5. **H10–H12, B01–B10, A01–A03:** hikâye resimleri ve animasyonlar (`CHATGPT-ISTEMI-HIKAYE.md`).
6. **J01–J12:** yolculuk paftaları (`CHATGPT-ISTEMI-YOLCULUK.md`).

Her paftadan sonra commit ve push yap (çalışma dalı `ccr-e316a7ca-5sw0ow`); bulut oturumu kesip oyuna bağlar
(`araclar/gorsel_kes.py`: H01–H09 → `hatira-<KOD>`, K01 → `an-carpilma-*`).
