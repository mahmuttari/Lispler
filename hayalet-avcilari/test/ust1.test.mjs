// Hayalet Avcıları: UST1 — yolculuk haritasında çizilen nesneler üst üste binmez.
// Kullanıcı (28 Kasım 2026, ekran görüntüsü Bölüm 1): "Yerleşimlerde böyle üst üste binmeler var, giderelim" — iki kubbeli
// duvar kulesinin üstüne hayalet yuvası binmişti. Neden: yerleştirici (yolculuk.js, cak) yalnız çarpışma kutularına bakıyor;
// duvarın uç kuleleri (engeller.js duvarResmi: kule boyu kalınlığın 1,6 katı, ortası duvarın ucunda) ve obje/yuva resimleri
// kutudan taşıyor. Kural: her yerleşimde nesnelerin ÇİZİLEN kutuları kesişmez (göl-göl hariç: kesişen göller tasarım gereği).
// Çizilen kutu bu dosyada oyunun çizim kurallarından bağımsız hesaplanır (resim boyları GORSEL_LISTESI'nden):
//   obje1/obje2: kutunun ×1,15'ine oran korunarak sığan resim, alt-orta hizalı, altı kutunun 4 px altında
//   duvar: kutu + uç kuleleri (kule boyu = kalınlık × 1,6; yatay ve kareye yakında iki uçta, tabanı kutunun tabanında;
//          dikeyde üst ve alt uçta) + dikey/kare parçanın kutunun üstüne taşan kısmı. Klasik temada dikey duvarın kendi
//          resmi (tema<n>-duvar-dikey) varsa kule yok, resim kutunun içinde.
//   yuva: merkez ± 1,1 r; göl: kutu + 4 px (kıyı şeridi); diken: kutu + 3 px; lav: kutu.
// Çalıştırma: node test/ust1.test.mjs   (Playwright + Chromium; ağ ve Firebase gerekmez)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WWW = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);
const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2', '.webp': 'image/webp', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg' };
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
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript(() => {
    localStorage.setItem('hayaletAvcilariDil', 'tr'); localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9');
    localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1');
  });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof GORSEL_LISTESI === 'object' && typeof yolculukHaritaKur === 'function', null, { timeout: 20000 });

  // Bir haritanın çizilen kutuları ve kesişen çiftleri (sayfada; oyunun kendi çizim kodu çağrılmaz)
  const olc = (kur) => p.evaluate((kur) => {
    if (kur.tur) startGame({ tur: true, ulke: ulkeKodla(kur.tur).sira });
    else { startGame(); game.level = kur.bolum; buildWalls(); buildWaters(); buildHazards(); }
    const L = GORSEL_LISTESI, boy = (k) => (L[k] && L[k][0] > 0 ? L[k] : null);
    const u = typeof turUlkesi === 'function' ? turUlkesi() : null, aile = u && u.aile;
    const kutular = [];
    const ekle = (tip, x, y, w, h, ad) => kutular.push({ tip, x, y, w, h, ad });
    game.walls.forEach((o, i) => {
      if (i < 4 || o.yuva || o.gecit || o.tur === 'sinir') return;
      const tema = typeof o.tema === 'string' ? o.tema : null; // Dünya Turu'nda ülke kodu
      if (o.tur === 'obje1' || o.tur === 'obje2') {
        const k = tema ? `ulke-${tema}-${o.tur === 'obje1' ? 1 : 2}` : `tema${o.tema + 1}-${o.tur}`, d = boy(k);
        if (!d) { ekle('obje', o.x, o.y, o.w, o.h, k); return; }
        const s = Math.min(o.w * 1.15 / d[0], o.h * 1.15 / d[1]), dw = d[0] * s, dh = d[1] * s;
        ekle('obje', o.x + o.w / 2 - dw / 2, o.y + o.h + 4 - dh, dw, dh, k);
        return;
      }
      // duvar
      const w = o.w, h = o.h, dikey = h >= 1.3 * w, yatay = w >= 1.3 * h;
      const duvarK = tema ? (aile && `aile-${aile}-duvar`) : `tema${o.tema + 1}-duvar`;
      const kuleK = tema ? (aile && `aile-${aile}-kule`) : `tema${o.tema + 1}-buyuk`;
      const dikeyK = tema ? null : `tema${o.tema + 1}-duvar-dikey`;
      let x0 = o.x, y0 = o.y, x1 = o.x + w, y1 = o.y + h;
      if (!(dikey && dikeyK && boy(dikeyK))) {
        const dd = duvarK && boy(duvarK);
        if (dd && !yatay) { const ph = w * dd[1] / dd[0]; if (ph >= h) y0 = Math.min(y0, o.y + h - ph); }
        const kd = kuleK && boy(kuleK);
        if (kd) {
          const kalin = dikey ? w : h, kh = Math.max(8, kalin * 1.6), kw = kh * kd[0] / kd[1];
          const uclar = dikey ? [[w / 2, 0], [w / 2, h]] : [[0, h], [w, h]];
          for (const [ux, uy] of uclar) {
            x0 = Math.min(x0, o.x + ux - kw / 2); x1 = Math.max(x1, o.x + ux + kw / 2);
            y0 = Math.min(y0, o.y + uy - kh); y1 = Math.max(y1, o.y + uy);
          }
        }
      }
      ekle('duvar', x0, y0, x1 - x0, y1 - y0, `${w.toFixed(0)}x${h.toFixed(0)}`);
    });
    for (const yv of game.yuvalar || []) { const r = yv.r || 32; ekle('yuva', yv.x - r * 1.1, yv.y - r * 1.1, r * 2.2, r * 2.2, yv.tur); }
    for (const o of game.waters || []) if (!o.gecit) ekle('gol', o.x - 4, o.y - 4, o.w + 8, o.h + 8, '');
    for (const o of game.spikes || []) ekle('diken', o.x - 3, o.y - 3, o.w + 6, o.h + 6, '');
    for (const o of game.lavas || []) ekle('lav', o.x, o.y, o.w, o.h, '');
    // Kesişme: her iki kutu 2 px içeri alınarak (değen kenarlar sayılmaz); göl-göl hariç
    const cifts = [];
    for (let i = 0; i < kutular.length; i++) for (let j = i + 1; j < kutular.length; j++) {
      const a = kutular[i], c = kutular[j];
      if (a.tip === 'gol' && c.tip === 'gol') continue;
      const ix = Math.min(a.x + a.w, c.x + c.w) - Math.max(a.x, c.x) - 4, iy = Math.min(a.y + a.h, c.y + c.h) - Math.max(a.y, c.y) - 4;
      if (ix > 0 && iy > 0) cifts.push(`${a.tip}(${a.ad})×${c.tip}(${c.ad}) ${Math.round(ix)}x${Math.round(iy)} @${Math.round(a.x)},${Math.round(a.y)}`);
    }
    const yuvaBolge = {};
    for (const yv of game.yuvalar || []) yuvaBolge[yv.bolge] = (yuvaBolge[yv.bolge] || 0) + 1;
    return { n: kutular.length, duvar: kutular.filter((k) => k.tip === 'duvar' || k.tip === 'obje').length, cifts, yuvaBolge };
  }, kur);

  const KURLAR = [...Array.from({ length: 12 }, (_, i) => ({ bolum: i + 1 })), { tur: 'TR' }, { tur: 'JP' }, { tur: 'EG' }, { tur: 'BR' }, { tur: 'IN' }, { tur: 'US' }];
  const toplam = [];
  for (const kur of KURLAR) {
    const r = await olc(kur);
    toplam.push({ ad: kur.tur || `bölüm ${kur.bolum}`, ...r });
  }
  const bozuk = toplam.filter((r) => r.cifts.length);
  sina(`${toplam.length} haritada çizilen nesneler üst üste binmez (çakışan çift: ${toplam.reduce((s, r) => s + r.cifts.length, 0)})`, () => {
    assert.equal(bozuk.length, 0, bozuk.map((r) => `${r.ad}: ${r.cifts.length} [${r.cifts.slice(0, 2).join('; ')}]`).join(' | '));
  });
  // Giderme haritayı boşaltmasın: her haritada en az 30 duvar/obje kalır (önce en az 36'ydı); her bölgede 4 yuva korunur
  sina(`haritalar dolu kalır (en az duvar/obje: ${Math.min(...toplam.map((r) => r.duvar))})`, () => {
    for (const r of toplam) assert.ok(r.duvar >= 30, `${r.ad}: ${r.duvar}`);
  });
  sina('her bölgede 4 hayalet yuvası', () => {
    for (const r of toplam) for (let z = 1; z <= 6; z++) assert.equal(r.yuvaBolge[z], 4, `${r.ad} bölge ${z}: ${r.yuvaBolge[z]}`);
  });
  await p.evaluate(() => endGame(false));
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
