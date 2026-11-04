// Hayalet Avcıları: oyun içinden Ses Ayarları'na girip çıkma (3.15.1) — çevrimdışı sınama.
// Kullanıcı bildirimi: "Ayarlara girip çıktığında oyun duruyor; ikinci defa ayarlara girip çıkman gerekiyor."
// Duraklatınca iki ekran açıktır (oyun + üstünde ⏸ menüsü); Ses Ayarları yalnız ilkine dönüyordu: ⏸ menüsü kayboluyor,
// oyun duraklatılmış kalıyor, "Devam" düğmesi görünmüyordu. Kapanınca açılırken açık olan bütün ekranlara dönülür.
// Çalıştırma: node hayalet-avcilari/test/ayarlar.test.mjs   (Playwright + Chromium; ağ ve Firebase gerekmez)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WWW = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);
const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.m4a': 'audio/mp4' };
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
  await p.addInitScript(() => {
    localStorage.setItem('hayaletAvcilariDil', 'tr');
    localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9');
  });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof openSoundSettings === 'function' && typeof startGame === 'function');
  const acik = () => p.evaluate(() => [...document.querySelectorAll('.screen.active')].map((s) => s.id).sort().join(','));
  // Görünmeyen düğmeye tıklanamaz (kullanıcı da tıklayamaz): 2 sn'de tıklanamazsa false
  const tikla = (secici) => p.click(secici, { timeout: 2000 }).then(() => true, () => false);

  // Oyun içinde: ⏸ → 🎚 Ses Ayarları → ✓ TAMAM → ⏸ menüsü yine görünür → ▶ Devam → oyun akar
  await p.evaluate(() => { startGame(); game.player.invuln = 1e9; });
  await tikla('.pause-btn');
  const duraklatildi = await acik();
  await tikla('#screen-pause button[onclick="openSoundSettings()"]');
  const ayarlarda = await acik();
  await tikla('#screen-sound button[onclick="closeSoundSettings()"]');
  const donunce = { ekran: await acik(), paused: await p.evaluate(() => game.paused) };
  const devamGorunur = await tikla('#screen-pause button[onclick="resumeGame()"]');
  const s0 = await p.evaluate(() => game.oynananSure);
  await p.waitForTimeout(500);
  const devam = await p.evaluate((s0) => ({ paused: game.paused, akti: game.oynananSure > s0 + 0.2, muzik: muzik.duraklatildi }), s0);
  sina('⏸ menüsünden Ses Ayarları açılır', () => {
    assert.equal(duraklatildi, 'screen-game,screen-pause'); assert.equal(ayarlarda, 'screen-sound');
  });
  sina('TAMAM\'a basınca ⏸ menüsü yine görünür (oyun ekranı arkada)', () => {
    assert.equal(donunce.ekran, 'screen-game,screen-pause'); assert.equal(donunce.paused, true); assert.equal(devamGorunur, true, '▶ Devam görünmüyor');
  });
  sina('bir kez ▶ Devam ile oyun akar, müzik kısıklığı kalkar', () => {
    assert.deepEqual(devam, { paused: false, akti: true, muzik: false });
  });

  // Art arda iki kez girip çıkma da aynı yere döner
  await tikla('.pause-btn');
  for (let i = 0; i < 2; i++) {
    await tikla('#screen-pause button[onclick="openSoundSettings()"]');
    await tikla('#screen-sound button[onclick="closeSoundSettings()"]');
  }
  const ikiKez = await acik();
  await tikla('#screen-pause button[onclick="resumeGame()"]');
  sina('art arda iki kez girip çıkınca da ⏸ menüsüne döner', () => { assert.equal(ikiKez, 'screen-game,screen-pause'); });

  // Ana menüden: 🎚 Ses → TAMAM → ana menü
  await p.evaluate(() => { try { localStorage.setItem(VERSION_KEY, APP_VERSION); } catch (_) {} quitToMenu(); }); // sürüm notu açılmasın
  await tikla('#screen-menu button[onclick="openSoundSettings()"]');
  await tikla('#screen-sound button[onclick="closeSoundSettings()"]');
  const menu = await acik();
  sina('ana menüden açılınca ana menüye döner', () => { assert.equal(menu, 'screen-menu'); });
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
