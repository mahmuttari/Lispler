// Google Play Billing and the App Store (StoreKit 2) through the NativePurchases plugin (@capgo/native-purchases): the store side of the ad-free
// membership. Ported from Calqora's billing.js. Outside the app (a desktop browser, for development and the store screenshots) a small mock stands in
// so the whole membership sheet can be tried; it is never used inside the app. Everything here returns plain values and never throws at the caller.
// The prices always come from the store (priceString, in the user's currency); the mock alone uses config.js › fallbackPrice.
// Google Play: one product (adfree) with the base plans monthly / yearly. App Store: one product per period (config.js › IOS_PRODUCTS).
import { SUBSCRIPTION, IOS_PRODUCTS } from './config.js';
import { plugin, isNative, isIOS } from './native.js';

const SUBS = 'subs';

// ---- mock (browser only): the subscription is a flag in localStorage; ?billing=off pretends Google Play is not there
const mockKey = 'unitica.mock-subscription';
const mockOff = () => { try { return /[?&]billing=off\b/.test(location.search); } catch (e) { return false; } };
const mockGet = () => { try { return localStorage.getItem(mockKey) || ''; } catch (e) { return ''; } };
const mockSet = v => { try { if (v) localStorage.setItem(mockKey, v); else localStorage.removeItem(mockKey); } catch (e) { /* ignore */ } };
const wait = ms => new Promise(r => setTimeout(r, ms));

const np = () => plugin('NativePurchases');

export async function supported() {
  if (!isNative) return !mockOff();
  try { return !!(await np().isBillingSupported()).isBillingSupported; } catch (e) { return false; }
}

// -> { monthly: { priceString, amount, offerToken }, yearly: {...} } with what the store told, or null when it could not be reached
export async function getPlans() {
  if (!isNative) {
    await wait(250);
    if (mockOff()) return null;
    const p = SUBSCRIPTION.fallbackPrice, a = SUBSCRIPTION.fallbackAmount;
    return { monthly: { priceString: p.monthly, amount: a.monthly }, yearly: { priceString: p.yearly, amount: a.yearly } };
  }
  try {
    const out = {};
    if (isIOS) {
      const { products } = await np().getProducts({ productIdentifiers: Object.values(IOS_PRODUCTS), productType: SUBS });
      for (const p of products || []) {
        const plan = SUBSCRIPTION.plans.find(k => IOS_PRODUCTS[k] === p.identifier);
        if (plan && p.priceString) out[plan] = { priceString: p.priceString, amount: p.price };
      }
      return Object.keys(out).length ? out : null;
    }
    const { products } = await np().getProducts({ productIdentifiers: [SUBSCRIPTION.productId], productType: SUBS });
    // on Android `identifier` of a subscription is its base plan; the base offer (no offerId) carries the regular price
    const list = (products || []).slice().sort((x, y) => (x.offerId ? 1 : 0) - (y.offerId ? 1 : 0));
    for (const p of list) {
      const plan = SUBSCRIPTION.plans.includes(p.identifier) ? p.identifier : null;
      if (plan && !out[plan] && p.priceString) out[plan] = { priceString: p.priceString, amount: p.price, offerToken: p.offerToken };
    }
    return Object.keys(out).length ? out : null;
  } catch (e) { return null; }
}

// -> { ok: true, purchases: [...] } when the store answered, { ok: false } when it could not be asked
export async function ownedPurchases() {
  if (!isNative) return mockOff() ? { ok: false } : { ok: true, purchases: mockGet() ? [{ productIdentifier: SUBSCRIPTION.productId, purchaseState: '1', isAcknowledged: true }] : [] };
  try {
    // iPhone: only the current entitlements of the signed-in Apple Account (Transaction.all would also list expired and other accounts' purchases)
    const { purchases } = await np().getPurchases(isIOS ? { productType: SUBS, onlyCurrentEntitlements: true } : { productType: SUBS });
    return { ok: true, purchases: purchases || [] };
  } catch (e) { return { ok: false }; }
}

/**
 * a rejected purchase -> what happened. Android: code USER_CANCELED / ITEM_ALREADY_OWNED, or "Purchase is pending".
 * iPhone: "User cancelled", "Transaction pending" (Ask to Buy, a payment Apple still has to confirm).
 */
export function purchaseError(e) {
  const code = String((e && e.code) || '');
  const msg = String((e && e.message) || e || '');
  if (code === 'USER_CANCELED' || /cancel/i.test(msg)) return 'cancelled';
  if (code === 'ITEM_ALREADY_OWNED' || /already.owned/i.test(msg)) return 'owned';
  if (/pending/i.test(msg) || code === 'PURCHASE_STATE_2') return 'pending';
  return 'failed';
}

// -> 'ok' | 'pending' | 'cancelled' | 'owned' | 'failed'
export async function purchase(plan, offerToken) {
  if (!isNative) { await wait(500); if (mockOff()) return 'failed'; mockSet(plan); return 'ok'; }
  try {
    // resolves only for a purchase in the PURCHASED state; the plugin acknowledges it (autoAcknowledgePurchases, default true).
    // On the iPhone it resolves with the verified, finished StoreKit transaction (no purchaseState there).
    const r = await np().purchaseProduct(isIOS
      ? { productIdentifier: IOS_PRODUCTS[plan], productType: SUBS, quantity: 1 }
      : { productIdentifier: SUBSCRIPTION.productId, planIdentifier: plan, productType: SUBS, offerToken, quantity: 1 });
    return r && r.purchaseState !== undefined && String(r.purchaseState) !== '1' ? 'pending' : 'ok';
  } catch (e) {
    return purchaseError(e);
  }
}

/** asks the store again: Play acknowledges purchases that were never acknowledged (a pending payment that went through later); the App Store syncs (AppStore.sync) */
export async function restore() {
  if (!isNative) { await wait(300); return !mockOff(); }
  try { await np().restorePurchases(); return true; } catch (e) { return false; }
}

/** iPhone: Apple's own subscription page inside the app. -> false when it could not be opened (the caller opens the web page instead) */
export async function manage() {
  if (!isIOS) return false;
  try { await np().manageSubscriptions(); return true; } catch (e) { return false; }
}

/** the browser stand-in for the store's subscription page: cancels the mock subscription */
export function mockCancel() { if (!isNative) mockSet(''); }
