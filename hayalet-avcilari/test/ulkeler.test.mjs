// Hayalet Avcıları: Dünya Turu ülke verisi (3.14.0) — veri bütünlüğü.
// 51 ülke: BM World Population Prospects 2024'e göre en kalabalık 50 ülke + kullanıcının isteğiyle Filistin. Rota
// sırası, kıta, aile, obje ressam adları, palet (zemin koyu: hayaletler ve arayüz okunur), kostüm türleri, adlar ve
// yardımcılar. Tasarım: docs/superpowers/specs/2026-10-24-hayalet-ulkeler-design.md §4.
// Çalıştırma: node hayalet-avcilari/test/ulkeler.test.mjs   (Playwright + Chromium; ağ gerekmez)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WWW = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);
const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.m4a': 'audio/mp4' };
const sunucu = http.createServer((q, r) => {
  const f = path.join(WWW, decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html');
  if (!f.startsWith(WWW) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': TUR[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(0);
const adres = `http://127.0.0.1:${sunucu.address().port}/index.html`;

const sonuclar = [];
function sina(ad, fn) {
  try { fn(); sonuclar.push(`✓ ${ad}`); } catch (e) { sonuclar.push(`✗ ${ad}: ${e.message.split('\n')[0]}`); }
}

const ROTA = ['TR', 'UA', 'PL', 'DE', 'GB', 'FR', 'IT', 'ES', 'MA', 'DZ', 'CI', 'GH', 'NG', 'CD', 'AO', 'ZA', 'MZ', 'MG', 'TZ', 'UG',
  'KE', 'ET', 'SD', 'EG', 'YE', 'SA', 'PS', 'IQ', 'IR', 'UZ', 'AF', 'PK', 'IN', 'BD', 'MM', 'TH', 'MY', 'ID', 'PH', 'VN', 'CN', 'KR',
  'JP', 'RU', 'CA', 'US', 'MX', 'CO', 'PE', 'BR', 'AR'];
// BM WPP 2024, 2025 ve 2026 tahminlerinde aynı küme (spec §4.1)
const WPP50 = 'IN CN US ID PK NG BR BD RU ET MX JP EG PH CD VN IR TR DE TH TZ GB FR ZA IT KE MM CO KR SD UG ES DZ IQ AR AF YE CA AO UA MA PL UZ MY MZ GH PE SA MG CI'.split(' ');
const AILE = {
  TR: 'KS', UA: 'K', PL: 'K', DE: 'K', GB: 'K', FR: 'K', IT: 'K', ES: 'K', MA: 'KP', DZ: 'KP', CI: 'SH', GH: 'SH', NG: 'SH',
  CD: 'SV', AO: 'SV', ZA: 'SV', MZ: 'SV', MG: 'SV', TZ: 'SV', UG: 'SV', KE: 'SV', ET: 'SV', SD: 'KP', EG: 'KP', YE: 'KP', SA: 'KP',
  PS: 'KS', IQ: 'KS', IR: 'KS', UZ: 'KS', AF: 'KS', PK: 'GA', IN: 'GA', BD: 'GA', MM: 'GDA', TH: 'GDA', MY: 'GDA', ID: 'GDA',
  PH: 'GDA', VN: 'GDA', CN: 'DA', KR: 'DA', JP: 'DA', RU: 'K', CA: 'KA', US: 'KA', MX: 'LA', CO: 'LA', PE: 'LA', BR: 'LA', AR: 'LA',
};
const RESSAM = {
  TR: ['periBacalari', 'laleBahcesi'], UA: ['aycicegiTarlasi', 'samanCatiliEv'], PL: ['wawelEjderi', 'leylekYuvalari'],
  DE: ['gugukluSaatEvi', 'yarimAhsapEvler'], GB: ['telefonKulubeleri', 'saatKulesi'], FR: ['eyfelKulesi', 'lavantaTarlasi'],
  IT: ['kolezyum', 'gondolIskelesi'], ES: ['yelDegirmenleri', 'aslanliCesme'], MA: ['maviSokaklar', 'fenerliCarsi'],
  DZ: ['sahraKumullari', 'kayaKemerleri'], CI: ['kakaoBahcesi', 'filAilesi'], GH: ['kenteTezgahi', 'kanopiKoprusu'],
  NG: ['zumaKayasi', 'konusanDavullar'], CD: ['okapiOrmani', 'piroglar'], AO: ['kalandulaSelalesi', 'welwitschia'],
  ZA: ['masaDagi', 'penguenler'], MZ: ['dauYelkenlileri', 'kajuAgaclari'], MG: ['baobabCaddesi', 'lemurlar'],
  TZ: ['kilimanjaro', 'oymaKapilar'], UG: ['dagGorilleri', 'murchisonSelalesi'], KE: ['zurafalarAkasya', 'flamingoGolu'],
  ET: ['aksumTaslari', 'geladaMaymunlari'], SD: ['meroePiramitleri', 'devePazari'], EG: ['gizePiramitleri', 'felukalar'],
  YE: ['ejderKaniAgaclari', 'kuleEvler'], SA: ['hurmaBahcesi', 'filKayasi'], PS: ['zeytinBahcesi', 'hayatAgaciMozaigi'],
  IQ: ['mudhifEvleri', 'senasilBalkonlar'], IR: ['sioseKopru', 'ruzgarKuleleri'], UZ: ['ipekYoluKervani', 'kavunPazari'],
  AF: ['ucurtmaTepesi', 'narBahcesi'], PK: ['susluKamyonlar', 'kayisiBahcesi'], IN: ['hawaMahal', 'lotusGoleti'],
  BD: ['susluRiksalar', 'sundarbans'], MM: ['inleBalikcilari', 'patheinSemsiyeleri'], TH: ['yuzenPazar', 'tukTuk'],
  MY: ['petronasKuleleri', 'rafflesia'], ID: ['komodoEjderleri', 'pirincTeraslari'], PH: ['cikolataTepeleri', 'jeepney'],
  VN: ['haLongKorfezi', 'hoiAnFenerleri'], CN: ['pandalar', 'ejderDansi'], KR: ['hanokEvleri', 'onggiKupleri'],
  JP: ['kirazAgaclari', 'fujiDagi'], RU: ['matruskalar', 'izbaEvi'], CA: ['akcaagacOrmani', 'kunduzBaraji'],
  US: ['ozgurlukHeykeli', 'buyukKanyon'], MX: ['papelPicadoPazari', 'ajoloteGoleti'], CO: ['mumPalmiyeleri', 'cartagenaEvleri'],
  PE: ['machuPicchu', 'lamalar'], BR: ['amazonKuslari', 'sekerSomunu'], AR: ['peritoMoreno', 'caminito'],
};
const KAYA = ['kayaKemerleri', 'zumaKayasi', 'masaDagi', 'kilimanjaro', 'filKayasi', 'cikolataTepeleri', 'fujiDagi', 'buyukKanyon'];
const TURLER = {
  baslik: ['efe', 'cicekTaci', 'krakuska', 'tirol', 'tam', 'bere', 'ucKose', 'cicekToka', 'kapuson', 'basBagi', 'fila', 'kubaBaslik',
    'isicholo', 'satroka', 'boncukBant', 'imma', 'nemes', 'mesedde', 'simag', 'kece', 'doppi', 'sindhi', 'gaungBaung', 'tanjak',
    'blangkon', 'salakot', 'nonLa', 'gat', 'kokosnik', 'kurk', 'kovboy', 'sombrero', 'vueltiao', 'chullo', 'boina', 'yok'],
  giysi: ['entari', 'ceket', 'sarili', 'panco', 'kimono', 'elbise', 'askili'],
  desen: ['duz', 'cizgili', 'ekose', 'puantiye', 'geometrik', 'nakis', 'batik', 'boncuk'],
  aksesuar: ['yelpaze', 'fener', 'semsiye', 'mate', 'maske', 'boncukluYaka', 'kusak', 'sal', 'pelerin', 'fular', 'bandana'],
  ayakkabi: ['babus', 'geta', 'markub', 'cizme'],
};
const RENK = /^#[0-9a-f]{6}$/;
const kanal = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const parlaklik = (h) => { const n = parseInt(h.slice(1), 16); return 0.2126 * kanal((n >> 16) & 255) + 0.7152 * kanal((n >> 8) & 255) + 0.0722 * kanal(n & 255); };

const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const hatalar = [];
try {
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('hayaletAvcilariDil', 'tr'); localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9'); });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForTimeout(300);
  const v = await p.evaluate(() => ({
    ulkeler: JSON.parse(JSON.stringify(ULKELER)),
    sayi: ULKE_SAYISI,
    ilk: ulkeSirada(0).kod, son: ulkeSirada(99).kod, besinci: ulkeSirada(5).kod,
    yok: ulkeKodla('XX'),
    tanitim: ulkeTanitimi(ulkeKodla('FR')),
    tema: ulkeTemasi(ulkeKodla('JP')),
  }));
  const U = v.ulkeler;
  const kodlar = U.map((u) => u.kod);

  sina('51 ülke, rota sırası spec §4.2', () => { assert.equal(v.sayi, 51); assert.deepEqual(kodlar, ROTA); });
  sina('Filistin dışındaki küme BM WPP 2024 en kalabalık 50; İsrail yok', () => {
    assert.deepEqual(kodlar.filter((k) => k !== 'PS').sort(), [...WPP50].sort());
    assert.ok(kodlar.includes('PS')); assert.ok(!kodlar.includes('IL'));
  });
  sina('sıra ve kıta', () => {
    U.forEach((u, i) => {
      assert.equal(u.sira, i + 1, u.kod);
      assert.equal(u.kita, i < 8 ? 'avrupa' : i < 24 ? 'afrika' : i < 44 ? 'asya' : 'amerika', u.kod);
    });
  });
  sina('aile spec §4.3 tablosuyla aynı', () => { for (const u of U) assert.equal(u.aile, AILE[u.kod], u.kod); });
  sina('obje ressam adları ve kaya biçimi', () => {
    for (const u of U) {
      assert.deepEqual([u.obje1.ressam, u.obje2.ressam], RESSAM[u.kod], u.kod);
      for (const o of [u.obje1, u.obje2]) assert.equal(o.bicim || 'yama', KAYA.includes(o.ressam) ? 'kaya' : 'yama', o.ressam);
    }
  });
  sina('palet: altı renk, zemin koyu (≤ 0,08), desen zeminden farklı', () => {
    for (const u of U) {
      for (const k of ['zemin', 'desen', 'duvar', 'duvarKoyu', 'vurgu1', 'vurgu2']) assert.match(u.palet[k], RENK, `${u.kod}.${k}`);
      assert.ok(parlaklik(u.palet.zemin) <= 0.08, `${u.kod} zemin ${u.palet.zemin} ${parlaklik(u.palet.zemin).toFixed(3)}`);
      assert.notEqual(u.palet.desen, u.palet.zemin, u.kod);
    }
  });
  sina('kostüm yalnız tanımlı türlerden, 3 renk', () => {
    for (const u of U) {
      const k = u.kostum;
      assert.ok(TURLER.baslik.includes(k.baslik), `${u.kod} başlık ${k.baslik}`);
      assert.ok(TURLER.giysi.includes(k.giysi), `${u.kod} giysi ${k.giysi}`);
      assert.ok(TURLER.desen.includes(k.desen), `${u.kod} desen ${k.desen}`);
      assert.ok(Array.isArray(k.aksesuar) && k.aksesuar.every((a) => TURLER.aksesuar.includes(a)), `${u.kod} aksesuar ${k.aksesuar}`);
      if (k.ayakkabi !== undefined) assert.ok(TURLER.ayakkabi.includes(k.ayakkabi), `${u.kod} ayakkabı ${k.ayakkabi}`);
      assert.equal(k.renk.length, 3, u.kod); k.renk.forEach((r) => assert.match(r, RENK, u.kod));
    }
  });
  sina('adlar boş değil', () => {
    for (const u of U) for (const s of [u.ad, u.bossAd, u.obje1.ad, u.obje2.ad]) assert.ok(typeof s === 'string' && s.trim(), u.kod);
  });
  sina('yardımcılar: sınırlanan sıra, bilinmeyen kod, tema', () => {
    assert.equal(v.ilk, 'TR'); assert.equal(v.son, 'AR'); assert.equal(v.besinci, 'GB'); assert.equal(v.yok, null);
    assert.equal(v.tema.name, 'Japonya'); assert.equal(v.tema.waterTop, '#1e7fd6'); assert.equal(v.tema.waterBot, '#0a3a8a');
    assert.equal(v.tema.floor, U[42].palet.zemin); assert.equal(v.tema.wallDark, U[42].palet.duvarKoyu);
  });
  sina('tanıtım satırı', () => { assert.equal(v.tanitim, '✈️ 6. Fransa — Eyfel Kulesi ve lavanta tarlası'); });
  sina('sayfa hatası yok', () => { assert.deepEqual(hatalar, []); });
} catch (e) {
  sonuclar.push(`✗ akış yarıda kaldı: ${e.message.split('\n')[0]}`);
} finally {
  await b.close();
  sunucu.close();
}
sonuclar.forEach((s) => console.log(s));
const kalan = sonuclar.filter((s) => s.startsWith('✗'));
assert.equal(kalan.length, 0, `${kalan.length} sınama başarısız`);
console.log(`TAMAM: ${sonuclar.length} sınama`);
