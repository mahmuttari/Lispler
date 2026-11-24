// Hayalet Avcıları: gerçek 3D avcılar (uc-avci.js, three.js) — çevrimdışı sınama.
// SwiftShader ile WebGL açık Chromium'da 3D çizim, dönüş, oyun döngüsü ve kapatma sınanır; ikinci tarayıcı
// varsayılan ayarlarla sayfanın yine de çalıştığını (2D'ye düşüş) doğrular. Çalıştırma: node test/uc-avci.test.mjs
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
const CHROMIUM = process.env.CHROMIUM || '/opt/pw-browsers/chromium';

async function sayfaAc(b, ayarlar = {}) {
  const hatalar = [];
  const p = await b.newPage({ viewport: { width: 844, height: 390 } });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('hayaletAvcilariDil', 'tr'); localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9'); });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof startGame === 'function' && !!window.UcAvci);
  if (ayarlar.webgl) await p.waitForFunction(() => window.UcAvci.hazir === true, null, { timeout: 15000 });
  return { p, hatalar };
}

// Canvas'ta saydam olmayan piksellerin sınırları ve kütlesi
function pikselOzet(x, w, h) {
  const d = x.getImageData(0, 0, w, h).data;
  let ust = h, alt = -1, sol = w, sag = -1, dolu = 0, solKutle = 0, sagKutle = 0;
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
    if (d[(yy * w + xx) * 4 + 3] > 128) {
      dolu++;
      if (yy < ust) ust = yy; if (yy > alt) alt = yy;
      if (xx < sol) sol = xx; if (xx > sag) sag = xx;
      if (xx < w / 2) solKutle++; else sagKutle++;
    }
  }
  return { ust, alt, sol, sag, dolu, solKutle, sagKutle };
}

const b1 = await chromium.launch({ executablePath: CHROMIUM, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let b2 = null;
try {
  const { p, hatalar } = await sayfaAc(b1, { webgl: true });

  // a) Modül hazır, WebGL desteği var
  const durum = await p.evaluate(() => ({ hazir: UcAvci.hazir, destek: UcAvci.destek(), tur: typeof UcAvci.ciz }));
  sina('UcAvci.hazir ve destek() true; ciz işlevi var', () => {
    assert.equal(durum.hazir, true);
    assert.equal(durum.destek, true);
    assert.equal(durum.tur, 'function');
  });

  // b) Kinkin'in üç kostümü: beklenen kutuda dolu piksel, en alt dolu satır ayak hizasında (±6 px)
  for (const idx of [0, 1, 2]) {
    const r = await p.evaluate((idx) => {
      const W = 200, H = 220, x = 100, y = 140, size = 80;
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const ctx = c.getContext('2d');
      drawCharacter(ctx, 'kinkin', idx, x, y, size, 0, 0, 0, 0);
      const d = ctx.getImageData(0, 0, W, H).data;
      let alt = -1, dolu = 0;
      for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) if (d[(yy * W + xx) * 4 + 3] > 128) { dolu++; if (yy > alt) alt = yy; }
      const kk = karakterKodKutusu('kinkin', idx);
      const s = size / 100;
      return { dolu, alt, ayak: y + kk.alt * s, ust: y + kk.alt * s - (kk.alt - kk.ust) * s * 1.06 };
    }, idx);
    sina(`Kinkin kostüm ${idx}: 3D çizim dolu ve ayak hizası doğru`, () => {
      assert.ok(r.dolu > 150, `dolu=${r.dolu}`);
      assert.ok(r.alt > r.ust - 20, `üst=${r.ust} alt=${r.alt}`);
      assert.ok(Math.abs(r.alt - r.ayak) <= 6, `alt=${r.alt} ayak=${r.ayak}`);
    });
  }

  // c) Dönüş: ön/arka farklı; sağ/sol profil yatay ayna benzer (kütle karşılaştırması)
  const yon = await p.evaluate(() => {
    const W = 200, H = 220;
    const ciz = (aci, kimlik) => {
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const ctx = c.getContext('2d');
      UcAvci.ciz(ctx, { charKey: 'kinkin', costumeIdx: 0, x: 100, y: 140, size: 80, aci, kimlik });
      return c.getContext('2d').getImageData(0, 0, W, H).data;
    };
    const fark = (a, b) => {
      let n = 0;
      for (let i = 0; i < a.length; i += 4) {
        if (a[i + 3] > 128 || b[i + 3] > 128) {
          if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 60) n++;
        }
      }
      return n;
    };
    const kutle = (d) => { let sol = 0, sag = 0; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 128) { if (x < W / 2) sol++; else sag++; } return { sol, sag }; };
    const on = ciz(0, 'c-on'), arka = ciz(Math.PI, 'c-arka');
    const sag = ciz(Math.PI / 2, 'c-sag'), sol = ciz(-Math.PI / 2, 'c-sol');
    return { farkOnArka: fark(on, arka), sag: kutle(sag), sol: kutle(sol) };
  });
  sina('aci 0 ile π farklı görüntü verir (ön/arka)', () => {
    assert.ok(yon.farkOnArka > 300, `fark=${yon.farkOnArka}`);
  });
  sina('aci π/2 ile -π/2 yatay ayna: sağ/sol piksel kütlesi yer değiştirir', () => {
    assert.ok(yon.sag.sag > yon.sag.sol, JSON.stringify(yon.sag));   // +X'e bakan: silah/gövde sağda
    assert.ok(yon.sol.sol > yon.sol.sag, JSON.stringify(yon.sol));   // -X'e bakan: solda
    assert.ok(Math.abs(yon.sag.sag - yon.sol.sol) < yon.sag.sag * 0.25, `${yon.sag.sag} / ${yon.sol.sol}`);
  });

  // c2) Kırpılma yok: 8 yönde de saç/tacın en üst boyası, ayrılan boy kutusunun en az 3 px altında
  const kirp = await p.evaluate(() => {
    const W = 200, H = 240, y = 150, size = 80, s = size / 100;
    const kk = karakterKodKutusu('kinkin', 0);
    const hedefBoy = (kk.alt - kk.ust) * s * 1.06;
    const ustSinir = y + kk.alt * s - hedefBoy; // ayrılan çizim kutusunun üstü
    const sonuc = [];
    for (let i = 0; i < 8; i++) {
      const aci = i * Math.PI / 4;
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const ctx = c.getContext('2d');
      UcAvci.ciz(ctx, { charKey: 'kinkin', costumeIdx: 0, x: 100, y, size, aci, aimRaise: 1, kimlik: `k-${i}` });
      const d = ctx.getImageData(0, 0, W, H).data;
      let ust = H;
      for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) if (d[(yy * W + xx) * 4 + 3] > 128 && yy < ust) ust = yy;
      sonuc.push({ aci: +aci.toFixed(2), ust, pay: +(ust - ustSinir).toFixed(1) });
    }
    return { sonuc, ustSinir };
  });
  sina('8 yönde de en üst dolu satır çizim kutusunun en az 3 px altında (kırpılma yok)', () => {
    for (const k of kirp.sonuc) assert.ok(k.pay >= 3, `aci=${k.aci} ust=${k.ust} üstSınır=${kirp.ustSinir} pay=${k.pay}`);
  });

  // c3) Silah elde ve önde: aci π/2 (sağa bakış), nişanda namlu gövde kutusunun sağına taşar
  const silahGorunur = await p.evaluate(() => {
    const W = 220, H = 240;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    UcAvci.ciz(ctx, { charKey: 'kinkin', costumeIdx: 0, x: 110, y: 160, size: 90, aci: Math.PI / 2, aimRaise: 1, kimlik: 'silah-on' });
    const d = ctx.getImageData(0, 0, W, H).data;
    const sayilar = new Array(W).fill(0);
    let sag = -1;
    for (let xx = 0; xx < W; xx++) for (let yy = 0; yy < H; yy++) {
      if (d[(yy * W + xx) * 4 + 3] > 128) { sayilar[xx]++; if (xx > sag) sag = xx; }
    }
    let govdeSag = -1; // gövde sütunları kalın; ince silah namlusu bu eşiğin altında kalır
    for (let xx = 0; xx < W; xx++) if (sayilar[xx] >= 14) govdeSag = xx;
    return { sag, govdeSag, fark: sag - govdeSag };
  });
  sina('nişanda (aci π/2) silah gövdenin sağına taşar (opak piksel var)', () => {
    assert.ok(silahGorunur.fark >= 4, JSON.stringify(silahGorunur));
  });

  // c4) Bot da UcAvci.ciz ile çizilir (charKey "bot", kimlik "bot")
  const bot = await p.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 200; c.height = 240;
    const ctx = c.getContext('2d');
    const asil = UcAvci.ciz;
    let kayit = null;
    UcAvci.ciz = function (x, o) { kayit = o; return asil.call(this, x, o); };
    const eskiOyuncu = game.player;
    game.player = { x: 200, y: 160, botTargetUntil: 0 };
    try {
      drawBot(ctx, { x: 100, y: 160, r: 18, hp: 6, maxHp: 6, walkTimer: 0, aimRaise: 0.8, shootRecoil: 0, hitFlash: 0 });
    } finally {
      UcAvci.ciz = asil; game.player = eskiOyuncu;
    }
    const d = ctx.getImageData(0, 0, 200, 240).data; let dolu = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 128) dolu++;
    return { charKey: kayit && kayit.charKey, kimlik: kayit && kayit.kimlik, dolu };
  });
  sina('Bot drawBot üzerinden UcAvci.ciz(charKey "bot", kimlik "bot") ile çizilir', () => {
    assert.equal(bot.charKey, 'bot');
    assert.equal(bot.kimlik, 'bot');
    assert.ok(bot.dolu > 100, `dolu=${bot.dolu}`);
  });

  // d) Oyun döngüsü: oyuncu UcAvci.ciz ile çizilir; ateş başlayınca namlu ucu oyuncunun yanında
  const dongu = await p.evaluate(async () => {
    const asil = UcAvci.ciz;
    window.__ucSay = 0;
    UcAvci.ciz = function (...a) { window.__ucSay++; return asil.apply(this, a); };
    startGame();
    game.spawnTimer = 1e9; game.bot = null; game.player.invuln = 0;
    game.ghosts = [{ x: game.player.x + 80, y: game.player.y, r: 22, speed: 0, hp: 999, maxHp: 999, size: 40 }];
    await new Promise((coz) => setTimeout(coz, 1000));
    const n = UcAvci.namlu('ben');
    const dpr = window.devicePixelRatio || 1, vs = game.viewScale || 1;
    const beklenen = { x: (game.player.x - game.camera.x) * dpr * vs, y: (game.player.y - game.camera.y) * dpr * vs };
    return {
      say: window.__ucSay, namlu: n, aim: game.player.aimRaise, aci: game.player.aci3d,
      uzak: n ? Math.hypot(n.x - beklenen.x, n.y - beklenen.y) : null,
    };
  });
  sina('startGame sonrası oyuncu UcAvci ile çizilir (1 sn içinde > 0 çağrı)', () => {
    assert.ok(dongu.say > 0, `çağrı=${dongu.say}`);
  });
  sina('ateş başlayınca namlu("ben") oyuncunun yanında bir nokta verir', () => {
    assert.ok(dongu.aim > 0.4, `aimRaise=${dongu.aim}`);
    assert.ok(dongu.namlu, 'namlu null');
    assert.ok(dongu.uzak < 140, `uzaklık=${dongu.uzak}`);
  });

  // e) UcAvci.kapat(): eski 2D çizim yolu; UcAvci.ciz hiç çağrılmaz
  const kapaliDurum = await p.evaluate(() => {
    UcAvci.kapat();
    window.__ucSay = 0;
    const c = document.createElement('canvas'); c.width = 200; c.height = 220;
    const x = c.getContext('2d');
    drawCharacter(x, 'kinkin', 0, 100, 140, 80, 0, 0, 0, 0);
    const d = x.getImageData(0, 0, 200, 220).data; let dolu = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 0) dolu++;
    return { hazir: UcAvci.hazir, destek: UcAvci.destek(), dolu, say: window.__ucSay };
  });
  sina('kapat() sonrası hazır/destek false, eski çizim dolu piksel üretir, UcAvci.ciz çağrılmaz', () => {
    assert.equal(kapaliDurum.hazir, false);
    assert.equal(kapaliDurum.destek, false);
    assert.ok(kapaliDurum.dolu > 100, `dolu=${kapaliDurum.dolu}`);
    assert.equal(kapaliDurum.say, 0);
  });

  sina('SwiftShader sayfasında sayfa hatası yok', () => { assert.deepEqual(hatalar, []); });

  // f) Varsayılan ayarlı ikinci tarayıcı: WebGL olmasa da sayfa çalışır, drawCharacter çizer, hata yok
  b2 = await chromium.launch({ executablePath: CHROMIUM });
  const ikinci = await sayfaAc(b2, { webgl: false });
  const varsayilan = await ikinci.p.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 200; c.height = 220;
    const x = c.getContext('2d');
    drawCharacter(x, 'kinkin', 0, 100, 140, 80, 0, 0, 0, 0);
    const d = x.getImageData(0, 0, 200, 220).data; let dolu = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 0) dolu++;
    return { hazir: !!UcAvci.hazir, dolu };
  });
  sina('varsayılan tarayıcıda sayfa çalışır ve drawCharacter çizer', () => {
    assert.ok(varsayilan.dolu > 100, `dolu=${varsayilan.dolu}`);
  });
  sina('varsayılan tarayıcıda sayfa hatası yok', () => { assert.deepEqual(ikinci.hatalar, []); });
} catch (e) {
  sonuclar.push(`✗ akış yarıda kaldı: ${e.message.split('\n')[0]}`);
} finally {
  await b1.close();
  if (b2) await b2.close();
  sunucu.close();
}
sonuclar.forEach((s) => console.log(s));
const kalan = sonuclar.filter((s) => s.startsWith('✗'));
assert.equal(kalan.length, 0, `${kalan.length} sınama başarısız`);
console.log(`TAMAM: ${sonuclar.length} sınama`);
