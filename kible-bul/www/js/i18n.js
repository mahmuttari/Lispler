// Languages. Every language is one module, lang/<code>.js:  { name, dir, ui: {key: text} }.
// The chosen language is loaded on demand (loadLang); English is always loaded as the fallback for a missing key.
// t('key', arg0, arg1...) replaces {0}, {1}...

// code, name in its own language, direction, decimal comma?, thousands separator
export const LANGS = [
  { code: 'en', name: 'English', dir: 'ltr', comma: false, thousands: ',' },
  { code: 'tr', name: 'Türkçe', dir: 'ltr', comma: true, thousands: '.' },
  { code: 'de', name: 'Deutsch', dir: 'ltr', comma: true, thousands: '.' },
  { code: 'fr', name: 'Français', dir: 'ltr', comma: true, thousands: ' ' },
  { code: 'es', name: 'Español', dir: 'ltr', comma: true, thousands: '.' },
  { code: 'pt', name: 'Português', dir: 'ltr', comma: true, thousands: '.' },
  { code: 'it', name: 'Italiano', dir: 'ltr', comma: true, thousands: '.' },
  { code: 'ru', name: 'Русский', dir: 'ltr', comma: true, thousands: ' ' },
  { code: 'ja', name: '日本語', dir: 'ltr', comma: false, thousands: ',' },
  { code: 'ko', name: '한국어', dir: 'ltr', comma: false, thousands: ',' },
  { code: 'ar', name: 'العربية', dir: 'rtl', comma: false, thousands: ',' },
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
export const numberFormat = () => langInfo(cur);

export function t(key, ...args) {
  const s = (dict && dict.ui[key]) ?? (fallback && fallback.ui[key]);
  if (s === undefined) return key;
  return s.replace(/\{(\d+)\}/g, (_, i) => (args[+i] === undefined || args[+i] === null) ? '' : String(args[+i]));
}

/** the name of a country (ISO 3166-1 alpha-2) in the current language, from the browser's own data; the code when it has none */
export function countryName(cc) {
  try { return new Intl.DisplayNames([cur], { type: 'region' }).of(cc) || cc; } catch (e) { return cc; }
}
