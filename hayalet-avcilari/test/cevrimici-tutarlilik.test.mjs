// Hayalet Avcıları: çevrimiçi tutarlılık düzeltmeleri (F2).
// Ortadan katılan istemci ödül/rekor almaz; hayalet oyuncu silah/kasırga kullanamaz; istemci temas kuralları
// kurucuyla aynı; Güllü patlaması öldürenin gücüne bağlı; güç yıldızı ve roket hedefi kurucuda tutarlı.
// Çalıştırma: NO_PROXY='*' node test/cevrimici-tutarlilik.test.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WWW = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(PW).href);
const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2', '.webp': 'image/webp', '.m4a': 'audio/mp4' };
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
  const p = await b.newPage({ viewport: { width: 844, height: 390 } });
  p.on('pageerror', (e) => hatalar.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('hayaletAvcilariDil', 'tr'); localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9'); });
  await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
  await p.goto(adres, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof startGame === 'function' && typeof killGhost === 'function');
  await p.evaluate(() => {
    // Ağsız sınama: bulut skoru gönderme
    window.submitOnlineScore = () => {};
    window.__hazir = (mod) => {
      startGame(); game.paused = false; game.spawnTimer = 1e9; game.bot = null;
      online.mode = mod || null; online.pendingEvents = []; online.vurduklarim = new Map();
      online.remotePlayers = {};
      game.ghosts = []; game.pickups = []; game.projectiles = []; game.enemyProjectiles = []; game.effects = []; game.particles = [];
      game.player.dead = false; game.player.invuln = 0; game.player.hp = 3; game.player.maxHp = 3;
      game.player.gizli = false; game.player.power = null; game.player.kasirgaUntil = 0;
      game.baslangicBolum = mod === 'client' ? null : 1;
      AE.efektler.length = 0; AE.ekran.length = 0; animEfektleri.length = 0;
      const stok = ensureAmmoStock(game.player.charKey); for (const k in WEAPONS) stok[k] = 3;
      return game;
    };
    window.__hayalet = (dx = 100, hp = 100) => {
      const g = { x: game.player.x + dx, y: game.player.y, r: 22, speed: 0, hp, maxHp: hp, size: 40, nextSound: 1e12 };
      return g;
    };
    window.__guc = (type) => { game.player.power = { type, expires: performance.now() + 1e9 }; };
  });

  // 3) Ortadan katılan istemci: ilk durumun bölümü başlangıç sayılır; geçmediği bölümün ödülü/rekoru yok
  const ortadan = await p.evaluate(() => {
    __hazir('client');
    online.sonDurum = 0;
    durumGeldi({ lvl: 20, bd: false, bt: 0, lt: false, g: [], e: [], p: [] });
    const bas = game.baslangicBolum, lvl = game.level;
    save.highestLevel = 5; save.para = 0;
    game.runPara = 0; game.runElmas = 0; game.runZumrut = 0; game.totalCaught = 0; game.dunyaTuru = false;
    const paraOnce = save.para;
    oyunSonu(false, false, true);
    return { bas, lvl, yuksek: save.highestLevel, paraFarki: save.para - paraOnce };
  });
  sina('ortadan katılan istemci (ilk bölüm 20) bölüm ödülü almaz, en yüksek bölüm değişmez', () => {
    assert.equal(ortadan.bas, 20);
    assert.equal(ortadan.lvl, 20);
    assert.equal(ortadan.yuksek, 5);
    assert.equal(ortadan.paraFarki, 0);
  });

  // 5) Hayalet (ölü) oyuncu ekstra silah kullanamaz; ilk yardım canını artırmaz; silah çubuğu pasif
  const oluSilah = await p.evaluate(() => {
    __hazir(null);
    game.player.dead = true; game.player.hp = 1;
    const stok = ensureAmmoStock(game.player.charKey); stok.ilkyrd = 3;
    useWeapon('ilkyrd');
    refreshWeaponBar();
    const btn = document.querySelector('#weapon-bar .weapon-slot');
    return { hp: game.player.hp, stok: stok.ilkyrd, pasif: btn ? btn.classList.contains('ae-pasif') : null, aria: btn ? btn.getAttribute('aria-disabled') : null };
  });
  sina('ölü oyuncu ilk yardım kullanamaz (stok ve can değişmez), silah çubuğu pasif', () => {
    assert.equal(oluSilah.hp, 1);
    assert.equal(oluSilah.stok, 3);
    assert.equal(oluSilah.pasif, true);
    assert.equal(oluSilah.aria, 'true');
  });

  // 5) Ölü kurucunun kasırgası hayalete hasar vermez
  const oluKasirga = await p.evaluate(() => {
    __hazir('host');
    game.player.dead = true;
    game.player.kasirgaUntil = performance.now() + 8000;
    const g = __hayalet(50, 100); game.ghosts = [g];
    const once = g.hp;
    update(1, performance.now());
    return { once, sonra: g.hp, kaldi: game.ghosts.includes(g) };
  });
  sina('ölü kurucunun kasırgası 1 sn güncellemede hayalet canını düşürmez', () => {
    assert.equal(oluKasirga.kaldi, true);
    assert.equal(oluKasirga.sonra, oluKasirga.once);
  });

  // 6) İstemci temasında donmuş / kasırgadaki hayalet ve çalıda saklanma hasar vermez
  const istemciTemas = await p.evaluate(() => {
    const calistir = (ayar) => {
      __hazir('client');
      if (ayar.gizli) { const c = calilarHazir()[0]; game.player.x = c.x; game.player.y = c.y; }
      const g = __hayalet(2, 100); game.ghosts = [g];
      const now = performance.now();
      if (ayar.donmus) g.frozenUntil = now + 5000;
      if (ayar.kasirga) game.player.kasirgaUntil = now + 5000;
      if (ayar.gizli) game.player.gizli = true;
      const once = game.player.hp;
      update(0.016, now);
      return once - game.player.hp;
    };
    return { donmus: calistir({ donmus: true }), kasirga: calistir({ kasirga: true }), gizli: calistir({ gizli: true }) };
  });
  sina('istemcide donmuş hayalet teması can götürmez', () => assert.equal(istemciTemas.donmus, 0));
  sina('istemcide kasırgaya yakalanan hayalet teması can götürmez', () => assert.equal(istemciTemas.kasirga, 0));
  sina('istemcide çalıda saklanırken temas can götürmez', () => assert.equal(istemciTemas.gizli, 0));

  // 7a) Host'ta Güllü gücü yalnız yerel oyuncunun öldürdüğü hayalette patlar
  const gulHost = await p.evaluate(() => {
    __hazir('host'); __guc('gul');
    const uzak = __hayalet(0, 1); uzak.uzakVurdu = true;
    const yakin = __hayalet(40, 100);
    game.ghosts = [uzak, yakin];
    killGhost(uzak, game.ghosts.indexOf(uzak));
    const uzakSonuc = yakin.hp;
    __hazir('host'); __guc('gul');
    const yerel = __hayalet(0, 1);
    const yakin2 = __hayalet(40, 100);
    game.ghosts = [yerel, yakin2];
    killGhost(yerel, game.ghosts.indexOf(yerel));
    return { uzakSonuc, yerelSonuc: yakin2.hp };
  });
  sina('host Güllü gücü: uzak oyuncunun öldürdüğü hayalet patlamaz, yerel oyuncununki patlar', () => {
    assert.equal(gulHost.uzakSonuc, 100);
    assert.ok(gulHost.yerelSonuc < 100, String(gulHost.yerelSonuc));
  });

  // 7b) İstemci Güllü öldürmesi areaDmg olayı yollar; host bu olayı uygular
  const gulIstemci = await p.evaluate(() => {
    __hazir('client'); __guc('gul');
    const g = __hayalet(100, 1); g._idx = 42;
    online.vurduklarim.set(42, performance.now());
    hayaletGitti(g);
    const ev = online.pendingEvents.find((e) => e.type === 'areaDmg');
    // Host tarafı: olayı uygula
    online.mode = 'host';
    const a = __hayalet(100, 50); a.id = 1;
    const b = __hayalet(150, 50); b.id = 2;
    game.ghosts = [a, b];
    applyHostEvent({ type: 'areaDmg', x: game.player.x + 100, y: game.player.y, r: 90, dmg: 5 });
    return { var: !!ev, r: ev && ev.r, dmg: ev && ev.dmg, aHp: a.hp, bHp: b.hp };
  });
  sina('istemci Güllü öldürmesinde areaDmg (r=90) yollar, host yakındaki hayaletlere uygular', () => {
    assert.equal(gulIstemci.var, true);
    assert.equal(gulIstemci.r, 90);
    assert.ok(gulIstemci.dmg >= 1);
    assert.ok(gulIstemci.aHp < 50 && gulIstemci.bHp < 50);
  });

  // 7c) Patlamadan sağ kalan hayalet sonra ölünce normal patlar (işaret kalıcı değil)
  const zincir = await p.evaluate(() => {
    __hazir('host'); __guc('gul');
    game.player.damage = 1;
    const a = __hayalet(0, 1); a.x = 100; a.y = 100;
    const b = __hayalet(0, 100); b.x = 150; b.y = 100;
    const c = __hayalet(0, 100); c.x = 150; c.y = 180;
    game.ghosts = [a, b, c];
    killGhost(a, 0);
    const bSonra = b.hp;
    const isaret = b._explodedFrom;
    killGhost(b, game.ghosts.indexOf(b));
    return { bSonra, isaret: !!isaret, cSonra: c.hp };
  });
  sina('patlamadan sağ kalan hayalet sonra ölünce patlar (zincir işareti kalıcı değil)', () => {
    assert.equal(zincir.bSonra, 99);
    assert.equal(zincir.isaret, false);
    assert.equal(zincir.cSonra, 99);
  });

  // 16) Çevrimiçinde güç yıldızı kurucunun aktif gücüne bakmaz; yerde yıldız varsa düşmez
  const yildiz = await p.evaluate(() => {
    const mr = Math.random; Math.random = () => 0;
    try {
      __hazir('host'); __guc('gul');
      const g = __hayalet(0, 10); game.ghosts = [g];
      killGhost(g, 0);
      const dustu = game.pickups.some((x) => x.kind === 'guc');
      __hazir('host'); __guc('gul');
      game.pickups = [{ x: 0, y: 0, kind: 'guc' }];
      const g2 = __hayalet(0, 10); game.ghosts = [g2];
      killGhost(g2, 0);
      const ikinci = game.pickups.filter((x) => x.kind === 'guc').length;
      __hazir(null); __guc('gul');
      const g3 = __hayalet(0, 10); game.ghosts = [g3];
      killGhost(g3, 0);
      const tek = game.pickups.some((x) => x.kind === 'guc');
      return { dustu, ikinci, tek };
    } finally { Math.random = mr; }
  });
  sina('çevrimiçinde güç yıldızı aktif güce bakmadan düşer, yerde yıldız varken düşmez', () => {
    assert.equal(yildiz.dustu, true);
    assert.equal(yildiz.ikinci, 1);
  });
  sina('tek kişilik oyunda güç yıldızı kuralı korunur (aktif güç varken düşmez)', () => {
    assert.equal(yildiz.tek, false);
  });

  // 21) İstemci roketinin hedefi host'ta ölmüşse en yakın hayalet seçilir; hiç yoksa hata olmaz
  const roket = await p.evaluate(() => {
    __hazir('host');
    const g = __hayalet(150, 50); g.id = 7;
    game.ghosts = [g];
    applyHostEvent({ type: 'rocketShot', x: game.player.x, y: game.player.y, gi: 999 });
    const hedef = game.effects.find((e) => e.type === 'rocket');
    __hazir('host');
    let hata = null;
    try { applyHostEvent({ type: 'rocketShot', x: game.player.x + 500, y: game.player.y + 500, gi: 999 }); }
    catch (e) { hata = e.message; }
    return { hedefVar: !!hedef && hedef.target === g, hata };
  });
  sina('host roket hedefi ölmüşse 300 px içindeki en yakın hayalete gider, yoksa hata vermez', () => {
    assert.equal(roket.hedefVar, true);
    assert.equal(roket.hata, null);
  });

  sina('sayfa hatası yok', () => assert.deepEqual(hatalar, []));
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
