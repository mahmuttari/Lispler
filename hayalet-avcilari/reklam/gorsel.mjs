// Google Ads Uygulama kampanyası görselleri: oyunun gerçek sahneleri (göstergeler, joystick ve Bot gizli) + simge, ad ve
// tek satır alt yazı. Boyutlar Uygulama kampanyasının üç oranı: yatay 1,91:1 (1200×628), kare 1:1 (1200×1200), dikey 4:5
// (1200×1500). Sahneler dilden bağımsız bir kez çekilir, yazılar dil başına eklenir (metinler.json › ad, sahne).
// Kullanım: node hayalet-avcilari/reklam/gorsel.mjs [dil…]   (Playwright + Chromium gerekir; dil: tr en es ar hi zh)
// Çıktı: reklam/gorseller/<dil>/<sahne>-<genişlik>x<yükseklik>.jpg
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const WWW = path.join(KOK, 'www');
const METIN = JSON.parse(fs.readFileSync(path.join(KOK, 'reklam', 'metinler.json'), 'utf8'));
export const DILLER = Object.keys(METIN).filter((k) => !k.startsWith('_'));

// Oyun alanı CSS piksel ve ölçek: kısa kenar 600'ü geçerse oyun tablet sayar ve kamerayı 1,35 yakınlaştırır (game.js ›
// resizeCanvas); dikeyde bu yakınlık karakterleri büyütür, istenir. Oyun en çok 2 kat ölçekle çizer.
export const BOYUTLAR = {
  yatay: { w: 1200, h: 628, oyun: { w: 453, h: 419, olcek: 1.5 } },
  kare: { w: 1200, h: 1200, oyun: { w: 600, h: 490, olcek: 2 } },
  dikey: { w: 1200, h: 1500, oyun: { w: 600, h: 620, olcek: 2 } },
};
export const SAHNELER = ['oyun', 'boss', 'tur'];

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const secim = process.argv.slice(2).length ? process.argv.slice(2) : DILLER;
  for (const d of secim) if (!DILLER.includes(d)) throw new Error(`bilinmeyen dil: ${d} (${DILLER.join(' ')})`);
  const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
  const { chromium } = await import(pathToFileURL(PW).href);
  const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.m4a': 'audio/mp4' };
  const sunucu = http.createServer((q, r) => {
    const f = path.join(WWW, decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html');
    if (!f.startsWith(WWW) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'content-type': TUR[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
  }).listen(0);
  const adres = `http://127.0.0.1:${sunucu.address().port}/index.html`;
  const ikon = 'data:image/png;base64,' + fs.readFileSync(path.join(WWW, 'icon-1024.png')).toString('base64');
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });

  // Sahne çekimi (araclar/magaza-gorsel.mjs'deki yöntem): engellerin en çok göründüğü boş yere oyuncu konur, hasar ve
  // güçlendirme kapalı. Göstergeler, joystick, çanta, bildirim ve Bot gizlenir: görüntüde yalnız oyun dünyası kalır.
  async function cek(boyut, sahne) {
    const o = BOYUTLAR[boyut].oyun;
    const p = await b.newPage({ viewport: { width: o.w, height: o.h }, deviceScaleFactor: o.olcek });
    await p.addInitScript(() => { localStorage.setItem('hayaletAvcilariDil', 'tr'); });
    await p.route(/gstatic\.com|googleapis|firebase/, (r) => r.abort());
    await p.goto(adres, { waitUntil: 'load' });
    await p.addStyleTag({ content: '.hud,.pause-btn,#joystick,#inv-btn,#inv-panel,#weapon-bar,#power-bar,#bekleme,#btn-tur-diril,#toast{display:none!important}' });
    await p.waitForTimeout(800);
    await p.evaluate(() => {
      save.playerName = 'Kiki'; save.highestLevel = 7; persistSave();
      try { localStorage.setItem(VERSION_KEY, APP_VERSION); } catch (_) {}
    });
    await p.evaluate(([bolum, tur]) => {
      if (tur) startGame({ tur: true, ulke: ulkeKodla(tur).sira });
      else { startGame(); game.level = bolum; buildWalls(); buildWaters(); buildHazards(); }
      game.bot = null;
      const W = game.W, H = game.H; let en = null;
      // Görüş alanı dünyanın içinde kalsın (kenardaki çit kareye girmesin)
      const mx = Math.max(200, W / 2 + 60), my = Math.max(200, H / 2 + 60);
      for (let x = mx; x < game.worldW - mx; x += 30) for (let y = my; y < game.worldH - my; y += 30) {
        if (collidesWalls(x, y, 30) || collidesWaters(x, y, 30) || collidesSpikes(x, y, 30) || collidesLavas(x, y, 30)) continue;
        const tam = (k) => k.x > x - W / 2 && k.x + k.w < x + W / 2 && k.y > y - H / 2 && k.y + k.h < y + H / 2;
        const duvar = game.walls.slice(4).filter(tam).reduce((s, k) => s + (tur && /^obje/.test(k.tur) ? 8 : 3), 0);
        const puan = duvar + game.waters.filter(tam).length * 3 + game.spikes.concat(game.lavas).filter(tam).length * 2;
        if (!en || puan > en.puan) en = { x, y, puan };
      }
      game.player.x = en.x; game.player.y = en.y;
      damagePlayer = () => {};
      game.player.invuln = 0; game.bossSpawnTimer = 1e9;
      clearInterval(window.gucsuz);
      window.gucsuz = setInterval(() => { game.pickups = game.pickups.filter((k) => k.kind !== 'guc'); game.player.power = null; }, 50);
    }, sahne === 'oyun' ? [8, null] : sahne === 'boss' ? [7, null] : [0, 'JP']);
    if (sahne === 'oyun') {
      // Hayaletler yaklaşsın, oyuncu ateş etmesin (menzil 1); çekimden hemen önce ateş açılır
      await p.evaluate(() => { game.player.range = 1; setTimeout(() => { game.player.range = 260; }, 4600); });
      await p.waitForTimeout(5400);
      // Oyuncunun üstüne binmiş hayalet kareyi bozar
      await p.evaluate(() => { game.ghosts = game.ghosts.filter((g) => Math.hypot(g.x - game.player.x, g.y - game.player.y) > 90); });
      await p.waitForTimeout(150);
    } else {
      await p.waitForTimeout(4000);
      await p.evaluate(() => { game.bossSpawnTimer = 0.05; });
      await p.waitForTimeout(3500);
      await p.evaluate((tur) => {
        game.player.invuln = 0;
        // Boss oyuncunun sağında, çerçevenin içinde durur; çekim sürerken yürümez ve ateş etmez. Dünya Turu'nda boss ve
        // ülkenin objeleri öne çıksın diye öteki hayaletler kalkar; Mor Şato'da oyuncuya ya da bossa binenler kalkar
        const P = game.player, bs = game.ghosts.find((g) => g.isBoss);
        // Boss oyuncunun yanında duvarsız ve çerçevenin içinde bir yere konur (duvara konan boss dışarı itilir); vurulan
        // boss geri itildiği için her karede yerine konur
        const aday = [[150, -30], [150, 40], [-150, -30], [-150, 40], [110, -120], [-110, -120], [110, 120], [-110, 120]]
          .find(([dx, dy]) => !collidesWalls(P.x + dx, P.y + dy, 60) && Math.abs(dx) + 60 < game.W / 2 && Math.abs(dy) + 70 < game.H / 2) || [150, -30];
        const yer = () => { if (bs) { bs.x = P.x + aday[0]; bs.y = P.y + aday[1]; bs.speed = 0; bs.nextShot = performance.now() + 1e9; requestAnimationFrame(yer); } };
        yer();
        // Mor Şato'da en çok üç minik hayalet kalır: oyuncuya ve bossa binmeyen, çerçevenin içinde duranlar
        const icerde = (g) => Math.abs(g.x - P.x) < game.W / 2 - 50 && Math.abs(g.y - P.y) < game.H / 2 - 50;
        const serbest = (g) => Math.hypot(g.x - P.x, g.y - P.y) > 130 && (!bs || Math.hypot(g.x - bs.x, g.y - bs.y) > 170);
        const kalan = tur ? [] : game.ghosts.filter((g) => !g.isBoss && icerde(g) && serbest(g)).slice(0, 3);
        game.ghosts = game.ghosts.filter((g) => g.isBoss || kalan.includes(g));
      }, sahne === 'tur');
      await p.waitForTimeout(250);
    }
    const png = await p.screenshot();
    await p.close();
    return 'data:image/png;base64,' + png.toString('base64');
  }

  // Yazı payı resmin en çok beşte biri kadar tutulur; reklam düğmesini (Yükle) Google ekler, görselde düğme yok
  function sayfa(boyut, dil, sahne, resim) {
    const { w, h } = BOYUTLAR[boyut];
    const m = METIN[dil], rtl = dil === 'ar', yon = rtl ? 'rtl' : 'ltr';
    const uzun = m.ad.length > 14 && dil === 'es';
    const ust = boyut === 'yatay' ? 0 : boyut === 'kare' ? 220 : 260;
    const govde = boyut === 'yatay'
      ? `<div class="sol"><img class="ikon" src="${ikon}"><h1>${m.ad}</h1><p>${m.sahne[sahne]}</p></div><div class="oyun" style="${rtl ? 'left' : 'right'}:0"></div>`
      : `<div class="ust"><img class="ikon" src="${ikon}"><div><h1>${m.ad}</h1><p>${m.sahne[sahne]}</p></div></div><div class="oyun"></div>`;
    return `<!doctype html><html dir="${yon}" lang="${dil}"><head><meta charset="utf-8"><style>
      html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden;font-family:system-ui,sans-serif;color:#fff}
      body{background:radial-gradient(circle at ${rtl ? '80%' : '20%'} 30%,#5b2a9e 0,#2a1150 50%,#1a0b2e 100%);position:relative}
      .oyun{position:absolute;background:url(${resim}) center/cover no-repeat}
      h1{margin:0;font-weight:900;line-height:1.05;text-shadow:0 5px 0 #3b0764,0 8px 24px rgba(0,0,0,.6)}
      p{margin:0;font-weight:800;color:#fde047;text-shadow:0 3px 0 #3b0764}
      .ikon{border-radius:22%;box-shadow:0 12px 34px rgba(0,0,0,.55);flex:none}
      .sol{position:absolute;top:0;bottom:0;${rtl ? 'right' : 'left'}:0;width:540px;box-sizing:border-box;padding:0 44px;display:flex;flex-direction:column;justify-content:center;gap:20px;z-index:1}
      .sol .ikon{width:150px;height:150px}.sol h1{font-size:${uzun ? 52 : 64}px}.sol p{font-size:34px}
      ${boyut === 'yatay' ? `.oyun{top:0;bottom:0;width:680px;-webkit-mask-image:linear-gradient(${rtl ? 'to left' : 'to right'},transparent 0,#000 90px)}` : ''}
      .ust{position:absolute;top:0;left:0;right:0;height:${ust}px;display:flex;align-items:center;gap:34px;padding:0 54px;box-sizing:border-box}
      .ust .ikon{width:${ust - 70}px;height:${ust - 70}px}.ust h1{font-size:${uzun ? 62 : 76}px}.ust p{font-size:40px;margin-top:10px}
      ${boyut === 'yatay' ? '' : `.oyun{top:${ust}px;left:0;right:0;bottom:0;border-top:6px solid #fde047}`}
      </style></head><body>${govde}</body></html>`;
  }

  try {
    const cekimler = {};
    for (const boyut of Object.keys(BOYUTLAR)) for (const sahne of SAHNELER) {
      cekimler[boyut + sahne] = await cek(boyut, sahne);
      console.log(`çekildi: ${boyut} ${sahne}`);
    }
    for (const dil of secim) {
      const cikis = path.join(KOK, 'reklam', 'gorseller', dil);
      fs.mkdirSync(cikis, { recursive: true });
      for (const boyut of Object.keys(BOYUTLAR)) for (const sahne of SAHNELER) {
        const { w, h } = BOYUTLAR[boyut];
        const t = await b.newPage({ viewport: { width: w, height: h } });
        await t.setContent(sayfa(boyut, dil, sahne, cekimler[boyut + sahne]));
        await t.waitForTimeout(200);
        await t.screenshot({ path: path.join(cikis, `${sahne}-${w}x${h}.jpg`), type: 'jpeg', quality: 86 });
        await t.close();
      }
      console.log(`${dil}: ${cikis}`);
    }
  } finally {
    await b.close();
    sunucu.close();
  }
}
