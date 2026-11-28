// Hayalet Avcıları: zemin katmanı parçaları gecikmesiz (ZEMPAR) — çevrimdışı sınama.
// Yeni kurulan parça aynı karede çizilir; ekrandakiler hazırken görünüm çevresinden önceden parça kurulur
// (kamera kayınca dikdörtgen boşluk görünmesin). Çalıştırma: node test/zempar.test.mjs
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
      return game;
    };
  });

  // 1) Boş önbellekte tek karede: kurulan parça aynı karede çizilir
  const ilk = await p.evaluate(() => {
    __kur(1); game._zeminParcalari = new Map();
    const cv = document.createElement('canvas'); cv.width = game.W; cv.height = game.H; const x = cv.getContext('2d');
    let parcaCizim = 0; const od = x.drawImage.bind(x);
    x.drawImage = (im, ...a) => { if (im instanceof HTMLCanvasElement) parcaCizim++; return od(im, ...a); };
    x.translate(-game.camera.x, -game.camera.y);
    zeminKatmaniCiz(x);
    const dolu = [...game._zeminParcalari.values()].filter(Boolean).length;
    return { parcaCizim, dolu, boy: game._zeminParcalari.size };
  });
  sina('kurulan parça aynı karede çizilir', () => {
    assert.equal(ilk.boy, 1, `önbellek ${ilk.boy}`);
    assert.equal(ilk.parcaCizim, ilk.dolu, JSON.stringify(ilk));
  });

  // 2) Ekrandakiler hazır olduktan sonra çevre parçaları da kurulur (bir parça pay)
  const cevre = await p.evaluate(() => {
    __kur(1); game._zeminParcalari = new Map();
    const P = 512, cam = game.camera, W = game.W, H = game.H;
    const x0 = Math.floor(cam.x / P), x1 = Math.floor((cam.x + W) / P), y0 = Math.floor(cam.y / P), y1 = Math.floor((cam.y + H) / P);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
    x.translate(-cam.x, -cam.y);
    for (let i = 0; i < 40; i++) zeminKatmaniCiz(x);
    const s = engelOlcegi() || 1; let eksik = 0, beklenen = 0;
    for (let cy = y0 - 1; cy <= y1 + 1; cy++) for (let cx = x0 - 1; cx <= x1 + 1; cx++) {
      if (cx < 0 || cy < 0 || cx * P > game.worldW || cy * P > game.worldH) continue;
      beklenen++; if (!game._zeminParcalari.has(cx + '|' + cy + '|' + s)) eksik++;
    }
    return { eksik, beklenen, boy: game._zeminParcalari.size };
  });
  sina('görünüm çevresindeki parçalar önceden kurulur', () => {
    assert.ok(cevre.beklenen > 0, JSON.stringify(cevre));
    assert.equal(cevre.eksik, 0, JSON.stringify(cevre));
  });
  sina('sayfa hatası yok', () => { assert.deepEqual(hatalar, []); });
} finally {
  await b.close();
  sunucu.close();
}

for (const s of sonuclar) console.log(s);
const kotu = sonuclar.filter((s) => s.startsWith('✗')).length;
process.exit(kotu ? 1 : 0);
