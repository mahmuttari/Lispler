// Hayalet Avcıları: çizim hızı sınaması — "çevrimiçi oyunda biri ölünce oyun donuyor" hatası (3.12.1).
// Hayalet olan oyuncu (kendi ekranında ve diğer oyuncunun ekranında) ve vurulan Bot eskiden ctx.filter ile çiziliyordu;
// tuval filtresi çizimin onlarca işleminin her birine ayrı uygulandığı için kare 0,4–4 sn sürüyordu. Bu test Firebase'siz
// bir sayfada önce sürekli vurulan Bot'u (tek kişilik), sonra hayalet olan yerel ve uzak oyuncuyu çizdirir; CPU 4 kat
// yavaşken kare hızını ölçer. 3.14.0: Dünya Turu'nda üç ailede (FR · K, KE · SV, JP · DA) ülkenin müziği çalarken,
// zemin deseni açık, Bot ve hayaletler sahnedeyken de aynı eşikler aranır.
// Çalıştırma (Playwright + Chromium gerekir):  node hayalet-avcilari/test/cizim.test.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WWW = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);
const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg' };
const sunucu = http.createServer((q, r) => {
  const f = path.join(WWW, decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html');
  if (!f.startsWith(WWW) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': TUR[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(0);
const adres = `http://127.0.0.1:${sunucu.address().port}/index.html`;

const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--autoplay-policy=no-user-gesture-required'] });
const sonuc = {};
try {
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const hatalar = [];
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.route(/gstatic\.com|googleapis|firebase/, (r) => r.abort()); // ağsız
  await p.addInitScript(() => { localStorage.setItem('hayaletAvcilariDil', 'tr'); localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9'); localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1'); });
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForTimeout(300);
  const cdp = await p.context().newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const olc = (ms) => p.evaluate((ms) => new Promise((tamam) => {
    const kare = []; const bas = performance.now();
    const d = (t) => { kare.push(t); if (t - bas < ms) requestAnimationFrame(d); else {
      const ara = kare.slice(1).map((x, i) => x - kare[i]).sort((a, c) => a - c);
      tamam({ fps: +(ara.length / ((kare[kare.length - 1] - kare[0]) / 1000)).toFixed(1), p95: Math.round(ara[Math.floor(ara.length * 0.95)]) });
    } };
    requestAnimationFrame(d);
  }), ms);
  // Makine tabanı: ölçülen sahneden hemen önce, aynı sayfada oyun DURAKLATILIP 1 sn örneklenir (duraklatılmış oyun da
  // çizilir; yalnız update, vurma parlaması ve çarpışmalar durur). Yüklü bir makinede eşikler yalnız makinenin o anki
  // gücüne göre düşer; sağlıklı makinede (taban ≥ 50 fps) eski katılık korunur: fps ≥ 30, %95 kare ≤ 100 ms.
  const tabanOlc = async (ms = 1000) => {
    const onceki = await p.evaluate(() => { const o = game.paused; game.paused = true; return o; });
    try { return await olc(ms); } finally { await p.evaluate((o) => { game.paused = o; }, onceki); }
  };
  // Tek kişilik: Bot sürekli vuruluyor (her vuruşta 0,25 sn parlar)
  await p.evaluate(() => { save.playerName = 'Defne'; persistSave(); startGame(); game.player.invuln = 1e9; });
  await p.waitForTimeout(500);
  sonuc.botVar = await p.evaluate(() => !!game.bot);
  sonuc.botNormal = await olc(3000);
  sonuc.tabanBot = await tabanOlc(1000);
  await p.evaluate(() => { window.__parla = setInterval(() => { if (game.bot) game.bot.hitFlash = 0.25; }, 50); });
  sonuc.botParliyor = await olc(3000);
  await p.evaluate(() => clearInterval(window.__parla));
  // Çevrimiçi host gibi: yerel oyuncu ve iki uzak oyuncu; ağ yok (oda kimliği yok, yazım yapılmaz)
  await p.evaluate(() => {
    online.mode = 'host'; online.uid = 'ben'; // startMpGameClient gibi: kip önce, böylece Bot doğmaz
    startGame();
    const { x, y } = game.player;
    online.remotePlayers = {
      k1: { name: 'Ayşe', charKey: 'silsen', costumeIdx: 0, hp: 3, maxHp: 3, dead: false, x: x + 70, y: y + 10 },
      k2: { name: 'Can', charKey: 'kornet', costumeIdx: 0, hp: 0, maxHp: 3, dead: false, x: x - 70, y: y - 10 },
    };
    game.player.invuln = 1e9;
  });
  sonuc.tabanCanli = await tabanOlc(1000);
  sonuc.canli = await olc(3000);
  // İkisi hayalet olur: yerel oyuncu ve bir uzak oyuncu (diğer uzak oyuncu canlı, tur sürer)
  await p.evaluate(() => { online.remotePlayers.k2.dead = true; game.player.hp = 0; game.player.dead = true; });
  sonuc.tabanHayalet = await tabanOlc(1000);
  sonuc.hayalet = await olc(3000);
  // Dünya Turu, tek kişilik: ülkenin döngü müziği çalarken, Bot ve en az üç hayalet sahnede. Oyuncu daire çizerek
  // dolaşır: kamera kesirli piksel konumlarından geçer (zemin deseni piksele hizalı değilse her karede süzgeçle taranır)
  await p.evaluate(() => { online.mode = null; online.uid = null; online.remotePlayers = {}; endGame(false); });
  sonuc.tur = {};
  for (const kod of ['FR', 'KE', 'JP']) {
    await p.evaluate((kod) => { startGame({ tur: true, ulke: ulkeKodla(kod).sira }); game.player.invuln = 1e9; }, kod);
    await p.waitForFunction(() => muzikDurumu().calan === 'dongu' && game.ghosts.length >= 3, null, { timeout: 30000 });
    const once = await p.evaluate(() => {
      const t0 = performance.now(), dpr = window.devicePixelRatio || 1;
      window.__kamera = { x: game.camera.x, y: game.camera.y, kesirli: 0 };
      window.__dolas = setInterval(() => {
        const a = (performance.now() - t0) / 1500;
        game.inputDir.x = Math.cos(a); game.inputDir.y = Math.sin(a * 0.7);
        if (Math.abs(game.camera.x * dpr - Math.round(game.camera.x * dpr)) > 0.05) __kamera.kesirli++;
      }, 50);
      return { kod: turUlkesi().kod, aile: turUlkesi().aile, calan: muzikDurumu().calan, bot: !!game.bot,
        hayalet: game.ghosts.length, zemin: !!(_turZemini && _turZemini.desen) };
    }, kod);
    const taban = await tabanOlc(1000);
    const kare = await olc(3000);
    const kamera = await p.evaluate(() => {
      clearInterval(window.__dolas); game.inputDir.x = 0; game.inputDir.y = 0;
      return { yol: Math.round(Math.hypot(game.camera.x - __kamera.x, game.camera.y - __kamera.y)), kesirli: __kamera.kesirli };
    });
    sonuc.tur[kod] = { ...once, ...kare, kamera, taban };
  }
  await p.evaluate(() => { endGame(false); turMuzigiSondur(0); });
  // Tablet (800×1280; tuval dönüşümü dpr × 1,35): kamera kayarken Dünya Turu zemini (KE) kare hızını düşürmez. Tablette
  // oyun başsız Chromium'da 30 fps'in altında kalabildiği için eşik orandır: aynı sahnede zeminli ve zeminsiz (ızgara)
  // pencereler sırayla ölçülür (hayaletler zamanla çoğalır, sıra iki yanı eşit etkiler). Zemin deseni tuval ölçeğine
  // hizasızken dpr 2'de zeminli 7, zeminsiz 13 fps idi.
  sonuc.tablet = {};
  for (const dpr of [1, 2]) {
    const t = await b.newPage({ viewport: { width: 800, height: 1280 }, deviceScaleFactor: dpr });
    t.on('pageerror', (e) => hatalar.push(e.message));
    await t.route(/gstatic\.com|googleapis|firebase/, (r) => r.abort());
    await t.addInitScript(() => { localStorage.setItem('hayaletAvcilariDil', 'tr'); localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9'); localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1'); });
    await t.goto(adres, { waitUntil: 'load' });
    await t.waitForTimeout(300);
    await (await t.context().newCDPSession(t)).send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const dolasOlc = (ms) => t.evaluate((ms) => new Promise((tamam) => {
      const t0 = performance.now(), kare = [];
      const dolas = setInterval(() => { const a = (performance.now() - t0) / 1500; game.inputDir.x = Math.cos(a); game.inputDir.y = Math.sin(a * 0.7); }, 50);
      const d = (z) => { kare.push(z); if (z - t0 < ms) requestAnimationFrame(d); else {
        clearInterval(dolas); game.inputDir.x = 0; game.inputDir.y = 0;
        tamam(+((kare.length - 1) / ((kare[kare.length - 1] - kare[0]) / 1000)).toFixed(1));
      } };
      requestAnimationFrame(d);
    }), ms);
    await t.evaluate(() => { save.playerName = 'Defne'; persistSave(); startGame({ tur: true, ulke: ulkeKodla('KE').sira }); game.player.invuln = 1e9; });
    await t.waitForFunction(() => game.ghosts.length >= 3, null, { timeout: 30000 });
    const zeminli = [], zeminsiz = [];
    for (let i = 0; i < 2; i++) {
      zeminli.push(await dolasOlc(1500));
      await t.evaluate(() => { window.__zemin = turZeminCiz; window.turZeminCiz = () => false; });
      zeminsiz.push(await dolasOlc(1500));
      await t.evaluate(() => { window.turZeminCiz = __zemin; });
    }
    const ort = (a) => +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1);
    const zemin = await t.evaluate(() => ({ olcek: +game.ctx.getTransform().a.toFixed(2), hizali: !!(_turZemini && _turZemini.hizali) }));
    await t.evaluate(() => { endGame(false); turMuzigiSondur(0); });
    await t.close();
    sonuc.tablet[dpr] = { zeminli: ort(zeminli), zeminsiz: ort(zeminsiz), ...zemin };
  }
  sonuc.hatalar = hatalar;
} finally {
  await b.close();
  sunucu.close();
}
console.log(JSON.stringify(sonuc));
// Sağlıklı makinede (duraklatılmış oyun ≥ 55 fps) eski katılık aynen: fps ≥ 30 ve %95 kare ≤ 100 ms. Yüklü makinede eşik
// tabana göre iner. Çalışan sahne (update, kamera kayması, hayaletler) duraklatılmış kareden ölçülen ~2 kat pahalıdır
// (0,45-0,55), bu yüzden orantı 0,4'tür; asıl gerileme korumaları aşağıdaki göreli denetimlerdir (Bot parlaması ≥ 0,8 × normal,
// hayalet ≥ 0,8 × canlı).
const esik = (t) => ({ fps: t.fps >= 55 ? 30 : Math.min(30, 0.4 * t.fps), p95: Math.max(100, 2.5 * t.p95) });
assert.deepEqual(sonuc.hatalar, [], 'sayfa hatası');
assert.ok(sonuc.botVar, 'tek kişilik oyunda Bot yok');
const esikBot = esik(sonuc.tabanBot);
assert.ok(sonuc.botParliyor.fps >= esikBot.fps && sonuc.botParliyor.p95 <= esikBot.p95,
  `vurulan Bot çizilirken kare hızı ${sonuc.botParliyor.fps} fps, %95 kare ${sonuc.botParliyor.p95} ms (normalde ${sonuc.botNormal.fps} fps; taban ${sonuc.tabanBot.fps} fps / ${sonuc.tabanBot.p95} ms → eşik ${esikBot.fps} / ${esikBot.p95})`);
assert.ok(sonuc.botParliyor.fps >= 0.8 * sonuc.botNormal.fps,
  `vurulan Bot normalden yavaş: ${sonuc.botParliyor.fps} < 0,8 × ${sonuc.botNormal.fps} fps`);
const esikCanli = esik(sonuc.tabanCanli);
assert.ok(sonuc.canli.fps >= esikCanli.fps, `canlıyken kare hızı düşük: ${sonuc.canli.fps} fps (taban ${sonuc.tabanCanli.fps} → eşik ${esikCanli.fps})`);
const esikHayalet = esik(sonuc.tabanHayalet);
assert.ok(sonuc.hayalet.fps >= esikHayalet.fps && sonuc.hayalet.p95 <= esikHayalet.p95,
  `hayalet olan oyuncu çizilirken kare hızı ${sonuc.hayalet.fps} fps, %95 kare ${sonuc.hayalet.p95} ms (canlıyken ${sonuc.canli.fps} fps; taban ${sonuc.tabanHayalet.fps} fps / ${sonuc.tabanHayalet.p95} ms → eşik ${esikHayalet.fps} / ${esikHayalet.p95})`);
assert.ok(sonuc.hayalet.fps >= 0.8 * sonuc.canli.fps,
  `hayalet çizimi canlıdan yavaş: ${sonuc.hayalet.fps} < 0,8 × ${sonuc.canli.fps} fps`);
for (const [kod, v] of Object.entries(sonuc.tur)) {
  assert.equal(v.kod, kod, `Dünya Turu ${kod} yerine ${v.kod} ülkesinde`);
  assert.ok(v.calan === 'dongu' && v.bot && v.hayalet >= 3 && v.zemin,
    `Dünya Turu ${kod}: ölçüm başında müzik ${v.calan}, Bot ${v.bot}, ${v.hayalet} hayalet, zemin deseni ${v.zemin}`);
  assert.ok(v.kamera.yol > 50 && v.kamera.kesirli > 5, `Dünya Turu ${kod}: kamera kaymadı (${JSON.stringify(v.kamera)})`);
  const esikTur = esik(v.taban);
  assert.ok(v.fps >= esikTur.fps && v.p95 <= esikTur.p95, `Dünya Turu ${kod} (${v.aile}) kamera kayarken kare hızı ${v.fps} fps, %95 kare ${v.p95} ms (taban ${v.taban.fps} fps / ${v.taban.p95} ms → eşik ${esikTur.fps} / ${esikTur.p95})`);
}
for (const [dpr, v] of Object.entries(sonuc.tablet)) {
  assert.ok(v.hizali, `tablet dpr ${dpr}: zemin deseni tuval ölçeğine (${v.olcek}) hizalı değil`);
  assert.ok(v.zeminli >= 0.85 * v.zeminsiz, `tablet dpr ${dpr} (ölçek ${v.olcek}): Dünya Turu KE zeminli ${v.zeminli} fps, zeminsiz ${v.zeminsiz} fps`);
}
console.log('TAMAM: hayalet olan oyuncu ve vurulan Bot kare hızını düşürmüyor; Dünya Turu FR, KE, JP müzik çalarken akıyor; tablette zemin deseni kare hızını düşürmüyor');
