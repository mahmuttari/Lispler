// Reading what the user types and writing what the converter shows. Pure functions.

const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };

/**
 * Text -> number. null = nothing typed yet, NaN = not a number.
 * Both "," and "." are decimal marks. When both appear the LAST one is the decimal mark and the other one is a grouping mark;
 * one mark repeated ("1.234.567") is grouping; one mark once ("1,234") is the decimal mark.
 */
export function parseNumber(text) {
  let s = String(text == null ? '' : text).trim().replace(/[\s  ']/g, '').replace(/[−–]/g, '-');
  if (s === '') return null;
  s = s.replace(/[×x]10\^?/i, 'e');                         // 1.5x10^3 / 1,5×10³ typed in the long way
  const m = /^([+-]?[\d.,]*)(?:e([+-]?\d+))?$/i.exec(s);
  if (!m) return NaN;
  let mant = m[1];
  const dots = (mant.match(/\./g) || []).length, commas = (mant.match(/,/g) || []).length;
  // a grouping mark separates groups of exactly three digits: 1.234.567 / 1,234,567.5 (anything else is a typo, not a number)
  const ungroup = (text, group) => {
    const sign = /^[+-]/.test(text) ? text[0] : '';
    const groups = text.slice(sign.length).split(group);
    return /^\d{1,3}$/.test(groups[0]) && groups.slice(1).every(g => /^\d{3}$/.test(g)) ? sign + groups.join('') : null;
  };
  if (dots && commas) {
    const dec = mant.lastIndexOf('.') > mant.lastIndexOf(',') ? '.' : ',';
    const group = dec === '.' ? ',' : '.';
    const at = mant.indexOf(dec);
    if (mant.lastIndexOf(dec) !== at) return NaN;
    const head = ungroup(mant.slice(0, at), group);
    if (head === null) return NaN;
    mant = head + '.' + mant.slice(at + 1);
  } else if (dots > 1 || commas > 1) {
    mant = ungroup(mant, dots ? '.' : ',');
    if (mant === null) return NaN;
  } else {
    mant = mant.replace(',', '.');
  }
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(mant)) return NaN;
  const v = Number(mant + (m[2] != null ? 'e' + m[2] : ''));
  return Number.isFinite(v) ? v : NaN;
}

/** the ± key: flips the sign of the number - or, once an exponent has been started ("1e"), the sign of the exponent */
export function flipSign(text) {
  const s = String(text).trim();
  const flip = x => (x.startsWith('-') ? x.slice(1) : x.startsWith('+') ? '-' + x.slice(1) : '-' + x);
  const at = s.search(/e/i);
  return at < 0 ? flip(s) : s.slice(0, at + 1) + flip(s.slice(at + 1));
}

/** the E key: "" -> "1e", "-" -> "-1e", "2.5" -> "2.5e"; a text that already has an exponent stays as it is */
export function addExponent(text) {
  const s = String(text).trim();
  if (/e/i.test(s)) return s;
  return (/\d$|[.,]$/.test(s) ? s : s + '1') + 'e';
}

/** what has been typed without an exponent that is still being typed: "2.5e" and "2.5e-" count as 2.5 */
export const dropOpenExponent = text => String(text).replace(/e[+-]?$/i, '');

const strip = s => (s.indexOf('.') < 0 ? s : s.replace(/0+$/, '').replace(/\.$/, ''));
const sup = n => String(n).split('').map(ch => SUP[ch] || ch).join('');

/** the pieces of a number: { sign, int, frac, exp } - `exp` is null for a plain number, an integer for scientific notation */
function parts(x, digits, notation) {
  const sign = x < 0 ? '-' : '';
  const a = Math.abs(x);
  const sci = notation === 'sci' || a >= 1e10 || a < 1e-4;
  if (sci) {
    const [mant, e] = a.toExponential(digits - 1).split('e');
    const [int, frac = ''] = strip(mant).split('.');
    return { sign, int, frac, exp: Number(e) };
  }
  // `digits` significant digits, but never fewer than all the digits left of the decimal mark
  const intDigits = Math.floor(Math.log10(a)) + 1;
  const [int, frac = ''] = strip(a.toFixed(Math.max(0, Math.min(100, digits - intDigits)))).split('.');
  return { sign, int, frac, exp: null };
}

/**
 * Number -> text for the screen.
 *   opts.digits    significant digits (default 6)
 *   opts.notation  'auto' (scientific only below 1e-4 and from 1e10 on) or 'sci' (always)
 *   opts.decimal   '.' or ','
 *   opts.plain     true: "1.5e-7" (what a spreadsheet reads) instead of "1.5×10⁻⁷"
 * NaN -> a dash, infinities -> the infinity sign
 */
export function formatNumber(x, opts = {}) {
  const { digits = 6, notation = 'auto', decimal = '.', plain = false } = opts;
  if (x === null || x === undefined || Number.isNaN(x)) return '—';
  if (x === Infinity) return '∞';
  if (x === -Infinity) return '-∞';
  if (x === 0) return '0';
  const p = parts(x, digits, notation);
  const num = p.sign + p.int + (p.frac ? decimal + p.frac : '');
  if (p.exp === null) return num;
  return plain ? num + 'e' + p.exp : num + '×10' + sup(p.exp);
}
