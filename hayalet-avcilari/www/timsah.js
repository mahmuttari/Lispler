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
  // TMS1: timsahın sudan karaya gezintisi (kullanıcının isteği). TMS2 ("su halkası peşinden gelmesin, sudan tamamen
  // çıksın, karakteri nerede yakalarsa orada ısırsın"): karada gövdenin merkezi sudan suPay px uzakta kalır (gövde ≈ 80 px),
  // oyuncunun anlık konumuna hizOran × oyuncu hızıyla (oyuncudan yavaş: kaçılabilir) koşar, çıkış noktasından en çok
  // tasma px uzaklaşır; yakalarsa orada ısırır, sonra izini geri izleyip suya döner. Su halkası yalnız sudan çıkmadan
  // önce (uyari) ve en sonda batarken çizilir.
  gez: { ara: [8, 14], yakin: 350, cikis: 0.4, kovala: 1.9, isir: 0.3, gir: 0.35, dokunma: 40, suPay: 48, tasma: 150, hizOran: 0.6, donusKat: 1.5 },
};
let _timsahNo = 0;   // her timsahın kimliği (çevrimiçi değişiklik imzası)
const timsahOmru = (tur) => (tur === "sus" ? TIMSAH.susSure
  : tur === "gez" ? TIMSAH.uyari + TIMSAH.gez.cikis + TIMSAH.gez.kovala + TIMSAH.gez.isir + TIMSAH.gez.kovala / TIMSAH.gez.donusKat + TIMSAH.gez.gir + TIMSAH.batis
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

// TMS2: (px, py) bütün göllerden en az `pay` px uzakta mı
function timsahSudanUzak(px, py, pay) {
  for (const o of game.waters || []) if (suUzakligi(o, px, py) < pay) return false;
  return true;
}

// TMS2: su noktasından (x, y) a yönünde, sudan suPay px uzakta ilk kara noktası (çıkış noktası). Yolda duvar ya da köprü
// çıkarsa, dünyanın dışına taşarsa ya da 170 px içinde kara bulunamazsa null (timsah doğmaz).
function timsahCikisNoktasi(x, y, a) {
  const c = Math.cos(a), s = Math.sin(a), W = game.worldW, H = game.worldH;
  for (let d = TIMSAH.icPay; d <= 170; d += 3) {
    const px = x + c * d, py = y + s * d;
    if (W !== undefined && (px < 20 || py < 20 || px > W - 20 || py > H - 20)) return null;
    if (collidesWalls(px, py, 20) || koprudeMi(px, py)) return null;
    if (timsahSudanUzak(px, py, TIMSAH.gez.suPay)) return { x: px, y: py };
  }
  return null;
}

// TMS2: kovalama sırasında gövde merkezinin durabileceği yer: sudan uzak, duvarsız, köprüsüz, çıkış noktasına tasma içinde
function timsahGezGecerli(tm, px, py) {
  const W = game.worldW, H = game.worldH;
  if (W !== undefined && (px < 20 || py < 20 || px > W - 20 || py > H - 20)) return false;
  if (Math.hypot(px - tm.ex, py - tm.ey) > TIMSAH.gez.tasma) return false;
  return !collidesWalls(px, py, 20) && !koprudeMi(px, py) && timsahSudanUzak(px, py, TIMSAH.gez.suPay);
}

// Eski ad: su noktasından çıkış noktasına uzaklık (px)
function timsahGezMesafe(tm) { return Math.hypot(tm.ex - tm.x, tm.ey - tm.y); }

// TMS2: oyuncuya en yakın kıyıdan karaya çıkan, oyuncuyu kovalayan timsah
function timsahGezdir(o, x, y) {
  const n = kiyidaNokta(o, x, y);
  if (!n) return null;
  const wx = Math.round(n.x), wy = Math.round(n.y);
  const a = Math.round(Math.atan2(y - n.y, x - n.x) * 100) / 100;
  const e = timsahCikisNoktasi(wx, wy, a);
  if (!e) return null;
  const tm = {
    id: ++_timsahNo, tur: "gez", x: wx, y: wy, a, t: 0, isirdi: false, sesli: false,
    ex: e.x, ey: e.y, kx: wx, ky: wy, faz: "bekle", ft: 0, iz: [], yol: 0,
  };
  game.timsahlar.push(tm);
  timsahSesi("cik");
  return tm;
}

// TMS2: gezinti timsahının evreleri (tm.faz): bekle (suda halka ve gözler) → cik (kıyıdan çıkış noktasına) → kov
// (oyuncunun peşinde) → isir (ısırdığı yerde kısa duraklama) → don (izini geri izler) → gir (suya) → bat (halka ve batış)
function timsahGezIlerlet(tm, dt, p) {
  const g = TIMSAH.gez;
  tm.ft += dt;
  if (tm.faz === "bekle") {
    if (tm.t >= TIMSAH.uyari) {
      tm.faz = "cik"; tm.ft = 0;
      if (!tm.sesli) { tm.sesli = true; if (audio.canliSes) audio.canliSes("timsah", tm.ex, tm.ey, 0.5); }
    }
  } else if (tm.faz === "cik") {
    const u = Math.min(1, tm.ft / g.cikis);
    tm.kx = tm.x + (tm.ex - tm.x) * u; tm.ky = tm.y + (tm.ey - tm.y) * u;
    if (u >= 1) { tm.faz = "kov"; tm.ft = 0; tm.iz = [[tm.ex, tm.ey]]; }
  } else if (tm.faz === "kov") {
    const hiz = (p && p.speed > 0 ? p.speed : 200) * g.hizOran;
    if (p && !p.dead) {
      const dx = p.x - tm.kx, dy = p.y - tm.ky, d = Math.hypot(dx, dy);
      if (d > 14) {
        const adim = Math.min(hiz * dt, d - 14), vx = dx / d * adim, vy = dy / d * adim;
        let nx = tm.kx + vx, ny = tm.ky + vy;
        if (!timsahGezGecerli(tm, nx, ny)) {
          if (timsahGezGecerli(tm, tm.kx + vx, tm.ky)) { nx = tm.kx + vx; ny = tm.ky; }
          else if (timsahGezGecerli(tm, tm.kx, tm.ky + vy)) { nx = tm.kx; ny = tm.ky + vy; }
          else { nx = tm.kx; ny = tm.ky; }
        }
        const yol = Math.hypot(nx - tm.kx, ny - tm.ky);
        if (yol > 0.01) {
          tm.a = Math.atan2(ny - tm.ky, nx - tm.kx);
          tm.kx = nx; tm.ky = ny; tm.yol += yol;
          const son = tm.iz[tm.iz.length - 1];
          if (Math.hypot(nx - son[0], ny - son[1]) >= 6) tm.iz.push([nx, ny]);
        } else tm.a = Math.atan2(dy, dx);
      }
    }
    if (!tm.isirdi && timsahIsirir(tm, g.dokunma + (p ? p.r : 0))) {   // yakaladığı yerde ısırır (tek kez)
      tm.isirdi = true; tm.isirikT = tm.t; tm.faz = "isir"; tm.ft = 0;
      timsahSesi("isir");
      showFloat(t("🐊 Timsah ısırdı!"), p.x, p.y - 30);
      navigator.vibrate?.(80);
      damagePlayer();
      game._timsahAra = TIMSAH.ara;
    } else if (tm.ft >= g.kovala) { tm.faz = "don"; tm.ft = 0; }
  } else if (tm.faz === "isir") {
    if (tm.ft >= g.isir) { tm.faz = "don"; tm.ft = 0; }
  } else if (tm.faz === "don") {
    let kal = ((p && p.speed > 0 ? p.speed : 200) * g.hizOran * g.donusKat) * dt;
    while (kal > 0 && tm.iz.length) {
      const [qx, qy] = tm.iz[tm.iz.length - 1], d = Math.hypot(qx - tm.kx, qy - tm.ky);
      if (d <= kal) { tm.kx = qx; tm.ky = qy; kal -= d; tm.iz.pop(); tm.yol += d; }
      else { tm.a = Math.atan2(qy - tm.ky, qx - tm.kx); tm.kx += (qx - tm.kx) / d * kal; tm.ky += (qy - tm.ky) / d * kal; tm.yol += kal; kal = 0; }
    }
    if (!tm.iz.length) { tm.kx = tm.ex; tm.ky = tm.ey; tm.faz = "gir"; tm.ft = 0; }
  } else if (tm.faz === "gir") {
    const u = Math.min(1, tm.ft / g.gir);
    tm.a = Math.atan2(tm.y - tm.ey, tm.x - tm.ex);
    tm.kx = tm.ex + (tm.x - tm.ex) * u; tm.ky = tm.ey + (tm.y - tm.ey) * u;
    if (u >= 1) { tm.faz = "bat"; tm.ft = 0; tm.kx = tm.x; tm.ky = tm.y; }
  } else if (tm.faz === "bat") {
    if (tm.ft >= TIMSAH.batis) tm.bitti = true;
  }
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
  if (tm.tur === "gez") return { x: tm.kx !== undefined ? tm.kx : tm.x, y: tm.ky !== undefined ? tm.ky : tm.y }; // TMS2: tek kaynak
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
    if (tm.tur === "gez") timsahGezIlerlet(tm, dt, p);
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
  game.timsahlar = game.timsahlar.filter((tm) => (tm.tur === "gez" ? !tm.bitti && tm.t < timsahOmru("gez") + 2 : tm.t < timsahOmru(tm.tur)));
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
        if (t1 < timsahOmru(tm.tur) + (tm.tur === "gez" ? 2 : 0)) timsahCiz(ctx, { ...tm, t: t1, ft: (tm.ft0 || 0) + (simdi - tm.alindi) / 1000 });
      }
    }
  }
}

// ---------- çevrimiçi ----------
// Oda kaydına giden biçim: "<s|a|b|g>x,y,açı×100,yaş ms[,kx,ky,evre,evre ms];…" (s süs, a saldırı, b boşa ısırık, g gezinti).
// TMS2: gezintide x,y su noktası, kx,ky timsahın o anki gerçek karadaki konumu, evre 0-6 (FAZ_SIRA), evre ms evredeki
// süre; eski biçim (ilk beş alan) okunmaya devam eder. İmza: kimlikler; gezintide ayrıca evre ve 12 px'e yuvarlanmış konum
// (kovalamada konum değişince kayıt yenilenir). Yaş karşıda yerel saatle ilerletilir.
const TIMSAH_FAZ = ["bekle", "cik", "kov", "isir", "don", "gir", "bat"];
function timsahDizisi() {
  const liste = (game.timsahlar || []).slice(-4);
  return {
    imza: liste.map((tm) => (tm.tur === "gez" ? `${tm.id}.${tm.faz}.${Math.round(timsahKonum(tm).x / 12)}.${Math.round(timsahKonum(tm).y / 12)}` : tm.id)).join(","),
    metin: liste.map((tm) => {
      const bas = `${tm.tur === "saldiri" ? "a" : tm.tur === "bos" ? "b" : tm.tur === "gez" ? "g" : "s"}${Math.round(tm.x)},${Math.round(tm.y)},${Math.round(tm.a * 100)},${Math.round(tm.t * 1000)}`;
      if (tm.tur !== "gez") return bas;
      const k = timsahKonum(tm);
      return `${bas},${Math.round(k.x)},${Math.round(k.y)},${Math.max(0, TIMSAH_FAZ.indexOf(tm.faz))},${Math.round((tm.ft || 0) * 1000)}`;
    }).join(";"),
  };
}
function uzakTimsahlariAl(metin) {
  const simdi = performance.now(), turu = { a: "saldiri", b: "bos", g: "gez", s: "sus" };
  const out = [];
  for (const parca of String(metin || "").split(";")) {
    const m = /^([abgs])(-?\d+),(-?\d+),(-?\d+),(\d+)(?:,(-?\d+),(-?\d+),([0-6]),(\d+))?$/.exec(parca);
    if (!m) continue;
    const tm = { tur: turu[m[1]], x: +m[2], y: +m[3], a: +m[4] / 100, t0: +m[5] / 1000, alindi: simdi };
    if (tm.tur === "gez") {
      if (m[6] !== undefined) { tm.kx = +m[6]; tm.ky = +m[7]; tm.faz = TIMSAH_FAZ[+m[8]]; tm.ft0 = +m[9] / 1000; }
      else { tm.kx = tm.x; tm.ky = tm.y; tm.faz = "bekle"; tm.ft0 = 0; }   // eski biçim: konum yok, suda gösterilir
    }
    out.push(tm);
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
  if (tm.tur === "gez" && tm.faz !== "bekle" && tm.faz !== "bat") return;   // TMS2: karada su halkası çizilmez
  const { su } = enYakinSu(tm.x, tm.y);
  if (!su) return;
  ctx.save();
  timsahSuYolu(ctx, su);
  ctx.clip();
  const z = tm.t, { uyari, atilma, batis } = TIMSAH;
  if (tm.tur === "gez") {
    // TMS2: halka yalnız suya çıkmadan önce (bekle) ve en sonda batarken (bat); karada hiç yok
    if (tm.faz === "bekle") {
      const u = Math.min(1, z / uyari);
      for (let i = 0; i < 3; i++) halka(ctx, tm.x + Math.sin(i * 2.1 + z * 6) * 10, tm.y + Math.cos(i * 1.7 + z * 5) * 6, 6 + ((u * 3 + i / 3) % 1) * 22, 0.55 * (1 - ((u * 3 + i / 3) % 1)));
    } else if (tm.faz === "bat") {
      const u = Math.min(1, (tm.ft || 0) / batis);
      halka(ctx, tm.x, tm.y, 36 + u * 14, 0.4 * (1 - u));
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

// TMS2: an-timsah-3 ve -4 karelerinin suyla boyalı alt bandı. Kareler 192×127; ölçüm (PIL ile yalnız okundu): kare 3'te
// gövdenin yeşili 93. satıra kadar iner, mavi dalga 71. satırda başlar, saf su 96'dan sonradır; kare 4'te yeşil 103'e kadar,
// mavi 56'dan itibaren (yanlardaki damlalar dahil), saf su 104'ten sonra. Karada çizerken dalganın en yoğun yerinin üstünden,
// yani kare 3'te 82. (0,646), kare 4'te 90. satırdan (0,709) kırpılır: göl lekesi karada timsahla gezmez.
const TIMSAH_SU_CIZGISI = { 3: 82 / 127, 4: 90 / 127 };
const TIMSAH_KUTU = { x: -40, y: -30, w: 80, h: 56 };   // animCiz kutusu; resim 80×52,9 olarak ortalanır

// Karada bir kare: su bandı kırpılır, kırpma çizgisi merkezin 6 px altına gelir (ayak hizası)
function timsahKirpikKare(ctx, kare) {
  const k = TIMSAH_KUTU, kutuOrani = 127 / 192, dh = Math.min(k.h, k.w * kutuOrani);
  const kes = (k.h - dh) / 2 + TIMSAH_SU_CIZGISI[kare] * dh;   // kutunun üstünden kırpma çizgisine
  const y0 = 6 - kes;
  ctx.save();
  ctx.beginPath(); ctx.rect(k.x - 10, y0 - 10, k.w + 20, 10 + kes); ctx.clip();
  const ok = animCiz(ctx, "timsah", kare, k.x, y0, k.w, k.h);
  ctx.restore();
  return ok;
}

// TMS2: gezinti timsahı çizimi. Karada: tam gövde kareleri (timsah-yuru / -dur / -isir) varsa onlar, yoksa kare 3 (yürüme)
// ve kare 4 (ısırık) su bandından kırpılarak. Suda (bekle, bat): kareler olduğu gibi.
function timsahGezKareCiz(ctx, tm) {
  const { uyari, batis } = TIMSAH, faz = tm.faz || "bekle", k = timsahKonum(tm);
  const karada = faz === "kov" || faz === "isir" || faz === "don" || faz === "cik" || faz === "gir";
  const yurur = faz === "kov" || faz === "don" || faz === "cik" || faz === "gir";
  const yolcu = tm.yol || 0;
  let alfa = 1;
  if (faz === "bekle") { const q = Math.min(1, tm.t / uyari); alfa = Math.min(1, q * 3 + 0.3); }
  else if (faz === "bat") alfa = 1 - Math.min(1, (tm.ft || 0) / batis);
  const yoff = yurur && !timsahAzHareket() ? -Math.abs(Math.sin(yolcu / 9)) * 3 : 0;
  ctx.save();
  ctx.translate(k.x, k.y);
  if (Math.cos(tm.a) < 0) ctx.scale(-1, 1);
  ctx.globalAlpha *= Math.max(0, alfa);
  let ok = false;
  if (!karada) {
    const kare = faz === "bat" ? 6 : (tm.t / uyari < 0.5 ? 1 : 2);
    ok = animCiz(ctx, "timsah", kare, TIMSAH_KUTU.x, TIMSAH_KUTU.y, TIMSAH_KUTU.w, TIMSAH_KUTU.h);
  } else {
    if (faz !== "cik" && faz !== "gir") {       // ayak gölgesi (suyun kenarındaki geçişte çizilmez)
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.beginPath(); ctx.ellipse(0, 6, 22, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.translate(0, yoff);
    const yuru = animHazir("timsah-yuru"), dur = animHazir("timsah-dur"), isir = animHazir("timsah-isir"), cik = animHazir("timsah-cik");
    if (faz === "isir") {
      if (isir) ok = animCiz(ctx, "timsah-isir", 1, -48, -42, 96, 48, true);
      else if (dur) { // K17'de ayrı ısırık karesi yok: ağzı açık bekleme karesi kısa bir öne atılmayla
        const u = Math.min(1, (tm.ft || 0) / 0.3), at = timsahAzHareket() ? 0 : Math.sin(u * Math.PI) * 6;
        ok = animCiz(ctx, "timsah-dur", 1, -48 + at, -42, 96, 48, true);
      } else ok = timsahKirpikKare(ctx, 4);
    } else if ((faz === "cik" || faz === "gir") && cik) {
      ok = animCiz(ctx, "timsah-cik", 1 + (Math.floor((tm.ft || 0) * 8) % cik), -48, -42, 96, 48, true);
    } else if (yuru) {
      ok = animCiz(ctx, "timsah-yuru", 1 + (Math.floor(yolcu / 12) % yuru), -48, -42, 96, 48, true);
    } else if (dur && !yurur) {
      ok = animCiz(ctx, "timsah-dur", 1, -48, -42, 96, 48, true);
    } else ok = timsahKirpikKare(ctx, 3);
  }
  ctx.restore();
  return ok;
}

// ChatGPT timsah kareleri (N12: dalga, gözler, baş, açık ağız, kapma, batış). Kareler yandan çizildiği için döndürülmez;
// sola atılan timsah aynalanır, baş atılış yönünde ilerler. Hazır değilse false (kod çizimi).
function timsahKareCiz(ctx, tm) {
  if (typeof animHazir !== "function" || !animHazir("timsah")) return false;
  const { uyari, atilma, batis } = TIMSAH;
  let kare, alfa = 1;
  if (tm.tur === "gez") return timsahGezKareCiz(ctx, tm);
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

// GOR4: süs timsahı (tur "sus": yalnız suda bakar, ısırmaz) için ChatGPT "sudan bakan baş" resmi (timsah-bakis).
// Resim önden çizilmiş ve simetrik: döndürülmez, aynalanmaz. Yoksa kare/kod çizimi. Yürüyüş ve saldırı mantığına dokunmaz.
function timsahBakisCiz(ctx, tm) {
  if (tm.tur !== "sus" || typeof gorsel !== "function" || !gorsel("timsah-bakis")) return false;
  const u = tm.t / TIMSAH.susSure, alfa = Math.min(1, u * 5, (1 - u) * 5);
  const konum = timsahKonum(tm);
  ctx.save();
  ctx.globalAlpha *= Math.max(0, alfa);
  gorselKutuya(ctx, "timsah-bakis", konum.x - 34, konum.y - 26, 68, 44);
  ctx.restore();
  return true;
}

function timsahCiz(ctx, tm) {
  timsahSplashCiz(ctx, tm);
  if (timsahBakisCiz(ctx, tm)) return;
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
      const faz = tm.faz || "bekle";
      if (faz === "bekle") { ctx.globalAlpha = Math.min(1, (tm.t / TIMSAH.uyari) * 2); ctx.rotate(tm.a); timsahGozleri(ctx, 9, 0.6 + 0.4 * Math.min(1, tm.t / TIMSAH.uyari)); }
      else {
        if (faz === "bat") ctx.globalAlpha = 1 - Math.min(1, (tm.ft || 0) / TIMSAH.batis);
        ctx.rotate(tm.a);
        timsahKafa(ctx, 0, faz === "isir" ? 1 : 0);
      }
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
