// Hayalet Avcıları: MEN1 menzil ayarı — çevrimdışı sınama.
// Karakter taban menzilleri kısaltıldı; oyuncu mermileri görünür alan + 24 px dışına çıkınca silinir
// ve ekran dışındaki hayaletlere hasar veremez.
// Çalıştırma: node test/men1.test.mjs   (Playwright + Chromium; Firebase gerekmez)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WWW = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);
const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2', '.webp': 'image/webp', '.m4a': 'audio/mp4' };
const sunucu = http.createServer((q, r) => {
  const f = path.join(WWW, decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html');
  if (!f.startsWith(WWW) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': TUR[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(0);
const adres = `http://127.0.0.1:${sunucu.address().port}/index.html`;
const sonuclar = [];
function sina(ad, fn) {
  try { fn(); sonuclar.push(`✓ ${ad}`); } catch (e) { sonuclar.push(`✗ ${ad}: ${e.message.split('\n')[0]}`); }
}
const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const hatalar = [];
try {
  const p = await b.newPage({ viewport: { width: 844, height: 390 } });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript(() => {
    localStorage.setItem('hayaletAvcilariDil', 'tr');
    localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9'); localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1');
    window.Capacitor = { Plugins: { AdMob: {
      initialize: async () => {}, requestConsentInfo: async () => ({ status: 'NOT_REQUIRED', isConsentFormAvailable: false, canRequestAds: true, privacyOptionsRequirementStatus: 'NOT_REQUIRED' }),
      showConsentForm: async () => ({}), addListener: () => Promise.resolve({ remove: async () => {} }),
      prepareInterstitial: async () => {}, prepareRewardVideoAd: async () => {}, showInterstitial: async () => {}, showRewardVideoAd: async () => {}, showPrivacyOptionsForm: async () => {},
    } } };
  });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof startGame === 'function' && typeof fireProjectile === 'function');
  await p.evaluate(() => {
    window.__sahne = () => {
      startGame(); game.paused = true; game.ghosts = []; game.pickups = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
      game.walls = []; game.player.x = 800; game.player.y = 700; game.player.invuln = 1e9; game.bot = null; game.pet = null;
      game.camera.x = game.player.x - game.W / 2; game.camera.y = game.player.y - game.H / 2;
      game.projectiles = []; game.effects = [];
    };
    window.__hayalet = (x, y, hp = 3, ek = {}) => { const g = { x, y, r: 22, speed: 60, hp, maxHp: hp, size: 40, ...ek }; game.ghosts.push(g); return g; };
    window.__ilerle = (sn) => { for (let t = 0; t < sn; t += 1 / 30) update(1 / 30, performance.now() + t * 1000); };
  });

  // a) Taban menziller: eski × 0.75, en yakın 5'e yuvarlanmış
  const eski = { kinkin: 220, veryi: 180, kornet: 280, mark: 230, kent: 200, ponko: 220, gul: 240, rani: 220, beti: 250, fanatik: 280, silsen: 240, sercin: 230 };
  const menziller = await p.evaluate(() => Object.fromEntries(Object.entries(CHARACTERS).map(([k, c]) => [k, c.baseRange])));
  sina('her karakterin baseRange değeri round5(eski × 0.75)', () => {
    for (const [k, v] of Object.entries(eski)) {
      const beklenen = Math.round((v * 0.75) / 5) * 5;
      assert.equal(menziller[k], beklenen, `${k}: ${menziller[k]} ≠ ${beklenen}`);
    }
  });

  // b) Görünüm dışındaki hayalet mermi yolunda olsa da vurulmaz; mermi kenarı geçince silinir
  const dis = await p.evaluate(() => {
    __sahne(); const P = game.player;
    P.range = 0; // otomatik atış karışmasın
    const x = game.camera.x + game.W + 40; // görünür alan + 24 px payın dışında
    const g = __hayalet(x, P.y, 50, { speed: 0 });
    fireProjectile({ x, y: P.y });
    __ilerle(1);
    return { hp: g.hp, mermi: game.projectiles.filter((m) => m.oyuncuMermisi).length };
  });
  sina('görünüm dışındaki hayalet vurulmaz', () => { assert.equal(dis.hp, 50); });
  sina('oyuncu mermisi görünüm dışına çıkınca silinir', () => { assert.equal(dis.mermi, 0); });

  // c) Görünüm içindeki hayalet aynı yolda vurulur
  const ic = await p.evaluate(() => {
    __sahne(); const P = game.player;
    P.range = 0;
    const g = __hayalet(P.x + 100, P.y, 50);
    fireProjectile({ x: g.x, y: g.y });
    __ilerle(0.5);
    return { hp: g.hp };
  });
  sina('görünüm içindeki hayalet vurulur', () => { assert.ok(ic.hp < 50, String(ic.hp)); });
} finally {
  await b.close(); sunucu.close();
}
console.log(sonuclar.join('\n'));
if (hatalar.length) console.log('Sayfa hataları: ' + hatalar.join(' | '));
if (sonuclar.some((s) => s.startsWith('✗'))) process.exit(1);
