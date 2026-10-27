// Dil dosyaları: İngilizce ve Türkçe aynı anahtarlar ve aynı yer tutucular; koddaki her anahtar var; özgün uygulamanın
// bütün dizeleri korunmuş (yalnız "açık tema geliştiriliyor" notu kaldırıldı); \uXXXX kaçışı yok.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import en from '../www/js/lang/en.js';
import tr from '../www/js/lang/tr.js';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const JS = path.join(KOK, 'www', 'js');
const yer = (s) => [...s.matchAll(/\{(\d)\}/g)].map((m) => m[1]).sort().join(',');

test('en ve tr aynı anahtarlar, aynı yer tutucular, boş değer yok', () => {
  assert.deepEqual(Object.keys(tr).sort(), Object.keys(en).sort());
  for (const k of Object.keys(en)) {
    assert.ok(en[k].trim() && tr[k].trim(), `${k} boş`);
    assert.equal(yer(tr[k]), yer(en[k]), `${k} yer tutucuları`);
  }
});

test('özgün 404 dize korunur (st_theme_note bilerek kaldırıldı), Türkçe karakterler kaçışsız', () => {
  assert.ok(Object.keys(en).length >= 403 + 30);
  assert.equal(en.st_theme_note, undefined);
  for (const k of ['cm_help_text', 'lv_cal_step2', 'rl_cal_text', 'sn_safe_text_risk', 'st_acc_ruler_text', 'hm_home_banner']) assert.ok(en[k] && tr[k], k);
  for (const f of ['en.js', 'tr.js']) assert.ok(!/\\u0[0-9a-f]{3}/i.test(fs.readFileSync(path.join(JS, 'lang', f), 'utf8')), f);
  assert.match(tr.lv_level_title, /Su Terazisi/);
});

test('gizlilik metni reklamdan sonra doğru: "reklam yok / internet yok" demiyor, AdMob\'u söylüyor', () => {
  assert.ok(!/no ads|no internet/i.test(en.st_privacy_text));
  assert.ok(!/reklam yok|internet erişimi yok/i.test(tr.st_privacy_text));
  assert.match(en.st_privacy_text, /AdMob/); assert.match(tr.st_privacy_text, /AdMob/);
  assert.match(en.st_premium_text, /ad-free subscription/);
  assert.ok(!/not offered yet/.test(en.st_premium_text));
});

function kodDosyalari(d) {
  return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? (e.name === 'lang' ? [] : kodDosyalari(path.join(d, e.name))) : e.name.endsWith('.js') ? [path.join(d, e.name)] : []));
}

test('koddaki t(\'…\') anahtarları ve dinamik aileler sözlükte var', () => {
  const kod = kodDosyalari(JS).map((f) => fs.readFileSync(f, 'utf8')).join('\n');
  const anahtarlar = new Set([...kod.matchAll(/\bt\(\s*'([a-z]+_[a-z0-9_]+)'/g)].map((m) => m[1]));
  for (const m of kod.matchAll(/'((?:cm|hm|lb|lv|rl|sn|st|nav|pr|common)_[a-z0-9_]+)'/g)) anahtarlar.add(m[1]);
  const dinamik = [
    ...['surface', 'line', 'vertical'].flatMap((m) => [`lv_mode_${m}`, `lv_mode_${m}_sub`, `lv_tip_${m}_1`, `lv_tip_${m}_2`]),
    ...['very_dark', 'dim', 'normal', 'bright', 'very_bright'].flatMap((x) => [`hm_light_${x}`, `sn_level_${x}`, `sn_mark_${x}`]),
    ...['too_dim', 'dim', 'suitable', 'too_bright', 'unavailable'].map((x) => `hm_advice_${x}`),
    ...['dim', 'ok', 'bright'].flatMap((x) => [`sn_office_${x}_title`, `sn_office_${x}_text`]),
    ...['dark', 'low', 'medium', 'bright'].flatMap((x) => [`sn_plants_${x}_title`, `sn_plants_${x}_text`]),
    ...['whisper', 'library', 'office', 'traffic', 'concert'].flatMap((x) => [`sn_band_${x}`, `sn_band_${x}_title`, `sn_band_${x}_text`]),
    ...['safe', 'caution', 'risk'].flatMap((x) => [`sn_safe_title_${x}`, `sn_safe_text_${x}`]),
    ...['normal', 'loud', 'very_loud'].map((x) => `sn_status_${x}`),
    ...['live', 'average', 'max'].map((x) => `sn_mode_${x}`),
    ...['hours', 'minutes', 'seconds'].map((x) => `sn_duration_${x}`),
    ...['level', 'ar', 'ruler', 'protractor', 'sound', 'light'].flatMap((x) => [`lb_tool_${x}`, `lb_tool_${x}_sub`]),
    ...['distance', 'height', 'width'].flatMap((x) => [`cm_tab_${x}`, `cm_result_${x}`, `cm_history_${x}`]),
  ];
  for (const k of dinamik) anahtarlar.add(k);
  const eksik = [...anahtarlar].filter((k) => !(k in en));
  assert.deepEqual(eksik, []);
});
