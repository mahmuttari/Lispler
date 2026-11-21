// Şikâyet özeti: ağ çağrısı sahte; emülatör gerekmez (node --test test/sikayetler.test.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { belgeleriCoz, ozetle, govdeYaz, kayitlariOku } from '../sikayetler.mjs';

const GUN = 24 * 60 * 60 * 1000;
const SIMDI = Date.parse('2026-11-09T06:00:00Z');
const belge = (status, reason, gunOnce) => ({
  document: { fields: {
    status: { stringValue: status }, reason: { stringValue: reason },
    createdAt: { timestampValue: new Date(SIMDI - gunOnce * GUN).toISOString() },
  } },
});

test('Firestore yanıtı yalnız status, reason ve createdAt alanlarına çevrilir', () => {
  const k = belgeleriCoz([belge('yeni', 'kufur', 2), { readTime: 'x' }]);
  assert.equal(k.length, 1);
  assert.deepEqual(Object.keys(k[0]).sort(), ['createdAt', 'reason', 'status']);
});

test('özet: bekleyen, nedenler, son 7 gün ve en eski bekleyen', () => {
  const k = belgeleriCoz([belge('yeni', 'kufur', 2), belge('yeni', 'taciz', 10), belge('yeni', 'bilinmeyen', 1),
    belge('incelendi', 'spam', 3), belge('incelendi', 'kufur', 30)]);
  const o = ozetle(k, SIMDI);
  assert.equal(o.bekleyen, 3);
  assert.equal(o.sonYediGun, 3);
  assert.equal(o.toplam, 5);
  assert.equal(o.enEskiGun, 10);
  assert.deepEqual(o.nedenler, { kufur: 1, taciz: 1, diger: 1 });
});

test('gövde: kişisel veri yok, kullanıcı anılır, boşsa "yok" der', () => {
  const dolu = govdeYaz(ozetle(belgeleriCoz([belge('yeni', 'taciz', 4)]), SIMDI), { tarih: new Date(SIMDI), anilan: 'mahmuttari' });
  assert.match(dolu, /@mahmuttari/);
  assert.match(dolu, /İncelenmeyi bekleyen: 1/);
  assert.match(dolu, /\| Taciz \| 1 \|/);
  assert.match(dolu, /console\.firebase\.google\.com/);
  const bos = govdeYaz(ozetle([], SIMDI), { tarih: new Date(SIMDI) });
  assert.match(bos, /İncelenmeyi bekleyen şikâyet yok/);
  assert.doesNotMatch(bos, /@/);
});

test('sorgu salt okuma: runQuery, yalnız üç alan, kimlik başlığı', async () => {
  let cagri;
  const getir = async (url, opts) => { cagri = { url, opts }; return { ok: true, text: async () => JSON.stringify([belge('yeni', 'spam', 1)]) }; };
  const k = await kayitlariOku({ token: 'T', getir });
  assert.equal(k.length, 1);
  assert.match(cagri.url, /documents:runQuery$/);
  assert.equal(cagri.opts.method, 'POST');
  assert.equal(cagri.opts.headers.Authorization, 'Bearer T');
  const sorgu = JSON.parse(cagri.opts.body).structuredQuery;
  assert.deepEqual(sorgu.select.fields.map((f) => f.fieldPath), ['status', 'reason', 'createdAt']);
  assert.deepEqual(sorgu.from, [{ collectionId: 'reports' }]);
});

test('Firestore hatası açık mesajla yükselir', async () => {
  const getir = async () => ({ ok: false, status: 403, text: async () => 'PERMISSION_DENIED' });
  await assert.rejects(kayitlariOku({ token: 'T', getir }), /403: PERMISSION_DENIED/);
});
