// Languages, switchable at run time. Every language is one file in lang/:
//   text   the interface texts (all keys; the English text stands in for a missing one)
//   cat    names of the 26 categories (Turkish and English come from units.js)
//   atoms  the vocabulary of the unit names, see names.js (Turkish and English names come from units.js)
//   dir    'ltr' | 'rtl'        decimal  the decimal mark a new user starts with
import tr from './lang/tr.js';
import en from './lang/en.js';
import de from './lang/de.js';
import fr from './lang/fr.js';
import es from './lang/es.js';
import pt from './lang/pt.js';
import ru from './lang/ru.js';
import ja from './lang/ja.js';
import ar from './lang/ar.js';
import it from './lang/it.js';
import ko from './lang/ko.js';
import { compose } from './names.js';
import { foldText } from './units.js';

const PACKS = { tr, en, de, fr, es, pt, ru, ja, ar, it, ko };

/** language ids in the order of the picker */
export const LANGS = Object.keys(PACKS);
export const nativeName = id => PACKS[id].native;
export const decimalOf = id => PACKS[id].decimal;

let lang = 'tr';
export const getLang = () => lang;
export const isRtl = () => PACKS[lang].dir === 'rtl';

export function setLang(l) {
  lang = PACKS[l] ? l : 'en';
  names.clear();
  found.clear();
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
    document.documentElement.dir = PACKS[lang].dir;
  }
}

/** the locale for Intl: Arabic with Western digits (the numbers of the app are Western everywhere) */
export const locale = () => (lang === 'ar' ? 'ar-u-nu-latn' : lang);

/** the language of the device (the first of its languages that the app has), else English */
export function deviceLang() {
  const list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
  for (const l of list) {
    const id = String(l).toLowerCase().split(/[-_]/)[0];
    if (PACKS[id]) return id;
  }
  return 'en';
}

/** t('card.title', { cat: 'Uzunluk' }) */
export function t(key, vars) {
  let s = PACKS[lang].text[key];
  if (s === undefined) s = en.text[key];
  if (s === undefined) return key;
  return vars ? s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] === undefined ? '' : vars[k])) : s;
}

export const catName = c => (lang === 'tr' ? c.tr : lang === 'en' ? c.en : (PACKS[lang].cat[c.id] || c.en));

const names = new Map();   // unit -> its name in the current language (composed once)
export function unitName(u) {
  if (lang === 'tr') return u.tr;
  if (lang === 'en') return u.en;
  let s = names.get(u);
  if (s === undefined) { s = compose(u.en, PACKS[lang].atoms); names.set(u, s); }
  return s;
}

/** the symbol: international everywhere, Turkish (sa, dk, gün, tur, BG) in Turkish */
export const unitSym = u => (lang === 'tr' ? u.symTr : u.sym);

const found = new Map();   // category | unit -> folded names in the current language, for the search
/** extra text for units.search(): the names (and symbol) in the language of the screen */
export function searchText(thing) {
  let s = found.get(thing);
  if (s === undefined) {
    s = foldText(thing.units ? catName(thing) : unitName(thing) + ' ' + unitSym(thing));
    found.set(thing, s);
  }
  return s;
}

/** for the tests */
export const _packs = PACKS;
