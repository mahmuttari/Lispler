// Units tab: unit converter (all units of a category at once) and the constants table.
import { h, copyText } from './dom.js';
import { t, catName, unitName, groupName, constName } from './i18n.js';
import { S, save, ctxOf } from './state.js';
import { evaluate } from './engine.js';
import { fmtReal, htmlOf } from './format.js';
import { CATEGORIES, convert } from './units.js';
import { CONSTANT_GROUPS } from './constants.js';
import { bindPad, hidePad } from './pad.js';
import { toast } from './sheet.js';

export function mountUnits(root, { insertIntoCalc }) {
  const st = S.units = Object.assign({ page: 'units', cat: 'length', from: 0, value: '1' }, S.units || {});
  const body = h('div', { class: 'tabbody', style: 'display:flex;flex-direction:column;flex:1;min-height:0' });
  root.append(body);

  const fmt = v => fmtReal(v, { mode: 'norm', sig: 10, comma: S.settings.comma, pretty: true });

  function render() {
    hidePad();
    const tabs = h('div', { class: 'subseg' }, h('div', { class: 'seg' },
      h('button', { class: st.page === 'units' ? 'on' : '', text: t('u.units'), onclick: () => { st.page = 'units'; save(); render(); } }),
      h('button', { class: st.page === 'consts' ? 'on' : '', text: t('u.constants'), onclick: () => { st.page = 'consts'; save(); render(); } })));
    body.replaceChildren(tabs, st.page === 'units' ? unitsPage() : constsPage());
  }

  // ---------------------------------------------------------------- converter
  function unitsPage() {
    const cat = CATEGORIES.find(c => c.id === st.cat) || CATEGORIES[0];
    if (st.from >= cat.units.length) st.from = 0;
    const list = h('div');
    const cats = h('div', { class: 'hscroll' }, CATEGORIES.map(c => h('button', { class: 'pill' + (c.id === cat.id ? ' on' : ''), text: catName(c.id), onclick: () => { st.cat = c.id; st.from = 0; save(); render(); } })));
    const input = h('input', { class: 'field', type: 'text', value: st.value, 'aria-label': t('u.value'), style: 'flex:1;min-width:0' });
    const select = h('select', { class: 'field', style: 'flex:1;min-width:0;font-size:16px', 'aria-label': t('u.from'), onchange: () => { st.from = +select.value; save(); update(); } },
      cat.units.map((u, i) => h('option', { value: i, text: u.s + ' — ' + unitName(cat.id, i), selected: i === st.from })));

    function update() {
      st.value = input.value; save();
      list.replaceChildren();
      let x;
      try { x = evaluate(input.value, ctxOf({ complex: false })); } catch (e) { x = NaN; }
      if (typeof x !== 'number' || !Number.isFinite(x)) { list.append(h('div', { class: 'empty', text: t('u.badValue') })); return; }
      const from = cat.units[st.from];
      cat.units.forEach((u, i) => {
        const v = convert(x, from, u);
        list.append(h('div', { class: 'urow' + (i === st.from ? ' cur' : ''), onclick: () => { st.from = i; input.value = fmtReal(v, { mode: 'norm', sig: 12, comma: S.settings.comma }); st.value = input.value; save(); select.value = String(i); update(); } },
          h('div', { class: 'n' }, h('b', { text: u.s }), h('small', { text: unitName(cat.id, i) })),
          h('div', { class: 'v', html: htmlOf(fmt(v)) })));
      });
    }
    input.addEventListener('input', update);
    bindPad(input, () => input.blur());
    update();
    requestAnimationFrame(() => { const on = cats.querySelector('.on'); if (on) on.scrollIntoView({ inline: 'center', block: 'nearest' }); });
    return h('div', { class: 'scroll', style: 'padding-top:0' }, cats,
      h('div', { class: 'card' }, h('div', { class: 'row', style: 'flex-wrap:nowrap' }, input, select)), list);
  }

  // ---------------------------------------------------------------- constants
  function constsPage() {
    const list = h('div');
    const search = h('input', { class: 'field', type: 'search', placeholder: t('u.search'), style: 'height:42px;font:500 16px system-ui,sans-serif', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': t('u.search') });
    let open = null;
    function draw() {
      const q = search.value.trim().toLowerCase();
      list.replaceChildren();
      for (const g of CONSTANT_GROUPS) {
        const items = g.items.map((k, i) => ({ k, i, name: constName(g.id, i) })).filter(e => !q || (e.k.s + ' ' + e.name + ' ' + e.k.u).toLowerCase().includes(q));
        if (!items.length) continue;
        list.append(h('div', { class: 'sec', text: groupName(g.id) }));
        for (const { k, name } of items) {
          const id = g.id + k.s;
          list.append(h('div', { class: 'urow', onclick: () => { open = open === id ? null : id; draw(); } },
            h('div', { class: 'n' }, h('b', { text: k.s }), h('small', { text: name })),
            h('div', { class: 'v' }, h('span', { html: htmlOf(fmt(k.v)) }), k.u ? h('small', { style: 'display:block;font:12px var(--mono);color:var(--muted)', text: k.u }) : null)));
          if (open === id) {
            const plain = fmtReal(k.v, { mode: 'norm', sig: 15, comma: S.settings.comma });
            list.append(h('div', { class: 'kexp' },
              h('button', { class: 'pill', text: t('u.insert'), onclick: () => { insertIntoCalc(g.id === 'math' && (k.s === 'π' || k.s === 'e') ? k.s : plain); } }),
              h('button', { class: 'pill', text: t('copy'), onclick: async () => { toast((await copyText(plain)) ? t('copied') : t('copyFail')); } })));
          }
        }
      }
      if (!list.children.length) list.append(h('div', { class: 'empty', text: t('u.none') }));
    }
    search.addEventListener('input', () => { open = null; draw(); });
    draw();
    return h('div', { class: 'scroll', style: 'padding-top:0' }, search, list);
  }

  render();
  return { onShow() { }, refreshAll: render };
}
