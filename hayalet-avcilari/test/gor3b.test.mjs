// Hayalet Avcıları GÖR3b: kesilmiş ChatGPT resimleri menü/HUD'da emojinin yerine.
// Emoji yalnız resim listede yoksa yedek kalır. Çalıştırma: node test/gor3b.test.mjs
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
const hatalar = [];
const ANAHTARLAR = ['gel-hiz', 'gel-hasar', 'gel-atis', 'gel-menzil', 'gel-can', 'bot', 'efsane-sandik', 'ikon-guc-yildiz', 'ui-basarim', 'ui-madalya', 'ui-zafer', 'ui-yenilgi', 'ui-rekor', 'ui-sandik', 'ui-hediye', 'ui-boss', 'amblem-hayalet', 'menu-fener'];

async function sayfa(dil, en, boy) {
  const p = await b.newPage({ viewport: { width: en, height: boy }, hasTouch: true });
  p.on('pageerror', (e) => hatalar.push(`${dil}: ${e.message}`));
  await p.addInitScript((d) => {
    if (!localStorage.getItem('hayaletAvcilariDil')) localStorage.setItem('hayaletAvcilariDil', d);
    localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9');
    localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1');
  }, dil);
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof startGame === 'function' && typeof oyunSonu === 'function');
  await p.evaluate(() => { save.playerName = save.playerName || 'Deniz'; goToMenu(); });
  return p;
}

try {
  // (a) anahtarlar hem listede hem dosya olarak var
  const listede = await (async () => {
    const p = await sayfa('tr', 390, 844);
    const o = await p.evaluate((ks) => ks.map((k) => !!GORSEL_LISTESI[k]), ANAHTARLAR);
    await p.close();
    return o;
  })();
  sina('(a) bütün anahtarlar GORSEL_LISTESI\'nde var', () => {
    ANAHTARLAR.forEach((k, i) => assert.equal(listede[i], true, k));
  });
  sina('(a) bütün resim dosyaları var', () => {
    ANAHTARLAR.forEach((k) => assert.ok(fs.existsSync(path.join(WWW, 'gorsel', `${k}.webp`)), k));
  });

  // TR dikey sayfa: dükkân, oyun sonu, boss, yerleşim
  const p = await sayfa('tr', 390, 844);

  // (b) dükkân yükseltme ve efsane simgeleri
  const dukkan = await p.evaluate(() => {
    openShop(); showShopTab('upgrades');
    const satirlar = [...document.querySelectorAll('#shop-content .shop-item')];
    const ikonlar = satirlar.slice(0, 6).map((s) => {
      const im = s.querySelector('.item-icon img.ui-simge');
      return { src: im ? im.getAttribute('src') : null, emoji: im ? null : s.querySelector('.item-icon').textContent.trim(),
        ad: s.querySelector('.item-name').textContent.trim(), fiyat: s.querySelector('button').textContent.trim() };
    });
    const ef = document.querySelector('#shop-content .upgrade-header img.ui-simge');
    return { ikonlar, ef: ef ? ef.getAttribute('src') : null, efBoy: ef ? Math.round(ef.getBoundingClientRect().width) : 0 };
  });
  sina('(b) 4 yükseltme + 2 efsane simgesi doğru resim', () => {
    const beklenen = ['gel-hiz', 'gel-hasar', 'gel-atis', 'gel-menzil', 'bot', 'gel-can'];
    dukkan.ikonlar.forEach((it, i) => assert.equal(it.src, `gorsel/${beklenen[i]}.webp`, `sıra ${i}`));
  });
  sina('(b) yükseltme adları ve fiyatları değişmedi', () => {
    assert.match(dukkan.ikonlar[0].ad, /Hız/); assert.match(dukkan.ikonlar[1].ad, /Hasar/);
    assert.match(dukkan.ikonlar[2].ad, /Atış Hızı/); assert.match(dukkan.ikonlar[3].ad, /Menzil/);
    assert.match(dukkan.ikonlar[4].ad, /İkinci Bot/); assert.match(dukkan.ikonlar[5].ad, /Fazladan Kalp/);
    for (const it of dukkan.ikonlar) assert.match(it.fiyat, /💰|MAX/, it.fiyat);
  });
  sina('(b) "Efsane Özellikler" başlığında 40 px sandık resmi', () => {
    assert.equal(dukkan.ef, 'gorsel/efsane-sandik.webp'); assert.equal(dukkan.efBoy, 40);
  });

  // (c) anahtar yoksa emoji yedeği
  const yedek = await p.evaluate(() => {
    const kayit = GORSEL_LISTESI['gel-hiz'];
    delete GORSEL_LISTESI['gel-hiz'];
    refreshShop();
    const ilk = document.querySelector('#shop-content .shop-item .item-icon');
    const o = { resim: !!ilk.querySelector('img.ui-simge'), metin: ilk.textContent.trim() };
    GORSEL_LISTESI['gel-hiz'] = kayit;
    refreshShop();
    return o;
  });
  sina('(c) gel-hiz yokken hız satırı 👟 emojisi gösterir', () => {
    assert.equal(yedek.resim, false); assert.equal(yedek.metin, '👟');
  });

  // (d) oyun sonu resmi: yenilgi / zafer / rekor / anahtar yok
  const sonuc = await p.evaluate(() => {
    const oku = () => ({
      src: (document.querySelector('#gameover-resim img') || {}).getAttribute ? document.querySelector('#gameover-resim img').getAttribute('src') : null,
      gizli: document.getElementById('gameover-resim').hidden,
      baslik: document.getElementById('gameover-title').textContent,
    });
    const kur = (kazandi, rekor, seviye) => {
      game.dunyaTuru = null; game.turBitti = false; game.baslangicBolum = 1;
      game.level = seviye; game.runPara = 0; game.runElmas = 0; game.runZumrut = 0;
      save.highestLevel = rekor ? 1 : 999;
      oyunSonu(kazandi, false, true);
      return oku();
    };
    const yenilgi = kur(false, false, 1);
    const zafer = kur(true, false, 1);
    const rekor = kur(false, true, 5);
    const kayit = GORSEL_LISTESI['ui-yenilgi'];
    delete GORSEL_LISTESI['ui-yenilgi'];
    const yok = kur(false, false, 1);
    GORSEL_LISTESI['ui-yenilgi'] = kayit;
    return { yenilgi, zafer, rekor, yok, trKaybedildi: t('👻 Yakalandın!'), trHarika: t('🌟 Harika!') };
  });
  sina('(d) yenilgi → ui-yenilgi, başlık aynı', () => {
    assert.match(sonuc.yenilgi.src, /ui-yenilgi\.webp/); assert.equal(sonuc.yenilgi.gizli, false);
    assert.equal(sonuc.yenilgi.baslik, sonuc.trKaybedildi);
  });
  sina('(d) kazanılan oyun → ui-zafer, başlık aynı', () => {
    assert.match(sonuc.zafer.src, /ui-zafer\.webp/); assert.equal(sonuc.zafer.baslik, sonuc.trHarika);
  });
  sina('(d) yeni rekor → ui-rekor, başlık aynı', () => {
    assert.match(sonuc.rekor.src, /ui-rekor\.webp/); assert.equal(sonuc.rekor.baslik, sonuc.trKaybedildi);
  });
  sina('(d) anahtar yokken resim gizli, başlık aynı', () => {
    assert.equal(sonuc.yok.gizli, true); assert.equal(sonuc.yok.baslik, sonuc.trKaybedildi);
  });

  // (e) boss HUD resmi ve düğüm kimliği
  const boss = await p.evaluate(() => {
    goToMenu(); online.mode = null; startGame();
    game.bossDefeated = false; game.bossSpawnTimer = 0; game.ghosts = [];
    updateHUD();
    const kutu = document.getElementById('boss-status');
    const ilk = kutu.querySelector('img.ui-simge');
    updateHUD();
    const ikinci = kutu.querySelector('img.ui-simge');
    return { resim: !!ilk, src: ilk ? ilk.getAttribute('src') : null, ayni: ilk === ikinci, metin: kutu.textContent.trim() };
  });
  sina('(e) boss HUD ui-boss resmi içerir, düğüm kareler arasında korunur', () => {
    assert.equal(boss.resim, true); assert.match(boss.src, /ui-boss\.webp/); assert.equal(boss.ayni, true);
    assert.ok(!boss.metin.startsWith('👑'), boss.metin);
  });

  // (f) data-ui-simge ögeleri (2,3,5) resim + baştaki emoji yok; dil AR ve geri TR
  async function simgeKontrol(pg) {
    return pg.evaluate(() => {
      const sec = ['[data-ui-simge="ikon-guc-yildiz"]', '[data-ui-simge="ui-basarim"]',
        '[data-ui-simge="ui-hediye"]'];
      return sec.map((s) => {
        const el = document.querySelector(s);
        if (!el) return { s, yok: true };
        const im = el.querySelector('img.ui-simge');
        return { s, resim: !!im, src: im ? im.getAttribute('src') : null,
          emoji: /^\s*[^\p{L}\s]/u.test(el.textContent), metin: el.textContent.trim() };
      });
    });
  }
  const trSimge = await simgeKontrol(p);
  sina('(f) TR: güçler/başarımlar/reklam düğmeleri resim kullanır', () => {
    for (const o of trSimge) { assert.equal(o.resim, true, o.s); assert.equal(o.emoji, false, o.s); }
  });
  await p.evaluate(() => { localStorage.setItem('hayaletAvcilariDil', 'ar'); location.reload(); });
  await p.waitForFunction(() => typeof startGame === 'function' && document.documentElement.lang === 'ar');
  await p.evaluate(() => { goToMenu(); menuSimgeleriniUygula(); });
  const arSimge = await simgeKontrol(p);
  sina('(f) AR: resimler korunur, baştaki emoji yok', () => {
    for (const o of arSimge) { assert.equal(o.resim, true, o.s); assert.equal(o.emoji, false, o.s); }
  });
  await p.evaluate(() => { localStorage.setItem('hayaletAvcilariDil', 'tr'); location.reload(); });
  await p.waitForFunction(() => typeof startGame === 'function' && document.documentElement.lang === 'tr');
  await p.evaluate(() => { goToMenu(); menuSimgeleriniUygula(); });
  const trSimge2 = await simgeKontrol(p);
  sina('(f) TR\'ye dönünce resimler korunur', () => {
    for (const o of trSimge2) { assert.equal(o.resim, true, o.s); assert.equal(o.emoji, false, o.s); }
  });

  // (g) yeni resimler: contain, gerilmemiş, transform yok
  await p.evaluate(() => {
    game.dunyaTuru = null; game.turBitti = false; game.baslangicBolum = 1;
    game.level = 5; save.highestLevel = 1; game.runPara = 0; game.runElmas = 0; game.runZumrut = 0;
    oyunSonu(false, false, true); openShop(); showShopTab('upgrades'); goToMenu();
  });
  await p.waitForFunction(() => {
    const im = [...document.querySelectorAll('#shop-content .item-icon img.ui-simge, .upgrade-header img.ui-simge, #gameover-resim img, #welcome-amblem img, #dekor-fener img, .odul-sandik img')];
    return im.length > 0 && im.every((x) => x.complete && x.naturalWidth > 0);
  });
  const resimler = await p.evaluate(() => {
    const ims = [...document.querySelectorAll('#shop-content .item-icon img.ui-simge, .upgrade-header img.ui-simge, #gameover-resim img, #welcome-amblem img, #dekor-fener img, .odul-sandik img')];
    return ims.map((im) => {
      const cs = getComputedStyle(im), r = im.getBoundingClientRect();
      const nat = im.naturalWidth / im.naturalHeight;
      const of = cs.objectFit;
      // contain/scale-down resmi kendi oranında çizer: çizilen oran = doğal oran (gerilme yok)
      const cizilen = (of === 'contain' || of === 'scale-down') ? nat : r.width / r.height;
      return { src: im.getAttribute('src'), of, transform: cs.transform, nat, cizilen, en: r.width, boy: r.height };
    });
  });
  sina('(g) yeni resimler contain, gerilmemiş, transform yok', () => {
    assert.ok(resimler.length >= 8, String(resimler.length));
    for (const r of resimler) {
      assert.ok(r.of === 'contain' || r.of === 'scale-down', `${r.src} object-fit ${r.of}`);
      assert.equal(r.transform, 'none', `${r.src} transform`);
      assert.ok(Math.abs(r.cizilen - r.nat) / r.nat < 0.03, `${r.src} oran`);
    }
  });

  // (h) yatay taşma ve fener düğme çakışması — TR 390×844
  async function yerlesim(pg) {
    return pg.evaluate(() => {
      const tasma = () => document.documentElement.scrollWidth - innerWidth;
      const sonuc = {};
      goToMenu(); sonuc.menu = tasma();
      openShop(); sonuc.shop = tasma();
      openLeaderboard(); sonuc.lider = tasma();
      goToMenu();
      const f = document.getElementById('dekor-fener').getBoundingClientRect();
      const dugmeler = [...document.querySelectorAll('#screen-menu .btn')].map((d) => d.getBoundingClientRect());
      const cakis = dugmeler.some((d) => !(f.right <= d.left || f.left >= d.right || f.bottom <= d.top || f.top >= d.bottom));
      sonuc.fener = { cakis, w: Math.round(f.width), h: Math.round(f.height) };
      return sonuc;
    });
  }
  const yer = await yerlesim(p);
  sina('(h) 390×844: menü/dükkân/liderlik yatay taşmaz, fener düğmeye değmez', () => {
    assert.ok(yer.menu <= 0, `menu ${yer.menu}`); assert.ok(yer.shop <= 0, `shop ${yer.shop}`); assert.ok(yer.lider <= 0, `lider ${yer.lider}`);
    assert.equal(yer.fener.cakis, false); assert.equal(yer.fener.w, 40); assert.equal(yer.fener.h, 44);
  });

  // (h) yatay telefon 844×390
  const y = await sayfa('tr', 844, 390);
  const yerY = await yerlesim(y);
  sina('(h) 844×390: menü/dükkân/liderlik yatay taşmaz, fener düğmeye değmez', () => {
    assert.ok(yerY.menu <= 0, `menu ${yerY.menu}`); assert.ok(yerY.shop <= 0, `shop ${yerY.shop}`); assert.ok(yerY.lider <= 0, `lider ${yerY.lider}`);
    assert.equal(yerY.fener.cakis, false);
  });
  // (h) oyun sonu ekranı her iki boyutta taşmasın
  for (const pg of [p, y]) {
    const t = await pg.evaluate(() => {
      game.dunyaTuru = null; game.turBitti = false; game.baslangicBolum = 1; game.level = 5; save.highestLevel = 1;
      game.runPara = 0; game.runElmas = 0; game.runZumrut = 0; oyunSonu(false, false, true);
      return document.documentElement.scrollWidth - innerWidth;
    });
    sina(`(h) oyun sonu yatay taşmaz (${pg === p ? '390×844' : '844×390'})`, () => assert.ok(t <= 0, String(t)));
  }
  await y.close();

  // (i) sayfa hatası yok
  sina('(i) sayfa hatası yok', () => assert.deepEqual(hatalar, []));
} catch (e) {
  sonuclar.push(`✗ test çöktü: ${e.message.split('\n')[0]}`);
} finally {
  await b.close(); sunucu.close();
}
for (const s of sonuclar) console.log(s);
const basarisiz = sonuclar.filter((s) => s.startsWith('✗')).length;
console.log(`\n${sonuclar.length - basarisiz}/${sonuclar.length} geçti`);
process.exit(basarisiz ? 1 : 0);
