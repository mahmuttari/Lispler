// Kelime Bilcek — reklam kuralları (node --test). Kullanıcı kararı (4 Kasım 2026):
//   geçiş reklamı yalnız maç bitince (sonuç ekranından lobiye dönerken), maç sırasında hiç reklam yok;
//   ilk 3 maçta yok; iki reklam arası en az 5 dk; saatte en çok 4; banner yalnız lobi ve Şampiyonlar'da;
//   AB onayı (UMP); initialize({ maxAdContentRating: "General" }); web/PWA'da reklam kodu hiçbir şey yapmaz.
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

// localStorage ve window taklidi (reklam.js tarayıcı genel adlarını kullanır)
const depo = new Map();
globalThis.localStorage = {
  getItem: (k) => (depo.has(k) ? depo.get(k) : null),
  setItem: (k, v) => depo.set(k, String(v)),
  removeItem: (k) => depo.delete(k),
};
globalThis.window = globalThis;

let cagrilar = [];
let onay = { status: 'NOT_REQUIRED', isConsentFormAvailable: false, canRequestAds: true, privacyOptionsRequirementStatus: 'NOT_REQUIRED' };
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
const adlar = () => cagrilar.map((c) => c.ad);
const say = (ad) => cagrilar.filter((c) => c.ad === ad).length;

beforeEach(() => { cagrilar = []; depo.clear(); onay = { status: 'NOT_REQUIRED', isConsentFormAvailable: false, canRequestAds: true, privacyOptionsRequirementStatus: 'NOT_REQUIRED' }; });

test('sıklık: ilk 3 maçta yok, 4. maçta var', () => {
  const R = yeniModul();
  const T = 1e12;
  assert.equal(R.gecisUygunMu({ mac: 3, son: [] }, T), false);
  assert.equal(R.gecisUygunMu({ mac: 4, son: [] }, T), true);
});

test('sıklık: iki reklam arası en az 5 dakika', () => {
  const R = yeniModul();
  const T = 1e12;
  assert.equal(R.gecisUygunMu({ mac: 10, son: [T - 5 * DAKIKA + 1] }, T), false);
  assert.equal(R.gecisUygunMu({ mac: 10, son: [T - 5 * DAKIKA] }, T), true);
});

test('sıklık: saatte en çok 4', () => {
  const R = yeniModul();
  const T = 1e12;
  const dort = [T - 50 * DAKIKA, T - 40 * DAKIKA, T - 30 * DAKIKA, T - 20 * DAKIKA];
  assert.equal(R.gecisUygunMu({ mac: 10, son: dort }, T), false);
  const biriEski = [T - 61 * DAKIKA, T - 40 * DAKIKA, T - 30 * DAKIKA, T - 20 * DAKIKA];
  assert.equal(R.gecisUygunMu({ mac: 10, son: biriEski }, T), true);
});

test('bozuk kayıt sıfırlanır', () => {
  const R = yeniModul();
  assert.deepEqual(R.reklamKaydiniTemizle('x'), { mac: 0, son: [] });
  assert.deepEqual(R.reklamKaydiniTemizle({ mac: -3, son: ['a', 5] }), { mac: 0, son: [5] });
});

test('başlatma: initialize bir kez, "General" derecesiyle, reklamlar ondan sonra istenir', async () => {
  const R = yeniModul();
  await R.reklamBaslat();
  const ilk = cagrilar.find((c) => c.ad === 'initialize');
  assert.equal(say('initialize'), 1);
  assert.equal(ilk.arg.maxAdContentRating, 'General');
  assert.ok(adlar().indexOf('prepareInterstitial') > adlar().indexOf('initialize'));
  assert.equal(cagrilar.find((c) => c.ad === 'prepareInterstitial').arg.adId, R.REKLAM.gecisId);
});

test('AB onayı: gerekiyorsa form gösterilir; onay yoksa reklam istenmez', async () => {
  onay = { status: 'REQUIRED', isConsentFormAvailable: true, canRequestAds: false, privacyOptionsRequirementStatus: 'REQUIRED' };
  let R = yeniModul();
  await R.reklamBaslat();
  assert.equal(say('showConsentForm'), 1);
  assert.equal(R.reklam.hazir, true);
  assert.equal(R.reklam.gizlilikGerekli, true);
  cagrilar = [];
  onay = { status: 'REQUIRED', isConsentFormAvailable: false, canRequestAds: false, privacyOptionsRequirementStatus: 'REQUIRED' };
  R = yeniModul();
  await R.reklamBaslat();
  assert.equal(R.reklam.hazir, false);
  assert.equal(say('prepareInterstitial'), 0);
});

test('banner yalnız lobi ve Şampiyonlar ekranında; maçta gizli', async () => {
  const R = yeniModul();
  await R.reklamBaslat();
  await R.reklamEkranDegisti('lobbyScreen');
  assert.equal(say('showBanner'), 1);
  assert.equal(cagrilar.find((c) => c.ad === 'showBanner').arg.position, 'BOTTOM_CENTER');
  await R.reklamEkranDegisti('gameScreen');
  assert.equal(say('hideBanner'), 1);
  await R.reklamEkranDegisti('endScreen');
  await R.reklamEkranDegisti('waitingScreen');
  assert.equal(say('hideBanner'), 1, 'gizliyken yeniden gizlenmez');
  await R.reklamEkranDegisti('leaderboardScreen');
  assert.equal(say('resumeBanner'), 1);
  assert.equal(say('showBanner'), 1);
  for (const e of ['authScreen', 'usernameScreen', 'friendsScreen', 'searchingScreen', 'gameScreen']) {
    await R.reklamEkranDegisti(e);
    assert.equal(R.reklam.bannerGorunur, false, e);
  }
});

test('maç sırasında hiç geçiş reklamı yok: yalnız lobiye dönüşte gösterilir', async () => {
  const R = yeniModul();
  await R.reklamBaslat();
  for (let i = 0; i < 4; i++) R.reklamMacBitti(); // sonuç ekranı: sayaç artar, reklam yok
  assert.equal(say('showInterstitial'), 0);
  assert.equal(await R.reklamLobiyeDonus(), true);
  assert.equal(say('showInterstitial'), 1);
  // hemen bir maç daha: 5 dk dolmadı
  R.reklamMacBitti();
  await R.reklamBaslat(); // yeniden yükleme (gerçekte interstitialAdDismissed dinleyicisi yapar)
  assert.equal(await R.reklamLobiyeDonus(), false);
  assert.equal(say('showInterstitial'), 1);
});

test('ilk 3 maçta lobiye dönüşte reklam yok', async () => {
  const R = yeniModul();
  await R.reklamBaslat();
  for (let i = 0; i < 3; i++) { R.reklamMacBitti(); assert.equal(await R.reklamLobiyeDonus(), false); }
  assert.equal(say('showInterstitial'), 0);
});

test('web/PWA: eklenti yoksa hiçbir şey yapmaz ve hata vermez', async () => {
  const R = yeniModul({ eklenti: false });
  await R.reklamBaslat();
  await R.reklamEkranDegisti('lobbyScreen');
  R.reklamMacBitti();
  assert.equal(await R.reklamLobiyeDonus(), false);
  await R.reklamGizlilikSecenekleri();
  assert.equal(cagrilar.length, 0);
});

test('reklam birimi kimliği girilmemişse reklam istenmez', async () => {
  const R = yeniModul({ kimlik: false });
  if (R.reklamKimligiGecerli(R.REKLAM.gecisId)) return; // kimlikler girildi: bu sınama artık geçerli değil
  await R.reklamBaslat();
  await R.reklamEkranDegisti('lobbyScreen');
  assert.equal(say('prepareInterstitial'), 0);
  assert.equal(say('showBanner'), 0);
});

test('Android: AdMob uygulama kimliği manifestte; AD_ID izni bildirildi', () => {
  const m = fs.readFileSync(path.join(KOK, 'android/app/src/main/AndroidManifest.xml'), 'utf8');
  assert.match(m, /com\.google\.android\.gms\.ads\.APPLICATION_ID"\s+android:value="ca-app-pub-\d{16}~\d{10}"/);
  assert.match(m, /com\.google\.android\.gms\.permission\.AD_ID/);
});

test('oyun.js: reklam yalnız lobiye dönüşte ve ekran değişiminde çağrılır', () => {
  const o = fs.readFileSync(path.join(KOK, 'www/oyun.js'), 'utf8');
  assert.equal((o.match(/reklamLobiyeDonus\(/g) || []).length, 1);
  assert.match(o, /\$\("againBtn"\)\.addEventListener\("click", async \(\) => \{[\s\S]{0,300}reklamLobiyeDonus\(\)/);
  assert.equal((o.match(/showInterstitial|showBanner/g) || []).length, 0, 'oyun.js doğrudan reklam göstermez');
});

test('1.0.1: banner açılırken maça geçilirse banner maçta kalmaz (yarış koşulu, K-24)', async () => {
  const R = yeniModul();
  await R.reklamBaslat();
  const ad = globalThis.Capacitor.Plugins.AdMob;
  const bitis = []; // native tarafta işlemlerin BİTİŞ sırası: son biten banner'ın durumunu belirler
  let bitir;
  ad.showBanner = async () => { await new Promise((r) => { bitir = r; }); bitis.push('goster'); };
  ad.hideBanner = async () => { bitis.push('gizle'); };
  const lobi = R.reklamEkranDegisti('lobbyScreen');
  await new Promise((r) => setTimeout(r, 10));
  const mac = R.reklamEkranDegisti('gameScreen'); // showBanner henüz bitmedi
  await new Promise((r) => setTimeout(r, 10));
  bitir();
  await lobi; await mac;
  assert.deepEqual(bitis, ['goster', 'gizle'], 'son işlem gizleme olmalı (maçta banner yok)');
  assert.equal(R.reklam.bannerGorunur, false);
});

test('1.0.1: banner açılamazsa sonsuz yeniden deneme olmaz', async () => {
  const R = yeniModul();
  await R.reklamBaslat();
  globalThis.Capacitor.Plugins.AdMob.showBanner = async () => { cagrilar.push({ ad: 'showBanner' }); throw new Error('yok'); };
  await R.reklamEkranDegisti('lobbyScreen');
  assert.equal(say('showBanner'), 1);
  assert.equal(R.reklam.bannerGorunur, false);
});

test('1.0.1: gösterilemeyen geçiş reklamı sayılmaz (K-25)', async () => {
  const R = yeniModul();
  await R.reklamBaslat();
  for (let i = 0; i < 4; i++) R.reklamMacBitti();
  globalThis.Capacitor.Plugins.AdMob.showInterstitial = async () => { cagrilar.push({ ad: 'showInterstitial' }); throw new Error('gösterilemedi'); };
  assert.equal(await R.reklamLobiyeDonus(), false);
  assert.deepEqual(R.reklamKaydiOku().son, [], 'başarısız gösterim süre ve saatlik hakkı yemez');
});
