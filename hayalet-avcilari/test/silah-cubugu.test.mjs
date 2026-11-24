// Hayalet Avcıları: silah çubuğu yerleşimi — çevrimdışı sınama.
// Kullanıcının isteği (24 Kasım 2026): çok sayıda tek kullanımlık silah varken soldaki dikey çubuk
// sol üstteki HUD panellerine (canlar, "Bölüm 1", boss süresi) binmesin; 340×640 dikeyden
// 960×420 yataya kadar hiçbir boyutta çakışma olmasın, Türkçe ve Arapça (aynalı) dahil.
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
  await p.addInitScript((d) => { localStorage.setItem('hayaletAvcilariDil', d); }, dil);
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof startGame === 'function');
  await p.evaluate(() => { localStorage.setItem(VERSION_KEY, APP_VERSION); save.playerName = save.playerName || 'Deniz'; });
  return p;
}

const kesisim = (a, c) => !(a.right <= c.left || a.left >= c.right || a.bottom <= c.top || a.top >= c.bottom);
const kutu = (r) => ({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });

try {
  for (const [dil, en, boy] of [
    ['tr', 844, 390], ['ar', 740, 360], ['tr', 390, 844], ['ar', 340, 640],
    ['tr', 740, 360], ['tr', 340, 640], ['tr', 960, 420], ['ar', 960, 420],
  ]) {
    const p = await sayfa(dil, en, boy);
    const sonuc = await p.evaluate(() => {
      startGame();
      // Bütün tek kullanımlık silahlardan 5 stok ver ve çubuğu yenile
      Object.keys(WEAPONS).forEach((k) => { ensureAmmoStock(game.player.charKey)[k] = 5; });
      refreshWeaponBar();
      const butonlar = [...document.querySelectorAll('#weapon-bar .weapon-slot')].map((e) => {
        const r = e.getBoundingClientRect();
        return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
      });
      const paneller = [...document.querySelectorAll('.hud-left > *, .hud-right > *')]
        .filter((e) => e.offsetParent !== null && e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().height > 0)
        .map((e) => {
          const r = e.getBoundingClientRect();
          return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
        });
      const cevre = [document.querySelector('.pause-btn'), document.getElementById('joystick')].map((e) => {
        const r = e.getBoundingClientRect();
        return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
      });
      const envanter = document.getElementById('inv-btn').getBoundingClientRect();
      return { butonlar, paneller, cevre, envanter: { left: envanter.left, top: envanter.top, right: envanter.right, bottom: envanter.bottom }, w: innerWidth, h: innerHeight };
    });

    sina(`${dil} ${en}×${boy}: yedi silah düğmesi çizilir`, () => {
      assert.equal(sonuc.butonlar.length, 7);
    });
    sina(`${dil} ${en}×${boy}: düğmeler en az 44 px ve ekran içinde`, () => {
      for (const d of sonuc.butonlar) {
        assert.ok(d.width >= 44 && d.height >= 44, `boyut ${d.width}×${d.height}`);
        assert.ok(d.left >= -0.5 && d.top >= -0.5 && d.right <= sonuc.w + 0.5 && d.bottom <= sonuc.h + 0.5, 'ekran dışında');
      }
    });
    sina(`${dil} ${en}×${boy}: düğmeler HUD panelleriyle, duraklatla ve joystick'le çakışmaz`, () => {
      for (const d of sonuc.butonlar) {
        for (const h of [...sonuc.paneller, ...sonuc.cevre]) {
          assert.equal(kesisim(d, h), false, `çakışma: düğme ${JSON.stringify(d)} kutu ${JSON.stringify(h)}`);
        }
      }
    });
    sina(`${dil} ${en}×${boy}: envanter düğmesi erişilebilir ve çubukla çakışmaz`, () => {
      const e = sonuc.envanter;
      assert.ok(e.left >= 0 && e.right <= sonuc.w && e.top >= 0 && e.bottom <= sonuc.h, 'envanter ekran dışında');
      for (const d of sonuc.butonlar) assert.equal(kesisim(d, e), false);
    });
    await p.close();
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
