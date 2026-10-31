#!/usr/bin/env node
// Calqora — tarayıcı denemesi (yalnız yerelde; CI'da Chromium yok). Playwright + Chromium, ağ gerekmez.
//   node calqora/araclar/tarayici-dene.mjs
// A) 11 dilin her biri: bütün sekmeler, Sabitler sayfası, Ayarlar, Üyelik, Geçmiş ve Fonksiyonlar sayfaları. TR açık tema
//    390 px ve AR koyu tema 340 px zorunlu; öbür diller açık/koyu dönüşümlü 390/360 px. Denetim: konsol hatası yok, yatay
//    taşma yok, ekranda ya da aria-label'da çevrilmemiş anahtar (ör. "s.adPrivacy") yok.
// B) Reklam ve abonelik, sahte Capacitor eklentileriyle (AdMob, NativePurchases, App, SystemBars, Browser) ve Playwright'ın
//    sahte saatiyle: UMP → initialize sırası, G derecesi, banner şeridi (hiçbir düğmenin üstüne binmez), klavyede gizlenme,
//    doğal durak kuralları (ilk 3 dk yok, 4 dk ara, saatte 6, yazarken yok, sayfa açıkken yok), üye için SDK'nın hiç
//    başlatılmaması, oturumda üye olunca banner'ın kalkması, mağaza fiyatları, aboneliği yönet adresi, UMP gizlilik satırı.
// C) iPhone (sahte eklentiler, platform 'ios'), TR açık 390 px ve AR koyu 340 px: UMP → izleme izni (ATT) → initialize, iPhone
//    reklam kimlikleri, App Store ürünü (…adfree.yearly), üyelik sayfasında Apple'ın yenileme koşulları, gizlilik ve EULA
//    bağlantıları, "Yönet" Apple'ın sayfası; ekranda Google Play yok, taşma ve çevrilmemiş anahtar yok.
// Çıkış kodu: hata varsa 1.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { sunucuBaslat, WWW } from './sunucu.mjs';

const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);
const DILLER = ['tr', 'en', 'de', 'fr', 'es', 'it', 'pt', 'ru', 'ja', 'ko', 'ar'];
const en = (await import(pathToFileURL(path.join(WWW, 'js', 'lang', 'en.js')).href)).default;
// Noktalı ya da camelCase anahtarlar ("s.adPrivacy", "clearHistory"): "history" gibi düz sözcükler metnin kendisi olabilir
const ANAHTARLAR = Object.keys(en.ui).filter((k) => /[.A-Z]/.test(k));
const { REKLAM_KIMLIK } = await import(pathToFileURL(path.join(WWW, 'js', 'reklam-kimlik.js')).href);
const { SUBSCRIPTION } = await import(pathToFileURL(path.join(WWW, 'js', 'config.js')).href);

const sunucu = await sunucuBaslat();
const tarayici = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
const sonuc = [];
let hata = 0;
const sina = (ad, kosul, ayrinti = '') => {
  if (kosul) sonuc.push(`✓ ${ad}`); else { hata++; sonuc.push(`✗ ${ad}${ayrinti ? ': ' + ayrinti : ''}`); }
};

// ---------------------------------------------------------------- A) diller, temalar, taşma, anahtarlar

async function denetle(p, yer) {
  return p.evaluate(({ anahtarlar, yer }) => {
    const sorun = [];
    const g = innerWidth;
    if (document.documentElement.scrollWidth > g + 1) sorun.push(`${yer}: sayfa yatay taşıyor (${document.documentElement.scrollWidth} > ${g})`);
    for (const el of document.querySelectorAll('.sheet .body, .scroll, #top, #tabbar, .display, .keys, .gpanel')) {
      const st = getComputedStyle(el);
      if (el.offsetParent && st.overflowX !== 'auto' && st.overflowX !== 'scroll' && el.scrollWidth > el.clientWidth + 1) sorun.push(`${yer}: ${el.className || el.id} taşıyor (${el.scrollWidth} > ${el.clientWidth})`);
    }
    const metin = document.body.innerText + '\n' + [...document.querySelectorAll('[aria-label],[placeholder]')].map((e) => (e.getAttribute('aria-label') || '') + ' ' + (e.getAttribute('placeholder') || '')).join('\n');
    const kalan = anahtarlar.filter((k) => new RegExp(`(^|[^\\w.])${k.replace(/\./g, '\\.')}($|[^\\w.])`).test(metin));
    if (kalan.length) sorun.push(`${yer}: çevrilmemiş anahtar ${kalan.join(', ')}`);
    if (/\bnull\b|\bundefined\b/.test(document.body.innerText)) sorun.push(`${yer}: ekranda null/undefined`);
    return sorun;
  }, { anahtarlar: ANAHTARLAR, yer });
}

async function dilDene(dil, tema, genislik) {
  const p = await tarayici.newPage({ viewport: { width: genislik, height: 800 }, colorScheme: tema });
  const konsol = [];
  p.on('pageerror', (e) => konsol.push('pageerror ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') konsol.push(m.text()); });
  await p.addInitScript(({ dil, tema }) => { localStorage.setItem('calqora.v1', JSON.stringify({ settings: { lang: dil, theme: tema } })); }, { dil, tema });
  await p.goto(sunucu.adres);
  await p.waitForSelector('#tabbar button');
  const sorun = [];
  const tikla = async (sec) => { await p.click(sec); await p.waitForTimeout(260); };
  sorun.push(...await denetle(p, 'hesap'));
  for (const sekme of ['graph', 'matrix', 'units']) {
    await tikla(`#tabbar button[data-tab="${sekme}"]`);
    sorun.push(...await denetle(p, sekme));
  }
  await tikla('#tab-units .subseg button:nth-child(2)');   // Sabitler
  sorun.push(...await denetle(p, 'sabitler'));
  await tikla('#tabbar button[data-tab="calc"]');
  // Geçmiş, Fonksiyonlar, Ayarlar, Üyelik
  await p.evaluate(() => { const ta = document.querySelector('.expr'); ta.value = '2+3'; ta.dispatchEvent(new Event('input', { bubbles: true })); });
  await tikla('.key[data-k="eq"]');
  await tikla('#btn-history'); sorun.push(...await denetle(p, 'geçmiş')); await tikla('.sheet h2 .ibtn:last-child');
  await tikla('.key[data-k="sheet"]'); sorun.push(...await denetle(p, 'fonksiyonlar')); await tikla('.sheet h2 .ibtn');
  await tikla('#top .ibtn:last-child'); sorun.push(...await denetle(p, 'ayarlar'));
  const ayarlar = await p.evaluate(() => document.querySelector('.sheet').innerText);
  await tikla('.sheet h2 .ibtn');
  await tikla('#btn-noads'); await p.waitForTimeout(400); sorun.push(...await denetle(p, 'üyelik'));
  const uyelik = await p.evaluate(() => document.querySelector('.sheet').innerText);
  await tikla('.sheet h2 .ibtn');
  const yon = await p.evaluate(() => document.documentElement.dir);
  sina(`${dil} ${tema} ${genislik}px: hata, taşma, çevrilmemiş anahtar yok`, !sorun.length && !konsol.length, [...sorun, ...konsol].join(' | '));
  sina(`${dil}: Hakkında'da Poyraz Workshop, e-posta, gizlilik, GeoTerva; eski "3 dakikada bir tam ekran" iddiası yok`,
    /Poyraz Workshop/.test(ayarlar) && /mahmuttari@gmail\.com/.test(ayarlar) && /geoterva\.com/.test(ayarlar) && /AdMob/.test(ayarlar) && !/\b3\b/.test(ayarlar.split(/\n/).find((s) => /AdMob/.test(s)) || ''));
  sina(`${dil}: tarayıcı taklidinde fiyat görünür (yedek metin yalnız burada)`, /\$0\.99|0,99/.test(uyelik) || /\$9\.99|9,99/.test(uyelik), uyelik.slice(0, 120));
  if (dil === 'ar') sina('ar: arayüz sağdan sola', yon === 'rtl');
  await p.close();
}

await dilDene('tr', 'light', 390);
await dilDene('ar', 'dark', 340);
for (const [i, dil] of DILLER.filter((d) => d !== 'tr' && d !== 'ar').entries()) await dilDene(dil, i % 2 ? 'dark' : 'light', i % 2 ? 360 : 390);

// ---------------------------------------------------------------- B) reklam ve abonelik (sahte eklentiler)

/** Sahte Capacitor: o = { uye, izin, gizlilik, urunYok, platform: 'ios', dil, tema } → window.__cagri'ya her eklenti çağrısı yazılır */
async function yerelSayfa(o = {}, viewport = { width: 390, height: 844 }) {
  const p = await tarayici.newPage({ viewport, colorScheme: o.tema || 'light' });
  const konsol = [];
  p.on('pageerror', (e) => konsol.push('pageerror ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') konsol.push(m.text()); });
  await p.clock.install({ time: new Date('2026-10-27T10:00:00Z') });
  await p.addInitScript(({ o, sku }) => {
    if (!/^https?:$/.test(location.protocol)) return;
    if (!localStorage.getItem('calqora.v1')) localStorage.setItem('calqora.v1', JSON.stringify({ settings: { lang: o.dil || 'tr', theme: o.tema || 'light' } }));
    const ios = o.platform === 'ios';
    const IOS = 'com.poyrazworkshop.calqora.adfree.';
    let att = 'notDetermined';
    const islem = () => (ios ? { productIdentifier: IOS + 'yearly', isActive: true, expirationDate: '2027-10-31T10:00:00Z', subscriptionState: 'subscribed' }
      : { productIdentifier: sku, purchaseState: '1', isAcknowledged: true });
    const cagri = window.__cagri = [];
    const dinleyici = {};
    const kaydet = (ek, ad, sonuc) => async (arg) => { cagri.push({ ek, ad, arg: arg === undefined ? null : JSON.parse(JSON.stringify(arg)) }); return typeof sonuc === 'function' ? sonuc(arg) : sonuc; };
    const yay = (ad, veri) => (dinleyici[ad] || []).forEach((f) => f(veri));
    window.__yay = yay;
    let uye = !!o.uye || sessionStorage.getItem('sahte-uye') === '1';   // sayfa yenilense de Play'in yanıtı aynı kalır
    const onay = { status: o.izin === false ? 'REQUIRED' : 'NOT_REQUIRED', isConsentFormAvailable: o.izin === false, canRequestAds: o.izin !== false, privacyOptionsRequirementStatus: o.gizlilik ? 'REQUIRED' : 'NOT_REQUIRED' };
    window.Capacitor = {
      DEBUG: false,
      isNativePlatform: () => true,
      getPlatform: () => (ios ? 'ios' : 'android'),
      registerPlugin: (ad) => window.Capacitor.Plugins[ad],
      Plugins: {
        App: { addListener: (ad) => { cagri.push({ ek: 'App', ad: 'addListener', arg: ad }); return { remove() {} }; }, exitApp: kaydet('App', 'exitApp') },
        SystemBars: { setStyle: kaydet('SystemBars', 'setStyle') },
        Browser: { open: kaydet('Browser', 'open') },
        NativePurchases: {
          isBillingSupported: kaydet('NP', 'isBillingSupported', { isBillingSupported: true }),
          getProducts: kaydet('NP', 'getProducts', o.urunYok ? { products: [] } : { products: ios
            ? [{ identifier: IOS + 'monthly', priceString: '₺49,99', price: 49.99 }, { identifier: IOS + 'yearly', priceString: '₺449,99', price: 449.99 }]
            : [{ identifier: 'monthly', planIdentifier: 'adfree', priceString: '₺49,99', price: 49.99, offerToken: 'ay' },
              { identifier: 'yearly', planIdentifier: 'adfree', priceString: '₺449,99', price: 449.99, offerToken: 'yil' }] }),
          getPurchases: kaydet('NP', 'getPurchases', () => ({ purchases: uye ? [islem()] : [] })),
          purchaseProduct: kaydet('NP', 'purchaseProduct', () => { uye = true; sessionStorage.setItem('sahte-uye', '1'); return islem(); }),
          restorePurchases: kaydet('NP', 'restorePurchases', {}),
          manageSubscriptions: kaydet('NP', 'manageSubscriptions', {}),
        },
        AdMob: {
          requestConsentInfo: kaydet('AdMob', 'requestConsentInfo', onay),
          showConsentForm: kaydet('AdMob', 'showConsentForm', onay),
          showPrivacyOptionsForm: kaydet('AdMob', 'showPrivacyOptionsForm'),
          initialize: kaydet('AdMob', 'initialize'),
          addListener: (ad, f) => { (dinleyici[ad] ||= []).push(f); return Promise.resolve({ remove() {} }); },
          showBanner: kaydet('AdMob', 'showBanner', () => { setTimeout(() => yay('bannerAdSizeChanged', { width: 390, height: 56 }), 10); }),
          hideBanner: kaydet('AdMob', 'hideBanner', () => { setTimeout(() => yay('bannerAdSizeChanged', { width: 0, height: 0 }), 10); }),
          resumeBanner: kaydet('AdMob', 'resumeBanner', () => { setTimeout(() => yay('bannerAdSizeChanged', { width: 390, height: 56 }), 10); }),
          removeBanner: kaydet('AdMob', 'removeBanner', () => { setTimeout(() => yay('bannerAdSizeChanged', { width: 0, height: 0 }), 10); }),
          prepareInterstitial: kaydet('AdMob', 'prepareInterstitial', { adUnitId: 'x' }),
          showInterstitial: kaydet('AdMob', 'showInterstitial', () => { setTimeout(() => yay('interstitialAdDismissed', {}), 20); }),
          trackingAuthorizationStatus: kaydet('AdMob', 'trackingAuthorizationStatus', () => ({ status: att })),
          requestTrackingAuthorization: kaydet('AdMob', 'requestTrackingAuthorization', () => { att = 'denied'; }),
        },
      },
    };
  }, { o, sku: SUBSCRIPTION.productId });
  await p.goto(sunucu.adres);
  await p.waitForSelector('#tabbar button');
  await p.waitForTimeout(400);
  const cagrilar = () => p.evaluate(() => window.__cagri);
  const adlar = async (ek) => (await cagrilar()).filter((c) => !ek || c.ek === ek).map((c) => c.ad);
  const gecisSayisi = async () => (await adlar('AdMob')).filter((a) => a === 'showInterstitial').length;
  const sekme = async (id) => { await p.click(`#tabbar button[data-tab="${id}"]`); await p.waitForTimeout(700); };
  return { p, konsol, cagrilar, adlar, gecisSayisi, sekme };
}

{ // Üye olmayan kullanıcı: UMP → initialize → banner + geçiş reklamı
  const s = await yerelSayfa();
  const a = await s.adlar('AdMob');
  const c = await s.cagrilar();
  sina('reklam: önce mağaza sorulur, sonra UMP, sonra initialize', c.findIndex((x) => x.ad === 'getPurchases') < c.findIndex((x) => x.ad === 'requestConsentInfo') && a.indexOf('requestConsentInfo') < a.indexOf('initialize'), a.join(','));
  const ilk = c.find((x) => x.ad === 'initialize');
  sina('reklam: initialize bir kez, en yüksek içerik derecesi G ("General")', a.filter((x) => x === 'initialize').length === 1 && ilk.arg.maxAdContentRating === 'General');
  const banner = c.find((x) => x.ad === 'showBanner');
  sina('reklam: uyarlanabilir banner altta, kimlik reklam-kimlik.js\'ten', banner && banner.arg.adSize === 'ADAPTIVE_BANNER' && banner.arg.position === 'BOTTOM_CENTER' && banner.arg.adId === REKLAM_KIMLIK.android.banner, JSON.stringify(banner?.arg));
  const gecis = c.find((x) => x.ad === 'prepareInterstitial');
  sina('reklam: geçiş reklamı initialize\'dan sonra hazırlanır, kimlik reklam-kimlik.js\'ten', gecis && gecis.arg.adId === REKLAM_KIMLIK.android.gecis && a.indexOf('prepareInterstitial') > a.indexOf('initialize'));
  sina('reklam: Android\'de izleme izni (ATT) sorulmaz', !a.includes('requestTrackingAuthorization'));
  sina('reklam: açılış ve ödüllü reklam yok', !a.some((x) => /AppOpen|Reward/.test(x)));
  const yer = await s.p.evaluate(() => ({ h: innerHeight, bar: document.querySelector('#tabbar').getBoundingClientRect().bottom, serit: !document.getElementById('reklam-seridi').hidden, adh: getComputedStyle(document.documentElement).getPropertyValue('--ad-h').trim(), sinif: document.documentElement.classList.contains('reklamli') }));
  sina('reklam: banner kendi şeridinde, sekme çubuğu banner\'ın üstünde biter', yer.serit && yer.sinif && yer.adh === '56px' && yer.bar <= yer.h - 56 + 0.5, JSON.stringify(yer));
  await s.p.click('#top .ibtn:last-child'); await s.p.waitForTimeout(300);
  const sayfaAlti = await s.p.evaluate(() => document.querySelector('.sheet').getBoundingClientRect().bottom);
  sina('reklam: açılan sayfa (Ayarlar) da banner\'ın üstünde biter', sayfaAlti <= yer.h - 56 + 0.5, String(sayfaAlti));
  await s.p.click('.sheet h2 .ibtn'); await s.p.waitForTimeout(700);
  // Klavye: pencere kısalınca banner gizlenir, uzayınca geri gelir
  await s.p.setViewportSize({ width: 390, height: 500 }); await s.p.waitForTimeout(200);
  const gizli = await s.p.evaluate(() => ({ cls: document.documentElement.classList.contains('reklamli'), adlar: window.__cagri.map((c) => c.ad) }));
  await s.p.setViewportSize({ width: 390, height: 844 }); await s.p.waitForTimeout(200);
  const acik = await s.p.evaluate(() => ({ cls: document.documentElement.classList.contains('reklamli'), adlar: window.__cagri.map((c) => c.ad) }));
  sina('reklam: yazılım klavyesi açıkken banner gizlenir, kapanınca geri gelir', !gizli.cls && gizli.adlar.includes('hideBanner') && acik.cls && acik.adlar.includes('resumeBanner'));
  // İlk 3 dakika: doğal durakta bile yok
  await s.sekme('graph'); await s.sekme('calc');
  sina('reklam: oturumun ilk 3 dakikasında geçiş reklamı yok', await s.gecisSayisi() === 0);
  await s.p.clock.fastForward('03:01');
  await s.sekme('calc');
  sina('reklam: doğal durak olmadan (hesap ekranında kalınca) yok', await s.gecisSayisi() === 0);
  await s.sekme('graph'); await s.sekme('calc');
  sina('reklam: 3 dk sonra Grafik\'ten çıkarken bir geçiş reklamı', await s.gecisSayisi() === 1);
  const kayit = await s.p.evaluate(() => JSON.parse(localStorage.getItem('calqora.reklam.v1')));
  sina('reklam: gösterim zamanı kalıcı sayaca yazılır', kayit && kayit.gosterimler.length === 1);
  await s.sekme('matrix'); await s.sekme('calc');
  sina('reklam: 4 dakika dolmadan ikincisi yok', await s.gecisSayisi() === 1);
  await s.p.clock.fastForward('04:01');
  // Yazarken yok: matris hücresine dokunup (sayı tuş takımı açılır) hemen sekme değiştirmek
  await s.sekme('matrix');
  await s.p.click('#tab-matrix .mcell'); await s.p.waitForTimeout(100);
  await s.p.click('#tabbar button[data-tab="calc"]'); await s.p.waitForTimeout(700);
  sina('reklam: yazarken (matris hücresine yeni dokunulmuşken) yok', await s.gecisSayisi() === 1);
  // Ayarlar'dan "Reklamları kaldır": Ayarlar kapanır ama üyelik sayfası açılır → yok
  await s.p.clock.fastForward('00:05');
  await s.p.click('#top .ibtn:last-child'); await s.p.waitForTimeout(300);
  await s.p.click('.sheet .body .row button.pill'); await s.p.waitForTimeout(800);
  sina('reklam: Ayarlar\'dan üyelik sayfasına geçerken yok (sayfa açık)', await s.gecisSayisi() === 1);
  const fiyat = await s.p.evaluate(() => document.querySelector('.sheet').innerText);
  sina('abonelik: fiyatlar mağazadan (priceString), yedek $ metni yok', /₺49,99/.test(fiyat) && /₺449,99/.test(fiyat) && !/\$/.test(fiyat), fiyat.slice(0, 200));
  await s.p.click('.sheet h2 .ibtn'); await s.p.waitForTimeout(700);
  // Ayarlar kapanınca: doğal durak
  await s.p.click('#top .ibtn:last-child'); await s.p.waitForTimeout(300);
  await s.p.click('.sheet h2 .ibtn'); await s.p.waitForTimeout(800);
  sina('reklam: Ayarlar kapanınca (4 dk sonra) ikinci geçiş reklamı', await s.gecisSayisi() === 2);
  // Kapanınca bir sonraki hazırlanır
  sina('reklam: kapanan geçiş reklamının yerine yenisi hazırlanır', (await s.adlar('AdMob')).filter((x) => x === 'prepareInterstitial').length >= 3);
  // Birim sekmesinden sabit "Hesaba ekle": hesap sürüyor, durak değil
  await s.p.clock.fastForward('04:01');
  await s.sekme('units');
  await s.p.click('#tab-units .subseg button:nth-child(2)'); await s.p.waitForTimeout(200);
  await s.p.click('#tab-units .urow'); await s.p.waitForTimeout(200);
  await s.p.click('#tab-units .kexp .pill'); await s.p.waitForTimeout(800);
  sina('reklam: sabit hesaba eklenince (Birim → Hesap) yok', await s.gecisSayisi() === 2);
  // Üye ol: banner kalkar, geçiş reklamı bir daha yok
  await s.p.click('#btn-noads'); await s.p.waitForTimeout(400);
  await s.p.click('.sheet .bigbtn'); await s.p.waitForTimeout(400);
  const satin = (await s.cagrilar()).find((x) => x.ad === 'purchaseProduct');
  sina('abonelik: adfree / yearly satın alma isteği', satin && satin.arg.productIdentifier === 'adfree' && satin.arg.planIdentifier === 'yearly' && satin.arg.productType === 'subs' && satin.arg.offerToken === 'yil', JSON.stringify(satin?.arg));
  const uyeSonra = await s.p.evaluate(() => ({ cls: document.documentElement.classList.contains('reklamli'), serit: document.getElementById('reklam-seridi').hidden, adlar: window.__cagri.map((c) => c.ad) }));
  sina('abonelik: üye olunca banner kaldırılır, şerit kapanır', uyeSonra.adlar.includes('removeBanner') && !uyeSonra.cls && uyeSonra.serit);
  const req = [];
  s.p.on('request', (r) => req.push(r.url()));
  // 204 yanıtı gezinmeyi durdurur, sayfa yerinde kalır (uygulamada Capacitor bu adresi Android'e verir)
  await s.p.route('https://play.google.com/**', (r) => r.fulfill({ status: 204 }));
  await s.p.click('.sheet .okcard .pill'); await s.p.waitForTimeout(400);
  sina('abonelik: "Aboneliği yönet" Play\'in adfree sayfasını açar', req.includes(SUBSCRIPTION.manageUrl), req.join(' '));
  await s.p.goto(sunucu.adres).catch(() => {});
  await s.p.waitForTimeout(500);
  await s.p.clock.fastForward('05:00');
  await s.sekme('graph'); await s.sekme('calc');
  sina('abonelik: üye uygulamayı yeniden açınca reklam yok', await s.gecisSayisi() === 0 && !(await s.adlar('AdMob')).length);
  sina('reklam/abonelik akışında konsol hatası yok', !s.konsol.length, s.konsol.join(' | '));
  await s.p.close();
}

{ // Üye: AdMob SDK'sı hiç başlatılmaz, UMP bile sorulmaz
  const s = await yerelSayfa({ uye: true });
  await s.p.clock.fastForward('10:00');
  await s.sekme('graph'); await s.sekme('calc');
  sina('üye: AdMob eklentisine hiçbir çağrı yok (SDK başlatılmaz), şerit yok', (await s.adlar('AdMob')).length === 0 && await s.p.evaluate(() => document.getElementById('reklam-seridi').hidden));
  await s.p.close();
}

{ // Saatte en çok 6
  const s = await yerelSayfa({}, undefined);
  await s.p.evaluate(() => { const n = Date.now(); localStorage.setItem('calqora.reklam.v1', JSON.stringify({ gosterimler: [50, 41, 32, 23, 14, 5].map((dk) => n - dk * 60e3) })); });
  await s.p.clock.fastForward('03:30');
  await s.sekme('graph'); await s.sekme('calc');
  sina('reklam: son bir saatte 6 gösterim varsa yedincisi yok', await s.gecisSayisi() === 0);
  await s.p.clock.fastForward('07:00');   // en eskisi (yüklemeden 50 dk önce) artık bir saatten eski
  await s.sekme('graph'); await s.sekme('calc');
  sina('reklam: en eski gösterim bir saati geçince yeniden olur', await s.gecisSayisi() === 1);
  await s.p.close();
}

{ // UMP izni yok: initialize hiç çağrılmaz; gizlilik seçenekleri satırı Ayarlar'da
  const s = await yerelSayfa({ izin: false, gizlilik: true });
  const a = await s.adlar('AdMob');
  sina('UMP: form gösterilir, izin yoksa initialize ve reklam isteği yok', a.includes('showConsentForm') && !a.includes('initialize') && !a.includes('showBanner') && !a.includes('prepareInterstitial'), a.join(','));
  await s.p.click('#top .ibtn:last-child'); await s.p.waitForTimeout(300);
  const metin = await s.p.evaluate(() => document.querySelector('.sheet').innerText);
  sina('UMP: Ayarlar\'da "Reklam gizlilik seçenekleri" satırı', /Reklam gizlilik seçenekleri/.test(metin));
  await s.p.getByRole('button', { name: 'Değiştir', exact: true }).click(); await s.p.waitForTimeout(300);
  sina('UMP: satır gizlilik seçenekleri formunu açar', (await s.adlar('AdMob')).includes('showPrivacyOptionsForm'));
  await s.p.close();
}

{ // UMP gizlilik satırı gerekmiyorsa yok
  const s = await yerelSayfa();
  await s.p.click('#top .ibtn:last-child'); await s.p.waitForTimeout(300);
  sina('UMP: gerekmiyorsa gizlilik satırı yok', !/Reklam gizlilik seçenekleri/.test(await s.p.evaluate(() => document.querySelector('.sheet').innerText)));
  await s.p.close();
}

{ // Mağaza ürün döndürmezse uygulamada uydurma fiyat yok, abone ol düğmesi kapalı
  const s = await yerelSayfa({ urunYok: true });
  await s.p.click('#btn-noads'); await s.p.waitForTimeout(500);
  const d = await s.p.evaluate(() => ({ metin: document.querySelector('.sheet').innerText, kapali: document.querySelector('.sheet .bigbtn').disabled }));
  sina('abonelik: fiyat gelmezse yedek fiyat gösterilmez, düğme kapalı, açıklama var', !/\$|0[.,]99/.test(d.metin) && d.kapali && /Fiyatlar Google Play/.test(d.metin), d.metin.slice(0, 160));
  await s.p.close();
}

// ---------------------------------------------------------------- C) iPhone
for (const [dil, tema, en] of [['tr', 'light', 390], ['ar', 'dark', 340]]) {
  const s = await yerelSayfa({ platform: 'ios', dil, tema }, { width: en, height: 844 });
  const yer = `iPhone ${dil} ${tema} ${en}px`;
  const c = await s.cagrilar();
  const a = c.map((x) => x.ad);
  sina(`${yer}: mağaza → UMP → ATT → initialize`, a.indexOf('getPurchases') < a.indexOf('requestConsentInfo') && a.indexOf('requestConsentInfo') < a.indexOf('trackingAuthorizationStatus')
    && a.indexOf('trackingAuthorizationStatus') < a.indexOf('requestTrackingAuthorization') && a.indexOf('requestTrackingAuthorization') < a.indexOf('initialize'), a.join(','));
  sina(`${yer}: iPhone reklam kimlikleri`, c.find((x) => x.ad === 'showBanner')?.arg.adId === REKLAM_KIMLIK.ios.banner && c.find((x) => x.ad === 'prepareInterstitial')?.arg.adId === REKLAM_KIMLIK.ios.gecis);
  sina(`${yer}: yalnız bu Apple hesabının geçerli hakları`, c.find((x) => x.ad === 'getPurchases')?.arg.onlyCurrentEntitlements === true);
  await s.p.click('#btn-noads'); await s.p.waitForTimeout(600);
  const sorun = await denetle(s.p, `${yer} üyelik`);
  const metin = await s.p.evaluate(() => document.querySelector('.sheet').innerText);
  sina(`${yer}: üyelik sayfası taşmasız, anahtarsız; Google Play yok; Apple koşulları (24 saat), gizlilik ve EULA`,
    !sorun.length && !/Google[ -]?Play/.test(metin) && /Apple/.test(metin) && /24/.test(metin) && await s.p.locator('.prem .legal .pill').count() === 2, [...sorun, metin.slice(0, 200)].join(' | '));
  await s.p.locator('.prem .legal .pill').nth(1).click(); await s.p.waitForTimeout(200);
  sina(`${yer}: EULA bağlantısı Apple'ın standart sözleşmesi`, (await s.cagrilar()).some((x) => x.ad === 'open' && x.arg.url === 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/'));
  await s.p.click('.sheet .bigbtn'); await s.p.waitForTimeout(400);
  const al = (await s.cagrilar()).find((x) => x.ad === 'purchaseProduct');
  sina(`${yer}: satın alma App Store ürünüyle (temel plan yok)`, al && al.arg.productIdentifier === 'com.poyrazworkshop.calqora.adfree.yearly' && al.arg.planIdentifier === undefined, JSON.stringify(al?.arg));
  await s.p.click('.sheet .okcard .pill'); await s.p.waitForTimeout(300);
  sina(`${yer}: "Aboneliği yönet" Apple'ın sayfasını açar`, (await s.adlar('NP')).includes('manageSubscriptions'));
  await s.p.screenshot({ path: path.join(process.env.EKRAN || '/tmp', `calqora-ios-${dil}.png`) }).catch(() => {});
  sina(`${yer}: konsol hatası yok`, !s.konsol.length, s.konsol.join(' | '));
  await s.p.close();
}

await tarayici.close();
sunucu.kapat();
console.log(sonuc.join('\n'));
console.log(`\n${sonuc.length - hata}/${sonuc.length} geçti`);
process.exit(hata ? 1 : 0);
