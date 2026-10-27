// Matrix tab: three editable matrices A, B, C (up to 5x5; cells accept expressions such as 1/3 or sqrt(2)) and the usual operations.
import { h } from './dom.js';
import { t } from './i18n.js';
import { S, save, ctxOf, fmtOpts } from './state.js';
import { evaluate } from './engine.js';
import { fmtReal, fmtValue, htmlOf } from './format.js';
import { isC } from './complex.js';
import * as M from './matrix.js';
import { bindPad } from './pad.js';
import { toast } from './sheet.js';

const NAMES = ['A', 'B', 'C'];
const MAXN = 5;
// id, label, binary?, parameter?
const OPS = [
  ['add', 'X + Y', true], ['sub', 'X − Y', true], ['mul', 'X × Y', true], ['solve', 'X<sup>−1</sup>·Y', true],
  ['scale', 'k · X', false, 'k'], ['pow', 'X<sup>n</sup>', false, 'n'],
  ['T', 'X<sup>T</sup>'], ['inv', 'X<sup>−1</sup>'], ['det', 'det X'], ['rank', 'rank X'], ['trace', 'tr X'], ['rref', 'rref X'], ['eig', 'λ  eig X'],
];

export function mountMatrix(root) {
  const st = S.matrices = Object.assign({ sel: 'A', x: 'A', y: 'B', k: '2', n: '2' }, S.matrices || {});
  for (const n of NAMES) if (!st[n]) st[n] = { r: 2, c: 2, v: [['1', '0'], ['0', '1']] };
  let result = null, resultMatrix = null;   // resultMatrix: numbers, kept as operand R

  const editor = h('div'), resBox = h('div');
  const scroll = h('div', { class: 'scroll' }, editor, h('div', { class: 'card' }, buildOps()), resBox);
  root.append(scroll);

  function cellsOf(name) {
    const m = st[name];
    while (m.v.length < m.r) m.v.push(Array(m.c).fill('0'));
    m.v.length = m.r;
    m.v.forEach(row => { while (row.length < m.c) row.push('0'); row.length = m.c; });
    return m;
  }
  function numeric(name) {
    const m = cellsOf(name);
    const ctx = ctxOf({ complex: false });
    return m.v.map((row, i) => row.map((s, j) => {
      if (!s.trim()) return 0;
      let v;
      try { v = evaluate(s, ctx); } catch (e) { v = NaN; }
      if (typeof v !== 'number' || !Number.isFinite(v)) throw Object.assign(new Error('cell'), { cell: [i, j], matrix: name });
      return v;
    }));
  }
  function seg(items, cur, on) { return h('div', { class: 'seg' }, items.map(([id, lab]) => h('button', { class: id === cur ? 'on' : '', text: lab, onclick: () => on(id) }))); }

  // ---------------------------------------------------------------- editor
  function renderEditor() {
    const m = cellsOf(st.sel);
    const stepper = (label, key) => h('div', { class: 'row' }, h('span', { class: 'lab', text: label }),
      h('div', { class: 'stepper' },
        h('button', { text: '−', onclick: () => { if (m[key] > 1) { m[key]--; save(); renderEditor(); } } }), h('b', { text: String(m[key]) }),
        h('button', { text: '+', onclick: () => { if (m[key] < MAXN) { m[key]++; save(); renderEditor(); } } })));
    const grid = h('div', { class: 'mgrid', style: `grid-template-columns:repeat(${m.c},1fr)` });
    m.v.forEach((row, i) => row.forEach((val, j) => {
      const input = h('input', { class: 'mcell', type: 'text', value: val, 'aria-label': `${st.sel}[${i + 1},${j + 1}]` });
      input.addEventListener('input', () => { m.v[i][j] = input.value; save(); input.style.borderColor = ''; });
      bindPad(input, () => {
        const next = grid.children[i * m.c + j + 1];
        if (next) next.focus(); else input.blur();
      });
      input.addEventListener('focus', () => setTimeout(() => input.select(), 0));
      grid.append(input);
    }));
    editor.replaceChildren(h('div', { class: 'card' },
      h('div', { class: 'row' }, seg(NAMES.map(n => [n, n]), st.sel, id => { st.sel = id; save(); renderEditor(); }),
        h('div', { class: 'wrap' },
          h('button', { class: 'pill', text: t('m.identity'), onclick: () => { m.v = Array.from({ length: m.r }, (_, i) => Array.from({ length: m.c }, (_, j) => i === j ? '1' : '0')); save(); renderEditor(); } }),
          h('button', { class: 'pill', text: t('m.zero'), onclick: () => { m.v = Array.from({ length: m.r }, () => Array(m.c).fill('0')); save(); renderEditor(); } }))),
      h('div', { class: 'row' }, stepper(t('m.rows'), 'r'), stepper(t('m.cols'), 'c')),
      grid));
  }

  // ---------------------------------------------------------------- operations
  function buildOps() {
    const wrap = h('div');
    const opRow = h('div', { class: 'wrap' });
    const render = () => {
      const params = h('div', { class: 'row' });
      const field = (key, ph) => { const f = h('input', { class: 'field', style: 'width:96px;height:38px;font-size:16px', value: st[key], placeholder: ph, 'aria-label': ph }); f.addEventListener('input', () => { st[key] = f.value; save(); }); bindPad(f, () => f.blur()); return f; };
      wrap.replaceChildren(
        h('div', { class: 'row' }, h('span', { class: 'lab', text: 'X' }), seg([...NAMES, 'R'].map(n => [n, n]), st.x, id => { st.x = id; save(); render(); })),
        h('div', { class: 'row' }, h('span', { class: 'lab', text: 'Y' }), seg([...NAMES, 'R'].map(n => [n, n]), st.y, id => { st.y = id; save(); render(); })),
        h('div', { class: 'row' }, h('span', { class: 'lab', text: 'k' }), field('k', 'k'), h('span', { class: 'lab', text: 'n' }), field('n', 'n')),
        h('div', { class: 'sec', text: t('m.operations') }),
        h('div', { class: 'wrap' }, OPS.map(([id, label]) => h('button', { class: 'pill mono', onclick: () => compute(id) }, h('span', { html: label })))));
    };
    render();
    return wrap;
  }

  function operand(name) {
    if (name === 'R') { if (!resultMatrix) throw Object.assign(new Error('noresult'), { code: 'noresult' }); return resultMatrix; }
    return numeric(name);
  }

  function compute(id) {
    try {
      const X = operand(st.x);
      const need = id => ['add', 'sub', 'mul', 'solve'].includes(id);
      const Y = need(id) ? operand(st.y) : null;
      const param = key => { const v = evaluate(String(st[key] || ''), ctxOf({ complex: false })); if (typeof v !== 'number') throw Object.assign(new Error('param'), { code: 'param' }); return v; };
      let out = null;
      switch (id) {
        case 'add': out = { m: M.add(X, Y) }; break;
        case 'sub': out = { m: M.sub(X, Y) }; break;
        case 'mul': out = { m: M.mul(X, Y) }; break;
        case 'solve': out = { m: M.solve(X, Y) }; break;
        case 'scale': out = { m: M.scale(X, param('k')) }; break;
        case 'pow': out = { m: M.power(X, param('n')) }; break;
        case 'T': out = { m: M.transpose(X) }; break;
        case 'inv': out = { m: M.inverse(X) }; break;
        case 'rref': out = { m: M.rref(X).M }; break;
        case 'det': out = { s: M.det(X), label: 'det' }; break;
        case 'rank': out = { s: M.rank(X), label: 'rank' }; break;
        case 'trace': out = { s: M.trace(X), label: 'tr' }; break;
        case 'eig': {
          const vals = M.eigenvalues(X);
          out = { eig: vals.map(v => ({ v, vec: typeof v === 'number' ? M.eigenvector(X, v) : null })) };
          break;
        }
      }
      resultMatrix = out.m || null;
      result = { out, error: null };
    } catch (e) {
      result = { out: null, error: errorText(e) };
    }
    renderResult();
  }

  function errorText(e) {
    if (e.cell) return t('m.badCell', e.matrix, e.cell[0] + 1, e.cell[1] + 1);
    if (e.code === 'noresult') return t('m.noResult');
    if (e.code === 'param') return t('m.badParam');
    if (e instanceof M.MatrixError) return t('m.err.' + e.code);
    return t('err.math');
  }

  const cellText = v => fmtReal(v, { mode: 'norm', sig: 7, comma: S.settings.comma });
  function matrixGrid(m) {
    return h('div', { class: 'mout', style: `grid-template-columns:repeat(${m[0].length},1fr)` }, m.flat().map(v => h('div', { text: cellText(v) })));
  }

  function renderResult() {
    if (!result) { resBox.replaceChildren(); return; }
    const o = fmtOpts(true);
    let content;
    if (result.error) content = h('div', { class: 'merr', text: result.error });
    else if (result.out.m) {
      content = h('div', null, matrixGrid(result.out.m),
        h('div', { class: 'wrap', style: 'margin-top:10px' }, NAMES.map(n => h('button', { class: 'pill', text: '→ ' + n, onclick: () => storeAs(n) }))));
    } else if (result.out.s !== undefined) {
      content = h('div', { class: 'mscalar', html: result.out.label + ' = ' + htmlOf(fmtReal(result.out.s, Object.assign({}, o, { pretty: true }))) });
    } else {
      content = h('div', null, result.out.eig.map((e, i) => h('div', { class: 'eigrow' },
        h('span', { html: 'λ<sub>' + (i + 1) + '</sub> = ' + htmlOf(fmtValue(e.v, o)) }),
        h('span', { text: e.vec ? 'v = (' + e.vec.map(cellText).join('; ') + ')' : '' }))));
    }
    resBox.replaceChildren(h('div', { class: 'card' }, h('div', { class: 'sec', text: t('m.result') }), content));
    resBox.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function storeAs(name) {
    const m = resultMatrix;
    if (!m) return;
    st[name] = { r: m.length, c: m[0].length, v: m.map(row => row.map(v => fmtReal(v, { mode: 'norm', comma: S.settings.comma }))) };
    st.sel = name; save(); renderEditor(); toast(t('m.stored', name));
  }

  renderEditor();
  return { onShow() { }, refreshAll() { renderEditor(); renderResult(); } };
}
