// Hayalet Avcıları — AKI1: oyun hissi (kamera, vuruş/ölüm geri bildirimi, uçan sayılar,
// para uçuşu, ayak tozları, vuruş donması, hareket azaltma, havuz sınırları).
// Yalnız görüntü: hasar/hız/ağ alanları değişmez. Çalıştırma: node test/aki1.test.mjs
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
  const p = await b.newPage({ viewport: { width: 844, height: 390 } });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('hayaletAvcilariDil', 'tr'); localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9'); localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1'); });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof startGame === 'function' && typeof kameraGuncelle === 'function' && typeof AE === 'object');
  await p.evaluate(() => {
    window.__hazir = () => {
      startGame(); game.paused = false; game.spawnTimer = 1e9; game.bot = null;
      game.ghosts = []; game.pickups = []; game.projectiles = []; game.enemyProjectiles = []; game.effects = []; game.particles = [];
      game.player.dead = false; game.player.invuln = 0; game.player.hp = 3; game.player.maxHp = 3;
      game.camera.x = game.player.x - game.W / 2; game.camera.y = game.player.y - game.H / 2;
      game.kameraBakX = 0; game.kameraBakY = 0; game._kameraOyuncuX = game.player.x; game._kameraOyuncuY = game.player.y;
      game._hitStopUntil = 0; game._olumler = []; game._tozZaman = 0; game._sonYonX = 0;
      AE.efektler.length = 0; AE.ekran.length = 0; AE.poplar.length = 0; AE.puanlar.length = 0; AE.ucuslar.length = 0; AE.tozlar.length = 0;
      return game;
    };
    window.__hayalet = (dx = 100, hp = 100) => {
      const g = { x: game.player.x + dx, y: game.player.y, r: 22, speed: 0, hp, maxHp: hp, size: 40 };
      game.ghosts = [g]; return g;
    };
  });

  // 1) Kamera: yumuşak takip + ani oturma
  const kam = await p.evaluate(() => {
    __hazir();
    game.player.x = 800; game.player.y = 600;
    game.camera.x = 0; game.camera.y = 0;
    game._kameraOyuncuX = 800; game._kameraOyuncuY = 600;
    const hedef = Math.max(0, Math.min(game.worldW - game.W, 800 - game.W / 2));
    kameraGuncelle(0.016, false);
    const bir = game.camera.x;
    for (let i = 0; i < 70; i++) kameraGuncelle(0.016, false);
    const son = game.camera.x;
    // Bölüm başı: kamera uzakta kalsın, nextLevel anında oturtsun
    game.camera.x = 0; game.camera.y = 0;
    nextLevel();
    const hedef2 = Math.max(0, Math.min(game.worldW - game.W, game.player.x - game.W / 2));
    const basla = game.camera.x;
    return { bir, son, hedef, basla, hedef2 };
  });
  sina('kamera 16 ms sonra eski ile hedef arasında', () => { assert.ok(kam.bir > 0 && kam.bir < kam.hedef, JSON.stringify(kam)); });
  sina('kamera 1 sn sonra hedefe 2 px içinde', () => { assert.ok(Math.abs(kam.son - kam.hedef) < 2, JSON.stringify(kam)); });
  sina('bölüm başında kamera anında oturur', () => { assert.ok(Math.abs(kam.basla - kam.hedef2) < 2, JSON.stringify(kam)); });

  // 2) Vuruş: beyaz parlama + ezilme + duvara girmeyen geri itme
  const vur = await p.evaluate(() => {
    __hazir();
    const g = __hayalet(100, 5);
    g.__dogus = -100000; // doğuş ölçeği karışmasın
    g.__sonHp = 5; g.hp = 4;
    const a0 = hayaletAnim(g, 10000);
    const a1 = hayaletAnim(g, 10070);
    // Geri itme: sağda duvar var, içine girmemeli
    game.walls = [{ x: g.x + g.r + 1, y: g.y - 60, w: 120, h: 120 }];
    const eskiX = g.x;
    vurusGeriIt(g, 1, 0);
    return { beyaz: a1.beyaz, sx: a1.sx, sy: a1.sy, a0sx: a0.sx, eskiX, x: g.x, duvarda: collidesWalls(g.x, g.y, g.r) };
  });
  sina('vuruş beyaz parlama ve 1,18/0,84 ezilme kurar', () => { assert.ok(vur.beyaz > 0 && vur.sx > 1.1 && vur.sy < 0.95, JSON.stringify(vur)); });
  sina('geri itme hayaleti duvarın içine sokmaz', () => { assert.equal(vur.duvarda, false); assert.ok(vur.x <= vur.eskiX + 0.01, JSON.stringify(vur)); });

  // 3) Ölüm: pop + altın uçan sayı
  const olum = await p.evaluate(() => {
    __hazir();
    const g = __hayalet(0, 1); g.uzakVurdu = false;
    const pop0 = AE.poplar.length, puan0 = AE.puanlar.length;
    killGhost(g, 0);
    return { pop: AE.poplar.length - pop0, puan: AE.puanlar.length - puan0, metin: AE.puanlar[AE.puanlar.length - 1] && AE.puanlar[AE.puanlar.length - 1].text, renk: AE.puanlar[AE.puanlar.length - 1] && AE.puanlar[AE.puanlar.length - 1].renk };
  });
  sina('öldürme pop efekti ve altın uçan sayı üretir', () => {
    assert.equal(olum.pop, 1); assert.equal(olum.puan, 1); assert.ok(/^\d+$/.test(olum.metin || ''), JSON.stringify(olum));
    assert.equal(olum.renk, '#fde047');
  });

  // 4) Para: HUD'a uçuş + "+N" yazısı
  const para = await p.evaluate(() => {
    __hazir();
    const uc0 = AE.ucuslar.length, pu0 = AE.puanlar.length;
    collectPickup({ kind: 'para', value: 7, x: game.player.x, y: game.player.y });
    return { uc: AE.ucuslar.length - uc0, pu: AE.puanlar.length - pu0, metin: AE.puanlar[AE.puanlar.length - 1] && AE.puanlar[AE.puanlar.length - 1].text };
  });
  sina('para toplama HUD uçuşu ve +N yazısı üretir', () => { assert.equal(para.uc, 1); assert.equal(para.pu, 1); assert.ok(para.metin.includes('+7'), JSON.stringify(para)); });

  // 5) Ayak tozları yalnız yürürken
  const toz = await p.evaluate(() => {
    __hazir();
    game.inputDir.x = 0; game.inputDir.y = 0; game._tozZaman = 0; AE.tozlar.length = 0;
    update(0.25, performance.now());
    const duran = AE.tozlar.length;
    game.inputDir.x = 1; game.inputDir.y = 0;
    update(0.25, performance.now() + 2000);
    return { duran, yuruyen: AE.tozlar.length };
  });
  sina('toz yalnız yürürken çıkar', () => { assert.equal(toz.duran, 0); assert.ok(toz.yuruyen >= 2, JSON.stringify(toz)); });

  // 6) Vuruş donması: tek kişilik boss ölümünde var; çevrimiçi ve hareket azaltmada yok
  const donma = await p.evaluate(() => {
    __hazir(); online.mode = null;
    const g1 = __hayalet(0, 1); g1.isBoss = true; killGhost(g1, 0);
    const tek = game._hitStopUntil > performance.now();
    __hazir(); online.mode = 'host';
    const g2 = __hayalet(0, 1); g2.isBoss = true; killGhost(g2, 0);
    const onlineDonma = game._hitStopUntil > performance.now();
    online.mode = null;
    __hazir();
    let uc = 0; for (let i = 0; i < 3; i++) { const g = __hayalet(0, 1); g.uzakVurdu = false; killGhost(g, 0); uc++; }
    const ucOldurme = game._hitStopUntil > performance.now();
    return { tek, onlineDonma, ucOldurme };
  });
  sina('vuruş donması tek kişilik boss ölümünde ve 3 hızlı öldürmede var', () => { assert.equal(donma.tek, true); assert.equal(donma.ucOldurme, true); });
  sina('vuruş donması çevrimiçi oyunda yok', () => { assert.equal(donma.onlineDonma, false); });

  // 7) Hareket azaltma: sarsıntı ve ileri bakış yok
  await p.emulateMedia({ reducedMotion: 'reduce' });
  const az = await p.evaluate(() => {
    __hazir();
    AE.sars = { bas: 0, sure: 0, guc: 0 };
    aeSarsinti(0.25, 6);
    game.player.x = 800; game._kameraOyuncuX = 700; game._kameraOyuncuY = 600;
    kameraGuncelle(0.016, false);
    return { sars: AE.sars.sure, bakX: game.kameraBakX, bakY: game.kameraBakY };
  });
  sina('hareket azaltmada sarsıntı ve ileri bakış yok', () => { assert.equal(az.sars, 0); assert.equal(az.bakX, 0); assert.equal(az.bakY, 0); });
  const azDonma = await p.evaluate(() => {
    __hazir(); online.mode = null;
    const g = __hayalet(0, 1); g.isBoss = true; killGhost(g, 0);
    return game._hitStopUntil > performance.now();
  });
  sina('hareket azaltmada vuruş donması yok', () => { assert.equal(azDonma, false); });
  await p.emulateMedia({ reducedMotion: 'no-preference' });

  // 8) 500 öldürmeden sonra havuzlar sınırın altında
  const havuz = await p.evaluate(() => {
    __hazir();
    for (let i = 0; i < 500; i++) {
      const g = __hayalet(0, 1); g.uzakVurdu = false;
      killGhost(g, 0);
      game.pickups.length = 0; game.particles.length = 0; game.effects.length = 0; game.ghosts.length = 0;
      aeUcusEkle(game.player.x, game.player.y, 'para');
      aeTozEkle(game.player.x, game.player.y + 22);
    }
    return { pop: AE.poplar.length, puan: AE.puanlar.length, ucus: AE.ucuslar.length, toz: AE.tozlar.length };
  });
  sina('efekt havuzları 500 öldürmeden sonra sınırda kalır', () => {
    assert.ok(havuz.pop <= 24, JSON.stringify(havuz)); assert.ok(havuz.puan <= 24, JSON.stringify(havuz));
    assert.ok(havuz.ucus <= 20, JSON.stringify(havuz)); assert.ok(havuz.toz <= 48, JSON.stringify(havuz));
  });

  // 9) Maliyet: 2000 kare, efektli ve efektsiz (aynı sahne)
  const maliyet = await p.evaluate(() => {
    const cv = document.createElement('canvas'); cv.width = 844; cv.height = 390;
    const c = cv.getContext('2d');
    game.camera.x = 0; game.camera.y = 0; game.W = 844; game.H = 390; // en kötü durum: hepsi ekranda
    const simdi = performance.now();
    AE.poplar.length = 0; AE.puanlar.length = 0; AE.ucuslar.length = 0; AE.tozlar.length = 0;
    for (let i = 0; i < 24; i++) AE.puanlar.push({ x: (i * 37) % 800, y: (i * 53) % 350, text: '+3', renk: '#fff', bas: simdi });
    for (let i = 0; i < 20; i++) AE.ucuslar.push({ sx: 20 + i * 20, sy: 300, hx: 780, hy: 24, bas: simdi, sure: 450, tip: 'para' });
    for (let i = 0; i < 48; i++) AE.tozlar.push({ x: (i * 31) % 800, y: 200 + (i % 5) * 20, vx: 0, vy: -2, bas: simdi, sure: 400 });
    for (let i = 0; i < 24; i++) AE.poplar.push({ g: { x: 50 + i * 30, y: 150, size: 40, hp: 1, maxHp: 1, isBoss: false }, bas: simdi, boyut: 40 });
    const t0 = performance.now();
    for (let i = 0; i < 2000; i++) {
      aePuanlariCiz(c, simdi + 10); aeUcuslarCiz(c, simdi + 10); aeTozlariCiz(c, simdi + 10); aeOlumPoplariCiz(c, simdi + 10);
    }
    const efektli = performance.now() - t0;
    AE.poplar.length = 0; AE.puanlar.length = 0; AE.ucuslar.length = 0; AE.tozlar.length = 0;
    const t1 = performance.now();
    for (let i = 0; i < 2000; i++) {
      aePuanlariCiz(c, simdi + 10); aeUcuslarCiz(c, simdi + 10); aeTozlariCiz(c, simdi + 10); aeOlumPoplariCiz(c, simdi + 10);
    }
    const efektsiz = performance.now() - t1;
    return { efektli, efektsiz };
  });
  sina('2000 kare efekt çizimi ölçüldü (maliyet raporda)', () => {
    assert.ok(Number.isFinite(maliyet.efektli) && Number.isFinite(maliyet.efektsiz), JSON.stringify(maliyet));
  });
  console.log(`maliyet: 2000 kare dolu efekt ${maliyet.efektli.toFixed(1)} ms, boş ${maliyet.efektsiz.toFixed(1)} ms`);

  sina('sayfada hata yok', () => { assert.deepEqual(hatalar, []); });
} finally {
  await b.close();
  sunucu.close();
}
console.log(sonuclar.join('\n'));
if (sonuclar.some((s) => s.startsWith('✗'))) process.exitCode = 1;
