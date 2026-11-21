// The membership logic, against the browser mock of Google Play (billing.js): buying, restoring, cancelling, and what happens when the store cannot be reached.
const store = {};
globalThis.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
globalThis.location = { search: '' };

export async function run({ ok }) {
  const P = await import('../../www/js/premium.js');
  const { S, save } = await import('../../www/js/state.js');
  const { SUBSCRIPTION } = await import('../../www/js/config.js');
  const B = await import('../../www/js/billing.js');

  // what counts as owning the membership
  const mine = { productIdentifier: SUBSCRIPTION.productId, purchaseState: '1' };
  ok(P.entitled([mine]) && P.entitled([{ productIdentifier: SUBSCRIPTION.productId }]), 'a purchased subscription grants the membership');
  ok(!P.entitled([]) && !P.entitled(null) && !P.entitled([{ productIdentifier: 'other', purchaseState: '1' }]), 'nothing, or another product, does not');
  ok(!P.entitled([{ productIdentifier: SUBSCRIPTION.productId, purchaseState: '0' }]), 'a pending payment does not yet');
  ok(!P.entitled([{ productIdentifier: SUBSCRIPTION.productId, purchaseState: '1', isActive: false }]), 'an inactive (expired / refunded) subscription does not');

  // the discount of the yearly plan against twelve monthly ones: $0.99 x 12 = $11.88 against $9.99
  ok(P.savePercent(0.99, 9.99) === 16 && P.savePercent(1, 12) === 0 && P.savePercent(1, 20) === 0 && P.savePercent(0, 5) === 0 && P.savePercent(NaN, 5) === 0, 'savePercent');
  ok(SUBSCRIPTION.fallbackPrice.monthly === '$0.99' && SUBSCRIPTION.fallbackPrice.yearly === '$9.99', 'prices are $0.99 / month and $9.99 / year');

  // the mock store
  ok(await B.supported(), 'the mock store is there');
  const plans = await B.getPlans();
  ok(plans && plans.monthly.priceString === '$0.99' && plans.yearly.priceString === '$9.99' && plans.yearly.amount === 9.99, 'plans with their prices');

  ok(!P.isPremium(), 'a new install is not a member');
  await P.refresh();
  ok(!P.isPremium(), 'the store owns nothing: still not a member');

  let changes = 0;
  const off = P.onChange(() => { changes++; });
  ok(await P.subscribe('yearly') === 'ok' && P.isPremium() && S.premium.plan === 'yearly' && S.premium.active === true, 'buying the yearly plan makes a member');
  ok(changes === 1, 'listeners are told once', changes);
  await P.refresh();
  ok(P.isPremium(), 'the store still confirms it');
  save(true);
  ok(JSON.parse(store['kible-bul.v1']).premium.active === true, 'the state is saved');

  // the store cannot be reached (?billing=off): a member stays a member, nothing can be bought
  globalThis.location.search = '?billing=off';
  ok(!(await B.supported()) && (await B.getPlans()) === null, 'no store: not supported, no plans');
  await P.refresh();
  ok(P.isPremium(), 'no answer from the store does not take the membership away');
  ok(await P.subscribe('monthly') === 'failed' && S.premium.plan === 'yearly', 'buying without a store fails and changes nothing');
  ok(await P.restore() === 'failed', 'restoring without a store fails');
  globalThis.location.search = '';

  // cancelling in the store's own page: the next answer takes it away
  await P.manage();
  await P.refresh();
  ok(!P.isPremium() && S.premium.plan === null && changes === 2, 'after cancelling, the store says no and the membership ends');
  ok(await P.restore() === 'none', 'restore finds nothing to restore');
  await P.subscribe('monthly');
  ok(P.isPremium() && S.premium.plan === 'monthly', 'monthly plan');
  await P.manage(); await P.subscribe('yearly');
  S.premium.active = false;   // a device that has forgotten
  ok(await P.restore() === 'restored' && P.isPremium(), 'restore brings the membership back');
  off();
}
