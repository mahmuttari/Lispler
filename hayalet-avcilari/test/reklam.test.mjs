// Hayalet Avcıları: reklam içerik sınırı (3.13.1) — çevrimdışı sınama.
// Oyun bitti ekranında bir yapay zekâ "sevgili" uygulamasının müstehcen geçiş reklamı çıktı. AdMob'a en yüksek reklam
// içerik derecesi olarak G (genel izleyici: aileler ve çocuklar dahil herkes) verilir; PG, T ve MA dereceli reklamlar
// istenmez. Derece initialize'da RequestConfiguration'a yazılır ve ondan sonraki isteklere uygulanır: reklam yüklemeleri
// initialize'dan sonra gelmelidir. Eklenti (@capacitor-community/admob 8.2.1, AdMob.java) yalnız tam "General" yazımını
// tanır; başka yazım hata vermeden "belirtilmedi"ye düşer.
// Sahte AdMob eklentisi window.Capacitor.Plugins.AdMob olarak verilir; çağrılar sırasıyla kaydedilir.
// Çalıştırma: node hayalet-avcilari/test/reklam.test.mjs   (Playwright + Chromium; ağ ve Firebase gerekmez)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WWW = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);
const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.m4a': 'audio/mp4' };
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
    localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9');
    const kayit = [];
    window.__admob = kayit;
    const cagri = (ad, sonuc) => async (arg) => {
      kayit.push({ ad, arg: arg === undefined ? null : JSON.parse(JSON.stringify(arg)) });
      return sonuc;
    };
    const onay = { status: 'NOT_REQUIRED', isConsentFormAvailable: false, canRequestAds: true, privacyOptionsRequirementStatus: 'NOT_REQUIRED' };
    window.Capacitor = { Plugins: { AdMob: {
      initialize: cagri('initialize'),
      requestConsentInfo: cagri('requestConsentInfo', onay),
      showConsentForm: cagri('showConsentForm', onay),
      addListener: (olay) => { kayit.push({ ad: 'addListener', arg: olay }); return Promise.resolve({ remove: async () => {} }); },
      prepareInterstitial: cagri('prepareInterstitial'),
      prepareRewardVideoAd: cagri('prepareRewardVideoAd'),
      showInterstitial: cagri('showInterstitial'),
      showRewardVideoAd: cagri('showRewardVideoAd'),
      showPrivacyOptionsForm: cagri('showPrivacyOptionsForm'),
    } } };
  });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => window.__admob.some((c) => c.ad === 'prepareRewardVideoAd'), null, { timeout: 5000 });
  const kayit = await p.evaluate(() => window.__admob);
  const kimlik = await p.evaluate(() => ({ gecis: REKLAM.gecisId, odullu: REKLAM.odulluId }));
  const adlar = kayit.map((c) => c.ad);
  const ilk = kayit.find((c) => c.ad === 'initialize');

  sina('initialize bir kez çağrılır', () => { assert.equal(adlar.filter((a) => a === 'initialize').length, 1); });
  sina('en yüksek reklam içerik derecesi G ("General")', () => {
    assert.equal(ilk.arg && ilk.arg.maxAdContentRating, 'General');
  });
  sina('reklamlar derece yazıldıktan sonra istenir', () => {
    const i = adlar.indexOf('initialize');
    assert.ok(adlar.indexOf('prepareInterstitial') > i, 'geçiş reklamı initialize\'dan önce');
    assert.ok(adlar.indexOf('prepareRewardVideoAd') > i, 'ödüllü reklam initialize\'dan önce');
  });
  sina('geçiş ve ödüllü reklam yine yüklenir', () => {
    assert.equal(kayit.find((c) => c.ad === 'prepareInterstitial').arg.adId, kimlik.gecis);
    assert.equal(kayit.find((c) => c.ad === 'prepareRewardVideoAd').arg.adId, kimlik.odullu);
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
