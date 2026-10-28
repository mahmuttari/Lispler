/* ============================================================
   HAYALET AVCILARI — PETLER (3.15.0)
   Kullanıcının isteği: "Saldırabilen pet ekleyelim karakterlerin yanına kedi köpek kuş gibi."
   - Mağaza › 🐾 Petler: kedi, köpek, kuş paraya alınır; biri "yanına alınır" (save.pet), save.ownedPets sahip olunanlar.
   - Pet oyuncuyu izler. Oyuncuya PET_TASMA px'ten yakın bir hayalet varsa ona koşar ve saldırır; tasmadan uzaklaşınca
     oyuncuya döner, çok geride kalırsa yanına ışınlanır. Hayaletler petlere zarar vermez, petler ölmez.
   - Kedi: çevik, sık pençe. Köpek: güçlü ısırık, hayaleti bir an sersemletir. Kuş: uçar (duvar ve su engel değil),
     tepeden gagalar. Hasar bölümle biraz artar (her 6 bölümde +1).
   - Çevrimiçinde de her oyuncunun peti kendi cihazında koşar; vuruşu mermi gibi kurucuya gider (uzaktanVur). Başka
     oyuncuların peti görünmez.
   Sınama: test/pet.test.mjs.
   ============================================================ */

const PETLER = {
  kedi:  { ad: t("Kedi"),  simge: "🐱", cost: 300, desc: t("Çevik: hayalete atlayıp pençeler."), hiz: 1.15, hasar: 1, ara: 0.55, uzanma: 16 },
  kopek: { ad: t("Köpek"), simge: "🐶", cost: 600, desc: t("Güçlü ısırık: hayaleti bir an sersemletir."), hiz: 1.0, hasar: 2, ara: 1.0, uzanma: 18, sersem: 0.6 },
  kus:   { ad: t("Kuş"),   simge: "🐦", cost: 900, desc: t("Uçar: duvar ve suyun üstünden geçip tepeden gagalar."), hiz: 1.25, hasar: 1, ara: 0.7, uzanma: 12, ucar: true },
};
const PET_TASMA = 260;   // oyuncudan bu kadar uzaktaki hayaletle uğraşmaz (px)
const PET_IZ = 56;       // takipte oyuncunun bu kadar gerisinde durur (px)

const petEngel = (x, y, r) => collidesWalls(x, y, r) || collidesWaters(x, y, r);
const petMesafe = (x, y, r) => Math.min(engelMesafesi(game.walls, x, y, r), engelMesafesi(game.waters, x, y, r));

function petSecili() {
  const k = save.pet;
  return k && PETLER[k] && save.ownedPets && save.ownedPets[k] ? k : "";
}

// startGame ve her yeni bölüm çağırır
function petKur() {
  game.pet = null;
  const tur = petSecili();
  if (!tur || !game.player) return;
  const yer = PETLER[tur].ucar ? { x: game.player.x - 40, y: game.player.y + 20 } : freeSpot(game.player.x - 45, game.player.y + 25, 14, petEngel);
  game.pet = { tur, x: yer.x, y: yer.y, r: 14, yon: 1, yurume: 0, sonVurus: -1e9, saldiri: 0, takili: 0, kanat: 0 };
}

// Bir hayalete vur: tek kişilikte ve kurucuda doğrudan, istemcide kurucuya olay (mermi vuruşuyla aynı yol)
function petVur(g, dmg) {
  spawnHitParticles(g.x, g.y);
  if (online.mode === "client") { uzaktanVur(g, dmg); audio.hit(); return; }
  g.hp -= dmg;
  g.uzakVurdu = false;
  if (g.hp <= 0) killGhost(g, game.ghosts.indexOf(g));
  else audio.hit();
}

function petHedefi(p) {
  let hedef = null, en = Infinity;
  for (const g of game.ghosts) {
    if (Math.hypot(g.x - game.player.x, g.y - game.player.y) > PET_TASMA) continue;
    const d = Math.hypot(g.x - p.x, g.y - p.y);
    if (d < en) { en = d; hedef = g; }
  }
  return hedef;
}

function petYuru(p, hx, hy, hiz, dt) {
  const dx = hx - p.x, dy = hy - p.y, d = Math.hypot(dx, dy);
  if (d < 1) return false;
  const adim = Math.min(d, hiz * dt);
  if (Math.abs(dx) > 2) p.yon = dx > 0 ? 1 : -1;
  if (PETLER[p.tur].ucar) { p.x += (dx / d) * adim; p.y += (dy / d) * adim; return true; }
  return kayarakYuru(p, (dx / d) * adim, (dy / d) * adim, petEngel, petMesafe);
}

// update() her karede çağırır
function petGuncelle(dt, now) {
  const p = game.pet;
  if (!p || !game.player) return;
  const tanim = PETLER[p.tur], oy = game.player;
  const hiz = oy.speed * tanim.hiz;
  p.saldiri = Math.max(0, p.saldiri - dt * 4);
  p.kanat += dt;
  const hedef = oy.dead ? null : petHedefi(p);
  let yurudu = false, vuruyor = false;
  if (hedef) {
    const menzil = hedef.r + p.r + tanim.uzanma;
    const d = Math.hypot(hedef.x - p.x, hedef.y - p.y);
    if (d > menzil) yurudu = petYuru(p, hedef.x, hedef.y, hiz * 1.1, dt);
    else {
      vuruyor = true;
      p.yon = hedef.x >= p.x ? 1 : -1;
      if (now - p.sonVurus >= tanim.ara * 1000) {
        p.sonVurus = now;
        p.saldiri = 1;
        if (tanim.sersem && online.mode !== "client") hedef.frozenUntil = Math.max(hedef.frozenUntil || 0, performance.now() + tanim.sersem * 1000);
        petVur(hedef, tanim.hasar + Math.floor((game.level - 1) / 6));
      }
    }
  } else {
    // Oyuncunun baktığı yönün gerisinde dur
    const a = (oy.facing || 0) + Math.PI;
    const hx = oy.x + Math.cos(a) * PET_IZ, hy = oy.y + Math.sin(a) * PET_IZ + (tanim.ucar ? -30 : 0);
    if (Math.hypot(hx - p.x, hy - p.y) > 18) yurudu = petYuru(p, hx, hy, hiz, dt);
  }
  p.yurume = yurudu ? p.yurume + dt : 0;
  // Gitmek isteyip gidemiyorsa (duvar, su) takılmıştır: 2 sn sonra oyuncunun yanına
  p.takili = !yurudu && !vuruyor && Math.hypot(oy.x - p.x, oy.y - p.y) > PET_IZ + 30 ? p.takili + dt : (hedef && !yurudu && !vuruyor ? p.takili + dt : 0);
  if (Math.hypot(oy.x - p.x, oy.y - p.y) > 650 || p.takili > 2) {
    const yer = tanim.ucar ? { x: oy.x - 40, y: oy.y - 20 } : freeSpot(oy.x - 45, oy.y + 25, p.r, petEngel);
    p.x = yer.x; p.y = yer.y; p.takili = 0;
  }
}

// ---------- çizim ----------
function kediCiz(ctx, s, yurume, saldiri) {
  const ad = Math.sin(yurume * 16) * 3 * s;
  ctx.fillStyle = "#f59e0b"; ctx.strokeStyle = "#7c2d12"; ctx.lineWidth = 1.5 * s;
  ctx.beginPath(); ctx.moveTo(-14 * s, -6 * s); ctx.quadraticCurveTo(-26 * s, -22 * s, -18 * s, -30 * s); ctx.stroke(); // kuyruk
  ctx.lineWidth = 4 * s; ctx.strokeStyle = "#f59e0b"; ctx.stroke();
  ctx.fillStyle = "#d97706";
  for (const [x, f] of [[-8, ad], [8, -ad]]) { ctx.fillRect((x - 2) * s, 2 * s + f * 0.3, 4 * s, 8 * s); }      // bacaklar
  ctx.fillStyle = "#f59e0b";
  ctx.beginPath(); ctx.ellipse(0, 0, 15 * s, 9 * s, 0, 0, Math.PI * 2); ctx.fill();                               // gövde
  ctx.beginPath(); ctx.arc(14 * s, -9 * s, 9 * s, 0, Math.PI * 2); ctx.fill();                                     // baş
  for (const x of [9, 18]) { ctx.beginPath(); ctx.moveTo((x - 4) * s, -14 * s); ctx.lineTo(x * s, -23 * s); ctx.lineTo((x + 4) * s, -14 * s); ctx.fill(); }
  ctx.fillStyle = "#fef3c7"; ctx.beginPath(); ctx.ellipse(17 * s, -6 * s, 4.5 * s, 3.5 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#111";
  ctx.beginPath(); ctx.ellipse(12 * s, -11 * s, 1.4 * s, 2.4 * s, 0, 0, Math.PI * 2); ctx.ellipse(18 * s, -11 * s, 1.4 * s, 2.4 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(19 * s, -7 * s, 1.4 * s, 0, Math.PI * 2); ctx.fill();
  if (saldiri > 0) {                                                                                                // pençe izleri
    ctx.strokeStyle = `rgba(255,255,255,${saldiri})`; ctx.lineWidth = 2 * s;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(26 * s, (-16 + i * 6) * s); ctx.lineTo(36 * s, (-10 + i * 6) * s); ctx.stroke(); }
  }
}

function kopekCiz(ctx, s, yurume, saldiri, zaman) {
  const ad = Math.sin(yurume * 14) * 3 * s, kuyruk = Math.sin(zaman * 14) * 0.5;
  ctx.save(); ctx.translate(-15 * s, -4 * s); ctx.rotate(-0.8 + kuyruk);
  ctx.fillStyle = "#92400e"; ctx.fillRect(-2 * s, -12 * s, 4 * s, 12 * s); ctx.restore();                        // kuyruk
  ctx.fillStyle = "#78350f";
  for (const [x, f] of [[-9, ad], [9, -ad]]) ctx.fillRect((x - 2.5) * s, 3 * s + f * 0.3, 5 * s, 9 * s);           // bacaklar
  ctx.fillStyle = "#b45309";
  ctx.beginPath(); ctx.ellipse(0, 0, 17 * s, 10 * s, 0, 0, Math.PI * 2); ctx.fill();                               // gövde
  ctx.beginPath(); ctx.arc(15 * s, -10 * s, 10 * s, 0, Math.PI * 2); ctx.fill();                                   // baş
  ctx.fillStyle = "#d6a36b"; ctx.beginPath(); ctx.ellipse(23 * s, -7 * s, 7 * s, 5 * s, 0, 0, Math.PI * 2); ctx.fill(); // ağız
  ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(28 * s, -9 * s, 2.2 * s, 0, Math.PI * 2); ctx.fill();           // burun
  ctx.beginPath(); ctx.arc(16 * s, -13 * s, 1.8 * s, 0, Math.PI * 2); ctx.fill();                                   // göz
  ctx.fillStyle = "#78350f"; ctx.beginPath(); ctx.ellipse(9 * s, -9 * s, 4 * s, 9 * s, 0.35, 0, Math.PI * 2); ctx.fill(); // sarkık kulak
  if (saldiri > 0) {                                                                                                // havlama / ısırık
    ctx.fillStyle = "#fff";
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo((20 + i * 3) * s, -3 * s); ctx.lineTo((21.5 + i * 3) * s, 0); ctx.lineTo((23 + i * 3) * s, -3 * s); ctx.fill(); }
    ctx.strokeStyle = `rgba(253,224,71,${saldiri})`; ctx.lineWidth = 2.5 * s;
    ctx.beginPath(); ctx.arc(30 * s, -8 * s, 9 * s, -0.9, 0.9); ctx.stroke();
  }
}

function kusCiz(ctx, s, kanat, saldiri) {
  const cirp = Math.sin(kanat * 22) * 0.9;
  ctx.fillStyle = "#38bdf8";
  ctx.beginPath(); ctx.moveTo(-10 * s, 0); ctx.lineTo(-20 * s, -5 * s); ctx.lineTo(-19 * s, 4 * s); ctx.closePath(); ctx.fill(); // kuyruk
  ctx.beginPath(); ctx.ellipse(0, 0, 12 * s, 8 * s, 0, 0, Math.PI * 2); ctx.fill();                                  // gövde
  ctx.fillStyle = "#e0f2fe"; ctx.beginPath(); ctx.ellipse(3 * s, 3 * s, 7 * s, 4 * s, 0, 0, Math.PI * 2); ctx.fill(); // göğüs
  ctx.fillStyle = "#38bdf8"; ctx.beginPath(); ctx.arc(10 * s, -6 * s, 7 * s, 0, Math.PI * 2); ctx.fill();             // baş
  ctx.fillStyle = "#f59e0b";
  ctx.beginPath(); ctx.moveTo(16 * s, -7 * s); ctx.lineTo((23 + saldiri * 4) * s, -5 * s); ctx.lineTo(16 * s, -3 * s); ctx.closePath(); ctx.fill(); // gaga
  ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(12 * s, -8 * s, 1.6 * s, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.translate(-2 * s, -3 * s); ctx.scale(1, cirp);                                                      // kanat
  ctx.fillStyle = "#0284c7"; ctx.beginPath(); ctx.ellipse(0, -7 * s, 9 * s, 7 * s, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// Petin kendisi (merkez 0,0; sağa bakar); mağaza simgesi de bunu kullanır
function petResmi(ctx, tur, s, durum = {}) {
  const { yurume = 0, saldiri = 0, kanat = 0, zaman = 0 } = durum;
  if (tur === "kedi") kediCiz(ctx, s, yurume, saldiri);
  else if (tur === "kopek") kopekCiz(ctx, s, yurume, saldiri, zaman);
  else kusCiz(ctx, s, kanat, saldiri);
}

// render() oyuncudan önce (kara petleri) ve sonra (kuş) çağırır
function petCiz(ctx, ucanlar) {
  const p = game.pet;
  if (!p || !!PETLER[p.tur].ucar !== !!ucanlar) return;
  const zaman = performance.now() / 1000, ucar = PETLER[p.tur].ucar;
  const yuk = ucar ? 24 + Math.sin(zaman * 3) * 3 - p.saldiri * 14 : Math.abs(Math.sin(p.yurume * 16)) * 2 + p.saldiri * 6;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.25)";                                                                                // gölge
  ctx.beginPath(); ctx.ellipse(p.x, p.y + 10, ucar ? 9 : 15, ucar ? 4 : 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.translate(p.x, p.y - yuk);
  ctx.scale(p.yon, 1);
  petResmi(ctx, p.tur, 1, { yurume: p.yurume, saldiri: p.saldiri, kanat: p.kanat, zaman });
  ctx.restore();
}

// Mağaza kartındaki simge (canvas)
function petSimgesi(tur) {
  const cv = document.createElement("canvas");
  cv.width = 64; cv.height = 52;
  const ctx = cv.getContext("2d");
  ctx.translate(30, 32);
  petResmi(ctx, tur, 1.15, { kanat: 0.05 });
  return cv;
}
