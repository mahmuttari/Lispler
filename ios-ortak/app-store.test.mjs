// App Store metinleri (ios-ortak/app-store.mjs): sınırlar, iPhone'a uyarlama, Apple'ın abonelik açıklaması ve bağlantılar.
// Çalıştırma: node --test ios-ortak/app-store.test.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { metinler, md, ayar, YEREL, SINIR, EULA, KLASOR, emojisiz } from './app-store.mjs';

const uzunluk = (s) => [...s].length;
const emoji = /\p{Extended_Pictographic}/u;

for (const u of Object.keys(KLASOR)) {
  const m = metinler(u);

  test(`${u}: diller, sınırlar, başlıkta emoji yok`, () => {
    assert.deepEqual(Object.keys(m).sort(), (['smart-measure', 'letspicky'].includes(u) ? ['en-US', 'tr'] : Object.keys(YEREL)).sort());
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

  test(`${u}: başka platform adı yok (2.3.10); abonelikliyse abonelik açıklaması, EULA ve gizlilik bağlantısı var (3.1.2)`, () => {
    const a = ayar(u);
    // Let's Picky'nin kendi alanı var (letspicky.com); öbürleri Lispler'in GitHub Pages sayfaları
    const alan = u === 'letspicky' ? 'https:\\/\\/letspicky\\.com\\/' : 'https:\\/\\/mahmuttari\\.github\\.io\\/Lispler\\/.+\\/';
    assert.match(a.gizlilik, new RegExp(`^${alan}gizlilik\\.html$`));
    assert.match(a.destek, new RegExp(`^${alan}`));
    for (const [y, x] of Object.entries(m)) {
      for (const k of ['ad', 'altBaslik', 'anahtar', 'tanitim', 'aciklama']) assert.doesNotMatch(x[k], /Google[ -]?Play|Play Store|Android|ARCore/i, `${y} ${k}`);
      assert.doesNotMatch(x.aciklama, /\n{3,}/);
      if (a.abonelik === false) {
        assert.ok(!x.aciklama.includes(EULA), `${y}: aboneliksiz uygulamada abonelik açıklaması yok`);
        continue;
      }
      assert.ok(x.aciklama.includes(EULA), `${y}: EULA bağlantısı`);
      assert.ok(x.aciklama.includes(a.gizlilik), `${y}: gizlilik bağlantısı`);
      assert.match(x.aciklama, /24/, `${y}: 24 saat önce iptal`);
      assert.match(x.aciklama, /App[ -]Store/, `${y}: App Store hesap ayarları`);
    }
  });
}

test("Let's Picky: aboneliksiz ve reklamsız; emoji tepkileri cümlesi düz metin; kategori Yaşam Tarzı + Eğlence", () => {
  const a = ayar('letspicky');
  assert.equal(a.abonelik, false);
  assert.deepEqual(a.kategori, ['LIFESTYLE', 'ENTERTAINMENT']);
  const m = metinler('letspicky');
  assert.ok(m.tr.aciklama.includes('• Serbest sohbet yok: yalnız birkaç sabit emoji tepkisi.'));
  assert.ok(m['en-US'].aciklama.includes('• No free-text chat: only a few fixed emoji reactions.'));
  for (const [y, x] of Object.entries(m)) assert.doesNotMatch(x.aciklama, /\(\s*\)|abonelik|subscription/i, y);
});

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

/** JPEG genişlik ve yükseklik (SOF işaretinden) */
function jpegBoyut(b) {
  assert.equal(b.readUInt16BE(0), 0xffd8, 'JPEG değil');
  for (let i = 2; i < b.length;) {
    const m = b.readUInt16BE(i), n = b.readUInt16BE(i + 2);
    if (m >= 0xffc0 && m <= 0xffc3) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
    i += 2 + n;
  }
  throw new Error('SOF yok');
}

/** App Store Connect'in 6,9″ iPhone yuvasının (API: APP_IPHONE_67) kabul ettiği dikey ölçüler */
const IPHONE_69 = [[1320, 2868], [1290, 2796], [1260, 2736]];

test('iPhone 6,9″ ekran görüntüleri: her App Store dilinde 3–10 dikey JPEG, 1320×2868 (ya da 1290×2796, 1260×2736) (IOS=1 node <klasör>/araclar/magaza-gorsel.mjs)', () => {
  for (const [u, k] of Object.entries(KLASOR)) {
    for (const y of Object.keys(metinler(u))) {
      const d = new URL(`../${k}/magaza/app-store/${y}/`, import.meta.url);
      const f = fs.existsSync(d) ? fs.readdirSync(d).filter((x) => /^iphone-.*\.jpg$/.test(x)) : [];
      assert.ok(f.length >= 3 && f.length <= 10, `${k} ${y}: ${f.length} görsel`);
      for (const x of f) {
        const [g, h] = jpegBoyut(fs.readFileSync(new URL(x, d)));
        assert.ok(IPHONE_69.some(([a, b]) => a === g && b === h), `${k} ${y} ${x}: ${g}×${h}`);
      }
    }
  }
});

test('abonelik inceleme görseli: aboneliği olan her uygulamada 1320×2868 JPEG (node ios-ortak/inceleme-gorsel.mjs)', () => {
  for (const [u, k] of Object.entries(KLASOR)) {
    if (ayar(u).abonelik === false) continue;
    assert.deepEqual(jpegBoyut(fs.readFileSync(new URL(`../${k}/magaza/app-store/inceleme-abonelik.jpg`, import.meta.url))), [1320, 2868], k);
  }
});

test('emoji yok: App Store Connect açıklamada emoji kabul etmez (409 INVALID_CHARACTERS); başlıklar düz metin kalır', () => {
  const EMOJI = /[\p{Extended_Pictographic}\u{FE0E}\u{FE0F}\u{200D}\u{20E3}]/u;
  for (const u of Object.keys(KLASOR)) {
    for (const [y, x] of Object.entries(metinler(u))) {
      for (const [alan, v] of Object.entries({ ad: x.ad, altBaslik: x.altBaslik, anahtar: x.anahtar, tanitim: x.tanitim, aciklama: x.aciklama })) {
        assert.ok(!EMOJI.test(v), `${u} ${y} ${alan}: ${(v.match(EMOJI) || [''])[0]}`);
        assert.ok(!/^[ \t]/m.test(v) && !/[ \t]{2,}/.test(v), `${u} ${y} ${alan}: kalan boşluk`);
      }
    }
  }
  assert.equal(emojisiz('📐 SU TERAZİSİ\nℹ️ Not: ±0,1° • 🔊 ses'), 'SU TERAZİSİ\nNot: ±0,1° • ses');
  assert.ok(metinler('smart-measure').tr.aciklama.includes('\nSU TERAZİSİ\n'));
});

test('APP-STORE.md dosyaları güncel (node ios-ortak/app-store.mjs --md)', () => {
  for (const [u, k] of Object.entries(KLASOR)) {
    assert.equal(fs.readFileSync(new URL(`../${k}/magaza/APP-STORE.md`, import.meta.url), 'utf8'), md(u), `${k}/magaza/APP-STORE.md eski`);
  }
});
