// Su terazisi: yüzey, çizgi, dikey kipleri; derece / yüzde; kalibrasyon (iki adımlı ters çevirme ya da tek adım);
// mevcut açıyı sıfır kabul etme; hedef toleransı içinde titreşim ve ses.
import { h, iconButton, segmented, sheet, switchRow, toast, notice, put } from '../dom.js';
import { icon } from '../icons.js';
import { t, num } from '../i18n.js';
import { S, changed } from '../store.js';
import * as native from '../native.js';
import * as reklam from '../reklam.js';
import * as L from '../olcum/level.js';
import { topbar, moreButton, paras } from './common.js';

let audio = null;
function beep() {
  try {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return;
    audio = audio || new C();
    if (audio.state === 'suspended') audio.resume();
    const o = audio.createOscillator(), g = audio.createGain();
    o.frequency.value = 1320; o.type = 'sine';
    g.gain.setValueAtTime(0.0001, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, audio.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.14);
    o.connect(g).connect(audio.destination);
    o.start(); o.stop(audio.currentTime + 0.16);
  } catch (e) { /* ses yok */ }
}
const unlockAudio = () => { try { const C = window.AudioContext || window.webkitAudioContext; if (C) { audio = audio || new C(); if (audio.state === 'suspended') audio.resume(); } } catch (e) { /* yok */ } };

export function render({ back }) {
  const P = S.level;
  let raw = null, filt = null, lastT = 0, sensor = 'waiting', source = null, onTarget = false, raf = 0;
  let r = { mode: P.mode, noData: true, valid: false };
  const samples = { on: false, list: [] };

  const fmtAngle = (deg) => (P.unit === 'percent' ? (L.grade(deg) == null ? '—' : `${num(L.grade(deg), 1)} %`) : `${num(deg, 1)}°`);

  // ---- parçalar
  const modes = segmented(L.MODES.map((m) => ({ value: m, label: t(`lv_mode_${m}`), sub: t(`lv_mode_${m}_sub`) })), P.mode,
    (v) => { P.mode = v; changed('level'); onTarget = false; unlockAudio(); build(); }, { label: t('lv_level_title') });
  const gaugeBox = h('div');
  const big = h('div', { class: 'big', 'aria-live': 'off' });
  const state = h('div', { class: 'level-state', 'aria-live': 'polite' });
  const kv = h('div', { class: 'kv' });
  const readBox = h('div', { class: 'level-read' }, big, state);
  const badges = h('div', { class: 'chips' });
  const tips = h('div', { class: 'tips' });
  const noSensor = h('div', { class: 'hidden' }, notice('err', 'TriangleAlert', t('lv_state_no_sensor'), t('lv_no_sensor_text')));
  const accelNote = h('div', { class: 'hidden' }, notice('warn', 'Info', null, t('lv_sensor_note_accel')));

  const more = moreButton(() => [
    { label: t('lv_menu_calibrate'), icon: 'SlidersHorizontal', onclick: calibrationSheet },
    { label: t('lv_menu_reset_calibration'), icon: 'RotateCcw', onclick: () => { P.cal = null; changed('level'); toast(t('lv_calibration_off')); drawBadges(); }, hidden: !P.cal },
    { label: t('lv_menu_zero_here'), icon: 'Crosshair', onclick: zeroHere },
    { label: t('lv_menu_clear_reference'), icon: 'X', onclick: () => { delete P.ref[P.mode]; changed('level'); drawBadges(); }, hidden: !P.ref[P.mode] },
  ]);
  const help = iconButton('CircleHelp', t('lv_help_title'), () => sheet(t('lv_help_title'), paras('lv_help_surface', 'lv_help_line', 'lv_help_vertical', 'lv_help_accuracy'), { cls: 'acc-green' }));
  const settingsBtn = iconButton('Settings2', t('lv_level_settings_title'), settingsSheet);

  const el = h('div', { class: 'screen tool acc-green' },
    topbar({ title: t('lv_level_title'), sub: t('lv_level_subtitle'), onBack: back, actions: [help, settingsBtn, more] }),
    modes, noSensor, gaugeBox, readBox, kv, badges, accelNote, tips);

  // ---- gösterge
  let bubbleEl = null, vialEl = null;
  function build() {
    const m = P.mode;
    if (m === 'line') {
      bubbleEl = h('div', { class: 'bubble' });
      vialEl = h('div', { class: 'tube', 'aria-hidden': 'true' }, h('div', { class: 'mark', dataset: { k: 'a' } }), h('div', { class: 'mark', dataset: { k: 'b' } }), bubbleEl);
    } else {
      bubbleEl = h('div', { class: 'bubble' });
      vialEl = h('div', { class: 'vial', 'aria-hidden': 'true' },
        h('div', { class: 'axis', style: { left: '50%', top: '6%', bottom: '6%', width: '1px' } }),
        h('div', { class: 'axis', style: { top: '50%', left: '6%', right: '6%', height: '1px' } }),
        h('div', { class: 'ring', style: { width: '50%', height: '50%' } }),
        h('div', { class: 'ring', style: { width: '78%', height: '78%' } }),
        h('div', { class: 'ring t' }), bubbleEl);
    }
    put(gaugeBox, vialEl);
    put(tips, ...[1, 2].map((i) => h('div', { class: 'hint-line' }, icon('Info', 18), h('span', { text: t(`lv_tip_${m}_${i}`) }))));
    drawBadges(); placeTolerance(); draw();
  }

  function placeTolerance() {
    if (!vialEl) return;
    const frac = Math.min(1, P.tolerance / L.BUBBLE_RANGE_DEG);
    if (P.mode === 'line') {
      const H = vialEl.clientHeight || 300, br = 28, span = H / 2 - br;
      const off = frac * span + br + 2;
      const [a, b] = vialEl.querySelectorAll('.mark');
      a.style.top = `${H / 2 - off}px`; b.style.top = `${H / 2 + off}px`;
    } else {
      const ring = vialEl.querySelector('.ring.t');
      const pct = 22 + frac * (100 - 22);
      ring.style.width = `${pct}%`; ring.style.height = `${pct}%`;
    }
  }

  function drawBadges() {
    const b = [];
    b.push(h('span', { class: `badge${P.cal ? ' ok' : ''}` }, icon(P.cal ? 'CircleCheck' : 'Info', 14), t(P.cal ? 'lv_calibration_on' : 'lv_calibration_off')));
    if (P.ref[P.mode]) b.push(h('span', { class: 'badge warn' }, icon('Crosshair', 14), t('lv_badge_reference')));
    b.push(h('span', { class: 'badge' }, `${t('lv_tolerance_label')}: ${t('lv_tolerance_value', num(P.tolerance, 1))}`));
    put(badges, ...b);
  }

  function draw() {
    raf = 0;
    noSensor.classList.toggle('hidden', sensor !== 'missing');
    accelNote.classList.toggle('hidden', !(sensor === 'live' && source === 'accelerometer'));
    gaugeBox.classList.toggle('hidden', sensor === 'missing');
    readBox.classList.toggle('hidden', sensor === 'missing');
    tips.classList.toggle('hidden', sensor === 'missing');
    if (sensor === 'missing') { big.textContent = '—'; state.textContent = t('lv_state_no_sensor'); put(kv); return; }
    const key = L.stateKey(r, P.tolerance);
    const ok = key === 'lv_state_level' || key === 'lv_state_on_target';
    state.textContent = t(key);
    state.classList.toggle('ok', ok);
    vialEl.classList.toggle('on-target', ok);
    if (!r.valid) {
      big.textContent = '—';
      put(kv);
      bubbleEl.style.transform = 'translate(-50%, -50%)';
      return;
    }
    big.textContent = fmtAngle(r.primary);
    const pos = L.bubble(r);
    if (P.mode === 'line') {
      const H = vialEl.clientHeight || 300;
      bubbleEl.style.transform = `translate(-50%, calc(-50% + ${pos.y * (H / 2 - 30)}px))`;
    } else {
      const W = vialEl.clientWidth || 280, span = W / 2 - W * 0.11;
      bubbleEl.style.transform = `translate(calc(-50% + ${pos.x * span}px), calc(-50% + ${pos.y * span}px))`;
    }
    const cell = (k, v) => h('div', null, h('small', { text: t(k) }), h('span', { class: 'value', text: v }));
    if (P.mode === 'surface') put(kv, cell('lv_axis_right_left', fmtAngle(r.x)), cell('lv_axis_forward_back', fmtAngle(r.y)));
    else if (P.mode === 'line') {
      const g = L.grade(r.primary);
      put(kv, cell('lv_axis_angle', `${num(r.primary, 1)}°`), cell('lv_axis_grade', g == null ? '—' : `${num(g, 1)} %`));
    } else put(kv, cell('lv_axis_side_tilt', fmtAngle(r.side)), cell('lv_axis_forward_back', fmtAngle(r.fb)));
  }

  function onSample(s) {
    if (!s) { sensor = 'missing'; draw(); return; }
    if (sensor !== 'live') { sensor = 'live'; source = s.source; draw(); }
    raw = s;
    if (samples.on) samples.list.push({ x: s.x, y: s.y, z: s.z });
    const dt = lastT ? Math.max(0, (s.t - lastT) / 1000) : 0; lastT = s.t;
    filt = L.lowPass(filt, L.corrected(s, P.cal), dt, 0.2);
    r = L.applyReference(L.reading(P.mode, filt), P.ref[P.mode]);
    const was = onTarget;
    onTarget = L.targetLatch(onTarget, L.offTarget(r), P.tolerance);
    if (onTarget && !was) {
      if (P.vibrate) native.haptic('heavy');
      if (P.sound) beep();
    }
    if (!raf) raf = requestAnimationFrame(draw);
  }

  function zeroHere() {
    if (!filt) { toast(t('lv_state_no_data')); return; }
    const ref = L.referenceFrom(L.reading(P.mode, filt));
    if (!ref) { toast(t(P.mode === 'surface' ? 'lv_state_hold_flat' : 'lv_state_hold_upright')); return; }
    P.ref[P.mode] = ref; changed('level'); drawBadges();
    toast(t('lv_badge_reference'));
  }

  // ---- ayarlar
  function settingsSheet() {
    unlockAudio();
    const tolVal = h('span', { class: 'value', text: t('lv_tolerance_value', num(P.tolerance, 1)) });
    const setTol = (d) => {
      P.tolerance = Math.round(Math.min(L.TOLERANCE.max, Math.max(L.TOLERANCE.min, P.tolerance + d)) * 10) / 10;
      tolVal.textContent = t('lv_tolerance_value', num(P.tolerance, 1)); changed('level'); drawBadges(); placeTolerance();
    };
    const line = P.mode === 'line';
    const calStatus = h('span', { class: 'end', text: t(P.cal ? 'lv_calibration_on' : 'lv_calibration_off') });
    let sh;
    sh = sheet(t('lv_level_settings_title'), [
      h('small', { class: 'muted', text: t('lv_unit_label') }),
      segmented([{ value: 'deg', label: t('lv_unit_degrees') }, { value: 'percent', label: t('lv_unit_percent') }], P.unit,
        (v) => { P.unit = v; changed('level'); draw(); }),
      h('small', { class: 'muted', text: t('lv_tolerance_label') }),
      h('div', { class: 'stepper' },
        h('button', { class: 'btn', type: 'button', text: `−${num(0.1, 1)}`, onclick: () => setTol(-0.1), 'aria-label': `${t('lv_tolerance_label')} −` }),
        tolVal,
        h('button', { class: 'btn', type: 'button', text: `+${num(0.1, 1)}`, onclick: () => setTol(0.1), 'aria-label': `${t('lv_tolerance_label')} +` })),
      h('p', { class: 'small', text: t('lv_tolerance_hint') }),
      h('div', { class: 'list' },
        switchRow(t(line ? 'lv_alert_sound_line' : 'lv_alert_sound'), P.sound, (v) => { P.sound = v; changed('level'); if (v) { unlockAudio(); beep(); } }),
        switchRow(t(line ? 'lv_alert_vibrate_line' : 'lv_alert_vibrate'), P.vibrate, (v) => { P.vibrate = v; changed('level'); if (v) native.haptic('heavy'); }),
        h('div', { class: 'row' }, h('span', { class: 'row-text' }, h('span', { text: t('lv_calibration_label') })), calStatus,
          h('button', { class: 'btn', type: 'button', text: t('lv_menu_calibrate'), onclick: () => { sh.close(); calibrationSheet(); } }))),
    ], { cls: 'acc-green' });
  }

  // ---- kalibrasyon
  function calibrationSheet() {
    let step = 1, single = false, m1 = null, busy = false;
    const body = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '14px' } });
    const collect = () => new Promise((res) => {
      samples.list = []; samples.on = true;
      setTimeout(() => { samples.on = false; res(samples.list.slice()); }, 1600);
    });
    const failText = { no_data: 'lv_cal_failed_no_data', moving: 'lv_cal_failed_moving', not_flat: 'lv_cal_failed_not_flat', bias: 'lv_cal_failed_bias' };
    function view(kind, extra) {
      const out = [];
      if (kind === 'step') {
        out.push(notice('info', 'Smartphone', null, t(step === 1 ? 'lv_cal_step1' : 'lv_cal_step2')));
        out.push(h('button', { class: 'btn primary block', type: 'button', disabled: busy ? true : null, onclick: measure }, busy ? `${t('lv_cal_measure')}…` : t('lv_cal_measure')));
        if (step === 1) out.push(h('button', { class: 'btn ghost block', type: 'button', disabled: busy ? true : null, onclick: () => { single = true; measure(); }, text: t('lv_cal_single') }));
      } else if (kind === 'done') {
        out.push(notice('ok', 'CircleCheck', t('lv_cal_done'), extra > 0.05 ? t('lv_cal_done_surface', num(extra, 1)) : null));
        out.push(h('button', { class: 'btn primary block', type: 'button', onclick: () => sh.close(), text: t('lv_cal_ok') }));
      } else {
        out.push(notice('err', 'TriangleAlert', null, t(failText[extra] || 'lv_cal_failed_no_data')));
        out.push(h('button', { class: 'btn primary block', type: 'button', onclick: () => { step = 1; single = false; m1 = null; view('step'); }, text: t('lv_cal_retry') }));
        out.push(h('button', { class: 'btn ghost block', type: 'button', onclick: () => sh.close(), text: t('lv_cal_close') }));
      }
      put(body, ...out);
    }
    async function measure() {
      if (busy) return;
      busy = true; view('step');
      reklam.mesgul('kalibrasyon', true);
      const res = L.calibrationStep(await collect());
      busy = false;
      reklam.mesgul('kalibrasyon', false);
      if (!res.ok) { view('fail', res.reason); return; }
      if (step === 1 && !single) { m1 = res.mean; step = 2; native.haptic('light'); view('step'); return; }
      const c = single ? L.calibrate(res.mean) : L.calibrate(m1, res.mean);
      if (!c.ok) { view('fail', c.reason); return; }
      P.cal = { ...c.cal, at: Date.now(), single }; changed('level');
      native.haptic('success');
      drawBadges();
      view('done', c.surfaceTiltDeg);
    }
    view('step');
    const sh = sheet(t('lv_cal_title'), body, { cls: 'acc-green', onClose: () => { samples.on = false; reklam.mesgul('kalibrasyon', false); } });
  }

  // ---- akış
  let stop = null;
  const start = () => { if (!stop) { lastT = 0; filt = null; stop = native.gravity(onSample); } };
  const halt = () => { if (stop) { stop(); stop = null; } };
  build();
  start();
  requestAnimationFrame(() => placeTolerance());
  window.addEventListener('resize', placeTolerance);
  return {
    el,
    pause: halt,
    resume: start,
    destroy: () => { halt(); window.removeEventListener('resize', placeTolerance); if (raf) cancelAnimationFrame(raf); },
  };
}
