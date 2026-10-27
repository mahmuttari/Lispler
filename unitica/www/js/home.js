// The home screen: hero, search, category grid, the conversion card and the "in all units" list.
import { GROUPS, CATEGORIES, category, convert, convertAll, search, foldText } from './units.js';
import { formatNumber, parseNumber, flipSign, addExponent, dropOpenExponent } from './format.js';
import { t, catName, unitName, unitSym, searchText } from './i18n.js';
import { state, pairOf, setValue, selectCategory, setUnits, gridCategories, addHistory, isFavorite, toggleFavorite } from './state.js';
import { icon, esc, ltr, $, onAct, copyText, keypad, focusAtEnd, keepCaret } from './dom.js';
import { upperFirst, unitLabel } from './unitui.js';
import { openSheet, toast } from './sheet.js';
import { HERO_ART } from './hero_art.js';

let root = null;
let catsExpanded = false;
let allOpen = false;
let query = '';
let onOpenSettings = () => {};

const tileName = c => catName(c).split(' / ')[0];
const fmt = (x, plain = false) => formatNumber(x, { digits: state.digits, notation: state.notation, decimal: state.decimal, plain });

// ---------------------------------------------------------------- pieces of markup
function heroHtml() {
  return `<header class="hero">
    ${HERO_ART}
    <button class="icon-btn hero-gear" data-act="settings" aria-label="${esc(t('more.settings'))}">${icon('settings')}</button>
    <div class="hero-mark">${icon('hard-hat', 'hat')}${icon('settings', 'cog')}</div>
    <h1><b>${esc(t('hero.1'))}</b><span>${esc(t('hero.2'))}</span></h1>
    <p>${esc(t('hero.sub'))}</p>
  </header>`;
}

const tileHtml = c => `<button type="button" class="tile" data-act="cat" data-arg="${c.id}" aria-pressed="${c.id === state.cat}" title="${esc(catName(c))}">${icon(c.icon)}<span>${esc(tileName(c))}</span></button>`;

function browseHtml() {
  if (query.trim()) {
    const hits = search(query, 40, searchText);
    if (!hits.length) return `<p class="empty-note">${esc(t('search.none'))}</p>`;
    return `<ul class="results">${hits.map(h => {
      const c = h.cat;
      const main = h.unit ? `<b>${ltr(esc(unitSym(h.unit)))}</b><small>${esc(unitName(h.unit))}</small>` : `<b>${esc(catName(c))}</b>`;
      const arg = c.id + (h.unit ? '/' + h.unit.id : '');
      return `<li><button type="button" class="result" data-act="hit" data-arg="${arg}"><span class="r-ico">${icon(c.icon)}</span><span class="r-main">${main}</span><span class="r-cat">${esc(h.unit ? catName(c) : t('search.category'))}</span></button></li>`;
    }).join('')}</ul>`;
  }
  if (catsExpanded) {
    const groups = GROUPS.map(g => `<h3 class="grp">${esc(t('group.' + g))}</h3><div class="cats">${CATEGORIES.filter(c => c.group === g).map(tileHtml).join('')}</div>`).join('');
    return groups + `<button type="button" class="cats-toggle" data-act="catsToggle">${esc(t('cats.less'))}${icon('chevron-down', 'flip')}</button>`;
  }
  return `<div class="cats">${gridCategories().map(tileHtml).join('')}</div>
    <button type="button" class="cats-toggle" data-act="catsToggle">${esc(t('cats.more'))} (${CATEGORIES.length})${icon('chevron-down')}</button>`;
}

function cardHtml() {
  const c = category(state.cat);
  const { f, t: to } = pairOf(c.id);
  const fav = isFavorite(c.id, f.id, to.id);
  return `<div class="card-head">
      <div class="card-ico">${icon(c.icon)}</div>
      <div class="card-ttl"><h2>${esc(t('card.title', { cat: catName(c) }))}</h2><p>${esc(upperFirst(unitName(f)))} ↔ ${esc(upperFirst(unitName(to)))}</p></div>
      <button type="button" class="icon-btn star" data-act="fav" aria-pressed="${fav}" aria-label="${esc(t(fav ? 'card.favRemove' : 'card.favAdd'))}">${icon('star')}</button>
    </div>
    <label class="lbl" for="val">${esc(t('card.value'))}</label>
    <div class="field" id="field-in">
      <input id="val" type="text" dir="ltr" inputmode="decimal" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done">
      <button type="button" class="mini" data-act="sign" aria-label="${esc(t('card.sign'))}">±</button>
      <button type="button" class="mini" data-act="exp" aria-label="${esc(t('card.exp'))}">E</button>
      <button type="button" class="unit-btn" data-act="pick" data-arg="f" aria-label="${esc(t('unit.from'))}">${unitLabel(f)}${icon('chevron-down')}</button>
    </div>
    <div class="swap-row"><button type="button" class="swap" data-act="swap" aria-label="${esc(t('card.swap'))}">${icon('arrow-up-down')}</button></div>
    <div class="lbl">${esc(t('card.result'))}</div>
    <div class="field out">
      <output id="res" dir="ltr" aria-live="polite"></output>
      <button type="button" class="mini" data-act="copy" aria-label="${esc(t('card.copy'))}">${icon('copy')}</button>
      <button type="button" class="unit-btn" data-act="pick" data-arg="t" aria-label="${esc(t('unit.to'))}">${unitLabel(to)}${icon('chevron-down')}</button>
    </div>
    <div class="card-foot">
      <div class="chip" id="rate"></div>
      <button type="button" class="btn-primary" data-act="convert">${icon('refresh-cw')}<span>${esc(t('card.convert'))}</span></button>
    </div>`;
}

function allHtml() {
  return `<button type="button" class="all-head" data-act="allToggle" aria-expanded="${allOpen}"><span>${esc(t('card.all'))}</span><em>${esc(t(allOpen ? 'card.allHide' : 'card.allShow'))}</em>${icon('chevron-down', allOpen ? 'flip' : '')}</button>
    <ul class="all-list" id="all-list" ${allOpen ? '' : 'hidden'}></ul>`;
}

// ---------------------------------------------------------------- live values
const current = () => {
  const c = category(state.cat);
  const p = pairOf(c.id);
  return { c, f: p.f, to: p.t };
};

const typed = () => dropOpenExponent($('#val', root).value);

/** result, rate chip and the all-units list for what is typed now (no re-render: the keyboard stays up) */
function updateValues() {
  const { c, f, to } = current();
  const v = parseNumber(typed());   // an exponent still being typed ("2.5e", "2.5e-") counts as the number before it
  const bad = Number.isNaN(v);
  const res = $('#res', root);
  $('#field-in', root).classList.toggle('bad', bad);
  const r = v === null || bad ? null : convert(f, to, v);
  res.textContent = r === null ? '—' : fmt(r);
  res.dataset.empty = r === null ? '1' : '';
  const chip = $('#rate', root);
  chip.classList.toggle('warn', bad);
  chip.innerHTML = bad
    ? `${icon('info')}<span>${esc(t('card.invalid'))}</span>`
    : `${icon('info')}<span>${ltr(`1 ${esc(unitSym(f))} = ${esc(fmt(convert(f, to, 1)))} ${esc(unitSym(to))}`)}</span>`;
  if (allOpen) {
    $('#all-list', root).innerHTML = convertAll(c, f, r === null ? 1 : v).map(row =>
      `<li><button type="button" class="all-row" data-act="allPick" data-arg="${row.unit.id}" aria-pressed="${row.unit === to}"><span class="a-name">${esc(unitName(row.unit))} <i>${ltr(esc(unitSym(row.unit)))}</i></span><span class="a-val">${ltr(esc(r === null ? '—' : fmt(row.value)))}</span></button></li>`).join('');
  }
}

function renderCard() {
  const card = $('#card', root);
  card.innerHTML = cardHtml();
  $('#val', root).value = state.value;
  updateValues();
}

const renderBrowse = () => { $('#browse', root).innerHTML = browseHtml(); };
const renderAll = () => { $('#allunits', root).innerHTML = allHtml(); updateValues(); };

/** full build (first time, language change) */
export function renderHome() {
  root.innerHTML = `${heroHtml()}
    <div class="body">
      <div class="search">${icon('search')}<input id="q" type="search" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search" placeholder="${esc(t('search.placeholder'))}" aria-label="${esc(t('search.placeholder'))}"><button type="button" class="mini" id="q-clear" data-act="qclear" aria-label="${esc(t('search.clear'))}" hidden>${icon('x')}</button></div>
      <div id="browse"></div>
      <section class="card" id="card" aria-label="${esc(t('card.title', { cat: catName(category(state.cat)) }))}"></section>
      <section class="allunits" id="allunits"></section>
    </div>`;
  $('#q', root).value = query;
  $('#q-clear', root).hidden = !query;
  renderBrowse();
  renderCard();
  renderAll();
}

/** a setting changed (digits, decimal mark, notation): only the numbers need a refresh */
export const refreshHome = () => { if (root) updateValues(); };

/** history / favorites open a conversion: { c, f, t, v? } */
export function loadEntry(e) {
  if (e.v !== undefined) setValue(e.v);
  setUnits(e.c, e.f, e.t);
  selectCategory(e.c);
  query = '';
  renderHome();
}

// ---------------------------------------------------------------- actions
function pickUnit(which) {
  const { c, f, to } = current();
  const mine = which === 'f' ? f : to, other = which === 'f' ? to : f;
  const many = c.units.length > 10;
  const rows = c.units.map(u => `<li data-hay="${esc(u.hay + ' ' + searchText(u))}"><button type="button" class="pick-row" data-id="${u.id}" aria-pressed="${u === mine}"><span class="p-name">${esc(unitName(u))}</span><span class="p-sym">${ltr(esc(unitSym(u)))}</span>${u === mine ? icon('check') : ''}</button></li>`).join('');
  openSheet({
    title: t(which === 'f' ? 'unit.from' : 'unit.to'),
    html: `${many ? `<div class="search in-sheet">${icon('search')}<input id="uq" type="search" autocomplete="off" spellcheck="false" placeholder="${esc(t('unit.search'))}" aria-label="${esc(t('unit.search'))}"></div>` : ''}<ul class="pick-list">${rows}</ul>`,
    onMount(panel, close) {
      panel.addEventListener('click', ev => {
        const b = ev.target.closest('.pick-row');
        if (!b) return;
        const picked = c.byId.get(b.dataset.id);
        // choosing the unit the other side already has swaps the two instead of converting a unit into itself
        const next = picked === other ? (which === 'f' ? { f: picked, t: mine } : { f: mine, t: picked }) : (which === 'f' ? { f: picked, t: other } : { f: other, t: picked });
        setUnits(c.id, next.f.id, next.t.id);
        close();
        renderCard();
        if (allOpen) updateValues();
      });
      const q = $('#uq', panel);
      if (q) q.addEventListener('input', () => {
        const parts = foldText(q.value).split(/\s+/).filter(Boolean);
        for (const li of panel.querySelectorAll('.pick-list li')) li.hidden = !parts.every(p => li.dataset.hay.includes(p));
      });
    },
  });
}

const actions = {
  settings: () => onOpenSettings(),
  qclear() { const q = $('#q', root); q.value = ''; query = ''; $('#q-clear', root).hidden = true; renderBrowse(); q.focus(); },
  cat(id) { selectCategory(id); renderBrowse(); renderCard(); renderAll(); },
  catsToggle() { catsExpanded = !catsExpanded; renderBrowse(); },
  hit(arg) {
    const [cid, uid] = arg.split('/');
    const c = category(cid);
    if (uid) {
      // the unit that was found becomes the "from" unit; the old target stays unless that is the very unit (then the two swap)
      const p = pairOf(cid), u = c.byId.get(uid);
      if (u !== p.f) setUnits(cid, u.id, u === p.t ? p.f.id : p.t.id);
    }
    selectCategory(cid);
    query = '';
    $('#q', root).value = '';
    $('#q-clear', root).hidden = true;
    renderBrowse(); renderCard(); renderAll();
    $('#card', root).scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
  pick: which => pickUnit(which),
  swap() { const { c, f, to } = current(); setUnits(c.id, to.id, f.id); renderCard(); },
  // The number keypad has neither a minus nor an "e": these two buttons type them. Once an exponent has been started, ± is the sign of the exponent.
  sign() {
    const input = $('#val', root);
    input.value = flipSign(input.value);
    setValue(input.value);
    focusAtEnd(input);
    updateValues();
  },
  exp() {
    const input = $('#val', root);
    if (/e/i.test(input.value)) return;
    input.value = addExponent(input.value);
    setValue(input.value);
    focusAtEnd(input);
    updateValues();
  },
  async copy() {
    const r = $('#res', root);
    if (r.dataset.empty) return;
    const { f, to } = current();
    const v = parseNumber(typed());
    if (await copyText(fmt(convert(f, to, v), true))) toast(t('card.copied'));
  },
  convert() {
    const { c, f, to } = current();
    const input = $('#val', root);
    const v = parseNumber(typed());
    if (v === null || Number.isNaN(v)) { input.focus(); return; }
    addHistory({ c: c.id, f: f.id, t: to.id, v: typed().trim(), r: convert(f, to, v) });
    input.blur();
    toast(t('card.saved'));
  },
  fav() {
    const { c, f, to } = current();
    const r = toggleFavorite(c.id, f.id, to.id);
    const star = $('.star', root);
    star.setAttribute('aria-pressed', String(r.added));
    star.setAttribute('aria-label', t(r.added ? 'card.favRemove' : 'card.favAdd'));
    toast(t(r.added ? 'card.favAdded' : 'card.favRemoved'), { onAction: () => { r.undo(); star.setAttribute('aria-pressed', String(!r.added)); } });
  },
  allToggle() { allOpen = !allOpen; renderAll(); },
  allPick(id) { const { c, f } = current(); if (id !== f.id) { setUnits(c.id, f.id, id); renderCard(); updateValues(); } },
};

/** the back button on the home screen: first undo what the user opened (a search, the full category list) */
export function handleBack() {
  if (!root) return false;
  if (query) {
    query = '';
    $('#q', root).value = '';
    $('#q-clear', root).hidden = true;
    renderBrowse();
    return true;
  }
  if (catsExpanded) { catsExpanded = false; renderBrowse(); return true; }
  return false;
}

export function mountHome(el, { openSettings }) {
  root = el;
  onOpenSettings = openSettings;
  onAct(root, actions);
  root.addEventListener('input', ev => {
    if (ev.target.id === 'val') { setValue(ev.target.value); updateValues(); }
    else if (ev.target.id === 'q') { query = ev.target.value; $('#q-clear', root).hidden = !query; renderBrowse(); }
  });
  // tapping the value selects it, so the next digits replace it (the usual behaviour of a converter)
  root.addEventListener('focusin', ev => { if (ev.target.id === 'val' && !keepCaret(ev)) setTimeout(() => ev.target.select(), 0); });
  keypad(root, '.mini[data-act="sign"], .mini[data-act="exp"]');
  root.addEventListener('keydown', ev => {
    if (ev.key === 'Enter' && ev.target.id === 'val') actions.convert();
  });
  renderHome();
}
