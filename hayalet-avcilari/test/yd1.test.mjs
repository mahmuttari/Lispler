// Hayalet Avcıları YD1: kıvrılan geçit nehirleri — çevrimdışı sınama.
// Nehir merkez çizgisi sinüslerle kıvrılır; köprü çevresinde düz kalır; çarpışma 16 px dilimlerle yürür.
// Çalıştırma: node test/yd1.test.mjs   (Playwright + Chromium; ağ ve Firebase gerekmez)
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
    window.__merkez = (z, y) => {
      const egri = yolculukGecitEgri(z, game.level, yolculukUlkeKodu());
      return egri.merkez + egri.offset(y);
    };
  });

  // a) Nehir düz değil: her geçitte 10 örnek y'de merkez çizgi en az 60 px salınır (bölüm 1..6)
  const kirik = await p.evaluate(() => {
    const kotu = [];
    const ys = Array.from({ length: 10 }, (_, q) => 40 + q * ((1000 - 80) / 9));
    for (let L = 1; L <= 6; L++) {
      __kur(L);
      for (const z of game._yolculukDuzen.zones) {
        const xs = ys.map((y) => __merkez(z, y));
        const span = Math.max(...xs) - Math.min(...xs);
        if (span < 60) kotu.push(`L${L}:g${z.i} ${span.toFixed(1)}`);
      }
    }
    return kotu;
  });
  sina('her geçitte merkez çizgi 10 örnekte en az 60 px kıvrılır', () => { assert.deepEqual(kirik, []); });

  // b) Köprüde nehir tam [gate.x0, gate.x1]; açık köprü yürünür, kapalı geçilemez
  const kopru = await p.evaluate(() => {
    __kur(2);
    const d = game._yolculukDuzen, g = d.zones[0].gate;
    const kapaliNokta = (x) => collidesWaters(x, g.cy, 1);
    const kaplama = { x0: kapaliNokta(g.x0 + 1), x1: kapaliNokta(g.x1 - 1), sol: kapaliNokta(g.x0 - 3), sag: kapaliNokta(g.x1 + 3), cy: g.cy };
    game.kopruAcik.fill(false);
    const yuruyus = (sn) => { for (let z2 = 0; z2 < sn; z2 += 1 / 60) update(1 / 60, performance.now()); };
    game.player.x = g.x0 - 70; game.player.y = g.cy; game.player.speed = 320;
    game.inputDir.x = 1; game.inputDir.y = 0;
    yuruyus(1.2);
    const kapaliX = game.player.x;
    yolculukKopruAc(0);
    yuruyus(2);
    game.inputDir.x = 0;
    return { kaplama, kapaliX, sonX: game.player.x, x1: g.x1 };
  });
  sina('köprüde nehir tam [gate.x0, gate.x1] (dışı su değil)', () => {
    assert.equal(kopru.kaplama.x0, true); assert.equal(kopru.kaplama.x1, true);
    assert.equal(kopru.kaplama.sol, false); assert.equal(kopru.kaplama.sag, false);
  });
  sina('açık köprüden yürüyerek geçilir; kapalıyken geçilemez', () => {
    assert.ok(kopru.kapaliX < kopru.x1, String(kopru.kapaliX));
    assert.ok(kopru.sonX > kopru.x1 + 20, String(kopru.sonX));
  });

  // c) Merkez çizgide su var; iki yanda 70 px dışarıda yok (bölüm 1..6, her geçit)
  const carpisma = await p.evaluate(() => {
    const kotu = [];
    const ys = [70, 230, 390, 610, 850];
    for (let L = 1; L <= 6; L++) {
      __kur(L);
      for (const z of game._yolculukDuzen.zones) {
        for (const y of ys) {
          const c = __merkez(z, y);
          if (!collidesWaters(c, y, 1)) kotu.push(`L${L}:g${z.i}@${y} merkez`);
          if (collidesWaters(c - 115, y, 1)) kotu.push(`L${L}:g${z.i}@${y} sol70`);
          if (collidesWaters(c + 115, y, 1)) kotu.push(`L${L}:g${z.i}@${y} sag70`);
        }
      }
    }
    return kotu;
  });
  sina('kıvrım merkezinde su var, bankın 70 px dışında yok', () => { assert.deepEqual(carpisma, []); });

  // d) Yol garantisi: bölüm 1..6 + 3 Dünya Turu ülkesi (açık yol var, kapalı köprü geçilmez)
  const yol = await p.evaluate(() => {
    const kotu = [];
    const denetle = (etiket) => {
      const d = game._yolculukDuzen;
      const b = yolculukBaslangic(), a = { x: d.arena.x0 + 200, y: 500 };
      game.kopruAcik.fill(true);
      if (!yolculukYolVarMi(b.x, b.y, a.x, a.y)) kotu.push(`${etiket}: açık`);
      for (let i = 0; i < 6; i++) {
        game.kopruAcik.fill(true); game.kopruAcik[i] = false;
        const hedef = { x: d.zones[i].gate.x1 + 80, y: d.zones[i].gate.cy };
        if (yolculukYolVarMi(b.x, b.y, hedef.x, hedef.y)) kotu.push(`${etiket}: kapalı${i}`);
      }
    };
    for (let L = 1; L <= 6; L++) { __kur(L); denetle(`L${L}`); }
    for (const kod of ['TR', 'JP', 'KE']) { __kur(ulkeKodla(kod).sira, kod); denetle(kod); }
    return kotu;
  });
  sina('yürünebilir yol garantisi bölüm 1..6 ve 3 ülkede korunur', () => { assert.deepEqual(yol, []); });

  // e) Çizim hatasız: kamera geçitte, su ekranda zeminden farklı
  const cizim = await p.evaluate(() => {
    __kur(3);
    const z = game._yolculukDuzen.zones[0], g = z.gate;
    game.kopruAcik.fill(true); game._kopruAnim = {};
    game.ghosts = []; game.pickups = []; game.effects = [];
    game.player.x = g.x0 + 45; game.player.y = g.cy;
    game.camera.x = Math.max(0, g.x0 - 120); game.camera.y = Math.max(0, Math.min(game.worldH - game.H, g.cy - game.H / 2));
    render();
    const m = game.ctx.getTransform();
    const piksel = (wx, wy) => {
      const sx = Math.round((wx - game.camera.x) * m.a + m.e), sy = Math.round((wy - game.camera.y) * m.d + m.f);
      const d = game.ctx.getImageData(sx, sy, 1, 1).data;
      return `${d[0]},${d[1]},${d[2]}`;
    };
    return { su: piksel(g.x0 + 45, g.cy), zemin: piksel(g.x1 + 140, g.cy), yol: !!z._gecitYol };
  });
  sina('yolculukGecitCiz kıvrık nehri hatasız çizer (yol önbelleği + su zeminden farklı)', () => {
    assert.equal(cizim.yol, true);
    assert.notEqual(cizim.su, cizim.zemin);
  });

  // f) Şelale (YD2 seviye düşmesi): her geçitte 2-3 tane, köprüden ve birbirinden ≥200 px
  const selale = await p.evaluate(() => {
    const kotu = [];
    for (let L = 1; L <= 6; L++) {
      __kur(L);
      for (const z of game._yolculukDuzen.zones) {
        const dd = z._gecitDusmeler || [];
        if (dd.length < 2 || dd.length > 3) kotu.push(`L${L}:g${z.i} adet=${dd.length}`);
        for (const a of dd) {
          if (Math.abs(a.y - z.gate.cy) < 200) kotu.push(`L${L}:g${z.i} köprü ${a.y.toFixed(1)}`);
          for (const b of dd) if (a !== b && Math.abs(a.y - b.y) < 200) kotu.push(`L${L}:g${z.i} aralık`);
          if (a.y < 90 || a.y > 910) kotu.push(`L${L}:g${z.i} sınır ${a.y.toFixed(1)}`);
        }
      }
    }
    return kotu;
  });
  sina('her geçitte 2-3 şelale; köprüden ve birbirinden ≥200 px uzak', () => { assert.deepEqual(selale, []); });

  // g) Aynı bölümde düşme konumları deterministik (iki kurulum aynı)
  const kararli = await p.evaluate(() => {
    const al = () => { __kur(4); return game._yolculukDuzen.zones.map((z) => (z._gecitDusmeler || []).map((d) => d.y)); };
    const a = al(), c = al();
    return JSON.stringify(a) === JSON.stringify(c);
  });
  sina('şelale konumları aynı bölümde iki kurulumda aynı', () => { assert.equal(kararli, true); });

  // h) Hareketi azalt açık/kapalı hatasız çizer; şelale + kanal derinliği görüntüsü
  const selaleVar = await p.evaluate(() => {
    __kur(3);
    const z = game._yolculukDuzen.zones[0], d = (z._gecitDusmeler || [])[0];
    if (!d) return false;
    game.ghosts = []; game.pickups = []; game.effects = [];
    game.player.x = d.x; game.player.y = d.y;
    game.camera.x = Math.max(0, d.x - game.W / 2);
    game.camera.y = Math.max(0, Math.min(game.worldH - game.H, d.y - game.H / 2));
    render();
    return true;
  });
  sina('şelale görüntüsü için düşme bulundu', () => { assert.equal(selaleVar, true); });
  await p.emulateMedia({ reducedMotion: 'reduce' });
  await p.evaluate(() => { render(); });
  sina('yolculukGecitCiz "Hareketi azalt" ile de hatasız çizer', () => { assert.deepEqual(hatalar, []); });
  await p.emulateMedia({ reducedMotion: 'no-preference' });
  const cikti = path.join(path.dirname(fileURLToPath(import.meta.url)), 'ciktilar');
  fs.mkdirSync(cikti, { recursive: true });
  await p.evaluate(() => { render(); });
  await p.screenshot({ path: path.join(cikti, 'yd2.png') });
  sina('test/ciktilar/yd2.png kaydedildi', () => { assert.ok(fs.statSync(path.join(cikti, 'yd2.png')).size > 5000); });

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
