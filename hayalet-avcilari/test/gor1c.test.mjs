// Hayalet Avcıları: GOR1C — yolculuk tema parçaları (köprü, nehir, arena girişi, tabela, bayrak) çevrimdışı sınama.
// Kural: görsel varsa resim, yoksa bugünkü kod çizimi; oyun sayıları ve çarpışma değişmez. Çalıştırma: node test/gor1c.test.mjs
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

const varMi = (r, parca) => r.srcs.some((s) => s.includes(parca));
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
  await p.waitForFunction(() => typeof startGame === 'function' && typeof yolculukTemaParca === 'function' &&
    typeof yolculukTemaParcalariCiz === 'function' && typeof buildWalls === 'function');
  await p.waitForFunction(() => ['yol1-kopru-kapali', 'yol1-kopru-acik', 'yol1-nehir', 'yol1-arena', 'yol1-tabela', 'yol1-bayrak']
    .every((k) => gorsel(k)), null, { timeout: 40000 });
  await p.evaluate(() => {
    window.__kur = (level = 1) => {
      if (game.running) endGame(false);
      online.mode = null;
      startGame();
      game.paused = true;
      game.level = level;
      buildWalls(); buildWaters(); buildHazards();
      game.ghosts = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
      return game;
    };
    window.__ciz = (fn) => {
      const cv = document.createElement('canvas'); cv.width = 600; cv.height = 600;
      const x = cv.getContext('2d');
      let say = 0, desen = 0; const srcs = [], patSrcs = [];
      const ad = x.drawImage.bind(x); x.drawImage = (im, ...a) => { say++; if (im && im.src) srcs.push(im.src); return ad(im, ...a); };
      const cp = x.createPattern.bind(x); x.createPattern = (im, kip) => { desen++; if (im && im.src) patSrcs.push(im.src); return cp(im, kip); };
      const fs = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'fillStyle');
      Object.defineProperty(x, 'fillStyle', {
        configurable: true,
        get() { return fs.get.call(x); },
        set(v) { if (typeof CanvasPattern !== 'undefined' && v instanceof CanvasPattern) desen++; fs.set.call(x, v); },
      });
      fn(x);
      return { say, desen, srcs, patSrcs };
    };
    window.__sil = (onek) => {
      const ks = Object.keys(GORSEL).filter((k) => k.startsWith(onek));
      const y = ks.map((k) => [k, GORSEL[k]]); ks.forEach((k) => delete GORSEL[k]); return y;
    };
    window.__geri = (y) => { for (const [k, im] of y) GORSEL[k] = im; };
  });

  // 1) Yardımcı: tema 1'de parça var, Dünya Turu'nda ve resimsiz temada null
  const parca = await p.evaluate(() => {
    __kur(1);
    const o = { tema1: yolculukTemaParca('arena'), tema2: null, tur: null, yok: null };
    __kur(2); o.tema2 = yolculukTemaParca('arena');
    __kur(1); game.dunyaTuru = true; o.tur = yolculukTemaParca('arena'); game.dunyaTuru = false;
    o.yok = yolculukTemaParca('olmayan-parca');
    return o;
  });
  sina('yolculukTemaParca: tema 1 var; Dünya Turu, tema 2 ve olmayan parça null', () => {
    assert.equal(parca.tema1, 'yol1-arena');
    assert.equal(parca.tema2, null);
    assert.equal(parca.tur, null);
    assert.equal(parca.yok, null);
  });

  // 2) Köprü: kapalı tema resmi, açılışta %50'ye kadar kapalı sonra açık
  const kopru = await p.evaluate(() => {
    __kur(1);
    const z = game._yolculukDuzen.zones[0], g = z.gate;
    game.W = 400; game.H = 400; game.camera = { x: g.x0 - 100, y: g.bridgeY0 - 100 };
    const kur = (acik, anim) => {
      game.kopruAcik = new Array(6).fill(false);
      game._kopruAnim = {};
      if (acik) { game.kopruAcik[0] = true; game._kopruAnim[0] = anim; }
      return __ciz((x) => yolculukCiz(x));
    };
    return { kapali: kur(false, 0), yarim: kur(true, 0.5), son: kur(true, 0.15) };
  });
  sina('kapalı köprü tema resmiyle; açılış ilk yarı kapalı, sonra açık', () => {
    assert.ok(varMi(kopru.kapali, 'yol1-kopru-kapali'), JSON.stringify(kopru.kapali.srcs));
    assert.ok(varMi(kopru.yarim, 'yol1-kopru-kapali'), JSON.stringify(kopru.yarim.srcs));
    assert.ok(varMi(kopru.son, 'yol1-kopru-acik'), JSON.stringify(kopru.son.srcs));
    assert.ok(!kopru.son.srcs.some((s) => s.includes('an-kopru-in')), JSON.stringify(kopru.son.srcs));
  });

  // 3) Nehir: temanın kıyısız su dokusu (tema1-su) desen olarak döşenir (drawImage yerine createPattern)
  const nehir = await p.evaluate(() => {
    __kur(1);
    const z = game._yolculukDuzen.zones[0];
    game.W = 8000; game.H = 1000; game.camera = { x: 0, y: 0 };
    const r = __ciz((x) => yolculukGecitCiz(x));
    r.su = yolculukNehirSuyu() === gorsel('tema1-su');
    r.nehirResmi = yolculukNehirSuyu() === gorsel('yol1-nehir') || yolculukNehirSuyu() === gorsel('nehir-doku');
    return r;
  });
  sina('nehir şeridi temanın su dokusuyla döşenir (kıyılı nehir resmi kullanılmaz)', () => {
    assert.ok(nehir.desen >= 1, `createPattern ${nehir.desen}`);
    assert.equal(nehir.su, true, 'su dokusu tema1-su değil');
    assert.equal(nehir.nehirResmi, false, 'kıyılı nehir resmi kullanılıyor');
  });

  // 4) Arena girişi, başlangıç tabelası ve temizlenen bölge bayrağı
  const yerler = await p.evaluate(() => {
    __kur(1);
    const A = YOLCULUK_AYAR, d = game._yolculukDuzen;
    game.W = 600; game.H = 600;
    const ciz = () => __ciz((x) => yolculukTemaParcalariCiz(x));
    game.camera = { x: d.arena.x0 - 300, y: A.worldH / 2 - 300 };
    const arena = ciz();
    const b0 = yolculukBaslangic();
    game.camera = { x: b0.x - 300, y: b0.y - 300 };
    const tabela = ciz();
    game.kopruAcik = new Array(6).fill(false); game.kopruAcik[0] = true;
    const g = d.zones[0].gate;
    game.camera = { x: g.x1 - 300, y: g.cy - 300 };
    const bayrak = ciz();
    game.camera = { x: A.startW + A.zoneW * 2 - 300, y: 200 };
    game.kopruAcik = new Array(6).fill(false);
    const bos = ciz();
    return { arena, tabela, bayrak, bos };
  });
  sina('arena girişi resimden (220 px, yol ortası)', () => {
    assert.ok(varMi(yerler.arena, 'yol1-arena'), JSON.stringify(yerler.arena.srcs));
  });
  sina('başlangıç tabelası resimden (yol dışında)', () => {
    assert.ok(varMi(yerler.tabela, 'yol1-tabela'), JSON.stringify(yerler.tabela.srcs));
  });
  sina('temizlenen bölgenin bayrağı sağ bankta resimden', () => {
    assert.ok(varMi(yerler.bayrak, 'yol1-bayrak'), JSON.stringify(yerler.bayrak.srcs));
  });
  sina('ekranda olmayan parça çizilmez', () => {
    assert.equal(yerler.bos.say, 0, JSON.stringify(yerler.bos.srcs));
  });

  // 5) Tema görselleri silinince bugünkü kod çizimi hatasız çalışır (yol1-* hiç çizilmez)
  const yedek = await p.evaluate(() => {
    __kur(1);
    const A = YOLCULUK_AYAR, d = game._yolculukDuzen, z = d.zones[0], g = z.gate;
    game.W = 8000; game.H = 1000; game.camera = { x: 0, y: 0 };
    const y = __sil('yol1-');
    const y2 = __sil('tema1-su'), y3 = __sil('tema4-su');
    const o = {};
    game.kopruAcik = new Array(6).fill(false); game._kopruAnim = {};
    o.kapali = __ciz((x) => yolculukCiz(x));
    game.kopruAcik = new Array(6).fill(false); game.kopruAcik[0] = true; game._kopruAnim = { 0: 0.15 };
    o.acik = __ciz((x) => yolculukCiz(x));
    o.nehir = __ciz((x) => yolculukGecitCiz(x));
    o.parcalar = __ciz((x) => yolculukTemaParcalariCiz(x));
    __geri(y); __geri(y2); __geri(y3);
    return o;
  });
  sina('görseller yokken köprü kod çizimi çalışır (yol1 yok)', () => {
    assert.ok(!yedek.kapali.srcs.some((s) => s.includes('yol1-')), JSON.stringify(yedek.kapali.srcs));
    assert.ok(!yedek.acik.srcs.some((s) => s.includes('yol1-')), JSON.stringify(yedek.acik.srcs));
  });
  sina('görseller yokken nehir kod geçişi çalışır (desen yok)', () => {
    assert.equal(yedek.nehir.desen, 0, `createPattern ${yedek.nehir.desen}`);
  });
  sina('görseller yokken tema parçaları hiç çizilmez', () => {
    assert.equal(yedek.parcalar.say, 0, JSON.stringify(yedek.parcalar.srcs));
  });

  // 6) Az hareket: tema parçaları ve nehir zamanla değişmez (hiç animasyon yok)
  await p.emulateMedia({ reducedMotion: 'reduce' });
  const az = await p.evaluate(async () => {
    __kur(1);
    const A = YOLCULUK_AYAR, d = game._yolculukDuzen, g = d.zones[0].gate;
    game.W = 8000; game.H = 1000; game.camera = { x: 0, y: 0 };
    game.kopruAcik = new Array(6).fill(false); game.kopruAcik[0] = true;
    const ciz = () => __ciz((x) => { yolculukGecitCiz(x); yolculukTemaParcalariCiz(x); });
    const a = ciz();
    await new Promise((r) => setTimeout(r, 120));
    const c = ciz();
    return { az: yolculukAzHareket(), a, c };
  });
  sina('az harekette tema parçaları/nehir sabit kalır', () => {
    assert.equal(az.az, true);
    assert.deepEqual(az.a.srcs, az.c.srcs);
    assert.equal(az.a.desen, az.c.desen);
  });
} finally {
  await b.close(); sunucu.close();
}
for (const s of sonuclar) console.log(s);
const basarisiz = sonuclar.filter((s) => s.startsWith('✗')).length;
if (hatalar.length) { console.log('Sayfa hataları:', hatalar.join(' | ')); }
if (basarisiz || hatalar.length) { console.log(`${basarisiz} başarısız, ${hatalar.length} sayfa hatası`); process.exit(1); }
console.log(`Tümü geçti (${sonuclar.length})`);
