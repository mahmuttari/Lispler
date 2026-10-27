// Tüm araçlar ve Favoriler: araç listesi, her satırda yıldız (favorilere ekle / çıkar).
import { h, emptyState, put } from '../dom.js';
import { icon } from '../icons.js';
import { t } from '../i18n.js';
import { S, toggleFavorite } from '../store.js';
import { TOOLS } from '../tools.js';
import { topbar, tileIcon } from './common.js';

export function render({ go, params }) {
  const favOnly = params.favorites === '1';
  const list = h('div', { class: 'list-wrap', style: { display: 'flex', flexDirection: 'column', gap: '10px' } });

  function row(tool) {
    const on = S.favorites.includes(tool.id);
    const star = h('button', {
      class: `icon-btn star${on ? ' on' : ''}`, type: 'button', 'aria-pressed': String(on),
      'aria-label': t(on ? 'lb_fav_remove' : 'lb_fav_add'), title: t(on ? 'lb_fav_remove' : 'lb_fav_add'),
      onclick: (e) => { e.stopPropagation(); toggleFavorite(tool.id); draw(); },
    }, icon('Star', 22));
    return h('div', { class: `card tool-row press acc-${tool.accent}`, role: 'button', tabindex: '0', 'aria-label': t(tool.title),
      onclick: () => go(tool.route), onkeydown: (e) => { if (e.key === 'Enter') go(tool.route); } },
    tileIcon(tool.icon, tool.accent), h('div', { class: 'grow' }, h('b', { text: t(tool.title) }), h('small', { text: t(tool.sub) })), star);
  }

  function draw() {
    const items = favOnly ? S.favorites.map((id) => TOOLS.find((x) => x.id === id)).filter(Boolean) : TOOLS;
    if (!items.length) put(list, emptyState('Star', t('lb_favorites_empty'), t('lb_favorites_hint')));
    else put(list, ...items.map(row));
  }
  draw();

  const el = h('div', { class: 'screen' }, topbar({ title: t(favOnly ? 'lb_favorites_title' : 'lb_tools_title') }), list);
  return { el };
}
