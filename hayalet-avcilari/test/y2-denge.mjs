// Hayalet Avcıları — Y2 denge sınama botu (ölçüm betiği, normal sınama koşusuna girmez).
// Sayfayı açar, tek kişilik yolculuk bölümünü kurar ve her karede oyuncuyu kendisi sürer:
// en yakın hayalete ~180 px kalacak biçimde yana kayar, 90 px'ten yakın düşman mermisinden kaçar,
// bölge temizlenince köprüye yürür. Ateş oyunda otomatik (dokunma kontrolleriyle aynı yol).
// Çalıştırma: node test/y2-denge.mjs        (ölçüm tablosunu yazar)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WWW = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const TUR = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.m4a': 'audio/mp4' };

// Sayfaya enjekte edilen bot. Dışa açılır; test/y2.test.mjs de aynı botu kullanır.
export function botKur() {
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  window.__y2Hazir = () => {
    if (window.__y2Kuruldu) return;
    window.__y2Kuruldu = true;
    try { for (const k in audio) if (typeof audio[k] === 'function') audio[k] = () => {}; } catch (e) {}
    window.updateHUD = () => {};
    window.gec1Guncelle = () => {};
    window.hikayeGuncelle = () => {};
    window.submitOnlineScore = () => {};
    window.pgsOyunBitti = () => {};
  };
  window.__y2Setup = (level, up) => {
    try { game.running = false; } catch (e) {}
    online.mode = null;
    save.selectedChar = 'kinkin';
    save.upgradesByChar = save.upgradesByChar || {};
    save.upgradesByChar.kinkin = up
      ? { speed: 5, damage: 5, fireRate: 5, range: 5 }
      : { speed: 0, damage: 0, fireRate: 0, range: 0 };
    save.extraHeart = false; save.extraBot = false;
    startGame();
    game.paused = true;
    game.level = level;
    buildWalls(); buildWaters(); buildHazards();
    game.bot = null; game.bot2 = null; game.pet = null;
    game.ghosts = []; game.projectiles = []; game.enemyProjectiles = [];
    game.pickups = []; game.particles = []; game.effects = [];
    game.spawnTimer = 0; game.bossSpawnTimer = 1e9;
    game.bossDefeated = false; game.levelTransitioning = false; game._bolgeBossGeldi = false;
    game.lastFire = 0;
    game.player.hp = game.player.maxHp; game.player.dead = false;
    game.player.invuln = 0; game.player.power = null; game.player.dusus = null; game.player.frozenUntil = 0;
    window.__y2Stuck = null; window.__y2Hedef = null; window.__y2Rota = null; window.__y2Kor = false; game._y2Sim = 0;
    if (typeof ensurePlayerSafe === 'function') ensurePlayerSafe();
    return game;
  };
  const yuruyebilir = (x, y) => yolculukYuruyebilir(x, y, game.player.r + 1);
  // Mermi yolu duvarla kesiliyor mu (görüş yok): hayalet duvarın ardındaysa yaklaş
  const losVar = (g) => {
    const P = game.player, dx = g.x - P.x, dy = g.y - P.y, d = Math.hypot(dx, dy);
    for (let s = 24; s < d - 10; s += 24) {
      if (collidesWalls(P.x + (dx * s) / d, P.y + (dy * s) / d, 4)) return false;
    }
    return true;
  };
  // Bölgenin yürüme koridorunun verilen x'teki y'si (önceki köprü cy -> bu köprü cy)
  const bolgeY = (x) => {
    const d = game._yolculukDuzen; if (!d) return game.worldH / 2;
    const zb = hangiBolge(x);
    if (zb < 1 || zb > 6) return game.worldH / 2;
    const z = d.zones[zb - 1], g = z.gate;
    const prev = zb > 1 ? d.zones[zb - 2].gate.cy : game.worldH / 2;
    const ax = z.x0 + 20, bx = g.x0;
    const t = Math.max(0, Math.min(1, (x - ax) / Math.max(1, bx - ax)));
    return prev + (g.cy - prev) * t;
  };
  // Doğrudan yürünebilir mi (20 px adımlarla)
  const dogrudanAcik = (x0, y0, x1, y1) => {
    const d = Math.hypot(x1 - x0, y1 - y0);
    for (let s = 20; s < d; s += 20) if (!yuruyebilir(x0 + ((x1 - x0) * s) / d, y0 + ((y1 - y0) * s) / d)) return false;
    return true;
  };
  // Duvarı dolanmak için ara nokta: oyuncunun çevresindeki 1600 x 1000 px kutuda 40 px ızgarada BFS (oyunun
  // yolculukYolVarMi yöntemi). Hedefe ulaşılamıyorsa hedefe en yakın ulaşılabilir hücreye gidilir.
  const araNokta = (hx, hy) => {
    const P = game.player, HUC = 20;
    const x0 = Math.max(20, P.x - 800), y0 = 40;
    const nx = Math.ceil((Math.min(game.worldW - 20, P.x + 800) - x0) / HUC), ny = Math.ceil((game.worldH - 80) / HUC);
    const hucre = (i) => ({ x: x0 + (i % nx) * HUC, y: y0 + Math.floor(i / nx) * HUC });
    const bul = (x, y) => Math.max(0, Math.min(ny - 1, Math.round((y - y0) / HUC))) * nx + Math.max(0, Math.min(nx - 1, Math.round((x - x0) / HUC)));
    const bas = bul(P.x, P.y), hedef = bul(hx, hy);
    const ata = new Int32Array(nx * ny).fill(-1);
    ata[bas] = bas;
    const kuyruk = [bas];
    let enIyi = bas, enIyiD = Infinity;
    for (let q = 0; q < kuyruk.length; q++) {
      const c = kuyruk[q];
      const hc = hucre(c), dd = Math.hypot(hc.x - hx, hc.y - hy);
      if (dd < enIyiD) { enIyiD = dd; enIyi = c; }
      if (c === hedef) break;
      const ix = c % nx, iy = Math.floor(c / nx);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const jx = ix + dx, jy = iy + dy;
        if (jx < 0 || jy < 0 || jx >= nx || jy >= ny) continue;
        const j = jy * nx + jx;
        if (ata[j] !== -1) continue;
        const hj = hucre(j);
        if (!yuruyebilir(hj.x, hj.y)) { ata[j] = -2; continue; }
        ata[j] = c; kuyruk.push(j);
      }
    }
    // Yolu geri izle; oyuncudan doğrudan görülebilen en uzak hücreyi ara nokta seç
    const yol = [];
    for (let c = enIyi; c !== bas && ata[c] >= 0 && yol.length < 400; c = ata[c]) yol.push(c);
    yol.reverse();
    let wp = null;
    for (const c of yol) { const h = hucre(c); if (dogrudanAcik(P.x, P.y, h.x, h.y)) wp = h; else break; }
    return wp || (yol.length ? hucre(yol[0]) : null);
  };
  window.__y2Yon = () => {
    const P = game.player, d = game._yolculukDuzen;
    if (!d) return { x: 0, y: 0 };
    const zNow = hangiBolge(P.x);
    // Tehditler: 150 px'ten yakın düşman mermileri ve çok yakın hayaletler
    const kac = [];
    for (const p of game.enemyProjectiles) {
      const dd = Math.hypot(p.x - P.x, p.y - P.y);
      if (dd < 150) kac.push({ x: p.x + p.vx * 0.3, y: p.y + p.vy * 0.3, guc: 2.5 });
    }
    let enYakin = null, enD = Infinity;
    for (const g of game.ghosts) {
      if (g.cikis > 0) continue;
      const dd = Math.hypot(g.x - P.x, g.y - P.y);
      if (dd < enD) { enD = dd; enYakin = g; }
      if (dd < (g.isBoss ? 130 : 85)) kac.push({ x: g.x, y: g.y, guc: 2.0 });
    }
    // Hedef hayalette histerezis: iki uzak hayalet arasında gidip gelmeyi önler
    const oncekiHedef = window.__y2Hedef;
    if (oncekiHedef && game.ghosts.includes(oncekiHedef) && oncekiHedef.cikis <= 0) {
      const dOnceki = Math.hypot(oncekiHedef.x - P.x, oncekiHedef.y - P.y);
      if (!enYakin || enD > dOnceki * 0.7) { enYakin = oncekiHedef; enD = dOnceki; }
    }
    window.__y2Hedef = enYakin;
    // Kıyıdan uzak dur: timsah ancak su kenarında 1,2 sn duranı ısırır
    for (const o of game.waters) {
      if (o.gecit) continue;
      const nx = Math.max(o.x, Math.min(P.x, o.x + o.w));
      const ny = Math.max(o.y, Math.min(P.y, o.y + o.h));
      if (Math.hypot(nx - P.x, ny - P.y) < 115) kac.push({ x: nx, y: ny, guc: 2.2 });
    }
    for (const tm of game.timsahlar || []) {
      if (Math.hypot(tm.x - P.x, tm.y - P.y) < 130) kac.push({ x: tm.x, y: tm.y, guc: 2.8 });
    }
    // İlerleme gerekiyor mu? (bölge temiz / köprü açık / arena)
    let ilerle = false;
    if (zNow === 0) ilerle = true;
    else if (zNow >= 1 && zNow <= 6 && game.bolgeTemiz[zNow]) ilerle = true;
    else if (zNow >= 1 && zNow <= 6 && game.bolge > zNow) ilerle = true;
    else if (zNow >= 1 && zNow <= 6 && !game.ghosts.length &&
             (game.bolgeDogan[zNow] || 0) >= (game.bolgeKota[zNow] || 0)) ilerle = true;

    let hedef = null;
    if (ilerle) {
      if (zNow === 0) hedef = { x: d.start.x1 + 40, y: game.worldH / 2 };
      else if (zNow >= 1 && zNow <= 6) {
        // Koridor çizgisi boyunca köprü ağzına, sonra karşıya yürü
        const z = d.zones[zNow - 1], g = z.gate;
        if (P.x < g.x0 - 5) {
          const hx = Math.min(P.x + 150, g.x0);
          hedef = { x: hx, y: bolgeY(hx) };
        } else if (P.x < g.x1 + 30) hedef = { x: g.x1 + 70, y: g.cy };
        else hedef = { x: P.x + 100, y: g.cy };
      } else hedef = { x: d.arena.x0 + 300, y: game.worldH / 2 };
    } else if (enYakin) {
      const ideal = Math.min(170, Math.max(100, P.range - 30));
      const vx = (P.x - enYakin.x) / (enD || 1), vy = (P.y - enYakin.y) / (enD || 1);
      if (!losVar(enYakin)) hedef = { x: enYakin.x, y: enYakin.y, gor: true }; // görüş kapalı: doğrudan hayalete (BFS dolandırır)
      else if (enD > ideal + 30) hedef = { x: enYakin.x + (P.x - enYakin.x) * 0.6, y: enYakin.y + (P.y - enYakin.y) * 0.6 };
      else if (enD < ideal - 45) hedef = { x: P.x + vx * 120 - vy * 45, y: P.y + vy * 120 + vx * 45 };
      else hedef = { x: enYakin.x + vx * ideal - vy * 95, y: enYakin.y + vy * ideal + vx * 95 };
      // Savaşırken bile bölge koridoruna / dünya ortasına dön (köşeye sıkışmayı önler)
      if (zNow >= 1 && zNow <= 6 && !hedef.gor) {
        const cy = bolgeY(P.x), fark = Math.abs(P.y - cy);
        // Histerezis: koridora dönüş 200 px'te açılır, 80 px'e girince kapanır. Eşikte aç/kapa
        // yapınca bot aşağı-yukarı salınıp kilitleniyordu (Y2).
        if (window.__y2Kor || fark > 200) {
          if (fark < 80) window.__y2Kor = false;
          else { window.__y2Kor = true; hedef = { x: (hedef.x + P.x) / 2, y: cy }; }
        }
      }
      if (!hedef.gor && P.y < 130) hedef.y = Math.max(hedef.y, P.y + 120);
      if (!hedef.gor && P.y > game.worldH - 130) hedef.y = Math.min(hedef.y, P.y - 120);
    } else if (zNow >= 1 && zNow <= 6) {
      hedef = { x: P.x + 60, y: bolgeY(P.x) };
    } else hedef = { x: P.x + 60, y: P.y };
    // Hedefe doğrudan yürünemiyorsa (duvar arada) BFS ara noktasına yönel; 0,4 sn'de bir yeniden hesaplanır
    if (!dogrudanAcik(P.x, P.y, hedef.x, hedef.y)) {
      const R = window.__y2Rota;
      const simdi = game._y2Sim || 0;
      if (!R || simdi - R.t > 0.4 || Math.hypot(R.hx - hedef.x, R.hy - hedef.y) > 80) {
        window.__y2Rota = { t: simdi, hx: hedef.x, hy: hedef.y, wp: araNokta(hedef.x, hedef.y) };
      }
      if (window.__y2Rota.wp) hedef = window.__y2Rota.wp;
    }
    window.__y2Dbg = { zNow, ilerle, enD: Math.round(enD), hedef: { x: Math.round(hedef.x), y: Math.round(hedef.y) }, py: Math.round(P.y) };

    let dx = hedef.x - P.x, dy = hedef.y - P.y;
    const dl = Math.hypot(dx, dy) || 1;
    dx /= dl; dy /= dl;
    for (const t of kac) {
      const tx = P.x - t.x, ty = P.y - t.y, td = Math.hypot(tx, ty) || 1;
      const agirlik = Math.max(0, (150 - td) / 150) * t.guc;
      dx += (tx / td) * agirlik; dy += (ty / td) * agirlik;
    }
    let nl = Math.hypot(dx, dy) || 1; dx /= nl; dy /= nl;

    // Sıkışma: 1 sn'de 4 px'ten az ilerlediyse 0,5 sn dik kaçış
    const st = window.__y2Stuck || (window.__y2Stuck = { x: P.x, y: P.y, t: 0, nudge: 0, nx: 0, ny: 0 });
    if (st.nudge > 0) { st.nudge -= 1 / 12; return { x: st.nx, y: st.ny }; }
    if (Math.hypot(P.x - st.x, P.y - st.y) > 6) { st.x = P.x; st.y = P.y; st.t = 0; }
    else {
      st.t += 1 / 12;
      if (st.t >= 1) {
        st.t = 0; st.x = P.x; st.y = P.y; st.nudge = 0.5;
        const p1 = { x: -dy, y: dx }, p2 = { x: dy, y: -dx };
        const puan = (p) => {
          let s = 0;
          for (const adim of [25, 60, 100]) if (yuruyebilir(P.x + p.x * adim, P.y + p.y * adim)) s += 1;
          return s - Math.hypot(hedef.x - (P.x + p.x * 80), hedef.y - (P.y + p.y * 80)) / 500;
        };
        const sec = puan(p1) >= puan(p2) ? p1 : p2;
        st.nx = sec.x; st.ny = sec.y;
        return { x: sec.x, y: sec.y };
      }
    }

    // Yön seçimi: hedef yönüne en yakın, önü açık yön
    const ilerleme = Math.atan2(dy, dx);
    let enIyi = null, enIyiPuan = -Infinity;
    const ofs = [0, 0.3, -0.3, 0.6, -0.6, 0.9, -0.9, 1.2, -1.2, 1.6, -1.6, 2.0, -2.0, 2.6, -2.6, Math.PI];
    for (const o of ofs) {
      const a = ilerleme + o, cx = Math.cos(a), cy2 = Math.sin(a);
      let acik = 0;
      for (const adim of [22, 50, 90, 130]) {
        if (!yuruyebilir(P.x + cx * adim, P.y + cy2 * adim)) break;
        acik++;
      }
      if (!acik) continue;
      let puan = Math.cos(o) * 1.5 + acik / 4;
      for (const t of kac) {
        const td = Math.hypot(t.x - (P.x + cx * 70), t.y - (P.y + cy2 * 70));
        puan += Math.min(td, 200) / 1000 * t.guc;
      }
      if (puan > enIyiPuan) { enIyiPuan = puan; enIyi = { x: cx, y: cy2 }; }
    }
    return enIyi || { x: 0, y: 0 };
  };
  // Tek deneme: verilen süre kadar oynatır; biterse/ölürse döner.
  window.__y2Tek = (level, up, maxSn) => {
    window.__y2Hazir();
    window.__y2Setup(level, up);
    const P = game.player;
    let sim = 0, kalp = 0, oncekiHp = P.hp, yon = { x: 0, y: 0 }, yonYas = 99;
    const bas = performance.now();
    while (sim < maxSn) {
      if (yonYas >= 0.08) { yon = window.__y2Yon(); yonYas = 0; }
      yonYas += 1 / 60;
      game.inputDir.x = yon.x; game.inputDir.y = yon.y;
      update(1 / 60, bas + sim * 1000);
      sim += 1 / 60;
      game._y2Sim = sim;
      if (P.hp < oncekiHp) kalp += oncekiHp - P.hp;
      oncekiHp = Math.max(0, P.hp);
      if (game.bossDefeated) return { tamam: true, sure: sim, kalp, olum: 0 };
      if (!game.running) return { tamam: false, sure: sim, kalp, olum: 1 };
    }
    return { tamam: false, sure: sim, kalp, olum: 0 };
  };
  window.__y2Calis = (secenek) => {
    window.__y2Hazir();
    const { levels, seeds, up } = secenek;
    const sonuc = [];
    for (const level of levels) for (const seed of seeds) {
      const mr = Math.random;
      Math.random = mulberry32(seed * 100003 + level * 7919 + (up ? 1 : 0));
      let kalan = 600, sure = 0, kalp = 0, olum = 0, tamam = false;
      while (kalan > 0.01) {
        const r = window.__y2Tek(level, up, Math.min(kalan, 600));
        sure += r.sure; kalan -= r.sure; kalp += r.kalp; olum += r.olum;
        if (r.tamam) { tamam = true; break; }
        if (!r.olum) break;
      }
      Math.random = mr;
      sonuc.push({ level, seed, up, tamam, sure: Math.round(sure * 10) / 10, kalp, olum });
    }
    try { game.running = false; } catch (e) {}
    return sonuc;
  };
}

// Ortalamaları tabloya çevir
export function tabloYap(sonuc) {
  const gruplar = new Map();
  for (const r of sonuc) {
    const k = `${r.up ? 'geliştirmeli' : 'geliştirmesiz'}|${r.level}`;
    if (!gruplar.has(k)) gruplar.set(k, []);
    gruplar.get(k).push(r);
  }
  const satir = [];
  for (const [k, liste] of gruplar) {
    const [tur, level] = k.split('|');
    const ortSure = liste.reduce((a, b) => a + b.sure, 0) / liste.length;
    const ortKalp = liste.reduce((a, b) => a + b.kalp, 0) / liste.length;
    satir.push({
      tur, level: Number(level),
      tamam: liste.filter((r) => r.tamam).length,
      adet: liste.length,
      sure: Math.round(ortSure * 10) / 10,
      kalp: Math.round(ortKalp * 10) / 10,
      olum: liste.reduce((a, b) => a + b.olum, 0),
      detay: liste.map((r) => `${r.tamam ? '✓' : '✗'}${r.sure}s/${r.kalp}❤`).join(' '),
    });
  }
  satir.sort((a, b) => (a.tur === b.tur ? a.level - b.level : a.tur < b.tur ? -1 : 1));
  return satir;
}

async function ana() {
  const { chromium } = await import(pathToFileURL(PW).href);
  const sunucu = http.createServer((q, r) => {
    const f = path.join(WWW, decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html');
    if (!f.startsWith(WWW) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'content-type': TUR[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
  }).listen(0);
  const adres = `http://127.0.0.1:${sunucu.address().port}/index.html`;
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  const hatalar = [];
  const tum = [];
  try {
    const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    p.on('pageerror', (e) => hatalar.push(e.message));
    await p.addInitScript(() => {
      localStorage.setItem('hayaletAvcilariDil', 'tr');
      localStorage.setItem('hayaletAvcilariLastSeenVersion', '9.9.9');
      localStorage.setItem('hayaletAvcilariHikayeSahnesiz', '1');
    });
    await p.route(/gstatic\.com|googleapis|firebase|googlesyndication|doubleclick/, (r) => r.abort());
    await p.goto(adres, { waitUntil: 'load' });
    await p.waitForFunction(() => typeof startGame === 'function' && typeof yolculukHaritaKur === 'function');
    await p.evaluate(botKur);
    const seviyeler = [1, 3, 5, 7, 10], tohumlar = [1, 2, 3];
    for (const up of [false, true]) {
      const s = await p.evaluate((o) => window.__y2Calis(o), { levels: seviyeler, seeds: tohumlar, up });
      tum.push(...s);
      process.stderr.write(`  ${up ? 'geliştirmeli' : 'geliştirmesiz'} bitti\n`);
    }
  } finally {
    await b.close();
    sunucu.close();
  }
  const satir = tabloYap(tum);
  console.log('tur\tbölüm\ttamam\tsüre(s)\tkayıp❤\tölüm\tseeds');
  for (const r of satir) console.log(`${r.tur}\t${r.level}\t${r.tamam}/${r.adet}\t${r.sure}\t${r.kalp}\t${r.olum}\t${r.detay}`);
  if (hatalar.length) console.log('SAYFA HATALARI:', hatalar.join(' | '));
  return satir;
}

const anaMi = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (anaMi) await ana();
