// Hayalet Avcıları — Y2 denge ayarları sınaması.
// Ayar fonksiyonlarının tekdüzeliği ve botun geliştirmeli avcıyla 1. bölümü makul sürede bitirmesi sınanır.
// Çalıştırma: node test/y2.test.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { botKur } from './y2-denge.mjs';

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
try {
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript(() => {
    localStorage.setItem('hayaletAvcilariDil', 'tr');
    localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9');
    localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1');
  });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof startGame === 'function' && typeof yolculukHaritaKur === 'function');

  const ayar = await p.evaluate(() => {
    const A = YOLCULUK_AYAR;
    const kota = [], hiz = [], can = [], ates = [];
    for (let L = 1; L <= 12; L++) {
      const satir = [];
      for (let z = 1; z <= 6; z++) satir.push(A.kota(L, z));
      kota.push(satir);
    }
    for (let z = 1; z <= 6; z++) { hiz.push(A.zorluk.hiz(z)); can.push(A.zorluk.can(z)); ates.push(A.zorluk.ates(z)); }
    return { kota, hiz, can, ates };
  });
  sina('kota bölüm ve bölgeyle büyür (tekdüze)', () => {
    for (const satir of ayar.kota) for (let i = 1; i < satir.length; i++) assert.ok(satir[i] >= satir[i - 1], String(satir));
    for (let i = 1; i < ayar.kota.length; i++) for (let z = 0; z < 6; z++) assert.ok(ayar.kota[i][z] >= ayar.kota[i - 1][z]);
  });
  sina('zorluk: can/hız/ateş bölgeyle azalmaz (tekdüze)', () => {
    for (const dizi of [ayar.hiz, ayar.can, ayar.ates]) for (let i = 1; i < dizi.length; i++) assert.ok(dizi[i] >= dizi[i - 1], String(dizi));
  });

  await p.evaluate(botKur);
  const bot = await p.evaluate(() => window.__y2Calis({ levels: [1], seeds: [1], up: true }));
  sina('bot geliştirmeli avcıyla 1. bölümü 240 simülasyon saniyesinden kısa sürede bitirir', () => {
    const r = bot[0];
    assert.equal(r.tamam, true, `tamam=${r.tamam} süre=${r.sure} ölüm=${r.olum}`);
    assert.ok(r.sure < 240, `${r.sure} s`);
  });

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
