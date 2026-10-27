// The settings page: compass calibration, the place, the look of the compass, language, membership, about.
import { h, icon } from './dom.js';
import { t, LANGS, langInfo } from './i18n.js';
import { S, save } from './state.js';
import { openSheet } from './sheet.js';
import { eightMarkup } from './art.js';
import { info, placeTitle, onPlace } from './place.js';
import { coordText } from './fmt.js';
import { openCalibration } from './ui-calib.js';
import { openCompassInfo } from './ui-diag.js';
import { openMembership } from './ui-premium.js';
import { isPremium, onChange as onPremiumChange } from './premium.js';
import { openUrl } from './native.js';
import { ABOUT } from './config.js';
import { gizlilikSecenegiGerekli, gizlilikSecenekleriniAc } from './reklam.js';

export const VERSION = '1.1.0';   // = versionName in android/app/build.gradle (test/magaza.test.mjs checks it)

// changed(kind): 'lang' rebuilds every screen, anything else refreshes them
export function mountSettings(root, api, changed) {
  const body = h('div', { class: 'scroll' });
  root.append(
    h('header', { class: 'top sub-top' },
      h('button', { class: 'ibtn', 'aria-label': t('back'), onclick: () => api.back() }, icon('back')),
      h('h1', { text: t('settings.title') }), h('span', { class: 'ibtn ghost' })),
    body);
  const s = S.settings;

  // a settings line: icon, name, then a value with a chevron, or a switch
  const row = (ic, label, { value, onclick, toggle, sub } = {}) => {
    const el = h(toggle ? 'label' : 'button', { class: 'srow', onclick: toggle ? null : onclick },
      h('span', { class: 'sic' }, icon(ic)), h('span', { class: 'stx' }, h('b', { text: label }), sub ? h('small', { text: sub }) : null),
      toggle
        ? h('span', { class: 'switch' }, h('input', { type: 'checkbox', checked: toggle.value, onchange: e => toggle.set(e.target.checked) }), h('i'))
        : h('span', { class: 'sval' }, value ? h('span', { text: value }) : null, icon('chevron', 'chev')));
    return el;
  };

  function choose(title, options, current, apply) {
    let sheet;
    const list = h('div', { class: 'choices' }, options.map(([id, label, sub]) => h('button', { class: 'choice' + (id === current ? ' on' : ''), onclick: () => { apply(id); save(); sheet.close(); changed('look'); render(); } },
      h('span', { class: 'stx' }, h('b', { text: label }), sub ? h('small', { text: sub }) : null), id === current ? icon('check') : null)));
    sheet = openSheet({ title, body: list });
  }

  function pickLanguage() {
    let sheet;
    const list = h('div', { class: 'choices' }, LANGS.map(l => h('button', { class: 'choice' + (l.code === s.lang ? ' on' : ''), lang: l.code, dir: l.dir, onclick: () => {
      sheet.close();
      if (l.code === s.lang) return;
      s.lang = l.code; save();
      changed('lang');
    } }, h('span', { class: 'stx' }, h('b', { text: l.name })), l.code === s.lang ? icon('check') : null)));
    sheet = openSheet({ title: t('settings.language'), body: list });
  }

  function about() {
    openSheet({
      title: t('about.title'),
      body: h('div', { class: 'about' },
        h('p', { class: 'ver', text: t('about.version', VERSION) }),
        h('p', { text: t('about.text') }),
        h('h4', { text: t('about.privacy') }), h('p', { text: t('about.privacyText') }),
        h('h4', { text: t('about.data') }), h('p', { text: t('about.dataText') }),
        h('p', { class: 'small', text: t('about.note') }),
        h('div', { class: 'wrap' },
          h('button', { class: 'pill', text: t('about.compassInfo'), onclick: openCompassInfo }),
          h('button', { class: 'pill', text: t('about.policy'), onclick: () => openUrl(ABOUT.privacyUrl) })),
        h('h4', { text: t('about.developer') }),
        h('p', { class: 'dev' }, h('b', { text: ABOUT.developer }), ' · ', h('a', { href: 'mailto:' + ABOUT.email, dir: 'ltr', text: ABOUT.email })),
        // GeoTerva: the developer's own brand, a plain line (no longer an ad)
        h('p', { class: 'small' }, h('a', { href: ABOUT.geoterva, dir: 'ltr', onclick: e => { e.preventDefault(); openUrl(ABOUT.geoterva); }, text: 'geoterva.com' }))),
    });
  }

  const styleName = id => t('style.' + id) + (id === 'green' ? ' ' + t('style.default') : '');

  function render() {
    const i = info();
    body.replaceChildren(
      h('section', { class: 'card paper calcard' },
        h('h3', { text: t('settings.calibration') }),
        h('div', { class: 'eightbox', html: eightMarkup() }),
        h('p', { text: t('settings.calibrationText') }),
        h('button', { class: 'bigbtn', text: t('settings.calibrate'), onclick: openCalibration })),
      h('h3', { class: 'gh', text: t('settings.location') }),
      h('section', { class: 'card paper group' },
        h('button', { class: 'srow loc', onclick: () => api.go('place') },
          h('span', { class: 'sic big' }, icon('map-pin')),
          h('span', { class: 'stx' }, h('b', { text: i ? (i.mode === 'gps' ? t('place.mine') : placeTitle()) : t('compass.noPlace') }), i ? h('small', { text: (i.mode === 'gps' ? placeTitle() + ' · ' : '') + coordText(i.lat, i.lon) }) : null),
          icon('chevron', 'chev'))),
      h('h3', { class: 'gh', text: t('settings.look') }),
      h('section', { class: 'card paper group' },
        row('compass', t('settings.style'), { value: styleName(s.style), onclick: () => choose(t('settings.style'), ['green', 'gold', 'classic'].map(id => [id, styleName(id)]), s.style, id => { s.style = id; }) }),
        row('moon', t('settings.night'), { toggle: { value: s.night, set: v => { s.night = v; save(); changed('look'); } } }),
        row('ruler', t('settings.degrees'), { value: t(s.degrees ? 'on' : 'off'), onclick: () => choose(t('settings.degrees'), [['on', t('on')], ['off', t('off')]], s.degrees ? 'on' : 'off', id => { s.degrees = id === 'on'; }) }),
        row('image', t('settings.kaaba'), { value: t('kaaba.' + s.kaaba), onclick: () => choose(t('settings.kaaba'), [['3d', t('kaaba.3d')], ['2d', t('kaaba.2d')], ['off', t('kaaba.off')]], s.kaaba, id => { s.kaaba = id; }) }),
        row('globe', t('settings.north'), { value: t(s.trueNorth ? 'north.true' : 'north.magnetic'), onclick: () => choose(t('settings.north'), [['true', t('north.true'), t('north.trueSub')], ['magnetic', t('north.magnetic'), t('north.magneticSub')]], s.trueNorth ? 'true' : 'magnetic', id => { s.trueNorth = id === 'true'; }) }),
        row('vibrate', t('settings.vibrate'), { toggle: { value: s.vibrate, set: v => { s.vibrate = v; save(); } } }),
        row('languages', t('settings.language'), { value: langInfo(s.lang).name, onclick: pickLanguage })),
      isPremium() ? null : h('section', { class: 'card paper group' },
        h('button', { class: 'srow', onclick: openMembership },
          h('span', { class: 'sic' }, icon('megaphone-off')), h('span', { class: 'stx' }, h('b', { text: t('settings.premium') }), h('small', { text: t('settings.premiumSub') })), icon('chevron', 'chev'))),
      h('section', { class: 'card paper group' },
        // the EU consent can be changed at any time where Google's consent platform says so (EEA, UK, Switzerland)
        !isPremium() && gizlilikSecenegiGerekli() ? row('shield-check', t('settings.adPrivacy'), { onclick: () => gizlilikSecenekleriniAc() }) : null,
        row('info', t('about.title'), { onclick: about })));
  }

  onPlace(render);
  onPremiumChange(render);
  render();
  return { onShow: render, onHide() {}, refresh: render };
}
