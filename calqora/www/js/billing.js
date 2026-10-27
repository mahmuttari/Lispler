// Google Play Billing through the NativePurchases plugin. Outside the Android app (a desktop browser, for development) a small mock stands in, so the whole
// membership screen can be tried; it is never used inside the app. Everything here returns plain values and never throws at the caller.
import { SUBSCRIPTION } from './config.js';
import { plugin, isNative, openExternal } from './native.js';

const SUBS = 'subs';

// ---- mock (browser only): the subscription is a flag in localStorage; ?billing=off pretends Google Play is not there
const mockKey = 'calqora.mock-subscription';
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

// A rejected purchase -> what happened. @capgo/native-purchases 8.9.6 (Android) resolves purchaseProduct only for a purchase in the
// PURCHASED state (1). Otherwise it rejects: a user cancel with code USER_CANCELED (message "Purchase is not purchased"), an already
// bought subscription with ITEM_ALREADY_OWNED, a pending payment (Purchase.PurchaseState.PENDING = 2) with the message "Purchase is
// pending", another state with code PURCHASE_STATE_<n>. The code decides first, the message second. (1.0.0 only tested the message for
// /cancel/, so a cancel was reported as a failure, and took purchaseState '0' for pending: on Android 0 is UNSPECIFIED, 2 is PENDING.)
export function purchaseError(e) {
  const code = String((e && e.code) || '');
  const msg = String((e && e.message) || (typeof e === 'string' ? e : '') || '');
  if (code === 'USER_CANCELED') return 'cancelled';
  if (code === 'ITEM_ALREADY_OWNED') return 'owned';
  if (code === 'PURCHASE_STATE_2') return 'pending';
  if (/pending/i.test(msg)) return 'pending';
  if (/cancel/i.test(msg)) return 'cancelled';
  if (/already.?owned/i.test(msg)) return 'owned';
  return 'failed';
}

// -> 'ok' | 'pending' | 'cancelled' | 'owned' | 'failed'
export async function purchase(plan, offerToken) {
  if (!isNative) { await wait(500); if (mockOff()) return 'failed'; mockSet(plan); return 'ok'; }
  try {
    // resolves only for a purchase in the PURCHASED state; the plugin acknowledges it (autoAcknowledgePurchases, default true)
    const r = await np().purchaseProduct({ productIdentifier: SUBSCRIPTION.productId, planIdentifier: plan, productType: SUBS, offerToken, quantity: 1 });
    return r && r.purchaseState !== undefined && r.purchaseState !== null && String(r.purchaseState) !== '1' ? 'pending' : 'ok';
  } catch (e) {
    return purchaseError(e);
  }
}

export async function restore() {
  if (!isNative) { await wait(300); return !mockOff(); }
  try { await np().restorePurchases(); return true; } catch (e) { return false; }
}

// Google Play's page for the adfree subscription (SUBSCRIPTION.manageUrl: ?sku=adfree&package=…), opened by the Play Store app
export async function manage() {
  if (!isNative) { mockSet(''); return true; }   // in the browser the "management page" simply cancels the mock subscription
  return openExternal(SUBSCRIPTION.manageUrl);
}
