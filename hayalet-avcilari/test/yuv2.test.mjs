// Hayalet Avcıları YUV2: yuva fareleri/yarasaları görünür kaçış — çevrimdışı sınama.
// Çalıştırma: node test/yuv2.test.mjs
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
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
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
    window.__ac = () => { game.walls = []; game.waters = []; game.spikes = []; game.lavas = []; };
    window.__yi = (yv) => game.yuvalar.indexOf(yv);
    window.__kamera = (yv) => { game.camera.x = yv.x - game.W / 2; game.camera.y = yv.y - game.H / 2; };
    window.__yakin = (yv, d = 150) => { game.player.x = yv.x + d; game.player.y = yv.y; game.player.dead = false; __kamera(yv); };
    window.__adim = (n, dt = 0.016) => { for (let i = 0; i < n; i++) yuvaCanlilariGuncelle(dt); };
    window.__fareliYuv = () => {
      for (const yv of game.yuvalar) {
        const st = yuvaCanliDurum(yv, __yi(yv));
        if (st.critterlar.filter((c) => c.tur === 'fare').length >= 4) return yv;
      }
      return game.yuvalar[0];
    };
  });

  // (a) sayılar: 1-3. bölümlerde her yuva 3-6 fare, 2-4 yarasa; en az bir yuvada >=5 fare ya da >=3 yarasa
  const a = await p.evaluate(() => {
    let enFare = 0, enYarasa = 0, kotu = [];
    for (let lv = 1; lv <= 3; lv++) {
      __kur(lv); yuvaCanlilariSifirla();
      game.yuvalar.forEach((yv, i) => {
        const st = yuvaCanliDurumKur(yv, i);
        const f = st.critterlar.filter((c) => c.tur === 'fare').length;
        const y = st.critterlar.filter((c) => c.tur === 'yarasa').length;
        enFare = Math.max(enFare, f); enYarasa = Math.max(enYarasa, y);
        if (f < 3 || f > 6 || y < 2 || y > 4) kotu.push([lv, i, f, y]);
      });
    }
    return { enFare, enYarasa, kotu, yuv: game.yuvalar.length };
  });
  sina('(a) her yuvada 3-6 fare, 2-4 yarasa', () => {
    assert.deepEqual(a.kotu, []);
    assert.ok(a.enFare >= 5 || a.enYarasa >= 3, JSON.stringify(a));
  });

  // (b) 1a: ekran dışı yuvayı urkutmak durum kurmaz/kaçırmaz; ekrandaki kaçar
  const b1 = await p.evaluate(() => {
    __kur(1); yuvaCanlilariSifirla(); const yv = game.yuvalar[0];
    game.player.x = yv.x; game.player.y = yv.y; game.player.dead = false;
    game.camera.x = yv.x + 1500; game.camera.y = yv.y;
    yuvaCanlilariUrkut(yv);
    const dis = { varMi: !!YC.durumlar.get(yv), kacti: !!(YC.durumlar.get(yv) && YC.durumlar.get(yv).kacti) };
    __kamera(yv);
    yuvaCanlilariUrkut(yv);
    const st = YC.durumlar.get(yv);
    return { dis, ic: { varMi: !!st, kacti: !!(st && st.kacti) } };
  });
  sina('(b) ekran dışı urkutma yok sayılır, ekrandaki kaçar', () => {
    assert.equal(b1.dis.varMi, false); assert.equal(b1.dis.kacti, false);
    assert.equal(b1.ic.varMi, true); assert.equal(b1.ic.kacti, true);
  });

  // (c) 1b: 250 px ve ekranda → kaçar; 200 px ama ekran dışında → kaçmaz
  const c1 = await p.evaluate(() => {
    __kur(1); yuvaCanlilariSifirla(); const yv = game.yuvalar[0];
    window.__yv = yv;
    __yakin(yv, 250); __adim(2);
    const ic = !!YC.durumlar.get(yv) && YC.durumlar.get(yv).kacti;
    yuvaCanlilariSifirla();
    game.player.x = yv.x + 200; game.player.y = yv.y; game.player.dead = false;
    game.camera.x = yv.x + 1500; game.camera.y = yv.y;
    __adim(20);
    const st = YC.durumlar.get(yv);
    const dis = !!(st && st.kacti);
    return { ic, dis };
  });
  sina('(c) ekrandaki yakın yuva kaçar, ekran dışındaki kaçmaz', () => {
    assert.equal(c1.ic, true); assert.equal(c1.dis, false);
  });

  // (d) 1c: 11 yok yuvadan sonra 12. yuva güncellenir
  const d = await p.evaluate(() => {
    __kur(1); yuvaCanlilariSifirla(); __ac();
    const yuvlar = game.yuvalar.slice(0, 12);
    yuvlar.forEach((yv, i) => {
      const st = yuvaCanliDurumKur(yv, i);
      if (i < 11) { st.kacti = true; for (const c of st.critterlar) { c.durum = 'yok'; c.alfa = 0; } }
    });
    const yv = yuvlar[11]; const st = YC.durumlar.get(yv);
    __yakin(yv, 150);
    const ilk = st.critterlar.map((c) => ({ x: c.x, y: c.y }));
    __adim(60);
    const son = st.critterlar.map((c) => ({ x: c.x, y: c.y, durum: c.durum }));
    const hareket = son.some((c, i) => Math.hypot(c.x - ilk[i].x, c.y - ilk[i].y) > 5);
    return { kacti: st.kacti, hareket, kacan: son.filter((c) => c.durum === 'kac' || c.durum === 'soluk').length };
  });
  sina('(d) eski "yok" yuvalar sayacı doldurmaz, 12. yuva kaçar', () => {
    assert.equal(d.kacti, true); assert.equal(d.hareket, true); assert.ok(d.kacan >= 3, JSON.stringify(d));
  });

  // (e) yönler dağılır, her fare oyuncudan uzaklaşır
  const e = await p.evaluate(() => {
    __kur(1); yuvaCanlilariSifirla(); __ac();
    const yv = __fareliYuv(); const st = yuvaCanliDurum(yv, __yi(yv));
    __yakin(yv, 150);
    const fareler = st.critterlar.filter((c) => c.tur === 'fare');
    const ilk = fareler.map((c) => ({ x: c.x, y: c.y, d: Math.hypot(c.x - game.player.x, c.y - game.player.y) }));
    yuvaCanliKacir(st);
    __adim(38);
    const aci = fareler.map((c, i) => Math.atan2(c.y - ilk[i].y, c.x - ilk[i].x));
    let enAz = Infinity, enCok = -Infinity;
    for (const a of aci) { enAz = Math.min(enAz, a); enCok = Math.max(enCok, a); }
    const yayilma = (enCok - enAz) * 180 / Math.PI;
    const uzak = fareler.map((c, i) => Math.hypot(c.x - game.player.x, c.y - game.player.y) > ilk[i].d);
    return { adet: fareler.length, yayilma, hepsiUzak: uzak.every(Boolean) };
  });
  sina('(e) fare yönleri >=60° dağılır, hepsi uzaklaşır', () => {
    assert.ok(e.adet >= 4, String(e.adet));
    assert.ok(e.yayilma >= 60, JSON.stringify(e));
    assert.equal(e.hepsiUzak, true);
  });

  // (f) yol düz değil: kirişten en büyük dik uzaklık >=6, yol/kiriş >=1.05
  const f = await p.evaluate(() => {
    __kur(1); yuvaCanlilariSifirla(); __ac();
    const yv = __fareliYuv(); const st = yuvaCanliDurum(yv, __yi(yv));
    __yakin(yv, 150);
    yuvaCanliKacir(st);
    const c = st.critterlar.find((x) => x.tur === 'fare');
    const bas = { x: c.x, y: c.y };
    const noktalar = [];
    for (let i = 0; i < 63; i++) { __adim(1); noktalar.push({ x: c.x, y: c.y }); }
    const son = noktalar[noktalar.length - 1];
    const dx = son.x - bas.x, dy = son.y - bas.y, kiris = Math.hypot(dx, dy) || 1;
    let enBuyuk = 0, uzunluk = 0, once = bas;
    for (const n of noktalar) {
      enBuyuk = Math.max(enBuyuk, Math.abs((n.x - bas.x) * dy - (n.y - bas.y) * dx) / kiris);
      uzunluk += Math.hypot(n.x - once.x, n.y - once.y); once = n;
    }
    return { enBuyuk, oran: uzunluk / kiris };
  });
  sina('(f) fare yolu zigzaglı (dik uzaklık >=6, oran >=1.05)', () => {
    assert.ok(f.enBuyuk >= 6, JSON.stringify(f));
    assert.ok(f.oran >= 1.05, JSON.stringify(f));
  });

  // (g) gecikmeli başlangıç: 0,1 sn'de kimi kıpırdamış, kimi duruyor
  const g = await p.evaluate(() => {
    __kur(1); yuvaCanlilariSifirla(); __ac();
    const yv = __fareliYuv(); const st = yuvaCanliDurum(yv, __yi(yv));
    __yakin(yv, 150);
    const ilk = st.critterlar.map((c) => ({ x: c.x, y: c.y }));
    yuvaCanliKacir(st);
    __adim(6);
    const hareket = st.critterlar.map((c, i) => Math.hypot(c.x - ilk[i].x, c.y - ilk[i].y) > 0.5);
    return { duran: hareket.filter((x) => !x).length, kacan: hareket.filter((x) => x).length };
  });
  sina('(g) başlangıçlar kademeli: kimi durur, kimi gider', () => {
    assert.ok(g.duran >= 1 && g.kacan >= 1, JSON.stringify(g));
  });

  // (h) yarasalar yükselir, kanat çırpar, 1 sn alfa 1; 3 sn sonra hepsi yok
  const h = await p.evaluate(() => {
    __kur(1); yuvaCanlilariSifirla(); __ac();
    const yv = game.yuvalar[0]; const st = yuvaCanliDurum(yv, __yi(yv));
    __yakin(yv, 150);
    yuvaCanliKacir(st);
    const yarasalar = st.critterlar.filter((c) => c.tur === 'yarasa');
    const ilk = yarasalar.map((c) => ({ x: c.x, y: c.y, bx: c.bx, by: c.by, dirX: c.dirX, hiz: c.hiz }));
    const sapma = yarasalar.map(() => 0);
    for (let i = 0; i < 63; i++) {
      __adim(1);
      yarasalar.forEach((c, k) => {
        const duz = ilk[k].bx + ilk[k].dirX * ilk[k].hiz * c.tt;
        sapma[k] = Math.max(sapma[k], Math.abs(c.x - duz));
      });
    }
    const bir = yarasalar.map((c, k) => ({ dy: ilk[k].y - c.y, alfa: c.alfa }));
    __adim(130);
    return { bir, sapma, son: st.critterlar.map((c) => c.durum) };
  });
  sina('(h) yarasalar >=60 px yükselir, kanat sapması >=4, alfa 1', () => {
    for (let k = 0; k < h.bir.length; k++) {
      assert.ok(h.bir[k].dy >= 60, JSON.stringify(h.bir[k]));
      assert.ok(h.sapma[k] >= 4, String(h.sapma[k]));
      assert.ok(h.bir[k].alfa >= 0.99, String(h.bir[k].alfa));
    }
  });
  sina('(h) 3 sn sonra hepsi yok', () => { for (const d of h.son) assert.equal(d, 'yok'); });

  // (i) açık arazide ortalama fare kaçış mesafesi >=200 px
  const i = await p.evaluate(() => {
    __kur(1); yuvaCanlilariSifirla(); __ac();
    const yv = __fareliYuv(); const st = yuvaCanliDurum(yv, __yi(yv));
    __yakin(yv, 150);
    yuvaCanliKacir(st);
    const fareler = st.critterlar.filter((c) => c.tur === 'fare');
    const bas = fareler.map((c) => ({ x: c.x, y: c.y }));
    const son = bas.map((x) => ({ x: x.x, y: x.y }));
    for (let t = 0; t < 260; t++) {
      __adim(1);
      fareler.forEach((c, k) => { if (c.durum !== 'yok') { son[k].x = c.x; son[k].y = c.y; } });
    }
    const mesafe = fareler.map((c, k) => Math.hypot(son[k].x - bas[k].x, son[k].y - bas[k].y));
    return { ortalama: mesafe.reduce((a, b) => a + b, 0) / mesafe.length, mesafe };
  });
  sina('(i) fareler açık arazide ortalama >=200 px kaçar', () => assert.ok(i.ortalama >= 200, JSON.stringify(i)));

  // (j) ekranda görünür: 0,5 sn sonra >=3 canlı alfa>=0.9 kamerada; piksel farkı >150
  const j = await p.evaluate(() => {
    __kur(1); yuvaCanlilariSifirla(); __ac();
    const yv = game.yuvalar[0]; const st = yuvaCanliDurum(yv, __yi(yv));
    __yakin(yv, 150);
    yuvaCanliKacir(st);
    __adim(31);
    const cam = game.camera, W = game.W, H = game.H;
    const icerde = st.critterlar.filter((c) => c.durum !== 'yok' && c.alfa >= 0.9 && c.x >= cam.x && c.x <= cam.x + W && c.y >= cam.y && c.y <= cam.y + H).length;
    render();
    const ctx = game.ctx;
    const dolu = ctx.getImageData(0, 0, W, H).data;
    const kayit = st.critterlar.map((c) => ({ durum: c.durum, alfa: c.alfa }));
    for (const c of st.critterlar) { c.durum = 'yok'; c.alfa = 0; }
    render();
    const bos = ctx.getImageData(0, 0, W, H).data;
    st.critterlar.forEach((c, k) => { c.durum = kayit[k].durum; c.alfa = kayit[k].alfa; });
    let fark = 0;
    for (let q = 0; q < dolu.length; q += 4) if (dolu[q] !== bos[q] || dolu[q + 1] !== bos[q + 1] || dolu[q + 2] !== bos[q + 2]) fark++;
    return { icerde, fark };
  });
  sina('(j) canlılar ekranda çizilir (>=3 görünür, piksel farkı >150)', () => {
    assert.ok(j.icerde >= 3, JSON.stringify(j));
    assert.ok(j.fark > 150, String(j.fark));
  });

  // (k) hareketi azalt: düz, yavaş, 1,2 sn sonra yok
  await p.emulateMedia({ reducedMotion: 'reduce' });
  const k = await p.evaluate(() => {
    __kur(1); yuvaCanlilariSifirla(); __ac();
    const yv = __fareliYuv(); const st = yuvaCanliDurum(yv, __yi(yv));
    __yakin(yv, 150);
    const ilk = st.critterlar.map((c) => ({ x: c.x, y: c.y }));
    yuvaCanliKacir(st);
    const noktalar = st.critterlar.map(() => []);
    for (let t = 0; t < 50; t++) { __adim(1); st.critterlar.forEach((c, q) => noktalar[q].push({ x: c.x, y: c.y })); }
    const mesafe = st.critterlar.map((c, q) => Math.hypot(c.x - ilk[q].x, c.y - ilk[q].y));
    let enBuyuk = 0;
    st.critterlar.forEach((c, q) => {
      const son = noktalar[q][noktalar[q].length - 1], bas = ilk[q];
      const dx = son.x - bas.x, dy = son.y - bas.y, kiris = Math.hypot(dx, dy) || 1;
      for (const n of noktalar[q]) enBuyuk = Math.max(enBuyuk, Math.abs((n.x - bas.x) * dy - (n.y - bas.y) * dx) / kiris);
    });
    __adim(30);
    return { mesafe, enBuyuk, son: st.critterlar.map((c) => c.durum), az: yuvaCanliAzHareket() };
  });
  await p.emulateMedia({ reducedMotion: 'no-preference' });
  sina('(k) hareketi azalt: >=60 px düz kaçış, 1,2 sn sonra yok', () => {
    assert.equal(k.az, true);
    for (const m of k.mesafe) assert.ok(m >= 60, String(m));
    assert.ok(k.enBuyuk < 1, String(k.enBuyuk));
    for (const d of k.son) assert.equal(d, 'yok');
  });

  // (l) sesler: kaçış başına bir kez fare-kac / yarasa-kac; ikinci çağrı eklemez
  const l = await p.evaluate(() => {
    __kur(1); yuvaCanlilariSifirla(); const yv = game.yuvalar[0]; const st = yuvaCanliDurum(yv, __yi(yv));
    const say = {}; const eski = audio.canliSes;
    audio.canliSes = (ad) => { say[ad] = (say[ad] || 0) + 1; };
    __yakin(yv, 150);
    yuvaCanliKacir(st);
    const bir = JSON.parse(JSON.stringify(say));
    yuvaCanliKacir(st);
    const iki = JSON.parse(JSON.stringify(say));
    audio.canliSes = eski;
    return { bir, iki };
  });
  sina('(l) kaçış sesleri tam bir kez, ikinci kaçırma sessiz', () => {
    assert.equal(l.bir['fare-kac'], 1); assert.equal(l.bir['yarasa-kac'], 1);
    assert.deepEqual(l.iki, l.bir);
  });

  // (m) dirilme: 8,5 sn ekran dışında geri gelir; yaklaşınca yine kaçar
  const m = await p.evaluate(() => {
    __kur(1); yuvaCanlilariSifirla(); __ac();
    const yv = game.yuvalar[0]; const st = yuvaCanliDurum(yv, __yi(yv));
    __yakin(yv, 150); yuvaCanliKacir(st);
    __adim(230); // hepsi yok
    const yok = st.critterlar.every((c) => c.durum === 'yok');
    game.camera.x = yv.x + 5000; game.camera.y = yv.y; game.player.x = yv.x + 5000;
    __adim(180, 0.05); // 9 sn
    const geri = { kacti: st.kacti, bekle: st.critterlar.filter((c) => c.durum === 'bekle').length };
    __yakin(yv, 150); __adim(2);
    return { yok, geri, tekrar: st.kacti };
  });
  sina('(m) uzakta 8,5 sn sonra dirilir, yaklaşınca yine kaçar', () => {
    assert.equal(m.yok, true);
    assert.equal(m.geri.kacti, false); assert.ok(m.geri.bekle >= 3, JSON.stringify(m.geri));
    assert.equal(m.tekrar, true);
  });

  // (n) aynı bölüm iki kez aynı parametreler; Math.random hiç çağrılmaz
  const n = await p.evaluate(() => {
    const al = (level) => {
      __kur(level); yuvaCanlilariSifirla(); const yv = game.yuvalar[0]; const st = yuvaCanliDurum(yv, __yi(yv));
      __yakin(yv, 150);
      let say = 0; const eski = Math.random; Math.random = () => { say++; return eski(); };
      yuvaCanliKacir(st); __adim(190);
      Math.random = eski;
      return { p: st.critterlar.map((c) => [c.tur, c.a0, c.hiz, c.gec]), say };
    };
    const bir = al(2), iki = al(2);
    return { bir: bir.p, iki: iki.p, say: bir.say + iki.say };
  });
  sina('(n) aynı bölüm aynı parametreler, Math.random 0', () => {
    assert.deepEqual(n.iki, n.bir);
    assert.equal(n.say, 0, String(n.say));
  });

  // (o) klasik harita: yuva yok, güncelleme/çizim hatasız
  const o = await p.evaluate(() => {
    online.mode = 'host'; startGame();
    game.paused = true; game.ghosts = []; game.spawnTimer = 1e9;
    let hata = null;
    try { yuvaCanlilariGuncelle(0.016); render(); } catch (e) { hata = e.message; }
    return { yuvalar: (game.yuvalar || []).length, hata };
  });
  sina('(o) klasik haritada yuva yok, güncelleme/çizim hatasız', () => {
    assert.equal(o.yuvalar, 0); assert.equal(o.hata, null);
  });

  // (p) performans: 3 yuvalı bölgede kaçış vs canlılar kapalı oranı <=1.25
  const perf = await p.evaluate(() => {
    __kur(3);
    const bolgeler = {};
    for (const yv of game.yuvalar) (bolgeler[yv.bolge] = bolgeler[yv.bolge] || []).push(yv);
    let sec = null;
    for (const k of Object.keys(bolgeler)) if (bolgeler[k].length >= 3) { sec = bolgeler[k].slice(0, 3); break; }
    if (!sec) sec = game.yuvalar.slice(0, 3);
    const yv = sec[0];
    game.player.x = yv.x; game.player.y = yv.y; game.player.dead = false;
    game.ghosts = []; game.pickups = []; game.projectiles = []; game.enemyProjectiles = []; game.effects = [];
    __kamera(yv);
    for (const y of sec) { const st = yuvaCanliDurum(y, __yi(y)); __yakin(y, 150); yuvaCanliKacir(st); }
    __yakin(yv, 150);
    const ctx = game.ctx, gid = ctx.getImageData.bind(ctx), W = game.W, H = game.H;
    const isi = () => { for (let i = 0; i < 40; i++) { yuvaCanlilariGuncelle(0.016); render(); gid(0, 0, 8, 8); } };
    const olc = () => { const a = []; for (let r = 0; r < 7; r++) { const t0 = performance.now(); for (let i = 0; i < 120; i++) { yuvaCanlilariGuncelle(0.016); render(); gid(0, 0, W, H); } a.push(performance.now() - t0); } a.sort((x, y) => x - y); return a[3]; };
    isi(); const acik = olc();
    const kopya = game.yuvalar; game.yuvalar = []; YC.durumlar.clear();
    isi(); const kapali = olc();
    game.yuvalar = kopya;
    return { acik, kapali, oran: acik / kapali };
  });
  sina('(p) performans: canlı kaçışı oranı <=1.25', () => assert.ok(perf.oran <= 1.25, JSON.stringify(perf)));

  sina('(q) sayfa hatası yok', () => assert.deepEqual(hatalar, []));
} finally {
  await b.close(); sunucu.close();
}
for (const s of sonuclar) console.log(s);
const basarisiz = sonuclar.filter((s) => s.startsWith('✗')).length;
if (hatalar.length) console.log('Sayfa hataları:', hatalar.join(' | '));
if (basarisiz || hatalar.length) { console.log(`${basarisiz} başarısız, ${hatalar.length} sayfa hatası`); process.exit(1); }
console.log(`Tümü geçti (${sonuclar.length})`);
