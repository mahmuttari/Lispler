// Hayalet Avcıları PERF1: uzun yolculuk haritasının çizim maliyeti ve sağlam ölçüm.
// Önbellek tam ısınana kadar (en az 60 kare) ısıtılır, her haritada 7 koşunun MEDYANI alınır; eşik 1,3 korunur.
// Çalıştırma: node test/perf1.test.mjs
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
    // Engel önbelleği tam ısınana kadar (ve en az 60 kare) render edilir.
    window.__isit = () => {
      let kare = 0;
      while (kare < 400) {
        render(); kare++;
        if (kare < 60) continue;
        const eksik = [game.walls, game.waters, game.spikes, game.lavas]
          .some((l) => (l || []).some((o) => o.bicim && !o.gecit && !o.donati && !o._isinma));
        if (!eksik) break;
      }
      return kare;
    };
    // 7 koşunun medyanı
    window.__olc = (fn, n = 120) => {
      const ctx2 = game.ctx, gid = ctx2.getImageData.bind(ctx2), GW = game.W, GH = game.H;
      const a = [];
      for (let r = 0; r < 7; r++) {
        const bas = performance.now();
        for (let i = 0; i < n; i++) { fn(); gid(0, 0, GW, GH); }
        a.push(performance.now() - bas);
      }
      a.sort((x, y) => x - y);
      return a[3];
    };
    window.__hazir = () => { game.paused = true; game.ghosts = []; game.pickups = []; game.projectiles = []; game.enemyProjectiles = []; game.effects = []; game.bot = null; };
  });

  // Eski harita
  const eski = await p.evaluate(() => {
    online.mode = 'host'; startGame(); __hazir();
    game.player.x = game.worldW / 2; game.player.y = game.worldH / 2;
    game.camera.x = game.player.x - game.W / 2; game.camera.y = game.player.y - game.H / 2;
    const isinma = __isit();
    const ms = __olc(render);
    online.mode = null; endGame(false);
    return { ms, isinma };
  });

  // Uzun harita, bölge 3 — bölüm bölüm profil
  const profil = await p.evaluate(() => {
    __kur(3);
    const z = game._yolculukDuzen.zones[2];
    game.player.x = (z.x0 + z.gate.x0) / 2; game.player.y = game.worldH / 2;
    game.camera.x = game.player.x - game.W / 2; game.camera.y = game.player.y - game.H / 2;
    const isinma = __isit();
    const adlar = ['yolculukCiz', 'yolculukGecitCiz', 'yolculukDonatilariCiz', 'yolculukTemaParcalariCiz', 'yolculukYuvalariCiz', 'engelleriCiz'];
    const asil = {}; for (const a of adlar) asil[a] = window[a];
    const ctx = game.ctx, gid = ctx.getImageData.bind(ctx), GW = game.W, GH = game.H;
    const N = 100;
    const olcF = (fn) => {
      const a = [];
      for (let r = 0; r < 2; r++) { const bas = performance.now(); for (let i = 0; i < N; i++) { fn(); gid(0, 0, GW, GH); } a.push((performance.now() - bas) / N); }
      a.sort((x, y) => x - y); return a[0];
    };
    const tam = olcF(render);
    const tablo = {};
    for (const a of adlar) { const f = window[a]; window[a] = () => {}; tablo[a] = +(tam - olcF(render)).toFixed(3); window[a] = f; }
    for (const a of adlar) window[a] = () => {};
    tablo.zemin_efekt = +olcF(render).toFixed(3);
    for (const a of adlar) window[a] = asil[a];
    void isinma;
    return { ms: __olc(render), isinma, tam: +tam.toFixed(3), tablo };
  });

  const yeni = await p.evaluate(() => {
    __kur(3);
    const z = game._yolculukDuzen.zones[2];
    game.player.x = (z.x0 + z.gate.x0) / 2; game.player.y = game.worldH / 2;
    game.camera.x = game.player.x - game.W / 2; game.camera.y = game.player.y - game.H / 2;
    const isinma = __isit();
    return { ms: __olc(render), isinma };
  });

  console.log('PROFIL bölge 3 (ms/kare):', JSON.stringify(profil.tablo));
  const oran = yeni.ms / eski.ms;
  console.log(`ESKİ ${eski.ms.toFixed(2)} ms (ısınma ${eski.isinma}) / YENİ ${yeni.ms.toFixed(2)} ms (ısınma ${yeni.isinma}) → oran ${oran.toFixed(3)}`);

  sina('uzun haritada çizim kare süresi eski haritanın 1,3 katını geçmez', () => {
    assert.ok(yeni.ms <= eski.ms * 1.3, `${yeni.ms.toFixed(1)} ms / ${eski.ms.toFixed(1)} ms (oran ${oran.toFixed(3)})`);
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
