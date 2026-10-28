// Hayalet Avcıları: sallanan ip köprüler (3.15.0) — çevrimdışı sınama.
// Kullanıcının seçimi: "Sallanan ip köprü": gölün üstünden yürüyerek geçilir; ortada oyalanan suya düşer, timsah ısırır.
// Oyun duraklatılır, update() elle çağrılır (gerçek yürüyüş ve çarpışma kodu).
// Çalıştırma: node hayalet-avcilari/test/kopru.test.mjs   (Playwright + Chromium; ağ ve Firebase gerekmez)
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
const EKRAN = process.env.KOPRU_EKRAN; // verilirse köprü ve suya düşüşün ekran görüntüsü bu dosyaya

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
  });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof kopruGuncelle === 'function' && typeof startGame === 'function');

  await p.evaluate(() => {
    // Bölümü kur: köprüsü olan ilk bölüm; oyun duraklatılır, hayalet gelmez
    window.__kur = (bolum) => {
      startGame(); game.paused = true;
      game.level = bolum; buildWalls(); buildWaters(); buildHazards(); kopruleriKur(); timsahSifirla();
      game.ghosts = []; game.spawnTimer = -1e9; game.enemyProjectiles = [];
      game.player.hp = 3; game.player.invuln = 1e9; game.player.dead = false; game.player.dusus = null;
      game._timsahSus = 1e9; game._timsahAra = 1e9;
      return game.kopruler[0];
    };
    window.__uclar = (k) => kopruUclari(k);
    window.__adim = (dx, dy, sn) => {
      game.inputDir.x = dx; game.inputDir.y = dy;
      for (let z = 0; z < sn; z += 1 / 60) { game.ghosts = []; update(1 / 60, performance.now()); }
      game.inputDir.x = 0; game.inputDir.y = 0;
    };
  });

  // Köprüler: çoğu bölümde var, uçları karada, ortası suyun üstünde; aynı bölümde hep aynı
  const kur = await p.evaluate(() => {
    const r = { bolum: 0, kopru: 0, hatali: [], ayni: true, ilk: null };
    for (let L = 1; L <= 20; L++) {
      const k0 = __kur(L);
      const once = JSON.stringify(game.kopruler.map((k) => [k.yatay, k.a, k.b, k.c]));
      kopruleriKur();
      if (JSON.stringify(game.kopruler.map((k) => [k.yatay, k.a, k.b, k.c])) !== once) r.ayni = false;
      if (game.kopruler.length) r.bolum++;
      r.kopru += game.kopruler.length;
      if (k0 && !r.ilk) r.ilk = L;
      for (const k of game.kopruler) {
        for (const u of kopruUclari(k)) {
          if (collidesWaters(u.x, u.y, 0) || collidesWalls(u.x, u.y, 22)) r.hatali.push(['uç', L]);
        }
        const o = k.yatay ? [(k.a + k.b) / 2, k.c] : [k.c, (k.a + k.b) / 2];
        if (!collidesWaters(o[0], o[1], 0)) r.hatali.push(['orta', L]);
      }
    }
    return r;
  });
  sina('20 bölümün en az 16\'sında köprü var', () => { assert.ok(kur.bolum >= 16, `${kur.bolum}/20`); });
  sina('bölüm başına en çok KOPRU.sayi köprü', () => { assert.ok(kur.kopru <= 40); });
  sina('köprü uçları karada (su ve duvar yok), ortası suyun üstünde', () => { assert.deepEqual(kur.hatali, []); });
  sina('aynı bölümde köprüler hep aynı (çevrimiçinde herkeste aynı)', () => { assert.equal(kur.ayni, true); });

  const yuru = await p.evaluate((L) => {
    const r = {};
    const k = __kur(L), [u0, u1] = __uclar(k);
    const yon = k.yatay ? [1, 0] : [0, 1];
    // 1) Bir uçtan ötekine yürüyerek geçilir; yolda suyun üstünden geçer
    game.player.x = u0.x; game.player.y = u0.y;
    let suUstu = false;
    game.inputDir.x = yon[0]; game.inputDir.y = yon[1];
    for (let z = 0; z < 6 && Math.hypot(game.player.x - u1.x, game.player.y - u1.y) > 12; z += 1 / 60) {
      update(1 / 60, performance.now()); game.ghosts = [];
      if (enYakinSu(game.player.x, game.player.y).d < -10) suUstu = true;
    }
    r.vardi = Math.hypot(game.player.x - u1.x, game.player.y - u1.y) < 30;
    r.suUstu = suUstu; r.dusmedi = !game.player.dusus;
    // 2) Şeridin dışından suya girilmez
    __kur(L);
    const yan = KOPRU.serbest + 40;
    game.player.x = u0.x + (k.yatay ? 0 : yan); game.player.y = u0.y + (k.yatay ? yan : 0);
    const basla = { x: game.player.x, y: game.player.y };
    let girdi = false;
    if (!collidesWaters(basla.x, basla.y, game.player.r) && !collidesWalls(basla.x, basla.y, game.player.r)) {
      game.inputDir.x = yon[0]; game.inputDir.y = yon[1];
      for (let z = 0; z < 2; z += 1 / 60) { update(1 / 60, performance.now()); if (collidesWaters(game.player.x, game.player.y, game.player.r - 3) && !koprudeMi(game.player.x, game.player.y)) girdi = true; }
      game.inputDir.x = 0; game.inputDir.y = 0;
      r.yandanDenendi = true;
    }
    r.yandanGirmedi = !girdi;
    return r;
  }, kur.ilk);
  sina('köprüden yürüyerek karşıya geçilir (suyun üstünden)', () => { assert.equal(yuru.vardi, true); assert.equal(yuru.suUstu, true); });
  sina('yürüyen düşmez', () => { assert.equal(yuru.dusmedi, true); });
  sina('köprünün yanından suya girilmez', () => { assert.equal(yuru.yandanDenendi, true); assert.equal(yuru.yandanGirmedi, true); });

  const dus = await p.evaluate((L) => {
    const r = {};
    const k = __kur(L), [u0, u1] = __uclar(k);
    const orta = k.yatay ? { x: (k.a + k.b) / 2, y: k.c } : { x: k.c, y: (k.a + k.b) / 2 };
    game.player.x = orta.x; game.player.y = orta.y; game.player.invuln = 0;
    const yazi = (m) => game.particles.some((q) => q.text === m);
    __adim(0, 0, KOPRU.uyari + 0.1);
    r.uyari = yazi('🌉 Köprü sallanıyor!'); r.uyaridaDustu = !!game.player.dusus;
    __adim(0, 0, KOPRU.dusme - KOPRU.uyari);
    r.dustu = !!game.player.dusus; r.yazi = yazi('💦 Suya düştün!');
    r.timsah = game.timsahlar.filter((tm) => tm.tur === 'saldiri' && Math.hypot(tm.x - orta.x, tm.y - orta.y) < 100).length;
    const once = { x: game.player.x, y: game.player.y };
    __adim(k.yatay ? 1 : 0, k.yatay ? 0 : 1, 1.3);
    r.yuruyemedi = Math.hypot(game.player.x - once.x, game.player.y - once.y) < 1;
    r.isirildi = game.player.hp;
    __adim(0, 0, KOPRU.dususSure - 1.3 + 0.1);
    r.cikti = !game.player.dusus;
    r.ucta = [u0, u1].some((u) => Math.hypot(u.x - game.player.x, u.y - game.player.y) < 2);
    // Ara sıra yürüyen (durup kımıldayan) düşmez
    __kur(L); game.player.x = orta.x; game.player.y = orta.y;
    const ileri = k.yatay ? [1, 0] : [0, 1];
    for (let i = 0; i < 4; i++) { __adim(0, 0, 1.2); __adim(ileri[0] * (i % 2 ? -1 : 1), ileri[1] * (i % 2 ? -1 : 1), 0.5); }
    r.kimildayanDusmedi = !game.player.dusus;
    // Beri (suyun içinden geçer) düşünce çırpınmaz, timsah yine çıkar
    __kur(L); game.player.waterImmune = true; game.player.x = orta.x; game.player.y = orta.y;
    __adim(0, 0, KOPRU.dusme + 0.1);
    r.beri = { dusus: !!game.player.dusus, timsah: game.timsahlar.filter((tm) => tm.tur === 'saldiri').length };
    game.player.waterImmune = false;
    // Köprü ucunda (kıyıda) beklerken kıyı timsahı saldırmaz
    const gercek = Math.random; Math.random = () => 0;
    try { __kur(L); game._timsahAra = 0; game.player.x = u0.x; game.player.y = u0.y; __adim(0, 0, 3); r.uctaTimsah = game.timsahlar.length; }
    finally { Math.random = gercek; }
    return r;
  }, kur.ilk);
  sina('ortada KOPRU.uyari sn duran "🌉 Köprü sallanıyor!" uyarısı alır, henüz düşmez', () => { assert.equal(dus.uyari, true); assert.equal(dus.uyaridaDustu, false); });
  sina('ortada KOPRU.dusme sn duran suya düşer: "💦 Suya düştün!", yanında timsah çıkar', () => {
    assert.equal(dus.dustu, true); assert.equal(dus.yazi, true); assert.equal(dus.timsah, 1);
  });
  sina('suda yürüyemez, timsah ısırır (1 can)', () => { assert.equal(dus.yuruyemedi, true); assert.equal(dus.isirildi, 2); });
  sina('çırpınma bitince en yakın köprü ucuna çıkar', () => { assert.equal(dus.cikti, true); assert.equal(dus.ucta, true); });
  sina('kımıldayan düşmez', () => { assert.equal(dus.kimildayanDusmedi, true); });
  sina('Beri çırpınmaz ama timsah yine çıkar', () => { assert.deepEqual(dus.beri, { dusus: false, timsah: 1 }); });
  sina('köprü ucunda bekleyene kıyı timsahı saldırmaz', () => { assert.equal(dus.uctaTimsah, 0); });

  // Çizim: köprü, sallanma ve suya düşüş hatasız çizilir
  const ciz = await p.evaluate((L) => {
    const k = __kur(L);
    const orta = k.yatay ? { x: (k.a + k.b) / 2, y: k.c } : { x: k.c, y: (k.a + k.b) / 2 };
    game.player.x = orta.x; game.player.y = orta.y; game.player.invuln = 0;
    game.camera.x = orta.x - game.W / 2; game.camera.y = orta.y - game.H / 2;
    let hata = null;
    try { render(); __adim(0, 0, KOPRU.dusme + 0.6); render(); } catch (e) { hata = e.message; }
    return hata;
  }, kur.ilk);
  if (EKRAN) await p.screenshot({ path: EKRAN });
  sina('köprü ve suya düşüş hatasız çizilir', () => { assert.equal(ciz, null); });
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
