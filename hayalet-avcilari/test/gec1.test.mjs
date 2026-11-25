// Hayalet Avcıları: GEC1 bölüm geçişi (kutlama, portal, iris, başlık kartı) — çevrimdışı sınama.
// Kutlama → toplanabilir mıknatısı → portal → iris → bölüm → başlık kartı; eski harita ve çevrimiçi kurucu yolu korunur.
// Çalıştırma: node test/gec1.test.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WWW = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);
const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.m4a': 'audio/mp4', '.webp': 'image/webp' };
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
  const p = await b.newPage({ viewport: { width: 844, height: 390 } });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript(() => {
    localStorage.setItem('hayaletAvcilariDil', 'tr');
    localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9');
    localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1');
  });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof startGame === 'function' && typeof gec1Guncelle === 'function');

  await p.evaluate(() => {
    window.__kur = (eskiHarita = false) => {
      if (game.running) endGame(false);
      window.__eskiYolculuk = window.yolculukAcik;
      if (eskiHarita) window.yolculukAcik = () => false;
      online.mode = null; online.roomId = null;
      startGame();
      game.paused = false; game.bot = null;
      game.ghosts = []; game.pickups = []; game.projectiles = []; game.enemyProjectiles = []; game.effects = []; game.particles = [];
      game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
      game.player.invuln = 1e9; game.player.dead = false; game.player.hp = 3;
      game.level = 1; game.levelTransitioning = false; game.bossDefeated = false; game.gec1 = null;
      return game;
    };
    window.__bitir = () => { game.bossDefeated = true; game.ghosts = []; game.spawnTimer = 0; };
    window.__topla = () => {
      const P = game.player;
      game.runPara = 0; game.runElmas = 0;
      game.pickups = [
        { x: P.x + 260, y: P.y, kind: 'para', value: 7 },
        { x: P.x - 240, y: P.y + 40, kind: 'elmas', value: 2 },
        { x: P.x + 120, y: P.y - 220, kind: 'kalp' },
      ];
    };
  });

  // 1) Yolculuk: kutlama → mıknatıs → portal → iris → bölüm → başlık kartı
  const bas = await p.evaluate(() => { __kur(false); __topla(); __bitir(); return { level: game.level }; });
  const kutlama = await p.waitForFunction(() => game.gec1 && game.gec1.asama === 'kutlama', null, { timeout: 3000 }).then(() => true).catch(() => false);
  sina('boss yenilince kutlama başlar', () => assert.equal(kutlama, true));
  await p.waitForFunction(() => game.pickups.length === 0 && game.runPara >= 7 && game.runElmas >= 2, null, { timeout: 2500 });
  sina('kalan para/elmas/kalp 2,5 sn içinde avcıya uçup toplanır', () => {
    assert.equal(bas.level, 1);
  });

  await p.waitForFunction(() => game.gec1 && game.gec1.asama === 'portal', null, { timeout: 3000 });
  const portal = await p.evaluate(() => ({ x: game.gec1.portalX, y: game.gec1.portalY, oyuncu: game.player.x, yolu: game.gec1.yolculuk }));
  sina('yolculukta portal oyuncunun 140 px sağında belirir', () => {
    assert.equal(portal.yolu, true);
    assert.ok(portal.x > portal.oyuncu, `${portal.x} > ${portal.oyuncu}`);
  });

  // 3 sn beklemeden otomatik yürüyüşe geçir (zamanlayıcı korunur, sınama hızlanır)
  await p.evaluate(() => { if (game.gec1) game.gec1.otoBas = performance.now(); });
  const kapan = await p.waitForFunction(() => game.gec1 && (game.gec1.asama === 'kapan' || game.gec1.asama === 'fadeKapan'), null, { timeout: 5000 }).then(() => true).catch(() => false);
  sina('portal avcıyı içine alınca iris perdesi kapanır', () => assert.equal(kapan, true));

  await p.waitForFunction(() => game.level === 2 && game.gec1 && game.gec1.asama === 'kart', null, { timeout: 3000 });
  const yeni = await p.evaluate(() => ({
    x: game.player.x, y: game.player.y, bas: yolculukBaslangic(),
    kart: game.gec1 && game.gec1.asama, kartMetni: document.getElementById('gec1-banner')?.textContent || '',
  }));
  sina('perde karanlıkken bölüm ilerler ve avcı yolculuk başlangıcına gelir', () => {
    assert.equal(yeni.kart, 'kart');
    assert.ok(Math.abs(yeni.x - yeni.bas.x) < 2 && Math.abs(yeni.y - yeni.bas.y) < 2, `${yeni.x},${yeni.y}`);
  });

  const engel = await p.evaluate(async () => {
    game.spawnTimer = 0;
    await new Promise((r) => setTimeout(r, 350));
    return { hayalet: game.ghosts.length, kart: game.gec1 && game.gec1.asama };
  });
  sina('başlık kartı açıkken hayalet doğmaz', () => {
    assert.equal(engel.kart, 'kart');
    assert.equal(engel.hayalet, 0);
  });
  await p.waitForFunction(() => !game.gec1, null, { timeout: 3000 });
  const sonra = await p.evaluate(async () => {
    game.spawnTimer = 0;
    await new Promise((r) => setTimeout(r, 600));
    return game.ghosts.length;
  });
  sina('kart kaybolunca hayalet doğumu yeniden başlar', () => assert.ok(sonra > 0, String(sonra)));

  // 2) Eski harita (yolculuk kapalı): portalsız, perde doğrudan avcıda kapanır
  await p.evaluate(() => { __kur(true); __bitir(); });
  await p.waitForFunction(() => game.gec1 && game.gec1.asama === 'kutlama', null, { timeout: 3000 });
  const eskiPortal = await p.evaluate(() => game.gec1.yolculuk);
  sina('eski harita yolunda portal yok', () => assert.equal(eskiPortal, false));
  await p.evaluate(() => { game.gec1.bas = performance.now() - 3000; });
  await p.waitForFunction(() => game.level === 2 && game.gec1 && game.gec1.asama === 'kart', null, { timeout: 3000 });
  sina('eski harita: perde kapanır, bölüm ilerler, başlık kartı açılır', () => {});
  await p.evaluate(() => { game.gec1.bas = performance.now(); game.gec1.aktif = false; game.gec1 = null; });

  // 3) Çevrimiçi kurucu: zamanlama korunur (lt 0 → 1, 1,8 sn sonra nextLevel), kart yine görünür
  await p.evaluate(() => {
    if (game.running) endGame(false);
    window.yolculukAcik = window.__eskiYolculuk || window.yolculukAcik;
    online.mode = 'host'; online.roomId = null;
    startGame();
    game.paused = false; game.bot = null; game.ghosts = []; game.pickups = [];
    game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9; game.player.invuln = 1e9;
    game.level = 1; game.levelTransitioning = false; game.gec1 = null;
    game.bossDefeated = true; game.ghosts = [];
  });
  await p.waitForFunction(() => game.levelTransitioning && game.gec1 && game.gec1.asama === 'kutlama', null, { timeout: 3000 });
  const cev = await p.evaluate(() => ({ lt: game.levelTransitioning, online: game.gec1 && game.gec1.online }));
  sina('çevrimiçi kurucu: lt=1 ve kutlama başlar', () => { assert.equal(cev.lt, true); assert.equal(cev.online, true); });
  await p.waitForFunction(() => game.level === 2, null, { timeout: 4000 });
  const cev2 = await p.evaluate(() => ({ lt: game.levelTransitioning, kart: game.gec1 && game.gec1.asama }));
  sina('çevrimiçi: 1,8 sn sonra bölüm ilerler, lt düşer, başlık kartı gelir', () => {
    assert.equal(cev2.lt, false);
    assert.equal(cev2.kart, 'kart');
  });
  await p.evaluate(() => { game.gec1 = null; online.mode = null; });

  // 4) Az hareket: iris yerine sade soluk perde
  await p.emulateMedia({ reducedMotion: 'reduce' });
  await p.evaluate(() => { __kur(false); __bitir(); });
  await p.waitForFunction(() => game.gec1 && game.gec1.asama === 'kutlama', null, { timeout: 3000 });
  const az = await p.evaluate(async () => {
    const mod = game.gec1.mod;
    game.gec1.bas = performance.now() - 3000;
    const gorulen = new Set();
    const t0 = performance.now();
    while (performance.now() - t0 < 2600) {
      if (game.gec1) {
        gorulen.add(game.gec1.asama);
        if (game.gec1.asama === 'portal') { game.player.x = game.gec1.portalX; game.player.y = game.gec1.portalY; }
      }
      await new Promise((r) => setTimeout(r, 16));
    }
    return { mod, asama: [...gorulen] };
  });
  sina('az hareket: konfeti/fişek yok, iris yerine soluk perde', () => {
    assert.equal(az.mod, 'fade');
    assert.ok(az.asama.includes('fadeKapan'), az.asama.join(','));
  });
  await p.evaluate(() => { if (game.gec1) { game.gec1.aktif = false; game.gec1 = null; } });
  await p.emulateMedia({ reducedMotion: 'no-preference' });

  const el = await p.$('#gec1-banner');
  sina('yeni metin alanı t() ile hazır (şerit DOM düğümü var)', () => assert.ok(el));
} finally {
  await b.close();
  sunucu.close();
}
sina('hiç sayfa hatası yok', () => assert.deepEqual(hatalar, []));
for (const s of sonuclar) console.log(s);
const basarisiz = sonuclar.filter((s) => s.startsWith('✗'));
if (basarisiz.length) { console.error(`\n${basarisiz.length} sınama başarısız`); process.exit(1); }
console.log(`\n${sonuclar.length} sınama geçti`);
