// Uygulamanın kabuğu: yönlendirme (#/ekran?değişken), alt gezinme, tema, dil, geri düğmesi, reklam ve abonelik başlatma.
import { S } from './store.js';
import { setLang, t } from './i18n.js';
import { h, closeTopLayer, hasLayer, put } from './dom.js';
import { icon } from './icons.js';
import * as native from './native.js';
import * as reklam from './reklam.js';
import * as premium from './premium.js';
import * as home from './views/home.js';
import * as tools from './views/tools.js';
import * as historyView from './views/history.js';
import * as ar from './views/ar.js';
import * as level from './views/level.js';
import * as ruler from './views/ruler.js';
import * as sensors from './views/sensors.js';
import * as settings from './views/settings.js';
import * as premiumView from './views/premium.js';
import * as accuracy from './views/accuracy.js';

const ROUTES = {
  home: { view: home, nav: 'home' },
  tools: { view: tools, nav: 'tools' },
  favorites: { view: tools, nav: 'favorites', params: { favorites: '1' } },
  history: { view: historyView, nav: 'history' },
  ar: { view: ar, tool: true },
  level: { view: level, tool: true },
  ruler: { view: ruler, tool: true },
  sensors: { view: sensors, tool: true },
  settings: { view: settings },
  premium: { view: premiumView },
  accuracy: { view: accuracy },
};
const NAV = [
  { id: 'home', icon: 'House', label: 'nav_home' },
  { id: 'tools', icon: 'LayoutGrid', label: 'nav_tools' },
  { id: 'favorites', icon: 'Star', label: 'nav_favorites' },
  { id: 'history', icon: 'History', label: 'nav_history' },
];

const main = document.getElementById('app');
const navEl = document.getElementById('nav');
let current = null;   // { name, route, inst }

function parse(hash) {
  const m = /^#\/([a-z]+)(?:\?(.*))?$/.exec(hash || '');
  const name = m && ROUTES[m[1]] ? m[1] : 'home';
  const params = Object.fromEntries(new URLSearchParams((m && m[2]) || ''));
  return { name, params: { ...(ROUTES[name].params || {}), ...params } };
}

export function go(path, { replace = false } = {}) {
  const d = (window.history.state && window.history.state.d) || 0;
  if (replace) window.history.replaceState({ d }, '', `#/${path}`);
  else window.history.pushState({ d: d + 1 }, '', `#/${path}`);
  render();
}

export function back() {
  if (window.history.state && window.history.state.d > 0) window.history.back();
  else if (current && current.name !== 'home') go('home', { replace: true });
}

function render() {
  const { name, params } = parse(location.hash);
  const route = ROUTES[name];
  const leavingTool = current && current.route.tool && !route.tool;
  if (current && current.inst && current.inst.destroy) { try { current.inst.destroy(); } catch (e) { console.error(e); } }
  put(main);
  document.body.classList.toggle('tool-open', !!route.tool);
  document.body.classList.remove('fullscreen');
  const ctx = { params, go, back, rerender: () => render() };
  const inst = route.view.render(ctx) || {};
  if (inst.el) main.append(inst.el);
  current = { name, route, inst };
  drawNav(route.nav);
  navEl.classList.toggle('hidden', !route.nav);
  window.scrollTo(0, 0);
  reklam.ekranDegisti(name, !!route.tool);
  // Doğal durak: bir araçtan çıkılınca (kamera, mikrofon ve sensörler bu noktada kapanmıştır)
  if (leavingTool) reklam.firsat('arac-cikisi');
}

function drawNav(on) {
  put(navEl, ...NAV.map((n) => h('button', {
    type: 'button', class: n.id === on ? 'on' : '', 'aria-current': n.id === on ? 'page' : null,
    onclick: () => { if (n.id !== on) go(n.id, { replace: !!current && !current.route.tool && !!current.route.nav }); },
  }, icon(n.icon, 22), h('span', { text: t(n.label) }))));
}

// ---- tema
const darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
export function applyTheme() {
  const pref = S.settings.theme;
  const dark = pref === 'dark' || (pref !== 'light' && (darkQuery ? darkQuery.matches : true));
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  const meta = document.querySelector('meta[name=theme-color]');
  if (meta) meta.setAttribute('content', bg);
  native.setBars(dark, bg);
}
if (darkQuery && darkQuery.addEventListener) darkQuery.addEventListener('change', () => applyTheme());

export function applyLanguage() {
  setLang(S.settings.language);
  document.title = t('app_name');
  render();
}

// ---- başlangıç
setLang(S.settings.language);
document.title = t('app_name');
applyTheme();
if (!window.history.state) window.history.replaceState({ d: 0 }, '', location.hash || '#/home');
window.addEventListener('popstate', () => render());

native.onBack(() => {
  if (hasLayer()) { closeTopLayer(); return true; }
  if (current && current.inst && current.inst.onBack && current.inst.onBack()) return true;
  if (current && current.name !== 'home') { back(); return true; }
  return false;
});
native.onAppState((active) => {
  if (current && current.inst) {
    const f = active ? current.inst.resume : current.inst.pause;
    if (f) try { f(); } catch (e) { console.error(e); }
  }
  reklam.uygulamaDurumu(active);
  if (active) premium.refresh();
});

render();
// Abonelik önce sorulur: reklamsız abonede reklam SDK'sı hiç başlatılmaz (reklam.js'in başındaki kurallar).
premium.start().then(() => reklam.baslat()).catch((e) => console.warn(e));
