// The mosque screen: the mosques and prayer rooms around the place, nearest first, as a list (an arrow on every row follows the phone as it turns) or as pins on a street map.
// A tap opens the place: how far it is and buttons for the way there on foot, by bus or by car - the maps app does the routing and shows the live times.
import { h, icon } from './dom.js';
import { t } from './i18n.js';
import { STREET_MAP } from './config.js';
import { loadDb, nameAt, searchWidening, RADII_KM, walkMinutes, driveMinutes, directionsUrl, placeUrl, geoUri } from './mosques.js';
import { info, placeTitle, onPlace, gps, useGps } from './place.js';
import { onHeading, hold, release } from './compass.js';
import { trueHeading } from './heading.js';
import { distText, coordText } from './fmt.js';
import { openSheet, toast } from './sheet.js';
import { openExternal } from './native.js';

const PAGE = 10, MAX_SHOWN = 100, MAX_PINS = 80;
const WALK_MAX_M = 3000;                       // beyond this the list names the time by car, not on foot
const KINDS = [[null, 'mos.all'], [0, 'mos.mosques'], [1, 'mos.rooms']];

export function mountMosques(root, api) {
  const L = window.L;
  let db = null, loadState = 'idle';           // idle | loading | ready | failed
  let view = 'list', kind = null, shown = PAGE, result = { items: [], step: 0 };
  let onScreen = false, held = false, arrows = [], sheetArrow = null, raf = 0;
  let map = null, pins = null, tileOk = 0, tileBad = 0;

  const viewBtn = h('button', { class: 'ibtn', onclick: () => { view = view === 'list' ? 'map' : 'list'; render(); } });
  const chips = h('div', { class: 'chips', role: 'tablist' });
  const scroll = h('div', { class: 'scroll' });
  const mapDiv = h('div', { class: 'mapview', dir: 'ltr' });
  const mapNote = h('div', { class: 'mapnote', hidden: true, text: t('mos.mapOffline') });
  const mapWrap = h('div', { class: 'mapwrap', hidden: true },
    mapDiv, mapNote, h('button', { class: 'sq paper recenter', 'aria-label': t('map.recenter'), onclick: () => fit() }, icon('crosshair')));

  root.append(
    h('header', { class: 'top' }, h('span', { class: 'ibtn ghost' }), h('h1', { text: t('mos.title') }), viewBtn),
    chips, scroll, mapWrap);

  // ------------------------------------------------------------------------------------------------ the screen
  function load() {
    if (loadState === 'loading' || loadState === 'ready') return;
    loadState = 'loading';
    loadDb().then(d => { db = d; loadState = 'ready'; }, () => { loadState = 'failed'; }).then(render);
  }

  // the compass runs while the screen is in front (the arrows follow the phone)
  function syncSensor() {
    const want = onScreen;
    if (want && !held) { hold('mosques'); held = true; }
    else if (!want && held) { release('mosques'); held = false; }
  }

  function render() {
    if (!onScreen) return;
    const i = info();
    syncSensor();
    chips.hidden = !i;
    chips.replaceChildren(...KINDS.map(([k, key]) => h('button', { class: 'chip' + (k === kind ? ' on' : ''), role: 'tab', 'aria-selected': String(k === kind), text: t(key),
      onclick: () => { kind = k; shown = PAGE; render(); } })));
    viewBtn.style.visibility = 'hidden';          // shown below when there is something to show on the map
    viewBtn.setAttribute('aria-label', t(view === 'list' ? 'mos.showMap' : 'mos.showList'));
    viewBtn.replaceChildren(icon(view === 'list' ? 'map' : 'list'));
    if (!i) return message(needPlace());
    if (loadState === 'idle') load();
    if (loadState !== 'ready') return message(loadState === 'failed' ? failed() : h('div', { class: 'empty', text: t('mos.loading') }));
    result = searchWidening(db, i.lat, i.lon, { kind, want: shown });
    if (result.items.length) viewBtn.style.visibility = '';
    if (view === 'map' && result.items.length) renderMap(i);
    else renderList(i);
  }

  function message(node) {
    scroll.hidden = false; mapWrap.hidden = true; arrows = [];
    scroll.replaceChildren(node);
  }

  const needPlace = () => {
    const busy = gps.status === 'busy';
    return h('div', { class: 'card mosmsg' }, h('span', { class: 'msgicon' }, icon('map-pin')), h('div', { class: 'txt' },
      h('p', { text: t(busy ? 'compass.locating' : gps.status === 'denied' ? 'compass.denied' : gps.status === 'disabled' ? 'compass.disabled' : 'mos.needPlace') }),
      busy ? null : h('div', { class: 'tipacts' },
        h('button', { class: 'pill gold', text: t('place.find'), onclick: () => useGps() }),
        h('button', { class: 'pill', text: t('compass.choose'), onclick: () => api.go('place') }))));
  };
  const failed = () => h('div', { class: 'empty' }, h('p', { text: t('mos.loadFail') }),
    h('button', { class: 'pill gold', text: t('mos.retry'), onclick: () => { loadState = 'idle'; render(); } }));

  // ------------------------------------------------------------------------------------------------ the list
  const how = p => p.dist <= WALK_MAX_M ? t('mos.walkShort', walkMinutes(p.dist)) : t('mos.carShort', driveMinutes(p.dist));
  const kindName = p => t(p.kind ? 'mos.room' : 'mos.mosque');

  function rowEl(p) {
    const name = nameAt(db, p.i);
    const arrow = h('span', { class: 'arr' }, icon('navigation-2'));
    arrows.push({ el: arrow.firstChild, bearing: p.bearing });
    return h('button', { class: 'item mosq', onclick: () => openPlace(p) },
      h('span', { class: 'mic' + (p.kind ? ' room' : '') }, icon(p.kind ? 'room' : 'mosque')),
      h('span', { class: 'txt' },
        h('div', { class: 'nm' }, h('bdi', { text: name || kindName(p) })),
        h('div', { class: 'sub', text: (name ? kindName(p) + ' · ' : '') + distText(p.dist) + ' · ' + how(p) })),
      arrow);
  }

  function renderList(i) {
    mapWrap.hidden = true; scroll.hidden = false; arrows = [];
    const items = result.items.slice(0, shown), last = RADII_KM.length - 1;
    const nodes = [h('button', { class: 'card mosloc', onclick: () => api.go('place') },
      h('span', { class: 'pin' }, icon(i.mode === 'gps' ? 'locate-fixed' : 'map-pin')),
      h('span', { class: 'txt' }, h('div', { class: 'nm', text: placeTitle() }), h('div', { class: 'sub', text: t('mos.aroundHere') })),
      icon('chevron', 'chev'))];
    if (!items.length) nodes.push(h('div', { class: 'empty', text: t('mos.none', distText(RADII_KM[last] * 1000)) }));
    else {
      nodes.push(h('div', { class: 'msum', text: t('mos.upTo', distText(items[items.length - 1].dist)) }), h('div', { class: 'list' }, items.map(rowEl)));
      // more to show: the search found more than are shown, or it stopped at the first radius that held enough and a wider one may hold more
      const more = shown < MAX_SHOWN && (result.items.length > shown || (result.items.length === shown && result.step < last));
      if (more) nodes.push(h('button', { class: 'pill more', text: t('mos.more'), onclick: () => { shown = Math.min(MAX_SHOWN, shown + PAGE); render(); } }));
    }
    scroll.replaceChildren(...nodes);
    updateArrows();
  }

  // an arrow points at the place as seen from the top edge of the phone (north up until the compass has a reading)
  function updateArrows() {
    const hd = trueHeading() ?? 0;
    const turn = a => { a.el.style.transform = 'rotate(' + (a.bearing - hd).toFixed(1) + 'deg)'; };
    arrows.forEach(turn);
    if (sheetArrow) turn(sheetArrow);
  }
  onHeading(() => {
    if (!onScreen) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(updateArrows);
  });

  // ------------------------------------------------------------------------------------------------ the map
  function ensureMap() {
    if (map || !L) return;
    map = L.map(mapDiv, { zoomControl: false, attributionControl: false, zoomSnap: 0.5, minZoom: 4, maxZoom: STREET_MAP.maxZoom });
    const tiles = L.tileLayer(STREET_MAP.tiles, { maxZoom: STREET_MAP.maxZoom });
    tiles.on('tileload', () => { tileOk++; mapNote.hidden = true; });
    tiles.on('tileerror', () => { tileBad++; });
    tiles.on('load', () => { if (!tileOk && tileBad) mapNote.hidden = false; });   // not one picture arrived: say so, the pins are still there
    tiles.addTo(map);
    L.control.attribution({ prefix: false }).addAttribution('© OpenStreetMap').addTo(map);
    pins = L.layerGroup().addTo(map);
  }

  function renderMap(i) {
    scroll.hidden = true; mapWrap.hidden = false; arrows = [];
    ensureMap();
    if (!map) { message(h('div', { class: 'empty', text: t('mos.mapFail') })); return; }
    map.invalidateSize();
    pins.clearLayers();
    for (const p of result.items.slice(0, MAX_PINS)) {
      const mark = L.marker([p.lat, p.lon], { keyboard: false, riseOnHover: false, icon: L.divIcon({ className: 'mpin-wrap', iconSize: [34, 34], iconAnchor: [17, 17],
        html: '<div class="mpin' + (p.kind ? ' room' : '') + '">' + icon(p.kind ? 'room' : 'mosque').outerHTML + '</div>' }) });
      mark.on('click', () => openPlace(p));
      mark.addTo(pins);
    }
    L.marker([i.lat, i.lon], { interactive: false, keyboard: false, zIndexOffset: 400, icon: L.divIcon({ className: 'me-wrap', html: '<div class="me"><i></i></div>', iconSize: [18, 18], iconAnchor: [9, 9] }) }).addTo(pins);
    fit();
  }

  function fit() {
    const i = info();
    if (!map || !i) return;
    const pts = result.items.slice(0, 12).map(p => [p.lat, p.lon]);
    pts.push([i.lat, i.lon]);
    map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 17, animate: false });
  }

  // ------------------------------------------------------------------------------------------------ one place
  function openPlace(p) {
    const name = nameAt(db, p.i), i = info(), to = { lat: p.lat, lon: p.lon };
    // from the phone's own position (the maps app asks the phone), or from the place the person chose by hand
    const from = i && i.mode === 'manual' ? { lat: i.lat, lon: i.lon } : null;
    const go = async url => { if (!(await openExternal(url))) toast(t('mos.noApp')); };
    const mode = (id, ic, label, sub) => {
      const url = directionsUrl(id, to, from);
      return h('button', { class: 'mode', 'data-url': url, onclick: () => go(url) }, icon(ic), h('b', { text: label }), h('small', { text: sub }));
    };
    const arrow = h('span', { class: 'arr' }, icon('navigation-2'));
    sheetArrow = { el: arrow.firstChild, bearing: p.bearing };
    openSheet({
      title: name || kindName(p),
      onClose: () => { sheetArrow = null; },
      body: h('div', { class: 'msheet' },
        h('div', { class: 'mhead' }, arrow, h('p', { class: 'msub', text: (name ? kindName(p) + ' · ' : '') + distText(p.dist) + ' · ' + Math.round(p.bearing) + '°' })),
        h('h4', { text: t('mos.how') }),
        h('div', { class: 'modes' },
          mode('walk', 'footprints', t('mos.walk'), t('mos.minutes', walkMinutes(p.dist))),
          mode('bus', 'bus', t('mos.bus'), t('mos.inMaps')),
          mode('car', 'car', t('mos.car'), t('mos.minutes', driveMinutes(p.dist)))),
        h('p', { class: 'note', text: t('mos.estimate') }),
        h('div', { class: 'wrap' },
          h('button', { class: 'pill', 'data-url': placeUrl(to), onclick: () => go(placeUrl(to)) }, icon('map-pin'), h('span', { text: t('mos.openMaps') })),
          h('button', { class: 'pill', 'data-url': geoUri(to, name), onclick: () => go(geoUri(to, name)) }, icon('external-link'), h('span', { text: t('mos.otherApps') }))),
        h('div', { class: 'sub mono', text: coordText(p.lat, p.lon) }),
        h('p', { class: 'small', text: t('mos.source') })),
    });
    updateArrows();
  }

  onPlace(() => { shown = PAGE; render(); });
  return {
    onShow() { onScreen = true; render(); },
    onHide() { onScreen = false; syncSensor(); },
    refresh: render,
  };
}
