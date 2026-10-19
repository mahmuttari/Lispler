// Hayalet Avcıları: "hayalet engelin içinde doğuyor, öldürülemiyor, bölüm bitmiyor" hatasının sınaması.
// Çalıştırma (Playwright + Chromium gerekir):  node hayalet-avcilari/test/engel.test.mjs
// PLAYWRIGHT_MODULE ile playwright'ın yolu, CHROMIUM ile tarayıcı verilebilir (bulut ortamı varsayılanları aşağıda).
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

const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
try {
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const hatalar = [];
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.route(/gstatic\.com|googleapis|firebase/, (r) => r.abort()); // ağsız: Firebase yüklenmez
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForTimeout(500);
  const s = await p.evaluate(() => {
    const icinde = (g) => collidesWalls(g.x, g.y, g.r);
    const o = {};
    startGame(); game.paused = true;
    let gomulu = 0, minik = 0, boss = 0;
    for (let L = 1; L <= 20; L++) {
      for (let k = 0; k < 3; k++) {
        game.level = L; game.player.x = 100 + Math.random() * 1400; game.player.y = 100 + Math.random() * 1000;
        buildWalls();
        for (let i = 0; i < 200; i++) { game.ghosts = []; spawnGhost(); if (icinde(game.ghosts[0])) gomulu++; }
        game.ghosts = []; spawnBoss(); if (icinde(game.ghosts[0])) boss++;
        for (const w of game.walls.slice(4)) {
          for (let i = 0; i < 10; i++) { game.ghosts = []; spawnBossMinion({ x: w.x - 46, y: w.y + w.h / 2 }); if (icinde(game.ghosts[0])) minik++; }
        }
      }
    }
    o.dogma = { gomulu, boss, minik };
    const harita = () => JSON.stringify(game.walls.map((w) => [w.x, w.y, w.w, w.h]));
    online.mode = 'host'; game.level = 7; game.player.x = 300; game.player.y = 300; buildWalls(); const h1 = harita();
    online.mode = 'client'; game.player.x = 1300; game.player.y = 900; buildWalls(); const h2 = harita();
    online.mode = null;
    o.ayniHarita = h1 === h2;
    // Engelin ortasına konmuş hayalet birkaç karede dışarı çıkmalı
    game.level = 3; buildWalls(); game.player.x = 800; game.player.y = 600; ensurePlayerSafe();
    game.player.invuln = 1e9; game.bossSpawnTimer = 1e9;
    const w = game.walls[4];
    const g0 = { x: w.x + w.w / 2, y: w.y + w.h / 2, r: 22, speed: 60, hp: 1, maxHp: 1, size: 40 };
    game.ghosts = [g0];
    let t = performance.now();
    for (let i = 0; i < 20; i++) { t += 16; update(0.016, t); game.ghosts = game.ghosts.filter((g) => g === g0); }
    o.kurtuldu = !icinde(g0);
    // Fanatik gücüyle uzun oyun: hiçbir karede engele gömülü hayalet olmamalı, bölümler geçilmeli
    game.paused = false; startGame(); game.running = false;
    let kare = 0, gomuluKare = 0; t = performance.now();
    while (game.level < 8 && kare < 40000) {
      kare++; t += 50;
      Object.assign(game.player, { invuln: 1e9, hp: 3, damage: 4, range: 2600, fireDelay: 60 });
      if (kare % 600 === 1) game.player.power = { type: 'fanatik', expires: performance.now() + 1e6 };
      game.camera.x = game.player.x - game.W / 2; game.camera.y = game.player.y - game.H / 2;
      const a = kare / 90; game.inputDir = { x: Math.cos(a), y: Math.sin(a * 0.7) };
      update(0.05, t);
      if (game.levelTransitioning && !game._b) game._b = kare;
      if (game._b && kare - game._b > 40) { game._b = 0; nextLevel(); }
      if (game.ghosts.some(icinde)) gomuluKare++;
    }
    o.uzun = { kare, bolum: game.level, gomuluKare };
    return o;
  });
  console.log(JSON.stringify(s));
  assert.deepEqual(s.dogma, { gomulu: 0, boss: 0, minik: 0 }, 'doğan hayalet engelin içinde');
  assert.equal(s.ayniHarita, true, 'çevrimiçi oyunda host ile katılanın haritası farklı');
  assert.equal(s.kurtuldu, true, 'engele gömülü hayalet dışarı çıkmadı');
  assert.equal(s.uzun.gomuluKare, 0, 'oyun sırasında engele gömülü hayalet görüldü');
  assert.ok(s.uzun.bolum >= 8, `bölümler geçilemedi (bölüm ${s.uzun.bolum})`);
  assert.deepEqual(hatalar, [], 'sayfa hatası');
  console.log('TAMAM: engel testleri geçti');
} finally {
  await b.close();
  sunucu.close();
}
