// Hayalet Avcıları: CAN1 — ChatGPT can çerçevesinde (ui-can-cubugu) dolgu görünür.
// Çerçeve resminin içi opak koyu bir oluk (saydamlık ~253/255); dolgu çerçeveden önce çizildiği için çerçeve onu örtüyor,
// boss, hayalet, bot, öteki oyuncu ve pet can çubukları dolu da olsa boş görünüyordu (mağaza karesinde fark edildi).
// Kural: önce çerçeve, sonra oluğun içine dolgu (can oranı kadar). Resim yoksa eski düz dikdörtgen yedek değişmez.
// Çalıştırma: node test/can1.test.mjs   (Playwright + Chromium; ağ ve Firebase gerekmez)
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
const kirmizi = ([r, g, b]) => r > 150 && r > g + 80 && r > b + 80;

const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const hatalar = [];
try {
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('hayaletAvcilariDil', 'tr'); localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9'); });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof gorsel === 'function' && !!gorsel('ui-can-cubugu'), null, { timeout: 20000 });

  // (a) Yardımcı: 200 birim iç genişlik, oran 0,5 → sol yarı kırmızı, sağ yarı kırmızı değil; oran 1 → sağ da kırmızı
  const yardimci = await p.evaluate(() => {
    const oku = (oran) => {
      const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64;
      const ctx = cv.getContext('2d');
      canCubuguCiz(ctx, 128, 32, 200, oran, '#ef4444');
      const px = (x) => Array.from(ctx.getImageData(x, 32, 1, 1).data);
      return { sol: px(128 - 50), sag: px(128 + 50) };
    };
    return { yari: oku(0.5), tam: oku(1) };
  });
  sina(`canCubuguCiz: yarı canda sol yarı dolgu rengi (${yardimci.yari.sol}), sağ yarı değil (${yardimci.yari.sag})`, () => {
    assert.ok(kirmizi(yardimci.yari.sol), String(yardimci.yari.sol));
    assert.ok(!kirmizi(yardimci.yari.sag), String(yardimci.yari.sag));
  });
  sina(`canCubuguCiz: tam canda sağ yarı da dolgu rengi (${yardimci.tam.sag})`, () => { assert.ok(kirmizi(yardimci.tam.sag), String(yardimci.tam.sag)); });

  // (b) Boss can çubuğu (drawGhost): yarı canlı boss, çubuğun sol çeyreği dolgu rengi
  await p.evaluate(() => { save.playerName = 'Kiki'; persistSave(); startGame(); game.player.invuln = 1e9; spawnBoss(); });
  await p.waitForTimeout(3000); // bossun iniş animasyonu (yukarıdan saydam süzülüş) bitsin
  const boss = await p.evaluate(() => {
    const g = Object.assign({}, game.ghosts.find((x) => x.isBoss), { x: 200, y: 220, hp: 50, maxHp: 100, cikis: 0 });
    const cv = document.createElement('canvas'); cv.width = 400; cv.height = 400;
    const ctx = cv.getContext('2d');
    drawGhost(ctx, g);
    const s = g.size / 40, w = 60 * s, cy = g.y - 44 * s + 2.5 * s;
    return Array.from(ctx.getImageData(Math.round(g.x - w / 4), Math.round(cy), 1, 1).data);
  });
  sina(`drawGhost: yarı canlı bossun çubuğunun sol çeyreği dolgu rengi (${boss})`, () => { assert.ok(kirmizi(boss), String(boss)); });

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
