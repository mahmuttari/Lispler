// Everything the app remembers between runs: one JSON object in localStorage (every access is guarded: it can be blocked or empty).
import { C, isC } from './complex.js';
import { makeCtx } from './engine.js';
import { detectLang, langInfo } from './i18n.js';

const KEY = 'calqora.v1';
const lang0 = detectLang(typeof navigator !== 'undefined' ? navigator.language : '');

export const S = {
  settings: { lang: lang0, theme: 'auto', angle: 'deg', complex: false, fmt: 'norm', digits: 4, comma: langInfo(lang0).comma, polar: false, gAngle: 'rad' },
  vars: { a: 0, b: 0, c: 0, d: 0, x: 0, y: 0, m: 0 },
  ans: 0,
  expr: '',
  history: [],
  matrices: null,
  graph: null,
  units: null,   // the units tab: page (units / constants), category, unit and value (1.0.0 saved it but never read it back)
  premium: { active: false, plan: null, checkedAt: 0 },   // the ad-free membership as the store last told us
};

function revive(v) { return (v && typeof v === 'object' && 'im' in v) ? C(v.re, v.im) : v; }

(function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!raw || typeof raw !== 'object') return;
    Object.assign(S.settings, raw.settings || {});
    for (const k of Object.keys(S.vars)) if (raw.vars && raw.vars[k] !== undefined) S.vars[k] = revive(raw.vars[k]);
    S.ans = revive(raw.ans ?? 0);
    S.expr = typeof raw.expr === 'string' ? raw.expr : '';
    S.history = Array.isArray(raw.history) ? raw.history.slice(0, 100) : [];
    S.matrices = raw.matrices || null;
    S.graph = raw.graph || null;
    S.units = raw.units && typeof raw.units === 'object' ? raw.units : null;
    if (raw.premium && typeof raw.premium === 'object') Object.assign(S.premium, raw.premium);
  } catch (e) { /* first run, or storage unavailable */ }
})();

let timer = 0;
export function save(now) {
  clearTimeout(timer);
  const write = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } };
  if (now) write(); else timer = setTimeout(write, 300);
}
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (document.hidden) save(true); });

// the engine context and the display options that follow from the settings
export function ctxOf(over) {
  const s = S.settings;
  return makeCtx(Object.assign({ angle: s.angle, complex: s.complex, comma: s.comma, ans: S.ans, vars: S.vars }, over || {}));
}
export function fmtOpts(pretty = true) {
  const s = S.settings;
  return { mode: s.fmt, digits: s.digits, comma: s.comma, pretty, polar: s.polar, angle: s.angle };
}
export { isC };
