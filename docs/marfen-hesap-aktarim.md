# MARFEN Play hesabı: kuruluşa geçiş ve uygulama aktarımı

Hazırlandı: 30 Ekim 2026. İşaretler: **[D]** kaynaktan doğrulandı, **[K]** kısmen doğrulandı ya da kullanıcının
denetlemesi gerekiyor.

## 0. Karar

- D-U-N-S numarası 29 Ekim 2026'da geldi. Kullanıcı: *"Bu uygulamaları Marifen geliştirici hesabına kaydırabilir misin?"*
- Kullanıcının seçimleri (30 Ekim 2026):
  - Önce **"Hayalet hariç hepsi"** seçildi. Aynı gün kullanıcı: *"Hayalet avcıları ve kıble uygulaması kalabilir"*.
    Bu yüzden **Hayalet Avcıları ve Kıble Bul Poyraz Workshop'ta kalır**; Not Defteri, İz Haritası, Unitica ve Calqora
    taşınır. Hayalet'in reklamı için kurulan adsız düzen bozulmaz
    ([`../hayalet-avcilari/reklam/REKLAM-PLANI.md`](../hayalet-avcilari/reklam/REKLAM-PLANI.md)).
  - MARFEN hesabı **önce kuruluşa çevrilir**; talimatı bu dosyadır.
- Aktarma ve hesap türü değişikliği Play Console'da hesap sahibinin işidir; Google'ın bunlar için API'si yok. Talimatı
  kullanıcı ya da bilgisayardaki Claude (Claude uygulamasının yerleşik tarayıcı paneli) izler. Her geri dönüşü zor
  adımdan önce kullanıcının açık onayı alınır. Kimlik, vergi ve kart bilgilerini kullanıcı girer.

| Hesap | Kimlik | Tür | Uygulamalar |
|---|---|---|---|
| **MARFEN** | `7263444126314683368` (sahibi mahmuttari@gmail.com) | Kişisel → **kuruluş** | Mevcut uygulamaları **[K]** |
| **Poyraz Workshop** | **[K]** | Kişisel (eski hesap, kapalı test zorunluluğu yok) | Not Defteri, Hayalet Avcıları, İz Haritası, Unitica, Calqora, Kıble Bul |

| Taşınacak | Paket | Abonelik | Firebase |
|---|---|---|---|
| Not Defteri | `com.poyrazworkshop.notdefteri` | `notdefteri.pro.aylik` | yok |
| İz Haritası | `com.poyrazworkshop.izharitasi` | yok | yok |
| Unitica | `com.poyrazworkshop.unitica` | `adfree` | yok |
| Calqora | `com.poyrazworkshop.calqora` | `adfree` | yok |
| Ölçü Kutusu | `com.poyrazworkshop.smartmeasure` | `adfree` | yok. Play'de **henüz oluşturulmadı**: aktarılmaz, doğrudan MARFEN'de oluşturulur (§5) |

Hayalet Avcıları (`com.poyrazworkshop.hayaletavcilari`) ve Kıble Bul (`com.poyrazworkshop.kiblebul`) **taşınmaz**.

## 1. Kuruluş hesabında Play'de ne görünür?

- **Kuruluş hesabı:** *"Google will display your legal name, legal address, developer email address, and developer
  phone number on Google Play."* **[D]** ([Play Console Yardım 13628312](https://support.google.com/googleplay/android-developer/answer/13628312)).
- **Geliştirici adı** (uygulamaların altında görünen ad) yasal addan farklı olabilir; ama yasal ad da ayrıca
  görünür **[D]** (aynı sayfa).
- **Geliştirici e-postası** *"genel ya da kişisel bir adres olmamalı"* **[D]**. Öneri: `info@marfen.com.tr`.
- Organizasyonun web sitesi, organizasyon telefonu ve yalnız Google'ın kullandığı iletişim kişisi Play'de
  **görünmez** **[D]** ([13634081](https://support.google.com/googleplay/android-developer/answer/13634081)).
- **AB tacir beyanı:** 1 Şubat 2027'ye kadar verilmeli. 1 Mart 2027'den sonra iletişim bilgileri ve D-U-N-S numarası
  her yerde görünür **[D]** ([17594752](https://support.google.com/googleplay/android-developer/answer/17594752)).
- **Yasal ad:** D&B'ye 27 Ekim 2026'da gönderilen ikinci başvuruda (dava 34964438) kaydın ticaret sicili unvanıyla
  açılması istendi: `MAHMUT TARI MARFEN MUHENDISLIK DANISMANLIK HIZMETLERI`. Vergi dairesi adı
  (`MARFEN MUHENDISLIK TASARIM VE DANISMANLIK HIZMETLERI`) ise ticari ad olarak istendi. D&B'nin numarayı bildiren
  e-postasındaki ad esas alınır **[K]**.

## 2. MARFEN hesabını kuruluşa çevir (kullanıcı)

Kaynak: Drive › `DUNS_BASVURUSU_OZETI_2026-10-19.md` §2, §5, §6. Geri alınamaz.

1. https://play.google.com/console, `mahmuttari@gmail.com`, **MARFEN** hesabı (`7263444126314683368`) seçilir.
2. **Ayarlar › Geliştirici hesabı › Hesap ayrıntıları ("Hakkınızda") › Hesap türünü değiştir.**
3. **Yeni ödeme profili (kuruluş):**
   - D-U-N-S numarası.
   - Yasal ad ve adres, D&B kaydıyla **birebir** aynı (D&B e-postasındaki yazımla, büyük harf ve ASCII dahil).
     Uyuşmazsa hesap kısıtlanabilir.
   - Adres: Şehitler Mah. 416. Sk. No: 2 İç Kapı No: 1, 41650 Gölcük/Kocaeli. D&B'deki yazımla karşılaştırılır.
4. **Kuruluş bilgileri:**
   - Tür ve büyüklük: 1–10 kişi.
   - Geliştirici telefonu: SMS ile doğrulanır; **Play'de herkese görünür**.
   - Geliştirici e-postası: `info@marfen.com.tr` önerilir; **herkese görünür**.
5. **Belgeler:** kimlik ve kuruluş belgesi (Faaliyet Belgesi, 19.10.2026). Kimlik numarasını içeren belgeleri
   kullanıcı yükler.
6. **Geliştirici adı:** kullanıcı seçer (`MARFEN` ya da başka bir ad); her uygulamanın altında bu ad görünür.
7. Ödeme profili bağlanır. Sonrası **72 saat yeni uygulama gönderilmez** (Ölçü Kutusu dahil).
8. Plesk'teki `google-site-verification` TXT satırı silinmez. Silinirse marfen.com.tr web sitesi doğrulaması düşer.
9. **Satıcı (ödemeler) profili:** abonelikli uygulamalar taşınacağı için MARFEN'de **etkin bir ödemeler profili**
   şarttır **[D]** ([6230247](https://support.google.com/googleplay/android-developer/answer/6230247)). Varsayılan para
   birimi Poyraz Workshop'unkiyle aynı olmalı (TRY). Farklıysa uygulama içi ürünlü uygulamalar yeniden yayınlanana
   kadar yayından kalkar **[D]**.

## 3. Aktarımdan önce

- **İnceleme:** Unitica ve Calqora 28 Ekim 2026'da incelemeye gönderildi. İnceleme bitmeden aktarım
  istenmez **[K]** (Google sayfası bu durumu yazmıyor; ihtiyat).
- **Raporlar:** Poyraz Workshop'un kazanç, ödeme ve toplu dışa aktarma raporları indirilir; bunlar aktarılmaz **[D]**.
- **Politika uyumu:** kaynak hesap ve aktarılan her uygulama politikaya uygun olmalı **[D]**. Poyraz Workshop'un
  geçmişte iki askıya alınmış uygulaması var (`unitica/magaza/DEGERLENDIRME.md`); bunlar aktarılmaz.
- **İki hesabın kayıt ücreti işlem kimliği:**
  - Her hesabın sahibi Google Payments › Etkinlik'te "Google Play Developer" arar ya da e-postada "developer
    registration fee" arar.
  - Kimliğin başındaki `0.G.` ya da `token` / `Registration` öncesindeki karakterler atılır **[D]**.

## 4. Aktarım isteği

1. Poyraz Workshop hesabının sahibi https://play.google.com/console/developers/app-transfer açar. Taşınacakları seçer:
   Not Defteri, İz Haritası, Unitica, Calqora. Hayalet Avcıları ve Kıble Bul **seçilmez**. Hedef: MARFEN. İki işlem
   kimliği girilir **[D]**.
2. MARFEN hesabının sahibi isteği **onaylar** **[D]**.
3. Google desteği **2 iş günü** içinde yanıt verir **[D]**. Bu sürede kullanıcılar uygulamayı kullanmaya ve yeniden
   yüklemeye devam eder **[D]**.
4. **Aktarılanlar:** kullanıcılar, istatistikler, yorumlar, puanlar, **abonelikler**, içerik derecelendirmeleri,
   mağaza girişleri, Uygulama içeriği beyanları **[D]**.
5. **Aktarılmayanlar:**
   - test grupları (yeniden kurulur);
   - promosyonlar (verilmiş kodlar çalışmaya devam eder);
   - raporlar;
   - bağlı hizmet izinleri **[D]**.
6. Aktarımdan önceki siparişler kaynak hesapta kalır; iadeleri oradan yapılır **[D]**.

## 5. Aktarımdan sonra

1. **Hizmet hesabı (kullanıcı):**
   - MARFEN › Kullanıcılar ve izinler'e `notdefteri-play@handcalcbook.iam.gserviceaccount.com` eklenir; izinler İz
     Haritası'ndakiyle aynıdır (`iz-haritasi/magaza/PLAY-YAYIN.md`). Hesapta zaten varsa yalnız aktarılan uygulamalar
     eklenir.
   - Bu yapılmadan GitHub'daki `play-*.yml` işleri aktarılan uygulamalara erişemez.
2. **AdMob:** aynı hesap kalır (`pub-2417242373034448`); uygulama ve reklam birimi kimlikleri değişmez **[K]**.
   Google, reklam trafiğinin hedef hesaba yazılması için reklam SDK'larının güncellenmesini söylüyor **[D]**. AdMob
   hesabı aynı kaldığı için kod değişikliği gerekmiyor **[K]**.
3. **Bulut oturumu:**
   - Her uygulama için `play-istek.txt` › `durum` çalıştırır, erişimi ve aboneliği denetler.
   - Mağaza metinlerindeki `Geliştirici adı`, gizlilik sayfalarındaki veri sorumlusu ("Poyraz Workshop") ve README
     notları yeni hesaba göre güncellenir.
   - Gizlilik metni herkese açık metindir; değişiklik yayından önce kullanıcıya tam olarak gösterilir.
4. **Ölçü Kutusu:**
   - `docs/kucuk-uygulamalar-play.md` adım 2–6, **MARFEN** hesabında ve kuruluşa geçişten en az 72 saat sonra yapılır.
   - Kuruluş hesapları kapalı test (12 testçi × 14 gün) şartından muaftır **[K]** (D-U-N-S özeti §2).
   - Ardından `play-istek.txt` adımları uygulanır.
5. **Hayalet Avcıları ve Kıble Bul:**
   - Poyraz Workshop'ta kalır; GitHub iş akışları ve hizmet hesabı izinleri değişmez.
   - Poyraz Workshop **kişisel** hesap olduğu için Google, yasal adı, ülkeyi ve geliştirici e-postasını gösterir
     **[D]** (13628312).
   - Kullanıcı Play Console › **Geliştirici profili** sayfasında ne göründüğüne bakar. Geliştirici e-postası kişisel
     adresse `poyrazworkshop7@gmail.com` yapılabilir **[K]**.

## Kaynaklar

- Uygulama aktarımı: https://support.google.com/googleplay/android-developer/answer/6230247
- Hesap bilgileri ve Play'de görünenler: https://support.google.com/googleplay/android-developer/answer/13634081 ·
  https://support.google.com/googleplay/android-developer/answer/13628312
- Tacir beyanı: https://support.google.com/googleplay/android-developer/answer/17594752
- D-U-N-S başvuru özeti: Drive › `DUNS_BASVURUSU_OZETI_2026-10-19.md`; D&B dava 34964438 (27 Ekim 2026)
