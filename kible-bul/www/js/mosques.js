// Nearby mosques and prayer rooms. The places come from an OFFLINE database made from OpenStreetMap (data/mosques.bin, built by tools/gen_mosques.mjs) and are searched on the
// phone: no network, and the position never leaves the phone. Only the directions go to the maps app (Google Maps links, opened by the user).
// Everything in this file is pure (no DOM), so it is tested in Node (test/mosques.test.mjs).
import { distanceKm, bearing } from './qibla.js';

// ---------------------------------------------------------------------------------------------------------------- the database file
// little endian: 'KBM1', N, bytes of names, date (yyyymmdd), then lat Int32[N] (degrees x 1e5, ascending), lon Int32[N], nameOffsets Uint32[N + 1], flags Uint8[N], the names (UTF-8)
export const MAGIC = 0x314d424b;
export const SCALE = 1e5;
export const HEADER_BYTES = 16;
export const FLAG_PRAYER_ROOM = 1;      // bit 0: a small prayer place (mescit, musalla), not a mosque

/** the byte size of a database with n places and `names` bytes of names */
export const dbBytes = (n, names) => HEADER_BYTES + 12 * n + 4 + n + names;

export function parseDb(buffer) {
  const head = new DataView(buffer, 0, HEADER_BYTES);
  if (head.getUint32(0, true) !== MAGIC) throw new Error('not a mosque database');
  const n = head.getUint32(4, true), names = head.getUint32(8, true), date = head.getUint32(12, true);
  if (buffer.byteLength !== dbBytes(n, names)) throw new Error('the mosque database is cut short');
  let at = HEADER_BYTES;
  const lat = new Int32Array(buffer, at, n); at += 4 * n;
  const lon = new Int32Array(buffer, at, n); at += 4 * n;
  const off = new Uint32Array(buffer, at, n + 1); at += 4 * (n + 1);
  const flags = new Uint8Array(buffer, at, n); at += n;
  const blob = new Uint8Array(buffer, at, names);
  return { n, date, lat, lon, off, flags, blob, cache: new Map() };
}

const decoder = new TextDecoder('utf-8');
/** the name of place i ('' when it has none) */
export function nameAt(db, i) {
  const a = db.off[i], b = db.off[i + 1];
  if (a === b) return '';
  let s = db.cache.get(i);
  if (s === undefined) { s = decoder.decode(db.blob.subarray(a, b)); db.cache.set(i, s); }
  return s;
}

let loading = null;
/** loads data/mosques.bin once (a failure can be retried) */
export function loadDb(url = 'data/mosques.bin') {
  if (!loading) {
    loading = fetch(url).then(r => { if (!r.ok) throw new Error('mosques.bin ' + r.status); return r.arrayBuffer(); }).then(parseDb);
    loading.catch(() => { loading = null; });
  }
  return loading;
}

// ---------------------------------------------------------------------------------------------------------------- mosque or prayer room?
// Turkish "cami" is a mosque, "mescit" a small prayer place; Arabic masjid / jami are mosques, musalla (مصلى) a prayer room; Indonesian musholla / surau / langgar are prayer houses.
const PRAYER_ROOM = /mescit|mescid|musalla|mussalla|musholla|mushalla|mushola|surau|langgar|namazgah|namaz\s*odas|namazxana|prayer\s*(room|hall|space|house)|salle\s+de\s+pri[eè]re|sala\s+de\s+oraci|sala\s+de\s+ora[cç]|sala\s+di\s+pregh|gebets?raum|gebedsruimte|молельн|musala\b|مصلى|مصلّى|مصلي|نمازخانه|نمازخانە/iu;
const MOSQUE_WORD = /cami|mosque|masjid|mezquita|mesquita|moschee|moschea|mosqu[eé]e|مسجد|جامع|мечеть|モスク|모스크|清真寺|jame|jamia|jami|camii|cemaat|dzamija|xhami|mesjid|meczet/iu;
const SHRINE = /t[üu]rbe|ziyaret|dargah|dargha|mausoleum|tomb|shrine|makam|maqam|مزار|ضريح|مرقد|مقام|kuburan|pusara|cemetery|mezarl/iu;

// the great mosques whose Turkish name carries the word mescid (Mescid-i Nebevi, Mescid-i Aksa ...) are mosques
const GREAT_MESCID = /mescid-?i\s*(haram|nebev|ak[sş][aâ]|kuba|k[iı]bleteyn)/iu;

/** 1 for a prayer room, 0 for a mosque */
export const kindOfName = name => (name && PRAYER_ROOM.test(name) && !GREAT_MESCID.test(name) ? 1 : 0);
/** a tomb or shrine that OpenStreetMap files under "muslim place of worship" (its name says so and does not say mosque) */
export const looksLikeShrine = name => !!name && SHRINE.test(name) && !MOSQUE_WORD.test(name) && !PRAYER_ROOM.test(name);

// ---------------------------------------------------------------------------------------------------------------- searching
export const RADII_KM = [1, 2, 4, 8, 16, 32, 64];

/**
 * The places within radiusM metres of (lat, lon), nearest first: [{ i, lat, lon, dist (m), bearing (deg from true north), kind (0 mosque, 1 prayer room) }].
 * kind: null for both, or 0 / 1 to keep one sort.
 */
export function nearby(db, lat, lon, radiusM, kind = null) {
  const out = [];
  const dLat = radiusM / 111320;
  const dLon = dLat / Math.max(0.01, Math.cos(lat * Math.PI / 180));
  // the places are sorted by latitude: binary search the first one inside the band, then walk up
  const lo = Math.round((lat - dLat) * SCALE), hi = Math.round((lat + dLat) * SCALE);
  let a = 0, b = db.n;
  while (a < b) { const m = (a + b) >> 1; if (db.lat[m] < lo) a = m + 1; else b = m; }
  for (let i = a; i < db.n && db.lat[i] <= hi; i++) {
    const pLat = db.lat[i] / SCALE, pLon = db.lon[i] / SCALE;
    let d = Math.abs(pLon - lon); if (d > 180) d = 360 - d;
    if (d > dLon) continue;
    const k = db.flags[i] & FLAG_PRAYER_ROOM;
    if (kind !== null && k !== kind) continue;
    const dist = distanceKm(lat, lon, pLat, pLon) * 1000;
    if (dist <= radiusM) out.push({ i, lat: pLat, lon: pLon, dist, bearing: bearing(lat, lon, pLat, pLon), kind: k });
  }
  out.sort((x, y) => x.dist - y.dist);
  return out;
}

/**
 * The nearest places: starts at the first radius and widens until at least `want` places are found (or the biggest radius is reached).
 * -> { items, step (index in RADII_KM of the radius that was used) }
 */
export function searchWidening(db, lat, lon, { kind = null, want = 8, step = 0 } = {}) {
  let s = Math.max(0, Math.min(step, RADII_KM.length - 1)), items = nearby(db, lat, lon, RADII_KM[s] * 1000, kind);
  while (items.length < want && s < RADII_KM.length - 1) { s++; items = nearby(db, lat, lon, RADII_KM[s] * 1000, kind); }
  return { items, step: s };
}

// ---------------------------------------------------------------------------------------------------------------- how long, how to get there
/** minutes on foot: streets run about a quarter longer than the straight line, 80 m a minute (4.8 km/h) */
export const walkMinutes = m => Math.max(1, Math.round(m * 1.25 / 80));
/** minutes by car, door to door: the first 4 km of the way are town (24 km/h, lights and parking), up to 15 km 36 km/h, the rest 54 km/h; plus a minute to start and park */
export function driveMinutes(m) {
  const route = m * 1.3;                                          // the road is about a third longer than the straight line
  const town = Math.min(route, 4000), mid = Math.max(0, Math.min(route, 15000) - 4000), far = Math.max(0, route - 15000);
  return Math.max(1, Math.round(town / 400 + mid / 600 + far / 900 + 1));
}

export const MODES = { walk: 'walking', bus: 'transit', car: 'driving' };

const ll = p => p.lat.toFixed(6) + ',' + p.lon.toFixed(6);
/**
 * A Google Maps link that opens the directions to the place in the maps app (or the browser) in the given mode ('walk' | 'bus' | 'car').
 * from: where to start; leave it out and the maps app starts at the phone's own position.
 */
export function directionsUrl(mode, to, from) {
  return 'https://www.google.com/maps/dir/?api=1' + (from ? '&origin=' + ll(from) : '') + '&destination=' + ll(to) + '&travelmode=' + (MODES[mode] || 'walking');
}
/** the place on the map (a pin) */
export const placeUrl = to => 'https://www.google.com/maps/search/?api=1&query=' + ll(to);
/** the geo: link every maps app understands (the phone offers its installed ones) */
export const geoUri = (to, name) => 'geo:' + ll(to) + '?q=' + ll(to) + (name ? '(' + encodeURIComponent(name.replace(/[()]/g, ' ')) + ')' : '');
