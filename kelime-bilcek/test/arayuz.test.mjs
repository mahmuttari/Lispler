// Kelime Bilcek — arayüz ve erişilebilirlik (node --test + Playwright Chromium + axe-core).
// www/ yerel bir HTTP sunucusundan açılır; dış ağ (Firebase, Google, TDK, Worker) kesilir. Sınananlar:
// sayfa hatasız açılır, hata ayıklama kalıntısı yok, yakınlaştırma serbest, SDK yerelden yüklenir, ekranlarda axe-core
// "serious/critical" ihlali yok. Firebase yoksa test atlanmaz, kırmızı olur (önce: npm run vendor).
// Playwright: PLAYWRIGHT_MODULE (varsayılan "playwright" paketi). Chromium: CHROMIUM ortam değişkeni ya da Playwright'ın kendi tarayıcısı.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const WWW = path.join(KOK, 'www');
const require = createRequire(import.meta.url);
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const PW = process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright';
const { chromium } = await import(PW);

const TUR = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png' };
let sunucu, adres, tarayici, sayfa;
const hatalar = [];
const disIstekler = [];

before(async () => {
  sunucu = http.createServer((q, r) => {
    const f = path.join(WWW, decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html');
    if (!f.startsWith(WWW) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'content-type': TUR[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(r);
  }).listen(0, '127.0.0.1');
  await new Promise((r) => sunucu.once('listening', r));
  adres = `http://127.0.0.1:${sunucu.address().port}/index.html`;
  tarayici = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  sayfa = await tarayici.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  sayfa.on('pageerror', (e) => hatalar.push(e.message));
  sayfa.on('dialog', (d) => d.accept());
  await sayfa.route((u) => !u.href.startsWith(`http://127.0.0.1:${sunucu.address().port}/`), (r) => {
    disIstekler.push(r.request().url());
    return r.abort();
  });
  await sayfa.goto(adres, { waitUntil: 'load' });
  // Firebase Auth kayıtlı oturum yokken onAuthStateChanged(null) → giriş ekranı
  await sayfa.waitForFunction(() => !document.getElementById('authScreen').classList.contains('hidden'), null, { timeout: 15000 });
});

after(async () => {
  await tarayici?.close();
  sunucu?.close();
});

async function axe(seciciler) {
  await sayfa.evaluate(AXE);
  return sayfa.evaluate(async (s) => {
    const r = await window.axe.run(s ? { include: s } : document, { resultTypes: ['violations'] });
    return r.violations.map((v) => ({ id: v.id, etki: v.impact, adet: v.nodes.length, ornek: v.nodes[0]?.target?.join(' ') }));
  }, seciciler);
}
const agir = (ihlaller) => ihlaller.filter((v) => v.etki === 'serious' || v.etki === 'critical');

test('sayfa hatasız açılır, giriş ekranı görünür', () => {
  assert.deepEqual(hatalar, []);
});

test('Firebase SDK CDN\'den değil yerelden yüklenir', async () => {
  assert.equal(disIstekler.filter((u) => /gstatic\.com\/firebasejs/.test(u)).length, 0);
  assert.equal(await sayfa.evaluate(() => typeof firebase === 'object' && firebase.SDK_VERSION), '10.12.0');
});

test('hata ayıklama kalıntısı yok; yakınlaştırma serbest', async () => {
  const html = fs.readFileSync(path.join(WWW, 'index.html'), 'utf8');
  assert.doesNotMatch(html, /v4\.11|AI raw|cordova\.js|debug-box/);
  assert.doesNotMatch(html, /user-scalable\s*=\s*no|maximum-scale\s*=\s*1\b/);
  const js = fs.readFileSync(path.join(WWW, 'oyun.js'), 'utf8');
  assert.doesNotMatch(js, /\bdbg\(|googleplus|Claude Haiku/);
});

test('giriş ekranı: axe-core ağır ihlal yok', async () => {
  const v = await axe();
  assert.deepEqual(agir(v), [], JSON.stringify(v, null, 1));
});

test('lobi, Şampiyonlar, kategoriler, profil menüsü: axe-core ağır ihlal yok', async () => {
  for (const ekran of ['lobbyScreen', 'leaderboardScreen', 'categoriesScreen', 'friendsScreen', 'roomCodeScreen', 'endScreen', 'botScreen']) {
    await sayfa.evaluate((e) => { show(e); if (e === 'categoriesScreen') { categoriesSelected = new Set(CATEGORIES); renderCategoriesList(); } }, ekran);
    const v = await axe();
    assert.deepEqual(agir(v), [], `${ekran}: ${JSON.stringify(v)}`);
  }
  await sayfa.evaluate(() => { show('lobbyScreen'); openProfileMenu(); });
  await sayfa.waitForTimeout(300);
  const v = await axe('#profileMenu');
  assert.deepEqual(agir(v), [], JSON.stringify(v));
  assert.equal(await sayfa.evaluate(() => !!document.getElementById('deleteAccountBtn')), true, 'Hesabı Sil düğmesi');
});

test('1.0.2: yapay zekâya karşı (Zincir, zor): bot doğru harfle yazar, sıra döner, terk edince sonuç ekranı', { timeout: 60000 }, async () => {
  await sayfa.evaluate(() => { closeProfileMenu(); myUid = 'deneme1'; myName = 'deneme'; selectedMode = 'chain'; BOT.sira.zor = [300, 600, 0]; show('lobbyScreen'); });
  await sayfa.click('#botBtn');
  assert.equal(await sayfa.textContent('#botModAdi'), 'Zincir');
  await sayfa.click('.bot-zorluk[data-zorluk="zor"]');
  await sayfa.waitForFunction(() => !document.getElementById('gameScreen').classList.contains('hidden'));
  assert.match(await sayfa.textContent('#msOppChip'), /Bilcek \(Zor\)/);
  await sayfa.waitForFunction(() => currentRoundData && currentRoundData.phase === 'active', null, { timeout: 20000 });
  if (await sayfa.evaluate(() => currentRoundData.turn === mySlot)) {
    await sayfa.fill('#wordInput', 'elma');
    await sayfa.click('#sendBtn');
  }
  // bot yazar ve sıra oyuncuya döner
  await sayfa.waitForFunction(() => Object.values(currentRoundData.words || {}).some((w) => w.by === 'p2') && currentRoundData.turn === mySlot, null, { timeout: 10000 });
  const kelimeler = await sayfa.evaluate(() => Object.values(currentRoundData.words).sort((a, b) => a.ts - b.ts).map((w) => w.text));
  if (kelimeler.length >= 2) {
    const [ilk, beklenen] = await sayfa.evaluate((k) => [turkishFirstLetter(k[1]), chainLetterFor(k[0])], kelimeler);
    assert.equal(ilk, beklenen, kelimeler.join(' → '));
  }
  await sayfa.click('#leaveBtn');
  await sayfa.waitForFunction(() => !document.getElementById('endScreen').classList.contains('hidden'), null, { timeout: 5000 });
  assert.match(await sayfa.textContent('#endSubtitle'), /terk/i);
  await sayfa.click('#againBtn');
  await sayfa.waitForFunction(() => !document.getElementById('lobbyScreen').classList.contains('hidden') && roomRef === null && bot.oda === null);
  assert.deepEqual(hatalar, []);
});

test('1.0.2: yapay zekâya karşı (Hızlı, orta): bot round boyunca kategori kelimesi yazar, round puanlanır', { timeout: 60000 }, async () => {
  await sayfa.evaluate(() => { selectedMode = 'sim'; BOT.hizli.orta = [400, 700, 0.7]; show('lobbyScreen'); });
  await sayfa.click('#botBtn');
  await sayfa.click('.bot-zorluk[data-zorluk="orta"]');
  await sayfa.waitForFunction(() => currentRoundData && currentRoundData.phase === 'thinking');
  // düşünme süresini kısalt (zaman damgasını geri al)
  await sayfa.evaluate(() => roomRef.child('round/phaseStartTime').set(nowServer() - 9800));
  await sayfa.waitForFunction(() => currentRoundData.phase === 'active', null, { timeout: 5000 });
  await sayfa.fill('#wordInput', 'simit');
  await sayfa.click('#sendBtn');
  await sayfa.waitForFunction(() => Object.values(currentRoundData.words || {}).filter((w) => w.by === 'p2').length >= 3, null, { timeout: 8000 });
  const kat = await sayfa.evaluate(() => currentRoundData.category);
  const botun = await sayfa.evaluate(() => Object.values(currentRoundData.words).filter((w) => w.by === 'p2').map((w) => w.text));
  for (const w of botun) assert.ok(await sayfa.evaluate(({ k, w }) => isInCategory(k, w), { k: kat, w }), `${kat}: ${w}`);
  // round süresini bitir
  await sayfa.evaluate(() => roomRef.child('round/phaseStartTime').set(nowServer() - 29900));
  await sayfa.waitForFunction(() => currentMatchData && (currentMatchData.completedRounds || []).length === 1, null, { timeout: 5000 });
  const sonuc = await sayfa.evaluate(() => currentMatchData.completedRounds[0]);
  assert.ok(sonuc.p2Score >= 3, JSON.stringify(sonuc));
  await sayfa.click('#leaveBtn');
  await sayfa.waitForFunction(() => !document.getElementById('endScreen').classList.contains('hidden'), null, { timeout: 5000 });
  await sayfa.click('#againBtn');
  await sayfa.waitForFunction(() => roomRef === null && bot.oda === null);
  assert.deepEqual(hatalar, []);
});

test('web sürümünde reklam kodu hiçbir şey yapmaz', async () => {
  assert.equal(await sayfa.evaluate(() => reklam.hazir), false);
  assert.deepEqual(hatalar, []);
});
