// Settings sheet.
import { h, icon } from './dom.js';
import { t, LANGS, langInfo } from './i18n.js';
import { S, save } from './state.js';
import { openSheet } from './sheet.js';
import { openMembership } from './ui-premium.js';
import { isPremium } from './premium.js';
import { APP } from './config.js';
import { openUrl, openExternal } from './native.js';
import { gizlilikGerekli, gizlilikSecenekleri, reklamAyarla } from './reklam.js';

// onChange(kind): 'lang' rebuilds every screen, anything else refreshes them; onClosed(): the sheet went away (app.js: a natural pause for an ad)
export function openSettings(onChange, onClosed) {
  const s = S.settings;
  const body = h('div');
  let handle;
  const seg = (items, cur, apply) => h('div', { class: 'seg' }, items.map(([id, label]) => h('button', { class: id === cur ? 'on' : '', text: label, onclick: () => { apply(id); save(); render(); } })));
  const row = (label, control, sub) => h('div', { class: 'row' }, h('div', null, h('div', { class: 'lab', text: label }), sub ? h('div', { class: 'sub', text: sub }) : null), control);
  let confirmReset = false;

  // the list of languages, each in its own language and script
  function pickLanguage() {
    let sheet;
    const list = h('div', { class: 'langlist' }, LANGS.map(l => h('button', { class: 'langrow' + (l.code === s.lang ? ' on' : ''), lang: l.code, dir: l.dir, onclick: () => {
      sheet.close();
      if (l.code === s.lang) return;
      s.lang = l.code; s.comma = l.comma;
      if (handle) handle.close();
      onChange('lang');
    } }, h('span', { text: l.name }), l.code === s.lang ? icon('check') : null)));
    sheet = openSheet({ title: t('s.language'), body: list });
  }

  function render() {
    body.replaceChildren(
      row(t('s.premium'), isPremium() ? h('span', { class: 'chip on', text: t('s.premiumOn') }) : h('button', { class: 'pill', text: t('p.removeAds'), onclick: () => { if (handle) handle.close(); openMembership(); } }), t('s.premiumSub')),
      h('div', { class: 'sec', text: t('s.general') }),
      row(t('s.language'), h('button', { class: 'pill', lang: s.lang, onclick: pickLanguage }, langInfo(s.lang).name, icon('chevron'))),
      row(t('s.theme'), seg([['auto', t('s.auto')], ['light', t('s.light')], ['dark', t('s.dark')]], s.theme, id => { s.theme = id; onChange('theme'); })),
      h('div', { class: 'sec', text: t('s.calc') }),
      row(t('s.angle'), seg([['deg', 'DEG'], ['rad', 'RAD'], ['grad', 'GRAD']], s.angle, id => { s.angle = id; onChange('calc'); })),
      row(t('s.format'), seg([['norm', 'Norm'], ['fix', 'Fix'], ['sci', 'Sci'], ['eng', 'Eng']], s.fmt, id => { s.fmt = id; onChange('calc'); }), t('s.formatSub')),
      row(t('s.digits'), h('div', { class: 'stepper' },
        h('button', { text: '−', onclick: () => { if (s.digits > 0) { s.digits--; save(); onChange('calc'); render(); } } }), h('b', { text: String(s.digits) }),
        h('button', { text: '+', onclick: () => { if (s.digits < 9) { s.digits++; save(); onChange('calc'); render(); } } }))),
      row(t('s.decimal'), seg([['dot', '1.5'], ['comma', '1,5']], s.comma ? 'comma' : 'dot', id => { s.comma = id === 'comma'; onChange('decimal'); }), t('s.decimalSub')),
      row(t('s.complex'), seg([['off', t('s.off')], ['on', t('s.on')]], s.complex ? 'on' : 'off', id => { s.complex = id === 'on'; onChange('calc'); }), t('s.complexSub')),
      row(t('s.polar'), seg([['rect', 'a+bi'], ['polar', 'r∠θ']], s.polar ? 'polar' : 'rect', id => { s.polar = id === 'polar'; onChange('calc'); })),
      h('div', { class: 'sec', text: t('s.graph') }),
      row(t('s.gangle'), seg([['rad', 'RAD'], ['deg', 'DEG'], ['grad', 'GRAD']], s.gAngle, id => { s.gAngle = id; onChange('graph'); })),
      h('div', { class: 'sec', text: t('s.data') }),
      row(t('s.reset'), h('button', { class: 'pill danger', text: confirmReset ? t('s.sure') : t('s.resetBtn'), onclick: () => {
        if (!confirmReset) { confirmReset = true; render(); return; }
        try { localStorage.clear(); } catch (e) { /* nothing to clear */ }
        location.reload();
      } }), t('s.resetSub')),
      // UMP (AdMob consent) asks for a way back to the consent choices in the EEA, the UK and Switzerland: only then this row appears
      ...(gizlilikGerekli() ? [row(t('s.adPrivacy'), h('button', { class: 'pill', text: t('s.adPrivacyBtn'), onclick: () => gizlilikSecenekleri() }), t('s.adPrivacySub'))] : []),
      h('div', { class: 'sec', text: t('s.about') }),
      h('div', { class: 'sub', style: 'line-height:1.5', text: t('s.aboutText', APP.version) }),
      row(t('s.developer'), h('span', { class: 'aboutval', text: APP.developer })),
      row(t('s.contact'), h('button', { class: 'pill link', dir: 'ltr', text: APP.email, onclick: () => openExternal('mailto:' + APP.email + '?subject=Calqora%20' + APP.version) })),
      row(t('s.privacy'), h('button', { class: 'pill', text: t('s.privacyOpen'), onclick: () => openUrl(APP.privacyUrl) })),
      row(APP.geoterva.name, h('button', { class: 'pill link', dir: 'ltr', text: APP.geoterva.url.replace(/^https:\/\//, ''), onclick: () => openUrl(APP.geoterva.url) })));
  }
  render();
  // the ad-privacy row follows UMP's answer, which may come while the sheet is open
  reklamAyarla({ degisti: () => { if (handle && document.body.contains(handle.sheet)) render(); } });
  handle = openSheet({ title: t('settings'), body, onClose: () => { reklamAyarla({ degisti: () => {} }); if (onClosed) onClosed(); } });
}
