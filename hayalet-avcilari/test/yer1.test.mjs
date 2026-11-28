// Hayalet Avcıları YER1: ChatGPT yerleşim şablonları — çevrimdışı sınama.
// Çalıştırma: node test/yer1.test.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const WWW = path.join(KOK, 'www');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);
const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp' };
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

// Sınamada kullanılan sahte şablonlar (depoya yazılmaz)
const A = {
  id: 'a-test', uygun: ['her'],
  ogeler: [
    { tip: 'anit', u: 0.5, v: 0.08, w: 0.1, h: 0.08 },
    { tip: 'obje', u: 0.75, v: 0.08, w: 0.08, h: 0.08 },
    { tip: 'duvar', u: 0.8, v: 0.12, w: 0.05, h: 0.1 },
    { tip: 'gol', u: 0.5, v: 0.85, w: 0.16, h: 0.12 },
    { tip: 'yuva', u: 0.12, v: 0.05 },
    { tip: 'yuva', u: 0.72, v: 0.05 },
    { tip: 'yuva', u: 0.12, v: 0.95 },
    { tip: 'yuva', u: 0.72, v: 0.95 },
    { tip: 'donati', u: 0.25, v: 0.7, adet: 3 },
    { tip: 'meydan', u: 0.5, v: 0.5, r: 0.1 },
  ],
  yol: [[0, 0.5], [0.3, 0.45], [0.6, 0.55], [1, 0.5]],
};
const C = {
  id: 'c-test', uygun: ['her'],
  ogeler: [
    { tip: 'anit', u: 0.5, v: 0.5, w: 0.3, h: 0.24 }, // koridorun tam üstünde: atlanmalı
    { tip: 'yuva', u: 0.12, v: 0.05 }, { tip: 'yuva', u: 0.72, v: 0.05 },
    { tip: 'yuva', u: 0.12, v: 0.95 }, { tip: 'yuva', u: 0.72, v: 0.95 },
  ],
  yol: [[0, 0.5], [0.5, 0.5], [1, 0.5]],
};
const D = {
  id: 'd-test', uygun: ['her'],
  ogeler: [
    { tip: 'yuva', u: 0.3, v: 0.05 }, { tip: 'yuva', u: 0.7, v: 0.05 },
    { tip: 'yuva', u: 0.3, v: 0.95 }, { tip: 'yuva', u: 0.7, v: 0.95 },
  ],
  yol: [[0, 0.5], [1, 0.5]],
};
const E = {
  id: 'e-test', uygun: ['her'],
  ogeler: [
    { tip: 'meydan', u: 0.5, v: 0.5, r: 0.1 },
    { tip: 'anit', u: 0.5, v: 0.5, w: 0.12, h: 0.12 }, // meydanın içinde: atlanmalı
    { tip: 'yuva', u: 0.12, v: 0.05 }, { tip: 'yuva', u: 0.72, v: 0.05 },
    { tip: 'yuva', u: 0.12, v: 0.95 }, { tip: 'yuva', u: 0.72, v: 0.95 },
  ],
  yol: [[0, 0.5], [1, 0.5]],
};

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
  await p.waitForFunction(() => typeof startGame === 'function' && typeof yolculukHaritaKur === 'function' && typeof zeminKatmaniKur === 'function');
  await p.evaluate(() => {
    window.__sablonKur = (liste) => { window.YERLESIM_SABLONLARI = JSON.parse(JSON.stringify(liste)); };
    window.__kur = (level = 1) => {
      if (game.running) endGame(false);
      online.mode = null;
      startGame();
      game.level = level;
      buildWalls(); buildWaters(); buildHazards();
      game.paused = true; game.running = false;
      game.ghosts = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
      game.player.invuln = 1e9; game.player.dead = false;
      return game;
    };
    window.__anlik = () => JSON.stringify({
      walls: game.walls.map((o) => [o.x, o.y, o.w, o.h, o.tur || null]),
      waters: game.waters.map((o) => [o.x, o.y, o.w, o.h]),
      yuvalar: game.yuvalar.map((o) => [o.x, o.y, o.r]),
    });
    window.__sayilar = () => ({
      walls: game.walls.length, waters: game.waters.length, yuvalar: game.yuvalar.length,
      spikes: game.spikes.length, lavas: game.lavas.length,
    });
    window.__harita = (lay, i) => {
      const z = game._yolculukDuzen.zones[i - 1];
      const icX0 = z.x0 + 30, icX1 = z.gate.x0 - 20;
      const ayna = yolculukRastgele(game.level, yolculukUlkeKodu(), i, 4243) < 0.5;
      const mx = (u) => icX0 + (ayna ? 1 - u : u) * (icX1 - icX0);
      const my = (v) => 70 + v * (YOLCULUK_AYAR.worldH - 140);
      return { z, icX0, icX1, ayna, mx, my };
    };
  });

  // (a) anıt eşlenen noktaya yakın konur
  const a = await p.evaluate((lay) => {
    __sablonKur([lay]); __kur(1);
    const h = __harita(lay, 1);
    const o = lay.ogeler.find((q) => q.tip === 'anit');
    const ex = h.mx(o.u), ey = h.my(o.v);
    const d = game.walls.filter((w) => w.tur === 'obje1' && w.x + w.w / 2 > h.z.x0 && w.x + w.w / 2 < h.z.gate.x0)
      .map((w) => Math.hypot(w.x + w.w / 2 - ex, w.y + w.h / 2 - ey));
    return { n: d.length, d: d.length ? Math.min(...d) : null };
  }, A);
  sina('(a) anıt eşlenen şablon noktasına 60 px içinde konur', () => {
    assert.ok(a.n >= 1, JSON.stringify(a));
    assert.ok(a.d <= 60, JSON.stringify(a));
  });

  // (b) aynalı varyant u'yu tersler
  const bres = await p.evaluate((lay) => {
    let lev = 1;
    const ulke = yolculukUlkeKodu();
    for (; lev < 40; lev++) if (yolculukRastgele(lev, ulke, 1, 4243) < 0.5) break;
    __sablonKur([lay]); __kur(lev);
    const h = __harita(lay, 1);
    const o = lay.ogeler.find((q) => q.tip === 'obje');
    const ex = h.mx(o.u), ey = h.my(o.v);
    const d = game.walls.filter((w) => w.tur === 'obje2' && w.x + w.w / 2 > h.z.x0 && w.x + w.w / 2 < h.z.gate.x0)
      .map((w) => Math.hypot(w.x + w.w / 2 - ex, w.y + w.h / 2 - ey));
    return { lev, ayna: h.ayna, n: d.length, d: d.length ? Math.min(...d) : null };
  }, A);
  sina('(b) aynalı varyant u eksenini aynalar', () => {
    assert.equal(bres.ayna, true, JSON.stringify(bres));
    assert.ok(bres.n >= 1 && bres.d <= 60, JSON.stringify(bres));
  });

  // (c) koridoru kesen öğe atlanır, sayılar ve yol korunur
  const c = await p.evaluate((lay) => {
    __sablonKur([lay]); __kur(1);
    const h = __harita(lay, 1);
    const o = lay.ogeler.find((q) => q.tip === 'anit');
    const ex = h.mx(o.u), ey = h.my(o.v);
    const engel = game.walls.find((w) => w.tur === 'obje1' && Math.hypot(w.x + w.w / 2 - ex, w.y + w.h / 2 - ey) < 90);
    const say = __sayilar();
    __sablonKur([]); __kur(1);
    const bos = __sayilar();
    __sablonKur([lay]); __kur(1);
    game.kopruAcik.fill(true);
    const b0 = yolculukBaslangic(), ar = game._yolculukDuzen.arena;
    const yol = yolculukYolVarMi(b0.x, b0.y, ar.x0 + 200, 500);
    return { engel: !!engel, say, bos, yol };
  }, C);
  sina('(c) koridoru kesen şablon öğesi atlanır; sayılar normal, yol açık', () => {
    assert.equal(c.engel, false, JSON.stringify(c));
    assert.deepEqual({ ...c.say, walls: 0 }, { ...c.bos, walls: 0 }, JSON.stringify(c));
    assert.ok(Math.abs(c.say.walls - c.bos.walls) <= 2, JSON.stringify(c));
    assert.equal(c.yol, true, JSON.stringify(c));
  });

  // (d) yuvalar serbestken şablon noktalarını kullanır
  const d = await p.evaluate((lay) => {
    let enIyi = null;
    for (let lev = 1; lev <= 6; lev++) {
      __sablonKur([lay]); __kur(lev);
      const h = __harita(lay, lev);
      const z = game._yolculukDuzen.zones[lev - 1];
      const onceki = lev === 1 ? YOLCULUK_AYAR.worldH / 2 : game._yolculukDuzen.zones[lev - 2].gate.cy;
      const noktalar = lay.ogeler.filter((q) => q.tip === 'yuva').map((q) => ({ x: h.mx(q.u), y: h.my(q.v) }));
      const bas = yolculukBaslangic();
      const serbest = noktalar.map((n) => {
        const r = 34, bx = n.x - r * 0.8, by = n.y - r * 0.8, bw = r * 1.6, bh = r * 1.6;
        if (yolculukYasakKutu(bx, by, bw, bh, game._yolculukDuzen, z, onceki)) return false;
        if (Math.hypot(n.x - bas.x, n.y - bas.y) < 300) return false;
        if (game.yuvalar.some((o) => { const d2 = Math.hypot(o.x - n.x, o.y - n.y); return o.bolge === lev && d2 > 5 && d2 < 260; })) return false;
        for (const o of game.walls) if (!o.yuva && bx < o.x + o.w + 24 && bx + bw + 24 > o.x && by < o.y + o.h + 24 && by + bh + 24 > o.y) return false;
        for (const liste of [game.waters, game.spikes, game.lavas]) for (const o of liste) if (bx < o.x + o.w + 24 && bx + bw + 24 > o.x && by < o.y + o.h + 24 && by + bh + 24 > o.y) return false;
        const yv = { x: n.x, y: n.y, r, bolge: lev };
        const kb = yolculukYuvaBolgesi(yv), ag = yolculukYuvaAgzi(yv);
        if (!yolculukBolgedeUlasir(kb.ax, kb.ay, ag.x, ag.y, kb.x0, kb.x1)) return false;
        return true;
      });
      const kullanilan = noktalar.map((n) => game.yuvalar.some((y) => y.bolge === lev && Math.hypot(y.x - n.x, y.y - n.y) < 5));
      const serbestSayi = serbest.filter(Boolean).length;
      const eksik = serbest.filter((s2, i2) => s2 && !kullanilan[i2]).length;
      const toplam = game.yuvalar.filter((y) => y.bolge === lev).length;
      if (!enIyi || serbestSayi > enIyi.serbestSayi) enIyi = { lev, serbestSayi, eksik, toplam };
    }
    return enIyi;
  }, D);
  sina('(d) yuvalar serbest şablon noktalarına oturur', () => {
    assert.ok(d.serbestSayi >= 2, JSON.stringify(d));
    assert.equal(d.eksik, 0, JSON.stringify(d));
    assert.equal(d.toplam, 4, JSON.stringify(d));
  });

  // (e) meydan boş kalır (hiçbir öğe/yuva/süs merkezi içine girmez)
  const e = await p.evaluate((lay) => {
    __sablonKur([lay]); __kur(1);
    const h = __harita(lay, 1);
    const m = lay.ogeler.find((q) => q.tip === 'meydan');
    const mx = h.mx(m.u), my = h.my(m.v), r = m.r * (h.icX1 - h.icX0);
    const icerde = [];
    const bak = (liste, ad) => { for (const o of (liste || [])) { const x = o.x + (o.w || 0) / 2, y = o.y + (o.h || 0) / 2; if (Math.hypot(x - mx, y - my) < r - 0.5) icerde.push(ad); } };
    bak(game.walls.slice(4), 'duvar'); bak(game.waters, 'su'); bak(game.spikes, 'diken'); bak(game.lavas, 'lav');
    for (const y of game.yuvalar) if (y.bolge === 1 && Math.hypot(y.x - mx, y.y - my) < r - 0.5) icerde.push('yuva');
    for (const q of game._yolculukDonatilar) if (Math.hypot(q.x - mx, q.y - my) < r - 0.5) icerde.push('donati');
    const anit = game.walls.some((w) => w.tur === 'obje1' && Math.hypot(w.x + w.w / 2 - mx, w.y + w.h / 2 - my) < 60);
    return { icerde, anit, r };
  }, E);
  sina('(e) meydan boş kalır, içindeki şablon öğesi atlanır', () => {
    assert.deepEqual(e.icerde, [], JSON.stringify(e));
    assert.equal(e.anit, false, JSON.stringify(e));
  });

  // (f) zemin patikası şablon "yol" noktalarından geçer
  const f = await p.evaluate((lay) => {
    __sablonKur([lay]); __kur(1);
    zeminKatmaniKur();
    const h = __harita(lay, 1);
    const yx = (x) => Math.max(h.icX0 + 40, Math.min(h.icX1 - 120, x)); // yolculuk.js: patika kenarlardan içeride
    const yol = lay.yol.map((q) => ({ x: yx(h.mx(q[0])), y: h.my(q[1]) }));
    const noktalar = (game._zeminKatmani.yollar[0] || {}).noktalar || [];
    let enBuyuk = 0;
    for (const q of yol) {
      let enYakin = Infinity;
      for (const n of noktalar) enYakin = Math.min(enYakin, Math.hypot(n.x - q.x, n.y - q.y));
      enBuyuk = Math.max(enBuyuk, enYakin);
    }
    return { enBuyuk, noktaSayisi: noktalar.length };
  }, A);
  sina('(f) zemin patikası şablon yol noktalarının 40 px içinden geçer', () => {
    assert.ok(f.noktaSayisi > 0, JSON.stringify(f));
    assert.ok(f.enBuyuk <= 40, JSON.stringify(f));
  });

  // (g) boş şablon: bugünkü haritayla birebir aynı
  const g = await p.evaluate((lay) => {
    __sablonKur([]); __kur(2); const a = __anlik();
    __sablonKur([lay]); __kur(2); const b = __anlik();
    __sablonKur([]); __kur(2); const c = __anlik();
    return { a, b, c };
  }, A);
  sina('(g) boş şablonla harita bugünküyle birebir aynı', () => {
    assert.equal(g.a, g.c);
    assert.notEqual(g.a, g.b);
  });

  // (h) derleme aracı: geçerli kalır, geçersiz bildirilir
  const cikti = path.join(KOK, 'test', 'ekran', 'yer1-sablonlar.js');
  fs.mkdirSync(path.dirname(cikti), { recursive: true });
  const arac = path.join(KOK, 'araclar', 'yerlesim_derle.py');
  const calistir = spawnSync('python3', [arac, path.join(KOK, 'test', 'fixtures', 'yerlesim'), cikti], { encoding: 'utf8' });
  sina('(h) yerlesim_derle.py geçerliyi tutar, geçersizi bildirir', () => {
    assert.equal(calistir.status, 0, calistir.stderr);
    assert.match(calistir.stdout, /Y02\.json/);
    const metin = fs.readFileSync(cikti, 'utf8');
    assert.match(metin, /window\.YERLESIM_SABLONLARI = \[/);
    const veri = JSON.parse(metin.slice(metin.indexOf('['), metin.lastIndexOf(']') + 1));
    assert.equal(veri.length, 1, JSON.stringify(veri));
    assert.equal(veri[0].id, 'gecerli-test');
  });

  // (i) Math.random kullanılmaz
  const i = await p.evaluate((lay) => {
    __sablonKur([lay]); __kur(2);
    const eski = Math.random;
    let hata = null;
    Math.random = () => { throw new Error('Math.random çağrıldı'); };
    try { yolculukHaritaKur(); } catch (err) { hata = err.message; } finally { Math.random = eski; }
    return { hata };
  }, A);
  sina('(i) harita kurulumunda Math.random yok', () => assert.equal(i.hata, null, JSON.stringify(i)));

  // (k) performans oranı: şablonlu kurulum boş kurulumun 3 katını geçmez
  const k = await p.evaluate((lay) => {
    __sablonKur([]); __kur(3);
    const olc = () => {
      const a = [];
      for (let r = 0; r < 5; r++) {
        const t = performance.now();
        for (let q = 0; q < 10; q++) yolculukHaritaKur();
        a.push(performance.now() - t);
      }
      a.sort((x, y) => x - y); return a[2];
    };
    const bos = olc();
    __sablonKur([lay]);
    const sablon = olc();
    return { bos, sablon, oran: sablon / bos };
  }, A);
  sina('(k) şablonlu harita kurulumu ≤ 3× boş kurulum', () => {
    assert.ok(k.oran <= 3, JSON.stringify(k));
  });

  sina('(j) sayfa hatası yok', () => assert.deepEqual(hatalar, []));
} finally {
  await b.close(); sunucu.close();
}
for (const s of sonuclar) console.log(s);
const basarisiz = sonuclar.filter((s) => s.startsWith('✗')).length;
if (hatalar.length) console.log('Sayfa hataları:', hatalar.join(' | '));
if (basarisiz || hatalar.length) { console.log(`${basarisiz} başarısız, ${hatalar.length} sayfa hatası`); process.exit(1); }
console.log(`Tümü geçti (${sonuclar.length})`);
