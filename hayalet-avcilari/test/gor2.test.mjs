// Hayalet Avcıları: GOR2 — yeni ChatGPT görsellerinin bağlanması (şelale, yağmur, su halkası,
// pasaport/rota ikonları, joystick, hikâye ikonları, ekran arka planları, canlı ülke objeleri).
// Kural: görsel varsa resim, yoksa bugünkü çizim; oyun kuralları değişmez. Çalıştırma: node test/gor2.test.mjs
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

const varMi = (r, parca) => r.srcs.some((s) => s.includes(parca));
const sonuclar = [];
function sina(ad, fn) {
  try { fn(); sonuclar.push(`✓ ${ad}`); } catch (e) { sonuclar.push(`✗ ${ad}: ${e.message.split('\n')[0]}`); }
}

const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const hatalar = [];
async function sayfaAc(viewport, dil) {
  const p = await b.newPage({ viewport });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.emulateMedia({ reducedMotion: 'no-preference' });
  await p.addInitScript((d) => {
    localStorage.setItem('hayaletAvcilariDil', d);
    localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9');
    localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1');
  }, dil);
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  return p;
}

try {
  const p = await sayfaAc({ width: 844, height: 390 }, 'tr');
  await p.waitForFunction(() => typeof startGame === 'function' && typeof ekranGorselleriKur === 'function' &&
    typeof hikayeSahneGoster === 'function' && typeof ucakGecisi === 'function' && typeof objeAnimKare === 'function');
  await p.waitForFunction(() => ['an-selale-1', 'an-selale-2', 'an-selale-3', 'yagmur-damla', 'su-halka', 'tur-damga', 'tur-kilit', 'tur-ucak-simge',
    'tur-pasaport', 'tur-ucak-yan', 'joystick-taban', 'joystick-topuz', 'ikon-parsomen', 'ikon-defter-bos',
    'arka-gece', 'arka-kasaba', 'an-ulke-CN-1-1', 'an-ulke-CN-1-2', 'an-ulke-CN-1-3', 'an-ulke-PL-2-2', 'ulke-PL-2'].every((k) => gorsel(k)), null, { timeout: 60000 });
  await p.evaluate(() => {
    window.__kur = (ulke = null) => {
      if (game.running) endGame(false);
      online.mode = null;
      startGame(ulke ? { tur: true, ulke: ulkeKodla(ulke).sira } : undefined);
      game.paused = true; game.player.invuln = 1e9;
      game.ghosts = []; game.spawnTimer = 1e9; game.bossSpawnTimer = 1e9;
      return game;
    };
    window.__ciz = (fn, w = 600, h = 600) => {
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const x = cv.getContext('2d');
      let say = 0; const srcs = [];
      const ad = x.drawImage.bind(x); x.drawImage = (im, ...a) => { say++; if (im && im.src) srcs.push(im.src); return ad(im, ...a); };
      fn(x);
      return { say, srcs };
    };
    window.__sil = (onek) => {
      const ks = Object.keys(GORSEL).filter((k) => k.startsWith(onek));
      const y = ks.map((k) => [k, GORSEL[k]]); ks.forEach((k) => delete GORSEL[k]); return y;
    };
    window.__geri = (y) => { for (const [k, im] of y) GORSEL[k] = im; };
  });

  // 1) Yolculuk küçük şelalesi: an-selale kareleri nehir genişliğine çizilir; resim yoksa köpük kalır
  const selale = await p.evaluate(() => {
    __kur();
    const z = game._yolculukDuzen.zones.find((q) => q._gecitDusmeler && q._gecitDusmeler.length);
    const d = z._gecitDusmeler[0];
    game.W = 600; game.H = 600; game.camera = { x: d.x - 300, y: d.y - 300 };
    const a = __ciz((x) => yolculukGecitCiz(x));
    const y = __sil('an-selale');
    const b = __ciz((x) => yolculukGecitCiz(x));
    __geri(y);
    return { srcs: a.srcs, yedek: b.srcs };
  });
  sina('selale: an-selale karesi çizilir, resim yokken köpük yedeği', () => {
    assert.ok(varMi(selale, 'an-selale'), JSON.stringify(selale.srcs));
    assert.ok(!varMi({ srcs: selale.yedek }, 'an-selale'), JSON.stringify(selale.yedek));
  });

  // 2) Yağmur: damla resmi + çarpınca su-halka (0.3 sn)
  const yagmur = await p.evaluate(() => {
    __kur();
    game.W = 800; game.H = 800; game.camera = { x: 0, y: 0 };
    const bl = { x: 300, y: 200, yon: 1 };
    bulutYagmurKur(bl);
    for (const d of bl.yagmur.damlalar) { d.splash = 0.3; d.sx = d.ox; d.sy = d.mesafe - 1; }
    const a = __ciz((x) => bulutYagmurCiz(x, bl));
    const y = __sil('yagmur-damla'); const y2 = __sil('su-halka');
    const b = __ciz((x) => bulutYagmurCiz(x, bl));
    __geri([...y, ...y2]);
    const bl2 = { x: 0, y: 0, yon: 1, yagmur: { alt: 42, az: false, damlalar: [{ ox: 0, y: 0, boy: 12, hiz: 400, mesafe: 100, aci: 0.2, splash: 0, sx: 0, sy: 0 }] } };
    const d = bl2.yagmur.damlalar[0]; d.y = d.mesafe; bulutYagmurGuncelle(bl2, 0);
    return { srcs: a.srcs, yedek: b.srcs, splash: d.splash };
  });
  sina('yagmur: yagmur-damla + su-halka, resim yokken çizgi; halka 0.3 sn', () => {
    assert.ok(varMi(yagmur, 'yagmur-damla'), JSON.stringify(yagmur.srcs));
    assert.ok(varMi(yagmur, 'su-halka'), JSON.stringify(yagmur.srcs));
    assert.ok(!varMi({ srcs: yagmur.yedek }, 'yagmur-damla') && !varMi({ srcs: yagmur.yedek }, 'su-halka'), JSON.stringify(yagmur.yedek));
    assert.equal(yagmur.splash, 0.3);
  });

  // 3) Suya düşen oyuncunun su halkası
  const halka = await p.evaluate(() => {
    __kur();
    game.player.dusus = { t: 0.1, k: {} };
    const a = __ciz((x) => dususCiz(x));
    game.player.dusus = null;
    const y = __sil('su-halka');
    game.player.dusus = { t: 0.1, k: {} };
    const b = __ciz((x) => dususCiz(x));
    game.player.dusus = null; __geri(y);
    return { srcs: a.srcs, yedek: b.srcs };
  });
  sina('su halkası: düşüşte su-halka, resim yokken çizgi halka', () => {
    assert.ok(varMi(halka, 'su-halka'), JSON.stringify(halka.srcs));
    assert.ok(!varMi({ srcs: halka.yedek }, 'su-halka'), JSON.stringify(halka.yedek));
  });

  // 4) Dünya Turu: pasaport çerçevesi, rota durum ikonları, uçak geçişi resmi
  const tur = await p.evaluate(() => {
    const u1 = ulkeSirada(1), u2 = ulkeSirada(2), u3 = ulkeSirada(3);
    save.dunyaTuru = { acik: 2, damgalar: { [u1.kod]: Date.now() } };
    renderDunyaTuru();
    turSekmesi('pasaport');
    const liste = document.getElementById('tur-liste');
    const durumSrcs = [...liste.querySelectorAll('.tur-durum img')].map((i) => i.src);
    const cerceve = [...document.querySelectorAll('#tur-pasaport .damga.cerceveli')].map((e) => getComputedStyle(e).backgroundImage);
    ucakGecisi(u1, u2, () => {});
    const ucak = document.querySelector('#tur-gecis .tur-ucak img');
    const ucakSrc = ucak ? ucak.src : '';
    document.getElementById('tur-gecis').classList.remove('active');
    const y = __sil('tur-');
    renderDunyaTuru(); turSekmesi('pasaport');
    const yedekImg = document.querySelectorAll('#tur-liste .tur-durum img').length;
    const yedekCerceve = document.querySelectorAll('#tur-pasaport .damga.cerceveli').length;
    __geri(y);
    save.dunyaTuru = { acik: 1, damgalar: {} };
    return { u3: u3.kod, durumSrcs, cerceve, ucakSrc, yedekImg, yedekCerceve };
  });
  sina('dünya turu: tur-kilit/tur-ucak-simge/tur-pasaport, damga çerçevesi, uçak resmi', () => {
    assert.ok(tur.durumSrcs.some((s) => s.includes('tur-kilit')), JSON.stringify(tur.durumSrcs));
    assert.ok(tur.durumSrcs.some((s) => s.includes('tur-ucak-simge')), JSON.stringify(tur.durumSrcs));
    assert.ok(tur.durumSrcs.some((s) => s.includes('tur-pasaport')), JSON.stringify(tur.durumSrcs));
    assert.ok(tur.cerceve.some((s) => s.includes('tur-damga')), JSON.stringify(tur.cerceve));
    assert.ok(tur.ucakSrc.includes('tur-ucak-yan'), tur.ucakSrc);
  });
  sina('dünya turu: resim yokken emoji ve çerçevesiz yedek', () => {
    assert.equal(tur.yedekImg, 0);
    assert.equal(tur.yedekCerceve, 0);
  });

  // 5) Joystick tabanı ve topuzu
  const joystick = await p.evaluate(() => {
    const joy = document.getElementById('joystick'), knob = document.getElementById('joystick-knob');
    joy.style.backgroundImage = ''; knob.style.backgroundImage = '';
    ekranGorselleriKur();
    const a = { taban: joy.style.backgroundImage, topuz: knob.style.backgroundImage };
    const y = __sil('joystick-');
    joy.style.backgroundImage = ''; knob.style.backgroundImage = '';
    ekranGorselleriKur();
    const b = { taban: joy.style.backgroundImage, topuz: knob.style.backgroundImage };
    __geri(y); ekranGorselleriKur();
    return { a, b };
  });
  sina('joystick: taban ve topuz resmi, resim yokken CSS', () => {
    assert.ok(joystick.a.taban.includes('joystick-taban'), joystick.a.taban);
    assert.ok(joystick.a.topuz.includes('joystick-topuz'), joystick.a.topuz);
    assert.equal(joystick.b.taban, '');
    assert.equal(joystick.b.topuz, '');
  });

  // 6) Hikâye: anlatıcı parşömeni ve boş defter yuvası
  const hikaye = await p.evaluate(() => {
    hikayeSahneGoster([{ k: 'anlatici', m: 'Deneme' }], {});
    const anlatim = document.querySelector('.hikaye-anlatim-simge img');
    const anlatimSrc = anlatim ? anlatim.src : '';
    hikayeSahneKapat();
    hikayeDefterCiz();
    const bos = document.querySelector('.defter-yuva.bos .defter-simge img');
    const bosSrc = bos ? bos.src : '';
    const y = __sil('ikon-');
    hikayeSahneGoster([{ k: 'anlatici', m: 'Deneme' }], {});
    const yedekAnlatim = document.querySelector('.hikaye-anlatim-simge img');
    hikayeSahneKapat();
    hikayeDefterCiz();
    const yedekBos = document.querySelector('.defter-yuva.bos .defter-simge img');
    __geri(y);
    return { anlatimSrc, bosSrc, yedekAnlatim: !!yedekAnlatim, yedekBos: !!yedekBos };
  });
  sina('hikâye: ikon-parsomen ve ikon-defter-bos; resim yokken emoji', () => {
    assert.ok(hikaye.anlatimSrc.includes('ikon-parsomen'), hikaye.anlatimSrc);
    assert.ok(hikaye.bosSrc.includes('ikon-defter-bos'), hikaye.bosSrc);
    assert.equal(hikaye.yedekAnlatim, false);
    assert.equal(hikaye.yedekBos, false);
  });

  // 9) Canlı ülke objesi: an-ulke-CN-1 kareleri oyun penceresinde, dışında yok
  const canli = await p.evaluate(() => {
    __kur('CN');
    const o = game.walls.find((w) => w.tema === 'CN' && w.tur === 'obje1');
    if (!o) return { yok: true };
    let zaman = null, kare = null, disZaman = null;
    for (let t = 0; t < 30; t += 0.05) {
      const a = objeAnimKare(o, t);
      if (a && zaman === null) { zaman = t; kare = a; }
      if (!a && zaman !== null && t > zaman + 1 && disZaman === null) disZaman = t;
    }
    // Yalnız bu obje çizilsin: kare sayısı başka objelere karışmasın
    const kayit = { walls: game.walls, waters: game.waters, spikes: game.spikes, lavas: game.lavas };
    game.walls = [o]; game.waters = []; game.spikes = []; game.lavas = [];
    game.W = 600; game.H = 600; game.camera = { x: o.x - 300, y: o.y - 300 };
    const eski = performance.now; let degistirildi = false;
    const ciz = (t) => {
      try { performance.now = () => t * 1000; degistirildi = true; } catch (_) {}
      const r = __ciz((x) => engelleriCiz(x));
      return r;
    };
    const icinde = zaman !== null ? ciz(zaman) : { srcs: [] };
    const disinda = disZaman !== null ? ciz(disZaman) : { srcs: [] };
    try { performance.now = eski; } catch (_) {}
    game.walls = kayit.walls; game.waters = kayit.waters; game.spikes = kayit.spikes; game.lavas = kayit.lavas;
    const y = __sil('an-ulke-CN-1');
    const yedek = objeAnimKare(o, zaman === null ? 0 : zaman);
    __geri(y);
    return { yok: false, kare, degistirildi, icinde: icinde.srcs, disinda: disinda.srcs, yedek };
  });
  sina('canlı ülke objesi: pencere içinde an-ulke-CN-1 kareleri, dışında ek yok', () => {
    assert.ok(!canli.yok, 'CN obje1 bulunamadı');
    assert.ok(canli.kare && canli.kare[0] === 'ulke-CN-1', JSON.stringify(canli.kare));
    assert.ok(canli.degistirildi, 'performance.now değiştirilemedi');
    assert.ok(canli.icinde.some((s) => s.includes('an-ulke-CN-1-')), JSON.stringify(canli.icinde));
    assert.ok(!canli.disinda.some((s) => s.includes('an-ulke-CN-1-')), JSON.stringify(canli.disinda));
  });
  // 9b) Küçük obje (doğal boyu kutudan küçük, FIX3 kopyaları): canlı kare her kopyanın KENDİ kutusuna çizilir, kutunun tamamına
  // tek dev resim çizilmez (Polonya leylek yuvası, doğal boy 105)
  const kopya = await p.evaluate(() => {
    __kur('PL');
    const o = game.walls.find((w) => w.tema === 'PL' && w.tur === 'obje2' && Math.max(w.w, w.h) > 105);
    if (!o) return { yok: true };
    const kayit = { walls: game.walls, waters: game.waters, spikes: game.spikes, lavas: game.lavas };
    game.walls = [o]; game.waters = []; game.spikes = []; game.lavas = [];
    game.W = 600; game.H = 600; game.camera = { x: o.x - 300, y: o.y - 300 };
    o._resim = null; __ciz((x) => engelleriCiz(x)); // durağan resim çizilir, yerleşim kaydedilir
    const Y = o.bicim._objeYerlesim;
    const kutular = [];
    const cv = document.createElement('canvas'); cv.width = 600; cv.height = 600; const x = cv.getContext('2d');
    const od = x.drawImage.bind(x);
    x.drawImage = (im, ...a) => { if (im && im.src && im.src.includes('an-ulke-PL-2-2')) kutular.push(a.slice(-4).map(Math.round)); return od(im, ...a); };
    const ok = objeAnimCiz(x, o, 'ulke-PL-2', 2);
    game.walls = kayit.walls; game.waters = kayit.waters; game.spikes = kayit.spikes; game.lavas = kayit.lavas;
    const beklenen = Y && !Y.kapak ? Y.kayit.flat().map((q) => q.map(Math.round)) : [];
    return { yok: false, ok, kapak: Y && Y.kapak, kutular, beklenen, w: Math.round(o.w), h: Math.round(o.h) };
  });
  sina('canlı ülke objesi: küçük objede kareler kopyaların kendi kutularına çizilir (tek dev resim yok)', () => {
    assert.ok(!kopya.yok, 'PL obje2 (kutusu doğal boydan büyük) bulunamadı');
    assert.equal(kopya.ok, true);
    assert.equal(kopya.kapak, false);
    assert.ok(kopya.kutular.length >= 2, JSON.stringify(kopya));
    assert.deepEqual(kopya.kutular, kopya.beklenen);
    for (const k of kopya.kutular) assert.ok(Math.max(k[2], k[3]) <= 106, `kopya ${k} doğal boydan büyük`);
  });

  sina('canlı ülke objesi: kareler yokken canlı katman yok', () => {
    assert.equal(canli.yedek, null);
  });

  // 7) Ekran arka planları: 390 TR ve 340 AR, yatay taşma yok
  for (const [en, boy, dil] of [[390, 844, 'tr'], [340, 740, 'ar']]) {
    const s = await sayfaAc({ width: en, height: boy }, dil);
    await s.waitForFunction(() => typeof ekranGorselleriKur === 'function');
    await s.waitForFunction(() => gorsel('arka-gece') && gorsel('arka-kasaba'), null, { timeout: 60000 });
    const r = await s.evaluate(() => {
      ekranGorselleriKur();
      const gece = ['screen-shop', 'screen-characters', 'screen-account'];
      const kasaba = ['screen-online', 'screen-friends', 'screen-room-list', 'screen-create-room', 'screen-lobby'];
      const bg = (id) => {
        const k = document.getElementById(id), b = k && k.querySelector('.menu-bg');
        return b ? getComputedStyle(b).backgroundImage : '';
      };
      const sonuc = { gece: gece.map(bg), kasaba: kasaba.map(bg), tasma: [] };
      const ekranlar = [...gece, ...kasaba];
      for (const id of ekranlar) {
        document.querySelectorAll('.screen').forEach((e) => e.classList.remove('active'));
        const k = document.getElementById(id);
        if (k) k.classList.add('active');
        if (document.documentElement.scrollWidth > window.innerWidth + 1) {
          sonuc.tasma.push(id + ':' + document.documentElement.scrollWidth + '>' + window.innerWidth);
        }
      }
      document.querySelectorAll('.screen').forEach((e) => e.classList.remove('active'));
      return sonuc;
    });
    await s.close();
    sina(`arka planlar (${en}px ${dil}): arka-gece/arka-kasaba, yatay taşma yok`, () => {
      assert.ok(r.gece.every((x) => x.includes('arka-gece')), JSON.stringify(r.gece));
      assert.ok(r.kasaba.every((x) => x.includes('arka-kasaba')), JSON.stringify(r.kasaba));
      assert.deepEqual(r.tasma, []);
    });
  }

  await p.close();
} catch (e) {
  hatalar.push('TEST: ' + e.message);
}
try { await b.close(); } catch (_) {}
try { sunucu.close(); } catch (_) {}

sina('sayfa hatası yok', () => assert.deepEqual(hatalar, []));
console.log(sonuclar.join('\n'));
const basarisiz = sonuclar.filter((s) => s.startsWith('✗')).length;
if (basarisiz) process.exitCode = 1;
