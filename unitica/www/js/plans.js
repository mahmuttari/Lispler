// The ad-free membership: who has it, buying it, restoring it, and the plans with the store's own prices.
// The store (Google Play or the App Store) is the source of truth; its last answer is kept in state.member so the app also knows offline, and only a real answer from the store
// switches the membership off again. The store side is billing.js, the screen is membership.js; the rest of the app only asks isAdFree() (state.js).
import { t, locale } from './i18n.js';
import { state, setMember, isAdFree } from './state.js';
import { SUBSCRIPTION, IOS_PRODUCTS } from './config.js';
import * as billing from './billing.js';
import { reklamBaslat, reklamDurdur } from './reklam.js';
import { onAppState } from './native.js';

export { isAdFree };

/** the plan of an App Store product id (monthly / yearly), else null. A Play purchase does not name its base plan. */
export const iosPlan = id => SUBSCRIPTION.plans.find(k => IOS_PRODUCTS[k] === id) || null;
/** a purchase of our subscription: the Play product, or one of the App Store products */
export const ours = p => !!p && (p.productIdentifier === SUBSCRIPTION.productId || !!iosPlan(p.productIdentifier));

/**
 * does this purchase give the membership? Android: the purchased state ("1"). iPhone: not refunded (revocationDate) and the period not over
 * (isActive), except in Apple's billing grace period, when the user keeps the membership while Apple retries the payment.
 */
const gives = p => ours(p)
  && (p.purchaseState === undefined || p.purchaseState === null || String(p.purchaseState) === '1')
  && !p.revocationDate
  && (p.isActive !== false || p.subscriptionState === 'inGracePeriod');

/** do the store's purchases contain our subscription in a state that gives the membership? */
export function entitled(purchases) {
  return (purchases || []).some(gives);
}

/** the plan of the purchase that gives the membership, when the store tells it (App Store only) */
export function activePlan(purchases) {
  const p = (purchases || []).find(gives);
  return p ? iosPlan(p.productIdentifier) : null;
}

/** how much cheaper the yearly plan is than twelve monthly ones (0.159 = 16 %), from the store's amounts */
export function yearlySaving(monthly, yearly) {
  if (!(monthly > 0) || !(yearly > 0)) return 0;
  return Math.max(0, 1 - yearly / (monthly * 12));
}

export const percent = x => new Intl.NumberFormat(locale(), { style: 'percent', maximumFractionDigits: 0 }).format(x);

function setAdFree(active, plan) {
  const was = isAdFree();
  if (active) setMember({ plan: plan || (state.member && state.member.plan) || null, at: Date.now() });
  else if (was) setMember(null);
  if (active) reklamDurdur(); else reklamBaslat();
}

/** ask the store; no answer (offline, no Play) leaves the membership as it is. Purchases still waiting for their acknowledgement are acknowledged. */
export async function refresh() {
  const r = await billing.ownedPurchases();
  if (!r.ok) { if (!isAdFree()) reklamBaslat(); return; }
  const mine = r.purchases.filter(ours);
  if (mine.some(p => String(p.purchaseState) === '1' && p.isAcknowledged === false)) billing.restore();   // Play: a pending purchase that went through later
  setAdFree(entitled(mine), activePlan(mine));
}

/** -> 'ok' | 'pending' | 'cancelled' | 'owned' | 'failed' */
export async function subscribe(plan, offerToken) {
  const r = await billing.purchase(plan, offerToken);
  if (r === 'ok') setAdFree(true, plan);
  if (r === 'owned') { const x = await restore(); return x === 'restored' ? 'ok' : 'failed'; }
  return r;
}

/** -> 'restored' | 'none' | 'failed' */
export async function restore() {
  await billing.restore();
  const r = await billing.ownedPurchases();
  if (!r.ok) return 'failed';
  const e = entitled(r.purchases);
  setAdFree(e, activePlan(r.purchases));
  return e ? 'restored' : 'none';
}

// ---------------------------------------------------------------- the store's prices for the More screen (asked once per opening of the app)
let prices = null, asked = false;
const priceListeners = new Set();
export function onPrices(fn) { priceListeners.add(fn); return () => priceListeners.delete(fn); }
/** -> { monthly: { priceString, amount, offerToken }, yearly: {...} } or null (not loaded, store not reachable) */
export function cachedPlans() {
  if (!asked) {
    asked = true;
    billing.getPlans().then(p => { prices = p; priceListeners.forEach(f => f()); });
  }
  return prices;
}
export const rememberPlans = p => { if (p) { prices = p; asked = true; } };

/** the line under "Ad-free membership" on the More screen: the store's prices, never typed-in ones */
export function priceLine() {
  if (isAdFree()) return t('more.member.active');
  const p = cachedPlans();
  if (p && p.monthly && p.yearly) return t('more.member.sub', { monthly: p.monthly.priceString, yearly: p.yearly.priceString });
  return t('more.member.hint');
}

/** start: what does the store say? The ads start only when it says "no membership" (or does not answer and none is remembered). */
export function startMembership() {
  let done = false;
  const fallback = setTimeout(() => { if (!done && !isAdFree()) reklamBaslat(); }, 6000);   // a store that does not answer must not keep the ads off for ever
  refresh().finally(() => { done = true; clearTimeout(fallback); });
  onAppState(() => {}, () => { refresh(); });   // back from the store's subscription page (subscribed, cancelled ...)
}
