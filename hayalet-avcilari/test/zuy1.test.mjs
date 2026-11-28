// Hayalet Avcıları: zeminle uyum (ZUY1) — diken, göl kıyısı ve nehir kıyısı ChatGPT resmiyle (CHATGPT-ISTEMI-UYUM.md).
// Diken: tema<n>-diken-taban biçime kırpılır, tema<n>-diken öbekleri biçimin İÇİNE konur (kesilmez), tema<n>-kenar şeridi hat boyunca
// sarılır ve önbellek sınırı içinde kalır. Göller: tema<n>-kenar / aile-<A>-kenar; kesişen göllerde ortak alanda kıyı yok.
// Yolculuk nehri: iki kıyı için kenar şeridi tuvali. Resim yoksa eski kod görünümü yedek (hatasız). Çalıştırma: node test/zuy1.test.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WWW = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);
const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg' };
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
async function sayfaAc(dil, w, h) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => hatalar.push(`${dil}: ${e.message}`));
  await p.addInitScript((dil) => { localStorage.setItem('hayaletAvcilariDil', dil); localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9'); localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1'); }, dil);
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof startGame === 'function' && typeof engelOlustur === 'function' && typeof engelResmi === 'function' && typeof yolculukBankSerit === 'function');
  await p.waitForFunction(() => typeof gorsel === 'function' && !!gorsel('tema1-diken') && !!gorsel('tema1-diken-taban') && !!gorsel('tema1-kenar') && !!gorsel('aile-SH-kenar'), null, { timeout: 30000 });
  return p;
}

try {
  for (const [dil, w, h] of [['tr', 390, 844], ['ar', 340, 740]]) {
    const p = await sayfaAc(dil, w, h);
    await p.evaluate(() => {
      window.__gercek = window.gorsel;
      window.__gizli = new Set();
      window.gorsel = (k) => (window.__gizli.has(k) ? null : window.__gercek(k));
      // drawImage kaydı: yalnız istenen resimler (kimlik karşılaştırması), o andaki dönüşümle
      window.__kayit = null;
      const orj = CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.drawImage = function (im, ...a) {
        if (window.__kayit) {
          for (const k of window.__izle) if (im === window.__gercek(k)) { const m = this.getTransform(); window.__kayit.push({ k, m: [m.a, m.b, m.c, m.d, m.e, m.f], a, cw: this.canvas.width, ch: this.canvas.height }); }
        }
        return orj.call(this, im, ...a);
      };
      window.__sahne = (tur, tema, w, h, tohum = 4321) => {
        const o = engelOlustur({ x: 300, y: 200, w, h }, tur, tema, tohum);
        o._resim = null; o._olcek = 0; delete o._komsu;
        return o;
      };
      window.__yerel = (o, R, x, y, m) => { // cihaz noktası → engel yerel koordinatı
        const s = o._olcek, p = R.pay || { x: 0, y: 0 };
        return [(x / s) - p.x, (y / s) - p.y];
      };
      window.__ciz = (o, izle) => {
        window.__izle = izle; window.__kayit = [];
        const R = engelResmi(o);
        const kayit = window.__kayit; window.__kayit = null;
        return { R, kayit };
      };
    });

    // ---- Diken: klasik 6 tema ve Dünya Turu aileleri ----
    for (const tema of [0, 1, 2, 3, 4, 5]) {
      const n = tema + 1;
      const d = await p.evaluate(({ tema, n }) => {
        const o = __sahne('diken', tema, 90, 90, 100 + tema);
        const { R, kayit } = __ciz(o, [`tema${n}-diken`, `tema${n}-diken-taban`, `tema${n}-kenar`]);
        const oge = kayit.filter((c) => c.k === `tema${n}-diken`), serit = kayit.filter((c) => c.k === `tema${n}-kenar`);
        const kesik = [], dis = [];
        for (const c of oge) {
          const [dx, dy, dw, dh] = c.a; // yerel dikdörtgen: [-gen/2, -gh, gen, gh] (çeviri m.e,m.f içinde)
          const mx = c.m[4] / o._olcek - (R.pay ? R.pay.x : 0), my = c.m[5] / o._olcek - (R.pay ? R.pay.y : 0);
          const cx = mx, taban = my, ust = my - dh;
          if (engelUzaklik(o.bicim, cx, taban - 3) > -7.9) kesik.push(['taban', cx, taban]);
          if (engelUzaklik(o.bicim, cx - dw / 2, taban - 2) > -1.9 || engelUzaklik(o.bicim, cx + dw / 2, taban - 2) > -1.9) kesik.push(['yan', cx, taban]);
          if (engelUzaklik(o.bicim, cx, ust) > 6) kesik.push(['uc', cx, ust]);
          if (cx - dw / 2 < -R.pay.x || cx + dw / 2 > o.w + R.pay.x || ust < -R.pay.y || taban > o.h + R.pay.alt) dis.push([cx, taban]);
        }
        // şerit dilimleri: merkez hatta yakın, dört köşe önbellek tuvali içinde
        let hatDisi = 0, tuvalDisi = 0;
        for (const c of serit) {
          const [sx, sy, sw, sh, dx, dy, dw, dh] = c.a;
          const mer = [c.m[0] * 0 + c.m[2] * 0 + c.m[4], c.m[5]];
          const yer = __yerel(o, R, mer[0], mer[1]);
          if (Math.abs(engelUzaklik(o.bicim, yer[0], yer[1])) > 1.5) hatDisi++;
          for (const [x, y] of [[dx, dy], [dx + dw, dy], [dx, dy + dh], [dx + dw, dy + dh]]) {
            const X = c.m[0] * x + c.m[2] * y + c.m[4], Y = c.m[1] * x + c.m[3] * y + c.m[5];
            if (X < -1 || Y < -1 || X > R.c.width + 1 || Y > R.c.height + 1) tuvalDisi++;
          }
        }
        return { oge: oge.length, serit: serit.length, taban: kayit.filter((c) => c.k === `tema${n}-diken-taban`).length, kesik, dis, hatDisi, tuvalDisi,
          pay: R.pay, cw: R.c.width, ch: R.c.height, olcek: o._olcek, ow: o.w, oh: o.h };
      }, { tema, n });
      sina(`${dil} diken tema${n}: taban deseni + diken öbekleri + kenar şeridi kullanılır`, () => {
        assert.ok(d.oge >= 3, `öbek ${d.oge}`);
        assert.ok(d.serit >= 20, `şerit dilimi ${d.serit}`);
      });
      sina(`${dil} diken tema${n}: öbekler biçimin içinde, kesik/taşan öbek yok`, () => { assert.deepEqual(d.kesik, []); assert.deepEqual(d.dis, []); });
      sina(`${dil} diken tema${n}: şerit hat boyunca ve önbellek sınırında`, () => {
        assert.equal(d.hatDisi, 0, `hat dışı ${d.hatDisi}`);
        assert.equal(d.tuvalDisi, 0, `tuval dışı ${d.tuvalDisi}`);
        assert.ok(d.pay && d.pay.x >= 6 && d.pay.y >= 6 && d.pay.alt >= 6, 'önbellek payı');
        assert.equal(d.cw, Math.ceil((d.ow + 2 * d.pay.x) * d.olcek));
      });
    }
    const dt = await p.evaluate(() => {
      const aile = (A) => { for (const u of ULKELER) if (ulkeKodla(u.kod).aile === A) return u.kod; return null; };
      const r = {};
      for (const [A, n] of [['K', 1], ['KS', 3], ['SH', 2], ['LA', 5]]) {
        const kod = aile(A);
        if (!kod) { r[A] = null; continue; }
        const o = __sahne('diken', kod, 90, 90, 55);
        const { R, kayit } = __ciz(o, [`tema${n}-diken`, `tema${n}-diken-taban`, `aile-${A}-kenar`]);
        r[A] = { kod, oge: kayit.filter((c) => c.k === `tema${n}-diken`).length, serit: kayit.filter((c) => c.k === `aile-${A}-kenar`).length, taban: kayit.filter((c) => c.k === `tema${n}-diken-taban`).length };
      }
      return r;
    });
    for (const [A, v] of Object.entries(dt)) {
      sina(`${dil} Dünya Turu ${A}: diken eşlemesi (taban + öbek) ve aile-${A}-kenar şeridi`, () => {
        assert.ok(v, 'aile için ülke yok');
        assert.ok(v.oge >= 3 && v.serit >= 20, JSON.stringify(v));
      });
    }

    // ---- Göller ----
    const g = await p.evaluate(() => {
      const r = {};
      for (const tema of [0, 1, 2, 3, 4, 5]) {
        const o = __sahne('su', tema, 160, 110, 77 + tema);
        const { R, kayit } = __ciz(o, [`tema${tema + 1}-kenar`]);
        r['t' + tema] = { kenar: kayit.length, pay: R.pay };
      }
      return r;
    });
    for (const tema of [0, 1, 2, 3, 4, 5]) {
      sina(`${dil} göl tema${tema + 1}: kıyıyı su katmanı çizmez (kıyı ayrı katmanda), önbellek payı var`, () => {
        const v = g['t' + tema];
        assert.equal(v.kenar, 0, 'su katmanında şerit çizilmemeli');
        assert.ok(v.pay && v.pay.x >= 10 && v.pay.y >= 20, JSON.stringify(v.pay));
      });
    }
    const sk = await p.evaluate(() => {
      // kıyı katmanı: window'da yok; engelleriCiz yoluyla görülür. Su + kıyı çizimini game üzerinden sınar.
      const r = {};
      const kur = (tema, kod) => {
        if (game.running) endGame(false);
        online.mode = null; startGame(); game.dunyaTuru = false;
        game.paused = true; game.running = false; game.ghosts = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
        const a = engelOlustur({ x: 400, y: 400, w: 180, h: 120 }, 'su', tema, 9001);
        const c = engelOlustur({ x: 500, y: 450, w: 160, h: 120 }, 'su', tema, 9002);
        game.walls = game.walls.slice(0, 4); game.waters = [a, c]; game.spikes = []; game.lavas = [];
        for (const o of [a, c]) { o._resim = null; o._olcek = 0; o._isinma = 0; delete o._komsu; }
        game.camera.x = 450; game.camera.y = 380; game.player.dead = true;
        return [a, c];
      };
      const sonuc = {};
      for (const tema of [0, 3]) {
        const [a, c] = kur(tema);
        const kayit = []; window.__izle = [`tema${tema + 1}-kenar`]; window.__kayit = kayit;
        for (let i = 0; i < 5; i++) render();
        window.__kayit = null;
        sonuc['t' + tema] = { dilim: kayit.length, komsu: !!(a._komsu && c._komsu), ser: !!(a._resim && a._resim.serit), serB: !!(c._resim && c._resim.serit) };
        // ortak alanda kıyı yok: a'nın kıyı tuvali, c'nin iç bölgesinde (3 birim içeride) boyalı piksel taşımamalı
        const R = a._resim, S = R.serit, ctx = S.getContext('2d');
        const d = ctx.getImageData(0, 0, S.width, S.height).data;
        const s = a._olcek;
        let boyali = 0;
        for (let y = 0; y < S.height; y += 2) for (let x = 0; x < S.width; x += 2) {
          if (d[(y * S.width + x) * 4 + 3] < 20) continue;
          const wx = a.x + x / s - R.pay.x - c.x, wy = a.y + y / s - R.pay.y - c.y;
          if (engelUzaklik(c.bicim, wx, wy) < -3) boyali++;
        }
        sonuc['t' + tema].icteKiyi = boyali;
      }
      return sonuc;
    });
    for (const tema of [0, 3]) {
      sina(`${dil} kesişen göller (tema${tema + 1}): kıyı katmanı var, ortak alanda kıyı görünmez`, () => {
        const v = sk['t' + tema];
        assert.ok(v.komsu && v.ser && v.serB, JSON.stringify(v));
        assert.ok(v.dilim === 0 || v.dilim > 0);
        assert.equal(v.icteKiyi, 0, `komşunun suyunda kıyı pikseli ${v.icteKiyi}`);
      });
    }
    const dg = await p.evaluate(() => {
      const aile = (A) => { for (const u of ULKELER) if (ulkeKodla(u.kod).aile === A) return u.kod; return null; };
      const r = {};
      for (const A of ['K', 'KS', 'KP', 'SH', 'SV', 'GA', 'GDA', 'DA', 'KA', 'LA']) {
        const kod = aile(A);
        if (!kod) { r[A] = null; continue; }
        if (game.running) endGame(false);
        online.mode = null; startGame({ tur: true, ulke: ulkeKodla(kod).sira }); game.paused = true; game.running = false;
        const o = engelOlustur({ x: 400, y: 400, w: 160, h: 110 }, 'su', kod, 31);
        game.waters = [o]; game.walls = game.walls.slice(0, 4); game.spikes = []; game.lavas = [];
        o._resim = null; o._olcek = 0;
        game.camera.x = 380; game.camera.y = 380; game.player.dead = true;
        const kayit = []; window.__izle = [`aile-${A}-kenar`]; window.__kayit = kayit;
        for (let i = 0; i < 3; i++) render();
        window.__kayit = null;
        r[A] = { kod, dilim: kayit.length, ser: !!(o._resim && o._resim.serit) };
      }
      return r;
    });
    for (const [A, v] of Object.entries(dg)) {
      sina(`${dil} Dünya Turu göl ${A}: aile-${A}-kenar şeridi sarılır`, () => { assert.ok(v && v.ser && v.dilim >= 20, JSON.stringify(v)); });
    }

    // ---- Yolculuk nehri ----
    const ny = await p.evaluate(() => {
      const r = {};
      for (const kod of [null, 'TR']) {
        if (game.running) endGame(false);
        online.mode = null;
        if (kod) startGame({ tur: true, ulke: ulkeKodla(kod).sira }); else { startGame(); game.level = 1; }
        buildWalls(); buildWaters(); buildHazards();
        game.paused = true; game.running = false; game.ghosts = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
        const z = game._yolculukDuzen.zones[1], g = z.gate;
        game.kopruAcik = game._yolculukDuzen.zones.map(() => true);
        game.camera.x = (z.gecitSol + z.gecitSag) / 2 - game.W / 2; game.camera.y = (g.bridgeY0 + g.bridgeY1) / 2 - game.H / 2;
        game.player.dead = true;
        render(); render();
        const s = z._gecitSerit;
        r[kod || 'klasik'] = { var: !!s, anahtar: yolculukKenarAnahtari(), solY: s && s.sol.c.height, sagY: s && s.sag.c.height, genis: s && [s.sol.c.width, s.sag.c.width] };
        // resimsiz: önbellek tazelenmez, eski düz kıyı yolu hatasız çalışır
        window.__gizli.add(yolculukKenarAnahtari());
        z._gecitSerit = null;
        render();
        r[kod || 'klasik'].yedek = z._gecitSerit === null || z._gecitSerit === undefined;
        window.__gizli.clear();
        online.mode = null; endGame(false);
      }
      return r;
    });
    for (const [ad, v] of Object.entries(ny)) {
      sina(`${dil} yolculuk nehri (${ad}): iki kıyı için kenar şeridi tuvali (${v.anahtar})`, () => {
        assert.ok(v.var, 'şerit tuvali yok');
        assert.ok(v.solY > 800 && v.sagY > 800, `yükseklik ${v.solY}`);
        assert.ok(v.genis[0] < 600 && v.genis[1] < 600, `genişlik ${v.genis}`);
        assert.ok(v.yedek, 'resim yokken şerit kurulmamalı (eski kıyı yedek)');
      });
    }

    // ---- Yedek: resim yokken eski kod görünümü, hatasız ----
    const yd = await p.evaluate(() => {
      const hepsi = [];
      for (let n = 1; n <= 6; n++) { hepsi.push(`tema${n}-diken`, `tema${n}-diken-taban`, `tema${n}-kenar`); }
      for (const A of ['K', 'KS', 'KP', 'SH', 'SV', 'GA', 'GDA', 'DA', 'KA', 'LA']) hepsi.push(`aile-${A}-kenar`);
      for (const k of hepsi) window.__gizli.add(k);
      const r = {};
      const boyaliMi = (R) => { const d = R.c.getContext('2d').getImageData(0, 0, R.c.width, R.c.height).data; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) return true; return false; };
      try {
        for (const tur of ['diken', 'su']) for (const tema of [0, 1, 2, 3, 4, 5, 'TR']) {
          const o = __sahne(tur, tema, 100, 100, 5);
          const { R } = __ciz(o, []);
          r[`${tur}-${tema}`] = { boyali: boyaliMi(R), serit: tur === 'su' ? !!suSeritResmi(o) : null };
        }
      } finally { window.__gizli.clear(); }
      return r;
    });
    sina(`${dil} resim yokken eski kod diken ve kıyı çizimi hatasız ve boyalı`, () => {
      for (const [k, v] of Object.entries(yd)) assert.ok(v.boyali, `${k} boş`);
    });
    sina(`${dil} resim yokken kıyı şeridi katmanı kurulmaz`, () => {
      for (const [k, v] of Object.entries(yd)) if (k.startsWith('su-')) assert.equal(v.serit, false, k);
    });
    await p.close();
  }
  sina('sayfa hatası yok', () => assert.deepEqual(hatalar, []));
} finally {
  await b.close(); sunucu.close();
}
console.log(sonuclar.join('\n'));
if (sonuclar.some((s) => s.startsWith('✗'))) process.exit(1);
