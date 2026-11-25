// Hayalet Avcıları HAV1: gezgin bulut salınımı, şimşek çarpılma efekti ve görsel yolları.
// Çalıştırma: node test/hav1.test.mjs   (Playwright + Chromium; ağ gerekmez)
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
async function sayfa(azHareket) {
  const p = await b.newPage({ viewport: { width: 844, height: 390 } });
  if (azHareket) await p.emulateMedia({ reducedMotion: 'reduce' });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('hayaletAvcilariDil', 'tr'); localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9'); localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1'); });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof havaGuncelle === 'function' && typeof startGame === 'function');
  await p.evaluate(() => {
    window.__bolum = (n) => {
      startGame(); game.paused = true; game.ghosts = []; game.spawnTimer = -1e9; game.player.invuln = 1e9;
      while (game.level < n) nextLevel();
      game.paused = true; game.ghosts = []; game.bot = null; game.pet = null; havaKur();
      game.player.dead = false; game.player.gizli = false; game.player.carpilma = null;
      game.camera.x = Math.max(0, game.player.x - game.W / 2);
      game.camera.y = Math.max(0, game.player.y - game.H / 2);
    };
    window.__bulutKur = () => { // gezgin bulutu hemen doğur
      game.hava.bulutSayac = 0; havaGuncelle(1 / 30);
      return game.hava.bulut;
    };
  });
  return p;
}
try {
  const p = await sayfa(false);

  // a) Gezgin bulut: en az 50 px dikey salınım, %6-%60 aralığında, yatay hız hiç ters dönmez
  const gez = await p.evaluate(() => {
    __bolum(1);
    const bl = __bulutKur();
    bl.sayac = 1e9; // test sırasında şimşek çakmasın
    const H = game.H, cy = game.camera.y;
    let enAz = Infinity, enCok = -Infinity, ters = false;
    for (let i = 0; i < 300; i++) {
      const ox = bl.x;
      havaGuncelle(1 / 30);
      enAz = Math.min(enAz, bl.y); enCok = Math.max(enCok, bl.y);
      if ((bl.x - ox) * bl.yon < -1e-6) ters = true;
    }
    return { aralik: enCok - enAz, alt: enAz - cy, ust: enCok - cy, H, ters, bulutVar: !!game.hava.bulut };
  });
  sina('gezgin bulut 10 sn içinde en az 50 px salınır, görüşün %6-%60 aralığında kalır', () => {
    assert.equal(gez.bulutVar, true);
    assert.ok(gez.aralik >= 50, `aralık ${gez.aralik}`);
    assert.ok(gez.alt >= 0.06 * gez.H - 0.5, `alt ${gez.alt}`);
    assert.ok(gez.ust <= 0.60 * gez.H + 0.5, `üst ${gez.ust}`);
  });
  sina('gezgin bulutun yatay hızı yönüne göre hiç negatif olmaz', () => { assert.equal(gez.ters, false); });

  // b) Şimşek oyuncuya zorlanınca çarpılma efekti başlar, ~0.9 sn sürer, can değişmez
  const carp = await p.evaluate(() => {
    __bolum(1);
    const bl = __bulutKur();
    bl.x = game.player.x; bl.y = game.player.y - 100; bl.sayac = 1e9;
    const hp = game.player.hp;
    havaTestHedefZorla(true);
    simsekCak(bl, null);
    havaTestHedefZorla(false);
    const son = game.hava.simsekler[game.hava.simsekler.length - 1].noktalar.slice(-1)[0];
    const bas = { aktif: !!game.player.carpilma, merkez: Math.abs(son[0] - game.player.x) < 0.001 && Math.abs(son[1] - game.player.y) < 0.001 };
    for (let i = 0; i < 10; i++) havaGuncelle(0.05); // 0,5 sn
    const orta = !!game.player.carpilma;
    for (let i = 0; i < 10; i++) havaGuncelle(0.05); // toplam 1,0 sn
    return { ...bas, orta, sonra: !!game.player.carpilma, hp, hpSonra: game.player.hp };
  });
  sina('şimşek oyuncuya isabet edince çarpılma başlar, şimşek merkeze oturur, can değişmez', () => {
    assert.equal(carp.aktif, true); assert.equal(carp.merkez, true);
    assert.equal(carp.hp, carp.hpSonra);
  });
  sina('çarpılma efekti ~0,9 sn sonra biter', () => { assert.equal(carp.orta, true); assert.equal(carp.sonra, false); });

  // c) havaCiz efekt sırasında hatasız çizer (normal ve hareketi azalt)
  const ciz = await p.evaluate(() => {
    __bolum(1); const bl = __bulutKur();
    bl.x = game.player.x; bl.y = game.player.y - 80; bl.sayac = 1e9;
    havaTestHedefZorla(true); simsekCak(bl, null); havaTestHedefZorla(false);
    let hata = null;
    try {
      const cv = document.createElement('canvas'); cv.width = 400; cv.height = 300;
      havaCiz(cv.getContext('2d'));
    } catch (e) { hata = e.message; }
    return { hata, aktif: !!game.player.carpilma };
  });
  sina('havaCiz çarpılma efekti etkinken hatasız çizilir', () => { assert.equal(ciz.hata, null); assert.equal(ciz.aktif, true); });

  // Kod yolu: bulut/şimşek/çarpılma görselleri yokken de hatasız (resim çizilmez)
  const kodsuz = await p.evaluate(() => {
    __bolum(1);
    for (const k of ['bulut', 'bulut-2', 'bulut-3', 'bulut-4', 'simsek-1', 'simsek-2', 'simsek-3']) { delete GORSEL[k]; delete GORSEL_LISTESI[k]; }
    // Çarpılma kareleri (an-carpilma-*) de yok sayılır; sayı önbelleği sıfırlanır
    for (let i = 1; i <= 6; i++) { delete GORSEL['an-carpilma-' + i]; delete GORSEL_LISTESI['an-carpilma-' + i]; }
    if (typeof _animSayi === 'object') delete _animSayi.carpilma;
    if (game.hava) game.hava.yarasalar = [];
    const bl = __bulutKur(); bl.resim = 'bulut'; bl.x = 100; bl.y = 100;
    game.player.carpilma = { kalan: 0.9, bas: performance.now() / 1000 };
    const cv = document.createElement('canvas'); cv.width = 400; cv.height = 300; const x = cv.getContext('2d');
    let resim = 0; const asil = x.drawImage.bind(x); x.drawImage = (...a) => { resim++; return asil(...a); };
    let hata = null;
    try {
      bulutCiz(x, bl);
      simsekCiz(x, { omur: HAVA.simsekSure, noktalar: [[0, 0], [100, 160]], kol: [], resim: null });
      havaCiz(x);
    } catch (e) { hata = e.message; }
    return { hata, resim };
  });
  sina('görseller yokken kod çizimi kullanılır (hata yok, resim çizilmez)', () => {
    assert.equal(kodsuz.hata, null); assert.equal(kodsuz.resim, 0);
  });

  // Resim yolu: sahte görseller gelince bulut ve şimşek resimden çizilir
  const resimli = await p.evaluate(async () => {
    __bolum(1);
    const yap = async (renk) => {
      const c = document.createElement('canvas'); c.width = c.height = 32;
      const x = c.getContext('2d'); x.fillStyle = renk; x.fillRect(2, 2, 28, 28);
      const im = new Image();
      await new Promise((coz) => { im.onload = im.onerror = () => coz(); im.src = c.toDataURL(); });
      return im;
    };
    for (const k of ['bulut', 'bulut-2', 'bulut-3', 'bulut-4']) { const im = await yap('#88aaff'); GORSEL[k] = im; GORSEL_LISTESI[k] = im.src; }
    for (const k of ['simsek-1', 'simsek-2', 'simsek-3']) { const im = await yap('#ffff88'); GORSEL[k] = im; GORSEL_LISTESI[k] = im.src; }
    const bl = __bulutKur();
    const cv = document.createElement('canvas'); cv.width = 400; cv.height = 300; const x = cv.getContext('2d');
    let resim = 0; const asil = x.drawImage.bind(x); x.drawImage = (...a) => { resim++; return asil(...a); };
    let hata = null;
    try {
      bulutCiz(x, { x: 100, y: 100, cakti: 0, resim: 'bulut-2' });
      const bl2 = { x: 100, y: 100, sayac: 1e9 };
      simsekCak(bl2, null);
      const s = game.hava.simsekler[game.hava.simsekler.length - 1];
      simsekCiz(x, s);
    } catch (e) { hata = e.message; }
    for (const k of ['bulut', 'bulut-2', 'bulut-3', 'bulut-4', 'simsek-1', 'simsek-2', 'simsek-3']) { delete GORSEL[k]; delete GORSEL_LISTESI[k]; }
    return { hata, resim, resimSecildi: !!bl.resim };
  });
  sina('sahte görseller gelince bulut ve şimşek resimden çizilir', () => {
    assert.equal(resimli.hata, null); assert.ok(resimli.resim >= 2, String(resimli.resim));
  });

  const az = await sayfa(true);
  const azR = await az.evaluate(() => {
    __bolum(1); const bl = __bulutKur();
    bl.x = game.player.x; bl.y = game.player.y - 80; bl.sayac = 1e9;
    havaTestHedefZorla(true); simsekCak(bl, null); havaTestHedefZorla(false);
    let hata = null;
    try {
      const cv = document.createElement('canvas'); cv.width = 400; cv.height = 300;
      havaCiz(cv.getContext('2d'));
    } catch (e) { hata = e.message; }
    return { hata, az: havaAzHareket(), aktif: !!game.player.carpilma };
  });
  sina('hareketi azalt: çarpılma efekti hatasız çizilir (parlama yok)', () => {
    assert.equal(azR.az, true); assert.equal(azR.hata, null); assert.equal(azR.aktif, true);
  });
  // YAG1: bulut yağmuru (görsel)
  const yag = await p.evaluate(() => {
    __bolum(1); const bl = __bulutKur(); bl.sayac = 1e9;
    for (let i = 0; i < 60; i++) havaGuncelle(1 / 30); // 2 sn
    const d = bl.yagmur.damlalar, kam = game.camera;
    return { adet: d.length, hepsiAltta: d.every((x) => x.y >= 0 && x.y <= 230),
      gorunur: bl.x + 80 > kam.x && bl.x - 80 < kam.x + game.W };
  });
  sina('gezgin bulut yağmuru 26-40 damla, hepsi bulutun altında 230 px içinde', () => {
    assert.ok(yag.adet >= 26 && yag.adet <= 40, `adet ${yag.adet}`);
    assert.equal(yag.hepsiAltta, true);
    assert.equal(yag.gorunur, true);
  });

  const dura = await p.evaluate(() => {
    __bolum(1); const bl = __bulutKur(); bl.sayac = 1e9;
    for (let i = 0; i < 60; i++) havaGuncelle(1 / 30);
    const d = bl.yagmur.damlalar, once = d.map((x) => x.ox + ',' + x.y).join(';');
    const cv = document.createElement('canvas'); cv.width = 400; cv.height = 300;
    let hata = null;
    try { havaCiz(cv.getContext('2d')); } catch (e) { hata = e.message; }
    const sonra = d.map((x) => x.ox + ',' + x.y).join(';');
    return { hata, ayni: once === sonra };
  });
  sina('oyun durunca (güncelleme yok) yağmur damlaları yerinde kalır, havaCiz hatasız', () => {
    assert.equal(dura.hata, null); assert.equal(dura.ayni, true);
  });

  const azYag = await az.evaluate(() => {
    startGame(); game.paused = true; game.ghosts = []; game.spawnTimer = -1e9; game.player.invuln = 1e9;
    game.bot = null; game.pet = null; havaKur();
    game.hava.bulutSayac = 0; havaGuncelle(1 / 30);
    const bl = game.hava.bulut; bl.sayac = 1e9;
    for (let i = 0; i < 60; i++) havaGuncelle(1 / 30);
    const d = bl.yagmur.damlalar;
    return { adet: d.length, sifirSicrama: d.every((x) => x.splash === 0) };
  });
  sina('hareketi azalt: yağmur 14-20 damla ve sıçrama yok', () => {
    assert.ok(azYag.adet >= 14 && azYag.adet <= 20, `adet ${azYag.adet}`);
    assert.equal(azYag.sifirSicrama, true);
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
