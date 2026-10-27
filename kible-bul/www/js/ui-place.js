// The place screen: the phone's own position, a search of ~34 000 places, coordinates typed by hand, and the places chosen before.
import { h, icon } from './dom.js';
import { t, countryName } from './i18n.js';
import { S, save } from './state.js';
import { info, placeTitle, onPlace, gps, useGps, setPlace } from './place.js';
import { ensureCities, searchCities, localName } from './cities.js';
import { qiblaBearing } from './qibla.js';
import { degText, coordText, parseCoord } from './fmt.js';
import { toast } from './sheet.js';

export function mountPlace(root, api) {
  const gpsName = h('div', { class: 'nm' }), gpsSub = h('div', { class: 'sub' });
  const gpsBtn = h('button', { class: 'pill gold', onclick: () => useGps() });
  const input = h('input', { type: 'search', class: 'search', placeholder: t('place.search'), autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': t('place.search') });
  const results = h('div', { class: 'list' });
  const latIn = h('input', { type: 'text', inputmode: 'decimal', class: 'field', placeholder: t('place.lat'), 'aria-label': t('place.lat') });
  const lonIn = h('input', { type: 'text', inputmode: 'decimal', class: 'field', placeholder: t('place.lon'), 'aria-label': t('place.lon') });
  const coordErr = h('div', { class: 'err', hidden: true });
  const coordBox = h('div', { class: 'coordbox', hidden: true },
    h('div', { class: 'two' }, latIn, lonIn), coordErr,
    h('button', { class: 'pill gold', text: t('place.apply'), onclick: applyCoords }));
  const recents = h('div', { class: 'list' });
  const recentsHead = h('h3', { class: 'sec' }, h('span', { text: t('place.recent') }),
    h('button', { class: 'link', text: t('place.clear'), onclick: () => { S.recents = []; save(); renderRecents(); } }));
  const scroll = h('div', { class: 'scroll' },
    h('div', { class: 'card gpscard' }, h('span', { class: 'pin' }, icon('locate-fixed')), h('div', { class: 'txt' }, gpsName, gpsSub), gpsBtn),
    h('div', { class: 'searchbox' }, icon('search'), input),
    results,
    h('button', { class: 'card rowbtn', onclick: () => { coordBox.hidden = !coordBox.hidden; } }, h('span', { class: 'pin' }, icon('pencil-line')), h('span', { class: 'txt' }, h('div', { class: 'nm', text: t('place.coords') })), icon('chevron', 'chev')),
    coordBox, recentsHead, recents);

  root.append(h('header', { class: 'top' }, h('span', { class: 'ibtn ghost' }), h('h1', { text: t('place.title') }), h('span', { class: 'ibtn ghost' })), scroll);

  function row(p, current, searched) {
    const name = p.local || localName(p.name, p.cc) || p.name;
    return h('button', { class: 'item' + (current ? ' on' : ''), onclick: () => choose(p, !!searched) },
      h('span', { class: 'txt' }, h('div', { class: 'nm', text: name }), h('div', { class: 'sub', text: (p.cc ? countryName(p.cc) + ' · ' : '') + coordText(p.lat, p.lon) })),
      h('span', { class: 'deg', text: degText(qiblaBearing(p.lat, p.lon)) }), current ? icon('check') : null);
  }
  const isCurrent = p => { const c = S.place; return !!c && c.mode === 'manual' && Math.abs(c.lat - p.lat) < 0.01 && Math.abs(c.lon - p.lon) < 0.01; };

  // searched: the place came from the search results (not from the recent places): a completed search is a natural pause for an ad
  function choose(p, searched) {
    setPlace({ mode: 'manual', lat: p.lat, lon: p.lon, name: p.name, cc: p.cc }, { remember: true });
    input.value = ''; results.replaceChildren(); coordBox.hidden = true;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    toast(t('place.set', placeTitle()));
    api.go('compass', searched ? { after: 'search' } : undefined);
  }

  function applyCoords() {
    const lat = parseCoord(latIn.value, 'lat'), lon = parseCoord(lonIn.value, 'lon');
    if (Number.isNaN(lat) || Number.isNaN(lon)) { coordErr.textContent = t('place.badCoords'); coordErr.hidden = false; return; }
    coordErr.hidden = true;
    setPlace({ mode: 'manual', lat, lon, name: '', cc: '' }, { remember: true });
    latIn.value = lonIn.value = ''; coordBox.hidden = true;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    toast(t('place.set', placeTitle()));
    api.go('compass', { after: 'search' });
  }

  let seq = 0;
  async function onType() {
    const q = input.value.trim();
    const my = ++seq;
    if (!q) { results.replaceChildren(); return; }
    const ok = await ensureCities();
    if (my !== seq) return;
    if (!ok) { results.replaceChildren(h('div', { class: 'empty', text: t('place.noData') })); return; }
    const found = searchCities(q, 40);
    results.replaceChildren(...(found.length ? found.map(p => row(p, isCurrent(p), true)) : [h('div', { class: 'empty', text: t('place.none') })]));
  }
  input.addEventListener('input', onType);

  function renderRecents() {
    recentsHead.hidden = recents.hidden = S.recents.length === 0;
    recents.replaceChildren(...S.recents.map(p => row(p, isCurrent(p))));
  }

  function renderGps() {
    const s = gps.status, c = S.place;
    gpsName.textContent = t('place.mine');
    gpsBtn.textContent = t(s === 'busy' ? 'place.locating' : c && c.mode === 'gps' ? 'place.refresh' : 'place.find');
    gpsBtn.disabled = s === 'busy';
    gpsSub.classList.toggle('bad', s === 'denied' || s === 'disabled' || s === 'timeout' || s === 'unavailable');
    if (s === 'denied') gpsSub.textContent = t('place.denied');
    else if (s === 'disabled') gpsSub.textContent = t('place.disabled');
    else if (s === 'timeout') gpsSub.textContent = t('place.timeout');
    else if (s === 'unavailable') gpsSub.textContent = t('place.unavailable');
    else if (c && c.mode === 'gps') gpsSub.textContent = placeTitle(c) + ' · ' + coordText(c.lat, c.lon);
    else gpsSub.textContent = t('place.mineSub');
  }

  function render() { renderGps(); renderRecents(); }
  onPlace(render);
  render();
  return { onShow() { render(); }, onHide() {}, refresh: render };
}
