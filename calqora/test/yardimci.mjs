// Testlerin ortak yardımcısı: Node'da sahte bir Capacitor ortamı (window.Capacitor + AdMob, NativePurchases, App, SystemBars,
// Browser eklentileri) ve bellekte localStorage. www/js modülleri İÇE AKTARILMADAN ÖNCE çağrılmalı (native.js ve reklam.js
// eklentiyi yüklenirken okur). Her eklenti çağrısı sırasıyla `cagri` dizisine yazılır.
export function sahteOrtam({ uye = false, izin = true } = {}) {
  const depo = new Map();
  globalThis.localStorage = {
    getItem: (k) => (depo.has(k) ? depo.get(k) : null),
    setItem: (k, v) => { depo.set(k, String(v)); },
    removeItem: (k) => { depo.delete(k); },
    clear: () => depo.clear(),
  };
  const o = { depo, cagri: [], uye, durum: null };
  const dinleyici = {};
  o.yay = (ad, veri = {}) => (dinleyici[ad] || []).forEach((f) => f(veri));
  const kaydet = (ek, ad, sonuc) => async (arg) => {
    o.cagri.push({ ek, ad, arg: arg === undefined ? null : JSON.parse(JSON.stringify(arg)) });
    return typeof sonuc === 'function' ? sonuc(arg) : sonuc;
  };
  const onay = { status: izin ? 'NOT_REQUIRED' : 'REQUIRED', isConsentFormAvailable: !izin, canRequestAds: izin, privacyOptionsRequirementStatus: 'NOT_REQUIRED' };
  const Plugins = {
    App: { addListener: (ad) => { o.cagri.push({ ek: 'App', ad: 'addListener', arg: ad }); return { remove() {} }; }, exitApp: kaydet('App', 'exitApp') },
    SystemBars: { setStyle: kaydet('SystemBars', 'setStyle') },
    Browser: { open: kaydet('Browser', 'open') },
    NativePurchases: {
      isBillingSupported: kaydet('NP', 'isBillingSupported', { isBillingSupported: true }),
      getProducts: kaydet('NP', 'getProducts', { products: [
        { identifier: 'monthly', priceString: '49,99 TL', price: 49.99, offerToken: 'ay' },
        { identifier: 'yearly', priceString: '449,99 TL', price: 449.99, offerToken: 'yil' }] }),
      getPurchases: kaydet('NP', 'getPurchases', () => ({ purchases: o.uye ? [{ productIdentifier: 'adfree', purchaseState: '1' }] : [] })),
      purchaseProduct: kaydet('NP', 'purchaseProduct', { productIdentifier: 'adfree', purchaseState: '1' }),
      restorePurchases: kaydet('NP', 'restorePurchases', {}),
    },
    AdMob: {
      requestConsentInfo: kaydet('AdMob', 'requestConsentInfo', onay),
      showConsentForm: kaydet('AdMob', 'showConsentForm', onay),
      showPrivacyOptionsForm: kaydet('AdMob', 'showPrivacyOptionsForm'),
      initialize: kaydet('AdMob', 'initialize'),
      addListener: (ad, f) => { (dinleyici[ad] ||= []).push(f); return Promise.resolve({ remove() {} }); },
      showBanner: kaydet('AdMob', 'showBanner'),
      hideBanner: kaydet('AdMob', 'hideBanner'),
      resumeBanner: kaydet('AdMob', 'resumeBanner'),
      removeBanner: kaydet('AdMob', 'removeBanner'),
      prepareInterstitial: kaydet('AdMob', 'prepareInterstitial', {}),
      showInterstitial: kaydet('AdMob', 'showInterstitial'),
    },
  };
  globalThis.window = { Capacitor: { DEBUG: false, isNativePlatform: () => true, Plugins, registerPlugin: (ad) => Plugins[ad] } };
  // söz zincirlerinin (eklenti çağrıları) bitmesini bekler; setImmediate sahte saatten etkilenmez
  o.bekle = async (n = 20) => { for (let i = 0; i < n; i++) await new Promise((r) => setImmediate(r)); };
  return o;
}
