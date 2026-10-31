// App Store metinleri (ios-ortak/app-store.mjs): sınırlar, iPhone'a uyarlama, Apple'ın abonelik açıklaması ve bağlantılar.
// Çalıştırma: node --test ios-ortak/app-store.test.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { metinler, md, ayar, YEREL, SINIR, EULA, KLASOR } from './app-store.mjs';

const uzunluk = (s) => [...s].length;
const emoji = /\p{Extended_Pictographic}/u;

for (const u of Object.keys(KLASOR)) {
  const m = metinler(u);

  test(`${u}: diller, sınırlar, başlıkta emoji yok`, () => {
    assert.deepEqual(Object.keys(m).sort(), (u === 'smart-measure' ? ['en-US', 'tr'] : Object.keys(YEREL)).sort());
    for (const [y, x] of Object.entries(m)) {
      for (const k of Object.keys(SINIR)) {
        assert.ok(x[k] && x[k].trim(), `${y} ${k} boş`);
        assert.ok(uzunluk(x[k]) <= SINIR[k], `${y} ${k}: ${uzunluk(x[k])} > ${SINIR[k]}`);
      }
      assert.doesNotMatch(x.ad + x.altBaslik, emoji, `${y}: ad ya da alt başlıkta emoji`);
    }
  });

  test(`${u}: anahtar sözcükler virgülle, boşluksuz, tekrarsız; adın sözcüklerini tekrarlamaz`, () => {
    for (const [y, x] of Object.entries(m)) {
      const k = x.anahtar.split(',');
      assert.ok(k.every((s) => s && s === s.trim()), `${y}: virgülden sonra boşluk ya da boş sözcük`);
      assert.equal(new Set(k.map((s) => s.toLocaleLowerCase())).size, k.length, `${y}: tekrar eden sözcük`);
      const ad = new Set(x.ad.toLocaleLowerCase().split(/[\s–:&,]+/).filter(Boolean));
      for (const s of k) assert.ok(!ad.has(s.toLocaleLowerCase()), `${y}: "${s}" adda zaten var (Apple adı ayrıca dizinler)`);
    }
  });

  test(`${u}: başka platform adı yok (2.3.10); abonelik açıklaması, EULA ve gizlilik bağlantısı var (3.1.2)`, () => {
    const a = ayar(u);
    assert.match(a.gizlilik, /^https:\/\/mahmuttari\.github\.io\/Lispler\/.+\/gizlilik\.html$/);
    assert.match(a.destek, /^https:\/\/mahmuttari\.github\.io\/Lispler\//);
    for (const [y, x] of Object.entries(m)) {
      for (const k of ['ad', 'altBaslik', 'anahtar', 'tanitim', 'aciklama']) assert.doesNotMatch(x[k], /Google[ -]?Play|Play Store|Android|ARCore/i, `${y} ${k}`);
      assert.ok(x.aciklama.includes(EULA), `${y}: EULA bağlantısı`);
      assert.ok(x.aciklama.includes(a.gizlilik), `${y}: gizlilik bağlantısı`);
      assert.match(x.aciklama, /24/, `${y}: 24 saat önce iptal`);
      assert.match(x.aciklama, /App[ -]Store/, `${y}: App Store hesap ayarları`);
      assert.doesNotMatch(x.aciklama, /\n{3,}/);
    }
  });
}

test('Ölçü Kutusu: App Store açıklamasında ışık ölçer yok (iPhone\'da gösterilmez)', () => {
  for (const [y, x] of Object.entries(metinler('smart-measure'))) {
    assert.doesNotMatch(x.aciklama + x.tanitim + x.altBaslik + x.anahtar, /ışık|Işık|light meter|light sensor|light readings|lux|💡/i, y);
  }
});

test('Calqora: iPhone yalnız dikey; yatay tuş takımı sözü yok', () => {
  const ios = fs.readFileSync(new URL('../calqora/ios/App/App/Info.plist', import.meta.url), 'utf8');
  assert.doesNotMatch(ios, /UIInterfaceOrientationLandscape/);
  for (const [y, x] of Object.entries(metinler('calqora'))) {
    assert.doesNotMatch(x.aciklama, /yatay ekran|landscape|Querformat|paysage|horizontal|orizzontale|горизонталь|الأفقي|横画面|가로 화면/i, y);
  }
});

test('APP-STORE.md dosyaları güncel (node ios-ortak/app-store.mjs --md)', () => {
  for (const [u, k] of Object.entries(KLASOR)) {
    assert.equal(fs.readFileSync(new URL(`../${k}/magaza/APP-STORE.md`, import.meta.url), 'utf8'), md(u), `${k}/magaza/APP-STORE.md eski`);
  }
});
