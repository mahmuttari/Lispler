/* ============================================================
   HAYALET AVCILARI — YOLCULUK HARİTASI (3.21.0, Y1a)
   Soldan sağa uzun harita: başlangıç alanı, 6 bölge, boss arenası. Her bölgenin sağ kenarında boydan boya
   geçit (su şeridi) ve ortasında bir köprü vardır. Köprü kapalıyken oyuncu ve hayaletler geçemez; açılınca
   bir daha kapanmaz. Yerleşim bölüm (ve Dünya Turu'nda ülke) tohumundan üretilir; her cihazda aynıdır.
   Çevrimiçi bu adımda eski 1600x1200 haritayı kullanır (yolculukAcik = !online.mode).
   ============================================================ */

const YOLCULUK_AYAR = {
  worldW: 7200,
  worldH: 1000,
  startW: 500,
  zoneCount: 6,
  arenaW: 900,
  gateW: 90,
  bridgeW: 120,
  kenar: 80,
  agizBos: 160, // köprü ağzının önünde/arkasında boş bırakılan alan (px)
  koridor: 130, // bölge içindeki yürüme koridorunun yarı genişliği (px)
};
YOLCULUK_AYAR.zoneW = (YOLCULUK_AYAR.worldW - YOLCULUK_AYAR.startW - YOLCULUK_AYAR.arenaW) / YOLCULUK_AYAR.zoneCount;
// Bölge kotası: bölgede doğacak hayalet sayısı (Y2'de ayarlanacak)
YOLCULUK_AYAR.kota = function (bolum, bolge) {
  return Math.max(1, Math.round((10 + 3 * bolum) * (0.8 + 0.08 * bolge)));
};
// Bölge zorluk çarpanları (Y2'de ayarlanacak)
YOLCULUK_AYAR.zorluk = {
  can: (bolge) => Math.floor((bolge - 1) / 2),
  hiz: (bolge) => 1 + 0.04 * (bolge - 1),
  ates: (bolge) => 0.02 * (bolge - 1),
};

function yolculukAcik() {
  return !(typeof online !== "undefined" && online && online.mode);
}

function yolculukUlkeKodu() {
  try { const u = typeof turUlkesi === "function" ? turUlkesi() : null; return u ? u.kod : "-"; }
  catch (e) { return "-"; }
}

// Deterministik tohum: bölüm + ülke + bölge
function yolculukRastgele(bolum, ulke, bolge, n) {
  const s = `${bolum}|${ulke}|${bolge}|${n}`;
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return ((h >>> 0) % 1000000) / 1000000;
}

function yolculukDuzeni() {
  const A = YOLCULUK_AYAR;
  const bolum = (typeof game !== "undefined" && game.level) || 1;
  const ulke = yolculukUlkeKodu();
  const zones = [];
  for (let i = 1; i <= A.zoneCount; i++) {
    const x0 = A.startW + (i - 1) * A.zoneW, x1 = A.startW + i * A.zoneW;
    const off = (yolculukRastgele(bolum, ulke, i, 1) - 0.5) * A.worldH * 0.34;
    const cy = Math.max(A.kenar + A.bridgeW, Math.min(A.worldH - A.kenar - A.bridgeW, A.worldH / 2 + off));
    zones.push({
      i,
      x0, x1,
      gate: { x0: x1 - A.gateW, x1, bridgeY0: cy - A.bridgeW / 2, bridgeY1: cy + A.bridgeW / 2, cy },
    });
  }
  return {
    zones,
    arena: { x0: A.startW + A.zoneCount * A.zoneW, x1: A.worldW },
    start: { x0: 0, x1: A.startW },
  };
}

function hangiBolge(x) {
  const d = yolculukDuzeni(), A = YOLCULUK_AYAR;
  if (x < d.start.x1) return 0;
  if (x >= d.arena.x0) return 7;
  const i = 1 + Math.floor((x - d.start.x1) / A.zoneW);
  return Math.max(1, Math.min(A.zoneCount, i));
}

function yolculukBaslangic() {
  return { x: YOLCULUK_AYAR.startW / 2, y: YOLCULUK_AYAR.worldH / 2 };
}

function dunyaBoyutunuAyarla() {
  if (typeof game === "undefined") return;
  if (yolculukAcik()) { game.worldW = YOLCULUK_AYAR.worldW; game.worldH = YOLCULUK_AYAR.worldH; }
  else { game.worldW = 1600; game.worldH = 1200; }
}

// Kapalı köprünün engeli: şerit boyunca, köprü genişliğinde bir kutu
function yolculukKopruKapaliNokta(x, y, r) {
  if (!yolculukAcik() || !game || !game.kopruAcik || !game._yolculukDuzen) return false;
  const zones = game._yolculukDuzen.zones;
  for (let i = 0; i < zones.length; i++) {
    if (game.kopruAcik[i]) continue;
    const g = zones[i].gate;
    if (x > g.x0 - 6 - r && x < g.x1 + 6 + r && y > g.bridgeY0 - r && y < g.bridgeY1 + r) return true;
  }
  return false;
}

// (x, y) kapalı köprünün kutusunda mı (çizim ve sınama için)
function yolculukKopruKapali(i) {
  return !!(game && game.kopruAcik && !game.kopruAcik[i]);
}

function yolculukKopruAc(i) {
  if (!yolculukAcik() || !game || !game.kopruAcik || i < 0 || i >= game.kopruAcik.length) return false;
  if (game.kopruAcik[i]) return false;
  game.kopruAcik[i] = true;
  game._kopruAnim = game._kopruAnim || {};
  game._kopruAnim[i] = 0.6;
  try {
    if (typeof audio !== "undefined") {
      if (typeof audio.unlock === "function") audio.unlock();
      else if (typeof audio.levelUp === "function") audio.levelUp();
    }
  } catch (e) { /* ses yoksa sessiz */ }
  if (typeof showToast === "function") showToast(t("🌉 Köprü açıldı!"));
  return true;
}

function yolculukGuncelle(dt) {
  if (!game || !game._kopruAnim) return;
  for (const k in game._kopruAnim) game._kopruAnim[k] = Math.max(0, game._kopruAnim[k] - dt);
}

// Bölgeleri güncelle: kotası dolan ve hayaleti kalmayan bölge temizlenir, köprüsü açılır, sıradaki bölge etkin olur.
// Arena (7): son köprü açıkken oyuncu arenaya girince boss gelir.
function yolculukBolgeGuncelle() {
  if (!yolculukAcik() || !game || !game._yolculukDuzen || !game.bolgeTemiz) return;
  const A = YOLCULUK_AYAR;
  for (let z = 1; z <= A.zoneCount; z++) {
    if (game.bolgeTemiz[z]) continue;
    if ((game.bolgeDogan[z] || 0) < (game.bolgeKota[z] || 0)) continue;
    let canli = false;
    for (const g of game.ghosts) if (!g.isBoss && g.bolge === z) { canli = true; break; }
    if (canli) continue;
    game.bolgeTemiz[z] = true;
    yolculukKopruAc(z - 1); // köprü bir daha kapanmaz
  }
  let aktif = 0;
  for (let z = 1; z <= A.zoneCount; z++) if (!game.bolgeTemiz[z]) { aktif = z; break; }
  if (!aktif) aktif = 7;
  game.bolge = aktif;

  if (aktif === 7) {
    const bossVar = game.ghosts.some((g) => g.isBoss);
    if (!game.bossDefeated && !bossVar && !game._bolgeBossGeldi && hangiBolge(game.player.x) === 7) {
      game._bolgeBossGeldi = true;
      if (typeof spawnBoss === "function") spawnBoss();
    }
  }
}

// Yolculuk doğumu: yalnız etkin bölgede (arena ise boss yaşarken eşlik edenler)
function yolculukSpawnGuncelle(dt, spawnInterval, maxGhosts) {
  if (!yolculukAcik() || !game || !game._yolculukDuzen || !game.bolgeKota) return;
  yolculukBolgeGuncelle();
  if (game.bossDefeated) return;
  const z = game.bolge;
  if (z >= 7) {
    if (!game.ghosts.some((g) => g.isBoss)) return; // boss ölünce doğum durur
    game.spawnTimer -= dt;
    const cap = Math.floor(maxGhosts / 2);
    if (game.spawnTimer <= 0 && game.ghosts.length < cap) {
      const ar = game._yolculukDuzen.arena;
      spawnGhost({ x0: ar.x0 + 40, x1: ar.x1 - 40, bolge: 7 });
      game.spawnTimer = spawnInterval;
    }
    return;
  }
  const zone = game._yolculukDuzen.zones[z - 1];
  if (!zone) return;
  // Oyuncu bölgenin içindeyse ya da önceki köprü açık ve oyuncu bölgeye 300 px yakınsa doğum başlar
  let basla = hangiBolge(game.player.x) === z;
  if (!basla) {
    if (z === 1) basla = game.player.x >= zone.x0 - 300;
    else if (game.kopruAcik[z - 2]) {
      const uzak = Math.max(zone.x0 - game.player.x, game.player.x - zone.x1, 0);
      basla = uzak <= 300;
    }
  }
  if (!basla) return;
  game.spawnTimer -= dt;
  if (game.spawnTimer <= 0 && game.ghosts.length < maxGhosts && (game.bolgeDogan[z] || 0) < game.bolgeKota[z]) {
    spawnGhost({ x0: zone.x0 + 20, x1: zone.gate.x0 - 20, bolge: z });
    game.bolgeDogan[z] = (game.bolgeDogan[z] || 0) + 1;
    game.spawnTimer = spawnInterval;
  }
}

// Bir engel köprü ağzına / geçit şeridine / bölgenin yürüme koridoruna değiyor mu
function yolculukYasakKutu(x, y, w, h, duzen, zone, oncekiCy) {
  const A = YOLCULUK_AYAR, g = zone.gate;
  const kesisir = (b) => x < b.x1 && x + w > b.x0 && y < b.y1 && y + h > b.y0;
  // Geçit şeridi ve iki ağzı
  if (kesisir({ x0: g.x0 - A.agizBos, x1: g.x1, y0: 0, y1: A.worldH })) return true;
  if (kesisir({ x0: g.x1, x1: g.x1 + A.agizBos, y0: 0, y1: A.worldH })) return true;
  // Bir önceki geçidin arkası: bölgenin sol kenarındaki 160 px
  if (kesisir({ x0: zone.x0, x1: zone.x0 + A.agizBos, y0: 0, y1: A.worldH })) return true;
  // Bölgenin yürüme koridoru: soldan sağa köprü ağzına
  const ax = zone.x0 + 20, ay = oncekiCy;
  const bx = g.x0, by = g.cy;
  const dx = bx - ax, dy = by - ay, uz = Math.hypot(dx, dy) || 1;
  const cx = x + w / 2, cy = y + h / 2;
  const t = Math.max(0, Math.min(1, ((cx - ax) * dx + (cy - ay) * dy) / (uz * uz)));
  const enYakin = Math.hypot(cx - (ax + dx * t), cy - (ay + dy * t));
  if (enYakin < A.koridor + Math.max(w, h) / 2) return true;
  return false;
}

function yolculukHaritaKur() {
  const A = YOLCULUK_AYAR, d = yolculukDuzeni();
  const bolum = game.level || 1, ulke = yolculukUlkeKodu();
  game._yolculukDuzen = d;
  game.yolculuk = true;
  game.kopruAcik = new Array(A.zoneCount).fill(false);
  game._kopruAnim = {};
  game.bolge = 1; // etkin bölge: en soldaki temizlenmemiş bölge, hepsi bitince 7 (arena)
  game.bolgeKota = {};
  game.bolgeDogan = {};
  game.bolgeTemiz = {};
  for (let i = 1; i <= A.zoneCount; i++) {
    game.bolgeKota[i] = A.kota(bolum, i);
    game.bolgeDogan[i] = 0;
    game.bolgeTemiz[i] = false;
  }
  game._bolgeBossGeldi = false;
  game.walls = [];
  game.waters = [];
  game.spikes = [];
  game.lavas = [];
  // Dış sınır (engelBicimleriniKur ilk 4 duvarı sınır sayar)
  game.walls.push({ x: 0, y: 0, w: A.worldW, h: 30 });
  game.walls.push({ x: 0, y: A.worldH - 30, w: A.worldW, h: 30 });
  game.walls.push({ x: 0, y: 0, w: 30, h: A.worldH });
  game.walls.push({ x: A.worldW - 30, y: 0, w: 30, h: A.worldH });

  const rnd = (z, n) => yolculukRastgele(bolum, ulke, z, n);
  const cak = (x, y, w, h, gap) => {
    const all = game.walls.concat(game.waters, game.spikes, game.lavas);
    for (const o of all) if (x < o.x + o.w + gap && x + w + gap > o.x && y < o.y + o.h + gap && y + h + gap > o.y) return true;
    return false;
  };

  let oncekiCy = A.worldH / 2;
  for (let i = 1; i <= A.zoneCount; i++) {
    const z = d.zones[i - 1];
    const icX0 = z.x0 + 30, icX1 = z.gate.x0 - 20;
    const icW = icX1 - icX0;
    // Duvarlar / tema objeleri
    const duvarSayi = 3 + Math.floor((i - 1) / 2);
    for (let k = 0, deneme = 0; k < duvarSayi && deneme < 140; deneme++) {
      const w = 80 + rnd(i, k * 3 + deneme * 7) * 100;
      const h = 80 + rnd(i, k * 5 + deneme * 11 + 50) * 100;
      const x = icX0 + rnd(i, k * 13 + deneme * 17 + 1) * Math.max(0, icW - w);
      const y = 70 + rnd(i, k * 19 + deneme * 23 + 2) * Math.max(0, A.worldH - 140 - h);
      if (yolculukYasakKutu(x, y, w, h, d, z, oncekiCy) || cak(x, y, w, h, 20)) continue;
      game.walls.push({ x, y, w, h });
      k++;
    }
    // Sular
    for (let k = 0, deneme = 0; k < 2 && deneme < 80; deneme++) {
      const w = 110 + rnd(i, k * 29 + deneme * 31 + 3) * 80;
      const h = 80 + rnd(i, k * 37 + deneme * 41 + 4) * 70;
      const x = icX0 + rnd(i, k * 43 + deneme * 47 + 5) * Math.max(0, icW - w);
      const y = 80 + rnd(i, k * 53 + deneme * 59 + 6) * Math.max(0, A.worldH - 160 - h);
      if (yolculukYasakKutu(x, y, w, h, d, z, oncekiCy) || cak(x, y, w, h, 16)) continue;
      game.waters.push({ x, y, w, h });
      k++;
    }
    // Diken ve lav (bölge ilerledikçe artar)
    const spikeSayi = Math.min(3, Math.floor(i / 2));
    const lavaSayi = i >= 5 ? 2 : i >= 3 ? 1 : 0;
    const yerlestir = (liste, w, h, n) => {
      for (let k = 0, deneme = 0; k < n && deneme < 60; deneme++) {
        const x = icX0 + rnd(i, 61 + n * 5 + deneme * 3) * Math.max(0, icW - w);
        const y = 100 + rnd(i, 67 + n * 7 + deneme * 9) * Math.max(0, A.worldH - 200 - h);
        if (yolculukYasakKutu(x, y, w, h, d, z, oncekiCy) || cak(x, y, w, h, 18)) continue;
        liste.push({ x, y, w, h });
        k++;
      }
    };
    yerlestir(game.spikes, 90, 90, spikeSayi);
    yerlestir(game.lavas, 110, 90, lavaSayi);
    oncekiCy = z.gate.cy;
  }

  // Geçit suyu şeritleri (sınırlara girmeden) — en sona eklenir; timsahlar bunları kullanmaz
  const gecitSulari = [];
  const u = typeof turUlkesi === "function" ? turUlkesi() : null;
  const gecitTema = u ? u.kod : (game.level - 1) % 6;
  for (const z of d.zones) {
    const o = { x: z.gate.x0, y: 30, w: A.gateW, h: A.worldH - 60, gecit: true, tema: gecitTema };
    // Geçit boydan boya düz bir su şerididir: göl biçimi (yuvarlak) kullanılmaz, dikdörtgen çarpışma
    o.bicim = [{ t: "k", x: 0, y: 0, w: o.w, h: o.h, rr: 0 }];
    o.carpisma = [{ t: "k", x: 0, y: 0, w: o.w, h: o.h, rr: 0 }];
    o.aile = "gol"; o.pay = 0; o.derinlik = 0; o.yon = null; o.tohum = 1;
    game.waters.push(o);
    gecitSulari.push(o);
  }

  // Köprüler: her geçitte tek, dikeyde ortada (tohumlu kaydırma)
  game.kopruler = d.zones.map((z, idx) => ({
    su: gecitSulari[idx], yatay: true,
    a: z.gate.x0 - (typeof KOPRU !== "undefined" ? KOPRU.karaPay : 30),
    b: z.gate.x1 + (typeof KOPRU !== "undefined" ? KOPRU.karaPay : 30),
    c: z.gate.cy, bolge: z.i, sira: idx,
  }));
  game._kopruSular = game.waters;

  yolculukYoluGarantile();
}

// Yürünebilir mi: duvar, diken, lav ve (köprü şeridi dışında) su engel
function yolculukYuruyebilir(x, y, r) {
  if (typeof collidesWalls === "function" && collidesWalls(x, y, r)) return false;
  if (typeof collidesSpikes === "function" && collidesSpikes(x, y, r)) return false;
  if (typeof collidesLavas === "function" && collidesLavas(x, y, r)) return false;
  if (typeof collidesWaters === "function" && collidesWaters(x, y, r)) {
    if (typeof koprudeMi === "function" && koprudeMi(x, y)) return true;
    if (game._yolculukDuzen) {
      for (const z of game._yolculukDuzen.zones) {
        if (x >= z.gate.x0 - 20 && x <= z.gate.x1 + 20 && Math.abs(y - z.gate.cy) <= 42) return true;
      }
    }
    return false;
  }
  return true;
}

// Kaba ızgara taşkın doldurma: başlangıçtan hedefe yol var mı (hücre 40 px)
function yolculukYolVarMi(bx, by, hx, hy) {
  const A = YOLCULUK_AYAR, HUC = 40, r = 22;
  const x0 = 20, y0 = 40;
  const nx = Math.ceil((A.worldW - 40) / HUC), ny = Math.ceil((A.worldH - 80) / HUC);
  const idx = (ix, iy) => iy * nx + ix;
  const hucre = (ix, iy) => ({ x: x0 + ix * HUC, y: y0 + iy * HUC });
  const sinirla = (ix, iy) => ({ ix: Math.max(0, Math.min(nx - 1, Math.round((ix - x0) / HUC))), iy: Math.max(0, Math.min(ny - 1, Math.round((iy - y0) / HUC))) });
  const bas = sinirla(bx, by), hedef = sinirla(hx, hy);
  const gorulen = new Uint8Array(nx * ny);
  const kuyruk = [idx(bas.ix, bas.iy)];
  gorulen[kuyruk[0]] = 1;
  for (let q = 0; q < kuyruk.length; q++) {
    const c = kuyruk[q], ix = c % nx, iy = (c - ix) / nx;
    if (ix === hedef.ix && iy === hedef.iy) return true;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const jx = ix + dx, jy = iy + dy;
      if (jx < 0 || jy < 0 || jx >= nx || jy >= ny) continue;
      const j = idx(jx, jy);
      if (gorulen[j]) continue;
      gorulen[j] = 1;
      const p = hucre(jx, jy);
      if (!yolculukYuruyebilir(p.x, p.y, r)) continue;
      kuyruk.push(j);
    }
  }
  return false;
}

// Açık köprülerle başlangıçtan arenaya yol yoksa engelleri seyrelt (tohumlu, deterministik)
function yolculukYoluGarantile() {
  const A = YOLCULUK_AYAR;
  const b = yolculukBaslangic(), arena = { x: A.worldW - A.startW, y: A.worldH / 2 };
  const acik = game.kopruAcik.slice();
  game.kopruAcik = new Array(A.zoneCount).fill(true);
  let tamam = yolculukYolVarMi(b.x, b.y, arena.x, arena.y);
  for (let tur = 0; tur < 8 && !tamam; tur++) {
    // Bölge bölge fazla engelleri kaldır (son eklenenden başlayarak)
    for (const liste of [game.lavas, game.spikes, game.waters, game.walls]) {
      for (let i = liste.length - 1; i >= 0; i--) {
        const o = liste[i];
        if (o.gecit) continue;
        // Sınır duvarlarını koru
        if (liste === game.walls && i < 4) continue;
        liste.splice(i, 1);
        if (yolculukYolVarMi(b.x, b.y, arena.x, arena.y)) { tamam = true; break; }
      }
      if (tamam) break;
    }
  }
  game.kopruAcik = acik;
  if (typeof engelBicimleriniKur === "function") engelBicimleriniKur();
}

// ---------- çizim ----------
// Kapalı köprü: kalkık asma köprü / parlayan kapı (tema renklerinde, sade)
function yolculukCiz(ctx) {
  if (!yolculukAcik() || !game._yolculukDuzen) return;
  const cam = game.camera || { x: 0, y: 0 }, W = game.W || 0, H = game.H || 0;
  const th = typeof getTheme === "function" ? getTheme() : { grid: "#64748b", floor: "#1e293b" };
  const zaman = performance.now() / 1000;
  for (let i = 0; i < game._yolculukDuzen.zones.length; i++) {
    const z = game._yolculukDuzen.zones[i], g = z.gate;
    if (g.x1 + 40 < cam.x || g.x0 - 40 > cam.x + W || g.bridgeY1 + 40 < cam.y || g.bridgeY0 - 40 > cam.y + H) continue;
    const anim = (game._kopruAnim && game._kopruAnim[i]) || 0;
    const acik = game.kopruAcik[i];
    if (acik && anim <= 0) continue;
    const k = acik ? Math.min(1, anim / 0.6) : 1; // 0 → kapalı, 1 → açık
    const x0 = g.x0 - 4, x1 = g.x1 + 4, y0 = g.bridgeY0, y1 = g.bridgeY1;
    ctx.save();
    // Kalkan köprünün gölgesi
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(x0, y0 + 4, x1 - x0, y1 - y0);
    // Kapı kolları
    ctx.strokeStyle = th.grid || "#64748b";
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.moveTo(x1, y0); ctx.lineTo(x1, y1); ctx.stroke();
    // Kalkık köprü tahtası (açılırken yumuşakça iner)
    const yuk = (1 - k) * (y1 - y0) * 0.9;
    ctx.fillStyle = "#a16207";
    ctx.strokeStyle = "#451a03";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.rect(x0, y0 - yuk, x1 - x0, y1 - y0); ctx.fill(); ctx.stroke();
    for (let y = y0 + 10; y < y1; y += 20) {
      ctx.beginPath(); ctx.moveTo(x0 + 2, y - yuk); ctx.lineTo(x1 - 2, y - yuk); ctx.stroke();
    }
    // Kapalıyken parlayan kilit
    if (!acik) {
      const alfa = 0.35 + 0.25 * Math.sin(zaman * 3 + i);
      ctx.fillStyle = `rgba(253,224,71,${alfa})`;
      ctx.beginPath(); ctx.arc((x0 + x1) / 2, (y0 + y1) / 2, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fde047";
      ctx.font = "800 18px Nunito, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("🔒", (x0 + x1) / 2, (y0 + y1) / 2);
    }
    ctx.restore();
  }
}
