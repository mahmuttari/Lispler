// Hayalet Avcıları: çalıda saklanma ve hayaletin doğduğu yer (3.15.0) — çevrimdışı sınama.
// Kullanıcının seçimi: "Çalı" — içindekini hayaletler göremez, içeride ateş yok, en çok 5 sn, sonra 8 sn bekleme.
// Kullanıcının isteği: "Hayaletler üzerimize doğuyor, bir anda can gidiyor": hayalet oyuncudan uzakta doğar.
// Oyun duraklatılır, update() elle çağrılır. Çalıştırma: node hayalet-avcilari/test/cali.test.mjs
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
const EKRAN = process.env.CALI_EKRAN; // verilirse çalıda saklanan oyuncunun ekran görüntüsü bu dosyaya

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
  await p.waitForFunction(() => typeof caliGuncelle === 'function' && typeof startGame === 'function');
  await p.evaluate(() => {
    window.__kur = (bolum) => {
      startGame(); game.paused = true;
      if (bolum) { game.level = bolum; buildWalls(); buildWaters(); buildHazards(); }
      kopruleriKur(); calilariKur(); timsahSifirla();
      game.ghosts = []; game.spawnTimer = 1e9; game.bot = null; game.pet = null;
      game.player.hp = 3; game.player.invuln = 0;
      game._timsahSus = 1e9; game._timsahAra = 1e9;
    };
    window.__adim = (sn) => { for (let z = 0; z < sn; z += 1 / 60) update(1 / 60, (window.__saat = (window.__saat || 1e7) + 1000 / 60)); };
  });

  const kur = await p.evaluate(() => {
    const r = { sayi: [], hatali: [], ayni: true };
    for (let L = 1; L <= 15; L++) {
      __kur(L);
      const once = JSON.stringify(game.calilar.map((c) => [Math.round(c.x), Math.round(c.y)]));
      calilariKur();
      if (JSON.stringify(game.calilar.map((c) => [Math.round(c.x), Math.round(c.y)])) !== once) r.ayni = false;
      r.sayi.push(game.calilar.length);
      for (const c of game.calilar) {
        if (collidesWalls(c.x, c.y, CALI.r) || collidesWaters(c.x, c.y, CALI.r) || collidesLavas(c.x, c.y, CALI.r) || koprudeMi(c.x, c.y)) r.hatali.push(L);
      }
    }
    return r;
  });
  sina('her bölümde çalı var (çoğunda 3), duvar, su, lav ve köprüye değmez', () => {
    assert.ok(kur.sayi.every((n) => n >= 1), kur.sayi.join(',')); assert.ok(kur.sayi.filter((n) => n === 3).length >= 12, kur.sayi.join(','));
    assert.deepEqual(kur.hatali, []);
  });
  sina('aynı bölümde çalılar hep aynı yerde (çevrimiçinde herkeste aynı)', () => { assert.equal(kur.ayni, true); });

  const gizli = await p.evaluate(() => {
    const r = {};
    __kur(3);
    const c = game.calilar[0];
    game.player.x = c.x; game.player.y = c.y;
    // Yakında bir hayalet: oyuncu görünseydi ona koşardı
    spawnGhost(); const g = game.ghosts[0];
    const yer = freeSpot(c.x + 200, c.y, 24); g.x = yer.x; g.y = yer.y; g.speed = 120; g.canShoot = false;
    __adim(0.1);
    r.saklandi = game.player.gizli === true;
    r.yazi = game.particles.some((q) => q.text === '🌿 Saklandın!');
    // Saklıyken ateş edilmez, hayalet değse de can gitmez
    const mermi = game.projectiles.length;
    g.x = c.x + 8; g.y = c.y; game.player.invuln = 0;
    __adim(1);
    r.ates = game.projectiles.length - mermi;
    r.can = game.player.hp;
    // 5 sn dolunca çalı saklamaz, 8 sn bekleme
    __adim(CALI.enCok - 1.2);
    r.sinirdaGizli = game.player.gizli;
    __adim(0.2);
    r.sinirdanSonra = { gizli: game.player.gizli, bekleme: Math.round(game._caliBekleme), yazi: game.particles.some((q) => q.text === '🌿 Çalı seni artık gizlemiyor!') };
    game.ghosts = [];
    __adim(CALI.bekleme - 0.5);
    r.beklemede = game.player.gizli;
    __adim(1);
    r.beklemedenSonra = game.player.gizli;
    // Erken çıkan saklandığı sürenin oranında bekler
    __kur(3); game.player.x = c.x; game.player.y = c.y; __adim(1);
    const disari = freeSpot(c.x + 140, c.y, 22); game.player.x = disari.x; game.player.y = disari.y; __adim(0.05);
    r.erken = Math.round(game._caliBekleme * 10) / 10;
    game.player.x = c.x; game.player.y = c.y; __adim(0.1);
    r.erkenGeriGirdi = game.player.gizli;
    // Ölü (hayalet) oyuncu saklanmaz
    __kur(3); game.player.dead = true; game.player.x = c.x; game.player.y = c.y; __adim(0.1);
    r.olu = game.player.gizli;
    return r;
  });
  sina('çalıya giren saklanır: "🌿 Saklandın!"', () => { assert.equal(gizli.saklandi, true); assert.equal(gizli.yazi, true); });
  sina('saklıyken ateş edilmez, hayalet değse de can gitmez', () => { assert.equal(gizli.ates, 0); assert.equal(gizli.can, 3); });
  sina(`en çok ${5} sn saklanılır, sonra ${8} sn çalılar saklamaz`, () => {
    assert.equal(gizli.sinirdaGizli, true);
    assert.deepEqual(gizli.sinirdanSonra, { gizli: false, bekleme: 8, yazi: true });
    assert.equal(gizli.beklemede, false); assert.equal(gizli.beklemedenSonra, true);
  });
  sina('erken çıkan saklandığı sürenin oranında bekler (1 sn → 1,6 sn)', () => {
    assert.ok(gizli.erken >= 1.5 && gizli.erken <= 1.7, String(gizli.erken)); assert.equal(gizli.erkenGeriGirdi, false);
  });
  sina('hayalet olan oyuncu saklanmaz', () => { assert.equal(gizli.olu, false); });

  // Hayaletler saklananı kovalamaz: hedef listesi boş kalır; çıkınca yine kovalar
  const kovala = await p.evaluate(() => {
    __kur(3);
    const c = game.calilar[0];
    game.player.x = c.x; game.player.y = c.y;
    spawnGhost();
    window.__hedef = [];
    const asil = enYakinHedef;
    enYakinHedef = (g, h) => { window.__hedef.push(h.length); return asil(g, h); };
    __adim(0.5);
    const saklıyken = window.__hedef.filter((n) => n > 0).length;
    const disari = freeSpot(c.x + 160, c.y, 22); game.player.x = disari.x; game.player.y = disari.y;
    window.__hedef = []; __adim(0.3);
    const disarida = window.__hedef.filter((n) => n > 0).length;
    enYakinHedef = asil;
    return { saklıyken, disarida };
  });
  sina('hayaletler çalıdakini kovalamaz, çıkınca kovalar', () => { assert.equal(kovala.saklıyken, 0); assert.ok(kovala.disarida > 0); });

  // Hayalet oyuncunun dibinde doğmaz
  const dogum = await p.evaluate(() => {
    const r = [];
    for (const L of [1, 4, 8, 12]) {
      __kur(L);
      for (let i = 0; i < 60; i++) spawnGhost();
      r.push(Math.round(Math.min(...game.ghosts.map((g) => Math.hypot(g.x - game.player.x, g.y - game.player.y)))));
    }
    return r;
  });
  sina(`yeni hayalet oyuncuya en az ${320} px uzakta doğar (en yakınlar: ${dogum.join(', ')} px)`, () => {
    assert.ok(dogum.every((d) => d >= 320), dogum.join(','));
  });

  // Çizim: çalı, saklanan oyuncunun gözleri ve süre halkası hatasız; ekran görüntüsü
  const ciz = await p.evaluate(() => {
    __kur(3);
    const c = game.calilar[0];
    game.player.x = c.x; game.player.y = c.y; __adim(1.5);
    game.camera.x = c.x - game.W / 2; game.camera.y = c.y - game.H / 2;
    try { render(); return null; } catch (e) { return e.message; }
  });
  if (EKRAN) await p.screenshot({ path: EKRAN });
  sina('çalı ve saklanan oyuncu hatasız çizilir', () => { assert.equal(ciz, null); });
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
