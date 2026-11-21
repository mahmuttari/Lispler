// Tarayıcıda duman denemesi (yalnız yerelde; CI çalıştırmaz): node unitica/araclar/tarayici-dene.mjs
// A. Her dil (11), açık tema, 390 px: dört sekme, kategori listesi, birim seçici, "tüm birimler", dil/üyelik/kabuller/hakkında
//    alt sayfaları. Konsol hatası, yatay taşma, ekranda çevrilmemiş anahtar (ör. "member.title") olmamalı.
// B. Aynısı TR açık 390 px ve AR koyu 340 px (sağdan sola) ve TR koyu 340 px.
// C. Sahte Capacitor eklentileriyle reklam ve abonelik akışı: UMP önce, initialize sonra ve "General"; banner şeridi sayfayı
//    yukarı iter, klavyede gizlenir; geçiş reklamı yalnız kurallara uyan sekme değişiminde; üyede AdMob hiç başlamaz;
//    satın alma adfree/yearly/subs ile çağrılır ve banner'ı kaldırır; AB onayı reddedilince reklam istenmez.
// D. iPhone (sahte eklentiler, platform 'ios'): UMP → izleme izni (ATT) → initialize; iPhone reklam kimlikleri; App Store ürünü
//    <paket>.adfree.yearly; abonelik sayfasında Apple'ın yenileme koşulları, gizlilik ve EULA bağlantıları; "Yönet" Apple'ın
//    sayfasını açar; hiçbir ekranda "Google Play" yok. TR açık 390 px ve AR koyu 340 px.
import assert from 'node:assert/strict';
import { sunucuAc, tarayici, ornekDurum, sahteYerel } from './sunucu.mjs';

const DILLER = ['tr', 'en', 'de', 'fr', 'es', 'pt', 'ru', 'ja', 'ar', 'it', 'ko'];
const ANAHTAR = /\b(?:app|sheet|hero|search|cats|group|card|unit|tab|history|favorites|undo|more|set|info|about|assume|member|ad)\.[a-zA-Z][a-zA-Z.]*\b/;

const { adres, kapat } = await sunucuAc();
const b = await tarayici();
const sonuc = [];
let hata = 0;
const sina = async (ad, fn) => {
  try { await fn(); sonuc.push(`✓ ${ad}`); } catch (e) { hata++; sonuc.push(`✗ ${ad}: ${String(e.message).split("\n").slice(0, 4).join(" | ")}`); }
};

async function sayfa({ dil, tema = 'light', en = 390, yuk = 844, yerel = null, saat = null, ek = '' }) {
  const ctx = await b.newContext({ viewport: { width: en, height: yuk }, deviceScaleFactor: 1, colorScheme: tema, locale: dil });
  const p = await ctx.newPage();
  p.setDefaultTimeout(8000);
  const hatalar = [];
  p.on('pageerror', (e) => hatalar.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') hatalar.push(m.text()); });
  if (saat) await p.clock.install({ time: saat });
  await p.addInitScript((d) => { try { localStorage.setItem('unitica.v1', JSON.stringify(d)); } catch (e) { /* */ } }, ornekDurum(dil, tema));
  if (yerel) await p.addInitScript(sahteYerel(), yerel);
  await p.goto(adres + 'index.html' + ek, { waitUntil: 'load' });
  await p.waitForFunction(() => document.documentElement.classList.contains('ready'));
  return { p, ctx, hatalar };
}

/** görünen metinde çevrilmemiş anahtar ve yatay taşma */
async function denetle(p, yer) {
  const r = await p.evaluate((kaynak) => {
    const re = new RegExp(kaynak);
    const gorunen = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    const metin = [...document.querySelectorAll('body *')].filter((el) => gorunen(el) && el.children.length === 0)
      .map((el) => `${el.textContent} ${el.getAttribute('aria-label') || ''} ${el.getAttribute('placeholder') || ''}`).join('\n');
    const m = re.exec(metin);
    const tasan = [...document.querySelectorAll('.screen, .sheet-body, #app, body, html')]
      .filter((el) => gorunen(el) && el.scrollWidth > el.clientWidth + 1).map((el) => el.id || el.className || el.tagName);
    return { anahtar: m ? m[0] : null, tasan };
  }, ANAHTAR.source);
  assert.equal(r.anahtar, null, `${yer}: çevrilmemiş anahtar ${r.anahtar}`);
  assert.deepEqual(r.tasan, [], `${yer}: yatay taşma`);
}

async function sekme(p, id) { await p.click(`.tab[data-tab="${id}"]`); await p.waitForTimeout(60); }
async function altSayfaKapat(p) { await p.click('.sheet-head [data-sheet="close"]'); await p.waitForTimeout(260); }

async function tumEkranlar(p, yer) {
  await denetle(p, `${yer} ana`);
  await p.click('.cats-toggle'); await denetle(p, `${yer} tüm kategoriler`); await p.click('.cats-toggle');
  await p.click('[data-act="allToggle"]'); await denetle(p, `${yer} tüm birimler`);
  await p.click('.unit-btn[data-arg="f"]'); await p.waitForTimeout(260); await denetle(p, `${yer} birim seçici`); await altSayfaKapat(p);
  await p.fill('#q', 'kgf'); await p.waitForTimeout(60); await denetle(p, `${yer} arama`); await p.click('#q-clear');
  await p.evaluate(() => document.activeElement.blur()); await p.waitForTimeout(150);   // klavye kapanır, sekme çubuğu döner
  await sekme(p, 'history'); await denetle(p, `${yer} geçmiş`);
  await sekme(p, 'favorites'); await denetle(p, `${yer} favoriler`);
  await sekme(p, 'more'); await denetle(p, `${yer} diğer`);
  for (const act of ['lang', 'member', 'assume', 'about']) {
    await p.click(`[data-act="${act}"]`); await p.waitForTimeout(450); await denetle(p, `${yer} ${act}`); await altSayfaKapat(p);
  }
  await sekme(p, 'home');
}

try {
  // ---------------------------------------------------------------- A + B
  const gorunum = [...DILLER.map((dil) => ({ dil })), { dil: 'ar', tema: 'dark', en: 340 }, { dil: 'tr', tema: 'dark', en: 340 }]
    .filter((g) => !process.env.DIL || process.env.DIL === g.dil);
  for (const g of gorunum) {
    const yer = `${g.dil} ${g.tema || 'light'} ${g.en || 390}`;
    await sina(yer, async () => {
      const { p, ctx, hatalar } = await sayfa(g);
      if (g.dil === 'ar') assert.equal(await p.evaluate(() => document.documentElement.dir), 'rtl');
      await tumEkranlar(p, yer);
      assert.deepEqual(hatalar, [], `${yer}: konsol hatası`);
      await ctx.close();
    });
  }

  // ---------------------------------------------------------------- C. reklam ve abonelik (sahte eklentiler)
  const KIMLIK = await import('../www/js/reklam-kimlik.js');
  const adlar = (k) => k.map((c) => c.ad);

  await sina('C1 UMP → initialize(General) → banner + geçiş yükleme; şerit sayfayı iter; klavyede gizlenir', async () => {
    const { p, ctx, hatalar } = await sayfa({ dil: 'tr', yerel: {} });
    await p.waitForFunction(() => window.__kayit.some((c) => c.ad === 'prepareInterstitial'));
    await p.waitForTimeout(100);
    const k = await p.evaluate(() => window.__kayit);
    const a = adlar(k);
    assert.ok(a.indexOf('getPurchases') < a.indexOf('requestConsentInfo'), 'önce Google Play sorulur');
    assert.ok(a.indexOf('requestConsentInfo') < a.indexOf('initialize'), 'UMP initialize\'dan önce');
    assert.equal(k.find((c) => c.ad === 'initialize').arg.maxAdContentRating, 'General');
    const sb = k.find((c) => c.ad === 'showBanner').arg;
    assert.equal(sb.adId, KIMLIK.REKLAM_KIMLIK.android.banner);
    assert.equal(sb.adSize, 'ADAPTIVE_BANNER');
    assert.equal(sb.position, 'BOTTOM_CENTER');
    assert.equal(k.find((c) => c.ad === 'prepareInterstitial').arg.adId, KIMLIK.REKLAM_KIMLIK.android.gecis);
    assert.ok(!adlar(k).includes('requestTrackingAuthorization'), 'Android\'de izleme izni sorulmaz');
    assert.ok(!a.includes('showInterstitial'), 'açılışta geçiş reklamı yok');
    const alt = await p.evaluate(() => ({ tab: document.querySelector('.tabbar').getBoundingClientRect().bottom, h: innerHeight,
      ad: getComputedStyle(document.documentElement).getPropertyValue('--ad-h').trim() }));
    assert.equal(alt.ad, '60px');
    assert.ok(alt.tab <= alt.h - 60 + 0.5, `sekme çubuğu banner'ın üstünde bitmeli (${alt.tab} / ${alt.h})`);
    await p.click('#val'); await p.waitForTimeout(150);
    assert.ok(adlar(await p.evaluate(() => window.__kayit)).includes('hideBanner'), 'klavye açılınca banner gizlenir');
    assert.equal(await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ad-h').trim()), '0px');
    await p.click('.hero h1'); await p.waitForTimeout(200);
    assert.ok(adlar(await p.evaluate(() => window.__kayit)).includes('resumeBanner'), 'klavye kapanınca banner döner');
    assert.deepEqual(hatalar, []);
    await ctx.close();
  });

  await sina('C2 geçiş reklamı: ilk 5 dk yok; sonra Geçmiş → Ana sekme değişiminde bir kez; 8 dk dolmadan ikincisi yok', async () => {
    const t0 = new Date('2026-10-27T10:00:00Z').getTime();
    const { p, ctx, hatalar } = await sayfa({ dil: 'tr', yerel: {}, saat: t0 });
    await p.clock.runFor(2000);
    await p.waitForFunction(() => window.__kayit.some((c) => c.ad === 'prepareInterstitial'));
    const say = async () => (await p.evaluate(() => window.__kayit.filter((c) => c.ad === 'showInterstitial').length));
    await sekme(p, 'history'); await p.clock.runFor(10_000); await sekme(p, 'home'); await p.clock.runFor(1000);
    assert.equal(await say(), 0, 'oturumun ilk 5 dakikasında yok');
    await p.clock.runFor(5 * 60_000);
    await sekme(p, 'history'); await p.clock.runFor(1000); await sekme(p, 'home'); await p.clock.runFor(1000);
    assert.equal(await say(), 0, 'Geçmiş\'te 5 sn kalınmadan yok');
    await sekme(p, 'more'); await p.clock.runFor(10_000); await sekme(p, 'home'); await p.clock.runFor(1000);
    assert.equal(await say(), 1, 'doğal durakta bir kez');
    await sekme(p, 'favorites'); await p.clock.runFor(60_000); await sekme(p, 'home'); await p.clock.runFor(1000);
    assert.equal(await say(), 1, '8 dakika dolmadan ikincisi yok');
    await sekme(p, 'history'); await p.clock.runFor(10_000);
    await p.click('.row-main'); await p.clock.runFor(9 * 60_000);
    assert.equal(await say(), 1, 'geçmiş kaydını açmak doğal durak değil');
    const kayit = await p.evaluate(() => JSON.parse(localStorage.getItem('unitica.reklam')));
    assert.equal(kayit.son.length, 1, 'gösterim kalıcı sayaca yazıldı');
    assert.deepEqual(hatalar, []);
    await ctx.close();
  });

  await sina('C3 reklamsız üye: AdMob hiç başlatılmaz', async () => {
    const { p, ctx, hatalar } = await sayfa({ dil: 'de', yerel: { uye: true } });
    await p.waitForFunction(() => window.__kayit.some((c) => c.ad === 'getPurchases'));
    await p.waitForTimeout(400);
    const a = adlar(await p.evaluate(() => window.__kayit));
    for (const x of ['requestConsentInfo', 'initialize', 'showBanner', 'prepareInterstitial']) assert.ok(!a.includes(x), `${x} çağrılmamalı`);
    await sekme(p, 'more');
    assert.match(await p.textContent('.promo small'), /Aktiv/);
    assert.deepEqual(hatalar, []);
    await ctx.close();
  });

  await sina('C4 AB onayı reddedildi: form gösterilir, reklam istenmez, gizlilik seçenekleri satırı görünür', async () => {
    const { p, ctx, hatalar } = await sayfa({ dil: 'fr', yerel: { onay: 'form' } });
    await p.waitForFunction(() => window.__kayit.some((c) => c.ad === 'showConsentForm'));
    await p.waitForTimeout(300);
    const a = adlar(await p.evaluate(() => window.__kayit));
    assert.ok(!a.includes('initialize') && !a.includes('showBanner'), 'onaysız reklam yok');
    await sekme(p, 'more');
    await p.click('[data-act="adPrivacy"]'); await p.waitForTimeout(100);
    assert.ok(adlar(await p.evaluate(() => window.__kayit)).includes('showPrivacyOptionsForm'));
    assert.deepEqual(hatalar, []);
    await ctx.close();
  });

  await sina('C5 abonelik: mağaza fiyatı, adfree/yearly/subs satın alma, banner kalkar, Yönet bağlantısı', async () => {
    const { p, ctx, hatalar } = await sayfa({ dil: 'tr', yerel: {} });
    await p.waitForFunction(() => window.__kayit.some((c) => c.ad === 'showBanner'));
    await sekme(p, 'more');
    await p.waitForFunction(() => /399,99/.test(document.querySelector('.promo small').textContent));
    await p.click('[data-act="member"]');
    await p.waitForFunction(() => /399,99/.test(document.querySelector('.plan[data-plan="yearly"]').textContent));
    await p.click('[data-buy]');
    await p.waitForFunction(() => window.__kayit.some((c) => c.ad === 'removeBanner'));
    const k = await p.evaluate(() => window.__kayit);
    const al = k.find((c) => c.ad === 'purchaseProduct').arg;
    assert.deepEqual([al.productIdentifier, al.planIdentifier, al.productType, al.offerToken], ['adfree', 'yearly', 'subs', 'tok-yearly']);
    const yonet = await p.getAttribute('[data-manage]', 'href');
    assert.equal(yonet, 'https://play.google.com/store/account/subscriptions?sku=adfree&package=com.poyrazworkshop.unitica');
    assert.equal(await p.evaluate(() => document.documentElement.classList.contains('reklamli')), false);
    assert.deepEqual(hatalar, []);
    await ctx.close();
  });

  await sina('C6 tarayıcı (eklenti yok): sahte mağaza fiyatı yalnız burada; ?billing=off ile fiyat yok', async () => {
    const { p, ctx, hatalar } = await sayfa({ dil: 'en' });
    await sekme(p, 'more');
    await p.waitForFunction(() => /\$9\.99/.test(document.querySelector('.promo small').textContent));
    await ctx.close();
    const s2 = await sayfa({ dil: 'en', ek: '?billing=off' });
    await sekme(s2.p, 'more'); await s2.p.waitForTimeout(400);
    assert.equal(await s2.p.textContent('.promo small'), 'Remove all ads');
    await s2.p.click('[data-act="member"]'); await s2.p.waitForTimeout(500);
    assert.ok(await s2.p.isDisabled('[data-buy]'));
    assert.deepEqual([...hatalar, ...s2.hatalar], []);
    await s2.ctx.close();
  });
  // ---------------------------------------------------------------- D. iPhone
  const GP = /Google[ -]?Play/i;
  const gorunenMetin = (p) => p.evaluate(() => document.body.innerText);
  for (const g of [{ dil: 'tr' }, { dil: 'ar', tema: 'dark', en: 340 }]) {
    const yer = `D iPhone ${g.dil} ${g.tema || 'light'} ${g.en || 390}`;
    await sina(`${yer}: UMP → ATT → initialize, iPhone kimlikleri, App Store ürünü, Apple koşulları ve bağlantıları`, async () => {
      const { p, ctx, hatalar } = await sayfa({ ...g, yerel: { platform: 'ios' } });
      await p.waitForFunction(() => window.__kayit.some((c) => c.ad === 'prepareInterstitial'));
      let k = await p.evaluate(() => window.__kayit);
      const a = adlar(k);
      assert.ok(a.indexOf('requestConsentInfo') < a.indexOf('trackingAuthorizationStatus'), 'önce UMP');
      assert.ok(a.indexOf('trackingAuthorizationStatus') < a.indexOf('requestTrackingAuthorization'), 'izin durumu sorulur');
      assert.ok(a.indexOf('requestTrackingAuthorization') < a.indexOf('initialize'), 'ATT initialize\'dan önce');
      assert.equal(k.find((c) => c.ad === 'showBanner').arg.adId, KIMLIK.REKLAM_KIMLIK.ios.banner);
      assert.equal(k.find((c) => c.ad === 'prepareInterstitial').arg.adId, KIMLIK.REKLAM_KIMLIK.ios.gecis);
      assert.notEqual(KIMLIK.REKLAM_KIMLIK.ios.banner, KIMLIK.REKLAM_KIMLIK.android.banner);
      const gp = k.find((c) => c.ad === 'getPurchases').arg;
      assert.equal(gp.onlyCurrentEntitlements, true, 'yalnız bu Apple hesabının geçerli hakları');
      await tumEkranlar(p, yer);
      await sekme(p, 'more');
      await p.click('[data-act="about"]'); await p.waitForTimeout(450);
      assert.doesNotMatch(await gorunenMetin(p), GP, 'Hakkında: Google Play geçmemeli');
      assert.match(await gorunenMetin(p), /App Store/);
      await altSayfaKapat(p);
      await p.click('[data-act="member"]');
      await p.waitForFunction(() => /399,99/.test(document.querySelector('.plan[data-plan="yearly"]').textContent));
      assert.deepEqual((await p.evaluate(() => window.__kayit)).find((c) => c.ad === 'getProducts').arg.productIdentifiers,
        ['com.poyrazworkshop.unitica.adfree.monthly', 'com.poyrazworkshop.unitica.adfree.yearly']);
      const uyelik = await gorunenMetin(p);
      assert.doesNotMatch(uyelik, GP, 'Üyelik: Google Play geçmemeli');
      assert.match(uyelik, /24/, 'Apple: yenilemeden en az 24 saat önce iptal');
      assert.equal(await p.getAttribute('.legal-links a[href*="gizlilik"]', 'href'), 'https://mahmuttari.github.io/Lispler/unitica/gizlilik.html');
      assert.equal(await p.getAttribute('.legal-links a[href*="apple.com"]', 'href'), 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/');
      assert.ok(await p.isVisible('[data-restore]'), 'geri yükleme düğmesi');
      await denetle(p, `${yer} üyelik`);
      await p.click('[data-buy]');
      await p.waitForFunction(() => window.__kayit.some((c) => c.ad === 'removeBanner'));
      k = await p.evaluate(() => window.__kayit);
      const al = k.find((c) => c.ad === 'purchaseProduct').arg;
      assert.equal(al.productIdentifier, 'com.poyrazworkshop.unitica.adfree.yearly');
      assert.equal(al.planIdentifier, undefined, 'iPhone\'da temel plan yok');
      assert.equal(await p.getAttribute('[data-manage]', 'href'), 'https://apps.apple.com/account/subscriptions');
      await p.click('[data-manage]'); await p.waitForTimeout(100);
      assert.ok(adlar(await p.evaluate(() => window.__kayit)).includes('manageSubscriptions'), 'Apple\'ın abonelik sayfası');
      assert.doesNotMatch(await gorunenMetin(p), GP);
      assert.deepEqual(hatalar, [], `${yer}: konsol hatası`);
      await ctx.close();
    });
  }

  await sina('D3 iPhone: izin önceden verilmiş/reddedilmişse yeniden sorulmaz; üye açılışta App Store\'dan tanınır', async () => {
    const { p, ctx, hatalar } = await sayfa({ dil: 'en', yerel: { platform: 'ios', att: 'denied' } });
    await p.waitForFunction(() => window.__kayit.some((c) => c.ad === 'initialize'));
    assert.ok(!adlar(await p.evaluate(() => window.__kayit)).includes('requestTrackingAuthorization'));
    await ctx.close();
    const s2 = await sayfa({ dil: 'en', yerel: { platform: 'ios', uye: true } });
    await s2.p.waitForFunction(() => window.__kayit.some((c) => c.ad === 'getPurchases'));
    await s2.p.waitForTimeout(400);
    const a = adlar(await s2.p.evaluate(() => window.__kayit));
    for (const x of ['requestConsentInfo', 'trackingAuthorizationStatus', 'initialize', 'showBanner']) assert.ok(!a.includes(x), `${x} çağrılmamalı`);
    await sekme(s2.p, 'more');
    await s2.p.click('[data-act="member"]'); await s2.p.waitForTimeout(400);
    assert.match(await gorunenMetin(s2.p), /Yearly|yearly/, 'etkin plan App Store\'un ürününden');
    assert.deepEqual([...hatalar, ...s2.hatalar], []);
    await s2.ctx.close();
  });
} finally {
  await b.close();
  kapat();
}
console.log(sonuc.join('\n'));
console.log(hata ? `\n${hata} deneme başarısız` : `\n${sonuc.length} deneme geçti`);
process.exit(hata ? 1 : 0);
