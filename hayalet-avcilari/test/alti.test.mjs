// Hayalet Avcıları: 6 kişilik çevrimiçi oda (3.12.2) — uçtan uca sınama ve ağ ölçümü.
// Önce kurallar konsolda henüz yayınlanmamış gibi (en çok 5 kişi) Oda Kur'un yine çalıştığı (oda 5 kişilik kurulur)
// sınanır. Sonra Firebase emülatöründe (RTDB 9000 + Auth 9099) altı tarayıcı bağlamı: kurucu Oda Kur ekranının
// varsayılanıyla (6) oda kurar, beş oyuncu kodla katılır, birlikte oynarlar. Kurucu ve bir konuk telefon gibi ölçülür
// (işlemci CPU kat yavaş, varsayılan 2; ekran yoğunluğu 2); diğer dördü küçük pencerede tam oyuncu olarak oynar. Sınananlar:
//   Oda Kur'da 2–6 düğmeleri, 6 seçili · altıncı oyuncu da katılır · altısı aynı oyunda · kare hızı ve host'tan gelen
//   durum · istemcide hayalet sıçramaz · biri hayalet olunca oyun akar. Oyuncu başına WebSocket trafiği (KB/sn) yazılır.
// Çalıştırma (Java 21, Playwright + Chromium gerekir):
//   cd hayalet-avcilari/firebase && npm ci && npm run test:alti
// Emülatör zaten açıksa: node hayalet-avcilari/test/alti.test.mjs   (ölçüm için: CPU=4 node …)
// --tur (3.14.0): oda Dünya Turu odası olarak Kenya'dan (KE · SV) kurulur; altısının Kenya'da oynadığı, ölçülen iki
// cihazda ülkenin müziğinin çaldığı sınanır ve kare hızı müzik çalarken aynı eşiklerle ölçülür.
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
const OLCUM_MS = 8000;
// Ölçülen iki cihazın işlemci yavaşlatması. 2 kat: cevrimici.test.mjs ile aynı. 4 katta altı tarayıcı 4 çekirdekli test
// makinesini paylaşınca kare hızı çalıştırmadan çalıştırmaya 26–41 arasında oynuyor (README › 3.12.2).
const CPU = Number(process.env.CPU || 2);
const TURDA = process.argv.includes('--tur');
const TUR_ULKE = 'KE';
const { chromium } = await import(pathToFileURL(PW).href);

// Kurallar oyunun ad alanına yüklenir (emulators:exec yalnız projenin varsayılan ad alanına yükler)
const KURALLAR = fs.readFileSync(path.join(KOK, 'firebase', 'database.rules.json'), 'utf8');
async function kurallariYukle(metin) {
  const r = await fetch(`http://${DB}/.settings/rules.json?ns=${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: metin });
  assert.equal(r.status, 200, `kurallar emülatöre yüklenemedi: ${await r.text()}`);
}
// 3.12.2'den önceki kurallar (en çok 5 kişi): konsolda henüz yayınlanmamış hâli
const SINIR = 'newData.isNumber() && newData.val() >= 2 && newData.val() <= 6';
assert.ok(KURALLAR.includes(SINIR), 'maxPlayers sınırı kurallarda bulunamadı');
const ESKI_KURALLAR = KURALLAR.replace(SINIR, SINIR.replace('<= 6', '<= 5'));
await kurallariYukle(KURALLAR);
await fetch(`http://${DB}/rooms.json?ns=${NS}`, { method: 'DELETE', headers: { Authorization: 'Bearer owner' } });

const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg' };
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

// olcum: telefon gibi ölçülen oyuncu (işlemci yavaşlatmalı, yoğunluk 2); değilse küçük pencerede oynayan oyuncu
async function sayfaAc(b, ad, olcum) {
  const ctx = await b.newContext(olcum
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true }
    : { viewport: { width: 320, height: 560 }, deviceScaleFactor: 1, hasTouch: true });
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
    // İstemcide kare başına hayalet sıçraması (kimliğe göre)
    window.__olc = { sicrama: 0, enBuyuk: 0, kare: 0, acik: false };
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
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 40, downloadThroughput: 2_000_000, uploadThroughput: 750_000 });
  if (olcum) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  // RTDB WebSocket çerçeveleri (metin JSON): ölçüm penceresinde gelen ve giden bayt
  const ag = { al: 0, ver: 0, acik: false };
  cdp.on('Network.webSocketFrameReceived', (e) => { if (ag.acik) ag.al += e.response.payloadData.length; });
  cdp.on('Network.webSocketFrameSent', (e) => { if (ag.acik) ag.ver += e.response.payloadData.length; });
  return { ad, ctx, p, hatalar, ag };
}

// Oyuncu daire çizerek dolaşır ve ölmez (ölçüm süresince)
const dolas = (faz) => {
  const t0 = performance.now();
  window.__dolas = setInterval(() => {
    const a = (performance.now() - t0) / 1500 + faz;
    game.inputDir.x = Math.cos(a); game.inputDir.y = Math.sin(a * 0.7);
    if (game.player && !game.player.dead && !window.__olsun) { game.player.invuln = 2; game.player.hp = 3; }
  }, 100);
};
const bekle = (s, fn, arg, ms = 15000) => s.p.waitForFunction(fn, arg, { timeout: ms });
// Kare hızı, %95 kare süresi ve saniyede host'tan gelen durum sayısı
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

const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--autoplay-policy=no-user-gesture-required', '--disable-renderer-backgrounding', '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows'] });
const hepsi = [];
try {
  const H = await sayfaAc(b, 'Kurucu', true);
  const K = await sayfaAc(b, 'Ayşe', true);
  const D = [];
  for (const ad of ['Can', 'Deniz', 'Ece', 'Fırat']) D.push(await sayfaAc(b, ad, false));
  hepsi.push(H, K, ...D);
  const konuklar = [K, ...D];

  // Arkadaş dinleyicileri açık: altısı birbirinin arkadaşı (her sayfada 5 durum dinleyicisi)
  const gorenler = await hepsiArkadas(hepsi);
  sina('arkadaş dinleyicileri açık (her oyuncu diğer beşinin çevrimiçi durumunu görüyor)', () => { assert.deepEqual(gorenler, hepsi.map(() => true)); });

  // 0) Kurallar konsolda henüz yayınlanmamışsa (en çok 5 kişi) Oda Kur yine çalışır: oda 5 kişilik kurulur
  await kurallariYukle(ESKI_KURALLAR);
  await H.p.evaluate(async () => { await openOnline(); openCreateRoom(); await submitCreateRoom(); });
  const eskiKuralla = await H.p.evaluate(() => ({
    oda: online.roomId, kapasite: online.cachedRoom && online.cachedRoom.maxPlayers, durum: document.getElementById('online-status').textContent,
  }));
  sina(`kurallar yayınlanmamışken oda 5 kişilik kurulur (${eskiKuralla.oda ? `oda ${eskiKuralla.kapasite} kişilik` : `kurulamadı: ${eskiKuralla.durum}`})`, () => {
    assert.match(eskiKuralla.oda || '', /^[A-HJKMNP-Z2-9]{6}$/);
    assert.equal(eskiKuralla.kapasite, 5);
  });
  if (eskiKuralla.oda) await H.p.evaluate(async () => { await leaveRoom(); });
  await kurallariYukle(KURALLAR);

  // 1) Oda Kur ekranında 2–6, varsayılan 6; oda 6 kişilik kurulur (--tur: Dünya Turu odası, Kenya'dan)
  await H.p.evaluate(async (tur) => {
    await openOnline(); openCreateRoom();
    if (tur) { const n = ulkeKodla(tur).sira; save.dunyaTuru = { acik: n, damgalar: {}, bitti: 0 }; persistSave(); odaKipiSec('tur'); odaUlkesiSec(n); }
  }, TURDA ? TUR_ULKE : null);
  const secim = await H.p.evaluate(() => ({
    dugmeler: [...document.querySelectorAll('.max-btn')].map((d) => Number(d.dataset.max)),
    secili: [...document.querySelectorAll('.max-btn.active')].map((d) => Number(d.dataset.max)),
  }));
  await H.p.evaluate(async () => { await submitCreateRoom(); });
  const oda = await H.p.evaluate(() => online.roomId);
  assert.match(oda || '', /^[A-HJKMNP-Z2-9]{6}$/, 'oda kurulamadı: ' + await H.p.evaluate(() => document.getElementById('online-status').textContent));
  const kapasite = await H.p.evaluate(() => online.cachedRoom.maxPlayers);
  if (TURDA) {
    const turOda = await H.p.evaluate(() => ({ tur: online.cachedRoom.tur, ulke: (turOdaUlkesi(online.cachedRoom) || {}).kod }));
    sina(`Dünya Turu odası ${TUR_ULKE}'dan kurulur (tur ${turOda.tur}, ülke ${turOda.ulke})`, () => {
      assert.deepEqual(turOda, { tur: true, ulke: TUR_ULKE });
    });
  }
  sina(`Oda Kur'da 2–6 düğmeleri, 6 seçili; oda 6 kişilik kurulur (${secim.dugmeler.join(' ')} · seçili ${secim.secili} · oda ${kapasite})`, () => {
    assert.deepEqual(secim.dugmeler, [2, 3, 4, 5, 6]);
    assert.deepEqual(secim.secili, [6]);
    assert.equal(kapasite, 6);
  });

  // 2) Beş oyuncu kodla katılır; altıncı oyuncu da girer, lobi 6/6
  const katildi = [];
  for (const s of konuklar) {
    await s.p.evaluate(async (kod) => {
      await openOnline(); await openRoomList();
      document.getElementById('room-code-input').value = kod; kodlaKatil();
    }, oda);
    katildi.push(await bekle(s, () => online.cachedRoom && online.cachedRoom.players[online.uid]
      && document.getElementById('screen-lobby').classList.contains('active')).then(() => true, () => false));
  }
  const altinci = await D[3].p.evaluate(() => ({ toast: document.getElementById('toast').textContent, ekran: document.querySelector('.screen.active').id }));
  sina(`beş oyuncu kodla katılır, altıncı oyuncu da girer (${katildi.filter(Boolean).length}/5; son oyuncu: ${altinci.ekran}${altinci.toast ? ', "' + altinci.toast + '"' : ''})`, () => {
    assert.deepEqual(katildi, [true, true, true, true, true]);
  });
  await bekle(H, () => Object.keys(online.cachedRoom.players).length === 6);
  const altLobi = await H.p.evaluate(() => ({
    baslik: document.getElementById('lobby-subtitle').textContent,
    satir: document.querySelectorAll('#lobby-players .lobby-player').length,
  }));
  sina(`lobide 6 oyuncu ("${altLobi.baslik}")`, () => {
    assert.equal(altLobi.satir, 6);
    assert.match(altLobi.baslik, /6\/6/);
  });

  // 3) Herkes hazır → BAŞLAT: altısı aynı oyunda
  for (const s of konuklar) await s.p.evaluate(async () => { await toggleReady(); });
  await bekle(H, () => document.getElementById('lobby-start-btn').style.display !== 'none');
  await H.p.evaluate(async () => { await startMpGame(); });
  const oyunda = await Promise.all(konuklar.map((s) => bekle(s, () => game.running && online.mode === 'client', null, 20000).then(() => true, () => false)));
  await bekle(K, () => game.ghosts.length >= 2, null, 20000);
  for (let i = 0; i < hepsi.length; i++) await hepsi[i].p.evaluate(`(${dolas.toString()})(${(i * 1.1).toFixed(2)})`);
  await H.p.waitForTimeout(2500);
  const takim = await Promise.all([H, K].map((s) => s.p.evaluate(() => ({
    uzak: Object.keys(online.remotePlayers).length,
    hud: document.querySelectorAll('#takim .takim-oyuncu').length,
  }))));
  sina(`altısı aynı oyunda (kurucu ${takim[0].uzak}, Ayşe ${takim[1].uzak} uzak oyuncu; takım göstergesinde ${takim[0].hud} satır)`, () => {
    assert.deepEqual(oyunda, [true, true, true, true, true]);
    for (const t of takim) { assert.equal(t.uzak, 5); assert.equal(t.hud, 6); }
  });
  if (TURDA) {
    const ulkeler = await Promise.all(hepsi.map((s) => s.p.evaluate(() => (game.dunyaTuru && turUlkesi() ? turUlkesi().kod : null))));
    const muzikler = await Promise.all([H, K].map((s) => s.p.waitForFunction((kod) => muzikDurumu().calan === 'dongu' && muzikDurumu().kod === kod,
      TUR_ULKE, { timeout: 30000 }).then(() => 'dongu', () => s.p.evaluate(() => muzikDurumu().calan))));
    sina(`altısı Dünya Turu'nda ${TUR_ULKE}'da; kurucu ve Ayşe'de ülkenin müziği çalıyor (${ulkeler.join(' ')} · müzik ${muzikler.join(' ')})`, () => {
      assert.deepEqual(ulkeler, hepsi.map(() => TUR_ULKE));
      assert.deepEqual(muzikler, ['dongu', 'dongu']);
    });
  }

  // 4) Altı kişiyle oyun akar (kurucu ve Ayşe işlemci yavaşlatmalı); ağ trafiği ölçülür
  for (const s of [H, K]) Object.assign(s.ag, { al: 0, ver: 0, acik: true });
  await K.p.evaluate(() => { __olc.acik = true; });
  const [ah, ak] = await Promise.all([akis(H, OLCUM_MS), akis(K, OLCUM_MS)]);
  for (const s of [H, K]) s.ag.acik = false;
  const sicrama = await K.p.evaluate(() => { __olc.acik = false; return { ...__olc }; });
  const kbsn = (s) => ({ al: +(s.ag.al / 1024 / (OLCUM_MS / 1000)).toFixed(1), ver: +(s.ag.ver / 1024 / (OLCUM_MS / 1000)).toFixed(1) });
  const ag = { kurucu: kbsn(H), ayse: kbsn(K) };
  sina(`altı kişiyle oyun akar${TURDA ? ` (Dünya Turu ${TUR_ULKE}, müzik çalarken)` : ''}, işlemci ${CPU} kat yavaş (kurucu ${ah.fps} fps %95 ${ah.p95} ms; Ayşe ${ak.fps} fps %95 ${ak.p95} ms, saniyede ${ak.durumSn} durum)`, () => {
    for (const [ad, v] of [['kurucu', ah], ['Ayşe', ak]]) assert.ok(v.fps >= 30 && v.p95 <= 100, `${ad}: ${v.fps} fps, %95 kare ${v.p95} ms`);
    assert.ok(ak.durumSn >= 5, `Ayşe: saniyede ${ak.durumSn} durum`);
  });
  sina(`istemcide hayalet sıçramaz (${sicrama.kare} kare, en büyük adım ${Math.round(sicrama.enBuyuk)} px)`, () => {
    assert.ok(sicrama.kare > 100, 'yeterli kare yok');
    assert.equal(sicrama.sicrama, 0);
  });
  sina(`ağ trafiği (WebSocket, KB/sn): kurucu gelen ${ag.kurucu.al} giden ${ag.kurucu.ver} · Ayşe gelen ${ag.ayse.al} giden ${ag.ayse.ver}`, () => {});

  // 5) Ayşe hayalet olur: oyun iki ölçülen cihazda da akar, tur sürer
  await K.p.evaluate(() => { window.__olsun = true; game.player.invuln = 0; game.player.hp = 1; damagePlayer(); });
  await H.p.waitForTimeout(800);
  const [oh, ok] = await Promise.all([akis(H, 3000), akis(K, 3000)]);
  const oluDurum = {
    olu: await K.p.evaluate(() => !!game.player.dead),
    hostGoruyor: await H.p.evaluate((uid) => !!(online.remotePlayers[uid] && online.remotePlayers[uid].dead), await K.p.evaluate(() => online.uid)),
    suruyor: await Promise.all(hepsi.map((s) => s.p.evaluate(() => game.running && !!online.mode))),
  };
  sina(`biri hayalet olunca oyun akar (kurucu ${oh.fps} fps, hayalet Ayşe ${ok.fps} fps)`, () => {
    assert.ok(oluDurum.olu && oluDurum.hostGoruyor, 'Ayşe hayalet olmadı ya da host görmedi');
    assert.deepEqual(oluDurum.suruyor, [true, true, true, true, true, true], 'tur erken bitti');
    for (const [ad, v] of [['kurucu', oh], ['Ayşe', ok]]) assert.ok(v.fps >= 30 && v.p95 <= 100, `${ad}: ${v.fps} fps, %95 kare ${v.p95} ms`);
    assert.ok(ok.durumSn >= 5, `Ayşe: saniyede ${ok.durumSn} durum`);
  });

  sina('sayfa hatası yok', () => {
    assert.deepEqual(hepsi.flatMap((s) => s.hatalar.map((x) => `${s.ad}: ${x}`)), []);
  });
} catch (e) {
  sonuclar.push(`✗ akış yarıda kaldı: ${e.message.split('\n')[0]}`);
} finally {
  await b.close();
  sunucu.close();
}
console.log(sonuclar.join('\n'));
const basarisiz = sonuclar.filter((s) => s.startsWith('✗')).length;
console.log(basarisiz ? `\n${basarisiz} sınama başarısız` : '\naltı kişilik oda: hepsi geçti');
process.exit(basarisiz ? 1 : 0);
