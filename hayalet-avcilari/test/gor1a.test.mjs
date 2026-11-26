// Hayalet Avcıları: GOR1A — yeni kesilen mermi/atis/para görselleri (çevrimdışı sınama).
// Kural: görsel varsa resim, yoksa bugünkü kod çizimi; oyun sayıları değişmez. Çalıştırma: node test/gor1a.test.mjs
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
  await p.addInitScript(() => {
    localStorage.setItem('hayaletAvcilariDil', 'tr');
    localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9');
    localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1');
  });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof startGame === 'function' && typeof drawProjectile === 'function' && typeof aeUcuslarCiz === 'function');
  await p.waitForFunction(() => typeof gorsel === 'function' && gorsel('mermi-kinkin') && gorsel('atis-boss') && gorsel('mermi-lazer') && typeof animHazir === 'function' && animHazir('para'), null, { timeout: 10000 });
  await p.evaluate(() => {
    startGame(); game.paused = true;
    // Çizim işlevini saydam olmayan piksel, drawImage, rotate ve scale sayısıyla ölçer
    window.__ciz = (fn) => {
      const cv = document.createElement('canvas'); cv.width = cv.height = 220;
      const x = cv.getContext('2d');
      let say = 0, rot = 0; const scale = [];
      const ad = x.drawImage.bind(x); x.drawImage = (...a) => { say++; return ad(...a); };
      const ar = x.rotate.bind(x); x.rotate = (a) => { rot++; return ar(a); };
      const asc = x.scale.bind(x); x.scale = (a, c) => { scale.push([a, c]); return asc(a, c); };
      fn(x);
      const d = x.getImageData(0, 0, 220, 220).data; let pik = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 8) pik++;
      return { say, rot, scale, pik };
    };
  });

  const r = await p.evaluate(() => {
    const o = {};
    const anahtarlar = ['kinkin', 'veryi', 'kornet', 'mark', 'kent', 'ponko', 'gul', 'rani', 'beti', 'fanatik', 'silsen', 'sercin'];
    o.mermi = {};
    for (const k of anahtarlar) {
      o.mermi[k] = __ciz((x) => drawProjectile(x, { x: 110, y: 110, vx: 10, vy: 0, charKey: k })).say;
    }
    // Görsel silinince kod çizimi hatasız çalışır (drawImage yok, piksel var)
    const yedek = GORSEL['mermi-kinkin']; delete GORSEL['mermi-kinkin'];
    const yedekProj = __ciz((x) => drawProjectile(x, { x: 110, y: 110, vx: 10, vy: 0, charKey: 'kinkin' }));
    GORSEL['mermi-kinkin'] = yedek;
    o.kinkinYedek = yedekProj;

    // Envanter silahları: resmi olanlar çizilir, baloncuk/bazuka kendi çizimini korur
    o.silah = {};
    for (const k of ['lazer', 'yesil', 'pompali', 'baloncuk', 'bazuka']) {
      o.silah[k] = __ciz((x) => { x.translate(110, 110); drawGunProjectile(x, k, 0.5); }).say;
    }

    // Düşman mermileri: boss eğik, hayalet düz ve sağa giderken aynalı
    o.boss = __ciz((x) => drawEnemyProjectile(x, { x: 110, y: 110, vx: 10, vy: 10, isBoss: true }));
    o.hayaletSag = __ciz((x) => drawEnemyProjectile(x, { x: 110, y: 110, vx: 10, vy: 0 }));
    o.hayaletSol = __ciz((x) => drawEnemyProjectile(x, { x: 110, y: 110, vx: -10, vy: 0 }));
    const yedekAtis = GORSEL['atis-hayalet']; delete GORSEL['atis-hayalet'];
    const yedekDusman = __ciz((x) => drawEnemyProjectile(x, { x: 110, y: 110, vx: 10, vy: 0 }));
    GORSEL['atis-hayalet'] = yedekAtis;
    o.dusmanYedek = yedekDusman;

    // Para ve elmas uçuşu (ekran uzayı)
    const ucus = (tip) => { AE.ucuslar.length = 0; AE.ucuslar.push({ bas: 0, sure: 450, tip, sx: 40, sy: 120, hx: 160, hy: 120 }); };
    ucus('para');
    o.para = __ciz((x) => aeUcuslarCiz(x, 225));
    ucus('elmas');
    o.elmas = __ciz((x) => aeUcuslarCiz(x, 225));
    // esya-elmas görseli varsa elmas da resimden çizilir
    GORSEL['esya-elmas'] = GORSEL['an-elmas-1'];
    ucus('elmas');
    o.elmasResim = __ciz((x) => aeUcuslarCiz(x, 225));
    delete GORSEL['esya-elmas'];

    // Kare numarası: normal harekette zamanla değişir
    const kare = (now) => {
      ucus('para'); const c = document.createElement('canvas'); c.width = c.height = 220;
      const x = c.getContext('2d'); let src = null;
      const ad = x.drawImage.bind(x); x.drawImage = (im, ...a) => { if (src === null) src = im.src || ''; return ad(im, ...a); };
      aeUcuslarCiz(x, now); return src;
    };
    o.kareNormal = [kare(225), kare(325)];
    return o;
  });

  sina('12 avcının normal mermisi resimden çizilir', () => {
    for (const k of Object.keys(r.mermi)) assert.ok(r.mermi[k] >= 1, `${k}: ${r.mermi[k]}`);
  });
  sina('mermi görseli yokken kinkin kod çizimi hatasız, resim yok', () => {
    assert.equal(r.kinkinYedek.say, 0);
    assert.ok(r.kinkinYedek.pik > 0, String(r.kinkinYedek.pik));
  });
  sina('lazer/yeşil/pompalı resimden; baloncuk/bazuka kendi çiziminde', () => {
    assert.ok(r.silah.lazer >= 1);
    assert.ok(r.silah.yesil >= 1);
    assert.ok(r.silah.pompali >= 1);
    assert.equal(r.silah.baloncuk, 0);
    assert.equal(r.silah.bazuka, 0);
  });
  sina('düşman mermisi: boss eğik resim, hayalet düz ve sağa giderken aynalı', () => {
    assert.ok(r.boss.say >= 1 && r.boss.rot >= 1, JSON.stringify(r.boss));
    assert.ok(r.hayaletSag.say >= 1 && r.hayaletSag.rot === 0, JSON.stringify(r.hayaletSag));
    assert.ok(r.hayaletSag.scale.some(([a]) => a < 0), JSON.stringify(r.hayaletSag.scale));
    assert.ok(r.hayaletSol.say >= 1 && !r.hayaletSol.scale.some(([a]) => a < 0), JSON.stringify(r.hayaletSol.scale));
  });
  sina('atis-hayalet görseli yokken kod çizimi hatasız', () => {
    assert.equal(r.dusmanYedek.say, 0);
    assert.ok(r.dusmanYedek.pik > 0, String(r.dusmanYedek.pik));
  });
  sina('para kare animasyonundan, elmas resim yokken mavi daireden çizilir', () => {
    assert.ok(r.para.say >= 1, JSON.stringify(r.para));
    assert.equal(r.elmas.say, 0);
    assert.ok(r.elmas.pik > 0, String(r.elmas.pik));
    assert.ok(r.elmasResim.say >= 1, JSON.stringify(r.elmasResim));
  });
  sina('para karesi normal harekette zamanla değişir', () => {
    assert.ok(r.kareNormal[0] && r.kareNormal[1]);
    assert.notEqual(r.kareNormal[0], r.kareNormal[1]);
  });

  // Az hareket: kent/silsen dönmez, para karesi sabit kalır
  await p.emulateMedia({ reducedMotion: 'reduce' });
  const az = await p.evaluate(() => {
    const o = {};
    o.kent = __ciz((x) => drawProjectile(x, { x: 110, y: 110, vx: 10, vy: 0, charKey: 'kent' }));
    o.silsen = __ciz((x) => drawProjectile(x, { x: 110, y: 110, vx: 10, vy: 0, charKey: 'silsen' }));
    const kare = (now) => {
      AE.ucuslar.length = 0; AE.ucuslar.push({ bas: 0, sure: 450, tip: 'para', sx: 40, sy: 120, hx: 160, hy: 120 });
      const c = document.createElement('canvas'); c.width = c.height = 220;
      const x = c.getContext('2d'); let src = null;
      const ad = x.drawImage.bind(x); x.drawImage = (im, ...a) => { if (src === null) src = im.src || ''; return ad(im, ...a); };
      aeUcuslarCiz(x, now); return src;
    };
    o.kare = [kare(225), kare(325)];
    return o;
  });
  sina('az harekette kent/silsen dönmez, para karesi sabit', () => {
    assert.equal(az.kent.rot, 0, `kent rot ${az.kent.rot}`);
    assert.equal(az.silsen.rot, 0, `silsen rot ${az.silsen.rot}`);
    assert.ok(az.kare[0]);
    assert.equal(az.kare[0], az.kare[1]);
  });
} finally {
  await b.close();
  sunucu.close();
}
sina('sayfa hatası yok', () => { assert.deepEqual(hatalar, []); });
console.log(sonuclar.join('\n'));
const kotu = sonuclar.filter((s) => s.startsWith('✗'));
console.log(`\n${sonuclar.length - kotu.length}/${sonuclar.length} geçti`);
process.exit(kotu.length ? 1 : 0);
