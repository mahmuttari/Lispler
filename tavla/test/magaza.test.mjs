// Mağaza dosyalarının Play kurallarına ve uygulamaya uygunluğu (bağımlılıksız): metin sınırları, görsel ölçüleri,
// gizlilik/hesap silme sayfaları, sürüm numaralarının tutarlılığı, yayın derlemesinde hata ayıklamanın ve reklam
// kimliği izninin kapalı olması.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const oku = (y) => readFileSync(new URL(`../${y}`, import.meta.url), 'utf8');
const md = oku('magaza/aciklamalar.md');
const bolum = (b) => (md.split(/^## /m).find((x) => x.startsWith(b)) || '').split('\n').slice(1).join('\n').trim();
const satir = (ad) => (md.match(new RegExp(`\\*\\*${ad}:\\*\\* (.+)`)) || [])[1]?.trim();
function pngOlcu(y) {
  const b = readFileSync(new URL(`../${y}`, import.meta.url));
  assert.equal(b.toString('latin1', 1, 4), 'PNG', `${y} PNG değil`);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}

test('mağaza metinleri Play sınırları içinde', () => {
  assert.ok(satir('Uygulama adı').length <= 30);
  const kisa = bolum('Kısa açıklama'), uzun = bolum('Uzun açıklama');
  assert.ok(kisa.length > 10 && kisa.length <= 80, `kısa açıklama ${kisa.length}`);
  assert.ok(uzun.length > 200 && uzun.length <= 4000, `uzun açıklama ${uzun.length}`);
  assert.ok(oku('magaza/surum-notu.txt').trim().length <= 500);
  assert.equal(satir('Destek e-postası'), 'poyrazworkshop7@gmail.com');
  assert.doesNotMatch(uzun, /garanti|en iyi|#1|bedava jeton/i);
});

test('görseller Play ölçülerinde', () => {
  assert.deepEqual(pngOlcu('magaza/play/simge-512.png'), [512, 512]);
  assert.deepEqual(pngOlcu('magaza/play/tanitim-gorseli-1024x500.png'), [1024, 500]);
  const tel = readdirSync(new URL('../magaza/play/', import.meta.url)).filter((f) => /^telefon-.*\.png$/.test(f));
  assert.ok(tel.length >= 2 && tel.length <= 8, `ekran görüntüsü sayısı ${tel.length}`);
  for (const f of tel) {
    const [w, h] = pngOlcu(`magaza/play/${f}`);
    assert.ok(Math.min(w, h) >= 320 && Math.max(w, h) <= 3840 && Math.max(w, h) / Math.min(w, h) <= 2, `${f} ${w}×${h}`);
  }
});

test('gizlilik ve hesap silme sayfaları var, adresler her yerde aynı', () => {
  const GIZ = 'https://mahmuttari.github.io/Lispler/tavla/gizlilik.html';
  const SIL = 'https://mahmuttari.github.io/Lispler/tavla/hesap-silme.html';
  assert.equal(satir('Gizlilik politikası'), GIZ);
  assert.equal(satir('Hesap silme adresi'), SIL);
  for (const s of ['gizlilik.html', 'hesap-silme.html', 'index.html']) assert.ok(existsSync(new URL(`../../app/tavla/${s}`, import.meta.url)), s);
  const js = oku('www/assets/index-BLMBGPAE.js');
  assert.ok(js.includes(GIZ) && js.includes(SIL), 'uygulamadaki adresler');
  assert.ok(oku('magaza/veri-guvenligi.csv').includes(SIL));
  const sil = readFileSync(new URL('../../app/tavla/hesap-silme.html', import.meta.url), 'utf8');
  assert.match(sil, /Poyraz Workshop/); assert.match(sil, /Tavla/); assert.match(sil, /poyrazworkshop7@gmail\.com/);
});

test('avatarlar uygulama içinde çizilir: dış avatar servisi ve insan figürlü stil yok (T-08)', () => {
  const js = oku('www/assets/index-BLMBGPAE.js');
  assert.doesNotMatch(js, /api\.dicebear\.com|`avataaars`|`lorelei`|`micah`|`bottts`/);
  assert.match(js, /data:image\/svg\+xml/);
  for (const ad of ['Pul', 'Zar', 'Kahve', 'Çay']) assert.ok(js.includes(`name: \`${ad}\``), ad);
});

test('sürüm numarası uygulamada, package.json\'da ve Gradle\'da aynı', () => {
  const vn = oku('android/app/build.gradle').match(/versionName '([^']+)'/)[1];
  assert.equal(JSON.parse(oku('package.json')).version, vn);
  assert.ok(oku('www/assets/index-BLMBGPAE.js').includes(`TV_SURUM = \`${vn}\``));
});

test('yayın derlemesi: paket adı, hata ayıklama kapalı, reklam kimliği bildirili, yatay ekran', () => {
  const cfg = JSON.parse(oku('capacitor.config.json'));
  assert.equal(cfg.appId, 'com.poyrazworkshop.tavla');
  assert.equal(cfg.android.webContentsDebuggingEnabled, false);
  assert.match(oku('android/app/build.gradle'), /applicationId "com\.poyrazworkshop\.tavla"/);
  const man = oku('android/app/src/main/AndroidManifest.xml');
  assert.match(man, /permission\.AD_ID" \/>/);
  assert.match(oku('magaza/aciklamalar.md'), /\*\*Reklam içerir\*\*/);
  assert.match(readFileSync(new URL('../../app/tavla/gizlilik.html', import.meta.url), 'utf8'), /AdMob/);
  assert.match(man, /screenOrientation="sensorLandscape"/);
  assert.doesNotMatch(man, /debuggable="true"/);
});
