// The only file that knows about Capacitor / Android, apart from the ads (reklam.js). In a desktop browser (araclar/tarayici-dene.mjs) every call is a harmless no-op.
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

// a link handed to Android itself (an ACTION_VIEW intent): Capacitor's WebView client sends every navigation away from the app's own origin to
// Android instead of loading it (Bridge.launchIntent), so Google Play opens its own page and mailto: the mail app. -> true when it was handed over
export function openExternal(url) {
  if (!/^(https:\/\/|mailto:)/.test(url)) return false;
  try {
    if (isNative || url.startsWith('mailto:')) window.location.href = url;
    else window.open(url, '_blank', 'noopener');
    return true;
  } catch (e) { return false; }
}

// a native plugin by name (NativePurchases): null outside the Android app
export const plugin = name => (isNative ? plug(name) : null);
