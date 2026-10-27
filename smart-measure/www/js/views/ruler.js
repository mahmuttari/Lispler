// Cetvel ve açı: ekran cetveli (yatay, tam ekran dikey, banka kartıyla kalibrasyon) ve açıölçer (iç/dış açı, kilit,
// 0,5° adım). Ölçek telefonun bildirdiği fiziksel piksel yoğunluğundan gelir (Olcer eklentisi; olcum/cetvel.js).
import { h, iconButton, segmented, sheet, toast, put } from '../dom.js';
import { icon } from '../icons.js';
import { t, num } from '../i18n.js';
import { S, changed, addHistory } from '../store.js';
import * as native from '../native.js';
import * as reklam from '../reklam.js';
import * as C from '../olcum/cetvel.js';
import { topbar, paras } from './common.js';

function fitCanvas(cv) {
  const dpr = window.devicePixelRatio || 1;
  const r = cv.getBoundingClientRect();
  const w = Math.max(1, Math.round(r.width * dpr)), hh = Math.max(1, Math.round(r.height * dpr));
  if (cv.width !== w || cv.height !== hh) { cv.width = w; cv.height = hh; }
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w: r.width, h: r.height };
}

export function render({ params, back }) {
  const R = S.ruler;
  let el = null;
  // Renkler ekranın kendi değişkenlerinden (turuncu araç rengi, tema)
  const css = (name) => getComputedStyle(el || document.documentElement).getPropertyValue(name).trim();
  let tab = params.tab === 'protractor' ? 'protractor' : (params.tab === 'ruler' ? 'ruler' : R.tab);
  let display = null, distLocked = false, angleLocked = false;
  const scale = () => C.mmPerPx(display, window.devicePixelRatio || 1, R.calibrated ? R : null);
  const fmtLen = (mm) => { const v = C.lengthIn(mm, R.unit); return `${num(v.value, v.digits)} ${R.unit}`; };

  const tabs = segmented([{ value: 'ruler', label: t('rl_tab_ruler'), icon: 'Ruler' }, { value: 'protractor', label: t('rl_tab_protractor'), icon: 'Protractor' }],
    tab, (v) => { tab = v; R.tab = v; changed('ruler'); build(); });
  const body = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '14px' } });
  const help = iconButton('CircleHelp', t('rl_help_title'), () => sheet(t('rl_help_title'), paras('rl_help_ruler', 'rl_help_protractor', 'st_acc_ruler_text'), { cls: 'acc-orange' }));
  el = h('div', { class: 'screen tool acc-orange' },
    topbar({ title: t('rl_ruler_title'), sub: t('rl_ruler_subtitle'), onBack: back, actions: [help] }), tabs, body);

  let cleanup = [];
  const onCleanup = (f) => cleanup.push(f);
  function build() {
    cleanup.forEach((f) => f()); cleanup = [];
    tabs.set(tab);
    if (tab === 'ruler') buildRuler(); else buildProtractor();
  }

  // ================= cetvel
  function buildRuler() {
    const cv = h('canvas');
    const wrap = h('div', { class: 'ruler-wrap', role: 'slider', 'aria-label': t('rl_screen_ruler_title') }, cv);
    const big = h('div', { class: 'big', 'aria-live': 'polite' });
    const unitSeg = segmented(Object.keys(C.UNITS).map((u) => ({ value: u, label: u })), R.unit, (u) => { R.unit = u; changed('ruler'); draw(); }, { label: t('lv_unit_label') });
    const lockBtn = h('button', { class: 'act multi', type: 'button', onclick: () => { distLocked = !distLocked; drawButtons(); } });
    const calLine = h('div', { class: 'row' });
    const acts = h('div', { class: 'actions' },
      lockBtn,
      h('button', { class: 'act multi', type: 'button', onclick: () => { R.guides = { ...C.GUIDES.horizontal }; changed('ruler'); draw(); }, text: t('rl_btn_reset_guides') }),
      h('button', { class: 'act multi primary', type: 'button', onclick: copy, text: t('rl_btn_copy_value') }));
    const vBtn = h('button', { class: 'btn block', type: 'button', onclick: verticalRuler }, icon('MoveVertical', 20), t('rl_btn_vertical_ruler'));
    put(body, 
      h('div', null, h('h2', { class: 'small muted', text: t('rl_screen_ruler_sub') })),
      wrap, h('div', { class: 'level-read' }, big), unitSeg, acts, vBtn, h('div', { class: 'card list' }, calLine));

    function drawButtons() {
      lockBtn.textContent = t(distLocked ? 'rl_btn_unlock_distance' : 'rl_btn_lock_distance');
      lockBtn.classList.toggle('primary', distLocked);
    }
    function drawCal() {
      put(calLine, icon(R.calibrated ? 'CircleCheck' : 'TriangleAlert', 20),
        h('span', { class: 'row-text' }, h('span', { text: t(R.calibrated ? 'rl_cal_done' : 'rl_cal_not_done') })),
        h('button', { class: 'btn', type: 'button', onclick: calibrate, text: t('rl_cal_action') }));
    }
    function draw() {
      const { ctx, w, h: H } = fitCanvas(cv);
      const s = scale().x;
      const lenMm = w * s;
      ctx.clearRect(0, 0, w, H);
      const acc = css('--acc'), text = css('--text'), text2 = css('--text2');
      const a = R.guides.a / s, b = R.guides.b / s;
      ctx.fillStyle = `rgba(${css('--acc-rgb')}, .16)`;
      ctx.fillRect(Math.min(a, b), 0, Math.abs(b - a), H);
      const L = { major: 34, half: 24, medium: 20, minor: 14, fine: 9 };
      ctx.strokeStyle = text; ctx.fillStyle = text2; ctx.lineWidth = 1;
      ctx.font = '700 12px Manrope, sans-serif'; ctx.textAlign = 'center';
      for (const tk of C.ticks(lenMm, R.unit)) {
        const x = Math.round(tk.mm / s) + 0.5;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, L[tk.level]); ctx.stroke();
        if (tk.label != null && x > 6 && x < w - 6) ctx.fillText(tk.label, x, L.major + 14);
      }
      for (const [x, k] of [[a, 'A'], [b, 'B']]) {
        ctx.strokeStyle = acc; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H - 26); ctx.stroke();
        ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(x, H - 16, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = css('--on-acc'); ctx.font = '800 11px Manrope, sans-serif'; ctx.fillText(k, x, H - 12);
      }
      big.textContent = fmtLen(R.guides.b - R.guides.a);
      wrap.setAttribute('aria-valuetext', big.textContent);
    }
    // sürükleme
    let drag = null;
    wrap.addEventListener('pointerdown', (e) => {
      const r = wrap.getBoundingClientRect(), s = scale().x, x = e.clientX - r.left;
      const da = Math.abs(x - R.guides.a / s), db = Math.abs(x - R.guides.b / s);
      drag = { k: da <= db ? 'a' : 'b', start: x, a: R.guides.a, b: R.guides.b };
      wrap.setPointerCapture(e.pointerId);
      move(e);
    });
    const move = (e) => {
      if (!drag) return;
      const r = wrap.getBoundingClientRect(), s = scale().x, maxMm = r.width * s;
      const snap = (mm) => Math.round(Math.min(maxMm, Math.max(0, mm)) * 10) / 10;
      const mm = snap((e.clientX - r.left) * s);
      if (distLocked) {
        const d = mm - drag[drag.k];
        let na = drag.a + d, nb = drag.b + d;
        if (Math.min(na, nb) < 0) { const f = -Math.min(na, nb); na += f; nb += f; }
        if (Math.max(na, nb) > maxMm) { const f = Math.max(na, nb) - maxMm; na -= f; nb -= f; }
        R.guides = { a: snap(na), b: snap(nb) };
      } else R.guides = { ...R.guides, [drag.k]: mm };
      draw();
    };
    wrap.addEventListener('pointermove', move);
    const end = () => { if (drag) { drag = null; changed('ruler'); } };
    wrap.addEventListener('pointerup', end);
    wrap.addEventListener('pointercancel', end);
    function copy() {
      const v = fmtLen(R.guides.b - R.guides.a);
      native.copyText(v);
      addHistory('ruler', t('rl_history_ruler'), v, R.calibrated ? t('rl_cal_done') : '');
      toast(t('rl_copied', v));
    }
    const onR = () => draw();
    window.addEventListener('resize', onR);
    onCleanup(() => window.removeEventListener('resize', onR));
    drawButtons(); drawCal();
    requestAnimationFrame(draw);
    rulerRedraw = () => { drawCal(); draw(); };
  }
  let rulerRedraw = () => {};

  // tam ekran dikey cetvel
  function verticalRuler() {
    const cv = h('canvas');
    const val = h('div', { class: 'big' });
    const closeBtn = iconButton('X', t('rl_close'), () => close());
    const box = h('div', { class: 'vruler acc-orange', role: 'dialog', 'aria-label': t('rl_btn_vertical_ruler') }, cv,
      h('div', { class: 'vr-read' }, val, h('div', { class: 'muted small', text: t(R.calibrated ? 'rl_cal_done' : 'rl_cal_not_done') })), h('div', { class: 'vr-close' }, closeBtn));
    document.body.append(box);
    document.body.classList.add('fullscreen');
    reklam.bannerGizle('tamekran', true);
    const draw = () => {
      const { ctx, w, h: H } = fitCanvas(cv);
      const s = scale().y;
      ctx.clearRect(0, 0, w, H);
      const acc = css('--acc'), text = css('--text'), text2 = css('--text2');
      const a = R.vguides.a / s, b = R.vguides.b / s;
      ctx.fillStyle = `rgba(${css('--acc-rgb')}, .14)`;
      ctx.fillRect(0, Math.min(a, b), w, Math.abs(b - a));
      const L = { major: 40, half: 28, medium: 22, minor: 16, fine: 10 };
      ctx.strokeStyle = text; ctx.fillStyle = text2; ctx.lineWidth = 1; ctx.font = '700 13px Manrope, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      for (const tk of C.ticks(H * s, R.unit)) {
        const y = Math.round(tk.mm / s) + 0.5;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(L[tk.level], y); ctx.stroke();
        if (tk.label != null && y > 8) ctx.fillText(tk.label, L.major + 6, y);
      }
      for (const [y, k] of [[a, 'A'], [b, 'B']]) {
        ctx.strokeStyle = acc; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w - 34, y); ctx.stroke();
        ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(w - 20, y, 13, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = css('--on-acc'); ctx.font = '800 11px Manrope, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(k, w - 20, y + 1); ctx.textAlign = 'left';
      }
      val.textContent = fmtLen(R.vguides.b - R.vguides.a);
    };
    let drag = null;
    box.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      const s = scale().y, y = e.clientY;
      drag = Math.abs(y - R.vguides.a / s) <= Math.abs(y - R.vguides.b / s) ? 'a' : 'b';
      box.setPointerCapture(e.pointerId); mv(e);
    });
    const mv = (e) => {
      if (!drag) return;
      const s = scale().y;
      R.vguides = { ...R.vguides, [drag]: Math.round(Math.min(window.innerHeight * s, Math.max(0, e.clientY * s)) * 10) / 10 };
      draw();
    };
    box.addEventListener('pointermove', mv);
    box.addEventListener('pointerup', () => { if (drag) { drag = null; changed('ruler'); } });
    window.addEventListener('resize', draw);
    function close() {
      window.removeEventListener('resize', draw);
      box.remove();
      document.body.classList.remove('fullscreen');
      reklam.bannerGizle('tamekran', false);
      vClose = null;
    }
    vClose = close;
    requestAnimationFrame(draw);
  }
  let vClose = null;

  // banka kartıyla kalibrasyon
  function calibrate() {
    const rep = C.reportedMmPerPx(display, window.devicePixelRatio || 1);
    let sx = R.calibrated ? R.scaleX : 1, sy = R.calibrated ? R.scaleY : 1;
    const frame = h('div', { class: 'card-frame', 'aria-hidden': 'true' });
    const sizeTxt = h('p', { class: 'muted small', style: { textAlign: 'center' } });
    const fit = () => {
      const f = C.frameSizePx(rep, sx, sy);
      frame.style.width = `${f.w}px`; frame.style.height = `${f.h}px`;
      sizeTxt.textContent = `${t('rl_cal_width')} ${num(sx * 100, 1)} % · ${t('rl_cal_height')} ${num(sy * 100, 1)} %`;
    };
    const step = (axis, d) => {
      const lim = (v) => Math.min(C.SCALE.max, Math.max(C.SCALE.min, Math.round((v + d) * 1000) / 1000));
      if (axis === 'x') sx = lim(sx); else sy = lim(sy);
      fit();
    };
    // Çerçeve büyüdükçe ölçek küçülür: "+" çerçeveyi büyütür
    const ctl = (axis, label) => h('div', { class: 'stepper' },
      h('button', { class: 'btn', type: 'button', 'aria-label': `${label} −`, onclick: () => step(axis, 0.002) }, icon('Minus', 18)),
      h('span', { class: 'value', style: { fontSize: '16px' }, text: label }),
      h('button', { class: 'btn', type: 'button', 'aria-label': `${label} +`, onclick: () => step(axis, -0.002) }, icon('Plus', 18)));
    let sh;
    const save = () => {
      R.scaleX = sx; R.scaleY = sy; R.calibrated = true; changed('ruler');
      sh.close(); toast(t('rl_cal_done')); rulerRedraw();
    };
    const reset = () => { R.scaleX = 1; R.scaleY = 1; R.calibrated = false; changed('ruler'); sh.close(); rulerRedraw(); };
    fit();
    sh = sheet(t('rl_cal_title'), [
      h('p', { text: t('rl_cal_text') }), h('div', { class: 'frame-wrap' }, frame), sizeTxt, ctl('x', t('rl_cal_width')), ctl('y', t('rl_cal_height')),
      h('div', { class: 'actions' },
        h('button', { class: 'btn', type: 'button', onclick: () => sh.close(), text: t('rl_cal_cancel') }),
        h('button', { class: 'btn primary', type: 'button', onclick: save, text: t('rl_cal_save') })),
      R.calibrated ? h('button', { class: 'btn ghost block', type: 'button', onclick: reset, text: t('rl_cal_reset') }) : null,
    ], { cls: 'acc-orange cal-sheet' });
  }

  // ================= açıölçer
  function buildProtractor() {
    const cv = h('canvas');
    const wrap = h('div', { class: 'protractor', role: 'slider', 'aria-label': t('rl_protractor_title') }, cv);
    const label = h('small');
    const big = h('div', { class: 'big', 'aria-live': 'polite' });
    const viewSeg = segmented([{ value: 'inner', label: t('rl_btn_inner').replace('\n', ' ') }, { value: 'outer', label: t('rl_btn_outer').replace('\n', ' ') }],
      R.view, (v) => { R.view = v; changed('ruler'); draw(); });
    const lockBtn = h('button', { class: 'act multi', type: 'button', onclick: () => { angleLocked = !angleLocked; drawButtons(); } });
    put(body, 
      h('div', null, h('h2', { class: 'small muted', text: t('rl_protractor_sub') })),
      wrap, h('div', { class: 'angle-read' }, label, big), viewSeg,
      h('div', { class: 'actions' }, lockBtn,
        h('button', { class: 'act', type: 'button', onclick: () => { if (angleLocked) return; R.arms = { ...C.ARMS }; changed('ruler'); draw(); }, text: t('rl_btn_reset') }),
        h('button', { class: 'act multi primary', type: 'button', onclick: copy, text: t('rl_btn_copy_value') })));
    function drawButtons() {
      lockBtn.textContent = t(angleLocked ? 'rl_btn_unlock_angle' : 'rl_btn_lock_angle');
      lockBtn.classList.toggle('primary', angleLocked);
    }
    const geo = (w, H) => {
      const rad = Math.max(60, Math.min(w / 2 - 18, H - 44));
      return { cx: w / 2, cy: H - 22, rad };
    };
    function draw() {
      const { ctx, w, h: H } = fitCanvas(cv);
      const { cx, cy, rad } = geo(w, H);
      ctx.clearRect(0, 0, w, H);
      const acc = css('--acc'), text = css('--text'), text2 = css('--text2'), rgb = css('--acc-rgb');
      const { a, b } = R.arms;
      const toXY = (deg, r) => [cx + r * Math.cos(deg * Math.PI / 180), cy - r * Math.sin(deg * Math.PI / 180)];
      // ölçek
      ctx.strokeStyle = css('--line2'); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, rad, Math.PI, 2 * Math.PI); ctx.stroke();
      ctx.font = '700 11px Manrope, sans-serif'; ctx.fillStyle = text2; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let d = 0; d <= 180; d++) {
        const len = d % 10 === 0 ? 16 : d % 5 === 0 ? 10 : 6;
        const [x1, y1] = toXY(d, rad), [x2, y2] = toXY(d, rad - len);
        ctx.strokeStyle = d % 10 === 0 ? text : css('--text3');
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        if (d % 30 === 0) { const [lx, ly] = toXY(d, rad - 30); ctx.fillText(String(d), lx, ly); }
      }
      // yay
      const lo = Math.min(a, b), hi = Math.max(a, b);
      ctx.fillStyle = `rgba(${rgb}, .18)`;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      if (R.view === 'inner') ctx.arc(cx, cy, rad * 0.55, -hi * Math.PI / 180, -lo * Math.PI / 180);
      else ctx.arc(cx, cy, rad * 0.55, -lo * Math.PI / 180, -hi * Math.PI / 180);
      ctx.closePath(); ctx.fill();
      // kollar
      for (const [deg, k] of [[a, 'A'], [b, 'B']]) {
        const [x, y] = toXY(deg, rad + 4);
        ctx.strokeStyle = acc; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke();
        ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = css('--on-acc'); ctx.font = '800 11px Manrope, sans-serif'; ctx.fillText(k, x, y + 1);
      }
      ctx.fillStyle = text; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
      const an = C.angles(a, b);
      label.textContent = t(R.view === 'inner' ? 'rl_angle_inner' : 'rl_angle_outer');
      big.textContent = `${num(R.view === 'inner' ? an.inner : an.outer, 1)}°`;
      wrap.setAttribute('aria-valuetext', big.textContent);
    }
    let drag = null;
    wrap.addEventListener('pointerdown', (e) => {
      if (angleLocked) return;
      const r = wrap.getBoundingClientRect(), { cx, cy } = geo(r.width, r.height);
      const ang = C.angleAt(cx, cy, e.clientX - r.left, e.clientY - r.top);
      const dist = (x) => Math.min(Math.abs(x - ang), 360 - Math.abs(x - ang));
      drag = dist(R.arms.a) <= dist(R.arms.b) ? 'a' : 'b';
      wrap.setPointerCapture(e.pointerId); mv(e);
    });
    const mv = (e) => {
      if (!drag || angleLocked) return;
      const r = wrap.getBoundingClientRect(), { cx, cy } = geo(r.width, r.height);
      let ang = C.angleAt(cx, cy, e.clientX - r.left, e.clientY - r.top);
      if (ang > 180) ang = ang > 270 ? 0 : 180;
      R.arms = { ...R.arms, [drag]: C.snapAngle(ang) };
      draw();
    };
    wrap.addEventListener('pointermove', mv);
    const end = () => { if (drag) { drag = null; changed('ruler'); } };
    wrap.addEventListener('pointerup', end); wrap.addEventListener('pointercancel', end);
    function copy() {
      const an = C.angles(R.arms.a, R.arms.b), inner = R.view === 'inner';
      const v = `${num(inner ? an.inner : an.outer, 1)}°`;
      native.copyText(v);
      addHistory('protractor', t(inner ? 'rl_history_inner' : 'rl_history_outer'), v);
      toast(t('rl_copied', v));
    }
    const onR = () => draw();
    window.addEventListener('resize', onR);
    onCleanup(() => window.removeEventListener('resize', onR));
    drawButtons();
    requestAnimationFrame(draw);
  }

  native.capabilities().then((c) => { display = c && c.display; build(); });
  build();
  return {
    el,
    onBack: () => { if (vClose) { vClose(); return true; } return false; },
    destroy: () => { cleanup.forEach((f) => f()); if (vClose) vClose(); },
  };
}
