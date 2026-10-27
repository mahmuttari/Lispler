// Kamerayla ölçüm (AR Ölçüm): mesafe, yükseklik, genişlik. Kamera görüntüsü yalnız ekranda gösterilir; kaydedilmez,
// saklanmaz, gönderilmez. Ölçüm kameranın yönünden (dönme vektörü ya da yerçekimi) ve girilen telefon yüksekliğinden
// trigonometriyle çıkar (olcum/ar.js).
import { h, iconButton, segmented, sheet, toast, notice, put } from '../dom.js';
import { icon } from '../icons.js';
import { t, getLang } from '../i18n.js';
import { S, changed, addHistory } from '../store.js';
import * as native from '../native.js';
import * as reklam from '../reklam.js';
import * as A from '../olcum/ar.js';
import * as B from '../olcum/birim.js';
import { topbar, moreButton, paras } from './common.js';

const PROBLEM = { NeedHeight: 'cm_problem_height', AimLower: 'cm_problem_aim_lower', AimHigher: 'cm_problem_aim_higher', NeedBase: 'cm_problem_base_first' };
const RESULT_KEY = { distance: 'cm_result_distance', height: 'cm_result_height', width: 'cm_result_width' };
const HISTORY_KEY = { distance: 'cm_history_distance', height: 'cm_history_height', width: 'cm_history_width' };

export function render({ params, back }) {
  let mode = ['distance', 'height', 'width'].includes(params.mode) ? params.mode : S.ar.mode;
  let points = [];
  let aim = null, dir = null, lastT = 0, bearingOk = false, orientation = 'waiting';
  let stream = null, track = null, torchOn = false, camState = 'idle', destroyed = false;
  let caps = null;
  const units = () => S.settings.units;
  const h0 = () => S.settings.cameraHeight;
  const len = (m) => B.length(m, units(), getLang());
  const sig = (m) => B.sigma(m, units(), getLang());
  const meas = (m) => (m ? `${len(m.value)} ± ${sig(m.sigma)}` : '—');

  // ---- kamera kutusu
  const video = h('video', { autoplay: true, muted: true, playsinline: true, 'aria-hidden': 'true' });
  video.muted = true;
  const cross = h('div', { class: 'cross' }, icon('Crosshair', 54));
  const pill = h('div', { class: 'cam-pill hidden' });
  const problem = h('div', { class: 'cam-problem hidden' });
  const torchBtn = iconButton('Flashlight', t('cm_torch'), toggleTorch);
  torchBtn.classList.add('hidden');
  const fsBtn = iconButton('Maximize', t('cm_fullscreen'), () => fullscreen(true));
  const overlay = h('div', { class: 'cam-overlay hidden' });
  const hud = h('div', { class: 'cam-hud hidden', 'aria-live': 'polite' });
  const cam = h('div', { class: 'cam acc-blue' }, video, cross, pill, problem, hud, h('div', { class: 'cam-tools' }, torchBtn, fsBtn), overlay);

  // ---- denetimler
  const tabs = segmented([
    { value: 'distance', label: t('cm_tab_distance') },
    { value: 'height', label: t('cm_tab_height') },
    { value: 'width', label: t('cm_tab_width') },
  ], mode, (v) => { mode = v; S.ar.mode = v; changed('ar'); points = []; drawAll(); }, { label: t('cm_subtitle') });
  const heightChip = h('button', { class: 'chip', type: 'button', onclick: heightSheet });
  const hint = h('div', { class: 'hint-line' });
  const actions = h('div', { class: 'actions' });
  const resultCard = h('section', { class: 'card result acc-blue hidden' });
  const bearingNote = h('div', { class: 'hidden' }, notice('warn', 'TriangleAlert', null, t('cm_no_bearing')));
  const approx = h('p', { class: 'muted small', text: t('cm_approx_note') });
  const fsHint = h('div', { class: 'hint' });
  const fsActions = h('div', { class: 'actions' });
  const fsBar = h('div', { class: 'fs-bar acc-blue' }, fsHint, fsActions);

  const more = moreButton(() => [
    { label: t('cm_menu_copy'), icon: 'Copy', onclick: copyResult, hidden: !resultText() },
    { label: t('cm_menu_share'), icon: 'Share2', onclick: () => native.shareText(resultText()), hidden: !resultText() },
    { label: t('cm_menu_height'), icon: 'Smartphone', onclick: heightSheet },
  ]);
  const help = iconButton('CircleHelp', t('cm_help_title'), () => sheet(t('cm_help_title'), [...paras('cm_help_text', 'cm_approx_note', 'st_acc_camera_text')]));

  const el = h('div', { class: 'screen tool acc-blue' },
    topbar({ title: `${t('cm_title_ar')} ${t('cm_title_measure')}`, sub: t('cm_subtitle'), onBack: back, actions: [help, more] }),
    cam, tabs, h('div', { class: 'chips' }, heightChip), bearingNote, hint, actions, resultCard, approx, fsBar);

  // ---- akış
  function stepButton(i, inFs) {
    const f = A.FLOW[mode];
    const key = f.buttons[i], sub = f.subs[i];
    const isNext = points.length % 2 === i || (mode === 'width' && i === 0);
    return h('button', { class: `act${isNext && points.length < 2 ? ' primary' : ''}`, type: 'button', onclick: () => select(i),
      disabled: (mode === 'width' && !bearingOk && orientation === 'live') ? true : null },
    h('span', { text: t(key) }), sub && !inFs ? h('small', { text: t(sub) }) : null);
  }
  function resetButton(inFs) {
    return h('button', { class: 'act', type: 'button', onclick: () => { points = []; drawAll(); } },
      h('span', { text: t('cm_btn_reset') }), inFs ? null : h('small', { text: t('cm_sub_reset') }));
  }
  function drawActions() {
    const btns = (inFs) => {
      const out = [];
      if (mode === 'width') out.push(stepButton(0, inFs));
      else out.push(stepButton(0, inFs), stepButton(1, inFs));
      out.push(resetButton(inFs));
      if (inFs) out.push(h('button', { class: 'act', type: 'button', onclick: () => fullscreen(false) }, icon('Minimize', 20), h('span', { text: t('cm_fullscreen_exit') })));
      return out;
    };
    put(actions, ...btns(false));
    put(fsActions, ...btns(true));
  }

  function select(i) {
    if (mode === 'width') i = points.length >= 2 ? 0 : points.length;
    if (points.length >= 2) points = [];
    if (i === 1 && points.length === 0) { toast(t(mode === 'height' ? 'cm_problem_base_first' : 'cm_hint_floor_first', t(A.FLOW[mode].buttons[0]))); return; }
    if (i === 0 && points.length === 1 && mode !== 'width') points = [];
    const p = A.stepProblem(mode, points.length, h0(), aim);
    if (p === 'NoAim') { toast(t(orientation === 'missing' ? 'cm_no_orientation' : 'lv_state_no_data')); return; }
    if (p) { toast(t(PROBLEM[p])); if (p === 'NeedHeight') heightSheet(); return; }
    points.push({ pitch: aim.pitch, bearing: aim.bearing });
    native.haptic('light');
    if (points.length === 2) finish();
    drawAll();
  }

  function finish() {
    const r = A.result(mode, h0(), points);
    if (!r || !r.main) { toast(t(mode === 'height' ? 'cm_problem_aim_higher' : 'cm_problem_aim_lower')); points = points.slice(0, 1); return; }
    addHistory('ar', t(HISTORY_KEY[mode]), meas(r.main), `${t('cm_height_set', B.phoneHeight(h0(), units(), getLang()))}`);
    native.haptic('success');
    toast(t('cm_saved'));
  }

  function resultText() {
    const r = h0() > 0 ? A.result(mode, h0(), points) : null;
    if (!r) return '';
    if (r.main) return `${t(RESULT_KEY[mode])}: ${meas(r.main)}`;
    return `${t('cm_result_distance_you')}: ${meas(r.you)}`;
  }
  async function copyResult() {
    const s = resultText();
    if (s && await native.copyText(s)) toast(t('cm_copied', s));
  }

  function drawResult() {
    const r = h0() > 0 ? A.result(mode, h0(), points) : null;
    resultCard.classList.toggle('hidden', !r);
    hud.classList.toggle('hidden', !(r && r.main) || camState !== 'live');
    if (!r) return;
    const rows = [];
    if (r.main) {
      rows.push(h('small', { class: 'muted', text: t(RESULT_KEY[mode]) }), h('div', { class: 'big', text: len(r.main.value) }), h('div', { class: 'pm', text: `± ${sig(r.main.sigma)}` }));
      put(hud, h('small', { text: t(RESULT_KEY[mode]) }), h('b', { text: len(r.main.value) }), h('span', { text: `± ${sig(r.main.sigma)}` }));
    }
    rows.push(h('div', { class: 'row', style: { borderBottom: '0', minHeight: '0', paddingBottom: '0' } },
      h('span', { class: 'row-text' }, h('small', { text: t('cm_result_distance_you') })), h('span', { class: 'value', text: meas(r.you) })));
    put(resultCard, ...rows);
  }

  function drawHint() {
    const hk = A.hintFor(mode, points.length, h0() > 0);
    const text = hk.arg ? t(hk.key, t(hk.arg)) : t(hk.key);
    put(hint, icon('Info', 18), h('span', { text }));
    fsHint.textContent = text;
  }

  function drawHeight() {
    const v = h0();
    put(heightChip, icon('Smartphone', 16), h('span', { text: v > 0 ? t('cm_height_set', B.phoneHeight(v, units(), getLang())) : t('cm_height_not_set') }));
    heightChip.classList.toggle('acc', !(v > 0));
  }

  function drawAll() {
    tabs.set(mode);
    bearingNote.classList.toggle('hidden', !(orientation === 'live' && !bearingOk && mode !== 'height'));
    drawHeight(); drawHint(); drawActions(); drawResult(); drawLive();
  }

  // ---- canlı bakış
  let raf = 0;
  function drawLive() {
    raf = 0;
    const prob = aim ? A.aimProblem(h0(), aim) : null;
    const needFloor = !(mode === 'height' && points.length === 1);
    const shown = needFloor ? prob : (prob === 'NeedHeight' ? prob : null);
    problem.classList.toggle('hidden', !shown || camState !== 'live');
    if (shown) put(problem, icon('TriangleAlert', 18), h('span', { text: t(PROBLEM[shown]) }));
    cross.classList.toggle('bad', !!shown);
    const ok = aim && !prob && camState === 'live';
    pill.classList.toggle('hidden', !ok);
    if (ok) {
      const r = A.floorRange(h0(), aim.pitch);
      pill.textContent = r <= A.MAX_RANGE ? t('cm_live_distance', len(r)) : '—';
    }
  }
  const schedule = () => { if (!raf) raf = requestAnimationFrame(drawLive); };

  function onDirection(d, tms, hasBearing) {
    const dt = lastT ? Math.max(0, (tms - lastT) / 1000) : 0; lastT = tms;
    const a = dt ? 1 - Math.exp(-dt / 0.12) : 1;
    dir = dir ? { x: dir.x + (d.x - dir.x) * a, y: dir.y + (d.y - dir.y) * a, z: dir.z + (d.z - dir.z) * a } : d;
    const n = Math.hypot(dir.x, dir.y, dir.z) || 1;
    const pitch = Math.asin(Math.max(-1, Math.min(1, -dir.z / n))) * 180 / Math.PI;
    const bearing = hasBearing ? ((Math.atan2(dir.x, dir.y) * 180 / Math.PI) + 360) % 360 : null;
    aim = { pitch, bearing };
    schedule();
  }

  let sensorStops = [];
  function startSensors() {
    orientation = 'waiting';
    let rotOk = false;
    const stopRot = native.rotation((s) => {
      if (!s) {
        if (rotOk) return;
        // dönme vektörü yok: yalnız yerçekimi (yön bilinmez)
        sensorStops.push(native.gravity((g) => {
          if (!g) { orientation = 'missing'; aim = null; drawOverlay(); drawAll(); return; }
          if (orientation !== 'live') { orientation = 'live'; bearingOk = false; drawAll(); }
          const n = Math.hypot(g.x, g.y, g.z), sz = Math.max(-1, Math.min(1, g.z / n));
          onDirection({ x: 0, y: Math.sqrt(1 - sz * sz), z: -sz }, g.t, false);
        }));
        return;
      }
      if (!rotOk) { rotOk = true; orientation = 'live'; bearingOk = true; drawAll(); }
      onDirection({ x: -s.R[2], y: -s.R[5], z: -s.R[8] }, s.t, true);
    });
    sensorStops.push(stopRot);
  }
  const stopSensors = () => { sensorStops.forEach((f) => f()); sensorStops = []; };

  // ---- kamera
  function drawOverlay() {
    const o = (iconName, title, text, ...btns) => put(overlay, 
      h('div', { class: 'ic-big' }, icon(iconName, 30)), title ? h('h2', { text: title }) : null, text ? h('p', { text }) : null, ...btns);
    overlay.classList.toggle('hidden', camState === 'live' && orientation !== 'missing');
    torchBtn.classList.toggle('hidden', !(camState === 'live' && track && hasTorch()));
    fsBtn.classList.toggle('hidden', camState !== 'live');
    if (orientation === 'missing') return o('TriangleAlert', null, t('cm_no_orientation'));
    if (camState === 'perm') return o('Camera', t('cm_perm_title'), t('cm_perm_text'), h('button', { class: 'btn primary', type: 'button', onclick: ask, text: t('cm_perm_button') }));
    if (camState === 'denied') return o('Camera', t('cm_perm_title'), t('cm_perm_denied'),
      h('button', { class: 'btn primary', type: 'button', onclick: ask, text: t('cm_perm_button') }),
      native.isNative ? h('button', { class: 'btn', type: 'button', onclick: () => native.openAppSettings(), text: t('cm_open_settings') }) : null);
    if (camState === 'nocam') return o('Camera', null, t('cm_no_camera'));
    if (camState === 'failed') return o('TriangleAlert', null, t('cm_camera_failed'), h('button', { class: 'btn', type: 'button', onclick: startCamera, text: t('lv_cal_retry') }));
    if (camState === 'idle') return o('Camera', null, t('sn_light_waiting'));
    return null;
  }

  async function ask() {
    const p = await native.permission('camera', true);
    if (p === 'granted' || (!native.isNative && p !== 'unavailable')) startCamera();
    else { camState = 'denied'; drawOverlay(); }
  }

  const hasTorch = () => { try { return !!(track.getCapabilities && track.getCapabilities().torch); } catch (e) { return false; } };

  async function toggleTorch() {
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
      torchOn = !torchOn;
    } catch (e) { torchOn = false; }
    torchBtn.classList.toggle('on', torchOn);
    torchBtn.setAttribute('aria-label', t(torchOn ? 'cm_torch_off' : 'cm_torch'));
  }

  async function startCamera() {
    if (destroyed || stream) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { camState = 'nocam'; drawOverlay(); return; }
    camState = 'idle'; drawOverlay();
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 960 } } });
      if (destroyed) { s.getTracks().forEach((x) => x.stop()); return; }
      stream = s; track = s.getVideoTracks()[0] || null;
      video.srcObject = s;
      try { await video.play(); } catch (e) { /* sessiz video kendiliğinden oynar */ }
      camState = 'live';
      reklam.mesgul('kamera', true);
      native.keepAwake(true);
    } catch (e) {
      const n = e && e.name;
      camState = n === 'NotAllowedError' || n === 'SecurityError' ? 'denied' : n === 'NotFoundError' || n === 'OverconstrainedError' ? 'nocam' : 'failed';
    }
    drawOverlay(); drawAll();
  }

  function stopCamera() {
    if (stream) stream.getTracks().forEach((x) => x.stop());
    stream = null; track = null; torchOn = false; torchBtn.classList.remove('on');
    video.srcObject = null;
    reklam.mesgul('kamera', false);
    native.keepAwake(false);
    if (camState === 'live') camState = 'idle';
  }

  async function begin() {
    caps = await native.capabilities();
    if (destroyed) return;
    if (caps && caps.rearCamera === false) { camState = 'nocam'; drawOverlay(); return; }
    const p = await native.permission('camera');
    if (destroyed) return;
    if (p === 'granted') startCamera();
    else if (p === 'unavailable') { camState = 'nocam'; drawOverlay(); }
    else { camState = p === 'denied' ? 'denied' : 'perm'; drawOverlay(); }
  }

  function fullscreen(on) {
    document.body.classList.toggle('fullscreen', on);
    reklam.bannerGizle('tamekran', on);
    put(fsBtn, icon(on ? 'Minimize' : 'Maximize', 22));
    fsBtn.setAttribute('aria-label', t(on ? 'cm_fullscreen_exit' : 'cm_fullscreen'));
    fsBtn.onclick = () => fullscreen(!on);
  }

  // ---- telefon yüksekliği
  function heightSheet() {
    const imperial = units() === 'imperial';
    let v = h0() > 0 ? h0() : 1.4;
    const steps = imperial ? [[-4 * 0.0254, '−4 in'], [-0.0254, '−1 in'], [0.0254, '+1 in'], [4 * 0.0254, '+4 in']]
      : [[-0.1, '−10 cm'], [-0.01, '−1 cm'], [0.01, '+1 cm'], [0.1, '+10 cm']];
    const val = h('span', { class: 'value', 'aria-live': 'polite' });
    const show = () => { val.textContent = B.phoneHeight(v, units(), getLang()); };
    const clampV = (x) => Math.round(Math.min(A.HEIGHT.max, Math.max(A.HEIGHT.min, x)) * 1000) / 1000;
    const stepBtn = ([d, label]) => h('button', { class: 'btn', type: 'button', onclick: () => { v = clampV(v + d); show(); }, text: label });
    show();
    let sh;
    const body = [
      h('p', { text: t('cm_height_text') }),
      h('small', { class: 'muted', text: t('cm_height_label') }),
      h('div', { class: 'stepper four' }, stepBtn(steps[0]), stepBtn(steps[1]), val, stepBtn(steps[2]), stepBtn(steps[3])),
      h('button', { class: 'btn primary block', type: 'button', text: t('cm_height_save'),
        onclick: () => { S.settings.cameraHeight = v; changed('settings'); sh.close(); drawAll(); } }),
    ];
    sh = sheet(t('cm_height_title'), body, { cls: 'acc-blue' });
  }

  drawAll();
  drawOverlay();
  startSensors();
  begin();

  return {
    el,
    onBack: () => { if (document.body.classList.contains('fullscreen')) { fullscreen(false); return true; } return false; },
    pause: () => { stopCamera(); stopSensors(); },
    resume: () => { if (!destroyed) { startSensors(); if (camState === 'idle') begin(); } },
    destroy: () => { destroyed = true; stopCamera(); stopSensors(); if (raf) cancelAnimationFrame(raf); fullscreen(false); },
  };
}
