// Su terazisi hesapları (saf işlevler; DOM yok, node:test ile sınanır).
//
// Yerçekimi vektörü telefonun eksenlerindedir (Android SensorEvent düzeni): x sağa, y telefonun üst ucuna, z ekrandan
// dışarı. Durgun telefon ekranı yukarı yatarken (0, 0, +9,81) okur: sensör yukarı yöndeki tepkiyi ölçer.
//
// Kipler (özgün uygulamanın üç kipi):
//   surface  telefon yatay yüzeyde. x = sağa eğim (artı: sağ taraf aşağıda), y = ileri eğim (artı: üst taraf aşağıda).
//            Kabarcık yüksek tarafa kayar.
//   line     telefon dik, uzun kenarı ölçülen çizgiye dayalı. Açı, uzun kenarın yatayla yaptığı açıdır (0…90);
//            artı: üst uç yukarıda ("yukarı eğimli"). Hedefler 0° ve 90°.
//   vertical telefonun arkası duvarda ya da kasada. side = yan eğim (artı: üst uç sağa), fb = ileri/geri (artı: arkaya
//            yatık). Asıl değer çekülden toplam sapmadır.
//
// Kalibrasyon (ters çevirme yöntemi): sensörün kayması x ve y'de sabit bir ek (m/s²) kabul edilir. Telefon düz bir
// yüzeyde ölçülür (m1), yerinde 180° döndürülüp yeniden ölçülür (m2). Yüzeyin gerçek eğimi dönünce işaret değiştirir,
// kayma değiştirmez: kayma = (m1 + m2) / 2, yüzey eğimi = (m1 − m2) / 2. Tek adımda yüzey düz sayılır: kayma = m1.

export const G = 9.80665;
const DEG = 180 / Math.PI;
export const MODES = ['surface', 'line', 'vertical'];
export const TOLERANCE = { min: 0.1, max: 2, step: 0.1, default: 0.5 };
export const BUBBLE_RANGE_DEG = 10;      // kabarcığın kenara değdiği eğim
const HOLD_LIMIT = Math.cos(45 / DEG);    // kip için uygun duruşun sınırı (45°)
export const CAL = {
  minSamples: 20,
  maxStdMs2: 0.08,                // ölçüm sırasında x/y'nin standart sapması bundan büyükse "telefon hareket etti"
  maxFlatDeg: 5,                  // bundan eğik telefon "düz durmuyor"
  maxBiasMs2: G * Math.sin(3 / DEG), // bundan büyük kayma olağandışı (≈3°)
};

const len = (v) => Math.hypot(v.x, v.y, v.z);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const toDeg = (r) => r * DEG;

/** Kalibrasyon kaymasını (m/s²) çıkarır. */
export function corrected(g, cal) {
  if (!cal) return g;
  return { x: g.x - (cal.bx || 0), y: g.y - (cal.by || 0), z: g.z };
}

/** Bir kipte okuma: açılar derece. valid=false ise telefon o kip için uygun tutulmuyor (hold). */
export function reading(mode, g) {
  const n = len(g);
  if (!(n > 1)) return { mode, valid: false, hold: false, noData: true };
  if (mode === 'surface') {
    const z = Math.abs(g.z);
    const x = Math.atan2(-g.x, z) * DEG;
    const y = Math.atan2(-g.y, z) * DEG;
    const primary = Math.acos(clamp(z / n, -1, 1)) * DEG;
    return { mode, valid: z / n >= HOLD_LIMIT, x, y, primary };
  }
  if (mode === 'line') {
    const inPlane = Math.hypot(g.x, g.y);
    const angle = Math.atan2(g.y, Math.abs(g.x)) * DEG; // −90…90
    return { mode, valid: inPlane / n >= HOLD_LIMIT, angle, primary: Math.abs(angle) };
  }
  // vertical
  const side = Math.atan2(-g.x, g.y) * DEG;
  const fb = Math.atan2(g.z, Math.hypot(g.x, g.y)) * DEG;
  const primary = Math.acos(clamp(g.y / n, -1, 1)) * DEG;
  return { mode, valid: g.y / n >= HOLD_LIMIT, side, fb, primary };
}

/** Referans ("mevcut açıyı sıfır kabul et") okumadan çıkarılır. */
export function referenceFrom(r) {
  if (!r || !r.valid) return null;
  if (r.mode === 'surface') return { x: r.x, y: r.y };
  if (r.mode === 'line') return { angle: r.angle };
  return { side: r.side, fb: r.fb };
}

export function applyReference(r, ref) {
  if (!ref || !r.valid) return r;
  if (r.mode === 'surface') {
    const x = r.x - ref.x, y = r.y - ref.y;
    return { ...r, x, y, primary: Math.hypot(x, y) };
  }
  if (r.mode === 'line') {
    const angle = r.angle - ref.angle;
    return { ...r, angle, primary: Math.abs(angle) };
  }
  const side = r.side - ref.side, fb = r.fb - ref.fb;
  return { ...r, side, fb, primary: Math.hypot(side, fb) };
}

/** Hedefe uzaklık (derece): surface/vertical 0°, line 0° ya da 90° (hangisi yakınsa). */
export function offTarget(r) {
  if (!r.valid) return Infinity;
  if (r.mode === 'line') return Math.min(r.primary, Math.abs(90 - r.primary));
  return r.primary;
}

/** Durum anahtarı (lv_state_…). */
export function stateKey(r, tolerance) {
  if (r.noData) return 'lv_state_no_data';
  if (!r.valid) return r.mode === 'surface' ? 'lv_state_hold_flat' : 'lv_state_hold_upright';
  const tol = tolerance + 1e-9;
  if (r.mode === 'surface') {
    if (Math.abs(r.x) <= tol && Math.abs(r.y) <= tol) return 'lv_state_level';
    if (Math.abs(r.x) >= Math.abs(r.y)) return r.x > 0 ? 'lv_state_right_low' : 'lv_state_left_low';
    return r.y > 0 ? 'lv_state_top_low' : 'lv_state_bottom_low';
  }
  if (r.mode === 'line') {
    if (offTarget(r) <= tol) return 'lv_state_on_target';
    return r.angle > 0 ? 'lv_state_rising' : 'lv_state_falling';
  }
  if (Math.abs(r.side) <= tol && Math.abs(r.fb) <= tol) return 'lv_state_on_target';
  if (Math.abs(r.side) >= Math.abs(r.fb)) return r.side > 0 ? 'lv_state_leans_right' : 'lv_state_leans_left';
  return r.fb > 0 ? 'lv_state_leans_back' : 'lv_state_leans_forward';
}

/** Kabarcığın konumu: birim daire içinde, ekran koordinatı (x sağa, y aşağı). Kabarcık yüksek tarafa kayar. */
export function bubble(r) {
  if (!r.valid) return { x: 0, y: 0 };
  let x = 0, y = 0;
  if (r.mode === 'surface') { x = -r.x; y = r.y; }
  else if (r.mode === 'line') { y = -r.angle; if (Math.abs(r.angle) > 45) y = -(Math.sign(r.angle) * 90 - r.angle); }
  else { x = -r.side; y = r.fb; }
  x /= BUBBLE_RANGE_DEG; y /= BUBBLE_RANGE_DEG;
  const m = Math.hypot(x, y);
  return m > 1 ? { x: x / m, y: y / m } : { x, y };
}

/** Derece → eğim yüzdesi (yükselme / uzunluk). 90°'ye yakın sonsuza gider: null. */
export function grade(deg) {
  if (Math.abs(deg) >= 89.9) return null;
  return Math.tan(deg / DEG) * 100;
}

/** Hedefe giriş/çıkış (titreşim ve ses bir kez çalsın diye histerezis). */
export function targetLatch(prev, off, tolerance) {
  if (off <= tolerance) return true;
  if (off > tolerance * 1.5 + 0.05) return false;
  return prev;
}

/** Kalibrasyon adımı: örnekler (yerçekimi vektörleri) → ortalama ya da hata nedeni. */
export function calibrationStep(samples) {
  if (!samples || samples.length < CAL.minSamples) return { ok: false, reason: 'no_data' };
  const m = { x: 0, y: 0, z: 0 };
  for (const s of samples) { m.x += s.x; m.y += s.y; m.z += s.z; }
  m.x /= samples.length; m.y /= samples.length; m.z /= samples.length;
  let vx = 0, vy = 0;
  for (const s of samples) { vx += (s.x - m.x) ** 2; vy += (s.y - m.y) ** 2; }
  const sd = Math.sqrt(Math.max(vx, vy) / samples.length);
  if (sd > CAL.maxStdMs2) return { ok: false, reason: 'moving' };
  const tilt = Math.acos(clamp(Math.abs(m.z) / len(m), -1, 1)) * DEG;
  if (tilt > CAL.maxFlatDeg) return { ok: false, reason: 'not_flat' };
  return { ok: true, mean: m };
}

/** İki adım (m1, m2) ya da tek adım (yalnız m1) → kayma ve yüzey eğimi. */
export function calibrate(m1, m2) {
  const bx = m2 ? (m1.x + m2.x) / 2 : m1.x;
  const by = m2 ? (m1.y + m2.y) / 2 : m1.y;
  if (Math.hypot(bx, by) > CAL.maxBiasMs2) return { ok: false, reason: 'bias' };
  let surfaceTiltDeg = 0;
  if (m2) {
    const tx = (m1.x - m2.x) / 2, ty = (m1.y - m2.y) / 2;
    surfaceTiltDeg = Math.asin(clamp(Math.hypot(tx, ty) / G, 0, 1)) * DEG;
  }
  return { ok: true, cal: { bx, by }, surfaceTiltDeg };
}

/** Birinci dereceden alçak geçiren süzgeç (zaman sabiti tau saniye). */
export function lowPass(prev, s, dtSec, tau = 0.2) {
  if (!prev) return { x: s.x, y: s.y, z: s.z };
  const a = 1 - Math.exp(-Math.max(0, dtSec) / tau);
  return { x: prev.x + (s.x - prev.x) * a, y: prev.y + (s.y - prev.y) * a, z: prev.z + (s.z - prev.z) * a };
}
