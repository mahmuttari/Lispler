// Hayalet Avcıları: çevrimiçi tutarlılık düzeltmeleri 2 (F4).
// Host arka plana geçince hostluğu devretme; değerli toplanabilirlerin yalnız ilk toplayana onaylanması;
// istemcide yeni bölümde pet/hava kurulumu ve köpeğin sersemletmesinin host'a iletilmesi.
// Çalıştırma: NO_PROXY='*' node test/cevrimici-tutarlilik2.test.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WWW = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
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
  const p = await b.newPage({ viewport: { width: 844, height: 390 } });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('hayaletAvcilariDil', 'tr'); localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9'); localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1'); });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof startGame === 'function' && typeof petGuncelle === 'function');
  await p.evaluate(() => {
    window.__hazir = (mod) => {
      startGame(); game.paused = true; game.spawnTimer = 1e9; game.bot = null;
      online.mode = mod || null; online.pendingEvents = []; online.vurduklarim = new Map();
      online.alinanlar = new Set();
      online.remotePlayers = {};
      game.ghosts = []; game.pickups = []; game.projectiles = []; game.enemyProjectiles = []; game.effects = []; game.particles = [];
      game.player.dead = false; game.player.invuln = 1e9; game.player.hp = 3; game.player.maxHp = 3;
      game.player.power = null; game.player.kasirgaUntil = 0;
      game.baslangicBolum = mod === 'client' ? null : 1;
      return game;
    };
  });

  // 15) İstemcide yeni bölüm: pet tam canla yeniden kurulur, hava da yeniden kurulur
  const bolum = await p.evaluate(() => {
    __hazir('client');
    save.ownedPets = { kopek: true }; save.pet = 'kopek';
    petKur();
    game.pet.can = 0; game.pet.baygin = 5; game.pet.maxCan = 5;
    game.hava = null;
    clientApplyLevel(game.level + 1);
    return { var: !!game.pet, baygin: game.pet && game.pet.baygin, can: game.pet && game.pet.can, hava: !!game.hava };
  });
  sina('istemci yeni bölümde peti ve havayı yeniden kurar; baygın pet tam canla başlar', () => {
    assert.equal(bolum.var, true);
    assert.equal(bolum.baygin, 0);
    assert.equal(bolum.can, 5);
    assert.equal(bolum.hava, true);
  });

  // 15) Köpeğin sersemletmesi istemcide olay olur, host hayaleti dondurur
  const sersem = await p.evaluate(() => {
    __hazir('client');
    save.ownedPets = { kopek: true }; save.pet = 'kopek';
    petKur();
    const g = { x: game.pet.x + 20, y: game.pet.y, r: 22, hp: 100, maxHp: 100, size: 40, _idx: 7 };
    game.ghosts = [g]; online.pendingEvents = [];
    petGuncelle(0.016, 1e6);
    const ev = online.pendingEvents.find((e) => e.type === 'stun');
    // Host tarafı: olayı uygula
    __hazir('host');
    const h = { x: 0, y: 0, r: 22, hp: 100, maxHp: 100, size: 40, id: 7 };
    game.ghosts = [h];
    applyHostEvent({ type: 'stun', gi: 7, duration: 600 });
    return { var: !!ev, gi: ev && ev.gi, ms: ev && ev.duration, dondu: (h.frozenUntil || 0) > performance.now() };
  });
  sina('istemcinin köpeği stun olayı yollar, host hayaleti dondurur', () => {
    assert.equal(sersem.var, true);
    assert.equal(sersem.gi, 7);
    assert.equal(sersem.ms, 600); // süre kurallarda izinli "duration" alanında
    assert.equal(sersem.dondu, true);
  });

  // 9) Host arka plana geçince hostluğu en eski diğer oyuncuya bırakır; tek başınaysa yazmaz
  const devir = await p.evaluate(() => {
    __hazir('host');
    online.roomId = 'TEST01'; online.uid = 'ben'; online.mode = 'host';
    const asil = rtdb.patch;
    const yaz = [];
    rtdb.patch = async (yol, govde) => { yaz.push({ yol, govde }); return govde; };
    online.cachedRoom = { hostUid: 'ben', players: { ben: { joinedAt: 1 }, eski: { joinedAt: 2, name: 'Eski' }, yeni: { joinedAt: 3, name: 'Yeni' } } };
    hostuDevret();
    const dolu = yaz.slice();
    yaz.length = 0;
    online.roomId = 'TEST02';
    online.cachedRoom = { hostUid: 'ben', players: { ben: { joinedAt: 1 } } };
    hostuDevret();
    const yalniz = yaz.length;
    rtdb.patch = asil;
    return { dolu, yalniz };
  });
  sina('host arka planda en eski diğer oyuncuya devredilir; tek başınayken yazım yok', () => {
    assert.equal(devir.dolu.length, 1);
    assert.equal(devir.dolu[0].yol, 'rooms/TEST01');
    assert.equal(devir.dolu[0].govde.hostUid, 'eski');
    assert.equal(devir.dolu[0].govde.hostName, 'Eski');
    assert.equal(devir.yalniz, 0);
  });

  // 13) Aynı elması iki istemci alırsa host yalnız ilk gelenin kimliğini onaylar
  const hostAldi = await p.evaluate(() => {
    __hazir('host'); online.uid = 'host1';
    game.pickups = [{ id: 5, kind: 'elmas', value: 1 }, { id: 6, kind: 'guc' }];
    game._alindi = [];
    applyHostEvent({ type: 'pickup', pi: 5, by: 'a' });
    applyHostEvent({ type: 'pickup', pi: 5, by: 'b' }); // aynı öğe: yok sayılır
    const elmas = game._alindi.map((e) => e.slice());
    applyHostEvent({ type: 'pickup', pi: 6, by: 'c' });
    return { elmas, tumu: game._alindi.map((e) => e.slice()), kalan: game.pickups.length };
  });
  sina('host aynı elmas için yalnız ilk toplayanı ald listesine yazar', () => {
    assert.deepEqual(hostAldi.elmas, [[5, 'a']]);
    assert.deepEqual(hostAldi.tumu, [[5, 'a'], [6, 'c']]);
    assert.equal(hostAldi.kalan, 0);
  });

  // 13) İstemci ödülü yalnız kendi kimliği onaylanınca verir
  const onay = await p.evaluate(() => {
    __hazir('client'); online.uid = 'ben'; online.mode = 'client';
    game.runElmas = 0; online._aldBekleyen = new Map();
    online._aldBekleyen.set(7, { kind: 'elmas', value: 2, x: 0, y: 0, t: performance.now() });
    durumGeldi({ ald: [[7, 'baska']], g: [], e: [], p: [] });
    const disaridan = { bekleyen: online._aldBekleyen.size, elmas: game.runElmas };
    online._aldBekleyen.set(8, { kind: 'elmas', value: 3, x: 0, y: 0, t: performance.now() });
    durumGeldi({ ald: [[8, 'ben']], g: [], e: [], p: [] });
    return { disaridan, benim: { bekleyen: online._aldBekleyen.size, elmas: game.runElmas } };
  });
  sina('istemci ödülü yalnız kendi kimliği onaylanınca bir kez verir', () => {
    assert.deepEqual(onay.disaridan, { bekleyen: 0, elmas: 0 });
    assert.deepEqual(onay.benim, { bekleyen: 0, elmas: 3 });
  });

  // 13) Eski kurallar "ald" alanını reddederse durum yazımı alansız yeniden denenir
  const push = await p.evaluate(async () => {
    __hazir('host'); online.uid = 'h'; online.roomId = 'TEST03'; online._aldYok = false;
    game._alindi = [[1, 'a']]; game.ghosts = []; game.pickups = []; game.enemyProjectiles = [];
    const cagri = [];
    const asil = rtdb.patch;
    rtdb.patch = async (yol, govde) => {
      cagri.push(JSON.parse(JSON.stringify(govde)));
      return cagri.length === 1 ? null : govde;
    };
    await durumuGonder();
    rtdb.patch = asil;
    return { cagri, aldYok: online._aldYok };
  });
  sina('ald alanı reddedilince yazım alansız yeniden denenir, _aldYok işaretlenir', () => {
    assert.equal(push.cagri.length, 2);
    assert.deepEqual(push.cagri[0].ald, [[1, 'a']]);
    assert.equal('ald' in push.cagri[1], false);
    assert.equal(push.aldYok, true);
  });

  // 13) Onay 1,5 sn içinde gelmezse istemci yerel ödülü verir (eski davranış)
  const geri = await p.evaluate(() => {
    __hazir('client'); online.uid = 'ben'; game.runElmas = 0;
    online._aldBekleyen = new Map([[9, { kind: 'elmas', value: 4, x: 0, y: 0, t: performance.now() - 1600 }]]);
    aldBekleyenleriGuncelle(performance.now());
    return { bekleyen: online._aldBekleyen.size, elmas: game.runElmas };
  });
  sina('host onayı 1,5 sn içinde gelmezse istemci ödülü yerel verir', () => {
    assert.equal(geri.bekleyen, 0);
    assert.equal(geri.elmas, 4);
  });

  sina('sayfa hatası yok', () => assert.deepEqual(hatalar, []));
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
