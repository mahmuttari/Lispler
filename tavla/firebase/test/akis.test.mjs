// Uçtan uca akış: gerçek oyun kodu (www/) iki tarayıcıda, Firebase emülatöründe (Auth + Firestore), sıkı kurallarla.
// Ali oda kurar, Ayşe kodla katılır, Ali mesaj yazar; Ayşe şikâyet eder ve engeller (Ali'nin yeni mesajı görünmez),
// sonra Ayşe hesabını siler. Çalıştırma: cd tavla/firebase && npm run test:akis (Java 21, firebase-tools).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

const KOK = fileURLToPath(new URL('../../www/', import.meta.url));
const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };
const EMU = { auth: 'http://127.0.0.1:9099', firestoreHost: '127.0.0.1', firestorePort: 8080 };
let sunucu, adres, tarayici, ortam;

before(async () => {
  sunucu = createServer(async (i, y) => {
    const yol = decodeURIComponent(new URL(i.url, 'http://x').pathname);
    try { const veri = await readFile(join(KOK, yol === '/' ? 'index.html' : yol)); y.writeHead(200, { 'content-type': TUR[extname(yol)] || 'text/html' }).end(veri); }
    catch { y.writeHead(404).end(); }
  }).listen(0, '127.0.0.1');
  await new Promise((r) => sunucu.once('listening', r));
  adres = `http://127.0.0.1:${sunucu.address().port}/`;
  tarayici = await chromium.launch();
  ortam = await initializeTestEnvironment({ projectId: 'tavla-online-oyundar', firestore: { host: '127.0.0.1', port: 8080 } });
});
after(async () => { await tarayici?.close(); sunucu?.close(); await ortam?.cleanup(); });

async function oyuncu() {
  const b = await tarayici.newContext({ viewport: { width: 800, height: 390 } });
  const s = await b.newPage();
  const izinHatalari = [];
  s.on('console', (m) => { if (/permission|PERMISSION_DENIED|insufficient permissions/i.test(m.text())) izinHatalari.push(m.text().slice(0, 200)); });
  await s.addInitScript((e) => { window.__TAVLA_EMULATOR__ = e; }, EMU);
  await s.route(/dicebear|fonts\.g|apis\.google|recaptcha/, (r) => r.abort());
  await s.goto(adres);
  await s.getByText('Çevrimiçi').first().waitFor();
  await s.waitForFunction(() => Object.keys(localStorage).some((k) => k.startsWith('firebase:authUser')) || true);
  return { s, izinHatalari };
}
// withSecurityRulesDisabled sonucu döndürmez: değeri dışarı taşı
const yonetici = async (f) => { let v; await ortam.withSecurityRulesDisabled(async (c) => { v = await f(c.firestore()); }); return v; };

test('oda, sohbet, şikâyet, engelleme ve hesap silme kurallarla birlikte çalışır', { timeout: 180000 }, async () => {
  const ali = await oyuncu(), ayse = await oyuncu();
  try {

  // Ali oda kurar
  await ali.s.locator('.menu-label', { hasText: 'Çevrimiçi' }).click();
  await ali.s.getByText('Oda Kur (kod ile)').click();
  await ali.s.getByText('Oda Hazır').waitFor({ timeout: 20000 });
  const kod = await ali.s.evaluate(() => {
    const p = [...document.querySelectorAll('.lobby-info')].find((e) => e.textContent.includes('Bu kodu rakibine ilet'));
    return p?.nextElementSibling?.textContent.trim();
  });
  assert.match(kod, /^[A-HJ-NP-Z2-9]{4}$/);

  // Ayşe kodla katılır
  await ayse.s.locator('.menu-label', { hasText: 'Çevrimiçi' }).click();
  await ayse.s.getByText('Kodla Katıl').click();
  await ayse.s.locator('input').first().fill(kod);
  await ayse.s.getByRole('button', { name: 'Katıl', exact: true }).click();
  await ayse.s.getByRole('button', { name: 'Sohbet' }).waitFor({ timeout: 20000 });
  await ali.s.getByRole('button', { name: 'Sohbet' }).waitFor({ timeout: 20000 });

  // Ali mesaj yazar
  await ali.s.getByRole('button', { name: 'Sohbet' }).click();
  await ali.s.getByRole('textbox', { name: 'Mesaj' }).fill('Merhaba komşu');
  await ali.s.getByRole('button', { name: 'Gönder' }).click();

  // Ayşe görür, şikâyet eder ve engeller
  await ayse.s.getByRole('button', { name: 'Sohbet' }).click();
  await ayse.s.getByText(/^Mesajlar/).click();
  await ayse.s.getByText('Merhaba komşu').waitFor({ timeout: 15000 });
  await ayse.s.getByRole('button', { name: '⚠️ Şikâyet' }).click();
  await ayse.s.getByText('Küfür / hakaret').click();
  await ayse.s.getByRole('button', { name: 'Gönder' }).last().click();
  await ayse.s.getByText('✓ Şikâyetin alındı, teşekkürler.').waitFor({ timeout: 15000 });
  await ayse.s.getByText('🚫 Bu oyuncuyu engelledin.').waitFor();
  await ayse.s.getByText('Merhaba komşu').waitFor({ state: 'detached' });

  const sikayetler = await yonetici(async (d) => (await getDocs(collection(d, 'reports'))).docs.map((x) => x.data()));
  assert.equal(sikayetler.length, 1);
  assert.equal(sikayetler[0].reason, 'kufur');
  assert.deepEqual(sikayetler[0].messages, ['Merhaba komşu']);
  const ayseUid = sikayetler[0].fromUid, aliUid = sikayetler[0].againstUid;
  const engel = await yonetici((d) => getDoc(doc(d, 'users', ayseUid, 'engellenen', aliUid)));
  assert.ok(engel.exists(), 'engel kaydı yazıldı');

  // Ali'nin yeni mesajı Ayşe'de görünmez
  await ali.s.getByText(/^Mesajlar/).click();
  await ali.s.getByRole('textbox', { name: 'Mesaj' }).fill('İkinci mesaj');
  await ali.s.getByRole('button', { name: 'Gönder' }).click();
  await ali.s.getByText('İkinci mesaj').waitFor();
  await ayse.s.waitForTimeout(1500);
  assert.equal(await ayse.s.getByText('İkinci mesaj').count(), 0);

  // Ayşe hesabını siler (menüye dönüp hesap penceresinden)
  await ayse.s.getByRole('button', { name: 'Sohbeti kapat' }).click();
  await ayse.s.getByRole('button', { name: 'Menüye dön' }).first().click();
  ayse.s.on('dialog', (d) => d.accept());
  await ayse.s.getByRole('button', { name: /Hesab/ }).first().click();
  assert.deepEqual(ayse.izinHatalari, [], 'Ayşe tarafında silmeden önce izin hatası');
  await ayse.s.getByRole('button', { name: /Hesabı sil/ }).click();
  await ayse.s.getByText(/Hesabın ve bütün verilerin silindi|Verilerin silindi/).waitFor({ timeout: 20000 });

  const kalan = await yonetici(async (d) => ({
    kullanici: (await getDoc(doc(d, 'users', ayseUid))).exists(),
    engeller: (await getDocs(collection(d, 'users', ayseUid, 'engellenen'))).size,
    odalar: (await getDocs(collection(d, 'rooms'))).docs.filter((x) => x.data().guestUid === ayseUid || x.data().hostUid === ayseUid).length,
  }));
  assert.deepEqual(kalan, { kullanici: false, engeller: 0, odalar: 0 });
  // silmeden sonra uygulama kendini yeniden yükler; yeni anonim oturumda izin hatası olmamalı
  await ayse.s.waitForEvent('load', { timeout: 15000 });
  ayse.izinHatalari.length = 0;
  await ayse.s.getByText('Çevrimiçi').first().waitFor();
  await ayse.s.waitForTimeout(3000);
  assert.deepEqual(ayse.izinHatalari, [], 'Ayşe tarafında yeniden açılışta izin hatası');
  assert.deepEqual(ali.izinHatalari, [], 'Ali tarafında izin hatası');
  } catch (e) {
    // Hata anında iki ekranın görüntüsü (TAVLA_EKRAN klasörü verilmişse) ve izin hataları
    if (process.env.TAVLA_EKRAN) {
      await ali.s.screenshot({ path: `${process.env.TAVLA_EKRAN}/ali.png` });
      await ayse.s.screenshot({ path: `${process.env.TAVLA_EKRAN}/ayse.png` });
    }
    console.log('izin hataları', ali.izinHatalari, ayse.izinHatalari);
    throw e;
  }
});
