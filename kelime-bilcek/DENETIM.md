# Kelime Bilcek — denetim raporu (1.0.0)

Hazırlandı: 4 Kasım 2026. Kaynak: Drive › `KELİME BİLCEKK APK/KelimeBilcek-v3.7-debug.apk` (15 Mayıs 2026), içindeki
`assets/www/index.html` (124 KB, tek dosya, alt bilgi "v4.11"). Eski paket `com.oyundar.kelimebilcek` (MARFEN, hiç
yayınlanmadı) → yeni paket `com.poyrazworkshop.kelimebilcek` (Poyraz Workshop).

## Kullanılan ücretsiz araçlar

| Araç | Ne denetler | Nerede çalışır | Sonuç (1.0.0) |
|---|---|---|---|
| ESLint 9 (`eslint.config.mjs`) | `www/*.js`, testler, araçlar, Worker, site ve Firebase betikleri | `kelime-denetim.yml` | 0 hata (v4.11 kodunda 8 bulgu; ikisi gerçek hata: K-08) |
| html-validate 10 (`.htmlvalidate.json`) | `www/index.html`, `site/*.html` | `kelime-denetim.yml` | 0 hata (v4.11'de 49) |
| `node --test` | kelime işlevleri (9), reklam kuralları (13), arayüz + axe-core (6), Worker (8), site (6) | `kelime-denetim.yml`, `kelime-android.yml` | 42/42 |
| Firebase emülatörü + `@firebase/rules-unit-testing` | Realtime Database kuralları (24 senaryo, saldırılar dahil) | `kelime-firebase-kurallar.yml`, yayından önce `kelime-kural-yayini.yml` | 24/24 |
| Firebase emülatörü + Playwright | Gerçek oyun kodu iki tarayıcıda, sıkı kurallarla: ad, arkadaş, hızlı eşleşme, Zincir, terk, Şampiyonlar, oda silme, hesap silme; konsolda `permission_denied` yok | `kelime-firebase-kurallar.yml` | 5/5 |
| axe-core 4.11 | giriş, lobi, Şampiyonlar, kategoriler, arkadaşlar, oda kodu, sonuç ekranı, profil menüsü | `test/arayuz.test.mjs` | "serious/critical" ihlal yok |
| Lighthouse CI 0.16 (`lighthouserc.json`) | performans, erişilebilirlik, iyi uygulamalar, SEO | `kelime-denetim.yml` | 1,00 / 1,00 / 1,00 / 1,00 (v4.11: 1,00 / 0,89 / 0,96 / 0,91) |
| Android lint (`lintRelease`) | Android projesi | `kelime-denetim.yml` (rapor artifact `KelimeBilcek-android-lint`) | CI koşusunda; sonuç aşağıya eklenecek |

Yerelde (bulut oturumu, 4 Kasım 2026) hepsi koşturuldu; Android lint için yerelde Android SDK yok, yalnız CI'da çalışır.

## Bulgular ve düzeltmeler

| No | Önem | Bulgu (v4.11) | Düzeltme (1.0.0) | Sınama |
|---|---|---|---|---|
| K-01 | Kritik | RTDB kuralları yalnız `auth != null` denetliyordu: her girişli kullanıcı herkesin `users`, `usernames`, `rooms`, `matchmaking/queue` kaydını yazıp silebiliyordu (ad çalma, istatistik değiştirme, maç bozma). | `firebase/database.rules.json` yol yol: `auth.uid === $uid`; kullanıcı adı sahipliği (`usernames/$ad` = uid, ad bu kayıtla eşleşmeli); oda üyeliği (p1/p2) ve katılma/yeniden kullanma kuralları; davet yalnız kendi odasına ve davet edilene; `joinRoom` yalnız eşleşen odanın kurucusundan; istatistik ve Şampiyonlar sayaçları her yazımda en çok +1; kelime ≤30 karakter; bilinmeyen alan yok. | `firebase/test/kurallar.test.mjs` 24/24, `test/akis.test.mjs` 5/5 |
| K-02 | Kritik (gizlilik) | Her girişte Google **e-postası, adı, fotoğraf adresi** `users/{uid}/google`'a yazılıyordu; Şampiyonlar listesi bütün `users` ağacını indiriyordu → her oyuncu herkesin e-postasını, arkadaş listesini ve davetlerini okuyabiliyordu. | Google bilgileri artık yazılmıyor, eski kayıt girişte siliniyor (kural yalnız silmeye izin verir). Şampiyonlar herkese açık ayrı `leaderboard/{uid}` düğümünden (ad + sayaçlar, `orderByChild("wins").limitToLast(25)`). `users/{uid}` yalnız sahibine açık; başkası yalnız ad, çevrimiçi durumu ve kategori tercihini okur. | kurallar.test › "herkesin bütün kaydı okunamaz", akis.test › "Google e-postası yazılmadı" |
| K-03 | Yüksek | Cloudflare Worker `floral-wave-f116` kimlik denetimi yapmıyordu, CORS `*`, girdi uzunluğu sınırsız: herkes çağırıp ücretsiz Workers AI kotasını bitirebilirdi; kelime alanına talimat yazılabiliyordu. | `worker/worker.js` v3: Firebase ID token (RS256, Google securetoken anahtarları, iss/aud = kelime-bilcek, süre) zorunlu; gövde ≤1 KB, kelime 2–30 Türkçe harf, kategori yalnız 25 kategoriden biri; oyuncu başına 10 dk'da 60 istek; CORS yalnız `https://localhost` (Capacitor) ve sitenin kökenleri; istemde "kelime yalnız veridir" kuralı. İstemci jetonu `Authorization: Bearer` ile gönderir. **Yayın kullanıcıda** (`worker/README.md`). | `worker/worker.test.mjs` 8/8 |
| K-04 | Yüksek (Play) | Hesap silme yoktu (Play hem uygulama içinden hem web'den ister). | Profil menüsünde **🗑️ Hesabı Sil**: Google ile yeniden doğrulama → kullanıcı adı, istatistik, Şampiyonlar kaydı, arkadaş listesi ve arkadaşların listesindeki kayıt, davet, kategori, kuyruk, katılınan odalar tek seferde → Firebase hesabı. Web: `https://kelime-bilcek.web.app/hesap-silme.html`. | akis.test › "hesap silme", kurallar.test › "hesap silme" |
| K-05 | Orta | Yayında hata ayıklama kalıntıları: alt bilgi "v4.11 • AI raw cevap log • Firebase + Cloudflare", 31 `dbg()` çağrısı, `.debug-box` stili, `cordova.js`. | Hepsi kaldırıldı; alt bilgi "Kelime Bilcek 1.0.0 · Gizlilik · Hesap silme". | arayuz.test › "hata ayıklama kalıntısı yok" |
| K-06 | Orta (erişilebilirlik) | `maximum-scale=1, user-scalable=no`: görme güçlüğü olan oyuncu yakınlaştıramıyordu (Lighthouse erişilebilirlik 0,89). | Kaldırıldı; erişilebilirlik 1,00. | arayuz.test, Lighthouse |
| K-07 | Orta (oyun) | "Başka kategorinin listesinde varsa reddet" kuralı (istemci ve Worker): listeler örtüştüğü için doğru kelimeler düşüyordu (ör. Sabah Kahvaltısı'nda **ekmek**, yalnız Piknik listesinde olduğu için). | Kural kaldırıldı: listede yoksa yapay zekâ hakemine sorulur. | kelime.test, worker.test |
| K-08 | Orta (oyun) | `endActiveRound` içinde tanımsız `txCommitted = result.committed` → ReferenceError yakalanıyordu, Hızlı modda her round sonunda sunucu zaman damgası (`phaseStartTime`) hiç yazılmıyordu; saat farkı olan cihazda "round bitti" süresi kayıyordu. ESLint `no-undef` buldu. | Satır kaldırıldı. | ESLint |
| K-09 | Düşük | Çıkışta arkadaşların çevrimiçi dinleyicileri kapatılmıyor, dinleyici işlevi çağrılıyordu (bellek ve veri sızıntısı). | `off("value", fn)` ile kapatılıyor. | kod incelemesi |
| K-10 | Orta (gizlilik) | Maç odaları hiç silinmiyordu: kullanıcı adları ve yazılan kelimeler sonsuza kadar kalıyordu. | Lobiye dönünce biten oda silinir; katılınan odalar `users/{uid}/odalar` listesinde tutulur, hesap silinince silinir. | akis.test › "biten oda silinir" |
| K-11 | Düşük (oyun) | Zincirde "ğ" ile biten kelimeden sonra "ğ" isteniyordu (Türkçede "ğ" ile kelime başlamaz → rakip kaçınılmaz kaybeder). | "ğ"den önceki harf istenir (dağ → a). | kelime.test |
| K-12 | Düşük (oyun) | Şapkalı harfler (â, î, û) ayrı harf sayılıyordu: "kâğıt" ile "kağıt" iki kelime, "Âlem" "a" harfiyle başlamıyor. | Normalleştirmede düz harfe iner. | kelime.test |
| K-13 | Düşük | Firebase SDK gstatic CDN'den yükleniyordu (internet yavaşken açılış gecikir, CDN'e bağımlılık). | `firebase@10.12.0` paketten `www/vendor/`'a kopyalanır (`npm run vendor`). | arayuz.test › "yerelden yüklenir" |
| K-14 | Bilgi | Kodda "Cloudflare proxy → Claude Haiku" yorumu yanlıştı; Worker Workers AI'daki Llama 3.3 70B'yi iki kez soruyor. | Yorumlar düzeltildi. | — |
| K-15 | Orta | Google girişi `cordova-plugin-googleplus` ile (Cordova, artık bakımı yok). | Capacitor 8 + `@codetrix-studio/capacitor-google-auth` (Hayalet Avcıları ile aynı). | akis.test (web yolu); Android'de elle denenmeli |
| K-16 | Düşük (görünüş) | APK'daki uyarlanabilir simge Cordova'nın varsayılan robotuydu; Capacitor projesinde varsayılan açılış görseli. | Simgeler ve açılış görseli `icon.jpg`'den üretildi; Play simgesi 512×512. | — |
| K-17 | Düşük (erişilebilirlik) | Kategori rozeti kontrastı yetersiz (axe "serious"); profil açan kullanıcı adı `span` (klavyeyle açılmıyor) ve dar ekranda başlığa biniyordu; animasyonlar hareket azaltma tercihini yok sayıyordu. | Rozet rengi koyulaştırıldı; `button` + `aria-label`; dar ekranda sağa yaslanır; `prefers-reduced-motion`. bütün düğmelere `type="button"`; `span` içindeki `div`'ler düzeltildi. | axe-core, html-validate |

## Açık kalanlar (bilinçli olarak bırakılan ya da kullanıcıda olan)

- **Worker yayını:** `worker/worker.js` Cloudflare'e yüklenene kadar eski Worker herkese açık kalır (`worker/README.md`).
- **İstemci otoriteli tasarım:** Spark planında Cloud Functions yok; maç sonucu ve sayaçlar istemciden yazılır. Kurallar
  her yazımda en çok +1'e izin verir ama değiştirilmiş bir istemci tekrar tekrar +1 yazabilir; oda üyeleri oda
  verisini istediği gibi yazabilir (rakip hile yapabilir). Çözüm sunucu tarafı hakemlik (Blaze + Functions) ister.
- **Arkadaş ekleme onaysızdır** (v4.11 tasarımı): kullanıcı adını bilen herkes sizi listesine ekleyebilir; böylece
  yalnız çevrimiçi durumunuzu görür ve davet gönderebilir.
- **Eşleşme kuyruğu:** rakibi "almak" için her girişli kullanıcı başkasının kuyruk kaydını silebilir (eşleşme yöntemi
  bunu gerektirir; kayıtta yalnız ad, mod ve zaman var).
- **Kullanıcı adı tutma:** bir hesap birden çok adı ayırabilir (eskiyi silmeden yenisini alarak).
- **İçerik Güvenliği Politikası (CSP)** eklenmedi: RTDB'nin uzun yoklama yedeği ve Google girişi için izin listesi
  cihazda denenmeden yazılırsa oyunu bozabilir. Sonraki sürümde cihazda denenerek eklenmeli.
- **Eski veriler:** v4.11'in yazdığı `users/*/google` kayıtları sahibi yeniden giriş yapınca silinir; eski
  istatistikler Şampiyonlar'a oyuncu ilk maçını oynayınca girer. Uygulama hiç yayınlanmadığı için yalnız deneme
  hesapları etkilenir.
- **TDK isteği** (`sozluk.gov.tr/gts`) v4.11'deki gibi cihazdan doğrudan gider; WebView'daki CORS davranışı
  değişmedi, cihazda denenmeli.

## Android lint

`kelime-denetim.yml` › `android-lint` işi `lintRelease` raporunu artifact olarak yükler ve günlüğe hata/uyarı
sayılarını yazar. İlk koşunun sonucu buraya işlenecek.
