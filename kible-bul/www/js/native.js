// The only file that knows about Capacitor / Android. In a desktop browser (tests, `npm run serve`) every call is a harmless no-op or falls back to the web API.
const cap = typeof window !== 'undefined' ? window.Capacitor : undefined;
export const isNative = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
// plugin calls return a promise, or a plain handle (addListener): either way a failure must not break the page
const safe = f => { try { Promise.resolve(f()).catch(() => {}); } catch (e) { /* plugin missing */ } };
const plug = name => (cap.Plugins && cap.Plugins[name]) || cap.registerPlugin(name);

// handler() -> true when it dealt with the back button; otherwise the app closes
export function onBack(handler) {
  if (!isNative) return;
  safe(() => plug('App').addListener('backButton', () => { if (!handler()) safe(() => plug('App').exitApp()); }));
}

// status / navigation bar icons: dark UI -> light icons
export function setBars(dark) {
  if (!isNative) return;
  safe(() => plug('SystemBars').setStyle({ style: dark ? 'DARK' : 'LIGHT' }));
}

// the app comes back to the front (for example from the Play subscription page): cb()
export function onResume(cb) {
  if (!isNative) return;
  safe(() => plug('App').addListener('resume', cb));
}

// a web page in the phone's browser (a Chrome Custom Tab on Android)
export function openUrl(url) {
  if (!/^https:\/\//.test(url)) return;
  if (isNative) safe(() => plug('Browser').open({ url }));
  else window.open(url, '_blank', 'noopener');
}

// a native plugin by name (NativePurchases): null outside the Android app
export const plugin = name => (isNative ? plug(name) : null);

// Kıble Bul's own small plugin (android/.../KibleYerelPlugin.java): Google Play's page for THIS app's subscription
// (play.google.com/store/account/subscriptions?sku=…&package=…, opened in the Play Store app). true when it opened.
export async function openSubscriptions(sku) {
  if (!isNative) return false;
  try { await plug('KibleYerel').abonelikleriYonet({ sku }); return true; } catch (e) { return false; }
}

// one short buzz. In the app it goes through the native Haptics plugin (a web page may only vibrate after the user has touched it; the compass buzzes by itself)
export function vibrate(ms = 30) {
  if (isNative) { safe(() => plug('Haptics').vibrate({ duration: ms })); return; }
  // a browser refuses (and logs an error) before the first tap on the page: then there is simply no buzz
  try { if (navigator.vibrate && !(navigator.userActivation && !navigator.userActivation.hasBeenActive)) navigator.vibrate(ms); } catch (e) { /* no vibrator */ }
}

/**
 * The approximate position of the phone (the Qibla needs no more than a few kilometres).
 * -> { ok: true, lat, lon, accuracy }  or  { ok: false, reason: 'denied' | 'disabled' | 'timeout' | 'unavailable' }
 * On Android the Geolocation plugin asks for the permission itself the first time (coarse location only).
 */
export async function getPosition({ timeout = 20000 } = {}) {
  const fail = e => {
    try { console.warn('position: ' + JSON.stringify(e, e && typeof e === 'object' ? Object.getOwnPropertyNames(e) : undefined)); } catch (x) { /* nothing to log */ }
    const s = String((e && (e.code || e.message)) || e || '');
    if (/GLOC-0003|denied|PERMISSION_DENIED|^1$/i.test(s)) return { ok: false, reason: 'denied' };
    if (/GLOC-0007|GLOC-0009|GLOC-0016|GLOC-0017|disabled|not enabled/i.test(s)) return { ok: false, reason: 'disabled' };
    if (/GLOC-0010|timeout|TIMEOUT|^3$/i.test(s)) return { ok: false, reason: 'timeout' };
    return { ok: false, reason: 'unavailable' };
  };
  try {
    if (isNative) {
      const r = await plug('Geolocation').getCurrentPosition({ enableHighAccuracy: false, timeout, maximumAge: 300000 });
      return { ok: true, lat: r.coords.latitude, lon: r.coords.longitude, accuracy: r.coords.accuracy };
    }
    if (!navigator.geolocation) return { ok: false, reason: 'unavailable' };
    const r = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: false, timeout, maximumAge: 300000 }));
    return { ok: true, lat: r.coords.latitude, lon: r.coords.longitude, accuracy: r.coords.accuracy };
  } catch (e) { return fail(e); }
}

// keep the screen on while the compass is in use (the Screen Wake Lock API; a phone held flat for a minute must not go dark)
let wake = null;
export async function keepAwake(on) {
  try {
    if (on) { if (!wake && navigator.wakeLock) { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); } }
    else if (wake) { await wake.release(); wake = null; }
  } catch (e) { wake = null; /* not allowed here: fine */ }
}
