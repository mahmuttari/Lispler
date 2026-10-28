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
  bosOlasilik: 0.45, // süs timsahının boşa ısırık atma olasılığı
};
let _timsahNo = 0;   // her timsahın kimliği (çevrimiçi değişiklik imzası)
const timsahOmru = (tur) => (tur === "sus" ? TIMSAH.susSure : TIMSAH.uyari + TIMSAH.atilma + TIMSAH.batis);

// Bir göle göre işaretli uzaklık: içeride eksi
function suUzakligi(o, x, y) {
  if (o.carpisma) return engelUzaklik(o.carpisma, x - o.x, y - o.y);
  return ENGEL.parcaUzaklik({ t: "k", x: o.x, y: o.y, w: o.w, h: o.h, rr: 0 }, x, y);
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
  if (tur === "cik") audio.noise(0.25, 0.10 * v);
  else audio.beep(140, 0.09, "square", 0.16 * v);
}

function timsahSifirla() {
  game.timsahlar = [];
  game._timsahSular = game.waters;
  game._timsahKiyi = 0;     // oyuncunun kıyıda durduğu süre
  game._timsahAra = 0;      // sonraki saldırıya kalan
  game._timsahSus = TIMSAH.susAra[0];
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

// Süs: görünen bir gölün içinde bakınan gözler (kimi zaman boşa ısırık). Çevrimiçi kurucu öbür oyuncuların yakınındaki
// gölleri de seçer: süsler ortaktır
function timsahSusle() {
  const cam = game.camera || { x: 0, y: 0 }, W = game.W || 0, H = game.H || 0;
  const uzaklar = online.mode === "host" ? Object.values(online.remotePlayers).filter((rp) => rp && Number.isFinite(rp.x)) : [];
  const gorunen = (game.waters || []).filter((o) => (o.x < cam.x + W && o.x + o.w > cam.x && o.y < cam.y + H && o.y + o.h > cam.y) ||
    uzaklar.some((rp) => Math.abs(rp.x - (o.x + o.w / 2)) < 500 && Math.abs(rp.y - (o.y + o.h / 2)) < 700));
  if (!gorunen.length) return null;
  const o = gorunen[Math.floor(Math.random() * gorunen.length)];
  for (let i = 0; i < 40; i++) {
    const x = o.x + Math.random() * o.w, y = o.y + Math.random() * o.h;
    if (suUzakligi(o, x, y) < -22) {
      const tur = Math.random() < TIMSAH.bosOlasilik ? "bos" : "sus";
      const tm = { id: ++_timsahNo, tur, x, y, a: Math.random() * Math.PI * 2, t: 0 };
      game.timsahlar.push(tm);
      return tm;
    }
  }
  return null;
}

function timsahIsirir(tm) {
  const p = game.player;
  if (!p || p.dead || p.invuln > 0 || game.devamBekliyor) return false;
  if ((p.invisibleUntil || 0) > performance.now()) return false;
  return Math.hypot(p.x - tm.x, p.y - tm.y) < TIMSAH.menzil;
}

// update() her karede çağırır (duraklatınca çağrılmaz)
function timsahGuncelle(dt) {
  if (game._timsahSular !== game.waters || !game.timsahlar) timsahSifirla();
  const p = game.player;
  // Var olanlar
  for (const tm of game.timsahlar) {
    tm.t += dt;
    if (tm.tur !== "sus" && !tm.isirdi && tm.t >= TIMSAH.uyari + TIMSAH.atilma) {
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
  // Kıyıda duran oyuncu
  game._timsahAra = Math.max(0, game._timsahAra - dt);
  // Köprüdeki ya da köprüden düşmüş oyuncuya kıyı saldırısı yok: köprüde kural düşmedir (kopru.js)
  if (!p || p.dead || game.devamBekliyor || p.dusus || koprudeMi(p.x, p.y)) { game._timsahKiyi = 0; return; }
  const { su, d } = enYakinSu(p.x, p.y);
  if (!su || d - p.r > TIMSAH.yakin) { game._timsahKiyi = 0; return; }
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
    metin: liste.map((tm) => `${tm.tur === "saldiri" ? "a" : tm.tur === "bos" ? "b" : "s"}${Math.round(tm.x)},${Math.round(tm.y)},${Math.round(tm.a * 100)},${Math.round(tm.t * 1000)}`).join(";"),
  };
}
function uzakTimsahlariAl(metin) {
  const simdi = performance.now(), turu = { a: "saldiri", b: "bos", s: "sus" };
  const out = [];
  for (const parca of String(metin || "").split(";")) {
    const m = /^([abs])(-?\d+),(-?\d+),(-?\d+),(\d+)$/.exec(parca);
    if (m) out.push({ tur: turu[m[1]], x: +m[2], y: +m[3], a: +m[4] / 100, t0: +m[5] / 1000, alindi: simdi });
  }
  return out;
}

function timsahCiz(ctx, tm) {
  {
    ctx.save();
    ctx.translate(tm.x, tm.y);
    if (tm.tur === "sus") {
      const u = tm.t / TIMSAH.susSure, alfa = Math.min(1, u * 5, (1 - u) * 5);
      halka(ctx, 0, 0, 14 + u * 18, 0.35 * alfa);
      ctx.globalAlpha = alfa;
      ctx.rotate(tm.a + Math.sin(tm.t * 1.7) * 0.25);
      ctx.translate(0, Math.sin(tm.t * 3) * 1.2);
      timsahGozleri(ctx, 8, 0.9);
      ctx.fillStyle = "#1a2e05";
      ctx.beginPath(); ctx.arc(22, -2.5, 1.4, 0, Math.PI * 2); ctx.arc(22, 2.5, 1.4, 0, Math.PI * 2); ctx.fill();
    } else {
      const { uyari, atilma, batis } = TIMSAH, z = tm.t;
      if (z < uyari) {                                                             // kabarcık ve yükselen gözler
        const u = z / uyari;
        for (let i = 0; i < 3; i++) halka(ctx, Math.sin(i * 2.1 + z * 6) * 10, Math.cos(i * 1.7 + z * 5) * 6, 6 + ((u * 3 + i / 3) % 1) * 22, 0.55 * (1 - ((u * 3 + i / 3) % 1)));
        ctx.globalAlpha = Math.min(1, u * 2);
        ctx.rotate(tm.a);
        timsahGozleri(ctx, 9, 0.6 + u * 0.4);
      } else if (z < uyari + atilma) {                                             // ağız açık atılış, sonunda kapanır
        const u = (z - uyari) / atilma;
        halka(ctx, 0, 0, 26 + u * 10, 0.5);
        ctx.rotate(tm.a);
        timsahKafa(ctx, u * 32, u < 0.8 ? 1 : (1 - u) * 5);
      } else {                                                                     // geri çekilip batar
        const u = Math.min(1, (z - uyari - atilma) / batis);
        halka(ctx, 0, 0, 36 + u * 14, 0.4 * (1 - u));
        ctx.globalAlpha = 1 - u;
        ctx.rotate(tm.a);
        timsahKafa(ctx, 32 * (1 - u), 0);
      }
    }
    ctx.restore();
  }
}
