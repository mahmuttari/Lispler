// Hayalet Avcıları: Dünya Turu (3.14.0) — kayıt, kip kancaları, akış ve istemci damgası (çevrimdışı).
// Kayıt: save.dunyaTuru {acik, damgalar, bitti}; eski ya da yeni sürümün yedeği temizlenerek açılır (bilinmeyen kod
// atılır, acik 1–51); damgaBas ilk damgada +3 💎 verir ve acik = max(acik, sıra + 1).
// Tasarım: docs/superpowers/specs/2026-10-24-hayalet-ulkeler-design.md §3, §6, §9.
// Çalıştırma: node hayalet-avcilari/test/dunya-turu.test.mjs   (Playwright + Chromium; ağ ve Firebase gerekmez)
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
async function sayfaAc(dil = 'tr') {
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript((dil) => { localStorage.setItem('hayaletAvcilariDil', dil); localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9'); }, dil);
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForTimeout(300);
  return p;
}
const kopya = (p, fn, arg) => p.evaluate(fn, arg);

try {
  const p = await sayfaAc();

  // --- 1) Kayıt ---
  const taze = await kopya(p, () => JSON.parse(JSON.stringify(save.dunyaTuru)));
  sina('taze kayıtta varsayılan Dünya Turu kaydı', () => { assert.deepEqual(taze, { acik: 1, damgalar: {}, bitti: 0 }); });
  const temiz = await kopya(p, () => [turKaydiniTemizle({ acik: 99, damgalar: { FR: 5, XX: 5, DE: 'x' }, bitti: 'a' }), turKaydiniTemizle(undefined)]);
  sina('kayıt temizleme: acik 1–51, bilinmeyen kod ve bozuk damga atılır', () => {
    assert.deepEqual(temiz[0], { acik: 51, damgalar: { FR: 5 }, bitti: 0 });
    assert.deepEqual(temiz[1], { acik: 1, damgalar: {}, bitti: 0 });
  });
  // Eski sürümün yedeği (dunyaTuru yok) ve yeni sürümün yedeği (bilinmeyen ülke kodu) sayfa yeniden yüklenince
  const eski = await (async () => {
    await p.evaluate(() => localStorage.setItem(SAVE_KEY, JSON.stringify({ playerName: 'Eski', para: 5 })));
    await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(300);
    return kopya(p, () => ({ tur: save.dunyaTuru, para: save.para }));
  })();
  const yeni = await (async () => {
    await p.evaluate(() => localStorage.setItem(SAVE_KEY, JSON.stringify({ playerName: 'Yeni', dunyaTuru: { acik: 3, damgalar: { TR: 1, ZZ: 2 }, bitti: 0 } })));
    await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(300);
    return kopya(p, () => save.dunyaTuru);
  })();
  sina('eski yedek: Dünya Turu varsayılanı, öteki alanlar korunur', () => { assert.deepEqual(eski.tur, { acik: 1, damgalar: {}, bitti: 0 }); assert.equal(eski.para, 5); });
  sina('yeni sürümün yedeği: bilinmeyen kod atılır', () => { assert.deepEqual(yeni, { acik: 3, damgalar: { TR: 1 }, bitti: 0 }); });

  const d = await kopya(p, () => {
    save.dunyaTuru = { acik: 1, damgalar: {}, bitti: 0 }; save.elmas = 10;
    const a = damgaBas('FR'); const e1 = save.elmas; const k1 = JSON.parse(JSON.stringify(save.dunyaTuru));
    const ikinci = damgaBas('FR'); const e2 = save.elmas;
    const ar = damgaBas('AR'); const acik = save.dunyaTuru.acik;
    const once = JSON.stringify(save.dunyaTuru);
    const xx = damgaBas('XX');
    const kayitli = JSON.parse(localStorage.getItem(SAVE_KEY)).dunyaTuru;
    return { a, e1, k1, ikinci, e2, ar, acik, xx, ayni: once === JSON.stringify(save.dunyaTuru), kayitli };
  });
  sina('ilk damga +3 💎, acik = sıra + 1', () => {
    assert.deepEqual(d.a, { yeni: true }); assert.equal(d.e1, 13);
    assert.equal(typeof d.k1.damgalar.FR, 'number'); assert.equal(d.k1.acik, 7);
  });
  sina('aynı ülkenin ikinci damgası ödül vermez', () => { assert.deepEqual(d.ikinci, { yeni: false }); assert.equal(d.e2, 13); });
  sina('51. ülkede acik 51\'de kalır', () => { assert.deepEqual(d.ar, { yeni: true }); assert.equal(d.acik, 51); });
  sina('bilinmeyen kod kaydı değiştirmez', () => { assert.deepEqual(d.xx, { yeni: false }); assert.ok(d.ayni); });
  sina('damga kalıcı (localStorage)', () => { assert.ok(d.kayitli && d.kayitli.damgalar.FR && d.kayitli.damgalar.AR); });

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
