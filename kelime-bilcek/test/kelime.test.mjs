// Kelime Bilcek — saf kelime işlevlerinin birim testleri (node --test). www/kelime.js tarayıcıda düz <script>,
// burada CommonJS olarak okunur.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const K = require('../www/kelime.js');

test('normalleştirme: Türkçe küçük harf, boşluk, şapka', () => {
  assert.equal(K.normalizeWord('  İZMİR   Köfte '), 'izmir köfte');
  assert.equal(K.normalizeWord('IŞIK'), 'ışık');
  assert.equal(K.normalizeWord('Kâğıt'), 'kağıt');
  assert.equal(K.normalizeWord('Hâkîm'), 'hakim');
  assert.equal(K.normalizeWord(null), '');
});

test('ilk ve son harf: Türkçe büyük İ/I, tire ve boşluk', () => {
  assert.equal(K.turkishFirstLetter('İnek'), 'i');
  assert.equal(K.turkishFirstLetter('Irmak'), 'ı');
  assert.equal(K.turkishLastLetter('KALEMLİK'), 'k');
  assert.equal(K.turkishLastLetter('post-it'), 't');
  assert.equal(K.turkishLastLetter('saç kremi'), 'i');
  assert.equal(K.turkishFirstLetter('Âlem'), 'a');
  assert.equal(K.turkishLastLetter(''), null);
});

test('zincir: "ğ" ile biten kelimeden sonra önceki harf istenir', () => {
  assert.equal(K.chainLetterFor('dağ'), 'a');
  assert.equal(K.chainLetterFor('Ağ'), 'a');
  assert.equal(K.chainLetterFor('kalem'), 'm');
  const kelimeler = { a: { text: 'elma', valid: true, ts: 1 }, b: { text: 'armut', valid: true, ts: 2 }, c: { text: 'tuz', valid: false, ts: 3 } };
  assert.equal(K.getChainNextLetter(kelimeler), 't');
  assert.equal(K.getChainNextLetter({}), null);
  // 1.0.1: aynı zaman damgasında sıra belirli (her istemcide aynı harf)
  const esit = { x: { text: 'masa', valid: true, ts: 5 }, y: { text: 'kalem', valid: true, ts: 5 } };
  const esit2 = { y: { text: 'kalem', valid: true, ts: 5 }, x: { text: 'masa', valid: true, ts: 5 } };
  assert.equal(K.getChainNextLetter(esit), K.getChainNextLetter(esit2));
  assert.equal(K.getChainNextLetter(null), null);
});

test('kategoriler: 25 kategori, her birinin sözlüğü ve simgesi var', () => {
  assert.equal(K.CATEGORIES.length, 25);
  assert.equal(new Set(K.CATEGORIES).size, 25);
  for (const c of K.CATEGORIES) {
    assert.ok(Array.isArray(K.CATEGORY_WORDS[c]) && K.CATEGORY_WORDS[c].length >= 15, `${c}: sözlük`);
    assert.ok(K.CATEGORY_EMOJI[c], `${c}: simge`);
  }
  assert.deepEqual(Object.keys(K.CATEGORY_WORDS).sort(), [...K.CATEGORIES].sort());
});

test('kategori sözlüklerindeki her giriş geçerli biçimde ve normalleştirilmiş tekrarı yok', () => {
  for (const [c, liste] of Object.entries(K.CATEGORY_WORDS)) {
    const goruldu = new Set();
    for (const w of liste) {
      assert.ok(K.kelimeBicimiGecerli(w), `${c}: "${w}" biçimi`);
      const n = K.normalizeWord(w);
      assert.ok(!goruldu.has(n), `${c}: "${w}" iki kez`);
      goruldu.add(n);
    }
  }
});

test('yerel ön denetim: listedeyse kabul, başka kategorinin listesindeyse REDDETMEZ (K-07)', () => {
  assert.equal(K.localCategoryPreCheck('Sabah Kahvaltısının Vazgeçilmezleri', 'Simit'), true);
  // "ekmek" yalnız Piknik ve Hobi listelerinde; v4.11 kahvaltıda reddediyordu
  assert.equal(K.localCategoryPreCheck('Sabah Kahvaltısının Vazgeçilmezleri', 'ekmek'), null);
  assert.equal(K.localCategoryPreCheck('Sabah Kahvaltısının Vazgeçilmezleri', 'uzay mekiği'), null);
  assert.equal(K.localCategoryPreCheck(null, 'simit'), null);
  assert.equal(K.isInCategory('Bilinmeyen', 'simit'), false);
  assert.equal(K.isWordInLocalDict('TEODOLİT'), true);
});

test('kelime biçimi: 2–30 harf, Türkçe harf, boşluk ve tire', () => {
  assert.equal(K.kelimeBicimiGecerli('çiğ köfte'), true);
  assert.equal(K.kelimeBicimiGecerli('a'), false);
  assert.equal(K.kelimeBicimiGecerli('x'.repeat(31)), false);
  assert.equal(K.kelimeBicimiGecerli('<script>'), false);
  assert.equal(K.kelimeBicimiGecerli('elma1'), false);
  assert.equal(K.kelimeBicimiGecerli('- -'), false, '1.0.1: harfsiz girdi');
  assert.equal(K.kelimeBicimiGecerli('a -'), false);
});

test('kullanıcı adı: 3–14 küçük harf ya da rakam', () => {
  for (const a of ['abc', 'korfe07', 'a1234567890123']) assert.equal(K.kullaniciAdiGecerli(a), true, a);
  for (const a of ['ab', 'Korfe', 'çiçek', 'a12345678901234', 'a b', '']) assert.equal(K.kullaniciAdiGecerli(a), false, a);
});

test('maç bitti mi: Tenis 3 roundda 2, Hızlı 10 round, Zincir 1 round', () => {
  assert.equal(K.isMatchOver({ mode: 'duel', totalRounds: 3, p1Wins: 2, completedRounds: [1, 2] }), true);
  assert.equal(K.isMatchOver({ mode: 'duel', totalRounds: 3, p1Wins: 1, p2Wins: 1, completedRounds: [1, 2] }), false);
  assert.equal(K.isMatchOver({ mode: 'sim', totalRounds: 10, p1Wins: 6, completedRounds: new Array(9) }), false);
  assert.equal(K.isMatchOver({ mode: 'sim', totalRounds: 10, completedRounds: new Array(10) }), true);
  assert.equal(K.isMatchOver({ mode: 'chain', totalRounds: 1, completedRounds: [1] }), true);
  assert.equal(K.isMatchOver(null), false);
});
