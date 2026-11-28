// Hayalet Avcıları: Efsane silahlar (alım, takma, atış) + efsane alım kutlaması.
// Çalıştırma: node test/efs1.test.mjs   (Playwright + Chromium; ağ ve Firebase gerekmez)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WWW = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);
const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2', '.m4a': 'audio/mp4' };
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
async function sayfa() {
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  p.on('pageerror', (e) => hatalar.push(e.stack));
  await p.addInitScript(() => { localStorage.setItem('hayaletAvcilariDil', 'tr'); localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1'); });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof startGame === 'function');
  await p.evaluate(() => { localStorage.setItem(VERSION_KEY, APP_VERSION); save.playerName = save.playerName || 'Deniz'; });
  return p;
}

try {
  // 1) Mağaza silahlar sekmesi: fiyatlar ve "✨ Efsane" etiketi
  const pa = await sayfa();
  await pa.evaluate(() => { save.para = 0; showShopTab('guns'); });
  const vitrin = await pa.evaluate(() => {
    const metin = [...document.querySelectorAll('#shop-content .shop-item')].map((e) => e.textContent);
    const bul = (ad) => metin.find((m) => m.includes(ad)) || '';
    return {
      yildiz: bul('Yıldız Tüfeği'), ejder: bul('Ejder Nefesi'), gokkusagi: bul('Gökkuşağı Işını'),
      efsaneSayisi: metin.filter((m) => m.includes('✨ Efsane')).length,
      yildizButon: [...document.querySelectorAll('#shop-content .shop-item')].find((e) => e.textContent.includes('Yıldız Tüfeği'))?.querySelector('button')?.disabled,
    };
  });
  sina('1) silahlar sekmesinde efsane fiyatları ve "✨ Efsane" etiketi görünür', () => {
    assert.ok(vitrin.yildiz.includes('25000'), vitrin.yildiz);
    assert.ok(vitrin.ejder.includes('60000'), vitrin.ejder);
    assert.ok(vitrin.gokkusagi.includes('150000'), vitrin.gokkusagi);
    assert.equal(vitrin.efsaneSayisi, 3);
    assert.equal(vitrin.yildizButon, true, 'parası yokken alım düğmesi kapalı olmalı');
  });

  // 2) Parası yetmeyince alınamaz; yetince alınır, bakiye düşer, takılır ve kayda yazılır
  const alim = await pa.evaluate(() => {
    const bul = () => [...document.querySelectorAll('#shop-content .shop-item')].find((e) => e.textContent.includes('Yıldız Tüfeği'));
    save.para = 24999; save.ownedGuns = {}; save.equippedGun = ''; refreshShop();
    bul().querySelector('button').click();
    const az = { sahip: !!save.ownedGuns.yildiz, para: save.para };
    save.para = 25000; refreshShop();
    bul().querySelector('button').click();
    persistSave();
    Object.assign(save, loadSave());
    return { az, cok: { sahip: !!save.ownedGuns.yildiz, para: save.para, takili: equippedGun() } };
  });
  sina('2) yetersiz parayla alınmaz; yeterli parayla alınır, bakiye düşer, takılır ve kayıttan yüklenir', () => {
    assert.equal(alim.az.sahip, false);
    assert.equal(alim.az.para, 24999);
    assert.equal(alim.cok.sahip, true);
    assert.equal(alim.cok.para, 0);
    assert.equal(alim.cok.takili, 'yildiz');
  });

  // 3) Takma: başka silaha geç, sonra yeniden yıldızı tak
  const takma = await pa.evaluate(() => {
    startGame();
    save.ownedGuns.lazer = true; save.para = 0;
    equipGun('lazer'); const once = { t: equippedGun(), p: game.player && game.player.gun };
    equipGun('yildiz'); const sonra = { t: equippedGun(), p: game.player && game.player.gun };
    return { once, sonra };
  });
  sina('3) efsane silah takılır (save + oyuncu)', () => {
    assert.equal(takma.once.t, 'lazer', JSON.stringify(takma));
    assert.equal(takma.sonra.t, 'yildiz');
    if (takma.sonra.p !== undefined) assert.equal(takma.sonra.p, 'yildiz');
  });
  await pa.close();

  // 4) Yıldız: her 5. atışta büyük alan yıldızı, diğerleri normal
  const py = await sayfa();
  const yildiz = await py.evaluate(() => {
    startGame(); game.paused = true;
    game.player.gun = 'yildiz';
    game.projectiles = [];
    const hedef = { x: game.player.x + 100, y: game.player.y };
    for (let i = 0; i < 5; i++) fireProjectile(hedef);
    return game.projectiles.map((p) => ({ buyuk: !!p.buyukYildiz, alan: p.alan || 0, dmg: p.dmg }));
  });
  sina('4) yıldız her 5. atışta büyük patlayan yıldız fırlatır', () => {
    assert.equal(yildiz.length, 5);
    assert.deepEqual(yildiz.slice(0, 4).map((p) => p.buyuk), [false, false, false, false]);
    assert.equal(yildiz[4].buyuk, true);
    assert.ok(yildiz[4].alan > 0);
    assert.ok(yildiz[4].dmg > yildiz[0].dmg);
  });
  await py.close();

  // 5) Ejder: yanma 1,5 sn boyunca 0,5 sn'de bir ekstra hasar
  const pe = await sayfa();
  const ejder = await pe.evaluate(() => {
    startGame(); game.paused = true;
    game.player.gun = 'ejder';
    game.player.range = 0; game.lastFire = performance.now() + 1e9;
    game.projectiles = []; game.ghosts = []; game.particles = [];
    const now = performance.now();
    const g = { x: game.player.x + 60, y: game.player.y, r: 22, hp: 50, maxHp: 50, size: 40, speed: 0, nextSound: now + 1e9 };
    game.ghosts.push(g);
    const hedef = { x: g.x, y: g.y };
    fireProjectile(hedef);
    const yaki = !!game.projectiles[0].yaki;
    const p = game.projectiles[0];
    p.x = g.x; p.y = g.y; p.vx = 0; p.vy = 0; // hemen çarpışsın
    const hp0 = g.hp;
    update(0.001, now);
    const ilk = { hp: g.hp, yaniyor: (g.burnUntil || 0) > now };
    update(0.001, now + 600);
    const t1 = g.hp;
    update(0.001, now + 1200);
    const t2 = g.hp;
    update(0.001, now + 1900);
    const bitmis = g.hp;
    return { yaki, hp0, ilk, t1, t2, bitmis };
  });
  sina("5) ejder yakar: 1,5 sn içinde 0,5 sn'de bir ekstra hasar", () => {
    assert.equal(ejder.yaki, true);
    assert.equal(ejder.ilk.yaniyor, true);
    assert.ok(ejder.t1 < ejder.ilk.hp, 'ilk yanma tiki gelmedi');
    assert.ok(ejder.t2 < ejder.t1, 'ikinci yanma tiki gelmedi');
    assert.equal(ejder.bitmis, ejder.t2, '1,5 sn sonra yanma bitmeli');
  });
  await pe.close();

  // 6) Gökkuşağı: üç hayaleti deler
  const pg = await sayfa();
  const gok = await pg.evaluate(() => {
    startGame(); game.paused = true;
    game.player.gun = 'gokkusagi';
    game.player.range = 0; game.lastFire = performance.now() + 1e9;
    game.projectiles = []; game.ghosts = []; game.particles = []; game.walls = []; game.waters = [];
    const now = performance.now();
    const mk = (dx) => ({ x: game.player.x + dx, y: game.player.y, r: 22, hp: 20, maxHp: 20, size: 40, speed: 0, nextSound: now + 1e9 });
    const g1 = mk(50), g2 = mk(120), g3 = mk(190);
    game.ghosts.push(g1, g2, g3);
    fireProjectile({ x: g1.x, y: g1.y });
    const p = game.projectiles[0];
    p.x = g1.x; p.y = g1.y; p.vx = 0; p.vy = 0;
    const hp = () => [g1.hp, g2.hp, g3.hp];
    update(0.001, now); const s1 = hp();
    game.projectiles[0].x = g2.x; update(0.001, now + 10); const s2 = hp();
    game.projectiles[0].x = g3.x; update(0.001, now + 20); const s3 = hp();
    return { s1, s2, s3, kaldi: game.projectiles.length };
  });
  sina('6) gökkuşağı ışını 3 hayaleti deler', () => {
    assert.ok(gok.s1[0] < 20, 'ilk hayalet vurulmadı: ' + JSON.stringify(gok));
    assert.ok(gok.s2[1] < 20, 'ikinci hayalet vurulmadı');
    assert.ok(gok.s3[2] < 20, 'üçüncü hayalet vurulmadı');
    assert.equal(gok.kaldi, 0, 'üç vuruştan sonra mermi bitmeli');
  });
  await pg.close();

  // 7) Alım kutlaması hatasız çalışır (parçacık + efekt)
  const pk = await sayfa();
  const kutlama = await pk.evaluate(() => {
    startGame(); game.paused = true;
    game.particles = []; game.effects = [];
    efsaneKutlama();
    return { parca: game.particles.length, efekt: game.effects.length };
  });
  sina('7) efsane alım kutlaması hatasız çalışır ve pırıltı üretir', () => {
    assert.ok(kutlama.parca > 0);
  });

  // 8) 3D açık ve kapalı: efsane silahlar hatasız çizilir
  const cizim = await pk.evaluate(async () => {
    startGame(); game.paused = true;
    const cv = document.createElement('canvas'); cv.width = 160; cv.height = 160;
    const ctx = cv.getContext('2d');
    const anahtarlar = ['yildiz', 'ejder', 'gokkusagi'];
    const sonuc = { kez: 0 };
    for (const k of anahtarlar) {
      if (window.UcAvci && window.UcAvci.hazir) {
        try {
          window.UcAvci.ciz(ctx, { charKey: 'kinkin', costumeIdx: 0, gunKey: k, size: 80, x: 80, y: 80, kimlik: 'test-' + k });
          sonuc.kez++;
        } catch (e) { sonuc.hata3d = String(e && e.message); }
      }
      try { drawCharacter(ctx, 'kinkin', 0, 80, 80, 80, 0, 0, 1, 0.5, k); sonuc.kez++; } catch (e) { sonuc.hata2d = String(e && e.message); }
      try { drawGunShape(ctx, k, 1); sonuc.kez++; } catch (e) { sonuc.hataKod = String(e && e.message); }
    }
    return sonuc;
  });
  sina('8) 3D açık/kapalı efsane silahlar hatasız çizilir', () => {
    assert.equal(cizim.hata3d, undefined);
    assert.equal(cizim.hata2d, undefined);
    assert.equal(cizim.hataKod, undefined);
    assert.ok(cizim.kez >= 6);
  });
  await pk.close();

  // 9) Efsane kostüm: her karakterde 4. kostüm 300 💎; parası yetmeyince alınmaz, yetince alınır ve seçilir
  const pc = await sayfa();
  const kostum = await pc.evaluate(() => {
    const dortler = Object.fromEntries(Object.keys(COSTUMES).map((k) => {
      const cos = COSTUMES[k][3] || {};
      return [k, { adet: COSTUMES[k].length, cost: cos.cost, efsane: !!cos.efsane }];
    }));
    save.elmas = 299;
    save.unlockedCostumes.kinkin = [0];
    save.selectedCostume.kinkin = 0;
    showShopTab('costumes');
    const bul = () => [...document.querySelectorAll('#shop-content .shop-item')]
      .find((e) => e.textContent.includes('Kinkin') && e.textContent.includes('💎 Efsane'));
    const ilkDugme = bul().querySelector('button');
    const ilk = { metin: ilkDugme.textContent, kapali: ilkDugme.disabled };
    ilkDugme.click();
    const yetersiz = { sahip: save.unlockedCostumes.kinkin.includes(3), elmas: save.elmas };
    save.elmas = 300;
    refreshShop();
    const item = bul();
    const dugme = item.querySelector('button');
    const yeter = { metin: dugme.textContent, kapali: dugme.disabled };
    dugme.click();
    const alindi = {
      sahip: save.unlockedCostumes.kinkin.includes(3), elmas: save.elmas,
      secili: save.selectedCostume.kinkin, rozet: item.textContent.includes('✨ Efsane'),
    };
    // Başka bir sahip olunan kostüme geç, sonra efsaneyi yeniden "Giy"
    save.unlockedCostumes.kinkin.push(1);
    save.selectedCostume.kinkin = 1;
    refreshShop();
    const geriDugme = bul().querySelector('button');
    const geriMetin = geriDugme.textContent;
    geriDugme.click();
    const geri = save.selectedCostume.kinkin;
    // Karakter ekranı: 4 çip, efsane rozeti ve (sahip olunmayınca) fiyat
    save.selectedChar = 'kinkin';
    save.unlockedCostumes.kinkin = [0];
    save.selectedCostume.kinkin = 0;
    openCharacters();
    karakterDetayAc('kinkin');
    const panel = document.getElementById('character-detail');
    const cipler = [...panel.querySelectorAll('.char-kostum')];
    const rozet = cipler[3] && cipler[3].querySelector('.efsane-rozet');
    const fiyat = cipler[3] && cipler[3].querySelector('.char-kostum-fiyat');
    karakterDetayKapat();
    return { dortler, ilk, yetersiz, yeter, alindi, geriMetin, geri,
      cipSayisi: cipler.length, rozet: rozet && rozet.textContent, fiyat: fiyat && fiyat.textContent };
  });
  sina('9) her karakterde 300 💎 efsane kostüm var; yetersizken alınmaz, yeterken alınır ve seçilir', () => {
    for (const [k, v] of Object.entries(kostum.dortler)) {
      assert.equal(v.adet, 4, `${k}: 4 kostüm olmalı`);
      assert.equal(v.cost, 300, `${k}: efsane kostüm 300 💎`);
      assert.equal(v.efsane, true, `${k}: efsane işareti`);
    }
    assert.ok(kostum.ilk.metin.includes('300'), kostum.ilk.metin);
    assert.equal(kostum.ilk.kapali, true);
    assert.equal(kostum.yetersiz.sahip, false);
    assert.equal(kostum.yetersiz.elmas, 299);
    assert.equal(kostum.yeter.kapali, false);
    assert.equal(kostum.alindi.sahip, true);
    assert.equal(kostum.alindi.elmas, 0);
    assert.equal(kostum.alindi.secili, 3);
    assert.equal(kostum.alindi.rozet, true);
    assert.equal(kostum.geriMetin.trim(), 'Giy');
    assert.equal(kostum.geri, 3);
    assert.equal(kostum.cipSayisi, 4);
    assert.equal((kostum.rozet || '').trim(), '✨ Efsane');
    assert.ok((kostum.fiyat || '').includes('300'), kostum.fiyat);
  });

  // 10) Efsane kostüm aurası 3D açık ve kapalıyken hatasız çizilir
  const aura = await pc.evaluate(() => {
    const cv = document.createElement('canvas'); cv.width = 220; cv.height = 220;
    const ctx = cv.getContext('2d');
    const sonuc = {};
    for (const d3 of [true, false]) {
      save.ayar3d = d3;
      try {
        efsaneAuraCiz(ctx, 110, 110, performance.now());
        drawCharacter(ctx, 'kinkin', 3, 110, 110, 80);
        sonuc[d3 ? 'uc' : 'iki'] = true;
      } catch (e) { sonuc.hata = String(e && e.message); }
    }
    // Gerçek oyun çizimi: kostüm giyiliyken render hatasız
    save.unlockedCostumes.kinkin = [0, 3];
    save.selectedCostume.kinkin = 3;
    save.selectedChar = 'kinkin';
    startGame(); game.paused = true;
    game.player.costumeIdx = 3;
    for (const d3 of [true, false]) {
      save.ayar3d = d3;
      try { render(); sonuc[d3 ? 'renderUc' : 'renderIki'] = true; } catch (e) { sonuc.renderHata = String(e && e.message); }
    }
    return sonuc;
  });
  sina('10) efsane kostüm aurası 3D açık ve kapalıyken hatasız çizilir', () => {
    assert.equal(aura.hata, undefined);
    assert.equal(aura.renderHata, undefined);
    assert.equal(aura.uc, true);
    assert.equal(aura.iki, true);
    assert.equal(aura.renderUc, true);
    assert.equal(aura.renderIki, true);
  });
  await pc.close();

  // 11) İkinci bot: yalnız satın alınınca ve yalnız tek kişilikte doğar; çevrimiçi mağazada kapalı
  const pd = await sayfa();
  const bot = await pd.evaluate(() => {
    save.extraBot = false;
    save.selectedChar = 'kinkin'; save.selectedCostume.kinkin = 0;
    startGame(); game.paused = true;
    const tek = { bot1: !!game.bot, bot2: !!game.bot2 };
    save.extraBot = true;
    startGame(); game.paused = true;
    updateBot(0.016, performance.now(), game.bot2);
    const iki = {
      bot1: !!game.bot, bot2: !!game.bot2,
      uzak: game.bot2 ? Math.hypot(game.bot2.x - game.player.x, game.bot2.y - game.player.y) : 1e9,
    };
    // Çevrimiçi: satın alınmış olsa da ikinci bot doğmaz, mağazada düğme kapalı
    online.mode = 'host';
    startGame(); game.paused = true;
    const cevrimici = { bot1: !!game.bot, bot2: !!game.bot2 };
    save.extraBot = false;
    showShopTab('upgrades');
    const bul = () => [...document.querySelectorAll('#shop-content .shop-item')]
      .find((e) => e.textContent.includes('İkinci Bot'));
    const cevrimiciDugme = bul().querySelector('button');
    const cevrimiciMagaza = { metin: cevrimiciDugme.textContent, kapali: cevrimiciDugme.disabled };
    online.mode = null;
    refreshShop();
    const tekDugme = bul().querySelector('button');
    const tekMagaza = { metin: tekDugme.textContent, kapali: tekDugme.disabled };
    return { tek, iki, cevrimici, cevrimiciMagaza, tekMagaza };
  });
  sina('11) ikinci bot yalnız satın alınınca ve yalnız tek kişilikte doğar', () => {
    assert.equal(bot.tek.bot1, true);
    assert.equal(bot.tek.bot2, false);
    assert.equal(bot.iki.bot1, true);
    assert.equal(bot.iki.bot2, true);
    assert.ok(bot.iki.uzak < 220, `ikinci bot oyuncunun yanında olmalı: ${bot.iki.uzak}`);
    assert.equal(bot.cevrimici.bot1, false);
    assert.equal(bot.cevrimici.bot2, false);
    assert.equal(bot.cevrimiciMagaza.metin.trim(), 'Yalnız tek kişilik');
    assert.equal(bot.cevrimiciMagaza.kapali, true);
    assert.ok(bot.tekMagaza.metin.includes('100000'), bot.tekMagaza.metin);
  });

  // 12) Fazladan kalp: loadSave sonrası azami kalp 4 olur (3 değil)
  const kalp = await pd.evaluate(() => {
    save.extraHeart = false; persistSave();
    Object.assign(save, loadSave());
    startGame(); game.paused = true;
    const uc = { hp: game.player.hp, max: game.player.maxHp };
    save.extraHeart = true; persistSave();
    const yuklenen = loadSave();
    Object.assign(save, yuklenen);
    startGame(); game.paused = true;
    const dort = { hp: game.player.hp, max: game.player.maxHp, kayit: !!yuklenen.extraHeart };
    return { varsayilan: defaultSave.extraHeart, uc, dort };
  });
  sina('12) fazladan kalp kayıttan yüklenince azami kalp 4 olur', () => {
    assert.equal(kalp.varsayilan, false);
    assert.deepEqual(kalp.uc, { hp: 3, max: 3 });
    assert.equal(kalp.dort.kayit, true);
    assert.deepEqual(kalp.dort, { hp: 4, max: 4, kayit: true });
  });
  await pd.close();

  sina('sayfa hatası yok', () => { assert.deepEqual(hatalar, [], hatalar.join(' / ')); });
} catch (e) {
  sonuclar.push(`✗ akış yarıda kaldı: ${e.message.split('\n')[0]}`);
} finally {
  await b.close();
  sunucu.close();
}
sonuclar.forEach((s) => console.log(s));
if (hatalar.length) console.log(hatalar.join('\n'));
const kalan = sonuclar.filter((s) => s.startsWith('✗'));
assert.equal(kalan.length, 0, `${kalan.length} sınama başarısız`);
console.log(`TAMAM: ${sonuclar.length} sınama`);
