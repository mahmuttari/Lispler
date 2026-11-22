// Hayalet Avcıları: yeni kasırga (3.18.0) — çevrimdışı sınama.
// Kullanıcının isteği: "tornado efekti çok güzel olsun, mesela hayaletleri savura savura yok etsin veya hasar versin".
// Çalıştırma: node hayalet-avcilari/test/kasirga.test.mjs   (Playwright + Chromium; ağ gerekmez)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WWW = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);
const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2', '.m4a': 'audio/mp4' };
const sunucu = http.createServer((q, r) => {
  const f = path.join(WWW, decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html');
  if (!f.startsWith(WWW) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': TUR[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(0);
const adres = `http://127.0.0.1:${sunucu.address().port}/index.html`;
const EKRAN = process.env.KASIRGA_EKRAN; // verilirse: <önek>.png

const sonuclar = [];
function sina(ad, fn) {
  try { fn(); sonuclar.push(`✓ ${ad}`); } catch (e) { sonuclar.push(`✗ ${ad}: ${e.message.split('\n')[0]}`); }
}
const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const hatalar = [];
const p = await b.newPage({ viewport: { width: 844, height: 390 } });
p.on('pageerror', (e) => hatalar.push(e.message));
await p.addInitScript(() => { localStorage.setItem('hayaletAvcilariDil', 'tr'); localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9'); });
await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
await p.goto(adres, { waitUntil: 'load' });
await p.waitForFunction(() => typeof kasirgaCiz === 'function' && typeof startGame === 'function');
await p.evaluate(() => {
  // Açık alanda sahne: duvar yok, oyuncu hasar almaz (temas sınaması ayrıca sayaçla yapılır)
  window.__sahne = () => {
    startGame(); game.paused = true; game.ghosts = []; game.pickups = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
    game.walls = []; game.player.x = 800; game.player.y = 700; game.player.invuln = 0; game.bot = null;
    game.camera.x = game.player.x - game.W / 2; game.camera.y = game.player.y - game.H / 2;
  };
  window.__hayalet = (x, y, hp = 3, ek = {}) => { const g = { x, y, r: 22, speed: 60, hp, maxHp: hp, size: 40, ...ek }; game.ghosts.push(g); return g; };
  window.__ilerle = (sn) => { for (let t = 0; t < sn; t += 1 / 30) update(1 / 30, performance.now()); };
});
try {
  const r = await p.evaluate(() => {
    const o = {};
    __sahne();
    const P = game.player;
    const yakin = __hayalet(P.x + 110, P.y, 50);  // canı çok: dönüşü izlemek için
    const uzak = __hayalet(P.x + 400, P.y, 3);
    const bs = __hayalet(P.x - 100, P.y, 200, { isBoss: true, r: 44, size: 80, speed: 0 }); // yerinde: boss kasırgaya kapılmaz, yürüse oyuncuya değebilir
    let carpma = 0; const eskiHasar = window.damagePlayer; window.damagePlayer = () => { carpma++; };
    P.kasirgaUntil = performance.now() + 8000;
    const aci0 = Math.atan2(yakin.y - P.y, yakin.x - P.x);
    let aciToplam = 0, onceki = aci0, enYakin = 1e9;
    for (let i = 0; i < 60; i++) {
      update(1 / 30, performance.now());
      const a = Math.atan2(yakin.y - P.y, yakin.x - P.x); let d = a - onceki; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI;
      aciToplam += d; onceki = a; enYakin = Math.min(enYakin, Math.hypot(yakin.x - P.x, yakin.y - P.y));
    }
    o.yakin = { tur: Math.abs(aciToplam) / (Math.PI * 2), uzaklik: Math.hypot(yakin.x - P.x, yakin.y - P.y), enYakin, yakalandi: !!yakin.kasirgaYorunge, can: yakin.hp };
    o.uzak = { yakalandi: !!uzak.kasirgaYorunge, can: uzak.hp };
    o.boss = { yakalandi: !!bs.kasirgaYorunge, can: bs.hp };
    o.carpma = carpma;
    // Oyuncu yürürse yakalanan hayalet onunla gelir
    P.x += 60; __ilerle(0.5);
    o.izledi = Math.hypot(yakin.x - P.x, yakin.y - P.y) < 100;
    // Kasırga bitince bırakılır ve yeniden kovalar
    P.kasirgaUntil = 0; const once = Math.hypot(yakin.x - P.x, yakin.y - P.y); __ilerle(0.2);
    o.birakti = !yakin.kasirgaYorunge;
    window.damagePlayer = eskiHasar;
    return o;
  });
  sina('yakındaki hayalet içine çekilir ve oyuncunun çevresinde döner (2 sn\'de en az 1 tur)', () => {
    assert.equal(r.yakin.yakalandi, true); assert.ok(r.yakin.tur >= 1, String(r.yakin.tur));
    assert.ok(r.yakin.uzaklik >= 55 && r.yakin.uzaklik <= 100, String(r.yakin.uzaklik));
  });
  sina('yakalanan hayalet hasar alır (3 can/sn) ama oyuncuya değmez', () => {
    assert.ok(r.yakin.can < 50 && r.yakin.can > 40, String(r.yakin.can)); assert.ok(r.yakin.enYakin >= 55, String(r.yakin.enYakin)); assert.equal(r.carpma, 0);
  });
  sina('uzaktaki hayalete dokunmaz', () => { assert.equal(r.uzak.yakalandi, false); assert.equal(r.uzak.can, 3); });
  sina('boss yakalanmaz ama yerinde hasar alır (8 can/sn)', () => { assert.equal(r.boss.yakalandi, false); assert.ok(r.boss.can < 190, String(r.boss.can)); });
  sina('oyuncu yürüyünce yakalanan hayalet onunla gelir; kasırga bitince bırakılır', () => { assert.equal(r.izledi, true); assert.equal(r.birakti, true); });

  const olum = await p.evaluate(() => {
    __sahne();
    const P = game.player; P.kasirgaUntil = performance.now() + 8000;
    for (let i = 0; i < 5; i++) __hayalet(P.x + Math.cos(i) * 100, P.y + Math.sin(i) * 100, 1);
    __ilerle(0.6);
    const izler = game.effects.filter((e) => e.type === 'ghostFade');
    const savrulan = izler.filter((e) => e.savrul);
    const x0 = savrulan.map((e) => Math.hypot(e.x - P.x, e.y - P.y));
    for (let i = 0; i < 6; i++) updateEffects(1 / 30);
    const x1 = savrulan.map((e) => Math.hypot(e.x - P.x, e.y - P.y));
    return { kalan: game.ghosts.length, iz: izler.length, savrulan: savrulan.length, disari: x1.every((d, i) => d > x0[i]), don: savrulan.every((e) => e.don > 0) };
  });
  sina('canı az hayaletler kasırgada ölür', () => { assert.equal(olum.kalan, 0); assert.equal(olum.iz, 5); });
  sina('ölen hayalet dönerek dışarı savrulur', () => { assert.equal(olum.savrulan, 5); assert.equal(olum.disari, true); assert.equal(olum.don, true); });

  const normal = await p.evaluate(() => {
    __sahne(); const P = game.player; P.kasirgaUntil = 0;
    const g = __hayalet(P.x + 300, P.y, 1); g.hp = 0; killGhost(g, 0);
    const e = game.effects.find((x) => x.type === 'ghostFade');
    return { savrul: !!e.savrul };
  });
  sina('kasırga yokken ölen hayalet eskisi gibi yukarı süzülür', () => { assert.equal(normal.savrul, false); });

  const ciz = await p.evaluate(() => {
    let hata = null; let ms = 0;
    try {
      __sahne(); const P = game.player; P.kasirgaUntil = performance.now() + 8000;
      for (let i = 0; i < 6; i++) __hayalet(P.x + Math.cos(i) * 90, P.y + Math.sin(i) * 90, 40);
      __ilerle(0.4); render();
      const t0 = performance.now(); for (let i = 0; i < 60; i++) render(); ms = (performance.now() - t0) / 60;
      // Saydamlık: başta belirir, sonda kaybolur
      const c = document.createElement('canvas').getContext('2d');
      kasirgaCiz(c, 0, 0, 1000, 1000 + 8000 - 1); kasirgaCiz(c, 0, 0, 9000, 9000);
    } catch (e) { hata = e.message; }
    return { hata, ms };
  });
  if (EKRAN) await p.screenshot({ path: `${EKRAN}.png` });
  sina('kasırga, hortumlar ve dönen hayaletler hatasız çizilir; kare 12 ms\'den kısa', () => { assert.equal(ciz.hata, null); assert.ok(ciz.ms < 12, String(ciz.ms)); });

  const durum = await p.evaluate(() => {
    __sahne(); const P = game.player; P.kasirgaUntil = performance.now() + 8000;
    const g = __hayalet(P.x + 80, P.y, 20); __ilerle(0.3);
    // Çevrimiçi duruma yalnız bilinen alanlar yazılır (kasırga yörüngesi eşitlenmez)
    const kaynak = durumuGonder.toString();
    return { yorungeVar: !!g.kasirgaYorunge, eşitlenmez: !/kasirgaYorunge/.test(kaynak) };
  });
  sina('kasırga yörüngesi çevrimiçi duruma yazılmaz', () => { assert.equal(durum.yorungeVar, true); assert.equal(durum['eşitlenmez'], true); });
  sina('sayfa hatası yok', () => { assert.deepEqual(hatalar, []); });
} catch (e) {
  sonuclar.push(`✗ akış yarıda kaldı: ${e.message.split('\n')[0]}`);
} finally {
  await b.close();
  sunucu.close();
}
sonuclar.forEach((s) => console.log(s));
const kalan = sonuclar.filter((s) => s.startsWith('✗'));
assert.equal(kalan.length, 0, `${kalan.length} sınama başarısız`);
console.log(`TAMAM: ${sonuclar.length} sınama`);
