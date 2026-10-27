// Kıble Bul araçlarının ortak parçaları (tarayici-dene.mjs, magaza-gorsel.mjs): www/ için küçük bir durağan sunucu,
// NASA GIBS uydu karolarının yerel önbelleği ve Android uygulamasındaki Capacitor eklentilerinin taklidi.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const KB = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
export const WWW = path.join(KB, 'www');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
export const playwright = () => import(pathToFileURL(PW).href);
export const CHROMIUM = process.env.CHROMIUM || '/opt/pw-browsers/chromium';

const TUR = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml' };

/** www/'yi sunan sunucu → Promise<{ adres, kapat }> */
export async function sunucuAc() {
  const s = http.createServer((q, r) => {
    const f = path.join(WWW, decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html');
    if (!f.startsWith(WWW) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'content-type': TUR[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(r);
  });
  await new Promise((ok) => s.listen(0, '127.0.0.1', ok));
  return { adres: `http://127.0.0.1:${s.address().port}/index.html`, kapat: () => s.close() };
}

/**
 * NASA GIBS karoları: uygulamanın istediği adres aynen curl ile (makinenin vekil sunucusu ve sertifika deposuyla)
 * indirilir ve önbelleğe yazılır; ağ yoksa ya da kapalıysa (KARO=0) istek düşer ve harita çevrimdışı görünümüne geçer.
 */
export function karoYolu(baglam, onbellek) {
  return baglam.route(/^https:\/\/gibs\.earthdata\.nasa\.gov\//, async (r) => {
    if (process.env.KARO === '0') return r.abort();
    const url = r.request().url();
    const ad = url.replace(/^https:\/\//, '').replace(/[^A-Za-z0-9.]+/g, '_');
    const f = path.join(onbellek, ad);
    try {
      if (!fs.existsSync(f)) {
        fs.mkdirSync(onbellek, { recursive: true });
        execFileSync('curl', ['-sSf', '--max-time', '20', '-o', f, url]);
      }
      await r.fulfill({ status: 200, contentType: 'image/jpeg', body: fs.readFileSync(f) });
    } catch (e) { try { fs.rmSync(f, { force: true }); } catch (x) { /* yok */ } await r.abort(); }
  });
}

/**
 * Android uygulamasındaki Capacitor'ın taklidi (sayfaya addInitScript ile verilir). AdMob sahte: çağrıları
 * window.__admob'a yazar, banner "yüklenince" 50 px yükseklik bildirir. Konum İstanbul (yaklaşık), pusula yok.
 * o.banner: banner yüksekliği (0: banner hiç gelmez), o.uye: reklamsız üye.
 */
export function yerelTaklit(o = {}) {
  const kayit = [];
  window.__admob = kayit;
  const dinleyici = {};
  const bannerH = o.banner === undefined ? 50 : o.banner;
  const yay = (olay, veri) => (dinleyici[olay] || []).forEach((f) => f(veri));
  const cagri = (ad, sonuc, sonra) => async (arg) => {
    kayit.push({ ad, arg: arg === undefined ? null : JSON.parse(JSON.stringify(arg)) });
    if (sonra) setTimeout(sonra, 60);
    return typeof sonuc === 'function' ? sonuc(arg) : sonuc;
  };
  const onay = { status: 'NOT_REQUIRED', isConsentFormAvailable: false, canRequestAds: true, privacyOptionsRequirementStatus: o.gizlilik ? 'REQUIRED' : 'NOT_REQUIRED' };
  const dinle = async (olay, f) => { (dinleyici[olay] = dinleyici[olay] || []).push(f); return { remove: async () => {} }; };
  const yok = async () => ({});
  const P = {
    AdMob: {
      requestConsentInfo: cagri('requestConsentInfo', onay), showConsentForm: cagri('showConsentForm', onay),
      initialize: cagri('initialize'), addListener: dinle,
      showBanner: cagri('showBanner', undefined, () => bannerH && yay('bannerAdSizeChanged', { width: 360, height: bannerH })),
      hideBanner: cagri('hideBanner', undefined, () => yay('bannerAdSizeChanged', { width: 0, height: 0 })),
      resumeBanner: cagri('resumeBanner', undefined, () => bannerH && yay('bannerAdSizeChanged', { width: 360, height: bannerH })),
      removeBanner: cagri('removeBanner', undefined, () => yay('bannerAdSizeChanged', { width: 0, height: 0 })),
      prepareInterstitial: cagri('prepareInterstitial'),
      showInterstitial: cagri('showInterstitial', undefined, () => { yay('interstitialAdShowed', {}); setTimeout(() => yay('interstitialAdDismissed', {}), 300); }),
      showPrivacyOptionsForm: cagri('showPrivacyOptionsForm'),
    },
    KibleYerel: { bilgi: async () => ({ hataAyiklama: true, surum: '1.1.0' }), abonelikleriYonet: cagri('abonelikleriYonet') },
    Compass: { start: async () => ({ available: false }), stop: yok, addListener: dinle },
    Geolocation: { getCurrentPosition: async () => ({ coords: { latitude: 40.7654, longitude: 29.9408, accuracy: 2000 } }) },
    App: { addListener: dinle, exitApp: () => {} },
    SystemBars: { setStyle: yok },
    Browser: { open: yok },
    Haptics: { vibrate: yok },
    NativePurchases: {
      isBillingSupported: async () => ({ isBillingSupported: true }),
      getProducts: async () => ({ products: [
        { identifier: 'monthly', priceString: '₺39,99', price: 39.99, offerToken: 'a' },
        { identifier: 'yearly', priceString: '₺399,99', price: 399.99, offerToken: 'b' }] }),
      getPurchases: async () => ({ purchases: o.uye ? [{ productIdentifier: 'adfree', purchaseState: '1' }] : [] }),
      purchaseProduct: async () => ({ purchaseState: '1' }), restorePurchases: yok, manageSubscriptions: yok,
    },
  };
  window.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'android', Plugins: P, registerPlugin: (ad) => P[ad] };
}
