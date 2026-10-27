// Qibla maths: the direction and the distance from a place to the Kaaba, the great-circle path, and the compass-heading helpers.
// Everything here is pure (no DOM, no sensors) so it can be tested in Node.

export const KAABA = { lat: 21.422487, lon: 39.826206 };   // the Kaaba, Mecca
const RAD = Math.PI / 180, DEG = 180 / Math.PI;
const EARTH_KM = 6371.0088;                                // mean radius (IUGG)

export const norm360 = a => ((a % 360) + 360) % 360;
/** signed shortest difference b - a in (-180, 180] */
export const angleDiff = (a, b) => { const d = norm360(b - a); return d > 180 ? d - 360 : d; };

/** initial bearing (degrees clockwise from TRUE north, 0..360) of the great circle from point 1 to point 2 */
export function bearing(lat1, lon1, lat2, lon2) {
  const p1 = lat1 * RAD, p2 = lat2 * RAD, dl = (lon2 - lon1) * RAD;
  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  return norm360(Math.atan2(y, x) * DEG);
}

/** great-circle distance in km (haversine) */
export function distanceKm(lat1, lon1, lat2, lon2) {
  const p1 = lat1 * RAD, p2 = lat2 * RAD, dp = p2 - p1, dl = (lon2 - lon1) * RAD;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

export const qiblaBearing = (lat, lon) => bearing(lat, lon, KAABA.lat, KAABA.lon);
export const kaabaDistanceKm = (lat, lon) => distanceKm(lat, lon, KAABA.lat, KAABA.lon);

/** where the point is (so close to the Kaaba that a direction is meaningless) */
export const atKaaba = (lat, lon) => kaabaDistanceKm(lat, lon) < 0.05;

/**
 * n + 1 points [lat, lon] along the great circle from point 1 to point 2. The longitudes are continued (never jump by 360) so a map draws one line.
 */
export function greatCircle(lat1, lon1, lat2, lon2, n = 64) {
  const p1 = lat1 * RAD, l1 = lon1 * RAD, p2 = lat2 * RAD, l2 = lon2 * RAD;
  const d = 2 * Math.asin(Math.min(1, Math.sqrt(Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin((l2 - l1) / 2) ** 2)));
  const out = [];
  if (d < 1e-9) return [[lat1, lon1], [lat2, lon2]];
  let prev = lon1;
  for (let i = 0; i <= n; i++) {
    const f = i / n, a = Math.sin((1 - f) * d) / Math.sin(d), b = Math.sin(f * d) / Math.sin(d);
    const x = a * Math.cos(p1) * Math.cos(l1) + b * Math.cos(p2) * Math.cos(l2);
    const y = a * Math.cos(p1) * Math.sin(l1) + b * Math.cos(p2) * Math.sin(l2);
    const z = a * Math.sin(p1) + b * Math.sin(p2);
    const lat = Math.atan2(z, Math.hypot(x, y)) * DEG;
    let lon = Math.atan2(y, x) * DEG;
    while (lon - prev > 180) lon -= 360;
    while (lon - prev < -180) lon += 360;
    prev = lon;
    out.push([lat, lon]);
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------- the compass
/**
 * Compass heading (degrees clockwise from the sensor's north) that the top edge of the phone points to, from the three rotation angles of a
 * deviceorientation event (alpha = around the vertical axis, beta = front-back tilt, gamma = left-right tilt, all in degrees).
 * Held flat the top edge is the reference. When the phone is stood up the top edge points at the sky and means nothing,
 * so the direction the BACK of the phone faces is used instead (the way one aims a camera).
 */
export function headingFromOrientation(alpha, beta, gamma) {
  const a = alpha * RAD, b = beta * RAD, g = gamma * RAD;
  const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), cg = Math.cos(g), sg = Math.sin(g);
  // the phone's axes in the earth frame (x east, y north, z up): R = Rz(alpha) Rx(beta) Ry(gamma)
  const flat = cb * cg;                                   // how much the screen faces the sky (1 = lying flat)
  if (flat > 0.5) return norm360(Math.atan2(-sa * cb, ca * cb) * DEG);   // top edge: east -sin(a)cos(b), north cos(a)cos(b)
  const east = -(ca * sg + sa * sb * cg), north = -(sa * sg - ca * sb * cg);   // back of the phone
  return norm360(Math.atan2(east, north) * DEG);
}

/**
 * The same heading from Android's rotation matrix R (row-major, 9 numbers: device axes -> world east / north / up, MAGNETIC north), which the native
 * Compass plugin delivers. R[8] is how much the screen faces the sky; R[1], R[4] the top edge (device y) in east / north; -R[2], -R[5] the back of the phone.
 */
export function headingFromMatrix(R) {
  if (R[8] > 0.5) return norm360(Math.atan2(R[1], R[4]) * DEG);
  return norm360(Math.atan2(-R[2], -R[5]) * DEG);
}

/** exponential smoothing of an angle on the circle (no jump at 0/360); k = 0..1, bigger follows faster */
export function smoothAngle(prev, next, k) {
  if (prev === null || prev === undefined || Number.isNaN(prev)) return norm360(next);
  return norm360(prev + k * angleDiff(prev, next));
}

// ---------------------------------------------------------------------------------------------------------- numbers for the screen
const group = (digits, sep) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, sep);

/** 151.23 -> "151,2" (decimal comma) or "151.2"; one decimal like the design */
export function fmtDeg(deg, comma = false) {
  const r = Math.round(norm360(deg) * 10) / 10;
  const s = (r >= 360 ? 0 : r).toFixed(1);
  return comma ? s.replace('.', ',') : s;
}

/** 2867.3 -> "2.867" with the thousands separator of the language (the dot of the design), no decimals */
export function fmtKm(km, thousands = '.') {
  return group(String(Math.round(km)), thousands);
}

/** a coordinate with its hemisphere letter, 4 decimals: fmtCoord(41.0082, 'N', 'S') -> "41.0082° N" */
export function fmtCoordPart(v, pos, neg, comma = false) {
  const s = Math.abs(v).toFixed(4);
  return (comma ? s.replace('.', ',') : s) + '° ' + (v < 0 ? neg : pos);
}
