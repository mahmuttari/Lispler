// The place the Qibla is measured from: the phone's own position (GPS) or a place the user chose. Everything else listens to onPlace.
import { S, save } from './state.js';
import { qiblaBearing, kaabaDistanceKm, atKaaba } from './qibla.js';
import { declination, expectedFieldUt } from './wmm.js';
import { getPosition } from './native.js';
import { ensureCities, nearestPlace, localName } from './cities.js';
import { t, countryName } from './i18n.js';

const listeners = new Set();
export const onPlace = cb => { listeners.add(cb); return () => listeners.delete(cb); };
const emit = () => listeners.forEach(f => f());

export let gps = { status: 'idle' };   // idle | busy | ok | denied | disabled | timeout | unavailable
const setGps = status => { gps = { status }; emit(); };

let cache = null;
/** { lat, lon, name, cc, mode, bearing, km, decl (magnetic declination), fieldUt (the Earth's field there, microtesla), atKaaba } for the current place, or null before there is one */
export function info() {
  const p = S.place;
  if (!p) return null;
  if (!cache || cache.lat !== p.lat || cache.lon !== p.lon) {
    cache = { lat: p.lat, lon: p.lon, bearing: qiblaBearing(p.lat, p.lon), km: kaabaDistanceKm(p.lat, p.lon), decl: declination(p.lat, p.lon), fieldUt: expectedFieldUt(p.lat, p.lon), atKaaba: atKaaba(p.lat, p.lon) };
  }
  return { ...cache, mode: p.mode, name: p.name || '', cc: p.cc || '' };
}

/** "Istanbul, Türkiye" in the current language; "Custom location" for bare coordinates */
export function placeTitle(p = S.place) {
  if (!p) return '';
  if (!p.name) return t(p.mode === 'gps' ? 'place.mine' : 'place.custom');
  const n = localName(p.name, p.cc);
  return p.cc ? n + ', ' + countryName(p.cc) : n;
}

export function setPlace(p, { remember = false } = {}) {
  S.place = { mode: p.mode, lat: p.lat, lon: p.lon, name: p.name || '', cc: p.cc || '', at: Date.now() };
  if (Number.isFinite(p.acc)) S.place.acc = p.acc;      // how exact the phone says the position is, metres
  if (remember && p.mode === 'manual') {
    const same = r => r.name === S.place.name && r.cc === S.place.cc && Math.abs(r.lat - p.lat) < 0.01 && Math.abs(r.lon - p.lon) < 0.01;
    S.recents = [{ name: S.place.name, cc: S.place.cc, lat: p.lat, lon: p.lon }, ...S.recents.filter(r => !same(r))].slice(0, 8);
  }
  save();
  emit();
}

/** asks the phone for its position (the permission prompt appears the first time) and makes it the current place */
export async function useGps() {
  if (gps.status === 'busy') return gps.status;
  setGps('busy');
  const r = await getPosition();
  if (!r.ok) { setGps(r.reason); return r.reason; }
  await ensureCities();
  const near = nearestPlace(r.lat, r.lon);
  setPlace({ mode: 'gps', lat: r.lat, lon: r.lon, name: near ? near.name : '', cc: near ? near.cc : '', acc: r.accuracy });
  setGps('ok');
  return 'ok';
}

/** when the app opens or comes back: refresh the position if the user relies on it and it is older than a quarter of an hour */
export function refreshIfStale() {
  if (S.place && S.place.mode === 'gps' && Date.now() - (S.place.at || 0) > 15 * 60 * 1000) useGps();
}
