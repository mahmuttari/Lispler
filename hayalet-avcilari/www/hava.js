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
const havaAzHareket = () => !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

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
  const x0 = bulut.x + havaRast(-22, 22), y0 = bulut.y + 18;
  const x1 = hedef ? hedef.x + havaRast(-60, 60) : x0 + havaRast(-50, 50);
  const y1 = hedef ? hedef.y + havaRast(-10, 30) : y0 + havaRast(150, 230);
  const noktalar = [[x0, y0]];
  const adim = 7;
  for (let i = 1; i < adim; i++) {
    const k = i / adim;
    noktalar.push([x0 + (x1 - x0) * k + havaRast(-16, 16), y0 + (y1 - y0) * k + havaRast(-6, 6)]);
  }
  noktalar.push([x1, y1]);
  const kol = noktalar.slice(2, 5).map(([x, y]) => [[x, y], [x + havaRast(-40, 40), y + havaRast(20, 50)]]);
  h.simsekler.push({ noktalar, kol, omur: HAVA.simsekSure });
  if (!havaAzHareket()) h.parlama = Math.max(h.parlama, 0.16);
  bulut.cakti = 0.25;
  if (typeof audio !== "undefined" && audio.noise) {
    const v = audio._v ? audio._v("sfx") : 1;
    setTimeout(() => audio.noise(0.9, 0.12 * v), 140); // ışıktan biraz sonra gürültü
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
        hiz: havaRast(HAVA.bulutHiz[0], HAVA.bulutHiz[1]), sayac: havaRast(1, 2.5), cakti: 0, tohum: Math.random() * 10 };
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
      bl.x += bl.yon * bl.hiz * dt;
      bl.y += Math.sin((bl.tohum += dt * 0.6)) * 6 * dt;
      if (bl.boss) { bl.boss = false; bl.yon = bl.x < cam.x + W / 2 ? -1 : 1; } // boss yenildi: bulut çekip gider
    }
    bl.cakti = Math.max(0, bl.cakti - dt);
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
}

// ---------- çizim ----------
function yarasaCiz(ctx, b) {
  const s = 9 * b.boy, cirp = Math.sin(b.kanat);
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.scale(b.yon, 1);
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
  const yol = (noktalar) => { ctx.beginPath(); ctx.moveTo(noktalar[0][0], noktalar[0][1]); for (const [x, y] of noktalar.slice(1)) ctx.lineTo(x, y); ctx.stroke(); };
  ctx.save();
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.strokeStyle = `rgba(253, 224, 71, ${0.35 * a})`; ctx.lineWidth = 9; yol(s.noktalar); // ışıltı
  ctx.strokeStyle = `rgba(255, 255, 255, ${a})`; ctx.lineWidth = 3; yol(s.noktalar);
  ctx.lineWidth = 1.5;
  for (const k of s.kol) yol(k);
  ctx.restore();
}

// render() dünya koordinatlarında, parçacıklardan sonra çağırır (gökyüzü her şeyin üstünde)
function havaCiz(ctx) {
  const h = game.hava;
  if (!h) return;
  for (const s of h.simsekler) simsekCiz(ctx, s);
  if (h.bulut) bulutCiz(ctx, h.bulut);
  for (const b of h.yarasalar) yarasaCiz(ctx, b);
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
