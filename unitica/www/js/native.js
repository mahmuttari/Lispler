// The thin bridge to Capacitor. In a desktop browser (development) every call does nothing.
const cap = typeof window !== 'undefined' ? window.Capacitor : undefined;
export const isNative = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
/** a debuggable build (assembleDebug): the ads use Google's test units there */
export const isDebugBuild = !!(isNative && cap.DEBUG);
/** 'android' | 'ios' | 'web' (desktop browser) */
export const platform = isNative && cap.getPlatform ? cap.getPlatform() : 'web';
export const isIOS = platform === 'ios';
const plug = name => (cap.Plugins && cap.Plugins[name]) || cap.registerPlugin(name);

/** a native plugin by name (AdMob, NativePurchases): null outside the Android / iPhone app */
export const plugin = name => {
  if (!isNative) return null;
  try { return plug(name); } catch (e) { return null; }
};

/** onBack() -> true when it handled the button (closed a sheet, went home ...); false = leave the app */
export function initNative(onBack) {
  if (!isNative) return;
  try { plug('App').addListener('backButton', () => { if (!onBack()) plug('App').exitApp().catch(() => {}); }); } catch (e) { /* no App plugin: the system default applies */ }
}

/** the app went to the background (pause) / came back to the front (resume), for example from the Play subscription page */
export function onAppState(onPause, onResume) {
  if (!isNative) return;
  try {
    const app = plug('App');
    app.addListener('pause', () => onPause()).catch(() => {});
    app.addListener('resume', () => onResume()).catch(() => {});
  } catch (e) { /* no App plugin */ }
}

/**
 * System bar icons: the status bar always sits on the navy hero (light icons); the navigation bar follows the page theme.
 * SystemBars style names are about the BAR: DARK = light icons on a dark bar, LIGHT = dark icons on a light bar.
 */
export function setBars(isDark) {
  if (!isNative) return;
  try {
    const bars = plug('SystemBars');
    bars.setStyle({ style: 'DARK', bar: 'StatusBar' }).catch(() => {});
    bars.setStyle({ style: isDark ? 'DARK' : 'LIGHT', bar: 'NavigationBar' }).catch(() => {});
  } catch (e) { /* plugin missing: the defaults stay */ }
}
