// Play mağaza görselleri: her dil için 6 telefon ekran görüntüsü (1080×1920) ve tanıtım görseli (1024×500).
// 3.13.0: oyun ve boss kareleri yeni engelleri gösterir (Yeşil Orman, Mor Şato), menüde kupa, 6. kare Arkadaşlar.
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
      save.playerName = 'Kiki'; save.para = 1250; save.elmas = 14; save.zumrut = 6; save.kupa = 3; save.highestLevel = 7; persistSave();
      try { localStorage.setItem(VERSION_KEY, APP_VERSION); } catch (_) {}
      showScreen('screen-menu'); refreshMenu();
    });
    await p.waitForTimeout(400);
    await p.screenshot({ path: path.join(cikis, 'telefon-1-menu.png') });
    await p.evaluate(() => openCharacters()); await p.waitForTimeout(400);
    await p.screenshot({ path: path.join(cikis, 'telefon-4-karakterler.png') });
    await p.evaluate(() => openShop()); await p.waitForTimeout(400);
    await p.screenshot({ path: path.join(cikis, 'telefon-5-magaza.png') });
    // Arkadaşlar (3.13.0): kod kartı, gelen istek, çevrimiçi / odada / çevrimdışı arkadaşlar (sunucu yok, veri elle)
    await p.evaluate(() => {
      Object.assign(sosyal, { uid: 'u1', kod: 'K7MP2Q', hazir: true, hata: null, bagli: true,
        istekler: { u5: { name: 'Mila', at: Date.now() } }, gonderilen: {}, engeller: {}, davetler: {},
        arkadaslar: { u2: { name: 'Can', at: 1 }, u3: { name: 'Deniz', at: 1 }, u4: { name: 'Ece', at: 1 }, u6: { name: 'Lara', at: 1 } },
        durumlar: { u2: { name: 'Can', charKey: 'kornet', costumeIdx: 0, state: 'on', at: 1 }, u3: { name: 'Deniz', charKey: 'mark', costumeIdx: 0, state: 'room', at: 1 },
          u6: { name: 'Lara', charKey: 'veryi', costumeIdx: 0, state: 'on', at: 1 } } });
      openFriends();
    });
    await p.waitForTimeout(400);
    await p.screenshot({ path: path.join(cikis, 'telefon-6-arkadaslar.png') });
    // Oyun ve boss: engellerin en çok göründüğü boş yere oyuncu konur (engel-bicim.test --ekran yöntemi; alt %26 joystick
    // ve çanta, üst %16 göstergeler puana girmez). Güçlendirme toplanmaz (görünmezlik ya da hız bildirimi kareyi bozmasın).
    // Hasar yok: invuln > 0 iken oyuncu 0,1 sn'de bir çizilmez (yanıp söner), damagePlayer da canı düşürüp invuln koyar.
    const sahne = (bolum) => p.evaluate((bolum) => {
      startGame(); game.level = bolum; buildWalls(); buildWaters(); buildHazards();
      const W = game.W, H = game.H; let en = null;
      for (let x = 200; x < game.worldW - 200; x += 30) for (let y = 260; y < game.worldH - 260; y += 30) {
        if (collidesWalls(x, y, 30) || collidesWaters(x, y, 30) || collidesSpikes(x, y, 30) || collidesLavas(x, y, 30)) continue;
        const tam = (o) => o.x > x - W / 2 && o.x + o.w < x + W / 2 && o.y > y - H / 2 + H * 0.16 && o.y + o.h < y + H / 2 - H * 0.26;
        const puan = game.walls.slice(4).filter(tam).length * 3 + game.waters.filter(tam).length * 3 + game.spikes.concat(game.lavas).filter(tam).length * 2;
        if (!en || puan > en.puan) en = { x, y, puan };
      }
      game.player.x = en.x; game.player.y = en.y;
      damagePlayer = () => {};
      game.player.invuln = 0; game.bossSpawnTimer = 1e9;
      clearInterval(window.gucsuz);
      window.gucsuz = setInterval(() => { game.pickups = game.pickups.filter((k) => k.kind !== 'guc'); game.player.power = null; }, 50);
    }, bolum);
    await sahne(8); // Yeşil Orman
    await p.evaluate(() => {
      game.player.range = 1;
      setTimeout(() => { game.player.range = 260; }, 5200);
    });
    await p.waitForTimeout(7000);
    await p.evaluate(() => { game.bossSpawnTimer = 24.4; });
    await p.waitForTimeout(150);
    await p.screenshot({ path: path.join(cikis, 'telefon-2-oyun.png') });
    await sahne(7); // Mor Şato
    await p.waitForTimeout(5000);
    await p.evaluate(() => { game.bossSpawnTimer = 0.05; });
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
