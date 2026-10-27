// Ekranların ortak parçaları: üst çubuk, araç simgesi kutusu, saat ve tarih biçimleri.
import { h, iconButton, menu } from '../dom.js';
import { icon } from '../icons.js';
import { t, getLang } from '../i18n.js';

/** Üst çubuk: geri düğmesi (onBack varsa), başlık ve alt yazı, sağda eylem düğmeleri. */
export function topbar({ title, sub, onBack, actions = [], lead = null }) {
  return h('header', { class: 'topbar' },
    onBack ? iconButton('ChevronLeft', t('common_back'), onBack) : null,
    lead,
    h('div', { class: 'title' }, h('h1', { text: title }), sub ? h('div', { class: 'sub', text: sub }) : null),
    ...actions);
}

/** ⋮ menü düğmesi: items() her açılışta yeniden kurulur (gizlenen öğeler güncel kalsın). */
export function moreButton(items) {
  const b = iconButton('EllipsisVertical', t('common_more'), () => menu(b, items()));
  return b;
}

export function tileIcon(name, accent, size = 24) {
  return h('div', { class: `tile-ic acc-${accent}` }, icon(name, size));
}

const LOCALE = { tr: 'tr-TR', en: 'en-GB' };
export function timeOf(ms) {
  return new Intl.DateTimeFormat(LOCALE[getLang()], { hour: '2-digit', minute: '2-digit' }).format(new Date(ms));
}

/** "Bugün" / "Dün" / tarih */
export function dayLabel(ms, now = Date.now()) {
  const d = new Date(ms), n = new Date(now);
  const start = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(n) - start(d)) / 86400000);
  if (diff === 0) return t('lb_today');
  if (diff === 1) return t('lb_yesterday');
  return new Intl.DateTimeFormat(LOCALE[getLang()], { day: 'numeric', month: 'long', year: d.getFullYear() === n.getFullYear() ? undefined : 'numeric' }).format(d);
}

/** Yardım alt sayfası için paragraflar */
export const paras = (...keys) => keys.map((k) => h('p', { text: t(k) }));
