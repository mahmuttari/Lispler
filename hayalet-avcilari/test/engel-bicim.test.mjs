// Hayalet Avcıları: eğri hatlı, temaya özel engeller (3.13.0) — biçim, çarpışma, kılık ve aynılık sınaması.
// Biçim dikdörtgenin içinde; çarpışma biçimi izler (açılan köşeden geçilir, biçimin içinde çarpılır); kesişen iç bloklar
// duvar, diğerleri (i + bölüm) % 3; iki ayrı sayfa aynı bölümde aynı biçimi üretir; freeSpot biçime değmeyen yer bulur.
// Çalıştırma: node hayalet-avcilari/test/engel-bicim.test.mjs   (Playwright + Chromium gerekir; ağ ve Firebase gerekmez)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WWW = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);
const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.m4a': 'audio/mp4' };
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
async function sayfaAc(secenek = {}) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, ...secenek });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('hayaletAvcilariDil', 'tr'); localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9'); });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForTimeout(300);
  return p;
}
// Bir sayfada bölüm 1..n'in engel biçimleri (çevrimiçi kurucu: dünya merkezine göre, her cihazda aynı harita)
const biçimler = (p, n) => p.evaluate((n) => {
  online.mode = 'host';
  const out = [];
  for (let L = 1; L <= n; L++) {
    game.level = L; buildWalls(); buildWaters(); buildHazards();
    for (const liste of [game.walls, game.waters, game.spikes, game.lavas]) for (const o of liste) out.push({ x: o.x, y: o.y, tur: o.tur, tohum: o.tohum, bicim: o.bicim });
  }
  online.mode = null;
  return JSON.stringify(out);
}, n);

try {
  const p = await sayfaAc();

  // 1) Biçim (kıyı ve kenar payıyla) ve çarpışma parçaları dikdörtgenin içinde
  const kutu = await p.evaluate(() => {
    const TURLER = ['duvar', 'obje1', 'obje2', 'su', 'diken', 'lav'];
    const BOYUTLAR = [[80, 80], [180, 90], [90, 180], [180, 180]];
    const sinir = (q, b = 0) => q.t === 'd' ? [q.x - q.r - b, q.y - q.r - b, q.x + q.r + b, q.y + q.r + b]
      : q.t === 'e' ? [q.x - q.rx - b, q.y - q.ry - b, q.x + q.rx + b, q.y + q.ry + b] : [q.x - b, q.y - b, q.x + q.w + b, q.y + q.h + b];
    const tasan = [];
    for (let tema = 0; tema < 6; tema++) {
      for (const tur of TURLER) for (const [w, h] of BOYUTLAR) {
        const o = engelOlustur({ x: 300, y: 200, w, h }, tur, tema, 1000 + tema * 97 + w * 7 + h);
        const denetle = (q, b, ne) => { const [x0, y0, x1, y1] = sinir(q, b); if (x0 < -0.01 || y0 < -0.01 || x1 > w + 0.01 || y1 > h + 0.01) tasan.push(`${tema}/${tur}/${w}x${h} ${ne} ${q.t}`); };
        o.bicim.forEach((q) => denetle(q, o.pay, 'biçim+pay'));
        o.carpisma.forEach((q) => denetle(q, 0, 'çarpışma'));
      }
      for (const [yon, w, h] of [['ust', 1600, 30], ['alt', 1600, 30], ['sol', 30, 1200], ['sag', 30, 1200]]) {
        const o = engelOlustur({ x: 0, y: 0, w, h }, 'sinir', tema, 7, yon);
        for (const q of o.bicim.concat(o.carpisma)) {
          const [x0, y0, x1, y1] = sinir(q);
          const disari = yon === 'ust' ? y1 > h + 0.01 : yon === 'alt' ? y0 < -0.01 : yon === 'sol' ? x1 > w + 0.01 : x0 < -0.01;
          if (disari) tasan.push(`${tema}/sinir-${yon} ${q.t}`);
        }
      }
    }
    return tasan;
  });
  sina(`biçim ve çarpışma dikdörtgenin içinde (${kutu.length} taşma)`, () => { assert.deepEqual(kutu.slice(0, 5), []); });

  // 2) Çarpışma biçimi izler: biçimin içinde çarpılır; yama, göl ve plaka ailesinde en az bir köşe boş; dışarısı boş
  const carp = await p.evaluate(() => {
    const TURLER = ['duvar', 'obje1', 'obje2', 'su', 'diken', 'lav'];
    const sorun = [];
    for (let tema = 0; tema < 6; tema++) for (const tur of TURLER) for (const [w, h] of [[80, 80], [180, 90], [90, 180], [180, 180]]) {
      const o = engelOlustur({ x: 400, y: 300, w, h }, tur, tema, 5000 + tema * 31 + w + h * 3);
      let ic = null;
      for (let y = 0; y <= h && !ic; y += 3) for (let x = 0; x <= w && !ic; x += 3) if (engelUzaklik(o.carpisma, x, y) < -3) ic = { x, y };
      if (!ic || !engelCarpisir([o], o.x + ic.x, o.y + ic.y, 0)) sorun.push(`${tema}/${tur}/${w}x${h} içi çarpmıyor`);
      if (['yama', 'gol', 'plaka'].includes(o.aile)) {
        const koseler = [[2, 2], [w - 2, 2], [2, h - 2], [w - 2, h - 2]];
        if (!koseler.some(([x, y]) => !engelCarpisir([o], o.x + x, o.y + y, 1))) sorun.push(`${tema}/${tur}/${w}x${h} köşelerin hepsi dolu`);
      }
      if (engelCarpisir([o], o.x - 5, o.y + h / 2, 0) || engelCarpisir([o], o.x + w / 2, o.y + h + 5, 0)) sorun.push(`${tema}/${tur}/${w}x${h} dışarısı çarpıyor`);
    }
    return sorun;
  });
  sina(`çarpışma biçimi izler (${carp.length} sorun)`, () => { assert.deepEqual(carp.slice(0, 5), []); });

  // 3) Kılık: kesişen iç bloklar duvar; diğerleri (i + bölüm) % 3; 30 bölümde üç kılık da var
  const kilik = await p.evaluate(() => {
    online.mode = 'host';
    const sorun = [], gorulen = new Set();
    for (let L = 1; L <= 30; L++) {
      game.level = L; buildWalls();
      const ic = game.walls.slice(4);
      const kesisir = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
      ic.forEach((o, i) => {
        const beklenen = ic.some((b) => b !== o && kesisir(o, b)) ? 'duvar' : ['duvar', 'obje1', 'obje2'][(i + L) % 3];
        if (o.tur !== beklenen) sorun.push(`bölüm ${L} blok ${i}: ${o.tur} (beklenen ${beklenen})`);
        gorulen.add(o.tur);
      });
      game.walls.slice(0, 4).forEach((o, i) => { if (o.tur !== 'sinir' || o.yon !== ['ust', 'alt', 'sol', 'sag'][i]) sorun.push(`bölüm ${L} sınır ${i}: ${o.tur}/${o.yon}`); });
    }
    online.mode = null;
    return { sorun, gorulen: [...gorulen].sort() };
  });
  sina(`kılık kuralı (görülen: ${kilik.gorulen.join(', ')})`, () => {
    assert.deepEqual(kilik.sorun.slice(0, 5), []);
    assert.deepEqual(kilik.gorulen, ['duvar', 'obje1', 'obje2']);
  });

  // 4) Aynılık: iki ayrı sayfada aynı bölümlerin biçimleri birebir aynı
  const p2 = await sayfaAc();
  const [b1, b2] = await Promise.all([biçimler(p, 12), biçimler(p2, 12)]);
  sina(`iki sayfada 12 bölümün biçimleri aynı (${b1.length} bayt)`, () => { assert.ok(b1.length > 1000); assert.equal(b1, b2); });
  await p2.close();

  // 5) freeSpot'un bulduğu yer hiçbir engelin çarpışmasına değmez (Review Focus 4)
  const bos = await p.evaluate(() => {
    let kotu = 0;
    for (let L = 1; L <= 6; L++) {
      game.level = L; buildWalls(); buildWaters(); buildHazards();
      const engel = (a, b, r) => collidesWalls(a, b, r) || collidesWaters(a, b, r);
      for (let i = 0; i < 200; i++) {
        const y = freeSpot(40 + Math.random() * 1520, 40 + Math.random() * 1120, 22, engel);
        if (collidesWalls(y.x, y.y, 22) || collidesWaters(y.x, y.y, 22)) kotu++;
      }
    }
    return kotu;
  });
  sina(`freeSpot sonucu engele değmez (${bos} kötü)`, () => { assert.equal(bos, 0); });

  sina('sayfa hatası yok', () => { assert.deepEqual(hatalar, []); });
} catch (e) {
  sonuclar.push(`✗ akış yarıda kaldı: ${e.message.split('\n')[0]}`);
} finally {
  await b.close();
  sunucu.close();
}
sonuclar.forEach((s) => console.log(s));
const kalan = sonuclar.filter((s) => s.startsWith('✗'));
assert.equal(kalan.length, 0, `${kalan.length} sınama başarısız`);
console.log(`TAMAM: ${sonuclar.length} sınama`);
