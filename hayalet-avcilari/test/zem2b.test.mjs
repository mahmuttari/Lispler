// Hayalet Avcıları: yol kenarı kaosu ve çatal tabelaları (ZEM2B) — çevrimdışı sınama.
// Yol kenarlarına taş/çimen/çiçek serpilir, çatal noktalarına tabela konur; hepsi zemin parçası
// önbelleğinde çizilir. Çalıştırma: node test/zem2b.test.mjs
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
    window.__kopruYakin = (x, y) => {
      for (const k of (game.kopruler || [])) {
        if (!k) continue;
        const cx = (k.a + k.b) / 2, hw = Math.abs(k.b - k.a) / 2;
        if (Math.abs(x - cx) < hw + 60 && Math.abs(y - k.c) < 60) return true;
      }
      return false;
    };
  });

  // (a) Kenar süsleri: yol uzunluğunun her 100 px'ine en az 1; su/duvar/yol/köprü dışı
  const kenar = await p.evaluate(() => {
    const out = [];
    for (const level of [1, 3, 5]) {
      __kur(level);
      const z = game._zeminKatmani;
      let uzunluk = 0;
      for (const yol of (z.yollar || []).concat(z.patikalar || [])) {
        const q = yol.noktalar;
        if (!Array.isArray(q)) continue;
        for (let i = 0; i < q.length - 1; i++) uzunluk += Math.hypot(q[i + 1].x - q[i].x, q[i + 1].y - q[i].y);
      }
      const liste = (z.suslar || []).filter((s) => s && s.kenar);
      const kotu = [];
      for (const s of liste) {
        if (collidesWaters(s.x, s.y, 0)) kotu.push(`L${level}:su`);
        if (collidesWalls(s.x, s.y, 0)) kotu.push(`L${level}:duvar`);
        if (zeminKatmaniYolMu(s.x, s.y)) kotu.push(`L${level}:yol`);
        if (__kopruYakin(s.x, s.y)) kotu.push(`L${level}:kopru`);
      }
      out.push({ level, adet: liste.length, uzunluk, kotu: kotu.slice(0, 8) });
    }
    return out;
  });
  for (const r of kenar) {
    sina(`(a) bölüm ${r.level}: yol kenarı süsü ≥ 1 / 100 px, en çok 1 / 15 px (iki yanda 35-70 px aralık)`, () => {
      assert.ok(r.adet >= r.uzunluk / 100, `${r.adet} süs / ${Math.round(r.uzunluk)} px`);
      assert.ok(r.adet <= r.uzunluk / 15, `çok sık: ${r.adet} süs / ${Math.round(r.uzunluk)} px`);
    });
    sina(`(a) bölüm ${r.level}: kenar süsü suda, duvarda, yolda, köprüde değil`, () => {
      assert.deepEqual(r.kotu, []);
    });
  }

  // (b) Tabelalar: 1-4 adet, en az 500 px aralık, yolda/suda değil
  const tabela = await p.evaluate(() => {
    const out = [];
    for (const level of [1, 2]) {
      __kur(level);
      const t = game._zeminKatmani.tabelalar || [];
      const kotu = [];
      for (const tb of t) {
        if (zeminKatmaniYolMu(tb.x, tb.y)) kotu.push('yol');
        if (collidesWaters(tb.x, tb.y, 0)) kotu.push('su');
        if (collidesWalls(tb.x, tb.y, 0)) kotu.push('duvar');
      }
      let enYakin = Infinity;
      for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) enYakin = Math.min(enYakin, Math.hypot(t[i].x - t[j].x, t[i].y - t[j].y));
      out.push({ level, adet: t.length, enYakin, kotu, k: t.map((q) => q.k) });
    }
    return out;
  });
  for (const r of tabela) {
    sina(`(b) bölüm ${r.level}: 1-4 tabela var`, () => {
      assert.ok(r.adet >= 1 && r.adet <= 4, String(r.adet));
      assert.ok(r.k.every((k) => typeof k === 'string' && k.length > 0), JSON.stringify(r.k));
    });
    sina(`(b) bölüm ${r.level}: tabelalar ≥ 500 px aralıkta, yolda/suda/duvarda değil`, () => {
      assert.ok(r.adet < 2 || r.enYakin >= 500, `en yakın ${r.enYakin}`);
      assert.deepEqual(r.kotu, []);
    });
  }

  // (d) gorsel-yuklendi olayı parça önbelleğini boşaltır
  const temizle = await p.evaluate(() => {
    __kur(1);
    __tumParcalar();
    const once = game._zeminParcalari.size;
    window.dispatchEvent(new Event('gorsel-yuklendi'));
    const sonra = game._zeminParcalari.size;
    return { once, sonra };
  });
  sina('(d) gorsel-yuklendi parça önbelleğini temizler', () => {
    assert.ok(temizle.once > 0, String(temizle.once));
    assert.equal(temizle.sonra, 0);
  });

  // (f) Başarım: kenar süsü + tabelalı katman, boş katmanla aynı kare maliyeti (≤ %30)
  const perf = await p.evaluate(() => {
    __kur(1);
    const z = game._zeminKatmani;
    const s = z.suslar, t = z.tabelalar;
    const olc = () => {
      zeminKatmaniSil(); __tumParcalar(); zeminKatmaniSil(); __tumParcalar();
      const a = [];
      for (let r = 0; r < 7; r++) {
        const bas = performance.now();
        for (let i = 0; i < 300; i++) zeminKatmaniCiz(game.ctx);
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
  sina('(f) önbellekte ek kare maliyeti ≤ %30', () => {
    assert.ok(perf.oran <= 1.3, `${perf.dolu.toFixed(1)} / ${perf.bos.toFixed(1)} = ${perf.oran.toFixed(2)}`);
  });

  // (e) Şimdiye dek sayfa hatası yok
  sina('(e) sayfa hatası yok', () => { assert.deepEqual(hatalar, []); });

  // (c) Z resimleri yokken yedekler: kod çimen tutamı ve kod tabela çizilir, hata yok
  const yedek = await p.evaluate(() => {
    for (const k of Object.keys(GORSEL)) if (k.startsWith('sus-') || k.startsWith('tabela-')) delete GORSEL[k];
    for (const k of Object.keys(GORSEL_LISTESI)) if (k.startsWith('sus-') || k.startsWith('tabela-')) delete GORSEL_LISTESI[k];
    __kur(2);
    zeminKatmaniSil();
    let stroke = 0, rect = 0;
    const es = CanvasRenderingContext2D.prototype.stroke;
    const er = CanvasRenderingContext2D.prototype.fillRect;
    CanvasRenderingContext2D.prototype.stroke = function (...a) { stroke++; return es.apply(this, a); };
    CanvasRenderingContext2D.prototype.fillRect = function (...a) { rect++; return er.apply(this, a); };
    try { __tumParcalar(); } finally {
      CanvasRenderingContext2D.prototype.stroke = es;
      CanvasRenderingContext2D.prototype.fillRect = er;
    }
    return { stroke, rect, tabela: (game._zeminKatmani.tabelalar || []).length };
  });
  sina('(c) Z resimleri yokken kod yedekleri çizilir (çimen tutamı + tabela direği)', () => {
    assert.ok(yedek.stroke > 0, `stroke ${yedek.stroke}`);
    assert.ok(yedek.tabela > 0, String(yedek.tabela));
    assert.ok(yedek.rect > 0, `fillRect ${yedek.rect}`);
  });
  sina('(c) yedek kurulumda sayfa hatası yok', () => { assert.deepEqual(hatalar, []); });
} finally {
  await b.close(); sunucu.close();
}
for (const s of sonuclar) console.log(s);
const basarisiz = sonuclar.filter((s) => s.startsWith('✗')).length;
if (hatalar.length) { console.log('Sayfa hataları:', hatalar.join(' | ')); }
if (basarisiz || hatalar.length) { console.log(`${basarisiz} başarısız, ${hatalar.length} sayfa hatası`); process.exit(1); }
console.log(`Tümü geçti (${sonuclar.length})`);
