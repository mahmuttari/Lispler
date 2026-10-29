// Dikey tanıtım videosu (1080×1920, 30 kare/sn, 26 sn): açılış kartı → Yeşil Orman → Mor Şato bossu → Dünya Turu'nun
// ilk durağı Türkiye (Efe hayalet, peri bacaları) → kapanış kartı. YouTube Shorts, TikTok ve Instagram Reels içindir.
// Oyun sanal saatle oynatılır: requestAnimationFrame ve performance.now betikten adım adım ilerletilir, her adımda tam
// çözünürlüklü kare alınır (gerçek zamanlı kayıttaki takılma ve düşük kalite olmaz). Oyuncu çember çizerek dolaşır,
// silah en yakın hayalete kendiliğinden ateş eder; can düşmez. Göstergeler oyunun dilindedir.
// Ses yok: oyunun müzikleri sunoapi.org'dan üretildi ve ticari kullanım hakkı yok (../README.md › 3.14.0 › Hak notu);
// müziği paylaşırken platformun kendi kütüphanesinden ekleyin (SOSYAL-PLAN.md). Dosyada sessiz bir ses izi bulunur.
// Kullanım: node hayalet-avcilari/sosyal/video.mjs [dil…]   (varsayılan tr en; Playwright, Chromium ve ffmpeg gerekir)
// Çıktı: sosyal/videolar/hayalet-avcilari-<dil>.mp4
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const WWW = path.join(KOK, 'www');
const REKLAM = JSON.parse(fs.readFileSync(path.join(KOK, 'reklam', 'metinler.json'), 'utf8'));
const SOSYAL = JSON.parse(fs.readFileSync(path.join(KOK, 'sosyal', 'metinler.json'), 'utf8'));
export const FPS = 30;
// Bölümler ve süreleri (sn)
export const KURGU = [
  { tur: 'kart', ad: 'acilis', sure: 2 },
  { tur: 'oyun', sahne: 'oyun', sure: 7 },
  { tur: 'oyun', sahne: 'boss', sure: 7 },
  { tur: 'oyun', sahne: 'tur', sure: 7 },
  { tur: 'kart', ad: 'kapanis', sure: 3 },
];

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const secim = process.argv.slice(2).length ? process.argv.slice(2) : ['tr', 'en'];
  for (const d of secim) if (!SOSYAL[d]?.video || !REKLAM[d]) throw new Error(`bilinmeyen dil: ${d}`);
  const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
  const { chromium } = await import(pathToFileURL(PW).href);
  const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg' };
  const sunucu = http.createServer((q, r) => {
    const f = path.join(WWW, decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html');
    if (!f.startsWith(WWW) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'content-type': TUR[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
  }).listen(0);
  const adres = `http://127.0.0.1:${sunucu.address().port}/index.html`;
  const ikon = 'data:image/png;base64,' + fs.readFileSync(path.join(WWW, 'icon-1024.png')).toString('base64');
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  const gecici = fs.mkdtempSync(path.join(process.env.VIDEO_GECICI || os.tmpdir(), 'hayalet-video-'));
  const ff = (...a) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...a]);

  // Sanal saat: oyun döngüsü rAF zaman damgası ve performance.now ile ilerler; __sanal() açınca ikisi de betiğe geçer
  const SAAT = () => {
    const gercekNow = performance.now.bind(performance), gercekRaf = window.requestAnimationFrame.bind(window);
    let sanal = 0, acik = false, kuyruk = [];
    performance.now = () => (acik ? sanal : gercekNow());
    window.requestAnimationFrame = (cb) => (acik ? kuyruk.push(cb) : gercekRaf(cb));
    window.__sanal = () => { sanal = gercekNow(); acik = true; };
    window.__adim = (ms) => { sanal += ms; const k = kuyruk; kuyruk = []; for (const cb of k) cb(sanal); };
  };

  // Sahneler: Yeşil Orman'da oyuncu çember çizerek dolaşır. Boss sahnelerinde boss ekranın üst kısmında sabit durur
  // (yapay zekâsı kadrajdan çıkıp oyuncunun üstüne biniyor), oyuncu altında sağa sola kayarak ateş eder.
  async function oyunCek(dil, sahne, sure, klasor) {
    const bossSahnesi = sahne !== 'oyun';
    const p = await b.newPage({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3 });
    await p.addInitScript((d) => { localStorage.setItem('hayaletAvcilariDil', d); }, dil);
    await p.addInitScript(SAAT);
    await p.route(/gstatic\.com|googleapis|firebase/, (r) => r.abort());
    await p.goto(adres, { waitUntil: 'load' });
    await p.addStyleTag({ content: '#joystick,#inv-btn,#inv-panel,.pause-btn,#weapon-bar{display:none!important}' });
    await p.waitForTimeout(800);
    await p.evaluate(() => {
      save.playerName = 'Kiki'; save.highestLevel = 7; persistSave();
      try { localStorage.setItem(VERSION_KEY, APP_VERSION); } catch (_) {}
    });
    await p.evaluate(([bolum, ulke, bossSahnesi]) => {
      if (ulke) startGame({ tur: true, ulke: ulkeKodla(ulke).sira });
      else { startGame(); game.level = bolum; buildWalls(); buildWaters(); buildHazards(); }
      game.bot = null;
      // Engellerin (Dünya Turu'nda ülkenin objelerinin) en çok göründüğü yer. Oyuncunun yolu (Yeşil Orman'da saat
      // yönünde çember, boss sahnesinde yatay gidip gelme) engelsiz olmalı ve görüş alanı yol boyunca dünyanın içinde
      // kalmalı (kenar çiti görünmesin); boss sahnesinde bossun yeri de duvarsızdır
      const W = game.W, H = game.H; let en = null;
      const R = (game.player.speed * (bossSahnesi ? 4 : 5)) / (2 * Math.PI);
      const yol = (x, y) => Array.from({ length: 24 }, (_, i) => {
        const q = (i / 24) * 2 * Math.PI;
        return bossSahnesi ? [x + R * Math.sin(q), y] : [x + R * Math.sin(q), y + R - R * Math.cos(q)];
      });
      const bos = ([x, y]) => !collidesWalls(x, y, 40) && !collidesWaters(x, y, 40) && !collidesSpikes(x, y, 40) && !collidesLavas(x, y, 40)
        && x - W / 2 > 30 && x + W / 2 < game.worldW - 30 && y - H / 2 > 30 && y + H / 2 < game.worldH - 30;
      for (let x = 200; x < game.worldW - 200; x += 30) for (let y = 200; y < game.worldH - 200; y += 30) {
        if (!yol(x, y).every(bos)) continue;
        if (bossSahnesi && collidesWalls(x, y - 120, 70)) continue;
        const tam = (k) => k.x > x - W / 2 && k.x + k.w < x + W / 2 && k.y > y - H / 2 && k.y + k.h < y + H / 2;
        const duvar = game.walls.slice(4).filter(tam).reduce((s, k) => s + (ulke && /^obje/.test(k.tur) ? 8 : 3), 0);
        const puan = duvar + game.waters.filter(tam).length * 3 + game.spikes.concat(game.lavas).filter(tam).length * 2;
        if (!en || puan > en.puan) en = { x, y, puan };
      }
      if (en) { game.player.x = en.x; game.player.y = en.y; }
      damagePlayer = () => {};
      game.player.invuln = 0;
      // Yükseltmeleri açılmış bir avcı (oyunda paralarla hasar, atış hızı ve menzil yükseltilir): hayaletler oyuncuya
      // ulaşmadan yakalanır, sayaç ve paralar artar
      game.player.damage *= 3; game.player.fireDelay *= 0.5;
      game.player.menzil = Math.max(game.player.range, 320);
      game.player.range = 1; // hazırlıkta ateş yok: hayaletler toplansın
      game.bossSpawnTimer = bossSahnesi ? 0.05 : 40; // boss sahnelerinde boss hemen gelir
    }, sahne === 'oyun' ? [8, null, false] : sahne === 'boss' ? [7, null, true] : [0, 'TR', true]);
    await p.waitForTimeout(sahne === 'oyun' ? 3000 : 1200);
    await p.evaluate((sahne) => {
      const P = game.player, bs = game.ghosts.find((g) => g.isBoss);
      if (bs) {
        // Ekrandaki öteki hayaletler kalkar, atışlar bossa gider. Mor Şato bossu videonun ortasında yenilir (para ve
        // elmas patlaması, "BOSS YENİLDİ"); Dünya Turu bossunun canı azalır ama video boyunca yenilmez
        window.__bossYeri = { x: P.x + 50, y: P.y - 120 }; // sol üstteki göstergelerin sağ altında
        bs.minionTimer = 1e9;
        bs.hp = bs.maxHp = sahne === 'boss' ? 20 : 300;
        game.ghosts = game.ghosts.filter((g) => g.isBoss || Math.abs(g.x - P.x) > game.W / 2 + 40 || Math.abs(g.y - P.y) > game.H / 2 + 40);
      }
      // Oyuncunun üstüne binmiş hayalet kareyi bozar
      game.ghosts = game.ghosts.filter((g) => g.isBoss || Math.hypot(g.x - P.x, g.y - P.y) > 110);
      P.range = P.menzil;
      window.__sanal();
    }, sahne);
    const kare = Math.round(sure * FPS);
    for (let i = 0; i < kare; i++) {
      await p.evaluate(([t, bossSahnesi]) => {
        const a = (t / (bossSahnesi ? 4 : 5)) * 2 * Math.PI;
        // Yön vektörü oyunun joystick girdisiyle aynı biçimde: Yeşil Orman'da 5 sn'de bir tam çember, boss sahnesinde
        // 4 sn'de bir sağa sola gidip gelme
        game.inputDir.x = Math.cos(a); game.inputDir.y = bossSahnesi ? 0 : Math.sin(a);
        game.player.invuln = 0;
        const bs = game.ghosts.find((g) => g.isBoss);
        if (bs && window.__bossYeri) { bs.x = window.__bossYeri.x; bs.y = window.__bossYeri.y; }
        window.__adim(1000 / 30);
      }, [i / FPS, bossSahnesi]);
      await p.screenshot({ path: path.join(klasor, `k${String(i).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 92 });
    }
    await p.close();
  }

  // Kart ve alt yazı katmanları (1080×1920 PNG)
  async function katman(html, dosya, saydam) {
    const t = await b.newPage({ viewport: { width: 1080, height: 1920 } });
    await t.setContent(html);
    await t.waitForTimeout(150);
    await t.screenshot({ path: dosya, omitBackground: saydam });
    await t.close();
  }
  const stil = (dil) => `<style>html,body{margin:0;width:1080px;height:1920px;overflow:hidden;font-family:system-ui,sans-serif;color:#fff}
    .kart{width:1080px;height:1920px;background:radial-gradient(circle at 50% 38%,#5b2a9e 0,#2a1150 50%,#1a0b2e 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:56px;text-align:center}
    .kart img{width:440px;height:440px;border-radius:22%;box-shadow:0 24px 70px rgba(0,0,0,.6)}
    h1{margin:0;font-size:${REKLAM[dil].ad.length > 14 ? 92 : 118}px;font-weight:900;line-height:1.05;padding:0 60px;text-shadow:0 8px 0 #3b0764,0 12px 36px rgba(0,0,0,.6)}
    p{margin:0;font-size:62px;font-weight:800;color:#fde047;text-shadow:0 4px 0 #3b0764}
    .ara{font-size:46px;color:#e9d5ff;font-weight:700}
    .yazi{position:absolute;left:60px;right:60px;bottom:230px;text-align:center}
    .yazi span{display:inline-block;padding:22px 44px;border-radius:999px;background:rgba(26,11,46,.82);border:4px solid #fde047;font-size:64px;font-weight:900}</style>`;

  try {
    for (const dil of secim) {
      const yon = dil === 'ar' ? 'rtl' : 'ltr';
      const m = REKLAM[dil], v = SOSYAL[dil].video;
      const klasor = fs.mkdtempSync(path.join(gecici, dil + '-'));
      await katman(`<!doctype html><html dir="${yon}"><head><meta charset="utf-8">${stil(dil)}</head><body><div class="kart"><img src="${ikon}"><h1>${m.ad}</h1></div></body></html>`, path.join(klasor, 'acilis.png'));
      await katman(`<!doctype html><html dir="${yon}"><head><meta charset="utf-8">${stil(dil)}</head><body><div class="kart"><img src="${ikon}"><h1>${m.ad}</h1><p>${v.son}</p><div class="ara">${v.ara}</div></div></body></html>`, path.join(klasor, 'kapanis.png'));
      const parcalar = [];
      for (const [i, k] of KURGU.entries()) {
        const cikis = path.join(klasor, `parca${i}.mp4`);
        const kod = ['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-crf', '23', '-preset', 'medium'];
        if (k.tur === 'kart') {
          // Kart hafifçe yakınlaşır (hareketsiz kare platformlarda donmuş görünür)
          const n = k.sure * FPS;
          ff('-loop', '1', '-i', path.join(klasor, k.ad + '.png'), '-vf', `scale=2160:3840,zoompan=z='1+0.04*on/${n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${n}:s=1080x1920:fps=${FPS}`, '-frames:v', String(n), ...kod, cikis);
        } else {
          const kareler = path.join(klasor, k.sahne);
          fs.mkdirSync(kareler);
          await oyunCek(dil, k.sahne, k.sure, kareler);
          const yazi = path.join(klasor, k.sahne + '-yazi.png');
          await katman(`<!doctype html><html dir="${yon}"><head><meta charset="utf-8">${stil(dil)}</head><body style="background:transparent"><div class="yazi"><span>${m.sahne[k.sahne]}</span></div></body></html>`, yazi, true);
          ff('-framerate', String(FPS), '-i', path.join(kareler, 'k%04d.jpg'), '-i', yazi, '-filter_complex', '[0][1]overlay=0:0', ...kod, cikis);
          fs.rmSync(kareler, { recursive: true });
        }
        parcalar.push(cikis);
        console.log(`${dil}: ${k.tur === 'kart' ? k.ad : k.sahne} (${k.sure} sn)`);
      }
      const liste = path.join(klasor, 'liste.txt');
      fs.writeFileSync(liste, parcalar.map((p) => `file '${p}'`).join('\n'));
      const hedef = path.join(KOK, 'sosyal', 'videolar', `hayalet-avcilari-${dil}.mp4`);
      fs.mkdirSync(path.dirname(hedef), { recursive: true });
      // Sessiz ses izi: bazı platformlar sessiz izi olmayan videoda müzik eklemeyi sorunlu yapıyor
      ff('-f', 'concat', '-safe', '0', '-i', liste, '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
        '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '64k', '-shortest', '-movflags', '+faststart', hedef);
      console.log(`${dil}: ${hedef} (${(fs.statSync(hedef).size / 1048576).toFixed(1)} MB)`);
    }
  } finally {
    await b.close();
    sunucu.close();
    fs.rmSync(gecici, { recursive: true, force: true });
  }
}
