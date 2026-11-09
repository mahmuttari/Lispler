// Kelime Bilcek sitesi — yayından önce (kelime-site-yayini.yml) ve denetimde (kelime-denetim.yml) çalışır.
// Sayfalarda sahibin adı ya da kişisel adres yok; bağlantılar sitede var; app-ads.txt AdMob satırı doğru;
// gizlilik sayfası oyunun gerçekten işlediği hizmetleri anar.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dosyalar, ADRES } from './yayin.mjs';

const D = dosyalar();
const SAYFALAR = [...D].filter(([y]) => y.endsWith('.html')).map(([y, b]) => [y, b.toString('utf8')]);
const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

test('yayınlanacak dosyalar', () => {
  assert.deepEqual([...D.keys()].sort(), ['/app-ads.txt', '/gizlilik.html', '/hesap-silme.html', '/icon-192.png', '/index.html', '/legal.css']);
  assert.equal(ADRES, 'https://kelime-bilcek.web.app');
});

test('app-ads.txt: AdMob yayıncı satırı', () => {
  assert.equal(D.get('/app-ads.txt').toString(), 'google.com, pub-2417242373034448, DIRECT, f08c47fec0942fa0\n');
});

test('sahibin adı, kişisel e-posta, MARFEN ve github.io adresi yok', () => {
  for (const [y, h] of SAYFALAR) {
    assert.doesNotMatch(h, /mahmut|tarı\b|tari\b|marfen|korfe|oyundar|github\.io|gmail\.com(?<!poyrazworkshop7@gmail\.com)/i, y);
    for (const m of h.matchAll(/[\w.+-]+@[\w.-]+/g)) assert.equal(m[0].replace(/\?.*$/, ''), 'poyrazworkshop7@gmail.com', `${y}: ${m[0]}`);
  }
});

test('iç bağlantılar sitede var', () => {
  for (const [y, h] of SAYFALAR) {
    for (const [, href] of h.matchAll(/(?:href|src)="([^"#:]+)(?:#[^"]*)?"/g)) {
      assert.ok(D.has('/' + href), `${y} → ${href}`);
    }
    assert.match(h, new RegExp(`<link rel="canonical" href="${ADRES}/`), y);
  }
});

test('gizlilik: Firebase, AdMob, Cloudflare, TDK, hesap silme, çocuklar, iletişim', () => {
  const g = D.get('/gizlilik.html').toString();
  for (const k of ['Firebase Authentication', 'Realtime Database', 'AdMob', 'Cloudflare', 'sozluk.gov.tr', 'Hesabı Sil', '13 yaş', 'KVKK', 'poyrazworkshop7@gmail.com', 'reklam kimliği']) {
    assert.ok(g.includes(k), k);
  }
});

test('hesap silme: uygulama içi yol ve e-posta yolu; uygulamadaki düğmeyle aynı ad', () => {
  const h = D.get('/hesap-silme.html').toString();
  assert.match(h, /🗑️ Hesabı Sil/);
  assert.match(h, /mailto:poyrazworkshop7@gmail\.com/);
  const oyun = fs.readFileSync(path.join(KOK, 'www', 'index.html'), 'utf8');
  assert.match(oyun, /id="deleteAccountBtn"[^>]*>[\s\S]{0,120}?Hesabı Sil</, 'oyundaki düğme (çöp kutusu simgesi + Hesabı Sil)');
  assert.match(oyun, /kelime-bilcek\.web\.app\/hesap-silme\.html/);
});
