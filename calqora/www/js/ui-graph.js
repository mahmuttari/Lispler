// Graph tab: up to four functions of x, pan / pinch / wheel zoom, trace, and roots / extrema / intersections.
import { h, icon, insertAt } from './dom.js';
import { t } from './i18n.js';
import { S, save, ctxOf } from './state.js';
import { compileReal } from './engine.js';
import { derivative, findRoot } from './mathx.js';
import { fmtReal } from './format.js';
import { toast } from './sheet.js';
import { attachRadicals } from './radical.js';

const MAXF = 4, COLORS = ['--g1', '--g2', '--g3', '--g4'];
const CHIPS = ['x', '^', '(', ')', 'π', 'e', '+', '−', '×', '÷', '.', 'sin(', 'cos(', 'tan(', '√(', 'abs(', 'ln(', 'log(', 'exp(', 'a', 'b', 'c', 'd'];
const GANGLES = ['rad', 'deg', 'grad'];

function nice(raw) {
  const p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
}

export function mountGraph(root) {
  const G = S.graph = Object.assign({ fns: [{ s: 'sin(x)', on: true }, { s: 'x^2/10', on: true }], cx: 0, cy: 0, sx: null, sy: null }, S.graph || {});
  let W = 0, H = 0, dpr = 1, trace = null, marks = [], traceMode = false, active = null;
  const fs = [];   // compiled functions, parallel to G.fns

  const canvas = h('canvas');
  const readout = h('div', { class: 'greadout', hidden: true });
  const btn = (text, label, fn) => h('button', { 'aria-label': label, onclick: fn, text });
  const traceBtn = h('button', { 'aria-label': t('g.trace'), onclick: () => { traceMode = !traceMode; traceBtn.classList.toggle('on', traceMode); toast(t(traceMode ? 'g.traceOn' : 'g.traceOff')); } }, icon('target'));
  const wrap = h('div', { class: 'gwrap' }, canvas, readout,
    h('div', { class: 'gtools' },
      btn('+', t('g.zoomIn'), () => zoom(1.5, W / 2, H / 2)), btn('−', t('g.zoomOut'), () => zoom(1 / 1.5, W / 2, H / 2)),
      h('button', { 'aria-label': t('g.fit'), onclick: fitY }, icon('fit')),
      h('button', { 'aria-label': t('g.reset'), onclick: reset, text: '1:1' }),
      traceBtn));
  const rowsEl = h('div', { class: 'grows' });
  const chipsEl = h('div', { class: 'chiprow' }, CHIPS.map(c => h('button', { text: c === '√(' ? null : c, html: c === '√(' ? '<span class="radk"></span>' : null, 'aria-label': c === '√(' ? 'square root' : null, onmousedown: e => e.preventDefault(), onclick: () => {
    const el = active || rowsEl.querySelector('input'); if (!el) return;
    el.focus(); insertAt(el, c === '−' ? '-' : c.replace('×', '*').replace('÷', '/'));
  } })));
  const angleBtn = h('button', { class: 'pill', onclick: () => { S.settings.gAngle = GANGLES[(GANGLES.indexOf(S.settings.gAngle) + 1) % 3]; save(); rebuildAll(); angleBtn.textContent = S.settings.gAngle.toUpperCase(); } }, S.settings.gAngle.toUpperCase());
  const actEl = h('div', { class: 'gact' },
    h('button', { class: 'pill', text: t('g.root'), onclick: () => analyse('root') }),
    h('button', { class: 'pill', text: t('g.extremum'), onclick: () => analyse('ext') }),
    h('button', { class: 'pill', text: t('g.intersect'), onclick: () => analyse('int') }),
    angleBtn);
  const addBtn = h('button', { class: 'pill', dir: 'ltr', text: '+ f(x)', onclick: () => { if (G.fns.length < MAXF) { G.fns.push({ s: '', on: true }); renderRows(); rebuildAll(); } } });
  root.append(wrap, h('div', { class: 'gpanel' }, rowsEl, chipsEl, h('div', { class: 'gact' }, addBtn), actEl));

  // ---------------------------------------------------------------- functions
  function gctx() { return ctxOf({ angle: S.settings.gAngle, complex: false }); }
  function rebuildAll() {
    const c = gctx();
    G.fns.forEach((f, i) => {
      try { fs[i] = f.s.trim() ? compileReal(f.s, c) : null; f.bad = false; } catch (e) { fs[i] = null; f.bad = !!f.s.trim(); }
    });
    fs.length = G.fns.length;
    rowsEl.querySelectorAll('input').forEach((el, i) => el.style.borderColor = G.fns[i] && G.fns[i].bad ? 'var(--danger)' : '');
    save(); draw();
  }
  function renderRows() {
    rowsEl.replaceChildren(...G.fns.map((f, i) => {
      const input = h('input', { class: 'field', type: 'text', value: f.s, placeholder: i === 0 ? 'sin(x)' : '', autocomplete: 'off', autocorrect: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'f' + (i + 1),
        oninput: () => { f.s = input.value; trace = null; marks = []; readout.hidden = true; rebuildAll(); }, onfocus: () => { active = input; } });
      const dot = h('button', { class: 'dot' + (f.on ? '' : ' off'), style: 'color:var(' + COLORS[i] + ')', 'aria-label': 'toggle f' + (i + 1), onclick: () => { f.on = !f.on; dot.classList.toggle('off', !f.on); draw(); save(); } }, h('i', { style: 'background:var(' + COLORS[i] + ')' }));
      const row = h('div', { class: 'frow' }, dot, h('span', { class: 'lab', html: 'f<sub>' + (i + 1) + '</sub>(x)' }), input,
        G.fns.length > 1 ? h('button', { class: 'ibtn', style: 'width:34px;height:34px', 'aria-label': t('delete'), onclick: () => { G.fns.splice(i, 1); fs.splice(i, 1); trace = null; marks = []; renderRows(); rebuildAll(); } }, icon('close')) : null);
      attachRadicals(input, 'line');   // √ gets its bar here too
      return row;
    }));
    addBtn.hidden = G.fns.length >= MAXF;
  }

  // ---------------------------------------------------------------- view
  const X = x => W / 2 + (x - G.cx) * G.sx;
  const Y = y => H / 2 - (y - G.cy) * G.sy;
  const unX = px => G.cx + (px - W / 2) / G.sx;
  const unY = py => G.cy - (py - H / 2) / G.sy;
  function reset() { G.sx = G.sy = W / 20; G.cx = 0; G.cy = 0; draw(); save(); }
  function zoom(k, px, py) {
    const wx = unX(px), wy = unY(py);
    G.sx = Math.min(1e9, Math.max(1e-9, G.sx * k)); G.sy = Math.min(1e9, Math.max(1e-9, G.sy * k));
    G.cx = wx - (px - W / 2) / G.sx; G.cy = wy + (py - H / 2) / G.sy;
    draw(); save();
  }
  function fitY() {
    const ys = [];
    fs.forEach((f, i) => { if (f && G.fns[i].on) for (let k = 0; k <= 300; k++) { const y = f(unX(k / 300 * W)); if (Number.isFinite(y)) ys.push(y); } });
    if (!ys.length) return;
    ys.sort((a, b) => a - b);
    const lo = ys[Math.floor(ys.length * 0.03)], hi = ys[Math.ceil(ys.length * 0.97) - 1];
    let span = hi - lo;
    if (!(span > 0)) span = Math.max(1, Math.abs(hi) * 0.2);
    G.cy = (lo + hi) / 2; G.sy = H * 0.8 / span;
    draw(); save();
  }

  // ---------------------------------------------------------------- drawing
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const tick = (v, step) => {
    if (v === 0) return '0';
    const a = Math.abs(v);
    if (a >= 1e6 || step < 1e-4) return fmtReal(v, { mode: 'sci', digits: 2, comma: S.settings.comma });
    const dec = Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
    return fmtReal(Number(v.toFixed(dec)), { mode: 'norm', sig: 10, comma: S.settings.comma });
  };

  function draw() {
    if (!W || !H) return;
    const g = canvas.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    const colGrid = css('--grid'), colAxis = css('--axis'), colText = css('--muted');
    const stepX = nice(70 / G.sx), stepY = nice(46 / G.sy);
    g.font = '11px ui-monospace, Consolas, monospace';
    g.lineWidth = 1;
    const x0 = unX(0), x1 = unX(W), yT = unY(0), yB = unY(H);
    g.strokeStyle = colGrid; g.beginPath();
    for (let v = Math.ceil(x0 / stepX) * stepX; v <= x1; v += stepX) { const px = Math.round(X(v)) + .5; g.moveTo(px, 0); g.lineTo(px, H); }
    for (let v = Math.ceil(yB / stepY) * stepY; v <= yT; v += stepY) { const py = Math.round(Y(v)) + .5; g.moveTo(0, py); g.lineTo(W, py); }
    g.stroke();
    // axes, and their labels pinned to the edge when the axis is off screen
    const ax = Math.min(H - 16, Math.max(2, Y(0))), ay = Math.min(W - 4, Math.max(26, X(0)));
    g.strokeStyle = colAxis; g.lineWidth = 1.4; g.beginPath();
    if (X(0) >= 0 && X(0) <= W) { g.moveTo(Math.round(X(0)) + .5, 0); g.lineTo(Math.round(X(0)) + .5, H); }
    if (Y(0) >= 0 && Y(0) <= H) { g.moveTo(0, Math.round(Y(0)) + .5); g.lineTo(W, Math.round(Y(0)) + .5); }
    g.stroke();
    g.fillStyle = colText; g.textAlign = 'center'; g.textBaseline = 'top';
    for (let v = Math.ceil(x0 / stepX) * stepX; v <= x1; v += stepX) { if (Math.abs(v) < stepX / 2) continue; g.fillText(tick(v, stepX), X(v), Math.min(H - 14, Math.max(2, Y(0) + 3))); }
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (let v = Math.ceil(yB / stepY) * stepY; v <= yT; v += stepY) { if (Math.abs(v) < stepY / 2) continue; g.fillText(tick(v, stepY), Math.min(W - 2, Math.max(30, X(0) - 4)), Y(v) - 0); }

    // curves
    g.lineWidth = 2.2; g.lineJoin = 'round';
    fs.forEach((f, i) => {
      if (!f || !G.fns[i].on) return;
      g.strokeStyle = css(COLORS[i]); g.beginPath();
      let pen = false, prevY = 0, prevOff = 0;
      for (let px = 0; px <= W; px += 1) {
        const y = f(unX(px));
        if (!Number.isFinite(y)) { pen = false; continue; }
        const py = Y(y), off = py < -4 ? -1 : py > H + 4 ? 1 : 0;
        if (pen && ((off !== 0 && prevOff !== 0 && off !== prevOff) || Math.abs(py - prevY) > 20 * H)) pen = false;
        const cy = Math.max(-1e5, Math.min(1e5, py));
        if (pen) g.lineTo(px, cy); else g.moveTo(px, cy);
        pen = true; prevY = py; prevOff = off;
      }
      g.stroke();
    });

    // marks and trace
    const drawPoint = (x, y, color, label) => {
      const px = X(x), py = Y(y);
      if (!(px > -20 && px < W + 20 && py > -20 && py < H + 20)) return;
      g.fillStyle = css('--surface'); g.strokeStyle = color; g.lineWidth = 2.2;
      g.beginPath(); g.arc(px, py, 5.5, 0, 6.2832); g.fill(); g.stroke();
      if (label) { g.fillStyle = color; g.textAlign = 'left'; g.textBaseline = 'bottom'; g.font = '600 11.5px ui-monospace, Consolas, monospace'; g.fillText(label, px + 8, py - 6); }
    };
    marks.forEach(m => drawPoint(m.x, m.y, css('--text'), m.label));
    if (trace) {
      const f = fs[trace.i];
      if (f) {
        const y = f(trace.x);
        if (Number.isFinite(y)) {
          const px = X(trace.x);
          g.setLineDash([4, 4]); g.strokeStyle = colAxis; g.lineWidth = 1; g.beginPath(); g.moveTo(px, 0); g.lineTo(px, H); g.stroke(); g.setLineDash([]);
          drawPoint(trace.x, y, css(COLORS[trace.i]), '');
        }
      }
    }
  }

  function readTrace() {
    if (!trace || !fs[trace.i]) { readout.hidden = true; return; }
    const y = fs[trace.i](trace.x);
    const o = { mode: 'norm', sig: 7, comma: S.settings.comma };
    readout.hidden = false;
    readout.textContent = 'f' + (trace.i + 1) + '   x = ' + fmtReal(trace.x, o) + '   y = ' + (Number.isFinite(y) ? fmtReal(y, o) : '—');
  }

  function setTrace(px, py) {
    const x = unX(px);
    let best = -1, bd = Infinity;
    fs.forEach((f, i) => {
      if (!f || !G.fns[i].on) return;
      const y = f(x);
      if (!Number.isFinite(y)) return;
      const d = Math.abs(Y(y) - py);
      if (d < bd) { bd = d; best = i; }
    });
    if (best < 0) return;
    trace = { x, i: trace && traceMode ? trace.i : best };
    marks = [];
    readTrace(); draw();
  }

  // ---------------------------------------------------------------- analysis
  const refineRoot = (f, a, b) => {
    let fa = f(a);
    for (let i = 0; i < 100; i++) {
      const m = (a + b) / 2, fm = f(m);
      if (fm === 0) return m;
      if (fa * fm < 0) b = m; else { a = m; fa = fm; }
    }
    return (a + b) / 2;
  };
  function roots(f, lo, hi) {
    const out = [], n = 600;
    let px = lo, py = f(lo);
    for (let k = 1; k <= n; k++) {
      const x = lo + (hi - lo) * k / n, y = f(x);
      if (Number.isFinite(py) && Number.isFinite(y)) {
        if (y === 0) out.push(x);
        else if (py * y < 0 && Math.abs(py) + Math.abs(y) < 1e12) {
          const r = refineRoot(f, px, x);
          if (Math.abs(f(r)) < 1e-6 * Math.max(1, Math.abs(py), Math.abs(y))) out.push(Math.abs(r) < 1e-10 * (hi - lo) ? 0 : r);   // a sign change at an asymptote is not a root
        }
      }
      px = x; py = y;
    }
    return out;
  }
  function extrema(f, lo, hi) {
    const out = [], n = 600, h0 = (hi - lo) / n;
    const ys = Array.from({ length: n + 1 }, (_, k) => f(lo + h0 * k));
    for (let k = 1; k < n; k++) {
      const a = ys[k - 1], b = ys[k], c = ys[k + 1];
      if (!Number.isFinite(a + b + c)) continue;
      const isMax = b > a && b >= c, isMin = b < a && b <= c;
      if (!isMax && !isMin) continue;
      let l = lo + h0 * (k - 1), r = lo + h0 * (k + 1);
      const s = isMax ? -1 : 1;   // minimise s*f with a golden-section search
      const gr = 0.6180339887498949;
      let x1 = r - gr * (r - l), x2 = l + gr * (r - l), f1 = s * f(x1), f2 = s * f(x2);
      for (let it = 0; it < 80; it++) {
        if (f1 < f2) { r = x2; x2 = x1; f2 = f1; x1 = r - gr * (r - l); f1 = s * f(x1); }
        else { l = x1; x1 = x2; f1 = f2; x2 = l + gr * (r - l); f2 = s * f(x2); }
      }
      let x = (l + r) / 2;
      const refined = findRoot(xx => derivative(f, xx), x);
      if (Number.isFinite(refined) && refined >= l && refined <= r) x = refined;
      if (Math.abs(x) < 1e-9 * (hi - lo)) x = 0;
      out.push({ x, y: f(x), max: isMax });
    }
    return out;
  }
  function analyse(kind) {
    const live = fs.map((f, i) => (f && G.fns[i].on) ? i : -1).filter(i => i >= 0);
    if (!live.length) return toast(t('g.noFunction'));
    const lo = unX(0), hi = unX(W), x0 = trace ? trace.x : (lo + hi) / 2;
    const near = (arr, key) => arr.reduce((b, v) => (!b || Math.abs(key(v) - x0) < Math.abs(key(b) - x0)) ? v : b, null);
    let m = null;
    if (kind === 'root') {
      const i = trace ? trace.i : live[0], r = near(roots(fs[i], lo, hi), v => v);
      if (r !== null) m = { x: r, y: 0, label: t('g.root') + ' ' + fmtReal(r, { mode: 'norm', sig: 7, comma: S.settings.comma }), i };
    } else if (kind === 'ext') {
      const i = trace ? trace.i : live[0], e = near(extrema(fs[i], lo, hi), v => v.x);
      if (e) m = { x: e.x, y: e.y, label: (e.max ? 'max ' : 'min ') + fmtReal(e.y, { mode: 'norm', sig: 7, comma: S.settings.comma }), i };
    } else {
      if (live.length < 2) return toast(t('g.needTwo'));
      const a = trace && live.includes(trace.i) ? trace.i : live[0], b = live.find(k => k !== a);
      const d = x => fs[a](x) - fs[b](x), r = near(roots(d, lo, hi), v => v);
      if (r !== null) m = { x: r, y: fs[a](r), label: '(' + fmtReal(r, { mode: 'norm', sig: 6, comma: S.settings.comma }) + '; ' + fmtReal(fs[a](r), { mode: 'norm', sig: 6, comma: S.settings.comma }) + ')', i: a };
    }
    if (!m) return toast(t('g.nothingFound'));
    marks = [m]; trace = { x: m.x, i: m.i };
    const o = { mode: 'norm', sig: 8, comma: S.settings.comma };
    readout.hidden = false;
    readout.textContent = 'f' + (m.i + 1) + '   x = ' + fmtReal(m.x, o) + '   y = ' + fmtReal(m.y, o);
    draw();
  }

  // ---------------------------------------------------------------- gestures
  // position inside the canvas from client coordinates (offsetX depends on the event target and on page scaling)
  const at = e => { const r = wrap.getBoundingClientRect(); return [e.clientX - r.left - wrap.clientLeft, e.clientY - r.top - wrap.clientTop]; };
  const ptrs = new Map();
  let downAt = null, moved = false, pinch = null;
  wrap.addEventListener('pointerdown', e => {
    if (e.target.closest('.gtools')) return;
    wrap.setPointerCapture(e.pointerId);
    const [ox, oy] = at(e);
    ptrs.set(e.pointerId, { x: ox, y: oy });
    if (ptrs.size === 1) { downAt = { x: ox, y: oy, t: Date.now() }; moved = false; if (traceMode) setTrace(ox, oy); }
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) }; moved = true; }
  });
  wrap.addEventListener('pointermove', e => {
    const p = ptrs.get(e.pointerId);
    if (!p) return;
    const [nx, ny] = at(e);
    if (ptrs.size === 2 && pinch) {
      ptrs.set(e.pointerId, { x: nx, y: ny });
      const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch.d > 0 && d > 0) zoom(d / pinch.d, (a.x + b.x) / 2, (a.y + b.y) / 2);
      pinch.d = d;
      return;
    }
    if (downAt && !moved && Math.hypot(nx - downAt.x, ny - downAt.y) > 6) moved = true;
    if (traceMode) { setTrace(nx, ny); ptrs.set(e.pointerId, { x: nx, y: ny }); return; }
    if (moved) { G.cx -= (nx - p.x) / G.sx; G.cy += (ny - p.y) / G.sy; draw(); }
    ptrs.set(e.pointerId, { x: nx, y: ny });
  });
  const up = e => {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch = null;
    if (ptrs.size === 0) {
      if (downAt && !moved && !traceMode && Date.now() - downAt.t < 450) setTrace(downAt.x, downAt.y);
      downAt = null; save();
    }
  };
  wrap.addEventListener('pointerup', up);
  wrap.addEventListener('pointercancel', up);
  wrap.addEventListener('wheel', e => { e.preventDefault(); zoom(e.deltaY < 0 ? 1.15 : 1 / 1.15, ...at(e)); }, { passive: false });
  wrap.addEventListener('dblclick', e => zoom(2, ...at(e)));

  // ---------------------------------------------------------------- size
  function resize() {
    const r = wrap.getBoundingClientRect();
    if (!r.width || !r.height) return;
    dpr = window.devicePixelRatio || 1;
    const first = !W;
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    if (G.sx == null || G.sy == null) { G.sx = G.sy = W / 20; }
    else if (first) { /* keep the saved scale */ }
    draw();
  }
  new ResizeObserver(resize).observe(wrap);

  renderRows();
  rebuildAll();

  return {
    onShow() { resize(); },
    refreshAll() { angleBtn.textContent = S.settings.gAngle.toUpperCase(); rebuildAll(); },
  };
}
