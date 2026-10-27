// Entry point: language, theme, the four tabs, the back button, the membership and the ads.
import { state, onChange, saveNow } from './state.js';
import { setLang, t } from './i18n.js';
import { icon, esc, $, $$ } from './dom.js';
import { closeSheet, sheetOpen } from './sheet.js';
import { initNative, setBars } from './native.js';
import { startMembership } from './plans.js';
import { sekmeDegisti, klavye } from './reklam.js';
import { mountHome, renderHome, refreshHome, loadEntry, handleBack as homeBack } from './home.js';
import { mountLists, renderHistory, renderFavorites } from './lists.js';
import { mountMore, renderMore } from './more.js';

const TABS = [
  { id: 'home', icon: 'house', label: 'tab.home' },
  { id: 'history', icon: 'history', label: 'tab.history' },
  { id: 'favorites', icon: 'star', label: 'tab.favorites' },
  { id: 'more', icon: 'ellipsis', label: 'tab.more' },
];

let tab = 'home';
const scrollTops = {};
const screen = id => $('#s-' + id);

// ---------------------------------------------------------------- theme
const dark = matchMedia('(prefers-color-scheme: dark)');
function applyTheme() {
  const isDark = state.theme === 'dark' || (state.theme === 'system' && dark.matches);
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  $('meta[name="theme-color"]').content = isDark ? '#0B1220' : '#F4F7FC';
  setBars(isDark);
}
dark.addEventListener('change', () => { if (state.theme === 'system') applyTheme(); });

// ---------------------------------------------------------------- tabs
function renderNav() {
  $('#tabbar').innerHTML = TABS.map(x =>
    `<button type="button" class="tab" data-tab="${x.id}" aria-label="${esc(t(x.label))}" ${x.id === tab ? 'aria-current="page"' : ''}>${icon(x.icon)}<span>${esc(t(x.label))}</span></button>`).join('');
}

const RENDER = { history: renderHistory, favorites: renderFavorites, more: renderMore };

/** how: 'tab' (the tab bar), 'back' (the back button), 'entry' (a history row / favorite opened), 'settings' (the gear on Home) */
function showTab(id, how = 'tab') {
  const old = screen(tab);
  const was = tab;
  scrollTops[tab] = old.scrollTop;
  tab = id;
  if (RENDER[id]) RENDER[id](screen(id));
  for (const x of TABS) screen(x.id).hidden = x.id !== id;
  for (const b of $$('.tab')) { if (b.dataset.tab === id) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); }
  screen(id).scrollTop = scrollTops[id] || 0;
  if (was !== id) sekmeDegisti(was, id, how, () => ({ altSayfa: sheetOpen() }));   // the only place an interstitial may come (reklam-kural.js)
}

const openEntry = entry => { loadEntry(entry); showTab('home', 'entry'); screen('home').scrollTop = 0; $('#card').scrollIntoView({ block: 'start' }); };

/** language or a setting changed */
function rerender(what) {
  if (what === 'lang') {
    setLang(state.lang);
    renderNav();
    renderHome();
    document.title = t('app.name');
  }
  if (what === 'theme') applyTheme();
  if (what === 'digits' || what === 'decimal' || what === 'notation') refreshHome();
  if (RENDER[tab]) RENDER[tab](screen(tab));
}

// ---------------------------------------------------------------- back button
function onBack() {
  if (sheetOpen()) { closeSheet(); return true; }
  if (tab !== 'home') { showTab('home', 'back'); return true; }
  return homeBack();
}

// ---------------------------------------------------------------- start
setLang(state.lang);
document.title = t('app.name');
applyTheme();
renderNav();
mountHome(screen('home'), { openSettings: () => showTab('more', 'settings') });
mountLists(screen('history'), screen('favorites'), { open: openEntry });
mountMore(screen('more'), { rerender });
$('#tabbar').addEventListener('click', ev => {
  const b = ev.target.closest('.tab');
  if (!b) return;
  if (b.dataset.tab === tab) screen(tab).scrollTo({ top: 0, behavior: 'smooth' });
  else showTab(b.dataset.tab, 'tab');
});
onChange(what => {
  if (tab === 'history' && what === 'history') renderHistory(screen('history'));
  if (tab === 'favorites' && what === 'favorites') renderFavorites(screen('favorites'));
  if (tab === 'more' && what === 'member') renderMore(screen('more'));
});
// the on-screen keyboard: while a text field has focus the tab bar and the ad banner step aside
const typing = el => el && el.matches && el.matches('input[type="text"], input[type="search"]');
document.addEventListener('focusin', ev => { if (typing(ev.target)) { document.documentElement.classList.add('kb'); klavye(true); } });
document.addEventListener('focusout', ev => {
  if (!typing(ev.target)) return;
  setTimeout(() => { if (!typing(document.activeElement)) { document.documentElement.classList.remove('kb'); klavye(false); } }, 80);
});
initNative(onBack);
document.addEventListener('visibilitychange', () => { if (document.hidden) saveNow(); });
addEventListener('pagehide', saveNow);
document.documentElement.classList.add('ready');
startMembership();   // asks Google Play first; the ads start only for a user without the ad-free membership
