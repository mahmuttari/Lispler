// Hayalet Avcıları: zengin sentez ses efektleri (3.18.0) — çevrimdışı sınama.
// Her efekt bir kez OfflineAudioContext ile AudioBuffer'a render edilir; tampon süresi, tepe genliği, NaN, ses sınırı,
// kategori ses düzeyi ve kayıtlı hayalet seslerinin korunması sınanır.
// Çalıştırma: node hayalet-avcilari/test/ses-sentez.test.mjs   (Playwright + Chromium; ağ ve Firebase gerekmez)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WWW = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);
const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg', '.woff2': 'font/woff2' };
const sunucu = http.createServer((q, r) => {
  const f = path.join(WWW, decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html');
  if (!f.startsWith(WWW) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': TUR[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(0);
const adres = `http://127.0.0.1:${sunucu.address().port}/index.html`;

// Efekt başına hedef süre (sn); render edilen tampon bunun ±%50'sinde olmalı
const BEKLENEN = {
  click: 0.04, toast: 0.12, fire: 0.09, fireBaloncuk: 0.10, fireLazer: 0.12, fireYesil: 0.14,
  firePompali: 0.16, fireBazuka: 0.28, hit: 0.08, kill: 0.25, boss: 0.70, bossDie: 1.20,
  damage: 0.30, pickup: 0.15, gem: 0.35, emerald: 0.40, buy: 0.30, unlock: 0.60, heart: 0.60,
  levelUp: 0.90, win: 1.60, lose: 1.40, guc: 0.70, bomba: 0.90, buz: 0.70, simsek: 0.50,
  kasirga: 1.50, roket: 0.80, sifa: 0.60, gorunmez: 0.60, gok: 1.80, su: 0.35, kopru: 0.40,
  timsahCik: 0.40, timsahIsir: 0.20, yildiz: 0.40,
};

const sonuclar = [];
function sina(ad, fn) {
  try { fn(); sonuclar.push(`✓ ${ad}`); } catch (e) { sonuclar.push(`✗ ${ad}: ${e.message.split('\n')[0]}`); }
}

const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--autoplay-policy=no-user-gesture-required'] });
const hatalar = [];
try {
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript(() => {
    localStorage.setItem('hayaletAvcilariDil', 'tr'); localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9'); localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1');
    // Canlı bağlamda başlatılan tampon kaynaklarını say (OfflineAudioContext ayrı sınıf: sayılmaz)
    window.__kaynaklar = [];
    const Asil = window.AudioContext;
    window.AudioContext = class extends Asil { constructor(o) { super(o); window.__sesSecenek = o; } };
    const asilKaynak = window.AudioContext.prototype.createBufferSource;
    window.AudioContext.prototype.createBufferSource = function () {
      const s = asilKaynak.call(this);
      window.__kaynaklar.push(s);
      return s;
    };
  });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  // index.html ses-sentez.js'i game.js'ten sonra yükler; sınama önceki yöntemleri yakalayabilmek için o yüklemeyi
  // engeller ve betiği aşağıda kendisi ekler
  await p.route(/\/ses-sentez\.js$/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForTimeout(300);

  // ses-sentez.js'ten ÖNCEKİ ses yöntemleri (kayıtlı hayalet sesleri değişmemeli)
  await p.evaluate(() => { window.__eskiSmall = audio.smallGhost; window.__eskiBig = audio.bigGhost; });
  await p.addScriptTag({ url: '/ses-sentez.js?sinama=1' });
  await p.evaluate(() => audio.init());

  // 1) bütün efektler render edilsin
  let hazir = false;
  try {
    await p.waitForFunction(() => typeof window.SES_ADLARI !== 'undefined' &&
      audio.sesHazirSayisi() === window.SES_ADLARI.length, null, { timeout: 90000 });
    hazir = true;
  } catch (_) {}

  const adlar = await p.evaluate(() => (window.SES_ADLARI || []).slice());
  const durum = await p.evaluate((adlar) => {
    const detay = {};
    for (const ad of adlar) {
      const buf = audio.sesTampon(ad);
      if (!buf) { detay[ad] = 'tampon yok'; continue; }
      const ch = buf.getChannelData(0);
      let tepe = 0, nan = false;
      for (let i = 0; i < ch.length; i++) {
        const v = ch[i];
        if (!Number.isFinite(v)) nan = true;
        else { const a = Math.abs(v); if (a > tepe) tepe = a; }
      }
      detay[ad] = { sure: buf.duration, tepe, nan };
    }
    return { sayi: audio.sesHazirSayisi(), detay };
  }, adlar);

  sina('SES_ADLARI bütün efektleri içerir', () => {
    assert.ok(hazir, `tamponlar hazır değil (${durum.sayi}/${adlar.length})`);
    assert.deepEqual(adlar.slice().sort(), Object.keys(BEKLENEN).sort());
  });
  sina('her efektin tamponu var; süre hedefin ±%50\'sinde', () => {
    for (const ad of Object.keys(BEKLENEN)) {
      const d = durum.detay[ad];
      assert.ok(d && d.sure > 0, `${ad}: ${JSON.stringify(d)}`);
      const hedef = BEKLENEN[ad];
      assert.ok(d.sure >= hedef * 0.5 && d.sure <= hedef * 1.5, `${ad}: süre ${d.sure.toFixed(3)} (hedef ${hedef})`);
    }
  });
  sina('her tamponun tepe genliği 0.3..0.9 ve NaN yok', () => {
    for (const ad of Object.keys(BEKLENEN)) {
      const d = durum.detay[ad];
      assert.ok(d && !d.nan, `${ad}: NaN`);
      assert.ok(d.tepe >= 0.3 && d.tepe <= 0.9, `${ad}: tepe ${d.tepe.toFixed(3)}`);
    }
  });

  // 2) metotlar var; hata vermeden çağrılıyor
  const metotlar = await p.evaluate((adlar) => {
    const yok = adlar.filter((ad) => typeof audio[ad] !== 'function');
    let hata = null;
    audio.enabled = false; // ses çıkarmadan yalnız çağrı denetimi
    try { for (const ad of adlar) audio[ad](); audio.fire(); audio.fire('lazer'); } catch (e) { hata = e.message; }
    audio.enabled = true;
    return { yok, hata };
  }, adlar);
  sina('her efekt için audio metodu var ve çağrı hata vermiyor', () => {
    assert.deepEqual(metotlar.yok, []);
    assert.equal(metotlar.hata, null);
  });

  const fireFarkli = await p.evaluate(() => {
    window.__kaynaklar.length = 0;
    audio.fire();
    audio.fire('lazer');
    const s = window.__kaynaklar;
    if (s.length < 2) return { adet: s.length };
    return { adet: s.length, ayni: s[s.length - 2].buffer === s[s.length - 1].buffer };
  });
  sina('audio.fire() ve audio.fire("lazer") farklı tampon çalar', () => {
    assert.ok(fireFarkli.adet >= 2, `kaynak ${fireFarkli.adet}`);
    assert.equal(fireFarkli.ayni, false);
  });

  // 3) ses sınırı ve efekt arası (önceki uzun efektlerin bitmesini bekle)
  await p.waitForTimeout(2300);
  const sinir = await p.evaluate(() => {
    window.__kaynaklar.length = 0;
    for (let i = 0; i < 50; i++) audio.click(); // arası olmayan efekt: ses sınırına takılır
    return window.__kaynaklar.length;
  });
  sina('aynı anda en çok 10 ses başlar', () => {
    assert.ok(sinir <= 10 && sinir >= 1, `click ${sinir}`);
  });
  await p.waitForTimeout(250); // kısa tık seslerinin bitmesini bekle (ses sayacı düşsün)
  const ara = await p.evaluate(() => {
    window.__kaynaklar.length = 0;
    audio.hit();
    audio.hit(); // 35 ms geçmeden ikincisi çalınmaz
    return window.__kaynaklar.length;
  });
  sina('efekt başına en az ara uygulanır (hit)', () => {
    assert.equal(ara, 1, `hit ${ara}`);
  });

  // 4) kayıtlı hayalet sesleri değişmedi ve örnekleri çalıyor
  await p.waitForFunction(() => audio.samples && audio.samples.smallGhost && audio.samples.bigGhost, null, { timeout: 20000 });
  const hayalet = await p.evaluate(() => {
    window.__kaynaklar.length = 0;
    audio._lastSmallGhost = 0;
    audio.smallGhost();
    const kucuk = window.__kaynaklar.length;
    const kucukTampon = kucuk ? window.__kaynaklar[0].buffer === audio.samples.smallGhost : false;
    const buyuk = audio.playSample('bigGhost', 0.5);
    return {
      kucukAyni: audio.smallGhost === window.__eskiSmall,
      buyukAyni: audio.bigGhost === window.__eskiBig,
      kucuk, kucukTampon, buyuk,
    };
  });
  sina('audio.smallGhost / audio.bigGhost aynı fonksiyonlar', () => {
    assert.deepEqual({ kucukAyni: hayalet.kucukAyni, buyukAyni: hayalet.buyukAyni }, { kucukAyni: true, buyukAyni: true });
  });
  sina('kayıtlı hayalet örnekleri hâlâ çalınıyor', () => {
    assert.equal(hayalet.kucuk, 1);
    assert.equal(hayalet.kucukTampon, true);
    assert.equal(hayalet.buyuk, true);
  });

  // 5) kategori ses düzeyi: sfx = 0 iken sfx efekti ses başlatmaz; fire "fire" sesini kullanır
  await p.waitForTimeout(2300);
  const sesDuzeyi = await p.evaluate(() => {
    const eski = { sfx: audio.volumes.sfx, fire: audio.volumes.fire };
    window.__kaynaklar.length = 0;
    audio.volumes.sfx = 0;
    audio.pickup(); audio.gem(); audio.hit();
    const sfxSifir = window.__kaynaklar.length;
    window.__kaynaklar.length = 0;
    audio.fire(); // fire kategorisi hâlâ 1: çalmalı
    const fireVar = window.__kaynaklar.length;
    audio.volumes.sfx = eski.sfx; audio.volumes.fire = eski.fire;
    return { sfxSifir, fireVar };
  });
  sina('ses düzeyi 0 olan kategoride ses başlamaz', () => {
    assert.equal(sesDuzeyi.sfxSifir, 0);
  });
  sina('fire "fire" kategori sesini kullanır', () => {
    assert.equal(sesDuzeyi.fireVar, 1);
  });

  // 6) audio.enabled = false iken hiçbir ses çalmaz
  const kapali = await p.evaluate(() => {
    window.__kaynaklar.length = 0;
    audio.enabled = false;
    audio.click(); audio.fire(); audio.pickup(); audio.boss(); audio.win();
    const n = window.__kaynaklar.length;
    audio.enabled = true;
    return n;
  });
  sina('audio.enabled = false iken hiçbir ses çalmaz', () => { assert.equal(kapali, 0); });

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
