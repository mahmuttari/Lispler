// Hayalet Avcıları: ekonomi ve oyun akışı düzeltmeleri — çevrimdışı sınama.
// Atış hızı yükseltmesi, duraklatmada sayaçlar, menüye dönüşte kazanç, çevrimiçi kayıt,
// bölüm geçişi jetonu ve uçak geçişinde hasar koruması sınanır. Çalıştırma: node test/akis-duzeltme.test.mjs
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
  await p.waitForFunction(() => typeof startGame === 'function' && typeof oyunSaatiniKaydir === 'function' &&
    typeof flushOnlineRewards === 'function' && typeof computeStats === 'function');
  await p.evaluate(() => {
    window.__hazir = (secenek) => {
      startGame(secenek); game.paused = false; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9; game.bot = null;
      game.ghosts = []; game.pickups = []; game.projectiles = []; game.enemyProjectiles = []; game.effects = [];
      game.player.dead = false; game.player.invuln = 0; game.player.hp = 3; game.player.maxHp = 3;
      game.levelTransitioning = false; game.bossDefeated = false;
      return game;
    };
    window.__hayalet = (dx = 100, hp = 100) => {
      const g = { x: game.player.x + dx, y: game.player.y, r: 22, speed: 0, hp, maxHp: hp, size: 40, frozenUntil: 0, nextShot: performance.now() + 9000 };
      game.ghosts = [g]; return g;
    };
  });

  // 1) Atış hızı: her karakterde 0..10 arası her seviye gecikmeyi düşürür; 10. seviye 150 ms
  const atis = await p.evaluate(() => {
    const sonuc = {};
    for (const k of Object.keys(CHARACTERS)) {
      const d = [];
      save.upgradesByChar[k] = { speed: 0, damage: 0, fireRate: 0, range: 0 };
      for (let lv = 0; lv <= 10; lv++) { save.upgradesByChar[k].fireRate = lv; d.push(computeStats(k).fireDelay); }
      sonuc[k] = d;
    }
    return sonuc;
  });
  sina('atış hızı: her karakterde 0..10 her seviye gecikmeyi düşürür, 10. seviye 150 ms', () => {
    for (const k of Object.keys(atis)) {
      const d = atis[k];
      for (let i = 1; i < d.length; i++) assert.ok(d[i] < d[i - 1], `${k} sv${i}: ${d[i - 1]} → ${d[i]}`);
      assert.equal(d[10], 150, `${k} sv10: ${d[10]}`);
    }
  });

  // 2) Duraklatmada sayaçlar durur: kasırga, görünmezlik, güç, donma ve hayalet nextShot aynı kalır
  const duraklat = await p.evaluate(async () => {
    __hazir(); const g = __hayalet(100, 100);
    const stok = ensureAmmoStock(game.player.charKey); for (const k in WEAPONS) stok[k] = 3;
    useWeapon('kasirga'); useWeapon('gorunmez'); useWeapon('dondurma'); activatePower('kinkin');
    const kalan = () => ({
      kas: game.player.kasirgaUntil - performance.now(),
      inv: game.player.invisibleUntil - performance.now(),
      guc: game.player.power.expires - performance.now(),
      buz: g.frozenUntil - performance.now(),
      atis: g.nextShot - performance.now(),
    });
    pauseGame();
    const once = kalan();
    await new Promise((r) => setTimeout(r, 1500)); // gerçekten duraklatılmış gibi bekle
    resumeGame();
    const sonra = kalan();
    return { once, sonra, paused: game.paused };
  });
  sina('duraklatma: kasırga, görünmezlik, güç, donma ve nextShot süreleri korunur', () => {
    assert.equal(duraklat.paused, false);
    for (const k of ['kas', 'inv', 'guc', 'buz', 'atis']) {
      assert.ok(Math.abs(duraklat.sonra[k] - duraklat.once[k]) < 100, `${k}: ${duraklat.once[k]} → ${duraklat.sonra[k]}`);
    }
  });

  // 8) flushOnlineRewards Dünya Turu'nda bölüm rekorunu değiştirmez
  const rekor = await p.evaluate(() => {
    __hazir({ tur: true, ulke: 1 });
    save.highestLevel = 5; game.level = 40; game.runPara = 0; game.runElmas = 0; game.runZumrut = 0;
    flushOnlineRewards();
    return save.highestLevel;
  });
  sina('flushOnlineRewards: Dünya Turu bölüm rekorunu değiştirmez', () => { assert.equal(rekor, 5); });

  // 4) Menüye dönüş tek kişilik kazançları kaydeder, ikinci çağrı yeniden eklemez
  const cikis = await p.evaluate(() => {
    __hazir();
    save.para = 1000; save.elmas = 10; save.zumrut = 5;
    game.runPara = 123; game.runElmas = 2; game.runZumrut = 1;
    quitToMenu();
    const bir = { para: save.para, elmas: save.elmas, zumrut: save.zumrut };
    quitToMenu();
    const iki = { para: save.para, elmas: save.elmas, zumrut: save.zumrut };
    return { bir, iki };
  });
  sina('menüye dönüş: runPara/runElmas/runZumrut bir kez eklenir', () => {
    assert.equal(cikis.bir.para, 1123); assert.equal(cikis.bir.elmas, 12); assert.equal(cikis.bir.zumrut, 6);
    assert.deepEqual(cikis.iki, cikis.bir);
  });

  // 11) Bölüm geçişi jetonu: menüye dönüp hemen yeni oyun başlatınca yeni oyun 2. bölüme atlamaz
  const gecis = await p.evaluate(async () => {
    __hazir();
    game.bossDefeated = true; game.ghosts = []; game.levelTransitioning = false;
    update(0.016, performance.now()); // bölüm geçişi zamanlayıcısını kurar
    quitToMenu();
    __hazir();
    game.paused = false;
    await new Promise((r) => setTimeout(r, 2500));
    return { level: game.level, running: game.running };
  });
  sina('bölüm geçişi jetonu: yeni oyun 2. bölüme atlamaz', () => {
    assert.equal(gecis.running, true); assert.equal(gecis.level, 1);
  });

  // 18) Ülkeden ülkeye uçak geçişinde oyuncu hasar almaz
  const ucak = await p.evaluate(() => {
    __hazir({ tur: true, ulke: 1 });
    game._turGeciste = true; game.player.hp = 3; game.player.invuln = 0;
    damagePlayer();
    return game.player.hp;
  });
  sina('uçak geçişinde damagePlayer can düşürmez', () => { assert.equal(ucak, 3); });

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
