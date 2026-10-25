// Hayalet Avcıları: çevrimiçi oyunda ses (3.14.1) — çevrimdışı sınama.
// Oda kurucusunda cızırtı vardı: kurucu öteki oyuncuların her vuruşu için de 220 Hz kare dalga çalıyordu (6 kişilik
// Kenya odasında saniyede ~25 ses; istemcilerin olayları ~100 ms'lik paketlerle geldiği için 2–3'ü aynı anda başlayıp
// genlikçe toplanıyordu). İstemci yalnız kendi vuruşunu duyar; kurucu da öteki oyuncuların vuruşlarını sessiz uygular.
// Ölçüm yöntemi README › 3.14.1. Uçtan uca 6 kişilik ölçüm: alti.test.mjs.
// Çalıştırma: node hayalet-avcilari/test/ses.test.mjs   (Playwright + Chromium; ağ ve Firebase gerekmez)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WWW = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);
const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg' };
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
  await p.addInitScript(() => { localStorage.setItem('hayaletAvcilariDil', 'tr'); localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9'); });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForTimeout(300);

  // Kurucu kipinde oyun (ağ yok: oda kimliği yok, yazım yapılmaz); kurucu kendisi ateş etmez (menzil 0)
  await p.evaluate(() => {
    save.playerName = 'Kiki'; persistSave(); audio.init();
    online.mode = 'host'; online.uid = 'ben';
    startGame(); game.player.invuln = 1e9; game.player.range = 0;
  });
  await p.waitForFunction(() => game.ghosts.some((g) => !g.isBoss), null, { timeout: 15000 });
  const sonuc = await p.evaluate(() => {
    const g = game.ghosts.find((x) => !x.isBoss);
    kimlik(g); g.hp = 50; // kimlik durum yazılırken verilir (ağ yok)
    let ses = 0;
    const asil = audio.hit;
    audio.hit = (...a) => { ses++; return asil.apply(audio, a); };
    for (let i = 0; i < 5; i++) applyHostEvent({ type: 'hit', gi: g.id, dmg: 1, by: 'u2' });
    audio.hit = asil;
    return { can: g.hp, ses };
  });
  sina('kurucu öteki oyuncunun vuruşunu uygular (can 50 → 45) ama vuruş sesi çalmaz', () => {
    assert.deepEqual(sonuc, { can: 45, ses: 0 }, JSON.stringify(sonuc));
  });
  await p.evaluate(() => { online.mode = null; online.uid = null; endGame(false); });
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
