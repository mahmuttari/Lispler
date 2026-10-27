// The ad-free membership: who has it, buying it, restoring it. The store (Google Play) is the source of truth; the last answer is kept so the app also knows
// offline, and only a real answer from the store can switch the membership off again.
import { S, save } from './state.js';
import { SUBSCRIPTION } from './config.js';
import * as billing from './billing.js';

export const isPremium = () => !!(S.premium && S.premium.active);

// do the store's purchases contain our subscription in the purchased state?
export function entitled(purchases) {
  return (purchases || []).some(p => p.productIdentifier === SUBSCRIPTION.productId
    && (p.purchaseState === undefined || p.purchaseState === null || String(p.purchaseState) === '1')
    && p.isActive !== false);
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
  if (was !== active) listeners.forEach(f => f());   // app.js: a member gets no ads (reklam.js), a lapsed one gets them again
}

// ask the store; a missing answer (offline, no Play) leaves things as they are.
// A purchase that is bought but not yet acknowledged (a pending payment that went through while the app was closed) is
// acknowledged here through restorePurchases: Google Play refunds a purchase that stays unacknowledged for 3 days, and
// 1.0.1 acknowledged it only when the user happened to press "Restore purchases".
export async function refresh() {
  const r = await billing.ownedPurchases();
  if (!r.ok) return;
  if (r.purchases.some(p => p.productIdentifier === SUBSCRIPTION.productId && String(p.purchaseState) === '1' && p.isAcknowledged === false)) await billing.restore();
  setPremium(entitled(r.purchases), null);
}

// -> 'ok' | 'pending' | 'cancelled' | 'failed'
export async function subscribe(plan, offerToken) {
  const r = await billing.purchase(plan, offerToken);
  if (r === 'ok') setPremium(true, plan);
  // Google Play says it is already bought (another device, a reinstall): restore it instead of showing a failure
  if (r === 'owned') return (await restore()) === 'restored' ? 'ok' : 'failed';
  return r;
}

// -> 'restored' | 'none' | 'failed'
export async function restore() {
  await billing.restore();
  const r = await billing.ownedPurchases();
  if (!r.ok) return 'failed';
  const e = entitled(r.purchases);
  setPremium(e, null);
  return e ? 'restored' : 'none';
}

// opens the store's page; whatever the user does there is picked up when the app comes back (refresh)
export const manage = () => billing.manage();
