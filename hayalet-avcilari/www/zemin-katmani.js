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

  // ---------- ZEM1B: taban süsleri ve temas gölgeleri ----------
  // Çevreye göre süs ailesi (Z02/Z03 resimleri; yoksa dere-sus-* yedeği)
  function susAilesi() {
    try {
      if (typeof game !== "undefined" && game && game.dunyaTuru) {
        const u = typeof turUlkesi === "function" ? turUlkesi() : null;
        const a = u && u.aile;
        if (a === "GDA" || a === "KA" || a === "LA" || a === "K") return ["sus-cimen", "sus-cicek", "sus-cali"];
        if (a === "KP" || a === "SH" || a === "SV" || a === "GA") return ["sus-cakil", "sus-kaya", "sus-cimen-kuru"];
        if (a === "KS" || a === "DA") return ["sus-kaya", "sus-yosun", "sus-cicek"];
      }
      const th = typeof getTheme === "function" ? getTheme() : null;
      if (!th || typeof LEVEL_THEMES === "undefined") return ["sus-cimen", "sus-kaya"];
      const i = LEVEL_THEMES.indexOf(th);
      if (i === 0) return ["sus-kaya", "sus-yosun", "sus-mantar"];
      if (i === 1) return ["sus-cimen", "sus-cicek", "sus-mantar", "sus-cali"];
      if (i === 2) return ["sus-cakil", "sus-kaya"];
      if (i === 3) return ["sus-kaya-buz"];
      if (i === 4) return ["sus-kaya", "sus-cakil"];
      if (i === 5) return ["sus-cakil"];
    } catch (e) { /* varsayılan */ }
    return ["sus-cimen", "sus-kaya"];
  }

  const SUS_YEDEK = ["dere-sus-1", "dere-sus-2", "dere-sus-3", "dere-sus-4", "dere-sus-5", "dere-sus-6"];

  // Süs resmi: önce Z02/Z03 anahtarı, yoksa dere-sus-* yedeği. Kuru çimen renklendirilmiş kopya.
  function susResmi(ad, sira) {
    try {
      if (ad === "sus-cimen-kuru") {
        const k = (typeof gorsel === "function" && gorsel("sus-cimen")) ? "sus-cimen" : SUS_YEDEK[sira % SUS_YEDEK.length];
        return (typeof gorselRenkli === "function" ? gorselRenkli(k, "#b28a2a") : null) || (typeof gorsel === "function" ? gorsel(k) : null);
      }
      if (ad === "sus-kaya-buz") { // Buz teması: kayalar açık maviye boyanır
        const k = (typeof gorsel === "function" && gorsel("sus-kaya")) ? "sus-kaya" : SUS_YEDEK[sira % SUS_YEDEK.length];
        return (typeof gorselRenkli === "function" ? gorselRenkli(k, "#bae6fd") : null) || (typeof gorsel === "function" ? gorsel(k) : null);
      }
      const im = typeof gorsel === "function" ? gorsel(ad) : null;
      if (im) return im;
      return typeof gorsel === "function" ? gorsel(SUS_YEDEK[sira % SUS_YEDEK.length]) : null;
    } catch (e) { return null; }
  }

  // Yumuşak temas gölgesi (dünya koordinatında parçaya bir kez çizilir)
  function golgeCiz(c, x, y, rx, ry) {
    if (!(rx > 0 && ry > 0)) return;
    c.save();
    c.translate(x, y); c.scale(rx, ry);
    let g = null;
    try {
      g = c.createRadialGradient(0, 0, 0.15, 0, 0, 1);
      g.addColorStop(0, "rgba(0,0,0,0.22)");
      g.addColorStop(0.65, "rgba(0,0,0,0.12)");
      g.addColorStop(1, "rgba(0,0,0,0)");
    } catch (e) { g = null; }
    c.fillStyle = g || "rgba(0,0,0,0.22)";
    c.beginPath(); c.arc(0, 0, 1, 0, Math.PI * 2); c.fill();
    c.restore();
  }

  // Resim yoksa kısa çimen tutamı (paletin çim rengi)
  function tutamCiz(c, x, y, boy, renk) {
    c.save();
    c.strokeStyle = renk || "#3f7d3f";
    c.lineWidth = Math.max(1, boy * 0.09);
    c.lineCap = "round";
    const n = 3 + Math.floor((boy * 7) % 3);
    for (let i = 0; i < n; i++) {
      const sap = ((i / Math.max(1, n - 1)) - 0.5) * boy * 0.55;
      c.beginPath(); c.moveTo(x + sap * 0.25, y);
      c.quadraticCurveTo(x + sap * 0.7, y - boy * 0.55, x + sap, y - boy);
      c.stroke();
    }
    c.restore();
  }

  function susCiz(c, s) {
    const im = susResmi(s.ad, s.idx);
    if (im && im.width) {
      const b = s.boy;
      try { typeof resmiKutuyaCiz === "function" ? resmiKutuyaCiz(c, im, s.x - b / 2, s.y - b, b, b, true) : c.drawImage(im, s.x - b / 2, s.y - b, b, b); }
      catch (e) { /* çizim hatası oyunu durdurmasın */ }
      return;
    }
    let renk = "#3f7d3f";
    try { const th = typeof getTheme === "function" ? getTheme() : null; if (th && th.floor) renk = "#3f7d3f"; } catch (e) { /* varsayılan */ }
    if (s.ad === "sus-cimen-kuru") renk = "#9a7b32";
    tutamCiz(c, s.x, s.y, s.boy, renk);
  }

  // Kısa patikada dokulu yol yerine sus-basamak taşları (yalnız resim varsa)
  function basamakCiz(c, yol) {
    const im = typeof gorsel === "function" ? gorsel("sus-basamak") : null;
    if (!im) return false;
    const q = yol.noktalar;
    let birikim = 0, hedef = 22;
    for (let i = 0; i < q.length - 1; i++) {
      const L = Math.hypot(q[i + 1].x - q[i].x, q[i + 1].y - q[i].y);
      let d = hedef - birikim;
      while (d <= L) {
        const t = d / L, x = q[i].x + (q[i + 1].x - q[i].x) * t, y = q[i].y + (q[i + 1].y - q[i].y) * t;
        try { typeof resmiKutuyaCiz === "function" ? resmiKutuyaCiz(c, im, x - 13, y - 13, 26, 26, true) : c.drawImage(im, x - 13, y - 13, 26, 26); }
        catch (e) { return true; }
        d += hedef;
      }
      birikim += L;
    }
    return true;
  }

  // Köprü ağzına 60 px'den yakın süs konmaz
  function kopruYakin(x, y) {
    if (typeof game === "undefined" || !game || !Array.isArray(game.kopruler)) return false;
    for (const k of game.kopruler) {
      if (!k) continue;
      const cx = (k.a + k.b) / 2, hw = Math.abs(k.b - k.a) / 2;
      if (Math.abs(x - cx) < hw + 60 && Math.abs(y - k.c) < 60) return true;
    }
    return false;
  }

  // Süs noktası uygun mu: suda, yolda, duvarda ya da dünya dışında olmasın
  function susUygun(x, y) {
    const W = (typeof game !== "undefined" && game && game.worldW) || 0;
    const H = (typeof game !== "undefined" && game && game.worldH) || 0;
    if (W && (x < 8 || x > W - 8 || y < 8 || y > H - 8)) return false;
    try { if (typeof collidesWaters === "function" && collidesWaters(x, y, 0)) return false; } catch (e) { /* yok */ }
    try { if (typeof collidesWalls === "function" && collidesWalls(x, y, 0)) return false; } catch (e) { /* yok */ }
    try { if (zeminKatmaniYolMu(x, y)) return false; } catch (e) { /* yok */ }
    if (kopruYakin(x, y)) return false;
    return true;
  }

  function susTohum(bolum, ulke, sira, n) {
    return typeof yolculukRastgele === "function" ? yolculukRastgele(bolum, ulke, sira, n) : 0.5;
  }

  // Bir engel/prop çevresine 2-10 süs: çevre uzunluğuna göre, çarpışma kenarının 0-14 px dışına
  function cevreSusEkle(zemin, bolum, ulke, x0, y0, w, h, aile, sira0) {
    const perim = 2 * (w + h);
    const n = Math.max(2, Math.min(10, Math.round(perim / 80)));
    let eklenen = 0;
    for (let i = 0; i < n; i++) {
      let tamam = false;
      for (let t = 0; t < 12 && !tamam; t++) {
        const seed = sira0 + i * 13 + t;
        const kenar = Math.floor(susTohum(bolum, ulke, seed, 1) * 4);
        const u = susTohum(bolum, ulke, seed, 2);
        const dis = susTohum(bolum, ulke, seed, 3) * 14;
        let x, y;
        if (kenar === 0) { x = x0 + u * w; y = y0 - dis; }
        else if (kenar === 1) { x = x0 + w + dis; y = y0 + u * h; }
        else if (kenar === 2) { x = x0 + u * w; y = y0 + h + dis; }
        else { x = x0 - dis; y = y0 + u * h; }
        if (!susUygun(x, y)) continue;
        const ad = aile[Math.floor(susTohum(bolum, ulke, seed, 4) * aile.length) % aile.length];
        const boy = 18 + susTohum(bolum, ulke, seed, 5) * 28;
        zemin.suslar.push({ x, y, boy, ad, idx: Math.floor(susTohum(bolum, ulke, seed, 6) * 6) });
        eklenen++; tamam = true;
      }
    }
    return eklenen;
  }

  // Haritadaki bütün taban süslerini ve gölgeleri tohumlu kur (parça önbelleğinde çizilir)
  function suslariKur(zemin, bolum, ulke) {
    if (!zemin || typeof game === "undefined" || !game) return;
    zemin.suslar = zemin.suslar || [];
    zemin.golgeler = zemin.golgeler || [];
    const aile = susAilesi();
    let sira = 0;
    const W = game.worldW || 0, H = game.worldH || 0;
    // 1) Engeller: duvar, obje1, obje2 (sınır ve yuva duvarları hariç)
    for (const o of (game.walls || [])) {
      if (!o || o.yuva) continue;
      if (o.tur !== "duvar" && o.tur !== "obje1" && o.tur !== "obje2") continue;
      zemin.golgeler.push({ x: o.x + o.w / 2, y: o.y + o.h / 2 + 4, rx: o.w * 0.525, ry: Math.max(6, o.h * 0.22) });
      cevreSusEkle(zemin, bolum, ulke, o.x, o.y, o.w, o.h, aile, 10000 + (sira += 37));
    }
    // 2) Yolculuk donatıları (x,y merkez)
    for (const p of (game._yolculukDonatilar || [])) {
      if (!p || !(p.w > 0) || !(p.h > 0)) continue;
      const px = p.x - p.w / 2, py = p.y - p.h / 2;
      zemin.golgeler.push({ x: p.x, y: p.y + 4, rx: p.w * 0.525, ry: Math.max(6, p.h * 0.22) });
      cevreSusEkle(zemin, bolum, ulke, px, py, p.w, p.h, aile, 20000 + (sira += 37));
    }
    // 3) Hayalet yuvaları: yalnız temas gölgesi
    for (const yv of (game.yuvalar || [])) {
      if (!yv) continue;
      const r = yv.r || 30;
      zemin.golgeler.push({ x: yv.x, y: yv.y + 4, rx: r * 1.05, ry: Math.max(6, r * 0.5) });
    }
    // 4) Göl ve nehir kıyıları: her 50-70 px'de kaya/çimen (köprü ağzı ve su içi hariç)
    const kiysiAile = ["sus-kaya", "sus-cimen"];
    let ky = 0;
    for (const o of (game.waters || [])) {
      if (!o || !(o.w > 0) || !(o.h > 0)) continue;
      const adim = 50 + susTohum(bolum, ulke, 30000 + ky, 1) * 20;
      ky += 11;
      const koy = (x, y) => {
        if (!susUygun(x, y)) return;
        const ad = kiysiAile[Math.floor(susTohum(bolum, ulke, 31000 + ky, x + y) * 2) % 2];
        const boy = 18 + susTohum(bolum, ulke, 32000 + ky, x - y) * 16;
        zemin.suslar.push({ x, y, boy, ad, idx: Math.floor(susTohum(bolum, ulke, 33000 + ky, x * 0.5 + y) * 6) });
      };
      for (let x = o.x + 12; x <= o.x + o.w - 12; x += adim) { koy(x, o.y - 6); koy(x, o.y + o.h + 6); }
      for (let y = o.y + 12; y <= o.y + o.h - 12; y += adim) { koy(o.x - 6, y); koy(o.x + o.w + 6, y); }
    }
    // 5) Yol kenarları: her 70-110 px'de çimen tutamı/çakıl (iki yan)
    const kenarAile = aile.indexOf("sus-cakil") >= 0 ? ["sus-cakil", "sus-cimen"] : ["sus-cimen", "sus-cakil"];
    let py2 = 0;
    for (const yol of (zemin.yollar || []).concat(zemin.patikalar || [])) {
      const q = yol && yol.noktalar;
      if (!Array.isArray(q) || q.length < 2) continue;
      let birikim = 0, hedef = 70 + susTohum(bolum, ulke, 40000 + py2, 1) * 40;
      py2 += 7;
      for (let i = 0; i < q.length - 1; i++) {
        const ax = q[i].x, ay = q[i].y, bx = q[i + 1].x, by = q[i + 1].y;
        const L = Math.hypot(bx - ax, by - ay);
        if (L < 1) continue;
        const nx = -(by - ay) / L, ny = (bx - ax) / L, yari = (yol.gen || 64) / 2;
        let d = hedef - birikim;
        while (d <= L) {
          const t = d / L, x = ax + (bx - ax) * t, y = ay + (by - ay) * t;
          for (const yon of [-1, 1]) {
            const dis = yari + 6 + susTohum(bolum, ulke, 41000 + py2, Math.round(d) + (yon > 0 ? 1 : 2)) * 10;
            const sx = x + nx * dis * yon, sy = y + ny * dis * yon;
            if (!susUygun(sx, sy)) continue;
            const ad = kenarAile[Math.floor(susTohum(bolum, ulke, 42000 + py2, Math.round(d) + yon) * 2) % 2];
            const boy = 18 + susTohum(bolum, ulke, 43000 + py2, Math.round(d) - yon) * 12;
            zemin.suslar.push({ x: sx, y: sy, boy, ad, idx: Math.floor(susTohum(bolum, ulke, 44000 + py2, Math.round(d)) * 6) });
          }
          d += hedef;
          hedef = 70 + susTohum(bolum, ulke, 45000 + py2 + Math.round(d), 1) * 40;
        }
        birikim += L;
      }
    }
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
    let patikaSira = 0;
    for (const yol of zemin.yollar.concat(zemin.patikalar || [])) {
      if (!yol || !Array.isArray(yol.noktalar) || yol.noktalar.length < 2) continue;
      if (!yolParcaKesiyor(yol, ox, oy, PARCA)) continue;
      if (yol.patika && patikaSira < 3) {
        patikaSira++;
        if (basamakCiz(c, yol)) continue; // sus-basamak varsa patika taşlarla döşenir
      } else if (yol.patika) patikaSira++;
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
    // ZEM1B: temas gölgeleri ve taban süsleri (yolların üstüne; parça başına bir kez)
    for (const g of (zemin.golgeler || [])) {
      if (!g) continue;
      const r = Math.max(g.rx, g.ry);
      if (g.x + r < ox || g.x - r > ox + PARCA || g.y + r < oy || g.y - r > oy + PARCA) continue;
      golgeCiz(c, g.x, g.y, g.rx, g.ry);
    }
    for (const s of (zemin.suslar || [])) {
      if (!s) continue;
      const b = s.boy;
      if (s.x + b < ox || s.x - b > ox + PARCA || s.y + b < oy || s.y - b > oy + PARCA) continue;
      susCiz(c, s);
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
    // ZEM1B: taban süsleri/gölgeler yollar kurulduktan sonra tohumlanır (yol kontrolü hazır)
    suslariKur(game._zeminKatmani, bolum, ulke);
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
