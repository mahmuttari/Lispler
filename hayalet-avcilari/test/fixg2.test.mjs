// Hayalet Avcıları FIXG2: harita duvarları dik durur (90° dönmez), kapalı köprüde kalan bant yok — çevrimdışı sınama.
// Çalıştırma: node test/fixg2.test.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const WWW = path.join(KOK, 'www');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);
const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2', '.webp': 'image/webp', '.m4a': 'audio/mp4' };
const sunucu = http.createServer((q, r) => {
  const f = path.join(WWW, decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html');
  if (!f.startsWith(WWW) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': TUR[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(0);
const adres = `http://127.0.0.1:${sunucu.address().port}/index.html`;
const EKRAN = path.join(KOK, 'test', 'ekran');

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
  await p.waitForFunction(() => typeof startGame === 'function' && typeof engelleriCiz === 'function' && typeof engelOlustur === 'function' && typeof yolculukCiz === 'function');

  await p.evaluate(() => {
    window.__kur = (level = 1) => {
      if (game.running) endGame(false);
      online.mode = null;
      startGame();
      game.level = level;
      buildWalls(); buildWaters(); buildHazards();
      game.paused = true; game.running = false;
      game.ghosts = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
      game.camera.x = game.player.x - game.W / 2; game.camera.y = game.player.y - game.H / 2;
      return game;
    };
    window.__sahteKur = () => {
      const sahte = document.createElement('canvas'); sahte.width = 60; sahte.height = 100;
      const sx = sahte.getContext('2d'); sx.fillStyle = '#3a7'; sx.fillRect(0, 0, 60, 100);
      window.__gercekGorsel = window.gorsel;
      window.gorsel = () => sahte;
      return { iw: 60, ih: 100 };
    };
    window.__sahteBirak = () => { if (window.__gercekGorsel) window.gorsel = window.__gercekGorsel; };
    window.__boyaDuvar = (tema, w, h, tohum) => {
      const o = engelOlustur({ x: 300, y: 200, w, h }, 'duvar', tema, tohum);
      const cv = document.createElement('canvas'); cv.width = Math.ceil(w * 2 + 400); cv.height = Math.ceil(h * 2 + 400);
      const ctx = cv.getContext('2d'); ctx.translate(200, 200);
      let kirp = 0, donme = 0; const cizimler = [];
      const ok = ctx.clip.bind(ctx), or = ctx.rotate.bind(ctx), od = ctx.drawImage.bind(ctx);
      ctx.clip = (...a) => { kirp++; return ok(...a); };
      ctx.rotate = (...a) => { donme++; return or(...a); };
      ctx.drawImage = (im, ...a) => { cizimler.push(a.slice(-4)); return od(im, ...a); };
      engelBoya(ctx, o);
      return { o, w, h, kirp, donme, cizimler };
    };
    window.__isit = () => {
      let kare = 0;
      while (kare < 400) {
        render(); kare++;
        if (kare < 60) continue;
        const eksik = [game.walls, game.waters, game.spikes, game.lavas]
          .some((l) => (l || []).some((o) => o.bicim && !o.gecit && !o.donati && !o._isinma));
        if (!eksik) break;
      }
      return kare;
    };
    window.__olc = (fn, n = 60) => {
      const ctx2 = game.ctx, gid = ctx2.getImageData.bind(ctx2), GW = game.W, GH = game.H;
      const a = [];
      for (let r = 0; r < 5; r++) {
        const bas = performance.now();
        for (let i = 0; i < n; i++) { fn(); gid(0, 0, GW, GH); }
        a.push(performance.now() - bas);
      }
      a.sort((x, y) => x - y);
      return a[2];
    };
  });

  // (a)+(b)+(c) 30 duvar: 3 klasik tema + TR/FR/CN; dikey duvarlarda resim ekseni dik ve oran korunur.
  const duvarlar = await p.evaluate(() => {
    const sahte = __sahteKur();
    const temalar = [0, 1, 2, 'TR', 'FR', 'CN'];
    const boyut = [[240, 80], [80, 220], [120, 120], [90, 260], [200, 70]];
    const out = [];
    let i = 0;
    for (const tema of temalar) for (let k = 0; k < 5; k++) {
      const [w, h] = boyut[(k + i) % boyut.length];
      const r = __boyaDuvar(tema, w, h, 8000 + (i++) * 151);
      out.push({ ad: `${tema}/${w}x${h}`, w, h, dikey: h >= 1.3 * w, kirp: r.kirp, donme: r.donme, cizimler: r.cizimler });
    }
    __sahteBirak();
    return { sahte, out };
  });
  sina('(a) 30 duvarda (en az 8 dikey) resim döndürülmez: rotate 0', () => {
    assert.equal(duvarlar.out.length, 30);
    assert.ok(duvarlar.out.filter((o) => o.dikey).length >= 8, 'dikey duvar az');
    for (const o of duvarlar.out) assert.equal(o.donme, 0, `${o.ad} rotate ${o.donme}`);
  });
  sina('(c) duvar resmi kırpılmaz: clip 0', () => {
    for (const o of duvarlar.out) assert.equal(o.kirp, 0, `${o.ad} clip ${o.kirp}`);
  });
  sina('(b) dikey duvar parçaları dik ve doğal en-boy oranında (±%5)', () => {
    const iw = duvarlar.sahte.iw, ih = duvarlar.sahte.ih, hedef = ih / iw;
    let parca = 0;
    for (const o of duvarlar.out) {
      if (!o.dikey) continue;
      assert.ok(o.cizimler.length >= 2, `${o.ad} parça yok`);
      for (const q of o.cizimler) {
        const oran = q[3] / q[2];
        assert.ok(Math.abs(oran / hedef - 1) <= 0.05, `${o.ad} oran ${oran.toFixed(3)} hedef ${hedef.toFixed(3)}`);
        parca++;
      }
    }
    assert.ok(parca >= 16, `dikey parça ${parca}`);
  });

  // (d) Çarpışma/harita kutuları değişmez.
  const carpisma = await p.evaluate(() => {
    const g = __kur(1);
    const W = g.worldW || 2000, H = g.worldH || 2000;
    const noktalar = [];
    for (let i = 0; i < 50; i++) noktalar.push([120 + ((i * 137) % (W - 240)), 120 + ((i * 271) % (H - 240))]);
    const olc = () => noktalar.map(([x, y]) => [engelCarpisir(g.walls, x, y, 20), engelMesafesi(g.walls, x, y, 20)]);
    const kutular = JSON.stringify(g.walls.map((o) => [o.x, o.y, o.w, o.h, o.carpisma]));
    const once = olc();
    for (const o of g.walls) engelResmi(o);
    const sonra = olc();
    return { once, sonra, kutular, n: noktalar.length };
  });
  sina('(d) 50 noktada engelCarpisir/engelMesafesi önbellekten önce = sonra', () => {
    assert.equal(carpisma.n, 50);
    assert.deepEqual(carpisma.sonra, carpisma.once);
  });

  // (e) Kapalı köprü: resim dalında fillRect yok; resim kutusu açık köprünün kutusuyla aynı, tabanı aynı.
  const kopru = await p.evaluate(() => {
    const sahte = document.createElement('canvas'); sahte.width = 400; sahte.height = 100;
    const sx = sahte.getContext('2d'); sx.fillStyle = '#c33'; sx.fillRect(0, 0, 400, 100);
    const gercek = window.gorsel;
    window.gorsel = (k) => k === 'kopru-kapali' || k === 'kopru-acik' || k === 'kilit-acik' ? sahte : null;
    const yedekDuzen = game._yolculukDuzen, yedekAcik = game.kopruAcik, yedekAnim = game._kopruAnim;
    const yedekCam = game.camera, yedekW = game.W, yedekH = game.H, dunya = game.dunyaTuru;
    const g = { x0: 150, x1: 250, bridgeY0: 90, bridgeY1: 210, cy: 150 };
    game._yolculukDuzen = { zones: [{ gate: g }] };
    game.kopruAcik = [false]; game._kopruAnim = [0];
    game.camera = { x: 0, y: 0 }; game.W = 400; game.H = 300; game.dunyaTuru = true;
    const cv = document.createElement('canvas'); cv.width = 400; cv.height = 300;
    const ctx = cv.getContext('2d'); ctx.fillStyle = '#0b2a55'; ctx.fillRect(0, 0, 400, 300);
    const taban = cv.getContext('2d').getImageData(200, 100, 1, 1).data.slice();
    let dolgu = 0; const cizimler = [];
    const of = ctx.fillRect.bind(ctx), od = ctx.drawImage.bind(ctx);
    ctx.fillRect = (...a) => { dolgu++; return of(...a); };
    ctx.drawImage = (im, ...a) => { cizimler.push(a.slice(-4)); return od(im, ...a); };
    yolculukCiz(ctx);
    const piksel = ctx.getImageData(200, 100, 1, 1).data.slice();
    const yari = (typeof KOPRU !== 'undefined' ? KOPRU.kalin : 56) / 2;
    const pay = typeof KOPRU !== 'undefined' ? KOPRU.karaPay : 30;
    const boyResim = typeof yolculukKopruResimBoyu === 'function' ? yolculukKopruResimBoyu() : g.bridgeY1 - g.bridgeY0;
    const acikX = g.x0 - pay - yari, acikW = (g.x1 - g.x0) + pay * 2 + yari * 2, acikAlt = (g.bridgeY0 + g.bridgeY1) / 2 + boyResim / 2;
    const buyuk = cizimler.filter((q) => q[2] > 100);
    game._yolculukDuzen = yedekDuzen; game.kopruAcik = yedekAcik; game._kopruAnim = yedekAnim;
    game.camera = yedekCam; game.W = yedekW; game.H = yedekH; game.dunyaTuru = dunya;
    window.gorsel = gercek;
    return { taban: Array.from(taban), piksel: Array.from(piksel), dolgu, acikX, acikW, acikAlt, buyuk };
  });
  sina('(e) kapalı köprü resminde dolgu yok; kutu açık köprüyle aynı, taban hizalı', () => {
    assert.equal(kopru.dolgu, 0, `fillRect ${kopru.dolgu}`);
    assert.deepEqual(kopru.piksel, kopru.taban, 'köprü yanında su pikseli değişmiş (bant)');
    assert.equal(kopru.buyuk.length, 1, JSON.stringify(kopru.buyuk));
    const q = kopru.buyuk[0];
    assert.ok(Math.abs(q[0] - kopru.acikX) < 1e-6, `x ${q[0]} / ${kopru.acikX}`);
    assert.ok(Math.abs(q[2] - kopru.acikW) < 1e-6, `w ${q[2]} / ${kopru.acikW}`);
    assert.ok(Math.abs((q[1] + q[3]) - kopru.acikAlt) < 1e-6, `taban ${q[1] + q[3]} / ${kopru.acikAlt}`);
  });

  // (f) PERF1 oranı: uzun harita, bölge 3 / eski harita ≤ 1.3.
  const eski = await p.evaluate(() => {
    online.mode = 'host'; startGame();
    game.paused = true; game.ghosts = []; game.pickups = []; game.projectiles = []; game.enemyProjectiles = []; game.effects = []; game.bot = null;
    game.player.x = game.worldW / 2; game.player.y = game.worldH / 2;
    game.camera.x = game.player.x - game.W / 2; game.camera.y = game.player.y - game.H / 2;
    const isinma = __isit(); const ms = __olc(render);
    online.mode = null; endGame(false);
    return { ms, isinma };
  });
  const yeni = await p.evaluate(() => {
    online.mode = 'host'; startGame({ tur: true, ulke: ulkeKodla('TR').sira });
    game.paused = true; game.ghosts = []; game.pickups = []; game.projectiles = []; game.enemyProjectiles = []; game.effects = []; game.bot = null;
    game.level = 3; buildWalls(); buildWaters(); buildHazards();
    const z = game._yolculukDuzen.zones[2];
    game.player.x = (z.x0 + z.gate.x0) / 2; game.player.y = game.worldH / 2;
    game.camera.x = game.player.x - game.W / 2; game.camera.y = game.player.y - game.H / 2;
    const isinma = __isit(); const ms = __olc(render);
    online.mode = null; endGame(false);
    return { ms, isinma };
  });
  const oran = yeni.ms / eski.ms;
  console.log(`PERF eski ${eski.ms.toFixed(2)} ms / yeni ${yeni.ms.toFixed(2)} ms → oran ${oran.toFixed(3)}`);
  sina('(g) uzun haritada çizim kare süresi eski haritanın 1,3 katını geçmez', () => {
    assert.ok(yeni.ms <= eski.ms * 1.3, `${yeni.ms.toFixed(1)} / ${eski.ms.toFixed(1)} (oran ${oran.toFixed(3)})`);
  });

  // (f) sayfa hatası yok
  sina('(f) sayfa hatası yok', () => { assert.deepEqual(hatalar, []); });

  // Ekran görüntüleri: dikey duvar tema 1, dikey duvar FR, kapalı köprü TR
  await p.waitForFunction(() => typeof gorsel === 'function' && !!gorsel('tema1-duvar') && !!gorsel('aile-K-duvar') && !!gorsel('kopru-kapali'), null, { timeout: 20000 }).catch(() => {});
  const cekDuvar = async (ad, tema) => {
    const r = await p.evaluate((tema) => {
      if (game.running) endGame(false);
      online.mode = null; startGame(); game.dunyaTuru = false;
      const o = engelOlustur({ x: 1000, y: 1000, w: 80, h: 220 }, 'duvar', tema, 5252 + (typeof tema === 'string' ? tema.charCodeAt(0) : tema));
      game.walls = [o]; game.waters = []; game.spikes = []; game.lavas = [];
      game.paused = true; game.running = false; game.ghosts = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
      game.camera.x = o.x + o.w / 2 - game.W / 2; game.camera.y = o.y + o.h / 2 - game.H / 2;
      game.player.x = o.x + o.w / 2; game.player.y = o.y + o.h + 300; game.player.dead = true;
      o._resim = null; o._olcek = 0; o._isinma = 0;
      render();
      const b = game.ctx.canvas.getBoundingClientRect();
      return { x: b.x, y: b.y, w: b.width, h: b.height };
    }, tema);
    const yarim = Math.round(Math.min(r.w, r.h) * 0.45);
    await p.screenshot({ path: path.join(EKRAN, `fixg2-${ad}.png`), clip: { x: Math.round(r.x + r.w / 2) - yarim, y: Math.round(r.y + r.h / 2) - yarim, width: yarim * 2, height: yarim * 2 } });
    return true;
  };
  const k1 = await cekDuvar('dikey-tema1', 0);
  const k2 = await cekDuvar('dikey-fr', 'FR');
  const k3 = await p.evaluate(() => {
    if (game.running) endGame(false);
    online.mode = 'host'; startGame({ tur: true, ulke: ulkeKodla('TR').sira });
    game.paused = true; game.running = false; game.ghosts = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
    game.kopruAcik = game._yolculukDuzen.zones.map(() => false);
    game._kopruAnim = game._yolculukDuzen.zones.map(() => 0);
    const z = game._yolculukDuzen.zones[0], g = z.gate;
    game.camera.x = (g.x0 + g.x1) / 2 - game.W / 2; game.camera.y = (g.bridgeY0 + g.bridgeY1) / 2 - game.H / 2;
    game.player.dead = true;
    render();
    const b = game.ctx.canvas.getBoundingClientRect();
    return { x: b.x, y: b.y, w: b.width, h: b.height };
  });
  const yarim3 = Math.round(Math.min(k3.w, k3.h) * 0.45);
  await p.screenshot({ path: path.join(EKRAN, 'fixg2-kopru-tr.png'), clip: { x: Math.round(k3.x + k3.w / 2) - yarim3, y: Math.round(k3.y + k3.h / 2) - yarim3, width: yarim3 * 2, height: yarim3 * 2 } });
  sina('ekran görüntüleri yazıldı (dikey tema1, dikey FR, kapalı köprü TR)', () => {
    for (const ad of ['fixg2-dikey-tema1.png', 'fixg2-dikey-fr.png', 'fixg2-kopru-tr.png']) assert.ok(fs.existsSync(path.join(EKRAN, ad)), ad);
    assert.ok(k1 && k2);
  });
} catch (e) {
  sonuclar.push(`✗ akış yarıda kaldı: ${e.message.split('\n')[0]}`);
} finally {
  for (const s of sonuclar) console.log(s);
  await b.close();
  sunucu.close();
}
