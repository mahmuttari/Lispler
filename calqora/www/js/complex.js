// Complex numbers. A value in the engine is either a JS number (real) or a Complex.
export class Complex {
  constructor(re, im) { this.re = re; this.im = im; }
}
export const isC = v => v instanceof Complex;
export const C = (re, im = 0) => new Complex(re, im);
export const toC = v => (isC(v) ? v : new Complex(v, 0));

export const cabs = z => Math.hypot(z.re, z.im);
export const carg = z => Math.atan2(z.im, z.re);
export const cneg = z => C(-z.re, -z.im);
export const cconj = z => C(z.re, -z.im);
export const cadd = (a, b) => C(a.re + b.re, a.im + b.im);
export const csub = (a, b) => C(a.re - b.re, a.im - b.im);
export const cmul = (a, b) => C(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);

export function cdiv(a, b) {
  // Smith's algorithm: no overflow for large components
  if (Math.abs(b.re) >= Math.abs(b.im)) {
    const r = b.im / b.re, d = b.re + b.im * r;
    return C((a.re + a.im * r) / d, (a.im - a.re * r) / d);
  }
  const r = b.re / b.im, d = b.re * r + b.im;
  return C((a.re * r + a.im) / d, (a.im * r - a.re) / d);
}

export const cexp = z => { const m = Math.exp(z.re); return C(m * Math.cos(z.im), m * Math.sin(z.im)); };
export const cln = z => C(Math.log(cabs(z)), carg(z));

export function csqrt(z) {
  const r = cabs(z);
  if (r === 0) return C(0, 0);
  const re = Math.sqrt((r + z.re) / 2);
  const im = Math.sqrt((r - z.re) / 2);
  return C(re, z.im < 0 ? -im : im);
}

export function cpow(a, b) {
  if (a.re === 0 && a.im === 0) return (b.re === 0 && b.im === 0) ? C(1, 0) : C(0, 0);
  // whole-number power: repeated squaring keeps i^2 = -1 and (1+i)^2 = 2i exact
  if (b.im === 0 && Number.isInteger(b.re) && Math.abs(b.re) <= 4096) {
    let n = Math.abs(b.re), base = a, acc = C(1, 0);
    while (n > 0) { if (n & 1) acc = cmul(acc, base); base = cmul(base, base); n = Math.floor(n / 2); }
    return b.re < 0 ? cdiv(C(1, 0), acc) : acc;
  }
  return cexp(cmul(b, cln(a)));
}

export const csin = z => C(Math.sin(z.re) * Math.cosh(z.im), Math.cos(z.re) * Math.sinh(z.im));
export const ccos = z => C(Math.cos(z.re) * Math.cosh(z.im), -Math.sin(z.re) * Math.sinh(z.im));
export const ctan = z => cdiv(csin(z), ccos(z));
export const csinh = z => C(Math.sinh(z.re) * Math.cos(z.im), Math.cosh(z.re) * Math.sin(z.im));
export const ccosh = z => C(Math.cosh(z.re) * Math.cos(z.im), Math.sinh(z.re) * Math.sin(z.im));
export const ctanh = z => cdiv(csinh(z), ccosh(z));

const I = C(0, 1), ONE = C(1, 0);
export const casinh = z => cln(cadd(z, csqrt(cadd(cmul(z, z), ONE))));
export const cacosh = z => cln(cadd(z, cmul(csqrt(cadd(z, ONE)), csqrt(csub(z, ONE)))));
export const catanh = z => { const h = cln(cdiv(cadd(ONE, z), csub(ONE, z))); return C(h.re / 2, h.im / 2); };
export const casin = z => { const w = cln(cadd(cmul(I, z), csqrt(csub(ONE, cmul(z, z))))); return C(w.im, -w.re); };
export const cacos = z => { const a = casin(z); return C(Math.PI / 2 - a.re, -a.im); };
export const catan = z => { const iz = cmul(I, z); const h = csub(cln(csub(ONE, iz)), cln(cadd(ONE, iz))); return C(-h.im / 2, h.re / 2); };

// Rounding noise (exp(i*pi) = -1 + 1.2e-16 i) is removed relative to the size of the number; an all-real result becomes a plain number.
export function simplify(z) {
  if (!isC(z)) return z;
  let { re, im } = z;
  const r = Math.hypot(re, im);
  if (r > 0) {
    if (Math.abs(im) < 1e-14 * r) im = 0;
    if (Math.abs(re) < 1e-14 * r) re = 0;
  }
  return im === 0 ? re : C(re, im);
}
