// Hayalet Avcıları: TEM2 — ChatGPT zemin/su/nehir dokuları (çevrimdışı sınama).
// Dünya Turu zemini aile zemin resmini, tema 5 suyu doku-kaplica'yı, tema 2 geçit nehri tema2-su'yu kullanır;
// resim yoksa kod çizimine döner. Çalıştırma: node test/tem2.test.mjs
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
  await p.waitForFunction(() => typeof startGame === 'function' && typeof turZeminCiz === 'function' &&
    typeof temaDeseni === 'function' && typeof yolculukGecitCiz === 'function');
  await p.waitForFunction(() => ['aile-K-zemin', 'doku-kaplica', 'nehir-doku'].every((k) => gorsel(k)), null, { timeout: 40000 });
  await p.evaluate(() => {
    window.__kur = (level = 1, tur = null) => {
      if (game.running) endGame(false);
      online.mode = null;
      startGame(tur ? { tur: true, ulke: ulkeKodla(tur).sira } : undefined);
      game.paused = true;
      game.level = level;
      buildWalls(); buildWaters(); buildHazards();
      game.ghosts = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
      return game;
    };
    window.__ciz = (fn, olcek = 1) => {
      const cv = document.createElement("canvas"); cv.width = 600; cv.height = 600;
      const x = cv.getContext("2d");
      if (olcek !== 1) x.setTransform(olcek, 0, 0, olcek, 0, 0);
      let say = 0, desen = 0; const srcs = [], patSrcs = [];
      const ad = x.drawImage.bind(x); x.drawImage = (im, ...a) => { say++; if (im && im.src) srcs.push(im.src); return ad(im, ...a); };
      const cp = x.createPattern.bind(x); x.createPattern = (im, kip) => { desen++; if (im && im.src) patSrcs.push(im.src); return cp(im, kip); };
      const sonuc = fn(x);
      return { say, desen, srcs, patSrcs, sonuc };
    };
  });

  // 1) Dünya Turu zemini aile zemin resmiyle kurulur; resim yoksa kod çizimine döner
  const zemin = await p.evaluate(() => {
    __kur(ulkeKodla("UA").sira, "UA");
    game.W = 600; game.H = 600; game.camera = { x: 0, y: 0 };
    // Desen tuvali turZeminCiz içinde kurulur: her 2b bağlamın drawImage çağrısı sayılır
    const origG = HTMLCanvasElement.prototype.getContext;
    const olc = (fn) => {
      let say = 0; const srcs = [];
      HTMLCanvasElement.prototype.getContext = function (...a) {
        const c = origG.apply(this, a);
        if (a[0] === "2d" && !c.__sayac) {
          const od = c.drawImage.bind(c);
          c.__sayac = 1;
          c.drawImage = (im, ...r) => { say++; if (im && im.src) srcs.push(im.src); return od(im, ...r); };
        }
        return c;
      };
      let sonuc;
      try { sonuc = fn(); } finally { HTMLCanvasElement.prototype.getContext = origG; }
      return { say, srcs, sonuc };
    };
    // Farklı ölçek: desen önbelleği anahtarı değişsin, tuval yeniden kurulsun
    const resimli = olc(() => { const r = __ciz((c) => turZeminCiz(c), 2); return r.sonuc; });
    const yedek = GORSEL["aile-K-zemin"]; delete GORSEL["aile-K-zemin"];
    const resimsiz = olc(() => { const r = __ciz((c) => turZeminCiz(c), 3); return r.sonuc; });
    GORSEL["aile-K-zemin"] = yedek;
    return { resimli, resimsiz };
  });
  sina("Dünya Turu zemini aile zemin resmini desene çizer", () => {
    assert.equal(zemin.resimli.sonuc, true);
    assert.ok(zemin.resimli.say >= 1, `drawImage ${zemin.resimli.say}`);
    assert.ok(zemin.resimli.srcs.some((s) => s.includes("aile-K-zemin")), JSON.stringify(zemin.resimli.srcs));
  });
  sina("aile zemin resmi yoksa kod çizimine döner", () => {
    assert.equal(zemin.resimsiz.sonuc, true);
    assert.ok(!zemin.resimsiz.srcs.some((s) => s.includes("aile-K-zemin")), JSON.stringify(zemin.resimsiz.srcs));
  });

  // 2) Tema 5 suyu doku-kaplica ile döşenir; doku yoksa null (kod geçişi kalır)
  const su = await p.evaluate(() => {
    for (const k in _temaDesen) delete _temaDesen[k];
    let kaynak = null;
    const orig = CanvasRenderingContext2D.prototype.createPattern;
    CanvasRenderingContext2D.prototype.createPattern = function (im, ...a) { kaynak = im && im.src; return orig.call(this, im, ...a); };
    const varMi = temaDeseni(5, "su");
    const yedek = GORSEL["doku-kaplica"]; delete GORSEL["doku-kaplica"];
    for (const k in _temaDesen) delete _temaDesen[k];
    const yok = temaDeseni(5, "su");
    GORSEL["doku-kaplica"] = yedek;
    CanvasRenderingContext2D.prototype.createPattern = orig;
    return { varMi: !!varMi, kaynak, yok };
  });
  sina("tema 5 suyu doku-kaplica deseniyle döşenir", () => {
    assert.equal(su.varMi, true);
    assert.ok(su.kaynak && su.kaynak.includes("doku-kaplica"), String(su.kaynak));
    assert.equal(su.yok, null);
  });

  // 3) Tema 2 geçit nehri temanın kıyısız su dokusuyla (tema2-su) döşenir; kıyılı nehir-doku kanala uymadığı için kullanılmaz
  const nehir = await p.evaluate(() => {
    __kur(2);
    game.W = 8000; game.H = 1000; game.camera = { x: 0, y: 0 };
    _gecitNehirDesen = null;
    const r = __ciz((c) => yolculukGecitCiz(c));
    return { parca: yolculukTemaParca("nehir"), patSrcs: r.patSrcs, desen: r.desen };
  });
  sina("tema 2 geçit nehri tema2-su deseniyle döşenir", () => {
    assert.equal(nehir.parca, null);
    assert.ok(nehir.desen >= 1, `createPattern ${nehir.desen}`);
    assert.ok(nehir.patSrcs.some((s) => s.includes("tema2-su")), JSON.stringify(nehir.patSrcs));
  });

  sina("sayfa hatası yok", () => { assert.deepEqual(hatalar, []); });
} finally {
  await b.close();
  sunucu.close();
}

for (const s of sonuclar) console.log(s);
const kotu = sonuclar.filter((s) => s.startsWith("✗")).length;
process.exit(kotu ? 1 : 0);
