// Hayalet Avcıları: SEL2 — dereyle uyumlu şelale ve zıplayan balık.
// Kullanıcı (28 Kasım 2026, ekran görüntüsü): "Şelaleler daha uyumlu olsun dere ile, gerekirse yeni şelaleler üret; derede de
// zıplayan balıklar olsun; devam eden işi bozma." Eski an-selale-* kareleri kendi havuzu ve kayalarıyla ayrı bir sahneydi ve
// derenin 30 px fazlası genişlikte düz dikdörtgen basılıyordu (kıyıların üstüne taşıyordu).
// Kural:
//   - Şelale yalnız yeni kareleri kullanır: an-selale2-* (tek basamak) ya da an-selale3-* (çağlayan); çeşit şelalenin tohumundan.
//     Resim derenin o yüksekliğindeki genişliğini aşmaz (kıyının üstüne binmez). Klasik temada dere rengine boyama (SEL1) sürer.
//   - Balık: görünen derede zaman zaman an-balik-1..6 kareleriyle sıçrar; etkin balıklar game.baliklar dizisinde
//     ({ x, y, bas, ayna }), her biri suyun içinde (dere merkez çizgisinden en çok yarı genişlik − 8 px). "Az hareket" tercihi
//     açıksa balık sıçramaz. Yalnız görsel: çarpışma, ağ ve oyun kuralı değişmez.
// Çalıştırma: node test/sel2.test.mjs   (Playwright + Chromium; ağ ve Firebase gerekmez)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WWW = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);
const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2', '.webp': 'image/webp', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg' };
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
const sayfa = async (azHareket) => {
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  if (azHareket) await p.emulateMedia({ reducedMotion: 'reduce' });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript(() => {
    localStorage.setItem('hayaletAvcilariDil', 'tr'); localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9');
    localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1');
  });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => ['an-selale2-1', 'an-selale3-1', 'an-balik-1', 'an-balik-6'].every((k) => typeof gorsel === 'function' && gorsel(k)), null, { timeout: 30000 });
  await p.evaluate(() => {
    window.__kur = (ulke = null) => {
      if (game.running) endGame(false);
      online.mode = null;
      startGame(ulke ? { tur: true, ulke: ulkeKodla(ulke).sira } : undefined);
      game.paused = true; game.player.invuln = 1e9;
      game.ghosts = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
      return game;
    };
    // Kamerayı ilk şelaleye getirip dereyi bir kez çizer; şelale resimlerinin (ad, genişlik) kaydı
    window.__selale = (ulke) => {
      __kur(ulke);
      const tonlar = { ...SELALE_TON }; for (const k in SELALE_TON) SELALE_TON[k] = null; // ham kare (boyamasız) görülsün
      const sonuc = [];
      for (const z of game._yolculukDuzen.zones) for (const d of z._gecitDusmeler || []) {
        game.W = 600; game.H = 600; game.camera = { x: d.x - 300, y: d.y - 300 };
        const cv = document.createElement('canvas'); cv.width = cv.height = 600; const x = cv.getContext('2d');
        const ad = x.drawImage.bind(x), kayit = [];
        x.drawImage = (im, ...a) => { if (im && im.src && /an-selale/.test(im.src)) kayit.push({ src: im.src.split('/').pop(), w: a.length >= 4 ? a[a.length - 2] : im.width }); return ad(im, ...a); };
        yolculukGecitCiz(x);
        sonuc.push({ yarim: d.yarim, kayit });
      }
      Object.assign(SELALE_TON, tonlar);
      return sonuc;
    };
    // Dere başında sn saniye boyunca dereyi çizer; balık karelerini ve game.baliklar konumlarını toplar
    window.__balik = (ulke, sn) => new Promise((coz) => {
      __kur(ulke);
      const z = game._yolculukDuzen.zones[0], eg = z._gecitEgri;
      const y0 = (z._gecitDusmeler && z._gecitDusmeler[0] ? z._gecitDusmeler[0].y : game.worldH / 2) + 260;
      game.W = 600; game.H = 900; game.camera = { x: eg.merkez - 300, y: Math.max(0, y0 - 450) };
      const cv = document.createElement('canvas'); cv.width = 600; cv.height = 900; const x = cv.getContext('2d');
      const ad = x.drawImage.bind(x); let kare = 0; const disari = [];
      x.drawImage = (im, ...a) => { if (im && im.src && /an-balik-\d/.test(im.src)) kare++; return ad(im, ...a); };
      const bas = performance.now(); let ornek = 0;
      const tur = () => {
        yolculukGecitCiz(x);
        for (const bl of game.baliklar || []) {
          ornek++;
          const zz = game._yolculukDuzen.zones.find((q) => q._gecitEgri && Math.abs(bl.x - q._gecitEgri.merkez) < 400);
          const e = zz && zz._gecitEgri;
          if (!e || Math.abs(bl.x - (e.merkez + e.offset(bl.y))) > e.yari(bl.y) - 8) disari.push([Math.round(bl.x), Math.round(bl.y)]);
        }
        if (performance.now() - bas < sn * 1000) setTimeout(tur, 50); else coz({ kare, ornek, disari: disari.slice(0, 5), dizi: Array.isArray(game.baliklar) });
      };
      tur();
    });
  });
  return p;
};

try {
  const p = await sayfa(false);
  for (const [ad, ulke] of [['klasik bölüm 1', null], ['Dünya Turu JP', 'JP']]) {
    const s = await p.evaluate((u) => __selale(u), ulke);
    const kayit = s.flatMap((q) => q.kayit);
    sina(`${ad}: şelaleler yalnız yeni karelerle (${kayit.length} çizim; ${[...new Set(kayit.map((k) => k.src.replace(/-\d\.webp$/, '')))].join(', ')})`, () => {
      assert.ok(kayit.length > 0, 'şelale resmi çizilmedi');
      for (const k of kayit) assert.match(k.src, /^an-selale[23]-[123]\.webp$/, k.src);
    });
    sina(`${ad}: şelale resmi dereden geniş değil (kıyıya binmez)`, () => {
      for (const q of s) for (const k of q.kayit) assert.ok(k.w <= 2 * q.yarim + 6, `${k.w} > ${2 * q.yarim + 6}`);
    });
  }
  const bJP = await p.evaluate(() => __balik('JP', 14));
  sina(`derede balık sıçrar (14 sn'de ${bJP.kare} balık karesi çizildi)`, () => { assert.ok(bJP.dizi, 'game.baliklar dizi değil'); assert.ok(bJP.kare >= 6, String(bJP.kare)); });
  sina(`sıçrayan balık hep suyun içinde (${bJP.ornek} örnek)`, () => { assert.ok(bJP.ornek > 0, 'hiç balık örneği yok'); assert.deepEqual(bJP.disari, []); });
  const bK = await p.evaluate(() => __balik(null, 14));
  sina(`klasik temada da balık sıçrar (${bK.kare} kare)`, () => { assert.ok(bK.kare >= 6, String(bK.kare)); assert.deepEqual(bK.disari, []); });
  await p.evaluate(() => endGame(false));
  await p.close();

  const p2 = await sayfa(true);
  const bAz = await p2.evaluate(() => __balik('JP', 8));
  sina(`"az hareket" tercihinde balık sıçramaz (${bAz.kare} kare)`, () => { assert.equal(bAz.kare, 0); });
  await p2.evaluate(() => endGame(false));
  await p2.close();
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
