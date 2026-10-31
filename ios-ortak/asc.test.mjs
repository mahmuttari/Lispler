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
};
const sunucu = http.createServer((q, r) => {
  let govde = '';
  q.on('data', (c) => { govde += c; });
  q.on('end', () => {
    const u = new URL(q.url, 'http://x');
    istekler.push({ yontem: q.method, yol: u.pathname, arama: Object.fromEntries(u.searchParams), auth: q.headers.authorization, govde: govde ? JSON.parse(govde) : null });
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
    if (/\/appStoreVersions$/.test(u.pathname)) return yanit(200, { data: [{ attributes: { versionString: '1.4.0', appStoreState: 'PREPARE_FOR_SUBMISSION' } }] });
    if (/\/subscriptionGroups$/.test(u.pathname)) return yanit(200, { data: [{ id: 'G1' }] });
    if (/\/subscriptions$/.test(u.pathname)) return yanit(200, { data: [{ attributes: { productId: 'com.poyrazworkshop.unitica.adfree.yearly' } }] });
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
