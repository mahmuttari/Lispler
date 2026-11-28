// Hayalet Avcıları BAS1: evlere giden basamak taşları kaotik dizilir — çevrimdışı sınama.
// Çalıştırma: node test/bas1.test.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const WWW = path.join(KOK, 'www');
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
try {
  const p = await b.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript(() => {
    localStorage.setItem('hayaletAvcilariDil', 'tr');
    localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9');
    localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1');
  });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof startGame === 'function' && typeof zeminKatmaniKur === 'function');

  const sonuc = await p.evaluate(async () => {
    const out = [];
    for (const lv of [1, 4, 6, 8]) {
      if (game.running) endGame(false);
      startGame(); game.paused = true; game.level = lv; buildWalls(); buildWaters(); buildHazards();
      zeminKatmaniKur();
      const z = game._zeminKatmani || {};
      for (const yol of (z.patikalar || [])) {
        const q = yol.noktalar, a = q[0], b = q[q.length - 1];
        const L = Math.hypot(b.x - a.x, b.y - a.y);
        const t1 = basamakNoktalari(yol), t2 = basamakNoktalari(yol);
        const ux = (b.x - a.x) / L, uy = (b.y - a.y) / L;
        const yan = t1.map((s) => Math.abs((s.x - a.x) * -uy + (s.y - a.y) * ux));
        const ana = t1.filter((s) => s.boy >= 18);
        const ara = [];
        for (let i = 1; i < ana.length; i++) ara.push(Math.hypot(ana[i].x - ana[i - 1].x, ana[i].y - ana[i - 1].y));
        const ort = ara.reduce((s, v) => s + v, 0) / (ara.length || 1);
        const sd = Math.sqrt(ara.reduce((s, v) => s + (v - ort) ** 2, 0) / (ara.length || 1));
        out.push({
          lv, L: Math.round(L), n: t1.length, ayni: JSON.stringify(t1) === JSON.stringify(t2),
          yanMax: Math.max(0, ...yan), cv: ort ? sd / ort : 0,
          boylar: new Set(t1.map((s) => Math.round(s.boy))).size,
          acilar: new Set(t1.map((s) => Math.round(s.aci * 10))).size,
          engelde: t1.filter((s) => collidesWaters(s.x, s.y, 2) || collidesWalls(s.x, s.y, 2)).length,
        });
      }
    }
    return out;
  });
  const uzun = sonuc.filter((r) => r.L >= 90 && r.n >= 4);
  sina(`patika bulundu (${sonuc.length} patika, ${uzun.length} uzun)`, () => assert.ok(uzun.length >= 3, JSON.stringify(sonuc)));
  sina('aynı patika her seferinde aynı taşları verir (belirlenimci)', () => assert.ok(sonuc.every((r) => r.ayni)));
  sina('taşlar düz çizgide değil: uzun patikada yana en az 10 px sapan taş var', () => {
    for (const r of uzun) assert.ok(r.yanMax >= 10, JSON.stringify(r));
  });
  sina('aralıklar düzensiz (ortalama değişkenlik katsayısı > 0,15, hiçbiri < 0,06)', () => {
    const ort = uzun.reduce((s, r) => s + r.cv, 0) / uzun.length;
    assert.ok(ort > 0.15, String(ort));
    for (const r of uzun) assert.ok(r.cv > 0.06, JSON.stringify(r));
  });
  sina('boy ve açı taştan taşa değişir', () => { for (const r of uzun) { assert.ok(r.boylar >= 3, JSON.stringify(r)); assert.ok(r.acilar >= 3, JSON.stringify(r)); } });
  sina('suya ya da engele taş konmaz', () => { for (const r of sonuc) assert.equal(r.engelde, 0, JSON.stringify(r)); });

  if (process.env.EKRAN) {
    await p.evaluate(() => { const yol = (game._zeminKatmani.patikalar || [])[0]; if (yol) { const q = yol.noktalar[0]; game.player.x = q.x; game.player.y = q.y; } render(); });
    await p.screenshot({ path: process.env.EKRAN });
  }
  sina('sayfa hatası yok', () => assert.deepEqual(hatalar, []));
} finally {
  await b.close(); sunucu.close();
}
console.log(sonuclar.join('\n'));
const kalan = sonuclar.filter((s) => s.startsWith('✗')).length;
console.log(kalan ? `${kalan} sınama başarısız` : `TAMAM: ${sonuclar.length} sınama`);
process.exitCode = kalan ? 1 : 0;
