// Premium = reklamsız abonelik (aylık / yıllık). Fiyatlar Google Play'den gelir; burada fiyat yazılmaz.
import { h, toast, notice, put } from '../dom.js';
import { icon } from '../icons.js';
import { t } from '../i18n.js';
import * as premium from '../premium.js';
import * as billing from '../billing.js';
import { topbar } from './common.js';

export function render({ back }) {
  let plans = null, loading = true, selected = 'yearly', busy = false, msg = null;
  const body = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '14px' } });
  const el = h('div', { class: 'screen acc-blue' }, topbar({ title: t('st_premium_title'), onBack: back }), body);

  const feats = () => h('section', { class: 'card', style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
    h('h2', { text: t('st_premium_headline') }), h('p', { class: 'muted', text: t('st_premium_text') }),
    ...['pr_feat_banner', 'pr_feat_full', 'pr_feat_tools'].map((k) => h('div', { class: 'feat' }, icon('CircleCheck', 20), h('span', { text: t(k) }))));

  function savePct() {
    const m = plans && plans.monthly && plans.monthly.amount, y = plans && plans.yearly && plans.yearly.amount;
    if (!(m > 0) || !(y > 0)) return 0;
    return Math.max(0, Math.round((1 - y / (m * 12)) * 100));
  }

  function planCard(p) {
    const on = selected === p;
    const price = plans[p].priceString;
    const save = p === 'yearly' ? savePct() : 0;
    return h('button', { class: `plan${on ? ' on' : ''}`, type: 'button', role: 'radio', 'aria-checked': String(on), onclick: () => { selected = p; draw(); } },
      h('span', { class: 'radio', 'aria-hidden': 'true' }),
      h('span', { class: 'grow' }, h('b', { text: t(p === 'monthly' ? 'pr_monthly' : 'pr_yearly') }), h('small', { text: t(p === 'monthly' ? 'pr_per_month' : 'pr_per_year', price) })),
      save > 0 ? h('span', { class: 'badge ok', text: t('pr_save', save) }) : null);
  }

  async function buy() {
    if (busy || !plans || !plans[selected]) return;
    busy = true; msg = null; draw();
    const r = await premium.subscribe(selected, plans[selected].offerToken);
    busy = false;
    if (r === 'ok') toast(t('pr_thanks'));
    else if (r === 'pending') msg = ['warn', 'pr_pending'];
    else if (r === 'failed') msg = ['err', 'pr_failed'];
    draw();
  }

  async function restore() {
    if (busy) return;
    busy = true; draw();
    const r = await premium.restore();
    busy = false;
    msg = r === 'restored' ? ['ok', 'pr_restored'] : r === 'none' ? ['warn', 'pr_none'] : ['err', 'pr_unavailable'];
    draw();
  }

  async function load() {
    loading = true; draw();
    plans = await billing.getPlans();
    loading = false;
    if (plans && !plans[selected]) selected = plans.yearly ? 'yearly' : 'monthly';
    draw();
  }

  function draw() {
    const out = [feats()];
    if (premium.isPremium()) {
      const p = premium.plan();
      out.push(notice('ok', 'CircleCheck', t('pr_active'), `${t('pr_active_text')}${p ? ` ${t('pr_plan', t(p === 'monthly' ? 'pr_monthly' : 'pr_yearly'))}` : ''}`));
      out.push(h('button', { class: 'btn block', type: 'button', onclick: () => premium.manage() }, icon('ExternalLink', 18), t('pr_manage')));
    } else if (loading) {
      out.push(h('p', { class: 'muted', text: t('pr_loading') }));
    } else if (!plans) {
      out.push(notice('warn', 'TriangleAlert', null, t('pr_unavailable')));
      out.push(h('button', { class: 'btn block', type: 'button', onclick: load, text: t('pr_retry') }));
    } else {
      out.push(h('div', { role: 'radiogroup', style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
        ...['yearly', 'monthly'].filter((p) => plans[p]).map(planCard)));
      out.push(h('button', { class: 'btn primary block', type: 'button', onclick: buy, disabled: busy ? true : null }, icon('Crown', 20), t('pr_subscribe')));
    }
    if (msg) out.push(notice(msg[0], msg[0] === 'ok' ? 'CircleCheck' : 'Info', null, t(msg[1])));
    if (!premium.isPremium()) out.push(h('button', { class: 'btn ghost block', type: 'button', onclick: restore, disabled: busy ? true : null, text: t('pr_restore') }));
    out.push(h('p', { class: 'muted small', text: t('pr_terms') }));
    put(body, ...out);
  }
  const off = premium.onChange(() => draw());
  load();
  return { el, destroy: off, resume: () => premium.refresh() };
}
