// Drawn artwork: the shared gradients, the Kaaba (3D and flat), and the figure-eight hint. Everything is vector, so it stays sharp at any size.
// The Kaaba is a black cube draped in black silk (the kiswah) with a gold band (the hizam) around the upper part and a gold door on one side.

/** the gradients every drawing refers to (kbFront ...); the page keeps them in one invisible svg, an icon svg puts them in its own <defs> */
export const DEFS_MARKUP = `<defs>
    <linearGradient id="kbFront" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#34302c"/><stop offset=".55" stop-color="#1a1917"/><stop offset="1" stop-color="#0d0c0b"/></linearGradient>
    <linearGradient id="kbSide" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#131211"/><stop offset="1" stop-color="#050505"/></linearGradient>
    <linearGradient id="kbTop" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a4640"/><stop offset="1" stop-color="#262421"/></linearGradient>
    <linearGradient id="kbGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6dc92"/><stop offset=".5" stop-color="#d9ab45"/><stop offset="1" stop-color="#a8761f"/></linearGradient>
    <linearGradient id="kbGoldSide" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c79a3a"/><stop offset="1" stop-color="#8a5f16"/></linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7e2a0"/><stop offset=".5" stop-color="#d4a843"/><stop offset="1" stop-color="#9b6d1a"/></linearGradient>
    <linearGradient id="goldV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7e2a0"/><stop offset="1" stop-color="#b88a2e"/></linearGradient>
  </defs>`;

let installed = false;
export function installDefs() {
  if (installed || typeof document === 'undefined') return;
  installed = true;
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('width', '0'); s.setAttribute('height', '0'); s.setAttribute('aria-hidden', 'true');
  s.style.cssText = 'position:absolute;left:-9999px';
  s.innerHTML = DEFS_MARKUP;
  document.body.prepend(s);
}

/** the Kaaba in a 100 x 100 box: kind '3d' (corner view) or '2d' (flat, front view). Needs installDefs(). */
export function kaabaMarkup(kind = '3d') {
  if (kind === '2d') {
    return `<g>
      <ellipse cx="50" cy="88" rx="32" ry="3.2" fill="#000" opacity=".22"/>
      <rect x="20" y="22" width="60" height="64" rx="2.5" fill="url(#kbFront)"/>
      <rect x="20" y="36" width="60" height="11" fill="url(#kbGold)"/>
      <path d="M20 41.5h60" stroke="#8a5f16" stroke-width=".6" opacity=".6"/>
      <g fill="#7a5412" opacity=".7">${Array.from({ length: 9 }, (_, i) => `<rect x="${24 + i * 6.3}" y="39.2" width="3.2" height="4.6" rx=".8"/>`).join('')}</g>
      <rect x="54" y="55" width="15" height="31" rx="1.6" fill="url(#kbGold)"/>
      <rect x="56.4" y="57.4" width="10.2" height="26.6" rx="1" fill="#2a1d08"/>
      <rect x="20" y="22" width="60" height="3" fill="#fff" opacity=".07"/>
    </g>`;
  }
  return `<g>
    <ellipse cx="52" cy="89" rx="40" ry="4" fill="#000" opacity=".25"/>
    <polygon points="14,34 52,40 52,86 14,78" fill="url(#kbFront)"/>
    <polygon points="52,40 88,32 88,76 52,86" fill="url(#kbSide)"/>
    <polygon points="14,34 50,26 88,32 52,40" fill="url(#kbTop)"/>
    <polygon points="14,43.7 52,50.1 52,57.5 14,50.7" fill="url(#kbGold)"/>
    <polygon points="52,50.1 88,41.7 88,48.7 52,57.5" fill="url(#kbGoldSide)"/>
    <g fill="#6d4a0e" opacity=".62">${Array.from({ length: 6 }, (_, i) => { const x = 17.5 + i * 5.6, y = 45.2 + (x - 14) * 0.158; return `<polygon points="${x},${y} ${x + 3},${y + .5} ${x + 3},${y + 4.9} ${x},${y + 4.4}"/>`; }).join('')}
      ${Array.from({ length: 5 }, (_, i) => { const x = 55 + i * 6.4, y = 49.7 - (x - 52) * 0.222; return `<polygon points="${x},${y + .7} ${x + 3.4},${y - .1} ${x + 3.4},${y + 5} ${x},${y + 5.8}"/>`; }).join('')}</g>
    <polygon points="30,58.5 44,60.7 44,75.7 30,73.5" fill="url(#kbGold)"/>
    <polygon points="32.2,60.8 41.8,62.3 41.8,73.4 32.2,71.9" fill="#2a1d08"/>
    <polyline points="52,40 52,86" stroke="#fff" stroke-opacity=".14" stroke-width=".8" fill="none"/>
    <polyline points="14,34 52,40 88,32" stroke="#fff" stroke-opacity=".12" stroke-width=".8" fill="none"/>
  </g>`;
}

/** a complete little svg of the Kaaba, for use as a picture */
export function kaabaSvg(kind = '3d', cls = '') {
  return `<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true">${kaabaMarkup(kind === 'off' ? '3d' : kind)}</svg>`;
}

/** the figure of eight with a phone moving along it, drawn for the calibration hint (SMIL animation: no css support needed) */
export function eightMarkup() {
  const path = 'M100 60C70 12 14 36 14 60C14 84 70 108 100 60C130 12 186 36 186 60C186 84 130 108 100 60Z';
  return `<svg class="eight" viewBox="0 0 200 120" aria-hidden="true">
    <path d="${path}" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-dasharray="1 11" opacity=".5"/>
    <path d="${path}" pathLength="100" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-dasharray="14 86">
      <animate attributeName="stroke-dashoffset" from="0" to="-100" dur="5s" repeatCount="indefinite"/>
    </path>
    <g>
      <animateMotion dur="5s" repeatCount="indefinite" path="${path}"/>
      <rect x="-9" y="-15" width="18" height="30" rx="4" fill="#0e3b2b" stroke="#d9b765" stroke-width="2"/>
      <rect x="-6" y="-11" width="12" height="20" rx="1.6" fill="#1f7a55"/>
      <circle cx="0" cy="-3" r="3" fill="#f3e6b4"/>
    </g>
  </svg>`;
}
