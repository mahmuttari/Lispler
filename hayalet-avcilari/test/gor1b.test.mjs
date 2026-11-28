// Hayalet Avcıları: GOR1B — yeni kesilen animasyon, aura, iz, tehlike ve ince ayrıntı görselleri (çevrimdışı sınama).
// Kural: görsel varsa resim, yoksa bugünkü kod çizimi; oyun sayıları ve çarpışma değişmez. Çalıştırma: node test/gor1b.test.mjs
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

const varMi = (r, parca) => r.srcs.some((s) => s.includes(parca));
const sonuclar = [];
function sina(ad, fn) {
  try { fn(); sonuclar.push(`✓ ${ad}`); } catch (e) { sonuclar.push(`✗ ${ad}: ${e.message.split('\n')[0]}`); }
}
const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const hatalar = [];
try {
  const p = await b.newPage({ viewport: { width: 844, height: 390 } });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript(() => {
    localStorage.setItem('hayaletAvcilariDil', 'tr');
    localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9');
    localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1');
  });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof startGame === 'function' && typeof drawGhost === 'function' &&
    typeof hayaletDogusGirdabi === 'function' && typeof aeGorunmezParilti === 'function' && typeof engelleriCiz === 'function');
  const animler = ['hayalet-dogus', 'hayalet-sarj', 'toplama-halka', 'mucevher-parilti', 'boss-inis', 'seviye-atla', 'hasar-patlama', 'gorunmez-parilti', 'lav'];
  const gorseller = ['diken-plaka', 'kalp-aura', 'hatira-parilti', 'mermi-iz-parilti', 'canli-mum', 'canli-goz',
    'canli-parilti', 'canli-buhar', 'canli-alevruhu', 'canli-atesbocegi', 'guc-imza-kinkin'];
  await p.waitForFunction(([as, gs]) => typeof gorsel === 'function' && typeof animHazir === 'function' &&
    gs.every((k) => gorsel(k)) && as.every((k) => animHazir(k) >= 3), [animler, gorseller], { timeout: 40000 });
  await p.evaluate(() => {
    startGame(); game.paused = true;
    window.__ciz = (fn) => {
      const cv = document.createElement('canvas'); cv.width = cv.height = 220;
      const x = cv.getContext('2d');
      let say = 0, rot = 0; const srcs = [];
      const ad = x.drawImage.bind(x); x.drawImage = (im, ...a) => { say++; if (im && im.src) srcs.push(im.src); return ad(im, ...a); };
      const ar = x.rotate.bind(x); x.rotate = (a) => { rot++; return ar(a); };
      fn(x);
      const d = x.getImageData(0, 0, 220, 220).data; let pik = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 8) pik++;
      return { say, rot, pik, srcs };
    };
    window.__sil = (ad) => { const ks = Object.keys(GORSEL).filter((k) => k === ad || k.startsWith(`an-${ad}-`)); const y = ks.map((k) => [k, GORSEL[k]]); ks.forEach((k) => delete GORSEL[k]); return y; };
    window.__geri = (y) => { for (const [k, im] of y) GORSEL[k] = im; };
    window.__var = (r, parca) => r.srcs.some((s) => s.includes(parca));
  });

  const r = await p.evaluate(() => {
    const o = {};
    const B = () => [{ t: 'd', x: 50, y: 30, r: 20 }];
    // 1c: doğuş ve şarj
    const g = { size: 40, __dogus: performance.now() - 100 };
    o.dogus = __ciz((x) => hayaletDogusGirdabi(x, g, 1, performance.now()));
    let y = __sil('hayalet-dogus');
    o.dogusYedek = __ciz((x) => hayaletDogusGirdabi(x, { size: 40, __dogus: performance.now() - 100 }, 1, performance.now()));
    __geri(y);
    o.sarj = __ciz((x) => hayaletSarjCiz(x, 1, 0.5, false));
    y = __sil('hayalet-sarj');
    o.sarjYedek = __ciz((x) => hayaletSarjCiz(x, 1, 0.5, false));
    __geri(y);

    // toplama halkası
    animEfektleri.length = 0; toplamaEfekti({ x: 100, y: 100, kind: 'para' });
    o.toplama = __ciz((x) => animEfektleriCiz(x, animEfektleri[0].bas + 80));
    y = __sil('toplama-halka'); animEfektleri.length = 0; toplamaEfekti({ x: 100, y: 100, kind: 'para' });
    o.toplamaYedek = __ciz((x) => animEfektleriCiz(x, animEfektleri[0].bas + 80)); __geri(y);

    // mücevher parıltısı: konum fazı parıltı penceresine denk getirilir
    game.camera = { x: 0, y: 0 }; game.W = 800; game.H = 400;
    const tsn = performance.now() / 1000;
    let mucevher = { x: 150, y: 100, kind: 'elmas', life: 10 };
    for (let d = 0; d < 1.6; d += 0.05) { // fazı parıltı penceresine denk gelen konumu bul
      const k = Math.ceil((tsn + 100 * 0.017) / 1.6);
      const px = (1.6 * (k + d / 1.6) - tsn) / 0.017;
      mucevher = { x: px, y: 100, kind: 'elmas', life: 10 };
      o.mucevher = __ciz((x) => drawPickup(x, mucevher));
      if (o.mucevher.srcs.some((s) => s.includes('mucevher-parilti'))) break;
    }
    y = __sil('mucevher-parilti');
    o.mucevherYedek = __ciz((x) => drawPickup(x, mucevher)); __geri(y);

    // boss inişi: drawGhost'un animEfektEkle çağrısını izle
    const eskiEkle = window.animEfektEkle;
    let kayit = [];
    window.animEfektEkle = (...a) => { kayit.push(a); return eskiEkle(...a); };
    const boss = () => ({ x: 100, y: 100, size: 64, hp: 10, maxHp: 10, isBoss: true, __dogus: performance.now() - 700 });
    o.boss = __ciz((x) => drawGhost(x, boss()));
    window.animEfektEkle = eskiEkle;
    o.bossAd = kayit.map((a) => a[3] && a[3].ad).filter(Boolean);
    y = __sil('boss-inis'); kayit = []; window.animEfektEkle = (...a) => { kayit.push(a); return eskiEkle(...a); };
    o.bossYedek = __ciz((x) => drawGhost(x, boss()));
    window.animEfektEkle = eskiEkle;
    o.bossYedekTur = kayit.map((a) => a[0]);
    __geri(y);

    // seviye atlama
    animEfektleri.length = 0; AE.efektler.length = 0;
    aeSeviyeEkle({ x: 100, y: 100 }, 2);
    o.seviye = __ciz((x) => animEfektleriCiz(x, animEfektleri[0].bas + 100));
    y = __sil('seviye-atla'); animEfektleri.length = 0; AE.efektler.length = 0;
    aeSeviyeEkle({ x: 100, y: 100 }, 2);
    o.seviyeYedek = __ciz((x) => aeEfektleriCiz(x, performance.now())); __geri(y);

    // hasar patlaması
    animEfektleri.length = 0; aeHasarEkle(100, 100);
    o.hasar = __ciz((x) => animEfektleriCiz(x, animEfektleri[0].bas + 60));
    y = __sil('hasar-patlama'); animEfektleri.length = 0; aeHasarEkle(100, 100);
    o.hasarYedek = __ciz((x) => aeEfektleriCiz(x, performance.now())); __geri(y);

    // görünmezlik parıltısı
    o.gorunmez = __ciz((x) => aeGorunmezParilti(x, { x: 100, y: 100 }, 1000));
    y = __sil('gorunmez-parilti');
    o.gorunmezYedek = __ciz((x) => aeGorunmezParilti(x, { x: 100, y: 100 }, 1000)); __geri(y);

    // güç imza aurası
    game.player.x = 100; game.player.y = 100;
    game.player.power = { type: 'kinkin', expires: performance.now() + 5000, duration: 5000 };
    o.imza = __ciz((x) => aeGucAuraCiz(x, game.player, game.player.power, performance.now()));
    y = __sil('guc-imza-kinkin');
    o.imzaYedek = __ciz((x) => aeGucAuraCiz(x, game.player, game.player.power, performance.now())); __geri(y);
    game.player.power = null;

    // mermi izi parıltısı
    const mermi = { x: 100, y: 100, vx: 10, vy: 0, charKey: 'kinkin', iz: [] };
    o.mermi = __ciz((x) => aeMermiIziCiz(x, mermi));
    y = __sil('mermi-iz-parilti');
    o.mermiYedek = __ciz((x) => aeMermiIziCiz(x, mermi)); __geri(y);

    // diken plakası (önbellek ressamı)
    o.diken = __ciz((x) => window.ENGEL.dikenCiz(x, 100, 50, () => 0.5, {}, B()));
    y = __sil('diken-plaka');
    o.dikenYedek = __ciz((x) => window.ENGEL.dikenCiz(x, 100, 50, () => 0.5, {}, B())); __geri(y);

    // lav kareleri
    o.lav = __ciz((x) => lavCanli(x, 10, 10, 100, 60, B()));
    y = __sil('lav');
    o.lavYedek = __ciz((x) => lavCanli(x, 10, 10, 100, 60, B())); __geri(y);

    // canlı süsler
    o.canli = {};
    for (const t of ['mum', 'goz', 'parilti', 'buhar', 'alevruhu', 'atesbocegi']) {
      o.canli[t] = __ciz((x) => ENGEL_CANLI[t](x, 50, 50, 1.3, 0.25, {}));
    }
    y = __sil('canli-mum');
    o.canliYedek = __ciz((x) => ENGEL_CANLI.mum(x, 50, 50, 1.3, 0.25, {})); __geri(y);

    // kalp aurası
    o.kalp = __ciz((x) => drawPickup(x, { x: 100, y: 100, kind: 'kalp', life: 10 }));
    y = __sil('kalp-aura');
    o.kalpYedek = __ciz((x) => drawPickup(x, { x: 100, y: 100, kind: 'kalp', life: 10 })); __geri(y);

    // hatıra parıltısı
    game.hatira = { kod: 'TR', x: 100, y: 100, simge: '🎁' };
    o.hatira = __ciz((x) => hikayeCiz(x));
    y = __sil('hatira-parilti');
    o.hatiraYedek = __ciz((x) => hikayeCiz(x)); __geri(y);
    game.hatira = null;
    return o;
  });

  sina('hayalet-dogus resimden çizilir; görsel yokken kod girdabı hatasız', () => {
    assert.ok(r.dogus.say >= 1, JSON.stringify(r.dogus));
    assert.equal(r.dogusYedek.say, 0);
    assert.ok(r.dogusYedek.pik > 0, String(r.dogusYedek.pik));
  });
  sina('hayalet-sarj resimden çizilir; görsel yokken kod küresi hatasız', () => {
    assert.ok(r.sarj.say >= 1, JSON.stringify(r.sarj));
    assert.equal(r.sarjYedek.say, 0);
    assert.ok(r.sarjYedek.pik > 0, String(r.sarjYedek.pik));
  });
  sina('toplama-halka para toplanınca resimden; yokken kod halkası', () => {
    assert.ok(r.toplama.say >= 1, JSON.stringify(r.toplama));
    assert.equal(r.toplamaYedek.say, 0);
    assert.ok(r.toplamaYedek.pik > 0, String(r.toplamaYedek.pik));
  });
  sina('mucevher-parilti elmasın üstünde resimden; yokken kod parıltısı', () => {
    assert.ok(varMi(r.mucevher, 'mucevher-parilti'), JSON.stringify(r.mucevher.srcs));
    assert.ok(!varMi(r.mucevherYedek, 'mucevher-parilti'));
  });
  sina('boss-inis resimle ve dalga yerine; yokken dalga halkası', () => {
    assert.ok(r.bossAd.includes('boss-inis'), JSON.stringify(r.bossAd));
    assert.ok(r.bossYedekTur.includes('dalga'), JSON.stringify(r.bossYedekTur));
  });
  sina('seviye-atla resimden; yokken kod seviye efekti', () => {
    assert.ok(varMi(r.seviye, 'seviye-atla'), JSON.stringify(r.seviye.srcs));
    assert.ok(r.seviyeYedek.pik >= 0);
  });
  sina('hasar-patlama oyuncuda resimden; yokken kod efekti', () => {
    assert.ok(varMi(r.hasar, 'hasar-patlama'), JSON.stringify(r.hasar.srcs));
    assert.ok(r.hasarYedek.pik >= 0);
  });
  sina('gorunmez-parilti resimden; yokken kod parıltısı', () => {
    assert.ok(varMi(r.gorunmez, 'gorunmez-parilti'), JSON.stringify(r.gorunmez.srcs));
    assert.ok(!varMi(r.gorunmezYedek, 'gorunmez-parilti'));
  });
  sina('guc-imza-kinkin aurası resimden ve döner; yokken kod aurası', () => {
    assert.ok(varMi(r.imza, 'guc-imza-kinkin'), JSON.stringify(r.imza.srcs));
    assert.ok(r.imza.rot >= 1, `rot ${r.imza.rot}`);
    assert.ok(!varMi(r.imzaYedek, 'guc-imza-kinkin'));
  });
  sina('mermi-iz-parilti avcı mermisinin arkasında resimden ve döner; yokken kod izi', () => {
    assert.ok(varMi(r.mermi, 'mermi-iz-parilti'), JSON.stringify(r.mermi.srcs));
    assert.ok(r.mermi.rot >= 1, `rot ${r.mermi.rot}`);
    assert.equal(r.mermiYedek.say, 0);
    assert.ok(r.mermiYedek.pik > 0, String(r.mermiYedek.pik));
  });
  // Kullanıcı kararı (27 Kasım 2026): tuzaklar "sınır yöntemiyle" çizilir (kenarlık + zemin taşı deseni + kod uçları);
  // diken-plaka resmi artık kullanılmaz (resimle üst üste biniyordu). Resim varken de yokken de diken çizilmeli.
  sina('diken sınır yöntemiyle çizilir (diken-plaka resmi kullanılmaz); resim yokken de çizilir', () => {
    assert.equal(r.diken.say, 0, JSON.stringify(r.diken));
    assert.ok(r.diken.pik > 0, JSON.stringify(r.diken));
    assert.ok(r.dikenYedek.pik > 0, String(r.dikenYedek.pik));
  });
  sina('lav kareleri lav dikdörtgenine sığar; yokken kod lavı', () => {
    assert.ok(varMi(r.lav, 'an-lav-'), JSON.stringify(r.lav.srcs));
    assert.ok(r.lavYedek.pik > 0, String(r.lavYedek.pik));
  });
  sina('canlı süsler (mum/goz/parıltı/buhar/alevruhu/ateşböceği) resimden; mum yokken kod', () => {
    for (const t of Object.keys(r.canli)) assert.ok(r.canli[t].say >= 1, `${t}: ${JSON.stringify(r.canli[t])}`);
    assert.equal(r.canliYedek.say, 0);
    assert.ok(r.canliYedek.pik > 0, String(r.canliYedek.pik));
  });
  sina('kalp-aura kalp toplanabilirinin arkasında resimden; yokken kod ışıması', () => {
    assert.ok(varMi(r.kalp, 'kalp-aura'), JSON.stringify(r.kalp.srcs));
    assert.ok(!varMi(r.kalpYedek, 'kalp-aura'));
  });
  sina('hatira-parilti hatıranın arkasında resimden; yokken kod parıltısı', () => {
    assert.ok(varMi(r.hatira, 'hatira-parilti'), JSON.stringify(r.hatira.srcs));
    assert.ok(!varMi(r.hatiraYedek, 'hatira-parilti'));
  });

  // Az hareket: döngüler sabit tek kareye iner, görünmez parıltısı hiç çizilmez, aura dönmez
  await p.emulateMedia({ reducedMotion: 'reduce' });
  const az = await p.evaluate(() => {
    const o = {};
    o.gorunmez = __ciz((x) => aeGorunmezParilti(x, { x: 100, y: 100 }, 1000));
    game.player.x = 100; game.player.y = 100;
    game.player.power = { type: 'kinkin', expires: performance.now() + 5000, duration: 5000 };
    o.imza = __ciz((x) => aeGucAuraCiz(x, game.player, game.player.power, performance.now() * 2));
    game.player.power = null;
    const B = () => [{ t: 'd', x: 50, y: 30, r: 20 }];
    o.lav = __ciz((x) => lavCanli(x, 10, 10, 100, 60, B()));
    o.dogus = __ciz((x) => hayaletDogusGirdabi(x, { size: 40, __dogus: performance.now() - 100 }, 1, performance.now()));
    return o;
  });
  sina('az harekette görünmez parıltısı hiç çizilmez, aura dönmez', () => {
    assert.equal(az.gorunmez.say, 0);
    assert.equal(az.imza.rot, 0, `rot ${az.imza.rot}`);
  });
  sina('az harekette lav ve doğuş tek sabit karede kalır', () => {
    assert.ok(varMi(az.lav, 'an-lav-1.webp'), JSON.stringify(az.lav.srcs));
    assert.ok(varMi(az.dogus, 'an-hayalet-dogus-1.webp'), JSON.stringify(az.dogus.srcs));
  });
} finally {
  await b.close();
  sunucu.close();
}
sina('sayfa hatası yok', () => { assert.deepEqual(hatalar, []); });
console.log(sonuclar.join('\n'));
const kotu = sonuclar.filter((s) => s.startsWith('✗'));
console.log(`\n${sonuclar.length - kotu.length}/${sonuclar.length} geçti`);
process.exit(kotu.length ? 1 : 0);
