/* ============================================================
   UNITICA — REKLAM KURALLARI (saf hesap: DOM yok, eklenti yok; test/reklam.test.mjs Node'da sınar)
   Reklamı gösteren yapıştırıcı reklam.js'tir; NE ZAMAN gösterileceğine yalnız bu dosya karar verir.

   Özgün 1.3.1'deki GeoTerva tam ekran ev reklamı (açılıştan 5 sn sonra ve her 3 dakikada bir, 10 sn kapatılamayan)
   kaldırıldı. Yerine AdMob gelir; kurallar (uzman kararı, kucuk-sozlesme):
   - Reklamsız üye: AdMob SDK'sı hiç başlatılmaz (reklam.js, plans.js).
   - Önce UMP: onay bilgisi → gerekirse onay formu → yalnız reklam istenebiliyorsa başlatma. En yüksek içerik
     derecesi G ("General"). AB/BK/İsviçre kullanıcısı Diğer › Ayarlar'daki "Reklam gizlilik seçenekleri"yle
     tercihini her zaman değiştirebilir (UMP "gerekli" dediğinde görünür).
   - Banner: altta, kendi şeridinde uyarlanabilir sabit banner. Sayfa (sekme çubuğu, alt sayfalar, bildirim) banner
     yüksekliği kadar yukarı çekilir; banner hiçbir düğmenin üstüne binmez. Klavye açıkken gizlenir.
   - Geçiş reklamı ÇOK SEYREK. Bir birim dönüştürücüde temiz doğal durak azdır: kullanıcı ana ekranda sayı yazar,
     sonucu okur, birimi değiştirir; bunların hiçbiri bölünmez (giriş sırasında, birim seçerken, alt sayfa açıkken,
     klavye açıkken, Geçmiş/Favori kaydını açarken reklam YOK). Tek doğal durak, kullanıcının kendi isteğiyle
     Geçmiş, Favoriler ya da Diğer (Ayarlar) ekranından sekme çubuğu ya da geri tuşuyla AYRILMASIDIR. Orada bile:
       · oturumun ilk 5 dakikasında yok (açılış sayılır; 30 dakikadan uzun arka planda kalıp dönmek yeni oturumdur),
       · iki geçiş reklamı arasında en az 8 dakika, son 60 dakikada en çok 3 (sayaçlar kalıcı: localStorage),
       · terk edilen ekranda en az 5 saniye kalınmamışsa yok (sekmeler arasında hızlı gezinmeye reklam yok),
       · reklamsız üyelik ekranına bakıldıktan sonraki 10 dakikada yok (almadı diye "cezalandırma" yok).
     Bu sınırlar sözleşmenin alt sınırlarından (ilk 3 dk yok, ≥4 dk ara, saatte ≤6) bilerek daha sıkıdır: asıl gelir
     banner'dandır, geçiş reklamı yalnız seyrek bir ektir. Açılış reklamı ve ödüllü reklam YOK.
   - Tarayıcıda (eklenti yok) her şey sessizce devre dışıdır.
   Dayanak: AdMob geçiş reklamını "doğal geçişlerde, uygulamanın akışını bölmeden" önerir, sayı vermez; Poyraz
   Workshop'un iki uygulaması daha önce askıya alındığından sınırda hiçbir davranış yoktur (magaza/DEGERLENDIRME.md).
   ============================================================ */

export const KURAL = {
  ilkSn: 300,            // oturumun ilk 5 dakikası geçiş reklamsız
  araSn: 480,            // iki geçiş reklamı arası en az 8 dakika (kalıcı)
  saatlikEnCok: 3,       // son 60 dakikada en çok 3 (kalıcı)
  ekranEnAzSn: 5,        // terk edilen ekranda en az bu kadar kalınmış olmalı
  uyelikSonrasiSn: 600,  // reklamsız üyelik sayfası açıldıktan sonra bu kadar süre yok
  yeniOturumSn: 1800,    // arka planda bundan uzun kalıp dönen uygulama yeni oturum sayılır
};

/** geçiş reklamının düşünülebileceği tek an: bu ekranlardan birinden başka bir sekmeye geçmek */
export const DOGAL_DURAK = ['history', 'favorites', 'more'];

/** localStorage'daki sayaç → temiz kayıt { son: [gösterim zamanları, ms, eskiden yeniye; en çok saatlikEnCok tane] } */
export function kayitTemizle(v) {
  const k = v && typeof v === 'object' ? v : {};
  const son = Array.isArray(k.son) ? k.son.filter(z => Number.isFinite(z) && z > 0).sort((a, b) => a - b) : [];
  return { son: son.slice(-KURAL.saatlikEnCok) };
}

/**
 * Geçiş reklamı şimdi gösterilebilir mi? Saf işlev.
 *   d.simdi          ms
 *   d.oturumBasi     oturumun başladığı an (ms)
 *   d.eski, d.yeni   terk edilen ve açılan sekme ('home' | 'history' | 'favorites' | 'more')
 *   d.ekranaGiris    terk edilen sekmeye girilen an (ms)
 *   d.yol            'tab' (sekme çubuğu) | 'back' (geri tuşu) | başka (ör. 'entry': kayıt açıldı) → yalnız tab/back
 *   d.klavye, d.altSayfa   klavye açık mı, bir alt sayfa (sheet) açık mı
 *   d.uyelikGoruldu  reklamsız üyelik sayfasının en son açıldığı an (ms, yoksa 0)
 *   kayit            kayitTemizle() çıktısı
 * → { uygun: true } ya da { uygun: false, neden: '...' }
 */
export function gecisUygunMu(d, kayit, kural = KURAL) {
  const red = neden => ({ uygun: false, neden });
  if (!DOGAL_DURAK.includes(d.eski) || d.eski === d.yeni) return red('dogal-durak-degil');
  if (d.yol !== 'tab' && d.yol !== 'back') return red('kullanici-isi');
  if (d.klavye || d.altSayfa) return red('mesgul');
  if (d.simdi - d.oturumBasi < kural.ilkSn * 1000) return red('oturum-basi');
  if (d.simdi - d.ekranaGiris < kural.ekranEnAzSn * 1000) return red('kisa-ziyaret');
  if (d.uyelikGoruldu && d.simdi - d.uyelikGoruldu < kural.uyelikSonrasiSn * 1000) return red('uyelik-sayfasi');
  const son = kayit.son.filter(z => z <= d.simdi);
  if (son.length && d.simdi - son[son.length - 1] < kural.araSn * 1000) return red('ara');
  if (son.filter(z => d.simdi - z < 3600e3).length >= kural.saatlikEnCok) return red('saatlik');
  return { uygun: true };
}

/** gösterilen bir geçiş reklamını kayda ekler (yeni kayıt döner) */
export function gosterildi(kayit, simdi) {
  return kayitTemizle({ son: [...kayit.son.filter(z => simdi - z < 3600e3), simdi] });
}

/** uygulama arka plandan döndü: arka planda kalınan süre uzunsa yeni oturum başlar (açılış gibi) */
export const yeniOturumMu = (arkaPlanaGecis, simdi, kural = KURAL) => !!arkaPlanaGecis && simdi - arkaPlanaGecis >= kural.yeniOturumSn * 1000;
