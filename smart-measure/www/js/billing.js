// Google Play Faturalandırma ve App Store (StoreKit 2), @capgo/native-purchases ile. Google Play: tek abonelik ürünü
// "adfree", iki temel plan "monthly" ve "yearly". App Store: temel plan yoktur, her dönem ayrı üründür (IOS_PRODUCTS;
// ikisi App Store Connect'te tek abonelik grubunda). Fiyatlar her zaman mağazadan gelir (priceString); aşağıdaki yedek
// fiyatlar yalnız masaüstü tarayıcı taklidinde görünür. Uygulamanın dışında (tarayıcı) küçük bir taklit vardır: abonelik
// localStorage'da bir bayraktır, ?billing=off mağaza yokmuş gibi davranır. Hiçbir işlev çağırana hata fırlatmaz.
import { plugin, isNative, isIOS } from './native.js';

export const PACKAGE = 'com.poyrazworkshop.smartmeasure';
export const SUBSCRIPTION = {
  productId: 'adfree',
  plans: ['monthly', 'yearly'],
  fallbackPrice: { monthly: '$0.99', yearly: '$9.99' }, // yalnız tarayıcı taklidi; uygulamada Play'in fiyatı
};
export const MANAGE_URL = `https://play.google.com/store/account/subscriptions?sku=${SUBSCRIPTION.productId}&package=${PACKAGE}`;
export const IOS_PRODUCTS = { monthly: `${PACKAGE}.adfree.monthly`, yearly: `${PACKAGE}.adfree.yearly` };
/** App Store'un abonelik listesi; uygulama önce Apple'ın kendi uygulama içi sayfasını açar (manage) */
export const MANAGE_URL_IOS = 'https://apps.apple.com/account/subscriptions';
/** Apple'ın standart lisans sözleşmesi: App Review (3.1.2) abonelik sayfasında gizlilik politikasıyla birlikte bağlantı ister */
export const EULA_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

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
    if (isIOS) {
      const { products } = await np().getProducts({ productIdentifiers: Object.values(IOS_PRODUCTS), productType: SUBS });
      return plansFromIos(products);
    }
    const { products } = await np().getProducts({ productIdentifiers: [SUBSCRIPTION.productId], productType: SUBS });
    return plansFrom(products);
  } catch (e) { return null; }
}

/** App Store ürün listesinden planlar: her dönem ayrı ürün (IOS_PRODUCTS). */
export function plansFromIos(products) {
  const out = {};
  for (const p of products || []) {
    const plan = iosPlan(p.identifier);
    if (plan && !out[plan]) out[plan] = { priceString: p.priceString, amount: p.price };
  }
  return Object.keys(out).length ? out : null;
}

/** App Store ürün kimliğinin planı (monthly / yearly), değilse null. Play satın alımı temel planı söylemez. */
export const iosPlan = (id) => SUBSCRIPTION.plans.find((k) => IOS_PRODUCTS[k] === id) || null;

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
    // iPhone: yalnız oturum açık Apple hesabının geçerli hakları (Transaction.all süresi dolmuşları ve başka hesapları da verir)
    const { purchases } = await np().getPurchases(isIOS ? { productType: SUBS, onlyCurrentEntitlements: true } : { productType: SUBS });
    return { ok: true, purchases: purchases || [] };
  } catch (e) { return { ok: false }; }
}

const ours = (p) => !!p && (p.productIdentifier === SUBSCRIPTION.productId || !!iosPlan(p.productIdentifier));
// Abonelik veriyor mu? Android: satın alınmış ("1"). iPhone: iade edilmemiş (revocationDate) ve dönemi bitmemiş (isActive);
// Apple ödemeyi yeniden denerken (ek süre, inGracePeriod) abonelik sürer.
const gives = (p) => ours(p)
  && (p.purchaseState === undefined || p.purchaseState === null || String(p.purchaseState) === '1')
  && !p.revocationDate
  && (p.isActive !== false || p.subscriptionState === 'inGracePeriod');

/** Mağazanın satın alımlarında aboneliği veren bir "adfree" (ya da App Store ürünü) var mı? */
export function entitled(purchases) {
  return (purchases || []).some(gives);
}

/** Aboneliği veren satın alımın planı; yalnız App Store söyler. */
export function activePlan(purchases) {
  const p = (purchases || []).find(gives);
  return p ? iosPlan(p.productIdentifier) : null;
}

/**
 * Reddedilen satın alma → ne oldu. Android: kod USER_CANCELED, "Purchase is pending" ya da PURCHASE_STATE_2.
 * iPhone: "User cancelled", "Transaction pending" (Ask to Buy, Apple'ın henüz onaylamadığı ödeme).
 */
export function purchaseError(e) {
  const code = String((e && e.code) || '');
  const msg = String((e && e.message) || (typeof e === 'string' ? e : '') || '');
  if (code === 'USER_CANCELED' || /cancel/i.test(msg)) return 'cancelled';
  if (code === 'PURCHASE_STATE_2' || /pending/i.test(msg)) return 'pending';
  return 'failed';
}

/** → 'ok' | 'pending' | 'cancelled' | 'failed' */
export async function purchase(plan, offerToken) {
  if (!SUBSCRIPTION.plans.includes(plan)) return 'failed';
  if (!isNative) { await wait(400); if (mockOff()) return 'failed'; mockSet(plan); return 'ok'; }
  try {
    // iPhone'da doğrulanmış, bitirilmiş StoreKit işlemiyle çözülür (purchaseState yok)
    const r = await np().purchaseProduct(isIOS
      ? { productIdentifier: IOS_PRODUCTS[plan], productType: SUBS, quantity: 1 }
      : { productIdentifier: SUBSCRIPTION.productId, planIdentifier: plan, productType: SUBS, offerToken, quantity: 1 });
    if (r && String(r.purchaseState) === '0') return 'pending';
    return 'ok';
  } catch (e) {
    return purchaseError(e);
  }
}

export async function restore() {
  if (!isNative) { await wait(250); return !mockOff(); }
  try { await np().restorePurchases(); return true; } catch (e) { return false; }
}

/** iPhone: Apple'ın uygulama içi abonelik sayfası. → açılamadıysa false (çağıran web sayfasını açar) */
export async function manage() {
  if (!isIOS) return false;
  try { await np().manageSubscriptions(); return true; } catch (e) { return false; }
}

/** Tarayıcı taklidinde "yönet" taklit aboneliği kapatır. */
export function mockCancel() { mockSet(''); }
