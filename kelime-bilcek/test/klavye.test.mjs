// Kelime Bilcek — oyun klavyesinin tuş mantığı (www/klavye.js, 1.0.5). Tarayıcıdaki davranış: test/arayuz.test.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const K = require('../www/kelime.js');
const Y = require('../www/klavye.js');

test('düzen: Türkçe Q, 29 harf; q, w, x yok; sözlükteki bütün harfler klavyede var', () => {
  assert.equal(Y.KLAVYE_HARFLERI.size, 29);
  for (const h of 'qwx') assert.equal(Y.KLAVYE_HARFLERI.has(h), false);
  for (const h of 'abcçdefgğhıijklmnoöprsştuüvyz') assert.ok(Y.KLAVYE_HARFLERI.has(h), h);
  const sozlukHarfleri = new Set(Object.values(K.CATEGORY_WORDS).flat().map(K.normalizeWord).join('').replace(/[\s,&'’-]/g, ''));
  for (const h of sozlukHarfleri) assert.ok(Y.KLAVYE_HARFLERI.has(h), `sözlükte "${h}" var, klavyede yok`);
});

test('tuşlar: harf ekler, sil son harfi siler, boşluk başta ve art arda yazılmaz, 30 karakter sınırı', () => {
  let d = '';
  for (const t of ['d', 'i', 'ş', 'bosluk', 'bosluk', 'f']) d = Y.klavyeTusu(d, t);
  assert.equal(d, 'diş f');
  assert.equal(Y.klavyeTusu('', 'bosluk'), '');
  assert.equal(Y.klavyeTusu('çiğ', 'sil'), 'çi');
  assert.equal(Y.klavyeTusu('', 'sil'), '');
  assert.equal(Y.klavyeTusu('a'.repeat(30), 'b'), 'a'.repeat(30));
  assert.equal(Y.klavyeTusu('ab', 'q'), 'ab');
  assert.equal(Y.klavyeTusu('ab', '1'), 'ab');
});

test('fiziksel klavye: Türkçe büyük/küçük harf ve şapkalı harfler', () => {
  assert.equal(Y.klavyeHarfi('I'), 'ı');
  assert.equal(Y.klavyeHarfi('İ'), 'i');
  assert.equal(Y.klavyeHarfi('Ş'), 'ş');
  assert.equal(Y.klavyeHarfi('â'), 'a');
  assert.equal(Y.klavyeHarfi('x'), null);
  assert.equal(Y.klavyeHarfi('Enter'), null);
});

test('tireli sözlük kelimesi tiresiz de bulunur (klavyede tire yok)', () => {
  const kat = Object.keys(K.CATEGORY_WORDS).find((k) => K.CATEGORY_WORDS[k].some((w) => /e-posta/i.test(w)));
  assert.ok(kat);
  for (const w of ['e-posta', 'e posta', 'eposta']) assert.equal(K.isInCategory(kat, w), true, w);
});
