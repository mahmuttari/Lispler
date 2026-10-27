// Tiny DOM helpers.
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

const ICONS = {
  history: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
  settings: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  calc: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8.5 7.5h7M8.5 12h1.5M14 12h1.5M8.5 16h1.5M14 16h1.5"/>',
  graph: '<path d="M4 4v16h16"/><path d="M7 15c3-10 6-10 8-4s3 4 5 0"/>',
  matrix: '<path d="M8 4H5v16h3M16 4h3v16h-3"/><path d="M10 9h.01M14 9h.01M10 15h.01M14 15h.01"/>',
  units: '<path d="M4 8h13M14 4l4 4-4 4M20 16H7M10 12l-4 4 4 4"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>',
  swap: '<path d="M8 20V5M8 5L4.5 8.5M8 5l3.5 3.5M16 4v15M16 19l-3.5-3.5M16 19l3.5-3.5"/>',
  target: '<circle cx="12" cy="12" r="3"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/>',
  fit: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  hand: '<path d="M8 12V6.5a1.5 1.5 0 0 1 3 0V11M11 10V5a1.5 1.5 0 0 1 3 0v5M14 10V6.5a1.5 1.5 0 0 1 3 0V13c0 4-2 7-6 7-3 0-4-1.5-6-4.5L4 14c-.8-1.2.7-2.4 1.7-1.4L8 15"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  chevron: '<path d="M9 5l7 7-7 7"/>',
  noads: '<rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M7.5 15l2-6 2 6M8.2 13h2.6M14 9v6M14 9h1.6a1.6 1.6 0 0 1 0 3.2H14"/><path d="M4 3.5l16 17"/>',
};
export function icon(name) {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('class', 'i');
  s.setAttribute('aria-hidden', 'true');
  s.innerHTML = ICONS[name] || '';
  return s;
}

export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* fall back below */ }
  try {
    const ta = h('textarea', { style: 'position:fixed;opacity:0;left:-1000px' });
    ta.value = text; document.body.append(ta); ta.select();
    const ok = document.execCommand('copy'); ta.remove(); return ok;
  } catch (e) { return false; }
}

// Insert text at the caret of an input / textarea and tell the page it changed.
export function insertAt(el, text, caretBack = 0) {
  const a = el.selectionStart ?? el.value.length, b = el.selectionEnd ?? a;
  el.value = el.value.slice(0, a) + text + el.value.slice(b);
  const pos = a + text.length - caretBack;
  el.setSelectionRange(pos, pos);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}
