# Master Office 3.6.0 — Play'de değişecekler (hesap + yeniden kurulan sürüm)

3.6.0, kaynak kodu 3.5.1'in AAB'sinden yeniden kurulmuş sürümdür (özel depo `mahmuttari/master-office`). Yeni: isteğe bağlı **Google / Apple ile giriş**; yalnız **ayarları** eşitler (tema, dil, okuma görünümü, hızlı araçlar, dosya boyutu sınırı). Belgeler, dosya adları, son açılanlar hiçbir yere gitmez. Arka uç: Firebase projesi `master-office-ofivora` (Auth + Firestore, konum `eur3`). Sürüm kodu 3006000, reklamlar gerçek AdMob kimlikleriyle.

## 1. Yükleme anahtarı sıfırlama (3.6.0 yüklenmeden önce, ONAY)
3.5.1 "Sayfa" anahtarıyla yüklendi ve bu anahtar elde yok. 3.6.0 yeni yükleme anahtarıyla (`CN=Master Office, O=MARFEN, C=TR`) imzalı; anahtar yalnız `mahmuttari/master-office` GitHub Secrets'ta.
- Play Console › Master Office › Test et ve yayınla › Uygulama bütünlüğü › Uygulama imzalama › **Yükleme anahtarı sıfırlama talep edin**; neden: "Yükleme anahtarını kaybettim"; dosya: `upload_certificate.pem` (bu klasörde; yalnız genel sertifika).
- Yeni sertifika: SHA-1 `F3:B1:E6:CA:6A:AF:7A:C6:5F:E3:AC:20:13:BE:30:CE:FE:4D:1B:3D`, SHA-256 `D1:F5:DF:B5:07:49:90:E7:EF:D0:7A:9A:64:69:66:57:FB:18:C0:D5:B9:70:AC:C9:3C:8A:6A:4E:6C:9F:68:C7`.
- Google onaylayınca (genelde birkaç gün) 3.6.0 AAB'si yüklenebilir. Uygulama imzalama anahtarı (Google'ınki, SHA-1 `44:63:40:64:E6:BA:8D:4F:63:7F:21:79:A9:53:67:16:9A:9C:3E:1E`) değişmez; Firebase'e eklendi.

## 2. Veri güvenliği (3.6.0 üretime / teste çıkarken)
`veri-guvenligi-3.6.0.csv` = 3.5.1'in cevapları + hesap. Değişen satırlar:
- Hesap oluşturma: **OAuth** (Google / Apple); "hesap yok" kaldırıldı. Hesap silme URL'si: `https://mahmuttari.github.io/master-office/hesap-silme.html`. Kullanıcı veri silinmesini isteyebilir: **Evet**.
- Toplanan (paylaşılmayan, isteğe bağlı, geçici değil): **Ad**, **E-posta adresi**, **Kişisel tanımlayıcılar** (Firebase kullanıcı kimliği) → Uygulama işlevi + Hesap yönetimi; **Uygulama etkinliği › Diğer işlemler** (eşitlenen ayarlar) → Uygulama işlevi.
- Reklam SDK'sının satırları 3.5.1'deki gibi.
- `PSL_ACM_OAUTH` ve `PSL_ACCOUNT_DELETION_URL` satır kimlikleri Play'in CSV şablonundan (fastlane-plugin-google_data_safety şablonunda da aynı); Play API dosyayı yazarken denetler.

## 3. Uygulama içeriği
- Uygulama erişimi: değişmez ("Tüm işlevler özel erişim gerektirmeden kullanılabilir"): giriş isteğe bağlı.
- Gizlilik politikası: `mahmuttari.github.io` PR'ı (hesap, eşitleme, hesap silme, iOS) 3.6.0'dan önce birleştirilmeli.

## 4. Google ile giriş için yapılanlar (bilgi)
Firebase'de Android uygulaması `1:465339565633:android:0bafb0948850f8a49d28c0`; SHA-1'ler: yükleme anahtarı, Play uygulama imzalama anahtarı, yerel hata ayıklama anahtarı. OAuth onay ekranı adı "Master Office", destek e-postası mahmuttari@gmail.com.

## 5. Apple ile giriş (Android) için kullanıcının adımı
Android'de Apple girişi Firebase'in web akışını kullanır: Apple Developer'da bir **Services ID** (dönüş adresi `https://master-office-ofivora.firebaseapp.com/__/auth/handler`) ve **Sign in with Apple anahtarı** (.p8) açılıp Firebase › Authentication › Apple'a girilmeli. Anahtar metnini Firebase'e kullanıcı kendisi yapıştırır. O zamana kadar Android'de Apple düğmesi hata verir; Google girişi ve iOS'ta Apple girişi çalışır.
