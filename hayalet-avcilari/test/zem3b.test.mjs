// Hayalet Avcıları: ZEM3B pişmiş ışık — yönlü gölgeler, çukur yol pervazı, oyuncu ışık halkası.
// Çalıştırma: node test/zem3b.test.mjs
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
  await p.waitForFunction(() => typeof startGame === 'function' && typeof zeminKatmaniKur === 'function' && typeof isikHalkasiCiz === 'function');

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
      game.paused = true; game.menude = false; game._turGeciste = false;
      game.ghosts = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
      game.player.invuln = 1e9; game.player.dead = false;
      game.camera.x = game.player.x - game.W / 2; game.camera.y = game.player.y - game.H / 2;
      return game;
    };
    window.__lum = (d, i) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
  });

  // (a) Yönlü gölge: ağırlık merkezi nesne tabanının sağında ve altında
  const golge = await p.evaluate(() => {
    const cv = document.createElement('canvas'); cv.width = 240; cv.height = 240;
    const c = cv.getContext('2d');
    const bx = 120, by = 140;
    zeminGolgeCiz(c, bx, by, 34, 11, 90); // 90 px yüksek prop
    const d = c.getImageData(0, 0, 240, 240).data;
    let sx = 0, sy = 0, sw = 0;
    for (let y = 0; y < 240; y++) for (let x = 0; x < 240; x++) {
      const a = d[(y * 240 + x) * 4 + 3];
      if (a > 3) { sx += x * a; sy += y * a; sw += a; }
    }
    return { cx: sx / sw, cy: sy / sw, bx, by };
  });
  sina('(a) gölge ağırlık merkezi tabanın sağında ve altında', () => {
    assert.ok(golge.cx > golge.bx + 0.5, `cx ${golge.cx.toFixed(2)} / ${golge.bx}`);
    assert.ok(golge.cy > golge.by + 0.5, `cy ${golge.cy.toFixed(2)} / ${golge.by}`);
  });

  // (b) Karakter yer gölgesi sağa kaymış (eski merkez 0 idi; boyut değişmedi)
  const karakter = await p.evaluate(() => {
    const proto = CanvasRenderingContext2D.prototype;
    const eski = proto.ellipse, kayit = [];
    proto.ellipse = function (...a) { kayit.push(a); return eski.apply(this, a); };
    let hata = null;
    try {
      const cv = document.createElement('canvas'); cv.width = 240; cv.height = 240;
      const c = cv.getContext('2d');
      drawCharacter(c, 'kinkin', 0, 120, 120, 70, 0, 0, 0, 0, '');
    } catch (e) { hata = e.message; } finally { proto.ellipse = eski; }
    const s = 0.7;
    const g = kayit.find((a) => Math.abs(a[2] - 22 * s) < 0.01 && Math.abs(a[3] - 7 * s) < 0.01);
    return { bulundu: !!g, x: g ? g[0] : null, y: g ? g[1] : null, ayak: ayakY('kinkin', 0, s), hata };
  });
  sina('(b) karakter gölgesi 2 px sağa, 1 px aşağı kaymış', () => {
    assert.ok(karakter.bulundu, 'gölge elipsi bulunamadı');
    assert.ok(Math.abs(karakter.x - 2) < 0.01, String(karakter.x));
    assert.ok(Math.abs(karakter.y - (karakter.ayak + 1)) < 0.01, String(karakter.y));
  });

  // (c) Çukur yol: üst/sol iç pervaz alt/sağdan daha koyu (20 nokta, benek tabanlı, stroke yok)
  const pervaz = await p.evaluate(() => {
    __kur(1);
    const z = game._zeminKatmani;
    z.suslar = []; z.golgeler = []; z.lekeler = []; z.tabelalar = [];
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
    const yolRun = z.yollar.find((y) => {
      const S = y.ornekler;
      return S && Math.floor(S[best.i].x / 512) === best.cx && Math.floor(S[best.i].y / 512) === best.cy &&
        Math.floor(S[best.j].x / 512) === best.cx && Math.floor(S[best.j].y / 512) === best.cy;
    });
    if (!yolRun) return { hata: 'yol parçası bulunamadı' };
    game.camera.x = best.cx * 512; game.camera.y = best.cy * 512;
    const eskiGorsel = window.gorsel;
    window.gorsel = () => null; // desen değişkenliği ölçümü bulandırmasın
    zeminKatmaniSil();
    try { zeminKatmaniCiz(game.ctx); } finally { window.gorsel = eskiGorsel; }
    const parca = game._zeminParcalari.get(best.cx + '|' + best.cy + '|' + s);
    if (!parca) return { hata: 'parça kurulamadı' };
    const ctx = parca.getContext('2d');
    const W = parca.width, H = parca.height, veri = ctx.getImageData(0, 0, W, H).data;
    const px = (x, y) => {
      x = Math.round(x); y = Math.round(y);
      if (x < 0 || y < 0 || x >= W || y >= H) return null;
      return (y * W + x) * 4;
    };
    const lumPx = (x, y) => {
      const i = px(x, y); if (i === null) return null;
      if (veri[i + 3] < 10) return null;
      return __lum(veri, i);
    };
    const S = yolRun.ornekler, yari = (yolRun.gen || 64) / 2;
    const xa = S[best.i].x + 12, xb = S[best.j].x - 12;
    const ox = best.cx * 512, oy = best.cy * 512;
    let ust = 0, alt = 0, n = 0;
    for (let k = 0; k < 20; k++) {
      const wx = xa + (xb - xa) * k / 19;
      let q = best.i;
      while (q < best.j && S[q + 1].x < wx) q++;
      const p0 = S[q], p1 = S[Math.min(best.j, q + 1)];
      const t = Math.max(0, Math.min(1, (wx - p0.x) / ((p1.x - p0.x) || 1)));
      const wy = p0.y + (p1.y - p0.y) * t;
      const w = (p0.w || 1) + ((p1.w || 1) - (p0.w || 1)) * t;
      const dis = (yari * w - 2.5) * s;
      const cx2 = (wx - ox) * s, cy2 = (wy - oy) * s;
      let us = 0, al = 0, usN = 0, alN = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const lu = lumPx(cx2, cy2 - dis + dy);
        const la = lumPx(cx2, cy2 + dis + dy);
        if (lu !== null) { us += lu; usN++; }
        if (la !== null) { al += la; alN++; }
      }
      if (usN && alN) { ust += us / usN; alt += al / alN; n++; }
    }
    return { hata: n < 10 ? 'yeterli örnek yok: ' + n : null, ust: n ? ust / n : 0, alt: n ? alt / n : 0, n };
  });
  sina('(c) yolun üst/sol pervazı alt/sağdan koyu (20 nokta)', () => {
    assert.ok(!pervaz.hata, pervaz.hata || '');
    assert.ok(pervaz.ust < pervaz.alt - 1, `üst ${pervaz.ust.toFixed(1)} / alt ${pervaz.alt.toFixed(1)}`);
  });

  // (d) Işık halkası tuvali ekran boyutu başına bir kez kurulur; kare başına tek drawImage
  const vinyetSayim = await p.evaluate(() => {
    __kur(1);
    game.paused = false; game.menude = false; game._turGeciste = false; game.player.dead = false;
    const W = game.W, H = game.H;
    const proto = CanvasRenderingContext2D.prototype;
    const eCr = proto.createRadialGradient, eDi = proto.drawImage;
    let cr = 0, di = 0, cikti = null;
    proto.createRadialGradient = function (...a) { cr++; return eCr.apply(this, a); };
    proto.drawImage = function (...a) { di++; return eDi.apply(this, a); };
    try {
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const c = cv.getContext('2d');
      for (let i = 0; i < 60; i++) isikHalkasiCiz(c, W / 2, H / 2);
      cikti = { cr, di };
    } finally { proto.createRadialGradient = eCr; proto.drawImage = eDi; }
    return { ...cikti, W, H, alfa: isikHalkasiDurum().alfa };
  });
  sina('(d) vinyet tuvali 60 karede en çok 1 kez kurulur', () => {
    assert.ok(vinyetSayim.cr <= 1, String(vinyetSayim.cr));
  });
  sina('(d) kare başına tek drawImage', () => {
    assert.equal(vinyetSayim.di, 60, String(vinyetSayim.di));
  });

  const vinyetPiksel = await p.evaluate(async () => {
    __kur(1);
    game.paused = false; game.menude = false; game._turGeciste = false; game.player.dead = false;
    const W = game.W, H = game.H;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    for (let i = 0; i < 20; i++) { await new Promise((r) => setTimeout(r, 20)); isikHalkasiCiz(c, W / 2, H / 2); }
    const alfa = isikHalkasiDurum().alfa;
    c.fillStyle = "#ffffff"; c.fillRect(0, 0, W, H);
    isikHalkasiCiz(c, W / 2, H / 2);
    const d = c.getImageData(0, 0, W, H).data;
    const lum = (x, y) => { const i = (y * W + x) * 4; return __lum(d, i); };
    const kose = (lum(6, 6) + lum(W - 7, 6) + lum(6, H - 7) + lum(W - 7, H - 7)) / 4;
    const orta = lum(Math.round(W / 2), Math.round(H / 2));
    return { alfa, kose, orta };
  });
  sina('(d) çizilmiş karede köşeler merkezden koyu', () => {
    assert.ok(vinyetPiksel.alfa > 0.9, String(vinyetPiksel.alfa));
    assert.ok(vinyetPiksel.kose < vinyetPiksel.orta - 20, `${vinyetPiksel.kose.toFixed(1)} / ${vinyetPiksel.orta.toFixed(1)}`);
  });

  // (e) Duraklatılmış/ölü/ISIK_HALKASI=false iken halka söner (300 ms) ve çizilmez
  const kapali = await p.evaluate(async () => {
    __kur(1);
    game.paused = false; game.menude = false; game._turGeciste = false; game.player.dead = false;
    window.ISIK_HALKASI = true;
    const bekle = async () => {
      for (let i = 0; i < 20; i++) { await new Promise((r) => setTimeout(r, 20)); isikHalkasiCiz(game.ctx, 100, 100); }
      return isikHalkasiDurum().alfa;
    };
    const ciziyorMu = () => {
      const proto = CanvasRenderingContext2D.prototype, eDi = proto.drawImage;
      let di = 0;
      proto.drawImage = function (...a) { di++; return eDi.apply(this, a); };
      try { isikHalkasiCiz(game.ctx, 100, 100); } finally { proto.drawImage = eDi; }
      return di;
    };
    const acik = await bekle();
    game.paused = true; const duraklat = await bekle(), duraklatCizim = ciziyorMu();
    game.paused = false; /* tekrar aç */ const yeniden = await bekle();
    game.player.dead = true; const olu = await bekle(), oluCizim = ciziyorMu();
    game.player.dead = false; const yeniden2 = await bekle();
    window.ISIK_HALKASI = false; const kapatildi = await bekle(), kapatCizim = ciziyorMu();
    window.ISIK_HALKASI = true; game.paused = true;
    return { acik, yeniden, yeniden2, duraklat, duraklatCizim, olu, oluCizim, kapatildi, kapatCizim };
  });
  sina('(e) halka açıkken çizilir, duraklatınca söner', () => {
    assert.ok(kapali.acik > 0.9, String(kapali.acik));
    assert.ok(kapali.duraklat <= 0.01, String(kapali.duraklat));
    assert.equal(kapali.duraklatCizim, 0, String(kapali.duraklatCizim));
    assert.ok(kapali.yeniden > 0.9, String(kapali.yeniden));
  });
  sina('(e) oyuncu ölünce halka söner', () => {
    assert.ok(kapali.olu <= 0.01, String(kapali.olu));
    assert.equal(kapali.oluCizim, 0, String(kapali.oluCizim));
    assert.ok(kapali.yeniden2 > 0.9, String(kapali.yeniden2));
  });
  sina('(e) ISIK_HALKASI=false halkayı kapatır', () => {
    assert.ok(kapali.kapatildi <= 0.01, String(kapali.kapatildi));
    assert.equal(kapali.kapatCizim, 0, String(kapali.kapatCizim));
  });

  // (g) Perf1 eşdeğeri: uzun harita / eski harita çizim oranı ≤ 1,3
  const perf = await p.evaluate(() => {
    const olc = (fn) => {
      const a = [];
      for (let r = 0; r < 7; r++) {
        const bas = performance.now();
        for (let i = 0; i < 120; i++) { fn(); game.ctx.getImageData(0, 0, game.W, game.H); }
        a.push(performance.now() - bas);
      }
      a.sort((x, y) => x - y);
      return a[3];
    };
    // Engel önbelleği tam ısınana kadar (ve en az 60 kare) render edilir (perf1 ile aynı).
    const isit = () => {
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
    // CPU gürültüsüne karşı 3 tur ölçülür; en iyi (en az gürültülü) oran raporlanır.
    const birTur = () => {
      if (game.running) endGame(false);
      online.mode = 'host'; online.cachedRoom = { players: {} }; online._yjYok = false;
      startGame();
      game.paused = true; game.ghosts = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
      game.player.dead = false; game.player.invuln = 1e9;
      game.player.x = game.worldW / 2; game.player.y = game.worldH / 2;
      game.camera.x = game.player.x - game.W / 2; game.camera.y = game.player.y - game.H / 2;
      isit();
      const eski = olc(render);
      online.mode = null; endGame(false);

      startGame();
      game.level = 3; buildWalls(); buildWaters(); buildHazards();
      game.paused = true; game.ghosts = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
      game.player.dead = false; game.player.invuln = 1e9;
      const z = game._yolculukDuzen.zones[2];
      game.player.x = (z.x0 + z.gate.x0) / 2; game.player.y = game.worldH / 2;
      game.camera.x = game.player.x - game.W / 2; game.camera.y = game.player.y - game.H / 2;
      isit();
      const yeni = olc(render);
      endGame(false);
      return { eski, yeni, oran: yeni / eski };
    };
    const turlar = [birTur(), birTur(), birTur()];
    let en = turlar[0];
    for (const t of turlar) if (t.oran < en.oran) en = t;
    return { ...en, turlar };
  });
  console.log('PERF oranlar:', perf.turlar.map((t) => t.oran.toFixed(3)).join(' / '))
  sina('(g) uzun harita çizimi eski haritanın 1,3 katını geçmez', () => {
    assert.ok(perf.oran <= 1.3, `oran ${perf.oran.toFixed(3)} (${perf.yeni.toFixed(1)} / ${perf.eski.toFixed(1)})`);
  });
} finally {
  await b.close(); sunucu.close();
}
sina('(f) sayfa hatası yok', () => { assert.deepEqual(hatalar, []); });
for (const s of sonuclar) console.log(s);
const basarisiz = sonuclar.filter((s) => s.startsWith('✗')).length;
if (basarisiz) { console.log(`${basarisiz} başarısız`); process.exit(1); }
console.log(`Tümü geçti (${sonuclar.length})`);
