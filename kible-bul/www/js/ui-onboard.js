// The first-run welcome: four slides over the picture of the Kaaba. Swipe or press the button; "Skip" leaves at once.
import { h, icon } from './dom.js';
import { t } from './i18n.js';
import { sceneMarkup } from './scene.js';
import { eightMarkup } from './art.js';

const CRESCENT = `<svg viewBox="0 0 100 100" class="cres" aria-hidden="true"><defs><mask id="obMask"><rect width="100" height="100" fill="#fff"/><circle cx="62" cy="40" r="30" fill="#000"/></mask></defs>
  <circle cx="50" cy="50" r="38" fill="url(#gold)" mask="url(#obMask)" transform="rotate(-12 50 50)"/><circle cx="73" cy="30" r="3.2" fill="#f7e2a0"/></svg>`;

export function showOnboarding({ onDone }) {
  const root = document.getElementById('onboard');
  let i = 0;
  const slides = [
    { art: () => h('div', { class: 'oart', html: CRESCENT }), title: t('app.name'), sub: t('app.tagline'), btn: t('ob.start'), big: true },
    { art: () => h('div', { class: 'oart ic' }, icon('map-pin')), title: t('ob.2.title'), sub: t('ob.2.sub'), btn: t('ob.next') },
    { art: () => h('div', { class: 'oart eightart', html: eightMarkup() }), title: t('ob.3.title'), sub: t('ob.3.sub'), btn: t('ob.next') },
    { art: () => h('div', { class: 'oart ic' }, icon('smartphone')), title: t('ob.4.title'), sub: t('ob.4.sub'), btn: t('ob.open') },
  ];
  const artBox = h('div', { class: 'oartbox' }), title = h('h1'), sub = h('p');
  const dots = h('div', { class: 'dots' }, slides.map(() => h('i')));
  const btn = h('button', { class: 'cta', onclick: next });
  const skip = h('button', { class: 'skip', text: t('ob.skip'), onclick: finish });
  const text = h('div', { class: 'otext' }, title, sub);
  root.replaceChildren(h('div', { class: 'scenebox', html: sceneMarkup() }), skip, artBox, text, dots, btn);
  root.hidden = false;
  root.className = '';

  function show(n) {
    i = n;
    const s = slides[i];
    root.classList.add('swap');
    setTimeout(() => {
      artBox.replaceChildren(s.art());
      title.textContent = s.title; sub.textContent = s.sub;
      btn.replaceChildren(h('span', { text: s.btn }), icon('arrow-right'));
      [...dots.children].forEach((d, k) => d.classList.toggle('on', k === i));
      skip.hidden = i === 0 || i === slides.length - 1;
      title.classList.toggle('big', !!s.big);
      root.classList.remove('swap');
    }, i === 0 && !artBox.firstChild ? 0 : 140);
  }
  function next() { if (i >= slides.length - 1) finish(); else show(i + 1); }
  function finish() { root.hidden = true; root.replaceChildren(); onDone(); }

  // swipe
  let x0 = null;
  root.onpointerdown = e => { x0 = e.clientX; };
  root.onpointerup = e => {
    if (x0 === null) return;
    const dx = e.clientX - x0; x0 = null;
    if (Math.abs(dx) < 50) return;
    const dirRtl = document.documentElement.dir === 'rtl';
    const forward = dirRtl ? dx > 0 : dx < 0;
    if (forward) next(); else if (i > 0) show(i - 1);
  };
  show(0);
  return { back() { if (i > 0) { show(i - 1); return true; } return false; } };
}
