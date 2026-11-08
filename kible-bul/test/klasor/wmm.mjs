// The World Magnetic Model against NOAA's published test values (test/data/WMM2025_TEST_VALUES.txt): 12 points, every field element.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { field, declination, decimalYear } from '../../www/js/wmm.js';

const FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data', 'WMM2025_TEST_VALUES.txt');

export async function run({ ok }) {
  const rows = fs.readFileSync(FILE, 'utf8').split(/\r?\n/).filter(l => l.trim() && !l.startsWith('#')).map(l => l.trim().split(/\s+/).map(Number));
  ok(rows.length === 12, 'wmm: twelve NOAA test points', rows.length);
  for (const r of rows) {
    const [year, alt, lat, lon, X, Y, Z, H, Fm, I, D] = r;
    const f = field(lat, lon, alt, year);
    const tag = `wmm ${year} lat ${lat} lon ${lon} h ${alt}`;
    // the published values are rounded to 0.1 nT and 0.01 deg
    ok(Math.abs(f.x - X) < 0.15 && Math.abs(f.y - Y) < 0.15 && Math.abs(f.z - Z) < 0.15, tag + ': X Y Z', `got ${f.x.toFixed(1)} ${f.y.toFixed(1)} ${f.z.toFixed(1)} want ${X} ${Y} ${Z}`);
    ok(Math.abs(f.h - H) < 0.15 && Math.abs(f.f - Fm) < 0.15, tag + ': H F', `got ${f.h.toFixed(1)} ${f.f.toFixed(1)} want ${H} ${Fm}`);
    ok(Math.abs(f.incl - I) < 0.011 && Math.abs(f.decl - D) < 0.011, tag + ': inclination, declination', `got ${f.incl.toFixed(2)} ${f.decl.toFixed(2)} want ${I} ${D}`);
  }
  // places that matter for the app, today's date: the sign and rough size (a phone compass is magnetic, the Qibla bearing is true)
  const d = (lat, lon) => declination(lat, lon, new Date(Date.UTC(2026, 9, 22)));
  ok(d(41.0082, 28.9784) > 5 && d(41.0082, 28.9784) < 7.5, 'declination Istanbul about +6 deg east', d(41.0082, 28.9784).toFixed(2));
  ok(d(21.4225, 39.8262) > 3 && d(21.4225, 39.8262) < 6, 'declination Mecca about +4.5 deg', d(21.4225, 39.8262).toFixed(2));
  ok(d(-6.2, 106.85) < 1.5 && d(-6.2, 106.85) > -1.5, 'declination Jakarta near 0', d(-6.2, 106.85).toFixed(2));
  ok(d(47.6, -122.3) > 14 && d(47.6, -122.3) < 18, 'declination Seattle about +15 deg', d(47.6, -122.3).toFixed(2));
  ok(d(51.5, -0.1) > -2 && d(51.5, -0.1) < 3, 'declination London near +1', d(51.5, -0.1).toFixed(2));
  ok(Math.abs(decimalYear(new Date(Date.UTC(2026, 6, 2, 12))) - 2026.5) < 0.005 && decimalYear(new Date(Date.UTC(2025, 0, 1))) === 2025, 'decimalYear');
  ok(Number.isFinite(declination(90, 0)) && Number.isFinite(declination(-90, 180)), 'the poles do not blow up');
}
