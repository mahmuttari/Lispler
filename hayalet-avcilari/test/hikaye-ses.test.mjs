// Hayalet Avcıları: hikâye ve yolculuk ses efektleri — çevrimdışı sınama.
// www/sfx/hikaye/ altındaki 11 kısa ses dosyası, hikayeSes, çağrı noktaları ve kapalı ses yolu sınanır.
// Çalıştırma: node test/hikaye-ses.test.mjs
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
const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--autoplay-policy=no-user-gesture-required'] });
const hatalar = [];
try {
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript(() => {
    localStorage.setItem('hayaletAvcilariDil', 'tr');
    localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9');
    localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1');
  });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof HIKAYE_SESLERI !== 'undefined' && typeof hikayeHatiraTopla === 'function' && typeof yolculukKopruAc === 'function');

  // a) Liste 11 ad, her ad için dosya var
  const adlar = await p.evaluate(() => HIKAYE_SESLERI.slice());
  sina('HIKAYE_SESLERI 11 ad içerir', () => { assert.equal(adlar.length, 11); });
  sina('her hikâye sesi için www/sfx/hikaye/<ad>.m4a var', () => {
    for (const ad of adlar) {
      const f = path.join(WWW, 'sfx', 'hikaye', ad + '.m4a');
      assert.ok(fs.existsSync(f), f);
    }
  });

  // b) init sonrası örnekler çözülür (AAC çözülemezse yumuşak atla)
  await p.evaluate(() => audio.init());
  let cozulen = 0;
  try {
    await p.waitForFunction((liste) => liste.every((ad) => !!audio.samples['h:' + ad]), adlar, { timeout: 5000 });
    cozulen = adlar.length;
  } catch (e) {
    cozulen = await p.evaluate((liste) => liste.filter((ad) => !!audio.samples['h:' + ad]).length, adlar);
  }
  if (cozulen === adlar.length) sonuclar.push(`✓ 11 hikâye sesi çözüldü`);
  else sonuclar.push(`- (yumuşak) ${cozulen}/11 hikâye sesi çözüldü (başsız Chromium AAC çözemiyor olabilir)`);

  // c) casus: çağrı noktaları doğru anahtarları ister
  const cagrilar = await p.evaluate(() => {
    startGame(); game.paused = false; online.mode = null;
    save.dunyaTuru = { acik: 1, damgalar: {}, bitti: 0 };
    save.selectedChar = 'kinkin';
    const asil = audio.playSample;
    const kayit = [];
    audio.playSample = (key, vol) => { kayit.push(key); return true; };

    // hatıra
    game.hatira = { x: 100, y: 100, kod: 'TR', ad: 'Test Hatıra' };
    hikayeHatiraTopla();

    // bilmece: doğru ve yanlış
    window.HIKAYE_TEST = {
      avciSirasi: HIKAYE_AVCI_SIRASI, katilisUlke: [3, 7], katilis: {},
      ulke: { TR: { hatira: { ad: 'H', simge: '🎁', not: 'n' }, sahne: [{ k: 'anlatici', m: 's' }] } },
      bilmece: [{ soru: 'Soru', secenek: ['A', 'B', 'C'], dogru: 0, bolum: [] }],
      final: [],
    };
    const k = hikayeKayit();
    k.bilmeceler = {}; k.rozet = 0; k.hatiralar = {}; k.sahneler = {};
    hikayeBilmeceAc(1);
    hikayeBilmeceSec(0);
    hikayeBilmeceAc(1);
    hikayeBilmeceSec(1, document.querySelector('#hikaye-bilmece .hikaye-secenek[data-i="1"]'));

    // yolculuk köprüsü
    game.kopruAcik = [false, false, false, false, false, false];
    game._yolculukDuzen = game._yolculukDuzen || { zones: [] };
    yolculukKopruAc(0);

    audio.playSample = asil;
    return kayit;
  });
  sina('hatıra → h:hatira', () => { assert.ok(cagrilar.includes('h:hatira'), cagrilar.join(',')); });
  sina('doğru cevap → h:dogru', () => { assert.ok(cagrilar.includes('h:dogru'), cagrilar.join(',')); });
  sina('yanlış cevap → h:yanlis', () => { assert.ok(cagrilar.includes('h:yanlis'), cagrilar.join(',')); });
  sina('köprü açılışı → h:kopru-ac', () => { assert.ok(cagrilar.includes('h:kopru-ac'), cagrilar.join(',')); });

  // d) ses kapalıyken hikayeSes false döner ve eski yol hatasız çalışır
  const kapali = await p.evaluate(() => {
    audio.enabled = false;
    const r = audio.hikayeSes('hatira');
    game.hatira = { x: 120, y: 120, kod: 'TR', ad: 'Kapalı' };
    let hata = null;
    try { hikayeHatiraTopla(); } catch (e) { hata = String(e && e.message || e); }
    audio.enabled = true;
    return { r, hata, hatira: game.hatira };
  });
  sina('ses kapalıyken hikayeSes false döner, eski yol hatasız', () => {
    assert.equal(kapali.r, false);
    assert.equal(kapali.hata, null);
    assert.equal(kapali.hatira, null);
  });

  // e) sayfa hatası yok
  sina('sayfa hatası yok', () => { assert.deepEqual(hatalar, []); });
} finally {
  await b.close(); sunucu.close();
}
console.log(sonuclar.join('\n'));
const kotu = sonuclar.filter((s) => s.startsWith('✗'));
console.log(`\n${sonuclar.length - kotu.length}/${sonuclar.length} geçti`);
if (kotu.length) process.exit(1);
