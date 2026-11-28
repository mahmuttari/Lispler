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
  await p.addInitScript(() => { localStorage.setItem('hayaletAvcilariDil', 'tr'); localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9'); localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1'); });
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

  // ---- 3D-2a: Veryi, Kornet, Marli, Kenit — her kostüm, 8 yön, silah, imza ----
  const YENI = ['veryi', 'kornet', 'mark', 'kent'];
  const yeni = await p.evaluate((chars) => {
    const W = 220, H = 260, OX = 110, OY = 170, BOY2 = 80, s = BOY2 / 100;
    const ciz = (ch, idx, aci, aim, kim) => {
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const x = c.getContext('2d');
      drawCharacter(x, ch, idx, OX, OY, BOY2, 0, 0, aim, 0, '', null, aci, kim);
      return x;
    };
    const ozet = (x) => {
      const d = x.getImageData(0, 0, W, H).data;
      let ust = H, alt = -1, dolu = 0;
      for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) {
        if (d[(yy * W + xx) * 4 + 3] > 128) { dolu++; if (yy < ust) ust = yy; if (yy > alt) alt = yy; }
      }
      return { ust, alt, dolu };
    };
    const say = (x, test) => {
      const d = x.getImageData(0, 0, W, H).data;
      let n = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 128 && test(d[i], d[i + 1], d[i + 2])) n++;
      return n;
    };
    const fark = (a, b) => {
      const da = a.getImageData(0, 0, W, H).data, db = b.getImageData(0, 0, W, H).data;
      let n = 0;
      for (let i = 0; i < da.length; i += 4) {
        if (da[i + 3] > 128 || db[i + 3] > 128) {
          if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) > 60) n++;
        }
      }
      return n;
    };
    const veri = {};
    for (const ch of chars) {
      const kos = COSTUMES[ch].length;
      const adim = [];
      for (let idx = 0; idx < kos; idx++) {
        const kk = karakterKodKutusu(ch, idx);
        const ayak = OY + kk.alt * s;
        const ustSinir = ayak - (kk.alt - kk.ust) * s * 1.06;
        const yonler = [];
        for (let i = 0; i < 8; i++) {
          const aci = i * Math.PI / 4;
          const o = ozet(ciz(ch, idx, aci, 1, `${ch}-${idx}-${i}`));
          yonler.push({ aci: +aci.toFixed(2), ust: o.ust, alt: o.alt, dolu: o.dolu, pay: o.ust - ustSinir, ayakFark: o.alt - ayak });
        }
        const sagKenar = (xx) => {
          const d = xx.getImageData(0, 0, W, H).data;
          let sag = -1;
          for (let px = 0; px < W; px++) for (let py = 0; py < H; py++) {
            if (d[(py * W + px) * 4 + 3] > 128 && px > sag) sag = px;
          }
          return sag;
        };
        // Silah öne çıkınca sağ kenar, nişansız duruşa göre belirgin sağa taşar (kalın çekiç başı da sayılır).
        const nisanSag = sagKenar(ciz(ch, idx, Math.PI / 2, 1, `${ch}-${idx}-silah`));
        const durusSag = sagKenar(ciz(ch, idx, Math.PI / 2, 0, `${ch}-${idx}-durus`));
        adim.push({ idx, yonler, ayak, silahFark: nisanSag - durusSag });
      }
      veri[ch] = { adim };
    }
    // İmzalar
    const imza = {};
    imza.kent = say(ciz('kent', 0, 0, 0, 'imza-kent'), (r, g, b) => r > 140 && g < 100 && b < 100);
    imza.kornetDeri = say(ciz('kornet', 0, 0, 0, 'imza-kornet'), (r, g, b) => Math.abs(r - 244) < 25 && Math.abs(g - 214) < 25 && Math.abs(b - 181) < 25);
    imza.markKahve = say(ciz('mark', 0, 0.6, 1, 'imza-mark'), (r, g, b) => r > 55 && r < 170 && g > 25 && g < 120 && b < 90 && g < r * 0.9);
    imza.veryiCelik = say(ciz('veryi', 0, Math.PI / 2, 1, 'imza-veryi'), (r, g, b) => r > 110 && g > 110 && b > 110 && Math.max(r, g, b) - Math.min(r, g, b) < 40);
    imza.kostumFark = {};
    for (const ch of chars) {
      const a = ciz(ch, 0, 0, 0, `kf-${ch}-0`), b = ciz(ch, 1, 0, 0, `kf-${ch}-1`), c = ciz(ch, 2, 0, 0, `kf-${ch}-2`);
      imza.kostumFark[ch] = [fark(a, b), fark(a, c)];
    }
    return { veri, imza };
  }, YENI);
  const insanlar = { veryi: 'Veryi', kornet: 'Kornet', mark: 'Marli', kent: 'Kenit' };
  for (const ch of YENI) {
    for (const a of yeni.veri[ch].adim) {
      sina(`${insanlar[ch]} kostüm ${a.idx}: 8 yönde dolu, ayak hizasında, üstte kırpılma yok`, () => {
        for (const k of a.yonler) {
          assert.ok(k.dolu > 200, `aci=${k.aci} dolu=${k.dolu}`);
          assert.ok(Math.abs(k.ayakFark) <= 8, `aci=${k.aci} alt=${k.alt} ayak=${a.ayak}`);
          assert.ok(k.pay >= 3, `aci=${k.aci} pay=${k.pay}`);
        }
      });
      sina(`${insanlar[ch]} kostüm ${a.idx}: nişanda silah gövdenin önüne taşar`, () => {
        assert.ok(a.silahFark >= 3, `fark=${a.silahFark}`);
      });
    }
  }
  sina('Kenit\'in baş bölgesinde parlak kırmızı gözler var', () => { assert.ok(yeni.imza.kent > 8, `kırmızı=${yeni.imza.kent}`); });
  sina('Kornet\'te insan teni renginde piksel yok', () => { assert.equal(yeni.imza.kornetDeri, 0); });
  sina('Marli\'de kahverengi saç/çanta pikseli var', () => { assert.ok(yeni.imza.markKahve > 50, `kahve=${yeni.imza.markKahve}`); });
  sina('Veryi\'nin çelik çekici başı nişanda görünür', () => { assert.ok(yeni.imza.veryiCelik > 10, `çelik=${yeni.imza.veryiCelik}`); });
  for (const ch of YENI) {
    sina(`${insanlar[ch]}: kostüm renkleri birbirinden farklı`, () => {
      const [f1, f2] = yeni.imza.kostumFark[ch];
      assert.ok(f1 > 100 && f2 > 100, `fark0-1=${f1} fark0-2=${f2}`);
    });
  }

  // ---- 3D-2b: Ponko, Güllu, Rani, Beri — her kostüm, 8 yön, silah, imza ----
  const YENI2 = ['ponko', 'gul', 'rani', 'beti'];
  const yeni2 = await p.evaluate((chars) => {
    const W = 220, H = 260, OX = 110, OY = 170, BOY2 = 80, s = BOY2 / 100;
    const ciz = (ch, idx, aci, aim, kim) => {
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const x = c.getContext('2d');
      drawCharacter(x, ch, idx, OX, OY, BOY2, 0, 0, aim, 0, '', null, aci, kim);
      return x;
    };
    const ozet = (x) => {
      const d = x.getImageData(0, 0, W, H).data;
      let ust = H, alt = -1, dolu = 0;
      for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) {
        if (d[(yy * W + xx) * 4 + 3] > 128) { dolu++; if (yy < ust) ust = yy; if (yy > alt) alt = yy; }
      }
      return { ust, alt, dolu };
    };
    const say = (x, test) => {
      const d = x.getImageData(0, 0, W, H).data;
      let n = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 128 && test(d[i], d[i + 1], d[i + 2])) n++;
      return n;
    };
    const fark = (a, b) => {
      const da = a.getImageData(0, 0, W, H).data, db = b.getImageData(0, 0, W, H).data;
      let n = 0;
      for (let i = 0; i < da.length; i += 4) {
        if (da[i + 3] > 128 || db[i + 3] > 128) {
          if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) > 60) n++;
        }
      }
      return n;
    };
    // Görüntünün dikey kapsamına oranlı bantlarda en geniş dolu satır ve bölge piksel sayısı
    const bantlar = (x) => {
      const d = x.getImageData(0, 0, W, H).data;
      let ust = H, alt = -1;
      for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) if (d[(yy * W + xx) * 4 + 3] > 128) { if (yy < ust) ust = yy; if (yy > alt) alt = yy; }
      const h = Math.max(1, alt - ust + 1);
      const genislik = (a, b) => {
        let m = 0;
        for (let yy = ust + Math.floor(h * a); yy < Math.min(alt + 1, ust + Math.ceil(h * b)); yy++) {
          let sol = W, sag = -1;
          for (let xx = 0; xx < W; xx++) if (d[(yy * W + xx) * 4 + 3] > 128) { if (xx < sol) sol = xx; if (xx > sag) sag = xx; }
          if (sag >= sol) m = Math.max(m, sag - sol + 1);
        }
        return m;
      };
      const bolgeSay = (a, b, test) => {
        let n = 0;
        for (let yy = ust + Math.floor(h * a); yy < Math.min(alt + 1, ust + Math.ceil(h * b)); yy++) {
          for (let xx = 0; xx < W; xx++) {
            const i = (yy * W + xx) * 4;
            if (d[i + 3] > 128 && test(d[i], d[i + 1], d[i + 2])) n++;
          }
        }
        return n;
      };
      return { genislik, bolgeSay };
    };
    const sagKenar = (xx) => {
      const d = xx.getImageData(0, 0, W, H).data;
      let sag = -1;
      for (let px = 0; px < W; px++) for (let py = 0; py < H; py++) {
        if (d[(py * W + px) * 4 + 3] > 128 && px > sag) sag = px;
      }
      return sag;
    };
    const veri = {};
    for (const ch of chars) {
      const kos = COSTUMES[ch].length;
      const adim = [];
      for (let idx = 0; idx < kos; idx++) {
        const kk = karakterKodKutusu(ch, idx);
        const ayak = OY + kk.alt * s;
        const ustSinir = ayak - (kk.alt - kk.ust) * s * 1.06;
        const yonler = [];
        for (let i = 0; i < 8; i++) {
          const aci = i * Math.PI / 4;
          const o = ozet(ciz(ch, idx, aci, 1, `${ch}-${idx}-${i}`));
          yonler.push({ aci: +aci.toFixed(2), ust: o.ust, alt: o.alt, dolu: o.dolu, pay: o.ust - ustSinir, ayakFark: o.alt - ayak });
        }
        const nisanSag = sagKenar(ciz(ch, idx, Math.PI / 2, 1, `${ch}-${idx}-silah`));
        const durusSag = sagKenar(ciz(ch, idx, Math.PI / 2, 0, `${ch}-${idx}-durus`));
        adim.push({ idx, yonler, ayak, silahFark: nisanSag - durusSag });
      }
      veri[ch] = { adim };
    }
    // İmzalar
    const imza = {};
    const pBant = bantlar(ciz('ponko', 0, 0, 0, 'imza-ponko'));
    imza.ponkoUst = pBant.genislik(0, 0.35);       // şapka tepesi/kenarı
    imza.ponkoOmuz = pBant.genislik(0.46, 0.62);   // omuz hizası
    imza.gulAltin = say(ciz('gul', 0, 0, 0, 'imza-gul'), (r, g, b) => r > 200 && g > 150 && b < 130);
    const rBant = bantlar(ciz('rani', 0, 0, 0, 'imza-rani'));
    imza.raniBas = rBant.genislik(0, 0.3);         // topuzlu baş
    imza.raniGovde = rBant.genislik(0.42, 0.6);    // omuz/gövde
    const betiBant = bantlar(ciz('beti', 0, 0, 0, 'imza-beti'));
    imza.betiBeyaz = betiBant.bolgeSay(0, 0.15, (r, g, b) => r > 235 && g > 235 && b > 235); // berenin beyaz şeritleri
    const hh = COSTUMES['beti'][0].hair;
    const hr = parseInt(hh.slice(1, 3), 16), hg = parseInt(hh.slice(3, 5), 16), hb = parseInt(hh.slice(5, 7), 16);
    imza.betiSac = betiBant.bolgeSay(0, 0.15, (r, g, b) => Math.abs(r - hr) < 55 && Math.abs(g - hg) < 55 && Math.abs(b - hb) < 55);
    imza.kostumFark = {};
    for (const ch of chars) {
      const a = ciz(ch, 0, 0, 0, `kf2-${ch}-0`), b = ciz(ch, 1, 0, 0, `kf2-${ch}-1`), c = ciz(ch, 2, 0, 0, `kf2-${ch}-2`);
      imza.kostumFark[ch] = [fark(a, b), fark(a, c)];
    }
    return { veri, imza };
  }, YENI2);
  const insanlar2 = { ponko: 'Ponko', gul: 'Güllu', rani: 'Rani', beti: 'Beri' };
  for (const ch of YENI2) {
    for (const a of yeni2.veri[ch].adim) {
      sina(`${insanlar2[ch]} kostüm ${a.idx}: 8 yönde dolu, ayak hizasında, üstte kırpılma yok`, () => {
        for (const k of a.yonler) {
          assert.ok(k.dolu > 200, `aci=${k.aci} dolu=${k.dolu}`);
          assert.ok(Math.abs(k.ayakFark) <= 8, `aci=${k.aci} alt=${k.alt} ayak=${a.ayak}`);
          assert.ok(k.pay >= 3, `aci=${k.aci} pay=${k.pay}`);
        }
      });
      sina(`${insanlar2[ch]} kostüm ${a.idx}: nişanda silah gövdenin önüne taşar`, () => {
        assert.ok(a.silahFark >= 3, `fark=${a.silahFark}`);
      });
    }
  }
  sina('Ponko\'nun şapkası tepede omuzlardan geniştir', () => {
    assert.ok(yeni2.imza.ponkoUst > yeni2.imza.ponkoOmuz * 1.15, `üst=${yeni2.imza.ponkoUst} omuz=${yeni2.imza.ponkoOmuz}`);
  });
  sina('Güllu\'nun başının üstünde altın taç pikselleri var', () => { assert.ok(yeni2.imza.gulAltin > 20, `altın=${yeni2.imza.gulAltin}`); });
  sina('Rani\'nin yan topuzları başı gövdeden geniş yapar', () => {
    assert.ok(yeni2.imza.raniBas > yeni2.imza.raniGovde * 1.2, `baş=${yeni2.imza.raniBas} gövde=${yeni2.imza.raniGovde}`);
  });
  sina('Beri\'nin beresinde beyaz ve saç rengi sarmal şeritler var', () => {
    assert.ok(yeni2.imza.betiBeyaz > 3, `beyaz=${yeni2.imza.betiBeyaz}`);
    assert.ok(yeni2.imza.betiSac > 3, `saç=${yeni2.imza.betiSac}`);
  });
  for (const ch of YENI2) {
    sina(`${insanlar2[ch]}: kostüm renkleri birbirinden farklı`, () => {
      const [f1, f2] = yeni2.imza.kostumFark[ch];
      assert.ok(f1 > 100 && f2 > 100, `fark0-1=${f1} fark0-2=${f2}`);
    });
  }

  // ---- 3D-4: Güllu'nun yayı ve Kornet'in asası nişanda omuz üstünde, yerde değil ----
  const silahUst = await p.evaluate(() => {
    const W = 220, H = 260, OX = 110, OY = 170, size = 80;
    const ciz = (ch, kim) => {
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      drawCharacter(c.getContext('2d'), ch, 0, OX, OY, size, 0, 0, 1, 0, '', null, 0.55, kim);
      return c.getContext('2d').getImageData(0, 0, W, H).data;
    };
    // Silaha özgü renklerin siluetin üst bandındaki sayısı ve sağ kenar taşması.
    const olc = (d, test) => {
      let ust = H, alt = -1;
      const sayilar = new Array(W).fill(0);
      for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) {
        if (d[(yy * W + xx) * 4 + 3] > 128) { sayilar[xx]++; if (yy < ust) ust = yy; if (yy > alt) alt = yy; }
      }
      const h = Math.max(1, alt - ust + 1);
      let ustBant = 0, silahSag = -1;
      for (let yy = ust; yy < Math.min(alt + 1, ust + Math.ceil(h * 0.45)); yy++) {
        for (let xx = 0; xx < W; xx++) {
          const i = (yy * W + xx) * 4;
          if (d[i + 3] > 128 && test(d[i], d[i + 1], d[i + 2])) ustBant++;
        }
      }
      for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) {
        const i = (yy * W + xx) * 4;
        if (d[i + 3] > 128 && test(d[i], d[i + 1], d[i + 2]) && xx > silahSag) silahSag = xx;
      }
      let govdeSag = -1; // gövde sütunları kalın; ince silah bundan sağa taşar
      for (let xx = 0; xx < W; xx++) if (sayilar[xx] >= 10) govdeSag = xx;
      return { ustBant, tasma: silahSag - govdeSag };
    };
    return {
      gul: olc(ciz('gul', 'silah-ust-gul'), (r, g, b) => r > 60 && g < 100 && b < 80 && r > g * 1.3),    // yay ahşabı
      kornet: olc(ciz('kornet', 'silah-ust-kornet'), (r, g, b) => r > 175 && g < 70 && b > 175),        // mor kristal
    };
  });
  sina('Güllu\'nun yayı nişanda omuz üstünde görünür (yerde yatmıyor)', () => {
    const g = silahUst.gul;
    assert.ok(g.ustBant > 10 || g.tasma >= 6, JSON.stringify(g));
  });
  sina('Kornet\'in mor kristali nişanda baş/gövde üstünde görünür (asa yerde değil)', () => {
    const k = silahUst.kornet;
    assert.ok(k.ustBant > 4 || k.tasma >= 6, JSON.stringify(k));
  });

  // 3D-5: Güllu'nun yayı dik, gövde boyu: nişanda 0.55 ve π/2'de omuz üstünde ve bel altında ahşap piksel var.
  const gulYay = await p.evaluate(() => {
    const W = 300, H = 320, OX = 150, OY = 250, size = 150;
    const yayTest = (r, g, b) => r > 85 && g < 110 && b < 80 && r > g * 1.3; // #7c2d12 ahşap
    const olc = (aci) => {
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      drawCharacter(c.getContext('2d'), 'gul', 0, OX, OY, size, 0, 0, 1, 0, '', null, aci, `gul-yay-${aci}`);
      const d = c.getContext('2d').getImageData(0, 0, W, H).data;
      let ust = H, alt = -1;
      for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) if (d[(yy * W + xx) * 4 + 3] > 128) { if (yy < ust) ust = yy; if (yy > alt) alt = yy; }
      const h = Math.max(1, alt - ust + 1);
      const omuz = ust + h * 0.30, bel = ust + h * 0.66;
      let ustBant = 0, belBant = 0;
      for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) {
        const i = (yy * W + xx) * 4;
        if (d[i + 3] > 128 && yayTest(d[i], d[i + 1], d[i + 2])) {
          if (yy < omuz) ustBant++;
          if (yy > bel) belBant++;
        }
      }
      return { aci: +aci.toFixed(2), ustBant, belBant };
    };
    return [olc(0.55), olc(Math.PI / 2)];
  });
  for (const k of gulYay) {
    sina(`Güllu'nun yayı aci=${k.aci} nişanda omuz üstünde ve bel altında görünür (gövdeden uzun)`, () => {
      assert.ok(k.ustBant >= 10, `omuz üstü=${k.ustBant} (${JSON.stringify(k)})`);
      assert.ok(k.belBant >= 10, `bel altı=${k.belBant} (${JSON.stringify(k)})`);
    });
  }

  // ---- 3D-2c: Fanatik, Silsen, Serçin — her kostüm, 8 yön, silah, imza ----
  const YENI3 = ['fanatik', 'silsen', 'sercin'];
  const yeni3 = await p.evaluate((chars) => {
    const W = 220, H = 260, OX = 110, OY = 170, BOY2 = 80, s = BOY2 / 100;
    const ciz = (ch, idx, aci, aim, kim, gun) => {
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const x = c.getContext('2d');
      drawCharacter(x, ch, idx, OX, OY, BOY2, 0, 0, aim, 0, gun || '', null, aci, kim);
      return x;
    };
    const ozet = (x) => {
      const d = x.getImageData(0, 0, W, H).data;
      let ust = H, alt = -1, dolu = 0;
      for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) {
        if (d[(yy * W + xx) * 4 + 3] > 128) { dolu++; if (yy < ust) ust = yy; if (yy > alt) alt = yy; }
      }
      return { ust, alt, dolu };
    };
    const fark = (a, b) => {
      const da = a.getImageData(0, 0, W, H).data, db = b.getImageData(0, 0, W, H).data;
      let n = 0;
      for (let i = 0; i < da.length; i += 4) {
        if (da[i + 3] > 128 || db[i + 3] > 128) {
          if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) > 60) n++;
        }
      }
      return n;
    };
    const bantSay = (x, a, b, test) => {
      const d = x.getImageData(0, 0, W, H).data;
      let ust = H, alt = -1;
      for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) {
        if (d[(yy * W + xx) * 4 + 3] > 128) { if (yy < ust) ust = yy; if (yy > alt) alt = yy; }
      }
      const h = Math.max(1, alt - ust + 1);
      let n = 0;
      for (let yy = ust + Math.floor(h * a); yy < Math.min(alt + 1, ust + Math.ceil(h * b)); yy++) {
        for (let xx = 0; xx < W; xx++) {
          const i = (yy * W + xx) * 4;
          if (d[i + 3] > 128 && test(d[i], d[i + 1], d[i + 2])) n++;
        }
      }
      return n;
    };
    const sagKenar = (xx) => {
      const d = xx.getImageData(0, 0, W, H).data;
      let sag = -1;
      for (let px = 0; px < W; px++) for (let py = 0; py < H; py++) {
        if (d[(py * W + px) * 4 + 3] > 128 && px > sag) sag = px;
      }
      return sag;
    };
    const veri = {};
    for (const ch of chars) {
      const kos = COSTUMES[ch].length;
      const adim = [];
      for (let idx = 0; idx < kos; idx++) {
        const kk = karakterKodKutusu(ch, idx);
        const ayak = OY + kk.alt * s;
        const ustSinir = ayak - (kk.alt - kk.ust) * s * 1.06;
        const yonler = [];
        for (let i = 0; i < 8; i++) {
          const aci = i * Math.PI / 4;
          const o = ozet(ciz(ch, idx, aci, 1, `${ch}-${idx}-${i}`));
          yonler.push({ aci: +aci.toFixed(2), ust: o.ust, alt: o.alt, dolu: o.dolu, pay: o.ust - ustSinir, ayakFark: o.alt - ayak });
        }
        const nisanSag = sagKenar(ciz(ch, idx, Math.PI / 2, 1, `${ch}-${idx}-silah`));
        const durusSag = sagKenar(ciz(ch, idx, Math.PI / 2, 0, `${ch}-${idx}-durus`));
        adim.push({ idx, yonler, ayak, silahFark: nisanSag - durusSag });
      }
      veri[ch] = { adim };
    }
    // İmzalar (görüntünün üst/orta bandında karaktere özgü renk)
    const imza = {};
    imza.fanatikBant = bantSay(ciz('fanatik', 0, 0, 0, 'imza-fanatik'), 0.2, 0.45, (r, g, b) => r > 150 && g < 80 && b < 80);
    imza.silsenElbise = bantSay(ciz('silsen', 0, 0, 0, 'imza-silsen'), 0.34, 0.8, (r, g, b) => g > 140 && g > r + 30 && g > b + 30);
    imza.sercinGaga = bantSay(ciz('sercin', 0, 0, 0, 'imza-sercin'), 0.12, 0.5, (r, g, b) => r > 200 && g > 100 && g < 190 && b < 110);
    imza.kostumFark = {};
    for (const ch of chars) {
      const kos = COSTUMES[ch].length;
      const temel = ciz(ch, 0, 0, 0, `kf3-${ch}-0`);
      const liste = [];
      for (let i = 1; i < kos; i++) liste.push(fark(temel, ciz(ch, i, 0, 0, `kf3-${ch}-${i}`)));
      imza.kostumFark[ch] = liste;
    }
    // Mağaza silahları: 5 silah da sağ elde öne taşar ve avcının kendi silahından farklı görünür.
    const dukkan = {};
    for (const gun of ['baloncuk', 'lazer', 'yesil', 'pompali', 'bazuka']) {
      const x = ciz('kinkin', 0, Math.PI / 2, 1, `dukkan-${gun}`, gun);
      const d = x.getImageData(0, 0, W, H).data;
      const sayilar = new Array(W).fill(0);
      let sag = -1;
      for (let xx = 0; xx < W; xx++) for (let yy = 0; yy < H; yy++) {
        if (d[(yy * W + xx) * 4 + 3] > 128) { sayilar[xx]++; if (xx > sag) sag = xx; }
      }
      let govdeSag = -1;
      for (let xx = 0; xx < W; xx++) if (sayilar[xx] >= 14) govdeSag = xx;
      dukkan[gun] = {
        fark: fark(x, ciz('kinkin', 0, Math.PI / 2, 1, `dukkan-kendi-${gun}`, '')),
        tasma: sag - govdeSag, sag, govdeSag,
      };
    }
    return { veri, imza, dukkan };
  }, YENI3);
  const insanlar3 = { fanatik: 'Fanatik', silsen: 'Silsen', sercin: 'Serçin' };
  for (const ch of YENI3) {
    for (const a of yeni3.veri[ch].adim) {
      sina(`${insanlar3[ch]} kostüm ${a.idx}: 8 yönde dolu, ayak hizasında, üstte kırpılma yok`, () => {
        for (const k of a.yonler) {
          assert.ok(k.dolu > 200, `aci=${k.aci} dolu=${k.dolu}`);
          assert.ok(Math.abs(k.ayakFark) <= 8, `aci=${k.aci} alt=${k.alt} ayak=${a.ayak}`);
          assert.ok(k.pay >= 3, `aci=${k.aci} pay=${k.pay}`);
        }
      });
      sina(`${insanlar3[ch]} kostüm ${a.idx}: nişanda silah gövdenin önüne taşar`, () => {
        assert.ok(a.silahFark >= 3, `fark=${a.silahFark}`);
      });
    }
  }
  sina('Fanatik\'in baş bölgesinde kırmızı alın bandı var', () => { assert.ok(yeni3.imza.fanatikBant > 10, `kırmızı=${yeni3.imza.fanatikBant}`); });
  sina('Silsen\'in gövdesinde yeşil elbise pikselleri var', () => { assert.ok(yeni3.imza.silsenElbise > 30, `yeşil=${yeni3.imza.silsenElbise}`); });
  sina('Serçin\'in yüzünde turuncu gaga maskesi var', () => { assert.ok(yeni3.imza.sercinGaga > 5, `turuncu=${yeni3.imza.sercinGaga}`); });
  for (const ch of YENI3) {
    sina(`${insanlar3[ch]}: kostüm renkleri birbirinden farklı`, () => {
      const liste = yeni3.imza.kostumFark[ch];
      assert.ok(liste.length > 0, 'kostüm yok');
      for (const f of liste) assert.ok(f > 100, `fark=${liste.join(',')}`);
    });
  }
  for (const gun of ['baloncuk', 'lazer', 'yesil', 'pompali', 'bazuka']) {
    sina(`Mağaza silahı ${gun}: nişanda elde öne taşar ve kendi silahından farklı`, () => {
      const d = yeni3.dukkan[gun];
      assert.ok(d.tasma >= 3, JSON.stringify(d));
      assert.ok(d.fark > 100, `fark=${d.fark}`);
    });
  }

  // ---- Bütün avcıların iletişim sayfası: test/ekran/uc-avcilar.png (ön 3/4, nişan) ----
  const sayfa = await p.evaluate(() => {
    const avcilar = ['kinkin', 'veryi', 'kornet', 'mark', 'kent', 'ponko', 'gul', 'rani', 'beti', 'fanatik', 'silsen', 'sercin'];
    const T = 170, W = T * avcilar.length, H = 240;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d');
    x.fillStyle = '#101827'; x.fillRect(0, 0, W, H);
    for (let i = 0; i < avcilar.length; i++) {
      drawCharacter(x, avcilar[i], 0, T * i + T / 2, 214, 112, 0, 0, 1, 0, '', null, 0.6, `posta-${avcilar[i]}`);
    }
    return c.toDataURL('image/png');
  });
  const cikti = path.join(path.dirname(fileURLToPath(import.meta.url)), 'ekran');
  fs.mkdirSync(cikti, { recursive: true });
  fs.writeFileSync(path.join(cikti, 'uc-avcilar.png'), Buffer.from(sayfa.split(',')[1], 'base64'));
  sina('iletişim sayfası test/ekran/uc-avcilar.png olarak kaydedildi', () => {
    assert.ok(fs.statSync(path.join(cikti, 'uc-avcilar.png')).size > 5000);
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

  // g) Yakın vuruş: Veryi'nin çekici ve Kenit'in hançeri atışta kol açısını değiştirir (yay)
  const yakin = await p.evaluate(() => {
    UcAvci.ac();
    const ciz = (ch, rec, kim) => {
      const c = document.createElement('canvas'); c.width = 200; c.height = 240;
      drawCharacter(c.getContext('2d'), ch, 0, 100, 160, 80, 0, 0, 1, rec, '', null, 0.6, kim);
      return c.getContext('2d').getImageData(0, 0, 200, 240).data;
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
    const o = {};
    for (const ch of ['veryi', 'kent']) {
      const sifir = ciz(ch, 0, `${ch}-vurus-0`);
      o[ch] = { tam: fark(ciz(ch, 1, `${ch}-vurus-1`), sifir), ara: fark(ciz(ch, 0.6, `${ch}-vurus-6`), sifir) };
    }
    return o;
  });
  sina('Veryi çekici ve Kenit hançeri atışta kol açısını değiştirir (yay çizerek iner)', () => {
    for (const ch of ['veryi', 'kent']) {
      assert.ok(yakin[ch].tam > 100, `${ch} tam=${yakin[ch].tam}`);
      assert.ok(yakin[ch].ara > 40, `${ch} ara=${yakin[ch].ara}`);
    }
  });

  // h) Fanatik'in Tornado Tekme bayrağı modeli kendi çevresinde döndürür
  const donme = await p.evaluate(async () => {
    UcAvci.ac();
    const kare = (kim) => new Promise((coz) => {
      const c = document.createElement('canvas'); c.width = 200; c.height = 240;
      const ctx = c.getContext('2d');
      UcAvci.ciz(ctx, { charKey: 'fanatik', costumeIdx: 0, x: 100, y: 160, size: 80, aci: 0.55, aimRaise: 1, nisan: true, ozel: 'tekme', kimlik: kim });
      setTimeout(() => coz(ctx.getImageData(0, 0, 200, 240).data), 220);
    });
    const a = await kare('fanatik-don');
    const b = await kare('fanatik-don');
    let n = 0;
    for (let i = 0; i < a.length; i += 4) {
      if (a[i + 3] > 128 || b[i + 3] > 128) {
        if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 60) n++;
      }
    }
    return n;
  });
  sina('Fanatik tekme bayrağıyla zamanla döner (kareler farklı)', () => { assert.ok(donme > 150, `fark=${donme}`); });

  // i) Ayarlar: 3D aç/kapa düğmesi UcAvci'yi açar/kapatır ve save.ayar3d'ye yazar
  const ayar3d = await p.evaluate(() => {
    save.ayar3d = true;
    if (window.UcAvci.ac) UcAvci.ac();
    refresh3dButton();
    const bas = { hazir: UcAvci.hazir, btn: (document.getElementById('btn-ayar3d') || {}).textContent };
    toggle3d(false);
    const kapali = {
      hazir: UcAvci.hazir, sav: save.ayar3d, btn: (document.getElementById('btn-ayar3d') || {}).textContent,
      kayit: JSON.parse(localStorage.getItem(SAVE_KEY)).ayar3d,
    };
    toggle3d(true);
    const acik = {
      hazir: UcAvci.hazir, sav: save.ayar3d,
      kayit: JSON.parse(localStorage.getItem(SAVE_KEY)).ayar3d,
    };
    return { bas, kapali, acik };
  });
  sina('Ayarlar düğmesi 3D\'yi kapatır (save.ayar3d=false, kalıcı) ve yeniden açar', () => {
    assert.equal(ayar3d.bas.hazir, true);
    assert.equal(ayar3d.kapali.hazir, false);
    assert.equal(ayar3d.kapali.sav, false);
    assert.equal(ayar3d.kapali.kayit, false);
    assert.equal(ayar3d.kapali.btn, 'Kapalı');
    assert.equal(ayar3d.acik.hazir, true);
    assert.equal(ayar3d.acik.sav, true);
    assert.equal(ayar3d.acik.kayit, true);
  });

  // j) Başarım koruması: kare başına 3D toplamı ve kare süresi kareBitti ile bildirilir; yavaş karede 3D kapanır
  const koruma = await p.evaluate(() => {
    if (window.UcAvci.ac) UcAvci.ac();
    const ayar0 = { ...UcAvci.ayar };
    UcAvci.ayar.pencereMs = 100000; UcAvci.ayar.esikMs = 40; UcAvci.ayar.enAz = 5;
    let olay = 0;
    window.addEventListener('uc-avci-yavas', () => { olay++; });
    const asil = UcAvci.ciz;
    UcAvci.ciz = function (ctx, o) {
      const b = performance.now(); while (performance.now() - b < 50) { /* yavaş çizim */ }
      return asil.call(this, ctx, o);
    };
    const c = document.createElement('canvas'); c.width = 200; c.height = 240;
    const ctx = c.getContext('2d');
    for (let kare = 0; kare < 8; kare++) {
      for (let i = 0; i < 3; i++) drawCharacter(ctx, 'kinkin', 0, 100, 140, 80, 0, 0, 0, 0, '', null, 0.6, `yavas-${i}`);
      UcAvci.kareBitti(100);
    }
    UcAvci.ciz = asil;
    Object.assign(UcAvci.ayar, ayar0);
    return { hazir: UcAvci.hazir, destek: UcAvci.destek(), sav: save.ayar3d, kayit: JSON.parse(localStorage.getItem(SAVE_KEY)).ayar3d, olay };
  });
  sina('Başarım koruması yavaş çizimde 3D\'yi kapatır ve save.ayar3d=false yazar', () => {
    assert.equal(koruma.hazir, false);
    assert.equal(koruma.destek, false);
    assert.equal(koruma.sav, false);
    assert.equal(koruma.kayit, false);
    assert.ok(koruma.olay >= 1, `olay=${koruma.olay}`);
  });

  // j2) Normal tek kişilik oyun SwiftShader'da 3 s sürerken 3D kendiliğinden kapanmaz
  const surdurulebilir = await p.evaluate(async () => {
    save.ayar3d = true; persistSave();
    if (window.UcAvci.ac) UcAvci.ac();
    startGame();
    game.spawnTimer = 1e9; game.player.invuln = 1e9; game.player.hp = game.player.maxHp;
    await new Promise((coz) => setTimeout(coz, 3000));
    return { destek: UcAvci.destek(), hazir: UcAvci.hazir, calisiyor: game.running };
  });
  sina('SwiftShader\'da 3 sn normal oyun sonrası 3D hâlâ açık (destek true)', () => {
    assert.equal(surdurulebilir.hazir, true);
    assert.equal(surdurulebilir.destek, true);
    assert.equal(surdurulebilir.calisiyor, true);
  });

  // j3) ciz her çağrıda +30 ms yavaşlarken kare başına 3 avcı: koruma 3 sn içinde 3D'yi kapatır
  const ucAvciYavas = await p.evaluate(async () => {
    game.running = false; // oyun döngüsünü durdur, kareleri elle sür
    const ayar0 = { ...UcAvci.ayar };
    UcAvci.ayar.pencereMs = 2000; UcAvci.ayar.esikMs = 40; UcAvci.ayar.enAz = 8;
    const asil = UcAvci.ciz;
    UcAvci.ciz = function (ctx, o) {
      const b = performance.now(); while (performance.now() - b < 30) { /* +30 ms yapay yük */ }
      return asil.call(this, ctx, o);
    };
    const c = document.createElement('canvas'); c.width = 220; c.height = 260;
    const ctx = c.getContext('2d');
    const bas = performance.now();
    let kare = 0;
    while (UcAvci.destek() && performance.now() - bas < 3000) {
      const kb = performance.now();
      for (let i = 0; i < 3; i++) drawCharacter(ctx, 'kinkin', 0, 60 + i * 70, 180, 80, 0, 0, 1, 0.2, '', null, 0.6, `hiz-${i}`);
      UcAvci.kareBitti(performance.now() - kb);
      kare++;
      await new Promise((coz) => setTimeout(coz, 0));
    }
    UcAvci.ciz = asil;
    Object.assign(UcAvci.ayar, ayar0);
    return { destek: UcAvci.destek(), kare, sure: Math.round(performance.now() - bas) };
  });
  sina('3 avcı × +30 ms yavaş çizimde koruma 3 sn içinde 3D\'yi kapatır', () => {
    assert.equal(ucAvciYavas.destek, false, `${ucAvciYavas.sure} ms, ${ucAvciYavas.kare} kare`);
    assert.ok(ucAvciYavas.sure <= 3000, `süre=${ucAvciYavas.sure}`);
  });

  // ---- UC7b: pişmiş duruş önbelleği — kırpma, boyut, ısınma ve kare bütçesi ----
  const onbellekOyun = await p.evaluate(async () => {
    save.ayar3d = true; persistSave();
    if (window.UcAvci.ac) UcAvci.ac();
    const c = document.createElement('canvas'); c.width = 844; c.height = 390;
    const ctx = c.getContext('2d');
    const d = { aci: 0 };
    const kare = () => {
      const kb = performance.now();
      const t = performance.now() / 1000;
      d.aci = t * 2;
      UcAvci.ciz(ctx, { charKey: 'kent', costumeIdx: 0, x: 200, y: 220, size: 70, aci: d.aci, yuruyor: true, walkPhase: t, aimRaise: 1, kimlik: 'ben' }, d);
      UcAvci.ciz(ctx, { charKey: 'mark', costumeIdx: 0, x: 420, y: 220, size: 62, aci: d.aci + 1, yuruyor: true, walkPhase: t, aimRaise: 0.5, kimlik: 'bot' }, d);
      UcAvci.kareBitti(performance.now() - kb);
    };
    const bas = performance.now();
    let kareSay = 0;
    await new Promise((coz) => {
      const dongu = () => {
        kare(); kareSay++;
        const s = UcAvci._sayac();
        if (s.isinmaKalan === 0 && !s.isinmaCalisiyor) return coz();
        if (performance.now() - bas > 40000) return coz();
        requestAnimationFrame(dongu);
      };
      requestAnimationFrame(dongu);
    });
    const isinmaMs = Math.round(performance.now() - bas);
    const isinma = UcAvci._sayac();
    let t1 = performance.now(), ilkRender = 0, kare2 = 0;
    await new Promise((coz) => {
      const dongu = () => {
        kare(); kare2++;
        const gecen = performance.now() - t1;
        if (gecen >= 1000 && !ilkRender) ilkRender = UcAvci._sayac().render;
        if (gecen >= 3000) return coz();
        requestAnimationFrame(dongu);
      };
      requestAnimationFrame(dongu);
    });
    const son = UcAvci._sayac();
    return { isinmaMs, kareSay, isinmaKalan: isinma.isinmaKalan, isinmaCalisiyor: isinma.isinmaCalisiyor,
      renderSon2sn: son.render - ilkRender, onbellekBayt: son.onbellekBayt, onbellekSay: son.onbellekSay, kare2 };
  });
  sina('UC7b ısınma sonrası 3 sn yürüyüşte son 2 sn render ≤ 5 ve önbellek ≤ 32 MB', () => {
    assert.equal(onbellekOyun.isinmaKalan, 0, `kalan=${onbellekOyun.isinmaKalan}`);
    assert.equal(onbellekOyun.isinmaCalisiyor, false);
    assert.ok(onbellekOyun.renderSon2sn <= 5, `render=${onbellekOyun.renderSon2sn}`);
    assert.ok(onbellekOyun.onbellekBayt <= 32 * 1024 * 1024, `bayt=${onbellekOyun.onbellekBayt}`);
  });

  // CPU 4x: ısınma sonrası 6 sn oyunda kare aralıkları (p95 ≤ 20 ms, en büyük ≤ 50 ms)
  const cdp = await p.context().newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const kareAralik = await p.evaluate(async () => {
    const c = document.createElement('canvas'); c.width = 844; c.height = 390;
    const ctx = c.getContext('2d');
    const d = { aci: 0 };
    const kare = () => {
      const kb = performance.now();
      const t = performance.now() / 1000;
      d.aci = t * 2;
      UcAvci.ciz(ctx, { charKey: 'kent', costumeIdx: 0, x: 200, y: 220, size: 70, aci: d.aci, yuruyor: true, walkPhase: t, aimRaise: 1, kimlik: 'ben' }, d);
      UcAvci.ciz(ctx, { charKey: 'mark', costumeIdx: 0, x: 420, y: 220, size: 62, aci: d.aci + 1, yuruyor: true, walkPhase: t, aimRaise: 0.5, kimlik: 'bot' }, d);
      UcAvci.kareBitti(performance.now() - kb);
    };
    const aralik = [];
    let son = 0;
    const bitis = performance.now() + 6000;
    await new Promise((coz) => {
      const dongu = (now) => {
        if (son) aralik.push(now - son);
        son = now;
        kare();
        if (performance.now() >= bitis) return coz();
        requestAnimationFrame(dongu);
      };
      requestAnimationFrame(dongu);
    });
    aralik.sort((a, b) => a - b);
    const yuzde = (q) => aralik[Math.min(aralik.length - 1, Math.floor(aralik.length * q))];
    return { n: aralik.length, p95: yuzde(0.95), enBuyuk: aralik[aralik.length - 1], destek: UcAvci.destek() };
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  sina('UC7b CPU 4x: ısınma sonrası 6 sn oyunda p95 ≤ 20 ms, hiçbir aralık > 50 ms', () => {
    assert.equal(kareAralik.destek, true);
    assert.ok(kareAralik.n > 100, `aralık=${kareAralik.n}`);
    assert.ok(kareAralik.p95 <= 20, `p95=${kareAralik.p95}`);
    assert.ok(kareAralik.enBuyuk <= 50, `en büyük=${kareAralik.enBuyuk}`);
  });

  // Kırpılmış pişmiş resim, canlı (kırpılmamış) kareyle aynı yere basılır; namlu ucu da eşleşir.
  const kirpmaKonum = await p.evaluate(() => {
    const W = 240, H = 260;
    const ciz = (kimlik, ek) => {
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const ctx = c.getContext('2d');
      UcAvci.ciz(ctx, { charKey: 'kinkin', costumeIdx: 0, x: 120, y: 180, size: 80, aci: Math.PI / 2,
        aimRaise: 1, shootRecoil: 1, kimlik, ...ek });
      const d = ctx.getImageData(0, 0, W, H).data;
      let L = W, R = -1, U = H, D = -1;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (d[(y * W + x) * 4 + 3] > 128) { if (x < L) L = x; if (x > R) R = x; if (y < U) U = y; if (y > D) D = y; }
      }
      const n = UcAvci.namlu(kimlik);
      return { L, R, U, D, namlu: n };
    };
    return { onbellek: ciz('kirp-onbellek', {}), canli: ciz('kirp-canli', { _canli: true }) };
  });
  sina('UC7b kırpılmış pişmiş avcı canlı çizimle aynı yerde (≤ 2 px), namlu ≤ 3 px', () => {
    for (const k of ['L', 'R', 'U', 'D']) {
      assert.ok(Math.abs(kirpmaKonum.onbellek[k] - kirpmaKonum.canli[k]) <= 2,
        `${k}: önbellek=${kirpmaKonum.onbellek[k]} canlı=${kirpmaKonum.canli[k]}`);
    }
    assert.ok(kirpmaKonum.onbellek.namlu && kirpmaKonum.canli.namlu, 'namlu yok');
    const uzak = Math.hypot(kirpmaKonum.onbellek.namlu.x - kirpmaKonum.canli.namlu.x,
      kirpmaKonum.onbellek.namlu.y - kirpmaKonum.canli.namlu.y);
    assert.ok(uzak <= 3, `namlu uzaklık=${uzak}`);
  });

  // 12 karakter × 3 kostüm gezildikten sonra önbellek 32 MB sınırında kalır.
  const onbellekCap = await p.evaluate(() => {
    const chars = ['kinkin', 'veryi', 'kornet', 'mark', 'kent', 'ponko', 'gul', 'rani', 'beti', 'fanatik', 'silsen', 'sercin'];
    const c = document.createElement('canvas'); c.width = 300; c.height = 320;
    const ctx = c.getContext('2d');
    for (const ch of chars) for (let idx = 0; idx < 3; idx++) for (let i = 0; i < 8; i++) for (let k = 0; k < 8; k++) {
      UcAvci.ciz(ctx, { charKey: ch, costumeIdx: idx, x: 150, y: 220, size: 70, aci: i * Math.PI / 4,
        yuruyor: true, walkPhase: k * (Math.PI * 2 / 12) / 8, kimlik: `cap-${ch}-${idx}` });
    }
    return UcAvci._sayac();
  });
  sina('UC7b 12 karakter × 3 kostüm sonrası önbellek ≤ 32 MB, sayfa hatası yok', () => {
    assert.ok(onbellekCap.onbellekSay > 0);
    assert.ok(onbellekCap.onbellekBayt <= 32 * 1024 * 1024, `bayt=${onbellekCap.onbellekBayt}`);
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
