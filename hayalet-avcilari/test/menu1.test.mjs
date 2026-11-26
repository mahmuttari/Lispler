// Hayalet Avcıları MENU1: kısa yatay ekranda ana menü iki sütun, kaymadan sığar.
// TR 844×390 ve AR 740×360. Dikey düzen değişmez. Çalıştırma: node test/menu1.test.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WWW = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const EKRAN = path.join(path.dirname(fileURLToPath(import.meta.url)), 'ekran');
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
  p.on('pageerror', (e) => hatalar.push(`${dil}: ${e.message}`));
  await p.addInitScript((d) => {
    localStorage.setItem('hayaletAvcilariDil', d);
    localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9');
    localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1');
  }, dil);
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof startGame === 'function');
  await p.evaluate(() => { localStorage.setItem(VERSION_KEY, APP_VERSION); save.playerName = save.playerName || 'Deniz'; goToMenu(); });
  await p.waitForTimeout(120);
  return p;
}

try {
  fs.mkdirSync(EKRAN, { recursive: true });
  for (const [dil, en, boy] of [['tr', 844, 390], ['ar', 740, 360]]) {
    const p = await sayfa(dil, en, boy);
    const o = await p.evaluate(() => {
      const m = document.querySelector('#screen-menu .menu-content');
      const sol = document.querySelector('#screen-menu .menu-sol').getBoundingClientRect();
      const sag = document.querySelector('#screen-menu .menu-sag').getBoundingClientRect();
      const yuk = (sel) => [...document.querySelectorAll(sel)].map((e) => Math.round(e.getBoundingClientRect().height)).filter((h) => h > 0);
      const fs = (sel) => { const e = document.querySelector(sel); return e ? parseFloat(getComputedStyle(e).fontSize) : 0; };
      return {
        kayma: m.scrollHeight - m.clientHeight,
        yatayTasma: document.documentElement.scrollWidth - innerWidth,
        ikiSutun: Math.abs(sol.top - sag.top) < 120 && (sol.right <= sag.left + 1 || sag.right <= sol.left + 1),
        kisayol: yuk('#screen-menu .menu-buttons > .btn'),
        altSatir: yuk('#screen-menu .menu-footer-row .btn'),
        oyna: yuk('#screen-menu .btn-play'),
        fontlar: [fs('#screen-menu .title-small'), fs('#screen-menu .resource'), fs('#screen-menu .character-name'), fs('#screen-menu .character-stats'), fs('#screen-menu .menu-buttons > .btn')],
      };
    });
    sina(`yatay menü kaymadan sığar (${dil}, ${en}×${boy})`, () => {
      assert.equal(o.yatayTasma, 0); assert.ok(o.kayma <= 1, `kayma ${o.kayma}`); assert.equal(o.ikiSutun, true);
    });
    sina(`yatay menüde dokunma alanları en az 44 px (${dil})`, () => {
      for (const h of [...o.kisayol, ...o.altSatir, ...o.oyna]) assert.ok(h >= 44, String(h));
    });
    sina(`yatay menüde yazı en az 12 px (${dil})`, () => {
      for (const f of o.fontlar) assert.ok(f >= 12, String(f));
    });
    await p.screenshot({ path: path.join(EKRAN, `menu1-yatay-${dil}.png`) });
    await p.close();
  }

  const q = await sayfa('tr', 390, 844);
  const dikey = await q.evaluate(() => {
    const m = document.querySelector('#screen-menu .menu-content');
    const sol = document.querySelector('#screen-menu .menu-sol').getBoundingClientRect();
    const sag = document.querySelector('#screen-menu .menu-sag').getBoundingClientRect();
    return { altAlta: sag.top >= sol.bottom - 1, yatayTasma: document.documentElement.scrollWidth - innerWidth };
  });
  sina('dikey düzen değişmez: avcı ve düğmeler alt alta', () => {
    assert.equal(dikey.altAlta, true); assert.equal(dikey.yatayTasma, 0);
  });
  await q.close();

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
