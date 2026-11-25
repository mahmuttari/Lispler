// Hayalet Avcıları UC8: 3D'nin bir kerelik yeniden açılması ve ısınmanın yavaşlık sayılmaması.
// Çalıştırma: node test/uc8.test.mjs (Playwright + Chromium; SwiftShader)
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
const SAVE = 'hayaletAvcilariSave_v1';
const sonuclar = [];
function sina(ad, fn) {
  try { fn(); sonuclar.push(`✓ ${ad}`); } catch (e) { sonuclar.push(`✗ ${ad}: ${e.message.split('\n')[0]}`); }
}
const CHROMIUM = process.env.CHROMIUM || '/opt/pw-browsers/chromium';

async function sayfaAc(b, kayit) {
  const hatalar = [];
  const p = await b.newPage({ viewport: { width: 844, height: 390 } });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript(({ save, anahtar }) => {
    localStorage.setItem('hayaletAvcilariDil', 'tr');
    localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9');
    localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1');
    if (save && !localStorage.getItem(anahtar)) localStorage.setItem(anahtar, JSON.stringify(save));
  }, { save: kayit || null, anahtar: SAVE });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof startGame === 'function' && !!window.UcAvci);
  return { p, hatalar };
}

const b = await chromium.launch({ executablePath: CHROMIUM, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  // a) ayar3d:false ve ayar3dSifir yok → açılışta bir kerelik yeniden açılır
  const A = await sayfaAc(b, { ayar3d: false });
  await A.p.waitForFunction(() => window.UcAvci.hazir === true, null, { timeout: 15000 });
  const aDurus = await A.p.evaluate((anahtar) => {
    const kayit = JSON.parse(localStorage.getItem(anahtar));
    return { sav: save.ayar3d, sifir: save.ayar3dSifir, kayit3d: kayit.ayar3d, kayitSifir: kayit.ayar3dSifir };
  }, SAVE);
  await A.p.evaluate(() => { startGame(); game.player.invuln = 1e9; });
  await A.p.waitForTimeout(400);
  const aOyun = await A.p.evaluate(() => ({ hazir: UcAvci.hazir, destek: UcAvci.destek() }));
  sina('a) ayar3d:false bir kez yeniden açılır (save ve kayıt true, ayar3dSifir=1)', () => {
    assert.equal(aDurus.sav, true);
    assert.equal(aDurus.sifir, 1);
    assert.equal(aDurus.kayit3d, true);
    assert.equal(aDurus.kayitSifir, 1);
  });
  sina('a) oyun başlayınca 3D yine çizer (UcAvci.hazir true)', () => {
    assert.equal(aOyun.hazir, true);
    assert.equal(aOyun.destek, true);
  });
  sina('a) sayfa hatası yok', () => { assert.deepEqual(A.hatalar, []); });

  // b) ayar3dSifir:1 ile ayar3d:false kalır (yeniden açılmaz)
  await A.p.evaluate((anahtar) => {
    const kayit = JSON.parse(localStorage.getItem(anahtar));
    kayit.ayar3d = false; kayit.ayar3dSifir = 1;
    localStorage.setItem(anahtar, JSON.stringify(kayit));
  }, SAVE);
  await A.p.reload({ waitUntil: 'load' });
  await A.p.waitForFunction(() => !!window.UcAvci && window.UcAvci.hazir === false, null, { timeout: 15000 });
  const bDurus = await A.p.evaluate((anahtar) => {
    const kayit = JSON.parse(localStorage.getItem(anahtar));
    return { sav: save.ayar3d, sifir: save.ayar3dSifir, kayit3d: kayit.ayar3d, kayitSifir: kayit.ayar3dSifir };
  }, SAVE);
  await A.p.evaluate(() => startGame());
  await A.p.waitForTimeout(300);
  const bOyun = await A.p.evaluate(() => ({ hazir: UcAvci.hazir, destek: UcAvci.destek() }));
  sina('b) ayar3dSifir:1 iken ayar3d:false kalır, 3D kapalı kalır', () => {
    assert.equal(bDurus.sav, false);
    assert.equal(bDurus.sifir, 1);
    assert.equal(bDurus.kayit3d, false);
    assert.equal(bDurus.kayitSifir, 1);
    assert.equal(bOyun.hazir, false);
    assert.equal(bOyun.destek, false);
  });
  sina('b) sayfa hatası yok', () => { assert.deepEqual(A.hatalar, []); });

  // c) Isınma sürerken yavaş kareler 3D'yi kapatmaz; 20 sn sonra kapatır ve olay verir
  const C = await sayfaAc(b, null);
  await C.p.waitForFunction(() => window.UcAvci.hazir === true, null, { timeout: 15000 });
  const c = await C.p.evaluate(() => {
    let olay = 0;
    window.addEventListener('uc-avci-yavas', () => { olay++; });
    const cv = document.createElement('canvas'); cv.width = 200; cv.height = 240;
    const ctx = cv.getContext('2d');
    // Benzersiz silah anahtarı: önbellekte yok → ısınma kuyruğu kesin dolar.
    UcAvci.ciz(ctx, { charKey: 'kinkin', costumeIdx: 0, gunKey: 'uc8-test', x: 100, y: 140, size: 80, aci: 0, kimlik: 'ben' });
    const kalan0 = UcAvci._sayac().isinmaKalan;
    for (let i = 0; i < 30; i++) { UcAvci.sureEkle(30); UcAvci.kareBitti(60); }
    const isinmaSonrasi = { hazir: UcAvci.hazir, destek: UcAvci.destek() };
    UcAvci._test.ilkOyunCiz(performance.now() - 21000);
    for (let i = 0; i < 30; i++) { UcAvci.sureEkle(30); UcAvci.kareBitti(60); }
    return { kalan0, isinmaSonrasi, hazir: UcAvci.hazir, destek: UcAvci.destek(), olay };
  });
  sina('c) ısınma kuyruğu doluyken yavaş kareler 3D\'yi kapatmaz', () => {
    assert.ok(c.kalan0 > 0, `kuyruk=${c.kalan0}`);
    assert.equal(c.isinmaSonrasi.hazir, true);
    assert.equal(c.isinmaSonrasi.destek, true);
  });
  sina('c) 20 sn sonra aynı yavaş kareler 3D\'yi kapatır ve uc-avci-yavas olayı gelir', () => {
    assert.equal(c.hazir, false);
    assert.equal(c.destek, false);
    assert.ok(c.olay >= 1, `olay=${c.olay}`);
  });
  sina('c) sayfa hatası yok', () => { assert.deepEqual(C.hatalar, []); });
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
