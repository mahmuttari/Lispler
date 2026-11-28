// Hayalet Avcıları: ZEM3A — derinlik sırası ve örtme solması (çevrimdışı sınama).
// Çalıştırma: node test/zem3a.test.mjs
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
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript(() => {
    localStorage.setItem('hayaletAvcilariDil', 'tr');
    localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9');
    localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1');
  });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof startGame === 'function' && typeof engelleriCiz === 'function' && typeof render === 'function');
  await p.evaluate(() => {
    window.__kur = (level = 1) => {
      if (game.running) endGame(false);
      online.mode = null;
      startGame();
      game.level = level;
      buildWalls(); buildWaters(); buildHazards();
      game.paused = true; game.running = false;
      game.ghosts = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
      game.camera.x = game.player.x - game.W / 2; game.camera.y = game.player.y - game.H / 2;
      return game;
    };
    window.__duzen = () => {
      const g = __kur(1);
      const w = g.walls.find((o) => o.tur === 'duvar' && o.bicim) || g.walls[0];
      g.walls = [w]; g.waters = []; g.spikes = []; g.lavas = [];
      w.x = 460; w.y = 450; w.w = 80; w.h = 100; w._resim = null; w._olcek = 0; w._isinma = 0; w._solma = 1;
      const cv = document.createElement('canvas'); cv.width = 600; cv.height = 600;
      g.W = 600; g.H = 600; g.camera = { x: 0, y: 0 };
      g.player.x = 500; g.player.y = 500; g.player.r = 22; g.player.dead = false;
      const ctx = cv.getContext('2d');
      engelleriCiz(ctx);
      return { g, w, ctx };
    };
    window.__say = (ctx, w, kip) => {
      const im = w._resim && w._resim.c; let n = 0;
      const eski = ctx.drawImage;
      ctx.drawImage = function (a, ...b) { if (a === im) n++; return eski.apply(this, arguments); };
      try { engelleriCiz(ctx, kip); } finally { ctx.drawImage = eski; }
      return n;
    };
  });

  const t = await p.evaluate(async () => {
    const { g, w, ctx } = __duzen();
    const o = {};
    o.kuzeyArka = __say(ctx, w, 'arka');
    o.kuzeyOn = __say(ctx, w, 'on');
    for (let i = 0; i < 20; i++) { await new Promise((r) => requestAnimationFrame(r)); engelleriCiz(ctx, 'on'); }
    o.solma = w._solma;
    g.player.y = 700; // nesne artık arkada
    for (let i = 0; i < 20; i++) { await new Promise((r) => requestAnimationFrame(r)); engelleriCiz(ctx, 'arka'); }
    o.solmaUzak = w._solma;
    o.guneyArka = __say(ctx, w, 'arka');
    o.guneyOn = __say(ctx, w, 'on');
    g.player.dead = true;
    o.oluArka = __say(ctx, w, 'arka');
    o.oluOn = __say(ctx, w, 'on');
    g.player.dead = false; g.player.y = 500;
    o.eski = __say(ctx, w, undefined);
    return o;
  });

  sina('(a) oyuncu nesnenin kuzeyinde: nesne "on" geçişinde çizilir', () => {
    assert.ok(t.kuzeyOn >= 1, JSON.stringify(t));
    assert.equal(t.kuzeyArka, 0, JSON.stringify(t));
  });
  sina('(b) oyuncu nesnenin güneyinde: nesne "arka" geçişinde, "on"da 0', () => {
    assert.ok(t.guneyArka >= 1, JSON.stringify(t));
    assert.equal(t.guneyOn, 0, JSON.stringify(t));
  });
  sina('(c) örten nesne 20 karede soluyor (≤0.6), uzaklaşınca 1', () => {
    assert.ok(t.solma <= 0.6, String(t.solma));
    assert.equal(t.solmaUzak, 1, String(t.solmaUzak));
  });
  sina('(d) ölü oyuncu: "on" geçişi hiçbir şey çizmez', () => {
    assert.ok(t.oluArka >= 1, JSON.stringify(t));
    assert.equal(t.oluOn, 0, JSON.stringify(t));
  });
  sina('(e) engelleriCiz(ctx) eski davranış: hepsini çizer', () => {
    assert.ok(t.eski >= 1, JSON.stringify(t));
  });

  // (g) performans: yeni iki geçişli çizim, eski tek geçişe göre ≤ 1.3
  const perf = await p.evaluate(() => {
    __kur(3);
    const g = game; g.player.dead = false; g.player.invuln = 1e9;
    g.ghosts = []; g.pickups = []; g.projectiles = []; g.enemyProjectiles = []; g.effects = []; g.bot = null;
    const gercek = engelleriCiz;
    let eskiMod = false;
    window.engelleriCiz = (ctx, kip) => {
      if (!eskiMod) return gercek(ctx, kip);
      if (kip === 'on') return;
      return gercek(ctx);
    };
    const ctx = g.ctx, gid = ctx.getImageData.bind(ctx);
    const isit = () => { for (let i = 0; i < 100; i++) { render(); gid(0, 0, 8, 8); } };
    const olc = () => {
      const a = [];
      for (let r = 0; r < 5; r++) {
        const t0 = performance.now();
        for (let i = 0; i < 60; i++) { render(); gid(0, 0, 8, 8); }
        a.push(performance.now() - t0);
      }
      a.sort((x, y) => x - y); return a[2];
    };
    eskiMod = false; isit(); const yeni = olc();
    eskiMod = true; isit(); const eski = olc();
    eskiMod = false;
    window.engelleriCiz = gercek;
    return { yeni, eski, oran: yeni / eski };
  });
  sina('(g) performans: yeni/eski render oranı ≤ 1.3', () => {
    assert.ok(perf.oran <= 1.3, JSON.stringify(perf));
  });

  // Ekran görüntüleri: kahraman yüksek nesnenin arkasında / önünde
  const ekran = path.join(KOK, 'test', 'ekran');
  if (!fs.existsSync(ekran)) fs.mkdirSync(ekran, { recursive: true });
  await p.evaluate(() => {
    const g = __kur(1);
    const w = g.walls.find((o) => o.tur === 'duvar' && o.bicim) || g.walls[0];
    w.x = g.player.x - 40; w.y = g.player.y - 50; w.w = 80; w.h = 100;
    w._resim = null; w._solcek = 0; w._olcek = 0; w._solma = 0.5; w._solmaSon = performance.now() - 200;
    g.camera.x = g.player.x - g.W / 2; g.camera.y = g.player.y - g.H / 2;
    render();
  });
  await p.screenshot({ path: path.join(ekran, 'zem3a-arkada.png') });
  await p.evaluate(() => {
    const g = game, w = g.walls.find((o) => o.tur === 'duvar') || g.walls[0];
    w.y = g.player.y - 170; w._solma = 1; w._solmaSon = performance.now();
    render();
  });
  await p.screenshot({ path: path.join(ekran, 'zem3a-onde.png') });

  sina('(f) sayfa hatası yok', () => assert.deepEqual(hatalar, []));
} finally {
  await b.close(); sunucu.close();
}
for (const s of sonuclar) console.log(s);
const basarisiz = sonuclar.filter((s) => s.startsWith('✗')).length;
if (hatalar.length) console.log('Sayfa hataları:', hatalar.join(' | '));
if (basarisiz || hatalar.length) { console.log(`${basarisiz} başarısız, ${hatalar.length} sayfa hatası`); process.exit(1); }
console.log(`Tümü geçti (${sonuclar.length})`);
