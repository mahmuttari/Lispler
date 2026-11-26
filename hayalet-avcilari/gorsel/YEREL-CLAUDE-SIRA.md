# Yerel Claude için ChatGPT iş sırası (güncel)

Bulut oturumu ChatGPT'ye erişemez; görselleri Mac'teki Claude ChatGPT'ye ürettirir. Her paketin kendi istem dosyası ve DURUM.md'si
vardır. Bu dosya yalnız **öncelik sırasını** verir. Kullanıcı 25 Kasım 2026'da istedi: *"bakır kahve cezvesi doğru görsel olmalı,
gpt kullan, yerel oturumu kullan"*.

> **Kullanıcının son talimatı (25 Kasım 2026, akşam):** *"GPT yerel oturuma prompt göndereceksin, Chrome ile chat üzerinden yapacak.
> Devam eden işi bozma."* Bu listedeki **bütün** paftalar Chrome'da chatgpt.com sohbetinde ürettirilir. Oyun koduna (`www/`, `test/`)
> dokunulmaz (bulutta Evren görevleri yazılıyor); yalnız PNG ve DURUM.md commit edilir, `git pull --no-rebase` sonra push.

0. **Z01–Z03 (EN ÖNCE, kullanıcı istedi 26 Kasım 2026):** `CHATGPT-ISTEMI-ZEMIN.md` — zemin süsleri ve yollar ("donatılar zemin
   ile uyum içinde olsun, kenarlarda çimenler kayalarla, zeminde yollar ... harita zeminlerini çevre ile uyumlu hale getirelim").
   Kayıt `gorsel/hamzemin/`. Ardından ülke canlılarının küçük animasyonları R51–R59 (kare düzeni: 1. kare R paftasındaki durağan
   objenin AYNISI, yalnız hareketli parça değişir; aynı boy ve merkez), sonra H02–H09, J02–J12.
1. **H01 (hemen):** `CHATGPT-ISTEMI-HIKAYE.md` › "Hatıra paftaları" › H01 (ülke 1–6; 1. hücre Türkiye'nin **bakır kahve cezvesi**:
   uzun saplı, el dövmesi bakır, köpüklü kahveli küçük cezve; fincan DEĞİL). Kayıt: `gorsel/hamhikaye/H01.png`.
   Kullanıcıya göster, onay gelince devam et.
1b. **R47–R50 (hemen):** `CHATGPT-ISTEMI-YENILEME.md` › G. Eğlenceli giriş ekranı ve H. bölüm geçişi kutlaması (kullanıcı istedi). Kayıt `gorsel/hamyeni/`.
1c. **K12 (hemen):** `CHATGPT-ISTEMI-EK.md` › K12 yuvaların hareketli sisi ve dumanı (kullanıcı istedi: "hayaletlerin çıktığı
   yerlerdeki sisli dumanlı görseller hareketli olsun"). Kayıt: `gorsel/hamek/K12.png`.
2. **K05 (hemen ardından):** `CHATGPT-ISTEMI-EK.md` › K05 kilitli köprü ve açılışı (kullanıcı istedi). Kayıt:
   `gorsel/hamek/K05.png`.
3. **K09–K11:** Yakında/Pamukkale önizlemesi, efsane silahlar, efsane parıltılar (`CHATGPT-ISTEMI-EK.md`, kullanıcı istedi).
3b. **K06–K08:** harita donatıları (`CHATGPT-ISTEMI-EK.md`, kullanıcı istedi).
4. **H02–H09:** kalan hatıra paftaları (aynı dosya). Toplu göstermek yeterli.
5. ~~K03, K04~~ yapıldı (bulut Claude kesti; mor bulutlar griye boyandı).
6. ~~K02 kararı~~ kullanıcı onayladı.
7. **H10–H12, B01–B10, A01–A03:** hikâye resimleri ve animasyonlar (`CHATGPT-ISTEMI-HIKAYE.md`).
8. **J01–J12:** yolculuk paftaları (`CHATGPT-ISTEMI-YOLCULUK.md`).

Her paftadan sonra commit ve push yap (çalışma dalı `ccr-e316a7ca-5sw0ow`); bulut oturumu kesip oyuna bağlar
(`araclar/gorsel_kes.py`: H01–H09 → `hatira-<KOD>`, K01 → `an-carpilma-*`).
9. **R01–R46:** `CHATGPT-ISTEMI-YENILEME.md` — kodla çizilen her şeyin ChatGPT karşılığı (kullanıcı: "senin hazırladığın görsel kalmasın").

**Kalıcı kural (kullanıcı, 25 Kasım 2026):** Oyundaki bütün görseller ChatGPT'ye ürettirilir; kodla çizilmiş görsel kalmaz.
