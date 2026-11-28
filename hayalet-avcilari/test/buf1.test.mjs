// Hayalet Avcıları: BUF1 — aktif güçler kenarda dairesel (MOBA tarzı) simge, köprü bildirimi dar şerit.
// Güç: 44-48 px yuvarlak, sol kenarda (Arapçada sağ), üstünde yazı yok; ad ilk ~2 sn küçük hapta görünür; radyal geri sayım
// (--ae-p) azalır; güç bitince simge kalkar. Köprü açıldı: ilerleme çubuğunun altında üst ortada şerit, ~2 sn, tıklamayı engellemez.
// Çalıştırma: node hayalet-avcilari/test/buf1.test.mjs   (Playwright + Chromium; ağ ve Firebase gerekmez)
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
const EKRAN = process.env.BUF1_EKRAN || '';

const sonuclar = [];
function sina(ad, fn) {
  try { fn(); sonuclar.push(`✓ ${ad}`); } catch (e) { sonuclar.push(`✗ ${ad}: ${e.message.split('\n')[0]}`); }
}
const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const hatalar = [];
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
const kesisir = (a, c, tol = 0) => a.right > c.left - tol && a.left < c.right + tol && a.bottom > c.top - tol && a.top < c.bottom + tol;

async function calistir(dil, en, boy) {
  const etiket = `${dil} ${en}x${boy}`;
  const p = await b.newPage({ viewport: { width: en, height: boy }, hasTouch: true });
  p.on('pageerror', (e) => hatalar.push(`${etiket}: ${e.stack}`));
  await p.addInitScript((d) => { localStorage.setItem('hayaletAvcilariDil', d); localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1'); }, dil);
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof startGame === 'function' && typeof activatePower === 'function' && typeof yolculukKopruAc === 'function');
  await p.evaluate(() => {
    localStorage.setItem(VERSION_KEY, APP_VERSION);
    save.playerName = save.playerName || 'Deniz';
    startGame();
    game.ghosts = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9; game.player.invuln = 1e9;
    CHAR_POWERS[game.player.charKey || 'kinkin'].duration = 5200; // sınama için kısa
  });
  await bekle(300);

  // güç başlat; ölçümler (ölçüm aracı sayfada)
  const olc = () => p.evaluate(() => {
    const k = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height }; };
    const gor = (e) => { if (!e) return null; const cs = getComputedStyle(e); return cs.display === 'none' || cs.visibility === 'hidden' ? null : k(e); };
    const buf = document.querySelector('#power-bar .buf');
    const halka = document.querySelector('#power-bar .buf-halka');
    const ad = document.querySelector('#power-bar .buf-ad');
    const bnr = document.getElementById('bnr-serit');
    const gecici = (e) => { if (!e) return 0; const cs = getComputedStyle(e); return cs.visibility === 'hidden' ? 0 : parseFloat(cs.opacity); };
    const hl = halka ? getComputedStyle(halka) : null;
    return {
      w: innerWidth, h: innerHeight, rtl: getComputedStyle(document.documentElement).direction === 'rtl',
      buf: !!buf, halka: k(halka), radius: hl ? hl.borderRadius : '', p: halka ? parseFloat(halka.style.getPropertyValue('--ae-p')) : null,
      adOpak: gecici(ad), adMetin: ad ? ad.textContent : '',
      halkaYazi: halka ? halka.textContent.replace(/\s/g, '') : '', // simge emoji olabilir; resimde boş
      halkaResim: halka ? !!halka.querySelector('img') : false,
      bnrOpak: gecici(bnr), bnr: gor(bnr), bnrMetin: bnr ? bnr.textContent : '', bnrResim: bnr ? !!bnr.querySelector('img') : false,
      bnrPE: bnr ? getComputedStyle(bnr).pointerEvents : '',
      yol: gor(document.getElementById('yolculuk-hud')), pause: gor(document.querySelector('.pause-btn')),
      hudLeft: gor(document.querySelector('.hud-left')), hudRight: gor(document.querySelector('.hud-right')),
      inv: gor(document.getElementById('inv-btn')), weapons: [...document.querySelectorAll('#weapon-bar .weapon-slot, #weapon-bar .weapon-more')].map(gor).filter(Boolean),
      tasma: document.documentElement.scrollWidth - innerWidth,
      pad: gor(document.getElementById('power-bar')),
    };
  });

  const t0 = Date.now();
  await p.evaluate(() => activatePower(game.player.charKey || 'kinkin'));
  await bekle(500 - (Date.now() - t0));
  const a = await olc();
  const hudSol = a.hudLeft;
  sina(`${etiket}: güç simgesi yuvarlak (44-48 px) ve kenarda`, () => {
    assert.ok(a.buf, 'buf yok');
    assert.ok(a.halka.width >= 44 && a.halka.width <= 48, `genişlik ${a.halka.width}`);
    assert.ok(Math.abs(a.halka.width - a.halka.height) < 1, 'kare değil');
    assert.ok(/50%|9999|999px|23px|24px/.test(a.radius), `yarıçap ${a.radius}`);
    if (!a.rtl) assert.ok(a.halka.left < 80, `sol kenar ${a.halka.left}`);
    else assert.ok(a.w - a.halka.right < 80, `sağ kenar ${a.w - a.halka.right}`);
    assert.ok(a.halka.top >= hudSol.bottom - 1, `sol HUD'un altında olmalı (${a.halka.top} < ${hudSol.bottom})`);
  });
  sina(`${etiket}: daire üstünde yazı yok; ad hapı 0,5 sn'de görünür`, () => {
    assert.ok(a.halkaYazi.length <= 4, `daire metni "${a.halkaYazi}"`); // yalnız emoji yedeği olabilir
    assert.ok(a.adOpak > 0.5, `ad opaklığı ${a.adOpak}`);
    assert.ok(a.adMetin.length > 2, 'ad boş');
  });
  sina(`${etiket}: kenar boşlukları ve HUD ile çakışma yok`, () => {
    for (const o of [a.pause, a.hudLeft, a.hudRight, a.inv, ...a.weapons]) { if (o) assert.ok(!kesisir(a.halka, o, 0), 'daire HUD/düğmeyle çakışıyor'); }
    assert.ok(a.halka.left >= 0 && a.halka.right <= a.w && a.halka.bottom <= a.h, 'ekran dışı');
    assert.equal(a.tasma, 0, 'yatay taşma');
  });

  await bekle(1000);
  const a2 = await olc();
  await bekle(1100 - 0); // t ≈ 2,6 sn
  const ara = await olc();
  sina(`${etiket}: geri sayım halkası azalır; ad 2,6 sn'de kaybolur, daire kalır`, () => {
    assert.ok(a2.p < a.p, `halka değişmedi ${a.p} → ${a2.p}`);
    assert.ok(ara.p < a2.p, `halka değişmedi ${a2.p} → ${ara.p}`);
    assert.ok(ara.adOpak < 0.05, `ad hâlâ görünür ${ara.adOpak}`);
    assert.ok(ara.buf && ara.halka.width >= 44, 'daire kayboldu');
  });

  // köprü bildirimi (güç sürerken)
  await bekle(300);
  const kopruOnce = await olc();
  await p.evaluate(() => { game.kopruAcik.fill(false); yolculukKopruAc(0); });
  await bekle(500);
  const k1 = await olc();
  sina(`${etiket}: köprü şeridi üst ortada, çubuğun altında, hiçbir şeye binmez, tıklamayı engellemez`, () => {
    assert.ok(k1.bnrOpak > 0.5, `şerit görünmüyor (${k1.bnrOpak})`);
    assert.match(k1.bnrMetin, /Köprü|Bridge|Brücke|الجسر/);
    assert.ok(k1.bnrResim || /🌉/.test(k1.bnrMetin), 'köprü simgesi yok');
    assert.equal(k1.bnrPE, 'none');
    const cx = (k1.bnr.left + k1.bnr.right) / 2;
    assert.ok(Math.abs(cx - k1.w / 2) < 2, `ortada değil ${cx}`);
    assert.ok(k1.yol, 'ilerleme çubuğu yok');
    assert.ok(!kesisir(k1.bnr, k1.yol), 'ilerleme çubuğuna biniyor');
    assert.ok(k1.bnr.top >= k1.yol.bottom - 1, 'çubuğun altında değil');
    for (const o of [k1.pause, k1.hudLeft, k1.hudRight]) if (o) assert.ok(!kesisir(k1.bnr, o), 'HUD ile çakışıyor');
    if (k1.halka) assert.ok(!kesisir(k1.bnr, k1.halka), 'güç simgesine biniyor');
    assert.ok(k1.bnr.left >= 0 && k1.bnr.right <= k1.w, 'ekran dışı');
    assert.equal(k1.tasma, 0, 'yatay taşma');
    assert.ok(kopruOnce.bnrOpak === 0, 'şerit önceden açık');
  });
  if (EKRAN) await p.screenshot({ path: `${EKRAN}/buf1-${dil}-${en}x${boy}.png` });

  await bekle(2000);
  const k2 = await olc();
  sina(`${etiket}: köprü şeridi ~2,5 sn sonra kapanır`, () => { assert.ok(k2.bnrOpak < 0.05, `şerit hâlâ ${k2.bnrOpak}`); });

  // güç biter
  await bekle(1500);
  const son = await olc();
  sina(`${etiket}: güç bitince simge kalkar`, () => { assert.equal(son.buf, false); });
  await p.close();
}

try {
  for (const [dil, en, boy] of [['tr', 390, 844], ['ar', 340, 740], ['tr', 844, 390]]) await calistir(dil, en, boy);
} finally {
  await b.close(); sunucu.close();
}
console.log(sonuclar.join('\n'));
if (hatalar.length) { console.log('Sayfa hataları:\n' + hatalar.join('\n')); process.exitCode = 1; }
if (sonuclar.some((s) => s.startsWith('✗'))) process.exitCode = 1;
