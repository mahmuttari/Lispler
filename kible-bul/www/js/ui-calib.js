// The calibration helper: a full-screen guide for the figure-eight movement that lets the phone's magnetic sensor settle.
// A web page cannot calibrate the sensor itself (Android does that while the phone is moved); what the app can do is show the movement, watch that the
// phone really turns around all its axes, and - in the app - read what Android says about the sensor: the helper finishes when the movement was
// enough AND Android rates the magnetometer "high".
import { h, icon } from './dom.js';
import { t } from './i18n.js';
import { eightMarkup } from './art.js';
import { angleDiff } from './qibla.js';
import { hold, release, onStatus, onRaw, getStatus } from './compass.js';
import { accName } from './quality.js';
import { reklamEngeli } from './reklam.js';

const NEED_TRAVEL = 900;       // degrees of turning in total
const NEED_RANGE = 150;        // degrees of tilt range, front-back plus left-right

export function openCalibration() {
  if (active) return active;
  let last = null, travel = 0, bMin = 999, bMax = -999, gMin = 999, gMax = -999, events = 0, done = false, timer = 0, progress = 0;
  const bar = h('i'), pct = h('b', { text: '0%' }), status = h('p', { class: 'cstatus', text: t('calib.hint') });
  const accLine = h('p', { class: 'cacc', hidden: true });
  const closeBtn = h('button', { class: 'bigbtn gold', text: t('calib.cancel'), onclick: close });
  const root = h('div', { class: 'calib', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('calib.title') },
    h('button', { class: 'ibtn cx', 'aria-label': t('calib.cancel'), onclick: close }, icon('close')),
    h('h2', { text: t('calib.title') }),
    h('div', { class: 'eightbox', html: eightMarkup() }),
    h('p', { class: 'cinfo', text: t('calib.info') }),
    h('div', { class: 'cprog' }, h('div', { class: 'cbar' }, bar), pct),
    accLine, status, closeBtn);
  document.body.append(root);
  reklamEngeli('kalibrasyon', true);                     // no banner over the calibration helper (and no interstitial while it is open)
  hold('calib');                                         // the sensor runs while the helper is open (also when it was opened from the settings)

  // does Android rate the sensor? (-1: no answer, as in a browser: the movement alone decides)
  const rated = () => { const s = getStatus(); return s.source === 'native' && s.acc >= 0; };

  function onStat(s) {
    if (s.source !== 'native') return;
    accLine.hidden = s.acc < 0;
    if (s.acc >= 0) { accLine.textContent = t('calib.accuracy', t('acc.' + accName(s.acc))); accLine.dataset.level = s.acc >= 3 ? 'good' : s.acc === 2 ? 'mid' : 'bad'; }
    check();
  }

  // the web's events (a browser, or a phone without the native sensor) and the native rotation matrix feed the same movement measure; only one of them at a time
  const native = () => getStatus().source === 'native';
  function onOrient(e) {
    if (e.alpha === null || e.alpha === undefined || native()) return;
    feed(e.alpha, e.beta ?? 0, e.gamma ?? 0);
  }
  function onMatrix(R) {
    const D = 180 / Math.PI;
    feed(Math.atan2(R[1], R[4]) * D, Math.asin(Math.max(-1, Math.min(1, R[7]))) * D, Math.atan2(-R[6], R[8]) * D);   // heading of the top edge, front-back tilt, left-right tilt
  }
  function feed(a, b, g) {
    if (done) return;
    events++;
    if (last) travel += Math.min(90, Math.abs(angleDiff(last.a, a))) + Math.min(90, Math.abs(b - last.b)) + Math.min(90, Math.abs(g - last.g));
    last = { a, b, g };
    bMin = Math.min(bMin, b); bMax = Math.max(bMax, b); gMin = Math.min(gMin, g); gMax = Math.max(gMax, g);
    const range = (bMax - bMin) + (gMax - gMin);
    progress = Math.min(1, 0.6 * Math.min(1, travel / NEED_TRAVEL) + 0.4 * Math.min(1, range / NEED_RANGE));
    bar.style.width = (progress * 100).toFixed(0) + '%';
    pct.textContent = (progress * 100).toFixed(0) + '%';
    check();
  }

  function check() {
    if (done || progress < 0.985) return;
    if (rated() && getStatus().acc < 3) { status.textContent = t('calib.keepGoing'); return; }   // enough movement, but the phone still doubts its sensor
    finish();
  }

  function finish() {
    done = true;
    root.classList.add('done');
    status.textContent = t('calib.done');
    closeBtn.textContent = t('calib.ok');
    bar.style.width = '100%'; pct.textContent = '100%';
  }

  const off = onStatus(onStat), offRaw = onRaw(onMatrix);
  function close() {
    window.removeEventListener('deviceorientationabsolute', onOrient, true);
    window.removeEventListener('deviceorientation', onOrient, true);
    off(); offRaw(); release('calib');
    clearTimeout(timer);
    root.remove();
    active = null;
    reklamEngeli('kalibrasyon', false);
  }

  window.addEventListener('deviceorientationabsolute', onOrient, true);
  window.addEventListener('deviceorientation', onOrient, true);
  timer = setTimeout(() => { if (!events && !getStatus().at) status.textContent = t('calib.noSensor'); }, 2500);
  onStat(getStatus());
  active = { close };
  return active;
}

let active = null;
export const calibrationOpen = () => active !== null;
export function closeCalibration() { if (active) active.close(); }
