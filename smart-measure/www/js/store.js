// Uygulamanın kalıcı durumu: tek bir JSON, telefonun WebView deposunda (localStorage). Hiçbir şey telefondan çıkmaz.
// Özgün uygulamanın DataStore kayıtlarının karşılıkları: AppSettings, LevelPrefs, RulerPrefs, SensorsPrefs,
// geçmiş ve favoriler. "Tüm verileri sil" bunların hepsini siler; reklam sayaçları ve abonelik önbelleği kalır
// (kullanıcı verisi değildir; abonelik her açılışta Google Play'den yeniden sorulur).
import { TOLERANCE } from './olcum/level.js';
import { GUIDES, ARMS } from './olcum/cetvel.js';

const KEY = 'smartmeasure.v1';
const KEY_SYS = 'smartmeasure.sys';
export const HISTORY_MAX = 200;

export function defaults() {
  return {
    settings: { theme: 'system', language: 'system', units: 'metric', cameraHeight: null },
    level: { mode: 'surface', unit: 'deg', tolerance: TOLERANCE.default, vibrate: true, sound: false, cal: null, ref: {} },
    ruler: { unit: 'mm', scaleX: 1, scaleY: 1, calibrated: false, tab: 'ruler', guides: { ...GUIDES.horizontal },
      vguides: { ...GUIDES.vertical }, arms: { ...ARMS }, view: 'inner' },
    sensors: { tab: 'sound', mode: 'live', offsetDb: null, lastSoundDb: null, lastSoundUnit: null, lastSoundAt: null, lastLux: null, lastLuxAt: null },
    ar: { mode: 'distance' },
    favorites: [],
    history: [],
  };
}

function read(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; }
}
function write(key, v) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* dolu ya da kapalı */ }
}

/** Kayıtlı durumu varsayılanlarla birleştirir (yeni alanlar eksikse varsayılan gelir). */
function merge(base, saved) {
  if (!saved || typeof saved !== 'object' || Array.isArray(base)) return saved ?? base;
  const out = { ...base };
  for (const k of Object.keys(saved)) {
    out[k] = base[k] && typeof base[k] === 'object' && !Array.isArray(base[k]) ? merge(base[k], saved[k]) : saved[k];
  }
  return out;
}

export const S = merge(defaults(), read(KEY));
if (!Array.isArray(S.history)) S.history = [];
if (!Array.isArray(S.favorites)) S.favorites = [];

/** Kullanıcı verisi olmayan sistem kayıtları: reklam sayaçları, abonelik önbelleği. */
export const SYS = Object.assign({ reklam: null, premium: null }, read(KEY_SYS) || {});

export const save = () => write(KEY, S);
export const saveSys = () => write(KEY_SYS, SYS);

const listeners = new Set();
export function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function changed(what) { save(); listeners.forEach((f) => { try { f(what); } catch (e) { console.error(e); } }); }

export function addHistory(tool, label, value, note = '') {
  const r = new Uint32Array(1);
  try { crypto.getRandomValues(r); } catch (err) { r[0] = S.history.length; }
  const e = { id: `${Date.now().toString(36)}${r[0].toString(36)}`, time: Date.now(), tool, label, value, note };
  S.history.unshift(e);
  if (S.history.length > HISTORY_MAX) S.history.length = HISTORY_MAX;
  changed('history');
  return e;
}

export function toggleFavorite(id) {
  const i = S.favorites.indexOf(id);
  if (i >= 0) S.favorites.splice(i, 1); else S.favorites.push(id);
  changed('favorites');
  return i < 0;
}

/** "Tüm verileri sil": geçmiş, favoriler, kalibrasyonlar ve ayarlar. */
export function deleteAll() {
  const d = defaults();
  for (const k of Object.keys(S)) delete S[k];
  Object.assign(S, d);
  try { localStorage.removeItem(KEY); } catch (e) { /* yok */ }
  changed('all');
}
