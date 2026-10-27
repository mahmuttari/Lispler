// Shell: header, tabs, theme, language, back button. Each tab is a module that mounts into its own <section>.
import { h, icon, $ } from './dom.js';
import { t, loadLang, dir } from './i18n.js';
import { S, save } from './state.js';
import { closeTop, sheetOpen } from './sheet.js';
import { mountPad, hidePad } from './pad.js';
import { mountCalc } from './ui-calc.js';
import { mountGraph } from './ui-graph.js';
import { mountMatrix } from './ui-matrix.js';
import { mountUnits } from './ui-units.js';
import { openSettings } from './ui-settings.js';
import { onBack, setBars, onResume } from './native.js';
import { openMembership } from './ui-premium.js';
import { isPremium, refresh as refreshPremium, onChange as onPremiumChange } from './premium.js';
import { reklamAyarla, dogalDurak, klavyeAcik } from './reklam.js';

const TABS = [['calc', 'calc'], ['graph', 'graph'], ['matrix', 'matrix'], ['units', 'units']];
const TOOLS = new Set(['graph', 'matrix', 'units']);   // leaving one of these is a natural pause (reklam.js)
let current = 'calc';
let tabs = {};

function applyTheme() {
  const th = S.settings.theme;
  if (th === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.dataset.theme = th;
  const dark = th === 'dark' || (th === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  setBars(dark);
  const meta = $('meta[name="theme-color"]');
  if (meta) meta.content = dark ? '#0f1318' : '#f2f4f8';
}

function build() {
  const top = $('#top'), main = $('#main'), bar = $('#tabbar');
  main.replaceChildren();
  tabs = {};
  const sections = {};
  for (const [id] of TABS) { sections[id] = h('section', { class: 'tab', id: 'tab-' + id, role: 'tabpanel' }); main.append(sections[id]); }
  mountPad();
  tabs.calc = mountCalc(sections.calc);
  tabs.graph = mountGraph(sections.graph);
  tabs.matrix = mountMatrix(sections.matrix);
  // a constant inserted into the calculation: the user carries on calculating, so this is no pause for an ad
  tabs.units = mountUnits(sections.units, { insertIntoCalc: text => { tabs.calc.insert(text); show('calc', false); } });

  top.replaceChildren(
    h('h1', { id: 'title' }),
    h('button', { class: 'ibtn', id: 'btn-noads', 'aria-label': t('p.removeAds'), onclick: openMembership }, icon('noads')),
    h('button', { class: 'ibtn', id: 'btn-history', 'aria-label': t('history'), onclick: () => tabs.calc.openHistory() }, icon('history')),
    h('button', { class: 'ibtn', 'aria-label': t('settings'), onclick: () => openSettings(changed, () => dogalDurak('ayarlar')) }, icon('settings')));
  bar.replaceChildren(...TABS.map(([id, ic]) => h('button', { role: 'tab', 'data-tab': id, onclick: () => show(id) }, icon(ic), h('span', { text: t('tab.' + id) }))));
  show(current);
}

// pause = false: the switch is part of the work (a constant was sent to the calculator), not a natural pause
function show(id, pause = true) {
  const left = current;
  current = id;
  hidePad();
  document.querySelectorAll('.tab').forEach(el => el.classList.toggle('on', el.id === 'tab-' + id));
  document.querySelectorAll('#tabbar button').forEach(b => { const on = b.dataset.tab === id; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
  $('#title').textContent = t('title.' + id);
  $('#btn-history').hidden = id !== 'calc';
  $('#btn-noads').hidden = isPremium();
  if (tabs[id] && tabs[id].onShow) tabs[id].onShow();
  if (pause && left !== id && TOOLS.has(left)) dogalDurak('sekme');
}

async function applyLang() {
  await loadLang(S.settings.lang);
  document.documentElement.lang = S.settings.lang;
  document.documentElement.dir = dir();   // Arabic is right-to-left; the keypad, the expression and the numbers stay left-to-right (css/app.css)
}

async function changed(kind) {
  save();
  applyTheme();
  if (kind === 'lang') { await applyLang(); build(); return; }
  if (kind === 'decimal') { build(); return; }
  for (const id of Object.keys(tabs)) if (tabs[id].refreshAll) tabs[id].refreshAll();
}

await applyLang();
applyTheme();
build();
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (S.settings.theme === 'auto') applyTheme(); });

// the ads (reklam.js: AdMob banner + an interstitial only at a natural pause). What counts as "typing": the soft keyboard or the number pad is
// open, or a key / field was used in the last moments; an open sheet (history, functions, membership…) also rules an interstitial out.
let lastInput = 0;
const markInput = () => { lastInput = Date.now(); };
document.addEventListener('input', markInput, true);
document.addEventListener('keydown', markInput, true);
document.addEventListener('pointerdown', e => { if (e.target && e.target.closest && e.target.closest('.key, .pad button, .chiprow button, input, textarea, select')) markInput(); }, true);
reklamAyarla({
  durum: () => ({
    gorunur: document.visibilityState === 'visible',
    yaziliyor: klavyeAcik() || !$('#pad').hidden || Date.now() - lastInput < 1500,
    sayfaAcik: sheetOpen(),
  }),
});

// the membership: ask the store at start and whenever the app comes back to the front; the ads follow the answer (premium.js)
onPremiumChange(() => { const b = $('#btn-noads'); if (b) b.hidden = isPremium(); });
refreshPremium();
onResume(refreshPremium);

onBack(() => {
  if (sheetOpen()) { closeTop(); return true; }
  if (current !== 'calc') { show('calc'); return true; }
  return false;
});
// desktop: Escape closes a sheet
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeTop(); });

