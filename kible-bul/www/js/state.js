// Everything the app remembers between runs: one JSON object in localStorage (every access is guarded: it can be blocked or empty).
import { detectLang } from './i18n.js';

const KEY = 'kible-bul.v1';

export const S = {
  settings: {
    lang: detectLang(typeof navigator !== 'undefined' ? navigator.language : ''),
    night: false,          // "Gece Modu": dark dial and dark cards
    style: 'green',        // compass style: green | gold | classic
    degrees: true,         // degree numbers on the dial
    kaaba: '3d',           // the Kaaba picture: 3d | 2d | off
    trueNorth: true,       // correct the phone's magnetic north to true north (World Magnetic Model)
    vibrate: true,         // one short buzz when the phone points at the Qibla
    map: 'sat',            // map picture: sat | map
    labels: true,          // country names on the map
  },
  place: null,             // { mode: 'gps' | 'manual', lat, lon, name, cc, at }  the place the Qibla is measured from
  recents: [],             // [{ name, cc, lat, lon }] places chosen by hand, newest first
  onboarded: false,
  premium: { active: false, plan: null, checkedAt: 0 },   // the ad-free membership as the store last told us
};

(function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!raw || typeof raw !== 'object') return;
    Object.assign(S.settings, raw.settings || {});
    if (raw.place && Number.isFinite(raw.place.lat) && Number.isFinite(raw.place.lon)) S.place = raw.place;
    S.recents = Array.isArray(raw.recents) ? raw.recents.filter(r => r && Number.isFinite(r.lat) && Number.isFinite(r.lon)).slice(0, 8) : [];
    S.onboarded = !!raw.onboarded;
    if (raw.premium && typeof raw.premium === 'object') Object.assign(S.premium, raw.premium);
  } catch (e) { /* first run, or storage unavailable */ }
})();

let timer = 0;
export function save(now) {
  clearTimeout(timer);
  const write = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } };
  if (now) write(); else timer = setTimeout(write, 300);
}
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (document.hidden) save(true); });
