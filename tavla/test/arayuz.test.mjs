// Arayüz denetimi: www/ yerel sunucuda, Google ve Firebase adresleri kapalıyken (canlı projeye yazılmaz).
// Menü, hesap penceresi (gizlilik, engellenenler, hesap silme) ve bilgisayara karşı oyun açılır; konsolda
// sayfa hatası olmamalı. Çalıştırma: npm test (Playwright + Chromium gerekir).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const KOK = fileURLToPath(new URL('../www/', import.meta.url));
const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.mp3': 'audio/mpeg' };
let sunucu, adres, tarayici;

before(async () => {
  sunucu = createServer(async (i, y) => {
    const yol = decodeURIComponent(new URL(i.url, 'http://x').pathname);
    try {
      const veri = await readFile(join(KOK, yol === '/' ? 'index.html' : yol));
      y.writeHead(200, { 'content-type': TUR[extname(yol)] || 'text/html' }).end(veri);
    } catch { y.writeHead(404).end(); }
  }).listen(0, '127.0.0.1');
  await new Promise((r) => sunucu.once('listening', r));
  adres = `http://127.0.0.1:${sunucu.address().port}/`;
  tarayici = await chromium.launch();
});
after(async () => { await tarayici?.close(); sunucu?.close(); });

// Uygulama yatay ekrana kilitli (AndroidManifest › sensorLandscape): telefon yatay ölçüleri.
async function sayfaAc(genislik = 800, yukseklik = 390) {
  const s = await tarayici.newPage({ viewport: { width: genislik, height: yukseklik } });
  const hatalar = [];
  // Ağ kapalıyken Firebase'in kendi 'network-request-failed' hatası beklenir; başka sayfa hatası olmamalı.
  s.on('pageerror', (e) => { if (!/network-request-failed/.test(String(e))) hatalar.push(String(e)); });
  await s.route(/googleapis|gstatic|google\.com|firebaseapp|dicebear/, (r) => r.abort());
  await s.goto(adres);
  await s.getByText('Bilgisayara Karşı').waitFor();
  return { s, hatalar };
}

test('menü açılır, alt bilgi sürümü gösterir, hata ayıklama kalıntısı yok', async () => {
  const { s, hatalar } = await sayfaAc();
  await s.getByText('Tavla 1.0.0 · Poyraz Workshop').waitFor();
  assert.equal(await s.getByText('pas-and-play').count(), 0);
  const tasma = await s.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  assert.equal(tasma, false, 'yatay taşma');
  assert.deepEqual(hatalar, []);
  await s.close();
});

test('hesap penceresinde gizlilik, iletişim, engellenenler ve hesap silme var', async () => {
  const { s, hatalar } = await sayfaAc(740, 340);
  await s.getByRole('button', { name: /Hesab/ }).first().click();
  await s.getByText('Gizlilik ve hesap').waitFor();
  const gizlilik = s.getByRole('link', { name: /Gizlilik/ });
  assert.equal(await gizlilik.getAttribute('href'), 'https://mahmuttari.github.io/Lispler/tavla/gizlilik.html');
  assert.equal(await s.getByRole('link', { name: /İletişim/ }).getAttribute('href'), 'mailto:mahmuttari@gmail.com');
  await s.getByText('Engellenenler').waitFor();
  await s.getByRole('button', { name: /Hesabı sil/ }).waitFor();
  assert.deepEqual(hatalar, []);
  await s.close();
});

test('bilgisayara karşı oyun başlar', async () => {
  const { s, hatalar } = await sayfaAc();
  await s.getByText('Bilgisayara Karşı').click();
  await s.locator('.die, .board, [class*=board]').first().waitFor({ timeout: 10000 });
  assert.deepEqual(hatalar, []);
  await s.close();
});
