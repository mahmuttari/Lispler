// Hayalet Avcıları FIX2: geçiş köprüsü güvertesi ve timsahın karaya atılışı — çevrimdışı sınama.
// Köprü: görünür güverte (korkuluklar arası) ile yürünebilir şerit hizalı; oyuncu korkuluk dışına çıkamaz.
// Timsah: kıyıdan 24-40 px karaya atılır, ısırır, suya döner; su sıçraması gölden dışarı taşmaz.
// Çalıştırma: node test/fix2.test.mjs
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
  const p = await b.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript(() => {
    localStorage.setItem('hayaletAvcilariDil', 'tr');
    localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9');
    localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1');
  });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof startGame === 'function' && typeof yolculukHaritaKur === 'function' && typeof timsahGuncelle === 'function');
  await p.evaluate(() => {
    window.__kur = () => {
      if (game.running) endGame(false);
      online.mode = null;
      startGame();
      game.paused = true; game.ghosts = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
      game.player.invuln = 1e9; game.player.dead = false; game.player.dusus = null;
      game.level = 1; buildWalls(); buildWaters(); buildHazards();
      if (game.kopruAcik) game.kopruAcik.fill(true);
      game.ghosts = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
      timsahSifirla();
      return game;
    };
  });

  // 1) Köprü: yürünebilir şerit görünür güvertenin içinde; güverte ile hizalı
  const kopru = await p.evaluate(() => {
    __kur();
    const A = YOLCULUK_AYAR, z = game._yolculukDuzen.zones[0], g = z.gate;
    const r = game.player.r, x = (g.x0 + g.x1) / 2;
    const deckYari = yolculukKopruDeckYari();
    const yari = yolculukKopruYurumeYari(r);
    return {
      bridgeW: A.bridgeW, r, deckYari, yari,
      merkez: yolculukYuruyebilir(x, g.cy, r),
      ustIc: yolculukYuruyebilir(x, g.cy - yari + 2, r),
      ustDis: yolculukYuruyebilir(x, g.cy - yari - 4, r),
      altIc: yolculukYuruyebilir(x, g.cy + yari - 2, r),
      altDis: yolculukYuruyebilir(x, g.cy + yari + 4, r),
      kopruDis: !!koprudeMi(x, g.cy + yari + 4, r),
      resimBoyu: yolculukKopruResimBoyu(),
      cizilenGuverte: yolculukKopruResimBoyu() * KOPRU_GUVERTE_ORANI,
      yuruyusBant: 2 * yari + 2 * r,
    };
  });
  sina('köprü ~%30 genişletildi (bridgeW 120 → 156)', () => { assert.ok(kopru.bridgeW >= 150 && kopru.bridgeW <= 160, String(kopru.bridgeW)); });
  sina('oyuncu köprü merkezinden ve şerit kenarı - 2 px\'ten geçebilir', () => {
    assert.equal(kopru.merkez, true, JSON.stringify(kopru)); assert.equal(kopru.ustIc, true, JSON.stringify(kopru)); assert.equal(kopru.altIc, true, JSON.stringify(kopru));
  });
  sina('güverte bandı + 4 px dışında nehir engeller (korkuluk dışına çıkılmaz)', () => {
    assert.equal(kopru.ustDis, false); assert.equal(kopru.altDis, false); assert.equal(kopru.kopruDis, false);
  });
  sina('çizilen güverte bandı yürünebilir bantla 3 px içinde hizalı', () => {
    assert.ok(Math.abs(kopru.cizilenGuverte - kopru.yuruyusBant) <= 3, JSON.stringify(kopru));
    assert.ok(Math.abs(kopru.resimBoyu - kopru.bridgeW) < 1e-6, String(kopru.resimBoyu));
  });

  // 2) Timsah: kıyıdan karaya 24-40 px atılır, ısırır, suya döner
  const timsah = await p.evaluate(() => {
    __kur();
    const o = { x: 900, y: 450, w: 300, h: 300, carpisma: [{ t: 'k', x: 0, y: 0, w: 300, h: 300, rr: 0 }] };
    o.bicim = o.carpisma.map((q) => ({ ...q }));
    game.waters = [o]; game._timsahSular = game.waters; game.timsahlar = [];
    game._timsahKiyi = 0; game._timsahAra = 0; game._timsahSus = 1e9;
    const px = o.x + o.w + 45, py = o.y + o.h / 2;
    const tm = timsahSaldirt(o, px, py);
    if (!tm) return { yok: true };
    const konum = (t) => { const eski = tm.t; tm.t = t; const k = timsahKonum(tm); tm.t = eski; return k; };
    const ic = suUzakligi(o, tm.x, tm.y);
    const tepe = konum(TIMSAH.uyari + TIMSAH.atilma);
    const dis = suUzakligi(o, tepe.x, tepe.y);
    const donus = konum(TIMSAH.uyari + TIMSAH.atilma + TIMSAH.batis - 0.02);
    return { yok: false, ic, dis, donus: suUzakligi(o, donus.x, donus.y), adim: TIMSAH.adim };
  });
  sina('timsah su içinden çıkar ve ısırıkta karaya 24-40 px taşar', () => {
    assert.equal(timsah.yok, false);
    assert.ok(timsah.ic < -6, `iç ${timsah.ic}`);
    assert.ok(timsah.dis >= 24 && timsah.dis <= 40, `dış ${timsah.dis}`);
    assert.ok(timsah.adim >= 24 && timsah.adim <= 40, `adım ${timsah.adim}`);
  });
  sina('ısırıktan sonra timsah suya geri döner', () => { assert.ok(timsah.donus < -6, `dönüş ${timsah.donus}`); });

  // 3) Su sıçraması gölden dışarı taşmaz (su biçimine kırpılır)
  const splash = await p.evaluate(() => {
    __kur();
    const o = { x: 200, y: 200, w: 300, h: 260, carpisma: [{ t: 'k', x: 0, y: 0, w: 300, h: 260, rr: 0 }] };
    o.bicim = o.carpisma.map((q) => ({ ...q }));
    game.waters = [o]; game._timsahSular = game.waters;
    const tm = { tur: 'saldiri', x: o.x + o.w / 2, y: o.y + o.h - 18, a: Math.PI / 2, t: TIMSAH.uyari + TIMSAH.atilma * 0.8 };
    const cv = document.createElement('canvas'); cv.width = 760; cv.height = 760;
    const c = cv.getContext('2d');
    timsahSplashCiz(c, tm);
    const d = c.getImageData(0, 0, 760, 760).data;
    let dis = 0; const ilk = [];
    for (let y = 0; y < 760; y++) for (let x = 0; x < 760; x++) {
      if (d[(y * 760 + x) * 4 + 3] <= 4) continue;
      if (x < o.x || x >= o.x + o.w || y < o.y || y >= o.y + o.h) { dis++; if (ilk.length < 20) ilk.push([x, y, d[(y * 760 + x) * 4 + 3]]); }
    }
    return { dis, ilk };
  });
  sina('su sıçraması göl dışında 0 piksel bırakır', () => { assert.equal(splash.dis, 0, JSON.stringify(splash.ilk)); });

  sina('sayfa hatası yok', () => { assert.deepEqual(hatalar, []); });
} catch (e) {
  sonuclar.push(`✗ akış yarıda kaldı: ${e.message.split('\n')[0]}`);
} finally {
  await b.close();
  sunucu.close();
}
sonuclar.forEach((s) => console.log(s));
