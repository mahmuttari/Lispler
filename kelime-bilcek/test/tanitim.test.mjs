// Kelime Bilcek — arkadaşını davet et + değerlendirme kuralları (www/tanitim.js, 1.0.6).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const bellek = new Map();
globalThis.localStorage = { getItem: (k) => (bellek.has(k) ? bellek.get(k) : null), setItem: (k, v) => bellek.set(k, String(v)), removeItem: (k) => bellek.delete(k) };
const T = require('../www/tanitim.js');
const GUN = 864e5;
const simdi = Date.UTC(2026, 10, 12);

test('değerlendirme: yalnız kazanınca ve en az 3 bitmiş maçtan sonra', () => {
  assert.equal(T.degerlendirmeUygunMu({ mac: 5, istek: [] }, false, simdi), false, 'kaybedince/berabere yok');
  assert.equal(T.degerlendirmeUygunMu({ mac: 2, istek: [] }, true, simdi), false, 'ilk maçlarda yok');
  assert.equal(T.degerlendirmeUygunMu({ mac: 3, istek: [] }, true, simdi), true);
});

test('değerlendirme: iki istek arası ≥ 30 gün, toplam ≤ 3', () => {
  assert.equal(T.degerlendirmeUygunMu({ mac: 9, istek: [simdi - 29 * GUN] }, true, simdi), false);
  assert.equal(T.degerlendirmeUygunMu({ mac: 9, istek: [simdi - 31 * GUN] }, true, simdi), true);
  assert.equal(T.degerlendirmeUygunMu({ mac: 9, istek: [1, 2, 3] }, true, simdi), false);
});

test('maç sayacı localStorage\'da artar; bozuk kayıt sıfırdan başlar', () => {
  bellek.set(T.TANITIM.anahtar, '{bozuk');
  assert.deepEqual(T.tanitimKaydiOku(), { mac: 0, istek: [] });
  T.tanitimMacBitti(); T.tanitimMacBitti();
  assert.equal(T.tanitimKaydiOku().mac, 2);
});

test('web/test ortamında (Capacitor yok) değerlendirme istenmez', async () => {
  bellek.set(T.TANITIM.anahtar, JSON.stringify({ mac: 10, istek: [] }));
  assert.equal(await T.degerlendirmeIste(true), false);
  assert.deepEqual(T.tanitimKaydiOku().istek, [], 'istenmeyen pencere sayılmaz');
});

test('paylaşım metni: kazanınca skorlu, yoksa genel; mağaza adresi doğru paket', () => {
  assert.match(T.paylasimMetni({ ben: 6, rakip: 4 }), /6-4 kazandım/);
  assert.doesNotMatch(T.paylasimMetni({ ben: 3, rakip: 7 }), /kazandım/);
  assert.match(T.paylasimMetni(), /kelime düellosu/);
  assert.equal(T.TANITIM.magazaAdresi, 'https://play.google.com/store/apps/details?id=com.poyrazworkshop.kelimebilcek');
});
