// Hayalet Avcıları: çevrimiçi tur sonu sıralaması ve kupa (3.13.0) — çevrimdışı sınama.
// Sıralama her oyuncunun kendi yakaladığı hayalete (oda kaydındaki av) göre; eşitlikte sıra paylaşılır (1, 1, 3); sayısı
// gelmeyen oyuncu (eski sürüm) sona "?" ile, sıralamaya girmez; sayısı bilinen tek oyuncuda sıra yazısı ve madalya yok.
// Kupa yalnız birinciye: en az 2 sayılı oyuncu ve en az 1 hayalet şartıyla; kupa sayısı kaydedilir ve menüde görünür.
// Tek kişilik oyunun sonuç ekranı değişmez.
// Uçtan uca (emülatörde üç oyuncu, kural): cevrimici.test.mjs.
// Çalıştırma: node hayalet-avcilari/test/siralama.test.mjs   (Playwright + Chromium; ağ ve Firebase gerekmez)
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

const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const hatalar = [];
try {
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('hayaletAvcilariDil', 'tr'); localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9'); });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForTimeout(300);

  // 1) Sıralama: av'a göre azalan; eşitlikte sıra paylaşılır ve kimliğe göre dizilir; sayısız oyuncu sonda, sırasız
  const sira = await p.evaluate(() => turSiralamasi(
    { u1: { name: 'Kiki' }, u2: { name: 'Mila', av: 12 }, u3: { name: 'Can', av: 9 }, u4: { name: 'Deniz', av: 12 }, u5: { name: 'Eski' } },
    'u1', 9, 'Kiki').map((s) => [s.uid, s.ad, s.av, s.sira, s.ben]));
  sina('sıralama hayalet sayısına göre, eşitlikte sıra paylaşılır, sayısı gelmeyen sonda', () => {
    assert.deepEqual(sira, [['u2', 'Mila', 12, 1, false], ['u4', 'Deniz', 12, 1, false], ['u1', 'Kiki', 9, 3, true], ['u3', 'Can', 9, 3, false], ['u5', 'Eski', null, null, false]]);
  });

  // 2) Kupa kuralı: birinci (eşitse hepsi), en az 2 sayılı oyuncu, birinci en az 1 hayalet
  const kupa = await p.evaluate(() => {
    const k = (oyuncular, ben, av) => kupaKazandimMi(turSiralamasi(oyuncular, ben, av, 'Ben'));
    const uc = { a: { name: 'A', av: 9 }, b: { name: 'B', av: 5 }, c: { name: 'C', av: 2 } };
    return {
      birinci: k(uc, 'a', 9), ikinci: k(uc, 'b', 5),
      berabere: [k({ a: { name: 'A', av: 9 }, b: { name: 'B', av: 9 }, c: { name: 'C', av: 2 } }, 'a', 9), k({ a: { name: 'A', av: 9 }, b: { name: 'B', av: 9 } }, 'b', 9)],
      yalniz: k({ a: { name: 'A' } }, 'a', 7),
      hepsiSifir: k({ a: { name: 'A' }, b: { name: 'B', av: 0 } }, 'a', 0),
      eskiSurum: k({ a: { name: 'A' }, b: { name: 'B' } }, 'a', 5),
      birHayalet: k({ a: { name: 'A' }, b: { name: 'B', av: 0 } }, 'a', 1),
    };
  });
  sina('kupa yalnız birinciye (berabereyse hepsine), en az 2 oyuncu ve 1 hayalet şartıyla', () => {
    assert.deepEqual(kupa, { birinci: true, ikinci: false, berabere: [true, true], yalniz: false, hepsiSifir: false, eskiSurum: false, birHayalet: true });
  });

  // Çevrimiçi tur sonu ekranı (turSonu'nun yaptığı gibi): sıralama listesi, sıra yazısı, kupa
  const turBitir = (oyuncular, av) => p.evaluate(([oyuncular, av]) => {
    startGame(); game.player.invuln = 1e9; game.totalCaught = av; online.uid = 'u1';
    oyunSonu(false, true, false, turSiralamasi(oyuncular, 'u1', av, 'Kiki'));
    const liste = document.getElementById('tur-siralama');
    return {
      yazi: document.getElementById('gameover-rank').textContent,
      gorunur: getComputedStyle(liste).display !== 'none',
      satirlar: [...liste.querySelectorAll('li')].map((li) => [li.querySelector('.ts-sira').textContent, li.querySelector('.ts-ad').textContent,
        li.querySelector('.ts-av').textContent, !!li.querySelector('.ts-kupa'), li.classList.contains('ben')]),
      kalin: !!liste.querySelector('.ts-ad b'),
      kupaYazi: document.getElementById('kupa-sayisi').textContent,
      kupa: save.kupa, kayitli: JSON.parse(localStorage.getItem(SAVE_KEY)).kupa,
    };
  }, [oyuncular, av]);

  // 3) Birinci: "Kupa senin!", kupa +1 ve kaydedilir; ad HTML olarak işlenmez
  await p.evaluate(() => { save.kupa = 2; persistSave(); });
  const bir = await turBitir({ u1: { name: 'Kiki' }, u2: { name: 'Mila', av: 5 }, u3: { name: '<b>Can</b>', av: 2 } }, 9);
  sina('birinci olunca "Kupa senin!", kupa sayısı artar ve kaydedilir', () => {
    assert.equal(bir.yazi, '🥇 Turu 1. bitirdin! 🏆 Kupa senin!');
    assert.ok(bir.gorunur);
    assert.deepEqual(bir.satirlar, [['🥇', 'Kiki', '9 👻', true, true], ['🥈', 'Mila', '5 👻', false, false], ['🥉', '<b>Can</b>', '2 👻', false, false]]);
    assert.equal(bir.kalin, false);
    assert.deepEqual([bir.kupa, bir.kayitli, bir.kupaYazi], [3, 3, '🏆 Kupaların: 3']);
  });

  // 4) Menüde kupa sayısı
  const menu = await p.evaluate(() => { quitToMenu(); refreshMenu(); return document.getElementById('menu-kupa').textContent; });
  sina('menüde kupa sayısı görünür', () => { assert.equal(menu, '3'); });

  // 5) İkinci: kupa yok, birincinin satırında kupa
  const iki = await turBitir({ u1: { name: 'Kiki' }, u2: { name: 'Mila', av: 12 }, u3: { name: 'Can', av: 2 } }, 9);
  sina('ikinci olunca "Turu 2. bitirdin", kupa birincide', () => {
    assert.equal(iki.yazi, '🥈 Turu 2. bitirdin!');
    assert.deepEqual(iki.satirlar.map((s) => [s[0], s[1], s[3]]), [['🥇', 'Mila', true], ['🥈', 'Kiki', false], ['🥉', 'Can', false]]);
    assert.deepEqual([iki.kupa, iki.kupaYazi], [3, '🏆 Kupaların: 3']);
  });

  // 6) Berabere birinci ve dördüncü sıra; sayısı gelmeyen oyuncu "?" ile sonda
  const ber = await turBitir({ u1: { name: 'Kiki' }, u2: { name: 'Mila', av: 9 }, u3: { name: 'Can', av: 2 } }, 9);
  const dort = await turBitir({ u1: { name: 'Kiki' }, u2: { name: 'Mila', av: 12 }, u3: { name: 'Can', av: 10 }, u4: { name: 'Deniz', av: 10 }, u5: { name: 'Eski' } }, 3);
  sina('berabere birincilerin ikisi de kupa alır; 4. sıra ve eski sürüm oyuncusu', () => {
    assert.equal(ber.yazi, '🥇 Turu 1. bitirdin! 🏆 Kupa senin!');
    assert.deepEqual(ber.satirlar.map((s) => [s[0], s[1], s[3]]), [['🥇', 'Kiki', true], ['🥇', 'Mila', true], ['🥉', 'Can', false]]);
    assert.equal(ber.kupa, 4);
    assert.equal(dort.yazi, '🏅 Turu 4. bitirdin!');
    assert.deepEqual(dort.satirlar.map((s) => [s[0], s[1], s[2]]), [['🥇', 'Mila', '12 👻'], ['🥈', 'Can', '10 👻'], ['🥈', 'Deniz', '10 👻'], ['4.', 'Kiki', '3 👻'], ['', 'Eski', '?']]);
    assert.equal(dort.kupa, 4);
  });

  // 7) Tek kişilik oyun: sıralama listesi yok, yerel Şampiyonlar yazısı sürer, kupa değişmez
  const tek = await p.evaluate(() => {
    startGame(); game.player.invuln = 1e9; game.totalCaught = 3; online.mode = null; online.roomId = null;
    endGame(false);
    return { gorunur: getComputedStyle(document.getElementById('tur-siralama')).display !== 'none', yazi: document.getElementById('gameover-rank').textContent, kupa: save.kupa };
  });
  sina('tek kişilik oyunda sıralama listesi yok, Şampiyonlar yazısı ve kupa değişmez', () => {
    assert.equal(tek.gorunur, false);
    assert.match(tek.yazi, /SIRA|sıra/);
    assert.equal(tek.kupa, 4);
  });

  // 8) Sayısı bilinen tek oyuncu (kurallar konsolda yayınlanmamış ya da ötekiler eski sürüm): sıra yazısı da madalya da
  //    yok (son inceleme: herkes kendi adının yanında 🥇 görüyordu), kupa değişmez
  const tekSayi = await turBitir({ u1: { name: 'Kiki' }, u2: { name: 'Mila' }, u3: { name: 'Can' } }, 7);
  sina('sayısı bilinen tek oyuncuda sıra yazısı ve madalya yok', () => {
    assert.equal(tekSayi.yazi, '');
    assert.deepEqual(tekSayi.satirlar, [['', 'Kiki', '7 👻', false, true], ['', 'Mila', '?', false, false], ['', 'Can', '?', false, false]]);
    assert.equal(tekSayi.kupa, 4);
  });

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
