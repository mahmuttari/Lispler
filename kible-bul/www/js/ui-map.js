// The map screen: satellite picture (NASA Blue Marble tiles, with the country outlines of data/world.json over it, or alone when offline / in "map" mode),
// the great-circle line from the place to the Kaaba, the place and the Kaaba as markers, country names in the language of the app.
import { h, icon, svgEl } from './dom.js';
import { t, countryName } from './i18n.js';
import { S, save } from './state.js';
import { MAP } from './config.js';
import { KAABA, greatCircle } from './qibla.js';
import { kaabaSvg } from './art.js';
import { info, placeTitle, onPlace } from './place.js';
import { degText, coordText } from './fmt.js';
import { openUrl } from './native.js';
import { decodeRing } from './world.js';

export function mountMap(root, api) {
  const L = window.L;
  let map = null, world = null, shown = false;
  let tiles = null, outlines = [], labels = [], routeLayer = null, markers = [], offline = false;
  const mapDiv = h('div', { class: 'mapview', dir: 'ltr' });
  const nameEl = h('div', { class: 'nm' }), coordEl = h('div', { class: 'sub' }), angleEl = h('b');
  const toggleBtn = h('button', { class: 'pill paper-pill', onclick: () => setMode(S.settings.map === 'sat' ? 'map' : 'sat') });
  const pop = h('div', { class: 'popover', hidden: true });

  const topCard = h('div', { class: 'card paper maptop' },
    h('span', { class: 'pin' }, icon('map-pin')), h('div', { class: 'txt' }, nameEl, coordEl),
    h('div', { class: 'ang' }, h('small', { text: t('compass.angle') }), angleEl));
  const layersBtn = h('button', { class: 'sq paper', 'aria-label': t('map.layers'), onclick: () => { pop.hidden = !pop.hidden; renderPop(); } }, icon('layers'));
  const recenter = h('button', { class: 'sq paper recenter', 'aria-label': t('map.recenter'), onclick: fit }, icon('navigation'));
  const kaabaTile = h('div', { class: 'ktile', html: kaabaSvg('3d') });
  const kName = h('b', { text: t('map.kaaba') });
  const bottom = h('div', { class: 'card paper mapbottom' },
    h('div', { class: 'krow' }, kaabaTile, h('div', { class: 'txt' }, kName, h('div', { class: 'sub', text: t('map.kaabaPlace') }), h('div', { class: 'sub mono', text: coordText(KAABA.lat, KAABA.lon) }))),
    h('div', { class: 'btns' },
      h('button', { class: 'pill paper-pill', onclick: directions }, icon('route'), h('span', { text: t('map.directions') })),
      toggleBtn));

  root.append(
    h('header', { class: 'top sub-top' },
      h('button', { class: 'ibtn', 'aria-label': t('back'), onclick: () => api.back() }, icon('back')),
      h('h1', { text: t('map.title') }), h('span', { class: 'ibtn ghost' })),
    h('div', { class: 'mapwrap' }, mapDiv, topCard, layersBtn, recenter, pop, bottom));

  function directions() {
    const i = info();
    const o = i ? `&origin=${i.lat.toFixed(5)},${i.lon.toFixed(5)}` : '';
    openUrl(`https://www.google.com/maps/dir/?api=1${o}&destination=${KAABA.lat},${KAABA.lon}`);
  }

  function renderPop() {
    pop.replaceChildren(
      h('div', { class: 'seg' }, ['sat', 'map'].map(m => h('button', { class: S.settings.map === m ? 'on' : '', text: t('map.' + m), onclick: () => { setMode(m); renderPop(); } }))),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: S.settings.labels, onchange: e => { S.settings.labels = e.target.checked; save(); updateLabels(); } }), h('span', { text: t('map.labels') })));
  }

  function setMode(m) {
    S.settings.map = m; save();
    applyMode();
  }

  function applyMode() {
    if (!map) return;
    const sat = S.settings.map === 'sat';
    root.classList.toggle('sat', sat);
    toggleBtn.replaceChildren(icon('layers'), h('span', { text: t(sat ? 'map.showMap' : 'map.showSat') }));
    if (sat && !map.hasLayer(tiles)) tiles.addTo(map);
    if (!sat && map.hasLayer(tiles)) map.removeLayer(tiles);
    styleOutlines();
    updateLabels();
  }

  // the outline polygons: thin white borders over the satellite picture; filled land when there is no picture (map mode, or no network)
  function styleOutlines() {
    const sat = S.settings.map === 'sat';
    const style = sat && !offline
      ? { color: '#ffffff', weight: 0.8, opacity: 0.55, fillOpacity: 0, interactive: false }
      : sat
        ? { color: '#d9e6c8', weight: 0.8, opacity: 0.8, fillColor: '#5d7a45', fillOpacity: 1, interactive: false }
        : { color: '#9b8f6d', weight: 0.9, opacity: 0.9, fillColor: '#efe6cf', fillOpacity: 1, interactive: false };
    outlines.forEach(p => p.setStyle(style));
    mapDiv.classList.toggle('sea-sat', sat); mapDiv.classList.toggle('sea-map', !sat);
  }

  // Country names: the biggest countries first (world.json order), how many depends on the zoom, and a name that would
  // overlap one already shown is left out. (1.0.1 compared the zoom with whole numbers only; with zoomSnap .25 a zoom
  // such as 3.5 showed all ~200 names on top of each other.)
  function updateLabels() {
    if (!map) return;
    const z = map.getZoom(), limit = z < 3 ? 12 : z < 4 ? 28 : z < 5 ? 45 : z < 6 ? 75 : z < 7 ? 135 : 999;
    const els = labels.map(m => m.getElement());
    els.forEach((el, i) => { if (el) el.style.display = S.settings.labels && i < limit ? '' : 'none'; });
    if (S.settings.labels) {
      const shown = [];
      const boxes = els.map((el, i) => (el && i < limit && el.firstElementChild ? el.firstElementChild.getBoundingClientRect() : null));   // one layout pass
      boxes.forEach((r, i) => {
        if (!r || !r.width) return;
        const hit = shown.some(s => r.left < s.right + 4 && r.right > s.left - 4 && r.top < s.bottom + 1 && r.bottom > s.top - 1);
        if (hit) els[i].style.display = 'none'; else shown.push(r);
      });
    }
    mapDiv.classList.toggle('lab-dark', S.settings.map !== 'sat');
  }

  async function ensureMap() {
    if (map || !L) return;
    map = L.map(mapDiv, { zoomControl: false, attributionControl: false, minZoom: 2, maxZoom: MAP.maxZoom, worldCopyJump: false, preferCanvas: true,
      maxBounds: [[-85, -180], [85, 180]], maxBoundsViscosity: 1, zoomSnap: 0.25, inertia: true });
    tiles = L.tileLayer(MAP.tiles, { maxNativeZoom: MAP.maxZoom, maxZoom: MAP.maxZoom, minZoom: 1, noWrap: true, className: 'sat-tiles', keepBuffer: 2 });
    // tile loading decides whether the satellite picture is there: if nothing at all arrives, the outlines turn into filled land
    let ok = 0, bad = 0;
    tiles.on('tileload', () => { ok++; if (offline) { offline = false; styleOutlines(); } });
    tiles.on('tileerror', () => { bad++; });
    tiles.on('load', () => { if (ok === 0 && bad > 0 && !offline) { offline = true; styleOutlines(); } });
    map.on('zoomend', updateLabels);
    try {
      world = await (await fetch('data/world.json')).json();
      const renderer = L.canvas({ padding: 0.3 });
      for (const c of world.countries) {
        for (const ring of c.rings) outlines.push(L.polygon(decodeRing(ring), { renderer, interactive: false, smoothFactor: 0.5, stroke: true }).addTo(map));
      }
      world.countries.forEach(c => {
        const m = L.marker([c.lat, c.lon], { interactive: false, keyboard: false, icon: L.divIcon({ className: 'clabel', html: `<span>${countryName(c.cc)}</span>`, iconSize: [0, 0] }) }).addTo(map);
        labels.push(m);
      });
    } catch (e) { /* no outlines: the satellite picture alone */ }
    routeLayer = L.layerGroup().addTo(map);
    applyMode();
    drawRoute();
    fit();
  }

  function drawRoute() {
    if (!map || !routeLayer) return;
    routeLayer.clearLayers(); markers = [];
    const kaabaIcon = L.divIcon({ className: 'kmark-wrap', html: `<div class="kmark">${kaabaSvg(S.settings.kaaba === 'off' ? '3d' : S.settings.kaaba)}</div>`, iconSize: [52, 52], iconAnchor: [26, 26] });
    L.marker([KAABA.lat, KAABA.lon], { icon: kaabaIcon, interactive: false, keyboard: false, zIndexOffset: 500 }).addTo(routeLayer);
    const i = info();
    if (!i || i.atKaaba) return;
    const pts = greatCircle(i.lat, i.lon, KAABA.lat, KAABA.lon, 96);
    const split = Math.max(1, Math.floor(pts.length * 0.86));
    const r = { interactive: false, lineCap: 'round' };
    L.polyline(pts, { ...r, color: '#000', weight: 7, opacity: 0.28 }).addTo(routeLayer);
    L.polyline(pts.slice(0, split + 1), { ...r, color: '#5be39a', weight: 3.2, dashArray: '9 8', opacity: 0.95 }).addTo(routeLayer);
    L.polyline(pts.slice(split), { ...r, color: '#f6c84c', weight: 4, opacity: 1 }).addTo(routeLayer);
    const me = L.divIcon({ className: 'me-wrap', html: `<div class="me"><i></i></div><span class="mename">${escapeHtml(placeTitle().split(',')[0])}</span>`, iconSize: [18, 18], iconAnchor: [9, 9] });
    L.marker([i.lat, i.lon], { icon: me, interactive: false, keyboard: false, zIndexOffset: 400 }).addTo(routeLayer);
  }

  function fit() {
    if (!map) return;
    const i = info();
    const pad = { paddingTopLeft: [28, 150], paddingBottomRight: [28, 250] };
    if (i && !i.atKaaba) map.fitBounds(L.latLngBounds([[i.lat, i.lon], [KAABA.lat, KAABA.lon]]), { ...pad, maxZoom: 7, animate: false });
    else map.setView([KAABA.lat, KAABA.lon], 6, { animate: false });
  }

  function render() {
    const i = info();
    nameEl.textContent = i ? placeTitle() : t('compass.noPlace');
    coordEl.textContent = i ? coordText(i.lat, i.lon) : '';
    angleEl.textContent = i && !i.atKaaba ? degText(i.bearing) : '—';
    kaabaTile.innerHTML = kaabaSvg(S.settings.kaaba === 'off' ? '3d' : S.settings.kaaba);
    drawRoute();
  }

  onPlace(() => { render(); if (shown) fit(); });
  render();
  return {
    async onShow() {
      shown = true;
      await ensureMap();
      if (map) { map.invalidateSize(); applyMode(); fit(); }
    },
    onHide() { shown = false; pop.hidden = true; },
    refresh: render,
  };
}

function escapeHtml(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
