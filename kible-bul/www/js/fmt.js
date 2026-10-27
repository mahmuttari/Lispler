// Numbers and coordinates as the current language writes them.
import { numberFormat, t, dir } from './i18n.js';
import { fmtDeg, fmtKm, fmtCoordPart } from './qibla.js';

export const degText = d => fmtDeg(d, numberFormat().comma) + '°';
export const kmText = km => fmtKm(km, numberFormat().thousands) + ' ' + t('unit.km');

/** "41.0082° N, 28.9784° E" with the hemisphere letters of the language (Turkish: K / D) */
export function coordText(lat, lon) {
  const c = numberFormat().comma;
  const s = fmtCoordPart(lat, t('coord.n'), t('coord.s'), c) + ', ' + fmtCoordPart(lon, t('coord.e'), t('coord.w'), c);
  return dir() === 'rtl' ? '⁦' + s + '⁩' : s;   // in a right-to-left line the numbers keep their order (left-to-right isolate)
}

/** parses what a person types into a coordinate field: "41.0082", "41,0082", "41.0082 N", "-28.97", "28.97 W" -> number, or NaN */
export function parseCoord(text, axis) {
  let s = String(text).trim().replace(',', '.').replace(/°/g, '');
  if (!s) return NaN;
  let sign = 1;
  const m = /([NSEWnsewKGDBkgdb])\s*$/.exec(s) || /^([NSEWnsewKGDBkgdb])\s*/.exec(s);
  if (m) {
    const letter = m[1].toUpperCase();
    // N/E/K/D are positive, S/W/G/B negative (K Kuzey, G Güney, D Doğu, B Batı)
    if (axis === 'lat' && /[SG]/.test(letter)) sign = -1;
    if (axis === 'lon' && /[WB]/.test(letter)) sign = -1;
    s = s.replace(m[0], '').trim();
  }
  if (!/^[+-]?\d+(\.\d+)?$/.test(s)) return NaN;
  const v = sign * Number(s);
  const max = axis === 'lat' ? 90 : 180;
  return Math.abs(v) <= max ? v : NaN;
}
