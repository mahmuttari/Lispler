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
const round1 = (n) => Math.round(n * 10) / 10;

// Diskteki görsel listesi: bütün resimlerin yüklenmesi beklenir (3D kareler dahil)
const LISTE = JSON.parse(fs.readFileSync(path.join(WWW, 'gorsel', 'liste.js'), 'utf8').match(/= (\{.*\});/)[1]);

const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const hatalar = [];
const p = await b.newPage({ viewport: { width: 844, height: 390 } });
p.on('pageerror', (e) => hatalar.push(e.message));
await p.addInitScript(() => { localStorage.setItem('hayaletAvcilariDil', 'tr'); localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9'); localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1'); });
await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
await p.goto(adres, { waitUntil: 'load' });
await p.waitForFunction(() => typeof canliOnizleme === 'function' && typeof uiSimgeHTML === 'function' && typeof startGame === 'function');
await p.waitForFunction((n) => Object.keys(GORSEL).length === n, Object.keys(LISTE).length, { timeout: 10000 });
try {
  // 7) canliOnizleme: açılış karşılıyıcısında tuval var, görseller gelince dolu; DOM'dan çıkınca kaydı silinir
  const karsilayici = await p.evaluate(() => {
    const el = document.getElementById('kinkin-greeter');
    const resim = el.querySelector('img.giris-kahraman');
    return { tuval: !!el.querySelector('canvas.canli-onizleme'), resim: !!resim,
      resimDolu: !!resim && resim.complete && resim.naturalWidth > 0, kayit: canliOnizlemeSayisi() };
  });
  // "giris-kahraman" listede varsa resim önceliklidir (drawGreeter); yoksa canlı tuval çizilir.
  sina('7) açılış karşılıyıcısı canlı tuval ya da grup resmi içerir', () => {
    assert.ok(karsilayici.tuval || karsilayici.resim, 'karşılıyıcı boş');
    assert.equal(karsilayici.kayit, karsilayici.resim ? 0 : 1);
  });
  const doluMu = karsilayici.resim ? karsilayici.resimDolu : await p.waitForFunction(() => {
    const cv = document.querySelector('#kinkin-greeter canvas.canli-onizleme');
    if (!cv || !cv.width) return false;
    const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
    let dolu = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 0) dolu++;
    return dolu > 300;
  }, null, { timeout: 5000 }).then(() => true, () => false);
  sina('7) görseller yüklenince karşılıyıcı dolu (resim veya çizilen kareler)', () => { assert.equal(doluMu, true); });

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

  // 1) Kart ızgarası: 12 kart; ad, unvan, güç rozeti; kilitli kartta maliyet
  await p.evaluate(() => openCharacters());
  await p.waitForFunction(() => document.querySelectorAll('#character-list .char-card').length === 12);
  const kartlar = await p.evaluate(() => [...document.querySelectorAll('#character-list .char-card')].map((c) => ({
    key: c.dataset.key,
    ad: (c.querySelector('.char-ad') || {}).textContent || '',
    unvan: (c.querySelector('.char-unvan') || {}).textContent || '',
    guc: !!c.querySelector('.char-guc'),
    kilit: (c.querySelector('.char-durum.kilit') || {}).textContent || '',
  })));
  sina('1) 12 karakter kartı ad, unvan ve güç rozetiyle çizilir', () => {
    assert.equal(kartlar.length, 12);
    for (const k of kartlar) {
      assert.ok(k.ad.trim(), `${k.key}: ad yok`);
      assert.ok(k.unvan.trim(), `${k.key}: unvan yok`);
      assert.equal(k.guc, true, `${k.key}: güç rozeti yok`);
    }
    assert.ok(kartlar.some((k) => k.kilit.trim().startsWith('💚 ')), 'kilitli kartta 💚 maliyet yok');
  });

  // 2) Panel: 4 stat çubuğu 0-100%; en güçlü karakter o statta %100
  await p.click('.char-card[data-key="fanatik"]');
  await p.waitForSelector('#character-detail.open');
  const statlar = await p.evaluate(() => [...document.querySelectorAll('#character-detail .stat-dolu')].map((el) => ({
    k: el.dataset.stat, w: parseFloat(el.style.width),
  })));
  sina('2) panelde 4 stat çubuğu 0-100% arasında', () => {
    assert.equal(statlar.length, 4);
    for (const s of statlar) assert.ok(s.w >= 0 && s.w <= 100, `${s.k}: ${s.w}`);
  });
  const fanatikHasar = statlar.find((s) => s.k === 'hasar');
  sina('2) en güçlü karakter (Fanatik hasar) çubuğu %100', () => { assert.equal(round1(fanatikHasar.w), 100); });
  const fanatikHiz = statlar.find((s) => s.k === 'hiz');
  sina('2) bir statta en güçlü karakterin çubuğu %100', () => { assert.equal(round1(fanatikHiz.w), 100); });

  // 3) ‹ › gezinme adı değiştirir; ✕ ve Escape kapatır
  const adOnce = await p.textContent('#char-detay-ad');
  await p.click('.char-detay-sonraki');
  const adSonra = await p.textContent('#char-detay-ad');
  sina('3) › düğmesi karakteri değiştirir', () => { assert.notEqual(adSonra.trim(), adOnce.trim()); });
  await p.click('.char-detay-kapat');
  const kapandi = await p.evaluate(() => document.getElementById('character-detail').hidden);
  sina('3) ✕ düğmesi paneli kapatır', () => { assert.equal(kapandi, true); });
  await p.evaluate(() => karakterDetayAc('kinkin'));
  await p.waitForSelector('#character-detail.open');
  await p.keyboard.press('Escape');
  const escapeKapandi = await p.evaluate(() => document.getElementById('character-detail').hidden);
  sina('3) Escape paneli kapatır', () => { assert.equal(escapeKapandi, true); });

  // 4) Satın alma: 999 zümrüt, onay kabul, karakter sahipli+seçili, zümrüt düşer, menü yeni karakter
  const kentCost = await p.evaluate(() => CHARACTERS.kent.cost);
  await p.evaluate(() => { save.zumrut = 999; karakterDetayAc('kent'); });
  await p.waitForSelector('#character-detail.open');
  p.once('dialog', (d) => d.accept());
  await p.click('#character-detail .char-eylem');
  await p.waitForFunction(() => save.unlockedChars.kent === true && save.selectedChar === 'kent');
  const satin = await p.evaluate(() => ({ zumrut: save.zumrut, secili: save.selectedChar, sahip: save.unlockedChars.kent }));
  sina('4) satın alınca karakter sahipli ve seçili, zümrüt maliyet kadar düşer', () => {
    assert.equal(satin.zumrut, 999 - kentCost);
    assert.equal(satin.secili, 'kent');
    assert.equal(satin.sahip, true);
  });
  const menuSecim = await p.evaluate(() => { goToMenu(); return { secili: save.selectedChar, ad: document.getElementById('character-name').textContent.trim() }; });
  sina('4) menü önizlemesi yeni karakteri gösterir', () => {
    assert.equal(menuSecim.secili, 'kent');
    assert.equal(menuSecim.ad, 'Kenit');
  });

  // 5) Yetersiz zümrüt: uyarı çıkar, hiçbir şey değişmez
  await p.evaluate(() => { save.zumrut = 0; openCharacters(); karakterDetayAc('fanatik'); });
  await p.waitForSelector('#character-detail.open');
  await p.click('#character-detail .char-eylem');
  const yetersiz = await p.waitForFunction(() => {
    const t = document.getElementById('toast');
    const metin = t.textContent.trim();
    return metin.includes('Yeterli zümrüt yok') ? { metin, sahip: !!save.unlockedChars.fanatik, secili: save.selectedChar, zumrut: save.zumrut } : false;
  }, null, { timeout: 3000 }).then((h) => h.jsonValue());
  sina('5) yetersiz zümrütta uyarı çıkar ve durum değişmez', () => {
    assert.ok(yetersiz.metin.includes('Yeterli zümrüt yok 💚'), yetersiz.metin);
    assert.equal(yetersiz.sahip, false);
    assert.equal(yetersiz.secili, 'kent');
    assert.equal(yetersiz.zumrut, 0);
  });

  // 6) Kostüm çipi: sahip olunan seçer, olmayan seçmez
  await p.evaluate(() => {
    save.unlockedCostumes.kinkin = [0, 1];
    save.selectedCostume.kinkin = 0;
    save.selectedChar = 'kinkin';
    karakterDetayAc('kinkin');
  });
  await p.waitForSelector('#character-detail.open');
  await p.click('#character-detail .char-kostum[data-costume="1"]');
  const kostum1 = await p.evaluate(() => save.selectedCostume.kinkin);
  sina('6) sahip olunan kostüm çipi kostümü seçer', () => { assert.equal(kostum1, 1); });
  await p.click('#character-detail .char-kostum[data-costume="2"]');
  const kostum2 = await p.evaluate(() => save.selectedCostume.kinkin);
  sina('6) sahip olunmayan kostüm çipi kostümü seçmez', () => { assert.equal(kostum2, 1); });

  // 9) menuSimgeleriniUygula: yalnız baştaki emoji değişir, iki kez çağrı tek <img> ekler
  const menuSimge = await p.evaluate(() => {
    GORSEL_LISTESI['ui-magaza'] = 1;
    menuSimgeleriniUygula();
    const btn = document.querySelector('[data-ui-simge="ui-magaza"]');
    const ilk = { metin: btn.textContent, img: btn.querySelectorAll('img.ui-simge').length };
    menuSimgeleriniUygula();
    const ikinci = btn.querySelectorAll('img.ui-simge').length;
    delete GORSEL_LISTESI['ui-magaza'];
    return { ilk, ikinci };
  });
  sina('9) menü simgesi yalnız emojinin yerine geçer, iki kez çağrıda tek img', () => {
    assert.equal(menuSimge.ilk.img, 1);
    assert.equal(menuSimge.ikinci, 1);
    assert.ok(menuSimge.ilk.metin.includes('Mağaza'), menuSimge.ilk.metin);
    assert.ok(!menuSimge.ilk.metin.includes('🛒'), menuSimge.ilk.metin);
  });

  // Oyun sonu ödül sayacı: 0'dan son değere ~0.8 sn'de, 1.2 sn sonra son sayılar görünür
  const odul = await p.evaluate(async () => {
    odulSayaclariGoster({ hayalet: 12, para: 345, elmas: 7, zumrut: 4 });
    const erken = document.getElementById('final-para').textContent;
    await new Promise((r) => setTimeout(r, 1200));
    return {
      erken,
      ghosts: document.getElementById('final-ghosts').textContent,
      para: document.getElementById('final-para').textContent,
      elmas: document.getElementById('final-elmas').textContent,
      zumrut: document.getElementById('final-zumrut').textContent,
    };
  });
  sina('oyun sonu ödül sayacı 1.2 sn sonra son değerlere ulaşır', () => {
    assert.equal(odul.ghosts, '12');
    assert.equal(odul.para, '345');
    assert.equal(odul.elmas, '7');
    assert.equal(odul.zumrut, '4');
  });

  sina('sayfa hatası yok', () => { assert.deepEqual(hatalar, []); });

  // 10) Arapça, 340×740: panel açılır ve yatay taşma olmaz
  const p2 = await b.newPage({ viewport: { width: 340, height: 740 } });
  await p2.addInitScript(() => { localStorage.setItem('hayaletAvcilariDil', 'ar'); localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9'); localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1'); });
  await p2.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p2.goto(adres, { waitUntil: 'load' });
  await p2.waitForFunction(() => typeof karakterDetayAc === 'function' && typeof openCharacters === 'function');
  await p2.evaluate(() => { openCharacters(); karakterDetayAc('fanatik'); });
  await p2.waitForSelector('#character-detail.open');
  const genislik = await p2.evaluate(() => ({ dir: document.documentElement.dir, scroll: document.documentElement.scrollWidth }));
  sina('10) Arapça 340 px: panel açılır ve yatay taşma yok', () => {
    assert.equal(genislik.dir, 'rtl');
    assert.ok(genislik.scroll <= 340, `scrollWidth ${genislik.scroll}`);
  });
  await p2.close();
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
