// Sensörler: ses ölçer (A-ağırlıklı, kalibrasyonsuz göreli dBFS(A), referans ölçerle kalibre edilince dB(A)) ve ışık
// ölçer (lux). Mikrofon yalnız ses düzeyini hesaplamak için açılır; hiçbir şey kaydedilmez, saklanmaz, gönderilmez.
import { h, iconButton, segmented, sheet, toast, notice, put } from '../dom.js';
import { icon } from '../icons.js';
import { t, num } from '../i18n.js';
import { S, changed } from '../store.js';
import * as native from '../native.js';
import * as reklam from '../reklam.js';
import * as SES from '../olcum/ses.js';
import * as ISIK from '../olcum/isik.js';
import { topbar, moreButton, paras } from './common.js';

const NS = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };

/** Yarım daire gösterge: fraction 0…1; zones [{from,to,color}] isteğe bağlı. */
function gaugeSvg() {
  const el = svg('svg', { viewBox: '0 0 200 120', 'aria-hidden': 'true' });
  const arc = (a0, a1, r) => {
    const p = (a) => [100 + r * Math.cos(Math.PI * (1 - a)), 104 - r * Math.sin(Math.PI * (1 - a))];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    return `M ${x0} ${y0} A ${r} ${r} 0 ${a1 - a0 > 0.5 ? 1 : 0} 1 ${x1} ${y1}`;
  };
  const zones = svg('g', {});
  const track = svg('path', { d: arc(0, 1, 84), fill: 'none', stroke: 'var(--surface2)', 'stroke-width': 14, 'stroke-linecap': 'round' });
  const fill = svg('path', { d: arc(0, 1, 84), fill: 'none', stroke: 'var(--acc)', 'stroke-width': 14, 'stroke-linecap': 'round', pathLength: 100, 'stroke-dasharray': '0 100' });
  const needle = svg('circle', { r: 7, fill: 'var(--text)', stroke: 'var(--bg)', 'stroke-width': 3, cx: 16, cy: 104 });
  const labels = svg('g', { 'font-size': 9, 'font-weight': 700, fill: 'var(--text2)', 'text-anchor': 'middle' });
  el.append(track, zones, fill, labels, needle);
  return {
    el,
    zones(list) {
      put(zones, ...list.map((z) => svg('path', { d: arc(z.from + 0.004, Math.max(z.from + 0.008, z.to - 0.004), 84), fill: 'none', stroke: z.color, 'stroke-width': 14, opacity: 0.85 })));
      fill.setAttribute('stroke', 'transparent');
    },
    labels(list) {
      put(labels, ...list.map(([f, text]) => {
        const a = Math.PI * (1 - f), x = 100 + 62 * Math.cos(a), y = 106 - 62 * Math.sin(a);
        const e = svg('text', { x: x.toFixed(1), y: y.toFixed(1) }); e.textContent = text; return e;
      }));
    },
    set(f) {
      const v = Math.max(0, Math.min(1, f || 0));
      fill.setAttribute('stroke-dasharray', `${(v * 100).toFixed(2)} 100`);
      const a = Math.PI * (1 - v);
      needle.setAttribute('cx', (100 + 84 * Math.cos(a)).toFixed(2));
      needle.setAttribute('cy', (104 - 84 * Math.sin(a)).toFixed(2));
    },
  };
}

function spark() {
  const el = svg('svg', { class: 'spark', viewBox: '0 0 300 64', preserveAspectRatio: 'none', 'aria-hidden': 'true' });
  const line = svg('polyline', { fill: 'none', stroke: 'var(--acc)', 'stroke-width': 2, 'vector-effect': 'non-scaling-stroke', points: '' });
  el.append(line);
  return {
    el,
    set(values, min, max, n = 600) {
      if (!values.length) { line.setAttribute('points', ''); return; }
      const pts = values.map((v, i) => `${(300 * (n - values.length + i) / (n - 1)).toFixed(1)},${(62 - 60 * Math.max(0, Math.min(1, (v - min) / (max - min)))).toFixed(1)}`);
      line.setAttribute('points', pts.join(' '));
    },
  };
}

export function render({ params, back }) {
  const SN = S.sensors;
  let tab = params.tab === 'light' ? 'light' : params.tab === 'sound' ? 'sound' : SN.tab;
  const calibrated = () => Number.isFinite(SN.offsetDb);
  const unit = () => (calibrated() ? t('sn_unit_db') : t('sn_unit_dbfs'));
  const lvl = (dbfs) => (calibrated() ? dbfs + SN.offsetDb : dbfs);

  // ses durumu
  let mic = 'idle', stopMic = null, fast = null, leq = SES.leqStart(), hist = [], clipping = false, source = null, calLeq = null;
  // ışık durumu
  let light = 'waiting', lux = null, luxStats = { sum: 0, n: 0, max: -Infinity }, luxHist = [], stopLight = null;

  const tabs = segmented([{ value: 'sound', label: t('sn_tab_sound'), icon: 'Volume2' }, { value: 'light', label: t('sn_tab_light'), icon: 'Sun' }], tab,
    (v) => {
      // Mikrofon yalnız ses ölçer görünürken açık kalır
      if (v !== 'sound' && stopMic) { haltMic(); mic = 'idle'; }
      tab = v; SN.tab = v; changed('sensors'); build();
    });
  const body = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '14px' } });
  const help = iconButton('CircleHelp', t('sn_help_title'), () => sheet(t('sn_help_title'), paras('sn_help_sound', 'sn_help_light', 'sn_safe_note'), { cls: 'acc-yellow' }));
  const more = moreButton(() => [
    { label: t('sn_menu_reset_stats'), icon: 'RotateCcw', onclick: resetStats },
    { label: t('sn_calibrate'), icon: 'SlidersHorizontal', onclick: calibrationSheet, hidden: tab !== 'sound' },
  ]);
  const el = h('div', { class: 'screen tool acc-yellow' },
    topbar({ title: t('sn_sensors_title'), sub: t('sn_sensors_subtitle'), onBack: back, actions: [help, more] }), tabs, body);

  function resetStats() {
    leq = SES.leqStart(); hist = []; luxStats = { sum: 0, n: 0, max: -Infinity }; luxHist = [];
    toast(t('sn_menu_reset_stats'));
    redraw();
  }

  let redraw = () => {};
  let raf = 0;
  const schedule = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; redraw(); }); };

  // ================= ses
  function buildSound() {
    const g = gaugeSvg();
    g.labels([[0, calibrated() ? '0' : '−90'], [0.5, calibrated() ? '60' : '−45'], [1, calibrated() ? '120' : '0']]);
    const val = h('div', { class: 'big' });
    const modeLbl = h('div', { class: 'muted small' });
    const statusChip = h('span', { class: 'badge' });
    const micBox = h('div');
    const chips = h('div', { class: 'kv', style: { gridTemplateColumns: '1fr 1fr 1fr' } });
    const dur = h('p', { class: 'muted small' });
    const sp = spark();
    const notes = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } });
    const bands = h('div', { class: 'bands' });
    const safetyBox = h('div');
    put(body, 
      h('section', { class: 'card neon acc-yellow', style: { display: 'flex', flexDirection: 'column', gap: '12px' } },
        micBox,
        h('div', { class: 'gauge' }, g.el, h('div', { class: 'g-read' }, val, modeLbl)),
        h('div', { style: { display: 'flex', justifyContent: 'center' } }, statusChip),
        chips, sp.el, dur),
      notes,
      h('section', { class: 'card' }, h('h2', { text: t('sn_sound_title') }), h('p', { class: 'muted small', text: t('sn_sound_sub') }), h('div', { style: { height: '10px' } }), bands),
      safetyBox);

    const modeValue = (m) => {
      if (m === 'live') return fast;
      if (m === 'average') return SES.leqValue(leq);
      return Number.isFinite(leq.max) ? leq.max : null;
    };
    const fmt = (v) => (v == null ? '—' : num(lvl(v), 1));

    redraw = () => {
      // mikrofon denetimi
      const btn = mic === 'running'
        ? h('button', { class: 'btn block', type: 'button', onclick: pauseMic }, icon('Pause', 20), t('sn_mic_pause'))
        : h('button', { class: 'btn primary block', type: 'button', onclick: startMic, disabled: mic === 'missing' ? true : null }, icon('Mic', 20), t('sn_mic_turn_on'));
      const err = { missing: 'sn_mic_missing', denied: 'sn_mic_denied', failed: 'sn_mic_failed' }[mic];
      put(micBox, btn, h('p', { class: 'muted small', style: { marginTop: '8px' }, text: t('sn_mic_why') }),
        err ? h('div', { style: { marginTop: '8px' } }, notice('err', 'MicOff', null, t(err))) : null,
        mic === 'denied' && native.isNative ? h('button', { class: 'btn block', type: 'button', style: { marginTop: '8px' }, onclick: () => native.openAppSettings(), text: t('sn_mic_open_settings') }) : null);
      const mode = SN.mode;
      const v = modeValue(mode);
      const frac = v == null ? 0 : calibrated() ? (lvl(v) - SES.GAUGE.dbMin) / (SES.GAUGE.dbMax - SES.GAUGE.dbMin) : (v - SES.GAUGE.dbfsMin) / (SES.GAUGE.dbfsMax - SES.GAUGE.dbfsMin);
      g.set(frac);
      put(val, fmt(v), h('small', { text: unit() }));
      modeLbl.textContent = t(`sn_mode_${mode}`);
      if (!calibrated()) { statusChip.className = 'badge'; statusChip.textContent = t('sn_status_not_calibrated'); }
      else if (v != null) {
        const st = SES.status(lvl(v));
        statusChip.className = `badge ${st === 'normal' ? 'ok' : 'warn'}`;
        statusChip.textContent = t(`sn_status_${st}`);
      } else { statusChip.className = 'badge'; statusChip.textContent = '—'; }
      const chip = (m, k) => h('div', { class: 'press', role: 'button', tabindex: '0', 'aria-pressed': String(SN.mode === m),
        style: SN.mode === m ? { boxShadow: '0 0 0 1px var(--acc)' } : null,
        onclick: () => { SN.mode = m; changed('sensors'); redraw(); } }, h('small', { text: t(k) }), h('span', { class: 'value', text: fmt(modeValue(m)) }));
      put(chips, chip('live', 'sn_chip_live'), chip('average', 'sn_chip_average'), chip('max', 'sn_chip_max'));
      const lo = calibrated() ? 20 : -90, hi = calibrated() ? 120 : 0;
      sp.set(hist.map(lvl), lo, hi);
      const d = SES.duration(leq.seconds);
      dur.textContent = leq.seconds > 0 ? `${t('sn_mode_average')} · ${t(`sn_duration_${d.unit === 'h' ? 'hours' : d.unit === 'min' ? 'minutes' : 'seconds'}`, num(d.value, d.unit === 'h' ? 1 : 0))}` : '';
      // notlar
      const n = [];
      if (!calibrated()) n.push(h('div', { class: 'notice warn' }, icon('Info', 20), h('div', null, h('b', { text: t('sn_not_calibrated_title') }), h('p', { text: t('sn_not_calibrated_text') }),
        h('button', { class: 'btn', type: 'button', style: { marginTop: '8px' }, onclick: calibrationSheet, text: t('sn_calibrate') }))));
      if (clipping && mic === 'running') n.push(notice('err', 'TriangleAlert', null, t('sn_clipping_warning')));
      if (mic === 'running' && source && source !== 'unprocessed') n.push(notice('info', 'Info', null, t('sn_source_note')));
      put(notes, ...n);
      // bantlar
      const cur = calibrated() && fast != null ? SES.band(lvl(fast)) : null;
      let lo2 = 0;
      put(bands, ...SES.BANDS.map((b) => {
        const range = b.below === Infinity ? `≥ ${lo2}` : `${lo2}–${b.below}`; lo2 = b.below;
        return h('div', { class: `band${cur === b.id ? ' on' : ''}` }, h('span', { class: 'range', text: `${range} dB` }),
          h('div', null, h('b', { text: cur === b.id ? t(`sn_band_${b.id}_title`) : t(`sn_band_${b.id}`) }), h('p', { class: 'muted small', text: t(`sn_band_${b.id}_text`) })));
      }));
      // güvenlik
      const s = [];
      if (!calibrated()) s.push(notice('info', 'Ear', null, t('sn_safe_needs_calibration')));
      else if (fast != null) {
        const db = lvl(SES.leqValue(leq) ?? fast), sf = SES.safety(db);
        const text = sf === 'risk' ? (() => { const d2 = SES.duration(SES.nioshSeconds(db)); return t('sn_safe_text_risk', num(db, 0), t(`sn_duration_${d2.unit === 'h' ? 'hours' : d2.unit === 'min' ? 'minutes' : 'seconds'}`, num(d2.value, d2.unit === 'h' ? 1 : 0))); })() : t(`sn_safe_text_${sf}`);
        s.push(notice(sf === 'safe' ? 'ok' : sf === 'caution' ? 'warn' : 'err', sf === 'safe' ? 'ShieldCheck' : 'Ear', t(`sn_safe_title_${sf}`), text));
      }
      s.push(h('p', { class: 'muted small', style: { marginTop: '8px' }, text: t('sn_safe_note') }));
      put(safetyBox, ...s);
    };
    redraw();
  }

  function startMic() {
    if (stopMic) return;
    native.permission('microphone').then(async (p) => {
      if (p === 'unavailable' && !native.isNative) { mic = 'missing'; redraw(); return; }
      if (p !== 'granted') p = await native.permission('microphone', true);
      if (p !== 'granted') { mic = p === 'unavailable' ? 'missing' : 'denied'; redraw(); return; }
      mic = 'running'; clipping = false;
      reklam.mesgul('mikrofon', true);
      native.keepAwake(true);
      stopMic = native.sound((e) => {
        fast = e.fast; clipping = e.clipping; source = e.source;
        leq = SES.leqAdd(leq, e.block, e.seconds, e.fast);
        if (calLeq) calLeq = SES.leqAdd(calLeq, e.block, e.seconds, e.fast);
        hist.push(e.fast); if (hist.length > 600) hist.shift();
        SN.lastSoundDb = Math.round(lvl(e.fast) * 10) / 10; SN.lastSoundUnit = calibrated() ? 'dB' : 'dBFS'; SN.lastSoundAt = Date.now();
        schedule();
      }, (why) => { haltMic(); mic = why; redraw(); });
      redraw();
    });
  }
  function haltMic() {
    if (stopMic) { stopMic(); stopMic = null; changed('sensors'); }
    reklam.mesgul('mikrofon', false);
    native.keepAwake(false);
  }
  function pauseMic() { haltMic(); mic = 'idle'; redraw(); }

  function calibrationSheet() {
    let ref = 60;
    calLeq = SES.leqStart();
    const phone = h('span', { class: 'value' });
    const wait = h('p', { class: 'small' });
    const refVal = h('span', { class: 'value' });
    const msg = h('div');
    const step = (d) => { ref = Math.round(Math.min(SES.CALIB.refMax, Math.max(SES.CALIB.refMin, ref + d)) * 10) / 10; refVal.textContent = `${num(ref, 1)} dB(A)`; };
    step(0);
    const sb = (d, label) => h('button', { class: 'btn', type: 'button', onclick: () => step(d), text: label });
    const apply = () => {
      const r = SES.calibrationOffset(ref, SES.leqValue(calLeq));
      if (!r.ok) { put(msg, notice('err', 'TriangleAlert', null, t('sn_cal_failed'))); return; }
      SN.offsetDb = r.offset; changed('sensors');
      toast(t('sn_cal_done')); sh.close(); build();
    };
    const applyBtn = h('button', { class: 'btn primary block', type: 'button', onclick: apply, text: t('sn_cal_apply') });
    let timer = null;
    const tick = () => {
      if (mic !== 'running') {
        phone.textContent = '—'; wait.textContent = t('sn_cal_needs_mic'); applyBtn.disabled = true; return;
      }
      const v = SES.leqValue(calLeq);
      phone.textContent = v == null ? '—' : `${num(v, 1)} dBFS(A)`;
      const left = Math.max(0, Math.ceil(SES.CALIB.minSeconds - calLeq.seconds));
      wait.textContent = left > 0 ? t('sn_cal_wait', left) : '';
      applyBtn.disabled = left > 0;
    };
    const sh = sheet(t('sn_cal_title'), [
      h('p', { text: t('sn_cal_text') }),
      mic !== 'running' ? h('button', { class: 'btn block', type: 'button', onclick: () => { startMic(); calLeq = SES.leqStart(); }, text: t('sn_mic_turn_on') }) : null,
      h('div', { class: 'kv' }, h('div', null, h('small', { text: t('sn_cal_phone_now') }), phone)),
      wait,
      h('small', { class: 'muted', text: t('sn_cal_reference') }),
      h('div', { class: 'stepper four' }, sb(-1, '−1'), sb(-0.1, `−${num(0.1, 1)}`), refVal, sb(0.1, `+${num(0.1, 1)}`), sb(1, '+1')),
      msg, applyBtn,
      calibrated() ? h('button', { class: 'btn ghost block', type: 'button', onclick: () => { SN.offsetDb = null; changed('sensors'); sh.close(); build(); }, text: t('sn_cal_reset') }) : null,
    ], { cls: 'acc-yellow', onClose: () => { clearInterval(timer); calLeq = null; } });
    tick(); timer = setInterval(tick, 250);
  }

  // ================= ışık
  function buildLight() {
    const g = gaugeSvg();
    const zoneColor = { very_dark: 'var(--text3)', dim: 'var(--amber)', normal: 'var(--yellow)', bright: 'var(--orange)', very_bright: 'var(--orange2)' };
    g.zones(ISIK.GAUGE_MARKS.map((m) => ({ from: m.from, to: m.to, color: zoneColor[m.id] })));
    g.labels(ISIK.GAUGE_TICKS.map((x) => [ISIK.gauge(x), x === 1000 ? '1000+' : String(x)]));
    const val = h('div', { class: 'big' });
    const levelTxt = h('div', { class: 'level-state ok' });
    const chips = h('div', { class: 'kv', style: { gridTemplateColumns: '1fr 1fr 1fr' } });
    const sp = spark();
    const cards = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } });
    const marks = h('div', { class: 'chips', style: { justifyContent: 'center' } });
    const state = h('div');
    put(body, state,
      h('section', { class: 'card neon acc-yellow', style: { display: 'flex', flexDirection: 'column', gap: '12px' } },
        h('div', null, h('h2', { text: t('sn_light_title') }), h('p', { class: 'muted small', text: t('sn_light_sub') })),
        h('div', { class: 'gauge' }, g.el, h('div', { class: 'g-read' }, val, levelTxt)), marks, chips, sp.el),
      cards);
    redraw = () => {
      put(state, light === 'missing' ? notice('err', 'Sun', null, t('sn_light_missing')) : light === 'waiting' ? notice('info', 'Clock', null, t('sn_light_waiting')) : '');
      const live = light === 'live' && lux != null;
      g.set(live ? ISIK.gauge(lux) : 0);
      const f = (x) => (x == null || !Number.isFinite(x) ? '—' : num(x, x < 10 ? 1 : 0));
      put(val, f(live ? lux : null), h('small', { text: t('sn_light_unit') }));
      const lv = live ? ISIK.level(lux) : null;
      levelTxt.textContent = lv ? t(`sn_level_${lv}`) : '';
      put(marks, ...ISIK.GAUGE_MARKS.map((m) => h('span', { class: `badge${lv === m.id ? ' warn' : ''}`, text: t(`sn_mark_${m.id}`) })));
      const avg = luxStats.n ? luxStats.sum / luxStats.n : null;
      const cell = (k, v) => h('div', null, h('small', { text: t(k) }), h('span', { class: 'value', text: f(v) }));
      put(chips, cell('sn_chip_live', live ? lux : null), cell('sn_chip_average', avg), cell('sn_chip_max', Number.isFinite(luxStats.max) ? luxStats.max : null));
      sp.set(luxHist.map(ISIK.gauge), 0, 1);
      if (!live) { put(cards, h('div', { class: 'notice' }, icon('Lightbulb', 20), h('div', null, h('b', { text: t('sn_light_tip_title') }), h('p', { text: t('sn_light_tip_text') })))); return; }
      const off = ISIK.office(lux), pl = ISIK.plants(lux);
      put(cards, 
        notice(off === 'ok' ? 'ok' : 'warn', 'Laptop', t(`sn_office_${off}_title`), t(`sn_office_${off}_text`)),
        notice(pl === 'medium' || pl === 'bright' ? 'ok' : 'warn', 'Sprout', t(`sn_plants_${pl}_title`), t(`sn_plants_${pl}_text`)),
        h('div', { class: 'notice' }, icon('Lightbulb', 20), h('div', null, h('b', { text: t('sn_light_tip_title') }), h('p', { text: t('sn_light_tip_text') }))));
    };
    redraw();
  }

  function startLight() {
    if (stopLight) return;
    stopLight = native.light((s) => {
      if (!s) { light = 'missing'; schedule(); return; }
      light = 'live'; lux = s.lux;
      luxStats = { sum: luxStats.sum + lux, n: luxStats.n + 1, max: Math.max(luxStats.max, lux) };
      luxHist.push(lux); if (luxHist.length > 600) luxHist.shift();
      SN.lastLux = lux; SN.lastLuxAt = Date.now();
      schedule();
    });
  }
  const haltLight = () => { if (stopLight) { stopLight(); stopLight = null; } };

  function build() {
    tabs.set(tab);
    if (tab === 'sound') { buildSound(); } else { buildLight(); startLight(); }
  }
  build();
  startLight();
  return {
    el,
    pause: () => { haltLight(); if (mic === 'running') pauseMic(); },
    resume: () => { startLight(); },
    destroy: () => { haltLight(); haltMic(); if (raf) cancelAnimationFrame(raf); changed('sensors'); },
  };
}
