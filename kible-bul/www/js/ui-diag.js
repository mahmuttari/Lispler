// "Compass information": the numbers behind the needle, live. For finding out why a direction looks wrong: the heading the phone reports, the declination that is added,
// how Android rates the sensor, how strong the magnetic field is against what it should be at this place, and where the position came from.
import { h } from './dom.js';
import { t } from './i18n.js';
import { S } from './state.js';
import { openSheet } from './sheet.js';
import { hold, release, getStatus, currentHeading, hasReadings } from './compass.js';
import { info, placeTitle } from './place.js';
import { assess } from './quality.js';
import { angleDiff, norm360 } from './qibla.js';
import { coordText } from './fmt.js';

const deg = v => v.toFixed(1) + '°';
const signed = v => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1) + '°';

export function openCompassInfo() {
  const KEYS = ['source', 'raw', 'decl', 'true', 'qibla', 'turn', 'acc', 'field', 'pos', 'posacc', 'posage'];
  const cells = {};
  const table = h('div', { class: 'diag' }, KEYS.map(k => { cells[k] = h('b', { text: '—' }); return h('div', { class: 'drow' }, h('span', { text: t('diag.' + k) }), cells[k]); }));
  let timer = 0;
  hold('diag');

  function update() {
    const st = getStatus(), i = info(), raw = currentHeading();
    cells.source.textContent = st.source === 'native' ? t('diag.native') : st.source === 'web' ? t('diag.web') : (hasReadings() ? t('diag.fixed') : t('diag.none'));
    cells.raw.textContent = raw === null ? '—' : deg(raw);
    cells.decl.textContent = i ? signed(i.decl) + (S.settings.trueNorth ? '' : ' (' + t('diag.off') + ')') : '—';
    const tru = raw === null ? null : norm360(raw + (S.settings.trueNorth && i ? i.decl : 0));
    cells.true.textContent = tru === null ? '—' : deg(tru);
    cells.qibla.textContent = i ? deg(i.bearing) : '—';
    if (tru !== null && i) { const d = angleDiff(tru, i.bearing); cells.turn.textContent = (d >= 0 ? '→ ' : '← ') + Math.abs(d).toFixed(1) + '°'; } else cells.turn.textContent = '—';
    const exp = i ? i.fieldUt : 0;
    const q = assess(st, exp);
    cells.acc.textContent = st.acc >= 0 ? t('acc.' + q.acc) : '—';
    cells.field.textContent = st.field > 0 ? st.field.toFixed(1) + ' µT' + (exp ? ' · ' + t('diag.expected') + ' ' + exp.toFixed(1) + ' µT (' + Math.round(st.field / exp * 100) + '%)' : '') : '—';
    cells.pos.textContent = i ? placeTitle() + ' · ' + coordText(i.lat, i.lon) : '—';
    const p = S.place;
    cells.posacc.textContent = p && p.mode === 'gps' && Number.isFinite(p.acc) ? '±' + Math.round(p.acc) + ' m' : p ? t('diag.byHand') : '—';
    const age = p && p.at ? Math.round((Date.now() - p.at) / 1000) : null;
    cells.posage.textContent = age === null ? '—' : age < 90 ? age + ' s' : Math.round(age / 60) + ' min';
  }

  update();
  timer = setInterval(update, 400);
  openSheet({ title: t('diag.title'), body: h('div', { class: 'about' }, h('p', { class: 'small', text: t('diag.intro') }), table), onClose: () => { clearInterval(timer); release('diag'); } });
}
