// Hayalet Avcıları FIXG1: harita objeleri TÜM resmi gösterir — çevrimdışı sınama.
// Obje resmi dönmez, çarpışma biçimine kırpılmaz; tek resim en-boy oranı korunarak ×1.15 hedef kutuya (alt-orta
// hizalı, resim altı kutunun 4 px altında) çizilir. Kopyalama yok; canlı kare aynı dikdörtgene kırpmadan çizilir;
// çarpışma (engelCarpisir/engelMesafesi) ve harita kutuları değişmez. Çalıştırma: node test/fixg1.test.mjs
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

  // (a)+(b) 40 obje: 3 klasik tema + 5 ülke. Kırpma/döndürme yok; tek drawImage; oran korunur; ×1.15 kutu.
  const boya = await p.evaluate(() => {
    const sahte = __sahteKur();
    const kombin = [];
    const boyut = [[80, 80], [150, 90], [90, 150], [120, 120]];
    for (const tema of [0, 1, 2]) for (const tur of ['obje1', 'obje2']) for (const [w, h] of boyut) kombin.push([tur, tema, w, h, `tema${tema + 1}`]);
    for (const kod of ['FR', 'KE', 'TR', 'PL', 'CN']) for (const tur of ['obje1', 'obje2']) for (const [w, h] of boyut) kombin.push([tur, kod, w, h, `ulke-${kod}`]);
    const out = [];
    let i = 0;
    for (const [tur, tema, w, h, ad] of kombin) {
      if (out.length >= 40) break;
      const r = __boya(tur, tema, w, h, 7000 + (i++) * 131);
      out.push({ ad: `${ad}/${tur}/${w}x${h}`, w, h, kirp: r.kirp, donme: r.donme, cizimler: r.cizimler, Y: r.Y });
    }
    __sahteBirak();
    return { sahte, out };
  });
  sina('(a) 40 objede resim kırpılmaz (clip 0), döndürülmez (rotate 0)', () => {
    assert.equal(boya.out.length, 40);
    for (const o of boya.out) {
      assert.equal(o.kirp, 0, `${o.ad} clip ${o.kirp}`);
      assert.equal(o.donme, 0, `${o.ad} rotate ${o.donme}`);
    }
  });
  sina('(a) çizilen dikdörtgen tüm resmi kapsar, en-boy oranı korunur, ×1.15 kutuda', () => {
    const iw = boya.sahte.iw, ih = boya.sahte.ih;
    for (const o of boya.out) {
      assert.equal(o.cizimler.length, 1, `${o.ad} çizim ${o.cizimler.length}`);
      const q = o.cizimler[0];
      assert.ok(Math.abs(q[2] / q[3] - iw / ih) < 1e-6, `${o.ad} oran ${q[2] / q[3]}`);
      assert.ok(q[2] <= o.w * 1.15 + 1e-6 && q[3] <= o.h * 1.15 + 1e-6, `${o.ad} ${q} kutu ${o.w}x${o.h}`);
      // alt-orta hizalı: resim altı = kutu altı + 4
      assert.ok(Math.abs((q[1] + q[3]) - (o.h + 4)) < 1e-6, `${o.ad} taban ${q[1] + q[3]}`);
      assert.ok(Math.abs((q[0] + q[2] / 2) - o.w / 2) < 1e-6, `${o.ad} orta ${q[0] + q[2] / 2}`);
      // tek hedef dikdörtgen kaydedilir, kapak yok
      assert.ok(o.Y && o.Y.kapak === false && o.Y.kayit.length === 1, `${o.ad} yerleşim`);
      assert.deepEqual(o.Y.kayit[0].map((v) => +v.toFixed(4)), Array.from(q).map((v) => +v.toFixed(4)), o.ad);
    }
  });
  sina('(b) her obje için tam bir drawImage (kopya yok)', () => {
    for (const o of boya.out) assert.equal(o.cizimler.length, 1, `${o.ad} kopya ${o.cizimler.length}`);
  });

  // (c) Çarpışma/harita kutuları değişmez: önbellek kurmadan ve kurduktan sonra aynı sonuçlar.
  const carpisma = await p.evaluate(() => {
    const g = __kur(1);
    const W = g.worldW || 2000, H = g.worldH || 2000;
    const noktalar = [];
    for (let i = 0; i < 50; i++) noktalar.push([120 + ((i * 137) % (W - 240)), 120 + ((i * 271) % (H - 240))]);
    const olc = () => noktalar.map(([x, y]) => [engelCarpisir(g.walls, x, y, 20), engelMesafesi(g.walls, x, y, 20)]);
    const kutular = JSON.stringify(g.walls.map((o) => [o.x, o.y, o.w, o.h, o.carpisma]));
    const once = olc();
    for (const o of g.walls) engelResmi(o);
    const sonra = olc();
    return { once, sonra, kutular, n: noktalar.length };
  });
  sina('(c) 50 noktada engelCarpisir/engelMesafesi önbellekten önce = sonra', () => {
    assert.equal(carpisma.n, 50);
    assert.deepEqual(carpisma.sonra, carpisma.once);
  });

  // (d) objeAnimCiz aynı dikdörtgene, kırpmadan çizer.
  const anim = await p.evaluate(() => {
    __sahteKur();
    const r = __boya('obje1', 'FR', 120, 120, 9091);
    const q = r.Y && r.Y.kayit && r.Y.kayit[0];
    if (!q) { __sahteBirak(); return { yok: true }; }
    const cv = document.createElement('canvas'); cv.width = 600; cv.height = 600; const ctx = cv.getContext('2d');
    let kirp = 0; const cizimler = [];
    const ok = ctx.clip.bind(ctx), od = ctx.drawImage.bind(ctx);
    ctx.clip = (...a) => { kirp++; return ok(...a); };
    ctx.drawImage = (im, ...a) => { cizimler.push(a.slice(-4)); return od(im, ...a); };
    const okundu = objeAnimCiz(ctx, r.o, 'ulke-FR-1', 2);
    __sahteBirak();
    return { yok: false, okundu, kirp, cizimler, q };
  });
  sina('(d) objeAnimCiz aynı hedef dikdörtgene, kırpmadan çizer', () => {
    assert.ok(!anim.yok, 'FR obje1 yerleşimi yok');
    assert.equal(anim.okundu, true);
    assert.equal(anim.kirp, 0);
    assert.equal(anim.cizimler.length, 1, JSON.stringify(anim.cizimler));
    assert.deepEqual(anim.cizimler[0].map((v) => +v.toFixed(4)), anim.q.map((v) => +v.toFixed(4)));
  });

  // (e) sayfa hatası yok (aşağıda, bütün sınamalardan sonra denetlenir).

  // (f) PERF1 oranı: uzun harita, bölge 3 / eski harita ≤ 1.3.
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
  console.log(`PERF eski ${eski.ms.toFixed(2)} ms / yeni ${yeni.ms.toFixed(2)} ms → oran ${oran.toFixed(3)}`);
  sina('(f) uzun haritada çizim kare süresi eski haritanın 1,3 katını geçmez', () => {
    assert.ok(yeni.ms <= eski.ms * 1.3, `${yeni.ms.toFixed(1)} / ${eski.ms.toFixed(1)} (oran ${oran.toFixed(3)})`);
  });

  // (e) sayfa hatası yok
  sina('(e) sayfa hatası yok', () => { assert.deepEqual(hatalar, []); });

  // Yakın plan görüntüler: Eyfel (FR), zürafa (KE), klasik tema 1 objesi, küçük obje (TR)
  const cekim = async (ad, kod, tur) => {
    const kuruldu = await p.evaluate(({ kod, tur }) => {
      if (game.running) endGame(false);
      online.mode = null; startGame();
      const o = engelOlustur({ x: 1000, y: 1000, w: 160, h: 180 }, tur, kod == null ? 0 : kod, 4242 + (kod == null ? 7 : kod.charCodeAt(0)));
      game.walls = [o]; game.waters = []; game.spikes = []; game.lavas = [];
      game.paused = true; game.running = false; game.ghosts = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
      game.camera.x = o.x + o.w / 2 - game.W / 2; game.camera.y = o.y + o.h / 2 - game.H / 2;
      game.player.x = o.x + o.w / 2; game.player.y = o.y + o.h + 200; game.player.dead = true;
      o._resim = null; o._olcek = 0; o._isinma = 0;
      render();
      const r = game.ctx.canvas.getBoundingClientRect();
      return { yok: false, r: { x: r.x, y: r.y, w: r.width, h: r.height } };
    }, { kod, tur });
    if (!kuruldu.yok) {
      const yarim = Math.round(Math.min(kuruldu.r.w, kuruldu.r.h) * 0.45);
      await p.screenshot({ path: path.join(EKRAN, `fixg1-${ad}.png`), clip: { x: Math.round(kuruldu.r.x + kuruldu.r.w / 2) - yarim, y: Math.round(kuruldu.r.y + kuruldu.r.h / 2) - yarim, width: yarim * 2, height: yarim * 2 } });
    }
    return !kuruldu.yok;
  };
  await p.waitForFunction(() => typeof gorsel === 'function' && !!gorsel('ulke-FR-1') && !!gorsel('ulke-KE-1'), null, { timeout: 15000 }).catch(() => {});
  const c1 = await cekim('eyfel-fr', 'FR', 'obje1');
  const c2 = await cekim('zurafa-ke', 'KE', 'obje1');
  const c3 = await cekim('tema1-obje', null, 'obje1');
  const c4 = await cekim('kucuk-obje-tr', 'TR', 'obje2');
  sina('yakın plan görüntüler yazıldı (Eyfel, zürafa, tema1, küçük obje)', () => {
    assert.ok(c1 && c2 && c3 && c4, JSON.stringify([c1, c2, c3, c4]));
    for (const ad of ['eyfel-fr', 'zurafa-ke', 'tema1-obje', 'kucuk-obje-tr']) assert.ok(fs.existsSync(path.join(EKRAN, `fixg1-${ad}.png`)), ad);
  });
} catch (e) {
  sonuclar.push(`✗ akış yarıda kaldı: ${e.message.split('\n')[0]}`);
} finally {
  for (const s of sonuclar) console.log(s);
  await b.close();
  sunucu.close();
}
