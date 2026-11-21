// The languages: every key the code uses exists, every language has exactly the keys of English with the same {n} placeholders.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANGS, detectLang, langInfo, loadLang, t, lang, countryName } from '../../www/js/i18n.js';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'www', 'js');
const placeholders = s => (String(s).match(/\{\d+\}/g) || []).sort().join('');

export async function run({ ok }) {
  // every key the code asks for: t('literal'), the two keys of a ternary, and the keys built from a list below
  const used = new Set();
  for (const f of fs.readdirSync(DIR).filter(f => f.endsWith('.js') && f !== 'i18n.js')) {
    const src = fs.readFileSync(path.join(DIR, f), 'utf8');
    for (const m of src.matchAll(/\bt\('([^']+)'/g)) if (!m[1].endsWith('.')) used.add(m[1]);
    for (const m of src.matchAll(/\bt\([^'()]*\?\s*'([^']+)'\s*:\s*'([^']+)'/g)) { used.add(m[1]); used.add(m[2]); }
  }
  for (const id of ['compass', 'map', 'mosques', 'place', 'settings']) used.add('nav.' + id);        // the tab bar
  for (const k of ['all', 'mosques', 'rooms', 'mosque', 'room']) used.add('mos.' + k);       // the mosque screen's filters and kinds (picked from a list)
  for (const id of ['green', 'gold', 'classic']) used.add('style.' + id);                  // compass styles
  for (const id of ['3d', '2d', 'off']) used.add('kaaba.' + id);                          // Kaaba picture
  for (const id of ['sat', 'map']) used.add('map.' + id);                                  // map layers
  for (const k of ['compass.denied', 'compass.disabled', 'compass.needPlace', 'compass.noSensor', 'place.denied', 'place.disabled', 'place.timeout', 'place.unavailable']) used.add(k);
  for (const k of ['source', 'native', 'web', 'fixed', 'none', 'off', 'raw', 'decl', 'true', 'qibla', 'turn', 'acc', 'field', 'expected', 'pos', 'posacc', 'posage', 'byHand', 'title', 'intro', 'corr', 'qiblaMag', 'est', 'hfield', 'dip', 'copy', 'copied']) used.add('diag.' + k);
  for (const k of ['high', 'medium', 'low', 'unreliable', 'unknown']) used.add('acc.' + k);
  for (const k of ['p.perMonth', 'p.perYear', 'p.monthly', 'p.yearly']) used.add(k);
  const mods = {};
  for (const l of LANGS) mods[l.code] = (await import('../../www/js/lang/' + l.code + '.js')).default;
  const en = mods.en;
  ok([...used].every(k => k in en.ui), 'i18n: every key used in the code exists in English', [...used].filter(k => !(k in en.ui)).join(', '));
  ok(used.size > 100, 'i18n: the scan found the keys (' + used.size + ')');

  const enKeys = Object.keys(en.ui);
  for (const l of LANGS) {
    const m = mods[l.code];
    const keys = Object.keys(m.ui);
    ok(enKeys.every(k => k in m.ui) && keys.every(k => k in en.ui), `${l.code}: same keys as English`, enKeys.filter(k => !(k in m.ui)).concat(keys.filter(k => !(k in en.ui))).join(', '));
    ok(enKeys.every(k => typeof m.ui[k] === 'string' && m.ui[k].trim() !== ''), `${l.code}: no empty strings`, enKeys.filter(k => !(m.ui[k] || '').trim()).join(', '));
    ok(enKeys.every(k => placeholders(m.ui[k]) === placeholders(en.ui[k])), `${l.code}: same {n} placeholders as English`, enKeys.filter(k => placeholders(m.ui[k]) !== placeholders(en.ui[k])).join(', '));
    ok(m.name === l.name && m.dir === l.dir, `${l.code}: name and direction match the language list`);
    if (l.code !== 'en') {
      const same = enKeys.filter(k => m.ui[k] === en.ui[k] && en.ui[k].length > 14);
      ok(same.length < 8, `${l.code}: not left in English`, same.join(', '));
    }
    ok(['coord.n', 'coord.s', 'coord.e', 'coord.w', 'unit.km'].every(k => m.ui[k] && m.ui[k].length <= 8), `${l.code}: short coordinate letters and unit`);
    ok(m.ui['app.name'].length <= 30, `${l.code}: app name fits the Play title (30)`, m.ui['app.name']);
  }
  ok(mods.ar.dir === 'rtl' && LANGS.filter(l => l.dir === 'rtl').length === 1, 'only Arabic is right-to-left');
  ok(LANGS.length === 11 && new Set(LANGS.map(l => l.code)).size === 11, 'eleven languages');
  ok(mods.tr.ui['app.name'] === 'Kıble Bul', 'the Turkish name is Kıble Bul');
  ok(['p.title', 'p.subscribe'].every(k => mods.de.ui[k] !== mods.en.ui[k]), 'membership texts are translated');

  ok(detectLang('pt-BR') === 'pt' && detectLang('ZH-cn') === 'en' && detectLang('tr_TR') === 'tr' && detectLang('') === 'en' && detectLang(undefined) === 'en' && detectLang('ar-EG') === 'ar', 'detectLang');
  ok(langInfo('xx').code === 'en', 'an unknown language code falls back to English');
  await loadLang('tr');
  ok(lang() === 'tr' && t('place.set', 'İstanbul') === 'Konum ayarlandı: İstanbul' && t('nonexistent.key') === 'nonexistent.key', 'loadLang + t: placeholders and missing keys');
  ok(countryName('TR') === 'Türkiye' && countryName('SA') === 'Suudi Arabistan', 'country names come from the browser (Turkish)', countryName('TR') + ' / ' + countryName('SA'));
  await loadLang('ar');
  ok(countryName('SA').includes('السعودية'), 'country names in Arabic', countryName('SA'));
  await loadLang('en');
}
