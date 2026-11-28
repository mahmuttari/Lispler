// Hayalet Avcıları AKI2: canlı arayüz (ekran geçişi, liste girişi, sayaç, konfeti, pırıltı).
// Çalıştırma: node test/aki2.test.mjs
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
const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const CIHAZ = /gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/;

async function sayfa(ayar = {}) {
  const p = await b.newPage({ viewport: ayar.viewport || { width: 390, height: 780 }, reducedMotion: ayar.reducedMotion });
  const hatalar = [];
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript((d) => {
    localStorage.setItem('hayaletAvcilariDil', d);
    localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9');
    localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1');
  }, ayar.dil || 'tr');
  await p.route(CIHAZ, (r) => r.abort());
  if (ayar.resimYok) await p.route(/\/gorsel\/menu-(sayac|konfeti|parilti)\.webp/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof showScreen === 'function' && typeof refreshMenu === 'function');
  return { p, hatalar };
}

try {
  // 1) Ekran geçişi: .active eşzamanlı, giriş sınıfı eklenir
  {
    const { p, hatalar } = await sayfa();
    const r = await p.evaluate(() => {
      showScreen('screen-menu');
      const y = document.getElementById('screen-menu');
      const e = document.getElementById('screen-welcome');
      return { aktif: y.classList.contains('active'), giris: y.classList.contains('screen-giris'), eskiAktif: e.classList.contains('active'), eskiCikis: e.classList.contains('screen-cikis') };
    });
    sina('showScreen: .active hemen, yeni ekranda giriş sınıfı, eskide çıkış sınıfı', () => {
      assert.equal(r.aktif, true); assert.equal(r.giris, true); assert.equal(r.eskiAktif, false); assert.equal(r.eskiCikis, true);
    });
    await p.waitForTimeout(260);
    const sonra = await p.evaluate(() => document.getElementById('screen-menu').classList.contains('screen-giris'));
    sina('ekran giriş sınıfı kısa süre sonra kaldırılır', () => assert.equal(sonra, false));
    sina('ekran geçişi sayfa hatası üretmez', () => assert.deepEqual(hatalar, []));
    await p.close();
  }

  // 2) Liste girişi: 35 ms arayla, 12. ögede sınırlanır (Dünya Turu defteri 51 yuva)
  {
    const { p, hatalar } = await sayfa();
    const r = await p.evaluate(() => {
      showScreen('screen-dunya-turu');
      turSekmesi('defter');
      const yuvalar = [...document.querySelectorAll('#tur-defter .defter-yuva')];
      return {
        sayi: yuvalar.length,
        gecikmeler: yuvalar.slice(0, 14).map((e) => e.style.animationDelay),
        sinif: yuvalar[0] && yuvalar[0].classList.contains('aki-giris'),
      };
    });
    sina('defter yuvaları sıralı gecikme alır, 12. ögede sınırlanır', () => {
      assert.ok(r.sayi > 12, String(r.sayi));
      assert.equal(r.sinif, true);
      assert.deepEqual(r.gecikmeler.slice(0, 3), ['0ms', '35ms', '70ms']);
      assert.deepEqual(r.gecikmeler.slice(11, 14), ['385ms', '385ms', '385ms']);
    });
    sina('liste girişi sayfa hatası üretmez', () => assert.deepEqual(hatalar, []));
    await p.close();
  }

  // 3) Sayaçlar: arada değer görünür, sonra hedefe ulaşır; artışta pop sınıfı
  {
    const { p, hatalar } = await sayfa();
    await p.evaluate(() => {
      showScreen('screen-menu');
      save.para = 0; refreshMenu();
      document.getElementById('menu-para').textContent = '0';
      save.para = 100;
      refreshMenu();
    });
    const ilk = await p.evaluate(() => document.getElementById('menu-para').textContent);
    await p.waitForTimeout(120);
    const ara = await p.evaluate(() => Number(document.getElementById('menu-para').textContent));
    await p.waitForTimeout(400);
    const son = await p.evaluate(() => ({ deger: Number(document.getElementById('menu-para').textContent), pop: document.getElementById('menu-para').classList.contains('aki-sayi-pop') }));
    sina('sayaç anında atlamaz, arada değer görünür ve sonunda hedefe ulaşır', () => {
      assert.ok(ara > 0 && ara < 100, String(ara));
      assert.equal(son.deger, 100);
    });
    sina('sayaç artışında pop sınıfı eklenir', () => assert.equal(son.pop, true));
    sina('sayaç sayfa hatası üretmez', () => assert.deepEqual(hatalar, []));
    await p.close();
  }

  // 4) R49 görselleri: yüklenince gorsel(k).src uygulanır
  {
    const { p, hatalar } = await sayfa();
    await p.waitForFunction(() => gorsel('menu-sayac') && gorsel('menu-konfeti') && gorsel('menu-parilti'));
    const r = await p.evaluate(() => {
      showScreen('screen-menu');
      refreshMenu();
      const sayac = document.querySelector('#screen-menu .resources');
      konfetiPatlat();
      const konfeti = document.querySelector('.aki-konfeti img');
      const kap = document.createElement('div'); akiPariltiEkle(kap);
      const parilti = kap.querySelector('.aki-parilti');
      openCharacters();
      return {
        sayacVar: sayac.classList.contains('aki-sayac-cerceve'),
        sayacSrc: sayac.style.backgroundImage,
        kaynak: gorsel('menu-sayac').src,
        konfetiSrc: konfeti ? konfeti.src : '',
        pariltiSrc: parilti ? parilti.style.backgroundImage : '',
        seciliPirilti: !!document.querySelector('.char-card.selected .aki-parilti'),
      };
    });
    sina('menu-sayac çerçevesi gorsel("menu-sayac").src ile uygulanır', () => {
      assert.equal(r.sayacVar, true);
      assert.ok(r.sayacSrc.includes(r.kaynak), r.sayacSrc);
    });
    sina('menu-konfeti gorsel("menu-konfeti").src ile patlar', () => assert.ok(r.konfetiSrc.includes('menu-konfeti.webp'), r.konfetiSrc));
    sina('menu-parilti gorsel("menu-parilti").src ile eklenir (seçili kartta da)', () => {
      assert.ok(r.pariltiSrc.includes('menu-parilti.webp'), r.pariltiSrc);
      assert.equal(r.seciliPirilti, true);
    });
    sina('R49 sayfa hatası üretmez', () => assert.deepEqual(hatalar, []));
    await p.close();
  }

  // 5) R49 görselleri yoksa: bugünkü görünüm, konfeti/pırıltı yok, hata yok
  {
    const { p, hatalar } = await sayfa({ resimYok: true });
    await p.waitForTimeout(400);
    const r = await p.evaluate(() => {
      showScreen('screen-menu');
      refreshMenu();
      konfetiPatlat();
      const kap = document.createElement('div'); akiPariltiEkle(kap);
      return {
        sayacVar: document.querySelector('#screen-menu .resources').classList.contains('aki-sayac-cerceve'),
        arka: document.querySelector('#screen-menu .resources').style.backgroundImage,
        konfeti: !!document.querySelector('.aki-konfeti'),
        parilti: !!kap.querySelector('.aki-parilti'),
      };
    });
    sina('R49 görselleri yokken sade görünüme düşer, hata vermez', () => {
      assert.equal(r.sayacVar, false); assert.equal(r.arka, ''); assert.equal(r.konfeti, false); assert.equal(r.parilti, false);
      assert.deepEqual(hatalar, []);
    });
    await p.close();
  }

  // 6) Az hareket: geçişler ve sayaç anında, liste/konfeti/pırıltı yok
  {
    const { p, hatalar } = await sayfa({ reducedMotion: 'reduce' });
    const r = await p.evaluate(() => {
      showScreen('screen-menu');
      const giris = document.getElementById('screen-menu').classList.contains('screen-giris');
      document.getElementById('menu-para').textContent = '0';
      save.para = 100; refreshMenu();
      const aninda = document.getElementById('menu-para').textContent;
      showScreen('screen-dunya-turu'); turSekmesi('defter');
      const gecikmeli = [...document.querySelectorAll('#tur-defter .defter-yuva')].some((e) => e.classList.contains('aki-giris'));
      konfetiPatlat();
      return { giris, aninda, gecikmeli, konfeti: !!document.querySelector('.aki-konfeti') };
    });
    sina('az hareket: ekran/lists/sayaç anında, konfeti yok', () => {
      assert.equal(r.giris, false); assert.equal(r.aninda, '100'); assert.equal(r.gecikmeli, false); assert.equal(r.konfeti, false);
      assert.deepEqual(hatalar, []);
    });
    await p.close();
  }

  // 7) 390 px TR ve 340 px AR: yatay taşma yok
  for (const { genislik, dil } of [{ genislik: 390, dil: 'tr' }, { genislik: 340, dil: 'ar' }]) {
    const { p, hatalar } = await sayfa({ viewport: { width: genislik, height: 780 }, dil });
    const r = await p.evaluate(() => {
      const tasma = () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
      showScreen('screen-menu'); refreshMenu();
      const menu = tasma();
      openCharacters(); const karakter = tasma();
      openShop(); showShopTab('costumes'); const magaza = tasma();
      return { menu, karakter, magaza, dir: document.documentElement.dir };
    });
    sina(`${genislik} px ${dil.toUpperCase()}: menü, karakterler ve mağaza yatay taşmaz`, () => {
      assert.equal(r.menu, false); assert.equal(r.karakter, false); assert.equal(r.magaza, false);
      assert.equal(r.dir, dil === 'ar' ? 'rtl' : r.dir);
      assert.deepEqual(hatalar, []);
    });
    await p.close();
  }
} finally {
  await b.close(); sunucu.close();
}
for (const s of sonuclar) console.log(s);
const kotu = sonuclar.filter((s) => s.startsWith('✗'));
if (kotu.length) { console.log(`\n${kotu.length} sınama başarısız`); process.exit(1); }
console.log(`TAMAM: ${sonuclar.length} sınama`);
