// Hayalet Avcıları: silah çubuğu — çevrimdışı sınama.
// Çubukta en çok 3 silah gösterilir; "⋯" düğmesiyle açılan panelden oyuncu istediği 3 silahı seçer.
// Seçim save.silahSecim içinde saklanır. Yerleşim 340 px telefon ve Arapça (aynalı) dahil sınanır.
// Çalıştırma: node hayalet-avcilari/test/silah-cubugu.test.mjs   (Playwright + Chromium; ağ ve Firebase gerekmez)
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
async function sayfa(dil, en, boy) {
  const p = await b.newPage({ viewport: { width: en, height: boy }, hasTouch: true });
  p.on('pageerror', (e) => hatalar.push(`${dil}: ${e.stack}`));
  await p.addInitScript((d) => { localStorage.setItem('hayaletAvcilariDil', d); localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1'); }, dil);
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof startGame === 'function');
  await p.evaluate(() => { localStorage.setItem(VERSION_KEY, APP_VERSION); save.playerName = save.playerName || 'Deniz'; });
  return p;
}
// Oyunu hazırla: bütün silahlara stok ver, çubuğu yenile
async function hazir(p, stoklar) {
  await p.evaluate((stoklar) => {
    startGame();
    game.paused = false;
    const stok = ensureAmmoStock(game.player.charKey);
    Object.keys(WEAPONS).forEach((k) => { stok[k] = (stoklar && stoklar[k]) || 0; });
    save.silahSecim = [];
    refreshWeaponBar();
  }, stoklar || null);
}
const hepsi = { bomba: 5, dondurma: 5, simsek: 5, kasirga: 5, ilkyrd: 5, roket: 5, gorunmez: 5 };

const kesisim = (a, c) => !(a.right <= c.left || a.left >= c.right || a.bottom <= c.top || a.top >= c.bottom);

try {
  // a) 7 silah stoğu: tam 3 .weapon-slot + 1 "⋯" düğmesi, "+4"
  const pa = await sayfa('tr', 390, 844);
  await hazir(pa, hepsi);
  const a = await pa.evaluate(() => {
    const more = document.querySelector('#weapon-bar .weapon-more');
    return {
      slot: document.querySelectorAll('#weapon-bar .weapon-slot').length,
      moreText: more ? more.textContent : '',
      more: !!more,
    };
  });
  sina('a) 7 silahta tam 3 slot + "⋯" düğmesi ve "+4"', () => {
    assert.equal(a.slot, 3);
    assert.equal(a.more, true);
    assert.ok(a.moreText.includes('+4'), a.moreText);
  });
  await pa.close();

  // b) panelden 3 silah seç: sıra korunur, save.silahSecim kalıcıdır, yenileme ve loadSave sonrası sürer
  const pb = await sayfa('tr', 390, 844);
  await hazir(pb, hepsi);
  await pb.click('#weapon-bar .weapon-more');
  for (const k of ['simsek', 'roket', 'bomba']) await pb.click(`#silah-sec-panel .silah-sec-slot[data-weapon="${k}"]`);
  const b1 = await pb.evaluate(() => ({
    sira: [...document.querySelectorAll('#weapon-bar .weapon-slot')].map((e) => e.dataset.weapon),
    secim: save.silahSecim.slice(),
    acik: document.getElementById('silah-sec-panel').classList.contains('open'),
  }));
  sina('b) seçilen 3 silah çubukta o sırayla görünür ve save.silahSecim yazılır', () => {
    assert.deepEqual(b1.sira, ['simsek', 'roket', 'bomba']);
    assert.deepEqual(b1.secim, ['simsek', 'roket', 'bomba']);
    assert.equal(b1.acik, true);
  });
  const b2 = await pb.evaluate(() => {
    refreshWeaponBar();
    const once = [...document.querySelectorAll('#weapon-bar .weapon-slot')].map((e) => e.dataset.weapon);
    const kayit = save.silahSecim.slice();
    Object.assign(save, loadSave()); // kayıttan yeniden yükle
    refreshWeaponBar();
    return { once, kayit, sonra: [...document.querySelectorAll('#weapon-bar .weapon-slot')].map((e) => e.dataset.weapon), secim: save.silahSecim.slice() };
  });
  sina('b) seçim refreshWeaponBar ve loadSave sonrası korunur', () => {
    assert.deepEqual(b2.once, ['simsek', 'roket', 'bomba']);
    assert.deepEqual(b2.kayit, ['simsek', 'roket', 'bomba']);
    assert.deepEqual(b2.sonra, ['simsek', 'roket', 'bomba']);
    assert.deepEqual(b2.secim, ['simsek', 'roket', 'bomba']);
  });
  // c) 4. seçim en erken seçileni değiştirir
  await pb.click('#silah-sec-panel .silah-sec-slot[data-weapon="kasirga"]');
  const c1 = await pb.evaluate(() => ({
    secim: save.silahSecim.slice(),
    sira: [...document.querySelectorAll('#weapon-bar .weapon-slot')].map((e) => e.dataset.weapon),
  }));
  sina('c) 4. seçim en erken seçileni değiştirir', () => {
    assert.deepEqual(c1.secim, ['roket', 'bomba', 'kasirga']);
    assert.deepEqual(c1.sira, ['roket', 'bomba', 'kasirga']);
  });
  // c) 2 silah stoğunda 2 slot + "⋯"; 1 silahta "⋯" yok
  const c2 = await pb.evaluate(() => {
    const stok = ensureAmmoStock(game.player.charKey);
    Object.keys(WEAPONS).forEach((k) => { stok[k] = 0; });
    stok.bomba = 2; stok.dondurma = 1;
    save.silahSecim = [];
    refreshWeaponBar();
    const iki = { slot: document.querySelectorAll('#weapon-bar .weapon-slot').length, more: !!document.querySelector('#weapon-bar .weapon-more') };
    stok.dondurma = 0;
    refreshWeaponBar();
    const bir = { slot: document.querySelectorAll('#weapon-bar .weapon-slot').length, more: !!document.querySelector('#weapon-bar .weapon-more') };
    return { iki, bir };
  });
  sina('c) 2 silahta 2 slot + "⋯", 1 silahta "⋯" yok', () => {
    assert.equal(c2.iki.slot, 2);
    assert.equal(c2.iki.more, true);
    assert.equal(c2.bir.slot, 1);
    assert.equal(c2.bir.more, false);
  });
  await pb.close();

  // d) tek kişilikte panel oyunu duraklatır, kapanınca sürer; çevrimiçi host'ta duraklatmaz
  const pd = await sayfa('tr', 390, 844);
  await hazir(pd, hepsi);
  const d1 = await pd.evaluate(() => {
    game.paused = false;
    silahSecPanelAc();
    const acik = game.paused === true;
    silahSecPanelKapat();
    return { acik, kapali: game.paused === false };
  });
  const d2 = await pd.evaluate(() => {
    online.mode = 'host';
    game.paused = false;
    silahSecPanelAc();
    const acik = game.paused === true;
    silahSecPanelKapat();
    online.mode = null;
    return acik;
  });
  sina('d) tek kişilikte panel duraklatır/kapatınca sürer, çevrimiçinde duraklatmaz', () => {
    assert.equal(d1.acik, true);
    assert.equal(d1.kapali, true);
    assert.equal(d2, false);
  });
  await pd.close();

  // e) yerleşim: 3 + 1 düğme dikey sütunda, en fazla iki sütun, ekran içinde, panel ekran içinde
  for (const [dil, en, boy] of [
    ['tr', 390, 844], ['ar', 340, 640], ['ar', 740, 360], ['tr', 960, 420],
  ]) {
    const p = await sayfa(dil, en, boy);
    await hazir(p, hepsi);
    await p.waitForTimeout(250); // ekran giriş animasyonu bitsin: gerçek ölçüler otursun
    const sonuc = await p.evaluate(() => {
      layoutWeaponBar();
      const kutu = (e) => { const r = e.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
      const dugmeler = [...document.querySelectorAll('#weapon-bar .weapon-slot, #weapon-bar .weapon-more')].map(kutu);
      document.querySelector('#weapon-bar .weapon-more').click();
      const panel = document.getElementById('silah-sec-panel');
      const pr = panel.getBoundingClientRect();
      return {
        dugmeler, bar: kutu(document.getElementById('weapon-bar')),
        panel: { left: pr.left, top: pr.top, right: pr.right, bottom: pr.bottom },
        panelAcik: panel.classList.contains('open'), w: innerWidth, h: innerHeight,
        env: kutu(document.getElementById('inv-btn')),
        joy: kutu(document.getElementById('joystick')),
      };
    });
    sina(`${dil} ${en}×${boy}: 3 + 1 düğme dikey sütunda ve ekran içinde`, () => {
      assert.equal(sonuc.dugmeler.length, 4);
      for (const d of sonuc.dugmeler) {
        assert.ok(d.width >= 44 && d.height >= 44, `boyut ${d.width}×${d.height}`);
        assert.ok(d.left >= -0.5 && d.right <= sonuc.w + 0.5 && d.bottom <= sonuc.h + 0.5, 'ekran dışında');
      }
      // Düğmeler sütunlara ayrılır; her sütunda DOM sırası aşağıdan yukarıya doğru.
      const sutunlar = [];
      for (const d of sonuc.dugmeler) {
        const s = sutunlar.find((x) => Math.abs(x.sol - d.left) <= 4);
        if (s) s.dugmeler.push(d); else sutunlar.push({ sol: d.left, dugmeler: [d] });
      }
      assert.ok(sutunlar.length <= 2, `çok sütun: ${sutunlar.length}`);
      for (const s of sutunlar) {
        for (let i = 1; i < s.dugmeler.length; i++) {
          assert.ok(s.dugmeler[i].bottom <= s.dugmeler[i - 1].top, 'sütun sırası yanlış');
        }
      }
      assert.ok(sonuc.bar.right <= sonuc.w + 0.5 && sonuc.bar.left >= -0.5, 'çubuk yatay taşıyor');
      for (const d of sonuc.dugmeler) assert.equal(kesisim(d, sonuc.env), false);
    });
    sina(`${dil} ${en}×${boy}: seçim paneli ekran içinde`, () => {
      assert.equal(sonuc.panelAcik, true);
      assert.ok(sonuc.panel.left >= -0.5 && sonuc.panel.right <= sonuc.w + 0.5, 'panel yatay dışarıda');
      assert.ok(sonuc.panel.top >= -0.5 && sonuc.panel.bottom <= sonuc.h + 0.5, 'panel dikey dışarıda');
    });
    await p.close();
  }
  sina('sayfa hatası yok', () => { assert.deepEqual(hatalar, [], hatalar.join(' / ')); });
} catch (e) {
  sonuclar.push(`✗ akış yarıda kaldı: ${e.message}`);
} finally {
  await b.close();
  sunucu.close();
}
sonuclar.forEach((s) => console.log(s));
if (hatalar.length) console.log(hatalar.join('\n'));
const kalan = sonuclar.filter((s) => s.startsWith('✗'));
assert.equal(kalan.length, 0, `${kalan.length} sınama başarısız`);
console.log(`TAMAM: ${sonuclar.length} sınama`);
