// The membership screen: what it gives, the two plans with the store's own prices, subscribe / restore / manage.
import { h, icon } from './dom.js';
import { t } from './i18n.js';
import { SUBSCRIPTION } from './config.js';
import * as billing from './billing.js';
import { isPremium, subscribe, restore, manage, onChange, savePercent } from './premium.js';
import { S } from './state.js';
import { openSheet, toast } from './sheet.js';
import { isNative } from './native.js';

export function openMembership() {
  const body = h('div', { class: 'prem' });
  let plans = null, loading = true, available = true, selected = 'yearly', busy = false, off = null;
  const sheet = openSheet({ title: t('p.title'), body, onClose: () => { if (off) off(); } });
  off = onChange(render);

  // prices always come from the store (its own localised priceString); the fallback is only for the desktop-browser mock
  const priceOf = plan => (plans && plans[plan] && plans[plan].priceString) || (isNative ? '' : SUBSCRIPTION.fallbackPrice[plan]);
  const amountOf = plan => (plans && plans[plan] && plans[plan].amount) || (isNative ? 0 : SUBSCRIPTION.fallbackAmount[plan]);
  const perText = plan => priceOf(plan) ? t(plan === 'monthly' ? 'p.perMonth' : 'p.perYear', priceOf(plan)) : '';

  function planCard(plan) {
    const save = plan === 'yearly' ? savePercent(amountOf('monthly'), amountOf('yearly')) : 0;
    return h('button', { class: 'plan' + (selected === plan ? ' on' : ''), role: 'radio', 'aria-checked': String(selected === plan), onclick: () => { selected = plan; render(); } },
      h('span', { class: 'radio' }),
      h('span', { class: 'ptxt' }, h('b', { text: t(plan === 'monthly' ? 'p.monthly' : 'p.yearly') }), perText(plan) ? h('small', { text: perText(plan) }) : null),
      save > 0 ? h('span', { class: 'badge', text: t('p.save', save) }) : null);
  }

  async function onSubscribe() {
    if (busy) return;
    busy = true; render();
    const r = await subscribe(selected, plans && plans[selected] && plans[selected].offerToken);
    busy = false;
    toast(t(r === 'ok' ? 'p.thanks' : r === 'pending' ? 'p.pending' : r === 'cancelled' ? 'p.cancelled' : r === 'restored' ? 'p.restored' : 'p.failed'));
    render();
  }
  async function onRestore() {
    if (busy) return;
    busy = true; render();
    const r = await restore();
    busy = false;
    toast(t(r === 'restored' ? 'p.restored' : r === 'none' ? 'p.nothingToRestore' : 'p.failed'));
    render();
  }

  function render() {
    const planName = S.premium && S.premium.plan ? t(S.premium.plan === 'monthly' ? 'p.monthly' : 'p.yearly') : '';
    body.replaceChildren(
      h('div', { class: 'hero' }, h('div', { class: 'heroicon' }, icon('noads')), h('p', { text: t('p.tagline') })),
      h('ul', { class: 'benefits' }, ['p.b1', 'p.b2', 'p.b3'].map(k => h('li', null, icon('check'), h('span', { text: t(k) })))),
      isPremium()
        ? h('div', { class: 'card okcard' }, h('b', { text: t('p.active') }), planName ? h('div', { class: 'sub', text: t('p.activePlan', planName) }) : null, h('div', { class: 'sub', text: t('p.thanks') }),
          h('div', { class: 'wrap', style: 'margin-top:12px' },
            h('button', { class: 'pill', text: t('p.manage'), onclick: manage }),
            h('button', { class: 'pill', text: t('p.restore'), disabled: busy, onclick: onRestore })))
        : h('div', null,
          loading ? h('div', { class: 'sub center', text: t('p.loading') }) : null,
          h('div', { class: 'plans', role: 'radiogroup' }, planCard('yearly'), planCard('monthly')),
          !loading && !available ? h('div', { class: 'merr center', text: t('p.unavailable') }) : null,
          !loading && available && !priceOf(selected) ? h('div', { class: 'merr center', text: t('p.noPrices') }) : null,
          h('button', { class: 'bigbtn', disabled: loading || !available || busy || !priceOf(selected), onclick: onSubscribe, text: perText(selected) ? t('p.subscribe') + ' · ' + perText(selected) : t('p.subscribe') }),
          h('div', { class: 'center', style: 'margin-top:6px' }, h('button', { class: 'pill', text: t('p.restore'), disabled: busy, onclick: onRestore })),
          h('p', { class: 'terms', text: t('p.terms') })));
  }

  render();
  (async () => {
    available = await billing.supported();
    plans = available ? await billing.getPlans() : null;
    loading = false;
    render();
  })();
  return sheet;
}
