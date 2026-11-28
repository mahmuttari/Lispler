// Hayalet Avcıları KPR1: yolculuk köprüsünde karakterler güverteye basar, kemerde yükselir;
// köprü resmi ayak çizgisine göre konur, yan kuleler yürünemez. Çalıştırma: node test/kpr1.test.mjs
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
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript(() => {
    localStorage.setItem('hayaletAvcilariDil', 'tr');
    localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9');
    localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1');
  });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof startGame === 'function' && typeof yolculukKopruKutu === 'function' &&
    typeof kopruYukselti === 'function' && typeof kopruYanEngel === 'function' && typeof koprulerCiz === 'function');
  await p.waitForFunction(() => !!gorsel('yol1-kopru-acik') && !!gorsel('yol1-kopru-kapali') &&
    !!gorsel('kopru-acik') && !!gorsel('kopru-kapali') &&
    ['K', 'KS', 'KP', 'SH', 'SV', 'GA', 'GDA', 'DA', 'KA', 'LA'].every((a) => !!gorsel(`yolA-${a}-kopru-acik`)), null, { timeout: 90000 });

  await p.evaluate(() => {
    window.__kur = (level = 1, tur = null) => {
      if (game.running) endGame(false);
      online.mode = null;
      startGame(tur ? { tur: true, ulke: ulkeKodla(tur).sira } : undefined);
      game.paused = true;
      if (!tur) { game.level = level; buildWalls(); buildWaters(); buildHazards(); }
      game.ghosts = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
      game.player.invuln = 0; game.player.dead = false; game.player.dusus = null; game.player.gizli = false;
      return game;
    };
    window.__cizKutu = (fn) => {
      const cv = document.createElement('canvas'); cv.width = 2400; cv.height = 2400;
      const x = cv.getContext('2d');
      const ad = x.drawImage.bind(x); const kayit = [];
      x.drawImage = (im, ...a) => {
        const dx = a.length >= 8 ? a[4] : a[0], dy = a.length >= 8 ? a[5] : a[1];
        const dw = a.length >= 8 ? a[6] : a[2], dh = a.length >= 8 ? a[7] : a[3];
        kayit.push({ src: im.src || '', dx, dy, dw, dh });
        return ad(im, ...a);
      };
      fn(x);
      return kayit;
    };
    window.__adim = (sn) => { for (let z = 0; z < sn; z += 1 / 60) update(1 / 60, (window.__saat = (window.__saat || 1e7) + 1000 / 60)); };
  });

  // (a) tablo ve kutu
  const a = await p.evaluate(() => {
    const bs1 = {};
    for (const k of Object.keys(KOPRU_RESIM)) bs1[k] = yolculukKopruKutu(k, 1000, 500);
    const yedek = {}; for (const k of Object.keys(KOPRU_RESIM)) { yedek[k] = GORSEL[k]; delete GORSEL[k]; }
    const bs2 = {};
    for (const k of Object.keys(KOPRU_RESIM)) bs2[k] = yolculukKopruKutu(k, 1000, 500);
    for (const k of Object.keys(yedek)) if (yedek[k]) GORSEL[k] = yedek[k];
    return { tablo: Object.entries(KOPRU_RESIM).map(([k, v]) => [k, v]), bs1, bs2 };
  });
  sina('(a) her anahtar: 256<=w<=308, güverte yüksekliği>=34, güverte merkezi cy+30-kemer/2', () => {
    assert.equal(a.tablo.length, 17);
    for (const [k, v] of a.tablo) {
      const B = a.bs1[k];
      assert.ok(B.w >= 256 - 1e-6 && B.w <= 308 + 1e-6, `${k} w=${B.w}`);
      assert.ok(B.gAlt - B.gUst >= 34 - 1e-6, `${k} deck=${B.gAlt - B.gUst}`);
      assert.ok(Math.abs((B.gUst + B.gAlt) / 2 - (500 + 30 - v[3] / 2)) <= 0.01, `${k} merkez`);
    }
  });
  sina('(a) kutu resim yüklenmeden önce ve sonra aynı', () => {
    assert.deepEqual(a.bs2, a.bs1);
  });

  // (b) klasik 1 ve Dünya Turu KS: resim tam kutuda
  const bTest = await p.evaluate(() => {
    const r = {};
    const yap = (etiket, kur, anahtarBekle) => {
      kur();
      const k = game.kopruler[0];
      game.kopruAcik = new Array(game._yolculukDuzen.zones.length).fill(true); game._kopruAnim = {};
      const anahtar = yolculukKopruTabloAnahtari();
      const K = yolculukKopruKutu(anahtar, (k.a + k.b) / 2, k.c);
      game.camera = { x: k.a - 200, y: k.c - 200 }; game.W = 2400; game.H = 2400;
      const kayit = __cizKutu((x) => koprulerCiz(x));
      const im = kayit.find((q) => q.src.includes(anahtar));
      r[etiket] = { anahtar, anahtarBekle, K, kc: k.c, im };
    };
    yap('klasik', () => __kur(1), 'yol1-kopru-acik');
    const aileler = (() => { const o = {}; for (let i = 1; i <= ULKE_SAYISI; i++) { const u = ulkeSirada(i); if (!o[u.aile]) o[u.aile] = u.kod; } return o; })();
    yap('ks', () => __kur(1, aileler.KS), 'yolA-KS-kopru-acik');
    return r;
  });
  sina('(b) köprü resmi tam tablo kutusunda çizilir, ayak çizgisi güvertede', () => {
    for (const ad of ['klasik', 'ks']) {
      const q = bTest[ad];
      assert.equal(q.anahtar, q.anahtarBekle, ad);
      assert.ok(q.im, `${ad}: resim çizilmedi`);
      assert.ok(Math.abs(q.im.dx - q.K.x) < 0.01 && Math.abs(q.im.dy - q.K.y) < 0.01 &&
        Math.abs(q.im.dw - q.K.w) < 0.01 && Math.abs(q.im.dh - q.K.h) < 0.01, `${ad}: kutu ${JSON.stringify(q.im)} beklenen ${JSON.stringify(q.K)}`);
      const ayak = q.kc + 30;
      assert.ok(ayak >= q.K.gUst && ayak <= q.K.gAlt + 16, `${ad}: ayak ${ayak} güverte ${q.K.gUst}..${q.K.gAlt}`);
    }
  });

  // (c) kopruYukselti
  const cTest = await p.evaluate(() => {
    __kur(1);
    const k = game.kopruler[0];
    game.kopruAcik = new Array(game._yolculukDuzen.zones.length).fill(true); game._kopruAnim = {};
    const kemer = KOPRU_RESIM[yolculukKopruTabloAnahtari()][3];
    const orta = (k.a + k.b) / 2;
    const o = {
      kemer,
      sol: kopruYukselti(k.a - 200, k.c),
      ucA: kopruYukselti(k.a, k.c), ucB: kopruYukselti(k.b, k.c),
      tepe: kopruYukselti(orta, k.c),
      ceyrek: kopruYukselti(k.a + (k.b - k.a) * 0.25, k.c),
      dortte: kopruYukselti(k.a + (k.b - k.a) * 0.75, k.c),
      yan: kopruYukselti(orta, k.c + 80),
    };
    game.kopruAcik[0] = false;
    o.kapali = [k.a, orta, k.b].map((x) => kopruYukselti(x, k.c));
    game.kopruAcik[0] = true;
    // göl ip köprüsü (gecit yok)
    const gol = { su: {}, yatay: true, a: 5000, b: 5200, c: 400, sira: null };
    game.kopruler.push(gol);
    o.gol = kopruYukselti(5100, 400);
    game.kopruler.pop();
    return o;
  });
  sina('(c) kopruYukselti: uçlarda/solda/yanında/kapalı/gölde 0, ortada kemer, simetrik', () => {
    assert.ok(Math.abs(cTest.sol) < 1e-9, 'sol '+cTest.sol); assert.ok(Math.abs(cTest.ucA) < 1e-9, 'ucA '+cTest.ucA); assert.ok(Math.abs(cTest.ucB) < 1e-9, 'ucB '+cTest.ucB);
    assert.ok(Math.abs(cTest.tepe - cTest.kemer) <= 0.5, `tepe ${cTest.tepe} kemer ${cTest.kemer}`);
    assert.ok(Math.abs(cTest.ceyrek - cTest.dortte) <= 1e-9, 'simetri');
    assert.equal(cTest.yan, 0);
    assert.deepEqual(cTest.kapali, [0, 0, 0]);
    assert.equal(cTest.gol, 0);
  });

  // (d) yürünebilir şerit değişmedi
  const dTest = await p.evaluate(() => {
    __kur(1);
    const k = game.kopruler[0];
    game.kopruAcik = new Array(game._yolculukDuzen.zones.length).fill(true);
    const orta = (k.a + k.b) / 2, yari = yolculukKopruYurumeYari(22);
    const r22 = {
      ic: kopruluSuCarpar(orta, k.c + (yari - 1), 22),
      dis: kopruluSuCarpar(orta, k.c + (yari + 3), 22),
    };
    const A = YOLCULUK_AYAR, arena = { x: A.worldW - A.startW, y: A.worldH / 2 };
    const yol = {};
    for (const n of [1, 4, 9]) {
      __kur(n);
      game.kopruAcik = new Array(A.zoneCount).fill(true);
      const bb = yolculukBaslangic();
      yol[n] = yolculukYolVarMi(bb.x, bb.y, arena.x, arena.y);
    }
    return { r22, yol };
  });
  sina('(d) şerit içi sudan geçer, dışı çarpar; açık kapılarla yol var (1,4,9)', () => {
    assert.equal(dTest.r22.ic, false);
    assert.equal(dTest.r22.dis, true);
    for (const n of [1, 4, 9]) assert.equal(dTest.yol[n], true, `bölüm ${n}`);
  });

  // (e) kopruYanEngel ve hapsolmama
  const eTest = await p.evaluate(() => {
    __kur(1);
    const k = game.kopruler[0];
    game.kopruAcik = new Array(game._yolculukDuzen.zones.length).fill(true);
    const K = yolculukKopruKutu(yolculukKopruTabloAnahtari(), (k.a + k.b) / 2, k.c);
    const o = {
      ust: kopruYanEngel(K.x + 20, k.c - 45, 22),
      alt: kopruYanEngel(K.x + 20, k.c + 45, 22),
      koridor: kopruYanEngel(K.x + 20, k.c, 22),
      disX: kopruYanEngel(K.x - 10, k.c - 45, 22),
      altDis: kopruYanEngel(K.x + 20, K.y + K.h + 10, 22),
    };
    // sol kıyıda, koridorun 60 px üstünde: aşağı-sağa it
    const p0 = game.player;
    p0.x = k.a - 20; p0.y = k.c - 60; p0.invuln = 1e9; p0.dead = false;
    game.inputDir = { x: 1, y: 1 };
    __adim(2);
    o.son1 = { x: p0.x, y: p0.y, engel: kopruYanEngel(p0.x, p0.y, p0.r) };
    // engelli noktanın içinden dışarı yürü
    p0.x = K.x + 30; p0.y = k.c + 45;
    o.bas2 = { x: p0.x, y: p0.y };
    game.inputDir = { x: 0, y: -1 };
    __adim(2);
    o.son2 = { x: p0.x, y: p0.y, engel: kopruYanEngel(p0.x, p0.y, p0.r) };
    game.inputDir = { x: 0, y: 0 };
    return o;
  });
  sina('(e) yan kuleler engelli, koridor/kenar temiz; hareket engelli noktada bitmez, içeriden çıkılır', () => {
    assert.equal(eTest.ust, true); assert.equal(eTest.alt, true);
    assert.equal(eTest.koridor, false); assert.equal(eTest.disX, false); assert.equal(eTest.altDis, false);
    assert.equal(eTest.son1.engel, false, JSON.stringify(eTest.son1));
    assert.equal(eTest.son2.engel, false, JSON.stringify(eTest.son2));
    assert.ok(Math.hypot(eTest.son2.x - eTest.bas2.x, eTest.son2.y - eTest.bas2.y) > 1, 'içeriden çıkamadı');
  });

  // (f) çizim sırası ve dönüşüm yüksekliği
  const fTest = await p.evaluate(() => {
    __kur(1);
    const k = game.kopruler[0];
    game.kopruAcik = new Array(game._yolculukDuzen.zones.length).fill(true); game._kopruAnim = {};
    const p0 = game.player; p0.dead = false; p0.gizli = false; p0.invuln = 0;
    const orta = (k.a + k.b) / 2;
    const orig = { koprulerCiz: window.koprulerCiz, yolculukCiz: window.yolculukCiz, drawBot: window.drawBot, drawCharacter: window.drawCharacter };
    const sira = [], fs = [];
    window.koprulerCiz = (ctx) => { sira.push('koprulerCiz'); return orig.koprulerCiz(ctx); };
    window.yolculukCiz = (ctx) => { sira.push('yolculukCiz'); return orig.yolculukCiz(ctx); };
    window.drawBot = (ctx, bb) => { sira.push('drawBot'); return orig.drawBot(ctx, bb); };
    window.drawCharacter = (ctx, ...ar) => {
      sira.push('drawCharacter');
      if (ar[2] === p0.x && ar[3] === p0.y) fs.push(ctx.getTransform().f);
      return orig.drawCharacter(ctx, ...ar);
    };
    try {
      p0.x = orta; p0.y = k.c;
      spawnBot(); if (game.bot) { game.bot.x = orta + 20; game.bot.y = k.c; }
      game.camera = { x: orta - game.W / 2, y: k.c - game.H / 2 };
      render();
      const siraOrta = sira.slice();
      const fOrta = fs.slice();
      sira.length = 0; fs.length = 0;
      p0.x = k.a - 400; p0.y = k.c;
      if (game.bot) { game.bot.x = k.a - 380; game.bot.y = k.c; }
      render();
      const fSol = fs.slice();
      const kemer = KOPRU_RESIM[yolculukKopruTabloAnahtari()][3];
      return { siraOrta, fOrta, fSol, kemer };
    } finally {
      window.koprulerCiz = orig.koprulerCiz; window.yolculukCiz = orig.yolculukCiz;
      window.drawBot = orig.drawBot; window.drawCharacter = orig.drawCharacter;
    }
  });
  sina('(f) köprü çizimleri karakterlerden önce; oyuncu kemerde kemer kadar yüksek', () => {
    const iKar = fTest.siraOrta.findIndex((s) => s === 'drawBot' || s === 'drawCharacter');
    assert.ok(iKar >= 0, 'karakter çizilmedi');
    assert.ok(fTest.siraOrta.indexOf('koprulerCiz') < iKar, 'koprulerCiz sonra');
    assert.ok(fTest.siraOrta.indexOf('yolculukCiz') < iKar, 'yolculukCiz sonra');
    assert.ok(fTest.fOrta.length && fTest.fSol.length, `f ${fTest.fOrta} ${fTest.fSol}`);
    assert.ok(Math.abs((fTest.fSol[0] - fTest.fOrta[0]) - fTest.kemer) <= 0.5, `fark ${fTest.fSol[0] - fTest.fOrta[0]} kemer ${fTest.kemer}`);
  });

  // (g) kapalı kapı: resim aynı kutuda, çarpışma kutusu değişmedi
  const gTest = await p.evaluate(() => {
    __kur(1);
    const z = game._yolculukDuzen.zones[0], g = z.gate;
    game.kopruAcik = new Array(game._yolculukDuzen.zones.length).fill(false); game._kopruAnim = {};
    game.camera = { x: g.x0 - 200, y: g.bridgeY0 - 200 }; game.W = 2400; game.H = 2400;
    const K = yolculukKopruKutu('yol1-kopru-acik', (g.x0 + g.x1) / 2, (g.bridgeY0 + g.bridgeY1) / 2);
    const kayit = __cizKutu((x) => yolculukCiz(x));
    const im = kayit.find((q) => q.src.includes('yol1-kopru-kapali'));
    const r = 22, noktalar = [], bekle = [];
    for (let i = 0; i < 20; i++) {
      const x = g.x0 - 80 + (i * 37) % 260, y = g.bridgeY0 - 60 + (i * 53) % 260;
      noktalar.push(yolculukKopruKapaliNokta(x, y, r));
      bekle.push(x > g.x0 - 6 - r && x < g.x1 + 6 + r && y > g.bridgeY0 - r && y < g.bridgeY1 + r);
    }
    return { K, im, noktalar, bekle };
  });
  sina('(g) kapalı köprü resmi açık kutunun içinde; kapalı nokta değişmedi', () => {
    assert.ok(gTest.im, 'kapalı resim çizilmedi');
    assert.ok(Math.abs(gTest.im.dx - gTest.K.x) <= 2, `x ${gTest.im.dx} / ${gTest.K.x}`);
    assert.ok(Math.abs(gTest.im.dw - gTest.K.w) <= 2, `w ${gTest.im.dw} / ${gTest.K.w}`);
    assert.ok(gTest.im.dx >= gTest.K.x - 2 && gTest.im.dx + gTest.im.dw <= gTest.K.x + gTest.K.w + 2, 'kutu dışında');
    assert.deepEqual(gTest.noktalar, gTest.bekle);
  });

  // (h) perf: köprüde/yükselti ile köprü dışı oranı
  const hTest = await p.evaluate(() => {
    __kur(1);
    const k = game.kopruler[0];
    game.kopruAcik = new Array(game._yolculukDuzen.zones.length).fill(true); game._kopruAnim = {};
    const orta = (k.a + k.b) / 2;
    game.player.x = orta; game.player.y = k.c; game.player.invuln = 1e9; game.player.dead = false;
    spawnBot(); if (game.bot) { game.bot.x = orta + 20; game.bot.y = k.c; }
    game.camera = { x: orta - game.W / 2, y: k.c - game.H / 2 };
    game.ghosts = []; game.pickups = []; game.projectiles = []; game.enemyProjectiles = []; game.effects = [];
    const isit = () => { for (let i = 0; i < 80; i++) render(); };
    const olc = () => {
      const ctx2 = game.ctx, gid = ctx2.getImageData.bind(ctx2), GW = game.W, GH = game.H, ar = [];
      for (let r = 0; r < 7; r++) {
        const bas = performance.now();
        for (let i = 0; i < 120; i++) { render(); gid(0, 0, GW, GH); }
        ar.push(performance.now() - bas);
      }
      ar.sort((x, y) => x - y); return ar[3];
    };
    const ucYedek = window.UcAvci; window.UcAvci = undefined; // 3D bot kırpma farkı ölçümü bozmasın
    isit();
    const kopru = olc();
    game.player.x = k.a - 400; game.player.y = k.c;
    if (game.bot) { game.bot.x = k.a - 380; game.bot.y = k.c; }
    isit();
    const dis = olc();
    window.UcAvci = ucYedek;
    return { kopru, dis };
  });
  sina('(h) köprüde kemer yüksekliği kare süresini 1,15 katından fazla artırmaz', () => {
    const oran = hTest.kopru / hTest.dis;
    assert.ok(oran <= 1.15, `${hTest.kopru.toFixed(2)} / ${hTest.dis.toFixed(2)} = ${oran.toFixed(3)}`);
  });

  sina('(i) sayfa hatası yok', () => { assert.deepEqual(hatalar, []); });
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
