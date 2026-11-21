// The ad-free membership: who has it, buying it, restoring it. The store (Google Play or the App Store) is the source of truth; the last answer is kept so the app also knows
// offline, and only a real answer from the store can switch the membership off again.
// The ads (reklam.js) start only after the store said "not a member" (or could not be asked and the last answer was "not a member"): a member's
// phone never initialises the AdMob SDK.
import { S, save } from './state.js';
import { SUBSCRIPTION, IOS } from './config.js';
import * as billing from './billing.js';
import { reklamlariBaslat, reklamlariDurdur } from './reklam.js';

export const isPremium = () => !!(S.premium && S.premium.active);

// the plan of an App Store product id (monthly / yearly), else null. A Play purchase does not name its base plan.
export const iosPlan = id => SUBSCRIPTION.plans.find(k => IOS.products[k] === id) || null;
const ours = p => !!p && (p.productIdentifier === SUBSCRIPTION.productId || !!iosPlan(p.productIdentifier));

// does this purchase give the membership? Android: the purchased state ("1"). iPhone: not refunded (revocationDate) and the period not over
// (isActive), except in Apple's billing grace period, when the user keeps the membership while Apple retries the payment.
const gives = p => ours(p)
  && (p.purchaseState === undefined || p.purchaseState === null || String(p.purchaseState) === '1')
  && !p.revocationDate
  && (p.isActive !== false || p.subscriptionState === 'inGracePeriod');

// do the store's purchases contain our subscription in a state that gives the membership?
export function entitled(purchases) {
  return (purchases || []).some(gives);
}

// the plan of the purchase that gives the membership, when the store tells it (App Store only)
export function activePlan(purchases) {
  const p = (purchases || []).find(gives);
  return p ? iosPlan(p.productIdentifier) : null;
}

export function unacknowledged(purchases) {
  return (purchases || []).some(p => p.productIdentifier === SUBSCRIPTION.productId && String(p.purchaseState) === '1' && p.isAcknowledged === false);
}

// how much cheaper the yearly plan is than twelve monthly ones, in whole percent
export function savePercent(monthly, yearly) {
  if (!(monthly > 0) || !(yearly > 0)) return 0;
  return Math.max(0, Math.round((1 - yearly / (monthly * 12)) * 100));
}

const listeners = new Set();
export function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

function setPremium(active, plan) {
  const was = isPremium();
  S.premium = { active, plan: active ? (plan || (S.premium && S.premium.plan) || null) : null, checkedAt: Date.now() };
  save();
  if (active) reklamlariDurdur(); else reklamlariBaslat();
  if (was !== active) listeners.forEach(f => f());
}

// ask the store; a missing answer (offline, no Play) leaves things as they are. A purchase that became PURCHASED after the
// purchase screen closed (a pending payment that went through later) is still unacknowledged: Play refunds it after 3 days unless it is
// acknowledged, so the plugin's restore (which acknowledges) runs first.
export async function refresh() {
  let r = await billing.ownedPurchases();
  if (r.ok && unacknowledged(r.purchases)) { await billing.restore(); r = await billing.ownedPurchases(); }
  if (r.ok) setPremium(entitled(r.purchases), activePlan(r.purchases));
  else if (!isPremium()) reklamlariBaslat();
}

// -> 'ok' | 'pending' | 'cancelled' | 'restored' | 'failed'
// Google Play says the subscription is already owned (for example bought on another phone with the same account): restore it instead
export async function subscribe(plan, offerToken) {
  const r = await billing.purchase(plan, offerToken);
  if (r === 'ok') setPremium(true, plan);
  if (r === 'owned') { const k = await restore(); return k === 'restored' ? 'restored' : 'failed'; }
  return r;
}

// -> 'restored' | 'none' | 'failed'
export async function restore() {
  await billing.restore();
  const r = await billing.ownedPurchases();
  if (!r.ok) return 'failed';
  const e = entitled(r.purchases);
  setPremium(e, activePlan(r.purchases));
  return e ? 'restored' : 'none';
}

// opens the store's page; whatever the user does there is picked up when the app comes back (refresh)
export const manage = () => billing.manage();
