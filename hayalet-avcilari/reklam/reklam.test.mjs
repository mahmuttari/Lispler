// Google Ads reklam varlıkları ve sahibin adı denetimi (çevrimdışı; Playwright gerekmez).
// Çalıştırma: node --test hayalet-avcilari/reklam/reklam.test.mjs   (hayalet-site-yayini.yml yayından önce koşar)
// Kaynaklar (REKLAM-PLANI.md › Kaynaklar): Uygulama kampanyası metin sınırları (5 başlık ≤30, 5 açıklama ≤90 karakter;
// çift genişlikli karakter 2 sayılır), Google Ads yazım kuralları (başlıkta ünlem yok, açıklamada en çok bir; simge ve
// emoji yok; kelimenin tamamı büyük harf yok), görsel en çok 5120 KB.
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { BOYUTLAR, SAHNELER, DILLER } from './gorsel.mjs';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEPO = path.join(KOK, '..');
const METIN = JSON.parse(fs.readFileSync(path.join(KOK, 'reklam', 'metinler.json'), 'utf8'));

// Kullanıcının isteği: reklamda ve reklamın götürdüğü yerlerde (Play sayfası, web sitesi, oyun) bu adlar hiç görünmesin
const SAHIP = /mahmut|marfen|mafren|tar[ıi]\s*m[üu]hendis/i;

// Google Ads çift genişlikli (Çince, Japonca, Korece ve tam genişlikli noktalama) karakteri 2 sayar
const genislik = (s) => [...s].reduce((t, c) => t + (/[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/.test(c) ? 2 : 1), 0);

test('altı dil, her biri 5 başlık ve 5 açıklama, Google sınırları içinde', () => {
  assert.deepEqual(DILLER, ['tr', 'en', 'es', 'ar', 'hi', 'zh']);
  for (const dil of DILLER) {
    const m = METIN[dil];
    assert.equal(m.basliklar.length, 5, dil);
    assert.equal(m.aciklamalar.length, 5, dil);
    for (const b of m.basliklar) assert.ok(genislik(b) <= 30, `${dil} başlık ${genislik(b)} > 30: ${b}`);
    for (const a of m.aciklamalar) assert.ok(genislik(a) <= 90, `${dil} açıklama ${genislik(a)} > 90: ${a}`);
    const hepsi = [...m.basliklar, ...m.aciklamalar];
    assert.equal(new Set(hepsi).size, hepsi.length, `${dil}: tekrar eden metin`);
    for (const s of SAHNELER) assert.ok(m.sahne[s], `${dil}: ${s} alt yazısı yok`);
    assert.ok(m.ad, dil);
  }
});

test('yazım kuralları: başlıkta ünlem yok, emoji yok, büyük harf kelime yok, ödül ve üstünlük iddiası yok', () => {
  for (const dil of DILLER) {
    const m = METIN[dil];
    for (const b of m.basliklar) assert.doesNotMatch(b, /[!¡]/, `${dil}: ${b}`);
    for (const a of m.aciklamalar) assert.ok((a.match(/!/g) || []).length <= 1, `${dil}: ${a}`);
    for (const s of [...m.basliklar, ...m.aciklamalar]) {
      assert.doesNotMatch(s, /\p{Extended_Pictographic}/u, `${dil}: emoji ${s}`);
      assert.doesNotMatch(s, /(^|[^\p{L}])\p{Lu}{3,}(?![\p{L}])/u, `${dil}: büyük harf kelime ${s}`);
      // Kanıtlanamayan üstünlük, ödül, fiyat ve reklamsızlık iddiaları (oyunda reklam var)
      assert.doesNotMatch(s, /en iyi|1 numara|#1|best|número 1|mejor|الأفضل|सबसे अच्छा|最好|第一|reklamsız|ad-free|sin anuncios|https?:|www\./i, `${dil}: iddia ${s}`);
    }
  }
});

test('görseller: her dil, sahne ve boyut için JPEG, doğru ölçü, 5120 KB altı', () => {
  // JPEG'in SOF0/SOF2 bölümünden genişlik ve yükseklik
  const olcu = (b) => {
    for (let i = 2; i < b.length;) {
      const isaret = b[i + 1], uzunluk = b.readUInt16BE(i + 2);
      if (isaret === 0xc0 || isaret === 0xc2) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
      i += 2 + uzunluk;
    }
    throw new Error('JPEG ölçüsü okunamadı');
  };
  let sayi = 0;
  for (const dil of DILLER) for (const s of SAHNELER) for (const { w, h } of Object.values(BOYUTLAR)) {
    const f = path.join(KOK, 'reklam', 'gorseller', dil, `${s}-${w}x${h}.jpg`);
    assert.ok(fs.existsSync(f), `${f} yok: node hayalet-avcilari/reklam/gorsel.mjs ${dil}`);
    const b = fs.readFileSync(f);
    assert.equal(b.readUInt16BE(0), 0xffd8, f);
    assert.deepEqual(olcu(b), { w, h }, f);
    assert.ok(b.length <= 5120 * 1024, f);
    sayi++;
  }
  assert.equal(sayi, 6 * 3 * 3);
  // Oranlar Uygulama kampanyasının üç oranı: 1,91:1, 1:1, 4:5
  assert.deepEqual(Object.values(BOYUTLAR).map(({ w, h }) => Math.round((w / h) * 100) / 100), [1.91, 1, 0.8]);
});

test('sahibin adı reklamda, oyunda, Play metinlerinde ve web sayfalarında yok', () => {
  const dosyalar = [];
  const gez = (k, uygun) => {
    for (const ad of fs.readdirSync(k, { withFileTypes: true })) {
      const tam = path.join(k, ad.name);
      if (ad.isDirectory()) { if (ad.name !== 'node_modules') gez(tam, uygun); } else if (uygun(ad.name)) dosyalar.push(tam);
    }
  };
  const metin = (ad) => /\.(js|mjs|json|html|css|md|txt|csv)$/.test(ad);
  gez(path.join(KOK, 'www'), metin);                        // oyunun kendisi (ekranlar, çeviriler)
  gez(path.join(KOK, 'magaza', 'diller'), metin);           // Play mağaza metinleri
  for (const f of ['aciklamalar.md', 'veri-guvenligi.csv', 'surum-notu.txt']) dosyalar.push(path.join(KOK, 'magaza', f));
  dosyalar.push(path.join(KOK, 'reklam', 'metinler.json'), path.join(KOK, 'reklam', 'gorsel.mjs'));
  gez(path.join(DEPO, 'app', 'hayalet-avcilari'), metin);  // gizlilik, hesap silme, tanıtım
  dosyalar.push(path.join(DEPO, 'app', 'legal.css'));
  assert.ok(dosyalar.length > 40, 'taranan dosya az: yol yanlış olabilir');
  for (const f of dosyalar) {
    const s = fs.readFileSync(f, 'utf8');
    assert.doesNotMatch(s, SAHIP, path.relative(DEPO, f));
    assert.doesNotMatch(s, /mahmuttari\.github\.io|@gmail\.com(?<!poyrazworkshop@gmail\.com)/, path.relative(DEPO, f));
  }
  // aciklamalar.md'nin Play'e giden satırları
  const md = fs.readFileSync(path.join(KOK, 'magaza', 'aciklamalar.md'), 'utf8');
  for (const alan of ['Geliştirici adı', 'Destek e-postası', 'Gizlilik politikası', 'Hesap silme adresi']) {
    const satir = new RegExp(`^- \\*\\*${alan}:\\*\\* (.+)$`, 'm').exec(md)?.[1];
    assert.ok(satir, alan);
    assert.doesNotMatch(satir, SAHIP, alan);
  }
});
