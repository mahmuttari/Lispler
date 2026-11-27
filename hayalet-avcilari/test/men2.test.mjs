// Hayalet Avcıları MEN2: ana menü baştan düzen. Dört boyutta (TR 390×844, TR 360×740, AR 340×740, TR 844×390):
// düğme/sayaç/isim/istatistik üst üste binmez, süs hayaletler yazı ve düğmeye değmez, dokunma hedefi ≥ 44 px,
// her şey ekranın içinde, yatay taşma ve sayfa hatası yok. Çalıştırma: node test/men2.test.mjs
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

// Sayfada çalışır: ölçüm toplayıcı
function olc() {
  const gorunur = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
  const kutu = (e) => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
  const topla = (sel) => [...document.querySelectorAll(sel)].filter(gorunur).map((e) => ({ sel, id: e.id || e.className, ...kutu(e) }));
  const dugmeler = [
    ...topla('#screen-menu .btn-play'), ...topla('#screen-menu .menu-buttons > .btn'), ...topla('#screen-menu .menu-satir > .btn'),
    ...topla('#screen-menu .menu-footer-row .btn'), ...topla('#screen-menu .player-bar .btn-tiny'),
  ];
  const yazilar = [
    ...topla('#screen-menu .resource'), ...topla('#screen-menu .player-tag'),
    ...topla('#screen-menu .character-name'), ...topla('#screen-menu .character-stats'),
  ];
  const suslar = [...topla('#screen-menu .dekor-hayalet'), ...topla('#screen-menu .dekor-fener'), ...topla('#screen-menu .dekor-yarasa'), ...topla('#dekor-bakan')];
  const m = document.querySelector('#screen-menu .menu-content');
  const sag = document.querySelector('#screen-menu .menu-sag');
  return {
    dugmeler, yazilar, suslar,
    yatayTasma: document.documentElement.scrollWidth - innerWidth,
    kayma: m.scrollHeight - m.clientHeight,
    sagKayma: sag.scrollHeight - sag.clientHeight,
    cerceveVar: !!document.querySelector('#screen-menu .hunter-sahne .character-preview'),
    onizlemeKutusu: (() => { const c = getComputedStyle(document.getElementById('character-preview')); return { bg: c.backgroundImage, kenar: c.borderTopWidth, kose: c.borderTopLeftRadius }; })(),
    iw: innerWidth, ih: innerHeight,
  };
}
const kesisir = (a, c, pay = 0.5) => a.x < c.r - pay && c.x < a.r - pay && a.y < c.b - pay && c.y < a.b - pay;

try {
  for (const [dil, en, boy] of [['tr', 390, 844], ['tr', 360, 740], ['ar', 340, 740], ['tr', 844, 390]]) {
    const p = await b.newPage({ viewport: { width: en, height: boy }, hasTouch: true });
    p.on('pageerror', (e) => hatalar.push(`${dil} ${en}×${boy}: ${e.message}`));
    await p.addInitScript((d) => {
      localStorage.setItem('hayaletAvcilariDil', d);
      localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9');
      localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1');
    }, dil);
    await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
    await p.goto(adres, { waitUntil: 'load' });
    await p.waitForFunction(() => typeof startGame === 'function');
    await p.evaluate(() => { localStorage.setItem(VERSION_KEY, APP_VERSION); save.playerName = 'Mahmut'; save.para = 123456; save.elmas = 9999; save.zumrut = 1234; save.kupa = 321; goToMenu(); });
    await p.waitForTimeout(500);
    const etiket = `${dil} ${en}×${boy}`;

    // Süsler hareket ederken birkaç anda ölç
    const ornekler = [];
    for (let i = 0; i < 5; i++) { ornekler.push(await p.evaluate(olc)); await p.waitForTimeout(900); }
    const o = ornekler[0];

    sina(`düğmeler ≥ 44 px ve ekranın içinde (${etiket})`, () => {
      assert.ok(o.dugmeler.length >= 10, `düğme sayısı ${o.dugmeler.length}`);
      for (const d of o.dugmeler) {
        assert.ok(d.h >= 43.5 && d.w >= 43.5, `${d.id} ${Math.round(d.w)}×${Math.round(d.h)}`);
        assert.ok(d.x >= -0.5 && d.y >= -0.5 && d.r <= o.iw + 0.5 && d.b <= o.ih + 0.5, `${d.id} ekran dışı (${Math.round(d.x)},${Math.round(d.y)})-(${Math.round(d.r)},${Math.round(d.b)})`);
      }
    });
    sina(`sayaç, isim ve istatistik ekranın içinde (${etiket})`, () => {
      assert.ok(o.yazilar.length >= 7, `öge sayısı ${o.yazilar.length}`);
      for (const d of o.yazilar) {
        assert.ok(d.x >= -0.5 && d.y >= -0.5 && d.r <= o.iw + 0.5 && d.b <= o.ih + 0.5, `${d.sel} ${d.id} ekran dışı`);
      }
    });
    sina(`düğmeler, sayaçlar, isim ve istatistik üst üste binmez (${etiket})`, () => {
      const hepsi = [...o.dugmeler, ...o.yazilar];
      for (let i = 0; i < hepsi.length; i++) for (let j = i + 1; j < hepsi.length; j++) {
        assert.ok(!kesisir(hepsi[i], hepsi[j]), `${hepsi[i].sel}:${hepsi[i].id} × ${hepsi[j].sel}:${hepsi[j].id}`);
      }
    });
    sina(`süs hayalet/fener/yarasa yazı ve düğmeye değmez, 5 anda (${etiket})`, () => {
      for (const s of ornekler) {
        assert.ok(s.suslar.length >= 3, `süs sayısı ${s.suslar.length}`);
        for (const su of s.suslar) for (const d of [...s.dugmeler, ...s.yazilar]) {
          assert.ok(!kesisir(su, d), `${su.id} × ${d.sel}:${d.id}`);
        }
      }
    });
    sina(`yatay taşma ve dikey kayma yok (${etiket})`, () => {
      assert.equal(o.yatayTasma, 0);
      assert.ok(o.kayma <= 1, `sayfa kayması ${o.kayma}`);
      assert.ok(o.sagKayma <= 1, `düğme sütunu kayması ${o.sagKayma}`);
    });
    sina(`avcı önizlemesinde görünür kutu/çerçeve yok (${etiket})`, () => {
      assert.equal(o.cerceveVar, true);
      assert.equal(o.onizlemeKutusu.bg, 'none'); assert.equal(o.onizlemeKutusu.kenar, '0px'); assert.equal(o.onizlemeKutusu.kose, '0px');
    });
    await p.close();
  }
  sina('sayfa hatası yok', () => assert.deepEqual(hatalar, [], hatalar.join(' / ')));
} catch (e) {
  sonuclar.push(`✗ akış yarıda kaldı: ${e.message.split('\n')[0]}`);
} finally {
  await b.close();
  sunucu.close();
}
sonuclar.forEach((s) => console.log(s));
if (sonuclar.some((s) => s.startsWith('✗'))) process.exitCode = 1;
