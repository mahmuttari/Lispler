// Small pieces of markup that the home screen and the favorites share.
import { getLang, unitName, unitSym } from './i18n.js';
import { esc, ltr } from './dom.js';

export const upperFirst = s => (s ? s.charAt(0).toLocaleUpperCase(getLang()) + s.slice(1) : s);

const textWidth = s => [...s].reduce((n, ch) => n + (ch.charCodeAt(0) >= 0x2e80 ? 2 : 1), 0);   // a Japanese / Korean character is as wide as two Latin ones

/** the unit as its button shows it: "metre (m)", or - when "name (symbol)" would not fit on one line - the symbol with the name under it */
export function unitLabel(unit) {
  const name = unitName(unit), sym = unitSym(unit);
  if (textWidth(name) + textWidth(sym) + 3 <= 12) return `<span class="ul-one">${esc(name)} <i>${ltr(`(${esc(sym)})`)}</i></span>`;
  return `<span class="ul-two"><b>${ltr(esc(sym))}</b><small>${esc(name)}</small></span>`;
}
