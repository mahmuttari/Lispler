// Kamerayla ölçüm (AR Ölçüm): mesafe, yükseklik, genişlik. Kamera görüntüsü yalnız ekranda gösterilir; kaydedilmez,
// saklanmaz, gönderilmez. Ölçüm kameranın yönünden (dönme vektörü ya da yerçekimi) ve girilen telefon yüksekliğinden
// trigonometriyle çıkar (olcum/ar.js).
//  - Nokta, düğmeye dokunulmadan hemen önceki sakin bakıştan alınır (dokunmak telefonu oynatır; olcum/ar.js › steadyAim).
//  - İlk noktadan sonra sonuç canlı gösterilir (çarpının altındaki etiket); ikinci dokunuş onu sabitler.
//  - Sensör akışı bir kez kurulur: geri gelişte (Android her sistem penceresinden sonra da haber verir) yeniden kurulurken
//    eskisi kapatılır; akış kesilirse bayat bakışla ölçülmez, yeniden başlatılır.
import { h, iconButton, segmented, sheet, toast, notice, put } from '../dom.js';
import { icon } from '../icons.js';
import { t, getLang } from '../i18n.js';
import { S, changed, addHistory } from '../store.js';
import * as native from '../native.js';
import * as reklam from '../reklam.js';
import * as A from '../olcum/ar.js';
import * as B from '../olcum/birim.js';
import { topbar, moreButton, paras } from './common.js';

const PROBLEM = { NeedHeight: 'cm_problem_height', AimLower: 'cm_problem_aim_lower', AimHigher: 'cm_problem_aim_higher', NeedBase: 'cm_problem_base_first',
  TopSteep: 'cm_problem_top_steep', TopLow: 'cm_problem_top_low', Moving: 'cm_problem_steady', NoBearing: 'cm_no_bearing', NotAbove: 'cm_problem_not_above' };
const STALE_MS = 1500;      // bu kadar süre okuma gelmezse bakış bayattır
const RESTART_MS = 4000;    // akış kesilince en sık bu aralıkla yeniden başlatılır
const RESULT_KEY = { distance: 'cm_result_distance', height: 'cm_result_height', width: 'cm_result_width' };
const HISTORY_KEY = { distance: 'cm_history_distance', height: 'cm_history_height', width: 'cm_history_width' };

const SVG_NS = 'http://www.w3.org/2000/svg';
/** Hedef: ince "+" (kolları 20 px, kesişim tam nişan noktası). Altındaki koyu çizgi her zeminde görünür kılar. */
export function arti(boy = 44) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  for (const [k, v] of Object.entries({ viewBox: '0 0 44 44', width: boy, height: boy, 'aria-hidden': 'true', fill: 'none', 'stroke-linecap': 'round' })) svg.setAttribute(k, v);
  for (const [renk, kalinlik] of [['rgba(0,0,0,.7)', 5], ['currentColor', 2]]) {
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', 'M22 2V42M2 22H42');
    p.setAttribute('stroke', renk);
    p.setAttribute('stroke-width', kalinlik);
    svg.append(p);
  }
  return svg;
}

export function render({ params, back }) {
  let mode = ['distance', 'height', 'width'].includes(params.mode) ? params.mode : S.ar.mode;
  let points = [];
  let aim = null, dir = null, lastT = 0, bearingOk = false, orientation = 'waiting';
  let stream = null, track = null, torchOn = false, camState = 'idle', destroyed = false;
  let caps = null, fs = false, paused = false, starting = false;
  const samples = [];       // son 1,5 sn'nin ham yön örnekleri: {t (performance.now), x, y, z}
  let lastEvent = 0, everLive = false, armed = null;
  const units = () => S.settings.units;
  const h0 = () => S.settings.cameraHeight;
  const len = (m) => B.length(m, units(), getLang());
  const sig = (m) => B.sigma(m, units(), getLang());
  const meas = (m) => (m ? `${len(m.value)} ± ${sig(m.sigma)}` : '—');

  // ---- kamera kutusu
  const video = h('video', { autoplay: true, muted: true, playsinline: true, 'aria-hidden': 'true' });
  video.muted = true;
  const cross = h('div', { class: 'cross' }, arti());
  const pill = h('div', { class: 'cam-pill hidden' });
  const problem = h('div', { class: 'cam-problem hidden' });
  const torchBtn = iconButton('Flashlight', t('cm_torch'), toggleTorch);
  torchBtn.classList.add('hidden');
  const fsBtn = iconButton('Maximize', t('cm_fullscreen'), () => fullscreen(!fs));
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

  const bar = topbar({ title: `${t('cm_title_ar')} ${t('cm_title_measure')}`, sub: t('cm_subtitle'), onBack: back, actions: [help, more] });
  const chips = h('div', { class: 'chips' }, heightChip);
  const el = h('div', { class: 'screen tool ar acc-blue' }, bar, cam, tabs, chips, bearingNote, hint, actions, resultCard, approx, fsBar);

  // ---- yerleşim: nişan alırken kaydırmak gerekmesin. Kamera kutusunun yüksekliğini CSS hesaplar (app.css › .screen.ar .cam):
  // görünen yükseklik − banner − üst çubuk (--ar-ust) − alttaki denetimler (--ar-alt). Banner yüksekliği değişince CSS kendiliğinden
  // yeniden hesaplar; denetimlerin yüksekliği (dil, yazı boyu, uyarı satırı) değişince burada ölçülür.
  const altlar = [tabs, chips, bearingNote, hint, actions];
  let sonYer = '';
  function yerlesim() {
    if (destroyed || document.body.classList.contains('fullscreen')) return;
    const alt = altlar.reduce((t2, x) => t2 + (x.offsetHeight ? x.offsetHeight + 14 : 0), 0);
    const ust = Math.round(cam.getBoundingClientRect().top + window.scrollY);
    if (`${alt}|${ust}` === sonYer) return;      // değişmediyse yazılmaz (gözlenen öğelerin boyu kamera boyuna bağlı değil)
    sonYer = `${alt}|${ust}`;
    el.style.setProperty('--ar-alt', `${alt}px`);
    el.style.setProperty('--ar-ust', `${ust}px`);
  }
  const gozlem = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => yerlesim()) : null;
  if (gozlem) for (const x of [bar, ...altlar]) gozlem.observe(x);
  window.addEventListener('resize', yerlesim);

  // ---- akış
  function stepButton(i, inFs) {
    const f = A.FLOW[mode];
    const key = f.buttons[i], sub = f.subs[i];
    const isNext = points.length % 2 === i || (mode === 'width' && i === 0);
    return h('button', { class: `act${isNext && points.length < 2 ? ' primary' : ''}`, type: 'button', onclick: () => select(i), onpointerdown: () => arm(i), onpointercancel: () => { armed = null; },
      disabled: (mode === 'width' && !bearingOk && orientation === 'live') ? true : null, title: sub && !inFs ? t(sub) : null },
    h('span', { text: t(key) }));
  }
  function resetButton(inFs) {
    return h('button', { class: 'act', type: 'button', onclick: () => { points = []; drawAll(); }, title: inFs ? null : t('cm_sub_reset') },
      h('span', { text: t('cm_btn_reset') }));
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

  // Seçim anındaki bakış: parmak ekrana değmeden önceki sakin pencere; örnek akışı teklediyse daha geniş pencere; o da boşsa
  // (sensör yeni başladı) güncel bakış
  function capture() {
    const now = performance.now();
    const st = A.steadyAim(samples, now, bearingOk) || A.steadyAim(samples, now, bearingOk, 900);
    if (st) return st;
    return aim && now - lastEvent < STALE_MS ? { pitch: aim.pitch, bearing: aim.bearing, sp: 0, sb: 0 } : null;
  }
  function arm(btn) { armed = { btn, at: performance.now(), aim: capture() }; }
  function takeAim(btn) {
    const a = armed; armed = null;
    // dokunuşsuz tıklamada (klavye, ekran okuyucu) ya da çok eski dokunuşta tıklama anındaki bakış
    return a && a.btn === btn && performance.now() - a.at < 10000 ? a.aim : capture();
  }

  /** btn: basılan düğme (0: başlangıç / taban / kenar, 1: bitiş / tepe). Bitmiş ölçümde 0 yeni ölçüm başlatır, 1 ikinci
   *  noktayı yeniden seçer. Nokta ancak kabul edilirse eskisinin yerine geçer. */
  function select(btn) {
    const cap = takeAim(btn);
    const i = mode === 'width' ? (points.length === 1 ? 1 : 0) : btn;
    if (i === 1 && points.length === 0) { toast(t(mode === 'height' ? 'cm_problem_base_first' : 'cm_hint_floor_first', t(A.FLOW[mode].buttons[0]))); return; }
    const kept = i === 0 ? [] : points.slice(0, 1);
    const p = A.pointProblem(mode, kept, h0(), cap);
    if (p === 'NoAim') { toast(t(orientation === 'missing' ? 'cm_no_orientation' : 'lv_state_no_data')); return; }
    if (p) { toast(t(PROBLEM[p])); if (p === 'NeedHeight') heightSheet(); return; }
    points = [...kept, cap];
    native.haptic('light');
    if (points.length === 2) finish();
    drawAll();
  }

  function finish() {
    const r = A.result(mode, h0(), points);
    if (!r || !r.main) { toast(t(mode === 'height' ? 'cm_problem_top_low' : 'cm_problem_aim_lower')); points = points.slice(0, 1); return; }
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
  let raf = 0, shownProblem = null;
  function drawLive() {
    raf = 0;
    const live = camState === 'live';
    // Sıradaki adımın sorunu; ölçüm bittiyse uyarı yok (sonuç okunurken telefon indirilir)
    const prob = aim && points.length < 2 ? A.stepProblem(mode, points.length, h0(), aim) : null;
    const shown = prob && live ? prob : null;
    if (shown !== shownProblem) {
      shownProblem = shown;
      problem.classList.toggle('hidden', !shown);
      if (shown) put(problem, icon('TriangleAlert', 18), h('span', { text: t(PROBLEM[shown]) }));
      cross.classList.toggle('bad', !!shown);
    }
    let text = '';
    if (aim && live && h0() > 0) {
      const pv = A.preview(mode, h0(), points, aim);
      if (pv) text = `${t(RESULT_KEY[mode])}: ${len(pv.value)}`;
      // ilk noktadan sonra yalnız sonuç önizlemesi (yükseklikte tepeye nişan alırken zemin uzaklığı göstermek kafa karıştırırdı)
      else if (!points.length && !A.aimProblem(h0(), aim)) { const r = A.floorRange(h0(), aim.pitch); text = r <= A.MAX_RANGE ? t('cm_live_distance', len(r)) : ''; }
    }
    pill.classList.toggle('hidden', !text);
    if (pill.textContent !== text) pill.textContent = text;
  }
  const schedule = () => { if (!raf) raf = requestAnimationFrame(drawLive); };

  function onDirection(d, tms, hasBearing) {
    const now = performance.now();
    const ts = Number.isFinite(tms) ? tms : now;
    if (dir && ts === lastT) return;                       // aynı okuma iki kez gelmiş
    lastEvent = now; everLive = true;
    samples.push({ t: now, x: d.x, y: d.y, z: d.z });
    while (now - samples[0].t > 1500) samples.shift();
    const dt = lastT ? (ts - lastT) / 1000 : 0; lastT = ts;
    const a = dt > 0 ? 1 - Math.exp(-dt / 0.12) : 1;       // ilk okuma ya da saat geri gittiyse süzgeç baştan
    dir = dir ? { x: dir.x + (d.x - dir.x) * a, y: dir.y + (d.y - dir.y) * a, z: dir.z + (d.z - dir.z) * a } : d;
    aim = A.aimFromDirection(dir, hasBearing);
    schedule();
  }

  let stopStream = null, watch = 0, startedAt = 0;
  function startSensors() {
    stopSensors();
    orientation = 'waiting'; bearingOk = false; aim = null; dir = null; lastT = 0; samples.length = 0; armed = null;
    startedAt = performance.now();
    let on = true, rotOk = false, stopGravity = null;
    const gravityOn = () => {
      if (stopGravity) return;
      // dönme vektörü yok: yalnız yerçekimi (yön bilinmez)
      stopGravity = native.gravity((g) => {
        if (!on || rotOk) return;
        if (!g) { orientation = 'missing'; aim = null; drawOverlay(); drawAll(); return; }
        const n = Math.hypot(g.x, g.y, g.z);
        if (!(n > 1)) return;
        if (orientation !== 'live') { orientation = 'live'; bearingOk = false; drawOverlay(); drawAll(); }
        const sz = Math.max(-1, Math.min(1, g.z / n));
        onDirection({ x: 0, y: Math.sqrt(1 - sz * sz), z: -sz }, g.t, false);
      });
    };
    const stopRotation = native.rotation((s) => {
      if (!on) return;
      if (!s) { if (!rotOk) gravityOn(); return; }
      if (!rotOk) {
        rotOk = true;
        // dönme vektörü (geç de olsa) geldi: yerçekimi yedeği kapanır, süzgeç ve örnekler baştan (iki kaynak karışmasın)
        if (stopGravity) { stopGravity(); stopGravity = null; dir = null; lastT = 0; samples.length = 0; }
        orientation = 'live'; bearingOk = true; drawOverlay(); drawAll();
      }
      onDirection({ x: -s.R[2], y: -s.R[5], z: -s.R[8] }, s.t, true);
    });
    stopStream = () => { on = false; stopRotation(); if (stopGravity) stopGravity(); };
    // Bekçi: okuma kesildiyse bakış bayattır (ölçüme girmez) ve akış yeniden başlatılır
    watch = setInterval(() => {
      if (destroyed || orientation === 'missing') return;
      const now = performance.now();
      if (aim && now - lastEvent > STALE_MS) { aim = null; dir = null; lastT = 0; samples.length = 0; armed = null; drawLive(); }
      // yalnız daha önce okuma vermiş telefonda: hiç vermeyen (sensörsüz) telefon "sensör yok" durumuna varabilsin
      if (everLive && now - Math.max(lastEvent, startedAt) > RESTART_MS) startSensors();
    }, 500);
  }
  function stopSensors() {
    if (stopStream) stopStream();
    stopStream = null;
    clearInterval(watch); watch = 0;
  }

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
    if (destroyed || stream || starting) return;
    if (paused) { camState = 'idle'; return; }             // arka planda kamera açılmaz; geri gelince resume() başlatır
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { camState = 'nocam'; drawOverlay(); return; }
    camState = 'idle'; drawOverlay();
    starting = true;
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 960 } } });
      // Kamera açılırken ekrandan çıkıldı ya da uygulama arka plana gitti: açık bırakılmaz
      if (destroyed || paused) { s.getTracks().forEach((x) => x.stop()); return; }
      stream = s; track = s.getVideoTracks()[0] || null;
      // Kamera elimizden alındıysa (başka uygulama, sistem) donmuş görüntüyle ölçülmez
      if (track) track.addEventListener('ended', () => { if (stream === s) { stopCamera(); camState = 'failed'; drawOverlay(); drawAll(); } });
      video.srcObject = s;
      try { await video.play(); } catch (e) { /* sessiz video kendiliğinden oynar */ }
      camState = 'live';
      reklam.mesgul('kamera', true);
      native.keepAwake(true);
    } catch (e) {
      const n = e && e.name;
      camState = n === 'NotAllowedError' || n === 'SecurityError' ? 'denied' : n === 'NotFoundError' || n === 'OverconstrainedError' ? 'nocam' : 'failed';
    } finally { starting = false; }
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
    if (destroyed || paused) return;
    if (caps && caps.rearCamera === false) { camState = 'nocam'; drawOverlay(); return; }
    const p = await native.permission('camera');
    if (destroyed || paused) return;
    if (p === 'granted') startCamera();
    else if (p === 'unavailable') { camState = 'nocam'; drawOverlay(); }
    else { camState = p === 'denied' ? 'denied' : 'perm'; drawOverlay(); }
  }

  function fullscreen(on) {
    fs = !!on;
    document.body.classList.toggle('fullscreen', fs);
    reklam.bannerGizle('tamekran', fs);
    put(fsBtn, icon(fs ? 'Minimize' : 'Maximize', 22));
    const label = t(fs ? 'cm_fullscreen_exit' : 'cm_fullscreen');
    fsBtn.setAttribute('aria-label', label);
    fsBtn.title = label;
  }

  // ---- telefon yüksekliği
  function heightSheet() {
    const imperial = units() === 'imperial';
    let v = h0() > 0 ? h0() : 1.4;
    const steps = imperial ? [[-4 * 0.0254, '−4 in'], [-0.0254, '−1 in'], [0.0254, '+1 in'], [4 * 0.0254, '+4 in']]
      : [[-0.1, '−10 cm'], [-0.01, '−1 cm'], [0.01, '+1 cm'], [0.1, '+10 cm']];
    const val = h('span', { class: 'value', 'aria-live': 'polite' });
    const show = () => { val.textContent = B.phoneHeight(v, units(), getLang()); };
    const clampV = (x) => Math.round(Math.min(A.HEIGHT.max, Math.max(A.HEIGHT.min, x)) * 10000) / 10000;   // 0,1 mm: inç adımları birikip kaymasın
    const stepBtn = ([d, label]) => h('button', { class: 'btn', type: 'button', onclick: () => { v = clampV(v + d); show(); }, text: label });
    show();
    let sh;
    const body = [
      h('p', { text: t('cm_height_text') }),
      h('small', { class: 'muted', text: t('cm_height_label') }),
      h('div', { class: 'stepper four' }, stepBtn(steps[0]), stepBtn(steps[1]), val, stepBtn(steps[2]), stepBtn(steps[3])),
      // önce yenisi açılır, sonra bu kapanır: açık alt sayfa sayısı 0'a düşmez, banner arada bir an görünmez
      h('button', { class: 'btn block', type: 'button', onclick: () => { knownSheet(); sh.close(); }, text: t('cm_known_button') }),
      h('button', { class: 'btn primary block', type: 'button', text: t('cm_height_save'),
        onclick: () => { S.settings.cameraHeight = v; changed('settings'); sh.close(); drawAll(); } }),
    ];
    sh = sheet(t('cm_height_title'), body, { cls: 'acc-blue' });
  }

  // ---- bilinen mesafeyle yükseklik: kısa alt sayfa (artı işareti üstünde görünür kalsın), nişan dokunmadan önceki sakin bakış
  function knownSheet() {
    const imperial = units() === 'imperial';
    let d = A.KNOWN.default;
    const steps = imperial ? [[-12 * 0.0254, '−1 ft'], [-0.0254, '−1 in'], [0.0254, '+1 in'], [12 * 0.0254, '+1 ft']]
      : [[-0.1, '−10 cm'], [-0.01, '−1 cm'], [0.01, '+1 cm'], [0.1, '+10 cm']];
    const val = h('span', { class: 'value', 'aria-live': 'polite' });
    const show = () => { val.textContent = B.phoneHeight(d, units(), getLang()); };
    const clampD = (x) => Math.round(Math.min(A.KNOWN.max, Math.max(A.KNOWN.min, x)) * 10000) / 10000;
    const stepBtn = ([dd, label]) => h('button', { class: 'btn', type: 'button', onclick: () => { d = clampD(d + dd); show(); }, text: label });
    show();
    let sh;
    const aimBtn = h('button', { class: 'btn primary block', type: 'button', text: t('cm_known_aim'),
      onpointerdown: () => arm('bilinen'), onpointercancel: () => { armed = null; },
      onclick: () => {
        const r = A.heightFromKnown(d, takeAim('bilinen'));
        if (r.problem === 'NoAim') { toast(t(orientation === 'missing' ? 'cm_no_orientation' : 'lv_state_no_data')); return; }
        if (r.problem === 'HeightOut') { toast(t('cm_known_out', B.phoneHeight(r.h, units(), getLang()))); return; }
        if (r.problem) { toast(t(PROBLEM[r.problem] || 'cm_problem_aim_lower')); return; }
        S.settings.cameraHeight = Math.round(r.h * 1000) / 1000; changed('settings');
        native.haptic('success');
        sh.close(); drawAll();
        toast(t('cm_known_done', B.phoneHeight(S.settings.cameraHeight, units(), getLang())));
      } });
    sh = sheet(t('cm_known_title'), [
      h('p', { text: t('cm_known_text') }),
      h('small', { class: 'muted', text: t('cm_known_label') }),
      h('div', { class: 'stepper four' }, stepBtn(steps[0]), stepBtn(steps[1]), val, stepBtn(steps[2]), stepBtn(steps[3])),
      aimBtn,
    ], { cls: 'acc-blue' });
  }

  drawAll();
  drawOverlay();
  startSensors();
  begin();

  return {
    el,
    onBack: () => { if (fs) { fullscreen(false); return true; } return false; },
    pause: () => { paused = true; stopCamera(); stopSensors(); },
    resume: () => { if (destroyed) return; paused = false; startSensors(); if (camState === 'idle') begin(); },
    destroy: () => { destroyed = true; stopCamera(); stopSensors(); if (raf) cancelAnimationFrame(raf); fullscreen(false); if (gozlem) gozlem.disconnect(); window.removeEventListener('resize', yerlesim); },
  };
}
