// Matrices of real numbers as arrays of rows. Every function returns a new matrix (or a number / list) and throws MatrixError.
import { C, simplify } from './complex.js';

export class MatrixError extends Error {
  // code: 'dim' (sizes do not fit) | 'square' | 'singular' | 'arg'
  constructor(code) { super(code); this.code = code; }
}

export const rows = M => M.length;
export const cols = M => M[0].length;
export const make = (r, c, f = () => 0) => Array.from({ length: r }, (_, i) => Array.from({ length: c }, (_, j) => f(i, j)));
export const identity = n => make(n, n, (i, j) => i === j ? 1 : 0);
export const copy = M => M.map(r => r.slice());
const needSquare = M => { if (rows(M) !== cols(M)) throw new MatrixError('square'); };
const scaleOf = M => Math.max(1e-300, ...M.flat().map(Math.abs));

export function add(A, B, sign = 1) {
  if (rows(A) !== rows(B) || cols(A) !== cols(B)) throw new MatrixError('dim');
  return make(rows(A), cols(A), (i, j) => A[i][j] + sign * B[i][j]);
}
export const sub = (A, B) => add(A, B, -1);
export const scale = (A, k) => A.map(r => r.map(v => v * k));
export const transpose = A => make(cols(A), rows(A), (i, j) => A[j][i]);
export function mul(A, B) {
  if (cols(A) !== rows(B)) throw new MatrixError('dim');
  return make(rows(A), cols(B), (i, j) => { let s = 0; for (let k = 0; k < cols(A); k++) s += A[i][k] * B[k][j]; return s; });
}
export function trace(A) { needSquare(A); return A.reduce((s, r, i) => s + r[i], 0); }

export function power(A, n) {
  needSquare(A);
  if (!Number.isInteger(n) || Math.abs(n) > 1000) throw new MatrixError('arg');
  let base = n < 0 ? inverse(A) : A, e = Math.abs(n), acc = identity(rows(A));
  while (e > 0) { if (e & 1) acc = mul(acc, base); base = mul(base, base); e = Math.floor(e / 2); }
  return acc;
}

export function det(A) {
  needSquare(A);
  const n = rows(A);
  if (A.flat().every(Number.isInteger)) {
    // Bareiss: exact for integers (every intermediate value is an integer minor), so a singular integer matrix gives exactly 0
    const M = copy(A);
    let sign = 1, prev = 1;
    for (let k = 0; k < n - 1; k++) {
      if (M[k][k] === 0) {
        let s = -1;
        for (let i = k + 1; i < n; i++) if (M[i][k] !== 0) { s = i; break; }
        if (s < 0) return 0;
        [M[k], M[s]] = [M[s], M[k]]; sign = -sign;
      }
      for (let i = k + 1; i < n; i++) for (let j = k + 1; j < n; j++) M[i][j] = (M[i][j] * M[k][k] - M[i][k] * M[k][j]) / prev;
      prev = M[k][k];
    }
    return sign * M[n - 1][n - 1];
  }
  const M = copy(A);
  let d = 1;
  for (let k = 0; k < n; k++) {
    let p = k;
    for (let i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i;
    if (M[p][k] === 0) return 0;
    if (p !== k) { [M[k], M[p]] = [M[p], M[k]]; d = -d; }
    d *= M[k][k];
    for (let i = k + 1; i < n; i++) { const f = M[i][k] / M[k][k]; for (let j = k; j < n; j++) M[i][j] -= f * M[k][j]; }
  }
  const hadamard = A.reduce((p, r) => p * Math.hypot(...r), 1);
  return Math.abs(d) < 1e-13 * hadamard ? 0 : d;
}

// Gauss-Jordan on [A | I]
export function inverse(A) {
  needSquare(A);
  const n = rows(A), tol = 1e-12 * scaleOf(A);
  const M = make(n, 2 * n, (i, j) => j < n ? A[i][j] : (j - n === i ? 1 : 0));
  for (let k = 0; k < n; k++) {
    let p = k;
    for (let i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i;
    if (Math.abs(M[p][k]) <= tol) throw new MatrixError('singular');
    [M[k], M[p]] = [M[p], M[k]];
    const pv = M[k][k];
    for (let j = 0; j < 2 * n; j++) M[k][j] /= pv;
    for (let i = 0; i < n; i++) if (i !== k) { const f = M[i][k]; if (f !== 0) for (let j = 0; j < 2 * n; j++) M[i][j] -= f * M[k][j]; }
  }
  return make(n, n, (i, j) => M[i][n + j]);
}

// reduced row echelon form; returns { M, pivots: [column of each pivot row] }
export function rref(A) {
  const M = copy(A), r = rows(M), c = cols(M), tol = 1e-11 * scaleOf(A), pivots = [];
  let row = 0;
  for (let col = 0; col < c && row < r; col++) {
    let p = row;
    for (let i = row + 1; i < r; i++) if (Math.abs(M[i][col]) > Math.abs(M[p][col])) p = i;
    if (Math.abs(M[p][col]) <= tol) { for (let i = row; i < r; i++) M[i][col] = 0; continue; }
    [M[row], M[p]] = [M[p], M[row]];
    const pv = M[row][col];
    for (let j = col; j < c; j++) M[row][j] /= pv;
    for (let i = 0; i < r; i++) if (i !== row) { const f = M[i][col]; if (f !== 0) for (let j = col; j < c; j++) M[i][j] -= f * M[row][j]; }
    pivots.push(col);
    row++;
  }
  for (const rr of M) for (let j = 0; j < c; j++) if (Math.abs(rr[j]) < 1e-12) rr[j] = 0;
  return { M, pivots };
}
export const rank = A => rref(A).pivots.length;

// A x = B for a square A (B may have several columns)
export function solve(A, B) {
  needSquare(A);
  if (rows(B) !== rows(A)) throw new MatrixError('dim');
  return mul(inverse(A), B);
}

// characteristic polynomial (Faddeev-LeVerrier): coefficients from x^n down to 1
export function charPoly(A) {
  needSquare(A);
  const n = rows(A), c = [1];
  let Mk = identity(n);
  for (let k = 1; k <= n; k++) {
    const AM = mul(A, Mk);
    const ck = -trace(AM) / k;
    c.push(ck);
    Mk = add(AM, scale(identity(n), ck));
  }
  return c;
}

// roots of a real polynomial (Durand-Kerner); returns numbers / Complex, real roots first
export function polyRoots(coef) {
  while (coef.length > 1 && coef[0] === 0) coef = coef.slice(1);
  const n = coef.length - 1;
  if (n < 1) return [];
  const a = coef.map(v => v / coef[0]);
  const radius = 1 + Math.max(...a.slice(1).map(Math.abs));
  let z = Array.from({ length: n }, (_, k) => [radius * 0.5 * Math.cos(2 * Math.PI * k / n + 0.4), radius * 0.5 * Math.sin(2 * Math.PI * k / n + 0.4)]);
  const evalP = (x, y) => { let re = 1, im = 0; for (let k = 1; k <= n; k++) { const t = re * x - im * y + a[k]; im = re * y + im * x; re = t; } return [re, im]; };
  for (let it = 0; it < 500; it++) {
    let moved = 0;
    z = z.map(([x, y], i) => {
      const [pr, pi] = evalP(x, y);
      let dr = 1, di = 0;
      for (let j = 0; j < n; j++) if (j !== i) {
        const ur = x - z[j][0], ui = y - z[j][1];
        const t = dr * ur - di * ui; di = dr * ui + di * ur; dr = t;
      }
      const den = dr * dr + di * di || 1e-300;
      const qr = (pr * dr + pi * di) / den, qi = (pi * dr - pr * di) / den;
      moved = Math.max(moved, Math.hypot(qr, qi));
      return [x - qr, y - qi];
    });
    if (moved < 1e-15 * radius) break;
  }
  const sc = Math.max(1, ...a.map(Math.abs));
  const out = z.map(([x, y]) => {
    if (Math.abs(y) < 1e-9 * Math.max(1, Math.abs(x))) y = 0;
    if (Math.abs(x) < 1e-12 * sc) x = 0;
    return y === 0 ? x : C(x, y);
  });
  // polish a real root with a few Newton steps on the real polynomial
  const poly = x => a.reduce((s, c) => s * x + c, 0), dpoly = x => { let s = 0; for (let k = 0; k < n; k++) s = s * x + a[k] * (n - k); return s; };
  for (let i = 0; i < out.length; i++) if (typeof out[i] === 'number') {
    let x = out[i];
    for (let k = 0; k < 4; k++) { const d = dpoly(x); if (!d) break; const nx = x - poly(x) / d; if (!Number.isFinite(nx)) break; x = nx; }
    out[i] = x;
  }
  return out.sort((p, q) => (typeof q === 'number') - (typeof p === 'number') || (typeof p === 'number' ? p - q : p.re - q.re || p.im - q.im));
}

export const eigenvalues = A => polyRoots(charPoly(A)).map(simplify);

// eigenvector of A for the real eigenvalue lam, scaled so its largest component is 1; null when there is none
export function eigenvector(A, lam) {
  const n = rows(A);
  const { M, pivots } = rref(sub(A, scale(identity(n), lam)));
  const free = [];
  for (let j = 0; j < n; j++) if (!pivots.includes(j)) free.push(j);
  if (!free.length) return null;
  const f = free[0], v = Array(n).fill(0);
  v[f] = 1;
  pivots.forEach((pc, r) => { v[pc] = -M[r][f]; });
  const big = Math.max(...v.map(Math.abs));
  return v.map(x => { const t = x / big; return Math.abs(t) < 1e-12 ? 0 : t; });
}
