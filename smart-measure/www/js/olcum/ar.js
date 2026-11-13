// Kamerayla ölçüm (özgün uygulamanın "yöntem B"si; ARCore değil): kameranın baktığı yön ve kullanıcının girdiği
// telefon yüksekliğiyle trigonometri. Saf işlevler; node:test ile sınanır.
//
//   Zemindeki bir noktanın yatay uzaklığı   r = h / tan(θ)        θ: kameranın ufkun altına bakış açısı
//   Zemindeki iki nokta arası (A, B)       d² = rA² + rB² − 2·rA·rB·cos(φA − φB)      φ: yatay yön (pusula açısı)
//   Nesnenin yüksekliği (taban + tepe)     H = h − r_taban · tan(θ_tepe)              (tepe ufkun üstündeyse θ < 0)
//   Genişlik (sol ve sağ kenarın zemindeki noktaları) iki nokta arası uzaklıktır.
//
// Sınırlar: zemin noktası ufkun en az 8° altında (daha yatay bakışta uzaklık çok belirsizleşir), en çok 85° (dümdüz aşağı);
// yükseklik kipinde tepe ufkun en çok 75° üstünde (daha dik bakışta tepe tabanın üstünde değildir).
// Belirsizlik: girdilerin standart sapmalarıyla (yükseklik 2 cm, eğim 0,4°, yön 1°; seçim anında telefon oynuyorsa o
// oynama da eklenir) birinci dereceden yayılım.
// Seçim anı: düğmeye dokunmak telefonu oynatır (ekranın altına basınca kamera yukarı kalkar; 12°'de 1° ≈ %9 uzaklık).
// Bu yüzden bakış, dokunmadan hemen önceki sakin pencerenin ortalamasıdır (steadyAim): parmak ekrana değmeden 350–80 ms
// öncesi. Pencerenin ortası (≈ 215 ms) insanın "çarpı hedefte" deyip parmağını indirmesi arasındaki süreye denk gelir.

const DEG = Math.PI / 180;
export const AIM = { minDown: 8, maxDown: 85, maxUp: 75 };
export const HEIGHT = { min: 0.5, max: 2.2, step: 0.01 };
export const SIGMA = { height: 0.02, pitch: 0.4, bearing: 1.0 };
export const MAX_RANGE = 80; // m: bundan uzak nokta gösterilmez (8°'de 2,2 m yükseklik ≈ 15,7 m; pay bırakıldı)
/** Seçim penceresi (ms, dokunmadan önce), en az örnek, kabul edilen en büyük oynama (°, karekök ortalama) */
export const STEADY = { from: 350, to: 80, min: 3, maxSpread: 1.0 };

const clamp1 = (v) => Math.max(-1, Math.min(1, v));
const wrap180 = (d) => ((d % 360) + 540) % 360 - 180;

/** Yön vektörü (dünya: Z yukarı) → bakış. pitch: ufkun altına derece (aşağı bakış artı), bearing: derece (0…360). */
export function aimFromDirection(d, withBearing = true) {
  const n = Math.hypot(d.x, d.y, d.z);
  if (!(n > 0)) return null;
  return { pitch: Math.asin(clamp1(-d.z / n)) / DEG, bearing: withBearing ? ((Math.atan2(d.x, d.y) / DEG) + 360) % 360 : null };
}

/** Döndürme matrisi (Android getRotationMatrixFromVector, satır sıralı 9 sayı; cihaz → dünya) → bakış.
 *  Arka kamera cihazın −z ekseni boyunca bakar. */
export function aimFromRotation(R) {
  return aimFromDirection({ x: -R[2], y: -R[5], z: -R[8] });
}

/** Yalnız yerçekiminden (ivmeölçer): eğim bilinir, yön bilinmez. */
export function aimFromGravity(g) {
  const n = Math.hypot(g.x, g.y, g.z);
  if (!(n > 1)) return null;
  return { pitch: Math.asin(clamp1(g.z / n)) / DEG, bearing: null };
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

/** Seçim anındaki bakış: yön örneklerinin (samples: [{t, x, y, z}], t ms) dokunmadan önceki sakin penceredeki ortalaması.
 *  → { pitch, bearing, sp, sb, n } (sp, sb: penceredeki oynama, °) ya da null (pencerede yeterli örnek yok).
 *  from: pencerenin başı (ms önce); örnek akışı tekleyince çağıran daha geniş pencereyle yeniden dener. */
export function steadyAim(samples, now, withBearing = true, from = STEADY.from) {
  const w = samples.filter((s) => s.t >= now - from && s.t <= now - STEADY.to);
  if (w.length < STEADY.min) return null;
  let x = 0, y = 0, z = 0;
  for (const s of w) { const n = Math.hypot(s.x, s.y, s.z) || 1; x += s.x / n; y += s.y / n; z += s.z / n; }
  const mean = aimFromDirection({ x, y, z }, withBearing);
  if (!mean) return null;
  let vp = 0, vb = 0;
  for (const s of w) {
    const a = aimFromDirection(s, withBearing);
    vp += (a.pitch - mean.pitch) ** 2;
    if (withBearing) vb += wrap180(a.bearing - mean.bearing) ** 2;
  }
  return { ...mean, sp: Math.sqrt(vp / w.length), sb: Math.sqrt(vb / w.length), n: w.length };
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

const stepOf = (k) => (k.startsWith('h') ? 1e-4 : 1e-3);

/** f(değişkenler) değerini ve sayısal kısmi türevlerle birinci dereceden belirsizliğini verir. */
export function propagate(f, vars, sigmas) {
  const value = f(vars);
  let s2 = 0;
  for (const [k, sd] of Object.entries(sigmas)) {
    if (vars[k] == null || !sd) continue;
    const e = stepOf(k);
    const up = f({ ...vars, [k]: vars[k] + e }), dn = f({ ...vars, [k]: vars[k] - e });
    const dfdx = (up - dn) / (2 * e);
    s2 += (dfdx * sd) ** 2;
  }
  return { value, sigma: Math.sqrt(s2) };
}

/** Girdilerin standart sapmaları: sabit paylar + o nokta seçilirken ölçülen oynama (sp, sb). */
function sdOf(a, b) {
  const sd = { h: SIGMA.height, p1: Math.hypot(SIGMA.pitch, a.sp || 0), b1: Math.hypot(SIGMA.bearing, a.sb || 0) };
  if (b) { sd.p2 = Math.hypot(SIGMA.pitch, b.sp || 0); sd.b2 = Math.hypot(SIGMA.bearing, b.sb || 0); }
  return sd;
}

/** Sizden uzaklık (zemindeki tek nokta). */
export function rangeOf(h, a) {
  return propagate((v) => floorRange(v.h, v.p1), { h, p1: a.pitch }, sdOf(a));
}

/** İki zemin noktası arası (mesafe kipi ve genişlik kipi). Belirsizlik fark vektöründen hesaplanır: noktalar çakışsa da
 *  (uzaklık ≈ 0) sıfıra düşmez. Yön bilinmiyorsa noktalar aynı doğrultuda sayılır. */
export function distanceBetween(h, a, b) {
  const v = { h, p1: a.pitch, b1: a.bearing, p2: b.pitch, b2: b.bearing }, sd = sdOf(a, b);
  if (a.bearing == null || b.bearing == null) {
    const m = propagate((x) => floorRange(x.h, x.p2) - floorRange(x.h, x.p1), v, sd);
    return { value: Math.abs(m.value), sigma: m.sigma };
  }
  const f = (x) => {
    const r1 = floorRange(x.h, x.p1), r2 = floorRange(x.h, x.p2);
    return [r2 * Math.sin(x.b2 * DEG) - r1 * Math.sin(x.b1 * DEG), r2 * Math.cos(x.b2 * DEG) - r1 * Math.cos(x.b1 * DEG)];
  };
  const d0 = f(v), d = Math.hypot(d0[0], d0[1]);
  let sxx = 0, syy = 0, sxy = 0;
  for (const [k, s] of Object.entries(sd)) {
    const e = stepOf(k), up = f({ ...v, [k]: v[k] + e }), dn = f({ ...v, [k]: v[k] - e });
    const jx = (up[0] - dn[0]) / (2 * e) * s, jy = (up[1] - dn[1]) / (2 * e) * s;
    sxx += jx * jx; syy += jy * jy; sxy += jx * jy;
  }
  const tr = sxx + syy, es = Math.sqrt(tr / 2);
  if (!(d * d > tr * 1e-12)) return { value: d, sigma: es };
  const ux = d0[0] / d, uy = d0[1] / d;
  const along = Math.sqrt(Math.max(0, ux * ux * sxx + 2 * ux * uy * sxy + uy * uy * syy));
  // Uzaklık kendi belirsizliğinden küçükken doğrultu da belirsizdir: yönsüz pay yumuşakça eklenir
  return { value: d, sigma: Math.hypot(along, es * Math.max(0, 1 - d * d / tr)) };
}

/** Taban (zemin) ve tepe bakışından yükseklik. Tepe tabanın üstünde değilse null. */
export function heightOf(h, base, top) {
  const m = propagate((v) => v.h - floorRange(v.h, v.p1) * Math.tan(v.p2 * DEG), { h, p1: base.pitch, p2: top.pitch }, sdOf(base, top));
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
  if (mode === 'height') return n === 0 ? { key: 'cm_hint_base_first', arg: 'cm_btn_base' } : { key: 'cm_hint_top' };
  return n === 0 ? { key: 'cm_hint_edge_left', arg: 'cm_btn_edge' } : { key: 'cm_hint_edge_right' };
}

/** n. adımda bu bakışa nişan alınabilir mi? Yükseklik kipinin tepe adımı zemine bakmak zorunda değildir. */
export function stepProblem(mode, n, h, aim) {
  if (!(h > 0)) return 'NeedHeight';
  if (!aim) return 'NoAim';
  if (mode === 'height' && n === 1) return aim.pitch > AIM.maxDown ? 'AimHigher' : aim.pitch < -AIM.maxUp ? 'TopSteep' : null;
  return aimProblem(h, aim);
}

/** Seçilen bakış (steadyAim) kabul edilir mi? points: önceki noktalar. Adım sorunlarına ek olarak: genişlik için yön yok
 *  (NoBearing), telefon oynuyordu (Moving), yükseklik kipinde tepe tabanın üstünde değil (TopLow). */
export function pointProblem(mode, points, h, aim) {
  const p = stepProblem(mode, points.length, h, aim);
  if (p) return p;
  if (mode === 'width' && aim.bearing == null) return 'NoBearing';
  if ((aim.sp || 0) > STEADY.maxSpread || (aim.sb || 0) * Math.cos(aim.pitch * DEG) > STEADY.maxSpread) return 'Moving';
  if (mode === 'height' && points.length === 1 && !heightOf(h, points[0], aim)) return 'TopLow';
  return null;
}

/** İlk nokta seçildikten sonra, şu anki bakışla çıkacak sonuç (canlı önizleme); yoksa null. */
export function preview(mode, h, points, aim) {
  if (points.length !== 1 || stepProblem(mode, 1, h, aim)) return null;
  return mode === 'height' ? heightOf(h, points[0], aim) : distanceBetween(h, points[0], aim);
}

/** Seçilen noktalardan sonuç: { main: Measurement, you: Measurement } (henüz yoksa null). */
export function result(mode, h, points) {
  if (!points.length) return null;
  const you = rangeOf(h, points[0]);
  if (points.length < 2) return { main: null, you };
  if (mode === 'height') return { main: heightOf(h, points[0], points[1]), you };
  return { main: distanceBetween(h, points[0], points[1]), you };
}
