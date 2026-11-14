// Hayalet Avcıları: yarasalar ve fırtına bulutu (3.17.0) — çevrimdışı sınama.
// Kullanıcının isteği: "Yarasalar uçuşsun ormanda. Arada şimşek çakan bulutlar gezinsin. Bosun üzerinde."
// Oyun duraklatılır, havaGuncelle elle çağrılır (yalnız görsel; oyunu değiştirmez).
// Çalıştırma: node hayalet-avcilari/test/hava.test.mjs   (Playwright + Chromium; ağ gerekmez)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WWW = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);
const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2', '.m4a': 'audio/mp4' };
const sunucu = http.createServer((q, r) => {
  const f = path.join(WWW, decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html');
  if (!f.startsWith(WWW) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': TUR[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(0);
const adres = `http://127.0.0.1:${sunucu.address().port}/index.html`;
const EKRAN = process.env.HAVA_EKRAN; // verilirse önek: <önek>-orman.png, <önek>-boss.png

const sonuclar = [];
function sina(ad, fn) {
  try { fn(); sonuclar.push(`✓ ${ad}`); } catch (e) { sonuclar.push(`✗ ${ad}: ${e.message.split('\n')[0]}`); }
}
const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const hatalar = [];
async function sayfa(azHareket) {
  const p = await b.newPage({ viewport: { width: 844, height: 390 } });
  if (azHareket) await p.emulateMedia({ reducedMotion: 'reduce' });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('hayaletAvcilariDil', 'tr'); localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9'); });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof havaGuncelle === 'function' && typeof startGame === 'function');
  await p.evaluate(() => {
    window.__bolum = (n) => {
      startGame(); game.paused = true; game.ghosts = []; game.spawnTimer = -1e9; game.player.invuln = 1e9;
      while (game.level < n) nextLevel();
      game.paused = true; game.ghosts = []; havaKur();
    };
    // Yalnız hava ilerler; sayaçlar: yarasa, bulut, şimşek sayısı
    window.__ilerle = (sn) => {
      const s = { yarasaEnCok: 0, bulutVar: 0, simsek: 0 };
      let onceki = 0;
      for (let t = 0; t < sn; t += 1 / 30) {
        havaGuncelle(1 / 30);
        const h = game.hava;
        s.yarasaEnCok = Math.max(s.yarasaEnCok, h.yarasalar.length);
        if (h.bulut) s.bulutVar++;
        if (h.simsekler.length > onceki) s.simsek++;
        onceki = h.simsekler.length;
      }
      return s;
    };
  });
  return p;
}
try {
  const p = await sayfa(false);
  const tema = await p.evaluate(() => {
    const r = {};
    __bolum(2); r.ormanAdi = getTheme().name; r.orman = __ilerle(30); r.ormanSonu = game.hava.yarasalar.length;
    __bolum(1); r.sato = __ilerle(30);
    __bolum(6); r.uzayAdi = getTheme().name;
    spawnBoss(); r.uzay = __ilerle(20);
    return r;
  });
  sina('Yeşil Orman\'da yarasa sürüleri uçar; ekrandan çıkan silinir', () => {
    assert.equal(tema.ormanAdi, 'Yeşil Orman'); assert.ok(tema.orman.yarasaEnCok >= 5, String(tema.orman.yarasaEnCok));
    assert.ok(tema.ormanSonu <= 9, String(tema.ormanSonu));
  });
  sina('Mor Şato\'da yarasa yok, gezgin fırtına bulutu ve şimşek var', () => {
    assert.equal(tema.sato.yarasaEnCok, 0); assert.ok(tema.sato.bulutVar > 0); assert.ok(tema.sato.simsek >= 1);
  });
  sina('Uzay\'da bulut yok (boss gelse de)', () => { assert.equal(tema.uzayAdi, 'Uzay'); assert.equal(tema.uzay.bulutVar, 0); });

  const boss = await p.evaluate(() => {
    const r = {};
    __bolum(1);
    spawnBoss(); const g = game.ghosts.find((x) => x.isBoss);
    havaGuncelle(1 / 30); r.hemen = !!game.hava.bulut;
    __ilerle(4);
    const bl = game.hava.bulut;
    r.ustunde = { dx: Math.abs(bl.x - g.x), dy: g.y - bl.y, beklenen: (g.r || 40) + HAVA.bossUst };
    // Boss hareket edince bulut izler
    g.x += 300; __ilerle(4);
    r.izledi = Math.abs(game.hava.bulut.x - g.x) < 20;
    // Şimşek boss'un çevresine düşer
    const s = __ilerle(8);
    r.simsek = s.simsek;
    let yakin = 0, say = 0;
    for (let i = 0; i < 6; i++) { simsekCak(game.hava.bulut, g); const son = game.hava.simsekler[game.hava.simsekler.length - 1].noktalar.slice(-1)[0];
      say++; if (Math.hypot(son[0] - g.x, son[1] - g.y) < 90) yakin++; }
    r.yakin = yakin === say;
    // Boss yenilince bulut çekip gider
    game.ghosts = []; __ilerle(30);
    r.gitti = !game.hava.bulut || !game.hava.bulut.boss;
    // Hiçbir oyun durumu değişmez
    r.can = game.player.hp === game.player.maxHp;
    return r;
  });
  sina('boss gelince bulut hemen çıkar, boss\'un tepesine yerleşir', () => {
    assert.equal(boss.hemen, true); assert.ok(boss.ustunde.dx < 15, JSON.stringify(boss.ustunde));
    assert.ok(Math.abs(boss.ustunde.dy - boss.ustunde.beklenen) < 15, JSON.stringify(boss.ustunde));
  });
  sina('bulut boss\'u izler ve sık şimşek çakar (8 sn\'de en az 2)', () => { assert.equal(boss.izledi, true); assert.ok(boss.simsek >= 2, String(boss.simsek)); });
  sina('şimşek boss\'un çevresine iner', () => { assert.equal(boss.yakin, true); });
  sina('boss yenilince bulut çekip gider; oyuncuya zarar yok', () => { assert.equal(boss.gitti, true); assert.equal(boss.can, true); });

  const ciz = await p.evaluate(async () => {
    let hata = null;
    __bolum(2); game.paused = false;
    try {
      game.camera.x = Math.max(0, game.player.x - game.W / 2); game.camera.y = Math.max(0, game.player.y - game.H / 2);
      yarasaSurusu(); for (const y of game.hava.yarasalar) y.x = game.camera.x + 200 + Math.random() * 400;
      spawnBoss(); const g = game.ghosts.find((x) => x.isBoss); g.x = game.player.x + 150; g.y = game.player.y + 40; g.speed = 0;
      for (let i = 0; i < 120; i++) havaGuncelle(1 / 30);
      simsekCak(game.hava.bulut, g);
      game.paused = true;
      render();
    } catch (e) { hata = e.message; }
    return { hata, parlama: game.hava.parlama };
  });
  if (EKRAN) await p.screenshot({ path: `${EKRAN}-boss.png` });
  sina('yarasa, bulut ve şimşek hatasız çizilir; şimşekte hafif parlama', () => { assert.equal(ciz.hata, null); assert.ok(ciz.parlama > 0 && ciz.parlama <= 0.2); });

  const az = await sayfa(true);
  const azR = await az.evaluate(() => { __bolum(1); spawnBoss(); havaGuncelle(1 / 30); simsekCak(game.hava.bulut, game.ghosts[0]); return game.hava.parlama; });
  sina('"Hareketi azalt" tercihinde ekran parlaması yok', () => { assert.equal(azR, 0); });
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
