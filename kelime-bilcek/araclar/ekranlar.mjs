// Kelime Bilcek — bütün ekranların görüntüsü (tasarım denetimi). Örnek verilerle oyun.js'in kendi çizim işlevleri kullanılır.
// Çalıştırma: node kelime-bilcek/araclar/ekranlar.mjs <çıktı klasörü>   (önce npm run vendor)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const WWW = path.join(KOK, 'www');
const CIKTI = path.resolve(process.argv[2] || 'ekranlar');
const PW = process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright';
const { chromium } = await import(PW);
const TUR = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const sunucu = http.createServer((q, r) => {
  const f = path.join(WWW, decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html');
  if (!f.startsWith(WWW) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': TUR[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(0, '127.0.0.1');
await new Promise((r) => sunucu.once('listening', r));
const kok = `http://127.0.0.1:${sunucu.address().port}`;
const tarayici = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
fs.mkdirSync(CIKTI, { recursive: true });
const s = await tarayici.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
await s.route((u) => !u.href.startsWith(kok), (r) => r.abort());
await s.goto(`${kok}/index.html`);
await s.waitForFunction(() => !document.getElementById('authScreen').classList.contains('hidden'));
await s.addStyleTag({ content: '.toast{display:none!important}' });
const kare = async (ad, hazirla) => { await s.evaluate(hazirla); await s.waitForTimeout(450); await s.screenshot({ path: path.join(CIKTI, ad + '.png') }); console.log(ad); };

await kare('01-giris', () => {});
await kare('02-kullanici-adi', () => show('usernameScreen'));
await kare('03-lobi', () => { myUid = 'ben'; myName = 'kelimeci'; document.getElementById('meBar').classList.remove('hidden'); document.getElementById('meBarName').textContent = 'kelimeci'; show('lobbyScreen'); });
await kare('04-bot', () => { document.getElementById('botModAdi').textContent = 'Hızlı'; show('botScreen'); });
await kare('05-arkadaslar', () => { friendsData = { a: 'harfavcisi', b: 'zincirci', c: 'bilgekiz' }; renderFriends(); document.getElementById('fr_a').classList.add('online'); show('friendsScreen'); });
await kare('06-arkadas-ekle', () => show('addFriendScreen'));
await kare('07-oda-kodu', () => show('roomCodeScreen'));
await kare('08-kategoriler', () => { categoriesSelected = new Set(CATEGORIES.slice(0, 14)); renderCategoriesList(); show('categoriesScreen'); });
await kare('09-sampiyonlar', () => { show('leaderboardScreen'); renderLeaderboard([['kelimeci', 48, 61], ['harfavcisi', 41, 57], ['sozlukkurdu', 37, 50], ['zincirci', 30, 44], ['bilgekiz', 26, 40], ['tdkfan', 15, 25]].map(([name, wins, total], i) => ({ uid: i ? 'u' + i : 'ben', name, wins, total }))); });
await kare('10-araniyor', () => show('searchingScreen'));
await kare('11-mac-hizli-dusunme', () => {
  myUid = 'ben'; mySlot = 'p1';
  renderRoom({ status: 'playing', p1: { uid: 'ben', name: 'kelimeci' }, p2: { uid: 'o', name: 'harfavcisi' }, mode: 'sim',
    match: { mode: 'sim', totalRounds: 10, p1Wins: 2, p2Wins: 1, completedRounds: [{}, {}, {}] },
    round: { number: 4, category: 'Sabah Kahvaltısının Vazgeçilmezleri', phase: 'thinking', phaseStartTime: nowServer() - 3000, words: {} } });
});
await kare('12-mac-hizli-aktif', () => {
  const k = (text, by, valid, ts, ek = {}) => ({ text, by, valid, ts, ...ek });
  renderRoom({ status: 'playing', p1: { uid: 'ben', name: 'kelimeci' }, p2: { uid: 'o', name: 'harfavcisi' }, mode: 'sim',
    match: { mode: 'sim', totalRounds: 10, p1Wins: 3, p2Wins: 2, completedRounds: [{}, {}, {}, {}, {}] },
    round: { number: 6, category: 'Sabah Kahvaltısının Vazgeçilmezleri', phase: 'active', phaseStartTime: nowServer() - 12000, words: {
      a: k('simit', 'p1', true, 1), b: k('menemen', 'p2', true, 2), c: k('peynir', 'p1', true, 3), d: k('zeytin', 'p2', true, 4),
      e: k('kavun', 'p1', false, 5), f: k('bal', 'p2', true, 6), g: k('poğaça', 'p1', true, 8) } } });
});
await kare('13-mac-zincir', () => {
  renderRoom({ status: 'playing', p1: { uid: 'ben', name: 'kelimeci' }, p2: { uid: 'bilcek', name: '🤖 Bilcek (Zor)' }, mode: 'chain',
    match: { mode: 'chain', totalRounds: 1, p1Wins: 0, p2Wins: 0 },
    round: { number: 1, category: null, phase: 'active', phaseStartTime: nowServer() - 30000, turn: 'p1', turnStart: nowServer() - 4000, words: {
      a: { text: 'kalem', by: 'p2', valid: true, ts: 1 }, b: { text: 'masa', by: 'p1', valid: true, ts: 2 }, c: { text: 'armut', by: 'p2', valid: true, ts: 3 } } } });
});
await kare('14-sonuc', () => {
  stopPhaseTicker(); gameEnded = false;
  renderRoom({ status: 'finished', winner: 'p1', reason: null, p1: { uid: 'ben', name: 'kelimeci' }, p2: { uid: 'o', name: 'harfavcisi' }, mode: 'sim',
    match: { mode: 'sim', totalRounds: 10, p1Wins: 6, p2Wins: 3, ties: 1, completedRounds: Array.from({ length: 10 }, (_, i) => ({ number: i + 1, category: CATEGORIES[i], p1Score: 5 + (i % 3), p2Score: 3 + (i % 4), winner: i % 3 ? 'p1' : 'p2' })) },
    round: { number: 10, phase: 'ended' } });
});
await kare('15-profil', () => { stopPhaseTicker(); show('lobbyScreen'); openProfileMenu(); });
await kare('16-davet', () => { closeProfileMenu(); roomRef = null; showInvitePopup({ fromName: 'harfavcisi', roomId: 'inv_x', ts: Date.now() }); });
await tarayici.close();
sunucu.close();
