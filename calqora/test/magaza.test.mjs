// Calqora mağaza dosyalarının Play kurallarına uyduğunu denetler (node --test calqora/test/*.test.mjs).
// play-calqora.yml her Play komutundan önce çalıştırır: bozuk metin, eksik görsel ya da tabloyla ayrışmış Veri güvenliği
// CSV'si Play'e gitmeden yakalanır. android/play.mjs'nin saf işlevleri (metin ayrıştırma, sınırlar, CSV) kullanılır;
// play.mjs'de "calqora" kaydı henüz yoksa (koordinatör ekler) yalnız kayda bağlı denetim atlanır.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAGAZA = path.join(KOK, 'magaza');
const PAKET = 'com.poyrazworkshop.calqora';
delete process.env.PLAY_UYGULAMA;
const genel = await import('../../android/play.mjs');
const kayitli = 'calqora' in genel.UYGULAMALAR;
if (kayitli) process.env.PLAY_UYGULAMA = 'calqora';
const play = kayitli ? await import('../../android/play.mjs?calqora') : genel;
const vg = await import('../araclar/veri-guvenligi.mjs');
const oku = (...p) => fs.readFileSync(path.join(KOK, ...p), 'utf8');

const DILLER = ['tr-TR', 'en-US', 'de-DE', 'fr-FR', 'es-ES', 'it-IT', 'pt-BR', 'ru-RU', 'ar', 'ja-JP', 'ko-KR'];
const metinler = () => genel.magazaMetinleri(oku('magaza', 'aciklamalar.md'), genel.dilDosyalari(MAGAZA));

/** PNG başlığı → genişlik, yükseklik, renk türü (2 RGB, 6 RGBA) */
function png(dosya) {
  const b = fs.readFileSync(dosya);
  assert.equal(b.subarray(1, 4).toString(), 'PNG', `${dosya} PNG değil`);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), renk: b[25], boyut: b.length };
}

test('android/play.mjs kaydı: paket, mağaza klasörü, AAB ve build.gradle', { skip: !kayitli && 'play.mjs\'de calqora kaydı yok (koordinatör ekler)' }, () => {
  assert.equal(play.PAKET, PAKET);
  assert.deepEqual(play.UYGULAMALAR.calqora, { paket: PAKET, magaza: 'calqora/magaza', aab: 'dist/Calqora-play.aab', gradle: 'calqora/android/app/build.gradle' });
  const g = play.gorseller('tr-TR');
  assert.ok(g.phoneScreenshots.length >= 4 && g.icon[0].endsWith(path.join('calqora', 'magaza', 'play', 'simge-512.png')));
});

test('build.gradle sürümü play.mjs ve calqora-android.yml biçiminde okunur', () => {
  assert.deepEqual(genel.surumBilgisi(oku('android', 'app', 'build.gradle')), { versionCode: 1, versionName: '1.1.0' });
});

test('mağaza metni 11 dilde, Play sınırlarında; iletişim bilgileri', () => {
  const m = metinler();
  assert.deepEqual(Object.keys(m.listings).sort(), [...DILLER].sort());
  assert.equal(m.listings['tr-TR'].title, 'Calqora – Bilimsel Hesap');
  for (const [dil, l] of Object.entries(m.listings)) {
    assert.ok(l.title.length <= 30 && l.shortDescription.length <= 80 && l.fullDescription.length <= 4000, dil);
    assert.match(l.title, /Calqora/, `${dil}: adda marka`);
  }
  assert.deepEqual(m.details, { defaultLanguage: 'tr-TR', contactEmail: 'mahmuttari@gmail.com', contactWebsite: 'https://mahmuttari.github.io/Lispler/calqora/' });
  const notlar = genel.surumNotlari(oku('magaza', 'surum-notu.txt'), genel.dilDosyalari(MAGAZA));
  assert.deepEqual(notlar.map((n) => n.language).sort(), [...DILLER].sort(), 'her dilde sürüm notu');
  for (const n of notlar) assert.ok(n.text.length > 0 && n.text.length <= 500, n.language);
});

test('metin kuralları: adda emoji / BÜYÜK HARF / "en iyi" / "ücretsiz" yok; açıklamada fiyat ve başka marka yok', () => {
  const yasakAd = /\b(best|free|top)\b|en iyi|ücretsiz|beste|kostenlos|gratis|gratuit|meilleur|mejor|migliore|gratuito|melhor|лучш|бесплат|最高|無料|최고|무료|أفضل|مجان/i;
  const marka = /\b(Google|Apple|AdMob|Android|iPhone|Desmos|HiPER|RealCalc|GeoGebra|Casio|Texas|TI-\d)\b/i;
  const fiyat = /[$€₺£¥₩₽]|\b\d+[.,]\d\d\s?(USD|EUR|TL|TRY)\b|\b(USD|TRY)\b/;
  for (const [dil, l] of Object.entries(metinler().listings)) {
    assert.doesNotMatch(l.title, /\p{Extended_Pictographic}/u, `${dil}: adda emoji`);
    assert.doesNotMatch(l.title, yasakAd, `${dil}: adda yasak sözcük`);
    for (const w of l.title.split(/[\s:–-]+/)) assert.ok(!(w.length > 3 && /\p{Lu}/u.test(w) && w === w.toUpperCase()), `${dil}: büyük harfli sözcük ${w}`);
    for (const [ad, t] of [['kısa', l.shortDescription], ['uzun', l.fullDescription]]) {
      assert.doesNotMatch(t, fiyat, `${dil} ${ad}: fiyat`);
      assert.doesNotMatch(t, marka, `${dil} ${ad}: başka marka`);
      assert.doesNotMatch(t, /★|⭐|\b\d[.,]\d\s?(stars?|yıldız)|\d+\s?(million|milyon|M\+)/i, `${dil} ${ad}: puan ya da kullanıcı sayısı`);
    }
    // reklam ve doğruluk dürüstçe: 4 dakika kuralı ve ~15 anlamlı basamak her dilde yazılı
    assert.match(l.fullDescription, /4/, `${dil}: reklam sıklığı`);
    assert.match(l.fullDescription, /15/, `${dil}: doğruluk notu`);
  }
  assert.match(metinler().listings['tr-TR'].fullDescription, /reklam bandı[\s\S]*en sık 4 dakikada bir; yazarken asla/);
});

test('gizlilik ve tanıtım sayfası: AdMob, UMP, Play Faturalandırma, izinler; mağaza adresiyle eşleşiyor', () => {
  const app = path.join(KOK, '..', 'app', 'calqora');
  const g = fs.readFileSync(path.join(app, 'gizlilik.html'), 'utf8').replace(/\s+/g, ' ');
  for (const s of ['Gizlilik Politikası', 'AdMob', 'User Messaging Platform', 'Reklam gizlilik seçenekleri', 'Faturalandırma', 'INTERNET',
    'ACCESS_NETWORK_STATE', 'com.android.vending.BILLING', 'AD_ID', 'Poyraz Workshop', 'mahmuttari@gmail.com', PAKET, 'id="en"', 'Ad privacy options', '13']) {
    assert.ok(g.includes(s), `gizlilik.html: "${s}" yok`);
  }
  assert.doesNotMatch(g, /internet(e)? (hiç )?çıkmaz uygulama|no ads|reklam yok/i);
  assert.ok(fs.readFileSync(path.join(app, 'index.html'), 'utf8').includes('gizlilik.html'));
  const i = png(path.join(app, 'icon-192.png'));
  assert.deepEqual([i.w, i.h], [192, 192]);
  assert.match(oku('magaza', 'aciklamalar.md'), /^- \*\*Gizlilik politikası:\*\* https:\/\/mahmuttari\.github\.io\/Lispler\/calqora\/gizlilik\.html$/m);
});

test('Veri güvenliği CSV\'si tabloyla aynı: yalnız AdMob\'un dört veri türü, toplanır ve paylaşılır', () => {
  const csv = oku('magaza', 'veri-guvenligi.csv');
  const sablon = fs.readFileSync(path.join(KOK, '..', 'hayalet-avcilari', 'magaza', 'veri-guvenligi.csv'), 'utf8');
  assert.equal(csv, vg.csvYaz(vg.uret(sablon)), 'CSV elle değişmiş: node calqora/araclar/veri-guvenligi.mjs');
  const o = genel.veriGuvenligiOzeti(csv);
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

test('görseller Play ölçülerinde, 11 dilde: simge 512 RGBA, tanıtım 1024×500 saydamsız, 4-8 dikey ekran 1080×1920', () => {
  const kok = path.join(MAGAZA, 'play');
  const s = png(path.join(kok, 'simge-512.png'));
  assert.deepEqual([s.w, s.h, s.renk], [512, 512, 6], 'simge 512×512 32 bit (RGBA) olmalı');
  assert.ok(s.boyut <= 1024 * 1024);
  const klasorler = fs.readdirSync(kok).filter((f) => fs.statSync(path.join(kok, f)).isDirectory()).sort();
  assert.deepEqual(klasorler, DILLER.filter((d) => d !== 'tr-TR').sort(), 'her çeviri dili için görsel klasörü');
  for (const dil of DILLER) {
    const d = dil === 'tr-TR' ? kok : path.join(kok, dil);
    const t = png(path.join(d, 'tanitim-gorseli-1024x500.png'));
    assert.deepEqual([t.w, t.h, t.renk], [1024, 500, 2], `${dil}: tanıtım görseli 24 bit`);
    const tel = fs.readdirSync(d).filter((f) => /^telefon-.*\.png$/.test(f));
    assert.ok(tel.length >= 4 && tel.length <= 8, `${dil}: ${tel.length} ekran`);
    for (const f of tel) {
      const e = png(path.join(d, f));
      assert.deepEqual([e.w, e.h, e.renk], [1080, 1920, 2], `${dil} ${f}`);
      assert.ok(e.boyut <= 8 * 1024 * 1024);
    }
  }
});

test('abonelik ve yayın belgeleri: fiyatlandırma, PLAY-YAYIN, DEGERLENDIRME, KAYNAK, play-istek', () => {
  const f = oku('magaza', 'fiyatlandirma.md');
  for (const s of ['`adfree`', '`monthly`', '`yearly`', '0,99', '9,99', `sku=adfree&package=${PAKET}`]) assert.ok(f.includes(s), `fiyatlandirma.md: ${s}`);
  const p = oku('magaza', 'PLAY-YAYIN.md');
  for (const s of ['## Sabit bilgiler', '## Talimat', '### 1. AdMob', 'Geçiş reklamı', '### 4. Abonelik', 'calqora/araclar/kimlik.mjs', 'Calqora-aab']) assert.ok(p.includes(s), `PLAY-YAYIN.md: ${s}`);
  const d = oku('magaza', 'DEGERLENDIRME.md');
  for (const s of ['askıya', 'support.google.com/admob/answer/6201362', '[D]', '[K]', '[DY]', 'Birim ekonomi']) assert.ok(d.includes(s), `DEGERLENDIRME.md: ${s}`);
  const k = oku('KAYNAK.txt');
  for (const s of ['1nevGYjs7NkOhd-n8LCEzpcyyBC0c0O6F', 'ed5a34b27df98e3291d2f7db27f2256be14025a0d72d1132346f5ced157b5815', 'com.geoterva.calqora', '2B:DB:33:F2']) assert.ok(k.includes(s), `KAYNAK.txt: ${s}`);
  const istek = oku('play-istek.txt').split('\n').map((s) => s.trim()).filter((s) => s && !s.startsWith('#'));
  for (const k of istek) assert.match(k, /^(durum|magaza|gorsel|veriguvenligi|yukle)( [a-z]+)*$/, `play-istek.txt: geçersiz komut: ${k}`);
});
