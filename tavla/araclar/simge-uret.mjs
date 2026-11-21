#!/usr/bin/env node
// Tavla — uygulama simgesi ve açılış ekranı (Playwright + Chromium). Kaynak: araclar/kaynak/simge-on.svg (ön katman,
// şeffaf) ve simge-arka.svg (arka katman); ikisi de 512×512 tuval = uyarlanabilir simgenin 108 dp'lik bütün karesi.
//   node tavla/araclar/simge-uret.mjs
// Çıktılar (android/app/src/main/res/):
//   mipmap-*/ic_launcher_foreground.png, ic_launcher_background.png  uyarlanabilir simge katmanları (108 dp)
//   mipmap-*/ic_launcher.png, ic_launcher_round.png                  eski Android (< 8) için, görünen 72 dp'lik orta alan
//   drawable*/splash.png                                              Android < 12 açılış ekranı (koyu zemin, ortada simge)
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const KOK = fileURLToPath(new URL('../', import.meta.url));
const KAYNAK = join(KOK, 'araclar', 'kaynak');
const RES = join(KOK, 'android', 'app', 'src', 'main', 'res');
const ZEMIN = '#1c1009'; // simge-arka.svg'nin kenar rengi; values/ic_launcher_background.xml ve açılış ekranıyla aynı

const veri = async (ad) => `data:image/svg+xml;base64,${(await readFile(join(KAYNAK, ad))).toString('base64')}`;
const ON = await veri('simge-on.svg');
const ARKA = await veri('simge-arka.svg');

const tarayici = await chromium.launch();
const sayfa = await tarayici.newPage({ deviceScaleFactor: 1 });

// Bir HTML parçasını tam w×h piksel PNG olarak kaydeder (şeffaflık korunur).
async function ciz(yol, w, h, govde) {
  await sayfa.setViewportSize({ width: w, height: h });
  await sayfa.setContent(`<!doctype html><body style="margin:0;background:transparent">
    <div style="position:relative;width:${w}px;height:${h}px;overflow:hidden">${govde}</div></body>`);
  await sayfa.evaluate(() => Promise.all([...document.images].map((i) => i.decode())));
  await sayfa.screenshot({ path: yol, omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
}
const katman = (src, boyut, kaydir = 0) =>
  `<img src="${src}" style="position:absolute;left:${kaydir}px;top:${kaydir}px;width:${boyut}px;height:${boyut}px">`;

// Görünen alan: 108 dp'nin ortasındaki 72 dp (2/3). Eski simgede bu alan bütün kareyi doldurur.
function eskiSimge(boyut, yuvarlak) {
  const tuval = Math.round(boyut * 1.5);
  const kaydir = -Math.round((tuval - boyut) / 2);
  const maske = yuvarlak ? 'border-radius:50%' : `border-radius:${Math.round(boyut * 0.18)}px`;
  return `<div style="position:absolute;inset:0;overflow:hidden;${maske}">${katman(ARKA, tuval, kaydir)}${katman(ON, tuval, kaydir)}</div>`;
}

const YOGUNLUK = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [ad, k] of Object.entries(YOGUNLUK)) {
  const klasor = join(RES, `mipmap-${ad}`);
  const katmanBoyu = Math.round(108 * k);
  const eskiBoy = Math.round(48 * k);
  await ciz(join(klasor, 'ic_launcher_foreground.png'), katmanBoyu, katmanBoyu, katman(ON, katmanBoyu));
  await ciz(join(klasor, 'ic_launcher_background.png'), katmanBoyu, katmanBoyu, katman(ARKA, katmanBoyu));
  await ciz(join(klasor, 'ic_launcher.png'), eskiBoy, eskiBoy, eskiSimge(eskiBoy, false));
  await ciz(join(klasor, 'ic_launcher_round.png'), eskiBoy, eskiBoy, eskiSimge(eskiBoy, true));
  console.log(`mipmap-${ad}`);
}

// Açılış ekranı (Android < 12): koyu zemin, ortada yuvarlak köşeli simge
const ACILIS = {
  drawable: [320, 480],
  'drawable-port-mdpi': [320, 480], 'drawable-port-hdpi': [480, 800], 'drawable-port-xhdpi': [720, 1280],
  'drawable-port-xxhdpi': [960, 1600], 'drawable-port-xxxhdpi': [1280, 1920],
  'drawable-land-mdpi': [480, 320], 'drawable-land-hdpi': [800, 480], 'drawable-land-xhdpi': [1280, 720],
  'drawable-land-xxhdpi': [1600, 960], 'drawable-land-xxxhdpi': [1920, 1280],
};
for (const [klasor, [w, h]] of Object.entries(ACILIS)) {
  const boy = Math.round(Math.min(w, h) * 0.36);
  await ciz(join(RES, klasor, 'splash.png'), w, h, `<div style="position:absolute;inset:0;background:${ZEMIN}"></div>
    <div style="position:absolute;left:${Math.round((w - boy) / 2)}px;top:${Math.round((h - boy) / 2)}px;width:${boy}px;height:${boy}px;
      box-shadow:0 ${Math.round(boy * 0.04)}px ${Math.round(boy * 0.12)}px rgba(0,0,0,.55);border-radius:${Math.round(boy * 0.18)}px">
      ${eskiSimge(boy, false)}</div>`);
  console.log(`${klasor}/splash.png`);
}

await tarayici.close();
