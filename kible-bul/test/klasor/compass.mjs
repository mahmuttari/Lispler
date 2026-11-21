// The compass chain after the audit of 2026-10-24: a heading that does not jump when the phone is rolled, the field split into its horizontal / vertical parts and the dip angle (and what that
// can and cannot detect, with a phone whose tilt is a few degrees off), the two warning levels, the user's correction, the magnetic-north mode, the alignment hysteresis.
import { headingFromMatrix, headingFromOrientation, angleDiff, norm360 } from '../../www/js/qibla.js';
import { fieldParts, assess, correctionFor, clampCorrection, alignedNow, estimateDeg, estName } from '../../www/js/quality.js';
import { field } from '../../www/js/wmm.js';

const R = Math.PI / 180;
// the W3C rotation matrix R = Rz(alpha) Rx(beta) Ry(gamma) of the device in the world (east, north, up), row-major (as Android's getRotationMatrixFromVector gives it)
function matrixFromEuler(alpha, beta, gamma) {
  const ca = Math.cos(alpha * R), sa = Math.sin(alpha * R), cb = Math.cos(beta * R), sb = Math.sin(beta * R), cg = Math.cos(gamma * R), sg = Math.sin(gamma * R);
  return [ca * cg - sa * sb * sg, -sa * cb, ca * sg + sa * sb * cg,
    sa * cg + ca * sb * sg, ca * cb, sa * sg - ca * sb * cg,
    -cb * sg, sb, cb * cg];
}
// a flat phone whose top edge faces psi (degrees clockwise from north)
const flatMatrix = psi => { const c = Math.cos(psi * R), s = Math.sin(psi * R); return [c, s, 0, -s, c, 0, 0, 0, 1]; };
// device-frame field = R^T * world field (east, north, up)
const toDevice = (Rm, w) => [Rm[0] * w[0] + Rm[3] * w[1] + Rm[6] * w[2], Rm[1] * w[0] + Rm[4] * w[1] + Rm[7] * w[2], Rm[2] * w[0] + Rm[5] * w[1] + Rm[8] * w[2]];
const mul = (a, b) => { const o = Array(9).fill(0); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) o[i * 3 + j] += a[i * 3 + k] * b[k * 3 + j]; return o; };
// a rotation about the phone's own x axis by e degrees: the matrix the phone believes in when its accelerometer is e degrees off
const tiltError = (Rm, e) => mul(Rm, [1, 0, 0, 0, Math.cos(e * R), -Math.sin(e * R), 0, Math.sin(e * R), Math.cos(e * R)]);
let seed = 20261024; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());

export async function run({ ok }) {
  // ---- the heading does not jump between the "top edge" and the "back of the phone" definitions
  // physical truth for a phone with the screen towards the sky: the top edge; for a phone stood up: the back
  let exactFlat = 0, exactUp = 0, nFlat = 0, nUp = 0;
  for (let alpha = 0; alpha < 360; alpha += 23) for (let beta = -50; beta <= 50; beta += 5) for (let gamma = -50; gamma <= 50; gamma += 5) {
    const Rm = matrixFromEuler(alpha, beta, gamma);
    if (Rm[8] < 0.51) continue;                                                                                  // a total tilt of up to 60 degrees: the top edge, exactly
    exactFlat = Math.max(exactFlat, Math.abs(angleDiff(headingFromMatrix(Rm), Math.atan2(Rm[1], Rm[4]) / R))); nFlat++;
  }
  for (let alpha = 0; alpha < 360; alpha += 23) for (let beta = 60; beta <= 120; beta += 6) for (let gamma = -40; gamma <= 40; gamma += 8) {
    const Rm = matrixFromEuler(alpha, beta, gamma);
    if (Rm[8] > 0.24) continue;                                                                                  // over 75 degrees: the back, exactly
    exactUp = Math.max(exactUp, Math.abs(angleDiff(headingFromMatrix(Rm), Math.atan2(-Rm[2], -Rm[5]) / R))); nUp++;
  }
  ok(nFlat > 1000 && nUp > 200 && exactFlat < 1e-9 && exactUp < 1e-9, 'heading: the top edge exactly up to 60 degrees of tilt (the usual way to hold a compass or to read the screen), the back exactly when the phone is stood up', exactFlat + ' ' + exactUp + ' ' + nFlat + ' ' + nUp);

  // a continuous sweep of the tilt, hand rolled by 5..30 degrees, must never jump (a hard switch at 60 degrees jumped by about the roll: 11.6 at 10, 35 at 30)
  let worstStep = 0, where = '';
  for (const roll of [0, 5, 10, 20, 30]) for (const alpha of [0, 100, 217]) {
    let prev = null;
    for (let beta = 0; beta <= 95; beta += 0.25) {
      const hd = headingFromMatrix(matrixFromEuler(alpha, beta, roll));
      if (prev !== null) { const st = Math.abs(angleDiff(prev, hd)); if (st > worstStep) { worstStep = st; where = `roll ${roll} alpha ${alpha} beta ${beta}`; } }
      prev = hd;
    }
  }
  ok(worstStep < 1.0, 'heading: no jump while the tilt sweeps from flat to upright with the hand rolled by up to 30 degrees (largest step per quarter degree)', worstStep.toFixed(3) + ' at ' + where);
  // the same for the web's three angles, and the two agree everywhere
  let worstWeb = 0, worstAgree = 0;
  for (let alpha = 0; alpha < 360; alpha += 29) for (let beta = -170; beta <= 170; beta += 7) for (let gamma = -80; gamma <= 80; gamma += 13) {
    worstAgree = Math.max(worstAgree, Math.abs(angleDiff(headingFromOrientation(alpha, beta, gamma), headingFromMatrix(matrixFromEuler(alpha, beta, gamma)))));
  }
  let prevW = null;
  for (let beta = 0; beta <= 95; beta += 0.25) { const hd = headingFromOrientation(100, beta, 15); if (prevW !== null) worstWeb = Math.max(worstWeb, Math.abs(angleDiff(prevW, hd))); prevW = hd; }
  ok(worstAgree < 1e-6 && worstWeb < 1.0, 'heading: the web angles and the native matrix give the same heading at every tilt, and the web one does not jump either', worstAgree + ' ' + worstWeb);
  ok(Math.abs(headingFromMatrix([1, 0, 0, 0, 1, 0, 0, 0, 1])) < 1e-9 && Math.abs(headingFromMatrix(flatMatrix(123.4)) - 123.4) < 1e-9 && Math.abs(headingFromMatrix(flatMatrix(359.9)) - 359.9) < 1e-9, 'heading: a flat phone reads its heading (also next to 360)');
  ok(Number.isNaN(headingFromMatrix([NaN, 0, 0, 0, NaN, 0, 0, 0, 1])), 'heading: a broken matrix gives NaN (the compass module ignores such a reading)');

  // ---- the field split with gravity: the Earth's own field comes out as the WMM values for any pose, in both hemispheres
  const earth = (lat, lon) => { const f = field(lat, lon, 0, 2026.8); return { f, ex: { h: f.h / 1000, z: f.z / 1000, f: f.f / 1000, incl: f.incl } }; };
  let worstParts = 0;
  for (const [lat, lon] of [[41.0082, 28.9784], [-33.87, 151.2], [-6.2, 106.8], [64.1, -21.9], [-33.9, 18.4]]) {
    const { ex } = earth(lat, lon), w = [0, ex.h, -ex.z];
    for (let i = 0; i < 100; i++) {
      const Rm = matrixFromEuler(rnd() * 360, (rnd() - 0.5) * 160, (rnd() - 0.5) * 160);
      const p = fieldParts(Rm, toDevice(Rm, w));
      worstParts = Math.max(worstParts, Math.abs(p.h - ex.h), Math.abs(p.z - ex.z), Math.abs(p.dip - ex.incl), Math.abs(p.f - ex.f));
    }
  }
  ok(worstParts < 1e-9 && fieldParts(null, [1, 2, 3]) === null && fieldParts(flatMatrix(0), null) === null && fieldParts(flatMatrix(0), [0, 0, 0]) === null && fieldParts([NaN, 0, 0, 0, 0, 0, NaN, 0, 0], [1, 2, 3]) === null, 'fieldParts: the Earth\'s field splits into the WMM horizontal part, vertical part and dip for any pose (Istanbul, Sydney, Jakarta, Reykjavik, Cape Town); nothing without data', worstParts + '');
  const ist = earth(41.0082, 28.9784).ex;
  ok(Math.abs(ist.h - 24.8) < 0.5 && Math.abs(ist.z - 41.3) < 0.5 && Math.abs(ist.incl - 59) < 0.5, 'the Earth\'s field in Istanbul: about 24.8 uT horizontal, 41.3 uT down, dip 59 degrees', JSON.stringify(ist));
  ok(earth(-33.87, 151.2).ex.z < 0 && earth(-33.87, 151.2).ex.incl < 0, 'in the south the field points up: negative vertical part and dip');

  // ---- what the field test sees and what it cannot see
  const places = { Istanbul: [41.0082, 28.9784], Sydney: [-33.87, 151.2], 'Kuala Lumpur': [3.14, 101.69], Reykjavik: [64.15, -21.94], Moscow: [55.75, 37.62], 'Cape Town': [-33.92, 18.42] };
  const stat = (ex, w, tilt = 0) => { const Rm = matrixFromEuler(rnd() * 360, (rnd() - 0.5) * 100, (rnd() - 0.5) * 100); const b = toDevice(Rm, w).map(x => x + gauss() * 0.4); return { acc: 3, field: Math.hypot(...b), parts: fieldParts(tilt ? tiltError(Rm, tilt) : Rm, b), est: -1 }; };
  const rate = (ex, w, tilt, key, n = 1000) => { let c = 0; for (let i = 0; i < n; i++) if (assess(stat(ex, w, tilt), ex.f, ex)[key]) c++; return c / n; };
  let worstHard = 0, worstSoft = 0, wherePlace = '';
  for (const [name, [lat, lon]] of Object.entries(places)) {
    const { ex } = earth(lat, lon), w = [0, ex.h, -ex.z];
    for (const tilt of [0, 2, 3]) { const hr = rate(ex, w, tilt, 'interference', 600), sr = rate(ex, w, tilt, 'soft', 600); if (hr > worstHard) worstHard = hr; if (sr > worstSoft) { worstSoft = sr; wherePlace = name + ' ' + tilt; } }
  }
  ok(worstHard === 0 && worstSoft < 0.03, 'the clean Earth field with sensor noise (0.4 uT) and an accelerometer up to 3 degrees off: no warning in six places from the equator to Iceland (soft level at most 3 %)', worstHard + ' / ' + worstSoft.toFixed(3) + ' at ' + wherePlace);
  const { ex } = earth(41.0082, 28.9784), W = [0, ex.h, -ex.z];
  ok(rate(ex, [0, ex.h, -ex.z + 20], 0, 'interference', 200) > 0.95, 'a vertical disturbance of 20 uT is a hard deviation (warning)');
  ok(rate(ex, [0, ex.h + 14, -ex.z], 0, 'interference', 200) > 0.95, 'a disturbance of 14 uT along the horizontal field is a hard deviation (warning)');
  ok(rate(ex, [0, ex.h, -ex.z + 11], 0, 'soft', 200) > 0.9 && rate(ex, [0, ex.h, -ex.z + 11], 0, 'interference', 200) < 0.05, 'a vertical disturbance of 11 uT is only a soft deviation: the accuracy shown drops, no warning');
  const soft = assess(stat(ex, [0, ex.h, -ex.z + 11]), ex.f, ex);
  ok(soft.soft && !soft.bad && (soft.shown === 'medium' || soft.shown === 'low'), 'a soft deviation caps the accuracy shown at medium and raises no warning', JSON.stringify({ s: soft.shown, bad: soft.bad }));
  ok(rate(ex, [30, 30, -ex.z + 30], 0, 'interference', 200) > 0.99 && assess({ acc: 3, field: 110, parts: null }, ex.f, ex).interference, 'a strong magnet is seen, with or without the field parts');
  const perp = rate(ex, [12, ex.h, -ex.z], 0, 'interference', 200);
  ok(perp < 0.2, 'KNOWN LIMIT: a disturbance exactly across the horizontal field (12 uT east, bends the heading by 26 degrees) changes no strength and is not seen by this test (the compass correction is the remedy)', String(perp));
  ok(!assess({ acc: 3, field: 48.1, parts: null, est: -1 }, ex.f, ex).interference && assess({ acc: 3, field: 48.1, parts: { h: 24.8, z: 41.3, f: 48.1, dip: 59 } }, ex.f, null).vector === false, 'no parts or no expectation (a place chosen by hand): the parts test stays silent');
  // near the magnetic equator the vertical part is tiny: it must not make every reading a disturbance
  const eq = { h: 33, z: 2, f: 33.06, incl: 3.5 };
  ok(!assess({ acc: 3, field: 33.4, parts: { h: 33.3, z: 3.2, f: 33.4, dip: 5.5 }, est: -1 }, eq.f, eq).soft && !assess({ acc: 3, field: 34, parts: { h: 33, z: 5.5, f: 33.4, dip: 9 }, est: -1 }, eq.f, eq).interference, 'near the equator a vertical part of 3 or even 5 uT instead of 2 is no disturbance');

  // the sensor's own estimate and the accuracy shown
  ok(estimateDeg(0.0873) > 4.9 && estimateDeg(0.0873) < 5.1 && estimateDeg(-1) === -1 && estimateDeg(0) === -1 && estimateDeg(undefined) === -1 && estName(5) === 'high' && estName(25) === 'medium' && estName(45) === 'low' && estName(90) === 'unreliable' && estName(-1) === 'unknown', 'rotation-vector heading estimate: radians to degrees, buckets 15 / 30 / 60 degrees (it is a 95 % bound), "unknown" when the phone does not say');
  ok(assess({ acc: 3, field: 48, est: 35 }, 48.1, null).shown === 'low' && assess({ acc: 3, field: 48, est: 8 }, 48.1, null).shown === 'high' && assess({ acc: 3, field: 48, est: 120 }, 48.1, null).bad === false, 'the accuracy shown is the worse of Android\'s rating and the sensor\'s own estimate; an estimate alone never raises the warning');
  ok(assess({ acc: 1, field: 48 }, 48.1, null).bad && assess({ acc: 1, field: 48 }, 48.1, null).reason === 'calibrate' && assess({ acc: 3, field: 150 }, 48.1, null).reason === 'interference', 'Android\'s low rating still asks for calibration, a field far out of range still says interference');

  // ---- the correction
  ok(correctionFor(140, 151.6) === 11.6 && correctionFor(355, 5) === 10 && correctionFor(10, 350) === -20 && correctionFor(0, 180) === 180 && correctionFor(100, 100) === 0 && correctionFor(0.04, 0) === 0, 'correctionFor: the signed difference between what the compass shows and the known direction, to a tenth');
  ok(clampCorrection(7.26) === 7.3 && clampCorrection(400) === 180 && clampCorrection(-400) === -180 && clampCorrection(NaN) === 0 && clampCorrection(undefined) === 0, 'clampCorrection');
  ok(alignedNow(false, 2.9, 3, 5) && !alignedNow(false, 3.1, 3, 5) && alignedNow(true, 4.9, 3, 5) && !alignedNow(true, 5.1, 3, 5), 'alignment: lights at 3 degrees, stays lit until 5');
  let toggles = 0, was = false;
  for (let i = 0; i < 400; i++) { const diff = Math.abs(3.2 + gauss() * 1.0); const now = alignedNow(was, diff, 3, 5); if (now !== was) toggles++; was = now; }
  let togglesOld = 0, wasOld = false;
  for (let i = 0; i < 400; i++) { const diff = Math.abs(3.2 + gauss() * 1.0); const now = diff <= 3; if (now !== wasOld) togglesOld++; wasOld = now; }
  ok(toggles < togglesOld / 3, 'alignment: a heading trembling around the limit flickers far less with the hysteresis', toggles + ' against ' + togglesOld);

  // ---- the place, the heading helpers and the magnetic-north mode (the screens use these)
  const { S } = await import('../../www/js/state.js');
  const { setPlace, info } = await import('../../www/js/place.js');
  const H = await import('../../www/js/heading.js');
  const C = await import('../../www/js/compass.js');
  setPlace({ mode: 'manual', lat: 41.0082, lon: 28.9784, name: 'Istanbul', cc: 'TR' });
  const i = info();
  ok(Math.abs(i.bearing - 151.6) < 0.1 && Math.abs(i.decl - 6.1) < 0.4 && Math.abs(angleDiff(i.magBearing, i.bearing - i.decl)) < 1e-9 && Math.abs(i.expected.f - i.fieldUt) < 1e-9 && Math.abs(i.expected.h - 24.8) < 0.6, 'place.info(): the Qibla from true north, from magnetic north, the declination and the Earth\'s field parts', JSON.stringify({ b: i.bearing, d: i.decl, m: i.magBearing }));
  C.setFixedHeading(i.bearing - i.decl);                               // the sensor reads the magnetic bearing of the Qibla: the phone points at the Qibla
  S.settings.offset = 0; S.settings.trueNorth = true;
  ok(Math.abs(angleDiff(H.shownHeading(), H.shownQibla(i))) < 1e-9 && Math.abs(angleDiff(H.trueHeading(), i.bearing)) < 1e-9, 'true-north mode: a phone pointing at the Qibla shows the heading of the Qibla');
  S.settings.trueNorth = false;
  ok(Math.abs(angleDiff(H.shownHeading(), H.shownQibla(i))) < 1e-9 && Math.abs(angleDiff(H.trueHeading(), i.bearing)) < 1e-9 && Math.abs(H.shownQibla(i) - i.magBearing) < 1e-9, 'magnetic-north mode: the needle is at the magnetic bearing, so a phone pointing at the Qibla is aligned (it was off by the declination); the mosque arrows stay true');
  S.settings.trueNorth = true; S.settings.offset = 12;
  ok(Math.abs(angleDiff(H.shownHeading(), i.bearing + 12)) < 1e-9 && Math.abs(angleDiff(H.uncorrectedHeading(), i.bearing)) < 1e-9 && Math.abs(angleDiff(H.trueHeading(), i.bearing + 12)) < 1e-9, 'the correction is added to the heading everywhere, and the uncorrected heading stays available');
  // setting the correction while facing the Qibla makes the phone read the Qibla
  S.settings.offset = 0;
  C.setFixedHeading(i.magBearing - 9);                                 // a phone that reads 9 degrees too low
  const corr = correctionFor(H.uncorrectedHeading(), H.shownQibla(i));
  S.settings.offset = corr;
  ok(Math.abs(corr - 9) < 0.06 && Math.abs(angleDiff(H.shownHeading(), H.shownQibla(i))) < 0.06, 'the known-direction correction of a phone that reads 9 degrees low is +9 and aligns it', corr + '');
  S.settings.offset = -150; C.setFixedHeading(10);
  ok(Math.abs(angleDiff(H.trueHeading(), 10 + i.decl - 150)) < 1e-9, 'a large negative correction wraps correctly');
  S.settings.offset = 0; C.setFixedHeading(null); S.place = null;
  ok(C.msSinceReading() === 0, 'no reading yet: not silent');
}
