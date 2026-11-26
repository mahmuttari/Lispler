/* ============================================================
   HAYALET AVCILARI — ZEMİN KATMANI (ZEM1A1)
   Harita zeminine yol/patika çizer. Yalnız görseldir: çarpışma,
   oyun akışı ve ağ davranışı değişmez. Yollar 512x512 dünya
   parçalarında önbelleklenir; her karede en çok bir eksik parça
   kurulur, böylece yol ilk karede topluca çizilip sıçrama yapmaz.
   ============================================================ */
(function () {
  "use strict";
  const PARCA = 512;

  // Bir noktanın (px,py) AB doğru parçasına uzaklığı (dünya px)
  function noktaCizgiUzaklik(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, uz = dx * dx + dy * dy;
    let t = uz ? ((px - ax) * dx + (py - ay) * dy) / uz : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
  }

  // Parçanın görünür kutusunu yol genişliği kadar büyütüp kesişim sınar
  function yolParcaKesiyor(yol, ox, oy, boy) {
    const p = yol.noktalar, yari = (yol.gen || 64) / 2 + 8;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const q of p) {
      if (q.x < minX) minX = q.x; if (q.x > maxX) maxX = q.x;
      if (q.y < minY) minY = q.y; if (q.y > maxY) maxY = q.y;
    }
    return !(maxX + yari < ox || minX - yari > ox + boy || maxY + yari < oy || minY - yari > oy + boy);
  }

  // Noktalardan yumuşak eğri (orta noktalardan geçen ikinci derece eğriler)
  function yolEgri(c, pts) {
    c.beginPath();
    c.moveTo(pts[0].x, pts[0].y);
    if (pts.length === 2) { c.lineTo(pts[1].x, pts[1].y); return; }
    for (let i = 1; i < pts.length - 1; i++) {
      const p = pts[i], q = pts[i + 1];
      c.quadraticCurveTo(p.x, p.y, (p.x + q.x) / 2, (p.y + q.y) / 2);
    }
    const son = pts[pts.length - 1], onceki = pts[pts.length - 2];
    c.quadraticCurveTo(onceki.x, onceki.y, son.x, son.y);
  }

  // Taş yol mu: tema 1, 4, 6 ve Dünya Turu'nda K / KS / DA aileleri
  function tasYolMu() {
    try {
      if (typeof game !== "undefined" && game && game.dunyaTuru) {
        const u = typeof turUlkesi === "function" ? turUlkesi() : null;
        return !!u && (u.aile === "K" || u.aile === "KS" || u.aile === "DA");
      }
      const th = typeof getTheme === "function" ? getTheme() : null;
      if (!th || typeof LEVEL_THEMES === "undefined") return false;
      const i = LEVEL_THEMES.indexOf(th) + 1;
      return i === 1 || i === 4 || i === 6;
    } catch (e) { return false; }
  }

  // Yol dolgusu: zemin-yol-* resmi varsa 256 dünya px döşeme deseni; yoksa düz toprak/taş rengi
  function yolDeseni(c, tas) {
    let im = null;
    try { im = typeof gorsel === "function" ? gorsel(tas ? "zemin-yol-tas" : "zemin-yol-toprak") : null; } catch (e) { im = null; }
    if (!im || !im.width) return null;
    try {
      const desen = c.createPattern(im, "repeat");
      if (desen && desen.setTransform && typeof DOMMatrix === "function") {
        const k = 256 / im.width;
        desen.setTransform(new DOMMatrix([k, 0, 0, k, 0, 0]));
      }
      return desen;
    } catch (e) { return null; }
  }

  // Tek bir 512x512 dünya parçasını (ölçekli tuval) yol çizgileriyle boyar
  function parcaKur(zemin, cx, cy, s) {
    let tuval;
    try {
      tuval = document.createElement("canvas");
      tuval.width = Math.max(1, Math.ceil(PARCA * s));
      tuval.height = Math.max(1, Math.ceil(PARCA * s));
    } catch (e) { return null; }
    const c = tuval.getContext("2d");
    if (!c) return null;
    const ox = cx * PARCA, oy = cy * PARCA;
    c.setTransform(s, 0, 0, s, -ox * s, -oy * s);
    c.lineCap = "round";
    c.lineJoin = "round";
    const tas = tasYolMu();
    for (const yol of zemin.yollar) {
      if (!yol || !Array.isArray(yol.noktalar) || yol.noktalar.length < 2) continue;
      if (!yolParcaKesiyor(yol, ox, oy, PARCA)) continue;
      c.globalAlpha = 1;
      c.strokeStyle = "rgba(0,0,0,0.18)";
      c.lineWidth = (yol.gen || 64) + 6;
      yolEgri(c, yol.noktalar); c.stroke();
      c.globalAlpha = 0.9;
      c.lineWidth = yol.gen || 64;
      const desen = yolDeseni(c, tas);
      c.strokeStyle = desen || (tas ? "rgba(91,88,102,0.85)" : "rgba(107,90,67,0.85)");
      yolEgri(c, yol.noktalar); c.stroke();
      c.globalAlpha = 1;
    }
    return tuval;
  }

  // İki uç arasına 1-2 tohumlu ara nokta (dikey ±60 px) ekler
  function araliNoktalar(a, b, bolum, ulke, sira) {
    const A = typeof YOLCULUK_AYAR !== "undefined" ? YOLCULUK_AYAR : null;
    const yukari = A && A.worldH ? A.worldH : (typeof game !== "undefined" && game.worldH) || 1000;
    const n = 1 + Math.floor(yolculukRastgele(bolum, ulke, sira, 1) * 2);
    const pts = [{ x: a.x, y: a.y }];
    for (let k = 1; k <= n; k++) {
      const t = k / (n + 1);
      const sap = (yolculukRastgele(bolum, ulke, sira, k + 1) * 2 - 1) * 60;
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t + sap;
      pts.push({ x, y: Math.max(60, Math.min(yukari - 60, y)) });
    }
    pts.push({ x: b.x, y: b.y });
    return pts;
  }

  // Bölümün zemin betimini kur: yol polyline'ları (nehir şeritleri ayrı parçalara bölünür)
  function zeminKatmaniKur() {
    if (typeof game === "undefined" || !game) return;
    const yollar = [], lekeler = [];
    game._zeminKatmani = { yollar, lekeler };
    zeminKatmaniSil();
    let acik = false;
    try { acik = typeof yolculukAcik === "function" && yolculukAcik(); } catch (e) { acik = false; }
    if (!acik || typeof yolculukBaslangic !== "function") return;
    const d = game._yolculukDuzen;
    if (!d || !Array.isArray(d.zones) || !d.arena) return;
    const A = typeof YOLCULUK_AYAR !== "undefined" ? YOLCULUK_AYAR : { worldH: game.worldH || 1000 };
    const bolum = game.level || 1;
    const ulke = typeof yolculukUlkeKodu === "function" ? yolculukUlkeKodu() : "-";
    let onceki = yolculukBaslangic();
    for (let i = 0; i < d.zones.length; i++) {
      const g = d.zones[i].gate;
      yollar.push({ noktalar: araliNoktalar(onceki, { x: g.x0 - 40, y: g.cy }, bolum, ulke, i * 2 + 1), gen: 64 });
      // Nehir şeridi atlanır; sonraki parça sağ kıyıdan başlar
      onceki = { x: g.x1 + 40, y: g.cy };
    }
    yollar.push({ noktalar: araliNoktalar(onceki, { x: d.arena.x0 - 20, y: A.worldH / 2 }, bolum, ulke, 999), gen: 64 });
  }

  function zeminKatmaniSil() {
    if (typeof game !== "undefined" && game) {
      if (game._zeminParcalari && typeof game._zeminParcalari.clear === "function") game._zeminParcalari.clear();
      else game._zeminParcalari = new Map();
    }
  }

  // Görünür parçaları önbellekten çiz; eksikse bu çağrıda en çok birini kur
  function zeminKatmaniCiz(ctx) {
    if (typeof game === "undefined" || !game || !ctx) return;
    const zemin = game._zeminKatmani;
    if (!zemin || !Array.isArray(zemin.yollar) || !zemin.yollar.length) return;
    if (typeof engelOlcegi !== "function") return;
    const s = engelOlcegi() || 1;
    if (!game._zeminParcalari || typeof game._zeminParcalari.get !== "function") game._zeminParcalari = new Map();
    const onbellek = game._zeminParcalari;
    const cam = game.camera || { x: 0, y: 0 };
    const W = game.W || 0, H = game.H || 0;
    const x0 = Math.floor(cam.x / PARCA), x1 = Math.floor((cam.x + W) / PARCA);
    const y0 = Math.floor(cam.y / PARCA), y1 = Math.floor((cam.y + H) / PARCA);
    let kurulan = false;
    const eskiDuz = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false; // parçalar dünya ölçeğinde 1:1; yumuşatma taraması pahalı
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        const anahtar = cx + "|" + cy + "|" + s;
        const varOlan = onbellek.get(anahtar);
        if (varOlan !== undefined) {
          if (varOlan) ctx.drawImage(varOlan, cx * PARCA, cy * PARCA, PARCA, PARCA);
          continue;
        }
        if (!kurulan) {
          onbellek.set(anahtar, parcaKur(zemin, cx, cy, s) || 0);
          kurulan = true;
        }
      }
    }
    ctx.imageSmoothingEnabled = eskiDuz;
  }

  function zeminKatmaniYolMu(x, y) {
    if (typeof game === "undefined" || !game || !game._zeminKatmani) return false;
    const yollar = game._zeminKatmani.yollar;
    if (!Array.isArray(yollar)) return false;
    for (const yol of yollar) {
      const p = yol && yol.noktalar;
      if (!Array.isArray(p) || p.length < 2) continue;
      const yari = (yol.gen || 64) / 2;
      for (let i = 0; i < p.length - 1; i++) {
        if (noktaCizgiUzaklik(x, y, p[i].x, p[i].y, p[i + 1].x, p[i + 1].y) <= yari) return true;
      }
    }
    return false;
  }

  window.addEventListener("gorsel-yuklendi", () => zeminKatmaniSil());

  Object.assign(window, { zeminKatmaniKur, zeminKatmaniCiz, zeminKatmaniSil, zeminKatmaniYolMu });
})();
