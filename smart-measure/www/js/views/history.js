// Geçmiş: kopyalanan ya da tamamlanan ölçümler, yalnız bu telefonda. Güne göre gruplu; kopyala, paylaş, tümünü temizle.
import { h, emptyState, iconButton, confirmDialog, toast, put } from '../dom.js';
import { t } from '../i18n.js';
import { S, changed } from '../store.js';
import * as native from '../native.js';
import { HISTORY_TOOLS } from '../tools.js';
import { topbar, tileIcon, timeOf, dayLabel } from './common.js';

export const entryText = (e) => `${e.label}: ${e.value}${e.note ? ` (${e.note})` : ''}`;

export function render() {
  const body = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } });
  const clearBtn = h('button', { class: 'btn ghost', type: 'button', text: t('lb_history_clear'), onclick: clearAll });

  async function clearAll() {
    const ok = await confirmDialog(t('lb_history_clear_title'), t('lb_history_clear_text', S.history.length), t('lb_history_clear'), t('lb_history_cancel'), true);
    if (!ok) return;
    S.history = [];
    changed('history');
    draw();
  }

  function draw() {
    clearBtn.classList.toggle('hidden', !S.history.length);
    if (!S.history.length) {
      put(body, emptyState('History', t('lb_history_empty'), t('lb_history_hint')));
      return;
    }
    const out = [h('p', { class: 'muted small', text: t('lb_history_hint') })];
    let day = null;
    for (const e of S.history) {
      const d = dayLabel(e.time);
      if (d !== day) { day = d; out.push(h('div', { class: 'day', text: d })); }
      const tool = HISTORY_TOOLS[e.tool] || { icon: 'Ruler', accent: 'blue' };
      out.push(h('div', { class: `card hist acc-${tool.accent}` },
        tileIcon(tool.icon, tool.accent, 20),
        h('div', { class: 'grow' }, h('small', { text: `${e.label} · ${timeOf(e.time)}` }), h('b', { text: e.value }), e.note ? h('small', { text: e.note }) : null),
        iconButton('Copy', t('lb_history_copy'), async () => { if (await native.copyText(entryText(e))) toast(t('lb_history_copied', e.value)); }),
        iconButton('Share2', t('lb_history_share'), () => native.shareText(entryText(e)))));
    }
    put(body, ...out);
  }
  draw();
  const el = h('div', { class: 'screen' }, topbar({ title: t('lb_history_title'), actions: [clearBtn] }), body);
  return { el };
}
