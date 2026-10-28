/* ============================================================
   HAYALET AVCILARI — ÇALI: SAKLANMA YERİ (3.15.0)
   Kullanıcının seçimi: "Çalı" — haritada birkaç sık çalı; içine giren oyuncuyu hayaletler göremez, başka yere yönelir.
   İçerideyken ateş edilmez; en çok CALI.enCok sn saklanılır, sonra CALI.bekleme sn çalılar saklamaz.
   - Her bölümde CALI.sayi çalı; yerleri bölüm tohumundan (çevrimiçinde herkeste aynı). Duvar, su, diken, lav, köprü ve
     başka çalıya değmez; oyuncunun doğduğu orta alandan uzak durur. Çalı engel değildir, içinden yürünür.
   - Saklanan oyuncu (game.player.gizli) görünmez gücüyle aynı yoldan korunur: hayaletler onu kovalamaz, ona değince ve
     mermileri çarpınca can gitmez; o da ateş etmez. Çalının içinde yalnız gözleri görünür.
   - Erken çıkan, saklandığı sürenin oranında bekler (5 sn saklanan 8 sn; içeri girip çıkarak sınırsız saklanılmaz).
   - Çevrimiçi: saklanma oda kaydına yazılır (players/$uid/gz); kurucunun hayaletleri saklananı kovalamaz, ötekiler onu
     çalıda göz olarak görür.
   Sınama: test/cali.test.mjs.
   ============================================================ */

const CALI = {
  sayi: 3,        // bölüm başına çalı
  r: 46,          // çalının yarıçapı (px)
  icPay: 12,      // oyuncu merkezi çalının bu kadar içindeyse saklanır
  enCok: 5,       // en uzun saklanma (sn)
  bekleme: 8,     // sonra çalılar bu kadar saklamaz (sn)
};

function calilariKur() {
  game.calilar = [];
  game._caliSular = game.waters;
  game._caliBekleme = 0;
  if (game.player) { game.player.gizli = false; game.player.gizliSure = 0; }
  const W = game.worldW, H = game.worldH, lvl = game.level || 1;
  const rand = (n) => (Math.sin((83 + lvl * 23 + n) * 47.31) + 1) / 2;
  const { cx, cy } = layoutCenter();
  const R = CALI.r + 14;
  for (let i = 0; i < 60 && game.calilar.length < CALI.sayi; i++) {
    const x = 100 + rand(i * 3) * (W - 200), y = 100 + rand(i * 5 + 1) * (H - 200);
    if (Math.hypot(x - cx, y - cy) < 220) continue;
    if (collidesWalls(x, y, R) || collidesWaters(x, y, R) || collidesSpikes(x, y, R) || collidesLavas(x, y, R)) continue;
    if (koprudeMi(x, y) || (game.kopruler || []).some((k) => kopruUclari(k).some((u) => Math.hypot(u.x - x, u.y - y) < R + 30))) continue;
    if (game.calilar.some((c) => Math.hypot(c.x - x, c.y - y) < 260)) continue;
    game.calilar.push({ x, y, tohum: i });
  }
}

function calilarHazir() {
  if (game._caliSular !== game.waters || !game.calilar) calilariKur();
  return game.calilar;
}

// (x, y)'yi saklayan çalı
function caliIcinde(x, y) {
  for (const c of calilarHazir()) if (Math.hypot(c.x - x, c.y - y) <= CALI.r - CALI.icPay) return c;
  return null;
}

// update() oyuncu yürüdükten sonra çağırır
function caliGuncelle(dt) {
  calilarHazir();
  const p = game.player;
  if (!p) return;
  game._caliBekleme = Math.max(0, (game._caliBekleme || 0) - dt);
  const c = !p.dead && !p.dusus && caliIcinde(p.x, p.y);
  if (c && game._caliBekleme <= 0) {
    if (!p.gizli) {
      p.gizli = true; p.gizliSure = 0; p.gizliCali = c;
      showFloat(t("🌿 Saklandın!"), p.x, p.y - 40);
    }
    p.gizliSure += dt;
    if (p.gizliSure >= CALI.enCok) {
      p.gizli = false;
      game._caliBekleme = CALI.bekleme;
      showFloat(t("🌿 Çalı seni artık gizlemiyor!"), p.x, p.y - 40);
    }
  } else if (p.gizli) {
    p.gizli = false;
    game._caliBekleme = Math.min(CALI.bekleme, (p.gizliSure / CALI.enCok) * CALI.bekleme);
  }
}

// ---------- çizim ----------
function caliCiz(ctx, c, zaman, sallanma) {
  const yapraklar = [[0, 0, 1], [-22, 8, 0.7], [22, 8, 0.7], [-14, -14, 0.72], [16, -12, 0.7], [0, 16, 0.75], [-26, -4, 0.55], [27, -2, 0.55]];
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath(); ctx.ellipse(0, 22, CALI.r, CALI.r * 0.35, 0, 0, Math.PI * 2); ctx.fill();
  yapraklar.forEach(([x, y, k], i) => {
    const s = Math.sin(zaman * 2 + i + c.tohum) * (1 + sallanma * 3);
    ctx.fillStyle = i % 3 === 0 ? "#166534" : i % 3 === 1 ? "#15803d" : "#14532d";
    ctx.beginPath(); ctx.arc(x + s, y, CALI.r * 0.5 * k, 0, Math.PI * 2); ctx.fill();
  });
  ctx.fillStyle = "#22c55e";
  for (let i = 0; i < 7; i++) {
    const a = i * 0.9 + c.tohum, d = 8 + (i * 13) % 26;
    ctx.beginPath(); ctx.ellipse(Math.cos(a) * d, Math.sin(a) * d * 0.8 - 4, 5, 2.6, a, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// Çalıdan bakan gözler (saklanan oyuncu); yanıp söner
function caliGozleri(ctx, x, y, zaman) {
  if (Math.sin(zaman * 1.3) > 0.93) return; // göz kırpma
  const bak = Math.sin(zaman * 0.8) * 2;
  ctx.save();
  for (const k of [-1, 1]) {
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(x + k * 7, y - 6, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(x + k * 7 + bak, y - 5, 2.6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// render() engellerden sonra (oyunculardan önce) çağırır
function calilariCiz(ctx) {
  const zaman = performance.now() / 1000, p = game.player;
  const cam = game.camera || { x: 0, y: 0 }, W = game.W || 1e9, H = game.H || 1e9, pay = CALI.r + 10;
  for (const c of calilarHazir()) {
    if (c.x + pay < cam.x || c.x - pay > cam.x + W || c.y + pay < cam.y || c.y - pay > cam.y + H) continue; // ekran dışı
    const icinde = p && !p.dead && Math.hypot(p.x - c.x, p.y - c.y) < CALI.r;
    caliCiz(ctx, c, zaman, icinde ? 1 : 0);
  }
}

// Saklanan oyuncunun gözleri ve kalan süre halkası (oyuncunun yerine çizilir)
function gizliCiz(ctx) {
  const p = game.player, zaman = performance.now() / 1000;
  caliGozleri(ctx, p.x, p.y, zaman);
  const kalan = Math.max(0, 1 - (p.gizliSure || 0) / CALI.enCok);
  const c = p.gizliCali || { x: p.x, y: p.y };
  ctx.save();
  ctx.strokeStyle = kalan > 0.3 ? "rgba(134,239,172,0.9)" : "rgba(253,186,116,0.95)";
  ctx.lineWidth = 4; ctx.lineCap = "round";
  ctx.beginPath(); ctx.arc(c.x, c.y, CALI.r + 6, -Math.PI / 2, -Math.PI / 2 + kalan * Math.PI * 2); ctx.stroke();
  ctx.restore();
}
