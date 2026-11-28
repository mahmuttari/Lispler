// Hayalet Avcıları K18: dikey duvarlar kendi resmiyle çizilir — çevrimdışı sınama.
// Çalıştırma: node test/k18.test.mjs
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
  await p.waitForFunction(() => [1, 2, 3, 4, 5, 6].every((n) => gorsel(`tema${n}-duvar-dikey`) && gorsel(`tema${n}-duvar`)), null, { timeout: 30000 });

  const sonuc = await p.evaluate(() => {
    const ciz = CanvasRenderingContext2D.prototype.drawImage, kayit = [];
    CanvasRenderingContext2D.prototype.drawImage = function (im, ...a) { kayit.push({ src: (im && im.src) || '', a }); return ciz.call(this, im, ...a); };
    const out = [];
    try {
      for (let tema = 0; tema < 6; tema++) {
        for (const [w, h, ad] of [[40, 160, 'dikey'], [44, 320, 'uzun'], [160, 40, 'yatay'], [60, 60, 'kare']]) {
          kayit.length = 0;
          const o = { x: 100, y: 100, w, h };
          const e = engelOlustur(o, 'duvar', tema, 1234 + tema);
          Object.assign(e, { x: 100, y: 100, w, h, tur: 'duvar', tema });
          engelBoya(document.createElement('canvas').getContext('2d'), e);
          const dikey = kayit.filter((k) => k.src.includes(`tema${tema + 1}-duvar-dikey`));
          const yatayR = kayit.filter((k) => /tema\d-duvar(\.|-\d)/.test(k.src) || (k.src.includes(`tema${tema + 1}-duvar`) && !k.src.includes('dikey')));
          // çizilen dilimlerin kapladığı dikey aralık
          let ust = Infinity, alt = -Infinity;
          for (const k of dikey) { const n = k.a.length; const y = n >= 8 ? k.a[5] : k.a[1], hh = n >= 8 ? k.a[7] : k.a[3]; ust = Math.min(ust, y); alt = Math.max(alt, y + hh); }
          out.push({ tema, ad, w, h, dikey: dikey.length, yatay: yatayR.length, ust, alt });
        }
      }
    } finally { CanvasRenderingContext2D.prototype.drawImage = ciz; }
    return out;
  });
  const sec = (ad) => sonuc.filter((r) => r.ad === ad);
  sina('dikey duvar (her tema) dikey resimle çizilir, yatay resim yığılmaz', () => {
    for (const r of [...sec('dikey'), ...sec('uzun')]) { assert.ok(r.dikey >= 1, JSON.stringify(r)); assert.equal(r.yatay, 0, JSON.stringify(r)); }
  });
  sina('dikey resim kutunun tamamını kaplar: üstten tabana, taşmadan', () => {
    for (const r of [...sec('dikey'), ...sec('uzun')]) { assert.ok(r.ust <= 0.6 && r.ust >= -1, JSON.stringify(r)); assert.ok(Math.abs(r.alt - r.h) <= 1, JSON.stringify(r)); }
  });
  sina('uzun duvarda üç dilim (başlık, yinelenen bant, taban): tek resim esnetilmez', () => {
    for (const r of sec('uzun')) assert.ok(r.dikey >= 3, JSON.stringify(r));
  });
  sina('yatay ve kareye yakın duvarlar eski yatay resimle çizilir', () => {
    for (const r of [...sec('yatay'), ...sec('kare')]) { assert.equal(r.dikey, 0, JSON.stringify(r)); assert.ok(r.yatay >= 1, JSON.stringify(r)); }
  });

  if (process.env.EKRAN) {
    await p.evaluate(() => {
      if (game.running) endGame(false);
      startGame(); game.level = 2; buildWalls(); buildWaters(); buildHazards(); game.ghosts = []; game.spawnTimer = 1e9;
      const v = game.walls.find((o) => o.tur === 'duvar' && o.h >= 1.3 * o.w);
      if (v) { game.player.x = v.x + v.w / 2 + 120; game.player.y = v.y + v.h / 2; }
      for (let k = 0; k < 20; k++) update(1 / 60); game.paused = true; render();
    });
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
