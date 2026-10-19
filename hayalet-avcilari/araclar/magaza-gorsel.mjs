// Play mağaza görselleri: her dil için 5 telefon ekran görüntüsü (1080×1920) ve tanıtım görseli (1024×500).
// Kullanım: node hayalet-avcilari/araclar/magaza-gorsel.mjs [play-dili…]   (Playwright + Chromium gerekir)
// Çıktı: tr-TR → magaza/play/, diğerleri → magaza/play/<play-dili>/ (android/play.mjs gorsel bu klasörleri yükler)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const WWW = path.join(KOK, 'www');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);

// Play dili → oyun dili, tanıtım görseli başlığı ve alt yazısı
const DILLER = {
  'tr-TR': { dil: 'tr', baslik: 'Hayalet<br>Avcıları', alt: "👻 Hayaletleri yakala<br>👑 Boss'u yen · 🎩 Kostüm topla" },
  'en-US': { dil: 'en', baslik: 'Ghost<br>Hunters', alt: '👻 Catch the ghosts<br>👑 Beat the boss · 🎩 Collect costumes' },
  'es-ES': { dil: 'es', baslik: 'Cazadores de<br>Fantasmas', alt: '👻 Atrapa fantasmas<br>👑 Vence al jefe · 🎩 Colecciona disfraces', kucuk: true },
  'es-419': { dil: 'es', baslik: 'Cazadores de<br>Fantasmas', alt: '👻 Atrapa fantasmas<br>👑 Vence al jefe · 🎩 Colecciona disfraces', kucuk: true },
  'zh-CN': { dil: 'zh', baslik: '幽灵<br>猎人', alt: '👻 抓幽灵<br>👑 打败BOSS · 🎩 收集服装' },
  'hi-IN': { dil: 'hi', baslik: 'भूत<br>शिकारी', alt: '👻 भूत पकड़ो<br>👑 बॉस को हराओ · 🎩 पोशाकें जमा करो' },
  ar: { dil: 'ar', baslik: 'صيادو<br>الأشباح', alt: '👻 اصطد الأشباح<br>👑 اهزم الزعيم · 🎩 اجمع الأزياء', rtl: true },
};
const secim = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(DILLER);

const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.m4a': 'audio/mp4' };
const sunucu = http.createServer((q, r) => {
  const f = path.join(WWW, decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html');
  if (!f.startsWith(WWW) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': TUR[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(0);
const adres = `http://127.0.0.1:${sunucu.address().port}/index.html`;
const ikon = 'data:image/png;base64,' + fs.readFileSync(path.join(WWW, 'icon-1024.png')).toString('base64');

const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
try {
  for (const playDili of secim) {
    const d = DILLER[playDili];
    const cikis = playDili === 'tr-TR' ? path.join(KOK, 'magaza', 'play') : path.join(KOK, 'magaza', 'play', playDili);
    fs.mkdirSync(cikis, { recursive: true });
    const p = await b.newPage({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3 });
    await p.addInitScript((dil) => { localStorage.setItem('hayaletAvcilariDil', dil); }, d.dil);
    await p.route(/gstatic\.com|googleapis|firebase/, (r) => r.abort());
    await p.goto(adres, { waitUntil: 'load' });
    await p.waitForTimeout(800);
    await p.evaluate(() => {
      save.playerName = 'Kiki'; save.para = 1250; save.elmas = 14; save.zumrut = 6; save.highestLevel = 7; persistSave();
      try { localStorage.setItem(VERSION_KEY, APP_VERSION); } catch (_) {}
      showScreen('screen-menu'); refreshMenu();
    });
    await p.waitForTimeout(400);
    await p.screenshot({ path: path.join(cikis, 'telefon-1-menu.png') });
    await p.evaluate(() => openCharacters()); await p.waitForTimeout(400);
    await p.screenshot({ path: path.join(cikis, 'telefon-4-karakterler.png') });
    await p.evaluate(() => openShop()); await p.waitForTimeout(400);
    await p.screenshot({ path: path.join(cikis, 'telefon-5-magaza.png') });
    await p.evaluate(() => {
      startGame(); game.level = 3; buildWalls(); buildWaters(); buildHazards(); ensurePlayerSafe();
      game.player.invuln = 1e9; game.bossSpawnTimer = 1e9; game.player.range = 1;
      setTimeout(() => { game.player.range = 260; }, 5200);
    });
    await p.waitForTimeout(7000);
    await p.evaluate(() => { game.player.invuln = 0; game.bossSpawnTimer = 24.4; });
    await p.waitForTimeout(150);
    await p.screenshot({ path: path.join(cikis, 'telefon-2-oyun.png') });
    await p.evaluate(() => { game.player.invuln = 1e9; game.bossSpawnTimer = 0.05; });
    await p.waitForTimeout(3500);
    await p.evaluate(() => { game.player.invuln = 0; const bs = game.ghosts.find((g) => g.isBoss); if (bs) { bs.x = game.player.x + 40; bs.y = game.player.y - 170; } });
    await p.waitForTimeout(250);
    await p.screenshot({ path: path.join(cikis, 'telefon-3-boss.png') });
    await p.close();

    const t = await b.newPage({ viewport: { width: 1024, height: 500 } });
    const yon = d.rtl ? 'rtl' : 'ltr';
    await t.setContent(`<!doctype html><html dir="${yon}"><head><meta charset="utf-8"><style>
      html,body{margin:0;width:1024px;height:500px;overflow:hidden;font-family:system-ui,sans-serif;color:#fff}
      body{background:radial-gradient(circle at ${d.rtl ? '75%' : '25%'} 40%,#5b2a9e 0,#2a1150 45%,#1a0b2e 100%);display:flex;align-items:center;gap:44px;padding:0 64px;box-sizing:border-box}
      img{width:300px;height:300px;border-radius:62px;box-shadow:0 18px 50px rgba(0,0,0,.55);flex:none}
      h1{margin:0 0 22px;font-size:${d.kucuk ? 62 : 82}px;line-height:1.08;font-weight:900;text-shadow:0 6px 0 #3b0764,0 10px 30px rgba(0,0,0,.6)}
      p{margin:0;font-size:29px;line-height:1.4;font-weight:700;color:#fde047;text-shadow:0 3px 0 #3b0764}
      .g{position:absolute;font-size:60px;opacity:.85}</style></head><body>
      <img src="${ikon}"><div><h1>${d.baslik}</h1><p>${d.alt}</p></div>
      <div class="g" style="${d.rtl ? 'left' : 'right'}:40px;top:26px">👻</div><div class="g" style="${d.rtl ? 'left' : 'right'}:110px;bottom:24px;font-size:46px">👻</div>
      </body></html>`);
    await t.waitForTimeout(300);
    await t.screenshot({ path: path.join(cikis, 'tanitim-gorseli-1024x500.png') });
    await t.close();
    console.log(`${playDili}: ${cikis}`);
  }
} finally {
  await b.close();
  sunucu.close();
}
