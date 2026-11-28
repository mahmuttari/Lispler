# Hayalet Avcıları: devir notu (28 Kasım 2026, akşam)

Kalıcı kurallar `CLAUDE.md`'de (görseller yalnız ChatGPT, bulutta Codex CLI ile; kod Evren/NVIDIA/ajanlar; akıl yürütme
Fable; "yayınla" denmeden Play'e hiçbir şey yok). Çalışma dalı `ccr-e316a7ca-5sw0ow` (taslak PR #14). Deneme sayfası
kullanıcının artifact'ı: https://claude.ai/artifact/3gwhkL7g2QzNyaZWig83pt (sürüm 86).

**Play:** 3.21.0 (60) 28 Kasım'da kullanıcının "Yayınla" komutuyla üretime %100 yüklendi ve incelemeye gönderildi (koşu
46129307100). 3.20.1 dalı (hayalet-3-20-1) bu dala birleştirildi. Sonraki sürüm: versionCode 61. Mağaza görselleri bu sürümde
değişmedi (istenirse araclar/magaza-gorsel.mjs + `gorsel uygula`).

## Son oturum (28 Kasım 2026, gece; bulut)
- **KLP1 bitti (77cd6e1):** çevrimiçi takım listesinde (`takimCiz`) canlar ❤️/🖤 emojisi yerine ChatGPT `kalp` resmiyle
  (boş can aynı resmin sönük hâli; resim yoksa emoji yedek, ölü oyuncu 👻). Sınama `test/kalp1.test.mjs` (5/5). Böylece
  CHATGPT-ISTEMI-UYUM.md K7'nin dört maddesi de bitti.
- **Deneme sayfası okunamadı:** bu bulut oturumundan `Artifact read` "artifact not found / not shared" döndü; sayfa başka bir
  hesaba ait ya da bu hesapla paylaşılmamış olabilir. Paket hazırlandı ve sınandı (`deneme_hazirla.py` + `deneme-sina.mjs`,
  hatalar []), ama aynı adrese yayımlanamadı. Kullanıcı sayfayı paylaşırsa ya da yeni sayfa isterse yayımlanacak.
- **PR #14 izlemeye alınamadı:** `subscribe_pr_activity` gerekçesiz reddetti (depo bağlı, PR açık). Büyük olasılıkla Claude
  GitHub uygulaması depoda kurulu değil.
- **Emülatörlü sınamalar bu kapsayıcıda çalışmıyor:** firebase-tools 15.32.1 (`lib/apiv2.js`) `HTTPS_PROXY` varken her
  isteği vekile gönderiyor, `NO_PROXY`'ye bakmıyor; emülatöre kural yükleme bile vekilden "refusing…" alıyor. Vekil notu
  `HTTPS_PROXY`'nin kaldırılmasını yasaklıyor. cevrimici, cevrimici-ek, alti, arkadas, kurallar sınamaları ya Mac'te ya da
  CI'da çalıştırılmalı.

## Deneme sürümünü güncelleme
1. `python3 araclar/deneme_hazirla.py <geçici>/deneme-yeni www` (görselleri ~7 MB'lık paket parçalarına koyar, game.js
   m4a→mp3 dönüşümünü yapar; ham game.js asla doğrudan kopyalanmaz).
2. `node araclar/deneme-sina.mjs <geçici>/deneme-yeni` (hatalar [] olmalı).
3. Artifact tool ile aynı URL'ye yayımla (`url` + `files` haritası + `root`). Yeni oturumda önce `action: "read"` gerekir;
   eski yerel kopya yoksa bütün klasör yeniden yayımlanır.

## Kullanıcıdan beklenen geri bildirimler (28 Kasım akşamı)
- Kinkin 3D denemesi (uc-avci.js, 4 kostüm): beğenirse öteki 11 avcı + bot; bütün kostümler mi yalnız 0. mı?
- ElevenLabs müzik denemesi (UZ, 30 sn, gerçekçi tarif; 462 kredi kaldı, ~14 kredi/sn; sıfırlanma ~5 Aralık).
- UZ ve MA müziği tempo (~125-130) kulakla; DE döngü ek yeri (Mac sırası: 2. sürüm indir).
- Suno: bu ay 10 indirme hakkı kaldı (Premier 60/ay).
- Sonraki büyük iş seçimi: yatık harita, takılan hayaletler (FIX4), reklam kamerası (REK2), yolculuk-perf yönü.

## Eski not (27 Kasım sabahı) — bitenler
SES1 (23 ElevenLabs sesi oyunda), YER1 (bölgeler ChatGPT yerleşim planlarıyla; Y01'in 7 planı derlendi), GOR3a (patlama,
boss halkası, robot, seviye rozeti, zemin süsleri), GOR3b (dükkân/menü/oyun sonu görselleri), J01-J12 yolculuk paftaları
kesildi, gölet ve diken tuzaklar sınır yöntemiyle (organik leke biçimi + kıyı/çerçeve, içi ChatGPT dokusu; kullanıcı kararı), bot görseli.

## Görsel üretim yolu (kullanıcı, 27 Kasım)
OpenAI API kredisi bitti (credit_balance_exhausted); kullanıcı: "ChatGPT ile pencereden kullanmaya devam et". Görseller
yalnız ChatGPT penceresinden, Mac'teki yerel görsel oturumu üretir (YEREL-CLAUDE-SIRA.md); araclar/chatgpt_uret.py kullanılmaz.
Bulut oturumu Mac oturumuna send_message ile ulaşamıyor (güvenilir cihaz); kullanıcıya iletmesi söylenir. ChatGPT sırası bitti (K17, K18 geldi ve işlendi).

## Süren / kalan işler (28 Kasım 2026 sabahı)
Bitti ve dalda: MEN2 (ana menü), KNT1 (MOBA kontroller), KPR2 (dere köprü kemerinde), TMS2 (timsah karada kovalar, yakaladığı
yerde ısırır), TST1 (bot köprüde takılmaz, yan kulelere basmaz; eski kırmızı testlerin çoğu yeşil), BAS1 (evlere giden basamak
taşları kaotik), K17 (karada yürüyen timsah resimleri bağlandı), K18 (dikey duvarlar kendi resmiyle, üç dilim), MEN3 (menü uzun
düğmeleri tuvalde dikişsiz), PRF2 (yolculuk çiziminde kare başı israf azaltıldı; 21 ms → 12-13 ms). Deneme sürümü 78.
1. Müzik (27 Kasım 2026 akşam, TAMAM): 50 ülke Suno (kullanıcının aboneliği, Mac'te Chrome penceresi) ile yeniden üretildi; tarifler araclar/muzik-secenekleri.json, kullanıcının seçimleri araclar/muzik-secimleri.json (seçim sayfası claude.ai), sıra araclar/SUNO-PENCERE-SIRA.md. Türkiye değişmedi. İkinci ölçüm (özilinti, 28 Kasım): KR, MX, AO, MZ asıl vuruşu hedefte (ilk ölçüm yarım/üçleme hatası); UZ ~130 ve MA ~124 gerçekten hızlı vuruşlu (kulakla doğrulanacak, gerekirse yeniden üretilecek); ET ~74 (hedeften ağır, sakin). test/muzik.test.mjs: DE döngü ek yeri akı sınırını aşıyor (183,8 > 150,8); DE için Mac sırasına iş yazıldı (2. sürümü indir, işle, sına). Suno indirme hakkı: Premier 60/ay, bu ay 50 kullanıldı.
2. Kulakla denetim kullanıcıda: UZ ve MA müziği (vuruş ~125-130), DE döngüsünün başa dönüşü (tık).
3. Hâlâ kırmızı testler (eşik gevşetilmedi):
   - yolculuk-perf "uzun harita ≤ 1,3 × eski": 1,4-2,0 ×. Kalan fark gerçek içerik (yuvalar, sis, yoğun obje; piksel boyama
     maliyeti). Test asimetrik: __hazir() botu yalnız klasik sahnede siler (bot ~%10). Geçirmek için ya görünen yuva/sis pikseli
     azaltılmalı ya da eşik kullanıcıyla konuşulmalı.
   - uc-avci UC7b (CPU 4×, p95 ≤ 20 ms): makine yüküne bağlı rAF titremesi; yüklü makinede 2 geçti 2 düştü.
   - yuv2 (p) zaman oranı yükte ara sıra 1,25'i aşıyor (dalgalanma).
   - muzik.test DE ek yeri (yukarıda).
4. FIX4 (klasik haritada takılan hayaletler) ve REK2 (oynanabilir reklam kamerası): önce Fable şartnamesi.
5. Diablo 2 tarzı yatık harita: büyük iş, kullanıcı "bu saatten sonra büyük iş olabilir" dedi; istenirse ayrı aşama.
6. Uzun/yayvan kutudaki obje küçük kalıyor (OBJ1 kutuyu resme uydurdu; yeniden görülürse objePayi).
7. 3D avcılar ve bot (uc-avci.js, kodla kurulan modeller): kullanıcı 28 Kasım'da "3D kalsın, Sonnet 5.6 çıktıysa onunla yeniden üret" dedi. O tarihte Sonnet 5.6 yoktu (en yeni Sonnet 5.5). Çıkınca 3D modeller onunla yeniden kurdurulacak; "her görsel ChatGPT" kuralının tek istisnası.
8. Zemin uyumu (ZUY1, 28 Kasım) bitti: Z24-Z29 Codex ile üretildi, kesildi ve bağlandı (diken öbekleri + taban, göl/nehir kıyı şeritleri, göl süsleri). Kalan: kesişen göllerde şerit uçları (kozmetik), doku-lav-1/2 kesildi ama bağlanmadı, Dünya Turu harita sınırı (K4). Kara bulut artık yalnız boss varken (BLT1), şimşek ince kod çizgisi.
9. Bağlanmayan görseller (gerekçeli): gel-miknatis, giris-kahraman, tur-ucak-ust, sus-tahta-yol.

## Çalışma düzeni
- Evren tek istek kabul eder; görevler sırayla (`araclar/evren-gorev/`, başlık `bas.txt`).
- Evren çalışırken commit: temiz ağaçta test, `git hash-object`/`update-index` ile yalnız ilgili dosyalar.
- Kesimden sonra her zaman temiz ağaçta `node test/gorsel.test.mjs`.
