// Hayalet Avcıları: DT1 — yolculuk görsellerinin (tema, Dünya Turu ailesi, nehir, çubuk) bağlanması.
// Kural: resim varsa resim, yoksa bugünkü kod çizimi; oyun sayıları ve çarpışma değişmez.
// Çalıştırma: node test/dt1.test.mjs
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

const listeSrc = fs.readFileSync(path.join(WWW, 'gorsel', 'liste.js'), 'utf8');
const GORSEL_LISTESI = new Function(listeSrc + '\nreturn GORSEL_LISTESI;')();

const sonuclar = [];
function sina(ad, fn) {
  try { fn(); sonuclar.push(`✓ ${ad}`); } catch (e) { sonuclar.push(`✗ ${ad}: ${e.message.split('\n')[0]}`); }
}
const AILELER = ['K', 'KS', 'KP', 'SH', 'SV', 'GA', 'GDA', 'DA', 'KA', 'LA'];

// (a) Anahtar ve dosya var mı
const beklenen = [];
for (let n = 1; n <= 6; n++) for (const s of ['nehir', 'kopru-acik', 'kopru-kapali', 'arena', 'tabela', 'bayrak']) beklenen.push(`yol${n}-${s}`);
for (const a of AILELER) for (const s of ['kopru-acik', 'kopru-kapali', 'arena']) beklenen.push(`yolA-${a}-${s}`);
beklenen.push('yol-nehir-ortak', 'yol-cubuk-baslangic', 'yol-cubuk-kopru', 'yol-cubuk-kilit', 'yol-cubuk-boss', 'yol-cubuk-hayalet');
sina('DT1 görselleri listede ve dosyada var', () => {
  for (const k of beklenen) {
    assert.ok(k in GORSEL_LISTESI, `${k} listede yok`);
    assert.ok(fs.existsSync(path.join(WWW, 'gorsel', `${k}.webp`)), `${k}.webp yok`);
  }
});

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
    typeof koprulerCiz === 'function' && typeof yolculukGecitCiz === 'function' && typeof updateHUD === 'function');
  await p.waitForFunction(({ aileler }) => {
    for (let n = 1; n <= 6; n++) for (const s of ['nehir', 'kopru-acik', 'kopru-kapali', 'arena', 'tabela', 'bayrak']) if (!gorsel(`yol${n}-${s}`)) return false;
    for (const a of aileler) for (const s of ['kopru-acik', 'kopru-kapali', 'arena']) if (!gorsel(`yolA-${a}-${s}`)) return false;
    for (const s of ['baslangic', 'kopru', 'kilit', 'boss', 'hayalet']) if (!gorsel(`yol-cubuk-${s}`)) return false;
    return !!gorsel('yol-nehir-ortak') && !!gorsel('tema1-su') && !!gorsel('tema2-su') && !!gorsel('kopru-acik') && !!gorsel('kopru-kapali');
  }, { aileler: AILELER }, { timeout: 90000 });

  await p.evaluate(() => {
    window.__kur = (level = 1) => {
      if (game.running) endGame(false);
      online.mode = null;
      startGame();
      game.paused = true; game.level = level;
      buildWalls(); buildWaters(); buildHazards();
      game.ghosts = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
      return game;
    };
    window.__tur = (kod) => {
      if (game.running) endGame(false);
      online.mode = null;
      startGame({ tur: true, ulke: ulkeKodla(kod).sira });
      game.paused = true;
      game.ghosts = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
      return game;
    };
    // drawImage/createPattern kaydedici (gor1c ile aynı, ölçü ve dönüşüm de kaydedilir)
    window.__ciz = (fn, n = 1, w = 600, h = 600) => {
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const x = cv.getContext('2d');
      const srcs = [], ims = [], pats = []; let desen = 0, cpSay = 0;
      const ad = x.drawImage.bind(x);
      x.drawImage = (im, ...a) => {
        const m = x.getTransform();
        const sw = im.naturalWidth || im.width || 0, sh = im.naturalHeight || im.height || 0;
        const dw = a.length >= 8 ? a[6] : a[2], dh = a.length >= 8 ? a[7] : a[3];
        ims.push({ src: im.src || '', sw, sh, dw, dh, b: m.b, c: m.c });
        if (im.src) srcs.push(im.src);
        return ad(im, ...a);
      };
      const cp = x.createPattern.bind(x);
      x.createPattern = (im, kip) => {
        cpSay++; desen++;
        pats.push({ src: im.src || '', canvas: (typeof HTMLCanvasElement !== 'undefined' && im instanceof HTMLCanvasElement), w: im.width, h: im.height });
        return cp(im, kip);
      };
      const fs = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'fillStyle');
      Object.defineProperty(x, 'fillStyle', {
        configurable: true,
        get() { return fs.get.call(x); },
        set(v) { if (typeof CanvasPattern !== 'undefined' && v instanceof CanvasPattern) desen++; fs.set.call(x, v); },
      });
      for (let i = 0; i < n; i++) fn(x);
      return { srcs, ims, pats, desen, cpSay, ctx: x, cv };
    };
    window.__sil = (onek) => {
      const ks = Object.keys(GORSEL).filter((k) => k.startsWith(onek));
      const y = ks.map((k) => [k, GORSEL[k]]); ks.forEach((k) => delete GORSEL[k]);
      return y;
    };
    window.__geri = (y) => { for (const [k, im] of y) GORSEL[k] = im; };
    window.__aileler = () => {
      const o = {};
      for (let i = 1; i <= ULKE_SAYISI; i++) { const u = ulkeSirada(i); if (!o[u.aile]) o[u.aile] = u.kod; }
      return o;
    };
    window.__rastgele = (fn) => { const asil = Math.random; let n = 0; Math.random = () => { n++; return asil(); }; try { fn(); } finally { Math.random = asil; } return n; };
    window.__gecitPiksel = () => {
      const cv = document.createElement('canvas'); cv.width = 600; cv.height = 600;
      const x = cv.getContext('2d');
      const z = game._yolculukDuzen.zones[0], egri = z._gecitEgri;
      const camx = egri.merkez - 300, camy = 0;
      game.camera = { x: camx, y: camy }; game.W = 600; game.H = 600;
      x.save(); x.translate(-camx, -camy); yolculukGecitCiz(x); x.restore();
      const sy = 300, wx = egri.merkez + egri.offset(sy);
      const d = x.getImageData(Math.round(wx - camx), sy, 1, 1).data;
      return { r: d[0], g: d[1], b: d[2], a: d[3] };
    };
  });

  // (b) Normal oyun, tema 4-6: tema parçaları ve çizimler
  const normal = await p.evaluate(() => {
    const A = YOLCULUK_AYAR, o = { parca: [], cizim: [] };
    for (const n of [4, 5, 6]) {
      __kur(n);
      o.parca.push([n, ['kopru-acik', 'kopru-kapali', 'arena', 'tabela', 'bayrak'].map((s) => yolculukTemaParca(s))]);
      const d = game._yolculukDuzen, z = d.zones[0], g = z.gate;
      game.W = 600; game.H = 600;
      // Kapalı köprü
      game.kopruAcik = new Array(6).fill(false); game._kopruAnim = {};
      game.camera = { x: g.x0 - 120, y: g.bridgeY0 - 120 };
      const kapali = __ciz((x) => yolculukCiz(x));
      // Açık köprü (güverte bandı)
      game.kopruAcik = new Array(6).fill(true); game._kopruAnim = {};
      game.camera = { x: Math.min(g.x0, g.x1) - 120, y: g.bridgeY0 - 120 };
      const acik = __ciz((x) => koprulerCiz(x));
      // Arena
      game.camera = { x: d.arena.x0 - 300, y: A.worldH / 2 - 300 };
      const arena = __ciz((x) => yolculukTemaParcalariCiz(x));
      // Tabela
      const b0 = yolculukBaslangic();
      game.camera = { x: b0.x - 300, y: b0.y - 300 };
      const tabela = __ciz((x) => yolculukTemaParcalariCiz(x));
      // Bayrak
      game.kopruAcik = new Array(6).fill(false); game.kopruAcik[0] = true;
      game.camera = { x: g.x1 - 300, y: g.cy - 300 };
      const bayrak = __ciz((x) => yolculukTemaParcalariCiz(x));
      o.cizim.push({ n, kapali, acik, arena, tabela, bayrak });
    }
    return o;
  });
  sina('normal oyun: beş tema parçası yol<n>-* döner (tema 4-6)', () => {
    for (const [n, p] of normal.parca) {
      for (const s of ['kopru-acik', 'kopru-kapali', 'arena', 'tabela', 'bayrak']) assert.ok(p.includes(`yol${n}-${s}`), `tema ${n} ${s}: ${p}`);
    }
  });
  sina('normal oyun tema 4-6: tema köprüsü/arenası/tabelası/bayrağı resimden, genel köprü çizilmez', () => {
    for (const c of normal.cizim) {
      const n = c.n;
      assert.ok(c.kapali.srcs.some((s) => s.includes(`yol${n}-kopru-kapali`)), `kapalı ${n}: ${c.kapali.srcs}`);
      assert.ok(!c.kapali.srcs.some((s) => s.endsWith('/kopru-kapali.webp')), `genel kapalı ${n}`);
      assert.ok(c.acik.srcs.some((s) => s.includes(`yol${n}-kopru-acik`)), `açık ${n}: ${c.acik.srcs}`);
      assert.ok(!c.acik.srcs.some((s) => s.endsWith('/kopru-acik.webp')), `genel açık ${n}`);
      assert.ok(c.arena.srcs.some((s) => s.includes(`yol${n}-arena`)), `arena ${n}: ${c.arena.srcs}`);
      assert.ok(c.tabela.srcs.some((s) => s.includes(`yol${n}-tabela`)), `tabela ${n}: ${c.tabela.srcs}`);
      assert.ok(c.bayrak.srcs.some((s) => s.includes(`yol${n}-bayrak`)), `bayrak ${n}: ${c.bayrak.srcs}`);
    }
  });

  // (c) Dünya Turu: her ailenin ilk ülkesi
  const tur = await p.evaluate(() => {
    const aileler = __aileler(), A = YOLCULUK_AYAR, o = { aileler, iller: [] };
    for (const aile of Object.keys(aileler)) {
      const kod = aileler[aile];
      __tur(kod);
      const p = { aile, kod, kopruAcik: yolculukTemaParca('kopru-acik'), kopruKapali: yolculukTemaParca('kopru-kapali'), arena: yolculukTemaParca('arena'),
        tabela: yolculukTemaParca('tabela'), bayrak: yolculukTemaParca('bayrak'), nehir: yolculukTemaParca('nehir') };
      const d = game._yolculukDuzen, z = d.zones[0], g = z.gate;
      game.W = 600; game.H = 600;
      game.kopruAcik = new Array(6).fill(false); game._kopruAnim = {};
      game.camera = { x: g.x0 - 120, y: g.bridgeY0 - 120 };
      p.cKapali = __ciz((x) => yolculukCiz(x));
      game.kopruAcik = new Array(6).fill(true); game._kopruAnim = {};
      game.camera = { x: Math.min(g.x0, g.x1) - 120, y: g.bridgeY0 - 120 };
      p.cAcik = __ciz((x) => koprulerCiz(x));
      game.camera = { x: d.arena.x0 - 300, y: A.worldH / 2 - 300 };
      p.cArena = __ciz((x) => yolculukTemaParcalariCiz(x));
      o.iller.push(p);
    }
    return o;
  });
  sina('Dünya Turu: aile köprüsü/arenası yolA-<aile>-* döner, tabela/bayrak/nehir null', () => {
    assert.equal(Object.keys(tur.aileler).length, 10);
    for (const p of tur.iller) {
      assert.equal(p.kopruAcik, `yolA-${p.aile}-kopru-acik`, p.aile);
      assert.equal(p.kopruKapali, `yolA-${p.aile}-kopru-kapali`, p.aile);
      assert.equal(p.arena, `yolA-${p.aile}-arena`, p.aile);
      assert.equal(p.tabela, null, p.aile);
      assert.equal(p.bayrak, null, p.aile);
      assert.equal(p.nehir, null, p.aile);
    }
  });
  sina('Dünya Turu: kapalı/açık köprü ve arena aile resminden, yol<n>-* çizilmez', () => {
    for (const p of tur.iller) {
      const a = p.aile;
      assert.ok(p.cKapali.srcs.some((s) => s.includes(`yolA-${a}-kopru-kapali`)), `${a} kapalı: ${p.cKapali.srcs}`);
      assert.ok(p.cAcik.srcs.some((s) => s.includes(`yolA-${a}-kopru-acik`)), `${a} açık: ${p.cAcik.srcs}`);
      assert.ok(p.cArena.srcs.some((s) => s.includes(`yolA-${a}-arena`)), `${a} arena: ${p.cArena.srcs}`);
      for (const c of [p.cKapali, p.cAcik, p.cArena]) assert.ok(!c.srcs.some((s) => /\/yol\d-/.test(s)), `${a} tema resmi: ${c.srcs}`);
    }
  });

  // (d) Dünya Turu nehri: kıyısız orta şerit, 160×256 tuval, en çok bir createPattern
  const nehirTur = await p.evaluate(() => {
    const aileler = __aileler();
    __tur(aileler.K);
    const z = game._yolculukDuzen.zones[0];
    game.W = 8000; game.H = 1000; game.camera = { x: 0, y: 0 };
    _gecitNehirDesen = null; // arka plan karesinin ısıttığı önbelleği sıfırla: 30 çizimde kaç createPattern?
    const r = __ciz((x) => yolculukGecitCiz(x), 30);
    const piksel = __gecitPiksel();
    return { pats: r.pats, cpSay: r.cpSay, desen: r.desen, piksel };
  });
  sina('Dünya Turu nehri 160×256 tuvalle en çok bir kez döşenir, kıyılı/ortak resim desen olmaz', () => {
    assert.ok(nehirTur.cpSay <= 1, `createPattern ${nehirTur.cpSay}`);
    assert.ok(nehirTur.pats.length >= 1, 'desen yok');
    for (const p of nehirTur.pats) {
      assert.equal(p.canvas, true, 'desen kaynağı tuval değil');
      assert.equal(p.w, 160); assert.equal(p.h, 256);
      assert.ok(!/yol\d-nehir|nehir-doku|yol-nehir-ortak/.test(p.src || ''), p.src);
    }
    assert.ok(nehirTur.piksel.b > nehirTur.piksel.r && nehirTur.piksel.b > nehirTur.piksel.g, JSON.stringify(nehirTur.piksel));
  });
  const nehirTema = await p.evaluate(() => {
    __kur(2);
    game.W = 8000; game.H = 1000; game.camera = { x: 0, y: 0 };
    const r = __ciz((x) => yolculukGecitCiz(x));
    return r.pats.map((p) => p.src);
  });
  sina('normal tema 2 nehri hâlâ tema2-su deseniyle döşenir', () => {
    assert.ok(nehirTema.some((s) => s.includes('tema2-su')), JSON.stringify(nehirTema));
  });

  // (e) yol*/yolA* resimleri oranını korur, döndürülmez
  sina('yol*/yolA* drawImage oranı korunur (±2 %), b = c = 0', () => {
    const hepsi = [];
    for (const c of normal.cizim) hepsi.push(c.kapali, c.acik, c.arena, c.tabela, c.bayrak);
    for (const p of tur.iller) hepsi.push(p.cKapali, p.cAcik, p.cArena);
    let say = 0;
    for (const c of hepsi) for (const d of c.ims) {
      const ad = (d.src || '').split('/').pop() || '';
      if (!ad.startsWith('yol')) continue;
      say++;
      assert.equal(d.b, 0, `b ${ad}`); assert.equal(d.c, 0, `c ${ad}`);
      if (d.sw && d.sh && d.dw && d.dh) {
        const a1 = d.sw / d.sh, a2 = d.dw / d.dh;
        assert.ok(Math.abs(a1 - a2) / a1 <= 0.02, `${ad}: ${a1} → ${a2}`);
      }
    }
    assert.ok(say > 0, 'hiç yol resmi çizilmedi');
  });

  // (f) Yolculuk çubuğu simgeleri ve hareketsizlik
  const bar = await p.evaluate(async () => {
    __kur(4); updateHUD();
    const yHud = document.getElementById('yolculuk-hud'), kapilar = [...yHud.querySelectorAll('.yc-kapi')];
    const resim = (el, parca) => el && el.classList.contains('yc-resim') && (el.style.backgroundImage || '').includes(parca);
    const ilk = {
      kapilar: kapilar.map((el) => resim(el, 'yol-cubuk-kilit')),
      tac: resim(yHud.querySelector('.yc-tac'), 'yol-cubuk-boss'),
      bas: resim(yHud.querySelector('.yc-bas'), 'yol-cubuk-baslangic'),
      hay: resim(yHud.querySelector('.yc-hayalet'), 'yol-cubuk-hayalet'),
      kalan: document.getElementById('yc-kalan').textContent,
      yuksek: [...yHud.querySelectorAll('.yc-kapi,.yc-tac,.yc-bas,.yc-hayalet')].map((el) => el.getBoundingClientRect().height),
    };
    game.kopruAcik[0] = true; updateHUD();
    const sonra = resim(kapilar[0], 'yol-cubuk-kopru');
    // 50 güncelleme: hiç değişiklik olmamalı
    let mutasyon = 0;
    const goz = new MutationObserver((m) => { mutasyon += m.length; });
    goz.observe(yHud, { attributes: true, childList: true, characterData: true, subtree: true });
    for (let i = 0; i < 50; i++) updateHUD();
    await new Promise((r) => setTimeout(r, 0));
    goz.disconnect(); goz.takeRecords();
    return { ilk, sonra, mutasyon, mutasyonSon: mutasyon };
  });
  sina('çubuk: altı geçit kilit, taç/boss, başlangıç, hayalet resimli; sayaç 👻 N', () => {
    const k = bar.ilk;
    assert.ok(k.kapilar.length === 6 && k.kapilar.every(Boolean), JSON.stringify(k.kapilar));
    assert.equal(k.tac, true); assert.equal(k.bas, true); assert.equal(k.hay, true);
    assert.match(k.kalan, /👻 \d+/);
    assert.ok(k.yuksek.every((h) => h <= 16), JSON.stringify(k.yuksek));
  });
  sina('ilk geçit açılınca köprü simgesi; 50 updateHUD hiç DOM değişikliği yapmaz', () => {
    assert.equal(bar.sonra, true);
    assert.equal(bar.mutasyonSon, 0, `${bar.mutasyonSon} mutasyon`);
  });

  // (g) Çubuk resimleri silinince yc-resim kalkar, kod simgeleri geri gelir
  const barYedek = await p.evaluate(() => {
    __kur(4); updateHUD();
    const yHud = document.getElementById('yolculuk-hud');
    const y = __sil('yol-cubuk-');
    updateHUD();
    const kalan = document.getElementById('yc-kalan');
    const o = {
      resim: yHud.querySelectorAll('.yc-resim').length,
      tacMetin: (yHud.querySelector('.yc-tac').textContent || '').includes('👑'),
      hayMetin: (kalan.querySelector('.yc-hayalet') || {}).textContent === '👻',
      kalan: kalan.textContent,
    };
    __geri(y); updateHUD();
    return o;
  });
  sina('çubuk resimleri yokken yc-resim kalkar, 👑/👻 ve sayaç kalır', () => {
    assert.equal(barYedek.resim, 0);
    assert.equal(barYedek.tacMetin, true);
    assert.equal(barYedek.hayMetin, true);
    assert.match(barYedek.kalan, /👻 \d+/);
  });

  // (h) Çubuk duraklat düğmesiyle çakışmaz; kutu resimlerle değişmez
  const kutular = [];
  for (const [w, h] of [[844, 390], [390, 844], [340, 700]]) {
    await p.setViewportSize({ width: w, height: h });
    kutular.push(await p.evaluate(() => {
      __kur(4); updateHUD();
      const a = document.getElementById('yolculuk-hud').getBoundingClientRect();
      const b = document.querySelector('.pause-btn').getBoundingClientRect();
      const r1 = { kalan: document.getElementById('yc-kalan').getBoundingClientRect().height, cubuk: document.getElementById('yc-cubuk').getBoundingClientRect().height };
      const y = __sil('yol-cubuk-');
      updateHUD();
      const a2 = document.getElementById('yolculuk-hud').getBoundingClientRect();
      const r2 = { kalan: document.getElementById('yc-kalan').getBoundingClientRect().height, cubuk: document.getElementById('yc-cubuk').getBoundingClientRect().height };
      __geri(y); updateHUD();
      return { w: innerWidth, h: innerHeight,
        kesisim: a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top,
        kutu: [a.left, a.top, a.right, a.bottom], kutu2: [a2.left, a2.top, a2.right, a2.bottom], r1, r2 };
    }));
  }
  await p.setViewportSize({ width: 390, height: 844 });
  sina('çubuk üç boyutta duraklat düğmesiyle çakışmaz; kutu resimlerle aynı (±0,5 px)', () => {
    for (const k of kutular) {
      assert.equal(k.kesisim, false, `${k.w}x${k.h}`);
      for (let i = 0; i < 4; i++) assert.ok(Math.abs(k.kutu[i] - k.kutu2[i]) <= 0.5, `${k.w}x${k.h} eksen ${i}: ${k.kutu[i]} / ${k.kutu2[i]} (kalan ${JSON.stringify(k.r1)}/${JSON.stringify(k.r2)})`);
    }
  });

  // (i) Dünya Turu'nda yolA ve ortak nehir resimleri silinince eski çizim
  const yedek = await p.evaluate(() => {
    const aileler = __aileler();
    __tur(aileler.K);
    const d = game._yolculukDuzen, z = d.zones[0], g = z.gate;
    game.W = 8000; game.H = 1000; game.camera = { x: 0, y: 0 };
    const yA = __sil('yolA-'), yN = __sil('yol-nehir-ortak');
    game.kopruAcik = new Array(6).fill(false); game._kopruAnim = {};
    const kapali = __ciz((x) => yolculukCiz(x));
    game.kopruAcik = new Array(6).fill(true); game._kopruAnim = {};
    const acik = __ciz((x) => koprulerCiz(x));
    game.kopruAcik = new Array(6).fill(false);
    game.camera = { x: d.arena.x0 - 300, y: YOLCULUK_AYAR.worldH / 2 - 300 };
    const arena = __ciz((x) => yolculukTemaParcalariCiz(x));
    game.W = 8000; game.H = 1000; game.camera = { x: 0, y: 0 };
    const nehir = __ciz((x) => yolculukGecitCiz(x));
    const su = yolculukNehirSuyu();
    __geri(yA); __geri(yN);
    return { kapali, acik, arena, nehir, suKaynakVar: !!su };
  });
  sina('Dünya Turu resimleri yokken köprü/arena/nehir eski çizimle çalışır', () => {
    assert.ok(yedek.kapali.srcs.some((s) => s.endsWith('/kopru-kapali.webp')), JSON.stringify(yedek.kapali.srcs));
    assert.ok(yedek.acik.srcs.some((s) => s.endsWith('/kopru-acik.webp')), JSON.stringify(yedek.acik.srcs));
    assert.ok(!yedek.arena.srcs.some((s) => s.includes('yolA-')), JSON.stringify(yedek.arena.srcs));
    assert.ok(yedek.nehir.pats.every((p) => !p.canvas), JSON.stringify(yedek.nehir.pats));
    assert.equal(yedek.suKaynakVar, true);
  });

  // (j) Çizimlerde Math.random yok
  const rastgele = await p.evaluate(() => {
    const aileler = __aileler();
    __tur(aileler.K);
    const d = game._yolculukDuzen, z = d.zones[0], g = z.gate;
    return __rastgele(() => {
      game.W = 8000; game.H = 1000; game.camera = { x: 0, y: 0 };
      game.kopruAcik = new Array(6).fill(false); game._kopruAnim = {};
      yolculukCiz(document.createElement('canvas').getContext('2d'));
      game.kopruAcik = new Array(6).fill(true);
      koprulerCiz(document.createElement('canvas').getContext('2d'));
      yolculukGecitCiz(document.createElement('canvas').getContext('2d'));
      yolculukTemaParcalariCiz(document.createElement('canvas').getContext('2d'));
    });
  });
  sina('yolculuk çizimlerinde Math.random yok', () => { assert.equal(rastgele, 0); });

  // (l) Başarım: Dünya Turu yolculuğu eski haritanın 1,3 katını geçmez
  const sure = await p.evaluate(() => {
    const olc = (fn, n = 120) => { const bas = performance.now(); for (let i = 0; i < n; i++) fn(); return performance.now() - bas; };
    const hazir = () => { game.paused = true; game.ghosts = []; game.pickups = []; game.projectiles = []; game.enemyProjectiles = []; game.effects = []; game.bot = null; };
    online.mode = 'host'; startGame(); hazir();
    game.player.x = game.worldW / 2; game.player.y = game.worldH / 2;
    game.camera.x = game.player.x - game.W / 2; game.camera.y = game.player.y - game.H / 2;
    for (let i = 0; i < 15; i++) render();
    const eski = Math.min(olc(render), olc(render), olc(render));
    online.mode = null; endGame(false);
    __kur(3);
    game.player.x = game.worldW / 2; game.player.y = game.worldH / 2;
    game.camera.x = game.player.x - game.W / 2; game.camera.y = game.player.y - game.H / 2;
    for (let i = 0; i < 15; i++) render();
    const tema = Math.min(olc(render), olc(render), olc(render));
    __tur('TR');
    game.player.x = game.worldW / 2; game.player.y = game.worldH / 2;
    game.camera.x = game.player.x - game.W / 2; game.camera.y = game.player.y - game.H / 2;
    for (let i = 0; i < 15; i++) render();
    const yeni = Math.min(olc(render), olc(render), olc(render));
    return { eski, tema, yeni };
  });
  console.log(`kare süresi: eski ${sure.eski.toFixed(1)} ms, tema yolculuğu ${sure.tema.toFixed(1)} ms, Dünya Turu ${sure.yeni.toFixed(1)} ms (eskiye ${(sure.yeni / sure.eski).toFixed(2)}x, temaya ${(sure.yeni / sure.tema).toFixed(2)}x)`);
  sina('Dünya Turu yolculuğunda kare süresi normal yolculuğun 1,3 katını geçmez', () => {
    assert.ok(sure.yeni <= sure.tema * 1.3, `${sure.yeni.toFixed(1)} ms / ${sure.tema.toFixed(1)} ms`);
  });

  sina('sayfa hatası yok', () => { assert.deepEqual(hatalar, []); });
} catch (e) {
  sonuclar.push(`✗ akış yarıda kaldı: ${e.message.split('\n')[0]}`);
} finally {
  await b.close();
  sunucu.close();
}
console.log(sonuclar.join('\n'));
const kotu = sonuclar.filter((s) => s.startsWith('✗')).length;
console.log(kotu ? `KALAN: ${kotu} sınama` : `TAMAM: ${sonuclar.length} sınama`);
process.exit(kotu ? 1 : 0);
