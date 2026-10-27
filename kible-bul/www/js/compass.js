// The phone's compass: one smoothed heading (degrees clockwise from MAGNETIC north) and the state of the sensor behind it.
// In the app the native Compass plugin delivers the rotation matrix of the phone together with Android's accuracy rating and the measured field strength
// (see android/.../CompassPlugin.java); in a browser (and on a phone where the plugin finds no sensor) the web's device-orientation events are used.
// Screens ask for the sensor with hold(name) and give it back with release(name); pause()/resume() follow the app going to the background.
import { headingFromOrientation, headingFromMatrix, smoothAngle, angleDiff } from './qibla.js';
import { isNative, plugin } from './native.js';

const listeners = new Set(), statusListeners = new Set(), rawListeners = new Set(), holders = new Set();
let running = false, paused = false, heading = null, fixed = null, events = 0, lastAt = 0, absoluteSeen = false, fallbackTimer = 0, session = 0;
let status = { source: 'none', acc: -1, field: 0, at: 0 };   // source: 'native' | 'web' | 'none'
let nat = null, natHandle = null;

export const onHeading = cb => { listeners.add(cb); return () => listeners.delete(cb); };
export const onStatus = cb => { statusListeners.add(cb); return () => statusListeners.delete(cb); };
/** the native sensor's rotation matrix as it arrives (9 numbers), for things that follow the movement of the phone (the calibration helper) */
export const onRaw = cb => { rawListeners.add(cb); return () => rawListeners.delete(cb); };
export const currentHeading = () => (fixed !== null ? fixed : heading);
/** is there a sensor at all? false until the first reading arrives (or for ever on a phone without a compass) */
export const hasReadings = () => fixed !== null || events > 0;
export const lastReadingAt = () => lastAt;
/** { source, acc (0 unreliable .. 3 high, -1 unknown), field (microtesla, 0 unknown), at } */
export const getStatus = () => ({ ...status });

function emit() { for (const f of listeners) f(currentHeading()); }
function emitStatus() { for (const f of statusListeners) f(status); }

// a quick turn must follow at once, a still phone must not tremble: the smoothing grows with the size of the change
function take(raw) {
  const d = heading === null ? 180 : Math.abs(angleDiff(heading, raw));
  heading = smoothAngle(heading, raw, d > 30 ? 0.7 : d > 10 ? 0.35 : d > 3 ? 0.18 : 0.08);
  events++; lastAt = Date.now();
}

// ---- the web's events
function onOrientation(e) {
  if (fixed !== null) return;
  if (e.alpha === null || e.alpha === undefined) return;
  // "deviceorientationabsolute" is relative to the earth's magnetic north; plain "deviceorientation" only when it says it is absolute
  if (e.type === 'deviceorientation' && e.absolute !== true) return;
  if (e.type === 'deviceorientationabsolute') absoluteSeen = true;
  else if (absoluteSeen) return;                              // both fire on Android: use the absolute one
  take(headingFromOrientation(e.alpha, e.beta ?? 0, e.gamma ?? 0));
  status = { source: 'web', acc: -1, field: 0, at: Date.now() };
  emit(); emitStatus();
}

function startWeb() {
  window.addEventListener('deviceorientationabsolute', onOrientation, true);
  // phones whose WebView has no "absolute" event: plain deviceorientation, if it is absolute; wait a moment first so the absolute one wins when it exists
  fallbackTimer = setTimeout(() => { if (running && !absoluteSeen) window.addEventListener('deviceorientation', onOrientation, true); }, 1200);
}
function stopWeb() {
  clearTimeout(fallbackTimer);
  window.removeEventListener('deviceorientationabsolute', onOrientation, true);
  window.removeEventListener('deviceorientation', onOrientation, true);
}

// ---- the native plugin
function onNative(ev) {
  if (fixed !== null || !ev || !ev.r || ev.r.length < 9) return;
  take(headingFromMatrix(ev.r));
  status = { source: 'native', acc: Number.isFinite(ev.acc) ? ev.acc : -1, field: Number.isFinite(ev.field) ? ev.field : 0, at: Date.now() };
  emit(); emitStatus();
  for (const f of rawListeners) f(ev.r);
}

async function startNative() {
  if (!isNative) return false;
  try {
    nat = nat || plugin('Compass');
    const r = await nat.start();
    if (!r || !r.available) return false;
    if (!natHandle) natHandle = await nat.addListener('reading', onNative);
    return true;
  } catch (e) { return false; }   // the plugin is missing or the phone has no sensors: the web's events are tried
}
function stopNative() { try { if (nat) nat.stop(); } catch (e) { /* already stopped */ } }

function begin() {
  if (running) return;
  running = true;
  const my = ++session;
  startNative().then(ok => {
    if (my !== session) { if (ok && !running) stopNative(); return; }   // stopped while the plugin was answering (a newer start, if any, keeps the sensors)
    if (!ok && running) startWeb();
  });
}
function end() {
  if (!running) return;
  running = false; session++;
  stopNative();
  stopWeb();
}

/** a screen needs the compass: it runs while somebody holds it */
export function hold(name) { holders.add(name); if (!paused) begin(); }
export function release(name) { holders.delete(name); if (!holders.size) end(); }
/** the app went to the background / came back */
export function pause() { paused = true; end(); }
export function resume() { paused = false; if (holders.size) begin(); }

// for demos and tests (?heading=NN in the address, or window.__kibleHeading(deg)): a fixed heading instead of the sensor; null gives the sensor back
export function setFixedHeading(deg) {
  fixed = deg === null || deg === undefined ? null : ((Number(deg) % 360) + 360) % 360;
  if (fixed !== null) lastAt = Date.now();
  emit();
}

// for demos and tests (window.__kibleStatus(acc, field)): pretend the native sensor reported this accuracy (0..3) and field strength (microtesla); null clears it
export function setTestStatus(acc, field) {
  if (acc === null || acc === undefined) { status = { source: 'none', acc: -1, field: 0, at: 0 }; emitStatus(); return; }
  status = { source: 'native', acc, field: field || 0, at: Date.now() };
  if (!events) events = 1;
  emitStatus();
}
