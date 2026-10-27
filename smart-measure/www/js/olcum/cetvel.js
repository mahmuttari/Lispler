// Ekran cetveli ve açıölçer hesapları (saf işlevler).
//
// Ölçek: telefonun bildirdiği piksel yoğunluğundan (DisplayMetrics.xdpi/ydpi, eklenti verir). Sayfadaki bir CSS
// pikseli devicePixelRatio kadar fiziksel pikseldir: mm/CSS px = 25,4 × dpr / dpi. Bildirilen yoğunluk %1–2 sapabilir;
// banka kartıyla (ISO ID-1, 85,60 × 53,98 mm) kalibre edilince ölçek her eksende bir katsayıyla düzeltilir
// (0,85…1,15 dışı kabul edilmez).

export const CARD = { widthMm: 53.98, heightMm: 85.6 }; // dik tutulan kart: kısa kenar genişlik, uzun kenar yükseklik
export const SCALE = { min: 0.85, max: 1.15 };
export const UNITS = { mm: 1, cm: 10, in: 25.4 };
export const GUIDES = { horizontal: { a: 10, b: 30 }, vertical: { a: 20, b: 60 } }; // mm
export const ARMS = { a: 26, b: 154 };      // derece, açıölçerin iki kolu
export const ANGLE_STEP = 0.5;

/** Bildirilen ölçek: mm / CSS px her eksende. display: { xdpi, ydpi } (fiziksel), dpr: devicePixelRatio. */
export function reportedMmPerPx(display, dpr) {
  const ok = (d) => Number.isFinite(d) && d > 50 && d < 2000;
  const xd = ok(display?.xdpi) ? display.xdpi : 160 * dpr;
  const yd = ok(display?.ydpi) ? display.ydpi : 160 * dpr;
  return { x: 25.4 * dpr / xd, y: 25.4 * dpr / yd };
}

/** Kalibrasyonlu ölçek. */
export function mmPerPx(display, dpr, cal) {
  const r = reportedMmPerPx(display, dpr);
  return { x: r.x * (cal?.scaleX || 1), y: r.y * (cal?.scaleY || 1) };
}

/** Kart çerçevesinin CSS piksel genişliği ve yüksekliğinden kalibrasyon katsayıları. */
export function calibrationFromFrame(reported, widthPx, heightPx) {
  const sx = CARD.widthMm / (widthPx * reported.x);
  const sy = CARD.heightMm / (heightPx * reported.y);
  const ok = (s) => s >= SCALE.min && s <= SCALE.max;
  return ok(sx) && ok(sy) ? { ok: true, scaleX: sx, scaleY: sy } : { ok: false };
}

/** Çerçeve katsayısı (0,85…1,15) → çerçevenin CSS piksel boyu. */
export const frameSizePx = (reported, scaleX, scaleY) => ({
  w: CARD.widthMm / (reported.x * scaleX), h: CARD.heightMm / (reported.y * scaleY),
});

/** Cetvel çizgileri: 0'dan lengthMm'e. level: fine | minor | medium | half | major. */
export function ticks(lengthMm, unit) {
  const out = [];
  if (unit === 'in') {
    const step = 25.4 / 16;
    for (let i = 0; i * step <= lengthMm + 1e-9; i++) {
      const level = i % 16 === 0 ? 'major' : i % 8 === 0 ? 'half' : i % 4 === 0 ? 'medium' : i % 2 === 0 ? 'minor' : 'fine';
      out.push({ mm: i * step, level, label: i % 16 === 0 ? String(i / 16) : null });
    }
    return out;
  }
  for (let i = 0; i <= lengthMm + 1e-9; i++) {
    const level = i % 10 === 0 ? 'major' : i % 5 === 0 ? 'half' : 'minor';
    out.push({ mm: i, level, label: i % 10 === 0 ? String(unit === 'cm' ? i / 10 : i) : null });
  }
  return out;
}

/** Kılavuzlar arası mesafe, seçili birimde (mm ya da cm 1, in 2 ondalık). */
export function lengthIn(mm, unit) {
  const v = Math.abs(mm) / UNITS[unit];
  return { value: v, digits: unit === 'in' ? 2 : 1 };
}

export const snapAngle = (deg) => Math.round(deg / ANGLE_STEP) * ANGLE_STEP;

/** Merkezden dokunulan noktaya açı (derece, 0 sağda, saat yönünün tersine artar, ekran y aşağı). */
export function angleAt(cx, cy, x, y) {
  const a = Math.atan2(cy - y, x - cx) * 180 / Math.PI;
  return (a + 360) % 360;
}

/** İki kol arası iç açı (0…180) ve dış açı (360 − iç). */
export function angles(a, b) {
  let d = Math.abs(a - b) % 360;
  if (d > 180) d = 360 - d;
  return { inner: d, outer: 360 - d };
}
