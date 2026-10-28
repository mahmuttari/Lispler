// Hayalet Avcıları: 3.15.0'ın çevrimiçi eklerinin uçtan uca sınaması (Firebase emülatörü: RTDB 9000 + Auth 9099).
// Kullanıcının isteği: "Online oyunda da çalışsın" — petler herkese görünsün, çalıda saklanma, Dünya Turu'nda reklamla
// diril, ortak timsahlar; ayrıca "hayaletler üzerimize doğuyor": hayalet hiçbir oyuncunun dibinde doğmaz.
// İki tarayıcı: kurucu Dünya Turu odası kurar, konuk (kedisi var, sahte AdMob'lu) kodla katılır.
// Çalıştırma (Java 21, Playwright + Chromium): cd hayalet-avcilari/firebase && npm ci && npm run test:ek
// Emülatör zaten açıksa: node hayalet-avcilari/test/cevrimici-ek.test.mjs
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

async function sayfaAc(b, ad, admob) {
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
  if (admob) {
    // Sahte AdMob: ödüllü reklam hep yüklü; olaylar window.__olay ile tetiklenir (test/reklam.test.mjs ile aynı)
    await p.addInitScript(() => {
      window.__dinle = {};
      window.__olay = (ad) => (window.__dinle[ad] || []).forEach((fn) => fn());
      const bos = async () => {};
      const onay = { status: 'NOT_REQUIRED', isConsentFormAvailable: false, canRequestAds: true, privacyOptionsRequirementStatus: 'NOT_REQUIRED' };
      window.Capacitor = { Plugins: { AdMob: {
        initialize: bos, requestConsentInfo: async () => onay, showConsentForm: async () => onay,
        addListener: (olay, fn) => { (window.__dinle[olay] = window.__dinle[olay] || []).push(fn); return Promise.resolve({ remove: bos }); },
        prepareInterstitial: bos, prepareRewardVideoAd: bos, showInterstitial: bos, showRewardVideoAd: bos, showPrivacyOptionsForm: bos,
      } } };
    });
  }
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForTimeout(300);
  await p.evaluate((ad) => { save.playerName = ad; persistSave(); try { localStorage.setItem(VERSION_KEY, APP_VERSION); } catch (_) {} }, ad);
  return { ctx, p, hatalar };
}
const bekle = (s, fn, arg, ms = 15000) => s.p.waitForFunction(fn, arg, { timeout: ms });

const sonuclar = [];
function sina(ad, fn) {
  try { fn(); sonuclar.push(`✓ ${ad}`); } catch (e) { sonuclar.push(`✗ ${ad}: ${e.message.split('\n')[0]}`); }
}

const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--disable-renderer-backgrounding', '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows'] });
let H, K;
try {
  H = await sayfaAc(b, 'Kurucu', false);
  K = await sayfaAc(b, 'Konuk', true);
  await K.p.evaluate(() => { save.ownedPets = { kedi: true }; save.pet = 'kedi'; persistSave(); });

  // Dünya Turu odası: kurucu kurar, konuk kodla katılır, hazır, başla
  await H.p.evaluate(async () => { await openOnline(); openCreateRoom(); odaKipiSec('tur'); odaUlkesiSec(2); await submitCreateRoom(); });
  const oda = await H.p.evaluate(() => online.roomId);
  assert.match(oda || '', /^[A-HJKMNP-Z2-9]{6}$/, 'oda kurulamadı');
  await K.p.evaluate(async () => { await openOnline(); await openRoomList(); });
  await K.p.evaluate((kod) => { document.getElementById('room-code-input').value = kod.toLowerCase(); kodlaKatil(); }, oda);
  await bekle(K, () => online.cachedRoom && online.cachedRoom.players[online.uid] && document.getElementById('screen-lobby').classList.contains('active'));
  await K.p.evaluate(async () => { await toggleReady(); });
  await bekle(H, () => document.getElementById('lobby-start-btn').style.display !== 'none');
  await H.p.evaluate(async () => { await startMpGame(); });
  await bekle(K, () => game.running && online.mode === 'client' && game.dunyaTuru);
  await bekle(H, () => game.running && online.mode === 'host' && Object.keys(online.remotePlayers).length === 1);
  // Kimse ölmesin; kurucu hayaletlere görünmez (hedef sayımı yalnız konuğu ölçsün)
  for (const s of [H, K]) await s.p.evaluate(() => { window.__koru = setInterval(() => { if (game.player && !game.player.dead) { game.player.invuln = 2; game.player.hp = 3; } }, 100); });
  await H.p.evaluate(() => { game.player.invisibleUntil = performance.now() + 1e9; });
  const kUid = await K.p.evaluate(() => online.uid);

  // 1) Pet herkese görünür
  await bekle(H, (u) => { const rp = online.remotePlayers[u]; return rp && rp.pet === 'kedi' && Number.isFinite(rp.petX); }, kUid, 20000);
  const pet = await H.p.evaluate((u) => {
    const rp = online.remotePlayers[u];
    let hata = null; try { render(); } catch (e) { hata = e.message; }
    return { yakin: Math.hypot(rp.petX - rp.x, rp.petY - rp.y) < 160, hata };
  }, kUid);
  sina('konuğun kedisi kurucuda görünür, sahibinin yanında', () => { assert.equal(pet.yakin, true); assert.equal(pet.hata, null); });

  // 2) Çalıda saklanma: kurucu konuğu çalıda göz olarak görür, hayaletleri onu kovalamaz
  await H.p.evaluate(() => {
    window.__hedef = [];
    const asil = enYakinHedef;
    enYakinHedef = (g, h) => { window.__hedef.push(h.length); return asil(g, h); };
  });
  await K.p.evaluate(() => { const c = calilarHazir()[0]; game.player.x = c.x; game.player.y = c.y; });
  await bekle(K, () => game.player.gizli === true, null, 5000);
  await bekle(H, (u) => online.remotePlayers[u].gizli === true, kUid, 5000);
  const gizli = await H.p.evaluate(async () => {
    if (!game.ghosts.length) spawnGhost();
    window.__hedef = []; await new Promise((r) => setTimeout(r, 700));
    const h = window.__hedef.slice();
    let hata = null; try { render(); } catch (e) { hata = e.message; }
    return { kovalayan: h.filter((n) => n > 0).length, olcum: h.length, hata };
  });
  sina('çalıdaki konuk kurucuda saklanıyor görünür, hayaletler onu kovalamaz', () => {
    assert.ok(gizli.olcum > 0, 'hayalet yok'); assert.equal(gizli.kovalayan, 0); assert.equal(gizli.hata, null);
  });
  await K.p.evaluate(() => { const c = calilarHazir()[0]; const yer = freeSpot(c.x + 160, c.y, 22); game.player.x = yer.x; game.player.y = yer.y; });
  await bekle(H, (u) => online.remotePlayers[u].gizli === false, kUid, 5000);
  const cikinca = await H.p.evaluate(async () => { window.__hedef = []; await new Promise((r) => setTimeout(r, 700)); return window.__hedef.filter((n) => n > 0).length; });
  sina('çalıdan çıkınca hayaletler yine konuğu kovalar', () => { assert.ok(cikinca > 0); });

  // 3) Ortak timsahlar: konuğun saldıran timsahı kurucuda, kurucunun süs timsahı konukta görünür; istemci süs doğurmaz
  await K.p.evaluate(() => {
    const o = game.waters[0];
    const yer = freeSpot(o.x - 40, o.y + o.h / 2, 22);
    game.player.x = yer.x; game.player.y = yer.y;
    timsahSaldirt(o, yer.x, yer.y);
  });
  await bekle(H, (u) => (online.remotePlayers[u].timsahlar || []).some((tm) => tm.tur === 'saldiri'), kUid, 5000);
  const hUid = await H.p.evaluate(() => online.uid);
  await H.p.evaluate(() => { const o = game.waters[1] || game.waters[0]; game.camera.x = o.x - 20; game.camera.y = o.y - 20; game.timsahlar = []; timsahSusle(); });
  await bekle(K, (u) => (online.remotePlayers[u].timsahlar || []).some((tm) => tm.tur === 'sus' || tm.tur === 'bos'), hUid, 5000);
  const istemciSus = await K.p.evaluate(() => {
    const once = game.timsahlar.filter((tm) => tm.tur !== 'saldiri').length;
    game._timsahSus = 0; timsahGuncelle(0.05);
    let hata = null; try { render(); } catch (e) { hata = e.message; }
    return { yeni: game.timsahlar.filter((tm) => tm.tur !== 'saldiri').length - once, hata };
  });
  sina('timsahlar ortak: konuğun saldırısı kurucuda, kurucunun süs timsahı konukta görünür', () => {});
  sina('istemci kendi süs timsahını doğurmaz (süsler kurucudan)', () => { assert.equal(istemciSus.yeni, 0); assert.equal(istemciSus.hata, null); });

  // 4) Hayaletler oyuncuların dibinde doğmaz (kurucu ikisini de bilir)
  const dogum = await H.p.evaluate((u) => {
    const rp = online.remotePlayers[u];
    game.player.x = game.worldW * 0.35; game.player.y = game.worldH / 2;
    const once = game.ghosts.length;
    for (let i = 0; i < 40; i++) spawnGhost();
    const yeni = game.ghosts.slice(once);
    const enYakin = Math.min(...yeni.map((g) => Math.min(Math.hypot(g.x - game.player.x, g.y - game.player.y), Math.hypot(g.x - rp.x, g.y - rp.y))));
    game.ghosts.splice(once);
    return Math.round(enYakin);
  }, kUid);
  sina(`yeni hayalet iki oyuncuya da en az ${320} px uzakta doğar (en yakın ${dogum} px)`, () => { assert.ok(dogum >= 320, String(dogum)); });

  // 5) Dünya Turu'nda reklamla diril: konuk hayalet olur, düğme çıkar, reklam sonuna kadar izlenince dirilir
  await K.p.evaluate(() => { clearInterval(window.__koru); game.player.invuln = 0; game.player.hp = 1; damagePlayer(); });
  await bekle(K, () => game.player.dead && document.getElementById('btn-tur-diril').style.display !== 'none', null, 5000);
  await bekle(H, (u) => online.remotePlayers[u].dead === true, kUid, 5000);
  const dugme = await K.p.evaluate(() => ({ yazi: document.getElementById('btn-tur-diril').textContent, kapali: document.getElementById('btn-tur-diril').disabled }));
  await K.p.evaluate(async () => {
    document.getElementById('btn-tur-diril').click();
    await new Promise((r) => setTimeout(r, 50));
    window.__olay('onRewardedVideoAdReward'); window.__olay('onRewardedVideoAdDismissed');
  });
  await bekle(K, () => !game.player.dead, null, 5000);
  const diril = await K.p.evaluate(() => ({ hp: game.player.hp, hak: game.turDevamKalan, dugme: document.getElementById('btn-tur-diril').style.display }));
  await bekle(H, (u) => online.remotePlayers[u].dead === false, kUid, 5000);
  sina('çevrimiçi turda hayalet olan konukta "Reklam izle, diril (3/3)" düğmesi çıkar', () => {
    assert.equal(dugme.yazi, '🎬 Reklam izle, diril (3/3)'); assert.equal(dugme.kapali, false);
  });
  sina('reklam sonuna kadar izlenince konuk canları dolu dirilir, hak 2 kalır; kurucu da görür', () => {
    assert.deepEqual(diril, { hp: 3, hak: 2, dugme: 'none' });
  });
  sina('sayfa hatası yok', () => { assert.deepEqual([...H.hatalar, ...K.hatalar], []); });
} catch (e) {
  sonuclar.push(`✗ akış yarıda kaldı: ${e.message.split('\n')[0]}`);
} finally {
  for (const s of [H, K]) { try { await s.p.evaluate(() => odadanCik && odadanCik()); } catch (_) {} }
  await b.close();
  sunucu.close();
}
sonuclar.forEach((s) => console.log(s));
const kalan = sonuclar.filter((s) => s.startsWith('✗'));
assert.equal(kalan.length, 0, `${kalan.length} sınama başarısız`);
console.log(`TAMAM: ${sonuclar.length} sınama`);
