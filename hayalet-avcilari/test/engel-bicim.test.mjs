// Hayalet Avcıları: eğri hatlı, temaya özel engeller (3.13.0) — biçim, çarpışma, kılık, önbellek resmi ve aynılık sınaması.
// Biçim dikdörtgenin içinde; çarpışma biçimi izler (açılan köşeden geçilir, biçimin içinde çarpılır); kesişen iç bloklar
// duvar, diğerleri (i + bölüm) % 3; iki ayrı sayfa aynı bölümde aynı biçimi ve aynı resmi üretir; freeSpot biçime değmeyen
// yer bulur; önbellek resminde çarpışma alanının içi boyalı, biçimin (kıyı/kenar payıyla) dışı saydam; ekran döner ya da
// tablette ölçek değişince resim yeni ölçekle çizilir; bölüm geçişinde eski engel kalmaz.
// Çalıştırma: node hayalet-avcilari/test/engel-bicim.test.mjs [--ekran <klasör>]   (Playwright + Chromium; ağ gerekmez)
// --ekran: her tema için katalog ve oyun içi (TR 390 px, AR 340 px) görüntüleri klasöre yazar (gözle denetim).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WWW = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);
const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.m4a': 'audio/mp4' };
const sunucu = http.createServer((q, r) => {
  const f = path.join(WWW, decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html');
  if (!f.startsWith(WWW) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': TUR[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(0);
const adres = `http://127.0.0.1:${sunucu.address().port}/index.html`;
const ekranKlasoru = process.argv.includes('--ekran') ? process.argv[process.argv.indexOf('--ekran') + 1] : null;

const sonuclar = [];
function sina(ad, fn) {
  try { fn(); sonuclar.push(`✓ ${ad}`); } catch (e) { sonuclar.push(`✗ ${ad}: ${e.message.split('\n')[0]}`); }
}

const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const hatalar = [];
async function sayfaAc(secenek = {}, dil = 'tr') {
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, ...secenek });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript((dil) => { localStorage.setItem('hayaletAvcilariDil', dil); localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9'); }, dil);
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForTimeout(300);
  return p;
}
// Bir sayfada bölüm 1..n'in engel biçimleri (çevrimiçi kurucu: dünya merkezine göre, her cihazda aynı harita)
const biçimler = (p, n) => p.evaluate((n) => {
  online.mode = 'host';
  const out = [];
  for (let L = 1; L <= n; L++) {
    game.level = L; buildWalls(); buildWaters(); buildHazards();
    for (const liste of [game.walls, game.waters, game.spikes, game.lavas]) for (const o of liste) out.push({ x: o.x, y: o.y, tur: o.tur, tohum: o.tohum, bicim: o.bicim });
  }
  online.mode = null;
  return JSON.stringify(out);
}, n);
// Bir sayfada bölümlerin bütün engel resimlerinin özeti (toDataURL'nin FNV-1a özeti)
const resimler = (p, bolumler) => p.evaluate((bolumler) => {
  online.mode = 'host';
  const ozet = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16); };
  const out = [];
  for (const L of bolumler) {
    game.level = L; buildWalls(); buildWaters(); buildHazards();
    for (const liste of [game.walls, game.waters, game.spikes, game.lavas]) for (const o of liste) { const R = engelResmi(o); out.push(R ? `${o.tur}:${ozet(R.c.toDataURL())}` : `${o.tur}:yok`); }
  }
  online.mode = null;
  return out;
}, bolumler);
const kareBekle = (p, n) => p.evaluate((n) => new Promise((tamam) => { let k = 0; const f = () => (++k >= n ? tamam() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
// Görünen engellerin önbellek ölçeği engelOlcegi() ile aynı mı
const olcekDenetimi = (p) => p.evaluate(() => {
  const s = engelOlcegi(), cam = game.camera;
  const gor = [...game.walls, ...game.waters, ...game.spikes, ...game.lavas]
    .filter((o) => o.x < cam.x + game.W && o.x + o.w > cam.x && o.y < cam.y + game.H && o.y + o.h > cam.y);
  const kotu = gor.filter((o) => o._olcek !== s || !o._resim || o._resim.c.width !== Math.ceil(o.w * s));
  return { s, vs: game.viewScale, n: gor.length, kotu: kotu.length };
});
const oyunBaslat = (p) => p.evaluate(() => { save.playerName = 'Defne'; persistSave(); startGame(); game.player.invuln = 1e9; });

// Gözle denetim görüntüleri: her tema için katalog ve oyun içi (TR 390 px, AR 340 px)
async function ekranlar(klasor) {
  fs.mkdirSync(klasor, { recursive: true });
  const k = await sayfaAc({ viewport: { width: 980, height: 900 }, deviceScaleFactor: 1.5 });
  for (let tema = 0; tema < 6; tema++) {
    await k.evaluate((tema) => {
      game.running = false;
      const th = LEVEL_THEMES[tema], W = 980, H = 900;
      document.body.innerHTML = ''; document.body.style.margin = '0';
      const c = document.createElement('canvas'); c.width = W * 1.5; c.height = H * 1.5; c.style.width = W + 'px'; c.style.height = H + 'px';
      document.body.appendChild(c);
      const ctx = c.getContext('2d'); ctx.scale(1.5, 1.5);
      ctx.fillStyle = th.floor; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = th.grid; ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      const etiketler = [];
      const ekle = (tur, x, y, w, h, etiket, yon) => { etiketler.push([etiket, x, y + h + 16]); return engelOlustur({ x, y, w, h }, tur, tema, 7 + x * 13 + y * 7 + w, yon); };
      game.walls = [ekle('duvar', 20, 20, 180, 170, 'Duvar 180×170'), ekle('duvar', 230, 20, 110, 90, 'Duvar 110×90'), ekle('duvar', 370, 20, 90, 160, 'Duvar 90×160'),
        ekle('sinir', 490, 20, 470, 30, 'Sınır (üst)', 'ust'), ekle('sinir', 490, 90, 30, 150, 'Sınır (sol)', 'sol'), ekle('duvar', 560, 90, 160, 110, 'Duvar 160×110'),
        ekle('obje1', 20, 240, 180, 150, '1. obje 180×150'), ekle('obje1', 230, 240, 100, 90, '1. obje 100×90'), ekle('obje2', 370, 240, 170, 130, '2. obje 170×130'),
        ekle('obje2', 570, 240, 90, 90, '2. obje 90×90'), ekle('obje1', 20, 640, 150, 180, '1. obje 150×180'), ekle('obje2', 200, 640, 140, 180, '2. obje 140×180'),
        ekle('duvar', 370, 640, 80, 80, 'Duvar 80×80'), ekle('obje1', 480, 640, 80, 80, '1. obje 80×80'), ekle('obje2', 590, 640, 80, 80, '2. obje 80×80')];
      game.waters = [ekle('su', 20, 440, 200, 150, 'Su 200×150'), ekle('su', 250, 440, 120, 90, 'Su 120×90'), ekle('su', 700, 640, 170, 120, 'Su (kesişen)'), ekle('su', 780, 700, 150, 110, '')];
      game.spikes = [ekle('diken', 410, 440, 90, 90, 'Diken (ortak)')];
      game.lavas = [ekle('lav', 530, 470, 110, 90, 'Lav (ortak)')];
      game.camera = { x: 0, y: 0 }; game.W = W; game.H = H;
      engelleriCiz(ctx);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif';
      for (const [e, x, y] of etiketler) ctx.fillText(e, x, y);
      ctx.font = 'bold 18px sans-serif'; ctx.fillText(th.name, 760, 880);
    }, tema);
    await k.waitForTimeout(100);
    await k.screenshot({ path: path.join(klasor, `katalog-${tema}.png`) });
  }
  await k.close();
  for (const [dil, gen, boy] of [['tr', 390, 844], ['ar', 340, 740]]) {
    const p = await sayfaAc({ viewport: { width: gen, height: boy }, deviceScaleFactor: 2 }, dil);
    for (let tema = 0; tema < 6; tema++) {
      await p.evaluate((tema) => {
        save.playerName = 'Kiki'; persistSave();
        startGame(); game.player.invuln = 1e9;
        game.level = tema + 7; buildWalls(); buildWaters(); buildHazards();
        // görüş alanına en çok engel giren boş yer
        const W = game.W, H = game.H; let en = null;
        for (let x = 200; x < game.worldW - 200; x += 40) for (let y = 260; y < game.worldH - 260; y += 40) {
          if (collidesWalls(x, y, 26) || collidesWaters(x, y, 26) || collidesSpikes(x, y, 26) || collidesLavas(x, y, 26)) continue;
          const tam = (o) => o.x > x - W / 2 && o.x + o.w < x + W / 2 && o.y > y - H / 2 && o.y + o.h < y + H / 2;
          const puan = game.walls.slice(4).filter(tam).length * 3 + game.waters.filter(tam).length * 2 + game.spikes.concat(game.lavas).filter(tam).length * 2;
          if (!en || puan > en.puan) en = { x, y, puan };
        }
        game.player.x = en.x; game.player.y = en.y;
        game.ghosts = [];
      }, tema);
      await p.waitForTimeout(900);
      await p.evaluate(() => { game.ghosts = []; document.querySelectorAll('.toast, #toast').forEach((e) => e.classList.remove('show')); });
      await p.waitForTimeout(350);
      await p.screenshot({ path: path.join(klasor, `oyun-${dil}-${tema}.png`) });
    }
    await p.evaluate(() => { game.running = false; });
    await p.close();
  }
  sonuclar.push(`✓ ekran görüntüleri: ${klasor}`);
}

try {
  const p = await sayfaAc();

  // 1) Biçim (kıyı ve kenar payıyla) ve çarpışma parçaları dikdörtgenin içinde
  const kutu = await p.evaluate(() => {
    const TURLER = ['duvar', 'obje1', 'obje2', 'su', 'diken', 'lav'];
    const BOYUTLAR = [[80, 80], [180, 90], [90, 180], [180, 180]];
    const sinir = (q, b = 0) => q.t === 'd' ? [q.x - q.r - b, q.y - q.r - b, q.x + q.r + b, q.y + q.r + b]
      : q.t === 'e' ? [q.x - q.rx - b, q.y - q.ry - b, q.x + q.rx + b, q.y + q.ry + b] : [q.x - b, q.y - b, q.x + q.w + b, q.y + q.h + b];
    const tasan = [];
    for (let tema = 0; tema < 6; tema++) {
      for (const tur of TURLER) for (const [w, h] of BOYUTLAR) {
        const o = engelOlustur({ x: 300, y: 200, w, h }, tur, tema, 1000 + tema * 97 + w * 7 + h);
        const denetle = (q, b, ne) => { const [x0, y0, x1, y1] = sinir(q, b); if (x0 < -0.01 || y0 < -0.01 || x1 > w + 0.01 || y1 > h + 0.01) tasan.push(`${tema}/${tur}/${w}x${h} ${ne} ${q.t}`); };
        o.bicim.forEach((q) => denetle(q, o.pay, 'biçim+pay'));
        o.carpisma.forEach((q) => denetle(q, 0, 'çarpışma'));
      }
      for (const [yon, w, h] of [['ust', 1600, 30], ['alt', 1600, 30], ['sol', 30, 1200], ['sag', 30, 1200]]) {
        const o = engelOlustur({ x: 0, y: 0, w, h }, 'sinir', tema, 7, yon);
        for (const q of o.bicim.concat(o.carpisma)) {
          const [x0, y0, x1, y1] = sinir(q);
          const disari = yon === 'ust' ? y1 > h + 0.01 : yon === 'alt' ? y0 < -0.01 : yon === 'sol' ? x1 > w + 0.01 : x0 < -0.01;
          if (disari) tasan.push(`${tema}/sinir-${yon} ${q.t}`);
        }
      }
    }
    return tasan;
  });
  sina(`biçim ve çarpışma dikdörtgenin içinde (${kutu.length} taşma)`, () => { assert.deepEqual(kutu.slice(0, 5), []); });

  // 2) Çarpışma biçimi izler: biçimin içinde çarpılır; yama, göl ve plaka ailesinde en az bir köşe boş; dışarısı boş
  const carp = await p.evaluate(() => {
    const TURLER = ['duvar', 'obje1', 'obje2', 'su', 'diken', 'lav'];
    const sorun = [];
    for (let tema = 0; tema < 6; tema++) for (const tur of TURLER) for (const [w, h] of [[80, 80], [180, 90], [90, 180], [180, 180]]) {
      const o = engelOlustur({ x: 400, y: 300, w, h }, tur, tema, 5000 + tema * 31 + w + h * 3);
      let ic = null;
      for (let y = 0; y <= h && !ic; y += 3) for (let x = 0; x <= w && !ic; x += 3) if (engelUzaklik(o.carpisma, x, y) < -3) ic = { x, y };
      if (!ic || !engelCarpisir([o], o.x + ic.x, o.y + ic.y, 0)) sorun.push(`${tema}/${tur}/${w}x${h} içi çarpmıyor`);
      if (['yama', 'gol', 'plaka'].includes(o.aile)) {
        const koseler = [[2, 2], [w - 2, 2], [2, h - 2], [w - 2, h - 2]];
        if (!koseler.some(([x, y]) => !engelCarpisir([o], o.x + x, o.y + y, 1))) sorun.push(`${tema}/${tur}/${w}x${h} köşelerin hepsi dolu`);
      }
      if (engelCarpisir([o], o.x - 5, o.y + h / 2, 0) || engelCarpisir([o], o.x + w / 2, o.y + h + 5, 0)) sorun.push(`${tema}/${tur}/${w}x${h} dışarısı çarpıyor`);
    }
    return sorun;
  });
  sina(`çarpışma biçimi izler (${carp.length} sorun)`, () => { assert.deepEqual(carp.slice(0, 5), []); });

  // 3) Kılık: kesişen iç bloklar duvar; diğerleri (i + bölüm) % 3; 30 bölümde üç kılık da var
  const kilik = await p.evaluate(() => {
    online.mode = 'host';
    const sorun = [], gorulen = new Set();
    for (let L = 1; L <= 30; L++) {
      game.level = L; buildWalls();
      const ic = game.walls.slice(4);
      const kesisir = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
      ic.forEach((o, i) => {
        const beklenen = ic.some((b) => b !== o && kesisir(o, b)) ? 'duvar' : ['duvar', 'obje1', 'obje2'][(i + L) % 3];
        if (o.tur !== beklenen) sorun.push(`bölüm ${L} blok ${i}: ${o.tur} (beklenen ${beklenen})`);
        gorulen.add(o.tur);
      });
      game.walls.slice(0, 4).forEach((o, i) => { if (o.tur !== 'sinir' || o.yon !== ['ust', 'alt', 'sol', 'sag'][i]) sorun.push(`bölüm ${L} sınır ${i}: ${o.tur}/${o.yon}`); });
    }
    online.mode = null;
    return { sorun, gorulen: [...gorulen].sort() };
  });
  sina(`kılık kuralı (görülen: ${kilik.gorulen.join(', ')})`, () => {
    assert.deepEqual(kilik.sorun.slice(0, 5), []);
    assert.deepEqual(kilik.gorulen, ['duvar', 'obje1', 'obje2']);
  });

  // 4) Aynılık: iki ayrı sayfada aynı bölümlerin biçimleri birebir aynı
  const p2 = await sayfaAc();
  const [b1, b2] = await Promise.all([biçimler(p, 12), biçimler(p2, 12)]);
  sina(`iki sayfada 12 bölümün biçimleri aynı (${b1.length} bayt)`, () => { assert.ok(b1.length > 1000); assert.equal(b1, b2); });
  await p2.close();

  // 5) freeSpot'un bulduğu yer hiçbir engelin çarpışmasına değmez (Review Focus 4)
  const bos = await p.evaluate(() => {
    let kotu = 0;
    for (let L = 1; L <= 6; L++) {
      game.level = L; buildWalls(); buildWaters(); buildHazards();
      const engel = (a, b, r) => collidesWalls(a, b, r) || collidesWaters(a, b, r);
      for (let i = 0; i < 200; i++) {
        const y = freeSpot(40 + Math.random() * 1520, 40 + Math.random() * 1120, 22, engel);
        if (collidesWalls(y.x, y.y, 22) || collidesWaters(y.x, y.y, 22)) kotu++;
      }
    }
    return kotu;
  });
  sina(`freeSpot sonucu engele değmez (${bos} kötü)`, () => { assert.equal(bos, 0); });

  // 6) Kapsama: önbellek resminde çarpışma alanının içi (uzaklık < −2) boyalı; biçimin dışı (> pay + 3) saydam.
  //    Duvar ailesinde "biçim" ön yüzle birlikte (çarpışma parçaları): ön yüz biçimin d px altındadır.
  const kapsama = await p.evaluate(() => {
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
      for (const [yon, w, h] of [['ust', 1600, 30], ['alt', 1600, 30], ['sol', 30, 1200], ['sag', 30, 1200]]) {
        denetle(engelOlustur({ x: 0, y: 0, w, h }, 'sinir', tema, 11 + tema, yon), `${tema}/sinir-${yon}`);
      }
    }
    for (const tur of ['diken', 'lav']) for (const [w, h] of BOYUTLAR) denetle(engelOlustur({ x: 300, y: 200, w, h }, tur, 0, 3000 + w + h * 7), `${tur}/${w}x${h}`);
    return { sorun, temaSayisi: ENGEL_TEMALARI.length };
  });
  sina(`temaya özel ressamlar (${kapsama.temaSayisi} tema)`, () => { assert.equal(kapsama.temaSayisi, 6); });
  sina(`kapsama: çarpışma içi boyalı, biçim dışı saydam (${kapsama.sorun.length} sorun)`, () => { assert.deepEqual(kapsama.sorun.slice(0, 6), [], kapsama.sorun.slice(0, 8).join(' | ')); });

  // 7) Resim aynılığı: iki ayrı sayfada aynı bölümlerin önbellek resimleri birebir aynı (her tema bir kez; 8. bölümde
  //    diken ve lav da var)
  const p5 = await sayfaAc();
  const [r1, r2] = await Promise.all([resimler(p, [1, 2, 3, 4, 5, 6, 8]), resimler(p5, [1, 2, 3, 4, 5, 6, 8])]);
  sina(`iki sayfada engel resimleri aynı (${r1.length} resim)`, () => {
    assert.ok(r1.length > 20 && r1.some((x) => x.startsWith('lav:')) && r1.some((x) => x.startsWith('diken:')));
    assert.ok(!r1.some((x) => x.endsWith(':yok')));
    assert.deepEqual(r1, r2);
  });
  await p5.close();

  // 8) Ölçek değişimi (Review Focus 1): oyun sürerken ekran döner (844×390), sonra tablet boyuna geçer (viewScale 1,35)
  const p3 = await sayfaAc();
  await oyunBaslat(p3);
  await kareBekle(p3, 3);
  await p3.setViewportSize({ width: 844, height: 390 });
  await kareBekle(p3, 3);
  const donus = await olcekDenetimi(p3);
  await p3.setViewportSize({ width: 900, height: 1280 });
  await kareBekle(p3, 3);
  const buyuk = await olcekDenetimi(p3);
  sina(`ekran dönünce ve tablet boyunda önbellek yeni ölçekte (${donus.s} → ${buyuk.s}; ${donus.n} ve ${buyuk.n} engel)`, () => {
    assert.equal(donus.s, 1); assert.equal(buyuk.s, 1.35);
    assert.ok(donus.n > 0 && buyuk.n > 0);
    assert.equal(donus.kotu, 0); assert.equal(buyuk.kotu, 0);
  });

  // 9) Bölüm geçişi (Review Focus 3): nextLevel sonrası engellerin hepsi biçimli, yeni temada, eskisi listede yok
  const gecis = await p3.evaluate(() => {
    const onceki = new Set([...game.walls, ...game.waters, ...game.spikes, ...game.lavas]);
    nextLevel();
    const yeni = [...game.walls, ...game.waters, ...game.spikes, ...game.lavas], tema = (game.level - 1) % 6;
    return { level: game.level, n: yeni.length, bicimsiz: yeni.filter((o) => !o.bicim).length, temaDisi: yeni.filter((o) => o.tema !== tema).length, eski: yeni.filter((o) => onceki.has(o)).length };
  });
  await kareBekle(p3, 3);
  const gecisResim = await olcekDenetimi(p3);
  sina(`bölüm geçişinde yeni engeller (bölüm ${gecis.level}, ${gecis.n} engel)`, () => {
    assert.ok(gecis.n > 8);
    assert.deepEqual([gecis.bicimsiz, gecis.temaDisi, gecis.eski], [0, 0, 0]);
    assert.equal(gecisResim.kotu, 0);
  });
  await p3.close();

  // 10) Tablet ölçeği (Review Focus 2): dpr 2 × viewScale 1,35 → önbellek ölçeği 2'de sınırlı
  const p4 = await sayfaAc({ viewport: { width: 800, height: 1280 }, deviceScaleFactor: 2 });
  await oyunBaslat(p4);
  await kareBekle(p4, 3);
  const tablet = await olcekDenetimi(p4);
  sina(`tablette önbellek ölçeği 2 (viewScale ${tablet.vs}, ${tablet.n} engel)`, () => {
    assert.equal(tablet.vs, 1.35); assert.equal(tablet.s, 2);
    assert.ok(tablet.n > 0); assert.equal(tablet.kotu, 0);
  });
  await p4.close();

  sina('sayfa hatası yok', () => { assert.deepEqual(hatalar, []); });
  if (ekranKlasoru) await ekranlar(ekranKlasoru);
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
