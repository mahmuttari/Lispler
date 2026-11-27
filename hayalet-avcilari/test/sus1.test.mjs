// Hayalet Avcıları SUS1: taban süsleri üst üste binmesin — çevrimdışı sınama.
// Çalıştırma: node test/sus1.test.mjs
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

const sonuclar = [];
function sina(ad, fn) {
  try { fn(); sonuclar.push(`✓ ${ad}`); } catch (e) { sonuclar.push(`✗ ${ad}: ${e.message.split('\n')[0]}`); }
}

const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const hatalar = [];
try {
  const p = await b.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
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
    window.__kur = (level = 1, tur = null, klasik = false, kapali = false) => {
      if (game.running) endGame(false);
      online.mode = klasik ? 'host' : null;
      online.cachedRoom = klasik ? { players: {} } : null;
      online._yjYok = false;
      window.__susAyiklaKapali = !!kapali;
      startGame(tur ? { tur: true, ulke: ulkeKodla(tur).sira } : undefined);
      game.level = level;
      buildWalls(); buildWaters(); buildHazards();
      zeminKatmaniKur();
      game.paused = true; game.running = false;
      game.ghosts = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
      game.player.dead = false; game.player.invuln = 1e9;
      game.camera.x = game.player.x - game.W / 2; game.camera.y = game.player.y - game.H / 2;
      return game;
    };
    window.__suslar = () => (game._zeminKatmani.suslar || []).map((s) => ({ x: s.x, y: s.y, boy: s.boy, ad: s.ad, kenar: s.kenar === true }));
    window.__icKutu = (s) => ({ x: s.x, y: s.y - s.boy / 2, hx: s.boy * 0.35, hy: s.boy * 0.35 });
    // İki kutunun iki eksende de > tol kadar kesiştiği çiftleri sayar
    window.__ciftSay = (liste, tol = 0.5) => {
      const k = liste.map(__icKutu);
      let n = 0;
      for (let i = 0; i < k.length; i++) {
        for (let j = i + 1; j < k.length; j++) {
          const ox = k[i].hx + k[j].hx - Math.abs(k[i].x - k[j].x);
          const oy = k[i].hy + k[j].hy - Math.abs(k[i].y - k[j].y);
          if (ox > tol && oy > tol) n++;
        }
      }
      return n;
    };
    window.__sabitKutular = () => {
      const out = [];
      const y = typeof yolculukAcik === 'function' && yolculukAcik();
      if (y) {
        for (const q of (game._yolculukDonatilar || [])) {
          if (!q || !(q.w > 0) || !(q.h > 0)) continue;
          out.push({ x: q.x, y: q.y, hx: q.w * 0.4, hy: q.h * 0.4, tur: 'donati' });
        }
        const d = game._yolculukDuzen;
        for (const z of ((d && d.zones) || [])) {
          for (const g of (z._gecitSus || [])) out.push({ x: g.x, y: g.y, hx: g.size * 0.35, hy: g.size * 0.35, tur: 'gecit' });
        }
        for (const yv of (game.yuvalar || [])) out.push({ x: yv.x, y: yv.y, hx: yv.r || 32, hy: yv.r || 32, tur: 'yuva' });
      }
      for (const tb of (game._zeminKatmani.tabelalar || [])) out.push({ x: tb.x, y: tb.y, hx: 24, hy: 24, tur: 'tabela' });
      return out;
    };
    window.__sabitCiftSay = (tol = 0.5) => {
      const s = window.__suslar().map(__icKutu), f = window.__sabitKutular();
      let n = 0;
      for (const a of s) for (const c of f) {
        const ox = a.hx + c.hx - Math.abs(a.x - c.x);
        const oy = a.hy + c.hy - Math.abs(a.y - c.y);
        if (ox > tol && oy > tol) n++;
      }
      return n;
    };
    window.__kural = () => {
      const kotu = [];
      for (const s of window.__suslar()) {
        if (collidesWaters(s.x, s.y, 0)) kotu.push('su');
        if (collidesWalls(s.x, s.y, 0)) kotu.push('duvar');
        if (zeminKatmaniYolMu(s.x, s.y)) kotu.push('yol');
        if (s.x < 8 || s.x > game.worldW - 8 || s.y < 8 || s.y > game.worldH - 8) kotu.push('dunya');
      }
      return kotu.slice(0, 10);
    };
    window.__json = () => JSON.stringify(window.__suslar().map((s) => [s.x, s.y, s.boy, s.ad]));
    window.__isit = () => {
      let kare = 0, bos = 0, onceki = -1;
      const adim = 384, W = game.worldW, H = game.worldH;
      for (let tur = 0; tur < 600; tur++) {
        const nx = Math.floor(W / adim) + 1, ny = Math.floor(H / adim) + 1, i = tur % (nx * ny);
        game.camera.x = Math.max(0, (i % nx) * adim - game.W / 2);
        game.camera.y = Math.max(0, Math.floor(i / nx) * adim - game.H / 2);
        zeminKatmaniCiz(game.ctx); kare++;
        if (kare < 60) continue;
        if (game._zeminParcalari.size === onceki) { if (++bos > nx * ny) break; } else bos = 0;
        onceki = game._zeminParcalari.size;
      }
      game.camera.x = game.player.x - game.W / 2; game.camera.y = game.player.y - game.H / 2;
      return kare;
    };
    window.__olc = (n = 120) => {
      const ctx2 = game.ctx, gid = ctx2.getImageData.bind(ctx2), GW = game.W, GH = game.H;
      const a = [];
      for (let r = 0; r < 7; r++) {
        const bas = performance.now();
        for (let i = 0; i < n; i++) { render(); gid(0, 0, GW, GH); }
        a.push(performance.now() - bas);
      }
      a.sort((x, y) => x - y);
      return a[3];
    };
  });

  // (a) Hiçbir iki süs iç kutusu iki eksende de 0,5 px'den çok kesişmez
  const a = await p.evaluate(() => {
    const out = {};
    for (const lev of [1, 7]) { __kur(lev); out['yol' + lev] = __ciftSay(__suslar()); }
    __kur(1, 'TR'); out.tur = __ciftSay(__suslar());
    __kur(1, null, true); out.klasik = __ciftSay(__suslar());
    return out;
  });
  sina('(a) dört haritada da süs çiftleri kesişmiyor', () => {
    for (const k in a) assert.equal(a[k], 0, `${k}: ${a[k]}`);
  });

  // (b) Yolculuk haritalarında süsler donatı/yuva/geçit/tabela kutularına girmiyor
  const b2 = await p.evaluate(() => {
    const out = {};
    for (const lev of [1, 7]) { __kur(lev); out['yol' + lev] = __sabitCiftSay(); }
    __kur(1, 'TR'); out.tur = __sabitCiftSay();
    return out;
  });
  sina('(b) süsler donatı, yuva, kıyı süsü ve tabela kutularına girmiyor', () => {
    for (const k in b2) assert.equal(b2[k], 0, `${k}: ${b2[k]}`);
  });

  // (c) Yerleştirme kuralları: su, duvar, yol, dünya dışı yok
  const c = await p.evaluate(() => {
    const out = {};
    for (const lev of [1, 7]) { __kur(lev); out['yol' + lev] = __kural(); }
    __kur(1, 'TR'); out.tur = __kural();
    __kur(1, null, true); out.klasik = __kural();
    return out;
  });
  sina('(c) her süs su, duvar, yol ve dünya dışı kurallarına uyuyor', () => {
    for (const k in c) assert.deepEqual(c[k], [], k);
  });

  // (d) Belirlenimci: aynı harita iki kez aynı JSON; 1 ile 2 farklı
  const d = await p.evaluate(() => {
    __kur(1); const j1 = __json();
    __kur(1); const j1b = __json();
    __kur(2); const j2 = __json();
    __kur(1, 'TR'); const t1 = __json();
    __kur(1, 'TR'); const t1b = __json();
    return { ayni1: j1 === j1b, ayniTur: t1 === t1b, farkli: j1 !== j2 };
  });
  sina('(d) aynı harita aynı süsleri verir; bölüm 1 ve 2 farklı', () => {
    assert.ok(d.ayni1 && d.ayniTur && d.farkli, JSON.stringify(d));
  });

  // (e) Sayı: ayıklamalı süs sayısı, ayıklamasızın en az %85'i ve > 0
  const e = await p.evaluate(() => {
    const out = {};
    const olc = (ad, lev, tur, klasik) => {
      __kur(lev, tur, klasik, true); const kapali = __suslar().length;
      __kur(lev, tur, klasik, false); const acik = __suslar().length;
      out[ad] = { kapali, acik };
    };
    olc('yol1', 1); olc('yol7', 7); olc('tur', 1, 'TR'); olc('klasik', 1, null, true);
    return out;
  });
  sina('(e) ayıklama süslerin en az %85 ini korur', () => {
    for (const k in e) {
      const r = e[k];
      assert.ok(r.acik > 0, `${k} sıfır`);
      assert.ok(r.acik >= r.kapali * 0.85, `${k}: ${r.acik} / ${r.kapali}`);
    }
  });

  // (f) Ayıklama gerçekten iş görüyor: kapalıyken yol 1'de en az 50 çakışan çift
  const f = await p.evaluate(() => { __kur(1, null, false, true); return __ciftSay(__suslar()); });
  sina('(f) ayıklama kapalıyken yol 1de en az 50 çakışan çift var', () => {
    assert.ok(f >= 50, String(f));
  });

  // (g) Harita kurulumunda Math.random yok
  const g = await p.evaluate(() => {
    __kur(1, null, false, false);
    const eski = Math.random; let n = 0;
    Math.random = () => { n++; return eski(); };
    try { zeminKatmaniKur(); } finally { Math.random = eski; }
    return n;
  });
  sina('(g) harita kurulumunda Math.random çağrısı yok', () => { assert.equal(g, 0, String(g)); });

  // (h) Kurulum süresi: geçiş en çok 60 ms ekler (5 koşunun medyanı)
  const h = await p.evaluate(() => {
    __kur(1, null, false, false);
    const med = (kapali) => {
      const a = [];
      for (let i = 0; i < 5; i++) {
        window.__susAyiklaKapali = kapali;
        const bas = performance.now(); zeminKatmaniKur(); a.push(performance.now() - bas);
      }
      a.sort((x, y) => x - y); return a[2];
    };
    const kapali = med(true), acik = med(false);
    window.__susAyiklaKapali = false;
    return { kapali, acik };
  });
  sina('(h) süs ayıklama kuruluma en çok 60 ms ekler', () => {
    assert.ok(h.acik - h.kapali <= 60, `${h.acik.toFixed(1)} - ${h.kapali.toFixed(1)} ms`);
  });

  // (i) Çizim hızı: geçişle bölüm 3, kapalıya göre en çok 1,1 kat
  const i = await p.evaluate(() => {
    __kur(3, null, false, false); __isit(); const acik = __olc();
    __kur(3, null, false, true); __isit(); const kapali = __olc();
    window.__susAyiklaKapali = false;
    return { acik, kapali };
  });
  sina('(i) süs ayıklamalı çizim daha yavaş değil (oran ≤ 1,1)', () => {
    const oran = i.acik / i.kapali;
    assert.ok(oran <= 1.1, `${i.acik.toFixed(1)} / ${i.kapali.toFixed(1)} = ${oran.toFixed(3)}`);
  });
} finally {
  await b.close();
  sunucu.close();
}

for (const s of sonuclar) console.log(s);
if (hatalar.length) console.log('Sayfa hataları:', hatalar.join(' | '));
sina('(j) sayfa hatası yok', () => { assert.deepEqual(hatalar, []); });
console.log(sonuclar[sonuclar.length - 1]);
const basarisiz = sonuclar.filter((s) => s.startsWith('✗')).length;
if (basarisiz || hatalar.length) { console.log(`${basarisiz} başarısız, ${hatalar.length} sayfa hatası`); process.exit(1); }
console.log(`Tümü geçti (${sonuclar.length})`);
