// Master Office mağaza dosyaları denetimi (play-masteroffice.yml her Play komutundan önce çalıştırır).
// node --test master-office/test/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

process.env.PLAY_UYGULAMA = 'masteroffice';
const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MAGAZA = path.join(KOK, 'master-office', 'magaza');
const play = await import('../../android/play.mjs');
const oku = (...p) => fs.readFileSync(path.join(...p), 'utf8');

/** PNG: genişlik, yükseklik, renk türü (2 = RGB, 6 = RGBA); JPEG: genişlik, yükseklik */
function olcu(dosya) {
  const b = fs.readFileSync(dosya);
  if (b.readUInt32BE(0) === 0x89504e47) return { tur: 'png', w: b.readUInt32BE(16), h: b.readUInt32BE(20), renk: b[25] };
  assert.equal(b.readUInt16BE(0), 0xffd8, `${dosya}: PNG ya da JPEG değil`);
  for (let i = 2; i < b.length;) {
    if (b[i] !== 0xff) { i++; continue; }
    const m = b[i + 1];
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(m)) {
      return { tur: 'jpeg', h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
    }
    i += 2 + b.readUInt16BE(i + 2);
  }
  throw new Error(`${dosya}: JPEG ölçüsü okunamadı`);
}

test('paket adı ve sürüm', () => {
  assert.equal(play.PAKET, 'com.ofivora.app');
  assert.deepEqual(play.surumBilgisi(oku(KOK, 'master-office', 'surum.gradle')), { versionCode: 3005002, versionName: '3.5.2' });
});

test('mağaza metinleri: tr-TR ve en-US, Play sınırları içinde', () => {
  const m = play.magazaMetinleri(oku(MAGAZA, 'aciklamalar.md'), play.dilDosyalari(MAGAZA));
  assert.deepEqual(Object.keys(m.listings).sort(), ['en-US', 'tr-TR']);
  for (const l of Object.values(m.listings)) assert.equal(l.title, 'Master Office');
  assert.match(m.details.contactEmail, /^[^@\s]+@[^@\s]+\.[a-z]+$/);
  assert.equal(m.details.contactWebsite, 'https://mahmuttari.github.io/master-office/');
  // Play meta veri kuralları: adda emoji / büyük harf / "en iyi" / "ücretsiz" yok
  for (const l of Object.values(m.listings)) assert.doesNotMatch(l.title + l.shortDescription, /en iyi|ücretsiz|best|free|#1/i);
});

test('sürüm notları ≤ 500 karakter', () => {
  const n = play.surumNotlari(oku(MAGAZA, 'surum-notu.txt'), play.dilDosyalari(MAGAZA));
  assert.deepEqual(n.map((x) => x.language), ['tr-TR', 'en-US']);
});

test('Veri güvenliği CSV: yalnız AdMob\'un dört veri türü, hepsi toplanıyor + paylaşılıyor', () => {
  const o = play.veriGuvenligiOzeti(oku(MAGAZA, 'veri-guvenligi.csv'));
  assert.equal(o.genel.PSL_DATA_COLLECTION_COLLECTS_PERSONAL_DATA, 'TRUE');
  assert.equal(o.genel.PSL_DATA_COLLECTION_ENCRYPTED_IN_TRANSIT, 'TRUE');
  assert.equal(o.genel.PSL_DATA_COLLECTION_USER_REQUEST_DELETE, 'FALSE');
  assert.equal(o.genel['PSL_SUPPORTED_ACCOUNT_CREATION_METHODS/PSL_ACM_NONE'], 'TRUE');
  assert.deepEqual(Object.keys(o.turler).sort(),
    ['PSL_APPROX_LOCATION', 'PSL_DEVICE_ID', 'PSL_PERFORMANCE_DIAGNOSTICS', 'PSL_USER_INTERACTION']);
  const amac = ['ADVERTISING', 'ANALYTICS', 'FRAUD_PREVENTION_SECURITY'];
  for (const [tur, t] of Object.entries(o.turler)) {
    assert.ok(t.toplanan && t.paylasilan, `${tur}: toplanıyor + paylaşılıyor olmalı`);
    assert.equal(t.gecici, false, `${tur}: geçici değil`);
    assert.equal(t.istege, false, `${tur}: zorunlu`);
    assert.deepEqual([...t.amac].sort(), amac, `${tur}: toplama amacı`);
    assert.deepEqual([...t.paylasimAmaci].sort(), amac, `${tur}: paylaşma amacı`);
  }
});

test('görseller: simge 512 (32 bit), tanıtım 1024×500 (saydamsız), 8 telefon görüntüsü 1080×1920 (tr-TR ve en-US)', () => {
  const g = play.gorseller('tr-TR');
  const s = olcu(g.icon[0]);
  assert.deepEqual([s.tur, s.w, s.h], ['png', 512, 512]);
  assert.ok(fs.statSync(g.icon[0]).size <= 1024 * 1024);
  for (const f of [g.featureGraphic[0], play.gorseller('en-US').featureGraphic[0]]) {
    const t = olcu(f);
    assert.deepEqual([t.w, t.h], [1024, 500], f);
    assert.notEqual(t.renk, 6, `${f}: tanıtım görselinde saydamlık olmamalı`);
  }
  assert.ok(play.gorseller('en-US').featureGraphic[0].includes(`${path.sep}en-US${path.sep}`), 'en-US tanıtım görseli kendi klasöründen');
  assert.equal(g.phoneScreenshots.length, 8);
  // en-US: İngilizce telefon görüntüleri kendi klasöründen (rehber eki 1, 11 Kasım 2026); Türkçelerle aynı sıra
  const en = play.gorseller('en-US');
  assert.equal(en.phoneScreenshots.length, 8, 'en-US: 8 İngilizce telefon görüntüsü');
  for (const f of en.phoneScreenshots) assert.ok(f.includes(`${path.sep}en-US${path.sep}`), `${f}: en-US klasöründen olmalı`);
  for (const f of [...g.phoneScreenshots, ...en.phoneScreenshots]) {
    const t = olcu(f);
    assert.deepEqual([t.w, t.h], [1080, 1920], f);
    assert.ok(fs.statSync(f).size <= 8 * 1024 * 1024, `${f}: 8 MB'den büyük`);
  }
});

test('gizlilik ve web sitesi adresi MARFEN uygulama sayfalarında', () => {
  // Sayfa mahmuttari/mahmuttari.github.io deposundadır (master-office/gizlilik.html); burada yalnız adres denetlenir
  const md = oku(MAGAZA, 'aciklamalar.md');
  assert.match(md, /^- \*\*Gizlilik politikası:\*\* https:\/\/mahmuttari\.github\.io\/master-office\/gizlilik\.html$/m);
  assert.match(md, /^- \*\*Geliştirici adı:\*\* MARFEN/m);
});
