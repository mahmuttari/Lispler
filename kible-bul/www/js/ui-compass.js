// The compass screen: the place, the Qibla angle and distance, the dial, and a line of guidance.
import { h, icon, $ } from './dom.js';
import { t } from './i18n.js';
import { S } from './state.js';
import { buildDial } from './dial.js';
import { onHeading, onStatus, getStatus, currentHeading, hasReadings, hold, release, msSinceReading, restart } from './compass.js';
import { assess, Dwell, alignedNow } from './quality.js';
import { openCalibration } from './ui-calib.js';
import { openCorrection } from './ui-correction.js';
import { info, placeTitle, onPlace, gps, useGps } from './place.js';
import { angleDiff } from './qibla.js';
import { shownHeading, shownQibla } from './heading.js';
import { ALIGN_DEG, ALIGN_LEAVE_DEG, STALE_MS } from './config.js';
import { degText, kmText, coordText } from './fmt.js';
import { vibrate, keepAwake } from './native.js';

export function mountCompass(root, api) {
  const dial = buildDial();
  const nameEl = h('div', { class: 'nm' }), coordEl = h('div', { class: 'sub' });
  const angleEl = h('b'), kmEl = h('b');
  const chip = h('div', { class: 'qchip', hidden: true }, h('i'), h('span'));
  const tipText = h('p'), tipIcon = h('span', { class: 'tipicon' }, icon('smartphone')), tipActions = h('div', { class: 'tipacts' });

  root.append(
    h('header', { class: 'top' },
      h('span', { class: 'ibtn ghost' }),
      h('h1', { text: t('compass.title') }),
      h('button', { class: 'ibtn gear', 'aria-label': t('nav.settings'), onclick: () => api.go('settings') }, icon('settings'))),
    h('button', { class: 'card loc', onclick: () => api.go('place') },
      h('span', { class: 'pin' }, icon('map-pin')), h('span', { class: 'txt' }, nameEl, coordEl), icon('chevron', 'chev')),
    h('div', { class: 'stats' },
      h('div', { class: 'card stat' }, h('span', { class: 'ring' }, icon('navigation-2')), h('div', null, h('small', { text: t('compass.angle') }), angleEl)),
      h('div', { class: 'card stat' }, h('span', { class: 'ring' }, icon('waypoints')), h('div', null, h('small', { text: t('compass.distance') }), kmEl))),
    h('div', { class: 'dial-wrap', dir: 'ltr' }, dial.el, chip),
    h('div', { class: 'card tip' }, tipIcon, h('div', { class: 'tiptxt' }, tipText, tipActions)));

  let aligned = false, sensorTimer = 0, noSensor = false, lastBuzz = 0, stale = false, lastRestart = 0;
  let badShown = false, badReason = null;      // the compass is not to be trusted (the phone says so, or the magnetic field is disturbed)
  const dwell = new Dwell(2000);

  function guidance() {
    const i = info();
    tipActions.replaceChildren();
    tipIcon.replaceChildren(icon('smartphone'));
    root.classList.remove('ok', 'warn');
    if (!i) {
      root.classList.add('warn');
      tipIcon.replaceChildren(icon('map-pin'));
      if (gps.status === 'busy') { tipText.textContent = t('compass.locating'); return; }
      tipText.textContent = t(gps.status === 'denied' ? 'compass.denied' : gps.status === 'disabled' ? 'compass.disabled' : 'compass.needPlace');
      tipActions.append(
        h('button', { class: 'pill gold', text: t('place.find'), onclick: () => useGps() }),
        h('button', { class: 'pill', text: t('compass.choose'), onclick: () => api.go('place') }));
      return;
    }
    if (i.atKaaba) { tipText.textContent = t('compass.atKaaba'); tipIcon.replaceChildren(icon('circle-check')); root.classList.add('ok'); return; }
    if (noSensor) { root.classList.add('warn'); tipIcon.replaceChildren(icon('triangle-alert')); tipText.textContent = t('compass.noSensor', degText(shownQibla(i))); return; }
    if (stale) { root.classList.add('warn'); tipIcon.replaceChildren(icon('triangle-alert')); tipText.textContent = t('compass.stale'); return; }
    if (badShown) {
      root.classList.add('warn'); tipIcon.replaceChildren(icon('triangle-alert'));
      tipText.textContent = t(badReason === 'interference' ? 'compass.interference' : 'compass.calibrateWarn');
      tipActions.append(h('button', { class: 'pill gold', text: t('compass.calibrate'), onclick: () => openCalibration() }));
      tipActions.append(h('button', { class: 'pill', text: t('settings.correction'), onclick: () => openCorrection() }));   // a constant error is what the correction is for
      return;
    }
    if (aligned) { root.classList.add('ok'); tipIcon.replaceChildren(icon('circle-check')); tipText.textContent = t('compass.aligned'); return; }
    tipText.textContent = t('compass.tip');
  }

  // the number big, the unit small (so the card fits a narrow phone)
  function setKm(text) {
    // the unit follows the LAST non-breaking space (Russian writes the thousands with one too: "2 405 km")
    const k = text.lastIndexOf(" ");
    kmEl.replaceChildren(k < 0 ? text : text.slice(0, k), k < 0 ? '' : h('span', { class: 'u', text: " " + text.slice(k + 1) }));
  }

  function renderPlace() {
    const i = info();
    if (!i) {
      nameEl.textContent = gps.status === 'busy' ? t('compass.locating') : t('compass.noPlace');
      coordEl.textContent = ''; angleEl.textContent = '—'; setKm('—');
      root.classList.add('idle');
    } else {
      nameEl.textContent = placeTitle();
      coordEl.textContent = coordText(i.lat, i.lon);
      angleEl.textContent = i.atKaaba ? '—' : degText(shownQibla(i));
      setKm(i.atKaaba ? '0 ' + t('unit.km') : kmText(i.km));
      root.classList.remove('idle');
    }
    dial.update({ qibla: i && !i.atKaaba ? shownQibla(i) : 0, kaaba: S.settings.kaaba, degrees: S.settings.degrees });
    draw();
    guidance();
  }

  let raf = 0;
  function draw() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const i = info();
      const live = hasReadings() && !stale;
      root.classList.toggle('wait', !live && !noSensor);   // no reading yet (or none for a long time): the needle is dimmed, it is not live
      const hd = shownHeading() ?? 0;
      const diff = i && !i.atKaaba ? Math.abs(angleDiff(hd, shownQibla(i))) : 180;
      const now = !!i && !i.atKaaba && currentHeading() !== null && live && alignedNow(aligned, diff, ALIGN_DEG, ALIGN_LEAVE_DEG);
      dial.update({ heading: hd, aligned: now, weak: badShown });
      if (now !== aligned) {
        aligned = now;
        // no buzz when the phone itself says its compass is not to be trusted
        if (now && !badShown && S.settings.vibrate && Date.now() - lastBuzz > 2000) { vibrate(40); lastBuzz = Date.now(); }
        guidance();
      }
    });
  }

  // no readings for a while: this phone has no compass sensor (or the WebView does not report it)
  function watchSensor() {
    clearTimeout(sensorTimer);
    noSensor = false;
    sensorTimer = setTimeout(() => { if (!hasReadings()) { noSensor = true; guidance(); draw(); } }, 2500);
  }
  // how far the compass can be trusted: the accuracy Android reports, the strength and the shape of the magnetic field (only the native sensor knows them)
  function renderQuality() {
    const st = getStatus(), i = info();
    // readings that stopped (the plugin restarts the sensors by itself after five seconds; this is for the case that did not help): say so, and ask the sensor to start again
    const silent = msSinceReading() > STALE_MS;
    if (silent !== stale) { stale = silent; guidance(); draw(); }
    if (silent && Date.now() - lastRestart > 10000) { lastRestart = Date.now(); restart(); }
    // no native readings, or none for half a minute (a sensor that reports only when something changes, as the emulator's does, is silent while the phone lies still)
    if (st.source !== 'native' || !hasReadings() || Date.now() - st.at > 30000) {
      chip.hidden = true; dwell.reset();
      if (badShown) { badShown = false; guidance(); }
      return;
    }
    // the Earth's field is known for the place only when the phone is there (the GPS position), not for a city that was chosen by hand
    const q = assess(st, i ? i.fieldUt : 0, i && i.mode === 'gps' ? i.expected : null);
    const level = q.bad ? 'bad' : q.shown === 'medium' || q.shown === 'low' ? 'mid' : 'good', label = t('compass.acc', t('acc.' + q.shown));
    if (chip.hidden) chip.hidden = false;
    if (chip.dataset.level !== level) chip.dataset.level = level;
    if (chip.lastChild.textContent !== label) chip.lastChild.textContent = label;     // the readings come thirty times a second: touch the page only when something changed
    const on = dwell.update(q.bad, Date.now());
    if (on !== badShown || (on && q.reason && q.reason !== badReason)) { badShown = on; badReason = q.reason || badReason; guidance(); draw(); }   // while the warning is leaving it keeps saying what it said
  }
  onStatus(renderQuality);
  let qTimer = 0;                      // the rating is also looked at twice a second: the 2-second rule needs time to pass even when the readings are steady
  onHeading(() => { if (noSensor && hasReadings()) { noSensor = false; guidance(); } draw(); });
  onPlace(() => { aligned = false; renderPlace(); });

  renderPlace();
  return {
    onShow() { hold('compass'); keepAwake(true); watchSensor(); renderPlace(); clearInterval(qTimer); qTimer = setInterval(renderQuality, 500); },
    onHide() { release('compass'); keepAwake(false); clearTimeout(sensorTimer); clearInterval(qTimer); },
    refresh: renderPlace,
  };
}
