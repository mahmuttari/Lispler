// ios-ortak/asc.mjs, sahte App Store Connect sunucusuyla (ağ yok, gerçek anahtar yok).
// Çalıştırma: node --test ios-ortak/asc.test.mjs
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
const istekler = [];
const veri = {
  bundleIds: [{ id: 'B1', type: 'bundleIds', attributes: { identifier: 'com.poyrazworkshop.unitica', seedId: 'TAKIM12345', name: 'Unitica' } }],
  apps: [{ id: 'A1', type: 'apps', attributes: { bundleId: 'com.poyrazworkshop.unitica', name: 'Unitica – Birim Dönüştürücü' } }],
  builds: [{ id: 'Y1', attributes: { version: '3', processingState: 'VALID' } }, { id: 'Y2', attributes: { version: '7', processingState: 'VALID' } }],
  bekleyen: 2,   // bekle: iki sorguda PROCESSING, sonra VALID
  vl: [],        // sürüm metinleri (gorsel sınamasında doldurulur)
};
const sunucu = http.createServer((q, r) => {
  let govde = '';
  q.on('data', (c) => { govde += c; });
  q.on('end', () => {
    const u = new URL(q.url, 'http://x');
    istekler.push({ yontem: q.method, yol: u.pathname, arama: Object.fromEntries(u.searchParams), auth: q.headers.authorization, govde: (() => { try { return govde ? JSON.parse(govde) : null; } catch { return { ikili: govde.length }; } })() });
    const yanit = (kod, j) => { r.writeHead(kod, { 'content-type': 'application/json' }); r.end(JSON.stringify(j)); };
    if (u.pathname === '/v1/bundleIds' && q.method === 'GET') {
      return yanit(200, { data: veri.bundleIds.filter((b) => b.attributes.identifier === u.searchParams.get('filter[identifier]')) });
    }
    if (u.pathname === '/v1/bundleIds' && q.method === 'POST') return yanit(201, { data: { id: 'YENI', type: 'bundleIds' } });
    if (u.pathname === '/v1/apps') return yanit(200, { data: veri.apps.filter((a) => a.attributes.bundleId === u.searchParams.get('filter[bundleId]')) });
    if (u.pathname === '/v1/builds') {
      if (u.searchParams.get('filter[version]')) {
        const v = u.searchParams.get('filter[version]');
        if (v === '404') return yanit(200, { data: [] });
        const durum = veri.bekleyen-- > 0 ? 'PROCESSING' : 'VALID';
        return yanit(200, { data: [{ id: 'Y9', attributes: { version: v, processingState: durum } }] });
      }
      return yanit(200, { data: veri.builds });
    }
    if (u.pathname === '/v1/appScreenshots' && q.method === 'POST') {
      const n = JSON.parse(govde).data.attributes.fileSize;
      return yanit(201, { data: { id: `SS${istekler.length}`, attributes: { uploadOperations: [
        { method: 'PUT', url: `${process.env.ASC_API}/yukle/${istekler.length}`, offset: 0, length: Math.ceil(n / 2), requestHeaders: [{ name: 'Content-Type', value: 'image/jpeg' }] },
        { method: 'PUT', url: `${process.env.ASC_API}/yukle/${istekler.length}b`, offset: Math.ceil(n / 2), length: n - Math.ceil(n / 2), requestHeaders: [] }] } } });
    }
    if (q.method !== 'GET') return yanit(q.method === 'POST' ? 201 : 200, { data: { id: `YENI-${istekler.length}`, type: 'x', attributes: {} } });
    if (/\/apps\/A1\/appStoreVersions$/.test(u.pathname)) return yanit(200, { data: [{ id: 'V1', attributes: { versionString: '1.4.0', appStoreState: 'PREPARE_FOR_SUBMISSION', copyright: '2026 Mahmut Tarı', releaseType: 'MANUAL' } }] });
    if (u.pathname === '/v1/apps/A1/appInfos') return yanit(200, { data: [{ id: 'I1', attributes: { state: 'PREPARE_FOR_SUBMISSION' }, relationships: { primaryCategory: { data: null } } }] });
    if (u.pathname === '/v1/appInfos/I1/appInfoLocalizations') return yanit(200, { data: [{ id: 'L-tr', attributes: { locale: 'tr', name: 'Unitica – Birim Dönüştürücü', subtitle: 'eski', privacyPolicyUrl: '' } }] });
    if (u.pathname === '/v1/appStoreVersions/V1/appStoreVersionLocalizations') return yanit(200, { data: veri.vl });
    if (/\/appScreenshotSets$/.test(u.pathname)) return yanit(200, { data: [] });
    if (/^\/v1\/appScreenshots\/[\w-]+$/.test(u.pathname)) return yanit(200, { data: { attributes: { assetDeliveryState: { state: 'COMPLETE' } } } });
    if (/\/appScreenshotSets\/[\w-]+\/appScreenshots$/.test(u.pathname)) return yanit(200, { data: [] });
    if (u.pathname === '/v1/appInfos/I1/ageRatingDeclaration') return yanit(200, { data: { id: 'Y1', attributes: { advertising: false, violenceRealistic: 'NONE', kidsAgeBand: null } } });
    if (/\/subscriptionGroups$/.test(u.pathname)) return yanit(200, { data: [{ id: 'G1', attributes: { referenceName: 'Reklamsız' } }] });
    if (/\/subscriptionGroupLocalizations$/.test(u.pathname)) return yanit(200, { data: [{ attributes: { locale: 'tr' } }] });
    if (/\/subscriptionGroups\/G1\/subscriptions$/.test(u.pathname)) return yanit(200, { data: [{ id: 'S1', attributes: { productId: 'com.poyrazworkshop.unitica.adfree.yearly', reviewNote: '' } }] });
    if (/\/subscriptionLocalizations$/.test(u.pathname)) return yanit(200, { data: [] });
    if (/\/subscriptionAvailability$/.test(u.pathname)) return yanit(404, { errors: [{ code: 'NOT_FOUND' }] });
    if (u.pathname === '/v1/territories') return yanit(200, { data: ['USA', 'TUR', 'DEU', 'CHN'].map((id) => ({ id })) });
    if (/\/prices$/.test(u.pathname)) return yanit(200, { data: [] });
    if (/\/pricePoints$/.test(u.pathname)) return yanit(200, { data: [{ id: 'P099', attributes: { customerPrice: '0.99' } }, { id: 'P999', attributes: { customerPrice: '9.99' } }] });
    if (/\/equalizations$/.test(u.pathname)) return yanit(200, { data: ['TUR', 'DEU', 'CHN'].map((t) => ({ id: `E-${t}`, relationships: { territory: { data: { id: t } } } })) });
    if (/\/apps\/A1\/subscriptionGroups$/.test(u.pathname)) return yanit(200, { data: [] });
    yanit(404, { errors: [{ code: 'NOT_FOUND', title: 'yok', detail: u.pathname }] });
  });
});
await new Promise((ok) => sunucu.listen(0, '127.0.0.1', ok));
process.env.ASC_API = `http://127.0.0.1:${sunucu.address().port}`;
process.env.ASC_KEY_ID = 'ANAHTAR123';
process.env.ASC_ISSUER_ID = '00000000-1111-2222-3333-444444444444';
process.env.ASC_PRIVATE_KEY = privateKey.export({ type: 'pkcs8', format: 'pem' });
process.env.BEKLE_MS = '5';
process.env.ASC_ARALIK_MS = '0';
const asc = await import('./asc.mjs');
test.after(() => sunucu.close());

test('JWT: ES256 (r‖s), kid, iss, aud, 20 dakika; imza açık anahtarla doğrulanır', () => {
  const j = asc.anahtar(1_800_000_000);
  const [b, y, i] = j.split('.');
  assert.deepEqual(JSON.parse(Buffer.from(b, 'base64url')), { alg: 'ES256', kid: 'ANAHTAR123', typ: 'JWT' });
  const yuk = JSON.parse(Buffer.from(y, 'base64url'));
  assert.equal(yuk.iss, process.env.ASC_ISSUER_ID);
  assert.equal(yuk.aud, 'appstoreconnect-v1');
  assert.equal(yuk.exp - yuk.iat, 1200);
  assert.equal(Buffer.from(i, 'base64url').length, 64, 'P1363 imza 64 bayt');
  assert.ok(crypto.verify('sha256', Buffer.from(`${b}.${y}`), { key: publicKey, dsaEncoding: 'ieee-p1363' }, Buffer.from(i, 'base64url')));
});

test('uygulamalar: paket kimlikleri Capacitor appId ve Not Defteri project.yml ile aynı; abonelik ürünleri kodla aynı', () => {
  for (const u of ['unitica', 'calqora', 'smart-measure']) {
    const cap = JSON.parse(fs.readFileSync(new URL(`../${u}/capacitor.config.json`, import.meta.url), 'utf8'));
    assert.equal(asc.UYGULAMALAR[u].paket, cap.appId, u);
    assert.match(asc.UYGULAMALAR[u].ad, /^[A-Za-z0-9 ]+$/, 'Apple Developer adı ASCII');
  }
  assert.match(fs.readFileSync(new URL('../ios/project.yml', import.meta.url), 'utf8'), /PRODUCT_BUNDLE_IDENTIFIER: com\.poyrazworkshop\.notdefteri/);
  assert.deepEqual(asc.urunler('unitica'), ['com.poyrazworkshop.unitica.adfree.monthly', 'com.poyrazworkshop.unitica.adfree.yearly']);
  assert.match(fs.readFileSync(new URL('../calqora/www/js/config.js', import.meta.url), 'utf8'), /com\.poyrazworkshop\.calqora\.adfree\.monthly/);
  assert.match(fs.readFileSync(new URL('../smart-measure/www/js/billing.js', import.meta.url), 'utf8'), /\$\{PACKAGE\}\.adfree\.monthly/);
  assert.deepEqual(asc.urunler('notdefteri'), []);
  assert.equal(asc.surum('unitica'), '1.4.0');
  assert.match(asc.surum('notdefteri'), /^\d+\.\d+/);
});

test('durum: salt okunur; paket, kayıt, sürüm, yapı, abonelik', async () => {
  istekler.length = 0;
  const d = await asc.durum(['unitica', 'calqora']);
  assert.ok(istekler.every((x) => x.yontem === 'GET'), 'durum yazmaz');
  assert.ok(istekler.every((x) => /^Bearer [\w-]+\.[\w-]+\.[\w-]+$/.test(x.auth)));
  assert.equal(d.unitica.paketKayitli, true);
  assert.equal(d.unitica.uygulamaKaydi, 'Unitica – Birim Dönüştürücü');
  assert.deepEqual(d.unitica.abonelikler, { 'com.poyrazworkshop.unitica.adfree.monthly': false, 'com.poyrazworkshop.unitica.adfree.yearly': true });
  assert.deepEqual(d.unitica.yapilar, ['3 VALID', '7 VALID']);
  assert.equal(d.calqora.paketKayitli, false);
  assert.equal(d.calqora.uygulamaKaydi, null);
});

test('paket: "uygula" yoksa yalnız plan; uygulayınca eksikleri ASCII adla kaydeder', async () => {
  istekler.length = 0;
  assert.deepEqual(await asc.paket(false), ['calqora', 'smart-measure', 'notdefteri']);
  assert.ok(!istekler.some((x) => x.yontem === 'POST'));
  istekler.length = 0;
  await asc.paket(true);
  const post = istekler.filter((x) => x.yontem === 'POST').map((x) => x.govde.data.attributes);
  assert.deepEqual(post, [
    { identifier: 'com.poyrazworkshop.calqora', name: 'Calqora', platform: 'IOS' },
    { identifier: 'com.poyrazworkshop.smartmeasure', name: 'Olcu Kutusu', platform: 'IOS' },
    { identifier: 'com.poyrazworkshop.notdefteri', name: 'Not Defteri', platform: 'IOS' },
  ]);
});

test('onkontrol: test AdMob kimliği, eksik paket ya da kayıt varsa yükleme durur', async () => {
  // depodaki iOS AdMob kimlikleri şimdilik Google'ın test kimlikleri
  assert.equal(asc.admobTestMi('unitica'), true);
  await assert.rejects(asc.onkontrol('unitica'), /test kimlikleri/);
  await assert.rejects(asc.onkontrol('calqora'), /paket kimliği.*kayıtlı değil[\s\S]*uygulama kaydı yok/);
  await assert.rejects(asc.onkontrol('baska'), /bilinmeyen uygulama/);
});

test('hazirla: takım kimliği paketin seedId\'si, yapı = en büyük + 1; GITHUB_OUTPUT\'a yazılır', async () => {
  const dosya = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'asc-')), 'cikti');
  process.env.GITHUB_OUTPUT = dosya;
  try {
    assert.deepEqual(await asc.hazirla('unitica'), { takim: 'TAKIM12345', yapi: 8, surum: '1.4.0' });
    assert.equal(fs.readFileSync(dosya, 'utf8'), 'takim=TAKIM12345\nyapi=8\nsurum=1.4.0\n');
  } finally { delete process.env.GITHUB_OUTPUT; }
});

test('bekle: PROCESSING → VALID; hiç görünmeyen yapıda durur', async () => {
  assert.equal(await asc.bekle('unitica', '8'), 'VALID');
  await assert.rejects(asc.bekle('unitica', '404'), /görünmüyor/);
});

test('metin: "uygula" yoksa hiçbir şey yazmaz; uygulayınca uygulama bilgisi, kategori, sürüm metinleri', async () => {
  istekler.length = 0;
  const p = await asc.metin('unitica', false);
  assert.ok(istekler.every((x) => x.yontem === 'GET'), 'plan kipinde yazma yok');
  assert.ok(p.some((x) => /içerik hakları/.test(x)));
  assert.ok(p.some((x) => /kategori: — \/ — → UTILITIES/.test(x)));
  assert.ok(p.some((x) => /uygulama bilgisi tr \(subtitle, privacyPolicyUrl\)/.test(x)), 'var olan Türkçe kayıt güncellenir');
  assert.equal(p.filter((x) => /^uygulama bilgisi /.test(x)).length, 11);
  assert.equal(p.filter((x) => /^sürüm metni /.test(x)).length, 11);
  istekler.length = 0;
  await asc.metin('unitica', true);
  const yaz = istekler.filter((x) => x.yontem !== 'GET');
  const tr = yaz.find((x) => x.yol === '/v1/appInfoLocalizations/L-tr').govde.data.attributes;
  assert.deepEqual(tr, { name: 'Unitica – Birim Dönüştürücü', subtitle: 'Mühendislik için 251 birim', privacyPolicyUrl: 'https://mahmuttari.github.io/Lispler/unitica/gizlilik.html' });
  const en = yaz.find((x) => x.yol === '/v1/appStoreVersionLocalizations' && x.govde.data.attributes.locale === 'en-US').govde.data;
  assert.match(en.attributes.description, /Terms of Use \(EULA\): https:\/\/www\.apple\.com\/legal/);
  assert.equal(en.attributes.supportUrl, 'https://mahmuttari.github.io/Lispler/unitica/gizlilik.html');
  assert.deepEqual(en.relationships.appStoreVersion.data, { type: 'appStoreVersions', id: 'V1' });
  assert.equal(yaz.find((x) => x.yol === '/v1/apps/A1').govde.data.attributes.contentRightsDeclaration, 'DOES_NOT_USE_THIRD_PARTY_CONTENT');
});

test('yaş: reklam Evet, öbür sorular Yok / Hayır; çocuk kategorisine dokunulmaz', async () => {
  istekler.length = 0;
  await asc.yas('unitica', true);
  const g = istekler.find((x) => x.yol === '/v1/ageRatingDeclarations/Y1').govde.data.attributes;
  assert.equal(g.advertising, true);
  assert.equal(g.unrestrictedWebAccess, false);
  assert.equal(g.violenceRealistic, 'NONE');
  assert.ok(!('kidsAgeBand' in g));
  await assert.rejects(asc.yas('notdefteri'), /yalnız Unitica/);
});

test('abonelik: plan kipinde yazmaz; aylık ürün açılır, adlar 11 dilde, Çin hariç, ABD 0,99 $ + eşdeğerleri', async () => {
  istekler.length = 0;
  const p = await asc.abonelik('unitica', false);
  assert.ok(istekler.every((x) => x.yontem === 'GET'));
  assert.ok(p.some((x) => /abonelik com\.poyrazworkshop\.unitica\.adfree\.monthly \(ONE_MONTH\)/.test(x)));
  assert.equal(p.filter((x) => /^grup adı /.test(x)).length, 10, 'Türkçe grup adı zaten var');
  istekler.length = 0;
  await asc.abonelik('unitica', true);
  const yaz = istekler.filter((x) => x.yontem !== 'GET');
  const ay = yaz.find((x) => x.yol === '/v1/subscriptions').govde.data.attributes;
  assert.deepEqual([ay.productId, ay.subscriptionPeriod, ay.groupLevel], ['com.poyrazworkshop.unitica.adfree.monthly', 'ONE_MONTH', 1]);
  assert.match(ay.reviewNote, /More tab/);
  const erisim = yaz.filter((x) => x.yol === '/v1/subscriptionAvailabilities').map((x) => x.govde.data.relationships.availableTerritories.data.map((t) => t.id));
  for (const e of erisim) assert.deepEqual(e.sort(), ['DEU', 'TUR', 'USA'], 'Çin anakarası hariç');
  const fiyat = yaz.filter((x) => x.yol === '/v1/subscriptionPrices').map((x) => [x.govde.data.relationships.territory.data.id, x.govde.data.relationships.subscriptionPricePoint.data.id]);
  assert.ok(fiyat.some(([t, n]) => t === 'USA' && n === 'P999'), 'yıllık ABD 9,99 $');
  assert.ok(fiyat.some(([t, n]) => t === 'TUR' && n === 'E-TUR'), 'Türkiye ABD eşdeğeri');
  const adlar = yaz.filter((x) => x.yol === '/v1/subscriptionLocalizations').map((x) => x.govde.data.attributes);
  assert.ok(adlar.some((a) => a.locale === 'tr' && a.name === 'Reklamsız – yıllık' && a.description === 'Bütün reklamları kaldırır'));
});

test('abonelik adları App Store sınırlarında (ad ≤30, açıklama ≤45) ve her App Store dilinde', async () => {
  const { YEREL } = await import('./app-store.mjs');
  assert.deepEqual(Object.keys(asc.ABONELIK_METIN).sort(), Object.keys(YEREL).sort());
  for (const [y, [g, a, yil, d]] of Object.entries(asc.ABONELIK_METIN)) {
    for (const s of [g, a, yil]) assert.ok([...s].length <= 30, `${y} ${s}`);
    assert.ok([...d].length <= 45, `${y} ${d}`);
  }
});

test('gorsel: plan kipinde yazmaz; uygulayınca 6,9″ kümesi açılır, her görsel iki parçada yüklenir, md5 bildirilir', async () => {
  veri.vl = [{ id: 'VL-tr', attributes: { locale: 'tr' } }];
  try {
    istekler.length = 0;
    const p = await asc.gorsel('unitica', false);
    assert.ok(istekler.every((x) => x.yontem === 'GET'));
    assert.ok(p.some((x) => /görsel kümesi tr \(APP_IPHONE_67\)/.test(x)));
    assert.equal(p.filter((x) => /^yükle tr\/iphone-/.test(x)).length, 6);
    istekler.length = 0;
    await asc.gorsel('unitica', true);
    const kayit = istekler.filter((x) => x.yol === '/v1/appScreenshots' && x.yontem === 'POST').map((x) => x.govde.data.attributes.fileName);
    assert.deepEqual(kayit, ['iphone-1-ana.jpg', 'iphone-2-donusum.jpg', 'iphone-3-kategoriler.jpg', 'iphone-4-gecmis.jpg', 'iphone-5-favoriler.jpg', 'iphone-6-koyu-tema.jpg']);
    assert.equal(istekler.filter((x) => x.yol.startsWith('/yukle/') && x.yontem === 'PUT').length, 12, 'her görsel iki parça');
    const bitti = istekler.filter((x) => /^\/v1\/appScreenshots\/SS/.test(x.yol) && x.yontem === 'PATCH').map((x) => x.govde.data.attributes);
    assert.equal(bitti.length, 6);
    assert.ok(bitti.every((a) => a.uploaded === true && /^[0-9a-f]{32}$/.test(a.sourceFileChecksum)));
  } finally { veri.vl = []; }
});
