// Hayalet Avcıları: KLP1 — çevrimiçi takım listesinde canlar ChatGPT kalp resmiyle (K7'nin kalanı).
// Ana can göstergesi (#lives) kalp resmini kullanıyordu, HUD'daki takım listesi (#takim) hâlâ ❤️/🖤 emojisi basıyordu.
// Kural: resim varsa resim (dolu kalp, boş can aynı resmin sönük hâli), yoksa emoji yedek; ölü oyuncu 👻.
// Çalıştırma: node test/kalp1.test.mjs   (Playwright + Chromium; ağ ve Firebase gerekmez)
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
try {
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('hayaletAvcilariDil', 'tr'); localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9'); });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof gorsel === 'function' && !!gorsel('kalp'), null, { timeout: 20000 });

  // Kurucu kipinde oyun (ağ yok); takım listesi oyuncunun kendisi + iki uzak oyuncu (biri ölü)
  const olc = () => p.evaluate(() => {
    const el = document.getElementById('takim');
    return [...el.querySelectorAll('.takim-oyuncu')].map((s) => {
      const can = s.querySelector('span');
      return {
        dolu: can.querySelectorAll('img.can-kalp:not(.bos)').length,
        bos: can.querySelectorAll('img.can-kalp.bos').length,
        emoji: (can.textContent.match(/❤️|🖤/gu) || []).length,
        hayalet: can.textContent.includes('👻'),
        etiket: can.getAttribute('aria-label'),
      };
    });
  });
  await p.evaluate(() => {
    save.playerName = 'Kiki'; persistSave();
    online.mode = 'host'; online.uid = 'ben';
    startGame(); game.player.invuln = 1e9;
    game.player.hp = 2; game.player.maxHp = 3;
    online.remotePlayers = { u2: { name: 'Ayşe', hp: 3, maxHp: 3, dead: false }, u3: { name: 'Can', hp: 0, maxHp: 3, dead: true } };
    takimCiz(performance.now() + 1e6);
  });
  const resimli = await olc();
  sina('resim varken takım listesindeki canlar kalp resmi (dolu + sönük), emoji yok', () => {
    assert.equal(resimli.length, 3, JSON.stringify(resimli));
    assert.deepEqual(resimli[0], { dolu: 2, bos: 1, emoji: 0, hayalet: false, etiket: '2/3' });
    assert.deepEqual(resimli[1], { dolu: 3, bos: 0, emoji: 0, hayalet: false, etiket: '3/3' });
  });
  sina('ölü oyuncu 👻 ile gösterilir (kalp yok)', () => {
    assert.equal(resimli[2].hayalet, true);
    assert.equal(resimli[2].dolu + resimli[2].bos + resimli[2].emoji, 0);
  });

  // Resim yoksa emoji yedek (gorsel('kalp') null)
  const yedek = await p.evaluate(() => {
    const asil = window.gorsel;
    window.gorsel = (k) => (k === 'kalp' ? null : asil(k));
    try { takimCiz(performance.now() + 2e6); } finally { window.gorsel = asil; }
    const s = document.querySelector('#takim .takim-oyuncu span');
    return { img: s.querySelectorAll('img').length, metin: s.textContent, boy: s.parentElement.getBoundingClientRect().height };
  });
  sina('resim yokken emoji yedek (❤️❤️🖤)', () => {
    assert.deepEqual({ img: yedek.img, metin: yedek.metin }, { img: 0, metin: '❤️❤️🖤' });
  });

  // Satırın yüksekliği emoji sürümünden büyümez (HUD'u aşağı itmesin)
  const boy = await p.evaluate(() => {
    takimCiz(performance.now() + 3e6);
    return document.querySelector('#takim .takim-oyuncu').getBoundingClientRect().height;
  });
  sina(`takım satırı emoji sürümünden yüksek değil (${boy.toFixed(1)} px ≤ ${yedek.boy.toFixed(1)} + 1)`, () => {
    assert.ok(boy <= yedek.boy + 1, `${boy} > ${yedek.boy}`);
  });

  await p.evaluate(() => { online.mode = null; online.uid = null; online.remotePlayers = {}; endGame(false); });
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
