// hayalet-avcilari.web.app sitesi: içerik denetimi ve Hosting REST yayınının sahte sunucuya karşı sınanması.
// Çalıştırma: node --test hayalet-avcilari/site/site.test.mjs   (ağ, kimlik ve Firebase gerekmez)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MAGAZA = path.join(KOK, 'hayalet-avcilari', 'magaza');

// Sahte Hosting API'si ve sahte site: yayinla'nın gönderdiği sürümü saklar, yayınlanınca /site/ altında sunar
const kayit = { istekler: [], dosyalar: null, yuklenen: new Map(), canli: new Map(), ayar: null, durum: null, bitti: false };
const sunucu = http.createServer(async (q, r) => {
  const parca = []; for await (const p of q) parca.push(p);
  const govde = Buffer.concat(parca);
  const u = new URL(q.url, 'http://x');
  kayit.istekler.push({ yontem: q.method, yol: u.pathname, kota: q.headers['x-goog-user-project'], yetki: q.headers.authorization });
  const json = (kod, o) => { r.writeHead(kod, { 'content-type': 'application/json' }); r.end(JSON.stringify(o)); };
  if (u.pathname.startsWith('/site/')) {
    const icerik = kayit.canli.get(u.pathname.slice(5));
    if (!icerik) { r.writeHead(404); return r.end('yok'); }
    r.writeHead(200); return r.end(icerik);
  }
  if (q.headers.authorization !== 'Bearer deneme') return json(401, { error: { message: 'kimlik yok' } });
  const V = '/sites/hayalet-avcilari/versions/v1';
  if (q.method === 'GET' && u.pathname === '/projects/hayalet-avcilari/sites/hayalet-avcilari') return json(200, { name: 'projects/1/sites/hayalet-avcilari', defaultUrl: 'https://hayalet-avcilari.web.app', type: 'DEFAULT_SITE' });
  if (q.method === 'GET' && u.pathname === '/sites/hayalet-avcilari/channels/live/releases') return json(200, {});
  // Kota projesi başlığı bu hesapta reddedilir (serviceUsageConsumer rolü verilmemiş hâl)
  if (q.headers['x-goog-user-project']) return json(403, { error: { status: 'PERMISSION_DENIED', message: 'Caller does not have required permission to use project hayalet-avcilari. Grant the caller the roles/serviceusage.serviceUsageConsumer role', details: [{ reason: 'USER_PROJECT_DENIED' }] } });
  if (q.method === 'POST' && u.pathname === '/sites/hayalet-avcilari/versions') { kayit.ayar = JSON.parse(govde).config; return json(200, { name: V.slice(1), status: 'CREATED' }); }
  if (q.method === 'POST' && u.pathname === V + ':populateFiles') {
    kayit.dosyalar = JSON.parse(govde).files;
    // legal.css sunucuda zaten varmış gibi: yüklenmesi istenmez
    const gerekli = Object.entries(kayit.dosyalar).filter(([yol]) => yol !== '/legal.css').map(([, ozet]) => ozet);
    return json(200, { uploadRequiredHashes: gerekli, uploadUrl: `http://127.0.0.1:${sunucu.address().port}/upload${V}/files` });
  }
  if (q.method === 'POST' && u.pathname.startsWith(`/upload${V}/files/`)) {
    const ozet = u.pathname.split('/').pop();
    assert.equal(q.headers['content-type'], 'application/octet-stream');
    assert.equal(crypto.createHash('sha256').update(govde).digest('hex'), ozet, 'yüklenen gzip özetiyle eşleşmeli');
    kayit.yuklenen.set(ozet, zlib.gunzipSync(govde));
    r.writeHead(200); return r.end();
  }
  if (q.method === 'PATCH' && u.pathname === V) { assert.equal(u.searchParams.get('update_mask'), 'status'); kayit.durum = JSON.parse(govde).status; return json(200, { name: V.slice(1), status: kayit.durum }); }
  if (q.method === 'POST' && u.pathname === '/sites/hayalet-avcilari/releases') {
    assert.equal(u.searchParams.get('versionName'), V.slice(1));
    assert.equal(kayit.durum, 'FINALIZED', 'yayından önce sürüm kapatılmalı');
    for (const [yol, ozet] of Object.entries(kayit.dosyalar)) {
      kayit.canli.set(yol, kayit.yuklenen.get(ozet) ?? fs.readFileSync(path.join(KOK, 'app', 'legal.css')));
    }
    kayit.bitti = true;
    return json(200, { name: 'sites/hayalet-avcilari/releases/r1', releaseTime: '2026-10-28T00:00:00Z' });
  }
  json(404, { error: { message: `bilinmeyen ${q.method} ${u.pathname}` } });
}).listen(0);
const taban = `http://127.0.0.1:${sunucu.address().port}`;
Object.assign(process.env, { HOSTING_API: taban, SITE_ADRES: taban + '/site', BEKLE_MS: '0', TOKEN: 'deneme' });
const site = await import('./yayin.mjs');
test.after(() => sunucu.close());

const metin = (b) => b.toString('utf8');
const destek = /^- \*\*Destek e-postası:\*\* (\S+)$/m.exec(fs.readFileSync(path.join(MAGAZA, 'aciklamalar.md'), 'utf8'))?.[1];

test('site dosyaları: sayfalar, ortak stil ve app-ads.txt', () => {
  const d = site.dosyalar();
  for (const yol of ['/index.html', '/gizlilik.html', '/hesap-silme.html', '/icon-192.png', '/legal.css', '/app-ads.txt']) assert.ok(d.has(yol), yol);
  assert.match(metin(d.get('/app-ads.txt')), /^google\.com, pub-\d{16}, DIRECT, f08c47fec0942fa0\n$/);
});

test('sayfalarda sahibin adı, kişisel e-postası ya da github.io adresi yok', () => {
  for (const [yol, icerik] of site.dosyalar()) {
    if (yol.endsWith('.png')) continue;
    assert.doesNotMatch(metin(icerik), /mahmut|marfen|github\.io/i, yol);
  }
});

test('sayfa içi bağlantılar sitedeki bir dosyaya gider; kanonik adres web.app', () => {
  const d = site.dosyalar();
  for (const [yol, icerik] of d) {
    if (!yol.endsWith('.html')) continue;
    const html = metin(icerik);
    for (const [, hedef] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(https?:|mailto:|#)/.test(hedef)) continue;
      const cozulen = new URL(hedef, 'https://hayalet-avcilari.web.app' + yol).pathname;
      assert.ok(d.has(cozulen), `${yol} → ${hedef} (${cozulen}) sitede yok`);
    }
    const kanonik = /<link rel="canonical" href="([^"]+)">/.exec(html)?.[1];
    assert.equal(kanonik, 'https://hayalet-avcilari.web.app' + (yol === '/index.html' ? '/' : yol), yol);
  }
});

test('Play adresleri ve e-posta siteyle aynı', () => {
  const md = fs.readFileSync(path.join(MAGAZA, 'aciklamalar.md'), 'utf8');
  assert.match(md, /^- \*\*Gizlilik politikası:\*\* https:\/\/hayalet-avcilari\.web\.app\/gizlilik\.html$/m);
  assert.match(md, /^- \*\*Hesap silme adresi:\*\* https:\/\/hayalet-avcilari\.web\.app\/hesap-silme\.html$/m);
  assert.match(destek, /^[^@\s]+@[^@\s]+$/);
  assert.doesNotMatch(destek, /mahmut|marfen/i);
  const csv = fs.readFileSync(path.join(MAGAZA, 'veri-guvenligi.csv'), 'utf8');
  for (const satir of csv.split('\n').filter((s) => /DELETION_URL/.test(s))) assert.match(satir, /,https:\/\/hayalet-avcilari\.web\.app\/hesap-silme\.html,/);
  // Sayfalardaki her e-posta adresi mağazadaki destek adresidir
  for (const [yol, icerik] of site.dosyalar()) {
    if (!yol.endsWith('.html')) continue;
    for (const [adres] of metin(icerik).matchAll(/[\w.+-]+@[\w-]+\.[\w.]+/g)) assert.equal(adres, destek, yol);
  }
});

test('durum yayından önce farkı bildirir, yayinla sürümü kapatıp yayınlar, sonra site aynıdır', async () => {
  const d = site.dosyalar();
  assert.equal(await site.durum(d), false, 'boş sitede fark olmalı');
  assert.equal(await site.yayinla(d), true);
  assert.ok(kayit.bitti);
  // Her dosya gzip'li hâlinin SHA-256 özetiyle bildirildi, legal.css dışındakiler yüklendi
  for (const [yol, { ozet }] of site.ozetle(d)) assert.equal(kayit.dosyalar[yol], ozet, yol);
  assert.equal(kayit.yuklenen.size, d.size - 1);
  assert.deepEqual(kayit.ayar, site.AYAR);
  // Kota başlığı reddedilince sonraki bütün istekler başlıksız gitti; hepsinde kimlik vardı
  const api = kayit.istekler.filter((i) => !i.yol.startsWith('/site/'));
  const red = api.findIndex((i) => i.yontem === 'POST' && i.kota);
  assert.ok(red >= 0, 'ilk sürüm isteği kota başlığıyla gitmeli');
  assert.ok(api.slice(red + 1).every((i) => !i.kota), 'reddedildikten sonra başlık gönderilmemeli');
  assert.ok(api.every((i) => i.yetki === 'Bearer deneme' || i.yol.startsWith('/upload/')));
  assert.equal(await site.karsilastir(d), true);
});
