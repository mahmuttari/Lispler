// Unitica mağaza dosyalarının Play kurallarına uyduğunu denetler (node --test unitica/test/*.test.mjs).
// play-unitica.yml her Play komutundan önce çalıştırır: bozuk metin, eksik görsel ya da tabloyla ayrışmış Veri güvenliği
// CSV'si Play'e gitmeden yakalanır.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

process.env.PLAY_UYGULAMA = 'unitica';
const UN = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAGAZA = path.join(UN, 'magaza');
const play = await import('../../android/play.mjs');
const vg = await import('../araclar/veri-guvenligi.mjs');

const DILLER = ['ar', 'de-DE', 'en-US', 'es-ES', 'fr-FR', 'it-IT', 'ja-JP', 'ko-KR', 'pt-BR', 'ru-RU'];

/** PNG başlığı → genişlik, yükseklik, renk türü (2 RGB, 6 RGBA) */
function png(dosya) {
  const b = fs.readFileSync(dosya);
  assert.equal(b.subarray(1, 4).toString(), 'PNG', `${dosya} PNG değil`);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), bit: b[24], renk: b[25], boyut: b.length };
}

test('paket adı play.mjs, build.gradle, capacitor.config.json ve config.js ile aynı; sürüm 1.4.0 (1)', async () => {
  assert.equal(play.PAKET, 'com.poyrazworkshop.unitica');
  assert.equal(play.UYGULAMALAR.unitica.aab, 'dist/Unitica-play.aab');
  const g = fs.readFileSync(path.join(UN, 'android', 'app', 'build.gradle'), 'utf8');
  assert.match(g, /applicationId "com\.poyrazworkshop\.unitica"/);
  assert.match(g, /namespace = "com\.poyrazworkshop\.unitica"/);
  assert.deepEqual(play.surumBilgisi(g), { versionCode: 1, versionName: '1.4.0' });
  assert.equal(JSON.parse(fs.readFileSync(path.join(UN, 'capacitor.config.json'), 'utf8')).appId, 'com.poyrazworkshop.unitica');
  assert.equal((await import('../www/js/config.js')).PACKAGE, 'com.poyrazworkshop.unitica');
  const v = fs.readFileSync(path.join(UN, 'android', 'variables.gradle'), 'utf8');
  for (const [ad, deger] of [['minSdkVersion', '24'], ['compileSdkVersion', '36'], ['targetSdkVersion', '36']]) {
    assert.match(v, new RegExp(`${ad} = ${deger}\\b`));
  }
});

test('mağaza metinleri 11 dilde Play sınırlarında; başlıkta emoji / "free" / "best" yok, açıklamada fiyat yok', () => {
  const ceviri = play.dilDosyalari(MAGAZA);
  assert.deepEqual(Object.keys(ceviri), DILLER);
  const m = play.magazaMetinleri(fs.readFileSync(path.join(MAGAZA, 'aciklamalar.md'), 'utf8'), ceviri);
  assert.equal(Object.keys(m.listings).length, 11);
  assert.equal(m.details.contactEmail, 'mahmuttari@gmail.com');
  assert.equal(m.details.contactWebsite, 'https://mahmuttari.github.io/Lispler/unitica/');
  for (const [dil, l] of Object.entries(m.listings)) {
    assert.ok(l.title.length <= 30 && l.shortDescription.length <= 80 && l.fullDescription.length <= 4000, dil);
    assert.match(l.title, /^Unitica[ :–]/, `${dil}: başlık "Unitica" ile başlar`);
    assert.doesNotMatch(l.title, /\p{Extended_Pictographic}/u, `${dil}: başlıkta emoji`);
    assert.doesNotMatch(l.title, /free|best|ücretsiz|en iyi|gratis|kostenlos|gratuit/i, `${dil}: başlıkta "ücretsiz/en iyi"`);
    assert.notEqual(l.title, l.title.toUpperCase(), `${dil}: başlık büyük harf`);
    const tum = `${l.title}\n${l.shortDescription}\n${l.fullDescription}`;
    assert.doesNotMatch(tum, /[$€£₺]\s?\d|\d[.,]\d\d\s?(?:\$|€|TL|USD)/, `${dil}: metinde fiyat`);
    assert.doesNotMatch(tum, /AdMob|Calqora|ConvertPad|Smart Tools/i, `${dil}: başka marka adı`);
    assert.match(l.fullDescription, /\b5\b[\s\S]*\b8\b[\s\S]*\b3\b/, `${dil}: reklam sıklığı (5 dk, 8 dk, saatte 3) yazılı`);
    assert.match(l.fullDescription, /26/, `${dil}: kategori sayısı`);
  }
  const not = play.surumNotlari(fs.readFileSync(path.join(MAGAZA, 'surum-notu.txt'), 'utf8'), ceviri);
  assert.equal(not.length, 11);
  for (const n of not) assert.ok(n.text.length > 0 && n.text.length <= 500, n.language);
});

test('gizlilik sayfası ve tanıtım sayfası var; AdMob, UMP, Play Billing ve izinler anlatılıyor', () => {
  const g = fs.readFileSync(path.join(UN, '..', 'app', 'unitica', 'gizlilik.html'), 'utf8');
  for (const k of ['Gizlilik Politikası', 'Privacy Policy', 'AdMob', 'Reklam gizlilik seçenekleri', 'Google Play', 'BILLING', 'AD_ID',
    'FOREGROUND_SERVICE', 'mahmuttari@gmail.com', 'Poyraz Workshop']) assert.ok(g.includes(k), k);
  assert.ok(fs.existsSync(path.join(UN, '..', 'app', 'unitica', 'index.html')));
  const s = png(path.join(UN, '..', 'app', 'unitica', 'icon-192.png'));
  assert.deepEqual([s.w, s.h], [192, 192]);
  const md = fs.readFileSync(path.join(MAGAZA, 'aciklamalar.md'), 'utf8');
  assert.match(md, /^- \*\*Gizlilik politikası:\*\* https:\/\/mahmuttari\.github\.io\/Lispler\/unitica\/gizlilik\.html$/m);
});

test('Veri güvenliği CSV\'si tabloyla aynı ve AdMob beyanını taşıyor', () => {
  const csv = fs.readFileSync(path.join(MAGAZA, 'veri-guvenligi.csv'), 'utf8');
  const sablon = fs.readFileSync(vg.SABLON, 'utf8');
  assert.equal(csv, vg.csvYaz(vg.uret(sablon)), 'CSV elle değişmiş: node unitica/araclar/veri-guvenligi.mjs');
  const o = play.veriGuvenligiOzeti(csv);
  assert.deepEqual(Object.keys(o.turler).sort(), ['PSL_APPROX_LOCATION', 'PSL_DEVICE_ID', 'PSL_PERFORMANCE_DIAGNOSTICS', 'PSL_USER_INTERACTION']);
  assert.equal(o.genel.PSL_DATA_COLLECTION_COLLECTS_PERSONAL_DATA, 'TRUE');
  assert.equal(o.genel.PSL_DATA_COLLECTION_ENCRYPTED_IN_TRANSIT, 'TRUE');
  assert.equal(o.genel.PSL_DATA_COLLECTION_USER_REQUEST_DELETE, 'FALSE');
  assert.equal(o.genel['PSL_SUPPORTED_ACCOUNT_CREATION_METHODS/PSL_ACM_NONE'], 'TRUE', 'hesap oluşturulamaz (Play zorunlu tutar)');
  assert.ok(!Object.keys(o.genel).some((k) => /DELETION_URL|ACM_(?!NONE)/.test(k)), 'silme adresi ya da başka hesap yolu yazılmamalı');
  for (const [tur, t] of Object.entries(o.turler)) {
    assert.ok(t.toplanan && t.paylasilan, `${tur}: toplanıyor ve paylaşılıyor`);
    assert.equal(t.gecici, false, `${tur}: geçici değil`);
    assert.equal(t.istege, false, `${tur}: zorunlu`);
    assert.deepEqual(t.amac.sort(), ['ADVERTISING', 'ANALYTICS', 'FRAUD_PREVENTION_SECURITY'], tur);
    assert.deepEqual(t.amac, t.paylasimAmaci.sort(), `${tur}: paylaşım amacı = toplama amacı`);
  }
});

test('görseller Play ölçülerinde: simge 512 RGBA, her dilde tanıtım 1024×500 saydamsız ve 6 dikey ekran 1080×1920', () => {
  for (const dil of ['tr-TR', ...DILLER]) {
    const g = play.gorseller(dil);
    assert.ok(g, `${dil}: magaza/play${dil === 'tr-TR' ? '' : '/' + dil} yok`);
    const s = png(g.icon[0]);
    assert.deepEqual([s.w, s.h, s.renk], [512, 512, 6], 'simge 512×512 32 bit (RGBA) olmalı');
    assert.ok(s.boyut <= 1024 * 1024);
    const t = png(g.featureGraphic[0]);
    assert.deepEqual([t.w, t.h, t.renk], [1024, 500, 2], `${dil}: tanıtım görseli 1024×500, saydamlıksız (24 bit)`);
    assert.ok(g.featureGraphic[0].includes(dil === 'tr-TR' ? 'play/tanitim' : `play/${dil}/tanitim`), `${dil}: kendi dilinin tanıtım görseli`);
    assert.equal(g.phoneScreenshots.length, 6, `${dil}: ${g.phoneScreenshots.length} ekran`);
    for (const f of g.phoneScreenshots) {
      const e = png(f);
      assert.deepEqual([e.w, e.h, e.renk], [1080, 1920, 2], `${dil}/${path.basename(f)}`);
      assert.ok(e.boyut <= 8 * 1024 * 1024);
    }
  }
});

test('yayın belgeleri yerinde: fiyatlandırma, değerlendirme, Play talimatı, kaynak, istek dosyası', () => {
  for (const f of ['fiyatlandirma.md', 'DEGERLENDIRME.md', 'PLAY-YAYIN.md']) assert.ok(fs.existsSync(path.join(MAGAZA, f)), f);
  const fiyat = fs.readFileSync(path.join(MAGAZA, 'fiyatlandirma.md'), 'utf8');
  for (const k of ['`adfree`', '`monthly`', '`yearly`', '0,99', '9,99']) assert.ok(fiyat.includes(k), k);
  const deg = fs.readFileSync(path.join(MAGAZA, 'DEGERLENDIRME.md'), 'utf8');
  assert.match(deg, /\[D\]/); assert.match(deg, /\[DY\]/); assert.match(deg, /https:\/\//);
  const kaynak = fs.readFileSync(path.join(UN, 'KAYNAK.txt'), 'utf8');
  assert.match(kaynak, /1B339nueCefr9QCtiIv79CLTJTSfe-gT1/);
  assert.match(kaynak, /942f19915134903af037da166559bee4fa273c7d5974b5bfedb636b76c33e280/);
  const istek = fs.readFileSync(path.join(UN, 'play-istek.txt'), 'utf8');
  const etkin = istek.split('\n').map((s) => s.trim()).filter((s) => s && !s.startsWith('#'));
  for (const k of etkin) assert.match(k, /^(durum|magaza|gorsel|veriguvenligi|yukle)( [a-z]+)*$/, `geçersiz komut: ${k}`);
});
