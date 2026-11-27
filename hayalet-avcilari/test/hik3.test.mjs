// Hayalet Avcıları HIK3: hikâye resimleri (açılış H11, bölüm B01–B10, final H12, Dostluk Haritası H10) ve animasyonları
// (A01 el sallayan hayalet, A02 fener, A03 hatıra pırıltısı) — çevrimdışı sınama.
// Çalıştırma: node test/hik3.test.mjs
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
async function sayfaAc(genislik = 390, yukseklik = 740, dil = 'tr') {
  const p = await b.newPage({ viewport: { width: genislik, height: yukseklik }, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript((DIL) => { localStorage.setItem('hayaletAvcilariDil', DIL); localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9'); }, dil);
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof startGame === 'function' && typeof hikayeSahneGoster === 'function' && typeof hikayeDefterCiz === 'function');
  // bütün hikâye resimleri ve animasyon kareleri yüklensin (10 bölüm + açılış + final + harita + 18 kare)
  await p.waitForFunction(() => Object.keys(GORSEL).filter((k) => /hikaye/.test(k)).length >= 31, null, { timeout: 15000 });
  return p;
}

const KAYIT = "save.dunyaTuru = { acik: 1, damgalar: {}, bitti: 0, hatiralar: {}, bilmeceler: {}, sahneler: {}, katilanlar: {}, gezgin: 'kinkin', rozet: 0 }; save.selectedChar = 'kinkin';";

try {
  const liste = JSON.parse(fs.readFileSync(path.join(WWW, 'gorsel', 'liste.js'), 'utf8').match(/= (\{.*\});/)[1]);
  sina('liste.js: H10-H12, B01-B10 ve A01-A03 anahtarları var, resimler 1024 px genişlikte', () => {
    for (const k of ['hikaye-harita', 'hikaye-acilis', 'hikaye-final', ...Array.from({ length: 10 }, (_, i) => `hikaye-bolum-${i + 1}`)]) { assert.ok(liste[k], k); assert.equal(liste[k][0], 1024); }
    for (const ad of ['hikaye-hayalet', 'hikaye-fener', 'hikaye-parilti']) for (let i = 1; i <= 6; i++) assert.ok(liste[`an-${ad}-${i}`], `${ad}-${i}`);
  });

  for (const [dil, gen] of [['tr', 390], ['ar', 340]]) {
    const p = await sayfaAc(gen, 740, dil);
    const r = await p.evaluate((KAYIT) => {
      eval(KAYIT);
      const o = {};
      const k1 = ulkeSirada(1).kod, k2 = ulkeSirada(2).kod;
      const kutu = () => document.querySelector('#hikaye-sahne .hikaye-resim');
      const imSrc = () => { const k = kutu(); return k ? k.querySelector('img').getAttribute('src') : ''; };
      const tasar = () => { const k = document.querySelector('#hikaye-sahne .hikaye-kutu'); return k.scrollWidth > k.clientWidth; };
      // açılış: turun 1. ülkesinin sahnesi H11; 2. ülkenin sahnesinde resim yok
      hikayeSahneGoster([{ k: 'anlatici', m: 'Açılış.' }], hikayeUlkeSahneSecenegi(k1)); o.acilis = imSrc(); o.acilisTasma = tasar();
      hikayeSahneKapat();
      hikayeSahneGoster([{ k: 'anlatici', m: 'İkinci ülke.' }], hikayeUlkeSahneSecenegi(k2)); o.ikinci = imSrc(); hikayeSahneKapat();
      // bölüm resimleri B01-B10 sırayla
      o.bolumler = [];
      for (let n = 1; n <= 10; n++) { hikayeBolumOku(n); o.bolumler.push(imSrc()); hikayeSahneKapat(); }
      // bilmece çözülünce bölüm sahnesi doğru resimle açılır
      hikayeKayit().bilmeceler = {};
      hikayeBilmeceAc(1); hikayeBilmeceSec(HIKAYE_BILMECE[0].dogru); o.bilmeceBolum = imSrc(); hikayeSahneKapat();
      // final: H12 + el sallayan hayalet (A01)
      hikayeFinalGoster(() => {}); o.final = imSrc();
      const sus = document.querySelector('#hikaye-sahne .hikaye-resim-sus');
      o.sus = !!sus; o.susAd = sus ? sus.getAttribute('data-anim') : ''; o.susSrc1 = sus ? sus.getAttribute('src') : '';
      o.finalTasma = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      o.finalKutuTasma = tasar();
      o.susKonum = sus ? (() => { const a = sus.getBoundingClientRect(), c = kutu().getBoundingClientRect(); return a.left >= c.left - 1 && a.right <= c.right + 1 && a.top >= c.top - 1 && a.bottom <= c.bottom + 1; })() : false;
      return o;
    }, KAYIT);
    sina(`${dil} ${gen}px: açılış sahnesi H11 resmini gösterir, 2. ülkede resim yok, taşma yok`, () => { assert.match(r.acilis, /hikaye-acilis\.webp$/); assert.equal(r.ikinci, ''); assert.equal(r.acilisTasma, false); });
    sina(`${dil} ${gen}px: bölüm sahneleri B01-B10 sırayla; bilmece çözümü 1. bölüm resmini açar`, () => { r.bolumler.forEach((s, i) => assert.match(s, new RegExp(`hikaye-bolum-${i + 1}\\.webp$`))); assert.match(r.bilmeceBolum, /hikaye-bolum-1\.webp$/); });
    sina(`${dil} ${gen}px: final H12 + el sallayan hayalet resmin içinde, yatay taşma yok`, () => { assert.match(r.final, /hikaye-final\.webp$/); assert.equal(r.sus, true); assert.equal(r.susAd, 'hikaye-hayalet'); assert.equal(r.susKonum, true); assert.equal(r.finalTasma, 0); assert.equal(r.finalKutuTasma, false); });
    await p.waitForTimeout(450);
    const susSonra = await p.evaluate(() => { const s = document.querySelector('#hikaye-sahne .hikaye-resim-sus'); return s ? s.getAttribute('src') : ''; });
    sina(`${dil}: hayalet kareleri oynar (kare değişti)`, () => { assert.notEqual(susSonra, r.susSrc1); assert.match(susSonra, /an-hikaye-hayalet-\d\.webp$/); });
    if (dil === 'ar') {
      const yon = await p.evaluate(() => { const s = document.querySelector('#hikaye-sahne .hikaye-resim-sus'), k = document.querySelector('#hikaye-sahne .hikaye-resim'); const a = s.getBoundingClientRect(), c = k.getBoundingClientRect(); return { dir: getComputedStyle(document.documentElement).direction, solda: a.left - c.left < c.right - a.right }; });
      sina('ar RTL: hayalet satır sonunda (solda)', () => { assert.equal(yon.dir, 'rtl'); assert.equal(yon.solda, true); });
    }
    await p.evaluate(() => hikayeSahneKapat());

    // Defter: harita parçaları + fener
    const d = await p.evaluate((KAYIT) => {
      eval(KAYIT);
      const k = hikayeKayit(); k.bilmeceler = { 1: 1, 2: 1, 3: 1, 4: 1 };
      document.getElementById('tur-defter').style.display = 'block';
      hikayeDefterCiz();
      const el = document.getElementById('tur-defter');
      const h = el.querySelector('.defter-harita');
      const o = { harita: !!h, parca: el.querySelectorAll('.harita-parca').length, acik: el.querySelectorAll('.harita-parca.acik').length, src: h ? h.querySelector('img').getAttribute('src') : '', fener: el.querySelector('.defter-fener-resim') ? el.querySelector('.defter-fener-resim').getAttribute('src') : '', tasma: document.documentElement.scrollWidth - document.documentElement.clientWidth };
      { const kk = hikayeKayit(); for (let n = 1; n <= 10; n++) kk.bilmeceler[n] = 1; }
      hikayeDefterCiz();
      const f = document.querySelector('#tur-defter .defter-fener-resim');
      o.tamFener1 = f ? f.getAttribute('src') : '';
      return o;
    }, KAYIT);
    sina(`${dil} ${gen}px: defter Dostluk Haritası H10, 10 parçadan 4'ü açık, fener kıvılcım karesinde, yatay taşma yok`, () => { assert.equal(d.harita, true); assert.match(d.src, /hikaye-harita\.webp$/); assert.equal(d.parca, 10); assert.equal(d.acik, 4); assert.match(d.fener, /an-hikaye-fener-[23]\.webp$/); assert.equal(d.tasma, 0); });
    await p.waitForTimeout(450);
    const tam = await p.evaluate(() => document.querySelector('#tur-defter .defter-fener-resim').getAttribute('src'));
    sina(`${dil}: 10 bilmece çözülünce fener yanar (4-6. kareler döner)`, () => { assert.match(d.tamFener1, /an-hikaye-fener-4\.webp$/); assert.match(tam, /an-hikaye-fener-[56]\.webp$/); });

    // A03: hatıra toplanınca pırıltı efekti
    const a3 = await p.evaluate(() => { game.hatira = { kod: 'TR', x: 100, y: 100, simge: '🎁', ad: 'x' }; hikayeHatiraTopla(); const son = animEfektleri[animEfektleri.length - 1]; return { ad: son && son.ad, tur: son && son.tur, hazir: animHazir('hikaye-parilti') }; });
    sina(`${dil}: hatıra toplanınca A03 pırıltısı (6 kare) efekte eklenir`, () => { assert.equal(a3.hazir, 6); assert.equal(a3.tur, 'kare'); assert.equal(a3.ad, 'hikaye-parilti'); });

    // yedek: resim yoksa sahne, defter ve efekt eski hâliyle çalışır
    const y = await p.evaluate((KAYIT) => {
      eval(KAYIT);
      for (const k of ['hikaye-bolum-2', 'hikaye-final', 'hikaye-harita']) delete GORSEL[k];
      for (let i = 1; i <= 6; i++) { delete GORSEL[`an-hikaye-hayalet-${i}`]; delete GORSEL[`an-hikaye-parilti-${i}`]; delete GORSEL[`an-hikaye-fener-${i}`]; }
      const o = {};
      hikayeBolumOku(2); o.bolum = !!document.querySelector('#hikaye-sahne .hikaye-resim'); o.metin = !!document.querySelector('#hikaye-sahne .hikaye-anlatim'); hikayeSahneKapat();
      hikayeFinalGoster(() => {}); o.final = !!document.querySelector('#hikaye-sahne .hikaye-resim'); o.sus = !!document.querySelector('.hikaye-resim-sus'); hikayeSahneKapat();
      hikayeDefterCiz(); o.harita = !!document.querySelector('#tur-defter .defter-harita'); o.defterVar = document.querySelectorAll('#tur-defter .defter-bolum').length > 0;
      game.hatira = { kod: 'TR', x: 100, y: 100, simge: '🎁', ad: 'x' }; hikayeHatiraTopla(); o.efekt = animEfektleri[animEfektleri.length - 1].tur;
      return o;
    }, KAYIT);
    sina(`${dil}: resimler yoksa sahne, defter ve hatıra efekti eski hâliyle çalışır`, () => { assert.equal(y.bolum, false); assert.equal(y.metin, true); assert.equal(y.final, false); assert.equal(y.sus, false); assert.equal(y.harita, false); assert.equal(y.defterVar, true); assert.equal(y.efekt, 'topla'); });
    await p.close();
  }

  // azaltılmış hareket: hayalet ve fener kareleri oynamaz
  const pr = await sayfaAc(390, 740, 'tr');
  await pr.emulateMedia({ reducedMotion: 'reduce' });
  const az = await pr.evaluate(async (KAYIT) => {
    eval(KAYIT);
    hikayeFinalGoster(() => {});
    const s = document.querySelector('#hikaye-sahne .hikaye-resim-sus'); const a = s.getAttribute('src');
    const k = hikayeKayit(); for (let n = 1; n <= 10; n++) k.bilmeceler[n] = 1;
    hikayeSahneKapat(); hikayeDefterCiz();
    const f = document.querySelector('#tur-defter .defter-fener-resim'); const f1 = f.getAttribute('src');
    await new Promise((r) => setTimeout(r, 500));
    return { sus: [a, s.getAttribute('src')], fener: [f1, f.getAttribute('src')] };
  }, KAYIT);
  sina('prefers-reduced-motion: hayalet ve fener kareleri sabit (fener yanık karede)', () => { assert.equal(az.sus[0], az.sus[1]); assert.equal(az.fener[0], az.fener[1]); assert.match(az.fener[0], /an-hikaye-fener-6\.webp$/); });
  await pr.close();

  sina('sayfa hatası yok', () => { assert.deepEqual(hatalar, []); });
} catch (e) {
  sonuclar.push(`✗ beklenmedik hata: ${e.stack || e.message}`);
} finally {
  await b.close();
  sunucu.close();
}

console.log(sonuclar.join('\n'));
const kotu = sonuclar.filter((s) => s.startsWith('✗'));
console.log(kotu.length ? `\n${kotu.length} sınama başarısız.` : `\nTüm sınamalar geçti (${sonuclar.length}).`);
process.exit(kotu.length ? 1 : 0);
