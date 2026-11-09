// Kelime Bilcek — yapay zekâya karşı (www/bot.js) birim testleri (node --test). kelime.js ve bot.js tarayıcıda genel ad
// alanını paylaşır; burada aynı ad alanı globalThis'e kurulur.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const K = require('../www/kelime.js');
Object.assign(globalThis, K);
const B = require('../www/bot.js');

test('zincir sözlüğü: tek kelimelik, normalleştirilmiş, tekrarsız ve yüzlerce kelime', () => {
  const s = B.zincirSozlugu();
  assert.ok(s.length > 500, `sözlük ${s.length}`);
  assert.equal(new Set(s).size, s.length);
  for (const w of s) { assert.doesNotMatch(w, /[\s-]/); assert.equal(w, K.normalizeWord(w)); }
});

test('kategori kelimesi: listeden, kullanılmamış; zorluk bildiği kısmı daraltır', () => {
  const rnd = B.botRastgele(7);
  const kat = 'Sabah Kahvaltısının Vazgeçilmezleri';
  const liste = K.CATEGORY_WORDS[kat].map(K.normalizeWord);
  const kullanilan = new Set();
  for (let i = 0; i < 5; i++) {
    const w = B.botKategoriKelimesi(kat, kullanilan, 'zor', rnd);
    assert.ok(liste.includes(w)); assert.ok(!kullanilan.has(w)); kullanilan.add(w);
  }
  const kolayBildigi = new Set();
  for (let i = 0; i < 200; i++) kolayBildigi.add(B.botKategoriKelimesi(kat, new Set(), 'kolay', rnd));
  assert.ok(kolayBildigi.size <= Math.ceil(liste.length * 0.45), 'kolay bot listenin yarısından azını bilir');
  assert.equal(B.botKategoriKelimesi(kat, new Set(liste), 'zor', rnd), null, 'bildiği bitince null');
});

test('zincir kelimesi: istenen harfle başlar, kullanılmamıştır; yoksa null', () => {
  const rnd = B.botRastgele(3);
  for (const harf of ['a', 'k', 'm', 's', 't']) {
    const w = B.botZincirKelimesi(harf, new Set(), rnd);
    assert.equal(K.turkishFirstLetter(w), harf, `${harf} → ${w}`);
  }
  const hepsiK = new Set(B.zincirSozlugu().filter((w) => K.turkishFirstLetter(w) === 'k'));
  assert.equal(B.botZincirKelimesi('k', hepsiK, rnd), null);
});

test('gecikme: zorluğa göre aralıkta; zor bot kolaydan hızlı', () => {
  const rnd = B.botRastgele(11);
  for (let i = 0; i < 50; i++) {
    const z = B.botGecikme('sira', 'zor', rnd), k = B.botGecikme('sira', 'kolay', rnd);
    assert.ok(z >= 1500 && z <= 3500); assert.ok(k >= 4000 && k <= 9000);
  }
});

test('YerelOda: transaction, iptal, child.set, push, dinleyici, sunucu zamanı', async () => {
  globalThis.nowServer = () => 123456;
  const oda = new B.YerelOda('bot_x', { status: 'playing', round: { phase: 'thinking' } });
  const gelen = [];
  const fn = oda.on('value', (s) => gelen.push(s.val()));
  await new Promise((r) => setTimeout(r, 5));
  let r = await oda.transaction((c) => { c.round.phase = 'active'; return c; });
  assert.equal(r.committed, true); assert.equal(r.snapshot.val().round.phase, 'active');
  r = await oda.transaction(() => undefined);
  assert.equal(r.committed, false);
  await oda.child('round/phaseStartTime').set({ '.sv': 'timestamp' });
  const ref = oda.child('round/words').push();
  await ref.set({ text: 'elma', by: 'p1', valid: true, ts: 1 });
  const v = (await oda.once('value')).val();
  assert.equal(v.round.phaseStartTime, 123456);
  assert.deepEqual(Object.values(v.round.words), [{ text: 'elma', by: 'p1', valid: true, ts: 1 }]);
  v.round.phase = 'bozuldu'; // anlık görüntü kopyadır
  assert.equal((await oda.once('value')).val().round.phase, 'active');
  await new Promise((r2) => setTimeout(r2, 5));
  assert.ok(gelen.length >= 4);
  oda.off('value', fn);
  await oda.remove();
  assert.equal((await oda.once('value')).exists(), false);
});

test('bot döngüsü: Zincir\'de sırası gelince doğru harfle yazar ve sırayı verir', async () => {
  globalThis.nowServer = () => Date.now();
  B.BOT.sira.zor = [10, 20, 0]; // test hızlı olsun, takılma yok
  const oda = new B.YerelOda('bot_y', { status: 'playing', match: { mode: 'chain' },
    round: { number: 1, phase: 'active', turn: 'p2', turnStart: Date.now(), words: { a: { text: 'kalem', by: 'p1', valid: true, ts: 1 } } } });
  B.botBaslat(oda, 'zor', B.botRastgele(5));
  await new Promise((r) => setTimeout(r, 300));
  B.botDurdur();
  const v = (await oda.once('value')).val();
  const botun = Object.values(v.round.words).filter((w) => w.by === 'p2');
  assert.equal(botun.length, 1);
  assert.equal(K.turkishFirstLetter(botun[0].text), 'm');
  assert.equal(v.round.turn, 'p1');
});
