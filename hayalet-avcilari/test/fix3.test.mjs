// Hayalet Avcıları FIX3: obje doğal boyu, göl büyüklüğü ve kapsama — çevrimdışı sınama.
// Çalıştırma: node test/fix3.test.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WWW = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);
const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.m4a': 'audio/mp4' };
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
let p;
try {
  p = await b.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript(() => {
    localStorage.setItem('hayaletAvcilariDil', 'tr');
    localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9');
    localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1');
  });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof engelOlustur === 'function' && typeof engelBoya === 'function' && typeof buildWaters === 'function');

  // 1-2) Sahte gorsel: 32x32 kare tuval; drawImage çağrılarını say ve boyutlarını kaydet
  await p.evaluate(() => {
    const sahte = document.createElement('canvas'); sahte.width = 32; sahte.height = 32;
    const sx = sahte.getContext('2d'); sx.fillStyle = '#c33'; sx.fillRect(0, 0, 32, 32);
    window.gorsel = () => sahte;
    window.__ciz = (tur, tema, w, h) => {
      const o = engelOlustur({ x: 300, y: 200, w, h }, tur, tema, 1234);
      const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h);
      const ctx = c.getContext('2d');
      const cizimler = [];
      const gercek = ctx.drawImage.bind(ctx);
      ctx.drawImage = (im, x, y, dw, dh) => { cizimler.push({ dw, dh }); return gercek(im, x, y, dw, dh); };
      engelBoya(ctx, o);
      return cizimler;
    };
  });
  const lale = await p.evaluate(() => __ciz('obje2', 'TR', 200, 200));
  sina(`lale bahçesi (ulke-TR-2) büyük kutuda ≥2 kopya, her biri ≤ doğal 100 px`, () => {
    assert.ok(lale.length >= 2, `kopya ${lale.length}`);
    assert.ok(lale.length <= 6, `kopya ${lale.length}`);
    for (const q of lale) assert.ok(Math.max(q.dw, q.dh) <= 100 + 1e-6, JSON.stringify(q));
  });
  const anit = await p.evaluate(() => __ciz('obje1', 'FR', 300, 300));
  sina(`Eyfel Kulesi (ulke-FR-1) tek kopya, doğal 250 px`, () => {
    assert.equal(anit.length, 1, `kopya ${anit.length}`);
    assert.ok(Math.max(anit[0].dw, anit[0].dh) <= 250 + 1e-6, JSON.stringify(anit[0]));
  });

  // 3) Göller: eski boy (aynı tohum ve kurallar) ile yeni boyun alan ortalamasını karşılaştır
  const goller = await p.evaluate(() => {
    const eskiAyk = window.yolculukAcik;
    window.yolculukAcik = () => false; // klasik harita
    const sonuclar = [];
    for (let L = 1; L <= 6; L++) {
      game.level = L;
      buildWalls();
      const W = game.worldW, H = game.worldH, seed = 23 + L * 17;
      const rand = (n) => ((Math.sin((seed + n) * 77.456) + 1) / 2);
      const { cx, cy } = layoutCenter();
      let placed = 0, eskiToplam = 0;
      for (let i = 0; i < 25 && placed < 4; i++) {
        const w = 110 + rand(i) * 90, h = 80 + rand(i + 31) * 80;
        const x = 80 + rand(i * 5) * (W - 160 - w), y = 80 + rand(i * 11) * (H - 160 - h);
        if (Math.hypot(x + w / 2 - cx, y + h / 2 - cy) < 200) continue;
        let overlap = false;
        for (const wall of game.walls) if (x < wall.x + wall.w && x + w > wall.x && y < wall.y + wall.h && y + h > wall.y) { overlap = true; break; }
        if (overlap) continue;
        eskiToplam += w * h; placed++;
      }
      buildWaters();
      const sular = game.waters.filter((o) => !o.gecit);
      const yeni = sular.reduce((s, o) => s + o.w * o.h, 0) / sular.length;
      sonuclar.push({ L, eski: eskiToplam / placed, yeni, n: sular.length });
    }
    window.yolculukAcik = eskiAyk;
    return sonuclar;
  });
  // Bütün göllerin (1-6. bölümler) ortalama alanı eski ortalamanın ≥1.5 katı
  const eskiOrt = goller.reduce((s, g) => s + g.eski * g.n, 0) / goller.reduce((s, g) => s + g.n, 0);
  const yeniOrt = goller.reduce((s, g) => s + g.yeni * g.n, 0) / goller.reduce((s, g) => s + g.n, 0);
  sina(`göl ortalama alanı 1-6. bölümlerde ${(yeniOrt / eskiOrt).toFixed(2)}× eski (≥1.5)`, () => {
    for (const g of goller) assert.ok(g.yeni > 0 && g.n === 4, `bölüm ${g.L}: ${g.n} göl`);
    assert.ok(yeniOrt >= 1.5 * eskiOrt, `${yeniOrt.toFixed(0)} / ${eskiOrt.toFixed(0)}`);
  });

  // 4) Kapsama: gerçek görsellerle çarpışma içi boyalı, biçim dışı saydam
  const kapsama = await p.evaluate(() => {
    delete window.gorsel;
    const BOYUTLAR = [[80, 80], [180, 90], [90, 180], [180, 180]];
    const sorun = [];
    const denetle = (o, ad) => {
      const R = engelResmi(o);
      if (!R || !R.c) { sorun.push(`${ad} resim yok`); return; }
      const c = R.c, s = c.width / o.w, d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      const alfa = (x, y) => d[(Math.min(c.height - 1, Math.floor(y * s)) * c.width + Math.min(c.width - 1, Math.floor(x * s))) * 4 + 3];
      let bos = null, tasan = null;
      for (let y = 1; y < o.h; y += 2) for (let x = 1; x < o.w; x += 2) {
        if (!bos && engelUzaklik(o.carpisma, x, y) < -2 && alfa(x, y) === 0) bos = `${x},${y}`;
        const dis = o.derinlik ? engelUzaklik(o.carpisma, x, y) : engelUzaklik(o.bicim, x, y);
        if (!tasan && dis > o.pay + 3 && alfa(x, y) > 0) tasan = `${x},${y} (${dis.toFixed(1)} px)`;
      }
      if (bos) sorun.push(`${ad} çarpışma içi boş: ${bos}`);
      if (tasan) sorun.push(`${ad} biçim dışı boyalı: ${tasan}`);
    };
    for (let tema = 0; tema < ENGEL_TEMALARI.length; tema++) {
      for (const tur of ['duvar', 'obje1', 'obje2', 'su']) for (const [w, h] of BOYUTLAR) {
        denetle(engelOlustur({ x: 300, y: 200, w, h }, tur, tema, 2000 + tema * 53 + w * 3 + h), `${tema}/${tur}/${w}x${h}`);
      }
    }
    return sorun;
  });
  sina(`engel-bicim kapsama: 0 sorun (${kapsama.length})`, () => { assert.deepEqual(kapsama.slice(0, 6), [], kapsama.slice(0, 8).join(' | ')); });

  sina('sayfa hatası yok', () => { assert.deepEqual(hatalar, []); });
} finally {
  if (p) await p.close();
  await b.close();
  sunucu.close();
}
console.log(sonuclar.join('\n'));
const kotu = sonuclar.filter((s) => s.startsWith('✗'));
process.exit(kotu.length ? 1 : 0);
