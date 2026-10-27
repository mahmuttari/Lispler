// Google Play Faturalandırma (@capgo/native-purchases). Tek abonelik ürünü "adfree", iki temel plan "monthly" ve
// "yearly". Fiyatlar her zaman mağazadan gelir (priceString); aşağıdaki yedek fiyatlar yalnız masaüstü tarayıcı
// taklidinde görünür. Uygulamanın dışında (tarayıcı) küçük bir taklit vardır: abonelik localStorage'da bir bayraktır,
// ?billing=off Google Play yokmuş gibi davranır. Hiçbir işlev çağırana hata fırlatmaz.
import { plugin, isNative } from './native.js';

export const PACKAGE = 'com.poyrazworkshop.smartmeasure';
export const SUBSCRIPTION = {
  productId: 'adfree',
  plans: ['monthly', 'yearly'],
  fallbackPrice: { monthly: '$0.99', yearly: '$9.99' }, // yalnız tarayıcı taklidi; uygulamada Play'in fiyatı
};
export const MANAGE_URL = `https://play.google.com/store/account/subscriptions?sku=${SUBSCRIPTION.productId}&package=${PACKAGE}`;

const SUBS = 'subs';
const mockKey = 'smartmeasure.mock-subscription';
const mockOff = () => { try { return /[?&]billing=off\b/.test(location.search); } catch (e) { return false; } };
const mockGet = () => { try { return localStorage.getItem(mockKey) || ''; } catch (e) { return ''; } };
const mockSet = (v) => { try { if (v) localStorage.setItem(mockKey, v); else localStorage.removeItem(mockKey); } catch (e) { /* yok */ } };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const np = () => plugin('NativePurchases');

/** → { monthly: {priceString, amount, offerToken}, yearly: {...} } ya da null (mağazaya ulaşılamadı). */
export async function getPlans() {
  if (!isNative) {
    await wait(200);
    return mockOff() ? null : { monthly: { priceString: SUBSCRIPTION.fallbackPrice.monthly, amount: 0.99 }, yearly: { priceString: SUBSCRIPTION.fallbackPrice.yearly, amount: 9.99 } };
  }
  try {
    const { products } = await np().getProducts({ productIdentifiers: [SUBSCRIPTION.productId], productType: SUBS });
    return plansFrom(products);
  } catch (e) { return null; }
}

/** Ürün listesinden temel planlar: Android'de abonelik "identifier"ı temel plan kimliğidir; teklifsiz giriş öne alınır. */
export function plansFrom(products) {
  const out = {};
  for (const p of products || []) {
    const plan = SUBSCRIPTION.plans.includes(p.identifier) ? p.identifier : null;
    if (!plan) continue;
    if (!out[plan] || (out[plan].offerId && !p.offerId)) out[plan] = { priceString: p.priceString, amount: p.price, offerToken: p.offerToken, offerId: p.offerId || null };
  }
  return Object.keys(out).length ? out : null;
}

/** → { ok: true, purchases } mağaza yanıt verdi · { ok: false } soramadık */
export async function ownedPurchases() {
  if (!isNative) return mockOff() ? { ok: false } : { ok: true, purchases: mockGet() ? [{ productIdentifier: SUBSCRIPTION.productId, purchaseState: '1' }] : [] };
  try {
    const { purchases } = await np().getPurchases({ productType: SUBS });
    return { ok: true, purchases: purchases || [] };
  } catch (e) { return { ok: false }; }
}

/** Satın alınmış (purchaseState "1") ve etkin "adfree" var mı? */
export function entitled(purchases) {
  return (purchases || []).some((p) => p.productIdentifier === SUBSCRIPTION.productId
    && (p.purchaseState === undefined || p.purchaseState === null || String(p.purchaseState) === '1')
    && p.isActive !== false);
}

/** → 'ok' | 'pending' | 'cancelled' | 'failed' */
export async function purchase(plan, offerToken) {
  if (!SUBSCRIPTION.plans.includes(plan)) return 'failed';
  if (!isNative) { await wait(400); if (mockOff()) return 'failed'; mockSet(plan); return 'ok'; }
  try {
    const r = await np().purchaseProduct({ productIdentifier: SUBSCRIPTION.productId, planIdentifier: plan, productType: SUBS, offerToken, quantity: 1 });
    if (r && String(r.purchaseState) === '0') return 'pending';
    return 'ok';
  } catch (e) {
    return /cancel/i.test(String((e && (e.message || e.code)) || '')) ? 'cancelled' : 'failed';
  }
}

export async function restore() {
  if (!isNative) { await wait(250); return !mockOff(); }
  try { await np().restorePurchases(); return true; } catch (e) { return false; }
}

/** Tarayıcı taklidinde "yönet" taklit aboneliği kapatır. */
export function mockCancel() { mockSet(''); }
