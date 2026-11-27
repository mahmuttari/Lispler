// Hayalet Avcıları — YUV2: hayalet yuvasının çevresindeki fareler ve yarasalar.
// Oyuncu ekrandaki yuvaya yaklaşınca (300 px) canlılar kaçar; yuva ekrandan 8 sn uzakta kalınca geri gelir.
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

// Yuvanın merkezi kameranın gördüğü dikdörtgenin içinde mi? (pay: dışına taşan tolerans)
function yuvaCanliEkranda(yv, pay) {
  if (typeof game === "undefined" || !game || !game.camera || !yv) return false;
  const cam = game.camera, W = game.W || 0, H = game.H || 0;
  return yv.x >= cam.x - pay && yv.x <= cam.x + W + pay && yv.y >= cam.y - pay && yv.y <= cam.y + H + pay;
}

// Su ya da duvar içinde mi? (fare yerleşimi ve kaçış yolu için)
function yuvaCanliUygun(x, y) {
  if (typeof game === "undefined" || !game) return true;
  if (typeof engelCarpisir === "function" && engelCarpisir(game.walls, x, y, 3)) return false;
  if (typeof collidesWaters === "function" && collidesWaters(x, y, 3)) return false;
  return true;
}

// Bir yuvanın canlı durumunu kur (tembel): 3-6 fare çevrede, 2-4 yarasa ağız üstünde.
function yuvaCanliDurumKur(yv, idx) {
  const r = yv.r || 32;
  const ag = typeof yolculukYuvaAgzi === "function" ? yolculukYuvaAgzi(yv) : { x: yv.x, y: yv.y + r + 16 };
  const st = { yv, idx, critterlar: [], kacti: false, uzakSure: 0, puf: [] };
  const fareSayi = 3 + Math.floor(yuvaCanliRnd(idx, 1) * 4);
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
  const yarasaSayi = 2 + Math.floor(yuvaCanliRnd(idx, 2) * 3);
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
  const D = Math.PI / 180;
  for (let i = 0; i < st.critterlar.length; i++) {
    const c = st.critterlar[i];
    c.tt = 0; c.alfa = 1; c.bx = c.x; c.by = c.y;
    c.donus = 0; c.olcek = 1;
    const px = p ? p.x : c.x - 1, py = p ? p.y : c.y;
    if (az) {
      // Hareketi azalt: düz çizgi, oyuncudan uzağa, ±20°; gecikme/zigzag/kanat yok.
      const a = Math.atan2(c.y - py, c.x - px) + (yuvaCanliRnd(st.idx, 2000 + i) * 2 - 1) * (20 * D);
      c.red = true; c.gec = 0; c.durum = "kac";
      c.a0 = a; c.dirX = Math.cos(a); c.dirY = Math.sin(a);
      c.hiz = 140; c.sure = 0.8; c.yon = c.dirX < 0 ? -1 : 1;
      continue;
    }
    c.red = false;
    c.faz2 = yuvaCanliRnd(st.idx, 2500 + i) * Math.PI * 2;
    c.gec = yuvaCanliRnd(st.idx, 2000 + i) * 0.3;
    const a0 = Math.atan2(c.y - py, c.x - px) + (yuvaCanliRnd(st.idx, 500 + i) * 2 - 1) * (70 * D);
    c.a0 = a0;
    if (c.tur === "fare") {
      c.durum = "kac";
      c.dirX = Math.cos(a0); c.dirY = Math.sin(a0);
      c.perpX = -c.dirY; c.perpY = c.dirX;
      c.hiz = 170 + yuvaCanliRnd(st.idx, 600 + i) * 160;
      c.sure = 1.6 + yuvaCanliRnd(st.idx, 700 + i) * 0.8;
      c.f1 = 7 + yuvaCanliRnd(st.idx, 1100 + i) * 4;
      c.f2 = 13 + yuvaCanliRnd(st.idx, 1200 + i) * 6;
      c.donusYon = yuvaCanliRnd(st.idx, 1300 + i) < 0.5 ? -1 : 1;
      c.yon = c.dirX < 0 ? -1 : 1;
      const np = 2 + Math.floor(yuvaCanliRnd(st.idx, 800 + i) * 2);
      for (let k = 0; k < np; k++) {
        st.puf.push({ x: c.x + (yuvaCanliRnd(st.idx, 900 + i * 7 + k) - 0.5) * 8, y: c.y + (yuvaCanliRnd(st.idx, 950 + i * 7 + k) - 0.5) * 6, bas: YC.zaman });
      }
    } else {
      let dx = Math.cos(a0), dy = Math.sin(a0);
      dy = Math.min(dy, -0.35); // yukarı ve oyuncudan uzağa
      const mm = Math.hypot(dx, dy) || 1; dx /= mm; dy /= mm;
      c.durum = "kac"; c.dirX = dx; c.dirY = dy;
      c.perpX = -dy; c.perpY = dx;
      c.hiz = 150 + yuvaCanliRnd(st.idx, 1000 + i) * 110;
      c.sure = 1.8 + yuvaCanliRnd(st.idx, 1400 + i) * 0.8;
      c.yanaAmp = 14 + yuvaCanliRnd(st.idx, 1500 + i) * 8;
      c.yanaF = 9 + yuvaCanliRnd(st.idx, 1600 + i) * 5;
      c.yon = dx < 0 ? -1 : 1;
    }
  }
  // SES1: kaçış sesi (fare/yarasa varsa), kaçış başına bir kez
  if (typeof audio !== "undefined" && audio.canliSes) {
    const yv = st.yv || { x: 0, y: 0 };
    if (st.critterlar.some((c) => c.tur === "fare")) audio.canliSes("fare-kac", yv.x, yv.y);
    if (st.critterlar.some((c) => c.tur === "yarasa")) audio.canliSes("yarasa-kac", yv.x, yv.y, 0.45);
  }
}

function yuvaCanlilariUrkut(yv) {
  if (typeof game === "undefined" || !game || !Array.isArray(game.yuvalar)) return;
  const idx = game.yuvalar.indexOf(yv);
  if (idx < 0) return;
  if (!yuvaCanliEkranda(yv, 0)) return; // ekran dışındaki yuva boşuna kaçmasın; oyuncu gelince görülsün
  const st = YC.durumlar.get(yv);
  if (st) yuvaCanliKacir(st);
  else yuvaCanliKacir(yuvaCanliDurumKur(yv, idx)); // henüz kurulmamış: kur ve kaçır
}

function yuvaCanliDirilt(st) {
  st.kacti = false; st.uzakSure = 0; st.puf.length = 0;
  for (const c of st.critterlar) {
    c.x = c.basX; c.y = c.basY; c.alfa = 0; c.durum = "bekle";
    c.tt = 0; c.giriyor = true; c.girisKalan = 0.5; c.olcek = 1;
    c.red = false; c.gec = 0; c.donus = 0;
  }
}

function yuvaCanliGuncelle(st, dt, uzaklik, az, sayac) {
  if (st.puf.length) st.puf = st.puf.filter((f) => YC.zaman - f.bas < 0.3);
  // Dirilme: bütün canlılar "yok" olduktan sonra yuva ekrandan 8 sn uzakta kalınca geri gelir.
  const hepsiYok = !st.critterlar.some((c) => c.durum !== "yok");
  if (st.kacti && hepsiYok) {
    if (!yuvaCanliEkranda(st.yv, 100)) {
      st.uzakSure += dt;
      if (st.uzakSure >= 8) yuvaCanliDirilt(st);
    } else st.uzakSure = 0;
  } else st.uzakSure = 0;
  // Ekrandan uzakta ve hareket eden canlı yoksa canlı canlı güncellenmez (dirilme sayacı yukarıda işledi).
  const ekranda = yuvaCanliEkranda(st.yv, 300);
  const hareketVar = st.critterlar.some((c) => c.durum === "kac" || c.durum === "soluk");
  if (!ekranda && !hareketVar) return;
  for (const c of st.critterlar) {
    if (c.durum === "yok") continue;
    if (sayac.n >= 80) break;
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
      if (c.red) {
        // Hareketi azalt: düz çizgi, yavaş, sönerek.
        c.x += c.dirX * c.hiz * dt; c.y += c.dirY * c.hiz * dt;
        c.alfa = Math.max(0, 1 - c.tt / c.sure);
        if (c.tt >= c.sure) { c.durum = "yok"; c.alfa = 0; }
        continue;
      }
      if (c.tt < c.gec) continue; // gecikmeli başlangıç: kıpırdamadan bekle
      if (c.tur === "fare") {
        const patlama = 0.75 + 0.25 * Math.sin(c.tt * 9 + c.faz);
        let a = c.a0 + 0.9 * Math.sin(c.tt * c.f1 + c.faz) + 0.5 * Math.sin(c.tt * c.f2 + c.faz2);
        let hiz = c.hiz * patlama;
        let nx = c.x + Math.cos(a) * hiz * dt, ny = c.y + Math.sin(a) * hiz * dt;
        // Duvar/su: yönü ±90° çevirip yeniden dene (en çok 3 kez), olmazsa sön.
        while (!yuvaCanliUygun(nx, ny) && c.donus < 3) {
          c.a0 += c.donusYon * Math.PI / 2; c.donus++;
          a = c.a0 + 0.9 * Math.sin(c.tt * c.f1 + c.faz) + 0.5 * Math.sin(c.tt * c.f2 + c.faz2);
          hiz = c.hiz * patlama;
          nx = c.x + Math.cos(a) * hiz * dt; ny = c.y + Math.sin(a) * hiz * dt;
        }
        if (!yuvaCanliUygun(nx, ny)) {
          c.durum = "soluk"; c.sure = 0.35; c.tt = 0;
        } else {
          c.x = nx; c.y = ny; c.yon = Math.cos(a) < 0 ? -1 : 1;
          if (c.tt >= c.sure) { c.durum = "soluk"; c.sure = 0.35; c.tt = 0; }
        }
      } else {
        const t = c.tt;
        const yana = c.yanaAmp * Math.sin(t * c.yanaF + c.faz);
        c.x = c.bx + c.dirX * c.hiz * t + c.perpX * yana;
        c.y = c.by + c.dirY * c.hiz * t + c.perpY * yana + 6 * Math.sin(t * 17 + c.faz);
        c.olcek = 1 + 0.35 * Math.min(1, t / c.sure);
        c.yon = c.dirX < 0 ? -1 : 1;
        if (t >= c.sure) { c.durum = "yok"; c.alfa = 0; }
        else if (t > c.sure - 0.5) c.alfa = Math.max(0, (c.sure - t) / 0.5);
        else c.alfa = 1;
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
    if (!st.kacti && canli && yuvaCanliEkranda(yv, -24) && uzaklik <= 300) yuvaCanliKacir(st);
    // SES1: oturan farelerin cik sesi; oyuncu 400 px içindeyken, yuvaya tohumlu 6-12 sn'de bir
    if (canli && !st.kacti && uzaklik <= 400 && st.critterlar.some((c) => c.tur === "fare" && c.durum === "bekle")) {
      if (typeof audio !== "undefined" && audio.canliSes) {
        const simdi = performance.now();
        if (st.fareCikSonra == null) st.fareCikSonra = simdi + (6 + yuvaCanliRnd(idx, 4100) * 6) * 1000;
        else if (simdi >= st.fareCikSonra) {
          audio.canliSes("fare-cik", yv.x, yv.y, 0.25);
          st.fareCikSonra = simdi + (6 + yuvaCanliRnd(idx, 4101) * 6) * 1000;
        }
      }
    } else if (uzaklik > 400) st.fareCikSonra = null;
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
  if (c.durum === "kac" && !c.red && !(c.tt < (c.gec || 0))) ctx.scale(1.3, 1.3);
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
  if (c.durum === "kac" && !c.red) ctx.scale(1.3, 1.3);
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
