// Hayalet Avcıları: GOR4 — kesilmiş ChatGPT efekt resimlerinin kod çiziminin yerine bağlanması
// (gökkuşağı, ejder alevi, bot ışını, kasırga, çalı gözleri, timsah, pençe, toz, ölüm pop'u, köprü, parıltı, can çerçevesi).
// Kural: resim varsa resim, yoksa bugünkü kod çizimi; oyun kuralları değişmez. Çalıştırma: node test/gor4.test.mjs
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
const yakin = (a, b, oran = 0.02) => Math.abs(a - b) <= Math.abs(b) * oran + 1e-6;
const varMi = (r, parca) => r.draws.some((d) => d.src.includes(parca));
const kutu = (r, parca) => r.draws.find((d) => d.src.includes(parca));

// (a) Anahtarlar listede ve dosya olarak var
const ANAHTAR = ['efekt-gokkusagi', 'efekt-ejder-alev', 'efekt-bot-isin', 'efekt-kasirga', 'efekt-cali-goz', 'timsah-bakis',
  'efekt-pence', 'efekt-toz', 'efekt-olum-pop', 'gol-kopru-tahta', 'efekt-parilti-kucuk', 'ui-can-cubugu'];
const ZORUNLU = ANAHTAR;
const listeMetni = fs.readFileSync(path.join(WWW, 'gorsel', 'liste.js'), 'utf8');
sina('anahtarlar GORSEL_LISTESI içinde ve dosya olarak var', () => {
  for (const k of ZORUNLU) {
    assert.ok(listeMetni.includes(`"${k}"`), `liste: ${k}`);
    assert.ok(fs.existsSync(path.join(WWW, 'gorsel', `${k}.webp`)), `dosya: ${k}`);
  }
});

const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const hatalar = [];
async function sayfaAc() {
  const p = await b.newPage({ viewport: { width: 844, height: 390 } });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.emulateMedia({ reducedMotion: 'no-preference' });
  await p.addInitScript(() => {
    localStorage.setItem('hayaletAvcilariDil', 'tr');
    localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9');
    localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1');
  });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  return p;
}

try {
  const p = await sayfaAc();
  await p.waitForFunction(() => typeof startGame === 'function' && typeof drawProjectile === 'function' && typeof calilariCiz === 'function' &&
    typeof timsahCiz === 'function' && typeof petSaldiriIzi === 'function' && typeof aeTozlariCiz === 'function' && typeof koprulerCiz === 'function');
  await p.waitForFunction((ks) => ks.every((k) => gorsel(k)), ANAHTAR, { timeout: 60000 });

  await p.evaluate(() => {
    window.__kur = (level = 1, ulke = null) => {
      if (game.running) endGame(false);
      online.mode = null;
      startGame(ulke ? { tur: true, ulke: ulkeKodla(ulke).sira } : undefined);
      game.level = level;
      buildWalls(); buildWaters(); buildHazards();
      zeminKatmaniKur();
      game.paused = true; game.player.invuln = 1e9;
      game.ghosts = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
      return game;
    };
    // Çizim kaydı: hedef dikdörtgen, kaynak src, o anki dönüşüm ve Math.random sayacı
    window.__kayit = (fn, w = 600, h = 600) => {
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const x = cv.getContext('2d');
      const r = { draws: [], grads: 0, random: 0 };
      const od = x.drawImage.bind(x);
      x.drawImage = (im, ...a) => {
        let dest = null;
        if (a.length >= 8) dest = a.slice(-4).map(Number);
        else if (a.length >= 4) dest = a.slice(-4).map(Number);
        else if (a.length >= 2) dest = [Number(a[0]), Number(a[1]), im.naturalWidth, im.naturalHeight];
        const m = x.getTransform();
        r.draws.push({ src: (im && im.src) || '', dest, b: m.b, c: m.c, nw: im && im.naturalWidth, nh: im && im.naturalHeight });
        return od(im, ...a);
      };
      const org = x.createRadialGradient.bind(x);
      x.createRadialGradient = (...a) => { r.grads++; return org(...a); };
      const or = Math.random; Math.random = () => { r.random++; return 0.5; };
      try { fn(x); } finally { Math.random = or; }
      return r;
    };
    window.__sil = (ks) => { const y = ks.map((k) => [k, GORSEL[k]]); ks.forEach((k) => delete GORSEL[k]); return y; };
    window.__geri = (y) => { for (const [k, im] of y) GORSEL[k] = im; };
  });


  // Her anahtar için: resim varken çizilir (src kaydı), silinince çizilmez (kod yedeği); Math.random yok
  const rapor = await p.evaluate(() => {
    __kur(1);
    game.camera.x = 0; game.camera.y = 0;
    game.kopruler = [
      { su: { x: 0, y: 0, w: 1, h: 1 }, yatay: true, a: 150, b: 450, c: 300 },
      { su: { x: 0, y: 0, w: 1, h: 1 }, yatay: false, a: 100, b: 300, c: 500 },
    ];
    game._kopruSular = game.waters;
    window.__gh = { x: 300, y: 300, size: 40, hp: 1, maxHp: 3, cikis: 0, isBoss: false };
    const ilk = document.createElement('canvas').getContext('2d'); drawGhost(ilk, window.__gh); // ilk çizim durumu
    const toz = (x) => { AE.tozlar.length = 0; AE.tozlar.push({ x: 300, y: 300, vx: 4, vy: -8, bas: performance.now() - 100, sure: 500 }); aeTozlariCiz(x, performance.now()); };
    const fonk = {
      'efekt-gokkusagi': (x) => drawProjectile(x, { x: 300, y: 300, vx: 400, vy: 0, gun: 'gokkusagi' }),
      'efekt-ejder-alev': (x) => drawProjectile(x, { x: 300, y: 300, vx: 300, vy: 100, gun: 'ejder' }),
      'efekt-bot-isin': (x) => drawProjectile(x, { x: 300, y: 300, vx: 300, vy: 0, charKey: 'bot' }),
      'efekt-kasirga': (x) => { const n = performance.now(); kasirgaCiz(x, 300, 300, n, n + 4000); },
      'efekt-cali-goz': (x) => caliGozleri(x, 300, 300, 0),
      'timsah-bakis': (x) => timsahCiz(x, { tur: 'sus', x: 300, y: 300, a: 0, t: 1.2 }),
      'efekt-pence': (x) => petSaldiriIzi(x, 'kedi', 1, 0.8),
      'efekt-toz': toz,
      'efekt-olum-pop': (x) => { AE.poplar.length = 0; AE.poplar.push({ g: { x: 300, y: 300, size: 40 }, bas: performance.now() - 60, boyut: 40 }); aeOlumPoplariCiz(x, performance.now()); },
      'gol-kopru-tahta': (x) => koprulerCiz(x),
      'efekt-parilti-kucuk': (x) => { x.fillStyle = '#fff'; animParilti(x, 300, 300, 4, 0.8); },
      'ui-can-cubugu': (x) => drawGhost(x, window.__gh),
    };
    const out = {};
    for (const k of Object.keys(fonk)) {
      const a = __kayit(fonk[k]);
      const y = __sil([k]);
      const b2 = __kayit(fonk[k]);
      __geri(y);
      out[k] = { a, b2 };
    }
    return out;
  });
  for (const k of ANAHTAR) {
    sina(`${k}: resim varken çizilir, yokken çizilmez (kod yedeği); Math.random yok`, () => {
      const r = rapor[k];
      assert.ok(varMi(r.a, `${k}.webp`), `${k} çizilmedi: ${JSON.stringify(r.a.draws.map((q) => q.src))}`);
      assert.ok(!varMi(r.b2, `${k}.webp`), `${k} silindi ama çizildi`);
      assert.equal(r.a.random, 0, `Math.random ${r.a.random}`);
    });
  }
  sina('oran korunur: köprü dışındakiler esnetilmez (ışınlar da kendi oranında)', () => {
    for (const k of ANAHTAR.filter((q) => q !== 'gol-kopru-tahta')) {
      const d = kutu(rapor[k].a, `${k}.webp`);
      assert.ok(d && yakin(Math.abs(d.dest[2] / d.dest[3]), d.nw / d.nh, 0.03), `${k} oran ${d && d.dest} ${d && d.nw}/${d && d.nh}`);
    }
  });
  sina('döndürme yalnız ışınlarda (gökkuşağı, alev, bot ışını) ve köprüde; öbürlerinde yok', () => {
    for (const k of ['efekt-kasirga', 'efekt-cali-goz', 'timsah-bakis', 'efekt-pence', 'efekt-toz', 'efekt-olum-pop', 'efekt-parilti-kucuk', 'ui-can-cubugu']) {
      const d = kutu(rapor[k].a, `${k}.webp`);
      assert.ok(d && Math.abs(d.b) < 1e-9 && Math.abs(d.c) < 1e-9, `${k} döndü b=${d && d.b}`);
    }
    const g = kutu(rapor['efekt-ejder-alev'].a, 'efekt-ejder-alev.webp');
    assert.ok(Math.abs(g.b) > 0.1, 'alev yöne döner');
  });
  sina('köprü: iki köprü, her biri tek parça (döşenmez)', () => {
    const n = rapor['gol-kopru-tahta'].a.draws.filter((q) => q.src.includes('gol-kopru-tahta')).length;
    assert.equal(n, 2, `köprü parça sayısı ${n}`);
  });

  // Kod yedeği gerçekten çizer: köprü, toz, can çubuğu
  const yedek = await p.evaluate(() => {
    const say = (k, fn) => {
      const y = __sil([k]);
      const cv = document.createElement('canvas'); cv.width = 600; cv.height = 600; const x = cv.getContext('2d');
      let n = 0;
      for (const m of ['fill', 'stroke', 'fillRect']) { const o = x[m].bind(x); x[m] = (...a) => { n++; return o(...a); }; }
      fn(x); __geri(y); return n;
    };
    return {
      kopru: say('gol-kopru-tahta', (x) => koprulerCiz(x)),
      toz: say('efekt-toz', (x) => { AE.tozlar.length = 0; AE.tozlar.push({ x: 300, y: 300, vx: 4, vy: -8, bas: performance.now() - 100, sure: 500 }); aeTozlariCiz(x, performance.now()); }),
      can: say('ui-can-cubugu', (x) => drawGhost(x, window.__gh)),
    };
  });
  sina('resim yokken kod çizimi çalışır (köprü, toz, can çubuğu)', () => {
    assert.ok(yedek.kopru > 10 && yedek.toz >= 1 && yedek.can >= 2, JSON.stringify(yedek));
  });

  // Kare süresi (perf1 gibi: 7 koşunun medyanı, eşik 1,3): efekt çizimini zorlayan döngü, resimli / resimsiz
  const perf = await p.evaluate(() => {
    const ctx = game.ctx;
    const doldur = () => {
      game.projectiles = [];
      for (let i = 0; i < 40; i++) game.projectiles.push({ x: 100 + i * 8, y: 150 + (i % 5) * 10, vx: 400, vy: 0, gun: i % 2 ? 'gokkusagi' : 'ejder' });
      AE.tozlar.length = 0;
      for (let i = 0; i < 40; i++) AE.tozlar.push({ x: 100 + i * 9, y: 200, vx: 3, vy: -8, bas: performance.now(), sure: 1e9 });
      AE.poplar.length = 0;
      for (let i = 0; i < 20; i++) AE.poplar.push({ g: { x: 100 + i * 15, y: 250, size: 40 }, bas: performance.now(), boyut: 40 });
    };
    const olc = () => {
      const a = [];
      for (let r = 0; r < 7; r++) {
        const bas = performance.now();
        for (let i = 0; i < 100; i++) {
          doldur();
          for (const pr of game.projectiles) drawProjectile(ctx, pr);
          aeTozlariCiz(ctx, performance.now());
          aeOlumPoplariCiz(ctx, performance.now() - 150);
          ctx.getImageData(0, 0, 1, 1);
        }
        a.push(performance.now() - bas);
      }
      a.sort((x, y) => x - y); return a[3];
    };
    __kur(1); game.camera.x = 0; game.camera.y = 0;
    olc(); // ısınma
    const yeni = olc();
    const y = __sil(['efekt-gokkusagi', 'efekt-ejder-alev', 'efekt-toz', 'efekt-olum-pop']);
    const eski = olc(); __geri(y);
    return { yeni, eski };
  });
  console.log(`PERF: resimli ${perf.yeni.toFixed(1)} ms / kodlu ${perf.eski.toFixed(1)} ms → oran ${(perf.yeni / perf.eski).toFixed(3)}`);
  sina('çizim süresi kod çiziminin 1,3 katını geçmez', () => {
    assert.ok(perf.yeni <= perf.eski * 1.3, `${perf.yeni.toFixed(1)} / ${perf.eski.toFixed(1)}`);
  });
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
