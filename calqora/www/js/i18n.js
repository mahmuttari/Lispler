// Languages. Every language is one module, lang/<code>.js:  { name, dir, ui: {key: text}, cats, units, groups, consts }.
// The chosen language is loaded on demand (loadLang); English is always loaded as the fallback for a missing key.
// t('key', arg0, arg1...) replaces {0}, {1}...

// code, name in its own language, direction, and whether the decimal separator is a comma by default
export const LANGS = [
  { code: 'en', name: 'English', dir: 'ltr', comma: false },
  { code: 'tr', name: 'Türkçe', dir: 'ltr', comma: true },
  { code: 'de', name: 'Deutsch', dir: 'ltr', comma: true },
  { code: 'fr', name: 'Français', dir: 'ltr', comma: true },
  { code: 'es', name: 'Español', dir: 'ltr', comma: true },
  { code: 'pt', name: 'Português', dir: 'ltr', comma: true },
  { code: 'it', name: 'Italiano', dir: 'ltr', comma: true },
  { code: 'ru', name: 'Русский', dir: 'ltr', comma: true },
  { code: 'ja', name: '日本語', dir: 'ltr', comma: false },
  { code: 'ko', name: '한국어', dir: 'ltr', comma: false },
  { code: 'ar', name: 'العربية', dir: 'rtl', comma: false },
];
export const langInfo = code => LANGS.find(l => l.code === code) || LANGS[0];

// the language for a phone setting such as "pt-BR": its language part when we have it, else English
export function detectLang(tag) {
  const base = String(tag || '').toLowerCase().split(/[-_]/)[0];
  return LANGS.some(l => l.code === base) ? base : 'en';
}

let cur = 'en', dict = null, fallback = null;
const cache = {};
async function module(code) {
  if (!cache[code]) cache[code] = (await import('./lang/' + code + '.js')).default;
  return cache[code];
}
export async function loadLang(code) {
  const info = langInfo(code);
  fallback = await module('en');
  dict = await module(info.code);
  cur = info.code;
}
export const lang = () => cur;
export const dir = () => langInfo(cur).dir;

export function t(key, ...args) {
  const s = (dict && dict.ui[key]) ?? (fallback && fallback.ui[key]);
  if (s === undefined) return key;
  return s.replace(/\{(\d+)\}/g, (_, i) => (args[+i] === undefined || args[+i] === null) ? '' : String(args[+i]));
}

// names of categories, units, constant groups and constants: lang/<code>.js, falling back to English
const pick = (section, a, b) => {
  const get = d => d && d[section] && (b === undefined ? d[section][a] : (d[section][a] || [])[b]);
  return get(dict) ?? get(fallback) ?? '';
};
export const catName = id => pick('cats', id);
export const unitName = (catId, index) => pick('units', catId, index);
export const groupName = id => pick('groups', id);
export const constName = (groupId, index) => pick('consts', groupId, index);
