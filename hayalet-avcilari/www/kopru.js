/* ============================================================
   HAYALET AVCILARI — SALLANAN İP KÖPRÜLER (3.15.0)
   Kullanıcının seçimi: "Sallanan ip köprü" — gölün üstünde ip köprü; yürüyerek geçilir, köprü sallanır. Ortada
   çok oyalanan (KOPRU.dusme sn) suya düşer, timsah ısırabilir.
   - Her bölümde en çok KOPRU.sayi köprü; göl ve yön bölüm tohumundan seçilir (çevrimiçinde herkeste aynı). Köprünün iki
     ucu karadadır; uçlar duvar, diken, lav ve başka göle değmez.
   - Köprünün şeridinde (orta çizgiye KOPRU.serbest px'ten yakın) su engel sayılmaz; şeritten çıkan suya takılır.
   - Suyun üstünde hareketsiz kalan sayaç biriktirir (yürüyen eritir); KOPRU.dusme sn'de suya düşer: yandan bir timsah
     çıkar, oyuncu KOPRU.dususSure sn suda çırpınır (yürüyemez), sonra en yakın köprü ucuna çıkar. Suyun içinden geçen
     Beri çırpınmaz, yüzüp kaçabilir.
   - Kıyıda bekleyene saldıran timsah (timsah.js) köprüdeki oyuncuya saldırmaz: köprüde kural düşmedir.
   Sınama: test/kopru.test.mjs.
   ============================================================ */

const KOPRU = {
  sayi: 2,           // bölüm başına en çok köprü
  kalin: 56,         // köprünün eni (px)
  serbest: 18,       // oyuncu merkezinin orta çizgiden en çok uzaklığı (px): bu şeritte su engel değil
  karaPay: 30,       // köprü uçları kıyıdan bu kadar dışarıda (px)
  dusme: 2,          // suyun üstünde bu kadar hareketsiz kalan düşer (sn)
  uyari: 1,          // bu kadar kalınca "Köprü sallanıyor!"
  dususSure: 1.6,    // suda çırpınma (sn); timsahın ısırığı (1,25 sn) bunun içinde
  timsahUzak: 60,    // düşünce timsahın çıktığı yer: oyuncunun yanında (px)
};

function kopruleriKur() {
  game.kopruler = [];
  game._kopruSular = game.waters;
  game._kopruDurma = 0;
  game._kopruUyardi = false;
  if (game.player) game.player.dusus = null; // önceki bölümün köprüsünden düşüş yeni bölüme taşınmaz
  const lvl = game.level || 1;
  const rand = (n) => (Math.sin((61 + lvl * 19 + n) * 91.7) + 1) / 2;
  const sular = (game.waters || []).map((o, i) => ({ o, i })).sort((p, q) => rand(p.i) - rand(q.i));
  for (const { o, i } of sular) {
    if (game.kopruler.length >= KOPRU.sayi) break;
    for (const yatay of rand(i + 7) < 0.5 ? [true, false] : [false, true]) {
      const k = kopruDene(o, yatay);
      if (k) { game.kopruler.push(k); break; }
    }
  }
}

// Gölün ortasından (ya da biraz yanından) geçen, iki ucu karada bir köprü; olmazsa null.
// Köprü {su, yatay, a, b, c}: yatayda x = a…b, y = c; dikeyde y = a…b, x = c
function kopruDene(o, yatay) {
  for (const kay of [0, -0.18, 0.18]) {
    const c = yatay ? o.y + o.h / 2 + kay * o.h : o.x + o.w / 2 + kay * o.w;
    const nokta = (s) => (yatay ? [s, c] : [c, s]);
    const orta = yatay ? o.x + o.w / 2 : o.y + o.h / 2;
    if (suUzakligi(o, ...nokta(orta)) > -20) continue;
    const uc = (yon) => {
      let s = orta;
      for (let i = 0; i < 300; i++) { s += yon * 2; if (suUzakligi(o, ...nokta(s)) > KOPRU.karaPay) return s; }
      return null;
    };
    const a = uc(-1), b = uc(1);
    if (a == null || b == null) continue;
    let uygun = true;
    for (const s of [a, b]) {
      const [x, y] = nokta(s), r = 26;
      if (x < 50 || y < 50 || x > game.worldW - 50 || y > game.worldH - 50) uygun = false;
      else if (collidesWalls(x, y, r) || collidesSpikes(x, y, r) || collidesLavas(x, y, r)) uygun = false;
      else if (game.waters.some((w) => w !== o && suUzakligi(w, x, y) < r)) uygun = false;
    }
    for (let s = a; s <= b && uygun; s += 10) {
      const [x, y] = nokta(s);
      if (collidesWalls(x, y, KOPRU.kalin / 2) || collidesLavas(x, y, KOPRU.kalin / 2)) uygun = false;
    }
    if (uygun) return { su: o, yatay, a, b, c };
  }
  return null;
}

function koprulerHazir() {
  if (game._kopruSular !== game.waters || !game.kopruler) kopruleriKur();
  return game.kopruler;
}

// (x, y) bir köprünün şeridindeyse o köprü
function koprudeki(x, y) {
  for (const k of koprulerHazir()) {
    const boy = k.yatay ? x : y, en = k.yatay ? y : x;
    if (boy >= k.a - 4 && boy <= k.b + 4 && Math.abs(en - k.c) <= KOPRU.serbest) return k;
  }
  return null;
}
function koprudeMi(x, y) { return !!koprudeki(x, y); }

// Oyuncunun yürüyüşü için su: köprünün şeridinde engel değil
function kopruluSuCarpar(x, y, r) { return collidesWaters(x, y, r) && !koprudeMi(x, y); }
function kopruluSuMesafesi(x, y, r) { return koprudeMi(x, y) ? Infinity : engelMesafesi(game.waters, x, y, r); }

function kopruUclari(k) {
  return k.yatay ? [{ x: k.a, y: k.c }, { x: k.b, y: k.c }] : [{ x: k.c, y: k.a }, { x: k.c, y: k.b }];
}

function suyaDus(k) {
  const p = game.player;
  game._kopruDurma = 0;
  game._kopruUyardi = false;
  showFloat(t("💦 Suya düştün!"), p.x, p.y - 30);
  audio.noise(0.35, 0.14 * (audio._v ? audio._v("sfx") : 1));
  navigator.vibrate?.(60);
  // Timsah köprünün bir yanından, oyuncuya dönük
  const yan = Math.random() < 0.5 ? -1 : 1;
  let ox = k.yatay ? 0 : yan * KOPRU.timsahUzak, oy = k.yatay ? yan * KOPRU.timsahUzak : 0;
  if (enYakinSu(p.x + ox, p.y + oy).d > -6) { ox = -ox; oy = -oy; }
  if (game._timsahSular !== game.waters || !game.timsahlar) timsahSifirla();
  const tx = p.x + ox, ty = p.y + oy;
  game.timsahlar.push({ tur: "saldiri", x: tx, y: ty, a: Math.atan2(p.y - ty, p.x - tx), t: 0, isirdi: false });
  if (!p.waterImmune) p.dusus = { t: 0, k };
}

// update() oyuncu yürüdükten sonra çağırır; yurudu = bu karede yer değiştirdi mi
function kopruGuncelle(dt, yurudu) {
  koprulerHazir();
  const p = game.player;
  if (!p) return;
  if (p.dusus) {
    p.dusus.t += dt;
    if (p.dusus.t >= KOPRU.dususSure) {
      const uclar = kopruUclari(p.dusus.k);
      const u = Math.hypot(uclar[0].x - p.x, uclar[0].y - p.y) <= Math.hypot(uclar[1].x - p.x, uclar[1].y - p.y) ? uclar[0] : uclar[1];
      p.x = u.x; p.y = u.y;
      p.dusus = null;
      p.invuln = Math.max(p.invuln || 0, 0.6);
    }
    return;
  }
  const k = !p.dead && koprudeki(p.x, p.y);
  if (!k || enYakinSu(p.x, p.y).d >= 0) { game._kopruDurma = 0; game._kopruUyardi = false; return; }
  game._kopruDurma = yurudu ? Math.max(0, game._kopruDurma - dt * 2) : game._kopruDurma + dt;
  if (game._kopruDurma >= KOPRU.uyari && !game._kopruUyardi) {
    game._kopruUyardi = true;
    showFloat(t("🌉 Köprü sallanıyor!"), p.x, p.y - 30);
  }
  if (game._kopruDurma < KOPRU.uyari / 2) game._kopruUyardi = false;
  if (game._kopruDurma >= KOPRU.dusme) suyaDus(k);
}

// Suya düşen oyuncu ne kadar batık çizilir (px)
function kopruBatma() {
  const d = game.player && !game.player.dead && game.player.dusus;
  if (!d) return 0;
  const u = d.t / KOPRU.dususSure;
  return 22 * Math.min(1, u * 6, (1 - u) * 4 + 0.4);
}

// ---------- çizim ----------
// render() sulardan sonra, timsahlardan önce çağırır
function koprulerCiz(ctx) {
  const zaman = performance.now() / 1000, p = game.player;
  const cam = game.camera || { x: 0, y: 0 }, W = game.W || 1e9, H = game.H || 1e9;
  for (const k of koprulerHazir()) {
    const [x0, y0] = k.yatay ? [k.a, k.c] : [k.c, k.a], [x1, y1] = k.yatay ? [k.b, k.c] : [k.c, k.b], pay = KOPRU.kalin;
    if (x1 + pay < cam.x || x0 - pay > cam.x + W || y1 + pay < cam.y || y0 - pay > cam.y + H) continue; // ekran dışı
    const boy = k.b - k.a, yari = KOPRU.kalin / 2;
    const ustunde = p && !p.dead && koprudeki(p.x, p.y) === k;
    const genlik = 1.5 + (ustunde ? 1.5 + (game._kopruDurma || 0) * 3 : 0);
    const kay = (s) => genlik * Math.sin(zaman * 3.2 + s * 0.03) * Math.sin(Math.PI * Math.min(1, Math.max(0, (s - k.a) / boy)));
    const P = (s, q) => (k.yatay ? [s, k.c + q + kay(s)] : [k.c + q + kay(s), s]);
    ctx.save();
    // Suya düşen gölge
    ctx.strokeStyle = "rgba(0,0,0,0.22)"; ctx.lineWidth = KOPRU.kalin - 6; ctx.lineCap = "butt";
    ctx.beginPath();
    for (let s = k.a; s <= k.b; s += 8) { const [x, y] = P(s, 7); s === k.a ? ctx.moveTo(x + 4, y) : ctx.lineTo(x + 4, y); }
    ctx.stroke();
    // Tahtalar
    let i = 0;
    for (let s = k.a + 7; s <= k.b - 5; s += 13, i++) {
      const [x, y] = P(s, 0);
      ctx.save();
      ctx.translate(x, y);
      if (!k.yatay) ctx.rotate(Math.PI / 2);
      ctx.rotate(Math.sin(i * 1.7) * 0.05 + kay(s) * 0.01);
      ctx.fillStyle = i % 2 ? "#a16207" : "#92400e";
      ctx.strokeStyle = "#451a03"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.rect(-4.5, -yari + 4, 9, KOPRU.kalin - 8); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    // İpler ve bağlar
    for (const q of [-yari + 2, yari - 2]) {
      ctx.strokeStyle = "#e7c99a"; ctx.lineWidth = 3; ctx.lineCap = "round";
      ctx.beginPath();
      for (let s = k.a; s <= k.b + 0.1; s += 6) { const [x, y] = P(Math.min(s, k.b), q); s === k.a ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.stroke();
      ctx.strokeStyle = "#a8875a"; ctx.lineWidth = 1.5;
      for (let s = k.a + 13; s < k.b - 6; s += 26) {
        const [x1, y1] = P(s, q), [x2, y2] = P(s, q * 0.8);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }
    }
    // Uçlarda direkler
    for (const s of [k.a, k.b]) for (const q of [-yari, yari]) {
      const [x, y] = k.yatay ? [s, k.c + q] : [k.c + q, s];
      ctx.fillStyle = "#78350f"; ctx.beginPath(); ctx.arc(x, y, 6.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#b45309"; ctx.beginPath(); ctx.arc(x - 1.5, y - 1.5, 3.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
}

// Suya düşen oyuncunun çevresinde halkalar (oyuncudan sonra çizilir)
function dususCiz(ctx) {
  const p = game.player;
  if (!p || !p.dusus) return;
  const z = p.dusus.t;
  ctx.save();
  for (let i = 0; i < 3; i++) {
    const u = (z * 1.4 + i / 3) % 1;
    ctx.strokeStyle = `rgba(255,255,255,${0.6 * (1 - u)})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(p.x, p.y + 8, 20 + u * 26, (20 + u * 26) * 0.45, 0, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}
