// Argo filtresi (sohbet ve rumuz): gündelik Türkçe engellenmez, küfür engellenir (DENETIM.md › T-21).
// Filtre fonksiyonları derlenmiş paketten çıkarılıp ayrı bir modülde çalıştırılır.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const paket = readFileSync(new URL('../www/assets/index-BLMBGPAE.js', import.meta.url), 'utf8');
const bas = paket.indexOf('  my =\n');
const son = paket.indexOf('var xy = 1440');
assert.ok(bas > 0 && son > bas, 'argo filtresi pakette bulunamadı');
const kod =
  'var ' +
  paket
    .slice(bas + 2, son)
    .replace('),\n  hy =', '); var hy =')
    .replace('),\n  gy =', '); var gy =')
    .replace(',\n  _y =', '; var _y =')
    .replace(',\n  vy =', '; var vy =');
const by = new Function(`${kod}; return by;`)();

const GUNDELIK = [
  'sık sık atıyorsun', 'tahta dolu', 'hocam iyi oyun', 'kocaman zar', 'tamam kardeş', 'sokak', 'sıkıştım',
  'pulu götürmek lazım', 'çok güzel oynadın', 'doluya koydum', 'ananas', 'şans seninle', 'Kahveci', 'Sokrates',
  'Pala Dayı', 'iyi oyunlar', 'geçmiş olsun', 'kolay gelsin',
];
const KUFUR = [
  'amk', 'aq ya', 'siktir git', 's i k t i r', 'orospu', 'orospular', 'pezevenk', 'sik', 'SİKTİR', 's1kt1r',
  'kahpe', 'ibne', 'AslanSiktir', 'oc', 'mk', 'yarrak', 'ananı sikeyim',
];

test('gündelik Türkçe sözler engellenmez (eskiden "sık sık", "tahta dolu", "hocam" uyarı alıyordu)', () => {
  for (const m of GUNDELIK) assert.equal(by(m), false, m);
});

test('küfür, ekli, rakamlı ve boşlukla bölünmüş hâlleriyle engellenir', () => {
  for (const m of KUFUR) assert.equal(by(m), true, m);
});
