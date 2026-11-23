// Hayalet Avcıları: karakter ekranı (3.20.0 arayüzün 1. bölümü: canliOnizleme, uiSimgeHTML) — çevrimdışı sınama.
// Açılış karşılıyıcısı ve menü kareti artık canlı tuvalle çizilir (gorsel.js canliOnizleme): kare ve kayıt
// mekanizması gerçek sayfada sınanır. Sonraki iş buraya başka sınamalar ekleyecek (1-6 başka dosyalarda).
// Çalıştırma: node hayalet-avcilari/test/karakter-ekrani.test.mjs (Playwright + Chromium)
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

// Diskteki görsel listesi: bütün resimlerin yüklenmesi beklenir (3D kareler dahil)
const LISTE = JSON.parse(fs.readFileSync(path.join(WWW, 'gorsel', 'liste.js'), 'utf8').match(/= (\{.*\});/)[1]);

const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const hatalar = [];
const p = await b.newPage({ viewport: { width: 844, height: 390 } });
p.on('pageerror', (e) => hatalar.push(e.message));
await p.addInitScript(() => { localStorage.setItem('hayaletAvcilariDil', 'tr'); localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9'); });
await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
await p.goto(adres, { waitUntil: 'load' });
await p.waitForFunction(() => typeof canliOnizleme === 'function' && typeof uiSimgeHTML === 'function' && typeof startGame === 'function');
await p.waitForFunction((n) => Object.keys(GORSEL).length === n, Object.keys(LISTE).length, { timeout: 10000 });
try {
  // 7) canliOnizleme: açılış karşılıyıcısında tuval var, görseller gelince dolu; DOM'dan çıkınca kaydı silinir
  const karsilayici = await p.evaluate(() => {
    const el = document.getElementById('kinkin-greeter');
    return { tuval: !!el.querySelector('canvas.canli-onizleme'), kayit: canliOnizlemeSayisi() };
  });
  sina('7) açılış karşılıyıcısı canvas.canli-onizleme içerir ve kayıtlıdır', () => {
    assert.equal(karsilayici.tuval, true);
    assert.equal(karsilayici.kayit, 1);
  });
  const doluMu = await p.waitForFunction(() => {
    const cv = document.querySelector('#kinkin-greeter canvas.canli-onizleme');
    if (!cv || !cv.width) return false;
    const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
    let dolu = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 0) dolu++;
    return dolu > 300;
  }, null, { timeout: 5000 }).then(() => true, () => false);
  sina('7) görseller yüklenince karşılıyıcı tuvali boş değil (kareler çizilir)', () => { assert.equal(doluMu, true); });

  await p.evaluate(() => document.getElementById('kinkin-greeter').remove());
  const kayitSifir = await p.waitForFunction(() => canliOnizlemeSayisi() === 0, null, { timeout: 3000 }).then(() => true, () => false);
  sina('7) öge DOM\'dan çıkarılınca kaydı silinir (canliOnizlemeSayisi 0)', () => { assert.equal(kayitSifir, true); });

  // 8) uiSimgeHTML: listede olmayan anahtar emojiyi verir; liste girişi eklenince <img> döner
  const simge = await p.evaluate(() => {
    const o = {};
    o.yok = uiSimgeHTML('ui-test', '🎯', 'Deneme');
    GORSEL_LISTESI['ui-test'] = 1;
    o.var = uiSimgeHTML('ui-test', '🎯', 'Deneme');
    delete GORSEL_LISTESI['ui-test'];
    o.tekrarYok = uiSimgeHTML('ui-test', '🎯', 'Deneme');
    return o;
  });
  sina('8) uiSimgeHTML listede olmayan anahtarda emoji döner', () => {
    assert.equal(simge.yok, '🎯');
    assert.equal(simge.tekrarYok, '🎯');
  });
  sina('8) GORSEL_LISTESI["ui-test"] = 1 sonrası <img class="ui-simge"> döner', () => {
    assert.ok(simge.var.startsWith('<img class="ui-simge" src="gorsel/ui-test.webp"'), simge.var);
    assert.ok(simge.var.includes('alt="Deneme"'), simge.var);
  });

  // Menü kareti: goToMenu sonrası #character-preview canlı tuval içerir
  await p.evaluate(() => goToMenu());
  const menuKareti = await p.waitForFunction(() => {
    const el = document.getElementById('character-preview');
    return !!el && !!el.querySelector('canvas.canli-onizleme') && canliOnizlemeSayisi() === 1;
  }, null, { timeout: 3000 }).then(() => true, () => false);
  sina('goToMenu sonrası menü kareti (#character-preview) canvas.canli-onizleme içerir', () => {
    assert.equal(menuKareti, true);
  });

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
