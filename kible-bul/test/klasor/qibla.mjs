// Qibla bearing, distance, great-circle path, compass heading and number formats.
import { KAABA, bearing, distanceKm, qiblaBearing, kaabaDistanceKm, atKaaba, greatCircle, headingFromOrientation, smoothAngle, angleDiff, norm360, fmtDeg, fmtKm, fmtCoordPart } from '../../www/js/qibla.js';

export async function run({ ok, near }) {
  // Istanbul 41.0082 N 28.9784 E: 151.6 deg and 2,405 km (the sample numbers in the design mock-up, 151.2 and 2.867 km, were placeholders)
  ok(fmtDeg(qiblaBearing(41.0082, 28.9784)) === '151.6', 'Istanbul bearing is 151.6', qiblaBearing(41.0082, 28.9784));
  ok(fmtKm(kaabaDistanceKm(41.0082, 28.9784)) === '2.405', 'Istanbul distance is 2.405 km', kaabaDistanceKm(41.0082, 28.9784));

  // well-known bearings (degrees from true north) - references agree to about a degree
  near(qiblaBearing(51.5074, -0.1278), 118.99, 0.3, 'London bearing about 119');
  near(qiblaBearing(40.7128, -74.006), 58.48, 0.3, 'New York bearing about 58.5');
  near(qiblaBearing(-6.2088, 106.8456), 295.1, 0.5, 'Jakarta bearing about 295');
  near(qiblaBearing(35.6762, 139.6503), 293.0, 0.6, 'Tokyo bearing about 293');
  near(qiblaBearing(30.0444, 31.2357), 136.1, 0.5, 'Cairo bearing about 136');
  near(qiblaBearing(39.9334, 32.8597), 160.2, 0.3, 'Ankara bearing about 160');
  near(qiblaBearing(-33.8688, 151.2093), 277.5, 1, 'Sydney bearing about 277');
  near(qiblaBearing(34.0522, -118.2437), 23.9, 0.6, 'Los Angeles bearing about 24');
  // due south of Mecca the Qibla is north, due north of it south
  near(qiblaBearing(0, KAABA.lon), 0, 1e-9, 'directly south of the Kaaba: north');
  near(qiblaBearing(50, KAABA.lon), 180, 1e-9, 'directly north of the Kaaba: south');
  // Alaska: the Qibla over the pole is almost north
  ok(qiblaBearing(64.8, -147.7) < 10 || qiblaBearing(64.8, -147.7) > 350, 'Fairbanks: nearly north (over the pole)', qiblaBearing(64.8, -147.7));

  near(distanceKm(0, 0, 0, 1), 111.195, 0.01, 'one degree of longitude on the equator');
  near(distanceKm(51.5074, -0.1278, 21.422487, 39.826206), 4760, 40, 'London to Mecca about 4,760 km');
  ok(distanceKm(10, 20, 10, 20) === 0, 'distance to itself is 0');
  ok(atKaaba(21.4225, 39.8262) && !atKaaba(21.43, 39.83), 'atKaaba');

  // angle helpers
  ok(norm360(-10) === 350 && norm360(370) === 10 && norm360(720) === 0, 'norm360');
  ok(angleDiff(350, 10) === 20 && angleDiff(10, 350) === -20 && angleDiff(0, 180) === 180 && angleDiff(90, 90) === 0, 'angleDiff');
  ok(Math.abs(smoothAngle(350, 10, 0.5) - 0) < 1e-9 && smoothAngle(null, 123, 0.2) === 123 && Math.abs(smoothAngle(10, 350, 0.25) - 5) < 1e-9, 'smoothAngle goes round the short way');

  // great circle: ends, continuity, and it bends towards the pole as it should (London -> Mecca passes north of the straight map line)
  {
    const gc = greatCircle(41.0082, 28.9784, KAABA.lat, KAABA.lon, 50);
    ok(gc.length === 51 && Math.abs(gc[0][0] - 41.0082) < 1e-9 && Math.abs(gc[50][0] - KAABA.lat) < 1e-9 && Math.abs(gc[50][1] - KAABA.lon) < 1e-9, 'great circle ends');
    ok(gc.every((p, i) => i === 0 || Math.abs(p[1] - gc[i - 1][1]) < 5), 'great circle is continuous');
    const far = greatCircle(35.68, 139.65, KAABA.lat, KAABA.lon, 40);
    ok(far.every((p, i) => i === 0 || Math.abs(p[1] - far[i - 1][1]) < 10), 'a long path (Tokyo) is continuous');
    const wrap = greatCircle(34, -118, KAABA.lat, KAABA.lon, 40);
    ok(wrap.every((p, i) => i === 0 || Math.abs(p[1] - wrap[i - 1][1]) < 10), 'a path across the date line side (Los Angeles) is continuous');
    // the first step of the path leaves at the initial bearing
    const [la, lo] = gc[1];
    near(bearing(41.0082, 28.9784, la, lo), qiblaBearing(41.0082, 28.9784), 0.2, 'the path leaves at the Qibla bearing');
  }

  // compass: held flat the top edge is the reference, alpha is how far the phone was turned counter-clockwise from north
  near(headingFromOrientation(0, 0, 0), 0, 1e-9, 'flat, alpha 0: facing north');
  near(headingFromOrientation(90, 0, 0), 270, 1e-9, 'flat, turned 90 left: facing west');
  near(headingFromOrientation(270, 0, 0), 90, 1e-9, 'flat, alpha 270: facing east');
  near(headingFromOrientation(180, 0, 0), 180, 1e-9, 'flat, alpha 180: facing south');
  // a little tilt does not move a flat phone's heading
  near(headingFromOrientation(90, 20, -15), 270, 1e-9, 'tilted a little: same heading');
  near(headingFromOrientation(0, 30, 10), 0, 1e-9, 'tilted forward: same heading');
  // stood upright (beta 90) the back of the phone is the pointer: alpha 0 -> the back faces south? the phone at alpha 0 points its top to north, the back faces away from the user
  {
    // upright facing north: top edge up, screen toward the user (south), back toward north: beta = 90, alpha = 0
    near(headingFromOrientation(0, 90, 0), 0, 1e-9, 'upright, alpha 0: back faces north');
    near(headingFromOrientation(90, 90, 0), 270, 1e-9, 'upright, alpha 90: back faces west');
    near(headingFromOrientation(270, 90, 0), 90, 1e-9, 'upright, alpha 270: back faces east');
  }
  // the switch between the two modes must not jump: just under and just over the threshold (about 60 deg from flat)
  {
    const a = headingFromOrientation(120, 58, 0), b = headingFromOrientation(120, 62, 0);
    ok(Math.abs(angleDiff(a, b)) < 3, 'no jump between flat mode and upright mode', a + ' vs ' + b);
  }

  // number formats
  ok(fmtDeg(151.2345) === '151.2' && fmtDeg(151.2345, true) === '151,2' && fmtDeg(359.96) === '0.0' && fmtDeg(-0.04) === '0.0' && fmtDeg(0) === '0.0', 'fmtDeg', [fmtDeg(151.2345), fmtDeg(359.96), fmtDeg(-0.04)].join(' '));
  ok(fmtKm(2867.3) === '2.867' && fmtKm(999.6) === '1.000' && fmtKm(12345.6) === '12.346' && fmtKm(0.2) === '0' && fmtKm(2867.3, ' ') === '2 867' && fmtKm(2867.3, ',') === '2,867', 'fmtKm', [fmtKm(2867.3), fmtKm(999.6), fmtKm(12345.6)].join(' '));
  ok(fmtCoordPart(41.0082, 'N', 'S') === '41.0082° N' && fmtCoordPart(-28.9784, 'E', 'W') === '28.9784° W' && fmtCoordPart(41.0082, 'K', 'G', true) === '41,0082° K', 'fmtCoordPart');
}
