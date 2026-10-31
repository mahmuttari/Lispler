// Ölçü Kutusu iPhone sürümü: reklam başlatma sırası (UMP → ATT → initialize), iPhone reklam kimlikleri, App Store
// satın alması ve metinler. Ayrı süreç: native.js platformu yüklenirken okur. Sahte eklentiler window.Capacitor'da.
import assert from 'node:assert/strict';
import { test } from 'node:test';

const kayit = [];
let att = 'notDetermined';
const cagri = (ad, sonuc) => async (arg) => { kayit.push({ ad, arg: arg ?? null }); return typeof sonuc === 'function' ? sonuc() : sonuc; };
const onay = { status: 'NOT_REQUIRED', isConsentFormAvailable: false, canRequestAds: true, privacyOptionsRequirementStatus: 'NOT_REQUIRED' };
const IOS = 'com.poyrazworkshop.smartmeasure.adfree.';
const islem = { productIdentifier: IOS + 'yearly', isActive: true, expirationDate: '2027-10-31T10:00:00Z', subscriptionState: 'subscribed' };
const AdMob = {
  requestConsentInfo: cagri('requestConsentInfo', onay), showConsentForm: cagri('showConsentForm', onay), initialize: cagri('initialize'),
  showBanner: cagri('showBanner'), hideBanner: cagri('hideBanner'), resumeBanner: cagri('resumeBanner'), removeBanner: cagri('removeBanner'),
  prepareInterstitial: cagri('prepareInterstitial'), showInterstitial: cagri('showInterstitial'),
  trackingAuthorizationStatus: cagri('trackingAuthorizationStatus', () => ({ status: att })),
  requestTrackingAuthorization: cagri('requestTrackingAuthorization', () => { att = 'denied'; }),
  addListener: () => Promise.resolve({ remove: async () => {} }),
};
const NativePurchases = {
  getProducts: cagri('getProducts', { products: [{ identifier: IOS + 'monthly', priceString: '₺24,99', price: 24.99 }, { identifier: IOS + 'yearly', priceString: '₺249,99', price: 249.99 }] }),
  getPurchases: cagri('getPurchases', { purchases: [] }),
  purchaseProduct: cagri('purchaseProduct', islem),
  restorePurchases: cagri('restorePurchases'),
  manageSubscriptions: cagri('manageSubscriptions'),
};
const mem = new Map();
globalThis.localStorage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
globalThis.window = { innerHeight: 800, addEventListener() {},
  Capacitor: { isNativePlatform: () => true, getPlatform: () => 'ios',
    // Olcer (Swift eklentisi) bilgi(): hata ayıklama derlemesi değil
    Plugins: { AdMob, NativePurchases, Olcer: { bilgi: async () => ({ debug: false, versionName: '1.0.0', versionCode: 1 }) } } } };
globalThis.document = { documentElement: { style: { setProperty() {} }, lang: 'en' }, dispatchEvent() {}, addEventListener() {} };

const native = await import('../www/js/native.js');
const R = await import('../www/js/reklam.js');
const B = await import('../www/js/billing.js');
const P = await import('../www/js/premium.js');
const i18n = await import('../www/js/i18n.js');
const { REKLAM_KIMLIK } = await import('../www/js/reklam-kimlik.js');

test('platform iOS', () => { assert.equal(native.platform, 'ios'); assert.equal(native.isIOS, true); });

test('reklam: UMP → ATT (yalnız hiç sorulmadıysa) → initialize; iPhone kimlikleri', async () => {
  await R.baslat();
  await new Promise((r) => setTimeout(r, 10));
  const a = kayit.map((c) => c.ad);
  assert.ok(a.indexOf('requestConsentInfo') < a.indexOf('trackingAuthorizationStatus'));
  assert.ok(a.indexOf('trackingAuthorizationStatus') < a.indexOf('requestTrackingAuthorization'));
  assert.ok(a.indexOf('requestTrackingAuthorization') < a.indexOf('initialize'));
  assert.equal(kayit.find((c) => c.ad === 'showBanner').arg.adId, REKLAM_KIMLIK.ios.banner);
  assert.equal(kayit.find((c) => c.ad === 'prepareInterstitial').arg.adId, REKLAM_KIMLIK.ios.gecis);
  assert.notEqual(REKLAM_KIMLIK.ios.banner, REKLAM_KIMLIK.android.banner);
});

test('abonelik: App Store ürünleri, yalnız geçerli haklar, satın alma ürün kimliğiyle; "Yönet" Apple\'ın sayfası', async () => {
  assert.deepEqual(await B.getPlans(), { monthly: { priceString: '₺24,99', amount: 24.99 }, yearly: { priceString: '₺249,99', amount: 249.99 } });
  assert.deepEqual(kayit.find((c) => c.ad === 'getProducts').arg.productIdentifiers, [IOS + 'monthly', IOS + 'yearly']);
  await P.refresh();
  assert.deepEqual(kayit.find((c) => c.ad === 'getPurchases').arg, { productType: 'subs', onlyCurrentEntitlements: true });
  assert.equal(P.isPremium(), false);
  assert.equal(await P.subscribe('yearly'), 'ok');
  assert.deepEqual(kayit.find((c) => c.ad === 'purchaseProduct').arg, { productIdentifier: IOS + 'yearly', productType: 'subs', quantity: 1 });
  assert.equal(P.isPremium(), true);
  NativePurchases.getPurchases = cagri('getPurchases', { purchases: [islem] });
  await P.refresh();
  assert.equal(P.plan(), 'yearly');
  P.manage();
  await new Promise((r) => setTimeout(r, 0));
  assert.ok(kayit.some((c) => c.ad === 'manageSubscriptions'));
});

test('metinler: iPhone\'da App Store ve Apple\'ın koşulları (tr ve en)', () => {
  for (const d of ['tr', 'en']) {
    i18n.setLang(d);
    for (const k of ['pr_loading', 'pr_none', 'pr_pending', 'pr_terms', 'pr_unavailable']) assert.doesNotMatch(i18n.t(k), /Google[ -]?Play/, `${d} ${k}`);
    assert.match(i18n.t('pr_terms'), /24/);
    assert.match(i18n.t('pr_none'), /Apple/);
  }
  assert.equal(i18n.t('pr_monthly'), 'Monthly', 'ikizi olmayan anahtar olduğu gibi');
  assert.doesNotMatch(i18n.t('st_licenses_text'), /AndroidX|Google Play/, 'lisanslar: iPhone\'da AndroidX ve Play Faturalandırma yok');
});
