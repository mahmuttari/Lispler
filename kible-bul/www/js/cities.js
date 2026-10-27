// The offline place search: ~34 000 places of 15 000+ people (data/cities.txt, GeoNames) with their names in the app's languages (data/cities.<lang>.txt).
// Lines: "name|CC|lat|lon|population in thousands", biggest first; the language files hold "row|name".
import { lang } from './i18n.js';
import { distanceKm } from './qibla.js';

let rows = null, loading = null;          // rows[i] = { n, cc, lat, lon, pop, f }   (f: the folded name for searching)
const local = {};                         // lang -> Map(row -> name)
const localFolded = {};                   // lang -> Map(row -> folded name)
const keyIndex = new Map();               // "name|CC" -> row

/** lower case, no accents; dotless and dotted i are the same letter, as are ß/ss: so "izmir", "İzmir", "Izmir" and "ızmir" find each other */
export function fold(s) {
  return String(s).replace(/İ/g, 'i').replace(/ı/g, 'i').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/ß/g, 'ss').replace(/æ/g, 'ae').replace(/œ/g, 'oe').replace(/ø/g, 'o').replace(/đ/g, 'd').replace(/ł/g, 'l').replace(/ð/g, 'd').replace(/þ/g, 'th');
}

export function parseCities(text) {
  const out = [];
  for (const line of text.split('\n')) {
    if (!line) continue;
    const c = line.split('|');
    out.push({ n: c[0], cc: c[1], lat: +c[2], lon: +c[3], pop: +c[4] * 1000, f: fold(c[0]) });
  }
  return out;
}

async function fetchText(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(url + ' ' + r.status);
  return r.text();
}

/** loads the list and the names of the current language (once each); false when the data could not be read */
export async function ensureCities() {
  try {
    if (!rows) {
      loading = loading || fetchText('data/cities.txt').then(t => { rows = parseCities(t); rows.forEach((r, i) => { const k = r.n + '|' + r.cc; if (!keyIndex.has(k)) keyIndex.set(k, i); }); });
      await loading;
    }
    const l = lang();
    if (l !== 'en' && !local[l]) {
      local[l] = new Map(); localFolded[l] = new Map();
      try {
        for (const line of (await fetchText('data/cities.' + l + '.txt')).split('\n')) {
          const i = line.indexOf('|');
          if (i < 1) continue;
          const row = +line.slice(0, i), name = line.slice(i + 1);
          local[l].set(row, name); localFolded[l].set(row, fold(name));
        }
      } catch (e) { /* no names for this language: the English ones are shown */ }
    }
    return true;
  } catch (e) { return false; }
}
export const citiesLoaded = () => rows !== null;

/** the name of a place in the current language, from a stored place {name, cc} */
export function localName(name, cc) {
  const l = lang();
  if (!rows || l === 'en' || !local[l]) return name;
  const i = keyIndex.get(name + '|' + cc);
  return (i !== undefined && local[l].get(i)) || name;
}

/** places matching what was typed: names that start with it first, then names that contain it; bigger places first */
export function searchCities(query, limit = 30) {
  if (!rows) return [];
  const q = fold(query).trim();
  if (!q) return [];
  const l = lang(), lf = localFolded[l];
  const hits = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const lfn = lf && lf.get(i);
    let score = 0;
    if (r.f.startsWith(q) || (lfn && lfn.startsWith(q))) score = 3;
    else if (r.f.includes(' ' + q) || (lfn && lfn.includes(' ' + q))) score = 2;
    else if (r.f.includes(q) || (lfn && lfn.includes(q))) score = 1;
    if (score) hits.push({ i, score });
  }
  hits.sort((a, b) => b.score - a.score || rows[b.i].pop - rows[a.i].pop);
  return hits.slice(0, limit).map(h => { const r = rows[h.i]; return { name: r.n, local: (local[l] && local[l].get(h.i)) || r.n, cc: r.cc, lat: r.lat, lon: r.lon, pop: r.pop }; });
}

/**
 * The place a position belongs to, for naming it: the biggest place within 25 km (a position in a suburb of Istanbul is "Istanbul"),
 * else the nearest within 60 km. null when there is none or the list is not loaded.
 */
export function nearestPlace(lat, lon) {
  if (!rows) return null;
  let big = null, bigPop = -1, near = null, nearKm = 1e9;
  const dLat = 0.6, dLon = 0.6 / Math.max(0.2, Math.cos(lat * Math.PI / 180));
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (Math.abs(r.lat - lat) > dLat || Math.abs(r.lon - lon) > dLon) continue;
    const d = distanceKm(lat, lon, r.lat, r.lon);
    if (d <= 25 && r.pop > bigPop) { big = r; bigPop = r.pop; }
    if (d < nearKm) { near = r; nearKm = d; }
  }
  const pick = big || (near && nearKm <= 60 ? near : null);
  return pick ? { name: pick.n, cc: pick.cc } : null;
}
