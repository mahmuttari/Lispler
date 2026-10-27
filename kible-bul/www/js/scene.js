// The welcome picture: the Kaaba at night, worshippers around it, two lit minarets, a gold arch with a crescent. Drawn in code (vector), 390 x 844.
import { kaabaMarkup } from './art.js';

// a small repeatable pseudo-random number, so the crowd is the same on every launch
const rng = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;


// a person seen from the front: a shadow, a robe (shoulders, then straight down), a head and a white cap
const PERSON = `<g id="person"><ellipse cx="0" cy="1" rx="4" ry="1.2" fill="#000" opacity=".28"/><path d="M-3.6 0 Q-4.2 -8.5 -2 -11.5 Q0 -12.4 2 -11.5 Q4.2 -8.5 3.6 0 Z" fill="#f4efe2"/><path d="M1 -11.4 Q4.2 -8.5 3.6 0 L1.6 0 Q2.2 -8 1 -11.4 Z" fill="#cfc7b0" opacity=".7"/><circle cx="0" cy="-14" r="2.3" fill="#d3a47c"/><path d="M-2.4 -14.6 Q0 -17.2 2.4 -14.6 Q0 -15.6 -2.4 -14.6 Z" fill="#f4efe2"/></g>`;

function crowd() {
  const rnd = rng(7);
  const people = [];
  // rings of people around the Kaaba (centre 195,578): back rows are small and high, front rows large and low
  for (let row = 0; row < 7; row++) {
    const n = 22 + row * 5, ry = 7 + row * 8, rx = 118 + row * 22, cy = 578 - 6 + row * 2;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rnd() * 0.12;
      const x = 195 + Math.cos(a) * rx + (rnd() - 0.5) * 3, y = cy + Math.sin(a) * ry;
      const k = 0.62 + (y - 560) / 120;                       // nearer = bigger
      people.push({ x, y, k });
    }
  }
  people.sort((a, b) => a.y - b.y);
  // one drawing of a person (PERSON, in the defs), placed many times: a few hundred <use> instead of a thousand shapes keeps the page light
  return people.map(p => `<use href="#person" transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${(p.k * 0.82).toFixed(2)})"/>`).join('');
}

function minaret(x, base, h, w) {
  const top = base - h;
  const windows = Array.from({ length: 5 }, (_, i) => `<rect x="${x - 1.6}" y="${top + h * (0.34 + i * 0.1)}" width="3.2" height="${h * 0.045}" rx="1.4" fill="#ffd98a" opacity=".9"/>`).join('');
  return `<g>
    <rect x="${x - w / 2}" y="${top + h * 0.2}" width="${w}" height="${h * 0.8}" fill="url(#mnBody)"/>
    <rect x="${x - w / 2 - 4}" y="${top + h * 0.26}" width="${w + 8}" height="6" fill="#e9dcb4"/>
    <rect x="${x - w / 2 - 5}" y="${top + h * 0.26 + 6}" width="${w + 10}" height="3" fill="#b99b52"/>
    <rect x="${x - w / 2 + 2}" y="${top + h * 0.08}" width="${w - 4}" height="${h * 0.12}" fill="url(#mnBody)"/>
    <path d="M${x - w / 2 + 1} ${top + h * 0.08} Q${x} ${top - h * 0.1} ${x + w / 2 - 1} ${top + h * 0.08} Z" fill="#bfa25c"/>
    <path d="M${x} ${top - h * 0.1} v-${h * 0.06}" stroke="#e8c46a" stroke-width="2"/>
    <circle cx="${x}" cy="${top - h * 0.17}" r="2.4" fill="#f4d98a"/>
    ${windows}
    <rect x="${x - w / 2 - 14}" y="${base - 4}" width="${w + 28}" height="4" fill="#0a2f23" opacity=".6"/>
  </g>`;
}

function lantern(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <circle r="26" fill="url(#lampGlow)"/>
    <rect x="-5" y="-12" width="10" height="20" rx="2" fill="#2a2418" stroke="#d9b765" stroke-width="1.2"/>
    <rect x="-3.4" y="-9.5" width="6.8" height="15" rx="1.2" fill="#ffd98a"/>
    <path d="M-6 -12 L0 -19 L6 -12 Z" fill="#d9b765"/>
  </g>`;
}

export function sceneMarkup() {
  const stars = [];
  const rnd = rng(11);
  for (let i = 0; i < 40; i++) stars.push(`<circle cx="${(rnd() * 390).toFixed(0)}" cy="${(rnd() * 210).toFixed(0)}" r="${(0.4 + rnd() * 1.1).toFixed(1)}" fill="#fff" opacity="${(0.2 + rnd() * 0.5).toFixed(2)}"/>`);
  return `<svg class="scene" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    ${PERSON}
    <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#062a1f"/><stop offset=".42" stop-color="#0d4a37"/><stop offset=".68" stop-color="#14654a"/><stop offset="1" stop-color="#0a3a2b"/></linearGradient>
    <radialGradient id="kaabaGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe7a6" stop-opacity=".55"/><stop offset=".45" stop-color="#ffd27a" stop-opacity=".16"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
    <radialGradient id="lampGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd98a" stop-opacity=".7"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>
    <linearGradient id="mnBody" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f6ecd0"/><stop offset=".55" stop-color="#e3d4a8"/><stop offset="1" stop-color="#a99868"/></linearGradient>
    <linearGradient id="floorG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c7a58"/><stop offset=".5" stop-color="#0f4c38"/><stop offset="1" stop-color="#062a1f"/></linearGradient>
    <linearGradient id="wallG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#073427"/><stop offset="1" stop-color="#0c4a38"/></linearGradient>
    <pattern id="starPat" width="44" height="44" patternUnits="userSpaceOnUse"><path d="M22 4l5 11 11-5-5 11 11 5-11 5 5 11-11-5-5 11-5-11-11 5 5-11-11-5 11-5-5-11 11 5z" fill="none" stroke="#e8c66a" stroke-width=".7" opacity=".5"/></pattern>
    <mask id="crescentMask"><rect width="100" height="100" fill="#fff"/><circle cx="62" cy="40" r="30" fill="#000"/></mask>
    <linearGradient id="reflG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <mask id="reflMask"><rect x="0" y="560" width="390" height="200" fill="url(#reflG)"/></mask>
  </defs>
  <rect width="390" height="844" fill="url(#skyG)"/>
  ${stars.join('')}
  <circle cx="195" cy="470" r="250" fill="url(#kaabaGlow)"/>
  <!-- far skyline: domes and small minarets -->
  <g fill="#0a3a2b" opacity=".95">
    <path d="M0 470 V430 Q30 395 60 430 V470Z"/><path d="M320 470 V425 Q352 388 390 425 V470Z"/>
    <path d="M100 470 V445 Q130 418 160 445 V470Z"/><path d="M232 470 V442 Q262 414 292 442 V470Z"/>
    <path d="M150 470 V458 Q195 405 240 458 V470Z"/>
  </g>
  ${minaret(150, 540, 150, 9)}${minaret(240, 540, 150, 9)}
  ${minaret(54, 640, 330, 20)}${minaret(336, 640, 330, 20)}
  <!-- side cloisters -->
  <g>
    <path d="M0 844 V300 H46 V844Z" fill="url(#wallG)"/>
    <path d="M390 844 V300 H344 V844Z" fill="url(#wallG)" opacity=".9"/>
  </g>
  ${lantern(40, 590, 1.1)}${lantern(352, 592, 1.1)}${lantern(110, 640, .8)}${lantern(282, 640, .8)}
  <!-- the courtyard floor and the reflection of the Kaaba -->
  <rect x="0" y="560" width="390" height="284" fill="url(#floorG)"/>
  <g opacity=".5" mask="url(#reflMask)" transform="translate(0 1168) scale(1 -1)"><g transform="translate(78 380) scale(2.4)">${kaabaMarkup('3d')}</g></g>
  <path d="M0 600 H390 M0 650 H390 M0 715 H390 M0 790 H390" stroke="#fff" stroke-opacity=".05"/>
  <ellipse cx="195" cy="578" rx="170" ry="34" fill="#ffe7a6" opacity=".12"/>
  <!-- the Kaaba, large -->
  <g transform="translate(78 380) scale(2.4)">${kaabaMarkup('3d')}</g>
  ${crowd()}
  <!-- the arch: the dark vignette outside it, then its gold lines, then the crescent -->
  <path d="M0 0H390V844H0Z M66 844 V300 C66 205 140 165 195 74 C250 165 324 205 324 300 V844Z" fill="#031a12" opacity=".62" fill-rule="evenodd"/>
  <path d="M66 844 V300 C66 205 140 165 195 74 C250 165 324 205 324 300 V844" fill="none" stroke="url(#gold)" stroke-width="3.2"/>
  <path d="M77 844 V302 C77 214 146 176 195 94 C244 176 313 214 313 302 V844" fill="none" stroke="#e8c66a" stroke-width="1" opacity=".55"/>
</svg>`;
}
