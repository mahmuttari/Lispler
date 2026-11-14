// Let's Picky mağaza dosyalarının Play kurallarına uyduğunu denetler (node --test letspicky/test/*.test.mjs).
// play-letspicky.yml her Play komutundan önce çalıştırır: bozuk metin ya da eksik görsel Play'e gitmeden yakalanır.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

process.env.PLAY_UYGULAMA = 'letspicky';
const LP = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAGAZA = path.join(LP, 'magaza');
const play = await import('../../android/play.mjs');

/** PNG başlığı → genişlik, yükseklik, renk türü (2 RGB, 6 RGBA) */
function png(dosya) {
  const b = fs.readFileSync(dosya);
  assert.equal(b.subarray(1, 4).toString(), 'PNG', `${dosya} PNG değil`);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), renk: b[25] };
}

test('paket adı play.mjs, build.gradle ve capacitor.config.json ile aynı; sürüm 1.0.0 (1)', () => {
  assert.equal(play.PAKET, 'com.mahmuttari.letspicky');
  assert.equal(play.UYGULAMALAR.letspicky.aab, 'dist/LetsPicky-play.aab');
  const g = fs.readFileSync(path.join(LP, 'android', 'app', 'build.gradle'), 'utf8');
  assert.match(g, /applicationId "com\.mahmuttari\.letspicky"/);
  assert.match(g, /namespace = "com\.mahmuttari\.letspicky"/);
  assert.deepEqual(play.surumBilgisi(g), { versionCode: 1, versionName: '1.0.0' });
  assert.equal(JSON.parse(fs.readFileSync(path.join(LP, 'capacitor.config.json'), 'utf8')).appId, 'com.mahmuttari.letspicky');
});

test('mağaza metinleri iki dilde Play sınırlarında; sürüm notları 500 karakteri aşmıyor', () => {
  const m = play.magazaMetinleri(fs.readFileSync(path.join(MAGAZA, 'aciklamalar.md'), 'utf8'), play.dilDosyalari(MAGAZA));
  assert.deepEqual(Object.keys(m.listings).sort(), ['en-US', 'tr-TR']);
  assert.equal(m.details.contactWebsite, 'https://letspicky.com/');
  for (const [dil, l] of Object.entries(m.listings)) assert.match(l.title, /^Let's Picky/, dil);
  play.surumNotlari(fs.readFileSync(path.join(MAGAZA, 'surum-notu.txt'), 'utf8'), play.dilDosyalari(MAGAZA));
});

test('Play görselleri: 512 simge, saydamlıksız 1024×500 öne çıkan görsel, iki dilde 5 telefon görüntüsü', () => {
  for (const dil of ['tr-TR', 'en-US']) {
    const g = play.gorseller(dil);
    assert.deepEqual(png(g.icon[0]), { w: 512, h: 512, renk: 2 }, dil);
    assert.deepEqual(png(g.featureGraphic[0]), { w: 1024, h: 500, renk: 2 }, dil);
    assert.equal(g.phoneScreenshots.length, 5, dil);
  }
});
