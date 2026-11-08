// Tiny DOM helpers.
import { ICONS } from './icons.js';

export const $ = (sel, root = document) => root.querySelector(sel);

export function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'style') el.style.cssText = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(Infinity)) if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(c));
  return el;
}

// the icon names are lucide's (icons.js); two extras of our own below
const EXTRA = {
  close: ICONS.x,
  noads: ICONS['megaphone-off'],
  back: ICONS['chevron-left'],
  chevron: ICONS['chevron-right'],
  // a mosque: dome with its finial, the door, a minaret on the right (drawn like the lucide icons: 24 x 24, stroke)
  // a prayer room: a small house with its door
  room: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10.5h13V10"/><path d="M10.2 20.5v-4.7a1.8 1.8 0 0 1 3.6 0v4.7"/>',
  mosque: '<path d="M2.5 21h19"/><path d="M5 21v-6.5a5.5 5.5 0 0 1 11 0V21"/><path d="M8.8 21v-3.4a2.2 2.2 0 0 1 4.4 0V21"/><path d="M10.5 9V6.6"/><path d="M9.6 5.4a1.1 1.1 0 0 0 1.8 0"/><path d="M18 21V11.5l1.4-2.4 1.4 2.4V21"/><path d="M19.4 9.1V7.4"/>',
};
export function icon(name, cls = '') {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('class', 'i' + (cls ? ' ' + cls : ''));
  s.setAttribute('aria-hidden', 'true');
  s.innerHTML = EXTRA[name] || ICONS[name] || '';
  return s;
}

/** the svg element for markup written as a string */
export function svgEl(markup) {
  const t = document.createElement('template');
  t.innerHTML = markup.trim();
  return t.content.firstElementChild;
}
