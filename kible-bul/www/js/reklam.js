/* ============================================================
   KIBLE BUL — REKLAMLAR (Google AdMob, yalnız Android uygulaması; @capacitor-community/admob 8.2.1)
   Masaüstü tarayıcıda eklenti yoktur: buradaki her şey sessizce hiçbir şey yapmaz.
   Kıble yönü bulunan bir uygulamada reklam ÖLÇÜLÜ olmalıdır (uzman kararı, magaza/DEGERLENDIRME.md):

   - Reklamsız üye: AdMob SDK'sı hiç başlatılmaz (UMP dahil hiçbir reklam çağrısı yapılmaz). Üyelik başlarsa banner
     kaldırılır, geçiş reklamı bir daha istenmez.
   - Önce UMP (Google'ın onay platformu): requestConsentInfo → gerekiyorsa showConsentForm → yalnız canRequestAds ise
     initialize. initialize'a maxAdContentRating 'General' (G: genel izleyici) verilir; eklenti yalnız bu tam yazımı
     tanır. Hassas reklam kategorileri (kumar, alkol, flört…) AdMob panelinde engellenir (magaza/PLAY-YAYIN.md adım 1).
     UMP "privacy options" girişi isterse Ayarlar'da "Reklam gizlilik seçenekleri" satırı görünür.
   - Banner: uyarlanabilir sabit banner, ekranın en altında KENDİ ŞERİDİNDE (#reklam-serit). Sayfanın altı banner
     yüksekliği kadar boşaltılır (--reklam-h); banner hiçbir düğmenin, kartın ya da alt sayfanın üstüne binmez, sekme
     çubuğundan 6 px aralıkla ayrılır. Klavye açıkken, karşılama ekranında ve pusula kalibrasyonu sırasında gizlenir.
   - Geçiş (tam ekran) reklamı yalnız DOĞAL BİR DURAKTA: (1) yer araması tamamlanıp pusulaya dönülürken (aramadan,
     koordinattan ya da son yerlerden bir yer seçildi), (2) haritaya en az 8 sn bakıldıktan sonra haritadan çıkılırken.
     Asla: yazarken, kalibrasyon ya da karşılama açıkken, bir alt sayfa (üyelik, pusula bilgisi…) açıkken, uygulama
     arka plandayken. Reklam açıkken pusula algılayıcısı durur (app.js), kapanınca yeniden başlar.
   - Sıklık: oturumun ilk 3 dakikasında yok; iki geçiş reklamı arasında en az 4 dakika; saatte en çok 6. Sayaçlar
     localStorage'da kalıcıdır ("kible-bul.reklam"). Uygulama 30 dakikadan uzun arka planda kalırsa yeni oturum sayılır.
   - Açılış (app open) reklamı ve ödüllü reklam YOK.
   - Hata ayıklama derlemesinde (KibleYerel.bilgi().hataAyiklama) birimler isTesting ile Google'ın test reklamıdır.
   Sınama: test/reklam.test.mjs (kurallar, kimlikler, çağrı sırası: sahte AdMob eklentisiyle).
   ============================================================ */
import { REKLAM_KIMLIK } from './reklam-kimlik.js';

export const KURAL = {
  ilkMs: 3 * 60e3,          // oturumun ilk 3 dakikasında geçiş reklamı yok
  araMs: 4 * 60e3,          // iki geçiş reklamı arasında en az 4 dakika
  saatlikEnCok: 6,          // son bir saatte en çok 6 geçiş reklamı
  haritaEnAzMs: 8e3,        // haritaya bundan kısa bakılıp çıkılırsa "doğal durak" sayılmaz
  yeniOturumMs: 30 * 60e3,  // arka planda bundan uzun kalınca yeni oturum (ilk 3 dakika kuralı yeniden)
  gecikmeMs: 450,           // ekran geçişi bitsin diye geçiş reklamından önce kısa bekleme
  bannerAralik: 6,          // sekme çubuğu ile banner arası (px)
};
/** geçiş reklamının gösterilebileceği doğal duraklar */
export const NEDENLER = ['arama', 'harita'];
export const KAYIT_ANAHTARI = 'kible-bul.reklam';

/** kalıcı kayıt → { son: [son bir saatteki geçiş reklamlarının zamanı, ms] } (bozuk değerler atılır) */
export function kayitTemizle(v, simdi = Date.now()) {
  const son = v && Array.isArray(v.son) ? v.son : [];
  // saat geri alınmışsa ileri tarihli kayıt reklamı süresiz engellemesin: bir dakikadan ileri olan atılır
  return { son: son.filter((z) => Number.isFinite(z) && z <= simdi + 60e3 && simdi - z < 3600e3).slice(-KURAL.saatlikEnCok) };
}

/**
 * Geçiş reklamı şimdi gösterilebilir mi? Saf işlev (Node'da sınanır).
 * { neden, son: [ms], oturumBasi: ms, simdi: ms, engel: bir şey açık/yazılıyor mu, uye: reklamsız üye mi }
 */
export function gecisUygunMu({ neden, son = [], oturumBasi, simdi, engel = false, uye = false }) {
  if (uye || engel || !NEDENLER.includes(neden)) return false;
  if (!(simdi - oturumBasi >= KURAL.ilkMs)) return false;
  const saat = son.filter((z) => simdi - z < 3600e3);
  if (saat.length >= KURAL.saatlikEnCok) return false;
  const enSon = saat.length ? Math.max(...saat) : -Infinity;
  return simdi - enSon >= KURAL.araMs;
}

// ---------------------------------------------------------------------------------------------- çalışma anı
const cap = typeof window !== 'undefined' ? window.Capacitor : undefined;
const yerelMi = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
const eklenti = (ad) => {
  if (!yerelMi) return null;
  try { return (cap.Plugins && cap.Plugins[ad]) || cap.registerPlugin(ad); } catch (e) { return null; }
};

const d = {
  basliyor: false, hazir: false, test: false, gizlilikGerekli: false,
  bannerVar: false, bannerGizli: false, gecisYuklu: false, gecisYukleniyor: false, gecisDenemesi: 0, gecisAcik: false,
  durdu: false, dinleniyor: false, oturumBasi: Date.now(), gizlendi: 0,
  engeller: new Set(),
};
// app.js'in verdiği kancalar
let kanca = { uye: () => false, engelVar: () => false, gecisAcik: () => {}, gizlilikDegisti: () => {} };
export function reklamAyarla(o) { kanca = { ...kanca, ...o }; }

function kayitOku() {
  try { return kayitTemizle(JSON.parse(localStorage.getItem(KAYIT_ANAHTARI) || 'null')); } catch (e) { return { son: [] }; }
}
function kayitYaz(k) { try { localStorage.setItem(KAYIT_ANAHTARI, JSON.stringify(k)); } catch (e) { /* depolama kapalı */ } }

export const reklamHazir = () => d.hazir;
export const gizlilikSecenegiGerekli = () => d.gizlilikGerekli;

function yukseklik(px) {
  if (typeof document === 'undefined') return;
  const h = Math.max(0, Math.round(Number(px) || 0));
  document.documentElement.style.setProperty('--reklam-h', (h ? h + KURAL.bannerAralik : 0) + 'px');
  document.documentElement.classList.toggle('reklamli', h > 0);
}

/** UMP → (izin varsa) initialize → banner + geçiş reklamı yüklemesi. Birden çok çağrılabilir; başarısızsa sonra yeniden denenir. */
export async function reklamBaslat() {
  const ad = eklenti('AdMob');
  if (!ad || d.hazir || d.basliyor || kanca.uye()) return;
  d.basliyor = true; d.durdu = false;
  try {
    try { const b = await eklenti('KibleYerel').bilgi(); d.test = !!(b && b.hataAyiklama); } catch (e) { d.test = false; }
    let bilgi = await ad.requestConsentInfo({});
    if (!bilgi.canRequestAds && bilgi.isConsentFormAvailable && bilgi.status === 'REQUIRED') bilgi = await ad.showConsentForm();
    d.gizlilikGerekli = bilgi.privacyOptionsRequirementStatus === 'REQUIRED';
    kanca.gizlilikDegisti();
    if (!bilgi.canRequestAds || kanca.uye()) return;
    // Derece bundan sonraki bütün isteklere uygulanır: reklam istekleri initialize'dan SONRA gelir
    await ad.initialize({ maxAdContentRating: 'General', initializeForTesting: d.test });
    if (kanca.uye()) return;
    d.hazir = true;
    if (d.dinleniyor) { bannerGuncelle(); gecisYukle(); return; }   // üyelik bitip reklam yeniden başlıyor: dinleyiciler zaten var
    d.dinleniyor = true;
    await ad.addListener('bannerAdSizeChanged', (b) => yukseklik(d.bannerVar && !d.bannerGizli && b ? b.height : 0));
    await ad.addListener('bannerAdFailedToLoad', () => { d.bannerVar = false; yukseklik(0); });
    await ad.addListener('interstitialAdShowed', () => { d.gecisAcik = true; kanca.gecisAcik(true); });
    const kapandi = () => { d.gecisAcik = false; d.gecisYuklu = false; kanca.gecisAcik(false); gecisYukle(); };
    await ad.addListener('interstitialAdDismissed', kapandi);
    await ad.addListener('interstitialAdFailedToShow', kapandi);
    bannerGuncelle();
    gecisYukle();
  } catch (e) {
    console.warn('AdMob', e && e.message ? e.message : e);
  } finally {
    d.basliyor = false;
  }
}

/** reklamsız üyelik başladı: banner kalkar, geçiş reklamı bir daha istenmez */
export function reklamDurdur() {
  d.durdu = true;
  const ad = eklenti('AdMob');
  if (ad && d.bannerVar) ad.removeBanner().catch(() => {});
  d.bannerVar = false; d.bannerGizli = false; d.hazir = false; d.gecisYuklu = false;
  yukseklik(0);
}

/** banner'ı gizleyen durumlar: 'klavye', 'kalibrasyon', 'karsilama' (açık = true) */
export function reklamEngeli(neden, acik) {
  if (acik) d.engeller.add(neden); else d.engeller.delete(neden);
  bannerGuncelle();
}

function bannerGuncelle() {
  const ad = eklenti('AdMob');
  if (!ad || !d.hazir || d.durdu) return;
  const iste = !kanca.uye() && d.engeller.size === 0;
  if (iste && !d.bannerVar) {
    d.bannerVar = true; d.bannerGizli = false;
    ad.showBanner({ adId: REKLAM_KIMLIK.banner, adSize: 'ADAPTIVE_BANNER', position: 'BOTTOM_CENTER', margin: 0, isTesting: d.test })
      .catch(() => { d.bannerVar = false; yukseklik(0); });
  } else if (iste && d.bannerGizli) {
    d.bannerGizli = false;
    ad.resumeBanner().catch(() => {});
  } else if (!iste && d.bannerVar && !d.bannerGizli) {
    d.bannerGizli = true;
    yukseklik(0);
    ad.hideBanner().catch(() => {});
  }
}

async function gecisYukle() {
  const ad = eklenti('AdMob');
  if (!ad || !d.hazir || d.durdu || d.gecisYuklu || d.gecisYukleniyor || kanca.uye()) return;
  // yüklenemeyen reklam en sık dakikada bir yeniden istenir
  if (Date.now() - d.gecisDenemesi < 60e3) return;
  d.gecisYukleniyor = true; d.gecisDenemesi = Date.now();
  try {
    await ad.prepareInterstitial({ adId: REKLAM_KIMLIK.gecis, isTesting: d.test });
    d.gecisYuklu = true;
  } catch (e) { d.gecisYuklu = false; }
  d.gecisYukleniyor = false;
}

/**
 * Doğal bir durak oldu (NEDENLER). Kurallar uygunsa ve reklam yüklüyse kısa bir beklemeden sonra geçiş reklamı
 * gösterilir; o anda engel çıkarsa (alt sayfa, kalibrasyon, klavye…) hak harcanmaz. → gösterilecekse true
 */
export function gecisFirsati(neden, simdi = Date.now()) {
  const ad = eklenti('AdMob');
  if (!ad || !d.hazir || d.durdu || d.gecisAcik) return false;
  // Sıklık kuralları şimdi; "bir şey açık mı" denetimi gösterim anında (klavye kapanırken geçen çeyrek saniye sayılmasın)
  if (!gecisUygunMu({ neden, son: kayitOku().son, oturumBasi: d.oturumBasi, simdi, uye: kanca.uye() })) return false;
  if (!d.gecisYuklu) { gecisYukle(); return false; }
  setTimeout(() => {
    const an = Date.now();
    const engel = d.engeller.size > 0 || kanca.engelVar() || (typeof document !== 'undefined' && document.visibilityState !== 'visible');
    const k = kayitOku();
    if (d.durdu || !d.gecisYuklu || d.gecisAcik || !gecisUygunMu({ neden, son: k.son, oturumBasi: d.oturumBasi, simdi: an, engel, uye: kanca.uye() })) return;
    k.son.push(an); kayitYaz(kayitTemizle(k, an));
    d.gecisYuklu = false;
    ad.showInterstitial().catch(() => { d.gecisAcik = false; kanca.gecisAcik(false); gecisYukle(); });
  }, KURAL.gecikmeMs);
  return true;
}

/** uygulama arka plana gitti / öne geldi: 30 dakikadan uzun aradan sonra yeni oturum; başlamamış reklamlar yeniden denenir */
export function reklamGorunurluk(gorunur) {
  if (!gorunur) { d.gizlendi = Date.now(); return; }
  if (d.gizlendi && Date.now() - d.gizlendi > KURAL.yeniOturumMs) d.oturumBasi = Date.now();
  d.gizlendi = 0;
}

/** Ayarlar › Reklam gizlilik seçenekleri (AB onayını değiştirme) */
export async function gizlilikSecenekleriniAc() {
  const ad = eklenti('AdMob');
  if (!ad) return;
  try {
    const b = await ad.showPrivacyOptionsForm();
    if (b && typeof b.privacyOptionsRequirementStatus === 'string') d.gizlilikGerekli = b.privacyOptionsRequirementStatus === 'REQUIRED';
  } catch (e) { console.warn('AdMob gizlilik', e && e.message ? e.message : e); }
}

// sınama için (test/reklam.test.mjs): iç durum ve oturum başlangıcı
export const __durum = () => ({ ...d, engeller: [...d.engeller] });
export function __oturumBasi(ms) { d.oturumBasi = ms; }
