// The whole state of the app and its persistence (localStorage, guarded: the app must run with storage blocked).
// Screens read `state`, change it through the functions below and listen with onChange.
import { CATEGORIES, FEATURED, category, unitOf } from './units.js';
import { LANGS, deviceLang, decimalOf } from './i18n.js';

const KEY = 'unitica.v1';
const HISTORY_MAX = 100;
const FAV_MAX = 60;

const listeners = new Set();
export const onChange = fn => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = what => listeners.forEach(fn => fn(what));

export const state = {
  lang: 'tr',
  theme: 'system',             // 'system' | 'light' | 'dark'
  digits: 6,                   // significant digits shown
  decimal: '.',                // '.' | ','
  notation: 'auto',            // 'auto' | 'sci'
  cat: 'length',               // the selected category
  value: '10',                 // the text in the value field
  sel: {},                     // per category: { f: unitId, t: unitId }
  history: [],                 // newest first: { c, f, t, v, r, at }
  favorites: [],               // newest first: { c, f, t }
  member: null,                // the ad-free membership as Google Play last reported it: { plan: 'monthly' | 'yearly' | null, at: ms } or null (plans.js keeps it)
};

const validDigits = n => Number.isInteger(n) && n >= 3 && n <= 12;

function load() {
  state.lang = deviceLang();
  state.decimal = decimalOf(state.lang);     // a new user starts with the decimal mark of the language of the device
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { raw = null; }
  if (!raw || typeof raw !== 'object') return;
  if (LANGS.includes(raw.lang)) state.lang = raw.lang;
  if (['system', 'light', 'dark'].includes(raw.theme)) state.theme = raw.theme;
  if (validDigits(raw.digits)) state.digits = raw.digits;
  if (raw.decimal === '.' || raw.decimal === ',') state.decimal = raw.decimal;
  if (raw.notation === 'auto' || raw.notation === 'sci') state.notation = raw.notation;
  if (category(raw.cat)) state.cat = raw.cat;
  if (typeof raw.value === 'string' && raw.value.length <= 40) state.value = raw.value;
  if (raw.sel && typeof raw.sel === 'object') {
    for (const c of CATEGORIES) {
      const s = raw.sel[c.id];
      if (s && unitOf(c, s.f) && unitOf(c, s.t)) state.sel[c.id] = { f: s.f, t: s.t };
    }
  }
  const pairOk = p => p && category(p.c) && unitOf(category(p.c), p.f) && unitOf(category(p.c), p.t);
  if (Array.isArray(raw.history)) state.history = raw.history.filter(h => pairOk(h) && typeof h.v === 'string' && Number.isFinite(h.at)).slice(0, HISTORY_MAX);
  if (Array.isArray(raw.favorites)) state.favorites = raw.favorites.filter(pairOk).slice(0, FAV_MAX).map(({ c, f, t, v }) => (typeof v === 'string' && v.length <= 40 ? { c, f, t, v } : { c, f, t }));
  const m = raw.member;
  if (m && typeof m === 'object' && [null, 'monthly', 'yearly'].includes(m.plan ?? null) && Number.isFinite(m.at)) state.member = { plan: m.plan ?? null, at: m.at };
}

let saveTimer = 0;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 150);
}
export function saveNow() {
  clearTimeout(saveTimer);
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage blocked or full: the app keeps working for this session */ }
}

load();

/** the unit pair of a category (the remembered one, else the category's default) */
export function pairOf(catId) {
  const c = category(catId);
  const s = state.sel[catId];
  return s ? { f: unitOf(c, s.f), t: unitOf(c, s.t) } : { f: unitOf(c, c.def[0]), t: unitOf(c, c.def[1]) };
}

export function setSetting(name, value) {
  state[name] = value;
  save();
  emit('settings');
}

/** the billing side (plans.js) tells the app what the store says: { plan, at } or null */
export function setMember(m) {
  state.member = m;
  save();
  emit('member');
}

/** the one question the rest of the app asks: may it show ads? The store is the source of truth (plans.js); its last answer is kept here so the app knows offline too */
export const isAdFree = () => !!state.member;

export function setValue(text) {
  state.value = text;
  save();
}

export function selectCategory(catId) {
  if (!category(catId)) return;
  state.cat = catId;
  save();
  emit('category');
}

export function setUnits(catId, f, t) {
  state.sel[catId] = { f, t };
  save();
  emit('units');
}

/** the categories of the home grid: the featured eight; a selected category outside them takes the last place */
export function gridCategories() {
  const ids = FEATURED.slice();
  if (!ids.includes(state.cat)) ids[ids.length - 1] = state.cat;
  return ids.map(category);
}

// ---------------------------------------------------------------- history
const sameEntry = (a, b) => a.c === b.c && a.f === b.f && a.t === b.t && a.v === b.v;

export function addHistory(entry) {
  const e = { ...entry, at: Date.now() };
  if (state.history[0] && sameEntry(state.history[0], e)) state.history[0].at = e.at;
  else state.history.unshift(e);
  if (state.history.length > HISTORY_MAX) state.history.length = HISTORY_MAX;
  save();
  emit('history');
}

export function clearHistory() {
  const old = state.history;
  state.history = [];
  save();
  emit('history');
  return () => { state.history = old; save(); emit('history'); };   // undo
}

export function removeHistory(index) {
  const [gone] = state.history.splice(index, 1);
  save();
  emit('history');
  return () => { state.history.splice(index, 0, gone); save(); emit('history'); };
}

// ---------------------------------------------------------------- favorites
const favIndex = (c, f, t) => state.favorites.findIndex(p => p.c === c && p.f === f && p.t === t);
export const isFavorite = (c, f, t) => favIndex(c, f, t) >= 0;

/** the value typed into the card of a favorite (kept with it, so the card shows it again); no event: the card is not redrawn while somebody types */
export function setFavoriteValue(index, text) {
  const p = state.favorites[index];
  if (!p || typeof text !== 'string' || text.length > 40) return;
  p.v = text;
  save();
}

/** toggles; returns { added, undo } */
export function toggleFavorite(c, f, t) {
  const i = favIndex(c, f, t);
  let gone = null;
  if (i >= 0) [gone] = state.favorites.splice(i, 1);
  else { state.favorites.unshift({ c, f, t }); if (state.favorites.length > FAV_MAX) state.favorites.length = FAV_MAX; }
  save();
  emit('favorites');
  return {
    added: i < 0,
    undo: () => {
      if (gone) state.favorites.splice(Math.min(i, state.favorites.length), 0, gone);
      else { const j = favIndex(c, f, t); if (j >= 0) state.favorites.splice(j, 1); }
      save();
      emit('favorites');
    },
  };
}
