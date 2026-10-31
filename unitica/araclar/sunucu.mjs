// Yerel denemeler için ortak parçalar (tarayici-dene.mjs, magaza-gorsel.mjs): www/'yi sunan küçük HTTP sunucusu, Chromium,
// sahte Capacitor eklentileri (AdMob, NativePurchases, App, SystemBars) ve yapay kullanıcı verisi. Ağa çıkılmaz.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
export const WWW = path.join(KOK, 'www');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';

const TUR = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.txt': 'text/plain' };

/** www/'yi 127.0.0.1'de sunar → { adres, kapat() } */
export function sunucuAc() {
  const s = http.createServer((q, r) => {
    const yol = decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html';
    const f = path.join(WWW, yol);
    if (!f.startsWith(WWW) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'content-type': TUR[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
    fs.createReadStream(f).pipe(r);
  }).listen(0, '127.0.0.1');
  return new Promise((ok) => s.on('listening', () => ok({ adres: `http://127.0.0.1:${s.address().port}/`, kapat: () => s.close() })));
}

export async function tarayici() {
  const { chromium } = await import(pathToFileURL(PW).href);
  return chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
}

const gun = 86400e3;
/** yapay ama gerçekçi kullanıcı verisi (geçmiş + favoriler), localStorage 'unitica.v1' biçiminde */
export function ornekDurum(lang, theme = 'light', simdi = Date.now()) {
  return {
    lang, theme, digits: 6, decimal: ['tr', 'de', 'fr', 'es', 'pt', 'it', 'ru'].includes(lang) ? ',' : '.', notation: 'auto',
    cat: 'pressure', value: '250', sel: { pressure: { f: 'kPa', t: 'kgf_cm2' }, flow: { f: 'm3_h', t: 'L_s' } },
    history: [
      { c: 'pressure', f: 'kPa', t: 'kgf_cm2', v: '250', r: 2.54929, at: simdi - 4 * 60e3 },
      { c: 'flow', f: 'm3_h', t: 'L_s', v: '360', r: 100, at: simdi - 42 * 60e3 },
      { c: 'unitWeight', f: 'kN_m3', t: 'tf_m3', v: '18.5', r: 1.88648, at: simdi - 3 * 3600e3 },
      { c: 'permeability', f: 'cm_s', t: 'm_day', v: '1e-4', r: 0.0864, at: simdi - gun - 2 * 3600e3 },
      { c: 'moment', f: 'kNm', t: 'tfm', v: '120', r: 12.2366, at: simdi - gun - 5 * 3600e3 },
      { c: 'length', f: 'ft', t: 'm', v: '328', r: 99.9744, at: simdi - 3 * gun },
      { c: 'energy', f: 'kWh', t: 'kcal', v: '15', r: 12898.4, at: simdi - 6 * gun },
    ],
    favorites: [
      { c: 'pressure', f: 'kPa', t: 'kgf_cm2', v: '100' },
      { c: 'flow', f: 'm3_h', t: 'L_s', v: '360' },
      { c: 'unitWeight', f: 'kN_m3', t: 'tf_m3' },
      { c: 'force', f: 'kN', t: 'tf', v: '50' },
      { c: 'temperature', f: 'C', t: 'F', v: '20' },
    ],
    member: null,
  };
}

/**
 * Sahte Capacitor (page.addInitScript ile, sayfanın kodundan önce). secenek:
 *   uye        mağazada etkin abonelik var mı (Google Play: adfree; App Store: <paket>.adfree.yearly)
 *   platform   'android' (varsayılan) | 'ios': iPhone'da ürünler dönem başına ayrıdır, satın alımda purchaseState yoktur
 *   att        iPhone izleme izninin durumu: 'notDetermined' (varsayılan) | 'authorized' | 'denied'
 *   onay       'tamam' (reklam istenebilir) | 'form' (AB: form gösterilir, kullanıcı reddeder → istenemez)
 *   gizlilik   UMP gizlilik seçenekleri girişi gerekli mi
 * Çağrılar window.__kayit'e sırasıyla yazılır.
 */
export function sahteYerel(secenek = {}) {
  return (s) => {
    const kayit = (window.__kayit = []);
    const dinleyiciler = {};
    const yay = (olay, veri) => (dinleyiciler[olay] || []).forEach((f) => f(veri));
    const cagri = (ad, sonuc) => async (arg) => {
      kayit.push({ ad, arg: arg === undefined ? null : JSON.parse(JSON.stringify(arg)) });
      return typeof sonuc === 'function' ? sonuc(arg) : sonuc;
    };
    const dinle = (eklenti) => (olay, f) => { kayit.push({ ad: `${eklenti}.addListener`, arg: olay }); (dinleyiciler[olay] ||= []).push(f); return Promise.resolve({ remove: async () => {} }); };
    window.__yay = yay;
    const onay = s.onay === 'form'
      ? { status: 'REQUIRED', isConsentFormAvailable: true, canRequestAds: false, privacyOptionsRequirementStatus: 'REQUIRED' }
      : { status: 'OBTAINED', isConsentFormAvailable: true, canRequestAds: true, privacyOptionsRequirementStatus: s.gizlilik ? 'REQUIRED' : 'NOT_REQUIRED' };
    const BANNER = 60;
    let uye = !!s.uye;
    const AdMob = {
      requestConsentInfo: cagri('requestConsentInfo', onay),
      showConsentForm: cagri('showConsentForm', onay),
      showPrivacyOptionsForm: cagri('showPrivacyOptionsForm'),
      initialize: cagri('initialize'),
      showBanner: cagri('showBanner', () => { setTimeout(() => { yay('bannerAdSizeChanged', { width: 390, height: BANNER }); yay('bannerAdLoaded', {}); }, 30); }),
      hideBanner: cagri('hideBanner', () => { yay('bannerAdSizeChanged', { width: 0, height: 0 }); }),
      resumeBanner: cagri('resumeBanner', () => { yay('bannerAdSizeChanged', { width: 390, height: BANNER }); }),
      removeBanner: cagri('removeBanner', () => { yay('bannerAdSizeChanged', { width: 0, height: 0 }); }),
      prepareInterstitial: cagri('prepareInterstitial', (a) => ({ adUnitId: a.adId })),
      showInterstitial: cagri('showInterstitial', () => { setTimeout(() => yay('interstitialAdDismissed', {}), 30); }),
      trackingAuthorizationStatus: cagri('trackingAuthorizationStatus', () => ({ status: att })),
      requestTrackingAuthorization: cagri('requestTrackingAuthorization', () => { att = 'denied'; }),
      addListener: dinle('AdMob'),
    };
    const ios = s.platform === 'ios';
    let att = s.att || 'notDetermined';
    const IOS = 'com.poyrazworkshop.unitica.adfree.';
    const urun = (plan, fiyat, tutar) => (ios
      ? { identifier: IOS + plan, priceString: fiyat, price: tutar, currencyCode: 'TRY', subscriptionGroupIdentifier: '21000000' }
      : { identifier: plan, planIdentifier: 'adfree', priceString: fiyat, price: tutar, currencyCode: 'TRY', offerToken: `tok-${plan}`, offerId: null });
    // StoreKit 2 işlemi (eklentinin TransactionHelpers.swift'i): isActive, expirationDate, subscriptionState; purchaseState yok
    const islem = () => (ios
      ? { productIdentifier: IOS + 'yearly', transactionId: '2000000123', isActive: true, expirationDate: '2027-10-31T10:00:00Z', subscriptionState: 'subscribed', willCancel: false }
      : { productIdentifier: 'adfree', purchaseState: '1', isAcknowledged: true });
    const NativePurchases = {
      isBillingSupported: cagri('isBillingSupported', { isBillingSupported: true }),
      getProducts: cagri('getProducts', { products: [urun('monthly', '₺39,99', 39.99), urun('yearly', '₺399,99', 399.99)] }),
      getPurchases: cagri('getPurchases', () => ({ purchases: uye ? [islem()] : [] })),
      purchaseProduct: cagri('purchaseProduct', () => { uye = true; return islem(); }),
      restorePurchases: cagri('restorePurchases'),
      manageSubscriptions: cagri('manageSubscriptions'),
    };
    const App = { addListener: dinle('App'), exitApp: cagri('exitApp') };
    const SystemBars = { setStyle: async () => {} };
    window.Capacitor = { DEBUG: false, isNativePlatform: () => true, getPlatform: () => (ios ? 'ios' : 'android'),
      Plugins: { AdMob, NativePurchases, App, SystemBars } };
  };
}
