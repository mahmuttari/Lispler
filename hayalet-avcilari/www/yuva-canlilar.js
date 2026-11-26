// Hayalet Avcıları — YUV1: hayalet yuvasının çevresindeki fareler ve yarasalar.
// Oyuncu yuvaya yaklaşınca (230 px) canlılar bir kez kaçar; oyuncu 520 px'den uzakta 20 sn kalınca geri gelir.
// Yalnız görsel ve yerel: çarpışma, hasar, ağ alanı ve denge değişmez; rastgelelik tohumludur (Math.random yok).
// Görseller: fare-kos / fare-bekle / yarasa animasyonları hazır olduğunda kullanılır; yoksa küçük kod çizimi.

const YC = { durumlar: new Map(), zaman: 0 };

function yuvaCanliAzHareket() {
  if (typeof aeAzHareket === "function") return aeAzHareket();
  if (typeof yolculukAzHareket === "function") return yolculukAzHareket();
  return false;
}

function yuvaCanliRnd(idx, n) {
  const bolum = (typeof game !== "undefined" && game && game.level) || 1;
  const ulke = typeof yolculukUlkeKodu === "function" ? yolculukUlkeKodu() : "-";
  return typeof yolculukRastgele === "function" ? yolculukRastgele(bolum, ulke, idx, n) : 0.5;
}

// Su ya da duvar içinde mi? (fare yerleşimi ve kaçış yolu için)
function yuvaCanliUygun(x, y) {
  if (typeof game === "undefined" || !game) return true;
  if (typeof engelCarpisir === "function" && engelCarpisir(game.walls, x, y, 3)) return false;
  if (typeof collidesWaters === "function" && collidesWaters(x, y, 3)) return false;
  return true;
}

// Bir yuvanın canlı durumunu kur (tembel): 3-5 fare çevrede, 2-3 yarasa ağız üstünde.
function yuvaCanliDurumKur(yv, idx) {
  const r = yv.r || 32;
  const ag = typeof yolculukYuvaAgzi === "function" ? yolculukYuvaAgzi(yv) : { x: yv.x, y: yv.y + r + 16 };
  const st = { yv, idx, critterlar: [], kacti: false, uzakSure: 0, puf: [] };
  const fareSayi = 3 + Math.floor(yuvaCanliRnd(idx, 1) * 3);
  for (let i = 0; i < fareSayi; i++) {
    let x = yv.x, y = yv.y;
    for (let t = 0; t < 14; t++) {
      const a = yuvaCanliRnd(idx, 10 + i * 17 + t) * Math.PI * 2;
      const R = r + 8 + t * 3 + yuvaCanliRnd(idx, 30 + i * 19 + t) * 10;
      x = yv.x + Math.cos(a) * R; y = yv.y + Math.sin(a) * R;
      if (yuvaCanliUygun(x, y)) break;
    }
    st.critterlar.push({
      tur: "fare", x, y, basX: x, basY: y, yon: yuvaCanliRnd(idx, 50 + i) < 0.5 ? -1 : 1,
      durum: "bekle", alfa: 1, faz: yuvaCanliRnd(idx, 60 + i) * Math.PI * 2,
      tt: 0, sure: 0, hiz: 0, bx: x, by: y, dirX: 0, dirY: 0, perpX: 0, perpY: 0,
    });
  }
  const yarasaSayi = 2 + Math.floor(yuvaCanliRnd(idx, 2) * 2);
  for (let i = 0; i < yarasaSayi; i++) {
    const x = ag.x + (yuvaCanliRnd(idx, 90 + i) - 0.5) * r * 0.7;
    const y = ag.y - 22 - yuvaCanliRnd(idx, 100 + i) * 16;
    st.critterlar.push({
      tur: "yarasa", x, y, basX: x, basY: y, yon: 1,
      durum: "bekle", alfa: 1, faz: yuvaCanliRnd(idx, 110 + i) * Math.PI * 2,
      tt: 0, sure: 1.2, hiz: 0, bx: x, by: y, dirX: 0, dirY: 0, olcek: 1,
    });
  }
  YC.durumlar.set(yv, st);
  return st;
}

function yuvaCanliDurum(yv, idx) {
  return YC.durumlar.get(yv) || yuvaCanliDurumKur(yv, idx || 0);
}

function yuvaCanlilariSifirla() { YC.durumlar.clear(); YC.zaman = 0; }

// Canlıları bir kez kaçır (oyuncu yaklaşması ya da yuvadan hayalet doğması).
function yuvaCanliKacir(st) {
  if (!st || st.kacti) return;
  st.kacti = true;
  const p = (typeof game !== "undefined" && game && game.player) || null;
  const az = yuvaCanliAzHareket();
  for (let i = 0; i < st.critterlar.length; i++) {
    const c = st.critterlar[i];
    c.tt = 0; c.alfa = 1; c.bx = c.x; c.by = c.y;
    if (az) { c.durum = "soluk"; c.sure = 0.4; continue; }
    if (c.tur === "fare") {
      const px = p ? p.x : c.x - 1, py = p ? p.y : c.y;
      let a = Math.atan2(c.y - py, c.x - px);
      a += (yuvaCanliRnd(st.idx, 500 + i) * 2 - 1) * (40 * Math.PI / 180);
      c.durum = "kac";
      c.dirX = Math.cos(a); c.dirY = Math.sin(a);
      c.perpX = -c.dirY; c.perpY = c.dirX;
      c.hiz = 260 + yuvaCanliRnd(st.idx, 600 + i) * 80;
      c.sure = 0.9 + yuvaCanliRnd(st.idx, 700 + i) * 0.5;
      c.yon = c.dirX < 0 ? -1 : 1;
      const np = 2 + Math.floor(yuvaCanliRnd(st.idx, 800 + i) * 2);
      for (let k = 0; k < np; k++) {
        st.puf.push({ x: c.x + (yuvaCanliRnd(st.idx, 900 + i * 7 + k) - 0.5) * 8, y: c.y + (yuvaCanliRnd(st.idx, 950 + i * 7 + k) - 0.5) * 6, bas: YC.zaman });
      }
    } else {
      const px = p ? p.x : c.x - 1, py = p ? p.y : c.y;
      let dx = c.x - px, dy = c.y - py;
      const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
      dy = Math.min(dy, -0.5); // yukarı ve oyuncudan uzağa
      const mm = Math.hypot(dx, dy) || 1; dx /= mm; dy /= mm;
      c.durum = "kac"; c.dirX = dx; c.dirY = dy;
      c.hiz = 200 + yuvaCanliRnd(st.idx, 1000 + i) * 60;
      c.sure = 1.2; c.yon = dx < 0 ? -1 : 1;
    }
  }
}

function yuvaCanlilariUrkut(yv) {
  if (typeof game === "undefined" || !game || !Array.isArray(game.yuvalar)) return;
  const idx = game.yuvalar.indexOf(yv);
  if (idx < 0) return;
  const st = YC.durumlar.get(yv);
  if (st) yuvaCanliKacir(st);
  else yuvaCanliKacir(yuvaCanliDurumKur(yv, idx)); // henüz kurulmamış: kur ve kaçır
}

function yuvaCanliDirilt(st) {
  st.kacti = false; st.uzakSure = 0; st.puf.length = 0;
  for (const c of st.critterlar) {
    c.x = c.basX; c.y = c.basY; c.alfa = 0; c.durum = "bekle";
    c.tt = 0; c.giriyor = true; c.girisKalan = 0.5; c.olcek = 1;
  }
}

function yuvaCanliGuncelle(st, dt, uzaklik, az, sayac) {
  if (st.puf.length) st.puf = st.puf.filter((f) => YC.zaman - f.bas < 0.3);
  if (st.kacti) {
    let hepsiYok = true;
    for (const c of st.critterlar) if (c.durum !== "yok") { hepsiYok = false; break; }
    if (hepsiYok) {
      if (uzaklik > 520) {
        st.uzakSure += dt;
        if (st.uzakSure >= 20) yuvaCanliDirilt(st);
      } else st.uzakSure = 0;
    }
  }
  for (const c of st.critterlar) {
    if (sayac.n >= 40) break;
    sayac.n++;
    if (c.giriyor) {
      c.girisKalan -= dt;
      c.alfa = Math.max(0, Math.min(1, 1 - c.girisKalan / 0.5));
      if (c.girisKalan <= 0) { c.giriyor = false; c.alfa = 1; }
    }
    if (c.durum === "bekle") {
      if (c.tur === "yarasa" && !az) c.y = c.basY + Math.sin(YC.zaman * 3 + c.faz) * 2;
    } else if (c.durum === "kac") {
      c.tt += dt;
      if (c.tur === "fare") {
        const nx = c.bx + c.dirX * c.hiz * c.tt + c.perpX * Math.sin(c.tt * 10 + c.faz) * 6;
        const ny = c.by + c.dirY * c.hiz * c.tt + c.perpY * Math.sin(c.tt * 10 + c.faz) * 6;
        if (!yuvaCanliUygun(nx, ny)) {
          c.durum = "soluk"; c.sure = 0.25; c.tt = 0; // duvar/su: dur ve erken sol
        } else {
          c.x = nx; c.y = ny;
          if (c.tt > c.sure) { c.durum = "soluk"; c.sure = 0.25; c.tt = 0; }
        }
      } else {
        c.x = c.bx + c.dirX * c.hiz * c.tt;
        c.y = c.by + c.dirY * c.hiz * c.tt;
        c.olcek = 1 + 0.2 * Math.min(1, c.tt / 1.2);
        c.alfa = Math.max(0, 1 - c.tt / 1.2);
        if (c.alfa <= 0) c.durum = "yok";
      }
    } else if (c.durum === "soluk") {
      c.tt += dt;
      c.alfa = Math.max(0, 1 - c.tt / c.sure);
      if (c.alfa <= 0) c.durum = "yok";
    }
  }
}

function yuvaCanlilariGuncelle(dt) {
  if (typeof game === "undefined" || !game || !Array.isArray(game.yuvalar) || !game.yuvalar.length) return;
  dt = Math.max(0, Math.min(0.05, dt || 0));
  YC.zaman += dt;
  const cam = game.camera || { x: 0, y: 0 }, W = game.W || 0, H = game.H || 0;
  const p = game.player, canli = p && !p.dead;
  const az = yuvaCanliAzHareket();
  const sayac = { n: 0 };
  game.yuvalar.forEach((yv, idx) => {
    let st = YC.durumlar.get(yv);
    const ekranda = yv.x > cam.x - 100 && yv.x < cam.x + W + 100 && yv.y > cam.y - 100 && yv.y < cam.y + H + 100;
    const uzaklik = canli ? Math.hypot(yv.x - p.x, yv.y - p.y) : Infinity;
    if (!st) {
      if (!ekranda && !(canli && uzaklik < 600)) return;
      st = yuvaCanliDurumKur(yv, idx);
    }
    if (!st.kacti && canli && uzaklik <= 230) yuvaCanliKacir(st);
    yuvaCanliGuncelle(st, dt, uzaklik, az, sayac);
  });
}

// ---- Çizim ----
function yuvaCanliFareCiz(ctx, c, az) {
  const kos = c.durum === "kac" && !az;
  ctx.save();
  ctx.globalAlpha *= c.alfa;
  ctx.translate(c.x, c.y);
  if (c.yon < 0) ctx.scale(-1, 1);
  let resimli = false;
  if (kos && typeof animHazir === "function" && typeof animCiz === "function" && animHazir("fare-kos") >= 3 && typeof animDongu === "function") {
    const k = animDongu("fare-kos", YC.zaman + c.faz, 12);
    resimli = animCiz(ctx, "fare-kos", k, -11, -9, 22, 16);
  } else if (!kos && typeof animHazir === "function" && typeof animCiz === "function" && animHazir("fare-bekle") >= 3 && typeof animDongu === "function") {
    const k = animDongu("fare-bekle", YC.zaman + c.faz, 3);
    resimli = animCiz(ctx, "fare-bekle", k, -11, -9, 22, 16);
  }
  if (!resimli) {
    // Küçük kod yedeği: gri-kahve gövde, koyu baş, pembe ince kuyruk, iki kulak.
    ctx.strokeStyle = "#e39aa5"; ctx.lineWidth = 1.2; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-6, 1); ctx.lineTo(-12, 3); ctx.stroke();
    ctx.fillStyle = "#7a5a43";
    ctx.beginPath(); ctx.ellipse(0, 0, 7, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#3f2c20";
    ctx.beginPath(); ctx.ellipse(5, -1, 3, 2.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(4, -4, 1.6, 0, Math.PI * 2); ctx.arc(7, -4, 1.6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function yuvaCanliYarasaCiz(ctx, c) {
  ctx.save();
  ctx.globalAlpha *= c.alfa;
  ctx.translate(c.x, c.y);
  if (c.yon < 0) ctx.scale(-1, 1);
  if (c.olcek && c.olcek !== 1) ctx.scale(c.olcek, c.olcek);
  let resimli = false;
  if (typeof animHazir === "function" && typeof animCiz === "function" && typeof animDongu === "function" && animHazir("yarasa") >= 3) {
    const k = animDongu("yarasa", YC.zaman + c.faz, 10);
    resimli = animCiz(ctx, "yarasa", k, -17, -7, 34, 14);
  } else if (typeof gorsel === "function" && typeof gorselKutuya === "function" && gorsel("yarasa")) {
    resimli = gorselKutuya(ctx, "yarasa", -17, -7, 34, 14);
  }
  if (!resimli) {
    ctx.fillStyle = "#241a2e";
    ctx.beginPath(); ctx.ellipse(0, 0, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-11, -5); ctx.lineTo(-12, 2); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(11, -5); ctx.lineTo(12, 2); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function yuvaCanlilariCiz(ctx, kip) {
  if (typeof game === "undefined" || !game || !Array.isArray(game.yuvalar) || !game.yuvalar.length) return;
  const cam = game.camera || { x: 0, y: 0 }, W = game.W || 0, H = game.H || 0;
  const az = yuvaCanliAzHareket();
  for (const st of YC.durumlar.values()) {
    const yv = st.yv;
    if (!yv || (yv.x < cam.x - 120 || yv.x > cam.x + W + 120 || yv.y < cam.y - 120 || yv.y > cam.y + H + 120)) continue;
    if (kip === "arka") {
      for (const f of st.puf) {
        const yas = YC.zaman - f.bas;
        if (yas < 0 || yas > 0.3) continue;
        ctx.save(); ctx.globalAlpha *= Math.max(0, 1 - yas / 0.3) * 0.6; ctx.fillStyle = "#b9b3a8";
        ctx.beginPath(); ctx.arc(f.x, f.y, 3 + yas * 10, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      for (const c of st.critterlar) if (c.tur === "fare" && c.durum !== "yok" && c.alfa > 0.02) yuvaCanliFareCiz(ctx, c, az);
    } else if (kip === "on") {
      for (const c of st.critterlar) if (c.tur === "yarasa" && c.durum !== "yok" && c.alfa > 0.02) yuvaCanliYarasaCiz(ctx, c);
    }
  }
}
