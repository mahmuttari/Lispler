// KPR2: dere, köprü resminin tamamında kemer açıklığına hizalanır. Çalıştırma: node test/kpr2.test.mjs
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
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript(() => {
    localStorage.setItem('hayaletAvcilariDil', 'tr');
    localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9');
    localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1');
  });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof startGame === 'function' && typeof yolculukKopruKutu === 'function' &&
    typeof kopruYukselti === 'function' && typeof kopruYanEngel === 'function' && typeof koprulerCiz === 'function');
  await p.waitForFunction(() => !!gorsel('yol1-kopru-acik') && !!gorsel('yol1-kopru-kapali') &&
    !!gorsel('kopru-acik') && !!gorsel('kopru-kapali') &&
    ['yol1', 'yol3', 'yol6', 'yolA-K', 'yolA-KS'].every((a) =>
      !!gorsel(`${a}-kopru-acik`) && !!gorsel(`${a}-kopru-kapali`)), null, { timeout: 90000 });

  await p.evaluate(() => {
    window.__kur = (level = 1, tur = null) => {
      if (game.running) endGame(false);
      online.mode = null;
      startGame(tur ? { tur: true, ulke: ulkeKodla(tur).sira } : undefined);
      game.paused = true;
      if (!tur) { game.level = level; buildWalls(); buildWaters(); buildHazards(); }
      game.ghosts = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
      game.player.invuln = 0; game.player.dead = false; game.player.dusus = null; game.player.gizli = false;
      return game;
    };
    window.__adim = (sn) => { for (let z = 0; z < sn; z += 1 / 60) update(1 / 60, (window.__saat = (window.__saat || 1e7) + 1000 / 60)); };
  });


  const sonuc = await p.evaluate(() => {
    const A = YOLCULUK_AYAR, out = [];
    for (const [level, tur] of [[1, null], [3, null], [6, null], [1, 'TR'], [1, 'FR']]) {
      __kur(level, tur);
      const d = game._yolculukDuzen, anahtar = yolculukKopruTabloAnahtari();
      game.kopruAcik = d.zones.map(() => true);
      const sorun = [];
      for (const [i, z] of d.zones.entries()) {
        const g = z.gate, e = z._gecitEgri, cx = (g.x0 + g.x1) / 2;
        const K = yolculukKopruKutu(anahtar, cx, g.cy);
        const su = game.kopruler[i].su;
        // Kapalı resim de aynı hizalama kutusunu kullanır.
        game.kopruAcik[i] = false;
        const cv = document.createElement('canvas'), ctx = cv.getContext('2d');
        // Çizim yolunun gerçek sınırlarını ve çarpışma parçalarını ayrı ölç.
        game.camera = { x: cx - 200, y: K.y - 30 };
        yolculukGecitCiz(ctx);
        const ciz = ctx.drawImage.bind(ctx);
        let kapali = false;
        ctx.drawImage = (im, ...a) => {
          if (im.src && im.src.includes(anahtar.replace('-acik', '-kapali'))) {
            if (Math.abs(a[0] + a[2] / 2 - cx) <= 2 && Math.abs(a[1] + a[3] - K.y - K.h) <= 2 &&
                a[2] <= K.w + 2 && a[3] <= K.h + 2) kapali = true;
          }
          return ciz(im, ...a);
        };
        yolculukCiz(ctx);
        if (!kapali) sorun.push(['kapali', i]);
        game.kopruAcik[i] = true;
        for (let y = K.y - 24; y <= K.y + K.h + 24; y += 1) {
          if (Math.abs(e.merkez + e.offset(y) - cx) > 4 || e.yari(y) > e.archHalf)
            sorun.push(['egri', i, y]);
          for (const q of su.carpisma) {
            if (su.y + q.y >= y || su.y + q.y + q.h <= y) continue;
            if (su.x + q.x < cx - e.archHalf - 1e-6 || su.x + q.x + q.w > cx + e.archHalf + 1e-6)
              sorun.push(['carpisma', i, y]);
          }
          if (y < K.y || y > K.y + K.h) continue;
          if (!ctx.isPointInPath(z._gecitYol, cx, y) ||
              ctx.isPointInPath(z._gecitYol, cx - e.archHalf - 1, y) ||
              ctx.isPointInPath(z._gecitYol, cx + e.archHalf + 1, y))
            sorun.push(['cizim', i, y]);
        }
      }
      const bas = yolculukBaslangic();
      const yol = yolculukYolVarMi(bas.x, bas.y, A.worldW - A.startW, A.worldH / 2);
      const k = game.kopruler[0];
      game.player.x = k.a - 55; game.player.y = k.c; game.player.invuln = 1e9;
      game.inputDir = { x: 1, y: 0 };
      __adim(2);
      game.inputDir = { x: 0, y: 0 };
      const oyuncu = game.player.x > k.b;
      spawnBot();
      const bot = game.bot;
      bot.x = k.a - 30; bot.y = k.c;
      game.player.x = k.b + 120; game.player.y = k.c;
      let enAdim = 0;
      for (let i = 0; i < 240; i++) {
        const x = bot.x;
        updateBot(1 / 60, i * 1000 / 60);
        enAdim = Math.max(enAdim, Math.abs(bot.x - x));
      }
      out.push({ level, tur, anahtar, sorun: sorun.slice(0, 10), yol, oyuncu, bot: bot.x > k.b && enAdim < 20 });
    }
    return out;
  });
  for (const q of sonuc) sina(`${q.tur || q.level}: dere, çarpışma, oyuncu/bot, arena yolu`, () => {
    if (q.tur === 'TR') assert.equal(q.anahtar, 'yolA-KS-kopru-acik');
    if (q.tur === 'FR') assert.equal(q.anahtar, 'yolA-K-kopru-acik');
    assert.deepEqual(q.sorun, []);
    assert.ok(q.yol, 'arena yolu');
    assert.ok(q.oyuncu, 'oyuncu geçemedi');
    assert.ok(q.bot, 'bot yürüyerek geçemedi');
  });
  // KPR2 öncesindeki sabit enli dere eğrisiyle aynı kamera ve çizim yükünü karşılaştır.
  const perf = await p.evaluate(() => {
    __kur(1);
    const z = game._yolculukDuzen.zones[0], g = z.gate, e = z._gecitEgri;
    const A = YOLCULUK_AYAR, bolum = game.level, ulke = yolculukUlkeKodu();
    const adet = 2 + Math.floor(yolculukRastgele(bolum, ulke, z.i, 210) * 2);
    const amp = 55 + yolculukRastgele(bolum, ulke, z.i, 211) * 30;
    const oranlar = adet === 2 ? [.85, .15] : [.7, .2, .1];
    const parcalar = oranlar.map((o, k) => ({
      amp: amp * o, dalga: 220 + yolculukRastgele(bolum, ulke, z.i, 220 + k) * 200,
      faz: yolculukRastgele(bolum, ulke, z.i, 240 + k) * Math.PI * 2,
    }));
    const eski = { ...e, yari: () => A.gateW / 2, offset(y) {
      const yari = (g.bridgeY1 - g.bridgeY0) / 2;
      const t = Math.max(0, Math.min(1, (Math.abs(y - g.cy) - yari) / (130 - yari)));
      if (!t) return 0;
      let s = 0;
      for (const p of parcalar) s += p.amp * Math.sin(2 * Math.PI * (y - g.cy) / p.dalga + p.faz);
      return s * t * t * (3 - 2 * t);
    }};
    const cv = document.createElement('canvas'); cv.width = 390; cv.height = 844;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    game.camera = { x: e.merkez - 195, y: g.cy - 422 };
    game.W = 390; game.H = 844;
    ctx.translate(-game.camera.x, -game.camera.y);
    const olc = (egri) => {
      z._gecitEgri = egri; z._gecitYol = null;
      for (let i = 0; i < 20; i++) yolculukGecitCiz(ctx);
      const bas = performance.now();
      for (let i = 0; i < 100; i++) { yolculukGecitCiz(ctx); ctx.getImageData(0, 0, 390, 844); }
      return performance.now() - bas;
    };
    const once = [], sonra = [];
    for (let i = 0; i < 7; i++) {
      if (i % 2) { sonra.push(olc(e)); once.push(olc(eski)); }
      else { once.push(olc(eski)); sonra.push(olc(e)); }
    }
    z._gecitEgri = e; z._gecitYol = null;
    return sonra.sort((a,b) => a-b)[3] / once.sort((a,b) => a-b)[3];
  });
  sina('dere çizimi temel sürümün en fazla 1,15 katı', () => assert.ok(perf <= 1.15, String(perf)));
  sina('sayfa hatası yok', () => assert.deepEqual(hatalar, []));
} catch (e) {
  sonuclar.push(`✗ akış yarıda kaldı: ${e.message.split('\n')[0]}`);
} finally {
  await b.close();
  sunucu.close();
}
sonuclar.forEach((s) => console.log(s));
assert.equal(sonuclar.filter((s) => s.startsWith('✗')).length, 0);
