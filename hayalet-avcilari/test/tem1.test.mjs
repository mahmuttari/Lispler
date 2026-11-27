// Hayalet Avcıları: engellerde ChatGPT resimleri (TEM1) — çevrimdışı sınama.
// Resim varsa önbellek tuvaline doğru anahtarla çizilir; yoksa bugünkü kod ressamı çalışır. Çalıştırma: node test/tem1.test.mjs
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
  p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript(() => {
    localStorage.setItem('hayaletAvcilariDil', 'tr');
    localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9');
    localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1');
  });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof engelOlustur === 'function' && typeof engelResmi === 'function' && typeof ulkeKodla === 'function');

  // gorsel() sarmalanır: her anahtar için sahte ama gerçek bir tuval döner, istenen anahtarlar kaydedilir
  await p.evaluate(() => {
    const onbellek = {};
    const sahte = (k) => {
      if (!onbellek[k]) {
        const c = document.createElement('canvas'); c.width = 32; c.height = 32;
        const x = c.getContext('2d'); x.fillStyle = '#c33'; x.fillRect(0, 0, 32, 32);
        onbellek[k] = c;
      }
      return onbellek[k];
    };
    window.__var = () => true;
    window.__keys = [];
    window.gorsel = (k) => { if (!window.__var(k)) return null; window.__keys.push(k); return sahte(k); };
    window.__dene = (tur, tema, w, h, yon) => {
      window.__keys = [];
      const o = engelOlustur({ x: 300, y: 200, w, h }, tur, tema, 1234, yon);
      const R = engelResmi(o);
      let boyali = false;
      if (R && R.c) {
        const d = R.c.getContext('2d').getImageData(0, 0, R.c.width, R.c.height).data;
        for (let i = 3; i < d.length; i += 4) if (d[i] > 0) { boyali = true; break; }
      }
      return { keys: [...new Set(window.__keys)], boyali: !!boyali };
    };
  });

  const anahtarVar = (keys, k) => keys.includes(k);
  for (const n of [1, 2]) {
    const tema = n - 1;
    const d = await p.evaluate((tema) => ({
      duvar: __dene('duvar', tema, 180, 90),
      duvarDikey: __dene('duvar', tema, 90, 180),
      sinir: __dene('sinir', tema, 1600, 30, 'ust'),
      sinirDikey: __dene('sinir', tema, 30, 1200, 'sol'),
      obje1: __dene('obje1', tema, 90, 90),
      obje2: __dene('obje2', tema, 90, 90),
      su: __dene('su', tema, 100, 100),
    }), tema);
    sina(`tema${n}: duvar resmi + büyük parça`, () => {
      assert.ok(anahtarVar(d.duvar.keys, `tema${n}-duvar`), d.duvar.keys.join(','));
      assert.ok(anahtarVar(d.duvar.keys, `tema${n}-buyuk`), d.duvar.keys.join(','));
      assert.ok(anahtarVar(d.duvarDikey.keys, `tema${n}-duvar`));
    });
    sina(`tema${n}: sınır resmi (yatay ve dikey)`, () => {
      assert.ok(anahtarVar(d.sinir.keys, `tema${n}-sinir`), d.sinir.keys.join(','));
      assert.ok(anahtarVar(d.sinirDikey.keys, `tema${n}-sinir`));
    });
    // Gölet kıyılı göl resmiyle değil temanın göl ressamıyla (leke biçimi + kıyı) çizilir, içi tema su dokusu (27 Kasım)
    sina(`tema${n}: obje1, obje2 resmi; gölet tema su dokusuyla`, () => {
      assert.ok(anahtarVar(d.obje1.keys, `tema${n}-obje1`), d.obje1.keys.join(','));
      assert.ok(anahtarVar(d.obje2.keys, `tema${n}-obje2`), d.obje2.keys.join(','));
      assert.ok(!anahtarVar(d.su.keys, `tema${n}-gol`) && anahtarVar(d.su.keys, `tema${n}-su`), d.su.keys.join(','));
      assert.ok(d.duvar.boyali && d.sinir.boyali && d.obje1.boyali && d.su.boyali);
    });
  }

  // Dünya Turu: TR → ulkeKodla("TR").aile = KS
  const dt = await p.evaluate(() => {
    const aile = ulkeKodla('TR').aile;
    return { aile, duvar: __dene('duvar', 'TR', 180, 90), obje1: __dene('obje1', 'TR', 90, 90), obje2: __dene('obje2', 'TR', 90, 90), su: __dene('su', 'TR', 100, 100) };
  });
  sina(`Dünya Turu (TR, aile ${dt.aile}): aile ve ülke anahtarları`, () => {
    assert.ok(anahtarVar(dt.duvar.keys, `aile-${dt.aile}-duvar`), dt.duvar.keys.join(','));
    assert.ok(anahtarVar(dt.duvar.keys, `aile-${dt.aile}-kule`), dt.duvar.keys.join(','));
    assert.ok(anahtarVar(dt.obje1.keys, 'ulke-TR-1'), dt.obje1.keys.join(','));
    assert.ok(anahtarVar(dt.obje2.keys, 'ulke-TR-2'), dt.obje2.keys.join(','));
    assert.ok(!anahtarVar(dt.su.keys, `aile-${dt.aile}-gol`) && dt.su.boyali, dt.su.keys.join(','));
  });

  // Görseller yokken kod ressamları çalışır (resim anahtarı istenmez, resim yine boyalı)
  const yok = await p.evaluate(() => {
    window.__var = () => false;
    const d = { duvar: __dene('duvar', 0, 180, 90), sinir: __dene('sinir', 0, 1600, 30, 'ust'), obje1: __dene('obje1', 0, 90, 90), su: __dene('su', 0, 100, 100) };
    window.__var = () => true;
    return d;
  });
  sina('görseller yokken kod ressamları çalışır', () => {
    for (const k of ['duvar', 'sinir', 'obje1', 'su']) {
      assert.equal(yok[k].keys.length, 0, `${k}: ${yok[k].keys.join(',')}`);
      assert.ok(yok[k].boyali, `${k} boyasız`);
    }
  });

  sina('sayfa hatası yok', () => { assert.deepEqual(hatalar, []); });
} finally {
  if (p) await p.close();
  await b.close();
  sunucu.close();
}
console.log(sonuclar.join('\n'));
const kotu = sonuclar.filter((s) => s.startsWith('✗'));
process.exit(kotu.length ? 1 : 0);
