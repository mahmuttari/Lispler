// Hayalet Avcıları: 3D görünümlü karakterler ve silahlar (A/W paftaları; gorsel.js, game.js) — çevrimdışı sınama.
// Paftalar kesildi (www/gorsel/k3-*.webp, s3-*.webp): gerçek karelerle yüklenme ve çizim sınanır; kare seçimi ve resim
// yokluğunda koda dönüş sayfada sahte resimlerle (canvas → toDataURL → GORSEL). Sola bakışta yatay aynalama (bakisSol)
// ve oyun döngüsündeki bakış yönü de sınanır. Çalıştırma: node hayalet-avcilari/test/gorsel3d.test.mjs (Playwright + Chromium)
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

// Diskteki görsel listesi: sahte kareler koymadan önce gerçek resimlerin yüklenmesi beklenir (namlu alevi kareleri dahil)
const LISTE = JSON.parse(fs.readFileSync(path.join(WWW, 'gorsel', 'liste.js'), 'utf8').match(/= (\{.*\});/)[1]);

const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const hatalar = [];
const p = await b.newPage({ viewport: { width: 844, height: 390 } });
p.on('pageerror', (e) => hatalar.push(e.message));
await p.addInitScript(() => { localStorage.setItem('hayaletAvcilariDil', 'tr'); localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9'); });
await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
await p.goto(adres, { waitUntil: 'load' });
await p.waitForFunction(() => typeof karakter3dKare === 'function' && typeof startGame === 'function');
await p.waitForFunction((n) => Object.keys(GORSEL).length === n, Object.keys(LISTE).length, { timeout: 10000 });
// Bu sınama eski 2D/kare çizim yolunu doğrular; yeni 3D avcı katmanı (uc-avci.test.mjs) kapatılır.
await p.evaluate(() => { if (window.UcAvci && typeof UcAvci.kapat === 'function') UcAvci.kapat(); });
try {
  // 1) karakter3dKare: saf işlev; kare seçiminde rastgelelik yok
  const kare = await p.evaluate(() => {
    const o = {};
    const Donem = 2 * Math.PI / 12; // oyunun yürüyüş salınımı Math.sin(walkPhase * 12): bir tam dönme
    o.geriTepme = [karakter3dKare({ yuruyor: false, walkPhase: 0, shootRecoil: 0.9, zamanSn: 0 }),
      karakter3dKare({ yuruyor: true, walkPhase: 0.3 * Donem, shootRecoil: 0.9, zamanSn: 0 })];
    o.toparlanma = [karakter3dKare({ yuruyor: false, walkPhase: 0, shootRecoil: 0.3, zamanSn: 0 }),
      karakter3dKare({ yuruyor: true, walkPhase: 0.3 * Donem, shootRecoil: 0.3, zamanSn: 0 }),
      karakter3dKare({ yuruyor: false, walkPhase: 0, shootRecoil: 0.051, zamanSn: 0 })];
    o.yuruyus = [0.1, 0.35, 0.6, 0.85].map((f) => karakter3dKare({ yuruyor: true, walkPhase: f * Donem, shootRecoil: 0, zamanSn: 0 }));
    o.tamDongu = karakter3dKare({ yuruyor: true, walkPhase: 1.05 * Donem, shootRecoil: 0, zamanSn: 0 });
    o.durus = [0, 0.6, 1.2].map((sn) => karakter3dKare({ yuruyor: false, walkPhase: 0, shootRecoil: 0, zamanSn: sn }));
    o.negatif = [-0.3, -0.8, -2.5].map((f) => karakter3dKare({ yuruyor: true, walkPhase: f * Donem, shootRecoil: 0, zamanSn: 0 }));
    return o;
  });
  sina('geri tepme karesi 8 (yürürken bile önce gelir)', () => { assert.deepEqual(kare.geriTepme, [8, 8]); });
  sina('toparlanma karesi 7 (0.05 üstünde)', () => { assert.deepEqual(kare.toparlanma, [7, 7, 7]); });
  sina('yürüyüş döngüsü 1-2-3-4 sırasıyla; bir tam döngü sonra yine 1', () => {
    assert.deepEqual(kare.yuruyus, [1, 2, 3, 4]);
    assert.equal(kare.tamDongu, 1);
  });
  sina('dururken nefes karesi 5 → 6 → 5', () => { assert.deepEqual(kare.durus, [5, 6, 5]); });
  sina('negatif walkPhase yine 1-4 arası bir kare verir', () => {
    for (const k of kare.negatif) assert.ok(Number.isInteger(k) && k >= 1 && k <= 4, String(k));
  });

  // 2) 3D resim yokken (pafta gelmedi): karakter3dCiz false, drawCharacter bugünkü çizimle hatasız çizer.
  // Gerçek k3/s3 resimleri yüklüyken sinama için GORSEL'den geçici kaldırılıp sonda geri konur
  const yokken = await p.evaluate(() => {
    const o = {};
    const kayit = {};
    for (const k of ['s3-kinkin', ...Array.from({ length: 8 }, (_, i) => `k3-kinkin-0-${i + 1}`)]) if (GORSEL[k]) { kayit[k] = GORSEL[k]; delete GORSEL[k]; }
    o.hazir = karakter3dHazir('kinkin', 0);
    o.silah = silah3d('kinkin');
    const c = document.createElement('canvas'); c.width = c.height = 200; const x = c.getContext('2d');
    o.cizdi = karakter3dCiz(x, 'kinkin', 0, 1, { yuruyor: false, walkPhase: 0, shootRecoil: 0, zamanSn: 0 });
    o.hata = null;
    try { drawCharacter(x, 'kinkin', 0, 100, 110, 70); } catch (e) { o.hata = e.message; }
    Object.assign(GORSEL, kayit); // geri koy
    const d = x.getImageData(0, 0, 200, 200).data; let dolu = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 0) dolu++;
    o.doluPiksel = dolu;
    return o;
  });
  sina('3D kare yokken hazır değil, karakter3dCiz false döner; drawCharacter hatasız çizer', () => {
    assert.equal(yokken.hazir, false);
    assert.equal(yokken.cizdi, false);
    assert.equal(yokken.silah, null);
    assert.equal(yokken.hata, null);
    assert.ok(yokken.doluPiksel > 100, String(yokken.doluPiksel));
  });

  // 3) Bakış yönü: 3D kareler yandan, sağa dönük çizildi; sola bakarken (bakisSol) karakter ve silah yatay aynalanır.
  // scale'i saran sahte işlevle aynalama, drawImage sayısıyla resim çizimi sınanır (gerçek k3 kareleri sayfada yüklü).
  const bakis = await p.evaluate(() => {
    const o = {};
    const ciz = (bakisSol) => { // drawCharacter'ın scale ve drawImage çağrıları
      const c = document.createElement('canvas'); c.width = c.height = 240; const x = c.getContext('2d');
      const scaleler = []; const asilScale = x.scale.bind(x);
      x.scale = (a, b) => { scaleler.push([a, b]); return asilScale(a, b); };
      let say = 0; const asil = x.drawImage.bind(x);
      x.drawImage = (...a) => { say++; return asil(...a); };
      x.save(); drawCharacter(x, 'kinkin', 0, 120, 150, 70, 0, 0, 0, 0, '', bakisSol); x.restore();
      return { scaleler, say };
    };
    o.sola = ciz(true);   // gerçek k3 kareleri ve s3 silahı yüklü: gövde (+ silah) resimle çizilir
    o.saga = ciz(false);
    // 3D kareler geçici silinirken (KS resmi / kod çizimi önden çizilir): bakisSol aynalama yapmaz; sonra geri konur
    const kayit = {};
    for (const k of Array.from({ length: 8 }, (_, i) => `k3-kinkin-0-${i + 1}`)) if (GORSEL[k]) { kayit[k] = GORSEL[k]; delete GORSEL[k]; }
    o.ks = ciz(true);
    Object.assign(GORSEL, kayit);
    o.geriKondi = karakter3dHazir('kinkin', 0);
    return o;
  });
  const aynaladi = (r) => r.scaleler.some((s) => s[0] === -1 && s[1] === 1);
  sina('bakisSol true iken 3D kare çiziminde yatay aynalama (scale(-1, 1)) yapılır ve resim çizilir', () => {
    assert.equal(aynaladi(bakis.sola), true);
    assert.ok(bakis.sola.say >= 1, String(bakis.sola.say));
  });
  sina('bakisSol false iken scale(-1, 1) yapılmaz', () => { assert.equal(aynaladi(bakis.saga), false); });
  sina('KS/kod çiziminde (3D kareler yokken) bakisSol true olsa da aynalama yapılmaz; kareler geri konur', () => {
    assert.equal(aynaladi(bakis.ks), false);
    assert.equal(bakis.geriKondi, true);
  });

  // 4) Sahte 3D kareler: drawCharacter durumuna göre kareyi seçer; alt-orta ayak hizasında, kod çiziminin boyunda çizer
  const sahte = await p.evaluate(async () => {
    const o = {};
    const kareler = [];
    for (let n = 1; n <= 8; n++) { // her kare farklı renk, 120 × 200
      const c = document.createElement('canvas'); c.width = 120; c.height = 200;
      const x = c.getContext('2d');
      x.fillStyle = `hsl(${n * 40}, 80%, 60%)`;
      x.fillRect(10, 10, 100, 180);
      const im = new Image();
      await new Promise((coz) => { im.onload = im.onerror = () => coz(); im.src = c.toDataURL(); });
      kareler.push(im);
    }
    for (let n = 1; n <= 8; n++) GORSEL[`k3-kinkin-0-${n}`] = kareler[n - 1];
    o.hazir = karakter3dHazir('kinkin', 0);
    // Gövde karesiyle tek drawImage kalması için gerçek s3 silah resmi geçici kaldırılıyor (sonda geri konur)
    const asilSilah = GORSEL['s3-kinkin']; if (asilSilah) delete GORSEL['s3-kinkin'];
    const Donem = 2 * Math.PI / 12;
    const ciz = (walkPhase, aimRaise = 0, shootRecoil = 0) => { // drawCharacter'ın drawImage'a girdiği resim ve kutu
      const c = document.createElement('canvas'); c.width = c.height = 240; const x = c.getContext('2d');
      let src = null, kutu = null, say = 0; const asil = x.drawImage.bind(x);
      x.drawImage = (im, dx, dy, dw, dh) => { if (src === null) { src = im.src || ''; kutu = [dx, dy, dw, dh]; } say++; return asil(im, dx, dy, dw, dh); };
      x.save(); drawCharacter(x, 'kinkin', 0, 120, 150, 70, 0, walkPhase, aimRaise, shootRecoil); x.restore();
      return { src, kutu, say };
    };
    const kareNo = (r) => (r.src ? 1 + kareler.findIndex((im) => im.src === r.src) : 0);
    o.durur = kareNo(ciz(0));                              // zamana göre 5 ya da 6
    o.yurur = [0.1, 0.35, 0.6, 0.85].map((f) => kareNo(ciz(f * Donem)));
    o.atis = kareNo(ciz(0, 1, 0.9));
    o.dogrudan = karakter3dCiz(document.createElement('canvas').getContext('2d'), 'kinkin', 0, 1,
      { yuruyor: true, walkPhase: 0.1 * Donem, shootRecoil: 0, zamanSn: 0 });
    // Hiza ve boy: dx = -w/2 (alt-orta), dy + dh = kk.alt * s (ayak hizası), dh = kod boyu * 1.06
    const kk = karakterKodKutusu('kinkin', 0), s = 0.7;
    const r = ciz(0), h0 = (kk.alt - kk.ust) * s * 1.06;
    o.say = r.say;
    o.hiza = [Math.abs(r.kutu[0] * 2 + r.kutu[2]), Math.abs(r.kutu[1] + r.kutu[3] - kk.alt * s), Math.abs(r.kutu[3] - h0)];
    if (asilSilah) GORSEL['s3-kinkin'] = asilSilah; // geri koy
    // Temizlik: sahte anahtarları sil
    for (let n = 1; n <= 8; n++) delete GORSEL[`k3-kinkin-0-${n}`];
    o.temiz = !GORSEL['k3-kinkin-0-1'] && karakter3dHazir('kinkin', 0) === false;
    return o;
  });
  sina('sahte karelerle karakter3dHazir true, karakter3dCiz true döner', () => {
    assert.equal(sahte.hazir, true);
    assert.equal(sahte.dogrudan, true);
  });
  sina('dururken 5 ya da 6, yürürken 1-2-3-4, shootRecoil 0.9 iken 8 karesi çizilir', () => {
    assert.ok(sahte.durur === 5 || sahte.durur === 6, String(sahte.durur));
    assert.deepEqual(sahte.yurur, [1, 2, 3, 4]);
    assert.equal(sahte.atis, 8);
  });
  sina('gövde karesiyle bir drawImage; alt-ortada, ayak hizasında, boy kod çiziminin 1.06 katı', () => {
    assert.equal(sahte.say, 1);
    for (const f of sahte.hiza) assert.ok(f < 1e-6, String(f));
  });
  sina('test sonunda sahte anahtarlar silinir', () => { assert.equal(sahte.temiz, true); });

  // 5) Sahte silah resmi: drawCharWeapon resimle çizer, ateşte namlu alevi karesi de gelir; resim silinince koda döner
  const silah = await p.evaluate(async () => {
    const o = {};
    const c = document.createElement('canvas'); c.width = 60; c.height = 30;
    const x = c.getContext('2d'); x.fillStyle = '#f97316'; x.fillRect(0, 0, 60, 30);
    const im = new Image();
    await new Promise((coz) => { im.onload = im.onerror = () => coz(); im.src = c.toDataURL(); });
    GORSEL['s3-kinkin'] = im;
    o.buldu = !!silah3d('kinkin');
    const ciz = (shootRecoil) => {
      const t = document.createElement('canvas'); t.width = t.height = 240; const tx = t.getContext('2d');
      const cizilen = []; const asil = tx.drawImage.bind(tx);
      tx.drawImage = (g, ...a) => { cizilen.push(g.src || 'tuval'); return asil(g, ...a); };
      tx.save(); drawCharWeapon(tx, 'kinkin', 1, 0, 1, shootRecoil); tx.restore();
      return cizilen;
    };
    o.resimle = ciz(0);
    o.alevli = ciz(0.9); // ateşin ilk anı: silah + namlu alevi (vurus) karesi
    delete GORSEL['s3-kinkin'];
    o.kodaDondu = ciz(0);
    return o;
  });
  sina('karakter silahı 3D resimle çizilir; ateşte namlu alevi karesi de çizilir', () => {
    assert.equal(silah.buldu, true);
    assert.equal(silah.resimle.length, 1);
    assert.ok(silah.resimle[0].startsWith('data:'), 'resim değil');
    assert.equal(silah.alevli.length, 2);
    assert.ok(silah.alevli[1].includes('an-vurus-1'), silah.alevli[1]);
  });
  sina('resim silinince kod çizimine döner (drawImage çağrılmaz)', () => { assert.deepEqual(silah.kodaDondu, []); });

  // 6) Oyun döngüsü: bakış yönü ateşte hedefe, yürürken hareket yönüne bakar; dikey yürüyüş son yönü bozmaz (titreme yok)
  const dongu = await p.evaluate(() => {
    const o = {};
    startGame(); game.paused = true;
    game.spawnTimer = 1e9; game.bot = null; game.ghosts = []; game.player.invuln = 0;
    game.camera.x = game.player.x - game.W / 2; game.camera.y = game.player.y - game.H / 2;
    const adim = () => { for (let i = 0; i < 3; i++) update(1 / 30, performance.now()); };
    const hayaletKoy = (dx) => { // oyuncunun belirttiği yanına dayanıklı bir hayalet koy
      game.ghosts = [{ x: game.player.x + dx, y: game.player.y, r: 22, speed: 0, hp: 999, maxHp: 999, size: 40 }];
      game.lastFire = 1e9; // bu sinamada atış yapılmaz
      adim();
    };
    hayaletKoy(-150); o.hedefSol = game.player.bakisSol;
    hayaletKoy(150); o.hedefSag = game.player.bakisSol;
    game.ghosts = []; game.player.bakisSol = false;
    game.inputDir.x = -1; game.inputDir.y = 0; adim();
    o.solaYurudu = game.player.bakisSol;
    game.inputDir.x = 0; game.inputDir.y = -1; adim();
    o.dikeyYuruyus = game.player.bakisSol;
    game.inputDir.x = 0; game.inputDir.y = 0;
    return o;
  });
  sina('oyun döngüsü: soldaki hayalete bakınca sola, sağdakine sağa döner', () => {
    assert.equal(dongu.hedefSol, true);
    assert.equal(dongu.hedefSag, false);
  });
  sina('sola yürüyünce sola bakar; dikey yürüyüş bakış yönünü değiştirmez (son yön korunur)', () => {
    assert.equal(dongu.solaYurudu, true);
    assert.equal(dongu.dikeyYuruyus, true);
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
