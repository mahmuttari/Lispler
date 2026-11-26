// Hayalet Avcıları: zemin katmanı (ZEM1A1) — çevrimdışı sınama.
// Yolculuk haritasında ana yol zemine çizilir: yol bantları, su/nehir dışında kalma,
// köprü ağızları ve arena girişine yakınlık, parça çizimi. Çalıştırma: node test/zem1a1.test.mjs
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
    window.__kur = (level = 1) => {
      if (game.running) endGame(false);
      online.mode = null;
      startGame();
      game.level = level;
      buildWalls(); buildWaters(); buildHazards();
      zeminKatmaniKur();
      game.paused = true;
      game.ghosts = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
      game.camera.x = game.player.x - game.W / 2; game.camera.y = game.player.y - game.H / 2;
      return game;
    };
    // Yol polyline'ları boyunca eşit aralıklı n örnek nokta
    window.__ornekler = (n = 15) => {
      const z = game._zeminKatmani, segs = [];
      let toplam = 0;
      for (const yol of z.yollar) {
        const q = yol.noktalar;
        for (let i = 0; i < q.length - 1; i++) {
          const L = Math.hypot(q[i + 1].x - q[i].x, q[i + 1].y - q[i].y);
          segs.push({ a: q[i], b: q[i + 1], L, bas: toplam });
          toplam += L;
        }
      }
      const out = [];
      for (let k = 0; k < n; k++) {
        const d = toplam * (k + 0.5) / n;
        let s = segs[segs.length - 1];
        for (const q of segs) if (d <= q.bas + q.L) { s = q; break; }
        const t = Math.max(0, Math.min(1, (d - s.bas) / (s.L || 1)));
        out.push({ x: s.a.x + (s.b.x - s.a.x) * t, y: s.a.y + (s.b.y - s.a.y) * t });
      }
      return out;
    };
    window.__denetle = (level) => {
      const g = __kur(level);
      const z = g._zeminKatmani, d = g._yolculukDuzen, A = YOLCULUK_AYAR;
      const ornekler = __ornekler(15);
      const yolMu = ornekler.map((q) => zeminKatmaniYolMu(q.x, q.y));
      const su = ornekler.map((q) => collidesWaters(q.x, q.y, 0));
      const nehir = ornekler.map((q) => d.zones.some((zz) => q.x > zz.gate.x0 && q.x < zz.gate.x1));
      const hedefler = [];
      for (const zz of d.zones) {
        hedefler.push({ x: zz.gate.x0 - 40, y: zz.gate.cy });
        hedefler.push({ x: zz.gate.x1 + 40, y: zz.gate.cy });
      }
      hedefler.push({ x: d.arena.x0 - 20, y: A.worldH / 2 });
      const noktalar = z.yollar.flatMap((y) => y.noktalar);
      const yakinlik = hedefler.map((h) => Math.min(...noktalar.map((q) => Math.hypot(q.x - h.x, q.y - h.y))));
      return { yollar: z.yollar.length, ornekSayi: ornekler.length, yolMu, su, nehir, hedefSayi: hedefler.length, yakinlik };
    };
  });

  for (const level of [1, 2]) {
    const r = await p.evaluate((L) => __denetle(L), level);
    sina(`yolculuk bölüm ${level}: zemin yolu tanımlı`, () => {
      assert.ok(r.yollar > 0, String(r.yollar));
      assert.equal(r.ornekSayi, 15);
    });
    sina(`yolculuk bölüm ${level}: 15 örnek nokta yol bandında`, () => {
      assert.deepEqual(r.yolMu, new Array(15).fill(true));
    });
    sina(`yolculuk bölüm ${level}: örnek noktalar suda ve nehir şeridinde değil`, () => {
      assert.deepEqual(r.su, new Array(15).fill(false));
      assert.deepEqual(r.nehir, new Array(15).fill(false));
    });
    sina(`yolculuk bölüm ${level}: yol köprü ağızları ve arena girişinden 50 px içinde geçer`, () => {
      assert.equal(r.yakinlik.length, r.hedefSayi);
      const uzak = r.yakinlik.filter((v) => v > 50);
      assert.deepEqual(uzak, []);
    });
  }

  const cizim = await p.evaluate(() => {
    __kur(1);
    zeminKatmaniSil();
    const ctx = game.ctx;
    let sayi = 0;
    const eski = ctx.drawImage;
    ctx.drawImage = function (...a) { sayi++; return eski.apply(this, a); };
    try { for (let i = 0; i < 12; i++) zeminKatmaniCiz(ctx); } finally { ctx.drawImage = eski; }
    return { sayi, parca: game._zeminParcalari.size };
  });
  sina('zeminKatmaniCiz birkaç çağrıda parça çizer', () => {
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
