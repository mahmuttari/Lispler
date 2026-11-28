// ANM1: hareketli şeylere hafif animasyon (toplanabilir, düşman mermisi pop'u, roket izi, atıcı hayalet ışığı, bot/pet yalpası).
// Yalnız görüntü: oyun durumu değişmez. Çalıştırma: node test/anm1.test.mjs
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
const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const hatalar = [];
const sonuc = [];
const sina = (ad, ok, ek = '') => { sonuc.push(`${ok ? '✓' : '✗'} ${ad} ${ek}`); if (!ok) process.exitCode = 1; };
try {
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('hayaletAvcilariDil', 'tr'); localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9'); localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1'); });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof startGame === 'function' && typeof anmAcilis === 'function');
  await p.evaluate(() => {
    window.__sahne = () => {
      startGame(); game.paused = true; game.spawnTimer = 1e9; game.bot = null;
      game.ghosts = []; game.pickups = []; game.projectiles = []; game.enemyProjectiles = []; game.effects = [];
      game.camera.x = game.player.x - game.W / 2; game.camera.y = game.player.y - game.H / 2;
    };
    // Verilen çizim işlevini 120x120 tuvalde (merkez x,y) çizip piksel özetini ve opak piksel sayısını verir
    window.__ciz = (fn, x, y) => {
      const cv = document.createElement('canvas'); cv.width = 120; cv.height = 120;
      const c = cv.getContext('2d'); c.translate(60 - x, 60 - y); fn(c);
      const d = c.getImageData(0, 0, 120, 120).data; let h = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) { if (d[i + 3] > 8) n++; h = (h * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7 + d[i + 3]) | 0; }
      return { h, n };
    };
    window.__zaman = (t) => { performance.now = () => t; };
  });

  // 1) Toplanabilir: zamanla çizim değişir (süzülme + ışıltı), açılışta küçük başlar, sonra tam boy
  for (const kind of ['para', 'kalp', 'guc', 'elmas', 'zumrut']) {
    const r = await p.evaluate((kind) => {
      __sahne(); const gercek = performance.now.bind(performance);
      const pk = { x: game.player.x, y: game.player.y - 100, kind, value: 1 };
      __zaman(1000); const a0 = __ciz((c) => drawPickup(c, pk), pk.x, pk.y); // _dg = 1000 (pop başı)
      __zaman(1060); const a1 = __ciz((c) => drawPickup(c, pk), pk.x, pk.y);
      __zaman(2000); const b0 = __ciz((c) => drawPickup(c, pk), pk.x, pk.y);
      __zaman(2150); const b1 = __ciz((c) => drawPickup(c, pk), pk.x, pk.y);
      performance.now = gercek;
      const o = { _dg: 1000 }; const k0 = anmAcilis(o, 1050), k1 = anmAcilis(o, 2000);
      return { pop: k0, tam: k1, pk: pk._dg, degisti: b0.h !== b1.h || a0.h !== a1.h, durum: JSON.stringify(pk) };
    }, kind);
    sina(`${kind}: süzülür/ışıldar (kare farkı)`, r.degisti);
    sina(`${kind}: belirirken küçük (ölçek ${r.pop.toFixed(2)} → ${r.tam}), _dg kaydı`, r.pop < 0.9 && r.tam === 1 && r.pk === 1000);
    sina(`${kind}: yalnız görsel alan eklendi`, !/"[a-z]+":/.test(r.durum.replace(/"(x|y|kind|value|_dg)":/g, '')));
  }

  // 2) Hareketi azalt: pop yok, süzülme yok
  await p.emulateMedia({ reducedMotion: 'reduce' });
  const az = await p.evaluate(() => {
    __sahne(); const gercek = performance.now.bind(performance);
    const pk = { x: game.player.x, y: game.player.y - 100, kind: 'kalp', value: 1 };
    __zaman(1000); const a = __ciz((c) => drawPickup(c, pk), pk.x, pk.y);
    __zaman(1100); const bb = __ciz((c) => drawPickup(c, pk), pk.x, pk.y);
    performance.now = gercek;
    return { pop: anmAcilis({}, 5), bob: anmPickupBob({ x: 3 }, 777), ayni: a.n === bb.n, kiv: __ciz((c) => anmKivilcim(c, 60, 60, 8, 0, 1000), 60, 60).n };
  });
  sina('az hareket: pop=1, süzülme=0, kıvılcım yok', az.pop === 1 && az.bob === 0 && az.kiv === 0);
  await p.emulateMedia({ reducedMotion: 'no-preference' });

  // 3) Düşman mermisi: çıkışta pop
  const em = await p.evaluate(() => {
    __sahne(); const gercek = performance.now.bind(performance);
    const m = { x: game.player.x, y: game.player.y - 80, vx: 50, vy: 0, id: 1 };
    __zaman(500); const a = __ciz((c) => { c.save(); drawEnemyProjectile(c, m); c.restore(); }, m.x, m.y);
    m._iz = null;
    __zaman(1500); const bb = __ciz((c) => drawEnemyProjectile(c, m), m.x, m.y);
    performance.now = gercek; return { a: a.n, b: bb.n };
  });
  sina(`düşman mermisi belirirken küçük (${em.a} <= ${em.b})`, em.a <= em.b);

  // 4) Roket: iz noktaları birikir, parıltı opak piksel ekler; kod durumu (x,y,vx,vy) değişmez
  const rk = await p.evaluate(() => {
    __sahne(); const e = { type: 'rocket', x: game.player.x, y: game.player.y - 90, vx: 200, vy: 0, life: 9, maxLife: 9 };
    const once = __ciz((c) => { c.save(); anmRoketIzi(c, e, 1000); c.restore(); }, e.x, e.y);
    for (let i = 1; i < 8; i++) { e.x += 8; __ciz((c) => anmRoketIzi(c, e, 1000 + i * 16), e.x, e.y); }
    return { iz: e._iz.length, n: once.n, vx: e.vx, vy: e.vy };
  });
  sina(`roket: iz birikti (${rk.iz})`, rk.iz >= 6 && rk.n > 50 && rk.vx === 200 && rk.vy === 0);

  // 5) Atıcı hayalet ışığı ve bot/pet yalpası: zamana göre çizim değişir
  const hy = await p.evaluate(() => {
    __sahne(); const gercek = performance.now.bind(performance);
    const gs = { x: game.player.x, y: game.player.y - 80, r: 22, speed: 0, hp: 2, maxHp: 2, size: 40, isShooter: true };
    const gn = { x: gs.x, y: gs.y, r: 22, speed: 0, hp: 2, maxHp: 2, size: 40 };
    __zaman(3000); const s0 = __ciz((c) => drawGhost(c, gs), gs.x, gs.y), n0 = __ciz((c) => drawGhost(c, gn), gn.x, gn.y);
    performance.now = gercek; return { fark: s0.n - n0.n };
  });
  sina(`atıcı hayalet ışıklı (+${hy.fark} piksel)`, hy.fark > 200);
  const yal = await p.evaluate(() => ({ a: anmYalpa(1, 0.05), b: anmYalpa(2, 0.05) }));
  sina('yalpa zamanla değişir', Math.abs(yal.a - yal.b) > 0.001);
  const bot = await p.evaluate(() => {
    __sahne(); const gercek = performance.now.bind(performance);
    const bt = { x: game.player.x + 60, y: game.player.y, walkTimer: 0.2, aimRaise: 0, shootRecoil: 0, hitFlash: 0 };
    const a = __ciz((c) => drawBot(c, bt), bt.x, bt.y); bt.walkTimer = 0.45;
    const bb = __ciz((c) => drawBot(c, bt), bt.x, bt.y); performance.now = gercek; return { fark: a.h !== bb.h };
  });
  sina('bot yürürken çizim değişir', bot.fark);

  // 6) Bütçe: 40 hayalet + 20 toplanabilir + mermiler; çizim kare başına makul (taban ölçümüyle birlikte)
  const olc = await p.evaluate(() => {
    __sahne(); const k = game.player;
    for (let i = 0; i < 40; i++) game.ghosts.push({ x: k.x - 150 + (i % 8) * 40, y: k.y - 120 + Math.floor(i / 8) * 40, r: 22, speed: 0, hp: 2, maxHp: 2, size: 40, isShooter: i % 3 === 0 });
    const kinds = ['para', 'kalp', 'guc', 'elmas', 'zumrut'];
    for (let i = 0; i < 20; i++) game.pickups.push({ x: k.x - 160 + (i % 10) * 34, y: k.y + 80 + Math.floor(i / 10) * 40, kind: kinds[i % 5], value: 1 });
    for (let i = 0; i < 10; i++) game.enemyProjectiles.push({ x: k.x - 100 + i * 20, y: k.y - 20, vx: 40, vy: 0, id: i });
    for (let i = 0; i < 20; i++) render(); // ısınma
    const t0 = performance.now(); for (let i = 0; i < 60; i++) render(); return (performance.now() - t0) / 60;
  });
  console.log(`  render ortalama ${olc.toFixed(2)} ms (40 hayalet + 20 toplanabilir + 10 mermi)`);
  sina(`bütçe: kare başına ${olc.toFixed(1)} ms < 40`, olc < 40);
} finally {
  await b.close(); sunucu.close();
}
console.log(sonuc.join('\n'));
if (hatalar.length) { console.log('sayfa hataları:', hatalar); process.exitCode = 1; }
else console.log('sayfa hatası yok');
