#!/usr/bin/env node
// Tavla — Google Play görselleri (Playwright + Chromium). Uygulamanın kendisi (www/) yerel sunucuda, Google/Firebase
// adresleri kapalıyken açılır (misafir görünümü; canlı projeye bir şey yazılmaz).
//   node tavla/araclar/magaza-gorsel.mjs   → tavla/magaza/play/
// Çıktılar: simge-512.png ve tanitim-gorseli-1024x500.png (kaynak: araclar/kaynak/*.svg, tanitim.html),
// telefon-1…6-*.png (yatay 1920×1080; uygulama yatay ekrana kilitli).
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const KOK = fileURLToPath(new URL('../', import.meta.url));
const WWW = join(KOK, 'www');
const CIKTI = join(KOK, 'magaza', 'play');
const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.mp3': 'audio/mpeg' };

const sunucu = createServer(async (i, y) => {
  const yol = decodeURIComponent(new URL(i.url, 'http://x').pathname);
  const dosya = yol.startsWith('/__kaynak/') ? join(KOK, 'araclar', 'kaynak', yol.slice(10)) : join(WWW, yol === '/' ? 'index.html' : yol);
  try { const veri = await readFile(dosya); y.writeHead(200, { 'content-type': TUR[extname(dosya)] || 'text/html' }).end(veri); }
  catch { y.writeHead(404).end(); }
}).listen(0, '127.0.0.1');
await new Promise((r) => sunucu.once('listening', r));
const ADRES = `http://127.0.0.1:${sunucu.address().port}/`;
await mkdir(CIKTI, { recursive: true });
const tarayici = await chromium.launch();

async function sayfa(ayarlar = {}) {
  const s = await tarayici.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 2 });
  // Avatarlar uygulama içinde çizilir (1.0.1); Google/Firebase kapalı
  await s.route(/googleapis|gstatic|google\.com|firebaseapp/, (r) => r.abort());
  await s.addInitScript((a) => { for (const [k, v] of Object.entries(a)) localStorage.setItem(k, v); }, {
    tavla_rumuz: 'Kahveci', tavla_mac_hedefi: '5', ...ayarlar,
  });
  await s.goto(ADRES);
  await s.getByText('Bilgisayara Karşı').first().waitFor();
  await s.waitForTimeout(800);
  return s;
}
const kaydet = async (s, ad) => { await s.screenshot({ path: join(CIKTI, ad) }); console.log(ad); };

// 1. Menü
{ const s = await sayfa({ tavla_ai_aktif: '1', tavla_ai_kisilik: 'dayi' }); await kaydet(s, 'telefon-1-menu.png'); await s.close(); }

// 2. Bilgisayara karşı, Pala Dayı yorumda (zar atılmış)
{
  const s = await sayfa({ tavla_ai_aktif: '1', tavla_ai_kisilik: 'dayi', tavla_ai_modu: 'text' });
  await s.locator('.menu-label', { hasText: 'Bilgisayara Karşı' }).click();
  await s.waitForTimeout(1200);
  const at = s.getByRole('button', { name: /Zar At|At/ }).first();
  if (await at.count()) { await at.click().catch(() => {}); await s.waitForTimeout(1500); }
  await kaydet(s, 'telefon-2-pala-dayi.png'); await s.close();
}

// 3. Yorumcu ayarları (karakter seçimi)
{
  const s = await sayfa({ tavla_ai_aktif: '1', tavla_ai_kisilik: 'genc' });
  await s.getByRole('button', { name: 'ayarla' }).click();
  await s.getByText('AI Yorumcu Ayarları').waitFor();
  await kaydet(s, 'telefon-3-yorumcular.png'); await s.close();
}

// 4. Görünüm ayarları
{
  const s = await sayfa({ tavla_pul_temasi: 'jewel', tavla_tahta_deseni: 'royal', tavla_masa_ortusu: 'navy' });
  await s.locator('.menu-name-edit', { hasText: 'değiştir' }).nth(1).click();
  await s.getByText('Görünüm Ayarları').waitFor();
  await kaydet(s, 'telefon-4-gorunum.png'); await s.close();
}

// 5. Çevrimiçi lobi
{
  const s = await sayfa();
  await s.locator('.menu-label', { hasText: 'Çevrimiçi' }).click();
  await s.getByText('🎲 Hızlı Eşleşme').waitFor();
  await kaydet(s, 'telefon-5-cevrimici.png'); await s.close();
}

// 6. İki oyunculu, mücevher pullar
{
  const s = await sayfa({ tavla_pul_temasi: 'marble', tavla_masa_ortusu: 'wood' });
  await s.locator('.menu-label', { hasText: 'İki Oyunculu' }).click();
  await s.waitForTimeout(1500);
  await kaydet(s, 'telefon-6-iki-oyunculu.png'); await s.close();
}

// Simge 512×512: araclar/kaynak/simge.svg (uyarlanabilir simgenin ön + arka katmanı; Android katmanları simge-uret.mjs ile)
// Play kare ister, köşeleri kendisi yuvarlar.
{
  const s = await tarayici.newPage({ viewport: { width: 512, height: 512 } });
  await s.goto(`${ADRES}__kaynak/simge.svg`);
  await s.screenshot({ path: join(CIKTI, 'simge-512.png'), clip: { x: 0, y: 0, width: 512, height: 512 } });
  console.log('simge-512.png'); await s.close();
}

// Tanıtım görseli 1024×500: araclar/kaynak/tanitim.html (elle yazılmış SVG, yerel yazı tipleri)
{
  const s = await tarayici.newPage({ viewport: { width: 1024, height: 500 } });
  await s.goto(`${ADRES}__kaynak/tanitim.html`);
  await s.waitForLoadState('networkidle');
  await s.screenshot({ path: join(CIKTI, 'tanitim-gorseli-1024x500.png'), clip: { x: 0, y: 0, width: 1024, height: 500 } });
  console.log('tanitim-gorseli-1024x500.png'); await s.close();
}

await tarayici.close(); sunucu.close();
