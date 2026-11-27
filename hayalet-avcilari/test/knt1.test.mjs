// Hayalet Avcıları: KNT1 — oyun içi dokunmatik kontroller, MOBA düzeni (tür geleneği; kendi simgelerimiz).
// Sol altta joystick, sağ altta büyük ana eylem düğmesi (#inv-btn), güç/eşya düğmeleri onun çevresinde yay;
// yarı saydam arka planlar; Arapçada aynalı; iki parmakla (hareket + düğme) birlikte çalışır.
// Çalıştırma: node hayalet-avcilari/test/knt1.test.mjs   (Playwright + Chromium; ağ ve Firebase gerekmez)
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

async function sayfa(dil, en, boy) {
  const p = await b.newPage({ viewport: { width: en, height: boy }, hasTouch: true });
  p.on('pageerror', (e) => hatalar.push(`${dil} ${en}x${boy}: ${e.stack}`));
  await p.addInitScript((d) => {
    localStorage.setItem('hayaletAvcilariDil', d);
    localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9');
    localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1');
  }, dil);
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof startGame === 'function' && typeof layoutWeaponBar === 'function');
  await p.evaluate(() => {
    save.playerName = save.playerName || 'Deniz';
    startGame();
    game.paused = true;
    const stok = ensureAmmoStock(game.player.charKey);
    Object.keys(WEAPONS).forEach((k) => { stok[k] = 5; });
    save.silahSecim = [];
    refreshWeaponBar();
  });
  return p;
}

async function olc(p) {
  return p.evaluate(async () => {
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    layoutWeaponBar();
    const k = (e) => {
      if (!e) return null;
      const r = e.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return null;
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height, cx: (r.left + r.right) / 2, cy: (r.top + r.bottom) / 2 };
    };
    const gor = (sel) => { const e = document.querySelector(sel); return e && getComputedStyle(e).display !== 'none' ? k(e) : null; };
    const alfa = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return 0; const v = m[1].split(/[ ,\/]+/); return v.length > 3 ? parseFloat(v[3]) : 1; };
    const slot = document.querySelector('#weapon-bar .weapon-slot');
    return {
      w: innerWidth, h: innerHeight,
      rtl: getComputedStyle(document.documentElement).direction === 'rtl',
      joy: k(document.getElementById('joystick')),
      knob: k(document.getElementById('joystick-knob')),
      inv: k(document.getElementById('inv-btn')),
      btns: [...document.querySelectorAll('#weapon-bar .weapon-slot, #weapon-bar .weapon-more')].map((e) => ({ ...k(e), more: e.classList.contains('weapon-more') })),
      hud: ['.hud-left', '.hud-right', '#yolculuk-hud', '.pause-btn', '#boss-status'].map(gor).filter(Boolean),
      alfa: {
        joy: alfa(getComputedStyle(document.getElementById('joystick')).backgroundColor),
        joyHalka: alfa(getComputedStyle(document.getElementById('joystick')).borderTopColor),
        slot: alfa(getComputedStyle(slot).backgroundColor),
        slotHalka: alfa(getComputedStyle(slot).borderTopColor),
        inv: alfa(getComputedStyle(document.getElementById('inv-btn')).backgroundColor),
      },
    };
  });
}

const daireCakisir = (a, c) => Math.hypot(a.cx - c.cx, a.cy - c.cy) < (a.width + c.width) / 2 - 1;
const kutuKesisir = (a, c, tol = 0) => a.right > c.left - tol && a.left < c.right + tol && a.bottom > c.top - tol && a.top < c.bottom + tol;

function dogrula(o, etiket) {
  const { w, h, rtl, joy, inv, btns } = o;
  // joystick: alt çeyrekte, LTR'de sol / RTL'de sağ yarıda; 110-145 px
  assert.ok(joy.width >= 110 && joy.width <= 145, `${etiket}: joystick çapı ${joy.width}`);
  assert.ok(joy.cy > h * 0.5, `${etiket}: joystick alt yarıda değil`);
  if (!rtl) assert.ok(joy.cx < w / 2, `${etiket}: joystick sol yarıda değil`); else assert.ok(joy.cx > w / 2, `${etiket}: joystick sağ yarıda değil`);
  // ana eylem: karşı alt köşede, 84-96 px
  assert.ok(inv.width >= 84 && inv.width <= 96, `${etiket}: ana düğme çapı ${inv.width}`);
  assert.ok(inv.cy > h * 0.5, `${etiket}: ana düğme alt yarıda değil`);
  if (!rtl) assert.ok(inv.cx > w / 2, `${etiket}: ana düğme sağ yarıda değil`); else assert.ok(inv.cx < w / 2, `${etiket}: ana düğme sol yarıda değil`);
  // yay düğmeleri: 56-64 px, merkez ana düğmeden 95-110 px (±15 pay), ekran içinde, birbirine ve ana düğmeye binmez
  assert.equal(btns.length, 4, `${etiket}: 3 slot + "⋯" bekleniyordu`);
  for (const d of btns) {
    assert.ok(d.width >= 56 && d.width <= 64, `${etiket}: yay düğmesi ${d.width}`);
    const r = Math.hypot(d.cx - inv.cx, d.cy - inv.cy);
    assert.ok(r >= 95 - 15 && r <= 110 + 15, `${etiket}: yay yarıçapı ${r.toFixed(0)}`);
    assert.ok(d.left >= 0 && d.right <= w && d.top >= 0 && d.bottom <= h, `${etiket}: ekran dışında`);
    assert.ok(d.cy <= inv.cy + 1, `${etiket}: düğme ana düğmenin altında`);
    assert.ok(!daireCakisir(d, inv), `${etiket}: düğme ana düğmeye biniyor`);
    assert.ok(!kutuKesisir(d, joy), `${etiket}: düğme joystick'e biniyor`);
    for (const g of o.hud) assert.ok(!kutuKesisir(d, g), `${etiket}: düğme HUD'a biniyor`);
  }
  for (let i = 0; i < btns.length; i++) for (let j = i + 1; j < btns.length; j++) assert.ok(!daireCakisir(btns[i], btns[j]), `${etiket}: yay düğmeleri çakışıyor`);
  assert.equal(btns[btns.length - 1].more, true, `${etiket}: "⋯" yayın sonunda değil`);
  // ekranın ortası boş: hiçbir kontrol merkez bölgeye (orta %30 x %30) girmez
  const orta = { left: w * 0.35, right: w * 0.65, top: h * 0.35, bottom: h * 0.65 };
  for (const d of [joy, inv, ...btns]) assert.ok(!kutuKesisir(d, orta), `${etiket}: kontrol ekran merkezini kapatıyor`);
  // joystick ile ana düğme ve HUD
  assert.ok(!kutuKesisir(joy, inv), `${etiket}: joystick ana düğmeye biniyor`);
  for (const g of o.hud) assert.ok(!kutuKesisir(joy, g) && !kutuKesisir(inv, g), `${etiket}: joystick/ana düğme HUD'a biniyor`);
  assert.ok(joy.left >= 0 && joy.right <= w && joy.bottom <= h && inv.left >= 0 && inv.right <= w && inv.bottom <= h, `${etiket}: ekran dışında`);
  // şeffaflık
  const a = o.alfa;
  assert.ok(a.joy >= 0.2 && a.joy <= 0.4, `${etiket}: joystick zemin alfa ${a.joy}`);
  assert.ok(a.joyHalka >= 0.25 && a.joyHalka <= 0.45, `${etiket}: joystick halka alfa ${a.joyHalka}`);
  assert.ok(a.slot >= 0.35 && a.slot <= 0.45, `${etiket}: yay düğmesi zemin alfa ${a.slot}`);
  assert.ok(a.inv >= 0.35 && a.inv <= 0.45, `${etiket}: ana düğme zemin alfa ${a.inv}`);
  assert.ok(a.slotHalka > 0 && a.slotHalka <= 0.6, `${etiket}: ince halka alfa ${a.slotHalka}`);
}

async function cdpDokun(p, tur, noktalar) {
  const cdp = p.__cdp || (p.__cdp = await p.context().newCDPSession(p));
  await cdp.send('Input.dispatchTouchEvent', { type: tur, touchPoints: noktalar.map(([x, y, id]) => ({ x, y, id })) });
}

try {
  for (const [dil, en, boy] of [
    ['tr', 390, 844], ['tr', 360, 740], ['tr', 340, 740], ['tr', 844, 390], ['tr', 740, 360],
    ['ar', 390, 844], ['ar', 340, 740], ['ar', 844, 390], ['ar', 740, 360],
  ]) {
    const p = await sayfa(dil, en, boy);
    const o = await olc(p);
    sina(`${dil} ${en}x${boy}: konumlar, yay, şeffaflık, aynalama`, () => dogrula(o, `${dil} ${en}x${boy}`));
    await p.close();
  }

  // 390 px ölçüler: halka 120-140, ana düğme 84-96, slot 56-64 (spesifikasyon)
  {
    const p = await sayfa('tr', 390, 844);
    const o = await olc(p);
    sina('390 px: halka ~128, ana düğme ~88, slot ~56 px', () => {
      assert.ok(o.joy.width >= 120 && o.joy.width <= 140, `halka ${o.joy.width}`);
      assert.ok(o.inv.width >= 84 && o.inv.width <= 96, `ana ${o.inv.width}`);
      assert.ok(o.btns.every((d) => d.width >= 56 && d.width <= 64));
    });
    await p.close();
  }

  // İki parmak: sol başparmak joystick'i sürer, sağ parmak yay düğmesine dokunur; ikisi birlikte çalışır.
  for (const [dil, en, boy] of [['tr', 390, 844], ['ar', 390, 844], ['tr', 844, 390]]) {
    const p = await sayfa(dil, en, boy);
    const o = await olc(p);
    await p.evaluate(() => {
      game.paused = false;
      window.__kullanilan = [];
      window.useWeapon = (k) => window.__kullanilan.push(k);
      window.__x0 = game.player.x; window.__y0 = game.player.y;
    });
    const ilkAnahtar = await p.evaluate(() => document.querySelector('#weapon-bar .weapon-slot').dataset.weapon);
    const jx = o.joy.cx, jy = o.joy.cy;
    const slot = o.btns[0];
    await cdpDokun(p, 'touchStart', [[jx, jy, 1]]);
    await cdpDokun(p, 'touchMove', [[jx + 40, jy, 1]]);
    // ikinci parmak: ilk slot; birinci parmak basılı kalır
    await cdpDokun(p, 'touchStart', [[jx + 40, jy, 1], [slot.cx, slot.cy, 2]]);
    await cdpDokun(p, 'touchMove', [[jx + 40, jy - 10, 1], [slot.cx, slot.cy, 2]]);
    await p.waitForTimeout(350);
    const orta = await p.evaluate(() => ({ dir: { ...game.inputDir }, kullanilan: window.__kullanilan.slice(), x: game.player.x, y: game.player.y, x0: window.__x0, y0: window.__y0, aktif: document.getElementById('joystick').classList.contains('aktif') }));
    await cdpDokun(p, 'touchEnd', [[slot.cx, slot.cy, 2]]);
    await p.waitForTimeout(100);
    const arada = await p.evaluate(() => ({ dir: { ...game.inputDir } }));
    await cdpDokun(p, 'touchEnd', []);
    await p.waitForTimeout(100);
    const son = await p.evaluate(() => ({ dir: { ...game.inputDir }, aktif: document.getElementById('joystick').classList.contains('aktif') }));
    sina(`${dil} ${en}x${boy}: iki parmak (hareket + düğme) birlikte çalışır`, () => {
      assert.ok(orta.aktif, 'joystick etkin değil');
      assert.ok(orta.dir.x > 0.5, `joystick yönü ${JSON.stringify(orta.dir)}`);
      assert.deepEqual(orta.kullanilan, [ilkAnahtar], 'düğme eşyayı kullanmadı');
      assert.ok(Math.hypot(orta.x - orta.x0, orta.y - orta.y0) > 1, 'oyuncu hareket etmedi');
      assert.ok(arada.dir.x > 0.5, 'düğme parmağı kalkınca hareket durdu');
      assert.equal(son.dir.x, 0); assert.equal(son.aktif, false);
    });
    await p.close();
  }

  sina('sayfa hatası yok', () => { assert.deepEqual(hatalar, [], hatalar.join(' / ')); });
} catch (e) {
  sonuclar.push(`✗ akış yarıda kaldı: ${e.stack.split('\n').slice(0, 3).join(' | ')}`);
} finally {
  await b.close();
  sunucu.close();
}
sonuclar.forEach((s) => console.log(s));
if (hatalar.length) console.log(hatalar.join('\n'));
const kalan = sonuclar.filter((s) => s.startsWith('✗'));
assert.equal(kalan.length, 0, `${kalan.length} sınama başarısız`);
console.log(`TAMAM: ${sonuclar.length} sınama`);
