// Calqora reklamsız aboneliği: @capgo/native-purchases 8.9.6'nın (Android) satın alma yanıtlarının eşlenmesi
// (www/js/billing.js › purchaseError, purchase) ve üyelik akışı (premium.js). Sahte eklentiyle, tarayıcısız; ayrı süreç.
// Eklentinin davranışı (NativePurchasesPlugin.java): yalnız PURCHASED (1) durumunda çözer; kullanıcı vazgeçince
// reject("Purchase is not purchased", "USER_CANCELED"), zaten sahipse kod ITEM_ALREADY_OWNED, bekleyen ödemede (PENDING = 2)
// reject("Purchase is pending"), başka durumda kod PURCHASE_STATE_<n>.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sahteOrtam } from './yardimci.mjs';

const ortam = sahteOrtam({ uye: false });
const billing = await import('../www/js/billing.js');
const premium = await import('../www/js/premium.js');
const NP = window.Capacitor.Plugins.NativePurchases;
// Capacitor'un eklenti hatası: message + code
const hata = (message, code) => Object.assign(new Error(message), code ? { code } : {});

test('purchaseError: önce kod, sonra ileti', () => {
  const e = billing.purchaseError;
  assert.equal(e(hata('Purchase is not purchased', 'USER_CANCELED')), 'cancelled', 'kullanıcı vazgeçti (1.0.0 bunu "failed" sayıyordu)');
  assert.equal(e(hata('Purchase is not purchased', 'ITEM_ALREADY_OWNED')), 'owned');
  assert.equal(e(hata('Purchase is pending')), 'pending');
  assert.equal(e(hata('Purchase is not purchased', 'PURCHASE_STATE_2')), 'pending');
  assert.equal(e(hata('Purchase is not purchased', 'PURCHASE_STATE_0')), 'failed', '0 UNSPECIFIED: bekleyen değil');
  assert.equal(e(hata('Purchase is not purchased', 'ERROR')), 'failed');
  assert.equal(e(hata('Billing service unavailable', 'SERVICE_UNAVAILABLE')), 'failed');
  assert.equal(e(hata('User cancelled the flow')), 'cancelled', 'kodsuz eski ileti');
  assert.equal(e(null), 'failed');
  assert.equal(e('Purchase is pending'), 'pending');
});

test('purchase: eklentinin yanıtları doğru sonuca dönüşür', async () => {
  NP.purchaseProduct = async () => { throw hata('Purchase is not purchased', 'USER_CANCELED'); };
  assert.equal(await billing.purchase('yearly', 'yil'), 'cancelled');
  NP.purchaseProduct = async () => { throw hata('Purchase is pending'); };
  assert.equal(await billing.purchase('yearly', 'yil'), 'pending');
  NP.purchaseProduct = async () => ({ productIdentifier: 'adfree', purchaseState: '1' });
  assert.equal(await billing.purchase('yearly', 'yil'), 'ok');
  NP.purchaseProduct = async () => ({ productIdentifier: 'adfree', purchaseState: '0' });
  assert.equal(await billing.purchase('yearly', 'yil'), 'pending', 'PURCHASED dışında bir durum çözülürse üye sayılmaz');
});

test('subscribe: vazgeçmek ve bekleyen ödeme üyelik vermez; zaten sahip olunan abonelik geri yüklenir', async () => {
  NP.purchaseProduct = async () => { throw hata('Purchase is not purchased', 'USER_CANCELED'); };
  assert.equal(await premium.subscribe('monthly', 'ay'), 'cancelled');
  assert.equal(premium.isPremium(), false);
  NP.purchaseProduct = async () => { throw hata('Purchase is pending'); };
  assert.equal(await premium.subscribe('monthly', 'ay'), 'pending');
  assert.equal(premium.isPremium(), false);
  NP.purchaseProduct = async () => { throw hata('Purchase is not purchased', 'ITEM_ALREADY_OWNED'); };
  ortam.uye = true;
  assert.equal(await premium.subscribe('monthly', 'ay'), 'restored');
  assert.equal(premium.isPremium(), true);
  assert.ok(ortam.cagri.some((c) => c.ad === 'restorePurchases'), 'geri yükleme Play\'e soruldu');
});

test('refresh: sonradan tamamlanan (onaylanmamış) satın alma önce onaylatılır (restorePurchases), sonra üyelik açılır', async () => {
  let onaylandi = false;
  NP.getPurchases = async () => ({ purchases: [{ productIdentifier: 'adfree', purchaseState: '1', isAcknowledged: onaylandi }] });
  NP.restorePurchases = async () => { onaylandi = true; return {}; };
  await premium.refresh();
  assert.equal(onaylandi, true);
  assert.equal(premium.isPremium(), true);
  assert.equal(premium.unacknowledged([{ productIdentifier: 'adfree', purchaseState: '1', isAcknowledged: true }]), false);
  assert.equal(premium.unacknowledged([{ productIdentifier: 'adfree', purchaseState: '2', isAcknowledged: false }]), false, 'bekleyen onaylanamaz');
});
