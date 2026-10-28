# Hayalet Avcıları — Google Ads kurulum talimatı (tarayıcı)

Hazırlandı: 28 Ekim 2026.

- **Kararlar:** kullanıcı reklamı **C** yoluyla vermeyi seçti; ücretsiz kanallar da sürer
  ([`REKLAM-PLANI.md`](REKLAM-PLANI.md) §0, §1).
  - Reklamın kendisinde sahibin adı ve MARFEN görünmez.
  - Yasal ad yalnız reklamın ⓘ simgesinden açılan "Bu reklamveren hakkında" sayfasında ve Google Reklam Şeffaflık
    Merkezi'nde görünür.
- **Neden tarayıcı:** Uygulama kampanyası tarayıcıda kurulur. Bağlı reklam aracı (adplane) bu kampanya türünü
  kuramıyor ve yeni hesaba erişimi yok.
- **Kimin için:** bu talimatı kullanıcının bilgisayarındaki Claude Code (`claude --chrome`) ya da kullanıcı izler.

## Önce bitmiş olması gerekenler

1. `poyrazworkshop@gmail.com` hesabı "Poyraz Workshop" adıyla açıldı.
2. Site (`https://hayalet-avcilari.web.app`) yayında. Play'deki e-posta, web sitesi ve hesap silme adresi güncellendi
   ([`../site/README.md`](../site/README.md) › Sıra). Reklam Play sayfasına götürür; orada yeni adresler görünmeli.

## Kurallar (Claude için)

- Şifre, kart, IBAN, kimlik ya da vergi bilgisi girme; bu alanları kullanıcıya bırak.
- Ödeme yapma. "Kampanyayı yayınla", ödeme profili oluşturma, sözleşme ve onay kutuları gibi geri dönüşü zor
  adımlardan önce dur, kullanıcının açık onayını al.
- Hiçbir kampanyayı **etkinleştirme**. Kampanyalar ileri bir başlangıç tarihiyle kurulur ve duraklatılır. Kullanıcı
  açık onay vermeden ("ONAY: Hayalet Google Ads, günde 10 $, 14 gün" gibi) para harcayan hiçbir şeyi açma.
- Beklenmedik bir kutu, şart ya da güvenlik engeli çıkarsa başka yoldan deneme; dur ve sor.
- Her adımın sonunda neyin kaydedildiğini ve neyin kullanıcıya kaldığını kısaca Türkçe özetle.

## 0. Dosyalar

```
git fetch origin && git checkout main && git pull
```

PR #12 henüz birleşmediyse `main` yerine `claude/hayalet-google-reklam` dalı kullanılır. Kullanılacak dosyalar:

- Metinler: `hayalet-avcilari/reklam/metinler.json` (dil başına 5 başlık, 5 açıklama).
- Görseller: `hayalet-avcilari/reklam/gorseller/<dil>/`. Her dilde 9 dosya: `oyun`, `boss`, `tur` × `1200x628`,
  `1200x1200`, `1200x1500`.

## 1. Google Ads hesabı (kullanıcı)

https://ads.google.com → **`poyrazworkshop@gmail.com` ile** giriş:

1. "Uzman moduna geç" → **"Kampanya oluşturmadan hesap oluştur"**. Kampanya sihirbazına girilmez.
2. Hesap bilgileri:
   - Fatura ülkesi: Türkiye.
   - Saat dilimi: (GMT+03:00) İstanbul.
   - Para birimi: **Türk lirası** **[K]**. Para birimi sonradan değiştirilemez; Türk kartıyla döviz farkı çıkmaz.
     Bütçeler 10 $'ın o günkü TL karşılığına göre yazılır.
3. Ödeme profili ve türü: **kullanıcı seçer ve doldurur.**
   - **Bireysel:** ⓘ sayfasında yalnız ad ve soyad görünür; MARFEN görünmez.
   - **İşletme:** şirketin tam unvanı görünür (MARFEN dahil). Fatura şirkete kesilir, gider yazılabilir **[K]**.
     Hangisinin uygun olduğu mali müşavire sorulabilir.
   - Kart bilgisini kullanıcı girer.
4. Google daha sonra "reklamveren doğrulaması" isterse kimlik belgesini kullanıcı yükler.
   - Doğrulanan ad, ödeme profilindeki adla aynı olmalı. Farklı olursa ⓘ sayfasında iki ad görünür.

## 2. Google Play bağlantısı

1. Google Ads › **Araçlar** › **Veri yöneticisi** › **Bağla** → **Google Play** → `com.poyrazworkshop.hayaletavcilari`
   → bağlantı isteği **[K]**.
2. Play Console › Poyraz Workshop › **Ayarlar** › bağlı hizmetler › Google Ads: isteği **kullanıcı** onaylar **[K]**.
3. Google Ads › **Hedefler** › **Dönüşümler**: Android yüklemeleri (Google Play) dönüşümü listede görünmeli. Görünmezse
   "Yeni dönüşüm işlemi" › Uygulama › Google Play › **Yüklemeler** **[K]**.

## 3. Kampanyalar (dördü de aynı biçimde)

**Yeni kampanya:**

- Hedef: **Uygulama tanıtımı**.
- Alt tür: **Uygulama yüklemeleri**.
- Platform: **Android**.
- Uygulama: "Hayalet Avcıları" ya da `com.poyrazworkshop.hayaletavcilari`.

**Ortak ayarlar:**

- Bütçe: aşağıdaki tablodaki günlük tutarın TL karşılığı.
- Teklif: odak **Yükleme sayısı**, "Tüm kullanıcılar". **Hedef yükleme başına maliyet boş bırakılır**: bütçe küçük,
  Google günlük bütçenin hedefin en az 50 katı olmasını önerir.
- Başlangıç tarihi: **31 Aralık 2026** (ileri tarih; onay gelince öne alınır). Bitiş tarihi: boş.
- Reklam grubu: tablodaki dil.
  - Başlıklar ve açıklamalar `metinler.json` › `<dil>`'den **aynen** girilir.
  - Görsellerin 9'u da `gorseller/<dil>/`'den yüklenir.
  - Video eklenmez. Google otomatik video önerirse kabul edilebilir **[K]**.
  - YouTube kanalı bağlanmaz.

| Kampanya adı | Ülkeler | Diller | Günlük | Reklam grupları |
|---|---|---|---|---|
| HA-TR | Türkiye | Türkçe | 3 $ | `tr` |
| HA-ES | Meksika, Kolombiya, Arjantin, Peru, Şili, Ekvador | İspanyolca | 2,5 $ | `es` |
| HA-AR | Mısır, Fas, Cezayir, Irak, Ürdün, Tunus | Arapça | 2 $ | `ar` |
| HA-IN | Hindistan | Hintçe, İngilizce | 2,5 $ | `hi` ve `en` (iki grup; `en` görselleri `gorseller/en/`) |

Çince (`zh`) kampanyası kurulmaz; metin ve görsel hazırdır (Google Play Çin anakarasında yok).

**"Kampanyayı yayınla"dan önce:**

1. Dur. Dört kampanyanın özetini (ülke, dil, bütçe, başlangıç tarihi) kullanıcıya göster, onayını al.
2. Yayınladıktan hemen sonra her kampanyayı **Duraklat**.
3. Kullanıcıya Google'ın inceleme durumunu ("Uygun", "Sınırlı", "Reddedildi") bildir.

## 4. Açma (yalnız açık onayla)

Kullanıcı "ONAY: Hayalet Google Ads, günde 10 $, 14 gün" gibi açık bir onay verince:

1. Dört kampanyanın başlangıç tarihi bugüne, bitiş tarihi 14 gün sonrasına alınır.
2. Kampanyalar **Etkinleştir**ilir.
3. 7. günde [`REKLAM-PLANI.md`](REKLAM-PLANI.md) §3'teki kurala bakılır: CPI'ı 0,50 $'ı aşan kampanya durdurulur,
   bütçesi iyi gidene aktarılır.
4. Bütçe bir seferde %20'den fazla değiştirilmez.

## 5. Kullanıcının bir kez bakacağı yerler

- Reklam yayına girince bir reklamın ⓘ simgesine dokun. "Bu reklamveren hakkında"da görünen adın seçilen ödeme
  profiliyle aynı olduğunu gör.
- https://adstransparency.google.com'da aynı ad görünür.
- Reklamın kendisinde, Play sayfasında ve web sitesinde sahibin adı geçmemeli. `reklam.test.mjs` ve `site.test.mjs`
  bunu her yayından önce denetler.
