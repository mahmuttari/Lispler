/* ============================================================
   CALQORA — REKLAMLAR (Google AdMob, yalnız Android uygulaması)
   @capacitor-community/admob eklentisi window.Capacitor.Plugins.AdMob olarak gelir. Masaüstü tarayıcıda eklenti yoktur:
   bu dosyadaki her şey sessizce devre dışı kalır. Kimlikler reklam-kimlik.js'ten (android/gradle.properties'ten üretilir);
   hata ayıklama derlemesinde (Capacitor.DEBUG) her zaman Google'ın test kimlikleri. Sınama: test/reklam.test.mjs.

   Kurallar (uzman kararı, 2026-10; 1.0.0'daki GeoTerva tam ekran ev reklamının yerine):
   - Reklamsız üye: AdMob SDK'sı HİÇ başlatılmaz, UMP de sorulmaz. Reklamlar ancak Google Play "üye değil" dedikten (ya da
     Play'e ulaşılamadığı ve son bilinen yanıt "üye değil" olduğu) sonra başlar (premium.js). Oturum içinde üye olunca
     banner kaldırılır ve geçiş reklamı gösterilmez; üyelik biterse (Play "üye değil" derse) reklamlar yeniden başlar.
   - Önce UMP: requestConsentInfo → gerekiyorsa showConsentForm → yalnız canRequestAds ise initialize. Reklam içerik
     derecesi en çok G ("General": genel izleyici). UMP gizlilik seçenekleri girişi istiyorsa Ayarlar'da
     "Reklam gizlilik seçenekleri" satırı çıkar (ui-settings.js).
   - Banner: altta uyarlanabilir sabit (anchored adaptive) banner, kendi şeridinde. Sayfanın altına banner yüksekliği
     kadar boşluk bırakılır (--ad-h, css/app.css "reklam şeridi"): banner hiçbir düğmenin üstüne binmez. Yazılım klavyesi
     açıkken gizlenir, kapanınca geri gelir.
   - Geçiş reklamı yalnız doğal bir durakta: Grafik, Matris ya da Birim sekmesinden ayrılırken ve Ayarlar kapanırken
     (app.js). Asla: ifade yazılırken (klavye ya da sayı tuş takımı açıkken, son 1,5 sn içinde tuşa basıldıysa), bir sayfa
     (geçmiş, fonksiyonlar, üyelik…) açıkken, uygulama arka plandayken, oturumun ilk 3 dakikasında. İki geçiş reklamı
     arasında en az 4 dakika, saatte en çok 6. Gösterim zamanları localStorage'da kalıcıdır (uygulamayı kapatıp açmak
     sayacı sıfırlamaz). Oturum: uygulamanın açılışı ya da arka planda 30 dakikadan uzun kaldıktan sonra öne gelişi.
   - Açılış reklamı (app open) ve ödüllü reklam yok.
   ============================================================ */
import { REKLAM_KIMLIK, TEST_KIMLIK } from './reklam-kimlik.js';

export const KURAL = {
  ilkSureMs: 3 * 60e3,      // oturumun ilk 3 dakikasında geçiş reklamı yok
  araMs: 4 * 60e3,          // iki geçiş reklamı arasında en az 4 dakika
  saatlikEnCok: 6,          // son 60 dakikada en çok 6
  saatMs: 60 * 60e3,
  oturumAraMs: 30 * 60e3,   // arka planda bundan uzun kalınırsa yeni oturum
  girdiMs: 1500,            // son tuş/yazma bundan yeniyse kullanıcı hâlâ yazıyor sayılır
  gecikmeMs: 450,           // duraktan sonra bekleme (sayfa kapanma animasyonu 220 ms); bu arada dokunulursa vazgeçilir
};
export const KAYIT_ANAHTARI = 'calqora.reklam.v1';

// ---------------------------------------------------------------- saf kurallar (Node'da sınanır)

/** Kalıcı kayıt → { gosterimler: [ms…] }: sayı olmayan, gelecekteki (saat geri alınmış) ve bir saatten eski zamanlar atılır. */
export function kayitTemizle(v, simdi) {
  const g = v && typeof v === 'object' && Array.isArray(v.gosterimler) ? v.gosterimler : [];
  return { gosterimler: g.filter((z) => Number.isFinite(z) && z <= simdi && simdi - z < KURAL.saatMs).sort((a, b) => a - b).slice(-KURAL.saatlikEnCok) };
}

/** Şu an geçiş reklamı gösterilebilir mi?
 *  kayit: kayitTemizle çıktısı · oturumBasi: ms · durum: { gorunur, yaziliyor, sayfaAcik } (app.js'in o anki gözlemi) */
export function gecisUygunMu(kayit, simdi, oturumBasi, durum) {
  if (!durum || !durum.gorunur || durum.yaziliyor || durum.sayfaAcik) return false;
  if (!(simdi - oturumBasi >= KURAL.ilkSureMs)) return false;
  const g = kayitTemizle(kayit, simdi).gosterimler;
  if (g.length && simdi - g[g.length - 1] < KURAL.araMs) return false;
  return g.length < KURAL.saatlikEnCok;
}

// ---------------------------------------------------------------- kalıcı sayaç

function kayitOku(simdi) {
  try { return kayitTemizle(JSON.parse(localStorage.getItem(KAYIT_ANAHTARI) || 'null'), simdi); } catch (e) { return { gosterimler: [] }; }
}
function kayitYaz(k) {
  try { localStorage.setItem(KAYIT_ANAHTARI, JSON.stringify(k)); } catch (e) { /* depolama kapalı: sayaç bu oturumda bellekte */ }
}

// ---------------------------------------------------------------- eklenti ve durum

const pencere = typeof window !== 'undefined' ? window : null;
const admob = () => (pencere && pencere.Capacitor && pencere.Capacitor.Plugins && pencere.Capacitor.Plugins.AdMob) || null;
const kimlik = () => (pencere && pencere.Capacitor && pencere.Capacitor.DEBUG ? TEST_KIMLIK : REKLAM_KIMLIK);

const r = {
  istendi: false,          // baslat() çağrıldı (üye değil)
  durduruldu: false,       // üye oldu: bu oturumda bir daha reklam yok
  hazir: false,            // SDK başlatıldı (oturumda bir kez)
  izin: false,             // UMP: reklam istenebilir (canRequestAds)
  izleniyor: false,
  gizlilikGerekli: false,  // UMP gizlilik seçenekleri girişini istiyor (AB/EEA, Birleşik Krallık, İsviçre)
  gecisYuklu: false,
  gecisYukleniyor: false,
  bannerVar: false,        // showBanner çağrıldı ve banner yerinde (yüklenmese de)
  bannerKlavyeyle: false,  // klavye açıldığı için gizlendi
  bannerDeneme: 0,
  zamanlayici: 0,
  oturumBasi: Date.now(),
  gizlendi: 0,
};
let durumFn = () => ({ gorunur: true, yaziliyor: false, sayfaAcik: false });
let degisti = () => {};
let sonDokunus = 0;

/** app.js verir: durum() → { gorunur, yaziliyor, sayfaAcik }; degisti() → gizlilik satırı gibi şeyler yenilensin */
export function reklamAyarla(o) {
  if (o && o.durum) durumFn = o.durum;
  if (o && o.degisti) degisti = o.degisti;
}
export const gizlilikGerekli = () => r.gizlilikGerekli;
export const reklamHazir = () => r.hazir && r.izin && !r.durduruldu;

// banner şeridinin yüksekliği (dp = CSS px): css/app.css › html.reklamli
function seritYuksekligi(h) {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  const px = Math.max(0, Math.round(Number(h) || 0));
  el.style.setProperty('--ad-h', px + 'px');
  el.classList.toggle('reklamli', px > 0);
  const serit = document.getElementById('reklam-seridi');
  if (serit) serit.hidden = px === 0;
}

// ---------------------------------------------------------------- başlatma

/** Üye değil: UMP'yi sor, izin varsa SDK'yı başlat, banner ve ilk geçiş reklamını hazırla. Tekrar çağrılabilir. */
export async function reklamlariBaslat() {
  const ad = admob();
  if (!ad) return;
  r.durduruldu = false;
  if (r.istendi) return;
  r.istendi = true;
  if (!r.izleniyor) izle();
  await onayVeBaslat(ad);
}

async function onayVeBaslat(ad) {
  try {
    let bilgi = await ad.requestConsentInfo();
    if (!bilgi.canRequestAds && bilgi.isConsentFormAvailable && bilgi.status === 'REQUIRED') bilgi = await ad.showConsentForm();
    r.gizlilikGerekli = bilgi.privacyOptionsRequirementStatus === 'REQUIRED';
    degisti();
    if (r.durduruldu) return;
    r.izin = !!bilgi.canRequestAds;
    if (!r.izin) { reklamlariKaldir(); return; }
    if (!r.hazir) {
      // Derece initialize'da RequestConfiguration'a yazılır ve sonraki bütün isteklere uygulanır; eklenti yalnız tam "General" yazımını tanır
      await ad.initialize({ maxAdContentRating: 'General' });
      if (r.durduruldu) return;
      r.hazir = true;
      ad.addListener('bannerAdSizeChanged', (b) => { if (!r.durduruldu) seritYuksekligi(b && b.height); });
      ad.addListener('bannerAdFailedToLoad', () => { r.bannerVar = false; seritYuksekligi(0); bannerYeniden(); });
      ad.addListener('bannerAdLoaded', () => { r.bannerDeneme = 0; });
      ad.addListener('interstitialAdDismissed', () => { r.gecisYuklu = false; gecisYukle(); });
      ad.addListener('interstitialAdFailedToShow', () => { r.gecisYuklu = false; gosterimiGeriAl(); gecisYukle(); });
    }
    bannerGoster();
    gecisYukle();
  } catch (e) {
    // Ağ yok ya da UMP yanıt vermedi: bu oturumda reklam yok; uygulama öne gelince (premium.js › refresh) yeniden denenir
    r.istendi = false;
    console.warn('AdMob', e);
  }
}

async function bannerGoster() {
  const ad = admob();
  if (!ad || !r.hazir || !r.izin || r.durduruldu || r.bannerVar) return;
  r.bannerVar = true;
  try {
    await ad.showBanner({ adId: kimlik().banner, adSize: 'ADAPTIVE_BANNER', position: 'BOTTOM_CENTER', margin: 0 });
    if (klavyeAcik()) bannerKlavye(true);
  } catch (e) { r.bannerVar = false; bannerYeniden(); }
}

// yüklenemeyen banner: 1, 2, 4… en çok 10 dakika sonra yeniden
function bannerYeniden() {
  if (r.durduruldu || !r.hazir || !r.izin) return;
  const ms = Math.min(10 * 60e3, 60e3 * 2 ** r.bannerDeneme++);
  setTimeout(bannerGoster, ms);
}

async function gecisYukle() {
  const ad = admob();
  if (!ad || !r.hazir || !r.izin || r.durduruldu || r.gecisYuklu || r.gecisYukleniyor) return;
  r.gecisYukleniyor = true;
  try { await ad.prepareInterstitial({ adId: kimlik().gecis }); r.gecisYuklu = true; } catch (e) { r.gecisYuklu = false; }
  r.gecisYukleniyor = false;
}

/** Üye oldu: banner kalkar, geçiş reklamı gösterilmez (yolda olan başlatma da yarıda kalır). */
export function reklamlariDurdur() {
  r.durduruldu = true;
  r.istendi = false;
  reklamlariKaldir();
}

function reklamlariKaldir() {
  clearTimeout(r.zamanlayici);
  const ad = admob();
  if (ad && r.bannerVar) ad.removeBanner().catch(() => {});
  r.bannerVar = false;
  r.bannerKlavyeyle = false;
  seritYuksekligi(0);
}

// ---------------------------------------------------------------- doğal durak → geçiş reklamı

/** app.js çağırır: bir araçtan (Grafik, Matris, Birim) ayrılındı ya da Ayarlar kapandı. Kurallar uygunsa kısa bir
 *  beklemeden sonra geçiş reklamı gösterilir; bu arada kullanıcı dokunursa vazgeçilir (hak sonraki durağa kalır). */
export function dogalDurak(neden) {
  const ad = admob();
  if (!ad || !r.hazir || !r.izin || r.durduruldu) return false;
  if (!r.gecisYuklu) { gecisYukle(); return false; }
  const simdi = Date.now();
  if (!gecisUygunMu(kayitOku(simdi), simdi, r.oturumBasi, durumFn())) return false;
  const durak = simdi;
  clearTimeout(r.zamanlayici);
  r.zamanlayici = setTimeout(() => {
    const an = Date.now();
    if (sonDokunus > durak || r.durduruldu || !r.izin || !r.gecisYuklu) return;
    const k = kayitOku(an);
    if (!gecisUygunMu(k, an, r.oturumBasi, durumFn())) return;
    k.gosterimler.push(an);
    kayitYaz(k);
    r.gecisYuklu = false;
    ad.showInterstitial().catch(() => { gosterimiGeriAl(an); gecisYukle(); });
  }, KURAL.gecikmeMs);
  return true;
}

// gösterilemeyen reklam sayaçtan düşülür (en son eklenen)
function gosterimiGeriAl(z) {
  const k = kayitOku(Date.now());
  const i = z ? k.gosterimler.lastIndexOf(z) : k.gosterimler.length - 1;
  if (i >= 0) { k.gosterimler.splice(i, 1); kayitYaz(k); }
}

// ---------------------------------------------------------------- UMP gizlilik seçenekleri (Ayarlar)

export async function gizlilikSecenekleri() {
  const ad = admob();
  if (!ad) return;
  try {
    await ad.showPrivacyOptionsForm();
    // Tercih değişmiş olabilir: izin geri alındıysa reklamlar kalkar, verildiyse başlar
    r.istendi = true;
    await onayVeBaslat(ad);
  } catch (e) { console.warn('AdMob gizlilik', e); }
}

// ---------------------------------------------------------------- klavye, görünürlük, dokunuş

let enYuksek = 0, enGenis = 0;
/** Yazılım klavyesi açık mı: pencere (adjustResize) aynı genişlikte en yüksek hâlinden belirgin biçimde kısaldıysa. */
export function klavyeAcik() {
  if (!pencere) return false;
  const h = pencere.innerHeight, w = pencere.innerWidth;
  if (w !== enGenis) { enGenis = w; enYuksek = h; }
  if (h > enYuksek) enYuksek = h;
  return enYuksek - h > 120;
}

function bannerKlavye(acik) {
  const ad = admob();
  if (!ad || !r.bannerVar || r.durduruldu) return;
  if (acik && !r.bannerKlavyeyle) { r.bannerKlavyeyle = true; seritYuksekligi(0); ad.hideBanner().catch(() => {}); }
  else if (!acik && r.bannerKlavyeyle) { r.bannerKlavyeyle = false; ad.resumeBanner().catch(() => {}); }
}

function izle() {
  r.izleniyor = true;
  if (!pencere || typeof document === 'undefined') return;
  klavyeAcik();
  pencere.addEventListener('resize', () => bannerKlavye(klavyeAcik()));
  document.addEventListener('pointerdown', () => { sonDokunus = Date.now(); }, true);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { r.gizlendi = Date.now(); clearTimeout(r.zamanlayici); }
    else if (r.gizlendi && Date.now() - r.gizlendi >= KURAL.oturumAraMs) r.oturumBasi = Date.now();
  });
}
