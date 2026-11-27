// Hayalet Avcıları TMS1: timsahın sudan karaya gezintisi — çevrimdışı sınama.
// Kullanıcının isteği: "timsah bazen sudan karaya 2-3 adım çıksın, beklesin, geri dönsün."
// Çalıştırma: node test/tms1.test.mjs   (Playwright + Chromium; ağ ve Firebase gerekmez)
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

  await p.evaluate(() => {
    window.__kur = () => {
      if (game.running) endGame(false);
      startGame(); game.paused = true; game.running = false; game.ghosts = []; game.spawnTimer = -1e9;
      game.player.hp = 3; game.player.invuln = 0; game.player.dead = false; game.player.dusus = null;
      timsahSifirla();
      return game.waters[0];
    };
    window.__kiyi = (o, bosluk) => {
      const r = game.player.r;
      for (let yon = 0; yon < 48; yon++) {
        const a = (yon / 48) * Math.PI * 2;
        let x = o.x + o.w / 2, y = o.y + o.h / 2;
        for (let i = 0; i < 500; i++) {
          x += Math.cos(a) * 2; y += Math.sin(a) * 2;
          if (suUzakligi(o, x, y) - r >= bosluk) {
            if (!collidesWalls(x, y, r) && !collidesWaters(x, y, r)) return { x, y, a };
            break;
          }
        }
      }
      return null;
    };
    window.__uzak = () => {
      const r = game.player.r;
      for (let y = 100; y < game.worldH - 100; y += 40) for (let x = 100; x < game.worldW - 100; x += 40) {
        if (enYakinSu(x, y).d - r > TIMSAH.gez.yakin + 150 && !collidesWalls(x, y, r)) return { x, y };
      }
      return null;
    };
    window.__ilerlet = (sn, adim = 1 / 60) => { for (let z = 0; z < sn; z += adim) timsahGuncelle(adim); };
    window.__oyuncuyaKoy = (k) => {
      game.player.x = k.x; game.player.y = k.y;
      game.camera.x = k.x - game.W / 2; game.camera.y = k.y - game.H / 2;
    };
    // Karaya çıkacak bir gez timsahı bul (duvarlar yüzünden olmazsa farklı kıyı mesafeleri denenir)
    window.__gezBul = (o) => {
      for (const bosluk of [100, 120, 140, 160, 80, 180, 60]) {
        const k = __kiyi(o, bosluk);
        if (!k) continue;
        __oyuncuyaKoy(k);
        game.timsahlar = [];
        const tm = timsahGezdir(o, k.x, k.y);
        if (tm) return { k, tm };
      }
      return null;
    };
    window.__gezSay = () => game.timsahlar.filter((tm) => tm.tur === 'gez').length;
    window.__gecit = () => {
      const o = { x: 400, y: 100, w: 100, h: 600, gecit: true, tema: 0 };
      o.carpisma = [{ t: 'k', x: 0, y: 0, w: 100, h: 600, rr: 0 }];
      o.bicim = o.carpisma.map((q) => ({ ...q }));
      game.waters = [o]; game._timsahSular = game.waters;
      game.kopruler = [{ su: o, yatay: true, a: 370, b: 530, c: 400 }]; game._kopruSular = game.waters;
      game.timsahlar = []; game._timsahKiyi = 0; game._timsahAra = 0; game._timsahSus = 1e9; game._timsahGez = 0;
      game.player.hp = 3; game.player.invuln = 0; game.player.dead = false; game.player.dusus = null;
      return o;
    };
  });

  // (a) klasik gölde gezinti: doğar, karaya çıkar, suya döner, kaybolur
  const a = await p.evaluate(() => {
    const r = {};
    const o = __kur();
    const k = __kiyi(o, 120);
    r.varYer = !!k;
    __oyuncuyaKoy(k);
    game._timsahSus = 1e9; game._timsahAra = 0; game._timsahGez = 0;
    timsahGuncelle(1 / 60);
    const tm = game.timsahlar.find((x) => x.tur === 'gez');
    r.dogdu = !!tm;
    r.mesafe = tm ? timsahGezMesafe(tm) : 0;
    r.nokta = tm ? timsahKonum(tm) : null;
    let enBuyuk = -1e9, son = null, duvar = false, kopru = false, kare = 0;
    for (; kare < 600 && game.timsahlar.includes(tm); kare++) {
      timsahGuncelle(1 / 60);
      if (!game.timsahlar.includes(tm)) break;
      const kk = timsahKonum(tm);
      const d = suUzakligi(o, kk.x, kk.y);
      enBuyuk = Math.max(enBuyuk, d);
      son = { d, x: kk.x, y: kk.y };
      if (collidesWalls(kk.x, kk.y, 20)) duvar = true;
      if (koprudeMi(kk.x, kk.y)) kopru = true;
    }
    r.enBuyuk = enBuyuk; r.son = son; r.duvar = duvar; r.kopru = kopru;
    r.bos = game.timsahlar.length;
    r.kare = kare;
    return r;
  });
  sina('(a) klasik gölde kıyıda gez timsahı doğar', () => { assert.equal(a.varYer, true); assert.equal(a.dogdu, true); });
  // TMS2: sabit 30-70 px'lik yürüyüş kalktı; timsah sudan tamamen çıkar (merkez kıyıdan en az 48 px) ve kovalar
  sina('(a) karada merkez sudan en az 48 px uzaklaşır (çıkış noktası 48-170 px)', () => {
    assert.ok(a.mesafe >= 48 && a.mesafe <= 170, `mesafe ${a.mesafe}`);
    assert.ok(a.enBuyuk >= 48, `en büyük ${a.enBuyuk}`);
  });
  sina('(a) kaybolmadan önce suya döner ve timsah listesi boşalır', () => {
    assert.ok(a.son && a.son.d < 0, `son ${JSON.stringify(a.son)}`);
    assert.equal(a.bos, 0);
  });
  sina('(b) yürüyüş boyunca duvara ve köprüye girmez', () => { assert.equal(a.duvar, false); assert.equal(a.kopru, false); });

  // (b) duvar yolu kısaltır; kıyıdaki duvar hiç çıkarmaz
  const b2 = await p.evaluate(() => {
    const r = {}; const o = __kur(); const bul = __gezBul(o);
    r.bulundu = !!bul;
    if (!bul) return r;
    const { tm } = bul;
    const base = timsahGezMesafe(tm);
    r.base = base;
    game.timsahlar = [];
    const px = tm.x + Math.cos(tm.a) * (TIMSAH.icPay + 25), py = tm.y + Math.sin(tm.a) * (TIMSAH.icPay + 25);
    game.walls.push({ x: px - 20, y: py - 20, w: 40, h: 40 });
    const tm2 = timsahGezdir(o, game.player.x, game.player.y);
    r.duvarla = tm2 ? timsahGezMesafe(tm2) : 0;
    game.walls.pop();
    game.timsahlar = [];
    const sx = tm.x + Math.cos(tm.a) * TIMSAH.icPay, sy = tm.y + Math.sin(tm.a) * TIMSAH.icPay;
    game.walls.push({ x: sx - 20, y: sy - 20, w: 40, h: 40 });
    const tm3 = timsahGezdir(o, game.player.x, game.player.y);
    r.kiyidaNull = tm3 === null;
    game.walls.pop();
    return r;
  });
  sina('(b) kıyı dışındaki duvar yürüyüşü kısaltır', () => {
    assert.equal(b2.bulundu, true); assert.ok(b2.duvarla < b2.base, `${b2.duvarla} < ${b2.base}`);
  });
  sina('(b) kıyıdaki duvar gez timsahı çıkarmaz', () => { assert.equal(b2.kiyidaNull, true); });

  // (c) doğmama koşulları
  const c = await p.evaluate(() => {
    const r = {};
    let o = __kur(); const uzak = __uzak();
    __oyuncuyaKoy(uzak); game._timsahSus = 1e9; game._timsahAra = 0; game._timsahGez = 0;
    __ilerlet(0.2); r.uzakta = __gezSay();
    // köprüde
    __gecit(); __oyuncuyaKoy({ x: 450, y: 400 }); timsahSifirla(); game._timsahSus = 1e9; game._timsahGez = 0;
    __ilerlet(0.2); r.koprude = __gezSay();
    // bekleme süresi
    o = __kur(); let k = __kiyi(o, 120); __oyuncuyaKoy(k);
    game._timsahSus = 1e9; game._timsahGez = 0; game._timsahAra = 5;
    __ilerlet(0.2); r.araVar = __gezSay();
    // saldırı timsahı varken
    o = __kur(); k = __kiyi(o, 120); __oyuncuyaKoy(k);
    game._timsahSus = 1e9; game._timsahGez = 0; game._timsahAra = 0;
    game.timsahlar.push({ id: 1, tur: 'saldiri', x: k.x, y: k.y, a: 0, t: 0, isirdi: false });
    __ilerlet(0.2); r.saldiriVar = __gezSay();
    // geçit nehri köprüye 120 px'ten yakın: gezinti yok
    __gecit(); __oyuncuyaKoy({ x: 350, y: 430 }); timsahSifirla(); game._timsahSus = 1e9; game._timsahGez = 0;
    __ilerlet(0.2); r.kopruYakin = __gezSay();
    // aynı geçitte köprüden uzak: gezinti çıkar (kontrol)
    __gecit(); __oyuncuyaKoy({ x: 350, y: 200 }); timsahSifirla(); game._timsahSus = 1e9; game._timsahGez = 0;
    __ilerlet(0.2); r.uzakKiyi = __gezSay();
    return r;
  });
  sina('(c) oyuncu 500 px uzaktayken gez timsahı doğmaz', () => { assert.equal(c.uzakta, 0); });
  sina('(c) köprüdeyken gez timsahı doğmaz', () => { assert.equal(c.koprude, 0); });
  sina('(c) saldırı bekleme süresi dolmadan doğmaz', () => { assert.equal(c.araVar, 0); });
  sina('(c) saldırı timsahı varken doğmaz', () => { assert.equal(c.saldiriVar, 0); });
  sina('(c) geçit nehri köprüye 120 px\'ten yakınken doğmaz', () => { assert.equal(c.kopruYakin, 0); });
  sina('(c) geçitte köprüden uzak kıyıda doğar', () => { assert.equal(c.uzakKiyi, 1); });

  // (d) ısırık: yalnız karada beklerken, tek kez, 1 can; koruma/hayalet/uzaklık
  const d = await p.evaluate(() => {
    const r = {};
    const o = __kur(); const bul = __gezBul(o); const k = bul.k;
    __oyuncuyaKoy(k);
    const bekle = () => { __ilerlet(TIMSAH.uyari + TIMSAH.gez.cikis + 0.1); };   // TMS2: karaya çıkış bitti, kovalama başladı
    let tm = bul.tm; bekle();
    let kk = timsahKonum(tm); __oyuncuyaKoy(kk);
    __ilerlet(0.1); r.bir = game.player.hp;
    __ilerlet(0.6); r.iki = game.player.hp;
    r.yazi = game.particles.some((q) => q.text === '🐊 Timsah ısırdı!');
    // koruma
    game.timsahlar = []; game.player.hp = 3; game.player.invuln = 5;
    __oyuncuyaKoy(k); tm = timsahGezdir(o, k.x, k.y); bekle();
    __oyuncuyaKoy(timsahKonum(tm)); __ilerlet(0.2); r.koruma = game.player.hp;
    // görünmez
    game.timsahlar = []; game.player.hp = 3; game.player.invuln = 0; game.player.invisibleUntil = performance.now() + 10000;
    __oyuncuyaKoy(k); tm = timsahGezdir(o, k.x, k.y); bekle();
    __oyuncuyaKoy(timsahKonum(tm)); __ilerlet(0.2); r.gorunmez = game.player.hp;
    game.player.invisibleUntil = 0;
    // hayalet
    game.timsahlar = []; game.player.hp = 3; game.player.dead = true;
    __oyuncuyaKoy(k); tm = timsahGezdir(o, k.x, k.y); bekle();
    __oyuncuyaKoy(timsahKonum(tm)); __ilerlet(0.2); r.hayalet = game.player.hp;
    game.player.dead = false;
    // TMS2: kovalama bağlından (150 px) ve ısırık menzilinden çok uzak oyuncu (400 px): ısırılmaz
    game.timsahlar = []; game.player.hp = 3;
    __oyuncuyaKoy(k); tm = timsahGezdir(o, k.x, k.y); bekle();
    const q = timsahKonum(tm);
    __oyuncuyaKoy({ x: q.x + Math.cos(tm.a) * 400, y: q.y + Math.sin(tm.a) * 400 });
    __ilerlet(0.2); r.uzak = game.player.hp;
    // sabitler
    r.sabit = [TIMSAH.menzil, TIMSAH.ara, TIMSAH.olasilik, TIMSAH.bekleme, TIMSAH.uyari].join(',');
    // saldırı timsahı eskisi gibi ısırır
    game.timsahlar = []; game.player.hp = 3; game.player.invuln = 0; game.player.dead = false;
    const k20 = __kiyi(o, 20); __oyuncuyaKoy(k20);
    const sa = timsahSaldirt(o, k20.x, k20.y);
    __ilerlet(TIMSAH.uyari + TIMSAH.atilma + 0.2); r.saldiriCan = game.player.hp;
    r.saldiriVar = !!sa;
    return r;
  });
  sina('(d) karada bekleyen oyuncuyu tam 1 can ısırır, tek kez', () => {
    assert.equal(d.bir, 2); assert.equal(d.iki, 2); assert.equal(d.yazi, true);
  });
  sina('(d) korumalı, görünmez ve hayalet oyuncuyu ısırmaz', () => {
    assert.equal(d.koruma, 3); assert.equal(d.gorunmez, 3); assert.equal(d.hayalet, 3);
  });
  sina('(d) 400 px uzaktaki oyuncuyu ısırmaz', () => { assert.equal(d.uzak, 3); });
  sina('(d) saldırı sabitleri değişmedi ve saldırı eskisi gibi ısırır', () => {
    assert.equal(d.sabit, '96,5,0.5,1.2,0.9'); assert.equal(d.saldiriVar, true); assert.equal(d.saldiriCan, 2);
  });

  // (e) canlı ses: yürüyüşte tam bir kez
  const e = await p.evaluate(() => {
    const r = {}, eski = audio.canliSes, cagri = [];
    audio.canliSes = (...args) => cagri.push(args);
    try {
      const o = __kur(); const bul = __gezBul(o);
      __oyuncuyaKoy(bul.k);
      __ilerlet(timsahOmru('gez') + 0.2);
      r.adet = cagri.length; r.arg = cagri[0] || [];
      r.liste = CANLI_SESLERI.includes('timsah');
    } finally { audio.canliSes = eski; }
    return r;
  });
  sina('(e) yürüyüşte canlı ses ("timsah") tam bir kez çalar', () => {
    assert.equal(e.adet, 1); assert.equal(e.arg[0], 'timsah'); assert.equal(e.arg[3], 0.5);
    assert.ok(Number.isFinite(e.arg[1]) && Number.isFinite(e.arg[2]));
  });
  sina('(e) CANLI_SESLERI listesinde "timsah" var', () => { assert.equal(e.liste, true); });

  // (f) tohumlu rastgelelik: Math.random yok; iki taze koşu aynı
  const f = await p.evaluate(() => {
    const r = {}, eski = Math.random, eskiC = audio.timsahCik, eskiI = audio.timsahIsir;
    const o = __kur(); const k = __kiyi(o, 120); __oyuncuyaKoy(k);
    const tm = { id: 9, tur: 'gez', x: Math.round(k.x), y: Math.round(k.y), a: 0.5, t: 0, isirdi: false, sesli: false };
    Math.random = () => { throw new Error('Math.random çağrıldı'); };
    audio.timsahCik = audio.timsahIsir = () => {};
    try {
      timsahGezMesafe(tm); timsahKonum(tm); timsahRast();
      game.timsahlar = []; timsahGezdir(o, k.x, k.y);
      r.istisna = false;
    } catch (err) { r.istisna = true; r.hata = err.message; }
    finally { Math.random = eski; audio.timsahCik = eskiC; audio.timsahIsir = eskiI; }
    // iki taze koşu: aynı doğma zamanı, nokta ve mesafe
    const kos = () => {
      Math.random = () => 0.5;
      try {
        timsahSifirla(); __oyuncuyaKoy(k); game._timsahSus = 1e9; game._timsahGez = 0; game.timsahlar = [];
        let adim = 0, tm2 = null;
        for (; adim < 3000; adim++) { timsahGuncelle(1 / 60); tm2 = game.timsahlar.find((x) => x.tur === 'gez'); if (tm2) break; }
        return tm2 ? { adim, x: tm2.x, y: tm2.y, gm: timsahGezMesafe(tm2) } : null;
      } finally { Math.random = eski; }
    };
    r.bir = kos(); r.iki = kos();
    return r;
  });
  sina('(f) yeni kod Math.random kullanmaz', () => { assert.equal(f.istisna, false); });
  sina('(f) iki taze koşu aynı zaman, nokta ve mesafeyi verir', () => {
    assert.ok(f.bir && f.iki); assert.deepEqual(f.bir, f.iki);
  });

  // (g) çevrimiçi metin: "g" harfi, eski biçim de okunur
  const g = await p.evaluate(() => {
    const tm = { id: 1, tur: 'gez', x: 512.4, y: 300, a: 1.57, t: 0.35, isirdi: false };
    game.timsahlar = [tm];
    const dz = timsahDizisi();
    const geri = uzakTimsahlariAl(dz.metin)[0];
    const ka = timsahKonum(tm), kb = timsahKonum(geri);
    const eski = uzakTimsahlariAl('s10,20,30,40');
    return { metin: dz.metin, tur: geri.tur, fark: Math.hypot(ka.x - kb.x, ka.y - kb.y), eski: eski.length ? eski[0].tur : null };
  });
  sina('(g) timsahDizisi "g..." yazar, geri okununca "gez" olur ve konum aynı', () => {
    assert.ok(g.metin.startsWith('g')); assert.equal(g.tur, 'gez'); assert.ok(g.fark <= 1, `fark ${g.fark}`);
  });
  sina('(g) eski biçim metni okunmaya devam eder', () => { assert.equal(g.eski, 'sus'); });

  // (h) hareket azaltma: sallanma yok, bütün evreler hatasız çizilir
  await p.emulateMedia({ reducedMotion: 'reduce' });
  const h = await p.evaluate(() => {
    const r = {};
    const o = __kur(); const bul = __gezBul(o); const tm = bul.tm;
    __oyuncuyaKoy(bul.k);
    const ctx = game.ctx, oT = ctx.translate, oD = ctx.drawImage;
    let sonY = null, cizim = false, ilkY = null, sonrakiler = [];
    ctx.translate = function (x, y) { if (ilkY === null) ilkY = y; else sonrakiler.push(y); sonY = y; return oT.call(this, x, y); };
    ctx.drawImage = function (...args) { cizim = true; return oD.apply(this, args); };
    try {
      tm.t = TIMSAH.uyari + TIMSAH.gez.cikis + 0.5; tm.faz = 'kov'; tm.kx = tm.ex; tm.ky = tm.ey;
      const kk = timsahKonum(tm);
      sonY = null; cizim = false; ilkY = null; sonrakiler = [];
      timsahKareCiz(ctx, tm);
      r.cizildi = cizim; r.ty = ilkY; r.ky = kk.y; r.sallanma = sonrakiler.filter((v) => v !== 0).length;   // TMS2: kırpılmış karede ek ötelemeler 0 (sallanma yok)
      // bütün evreler render() ile
      const sure = timsahOmru('gez'), adimlar = [0.1, TIMSAH.uyari + 0.1, TIMSAH.uyari + TIMSAH.gez.cikis + 0.5, sure - 0.2];
      r.hatasiz = true;
      for (const t of adimlar) { tm.t = Math.min(t, sure - 0.01); try { render(); } catch (err) { r.hatasiz = false; } }
    } finally { ctx.translate = oT; ctx.drawImage = oD; }
    return r;
  });
  await p.emulateMedia({ reducedMotion: 'no-preference' });
  sina('(h) hareket azaltmada timsah sallanmadan çizilir', () => {
    assert.equal(h.cizildi, true); assert.equal(h.ty, h.ky); assert.equal(h.sallanma, 0);
  });
  sina('(h) bütün evreler render() ile hatasız çizilir', () => { assert.equal(h.hatasiz, true); });

  // (i) çizim maliyeti: karada bir gez timsahı 7×120 karede en çok %15 yavaşlatır
  const i = await p.evaluate(() => {
    const o = __kur(); const bul = __gezBul(o); const tm = bul.tm;
    __oyuncuyaKoy(bul.k);
    tm.t = TIMSAH.uyari + TIMSAH.gez.cikis + 0.5; tm.faz = 'kov'; tm.kx = tm.ex; tm.ky = tm.ey;
    const medyan = (dizi) => dizi.slice().sort((x, y) => x - y)[Math.floor(dizi.length / 2)];
    const olc = () => {
      const d = [];
      for (let r = 0; r < 7; r++) {
        const t0 = performance.now();
        for (let k = 0; k < 120; k++) render();
        d.push(performance.now() - t0);
      }
      return medyan(d);
    };
    game.timsahlar = [];
    for (let k = 0; k < 20; k++) render();
    const bos = olc();
    game.timsahlar = [tm];
    for (let k = 0; k < 20; k++) render();
    const dolu = olc();
    return { bos, dolu, oran: dolu / bos };
  });
  sina('(i) karadaki gez timsahı çizimi %15\'ten fazla yavaşlatmaz', () => {
    assert.ok(i.oran <= 1.15, `oran ${i.oran.toFixed(3)} (${i.bos.toFixed(0)}/${i.dolu.toFixed(0)} ms)`);
  });

  sina('(j) sayfa hatası yok', () => { assert.deepEqual(hatalar, []); });
} finally {
  await b.close();
  sunucu.close();
}
console.log(sonuclar.join('\n'));
const kotu = sonuclar.filter((s) => s.startsWith('✗'));
console.log(`\n${sonuclar.length - kotu.length}/${sonuclar.length} geçti`);
process.exit(kotu.length ? 1 : 0);
