// How far the compass can be trusted. What tells, from the weakest to the strongest evidence:
//  - the accuracy Android reports for the magnetometer (0 unreliable, 1 low, 2 medium, 3 high: the phone's own, coarse judgement of its calibration) and, where the phone gives it,
//    the estimated heading error of the rotation-vector sensor (degrees); the estimate only lowers the label that is shown, it never raises a warning by itself;
//  - the strength of the field it measures against the strength the Earth has there (World Magnetic Model). This alone is nearly blind: a disturbance that bends the direction by
//    25 degrees can leave the total strength within 3 % of the Earth's (in Turkey the horizontal part of the field is only about half of the total, and that part is what the needle reads);
//  - the field split in its horizontal and vertical parts and the dip angle (the angle of the field below the horizon), each against the Earth's values: a disturbance changes them.
//    Two levels: a SOFT deviation lowers the accuracy shown; only a HARD one raises the warning and silences the buzz. Even this cannot see a disturbance exactly across the horizontal
//    field (that bends the heading without changing any strength): the compass correction (ui-correction.js) is the remedy for such a constant error.
// The limits were chosen so that a phone whose accelerometer is a few degrees off, or whose magnetometer has a residual of a few microtesla, does not set them off (audit of 2026-10-24).
// Pure functions, tested in Node.
import { angleDiff } from './qibla.js';

const NAMES = ['unreliable', 'low', 'medium', 'high'];
export const accName = acc => NAMES[acc] || 'unknown';

// the measured total field may differ from the Earth's by this much before the direction is not to be trusted
export const FIELD_LOW = 0.7, FIELD_HIGH = 1.4;
// the horizontal and the vertical part may differ by this share (but never by less than the floor in microtesla: a tilt error of a few degrees moves them by that much), the dip angle by this many degrees
export const SOFT = { share: 0.2, floor: 4, dip: 8 }, HARD = { share: 0.35, floor: 5, dip: 15 };

/**
 * The magnetic field the phone measures, split with gravity. R: the rotation matrix of the phone (row-major, device -> east / north / up: its last row is "up" in the phone's own axes),
 * b: the calibrated field in the phone's axes, microtesla -> { h (horizontal part), z (the part pointing down), f (total), dip (degrees below the horizon, positive in the north hemisphere) } or null.
 * No heading is needed for this, so it is true even when the heading is wrong.
 */
export function fieldParts(R, b) {
  if (!R || R.length < 9 || !b || b.length < 3) return null;
  const up = R[6] * b[0] + R[7] * b[1] + R[8] * b[2];
  const n2 = b[0] * b[0] + b[1] * b[1] + b[2] * b[2];
  if (!(n2 > 0) || !Number.isFinite(up)) return null;
  const h = Math.sqrt(Math.max(0, n2 - up * up));
  return { h, z: -up, f: Math.sqrt(n2), dip: Math.atan2(-up, h) * 180 / Math.PI };
}

/** the heading accuracy the rotation-vector sensor estimates for itself (radians; <= 0 or missing: the phone does not say) -> degrees, or -1 */
export const estimateDeg = rad => (Number.isFinite(rad) && rad > 0 ? Math.min(180, rad * 180 / Math.PI) : -1);
/** the accuracy bucket of such an estimate, in the words of accName. The sensor promises its error stays below the estimate 95 % of the time, so the typical error is about half of it: up to 15 degrees high, 30 medium, 60 low */
export const estName = deg => (deg < 0 ? 'unknown' : deg <= 15 ? 'high' : deg <= 30 ? 'medium' : deg <= 60 ? 'low' : 'unreliable');
const ORDER = ['unreliable', 'low', 'medium', 'high'];
const worse = (a, b) => (a === 'unknown' ? b : b === 'unknown' ? a : ORDER.indexOf(a) <= ORDER.indexOf(b) ? a : b);

// does the measured field differ from the Earth's by more than a level allows?
function deviates(p, expected, lv) {
  const f = expected.f || Math.hypot(expected.h, expected.z);
  const hDen = Math.max(expected.h, 0.2 * f), zDen = Math.max(Math.abs(expected.z), 0.2 * f);   // near the magnetic equator the vertical part is tiny: do not divide by it
  return Math.abs(p.h - expected.h) > Math.max(lv.share * hDen, lv.floor) || Math.abs(p.z - expected.z) > Math.max(lv.share * zDen, lv.floor) || Math.abs(p.dip - expected.incl) > lv.dip;
}

/**
 * status: { acc: 0..3 or -1 when unknown, field: measured microtesla (0 when unknown), parts: fieldParts() or null, est: estimated heading error in degrees or -1 },
 * expectedUt: the Earth's field at the place (0 when no place yet), expected: { h, z, f, incl } its parts there, or null (pass null when the place is not where the phone is: a place chosen by hand)
 * -> { acc: 'high' | 'medium' | 'low' | 'unreliable' | 'unknown' (what Android says), shown (what to show: the worse of Android's rating and the sensor's own estimate; a soft deviation at best 'medium', a hard one at best 'low'),
 *      ratio: measured / expected or null, interference (a disturbed field: the strength out of range or a HARD deviation of the parts), vector (the HARD parts test alone), soft (the SOFT parts test),
 *      bad (the warning), reason: 'interference' | 'calibrate' | null }
 */
export function assess(status, expectedUt, expected) {
  const field = status && status.field > 0 ? status.field : 0;
  const ratio = field > 0 && expectedUt > 0 ? field / expectedUt : null;
  const p = status && status.parts;
  const usable = !!(p && expected && expected.h > 0);
  const vector = usable && deviates(p, expected, HARD), soft = usable && deviates(p, expected, SOFT);
  const interference = (ratio !== null && (ratio < FIELD_LOW || ratio > FIELD_HIGH)) || vector;
  const lowAcc = !!status && (status.acc === 0 || status.acc === 1);
  const acc = accName(status ? status.acc : -1);
  const base = worse(acc, estName(status && status.est > 0 ? status.est : -1));
  const cap = interference ? 'low' : soft ? 'medium' : null;
  return { acc, shown: cap ? worse(base === 'unknown' ? cap : base, cap) : base, ratio, interference, vector, soft, bad: !!(interference || lowAcc), reason: interference ? 'interference' : lowAcc ? 'calibrate' : null };
}

/**
 * Keeps a warning from flickering: it appears only after the condition held for `ms`, and goes only after the opposite held for `ms`.
 * update(bad, nowMs) -> whether the warning is shown
 */
export class Dwell {
  constructor(ms = 2000) { this.ms = ms; this.reset(); }
  reset() { this.shown = false; this.since = null; this.last = null; }
  update(bad, now) {
    if (bad === this.last) { /* same state continues */ } else { this.last = bad; this.since = now; }
    if (bad !== this.shown && now - this.since >= this.ms) this.shown = bad;
    return this.shown;
  }
}

/**
 * The "aligned" verdict with a little hysteresis: it lights when the heading is within `enter` degrees of the Qibla and goes out only when it is more than `leave` away,
 * so that a heading that trembles at the limit does not make the picture (and the buzz) flicker.
 */
export const alignedNow = (was, diff, enter, leave) => (was ? diff <= leave : diff <= enter);

/**
 * The compass correction that makes a heading agree with a direction the person knows: shown heading + correction = known direction. Rounded to a tenth of a degree, in (-180, 180].
 */
export const correctionFor = (heading, known) => clampCorrection(angleDiff(heading, known));
/** a correction as it is stored: a number of degrees within +-180, one decimal */
export const clampCorrection = v => (Number.isFinite(v) ? Math.max(-180, Math.min(180, Math.round(v * 10) / 10)) : 0);
