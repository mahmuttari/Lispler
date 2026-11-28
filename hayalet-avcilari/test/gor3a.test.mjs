// Hayalet Avcıları: GOR3a — kesilmiş ChatGPT resimlerinin kod çiziminin yerine bağlanması
// (patlama, boss tehlike halkası, bot, seviye rozeti, zemin süsleri/lekeleri).
// Kural: resim varsa resim, yoksa bugünkü kod çizimi; oyun kuralları değişmez. Çalıştırma: node test/gor3a.test.mjs
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
const ZORUNLU = ['tehlike-halka', 'bot', 'ui-seviye', 'an-patlama-1', 'an-patlama-2', 'an-patlama-3',
  'sus-yaprak', 'sus-toprak-leke', 'sus-su-birikintisi', 'sus-cimen-serit', 'zemin-kiragi', 'zemin-catlak-tas'];
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
  await p.waitForFunction(() => typeof startGame === 'function' && typeof drawEffects === 'function' &&
    typeof drawBot === 'function' && typeof drawGhost === 'function' && typeof aeSeviyeEkle === 'function' &&
    typeof zeminKatmaniKur === 'function');
  await p.waitForFunction(() => ['an-patlama-1', 'an-patlama-2', 'an-patlama-3', 'tehlike-halka', 'bot', 'ui-seviye',
    'sus-yaprak', 'sus-toprak-leke', 'sus-su-birikintisi', 'sus-cimen-serit', 'zemin-kiragi', 'zemin-catlak-tas',
    'zemin-yosunlu-tas', 'zemin-yol-tas'].every((k) => gorsel(k)), null, { timeout: 60000 });

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

  // (b) Patlama: bomba sınıfı boyut = 2*r; kareler hazırsa boom gradyanı yok, silinince geri gelir
  const patlama = await p.evaluate(() => {
    __kur(1);
    game.running = true; game.paused = false;
    ensureAmmoStock(game.player.charKey).bomba = 1;
    const once = animEfektleri.length;
    useWeapon('bomba');
    const kare = animEfektleri.slice(once).find((e) => e.ad === 'patlama');
    game.paused = true;
    game.effects = [{ type: 'boom', x: 300, y: 300, r: 120, rMax: 200, life: 0.3, maxLife: 0.55 }];
    const a = __kayit((x) => drawEffects(x));
    // anim karesi: boyutu gerçek patlama kaydından al
    animEfektleri.length = 0;
    animEfektEkle('kare', 300, 300, { ad: 'patlama', sure: 0.6, boyut: kare ? kare.boyut : 0 });
    const af = animEfektleri[animEfektleri.length - 1];
    const kareCiz = __kayit((x) => animEfektleriCiz(x, af.bas + 50));
    animEfektleri.length = 0;
    const y = __sil(['an-patlama-2']);
    const b2 = __kayit((x) => drawEffects(x));
    __geri(y);
    return { boyut: kare && kare.boyut, a, kareCiz, b2 };
  });
  sina('patlama: bomba karesinin boyutu 2*200, kare hazırsa boom gradyanı çizilmez', () => {
    assert.equal(patlama.boyut, 400);
    assert.ok(!varMi(patlama.a, 'boom'), 'boom resim değil');
    assert.equal(patlama.a.grads, 0, `gradyan ${patlama.a.grads}`);
    const pk = kutu(patlama.kareCiz, 'an-patlama');
    assert.ok(pk, JSON.stringify(patlama.kareCiz.draws));
    assert.ok(yakin(Math.abs(pk.dest[2]), 400, 0.02), `kare kutusu ${pk.dest}`);
    assert.ok(patlama.b2.grads > 0, 'resim yokken gradyan beklenir');
  });

  // (c) Boss tehlike halkası
  const boss = await p.evaluate(() => {
    __kur(1);
    const g = { x: 300, y: 300, size: 80, hp: 10, maxHp: 10, isBoss: true, cikis: 0 };
    const warm = document.createElement('canvas'); warm.width = 600; warm.height = 600;
    drawGhost(warm.getContext('2d'), g); // __faz/__kirp ilk çizimde kurulur
    const a = __kayit((x) => drawGhost(x, g));
    const y = __sil(['tehlike-halka']);
    const b2 = __kayit((x) => drawGhost(x, g));
    __geri(y);
    return { a, b2 };
  });
  sina('boss: tehlike-halka çizilir (oran korunur), resim yokken gradyan', () => {
    const d = kutu(boss.a, 'tehlike-halka');
    assert.ok(d, JSON.stringify(boss.a.draws.map((q) => q.src)));
    assert.ok(yakin(d.dest[2] / d.dest[3], d.nw / d.nh, 0.02), `oran ${d.dest}`);
    assert.ok(!varMi(boss.b2, 'tehlike-halka'));
    assert.ok(boss.b2.grads > boss.a.grads, 'gradyan yedeği');
  });

  // (d) Bot resmi
  const bot = await p.evaluate(() => {
    __kur(1);
    const eski = window.UcAvci; window.UcAvci = { hazir: false };
    const bb = { x: 300, y: 300, walkTimer: 0, hitFlash: 0, hp: 3, maxHp: 3, aimRaise: 0, shootRecoil: 0 };
    const a = __kayit((x) => drawBot(x, bb));
    const y = __sil(['bot']);
    const b2 = __kayit((x) => drawBot(x, bb));
    __geri(y);
    window.UcAvci = eski;
    return { a, b2 };
  });
  sina('bot: resim oranı korunur, ayaklar b.y+44*0.62, etiket çizilir', () => {
    const d = kutu(bot.a, '/bot.webp');
    assert.ok(d, JSON.stringify(bot.a.draws.map((q) => q.src)));
    assert.ok(yakin(d.dest[2] / d.dest[3], d.nw / d.nh, 0.02), `oran ${d.dest}`);
    assert.ok(Math.abs((300 + d.dest[1] + d.dest[3]) - (300 + 44 * 0.62)) <= 2, `alt ${300 + d.dest[1] + d.dest[3]}`);
  });

  // bot resmi yokken kod çizimi (fillRect > 5)
  const botKod = await p.evaluate(() => {
    __kur(1);
    const eski = window.UcAvci; window.UcAvci = { hazir: false };
    const y = __sil(['bot']);
    const cv = document.createElement('canvas'); cv.width = 600; cv.height = 600; const x = cv.getContext('2d');
    let rect = 0; const or = x.fillRect.bind(x); x.fillRect = (...a) => { rect++; return or(...a); };
    drawBot(x, { x: 300, y: 300, walkTimer: 0, hitFlash: 0, hp: 3, maxHp: 3, aimRaise: 0, shootRecoil: 0 });
    __geri(y); window.UcAvci = eski;
    return rect;
  });
  sina('bot: resim yokken kod robotu çizilir (fillRect > 5)', () => {
    assert.ok(botKod > 5, `fillRect ${botKod}`);
  });

  // (e) Seviye rozeti
  const seviye = await p.evaluate(() => {
    const e = aeSeviyeEkle({ x: 300, y: 300 }, 3);
    const ef = AE.efektler.find((q) => q.tur === 'seviye');
    const a = __kayit((x) => aeEfektleriCiz(x, ef.bas + 50));
    __kayit((x) => aeEfektleriCiz(x, ef.bas + 5000)); // süre bitince listeden düşer
    const b2 = __kayit((x) => aeEfektleriCiz(x, ef.bas + 5000));
    return { a, b2 };
  });
  sina('seviye: ui-seviye efekti sırasında çizilir, bitince çizilmez', () => {
    assert.ok(varMi(seviye.a, 'ui-seviye'), JSON.stringify(seviye.a.draws.map((q) => q.src)));
    assert.ok(!varMi(seviye.b2, 'ui-seviye'));
  });

  // (f) Zemin süsleri ve lekeleri
  const zemin = await p.evaluate(() => {
    const al = (lvl) => { __kur(lvl); return { sus: (game._zeminKatmani.suslar || []).map((s) => s.ad), lekeler: (game._zeminKatmani.lekeler || []).map((q) => q.doku) }; };
    const t1 = al(1), t2 = al(2), t4 = al(4);
    const k1 = al(1);
    const u = ULKELER.find((q) => q.aile === 'KS');
    __kur(1, u.kod);
    const ks = { sus: (game._zeminKatmani.suslar || []).map((s) => s.ad), lekeler: (game._zeminKatmani.lekeler || []).map((q) => q.doku) };
    return { t1, t2, t4, k1, ks, ksKod: u.kod };
  });
  sina('zemin: tema 1 su-birikintisi, tema 2 yaprak süsü kullanır', () => {
    assert.ok(zemin.t1.sus.includes('sus-su-birikintisi'), JSON.stringify(zemin.t1.sus.slice(0, 30)));
    assert.ok(zemin.t2.sus.includes('sus-toprak-leke') || zemin.t2.sus.includes('sus-yaprak'), JSON.stringify(zemin.t2.sus.slice(0, 30)));
  });
  sina('zemin: aynı tohum iki kurulumda aynı süs listesi', () => {
    assert.deepEqual(zemin.t1.sus, zemin.k1.sus);
  });
  sina('zemin: leke dokuları kurala uyar (tema 1/2/4, KS)', () => {
    assert.ok(zemin.t1.lekeler.length >= 2);
    zemin.t1.lekeler.forEach((d, i) => assert.equal(d, i % 2 ? 'zemin-catlak-tas' : 'zemin-yosunlu-tas', `t1 ${i}`));
    zemin.t2.lekeler.forEach((d) => assert.equal(d, 'zemin-cimen'));
    zemin.t4.lekeler.forEach((d) => assert.equal(d, 'zemin-kiragi'));
    zemin.ks.lekeler.forEach((d, i) => assert.equal(d, i % 2 ? 'zemin-catlak-tas' : 'zemin-yol-tas', `ks ${i}`));
  });
  sina('zemin: KS ülkesi yeni süs ve lekeleri kullanır', () => {
    assert.ok(zemin.ks.sus.includes('sus-su-birikintisi') || zemin.ks.sus.includes('sus-yosun') || zemin.ks.sus.length > 0);
    assert.ok(zemin.ks.lekeler.length > 0);
  });

  // (g/h) Yeni resimlerin hedefi esnetilmez, çizim anında dönüş yok, Math.random yok
  sina('yeni resimler: oran korunur, ctx.rotate etkin değil, Math.random yok', () => {
    for (const r of [patlama.kareCiz, boss.a, bot.a, seviye.a]) {
      for (const d of r.draws) {
        if (!/an-patlama|tehlike-halka|\/bot\.webp|ui-seviye/.test(d.src)) continue;
        if (d.dest && d.nw) assert.ok(yakin(d.dest[2] / d.dest[3], d.nw / d.nh, 0.02), `oran ${d.src} ${d.dest}`);
        assert.equal(d.b, 0, `b ${d.src}`);
        assert.equal(d.c, 0, `c ${d.src}`);
      }
    }
    for (const r of [patlama.kareCiz, bot.a, seviye.a]) assert.equal(r.random, 0, `random ${r.random}`);
    assert.equal(boss.a.random, boss.b2.random, 'tehlike halkası ek Math.random çağırmaz');
  });
  await p.close();
} catch (e) {
  hatalar.push('TEST: ' + e.message);
}
try { await b.close(); } catch (_) {}
try { sunucu.close(); } catch (_) {}

sina('sayfa hatası yok', () => assert.deepEqual(hatalar, []));
console.log(sonuclar.join('\n'));
const basarisiz = sonuclar.filter((s) => s.startsWith('✗')).length;
if (basarisiz) process.exitCode = 1;
