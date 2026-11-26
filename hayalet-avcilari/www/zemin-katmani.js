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

  // Leke dokusu: aile/temaya göre ikinci zemin resmi (yoksa null → düz açık renk)
  function lekeDokusu() {
    try {
      if (typeof game !== "undefined" && game && game.dunyaTuru) {
        const u = typeof turUlkesi === "function" ? turUlkesi() : null;
        const a = u && u.aile;
        if (a === "K" || a === "KS" || a === "DA") return "zemin-yol-tas";
        if (a === "KP" || a === "SH" || a === "SV" || a === "GA") return "zemin-kuru";
        if (a === "GDA" || a === "KA" || a === "LA") return "zemin-cimen";
        return null;
      }
      const th = typeof getTheme === "function" ? getTheme() : null;
      if (!th || typeof LEVEL_THEMES === "undefined") return null;
      const i = LEVEL_THEMES.indexOf(th) + 1;
      return i === 1 ? "zemin-yosunlu-tas" : i === 2 ? "zemin-cimen" : i === 3 ? "zemin-kum" : i === 5 ? "zemin-kuru" : null;
    } catch (e) { return null; }
  }

  function acikRenk(hex, oran) {
    let h = String(hex || "").replace("#", "");
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    if (h.length !== 6) return "rgb(90,86,80)";
    const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    const f = (v) => Math.round(v + (255 - v) * oran);
    return `rgb(${f(r)},${f(g)},${f(b)})`;
  }

  // Küçük leke tuvası: doku (varsa) ya da düz renk, yumuşak radyal alfa maskesiyle çarpılır
  function lekeTuvali(im, renk) {
    try {
      const B = 96, tv = document.createElement("canvas");
      tv.width = B; tv.height = B;
      const c = tv.getContext("2d");
      if (!c) return null;
      if (im && im.width && im.height) {
        const o = Math.max(B / im.width, B / im.height);
        const dw = im.width * o, dh = im.height * o;
        c.drawImage(im, (B - dw) / 2, (B - dh) / 2, dw, dh);
      } else {
        c.fillStyle = renk || "rgb(90,86,80)";
        c.fillRect(0, 0, B, B);
      }
      c.globalCompositeOperation = "destination-in";
      const g = c.createRadialGradient(B / 2, B / 2, B * 0.12, B / 2, B / 2, B * 0.5);
      g.addColorStop(0, "rgba(0,0,0,1)");
      g.addColorStop(0.62, "rgba(0,0,0,0.72)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = g;
      c.fillRect(0, 0, B, B);
      c.globalCompositeOperation = "source-over";
      return tv;
    } catch (e) { return null; }
  }

  // Harita genişliğine göre 6-12 yumuşak leke / 2000 px; su üstüne konmaz
  function lekeleriKur(bolum, ulke) {
    const W = (typeof game !== "undefined" && game && game.worldW) || 0;
    const H = (typeof game !== "undefined" && game && game.worldH) || 0;
    if (!W || !H) return [];
    const n = Math.round((W / 2000) * (6 + yolculukRastgele(bolum, ulke, 7000, 0) * 6));
    const adet = Math.max(1, n);
    const doku = lekeDokusu();
    let renk = "rgb(90,86,80)";
    try {
      const th = typeof getTheme === "function" ? getTheme() : null;
      if (th && th.floor) renk = acikRenk(th.floor, 0.1);
    } catch (e) { /* varsayılan renk */ }
    const out = [];
    for (let i = 0; i < adet; i++) {
      let x = 0, y = 0, r = 0, oldu = false;
      for (let t = 0; t < 24; t++) {
        r = 140 + yolculukRastgele(bolum, ulke, 7100 + i * 5, t * 3 + 1) * 240;
        const rx = Math.min(r, (W - 120) / 2), ry = Math.min(r, (H - 120) / 2);
        if (rx < 40 || ry < 40) continue;
        x = 60 + rx + yolculukRastgele(bolum, ulke, 7200 + i * 11, t * 3 + 2) * Math.max(0, W - 120 - 2 * rx);
        y = 60 + ry + yolculukRastgele(bolum, ulke, 7300 + i * 17, t * 3 + 3) * Math.max(0, H - 120 - 2 * ry);
        r = Math.min(r, rx, ry);
        if (typeof collidesWaters === "function" && collidesWaters(x, y, 0)) continue;
        oldu = true;
        break;
      }
      if (oldu) out.push({ x, y, r, doku, renk });
    }
    return out;
  }

  // Ana yoldan engelin dikdörtgen kenarına 38 px'lik patika (suya girmeyen, en çok 10)
  function enYakinCizgiNoktasi(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, uz = dx * dx + dy * dy;
    let t = uz ? ((px - ax) * dx + (py - ay) * dy) / uz : 0;
    t = Math.max(0, Math.min(1, t));
    return { x: ax + dx * t, y: ay + dy * t };
  }

  function cizgiSuda(a, b) {
    if (typeof collidesWaters !== "function") return false;
    const L = Math.hypot(b.x - a.x, b.y - a.y), n = Math.max(2, Math.ceil(L / 16));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      if (collidesWaters(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 0)) return true;
    }
    return false;
  }

  function patikalarEkle(yollar, patikalar) {
    if (typeof game === "undefined" || !game || !Array.isArray(game.walls)) return;
    if (!Array.isArray(patikalar)) return;
    let eklenen = 0;
    for (const o of game.walls) {
      if (eklenen >= 10) break;
      if (!o || (o.tur !== "obje1" && o.tur !== "obje2")) continue;
      const cx = o.x + o.w / 2, cy = o.y + o.h / 2;
      let en = Infinity, pm = null;
      for (const yol of yollar) {
        const p = yol && yol.noktalar;
        if (!Array.isArray(p) || p.length < 2) continue;
        for (let i = 0; i < p.length - 1; i++) {
          const q = enYakinCizgiNoktasi(cx, cy, p[i].x, p[i].y, p[i + 1].x, p[i + 1].y);
          const d = Math.hypot(q.x - cx, q.y - cy);
          if (d < en) { en = d; pm = q; }
        }
      }
      if (!pm || en > 420) continue;
      const ex = Math.max(o.x, Math.min(o.x + o.w, pm.x));
      const ey = Math.max(o.y, Math.min(o.y + o.h, pm.y));
      const dx = ex - pm.x, dy = ey - pm.y, uz = Math.hypot(dx, dy);
      if (uz < 1) continue; // yol engelin içinden geçiyor: patika kurulamaz
      const son = { x: ex - (dx / uz) * 6, y: ey - (dy / uz) * 6 };
      if (Math.hypot(son.x - pm.x, son.y - pm.y) < 12) continue;
      if (cizgiSuda(pm, son)) continue;
      patikalar.push({ noktalar: [{ x: pm.x, y: pm.y }, son], gen: 38, patika: true });
      eklenen++;
    }
  }

  // Klasik harita: merkez çevresinde 6-8 tohumlu noktadan kapalı döngü yolu
  function klasikDonguKur(yollar, bolum, ulke) {
    const W = game.worldW, H = game.worldH;
    if (!W || !H) return;
    const n = 6 + Math.floor(yolculukRastgele(bolum, ulke, 6000, 0) * 3);
    const cx = W / 2, cy = H / 2, pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (yolculukRastgele(bolum, ulke, 6100 + i, 1) - 0.5) * 0.35;
      const rx = W * (0.35 + yolculukRastgele(bolum, ulke, 6200 + i, 2) * 0.1);
      const ry = H * (0.35 + yolculukRastgele(bolum, ulke, 6300 + i, 3) * 0.1);
      const x = Math.max(60, Math.min(W - 60, cx + Math.cos(a) * rx));
      const y = Math.max(60, Math.min(H - 60, cy + Math.sin(a) * ry));
      pts.push({ x, y });
    }
    pts.push({ x: pts[0].x, y: pts[0].y });
    yollar.push({ noktalar: pts, gen: 64, dongu: true });
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
    // Alan çeşitliliği: yumuşak zemin lekeleri yolların altına boyanır
    for (const leke of (zemin.lekeler || [])) {
      if (!leke) continue;
      if (leke.x + leke.r < ox || leke.x - leke.r > ox + PARCA || leke.y + leke.r < oy || leke.y - leke.r > oy + PARCA) continue;
      let im = null;
      try { im = leke.doku && typeof gorsel === "function" ? gorsel(leke.doku) : null; } catch (e) { im = null; }
      if (!leke._tv || leke._tvIm !== im) { leke._tv = lekeTuvali(im, leke.renk); leke._tvIm = im; }
      if (!leke._tv) continue;
      c.globalAlpha = 0.4;
      c.drawImage(leke._tv, leke.x - leke.r, leke.y - leke.r, leke.r * 2, leke.r * 2);
      c.globalAlpha = 1;
    }
    const tas = tasYolMu();
    for (const yol of zemin.yollar.concat(zemin.patikalar || [])) {
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
    const yollar = [], lekeler = [], patikalar = [];
    game._zeminKatmani = { yollar, lekeler, patikalar };
    zeminKatmaniSil();
    const bolum = game.level || 1;
    const ulke = typeof yolculukUlkeKodu === "function" ? yolculukUlkeKodu() : "-";
    if (typeof yolculukRastgele === "function") {
      for (const leke of lekeleriKur(bolum, ulke)) lekeler.push(leke);
    }
    let acik = false;
    try { acik = typeof yolculukAcik === "function" && yolculukAcik(); } catch (e) { acik = false; }
    if (acik && typeof yolculukBaslangic === "function") {
      const d = game._yolculukDuzen;
      if (d && Array.isArray(d.zones) && d.arena) {
        const A = typeof YOLCULUK_AYAR !== "undefined" ? YOLCULUK_AYAR : { worldH: game.worldH || 1000 };
        let onceki = yolculukBaslangic();
        for (let i = 0; i < d.zones.length; i++) {
          const g = d.zones[i].gate;
          yollar.push({ noktalar: araliNoktalar(onceki, { x: g.x0 - 40, y: g.cy }, bolum, ulke, i * 2 + 1), gen: 64 });
          // Nehir şeridi atlanır; sonraki parça sağ kıyıdan başlar
          onceki = { x: g.x1 + 40, y: g.cy };
        }
        yollar.push({ noktalar: araliNoktalar(onceki, { x: d.arena.x0 - 20, y: A.worldH / 2 }, bolum, ulke, 999), gen: 64 });
      }
    } else if (typeof yolculukRastgele === "function") {
      klasikDonguKur(yollar, bolum, ulke);
    }
    patikalarEkle(yollar, patikalar);
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
    const z = game._zeminKatmani;
    const yollar = (z.yollar || []).concat(z.patikalar || []);
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
