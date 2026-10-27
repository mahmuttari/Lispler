// Smart Measure mağaza dosyalarının Play kurallarına uyduğunu denetler (node --test smart-measure/test/*.test.mjs).
// play-smartmeasure.yml her Play komutundan önce çalıştırır: bozuk metin, eksik görsel ya da tabloyla ayrışmış Veri
// güvenliği CSV'si Play'e gitmeden yakalanır.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

process.env.PLAY_UYGULAMA = 'smartmeasure';
const SM = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAGAZA = path.join(SM, 'magaza');
const play = await import('../../android/play.mjs');
const vg = await import('../araclar/veri-guvenligi.mjs');

/** PNG başlığı → genişlik, yükseklik, renk türü (2 RGB, 6 RGBA) */
function png(dosya) {
  const b = fs.readFileSync(dosya);
  assert.equal(b.subarray(1, 4).toString(), 'PNG', `${dosya} PNG değil`);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), renk: b[25], boyut: b.length };
}

test('paket adı ve sürüm: play.mjs, build.gradle, capacitor.config.json, package.json aynı', () => {
  assert.equal(play.PAKET, 'com.poyrazworkshop.smartmeasure');
  const g = fs.readFileSync(path.join(SM, 'android', 'app', 'build.gradle'), 'utf8');
  assert.match(g, /applicationId "com\.poyrazworkshop\.smartmeasure"/);
  assert.deepEqual(play.surumBilgisi(g), { versionCode: 1, versionName: '1.0.0' });
  assert.equal(JSON.parse(fs.readFileSync(path.join(SM, 'capacitor.config.json'), 'utf8')).appId, play.PAKET);
  assert.equal(JSON.parse(fs.readFileSync(path.join(SM, 'package.json'), 'utf8')).version, '1.0.0');
  const v = fs.readFileSync(path.join(SM, 'android', 'variables.gradle'), 'utf8');
  assert.match(v, /minSdkVersion = 24/); assert.match(v, /compileSdkVersion = 36/); assert.match(v, /targetSdkVersion = 36/);
});

test('mağaza metinleri Play sınırlarında; tr-TR ve en-US; ad kuralları; reklam ve doğruluk açıkça yazılı', () => {
  const m = play.magazaMetinleri(fs.readFileSync(path.join(MAGAZA, 'aciklamalar.md'), 'utf8'), play.dilDosyalari(MAGAZA));
  assert.deepEqual(Object.keys(m.listings), ['tr-TR', 'en-US']);
  assert.equal(m.details.contactEmail, 'mahmuttari@gmail.com');
  assert.equal(m.details.contactWebsite, 'https://mahmuttari.github.io/Lispler/smart-measure/');
  for (const [dil, l] of Object.entries(m.listings)) {
    assert.ok(l.title.length <= 30 && l.shortDescription.length <= 80 && l.fullDescription.length <= 4000, dil);
    assert.ok(!/\p{Extended_Pictographic}/u.test(l.title), `${dil}: adda emoji`);
    assert.ok(!/\b\p{Lu}{3,}\b/u.test(l.title), `${dil}: adda büyük harfli sözcük`);
    assert.ok(!/\b(best|free|top|#1|en iyi|ücretsiz|bedava)\b/iu.test(l.title), `${dil}: adda yasak sözcük`);
    const tum = `${l.shortDescription}\n${l.fullDescription}`;
    assert.ok(!/[$€₺£]\s?\d|\d\s?(TL|USD|EUR)\b/.test(tum), `${dil}: açıklamada fiyat`);
    assert.ok(!/\b(Apple|iPhone|Samsung|Huawei|Xiaomi|Bosch|Leica|ARCore|Google Measure)\b/.test(tum), `${dil}: başka marka adı`);
    assert.ok(!/\d[\d.,]*\s*(M|K|milyon|million)\+?\s*(indirme|download|kullanıcı|user)/i.test(tum), `${dil}: kullanıcı sayısı`);
    assert.ok(!/★|⭐|\b[45][.,]\d\s*(yıldız|stars?)\b/i.test(tum), `${dil}: puan`);
  }
  const tr = m.listings['tr-TR'].fullDescription, en = m.listings['en-US'].fullDescription;
  assert.match(tr, /reklam bandı/); assert.match(tr, /en sık 4 dakikada bir/); assert.match(tr, /reklamsız abonelik/);
  assert.match(tr, /laboratuvar aleti değildir/); assert.match(tr, /kaydedilmez/);
  assert.match(en, /banner/); assert.match(en, /at most once every 4 minutes/); assert.match(en, /ad-free subscription/);
  assert.match(en, /not laboratory instruments/); assert.match(en, /never recorded/);
  const notlar = play.surumNotlari(fs.readFileSync(path.join(MAGAZA, 'surum-notu.txt'), 'utf8'), play.dilDosyalari(MAGAZA));
  assert.deepEqual(notlar.map((n) => n.language), ['tr-TR', 'en-US']);
  for (const n of notlar) assert.ok(n.text.length > 0 && n.text.length <= 500);
});

test('gizlilik ve tanıtım sayfası: AdMob, UMP, Play Faturalandırma, kamera, mikrofon; adres mağazayla aynı', () => {
  const md = fs.readFileSync(path.join(MAGAZA, 'aciklamalar.md'), 'utf8');
  assert.match(md, /Gizlilik politikası:\*\* https:\/\/mahmuttari\.github\.io\/Lispler\/smart-measure\/gizlilik\.html/);
  const g = fs.readFileSync(path.join(SM, '..', 'app', 'smart-measure', 'gizlilik.html'), 'utf8');
  for (const s of ['Gizlilik Politikası', 'AdMob', 'Reklam gizlilik seçenekleri', 'Google Play Faturalandırma', 'Kamera:', 'Mikrofon:',
    'kaydedilmez', 'Tüm verileri sil', 'Privacy Policy (English)', 'mahmuttari@gmail.com', 'Poyraz Workshop']) assert.ok(g.includes(s), s);
  assert.ok(fs.existsSync(path.join(SM, '..', 'app', 'smart-measure', 'index.html')));
  const ic = png(path.join(SM, '..', 'app', 'smart-measure', 'icon-192.png'));
  assert.deepEqual([ic.w, ic.h], [192, 192]);
  // uygulama içindeki adres aynı
  const ayar = fs.readFileSync(path.join(SM, 'www', 'js', 'views', 'settings.js'), 'utf8');
  assert.match(ayar, /https:\/\/mahmuttari\.github\.io\/Lispler\/smart-measure\/gizlilik\.html/);
});

test('Veri güvenliği CSV\'si tabloyla aynı: yalnız AdMob\'un dört türü, ses ve görüntü yok', () => {
  const csv = fs.readFileSync(path.join(MAGAZA, 'veri-guvenligi.csv'), 'utf8');
  const sablon = fs.readFileSync(path.join(SM, '..', 'hayalet-avcilari', 'magaza', 'veri-guvenligi.csv'), 'utf8');
  assert.equal(csv, vg.csvYaz(vg.uret(sablon)), 'CSV elle değişmiş: node smart-measure/araclar/veri-guvenligi.mjs');
  const o = play.veriGuvenligiOzeti(csv);
  assert.deepEqual(Object.keys(o.turler).sort(), ['PSL_APPROX_LOCATION', 'PSL_DEVICE_ID', 'PSL_PERFORMANCE_DIAGNOSTICS', 'PSL_USER_INTERACTION']);
  for (const yok of ['PSL_AUDIO', 'PSL_PHOTOS', 'PSL_VIDEOS', 'PSL_PRECISE_LOCATION', 'PSL_PURCHASE_HISTORY']) assert.ok(!(yok in o.turler), yok);
  assert.equal(o.genel.PSL_DATA_COLLECTION_ENCRYPTED_IN_TRANSIT, 'TRUE');
  assert.equal(o.genel.PSL_DATA_COLLECTION_USER_REQUEST_DELETE, 'FALSE');
  assert.ok(!Object.keys(o.genel).some((k) => /ACCOUNT|ACM/.test(k)), 'hesap bölümü yazılmamalı');
  for (const [tur, t] of Object.entries(o.turler)) {
    assert.ok(t.toplanan && t.paylasilan, `${tur}: toplanıyor ve paylaşılıyor`);
    assert.equal(t.gecici, false); assert.equal(t.istege, false);
    assert.deepEqual([...t.amac].sort(), ['ADVERTISING', 'ANALYTICS', 'FRAUD_PREVENTION_SECURITY']);
    assert.deepEqual([...t.amac].sort(), [...t.paylasimAmaci].sort());
  }
});

test('görseller Play ölçülerinde: simge 512 RGBA, tanıtım 1024×500 saydamsız, iki dilde 4-8 dikey ekran 1080×1920', () => {
  for (const dil of ['tr-TR', 'en-US']) {
    const g = play.gorseller(dil);
    assert.ok(g, `${dil}: görsel klasörü yok`);
    const s = png(g.icon[0]);
    assert.deepEqual([s.w, s.h, s.renk], [512, 512, 6], 'simge 512×512 32 bit (RGBA)');
    assert.ok(s.boyut <= 1024 * 1024);
    const t = png(g.featureGraphic[0]);
    assert.deepEqual([t.w, t.h, t.renk], [1024, 500, 2], `${dil} tanıtım görseli 24 bit`);
    assert.ok(g.phoneScreenshots.length >= 4 && g.phoneScreenshots.length <= 8, `${dil}: ${g.phoneScreenshots.length} ekran`);
    for (const f of g.phoneScreenshots) {
      const e = png(f);
      assert.deepEqual([e.w, e.h, e.renk], [1080, 1920, 2], path.basename(f));
      assert.ok(e.boyut <= 8 * 1024 * 1024);
    }
  }
  assert.deepEqual(play.gorseller('tr-TR').phoneScreenshots.map((f) => path.basename(f)),
    play.gorseller('en-US').phoneScreenshots.map((f) => path.basename(f)));
});

test('manifest: izinler ve donanım beyanları; ön plan hizmeti yok', () => {
  const m = fs.readFileSync(path.join(SM, 'android', 'app', 'src', 'main', 'AndroidManifest.xml'), 'utf8');
  for (const p of ['INTERNET', 'CAMERA', 'RECORD_AUDIO', 'VIBRATE']) assert.match(m, new RegExp(`android\\.permission\\.${p}"`));
  assert.match(m, /FOREGROUND_SERVICE" tools:node="remove"/);
  assert.ok(!/ACCESS_(FINE|COARSE)_LOCATION|READ_EXTERNAL|WRITE_EXTERNAL|READ_MEDIA/.test(m));
  for (const f of ['camera', 'camera.flash', 'microphone', 'sensor.accelerometer', 'sensor.gyroscope', 'sensor.light']) {
    assert.match(m, new RegExp(`android\\.hardware\\.${f.replace('.', '\\.')}" android:required="false"`), f);
  }
  assert.match(m, /android:allowBackup="false"/);
  assert.match(m, /android:usesCleartextTraffic="false"/);
});
