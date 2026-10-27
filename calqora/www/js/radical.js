// Draws the expression the way it is written on paper: every root sign (√ and ∛) gets its long top bar over the whole radicand, nested roots stack their bars.
//
// The text itself is not changed (it stays a plain string in the field the user types into). A transparent copy of it is drawn underneath the field with the
// radicals added as spans: the bar is a background line on the radicand's span, the sign is a mask on the span of the √ character. Every character keeps exactly
// its own cell, so the copy lines up with the real text, the caret and the selection.

const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const isDigit = c => c >= '0' && c <= '9';
const isLetter = c => /[A-Za-zͰ-Ͽ]/.test(c);
const isRoot = c => c === '√' || c === '∛';

// index of the ")" that closes the "(" at i, or -1 when it is not closed
export function matchParen(t, i) {
  let d = 0;
  for (let k = i; k < t.length; k++) {
    if (t[k] === '(') d++;
    else if (t[k] === ')' && --d === 0) return k;
  }
  return -1;
}

// End (exclusive) of the radicand that starts at a: what the parser takes as the argument of the root sign - one factor with its postfix operators and its power.
export function radicandEnd(t, a) {
  const n = t.length;
  let i = a;
  while (t[i] === ' ') i++;
  if (t[i] === '-' || t[i] === '−' || t[i] === '+') i++;
  if (i >= n) return n;
  if (t[i] === '(') { const m = matchParen(t, i); i = m < 0 ? n : m + 1; }
  else if (isDigit(t[i]) || t[i] === '.' || t[i] === ',') {
    while (i < n && (isDigit(t[i]) || t[i] === '.' || t[i] === ',')) i++;
    if ((t[i] === 'E' || t[i] === 'ᴇ') && /^[+\-−]?\d/.test(t.slice(i + 1))) { i++; if (!isDigit(t[i])) i++; while (isDigit(t[i])) i++; }
  } else if (isLetter(t[i])) {
    while (i < n && (isLetter(t[i]) || isDigit(t[i]))) i++;
    if (t[i] === '(') { const m = matchParen(t, i); i = m < 0 ? n : m + 1; }
  } else if (isRoot(t[i])) i = radicandEnd(t, i + 1);
  else return a;   // nothing the root could apply to yet: the sign is drawn alone
  for (;;) {   // ! ² ³ ⁻¹ % ° and a power: they belong to the radicand
    if (i < n && '²³!%°'.includes(t[i])) i++;
    else if (t.startsWith('⁻¹', i)) i += 2;
    else if (t[i] === '^') i = radicandEnd(t, i + 1);
    else break;
  }
  return i;
}

// HTML for the text: plain characters, and for every root sign <span class="rs"> followed by <span class="rr"> around the radicand.
// --lv is how many roots are nested inside (0 = innermost): the outer bar sits higher so that the bars do not run into each other.
export function exprHTML(t) {
  const ends = new Map();
  for (let i = 0; i < t.length; i++) if (isRoot(t[i])) ends.set(i, radicandEnd(t, i + 1));
  const level = (i, hi) => {
    let lv = 0;
    for (let j = i + 1; j < Math.min(ends.get(i), hi); j++) if (ends.has(j)) lv = Math.max(lv, 1 + level(j, Math.min(ends.get(i), hi)));
    return lv;
  };
  const render = (lo, hi) => {
    let out = '';
    for (let i = lo; i < hi;) {
      if (!ends.has(i)) { out += esc(t[i]); i++; continue; }
      const b = Math.min(ends.get(i), hi), lv = level(i, hi);
      const closed = t[i + 1] === '(' && matchParen(t, i + 1) === b - 1 && b - 1 > i + 1;
      out += `<span class="rs${t[i] === '∛' ? ' c3' : ''}" style="--lv:${lv}">${esc(t[i])}</span>`
        + `<span class="rr" style="--lv:${lv}">`
        + (closed ? `<span class="rp">(</span>${render(i + 2, b - 1)}<span class="rp">)</span>` : render(i + 1, b))
        + '</span>';
      i = Math.max(b, i + 1);
    }
    return out;
  };
  return render(0, t.length);
}

// Puts the drawn copy under a text field. The field's own text turns transparent (the caret, the selection and the typing stay the real thing).
// mode 'area': a wrapping <textarea>; mode 'line': a one-line <input> that scrolls sideways.
export function attachRadicals(field, mode = 'area') {
  const wrap = document.createElement('div');
  wrap.className = 'rwrap ' + mode;
  field.parentNode.insertBefore(wrap, field);
  const view = document.createElement('div'), inner = document.createElement('div');
  view.className = 'rview'; view.setAttribute('aria-hidden', 'true');
  inner.className = 'rinner';
  view.append(inner);
  wrap.append(view, field);
  field.classList.add('rfield');
  const update = () => {
    inner.innerHTML = exprHTML(field.value) || '​';
    if (mode === 'area') inner.style.transform = 'translateY(' + (-field.scrollTop) + 'px)';
    else inner.style.transform = 'translateX(' + (-field.scrollLeft) + 'px)';
  };
  field.addEventListener('input', update);
  field.addEventListener('scroll', update);
  field.addEventListener('keyup', update);   // an input scrolls sideways as the caret moves
  field.addEventListener('focus', update);
  update();
  return { update, wrap };
}
