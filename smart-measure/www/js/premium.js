// Reklamsız abonelik: kimde var, satın alma, geri yükleme. Doğruluğun kaynağı mağazadır (Google Play ya da App Store); son yanıt saklanır
// (çevrimdışıyken de bilinsin) ve yalnız mağazanın gerçek yanıtı aboneliği yeniden kapatabilir.
import { SYS, saveSys } from './store.js';
import * as billing from './billing.js';
import { openUrl, isNative, isIOS } from './native.js';

export const isPremium = () => !!(SYS.premium && SYS.premium.active);
export const plan = () => (SYS.premium && SYS.premium.plan) || null;

const listeners = new Set();
export function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

function set(active, p) {
  const was = isPremium();
  SYS.premium = { active, plan: active ? (p || plan()) : null, checkedAt: Date.now() };
  saveSys();
  if (was !== active) listeners.forEach((f) => { try { f(active); } catch (e) { console.error(e); } });
}

/** Mağazaya sorar; yanıt yoksa (çevrimdışı) durum değişmez. */
export async function refresh() {
  const r = await billing.ownedPurchases();
  if (r.ok) set(billing.entitled(r.purchases), billing.activePlan(r.purchases));
  return r.ok;
}

/** Açılış: mağazanın yanıtını en çok 4 sn bekler (reklam SDK'sı ondan sonra, yalnız abone değilse başlar). */
export function start() {
  return Promise.race([refresh().catch(() => false), new Promise((r) => setTimeout(r, 4000))]);
}

/** → 'ok' | 'pending' | 'cancelled' | 'failed' */
export async function subscribe(p, offerToken) {
  const r = await billing.purchase(p, offerToken);
  if (r === 'ok') set(true, p);
  return r;
}

/** → 'restored' | 'none' | 'failed' */
export async function restore() {
  await billing.restore();
  const r = await billing.ownedPurchases();
  if (!r.ok) return 'failed';
  const e = billing.entitled(r.purchases);
  set(e, billing.activePlan(r.purchases));
  return e ? 'restored' : 'none';
}

/** Mağazanın abonelik sayfası (iPhone'da Apple'ın uygulama içi sayfası); dönüşte refresh() değişikliği alır. */
export function manage() {
  if (!isNative) { billing.mockCancel(); refresh(); return; }
  if (isIOS) { billing.manage().then((ok) => { if (!ok) openUrl(billing.MANAGE_URL_IOS); }); return; }
  openUrl(billing.MANAGE_URL);
}
