// Hayalet Avcıları GLG1: karakterler havada durmasın — gölge yerde (temas gölgesi), 3D ayaklar yere basar,
// bot/pet/köprü/hayalet gölgeleri. Çalıştırma: node test/glg1.test.mjs
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
  await p.waitForFunction(() => typeof startGame === 'function' && typeof drawCharacter === 'function' &&
    typeof zeminGolgesi === 'function' && typeof ayakY === 'function' && typeof kopruYukselti === 'function');
  await p.waitForFunction(() => !!gorsel('yol1-kopru-acik') && !!gorsel('kopru-acik'), null, { timeout: 90000 });

  await p.evaluate(() => {
    window.__kur = (level = 1) => {
      if (game.running) endGame(false);
      online.mode = null;
      startGame();
      game.paused = true;
      game.level = level; buildWalls(); buildWaters(); buildHazards();
      game.ghosts = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
      game.player.invuln = 0; game.player.dead = false; game.player.dusus = null; game.player.gizli = false;
      return game;
    };
    // zeminGolgesi çağrılarını dünya koordinatıyla kaydeder
    window.__kaydet = () => {
      const eski = window.zeminGolgesi, kayit = [];
      window.zeminGolgesi = (ctx, x, y, s, yumusak = true) => {
        const m = ctx.getTransform();
        kayit.push({ x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f, lx: x, ly: y, s, yumusak });
      };
      return { kayit, geri: () => { window.zeminGolgesi = eski; } };
    };
    window.__altSatir = (cv) => {
      const x = cv.getContext('2d'), d = x.getImageData(0, 0, cv.width, cv.height).data;
      let alt = -1;
      for (let yy = 0; yy < cv.height; yy++) for (let xx = 0; xx < cv.width; xx++) {
        if (d[(yy * cv.width + xx) * 4 + 3] > 128) { if (yy > alt) alt = yy; }
      }
      const alt6 = Math.max(0, alt - 5);
      let sx = 0, sw = 0;
      for (let yy = alt6; yy <= alt; yy++) for (let xx = 0; xx < cv.width; xx++) {
        const a = d[(yy * cv.width + xx) * 4 + 3];
        if (a > 128) { sx += xx * a; sw += a; }
      }
      return { alt, cx: sw ? sx / sw : NaN };
    };
  });

  // (a) 3D ve 2D: ayak tabanı ile temas gölgesi aynı yerde
  async function ayakTesti(uc) {
    if (uc) {
      const ok = await p.evaluate(() => !!(window.UcAvci && UcAvci.destek && UcAvci.destek()));
      if (!ok) return { atlandi: 'UcAvci.destek() false' };
      await p.waitForFunction(() => window.UcAvci && UcAvci.hazir === true, null, { timeout: 20000 }).catch(() => {});
      if (!(await p.evaluate(() => !!(window.UcAvci && UcAvci.hazir)))) return { atlandi: 'UcAvci hazır değil' };
    }
    return await p.evaluate(async (uc) => {
      const eskiHazir = window.UcAvci ? UcAvci.hazir : false;
      if (window.UcAvci) UcAvci.hazir = !!uc;
      const karakterler = ['kinkin', 'veriyi', 'kornet', 'ponko'];
      const durumlar = karakterler.map((k) => [k, 0]).concat([['ponko', 2]]);
      const sonuc = [];
      for (const [k, ci] of durumlar) {
        let kayit, geri;
        for (let tur = 0; tur < 12; tur++) {
          const cv = document.createElement('canvas'); cv.width = 600; cv.height = 600;
          const c = cv.getContext('2d');
          const r = window.__kaydet(); kayit = r.kayit; geri = r.geri;
          drawCharacter(c, k, ci, 300, 300, 70, 0, 0);
          geri();
          const tema = kayit[kayit.length - 1]; // dış çizim (ölçüm iç çağrısı olabilir): son çağrı temas gölgesidir
          const olcum = window.__altSatir(cv);
          sonuc.push({ k, ci, gx: tema.x, gy: tema.y, alt: olcum.alt, cx: olcum.cx, fark: olcum.alt - tema.y, xfark: olcum.cx - tema.x });
          if (uc && window.UcAvci) await new Promise((res) => setTimeout(res, 40));
          else break;
        }
      }
      if (window.UcAvci) UcAvci.hazir = eskiHazir;
      return { sonuc };
    }, uc);
  }

  const a3 = await ayakTesti(true);
  if (a3.atlandi) sonuclar.push(`- (a) 3D atlandı: ${a3.atlandi}`);
  else sina('(a) 3D: ayak tabanı ile temas gölgesi <= 2 px, yatay <= 3 px', () => {
    for (const q of a3.sonuc) {
      assert.ok(Math.abs(q.fark) <= 2, `${q.k}/${q.ci}: dikey ${q.fark}`);
      assert.ok(Math.abs(q.xfark) <= 3, `${q.k}/${q.ci}: yatay ${q.xfark}`);
    }
  });
  if (a3.atlandi) { /* 3D ölçülemedi */ }
  const a2 = await ayakTesti(false);
  sina('(a) 2D: ayak tabanı ile temas gölgesi <= 2 px, yatay <= 3 px', () => {
    for (const q of a2.sonuc) {
      assert.ok(Math.abs(q.fark) <= 2, `${q.k}/${q.ci}: dikey ${q.fark}`);
      assert.ok(Math.abs(q.xfark) <= 3, `${q.k}/${q.ci}: yatay ${q.xfark}`);
    }
  });

  // (b) zeminGolgesi: iki elips, temas kaymasız 17s x 5.5s
  const bT = await p.evaluate(() => {
    const proto = CanvasRenderingContext2D.prototype, eski = proto.ellipse, kayit = [];
    proto.ellipse = function (...a) { kayit.push(a); return eski.apply(this, a); };
    const cv = document.createElement('canvas'); cv.width = 300; cv.height = 300;
    const c = cv.getContext('2d');
    try { zeminGolgesi(c, 150, 150, 1); } finally { proto.ellipse = eski; }
    const proto2 = CanvasRenderingContext2D.prototype, eski2 = proto2.ellipse, kayit2 = [];
    proto2.ellipse = function (...a) { kayit2.push(a); return eski2.apply(this, a); };
    try { zeminGolgesi(c, 150, 150, 1, false); } finally { proto2.ellipse = eski2; }
    return { kayit, kayit2 };
  });
  sina('(b) zeminGolgesi: yumuşak (2,1) + temas (0,0) 17x5.5; yumusak=false tek elips', () => {
    assert.equal(bT.kayit.length, 2);
    assert.ok(Math.abs(bT.kayit[0][0] - 152) < 1e-9 && Math.abs(bT.kayit[0][1] - 151) < 1e-9, 'yumuşak ofset');
    assert.ok(Math.abs(bT.kayit[0][2] - 22) < 1e-9 && Math.abs(bT.kayit[0][3] - 7) < 1e-9, 'yumuşak boyut');
    assert.ok(Math.abs(bT.kayit[1][0] - 150) < 1e-9 && Math.abs(bT.kayit[1][1] - 150) < 1e-9, 'temas ofset');
    assert.ok(Math.abs(bT.kayit[1][2] - 17) < 1e-9 && Math.abs(bT.kayit[1][3] - 5.5) < 1e-9, 'temas boyut');
    assert.equal(bT.kayit2.length, 1);
  });

  // (c) yürürken gölge sallanmaz, gövde tepesi yukarı çıkar
  const cT = await p.evaluate(() => {
    const e3 = window.karakter3dCiz, er = window.karakterResmiCiz;
    window.karakter3dCiz = null; window.karakterResmiCiz = null; // kod gövdesi (sallanma ölçümü)
    const ciz = (wp) => {
      const cv = document.createElement('canvas'); cv.width = 600; cv.height = 600;
      const c = cv.getContext('2d');
      const r = window.__kaydet();
      if (window.UcAvci) UcAvci.hazir = false;
      drawCharacter(c, 'kinkin', 0, 300, 300, 140, 0, wp); // büyük boy: 1,5·s px sallanma piksel eşiğini aşsın
      r.geri();
      const x = cv.getContext('2d'), d = x.getImageData(0, 0, 600, 600).data;
      let ust = 600;
      for (let yy = 0; yy < 600; yy++) for (let xx = 0; xx < 600; xx++) if (d[(yy * 600 + xx) * 4 + 3] > 128) { if (yy < ust) ust = yy; }
      return { gy: r.kayit.length ? r.kayit[r.kayit.length - 1].y : NaN, ust };
    };
    const nf = window.avciNefes; window.avciNefes = () => 0; // nefes ölçeği durana da boy ekler: sallanmayı ayırmak için kapalı
    const sonuc = { duran: ciz(0), yuruyen: ciz(0.13) };
    window.avciNefes = nf;
    window.karakter3dCiz = e3; window.karakterResmiCiz = er;
    return sonuc;
  });
  sina('(c) yürürken gölge y aynı, gövde tepesi yukarı', () => {
    assert.ok(Math.abs(cT.yuruyen.gy - cT.duran.gy) < 0.01, `${cT.duran.gy} / ${cT.yuruyen.gy}`);
    assert.ok(cT.yuruyen.ust < cT.duran.ust, `üst ${cT.duran.ust} / ${cT.yuruyen.ust}`);
  });

  // (d) drawBot gölgesi yerde
  const dT = await p.evaluate(() => {
    if (window.UcAvci) UcAvci.hazir = false;
    const cv = document.createElement('canvas'); cv.width = 400; cv.height = 400;
    const c = cv.getContext('2d');
    const ciz = (wt) => {
      const r = window.__kaydet();
      drawBot(c, { x: 200, y: 200, walkTimer: wt, hp: 3, maxHp: 3, hitFlash: 0, aimRaise: 0, shootRecoil: 0 });
      r.geri();
      return r.kayit[0];
    };
    return { duran: ciz(0), yuruyen: ciz(0.13) };
  });
  sina('(d) drawBot: gölge b.x, b.y+45*0.62 (yürürken de)', () => {
    for (const q of [dT.duran, dT.yuruyen]) {
      assert.ok(Math.abs(q.x - 200) <= 0.5, 'x ' + q.x);
      assert.ok(Math.abs(q.y - (200 + 45 * 0.62)) <= 0.5, 'y ' + q.y);
    }
  });

  // (e) köprü: oyuncu, bot, uzak oyuncu gölgesi güvertede
  const eT = await p.evaluate(() => {
    __kur(1);
    const k = game.kopruler[0];
    game.kopruAcik = new Array(game._yolculukDuzen.zones.length).fill(true); game._kopruAnim = {};
    const orta = { x: (k.a + k.b) / 2, y: k.c };
    const kemer = kopruYukselti(orta.x, orta.y);
    const ciz = () => {
      const r = window.__kaydet();
      render();
      r.geri();
      return r.kayit.slice();
    };
    // dünya noktası -> o anki kamerayla ekran; gölge kaydı ekran koordinatında
    const bul = (kayit, wx, wy) => {
      const ex = wx - game.camera.x, ey = wy - game.camera.y;
      return kayit.find((q) => q.yumusak && Math.abs(q.x - ex) < 1.5 && Math.abs(q.y - ey) < 1.5);
    };
    const p0 = game.player;
    const ayak = ayakY(p0.charKey, p0.costumeIdx, 0.7);
    // oyuncu
    online.mode = null; game.bot = null; game.bot2 = null; game.pet = null; game.ghosts = [];
    p0.x = orta.x; p0.y = orta.y; p0.dead = false; p0.dusus = null; p0.gizli = false;
    game.camera.x = p0.x - game.W / 2; game.camera.y = p0.y - game.H / 2;
    const oyuncu = bul(ciz(), orta.x, orta.y + ayak - kemer);
    // bot
    p0.x = orta.x - 400; p0.y = orta.y; // oyuncu köprü dışında
    game.camera.x = orta.x - game.W / 2; game.camera.y = orta.y - game.H / 2;
    game.bot = null; game.bot2 = null;
    spawnBot();
    if (!game.bot) game.bot = { x: orta.x, y: orta.y, walkTimer: 0, hp: 3, maxHp: 3, hitFlash: 0, aimRaise: 0, shootRecoil: 0, r: 18 };
    game.bot.x = orta.x; game.bot.y = orta.y; game.bot.walkTimer = 0; game.bot2 = null;
    const bot = bul(ciz(), orta.x, orta.y + 45 * 0.62 - kemer);
    // uzak oyuncu
    game.bot = null;
    online.mode = 'host';
    online.cachedRoom = null;
    online.remotePlayers = { sahte: { x: orta.x, y: orta.y, facing: 0, yurume: 0, hp: 3, maxHp: 3, name: 'x', charKey: p0.charKey, costumeIdx: p0.costumeIdx } };
    const uzak = bul(ciz(), orta.x, orta.y + ayak - kemer);
    online.mode = null; online.remotePlayers = {};
    // köprü dışı
    p0.x = orta.x - 400; p0.y = orta.y;
    game.camera.x = p0.x - game.W / 2; game.camera.y = p0.y - game.H / 2;
    const dis = bul(ciz(), orta.x - 400, orta.y + ayak);
    return { kemer, oyuncu, bot, uzak, dis, ayak, oy: orta };
  });
  sina('(e) köprüde oyuncu/bot/uzak oyuncu gölgesi kemer kadar yükselir, dışarıda 0', () => {
    assert.ok(eT.kemer > 0, 'kemer ' + eT.kemer);
    assert.ok(eT.oyuncu, 'oyuncu gölgesi yok');
    assert.ok(eT.bot, 'bot gölgesi yok');
    assert.ok(eT.uzak, 'uzak oyuncu gölgesi yok');
    assert.ok(eT.dis, 'dış gölge yok');
  });

  // (f) petler
  const fT = await p.evaluate(() => {
    __kur(1);
    const k = game.kopruler[0];
    game.kopruAcik = new Array(game._yolculukDuzen.zones.length).fill(true); game._kopruAnim = {};
    const orta = { x: (k.a + k.b) / 2, y: k.c };
    const kemer = kopruYukselti(orta.x, orta.y);
    const proto = CanvasRenderingContext2D.prototype;
    const ciz = (tur, x, y) => {
      game.pet = { tur, baygin: 0, koruma: 0, yurume: 0, saldiri: 0, yon: 1, kanat: 0, can: 5, maxCan: 5, x, y };
      const eski = proto.ellipse, kayit = [];
      proto.ellipse = function (ex, ey, rx, ry, ...rest) {
        const m = this.getTransform();
        kayit.push([m.a * ex + m.c * ey + m.e, m.b * ex + m.d * ey + m.f, rx, ry, ...rest]);
        return eski.call(this, ex, ey, rx, ry, ...rest);
      };
      const cv = document.createElement('canvas'); cv.width = 100; cv.height = 100;
      const c = cv.getContext('2d');
      try { petCiz(c, tur === 'kus'); } catch (e) { return { hata: e.message }; } finally { proto.ellipse = eski; }
      return { kayit };
    };
    const koprude = ciz('kedi', orta.x, orta.y);
    const dis = ciz('kedi', orta.x - 400, orta.y);
    const ucan = ciz('kus', orta.x, orta.y);
    game.pet = null;
    return { kemer, orta, koprude, dis, ucan };
  });
  sina('(f) yer peti temas gölgesi (9x3), köprüde yukarı; uçan pet tek elips', () => {
    assert.ok(fT.kemer > 0);
    const temas = (q) => (q.kayit || []).find((a) => Math.abs(a[2] - 9) < 1e-9 && Math.abs(a[3] - 3) < 1e-9);
    const k1 = temas(fT.koprude), k2 = temas(fT.dis);
    assert.ok(k1 && k2, 'temas gölgesi yok');
    assert.ok(Math.abs(k2[0] - (fT.orta.x - 400)) < 0.01 && Math.abs(k2[1] - (fT.orta.y + 10)) < 0.01, 'dış temas');
    assert.ok(Math.abs(k1[0] - fT.orta.x) < 0.01 && Math.abs(k1[1] - (fT.orta.y + 10 - fT.kemer)) < 0.01, 'köprü temas');
    assert.equal(fT.ucan.kayit.length, 1, 'uçan pet elips sayısı');
  });

  // (g) hayalet: kayma 2, temas gölgesi yok
  const gT = await p.evaluate(() => {
    const proto = CanvasRenderingContext2D.prototype, eski = proto.ellipse, kayit = [];
    proto.ellipse = function (...a) { kayit.push(a); return eski.apply(this, a); };
    const cv = document.createElement('canvas'); cv.width = 300; cv.height = 300;
    const c = cv.getContext('2d');
    try {
      drawGhost(c, { x: 150, y: 150, size: 40, hp: 1, maxHp: 1, cikis: 0, isBoss: false, isShooter: false, frozenUntil: 0 });
    } finally { proto.ellipse = eski; }
    return { kayit };
  });
  sina('(g) hayalet gölgesi (2, 23), 17x5.5 temas elipsi yok', () => {
    const golge = gT.kayit.find((a) => Math.abs(a[2] - 18) < 1e-9 && Math.abs(a[3] - 5) < 1e-9);
    assert.ok(golge && Math.abs(golge[0] - 2) < 1e-9 && Math.abs(golge[1] - 23) < 1e-9, JSON.stringify(golge));
    assert.ok(!gT.kayit.some((a) => Math.abs(a[2] - 17) < 1e-9 && Math.abs(a[3] - 5.5) < 1e-9), 'temas gölgesi çizilmiş');
  });

  // (h) performans: gölge açık/kapalı medyan oranı <= 1.10
  const hT = await p.evaluate(() => {
    __kur(1);
    save.extraBot = true;
    const p0 = game.player;
    p0.x = game.worldW / 2; p0.y = game.worldH / 2;
    game.camera.x = p0.x - game.W / 2; game.camera.y = p0.y - game.H / 2;
    if (typeof spawnBot === 'function') { try { spawnBot(); } catch (e) {} }
    game.ghosts = [];
    for (let i = 0; i < 12; i++) {
      spawnGhost();
      const g = game.ghosts[game.ghosts.length - 1];
      g.x = p0.x + ((i % 4) - 1.5) * 70; g.y = p0.y + (Math.floor(i / 4) - 1) * 80;
    }
    game.pet = { tur: 'kedi', baygin: 0, koruma: 0, yurume: 0, saldiri: 0, yon: 1, kanat: 0, can: 5, maxCan: 5, x: p0.x + 40, y: p0.y + 5 };
    const olc = (n = 120) => {
      const ctx2 = game.ctx, gid = ctx2.getImageData.bind(ctx2), GW = game.W, GH = game.H;
      const a = [];
      for (let r = 0; r < 7; r++) {
        const bas = performance.now();
        for (let i = 0; i < n; i++) { render(); gid(0, 0, GW, GH); }
        a.push(performance.now() - bas);
      }
      a.sort((x, y) => x - y); return a[3];
    };
    for (let i = 0; i < 60; i++) render();
    const eski = window.zeminGolgesi;
    window.zeminGolgesi = () => {};
    for (let i = 0; i < 60; i++) render();
    const kapali = olc(); // önce gölgesiz: JIT/ısınma eğilimi gerçek ölçümün aleyhine olmasın
    window.zeminGolgesi = eski;
    for (let i = 0; i < 60; i++) render();
    const acik = olc();
    return { acik, kapali, oran: acik / kapali };
  });
  sina('(h) gölge maliyeti: medyan oran <= 1.10', () => {
    assert.ok(hT.oran <= 1.10, `oran ${hT.oran} (${hT.acik} / ${hT.kapali})`);
  });

  sina('(i) sayfa hatası yok', () => { assert.equal(hatalar.length, 0, hatalar.join(' | ')); });
} finally {
  await b.close(); sunucu.close();
}
console.log(sonuclar.join('\n'));
const basarisiz = sonuclar.filter((s) => s.startsWith('✗'));
if (basarisiz.length) { console.log(`\n${basarisiz.length} sınama başarısız`); process.exitCode = 1; }
