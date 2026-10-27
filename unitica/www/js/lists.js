// The History and Favorites screens: both are lists of conversions that open the home screen on a tap.
import { category, unitOf, convert } from './units.js';
import { formatNumber, parseNumber, flipSign, addExponent, dropOpenExponent } from './format.js';
import { t, locale, catName, unitName, unitSym } from './i18n.js';
import { state, clearHistory, removeHistory, toggleFavorite, addHistory, setFavoriteValue } from './state.js';
import { icon, esc, ltr, onAct, copyText, keypad, focusAtEnd, keepCaret } from './dom.js';
import { upperFirst, unitLabel } from './unitui.js';
import { HERO_ART } from './hero_art.js';
import { toast } from './sheet.js';

const fmt = x => formatNumber(x, { digits: state.digits, notation: state.notation, decimal: state.decimal });

/** "just now", "5 min ago", "yesterday 14:03", "21 Oct" - short and in the language of the app */
function when(at) {
  const lang = locale();
  const d = new Date(at), now = new Date();
  const min = Math.floor((now - d) / 60000);
  if (min < 1) return t('history.now');
  if (min < 60) return new Intl.RelativeTimeFormat(lang, { numeric: 'auto' }).format(-min, 'minute');
  const sameDay = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return time;
  const yest = new Date(now); yest.setDate(now.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return new Intl.RelativeTimeFormat(lang, { numeric: 'auto' }).format(-1, 'day') + ' ' + time;
  return d.toLocaleDateString(lang, { day: 'numeric', month: 'short', ...(d.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}) }) + ' ' + time;
}

const head = (title, extra = '') => `<header class="bar"><h1>${esc(title)}</h1>${extra}</header>`;

// ---------------------------------------------------------------- history
export function renderHistory(root) {
  const items = state.history;
  const clear = items.length ? `<button type="button" class="icon-btn" data-act="clear" aria-label="${esc(t('history.clear'))}">${icon('trash-2')}</button>` : '';
  const list = items.length
    ? `<ul class="rows">${items.map((h, i) => {
      const c = category(h.c), f = unitOf(c, h.f), to = unitOf(c, h.t);
      return `<li class="row"><button type="button" class="row-main" data-act="open" data-arg="${i}">
        <span class="r-ico">${icon(c.icon)}</span>
        <span class="r-text"><b>${ltr(`${esc(fmt(parseNumber(h.v)))} ${esc(unitSym(f))} <i>→</i> ${esc(fmt(h.r))} ${esc(unitSym(to))}`)}</b><small>${esc(catName(c))} · ${esc(when(h.at))}</small></span>
      </button><button type="button" class="icon-btn row-x" data-act="del" data-arg="${i}" aria-label="${esc(t('history.remove'))}">${icon('x')}</button></li>`;
    }).join('')}</ul>`
    : `<div class="empty">${icon('history')}<p>${esc(t('history.empty'))}</p></div>`;
  root.innerHTML = head(t('history.title'), clear) + `<div class="body">${list}</div>`;
}

// ---------------------------------------------------------------- favorites
// The screen looks like the home screen: the same hero, and every favorite is a conversion card like the one on Home (type a value, read the result).
// The value of a card is kept with its favorite (state.favorites[i].v; 1 until somebody types).
const favHero = () => `<header class="hero hero-fav">${HERO_ART}<div class="hero-mark">${icon('star', 'hat')}</div><h1><b>${esc(t('favorites.title'))}</b><span>${esc(t('favorites.sub'))}</span></h1></header>`;

function favCard(p, i) {
  const c = category(p.c), f = unitOf(c, p.f), to = unitOf(c, p.t);
  const v = p.v !== undefined ? p.v : '1';
  return `<section class="card fav-card" data-i="${i}">
    <div class="card-head">
      <button type="button" class="card-open" data-act="open" data-arg="${i}" aria-label="${esc(t('favorites.open'))}">
        <span class="card-ico">${icon(c.icon)}</span>
        <span class="card-ttl"><h2>${esc(catName(c))}</h2><p>${esc(upperFirst(unitName(f)))} ↔ ${esc(upperFirst(unitName(to)))}</p></span>
      </button>
      <button type="button" class="icon-btn star" data-act="unfav" data-arg="${i}" aria-pressed="true" aria-label="${esc(t('favorites.remove'))}">${icon('star')}</button>
    </div>
    <label class="lbl" for="fv${i}">${esc(t('card.value'))}</label>
    <div class="field">
      <input id="fv${i}" class="fav-val" data-i="${i}" type="text" dir="ltr" inputmode="decimal" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" value="${esc(v)}">
      <button type="button" class="mini" data-act="fsign" data-arg="${i}" aria-label="${esc(t('card.sign'))}">±</button>
      <button type="button" class="mini" data-act="fexp" data-arg="${i}" aria-label="${esc(t('card.exp'))}">E</button>
      <span class="unit-btn static">${unitLabel(f)}</span>
    </div>
    <div class="lbl">${esc(t('card.result'))}</div>
    <div class="field out">
      <output class="fav-res" dir="ltr" aria-live="polite"></output>
      <button type="button" class="mini" data-act="fcopy" data-arg="${i}" aria-label="${esc(t('card.copy'))}">${icon('copy')}</button>
      <span class="unit-btn static">${unitLabel(to)}</span>
    </div>
    <div class="card-foot">
      <div class="chip">${icon('info')}<span>${ltr(`1 ${esc(unitSym(f))} = ${esc(fmt(convert(f, to, 1)))} ${esc(unitSym(to))}`)}</span></div>
      <button type="button" class="btn-primary" data-act="fconvert" data-arg="${i}">${icon('refresh-cw')}<span>${esc(t('card.convert'))}</span></button>
    </div>
  </section>`;
}

/** the result of one card for what is typed in it (no redraw: the keyboard stays up) */
function refreshFav(card) {
  const p = state.favorites[+card.dataset.i];
  if (!p) return;
  const c = category(p.c), f = unitOf(c, p.f), to = unitOf(c, p.t);
  const v = parseNumber(dropOpenExponent(card.querySelector('.fav-val').value));
  const bad = Number.isNaN(v);
  const r = v === null || bad ? null : convert(f, to, v);
  const out = card.querySelector('.fav-res');
  out.textContent = r === null ? '—' : fmt(r);
  out.dataset.empty = r === null ? '1' : '';
  card.querySelector('.field').classList.toggle('bad', bad);
}

// The favorites are tiles like the categories of the home screen (the selected one blue); under them the conversion card of the selected one.
// The selection is remembered by the pair (not by the place in the list: a new favorite goes to the front).
let favSelKey = '';
const keyOf = p => `${p.c}|${p.f}|${p.t}`;
const selIndex = () => { const i = state.favorites.findIndex(p => keyOf(p) === favSelKey); return i >= 0 ? i : 0; };

function favTiles(sel) {
  return `<div class="cats fav-tiles">${state.favorites.map((p, i) => {
    const c = category(p.c), f = unitOf(c, p.f), to = unitOf(c, p.t);
    const pair = `${unitSym(f)} → ${unitSym(to)}`;
    return `<button type="button" class="tile" data-act="fselect" data-arg="${i}" aria-pressed="${i === sel}" title="${esc(catName(c))}: ${esc(pair)}">${icon(c.icon)}<span>${ltr(esc(pair))}</span></button>`;
  }).join('')}</div>`;
}

/** tiles and card for the selection `sel` (an index) */
function fillFavorites(root, sel) {
  favSelKey = keyOf(state.favorites[sel]);
  root.querySelector('#fav-tiles').innerHTML = favTiles(sel);
  root.querySelector('#fav-card').innerHTML = favCard(state.favorites[sel], sel);
  refreshFav(root.querySelector('.fav-card'));
}

export function renderFavorites(root) {
  if (!state.favorites.length) {
    root.innerHTML = favHero() + `<div class="body"><div class="empty">${icon('star')}<p>${esc(t('favorites.empty'))}</p></div></div>`;
    return;
  }
  root.innerHTML = favHero() + '<div class="body"><div id="fav-tiles"></div><div id="fav-card"></div></div>';
  fillFavorites(root, selIndex());
}

/**
 * wires both screens: `open(entry)` is called with { c, f, t, v? } when a history row or the title of a favorite is tapped
 */
export function mountLists(historyRoot, favoritesRoot, { open }) {
  onAct(historyRoot, {
    open: i => { const h = state.history[+i]; if (h) open({ c: h.c, f: h.f, t: h.t, v: h.v }); },
    del: i => { const undo = removeHistory(+i); toast(t('history.removed'), { onAction: undo }); },
    clear: () => { const undo = clearHistory(); toast(t('history.cleared'), { onAction: undo }); },
  });

  const cardOf = i => favoritesRoot.querySelector(`.fav-card[data-i="${i}"]`);
  const inputOf = i => cardOf(i).querySelector('.fav-val');
  const typedIn = i => dropOpenExponent(inputOf(i).value).trim();
  const edited = i => { setFavoriteValue(+i, inputOf(i).value); refreshFav(cardOf(i)); };
  const valid = i => { const v = parseNumber(typedIn(i)); return v !== null && !Number.isNaN(v); };
  const convertCard = i => {
    const p = state.favorites[+i];
    if (!p || !valid(i)) { inputOf(i).focus(); return; }
    const c = category(p.c);
    addHistory({ c: p.c, f: p.f, t: p.t, v: typedIn(i), r: convert(unitOf(c, p.f), unitOf(c, p.t), parseNumber(typedIn(i))) });
    inputOf(i).blur();
    toast(t('card.saved'));
  };

  onAct(favoritesRoot, {
    open: i => { const p = state.favorites[+i]; if (p) open({ c: p.c, f: p.f, t: p.t, v: valid(i) ? typedIn(i) : '1' }); },
    unfav: i => {
      const p = state.favorites[+i];
      if (!p) return;
      const r = toggleFavorite(p.c, p.f, p.t);
      toast(t('card.favRemoved'), { onAction: r.undo });
    },
    fsign: i => { inputOf(i).value = flipSign(inputOf(i).value); focusAtEnd(inputOf(i)); edited(i); },
    fexp: i => {
      const input = inputOf(i);
      if (/e/i.test(input.value)) return;
      input.value = addExponent(input.value);
      focusAtEnd(input);
      edited(i);
    },
    async fcopy(i) {
      const out = cardOf(i).querySelector('.fav-res');
      if (out.dataset.empty) return;
      const p = state.favorites[+i], c = category(p.c);
      if (await copyText(fmt(convert(unitOf(c, p.f), unitOf(c, p.t), parseNumber(typedIn(i))), true))) toast(t('card.copied'));
    },
    fconvert: convertCard,
    fselect: i => { if (state.favorites[+i]) fillFavorites(favoritesRoot, +i); },
  });
  favoritesRoot.addEventListener('input', ev => { if (ev.target.classList.contains('fav-val')) edited(ev.target.dataset.i); });
  favoritesRoot.addEventListener('focusin', ev => { if (ev.target.classList.contains('fav-val') && !keepCaret(ev)) setTimeout(() => ev.target.select(), 0); });
  keypad(favoritesRoot, '.mini[data-act="fsign"], .mini[data-act="fexp"]');
  favoritesRoot.addEventListener('keydown', ev => { if (ev.key === 'Enter' && ev.target.classList.contains('fav-val')) convertCard(ev.target.dataset.i); });
}
