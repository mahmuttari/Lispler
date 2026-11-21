// Numbers and coordinates as the current language writes them.
import { numberFormat, t, dir } from './i18n.js';
import { fmtDeg, fmtKm, fmtCoordPart } from './qibla.js';

export const degText = d => fmtDeg(d, numberFormat().comma) + '°';
/** +6.1° / −3.0°: a signed number of degrees (decimal comma by language) */
export const signedDegText = d => (d < 0 ? '−' : '+') + fmtDeg(Math.abs(d), numberFormat().comma) + '°';
/** 85 -> "85 m", 1240 -> "1.2 km" (decimal comma by language), 23000 -> "23 km" */
export function distText(m) {
  const c = numberFormat().comma, v = m < 100 ? Math.round(m / 5) * 5 : Math.round(m / 10) * 10;
  if (v < 1000) return v + ' ' + t('unit.m');
  const km = m / 1000, s = km < 10 ? km.toFixed(1) : String(Math.round(km));
  return (c ? s.replace('.', ',') : s) + ' ' + t('unit.km');
}
export const kmText = km => fmtKm(km, numberFormat().thousands) + ' ' + t('unit.km');

/** "41.0082° N, 28.9784° E" with the hemisphere letters of the language (Turkish: K / D) */
export function coordText(lat, lon) {
  const c = numberFormat().comma;
  const s = fmtCoordPart(lat, t('coord.n'), t('coord.s'), c) + ', ' + fmtCoordPart(lon, t('coord.e'), t('coord.w'), c);
  return dir() === 'rtl' ? '⁦' + s + '⁩' : s;   // in a right-to-left line the numbers keep their order (left-to-right isolate)
}

/** parses what a person types into a coordinate field: "41.0082", "41,0082", "41.0082 N", "-28.97", "28.97 W" -> number, or NaN */
export function parseCoord(text, axis) {
  let s = String(text).trim().replace(',', '.').replace(/°/g, '').replace(/[−–]/g, '-');   // the minus signs of typography (the error text prints one) count as a minus
  if (!s) return NaN;
  let sign = 1;
  const m = /([NSEWnsewKGDBkgdb])\s*$/.exec(s) || /^([NSEWnsewKGDBkgdb])\s*/.exec(s);
  if (m) {
    const letter = m[1].toUpperCase();
    // a latitude takes N/S (K/G), a longitude E/W (D/B); a letter of the other axis is a mistake
    if (!(axis === 'lat' ? /[NSKG]/ : /[EWDB]/).test(letter)) return NaN;
    // N/E/K/D are positive, S/W/G/B negative (K Kuzey, G Güney, D Doğu, B Batı); with a letter the sign comes from the letter alone ("-33.87 S" is 33.87 south, not north)
    if (/[SGWB]/.test(letter)) sign = -1;
    s = s.replace(m[0], '').trim().replace(/^[+-]/, '');
  }
  if (!/^[+-]?\d+(\.\d+)?$/.test(s)) return NaN;
  const v = sign * Number(s);
  const max = axis === 'lat' ? 90 : 180;
  return Math.abs(v) <= max ? v : NaN;
}
