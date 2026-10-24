// İz Haritası mağaza dosyalarının Play kurallarına uyduğunu denetler (node --test iz-haritasi/test/*.test.mjs).
// play-iz.yml her Play komutundan önce çalıştırır: bozuk metin, eksik görsel ya da tabloyla ayrışmış Veri güvenliği
// CSV'si Play'e gitmeden yakalanır.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

process.env.PLAY_UYGULAMA = 'iz';
const IZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAGAZA = path.join(IZ, 'magaza');
const play = await import('../../android/play.mjs');
const vg = await import('../araclar/veri-guvenligi.mjs');

/** PNG başlığı → genişlik, yükseklik, renk türü (2 RGB, 6 RGBA) */
function png(dosya) {
  const b = fs.readFileSync(dosya);
  assert.equal(b.subarray(1, 4).toString(), 'PNG', `${dosya} PNG değil`);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), bit: b[24], renk: b[25], boyut: b.length };
}

test('paket adı play.mjs ve build.gradle ile aynı', () => {
  assert.equal(play.PAKET, 'com.poyrazworkshop.izharitasi');
  const g = fs.readFileSync(path.join(IZ, 'android', 'app', 'build.gradle'), 'utf8');
  assert.match(g, /applicationId 'com\.poyrazworkshop\.izharitasi'/);
  const s = play.surumBilgisi(g);
  assert.ok(Number.isInteger(s.versionCode) && s.versionCode >= 1);
  assert.match(s.versionName, /^\d+\.\d+\.\d+$/);
});

test('mağaza metni Play sınırlarında, marka notu ve reklam açıklaması var', () => {
  const m = play.magazaMetinleri(fs.readFileSync(path.join(MAGAZA, 'aciklamalar.md'), 'utf8'), play.dilDosyalari(MAGAZA));
  assert.deepEqual(Object.keys(m.listings), ['tr-TR']);
  const l = m.listings['tr-TR'];
  assert.equal(l.title, 'İz Haritası – AirTag için');
  assert.ok(l.title.length <= 30 && l.shortDescription.length <= 80 && l.fullDescription.length <= 4000);
  assert.match(l.fullDescription, /Apple Inc\.'in ticari markalarıdır/);
  assert.match(l.fullDescription, /3 dakikada bir/);
  assert.equal(m.details.contactEmail, 'mahmuttari@gmail.com');
  assert.equal(m.details.contactWebsite, 'https://mahmuttari.github.io/Lispler/iz-haritasi/');
  const not = play.surumNotlari(fs.readFileSync(path.join(MAGAZA, 'surum-notu.txt'), 'utf8'), play.dilDosyalari(MAGAZA));
  assert.ok(not[0].text.length > 0 && not[0].text.length <= 500);
});

test('gizlilik sayfası ve tanıtım sayfası var, mağaza adresiyle eşleşiyor', () => {
  const g = fs.readFileSync(path.join(IZ, '..', 'app', 'iz-haritasi', 'gizlilik.html'), 'utf8');
  assert.match(g, /AdMob/);
  assert.match(g, /Gizlilik Politikası/);
  assert.ok(fs.existsSync(path.join(IZ, '..', 'app', 'iz-haritasi', 'index.html')));
});

test('Veri güvenliği CSV\'si tabloyla aynı ve beklenen beyanı taşıyor', () => {
  const csv = fs.readFileSync(path.join(MAGAZA, 'veri-guvenligi.csv'), 'utf8');
  const sablon = fs.readFileSync(path.join(IZ, '..', 'hayalet-avcilari', 'magaza', 'veri-guvenligi.csv'), 'utf8');
  assert.equal(csv, vg.csvYaz(vg.uret(sablon)), 'CSV elle değişmiş: node iz-haritasi/araclar/veri-guvenligi.mjs');
  const o = play.veriGuvenligiOzeti(csv);
  assert.deepEqual(Object.keys(o.turler).sort(), Object.keys(vg.TURLER).sort());
  assert.equal(o.genel.PSL_DATA_COLLECTION_ENCRYPTED_IN_TRANSIT, 'TRUE');
  assert.equal(o.genel.PSL_DATA_COLLECTION_USER_REQUEST_DELETE, 'FALSE');
  assert.ok(!Object.keys(o.genel).some((k) => /ACCOUNT|ACM/.test(k)), 'hesap bölümü yazılmamalı');
  for (const [tur, t] of Object.entries(o.turler)) {
    assert.ok(t.toplanan && t.paylasilan, `${tur}: toplanıyor ve paylaşılıyor`);
    assert.equal(t.gecici, false, `${tur}: geçici değil`);
    assert.equal(t.istege, false, `${tur}: zorunlu`);
    assert.deepEqual(t.amac, t.paylasimAmaci, `${tur}: paylaşım amacı = toplama amacı`);
  }
  assert.deepEqual(o.turler.PSL_PRECISE_LOCATION.amac, ['APP_FUNCTIONALITY']);
  assert.ok(o.turler.PSL_DEVICE_ID.amac.includes('ADVERTISING'));
});

test('görseller Play ölçülerinde: simge 512 RGBA, tanıtım 1024×500 saydamsız, 4-8 dikey ekran 1080×1920', () => {
  const g = play.gorseller('tr-TR');
  const [simge] = g.icon;
  const s = png(simge);
  assert.deepEqual([s.w, s.h, s.renk], [512, 512, 6], 'simge 512×512 32 bit (RGBA) olmalı');
  assert.ok(s.boyut <= 1024 * 1024);
  const t = png(g.featureGraphic[0]);
  assert.deepEqual([t.w, t.h], [1024, 500]);
  assert.ok(t.renk === 2, 'tanıtım görseli saydamlıksız (24 bit) olmalı');
  assert.ok(g.phoneScreenshots.length >= 4 && g.phoneScreenshots.length <= 8, `${g.phoneScreenshots.length} ekran`);
  for (const f of g.phoneScreenshots) {
    const e = png(f);
    assert.deepEqual([e.w, e.h, e.renk], [1080, 1920, 2], path.basename(f));
    assert.ok(e.boyut <= 8 * 1024 * 1024);
  }
});

test('AdMob kimlikleri ya Google test kimliği ya da mahmuttari@gmail.com hesabının (pub-2417242373034448)', () => {
  const p = fs.readFileSync(path.join(IZ, 'android', 'gradle.properties'), 'utf8');
  const al = (ad) => new RegExp(`^${ad}=(.+)$`, 'm').exec(p)?.[1];
  const [app, banner, gecis] = ['ADMOB_APP_ID', 'ADMOB_BANNER_ID', 'ADMOB_INTERSTITIAL_ID'].map(al);
  const yayinci = /^ca-app-pub-(\d+)[~/]\d+$/;
  for (const k of [app, banner, gecis]) assert.match(k || '', yayinci);
  const no = new Set([app, banner, gecis].map((k) => yayinci.exec(k)[1]));
  assert.equal(no.size, 1, 'üç kimlik aynı yayıncıdan olmalı');
  assert.ok(['3940256099942544', '2417242373034448'].includes([...no][0]), `beklenmeyen yayıncı ${[...no][0]}`);
  assert.match(app, /~/);
  assert.match(banner, /\//);
  assert.match(gecis, /\//);
});
