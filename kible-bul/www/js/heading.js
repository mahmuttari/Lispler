// The heading of the phone as the screens use it, degrees clockwise from north. The sensor gives MAGNETIC north; the declination of the place turns it into TRUE north,
// and the user's own correction (Settings > Compass correction: for a compass that is always off by the same amount) is added on top.
import { S } from './state.js';
import { currentHeading } from './compass.js';
import { info } from './place.js';
import { norm360 } from './qibla.js';

const correction = () => Number(S.settings.offset) || 0;

/** the heading of the phone's top edge from TRUE north, with the correction: for everything that works with true bearings (the arrows to the mosques); null before the first reading */
export function trueHeading() {
  const raw = currentHeading();
  if (raw === null) return null;
  const i = info();
  return norm360(raw + (i ? i.decl : 0) + correction());
}

/** the heading as the compass SHOWS it: from true north, or - when Settings > North says magnetic north - from the sensor's own north; the correction applies in both */
export function shownHeading() {
  const raw = currentHeading();
  if (raw === null) return null;
  const i = info();
  return norm360(raw + (S.settings.trueNorth && i ? i.decl : 0) + correction());
}

/** the heading as shownHeading() but WITHOUT the correction: what the correction is measured against */
export function uncorrectedHeading() {
  const raw = currentHeading();
  if (raw === null) return null;
  const i = info();
  return norm360(raw + (S.settings.trueNorth && i ? i.decl : 0));
}

/** the Qibla bearing of a place in the same reference as shownHeading(): from true north, or from magnetic north in magnetic mode */
export const shownQibla = i => (S.settings.trueNorth ? i.bearing : i.magBearing);
