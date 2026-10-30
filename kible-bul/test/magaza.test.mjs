// Kıble Bul mağaza dosyalarının Play kurallarına uyduğunu denetler (node --test kible-bul/test/*.test.mjs).
// play-kiblebul.yml her Play komutundan önce çalıştırır: bozuk metin, eksik görsel ya da tabloyla ayrışmış Veri güvenliği
// CSV'si Play'e gitmeden yakalanır.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

process.env.PLAY_UYGULAMA = 'kiblebul';
const KB = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAGAZA = path.join(KB, 'magaza');
const play = await import('../../android/play.mjs');
const vg = await import('../araclar/veri-guvenligi.mjs');
const DILLER = ['tr-TR', 'ar', 'de-DE', 'en-US', 'es-ES', 'fr-FR', 'it-IT', 'ja-JP', 'ko-KR', 'pt-BR', 'ru-RU'];

/** PNG başlığı → genişlik, yükseklik, renk türü (2 RGB, 6 RGBA) */
function png(dosya) {
  const b = fs.readFileSync(dosya);
  assert.equal(b.subarray(1, 4).toString(), 'PNG', `${dosya} PNG değil`);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), renk: b[25], boyut: b.length };
}

test('paket adı play.mjs, build.gradle ve capacitor.config.json ile aynı; sürüm 1.1.0 (1)', () => {
  assert.equal(play.PAKET, 'com.poyrazworkshop.kiblebul');
  assert.equal(play.UYGULAMALAR.kiblebul.magaza, 'kible-bul/magaza');
  const g = fs.readFileSync(path.join(KB, 'android', 'app', 'build.gradle'), 'utf8');
  assert.match(g, /applicationId "com\.poyrazworkshop\.kiblebul"/);
  assert.deepEqual(play.surumBilgisi(g), { versionCode: 1, versionName: '1.1.0' });
  assert.equal(JSON.parse(fs.readFileSync(path.join(KB, 'capacitor.config.json'), 'utf8')).appId, 'com.poyrazworkshop.kiblebul');
  assert.equal(JSON.parse(fs.readFileSync(path.join(KB, 'package.json'), 'utf8')).version, '1.1.0');
  const v = fs.readFileSync(path.join(KB, 'android', 'variables.gradle'), 'utf8');
  for (const [k, d] of [['compileSdkVersion', 36], ['targetSdkVersion', 36], ['minSdkVersion', 24]]) assert.match(v, new RegExp(`${k} = ${d}\\b`));
});

test('mağaza metni 11 dilde Play sınırlarında; reklam kuralları, abonelik ve doğruluk sınırı yazılı; fiyat ve abartı yok', () => {
  const m = play.magazaMetinleri(fs.readFileSync(path.join(MAGAZA, 'aciklamalar.md'), 'utf8'), play.dilDosyalari(MAGAZA));
  assert.deepEqual(Object.keys(m.listings).sort(), [...DILLER].sort());
  assert.equal(m.listings['tr-TR'].title, 'Kıble Bul – Kıble Pusulası');
  for (const [dil, l] of Object.entries(m.listings)) {
    assert.ok(l.title.length <= 30 && l.shortDescription.length <= 80 && l.fullDescription.length <= 4000, dil);
    assert.doesNotMatch(l.title, /\p{Extended_Pictographic}/u, `${dil}: adda emoji`);
    // büyük/küçük harfi olan yazılarda başlık BÜYÜK HARF olmamalı (Arapça, Japonca, Korecede harf büyüklüğü yok)
    assert.ok(l.title !== l.title.toUpperCase() || l.title === l.title.toLowerCase(), `${dil}: büyük harf`);
    assert.doesNotMatch(l.title, /best|free|ücretsiz|en iyi|gratis|kostenlos|gratuit|бесплат|無料|무료|مجان/i, `${dil}: adda "en iyi/ücretsiz"`);
    for (const metin of [l.title, l.shortDescription, l.fullDescription]) {
      assert.doesNotMatch(metin, /[$€£₺]\s?\d|\d\s?[$€£₺]|\d+[.,]\d\d\s?(USD|TL|EUR)/, `${dil}: fiyat`);
      assert.doesNotMatch(metin, /AdMob|NASA|GeoTerva|Muslim Pro|Diyanet|Google Maps|Haritalar/i, `${dil}: başka marka`);
      assert.doesNotMatch(metin, /100\s?%|%\s?100|★|⭐|milyon|million/i, `${dil}: abartı ya da uydurma sayı`);
    }
    assert.match(l.fullDescription, /\b4\b/, `${dil}: geçiş reklamı sıklığı (4 dakika)`);
    assert.match(l.fullDescription, /Google Play/, `${dil}: abonelik iptali`);
  }
  assert.equal(m.details.contactEmail, 'mahmuttari@gmail.com');
  assert.equal(m.details.contactWebsite, 'https://mahmuttari.github.io/Lispler/kible-bul/');
  const notlar = play.surumNotlari(fs.readFileSync(path.join(MAGAZA, 'surum-notu.txt'), 'utf8'), play.dilDosyalari(MAGAZA));
  assert.deepEqual(notlar.map((n) => n.language).sort(), [...DILLER].sort());
  for (const n of notlar) assert.ok(n.text.length > 0 && n.text.length <= 500, n.language);
});

test('gizlilik ve tanıtım sayfası var; gizlilik sayfası yaklaşık konumu, NASA karolarını, AdMob/UMP\'yi ve Play aboneliğini anlatır', () => {
  const app = path.join(KB, '..', 'app', 'kible-bul');
  const g = fs.readFileSync(path.join(app, 'gizlilik.html'), 'utf8');
  for (const s of ['Gizlilik Politikası', 'ACCESS_COARSE_LOCATION', 'gibs.earthdata.nasa.gov', 'AdMob', 'Reklam gizlilik seçenekleri',
    'Google Play', 'Privacy Policy (English)', 'approximate location', 'mahmuttari@gmail.com', 'Poyraz Workshop']) assert.ok(g.includes(s), s);
  assert.doesNotMatch(g, /tam konum izni ister|ACCESS_FINE_LOCATION/);
  assert.ok(fs.existsSync(path.join(app, 'index.html')));
  const i = png(path.join(app, 'icon-192.png'));
  assert.deepEqual([i.w, i.h], [192, 192]);
  const md = fs.readFileSync(path.join(MAGAZA, 'aciklamalar.md'), 'utf8');
  assert.match(md, /Gizlilik politikası:\*\* https:\/\/mahmuttari\.github\.io\/Lispler\/kible-bul\/gizlilik\.html/);
});

test('Veri güvenliği CSV\'si tabloyla aynı: yaklaşık konum (hassas değil), etkileşim, teşhis, cihaz kimliği; hesap yazılmaz', () => {
  const csv = fs.readFileSync(path.join(MAGAZA, 'veri-guvenligi.csv'), 'utf8');
  const sablon = fs.readFileSync(path.join(KB, '..', 'hayalet-avcilari', 'magaza', 'veri-guvenligi.csv'), 'utf8');
  assert.equal(csv, vg.csvYaz(vg.uret(sablon)), 'CSV elle değişmiş: node kible-bul/araclar/veri-guvenligi.mjs');
  const o = play.veriGuvenligiOzeti(csv);
  assert.deepEqual(Object.keys(o.turler).sort(), ['PSL_APPROX_LOCATION', 'PSL_DEVICE_ID', 'PSL_PERFORMANCE_DIAGNOSTICS', 'PSL_USER_INTERACTION']);
  assert.ok(!('PSL_PRECISE_LOCATION' in o.turler), 'yalnız yaklaşık konum');
  assert.equal(o.genel.PSL_DATA_COLLECTION_ENCRYPTED_IN_TRANSIT, 'TRUE');
  assert.equal(o.genel.PSL_DATA_COLLECTION_USER_REQUEST_DELETE, 'FALSE');
  assert.equal(o.genel['PSL_SUPPORTED_ACCOUNT_CREATION_METHODS/PSL_ACM_NONE'], 'TRUE', 'hesap oluşturulamaz (Play zorunlu tutar)');
  assert.ok(!Object.keys(o.genel).some((k) => /DELETION_URL|ACM_(?!NONE)/.test(k)), 'silme adresi ya da başka hesap yolu yazılmamalı');
  for (const [tur, t] of Object.entries(o.turler)) {
    assert.ok(t.toplanan && t.paylasilan, `${tur}: toplanıyor ve paylaşılıyor`);
    assert.equal(t.gecici, false, `${tur}: geçici değil`);
    assert.equal(t.istege, false, `${tur}: zorunlu`);
    assert.deepEqual(t.amac, t.paylasimAmaci, `${tur}: paylaşım amacı = toplama amacı`);
    assert.ok(t.amac.includes('ADVERTISING'), `${tur}: AdMob`);
  }
  assert.ok(o.turler.PSL_APPROX_LOCATION.amac.includes('APP_FUNCTIONALITY'), 'NASA karoları: uygulama işlevi');
});

test('görseller Play ölçülerinde, 11 dilde: simge 512 RGBA, tanıtım 1024×500 saydamsız, 4-8 dikey ekran 1080×1920', () => {
  const [simge] = play.gorseller('tr-TR').icon;
  const s = png(simge);
  assert.deepEqual([s.w, s.h, s.renk], [512, 512, 6], 'simge 512×512 32 bit (RGBA) olmalı');
  assert.ok(s.boyut <= 1024 * 1024);
  for (const dil of DILLER) {
    const g = play.gorseller(dil);
    assert.ok(g, `${dil}: görsel klasörü yok`);
    const t = png(g.featureGraphic[0]);
    assert.deepEqual([t.w, t.h, t.renk], [1024, 500, 2], `${dil}: tanıtım görseli`);
    assert.ok(g.phoneScreenshots.length >= 4 && g.phoneScreenshots.length <= 8, `${dil}: ${g.phoneScreenshots.length} ekran`);
    for (const f of g.phoneScreenshots) {
      const e = png(f);
      assert.deepEqual([e.w, e.h, e.renk], [1080, 1920, 2], `${dil}/${path.basename(f)}`);
      assert.ok(e.boyut <= 8 * 1024 * 1024);
    }
  }
});

test('ekler: KAYNAK.txt özgün APK\'yı, play-istek.txt yalnız bilinen komutları içerir, fiyatlandırma ürün ve planları adlandırır', () => {
  const k = fs.readFileSync(path.join(KB, 'KAYNAK.txt'), 'utf8');
  assert.match(k, /apk-sha256: d411eb52129bcfb235d3db31b1b0a297632e29f153e7a8f2031d8edf1e8ef6ac/);
  assert.match(k, /drive-dosya-kimligi: 1KgBxebvUkKqAGoLYGh7pFkUMDRBKzeQ4/);
  const istek = fs.readFileSync(path.join(KB, 'play-istek.txt'), 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  for (const k of istek) assert.match(k, /^(durum|magaza|gorsel|veriguvenligi|yukle)( [a-z]+)*$/, `geçersiz komut: ${k}`);
  const f = fs.readFileSync(path.join(MAGAZA, 'fiyatlandirma.md'), 'utf8');
  for (const s of ['`adfree`', '`monthly`', '`yearly`', '0,99 USD', '9,99 USD', 'sku=adfree&package=com.poyrazworkshop.kiblebul']) assert.ok(f.includes(s), s);
  const p = fs.readFileSync(path.join(MAGAZA, 'PLAY-YAYIN.md'), 'utf8');
  for (const s of ['Kumar ve Bahis', 'Alkol', 'Flört', 'Maksimum reklam içerik derecesi: G', '`adfree`']) assert.ok(p.includes(s), s);
});
