// Bottom sheets, toast and the stack that the Android back button closes.
import { h, icon, $ } from './dom.js';

const stack = [];

export function openSheet({ title, body, onClose, actions }) {
  const layer = $('#layer');
  const scrim = h('div', { class: 'scrim' });
  const sheet = h('div', { class: 'sheet', role: 'dialog', 'aria-label': title || '' },
    h('div', { class: 'grab' }),
    h('h2', null, h('span', { text: title || '' }), actions || null, h('button', { class: 'ibtn', 'aria-label': 'close', onclick: () => handle.close() }, icon('close'))),
    h('div', { class: 'body' }, body));
  layer.append(scrim, sheet);
  requestAnimationFrame(() => { scrim.classList.add('on'); sheet.classList.add('on'); });
  const handle = {
    sheet,
    close() {
      const i = stack.indexOf(handle);
      if (i < 0) return;
      stack.splice(i, 1);
      scrim.classList.remove('on'); sheet.classList.remove('on');
      setTimeout(() => { scrim.remove(); sheet.remove(); }, 220);
      if (onClose) onClose();
    },
  };
  scrim.addEventListener('click', () => handle.close());
  stack.push(handle);
  return handle;
}

// true when something was closed
export function closeTop() {
  if (!stack.length) return false;
  stack[stack.length - 1].close();
  return true;
}
export const sheetOpen = () => stack.length > 0;

let toastTimer = 0;
export function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('on'), 1900);
}
