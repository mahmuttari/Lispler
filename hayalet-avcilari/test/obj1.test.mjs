import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const WWW = path.join(KOK, 'www');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);
const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2', '.webp': 'image/webp', '.m4a': 'audio/mp4' };
const sunucu = http.createServer((q, r) => {
  const f = path.join(WWW, decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html');
  if (!f.startsWith(WWW) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': TUR[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(0);
const adres = `http://127.0.0.1:${sunucu.address().port}/index.html`;
const EKRAN = path.join(KOK, 'test', 'ekran');

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
  await p.waitForFunction(() => typeof startGame === 'function' && typeof engelleriCiz === 'function' && typeof objeAnimCiz === 'function' && typeof engelOlustur === 'function');

  await p.evaluate(() => {
    window.__kur = (level = 1) => {
      if (game.running) endGame(false);
      online.mode = null;
      startGame();
      game.level = level;
      buildWalls(); buildWaters(); buildHazards();
      game.paused = true; game.running = false;
      game.ghosts = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
      game.camera.x = game.player.x - game.W / 2; game.camera.y = game.player.y - game.H / 2;
      return game;
    };
    // Sahte resim: 60×100 (en-boy 0.6) — resmin doğal boyu bilinsin diye canvas.
    window.__sahteKur = () => {
      const sahte = document.createElement('canvas'); sahte.width = 60; sahte.height = 100;
      const sx = sahte.getContext('2d'); sx.fillStyle = '#3a7'; sx.fillRect(0, 0, 60, 100);
      window.__gercekGorsel = window.gorsel;
      window.gorsel = () => sahte;
      return { iw: 60, ih: 100 };
    };
    window.__sahteBirak = () => { if (window.__gercekGorsel) window.gorsel = window.__gercekGorsel; };
    // Tek objeyi engelBoya ile çiz; clip/rotate çağrılarını ve drawImage dikdörtgenini topla.
    window.__boya = (tur, tema, w, h, tohum) => {
      const o = engelOlustur({ x: 300, y: 200, w, h }, tur, tema, tohum);
      const cv = document.createElement('canvas'); cv.width = Math.ceil(w * 2 + 160); cv.height = Math.ceil(h * 2 + 160);
      const ctx = cv.getContext('2d'); ctx.translate(80, 80);
      let kirp = 0, donme = 0; const cizimler = [];
      const ok = ctx.clip.bind(ctx), or = ctx.rotate.bind(ctx), od = ctx.drawImage.bind(ctx);
      ctx.clip = (...a) => { kirp++; return ok(...a); };
      ctx.rotate = (...a) => { donme++; return or(...a); };
      ctx.drawImage = (im, ...a) => { cizimler.push(a.slice(-4)); return od(im, ...a); };
      engelBoya(ctx, o);
      return { o, kirp, donme, cizimler, Y: o.bicim && o.bicim._objeYerlesim };
    };
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
    window.__olc = (fn, n = 60) => {
      const ctx2 = game.ctx, gid = ctx2.getImageData.bind(ctx2), GW = game.W, GH = game.H;
      const a = [];
      for (let r = 0; r < 5; r++) {
        const bas = performance.now();
        for (let i = 0; i < n; i++) { fn(); gid(0, 0, GW, GH); }
        a.push(performance.now() - bas);
      }
      a.sort((x, y) => x - y);
      return a[2];
    };
  });

  await p.waitForFunction(() => typeof gorsel === 'function' && !!gorsel('ulke-FR-1') && !!gorsel('tema1-obje1') && !!gorsel('tema2-obje2'), null, { timeout: 20000 }).catch(() => {});

  // Kutuyu uydurup gerçek resimle çizer; resim dikdörtgeni ve gölge piksel taşması ölçülür (yerel koordinat)
  const sonuc = await p.evaluate(() => {
    const out = [];
    const temalar = [0, 1, 2, 3, 4, 5, 'FR', 'KE', 'TR', 'PL', 'CN', 'JP', 'EG', 'US'];
    const kutular = { uzun: [80, 230], genis: [250, 90], kare: [120, 120], cokuzun: [60, 260] };
    const olc = (tur, tema, ad, w, h) => {
      const o = { x: 400, y: 300, w, h };
      const ilk = { ...o };
      objeKutusuUydur(o, tur, tema);
      const o2 = objeKutusuUydur({ x: 400, y: 300, w, h }, tur, tema); // belirlenimlilik
      engelOlustur(o, tur, tema, 5151);
      const k = typeof tema === 'string' ? `ulke-${tema}-${tur === 'obje1' ? 1 : 2}` : `tema${tema + 1}-${tur}`;
      const im = gorsel(k);
      // Gölge: resim çizimi atlanır, yalnız gölge piksellerine bakılır
      const PAY = 200;
      const cv = document.createElement('canvas'); cv.width = Math.ceil(o.w + 2 * PAY); cv.height = Math.ceil(o.h + 2 * PAY);
      const ctx = cv.getContext('2d'); ctx.translate(PAY, PAY);
      let rect = null;
      ctx.drawImage = (i, ...a) => { rect = a.slice(-4); };
      engelBoya(ctx, o);
      const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
      let disarda = 0, toplam = 0;
      if (rect) {
        const m = 8, l = PAY + rect[0] - m, t = PAY + rect[1] - m, r = PAY + rect[0] + rect[2] + m, b = PAY + rect[1] + rect[3] + m;
        for (let y = 0; y < cv.height; y++) for (let xx = 0; xx < cv.width; xx++) {
          if (d[(y * cv.width + xx) * 4 + 3] > 2) { toplam++; if (xx < l || xx >= r || y < t || y >= b) disarda++; }
        }
      }
      let kapsam = 0, tasma = 0, carpTasma = 0;
      if (rect) {
        const ix = Math.max(0, Math.min(o.w, rect[0] + rect[2]) - Math.max(0, rect[0]));
        const iy = Math.max(0, Math.min(o.h, rect[1] + rect[3]) - Math.max(0, rect[1]));
        kapsam = (ix * iy) / (o.w * o.h);
        tasma = (rect[2] * rect[3]) / (o.w * o.h);
        // Çarpışma biçimi dünya koordinatında; yerel kutuya çevir ve resmin dışına taşan kısmı ölç
        let mx = 1e9, my = 1e9, Mx = -1e9, My = -1e9;
        for (const q of o.carpisma) {
          const bx0 = q.t === 'd' ? q.x - q.r : q.t === 'e' ? q.x - q.rx : q.x, bx1 = q.t === 'd' ? q.x + q.r : q.t === 'e' ? q.x + q.rx : q.x + q.w;
          const by0 = q.t === 'd' ? q.y - q.r : q.t === 'e' ? q.y - q.ry : q.y, by1 = q.t === 'd' ? q.y + q.r : q.t === 'e' ? q.y + q.ry : q.y + q.h;
          mx = Math.min(mx, bx0); Mx = Math.max(Mx, bx1); my = Math.min(my, by0); My = Math.max(My, by1);
        }
        carpTasma = Math.max(mx < rect[0] ? rect[0] - mx : 0, Mx > rect[0] + rect[2] ? Mx - (rect[0] + rect[2]) : 0, my < rect[1] ? rect[1] - my : 0, My > rect[1] + rect[3] ? My - (rect[1] + rect[3]) : 0);
      }
      return {
        ad: `${k}/${ad}`, yuklu: !!im && !!rect, kapsam, tasma, disarda, toplam, carpTasma,
        kucul: o.w <= ilk.w && o.h <= ilk.h,
        merkez: Math.abs((o.x + o.w / 2) - (ilk.x + ilk.w / 2)) <= 1 && Math.abs((o.y + o.h / 2) - (ilk.y + ilk.h / 2)) <= 1,
        icinde: o.x >= ilk.x - 1 && o.y >= ilk.y - 1 && o.x + o.w <= ilk.x + ilk.w + 1 && o.y + o.h <= ilk.y + ilk.h + 1,
        det: o2.x === o.x && o2.y === o.y && o2.w === o.w && o2.h === o.h,
        alan: (o.w * o.h) / (ilk.w * ilk.h), ilk: [ilk.w, ilk.h], son: [o.w, o.h],
      };
    };
    for (const tema of temalar) for (const tur of ['obje1', 'obje2']) for (const [ad, [w, h]] of Object.entries(kutular)) out.push(olc(tur, tema, ad, w, h));
    return out;
  });
  const yuklu = sonuc.filter((r) => r.yuklu);
  console.log(`ölçülen ${sonuc.length}, resmi yüklü ${yuklu.length}`);
  sina('çok sayıda tema/ülke/kutu biçimi ölçüldü, resimler yüklü', () => { assert.ok(sonuc.length >= 100); assert.equal(yuklu.length, sonuc.length, `yüklü olmayan: ${sonuc.filter((r) => !r.yuklu).map((r) => r.ad).slice(0, 5)}`); });
  sina('resim çarpışma kutusunun >= %80 alanını kaplar (uzun, geniş, kare)', () => {
    for (const r of yuklu) assert.ok(r.kapsam >= 0.8, `${r.ad} kapsam ${r.kapsam.toFixed(2)} (${r.ilk} -> ${r.son})`);
  });
  sina('resim kutunun en fazla 1,5 katı alanda çizilir (resim küçük kalmaz)', () => {
    for (const r of yuklu) assert.ok(r.tasma <= 1.5, `${r.ad} resim/kutu ${r.tasma.toFixed(2)}`);
  });
  sina('gölge resim + 8 px dışına taşmaz', () => {
    for (const r of yuklu) assert.equal(r.disarda, 0, `${r.ad} dışarıda ${r.disarda}/${r.toplam}`);
  });
  sina('çarpışma (görünmez duvar) resmin dışına 6 px den fazla taşmaz', () => {
    for (const r of yuklu) assert.ok(r.carpTasma <= 6, `${r.ad} taşma ${r.carpTasma.toFixed(1)}`);
  });
  sina('kutu yalnız küçülür, merkez korunur, eski kutunun içinde kalır', () => {
    for (const r of yuklu) { assert.ok(r.kucul, `${r.ad} büyüdü ${r.ilk}->${r.son}`); assert.ok(r.merkez, `${r.ad} merkez`); assert.ok(r.icinde, `${r.ad} dışına çıktı`); }
  });
  sina('belirlenimli: aynı girdi aynı kutu', () => { for (const r of yuklu) assert.ok(r.det, r.ad); });

  // Gerçek harita: buildWalls sonrası obje kutuları resim oranında; iki kurulum aynı kutuları verir
  const harita = await p.evaluate(() => {
    const anahtar = (o) => (typeof o.tema === 'string' ? `ulke-${o.tema}-${o.tur === 'obje1' ? 1 : 2}` : `tema${o.tema + 1}-${o.tur}`);
    const obj = () => game.walls.filter((o) => o.tur === 'obje1' || o.tur === 'obje2').map((o) => {
      const d = GORSEL_LISTESI[anahtar(o)];
      return { k: anahtar(o), x: o.x, y: o.y, w: o.w, h: o.h, oran: d ? (o.w / o.h) / (d[0] / d[1]) : 1 };
    });
    const kur = (level, tur) => {
      if (game.running) endGame(false);
      online.mode = null; startGame(tur ? { tur: true, ulke: ulkeKodla(tur).sira } : undefined);
      game.level = tur ? ulkeKodla(tur).sira : level;
      buildWalls(); buildWaters(); buildHazards();
      game.paused = true; game.running = false;
      return obj();
    };
    const s = [];
    for (const lv of [1, 2, 3, 4, 5, 6]) { const a = kur(lv), b = kur(lv); s.push({ lv, n: a.length, esit: JSON.stringify(a) === JSON.stringify(b), kotu: a.filter((o) => o.oran < 0.8 || o.oran > 1.25).map((o) => `${o.k} ${o.w}x${o.h}`) }); }
    for (const kod of ['FR', 'KE', 'TR', 'CN']) { const a = kur(0, kod), b = kur(0, kod); s.push({ lv: kod, n: a.length, esit: JSON.stringify(a) === JSON.stringify(b), kotu: a.filter((o) => o.oran < 0.8 || o.oran > 1.25).map((o) => `${o.k} ${o.w}x${o.h}`) }); }
    return s;
  });
  console.log(JSON.stringify(harita.map((h) => [h.lv, h.n, h.kotu.length])));
  sina('gerçek haritada obje kutuları resim oranında (+-%25), aynı seviye iki kurulumda aynı', () => {
    for (const h of harita) { assert.ok(h.esit, `seviye ${h.lv} belirlenimsiz`); assert.deepEqual(h.kotu, [], `seviye ${h.lv}`); }
    assert.ok(harita.reduce((t, h) => t + h.n, 0) > 5, 'obje yok');
  });

  // PERF oranı (FIXG1 ile aynı yöntem): uzun harita çizim süresi
  const eski = await p.evaluate(() => {
    online.mode = 'host'; startGame();
    game.paused = true; game.ghosts = []; game.pickups = []; game.projectiles = []; game.enemyProjectiles = []; game.effects = []; game.bot = null;
    game.player.x = game.worldW / 2; game.player.y = game.worldH / 2;
    game.camera.x = game.player.x - game.W / 2; game.camera.y = game.player.y - game.H / 2;
    const isinma = __isit(); const ms = __olc(render);
    online.mode = null; endGame(false);
    return { ms, isinma };
  });
  const yeni = await p.evaluate(() => {
    online.mode = 'host'; startGame({ tur: true, ulke: ulkeKodla('TR').sira });
    game.paused = true; game.ghosts = []; game.pickups = []; game.projectiles = []; game.enemyProjectiles = []; game.effects = []; game.bot = null;
    game.level = 3; buildWalls(); buildWaters(); buildHazards();
    const z = game._yolculukDuzen.zones[2];
    game.player.x = (z.x0 + z.gate.x0) / 2; game.player.y = game.worldH / 2;
    game.camera.x = game.player.x - game.W / 2; game.camera.y = game.player.y - game.H / 2;
    const isinma = __isit(); const ms = __olc(render);
    online.mode = null; endGame(false);
    return { ms, isinma };
  });
  const oran = yeni.ms / eski.ms;
  console.log(`PERF eski ${eski.ms.toFixed(2)} ms / yeni ${yeni.ms.toFixed(2)} ms -> oran ${oran.toFixed(3)}`);
  sina('uzun haritada çizim kare süresi eski haritanın 1,3 katını geçmez', () => {
    assert.ok(yeni.ms <= eski.ms * 1.3, `${yeni.ms.toFixed(1)} / ${eski.ms.toFixed(1)} (oran ${oran.toFixed(3)})`);
  });
  sina('sayfa hatası yok', () => { assert.deepEqual(hatalar, []); });
} catch (e) {
  sonuclar.push(`✗ akış yarıda kaldı: ${e.message.split('\n')[0]}`);
} finally {
  for (const s of sonuclar) console.log(s);
  await b.close();
  sunucu.close();
  if (sonuclar.some((s) => s.startsWith('✗'))) process.exitCode = 1;
}
