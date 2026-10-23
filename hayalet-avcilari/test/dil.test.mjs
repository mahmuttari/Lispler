// Hayalet Avcıları: her dilde bütün ekranları açar; çevrilmemiş Türkçe metin, yatay taşma ve sayfa hatası arar.
// Çalıştırma: node hayalet-avcilari/test/dil.test.mjs [dil…] [--ekran <klasör>]   (Playwright + Chromium gerekir)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WWW = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);
const arg = process.argv.slice(2);
const ei = arg.indexOf('--ekran');
const EKRAN = ei >= 0 ? arg.splice(ei, 2)[1] : null;
const DILLER = arg.length ? arg : ['en', 'es', 'zh', 'hi', 'ar', 'tr'];
const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.m4a': 'audio/mp4' };
const sunucu = http.createServer((q, r) => {
  const f = path.join(WWW, decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html');
  if (!f.startsWith(WWW) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': TUR[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(0);
const adres = `http://127.0.0.1:${sunucu.address().port}/index.html`;
// Türkçeye özgü harfler ve sık sözcükler (oyuncu adı "Avcı" gibi kullanıcı verisi hariç tutulur)
const TURKCE = /[ğışĞİŞ]|\b(Bölüm|Geri|Mağaza|Karakterler|Hesap|Oda|oyuncu|Tamam|Ses)\b/;

const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const sorunlar = [];
try {
  for (const dil of DILLER) {
    for (const genislik of [390, 340]) {
      const p = await b.newPage({ viewport: { width: genislik, height: 780 }, deviceScaleFactor: 1 });
      const hatalar = [];
      p.on('pageerror', (e) => hatalar.push(e.message));
      await p.addInitScript((d) => { localStorage.setItem('hayaletAvcilariDil', d); }, dil);
      await p.route(/gstatic\.com|googleapis|firebase/, (r) => r.abort());
      await p.goto(adres, { waitUntil: 'load' });
      await p.waitForTimeout(300);
      const ekranlar = {
        karsilama: () => {},
        isim: () => { openName(false); },
        menu: () => { save.playerName = 'Kiki'; persistSave(); showScreen('screen-menu'); refreshMenu(); },
        karakterler: () => openCharacters(),
        magaza_guc: () => { openShop(); showShopTab('upgrades'); },
        magaza_kostum: () => showShopTab('costumes'),
        magaza_cephane: () => showShopTab('ammo'),
        magaza_silah: () => showShopTab('guns'),
        sampiyonlar: () => { openLeaderboard(); setLeaderboardSource('local'); },
        hesap: () => openAccount(),
        ses: () => { showScreen('screen-menu'); openSoundSettings(); },
        online: () => { closeSoundSettings(); openOnline(); },
        oda_kur: () => openCreateRoom(),
        oda_listesi: () => { openRoomList(); renderRoomList(null); },
        lobi: () => { // 3.12.2: dolu 6 kişilik oda
          listeyiKapat();
          const players = {};
          [['Kiki', 'kinkin'], ['Mila', 'veryi'], ['Can', 'kornet'], ['Deniz', 'mark'], ['Ece', 'kent'], ['Omer', 'ponko']].forEach(([name, charKey], i) => {
            players[`u${i + 1}`] = { name, charKey, costumeIdx: 0, ready: i % 2 === 0, joinedAt: i + 1 };
          });
          Object.assign(online, { uid: 'u1', roomId: 'K7PQ2X', isHost: true, cachedRoom: { name: 'Kiki', maxPlayers: 6, hostUid: 'u1', status: 'lobby', players } });
          showScreen('screen-lobby'); renderLobby();
        },
        dil: () => { online.roomId = null; online.cachedRoom = null; showScreen('screen-menu'); openLanguage(); },
        guncelleme: () => { closeLanguage(); showUpdateModal(APP_VERSION, UPDATE_NOTES[APP_VERSION]); },
        oyun: () => { dismissUpdateModal(); startGame(); game.player.invuln = 1e9; },
        duraklat: () => pauseGame(),
        oyun_takim: () => { // 6 kişilik çevrimiçi oyunda takım göstergesi (biri hayalet)
          resumeGame();
          const { x, y } = game.player;
          Object.assign(online, { mode: 'host', uid: 'u1', roomId: 'K7PQ2X', cachedRoom: { name: 'Kiki', maxPlayers: 6, hostUid: 'u1', status: 'playing', players: {} } });
          online.remotePlayers = {};
          [['Mila', 'veryi'], ['Can', 'kornet'], ['Deniz', 'mark'], ['Ece', 'kent'], ['Omer', 'ponko']].forEach(([name, charKey], i) => {
            online.remotePlayers[`u${i + 2}`] = { name, charKey, costumeIdx: 0, hp: 3 - (i % 3), maxHp: 3, dead: i === 4 ? 1 : 0, x: x + 60 * (i - 2), y: y + 60 };
          });
        },
        duraklat_cevrimici: () => { pauseGame(); },
        bitti: () => { resumeGame(); online.mode = null; online.roomId = null; endGame(false); },
        tur_sonu: () => { startGame(); game.player.invuln = 1e9; oyunSonu(false, true); },
      };
      for (const [ad, ac] of Object.entries(ekranlar)) {
        await p.evaluate(`(${ac.toString()})()`);
        await p.waitForTimeout(ad === 'oyun' ? 2500 : ad === 'oyun_takim' ? 600 : 200);
        const r = await p.evaluate(() => {
          const gorunur = [...document.querySelectorAll('.screen.active, #toast, .toast')].map((e) => e.innerText).join('\n');
          const tasan = document.documentElement.scrollWidth > window.innerWidth + 1;
          return { metin: gorunur.replace(/Kiki|Avcı|Kinkin|Güllu/g, ''), tasan, yon: document.documentElement.dir };
        });
        if (dil !== 'tr') {
          const satir = r.metin.split('\n').find((s) => TURKCE.test(s));
          if (satir) sorunlar.push(`${dil} ${genislik}px ${ad}: çevrilmemiş metin: ${satir.trim().slice(0, 80)}`);
        }
        if (r.tasan) sorunlar.push(`${dil} ${genislik}px ${ad}: yatay taşma`);
        if (dil === 'ar' && r.yon !== 'rtl') sorunlar.push(`ar: dir=rtl değil`);
        if (EKRAN && genislik === 390) { fs.mkdirSync(EKRAN, { recursive: true }); await p.screenshot({ path: path.join(EKRAN, `${dil}-${ad}.png`) }); }
      }
      hatalar.forEach((h) => sorunlar.push(`${dil} ${genislik}px sayfa hatası: ${h}`));
      await p.close();
    }
  }
} finally {
  await b.close();
  sunucu.close();
}
sorunlar.forEach((s) => console.log('SORUN', s));
assert.equal(sorunlar.length, 0, `${sorunlar.length} sorun`);
console.log(`TAMAM: ${DILLER.join(', ')} — bütün ekranlar çevrili, taşma ve sayfa hatası yok`);
