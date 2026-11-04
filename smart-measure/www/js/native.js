// Capacitor ve telefonla konuşan tek dosya. Android uygulamasında eklentiler: Olcer (bu uygulamanın Java eklentisi:
// sensörler, mikrofon, ekran ölçüsü, izinler, pano, paylaşma, sistem çubukları), App, Haptics. Masaüstü tarayıcıda
// (geliştirme, sınama) eklenti yoktur: sensörler DeviceMotion/DeviceOrientation'a düşer ya da "sensör yok" olur; hiçbir
// çağrı sayfayı bozmaz.
import { filterSet } from './olcum/ses.js';
import { rotationFromEuler } from './olcum/ar.js';

const cap = typeof window !== 'undefined' ? window.Capacitor : undefined;
export const isNative = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
/** 'android' | 'ios' | 'web' (masaüstü tarayıcı) */
export const platform = isNative && cap.getPlatform ? cap.getPlatform() : 'web';
export const isIOS = platform === 'ios';
const plug = (name) => (cap && cap.Plugins && cap.Plugins[name]) || (cap && cap.registerPlugin ? cap.registerPlugin(name) : null);
export const plugin = (name) => (isNative ? plug(name) : null);
const O = () => plugin('Olcer');

/** Eklenti olayı dinler; dönen işlev dinlemeyi bırakır (söz ya da tutamaç, ikisi de olur). */
export function listen(p, event, cb) {
  if (!p || !p.addListener) return () => {};
  let h = null, off = false;
  try {
    const r = p.addListener(event, cb);
    if (r && typeof r.then === 'function') r.then((x) => { h = x; if (off) x.remove(); }).catch(() => {});
    else h = r;
  } catch (e) { return () => {}; }
  return () => { off = true; if (h && h.remove) h.remove(); };
}

const safe = (f) => { try { const r = f(); if (r && r.catch) r.catch(() => {}); return r; } catch (e) { return undefined; } };

// ---- uygulama
export async function appInfo() {
  if (!isNative) return { debug: true, versionName: '1.0.0', versionCode: 1 };
  try { return await O().bilgi(); } catch (e) { return { debug: false, versionName: '', versionCode: 0 }; }
}

export function onBack(handler) {
  const app = plugin('App');
  if (!app) return;
  listen(app, 'backButton', () => { if (!handler()) safe(() => app.exitApp()); });
}

/** Arka plana gidiş / geri geliş: (aktif) => … */
export function onAppState(cb) {
  const app = plugin('App');
  if (app) listen(app, 'appStateChange', (s) => cb(!!s.isActive));
  else document.addEventListener('visibilitychange', () => cb(document.visibilityState === 'visible'));
}

export function haptic(kind = 'light') {
  const h = plugin('Haptics');
  if (h) { safe(() => (kind === 'success' ? h.notification({ type: 'SUCCESS' }) : h.impact({ style: kind === 'heavy' ? 'HEAVY' : 'LIGHT' }))); return; }
  if (navigator.vibrate) safe(() => navigator.vibrate(kind === 'success' ? [30, 40, 30] : 15));
}

export async function copyText(text) {
  if (isNative) { try { await O().kopyala({ metin: text }); return true; } catch (e) { return false; } }
  try { await navigator.clipboard.writeText(text); return true; } catch (e) { return false; }
}

export async function shareText(text) {
  if (isNative) { try { await O().paylas({ metin: text }); return true; } catch (e) { return false; } }
  if (navigator.share) { try { await navigator.share({ text }); return true; } catch (e) { return false; } }
  return copyText(text);
}

/** Bağlantıyı telefonun ilgili uygulamasında açar (play.google.com → Play Store, diğerleri tarayıcı). */
export function openUrl(url) {
  if (!/^(https:\/\/|mailto:)/.test(url)) return;
  if (isNative) safe(() => O().baglantiAc({ url }));
  else window.open(url, '_blank', 'noopener');
}

export function openAppSettings() { if (isNative) safe(() => O().ayarlariAc()); }

/** Durum çubuğu ve gezinme çubuğu: koyu tema → açık simgeler. renk: çubukların arkasındaki zemin. */
export function setBars(dark, color) { if (isNative) safe(() => O().cubuklar({ koyu: !!dark, renk: color })); }

export function keepAwake(on) { if (isNative) safe(() => O().ekranAcik({ acik: !!on })); }

/** Kamera ya da mikrofon izni: 'granted' | 'denied' (kalıcı ret, ayarlardan) | 'prompt' | 'unavailable'. */
export async function permission(name, request = false) {
  if (!isNative) {
    if (name === 'camera') return navigator.mediaDevices && navigator.mediaDevices.getUserMedia ? 'prompt' : 'unavailable';
    return 'unavailable';
  }
  try {
    const r = request ? await O().requestPermissions({ permissions: [name] }) : await O().checkPermissions();
    const s = r[name];
    return s === 'granted' ? 'granted' : s === 'denied' ? 'denied' : 'prompt';
  } catch (e) { return 'unavailable'; }
}

// ---- donanım
let capsCache = null;
/** Sensörler, kamera, flaş, mikrofon, ARCore, ekran ölçüsü. */
export async function capabilities() {
  if (capsCache) return capsCache;
  if (isNative) {
    try { capsCache = await O().yetenekler(); return capsCache; } catch (e) { /* aşağıda tarayıcı tahmini */ }
  }
  const dpr = window.devicePixelRatio || 1;
  capsCache = {
    sensors: { accelerometer: 'DeviceMotionEvent' in window, gravity: false, gyroscope: false,
      rotationVector: 'DeviceOrientationEvent' in window, gameRotationVector: false, light: 'AmbientLightSensor' in window },
    microphone: false, rearCamera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia), flash: false, arcore: false,
    display: { widthPx: Math.round(screen.width * dpr), heightPx: Math.round(screen.height * dpr), xdpi: 160 * dpr, ydpi: 160 * dpr,
      densityDpi: Math.round(160 * dpr), density: dpr },
    browser: true,
  };
  return capsCache;
}

const FIRST_EVENT_MS = 2500; // bu sürede tek okuma gelmezse "sensör yok"

/** Yerçekimi akışı: cb({x, y, z, t, source}) ya da cb(null) sensör yoksa. Dönen işlev durdurur. */
export function gravity(cb) {
  if (isNative) {
    const o = O();
    const off = listen(o, 'yercekimi', (e) => cb({ x: e.x, y: e.y, z: e.z, t: e.t, source: e.kaynak }));
    o.yercekimiBaslat().then((r) => { if (!r || !r.var) cb(null); }).catch(() => cb(null));
    return () => { off(); safe(() => o.yercekimiDurdur()); };
  }
  let got = false;
  const h = (ev) => {
    const a = ev.accelerationIncludingGravity;
    if (!a || a.x == null) return;
    got = true;
    cb({ x: a.x, y: a.y, z: a.z, t: performance.now(), source: 'accelerometer' });
  };
  window.addEventListener('devicemotion', h);
  const tm = setTimeout(() => { if (!got) cb(null); }, FIRST_EVENT_MS);
  return () => { clearTimeout(tm); window.removeEventListener('devicemotion', h); };
}

/** Yönelim akışı (kameranın yönü): cb({R: 9 sayı, t, source}) ya da cb(null). */
export function rotation(cb) {
  if (isNative) {
    const o = O();
    const off = listen(o, 'yonelim', (e) => cb({ R: e.m, t: e.t, source: e.kaynak }));
    o.yonelimBaslat().then((r) => { if (!r || !r.var) cb(null); }).catch(() => cb(null));
    return () => { off(); safe(() => o.yonelimDurdur()); };
  }
  let got = false;
  const h = (ev) => {
    if (ev.beta == null) return;
    got = true;
    cb({ R: rotationFromEuler(ev.alpha, ev.beta, ev.gamma), t: performance.now(), source: 'browser' });
  };
  window.addEventListener('deviceorientation', h);
  const tm = setTimeout(() => { if (!got) cb(null); }, FIRST_EVENT_MS);
  return () => { clearTimeout(tm); window.removeEventListener('deviceorientation', h); };
}

/** Ortam ışığı (lux): cb({lux, t}) ya da cb(null). */
export function light(cb) {
  if (isNative) {
    const o = O();
    const off = listen(o, 'isik', (e) => cb({ lux: e.lux, t: e.t }));
    o.isikBaslat().then((r) => { if (!r || !r.var) cb(null); }).catch(() => cb(null));
    return () => { off(); safe(() => o.isikDurdur()); };
  }
  if ('AmbientLightSensor' in window) {
    try {
      const s = new window.AmbientLightSensor();
      s.addEventListener('reading', () => cb({ lux: s.illuminance, t: performance.now() }));
      s.addEventListener('error', () => cb(null));
      s.start();
      return () => s.stop();
    } catch (e) { /* aşağıda */ }
  }
  const tm = setTimeout(() => cb(null), 50);
  return () => clearTimeout(tm);
}

/** Ses düzeyi: cb({fast, block, peak, clipping, seconds, source}) her ~100 ms; hata: onError('missing'|'denied'|'failed').
 *  Ses kaydedilmez: eklenti örnekleri bellekte süzgeçten geçirip yalnız düzeyi bildirir. */
export function sound(cb, onError) {
  if (!isNative) { setTimeout(() => onError('missing'), 0); return () => {}; }
  const o = O();
  const off = listen(o, 'ses', (e) => cb({ fast: e.hizli, block: e.blok, peak: e.tepe, clipping: !!e.kirpma, seconds: e.sure, source: e.kaynak }));
  const offErr = listen(o, 'sesHata', (e) => onError((e && e.neden) || 'failed'));
  o.sesBaslat({ suzgecler: filterSet() }).then((r) => {
    if (!r || !r.var) onError(r && r.neden ? r.neden : 'failed');
  }).catch((e) => onError(/izin|permission/i.test(String(e && e.message)) ? 'denied' : 'failed'));
  return () => { off(); offErr(); safe(() => o.sesDurdur()); };
}
