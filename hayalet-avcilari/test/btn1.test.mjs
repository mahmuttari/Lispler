// Hayalet Avcıları: BTN1 — ekstra güç/silah düğmeleri sol tarafta dikey sütun.
// Sütun envanter düğmesinin üstünde, oyun içi güç izlerinden (HUD, joystick) uzak durur; Arapçada aynalanır.
// Çalıştırma: node hayalet-avcilari/test/btn1.test.mjs   (Playwright + Chromium; ağ ve Firebase gerekmez)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WWW = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);
const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2', '.webp': 'image/webp', '.m4a': 'audio/mp4' };
const sunucu = http.createServer((q, r) => {
  const f = path.join(WWW, decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html');
  if (!f.startsWith(WWW) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': TUR[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(0);
const adres = `http://127.0.0.1:${sunucu.address().port}/index.html`;

const sonuclar = [];
function sina(ad, fn) {
  try { fn(); sonuclar.push(`✓ ${ad}`); } catch (e) { sonuclar.push(`✗ ${ad}: ${e.message.split('\n')[0]}`); }
}
const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const hatalar = [];

async function sayfa(dil, en, boy) {
  const p = await b.newPage({ viewport: { width: en, height: boy }, hasTouch: true });
  p.on('pageerror', (e) => hatalar.push(`${dil} ${en}x${boy}: ${e.stack}`));
  await p.addInitScript((d) => { localStorage.setItem('hayaletAvcilariDil', d); localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1'); }, dil);
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof startGame === 'function' && typeof layoutWeaponBar === 'function');
  await p.evaluate(() => {
    localStorage.setItem(VERSION_KEY, APP_VERSION);
    save.playerName = save.playerName || 'Deniz';
    startGame();
    game.paused = true;
    const stok = ensureAmmoStock(game.player.charKey);
    Object.keys(WEAPONS).forEach((k) => { stok[k] = 5; });
    save.silahSecim = [];
    refreshWeaponBar();
  });
  return p;
}

async function stokAyarla(p, anahtarlar) {
  await p.evaluate((anahtarlar) => {
    const stok = ensureAmmoStock(game.player.charKey);
    Object.keys(WEAPONS).forEach((k) => { stok[k] = 0; });
    anahtarlar.forEach((k) => { stok[k] = 5; });
    save.silahSecim = [];
    refreshWeaponBar();
  }, anahtarlar);
}

async function olc(p) {
  return p.evaluate(async () => {
    const y = document.getElementById('yolculuk-hud');
    if (y) y.style.display = 'flex';
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    layoutWeaponBar();
    const k = (e) => {
      if (!e) return null;
      const r = e.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height, cx: (r.left + r.right) / 2, cy: (r.top + r.bottom) / 2 };
    };
    const gor = (sel) => {
      const e = document.querySelector(sel);
      if (!e) return null;
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden') return null;
      const r = e.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return null;
      return k(e);
    };
    const dugumler = [...document.querySelectorAll('#weapon-bar .weapon-slot, #weapon-bar .weapon-more')];
    return {
      w: innerWidth, h: innerHeight,
      bar: gor('#weapon-bar'),
      btns: dugumler.map((e, i) => ({ ...k(e), i, weapon: e.dataset.weapon || null, more: e.classList.contains('weapon-more') })),
      inv: k(document.getElementById('inv-btn')),
      joy: k(document.getElementById('joystick')),
      hudLeft: gor('.hud-left'), hudRight: gor('.hud-right'),
      yol: gor('#yolculuk-hud'), pause: gor('.pause-btn'), boss: gor('#boss-status'),
      rtl: getComputedStyle(document.documentElement).direction === 'rtl',
    };
  });
}

const kesisir = (a, c, tol = 0) =>
  a.right > c.left - tol && a.left < c.right + tol && a.bottom > c.top - tol && a.top < c.bottom + tol;

function sutunlaraAyir(btns) {
  const sutunlar = [];
  for (const d of btns) {
    const s = sutunlar.find((x) => Math.abs(x.sol - d.left) <= 4);
    if (s) s.dugmeler.push(d); else sutunlar.push({ sol: d.left, dugmeler: [d] });
  }
  return sutunlar;
}

function temelDogrula(o, etiket) {
  const { w, h, btns, inv, joy, rtl } = o;
  assert.ok(btns.length > 0, `${etiket}: düğme yok`);
  // (a) boyut, ekran içi, çakışma yok
  for (const d of btns) {
    assert.ok(d.width >= 44 && d.height >= 44, `${etiket}: boyut ${d.width}x${d.height}`);
    assert.ok(d.left >= 4 && d.right <= w - 4 && d.top >= 4 && d.bottom <= h - 4, `${etiket}: ekran kenarında`);
  }
  for (let i = 0; i < btns.length; i++) for (let j = i + 1; j < btns.length; j++) {
    assert.ok(!kesisir(btns[i], btns[j]), `${etiket}: düğmeler çakışıyor`);
  }
  // (b) HUD/joystick/envanter ile çakışma yok (4 px pay)
  for (const oge of [inv, joy, o.hudLeft, o.hudRight, o.yol, o.pause, o.boss]) {
    if (!oge) continue;
    for (const d of btns) assert.ok(!kesisir(d, oge, 4), `${etiket}: düğme HUD/joystick ile çakışıyor`);
  }
  // (c) taraf
  const sutunlar = sutunlaraAyir(btns);
  const ilkSutun = sutunlar[0].dugmeler;
  if (!rtl) {
    for (const d of btns) assert.ok(d.cx < w / 2, `${etiket}: düğme sol yarıda değil`);
    const sol = Math.min(...ilkSutun.map((d) => d.left));
    assert.ok(Math.abs(sol - inv.left) <= 2, `${etiket}: ilk sütun envanter soluna hizalı değil`);
    assert.ok(joy.cx > w / 2, `${etiket}: joystick sağ yarıda değil`);
  } else {
    for (const d of btns) assert.ok(d.cx > w / 2, `${etiket}: düğme sağ yarıda değil`);
    const sag = Math.max(...ilkSutun.map((d) => d.right));
    assert.ok(Math.abs(sag - inv.right) <= 2, `${etiket}: ilk sütun envanter sağına hizalı değil`);
    assert.ok(joy.cx < w / 2, `${etiket}: joystick sol yarıda değil`);
  }
  // (d) envanterin üstünde
  for (const d of btns) assert.ok(d.bottom <= inv.top - 6, `${etiket}: düğme envanterin üstünde değil`);
  // sütun sayısı ve sıra
  if (h >= w) assert.equal(sutunlar.length, 1, `${etiket}: dikeyde tek sütun olmalı (${sutunlar.length})`);
  else assert.ok(sutunlar.length <= 2, `${etiket}: yatayda en çok 2 sütun (${sutunlar.length})`);
  for (const s of sutunlar) {
    for (let i = 1; i < s.dugmeler.length; i++) {
      assert.ok(s.dugmeler[i].bottom <= s.dugmeler[i - 1].top + 0.5, `${etiket}: sütun sırası aşağıdan yukarı değil`);
    }
  }
  if (sutunlar.length === 2) {
    const a = sutunlar[0].sol, c = sutunlar[1].sol;
    if (rtl) assert.ok(c < a, `${etiket}: ikinci sütun merkeze doğru değil`);
    else assert.ok(c > a, `${etiket}: ikinci sütun merkeze doğru değil`);
  }
  const more = btns.find((d) => d.more);
  if (more) {
    assert.equal(btns[btns.length - 1].more, true, `${etiket}: "⋯" DOM sonunda değil`);
    if (h >= w) assert.ok(btns.every((d) => more.top <= d.top + 0.5), `${etiket}: "⋯" en üstte değil`);
  }
}

try {
  // (a)-(d) her görünüm ve dil
  for (const [dil, en, boy] of [
    ['tr', 390, 844], ['tr', 340, 740], ['tr', 844, 390], ['tr', 740, 360],
    ['ar', 390, 844], ['ar', 340, 740], ['ar', 844, 390], ['ar', 740, 360],
  ]) {
    const p = await sayfa(dil, en, boy);
    const o = await olc(p);
    sina(`${dil} ${en}x${boy}: düğmeler sol/sağ sütunda, ekran içinde, çakışmasız`, () => {
      assert.equal(o.btns.length, 4, `düğme sayısı ${o.btns.length}`);
      temelDogrula(o, `${dil} ${en}x${boy}`);
    });
    await p.close();
  }

  // (e) 1 ve 2 silah stoğu
  for (const [dil, en, boy] of [['tr', 390, 844], ['tr', 740, 360], ['ar', 390, 844], ['ar', 740, 360]]) {
    const p = await sayfa(dil, en, boy);
    await stokAyarla(p, ['bomba']);
    const bir = await olc(p);
    sina(`${dil} ${en}x${boy}: 1 silahta düğme kuralları`, () => {
      assert.equal(bir.btns.length, 1);
      assert.ok(!bir.btns.some((d) => d.more), '"⋯" olmamalı');
      temelDogrula(bir, `${dil} ${en}x${boy} 1`);
    });
    await stokAyarla(p, ['bomba', 'dondurma']);
    const iki = await olc(p);
    sina(`${dil} ${en}x${boy}: 2 silahta 2 slot + "⋯" kuralları`, () => {
      assert.equal(iki.btns.length, 3);
      assert.equal(iki.btns.filter((d) => d.more).length, 1);
      temelDogrula(iki, `${dil} ${en}x${boy} 2`);
    });
    await p.close();
  }

  // (f) ilk slota dokunma useWeapon'ı çağırır; "⋯" paneli yanında açar, ikinci dokunuş kapatır
  for (const [dil, en, boy] of [['tr', 390, 844], ['tr', 844, 390], ['ar', 390, 844], ['ar', 844, 390]]) {
    const p = await sayfa(dil, en, boy);
    const f = await p.evaluate(async () => {
      const ilk = document.querySelector('#weapon-bar .weapon-slot');
      window.__cagrilan = [];
      window.useWeapon = (k) => window.__cagrilan.push(k);
      ilk.click();
      const cagrilan = window.__cagrilan.slice();
      const more = document.querySelector('#weapon-bar .weapon-more');
      more.click();
      await new Promise((r) => requestAnimationFrame(r));
      const panel = document.getElementById('silah-sec-panel');
      const pr = panel.getBoundingClientRect();
      const acik = panel.classList.contains('open');
      const kutu = (e) => { const r = e.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }; };
      const dugmeler = [...document.querySelectorAll('#weapon-bar .weapon-slot, #weapon-bar .weapon-more')].map(kutu);
      more.click();
      return {
        anahtar: ilk.dataset.weapon, cagrilan, acik,
        panel: { left: pr.left, right: pr.right, top: pr.top, bottom: pr.bottom },
        dugmeler, kapandi: !panel.classList.contains('open'), w: innerWidth, h: innerHeight,
      };
    });
    sina(`${dil} ${en}x${boy}: slota dokunma useWeapon, "⋯" paneli yanda açılır/kapanır`, () => {
      assert.deepEqual(f.cagrilan, [f.anahtar], 'useWeapon çağrılmadı');
      assert.equal(f.acik, true);
      assert.equal(f.kapandi, true);
      assert.ok(f.panel.left >= 7.5 && f.panel.right <= f.w - 7.5 && f.panel.top >= 7.5 && f.panel.bottom <= f.h - 7.5, 'panel ekran dışında');
      for (const d of f.dugmeler) assert.ok(!kesisir(f.panel, d), 'panel sütun düğmesiyle çakışıyor');
    });
    await p.close();
  }

  // (g) envanter açılınca sütun gizlenir, kapanınca görünür
  {
    const p = await sayfa('tr', 390, 844);
    const g = await p.evaluate(async () => {
      toggleInventory();
      await new Promise((r) => requestAnimationFrame(r));
      const acikKen = getComputedStyle(document.getElementById('weapon-bar')).visibility;
      const acikSinif = document.getElementById('weapon-bar').classList.contains('inv-acik');
      toggleInventory();
      const kapaliKen = getComputedStyle(document.getElementById('weapon-bar')).visibility;
      const kapaliSinif = document.getElementById('weapon-bar').classList.contains('inv-acik');
      return { acikKen, acikSinif, kapaliKen, kapaliSinif };
    });
    sina('envanter açıkken sütun gizli, kapanınca görünür', () => {
      assert.equal(g.acikKen, 'hidden');
      assert.equal(g.acikSinif, true);
      assert.equal(g.kapaliKen, 'visible');
      assert.equal(g.kapaliSinif, false);
    });
    await p.close();
  }

  // (h) döndürme: 390x844 → 844x390 → 390x844 kuralları korur
  {
    const p = await sayfa('tr', 390, 844);
    for (const [en, boy] of [[844, 390], [390, 844]]) {
      await p.setViewportSize({ width: en, height: boy });
      await p.evaluate(() => window.dispatchEvent(new Event('resize')));
      const o = await olc(p);
      sina(`döndürme ${en}x${boy}: düğme kuralları korunur`, () => temelDogrula(o, `döndürme ${en}x${boy}`));
    }
    await p.close();
  }

  sina('sayfa hatası yok', () => { assert.deepEqual(hatalar, [], hatalar.join(' / ')); });
} catch (e) {
  sonuclar.push(`✗ akış yarıda kaldı: ${e.message.split('\n')[0]}`);
} finally {
  await b.close();
  sunucu.close();
}
sonuclar.forEach((s) => console.log(s));
if (hatalar.length) console.log(hatalar.join('\n'));
const kalan = sonuclar.filter((s) => s.startsWith('✗'));
assert.equal(kalan.length, 0, `${kalan.length} sınama başarısız`);
console.log(`TAMAM: ${sonuclar.length} sınama`);
