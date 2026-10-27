// Küçük arayüz yapı taşları: öğe kurucu, alt sayfa (bottom sheet), onay penceresi, kısa bildirim, açılır menü,
// bölümlü seçici, adım düğmeleri, anahtar. Hepsi klavye ve ekran okuyucuyla kullanılabilir.
import { icon } from './icons.js';
import { t } from './i18n.js';

/** h('div', {class, text, onclick, …}, …çocuklar) */
export function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  for (const c of kids.flat()) if (c != null && c !== false) el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return el;
}

export function iconButton(name, label, onclick, cls = '') {
  return h('button', { class: `icon-btn ${cls}`, type: 'button', 'aria-label': label, title: label, onclick }, icon(name, 22));
}

// ---- katmanlar: geri düğmesi en üsttekini kapatır
const layers = [];
export const hasLayer = () => layers.length > 0;
export function closeTopLayer() { const l = layers[layers.length - 1]; if (l) { l.close(); return true; } return false; }

function layer(el, onClose) {
  const root = document.getElementById('layers');
  root.append(el);
  const entry = {
    el,
    close() {
      const i = layers.indexOf(entry);
      if (i < 0) return;
      layers.splice(i, 1);
      el.classList.add('closing');
      setTimeout(() => el.remove(), 180);
      if (onClose) onClose();
    },
  };
  layers.push(entry);
  requestAnimationFrame(() => el.classList.add('open'));
  return entry;
}

/** Alt sayfa: başlık, içerik, kapat düğmesi. Dönen nesnenin close() ile kapanır. */
export function sheet(title, body, { onClose, cls = '' } = {}) {
  let entry;
  const panel = h('div', { class: `sheet ${cls}`, role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
    h('div', { class: 'sheet-grip', 'aria-hidden': 'true' }),
    h('div', { class: 'sheet-head' }, h('h2', { text: title }), iconButton('X', t('cm_close'), () => entry.close())),
    h('div', { class: 'sheet-body' }, body));
  const wrap = h('div', { class: 'scrim' }, panel);
  wrap.addEventListener('click', (e) => { if (e.target === wrap) entry.close(); });
  entry = layer(wrap, onClose);
  setTimeout(() => { const f = panel.querySelector('button:not(.icon-btn), input, [tabindex]'); (f || panel).focus?.(); }, 60);
  return entry;
}

/** Onay penceresi: iki düğme. → Promise<boolean> */
export function confirmDialog(title, text, okLabel, cancelLabel, danger = false) {
  return new Promise((res) => {
    let entry, done = false;
    const end = (v) => { if (done) return; done = true; res(v); entry.close(); };
    const box = h('div', { class: 'dialog', role: 'alertdialog', 'aria-modal': 'true', 'aria-label': title },
      h('h2', { text: title }), h('p', { text }),
      h('div', { class: 'dialog-actions' },
        h('button', { class: 'btn ghost', type: 'button', onclick: () => end(false), text: cancelLabel }),
        h('button', { class: `btn ${danger ? 'danger' : 'primary'}`, type: 'button', onclick: () => end(true), text: okLabel })));
    const wrap = h('div', { class: 'scrim center' }, box);
    wrap.addEventListener('click', (e) => { if (e.target === wrap) end(false); });
    entry = layer(wrap, () => { if (!done) { done = true; res(false); } });
  });
}

/** Açılır menü: öğeler [{label, icon, onclick, hidden}] */
export function menu(anchor, items) {
  let entry;
  const list = h('div', { class: 'menu', role: 'menu' },
    items.filter((i) => !i.hidden).map((i) => h('button', { class: 'menu-item', role: 'menuitem', type: 'button',
      onclick: () => { entry.close(); i.onclick(); } }, i.icon ? icon(i.icon, 20) : null, h('span', { text: i.label }))));
  const wrap = h('div', { class: 'scrim menu-scrim' }, list);
  wrap.addEventListener('click', (e) => { if (e.target === wrap) entry.close(); });
  const r = anchor.getBoundingClientRect();
  list.style.top = `${Math.round(r.bottom + 4)}px`;
  list.style.insetInlineEnd = `${Math.max(8, Math.round(window.innerWidth - r.right))}px`;
  entry = layer(wrap);
  setTimeout(() => list.querySelector('button')?.focus(), 30);
  return entry;
}

let toastTimer = null;
export function toast(text) {
  const el = document.getElementById('toast');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

/** Bölümlü seçici: seçenekler [{value, label, sub?, icon?}] */
export function segmented(options, value, onchange, { cls = '', label = '' } = {}) {
  const wrap = h('div', { class: `seg ${cls}`, role: 'radiogroup', 'aria-label': label });
  const draw = (v) => {
    put(wrap, ...options.map((o) => h('button', {
      class: `seg-btn${o.value === v ? ' on' : ''}`, type: 'button', role: 'radio', 'aria-checked': String(o.value === v),
      onclick: () => { if (o.value !== v) { draw(o.value); onchange(o.value); } },
    }, o.icon ? icon(o.icon, 18) : null, h('span', { class: 'seg-label', text: o.label }), o.sub ? h('small', { text: o.sub }) : null)));
  };
  draw(value);
  wrap.set = draw;
  return wrap;
}

/** Açma/kapama anahtarı satırı */
export function switchRow(label, checked, onchange, sub = '') {
  const input = h('input', { type: 'checkbox', role: 'switch', checked: checked ? true : null });
  input.addEventListener('change', () => onchange(input.checked));
  return h('label', { class: 'row switch-row' }, h('span', { class: 'row-text' }, h('span', { text: label }), sub ? h('small', { text: sub }) : null),
    h('span', { class: 'switch' }, input, h('span', { class: 'switch-track', 'aria-hidden': 'true' })));
}

/** Boş durum kartı */
export function emptyState(iconName, title, hint) {
  return h('div', { class: 'empty' }, h('div', { class: 'empty-ic' }, icon(iconName, 30)), h('p', { class: 'empty-title', text: title }), hint ? h('p', { class: 'muted', text: hint }) : null);
}

/** Uyarı / bilgi kutusu */
export function notice(kind, iconName, title, text) {
  return h('div', { class: `notice ${kind}` }, icon(iconName, 20), h('div', null, title ? h('b', { text: title }) : null, text ? h('p', { text }) : null));
}

/** el.replaceChildren, ama null / false çocuklar atlanır (replaceChildren onları "null" metnine çevirirdi). */
export function put(el, ...kids) {
  el.replaceChildren(...kids.flat().filter((k) => k != null && k !== false));
  return el;
}
