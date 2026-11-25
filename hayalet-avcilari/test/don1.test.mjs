// Hayalet Avcıları: yolculuk haritası süs objeleri (DON1) — çevrimdışı sınama.
// Her bölge ve başlangıç alanı 10-16 tohumlu obje alır; suya/köprüye/yuva/başlangıca girmez, 70 px aralık,
// yol garantisi korunur. Görseller yoksa obje konmaz. Çalıştırma: node test/don1.test.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WWW = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);
const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2', '.webp': 'image/webp', '.m4a': 'audio/mp4' };
// 1x1 saydam PNG: donati-* görselleri yerine sunulur (asıl dosyalar henüz yok)
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
let donatiSun = true;
const sunucu = http.createServer((q, r) => {
  const yol = decodeURIComponent(new URL(q.url, 'http://x').pathname);
  if (donatiSun && /\/gorsel\/donati-[^/]+\.webp$/.test(yol)) {
    r.writeHead(200, { 'content-type': 'image/png' }); return r.end(PNG);
  }
  const f = path.join(WWW, yol.replace(/^\/+/, '') || 'index.html');
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
const KUR = () => {
  window.__kur = (level = 1, tur = null) => {
    if (game.running) endGame(false);
    online.mode = null;
    startGame(tur ? { tur: true, ulke: ulkeKodla(tur).sira } : undefined);
    game.paused = true;
    game.player.invuln = 1e9; game.player.dead = false; game.player.dusus = null;
    game.level = level; buildWalls(); buildWaters(); buildHazards();
    game.ghosts = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
    return game;
  };
};
async function sayfaAc() {
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript(() => {
    localStorage.setItem('hayaletAvcilariDil', 'tr');
    localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9');
    localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1');
  });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof startGame === 'function' && typeof yolculukHaritaKur === 'function');
  await p.evaluate(KUR);
  if (donatiSun) {
    await p.evaluate(async () => {
      const adlar = ['fici', 'sandik', 'fener', 'bank', 'tabela', 'saman', 'cali', 'ciceklik', 'mantar', 'kutuk', 'tas', 'yaprak', 'balkabagi', 'araba', 'cit', 'korkuluk', 'mum', 'orumcek'];
      const cv = document.createElement('canvas'); cv.width = 32; cv.height = 32;
      const c = cv.getContext('2d'); c.fillStyle = '#a67c52'; c.fillRect(0, 0, 32, 32);
      const src = cv.toDataURL('image/png');
      const imler = await Promise.all(adlar.map((ad) => new Promise((coz) => { const im = new Image(); im.onload = () => coz(im); im.src = src; })));
      adlar.forEach((ad, i) => { GORSEL['donati-' + ad] = imler[i]; GORSEL_LISTESI['donati-' + ad] = src; });
    });
  }
  return p;
}
try {
  const p = await sayfaAc();

  // 1) Her bölge ve başlangıç alanı 10-16 obje alır
  const sayilar = await p.evaluate(() => {
    const hepsi = [];
    for (let L = 1; L <= 6; L++) {
      __kur(L);
      const list = game._yolculukDonatilar || [];
      const say = { bas: list.filter((o) => o.bolge === 0).length, bolgeler: [] };
      for (let i = 1; i <= 6; i++) say.bolgeler.push(list.filter((o) => o.bolge === i).length);
      hepsi.push(say);
    }
    return hepsi;
  });
  sina("başlangıç 10-16, her bölge 8-16 obje alır", () => {
    for (const s of sayilar) {
      assert.ok(s.bas >= 10 && s.bas <= 16, `başlangıç ${s.bas}`);
      s.bolgeler.forEach((n, i) => assert.ok(n >= 8 && n <= 16, `L bölge ${i + 1}: ${n}`)); // dar bölgede 4 yuva yer kaplar
    }
  });

  // 1b) Büyük objeler yuvarlak engel; düz objeler çarpışmaz
  const carpisma = await p.evaluate(() => {
    __kur(5);
    const buyuk = new Set(['fici', 'sandik', 'saman', 'araba', 'korkuluk', 'tas', 'kutuk', 'bank']);
    const kotu = [];
    for (const o of game._yolculukDonatilar || []) {
      const duvar = game.walls.find((w) => w.donati && w.x === o.x - o.w / 2 && w.y === o.y - o.h / 2);
      if (buyuk.has(o.tur)) {
        if (!duvar || !duvar.carpisma || duvar.carpisma[0].t !== 'd') kotu.push(o.tur + ':yok');
        else if (!engelCarpisir(game.walls, o.x, o.y, 1)) kotu.push(o.tur + ':carpismiyor');
        else if (Math.abs(duvar.carpisma[0].r - o.w * 0.4) > 0.01) kotu.push(o.tur + ':yaricap');
      } else if (duvar) kotu.push(o.tur + ':olmamali');
    }
    return kotu;
  });
  sina('büyük objeler yuvarlak engel (r = %40 genişlik), düz objeler çarpışmaz', () => { assert.deepEqual(carpisma, []); });

  // 2) Tohumlu: aynı bölüm/ülke aynı objeler, başka bölüm farklı
  const tohum = await p.evaluate(() => {
    const al = () => JSON.stringify((game._yolculukDonatilar || []).map((o) => [o.tur, o.x, o.y, o.w, o.h, o.bolge]));
    __kur(3); const a = al();
    __kur(3); const b2 = al();
    __kur(4); const c = al();
    return { ayni: a === b2, farkli: a !== c };
  });
  sina('aynı bölümden aynı objeler; başka bölümde farklı (tohumlu)', () => {
    assert.equal(tohum.ayni, true); assert.equal(tohum.farkli, true);
  });

  // 3) Suya, köprüye, hayalet yuvasına, başlangıç tabelasına ve birbirine çok yakın değil
  const konum = await p.evaluate(() => {
    const kotu = [];
    const kontrol = (etiket) => {
      const d = game._yolculukDuzen, list = game._yolculukDonatilar || [], bas = yolculukBaslangic();
      for (const o of list) {
        const x0 = o.x - o.w / 2, y0 = o.y - o.h / 2, x1 = o.x + o.w / 2, y1 = o.y + o.h / 2;
        if ((game.waters || []).some((s) => x0 < s.x + s.w && x1 > s.x && y0 < s.y + s.h && y1 > s.y)) kotu.push(`${etiket}:su`);
        for (const z of d.zones) {
          const g = z.gate;
          if (x1 > g.x0 - 140 && x0 < g.x1 + 140 && y1 > g.bridgeY0 - 140 && y0 < g.bridgeY1 + 140) kotu.push(`${etiket}:kopru`);
        }
        for (const yv of game.yuvalar || []) if (Math.hypot(yv.x - o.x, yv.y - o.y) < 90 + o.w / 2) kotu.push(`${etiket}:yuva`);
        if (Math.hypot(bas.x - o.x, bas.y - o.y) < 140) kotu.push(`${etiket}:baslangic`);
      }
      for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
        if (list[i].bolge === list[j].bolge && Math.hypot(list[i].x - list[j].x, list[i].y - list[j].y) < 70) kotu.push(`${etiket}:aralik`);
      }
    };
    for (let L = 1; L <= 6; L++) { __kur(L); kontrol(`L${L}`); }
    for (const kod of ['TR', 'FR', 'KE', 'JP', 'BR']) { __kur(ulkeKodla(kod).sira, kod); kontrol(kod); }
    return kotu;
  });
  sina('objeler suya/köprüye/yuva/başlangıca girmez, aralarında en az 70 px', () => { assert.deepEqual(konum, []); });

  // 4) Yol garantisi objelerle birlikte de geçer (1-6 + ülkeler)
  const yol = await p.evaluate(() => {
    const kotu = [];
    const dene = (etiket) => {
      const d = game._yolculukDuzen;
      const b = yolculukBaslangic(), arena = { x: d.arena.x0 + 200, y: 500 };
      game.kopruAcik.fill(true);
      if (!yolculukYolVarMi(b.x, b.y, arena.x, arena.y)) kotu.push(etiket);
    };
    for (let L = 1; L <= 6; L++) { __kur(L); dene(`L${L}`); }
    for (const kod of ['TR', 'FR', 'KE', 'JP', 'BR']) { __kur(ulkeKodla(kod).sira, kod); dene(kod); }
    return kotu;
  });
  sina('düz yürüme yolu objelerle birlikte de var (1-6 + ülkeler)', () => { assert.deepEqual(yol, []); });

  // 5) Çizim hatasız ve yalnız görünen objeler çizilir
  const cizim = await p.evaluate(() => {
    __kur(2);
    const o = (game._yolculukDonatilar || []).find((q) => q.bolge === 2);
    if (!o) return { varMi: false, sayi: 0 };
    game.camera.x = o.x - game.W / 2; game.camera.y = o.y - game.H / 2;
    const cv = document.createElement('canvas'); cv.width = 200; cv.height = 200;
    const c = cv.getContext('2d');
    let sayi = 0;
    const eski = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (...a) { sayi++; return eski.apply(this, a); };
    try { yolculukDonatilariCiz(c); } finally { CanvasRenderingContext2D.prototype.drawImage = eski; }
    return { varMi: true, sayi };
  });
  sina('çizim hatasız; görünen objeler resimle basılır', () => {
    assert.equal(cizim.varMi, true); assert.ok(cizim.sayi > 0, String(cizim.sayi));
  });

  // 6) Görsel yoksa obje konmaz ve hata çıkmaz
  donatiSun = false;
  const p2 = await sayfaAc();
  const bos = await p2.evaluate(() => { __kur(1); return (game._yolculukDonatilar || []).length; });
  sina('görseller yokken hiç obje konmaz', () => { assert.equal(bos, 0); });
  await p2.close();
} finally {
  await b.close(); sunucu.close();
}
for (const s of sonuclar) console.log(s);
const basarisiz = sonuclar.filter((s) => s.startsWith('✗')).length;
if (hatalar.length) { console.log('Sayfa hataları:', hatalar.join(' | ')); }
if (basarisiz || hatalar.length) { console.log(`${basarisiz} başarısız, ${hatalar.length} sayfa hatası`); process.exit(1); }
console.log(`Tümü geçti (${sonuclar.length})`);
