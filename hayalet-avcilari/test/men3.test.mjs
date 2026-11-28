// Hayalet Avcıları MEN3: ana menü uzun düğmelerinde (OYNA, 2×2 kısayol, Online, Arkadaş) uç ile orta arasında dikiş çizgisi yok.
// 390×844 DPR 2 ve 3, 844×390 ve AR 340×740: düğme ekran görüntüsünün dikey üst bandında (yazı dışı) sütun ortalama parlaklığı, 3 px uzaktaki
// iki komşudan 18 seviyeden fazla koyu bir çukur içermez (dış 6 px hariç); uçlar oranını korur (basık değil); sayfa hatası yok.
// Çalıştırma: node test/men3.test.mjs   (WWW=klasör ile başka kopya sınanır; MEN3_CIKTI=önek ile tam ekran görüntüleri yazılır)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WWW = process.env.WWW || path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
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
const sina = (ad, fn) => { try { fn(); sonuclar.push(`✓ ${ad}`); } catch (e) { sonuclar.push(`✗ ${ad}: ${e.message.split('\n')[0]}`); } };
const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const hatalar = [];
const CIKTI = process.env.MEN3_CIKTI || '';

// PNG çözücü (8 bit RGB/RGBA, süzgeçli): bağımlılıksız
function pngCoz(buf) {
  let o = 8, w = 0, h = 0, ct = 0; const idat = [];
  while (o < buf.length) {
    const n = buf.readUInt32BE(o), t = buf.toString('ascii', o + 4, o + 8), d = buf.subarray(o + 8, o + 8 + n);
    if (t === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); ct = d[9]; } else if (t === 'IDAT') idat.push(d);
    o += 12 + n;
  }
  const bpp = ct === 6 ? 4 : 3, raw = zlib.inflateSync(Buffer.concat(idat)), px = Buffer.alloc(w * h * bpp);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (w * bpp + 1)], s = y * (w * bpp + 1) + 1;
    for (let x = 0; x < w * bpp; x++) {
      const a = x >= bpp ? px[y * w * bpp + x - bpp] : 0, up = y ? px[(y - 1) * w * bpp + x] : 0, c = x >= bpp && y ? px[(y - 1) * w * bpp + x - bpp] : 0;
      let v = raw[s + x];
      if (f === 1) v += a; else if (f === 2) v += up; else if (f === 3) v += (a + up) >> 1;
      else if (f === 4) { const p = a + up - c, pa = Math.abs(p - a), pb = Math.abs(p - up), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? up : c; }
      px[y * w * bpp + x] = v & 255;
    }
  }
  return { w, h, bpp, px };
}
// Üst bandın (yükseklik %12–24; ortada yazı var) sütun ortalama parlaklığı
function sutunParlaklik(g) {
  const y0 = Math.floor(g.h * 0.12), y1 = Math.ceil(g.h * 0.24), L = [];
  for (let x = 0; x < g.w; x++) {
    let t = 0, n = 0;
    for (let y = y0; y < y1; y++) { const i = (y * g.w + x) * g.bpp; t += 0.299 * g.px[i] + 0.587 * g.px[i + 1] + 0.114 * g.px[i + 2]; n++; }
    L.push(t / n);
  }
  return L;
}

const SEL = ['#screen-menu .btn-play', '#screen-menu .menu-buttons > .btn', '#screen-menu .menu-satir > .btn'];
try {
  for (const [en, boy, dpr, dil] of [[390, 844, 2, 'tr'], [390, 844, 3, 'tr'], [844, 390, 2, 'tr'], [340, 740, 2, 'ar']]) {
    const etiket = `${dil} ${en}×${boy} DPR ${dpr}`;
    const ctx = await b.newContext({ viewport: { width: en, height: boy }, deviceScaleFactor: dpr, hasTouch: true });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => hatalar.push(`${etiket}: ${e.message}`));
    await p.addInitScript((d) => {
      localStorage.setItem('hayaletAvcilariDil', d);
      localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9');
      localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1');
    }, dil);
    await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
    await p.goto(adres, { waitUntil: 'load' });
    await p.waitForFunction(() => typeof startGame === 'function');
    await p.evaluate(() => { localStorage.setItem(VERSION_KEY, APP_VERSION); save.playerName = 'Mahmut'; goToMenu(); });
    await p.waitForFunction(() => document.querySelectorAll('#screen-menu .menu-dugme-resim').length >= 5, null, { timeout: 15000 });
    await p.waitForTimeout(900);
    // Nefes animasyonunu durdur: ölçüm kararlı olsun
    await p.addStyleTag({ content: '#screen-menu .btn-play{animation:none!important} #screen-menu *{transition:none!important}' });
    await p.waitForTimeout(200);
    if (CIKTI) await p.screenshot({ path: `${CIKTI}-${dil}-${en}x${boy}-d${dpr}.png` });
    const dugmeler = await p.evaluate((sel) => sel.flatMap((s) => [...document.querySelectorAll(s)]).filter((e) => e.offsetWidth > 0).map((e, i) => {
      const r = e.getBoundingClientRect();
      return { ad: (e.className.match(/btn-\w+/g) || []).join('.') + '#' + i, x: r.left, y: r.top, w: r.width, h: r.height };
    }), SEL);
    sina(`en az 5 uzun düğme (${etiket})`, () => assert.ok(dugmeler.length >= 5, `bulunan ${dugmeler.length}`));
    for (const d of dugmeler) {
      const png = await p.screenshot({ clip: { x: d.x, y: d.y, width: d.w, height: d.h } });
      const g = pngCoz(png), L = sutunParlaklik(g), kenar = Math.ceil(6 * dpr), uzak = 3 * dpr;
      sina(`dikiş çizgisi yok: ${d.ad} (${etiket})`, () => {
        let kotu = 0, nerede = -1;
        for (let x = kenar + uzak; x < g.w - kenar - uzak; x++) {
          const cukur = Math.min(L[x - uzak], L[x + uzak]) - L[x];
          if (cukur > kotu) { kotu = cukur; nerede = x; }
        }
        if (process.env.MEN3_DIP) console.log(d.ad, etiket, kotu.toFixed(1));
        assert.ok(kotu <= 18, `x=${nerede}/${g.w} çukur ${kotu.toFixed(1)}`);
      });
    }
    const olc = await p.evaluate(() => typeof _MENU_DUGME_DILIM === 'undefined' ? [] : [...document.querySelectorAll('#screen-menu .menu-dugme-resim:not(.btn-small)')].filter((e) => e.offsetWidth > 0).map((e) => {
      const cs = getComputedStyle(e), im = gorsel('menu-dugme-' + e.dataset.menuDugme), dl = _MENU_DUGME_DILIM[e.dataset.menuDugme], gh = Math.round(e.offsetHeight * devicePixelRatio);
      return {
        anahtar: e.dataset.menuDugme, bg: cs.backgroundImage.slice(0, 24), bimg: cs.borderImageSource, w: e.offsetWidth, h: e.offsetHeight, bgUrl: e.style.backgroundImage,
        uc: _menuDugmeUcGenisligi(dl.uc, dl.ust, im, gh), beklenen: dl.uc * gh / (im.naturalHeight - dl.ust),
      };
    }));
    const boyutlar = [];
    for (const o of olc) boyutlar.push(await p.evaluate(async (u) => { const im = new Image(); im.src = u.replace(/^url\("|"\)$/g, ''); await im.decode(); return [im.naturalWidth, im.naturalHeight]; }, o.bgUrl));
    sina(`arka plan tuvali düğme boyutunda, border-image yok (${etiket})`, () => {
      assert.ok(olc.length >= 5);
      olc.forEach((o, i) => {
        assert.ok(o.bg.startsWith('url("data:image/png'), `arka plan ${o.bg}`);
        assert.equal(o.bimg, 'none');
        assert.ok(Math.abs(boyutlar[i][0] - o.w * dpr) <= 1 && Math.abs(boyutlar[i][1] - o.h * dpr) <= 1, `${o.anahtar}: tuval ${boyutlar[i]} ≠ ${o.w * dpr}×${o.h * dpr}`);
      });
    });
    sina(`uç genişliği = yükseklik × resim oranı ±%10, basık değil (${etiket})`, () => {
      for (const o of olc) assert.ok(Math.abs(o.uc - o.beklenen) / o.beklenen <= 0.1, `${o.anahtar}: uç ${o.uc} beklenen ${o.beklenen.toFixed(1)}`);
    });
    await ctx.close();
  }
  sina('sayfa hatası yok', () => assert.deepEqual(hatalar, [], hatalar.join(' / ')));
} catch (e) {
  sonuclar.push(`✗ akış yarıda kaldı: ${e.message.split('\n')[0]}`);
} finally {
  await b.close(); sunucu.close();
}
sonuclar.forEach((s) => console.log(s));
if (sonuclar.some((s) => s.startsWith('✗'))) process.exitCode = 1;
