// Poyraz Workshop hesaplarının profil resmi (800×800; platformlar daireye kırpar, içerik ortadaki %70'te) ve YouTube
// kanal kapağı (2560×1440; her cihazda görünen güvenli alan ortadaki 1546×423). Logo: poyraz (kuzeydoğu rüzgârı) için
// üç rüzgâr çizgisi ve yazı. Kişi adı ya da başka marka içermez.
// Kullanım: node hayalet-avcilari/sosyal/profil.mjs   (Playwright + Chromium gerekir)
// Çıktı: sosyal/profil/profil-800.png, sosyal/profil/youtube-kapak-2560x1440.png
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CIKIS = path.join(KOK, 'sosyal', 'profil');
export const AD = 'Poyraz Workshop';

// Rüzgâr çizgileri (SVG), yazı tipi ölçüsüne göre büyür
const ruzgar = (w) => `<svg width="${w}" height="${w * 0.7}" viewBox="0 -25 200 140" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round">
  <path d="M10 30 H120 a20 20 0 1 0 -20 -20"/><path d="M10 55 H160 a20 20 0 1 1 -20 20"/><path d="M30 80 H95"/></svg>`;
const sayfa = (w, h, ic) => `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden;font-family:system-ui,sans-serif;color:#fff}
  body{background:radial-gradient(circle at 30% 25%,#4f46e5 0,#312e81 45%,#1e1b4b 100%);display:flex;align-items:center;justify-content:center}
  .ad{font-weight:900;letter-spacing:.06em;line-height:1}.alt{font-weight:600;letter-spacing:.32em;color:#c7d2fe;line-height:1}
  </style></head><body>${ic}</body></html>`;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
  const { chromium } = await import(pathToFileURL(PW).href);
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  fs.mkdirSync(CIKIS, { recursive: true });
  const cek = async (w, h, ic, ad) => {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.setContent(sayfa(w, h, ic));
    await p.waitForTimeout(150);
    await p.screenshot({ path: path.join(CIKIS, ad) });
    await p.close();
    console.log(path.join(CIKIS, ad));
  };
  try {
    await cek(800, 800, `<div style="display:flex;flex-direction:column;align-items:center;gap:26px">${ruzgar(250)}
      <div class="ad" style="font-size:92px">POYRAZ</div><div class="alt" style="font-size:40px">WORKSHOP</div></div>`, 'profil-800.png');
    await cek(2560, 1440, `<div style="display:flex;align-items:center;gap:56px">${ruzgar(300)}
      <div style="display:flex;flex-direction:column;gap:22px"><div class="ad" style="font-size:150px">POYRAZ</div>
      <div class="alt" style="font-size:58px">WORKSHOP</div></div></div>`, 'youtube-kapak-2560x1440.png');
  } finally {
    await b.close();
  }
}
