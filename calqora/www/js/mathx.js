// Real-number helpers: angle units, exact trigonometry at the usual angles, gamma / factorial, combinatorics, integer functions,
// numeric derivative / integral / root finder.

export const TAU = Math.PI * 2;

// ---- angle units
export const toRad = (x, unit) => unit === 'deg' ? x * Math.PI / 180 : unit === 'grad' ? x * Math.PI / 200 : x;
export const fromRad = (r, unit) => unit === 'deg' ? r * 180 / Math.PI : unit === 'grad' ? r * 200 / Math.PI : r;
export const degTo = (d, unit) => unit === 'deg' ? d : unit === 'grad' ? d * 10 / 9 : d * Math.PI / 180;   // degrees -> current unit

// ---- trigonometry: exact values at multiples of 30 and 45 degrees, whatever the unit, so that sin(180 deg) = 0 and not 1.2e-16
const S2 = Math.SQRT1_2, S3 = Math.sqrt(3) / 2;
const SIN = { 0: 0, 30: 0.5, 45: S2, 60: S3, 90: 1, 120: S3, 135: S2, 150: 0.5, 180: 0,
  210: -0.5, 225: -S2, 240: -S3, 270: -1, 300: -S3, 315: -S2, 330: -0.5 };
const sinDeg = m => SIN[m];
const cosDeg = m => SIN[(m + 90) % 360];

export function trig(fn, x, unit) {
  const d = unit === 'deg' ? x : unit === 'grad' ? x * 0.9 : x * 180 / Math.PI;
  const k = Math.round(d / 15) * 15;
  if (Math.abs(d - k) <= 1e-11 * Math.max(1, Math.abs(d))) {
    const m = ((k % 360) + 360) % 360;
    const s = sinDeg(m), c = cosDeg(m);
    if (s !== undefined) {
      if (fn === 'sin') return s;
      if (fn === 'cos') return c;
      if (fn === 'tan') return c === 0 ? (s > 0 ? Infinity : -Infinity) : s / c;
    }
  }
  return Math[fn](toRad(x, unit));
}

// ---- gamma, factorial
const LG = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
  12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
export function gamma(z) {
  if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  z -= 1;
  let x = LG[0];
  for (let i = 1; i < 9; i++) x += LG[i] / (z + i);
  const t = z + 7.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}
export function factorial(n) {
  if (Number.isInteger(n)) {
    if (n < 0) return NaN;
    if (n > 170) return Infinity;
    let f = 1;
    for (let i = 2; i <= n; i++) f *= i;
    return f;
  }
  return gamma(n + 1);
}

// ---- combinatorics
export function nCr(n, r) {
  if (!Number.isInteger(n) || !Number.isInteger(r) || n < 0 || r < 0 || r > n) return NaN;
  r = Math.min(r, n - r);
  let v = 1;
  for (let k = 1; k <= r; k++) v = v * (n - r + k) / k;
  return Math.round(v) === v || v > 9e15 ? v : Math.round(v);
}
export function nPr(n, r) {
  if (!Number.isInteger(n) || !Number.isInteger(r) || n < 0 || r < 0 || r > n) return NaN;
  let v = 1;
  for (let k = 0; k < r; k++) v *= (n - k);
  return v;
}

// ---- integers
export function gcd(a, b) {
  if (!Number.isInteger(a) || !Number.isInteger(b)) return NaN;
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}
export function lcm(a, b) {
  if (!Number.isInteger(a) || !Number.isInteger(b)) return NaN;
  if (a === 0 || b === 0) return 0;
  return Math.abs(a / gcd(a, b) * b);
}
export const modFloor = (a, b) => b === 0 ? NaN : a - b * Math.floor(a / b);
export const roundHalfAway = x => x < 0 ? -Math.round(-x) : Math.round(x);
export function roundTo(x, n) {
  const p = Math.pow(10, n);
  const v = roundHalfAway(Number((x * p).toPrecision(15))) / p;
  return v;
}

// ---- rational approximation (continued fractions); null when there is no short fraction
export function toFraction(x, maxDen = 99999) {
  if (!Number.isFinite(x) || Number.isInteger(x)) return null;
  const sign = x < 0 ? -1 : 1, ax = Math.abs(x);
  let h1 = 1, h0 = 0, k1 = 0, k0 = 1, b = ax;
  for (let i = 0; i < 40; i++) {
    const a = Math.floor(b);
    const h2 = a * h1 + h0, k2 = a * k1 + k0;
    if (k2 > maxDen) return null;
    h0 = h1; h1 = h2; k0 = k1; k1 = k2;
    if (Math.abs(ax - h1 / k1) <= 1e-12 * Math.max(1, ax)) return { n: sign * h1, d: k1 };
    const f = b - a;
    if (f < 1e-15) break;
    b = 1 / f;
  }
  return null;
}

// ---- calculus on a one-variable function f(x) -> number
const GK_X = [0.991455371120813, 0.949107912342759, 0.864864423359769, 0.741531185599394, 0.586087235467691, 0.405845151377397, 0.207784955007898, 0];
const GK_WK = [0.022935322010529, 0.063092092629979, 0.104790010322250, 0.140653259715525, 0.169004726639267, 0.190350578064785, 0.204432940075298, 0.209482141084728];
const GK_WG = [0, 0.129484966168870, 0, 0.279705391489277, 0, 0.381830050505119, 0, 0.417959183673469];

function gk15(f, a, b) {
  const c = (a + b) / 2, h = (b - a) / 2;
  let k = GK_WK[7] * f(c), g = GK_WG[7] * f(c);
  for (let i = 0; i < 7; i++) {
    const dx = h * GK_X[i], v = f(c - dx) + f(c + dx);
    k += GK_WK[i] * v; g += GK_WG[i] * v;
  }
  return [k * h, Math.abs((k - g) * h)];
}
export function integrate(f, a, b) {
  if (a === b) return 0;
  if (a > b) return -integrate(f, b, a);
  const stack = [[a, b]];
  let total = 0, guard = 0;
  const tol = 1e-11;
  while (stack.length && guard++ < 4000) {
    const [lo, hi] = stack.pop();
    const [v, err] = gk15(f, lo, hi);
    if (!Number.isFinite(v)) return NaN;
    if (err <= tol * Math.max(1, Math.abs(v)) || hi - lo < 1e-12 * (b - a)) total += v;
    else { const m = (lo + hi) / 2; stack.push([lo, m], [m, hi]); }
  }
  return total;
}

// Ridders' extrapolation: accurate to about 1e-10 without choosing a step by hand
export function derivative(f, x) {
  let h = 0.01 * Math.max(1, Math.abs(x)), best = NaN, bestErr = Infinity;
  const T = [[(f(x + h) - f(x - h)) / (2 * h)]];
  for (let i = 1; i < 10; i++) {
    h /= 1.4;
    T[i] = [(f(x + h) - f(x - h)) / (2 * h)];
    let fac = 1.96;
    for (let j = 1; j <= i; j++) {
      T[i][j] = (T[i][j - 1] * fac - T[i - 1][j - 1]) / (fac - 1);
      fac *= 1.96;
      const err = Math.max(Math.abs(T[i][j] - T[i][j - 1]), Math.abs(T[i][j] - T[i - 1][j - 1]));
      if (err <= bestErr) { bestErr = err; best = T[i][j]; }
    }
    if (Math.abs(T[i][i] - T[i - 1][i - 1]) >= 2 * bestErr) break;
  }
  return best;
}

// Root of f near x0: Newton from the guess, then a widening bracket search finished by bisection
export function findRoot(f, x0) {
  let x = x0;
  for (let i = 0; i < 60; i++) {
    const y = f(x);
    if (y === 0) return x;
    const d = derivative(f, x);
    if (!Number.isFinite(d) || d === 0) break;
    const nx = x - y / d;
    if (!Number.isFinite(nx)) break;
    if (Math.abs(nx - x) <= 1e-14 * Math.max(1, Math.abs(nx)) && Math.abs(f(nx)) < 1e-9) return nx;
    x = nx;
  }
  for (let w = 0.5; w < 1e6; w *= 2) {
    let lo = x0 - w, hi = x0 + w;
    let flo = f(lo), fhi = f(hi);
    if (flo === 0) return lo;
    if (fhi === 0) return hi;
    if (Number.isFinite(flo) && Number.isFinite(fhi) && flo * fhi < 0) {
      for (let i = 0; i < 200; i++) {
        const m = (lo + hi) / 2, fm = f(m);
        if (fm === 0) return m;
        if (flo * fm < 0) { hi = m; fhi = fm; } else { lo = m; flo = fm; }
        if (hi - lo <= 1e-15 * Math.max(1, Math.abs(m))) break;
      }
      return (lo + hi) / 2;
    }
  }
  return NaN;
}
