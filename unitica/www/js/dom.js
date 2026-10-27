// Small DOM helpers shared by the screens.
import ICONS from './icons.gen.js';

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = s => String(s).replace(/[&<>"']/g, ch => ESC[ch]);

/** inline SVG of a bundled line icon (generated at build time from the icon set, see tools/build_www.mjs) */
export function icon(name, cls = '') {
  const body = ICONS[name];
  if (body === undefined) throw new Error('icon missing: ' + name);
  return `<svg class="i ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

/** numbers and unit symbols keep their left-to-right order inside a right-to-left (Arabic) page: "1 m = 3.28084 ft" */
export const ltr = html => `<bdi dir="ltr">${html}</bdi>`;

/** text to the clipboard: the modern way, else the old textarea way (a WebView may refuse the first) -> true when it worked */
export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* not allowed here: the old way below */ }
  const ta = document.createElement('textarea');
  ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;top:0';
  document.body.appendChild(ta); ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
  ta.remove();
  return ok;
}

/**
 * The ± and E keys sit beside a text field: a tap on them must not take the focus (and the keyboard) away from the field.
 * keypad(root, '.mini[data-act="sign"], ...') holds the focus in place, focusAtEnd() brings it back with the caret at the end of the text;
 * keepCaret(ev) is for the field's focusin handler (tapping a field selects all of it, coming back from a key must not).
 */
export function keypad(root, selector) {
  root.addEventListener('mousedown', ev => { if (ev.target.closest(selector)) ev.preventDefault(); });
}
export function focusAtEnd(input) {
  input.dataset.keep = '1';
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
}
export function keepCaret(ev) {
  if (!ev.target.dataset.keep) return false;
  delete ev.target.dataset.keep;
  return true;
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** delegated clicks: <button data-act="name" data-arg="x"> -> handlers.name(arg, element, event) */
export function onAct(root, handlers) {
  root.addEventListener('click', ev => {
    const el = ev.target.closest('[data-act]');
    if (!el || !root.contains(el)) return;
    const fn = handlers[el.dataset.act];
    if (fn) fn(el.dataset.arg, el, ev);
  });
}
