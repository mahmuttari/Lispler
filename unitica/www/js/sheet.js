// The bottom sheet (unit picker) and the toast (short notices with an optional undo).
import { icon, esc, $ } from './dom.js';
import { t } from './i18n.js';

let open = null;   // { close }
let hideTimer = 0; // the end of a closing animation: cleared when a new sheet opens in the meantime (it used to wipe the new sheet)

/** is a sheet open (the back button closes it first) */
export const sheetOpen = () => !!open;
export const closeSheet = () => { if (open) open.close(); };

/**
 * openSheet({ title, html, onMount(panel, close) })
 * Closes on the scrim, the close button, Escape and the back button; focus returns to the element that opened it.
 */
export function openSheet({ title, html, onMount, onClose }) {
  closeSheet();
  clearTimeout(hideTimer);
  const opener = document.activeElement;
  const root = $('#sheet-root');
  root.innerHTML = `<div class="scrim" data-sheet="close"></div>
    <div class="sheet-panel" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="sheet-grip"></div>
      <div class="sheet-head"><h2>${esc(title)}</h2><button class="icon-btn" data-sheet="close" aria-label="${esc(t('sheet.close'))}">${icon('x')}</button></div>
      <div class="sheet-body">${html}</div>
    </div>`;
  root.hidden = false;
  const panel = $('.sheet-panel', root);
  requestAnimationFrame(() => root.classList.add('show'));
  const onKey = ev => { if (ev.key === 'Escape') close(); };
  const close = () => {
    if (!open) return;
    open = null;
    document.removeEventListener('keydown', onKey);
    root.classList.remove('show');
    hideTimer = setTimeout(() => { root.hidden = true; root.innerHTML = ''; }, 200);
    if (onClose) onClose();
    if (opener && opener.focus && document.contains(opener)) opener.focus({ preventScroll: true });
  };
  open = { close };
  root.onclick = ev => { if (ev.target.closest('[data-sheet="close"]')) close(); };
  document.addEventListener('keydown', onKey);
  if (onMount) onMount(panel, close);
  return close;
}

let toastTimer = 0;
/** toast(text, { actionText, onAction }) - one at a time, 4 s */
export function toast(text, opts = {}) {
  const el = $('#toast');
  clearTimeout(toastTimer);
  el.innerHTML = `<span>${esc(text)}</span>${opts.onAction ? `<button type="button">${esc(opts.actionText || t('undo'))}</button>` : ''}`;
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('show'));
  const hide = () => { el.classList.remove('show'); toastTimer = setTimeout(() => { el.hidden = true; }, 200); };
  const btn = $('button', el);
  if (btn) btn.onclick = () => { hide(); opts.onAction(); };
  toastTimer = setTimeout(hide, 4000);
}
