// Number display: Norm / Fix / Sci / Eng, complex (rectangular or polar), fractions and degrees-minutes-seconds.
import { isC, cabs, carg } from './complex.js';
import { fromRad, toFraction } from './mathx.js';

const SUPD = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '-': '⁻' };
const sup = n => String(n).replace(/[0-9-]/g, c => SUPD[c]);

// The display shows exponents as real <sup> markup: the phone's monospace font has no glyph for some of the superscript characters (they come out as boxes).
const UNSUP = Object.fromEntries(Object.entries(SUPD).map(([k, v]) => [v, k === '-' ? '−' : k]));
export function htmlOf(s) {
  return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
    .replace(/×10([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)/g, (_, e) => '×10<sup>' + [...e].map(c => UNSUP[c]).join('') + '</sup>');
}

// significant digits and decimal exponent of |x|: digits "1234", exp 3  ->  1.234 * 10^3
function parts(x, sig) {
  const [m, e] = Math.abs(x).toExponential(Math.max(0, Math.min(sig, 100) - 1)).split('e');
  return { digits: m.replace('.', ''), exp: parseInt(e, 10) };
}
function plain(digits, exp) {
  let int, frac;
  if (exp >= 0) { int = digits.slice(0, exp + 1).padEnd(exp + 1, '0'); frac = digits.slice(exp + 1); }
  else { int = '0'; frac = '0'.repeat(-exp - 1) + digits; }
  frac = frac.replace(/0+$/, '');
  return frac ? int + '.' + frac : int;
}
const mantissa = (digits, trim) => {
  const rest = trim ? digits.slice(1).replace(/0+$/, '') : digits.slice(1);
  return digits[0] + (rest ? '.' + rest : '');
};
const withExp = (mant, exp, pretty) => pretty ? mant + '×10' + sup(exp) : mant + 'E' + exp;

// o: { mode: 'norm'|'fix'|'sci'|'eng', digits: 0..9, comma: bool, pretty: bool, sig: significant digits in Norm (default 12) }
export function fmtReal(x, o = {}) {
  if (Object.is(x, -0) || x === 0) {
    if (o.mode === 'fix' && o.digits > 0) return (o.comma ? '0,' : '0.') + '0'.repeat(o.digits);
    if (o.mode === 'sci' || o.mode === 'eng') return withExp('0' + (o.digits > 0 ? '.' + '0'.repeat(o.digits) : ''), 0, o.pretty).replace('.', o.comma ? ',' : '.');
    return '0';
  }
  if (!Number.isFinite(x)) return Number.isNaN(x) ? 'NaN' : (x < 0 ? '-∞' : '∞');
  const mode = o.mode || 'norm', n = o.digits == null ? 4 : o.digits, neg = x < 0 ? '-' : '';
  let s;
  if (mode === 'fix' && Math.abs(x) < 1e15) {
    s = Math.abs(x).toFixed(n);
    if (/^0(\.0*)?$/.test(s)) return s.replace('.', o.comma ? ',' : '.');   // -0.001 in Fix 2 is 0.00, not -0.00
  } else if (mode === 'sci') {
    const p = parts(x, n + 1);
    s = withExp(mantissa(p.digits, false), p.exp, o.pretty);
  } else if (mode === 'eng') {
    const p = parts(x, n + 1), e3 = Math.floor(p.exp / 3) * 3, shift = p.exp - e3;
    let d = p.digits.padEnd(shift + 1, '0');
    const head = d.slice(0, shift + 1), tail = d.slice(shift + 1);
    s = withExp(head + (tail ? '.' + tail : ''), e3, o.pretty);
  } else {
    const p = parts(x, o.sig || 12);
    if (p.exp >= -6 && p.exp <= 11) s = plain(p.digits, p.exp);
    else s = withExp(mantissa(p.digits, true), p.exp, o.pretty);
  }
  return neg + (o.comma ? s.replace('.', ',') : s);
}

// o adds: polar: bool, angle: 'deg'|'rad'|'grad'
export function fmtValue(v, o = {}) {
  if (!isC(v)) return fmtReal(v, o);
  if (o.polar) {
    const t = fromRad(carg(v), o.angle || 'rad');
    const u = o.angle === 'deg' ? '°' : o.angle === 'grad' ? 'g' : '';
    return fmtReal(cabs(v), o) + '∠' + fmtReal(t, o) + u;
  }
  const re = fmtReal(v.re, o);
  const a = Math.abs(v.im);
  const im = (a === 1 ? '' : fmtReal(a, o)) + 'i';
  const sign = v.im < 0 ? '−' : '+';
  if (v.re === 0) return (v.im < 0 ? '−' : '') + im;
  return re + sign + im;
}

// "7/3" or, when mixed, "2 1/3"; null when x has no short fraction
export function fmtFraction(x, mixed) {
  const f = toFraction(x);
  if (!f) return null;
  const neg = f.n < 0 ? '−' : '', n = Math.abs(f.n);
  if (mixed && n > f.d) {
    const w = Math.floor(n / f.d), r = n - w * f.d;
    return r === 0 ? neg + w : neg + w + ' ' + r + '/' + f.d;
  }
  return neg + n + '/' + f.d;
}

// degrees -> 12°34′56.78″
export function fmtDMS(x, comma) {
  if (!Number.isFinite(x)) return null;
  const neg = x < 0 ? '−' : '', a = Math.abs(x);
  let d = Math.floor(a), rem = (a - d) * 60, m = Math.floor(rem), s = Number(((rem - m) * 60).toFixed(2));
  if (s >= 60) { s = 0; m++; }
  if (m >= 60) { m = 0; d++; }
  const st = String(s).replace('.', comma ? ',' : '.');
  return neg + d + '°' + m + '′' + st + '″';
}
