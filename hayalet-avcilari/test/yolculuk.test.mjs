// Hayalet Avcıları: yolculuk haritası (Y1a) — çevrimdışı sınama.
// Uzun dünya 7200x1000: başlangıç + 6 bölge + arena, geçitler ve köprüler, tohumlu yerleşim, yol garantisi.
// Çevrimiçi bu adımda eski 1600x1200 haritayı kullanır. Çalıştırma: node test/yolculuk.test.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WWW = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);
const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.m4a': 'audio/mp4' };
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
  await p.waitForFunction(() => typeof startGame === 'function' && typeof yolculukHaritaKur === 'function');
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
  });

  // 1) Dünya boyutu: çevrimdışı uzun, çevrimiçi eski
  const boyut = await p.evaluate(() => {
    __kur(1);
    const cevrimdisi = { w: game.worldW, h: game.worldH };
    online.mode = 'host'; buildWalls(); buildWaters(); buildHazards();
    const cevrimici = { w: game.worldW, h: game.worldH };
    online.mode = null; __kur(1);
    return { cevrimdisi, cevrimici };
  });
  sina('dünya çevrimdışı 7200x1000, çevrimiçi 1600x1200', () => {
    assert.deepEqual(boyut.cevrimdisi, { w: 7200, h: 1000 });
    assert.deepEqual(boyut.cevrimici, { w: 1600, h: 1200 });
  });

  // 2) Düzen: başlangıç + 6 bölge + arena, geçit ve köprü ölçüleri
  const duzen = await p.evaluate(() => {
    __kur(1);
    const d = yolculukDuzeni();
    return {
      d, bolgeler: [hangiBolge(100), hangiBolge(d.zones[0].x0 + 100), hangiBolge(d.zones[5].x1 - 10), hangiBolge(d.arena.x0 + 10)],
    };
  });
  sina('6 geçit ve arena düzeni doğru (başlangıç 500, arena 6300–7200)', () => {
    const d = duzen.d;
    assert.equal(d.zones.length, 6);
    assert.equal(d.start.x1, 500);
    assert.equal(d.arena.x0, 6300); assert.equal(d.arena.x1, 7200);
    assert.equal(d.zones[5].x1, d.arena.x0);
    for (const z of d.zones) {
      assert.ok(Math.abs((z.gate.x1 - z.gate.x0) - 90) < 1e-6);
      assert.ok(Math.abs((z.gate.bridgeY1 - z.gate.bridgeY0) - 120) < 1e-6);
      assert.equal(z.gate.x1, z.x1);
    }
    assert.deepEqual(duzen.bolgeler, [0, 1, 6, 7]);
  });

  // 3) Yol garantisi ve kapalı köprü: 12 bölüm + 5 ülke
  const yol = await p.evaluate(() => {
    const ulkeler = ['TR', 'FR', 'KE', 'JP', 'BR'];
    const kontroller = [];
    const denetle = (etiket) => {
      const d = game._yolculukDuzen;
      const b = yolculukBaslangic(), a = { x: d.arena.x0 + 200, y: 500 };
      game.kopruAcik.fill(true);
      const acik = yolculukYolVarMi(b.x, b.y, a.x, a.y);
      const kapali = [];
      for (let i = 0; i < 6; i++) {
        game.kopruAcik.fill(true); game.kopruAcik[i] = false;
        const hedef = { x: d.zones[i].gate.x1 + 80, y: d.zones[i].gate.cy };
        if (yolculukYolVarMi(b.x, b.y, hedef.x, hedef.y)) kapali.push(i);
      }
      kontroller.push({ etiket, acik, kapali });
    };
    for (let L = 1; L <= 12; L++) { __kur(L); denetle(`L${L}`); }
    for (const kod of ulkeler) { __kur(ulkeKodla(kod).sira, kod); denetle(kod); }
    return kontroller;
  });
  sina('açık köprülerle başlangıçtan arenaya yol var (12 bölüm + 5 ülke)', () => {
    const kotu = yol.filter((k) => !k.acik).map((k) => k.etiket);
    assert.deepEqual(kotu, []);
  });
  sina('kapalı köprü geçilemez: hiçbir bölgede kapalı köprünün ötesine yol yok', () => {
    const kotu = yol.filter((k) => k.kapali.length).map((k) => `${k.etiket}:${k.kapali}`);
    assert.deepEqual(kotu, []);
  });

  // 4) Tohum: aynı bölüm/ülke iki kurulumda aynı
  const tohum = await p.evaluate(() => {
    const al = () => JSON.stringify([game.walls, game.waters, game.spikes, game.lavas].map((l) => l.map((o) => [o.x, o.y, o.w, o.h, o.tur])));
    __kur(7, 'JP'); const a = al();
    __kur(7, 'JP'); const b2 = al();
    __kur(8, 'JP'); const c = al();
    return { ayni: a === b2, farkli: a !== c };
  });
  sina('aynı bölüm/ülkeden aynı harita; başka bölümde farklı (tohumlu)', () => {
    assert.equal(tohum.ayni, true); assert.equal(tohum.farkli, true);
  });

  // 5) Köprü ağzı boş: hiçbir engel geçit önü/arkası 160 px bandına girmez
  const agiz = await p.evaluate(() => {
    const kotu = [];
    const kontrol = (etiket) => {
      const d = game._yolculukDuzen;
      const engeller = [...game.walls.slice(4), ...game.waters.filter((o) => !o.gecit), ...game.spikes, ...game.lavas];
      for (const z of d.zones) {
        const bantlar = [
          { x0: z.gate.x0 - 160, x1: z.gate.x0 },
          { x0: z.gate.x1, x1: z.gate.x1 + 160 },
        ];
        for (const o of engeller) for (const b2 of bantlar) {
          if (o.x < b2.x1 && o.x + o.w > b2.x0) kotu.push(`${etiket}:g${z.i}`);
        }
      }
    };
    for (let L = 1; L <= 12; L++) { __kur(L); kontrol(`L${L}`); }
    for (const kod of ['TR', 'FR', 'KE', 'JP', 'BR']) { __kur(ulkeKodla(kod).sira, kod); kontrol(kod); }
    return kotu;
  });
  sina('engeller köprü ağzının önünü/arkasını (160 px) kapatmaz', () => { assert.deepEqual(agiz, []); });

  // 6) Oyuncu başlangıçta solda; kamera sağ uca kadar izler
  const bas = await p.evaluate(() => {
    __kur(3);
    const x = game.player.x, y = game.player.y;
    game.player.x = game.worldW - 60; game.player.y = game.worldH / 2;
    game.inputDir.x = 0; game.inputDir.y = 0;
    game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
    update(1 / 60, performance.now());
    return { x, y, camX: game.camera.x, beklenen: Math.max(0, Math.min(game.worldW - game.W, game.worldW - 60 - game.W / 2)) };
  });
  sina('oyuncu başlangıç alanında (solda), kamera sağ uca kadar izliyor', () => {
    assert.ok(bas.x < 500, String(bas.x));
    assert.ok(Math.abs(bas.camX - bas.beklenen) < 1, `${bas.camX} / ${bas.beklenen}`);
  });

  // 7) yolculukKopruAc(0): köprü açılır, oyuncu yürüyerek karşıya geçer
  const kopru = await p.evaluate(() => {
    __kur(2);
    const d = game._yolculukDuzen, g = d.zones[0].gate;
    game.kopruAcik.fill(false);
    const yuruyus = (sn) => { for (let z = 0; z < sn; z += 1 / 60) update(1 / 60, performance.now()); };
    game.player.x = g.x0 - 70; game.player.y = g.cy; game.player.speed = 320;
    game.inputDir.x = 1; game.inputDir.y = 0;
    yuruyus(1.2);
    const kapaliX = game.player.x;
    const acildi = yolculukKopruAc(0);
    const toast = document.getElementById('toast').textContent;
    yuruyus(2);
    game.inputDir.x = 0;
    return { kapaliX, acildi, acik: game.kopruAcik[0], toast, sonX: game.player.x, gate: g };
  });
  sina('kapalıyken köprü geçilemez; yolculukKopruAc(0) açar, "🌉 Köprü açıldı!" ve yürüyerek geçilir', () => {
    assert.ok(kopru.kapaliX < kopru.gate.x1, String(kopru.kapaliX));
    assert.equal(kopru.acildi, true); assert.equal(kopru.acik, true);
    assert.match(kopru.toast, /Köprü açıldı/);
    assert.ok(kopru.sonX > kopru.gate.x1 + 20, String(kopru.sonX));
  });

  // 8) Timsahlar geçit şeridinde doğmaz
  const timsah = await p.evaluate(() => {
    __kur(4);
    const d = game._yolculukDuzen;
    const gecitte = () => game.timsahlar.some((tm) => d.zones.some((z) => tm.x >= z.gate.x0 - 2 && tm.x <= z.gate.x1 + 2));
    let kotu = 0, toplam = 0;
    for (const z of d.zones) {
      game.camera.x = Math.max(0, z.gate.x0 - 200); game.camera.y = 0;
      game.player.x = z.gate.x0 - 100; game.player.y = z.gate.cy;
      timsahSifirla();
      for (let i = 0; i < 30; i++) { timsahSusle(); if (gecitte()) kotu++; }
      toplam += game.timsahlar.length;
    }
    return { kotu };
  });
  sina('timsahlar geçit şeridinde doğmaz', () => { assert.equal(timsah.kotu, 0); });

  // 9) Kare hızı: uzun haritada bölge 3, eski haritadan 1,3 kat kötü değil
  const sure = await p.evaluate(() => {
    const olc = (fn, n = 120) => { const bas = performance.now(); for (let i = 0; i < n; i++) fn(); return performance.now() - bas; };
    const hazir = () => { game.paused = true; game.ghosts = []; game.pickups = []; game.projectiles = []; game.enemyProjectiles = []; game.effects = []; game.bot = null; };
    // Eski harita
    online.mode = 'host'; startGame(); hazir();
    game.player.x = game.worldW / 2; game.player.y = game.worldH / 2;
    game.camera.x = game.player.x - game.W / 2; game.camera.y = game.player.y - game.H / 2;
    for (let i = 0; i < 15; i++) render();
    const eski = Math.min(olc(render), olc(render), olc(render));
    online.mode = null; endGame(false);
    // Uzun harita, bölge 3
    __kur(3);
    const z = game._yolculukDuzen.zones[2];
    game.player.x = (z.x0 + z.gate.x0) / 2; game.player.y = game.worldH / 2;
    game.camera.x = game.player.x - game.W / 2; game.camera.y = game.player.y - game.H / 2;
    for (let i = 0; i < 15; i++) render();
    const yeni = Math.min(olc(render), olc(render), olc(render));
    return { eski, yeni };
  });
  sina('uzun haritada çizim kare süresi eski haritanın 1,3 katını geçmez', () => {
    assert.ok(sure.yeni <= sure.eski * 1.3, `${sure.yeni.toFixed(1)} ms / ${sure.eski.toFixed(1)} ms`);
  });

  sina('sayfa hatası yok', () => { assert.deepEqual(hatalar, []); });
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
