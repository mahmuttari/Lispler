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

  // 3.14.0 — hiç sıkmayan sıklık. gecisUygunMu saf işlevdir; kayıt bu oyunun sayaçları eklenmiş hâlidir.
  // Zaman damgaları ms; "son bir saat" 3600 sn.
  const birim = await p.evaluate(() => {
    const T = 1e12;
    const iyi = { cevrimici: false, sureSn: 45, kutlama: false };
    const k = (o) => Object.assign({ oyun: 6, toplam: 600, sure: 360, son: [] }, o);
    return {
      cevrimici: gecisUygunMu({ cevrimici: true, sureSn: 300, kutlama: false }, { oyun: 20, toplam: 9999, sure: 9999, son: [] }, T),
      kutlama: gecisUygunMu({ ...iyi, kutlama: true }, k({}), T),
      kisa44: gecisUygunMu({ ...iyi, sureSn: 44 }, k({}), T),
      uygun: gecisUygunMu(iyi, k({}), T),
      oyun5: gecisUygunMu(iyi, k({ oyun: 5 }), T),
      oyun6: gecisUygunMu(iyi, k({ oyun: 6 }), T),
      toplam599: gecisUygunMu(iyi, k({ toplam: 599 }), T),
      toplam600: gecisUygunMu(iyi, k({ toplam: 600 }), T),
      ara359: gecisUygunMu(iyi, k({ sure: 359 }), T),
      ara360: gecisUygunMu(iyi, k({ sure: 360 }), T),
      saatte4: gecisUygunMu(iyi, k({ son: [T - 10e3, T - 20e3, T - 30e3, T - 40e3] }), T),
      biriEski: gecisUygunMu(iyi, k({ son: [T - 10e3, T - 20e3, T - 30e3, T - 3601e3] }), T),
    };
  });
  sina('çevrimiçi turdan sonra geçiş reklamı yok', () => { assert.equal(birim.cevrimici, false); });
  sina('sevinç anında (rekor, dünya turu bitti) yok', () => { assert.equal(birim.kutlama, false); });
  sina('45 sn\'den kısa oyundan sonra yok, 45 sn\'de var', () => { assert.equal(birim.kisa44, false); assert.equal(birim.uygun, true); });
  sina('ilk 5 oyun hoş geldin süresi', () => { assert.equal(birim.oyun5, false); assert.equal(birim.oyun6, true); });
  sina('ilk 10 dk oyun süresi boyunca yok', () => { assert.equal(birim.toplam599, false); assert.equal(birim.toplam600, true); });
  sina('iki reklam arası en az 6 dk oyun süresi', () => { assert.equal(birim.ara359, false); assert.equal(birim.ara360, true); });
  sina('saatte en çok 4', () => { assert.equal(birim.saatte4, false); assert.equal(birim.biriEski, true); });

  // Bütünleşik: oyunSonu sayaçları günceller, uygunsa 800 ms sonra bir geçiş reklamı gösterir
  const gosterim = () => p.evaluate(() => window.__admob.filter((c) => c.ad === 'showInterstitial').length);
  const oyunuBitir = (cevrimici, enYuksek, bolum) => p.evaluate(async ({ cevrimici, enYuksek, bolum }) => {
    submitOnlineScore = async () => {};
    save.playerName = 'Defne'; persistSave();
    startGame(); game.player.invuln = 1e9;
    game.level = bolum; save.highestLevel = enYuksek;
    save.reklam = { oyun: 6, toplam: 900, sure: 400, son: [] };
    game.oynananSure = 50;
    if (cevrimici) oyunSonu(false, true); else endGame(false);
    await new Promise((r) => setTimeout(r, 1100));
    return JSON.parse(JSON.stringify(save.reklam));
  }, { cevrimici, enYuksek, bolum });
  const g0 = await gosterim();
  const tek = await oyunuBitir(false, 99, 3);
  const g1 = await gosterim();
  sina('tek kişilik oyun sonunda uygunsa bir geçiş reklamı; sayaç sıfırlanır', () => {
    assert.equal(g1 - g0, 1);
    assert.equal(tek.sure, 0); assert.equal(tek.son.length, 1); assert.equal(tek.oyun, 7); assert.equal(tek.toplam, 950);
  });
  const cev = await oyunuBitir(true, 99, 3);
  const g2 = await gosterim();
  sina('çevrimiçi tur sonunda reklam yok, oyun süresi birikir', () => { assert.equal(g2 - g1, 0); assert.equal(cev.sure, 450); });
  const rekor = await oyunuBitir(false, 1, 3);
  const g3 = await gosterim();
  sina('yeni en yüksek bölümde (rekor) reklam yok', () => { assert.equal(g3 - g2, 0); assert.equal(rekor.sure, 450); });
  // Oyun bitince hemen "Tekrar Oyna": reklam 800 ms sonra yeni oyunun üstüne gelmez, hak sonraki oyun sonuna kalır (3.14.1)
  const hizli = await p.evaluate(async () => {
    startGame(); game.player.invuln = 1e9;
    game.level = 3; save.highestLevel = 99;
    save.reklam = { oyun: 6, toplam: 900, sure: 400, son: [] };
    game.oynananSure = 50;
    endGame(false);
    await new Promise((r) => setTimeout(r, 100));
    tekrarOyna(); game.player.invuln = 1e9;
    await new Promise((r) => setTimeout(r, 1100));
    const r = { running: game.running, reklam: JSON.parse(JSON.stringify(save.reklam)) };
    endGame(false);
    return r;
  });
  const g4 = await gosterim();
  sina('oyun bitince hemen Tekrar Oyna: reklam yeni oyunun üstüne gelmez, hak harcanmaz', () => {
    assert.equal(g4 - g3, 0); assert.equal(hizli.running, true);
    assert.equal(hizli.reklam.sure, 450); assert.equal(hizli.reklam.son.length, 0);
  });
  const odul = await p.evaluate(() => {
    save.reklam.sure = 200;
    reklam.odulKazanildi = true; reklam.odulKullanildi = false;
    odulluKapandi();
    return save.reklam.sure;
  });
  sina('ödüllü reklamı izleyenin sayacı sıfırlanır', () => { assert.equal(odul, 0); });
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
