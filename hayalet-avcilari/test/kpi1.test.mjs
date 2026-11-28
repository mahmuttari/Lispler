// Hayalet Avcıları KPI1: arena kapısı son nehrin arkasındaki karada, eşiği yürüme hattında durur;
// zemini boş kalır, oyuncu önünden geçer, çizim ZEM3A arka/ön mekanizmasını kullanır.
// Çalıştırma: node test/kpi1.test.mjs
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
  await p.waitForFunction(() => typeof startGame === 'function' && typeof yolculukArenaKapiKutu === 'function' &&
    typeof yolculukGecitEgri === 'function' && typeof yolculukKopruKutu === 'function' &&
    typeof yolculukYuruyebilir === 'function' && typeof yolculukYolVarMi === 'function' && typeof render === 'function');
  await p.waitForFunction(() => !!gorsel('yol1-arena') && !!gorsel('yol1-kopru-acik'), null, { timeout: 90000 });

  await p.evaluate(() => {
    window.__kur = (level = 1, tur = null) => {
      if (game.running) endGame(false);
      online.mode = null;
      startGame(tur ? { tur: true, ulke: ulkeKodla(tur).sira } : undefined);
      game.paused = true;
      if (!tur) { game.level = level; buildWalls(); buildWaters(); buildHazards(); }
      game.ghosts = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
      game.player.invuln = 1e9; game.player.dead = false; game.player.dusus = null; game.player.gizli = false;
      return game;
    };
    window.__cizKutu = (fn) => {
      const cv = document.createElement('canvas'); cv.width = 2400; cv.height = 2400;
      const x = cv.getContext('2d');
      const ad = x.drawImage.bind(x); const kayit = []; const rot = [];
      x.drawImage = (im, ...a) => {
        const dx = a.length >= 8 ? a[4] : a[0], dy = a.length >= 8 ? a[5] : a[1];
        const dw = a.length >= 8 ? a[6] : a[2], dh = a.length >= 8 ? a[7] : a[3];
        kayit.push({ src: im.src || '', dx, dy, dw, dh });
        return ad(im, ...a);
      };
      const er = x.rotate.bind(x); x.rotate = (...a) => { rot.push(a); return er(...a); };
      fn(x);
      return { kayit, rot };
    };
    window.__adim = (sn) => { for (let z = 0; z < sn; z += 1 / 60) update(1 / 60, (window.__saat = (window.__saat || 1e7) + 1000 / 60)); };
    window.__isit = () => { for (let i = 0; i < 120; i++) render(); };
    window.__olc = (fn, n = 120) => {
      const ctx2 = game.ctx, gid = ctx2.getImageData.bind(ctx2), GW = game.W, GH = game.H;
      const a = [];
      for (let r = 0; r < 7; r++) {
        const bas = performance.now();
        for (let i = 0; i < n; i++) { fn(); gid(0, 0, GW, GH); }
        a.push(performance.now() - bas);
      }
      a.sort((x, y) => x - y);
      return a[3];
    };
  });

  // (a)(b)(e)(f) geometri, eşik, boş zemin, belirlenim
  const geo = await p.evaluate(() => {
    const aileler = (() => { const o = {}; for (let i = 1; i <= ULKE_SAYISI; i++) { const u = ulkeSirada(i); if (!o[u.aile]) o[u.aile] = u.kod; } return o; })();
    const diger = Object.keys(aileler).find((a) => a !== 'KS');
    const konfigler = [1, 2, 4, 7, 9].map((l) => ({ ad: 'klasik' + l, level: l, tur: null }))
      .concat([{ ad: 'KS', level: 1, tur: aileler.KS }, { ad: 'diger', level: 1, tur: aileler[diger] }]);
    const out = {};
    for (const c of konfigler) {
      __kur(c.level, c.tur);
      const d = game._yolculukDuzen, A = YOLCULUK_AYAR;
      const z = d.zones[d.zones.length - 1], g = z.gate;
      const k = yolculukArenaKapiKutu(d), k2 = yolculukArenaKapiKutu(d);
      const egri = yolculukGecitEgri(z);
      const K = yolculukKopruKutu(yolculukKopruTabloAnahtari(), (g.x0 + g.x1) / 2, g.cy);
      let bankFark = -Infinity;
      for (let yy = k.y; yy <= k.y + k.h; yy += 4) {
        const s = egri.merkez + egri.yarim + egri.offset(yy) + 20;
        if (s - k.x > bankFark) bankFark = s - k.x;
      }
      const deckKesisim = !(k.x + k.w <= g.x0 || k.x >= g.x1 || k.y + k.h <= g.bridgeY0 || k.y >= g.bridgeY1);
      const yuvaIc = game.yuvalar.filter((o) => o.x > k.x && o.x < k.x + k.w && o.y > k.y && o.y < k.y + k.h).length;
      const duvarIc = game.walls.filter((o) => o.x < k.x + k.w && o.x + o.w > k.x && o.y < k.y + k.h && o.y + o.h > k.y).length;
      const donatiIc = (game._yolculukDonatilar || []).filter((o) => o.x > k.x && o.x < k.x + k.w && o.y > k.y && o.y < k.y + k.h).length;
      out[c.ad] = {
        k, k2, g: { x0: g.x0, x1: g.x1, cy: g.cy, bridgeY0: g.bridgeY0, bridgeY1: g.bridgeY1 },
        K: { x: K.x, w: K.w }, bankFark, deckKesisim, yuvaIc, duvarIc, donatiIc,
        arena: { x0: d.arena.x0, x1: d.arena.x1 }, worldH: A.worldH,
      };
    }
    return out;
  });

  for (const [ad, q] of Object.entries(geo)) {
    sina(`(a) ${ad}: kapı nehrin sağ kıyısında ve köprü resminin sağında`, () => {
      const k = q.k;
      assert.ok(q.bankFark <= 0.6, `${ad}: sağ kıyı payı ${q.bankFark}`);
      assert.ok(k.x >= q.K.x + q.K.w + 8 - 0.6, `${ad}: köprü sağı ${q.K.x + q.K.w} k.x ${k.x}`);
      assert.equal(q.deckKesisim, false, `${ad}: güverte ile kesişiyor`);
      assert.ok(k.x + k.w <= q.arena.x1, `${ad}: arena sağı aşıldı`);
      assert.ok(k.y >= 0 && k.y + k.h <= q.worldH, `${ad}: dikey taşma ${k.y}..${k.y + k.h}`);
    });
    sina(`(b) ${ad}: eşik yürüme hattında, kutu iki çağrıda aynı`, () => {
      const k = q.k, g = q.g;
      const fark = k.y + k.h - (g.cy + 30);
      assert.ok(fark >= 8 && fark <= 20, `${ad}: eşik farkı ${fark}`);
      assert.ok(k.y <= g.cy && g.cy <= k.y + k.h, `${ad}: cy kutuda değil`);
      assert.deepEqual(q.k2, k, `${ad}: iki çağrı farklı`);
    });
    sina(`(e) ${ad}: kapının zemini boş`, () => {
      assert.equal(q.yuvaIc, 0, `${ad}: ${q.yuvaIc} yuva kapıda`);
      assert.equal(q.duvarIc, 0, `${ad}: ${q.duvarIc} duvar kapıda`);
      assert.equal(q.donatiIc, 0, `${ad}: ${q.donatiIc} donatı kapıda`);
    });
  }

  // (b) resim yüklenmeden/sonra aynı
  const resimsiz = await p.evaluate(() => {
    __kur(1);
    const d = game._yolculukDuzen;
    const k1 = { ...yolculukArenaKapiKutu(d) };
    const yedek = {};
    for (const kk of Object.keys(GORSEL)) { if (/arena|kopru-acik/.test(kk)) { yedek[kk] = GORSEL[kk]; delete GORSEL[kk]; } }
    delete d._arenaKapi;
    const k2 = { ...yolculukArenaKapiKutu(d) };
    for (const kk of Object.keys(yedek)) GORSEL[kk] = yedek[kk];
    delete d._arenaKapi;
    return { k1, k2 };
  });
  sina('(b) kapı kutusu resimler yüklenmeden önce ve sonra aynı', () => {
    assert.deepEqual(resimsiz.k2, resimsiz.k1);
  });

  // (c) çizim: arka/ön geçişleri ve döndürme yok
  const ciz = await p.evaluate(() => {
    __kur(1);
    const d = game._yolculukDuzen, k = yolculukArenaKapiKutu(d);
    const g = d.zones[d.zones.length - 1].gate;
    const arenaK = yolculukTemaParca('arena');
    game.camera = { x: k.x - 200, y: k.y - 200 }; game.W = 2400; game.H = 2400;
    const ciz = (kip) => __cizKutu((x) => yolculukTemaParcalariCiz(x, kip));
    const q = (px, py) => {
      game.player.x = px; game.player.y = py;
      const arka = ciz('arka'), on = ciz('on');
      const bul = (r) => r.kayit.filter((s) => s.src.includes(arenaK));
      return { arka: bul(arka), on: bul(on), rotA: arka.rot.length, rotO: on.rot.length };
    };
    return { arenaK, k, cy: g.cy, ic: q(k.cx, g.cy), on: q(k.cx, g.cy - 60), uzak: q(k.cx + 600, g.cy) };
  });
  const icinde = (r, k) => r.dx >= k.x - 1e-6 && r.dy >= k.y - 1e-6 && r.dx + r.dw <= k.x + k.w + 1e-6 && r.dy + r.dh <= k.y + k.h + 1e-6;
  sina('(c) oyuncu koridordayken kapı arkada bir kez, önde değil', () => {
    assert.ok(ciz.ic.arka.length === 1, `arka ${ciz.ic.arka.length}`);
    assert.ok(ciz.ic.on.length === 0, `on ${ciz.ic.on.length}`);
    assert.ok(icinde(ciz.ic.arka[0], ciz.k), 'resim kapı kutusunun dışında');
    assert.equal(ciz.ic.rotA + ciz.ic.rotO, 0);
  });
  sina('(c) oyuncu kapının kuzeyindeyken kapı önde bir kez, arkada değil', () => {
    assert.ok(ciz.on.arka.length === 0, `arka ${ciz.on.arka.length}`);
    assert.ok(ciz.on.on.length === 1, `on ${ciz.on.on.length}`);
    assert.ok(icinde(ciz.on.on[0], ciz.k), 'resim kapı kutusunun dışında');
    assert.equal(ciz.on.rotA + ciz.on.rotO, 0);
  });
  sina('(c) oyuncu 600 px uzaktayken kapı yalnız arkada', () => {
    assert.ok(ciz.uzak.arka.length === 1, `arka ${ciz.uzak.arka.length}`);
    assert.ok(ciz.uzak.on.length === 0, `on ${ciz.uzak.on.length}`);
    assert.equal(ciz.uzak.rotA + ciz.uzak.rotO, 0);
  });

  // (d) yürünebilirlik ve gerçek hareket
  const yuru = await p.evaluate(() => {
    const A = YOLCULUK_AYAR, out = {};
    for (const lv of [1, 4, 9]) {
      __kur(lv);
      const d = game._yolculukDuzen, z = d.zones[d.zones.length - 1], g = z.gate, k = yolculukArenaKapiKutu(d);
      const noktalar = [];
      const x0 = g.x1 + 10, x1 = k.x + k.w + 40;
      game.kopruAcik = new Array(d.zones.length).fill(true); game._kopruAnim = {};
      for (let i = 0; i < 30; i++) {
        const x = x0 + (x1 - x0) * i / 29;
        // köprü güvertesi (nehrin kıvrımı köprü ucunun altında sürer) yürünebilir sayılır
        noktalar.push({ x, ok: yolculukYuruyebilir(x, g.cy, 22) || (typeof koprudeMi === 'function' && koprudeMi(x, g.cy, 22)) });
      }
      game.kopruAcik = new Array(d.zones.length).fill(true); game._kopruAnim = {};
      const yol = yolculukYolVarMi(A.startW / 2, A.worldH / 2, A.worldW - A.startW, A.worldH / 2);
      out['lv' + lv] = { noktalar, yol };
    }
    __kur(1);
    let d = game._yolculukDuzen, z = d.zones[d.zones.length - 1], g = z.gate, k = yolculukArenaKapiKutu(d);
    game.kopruAcik = new Array(d.zones.length).fill(true); game._kopruAnim = {};
    game.player.x = g.x1 + 30; game.player.y = g.cy; game.player.invuln = 1e9;
    game.inputDir = { x: 1, y: 0 };
    __adim(180);
    const son = { x: game.player.x, y: game.player.y, hedef: k.x + k.w };
    game.inputDir = { x: 0, y: 0 };
    return { out, son };
  });
  for (const lv of ['lv1', 'lv4', 'lv9']) {
    sina(`(d) ${lv}: geçitten kapı önüne kadar yürünebilir ve yol var`, () => {
      const kotu = yuru.out[lv].noktalar.filter((n) => !n.ok);
      assert.equal(kotu.length, 0, `${kotu.length} nokta kapalı (ilk x=${kotu[0] && kotu[0].x})`);
      assert.equal(yuru.out[lv].yol, true, 'başlangıçtan arenaya yol yok');
    });
  }
  sina('(d) oyuncu gerçek update adımlarıyla kapının önünden geçer', () => {
    assert.ok(yuru.son.x > yuru.son.hedef, `x=${yuru.son.x} hedef=${yuru.son.hedef}`);
  });

  // (f) belirlenim
  const det = await p.evaluate(() => {
    const al = () => {
      __kur(4);
      return { yuvalar: game.yuvalar.map((o) => [o.x, o.y, o.tur, o.bolge, o.r]), duvarlar: game.walls.map((o) => [o.x, o.y, o.w, o.h]) };
    };
    const a = al(), b = al();
    return { a, b };
  });
  sina('(f) aynı bölüm iki kez kurulunca yuva ve duvarlar aynı', () => {
    assert.equal(JSON.stringify(det.a), JSON.stringify(det.b));
  });

  // (g) performans
  const perf = await p.evaluate(() => {
    __kur(9);
    const d = game._yolculukDuzen, k = yolculukArenaKapiKutu(d), g = d.zones[d.zones.length - 1].gate;
    game.kopruAcik = new Array(d.zones.length).fill(true); game._kopruAnim = {};
    game.player.x = k.cx; game.player.y = g.cy; game.player.invuln = 1e9;
    game.camera = { x: k.cx - game.W / 2, y: k.cy - game.H / 2 };
    __isit();
    window.__kapiYok = true; const kapisiz = __olc(render); window.__kapiYok = false;
    const kapida = __olc(render);
    game.camera = { x: k.cx - 1500 - game.W / 2, y: k.cy - game.H / 2 };
    __isit();
    const solda = __olc(render);
    return { kapida, solda, oran: kapida / solda, kapisiz };
  });
  // Kapı bölgesinde nehir, köprü ve arena da çizilir: maliyet aynı kamerada kapılı/kapısız karşılaştırılır
  sina('(g) kapı çizimi aynı karenin süresini 1,15 katından fazla artırmaz', () => {
    const o = perf.kapida / perf.kapisiz;
    assert.ok(o <= 1.15, `oran ${o.toFixed(3)} (${perf.kapida.toFixed(2)} / kapısız ${perf.kapisiz.toFixed(2)}; soldaki ${perf.solda.toFixed(2)})`);
  });

  sina('(h) sayfa hatası yok', () => { assert.deepEqual(hatalar, []); });
} catch (e) {
  sonuclar.push(`✗ akış yarıda kaldı: ${e.message.split('\n')[0]}`);
} finally {
  await b.close();
  sunucu.close();
}
sonuclar.forEach((s) => console.log(s));
const kalan = sonuclar.filter((s) => s.startsWith('✗'));
assert.equal(kalan.length, 0, `${kalan.length} sınama başarısız`);
console.log(`TAMAM: ${sonuclar.length} sınama`);
