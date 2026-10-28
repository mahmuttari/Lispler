// Ayarlar: görünüm (tema, dil), birimler, kalibrasyon merkezi, bu telefon, veriler ve gizlilik, hakkında.
import { h, segmented, sheet, confirmDialog, toast, put } from '../dom.js';
import { icon } from '../icons.js';
import { t, num, getLang } from '../i18n.js';
import { S, changed, deleteAll } from '../store.js';
import * as native from '../native.js';
import * as reklam from '../reklam.js';
import { isPremium } from '../premium.js';
import { phoneHeight } from '../olcum/birim.js';
import { topbar } from './common.js';
import { applyTheme, applyLanguage } from '../app.js';

export const PRIVACY_URL = 'https://mahmuttari.github.io/Lispler/smart-measure/gizlilik.html';
export const EMAIL = 'mahmuttari@gmail.com';

export function render({ go, back, params }) {
  const section = (id, titleKey, ...kids) => h('div', { id: id ? `s-${id}` : null, style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
    h('h2', { class: 'section-title', text: t(titleKey) }), h('section', { class: 'card list' }, ...kids));
  const row = (iconName, label, end, onclick, sub) => h(onclick ? 'button' : 'div', { class: 'row', type: onclick ? 'button' : null, onclick },
    iconName ? icon(iconName, 20) : null, h('span', { class: 'row-text' }, h('span', { text: label }), sub ? h('small', { text: sub }) : null),
    end != null ? h('span', { class: 'end', text: end }) : null, onclick ? icon('ChevronRight', 18) : null);
  const stack = (...kids) => h('div', { class: 'row', style: { flexDirection: 'column', alignItems: 'stretch' } }, ...kids);
  const cal = (ok) => t(ok ? 'st_cal_done' : 'st_cal_missing');

  const look = section('look', 'st_section_look',
    stack(h('small', { class: 'muted', text: t('st_theme') }), segmented([
      { value: 'system', label: t('st_theme_system') }, { value: 'light', label: t('st_theme_light') }, { value: 'dark', label: t('st_theme_dark') },
    ], S.settings.theme, (v) => { S.settings.theme = v; changed('settings'); applyTheme(); })),
    stack(h('small', { class: 'muted', text: t('st_language') }), segmented([
      { value: 'system', label: t('st_language_system') }, { value: 'en', label: t('st_language_en') }, { value: 'tr', label: t('st_language_tr') },
    ], S.settings.language, (v) => { S.settings.language = v; changed('settings'); applyLanguage(); })));

  const units = section('units', 'st_section_units',
    stack(segmented([{ value: 'metric', label: t('st_units_metric') }, { value: 'imperial', label: t('st_units_imperial') }], S.settings.units,
      (v) => { S.settings.units = v; changed('settings'); }), h('p', { class: 'muted small', text: t('st_units_note') })));

  const h0 = S.settings.cameraHeight;
  const calibration = section('calibration', 'st_section_calibration',
    row('Level', t('st_cal_level'), cal(!!S.level.cal), () => go('level')),
    row('Ruler', t('st_cal_ruler'), cal(S.ruler.calibrated), () => go('ruler?tab=ruler')),
    row('Volume2', t('st_cal_sound'), cal(Number.isFinite(S.sensors.offsetDb)), () => go('sensors?tab=sound')),
    row('Smartphone', t('st_cal_height'), h0 > 0 ? phoneHeight(h0, S.settings.units, getLang()) : cal(false), () => go('ar')),
    row('ShieldCheck', t('st_accuracy_link'), null, () => go('accuracy')));

  const device = h('section', { class: 'card list' }, row(null, '…'));
  const deviceSec = h('div', { id: 's-device', style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
    h('h2', { class: 'section-title', text: t('st_section_device') }), device, h('p', { class: 'muted small', text: t('st_dev_note') }));
  native.capabilities().then((c) => {
    const yn = (v) => t(v ? 'st_dev_yes' : 'st_dev_no');
    const s = c.sensors || {};
    const d = c.display || {};
    const mm = (px, dpi) => (dpi > 0 ? num(px / dpi * 25.4, 0) : '—');
    put(device, 
      row('Activity', t('st_dev_accelerometer'), yn(s.accelerometer)),
      row('Level', t('st_dev_gravity'), yn(s.gravity)),
      row('RotateCw', t('st_dev_gyroscope'), yn(s.gyroscope)),
      row('Crosshair', t('st_dev_rotation'), yn(s.rotationVector || s.gameRotationVector)),
      row('Sun', t('st_dev_light'), yn(s.light)),
      row('Mic', t('st_dev_microphone'), yn(c.microphone)),
      row('Camera', t('st_dev_camera'), yn(c.rearCamera)),
      row('Flashlight', t('st_dev_flash'), yn(c.flash)),
      row('Box', t('st_dev_arcore'), yn(c.arcore)),
      row('Smartphone', t('st_dev_display'), null, null, d.widthPx ? t('st_dev_display_value', d.widthPx, d.heightPx, num(d.xdpi, 0), num(d.ydpi, 0), mm(d.widthPx, d.xdpi), mm(d.heightPx, d.ydpi)) : '—'));
  });

  const adPrivacy = row('Lock', t('st_ad_privacy'), null, () => reklam.gizlilikSecenekleri());
  const syncAd = () => adPrivacy.classList.toggle('hidden', !(reklam.gizlilikGerekli() && !isPremium()));
  syncAd();
  document.addEventListener('reklam-gizlilik', syncAd);
  const data = section('data', 'st_section_data',
    stack(h('p', { class: 'small', style: { color: 'var(--text2)' }, text: t('st_privacy_text') })),
    adPrivacy,
    row('ShieldCheck', t('st_privacy_policy'), null, () => native.openUrl(PRIVACY_URL)),
    row('Trash2', t('st_delete_all'), null, async () => {
      if (await confirmDialog(t('st_delete_title'), t('st_delete_text'), t('st_delete_confirm'), t('st_cancel'), true)) {
        deleteAll(); applyTheme(); applyLanguage(); toast(t('st_deleted'));
      }
    }));

  const version = h('span', { class: 'end', text: '' });
  native.appInfo().then((i) => { version.textContent = i.versionName || ''; });
  const about = section('about', 'st_section_about',
    row('Crown', t('st_premium_title'), isPremium() ? t('pr_active') : null, () => go('premium')),
    h('div', { class: 'row' }, icon('Info', 20), h('span', { class: 'row-text' }, h('span', { text: t('app_name') })), version),
    row('Sparkles', t('st_developer'), 'Poyraz Workshop'),
    row('ExternalLink', t('st_contact'), EMAIL, () => native.openUrl(`mailto:${EMAIL}`)),
    row('ExternalLink', 'GeoTerva', 'geoterva.com', () => native.openUrl('https://geoterva.com')),
    row('Library', t('st_licenses'), null, () => sheet(t('st_licenses'), [h('p', { text: t('st_licenses_text') })])));
  native.appInfo().then((i) => { if (i.versionName) version.textContent = t('st_version', i.versionName); });

  const el = h('div', { class: 'screen' }, topbar({ title: t('st_title'), onBack: back }), look, units, calibration, deviceSec, data, about);
  if (params.s) requestAnimationFrame(() => { const x = el.querySelector(`#s-${params.s}`); if (x) x.scrollIntoView({ block: 'start' }); });
  return { el, destroy: () => document.removeEventListener('reklam-gizlilik', syncAd) };
}
