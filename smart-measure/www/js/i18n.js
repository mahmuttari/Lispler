// Dil: İngilizce ve Türkçe (özgün uygulamanın iki dili). "Sistem" seçiliyse telefonun dili Türkçeyse Türkçe, değilse
// İngilizce. Eksik anahtar İngilizceye, o da yoksa anahtarın kendisine düşer (tarayıcı sınaması bunu yakalar).
// iPhone'da "_ios" ikizi olan anahtar (pr_terms_ios …) ikizini gösterir: Google Play yerine App Store metinleri.
import en from './lang/en.js';
import tr from './lang/tr.js';
import { num as fmtNum } from './olcum/birim.js';
import { isIOS } from './native.js';

export const DICTS = { en, tr };
let lang = 'en';

export function systemLang() {
  const l = String((navigator.languages && navigator.languages[0]) || navigator.language || 'en').toLowerCase();
  return l.startsWith('tr') ? 'tr' : 'en';
}

export function setLang(pref) {
  lang = pref === 'tr' || pref === 'en' ? pref : systemLang();
  document.documentElement.lang = lang;
  return lang;
}

export const getLang = () => lang;

/** t('cm_live_distance', '1,2 m') → "Sizden 1,2 m" */
export function t(key, ...args) {
  const s = (isIOS ? DICTS[lang][key + '_ios'] ?? DICTS.en[key + '_ios'] : undefined) ?? DICTS[lang][key] ?? DICTS.en[key];
  if (s === undefined) {
    console.warn('i18n: anahtar yok', key);
    return key;
  }
  return args.length ? s.replace(/\{(\d)\}/g, (m, n) => (args[n - 1] !== undefined ? String(args[n - 1]) : m)) : s;
}

export const num = (v, digits = 0) => fmtNum(v, digits, lang);
