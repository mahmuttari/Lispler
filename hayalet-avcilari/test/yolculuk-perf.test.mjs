// Hayalet Avcıları: yolculuk haritası çizim/çarpışma başarımı — çevrimdışı sınama.
// Uzun haritada zemin yalnız kameranın gördüğü alanı boyar; çarpışma 400 px'lik sütun kovalarını kullanır
// (sonuç kaba kuvvetle aynı). Çalıştırma: node test/yolculuk-perf.test.mjs
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
  await p.waitForFunction(() => typeof startGame === 'function' && typeof yolculukHaritaKur === 'function');
  await p.evaluate(() => {
    window.__kur = (level = 1, tur = null) => {
      if (game.running) endGame(false);
      online.mode = null;
      startGame(tur ? { tur: true, ulke: ulkeKodla(tur).sira } : undefined);
      game.paused = true; game.ghosts = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
      game.player.invuln = 1e9; game.player.dead = false; game.player.dusus = null;
      game.level = level; buildWalls(); buildWaters(); buildHazards();
      game.ghosts = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
      return game;
    };
    // Kaba kuvvet: kova kullanmadan (eski davranış) aynı hesap
    window.__kabaCarpisir = (liste, x, y, r) => {
      for (const o of liste) {
        if (x + r <= o.x || x - r >= o.x + o.w || y + r <= o.y || y - r >= o.y + o.h) continue;
        if (!o.carpisma) {
          const cx = Math.max(o.x, Math.min(x, o.x + o.w)), cy = Math.max(o.y, Math.min(y, o.y + o.h));
          if (Math.hypot(x - cx, y - cy) < r) return true;
          continue;
        }
        if (engelUzaklik(o.carpisma, x - o.x, y - o.y) < r) return true;
      }
      return false;
    };
    window.__kabaMesafe = (liste, x, y, r) => {
      let m = Infinity;
      for (const o of liste) {
        if (x + r <= o.x || x - r >= o.x + o.w || y + r <= o.y || y - r >= o.y + o.h) continue;
        const d = o.carpisma ? engelUzaklik(o.carpisma, x - o.x, y - o.y) : parcaUzaklik({ t: "k", x: o.x, y: o.y, w: o.w, h: o.h, rr: 0 }, x, y);
        if (d < m) m = d;
      }
      return m;
    };
  });

  // 1) Zemin yalnız kamera alanını boyar (eskiden bütün 7200x1000 dünyayı boyuyordu)
  const dolgu = await p.evaluate(() => {
    __kur(3);
    const z = game._yolculukDuzen.zones[2];
    game.player.x = (z.x0 + z.gate.x0) / 2; game.player.y = game.worldH / 2;
    game.camera.x = game.player.x - game.W / 2; game.camera.y = game.player.y - game.H / 2;
    game.ghosts = []; game.pickups = []; game.projectiles = []; game.enemyProjectiles = []; game.effects = [];
    const kopya = CanvasRenderingContext2D.prototype.fillRect, buyuk = [];
    CanvasRenderingContext2D.prototype.fillRect = function (x, y, w, h) {
      if (w * h > game.W * game.H * 2) buyuk.push(Math.round(w * h));
      return kopya.apply(this, arguments);
    };
    try { render(); } finally { CanvasRenderingContext2D.prototype.fillRect = kopya; }
    return { buyuk, ekran: game.W * game.H, dunya: game.worldW * game.worldH };
  });
  sina('zemin bütün dünyayı değil kamerayı boyar', () => {
    assert.deepEqual(dolgu.buyuk, [], `büyük dolgular: ${dolgu.buyuk.join(",")} (ekran ${dolgu.ekran}, dünya ${dolgu.dunya})`);
  });

  // 2) Kovalı çarpışma/uzaklık kaba kuvvetle birebir aynı (yolculuk haritası, çok nokta)
  const esit = await p.evaluate(() => {
    let fark = 0, denendi = 0;
    for (const L of [1, 3, 6, 9, 12]) {
      __kur(L);
      for (const liste of [game.walls, game.waters, game.spikes, game.lavas]) {
        for (let i = 0; i < 120; i++) {
          const o = liste[(i * 7) % Math.max(1, liste.length)];
          if (!o) continue;
          const x = o.x + (i % 11) / 10 * o.w + ((i % 3) - 1) * 20;
          const y = o.y + (i % 13) / 12 * o.h + ((i % 5) - 2) * 20;
          const r = [4, 16, 40, 80][i % 4];
          denendi++;
          if (engelCarpisir(liste, x, y, r) !== __kabaCarpisir(liste, x, y, r)) fark++;
          if (Math.abs(engelMesafesi(liste, x, y, r) - __kabaMesafe(liste, x, y, r)) > 1e-9) fark++;
        }
      }
    }
    return { fark, denendi };
  });
  sina('kovalı çarpışma/uzaklık kaba kuvvetle aynı', () => {
    assert.equal(esit.fark, 0, `${esit.fark} fark / ${esit.denendi} nokta`);
  });

  // 3) Liste değişince (uzunluk) kova yenilenir: yeni engel hemen çarpar
  const taze = await p.evaluate(() => {
    const liste = [{ x: 0, y: 0, w: 50, h: 50, carpisma: [{ t: "k", x: 0, y: 0, w: 50, h: 50, rr: 0 }] }];
    const once = engelCarpisir(liste, 5000, 5000, 10);
    liste.push({ x: 5000, y: 5000, w: 50, h: 50, carpisma: [{ t: "k", x: 0, y: 0, w: 50, h: 50, rr: 0 }] });
    const sonra = engelCarpisir(liste, 5000, 5000, 10);
    return { once, sonra };
  });
  sina('kova liste değişince yenilenir', () => {
    assert.equal(taze.once, false); assert.equal(taze.sonra, true);
  });

  // 4) Kare süresi: uzun harita eski haritanın 1,3 katını geçmez
  const sure = await p.evaluate(() => {
    const olc = (fn, n = 120) => { const bas = performance.now(); for (let i = 0; i < n; i++) fn(); return performance.now() - bas; };
    const hazir = () => { game.paused = true; game.ghosts = []; game.pickups = []; game.projectiles = []; game.enemyProjectiles = []; game.effects = []; game.bot = null; };
    online.mode = 'host'; startGame(); hazir();
    game.player.x = game.worldW / 2; game.player.y = game.worldH / 2;
    game.camera.x = game.player.x - game.W / 2; game.camera.y = game.player.y - game.H / 2;
    for (let i = 0; i < 15; i++) render();
    const eski = Math.min(olc(render), olc(render), olc(render));
    online.mode = null; endGame(false);
    __kur(3);
    const z = game._yolculukDuzen.zones[2];
    game.player.x = (z.x0 + z.gate.x0) / 2; game.player.y = game.worldH / 2;
    game.camera.x = game.player.x - game.W / 2; game.camera.y = game.player.y - game.H / 2;
    for (let i = 0; i < 15; i++) render();
    const yeni = Math.min(olc(render), olc(render), olc(render));
    return { eski, yeni };
  });
  console.log(`kare süresi: eski ${sure.eski.toFixed(1)} ms, uzun ${sure.yeni.toFixed(1)} ms (${(sure.yeni / sure.eski).toFixed(2)}x)`);
  sina('uzun haritada çizim kare süresi eski haritanın 1,3 katını geçmez', () => {
    assert.ok(sure.yeni <= sure.eski * 1.3, `${sure.yeni.toFixed(1)} ms / ${sure.eski.toFixed(1)} ms`);
  });

  sina('sayfa hatası yok', () => { assert.deepEqual(hatalar, []); });
} catch (e) {
  sonuclar.push(`✗ akış yarıda kaldı: ${e.message.split('\n')[0]}`);
} finally {
  await b.close();
  sunucu.close();
}
console.log(sonuclar.join('\n'));
const kotu = sonuclar.filter((s) => s.startsWith('✗')).length;
console.log(kotu ? `KALAN: ${kotu} sınama` : `TAMAM: ${sonuclar.length} sınama`);
process.exit(kotu ? 1 : 0);
