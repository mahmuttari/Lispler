// Hayalet Avcıları: organik yol geometrisi ve düzensiz dolgu (ZEM2A) — çevrimdışı sınama.
// Yollar düz şerit değil, değişen genişlikte kıvrılan patikalar; stroke() yok, benek dolgusu var.
// Çalıştırma: node test/zem2a.test.mjs
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
      game.camera.x = game.player.x - game.W / 2; game.camera.y = game.player.y - game.H / 2;
      return game;
    };
    window.__noktaCizgi = (px, py, ax, ay, bx, by) => {
      const dx = bx - ax, dy = by - ay, uz = dx * dx + dy * dy;
      let t = uz ? ((px - ax) * dx + (py - ay) * dy) / uz : 0;
      t = Math.max(0, Math.min(1, t));
      return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
    };
    window.__cizgiUzaklik = (x, y, p) => {
      let en = Infinity;
      for (let i = 0; i < p.length - 1; i++) en = Math.min(en, __noktaCizgi(x, y, p[i].x, p[i].y, p[i + 1].x, p[i + 1].y));
      return en;
    };
    window.__yol = () => {
      const g = __kur(1);
      const z = g._zeminKatmani;
      return z.yollar.find((y) => Array.isArray(y.ornekler) && y.ornekler.length > 4);
    };
  });

  // (a) Genişlik değişimi: 40 örnekte yarı genişlik std/mean ≥ 0,08
  const genislik = await p.evaluate(() => {
    const yol = __yol();
    const S = yol.ornekler, vals = [];
    for (let k = 0; k < 40; k++) {
      const d = (S.length - 1) * k / 39, i = Math.floor(d), t = d - i;
      const w = (S[i].w || 1) + ((S[Math.min(S.length - 1, i + 1)].w || 1) - (S[i].w || 1)) * t;
      vals.push((yol.gen || 64) * w / 2);
    }
    const ort = vals.reduce((a, b) => a + b, 0) / vals.length;
    const std = Math.sqrt(vals.reduce((a, b) => a + (b - ort) ** 2, 0) / vals.length);
    return { oran: std / ort, ort, std, n: S.length };
  });
  sina('(a) yol genişliği boyunca değişiyor (std/mean ≥ 0,08)', () => {
    assert.ok(genislik.oran >= 0.08, `oran ${genislik.oran.toFixed(3)} (n=${genislik.n})`);
  });

  // (b) Orta çizgi düz araliNoktalar segmentlerinden sapıyor; uçlar sabit
  const sapma = await p.evaluate(() => {
    const yol = __yol();
    const S = yol.ornekler, q = yol.noktalar;
    let en = 0;
    for (const s of S) en = Math.max(en, __cizgiUzaklik(s.x, s.y, q));
    const ilk = Math.hypot(S[0].x - q[0].x, S[0].y - q[0].y);
    const son = Math.hypot(S[S.length - 1].x - q[q.length - 1].x, S[S.length - 1].y - q[q.length - 1].y);
    return { en, ilk, son };
  });
  sina('(b) orta çizgi düz segmentlerden ≥ 6 px sapıyor', () => {
    assert.ok(sapma.en >= 6, String(sapma.en));
  });
  sina('(b) ilk/son nokta değişmiyor', () => {
    assert.ok(sapma.ilk < 1e-6 && sapma.son < 1e-6, `${sapma.ilk} / ${sapma.son}`);
  });

  // (c) Yol çiziminde stroke() kullanılmıyor
  const cizgi = await p.evaluate(() => {
    __kur(1);
    const z = game._zeminKatmani;
    z.suslar = []; z.golgeler = []; z.lekeler = [];
    const yol = z.yollar.find((y) => Array.isArray(y.ornekler) && y.ornekler.length > 4);
    const s = yol.ornekler[Math.floor(yol.ornekler.length / 2)];
    const cx = Math.floor(s.x / 512), cy = Math.floor(s.y / 512);
    game.camera.x = cx * 512; game.camera.y = cy * 512;
    zeminKatmaniSil();
    let sayi = 0;
    const eski = CanvasRenderingContext2D.prototype.stroke;
    CanvasRenderingContext2D.prototype.stroke = function (...a) { sayi++; return eski.apply(this, a); };
    try { zeminKatmaniCiz(game.ctx); } finally { CanvasRenderingContext2D.prototype.stroke = eski; }
    return { sayi, parca: game._zeminParcalari.size };
  });
  sina('(c) yol çizimi stroke() çağırmıyor', () => {
    assert.ok(cizgi.parca > 0, String(cizgi.parca));
    assert.equal(cizgi.sayi, 0, String(cizgi.sayi));
  });

  // (d) Piksel: yola dik 30 tarama çizgisinde kenar konumu ≥ 6 px değişiyor
  const kenar = await p.evaluate(() => {
    __kur(1);
    const z = game._zeminKatmani;
    z.suslar = []; z.golgeler = []; z.lekeler = [];
    const s = engelOlcegi() || 1;
    let best = null;
    for (const yol of z.yollar) {
      const S = yol.ornekler;
      if (!S || S.length < 6) continue;
      for (let i = 0; i < S.length - 1; i++) {
        const cx = Math.floor(S[i].x / 512), cy = Math.floor(S[i].y / 512);
        let j = i;
        while (j + 1 < S.length && Math.floor(S[j + 1].x / 512) === cx && Math.floor(S[j + 1].y / 512) === cy) j++;
        const dx = S[j].x - S[i].x, dy = S[j].y - S[i].y;
        if (j - i >= 6 && Math.abs(dx) >= 120 && Math.abs(dy) <= 0.4 * Math.abs(dx)) {
          if (!best || Math.abs(dx) > best.skor) best = { i, j, cx, cy, skor: Math.abs(dx) };
        }
        i = j;
      }
      if (best) break;
    }
    if (!best) return { hata: 'yatay yol parçası bulunamadı' };
    game.camera.x = best.cx * 512; game.camera.y = best.cy * 512;
    zeminKatmaniSil();
    zeminKatmaniCiz(game.ctx);
    const parca = game._zeminParcalari.get(best.cx + '|' + best.cy + '|' + s);
    if (!parca) return { hata: 'parça kurulamadı' };
    const ctx = parca.getContext('2d');
    const W = parca.width, H = parca.height, veri = ctx.getImageData(0, 0, W, H).data;
    const alfa = (x, y) => {
      x = Math.round(x); y = Math.round(y);
      if (x < 0 || y < 0 || x >= W || y >= H) return 0;
      return veri[(y * W + x) * 4 + 3];
    };
    const ox = best.cx * 512, oy = best.cy * 512;
    const yolRun = z.yollar.find((y) => {
      const S = y.ornekler;
      return S && Math.floor(S[best.i].x / 512) === best.cx && Math.floor(S[best.i].y / 512) === best.cy &&
        Math.floor(S[best.j].x / 512) === best.cx && Math.floor(S[best.j].y / 512) === best.cy;
    });
    const S = yolRun.ornekler;
    const xa = S[best.i].x + 12, xb = S[best.j].x - 12;
    const kenarlar = [];
    for (let k = 0; k < 30; k++) {
      const wx = xa + (xb - xa) * k / 29;
      let q = best.i;
      while (q < best.j && S[q + 1].x < wx) q++;
      const p0 = S[q], p1 = S[Math.min(best.j, q + 1)];
      const t = Math.max(0, Math.min(1, (wx - p0.x) / ((p1.x - p0.x) || 1)));
      const wy = p0.y + (p1.y - p0.y) * t;
      const px = (wx - ox) * s, py = (wy - oy) * s;
      let up = py, n = 0;
      while (up > 0 && alfa(px, up) > 10 && n < 220) { up -= 1; n++; }
      if (n >= 220) continue;
      kenarlar.push(up);
    }
    if (kenarlar.length < 10) return { hata: 'yeterli tarama yok', adet: kenarlar.length };
    return { fark: Math.max(...kenarlar) - Math.min(...kenarlar), adet: kenarlar.length };
  });
  sina('(d) yol kenarı 30 taramada ≥ 6 px değişiyor', () => {
    assert.ok(!kenar.hata, kenar.hata || '');
    assert.ok(kenar.fark >= 6, `fark ${kenar.fark} (${kenar.adet} tarama)`);
  });

  // (e) zeminKatmaniYolMu kıvrılan orta çizgiyi izliyor
  const yolMu = await p.evaluate(() => {
    __kur(1);
    const z = game._zeminKatmani;
    let secili = null;
    for (const yol of z.yollar) {
      const S = yol.ornekler;
      if (!S || S.length < 4) continue;
      for (let i = 2; i < S.length - 2; i++) {
        const a = S[i - 1], c = S[i + 1], s = S[i];
        const dx = c.x - a.x, dy = c.y - a.y, uz = Math.hypot(dx, dy) || 1;
        const nx = -dy / uz, ny = dx / uz, gen = yol.gen || 64;
        const p1 = { x: s.x + nx * gen * 1.5, y: s.y + ny * gen * 1.5 };
        const p2 = { x: s.x - nx * gen * 1.5, y: s.y - ny * gen * 1.5 };
        if (zeminKatmaniYolMu(s.x, s.y) && !zeminKatmaniYolMu(p1.x, p1.y) && !zeminKatmaniYolMu(p2.x, p2.y)) { secili = { i }; break; }
      }
      if (secili) break;
    }
    return secili;
  });
  sina('(e) yolMu kıvrılan merkezde doğru, 1,5×gen uzakta yanlış', () => {
    assert.ok(yolMu, 'uygun örnek bulunamadı');
  });

  sina('(f) sayfa hatası yok', () => { assert.deepEqual(hatalar, []); });
} finally {
  await b.close(); sunucu.close();
}
for (const s of sonuclar) console.log(s);
const basarisiz = sonuclar.filter((s) => s.startsWith('✗')).length;
if (hatalar.length) { console.log('Sayfa hataları:', hatalar.join(' | ')); }
if (basarisiz || hatalar.length) { console.log(`${basarisiz} başarısız, ${hatalar.length} sayfa hatası`); process.exit(1); }
console.log(`Tümü geçti (${sonuclar.length})`);
