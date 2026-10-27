// Magnetic declination (the angle between true north and the north a compass needle finds) from the World Magnetic Model 2025.
// A phone's compass sensor reports MAGNETIC north; the Qibla bearing is measured from TRUE north: the difference is this angle
// (about +6 deg east in Istanbul, about -12 deg in New York, +15 deg in Seattle...). Spherical-harmonic synthesis exactly as in the model's
// technical report (degree 12); test/wmm.test.mjs checks it against NOAA's published test values.
import { COEFFICIENTS, EPOCH } from './wmm_data.js';

const RAD = Math.PI / 180;
const A = 6378.137, F = 1 / 298.257223563, E2 = F * (2 - F), RE = 6371.2, NMAX = 12;   // WGS84 and the model's reference radius, km
const IDX = (n, m) => (n * (n + 1)) / 2 + m;

// the model's coefficients as flat tables (index n(n+1)/2 + m)
const G = new Float64Array(IDX(NMAX, NMAX) + 1), H = G.slice(), GD = G.slice(), HD = G.slice();
for (const [n, m, g, h, gd, hd] of COEFFICIENTS) { G[IDX(n, m)] = g; H[IDX(n, m)] = h; GD[IDX(n, m)] = gd; HD[IDX(n, m)] = hd; }

// Schmidt semi-normalisation factors do not depend on the place
const NORM = new Float64Array(G.length);
NORM[0] = 1;
for (let n = 1; n <= NMAX; n++) {
  NORM[IDX(n, 0)] = NORM[IDX(n - 1, 0)] * (2 * n - 1) / n;
  for (let m = 1; m <= n; m++) NORM[IDX(n, m)] = NORM[IDX(n, m - 1)] * Math.sqrt(((n - m + 1) * (m === 1 ? 2 : 1)) / (n + m));
}

// associated Legendre functions P(n,m)(x) and their derivative with respect to latitude, x = sin(geocentric latitude)
function legendre(x) {
  const z = Math.sqrt((1 - x) * (1 + x));
  const P = new Float64Array(G.length), D = new Float64Array(G.length);
  P[0] = 1;
  for (let n = 1; n <= NMAX; n++) {
    for (let m = 0; m <= n; m++) {
      const i = IDX(n, m);
      if (n === m) { const j = IDX(n - 1, m - 1); P[i] = z * P[j]; D[i] = z * D[j] + x * P[j]; }
      else if (n === 1 && m === 0) { P[i] = x * P[0]; D[i] = x * D[0] - z * P[0]; }
      else {
        const j1 = IDX(n - 2, m), j2 = IDX(n - 1, m);
        if (m > n - 2) { P[i] = x * P[j2]; D[i] = x * D[j2] - z * P[j2]; }
        else {
          const k = ((n - 1) * (n - 1) - m * m) / ((2 * n - 1) * (2 * n - 3));
          P[i] = x * P[j2] - k * P[j1]; D[i] = x * D[j2] - z * P[j2] - k * D[j1];
        }
      }
    }
  }
  for (let i = 0; i < P.length; i++) { P[i] *= NORM[i]; D[i] *= -NORM[i]; }
  return { P, D };
}

/** decimal year of a Date (UTC), e.g. 2026.806 */
export function decimalYear(date = new Date()) {
  const y = date.getUTCFullYear();
  return y + (date.getTime() - Date.UTC(y, 0, 1)) / (Date.UTC(y + 1, 0, 1) - Date.UTC(y, 0, 1));
}

/**
 * The magnetic field at a geodetic position.  latitude/longitude in degrees, height above the ellipsoid in km, time as decimal year.
 * -> { x, y, z (north, east, down; nT), h, f (nT), incl, decl (degrees; decl positive = magnetic north lies EAST of true north) }
 */
export function field(lat, lon, heightKm = 0, year = decimalYear()) {
  lat = Math.max(-89.9999, Math.min(89.9999, lat));
  const dt = year - EPOCH;
  // geodetic -> geocentric
  const sl = Math.sin(lat * RAD), cl = Math.cos(lat * RAD);
  const rc = A / Math.sqrt(1 - E2 * sl * sl);
  const xp = (rc + heightKm) * cl, zp = (rc * (1 - E2) + heightKm) * sl;
  const r = Math.hypot(xp, zp), latc = Math.asin(zp / r);
  const { P, D } = legendre(Math.sin(latc));
  const lam = lon * RAD;
  let bx = 0, by = 0, bz = 0;
  for (let n = 1; n <= NMAX; n++) {
    const rp = Math.pow(RE / r, n + 2);
    for (let m = 0; m <= n; m++) {
      const i = IDX(n, m), g = G[i] + GD[i] * dt, h = H[i] + HD[i] * dt;
      const c = Math.cos(m * lam), s = Math.sin(m * lam);
      bz -= rp * (g * c + h * s) * (n + 1) * P[i];
      by += rp * (g * s - h * c) * m * P[i];
      bx -= rp * (g * c + h * s) * D[i];
    }
  }
  by /= Math.cos(latc);
  // back to the geodetic frame
  const psi = latc - lat * RAD;
  const X = bx * Math.cos(psi) - bz * Math.sin(psi), Y = by, Z = bx * Math.sin(psi) + bz * Math.cos(psi);
  const hh = Math.hypot(X, Y);
  return { x: X, y: Y, z: Z, h: hh, f: Math.hypot(hh, Z), incl: Math.atan2(Z, hh) / RAD, decl: Math.atan2(Y, X) / RAD };
}

/** magnetic declination in degrees (east positive) for a place and a date */
export function declination(lat, lon, date = new Date(), heightKm = 0) {
  return field(lat, lon, heightKm, decimalYear(date)).decl;
}

/** the strength of the Earth's magnetic field at a place, in microtesla (25 at the equator ... 65 near the poles; about 46 in Turkey) */
export function expectedFieldUt(lat, lon, date = new Date(), heightKm = 0) {
  return field(lat, lon, heightKm, decimalYear(date)).f / 1000;
}
