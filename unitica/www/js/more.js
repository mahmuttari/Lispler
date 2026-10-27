// The "More" screen: settings (they apply at once) and the information sheets.
import { CATEGORIES } from './units.js';
import { formatNumber } from './format.js';
import { LANGS, nativeName, t } from './i18n.js';
import { state, setSetting } from './state.js';
import { icon, esc, ltr, onAct } from './dom.js';
import { openSheet } from './sheet.js';
import { openMembership } from './membership.js';
import { priceLine, onPrices } from './plans.js';
import { gizlilikGerekli, gizlilikSecenekleri, reklamIzle } from './reklam.js';
import { DEVELOPER, EMAIL, PRIVACY_URL, GEOTERVA_URL } from './config.js';

const seg = (name, options, current) => `<div class="seg" role="radiogroup" data-seg="${name}">${options.map(([value, label]) =>
  `<button type="button" role="radio" aria-checked="${String(value) === String(current)}" data-act="seg" data-arg="${name}:${value}">${esc(label)}</button>`).join('')}</div>`;

const sample = () => [1 / 3, 12345.6789, 0.000012345].map(x => formatNumber(x, { digits: state.digits, notation: state.notation, decimal: state.decimal })).join('  ·  ');

let version = '';
fetch('version.json').then(r => r.json()).then(j => { version = j.version || ''; }).catch(() => {});

export function renderMore(root) {
  root.innerHTML = `<header class="bar"><h1>${esc(t('more.title'))}</h1></header>
  <div class="body">
    <button type="button" class="promo" data-act="member">${icon('sparkles')}<span><b>${esc(t('more.member'))}</b><small>${esc(priceLine())}</small></span>${icon('chevron-right', 'go')}</button>
    <h3 class="grp">${esc(t('more.settings'))}</h3>
    <div class="panel">
      <button type="button" class="link-row" data-act="lang"><span>${esc(t('set.language'))}</span><em lang="${state.lang}">${esc(nativeName(state.lang))}</em>${icon('chevron-right', 'go')}</button>
      <div class="setting"><div class="s-lbl">${esc(t('set.theme'))}</div>${seg('theme', [['system', t('set.theme.system')], ['light', t('set.theme.light')], ['dark', t('set.theme.dark')]], state.theme)}</div>
      <div class="setting"><div class="s-lbl">${esc(t('set.digits'))}<small>${esc(t('set.digits.hint'))}</small></div>
        <div class="stepper" dir="ltr"><button type="button" data-act="digits" data-arg="-1" aria-label="${esc(t('set.less'))}" ${state.digits <= 3 ? 'disabled' : ''}>${icon('minus')}</button><output aria-live="polite">${state.digits}</output><button type="button" data-act="digits" data-arg="1" aria-label="${esc(t('set.more'))}" ${state.digits >= 12 ? 'disabled' : ''}>${icon('plus')}</button></div></div>
      <div class="setting"><div class="s-lbl">${esc(t('set.decimal'))}</div>${seg('decimal', [['.', t('set.decimal.dot')], [',', t('set.decimal.comma')]], state.decimal)}</div>
      <div class="setting"><div class="s-lbl">${esc(t('set.notation'))}<small>${esc(t('set.notation.hint'))}</small></div>${seg('notation', [['auto', t('set.notation.auto')], ['sci', t('set.notation.sci')]], state.notation)}</div>
      <div class="sample" aria-hidden="true">${ltr(esc(sample()))}</div>
    </div>
    ${gizlilikGerekli() ? `<div class="panel"><button type="button" class="link-row" data-act="adPrivacy"><span>${esc(t('set.adPrivacy'))}</span>${icon('chevron-right', 'go')}</button></div>` : ''}
    <h3 class="grp">${esc(t('more.info'))}</h3>
    <div class="panel">
      <button type="button" class="link-row" data-act="assume"><span>${esc(t('info.assumptions'))}</span>${icon('chevron-right', 'go')}</button>
      <button type="button" class="link-row" data-act="about"><span>${esc(t('info.about'))}</span>${icon('chevron-right', 'go')}</button>
    </div>
  </div>`;
}

const ASSUME_KEYS = ['g', 'ton', 'imperial', 'gal', 'energy', 'pressure', 'slope', 'temp', 'donum', 'digits'];

export function mountMore(root, { rerender }) {
  // the store's prices and the ad-privacy entry arrive later: redraw the screen if it is the one on show
  const redraw = () => { if (!root.hidden) renderMore(root); };
  onPrices(redraw);
  reklamIzle(redraw);
  onAct(root, {
    adPrivacy: () => gizlilikSecenekleri(),
    seg(arg) {
      const [name, value] = arg.split(/:(.*)/s);
      setSetting(name, value);
      rerender(name);
    },
    digits(arg) {
      const n = state.digits + Number(arg);
      if (n >= 3 && n <= 12) { setSetting('digits', n); rerender('digits'); }
    },
    member: () => openMembership(),
    lang() {
      openSheet({
        title: t('set.language'),
        html: `<ul class="pick-list">${LANGS.map(id => `<li><button type="button" class="pick-row" data-lang="${id}" aria-pressed="${id === state.lang}"><span class="p-name" lang="${id}">${esc(nativeName(id))}</span>${id === state.lang ? icon('check') : ''}</button></li>`).join('')}</ul>`,
        onMount(panel, close) {
          panel.addEventListener('click', ev => {
            const b = ev.target.closest('[data-lang]');
            if (!b) return;
            close();
            if (b.dataset.lang !== state.lang) { setSetting('lang', b.dataset.lang); rerender('lang'); }
          });
        },
      });
    },
    assume() {
      openSheet({ title: t('info.assumptions'), html: `<ul class="notes">${ASSUME_KEYS.map(k => `<li>${esc(t('assume.' + k))}</li>`).join('')}</ul>` });
    },
    about() {
      const units = CATEGORIES.reduce((n, c) => n + c.units.length, 0);
      openSheet({
        title: t('info.about'),
        html: `<div class="about"><div class="about-mark">${icon('hard-hat')}</div><h3>${esc(t('app.name'))}</h3>
          <p class="muted">${esc(t('hero.1'))} ${esc(t('hero.2'))}</p>
          <p class="muted">${esc(t('about.version'))} ${esc(version || '—')} · ${esc(t('about.categories', { n: CATEGORIES.length, u: units }))}</p>
          <p>${esc(t('about.offline'))}</p>
          <ul class="about-links">
            <li><span>${esc(t('about.developer'))}</span><b>${esc(DEVELOPER)}</b></li>
            <li><span>${esc(t('about.contact'))}</span><a href="mailto:${esc(EMAIL)}" dir="ltr">${esc(EMAIL)}</a></li>
            <li><span>${esc(t('about.privacy'))}</span><a href="${esc(PRIVACY_URL)}" target="_blank" rel="noopener noreferrer">${esc(t('about.open'))}</a></li>
            <li><span>${esc(t('about.web'))}</span><a href="${esc(GEOTERVA_URL)}" target="_blank" rel="noopener noreferrer" dir="ltr">GeoTerva · geoterva.com</a></li>
          </ul></div>`,
      });
    },
  });
}
