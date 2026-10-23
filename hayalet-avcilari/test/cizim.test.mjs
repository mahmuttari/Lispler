// Hayalet Avcıları: çizim hızı sınaması — "çevrimiçi oyunda biri ölünce oyun donuyor" hatası (3.12.1).
// Hayalet olan oyuncu (kendi ekranında ve diğer oyuncunun ekranında) ve vurulan Bot eskiden ctx.filter ile çiziliyordu;
// tuval filtresi çizimin onlarca işleminin her birine ayrı uygulandığı için kare 0,4–4 sn sürüyordu. Bu test Firebase'siz
// bir sayfada önce sürekli vurulan Bot'u (tek kişilik), sonra hayalet olan yerel ve uzak oyuncuyu çizdirir; CPU 4 kat
// yavaşken kare hızını ölçer.
// Çalıştırma (Playwright + Chromium gerekir):  node hayalet-avcilari/test/cizim.test.mjs
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
const sonuc = {};
try {
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const hatalar = [];
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.route(/gstatic\.com|googleapis|firebase/, (r) => r.abort()); // ağsız
  await p.addInitScript(() => { localStorage.setItem('hayaletAvcilariDil', 'tr'); localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9'); });
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForTimeout(300);
  const cdp = await p.context().newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const olc = (ms) => p.evaluate((ms) => new Promise((tamam) => {
    const kare = []; const bas = performance.now();
    const d = (t) => { kare.push(t); if (t - bas < ms) requestAnimationFrame(d); else {
      const ara = kare.slice(1).map((x, i) => x - kare[i]).sort((a, c) => a - c);
      tamam({ fps: +(ara.length / ((kare[kare.length - 1] - kare[0]) / 1000)).toFixed(1), p95: Math.round(ara[Math.floor(ara.length * 0.95)]) });
    } };
    requestAnimationFrame(d);
  }), ms);
  // Tek kişilik: Bot sürekli vuruluyor (her vuruşta 0,25 sn parlar)
  await p.evaluate(() => { save.playerName = 'Defne'; persistSave(); startGame(); game.player.invuln = 1e9; });
  await p.waitForTimeout(500);
  sonuc.botVar = await p.evaluate(() => !!game.bot);
  sonuc.botNormal = await olc(3000);
  await p.evaluate(() => { window.__parla = setInterval(() => { if (game.bot) game.bot.hitFlash = 0.25; }, 50); });
  sonuc.botParliyor = await olc(3000);
  await p.evaluate(() => clearInterval(window.__parla));
  // Çevrimiçi host gibi: yerel oyuncu ve iki uzak oyuncu; ağ yok (oda kimliği yok, yazım yapılmaz)
  await p.evaluate(() => {
    online.mode = 'host'; online.uid = 'ben'; // startMpGameClient gibi: kip önce, böylece Bot doğmaz
    startGame();
    const { x, y } = game.player;
    online.remotePlayers = {
      k1: { name: 'Ayşe', charKey: 'silsen', costumeIdx: 0, hp: 3, maxHp: 3, dead: false, x: x + 70, y: y + 10 },
      k2: { name: 'Can', charKey: 'kornet', costumeIdx: 0, hp: 0, maxHp: 3, dead: false, x: x - 70, y: y - 10 },
    };
    game.player.invuln = 1e9;
  });
  sonuc.canli = await olc(3000);
  // İkisi hayalet olur: yerel oyuncu ve bir uzak oyuncu (diğer uzak oyuncu canlı, tur sürer)
  await p.evaluate(() => { online.remotePlayers.k2.dead = true; game.player.hp = 0; game.player.dead = true; });
  sonuc.hayalet = await olc(3000);
  sonuc.hatalar = hatalar;
} finally {
  await b.close();
  sunucu.close();
}
console.log(JSON.stringify(sonuc));
assert.deepEqual(sonuc.hatalar, [], 'sayfa hatası');
assert.ok(sonuc.botVar, 'tek kişilik oyunda Bot yok');
assert.ok(sonuc.botParliyor.fps >= 30 && sonuc.botParliyor.p95 <= 100,
  `vurulan Bot çizilirken kare hızı ${sonuc.botParliyor.fps} fps, %95 kare ${sonuc.botParliyor.p95} ms (normalde ${sonuc.botNormal.fps} fps)`);
assert.ok(sonuc.canli.fps >= 30, `canlıyken kare hızı düşük: ${sonuc.canli.fps}`);
assert.ok(sonuc.hayalet.fps >= 30 && sonuc.hayalet.p95 <= 100,
  `hayalet olan oyuncu çizilirken kare hızı ${sonuc.hayalet.fps} fps, %95 kare ${sonuc.hayalet.p95} ms (canlıyken ${sonuc.canli.fps} fps)`);
console.log('TAMAM: hayalet olan oyuncu ve vurulan Bot kare hızını düşürmüyor');
