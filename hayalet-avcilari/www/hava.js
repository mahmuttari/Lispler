/* ============================================================
   HAYALET AVCILARI — HAVA: YARASALAR VE FIRTINA BULUTU (3.17.0)
   Kullanıcının isteği: "Eğlence amaçlı bir şeyler ekleyelim. Mesela yarasalar uçuşsun ormanda. Arada şimşek çakan
   bulutlar gezinsin. Bosun üzerinde."
   - Yarasalar: Yeşil Orman bölümlerinde arada bir 5–9 yarasalık sürü kamera görüşünün bir yanından öbürüne
     dalgalanarak uçar; çıkarken kısa bir cıvıltı.
   - Fırtına bulutu: Uzay dışındaki bölümlerde (Dünya Turu dahil) arada bir görüşün bir yanından öbürüne süzülür, birkaç
     saniyede bir şimşek çakar. Boss gelince bulut boss'un tepesine yerleşir, onu izler ve daha sık çakar.
   - Yalnız görsel ve ses: kimseye zarar vermez, oyunu değiştirmez. Çevrimiçinde her cihaz kendi gökyüzünü çizer (boss
     herkeste aynı yerde olduğu için bulut da aynı yerde durur). "Hareketi azalt" tercihinde ekran parlaması yok.
   Sınama: test/hava.test.mjs.
   ============================================================ */

const HAVA = {
  suruAra: [6, 12],      // iki yarasa sürüsü arası (sn)
  suruBoy: [5, 9],      // sürüdeki yarasa sayısı
  yarasaHiz: [170, 240],  // px/sn
  bulutAra: [22, 38],     // iki gezgin bulut arası (sn)
  bulutHiz: [38, 58],     // gezgin bulut hızı (px/sn)
  simsekAra: [2.6, 5.5],  // gezgin bulutta iki şimşek arası (sn)
  bossSimsekAra: [1.6, 3.2],
  simsekSure: 0.32,       // şimşeğin ekranda kaldığı süre (sn)
  bossUst: 120,           // bulut boss merkezinin bu kadar üstünde
};

const havaRast = (a, b) => a + Math.random() * (b - a);
const havaAzHareket = () => (typeof animAzHareket === "function" ? animAzHareket() : !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches));

// Sınama kancası: 25% oyuncuya nişan dalını zorlar (oyun akışını değiştirmez)
let havaTestZorlaHedef = false;
function havaTestHedefZorla(v) { havaTestZorlaHedef = !!v; }

// Gezgin bulutun salınımı: 2-3 farklı frekanslı sinüs, toplam genlik 60-110 px
function bulutGezintiKur(bl) {
  bl.byFrac = havaRast(0.12, 0.45);
  bl.wT = 0;
  bl.hizFaz = havaRast(0, Math.PI * 2);
  bl.hizFrek = havaRast(0.35, 0.8);
  const adet = havaRast(0, 1) < 0.5 ? 2 : 3;
  const agirlik = [];
  let top = 0;
  for (let i = 0; i < adet; i++) { agirlik[i] = havaRast(0.3, 1); top += agirlik[i]; }
  const genlik = havaRast(60, 110);
  bl.dalgalar = agirlik.map((w) => ({ f: havaRast(0.4, 1.6), a: genlik * w / top, p: havaRast(0, Math.PI * 2) }));
}

// Var olan bulut görsellerinden birini seçer (bulut, bulut-2..4); hiçbiri yoksa "bulut"
function bulutResmiSec() {
  const aday = [];
  if (typeof gorsel === "function" && gorsel("bulut")) aday.push("bulut");
  for (let i = 2; i <= 4; i++) if (typeof gorsel === "function" && gorsel(`bulut-${i}`)) aday.push(`bulut-${i}`);
  return aday.length ? aday[Math.floor(havaRast(0, aday.length))] : "bulut";
}

// Var olan şimşek görsellerinden birini seçer; hiçbiri yoksa null (kod çizimi)
function simsekResmiSec() {
  const aday = [];
  for (let i = 1; i <= 3; i++) if (typeof gorsel === "function" && gorsel(`simsek-${i}`)) aday.push(`simsek-${i}`);
  return aday.length ? aday[Math.floor(havaRast(0, aday.length))] : null;
}

// startGame ve her yeni bölüm çağırır
function havaKur() {
  game.hava = {
    yarasalar: [],
    suruSayac: havaRast(2, 5), // bölüm başında kısa süre sonra ilk sürü
    bulut: null,
    bulutSayac: havaRast(8, 16),
    simsekler: [],
    parlama: 0,
  };
}

function havaTemasi() {
  const th = game.dunyaTuru ? null : getTheme(); // Dünya Turu'nda ülkenin teması: bulut var, yarasa yok
  return { orman: th === LEVEL_THEMES[1], uzay: th === LEVEL_THEMES[5] };
}

function havaBoss() {
  for (const g of game.ghosts) if (g.isBoss && Number.isFinite(g.x)) return g;
  return null;
}

function yarasaSurusu() {
  const h = game.hava, cam = game.camera, W = game.W, H = game.H;
  const soldan = Math.random() < 0.5, yon = soldan ? 1 : -1;
  const n = Math.round(havaRast(HAVA.suruBoy[0], HAVA.suruBoy[1]));
  const y0 = cam.y + havaRast(0.12, 0.6) * H, hiz = havaRast(HAVA.yarasaHiz[0], HAVA.yarasaHiz[1]);
  for (let i = 0; i < n; i++) {
    const y = y0 + havaRast(-50, 50);
    h.yarasalar.push({
      x: (soldan ? cam.x - 40 : cam.x + W + 40) - yon * (i * havaRast(18, 34)),
      y, y0: y, yon, hiz: hiz * havaRast(0.9, 1.1),
      faz: Math.random() * 6.28, dalga: havaRast(10, 26), boy: havaRast(0.8, 1.25), kanat: Math.random() * 6.28,
    });
  }
  if (typeof audio !== "undefined" && audio.beep) {
    const v = audio._v ? audio._v("sfx") : 1;
    [0, 70, 150].forEach((ms, i) => setTimeout(() => audio.beep(2600 + i * 260, 0.03, "sine", 0.035 * v), ms));
  }
}

function simsekCak(bulut, hedef) {
  const h = game.hava;
  const oyuncu = game.player;
  // Boss dışında 25% olasılıkla (bulut oyuncunun 220 px yakınındaysa) şimşek oyuncuya nişan alır
  const oyuncuyaNisan = !hedef && oyuncu && !oyuncu.dead && !oyuncu.gizli &&
    (havaTestZorlaHedef || (Math.random() < 0.25 && Math.abs(bulut.x - oyuncu.x) < 220));
  const x0 = bulut.x + havaRast(-22, 22), y0 = bulut.y + 18;
  let x1 = hedef ? hedef.x + havaRast(-60, 60) : oyuncuyaNisan ? oyuncu.x : x0 + havaRast(-50, 50);
  let y1 = hedef ? hedef.y + havaRast(-10, 30) : oyuncuyaNisan ? oyuncu.y : y0 + havaRast(150, 230);
  // Şimşeğin ucu bir karaktere (r + 18) kadar yakınsa tam merkezine oturur ve çarpılma efekti başlar
  const adaylar = [];
  if (oyuncu && !oyuncu.dead && !oyuncu.gizli) adaylar.push(oyuncu);
  if (game.bot && !(game.bot.hp <= 0)) adaylar.push(game.bot);
  if (game.pet && !(game.pet.baygin > 0)) adaylar.push(game.pet);
  let vurulan = null;
  for (const c of adaylar) if (Math.hypot(x1 - c.x, y1 - c.y) <= (c.r || 22) + 18) { vurulan = c; break; }
  if (vurulan) {
    x1 = vurulan.x; y1 = vurulan.y;
    vurulan.carpilma = { kalan: 0.9, bas: performance.now() / 1000 };
    if (typeof showFloat === "function") showFloat("⚡", vurulan.x, vurulan.y - 36 - (vurulan.r || 22));
    if (typeof audio !== "undefined" && typeof audio.zap === "function") audio.zap();
  }
  const noktalar = [[x0, y0]];
  const adim = 7;
  for (let i = 1; i < adim; i++) {
    const k = i / adim;
    noktalar.push([x0 + (x1 - x0) * k + havaRast(-16, 16), y0 + (y1 - y0) * k + havaRast(-6, 6)]);
  }
  noktalar.push([x1, y1]);
  const kol = noktalar.slice(2, 5).map(([x, y]) => [[x, y], [x + havaRast(-40, 40), y + havaRast(20, 50)]]);
  h.simsekler.push({ noktalar, kol, omur: HAVA.simsekSure, resim: simsekResmiSec() });
  if (!havaAzHareket()) h.parlama = Math.max(h.parlama, 0.16);
  bulut.cakti = 0.25;
  if (typeof audio !== "undefined") {
    const v = audio._v ? audio._v("sfx") : 1;
    setTimeout(() => { // ışıktan biraz sonra gök gürültüsü
      if (typeof audio.gok === "function") audio.gok();
      else if (audio.noise) audio.noise(0.9, 0.12 * v);
    }, 140);
  }
}

// update() her karede çağırır (kurucuda ve istemcide)
function havaGuncelle(dt) {
  if (!game.hava) havaKur();
  const h = game.hava, cam = game.camera, W = game.W, H = game.H;
  const tema = havaTemasi();

  // Yarasalar
  if (tema.orman) {
    h.suruSayac -= dt;
    if (h.suruSayac <= 0) { yarasaSurusu(); h.suruSayac = havaRast(HAVA.suruAra[0], HAVA.suruAra[1]); }
  }
  for (const b of h.yarasalar) {
    b.x += b.yon * b.hiz * dt;
    b.faz += dt * 3;
    b.kanat += dt * 22;
    b.y = b.y0 + Math.sin(b.faz) * b.dalga;
  }
  h.yarasalar = h.yarasalar.filter((b) => b.yon > 0 ? b.x < cam.x + W + 120 : b.x > cam.x - 120);

  // Fırtına bulutu
  const boss = tema.uzay ? null : havaBoss();
  if (!h.bulut && !tema.uzay) {
    h.bulutSayac -= dt;
    if (boss || h.bulutSayac <= 0) {
      const soldan = Math.random() < 0.5;
      h.bulut = { x: soldan ? cam.x - 140 : cam.x + W + 140, y: cam.y + havaRast(0.12, 0.3) * H, yon: soldan ? 1 : -1,
        hiz: havaRast(HAVA.bulutHiz[0], HAVA.bulutHiz[1]), sayac: havaRast(1, 2.5), cakti: 0, tohum: Math.random() * 10,
        resim: bulutResmiSec() };
      bulutYagmurKur(h.bulut);
    }
  }
  const bl = h.bulut;
  if (bl) {
    if (boss) {
      // Boss'un tepesine yumuşakça yerleşir ve onu izler
      const hx = boss.x, hy = boss.y - (boss.r || 40) - HAVA.bossUst;
      const k = Math.min(1, dt * 2.2);
      bl.x += (hx - bl.x) * k; bl.y += (hy - bl.y) * k;
      bl.boss = true;
    } else {
      if (!bl.dalgalar) bulutGezintiKur(bl); // gezgin bulut: kaotik yukarı-aşağı salınım
      bl.wT += dt;
      const hizCarpan = 1 + 0.4 * Math.sin(bl.wT * bl.hizFrek + bl.hizFaz); // 60%-140%, asla ters dönmez
      bl.x += bl.yon * bl.hiz * hizCarpan * dt;
      let dy = 0;
      const az = havaAzHareket() ? 0.5 : 1;
      for (const d of bl.dalgalar) dy += Math.sin(bl.wT * d.f + d.p) * d.a * az;
      bl.y = Math.max(cam.y + 0.06 * H, Math.min(cam.y + 0.6 * H, cam.y + bl.byFrac * H + dy)); // görüş içinde kalır
      if (bl.boss) { bl.boss = false; bl.yon = bl.x < cam.x + W / 2 ? -1 : 1; } // boss yenildi: bulut çekip gider
    }
    bl.cakti = Math.max(0, bl.cakti - dt);
    bulutYagmurGuncelle(bl, dt);
    bl.sayac -= dt;
    if (bl.sayac <= 0) {
      simsekCak(bl, boss);
      const ara = boss ? HAVA.bossSimsekAra : HAVA.simsekAra;
      bl.sayac = havaRast(ara[0], ara[1]);
    }
    const disarda = bl.yon > 0 ? bl.x > cam.x + W + 200 : bl.x < cam.x - 200;
    if (!boss && disarda) { h.bulut = null; h.bulutSayac = havaRast(HAVA.bulutAra[0], HAVA.bulutAra[1]); }
  }
  for (const s of h.simsekler) s.omur -= dt;
  h.simsekler = h.simsekler.filter((s) => s.omur > 0);
  h.parlama = Math.max(0, h.parlama - dt * 0.8);
  // Çarpılma efekti sayacı (yalnız görsel)
  for (const c of [game.player, game.bot, game.pet]) {
    if (c && c.carpilma) { c.carpilma.kalan -= dt; if (c.carpilma.kalan <= 0) c.carpilma = null; }
  }
}

// Fırtına bulutunun yağmuru: damla havuzu bulutla birlikte bir kez kurulur (kare başına ayırma yok)
function bulutYagmurKur(bl) {
  const az = havaAzHareket();
  const adet = Math.round(az ? havaRast(14, 20) : havaRast(26, 40));
  const damlalar = [];
  for (let i = 0; i < adet; i++) {
    damlalar.push({ ox: havaRast(-61, 61), y: havaRast(0, 200), boy: havaRast(10, 16), hiz: havaRast(380, 520),
      mesafe: havaRast(120, 220), aci: havaRast(8, 12) * Math.PI / 180, splash: 0, sx: 0, sy: 0 });
  }
  bl.yagmur = { alt: 42, az, damlalar }; // alt: bulutun alt kenarı (yerel koordinat)
}

function bulutYagmurGuncelle(bl, dt) {
  const y = bl.yagmur || (bulutYagmurKur(bl), bl.yagmur);
  const yon = bl.boss ? 1 : bl.yon; // rüzgâr bulutun gittiği yöne doğru (boss bulutunda sabit)
  for (const d of y.damlalar) {
    d.y += d.hiz * dt;
    d.ox += Math.tan(d.aci) * d.hiz * dt * yon;
    if (d.splash > 0) d.splash = Math.max(0, d.splash - dt);
    if (d.y >= d.mesafe) {
      if (!y.az) d.splash = 0.3; // çarpma sıçraması (hareketi azalt açıkken yok)
      d.sx = d.ox; d.sy = d.y;
      d.y = 0; d.ox = havaRast(-61, 61); d.mesafe = havaRast(120, 220);
      d.hiz = havaRast(380, 520); d.boy = havaRast(10, 16); d.aci = havaRast(8, 12) * Math.PI / 180;
    }
  }
}

function bulutYagmurCiz(ctx, bl) {
  const y = bl.yagmur;
  if (!y || !y.damlalar.length) return;
  const cam = game.camera, W = game.W;
  if (bl.x + 80 < cam.x || bl.x - 80 > cam.x + W) return; // görüşte değilse çizme
  const yon = bl.boss ? 1 : bl.yon;
  const alfa = 0.55 + (bl.cakti > 0 ? 0.2 : 0); // şimşek çakınca kısa süre parlak
  ctx.save();
  ctx.translate(bl.x, bl.y);
  ctx.strokeStyle = `rgba(190,210,235,${alfa})`;
  ctx.lineWidth = 1.7;
  ctx.lineCap = "round";
  for (const d of y.damlalar) {
    const sy = y.alt + d.y, sx = d.ox;
    // ChatGPT damlası (yagmur-damla): yağış yönüne eğik, ~10 × 14 px; yoksa bugünkü çizgi
    if (typeof gorselKutuya === "function") {
      ctx.save();
      ctx.translate(sx, sy - 7);
      ctx.rotate(d.aci * yon);
      if (gorselKutuya(ctx, "yagmur-damla", -5, -7, 10, 14)) { ctx.restore(); }
      else { ctx.restore(); ctx.beginPath(); ctx.moveTo(sx - Math.sin(d.aci) * d.boy * yon, sy - Math.cos(d.aci) * d.boy); ctx.lineTo(sx, sy); ctx.stroke(); }
    } else {
      ctx.beginPath(); ctx.moveTo(sx - Math.sin(d.aci) * d.boy * yon, sy - Math.cos(d.aci) * d.boy); ctx.lineTo(sx, sy); ctx.stroke();
    }
    if (d.splash > 0) { // küçük halka sıçraması, 0.3 sn'de söner
      ctx.globalAlpha = d.splash / 0.3;
      if (!(typeof gorselKutuya === "function" && gorselKutuya(ctx, "su-halka", d.sx - 9, y.alt + d.sy - 5, 18, 11))) {
        ctx.beginPath(); ctx.ellipse(d.sx, y.alt + d.sy, 4, 1.5, 0, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
}

// ---------- çizim ----------
function yarasaCiz(ctx, b) {
  const s = 9 * b.boy, cirp = Math.sin(b.kanat);
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.scale(b.yon, 1);
  const kare = typeof animHazir === "function" && animHazir("yarasa") ? (cirp > 0.33 ? 1 : cirp < -0.33 ? 3 : 2) : 0;
  if (kare) { // ChatGPT kanat kareleri (N11): yukarı, düz, aşağı
    animGovdeCiz(ctx, "yarasa", kare, -2.3 * s, -0.95 * s, 4.6 * s, 1.6 * s, false);
    ctx.restore();
    return;
  }
  if (typeof gorsel === "function" && gorsel("yarasa")) {
    // ChatGPT görseli: kanat çırpışı dikey basılmayla (kare kareler yoksa)
    ctx.scale(1, 0.72 + 0.28 * Math.abs(cirp));
    gorselKutuya(ctx, "yarasa", -2.3 * s, -0.95 * s, 4.6 * s, 1.6 * s);
    ctx.restore();
    return;
  }
  ctx.fillStyle = "#14091f";
  ctx.beginPath(); // kanatlar: çırpınca yukarı-aşağı
  ctx.moveTo(-2, 0);
  ctx.quadraticCurveTo(-s * 1.2, -s * (0.9 * cirp + 0.2), -s * 2.2, -s * 0.2 * cirp);
  ctx.quadraticCurveTo(-s * 1.4, s * 0.35, -s * 0.9, s * 0.2);
  ctx.quadraticCurveTo(-s * 0.5, s * 0.45, 0, s * 0.25);
  ctx.quadraticCurveTo(s * 0.5, s * 0.45, s * 0.9, s * 0.2);
  ctx.quadraticCurveTo(s * 1.4, s * 0.35, s * 2.2, -s * 0.2 * cirp);
  ctx.quadraticCurveTo(s * 1.2, -s * (0.9 * cirp + 0.2), 2, 0);
  ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, 0, s * 0.42, s * 0.55, 0, 0, Math.PI * 2); ctx.fill(); // gövde
  ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.4); ctx.lineTo(-s * 0.18, -s * 0.85); ctx.lineTo(-s * 0.02, -s * 0.45); // kulaklar
  ctx.moveTo(s * 0.3, -s * 0.4); ctx.lineTo(s * 0.18, -s * 0.85); ctx.lineTo(s * 0.02, -s * 0.45); ctx.fill();
  ctx.fillStyle = "#f87171";
  ctx.fillRect(-s * 0.2, -s * 0.2, s * 0.13, s * 0.13);
  ctx.fillRect(s * 0.07, -s * 0.2, s * 0.13, s * 0.13);
  ctx.restore();
}

function bulutCiz(ctx, bl) {
  const zaman = performance.now() / 1000;
  ctx.save();
  ctx.translate(bl.x, bl.y);
  ctx.fillStyle = "rgba(0,0,0,0.18)"; // yerdeki gölge, bulutun boss'a göre yerini gösterir
  ctx.beginPath(); ctx.ellipse(0, bl.boss ? HAVA.bossUst + 30 : 150, 70, 16, 0, 0, Math.PI * 2); ctx.fill();
  const parca = [[-46, 6, 26], [-18, -10, 34], [16, -14, 32], [44, 2, 26], [0, 10, 30], [-30, 16, 22], [30, 16, 22]];
  const aydinlik = bl.cakti > 0 ? 1 : 0;
  const anahtar = bl.boss ? "bulut" : (bl.resim || "bulut");
  if (typeof gorsel === "function" && gorsel(anahtar)) {
    // ChatGPT görseli: hafifçe kabarır; şimşek çakınca aydınlanır
    ctx.scale(1 + Math.sin(zaman * 1.3) * 0.02, 1 + Math.cos(zaman * 1.1) * 0.025);
    gorselKutuya(ctx, anahtar, -76, -50, 152, 96);
    if (aydinlik) { ctx.globalAlpha = 0.55; resmiKutuyaCiz(ctx, gorselRenkli(anahtar, "#e0e7ff", "doldur"), -76, -50, 152, 96); }
    ctx.restore();
    return;
  }
  ctx.fillStyle = aydinlik ? "#9ca3c7" : "#3b3f5c";
  for (const [x, y, r] of parca) {
    ctx.beginPath(); ctx.arc(x + Math.sin(zaman + x) * 1.5, y, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = aydinlik ? "#c7cbe6" : "#565b7d";
  for (const [x, y, r] of parca.slice(0, 4)) {
    ctx.beginPath(); ctx.arc(x - 4, y - 6, r * 0.6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function simsekCiz(ctx, s) {
  const a = Math.max(0, s.omur / HAVA.simsekSure);
  const im = s.resim && typeof gorsel === "function" ? gorsel(s.resim) : null;
  if (im) { // ChatGPT şimşek görseli: başlangıç ve bitiş arasına gerilir
    const [x0, y0] = s.noktalar[0], [x1, y1] = s.noktalar[s.noktalar.length - 1];
    const uz = Math.hypot(x1 - x0, y1 - y0) || 1;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(x0, y0); ctx.rotate(Math.atan2(y1 - y0, x1 - x0));
    ctx.drawImage(im, 0, -32, uz, 64);
    ctx.restore();
    return;
  }
  const yol = (noktalar) => { ctx.beginPath(); ctx.moveTo(noktalar[0][0], noktalar[0][1]); for (const [x, y] of noktalar.slice(1)) ctx.lineTo(x, y); ctx.stroke(); };
  ctx.save();
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.strokeStyle = `rgba(253, 224, 71, ${0.35 * a})`; ctx.lineWidth = 9; yol(s.noktalar); // ışıltı
  ctx.strokeStyle = `rgba(255, 255, 255, ${a})`; ctx.lineWidth = 3; yol(s.noktalar);
  ctx.lineWidth = 1.5;
  for (const k of s.kol) yol(k);
  ctx.restore();
}

// Şimşek çarpan karakterde kısa, yalnız görsel "çarpılma" efekti
function carpilmaCiz(ctx, c) {
  const e = c.carpilma;
  if (!e || e.kalan <= 0) return;
  const gecen = Math.max(0, performance.now() / 1000 - e.bas);
  const az = havaAzHareket(), r = c.r || 22;
  const n = typeof animHazir === "function" ? animHazir("carpilma") : 0;
  ctx.save();
  if (n) {
    const s = r * 4.8; // yaklaşık 2.4× karakter yarıçapı yarıçaplı hale
    animCiz(ctx, "carpilma", animDongu("carpilma", gecen, 12), c.x - s / 2, c.y - s / 2, s, s);
  } else {
    const a = az ? 1 : (Math.floor(gecen / 0.06) % 2 ? 0.35 : 1); // ~60 ms'de bir yanıp söner
    ctx.globalAlpha = a;
    ctx.shadowColor = "#67e8f9"; ctx.shadowBlur = 14;
    ctx.strokeStyle = "#aef9ff"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(c.x, c.y, r + 10, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.5; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(c.x, c.y, r + 10, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowBlur = 0;
    const kare = Math.floor(gecen / 0.06), adet = 3 + (kare % 3); // 3-5 kıvılcım, her yanıp sönmede değişir
    for (let i = 0; i < adet; i++) {
      const ac = (i / adet) * Math.PI * 2 + kare * 0.7;
      const r0 = r * 0.7, r1 = r + 10 + ((kare * 7 + i * 13) % 9);
      ctx.beginPath();
      ctx.moveTo(c.x + Math.cos(ac) * r0, c.y + Math.sin(ac) * r0);
      ctx.lineTo(c.x + Math.cos(ac + 0.1) * (r0 + r1) / 2 + ((kare + i) % 2 ? 4 : -4),
        c.y + Math.sin(ac + 0.1) * (r0 + r1) / 2);
      ctx.lineTo(c.x + Math.cos(ac + 0.25) * r1, c.y + Math.sin(ac + 0.25) * r1);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  if (!az && gecen < 0.12) { // ilk 120 ms: karakterin üzerinde kısa beyaz parlama
    ctx.globalAlpha = 0.55 * (1 - gecen / 0.12);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

// render() dünya koordinatlarında, parçacıklardan sonra çağırır (gökyüzü her şeyin üstünde)
function havaCiz(ctx) {
  const h = game.hava;
  if (!h) return;
  for (const s of h.simsekler) simsekCiz(ctx, s);
  if (h.bulut) { bulutYagmurCiz(ctx, h.bulut); bulutCiz(ctx, h.bulut); }
  for (const b of h.yarasalar) yarasaCiz(ctx, b);
  for (const c of [game.player, game.bot, game.pet]) if (c) carpilmaCiz(ctx, c);
}

// render() ekran koordinatlarında en sonda çağırır: şimşeğin hafif ekran parlaması
function havaParlamaCiz(ctx) {
  const h = game.hava;
  if (!h || h.parlama <= 0) return;
  ctx.save();
  ctx.fillStyle = `rgba(226, 232, 255, ${h.parlama})`;
  ctx.fillRect(0, 0, game.W, game.H);
  ctx.restore();
}
