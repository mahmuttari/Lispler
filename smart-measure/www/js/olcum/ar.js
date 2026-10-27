// Kamerayla ölçüm (özgün uygulamanın "yöntem B"si; ARCore değil): kameranın baktığı yön ve kullanıcının girdiği
// telefon yüksekliğiyle trigonometri. Saf işlevler; node:test ile sınanır.
//
//   Zemindeki bir noktanın yatay uzaklığı   r = h / tan(θ)        θ: kameranın ufkun altına bakış açısı
//   Zemindeki iki nokta arası (A, B)       d² = rA² + rB² − 2·rA·rB·cos(φA − φB)      φ: yatay yön (pusula açısı)
//   Nesnenin yüksekliği (taban + tepe)     H = h − r_taban · tan(θ_tepe)              (tepe ufkun üstündeyse θ < 0)
//   Genişlik (sol ve sağ kenarın zemindeki noktaları) iki nokta arası uzaklıktır.
//
// Sınırlar: ufkun en az 8° altı (daha yatay bakışta uzaklık çok belirsizleşir), en çok 85° (dümdüz aşağı).
// Belirsizlik: girdilerin standart sapmalarıyla (yükseklik 2 cm, eğim 0,4°, yön 1°) birinci dereceden yayılım.

const DEG = Math.PI / 180;
export const AIM = { minDown: 8, maxDown: 85 };
export const HEIGHT = { min: 0.5, max: 2.2, step: 0.01 };
export const SIGMA = { height: 0.02, pitch: 0.4, bearing: 1.0 };
export const MAX_RANGE = 80; // m: bundan uzak nokta gösterilmez (8°'de 2,2 m yükseklik ≈ 15,7 m; pay bırakıldı)

/** Döndürme matrisi (Android getRotationMatrixFromVector, satır sıralı 9 sayı; cihaz → dünya) → bakış.
 *  Arka kamera cihazın −z ekseni boyunca bakar. pitch: ufkun altına derece (aşağı bakış artı), bearing: derece. */
export function aimFromRotation(R) {
  const dx = -R[2], dy = -R[5], dz = -R[8];
  const pitch = Math.asin(Math.max(-1, Math.min(1, -dz))) / DEG;
  const bearing = ((Math.atan2(dx, dy) / DEG) + 360) % 360;
  return { pitch, bearing };
}

/** Yalnız yerçekiminden (ivmeölçer): eğim bilinir, yön bilinmez. */
export function aimFromGravity(g) {
  const n = Math.hypot(g.x, g.y, g.z);
  if (!(n > 1)) return null;
  return { pitch: Math.asin(Math.max(-1, Math.min(1, g.z / n))) / DEG, bearing: null };
}

/** W3C DeviceOrientation (alpha, beta, gamma, derece) → aynı düzende döndürme matrisi (tarayıcı yedeği). */
export function rotationFromEuler(alpha, beta, gamma) {
  const a = (alpha || 0) * DEG, b = (beta || 0) * DEG, g = (gamma || 0) * DEG;
  const cA = Math.cos(a), sA = Math.sin(a), cB = Math.cos(b), sB = Math.sin(b), cG = Math.cos(g), sG = Math.sin(g);
  return [
    cA * cG - sA * sB * sG, -cB * sA, cG * sA * sB + cA * sG,
    cG * sA + cA * sB * sG, cA * cB, sA * sG - cA * cG * sB,
    -cB * sG, sB, cB * cG,
  ];
}

/** Bakışta zemine nişan alınamıyorsa sorun anahtarı (NeedHeight / AimLower / AimHigher), yoksa null. */
export function aimProblem(h, aim) {
  if (!(h > 0)) return 'NeedHeight';
  if (!aim) return null;
  if (aim.pitch < AIM.minDown) return 'AimLower';
  if (aim.pitch > AIM.maxDown) return 'AimHigher';
  return null;
}

/** Zemindeki noktanın yatay uzaklığı (m). */
export function floorRange(h, pitchDeg) {
  return h / Math.tan(pitchDeg * DEG);
}

function pairDistance(h, p1, b1, p2, b2) {
  const r1 = floorRange(h, p1), r2 = floorRange(h, p2);
  if (b1 == null || b2 == null) return Math.abs(r2 - r1); // yön bilinmiyorsa noktalar bakış doğrultusunda sayılır
  const d = (b1 - b2) * DEG;
  return Math.sqrt(Math.max(0, r1 * r1 + r2 * r2 - 2 * r1 * r2 * Math.cos(d)));
}

/** f(değişkenler) değerini ve sayısal kısmi türevlerle birinci dereceden belirsizliğini verir. */
export function propagate(f, vars, sigmas) {
  const value = f(vars);
  let s2 = 0;
  for (const [k, sd] of Object.entries(sigmas)) {
    if (vars[k] == null || !sd) continue;
    const e = k.startsWith('h') ? 1e-4 : 1e-3;
    const up = f({ ...vars, [k]: vars[k] + e }), dn = f({ ...vars, [k]: vars[k] - e });
    const dfdx = (up - dn) / (2 * e);
    s2 += (dfdx * sd) ** 2;
  }
  return { value, sigma: Math.sqrt(s2) };
}

const SD = { h: SIGMA.height, p1: SIGMA.pitch, p2: SIGMA.pitch, b1: SIGMA.bearing, b2: SIGMA.bearing };

/** Sizden uzaklık (zemindeki tek nokta). */
export function rangeOf(h, a) {
  return propagate((v) => floorRange(v.h, v.p1), { h, p1: a.pitch }, SD);
}

/** İki zemin noktası arası (mesafe kipi ve genişlik kipi). */
export function distanceBetween(h, a, b) {
  return propagate((v) => pairDistance(v.h, v.p1, v.b1, v.p2, v.b2),
    { h, p1: a.pitch, b1: a.bearing, p2: b.pitch, b2: b.bearing }, SD);
}

/** Taban (zemin) ve tepe bakışından yükseklik. Tepe tabanın üstünde değilse null. */
export function heightOf(h, base, top) {
  const m = propagate((v) => v.h - floorRange(v.h, v.p1) * Math.tan(v.p2 * DEG), { h, p1: base.pitch, p2: top.pitch }, SD);
  return m.value > 0 ? m : null;
}

/** Ölçüm akışı: her kipte hangi adımdayız, hangi düğme, hangi ipucu. points: seçilen bakışlar. */
export const FLOW = {
  distance: { steps: 2, buttons: ['cm_btn_start', 'cm_btn_end'], subs: ['cm_sub_start', 'cm_sub_end'] },
  height: { steps: 2, buttons: ['cm_btn_base', 'cm_btn_top'], subs: [null, null] },
  width: { steps: 2, buttons: ['cm_btn_edge', 'cm_btn_edge'], subs: ['cm_sub_edge', 'cm_sub_edge'] },
};

/** Ekrandaki ipucu (anahtar ve yer tutucu düğme adı). */
export function hintFor(mode, n, hasHeight) {
  if (!hasHeight) return { key: 'cm_hint_height_needed' };
  if (n >= 2) return { key: 'cm_hint_done' };
  if (mode === 'distance') return n === 0 ? { key: 'cm_hint_floor_first', arg: 'cm_btn_start' } : { key: 'cm_hint_floor_second' };
  if (mode === 'height') return n === 0 ? { key: 'cm_hint_floor_first', arg: 'cm_btn_base' } : { key: 'cm_hint_top' };
  return n === 0 ? { key: 'cm_hint_edge_left', arg: 'cm_btn_edge' } : { key: 'cm_hint_edge_right' };
}

/** Bir adımda bu bakış kabul edilir mi? Yükseklik kipinin tepe adımı zemine bakmak zorunda değildir. */
export function stepProblem(mode, n, h, aim) {
  if (!(h > 0)) return 'NeedHeight';
  if (!aim) return 'NoAim';
  if (mode === 'height' && n === 1) return aim.pitch > AIM.maxDown ? 'AimHigher' : null;
  return aimProblem(h, aim);
}

/** Seçilen noktalardan sonuç: { main: Measurement, you: Measurement } (henüz yoksa null). */
export function result(mode, h, points) {
  if (!points.length) return null;
  const you = rangeOf(h, points[0]);
  if (points.length < 2) return { main: null, you };
  if (mode === 'height') return { main: heightOf(h, points[0], points[1]), you };
  return { main: distanceBetween(h, points[0], points[1]), you };
}
