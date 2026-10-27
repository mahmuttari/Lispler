// Calqora: reklamsız üye için AdMob SDK'sı HİÇ başlatılmaz (www/js/reklam.js başlığındaki ilk kural). Ayrı bir süreçte
// çalışır, çünkü reklam.js'in durumu modül içindedir: reklam.test.mjs'deki üye olmayan akışla karışmasın.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sahteOrtam } from './yardimci.mjs';

const ortam = sahteOrtam({ uye: true });
const premium = await import('../www/js/premium.js');
const reklam = await import('../www/js/reklam.js');

test('üye: Play "üye" deyince AdMob eklentisine tek çağrı yapılmaz (UMP de sorulmaz)', async () => {
  await premium.refresh();
  await ortam.bekle();
  assert.ok(premium.isPremium());
  assert.ok(ortam.cagri.some((c) => c.ad === 'getPurchases'));
  assert.deepEqual(ortam.cagri.filter((c) => c.ek === 'AdMob'), []);
  reklam.reklamAyarla({ durum: () => ({ gorunur: true, yaziliyor: false, sayfaAcik: false }) });
  assert.equal(reklam.dogalDurak('sekme'), false);
  assert.equal(reklam.reklamHazir(), false);
});

test('üye: Play\'e ulaşılamasa da (çevrimdışı) son bilinen yanıt "üye" ise reklam başlamaz', async () => {
  window.Capacitor.Plugins.NativePurchases.getPurchases = async () => { throw new Error('çevrimdışı'); };
  await premium.refresh();
  await ortam.bekle();
  assert.ok(premium.isPremium());
  assert.deepEqual(ortam.cagri.filter((c) => c.ek === 'AdMob'), []);
});

test('üyelik bitince (Play artık "üye değil" diyor) reklamlar başlar: önce UMP, sonra initialize', async () => {
  ortam.uye = false;
  window.Capacitor.Plugins.NativePurchases.getPurchases = async () => ({ purchases: [] });
  await premium.refresh();
  await ortam.bekle();
  assert.equal(premium.isPremium(), false);
  const adlar = ortam.cagri.filter((c) => c.ek === 'AdMob').map((c) => c.ad);
  assert.ok(adlar.indexOf('requestConsentInfo') >= 0 && adlar.indexOf('requestConsentInfo') < adlar.indexOf('initialize'), adlar.join(','));
});
