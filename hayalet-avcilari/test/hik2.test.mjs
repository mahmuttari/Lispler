// Hayalet Avcıları HIK2: hikâye sahnesi yeniden tasarımı (iki avcı, balon, daktilo) — çevrimdışı sınama.
// Çalıştırma: node test/hik2.test.mjs
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
async function sayfaAc(genislik = 390, yukseklik = 844) {
  const p = await b.newPage({ viewport: { width: genislik, height: yukseklik }, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('hayaletAvcilariDil', 'tr'); localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9'); });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof startGame === 'function' && typeof hikayeSahneGoster === 'function' && typeof canliOnizlemeSayisi === 'function');
  return p;
}

try {
  const p = await sayfaAc();

  // --- 1) Anlatıcı satırı: parşömen kutusu, daktilo, iki yuvada canlı önizleme + ayna ---
  const acilis = await p.evaluate(() => {
    save.dunyaTuru = { acik: 1, damgalar: {}, bitti: 0, hatiralar: {}, bilmeceler: {}, sahneler: {}, katilanlar: {}, gezgin: 'kinkin', rozet: 0 };
    save.selectedChar = 'kinkin';
    window.__bit = 0;
    hikayeSahneGoster([
      { k: 'anlatici', m: 'Anlatıcı satırı burada.' },
      { k: 'gezgin', m: 'Gezgin satırı konuşuyor.' },
      { k: 'katilan', m: 'Katılan satırı konuşuyor.' },
      { k: 'gezgin', m: 'Son gezgin satırı.' },
    ], { katilan: 'veryi', bitince: () => { window.__bit++; } });
    const el = document.getElementById('hikaye-sahne');
    const yuvalar = [...el.querySelectorAll('.hikaye-sahne-avci')];
    const son = el.querySelector('.hikaye-sahne-avci.son');
    const metin = el.querySelector('.hikaye-metin');
    const tam = 'Anlatıcı satırı burada.';
    return {
      yuva: yuvalar.length,
      tuval: yuvalar.every((y) => !!y.querySelector('canvas.canli-onizleme')),
      ayna: son ? new DOMMatrix(getComputedStyle(son).transform).a < 0 : false,
      anlatim: !!el.querySelector('.hikaye-anlatim') && !el.querySelector('.hikaye-balon'),
      kisa: (metin.textContent || '').length < tam.length,
      tam,
      dugme: (() => { const r = el.querySelector('.hikaye-ileri').getBoundingClientRect(); return { w: r.width, h: r.height }; })(),
    };
  });
  sina('sahnede iki avcı yuvası var, her birinde canlı önizleme tuvası', () => {
    assert.equal(acilis.yuva, 2); assert.equal(acilis.tuval, true);
  });
  sina('satır sonu (ikinci) yuva aynalanır (scaleX(-1))', () => { assert.equal(acilis.ayna, true); });
  sina('anlatıcı satırı .hikaye-anlatim kullanır, .hikaye-balon yok', () => { assert.equal(acilis.anlatim, true); });
  sina('daktilo: satır başlar başlamaz metin tam satırdan kısa', () => { assert.equal(acilis.kisa, true); });
  sina('▶ dokunma hedefi en az 44 px', () => { assert.ok(acilis.dugme.w >= 44 && acilis.dugme.h >= 44); });

  // --- 2) Daktilo: bir dokunuş tamamlar (ilerlemez), sonraki ilerletir; balon kuyruğu sol/sağ ---
  const daktilo = await p.evaluate(() => {
    const el = document.getElementById('hikaye-sahne');
    const tam = 'Anlatıcı satırı burada.';
    hikayeSahneIleri(); // yazıyı tamamla
    const sonra = { metin: el.querySelector('.hikaye-metin').textContent, anlatim: !!el.querySelector('.hikaye-anlatim') };
    hikayeSahneIleri(); // sonraki satır (gezgin)
    const gezginBalon = el.querySelector('.hikaye-balon');
    const gezginSinif = gezginBalon ? gezginBalon.className : '';
    hikayeSahneIleri(); // gezgin yazısını tamamla
    hikayeSahneIleri(); // katılan satırı
    const katilanBalon = el.querySelector('.hikaye-balon');
    const katilanSinif = katilanBalon ? katilanBalon.className : '';
    const sonYuva = el.querySelector('.hikaye-sahne-avci.son');
    return { sonra, gezginSinif, katilanSinif, ayniKaldi: sonra.metin === tam, sonrakiAyni: sonra.anlatim, katilanAvci: sonYuva && sonYuva.getAttribute('data-avci') };
  });
  sina('ilk dokunuş satırı tamamlar ve ilerletmez', () => { assert.equal(daktilo.ayniKaldi, true); assert.equal(daktilo.sonrakiAyni, true); });
  sina('gezgin satırında balon .sol, katılan satırında .sag', () => {
    assert.match(daktilo.gezginSinif, /\bsol\b/); assert.match(daktilo.katilanSinif, /\bsag\b/);
  });
  sina('katılan satırında satır sonu yuvası konuşana geçer', () => { assert.equal(daktilo.katilanAvci, 'veryi'); });

  // --- 3) Son satırdan sonra kapanır, bitince bir kez; açılışlar önizleme kaydı biriktirmez ---
  const kapanis = await p.evaluate(() => {
    const el = document.getElementById('hikaye-sahne');
    let n = 0;
    while (el.classList.contains('active') && n++ < 20) hikayeSahneIleri();
    const bit = window.__bit;
    const sayilar = [];
    for (let i = 0; i < 3; i++) {
      hikayeSahneGoster([{ k: 'anlatici', m: 'kısa ' + i }], { katilan: 'veryi' });
      let m = 0;
      while (el.classList.contains('active') && m++ < 10) hikayeSahneIleri();
      sayilar.push(canliOnizlemeSayisi());
    }
    return { aktif: el.classList.contains('active'), bit, sayilar };
  });
  sina('son satırdan sonra sahne kapanır ve bitince bir kez çağrılır', () => { assert.equal(kapanis.aktif, false); assert.equal(kapanis.bit, 1); });
  sina('üç sahne açılışında canlı önizleme kaydı büyümez', () => {
    assert.equal(kapanis.sayilar[1], kapanis.sayilar[0], JSON.stringify(kapanis.sayilar)); assert.equal(kapanis.sayilar[2], kapanis.sayilar[0]);
  });

  // --- 4) Katılan/arkadaş yoksa tek dolu yuva ---
  const tek = await p.evaluate(() => {
    const el = document.getElementById('hikaye-sahne');
    save.dunyaTuru.katilanlar = {};
    hikayeSahneGoster([{ k: 'gezgin', m: 'Yalnız gezgin.' }], {});
    const yuvalar = [...el.querySelectorAll('.hikaye-sahne-avci')];
    const r = { adet: yuvalar.length, dolu: yuvalar.filter((y) => !!y.querySelector('canvas.canli-onizleme')).length };
    hikayeSahneKapat();
    return r;
  });
  sina('katılan/arkadaş yoksa tek dolu avcı yuvası', () => { assert.equal(tek.adet, 1); assert.equal(tek.dolu, 1); });

  // --- 5) Arapça (RTL) 340 px: yatay taşma yok ---
  await p.setViewportSize({ width: 340, height: 844 });
  const rtl = await p.evaluate(() => {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
    const el = document.getElementById('hikaye-sahne');
    hikayeSahneGoster([{ k: 'gezgin', m: 'مرحبا بالعالم، هذه جملة طويلة لاختبار العرض.' }, { k: 'katilan', m: 'اختبار.' }], { katilan: 'veryi' });
    const alan = el.querySelector('.hikaye-sahne-alan');
    const r = {
      kok: document.documentElement.scrollWidth <= window.innerWidth + 1,
      alan: alan ? alan.scrollWidth <= alan.clientWidth + 1 : true,
      sahne: el.scrollWidth <= el.clientWidth + 1,
    };
    // Birbirine bakma: ekranda sağda kalan yuva aynalanır (RTL'de bas yuvası sağdadır)
    const yuvalar = [...el.querySelectorAll('.hikaye-sahne-avci')].map((y) => ({
      x: y.getBoundingClientRect().left, ayna: new DOMMatrix(getComputedStyle(y).transform).a < 0 }));
    yuvalar.sort((a, b2) => a.x - b2.x);
    r.bakisma = yuvalar.length === 2 && !yuvalar[0].ayna && yuvalar[1].ayna;
    hikayeSahneKapat();
    document.documentElement.dir = 'ltr';
    return r;
  });
  sina('Arapça RTL 340 px genişlikte yatay taşma yok', () => {
    assert.equal(rtl.kok, true); assert.equal(rtl.alan, true); assert.equal(rtl.sahne, true);
  });
  sina('Arapça RTL: ekranda sağdaki avcı aynalanır, iki avcı birbirine bakar', () => { assert.equal(rtl.bakisma, true); });
  await p.setViewportSize({ width: 390, height: 844 });

  await p.close();

  // --- 6) Az hareket: metin hemen tam ---
  const pr = await sayfaAc(390);
  await pr.emulateMedia({ reducedMotion: 'reduce' });
  const azHareket = await pr.evaluate(() => {
    save.dunyaTuru = { acik: 1, damgalar: {}, bitti: 0, hatiralar: {}, bilmeceler: {}, sahneler: {}, katilanlar: {}, gezgin: 'kinkin', rozet: 0 };
    save.selectedChar = 'kinkin';
    hikayeSahneGoster([{ k: 'anlatici', m: 'Tam metin hemen görünmeli.' }], { katilan: 'veryi' });
    const t = document.querySelector('#hikaye-sahne .hikaye-metin').textContent;
    hikayeSahneKapat();
    return t;
  });
  sina('prefers-reduced-motion: metin baştan tam', () => { assert.equal(azHareket, 'Tam metin hemen görünmeli.'); });
  await pr.close();

  sina('sayfa hatası yok', () => { assert.deepEqual(hatalar, []); });
} catch (e) {
  sonuclar.push(`✗ beklenmedik hata: ${e.message}`);
} finally {
  await b.close();
  sunucu.close();
}

console.log(sonuclar.join('\n'));
const kotu = sonuclar.filter((s) => s.startsWith('✗'));
console.log(kotu.length ? `\n${kotu.length} sınama başarısız.` : `\nTüm sınamalar geçti (${sonuclar.length}).`);
process.exit(kotu.length ? 1 : 0);
