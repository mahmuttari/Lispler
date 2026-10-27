// Kıble Bul — reklamsız üyelik (Google Play aboneliği, @capgo/native-purchases 8.9.6) — tarayıcı gerekmez.
// Sahte NativePurchases eklentisi window.Capacitor olarak verilir; eklentinin gerçek ret biçimi: mesaj
// "Purchase is not purchased", kod Play Billing yanıtının adı (USER_CANCELED, ITEM_ALREADY_OWNED…); bekleyen ödeme
// "Purchase is pending" (NativePurchasesPlugin.java › onPurchasesUpdated, handlePurchase).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const KB = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const oku = (...p) => fs.readFileSync(path.join(KB, ...p), 'utf8');

let sonraki = null;            // purchaseProduct'ın bir sonraki sonucu: { ok } ya da { hata }
let sahip = [];                // getPurchases'ın döndürdüğü satın almalar
const cagrilar = [];
const ret = (message, code) => Object.assign(new Error(message), code ? { code } : {});
const NativePurchases = {
  isBillingSupported: async () => ({ isBillingSupported: true }),
  getProducts: async (a) => { cagrilar.push(['getProducts', a]); return { products: [
    { identifier: 'monthly', priceString: '₺39,99', price: 39.99, offerToken: 'om' },
    { identifier: 'yearly', priceString: '₺399,99', price: 399.99, offerToken: 'oy' },
    { identifier: 'weekly', priceString: 'x', price: 1 }] }; },
  getPurchases: async (a) => { cagrilar.push(['getPurchases', a]); return { purchases: sahip }; },
  purchaseProduct: async (a) => { cagrilar.push(['purchaseProduct', a]); const s = sonraki; sonraki = null; if (s.hata) throw s.hata; return s.ok; },
  restorePurchases: async () => { cagrilar.push(['restorePurchases']); return {}; },
  manageSubscriptions: async () => { cagrilar.push(['manageSubscriptions']); return {}; },
};
const KibleYerel = { abonelikleriYonet: async (a) => { cagrilar.push(['abonelikleriYonet', a]); return {}; } };
globalThis.window = { Capacitor: { isNativePlatform: () => true, Plugins: { NativePurchases, KibleYerel }, registerPlugin: (n) => ({ NativePurchases, KibleYerel })[n] } };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const B = await import('../www/js/billing.js');
const P = await import('../www/js/premium.js');
const { SUBSCRIPTION } = await import('../www/js/config.js');

test('ürün: tek abonelik "adfree", temel planlar "monthly" ve "yearly"; yedek fiyatlar yalnız tarayıcı taklidinde', () => {
  assert.equal(SUBSCRIPTION.productId, 'adfree');
  assert.deepEqual(SUBSCRIPTION.plans, ['monthly', 'yearly']);
  assert.deepEqual(SUBSCRIPTION.fallbackPrice, { monthly: '$0.99', yearly: '$9.99' });
  const ui = oku('www', 'js', 'ui-premium.js');
  assert.match(ui, /isNative \? '—' : SUBSCRIPTION\.fallbackPrice\[plan\]/, 'uygulamada fiyat yalnız mağazadan');
  assert.match(ui, /isNative && !fromStore\(selected\)/, 'mağaza fiyatı yoksa satın alma düğmesi kapalı');
});

test('fiyatlar mağazadan: getProducts(adfree, subs), planlar temel plan kimliğiyle eşlenir', async () => {
  const p = await B.getPlans();
  assert.deepEqual(cagrilar.at(-1), ['getProducts', { productIdentifiers: ['adfree'], productType: 'subs' }]);
  assert.deepEqual(p, { monthly: { priceString: '₺39,99', amount: 39.99, offerToken: 'om' }, yearly: { priceString: '₺399,99', amount: 399.99, offerToken: 'oy' } });
  assert.equal(P.savePercent(39.99, 399.99), 17);
  assert.equal(P.savePercent(0.99, 9.99), 16);
});

test('eklentinin ret biçimi doğru okunur: önce kod, sonra mesaj (1.0.1 iptali "başarısız" sayıyordu)', () => {
  assert.equal(B.purchaseError(ret('Purchase is not purchased', 'USER_CANCELED')), 'cancelled');
  assert.equal(B.purchaseError(ret('Purchase is not purchased', 'ITEM_ALREADY_OWNED')), 'owned');
  assert.equal(B.purchaseError(ret('Purchase is pending')), 'pending');
  assert.equal(B.purchaseError(ret('Purchase is not purchased', 'PURCHASE_STATE_2')), 'pending');
  assert.equal(B.purchaseError(ret('Purchase is not purchased', 'BILLING_UNAVAILABLE')), 'failed');
  assert.equal(B.purchaseError(ret('Purchase is not purchased', 'DEVELOPER_ERROR')), 'failed');
  assert.equal(B.purchaseError(ret('User cancelled')), 'cancelled');
  assert.equal(B.purchaseError(undefined), 'failed');
});

test('satın alma: PURCHASED (1) üyeliği açar; durum 0 "bekliyor" sayılmaz (Play Billing\'de bekleyen 2); iptal üyeliği açmaz', async () => {
  sonraki = { hata: ret('Purchase is not purchased', 'USER_CANCELED') };
  assert.equal(await P.subscribe('yearly', 'oy'), 'cancelled');
  assert.equal(P.isPremium(), false);
  assert.deepEqual(cagrilar.at(-1)[1], { productIdentifier: 'adfree', planIdentifier: 'yearly', productType: 'subs', offerToken: 'oy', quantity: 1 });
  sonraki = { ok: { purchaseState: '2' } };
  assert.equal(await B.purchase('monthly', 'om'), 'pending');
  sonraki = { ok: { purchaseState: '0' } };
  assert.equal(await B.purchase('monthly', 'om'), 'ok', "'0' (UNSPECIFIED) bekleyen değildir; eklenti yalnız PURCHASED'ı çözer");
  sonraki = { ok: { purchaseState: '1', productIdentifier: 'adfree' } };
  assert.equal(await P.subscribe('monthly', 'om'), 'ok');
  assert.equal(P.isPremium(), true);
});

test('zaten sahip (ITEM_ALREADY_OWNED): geri yükleme denenir, abonelik varsa üyelik açılır', async () => {
  sahip = [{ productIdentifier: 'adfree', purchaseState: '1' }];
  sonraki = { hata: ret('Purchase is not purchased', 'ITEM_ALREADY_OWNED') };
  assert.equal(await P.subscribe('yearly', 'oy'), 'ok');
  assert.ok(cagrilar.some((c) => c[0] === 'restorePurchases'));
  assert.equal(P.isPremium(), true);
});

test('hak: yalnız adfree ve PURCHASED; mağaza "yok" deyince üyelik kapanır, cevap gelmezse kalır', async () => {
  assert.equal(P.entitled([{ productIdentifier: 'adfree', purchaseState: '1' }]), true);
  assert.equal(P.entitled([{ productIdentifier: 'adfree', purchaseState: '2' }]), false, 'bekleyen ödeme');
  assert.equal(P.entitled([{ productIdentifier: 'adfree', purchaseState: '0' }]), false);
  assert.equal(P.entitled([{ productIdentifier: 'baska', purchaseState: '1' }]), false);
  sahip = [];
  await P.refresh();
  assert.equal(P.isPremium(), false);
});

test('ödemesi sonradan tamamlanan (onaylanmamış) satın alma açılışta onaylanır: geri yükleme çağrılır', async () => {
  const once = cagrilar.filter((c) => c[0] === 'restorePurchases').length;
  sahip = [{ productIdentifier: 'adfree', purchaseState: '1', isAcknowledged: false }];
  await P.refresh();
  assert.equal(cagrilar.filter((c) => c[0] === 'restorePurchases').length, once + 1);
  assert.equal(P.isPremium(), true);
  sahip = [{ productIdentifier: 'adfree', purchaseState: '1', isAcknowledged: true }];
  await P.refresh();
  assert.equal(cagrilar.filter((c) => c[0] === 'restorePurchases').length, once + 1, 'onaylanmış olan için yeniden çağrılmaz');
});

test('"Aboneliği yönet": Play\'in bu ürüne ait sayfası (sku=adfree&package=…), yerel eklentiyle', async () => {
  assert.equal(await B.manage(), true);
  assert.deepEqual(cagrilar.at(-1), ['abonelikleriYonet', { sku: 'adfree' }]);
  const java = oku('android', 'app', 'src', 'main', 'java', 'com', 'poyrazworkshop', 'kiblebul', 'KibleYerelPlugin.java');
  assert.match(java, /"https:\/\/play\.google\.com\/store\/account\/subscriptions\?"/);
  assert.match(java, /"sku=" \+ Uri\.encode\(sku\) \+ "&"/);
  assert.match(java, /"package=" \+ Uri\.encode\(paket\)/);
  assert.match(java, /Intent\.ACTION_VIEW/);
});
