// "Compass information": the numbers behind the needle, live. For finding out why a direction looks wrong: the heading the phone reports, the declination and the correction that are added,
// how Android rates the sensor and what the sensor thinks of itself, how strong the magnetic field is - and how it is split into its horizontal part and its dip angle - against what it
// should be at this place, and where the position came from. A button copies all of it as text.
import { h } from './dom.js';
import { t } from './i18n.js';
import { S } from './state.js';
import { openSheet, toast } from './sheet.js';
import { hold, release, getStatus, currentHeading, hasReadings } from './compass.js';
import { info, placeTitle } from './place.js';
import { assess } from './quality.js';
import { angleDiff } from './qibla.js';
import { trueHeading } from './heading.js';
import { coordText } from './fmt.js';

const deg = v => v.toFixed(1) + '°';
const signed = v => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1) + '°';

export function openCompassInfo() {
  const KEYS = ['source', 'raw', 'decl', 'corr', 'true', 'qibla', 'qiblaMag', 'turn', 'acc', 'est', 'field', 'hfield', 'dip', 'pos', 'posacc', 'posage'];
  const cells = {};
  const table = h('div', { class: 'diag' }, KEYS.map(k => { cells[k] = h('b', { text: '—' }); return h('div', { class: 'drow' }, h('span', { text: t('diag.' + k) }), cells[k]); }));
  let timer = 0;
  hold('diag');

  function update() {
    const st = getStatus(), i = info(), raw = currentHeading();
    cells.source.textContent = st.source === 'native' ? t('diag.native') : st.source === 'web' ? t('diag.web') : (hasReadings() ? t('diag.fixed') : t('diag.none'));
    cells.raw.textContent = raw === null ? '—' : deg(raw);
    cells.decl.textContent = i ? signed(i.decl) : '—';
    const corr = Number(S.settings.offset) || 0;
    cells.corr.textContent = corr ? signed(corr) : t('corr.none');
    const tru = trueHeading();
    cells.true.textContent = tru === null ? '—' : deg(tru);
    cells.qibla.textContent = i ? deg(i.bearing) : '—';
    cells.qiblaMag.textContent = i ? deg(i.magBearing) : '—';
    if (tru !== null && i) { const d = angleDiff(tru, i.bearing); cells.turn.textContent = (d >= 0 ? '→ ' : '← ') + Math.abs(d).toFixed(1) + '°'; } else cells.turn.textContent = '—';
    const exp = i ? i.fieldUt : 0, ex = i ? i.expected : null;
    const q = assess(st, exp, ex);
    cells.acc.textContent = st.acc >= 0 ? t('acc.' + q.acc) : '—';
    cells.est.textContent = st.est > 0 ? '±' + Math.round(st.est) + '°' : '—';
    cells.field.textContent = st.field > 0 ? st.field.toFixed(1) + ' µT' + (exp ? ' · ' + t('diag.expected') + ' ' + exp.toFixed(1) + ' µT (' + Math.round(st.field / exp * 100) + '%)' : '') : '—';
    const p = st.parts;
    cells.hfield.textContent = p ? p.h.toFixed(1) + ' µT' + (ex ? ' · ' + t('diag.expected') + ' ' + ex.h.toFixed(1) + ' µT (' + Math.round(p.h / ex.h * 100) + '%)' : '') : '—';
    cells.dip.textContent = p ? deg(p.dip) + (ex ? ' · ' + t('diag.expected') + ' ' + deg(ex.incl) : '') : '—';
    cells.pos.textContent = i ? placeTitle() + ' · ' + coordText(i.lat, i.lon) : '—';
    const pl = S.place;
    cells.posacc.textContent = pl && pl.mode === 'gps' && Number.isFinite(pl.acc) ? '±' + Math.round(pl.acc) + ' m' : pl ? t('diag.byHand') : '—';
    const age = pl && pl.at ? Math.round((Date.now() - pl.at) / 1000) : null;
    cells.posage.textContent = age === null ? '—' : age < 90 ? age + ' s' : Math.round(age / 60) + ' min';
  }

  // the numbers as plain text, to paste into a message
  function copy() {
    update();
    const text = 'Kible Bul ' + document.title + '\n' + KEYS.map(k => t('diag.' + k) + ': ' + cells[k].textContent).join('\n');
    const done = () => toast(t('diag.copied'));
    const fallback = () => {
      const a = document.createElement('textarea');
      a.value = text; a.style.cssText = 'position:fixed;opacity:0;left:-1000px';
      document.body.append(a); a.select();
      try { if (document.execCommand('copy')) done(); } catch (e) { /* nothing more to try */ }
      a.remove();
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(done, fallback); return; }
    } catch (e) { /* the clipboard API is not allowed here: the old way below */ }
    fallback();
  }

  update();
  timer = setInterval(update, 400);
  openSheet({
    title: t('diag.title'),
    body: h('div', { class: 'about' }, h('p', { class: 'small', text: t('diag.intro') }), table, h('button', { class: 'pill', text: t('diag.copy'), onclick: copy })),
    onClose: () => { clearInterval(timer); release('diag'); },
  });
}
