// The ad-free membership sheet: what it gives, the two plans with the store's own prices, subscribe / restore / manage.
// The logic is plans.js, the store side billing.js. Prices are never typed in here: while the store has not answered the plans show "…".
import { t } from './i18n.js';
import { icon, esc, $$ } from './dom.js';
import { openSheet, toast } from './sheet.js';
import { state, onChange } from './state.js';
import { SUBSCRIPTION, MANAGE_URL } from './config.js';
import * as billing from './billing.js';
import { isAdFree, subscribe, restore, yearlySaving, percent, rememberPlans } from './plans.js';
import { uyelikGoruldu } from './reklam.js';
import { isNative } from './native.js';

export function openMembership() {
  uyelikGoruldu();
  let plans = null, loading = true, available = true, chosen = 'yearly', busy = false, body = null, off = null;

  const priceOf = plan => (plans && plans[plan] ? plans[plan].priceString : '…');
  const perText = plan => t(plan === 'yearly' ? 'member.perYear' : 'member.perMonth', { price: priceOf(plan) });

  const planHtml = plan => {
    const save = plan === 'yearly' && plans && plans.monthly && plans.yearly ? yearlySaving(plans.monthly.amount, plans.yearly.amount) : 0;
    return `<button type="button" role="radio" class="plan" aria-checked="${plan === chosen}" data-plan="${plan}">
      <span class="plan-name">${esc(t('member.' + plan))}</span>
      <span class="plan-price" dir="auto">${esc(perText(plan))}</span>
      ${save >= 0.01 ? `<em class="plan-save">${esc(t('member.save', { pct: percent(save) }))}</em>` : ''}
    </button>`;
  };

  function render() {
    if (!body) return;
    const ticks = `<ul class="ticks"><li>${icon('check')}<span>${esc(t('member.f1'))}</span></li><li>${icon('check')}<span>${esc(t('member.f2'))}</span></li></ul>`;
    const restoreBtn = `<button type="button" class="link-quiet" data-restore ${busy ? 'disabled' : ''}>${esc(t('member.restore'))}</button>`;
    if (isAdFree()) {
      const plan = state.member && state.member.plan ? t('member.' + state.member.plan) : '';
      body.innerHTML = `<div class="member-hero">${icon('sparkles')}<p>${esc(t('member.active'))}</p></div>
        ${ticks}
        ${plan ? `<p class="status">${esc(t('member.activePlan', { plan }))}</p>` : ''}
        <a class="btn-primary wide" data-manage href="${esc(MANAGE_URL)}" target="_blank" rel="noopener noreferrer">${esc(t('member.manage'))}</a>
        ${restoreBtn}`;
      return;
    }
    const ready = !loading && available && plans && plans[chosen];
    body.innerHTML = `<div class="member-hero">${icon('sparkles')}<p>${esc(t('member.lead'))}</p></div>
      <div class="plans" role="radiogroup">${SUBSCRIPTION.plans.map(planHtml).join('')}</div>
      ${ticks}
      ${loading ? `<p class="note">${esc(t('member.loading'))}</p>` : ''}
      ${!loading && !(available && plans) ? `<p class="note warn-note">${esc(t('member.unavailable'))}</p>` : ''}
      <button type="button" class="btn-primary wide" data-buy ${ready && !busy ? '' : 'disabled'}>${esc(t('member.cta'))}</button>
      <p class="status">${esc(t('member.status'))}</p>
      <p class="note">${esc(t('member.terms'))}</p>
      ${restoreBtn}`;
  }

  async function onBuy() {
    if (busy || !plans || !plans[chosen]) return;
    busy = true; render();
    const r = await subscribe(chosen, plans[chosen].offerToken);
    busy = false;
    if (r === 'ok') toast(t('member.thanks'));
    else if (r === 'pending') toast(t('member.pending'));
    else if (r !== 'cancelled') toast(t('member.failed'));
    render();
  }
  async function onRestore() {
    if (busy) return;
    busy = true; render();
    const r = await restore();
    busy = false;
    toast(t(r === 'restored' ? 'member.restored' : r === 'none' ? 'member.none' : 'member.failed'));
    render();
  }

  openSheet({
    title: t('member.title'),
    html: '<div class="member"></div>',
    onMount(panel) {
      body = panel.querySelector('.member');
      off = onChange(what => { if (what === 'member') render(); });
      panel.addEventListener('click', ev => {
        const plan = ev.target.closest('[data-plan]');
        if (plan) { chosen = plan.dataset.plan; for (const b of $$('.plan', panel)) b.setAttribute('aria-checked', String(b === plan)); render(); return; }
        if (ev.target.closest('[data-buy]')) onBuy();
        else if (ev.target.closest('[data-restore]')) onRestore();
        else if (ev.target.closest('[data-manage]') && !isNative) {   // the browser mock: "Google Play" cancels the mock subscription
          ev.preventDefault();
          billing.mockCancel();
          restore().then(render);
        }
      });
      render();
    },
    onClose: () => { body = null; if (off) off(); },
  });

  (async () => {
    available = await billing.supported();
    plans = available ? await billing.getPlans() : null;
    rememberPlans(plans);
    loading = false;
    render();
  })();
}
