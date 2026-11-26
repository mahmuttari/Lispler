// Hayalet Avcıları: eğik tabela yok, yol kenarı süslerinde düz yedekler (FIXG3) — çevrimdışı sınama.
// Harita resimleri asla döndürülmez; tabela kodu yatay tahta + dikey direk çizer. Tür süsleri
// Z02-Z04 yokken dere-sus-1/3/6 kullanır, onlar da yoksa kod tutamı çizilir.
// Çalıştırma: node test/fixg3.test.mjs
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
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript(() => {
    localStorage.setItem('hayaletAvcilariDil', 'tr');
    localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9');
    localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1');
  });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof startGame === 'function' && typeof zeminKatmaniKur === 'function');
  await p.waitForFunction(() => typeof gorsel === 'function' && !!gorsel('dere-sus-1'));

  await p.evaluate(() => {
    window.__kur = (level = 1) => {
      if (game.running) endGame(false);
      online.mode = null;
      online._yjYok = false;
      startGame();
      game.level = level;
      buildWalls(); buildWaters(); buildHazards();
      zeminKatmaniKur();
      game.paused = true;
      game.ghosts = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
      game.camera.x = game.player.x - game.W / 2; game.camera.y = game.player.y - game.H / 2;
      return game;
    };
    window.__tumParcalar = () => {
      const W = game.worldW, H = game.worldH, adim = 384;
      let bos = 0, onceki = -1;
      for (let tur = 0; tur < 600; tur++) {
        const nx = Math.floor(W / adim) + 1, ny = Math.floor(H / adim) + 1;
        const i = tur % (nx * ny);
        game.camera.x = Math.max(0, (i % nx) * adim - game.W / 2);
        game.camera.y = Math.max(0, Math.floor(i / nx) * adim - game.H / 2);
        zeminKatmaniCiz(game.ctx);
        if (game._zeminParcalari.size === onceki) { if (++bos > nx * ny) break; } else bos = 0;
        onceki = game._zeminParcalari.size;
      }
      return game._zeminParcalari.size;
    };
    window.__resimSil = (onekler) => {
      for (const k of Object.keys(GORSEL)) if (onekler.some((o) => k.startsWith(o))) delete GORSEL[k];
      for (const k of Object.keys(GORSEL_LISTESI)) if (onekler.some((o) => k.startsWith(o))) delete GORSEL_LISTESI[k];
    };
    window.__sentetikSus = () => {
      game._zeminKatmani.suslar = [
        { x: 200, y: 200, boy: 20, ad: 'sus-cimen', idx: 0, tur: 'cimen', kenar: true },
        { x: 724, y: 200, boy: 20, ad: 'sus-cicek', idx: 1, tur: 'cicek', kenar: true },
        { x: 1248, y: 200, boy: 18, ad: 'sus-cakil', idx: 2, tur: 'tas', kenar: true }
      ];
    };
  });

  // (a) Parça kurulurken hiçbir döndürme çağrılmaz (tabela + süsler dahil)
  const donme = await p.evaluate(() => {
    __kur(3);
    if (!(game._zeminKatmani.tabelalar || []).length) game._zeminKatmani.tabelalar = [{ x: 260, y: 260, k: 'tabela-1', aci: 2.7 }];
    if (!(game._zeminKatmani.suslar || []).some((s) => s && s.tur)) __sentetikSus();
    zeminKatmaniSil();
    // Kural "harita resimleri döndürülmez": her drawImage anında dönüşüm matrisinde dönme (b, c) olmamalı. (Gölge şekli
    // ZEM3B'de sağ alta eğik bir elips olarak döndürülür; o bir resim değildir, sayılmaz.)
    let rot = 0;
    const ed = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (...a) {
      const m = this.getTransform();
      if (Math.abs(m.b) > 1e-6 || Math.abs(m.c) > 1e-6) rot++;
      return ed.apply(this, a);
    };
    let sayi = 0;
    try { sayi = __tumParcalar(); } finally { CanvasRenderingContext2D.prototype.drawImage = ed; }
    return { rot, sayi, tabela: (game._zeminKatmani.tabelalar || []).length, sus: (game._zeminKatmani.suslar || []).length };
  });
  sina('(a) tabelalı ve süslü parça kurulurken hiçbir resim döndürülmüş çizilmez', () => {
    assert.ok(donme.tabela > 0, `tabela ${donme.tabela}`);
    assert.ok(donme.sus > 0, `süs ${donme.sus}`);
    assert.ok(donme.sayi > 0, `parça ${donme.sayi}`);
    assert.equal(donme.rot, 0, `döndürülmüş drawImage ${donme.rot}`);
  });

  // (b) Kod yedeği tabelanın tahtası yatay: dört köşede üst/alt y eşit
  const tahta = await p.evaluate(() => {
    __resimSil(['tabela-']);
    __kur(2);
    game._zeminKatmani.tabelalar = [{ x: 260, y: 260, k: 'tabela-1', aci: 2.7 }];
    zeminKatmaniSil();
    const yollar = [];
    let cur = [];
    const proto = CanvasRenderingContext2D.prototype;
    const eb = proto.beginPath, em = proto.moveTo, el = proto.lineTo, ef = proto.fill;
    proto.beginPath = function (...a) { cur = []; return eb.apply(this, a); };
    proto.moveTo = function (x, y, ...a) { cur.push([x, y]); return em.call(this, x, y, ...a); };
    proto.lineTo = function (x, y, ...a) { cur.push([x, y]); return el.call(this, x, y, ...a); };
    proto.fill = function (...a) {
      if (this.fillStyle === '#9a6b3a' && cur.length === 4) {
        const q = cur.slice();
        if (q[0][1] === q[1][1] && q[2][1] === q[3][1] && q[0][0] === q[3][0] && q[1][0] === q[2][0] && q[0][1] !== q[2][1]) yollar.push(q);
      }
      return ef.apply(this, a);
    };
    try { __tumParcalar(); } finally { proto.beginPath = eb; proto.moveTo = em; proto.lineTo = el; proto.fill = ef; }
    return { yatay: yollar.length, ornek: yollar[0] || null };
  });
  sina('(b) kod yedeği tabela tahtası yatay (köşe y eşit)', () => {
    assert.ok(tahta.yatay > 0, `yatay tahta ${tahta.yatay}`);
    const q = tahta.ornek;
    assert.equal(q[0][1], q[1][1]);
    assert.equal(q[2][1], q[3][1]);
  });

  // (c) Z02-Z04 yokken tür süsleri dere-sus-1/6/3 çizer
  const dresus = await p.evaluate(() => {
    __resimSil(['sus-', 'tabela-']);
    __kur(1);
    __sentetikSus();
    zeminKatmaniSil();
    const src = [];
    const ed = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (im, ...a) {
      try { if (im && typeof im.src === 'string') src.push(im.src); } catch (e) { /* yoksay */ }
      return ed.call(this, im, ...a);
    };
    try { __tumParcalar(); } finally { CanvasRenderingContext2D.prototype.drawImage = ed; }
    return { src };
  });
  sina('(c) Z02-Z04 yokken çimen→dere-sus-1, çiçek→dere-sus-6, taş→dere-sus-3', () => {
    const varMi = (n) => dresus.src.some((s) => s.includes(`/${n}.webp`));
    assert.ok(varMi('dere-sus-1'), 'dere-sus-1 yok');
    assert.ok(varMi('dere-sus-6'), 'dere-sus-6 yok');
    assert.ok(varMi('dere-sus-3'), 'dere-sus-3 yok');
  });

  // (c) dere-sus da yokken kod tutamı (renkli düz çizgiler) çizilir
  const tutam = await p.evaluate(() => {
    __resimSil(['sus-', 'tabela-', 'dere-sus-']);
    __kur(1);
    __sentetikSus();
    zeminKatmaniSil();
    const tuftRenk = { '#c95a8a': 1, '#4a8a3a': 1, '#3f7d3f': 1, '#8a8a86': 0 };
    let tuft = 0, dresus = 0;
    const proto = CanvasRenderingContext2D.prototype;
    const es = proto.stroke, ed = proto.drawImage;
    proto.stroke = function (...a) {
      if (tuftRenk[this.strokeStyle] === 1) tuft++;
      else if (this.strokeStyle === '#8a8a86') tuft++;
      return es.apply(this, a);
    };
    proto.drawImage = function (im, ...a) {
      try { if (im && typeof im.src === 'string' && im.src.includes('dere-sus')) dresus++; } catch (e) { /* yoksay */ }
      return ed.call(this, im, ...a);
    };
    try { __tumParcalar(); } finally { proto.stroke = es; proto.drawImage = ed; }
    return { tuft, dresus };
  });
  sina('(c) dere-sus da yokken kod tutamı çizilir, dere-sus çizilmez', () => {
    assert.ok(tutam.tuft > 0, `tutam ${tutam.tuft}`);
    assert.equal(tutam.dresus, 0, `dere-sus ${tutam.dresus}`);
  });

  // (e) Başarım: süslü/tabelalı katman boş katmanla aynı kare maliyeti (≤ %30)
  const perf = await p.evaluate(() => {
    __kur(1);
    const z = game._zeminKatmani;
    if (!(z.tabelalar || []).length) z.tabelalar = [{ x: 260, y: 260, k: 'tabela-1', aci: 1 }];
    if (!(z.suslar || []).some((s) => s && s.tur)) __sentetikSus();
    const s = z.suslar, t = z.tabelalar;
    const olc = () => {
      zeminKatmaniSil(); __tumParcalar(); zeminKatmaniSil(); __tumParcalar();
      const a = [];
      for (let r = 0; r < 7; r++) {
        const bas = performance.now();
        for (let i = 0; i < 3000; i++) zeminKatmaniCiz(game.ctx); // 300 çizim ~1 ms sürüyordu: saat çözünürlüğü ve yük oranı oynatıyordu
        game.ctx.getImageData(0, 0, 1, 1); // GPU kuyruğunu boşalt
        a.push(performance.now() - bas);
      }
      a.sort((x, y) => x - y);
      return a[3];
    };
    const dolu = olc();
    z.suslar = []; z.tabelalar = [];
    const bos = olc();
    z.suslar = s; z.tabelalar = t;
    return { dolu, bos, oran: dolu / Math.max(0.001, bos) };
  });
  sina('(e) önbellekte ek kare maliyeti ≤ %30', () => {
    assert.ok(perf.oran <= 1.3, `${perf.dolu.toFixed(1)} / ${perf.bos.toFixed(1)} = ${perf.oran.toFixed(2)}`);
  });

  // (d) sayfa hatası yok
  sina('(d) sayfa hatası yok', () => { assert.deepEqual(hatalar, []); });
} finally {
  await b.close(); sunucu.close();
}
for (const s of sonuclar) console.log(s);
const basarisiz = sonuclar.filter((s) => s.startsWith('✗')).length;
if (hatalar.length) { console.log('Sayfa hataları:', hatalar.join(' | ')); }
if (basarisiz || hatalar.length) { console.log(`${basarisiz} başarısız, ${hatalar.length} sayfa hatası`); process.exit(1); }
console.log(`Tümü geçti (${sonuclar.length})`);
