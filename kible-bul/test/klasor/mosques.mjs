// The offline mosque database (data/mosques.bin) and what the mosque screen builds from it: searching, mosque or prayer room, times, links to the maps app.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MAGIC, SCALE, HEADER_BYTES, FLAG_PRAYER_ROOM, dbBytes, parseDb, nameAt, kindOfName, looksLikeShrine, nearby, searchWidening, RADII_KM,
  walkMinutes, driveMinutes, MODES, directionsUrl, placeUrl, geoUri,
} from '../../www/js/mosques.js';
import { distanceKm } from '../../www/js/qibla.js';
import { loadLang } from '../../www/js/i18n.js';
import { distText } from '../../www/js/fmt.js';

const FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'www', 'data', 'mosques.bin');

// a database in the documented layout (tools/gen_mosques.mjs writes the real one the same way); the places must come sorted by latitude
function build(places) {
  const enc = new TextEncoder(), names = places.map(p => enc.encode(p.name || '')), nameBytes = names.reduce((s, b) => s + b.length, 0), n = places.length;
  const buf = Buffer.alloc(dbBytes(n, nameBytes));
  buf.writeUInt32LE(MAGIC, 0); buf.writeUInt32LE(n, 4); buf.writeUInt32LE(nameBytes, 8); buf.writeUInt32LE(20261022, 12);
  let at = HEADER_BYTES;
  places.forEach((p, i) => buf.writeInt32LE(Math.round(p.lat * SCALE), at + 4 * i)); at += 4 * n;
  places.forEach((p, i) => buf.writeInt32LE(Math.round(p.lon * SCALE), at + 4 * i)); at += 4 * n;
  let off = 0;
  names.forEach((b, i) => { buf.writeUInt32LE(off, at + 4 * i); off += b.length; });
  buf.writeUInt32LE(off, at + 4 * n); at += 4 * (n + 1);
  places.forEach((p, i) => { buf[at + i] = p.room ? FLAG_PRAYER_ROOM : 0; }); at += n;
  let q = at;
  for (const b of names) { buf.set(b, q); q += b.length; }
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

export async function run({ ok }) {
  // ---- the file format
  const small = [
    { lat: 41.0000, lon: 29.0000, name: 'Merkez Camii' },
    { lat: 41.0045, lon: 29.0000, name: 'Yeni Mescit', room: true },         // 500 m north
    { lat: 41.0045, lon: 29.0060, name: 'Şehzade Camii' },                     // about 700 m north-east
    { lat: 41.0300, lon: 29.0000, name: 'مسجد النور' },                         // 3.3 km north
    { lat: 41.0540, lon: 29.0000 },                                              // 6 km north, no name
    { lat: 41.4000, lon: 29.0000, name: 'Uzak Mescid', room: true },           // 44 km north
  ];
  const db = parseDb(build(small));
  ok(db.n === 6 && db.date === 20261022 && db.lat[0] === 4100000 && db.lon[2] === 2900600, 'mosque db: header and coordinates round trip');
  ok(small.every((p, i) => nameAt(db, i) === (p.name || '')) && nameAt(db, 3) === 'مسجد النور' && nameAt(db, 4) === '', 'mosque db: names round trip (Turkish and Arabic letters, a place without a name)');
  ok([0, 1, 0, 0, 0, 1].every((f, i) => db.flags[i] === f), 'mosque db: prayer room flags');
  let threw = 0;
  try { parseDb(build(small).slice(0, 100)); } catch (e) { threw++; }
  const bad = new Uint8Array(build(small)); bad[0] = 0x58;
  try { parseDb(bad.buffer); } catch (e) { threw++; }
  ok(threw === 2, 'mosque db: a cut-short or foreign file is refused');

  // ---- searching
  const near = nearby(db, 41.0, 29.0, 1000);
  ok(near.length === 3 && near.map(x => x.i).join() === '0,1,2' && near.every((x, k) => k === 0 || near[k - 1].dist <= x.dist), 'nearby: inside the radius, nearest first', near.map(x => x.i + ':' + Math.round(x.dist)).join(' '));
  ok(Math.abs(near[1].dist - 500) < 3 && (near[1].bearing < 0.5 || near[1].bearing > 359.5), 'nearby: distance and bearing (500 m due north)', near[1].dist + ' ' + near[1].bearing);
  ok(Math.abs(near[2].bearing - 45.2) < 2 && near[1].kind === 1 && near[0].kind === 0, 'nearby: bearing north-east, the kind of each place', near[2].bearing + '');
  ok(nearby(db, 41.0, 29.0, 1000, 1).map(x => x.i).join() === '1' && nearby(db, 41.0, 29.0, 1000, 0).map(x => x.i).join() === '0,2', 'nearby: one kind only');
  ok(nearby(db, 41.0, 29.0, 100).length === 1 && nearby(db, 35.0, 29.0, 100).length === 0, 'nearby: nothing found is an empty list');

  let r = searchWidening(db, 41.0, 29.0, { want: 1 });
  ok(r.step === 0 && r.items.length === 3, 'searchWidening: the first radius is enough');
  r = searchWidening(db, 41.0, 29.0, { want: 4 });
  ok(RADII_KM[r.step] === 4 && r.items.length === 4, 'searchWidening: widens until enough are found (4 km holds four)', RADII_KM[r.step] + ' km, ' + r.items.length);
  r = searchWidening(db, 41.0, 29.0, { want: 6 });
  ok(r.step === RADII_KM.length - 1 && r.items.length === 6, 'searchWidening: the widest radius holds all six', RADII_KM[r.step] + ' km, ' + r.items.length);
  r = searchWidening(db, 41.0, 29.0, { want: 50 });
  ok(r.step === RADII_KM.length - 1 && r.items.length === 6, 'searchWidening: stops at the widest radius when there are fewer places than wanted');
  r = searchWidening(db, 41.0, 29.0, { want: 1, kind: 1 });
  ok(r.items.length >= 1 && r.items.every(x => x.kind === 1) && RADII_KM[r.step] === 1, 'searchWidening: one kind');

  // the antimeridian: a place just west of it is near a position just east of it (111 m apart)
  const edge = parseDb(build([{ lat: 0, lon: 179.9995 }, { lat: 0, lon: -179.9995, name: 'east' }]));
  ok(nearby(edge, 0, -179.9995, 200).length === 2 && nearby(edge, 0, 179.9995, 200).length === 2 && nearby(edge, 0, 90, 200000).length === 0, 'nearby: works across the 180th meridian');

  // ---- the real file
  const raw = fs.readFileSync(FILE), real = parseDb(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength));
  ok(real.n > 200000 && real.date > 20260101 && real.date < 20400101, 'real db: size and date', real.n + ' places, ' + real.date);
  let sorted = true, flagsOk = true, offsOk = true;
  for (let i = 1; i < real.n; i++) if (real.lat[i - 1] > real.lat[i]) { sorted = false; break; }
  for (let i = 0; i < real.n; i++) if (real.flags[i] > 1) { flagsOk = false; break; }
  for (let i = 0; i < real.n; i++) if (real.off[i] > real.off[i + 1]) { offsOk = false; break; }
  ok(sorted && flagsOk && offsOk && real.off[real.n] === real.blob.length, 'real db: sorted by latitude, flags 0/1, name offsets in order');
  let inRange = true;
  for (let i = 0; i < real.n; i++) if (Math.abs(real.lat[i]) > 9000000 || Math.abs(real.lon[i]) > 18000000) { inRange = false; break; }
  ok(inRange, 'real db: coordinates are degrees x 1e5, inside the globe');
  let rooms = 0, named = 0;
  for (let i = 0; i < real.n; i++) { rooms += real.flags[i]; if (real.off[i] !== real.off[i + 1]) named++; }
  ok(rooms > 5000 && rooms < real.n / 4 && named > real.n / 3, 'real db: a share of prayer rooms and of named places', rooms + ' rooms, ' + named + ' named');

  const city = (lat, lon, m) => nearby(real, lat, lon, m);
  ok(city(41.0082, 28.9784, 500).length >= 5, 'real db: the old town of Istanbul has mosques within 500 m', city(41.0082, 28.9784, 500).length + '');
  ok(city(21.4225, 39.8262, 500).length >= 1, 'real db: Mecca has a mosque at the Kaaba');
  ok(city(52.52, 13.405, 5000).length >= 3 && city(51.5074, -0.1278, 8000).length >= 3, 'real db: Berlin and London have mosques');
  const ocean = searchWidening(real, 0, -30, { want: 8 });
  ok(ocean.items.length === 0 && ocean.step === RADII_KM.length - 1, 'real db: nothing in the middle of the Atlantic, the search ends at the widest radius');
  const ist = searchWidening(real, 41.0082, 28.9784, { want: 8 });
  ok(ist.step === 0 && ist.items.length >= 8 && ist.items.every((x, k) => k === 0 || ist.items[k - 1].dist <= x.dist), 'real db: a dense town answers at the first radius, nearest first');

  // the search must agree with a plain scan of every place (band, longitude test, wrap-around)
  const spots = [[41.0082, 28.9784, 3000], [-6.2088, 106.8456, 5000], [30.0444, 31.2357, 10000], [-17.75, 179.99, 30000], [69.6492, 18.9553, 60000], [52.52, 13.405, 800], [21.4225, 39.8262, 2000]];
  let agree = true, why = '';
  for (const [la, lo, m] of spots) {
    const want = [];
    for (let i = 0; i < real.n; i++) if (distanceKm(la, lo, real.lat[i] / SCALE, real.lon[i] / SCALE) * 1000 <= m) want.push(i);
    const got = nearby(real, la, lo, m).map(x => x.i).sort((a, b) => a - b);
    if (want.length !== got.length || want.some((v, k) => v !== got[k])) { agree = false; why += `${la},${lo}: scan ${want.length} / search ${got.length}; `; }
  }
  ok(agree, 'real db: the search finds exactly what a scan of all places finds', why);
  const t0 = performance.now();
  for (let k = 0; k < 20; k++) searchWidening(real, 41.0082 + k * 0.01, 28.9784, { want: 10 });
  ok((performance.now() - t0) / 20 < 40, 'real db: a search takes a few milliseconds', ((performance.now() - t0) / 20).toFixed(1) + ' ms');

  // ---- mosque or prayer room, tombs and shrines
  const rooms1 = ['Yeni Mescit', 'Hacı Bayram Mescidi', 'Musalla Al-Ikhlas', 'Musholla Al-Hidayah', 'Langgar Baitul', 'Surau Nur', 'Prayer room', 'Gebetsraum', 'مصلى الحي', 'Sala de oración', 'Salle de prière', 'Sala di preghiera', 'Молельная комната'];
  const mosques1 = ['Fatih Camii', 'Masjid Al-Noor', 'Jame Masjid', 'Mezquita de Córdoba', 'مسجد النور', 'جامع الأزهر', 'Ulu Cami', '', 'Mosquée de Paris', 'Moschee Berlin'];
  ok(rooms1.every(n => kindOfName(n) === 1) && mosques1.every(n => kindOfName(n) === 0), 'kindOfName: mescit / musalla / prayer room against cami / masjid / mosque', rooms1.filter(n => kindOfName(n) !== 1).concat(mosques1.filter(n => kindOfName(n) !== 0)).join(', '));
  ok(kindOfName('Mescid-i Nebevi') === 0 && kindOfName('Mescid-i Aksa') === 0 && kindOfName('Mescid-i Haram') === 0 && kindOfName('Kuba Mescidi') === 1, 'kindOfName: the famous mosques that carry the word mescid are mosques', ['Mescid-i Nebevi', 'Mescid-i Aksa', 'Mescid-i Haram'].map(kindOfName).join());
  ok(looksLikeShrine('Seyyid Battal Gazi Türbesi') && looksLikeShrine('Dargah Sharif') && looksLikeShrine('Imam Reza Shrine') && looksLikeShrine('مرقد الإمام')
    && !looksLikeShrine('Eyüp Sultan Camii') && !looksLikeShrine('Tomb Mosque') && !looksLikeShrine('Ziyaret Mescidi') && !looksLikeShrine('') && !looksLikeShrine('Yeni Cami'), 'looksLikeShrine: tombs yes, mosques that mention one no');

  // ---- how long
  ok(walkMinutes(0) === 1 && walkMinutes(80) === 1 && walkMinutes(400) === 6 && walkMinutes(1000) === 16 && walkMinutes(3000) === 47, 'walkMinutes: 80 m a minute plus a quarter for the streets', [0, 80, 400, 1000, 3000].map(walkMinutes).join());
  let mono = true;
  for (let m = 0; m < 80000; m += 100) if (driveMinutes(m + 100) < driveMinutes(m) || walkMinutes(m + 100) < walkMinutes(m)) { mono = false; break; }
  ok(mono && driveMinutes(100) === 1 && driveMinutes(2000) >= 6 && driveMinutes(2000) <= 10 && driveMinutes(10000) >= 18 && driveMinutes(10000) <= 30 && driveMinutes(30000) >= 40 && driveMinutes(30000) <= 62, 'driveMinutes: never fewer for a longer way, plausible values', [100, 2000, 10000, 30000].map(driveMinutes).join());

  // ---- the links the maps app opens
  const to = { lat: 41.0085, lon: 28.98 }, from = { lat: 41.0082, lon: 28.9784 };
  ok(directionsUrl('walk', to) === 'https://www.google.com/maps/dir/?api=1&destination=41.008500,28.980000&travelmode=walking', 'directionsUrl: on foot, from the phone\'s own position', directionsUrl('walk', to));
  ok(directionsUrl('bus', to, from) === 'https://www.google.com/maps/dir/?api=1&origin=41.008200,28.978400&destination=41.008500,28.980000&travelmode=transit', 'directionsUrl: by bus is transit, with a start', directionsUrl('bus', to, from));
  ok(directionsUrl('car', to).endsWith('&travelmode=driving') && directionsUrl('nonsense', to).endsWith('&travelmode=walking') && MODES.walk === 'walking' && MODES.bus === 'transit' && MODES.car === 'driving', 'directionsUrl: by car is driving, an unknown mode falls back to walking');
  ok(directionsUrl('walk', { lat: -33.8688, lon: -70.6 }).includes('destination=-33.868800,-70.600000'), 'directionsUrl: south and west are negative numbers');
  ok(placeUrl(to) === 'https://www.google.com/maps/search/?api=1&query=41.008500,28.980000', 'placeUrl');
  ok(geoUri(to, 'Şehzade Camii') === 'geo:41.008500,28.980000?q=41.008500,28.980000(%C5%9Eehzade%20Camii)' && geoUri(to, 'A (b)') === 'geo:41.008500,28.980000?q=41.008500,28.980000(A%20%20b%20)' && geoUri(to) === 'geo:41.008500,28.980000?q=41.008500,28.980000', 'geoUri: the name is encoded, brackets are removed, no name is fine', geoUri(to, 'A (b)'));
  ok([directionsUrl('walk', to), placeUrl(to)].every(u => /^https:\/\/www\.google\.com\/maps\//.test(u) && !/\s/.test(u)), 'the links are https and have no spaces');

  // ---- distances as text
  await loadLang('en');
  ok(distText(85) === '85 m' && distText(142) === '140 m' && distText(1240) === '1.2 km' && distText(23000) === '23 km' && distText(64000) === '64 km', 'distText: metres by 5 and 10, then kilometres', [85, 142, 1240, 23000, 64000].map(distText).join(' | '));
  await loadLang('tr');
  ok(distText(1240) === '1,2 km' && distText(150) === '150 m', 'distText: Turkish decimal comma', distText(1240));
  await loadLang('ar');
  ok(/^1\.2/.test(distText(1240)) && distText(1240).includes(' '), 'distText: Arabic keeps Western digits', distText(1240));
  await loadLang('en');
}
