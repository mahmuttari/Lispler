// The compass dial: a cream (or dark) disc with a gold rim, degree scale, N/E/S/W, an eight-pointed rose and the Qibla needle with the Kaaba at its tip.
// The disc turns with the phone so that N always points to north; the needle sits on it at the Qibla bearing, so when the phone's top edge faces the Qibla
// the needle points straight up. Colours come from css variables (css/app.css) so the style and night mode restyle it without redrawing.
import { kaabaMarkup } from './art.js';

const R = 400 / 2;   // the viewBox is 420 wide: -210 .. 210

function ticks() {
  let s = '';
  for (let a = 0; a < 360; a += 5) {
    const major = a % 30 === 0, mid = a % 10 === 0;
    const len = major ? 15 : mid ? 10 : 6;
    s += `<line x1="0" y1="${-178}" x2="0" y2="${-178 + len}" transform="rotate(${a})" class="tk${major ? ' tk3' : mid ? ' tk2' : ''}"/>`;
  }
  return s;
}

function numbers() {
  let s = '';
  for (let a = 0; a < 360; a += 30) {
    if (a % 90 === 0) continue;
    s += `<text transform="rotate(${a}) translate(0,${-150})" class="num" text-anchor="middle" dominant-baseline="central">${a}</text>`;
  }
  return s;
}

function cardinals() {
  return [['N', 0], ['E', 90], ['S', 180], ['W', 270]]
    .map(([c, a]) => `<text transform="rotate(${a}) translate(0,-150)" class="cdl${c === 'N' ? ' n' : ''}" text-anchor="middle" dominant-baseline="central"><tspan transform="rotate(${-a})">${c}</tspan></text>`).join('');
}

// eight points: long ones north/east/south/west, short ones between; each point is two triangles (light and dark side) so it looks cut like a gem
function rose() {
  let s = '';
  for (let k = 0; k < 8; k++) {
    const long = k % 2 === 0, len = long ? 120 : 84, w = long ? 16 : 11;
    s += `<g transform="rotate(${k * 45})"><polygon points="0,${-len} ${-w},0 0,0" class="rl${long ? '' : ' s'}"/><polygon points="0,${-len} ${w},0 0,0" class="rd${long ? '' : ' s'}"/></g>`;
  }
  return s;
}

/**
 * -> { el, update({ heading, qibla, aligned, kaaba, degrees }) }
 * heading: the direction the phone's top edge points to, degrees from north; qibla: the bearing of the Kaaba from true north
 */
export function buildDial() {
  const wrap = document.createElement('div');
  wrap.className = 'dial';
  wrap.innerHTML = `<svg viewBox="-210 -210 420 420" role="img" aria-label="compass">
    <defs>
      <radialGradient id="dFace" cx=".5" cy=".42" r=".62"><stop offset="0" style="stop-color:var(--dial-face1)"/><stop offset="1" style="stop-color:var(--dial-face2)"/></radialGradient>
      <linearGradient id="dRing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--ring1)"/><stop offset=".5" style="stop-color:var(--ring2)"/><stop offset="1" style="stop-color:var(--ring3)"/></linearGradient>
      <linearGradient id="nA" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:var(--needle-a)"/><stop offset="1" style="stop-color:var(--needle-b)"/></linearGradient>
      <linearGradient id="nB" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:var(--needle-b)"/><stop offset="1" style="stop-color:var(--needle-c)"/></linearGradient>
      <radialGradient id="dHub" cx=".4" cy=".35" r=".8"><stop offset="0" style="stop-color:var(--needle-a)"/><stop offset="1" style="stop-color:var(--needle-c)"/></radialGradient>
    </defs>
    <circle r="204" class="rim" fill="url(#dRing)"/>
    <circle r="196" class="rim-in"/>
    <g class="rot">
      <circle r="192" fill="url(#dFace)"/>
      <circle r="183" class="line"/>
      <g class="scale">${ticks()}</g>
      <g class="numbers">${numbers()}</g>
      <g class="cards">${cardinals()}</g>
      <circle r="124" class="line"/>
      <circle r="128" class="line thin"/>
      <g class="rose">${rose()}</g>
      <g class="needle">
        <polygon points="0,-134 -17,-8 0,2" class="nfl"/><polygon points="0,-134 17,-8 0,2" class="nfr"/>
        <polygon points="0,106 -13,8 0,-2" class="ntl"/><polygon points="0,106 13,8 0,-2" class="ntr"/>
        <g class="ka"></g>
      </g>
      <circle r="31" class="hub-o"/><circle r="26" fill="url(#dHub)"/><circle r="17" class="hub-i"/>
      <polygon points="0,-11 3,-3 11,0 3,3 0,11 -3,3 -11,0 -3,-3" class="star"/>
    </g>
    <path class="lubber" d="M-11,-218 L11,-218 L0,-199 Z"/>
    <circle r="213" class="glow"/>
  </svg>`;
  const svg = wrap.firstElementChild;
  const rot = svg.querySelector('.rot'), needle = svg.querySelector('.needle'), ka = svg.querySelector('.ka');
  const numbersEl = svg.querySelector('.numbers');
  let kaabaKind = null, cur = { heading: 0, qibla: 0 };

  function update(o) {
    cur = { ...cur, ...o };
    if (o.kaaba !== undefined && o.kaaba !== kaabaKind) {
      kaabaKind = o.kaaba;
      ka.innerHTML = kaabaKind === 'off' ? '' : kaabaMarkup(kaabaKind);
      // the tip marker without the picture is a small gold bead
      if (kaabaKind === 'off') ka.innerHTML = '<circle cx="50" cy="50" r="22" fill="url(#gold)" stroke="#8a5f16" stroke-width="3"/>';
    }
    if (o.degrees !== undefined) numbersEl.style.display = o.degrees ? '' : 'none';
    if (o.heading !== undefined) rot.setAttribute('transform', `rotate(${(-cur.heading).toFixed(2)})`);
    if (o.qibla !== undefined || o.heading !== undefined) {
      needle.setAttribute('transform', `rotate(${cur.qibla.toFixed(2)})`);
      // the Kaaba stays upright on the screen wherever the needle points
      ka.setAttribute('transform', `translate(0,-158) rotate(${(cur.heading - cur.qibla).toFixed(2)}) scale(.5) translate(-50,-52)`);
    }
    if (o.aligned !== undefined) wrap.classList.toggle('aligned', !!o.aligned);
    if (o.weak !== undefined) wrap.classList.toggle('weak', !!o.weak);      // aligned, but the compass is not to be trusted (amber instead of green)
  }
  update({ heading: 0, qibla: 0, kaaba: '3d', degrees: true, aligned: false });
  return { el: wrap, update };
}
