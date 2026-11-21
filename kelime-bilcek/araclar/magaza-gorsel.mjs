// Kelime Bilcek — Play mağaza görselleri: oyunun gerçek arayüzünden telefon ekran görüntüleri (1080×1920) ve tanıtım
// görseli (1024×500) → magaza/play/. Ağ kesiktir; ekranlar örnek verilerle oyun.js'in kendi çizim işlevleriyle çizilir.
// Çalıştırma: node kelime-bilcek/araclar/magaza-gorsel.mjs   (önce npm run vendor; PLAYWRIGHT_MODULE / CHROMIUM isteğe bağlı)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const WWW = path.join(KOK, 'www');
const CIKTI = path.join(KOK, 'magaza', 'play');
const PW = process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright';
const { chromium } = await import(PW);
const TUR = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png' };

const sunucu = http.createServer((q, r) => {
  const f = path.join(WWW, decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html');
  if (!f.startsWith(WWW) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': TUR[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(0, '127.0.0.1');
await new Promise((r) => sunucu.once('listening', r));
const kok = `http://127.0.0.1:${sunucu.address().port}`;
const tarayici = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
fs.mkdirSync(CIKTI, { recursive: true });

const s = await tarayici.newPage({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3 });
await s.route((u) => !u.href.startsWith(kok), (r) => r.abort());
await s.goto(`${kok}/index.html`);
await s.waitForFunction(() => !document.getElementById('authScreen').classList.contains('hidden'));
await s.addStyleTag({ content: '.toast{display:none!important} footer{visibility:hidden}' });
await s.evaluate(() => document.fonts.ready);

const kare = async (ad, hazirla) => {
  await s.evaluate(hazirla);
  await s.waitForTimeout(400);
  await s.screenshot({ path: path.join(CIKTI, ad) });
  console.log(`magaza/play/${ad}`);
};

await kare('telefon-1-lobi.png', () => { show('lobbyScreen'); document.getElementById('meBar').classList.remove('hidden'); document.getElementById('meBarName').textContent = 'kelimeci'; });
await kare('telefon-2-hizli.png', () => {
  const simdi = Date.now() + serverTimeOffset;
  const k = (text, by, valid, ts, ek = {}) => ({ text, by, valid, ts, ...ek });
  myUid = 'ben'; myName = 'kelimeci'; mySlot = 'p1';
  renderRoom({
    status: 'playing', p1: { uid: 'ben', name: 'kelimeci' }, p2: { uid: 'o', name: 'harfavcisi' }, mode: 'sim',
    match: { mode: 'sim', totalRounds: 10, p1Wins: 3, p2Wins: 2, ties: 0, completedRounds: [{}, {}, {}, {}, {}] },
    round: { number: 6, category: 'Sabah Kahvaltısının Vazgeçilmezleri', phase: 'active', phaseStartTime: simdi - 12000, words: {
      a: k('simit', 'p1', true, 1), b: k('menemen', 'p2', true, 2), c: k('peynir', 'p1', true, 3), d: k('zeytin', 'p2', true, 4),
      e: k('kaymak', 'p1', true, 5), f: k('bal', 'p2', true, 6), g: k('kavun', 'p1', false, 7), h: k('poğaça', 'p1', true, 8) } },
  });
});
await kare('telefon-3-zincir.png', () => {
  const simdi = Date.now() + serverTimeOffset;
  renderRoom({
    status: 'playing', p1: { uid: 'ben', name: 'kelimeci' }, p2: { uid: 'o', name: 'zincirci' }, mode: 'chain',
    match: { mode: 'chain', totalRounds: 1, p1Wins: 0, p2Wins: 0 },
    round: { number: 1, category: null, phase: 'active', phaseStartTime: simdi - 30000, turn: 'p1', turnStart: simdi - 4000, words: {
      a: { text: 'kalem', by: 'p2', valid: true, ts: 1 }, b: { text: 'masa', by: 'p1', valid: true, ts: 2 },
      c: { text: 'armut', by: 'p2', valid: true, ts: 3 }, d: { text: 'tavla', by: 'p1', valid: true, ts: 4 }, e: { text: 'ayva', by: 'p2', valid: true, ts: 5 } } },
  });
});
await kare('telefon-4-sampiyonlar.png', () => {
  stopPhaseTicker(); show('leaderboardScreen');
  renderLeaderboard([['kelimeci', 48, 61], ['harfavcisi', 41, 57], ['sozlukkurdu', 37, 50], ['zincirci', 30, 44], ['bilgekiz', 26, 40],
    ['kahvaltici', 19, 33], ['tdkfan', 15, 25], ['hizliparmak', 11, 20]].map(([name, wins, total], i) => ({ uid: i === 0 ? 'ben' : 'u' + i, name, wins, total })));
});
await kare('telefon-5-kategoriler.png', () => { categoriesSelected = new Set(CATEGORIES.slice(0, 18)); renderCategoriesList(); show('categoriesScreen'); });

// Tanıtım görseli 1024×500
const t = await tarayici.newPage({ viewport: { width: 1024, height: 500 }, deviceScaleFactor: 1 });
await t.route((u) => !u.href.startsWith(kok), (r) => r.abort());
await t.goto(`${kok}/index.html`);
await t.setContent(`<!doctype html><html><head><link rel="stylesheet" href="${kok}/vendor/fonts/fonts.css"><style>
  body{margin:0;width:1024px;height:500px;overflow:hidden;font-family:'Nunito Variable',sans-serif;
    background:radial-gradient(ellipse at 30% 20%,#2a1d63 0%,#0e0a1f 70%);display:flex;align-items:center;gap:48px;padding:0 70px;box-sizing:border-box;color:#f0eeff}
  img{width:300px;height:300px;border-radius:56px;box-shadow:0 0 50px rgba(255,107,53,.45),0 0 90px rgba(74,158,255,.3)}
  h1{margin:0 0 14px;font-family:'Fredoka Variable',sans-serif;font-weight:700;font-size:76px;line-height:1;background:linear-gradient(135deg,#ff6b35,#ffd34d 50%,#4a9eff);-webkit-background-clip:text;color:transparent}
  p{margin:0 0 10px;font-family:'Fredoka Variable',sans-serif;font-size:34px;font-weight:600}
  small{font-size:24px;color:#c9c4ef}
</style></head><body><img src="${kok}/icon.jpg" alt=""><div><h1>Kelime Bilcek</h1><p>Türkçe kelime düellosu</p>
<small>Hızlı · Sıra Beklicek · Zincir — arkadaşınla ya da yapay zekâya karşı</small></div></body></html>`);
await t.evaluate(() => document.fonts.ready); await t.waitForTimeout(300);
await t.screenshot({ path: path.join(CIKTI, 'tanitim-gorseli-1024x500.png') });
console.log('magaza/play/tanitim-gorseli-1024x500.png');

await tarayici.close();
sunucu.close();
