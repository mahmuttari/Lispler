// Doğruluk ve kalibrasyon: her aracın ne kadar doğru olduğu ve en iyi sonucun nasıl alınacağı.
import { h } from '../dom.js';
import { t } from '../i18n.js';
import { topbar, tileIcon } from './common.js';
import { isIOS } from '../native.js';

const ITEMS = [
  ['Box', 'blue', 'st_acc_camera_title', 'st_acc_camera_text'],
  ['Level', 'green', 'st_acc_level_title', 'st_acc_level_text'],
  ['Ruler', 'orange', 'st_acc_ruler_title', 'st_acc_ruler_text'],
  ['Protractor', 'orange', 'st_acc_protractor_title', 'st_acc_protractor_text'],
  ['Activity', 'yellow', 'st_acc_sound_title', 'st_acc_sound_text'],
  ['Sun', 'yellow', 'st_acc_light_title', 'st_acc_light_text'],
].filter(([ic]) => !(isIOS && ic === 'Sun'));   // iPhone'da ışık ölçer yok

export function render({ go, back }) {
  const el = h('div', { class: 'screen' },
    topbar({ title: t('st_acc_title'), onBack: back }),
    h('p', { class: 'muted', text: t('st_acc_intro') }),
    ...ITEMS.map(([ic, acc, title, text]) => h('section', { class: `card acc-${acc}`, style: { display: 'flex', gap: '12px', alignItems: 'flex-start' } },
      tileIcon(ic, acc, 22), h('div', null, h('h2', { text: t(title) }), h('p', { class: 'muted small', style: { marginTop: '4px' }, text: t(text) })))),
    h('button', { class: 'btn primary block acc-blue', type: 'button', onclick: () => go('settings?s=calibration'), text: t('st_acc_open_cal') }));
  return { el };
}
