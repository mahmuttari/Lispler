/* ============================================================
   UNITICA — REKLAMLAR (AdMob, Android ve iPhone uygulaması)
   @capacitor-community/admob eklentisi Capacitor.Plugins.AdMob olarak gelir; masaüstü tarayıcıda eklenti yoktur ve
   bu dosyadaki her şey sessizce devre dışı kalır. NE ZAMAN sorusunun yanıtı ve gerekçesi reklam-kural.js'in
   başındadır; burada yalnız eklentiyle konuşulur:
   1. Reklamsız üyede hiçbir şey yapılmaz (AdMob SDK'sı başlatılmaz). Üyelik sonradan başlarsa reklamDurdur()
      banner'ı kaldırır, geçiş reklamı bir daha istenmez.
   2. UMP: requestConsentInfo → onay gerekliyse showConsentForm → canRequestAds değilse dur. Ancak ondan sonra
      initialize({ maxAdContentRating: 'General' }) (derece ondan sonraki her isteğe uygulanır).
      iPhone: UMP'den sonra, initialize'dan önce izleme izni (ATT). AdMob'da IDFA açıklama mesajı yayındaysa UMP onu
      ve Apple'ın iznini kendisi gösterir; değilse ve izin hiç sorulmadıysa burada sorulur. Verilmezse reklam yine
      gösterilir, yalnız kişiselleştirilmez (SDK reklam kimliğini okuyamaz).
   3. Banner: ADAPTIVE_BANNER, BOTTOM_CENTER. Yüksekliği (bannerAdSizeChanged, dp = CSS px) --ad-h değişkenine yazılır;
      css/app.css sayfayı o kadar yukarı çeker. Klavye açılınca hideBanner, kapanınca resumeBanner. Yüklenemezse
      (doluluk yok, ağ yok) 1, 2, 4 … en çok 8 dakika sonra yeniden denenir.
   4. Geçiş reklamı önceden yüklenir; yalnız sekme değişiminde reklam-kural.js "uygun" derse gösterilir.
   5. Hata ayıklama derlemesinde (Capacitor.DEBUG) her istek isTesting: Google'ın test birimleri.
   6. Kimlikler platforma göre (reklam-kimlik.js: android / ios); AdMob'da iki platform ayrı uygulamadır.
   Sınama: test/reklam.test.mjs (kurallar, kimlikler) ve araclar/tarayici-dene.mjs (sahte eklentiyle çağrı sırası).
   ============================================================ */
import { gecisUygunMu, gosterildi, kayitTemizle, yeniOturumMu } from './reklam-kural.js';
import { REKLAM_KIMLIK } from './reklam-kimlik.js';
import { plugin, isDebugBuild, isIOS, onAppState } from './native.js';
import { isAdFree } from './state.js';

const KAYIT = 'unitica.reklam';
const BANNER_YENIDEN = [60, 120, 240, 480];   // sn: yüklenemeyen banner için bekleme

const r = {
  durum: 'kapali',          // 'kapali' | 'baslatiliyor' | 'hazir' | 'durdu'
  gizlilikGerekli: false,   // UMP: gizlilik seçenekleri girişi gösterilmeli
  gecisYuklu: false,
  gecisYukleniyor: false,
  bannerVar: false,         // showBanner çağrıldı ve kaldırılmadı
  bannerDeneme: 0,
  bannerZaman: 0,
  klavye: false,
  oturumBasi: Date.now(),
  arkaPlan: 0,
  uyelikGoruldu: 0,
  sekme: 'home',
  ekranaGiris: Date.now(),
};
const izleyiciler = new Set();
const haberVer = () => izleyiciler.forEach(f => { try { f(); } catch (e) { /* ekran yenilenemedi */ } });

const admob = () => plugin('AdMob');
const KIMLIK = REKLAM_KIMLIK[isIOS ? 'ios' : 'android'];
const test = () => (isDebugBuild ? { isTesting: true } : {});

function kayitOku() {
  try { return kayitTemizle(JSON.parse(localStorage.getItem(KAYIT) || 'null')); } catch (e) { return kayitTemizle(null); }
}
function kayitYaz(k) {
  try { localStorage.setItem(KAYIT, JSON.stringify(k)); } catch (e) { /* depolama kapalı: sayaç yalnız bu oturumda */ }
}

/** banner yüksekliği (CSS px) → sayfa düzeni */
function bannerYuksekligi(px) {
  const h = Math.max(0, Math.round(Number(px) || 0));
  const kok = document.documentElement;
  kok.style.setProperty('--ad-h', h + 'px');
  kok.classList.toggle('reklamli', h > 0);
}

/** Diğer ekranındaki "Reklam gizlilik seçenekleri" satırı bunu sorar */
export const gizlilikGerekli = () => r.gizlilikGerekli;
/** ekran yenilensin diye haber alır (gizlilik satırı) */
export function reklamIzle(f) { izleyiciler.add(f); return () => izleyiciler.delete(f); }

export async function gizlilikSecenekleri() {
  const ad = admob();
  if (!ad) return;
  try { await ad.showPrivacyOptionsForm(); } catch (e) { /* form açılamadı: bir sonraki denemede */ }
  // seçim değişmiş olabilir: reklam istenip istenemeyeceğini UMP'ye yeniden sor
  try {
    const b = await ad.requestConsentInfo();
    r.gizlilikGerekli = b.privacyOptionsRequirementStatus === 'REQUIRED';
    haberVer();
  } catch (e) { /* çevrimdışı */ }
}

let dinleyicilerKuruldu = false;
function dinleyicileriKur(ad) {
  if (dinleyicilerKuruldu) return;
  dinleyicilerKuruldu = true;
  const dinle = (olay, f) => { try { Promise.resolve(ad.addListener(olay, f)).catch(() => {}); } catch (e) { /* eski eklenti */ } };
  dinle('bannerAdSizeChanged', b => bannerYuksekligi(r.durum === 'hazir' && !r.klavye ? b && b.height : 0));
  dinle('bannerAdLoaded', () => { r.bannerDeneme = 0; });
  dinle('bannerAdFailedToLoad', () => {
    // eklenti başarısız banner'ı kendisi kaldırır; bir süre sonra yeniden
    r.bannerVar = false;
    bannerYuksekligi(0);
    const sn = BANNER_YENIDEN[Math.min(r.bannerDeneme, BANNER_YENIDEN.length - 1)];
    r.bannerDeneme++;
    clearTimeout(r.bannerZaman);
    r.bannerZaman = setTimeout(bannerGoster, sn * 1000);
  });
  dinle('interstitialAdDismissed', () => { r.gecisYuklu = false; gecisYukle(); });
  dinle('interstitialAdFailedToShow', () => { r.gecisYuklu = false; gecisYukle(); });
}

async function bannerGoster() {
  const ad = admob();
  if (!ad || r.durum !== 'hazir' || r.bannerVar || isAdFree()) return;
  if (r.klavye) { clearTimeout(r.bannerZaman); r.bannerZaman = setTimeout(bannerGoster, 3000); return; }
  r.bannerVar = true;
  try {
    await ad.showBanner({ adId: KIMLIK.banner, adSize: 'ADAPTIVE_BANNER', position: 'BOTTOM_CENTER', margin: 0, ...test() });
  } catch (e) { r.bannerVar = false; }
}

async function gecisYukle() {
  const ad = admob();
  if (!ad || r.durum !== 'hazir' || r.gecisYuklu || r.gecisYukleniyor || isAdFree()) return;
  r.gecisYukleniyor = true;
  try {
    await ad.prepareInterstitial({ adId: KIMLIK.gecis, ...test() });
    r.gecisYuklu = true;
  } catch (e) { r.gecisYuklu = false; }
  r.gecisYukleniyor = false;
}

/** iPhone: Apple'ın izleme izni (ATT) hiç sorulmadıysa sorar; yanıt ne olursa olsun reklam sürer */
async function izlemeIzni(ad) {
  try {
    const { status } = await ad.trackingAuthorizationStatus();
    if (status === 'notDetermined') await ad.requestTrackingAuthorization();
  } catch (e) { /* iOS 14 öncesi ya da eklenti yanıt vermedi: izin sorulmadan devam */ }
}

let baslatma = null;
/** açılışta ve üyelik bitince çağrılır; birden çok çağrı tek başlatma yapar */
export function reklamBaslat() {
  const ad = admob();
  if (!ad || isAdFree() || r.durum === 'hazir') return Promise.resolve();
  if (baslatma) return baslatma;
  r.durum = 'baslatiliyor';
  baslatma = (async () => {
    try {
      let bilgi = await ad.requestConsentInfo();
      if (!bilgi.canRequestAds && bilgi.isConsentFormAvailable && bilgi.status === 'REQUIRED') bilgi = await ad.showConsentForm();
      r.gizlilikGerekli = bilgi.privacyOptionsRequirementStatus === 'REQUIRED';
      haberVer();
      if (!bilgi.canRequestAds || isAdFree()) { r.durum = 'kapali'; return; }
      if (isIOS) await izlemeIzni(ad);
      await ad.initialize({ maxAdContentRating: 'General' });
      if (isAdFree()) { r.durum = 'durdu'; return; }   // bu arada üye oldu
      dinleyicileriKur(ad);
      r.durum = 'hazir';
      bannerGoster();
      gecisYukle();
    } catch (e) {
      r.durum = 'kapali';   // çevrimdışı ya da UMP hatası: uygulama öne gelince yeniden denenir
    } finally {
      baslatma = null;
    }
  })();
  return baslatma;
}

/** üye oldu: banner kalkar, yeni reklam istenmez (SDK başlatılmışsa bile yalnız istek yapılmaz) */
export async function reklamDurdur() {
  const ad = admob();
  r.durum = 'durdu';
  clearTimeout(r.bannerZaman);
  bannerYuksekligi(0);
  if (ad && r.bannerVar) { r.bannerVar = false; try { await ad.removeBanner(); } catch (e) { /* zaten yok */ } }
}

/** app.js: bir metin alanı odak aldı/bıraktı (ekran klavyesi) */
export function klavye(acik) {
  if (r.klavye === acik) return;
  r.klavye = acik;
  const ad = admob();
  if (!ad || r.durum !== 'hazir' || !r.bannerVar) return;
  if (acik) { bannerYuksekligi(0); ad.hideBanner().catch(() => {}); }
  else ad.resumeBanner().catch(() => {});
}

/** membership.js: reklamsız üyelik sayfası açıldı */
export const uyelikGoruldu = () => { r.uyelikGoruldu = Date.now(); };

/**
 * app.js: sekme değişti. yol: 'tab' (sekme çubuğu) | 'back' (geri tuşu) | 'entry' (kayıt açıldı) | 'settings' (dişli).
 * durum(): { altSayfa } o anki durum (gösterimden hemen önce yeniden sorulur)
 */
export function sekmeDegisti(eski, yeni, yol, durum) {
  const simdi = Date.now();
  const d = { simdi, oturumBasi: r.oturumBasi, eski, yeni, ekranaGiris: r.ekranaGiris, yol, klavye: r.klavye,
    altSayfa: !!durum().altSayfa, uyelikGoruldu: r.uyelikGoruldu };
  r.sekme = yeni;
  r.ekranaGiris = simdi;
  const ad = admob();
  if (!ad || r.durum !== 'hazir' || isAdFree()) return;
  if (!gecisUygunMu(d, kayitOku()).uygun) return;
  if (!r.gecisYuklu) { gecisYukle(); return; }   // hazır değil: bu durak geçer, sonrakine
  setTimeout(() => {
    // bu arada başka bir şey olduysa (yeni sekme, alt sayfa, klavye, arka plan) gösterilmez
    if (r.sekme !== yeni || r.klavye || durum().altSayfa || document.visibilityState !== 'visible' || r.durum !== 'hazir' || isAdFree()) return;
    kayitYaz(gosterildi(kayitOku(), Date.now()));
    r.gecisYuklu = false;
    ad.showInterstitial().catch(() => { gecisYukle(); });
  }, 350);
}

// Uygulama öne gelince: uzun aradan sonra yeni oturum (ilk 5 dakika geçiş reklamı yok); başlatma yarım kaldıysa yeniden
function oneGeldi() {
  const simdi = Date.now();
  if (yeniOturumMu(r.arkaPlan, simdi)) { r.oturumBasi = simdi; r.ekranaGiris = simdi; }
  r.arkaPlan = 0;
  if (r.durum === 'kapali' && !isAdFree()) reklamBaslat();
}
function arkayaGitti() { r.arkaPlan = Date.now(); }
onAppState(arkayaGitti, oneGeldi);

/** testler için iç durum */
export const _r = r;
