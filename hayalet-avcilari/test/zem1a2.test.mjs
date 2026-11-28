// Hayalet Avcıları: zemin katmanı 2 (ZEM1A2) — alan çeşitliliği, patikalar, klasik döngü.
// Çalıştırma: node test/zem1a2.test.mjs
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
  await p.waitForFunction(() => typeof startGame === 'function' && typeof zeminKatmaniKur === 'function');

  await p.evaluate(() => {
    window.__kur = (yolculuk = true) => {
      if (game.running) endGame(false);
      online.mode = null; online.cachedRoom = null; online._yjYok = false;
      startGame();
      game.level = 1; game.dunyaTuru = false;
      if (!yolculuk) { online.mode = 'host'; online.cachedRoom = { players: {} }; }
      buildWalls(); buildWaters(); buildHazards();
      zeminKatmaniKur();
      game.paused = true;
      game.ghosts = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
      game.camera.x = game.player.x - game.W / 2; game.camera.y = game.player.y - game.H / 2;
      return game;
    };
    window.__kenarUzaklik = (x, y, o) => {
      const ex = Math.max(o.x, Math.min(o.x + o.w, x));
      const ey = Math.max(o.y, Math.min(o.y + o.h, y));
      return Math.hypot(x - ex, y - ey);
    };
    window.__denetle = (yolculuk) => {
      const g = __kur(yolculuk);
      const z = g._zeminKatmani;
      const lekeler = (z.lekeler || []).map((l) => ({ x: l.x, y: l.y, r: l.r, suda: collidesWaters(l.x, l.y, 0) }));
      const objeler = g.walls.filter((o) => o.tur === 'obje1' || o.tur === 'obje2');
      const patikalar = z.patikalar || [];
      const patika = patikalar.map((y) => {
        const a = y.noktalar[0], son = y.noktalar[y.noktalar.length - 1];
        let suda = false;
        const L = Math.hypot(son.x - a.x, son.y - a.y), n = Math.max(2, Math.ceil(L / 16));
        for (let i = 0; i <= n; i++) {
          const t = i / n;
          if (collidesWaters(a.x + (son.x - a.x) * t, a.y + (son.y - a.y) * t, 0)) { suda = true; break; }
        }
        const en = objeler.length ? Math.min(...objeler.map((o) => __kenarUzaklik(son.x, son.y, o))) : Infinity;
        return { suda, en, gen: y.gen };
      });
      const dongu = z.yollar.find((y) => y.dongu);
      return {
        dunya: { w: g.worldW, h: g.worldH },
        lekeler, patika, patikaSayi: patikalar.length,
        objeSayi: objeler.length,
        dongu: dongu ? { n: dongu.noktalar.length, kapali: Math.hypot(dongu.noktalar[0].x - dongu.noktalar[dongu.noktalar.length - 1].x, dongu.noktalar[0].y - dongu.noktalar[dongu.noktalar.length - 1].y) < 0.01 } : null,
        yollar: z.yollar.length,
      };
    };
  });

  const yolculuk = await p.evaluate(() => __denetle(true));
  console.log('Yolculuk:', JSON.stringify({ lekeler: yolculuk.lekeler.length, patikaSayi: yolculuk.patikaSayi, objeSayi: yolculuk.objeSayi, yollar: yolculuk.yollar }));
  sina('yolculuk: zemin lekeleri var', () => {
    assert.ok(yolculuk.lekeler.length > 0, String(yolculuk.lekeler.length));
    assert.ok(yolculuk.lekeler.length >= Math.floor((yolculuk.dunya.w / 2000) * 6), String(yolculuk.lekeler.length));
  });
  sina('yolculuk: hiçbir leke su üstünde değil', () => {
    const suda = yolculuk.lekeler.filter((l) => l.suda);
    assert.deepEqual(suda, []);
  });
  sina('yolculuk: patikalar 38 px ve su geçmiyor', () => {
    assert.ok(yolculuk.patikaSayi <= 10, String(yolculuk.patikaSayi));
    assert.deepEqual(yolculuk.patika.filter((x) => x.suda), []);
    assert.deepEqual(yolculuk.patika.filter((x) => x.gen !== 38), []);
  });
  sina('yolculuk: patikalar engel kenarında bitiyor (≤ 12 px)', () => {
    for (const x of yolculuk.patika) assert.ok(x.en <= 12, String(x.en));
  });

  const klasik = await p.evaluate(() => __denetle(false));
  console.log('Klasik:', JSON.stringify({ lekeler: klasik.lekeler.length, patikaSayi: klasik.patikaSayi, objeSayi: klasik.objeSayi, yollar: klasik.yollar, dongu: klasik.dongu }));
  sina('klasik: kapalı döngü yolu var (6-8 nokta)', () => {
    assert.ok(klasik.dongu, 'döngü yok');
    assert.ok(klasik.dongu.kapali, 'döngü kapalı değil');
    assert.ok(klasik.dongu.n >= 7 && klasik.dongu.n <= 9, String(klasik.dongu.n));
  });
  sina('klasik: lekeler var ve su üstünde değil', () => {
    assert.ok(klasik.lekeler.length > 0, String(klasik.lekeler.length));
    assert.deepEqual(klasik.lekeler.filter((l) => l.suda), []);
  });
  sina('klasik: patikalar engel kenarında bitiyor (≤ 12 px), su geçmiyor', () => {
    assert.ok(klasik.patikaSayi <= 10, String(klasik.patikaSayi));
    for (const x of klasik.patika) { assert.ok(x.en <= 12, String(x.en)); assert.equal(x.suda, false); }
  });

  const cizim = await p.evaluate(() => {
    __kur(true);
    zeminKatmaniSil();
    const ctx = game.ctx;
    let sayi = 0;
    const eski = ctx.drawImage;
    ctx.drawImage = function (...a) { sayi++; return eski.apply(this, a); };
    try { for (let i = 0; i < 12; i++) zeminKatmaniCiz(ctx); } finally { ctx.drawImage = eski; }
    return { sayi, parca: game._zeminParcalari.size };
  });
  sina('zeminKatmaniCiz lekelerle birlikte parça çizer', () => {
    assert.ok(cizim.parca > 0, String(cizim.parca));
    assert.ok(cizim.sayi >= 1, String(cizim.sayi));
  });
} finally {
  await b.close(); sunucu.close();
}
for (const s of sonuclar) console.log(s);
const basarisiz = sonuclar.filter((s) => s.startsWith('✗')).length;
if (hatalar.length) { console.log('Sayfa hataları:', hatalar.join(' | ')); }
if (basarisiz || hatalar.length) { console.log(`${basarisiz} başarısız, ${hatalar.length} sayfa hatası`); process.exit(1); }
console.log(`Tümü geçti (${sonuclar.length})`);
