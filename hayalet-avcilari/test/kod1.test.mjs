// Hayalet Avcıları: KOD1 — ChatGPT görseli olan yerlerde kodla çizim kalmasın (28 Kasım 2026).
// Dünya Turu gölü dere-su dokusunu kullanır; HUD canları kalp resmidir (dolu/boş ayırt edilir); bot, öteki oyuncu ve pet can çubuğu
// ui-can-cubugu çerçevesini; güç yıldızının içi guc-<karakter> resmini; Dünya Turu harita sınırı aile-<A>-duvar resmini çizer.
// Resim yoksa (GORSEL'den silinince) eski kod çizimleri yedek olarak çalışır; sayfa hatası olmaz. TR 390×844 ve AR 340×740.
// Çalıştırma: node hayalet-avcilari/test/kod1.test.mjs   (Playwright + Chromium; ağ gerekmez)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WWW = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);
const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg' };
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
async function sayfaAc(dil, gen, boy) {
  const p = await b.newPage({ viewport: { width: gen, height: boy }, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => hatalar.push(`${dil}${gen}: ${e.message}`));
  await p.addInitScript((dil) => { localStorage.setItem('hayaletAvcilariDil', dil); localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9'); localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1'); }, dil);
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForTimeout(900); // resimlerin yüklenmesi
  return p;
}

// Sayfada çalışır: her sınama bir nesne döndürür. Resim silme (yedek yol) GORSEL kopyasından geri yüklenir.
async function olc(p) {
  return p.evaluate(async () => {
    save.playerName = 'Kiki'; persistSave();
    startGame({ tur: true, ulke: ulkeKodla('TR').sira });
    game.player.invuln = 1e9; game.running = false;
    const tum = { ...GORSEL };
    const sil = (...k) => { for (const a of k) delete GORSEL[a]; };
    const geri = () => { for (const k of Object.keys(GORSEL)) delete GORSEL[k]; Object.assign(GORSEL, tum); };
    const o = {};

    // tuval + drawImage/fillText gözcüsü
    const tuval = (w, h) => {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const ctx = c.getContext('2d'); const kayit = { resim: [], yazi: [] };
      const d = ctx.drawImage.bind(ctx); ctx.drawImage = (im, ...a) => { kayit.resim.push((im && im.src) || ''); return d(im, ...a); };
      const f = ctx.fillText.bind(ctx); ctx.fillText = (t, ...a) => { kayit.yazi.push(t); return f(t, ...a); };
      return { c, ctx, kayit };
    };
    const kutuStd = (ctx, x, y, w, h) => { // parlaklık standart sapması (düz renk geçişi ≈ küçük, doku büyük)
      const d = ctx.getImageData(x, y, w, h).data; let s = 0, s2 = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) { const l = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11; s += l; s2 += l * l; n++; }
      return Math.sqrt(Math.max(0, s2 / n - (s / n) ** 2));
    };

    // 1) Dünya Turu gölü
    const golCiz = () => {
      const { c, ctx } = tuval(240, 180);
      const su = engelOlustur({ x: 0, y: 0, w: 240, h: 180 }, 'su', 'TR', 11);
      const orijinal = window.dereSuDeseni; let cagri = 0, bos = 0;
      window.dereSuDeseni = () => { cagri++; const d = orijinal(); if (!d) bos++; return d; };
      try { engelBoya(ctx, su); } finally { window.dereSuDeseni = orijinal; }
      return { cagri, bos, std: kutuStd(ctx, 80, 60, 80, 60) };
    };
    o.gol = golCiz();
    sil('dere-su'); o.golYedek = golCiz(); geri();

    // 2) HUD kalpleri
    const can = document.getElementById('lives');
    game.player.maxHp = 3; game.player.hp = 2; updateHUD();
    const imgs = [...can.querySelectorAll('img')];
    o.hud = { adet: imgs.length, bos: imgs.filter((i) => i.classList.contains('bos')).length, src: imgs.map((i) => i.getAttribute('src') || ''),
      filtre: imgs.map((i) => getComputedStyle(i).filter), opaklik: imgs.map((i) => getComputedStyle(i).opacity), yazi: can.textContent,
      sag: can.getBoundingClientRect().right, tasma: document.documentElement.scrollWidth - innerWidth };
    game.player.hp = 3; updateHUD(); o.hudDolu = can.querySelectorAll('img.bos').length;
    game.player.hp = 1; updateHUD(); o.hudBir = can.querySelectorAll('img:not(.bos)').length;
    sil('kalp'); game.player.hp = 2; updateHUD();
    o.hudYedek = { img: can.querySelectorAll('img').length, yazi: can.textContent }; geri();
    game.player.hp = 3; updateHUD();

    // 3) can çubukları: bot, öteki oyuncu, pet
    const cerceve = (k) => k.resim.filter((s) => s.includes('ui-can-cubugu')).length;
    { const t = tuval(300, 200); botEtiketi(t.ctx, { x: 150, y: 120, hp: 1, maxHp: 3 }); o.bot = cerceve(t.kayit);
      sil('ui-can-cubugu'); const y = tuval(300, 200); botEtiketi(y.ctx, { x: 150, y: 120, hp: 1, maxHp: 3 }); o.botYedek = cerceve(y.kayit); geri(); }
    { const t = tuval(300, 200); petCanCiz(t.ctx, 150, 100, 1, 3); o.pet = cerceve(t.kayit);
      sil('ui-can-cubugu'); const y = tuval(300, 200); petCanCiz(y.ctx, 150, 100, 1, 3); o.petYedek = cerceve(y.kayit); geri(); }
    {
      const eskiMod = online.mode, eskiRp = online.remotePlayers, eskiBot = [game.bot, game.bot2], eskiG = game.ghosts;
      game.ghosts = []; game.bot = null; game.bot2 = null;
      const sayac = (silinsin) => {
        if (silinsin) sil('ui-can-cubugu');
        const t = tuval(10, 10); const eski = CanvasRenderingContext2D.prototype.drawImage; let n = 0;
        CanvasRenderingContext2D.prototype.drawImage = function (im, ...a) { if (im && im.src && im.src.includes('ui-can-cubugu')) n++; return eski.call(this, im, ...a); };
        try { render(); } finally { CanvasRenderingContext2D.prototype.drawImage = eski; }
        geri(); return n;
      };
      online.remotePlayers = {};
      o.uzakYok = sayac(false);
      online.mode = 'oda';
      online.remotePlayers = { u1: { name: 'Ali', charKey: 'kinkin', costumeIdx: 0, x: game.player.x + 60, y: game.player.y, hp: 1, maxHp: 3 } };
      o.uzak = sayac(false); o.uzakYedek = sayac(true);
      online.mode = eskiMod; online.remotePlayers = eskiRp; game.bot = eskiBot[0]; game.bot2 = eskiBot[1]; game.ghosts = eskiG;
    }

    // 4) güç yıldızı simgesi
    game.player.charKey = 'kent';
    { const t = tuval(100, 100); t.ctx.translate(50, 50); drawPickupGovde(t.ctx, { kind: 'guc', x: 0, y: 0, life: 99 });
      o.guc = { resim: t.kayit.resim.filter((s) => s.includes('guc-kent')).length, yazi: t.kayit.yazi.length };
      sil('guc-kent'); const y = tuval(100, 100); y.ctx.translate(50, 50); drawPickupGovde(y.ctx, { kind: 'guc', x: 0, y: 0, life: 99 });
      o.gucYedek = { resim: y.kayit.resim.filter((s) => s.includes('guc-kent')).length, yazi: y.kayit.yazi }; geri(); }

    // 5) Dünya Turu harita sınırı (TR → KS ailesi): yatay ve dikey
    const aile = ulkeKodla('TR').aile; o.aile = aile;
    const sinirCiz = (yon) => {
      const yat = yon === 'ust';
      const t = tuval(yat ? 400 : 40, yat ? 40 : 400);
      const s = engelOlustur({ x: 0, y: 0, w: yat ? 400 : 40, h: yat ? 40 : 400 }, 'sinir', 'TR', 5, yon);
      engelBoya(t.ctx, s);
      return t.kayit.resim.filter((x) => x.includes(`aile-${aile}-duvar`)).length;
    };
    o.sinir = { ust: sinirCiz('ust'), sol: sinirCiz('sol') };
    sil(`aile-${aile}-duvar`); o.sinirYedek = { ust: sinirCiz('ust'), sol: sinirCiz('sol') }; geri();
    return o;
  });
}

try {
  for (const [dil, gen, boy] of [['tr', 390, 844], ['ar', 340, 740]]) {
    const p = await sayfaAc(dil, gen, boy);
    const o = await olc(p);
    const E = `${dil} ${gen}×${boy}`;
    sina(`${E}: Dünya Turu gölü dere-su dokusunu alır (doku var, düz renk geçişi değil)`, () => {
      assert.ok(o.gol.cagri >= 1 && o.gol.bos === 0, 'dereSuDeseni çağrılmadı ya da boş');
      assert.ok(o.gol.std > 12, `göl dokusu düz görünüyor (std ${o.gol.std.toFixed(1)})`);
    });
    sina(`${E}: dere-su yoksa göl eski renk geçişiyle çizilir, hata yok`, () => {
      assert.equal(o.golYedek.bos, o.golYedek.cagri, 'desen boş dönmeliydi');
      assert.ok(o.golYedek.std < o.gol.std, `yedek de dokulu (std ${o.golYedek.std.toFixed(1)})`);
    });
    sina(`${E}: HUD canları kalp resmi, dolu ve boş ayırt edilir`, () => {
      assert.equal(o.hud.adet, 3); assert.equal(o.hud.bos, 1); assert.equal(o.hud.yazi, '');
      assert.ok(o.hud.src.every((s) => s.includes('kalp.webp')), String(o.hud.src));
      assert.notEqual(o.hud.filtre[0], o.hud.filtre[2], 'boş kalp süzgeci dolu ile aynı');
      assert.ok(Number(o.hud.opaklik[2]) < Number(o.hud.opaklik[0]));
      assert.equal(o.hudDolu, 0); assert.equal(o.hudBir, 1);
    });
    sina(`${E}: HUD kalpleri ekrana sığar, yatay taşma yok`, () => { assert.ok(o.hud.sag <= gen && o.hud.tasma <= 0, `sağ ${o.hud.sag}, taşma ${o.hud.tasma}`); });
    sina(`${E}: kalp resmi yoksa HUD emojiye döner`, () => {
      assert.equal(o.hudYedek.img, 0); assert.equal(o.hudYedek.yazi, '❤️❤️🖤');
    });
    sina(`${E}: bot, öteki oyuncu ve pet can çubuğu ui-can-cubugu çerçevesini çizer`, () => {
      assert.equal(o.bot, 1); assert.equal(o.pet, 1); assert.equal(o.uzakYok, 0); assert.ok(o.uzak >= 1, `uzak ${o.uzak}`);
    });
    sina(`${E}: çerçeve yoksa üç çubuk da eski çizime döner`, () => {
      assert.equal(o.botYedek, 0); assert.equal(o.petYedek, 0); assert.equal(o.uzakYedek, 0);
    });
    sina(`${E}: güç yıldızının içi guc-<karakter> resmi (emoji yok); resim yoksa emoji yedek`, () => {
      assert.equal(o.guc.resim, 1); assert.equal(o.guc.yazi, 0);
      assert.equal(o.gucYedek.resim, 0); assert.deepEqual(o.gucYedek.yazi, ['🌙']);
    });
    sina(`${E}: Dünya Turu sınırı aile-${o.aile}-duvar resmini döşer (yatay ve dikey); resim yoksa kod ressamı`, () => {
      assert.ok(o.sinir.ust >= 2 && o.sinir.sol >= 2, JSON.stringify(o.sinir));
      assert.equal(o.sinirYedek.ust, 0); assert.equal(o.sinirYedek.sol, 0);
    });
    await p.close();
  }
  sina('sayfa hatası yok', () => { assert.deepEqual(hatalar, []); });
} finally {
  await b.close(); sunucu.close();
}
console.log(sonuclar.join('\n'));
if (sonuclar.some((s) => s.startsWith('✗'))) process.exit(1);
