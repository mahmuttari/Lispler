// The compass trust rules (Android's accuracy rating and the magnetic field strength against the Earth's field) and the matrix-based heading.
import { assess, accName, Dwell } from '../../www/js/quality.js';
import { headingFromMatrix, headingFromOrientation, angleDiff } from '../../www/js/qibla.js';
import { expectedFieldUt } from '../../www/js/wmm.js';

// the W3C rotation matrix R = Rz(alpha) Rx(beta) Ry(gamma) of the device in the world (east, north, up), row-major, as Android's getRotationMatrixFromVector gives it
function matrixFromEuler(alpha, beta, gamma) {
  const r = Math.PI / 180, ca = Math.cos(alpha * r), sa = Math.sin(alpha * r), cb = Math.cos(beta * r), sb = Math.sin(beta * r), cg = Math.cos(gamma * r), sg = Math.sin(gamma * r);
  return [ca * cg - sa * sb * sg, -sa * cb, ca * sg + sa * sb * cg,
    sa * cg + ca * sb * sg, ca * cb, sa * sg - ca * sb * cg,
    -cb * sg, sb, cb * cg];
}

export async function run({ ok }) {
  // the heading from the matrix is the heading from the three angles, flat and upright, everywhere on the sphere of tilts
  let worst = 0, n = 0;
  for (let alpha = 0; alpha < 360; alpha += 17) for (let beta = -170; beta <= 170; beta += 10) for (let gamma = -80; gamma <= 80; gamma += 20) {
    const flat = Math.cos(beta * Math.PI / 180) * Math.cos(gamma * Math.PI / 180);
    const a = headingFromOrientation(alpha, beta, gamma), b = headingFromMatrix(matrixFromEuler(alpha, beta, gamma));
    worst = Math.max(worst, Math.abs(angleDiff(a, b))); n++;
  }
  ok(worst < 1e-6 && n > 3000, 'headingFromMatrix agrees with headingFromOrientation (' + n + ' tilts)', 'worst ' + worst);
  // a phone lying flat, top edge to the east: R maps device y to east
  ok(Math.abs(headingFromMatrix([1, 0, 0, 0, 1, 0, 0, 0, 1]) - 0) < 1e-9, 'identity matrix: facing north');
  ok(Math.abs(headingFromMatrix([0, 1, 0, -1, 0, 0, 0, 0, 1]) - 90) < 1e-9, 'device y to the east: heading 90');

  // trust
  ok(accName(3) === 'high' && accName(2) === 'medium' && accName(1) === 'low' && accName(0) === 'unreliable' && accName(-1) === 'unknown' && accName(undefined) === 'unknown', 'accName');
  const exp = 48.1;
  const good = assess({ acc: 3, field: 47 }, exp), mid = assess({ acc: 2, field: 50 }, exp), low = assess({ acc: 1, field: 48 }, exp), unrel = assess({ acc: 0, field: 48 }, exp);
  ok(!good.bad && good.reason === null && good.acc === 'high', 'high accuracy and a normal field: trusted');
  ok(!mid.bad && mid.acc === 'medium', 'medium accuracy: still trusted (shown only in the chip)');
  ok(low.bad && low.reason === 'calibrate' && unrel.bad && unrel.reason === 'calibrate', 'low / unreliable accuracy: calibrate');
  const strong = assess({ acc: 3, field: 120 }, exp), weak = assess({ acc: 3, field: 20 }, exp);
  ok(strong.bad && strong.reason === 'interference' && weak.bad && weak.reason === 'interference', 'a field far too strong or too weak: interference, even with high accuracy');
  ok(strong.shown === 'low' && weak.shown === 'low' && good.shown === 'high' && mid.shown === 'medium' && low.shown === 'low' && unrel.shown === 'unreliable', 'with interference the accuracy shown is at best low');
  ok(assess({ acc: 3, field: 48.1 * 1.35 }, exp).bad === false && assess({ acc: 3, field: 48.1 * 0.75 }, exp).bad === false && assess({ acc: 3, field: 48.1 * 1.45 }, exp).bad === true && assess({ acc: 3, field: 48.1 * 0.65 }, exp).bad === true, 'the limits are 0.7x and 1.4x');
  const unknown = assess({ acc: -1, field: 0 }, 0);
  ok(!unknown.bad && unknown.ratio === null && unknown.acc === 'unknown', 'nothing known (a browser): no warning');
  ok(assess({ acc: 3, field: 60 }, 0).bad === false, 'no place yet: the field cannot be judged');
  ok(assess(null, 40).bad === false, 'no status at all');

  // the warning does not flicker
  const d = new Dwell(2000);
  ok(d.update(true, 0) === false && d.update(true, 1500) === false && d.update(true, 2100) === true, 'a problem is shown after 2 s');
  ok(d.update(false, 2200) === true && d.update(false, 3000) === true && d.update(false, 4300) === false, 'and goes after 2 s of calm');
  ok(d.update(true, 4400) === false && d.update(false, 4500) === false && d.update(true, 4600) === false && d.update(true, 6700) === true, 'a short blip does not show it, a long one does');

  // the Earth's field at some places (NOAA test values: 41.06 uT at the equator 120E; 55.18 uT at 80N 0E)
  ok(Math.abs(expectedFieldUt(0, 120, new Date(Date.UTC(2025, 0, 1))) - 41.06) < 0.05 && Math.abs(expectedFieldUt(80, 0, new Date(Date.UTC(2025, 0, 1))) - 55.18) < 0.05, 'expectedFieldUt against the NOAA test values');
  const ist = expectedFieldUt(41.0082, 28.9784);
  ok(ist > 46 && ist < 50, 'about 48 uT in Istanbul', ist.toFixed(2));
}
