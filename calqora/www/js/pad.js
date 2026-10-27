// The on-screen number pad shared by the matrix cells and the unit field. Fields that use it are readonly-keyboard (inputmode none).
import { h, $, insertAt } from './dom.js';
import { S } from './state.js';

const ROWS = [
  ['7', '8', '9', 'del', 'left'],
  ['4', '5', '6', '-', 'right'],
  ['1', '2', '3', 'dot', 'go'],
  ['0', '/', 'π', '√(', 'E'],
];
let cur = null, goFn = null;

export function mountPad() {
  const el = $('#pad');
  el.replaceChildren(...ROWS.flat().map(k => {
    const label = { del: '⌫', left: '←', right: '→', go: '↵', dot: S.settings.comma ? ',' : '.', '-': '−' }[k] || k;
    return h('button', { class: ['del', 'left', 'right'].includes(k) ? 'fn' : k === 'go' ? 'go' : '', 'data-k': k, text: k === '√(' ? null : label, html: k === '√(' ? '<span class="radk"></span>' : null, 'aria-label': k === '√(' ? 'square root' : null });
  }));
  if (el.dataset.wired) return;   // called again when the decimal separator changes: only the labels are rebuilt
  el.dataset.wired = '1';
  el.addEventListener('mousedown', e => e.preventDefault());
  el.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b || !cur) return;
    const k = b.dataset.k, input = cur;
    if (k === 'del') {
      const a = input.selectionStart, z = input.selectionEnd;
      if (a !== z) { input.setRangeText('', a, z, 'end'); } else if (a > 0) input.setRangeText('', a - 1, a, 'end');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (k === 'left') input.setSelectionRange(Math.max(0, input.selectionStart - 1), Math.max(0, input.selectionStart - 1));
    else if (k === 'right') input.setSelectionRange(input.selectionStart + 1, input.selectionStart + 1);
    else if (k === 'go') { if (goFn) goFn(input); }
    else insertAt(input, k === 'dot' ? (S.settings.comma ? ',' : '.') : k === '-' ? '−' : k);
  });
}

// bind(input, onGo): the pad appears while the input has the focus
export function bindPad(input, onGo) {
  input.setAttribute('inputmode', 'none');
  input.setAttribute('autocomplete', 'off');
  input.addEventListener('focus', () => { cur = input; goFn = onGo || null; $('#pad').hidden = false; });
  input.addEventListener('blur', () => setTimeout(() => {
    const a = document.activeElement;
    if (!a || !a.dataset || a.dataset.pad !== '1') { if (cur === input) { cur = null; $('#pad').hidden = true; } }
  }, 80));
  input.dataset.pad = '1';
}

export function hidePad() {
  cur = null;
  $('#pad').hidden = true;
  if (document.activeElement && document.activeElement.dataset && document.activeElement.dataset.pad) document.activeElement.blur();
}
