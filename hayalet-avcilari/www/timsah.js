/* ============================================================
   HAYALET AVCILARI — SUDAKİ TİMSAHLAR (3.15.0)
   Kullanıcının isteği: "Sulardan timsah çıksın, suyun yanında duranı bazen ısırsın."
   - Süs: arada bir görünen bir gölde timsah gözleri su yüzüne çıkar, bakınır, batar (zarar vermez). Kimi zaman
     (TIMSAH.bosOlasilik) gözlerden sonra boşa ısırık atar: ağzını açıp kapatır, kimseye zarar vermez.
   - Saldırı: oyuncu suyun kıyısında (kenara TIMSAH.yakin px'ten yakın) TIMSAH.bekleme sn durursa, saniyede
     TIMSAH.olasilik olasılıkla en yakın kıyıda bir timsah belirir. Önce kabarcık ve gözler (TIMSAH.uyari sn: kaçmaya
     yeter), sonra atılıp ısırır: oyuncu hâlâ menzildeyse 1 can gider. İki saldırı arası en az TIMSAH.ara sn.
   - Hayalet olan (çevrimiçi ölen), görünmez ya da hasar korumasındaki oyuncuyu ısırmaz. Köprüdekine kıyıdan saldırmaz;
     köprüden suya düşene yandan çıkar (kopru.js).
   - Durum oyun süresiyle ilerler (duraklatınca timsah da durur); game.waters değişince (yeni bölüm) sıfırlanır.
   - Çevrimiçi (ortak timsahlar): her oyuncu kendi timsahlarını oda kaydına yazar (players/$uid/tm, timsahDizisi),
     ötekiler onları görür (uzakTimsahlariAl); ısırık yalnız kendi oyuncusuna. Süs ve boşa ısırık yalnız kurucuda
     doğar (kendinin ve öbür oyuncuların yakınındaki göllerde), herkes aynısını görür.
   Sınama: test/timsah.test.mjs.
   ============================================================ */

const TIMSAH = {
  yakin: 60,        // oyuncunun kenarı ile su kıyısı arası (px): bundan yakını "suyun yanında"
  bekleme: 1.2,     // kıyıda bu kadar duran saldırıya açık olur (sn)
  olasilik: 0.5,    // sonra saniyede saldırı olasılığı ("bazen")
  ara: 5,           // iki saldırı arası en az (sn)
  uyari: 0.9,       // kabarcık ve gözler: kaçma payı (sn)
  atilma: 0.35,     // atılış; ısırık bu evrenin sonunda
  batis: 0.6,
  menzil: 96,       // ısırık anında timsahın çıktığı nokta ile oyuncu merkezi arası en çok (px)
  susSure: 2.4,     // süs gözlerinin su üstünde kaldığı süre (sn)
  susAra: [5, 9],   // iki süs arası (sn)
  icPay: 18,        // timsahın çıktığı nokta kıyıdan bu kadar içeride (px)
  adim: 32,          // FIX2: kıyıdan karaya atılış (24-40 px); ısırık sonunda bu kadar dışarıda
  bosOlasilik: 0.45, // süs timsahının boşa ısırık atma olasılığı
  // TMS1: timsahın sudan karaya gezintisi (kullanıcının isteği)
  gez: { ara: [8, 14], yakin: 350, cikis: 0.9, bekle: 1.0, donus: 0.9, dokunma: 40, enAz: 40, enCok: 70 },
};
let _timsahNo = 0;   // her timsahın kimliği (çevrimiçi değişiklik imzası)
const timsahOmru = (tur) => (tur === "sus" ? TIMSAH.susSure
  : tur === "gez" ? TIMSAH.uyari + TIMSAH.gez.cikis + TIMSAH.gez.bekle + TIMSAH.gez.donus + TIMSAH.batis
  : TIMSAH.uyari + TIMSAH.atilma + TIMSAH.batis);

// Bir göle göre işaretli uzaklık: içeride eksi
function suUzakligi(o, x, y) {
  if (o.carpisma) return engelUzaklik(o.carpisma, x - o.x, y - o.y);
  return ENGEL.parcaUzaklik({ t: "k", x: o.x, y: o.y, w: o.w, h: o.h, rr: 0 }, x, y);
}

// Geçit nehrinin köprüsü (yolculuk haritası); göl ya da köprüsüzse null
function suKopru(o) {
  if (!o.gecit) return null;
  for (const k of game.kopruler || []) if (k.su === o) return k;
  return null;
}

// Oyuncuya en yakın göl ve uzaklığı
function enYakinSu(x, y) {
  let en = null, d = Infinity;
  for (const o of game.waters || []) {
    if (x < o.x - 200 || x > o.x + o.w + 200 || y < o.y - 200 || y > o.y + o.h + 200) continue;
    const u = suUzakligi(o, x, y);
    if (u < d) { d = u; en = o; }
  }
  return { su: en, d };
}

// (x, y)'ye en yakın kıyının TIMSAH.icPay kadar içindeki nokta (uzaklığın eğimiyle izdüşüm)
function kiyidaNokta(o, x, y) {
  let px = x, py = y;
  for (let i = 0; i < 6; i++) {
    const d = suUzakligi(o, px, py);
    const gx = suUzakligi(o, px + 2, py) - suUzakligi(o, px - 2, py);
    const gy = suUzakligi(o, px, py + 2) - suUzakligi(o, px, py - 2);
    const g = Math.hypot(gx, gy);
    if (g < 1e-6) break;
    const adim = d + TIMSAH.icPay;
    px -= (gx / g) * adim; py -= (gy / g) * adim;
    if (Math.abs(suUzakligi(o, px, py) + TIMSAH.icPay) < 3) break;
  }
  return suUzakligi(o, px, py) < -6 ? { x: px, y: py } : null;
}

function timsahSesi(tur) {
  const v = audio._v ? audio._v("sfx") : 1;
  if (tur === "cik") {
    if (typeof audio.timsahCik === "function") audio.timsahCik();
    else audio.noise(0.25, 0.10 * v);
  } else {
    if (typeof audio.timsahIsir === "function") audio.timsahIsir();
    else audio.beep(140, 0.09, "square", 0.16 * v);
  }
}

function timsahSifirla() {
  game.timsahlar = [];
  game._timsahSular = game.waters;
  game._timsahKiyi = 0;     // oyuncunun kıyıda durduğu süre
  game._timsahAra = 0;      // sonraki saldırıya kalan
  game._timsahSus = TIMSAH.susAra[0];
  game._timsahTohum = (((game.level || 1) * 2654435761) + 97) >>> 0; // TMS1: tohumlu rastgelelik
  game._timsahGez = TIMSAH.gez.ara[0];
}

// TMS1: mulberry32 adımı (Math.random yok)
function timsahRast() {
  const a = game._timsahTohum = (game._timsahTohum + 0x6D2B79F5) >>> 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// Saldırı: kıyıda, oyuncuya dönük bir timsah çıkar
function timsahSaldirt(o, x, y) {
  const n = kiyidaNokta(o, x, y);
  if (!n) return null;
  const tm = { id: ++_timsahNo, tur: "saldiri", x: n.x, y: n.y, a: Math.atan2(y - n.y, x - n.x), t: 0, isirdi: false };
  game.timsahlar.push(tm);
  game._timsahAra = TIMSAH.ara;
  game._timsahKiyi = 0;
  timsahSesi("cik");
  return tm;
}

// TMS1: karaya yürünecek uzaklık (px). Yalnız yuvarlatılmış x,y,a'ya bağlıdır; çevrimiçinde de aynı çıkar.
function timsahGezMesafe(tm) {
  if (tm._gm !== undefined) return tm._gm;
  const rx = Math.round(tm.x), ry = Math.round(tm.y), a = Math.round(tm.a * 100) / 100;
  const D = TIMSAH.gez.enAz + ((Math.abs(rx) * 7 + Math.abs(ry) * 13) % 31);
  const c = Math.cos(a), s = Math.sin(a), W = game.worldW, H = game.worldH;
  let son = 0;
  for (let d = 6; d <= D; d += 6) {
    const px = rx + c * (TIMSAH.icPay + d), py = ry + s * (TIMSAH.icPay + d);
    if (W !== undefined && (px < 0 || py < 0 || px > W || py > H)) break;
    if (collidesWalls(px, py, 20) || koprudeMi(px, py)) break;
    if ((game.waters || []).some((o) => suUzakligi(o, px, py) < 0)) break;
    son = d;
  }
  return (tm._gm = son);
}

// TMS1: gezintinin 0..1 ilerlemesi (sudan çıkış / bekleme / dönüş)
function timsahGezU(tm) {
  const { uyari } = TIMSAH, g = TIMSAH.gez, z = tm.t;
  if (z < uyari) return 0;
  if (z < uyari + g.cikis) return (z - uyari) / g.cikis;
  if (z < uyari + g.cikis + g.bekle) return 1;
  if (z < uyari + g.cikis + g.bekle + g.donus) return 1 - (z - uyari - g.cikis - g.bekle) / g.donus;
  return 0;
}

// TMS1: oyuncuya en yakın kıyıdan karaya gezinti timsahı
function timsahGezdir(o, x, y) {
  const n = kiyidaNokta(o, x, y);
  if (!n) return null;
  const tm = {
    id: ++_timsahNo, tur: "gez", x: Math.round(n.x), y: Math.round(n.y),
    a: Math.round(Math.atan2(y - n.y, x - n.x) * 100) / 100, t: 0, isirdi: false, sesli: false,
  };
  if (timsahGezMesafe(tm) < 30) return null;
  game.timsahlar.push(tm);
  timsahSesi("cik");
  return tm;
}

// Süs: görünen bir gölün içinde bakınan gözler (kimi zaman boşa ısırık). Çevrimiçi kurucu öbür oyuncuların yakınındaki
// gölleri de seçer: süsler ortaktır
function timsahSusle() {
  const cam = game.camera || { x: 0, y: 0 }, W = game.W || 0, H = game.H || 0;
  const uzaklar = online.mode === "host" ? Object.values(online.remotePlayers).filter((rp) => rp && Number.isFinite(rp.x)) : [];
  const gorunen = (game.waters || []).filter((o) => (o.x < cam.x + W && o.x + o.w > cam.x && o.y < cam.y + H && o.y + o.h > cam.y) ||
    uzaklar.some((rp) => Math.abs(rp.x - (o.x + o.w / 2)) < 500 && Math.abs(rp.y - (o.y + o.h / 2)) < 700));
  if (!gorunen.length) return null;
  const o = gorunen[Math.floor(Math.random() * gorunen.length)];
  const kop = suKopru(o);
  // Geçit nehri bütün dünyayı kaplar: gözler görünür şeritte ve köprüden en az 120 px uzakta çıkar
  const y0 = o.gecit ? Math.max(o.y, cam.y) : o.y, y1 = o.gecit ? Math.min(o.y + o.h, cam.y + H) : o.y + o.h;
  if (y1 <= y0) return null;
  for (let i = 0; i < 40; i++) {
    const x = o.x + Math.random() * o.w, y = y0 + Math.random() * (y1 - y0);
    if (kop && Math.abs(y - kop.c) < 120) continue;
    if (suUzakligi(o, x, y) < -22) {
      const tur = Math.random() < TIMSAH.bosOlasilik ? "bos" : "sus";
      const tm = { id: ++_timsahNo, tur, x, y, a: Math.random() * Math.PI * 2, t: 0 };
      game.timsahlar.push(tm);
      return tm;
    }
  }
  return null;
}

function timsahIsirir(tm, menzil = TIMSAH.menzil) {
  const p = game.player;
  if (!p || p.dead || p.invuln > 0 || game.devamBekliyor) return false;
  if ((p.invisibleUntil || 0) > performance.now()) return false;
  const k = timsahKonum(tm);
  return Math.hypot(p.x - k.x, p.y - k.y) < menzil;
}

// FIX2: timsahın o anki konumu. tm.x/tm.y su içindeki çıkış noktasıdır; atılışta kıyıdan karaya
// icPay + adim kadar ilerler (adim ≈ 32 px dışarı), ısırıktan sonra suya geri çekilir.
function timsahKonum(tm) {
  if (tm.tur === "gez") {
    const d = (TIMSAH.icPay + timsahGezMesafe(tm)) * timsahGezU(tm);
    return { x: tm.x + Math.cos(tm.a) * d, y: tm.y + Math.sin(tm.a) * d };
  }
  const { uyari, atilma, batis } = TIMSAH;
  let u = 0;
  if (tm.t <= uyari) u = 0;
  else if (tm.t < uyari + atilma) u = (tm.t - uyari) / atilma;
  else u = 1 - Math.min(1, (tm.t - uyari - atilma) / batis);
  const d = (TIMSAH.icPay + TIMSAH.adim) * u;
  return { x: tm.x + Math.cos(tm.a) * d, y: tm.y + Math.sin(tm.a) * d };
}

// update() her karede çağırır (duraklatınca çağrılmaz)
function timsahGuncelle(dt) {
  if (game._timsahSular !== game.waters || !game.timsahlar) timsahSifirla();
  const p = game.player;
  // Var olanlar
  for (const tm of game.timsahlar) {
    tm.t += dt;
    if (tm.tur === "gez") {
      const g = TIMSAH.gez, z = tm.t;
      // (a) karaya çıkınca bir kez canlı ses
      if (!tm.sesli && z >= TIMSAH.uyari) {
        tm.sesli = true;
        const k = timsahKonum(tm);
        if (audio.canliSes) audio.canliSes("timsah", k.x, k.y, 0.5);
      }
      // (b) karadayken tek ısırık (aynı hasar ve koruma kuralı)
      const bas = TIMSAH.uyari + g.cikis * 0.5;
      const son = TIMSAH.uyari + g.cikis + g.bekle + g.donus * 0.5;
      if (!tm.isirdi && z >= bas && z < son) {
        if (timsahIsirir(tm, g.dokunma + (p ? p.r : 0))) {
          tm.isirdi = true;
          tm.isirikT = z;
          timsahSesi("isir");
          showFloat(t("🐊 Timsah ısırdı!"), p.x, p.y - 30);
          navigator.vibrate?.(80);
          damagePlayer();
          game._timsahAra = TIMSAH.ara;
        }
      }
    }
    if (tm.tur !== "sus" && tm.tur !== "gez" && !tm.isirdi && tm.t >= TIMSAH.uyari + TIMSAH.atilma) {
      tm.isirdi = true;
      timsahSesi("isir");
      if (tm.tur === "saldiri" && timsahIsirir(tm)) { // "bos": boşa ısırık, zarar yok
        showFloat(t("🐊 Timsah ısırdı!"), p.x, p.y - 30);
        navigator.vibrate?.(80);
        damagePlayer();
      }
    }
  }
  game.timsahlar = game.timsahlar.filter((tm) => tm.t < timsahOmru(tm.tur));
  // Süs gözleri ve boşa ısırık (çevrimiçinde yalnız kurucu doğurur, herkes onunkini görür)
  game._timsahSus -= dt;
  if (game._timsahSus <= 0) {
    if (online.mode !== "client" && !game.timsahlar.some((tm) => tm.tur !== "saldiri")) timsahSusle();
    game._timsahSus = TIMSAH.susAra[0] + Math.random() * (TIMSAH.susAra[1] - TIMSAH.susAra[0]);
  }
  // TMS1: timsahın sudan karaya gezintisi (yalnız kendi oyuncumuz için doğar)
  game._timsahGez -= dt;
  if (game._timsahGez <= 0) {
    game._timsahGez = TIMSAH.gez.ara[0] + timsahRast() * (TIMSAH.gez.ara[1] - TIMSAH.gez.ara[0]);
    const cam = game.camera || { x: 0, y: 0 }, W = game.W || game.worldW || 0, H = game.H || game.worldH || 0;
    if (p && !p.dead && !p.dusus && !game.devamBekliyor && !koprudeMi(p.x, p.y) &&
      !game.timsahlar.some((tm) => tm.tur === "saldiri" || tm.tur === "gez") && game._timsahAra <= 0) {
      const y = enYakinSu(p.x, p.y);
      const n = y.su && y.d <= TIMSAH.gez.yakin ? kiyidaNokta(y.su, p.x, p.y) : null;
      const ekranda = n && n.x >= cam.x - 40 && n.x <= cam.x + W + 40 && n.y >= cam.y - 40 && n.y <= cam.y + H + 40;
      const kop = n ? suKopru(y.su) : null;
      if (ekranda && (!kop || Math.abs(n.y - kop.c) >= 120) && timsahGezdir(y.su, p.x, p.y)) game._timsahAra = TIMSAH.ara;
    }
  }
  // Kıyıda duran oyuncu
  game._timsahAra = Math.max(0, game._timsahAra - dt);
  // Köprüdeki ya da köprüden düşmüş oyuncuya kıyı saldırısı yok: köprüde kural düşmedir (kopru.js)
  if (!p || p.dead || game.devamBekliyor || p.dusus || koprudeMi(p.x, p.y)) { game._timsahKiyi = 0; return; }
  const { su, d } = enYakinSu(p.x, p.y);
  if (!su || d - p.r > TIMSAH.yakin) { game._timsahKiyi = 0; return; }
  const kop = suKopru(su);
  // Geçitte köprüye 90 px'ten yakın kıyıya saldırmaz (karşıya geçiş güvenli kalsın)
  if (kop && Math.abs(p.y - kop.c) < 90) { game._timsahKiyi = 0; return; }
  game._timsahKiyi += dt;
  if (game._timsahKiyi < TIMSAH.bekleme || game._timsahAra > 0) return;
  if (game.timsahlar.some((tm) => tm.tur === "saldiri")) return;
  if (Math.random() < TIMSAH.olasilik * dt) timsahSaldirt(su, p.x, p.y);
}

// ---------- çizim ----------
function timsahGozleri(ctx, yan, s) {
  for (const k of [-1, 1]) {
    ctx.fillStyle = "#3f6212";
    ctx.beginPath(); ctx.ellipse(0, k * yan, 7 * s, 6 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#facc15";
    ctx.beginPath(); ctx.ellipse(1 * s, k * yan, 4.2 * s, 3.6 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#111";
    ctx.beginPath(); ctx.ellipse(1.6 * s, k * yan, 1.1 * s, 3 * s, 0, 0, Math.PI * 2); ctx.fill();
  }
}

function halka(ctx, x, y, r, alfa) {
  ctx.strokeStyle = `rgba(255,255,255,${alfa})`;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.6, 0, 0, Math.PI * 2); ctx.stroke();
}

// Kafa: uzanma = burnun ileri atılışı (px), agiz = 0 kapalı … 1 açık
function timsahKafa(ctx, uzanma, agiz) {
  const boy = 34 + uzanma, ac = agiz * 0.45;
  ctx.fillStyle = "#365314";
  ctx.beginPath(); ctx.ellipse(-6, 0, 20, 16, 0, 0, Math.PI * 2); ctx.fill();   // baş
  for (const k of [-1, 1]) {                                                       // alt ve üst çene
    ctx.save();
    ctx.rotate(k * ac);
    ctx.fillStyle = k < 0 ? "#4d7c0f" : "#3f6212";
    ctx.beginPath();
    ctx.moveTo(-4, 0); ctx.lineTo(-4, k * 14); ctx.quadraticCurveTo(boy, k * 12, boy + 4, k * 3); ctx.lineTo(boy + 4, 0);
    ctx.closePath(); ctx.fill();
    if (agiz > 0.15) {                                                             // dişler
      ctx.fillStyle = "#fff";
      for (let x = 6; x < boy; x += 7) {
        ctx.beginPath(); ctx.moveTo(x, k * 1.5); ctx.lineTo(x + 3, -k * 3.5); ctx.lineTo(x + 6, k * 1.5); ctx.closePath(); ctx.fill();
      }
    }
    ctx.restore();
  }
  ctx.fillStyle = "#1a2e05";                                                       // burun delikleri
  ctx.beginPath(); ctx.arc(boy - 2, -3, 1.6, 0, Math.PI * 2); ctx.arc(boy - 2, 3, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.translate(-8, 0); timsahGozleri(ctx, 9, 1); ctx.restore();
}

// render() engellerden sonra çağırır: kendi timsahlarım ve çevrimiçinde öbür oyuncularınki
function timsahlariCiz(ctx) {
  for (const tm of game.timsahlar || []) timsahCiz(ctx, tm);
  if (online.mode) {
    const simdi = performance.now();
    for (const rp of Object.values(online.remotePlayers)) {
      for (const tm of (rp && rp.timsahlar) || []) {
        const t1 = tm.t0 + (simdi - tm.alindi) / 1000;
        if (t1 < timsahOmru(tm.tur)) timsahCiz(ctx, { ...tm, t: t1 });
      }
    }
  }
}

// ---------- çevrimiçi ----------
// Oda kaydına giden biçim: "<s|a|b>x,y,açı×100,yaş ms;…" (s süs, a saldırı, b boşa ısırık). İmza: kimlikler (yeni ya da
// biten timsahta değişir; yaş karşıda yerel saatle ilerletilir)
function timsahDizisi() {
  const liste = (game.timsahlar || []).slice(-4);
  return {
    imza: liste.map((tm) => tm.id).join(","),
    metin: liste.map((tm) => `${tm.tur === "saldiri" ? "a" : tm.tur === "bos" ? "b" : tm.tur === "gez" ? "g" : "s"}${Math.round(tm.x)},${Math.round(tm.y)},${Math.round(tm.a * 100)},${Math.round(tm.t * 1000)}`).join(";"),
  };
}
function uzakTimsahlariAl(metin) {
  const simdi = performance.now(), turu = { a: "saldiri", b: "bos", g: "gez", s: "sus" };
  const out = [];
  for (const parca of String(metin || "").split(";")) {
    const m = /^([abgs])(-?\d+),(-?\d+),(-?\d+),(\d+)$/.exec(parca);
    if (m) out.push({ tur: turu[m[1]], x: +m[2], y: +m[3], a: +m[4] / 100, t0: +m[5] / 1000, alindi: simdi });
  }
  return out;
}

// FIX2: su sıçraması yalnız suyun biçimi içinde çizilir; gölden dışarı taşmaz.
// (x, y) suyun içinde bir noktadır; halkalar orada kalır, karaya taşmaz.
function timsahSuYolu(ctx, o) {
  ctx.beginPath();
  const parcalar = o.carpisma || [{ t: "k", x: 0, y: 0, w: o.w, h: o.h, rr: 0 }];
  for (const q of parcalar) {
    const x = o.x + (q.x || 0), y = o.y + (q.y || 0);
    if (typeof ctx.roundRect === "function") ctx.roundRect(x, y, q.w, q.h, q.rr || 0);
    else ctx.rect(x, y, q.w, q.h);
  }
}
function timsahSplashCiz(ctx, tm) {
  const { su } = enYakinSu(tm.x, tm.y);
  if (!su) return;
  ctx.save();
  timsahSuYolu(ctx, su);
  ctx.clip();
  const z = tm.t, { uyari, atilma, batis } = TIMSAH;
  if (tm.tur === "gez") {
    const g = TIMSAH.gez;
    if (z < uyari) {
      const u = z / uyari;
      for (let i = 0; i < 3; i++) halka(ctx, tm.x + Math.sin(i * 2.1 + z * 6) * 10, tm.y + Math.cos(i * 1.7 + z * 5) * 6, 6 + ((u * 3 + i / 3) % 1) * 22, 0.55 * (1 - ((u * 3 + i / 3) % 1)));
    } else if (z < uyari + g.cikis) {
      halka(ctx, tm.x, tm.y, 26, 0.5);
    } else if (z >= uyari + g.cikis + g.bekle && z < uyari + g.cikis + g.bekle + g.donus) {
      halka(ctx, tm.x, tm.y, 36, 0.4);
    }
    ctx.restore();
    return;
  }
  if (tm.tur === "sus") {
    const u = z / TIMSAH.susSure, alfa = Math.min(1, u * 5, (1 - u) * 5);
    halka(ctx, tm.x, tm.y, 14 + u * 18, 0.35 * alfa);
  } else if (z < uyari) {
    const u = z / uyari;
    for (let i = 0; i < 3; i++) halka(ctx, tm.x + Math.sin(i * 2.1 + z * 6) * 10, tm.y + Math.cos(i * 1.7 + z * 5) * 6, 6 + ((u * 3 + i / 3) % 1) * 22, 0.55 * (1 - ((u * 3 + i / 3) % 1)));
  } else if (z < uyari + atilma) {
    const u = (z - uyari) / atilma;
    halka(ctx, tm.x, tm.y, 26 + u * 10, 0.5);
  } else {
    const u = Math.min(1, (z - uyari - atilma) / batis);
    halka(ctx, tm.x, tm.y, 36 + u * 14, 0.4 * (1 - u));
  }
  ctx.restore();
}

// TMS1: hareket azaltma tercihi (yürüyüş sallanması kapalı)
function timsahAzHareket() {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// ChatGPT timsah kareleri (N12: dalga, gözler, baş, açık ağız, kapma, batış). Kareler yandan çizildiği için döndürülmez;
// sola atılan timsah aynalanır, baş atılış yönünde ilerler. Hazır değilse false (kod çizimi).
function timsahKareCiz(ctx, tm) {
  if (typeof animHazir !== "function" || !animHazir("timsah")) return false;
  const { uyari, atilma, batis } = TIMSAH;
  let kare, alfa = 1;
  if (tm.tur === "gez") {
    const g = TIMSAH.gez, z = tm.t, u = timsahGezU(tm), bitis = uyari + g.cikis + g.bekle + g.donus;
    if (z < uyari) { const q = z / uyari; kare = q < 0.5 ? 1 : 2; alfa = Math.min(1, q * 3 + 0.3); }
    else if (z < bitis) {
      if (tm.isirdi && z - (tm.isirikT || 0) < 0.25) kare = 4;
      else {
        const n = animHazir("timsah-yuru");
        kare = n ? 1 + Math.floor(timsahGezMesafe(tm) * u / 12) % n : 3;
      }
    } else { const q = Math.min(1, (z - bitis) / g.batis); kare = 6; alfa = 1 - q; }
    const konum = timsahKonum(tm);
    const yol = timsahGezMesafe(tm) * u;
    const yoff = u > 0.2 && !timsahAzHareket() ? -Math.abs(Math.sin(yol / 9)) * 3 : 0;
    ctx.save();
    ctx.translate(konum.x, konum.y);
    if (Math.cos(tm.a) < 0) ctx.scale(-1, 1);
    ctx.globalAlpha *= Math.max(0, alfa);
    if (u > 0.2) {
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.beginPath(); ctx.ellipse(0, 0, 13, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    }
    animCiz(ctx, "timsah", kare, -40, -30 + yoff, 80, 56);
    ctx.restore();
    return true;
  }
  if (tm.tur === "sus") {
    const u = tm.t / TIMSAH.susSure;
    kare = 2; alfa = Math.min(1, u * 5, (1 - u) * 5);
  } else {
    const z = tm.t;
    if (z < uyari) { const u = z / uyari; kare = u < 0.5 ? 1 : 2; alfa = Math.min(1, u * 3 + 0.3); }
    else if (z < uyari + atilma) { const u = (z - uyari) / atilma; kare = u < 0.3 ? 3 : u < 0.75 ? 4 : 5; } // son kare: ağız kapandı
    else { const u = Math.min(1, (z - uyari - atilma) / batis); kare = 6; alfa = 1 - u; }
  }
  const konum = timsahKonum(tm);
  ctx.save();
  ctx.translate(konum.x, konum.y);
  if (Math.cos(tm.a) < 0) ctx.scale(-1, 1);
  ctx.globalAlpha *= Math.max(0, alfa);
  animCiz(ctx, "timsah", kare, -40, -30, 80, 56);
  ctx.restore();
  return true;
}

function timsahCiz(ctx, tm) {
  timsahSplashCiz(ctx, tm);
  if (timsahKareCiz(ctx, tm)) return;
  {
    const konum = timsahKonum(tm);
    ctx.save();
    ctx.translate(konum.x, konum.y);
    if (tm.tur === "sus") {
      const u = tm.t / TIMSAH.susSure, alfa = Math.min(1, u * 5, (1 - u) * 5);
      ctx.globalAlpha = alfa;
      ctx.rotate(tm.a + Math.sin(tm.t * 1.7) * 0.25);
      ctx.translate(0, Math.sin(tm.t * 3) * 1.2);
      timsahGozleri(ctx, 8, 0.9);
      ctx.fillStyle = "#1a2e05";
      ctx.beginPath(); ctx.arc(22, -2.5, 1.4, 0, Math.PI * 2); ctx.arc(22, 2.5, 1.4, 0, Math.PI * 2); ctx.fill();
    } else if (tm.tur === "gez") {
      ctx.rotate(tm.a);
      timsahKafa(ctx, 0, tm.isirdi ? 1 : 0);
    } else {
      const { uyari, atilma, batis } = TIMSAH, z = tm.t;
      if (z < uyari) {                                                             // yükselen gözler
        const u = z / uyari;
        ctx.globalAlpha = Math.min(1, u * 2);
        ctx.rotate(tm.a);
        timsahGozleri(ctx, 9, 0.6 + u * 0.4);
      } else if (z < uyari + atilma) {                                             // karaya atılış; sonunda çene kapanır
        const u = (z - uyari) / atilma;
        ctx.rotate(tm.a);
        timsahKafa(ctx, 0, u < 0.8 ? 1 : (1 - u) * 5);
      } else {                                                                     // geri çekilip batar
        const u = Math.min(1, (z - uyari - atilma) / batis);
        ctx.globalAlpha = 1 - u;
        ctx.rotate(tm.a);
        timsahKafa(ctx, 0, 0);
      }
    }
    ctx.restore();
  }
}
