// Hayalet Avcıları 3.20.0: ek animasyonlar (anim-ek.js) — çevrimdışı sınama.
// Ek cephane silahları, karakter güçleri, mermi izi, hasar/seviye olayları ve kare gelince resme geçiş sınanır.
// Görseller yalnız yereldir; hasar/hız değerleri değişmez. Çalıştırma: node test/animasyon-ek.test.mjs
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
  await p.addInitScript(() => { localStorage.setItem('hayaletAvcilariDil', 'tr'); localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9'); });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof startGame === 'function' && typeof aeEfektleriCiz === 'function');
  await p.evaluate(() => {
    window.__hazir = () => {
      startGame(); game.paused = false; game.spawnTimer = 1e9; game.bot = null;
      game.ghosts = []; game.pickups = []; game.projectiles = []; game.enemyProjectiles = []; game.effects = [];
      game.player.dead = false; game.player.invuln = 0; game.player.hp = 3; game.player.maxHp = 3;
      game.camera.x = game.player.x - game.W / 2; game.camera.y = game.player.y - game.H / 2;
      AE.efektler.length = 0; AE.ekran.length = 0; animEfektleri.length = 0;
      const stok = ensureAmmoStock(game.player.charKey); for (const k in WEAPONS) stok[k] = 3;
      return game;
    };
    window.__hayalet = (dx = 100, hp = 100) => {
      const g = { x: game.player.x + dx, y: game.player.y, r: 22, speed: 0, hp, maxHp: hp, size: 40 };
      game.ghosts = [g]; return g;
    };
    // Efektin dünya noktasını 100,100'e getirip saydam olmayan piksel sayar
    window.__piksel = (ciz, x, y) => {
      const cv = document.createElement('canvas'); cv.width = 220; cv.height = 220;
      const c = cv.getContext('2d'); c.translate(110 - x, 110 - y); ciz(c);
      const d = c.getImageData(0, 0, 220, 220).data; let n = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++;
      return n;
    };
  });

  // 1) Bomba: 200 px içindeki hayalet 10 hasar alır; patlama halkası, beyaz parlama ve sarsıntı doğar
  const bomba = await p.evaluate(() => {
    __hazir(); const g = __hayalet(100, 100);
    useWeapon('bomba');
    return {
      hp: g.hp,
      boom: game.effects.some((e) => e.type === 'boom'),
      patlama: animEfektleri.some((e) => e.ad === 'patlama'),
      parlama: AE.ekran.some((e) => e.tur === 'parlama'),
      stok: ensureAmmoStock(game.player.charKey).bomba,
      piksel: __piksel((c) => { c.setTransform(1, 0, 0, 1, 0, 0); aeEkranEfektleriCiz(c, performance.now() + 20); }, 0, 0),
    };
  });
  sina('bomba: 200 px içinde 10 hasar, patlama + parlama + sarsıntı, stok 1 azalır', () => {
    assert.equal(bomba.hp, 90);
    assert.equal(bomba.boom, true);
    assert.equal(bomba.patlama, true);
    assert.equal(bomba.parlama, true);
    assert.equal(bomba.stok, 2);
    assert.ok(bomba.piksel > 100, String(bomba.piksel));
  });
  const bombaBitti = await p.evaluate(() => {
    updateEffects(1); aeEkranEfektleriCiz(document.createElement('canvas').getContext('2d'), performance.now() + 2000);
    return { boom: game.effects.length, ekran: AE.ekran.length };
  });
  sina('bomba efektleri süresi dolunca silinir', () => { assert.equal(bombaBitti.boom, 0); assert.equal(bombaBitti.ekran, 0); });

  // 2) Dondurma: donan hayalete buz kaplaması çizilir, süre bitince kaybolur
  const buz = await p.evaluate(() => {
    __hazir(); const g = __hayalet(0, 100);
    useWeapon('dondurma');
    const simdi = performance.now();
    const dolu = __piksel((c) => aeBuzKaplamaCiz(c, g, simdi + 600), g.x, g.y);
    // son 0,4 sn: çözülme kodu da bir şey çizer
    const coz = __piksel((c) => aeBuzKaplamaCiz(c, g, g.frozenUntil - 200), g.x, g.y);
    g.frozenUntil = simdi - 1;
    const bos = __piksel((c) => aeBuzKaplamaCiz(c, g, simdi), g.x, g.y);
    return { dondu: (g.__aeDonmaBas || 0) > 0, dolu, coz, bos };
  });
  sina('dondurma: her hayalet donar, buz bloğu çizilir; süre bitince çizim yok', () => {
    assert.equal(buz.dondu, true);
    assert.ok(buz.dolu > 200, String(buz.dolu));
    assert.ok(buz.coz > 20, String(buz.coz));
    assert.equal(buz.bos, 0);
  });

  // 3) Şimşek: hayalet 3 hasar alır, gökten yıldırım görseli ve 80 ms beyaz parlama doğar
  const simsek = await p.evaluate(() => {
    __hazir(); const g = __hayalet(0, 100);
    useWeapon('simsek');
    const e = AE.efektler.find((x) => x.tur === 'simsek');
    const px = __piksel((c) => aeEfektleriCiz(c, e ? e.bas + 120 : performance.now()), g.x, g.y - 60);
    return { hp: g.hp, varMi: !!e, parlama: AE.ekran.some((x) => x.tur === 'parlama'), px };
  });
  sina('şimşek: 3 hasar, hayalet başına yıldırım, beyaz ekran parlaması', () => {
    assert.equal(simsek.hp, 97);
    assert.equal(simsek.varMi, true);
    assert.equal(simsek.parlama, true);
    assert.ok(simsek.px > 30, String(simsek.px));
  });

  // 4) Kasırga: görsel korunur, süre başlar
  const kasirga = await p.evaluate(() => { __hazir(); useWeapon('kasirga'); return { kalan: game.player.kasirgaUntil - performance.now() }; });
  sina('kasırga: 8 sn sürer (görsel zaten anim.js kasirgaCiz)', () => { assert.ok(kasirga.kalan > 7000, String(kasirga.kalan)); });

  // 5) İlk yardım: +2 can (max ile sınırlı), şifa efekti
  const sifa = await p.evaluate(() => {
    __hazir(); game.player.hp = 1; game.player.maxHp = 3;
    useWeapon('ilkyrd');
    const e = AE.efektler.find((x) => x.tur === 'sifa');
    const px = __piksel((c) => aeEfektleriCiz(c, e ? e.bas + 220 : performance.now()), game.player.x, game.player.y);
    return { hp: game.player.hp, varMi: !!e, px };
  });
  sina('ilk yardım: +2 can (max 3), yeşil-pembe şifa efekti çizilir', () => {
    assert.equal(sifa.hp, 3);
    assert.equal(sifa.varMi, true);
    assert.ok(sifa.px > 100, String(sifa.px));
  });
  const sifaTavan = await p.evaluate(() => { __hazir(); game.player.hp = 3; const once = ensureAmmoStock(game.player.charKey).ilkyrd; useWeapon('ilkyrd'); return { hp: game.player.hp, stok: ensureAmmoStock(game.player.charKey).ilkyrd, once }; });
  sina('ilk yardım: can doluysa max aşılmaz ve silah harcanmaz', () => { assert.equal(sifaTavan.hp, 3); assert.equal(sifaTavan.stok, sifaTavan.once); });

  // 6) Roket: en yakın hayalete 25 hasar; duman izi ve patlama
  const roket = await p.evaluate(() => {
    __hazir(); const g = __hayalet(140, 100);
    useWeapon('roket');
    const e = game.effects.find((x) => x.type === 'rocket');
    const hedefVar = !!e && e.damage === 25;
    for (let i = 0; i < 80 && game.effects.some((x) => x.type === 'rocket'); i++) updateEffects(0.02);
    return {
      hedefVar, hp: g.hp,
      roketBitti: !game.effects.some((x) => x.type === 'rocket'),
      duman: AE.efektler.some((x) => x.tur === 'duman') || animEfektleri.some((x) => x.ad === 'duman'),
      patlama: game.effects.some((x) => x.type === 'boom'),
    };
  });
  sina('roket: hedefe 25 hasar, duman izi, patlama; süre dolunca roket biter', () => {
    assert.equal(roket.hedefVar, true);
    assert.equal(roket.hp, 75);
    assert.equal(roket.roketBitti, true);
    assert.equal(roket.duman, true);
    assert.equal(roket.patlama, true);
  });

  // 7) Görünmezlik: başlangıç ve bitiş parıltısı, titreyen saydamlık
  const gorunmez = await p.evaluate(() => {
    __hazir(); useWeapon('gorunmez');
    const simdi = performance.now();
    const bas = AE.efektler.filter((x) => x.tur === 'gorunmez');
    return {
      kalan: game.player.invisibleUntil - simdi, bas: bas.length,
      gelecek: bas.some((x) => x.bas > simdi), alfa: aeGorunmezAlfa(simdi),
    };
  });
  sina('görünmezlik: 5 sn sürer; başta ve sonda parıltı; saydamlık titrer', () => {
    assert.ok(gorunmez.kalan > 4000, String(gorunmez.kalan));
    assert.equal(gorunmez.bas, 2);
    assert.equal(gorunmez.gelecek, true);
    assert.ok(Math.abs(gorunmez.alfa - 0.4) > 0.001, String(gorunmez.alfa));
  });

  // 8) Karakter gücü: renkli patlama, aura ve HUD zaman halkası
  const guc = await p.evaluate(() => {
    __hazir(); activatePower('kinkin');
    const pw = getActivePower();
    updateHUD();
    const halka = document.querySelector('#power-bar .power-ring');
    const cv = document.createElement('canvas'); cv.width = 220; cv.height = 220;
    const c = cv.getContext('2d'); c.translate(-(game.player.x - 110), -(game.player.y - 110));
    const cizdi = aeGucAuraCiz(c, game.player, pw, performance.now() + 300);
    const d = c.getImageData(0, 0, 220, 220).data; let n = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++;
    return { patlama: AE.efektler.some((x) => x.tur === 'guc-patlama'), cizdi, px: n, halka: !!halka,
      pct: halka ? halka.style.getPropertyValue('--ae-p') : '' };
  });
  sina('güç açılınca patlama, oyuncu altında aura ve HUD zaman halkası oluşur', () => {
    assert.equal(guc.patlama, true);
    assert.equal(guc.cizdi, true);
    assert.ok(guc.px > 100, String(guc.px));
    assert.equal(guc.halka, true);
    assert.ok(parseFloat(guc.pct) > 0 && parseFloat(guc.pct) <= 1, guc.pct);
  });

  // 9) Mermi: hız değişmez, iz en çok 4 nokta, kısa solan iz çizilir
  const mermi = await p.evaluate(() => {
    __hazir(); const g = __hayalet(120, 100); game.player.gun = '';
    fireProjectile(g);
    const m = game.projectiles[game.projectiles.length - 1];
    const hiz0 = Math.hypot(m.vx, m.vy);
    for (let i = 0; i < 12; i++) aeMermiIziGuncelle(m);
    const px = __piksel((c) => aeMermiIziCiz(c, m), m.x, m.y);
    return { hiz0, hiz1: Math.hypot(m.vx, m.vy), iz: m.iz.length, px };
  });
  sina('varsayılan mermi: hız aynı (480), iz en çok 4 nokta ve parlama çizilir', () => {
    assert.ok(Math.abs(mermi.hiz0 - 480) < 0.01, String(mermi.hiz0));
    assert.equal(mermi.hiz1, mermi.hiz0);
    assert.ok(mermi.iz <= 4, String(mermi.iz));
    assert.ok(mermi.px > 20, String(mermi.px));
  });

  // 10) Hasar: oyuncuda hasar efekti, kırmızı vinyet; can bir azalır
  const hasar = await p.evaluate(() => {
    __hazir(); game.player.hp = 3; game.player.invuln = 0; damagePlayer();
    return { hp: game.player.hp, hasar: AE.efektler.some((x) => x.tur === 'hasar'), vinyet: AE.ekran.some((x) => x.tur === 'vinyet') };
  });
  sina('oyuncu hasar alınca hasar patlaması ve kırmızı vinyet; can 1 azalır', () => {
    assert.equal(hasar.hp, 2);
    assert.equal(hasar.hasar, true);
    assert.equal(hasar.vinyet, true);
  });

  // 11) Bölüm geçişi: seviye patlaması ve "Bölüm n" yazısı
  const seviye = await p.evaluate(() => {
    __hazir(); const once = game.level; nextLevel();
    return { level: game.level, once, patlama: AE.efektler.some((x) => x.tur === 'seviye'), banner: AE.ekran.some((x) => x.tur === 'banner') };
  });
  sina('bölüm geçince seviye patlaması ve bölüm yazısı çıkar', () => {
    assert.equal(seviye.level, seviye.once + 1);
    assert.equal(seviye.patlama, true);
    assert.equal(seviye.banner, true);
  });

  // 12) Cephane çubuğu: stok 0 pasif görünür; stok azalınca rozet popu
  const bar = await p.evaluate(() => {
    __hazir(); ensureAmmoStock(game.player.charKey).bomba = 0; refreshWeaponBar();
    const pasif = !!document.querySelector('#weapon-bar .weapon-slot.ae-pasif');
    ensureAmmoStock(game.player.charKey).bomba = 3; refreshWeaponBar();
    const once = document.querySelector('#weapon-bar [data-weapon="bomba"] .badge');
    ensureAmmoStock(game.player.charKey).bomba = 2; refreshWeaponBar();
    const sonra = document.querySelector('#weapon-bar [data-weapon="bomba"] .badge');
    return { pasif, pop: !!(sonra && sonra.classList.contains('ae-rozet-pop')), once: once && once.textContent, sonra: sonra && sonra.textContent };
  });
  sina('cephane çubuğu: stok 0 düğmesi pasif; stok değişince rozet zıplar', () => {
    assert.equal(bar.pasif, true);
    assert.equal(bar.pop, true);
    assert.equal(bar.once, '3'); assert.equal(bar.sonra, '2');
  });

  // 13) Kare testi: sahte "sifa" kareleri gelince kod yerine resim çizilir
  const kare = await p.evaluate(async () => {
    __hazir();
    const imler = [];
    for (let n = 1; n <= 3; n++) {
      const c = document.createElement('canvas'); c.width = c.height = 32;
      const x = c.getContext('2d'); x.fillStyle = `hsl(${n * 90}, 90%, 60%)`; x.fillRect(2, 2, 28, 28);
      const im = new Image();
      await new Promise((coz) => { im.onload = im.onerror = () => coz(); im.src = c.toDataURL(); });
      imler.push(im);
    }
    for (let n = 1; n <= 3; n++) { GORSEL[`an-sifa-${n}`] = imler[n - 1]; GORSEL_LISTESI[`an-sifa-${n}`] = imler[n - 1].src; }
    delete _animSayi.sifa;
    const hazir = animHazir('sifa');
    animEfektleri.length = 0;
    aeSifaEkle(100, 100);
    const tur = animEfektleri.find((e) => e.ad === 'sifa');
    const c = document.createElement('canvas'); c.width = c.height = 200; const x = c.getContext('2d');
    let say = 0; const asil = x.drawImage.bind(x);
    x.drawImage = (...a) => { say++; return asil(...a); };
    animEfektleriCiz(x, tur.bas + 200);
    for (let n = 1; n <= 3; n++) { delete GORSEL[`an-sifa-${n}`]; delete GORSEL_LISTESI[`an-sifa-${n}`]; }
    delete _animSayi.sifa;
    return { hazir, tur: tur.tur, ad: tur.ad, say, sonra: animHazir('sifa') };
  });
  sina('sahte kareler gelince şifa animasyonu resimden çizilir (kod yerine)', () => {
    assert.equal(kare.hazir, 3);
    assert.equal(kare.tur, 'kare');
    assert.equal(kare.ad, 'sifa');
    assert.ok(kare.say >= 1, String(kare.say));
    assert.equal(kare.sonra, 0);
  });

  // 14) Hareketi azalt: sarsıntı 0, parlama yok
  const p2 = await b.newPage({ viewport: { width: 844, height: 390 } });
  p2.on('pageerror', (e) => hatalar.push('az: ' + e.message));
  await p2.emulateMedia({ reducedMotion: 'reduce' });
  await p2.addInitScript(() => { localStorage.setItem('hayaletAvcilariDil', 'tr'); });
  await p2.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p2.goto(adres, { waitUntil: 'load' });
  await p2.waitForFunction(() => typeof aeSarsintiOfset === 'function');
  const az = await p2.evaluate(() => {
    aeSarsinti(0.25, 6); aeParlama(0.3); aeVinyet(0.3);
    return { ofset: aeSarsintiOfset(), ekran: AE.ekran.length, az: aeAzHareket() };
  });
  sina('hareketi azalt: sarsıntı ofseti 0, parlama/vinyet eklenmez', () => {
    assert.equal(az.az, true);
    assert.deepEqual(az.ofset, { x: 0, y: 0 });
    assert.equal(az.ekran, 0);
  });
  await p2.close();

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
