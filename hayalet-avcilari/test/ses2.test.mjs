// Hayalet Avcıları: SES2 — hayalet sesleri konumundan gelir (uzaklık + yön).
// Kullanıcı (28 Kasım 2026): "Hayaletlerin sesleri uzaklığa göre ayarlansın. Uzakta olanın sesi uzaktan gelsin. Yakında
// olanınkisi yakından." Önce: hayaletSesi → audio.smallGhost()/bigGhost() konumsuz, hep tam ses ve ortadan çalıyordu.
// Kural (audio.konumSesi(x, y) → { kazanc, pan, kesim }; dinleyici: canlı oyuncu, yoksa kameranın ortası):
//   kazanc: 160 px'e kadar 1; ötesinde ters uzaklık (160 / d); 1100-1400 px arasında sıfıra iner; 1400 px'ten ötesi 0 (çalmaz)
//   pan: sağdaki hayalet sağdan (> 0), soldaki soldan (< 0), [-1, 1]
//   kesim: alçak geçiren süzgecin frekansı uzaklıkla düşer (uzaktaki ses boğuk gelir)
// Konumsuz çağrı (ayarlardaki ses denemesi gibi) bugünkü gibi: tam ses, ortadan.
// Çalıştırma: node test/ses2.test.mjs   (Playwright + Chromium; ağ ve Firebase gerekmez)
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

const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--autoplay-policy=no-user-gesture-required'] });
const hatalar = [];
try {
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript(() => {
    localStorage.setItem('hayaletAvcilariDil', 'tr'); localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9');
    localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1');
  });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.evaluate(() => { save.playerName = 'Kiki'; persistSave(); audio.init(); startGame(); game.player.invuln = 1e9; });
  await p.waitForFunction(() => audio.samples && audio.samples.smallGhost && audio.samples.bigGhost, null, { timeout: 20000 });

  // (a) Saf hesap: oyuncu (1000, 500)
  const k = await p.evaluate(() => {
    if (typeof audio.konumSesi !== 'function') return null;
    game.player.x = 1000; game.player.y = 500; game.player.dead = false;
    const o = (x, y) => audio.konumSesi(x, y);
    return { yakin: o(1040, 500), orta: o(1400, 500), uzak: o(1800, 500), cokUzak: o(2600, 500), sol: o(700, 500), sag: o(1300, 500), ust: o(1000, 200) };
  });
  sina('audio.konumSesi var', () => { assert.ok(k, 'audio.konumSesi tanımlı değil'); });
  if (k) {
    sina(`yakındaki hayalet tam ses (${k.yakin.kazanc.toFixed(2)})`, () => { assert.ok(k.yakin.kazanc >= 0.95, String(k.yakin.kazanc)); });
    sina(`ses uzaklıkla azalır (400 px ${k.orta.kazanc.toFixed(2)} > 800 px ${k.uzak.kazanc.toFixed(2)} > 0)`, () => {
      assert.ok(k.orta.kazanc < 0.6 && k.orta.kazanc > k.uzak.kazanc && k.uzak.kazanc > 0 && k.uzak.kazanc <= 0.3, JSON.stringify([k.orta, k.uzak]));
    });
    sina(`1400 px'ten uzaktaki hayalet duyulmaz (${k.cokUzak.kazanc})`, () => { assert.equal(k.cokUzak.kazanc, 0); });
    sina(`soldaki soldan (${k.sol.pan.toFixed(2)}), sağdaki sağdan (${k.sag.pan.toFixed(2)}), tam üstteki ortadan (${k.ust.pan.toFixed(2)})`, () => {
      assert.ok(k.sol.pan < -0.3 && k.sag.pan > 0.3 && Math.abs(k.ust.pan) < 0.05, JSON.stringify([k.sol.pan, k.sag.pan, k.ust.pan]));
      for (const v of Object.values(k)) assert.ok(v.pan >= -1 && v.pan <= 1, String(v.pan));
    });
    sina(`uzaktaki ses boğuk (süzgeç ${Math.round(k.yakin.kesim)} Hz → ${Math.round(k.uzak.kesim)} Hz)`, () => {
      assert.ok(k.yakin.kesim >= 8000 && k.uzak.kesim < k.yakin.kesim * 0.5, JSON.stringify([k.yakin.kesim, k.uzak.kesim]));
    });
  }

  // (b) Oyundaki çağrılar konumu iletir: hayaletSesi (küçük ve boss), spawnBoss; konumsuz çağrı bugünkü gibi
  const c = await p.evaluate(() => {
    const kayit = [];
    const asil = audio.playSample;
    audio.playSample = function (key, vol, konum) { kayit.push({ key, vol, konum: konum || null }); return asil.apply(this, arguments); };
    game.player.x = 1000; game.player.y = 500;
    const kucuk = (x, y) => { audio._lastSmallGhost = 0; hayaletSesi({ x, y, isBoss: false, nextSound: 1 }, performance.now() + 1e6); };
    const r = {};
    kayit.length = 0; kucuk(1040, 500); r.yakin = kayit.slice();
    kayit.length = 0; kucuk(1800, 500); r.uzak = kayit.slice();
    kayit.length = 0; kucuk(2600, 500); r.cokUzak = kayit.slice();
    kayit.length = 0; hayaletSesi({ x: 700, y: 500, isBoss: true, nextSound: 1 }, performance.now() + 1e6); r.boss = kayit.slice();
    kayit.length = 0; audio.bigGhost(); r.konumsuz = kayit.slice();
    kayit.length = 0; spawnBoss(); r.dogan = kayit.slice();
    audio.playSample = asil;
    r.v = audio._v('ghost');
    return r;
  });
  sina('yakındaki küçük hayalet: smallGhost tam ses, konumla', () => {
    assert.equal(c.yakin.length, 1, JSON.stringify(c.yakin));
    assert.equal(c.yakin[0].key, 'smallGhost');
    assert.ok(c.yakin[0].konum && c.yakin[0].konum.kazanc >= 0.95, JSON.stringify(c.yakin[0]));
  });
  sina('uzaktaki küçük hayalet: kısık (kazanç ≤ 0,3), sağdan', () => {
    assert.equal(c.uzak.length, 1, JSON.stringify(c.uzak));
    const s = c.uzak[0];
    assert.ok(s.konum && s.konum.kazanc > 0 && s.konum.kazanc <= 0.3 && s.konum.pan > 0.3, JSON.stringify(s));
  });
  sina('çok uzaktaki hayalet: hiç çalmaz (bip yedeği de yok)', () => { assert.equal(c.cokUzak.length, 0, JSON.stringify(c.cokUzak)); });
  sina('soldaki boss: bigGhost soldan', () => {
    assert.ok(c.boss.length >= 1 && c.boss[0].key === 'bigGhost' && c.boss[0].konum && c.boss[0].konum.pan < -0.3, JSON.stringify(c.boss));
  });
  sina('konumsuz bigGhost (ayarlardaki deneme) bugünkü gibi: konum yok, 0,8 × hayalet sesi', () => {
    assert.ok(c.konumsuz.length === 1 && c.konumsuz[0].konum === null && Math.abs(c.konumsuz[0].vol - 0.8 * c.v) < 1e-9, JSON.stringify(c.konumsuz));
  });
  sina('boss doğunca sesi konumundan gelir', () => { assert.ok(c.dogan.length >= 1 && c.dogan[0].konum, JSON.stringify(c.dogan)); });

  // (c) Gerçek ses grafiği: konumlu çalma hatasız; sağ-sol için StereoPanner kullanılır
  const g = await p.evaluate(() => {
    let panner = 0, suzgec = 0;
    const ctx = audio.ctx, ap = ctx.createStereoPanner.bind(ctx), as = ctx.createBiquadFilter.bind(ctx);
    ctx.createStereoPanner = () => { panner++; return ap(); };
    ctx.createBiquadFilter = () => { suzgec++; return as(); };
    audio._lastSmallGhost = 0;
    const ok = audio.playSample('smallGhost', 0.4, audio.konumSesi(1300, 500));
    ctx.createStereoPanner = ap; ctx.createBiquadFilter = as;
    return { ok, panner, suzgec };
  });
  sina(`konumlu çalma StereoPanner ve süzgeçle (${JSON.stringify(g)})`, () => { assert.deepEqual(g, { ok: true, panner: 1, suzgec: 1 }); });

  await p.evaluate(() => endGame(false));
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
