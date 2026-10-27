// Calculator tab: expression field + keypad (with a 2nd layer), live preview, memory / variables, history and the function sheet.
import { h, icon, copyText } from './dom.js';
import { t } from './i18n.js';
import { S, save, ctxOf, fmtOpts } from './state.js';
import { evaluate, CalcError, NAMES } from './engine.js';
import { fmtValue, fmtFraction, fmtDMS, htmlOf } from './format.js';
import { isC } from './complex.js';
import { openSheet, toast } from './sheet.js';
import { attachRadicals, exprHTML } from './radical.js';

// [label, 2nd label, text, 2nd text, class]   label HTML is trusted (static)
const KEYS = [
  ['2nd', null, 'shift', null, 'sci shift'], ['sin', 'sin<sup>−1</sup>', 'sin(', 'asin(', 'sci'], ['cos', 'cos<sup>−1</sup>', 'cos(', 'acos(', 'sci'], ['tan', 'tan<sup>−1</sup>', 'tan(', 'atan(', 'sci'], ['f(x)', null, 'sheet', null, 'sci'],
  ['x<sup>2</sup>', 'x<sup>3</sup>', '²', '³', 'sci'], ['x<sup>y</sup>', '<span class="radk cy"></span>', '^', 'root(', 'sci'], ['<span class="radk"></span>', '<span class="radk c3"></span>', '√(', '∛(', 'sci'], ['log', '10<sup>x</sup>', 'log(', '10^', 'sci'], ['ln', 'e<sup>x</sup>', 'ln(', 'e^', 'sci'],
  ['(', ',', '(', 'sep', 'sci'], [')', 'i', ')', 'i', 'sci'], ['π', 'e', 'π', 'e', 'sci'], ['n!', 'nCr', '!', 'nCr(', 'sci'], ['x<sup>−1</sup>', '|x|', '^(-1)', 'abs(', 'sci'],
  ['STO', null, 'sto', null, 'sci'], ['RCL', null, 'rcl', null, 'sci'], ['M+', 'M−', 'm+', 'm-', 'sci'], ['MR', 'MC', 'mr', 'mc', 'sci'], ['%', 'mod', '%', ' mod ', 'sci'],
  ['7', null, '7', null, 'num'], ['8', null, '8', null, 'num'], ['9', null, '9', null, 'num'], ['⌫', null, 'del', null, 'ac'], ['AC', null, 'ac', null, 'ac'],
  ['4', null, '4', null, 'num'], ['5', null, '5', null, 'num'], ['6', null, '6', null, 'num'], ['×', null, '×', null, 'op'], ['÷', null, '÷', null, 'op'],
  ['1', null, '1', null, 'num'], ['2', null, '2', null, 'num'], ['3', null, '3', null, 'num'], ['+', null, '+', null, 'op'], ['−', null, '−', null, 'op'],
  ['0', null, '0', null, 'num'], ['.', null, 'dot', null, 'num'], ['×10<sup>x</sup>', null, 'E', null, 'num sci'], ['Ans', null, 'ans', null, 'num sci'], ['=', null, 'eq', null, 'eq'],
];
const POSTFIX = new Set(['²', '³', '!', '%', '+', '−', '×', '÷', ' mod ']);   // text that continues the previous answer; anything starting with ^ does too

const FSHEET = [
  ['f.trig', ['sinh(', 'cosh(', 'tanh(', 'asinh(', 'acosh(', 'atanh(', 'sec(', 'csc(', 'cot(', 'atan2(', 'deg(', 'rad(']],
  ['f.logexp', ['log2(', 'log(', 'exp(', 'cbrt(', 'root(', 'pow(']],
  ['f.round', ['abs(', 'sign(', 'floor(', 'ceil(', 'round(', 'trunc(', 'frac(']],
  ['f.number', ['nPr(', 'nCr(', 'fact(', 'gamma(', 'gcd(', 'lcm(', 'mod(', 'max(', 'min(', 'hypot(', 'rand()', 'randint(']],
  ['f.complex', ['i', 're(', 'im(', 'conj(', 'arg(', 'abs(']],
  ['f.calculus', ['sum(', 'prod(', 'int(', 'diff(', 'solve('], 'f.calculusHint'],
  ['f.symbols', ['SEP', 'E', '°', '!', '%', 'ans', '10^', 'e^']],
];
const VARS = ['a', 'b', 'c', 'd', 'x', 'y', 'm'];

export function mountCalc(root) {
  let shifted = false, fresh = false, mode = 'dec', shown = null;   // shown: the value in the big result line (null = nothing / error)

  const ta = h('textarea', { class: 'expr', rows: 3, inputmode: 'none', autocomplete: 'off', autocorrect: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'expression' });
  const chips = h('div', { class: 'chips' });
  const big = h('div', { class: 'big' });
  const acts = h('div', { class: 'acts' });
  const keysEl = h('div', { class: 'keys' });
  root.append(
    h('div', { class: 'left' }, h('div', { class: 'display' }, chips, ta, h('div', { class: 'res' }, big), acts)),
    keysEl);

  const ov = attachRadicals(ta, 'area');

  // ---------------------------------------------------------------- text editing
  const sep = () => S.settings.comma ? ';' : ',';
  const isOperatorText = x => POSTFIX.has(x) || x.startsWith('^');

  function put(text, back = 0) {
    if (fresh) {
      fresh = false;
      ta.value = isOperatorText(text) ? 'ans' : '';
      ta.setSelectionRange(ta.value.length, ta.value.length);
    }
    const a = ta.selectionStart ?? ta.value.length, b = ta.selectionEnd ?? a;
    ta.value = ta.value.slice(0, a) + text + ta.value.slice(b);
    const pos = a + text.length - back;
    ta.setSelectionRange(pos, pos);
    if (pos >= ta.value.length - 1) ta.scrollTop = ta.scrollHeight;
    refresh();
  }
  function del() {
    fresh = false;
    let a = ta.selectionStart ?? 0; const b = ta.selectionEnd ?? a;
    if (a === b) {
      if (a === 0) return;
      const low = ta.value.slice(0, a).toLowerCase();
      let cut = 1;
      if (low.endsWith('⁻¹')) cut = 2;
      else for (const n of NAMES) {   // sin( goes in one tap, so does ans or pi (NAMES is longest first)
        if (n.length < 2) continue;
        if (low.endsWith(n + '(')) { cut = n.length + 1; break; }
        if (low.endsWith(n)) { cut = n.length; break; }
      }
      a -= cut;
    }
    ta.value = ta.value.slice(0, a) + ta.value.slice(b);
    ta.setSelectionRange(a, a);
    refresh();
  }
  function clearAll() {
    fresh = false; ta.value = ''; ta.setSelectionRange(0, 0); mode = 'dec';
    refresh();
  }

  // ---------------------------------------------------------------- evaluation
  const errText = e => e instanceof CalcError ? t('err.' + e.code, e.detail) : t('err.math');
  const plainOf = v => fmtValue(v, { mode: 'norm', comma: S.settings.comma, pretty: false });

  function currentValue() {
    const v = ta.value.trim() ? evaluate(ta.value, ctxOf()) : S.ans;
    return v === null ? S.ans : v;
  }

  function showValue(v, final) {
    shown = v;
    big.className = 'big' + (final ? '' : ' prev');
    let text;
    if (!isC(v) && mode === 'frac') text = fmtFraction(v, false);
    else if (!isC(v) && mode === 'mixed') text = fmtFraction(v, true);
    else if (!isC(v) && mode === 'dms') text = fmtDMS(v, S.settings.comma);
    if (text == null) { text = fmtValue(v, fmtOpts(true)); if (mode !== 'dec' && final) mode = 'dec'; }
    big.innerHTML = htmlOf(text);
    fit(big);
    renderActs(final);
  }
  function showError(e) { shown = null; big.className = 'big err'; big.textContent = errText(e); big.style.fontSize = ''; renderActs(false); }
  function showNothing() { shown = null; big.className = 'big'; big.textContent = ''; renderActs(false); }

  function refresh() {
    S.expr = ta.value; save();
    ov.update();
    if (!ta.value.trim()) { mode = 'dec'; showNothing(); return; }
    try {
      const v = evaluate(ta.value, ctxOf());
      if (v === null) showNothing(); else showValue(v, false);
    } catch (e) { showNothing(); }
  }

  function equals() {
    fresh = false;
    if (!ta.value.trim()) return;
    try {
      const v = evaluate(ta.value, ctxOf());
      if (v === null) return;
      mode = 'dec';
      S.ans = v;
      S.history.unshift({ e: ta.value, t: fmtValue(v, fmtOpts(true)), p: plainOf(v) });
      if (S.history.length > 100) S.history.length = 100;
      save();
      showValue(v, true);
      fresh = true;
      ta.setSelectionRange(ta.value.length, ta.value.length);
    } catch (e) { showError(e); }
  }

  // shrink the text until it fits the line
  function fit(el) {
    el.style.fontSize = '';
    requestAnimationFrame(() => {
      let size = parseFloat(getComputedStyle(el).fontSize);
      while (el.scrollWidth > el.clientWidth + 1 && size > 15) { size -= 2; el.style.fontSize = size + 'px'; }
    });
  }

  function renderActs(final) {
    acts.replaceChildren();
    if (shown === null) return;
    const v = shown, real = !isC(v);
    if (final && real) {
      const f = fmtFraction(v, false);
      if (f) {
        acts.append(h('button', { class: 'chip btn' + (mode === 'frac' || mode === 'mixed' ? ' on' : ''), text: 'a/b', onclick: () => { mode = mode === 'dec' ? 'frac' : (mode === 'frac' && Math.abs(v) > 1 ? 'mixed' : 'dec'); showValue(v, true); } }));
      }
      if (Math.abs(v) < 1e7) acts.append(h('button', { class: 'chip btn' + (mode === 'dms' ? ' on' : ''), text: '° ′ ″', onclick: () => { mode = mode === 'dms' ? 'dec' : 'dms'; showValue(v, true); } }));
    }
    if (!real) acts.append(h('button', { class: 'chip btn' + (S.settings.polar ? ' on' : ''), text: S.settings.polar ? 'r∠θ' : 'a+bi', onclick: () => { S.settings.polar = !S.settings.polar; save(); showValue(v, final); } }));
    if (final) acts.append(h('button', { class: 'chip btn', 'aria-label': t('copy'), onclick: async () => { toast((await copyText(plainOf(v))) ? t('copied') : t('copyFail')); } }, icon('copy')));
  }

  // ---------------------------------------------------------------- mode chips
  const ANGLES = ['deg', 'rad', 'grad'], FMTS = ['norm', 'fix', 'sci', 'eng'];
  function renderChips() {
    const s = S.settings;
    chips.replaceChildren(
      h('button', { class: 'chip btn on', text: s.angle.toUpperCase(), onclick: () => { s.angle = ANGLES[(ANGLES.indexOf(s.angle) + 1) % 3]; save(); renderChips(); refresh(); } }),
      h('button', { class: 'chip btn' + (s.complex ? ' on' : ''), text: 'ℂ', 'aria-label': t('complexMode'), onclick: () => { s.complex = !s.complex; save(); renderChips(); refresh(); toast(t(s.complex ? 'complexOn' : 'complexOff')); } }),
      h('button', { class: 'chip btn', text: s.fmt === 'norm' ? 'NORM' : s.fmt.toUpperCase() + ' ' + s.digits, onclick: () => { s.fmt = FMTS[(FMTS.indexOf(s.fmt) + 1) % 4]; save(); renderChips(); if (shown !== null) showValue(shown, big.className === 'big'); } }),
      ...(S.vars.m !== 0 ? [h('span', { class: 'chip on', text: 'M' })] : []));
  }

  // ---------------------------------------------------------------- keypad
  const keyEls = [];
  KEYS.forEach(([l, a0, tx, atx, cls]) => {
    // the decimal key and the 2nd-layer argument separator show what they type: with the decimal comma "," and ";"
    // (1.0.0 always showed "." and "," even when it typed "," and ";")
    if (tx === 'dot') l = S.settings.comma ? ',' : '.';
    const a = atx === 'sep' ? sep() : a0;
    const lbl = h('span', { class: 'lbl', html: l });
    const aria = { shift: 'k.shift', del: 'k.del', ac: 'k.ac', eq: 'k.eq', dot: 'k.dot' }[tx];   // the other keys are read from their own label
    const key = h('button', { class: 'key ' + cls, 'data-k': tx, 'aria-label': aria ? t(aria) : null }, lbl, a ? h('span', { class: 'alt', html: a }) : null);
    const n = keysEl.children.length;   // landscape: scientific block on the left (columns 1-5), number block on the right (6-10)
    key.style.setProperty('--lr', Math.floor((n % 20) / 5) + 1);
    key.style.setProperty('--lc', (n % 5) + 1 + (n >= 20 ? 5 : 0));
    keysEl.append(key);
    keyEls.push({ key, lbl, l, a, tx, atx });
  });
  keysEl.addEventListener('mousedown', e => e.preventDefault());   // keep the caret in the field

  function setShift(on) {
    shifted = on;
    keysEl.classList.toggle('shifted', on);
    keyEls.forEach(k => { if (k.a) k.lbl.innerHTML = on ? k.a : k.l; if (k.tx === 'shift') k.key.classList.toggle('on', on); });
  }

  function press(k) {
    const text = shifted && k.atx ? k.atx : k.tx;
    const wasShift = shifted;
    if (text === 'shift') { setShift(!shifted); return; }
    if (wasShift) setShift(false);
    switch (text) {
      case 'sheet': return openFunctions();
      case 'sto': return openVars('sto');
      case 'rcl': return openVars('rcl');
      case 'm+': case 'm-': return memAdd(text === 'm+' ? 1 : -1);
      case 'mr': return put('M');
      case 'mc': S.vars.m = 0; save(); renderChips(); return toast(t('memCleared'));
      case 'del': return del();
      case 'ac': return clearAll();
      case 'eq': return equals();
      case 'dot': return put(S.settings.comma ? ',' : '.');
      case 'sep': return put(sep());
    }
    put(text);
  }
  keysEl.addEventListener('click', e => {
    const key = e.target.closest('.key');
    if (!key) return;
    if (key.dataset.repeated) { delete key.dataset.repeated; return; }
    press(keyEls[[...keysEl.children].indexOf(key)]);
  });
  // holding the delete key repeats it
  let holdTimer = 0, holdRun = 0;
  keysEl.addEventListener('pointerdown', e => {
    const key = e.target.closest('.key');
    if (!key || key.dataset.k !== 'del') return;
    holdTimer = setTimeout(() => {
      key.dataset.repeated = '1';
      holdRun = setInterval(del, 75);
    }, 380);
  });
  const stopHold = () => { clearTimeout(holdTimer); clearInterval(holdRun); };
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => keysEl.addEventListener(ev, stopHold));

  // ---------------------------------------------------------------- memory and variables
  function memAdd(sign) {
    try {
      const v = currentValue();
      if (isC(v)) return toast(t('err.math'));
      S.vars.m = S.vars.m + sign * v; save(); renderChips();
      toast('M = ' + fmtValue(S.vars.m, fmtOpts(false)));
    } catch (e) { toast(errText(e)); }
  }
  function openVars(kind) {
    let handle;
    const grid = h('div', { class: 'vargrid' }, VARS.map(n => h('button', { class: 'varbtn', onclick: () => {
      if (kind === 'sto') {
        try { S.vars[n] = currentValue(); save(); renderChips(); toast(n.toUpperCase() + ' = ' + fmtValue(S.vars[n], fmtOpts(false))); } catch (e) { toast(errText(e)); }
      } else put(n.toUpperCase());
      handle.close();
    } }, h('b', { text: n.toUpperCase() }), h('small', { text: fmtValue(S.vars[n], fmtOpts(false)) }))));
    handle = openSheet({ title: t(kind === 'sto' ? 'storeIn' : 'recall'), body: grid });
  }

  // ---------------------------------------------------------------- function sheet
  function openFunctions() {
    let handle;
    const body = [];
    for (const [key, items, hint] of FSHEET) {
      body.push(h('div', { class: 'sec', text: t(key) }));
      if (hint) body.push(h('div', { class: 'row' }, h('span', { class: 'sub', text: t(hint) })));
      body.push(h('div', { class: 'wrap' }, items.map(it => {
        const text = it === 'SEP' ? sep() : it;
        return h('button', { class: 'pill mono', text, onclick: () => { put(text); handle.close(); } });
      })));
    }
    handle = openSheet({ title: t('functions'), body });
  }

  // ---------------------------------------------------------------- history
  function openHistory() {
    let handle;
    const list = h('div');
    const render = () => {
      list.replaceChildren();
      if (!S.history.length) { list.append(h('div', { class: 'empty', text: t('historyEmpty') })); return; }
      S.history.forEach(item => list.append(h('div', { class: 'hist' },
        h('button', { class: 'e', style: 'text-align:left', html: exprHTML(item.e), onclick: () => { fresh = false; ta.value = item.e; ta.setSelectionRange(item.e.length, item.e.length); refresh(); handle.close(); } }),
        h('button', { class: 'r', html: '= ' + htmlOf(item.t), onclick: () => { put(item.p); handle.close(); } }))));
    };
    render();
    const clear = h('button', { class: 'ibtn', 'aria-label': t('clearHistory'), onclick: () => { S.history = []; save(); render(); } }, icon('trash'));
    handle = openSheet({ title: t('history'), body: list, actions: clear });
  }

  // ---------------------------------------------------------------- field events
  ta.addEventListener('input', () => { fresh = false; mode = 'dec'; refresh(); });
  ta.addEventListener('pointerdown', () => { fresh = false; });
  ta.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); equals(); } });

  ta.value = S.expr || '';
  renderChips();
  refresh();

  return {
    openHistory,
    insert: text => { put(text); },
    refreshAll() { renderChips(); refresh(); },
    onShow() { ta.focus({ preventScroll: true }); },
  };
}
