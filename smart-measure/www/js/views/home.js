// Ana sayfa: dört araç kartı (kamerayla ölçüm, su terazisi, cetvel ve açı, sensörler) ve canlı eğim / ışık değerleri.
// iPhone'da ışık ölçer yok (ortam ışığı sensörüne açık API yok): Sensörler kartında yalnız ses.
import { h } from '../dom.js';
import { icon } from '../icons.js';
import { t, num } from '../i18n.js';
import { S } from '../store.js';
import * as native from '../native.js';
import { lowPass, corrected } from '../olcum/level.js';
import * as isik from '../olcum/isik.js';
import { topbar, moreButton, tileIcon, timeOf } from './common.js';

const DEG = 180 / Math.PI;

export function render({ go }) {
  const more = moreButton(() => [
    { label: t('hm_menu_settings'), icon: 'Settings', onclick: () => go('settings') },
    { label: t('hm_menu_premium'), icon: 'Crown', onclick: () => go('premium') },
    { label: t('hm_menu_calibration'), icon: 'SlidersHorizontal', onclick: () => go('settings?s=calibration') },
    { label: t('hm_menu_accuracy'), icon: 'ShieldCheck', onclick: () => go('accuracy') },
  ]);
  const logo = h('div', { class: 'brand-logo', 'aria-hidden': 'true' }, h('img', { src: 'img/logo.svg', width: 28, height: 28, alt: '' }));
  const card = (accent, iconName, title, sub, onclick, ...body) => h('section', {
    class: `card neon tool-card press acc-${accent}`, role: 'button', tabindex: '0', 'aria-label': title,
    onclick, onkeydown: (e) => { if (e.key === 'Enter') onclick(); },
  }, h('div', { class: 'card-head' }, tileIcon(iconName, accent), h('div', { class: 'grow' }, h('h2', { text: title }), h('p', { text: sub })),
    icon('ChevronRight', 20)), ...body);
  const stop = (e) => e.stopPropagation();

  // AR
  const modes = h('div', { class: 'chips' }, [['distance', 'hm_mode_distance', 'MoveHorizontal'], ['height', 'hm_mode_height', 'MoveVertical'], ['width', 'hm_mode_width', 'RulerDimensionLine']]
    .map(([m, k, ic]) => h('button', { class: 'chip acc', type: 'button', onclick: (e) => { stop(e); go(`ar?mode=${m}`); } }, icon(ic, 16), t(k))));

  // Su terazisi (canlı eğim)
  const tiltVal = h('span', { class: 'value', text: '—' });
  const tiltSub = h('span', { class: 'muted small', text: t('lv_state_no_data') });

  // Cetvel ve açı
  const rulerChips = h('div', { class: 'chips' },
    h('button', { class: 'chip acc', type: 'button', onclick: (e) => { stop(e); go('ruler?tab=ruler'); } }, icon('Ruler', 16), t('lb_tool_ruler')),
    h('button', { class: 'chip acc', type: 'button', onclick: (e) => { stop(e); go('ruler?tab=protractor'); } }, icon('Protractor', 16), t('lb_tool_protractor')));

  // Sensörler
  const sn = S.sensors;
  const soundVal = h('span', { class: 'value', text: sn.lastSoundDb != null ? `${num(sn.lastSoundDb, 1)} ${sn.lastSoundUnit === 'dB' ? t('sn_unit_db') : t('sn_unit_dbfs')}` : '—' });
  const soundSub = h('span', { class: 'muted', text: sn.lastSoundAt ? `${t('hm_sound_last')} · ${timeOf(sn.lastSoundAt)}` : t('hm_sound_idle') });
  const luxVal = h('span', { class: 'value', text: '—' });
  const luxSub = h('span', { class: 'muted', text: t('sn_light_waiting') });
  const advice = h('p', { class: 'muted small', text: '' });

  const el = h('div', { class: 'screen' },
    topbar({ title: t('app_name'), sub: t('hm_home_subtitle'), lead: logo, actions: [more] }),
    h('div', { class: 'hero' }, icon('Sparkles', 24), h('p', { text: t('hm_home_banner') })),
    card('blue', 'Box', t('hm_ar_title'), t('hm_ar_subtitle'), () => go(`ar?mode=${S.ar.mode}`), modes),
    card('green', 'Level', t('hm_level_title'), t('hm_level_subtitle'), () => go('level'), h('div', { class: 'live' }, tiltVal, tiltSub)),
    card('orange', 'Ruler', t('hm_ruler_title'), t('hm_ruler_subtitle'), () => go('ruler'), rulerChips),
    card('yellow', 'Activity', t('hm_sensors_title'), t('hm_sensors_subtitle'), () => go(`sensors?tab=${S.sensors.tab}`),
      h('div', { class: 'mini2' },
        h('div', { class: 'mini' }, h('small', null, icon('Volume2', 14), t('hm_sound_label')), soundVal, soundSub),
        native.isIOS ? null : h('div', { class: 'mini' }, h('small', null, icon('Sun', 14), t('hm_light_label')), luxVal, luxSub)),
      native.isIOS ? null : advice));

  // Canlı akışlar: yalnız ekran görünürken
  let stops = [];
  let g = null, lastT = 0;
  function start() {
    stops.push(native.gravity((s) => {
      if (!s) { tiltVal.textContent = '—'; tiltSub.textContent = t('lv_state_no_sensor'); return; }
      const dt = lastT ? (s.t - lastT) / 1000 : 0; lastT = s.t;
      g = lowPass(g, corrected(s, S.level.cal), dt, 0.25);
      const n = Math.hypot(g.x, g.y, g.z);
      const total = Math.acos(Math.max(-1, Math.min(1, Math.abs(g.z) / n))) * DEG;
      const x = Math.atan2(-g.x, Math.abs(g.z)) * DEG, y = Math.atan2(-g.y, Math.abs(g.z)) * DEG;
      tiltVal.textContent = `${num(total, 1)}°`;
      tiltSub.textContent = `X ${num(x, 1)}° · Y ${num(y, 1)}°`;
    }));
    if (!native.isIOS) stops.push(native.light((s) => {
      if (!s) {
        luxVal.textContent = '—'; luxSub.textContent = t('hm_light_unavailable'); advice.textContent = t('hm_advice_unavailable');
        return;
      }
      const lux = s.lux;
      luxVal.textContent = `${num(lux, lux < 10 ? 1 : 0)} ${t('sn_light_unit')}`;
      luxSub.textContent = t(`hm_light_${isik.level(lux)}`);
      advice.textContent = t(`hm_advice_${isik.advice(lux)}`);
    }));
  }
  const stopAll = () => { stops.forEach((f) => f()); stops = []; };
  start();
  return { el, destroy: stopAll, pause: stopAll, resume: () => { stopAll(); start(); } };
}
