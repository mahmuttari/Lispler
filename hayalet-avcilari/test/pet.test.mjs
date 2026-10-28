// Hayalet Avcıları: petler (3.15.0) — çevrimdışı sınama.
// Kullanıcının isteği: "Saldırabilen pet ekleyelim karakterlerin yanına kedi köpek kuş gibi." Mağazadan alınır, yanına
// alınan pet oyuncuyu izler ve yakındaki hayalete saldırır. Oyun duraklatılır, petGuncelle elle çağrılır.
// Çalıştırma: node hayalet-avcilari/test/pet.test.mjs   (Playwright + Chromium; ağ ve Firebase gerekmez)
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
const EKRAN = process.env.PET_EKRAN; // verilirse önek: <önek>-oyun.png, <önek>-magaza-tr.png, <önek>-magaza-ar.png

const sonuclar = [];
function sina(ad, fn) {
  try { fn(); sonuclar.push(`✓ ${ad}`); } catch (e) { sonuclar.push(`✗ ${ad}: ${e.message.split('\n')[0]}`); }
}

const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const hatalar = [];
async function sayfa(dil, en) {
  const p = await b.newPage({ viewport: { width: en, height: 844 }, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => hatalar.push(`${dil}: ${e.message}`));
  await p.addInitScript((d) => {
    localStorage.setItem('hayaletAvcilariDil', d);
    localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9');
  }, dil);
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof petGuncelle === 'function' && typeof startGame === 'function');
  return p;
}
try {
  const p = await sayfa('tr', 390);

  // Mağaza: al, yanına al, bırak; parası yetmeyen alamaz
  const magaza = await p.evaluate(() => {
    const r = {};
    save.para = 1000; save.ownedPets = {}; save.pet = '';
    openShop(); showShopTab('pets');
    const dugme = (i) => document.querySelectorAll('#shop-content .shop-item button')[i];
    r.kart = document.querySelectorAll('#shop-content .shop-item').length;
    r.sekme = document.querySelectorAll('.tab-btn')[4].classList.contains('active');
    dugme(1).click(); // kedi: 300
    r.kedi = { para: save.para, sahip: !!save.ownedPets.kedi, pet: save.pet, yazi: dugme(1).textContent };
    r.kusKapali = dugme(3).disabled === false; // 700 para ile kuş (900) alınamaz → disabled
    r.kusKapali = dugme(3).disabled;
    dugme(0).click(); // Bırak
    r.birak = save.pet;
    dugme(1).click(); // yeniden yanına al (para gitmez)
    r.yeniden = { pet: save.pet, para: save.para };
    const kayit = JSON.parse(localStorage.getItem(SAVE_KEY));
    r.kalici = kayit.pet === 'kedi' && kayit.ownedPets.kedi === true;
    goToMenu();
    return r;
  });
  sina('mağazada 🐾 Petler sekmesi: petsiz + 3 pet', () => { assert.equal(magaza.sekme, true); assert.equal(magaza.kart, 4); });
  sina('kedi 300 paraya alınır ve yanına alınır', () => {
    assert.deepEqual(magaza.kedi, { para: 700, sahip: true, pet: 'kedi', yazi: '✓ Yanında' });
  });
  sina('parası yetmeyen alamaz', () => { assert.equal(magaza.kusKapali, true); });
  sina('Bırak / Yanına al; para bir kez gider; kayıt kalıcı', () => {
    assert.equal(magaza.birak, ''); assert.deepEqual(magaza.yeniden, { pet: 'kedi', para: 700 }); assert.equal(magaza.kalici, true);
  });

  await p.evaluate(() => {
    window.__kur = (tur) => {
      save.ownedPets = { kedi: true, kopek: true, kus: true }; save.pet = tur;
      startGame(); game.paused = true; game.ghosts = []; game.spawnTimer = -1e9;
      game.bot = null; game.player.invuln = 1e9;
      return game.pet;
    };
    window.__hayalet = (x, y, hp) => {
      spawnGhost(); const g = game.ghosts[game.ghosts.length - 1];
      g.x = x; g.y = y; g.hp = hp; g.maxHp = hp; g.speed = 0; g.canShoot = false;
      return g;
    };
    // Yalnız pet ilerler (oyuncu ve hayaletler yerinde): zaman ms
    window.__pet = (sn) => { for (let z = 0; z < sn; z += 1 / 60) petGuncelle(1 / 60, (window.__saat = (window.__saat || 1e6) + 1000 / 60)); };
    // Gölün kıyısında bir nokta ve gölün içinde bir nokta
    window.__gol = () => {
      for (const o of game.waters) {
        const ic = { x: o.x + o.w / 2, y: o.y + o.h / 2 };
        if (suUzakligi(o, ic.x, ic.y) > -30) continue;
        for (let yon = 0; yon < 16; yon++) {
          const a = (yon / 16) * Math.PI * 2;
          for (let s = 0; s < 400; s += 4) {
            const x = ic.x + Math.cos(a) * s, y = ic.y + Math.sin(a) * s;
            if (suUzakligi(o, x, y) > 60) { if (!collidesWalls(x, y, 30) && !collidesWaters(x, y, 30)) return { ic, kiyi: { x, y } }; break; }
          }
        }
      }
      return null;
    };
  });

  const oyun = await p.evaluate(() => {
    const r = {};
    save.ownedPets = {}; save.pet = 'kedi'; startGame(); r.sahipsiz = game.pet === null;
    r.var = !!__kur('kedi'); r.yakin = Math.hypot(game.pet.x - game.player.x, game.pet.y - game.player.y) < 120;
    __kur(''); r.petsiz = game.pet === null;
    // İzleme: oyuncu uzaklaşınca pet arkasından gelir
    __kur('kopek');
    const yer = freeSpot(game.player.x + 260, game.player.y, 22);
    game.player.x = yer.x; game.player.y = yer.y;
    __pet(3);
    r.izledi = Math.hypot(game.pet.x - game.player.x, game.pet.y - game.player.y) < 110;
    // Çok uzakta kalan yanına ışınlanır
    game.pet.x = game.player.x + 2000; game.pet.y = game.player.y; __pet(0.05);
    r.isinlandi = Math.hypot(game.pet.x - game.player.x, game.pet.y - game.player.y) < 120;
    return r;
  });
  sina('alınmamış pet oyuna gelmez; petsiz oyunda pet yok', () => { assert.equal(oyun.sahipsiz, true); assert.equal(oyun.petsiz, true); });
  sina('yanına alınan pet oyuncunun yanında başlar', () => { assert.equal(oyun.var, true); assert.equal(oyun.yakin, true); });
  sina('oyuncuyu izler; çok geride kalınca yanına ışınlanır', () => { assert.equal(oyun.izledi, true); assert.equal(oyun.isinlandi, true); });

  const saldiri = await p.evaluate(() => {
    const r = {};
    const dene = (tur, sn, uzak = 90) => {
      __kur(tur);
      const yer = freeSpot(game.player.x + uzak, game.player.y, 24);
      const g = __hayalet(yer.x, yer.y, 100);
      __pet(sn);
      return { hasar: 100 - g.hp, dondu: (g.frozenUntil || 0) > performance.now() - 2000 };
    };
    r.kedi = dene('kedi', 3); r.kopek = dene('kopek', 3); r.kus = dene('kus', 3);
    // Tasma: oyuncudan uzaktaki hayaletle uğraşmaz
    __kur('kedi'); const uzak = freeSpot(game.player.x + PET_TASMA + 150, game.player.y, 24);
    const g = __hayalet(uzak.x, uzak.y, 100); __pet(3);
    r.tasma = 100 - g.hp;
    // Öldürür: canı az hayalet yakalanır
    __kur('kopek'); const y2 = freeSpot(game.player.x + 80, game.player.y, 24); __hayalet(y2.x, y2.y, 2);
    const once = game.totalCaught; __pet(2);
    r.oldurdu = game.ghosts.length === 0 && game.totalCaught === once + 1;
    // Su: kuş gölün üstündeki hayalete yetişir, kedi yetişemez
    const gol = __gol(); r.golVar = !!gol;
    if (gol) {
      const suda = (tur) => {
        __kur(tur); game.player.x = gol.kiyi.x; game.player.y = gol.kiyi.y; petKur();
        const h = __hayalet(gol.ic.x, gol.ic.y, 100);
        if (Math.hypot(h.x - game.player.x, h.y - game.player.y) > PET_TASMA) return null;
        __pet(3); return 100 - h.hp;
      };
      r.sudaKus = suda('kus'); r.sudaKedi = suda('kedi');
    }
    // Çevrimiçi istemci: vuruş kurucuya olay olarak gider
    __kur('kedi'); const y3 = freeSpot(game.player.x + 80, game.player.y, 24); const h3 = __hayalet(y3.x, y3.y, 100); h3._idx = 7;
    online.mode = 'client'; online.pendingEvents = [];
    try { __pet(1.5); r.istemci = { olay: online.pendingEvents.filter((e) => e.type === 'hit' && e.gi === 7).length, can: h3.hp }; }
    finally { online.mode = null; online.pendingEvents = []; }
    return r;
  });
  sina('kedi sık pençeler (3 sn\'de en az 4 vuruş)', () => { assert.ok(saldiri.kedi.hasar >= 4, String(saldiri.kedi.hasar)); });
  sina('köpek güçlü ısırır (vuruş 2) ve sersemletir', () => {
    assert.ok(saldiri.kopek.hasar >= 4 && saldiri.kopek.hasar % 2 === 0, String(saldiri.kopek.hasar)); assert.equal(saldiri.kopek.dondu, true);
  });
  sina('kuş gagalar', () => { assert.ok(saldiri.kus.hasar >= 3, String(saldiri.kus.hasar)); });
  sina('oyuncudan uzaktaki hayaletle uğraşmaz', () => { assert.equal(saldiri.tasma, 0); });
  sina('canı biten hayalet yakalanır ve sayılır', () => { assert.equal(saldiri.oldurdu, true); });
  sina('kuş gölün üstündeki hayalete yetişir, kedi yetişemez', () => {
    assert.equal(saldiri.golVar, true);
    assert.notEqual(saldiri.sudaKus, null, 'gölün ortası tasma içinde değil'); assert.ok(saldiri.sudaKus > 0); assert.equal(saldiri.sudaKedi, 0);
  });
  sina('çevrimiçi istemcide vuruş kurucuya olay olarak gider', () => {
    assert.ok(saldiri.istemci.olay >= 2); assert.equal(saldiri.istemci.can, 100);
  });

  // Çizim: üç pet her durumda hatasız; ekran görüntüleri
  const ciz = await p.evaluate(() => {
    let hata = null;
    for (const tur of ['kedi', 'kopek', 'kus']) {
      __kur(tur);
      for (const sal of [0, 1]) { game.pet.saldiri = sal; game.pet.yurume = 0.3; try { render(); } catch (e) { hata = `${tur}: ${e.message}`; } }
    }
    __kur('kopek'); game.pet.x = game.player.x - 50; game.pet.y = game.player.y + 10; render();
    return hata;
  });
  if (EKRAN) await p.screenshot({ path: `${EKRAN}-oyun.png`, clip: { x: 95, y: 322, width: 200, height: 200 } });
  sina('üç pet de hatasız çizilir', () => { assert.equal(ciz, null); });

  // Mağaza sekmesi dar ekranda ve sağdan sola dilde taşmaz
  for (const [dil, en] of [['tr', 390], ['ar', 340]]) {
    const q = dil === 'tr' ? p : await sayfa(dil, en);
    const olcu = await q.evaluate(() => {
      save.para = 1000; save.ownedPets = { kedi: true }; save.pet = 'kedi';
      openShop(); showShopTab('pets');
      const ic = document.querySelector('#shop-content');
      const sekmeler = document.querySelector('.shop-tabs');
      return { sayfa: document.documentElement.scrollWidth, en: innerWidth, ic: ic.scrollWidth <= ic.clientWidth + 1,
        sekme: sekmeler.scrollWidth <= sekmeler.clientWidth + 1 || getComputedStyle(sekmeler).overflowX !== 'visible',
        metin: document.querySelector('#shop-content').innerText };
    });
    if (EKRAN) await q.screenshot({ path: `${EKRAN}-magaza-${dil}.png` });
    sina(`mağaza Petler sekmesi taşmaz (${dil}, ${en} px)`, () => {
      assert.ok(olcu.sayfa <= olcu.en, `${olcu.sayfa} > ${olcu.en}`); assert.equal(olcu.ic, true); assert.equal(olcu.sekme, true);
      if (dil !== 'tr') assert.ok(!/Petsiz|Yanına al|Kedi/.test(olcu.metin), 'çevrilmemiş metin');
    });
  }
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
