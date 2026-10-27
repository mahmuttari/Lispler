// The country outlines of data/world.json (see tools/gen_world.mjs). Pure functions, so the data can be checked in Node.

/** the rings are delta-coded integers in 1/100 degree: [x0, y0, dx, dy, dx, dy ...] -> [[lat, lon], ...] */
export function decodeRing(flat) {
  const out = [];
  let x = 0, y = 0;
  for (let i = 0; i < flat.length; i += 2) { x += flat[i]; y += flat[i + 1]; out.push([y / 100, x / 100]); }
  return out;
}

/** is the point inside the ring ([[lat, lon], ...])? (even-odd rule; fine for outlines that do not cross the date line) */
export function pointInRing(lat, lon, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [yi, xi] = ring[i], [yj, xj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** the country code whose outline contains the point, or '' */
export function countryAt(world, lat, lon) {
  for (const c of world.countries) for (const r of c.rings) if (pointInRing(lat, lon, decodeRing(r))) return c.cc;
  return '';
}
