// Hayalet Avcıları SIS1: hayalet yuvalarında canlı sis (K12 kareleri ya da yedek sprite) — çevrimdışı sınama.
// Sis zamanla değişir, doğumda büyür, kamera dışındaki yuvalar çizilmez, hareketi azalt tercihinde statiktir.
// Çalıştırma: node test/sis1.test.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WWW = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);
const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.m4a': 'audio/mp4' };
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
  await p.waitForFunction(() => typeof startGame === 'function' && typeof yolculukHaritaKur === 'function' && typeof yolculukYuvalariCiz === 'function' && typeof yolculukYuvaSisiCiz === 'function');
  await p.evaluate(() => {
    window.__kur = () => {
      if (game.running) endGame(false);
      online.mode = null;
      startGame();
      game.paused = true; game.ghosts = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
      game.player.invuln = 1e9; game.player.dead = false; game.player.dusus = null;
      game.level = 1; buildWalls(); buildWaters(); buildHazards();
      game.ghosts = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
      const yv = game.yuvalar[0];
      game.yuvalar = [yv]; // yalnız bir yuva: piksel testleri yalıtılmış olsun
      game.W = 844; game.H = 390;
      game.camera.x = yv.x - 422; game.camera.y = yv.y - 195;
      return yv;
    };
    window.__ciz = () => {
      const cv = document.createElement('canvas'); cv.width = 844; cv.height = 390;
      const c = cv.getContext('2d');
      c.save(); c.translate(-game.camera.x, -game.camera.y);
      yolculukYuvalariCiz(c);
      c.restore();
      window.__son = cv;
      return cv;
    };
    window.__veri = () => window.__son.getContext('2d').getImageData(0, 0, 844, 390).data;
    window.__say = () => { const d = __veri(); let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++; return n; };
    // İki zaman arasındaki farklı piksel sayısı (sayfa içinde: büyük diziyi köprüden geçirmemek için)
    window.__fark = async (ms) => {
      const d1 = new Uint8ClampedArray(__veri());
      await new Promise((r) => setTimeout(r, ms));
      __ciz();
      const d2 = __veri(); let f = 0;
      for (let i = 0; i < d1.length; i += 4) {
        if (Math.abs(d1[i] - d2[i]) > 2 || Math.abs(d1[i + 1] - d2[i + 1]) > 2 || Math.abs(d1[i + 2] - d2[i + 2]) > 2 || Math.abs(d1[i + 3] - d2[i + 3]) > 2) f++;
      }
      return f;
    };
  });

  // 1) K12 kareleri yokken yedek sis: iki zaman arasında pikseller değişir
  const yedekFark = await p.evaluate(async () => { __kur(); __ciz(); return __fark(1200); });
  sina('K12 kareleri yokken yedek sis canlıdır (pikseller değişir)', () => {
    assert.ok(yedekFark > 50, `değişen piksel ${yedekFark}`);
  });

  // 2) Kamera dışındaki yuva çizilmez
  const disari = await p.evaluate(() => {
    const yv = __kur();
    game.camera.x = yv.x + 100000; game.camera.y = yv.y + 100000;
    __ciz();
    return __say();
  });
  sina('kamera dışındaki yuva (ve sisi) çizilmez', () => { assert.equal(disari, 0); });

  // 3) Hareketi azalt: iki zamanda birebir aynı pikseller
  await p.emulateMedia({ reducedMotion: 'reduce' });
  const azFark = await p.evaluate(async () => { __kur(); __ciz(); return __fark(1200); });
  sina('hareketi azalt tercihinde sis statiktir (aynı pikseller)', () => {
    assert.equal(azFark, 0, `değişen piksel ${azFark}`);
  });
  await p.emulateMedia({ reducedMotion: 'no-preference' });

  // 4) Doğum: kaynak yuvanın _dogumAn'ı kurulur, sis 0.7 sn büyük/parlak olur
  const dogum = await p.evaluate(() => {
    const yv = __kur();
    game.player.x = yv.x + 3000; game.player.y = yv.y + 3000;
    game.ghosts = [];
    spawnGhost({ x0: 0, x1: 1000, bolge: yv.bolge });
    const an = yv._dogumAn;
    __ciz(); const buyuk = __say();
    yv._dogumAn = performance.now() - 5000;
    __ciz(); const sonmus = __say();
    return { an, buyuk, sonmus, ghost: game.ghosts.length };
  });
  sina('doğumdan sonra sis 0.7 sn büyür (_dogumAn kurulur)', () => {
    assert.equal(dogum.ghost, 1);
    assert.ok(Number.isFinite(dogum.an), 'dogumAn yok');
    assert.ok(dogum.buyuk > dogum.sonmus + 50, `buyuk ${dogum.buyuk}, sonmus ${dogum.sonmus}`);
  });

  // 5) Sahte K12 kareleri: animCiz kullanılır ve kareler zamanla değişir
  const anim = await p.evaluate(async () => {
    __kur();
    const DATA = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const yukle = (k) => new Promise((coz) => {
      const im = new Image(); im.onload = () => { GORSEL[k] = im; coz(); }; im.src = DATA;
    });
    for (const ad of ['yuva-sis', 'yuva-duman']) {
      for (let i = 1; i <= 3; i++) { GORSEL_LISTESI[`an-${ad}-${i}`] = [1, 1]; await yukle(`an-${ad}-${i}`); }
      delete _animSayi[ad];
    }
    const gercek = animCiz;
    window.__cagri = [];
    animCiz = function (...a) { window.__cagri.push(a[1] + ':' + a[2]); return gercek.apply(this, a); };
    __cagri.length = 0; __ciz(); const k1 = __cagri.slice();
    await new Promise((r) => setTimeout(r, 500));
    __cagri.length = 0; __ciz(); const k2 = __cagri.slice();
    animCiz = gercek;
    return { k1, k2, hazir: animHazir('yuva-sis'), hazirD: animHazir('yuva-duman') };
  });
  sina('K12 kareleri gelince animCiz kullanılır ve kareler değişir', () => {
    assert.ok(anim.hazir >= 1 && anim.hazirD >= 1, `sis ${anim.hazir}, duman ${anim.hazirD}`);
    assert.ok(anim.k1.some((s) => s.startsWith('yuva-sis:')), `sis çağrısı yok: ${anim.k1}`);
    assert.ok(anim.k1.some((s) => s.startsWith('yuva-duman:')), `duman çağrısı yok: ${anim.k1}`);
    assert.notEqual(anim.k1.join(','), anim.k2.join(','), 'kareler değişmedi');
  });

  sina('sayfada hata yok', () => { assert.deepEqual(hatalar, []); });
} finally {
  await b.close();
  await new Promise((r) => sunucu.close(r));
}
console.log(sonuclar.join('\n'));
if (sonuclar.some((s) => s.startsWith('✗'))) process.exitCode = 1;
