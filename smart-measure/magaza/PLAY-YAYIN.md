# Ölçü Kutusu (Measure Box) — Google Play'e ilk yayın

Hesap: **Poyraz Workshop** (doğrudan **Üretim**). Reklam hesabı: **AdMob, mahmuttari@gmail.com** (yayıncı
`pub-2417242373034448`). Paket: `com.poyrazworkshop.smartmeasure`. Dört küçük uygulama (Unitica, Calqora, Kıble Bul,
Ölçü Kutusu) **tek tarayıcı oturumunda** sırayla yapılır: ortak akış
[`../../docs/kucuk-uygulamalar-play.md`](../../docs/kucuk-uygulamalar-play.md); bu dosya yalnız Ölçü Kutusu'na özgü
bilgileri ve adımları verir. Düzen İz Haritası'nınkiyle aynıdır
([`../../iz-haritasi/magaza/PLAY-YAYIN.md`](../../iz-haritasi/magaza/PLAY-YAYIN.md)).

> **Yayından önce sahibin kararı:** Play'de aynı adda, aynı yöntemle çalışan 10M+ indirmeli bir uygulama var
> ([`DEGERLENDIRME.md`](DEGERLENDIRME.md) §0). Ad değişecekse 2. adımdan (Play'de uygulamayı oluşturma) **önce**
> değişir; yerleri README'nin "Ad değişirse" bölümünde. Karar verilmemişse 2. adımda dur ve sor.

## Sabit bilgiler

| Alan | Değer |
|---|---|
| Uygulama adı (mağaza) | `Ölçü Kutusu – Terazi, Cetvel` (28 karakter); en-US `Measure Box – Level & Ruler` (27); telefondaki ad `Ölçü Kutusu` (Türkçe telefonda) / `Measure Box`. Özgün ad "Smart Measure" Play'de başka bir uygulamanın adı olduğu için kullanılmaz ([`DEGERLENDIRME.md`](DEGERLENDIRME.md) §0) |
| Paket adı | `com.poyrazworkshop.smartmeasure` |
| Varsayılan dil | Türkçe – tr-TR; çeviri en-US |
| Uygulama / oyun · fiyat | **Uygulama** · **Ücretsiz** (indirme ücretsiz; AdMob reklamı + uygulama içi abonelik) |
| Kategori | **Araçlar** |
| İletişim e-postası | `mahmuttari@gmail.com` |
| Web sitesi | `https://mahmuttari.github.io/Lispler/smart-measure/` |
| Gizlilik politikası | `https://mahmuttari.github.io/Lispler/smart-measure/gizlilik.html` |
| Hesap silme adresi | yok: uygulamada hesap yok |
| Ülkeler | Tüm ülkeler ve bölgeler |
| Metinler ve form cevapları | [`aciklamalar.md`](aciklamalar.md), çeviri [`diller/en-US.md`](diller/en-US.md) |
| Veri güvenliği | [`aciklamalar.md` › Veri güvenliği formu](aciklamalar.md#veri-güvenliği-formu); CSV [`veri-guvenligi.csv`](veri-guvenligi.csv) |
| Görseller | [`play/`](play/) ve `play/en-US/`: `simge-512.png` (32 bit), `tanitim-gorseli-1024x500.png`, `telefon-1…6-*.png` (1080×1920). Üretici `../araclar/magaza-gorsel.mjs` |
| Sürüm notu | [`surum-notu.txt`](surum-notu.txt) (tr-TR), en-US `diller/en-US.md` › Sürüm notu |
| Abonelik | `adfree` · temel planlar `monthly` (0,99 $) ve `yearly` (9,99 $) — [`fiyatlandirma.md`](fiyatlandirma.md) |
| AdMob birimleri | uyarlanabilir **banner** + **geçiş reklamı** (AdMob'da 28 Ekim 2026'da `Smart Measure` adıyla açıldı; AdMob'daki ad kullanıcıya görünmez, istenirse `Ölçü Kutusu` diye değiştirilir); ödüllü ve açılış reklamı yok |
| İzinler | Kamera, mikrofon (ön planda, araç açılınca), titreşim, internet (reklam ve Play). Kısıtlı izin yok, ayrı beyan istenmez |
| İlk paket | `1.0.0 (1)`: CI'ın (`smartmeasure-android.yml`) gerçek AdMob kimlikleriyle derlediği imzalı AAB, artifact `SmartMeasure-aab` |
| Yükleme anahtarı | Poyraz Workshop'un ortak yükleme anahtarı (GitHub secret `HAYALET_KEYSTORE_*`; ayrı anahtar istenirse `SMARTMEASURE_KEYSTORE_*`). SHA-1 `D0:88:A0:75:77:D1:89:B0:15:D4:A5:88:74:9A:1A:8C:C2:EE:56:99` |

## Talimat (bilgisayardaki Claude Code, `claude --chrome`)

Kurallar ve onay paketi ortak dosyadadır. Ölçü Kutusu'na özgü olanlar:

1. **AdMob:** (yapıldı, 28 Ekim 2026) uygulama `Smart Measure` adıyla açıldı, birimler banner ve geçiş reklamı;
   kimlikler `android/gradle.properties`'te (sıklık sınırı gerekmez: uygulama oturumun ilk 3 dakikasında göstermez, en sık 4 dakikada bir,
   saatte en çok 6). AB mesajında Ölçü Kutusu için Türkçe + İngilizce yeterlidir (ortak mesaj öbür dilleri de içerir).
   Kimlikler `smart-measure/android/gradle.properties`'e, sonra `node smart-measure/araclar/kimlik.mjs` ve
   `node --test smart-measure/test/*.test.mjs` yeşil.
2. **Play'de oluştur:** ad (tablodan ya da sahibin seçtiği), tr-TR, Uygulama, Ücretsiz.
3. **İlk paket:** `SmartMeasure.aab` → paket `com.poyrazworkshop.smartmeasure`, sürüm `1.0.0 (1)`; sürüm notu
   `surum-notu.txt`; yalnız **Kaydet**.
4. **Hizmet hesabı:** Ölçü Kutusu'nu da ekle (ortak dosyadaki izinler).
5. **Mağaza ayarları ve Uygulama içeriği:** kategori **Araçlar**; [`aciklamalar.md`](aciklamalar.md) tablosu
   (Reklamlar: Evet; Hedef kitle 13+; Reklam kimliği: Evet; IARC'de dijital satın alma: Evet; sağlık özelliği: yok).
   Veri güvenliği: `smart-measure/magaza/veri-guvenligi.csv`; önizlemede toplanan ve paylaşılan: Konum, Uygulama
   etkinliği, Uygulama bilgileri ve performans, Cihaz veya diğer kimlikler. **Ses ve fotoğraf/video seçilmez** (cihazda
   işlenir, kaydedilmez, gönderilmez).
6. **Abonelik:** [`fiyatlandirma.md`](fiyatlandirma.md) — `adfree`, `monthly`, `yearly`; fiyatları kullanıcıya
   gösterip onayıyla etkinleştir.

Bulut oturumu sonra `smart-measure/play-istek.txt` ile `durum` → `magaza uygula` → `gorsel uygula` →
`veriguvenligi` çalıştırır.

**İncelemeye göndermeden önce** (DEGERLENDIRME §4): ilk paketi dahili test kanalından bir telefonda bir kez dene —
kamera önizlemesi ve fener, mesafe ölçümü, su terazisinin titreşimi, ışık ve ses ölçer, banner'ın gezinme çubuğunun
üstünde kendi şeridinde durması, araçtan çıkışta geçiş reklamı (ilk 3 dakikadan sonra), lisans test hesabıyla abonelik
ve "Aboneliği yönet"in Play'in abonelik sayfasını açması.

## Sonraki sürümler (yalnız GitHub)

1. `smart-measure/android/app/build.gradle`'da `versionCode` (+1) ve `versionName`; aynı sürüm `package.json`'da;
   `magaza/surum-notu.txt` ve `diller/en-US.md` › Sürüm notu.
2. Push → `smartmeasure-android.yml` imzalı AAB'yi derler → `play-istek.txt`'ye `yukle uygula`, kullanıcının onayıyla
   `yukle yayinla uygula`. AAB elle hiçbir yere taşınmaz.
