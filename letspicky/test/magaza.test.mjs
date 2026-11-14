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
const vg = await import('../araclar/veri-guvenligi.mjs');

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

test('Veri güvenliği CSV\'si tabloyla aynı: uygulamanın kendi verisi paylaşılmaz, AdMob verisi paylaşılır', () => {
  const csv = fs.readFileSync(path.join(MAGAZA, 'veri-guvenligi.csv'), 'utf8');
  const sablon = fs.readFileSync(path.join(LP, '..', 'hayalet-avcilari', 'magaza', 'veri-guvenligi.csv'), 'utf8');
  assert.equal(csv, vg.csvYaz(vg.uret(sablon)), 'CSV elle değişmiş: node letspicky/araclar/veri-guvenligi.mjs');
  const o = play.veriGuvenligiOzeti(csv);
  assert.deepEqual(Object.keys(o.turler).sort(), Object.keys(vg.TURLER).sort());
  for (const yok of ['PSL_PRECISE_LOCATION', 'PSL_EMAIL', 'PSL_PHOTOS', 'PSL_AUDIO', 'PSL_CONTACTS', 'PSL_PURCHASE_HISTORY']) {
    assert.ok(!(yok in o.turler), yok);
  }
  assert.equal(o.genel.PSL_DATA_COLLECTION_ENCRYPTED_IN_TRANSIT, 'TRUE');
  assert.equal(o.genel.PSL_DATA_COLLECTION_USER_REQUEST_DELETE, 'TRUE', 'oda verisi 24 saatte silinir, e-postayla da istenir');
  assert.equal(o.genel['PSL_SUPPORTED_ACCOUNT_CREATION_METHODS/PSL_ACM_NONE'], 'TRUE', 'hesap oluşturulamaz (Play zorunlu tutar)');
  for (const [tur, t] of Object.entries(o.turler)) {
    assert.equal(t.toplanan, true, tur);
    assert.equal(t.gecici, false, tur);
  }
  // Takma ad ve "Kendin Yaz" seçenekleri yalnız Firebase'de (hizmet sağlayıcı): paylaşım değildir
  for (const tur of ['PSL_NAME', 'PSL_USER_GENERATED_CONTENT']) assert.ok(!o.turler[tur].paylasilan, tur);
  assert.equal(o.turler.PSL_USER_GENERATED_CONTENT.istege, true);
  // AdMob'un türleri paylaşılır: reklam, analiz, dolandırıcılığı önleme
  for (const tur of ['PSL_APPROX_LOCATION', 'PSL_DEVICE_ID', 'PSL_USER_INTERACTION', 'PSL_PERFORMANCE_DIAGNOSTICS']) {
    assert.ok(o.turler[tur].paylasilan, tur);
    assert.deepEqual([...o.turler[tur].paylasimAmaci].sort(), ['ADVERTISING', 'ANALYTICS', 'FRAUD_PREVENTION_SECURITY'], tur);
  }
});
