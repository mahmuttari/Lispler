// Hayalet Avcıları: kod animasyonları (3.18.0) — çevrimdışı sınama.
// Kullanıcının isteği: "Animasyonlar ekleyebilirsin, statik olmak zorunda değil, kendin önerilerde de bulunabilirsin."
// Animasyonlar yalnız görüntüdür: hayaletin konumu, canı, yarıçapı ve oyun kuralları değişmez.
// Çalıştırma: node hayalet-avcilari/test/anim.test.mjs   (Playwright + Chromium; ağ gerekmez)
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
const EKRAN = process.env.ANIM_EKRAN; // verilirse: <önek>-oyun.png

const sonuclar = [];
function sina(ad, fn) {
  try { fn(); sonuclar.push(`✓ ${ad}`); } catch (e) { sonuclar.push(`✗ ${ad}: ${e.message.split('\n')[0]}`); }
}
const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const hatalar = [];
async function sayfa(azHareket) {
  const p = await b.newPage({ viewport: { width: 844, height: 390 } });
  if (azHareket) await p.emulateMedia({ reducedMotion: 'reduce' });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('hayaletAvcilariDil', 'tr'); localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9'); localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1'); });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof hayaletAnim === 'function' && typeof startGame === 'function');
  await p.evaluate(() => {
    window.__bolum = (n) => {
      startGame(); game.paused = true; game.ghosts = []; game.spawnTimer = -1e9; game.player.invuln = 1e9;
      while (game.level < n) nextLevel();
      game.paused = true; game.ghosts = []; game.pickups = [];
    };
  });
  return p;
}
try {
  const p = await sayfa(false);
  const r = await p.evaluate(() => {
    const o = {};
    const T = 100000;
    // Doğuş
    const g = { x: 300, y: 300, hp: 2, maxHp: 2, size: 40 };
    const a0 = hayaletAnim(g, T);
    const a1 = hayaletAnim(g, T + ANIM.dogusSn * 1000 + 10);
    o.dogus = { alfa0: a0.alfa, sx0: a0.sx, alfa1: a1.alfa, sx1: a1.sx };
    // Süzülme: zamanla dy değişir ve genlik sınırlı
    const dys = []; for (let t = 0; t < 3000; t += 50) dys.push(hayaletAnim(g, T + 1000 + t).dy);
    o.suzulme = { en: Math.min(...dys), ec: Math.max(...dys) };
    // Vurulma
    g.hp = 1; const v = hayaletAnim(g, T + 5000); const v2 = hayaletAnim(g, T + 5000 + ANIM.vurulmaSn * 1000 + 5);
    o.vurulma = { beyaz: v.beyaz, sonra: v2.beyaz };
    // Göz kırpma: 12 saniyede en az 2 kez
    let kirp = 0, onceki = false;
    for (let t = 0; t < 12000; t += 16) { const k = hayaletAnim(g, T + 6000 + t).kirp; if (k && !onceki) kirp++; onceki = k; }
    o.kirp = kirp;
    // Solan iz (ghostFade) için kod animasyonu çalışmaz
    o.iz = hayaletAnim({ x: 0, y: 0, hp: 0, maxHp: 1, size: 40, life: 1, maxLife: 1 }, T);
    // Atıcı: atıştan hemen önce şarj
    const at = { x: 0, y: 0, hp: 2, maxHp: 2, size: 40, canShoot: true, nextShot: T + 30000 };
    hayaletAnim(at, T + 29000);
    o.sarj = { once: hayaletAnim(at, T + 29000).sarj, yakin: hayaletAnim(at, T + 29900).sarj };
    // Boss inişi: yukarıdan düşer, inince bir kez dalga işareti
    const bs = { x: 0, y: 0, hp: 20, maxHp: 20, size: 80, isBoss: true };
    const b0 = hayaletAnim(bs, T);
    let inis = 0; for (let t = 0; t <= 1500; t += 16) inis += hayaletAnim(bs, T + t).inis;
    o.boss = { dy0: b0.dy, inis, sonDy: Math.abs(hayaletAnim(bs, T + 3000).dy) };
    // Para dönüşü ve efektler
    const sxs = []; for (let t = 0; t < 2000; t += 40) sxs.push(paraDonusu(T + t, 10).sx);
    o.para = { en: Math.min(...sxs), ec: Math.max(...sxs) };
    animEfektleri.length = 0;
    toplamaEfekti({ kind: 'elmas', x: 10, y: 10 });
    // N13: an-elmas/toplama-halka kareleri yüklüyse efekt ChatGPT kare efektidir (tur 'kare', renk alanı yok); yoksa renkli halka
    o.topla = { sayi: animEfektleri.length, renk: animEfektleri[0] && animEfektleri[0].renk, tur: animEfektleri[0] && animEfektleri[0].tur, ad: animEfektleri[0] && animEfektleri[0].ad };
    const cv = document.createElement('canvas'); const c = cv.getContext('2d');
    animEfektleriCiz(c, animEfektleri[0].bas + 100); o.toplaSurer = animEfektleri.length;
    animEfektleriCiz(c, animEfektleri[0].bas + Math.max(ANIM.toplaSn, animEfektleri[0].sure || 0) * 1000 + 50); o.toplaBitti = animEfektleri.length;
    for (let i = 0; i < 100; i++) animEfektEkle('topla', 0, 0); o.tavan = animEfektleri.length;
    animEfektleri.length = 0;
    o.nefes = { dur: avciNefes(T + 300, false) !== 0 || avciNefes(T + 900, false) !== 0, yuru: avciNefes(T + 300, true) };
    return o;
  });
  sina('hayalet doğarken saydamdan belirir ve küçükten büyür', () => {
    assert.equal(r.dogus.alfa0, 0); assert.ok(r.dogus.sx0 < 0.5, String(r.dogus.sx0));
    assert.equal(r.dogus.alfa1, 1); assert.ok(Math.abs(r.dogus.sx1 - 1) < 0.05, String(r.dogus.sx1));
  });
  sina('hayalet yerinde süzülür (±3 px içinde)', () => {
    assert.ok(r.suzulme.ec - r.suzulme.en > 3, JSON.stringify(r.suzulme));
    assert.ok(r.suzulme.en >= -3 && r.suzulme.ec <= 3, JSON.stringify(r.suzulme));
  });
  sina('vurulunca kısa beyaz parlama, sonra geçer', () => { assert.ok(r.vurulma.beyaz > 0.9); assert.equal(r.vurulma.sonra, 0); });
  sina('hayaletler göz kırpar (12 sn\'de 2-5 kez)', () => { assert.ok(r.kirp >= 2 && r.kirp <= 5, String(r.kirp)); });
  sina('solan iz kendi animasyonunu alır (kod animasyonu dokunmaz)', () => {
    assert.equal(r.iz.alfa, 1); assert.equal(r.iz.dy, 0); assert.equal(r.iz.sx, 1);
  });
  sina('atıcı hayalet atıştan hemen önce parlar', () => { assert.equal(r.sarj.once, 0); assert.ok(r.sarj.yakin > 0.6, String(r.sarj.yakin)); });
  sina('boss yukarıdan iner, yere değince bir kez dalga yayılır', () => {
    assert.ok(r.boss.dy0 <= -100, String(r.boss.dy0)); assert.equal(r.boss.inis, 1); assert.ok(r.boss.sonDy <= 3, String(r.boss.sonDy));
  });
  sina('para döner (kenardan görünüşte incelir)', () => { assert.ok(r.para.en < 0.3 && r.para.ec > 0.95, JSON.stringify(r.para)); });
  sina('toplanınca renkli halka açılır ve süresi bitince silinir; liste taşmaz', () => {
    assert.equal(r.topla.sayi, 1);
    if (r.topla.tur === 'kare') assert.equal(r.topla.ad, 'toplama-halka'); // kare efekti: ad var, süresi bitince silinir
    else { assert.equal(r.topla.tur, 'topla'); assert.equal(r.topla.renk, '96, 165, 250'); }
    assert.equal(r.toplaSurer, 1); assert.equal(r.toplaBitti, 0); assert.ok(r.tavan <= 61, String(r.tavan));
  });
  sina('avcı dururken nefes alır, yürürken almaz', () => { assert.equal(r.nefes.dur, true); assert.equal(r.nefes.yuru, 0); });

  const oyun = await p.evaluate(() => {
    let hata = null; const o = {};
    try {
      __bolum(5);
      game.camera.x = Math.max(0, game.player.x - game.W / 2); game.camera.y = Math.max(0, game.player.y - game.H / 2);
      for (let i = 0; i < 6; i++) spawnGhost();
      game.ghosts.forEach((g, i) => { g.x = game.player.x - 200 + i * 70; g.y = game.player.y - 90; g.speed = 0; });
      spawnBoss(); const bs = game.ghosts.find((x) => x.isBoss); bs.x = game.player.x + 160; bs.y = game.player.y + 40; bs.speed = 0;
      game.pickups.push({ kind: 'para', value: 1, x: game.player.x - 80, y: game.player.y + 60 },
                        { kind: 'elmas', value: 1, x: game.player.x - 40, y: game.player.y + 60 },
                        { kind: 'zumrut', value: 1, x: game.player.x, y: game.player.y + 60 });
      render();
      game.ghosts[0].hp -= 1; render();               // vurulma parlaması
      const g0 = game.ghosts[1]; killGhost(g0, 1);    // ölüm "puf"u
      for (const e of game.effects) if (e.type === 'ghostFade') e.life = 0.5;
      collectPickup(game.pickups[0]);
      render();
      o.koord = game.ghosts.every((g) => Number.isFinite(g.x) && Number.isFinite(g.y));
      o.yalnizGorselAlan = Object.keys(game.ghosts[0]).filter((k) => k.startsWith('__')).every((k) => ['__faz', '__dogus', '__kirp', '__sonHp', '__vurulma', '__indi'].includes(k));
      // Hız: 40 hayalet ve 20 para çizimi
      for (let i = 0; i < 34; i++) { spawnGhost(); const g = game.ghosts[game.ghosts.length - 1]; g.x = game.player.x - 300 + (i % 12) * 50; g.y = game.player.y - 150 + Math.floor(i / 12) * 60; }
      for (let i = 0; i < 20; i++) game.pickups.push({ kind: 'para', value: 1, x: game.player.x - 300 + i * 30, y: game.player.y + 120 });
      const t0 = performance.now(); for (let i = 0; i < 60; i++) render(); o.kareMs = (performance.now() - t0) / 60;
    } catch (e) { hata = e.message + ' ' + (e.stack || '').split('\n')[1]; }
    o.hata = hata;
    return o;
  });
  if (EKRAN) await p.screenshot({ path: `${EKRAN}-oyun.png` });
  sina('oyun ekranı hatasız çizilir (hayalet, boss, para, mücevher, ölüm, toplama)', () => { assert.equal(oyun.hata, null); assert.equal(oyun.koord, true); });
  sina('hayalete yalnız görsel (__) alanlar eklenir', () => { assert.equal(oyun.yalnizGorselAlan, true); });
  sina('40 hayalet + 20 para ile bir kare 12 ms\'den kısa', () => { assert.ok(oyun.kareMs < 12, String(oyun.kareMs)); });

  // Animasyon oyun durumunu değiştirmez: aynı hayalet çizilmeden ve çizildikten sonra aynı konum, can ve yarıçapta
  const durum = await p.evaluate(() => {
    __bolum(3); spawnGhost(); const g = game.ghosts[0]; g.speed = 0;
    const once = [g.x, g.y, g.hp, g.maxHp, g.r, g.size];
    for (let i = 0; i < 10; i++) render();
    return { once, sonra: [g.x, g.y, g.hp, g.maxHp, g.r, g.size] };
  });
  sina('çizim hayaletin konumunu, canını ve yarıçapını değiştirmez', () => { assert.deepEqual(durum.sonra, durum.once); });

  const az = await sayfa(true);
  const azR = await az.evaluate(() => {
    const g = { x: 0, y: 0, hp: 2, maxHp: 2, size: 40 };
    hayaletAnim(g, 1000);
    const a = hayaletAnim(g, 1000 + 2000);
    const bs = { x: 0, y: 0, hp: 9, maxHp: 9, size: 80, isBoss: true };
    return { dy: a.dy, dalga: a.dalga, sx: a.sx, bossDy: hayaletAnim(bs, 5000).dy, para: paraDonusu(1234, 5).sx, nefes: avciNefes(300, false) };
  });
  sina('"Hareketi azalt" tercihinde süzülme, dalga, düşüş, dönme ve nefes yok', () => {
    assert.equal(azR.dy, 0); assert.equal(azR.dalga, 0); assert.equal(azR.sx, 1); assert.equal(azR.bossDy, 0); assert.equal(azR.para, 1); assert.equal(azR.nefes, 0);
  });
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
