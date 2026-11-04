// Kelime Bilcek — uçtan uca akış: gerçek www/ kodu + sıkı kurallar, Firebase emülatöründe (Auth + Realtime Database).
// İki tarayıcı sayfası (Ali, Ayşe) anonim girişle (emülatör) oynar: kullanıcı adı, arkadaş ekleme, hızlı eşleşme
// (Zincir), kelime yazma, terk, sonuç, Şampiyonlar, biten odanın silinmesi, hesap silme.
// Çalıştırma: kelime-bilcek/firebase içinde `npm run test:akis` (emulators:exec database,auth). Google ile giriş
// emülatörde yapılamadığı için oturum signInAnonymously ile açılır; hesap silmedeki yeniden doğrulama taklit edilir.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const WWW = path.join(KOK, 'www');
const PW = process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
  : pathToFileURL(path.join(KOK, 'node_modules', 'playwright', 'index.mjs')).href;
const { chromium } = await import(PW);
const NS = 'demo-kelime-bilcek-default-rtdb';
const RTDB = process.env.FIREBASE_DATABASE_EMULATOR_HOST || '127.0.0.1:9000';
const AUTH = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';

const TUR = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png' };
let sunucu, tarayici, ali, ayse;
const hatalar = [];

async function veri(yol = '') { // yönetici okuması (emülatörde "Bearer owner")
  const r = await fetch(`http://${RTDB}/${yol}.json?ns=${NS}`, { headers: { Authorization: 'Bearer owner' } });
  return r.json();
}

async function oyuncu(ad) {
  const s = await tarayici.newPage({ viewport: { width: 390, height: 844 } });
  s.on('pageerror', (e) => hatalar.push(`${ad}: ${e.message}`));
  s.on('dialog', (d) => d.accept());
  // Kuralın reddettiği her yazım/okuma konsolda "permission_denied" olarak görünür; hiçbiri olmamalı
  s.on('console', (m) => { if (/permission[_ ]denied/i.test(m.text())) hatalar.push(`${ad}: ${m.text().slice(0, 200)}`); });
  await s.route((u) => !u.href.startsWith(`http://127.0.0.1:${sunucu.address().port}/`) && !u.href.includes(RTDB) && !u.href.includes(AUTH), (r) => r.abort());
  // Firebase'i emülatöre yönelt: oyun.js'teki initializeApp satırı değiştirilir (dosya diskte değişmez)
  await s.route('**/oyun.js', async (r) => {
    let js = fs.readFileSync(path.join(WWW, 'oyun.js'), 'utf8');
    js = js.replace('firebase.initializeApp(firebaseConfig);',
      `firebaseConfig.projectId = "demo-kelime-bilcek"; firebaseConfig.databaseURL = "https://${NS}.europe-west1.firebasedatabase.app";
       firebase.initializeApp(firebaseConfig); firebase.auth().useEmulator("http://${AUTH}"); firebase.database().useEmulator("${RTDB.split(':')[0]}", ${RTDB.split(':')[1]});`);
    await r.fulfill({ status: 200, contentType: 'text/javascript', body: js });
  });
  await s.goto(`http://127.0.0.1:${sunucu.address().port}/index.html`);
  await s.waitForFunction(() => !document.getElementById('authScreen').classList.contains('hidden'));
  await s.evaluate(() => firebase.auth().signInAnonymously());
  await s.waitForFunction(() => !document.getElementById('usernameScreen').classList.contains('hidden'));
  await s.fill('#usernameInput', ad);
  await s.click('#usernameBtn');
  await s.waitForFunction(() => !document.getElementById('lobbyScreen').classList.contains('hidden'));
  return s;
}
const gorunur = (s, id, timeout = 20000) => s.waitForFunction((i) => !document.getElementById(i).classList.contains('hidden'), id, { timeout });

before(async () => {
  sunucu = http.createServer((q, r) => {
    const f = path.join(WWW, decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html');
    if (!f.startsWith(WWW) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'content-type': TUR[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(r);
  }).listen(0, '127.0.0.1');
  await new Promise((r) => sunucu.once('listening', r));
  tarayici = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  ali = await oyuncu('ali');
  ayse = await oyuncu('ayse');
});
after(async () => { await tarayici?.close(); sunucu?.close(); });

test('kullanıcı adları alındı; Google e-postası yazılmadı', async () => {
  const d = await veri();
  assert.equal(Object.keys(d.usernames).sort().join(), 'ali,ayse');
  for (const u of Object.values(d.users)) assert.equal(u.google, undefined);
});

test('arkadaş ekleme karşılıklı yazılır', async () => {
  await ali.click('#friendsBtn');
  await ali.click('#addFriendOpenBtn');
  await ali.fill('#addFriendInput', 'ayse');
  await ali.click('#addFriendBtn');
  await gorunur(ali, 'friendsScreen');
  await ali.waitForSelector('#friendsList .friend-row');
  const d = await veri('users');
  const [aliUid] = Object.entries(d).find(([, u]) => u.name === 'ali');
  const [ayseUid] = Object.entries(d).find(([, u]) => u.name === 'ayse');
  assert.equal(d[aliUid].friends[ayseUid], 'ayse');
  assert.equal(d[ayseUid].friends[aliUid], 'ali');
  await ali.click('#friendsScreen [data-back]');
});

test('hızlı eşleşme (Zincir): iki oyuncu aynı odada oynar, terk, sonuç ve Şampiyonlar', { timeout: 90000 }, async () => {
  for (const s of [ali, ayse]) { await s.click('.mode-pill[data-mode="chain"]'); }
  await ali.click('#quickMatchBtn');
  await ayse.click('#quickMatchBtn');
  await gorunur(ali, 'gameScreen');
  await gorunur(ayse, 'gameScreen');
  // 10 sn düşünme → etkin; sırası gelen yerel sözlükten bir kelime yazar
  await ali.waitForFunction(() => currentRoundData && currentRoundData.phase === 'active', null, { timeout: 30000 });
  const sira = await ali.evaluate(() => (currentRoundData.turn === mySlot ? 'ali' : 'ayse'));
  const ilk = sira === 'ali' ? ali : ayse;
  const ikinci = sira === 'ali' ? ayse : ali;
  await ilk.fill('#wordInput', 'elma');
  await ilk.click('#sendBtn');
  await ikinci.waitForFunction(() => currentRoundData && currentRoundData.turn === mySlot, null, { timeout: 10000 });
  await ikinci.fill('#wordInput', 'armut');
  await ikinci.click('#sendBtn');
  await ilk.waitForFunction(() => Object.keys(currentRoundData.words || {}).length === 2, null, { timeout: 10000 });
  const odaId = await ali.evaluate(() => roomId);
  const oda = await veri(`rooms/${odaId}`);
  assert.deepEqual(Object.values(oda.round.words).map((w) => w.text).sort(), ['armut', 'elma']);
  await ali.click('#leaveBtn'); // onay penceresi kabul edilir
  await gorunur(ali, 'endScreen');
  await gorunur(ayse, 'endScreen');
  await ayse.waitForFunction(async () => true);
  // sayaçlar ve Şampiyonlar
  await new Promise((r) => setTimeout(r, 1500));
  const lb = await veri('leaderboard');
  const ayseLb = Object.values(lb).find((x) => x.name === 'ayse');
  const aliLb = Object.values(lb).find((x) => x.name === 'ali');
  assert.equal(ayseLb.wins, 1); assert.equal(ayseLb.chainWins, 1); assert.equal(ayseLb.totalGames, 1);
  assert.equal(aliLb.losses, 1);
  await ayse.click('#againBtn');
  await gorunur(ayse, 'lobbyScreen');
  await ayse.click('#leaderboardBtn');
  await ayse.waitForSelector('#leaderboardList .lb-row');
  assert.match(await ayse.textContent('#leaderboardList'), /ayse/);
  // biten oda silinir
  await new Promise((r) => setTimeout(r, 1500));
  assert.equal(await veri(`rooms/${odaId}`), null);
  await ali.click('#againBtn');
  await gorunur(ali, 'lobbyScreen');
});

test('hesap silme: veriler ve giriş hesabı silinir, arkadaşın listesi temizlenir', { timeout: 30000 }, async () => {
  const once = await veri('users');
  const [aliUid] = Object.entries(once).find(([, u]) => u.name === 'ali');
  const [ayseUid] = Object.entries(once).find(([, u]) => u.name === 'ayse');
  // Anonim emülatör hesabı Google ile yeniden doğrulanamaz: yeniden doğrulama taklit edilir
  await ali.evaluate(() => { firebase.auth().currentUser.reauthenticateWithPopup = async () => ({}); });
  await ali.evaluate(() => openProfileMenu());
  await ali.click('#deleteAccountBtn');
  await gorunur(ali, 'authScreen');
  const d = await veri();
  assert.equal(d.users[aliUid], undefined);
  assert.equal(d.usernames.ali, undefined);
  assert.equal(d.leaderboard[aliUid], undefined);
  assert.equal((d.users[ayseUid].friends || {})[aliUid], undefined);
  assert.equal(d.users[ayseUid].name, 'ayse');
});

test('sayfa hatası ve izin reddi yok', () => {
  assert.deepEqual(hatalar, []);
});
