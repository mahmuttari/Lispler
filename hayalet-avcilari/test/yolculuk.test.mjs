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

  // 10) Bölge doğumu: yalnız bölge 1 içinde, kota ve eşzamanlılık sınırı
  const dogum = await p.evaluate(() => {
    __kur(1);
    const d = game._yolculukDuzen, z = d.zones[0];
    game.player.x = (z.x0 + z.gate.x0) / 2; game.player.y = game.worldH / 2; game.player.invuln = 1e9;
    game.ghosts = []; game.spawnTimer = 0;
    for (let i = 0; i < 40; i++) { game.spawnTimer = 0; update(1 / 60, 1e6 + i * 16); }
    const disari = game.ghosts.filter((g) => g.x < z.x0 || g.x > z.gate.x0).length;
    const yanlis = game.ghosts.filter((g) => g.bolge !== 1).length;
    const ilk = { sayi: game.ghosts.length, disari, yanlis, kota: game.bolgeKota[1], dogan: game.bolgeDogan[1] };
    // Eşzamanlılık sınırı: kotayı büyüt, var olanları temizle, zorla doğur
    game.bolgeKota[1] = 100; game.bolgeDogan[1] = 0; game.ghosts = [];
    for (let i = 0; i < 80; i++) { game.spawnTimer = 0; update(1 / 60, 2e6 + i * 16); }
    const maxGhosts = Math.min(40, 12 + game.level * 4);
    const cap = { sayi: game.ghosts.length, maxGhosts };
    return { ilk, cap };
  });
  sina('bölge 1 yalnız bölge 1 içinde doğurur; kota ve eşzamanlılık sınırı korunur', () => {
    assert.equal(dogum.ilk.disari, 0); assert.equal(dogum.ilk.yanlis, 0);
    assert.equal(dogum.ilk.dogan, dogum.ilk.kota);
    assert.ok(dogum.cap.sayi <= dogum.cap.maxGhosts, `${dogum.cap.sayi} > ${dogum.cap.maxGhosts}`);
    assert.ok(dogum.cap.sayi > 0);
  });

  // 11) Bölge temizliği: kota dolunca hayaletler ölünce köprü açılır, bölge 2 etkin olur; köprüler kapanmaz
  const temizlik = await p.evaluate(() => {
    __kur(1);
    const d = game._yolculukDuzen;
    game.player.x = (d.zones[0].x0 + d.zones[0].gate.x0) / 2; game.player.y = game.worldH / 2; game.player.invuln = 1e9;
    game.kopruAcik.fill(false);
    game.bolgeKota[1] = 2; game.bolgeDogan[1] = 0; game.ghosts = []; game.spawnTimer = 0;
    for (let i = 0; i < 8 && game.bolgeDogan[1] < 2; i++) { game.spawnTimer = 0; update(1 / 60, 1e6 + i * 16); }
    const dogdu = game.bolgeDogan[1];
    while (game.ghosts.length) killGhost(game.ghosts[0], 0);
    update(1 / 60, 2e6);
    const bir = { dogdu, bolge: game.bolge, kopru1: game.kopruAcik[0], temiz1: game.bolgeTemiz[1] };
    // Bölge 2'yi de temizle: köprü 1 açık kalmalı
    game.player.x = (d.zones[1].x0 + d.zones[1].gate.x0) / 2;
    game.bolgeKota[2] = 1; game.bolgeDogan[2] = 0; game.ghosts = []; game.spawnTimer = 0;
    for (let i = 0; i < 8 && game.bolgeDogan[2] < 1; i++) { game.spawnTimer = 0; update(1 / 60, 3e6 + i * 16); }
    while (game.ghosts.length) killGhost(game.ghosts[0], 0);
    update(1 / 60, 4e6);
    return { bir, iki: { bolge: game.bolge, kopru1: game.kopruAcik[0], kopru2: game.kopruAcik[1], temiz2: game.bolgeTemiz[2] } };
  });
  sina('bölge 1 kotası ölünce köprü 1 açılır, bölge 2 etkin; köprüler açık kalır', () => {
    assert.equal(temizlik.bir.dogdu, 2); assert.equal(temizlik.bir.temiz1, true);
    assert.equal(temizlik.bir.kopru1, true); assert.equal(temizlik.bir.bolge, 2);
    assert.equal(temizlik.iki.temiz2, true); assert.equal(temizlik.iki.kopru1, true);
    assert.equal(temizlik.iki.kopru2, true); assert.equal(temizlik.iki.bolge, 3);
  });

  // 12) Zorluk: aynı bölümde bölge 5 hayaletleri bölge 1'den daha güçlü ve hızlı
  const zorluk = await p.evaluate(() => {
    __kur(1);
    const d = game._yolculukDuzen;
    const topla = (z) => {
      game.ghosts = [];
      for (let i = 0; i < 40; i++) spawnGhost({ x0: d.zones[z - 1].x0 + 60, x1: d.zones[z - 1].gate.x0 - 60, bolge: z });
      const hp = game.ghosts.map((g) => g.hp), hiz = game.ghosts.map((g) => g.speed);
      return { hpMin: Math.min(...hp), hpMax: Math.max(...hp), hizOrt: hiz.reduce((a, b) => a + b, 0) / hiz.length };
    };
    return { bolge1: topla(1), bolge5: topla(5) };
  });
  sina('bölge 5 hayaletleri bölge 1\'den güçlü (can) ve hızlı', () => {
    assert.ok(zorluk.bolge5.hpMin > zorluk.bolge1.hpMax, `${zorluk.bolge5.hpMin} / ${zorluk.bolge1.hpMax}`);
    assert.ok(zorluk.bolge5.hizOrt > zorluk.bolge1.hizOrt, `${zorluk.bolge5.hizOrt} / ${zorluk.bolge1.hizOrt}`);
  });

  // 13) Arena: arenaya girmeden boss yok; girince sağda boss gelir, eşlikçiler doğar; boss ölünce doğum durur
  const arena = await p.evaluate(() => {
    __kur(1);
    const d = game._yolculukDuzen, A = game._yolculukDuzen.arena;
    game.kopruAcik.fill(true);
    for (let z = 1; z <= 6; z++) { game.bolgeTemiz[z] = true; game.bolgeDogan[z] = game.bolgeKota[z]; }
    game.ghosts = []; game.bossDefeated = false; game._bolgeBossGeldi = false; game.bossSpawnTimer = 999;
    game.player.invuln = 1e9; game.player.x = d.zones[5].x0 + 100; game.player.y = game.worldH / 2;
    for (let i = 0; i < 30; i++) update(1 / 60, 1e6 + i * 16);
    const once = { bolge: game.bolge, boss: game.ghosts.some((g) => g.isBoss) };
    game.player.x = A.x0 + 200; game.player.y = game.worldH / 2;
    update(1 / 60, 2e6);
    const boss = game.ghosts.find((g) => g.isBoss);
    if (boss) boss.minionState = null; // boss minionları sınama dışı
    const sonra = { boss: !!boss, sagda: !!boss && boss.x > A.x0 };
    game.spawnTimer = 0;
    for (let i = 0; i < 40; i++) { game.spawnTimer = 0; update(1 / 60, 3e6 + i * 16); }
    const eslik = { sayi: game.ghosts.filter((g) => !g.isBoss).length, cap: Math.floor(Math.min(40, 12 + game.level * 4) / 2) };
    killGhost(boss, game.ghosts.indexOf(boss));
    const olu = game.ghosts.length;
    for (let i = 0; i < 40; i++) { game.spawnTimer = 0; update(1 / 60, 4e6 + i * 16); }
    const durdu = { once: olu, sonra: game.ghosts.length };
    return { once, sonra, eslik, durdu };
  });
  sina('arenaya girmeden boss yok; girince sağda boss ve eşlikçiler; boss ölünce doğum durur', () => {
    assert.equal(arena.once.boss, false); assert.equal(arena.once.bolge, 7);
    assert.equal(arena.sonra.boss, true); assert.equal(arena.sonra.sagda, true);
    assert.ok(arena.eslik.sayi > 0, String(arena.eslik.sayi)); assert.ok(arena.eslik.sayi <= arena.eslik.cap);
    assert.equal(arena.durdu.sonra, arena.durdu.once);
    assert.ok(arena.eslik.sayi > 0);
  });

  // 14) Bölüm bitişi + sonraki bölüm (normal oyun)
  const bitis = await p.evaluate(() => {
    __kur(1);
    game.bossDefeated = true; game.ghosts = []; game.levelTransitioning = false; game.paused = true;
    update(1 / 60, 1e6);
    const gecti = game.levelTransitioning;
    game.player.x = game.worldW - 300; game.player.y = game.worldH / 2; // önceki bölümün arenasında
    nextLevel();
    const bas = yolculukBaslangic();
    return { gecti, level: game.level, bolge: game.bolge, kopruler: game.kopruAcik.slice(), kotaVar: !!game.bolgeKota[1],
      basta: Math.hypot(game.player.x - bas.x, game.player.y - bas.y) < 120, hangi: hangiBolge(game.player.x) };
  });
  sina('bölüm tamamlanınca geçiş kurulur; nextLevel yeni haritayı kurar', () => {
    assert.equal(bitis.gecti, true); assert.equal(bitis.level, 2); assert.equal(bitis.bolge, 1);
    assert.ok(bitis.kopruler.every((k) => k === false)); assert.equal(bitis.kotaVar, true);
  });
  sina('yeni bölüm haritanın başında başlar (oyuncu önceki arenada, kapalı köprülerin ardında kalmaz)', () => {
    assert.equal(bitis.basta, true, `hangiBolge=${bitis.hangi}`);
  });

  // 15) HUD: yolculuk çubuğu görünür, nokta sağa gider, eski "Boss: Ns" gizli
  const hud = await p.evaluate(() => {
    __kur(1);
    game.player.x = 250; updateHUD();
    const bar = document.getElementById('yolculuk-hud');
    const ilk = { gorunur: bar.style.display, boss: document.getElementById('boss-status').style.display,
      nokta: parseFloat(document.getElementById('yc-nokta').style.left), kalan: document.getElementById('yc-kalan').textContent,
      vurgu: document.getElementById('yc-bolge').style.display };
    game.player.x = game.worldW - 200; updateHUD();
    const son = parseFloat(document.getElementById('yc-nokta').style.left);
    return { ilk, son };
  });
  sina('yolculuk çubuğu görünür, oyuncu noktası sağa gider, "Boss" yazısı gizli', () => {
    assert.equal(hud.ilk.gorunur, 'flex'); assert.equal(hud.ilk.boss, 'none');
    assert.match(hud.ilk.kalan, /👻 \d+/); assert.equal(hud.ilk.vurgu, 'block');
    assert.ok(hud.son > hud.ilk.nokta, `${hud.son} / ${hud.ilk.nokta}`);
  });

  // 16) Çevrimiçi değişmedi: eski harita ve 60 sn boss
  const cevrimici = await p.evaluate(() => {
    __kur(1);
    online.mode = 'host'; startGame(); game.paused = true; game.spawnTimer = 1e9;
    game.bossSpawnTimer = 0.005; game.bossDefeated = false; game.ghosts = [];
    updateHUD();
    const r = { w: game.worldW, h: game.worldH, bar: document.getElementById('yolculuk-hud').style.display,
      boss: document.getElementById('boss-status').style.display, timer: game.bossSpawnTimer };
    update(1 / 60, 1e6);
    r.bossGeldi = game.ghosts.some((g) => g.isBoss);
    online.mode = null; endGame(false);
    return r;
  });
  sina('çevrimiçi eski harita ve eski boss zamanlayıcısıyla oynanır', () => {
    assert.deepEqual([cevrimici.w, cevrimici.h], [1600, 1200]);
    assert.equal(cevrimici.bar, 'none'); assert.notEqual(cevrimici.boss, 'none');
    assert.ok(cevrimici.timer > 0); assert.equal(cevrimici.bossGeldi, true);
  });

  // 17) Geçit nehri: düz tek renk değil; tema suyu, zeminle karışmıyor
  const gecit = await p.evaluate(() => {
    __kur(2);
    const z = game._yolculukDuzen.zones[0], g = z.gate;
    game.kopruAcik.fill(true); game._kopruAnim = {};
    game.ghosts = []; game.pickups = []; game.effects = [];
    const camX = g.x0 - 100;
    const camY = Math.max(0, Math.min(game.worldH - game.H, g.cy - game.H / 2));
    game.player.x = g.x0 + 45; game.player.y = g.cy;
    game.camera.x = camX; game.camera.y = camY;
    render();
    const m = game.ctx.getTransform();
    const piksel = (wx, wy) => {
      const sx = Math.round((wx - game.camera.x) * m.a + m.e), sy = Math.round((wy - game.camera.y) * m.d + m.f);
      const d = game.ctx.getImageData(sx, sy, 1, 1).data;
      return `${d[0]},${d[1]},${d[2]}`;
    };
    const renkler = new Set();
    for (let y = g.cy + 75; y <= g.cy + 155; y += 4) renkler.add(piksel(g.x0 + 45, y));
    return { sayi: renkler.size, su: piksel(g.x0 + 45, g.cy + 100), zemin: piksel(g.x1 + 110, g.cy + 100) };
  });
  sina('geçit şeridi tek düz renk değil (dikey çizgide en az 3 renk) ve zeminden farklı', () => {
    assert.ok(gecit.sayi >= 3, `${gecit.sayi} renk`);
    assert.notEqual(gecit.su, gecit.zemin);
  });

  // 18) Kapalı köprünün ağzında parlayan engel var; açılınca kalkıyor
  const kopruEngel = await p.evaluate(() => {
    __kur(1);
    const z = game._yolculukDuzen.zones[0], g = z.gate;
    game.kopruAcik.fill(false); game._kopruAnim = {};
    game.ghosts = []; game.pickups = []; game.effects = [];
    game.player.x = g.x0 - 60; game.player.y = g.cy;
    game.camera.x = g.x0 - 100; game.camera.y = Math.max(0, Math.min(game.worldH - game.H, g.cy - game.H / 2));
    const toplam = () => {
      render();
      const m = game.ctx.getTransform();
      let s = 0;
      for (let y = g.bridgeY0 + 8; y <= g.bridgeY1 - 8; y += 8) {
        const sx = Math.round((g.x0 + 2 - game.camera.x) * m.a + m.e), sy = Math.round((y - game.camera.y) * m.d + m.f);
        const d = game.ctx.getImageData(sx, sy, 1, 1).data;
        s += d[0] + d[1] + d[2];
      }
      return s;
    };
    const once = toplam();
    yolculukKopruAc(0);
    const sonra = toplam();
    return { once, sonra };
  });
  sina('kapalı köprü ağzında engel çizilir; açılınca kalkar', () => {
    assert.notEqual(kopruEngel.once, kopruEngel.sonra);
  });

  // 19) Yolculuk çubuğu duraklat düğmesiyle çakışmaz (yatay, dikey, dar)
  const hudKutular = [];
  for (const [w, h] of [[844, 390], [390, 844], [340, 700]]) {
    await p.setViewportSize({ width: w, height: h });
    hudKutular.push(await p.evaluate(() => {
      __kur(1); updateHUD();
      const a = document.getElementById('yolculuk-hud').getBoundingClientRect();
      const b = document.querySelector('.pause-btn').getBoundingClientRect();
      const k = document.getElementById('yc-kalan');
      return { w: innerWidth, h: innerHeight,
        kesisim: a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top,
        bar: [Math.round(a.left), Math.round(a.top), Math.round(a.right), Math.round(a.bottom)],
        pause: [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)],
        kalanGorunur: k.offsetWidth > 0 && k.offsetHeight > 0 };
    }));
  }
  await p.setViewportSize({ width: 390, height: 844 });
  sina('yolculuk çubuğu üç boyutta da duraklat düğmesiyle çakışmaz; 👻 sayacı görünür', () => {
    for (const k of hudKutular) {
      assert.equal(k.kesisim, false, `${k.w}x${k.h}: bar ${k.bar} / pause ${k.pause}`);
      assert.equal(k.kalanGorunur, true, `${k.w}x${k.h}: 👻 sayaç yok`);
    }
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
