// How far the compass can be trusted. Two things tell: the accuracy Android reports for the magnetometer (0 unreliable, 1 low, 2 medium, 3 high:
// the phone's own judgement of its calibration) and the strength of the magnetic field it measures against the strength the Earth has there
// (World Magnetic Model): a magnet, a steel frame, a loudspeaker or a metal case bends the field, and then the direction can be many degrees off.
// Pure functions, tested in Node.

const NAMES = ['unreliable', 'low', 'medium', 'high'];
export const accName = acc => NAMES[acc] || 'unknown';

// the measured field may differ from the Earth's by this much before the direction is not to be trusted: a disturbance a third as strong as the Earth's field already bends the
// direction by up to about 17 degrees (indoors, near steel, a loudspeaker or a magnetic case the measured strength is often 30-50 % off)
export const FIELD_LOW = 0.7, FIELD_HIGH = 1.4;

/**
 * status: { acc: 0..3 or -1 when unknown, field: measured microtesla (0 when unknown) }, expectedUt: the Earth's field at the place (0 when no place yet)
 * -> { acc: 'high' | 'medium' | 'low' | 'unreliable' | 'unknown' (what Android says), shown (what to show: with interference at best 'low'), ratio: measured / expected or null, interference, bad, reason: 'interference' | 'calibrate' | null }
 */
export function assess(status, expectedUt) {
  const field = status && status.field > 0 ? status.field : 0;
  const ratio = field > 0 && expectedUt > 0 ? field / expectedUt : null;
  const interference = ratio !== null && (ratio < FIELD_LOW || ratio > FIELD_HIGH);
  const lowAcc = status && (status.acc === 0 || status.acc === 1);
  const acc = accName(status ? status.acc : -1);
  return { acc, shown: interference && (acc === 'high' || acc === 'medium' || acc === 'unknown') ? 'low' : acc, ratio, interference, bad: !!(interference || lowAcc), reason: interference ? 'interference' : lowAcc ? 'calibrate' : null };
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
