// Settings > Compass correction: for a compass that is always off by about the same amount (a magnetic case, a phone whose sensor is a little off).
// The person stands facing a direction known to be the Qibla (the way they pray at a mosque), holds the phone flat and still and taps the button: the correction becomes the difference
// between what the compass shows and the Qibla, and from then on it is added to every heading. One-degree steps and removal are there too.
import { h } from './dom.js';
import { t, dir } from './i18n.js';
import { S, save } from './state.js';
import { openSheet, toast } from './sheet.js';
import { hold, release, hasReadings, msSinceReading } from './compass.js';
import { info } from './place.js';
import { correctionFor, clampCorrection } from './quality.js';
import { uncorrectedHeading, shownHeading, shownQibla } from './heading.js';
import { degText, signedDegText } from './fmt.js';

const BIG_DEG = 25;      // beyond this a correction is more likely a wrong place or a magnet than a small error of the sensor
// in a right-to-left sentence a number with its degree sign and sign stays in one piece (a left-to-right isolate)
const iso = s => (dir() === 'rtl' ? '⁦' + s + '⁩' : s);

export function openCorrection({ onChange } = {}) {
  hold('corr');
  const now = h('p', { class: 'corrnow' }), cur = h('p', { class: 'corrcur' }), msg = h('p', { class: 'corrmsg', hidden: true });
  const remove = h('button', { class: 'pill', text: t('corr.reset'), onclick: () => { apply(0); toast(t('corr.removed')); } });
  let timer = 0;

  const offset = () => Number(S.settings.offset) || 0;
  function apply(v) { S.settings.offset = clampCorrection(v); save(true); render(); if (onChange) onChange(); }

  function render() {
    const i = info(), shown = shownHeading();
    now.textContent = i && !i.atKaaba ? t('corr.reading', shown === null ? '—' : iso(degText(shown)), iso(degText(shownQibla(i)))) : '';
    cur.textContent = offset() ? t('corr.current', iso(signedDegText(offset()))) : t('corr.none');
    remove.hidden = !offset();
    msg.hidden = Math.abs(offset()) <= BIG_DEG;
    if (!msg.hidden) msg.textContent = t('corr.big', iso(signedDegText(offset())));
  }

  function setHere() {
    const i = info(), u = uncorrectedHeading();
    if (!i || i.atKaaba) { toast(t('compass.needPlace')); return; }
    // a heading that has stopped moving because the sensor stopped is no heading to take
    if (u === null || !hasReadings() || msSinceReading() > 3000) { toast(t('corr.noReading')); return; }
    apply(correctionFor(u, shownQibla(i)));
    toast(t('corr.saved', iso(signedDegText(offset()))));
  }

  render();
  timer = setInterval(render, 400);
  openSheet({
    title: t('corr.title'),
    body: h('div', { class: 'corr' },
      h('p', { text: t('corr.intro') }),
      now,
      h('button', { class: 'bigbtn', text: t('corr.set'), onclick: setHere }),
      msg,
      cur,
      h('div', { class: 'wrap' },
        h('button', { class: 'pill', text: iso('−1°'), 'aria-label': '−1°', onclick: () => apply(offset() - 1) }),
        h('button', { class: 'pill', text: iso('+1°'), 'aria-label': '+1°', onclick: () => apply(offset() + 1) }),
        remove),
      h('p', { class: 'small', text: t('corr.note') })),
    onClose: () => { clearInterval(timer); release('corr'); },
  });
}
