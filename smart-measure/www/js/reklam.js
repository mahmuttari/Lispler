/* ============================================================
   SMART MEASURE — REKLAMLAR (Google AdMob, Android ve iPhone uygulaması)
   @capacitor-community/admob eklentisi window.Capacitor.Plugins.AdMob olarak gelir; masaüstü tarayıcıda eklenti yoktur
   ve bu dosyadaki her şey sessizce devre dışı kalır. Kurallar (uzman kararı; Poyraz Workshop'un daha önce askıya
   alınmış iki uygulaması olduğu için sınırda hiçbir davranış yok). Sınama: test/reklam.test.mjs.
   - Reklamsız abone: AdMob SDK'sı hiç başlatılmaz. Açılışta önce Google Play'e abonelik sorulur (en çok 4 sn);
     abonelik sonradan başlarsa banner kaldırılır, geçiş reklamı bir daha istenmez.
   - Önce Google UMP: requestConsentInfo → gerekiyorsa showConsentForm → yalnız canRequestAds ise initialize.
     Reklam içerik derecesi en çok G ("General"). UMP gizlilik seçeneklerini zorunlu sayarsa Ayarlar'da
     "Reklam gizlilik seçenekleri" görünür.
   - Banner: altta, kendi şeridinde uyarlanabilir sabit banner. Sayfanın altına banner yüksekliği kadar boşluk
     bırakılır (--banner-h), banner hiçbir düğmenin üstüne binmez; klavye açıkken ve tam ekran kamerada / tam ekran
     cetvelde gizlenir.
   - Geçiş reklamı: yalnız doğal bir durakta, bir araçtan (kamera, su terazisi, cetvel, ölçerler) çıkılınca; araç
     açıkken, ölçüm ya da giriş sürerken, kamera ya da mikrofon açıkken asla. Oturumun ilk 3 dakikasında yok (açılışta
     da yok), iki geçiş reklamı arası en az 4 dakika, saatte en çok 6. Sayaçlar kalıcıdır (SYS.reklam). 30 dakikadan
     uzun arka plandan dönüş yeni oturum sayılır. Açılış reklamı ve ödüllü reklam yok.
   - iPhone: UMP'den sonra, initialize'dan önce izleme izni (ATT). AdMob'da IDFA açıklama mesajı yayındaysa UMP onu ve
     Apple'ın iznini kendisi gösterir; değilse ve izin hiç sorulmadıysa burada sorulur. Verilmezse reklam yine gösterilir,
     yalnız kişiselleştirilmez.
   - Kimlikler platforma göre (reklam-kimlik.js: android / ios; AdMob'da iki platform ayrı uygulamadır).
   - Hata ayıklama derlemesi her zaman Google'ın test kimliklerini kullanır.
   ============================================================ */
import { REKLAM_KIMLIK, TEST_KIMLIK } from './reklam-kimlik.js';
import { SYS, saveSys } from './store.js';
import { plugin, listen, appInfo, isIOS } from './native.js';
import { isPremium, onChange as onPremiumChange } from './premium.js';

export const KURAL = {
  ilkSn: 180,          // oturumun ilk 3 dakikasında geçiş reklamı yok
  araSn: 240,          // iki geçiş reklamı arası en az 4 dakika
  saatlikEnCok: 6,     // son bir saatte en çok 6
  yeniOturumDk: 30,    // bundan uzun arka plan yeni oturum
  abonelikBekleMs: 4000,
};

/** Kalıcı sayaçlar: son bir saatteki geçiş reklamlarının zamanı (ms). */
export function kayitTemizle(v, simdi = Date.now()) {
  const son = v && Array.isArray(v.son) ? v.son.filter((z) => Number.isFinite(z) && z <= simdi && simdi - z < 3600e3) : [];
  return { son: son.slice(-KURAL.saatlikEnCok) };
}

/** Saf karar: d = { reklamsiz, hazir, yuklu, mesgul, oturumBasi }, kayit = kayitTemizle(...), simdi ms. */
export function gecisUygunMu(d, kayit, simdi) {
  if (d.reklamsiz || !d.hazir || !d.yuklu || d.mesgul) return false;
  if (!(simdi - d.oturumBasi >= KURAL.ilkSn * 1000)) return false;
  const son = kayit.son.filter((z) => simdi - z < 3600e3);
  if (son.length >= KURAL.saatlikEnCok) return false;
  const enSon = son.length ? Math.max(...son) : -Infinity;
  return simdi - enSon >= KURAL.araSn * 1000;
}

const durum = {
  hazir: false, yuklu: false, banner: false, bannerAcik: false, gizlilikGerekli: false,
  oturumBasi: Date.now(), arkaPlan: null, mesgul: new Set(), gizle: new Set(), kimlik: REKLAM_KIMLIK[isIOS ? 'ios' : 'android'], bannerH: 0,
};
export const _durum = durum; // sınama için

const admob = () => plugin('AdMob');

function bannerPayi(px) {
  durum.bannerH = px;
  document.documentElement.style.setProperty('--banner-h', `${Math.max(0, Math.round(px))}px`);
}

/** iPhone: Apple'ın izleme izni (ATT) hiç sorulmadıysa sorar; yanıt ne olursa olsun reklam sürer */
async function izlemeIzni(ad) {
  try {
    const { status } = await ad.trackingAuthorizationStatus();
    if (status === 'notDetermined') await ad.requestTrackingAuthorization();
  } catch (e) { /* eklenti yanıt vermedi: izin sorulmadan devam */ }
}

export async function baslat() {
  const ad = admob();
  if (!ad || durum.hazir || isPremium()) return;
  try {
    const bilgi = await appInfo();
    if (bilgi.debug) durum.kimlik = TEST_KIMLIK[isIOS ? 'ios' : 'android'];
    let onay = await ad.requestConsentInfo();
    if (!onay.canRequestAds && onay.isConsentFormAvailable && onay.status === 'REQUIRED') onay = await ad.showConsentForm();
    durum.gizlilikGerekli = onay.privacyOptionsRequirementStatus === 'REQUIRED';
    document.dispatchEvent(new CustomEvent('reklam-gizlilik'));
    if (!onay.canRequestAds || isPremium()) return;
    if (isIOS) await izlemeIzni(ad);
    await ad.initialize({ maxAdContentRating: 'General' });
    durum.hazir = true;
    listen(ad, 'bannerAdSizeChanged', (s) => bannerPayi(durum.bannerAcik ? (s && s.height) || 0 : 0));
    listen(ad, 'interstitialAdDismissed', () => { durum.yuklu = false; gecisYukle(); });
    listen(ad, 'interstitialAdFailedToShow', () => { durum.yuklu = false; gecisYukle(); });
    await bannerGoster();
    gecisYukle();
  } catch (e) {
    console.warn('AdMob', e);
  }
}

async function bannerGoster() {
  const ad = admob();
  if (!ad || !durum.hazir || isPremium()) return;
  try {
    durum.bannerAcik = true;
    await ad.showBanner({ adId: durum.kimlik.banner, adSize: 'ADAPTIVE_BANNER', position: 'BOTTOM_CENTER', margin: 0 });
    durum.banner = true;
    if (durum.gizle.size) bannerGizliMi();
  } catch (e) { durum.bannerAcik = false; console.warn('AdMob banner', e); }
}

/** Banner'ı gizleme nedenleri: 'klavye', 'tamekran'. Hepsi kalkınca banner geri gelir. */
export function bannerGizle(neden, gizli) {
  if (gizli) durum.gizle.add(neden); else durum.gizle.delete(neden);
  bannerGizliMi();
}
function bannerGizliMi() {
  const ad = admob();
  if (!ad || !durum.banner) return;
  const gizli = durum.gizle.size > 0;
  if (gizli && durum.bannerAcik) { durum.bannerAcik = false; bannerPayi(0); ad.hideBanner().catch(() => {}); }
  else if (!gizli && !durum.bannerAcik) { durum.bannerAcik = true; ad.resumeBanner().catch(() => {}); }
}

async function gecisYukle() {
  const ad = admob();
  if (!ad || !durum.hazir || durum.yuklu || isPremium()) return;
  try { await ad.prepareInterstitial({ adId: durum.kimlik.gecis }); durum.yuklu = true; } catch (e) { durum.yuklu = false; }
}

/** Ölçüm, kamera, mikrofon, giriş sürerken çağrılır: mesgul('kamera', true) … mesgul('kamera', false). */
export function mesgul(neden, acik) { if (acik) durum.mesgul.add(neden); else durum.mesgul.delete(neden); }

/** Doğal durak: uygunsa geçiş reklamı. */
export function firsat(neden) {
  const ad = admob();
  if (!ad) return false;
  const simdi = Date.now();
  const kayit = kayitTemizle(SYS.reklam, simdi);
  const d = { reklamsiz: isPremium(), hazir: durum.hazir, yuklu: durum.yuklu, mesgul: durum.mesgul.size > 0, oturumBasi: durum.oturumBasi };
  if (!gecisUygunMu(d, kayit, simdi)) { if (d.hazir && !d.yuklu) gecisYukle(); return false; }
  kayit.son.push(simdi);
  SYS.reklam = kayit; saveSys();
  durum.yuklu = false;
  ad.showInterstitial().catch(() => gecisYukle());
  return neden || true;
}

/** Ekran değişti: araçta değilken meşgul bayrakları kalmaz (bir araç kapatmayı unutursa reklam sonsuza kilitlenmesin). */
export function ekranDegisti(ad, arac) {
  if (!arac) durum.mesgul.clear();
  bannerGizle('tamekran', false);
}

export function uygulamaDurumu(aktif) {
  if (!aktif) { durum.arkaPlan = Date.now(); return; }
  if (durum.arkaPlan && Date.now() - durum.arkaPlan > KURAL.yeniOturumDk * 60e3) durum.oturumBasi = Date.now();
  durum.arkaPlan = null;
}

/** Abonelik değişince: reklamsızsa banner kaldırılır. */
async function abonelikDegisti() {
  const ad = admob();
  if (!ad) return;
  if (isPremium()) {
    if (durum.banner) { try { await ad.removeBanner(); } catch (e) { /* yok */ } }
    durum.banner = false; durum.bannerAcik = false; bannerPayi(0);
  } else if (durum.hazir) {
    if (!durum.banner) bannerGoster();
    gecisYukle();
  } else {
    baslat();
  }
}
onPremiumChange(() => { abonelikDegisti(); });

export const gizlilikGerekli = () => durum.gizlilikGerekli;
export async function gizlilikSecenekleri() {
  const ad = admob();
  if (!ad) return;
  try { await ad.showPrivacyOptionsForm(); } catch (e) { console.warn('AdMob gizlilik', e); }
}

// Klavye açıkken banner gizlenir: giriş alanı odaklanınca ya da pencere belirgin biçimde kısalınca
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  let enYuksek = window.innerHeight;
  window.addEventListener('resize', () => {
    enYuksek = Math.max(enYuksek, window.innerHeight);
    bannerGizle('klavye', window.innerHeight < enYuksek - 150);
  });
  document.addEventListener('focusin', (e) => { if (e.target && e.target.matches && e.target.matches('input:not([type=checkbox]), textarea')) bannerGizle('klavye-odak', true); });
  document.addEventListener('focusout', () => bannerGizle('klavye-odak', false));
}
