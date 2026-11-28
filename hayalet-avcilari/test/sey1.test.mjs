// Hayalet Avcıları: bot ve pet köprü geçişi, yan yana durma (SEY1) — çevrimdışı sınama.
// Bot/pet köprüyü geçer; suya ışınlanmaz; bot ile pet üst üste binmez.
// Çalıştırma: node hayalet-avcilari/test/sey1.test.mjs   (Playwright + Chromium; ağ ve Firebase gerekmez)
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
    localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9'); localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1');
  });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof updateBot === 'function' && typeof update === 'function' && typeof suCizgisiKesiyor === 'function');

  await p.evaluate(() => {
    // Düz zemin, dünyanın ortasında yatay su şeridi ve üstünden geçen tek köprü
    window.__kur = () => {
      startGame(); game.paused = true; game.running = false;
      game.ghosts = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
      game.enemyProjectiles = []; game.projectiles = []; game.pickups = [];
      online.mode = null;
      game.player.hp = 3; game.player.invuln = 1e9; game.player.dead = false; game.player.dusus = null;
      game.bot = null; game.pet = null;
      const W = game.worldW, H = game.worldH;
      game.walls = [];
      game.waters = [{ x: 0, y: H / 2 - 60, w: W, h: 120 }];
      if (typeof engelBicimleriniKur === 'function') engelBicimleriniKur();
      kopruleriKur();
      return { W, H, k: game.kopruler[0] || null };
    };
  });

  const kopru = await p.evaluate(() => {
    const { W, H, k } = __kur();
    if (!k) return { yok: true };
    const orta = k.yatay ? { x: (k.a + k.b) / 2, y: k.c } : { x: k.c, y: (k.a + k.b) / 2 };
    const su = k.yatay ? { x: (k.a + k.b) / 2, y: k.c } : { x: k.c, y: (k.a + k.b) / 2 };
    // Köprünün şeridinin dışında, suyun içinde bir nokta
    const dis = k.yatay ? { x: su.x, y: su.y + KOPRU.serbest + 30 } : { x: su.x + KOPRU.serbest + 30, y: su.y };
    return {
      W, H, k, orta, dis,
      botKoprude: botEngel(orta.x, orta.y, 6), petKoprude: petEngel(orta.x, orta.y, 6),
      botSuda: botEngel(dis.x, dis.y, 6), petSuda: petEngel(dis.x, dis.y, 6),
    };
  });
  sina('köprü var', () => { assert.equal(kopru.yok, undefined); assert.ok(kopru.k); });
  sina('botEngel/petEngel açık köprüde suya takılmaz', () => { assert.equal(kopru.botKoprude, false); assert.equal(kopru.petKoprude, false); });
  sina('botEngel/petEngel açık suda takılır', () => { assert.equal(kopru.botSuda, true); assert.equal(kopru.petSuda, true); });

  const gecis = await p.evaluate(() => {
    const { W, H, k } = __kur();
    if (!k) return { atlandi: true };
    const derin = H / 2;
    const c = k.c; // dikey köprü: x = c
    const xoff = c + 240;
    game.player.x = xoff; game.player.y = derin + 200;
    spawnBot();
    game.bot.x = xoff; game.bot.y = derin - 200;
    let kopruKullanildi = false, suyaGirdi = false;
    const t0 = performance.now();
    for (let z = 0; z < 8; z += 1 / 60) {
      updateBot(1 / 60, t0 + z * 1000);
      if (koprudeMi(game.bot.x, game.bot.y)) kopruKullanildi = true;
      if (collidesWaters(game.bot.x, game.bot.y, game.bot.r) && !koprudeMi(game.bot.x, game.bot.y)) suyaGirdi = true;
    }
    return {
      uzaklik: Math.hypot(game.bot.x - game.player.x, game.bot.y - game.player.y),
      oyuncuTarafi: game.bot.y > derin,
      kopruKullanildi, suyaGirdi,
    };
  });
  sina('bot köprüden geçip oyuncunun yanına varır (8 sn)', () => {
    assert.equal(gecis.atlandi, undefined);
    assert.ok(gecis.uzaklik < 150, `uzaklık ${Math.round(gecis.uzaklik)}`);
    assert.equal(gecis.oyuncuTarafi, true);
  });
  sina('botun yolu köprüden geçer, suya ışınlanmaz', () => {
    assert.equal(gecis.kopruKullanildi, true);
    assert.equal(gecis.suyaGirdi, false);
  });

  const ayirma = await p.evaluate(() => {
    const { W, H } = __kur();
    game.player.x = W / 2; game.player.y = 200;
    save.ownedPets = { kedi: true, kopek: true, kus: true }; save.pet = 'kedi';
    spawnBot(); petKur();
    const t0 = performance.now();
    for (let z = 0; z < 3; z += 1 / 60) {
      game.ghosts = []; game.projectiles = []; game.enemyProjectiles = [];
      update(1 / 60, t0 + z * 1000);
    }
    return { d: Math.hypot(game.bot.x - game.pet.x, game.bot.y - game.pet.y), min: game.bot.r + game.pet.r };
  });
  sina('bot ile yürüyen pet üst üste binmez', () => {
    assert.ok(ayirma.d >= ayirma.min, `${ayirma.d.toFixed(1)} < ${ayirma.min}`);
  });


  // Oyuncu dururken bot ve pet yerinde zıplamaz (takılma sayacı izleme mesafesinde işlemez)
  const zipla = await p.evaluate(() => {
    const { W } = __kur();
    game.player.x = W / 2; game.player.y = 200;
    save.ownedPets = { kedi: true, kopek: true, kus: true }; save.pet = 'kopek';
    spawnBot(); petKur();
    const t0 = performance.now();
    let enBot = 0, enPet = 0, ob = { x: game.bot.x, y: game.bot.y }, op = { x: game.pet.x, y: game.pet.y };
    for (let z = 0; z < 8; z += 1 / 60) {
      game.ghosts = []; game.projectiles = []; game.enemyProjectiles = [];
      update(1 / 60, t0 + z * 1000);
      if (z > 1) {
        enBot = Math.max(enBot, Math.hypot(game.bot.x - ob.x, game.bot.y - ob.y));
        enPet = Math.max(enPet, Math.hypot(game.pet.x - op.x, game.pet.y - op.y));
      }
      ob = { x: game.bot.x, y: game.bot.y }; op = { x: game.pet.x, y: game.pet.y };
    }
    return { enBot, enPet };
  });
  sina('oyuncu dururken bot ve pet 8 sn boyunca ışınlanmaz (kare başı sıçrama < 20 px)', () => {
    assert.ok(zipla.enBot < 20 && zipla.enPet < 20, JSON.stringify(zipla));
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
