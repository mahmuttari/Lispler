// Reklamsız abonelik: ürün ve plan kimlikleri Play Console'dakilerle (magaza/fiyatlandirma.md) aynı, fiyat kodda değil.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
const B = await import('../www/js/billing.js');

test('ürün adfree, temel planlar monthly ve yearly; yönetim adresi uygulamanın paketiyle', () => {
  assert.equal(B.SUBSCRIPTION.productId, 'adfree');
  assert.deepEqual(B.SUBSCRIPTION.plans, ['monthly', 'yearly']);
  assert.equal(B.PACKAGE, 'com.poyrazworkshop.smartmeasure');
  assert.equal(B.MANAGE_URL, 'https://play.google.com/store/account/subscriptions?sku=adfree&package=com.poyrazworkshop.smartmeasure');
  const cap = JSON.parse(fs.readFileSync(path.join(KOK, 'capacitor.config.json'), 'utf8'));
  assert.equal(cap.appId, B.PACKAGE);
  const f = fs.readFileSync(path.join(KOK, 'magaza', 'fiyatlandirma.md'), 'utf8');
  for (const k of ['`adfree`', '`monthly`', '`yearly`']) assert.ok(f.includes(k), `fiyatlandirma.md: ${k}`);
});

test('mağaza ürünlerinden temel planlar; teklifsiz giriş öne alınır', () => {
  const p = B.plansFrom([
    { identifier: 'yearly', priceString: '₺199,99', price: 199.99, offerToken: 'tanitim', offerId: 'deneme' },
    { identifier: 'yearly', priceString: '₺249,99', price: 249.99, offerToken: 'temel', offerId: null },
    { identifier: 'monthly', priceString: '₺24,99', price: 24.99, offerToken: 'ay' },
    { identifier: 'baska', priceString: 'x', price: 1 },
  ]);
  assert.deepEqual(Object.keys(p).sort(), ['monthly', 'yearly']);
  assert.equal(p.yearly.offerToken, 'temel');
  assert.equal(p.monthly.priceString, '₺24,99');
  assert.equal(B.plansFrom([]), null);
});

test('abonelik yalnız satın alınmış (purchaseState 1) ve etkin adfree ile', () => {
  assert.equal(B.entitled([{ productIdentifier: 'adfree', purchaseState: '1' }]), true);
  assert.equal(B.entitled([{ productIdentifier: 'adfree', purchaseState: '0' }]), false);
  assert.equal(B.entitled([{ productIdentifier: 'adfree', purchaseState: '1', isActive: false }]), false);
  assert.equal(B.entitled([{ productIdentifier: 'baska', purchaseState: '1' }]), false);
  assert.equal(B.entitled([]), false);
});

test('reddedilen satın alma: iptal, bekleyen ödeme (Android ve iPhone iletileri), hata', () => {
  const e = B.purchaseError;
  assert.equal(e(Object.assign(new Error('Purchase is not purchased'), { code: 'USER_CANCELED' })), 'cancelled');
  assert.equal(e(new Error('Purchase is pending')), 'pending', 'Android bekleyen ödeme');
  assert.equal(e(Object.assign(new Error('x'), { code: 'PURCHASE_STATE_2' })), 'pending');
  assert.equal(e(new Error('User cancelled')), 'cancelled', 'iPhone');
  assert.equal(e(new Error('Transaction pending')), 'pending', 'iPhone: Ask to Buy');
  assert.equal(e(new Error('Product not found')), 'failed');
  assert.equal(e(null), 'failed');
});

test('App Store: dönem başına ürün; hak geçerli, iade edilmemiş işlemde ya da ödeme ek süresinde', () => {
  assert.deepEqual(B.IOS_PRODUCTS, { monthly: 'com.poyrazworkshop.smartmeasure.adfree.monthly', yearly: 'com.poyrazworkshop.smartmeasure.adfree.yearly' });
  assert.equal(B.MANAGE_URL_IOS, 'https://apps.apple.com/account/subscriptions');
  assert.equal(B.EULA_URL, 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/');
  const y = { productIdentifier: B.IOS_PRODUCTS.yearly, isActive: true, expirationDate: '2027-10-31T10:00:00Z', subscriptionState: 'subscribed' };
  assert.equal(B.entitled([y]), true);
  assert.equal(B.activePlan([y]), 'yearly');
  assert.equal(B.entitled([{ ...y, isActive: false, subscriptionState: 'expired' }]), false);
  assert.equal(B.entitled([{ ...y, revocationDate: '2026-11-02T09:00:00Z' }]), false);
  assert.equal(B.entitled([{ ...y, isActive: false, subscriptionState: 'inGracePeriod' }]), true);
  assert.equal(B.activePlan([{ productIdentifier: 'adfree', purchaseState: '1' }]), null);
  const p = B.plansFromIos([{ identifier: B.IOS_PRODUCTS.monthly, priceString: '₺24,99', price: 24.99 },
    { identifier: B.IOS_PRODUCTS.yearly, priceString: '₺249,99', price: 249.99 }, { identifier: 'baska', priceString: 'x', price: 1 }]);
  assert.deepEqual(p, { monthly: { priceString: '₺24,99', amount: 24.99 }, yearly: { priceString: '₺249,99', amount: 249.99 } });
  const b = fs.readFileSync(path.join(KOK, 'www', 'js', 'billing.js'), 'utf8');
  assert.match(b, /onlyCurrentEntitlements: true/);
});

test('fiyat yalnız tarayıcı taklidinde: uygulamanın sayfaları fiyat yazmaz', () => {
  const dosyalar = ['views/premium.js', 'lang/en.js', 'lang/tr.js', 'premium.js'];
  for (const d of dosyalar) {
    const s = fs.readFileSync(path.join(KOK, 'www', 'js', d), 'utf8');
    assert.ok(!/[$€₺]\s?\d|\d\s?(TL|USD)\b/.test(s), `${d} içinde fiyat var`);
  }
});
