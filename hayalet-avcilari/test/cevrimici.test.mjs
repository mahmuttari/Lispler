// Hayalet Avcıları: çevrimiçi oyunun uçtan uca sınaması (3.12.0'daki "oyun donuyor, oynanmıyor" düzeltmesi).
// Firebase emülatöründe (RTDB 9000 + Auth 9099) üç tarayıcı bağlamı: kurucu oda kurar, konuk listeden katılır,
// üçüncü oyuncu oyun sürerken kodla katılır. Sınananlar:
//   oda listesi dinleyicisi lobide kapanır · oyun her cihazda bir kez açılır (tek döngü) · istemcide hayalet sıçramaz
//   · para bir kez alınır · hayaletler konuğu da kovalar · herkes hayalet olunca tur biter, lobiye dönülür, yeni tur
//   başlar · host ayrılınca oda kapanmaz, en eski oyuncu host olur ve oyun sürer. 3.13.0'dan beri ölçümler arkadaş
//   dinleyicileri açıkken (üçü karşılıklı arkadaş) alınır; tur sonunda oyuncular kendi yakaladıkları hayalete (oda
//   kaydındaki av) göre sıralanır, her cihaz aynı sırayı görür, kupa yalnız birinciye (berabereyse hepsine) gider.
// Çalıştırma (Java 21, Playwright + Chromium gerekir):
//   cd hayalet-avcilari/firebase && npm ci && npm run test:cevrimici
// Emülatör zaten açıksa: node hayalet-avcilari/test/cevrimici.test.mjs
// SDK, firebase/node_modules/firebase'deki compat dosyalarından verilir (ağ gerekmez); kurallar firebase/database.rules.json.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const WWW = path.join(KOK, 'www');
const SDK = process.env.FIREBASE_SDK || path.join(KOK, 'firebase', 'node_modules', 'firebase');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const DB = process.env.FIREBASE_DATABASE_EMULATOR_HOST || '127.0.0.1:9000';
const AUTH = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
const NS = 'hayalet-avcilari-default-rtdb'; // game.js › RTDB_URL'nin alt alan adı
const { chromium } = await import(pathToFileURL(PW).href);

// Kurallar oyunun ad alanına yüklenir (emulators:exec yalnız projenin varsayılan ad alanına yükler)
const kural = await fetch(`http://${DB}/.settings/rules.json?ns=${NS}`, {
  method: 'PUT', headers: { Authorization: 'Bearer owner' },
  body: fs.readFileSync(path.join(KOK, 'firebase', 'database.rules.json'), 'utf8'),
});
assert.equal(kural.status, 200, `kurallar emülatöre yüklenemedi: ${await kural.text()}`);
await fetch(`http://${DB}/rooms.json?ns=${NS}`, { method: 'DELETE', headers: { Authorization: 'Bearer owner' } });

const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.m4a': 'audio/mp4' };
const sunucu = http.createServer((q, r) => {
  const f = path.join(WWW, decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html');
  if (!f.startsWith(WWW) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': TUR[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(0);
const adres = `http://127.0.0.1:${sunucu.address().port}/index.html`;

const [dbHost, dbPort] = DB.split(':');
const EMULATOR = `;(function(){var o=firebase.initializeApp;firebase.initializeApp=function(c,n){var a=o.call(this,c,n);
  a.database().useEmulator(${JSON.stringify(dbHost)},${Number(dbPort)});
  a.auth().useEmulator(${JSON.stringify('http://' + AUTH)},{disableWarnings:true});
  return a;};})();`;

async function sayfaAc(b, ad) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const p = await ctx.newPage();
  const hatalar = [];
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.route(/gstatic\.com\/firebasejs\/[^/]+\/(firebase-[a-z-]+\.js)/, async (r) => {
    const dosya = r.request().url().match(/(firebase-[a-z-]+\.js)/)[1];
    let govde = fs.readFileSync(path.join(SDK, dosya), 'utf8');
    if (dosya === 'firebase-app-compat.js') govde += EMULATOR;
    await r.fulfill({ status: 200, contentType: 'text/javascript', body: govde });
  });
  await p.route(/firestore\.googleapis\.com|googlesyndication|doubleclick/, (r) => r.abort());
  await p.addInitScript(() => { localStorage.setItem('hayaletAvcilariDil', 'tr'); localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9'); });
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForTimeout(300);
  await p.evaluate((ad) => {
    save.playerName = ad; persistSave(); try { localStorage.setItem(VERSION_KEY, APP_VERSION); } catch (_) {}
    // Ölçüm: oyun açılışları, oda listesi çizimleri ve istemcide kare başına hayalet sıçraması (kimliğe göre)
    window.__olc = { acilis: 0, liste: 0, sicrama: 0, enBuyuk: 0, kare: 0, acik: false };
    const sar = (ad, fn) => { const asil = window[ad]; window[ad] = function (...a) { fn(); return asil.apply(this, a); }; };
    sar('startGame', () => { __olc.acilis++; });
    sar('renderRoomList', () => { if (__olc.acik) __olc.liste++; });
    const onceki = new Map();
    const dongu = () => {
      if (__olc.acik && online.mode === 'client') {
        __olc.kare++;
        for (const g of game.ghosts) {
          const o = onceki.get(g._idx);
          if (o) { const d = Math.hypot(g.x - o.x, g.y - o.y); __olc.enBuyuk = Math.max(__olc.enBuyuk, d); if (d > 25) __olc.sicrama++; }
        }
        onceki.clear(); for (const g of game.ghosts) onceki.set(g._idx, { x: g.x, y: g.y });
      }
      requestAnimationFrame(dongu);
    };
    requestAnimationFrame(dongu);
  }, ad);
  return { ctx, p, hatalar };
}

// Oyuncu daire çizerek dolaşır ve ölmez (ölçüm süresince)
const dolas = (faz) => {
  const t0 = performance.now();
  window.__dolas = setInterval(() => {
    const a = (performance.now() - t0) / 1500 + faz;
    game.inputDir.x = Math.cos(a); game.inputDir.y = Math.sin(a * 0.7);
    if (game.player && !game.player.dead) { game.player.invuln = 2; game.player.hp = 3; }
  }, 100);
};
const bekle = (s, fn, arg, ms = 15000) => s.p.waitForFunction(fn, arg, { timeout: ms });
// Hayalet sayısını sabitler (havadaki mermi ya da 3 sn'lik vuruş penceresi ölümden sonra sayıyı değiştirmesin); null: çözer
const sayiSabitle = (s, n) => s.p.evaluate((n) => {
  if (n === null) { delete game.totalCaught; game.totalCaught = 0; return; }
  Object.defineProperty(game, 'totalCaught', { get: () => n, set: () => {}, configurable: true });
}, n);
// Oda kaydındaki hayalet sayıları (av) bu sayfaya ulaştı mı
const sayilarGeldi = (s, liste) => bekle(s, (l) => JSON.stringify(Object.values(online.cachedRoom.players).map((p) => p.av).sort((a, c) => a - c)) === l, JSON.stringify(liste));
// Tur sonu ekranındaki sıralama: "Ad:sayı" (+ ":🏆"), sıra yazısı ve kupa sayısı
const turSonuEkrani = (s) => s.p.evaluate(() => ({
  satirlar: [...document.querySelectorAll('#tur-siralama-liste li')].map((li) => `${li.querySelector('.ts-ad').textContent}:${li.querySelector('.ts-av').textContent}${li.querySelector('.ts-kupa') ? ':🏆' : ''}`),
  yazi: document.getElementById('gameover-rank').textContent,
  kupa: save.kupa || 0,
}));

// 3.13.0: oyun arkadaş dinleyicileri açıkken ölçülür. Herkes sahip yetkisiyle birbirinin arkadaşı yapılır; her sayfa
// diğerlerinin çevrimiçi durumunu (presence) görene kadar beklenir. Dönen dizi: sayfa başına "hepsini görüyor".
async function hepsiArkadas(sayfalar) {
  for (const s of sayfalar) await s.p.waitForFunction(() => typeof sosyal !== 'undefined' && sosyal.hazir && !!sosyal.uid, null, { timeout: 20000 });
  const kim = await Promise.all(sayfalar.map((s) => s.p.evaluate(() => ({ uid: sosyal.uid, ad: save.playerName }))));
  const yollar = {};
  for (const a of kim) for (const k of kim) if (a.uid !== k.uid) yollar[`users/${a.uid}/friends/${k.uid}`] = { name: k.ad, at: Date.now() - 1000 };
  const r = await fetch(`http://${DB}/.json?ns=${NS}`, { method: 'PATCH', headers: { Authorization: 'Bearer owner' }, body: JSON.stringify(yollar) });
  assert.equal(r.status, 200, `arkadaşlıklar yazılamadı: ${await r.text()}`);
  return Promise.all(sayfalar.map((s) => s.p.waitForFunction((n) => Object.keys(sosyal.durumlar).length >= n, kim.length - 1, { timeout: 20000 }).then(() => true, () => false)));
}

const sonuclar = [];
function sina(ad, fn) {
  try { fn(); sonuclar.push(`✓ ${ad}`); } catch (e) { sonuclar.push(`✗ ${ad}: ${e.message.split('\n')[0]}`); }
}

const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--disable-renderer-backgrounding', '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows'] });
let H, K, U;
try {
  H = await sayfaAc(b, 'Kurucu');
  K = await sayfaAc(b, 'Konuk');
  U = await sayfaAc(b, 'Üçüncü');
  for (const s of [H, K, U]) {
    const cdp = await s.ctx.newCDPSession(s.p);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 2 });
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 40, downloadThroughput: 2_000_000, uploadThroughput: 750_000 });
  }

  // 0) Arkadaş dinleyicileri açık: üçü birbirinin arkadaşı, her biri ötekilerin çevrimiçi durumunu görüyor
  const gorenler = await hepsiArkadas([H, K, U]);
  sina('arkadaş dinleyicileri açık (her oyuncu diğerlerinin çevrimiçi durumunu görüyor)', () => { assert.deepEqual(gorenler, [true, true, true]); });

  // 1) Oda kurulur; konuk listeden katılır; liste dinleyicisi lobide kapanır
  await H.p.evaluate(async () => { await openOnline(); openCreateRoom(); await submitCreateRoom(); });
  const oda = await H.p.evaluate(() => online.roomId);
  assert.match(oda || '', /^[A-HJKMNP-Z2-9]{6}$/, 'oda kurulamadı: ' + await H.p.evaluate(() => document.getElementById('online-status').textContent));
  const lobiKodu = await H.p.evaluate(() => document.getElementById('lobby-kod').textContent);
  await K.p.evaluate(async () => { await openOnline(); await openRoomList(); });
  await bekle(K, () => document.querySelector('#room-list .room-card button') && document.body.innerText.includes('Kurucu'));
  await K.p.evaluate(() => document.querySelector('#room-list .room-card button').click());
  await bekle(K, () => online.cachedRoom && online.cachedRoom.players[online.uid] && document.getElementById('screen-lobby').classList.contains('active'));
  const listeKapali = await K.p.evaluate(() => online._roomListRef === null);
  sina('lobide oda kodu görünür, liste dinleyicisi kapanır', () => { assert.equal(lobiKodu, oda); assert.ok(listeKapali); });

  // 2) Hazır → BAŞLAT: oyun her cihazda bir kez açılır
  await K.p.evaluate(async () => { await toggleReady(); });
  await bekle(H, () => document.getElementById('lobby-start-btn').style.display !== 'none');
  await H.p.evaluate(async () => { await startMpGame(); });
  await bekle(K, () => game.running && online.mode === 'client');
  await bekle(K, () => game.ghosts.length >= 2, null, 20000);
  await H.p.evaluate(`(${dolas.toString()})(0)`);
  await K.p.evaluate(`(${dolas.toString()})(2.5)`);
  for (const s of [H, K]) await s.p.evaluate(() => { __olc.acik = true; });

  // 3) Üçüncü oyuncu oyun sürerken kodla katılır
  await U.p.evaluate(async () => { await openOnline(); await openRoomList(); });
  await U.p.evaluate((kod) => { document.getElementById('room-code-input').value = kod.toLowerCase(); kodlaKatil(); }, oda);
  await bekle(U, () => game.running && online.mode === 'client' && game.ghosts.length > 0, null, 20000);
  await U.p.evaluate(`(${dolas.toString()})(4)`);
  await H.p.waitForTimeout(8000);
  for (const s of [H, K]) await s.p.evaluate(() => { __olc.acik = false; });
  const olc = {};
  for (const [ad, s] of [['kurucu', H], ['konuk', K]]) olc[ad] = await s.p.evaluate(() => ({ ...__olc, dongu: _donguNo }));
  sina('oyun her cihazda bir kez açılır (çift döngü yok)', () => {
    for (const ad of ['kurucu', 'konuk']) { assert.equal(olc[ad].acilis, 1, ad); assert.equal(olc[ad].dongu, 1, ad); }
  });
  sina('oyun sırasında oda listesi çizilmez', () => { assert.equal(olc.konuk.liste, 0); });
  sina(`istemcide hayalet sıçramaz (${olc.konuk.kare} kare, en büyük adım ${Math.round(olc.konuk.enBuyuk)} px)`, () => {
    assert.ok(olc.konuk.kare > 100, 'yeterli kare yok');
    assert.equal(olc.konuk.sicrama, 0);
  });
  sina('üçüncü oyuncu oyun sürerken kodla katıldı', () => {});
  const kovalanan = await H.p.evaluate(() => {
    const uzak = Object.values(online.remotePlayers).filter((rp) => !rp.dead);
    return game.ghosts.filter((g) => uzak.some((rp) => Math.hypot(g.x - rp.x, g.y - rp.y) < Math.hypot(g.x - game.player.x, g.y - game.player.y))).length;
  });
  sina('hayaletler yalnız host\'u değil diğer oyuncuları da kovalar', () => { assert.ok(kovalanan > 0, `${kovalanan}`); });

  // 4) Para bir kez alınır: herkes durur, konuk diğerlerinden en uzak köşeye geçer, host onun ayağına para koyar
  for (const s of [H, K, U]) await s.p.evaluate(() => { clearInterval(window.__dolas); game.inputDir.x = 0; game.inputDir.y = 0; });
  await K.p.evaluate(() => {
    const uzak = Object.values(online.remotePlayers);
    const koseler = [[200, 200], [game.worldW - 200, 200], [200, game.worldH - 200], [game.worldW - 200, game.worldH - 200]];
    const uzaklik = ([x, y]) => Math.min(...uzak.map((rp) => Math.hypot(rp.x - x, rp.y - y)));
    const [x, y] = koseler.sort((a, b) => uzaklik(b) - uzaklik(a))[0];
    const yer = freeSpot(x, y, 22); game.player.x = yer.x; game.player.y = yer.y;
  });
  await K.p.waitForTimeout(1500);
  // Yalnız bu para sayılır (çevredeki hayaletlerden düşen küçük paralar karışmasın): değeri 1000, alınışı sayılır
  await K.p.evaluate(() => {
    window.__buyuk = 0;
    const asil = collectPickup;
    window.collectPickup = (p) => { if (p.value === 1000) __buyuk++; return asil(p); };
  });
  await H.p.evaluate((uid) => { const k = online.remotePlayers[uid]; game.pickups.push({ x: k.sx, y: k.sy, kind: 'para', value: 1000, life: 12 }); }, await K.p.evaluate(() => online.uid));
  await K.p.waitForTimeout(3000);
  const alinan = await K.p.evaluate(() => __buyuk);
  const kalan = await H.p.evaluate(() => game.pickups.filter((p) => p.value === 1000).length);
  sina('para bir kez alınır, host\'ta silinir', () => { assert.equal(alinan, 1, `konuk ${alinan} kez aldı`); assert.equal(kalan, 0, `host'ta kalan ${kalan}`); });

  // 4b) Bir oyuncu (konuk) hayalet olur: oyun üç cihazda da akar (3.12.0'da hayalet ctx.filter ile çizildiği için
  //     kare 0,4–4 sn sürüyor, oyun donuyordu), host'tan durum gelmeye devam eder; sonraki bölümde konuk yeniden doğar
  const akis = (s, ms) => s.p.evaluate((ms) => new Promise((tamam) => {
    let durum = 0; const asil = window.durumGeldi;
    window.durumGeldi = function (...a) { durum++; return asil.apply(this, a); };
    const kare = []; const bas = performance.now();
    const d = (t) => {
      kare.push(t);
      if (t - bas < ms) { requestAnimationFrame(d); return; }
      window.durumGeldi = asil;
      const ara = kare.slice(1).map((x, i) => x - kare[i]).sort((a, b) => a - b);
      const sn = (kare[kare.length - 1] - kare[0]) / 1000;
      tamam({ fps: +(ara.length / sn).toFixed(1), p95: Math.round(ara[Math.floor(ara.length * 0.95)]), durumSn: +(durum / sn).toFixed(1) });
    };
    requestAnimationFrame(d);
  }), ms);
  await H.p.evaluate(`(${dolas.toString()})(0)`);
  await U.p.evaluate(`(${dolas.toString()})(4)`);
  await K.p.evaluate(() => { game.player.invuln = 0; game.player.hp = 1; damagePlayer(); });
  await H.p.waitForTimeout(800);
  const [ah, ak, au] = await Promise.all([akis(H, 3000), akis(K, 3000), akis(U, 3000)]);
  const oluDurum = {
    konukOlu: await K.p.evaluate(() => !!game.player.dead),
    hostGoruyor: await H.p.evaluate((uid) => !!(online.remotePlayers[uid] && online.remotePlayers[uid].dead), await K.p.evaluate(() => online.uid)),
    suruyor: await Promise.all([H, K, U].map((s) => s.p.evaluate(() => game.running && !!online.mode))),
  };
  sina(`biri hayalet olunca oyun akar (kurucu ${ah.fps} fps, hayalet konuk ${ak.fps} fps, üçüncü ${au.fps} fps)`, () => {
    assert.ok(oluDurum.konukOlu && oluDurum.hostGoruyor, 'konuk hayalet olmadı ya da host görmedi');
    assert.deepEqual(oluDurum.suruyor, [true, true, true], 'tur erken bitti');
    for (const [ad, v] of [['kurucu', ah], ['konuk', ak], ['üçüncü', au]]) {
      assert.ok(v.fps >= 30 && v.p95 <= 100, `${ad}: ${v.fps} fps, %95 kare ${v.p95} ms`);
    }
    for (const [ad, v] of [['konuk', ak], ['üçüncü', au]]) assert.ok(v.durumSn >= 5, `${ad}: saniyede ${v.durumSn} durum`);
  });
  await H.p.evaluate(() => nextLevel()); // bölüm temizlenince host'un yaptığı
  const dogdu = await bekle(K, () => !game.player.dead && game.player.hp === game.player.maxHp && game.level >= 2).then(() => true, () => false);
  sina('hayalet olan oyuncu sonraki bölümde yeniden doğar', () => { assert.ok(dogdu); });

  // 5) Herkes hayalet olunca tur biter; lobiye dönülür; yeni tur başlar ve hayaletler yeniden doğar. Sıralama: kurucu 5,
  //    konuk 9, üçüncü 2 hayalet — her cihaz aynı sırayı görür, kupa yalnız konuğa
  const kupaOnce = await Promise.all([H, K, U].map((s) => s.p.evaluate(() => save.kupa || 0)));
  for (const s of [H, K, U]) await s.p.evaluate(() => { clearInterval(window.__dolas); game.player.invuln = 0; game.player.hp = 1; damagePlayer(); });
  for (const [s, n] of [[H, 5], [K, 9], [U, 2]]) await sayiSabitle(s, n);
  const sayilar = await Promise.all([H, K, U].map((s) => sayilarGeldi(s, [2, 5, 9]).then(() => true, () => false)));
  const bitti = await Promise.all([H, K, U].map((s) => bekle(s, () => !game.running && document.getElementById('screen-gameover').classList.contains('active')).then(() => true, () => false)));
  const siralar = await Promise.all([H, K, U].map(turSonuEkrani));
  const sonEkran = await K.p.evaluate(() => ({
    baslik: document.getElementById('gameover-title').textContent,
    lobi: document.getElementById('btn-lobiye-don').style.display !== 'none',
    tekrar: document.getElementById('btn-tekrar').style.display !== 'none',
    durum: online.cachedRoom.status,
  }));
  sina('herkes hayalet olunca tur biter, sonuç ekranında "Lobiye Dön"', () => {
    assert.deepEqual(bitti, [true, true, true]);
    assert.equal(sonEkran.baslik, '🏁 Tur bitti!');
    assert.ok(sonEkran.lobi && !sonEkran.tekrar);
    assert.equal(sonEkran.durum, 'lobby');
  });
  sina('tur sonunda herkes aynı sıralamayı görür (kendi hayaletine göre), kupa yalnız birinciye', () => {
    assert.deepEqual(sayilar, [true, true, true], 'hayalet sayıları odaya yazılmadı');
    for (const e of siralar) assert.deepEqual(e.satirlar, ['Konuk:9 👻:🏆', 'Kurucu:5 👻', 'Üçüncü:2 👻']);
    assert.deepEqual(siralar.map((e) => e.yazi), ['🥈 Turu 2. bitirdin!', '🥇 Turu 1. bitirdin! 🏆 Kupa senin!', '🥉 Turu 3. bitirdin!']);
    assert.deepEqual(siralar.map((e, i) => e.kupa - kupaOnce[i]), [0, 1, 0]);
  });
  // Kural: oyuncu kaydındaki av yalnız 0–100000 arası sayı olabilir
  const avKurali = await K.p.evaluate(async () => {
    const yol = `rooms/${online.roomId}/players/${online.uid}`;
    return { metin: (await rtdb.patch(yol, { av: 'çok' })) === null, eksi: (await rtdb.patch(yol, { av: -1 })) === null,
      buyuk: (await rtdb.patch(yol, { av: 100001 })) === null, sayi: (await rtdb.patch(yol, { av: 9 })) !== null };
  });
  sina('kural: hayalet sayısı (av) yalnız 0–100000 arası sayı', () => { assert.deepEqual(avKurali, { metin: true, eksi: true, buyuk: true, sayi: true }); });
  for (const s of [H, K, U]) await sayiSabitle(s, null);
  for (const s of [H, K, U]) await s.p.evaluate(() => lobiyeDon());
  for (const s of [K, U]) await s.p.evaluate(async () => { await toggleReady(); });
  await bekle(H, () => document.getElementById('lobby-start-btn').style.display !== 'none');
  await H.p.evaluate(async () => { await startMpGame(); });
  const ikinci = await Promise.all([K, U].map((s) => bekle(s, () => game.running && online.mode === 'client' && game.ghosts.length > 0, null, 20000).then(() => true, () => false)));
  const ikinciDurum = await K.p.evaluate(() => ({ olu: !!game.player.dead, can: game.player.hp, dongu: _donguNo }));
  sina('ikinci tur başlar, oyuncular canlı, yine tek döngü', () => {
    assert.deepEqual(ikinci, [true, true]);
    assert.equal(ikinciDurum.olu, false); assert.equal(ikinciDurum.can, 3); assert.equal(ikinciDurum.dongu, 2);
  });

  // 6) Host ayrılır: oda kapanmaz, en eski oyuncu (konuk) host olur, hayaletler hareket etmeye devam eder
  for (const s of [K, U]) await s.p.evaluate(() => { window.__olumsuz = setInterval(() => { if (game.player) { game.player.invuln = 2; game.player.hp = 3; } }, 100); });
  await H.p.evaluate(() => quitToMenu());
  const devir = await bekle(K, () => online.mode === 'host' && online.isHost).then(() => true, () => false);
  await K.p.waitForTimeout(500);
  const ilk = await K.p.evaluate(() => game.ghosts.map((g) => [g.id, g.x, g.y]));
  await K.p.waitForTimeout(1500);
  const son = await K.p.evaluate(() => game.ghosts.map((g) => [g.id, g.x, g.y]));
  const hareket = son.filter(([id, x, y]) => { const o = ilk.find((z) => z[0] === id); return o && Math.hypot(o[1] - x, o[2] - y) > 5; }).length;
  const ucuncuGoruyor = await bekle(U, () => game.running && online.mode === 'client' && performance.now() - online.sonDurum < 1000).then(() => true, () => false);
  const odaVar = await K.p.evaluate(async () => (await rtdb.get(`rooms/${online.roomId}/hostUid`)) === online.uid);
  sina('host ayrılınca konuk host olur, oyun sürer, üçüncü oyuncu yeni host\'u izler', () => {
    assert.ok(devir); assert.ok(odaVar); assert.ok(ucuncuGoruyor);
    assert.ok(hareket > 0, `hareket eden hayalet ${hareket}/${son.length}`);
  });

  // 7) İki kişi kalınca berabere birinci (ikisi de 4 hayalet): ikisi de kupa alır
  const kupaOnce2 = await Promise.all([K, U].map((s) => s.p.evaluate(() => save.kupa || 0)));
  for (const s of [K, U]) await s.p.evaluate(() => { clearInterval(window.__olumsuz); game.player.invuln = 0; game.player.hp = 1; damagePlayer(); });
  for (const s of [K, U]) await sayiSabitle(s, 4);
  const sayilar2 = await Promise.all([K, U].map((s) => sayilarGeldi(s, [4, 4]).then(() => true, () => false)));
  const bitti2 = await Promise.all([K, U].map((s) => bekle(s, () => !game.running && document.getElementById('screen-gameover').classList.contains('active')).then(() => true, () => false)));
  const berabere = await Promise.all([K, U].map(turSonuEkrani));
  sina('berabere birincilerin ikisi de kupa alır', () => {
    assert.deepEqual([sayilar2, bitti2], [[true, true], [true, true]]);
    for (const e of berabere) {
      assert.deepEqual([...e.satirlar].sort(), ['Konuk:4 👻:🏆', 'Üçüncü:4 👻:🏆']);
      assert.equal(e.yazi, '🥇 Turu 1. bitirdin! 🏆 Kupa senin!');
    }
    assert.deepEqual(berabere.map((e, i) => e.kupa - kupaOnce2[i]), [1, 1]);
  });

  sina('sayfa hatası yok', () => {
    const tum = [...H.hatalar.map((x) => 'kurucu: ' + x), ...K.hatalar.map((x) => 'konuk: ' + x), ...U.hatalar.map((x) => 'üçüncü: ' + x)];
    assert.deepEqual(tum, []);
  });
} catch (e) {
  sonuclar.push(`✗ akış yarıda kaldı: ${e.message.split('\n')[0]}`);
} finally {
  await b.close();
  sunucu.close();
}
console.log(sonuclar.join('\n'));
const basarisiz = sonuclar.filter((s) => s.startsWith('✗')).length;
console.log(basarisiz ? `\n${basarisiz} sınama başarısız` : '\nçevrimiçi: hepsi geçti');
process.exit(basarisiz ? 1 : 0);
