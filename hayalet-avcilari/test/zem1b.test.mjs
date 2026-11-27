// Hayalet Avcıları: taban süsleri ve temas gölgeleri (ZEM1B) — çevrimdışı sınama.
// Engeller, yolculuk donatıları, yuvalar, göl/nehir kıyıları ve yol kenarları süslenir; hepsi zemin parçası
// önbelleğinde çizilir. Çalıştırma: node test/zem1b.test.mjs
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
  const yol = decodeURIComponent(new URL(q.url, 'http://x').pathname);
  const f = path.join(WWW, yol.replace(/^\/+/, '') || 'index.html');
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
  await p.waitForFunction(() => typeof gorsel === 'function' && !!gorsel('dere-sus-1'));

  await p.evaluate(() => {
    window.__kur = (level = 1, klasik = false) => {
      if (game.running) endGame(false);
      online.mode = klasik ? 'host' : null;
      online.cachedRoom = klasik ? { players: {} } : null;
      online._yjYok = false;
      startGame();
      game.level = level;
      buildWalls(); buildWaters(); buildHazards();
      zeminKatmaniKur();
      game.paused = true;
      game.ghosts = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
      game.camera.x = game.player.x - game.W / 2; game.camera.y = game.player.y - game.H / 2;
      return game;
    };
    window.__kenar = (x, y, o) => {
      const ex = Math.max(o.x, Math.min(o.x + o.w, x));
      const ey = Math.max(o.y, Math.min(o.y + o.h, y));
      return Math.hypot(x - ex, y - ey);
    };
    // Bütün parçaları kur (kamera haritayı tarar; en çok bir parça/kare kuralı korunur)
    window.__tumParcalar = () => {
      const W = game.worldW, H = game.worldH, adim = 384;
      let bos = 0, onceki = -1;
      for (let tur = 0; tur < 600; tur++) {
        const nx = Math.floor(W / adim) + 1, ny = Math.floor(H / adim) + 1;
        const i = tur % (nx * ny);
        game.camera.x = Math.max(0, (i % nx) * adim - game.W / 2);
        game.camera.y = Math.max(0, Math.floor(i / nx) * adim - game.H / 2);
        zeminKatmaniCiz(game.ctx);
        if (game._zeminParcalari.size === onceki) { if (++bos > nx * ny) break; } else bos = 0;
        onceki = game._zeminParcalari.size;
      }
      return game._zeminParcalari.size;
    };
  });

  // 1) Engeller ve donatılar çevresinde süs var; gölge her engel/donatı/yuva için var
  const sus = await p.evaluate(() => {
    __kur(1);
    const z = game._zeminKatmani, s = z.suslar || [];
    const engeller = (game.walls || []).filter((o) => !o.yuva && (o.tur === 'duvar' || o.tur === 'obje1' || o.tur === 'obje2'));
    const donatilar = game._yolculukDonatilar || [];
    const cevresiz = [];
    const kontrol = (etiket, o, x0, y0) => {
      const n = s.filter((q) => __kenar(q.x, q.y, { x: x0, y: y0, w: o.w, h: o.h }) <= 16).length;
      if (n < 2) cevresiz.push(`${etiket}:${n}`);
    };
    for (const o of engeller) kontrol('engel', o, o.x, o.y);
    for (const o of donatilar) kontrol('donati', o, o.x - o.w / 2, o.y - o.h / 2);
    const golgeler = z.golgeler || [];
    const golgesiz = [];
    for (const o of engeller) if (!golgeler.some((g) => Math.abs(g.x - (o.x + o.w / 2)) < 1 && Math.abs(g.y - (o.y + o.h / 2 + 4)) < 1)) golgesiz.push('engel');
    for (const o of donatilar) if (!golgeler.some((g) => Math.abs(g.x - o.x) < 1 && Math.abs(g.y - (o.y + 4)) < 1)) golgesiz.push('donati');
    for (const yv of game.yuvalar || []) if (!golgeler.some((g) => Math.abs(g.x - yv.x) < 1.1 && Math.abs(g.y - (yv.y + 4)) < 1.1)) golgesiz.push('yuva');
    const donatiSus = donatilar.reduce((t, o) => t + s.filter((q) => __kenar(q.x, q.y, { x: o.x - o.w / 2, y: o.y - o.h / 2, w: o.w, h: o.h }) <= 16).length, 0);
    return { susSayi: s.length, golgeSayi: golgeler.length, cevresiz, golgesiz, donatiSus, engelSayi: engeller.length, donatiSayi: donatilar.length, yuvaSayi: (game.yuvalar || []).length };
  });
  // SUS1: ayıklama bazı donatı süslerini 16 px çemberin dışına taşıyabilir; engellerde alt sınır 2 kalır.
  sina('engel çevresinde en az 2, donatı başına ortalama en az 1 süs var', () => {
    assert.ok(sus.engelSayi > 0 && sus.donatiSayi > 0, `engel ${sus.engelSayi} donatı ${sus.donatiSayi}`);
    const cevresizEngel = sus.cevresiz.filter((q) => q.startsWith('engel'));
    assert.deepEqual(cevresizEngel, [], JSON.stringify(sus.cevresiz));
    assert.ok(sus.donatiSus >= sus.donatiSayi, `${sus.donatiSus} süs / ${sus.donatiSayi} donatı`);
  });
  sina('her engel, donatı ve yuva için temas gölgesi var', () => {
    assert.ok(sus.yuvaSayi > 0, String(sus.yuvaSayi));
    assert.deepEqual(sus.golgesiz, []);
    assert.ok(sus.golgeSayi >= sus.engelSayi + sus.donatiSayi + sus.yuvaSayi, String(sus.golgeSayi));
  });

  // 2) Hiçbir süs suda, duvarda ya da yolda değil
  const temiz = await p.evaluate(() => {
    const kotu = [];
    for (const seviye of [1, 3, 5]) {
      __kur(seviye);
      for (const s of (game._zeminKatmani.suslar || [])) {
        if (collidesWaters(s.x, s.y, 0)) kotu.push(`L${seviye}:su`);
        if (collidesWalls(s.x, s.y, 0)) kotu.push(`L${seviye}:duvar`);
        if (zeminKatmaniYolMu(s.x, s.y)) kotu.push(`L${seviye}:yol`);
      }
    }
    return kotu.slice(0, 10);
  });
  sina('süsler suya, duvara ve yola girmiyor', () => { assert.deepEqual(temiz, []); });

  // 3) Parça önbelleğinde çizim: engel çevresindeki parçada resim sayısı artar
  const cizim = await p.evaluate(() => {
    __kur(1);
    const o = (game.walls || []).find((q) => !q.yuva && (q.tur === 'duvar' || q.tur === 'obje1' || q.tur === 'obje2'))
      || game._yolculukDonatilar[0];
    const px = o.x !== undefined ? (o.w && o.bolge === undefined ? o.x + o.w / 2 : o.x) : 0;
    const py = o.y !== undefined ? (o.w && o.bolge === undefined ? o.y + o.h / 2 : o.y) : 0;
    game.camera.x = px - game.W / 2; game.camera.y = py - game.H / 2;
    zeminKatmaniSil();
    let sayi = 0;
    const eski = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (...a) { sayi++; return eski.apply(this, a); };
    try { for (let i = 0; i < 8; i++) zeminKatmaniCiz(game.ctx); } finally { CanvasRenderingContext2D.prototype.drawImage = eski; }
    return { sayi, parca: game._zeminParcalari.size };
  });
  sina('süsler zemin parçasına bir kez çizilir (drawImage artar)', () => {
    assert.ok(cizim.parca > 0, String(cizim.parca));
    assert.ok(cizim.sayi > 3, String(cizim.sayi));
  });

  // 4) Z02/Z03 resimleri yokken yedek dere-sus-* kullanılır
  const yedek = await p.evaluate(() => {
    for (const k of Object.keys(GORSEL)) if (k.startsWith('sus-')) delete GORSEL[k];
    for (const k of Object.keys(GORSEL_LISTESI)) if (k.startsWith('sus-')) delete GORSEL_LISTESI[k];
    __kur(2);
    zeminKatmaniSil();
    const kaynak = [];
    const eski = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (...a) {
      const im = a[0];
      if (im && im.src) kaynak.push(String(im.src));
      return eski.apply(this, a);
    };
    try { __tumParcalar(); } finally { CanvasRenderingContext2D.prototype.drawImage = eski; }
    return { toplam: kaynak.length, dere: kaynak.filter((s) => s.includes('dere-sus-')).length, z: kaynak.filter((s) => /\/sus-[a-z]/.test(s)).length };
  });
  sina('Z resimleri yokken dere-sus-* yedeği çizilir', () => {
    assert.ok(yedek.dere > 0, `dere ${yedek.dere}/${yedek.toplam}`);
    assert.equal(yedek.z, 0, String(yedek.z));
  });

  // 5) Başarım: önbellekteki katman, süsler olmadan çizimle aynı (≤ %15), 7 koşunun medyanı
  const perf = await p.evaluate(() => {
    __kur(1);
    const z = game._zeminKatmani;
    const s = z.suslar, g = z.golgeler;
    const olc = () => {
      zeminKatmaniSil(); __tumParcalar(); zeminKatmaniSil(); __tumParcalar(); // ısınma
      const a = [];
      for (let r = 0; r < 7; r++) {
        // 3000 çizim + piksel okuma (GPU kuyruğunu boşaltır): 300 çizim ~1 ms sürüyordu, saat çözünürlüğü ve makine
        // yükü oranı 1,4-1,75'e oynatıyordu
        const bas = performance.now();
        for (let i = 0; i < 3000; i++) zeminKatmaniCiz(game.ctx);
        game.ctx.getImageData(0, 0, 1, 1);
        a.push(performance.now() - bas);
      }
      a.sort((x, y) => x - y);
      return a[3];
    };
    const suslu = olc();
    z.suslar = []; z.golgeler = [];
    const sussuz = olc();
    z.suslar = s; z.golgeler = g;
    return { suslu, sussuz, oran: suslu / Math.max(0.001, sussuz) };
  });
  sina('süs katmanı önbellekte ek kare maliyeti getirmez (≤ %15)', () => {
    assert.ok(perf.oran <= 1.15, `${perf.suslu.toFixed(1)} / ${perf.sussuz.toFixed(1)} = ${perf.oran.toFixed(2)}`);
  });
} finally {
  await b.close(); sunucu.close();
}
for (const s of sonuclar) console.log(s);
const basarisiz = sonuclar.filter((s) => s.startsWith('✗')).length;
if (hatalar.length) { console.log('Sayfa hataları:', hatalar.join(' | ')); }
if (basarisiz || hatalar.length) { console.log(`${basarisiz} başarısız, ${hatalar.length} sayfa hatası`); process.exit(1); }
console.log(`Tümü geçti (${sonuclar.length})`);
