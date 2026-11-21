// The place search and the world outlines (the data files the app ships).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'www');
// the app reads its data with fetch('data/...'); in Node the same relative address reads the file
globalThis.fetch = async url => {
  const f = path.join(APP, url);
  if (!fs.existsSync(f)) return { ok: false, status: 404 };
  return { ok: true, status: 200, text: async () => fs.readFileSync(f, 'utf8'), json: async () => JSON.parse(fs.readFileSync(f, 'utf8')) };
};

export async function run({ ok }) {
  const C = await import('../../www/js/cities.js');
  const { loadLang } = await import('../../www/js/i18n.js');
  const { decodeRing, pointInRing, countryAt } = await import('../../www/js/world.js');

  // folding: the dotted and dotless i, accents, sharp s
  ok(C.fold('İzmir') === 'izmir' && C.fold('Izmir') === 'izmir' && C.fold('ızmir') === 'izmir' && C.fold('Köln') === 'koln' && C.fold('Straße') === 'strasse' && C.fold('Łódź') === 'lodz' && C.fold('São Paulo') === 'sao paulo', 'fold');
  const rows = C.parseCities('Istanbul|TR|41.014|28.950|15702\nİzmir|TR|38.413|27.138|2938\n');
  ok(rows.length === 2 && rows[1].n === 'İzmir' && rows[1].f === 'izmir' && rows[0].pop === 15702000 && rows[0].lat === 41.014, 'parseCities');

  await loadLang('en');
  ok(await C.ensureCities() && C.citiesLoaded(), 'the place list loads');
  const txt = fs.readFileSync(path.join(APP, 'data', 'cities.txt'), 'utf8').split('\n').filter(Boolean);
  ok(txt.length > 30000 && txt.every(l => l.split('|').length === 5), 'cities.txt: ' + txt.length + ' places, five fields each');
  const first = (q, l = 3) => C.searchCities(q, l);
  ok(first('istanbul')[0].name === 'Istanbul' && first('istanbul')[0].cc === 'TR', 'search: istanbul -> Istanbul');
  ok(first('izmir')[0].cc === 'TR' && first('IZMIR')[0].name === 'İzmir', 'search: izmir finds İzmir');
  ok(first('ank')[0].name === 'Ankara', 'search: a prefix finds the big place first', first('ank')[0].name);
  ok(first('jakarta')[0].cc === 'ID' && first('mecca').concat(first('makkah')).some(p => p.cc === 'SA'), 'search: Jakarta, Mecca');
  ok(C.searchCities('', 5).length === 0 && C.searchCities('zzzzqqqq', 5).length === 0, 'search: nothing typed, nothing found');
  ok(C.searchCities('a', 10).length === 10, 'search: limit');

  // the names in the other languages
  await loadLang('tr');
  await C.ensureCities();
  ok(C.localName('Istanbul', 'TR') === 'İstanbul', 'Turkish name of Istanbul', C.localName('Istanbul', 'TR'));
  ok(C.searchCities('mekke', 5).some(p => p.cc === 'SA'), 'search by the Turkish name: mekke -> Mecca', JSON.stringify(C.searchCities('mekke', 3)));
  ok(C.searchCities('londra', 3).some(p => p.cc === 'GB'), 'search by the Turkish name: londra -> London', JSON.stringify(C.searchCities('londra', 3)));
  await loadLang('ar');
  await C.ensureCities();
  ok(C.searchCities('القاهرة', 3).some(p => p.cc === 'EG'), 'search in Arabic: Cairo');
  await loadLang('ja');
  await C.ensureCities();
  ok(C.searchCities('東京', 3).some(p => p.cc === 'JP'), 'search in Japanese: Tokyo');
  await loadLang('en');

  // the place of a position
  ok(C.nearestPlace(41.0082, 28.9784).name === 'Istanbul', 'nearestPlace: central Istanbul', JSON.stringify(C.nearestPlace(41.0082, 28.9784)));
  ok(C.nearestPlace(40.95, 29.1).name === 'Istanbul', 'nearestPlace: a suburb across the strait is still Istanbul', JSON.stringify(C.nearestPlace(40.95, 29.1)));
  ok(C.nearestPlace(0, -30) === null, 'nearestPlace: mid-Atlantic is no place');

  // the world outlines
  const world = JSON.parse(fs.readFileSync(path.join(APP, 'data', 'world.json'), 'utf8'));
  ok(world.countries.length > 200 && world.countries.every(c => /^[A-Z]{2}$/.test(c.cc) && c.rings.length && Number.isFinite(c.lat) && Number.isFinite(c.lon)), 'world.json: ' + world.countries.length + ' countries');
  ok(countryAt(world, 39.93, 32.86) === 'TR' && countryAt(world, 21.4225, 39.8262) === 'SA' && countryAt(world, 30.0444, 31.2357) === 'EG' && countryAt(world, 51.5, -0.1) === 'GB' && countryAt(world, -6.2, 106.85) === 'ID', 'the outlines put Ankara, Mecca, Cairo, London, Jakarta in the right countries');
  ok(countryAt(world, 0, -30) === '', 'the ocean belongs to no country');
  const square = decodeRing([1000, 4000, 100, 0, 0, 100, -100, 0, 0, -100]);
  ok(square.length === 5 && square[0][0] === 40 && square[0][1] === 10 && square[2][0] === 41 && square[2][1] === 11, 'decodeRing');
  ok(pointInRing(40.5, 10.5, square) && !pointInRing(42, 10.5, square), 'pointInRing');
}
