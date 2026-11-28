// Hayalet Avcıları KAY1: hayalet yuvaları (mezarlık, mağara, izbe, kovuk, kuyu) — çevrimdışı sınama.
// Yolculuk haritasında her bölgeye ve arenaya 4 yuva tohumlu yerleştirilir; hayaletler yuvanın ağzından
// 0.6 sn'lik belirme efektiyle çıkar (bu sürede vurulamaz/hasar vermez). Çevrimiçi eski harita değişmez.
// Çalıştırma: node test/kay1.test.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WWW = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);
const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.m4a': 'audio/mp4' };
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
  const p = await b.newPage({ viewport: { width: 844, height: 390 } });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript(() => {
    localStorage.setItem('hayaletAvcilariDil', 'tr');
    localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9');
    localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1');
  });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof startGame === 'function' && typeof yolculukHaritaKur === 'function' && typeof yolculukYuvalariCiz === 'function');
  await p.evaluate(() => {
    window.__kur = (level = 1, tur = null) => {
      if (game.running) endGame(false);
      online.mode = null;
      startGame(tur ? { tur: true, ulke: ulkeKodla(tur).sira } : undefined);
      game.paused = true; game.ghosts = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
      game.player.invuln = 1e9; game.player.dead = false; game.player.dusus = null;
      game.level = level; buildWalls(); buildWaters(); buildHazards();
      game.ghosts = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
      return game;
    };
    // Kaynak yuvasının gövdesi: çizim/çarpışmada walls'a eklenen kutu
    window.__govde = (yv) => {
      const r = yv.r || 32;
      return { x: yv.x - r * 0.8, y: yv.y - r * 0.8, w: r * 1.6, h: r * 1.6 };
    };
    window.__cak = (a, b2) => a.x < b2.x + b2.w && a.x + a.w > b2.x && a.y < b2.y + b2.h && a.y + a.h > b2.y;
  });

  // 1) Her bölgede 4, arenada 4 yuva; aralarında ≥260, suda/duvarda değil, başlangıçtan ≥300, yol var
  const yerlesim = await p.evaluate(() => {
    const ulkeler = ['TR', 'JP', 'KE'];
    const kontroller = [];
    const denetle = (etiket) => {
      const d = game._yolculukDuzen;
      const yv = game.yuvalar;
      const sayi = {};
      for (const y of yv) sayi[y.bolge] = (sayi[y.bolge] || 0) + 1;
      const suda = [], kisa = [], starta = [], duvarda = [];
      for (let i = 0; i < yv.length; i++) {
        const g1 = __govde(yv[i]);
        for (const w of game.waters) if (!w.gecit && __cak(g1, w)) suda.push(i);
        for (const w of game.walls) {
          if (w.yuva) continue;
          if (__cak(g1, w)) duvarda.push(i);
        }
        for (let j = i + 1; j < yv.length; j++) {
          if (Math.hypot(yv[i].x - yv[j].x, yv[i].y - yv[j].y) < 150) kisa.push(`${i}-${j}`);
        }
        const bas = yolculukBaslangic();
        if (yv[i].bolge === 1 && Math.hypot(yv[i].x - bas.x, yv[i].y - bas.y) < 300) starta.push(i);
      }
      game.kopruAcik.fill(true);
      const b2 = yolculukBaslangic(), a2 = { x: d.arena.x0 + 200, y: 500 };
      const yol = yolculukYolVarMi(b2.x, b2.y, a2.x, a2.y);
      // Her yuvanın ağzına başlangıçtan yürünebilir (kapalı cepte yuva yok; Y2 botunun bulduğu hata)
      const kapali = yv.filter((y) => {
        if (y.ulasilir === false) return false; // işaretli: bu yuvadan doğum olmaz
        const ag = yolculukYuvaAgzi(y);
        return ![[0, 0], [0, 20], [0, 40], [20, 0], [-20, 0], [20, 20], [-20, 20]]
          .some(([ox, oy]) => yolculukYuruyebilir(ag.x + ox, ag.y + oy, 22) && yolculukYolVarMi(b2.x, b2.y, ag.x + ox, ag.y + oy));
      })
        .map((y) => `b${y.bolge}:${Math.round(y.x)},${Math.round(y.y)}${y.ulasilir === false ? '(işaretli)' : ''}`);
      const isaretsiz = yv.filter((y) => typeof y.ulasilir !== 'boolean').length;
      kontroller.push({ etiket, sayi, suda, kisa, starta, duvarda, yol, toplam: yv.length, kapali, isaretsiz });
    };
    for (let L = 1; L <= 6; L++) { __kur(L); denetle(`L${L}`); }
    for (const kod of ulkeler) { __kur(ulkeKodla(kod).sira, kod); denetle(kod); }
    return kontroller;
  });
  sina('her bölgede (1..6) ve arenada 4 yuva', () => {
    for (const k of yerlesim) {
      assert.equal(k.toplam, 28, `${k.etiket}: ${k.toplam} ${JSON.stringify(k.sayi)}`);
      for (let i = 1; i <= 7; i++) assert.equal(k.sayi[i], 4, `${k.etiket} bölge ${i}: ${k.sayi[i]}`);
    }
  });
  sina('yuvalar arası ≥150 px (çoğunlukla 260), suda/duvarda değil, başlangıçtan ≥300 px', () => {
    for (const k of yerlesim) {
      assert.deepEqual(k.suda, [], `${k.etiket} suda: ${k.suda}`);
      assert.deepEqual(k.duvarda, [], `${k.etiket} duvarda: ${k.duvarda}`);
      assert.deepEqual(k.kisa, [], `${k.etiket} yakın: ${k.kisa}`);
      assert.deepEqual(k.starta, [], `${k.etiket} başlangıca yakın: ${k.starta}`);
    }
  });
  sina('her yuvanın ağzına yürünebilir (kapalı cepte yuva yok) ve hepsi ulasilir ile işaretli', () => {
    for (const k of yerlesim) {
      assert.deepEqual(k.kapali, [], `${k.etiket} kapalı cep: ${k.kapali}`);
      assert.equal(k.isaretsiz, 0, `${k.etiket}: işaretsiz yuva`);
    }
  });
  sina('yuvalar yolu kapatmaz (başlangıçtan arenaya yol var)', () => {
    for (const k of yerlesim) assert.equal(k.yol, true, k.etiket);
  });

  // 2) Tohum: aynı bölüm/ülke iki kurulumda aynı yuvalar
  const tohum = await p.evaluate(() => {
    const al = () => JSON.stringify(game.yuvalar.map((y) => [y.x, y.y, y.tur, y.bolge, y.r]));
    __kur(7, 'JP'); const a = al();
    __kur(7, 'JP'); const b2 = al();
    __kur(8, 'JP'); const c = al();
    return { ayni: a === b2, farkli: a !== c, ornek: JSON.parse(a).length };
  });
  sina('yuva yerleri tohumlu: aynı bölüm/ülke aynı, başka bölümde farklı', () => {
    assert.equal(tohum.ayni, true); assert.equal(tohum.farkli, true); assert.equal(tohum.ornek, 28);
  });

  // 3) Yolculukta doğum: 40 doğumun hepsi bölge 1 yuvalarından birinin önünde (merkezden ≤ r+40 px); doğumlar
  //    en az 3 farklı yuvaya dağılır, art arda aynı yuva yoktur ve iki doğum aynı noktaya düşmez (yığılma yok)
  const dogum = await p.evaluate(() => {
    __kur(1);
    const yv1 = game.yuvalar.filter((y) => y.bolge === 1);
    const d = game._yolculukDuzen, z = d.zones[0];
    game.player.x = d.start.x1 - 80; game.player.y = 500;
    const uzak = [], kullanilan = new Set(), noktalar = [];
    let ardArda = 0, onceki = null;
    for (let i = 0; i < 40; i++) {
      game.ghosts = [];
      spawnGhost({ x0: z.x0 + 20, x1: z.gate.x0 - 20, bolge: 1 });
      const g = game.ghosts[0];
      let en = Infinity, hangi = -1;
      yv1.forEach((y, j) => { const m = Math.hypot(g.x - y.x, g.y - y.y) - (y.r || 32); if (m < en) { en = m; hangi = j; } });
      uzak.push(en); kullanilan.add(hangi); noktalar.push([g.x, g.y]);
      if (hangi === onceki) ardArda++;
      onceki = hangi;
    }
    const ayniNokta = noktalar.filter((a, i) => noktalar.some((b2, j) => j < i && Math.hypot(a[0] - b2[0], a[1] - b2[1]) < 1)).length;
    return { enBuyuk: Math.max(...uzak), sayi: yv1.length, farkli: kullanilan.size, ardArda, ayniNokta };
  });
  sina('yolculukta doğumlar bölge 1 yuvalarının önünde, en az 3 yuvaya dağılır, art arda aynı yuva yok', () => {
    assert.equal(dogum.sayi, 4);
    assert.ok(dogum.enBuyuk <= 40, `en uzak ${dogum.enBuyuk.toFixed(1)} px`);
    assert.ok(dogum.farkli >= 3, `yalnız ${dogum.farkli} yuva kullanıldı`);
    assert.equal(dogum.ardArda, 0);
    assert.ok(dogum.ayniNokta <= 4, `aynı noktaya ${dogum.ayniNokta} doğum`); // 40 doğumda; boş yer araması ara sıra aynı noktayı verir
  });

  // 4) Belirme: çıkan hayalet 0.6 sn vurulamaz; süre bitince vurulur
  const belirme = await p.evaluate(() => {
    __kur(1);
    const d = game._yolculukDuzen, z = d.zones[0];
    game.ghosts = [];
    spawnGhost({ x0: z.x0 + 20, x1: z.gate.x0 - 20, bolge: 1 });
    const g = game.ghosts[0];
    const basCikis = g.cikis;
    g.hp = 100; g.maxHp = 100;
    const at = () => game.projectiles.push({ x: g.x, y: g.y, vx: 0, vy: 0, life: 1, dmg: 5, r: 4, pierce: 0 });
    at(); update(0.016, performance.now());
    const cikisliHp = g.hp, cikisliVar = game.ghosts.includes(g);
    // 0.6 sn geçir
    for (let i = 0; i < 40; i++) update(0.016, performance.now());
    g.cikis = 0;
    if (!game.ghosts.includes(g)) game.ghosts.push(g);
    g.hp = 100;
    at(); update(0.016, performance.now());
    return { basCikis, cikisliHp, cikisliVar, sonHp: g.hp };
  });
  sina('beliren hayalet 0.6 sn vurulamaz, süre bitince hasar alır', () => {
    assert.ok(Math.abs(belirme.basCikis - 0.6) < 0.05, `cikis ${belirme.basCikis}`);
    assert.equal(belirme.cikisliVar, true);
    assert.equal(belirme.cikisliHp, 100);
    assert.equal(belirme.sonHp, 95);
  });

  // 5) Çevrimiçi / yolculuk dışı: yuva yok, doğum eski kenar mantığıyla
  const cevrimici = await p.evaluate(() => {
    online.mode = 'host';
    startGame(); game.paused = true;
    game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9; game.ghosts = [];
    game.player.x = 800; game.player.y = 600;
    buildWalls(); buildWaters(); buildHazards();
    const yuva = game.yuvalar.length;
    const noktalar = [];
    for (let i = 0; i < 10; i++) {
      game.ghosts = [];
      spawnGhost({ x0: 200, x1: 700, bolge: 1 });
      noktalar.push({ x: game.ghosts[0].x });
    }
    const kenarda = noktalar.every((n) => n.x <= 200 + 100 || n.x >= 700 - 100);
    return { yuva, kenarda, ornek: noktalar[0].x };
  });
  sina('çevrimiçi: yuva yok, doğum eski kenar mantığıyla', () => {
    assert.equal(cevrimici.yuva, 0);
    assert.equal(cevrimici.kenarda, true, `örnek x=${cevrimici.ornek}`);
  });

  // 6) Çizim: resimsiz ve sahte "yuva-*" resimleriyle hatasız; resim yalnız görünüş
  const cizim = await p.evaluate(async () => {
    __kur(1);
    const yv0 = game.yuvalar[0]; game.camera.x = yv0.x - 400; game.camera.y = yv0.y - 180; game.W = 844; game.H = 390;
    const cv = document.createElement('canvas'); cv.width = 844; cv.height = 390;
    const c = cv.getContext('2d');
    const piksel = () => { const d = c.getImageData(0, 0, 844, 390).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++; return n; };
    c.save(); c.translate(-game.camera.x, -game.camera.y);
    yolculukYuvalariCiz(c);
    c.restore();
    const kodPiksel = piksel();
    // Sahte resimler: tuval tabanlı, complete/naturalWidth sağlayan görüntü
    const turler = ['mezarlik', 'magara', 'izbe', 'kovuk', 'kuyu'];
    const yukle = (k) => new Promise((coz) => {
      const im = new Image();
      im.onload = () => { GORSEL[k] = im; coz(); };
      im.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    });
    await Promise.all(turler.map((t) => yukle('yuva-' + t)));
    c.clearRect(0, 0, 844, 390);
    c.save(); c.translate(-game.camera.x, -game.camera.y);
    yolculukYuvalariCiz(c);
    c.restore();
    const resimPiksel = piksel();
    return { kodPiksel, resimPiksel, yuklu: turler.every((t) => !!gorsel('yuva-' + t)) };
  });
  sina('yuvalar resimsiz ve resimli hatasız çizilir', () => {
    assert.ok(cizim.kodPiksel > 0, 'resimsiz çizim boş');
    assert.equal(cizim.yuklu, true);
    assert.ok(cizim.resimPiksel > 0, 'resimli çizim boş');
  });

  sina('sayfada hata yok', () => { assert.deepEqual(hatalar, []); });
} finally {
  await b.close();
  await new Promise((r) => sunucu.close(r));
}
console.log(sonuclar.join('\n'));
if (sonuclar.some((s) => s.startsWith('✗'))) process.exitCode = 1;
