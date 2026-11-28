// Hayalet Avcıları TMS2: timsah karada — su halkası peşinden gelmez, sudan tamamen çıkar, yakaladığı yerde ısırır.
// Kullanıcının isteği: "Timsah sudan çıkınca peşinden su halkası gelmesin, sudan tamamen çıksın, karakteri nerede
// yakalar ise orada ısırsın."
// Çalıştırma: node test/tms2.test.mjs   (Playwright + Chromium; ağ ve Firebase gerekmez)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WWW = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);
const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.m4a': 'audio/mp4' };
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
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript(() => {
    localStorage.setItem('hayaletAvcilariDil', 'tr');
    localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9'); localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1');
  });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof timsahGuncelle === 'function' && typeof startGame === 'function');
  await p.waitForFunction(() => typeof animHazir === 'function' && animHazir('timsah') === 6, null, { timeout: 15000 });

  await p.evaluate(() => {
    // Düz, duvarsız bir sahne: ortada 300×300 göl, çevresi kara
    window.__sahne = () => {
      if (game.running) endGame(false);
      startGame(); game.paused = true; game.running = false; game.ghosts = []; game.spawnTimer = -1e9;
      const o = { x: Math.round(game.worldW / 2 - 150), y: Math.round(game.worldH / 2 - 150), w: 300, h: 300, carpisma: [{ t: 'k', x: 0, y: 0, w: 300, h: 300, rr: 0 }] };
      o.bicim = o.carpisma.map((q) => ({ ...q }));
      game.waters = [o]; game.walls = []; game.kopruler = []; game._kopruSular = game.waters;
      timsahSifirla();
      game._timsahSus = 1e9; game._timsahGez = 1e9; game._timsahAra = 0;
      const pl = game.player; pl.hp = 3; pl.invuln = 0; pl.dead = false; pl.dusus = null; pl.invisibleUntil = 0;
      return o;
    };
    window.__oyuncuyaKoy = (x, y) => {
      game.player.x = x; game.player.y = y;
      game.camera.x = x - game.W / 2; game.camera.y = y - game.H / 2;
    };
    // Gölün doğusunda, kıyıdan d px ötede oyuncu; timsah doğurulur
    window.__dogur = (o, d, dy = 0) => {
      const x = o.x + o.w + d, y = o.y + o.h / 2 + dy;
      __oyuncuyaKoy(x, y);
      return timsahGezdir(o, x, y);
    };
    window.__ilerlet = (sn, adim = 1 / 60) => { for (let z = 0; z < sn; z += adim) timsahGuncelle(adim); };
    window.__kovaya = (tm) => { for (let i = 0; i < 600 && tm.faz !== 'kov'; i++) timsahGuncelle(1 / 60); return tm.faz === 'kov'; };
    window.__sudan = (x, y) => Math.min(...game.waters.map((w) => suUzakligi(w, x, y)));
  });

  // (a) karada su halkası yok: halka() çağrıları yalnız bekle (suya çıkmadan) ve bat (en sonda) evrelerinde
  const a = await p.evaluate(() => {
    const o = __sahne(); const tm = __dogur(o, 200);
    const eski = window.halka, say = { }, ctx = game.ctx;
    let adet = 0;
    window.halka = (...args) => { adet++; return eski(...args); };
    const faz = [];
    try {
      for (let k = 0; k < 900 && game.timsahlar.includes(tm); k++) {
        timsahGuncelle(1 / 60);
        if (!game.timsahlar.includes(tm)) break;
        const once = adet;
        timsahCiz(ctx, tm);
        const f = tm.faz; faz.push(f);
        say[f] = (say[f] || 0) + (adet - once);
      }
    } finally { window.halka = eski; }
    return { say, evreler: [...new Set(faz)], bos: game.timsahlar.length };
  });
  sina('(a) karada (cik/kov/isir/don/gir) hiç su halkası çizilmez', () => {
    for (const f of ['cik', 'kov', 'isir', 'don', 'gir']) assert.equal(a.say[f] || 0, 0, `${f}: ${a.say[f]}`);
  });
  sina('(a) halka yalnız suya çıkmadan önce ve en sonda batarken var', () => {
    assert.ok(a.say.bekle > 0, 'bekle'); assert.ok(a.say.bat > 0, 'bat');
    assert.deepEqual(a.evreler.slice(0, 2), ['bekle', 'cik']); assert.equal(a.evreler[a.evreler.length - 1], 'bat'); assert.equal(a.bos, 0);
  });

  // (b) tamamen sudan çıkar: kovalama ve dönüşte merkez sudan >= 48 px; çıkış ve giriş noktaları da
  const b2 = await p.evaluate(() => {
    const o = __sahne(); const tm = __dogur(o, 200);
    let enAz = Infinity, cikisD = null, suyaDondu = false, kovalamaKare = 0, enYakinBat = Infinity;
    const girisD = [];
    for (let k = 0; k < 900 && game.timsahlar.includes(tm); k++) {
      timsahGuncelle(1 / 60);
      if (!game.timsahlar.includes(tm)) break;
      const kk = timsahKonum(tm), d = __sudan(kk.x, kk.y);
      if (tm.faz === 'kov' || tm.faz === 'isir' || tm.faz === 'don') { enAz = Math.min(enAz, d); kovalamaKare++; }
      if (tm.faz === 'bat') { enYakinBat = Math.min(enYakinBat, Math.hypot(kk.x - tm.x, kk.y - tm.y)); suyaDondu = d < -6; }
      if (tm.faz === 'cik' && cikisD === null) cikisD = d;
    }
    return { enAz, kovalamaKare, suyaDondu, enYakinBat, cikisD, ex: tm.ex, ey: tm.ey, eD: __sudan(tm.ex, tm.ey) };
  });
  sina('(b) karadayken (kov/isir/don) gövde merkezi sudan en az 48 px', () => {
    assert.ok(b2.kovalamaKare > 60, `kare ${b2.kovalamaKare}`); assert.ok(b2.enAz >= 48 - 0.01, `en az ${b2.enAz}`);
    assert.ok(b2.eD >= 48 - 0.01, `çıkış noktası ${b2.eD}`);
  });
  sina('(b) en sonda suya geri döner (batarken su noktasında ve suyun içinde)', () => {
    assert.equal(b2.suyaDondu, true); assert.ok(b2.enYakinBat < 1, `bat ${b2.enYakinBat}`);
  });
  const b3 = await p.evaluate(() => {
    const o = __sahne(); const kok = [];
    // kıyıya 5 px ötede oyuncu: çıkış noktası yine sudan 48 px dışında
    const tm = __dogur(o, 5);
    kok.push(!!tm && __sudan(tm.ex, tm.ey) >= 48 - 0.01);
    // duvar: çıkış yolunun hemen önüne duvar → timsah doğmaz
    game.timsahlar = [];
    const o2 = __sahne(); __oyuncuyaKoy(o2.x + o2.w + 200, o2.y + o2.h / 2);
    game.walls.push({ x: o2.x + o2.w + 20, y: o2.y, w: 20, h: o2.h });
    const yok = timsahGezdir(o2, game.player.x, game.player.y);
    return { kok, yok: yok === null };
  });
  sina('(b) oyuncu kıyıdaysa da çıkış noktası sudan 48 px dışında', () => { assert.deepEqual(b3.kok, [true]); });
  sina('(b) kara bulunamazsa (duvar çıkışı kapatır) timsah doğmaz (null)', () => { assert.equal(b3.yok, true); });

  // (c) kovalama: oyuncu yanlara kaçarsa timsah ardından gelir, ısırık oyuncunun yeni yerinde
  const c = await p.evaluate(() => {
    const o = __sahne(); const tm = __dogur(o, 190, -40);
    __kovaya(tm);
    const e = { x: tm.ex, y: tm.ey }, p0 = { x: game.player.x, y: game.player.y };
    const yeni = { x: p0.x + 10, y: p0.y + 80 };
    __oyuncuyaKoy(yeni.x, yeni.y);
    const d0 = Math.hypot(tm.kx - yeni.x, tm.ky - yeni.y);
    let isirKonum = null, hp0 = game.player.hp, enSon = null;
    for (let k = 0; k < 400; k++) {
      timsahGuncelle(1 / 60);
      if (tm.faz === 'isir' && !isirKonum) isirKonum = { x: tm.kx, y: tm.ky, hp: game.player.hp };
      if (!game.timsahlar.includes(tm)) break;
    }
    return {
      d0, hp0, isirKonum, p: yeni, e,
      mesafe: isirKonum ? Math.hypot(isirKonum.x - yeni.x, isirKonum.y - yeni.y) : null,
      gezilen: isirKonum ? Math.hypot(isirKonum.x - e.x, isirKonum.y - e.y) : null,
      kapi: TIMSAH.gez.dokunma + game.player.r,
    };
  });
  sina('(c) oyuncu kaçınca timsah peşinden gider ve yeni yerinde ısırır (1 can)', () => {
    assert.ok(c.isirKonum, 'ısırmadı'); assert.equal(c.isirKonum.hp, c.hp0 - 1);
    assert.ok(c.mesafe < c.kapi + 1, `ısırık mesafesi ${c.mesafe} < ${c.kapi}`);
    assert.ok(c.gezilen > 25, `çıkış noktasından ${c.gezilen} px uzakta ısırdı`);
    assert.ok(c.d0 > c.kapi, `yeni yer menzil dışındaydı ${c.d0}`);
  });

  // (d) tasma, duvar, su ve köprü: hiçbiri içine girilmez
  const d = await p.evaluate(() => {
    const r = {};
    // tasma: oyuncu çok uzakta; timsah en çok 150 px uzaklaşır
    let o = __sahne(); let tm = __dogur(o, 330);
    let enUzak = 0, kare = 0;
    for (; kare < 900 && game.timsahlar.includes(tm); kare++) {
      timsahGuncelle(1 / 60);
      if (tm.faz === 'kov' || tm.faz === 'isir' || tm.faz === 'don') enUzak = Math.max(enUzak, Math.hypot(tm.kx - tm.ex, tm.ky - tm.ey));
    }
    r.enUzak = enUzak; r.hp1 = game.player.hp;
    // duvar: çıkıştan oyuncuya giden yolu bir duvar keser; timsah içine girmez
    o = __sahne(); tm = __dogur(o, 330);
    const dx = tm.ex + 60;
    game.walls.push({ x: dx, y: tm.ey - 300, w: 30, h: 600 });
    let duvar = false, ileri = -1e9;
    for (let k = 0; k < 900 && game.timsahlar.includes(tm); k++) {
      timsahGuncelle(1 / 60);
      if (tm.faz === 'bekle') continue;
      if (collidesWalls(tm.kx, tm.ky, 20)) duvar = true;
      ileri = Math.max(ileri, tm.kx);
    }
    r.duvar = duvar; r.ileri = ileri; r.duvarX = dx;
    // su: oyuncu gölün kıyısında yan tarafta; timsah kıyı boyunca gelir ama suya 48 px'ten yaklaşmaz
    o = __sahne(); tm = __dogur(o, 60, -120);
    __oyuncuyaKoy(o.x + o.w / 2, o.y + o.h + 20);            // gölün güneyinde: kısa yol gölden geçer
    let suIhlal = Infinity;
    for (let k = 0; k < 900 && game.timsahlar.includes(tm); k++) {
      timsahGuncelle(1 / 60);
      if (tm.faz === 'kov' || tm.faz === 'isir' || tm.faz === 'don') suIhlal = Math.min(suIhlal, __sudan(tm.kx, tm.ky));
    }
    r.suEnAz = suIhlal;
    // köprü şeridi: çıkış noktasının güneyinde yatay bir köprü; timsah şeride girmez
    o = __sahne(); tm = __dogur(o, 330, -150);
    game.kopruler = [{ su: o, yatay: true, a: tm.ex - 100, b: tm.ex + 400, c: tm.ey + 60 }]; game._kopruSular = game.waters;
    __oyuncuyaKoy(tm.ex + 20, tm.ey + 200);
    let kopru = false, sonY = -1e9;
    for (let k = 0; k < 900 && game.timsahlar.includes(tm); k++) {
      timsahGuncelle(1 / 60);
      if (tm.faz === 'bekle') continue;
      if (koprudeMi(tm.kx, tm.ky)) kopru = true;
      sonY = Math.max(sonY, tm.ky);
    }
    r.kopru = kopru; r.kopruY = sonY; r.kopruC = game.kopruler[0].c;
    return r;
  });
  sina('(d) çıkış noktasından en çok 150 px uzaklaşır (tasma)', () => {
    assert.ok(d.enUzak > 100, `koşmadı ${d.enUzak}`); assert.ok(d.enUzak <= 150.01, `tasma ${d.enUzak}`);
  });
  sina('(d) duvara girmez; duvarın önünde durur', () => {
    assert.equal(d.duvar, false); assert.ok(d.ileri < d.duvarX, `ileri ${d.ileri} < duvar ${d.duvarX}`);
  });
  sina('(d) suya 48 px\'ten fazla yaklaşmaz', () => { assert.ok(d.suEnAz >= 48 - 0.01, `su ${d.suEnAz}`); });
  sina('(d) köprü şeridine girmez', () => { assert.equal(d.kopru, false); assert.ok(d.kopruY < d.kopruC, `y ${d.kopruY} < köprü ${d.kopruC}`); });

  // (e) oyuncudan yavaştır: tam hızla kaçan oyuncu ısırılmaz
  const e = await p.evaluate(() => {
    const o = __sahne(); const tm = __dogur(o, 130);
    __kovaya(tm);
    const pl = game.player; let enYakin = Infinity, hizMax = 0, onceki = { x: tm.kx, y: tm.ky };
    for (let k = 0; k < 400 && game.timsahlar.includes(tm); k++) {
      // oyuncu timsahtan doğrudan uzağa tam hızla kaçar
      const dx = pl.x - tm.kx, dy = pl.y - tm.ky, dd = Math.hypot(dx, dy) || 1;
      if (tm.faz === 'kov') { pl.x += dx / dd * pl.speed / 60; pl.y += dy / dd * pl.speed / 60; }
      timsahGuncelle(1 / 60);
      if (tm.faz === 'kov') {
        enYakin = Math.min(enYakin, Math.hypot(pl.x - tm.kx, pl.y - tm.ky));
        hizMax = Math.max(hizMax, Math.hypot(tm.kx - onceki.x, tm.ky - onceki.y) * 60);
      }
      onceki = { x: tm.kx, y: tm.ky };
    }
    return { hp: pl.hp, enYakin, hizMax, hiz: pl.speed, kapi: TIMSAH.gez.dokunma + pl.r };
  });
  sina('(e) tam hızla kaçan oyuncu ısırılmaz', () => { assert.equal(e.hp, 3); assert.ok(e.enYakin > e.kapi, `en yakın ${e.enYakin}`); });
  sina('(e) timsah oyuncudan belirgin yavaş (≈0,6×)', () => {
    assert.ok(e.hizMax <= e.hiz * 0.62, `${e.hizMax} ≤ 0.6 × ${e.hiz}`); assert.ok(e.hizMax >= e.hiz * 0.5, `${e.hizMax} ≥ 0.5 × ${e.hiz}`);
  });

  // (f) tek ısırık; koruma, görünmezlik ve hayalet kuralları
  const f = await p.evaluate(() => {
    const r = {};
    let o = __sahne(); let tm = __dogur(o, 140);
    __kovaya(tm);
    // oyuncu timsahın üstünde bekler: bütün gezinti boyunca tek can gider
    game.player.x = tm.kx; game.player.y = tm.ky;
    let isirFaz = 0;
    for (let k = 0; k < 600 && game.timsahlar.includes(tm); k++) {
      timsahGuncelle(1 / 60);
      if (tm.faz === 'isir') isirFaz++;
      if (tm.faz === 'kov' || tm.faz === 'isir') { game.player.x = tm.kx; game.player.y = tm.ky; }
    }
    r.hp = game.player.hp; r.isirFaz = isirFaz; r.ara = game._timsahAra;
    r.yazi = game.particles.some((q) => q.text === '🐊 Timsah ısırdı!');
    // ısırık çerçevesi ~0,3 sn
    r.isirSure = TIMSAH.gez.isir;
    const kos = (ayar) => {
      o = __sahne(); tm = __dogur(o, 140); __kovaya(tm); ayar();
      game.player.x = tm.kx; game.player.y = tm.ky;
      for (let k = 0; k < 600 && game.timsahlar.includes(tm); k++) { timsahGuncelle(1 / 60); if (tm.faz === 'kov') { game.player.x = tm.kx; game.player.y = tm.ky; } }
      return { hp: game.player.hp, isirdi: tm.isirdi };
    };
    r.koruma = kos(() => { game.player.invuln = 50; });
    r.gorunmez = kos(() => { game.player.invisibleUntil = performance.now() + 1e6; });
    r.hayalet = kos(() => { game.player.dead = true; });
    return r;
  });
  sina('(f) tam bir kez ısırır (1 can), yazı çıkar, ~0,3 sn duraklar, saldırı arası başlar', () => {
    assert.equal(f.hp, 2); assert.equal(f.yazi, true); assert.ok(f.isirFaz >= 15 && f.isirFaz <= 21, `isir kare ${f.isirFaz}`); assert.ok(f.ara > 0);
  });
  sina('(f) korumalı, görünmez ve hayalet oyuncuyu ısırmaz', () => {
    assert.equal(f.koruma.hp, 3); assert.equal(f.koruma.isirdi, false);
    assert.equal(f.gorunmez.hp, 3); assert.equal(f.hayalet.hp, 3);
  });

  // (g) çevrimiçi: kovalanan gerçek konum karşıya gider; eski harfler ve eski gez biçimi okunur
  const g = await p.evaluate(() => {
    const r = {};
    const o = __sahne(); const tm = __dogur(o, 200);
    __kovaya(tm); __ilerlet(0.5);
    const dz = timsahDizisi();
    const uzak = uzakTimsahlariAl(dz.metin)[0];
    const ka = timsahKonum(tm), kb = timsahKonum(uzak);
    r.fark = Math.hypot(ka.x - kb.x, ka.y - kb.y); r.faz = [tm.faz, uzak.faz]; r.metin = dz.metin;
    r.eskiKonumdan = Math.hypot(ka.x - tm.x, ka.y - tm.y);
    const im1 = dz.imza; __ilerlet(0.3); r.imzaDegisti = timsahDizisi().imza !== im1;
    // uzak taraf çizer: hatasız, halkasız
    game.player.dead = false;
    const rp = { timsahlar: [{ ...uzak, alindi: performance.now() }] };
    online.mode = 'client'; online.remotePlayers = { x: rp };
    let halkaSay = 0; const eski = window.halka; window.halka = (...a) => { halkaSay++; return eski(...a); };
    try { timsahlariCiz(game.ctx); r.cizim = true; } catch (err) { r.cizim = false; r.hata = err.message; }
    finally { window.halka = eski; online.mode = null; online.remotePlayers = {}; }
    r.uzakHalka = halkaSay;
    // eski biçimler
    r.eski = uzakTimsahlariAl('a10,20,30,40;b1,2,3,4;s5,6,7,8;g9,9,100,500').map((q) => q.tur).join(',');
    r.eskiGez = uzakTimsahlariAl('g9,9,100,500')[0];
    r.sacma = uzakTimsahlariAl('g1,2,3;x1,2,3,4;g1,2,3,4,5,6,9,1').length;
    return r;
  });
  sina('(g) uzaktaki timsah gerçek (kovalanan) konumda ve aynı evrede görünür', () => {
    assert.ok(g.fark <= 1, `fark ${g.fark} (${g.metin})`); assert.equal(g.faz[0], g.faz[1]); assert.ok(g.eskiKonumdan > 40, `su noktasından ${g.eskiKonumdan}`);
  });
  sina('(g) konum değişince oda kaydı imzası değişir (yeniden yazılır)', () => { assert.equal(g.imzaDegisti, true); });
  sina('(g) uzak taraf karadaki gez timsahını hatasız ve halkasız çizer', () => { assert.equal(g.cizim, true, g.hata); assert.equal(g.uzakHalka, 0); });
  sina('(g) eski harfler (a, b, s) ve 5 alanlı eski g biçimi okunur; bozuk kayıt atlanır', () => {
    assert.equal(g.eski, 'saldiri,bos,sus,gez'); assert.equal(g.eskiGez.faz, 'bekle'); assert.equal(g.sacma, 0);
  });

  // (h) kare yedeği: su bandı kırpılır (göl lekesi timsahla gezmez)
  const h = await p.evaluate(() => {
    const r = {};
    const o = __sahne(); const tm = __dogur(o, 200); __kovaya(tm); __ilerlet(0.3);
    const eskiHazir = window.animHazir;
    window.animHazir = (ad) => (ad === 'timsah' ? eskiHazir(ad) : 0);   // tam gövde kareleri (timsah-yuru…) yokmuş gibi
    const ctx = game.ctx, oClip = ctx.clip, oDraw = ctx.drawImage, oRect = ctx.rect;
    let klip = 0, cizim = 0; const dikdortgen = [];
    ctx.clip = function (...a) { klip++; return oClip.apply(this, a); };
    ctx.rect = function (...a) { dikdortgen.push(a); return oRect.apply(this, a); };
    ctx.drawImage = function (...a) { cizim++; return oDraw.apply(this, a); };
    try {
      timsahGezKareCiz(ctx, tm); r.yuru = { klip, cizim };
      klip = 0; cizim = 0; tm.faz = 'isir'; tm.ft = 0.05;
      timsahGezKareCiz(ctx, tm); r.isir = { klip, cizim };
      // piksel denetimi: boş bir tuvalde kırpılmış kare; kırpma çizgisinin altında mavi (su) piksel kalmaz
      const cv = document.createElement('canvas'); cv.width = 240; cv.height = 200;
      const c2 = cv.getContext('2d'); const t2 = { ...tm, kx: 120, ky: 100, a: 0, faz: 'kov', ft: 0.1, yol: 0 };
      ctx.clip = oClip; ctx.rect = oRect; ctx.drawImage = oDraw;
      timsahGezKareCiz(c2, t2);
      const d = c2.getImageData(0, 0, 240, 200).data;
      let altta = 0, mavi = 0, yesil = 0;
      for (let y = 0; y < 200; y++) for (let x = 0; x < 240; x++) {
        const i = (y * 240 + x) * 4, R = d[i], G = d[i + 1], B = d[i + 2], A = d[i + 3];
        if (A < 100) continue;   // yarı saydam ayak gölgesi sayılmaz
        if (y > 100 + 7) altta++;
        if (B > G + 10 && B > R + 30) mavi++; else if (G > B + 5 && G > R) yesil++;
      }
      r.altta = altta; r.mavi = mavi; r.yesil = yesil;
      // aynı kare kırpmasız çizilseydi: mavi piksel sayısı (karşılaştırma)
      const cv2 = document.createElement('canvas'); cv2.width = 240; cv2.height = 200;
      const c3 = cv2.getContext('2d'); animCiz(c3, 'timsah', 3, 40, 60, 80, 56);
      const d2 = c3.getImageData(0, 0, 240, 200).data; let mavi2 = 0;
      for (let i = 0; i < d2.length; i += 4) if (d2[i + 3] >= 40 && d2[i + 2] > d2[i + 1] + 10 && d2[i + 2] > d2[i] + 30) mavi2++;
      r.maviKirpmasiz = mavi2;
    } finally { ctx.clip = oClip; ctx.rect = oRect; ctx.drawImage = oDraw; window.animHazir = eskiHazir; }
    return r;
  });
  sina('(h) tam gövde kareleri yokken yürüme ve ısırık kareleri kırpılarak çizilir (clip çağrılır)', () => {
    assert.ok(h.yuru.cizim >= 1 && h.yuru.klip >= 1, JSON.stringify(h.yuru));
    assert.ok(h.isir.cizim >= 1 && h.isir.klip >= 1, JSON.stringify(h.isir));
  });
  sina('(h) kırpılan karede su bandı kalmaz: çizgi altında piksel yok, mavi piksel çok az', () => {
    assert.equal(h.altta, 0, `çizgi altında ${h.altta} piksel`);
    assert.ok(h.yesil > 300, `gövde çizildi (${h.yesil})`);
    assert.ok(h.mavi < h.maviKirpmasiz * 0.15, `mavi ${h.mavi} / kırpmasız ${h.maviKirpmasiz}`);
  });

  sina('(i) sayfa hatası yok', () => { assert.deepEqual(hatalar, []); });
} finally {
  await b.close();
  sunucu.close();
}
console.log(sonuclar.join('\n'));
const kotu = sonuclar.filter((s) => s.startsWith('✗'));
console.log(`\n${sonuclar.length - kotu.length}/${sonuclar.length} geçti`);
process.exit(kotu.length ? 1 : 0);
