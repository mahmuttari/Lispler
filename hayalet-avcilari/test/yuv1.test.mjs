// Hayalet Avcıları YUV1: yuva fareleri ve yarasaları — çevrimdışı sınama.
// Çalıştırma: node test/yuv1.test.mjs
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
  await p.waitForFunction(() => typeof startGame === 'function' && typeof yuvaCanlilariGuncelle === 'function');
  await p.evaluate(() => {
    window.__kur = (level = 1) => {
      if (game.running) endGame(false);
      online.mode = null;
      startGame();
      game.level = level; buildWalls(); buildWaters(); buildHazards();
      game.paused = true; game.running = false;
      game.ghosts = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
      game.player.dead = false; game.player.invuln = 1e9;
      game.camera.x = game.player.x - game.W / 2; game.camera.y = game.player.y - game.H / 2;
      return game;
    };
    window.__ac = () => { game.walls = []; game.waters = []; game.spikes = []; game.lavas = []; }; // kaçış yolu açık
    window.__yi = (yv) => game.yuvalar.indexOf(yv);
  });

  // (a) uzaktayken bir yuvada 3-5 fare, 2-3 yarasa
  const a = await p.evaluate(() => {
    __kur(1); const yv = game.yuvalar[0];
    game.player.x = Math.max(100, yv.x - 1200);
    const st = yuvaCanliDurum(yv, __yi(yv));
    return { fare: st.critterlar.filter((c) => c.tur === 'fare').length, yarasa: st.critterlar.filter((c) => c.tur === 'yarasa').length };
  });
  sina('(a) yuvada 3-5 fare ve 2-3 yarasa var', () => {
    assert.ok(a.fare >= 3 && a.fare <= 5, JSON.stringify(a));
    assert.ok(a.yarasa >= 2 && a.yarasa <= 3, JSON.stringify(a));
  });

  // (b) 200 px yaklaşınca herkes kaçar; 2 sn sonra hepsi söner
  const b2 = await p.evaluate(() => {
    __kur(1); __ac(); const yv = game.yuvalar[0];
    const st = yuvaCanliDurum(yv, __yi(yv));
    game.player.x = yv.x + 200; game.player.y = yv.y;
    game.camera.x = yv.x - game.W / 2; game.camera.y = yv.y - game.H / 2;
    const ilk = st.critterlar.map((c) => ({ tur: c.tur, x: c.x, y: c.y, d: Math.hypot(c.x - game.player.x, c.y - game.player.y) }));
    for (let i = 0; i < 30; i++) yuvaCanlilariGuncelle(0.016);
    const orta = st.critterlar.map((c) => ({ tur: c.tur, x: c.x, y: c.y, d: Math.hypot(c.x - game.player.x, c.y - game.player.y), alfa: c.alfa }));
    for (let i = 0; i < 100; i++) yuvaCanlilariGuncelle(0.016);
    const son = st.critterlar.map((c) => ({ durum: c.durum, alfa: c.alfa }));
    return { ilk, orta, son, kacti: st.kacti };
  });
  sina('(b) fareler oyuncudan uzaklaşır, yarasaların y değeri düşer', () => {
    assert.ok(b2.kacti);
    for (let i = 0; i < b2.ilk.length; i++) {
      if (b2.ilk[i].tur === 'fare') assert.ok(b2.orta[i].d > b2.ilk[i].d + 5, `fare ${i} ${b2.ilk[i].d}→${b2.orta[i].d}`);
      else assert.ok(b2.orta[i].y < b2.ilk[i].y - 5, `yarasa ${i} ${b2.ilk[i].y}→${b2.orta[i].y}`);
    }
  });
  sina('(b) 2 saniye sonra hepsi sönmüş', () => {
    for (const c of b2.son) assert.ok(c.durum === 'yok' && c.alfa <= 0.01, JSON.stringify(c));
  });

  // (c) yakında dururken geri gelmez; 520 px'den uzakta 20 sn sonra geri gelir
  const c = await p.evaluate(() => {
    __kur(1); __ac(); const yv = game.yuvalar[0];
    const st = yuvaCanliDurum(yv, __yi(yv));
    game.player.x = yv.x + 200; game.player.y = yv.y;
    for (let i = 0; i < 200; i++) yuvaCanlilariGuncelle(0.05); // 10 sn yakında
    const yakin = { kacti: st.kacti, yok: st.critterlar.every((x) => x.durum === 'yok') };
    game.player.x = yv.x + 800; // 520'den uzak
    for (let i = 0; i < 300; i++) yuvaCanlilariGuncelle(0.05); // 15 sn
    const oncesi = st.kacti;
    for (let i = 0; i < 120; i++) yuvaCanlilariGuncelle(0.05); // +6 sn → 20 sn geçti
    return { yakin, oncesi, sonra: st.kacti, bekle: st.critterlar.filter((x) => x.durum === 'bekle').length };
  });
  sina('(c) yakındayken geri gelmez, uzakta 20 sn sonra geri gelir', () => {
    assert.ok(c.yakin.kacti && c.yakin.yok, JSON.stringify(c.yakin));
    assert.equal(c.oncesi, true);
    assert.equal(c.sonra, false);
    assert.ok(c.bekle >= 3, String(c.bekle));
  });

  // (d) yuvadan hayalet doğması kaçışı tetikler
  const d = await p.evaluate(() => {
    __kur(1); const yv = game.yuvalar[0];
    game.yuvalar = [yv]; game._sonYuva = null;
    game.player.x = yv.x - 1000; game.player.y = yv.y; game.player.dead = false;
    spawnGhost({ x0: yv.bolge * 1000, x1: yv.bolge * 1000 + 500, bolge: yv.bolge });
    const st = yuvaCanliDurum(yv, 0);
    return { kacti: st.kacti, kacan: st.critterlar.filter((x) => x.durum === 'kac' || x.durum === 'soluk').length };
  });
  sina('(d) yuvadan hayalet doğunca canlılar kaçar', () => {
    assert.ok(d.kacti && d.kacan >= 3, JSON.stringify(d));
  });

  // (e) resim yokken kod yedeği (fare-* drawImage yok, rotate yok); fake fare kareleri çizilir; yarasa kareleri çizilir
  await p.waitForFunction(() => typeof gorsel === 'function' && gorsel('an-yarasa-1'));
  const e = await p.evaluate(() => {
    __kur(1); __ac(); const yv = game.yuvalar[0];
    const st = yuvaCanliDurum(yv, __yi(yv));
    game.player.x = yv.x + 200; game.player.y = yv.y;
    game.camera.x = yv.x - game.W / 2; game.camera.y = yv.y - game.H / 2;
    for (let i = 0; i < 6; i++) yuvaCanlilariGuncelle(0.016); // kaçış başlasın
    // Gerçek fare kareleri (K14) varsa "resim yokken" denetimi için geçici olarak kaldırılır, sonda geri konur
    const gercek = [];
    for (const ad of ['fare-kos', 'fare-bekle']) for (let i = 1; i <= 3; i++) {
      const k = `an-${ad}-${i}`;
      if (k in GORSEL || k in GORSEL_LISTESI) { gercek.push([k, GORSEL[k], GORSEL_LISTESI[k]]); delete GORSEL[k]; delete GORSEL_LISTESI[k]; }
    }
    if (typeof _animSayi === 'object') { _animSayi['fare-kos'] = undefined; _animSayi['fare-bekle'] = undefined; }
    const cv = document.createElement('canvas'); cv.width = 400; cv.height = 300;
    const ctx = cv.getContext('2d');
    let rot = 0, imgs = [];
    ctx.rotate = function () { rot++; };
    ctx.drawImage = function (img) { imgs.push(img); };
    const fareAnahtar = (img) => ["an-fare-kos-1", "an-fare-kos-2", "an-fare-kos-3"].some((k) => typeof GORSEL !== 'undefined' && GORSEL[k] === img);
    yuvaCanlilariCiz(ctx, 'arka');
    const yedekFare = imgs.filter(fareAnahtar).length;
    const yedekRot = rot;
    // sahte fare kareleri ekle
    const sahte = () => ({ complete: true, naturalWidth: 22, naturalHeight: 16, width: 22, height: 16 });
    for (let i = 1; i <= 3; i++) { GORSEL_LISTESI[`an-fare-kos-${i}`] = [22, 16]; GORSEL[`an-fare-kos-${i}`] = sahte(); }
    if (typeof _animSayi === 'object') _animSayi['fare-kos'] = undefined;
    imgs = []; rot = 0;
    yuvaCanlilariCiz(ctx, 'arka');
    const fareCizilen = imgs.filter(fareAnahtar).length;
    const fareRot = rot;
    // yarasalar
    imgs = []; rot = 0;
    yuvaCanlilariCiz(ctx, 'on');
    const yarasaCizilen = imgs.filter((im) => ["an-yarasa-1", "an-yarasa-2", "an-yarasa-3"].some((k) => GORSEL[k] === im)).length;
    const yarasaRot = rot;
    for (let i = 1; i <= 3; i++) { delete GORSEL_LISTESI[`an-fare-kos-${i}`]; delete GORSEL[`an-fare-kos-${i}`]; }
    for (const [k, im, boy] of gercek) { if (im !== undefined) GORSEL[k] = im; if (boy !== undefined) GORSEL_LISTESI[k] = boy; }
    if (typeof _animSayi === 'object') { _animSayi['fare-kos'] = undefined; _animSayi['fare-bekle'] = undefined; }
    return { yedekFare, yedekRot, fareCizilen, fareRot, yarasaCizilen, yarasaRot };
  });
  sina('(e) resim yokken kod yedeği: fare-* drawImage ve rotate yok', () => {
    assert.equal(e.yedekFare, 0);
    assert.equal(e.yedekRot, 0);
  });
  sina('(e) sahte fare kareleri çizilir (rotate yok); yarasa kareleri çizilir', () => {
    assert.ok(e.fareCizilen >= 1, JSON.stringify(e));
    assert.equal(e.fareRot, 0);
    assert.ok(e.yarasaCizilen >= 1, JSON.stringify(e));
    assert.equal(e.yarasaRot, 0);
  });

  // (f) hareketi azalt: konum değişmez, alfa 0'a iner
  const f = await p.evaluate(() => {
    __kur(1); __ac(); const yv = game.yuvalar[0];
    const st = yuvaCanliDurum(yv, __yi(yv));
    game.player.x = yv.x + 200; game.player.y = yv.y;
    const eskiMM = window.matchMedia;
    window.matchMedia = () => ({ matches: true });
    const ilk = st.critterlar.map((x) => ({ x: x.x, y: x.y }));
    for (let i = 0; i < 40; i++) yuvaCanlilariGuncelle(0.016);
    const son = st.critterlar.map((x) => ({ x: x.x, y: x.y, alfa: x.alfa, durum: x.durum }));
    window.matchMedia = eskiMM;
    return { ilk, son };
  });
  sina('(f) hareketi azalt: konumlar sabit, alfa 0', () => {
    for (let i = 0; i < f.ilk.length; i++) {
      assert.equal(f.son[i].x, f.ilk[i].x);
      assert.equal(f.son[i].y, f.ilk[i].y);
      assert.ok(f.son[i].alfa <= 0.01, JSON.stringify(f.son[i]));
    }
  });

  // (g) güncelleme sırasında Math.random çağrılmaz
  const g = await p.evaluate(() => {
    __kur(1); __ac(); const yv = game.yuvalar[0];
    yuvaCanliDurum(yv, __yi(yv));
    game.player.x = yv.x + 200; game.player.y = yv.y;
    let n = 0; const eski = Math.random; Math.random = () => { n++; return eski(); };
    for (let i = 0; i < 30; i++) yuvaCanlilariGuncelle(0.016);
    Math.random = eski;
    return n;
  });
  sina('(g) canlı güncellemesi Math.random kullanmaz', () => assert.equal(g, 0, String(g)));

  // (i) performans: canlı çizimi kapalı/ açık render oranı ≤ 1.3
  const perf = await p.evaluate(() => {
    __kur(3);
    const z = game._yolculukDuzen.zones[2];
    game.player.x = (z.x0 + z.gate.x0) / 2; game.player.y = game.worldH / 2;
    game.player.dead = false; game.player.invuln = 1e9;
    game.ghosts = []; game.pickups = []; game.projectiles = []; game.enemyProjectiles = []; game.effects = [];
    game.camera.x = game.player.x - game.W / 2; game.camera.y = game.player.y - game.H / 2;
    for (const yv of game.yuvalar) if (Math.abs(yv.x - game.player.x) < 900) yuvaCanliDurum(yv, game.yuvalar.indexOf(yv));
    const ctx = game.ctx, gid = ctx.getImageData.bind(ctx);
    // Açık ve kapalı ölçümler dönüşümlü (7 tur), her birinin ortancası: art arda ölçmek ısınma ve makine yükü yüzünden
    // oranı 1,2-1,5 arasında oynatıyordu (K14 fare kareleri gelince denetim zaman zaman düşüyordu)
    const gercek = window.yuvaCanlilariCiz, bos = () => {};
    const parti = () => { const t0 = performance.now(); for (let i = 0; i < 40; i++) { render(); gid(0, 0, 8, 8); } return performance.now() - t0; };
    for (let i = 0; i < 60; i++) render();
    const A = [], K = [];
    for (let r = 0; r < 7; r++) {
      window.yuvaCanlilariCiz = gercek; A.push(parti());
      window.yuvaCanlilariCiz = bos; K.push(parti());
    }
    window.yuvaCanlilariCiz = gercek;
    const ort = (a) => a.slice().sort((x, y) => x - y)[3];
    const acik = ort(A), kapali = ort(K);
    return { acik, kapali, oran: acik / kapali };
  });
  sina('(i) performans: canlı çizimi oranı ≤ 1.3', () => assert.ok(perf.oran <= 1.3, JSON.stringify(perf)));

  // Ekran görüntüleri
  const ekran = path.join(KOK, 'test', 'ekran');
  if (!fs.existsSync(ekran)) fs.mkdirSync(ekran, { recursive: true });
  await p.evaluate(() => {
    __kur(1); __ac(); const yv = game.yuvalar[0];
    window.__yv = yv;
    game.player.x = yv.x - 260; game.player.y = yv.y + 120; game.player.dead = false;
    game.camera.x = yv.x - game.W / 2; game.camera.y = yv.y - game.H / 2;
    yuvaCanliDurum(yv, __yi(yv));
    render();
  });
  await p.screenshot({ path: path.join(ekran, 'yuv1-yuvada.png') });
  await p.evaluate(() => {
    const yv = window.__yv;
    game.player.x = yv.x + 200; game.player.y = yv.y;
    game.camera.x = yv.x - game.W / 2 + 80; game.camera.y = yv.y - game.H / 2;
    for (let i = 0; i < 22; i++) yuvaCanlilariGuncelle(0.016);
    render();
  });
  await p.screenshot({ path: path.join(ekran, 'yuv1-kacis.png') });

  sina('(h) sayfa hatası yok', () => assert.deepEqual(hatalar, []));
} finally {
  await b.close(); sunucu.close();
}
for (const s of sonuclar) console.log(s);
const basarisiz = sonuclar.filter((s) => s.startsWith('✗')).length;
if (hatalar.length) console.log('Sayfa hataları:', hatalar.join(' | '));
if (basarisiz || hatalar.length) { console.log(`${basarisiz} başarısız, ${hatalar.length} sayfa hatası`); process.exit(1); }
console.log(`Tümü geçti (${sonuclar.length})`);
