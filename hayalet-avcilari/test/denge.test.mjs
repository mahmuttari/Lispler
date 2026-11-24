// Hayalet Avcıları: denge ve küçük tutarlılık düzeltmeleri — çevrimdışı sınama.
// Kasırga donmuş hayalet hasarı, Dünya Turu perdeleri/müziği, güç + silah çarpanlarının toplanması,
// oyun bitti ekranındaki reklamlar ve zümrüt ödülü sınanır.
// Çalıştırma: node hayalet-avcilari/test/denge.test.mjs   (Playwright + Chromium; Firebase gerekmez)
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
try {
  const p = await b.newPage({ viewport: { width: 844, height: 390 } });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript(() => {
    localStorage.setItem('hayaletAvcilariDil', 'tr');
    localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9');
    const kayit = [];
    window.__admob = kayit;
    window.__dinle = {};
    window.__olay = (ad) => (window.__dinle[ad] || []).forEach((fn) => fn());
    const cagri = (ad, sonuc) => async (arg) => {
      kayit.push({ ad, arg: arg === undefined ? null : JSON.parse(JSON.stringify(arg)) });
      return sonuc;
    };
    const onay = { status: 'NOT_REQUIRED', isConsentFormAvailable: false, canRequestAds: true, privacyOptionsRequirementStatus: 'NOT_REQUIRED' };
    window.Capacitor = { Plugins: { AdMob: {
      initialize: cagri('initialize'),
      requestConsentInfo: cagri('requestConsentInfo', onay),
      showConsentForm: cagri('showConsentForm', onay),
      addListener: (olay, fn) => {
        kayit.push({ ad: 'addListener', arg: olay });
        (window.__dinle[olay] = window.__dinle[olay] || []).push(fn);
        return Promise.resolve({ remove: async () => {} });
      },
      prepareInterstitial: cagri('prepareInterstitial'),
      prepareRewardVideoAd: cagri('prepareRewardVideoAd'),
      showInterstitial: cagri('showInterstitial'),
      showRewardVideoAd: cagri('showRewardVideoAd'),
      showPrivacyOptionsForm: cagri('showPrivacyOptionsForm'),
    } } };
  });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof startGame === 'function' && typeof turPerdeleriniKapat === 'function' && typeof fireProjectile === 'function');
  await p.evaluate(() => {
    window.__sahne = () => {
      startGame(); game.paused = true; game.ghosts = []; game.pickups = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
      game.walls = []; game.player.x = 800; game.player.y = 700; game.player.invuln = 1e9; game.bot = null;
      game.camera.x = game.player.x - game.W / 2; game.camera.y = game.player.y - game.H / 2;
    };
    window.__hayalet = (x, y, hp = 3, ek = {}) => { const g = { x, y, r: 22, speed: 60, hp, maxHp: hp, size: 40, ...ek }; game.ghosts.push(g); return g; };
    window.__ilerle = (sn, now) => { for (let t = 0; t < sn; t += 1 / 30) update(1 / 30, (now || performance.now()) + t * 1000); };
  });

  // 12) Kasırga donmuş hayalete boss olmayan için 3/s, boss için 8/s hasar verir
  const kasirga = await p.evaluate(() => {
    __sahne();
    const P = game.player, now = performance.now();
    P.kasirgaUntil = now + 8000; P.range = 0; game.pet = null; game.projectiles = []; // otomatik atış ve pet hasarı karışmasın
    const normal = __hayalet(P.x + 100, P.y, 50, { frozenUntil: now + 5000 });
    const boss = __hayalet(P.x - 100, P.y, 200, { frozenUntil: now + 5000, isBoss: true, r: 44, size: 80, speed: 0 });
    __ilerle(1, now);
    return { normal: 50 - normal.hp, boss: 200 - boss.hp };
  });
  sina('donmuş normal hayalet kasırgada 3 can/sn kaybeder', () => { assert.ok(kasirga.normal > 2.5 && kasirga.normal < 3.5, String(kasirga.normal)); });
  sina('donmuş boss kasırgada 8 can/sn kaybeder', () => { assert.ok(kasirga.boss > 7.5 && kasirga.boss < 8.5, String(kasirga.boss)); });

  // 14) Oda kapanınca Dünya Turu perdesi kalkar, müziği söner
  const oda = await p.evaluate(() => {
    __sahne(); game.running = false; game.dunyaTuru = true; game.level = 6;
    online.mode = null; online.roomId = null;
    document.getElementById('tur-damga').classList.add('active');
    muzik.kod = 'FR';
    odaKapandi();
    return { perde: document.querySelectorAll('.tur-perde.active').length, muzik: muzik.kod };
  });
  sina('oda kapanınca tur perdesi görünmez, tur müziği durur', () => { assert.equal(oda.perde, 0); assert.equal(oda.muzik, null); });

  // 17a) Dev Bazuka gecikmesi 1.3, Saçmalı Top saçma ömrü 0.4 sn
  const silah = await p.evaluate(() => ({ bazuka: GUNS.bazuka.delayMul, sacmali: GUNS.pompali.life, bazukaDmg: GUNS.bazuka.dmgMul }));
  sina('Dev Bazuka delayMul 1.3 (hasar çarpanı 3 kalır)', () => { assert.equal(silah.bazuka, 1.3); assert.equal(silah.bazukaDmg, 3); });
  sina('Saçmalı Top saçma ömrü 0.4 sn', () => { assert.equal(silah.sacmali, 0.4); });
  const sacmaliMermi = await p.evaluate(() => {
    __sahne(); const P = game.player; P.gun = 'pompali'; P.damage = 10;
    fireProjectile({ x: P.x + 100, y: P.y });
    return game.projectiles.map((m) => m.life);
  });
  sina('Saçmalı Top mermileri 0.4 sn yaşar', () => { assert.ok(sacmaliMermi.length === 3 && sacmaliMermi.every((l) => l === 0.4), JSON.stringify(sacmaliMermi)); });

  // 17b) Veryi (×3) + Bazuka (×3) hasarı toplanır: ×5, çarpılmaz (×9 değil)
  const hasar = await p.evaluate(() => {
    __sahne(); const P = game.player;
    P.damage = 10; P.gun = 'bazuka'; P.power = { type: 'veryi', expires: performance.now() + 1e7 };
    fireProjectile({ x: P.x + 100, y: P.y });
    const dolu = game.projectiles[0].dmg;
    P.power = null; game.projectiles = [];
    fireProjectile({ x: P.x + 100, y: P.y });
    const yalnizBazuka = game.projectiles[0].dmg;
    return { dolu, yalnizBazuka };
  });
  sina('Veryi gücü + Bazuka hasarı 5 × taban (çarpım değil)', () => { assert.equal(hasar.dolu, 50); assert.equal(hasar.yalnizBazuka, 30); });

  // 17b) Ponko (÷3) + Baloncuk (0.65) hız çarpanları toplanır ve gecikme 60 ms'nin altına inmez
  const atis = await p.evaluate(() => {
    __sahne(); const P = game.player;
    P.gun = 'baloncuk'; P.damage = 10; P.range = 1000; P.fireDelay = 100; // 100/3.538 ≈ 28 ms idi; 60 ms'ye kırpılmalı
    P.power = { type: 'ponko', expires: performance.now() + 1e7 };
    __hayalet(P.x + 100, P.y, 1000);
    game.projectiles = []; game.lastFire = 0;
    update(1 / 60, 1e9);
    const ilk = game.projectiles.length;
    update(1 / 60, 1e9 + 55);
    const elliBes = game.projectiles.length;
    update(1 / 60, 1e9 + 66);
    const altmisAlti = game.projectiles.length;
    return { ilk, elliBes, altmisAlti };
  });
  sina('Ponko + Baloncuk: ilk atış olur, 55 ms\'de ikinci atış yok (gecikme ≥ 60 ms), 66 ms\'de var', () => {
    assert.ok(atis.ilk > 0, String(atis.ilk)); assert.equal(atis.elliBes, atis.ilk); assert.ok(atis.altmisAlti > atis.elliBes);
  });

  // 20a) Oyun bitti: 800 ms bekleyen geçiş reklamı, 300 ms'de başlayan ödüllü reklamla iptal olur
  const gecis = await p.evaluate(async () => {
    const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
    const say = () => window.__admob.filter((c) => c.ad === 'showInterstitial').length;
    save.reklam = { oyun: 10, toplam: 900, sure: 400, son: [] };
    reklam.hazir = true; reklam.gecisYuklu = true; reklam.odulluYuklu = true;
    reklam.odulKullanildi = false; reklam.cevrimiciSonuc = false;
    startGame(); game.player.invuln = 1e9; game.level = 3; game.runPara = 40; game.oynananSure = 50;
    endGame(false);
    const once = say();
    await bekle(300);
    odulluIzle();
    await bekle(1100);
    return { yeni: say() - once, odullu: window.__admob.filter((c) => c.ad === 'showRewardVideoAd').length };
  });
  sina('ödüllü reklam 300 ms\'de başlarsa geçiş reklamı gösterilmez', () => { assert.equal(gecis.yeni, 0); assert.ok(gecis.odullu > 0, String(gecis.odullu)); });

  // 20b) Zümrüt ödülü sayaç sürerken gelirse son değer eski + 10 olur ve kalır
  const zumrut = await p.evaluate(async () => {
    const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
    const el = document.getElementById('final-zumrut');
    el.dataset.son = '5'; el.textContent = '3'; // sayaç hâlâ 5'e doğru sayıyor
    reklam.odulKullanildi = false; reklam.cevrimiciSonuc = false; reklam.odulluYuklu = true;
    odulluIzle('zumrut');
    await bekle(20);
    window.__olay('onRewardedVideoAdReward');
    window.__olay('onRewardedVideoAdDismissed');
    await bekle(50);
    const ilk = { metin: el.textContent, son: el.dataset.son };
    await bekle(400); // sayaç bitse de değer değişmemeli
    return { ilk, sonra: { metin: el.textContent, son: el.dataset.son }, odul: REKLAM.odulZumrut };
  });
  sina('zümrüt ödülü sayacı bitirir; son değer eski + 10 olur ve kalır', () => {
    assert.equal(zumrut.odul, 10);
    assert.equal(zumrut.ilk.metin, '15'); assert.equal(zumrut.ilk.son, '15');
    assert.equal(zumrut.sonra.metin, '15'); assert.equal(zumrut.sonra.son, '15');
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
process.exitCode = kalan.length ? 1 : 0;
