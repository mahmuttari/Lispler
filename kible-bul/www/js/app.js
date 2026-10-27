// Shell: the screens, the tab bar, theme and language, the back button, the welcome, the ads (AdMob, js/reklam.js) and the membership.
//   ?heading=NN   a fixed compass heading instead of the sensor (desktop browser, screenshots)
//   ?place=41.0082,28.9784,Istanbul,TR   a place instead of asking for the position
//   ?ob=1  show the welcome   ?lang=xx  language   ?night=1  night mode
import { h, icon, $ } from './dom.js';
import { t, loadLang, dir, detectLang } from './i18n.js';
import { S, save } from './state.js';
import { closeTop, sheetOpen } from './sheet.js';
import { installDefs } from './art.js';
import { mountCompass } from './ui-compass.js';
import { mountMap } from './ui-map.js';
import { mountPlace } from './ui-place.js';
import { mountSettings } from './ui-settings.js';
import { showOnboarding } from './ui-onboard.js';
import { calibrationOpen, closeCalibration } from './ui-calib.js';
import { setFixedHeading, setTestStatus, pause as pauseSensor, resume as resumeSensor, currentHeading, hasReadings, getStatus } from './compass.js';
import { setPlace, useGps, refreshIfStale, info } from './place.js';
import { ensureCities } from './cities.js';
import { onBack, setBars, onResume, keepAwake } from './native.js';
import { isPremium, refresh as refreshPremium, onChange as onPremiumChange } from './premium.js';
import { reklamAyarla, reklamBaslat, reklamDurdur, reklamEngeli, gecisFirsati, reklamGorunurluk, KURAL } from './reklam.js';

const TABS = [['compass', 'compass'], ['map', 'map'], ['place', 'map-pin'], ['settings', 'settings']];
const params = new URLSearchParams(location.search);
let current = 'compass', trail = [], mods = {}, onboarding = null;
let mapSince = 0, adOpenNow = false;   // when the map was opened (a look of a few seconds is a natural pause for an ad); an interstitial is on screen

function applyLook() {
  const el = document.documentElement;
  el.dataset.style = S.settings.style;
  el.dataset.night = S.settings.night ? '1' : '0';
  setBars(true);
}

const api = {
  // opts.after: 'search' when a place was chosen (search, coordinates, recent places): a natural pause for an interstitial
  go(id, opts) { if (id === current) return; trail.push(current); show(id); if (opts && opts.after === 'search') gecisFirsati('arama'); },
  back() { show(trail.pop() || 'compass'); },
};

function build() {
  const main = $('#main'), bar = $('#tabbar');
  main.replaceChildren();
  mods = {};
  const sections = {};
  for (const [id] of TABS) { sections[id] = h('section', { class: 'screen ' + id, id: 'scr-' + id }); main.append(sections[id]); }
  mods.compass = mountCompass(sections.compass, api);
  mods.map = mountMap(sections.map, api);
  mods.place = mountPlace(sections.place, api);
  mods.settings = mountSettings(sections.settings, api, changed);
  bar.replaceChildren(...TABS.map(([id, ic]) => h('button', { role: 'tab', 'data-tab': id, onclick: () => { trail = []; show(id); } }, icon(ic), h('span', { text: t('nav.' + id) }))));
  main.querySelectorAll('.top h1').forEach(el => el.classList.toggle('long', el.textContent.length > 16));
  show(current, true);
}

function show(id, force) {
  if (!force && mods[current] && mods[current].onHide && id !== current) mods[current].onHide();
  // leaving the map after a real look at it is a natural pause (an interstitial may come, by the rules of reklam.js)
  const leftMap = current === 'map' && id !== 'map' && mapSince && Date.now() - mapSince >= KURAL.haritaEnAzMs;
  mapSince = id === 'map' ? Date.now() : 0;
  current = id;
  document.querySelectorAll('.screen').forEach(el => el.classList.toggle('on', el.id === 'scr-' + id));
  document.querySelectorAll('#tabbar button').forEach(b => { const on = b.dataset.tab === id; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
  $('#app').classList.toggle('no-tabs', id === 'settings');
  if (mods[id] && mods[id].onShow) mods[id].onShow();
  if (leftMap) gecisFirsati('harita');
}

async function applyLang() {
  await loadLang(S.settings.lang);
  document.documentElement.lang = S.settings.lang;
  document.documentElement.dir = dir();   // Arabic is right-to-left; the dial and the map stay left-to-right
  document.title = t('app.name');
}

async function changed(kind) {
  save();
  applyLook();
  if (kind === 'lang') { save(true); location.reload(); return; }   // a fresh start in the new language (every screen and the place names are built from it)
  Object.values(mods).forEach(m => m.refresh && m.refresh());
}

function finishWelcome() {
  S.onboarded = true; save(true);
  onboarding = null;
  reklamEngeli('karsilama', false);
  // the location prompt first, the ad consent form (where required) after it: never two dialogs on top of each other
  (S.place ? Promise.resolve() : useGps()).finally(startAds);
}

// ---- ads (Google AdMob: rules and reasons at the top of js/reklam.js). A member never gets here: the ads wait for
// Google Play's answer about the membership (at most 6 s), so a subscriber who reinstalls the app never starts AdMob.
let storeAnswered = null;
async function startAds() {
  await storeAnswered;
  if (S.onboarded && !isPremium()) reklamBaslat();
}
// something is open that an interstitial must never cover: a sheet, the calibration, the welcome, typing
const busy = () => sheetOpen() || calibrationOpen() || !!onboarding || isTyping() || document.visibilityState !== 'visible';
const isTyping = () => { const a = document.activeElement; return !!a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA'); };
reklamAyarla({
  uye: isPremium,
  engelVar: busy,
  // while an interstitial covers the app the compass sensor is off; it comes back when the ad is closed
  gecisAcik: open => { adOpenNow = open; if (open) pauseSensor(); else if (document.visibilityState === 'visible') backToFront(); },
  gizlilikDegisti: () => { if (mods.settings) mods.settings.refresh(); },
});
onPremiumChange(() => { if (isPremium()) reklamDurdur(); else startAds(); if (mods.settings) mods.settings.refresh(); });
// the banner hides while the keyboard is up (typing a city or coordinates)
let typingTimer = 0;
document.addEventListener('focusin', () => { if (isTyping()) { clearTimeout(typingTimer); reklamEngeli('klavye', true); } });
document.addEventListener('focusout', () => { clearTimeout(typingTimer); typingTimer = setTimeout(() => { if (!isTyping()) reklamEngeli('klavye', false); }, 250); });

// ---- start
storeAnswered = Promise.race([refreshPremium().catch(() => {}), new Promise(r => setTimeout(r, 6000))]);
if (params.get('lang')) S.settings.lang = detectLang(params.get('lang'));
if (params.get('night')) S.settings.night = params.get('night') === '1';
await applyLang();
applyLook();
installDefs();
if (params.get('place')) {
  const [lat, lon, name, cc] = params.get('place').split(',');
  if (Number.isFinite(+lat) && Number.isFinite(+lon)) setPlace({ mode: 'manual', lat: +lat, lon: +lon, name: name || '', cc: cc || '' });
}
if (params.get('heading') !== null && params.get('heading') !== '') setFixedHeading(Number(params.get('heading')));
window.__kibleHeading = setFixedHeading;
window.__kibleStatus = setTestStatus;
window.__kibleState = () => ({ heading: currentHeading(), readings: hasReadings(), ...getStatus() });
window.__kibleDecl = () => { const i = info(); return i ? i.decl : null; };   // for the emulator test
build();

if (!S.onboarded || params.get('ob')) { reklamEngeli('karsilama', true); onboarding = showOnboarding({ onDone: finishWelcome }); }
else if (!S.place) useGps().finally(startAds);
else { refreshIfStale(); startAds(); }
// the names of the places in the language of the app arrive a moment later
if (S.place) ensureCities().then(ok => { if (ok) Object.values(mods).forEach(m => m.refresh && m.refresh()); });

function backToFront() { resumeSensor(); if (current === 'compass') keepAwake(true); refreshIfStale(); }
document.addEventListener('visibilitychange', () => {
  reklamGorunurluk(!document.hidden);
  if (document.hidden) pauseSensor();
  else if (!adOpenNow) backToFront();
});

onResume(() => { refreshPremium(); startAds(); });   // ads that could not start (offline at launch) are tried again

onBack(() => {
  if (sheetOpen()) { closeTop(); return true; }
  if (calibrationOpen()) { closeCalibration(); return true; }
  if (onboarding) { if (onboarding.back()) return true; return false; }
  if (current !== 'compass') { if (trail.length) api.back(); else show('compass'); return true; }
  return false;
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeTop(); });
