// Calqora iPhone sürümü (sahte Capacitor, platform 'ios'; tarayıcısız). Ayrı süreç: native.js platformu yüklenirken okur.
// - Reklam: önce mağaza, sonra UMP, sonra izleme izni (ATT, yalnız hiç sorulmadıysa), sonra initialize; iPhone kimlikleri.
// - Abonelik: App Store ürünleri dönem başına (com.poyrazworkshop.calqora.adfree.monthly / .yearly), yalnız bu Apple hesabının
//   geçerli hakları, iade ve süre dolumu hak vermez, ödeme ek süresinde üyelik sürer; "Yönet" Apple'ın sayfası.
// - Metinler: iPhone'da Google Play yerine App Store ve Apple'ın yenileme koşulları (t() ".ios" ikizini seçer).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sahteOrtam } from './yardimci.mjs';

const ortam = sahteOrtam({ uye: false, platform: 'ios' });
const native = await import('../www/js/native.js');
const billing = await import('../www/js/billing.js');
const premium = await import('../www/js/premium.js');
const i18n = await import('../www/js/i18n.js');
const { REKLAM_KIMLIK } = await import('../www/js/reklam-kimlik.js');
const { IOS } = await import('../www/js/config.js');
const Y = 'com.poyrazworkshop.calqora.adfree.yearly';

test('platform: Capacitor getPlatform', () => {
  assert.equal(native.platform, 'ios');
  assert.equal(native.isIOS, true);
});

test('reklam: mağaza → UMP → ATT → initialize; iPhone kimlikleri', async () => {
  await premium.refresh();
  await ortam.bekle();
  const sira = ortam.cagri.map((c) => c.ad);
  const gp = ortam.cagri.find((c) => c.ad === 'getPurchases').arg;
  assert.deepEqual(gp, { productType: 'subs', onlyCurrentEntitlements: true }, 'yalnız bu Apple hesabının geçerli hakları');
  assert.ok(sira.indexOf('getPurchases') < sira.indexOf('requestConsentInfo'));
  assert.ok(sira.indexOf('requestConsentInfo') < sira.indexOf('trackingAuthorizationStatus'), 'önce UMP');
  assert.ok(sira.indexOf('trackingAuthorizationStatus') < sira.indexOf('requestTrackingAuthorization'));
  assert.ok(sira.indexOf('requestTrackingAuthorization') < sira.indexOf('initialize'), 'ATT initialize\'dan önce');
  assert.equal(ortam.cagri.find((c) => c.ad === 'showBanner').arg.adId, REKLAM_KIMLIK.ios.banner);
  assert.equal(ortam.cagri.find((c) => c.ad === 'prepareInterstitial').arg.adId, REKLAM_KIMLIK.ios.gecis);
  assert.notEqual(REKLAM_KIMLIK.ios.banner, REKLAM_KIMLIK.android.banner);
});

test('abonelik: App Store fiyatları dönem ürünlerinden; satın alma ürün kimliğiyle, temel plan yok', async () => {
  const plans = await billing.getPlans();
  assert.deepEqual(ortam.cagri.find((c) => c.ad === 'getProducts').arg.productIdentifiers, [IOS.products.monthly, IOS.products.yearly]);
  assert.deepEqual(plans, { monthly: { priceString: '49,99 TL', amount: 49.99 }, yearly: { priceString: '449,99 TL', amount: 449.99 } });
  assert.equal(await premium.subscribe('yearly'), 'ok');
  const al = ortam.cagri.find((c) => c.ad === 'purchaseProduct').arg;
  assert.deepEqual(al, { productIdentifier: Y, productType: 'subs', quantity: 1 });
  assert.ok(premium.isPremium());
  assert.ok(ortam.cagri.some((c) => c.ad === 'removeBanner'), 'üye olunca banner kalkar');
  await premium.manage();
  assert.ok(ortam.cagri.some((c) => c.ad === 'manageSubscriptions'), 'Apple\'ın abonelik sayfası');
});

test('hak: geçerli işlem, iade, süre dolumu, ödeme ek süresi; plan App Store ürününden', () => {
  const y = { productIdentifier: Y, isActive: true, expirationDate: '2027-10-31T10:00:00Z', subscriptionState: 'subscribed' };
  assert.equal(premium.entitled([y]), true);
  assert.equal(premium.activePlan([y]), 'yearly');
  assert.equal(premium.activePlan([{ ...y, productIdentifier: IOS.products.monthly }]), 'monthly');
  assert.equal(premium.entitled([{ ...y, isActive: false, subscriptionState: 'expired' }]), false);
  assert.equal(premium.entitled([{ ...y, revocationDate: '2026-11-02T09:00:00Z' }]), false);
  assert.equal(premium.entitled([{ ...y, isActive: false, subscriptionState: 'inGracePeriod' }]), true);
  assert.equal(premium.entitled([{ ...y, productIdentifier: 'com.poyrazworkshop.calqora.baska' }]), false);
  assert.equal(premium.activePlan([{ productIdentifier: 'adfree', purchaseState: '1' }]), null, 'Play temel planı söylemez');
  // iPhone ret iletileri (NativePurchasesPlugin+PurchaseHandling.swift)
  assert.equal(billing.purchaseError(new Error('User cancelled')), 'cancelled');
  assert.equal(billing.purchaseError(new Error('Transaction pending')), 'pending');
});

test('metinler: iPhone\'da App Store ve Apple\'ın koşulları; ikizi olmayan anahtar olduğu gibi', async () => {
  for (const d of ['tr', 'en', 'de', 'ar']) {
    await i18n.loadLang(d);
    for (const k of ['p.b3', 'p.unavailable', 'p.terms', 'p.noPrices']) assert.doesNotMatch(i18n.t(k), /Google[ -]?Play/, `${d} ${k}`);
    assert.match(i18n.t('p.terms'), /Apple/);
    assert.match(i18n.t('p.terms'), /24/);
  }
  await i18n.loadLang('en');
  assert.equal(i18n.t('p.eula'), 'Terms of Use (EULA)');
  assert.equal(i18n.t('p.monthly'), 'Monthly', 'ikizi olmayan anahtar');
  assert.equal(IOS.eulaUrl, 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/');
  assert.equal(IOS.manageUrl, 'https://apps.apple.com/account/subscriptions');
});

test('ATT yalnız hiç sorulmadıysa sorulur (izin verilmiş ya da reddedilmişse yeniden sorulmaz)', async () => {
  const fs = await import('node:fs');
  const js = fs.readFileSync(new URL('../www/js/reklam.js', import.meta.url), 'utf8');
  assert.match(js, /if \(status === 'notDetermined'\) await ad\.requestTrackingAuthorization\(\)/);
  assert.equal(ortam.cagri.filter((c) => c.ad === 'requestTrackingAuthorization').length, 1, 'bir oturumda bir kez');
});
