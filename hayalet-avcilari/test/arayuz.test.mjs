// Hayalet Avcıları: 3.16.0 arayüzü — çevrimdışı sınama.
// Kullanıcının isteği (3 Kasım 2026): "Oyun arayüzünü, kontrolleri, tuşları, tüm arayüzü daha profesyonel hale getir."
// Gömülü yazı tipleri yüklenir; bildirim ekran değişince kapanır; duraklat düğmesi çizilmiş simge; joystick dokunulunca
// belirginleşir; pencere düğmeleri eşit genişlikte; ana menü yatay telefonda kaymadan sığar, dikeyde iki sütun kısayol.
// Çalıştırma: node hayalet-avcilari/test/arayuz.test.mjs   (Playwright + Chromium; ağ ve Firebase gerekmez)
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

const sonuclar = [];
function sina(ad, fn) {
  try { fn(); sonuclar.push(`✓ ${ad}`); } catch (e) { sonuclar.push(`✗ ${ad}: ${e.message.split('\n')[0]}`); }
}

const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const hatalar = [];
async function sayfa(dil, en, boy, ek = {}) {
  const p = await b.newPage({ viewport: { width: en, height: boy }, hasTouch: true, ...ek });
  p.on('pageerror', (e) => hatalar.push(`${dil}: ${e.stack}`));
  await p.addInitScript((d) => { localStorage.setItem('hayaletAvcilariDil', d); localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1'); }, dil);
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof startGame === 'function');
  await p.evaluate(() => { localStorage.setItem(VERSION_KEY, APP_VERSION); save.playerName = save.playerName || 'Deniz'; goToMenu(); });
  return p;
}
try {
  const p = await sayfa('tr', 390, 844);

  const yazi = await p.evaluate(async () => {
    await document.fonts.ready;
    const yuklu = (ad) => document.fonts.check(`700 16px "${ad}"`, 'Hayalet');
    const btn = getComputedStyle(document.querySelector('#screen-menu .btn-play'));
    return { baloo: yuklu('Baloo 2'), nunito: yuklu('Nunito'), dugme: btn.fontFamily, govde: getComputedStyle(document.body).fontFamily };
  });
  sina('Baloo 2 ve Nunito gömülü yüklenir; düğmede Baloo 2, metinde Nunito', () => {
    assert.equal(yazi.baloo, true); assert.equal(yazi.nunito, true);
    assert.match(yazi.dugme, /^"Baloo 2"/); assert.match(yazi.govde, /^Nunito/);
  });

  const menu = await p.evaluate(() => {
    const k = [...document.querySelectorAll('#screen-menu .menu-buttons > .btn')].map((e) => Math.round(e.getBoundingClientRect().width));
    const oyna = document.querySelector('#screen-menu .btn-play').getBoundingClientRect();
    const kisayol = document.querySelector('#screen-menu .menu-buttons').getBoundingClientRect();
    return { k, oyna: Math.round(oyna.width), kisayol: Math.round(kisayol.width), yatayTasma: document.documentElement.scrollWidth - innerWidth };
  });
  sina('dikey menü: dört kısayol iki eşit sütun, OYNA kısayollar kadar geniş', () => {
    assert.equal(new Set(menu.k).size, 1, menu.k.join(',')); assert.equal(menu.oyna, menu.kisayol); assert.equal(menu.yatayTasma, 0);
  });

  const bildirim = await p.evaluate(async () => {
    const t = document.getElementById('toast');
    showToast('deneme'); const once = t.classList.contains('show');
    showScreen('screen-menu'); const hemen = t.classList.contains('show'); // hemen ardından ekran değişirse kalır
    await new Promise((r) => setTimeout(r, 350));
    showScreen('screen-shop'); const sonra = t.classList.contains('show');
    showScreen('screen-menu');
    startGame(); showToast('oyun'); await new Promise((r) => setTimeout(r, 350));
    pauseGame(); const duraklat = t.classList.contains('show');
    resumeGame();
    return { once, hemen, sonra, duraklat };
  });
  sina('bildirim ekran ya da duraklat açılınca kapanır; ekran değişmeden hemen önce gösterilen kalır', () => {
    assert.deepEqual(bildirim, { once: true, hemen: true, sonra: false, duraklat: false });
  });

  const kontrol = await p.evaluate(() => {
    const st = document.getElementById('joystick'), r = st.getBoundingClientRect();
    const dok = (tur, x, y) => { const e = new Event(tur, { bubbles: true, cancelable: true }); e.changedTouches = [{ identifier: 1, clientX: x, clientY: y }]; e.touches = tur === 'touchend' ? [] : e.changedTouches; st.dispatchEvent(e); };
    dok('touchstart', r.left + r.width / 2, r.top + r.height / 2); const aktif = st.classList.contains('aktif');
    dok('touchmove', r.right + 40, r.top + r.height / 2); const yon = game.inputDir.x;
    dok('touchend', r.right + 40, r.top + r.height / 2); const birakti = !st.classList.contains('aktif') && game.inputDir.x === 0;
    const durak = document.querySelector('.pause-btn');
    const db = durak.getBoundingClientRect();
    return { aktif, yon, birakti, svg: !!durak.querySelector('svg'), durakBoy: [Math.round(db.width), Math.round(db.height)] };
  });
  sina('joystick dokunulunca belirginleşir, sağa yön verir, bırakınca durur', () => {
    assert.equal(kontrol.aktif, true); assert.equal(kontrol.yon, 1); assert.equal(kontrol.birakti, true);
  });
  sina('duraklat düğmesi çizilmiş simge, en az 44 px dokunma alanı', () => {
    assert.equal(kontrol.svg, true); assert.ok(kontrol.durakBoy[0] >= 44 && kontrol.durakBoy[1] >= 44, kontrol.durakBoy.join('x'));
  });

  const pencere = await p.evaluate(() => {
    pauseGame();
    const g = [...document.querySelectorAll('#screen-pause .modal-content > .btn')].filter((e) => e.offsetParent).map((e) => Math.round(e.getBoundingClientRect().width));
    const ikincil = [...document.querySelectorAll('#screen-pause .btn-geri')].length;
    resumeGame(); quitToMenu();
    return { g, ikincil };
  });
  sina('duraklat penceresi: düğmeler eşit genişlikte; Ses ve Menü ikincil', () => {
    assert.ok(pencere.g.length >= 3); assert.equal(new Set(pencere.g).size, 1, pencere.g.join(',')); assert.equal(pencere.ikincil, 2);
  });

  // Ana menü süsü: ui-* resimleri, dekoratif katmanlar, oyun açıkken durma
  const simgeler = await p.evaluate(() => {
    menuSimgeleriniUygula();
    const src = (sel) => { const im = document.querySelector(sel); return im && im.tagName === "IMG" ? im.getAttribute("src") : null; };
    return {
      oyna: src('#screen-menu .btn-play img.ui-simge'),
      kar: src('#screen-menu [data-ui-simge="ui-karakterler"] img.ui-simge'),
      para: src('#screen-menu .resource[data-ui-simge="ui-para"] img.ui-simge'),
      dil: src('#screen-menu [data-ui-simge="ui-dil"] img.ui-simge'),
      sifirla: src('#screen-menu [data-ui-simge="ui-ayar"] img.ui-simge'),
    };
  });
  sina("menü düğmeleri ve kaynak göstergeleri ui-* resimlerini kullanır", () => {
    assert.equal(simgeler.oyna, "gorsel/ui-oyna.webp");
    assert.equal(simgeler.kar, "gorsel/ui-karakterler.webp");
    assert.equal(simgeler.para, "gorsel/ui-para.webp");
    assert.equal(simgeler.dil, "gorsel/ui-dil.webp");
    assert.equal(simgeler.sifirla, "gorsel/ui-ayar.webp");
  });

  const yedek = await p.evaluate(() => {
    const btn = document.createElement("button");
    btn.setAttribute("data-ui-simge", "ui-para");
    btn.textContent = "💰 0";
    document.body.appendChild(btn);
    const kayit = GORSEL_LISTESI["ui-para"];
    delete GORSEL_LISTESI["ui-para"];
    menuSimgeleriniUygula();
    const metin = btn.textContent.trim(), resim = !!btn.querySelector("img.ui-simge");
    GORSEL_LISTESI["ui-para"] = kayit;
    btn.remove();
    return { metin, resim };
  });
  sina("simge anahtarı listede yoksa emoji yedeği kalır", () => {
    assert.equal(yedek.resim, false);
    assert.match(yedek.metin, /💰/);
  });

  const dekor = await p.evaluate(() => {
    const d = document.getElementById("menu-dekor");
    const h = [...document.querySelectorAll("#dekor-hayaletler .dekor-hayalet")];
    const bakan = document.getElementById("dekor-bakan");
    const pe = (el) => el && getComputedStyle(el).pointerEvents;
    return {
      var: !!d, hayalet: h.length, dekorPE: pe(d), hayaletPE: pe(h[0]),
      kayan: !!document.getElementById("dekor-kayan"), yarasa: !!document.getElementById("dekor-yarasa"),
      bakan: !!bakan, bakanPE: pe(bakan), bakan44: bakan ? bakan.getBoundingClientRect().width >= 44 : false,
      sahne: !!document.querySelector(".hunter-sahne #character-preview"), kaide: !!document.getElementById("hunter-kaide"),
    };
  });
  sina("dekoratif katmanlar var, dokunuşu engellemez; bakan hayalet tıklanabilir ve 44 px", () => {
    assert.equal(dekor.var, true); assert.ok(dekor.hayalet >= 2 && dekor.hayalet <= 4, String(dekor.hayalet));
    assert.equal(dekor.dekorPE, "none"); assert.equal(dekor.hayaletPE, "none");
    assert.equal(dekor.kayan, true); assert.equal(dekor.yarasa, true);
    assert.equal(dekor.bakan, true); assert.equal(dekor.bakanPE, "auto"); assert.equal(dekor.bakan44, true);
    assert.equal(dekor.sahne, true); assert.equal(dekor.kaide, true);
  });

  const bakan = await p.evaluate(() => {
    const b = document.getElementById("dekor-bakan");
    b.click();
    const gizli = b.classList.contains("gizli");
    return { gizli, opak: getComputedStyle(b).opacity };
  });
  sina("bakan hayalet dokunulunca saklanır", () => { assert.equal(bakan.gizli, true); });

  const durdu = await p.evaluate(() => {
    startGame();
    const m = document.getElementById("screen-menu");
    const h = document.querySelector(".dekor-hayalet");
    const oyun = document.getElementById("screen-game").classList.contains("active");
    const durgun = m.classList.contains("dekor-durgun");
    const oynatim = h ? getComputedStyle(h).animationPlayState : "";
    quitToMenu();
    return { oyun, durgun, oynatim, donus: document.getElementById("screen-menu").classList.contains("dekor-durgun") };
  });
  sina("oyun açıkken menü animasyonları durur, menüye dönünce sürer", () => {
    assert.equal(durdu.oyun, true); assert.equal(durdu.durgun, true);
    assert.equal(durdu.oynatim, "paused"); assert.equal(durdu.donus, false);
  });

  const q = await sayfa("tr", 390, 844, { reducedMotion: "reduce" });
  const azHareket = await q.evaluate(() => {
    const ad = (sel) => { const el = document.querySelector(sel); return el ? getComputedStyle(el).animationName : ""; };
    return { hayalet: ad(".dekor-hayalet"), amblem: ad(".menu-amblem"), oyna: ad("#screen-menu .btn-play"), bakan: ad("#dekor-bakan") };
  });
  sina("az hareket tercihinde süzülme, zıplama ve parlama kapalı", () => {
    assert.equal(azHareket.hayalet, "none"); assert.equal(azHareket.amblem, "none");
    assert.equal(azHareket.oyna, "none"); assert.equal(azHareket.bakan, "none");
  });
  await q.close();

  // Dar ekranlar: 340 px Arapça (RTL) ve 390 px Türkçe yatay taşmaz
  for (const [dil, en, boy] of [["ar", 340, 720], ["tr", 390, 844]]) {
    const q2 = await sayfa(dil, en, boy);
    const tasma = await q2.evaluate(() => {
      const m = document.getElementById("screen-menu");
      const btn = m.querySelector(".menu-buttons > .btn");
      return {
        sayfa: document.documentElement.scrollWidth - innerWidth,
        menu: m.scrollWidth - innerWidth,
        dugmeYuksek: btn ? Math.round(btn.getBoundingClientRect().height) : 0,
      };
    });
    sina(`ana menü yatay taşmaz ve düğme dokunma alanı yeter (${dil}, ${en}×${boy})`, () => {
      assert.equal(tasma.sayfa, 0); assert.ok(tasma.menu <= 0, `menü ${tasma.menu}`);
      assert.ok(tasma.dugmeYuksek >= 44, String(tasma.dugmeYuksek));
    });
    await q2.close();
  }

  // Yatay telefon: ana menü iki sütun, kaymadan sığar (tr ve ar)
  for (const [dil, en, boy] of [['tr', 844, 390], ['ar', 740, 360]]) {
    const q = await sayfa(dil, en, boy);
    const y = await q.evaluate(() => {
      const m = document.querySelector('#screen-menu .menu-content');
      const sol = document.querySelector('.menu-sol').getBoundingClientRect(), sag = document.querySelector('.menu-sag').getBoundingClientRect();
      return { kayma: m.scrollHeight - m.clientHeight, ikiSutun: Math.abs(sol.top - sag.top) < 120 && sol.right <= sag.left + 1 || sag.right <= sol.left + 1,
        yatayTasma: document.documentElement.scrollWidth - innerWidth };
    });
    sina(`yatay menü iki sütun ve kaymadan sığar (${dil}, ${en}×${boy})`, () => {
      assert.equal(y.ikiSutun, true); assert.ok(y.kayma <= 1, `kayma ${y.kayma}`); assert.equal(y.yatayTasma, 0);
    });
    await q.close();
  }
  sina('sayfa hatası yok', () => { assert.deepEqual(hatalar, [], hatalar.join(' / ')); });
} catch (e) {
  sonuclar.push(`✗ akış yarıda kaldı: ${e.message.split('\n')[0]}`);
} finally {
  await b.close();
  sunucu.close();
}
sonuclar.forEach((s) => console.log(s));
if (hatalar.length) console.log(hatalar.join('\n'));
const kalan = sonuclar.filter((s) => s.startsWith('✗'));
assert.equal(kalan.length, 0, `${kalan.length} sınama başarısız`);
console.log(`TAMAM: ${sonuclar.length} sınama`);
