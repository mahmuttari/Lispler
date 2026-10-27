// The blueprint-style suspension bridge in the corner of the home hero (inline SVG, decorative, built from numbers so the hangers sit on the cable).
const bez = (p0, p1, p2, t) => [0, 1].map(k => (1 - t) * (1 - t) * p0[k] + 2 * (1 - t) * t * p1[k] + t * t * p2[k]);
const deckY = x => 152 - 14 * (x / 300);

function build() {
  const T1 = [84, 18], T2 = [236, 58];                       // tower tops
  const cable = [];
  const hang = [];
  // main span: tower 1 -> tower 2 (sagging), with hangers down to the deck
  const mid = [160, 118];
  cable.push(`M${T1} Q${mid} ${T2}`);
  for (let t = 0.07; t < 0.97; t += 0.07) {
    const [x, y] = bez(T1, mid, T2, t);
    hang.push(`M${x.toFixed(1)},${y.toFixed(1)}V${deckY(x).toFixed(1)}`);
  }
  // side spans to the anchorages
  cable.push(`M${T1} Q40,70 0,112`, `M${T2} Q272,86 300,104`);
  for (const [a, b] of [[T1, [0, 112]], [T2, [300, 104]]]) {
    for (let k = 1; k < 5; k++) {
      const x = a[0] + (b[0] - a[0]) * k / 5;
      const y = a[1] + (b[1] - a[1]) * k / 5 + (k * (5 - k)) * (a === T1 ? 1.1 : 0.7);
      hang.push(`M${x.toFixed(1)},${y.toFixed(1)}V${deckY(x).toFixed(1)}`);
    }
  }
  const tower = (x, top, base, w) => {
    const lx = x - w / 2, rx = x + w / 2, span = base - top;
    const beams = [0.25, 0.5, 0.75].map(f => `M${lx + (w / 2) * 0.1 * f},${top + span * f}H${rx - (w / 2) * 0.1 * f}`);
    const braces = [[0.25, 0.5], [0.5, 0.75], [0.75, 1]].map(([a, b]) => `M${lx},${top + span * a}L${rx},${top + span * b}`);
    return `M${lx + 1},${base}L${x - 1.5},${top}M${rx - 1},${base}L${x + 1.5},${top}M${x - 3},${top}H${x + 3}` + beams.join('') + braces.join('');
  };
  const grid = [];
  for (let x = 20; x < 300; x += 40) grid.push(`M${x},0V200`);
  for (let y = 20; y < 200; y += 40) grid.push(`M0,${y}H300`);
  const dim = 'M20,176H280M20,172V180M280,172V180M150,172V180';
  return `<svg class="hero-art" viewBox="0 0 300 200" preserveAspectRatio="xMaxYMid slice" aria-hidden="true" focusable="false">
    <g fill="none" stroke="#7DB1FF" stroke-linecap="round" stroke-linejoin="round">
      <path d="${grid.join('')}" stroke-width="0.4" opacity="0.12"/>
      <path d="${dim}" stroke-width="0.6" opacity="0.28" stroke-dasharray="2 2"/>
      <path d="M0,152L300,138" stroke-width="1.6" opacity="0.5"/>
      <path d="M0,158L300,144" stroke-width="0.7" opacity="0.3"/>
      <path d="${tower(84, 18, 150, 14)}" stroke-width="1.1" opacity="0.55"/>
      <path d="${tower(236, 58, 142, 10)}" stroke-width="0.9" opacity="0.45"/>
      <path d="${cable.join('')}" stroke-width="1.2" opacity="0.6"/>
      <path d="${hang.join('')}" stroke-width="0.5" opacity="0.4"/>
    </g>
  </svg>`;
}

export const HERO_ART = build();
