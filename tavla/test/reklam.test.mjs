// Tavla — reklam kuralları (node --test). Kullanıcı kararı (4 Kasım 2026, "tavla da da reklam olacak"; sınırlar
// Kelime Bilcek'le aynı): oyun sırasında hiç reklam yok; geçiş reklamı yalnız maç bitince sonuç penceresinden ayrılırken;
// ilk 3 maçta yok; iki reklam arası en az 5 dk; saatte en çok 4; banner yalnız ana menüde; AB onayı (UMP);
// initialize({ maxAdContentRating: "General" }); web'de reklam kodu hiçbir şey yapmaz.
// Sahte AdMob eklentisi globalThis.window.Capacitor.Plugins.AdMob olarak verilir, çağrılar kaydedilir.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DAKIKA = 60e3;

const depo = new Map();
globalThis.localStorage = {
  getItem: (k) => (depo.has(k) ? depo.get(k) : null),
  setItem: (k, v) => depo.set(k, String(v)),
  removeItem: (k) => depo.delete(k),
};
globalThis.window = globalThis;

let cagrilar = [];
let onay;
function sahteAdMob() {
  const kaydet = (ad, sonuc) => async (arg) => { cagrilar.push({ ad, arg: arg ?? null }); return typeof sonuc === 'function' ? sonuc() : sonuc; };
  return {
    initialize: kaydet('initialize'),
    requestConsentInfo: kaydet('requestConsentInfo', () => onay),
    showConsentForm: kaydet('showConsentForm', () => ({ ...onay, canRequestAds: true })),
    showPrivacyOptionsForm: kaydet('showPrivacyOptionsForm'),
    addListener: (olay) => { cagrilar.push({ ad: 'addListener', arg: olay }); return Promise.resolve({ remove: async () => {} }); },
    prepareInterstitial: kaydet('prepareInterstitial'),
    showInterstitial: kaydet('showInterstitial'),
    showBanner: kaydet('showBanner'),
    hideBanner: kaydet('hideBanner'),
    resumeBanner: kaydet('resumeBanner'),
  };
}
function yeniModul({ eklenti = true, kimlik = true } = {}) {
  delete require.cache[require.resolve('../www/reklam.js')];
  globalThis.Capacitor = eklenti ? { Plugins: { AdMob: sahteAdMob() } } : undefined;
  const R = require('../www/reklam.js');
  if (kimlik) { R.REKLAM.gecisId = 'ca-app-pub-2417242373034448/1111111111'; R.REKLAM.bannerId = 'ca-app-pub-2417242373034448/2222222222'; }
  return R;
}
const say = (ad) => cagrilar.filter((c) => c.ad === ad).length;
beforeEach(() => {
  cagrilar = []; depo.clear();
  onay = { status: 'NOT_REQUIRED', isConsentFormAvailable: false, canRequestAds: true, privacyOptionsRequirementStatus: 'NOT_REQUIRED' };
});

test('sıklık: ilk 3 maçta yok, 4. maçta var; 5 dk ara; saatte en çok 4', () => {
  const R = yeniModul();
  const T = 1e12;
  assert.equal(R.gecisUygunMu({ mac: 3, son: [] }, T), false);
  assert.equal(R.gecisUygunMu({ mac: 4, son: [] }, T), true);
  assert.equal(R.gecisUygunMu({ mac: 10, son: [T - 5 * DAKIKA + 1] }, T), false);
  assert.equal(R.gecisUygunMu({ mac: 10, son: [T - 5 * DAKIKA] }, T), true);
  assert.equal(R.gecisUygunMu({ mac: 10, son: [T - 50 * DAKIKA, T - 40 * DAKIKA, T - 30 * DAKIKA, T - 20 * DAKIKA] }, T), false);
  assert.equal(R.gecisUygunMu({ mac: 10, son: [T - 61 * DAKIKA, T - 40 * DAKIKA, T - 30 * DAKIKA, T - 20 * DAKIKA] }, T), true);
  assert.deepEqual(R.reklamKaydiniTemizle('x'), { mac: 0, son: [] });
});

test('başlatma: initialize bir kez, "General" derecesiyle; geçiş reklamı ondan sonra hazırlanır', async () => {
  const R = yeniModul();
  await R.reklamBaslat();
  assert.equal(say('initialize'), 1);
  assert.equal(cagrilar.find((c) => c.ad === 'initialize').arg.maxAdContentRating, 'General');
  const adlar = cagrilar.map((c) => c.ad);
  assert.ok(adlar.indexOf('prepareInterstitial') > adlar.indexOf('initialize'));
});

test('AB onayı: gerekiyorsa form; onay yoksa reklam istenmez', async () => {
  onay = { status: 'REQUIRED', isConsentFormAvailable: true, canRequestAds: false, privacyOptionsRequirementStatus: 'REQUIRED' };
  let R = yeniModul();
  await R.reklamBaslat();
  assert.equal(say('showConsentForm'), 1);
  assert.equal(R.reklam.gizlilikGerekli, true);
  cagrilar = [];
  onay = { status: 'REQUIRED', isConsentFormAvailable: false, canRequestAds: false, privacyOptionsRequirementStatus: 'REQUIRED' };
  R = yeniModul();
  await R.reklamBaslat();
  assert.equal(R.reklam.hazir, false);
  assert.equal(say('prepareInterstitial'), 0);
});

test('banner yalnız ana menüde; oyunda gizli; açılışta menüdeyse başlatmadan sonra gelir', async () => {
  const R = yeniModul();
  await R.reklamEkranDegisti('menu');           // reklam henüz hazır değil
  assert.equal(say('showBanner'), 0);
  await R.reklamBaslat();
  assert.equal(say('showBanner'), 1);
  assert.equal(cagrilar.find((c) => c.ad === 'showBanner').arg.position, 'BOTTOM_CENTER');
  await R.reklamEkranDegisti(null);             // oyuna geçildi
  assert.equal(say('hideBanner'), 1);
  await R.reklamEkranDegisti('menu');
  assert.equal(say('resumeBanner'), 1);
});

test('geçiş reklamı yalnız maç sonunda; ilk 3 maçta yok; 5 dakika dolmadan ikincisi yok', async () => {
  const R = yeniModul();
  await R.reklamBaslat();
  for (let i = 0; i < 3; i++) assert.equal(await R.reklamMacSonu(), false);
  assert.equal(say('showInterstitial'), 0);
  assert.equal(await R.reklamMacSonu(), true);    // 4. maç
  assert.equal(say('showInterstitial'), 1);
  await R.reklamBaslat();                          // yeniden yükleme (gerçekte interstitialAdDismissed yapar)
  assert.equal(await R.reklamMacSonu(), false);   // 5 dk dolmadı
  assert.equal(say('showInterstitial'), 1);
});

test('web: eklenti yoksa hiçbir şey yapmaz ve hata vermez', async () => {
  const R = yeniModul({ eklenti: false });
  await R.reklamBaslat();
  await R.reklamEkranDegisti('menu');
  assert.equal(await R.reklamMacSonu(), false);
  await R.reklamGizlilikSecenekleri();
  assert.equal(cagrilar.length, 0);
});

test('reklam birimi kimliği girilmemişse reklam istenmez', async () => {
  const R = yeniModul({ kimlik: false });
  if (R.reklamKimligiGecerli(R.REKLAM.gecisId)) return; // gerçek kimlikler girildi: bu sınama artık geçerli değil
  await R.reklamBaslat();
  await R.reklamEkranDegisti('menu');
  assert.equal(say('prepareInterstitial'), 0);
  assert.equal(say('showBanner'), 0);
});

test('Android: AdMob uygulama kimliği manifestte; AD_ID izni bildirildi', () => {
  const m = fs.readFileSync(path.join(KOK, 'android/app/src/main/AndroidManifest.xml'), 'utf8');
  assert.match(m, /com\.google\.android\.gms\.ads\.APPLICATION_ID"\s+android:value="ca-app-pub-\d{16}~\d{10}"/);
  assert.match(m, /com\.google\.android\.gms\.permission\.AD_ID" \/>/);
});

test('oyun kodu reklamı yalnız menü ve maç sonu düğmelerinden çağırır, doğrudan göstermez', () => {
  const o = fs.readFileSync(path.join(KOK, 'www/assets/index-BLMBGPAE.js'), 'utf8');
  assert.equal((o.match(/TavlaReklam\?\.macSonu\(\)/g) || []).length, 2, 'iki maç sonu düğmesi');
  assert.equal((o.match(/TavlaReklam\?\.ekran\(/g) || []).length, 2, 'menü açılış/kapanış');
  assert.equal((o.match(/showInterstitial|showBanner/g) || []).length, 0);
  assert.match(fs.readFileSync(path.join(KOK, 'www/index.html'), 'utf8'), /<script src="\/reklam\.js"><\/script>/);
});
