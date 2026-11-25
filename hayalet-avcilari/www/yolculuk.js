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

// Geçit nehri eğrisi: 2-3 sinüsün toplamı, köprü çevresinde (|y-cy| <= köprü yarısı) sıfır,
// ±130 px içinde smoothstep ile sıfıra süzülür. Tohum bölüm/ülke/bölge; her cihazda aynı.
function yolculukGecitEgri(z, bolum, ulke) {
  const A = YOLCULUK_AYAR, g = z.gate;
  if (bolum == null) bolum = (typeof game !== "undefined" && game.level) || 1;
  if (ulke == null) ulke = yolculukUlkeKodu();
  const merkez = (g.x0 + g.x1) / 2;
  const adet = 2 + Math.floor(yolculukRastgele(bolum, ulke, z.i, 210) * 2); // 2 ya da 3
  const toplamAmp = 55 + yolculukRastgele(bolum, ulke, z.i, 211) * 30;      // 55-85 px
  const oranlar = adet === 2 ? [0.85, 0.15] : [0.7, 0.2, 0.1];
  const parcalar = [];
  for (let k = 0; k < adet; k++) {
    parcalar.push({
      amp: toplamAmp * oranlar[k],
      dalga: 220 + yolculukRastgele(bolum, ulke, z.i, 220 + k) * 200, // 220-420 px
      faz: yolculukRastgele(bolum, ulke, z.i, 240 + k) * Math.PI * 2,
    });
  }
  const yumusak = (t) => t * t * (3 - 2 * t);
  const kopruYari = (g.bridgeY1 - g.bridgeY0) / 2;
  const offset = (y) => {
    const dy = Math.abs(y - g.cy);
    const t = Math.max(0, Math.min(1, (dy - kopruYari) / (130 - kopruYari)));
    const k = yumusak(t);
    if (k === 0) return 0;
    let s = 0;
    for (const p of parcalar) s += p.amp * Math.sin((2 * Math.PI * (y - g.cy)) / p.dalga + p.faz);
    return s * k;
  };
  return { merkez, yarim: A.gateW / 2, offset };
}

// 16 px yüksekliğinde yatay dilimler: nehir merkez çizgisini izler (dünya koordinatı)
function yolculukGecitDilimleri(egri) {
  const A = YOLCULUK_AYAR, y0 = 30, y1 = A.worldH - 30, out = [];
  for (let y = y0; y < y1; y += 16) {
    const h = Math.min(16, y1 - y);
    const c = egri.merkez + egri.offset(y + h / 2);
    out.push({ x: c - egri.yarim, y, w: egri.yarim * 2, h });
  }
  return out;
}

// Nehirdeki küçük seviye düşmeleri (şelale): tohumlu, köprüden ve birbirinden en az 200 px uzak.
// 90..910 aralığında 205 px'lik yuvalardan seçilir; böylece her geçitte 2-3 düşme garanti edilir.
function yolculukGecitDusmeleri(egri, z, bolum, ulke) {
  const A = YOLCULUK_AYAR, g = z.gate;
  const adet = 2 + Math.floor(yolculukRastgele(bolum, ulke, z.i, 300) * 2);
  const alt = 90, ust = A.worldH - 30 - 60;
  const yuvalar = [];
  for (let y = alt; y <= ust + 0.01; y += 205) {
    if (Math.abs(y - g.cy) < 201) continue; // köprüden en az 200 px (+1 px jitter payı)
    yuvalar.push(y);
  }
  const sira = yuvalar.map((y, k) => ({ y, r: yolculukRastgele(bolum, ulke, z.i, 300 + k) }));
  sira.sort((a, b) => a.r - b.r);
  const out = [];
  for (let k = 0; k < adet && k < sira.length; k++) {
    const j = (yolculukRastgele(bolum, ulke, z.i, 340 + k) - 0.5) * 2;
    const y = Math.max(alt, Math.min(ust, sira[k].y + j));
    const c = egri.merkez + egri.offset(y);
    out.push({ y, x: c, yarim: egri.yarim, tohum: yolculukRastgele(bolum, ulke, z.i, 360 + k) });
  }
  out.sort((a, b) => a.y - b.y);
  return out;
}

// "Hareketi azalt" tercihi (hava.js ile aynı ölçüt)
function yolculukAzHareket() {
  try { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); }
  catch (e) { return false; }
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
      if (!(audio.hikayeSes && audio.hikayeSes("kopru-ac"))) {
        if (typeof audio.unlock === "function") audio.unlock();
        else if (typeof audio.levelUp === "function") audio.levelUp();
      }
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
    spawnGhost({ x0: zone.x0 + 20, x1: Math.min(zone.gate.x0 - 20, (zone.gecitSol ?? zone.gate.x0) - 30), bolge: z });
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

  // Geçit nehirlerinin geometrisi engellerden önce kurulur: çarpışma, çizim ve hayalet doğum sınırı bunu kullanır
  d.zones.forEach((z) => {
    const egri = yolculukGecitEgri(z, bolum, ulke);
    const dilimler = yolculukGecitDilimleri(egri);
    let minX = Infinity, maxX = -Infinity;
    for (const q of dilimler) { if (q.x < minX) minX = q.x; if (q.x + q.w > maxX) maxX = q.x + q.w; }
    z.gecitSol = minX; z.gecitSag = maxX; z._gecitDilimler = dilimler; z._gecitEgri = egri;
    z._gecitDusmeler = yolculukGecitDusmeleri(egri, z, bolum, ulke);
    z._gecitYol = null; // yol/bank/orta önbellekleri harita kurulunca yenilenir
  });

  let oncekiCy = A.worldH / 2;
  for (let i = 1; i <= A.zoneCount; i++) {
    const z = d.zones[i - 1];
    const icX0 = z.x0 + 30, icX1 = z.gate.x0 - 20; // geçit nehri zaten 160 px ağız bandıyla korunur
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
    const dilimler = z._gecitDilimler, minX = z.gecitSol, maxX = z.gecitSag;
    const o = { x: minX, y: 30, w: maxX - minX, h: A.worldH - 60, gecit: true, tema: gecitTema };
    // Kıvrılan geçit: çarpışma/biçim, merkez çizgiyi izleyen 16 px'lik yatay dilimlerdir (dikdörtgen makinesi değişmez)
    o.bicim = dilimler.map((q) => ({ t: "k", x: q.x - minX, y: q.y - 30, w: q.w, h: q.h, rr: 0 }));
    o.carpisma = o.bicim.map((q) => ({ ...q }));
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
// Geçit nehri: tema suları gibi renk geçişi, eğri kıyılar, taş/kamış. Bir kez temaya özel döşeme çizilir;
// her karede yalnız görünen parça basılır, parıltı çizgileri kaydırılarak canlanır (gölge yok).
const YOLCULUK_GECIT = { anahtar: "", tuval: null, h: 0 };
function yolculukGecitTemasi() {
  try {
    if (typeof turUlkesi === "function") {
      const u = turUlkesi();
      if (u && typeof ulkeTemasi === "function") return ulkeTemasi(u);
    }
  } catch (e) { /* tema yoksa */ }
  return typeof getTheme === "function" ? getTheme()
    : { floor: "#1e293b", wall: "#475569", wallDark: "#1e293b", waterTop: "#1e7fd6", waterBot: "#0a3a8a" };
}
function yolculukGecitDoseme(th) {
  const w = YOLCULUK_AYAR.gateW, h = YOLCULUK_AYAR.worldH - 60;
  const anahtar = [w, h, th.waterTop, th.waterBot, th.wall, th.wallDark, th.floor].join("|");
  if (YOLCULUK_GECIT.anahtar === anahtar) return YOLCULUK_GECIT;
  let c = null, cx = null;
  try { c = document.createElement("canvas"); c.width = w; c.height = h; cx = c.getContext("2d"); } catch (e) { cx = null; }
  if (!cx) { YOLCULUK_GECIT.anahtar = anahtar; YOLCULUK_GECIT.tuval = null; return YOLCULUK_GECIT; }
  const g = cx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, th.waterTop || "#1e7fd6"); g.addColorStop(1, th.waterBot || "#0a3a8a");
  cx.fillStyle = g; cx.fillRect(0, 0, w, h);
  // Durağan dalga çizgileri (tema gölü gibi)
  cx.strokeStyle = "rgba(255,255,255,0.16)"; cx.lineWidth = 1.5;
  for (let y = 18, k = 0; y < h - 6; y += 26, k++) {
    const sol = 10 + Math.sin(y * 0.05) * 2, sag = w - 10 - Math.sin(y * 0.045 + 1.3) * 2;
    cx.beginPath();
    for (let x = sol; x <= sag; x += 8) {
      const yy = y + Math.sin((x + k * 7) / 17) * 1.8;
      if (x === sol) cx.moveTo(x, yy); else cx.lineTo(x, yy);
    }
    cx.stroke();
  }
  // Eğri kıyılar: tema zemin/kenar rengi, iki yanda
  const kiyi = (taraf) => {
    const puan = [];
    for (let y = 0; y <= h; y += 8) {
      const kalin = 9 + Math.sin(y * 0.018 + (taraf < 0 ? 0 : 1.7)) * 2.2 + Math.sin(y * 0.007) * 1.4;
      puan.push([taraf < 0 ? kalin : w - kalin, y]);
    }
    cx.beginPath(); cx.moveTo(taraf < 0 ? 0 : w, 0);
    for (const [x, y] of puan) cx.lineTo(x, y);
    cx.lineTo(taraf < 0 ? 0 : w, h); cx.closePath();
    cx.fillStyle = th.wallDark || th.wall || "#1e293b"; cx.fill();
    cx.beginPath();
    puan.forEach(([x, y], i) => (i ? cx.lineTo(x, y) : cx.moveTo(x, y)));
    cx.strokeStyle = th.wall || th.floor || "#475569"; cx.lineWidth = 2.5; cx.stroke();
  };
  kiyi(-1); kiyi(1);
  // Kıyıda birkaç tema taşı ve kamış (tohumlu)
  const rast = (n) => { const s = Math.sin(n * 91.7 + 13) * 43758.5453; return s - Math.floor(s); };
  for (let i = 0; i < 14; i++) {
    const y = 18 + rast(i) * (h - 36), sol = rast(i + 20) < 0.5;
    const x = sol ? 5 + rast(i + 3) * 7 : w - 5 - rast(i + 3) * 7;
    if (rast(i + 30) < 0.45) {
      cx.strokeStyle = "#4d7c0f"; cx.lineWidth = 1.4;
      for (let j = 0; j < 3; j++) {
        cx.beginPath(); cx.moveTo(x + j * 1.5, y);
        cx.lineTo(x + j * 1.5 + Math.sin(y * 0.05 + j) * 2, y - 7 - j * 2); cx.stroke();
      }
    } else {
      const r = 2.2 + rast(i + 7) * 2.6;
      cx.fillStyle = "rgba(0,0,0,0.25)"; cx.beginPath(); cx.ellipse(x + 1, y + 1.5, r, r * 0.75, 0, 0, Math.PI * 2); cx.fill();
      cx.fillStyle = th.wall || "#64748b"; cx.beginPath(); cx.ellipse(x, y, r, r * 0.75, 0, 0, Math.PI * 2); cx.fill();
      cx.fillStyle = "rgba(255,255,255,0.18)"; cx.beginPath(); cx.ellipse(x - r * 0.3, y - r * 0.3, r * 0.45, r * 0.32, 0, 0, Math.PI * 2); cx.fill();
    }
  }
  YOLCULUK_GECIT.anahtar = anahtar; YOLCULUK_GECIT.tuval = c; YOLCULUK_GECIT.h = h;
  return YOLCULUK_GECIT;
}
function yolculukGecitCiz(ctx) {
  if (!yolculukAcik() || !game._yolculukDuzen) return;
  const cam = game.camera || { x: 0, y: 0 }, W = game.W || 0, H = game.H || 0, A = YOLCULUK_AYAR;
  const gy0 = 30, gy1 = A.worldH - 30;
  if (gy1 < cam.y || gy0 > cam.y + H) return;
  const th = yolculukGecitTemasi();
  const zaman = performance.now() / 1000;
  const vy0 = Math.max(gy0, cam.y - 8), vy1 = Math.min(gy1, cam.y + H + 8);
  if (vy1 <= vy0) return;
  for (const z of game._yolculukDuzen.zones) {
    const egri = z._gecitEgri;
    if (!egri || z.gecitSag < cam.x || z.gecitSol > cam.x + W) continue;
    // Kıyı hattı: her 4 px'de merkez çizgiden (yolculukGecitEgri) sol/sağ bank
    if (!z._gecitYol) {
      const bank = (y) => { const c = egri.merkez + egri.offset(y); return [c - egri.yarim, c + egri.yarim]; };
      const p = new Path2D();
      let b = bank(gy0);
      p.moveTo(b[0], gy0);
      // 4 px adım: kıyı köşesiz, yumuşak görünür (yol bir kez kurulur; çarpışma dilimleri 16 px kalır)
      for (let y = gy0 + 4; y <= gy1; y += 4) { b = bank(y); p.lineTo(b[0], y); }
      b = bank(gy1); p.lineTo(b[1], gy1);
      for (let y = gy1 - 4; y >= gy0; y -= 4) { b = bank(y); p.lineTo(b[1], y); }
      p.closePath();
      z._gecitYol = p;
      // Açık bank çizgileri (duvar) ve merkez çizgisi ayrı yollarda önbelleğe alınır
      const sol = new Path2D(), sag = new Path2D(), orta = new Path2D();
      b = bank(gy0); sol.moveTo(b[0], gy0); sag.moveTo(b[1], gy0);
      orta.moveTo(egri.merkez + egri.offset(gy0), gy0);
      for (let y = gy0 + 4; y <= gy1; y += 4) {
        b = bank(y); sol.lineTo(b[0], y); sag.lineTo(b[1], y);
        orta.lineTo(egri.merkez + egri.offset(y), y);
      }
      z._gecitSolBank = sol; z._gecitSagBank = sag; z._gecitOrta = orta;
    }
    const yol = z._gecitYol, solBank = z._gecitSolBank, sagBank = z._gecitSagBank, orta = z._gecitOrta;
    const azHareket = yolculukAzHareket();
    ctx.save();
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    // Kanal duvarları: su dışında toprak şerit; dış kenarda açık zemin hattı (sol gölgede, sağ aydınlık)
    ctx.strokeStyle = "rgba(255,255,255,0.22)"; ctx.lineWidth = 15; ctx.stroke(solBank); ctx.stroke(sagBank);
    ctx.strokeStyle = th.wallDark || "#1e293b"; ctx.lineWidth = 12; ctx.stroke(solBank);
    ctx.strokeStyle = th.wall || "#475569"; ctx.lineWidth = 12; ctx.stroke(sagBank);
    // Su: kırpma yolu içinde dikey renk geçişi (döşeme varsa onun yerine geçit temasıyla uyumlu geçiş)
    ctx.save();
    ctx.clip(yol);
    const g2 = ctx.createLinearGradient(0, gy0, 0, gy1);
    g2.addColorStop(0, th.waterTop || "#1e7fd6"); g2.addColorStop(1, th.waterBot || "#0a3a8a");
    ctx.fillStyle = g2;
    ctx.fillRect(z.gecitSol, vy0, z.gecitSag - z.gecitSol, vy1 - vy0);
    // Kanal derinliği: banklara yakın iç gölge (geniş sonra ince) ve orta çizgide açık bant
    ctx.strokeStyle = "rgba(0,0,0,0.26)"; ctx.lineWidth = 15; ctx.stroke(yol);
    ctx.strokeStyle = "rgba(0,0,0,0.16)"; ctx.lineWidth = 7; ctx.stroke(yol);
    ctx.strokeStyle = "rgba(255,255,255,0.10)"; ctx.lineWidth = 28; ctx.stroke(orta);
    // Merkez çizgiyi izleyen, aşağı akan parıltı çizgileri (banklara yakın olanlar ince ve soluk)
    for (let k = -1; k <= 1; k++) {
      const kenar = k !== 0;
      ctx.strokeStyle = kenar ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.22)";
      ctx.lineWidth = kenar ? 1 : 1.6;
      ctx.beginPath();
      for (let y = vy0; y <= vy1; y += 6) {
        const x = egri.merkez + egri.offset(y) + k * 18 + Math.sin(y / 23 + zaman * 1.3 + k) * 2.5;
        if (y === vy0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // Küçük şelaleler (seviye düşmeleri): yalnız görünür olanlar
    const zt = azHareket ? 0 : zaman;
    for (const d of z._gecitDusmeler || []) {
      if (d.y < vy0 - 12 || d.y > vy1 + 30) continue;
      const cx = egri.merkez + egri.offset(d.y), ker = d.yarim - 2;
      // Basamağın üstündeki su dudağı hafif aydınlanır
      ctx.strokeStyle = "rgba(255,255,255,0.13)"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(cx - ker, d.y - 5); ctx.lineTo(cx + ker, d.y - 5); ctx.stroke();
      // Alt su seviyesi: koyu basamak çizgisi
      ctx.strokeStyle = "rgba(0,0,0,0.38)"; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(cx - ker, d.y); ctx.lineTo(cx + ker, d.y); ctx.stroke();
      // Köpük bandı (düzensiz, yarı saydam)
      ctx.beginPath();
      for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        const xx = cx - ker + 2 + (2 * ker - 4) * t;
        const yy = d.y + 7 + Math.sin(i * 1.7 + d.tohum * 6) * 2;
        if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
      }
      ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 9; ctx.stroke();
      // Akış çizgisinin düşmede kırılıp parlaması
      ctx.strokeStyle = "rgba(255,255,255,0.40)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx - 12, d.y - 12); ctx.lineTo(cx - 12, d.y - 2); ctx.stroke();
      // Aşağı sürüklenip sönen köpük baloncukları (hareket azaltsa da sabit kalır)
      for (let i = 0; i < 8; i++) {
        const t = (zt * 0.55 + i * 0.37 + d.tohum * 2) % 1;
        const bx = cx + Math.sin(i * 2.1 + zt * 2 + d.tohum * 9) * ker * 0.75;
        const by = d.y + 8 + t * 26;
        ctx.fillStyle = `rgba(255,255,255,${(0.7 * (1 - t)).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(bx, by, 1.2 + (i % 3) * 0.5, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
    // Su ile duvarın buluştuğu koyu gölge çizgisi
    ctx.strokeStyle = "rgba(0,0,0,0.35)"; ctx.lineWidth = 2; ctx.stroke(yol);
    ctx.restore();
  }
}
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
    const kapali = acik ? Math.min(1, anim / 0.6) : 1; // 1 → kapalı, 0 → açık
    const x0 = g.x0 - 4, x1 = g.x1 + 4, y0 = g.bridgeY0, y1 = g.bridgeY1;
    ctx.save();
    // Kalkan köprünün gölgesi
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(x0, y0 + 4, x1 - x0, y1 - y0);
    // Kapı kolları
    ctx.strokeStyle = th.grid || "#64748b";
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.moveTo(x1, y0); ctx.lineTo(x1, y1); ctx.stroke();
    // Kalkık köprü tahtası (üstten bakış: uzak kenar daralır; açılırken yumuşakça iner)
    const yuk = kapali * (y1 - y0) * 0.9;
    const ust = y0 - yuk, alt = y1 - yuk, ic = 4 + kapali * 12;
    ctx.fillStyle = "#a16207";
    ctx.strokeStyle = "#451a03";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x0 + ic, ust); ctx.lineTo(x1 - ic, ust); ctx.lineTo(x1, alt); ctx.lineTo(x0, alt); ctx.closePath();
    ctx.fill(); ctx.stroke();
    for (let q = 1; q < 5; q++) {
      const u = q / 5, yy = ust + (alt - ust) * u;
      ctx.beginPath(); ctx.moveTo(x0 + ic * (1 - u) + 2, yy); ctx.lineTo(x1 - ic * (1 - u) - 2, yy); ctx.stroke();
    }
    // İki zincir: karşı kıyıdan kalkık tahtanın serbest ucuna
    if (kapali > 0.02) {
      ctx.strokeStyle = "rgba(226,232,240,0.8)"; ctx.lineWidth = 2.5;
      const serbestX = x1 - ic;
      ctx.beginPath();
      ctx.moveTo(x1, y0 + 6); ctx.quadraticCurveTo((x1 + serbestX) / 2, (y0 + ust) / 2 - 10, serbestX, ust + 6);
      ctx.moveTo(x1, y1 - 6); ctx.quadraticCurveTo((x1 + serbestX) / 2, (y1 + alt) / 2 + 10, serbestX, alt - 6);
      ctx.stroke();
    }
    // Kapalıyken köprü ağzında parlayan engel çizgisi ve kilit
    if (!acik) {
      const agizX = g.x0 + 2;
      const alfa = 0.35 + 0.25 * Math.sin(zaman * 3 + i);
      ctx.strokeStyle = `rgba(253,224,71,${alfa * 0.6})`;
      ctx.lineWidth = 10;
      ctx.beginPath(); ctx.moveTo(agizX, y0); ctx.lineTo(agizX, y1); ctx.stroke();
      ctx.strokeStyle = "rgba(253,224,71,0.9)"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(agizX, y0); ctx.lineTo(agizX, y1); ctx.stroke();
      ctx.fillStyle = `rgba(253,224,71,${alfa})`;
      ctx.beginPath(); ctx.arc(agizX + 12, (y0 + y1) / 2, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fde047";
      ctx.font = "800 18px Nunito, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("🔒", agizX + 12, (y0 + y1) / 2);
    }
    ctx.restore();
  }
}
