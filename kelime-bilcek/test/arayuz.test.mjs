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
// 1.0.5: kelime kutusu salt okunur; kelime oyunun klavyesinden, gerçek oyuncu gibi tuşlara basılarak yazılır
async function yaz(kelime) {
  for (const h of Array.from(kelime)) await sayfa.click(h === ' ' ? '#klavye [data-tus="bosluk"]' : `#klavye [data-tus="${h}"]`);
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
  await sayfa.waitForFunction(() => !document.getElementById('gameScreen').classList.contains('hidden')
    && /Bilcek \(Zor\)/.test(document.getElementById('msOppChip').textContent), null, { timeout: 10000 });
  await sayfa.waitForFunction(() => currentRoundData && currentRoundData.phase === 'active', null, { timeout: 20000 });
  if (await sayfa.evaluate(() => currentRoundData.turn === mySlot)) {
    await yaz('elma');
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
  await sayfa.evaluate(() => { if (roomRef) resetGameState(); selectedMode = 'sim'; BOT.hizli.orta = [400, 700, 0.7]; show('lobbyScreen'); });
  await sayfa.click('#botBtn');
  await sayfa.click('.bot-zorluk[data-zorluk="orta"]');
  await sayfa.waitForFunction(() => currentRoundData && currentRoundData.phase === 'thinking');
  // düşünme süresini kısalt (zaman damgasını geri al)
  await sayfa.evaluate(() => roomRef.child('round/phaseStartTime').set(nowServer() - 9800));
  await sayfa.waitForFunction(() => currentRoundData.phase === 'active', null, { timeout: 5000 });
  await yaz('simit');
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

test('1.0.4: kelime zaman damgası sunucu saatiyle yazılır (cihaz saati kaymış olsa da Zincir sırası/Hızlı kapma doğru)', { timeout: 60000 }, async () => {
  await sayfa.evaluate(() => { if (roomRef) resetGameState(); serverTimeOffset = 3600000; selectedMode = 'chain'; BOT.sira.zor = [300, 600, 0]; show('lobbyScreen'); });
  await sayfa.click('#botBtn');
  await sayfa.click('.bot-zorluk[data-zorluk="zor"]');
  await sayfa.waitForFunction(() => currentRoundData && currentRoundData.phase === 'active', null, { timeout: 20000 });
  await sayfa.waitForFunction(() => currentRoundData.turn === mySlot, null, { timeout: 10000 });
  const harf = await sayfa.evaluate(() => getChainNextLetter(currentRoundData.words));
  const kelime = await sayfa.evaluate((h) => zincirSozlugu().find((w) => (!h || turkishFirstLetter(w) === h) && !botKullanilanlar(currentRoundData.words).has(w)), harf);
  await yaz(kelime);
  await sayfa.click('#sendBtn');
  await sayfa.waitForFunction(() => Object.values(currentRoundData.words || {}).some((w) => w.by === mySlot));
  const fark = await sayfa.evaluate(() => Object.values(currentRoundData.words).filter((w) => w.by === mySlot).map((w) => Math.abs(w.ts - nowServer())));
  for (const f of fark) assert.ok(f < 30000, `oyuncunun kelimesi cihaz saatiyle yazılmış (fark ${f} ms)`);
  await sayfa.evaluate(() => { serverTimeOffset = 0; gameEnded = true; });
  await sayfa.evaluate(() => { resetGameState(); show('lobbyScreen'); });
  assert.deepEqual(hatalar, []);
});

test('1.0.4: Hızlı modda denetimi round bittikten sonra dönen kelime sonraki rounda yazılmaz', { timeout: 60000 }, async () => {
  await sayfa.evaluate(() => { if (roomRef) resetGameState(); selectedMode = 'sim'; BOT.hizli.orta = [60000, 60000, 0.7]; show('lobbyScreen'); });
  await sayfa.click('#botBtn');
  await sayfa.click('.bot-zorluk[data-zorluk="orta"]');
  await sayfa.waitForFunction(() => currentRoundData && currentRoundData.phase === 'thinking');
  await sayfa.evaluate(() => roomRef.child('round/phaseStartTime').set(nowServer() - 9800));
  await sayfa.waitForFunction(() => currentRoundData.phase === 'active', null, { timeout: 5000 });
  // listede olmayan kelime → yavaş denetim (round bitene kadar dönmez)
  await sayfa.evaluate(() => { window._eskiDenetim = validateWordSmart; window._denetimBitir = null;
    validateWordSmart = () => new Promise((r) => { window._denetimBitir = () => r(true); }); });
  await yaz('zzvvzz');
  await sayfa.click('#sendBtn');
  await sayfa.waitForFunction(() => typeof window._denetimBitir === 'function');
  await sayfa.evaluate(() => roomRef.child('round/phaseStartTime').set(nowServer() - 29900));
  await sayfa.waitForFunction(() => currentRoundData.number === 2, null, { timeout: 15000 });
  await sayfa.evaluate(() => window._denetimBitir());
  await sayfa.waitForTimeout(500);
  const sizan = await sayfa.evaluate(() => Object.values(currentRoundData.words || {}).filter((w) => w.text === 'zzvvzz').length);
  await sayfa.evaluate(() => { validateWordSmart = window._eskiDenetim; gameEnded = true; resetGameState(); show('lobbyScreen'); });
  assert.equal(sizan, 0, 'eski roundun kelimesi yeni rounda yazıldı');
  assert.deepEqual(hatalar, []);
});

test('1.0.5: oyun klavyesi — telefon klavyesi açılmaz, tuşlar ve fiziksel klavye yazar, sıra rakipteyken kapalı', { timeout: 60000 }, async () => {
  await sayfa.evaluate(() => { if (roomRef) resetGameState(); selectedMode = 'chain'; BOT.sira.zor = [1500, 1500, 0]; show('lobbyScreen'); });
  const kutu = await sayfa.evaluate(() => { const w = document.getElementById('wordInput'); return [w.readOnly, w.getAttribute('inputmode')]; });
  assert.deepEqual(kutu, [true, 'none'], 'kelime kutusu telefonun klavyesini açmamalı');
  await sayfa.click('#botBtn');
  await sayfa.click('.bot-zorluk[data-zorluk="zor"]');
  await sayfa.waitForFunction(() => currentRoundData && currentRoundData.phase === 'active', null, { timeout: 20000 });
  // panel ekranın altında, tuşlar en dar telefonda da yeterince geniş
  const olcu = await sayfa.evaluate(() => {
    const p = document.getElementById('inputRow').getBoundingClientRect();
    const t = document.querySelector('#klavye [data-tus="e"]').getBoundingClientRect();
    return { altta: Math.abs(p.bottom - innerHeight) < 2, tus: t.width, sinif: document.body.classList.contains('klavye-acik') };
  });
  assert.ok(olcu.altta && olcu.sinif, JSON.stringify(olcu));
  assert.ok(olcu.tus >= 27, `tuş ${olcu.tus} px`);
  // sıra rakipteyken tuşlar kapanır (ekran güncellemesini bekle)
  await sayfa.waitForFunction(() => currentRoundData.turn === mySlot || [...document.querySelectorAll('#klavye .kb-tus')].every((b) => b.disabled), null, { timeout: 3000 });
  if (await sayfa.evaluate(() => currentRoundData.turn !== mySlot)) {
    assert.equal(await sayfa.evaluate(() => [...document.querySelectorAll('#klavye .kb-tus')].every((b) => b.disabled)), true, 'sıra rakipteyken tuşlar kapalı');
    await sayfa.waitForFunction(() => currentRoundData.turn === mySlot, null, { timeout: 10000 });
  }
  await sayfa.waitForFunction(() => [...document.querySelectorAll('#klavye .kb-tus')].every((b) => !b.disabled));
  const harf = await sayfa.evaluate(() => getChainNextLetter(currentRoundData.words));
  // fiziksel klavyeyle yazılacak kısım ASCII (Playwright ABD düzeninde olmayan harfler için tuş olayı göndermez)
  const kelime = await sayfa.evaluate((h) => zincirSozlugu().find((w) => (!h || turkishFirstLetter(w) === h) && w.length >= 4
    && /^[a-hj-z]+$/.test(w.slice(2)) && !botKullanilanlar(currentRoundData.words).has(w)), harf);
  assert.ok(kelime, `"${harf}" ile başlayan uygun kelime`);
  // tuşlarla: fazladan harf + Sil
  await yaz(kelime.slice(0, 2) + 'k');
  await sayfa.click('#klavye [data-tus="sil"]');
  assert.equal(await sayfa.inputValue('#wordInput'), kelime.slice(0, 2));
  // fiziksel klavyeyle devam (web sürümü) ve Enter ile gönder
  await sayfa.keyboard.type(kelime.slice(2).toLocaleUpperCase('tr-TR'));
  assert.equal(await sayfa.inputValue('#wordInput'), kelime);
  await sayfa.keyboard.press('Enter');
  await sayfa.waitForFunction((k) => Object.values(currentRoundData.words || {}).some((w) => w.by === mySlot && w.text === k), kelime, { timeout: 5000 });
  await sayfa.evaluate(() => { gameEnded = true; resetGameState(); show('lobbyScreen'); });
  await sayfa.waitForFunction(() => !document.body.classList.contains('klavye-acik'));
  assert.deepEqual(hatalar, []);
});

test('1.0.6: Arkadaşını Davet Et — web\'de navigator.share, telefonda Share eklentisi; mağaza bağlantısıyla', async () => {
  await sayfa.evaluate(() => { if (roomRef) resetGameState(); show('lobbyScreen'); window._paylasim = null;
    navigator.share = async (d) => { window._paylasim = d; }; });
  await sayfa.click('#shareBtn');
  await sayfa.waitForFunction(() => window._paylasim);
  const web = await sayfa.evaluate(() => window._paylasim);
  assert.equal(web.url, 'https://play.google.com/store/apps/details?id=com.poyrazworkshop.kelimebilcek');
  assert.match(web.text, /kelime düellosu/);
  // telefonda: Capacitor Share eklentisi; kazanılan maçın sonunda skorlu "meydan oku" metni
  await sayfa.evaluate(() => { window._paylasim = null;
    window.Capacitor = { isNativePlatform: () => true, Plugins: { Share: { share: async (d) => { window._paylasim = d; } } } };
    sonMac = { kazandi: true, ben: 6, rakip: 4 }; document.getElementById('endShareText').textContent = 'Arkadaşına Meydan Oku'; show('endScreen'); });
  await sayfa.click('#endShareBtn');
  await sayfa.waitForFunction(() => window._paylasim);
  const tel = await sayfa.evaluate(() => window._paylasim);
  assert.match(tel.text, /6-4 kazandım/);
  assert.equal(tel.dialogTitle, 'Arkadaşını davet et');
  await sayfa.evaluate(() => { delete window.Capacitor; delete navigator.share; sonMac = null; show('lobbyScreen'); });
  assert.deepEqual(hatalar, []);
});

test('1.0.6: değerlendirme penceresi — kazanılan maçtan lobiye dönerken bir kez; 30 gün içinde tekrar yok; kaybedince yok', async () => {
  await sayfa.evaluate(() => {
    window._istek = 0;
    window.Capacitor = { isNativePlatform: () => true, Plugins: { InAppReview: { requestReview: async () => { window._istek++; } } } };
    localStorage.setItem('kb_tanitim_v1', JSON.stringify({ mac: 2, istek: [] }));
  });
  const don = async (kazandi) => {
    await sayfa.evaluate((k) => { sonMac = { kazandi: k, ben: 2, rakip: 1 }; show('endScreen'); }, kazandi);
    await sayfa.click('#againBtn');
    await sayfa.waitForFunction(() => !document.getElementById('lobbyScreen').classList.contains('hidden'));
    await sayfa.waitForTimeout(150);
    return sayfa.evaluate(() => window._istek);
  };
  assert.equal(await don(true), 0, 'ilk 3 maçta istenmez');
  await sayfa.evaluate(() => localStorage.setItem('kb_tanitim_v1', JSON.stringify({ mac: 3, istek: [] })));
  assert.equal(await don(false), 0, 'kaybedince istenmez');
  assert.equal(await don(true), 1, 'kazanınca istenir');
  assert.equal(await don(true), 1, '30 gün içinde ikinci kez istenmez');
  await sayfa.evaluate(() => { delete window.Capacitor; localStorage.removeItem('kb_tanitim_v1'); });
  assert.deepEqual(hatalar, []);
});

test('web sürümünde reklam kodu hiçbir şey yapmaz', async () => {
  assert.equal(await sayfa.evaluate(() => reklam.hazir), false);
  assert.deepEqual(hatalar, []);
});
