// Hayalet Avcıları Y3A: çevrimiçi yolculuk — oda bayrağı, bölge durumu ve istemci uygulaması.
// Yerel sunucu + Playwright; Firebase/ads istekleri kesilir. Çalıştırma: node test/y3.test.mjs
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
  await p.waitForFunction(() => typeof startGame === 'function' && typeof yolculukHaritaKur === 'function' && typeof durumuGonder === 'function');
  await p.evaluate(() => {
    window.__orig = { put: rtdb.put, patch: rtdb.patch, showToast, onlineKimlik, sunucuSaatiniDinle };
    window.__imza = () => JSON.stringify({
      walls: game.walls.map((w) => [Math.round(w.x), Math.round(w.y), Math.round(w.w), Math.round(w.h)]),
      yuvalar: (game.yuvalar || []).map((y) => [Math.round(y.x), Math.round(y.y), y.tur, y.bolge]),
    });
    window.__resetOnline = () => {
      online.mode = null; online.cachedRoom = null; online.roomId = null; online.isHost = false;
      online.remotePlayers = {}; online._yjYok = false; online._aldYok = false;
      online._yjUyariGosterildi = false;
      rtdb.put = __orig.put; rtdb.patch = __orig.patch; showToast = __orig.showToast;
      onlineKimlik = __orig.onlineKimlik; sunucuSaatiniDinle = __orig.sunucuSaatiniDinle;
    };
  });

  // 1) Çevrimdışı yolculuk değişmedi: harita 7200x1000 ve tohumlu, iki kurulum aynı
  const offline = await p.evaluate(() => {
    __resetOnline();
    save.playerName = save.playerName || 'Avci'; persistSave();
    startGame(); game.paused = true; game.bot = null;
    const bir = __imza();
    startGame(); game.paused = true; game.bot = null;
    const iki = __imza();
    return { acik: yolculukAcik(), w: game.worldW, h: game.worldH, ayni: bir === iki, duvar: game.walls.length, yuva: game.yuvalar.length };
  });
  sina('çevrimdışı yolculuk açık, harita 7200x1000 ve iki kurulum aynı', () => {
    assert.equal(offline.acik, true);
    assert.equal(offline.w, 7200);
    assert.equal(offline.h, 1000);
    assert.ok(offline.duvar > 4);
    assert.ok(offline.yuva > 0);
    assert.equal(offline.ayni, true);
  });

  // 2) Oda kurma yj=1 ve sv=2 yazar
  const oda = await p.evaluate(async () => {
    __resetOnline();
    const yazilan = [];
    onlineKimlik = async () => 'TESTUID_123';
    sunucuSaatiniDinle = () => {};
    rtdb.put = async (yol, govde) => { yazilan.push({ yol, govde: JSON.parse(JSON.stringify(govde)) }); return true; };
    save.playerName = 'Kurucu'; persistSave();
    await submitCreateRoom();
    return { body: yazilan[0] && yazilan[0].govde, uid: 'TESTUID_123', roomId: online.roomId, cachedYj: online.cachedRoom && online.cachedRoom.yj };
  });
  sina('oda kurma yj=1 ve oyuncu sv=2 yazar', () => {
    assert.equal(oda.body.yj, 1);
    assert.equal(oda.body.players[oda.uid].sv, 2);
    assert.ok(oda.roomId);
    assert.equal(oda.cachedYj, 1);
  });

  // 3) Eski kurallar yj/sv'yi reddedince onlarsız yeniden dener, çevrimiçi yolculuk kapalı kalır
  const red = await p.evaluate(async () => {
    __resetOnline();
    const yazilan = []; const toast = [];
    onlineKimlik = async () => 'TESTUID_123';
    sunucuSaatiniDinle = () => {};
    showToast = (m) => toast.push(m);
    let n = 0;
    rtdb.put = async (yol, govde) => {
      yazilan.push(JSON.parse(JSON.stringify(govde)));
      n++;
      if (n === 1) { online.lastError = 'PERMISSION_DENIED'; return null; }
      return true;
    };
    save.playerName = 'Kurucu'; persistSave();
    await submitCreateRoom();
    online.mode = 'host';
    return {
      birinci: yazilan[0], ikinci: yazilan[1],
      acik: yolculukAcik(), yjYok: online._yjYok,
      uyari: toast.filter((m) => /yolculuk/i.test(m)).length,
    };
  });
  sina('yj reddedilince sv/yj olmadan yeniden denenir, uyarı bir kez, yolculuk kapalı', () => {
    assert.equal(red.birinci.yj, 1);
    assert.equal(red.birinci.players.TESTUID_123.sv, 2);
    assert.equal(red.ikinci.yj, undefined);
    assert.equal(red.ikinci.players.TESTUID_123.sv, undefined);
    assert.equal(red.acik, false);
    assert.equal(red.uyari, 1);
  });

  // 4) yj odasında kurucu ve istemci aynı haritayı kurar (duvar + yuva imzası)
  const harita = await p.evaluate(() => {
    __resetOnline();
    online.mode = 'host'; online.cachedRoom = { yj: 1 };
    game.level = 3;
    dunyaBoyutunuAyarla(); buildWalls(); buildWaters(); buildHazards();
    const kurucu = __imza();
    online.mode = 'client'; online.cachedRoom = { yj: 1 };
    game.player = game.player || { x: 0, y: 0, r: 22, hp: 3, maxHp: 3, dead: false, waterImmune: false, charKey: save.selectedChar, costumeIdx: 0 };
    clientApplyLevel(3);
    const istemci = __imza();
    return { ayni: kurucu === istemci, kurucu, istemci };
  });
  sina('kurucu ve istemci aynı yolculuk haritasını kurar', () => {
    assert.equal(harita.ayni, true, harita.kurucu.slice(0, 120) + ' ≠ ' + harita.istemci.slice(0, 120));
  });

  // 5) Kurucu durum yazımı kp/bz/ab/aw içerir
  const durum = await p.evaluate(async () => {
    __resetOnline();
    online.mode = 'host'; online.roomId = 'TEST01'; online.cachedRoom = { yj: 1 };
    game.level = 1;
    dunyaBoyutunuAyarla(); buildWalls(); buildWaters(); buildHazards();
    game.running = true; game.ghosts = []; game.enemyProjectiles = []; game.pickups = []; game._alindi = [];
    game.kopruAcik = new Array(YOLCULUK_AYAR.zoneCount).fill(false);
    game.kopruAcik[0] = true; game.bolge = 3;
    const yazilan = [];
    rtdb.patch = async (yol, govde) => { yazilan.push(JSON.parse(JSON.stringify(govde))); return true; };
    await durumuGonder();
    return { govde: yazilan[0] };
  });
  sina('kurucu durumu kp/bz/ab/aw sayılarını içerir', () => {
    assert.equal(durum.govde.kp, 1);
    assert.equal(durum.govde.bz, 3);
    assert.equal(typeof durum.govde.ab, 'number');
    assert.equal(typeof durum.govde.aw, 'number');
  });

  // 6) İstemci kp'yi uygular: köprü bir kez açılır (animasyon/ses/duyuru bir kez)
  const kopru = await p.evaluate(() => {
    __resetOnline();
    online.mode = 'client'; online.cachedRoom = { yj: 1 };
    game.level = 1; game.running = true; game.dunyaTuru = false;
    dunyaBoyutunuAyarla(); buildWalls();
    game.kopruAcik = new Array(YOLCULUK_AYAR.zoneCount).fill(false);
    game.ghosts = []; game.enemyProjectiles = []; game.pickups = [];
    let acilis = 0;
    showToast = (m) => { if (/Köprü açıldı/.test(m)) acilis++; };
    durumGeldi({ kp: 1, bz: 2, g: [], e: [], p: [] });
    durumGeldi({ kp: 1, bz: 2, g: [], e: [], p: [] });
    return { acik: game.kopruAcik[0], bolge: game.bolge, acilis, anim: !!(game._kopruAnim && game._kopruAnim[0] > 0) };
  });
  sina('istemci köprüyü bir kez açar ve bölgeyi bz’den alır', () => {
    assert.equal(kopru.acik, true);
    assert.equal(kopru.bolge, 2);
    assert.equal(kopru.acilis, 1);
    assert.equal(kopru.anim, true);
  });

  // 7) Durum yazımı yolculuk alanlarını reddederse _yjYok ile alansız yeniden dener
  const yedek = await p.evaluate(async () => {
    __resetOnline();
    online.mode = 'host'; online.roomId = 'TEST01'; online.cachedRoom = { yj: 1 };
    game.level = 1;
    dunyaBoyutunuAyarla(); buildWalls(); buildWaters(); buildHazards();
    game.running = true; game.ghosts = []; game.enemyProjectiles = []; game.pickups = []; game._alindi = [];
    game.kopruAcik = new Array(YOLCULUK_AYAR.zoneCount).fill(false);
    const yazilan = [];
    let n = 0;
    rtdb.patch = async (yol, govde) => {
      yazilan.push(JSON.parse(JSON.stringify(govde)));
      n++;
      if (n === 1) { online.lastError = 'PERMISSION_DENIED'; return null; }
      return true;
    };
    await durumuGonder();
    const yjYok = online._yjYok;
    const acik = yolculukAcik();
    game.level = 4; buildWalls();
    return { birinci: yazilan[0], ikinci: yazilan[1], yjYok, acik, w: game.worldW };
  });
  sina('durum reddedilince _yjYok ile alansız yazılır ve sonraki bölüm eski harita olur', () => {
    assert.equal(typeof yedek.birinci.kp, 'number');
    assert.ok(yedek.ikinci);
    assert.equal('kp' in yedek.ikinci, false);
    assert.equal(yedek.yjYok, true);
    assert.equal(yedek.acik, false);
    assert.equal(yedek.w, 1600);
  });

  // 8) İstemci bölüm değişiminde (hayalet olsa da) yolculuk başlangıcında doğar
  const baslangic = await p.evaluate(() => {
    __resetOnline();
    online.mode = 'client'; online.cachedRoom = { yj: 1 };
    game.running = true; game.level = 1; game.dunyaTuru = false;
    game.player = game.player || { x: 0, y: 0, r: 22, hp: 3, maxHp: 3, dead: false, waterImmune: false, charKey: save.selectedChar, costumeIdx: 0 };
    game.player.dead = true; game.player.hp = 0;
    game.ghosts = []; game.pickups = []; game.enemyProjectiles = []; game.effects = [];
    clientApplyLevel(2);
    const b = yolculukBaslangic();
    return { x: game.player.x, y: game.player.y, bx: b.x, by: b.y, dead: game.player.dead };
  });
  sina('hayalet oyuncu yeni bölümde yolculuk başlangıcında doğar', () => {
    assert.equal(baslangic.x, baslangic.bx);
    assert.equal(baslangic.y, baslangic.by);
    assert.equal(baslangic.dead, false);
  });

  await p.evaluate(() => __resetOnline());
  sina('sayfada hata yok', () => { assert.deepEqual(hatalar, []); });
} finally {
  await b.close(); sunucu.close();
}
for (const s of sonuclar) console.log(s);
if (sonuclar.some((s) => s.startsWith('✗'))) process.exit(1);
