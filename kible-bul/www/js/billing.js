// Google Play Billing through the NativePurchases plugin. Outside the Android app (a desktop browser, for development) a small mock stands in, so the whole
// membership screen can be tried; it is never used inside the app. Everything here returns plain values and never throws at the caller.
import { SUBSCRIPTION } from './config.js';
import { plugin, isNative, openSubscriptions } from './native.js';

const SUBS = 'subs';

// ---- mock (browser only): the subscription is a flag in localStorage; ?billing=off pretends Google Play is not there
const mockKey = 'kible-bul.mock-subscription';
const mockOff = () => { try { return /[?&]billing=off\b/.test(location.search); } catch (e) { return false; } };
const mockGet = () => { try { return localStorage.getItem(mockKey) || ''; } catch (e) { return ''; } };
const mockSet = v => { try { if (v) localStorage.setItem(mockKey, v); else localStorage.removeItem(mockKey); } catch (e) { /* ignore */ } };
const wait = ms => new Promise(r => setTimeout(r, ms));

const np = () => plugin('NativePurchases');

export async function supported() {
  if (!isNative) return !mockOff();
  try { return !!(await np().isBillingSupported()).isBillingSupported; } catch (e) { return false; }
}

// -> { monthly: {priceString, amount, offerToken}, yearly: {...} } with whatever the store could tell, or null when it could not be reached
export async function getPlans() {
  if (!isNative) { await wait(250); return mockOff() ? null : { monthly: { priceString: '$0.99', amount: 0.99 }, yearly: { priceString: '$9.99', amount: 9.99 } }; }
  try {
    const { products } = await np().getProducts({ productIdentifiers: [SUBSCRIPTION.productId], productType: SUBS });
    const out = {};
    for (const p of products || []) {
      const plan = SUBSCRIPTION.plans.includes(p.identifier) ? p.identifier : null;   // on Android `identifier` of a subscription is its base plan
      if (plan && !out[plan]) out[plan] = { priceString: p.priceString, amount: p.price, offerToken: p.offerToken };
    }
    return Object.keys(out).length ? out : null;
  } catch (e) { return null; }
}

// -> { ok: true, purchases: [...] } when the store answered, { ok: false } when it could not be asked
export async function ownedPurchases() {
  if (!isNative) return mockOff() ? { ok: false } : { ok: true, purchases: mockGet() ? [{ productIdentifier: SUBSCRIPTION.productId, purchaseState: '1' }] : [] };
  try {
    const { purchases } = await np().getPurchases({ productType: SUBS });
    return { ok: true, purchases: purchases || [] };
  } catch (e) { return { ok: false }; }
}

/**
 * What a rejected purchase means. The plugin (NativePurchases 8.9.6) rejects with the message "Purchase is not purchased"
 * and the Play Billing response as the CODE (USER_CANCELED, ITEM_ALREADY_OWNED…), and with "Purchase is pending" for a
 * payment that is still being processed (cash, bank transfer). 1.0.1 looked only at the message, so a cancel showed
 * "could not be completed" and a pending payment was never recognised.
 */
export function purchaseError(e) {
  const code = String((e && e.code) || ''), msg = String((e && e.message) || e || '');
  if (code === 'USER_CANCELED' || /cancel/i.test(msg)) return 'cancelled';
  if (code === 'ITEM_ALREADY_OWNED' || /already.owned/i.test(msg)) return 'owned';
  if (/pending/i.test(msg) || code === 'PURCHASE_STATE_2') return 'pending';
  return 'failed';
}

// -> 'ok' | 'pending' | 'cancelled' | 'owned' | 'failed'   ('owned': Google Play says the subscription is already bought: restore it)
export async function purchase(plan, offerToken) {
  if (!isNative) { await wait(500); if (mockOff()) return 'failed'; mockSet(plan); return 'ok'; }
  try {
    const r = await np().purchaseProduct({ productIdentifier: SUBSCRIPTION.productId, planIdentifier: plan, productType: SUBS, offerToken, quantity: 1 });
    // Play Billing: 1 PURCHASED, 2 PENDING (0 is "unspecified"; 1.0.1 wrongly took '0' for pending)
    if (r && String(r.purchaseState) === '2') return 'pending';
    return 'ok';
  } catch (e) {
    return purchaseError(e);
  }
}

export async function restore() {
  if (!isNative) { await wait(300); return !mockOff(); }
  try { await np().restorePurchases(); return true; } catch (e) { return false; }
}

// Google Play's management page of this app's subscription (with the product: sku=adfree&package=…); the plugin's own
// manageSubscriptions (the general list, without sku) only when that could not be opened
export async function manage() {
  if (!isNative) { mockSet(''); return true; }   // in the browser the "management page" simply cancels the mock subscription
  if (await openSubscriptions(SUBSCRIPTION.productId)) return true;
  try { await np().manageSubscriptions(); return true; } catch (e) { return false; }
}
