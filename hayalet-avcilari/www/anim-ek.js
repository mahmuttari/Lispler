// Hayalet Avcıları 3.20.0 — ek animasyonlar (anim-ek.js).
// Amaç: oyundaki her eylem görsel bir karşılık bulsun (ek cephane silahları, karakter güçleri, mermiler, olaylar).
// Kural: yalnız GÖRÜNTÜ. Hasar, hız, çarpışma ve çevrimiçi eşitleme değişmez; burada hiçbir ağ alanı yoktur.
// ChatGPT kareleri geldikçe aynı adlarla (an-<ad>-<n>) otomatik kullanılır; kare yoksa kod çizimi çalışır.
// Yardımcılar gorsel.js (animHazir/animDongu/animBirKez/animCiz/animGovdeCiz) ve anim.js (animEfektEkle) ile paylaşılır.

const AE = {
  efektler: [],   // kod çizimi efektleri (en çok 40)
  ekran: [],      // parlama, vinyet, bölüm yazısı
  sars: { bas: 0, sure: 0, guc: 0 },
};

function aeAzHareket() {
  return typeof animAzHareket === "function" ? animAzHareket()
    : !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

// Deterministik sahte rastgele (kare başına aynı değer): yıldırımın titremesi 50 ms'de bir yenilenir
function aeRast(seed) { const x = Math.sin(seed * 127.1 + 0.7) * 43758.5453; return x - Math.floor(x); }

function aeEkle(tur, x, y, secenek = {}) {
  if (AE.efektler.length >= 40) AE.efektler.shift(); // en eskiyi düşür (performans)
  AE.efektler.push({
    tur, x, y, bas: secenek.now ?? performance.now(), sure: secenek.sure || 0.5,
    renk: secenek.renk || "255, 255, 255", boyut: secenek.boyut || 40,
    hedefX: secenek.hedefX, hedefY: secenek.hedefY, metin: secenek.metin, ek: secenek.ek,
  });
  return AE.efektler[AE.efektler.length - 1];
}

// ---- Ekran efektleri: sarsıntı, parlama, vinyet, bölüm yazısı ----
function aeSarsinti(sure = 0.25, guc = 6) {
  if (aeAzHareket()) return;
  AE.sars = { bas: performance.now(), sure: Math.max(0.05, sure) * 1000, guc };
}
function aeSarsintiOfset(now = performance.now()) {
  if (aeAzHareket()) return { x: 0, y: 0 };
  const k = (now - AE.sars.bas) / AE.sars.sure;
  if (!(k >= 0 && k < 1)) return { x: 0, y: 0 };
  const g = AE.sars.guc * (1 - k);
  return { x: Math.sin(now / 17.0) * g, y: Math.cos(now / 13.0) * g };
}
function aeParlama(sure = 0.25, renk = "255, 255, 255") {
  if (aeAzHareket()) return;
  AE.ekran.push({ tur: "parlama", bas: performance.now(), sure: sure * 1000, renk });
}
function aeVinyet(sure = 0.3, renk = "239, 68, 68") {
  if (aeAzHareket()) return;
  AE.ekran.push({ tur: "vinyet", bas: performance.now(), sure: sure * 1000, renk });
}
function aeBanner(metin, sure = 1200) {
  AE.ekran.push({ tur: "banner", bas: performance.now(), sure, metin });
}

function aeEkranEfektleriCiz(ctx, now = performance.now()) {
  const W = (typeof game === "object" && game && game.W) || 800;
  const H = (typeof game === "object" && game && game.H) || 400;
  for (let i = AE.ekran.length - 1; i >= 0; i--) {
    const e = AE.ekran[i];
    const k = (now - e.bas) / e.sure;
    if (k >= 1) { AE.ekran.splice(i, 1); continue; }
    if (k < 0) continue;
    ctx.save();
    if (e.tur === "parlama") {
      ctx.globalAlpha = (1 - k) * 0.8;
      ctx.fillStyle = `rgb(${e.renk})`;
      ctx.fillRect(0, 0, W, H);
    } else if (e.tur === "vinyet") {
      const gr = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.28, W / 2, H / 2, Math.max(W, H) * 0.75);
      gr.addColorStop(0, `rgba(${e.renk}, 0)`);
      gr.addColorStop(1, `rgba(${e.renk}, ${0.55 * (1 - k)})`);
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, W, H);
    } else if (e.tur === "banner") {
      const giris = Math.min(1, k / 0.18), cikis = Math.max(0, (k - 0.75) / 0.25);
      const sc = aeAzHareket() ? 1 : 0.55 + 0.45 * (1 - Math.pow(1 - giris, 3));
      ctx.globalAlpha = Math.min(1, giris * 2) * (1 - cikis);
      ctx.translate(W / 2, H * 0.22);
      ctx.scale(sc, sc);
      ctx.textAlign = "center";
      ctx.font = "900 30px Baloo 2, Nunito, sans-serif";
      ctx.lineWidth = 6; ctx.strokeStyle = "rgba(0,0,0,0.65)";
      ctx.strokeText(e.metin, 0, 0);
      const gr = ctx.createLinearGradient(0, -24, 0, 12);
      gr.addColorStop(0, "#fff7cc"); gr.addColorStop(1, "#fbbf24");
      ctx.fillStyle = gr;
      ctx.fillText(e.metin, 0, 0);
    }
    ctx.restore();
  }
}

// ---- Renkli kare (beyaz kareyi karakter rengine boyar; kare+renk başına önbellek) ----
const _aeRenkKare = {};
function aeRenkliKare(ad, i, renk) {
  const anahtar = `${ad}|${i}|${renk}`;
  if (_aeRenkKare[anahtar]) return _aeRenkKare[anahtar];
  const im = typeof gorsel === "function" ? gorsel(`an-${ad}-${i}`) : null;
  if (!im) return null;
  const W = im.naturalWidth || im.width, H = im.naturalHeight || im.height;
  if (!W || !H) return null;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const x = cv.getContext("2d");
  x.drawImage(im, 0, 0);
  x.globalCompositeOperation = "source-atop";
  x.fillStyle = renk;
  x.fillRect(0, 0, W, H);
  return (_aeRenkKare[anahtar] = cv);
}

function aeGucRengi(charKey) {
  try {
    const idx = (save && save.selectedCostume && save.selectedCostume[charKey]) || 0;
    const kos = COSTUMES[charKey] && COSTUMES[charKey][idx];
    if (kos && kos.body) return kos.body;
    return (CHARACTERS[charKey] && CHARACTERS[charKey].color.body) || "#fde047";
  } catch (_) { return "#fde047"; }
}

// ---- Kod efektlerinin çizimi ----
function aeKareCiz(ctx, ad, k, x, y, boyut, renk) {
  const kare = typeof animBirKez === "function" ? animBirKez(ad, k) : 0;
  if (!kare) return false;
  if (renk && typeof aeRenkliKare === "function") {
    const im = aeRenkliKare(ad, kare, renk);
    if (im) { ctx.drawImage(im, x - boyut / 2, y - boyut / 2, boyut, boyut); return true; }
  }
  return typeof animCiz === "function" ? animCiz(ctx, ad, kare, x - boyut / 2, y - boyut / 2, boyut, boyut) : false;
}

function aeYildiz(ctx, x, y, r) { if (typeof animYildiz === "function") animYildiz(ctx, x, y, r); }

function aeEfektleriCiz(ctx, now = performance.now()) {
  for (let i = AE.efektler.length - 1; i >= 0; i--) {
    const e = AE.efektler[i];
    const k = (now - e.bas) / 1000 / e.sure;
    if (k >= 1) { AE.efektler.splice(i, 1); continue; }
    if (k < 0) continue;
    ctx.save();
    if (e.tur === "sifa") aeSifaCiz(ctx, e, k);
    else if (e.tur === "hasar") aeHasarCiz(ctx, e, k);
    else if (e.tur === "duman") aeDumanCiz(ctx, e, k);
    else if (e.tur === "simsek") aeSimsekCiz(ctx, e, k, now);
    else if (e.tur === "seviye") aeSeviyeCiz(ctx, e, k);
    else if (e.tur === "guc-patlama") aeGucPatlamaCiz(ctx, e, k);
    else if (e.tur === "gorunmez") aeGorunmezCiz(ctx, e, k);
    ctx.restore();
  }
}
// ---- Tek tek efekt çizimleri ----
function aeSifaCiz(ctx, e, k) {
  const r = 10 + (typeof animYumusak === "function" ? animYumusak(k) : k) * 46;
  ctx.globalAlpha = 1 - k;
  ctx.strokeStyle = "#34d399"; ctx.lineWidth = 4 * (1 - k) + 1;
  ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = "#f9a8d4"; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(e.x, e.y, r * 0.66, 0, Math.PI * 2); ctx.stroke();
  // Yükselen kalpler ve artı işaretleri
  for (let j = 0; j < 5; j++) {
    const y = e.y - 8 - k * (34 + j * 7) - j * 3;
    const x = e.x + (j - 2) * 13 + Math.sin(k * 6 + j) * 4;
    ctx.globalAlpha = (1 - k) * 0.9;
    if (j % 2 === 0) {
      ctx.fillStyle = "#fb7185";
      const s = 4 + 2 * Math.sin(k * Math.PI);
      ctx.beginPath();
      ctx.moveTo(x, y + s * 0.6);
      ctx.bezierCurveTo(x - s, y - s * 0.4, x - s * 0.5, y - s, x, y - s * 0.45);
      ctx.bezierCurveTo(x + s * 0.5, y - s, x + s, y - s * 0.4, x, y + s * 0.6);
      ctx.fill();
    } else {
      ctx.fillStyle = "#6ee7b7";
      ctx.fillRect(x - 1.5, y - 5, 3, 10); ctx.fillRect(x - 5, y - 1.5, 10, 3);
    }
  }
}

function aeHasarCiz(ctx, e, k) {
  if (typeof animHazir === "function" && animHazir("hasar-patlama")) return; // ChatGPT karesi çizilir
  ctx.globalAlpha = 1 - k;
  ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 3 * (1 - k) + 1;
  for (let j = 0; j < 8; j++) {
    const a = j * (Math.PI / 4) + 0.2;
    const r0 = 8 + k * 18, r1 = 22 + k * 30;
    ctx.beginPath();
    ctx.moveTo(e.x + Math.cos(a) * r0, e.y + Math.sin(a) * r0);
    ctx.lineTo(e.x + Math.cos(a) * r1, e.y + Math.sin(a) * r1);
    ctx.stroke();
  }
  ctx.fillStyle = "#fecaca";
  for (let j = 0; j < 5; j++) {
    const a = j * 1.3 + k * 2;
    aeYildiz(ctx, e.x + Math.cos(a) * (10 + k * 26), e.y + Math.sin(a) * (10 + k * 26), 3 * (1 - k) + 0.5);
  }
}

function aeDumanCiz(ctx, e, k) {
  const r = e.boyut * (0.28 + k * 0.55);
  ctx.globalAlpha = (1 - k) * 0.5;
  ctx.fillStyle = "rgba(203, 213, 225, 0.9)";
  ctx.beginPath(); ctx.arc(e.x, e.y - k * 10, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(148, 163, 184, 0.6)";
  ctx.beginPath(); ctx.arc(e.x + r * 0.5, e.y - k * 6, r * 0.62, 0, Math.PI * 2); ctx.fill();
}

// Yıldırım: ekranın üstünden hayalete inen, 50 ms'de bir yeniden titreyen parlayan kırık çizgi
function aeSimsekCiz(ctx, e, k, now) {
  const bas = (typeof game === "object" && game && game.camera) ? game.camera.y - 8 : e.hedefY - 260;
  const hx = e.hedefX ?? e.x, hy = e.hedefY ?? e.y;
  if (typeof animHazir === "function" && animHazir("simsek")) {
    const kare = (typeof animBirKez === "function") ? animBirKez("simsek", k) : 0;
    if (kare) {
      ctx.globalAlpha = 1 - k * 0.6;
      const boy = Math.max(60, hy - bas), en = 42;
      animCiz(ctx, "simsek", kare, hx - en / 2, bas, en, boy, true);
      return;
    }
  }
  const dilim = Math.floor(now / 50);
  ctx.globalAlpha = (1 - k) * 0.95;
  ctx.lineJoin = "round";
  for (let kat = 0; kat < 2; kat++) {
    ctx.strokeStyle = kat === 0 ? "rgba(191, 219, 254, 0.55)" : "#ffffff";
    ctx.lineWidth = kat === 0 ? 6 : 2;
    if (kat === 1 && ctx.shadowBlur !== undefined) { ctx.shadowColor = "#7dd3fc"; ctx.shadowBlur = 8; }
    ctx.beginPath();
    ctx.moveTo(hx + (aeRast(dilim) - 0.5) * 10, bas);
    const n = 7;
    for (let s = 1; s < n; s++) {
      const t = s / n;
      const y = bas + (hy - bas) * t;
      const genlik = 14 * Math.sin(t * Math.PI);
      ctx.lineTo(hx + (aeRast(dilim + s * 7.3) - 0.5) * 2 * genlik, y);
    }
    ctx.lineTo(hx, hy);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
  // Çarpma parlaması
  ctx.globalAlpha = (1 - k) * 0.8;
  const gr = ctx.createRadialGradient(hx, hy, 0, hx, hy, 26);
  gr.addColorStop(0, "rgba(255,255,255,0.95)");
  gr.addColorStop(0.4, "rgba(125,211,252,0.6)");
  gr.addColorStop(1, "rgba(125,211,252,0)");
  ctx.fillStyle = gr;
  ctx.beginPath(); ctx.arc(hx, hy, 26, 0, Math.PI * 2); ctx.fill();
}

function aeSeviyeCiz(ctx, e, k) {
  // Seviye rozeti: resim varsa yukarı süzülerek çizilir (az harekette sabit)
  if (typeof gorselKutuya === "function" && typeof gorsel === "function" && gorsel("ui-seviye")) {
    const cy = e.y - (aeAzHareket() ? 78 : 78 + 14 * k);
    ctx.save();
    ctx.globalAlpha = 1 - k;
    gorselKutuya(ctx, "ui-seviye", e.x - 36, cy - 36, 72, 72);
    ctx.restore();
  }
  if (typeof animHazir === "function" && animHazir("seviye-atla")) return; // ChatGPT karesi çizilir
  ctx.globalAlpha = 1 - k;
  const r = 12 + k * 70;
  ctx.strokeStyle = "#fde047"; ctx.lineWidth = 4 * (1 - k) + 1;
  ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = "#a78bfa"; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(e.x, e.y, r * 0.62, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = "#fef9c3";
  for (let j = 0; j < 8; j++) {
    const a = j * (Math.PI / 4) + k * 2;
    aeYildiz(ctx, e.x + Math.cos(a) * r, e.y + Math.sin(a) * r, 4 * (1 - k) + 0.5);
  }
}

function aeGucPatlamaCiz(ctx, e, k) {
  if (e.ek === "kare") { // beyaz kare karakter rengine boyanır
    const kare = typeof animBirKez === "function" ? animBirKez("guc-patlama", k) : 0;
    const im = kare ? aeRenkliKare("guc-patlama", kare, `rgb(${e.renk})`) : null;
    if (im) {
      ctx.globalAlpha = 1 - k * 0.7;
      const b = e.boyut || 120;
      ctx.drawImage(im, e.x - b / 2, e.y - b / 2, b, b);
      return;
    }
  }
  const renk = e.renk || "253, 224, 71";
  const r = 10 + (typeof animYumusak === "function" ? animYumusak(k) : k) * 64;
  ctx.globalAlpha = 1 - k;
  ctx.strokeStyle = `rgb(${renk})`; ctx.lineWidth = 5 * (1 - k) + 1;
  ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.lineWidth = 2;
  for (let j = 0; j < 12; j++) {
    const a = j * (Math.PI / 6) + 0.15;
    ctx.beginPath();
    ctx.moveTo(e.x + Math.cos(a) * (r * 0.5), e.y + Math.sin(a) * (r * 0.5));
    ctx.lineTo(e.x + Math.cos(a) * (r * 1.15), e.y + Math.sin(a) * (r * 1.15));
    ctx.stroke();
  }
}

function aeGorunmezCiz(ctx, e, k) {
  ctx.globalAlpha = (1 - k);
  for (let j = 0; j < 9; j++) {
    const a = j * 0.7 + (e.ek || 0);
    const r = 8 + k * (26 + (j % 3) * 10);
    ctx.fillStyle = j % 2 ? "#e9d5ff" : "#c4b5fd";
    aeYildiz(ctx, e.x + Math.cos(a) * r, e.y + Math.sin(a) * r * 0.7, 3.2 * (1 - k) + 0.4);
  }
}
// ---- Donmuş hayaletin buz kaplaması ----
function aeDonmaBasladi(g, until) {
  if (!g) return;
  g.__aeDonmaBas = performance.now();
  g.__aeDonmaBitis = until;
}
function aeBuzKaplamaCiz(ctx, g, now = performance.now()) {
  const until = (g && g.frozenUntil) || 0;
  if (!g || until <= now) return;
  const s = (g.size || 40) / 40;
  const bas = g.__aeDonmaBas ?? (until - 5000);
  const gecen = now - bas, kalan = until - now;
  ctx.save();
  ctx.translate(g.x, g.y);
  if (gecen < 400 && !aeAzHareket()) {
    if (typeof animHazir === "function" && animHazir("donma")) {
      const kare = animBirKez("donma", gecen / 400);
      if (kare) { animCiz(ctx, "donma", kare, -24 * s, -30 * s, 48 * s, 52 * s); ctx.restore(); return; }
    }
  } else if (kalan < 400) {
    if (typeof animHazir === "function" && animHazir("cozulme")) {
      const kare = animBirKez("cozulme", 1 - kalan / 400);
      if (kare) { animCiz(ctx, "cozulme", kare, -24 * s, -30 * s, 48 * s, 52 * s); ctx.restore(); return; }
    }
    // Kod: çatlayan buz parçaları düşer
    ctx.globalAlpha = Math.min(1, kalan / 400);
    ctx.fillStyle = "rgba(186, 230, 253, 0.55)";
    const n = 5;
    for (let i = 0; i < n; i++) {
      const k = 1 - kalan / 400;
      const px = (-14 + i * 7) * s, py = (6 + k * 26 + (i % 3) * 6) * s;
      ctx.save(); ctx.translate(px, py); ctx.rotate(k * 2 + i);
      ctx.fillRect(-3, -2, 6, 4); ctx.restore();
    }
    ctx.restore();
    return;
  }
  // Sabit buz bloğu (son donma karesi varsa o, yoksa kod)
  if (typeof animHazir === "function" && animHazir("donma") && !aeAzHareket()) {
    const n = animHazir("donma");
    animCiz(ctx, "donma", n, -24 * s, -30 * s, 48 * s, 52 * s);
    ctx.restore();
    return;
  }
  const w = 38 * s, h = 46 * s, r = 9 * s;
  ctx.globalAlpha = 0.72;
  ctx.fillStyle = "rgba(147, 197, 253, 0.55)";
  ctx.beginPath();
  ctx.moveTo(-w / 2 + r, -h + 6 * s);
  ctx.lineTo(w / 2 - r, -h + 6 * s); ctx.quadraticCurveTo(w / 2, -h + 6 * s, w / 2, -h + 6 * s + r);
  ctx.lineTo(w / 2, 10 * s - r); ctx.quadraticCurveTo(w / 2, 10 * s, w / 2 - r, 10 * s);
  ctx.lineTo(-w / 2 + r, 10 * s); ctx.quadraticCurveTo(-w / 2, 10 * s, -w / 2, 10 * s - r);
  ctx.lineTo(-w / 2, -h + 6 * s + r); ctx.quadraticCurveTo(-w / 2, -h + 6 * s, -w / 2 + r, -h + 6 * s);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "rgba(224, 242, 254, 0.9)"; ctx.lineWidth = 1.5 * s; ctx.stroke();
  // Parlamalar ve küçük kristaller
  ctx.globalAlpha = 0.85;
  ctx.strokeStyle = "#f0f9ff"; ctx.lineWidth = 2 * s;
  ctx.beginPath(); ctx.moveTo(-w * 0.22, -h * 0.68); ctx.lineTo(-w * 0.1, -h * 0.5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w * 0.16, -h * 0.42); ctx.lineTo(w * 0.28, -h * 0.3); ctx.stroke();
  ctx.fillStyle = "#e0f2fe";
  for (let i = 0; i < 3; i++) aeYildiz(ctx, (i - 1) * 9 * s, (-2 + i * 5) * s, 1.8 * s);
  ctx.restore();
}

// ---- Roket: kare varsa döngü, yoksa karikatür roket + titreyen alev ----
function aeRoketGuncelle(e, dt, now = performance.now()) {
  if (e.__aeSonDuman === undefined) e.__aeSonDuman = 0;
  if (now - e.__aeSonDuman >= 40) {
    e.__aeSonDuman = now;
    if (typeof animHazir === "function" && animHazir("duman")) animEfektEkle("kare", e.x, e.y, { ad: "duman", sure: 0.5, boyut: 30 });
    else aeEkle("duman", e.x, e.y, { sure: 0.5, boyut: 26 });
  }
}
function aeRoketCiz(ctx, e) {
  const aci = Math.atan2(e.vy, e.vx);
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.rotate(aci);
  if (typeof animHazir === "function" && animHazir("roket")) {
    const kare = animDongu("roket", performance.now() / 1000, 12);
    if (kare) { animCiz(ctx, "roket", kare, -20, -14, 40, 28); ctx.restore(); return true; }
  }
  // Alev (titrek)
  const fl = 18 + Math.random() * 9;
  const gr = ctx.createLinearGradient(-fl, 0, -2, 0);
  gr.addColorStop(0, "rgba(254, 240, 138, 0)");
  gr.addColorStop(0.45, "rgba(251, 146, 60, 0.9)");
  gr.addColorStop(1, "rgba(220, 38, 38, 1)");
  ctx.fillStyle = gr;
  ctx.beginPath();
  ctx.moveTo(-fl, -5); ctx.quadraticCurveTo(-fl * 0.5, 0, -fl, 5);
  ctx.lineTo(-2, 4); ctx.lineTo(-2, -4); ctx.closePath(); ctx.fill();
  // Gövde ve burun
  ctx.fillStyle = "#f1f5f9";
  ctx.beginPath(); ctx.moveTo(-10, -6); ctx.lineTo(6, -6); ctx.quadraticCurveTo(14, 0, 6, 6); ctx.lineTo(-10, 6);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#475569"; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = "#dc2626";
  ctx.beginPath(); ctx.moveTo(6, -6); ctx.lineTo(15, 0); ctx.lineTo(6, 6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#64748b";
  ctx.beginPath(); ctx.moveTo(-10, -6); ctx.lineTo(-16, -11); ctx.lineTo(-4, -6); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-10, 6); ctx.lineTo(-16, 11); ctx.lineTo(-4, 6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#38bdf8";
  ctx.beginPath(); ctx.arc(1, 0, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  return true;
}

// ---- Karakter gücü: yer aurası, imza izi ve ince zaman halkası ----
function aeGucAuraCiz(ctx, player, power, now = performance.now()) {
  if (!player || !power) return false;
  const charKey = power.type;
  const renk = aeGucRengi(charKey);
  const t = now / 1000;
  const kalan = Math.max(0, power.expires - now);
  const alfa = Math.min(1, kalan / 500);
  ctx.save();
  ctx.globalAlpha = alfa;
  // Yer elipsi (nabız)
  const nabiz = aeAzHareket() ? 1 : 1 + Math.sin(t * 4) * 0.08;
  ctx.strokeStyle = renk; ctx.lineWidth = 3;
  ctx.globalAlpha = alfa * 0.65;
  ctx.beginPath(); ctx.ellipse(player.x, player.y + 30, 34 * nabiz, 12 * nabiz, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = alfa * 0.22;
  ctx.fillStyle = renk;
  ctx.beginPath(); ctx.ellipse(player.x, player.y + 30, 34 * nabiz, 12 * nabiz, 0, 0, Math.PI * 2); ctx.fill();
  // Yükselen kıvılcımlar
  if (!aeAzHareket()) {
    ctx.globalAlpha = alfa * 0.8;
    for (let i = 0; i < 7; i++) {
      const d = ((t * 0.9 + i * 0.14) % 1);
      const x = player.x + Math.sin(i * 2.1 + t * 2) * 26;
      const y = player.y + 30 - d * 56;
      ctx.fillStyle = renk;
      aeYildiz(ctx, x, y, 2.2 * (1 - d) + 0.6);
    }
  }
  // ChatGPT guc-aura kareleri (beyaz kare boyanır); karakterin kendi imza halkası varsa o kullanılır
  const imza = typeof gorsel === "function" ? gorsel(`guc-imza-${charKey}`) : null;
  if (imza) {
    const boy = 126; // ~1,8 × oyuncunun çizilen boyu (70)
    ctx.save();
    ctx.globalAlpha = alfa * 0.85;
    ctx.translate(player.x, player.y - 6);
    if (!aeAzHareket()) ctx.rotate(t * 0.6); // yavaş dönüş; az harekette sabit
    resmiKutuyaCiz(ctx, imza, -boy / 2, -boy / 2, boy, boy);
    ctx.restore();
  } else if (typeof animHazir === "function" && animHazir("guc-aura") && !aeAzHareket()) {
    const kare = animDongu("guc-aura", t, 8);
    const im = kare ? aeRenkliKare("guc-aura", kare, renk) : null;
    if (im) {
      ctx.globalAlpha = alfa * 0.7;
      ctx.drawImage(im, player.x - 44, player.y - 16, 88, 88);
    }
  }
  aeGucImzaCiz(ctx, player, charKey, renk, t, now);
  ctx.restore();
  return true;
}

function aeGucImzaCiz(ctx, player, charKey, renk, t, now) {
  const x = player.x, y = player.y;
  ctx.globalAlpha = 0.75;
  switch (charKey) {
    case "kinkin": { // hız çizgileri ve art arda izler
      ctx.strokeStyle = "#bfdbfe"; ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const oy = -18 + i * 15;
        ctx.beginPath(); ctx.moveTo(x - 26 - i * 7, y + oy); ctx.lineTo(x - 44 - i * 7, y + oy); ctx.stroke();
      }
      ctx.globalAlpha = 0.18; ctx.fillStyle = renk;
      ctx.beginPath(); ctx.ellipse(x - 20, y - 4, 16, 26, 0, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case "veryi": { // kırmızı öfke halesi
      ctx.globalAlpha = 0.35 + 0.15 * Math.sin(t * 8);
      ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(x, y - 6, 26 + i * 5, t + i, t + i + 1.5); ctx.stroke(); }
      break;
    }
    case "kornet": { // üç yörünge küresi
      for (let i = 0; i < 3; i++) {
        const a = t * 2.5 + i * (Math.PI * 2 / 3);
        ctx.fillStyle = i === 0 ? "#fde047" : "#c084fc";
        ctx.beginPath(); ctx.arc(x + Math.cos(a) * 30, y - 10 + Math.sin(a) * 12, 3.4, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case "mark": { // yakın toplanabilirlere mıknatıs çizgileri
      const pks = (typeof game === "object" && game && game.pickups) || [];
      ctx.strokeStyle = "#34d399"; ctx.lineWidth = 1.4;
      for (let i = 0; i < Math.min(6, pks.length); i++) {
        const p = pks[i];
        ctx.globalAlpha = 0.35 + 0.25 * Math.sin(t * 5 + i);
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(x, y - 8); ctx.stroke();
      }
      break;
    }
    case "kent": { // koyu pelerin parıltısı
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = "#0f172a";
      ctx.beginPath(); ctx.ellipse(x, y - 8, 28, 34, 0, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case "ponko": { // alevli namlu
      if ((player.shootRecoil || 0) > 0.5) {
        ctx.fillStyle = "#fb923c";
        ctx.beginPath(); ctx.arc(x + (player.facing >= 0 ? 34 : -34), y - 4, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fde047";
        ctx.beginPath(); ctx.arc(x + (player.facing >= 0 ? 30 : -30), y - 4, 3, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case "gul": { // mermi fitili kıvılcımı
      ctx.fillStyle = "#fbbf24";
      for (let i = 0; i < 2; i++) aeYildiz(ctx, x + 20 + i * 8, y - 14 - i * 6, 2.2 + Math.sin(t * 12 + i));
      break;
    }
    case "rani": { // her şifa anında kalp nabzı
      const at = Math.max(0, Math.sin(t * 3));
      ctx.globalAlpha = 0.35 + at * 0.4;
      ctx.fillStyle = "#fb7185";
      ctx.beginPath(); ctx.arc(x, y - 4, 4 + at * 4, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case "beti": { // şeker parıltıları
      for (let i = 0; i < 4; i++) {
        const a = t * 3 + i * 1.6;
        ctx.fillStyle = ["#f43f5e", "#fbbf24", "#22d3ee", "#a855f7"][i];
        ctx.beginPath(); ctx.arc(x + Math.cos(a) * 24, y - 8 + Math.sin(a) * 16, 2.6, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case "silsen": { // taç yaprakları
      ctx.fillStyle = "#fda4af";
      for (let i = 0; i < 6; i++) {
        const a = t * 1.6 + i * (Math.PI / 3);
        ctx.save(); ctx.translate(x + Math.cos(a) * 28, y - 6 + Math.sin(a) * 18); ctx.rotate(a);
        ctx.beginPath(); ctx.ellipse(0, 0, 4, 2, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      break;
    }
    case "sercin": { // tüy izi
      ctx.strokeStyle = "#f1f5f9"; ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const yy = y + 4 + i * 8, xx = x - 22 - i * 8 + Math.sin(t * 4 + i) * 4;
        ctx.beginPath(); ctx.moveTo(xx, yy); ctx.quadraticCurveTo(xx - 5, yy + 3, xx - 10, yy); ctx.stroke();
      }
      break;
    }
    default: break; // fanatik: mevcut tekme görseli korunur
  }
}
// ---- Görünmezlik: başlangıç/bitiş parıltısı ve titreyen saydamlık ----
function aeGorunmezBasla(px, py, sureMs = 5000) {
  aeEkle("gorunmez", px, py, { sure: 0.5, ek: Math.random() * 6 });
  const simdi = performance.now();
  AE.efektler.push({ tur: "gorunmez", x: px, y: py, bas: simdi + sureMs, sure: 0.5, renk: "196, 181, 253", boyut: 40, ek: 1.3 });
}
function aeGorunmezAlfa(now = performance.now()) {
  if (aeAzHareket()) return 0.4;
  return 0.32 + 0.14 * Math.sin(now / 110);
}
function aeGorunmezParilti(ctx, player, now = performance.now()) {
  if (!player || aeAzHareket()) return;
  const t = now / 1000;
  // ChatGPT görünmezlik parıltısı kareleri (N10): 6 kare/sn döngü, ~1,6 × oyuncu boyu
  if (typeof animHazir === "function" && animHazir("gorunmez-parilti")) {
    const kare = animDongu("gorunmez-parilti", t, 6);
    if (kare) {
      const boy = 1.6 * 70;
      ctx.save();
      ctx.globalAlpha = 0.8;
      animCiz(ctx, "gorunmez-parilti", kare, player.x - boy / 2, player.y - boy / 2 - 4, boy, boy);
      ctx.restore();
      return;
    }
  }
  ctx.save();
  ctx.globalAlpha = 0.8;
  for (let i = 0; i < 4; i++) {
    const d = ((t * 0.8 + i * 0.25) % 1);
    const x = player.x + Math.sin(i * 2.4 + t * 2.2) * 18;
    const y = player.y - 10 - d * 40;
    ctx.fillStyle = i % 2 ? "#e9d5ff" : "#c4b5fd";
    aeYildiz(ctx, x, y, 2.4 * (1 - d) + 0.5);
  }
  ctx.restore();
}

// ---- Mermiler: iz, parlama ve yeni kareler ----
function aeMermiIziGuncelle(p) {
  if (!p) return;
  if (!p.iz) p.iz = [];
  p.iz.push({ x: p.x, y: p.y });
  while (p.iz.length > 4) p.iz.shift(); // en çok 4 nokta
}
function aeMermiIziCiz(ctx, p) {
  if (!p || p.charKey === "bot") return;
  const t = performance.now() / 1000;
  // ChatGPT kuyruklu yıldız izi (W): özel silahsız avcı mermisinin arkasında, mermi yönüne döndürülür
  if (!p.gun && p.charKey && typeof gorsel === "function" && gorsel("mermi-" + p.charKey)) {
    const im = gorsel("mermi-iz-parilti");
    if (im) {
      const yaricap = { kinkin: 8, veryi: 8, kornet: 9, mark: 13, gul: 13, kent: 9, ponko: 8, rani: 5.5, beti: 7, fanatik: 10, silsen: 7, sercin: 18 }[p.charKey] || 7;
      const uz = yaricap * 3, yuk = uz * (im.naturalHeight || im.height) / (im.naturalWidth || im.width);
      ctx.save();
      ctx.translate(p.x, p.y);
      if (!aeAzHareket()) ctx.rotate(Math.atan2(p.vy, p.vx));
      ctx.globalAlpha = 0.7;
      ctx.drawImage(im, -uz, -yuk / 2, uz, yuk);
      ctx.restore();
    }
  }
  // İz: eskiden yeniye solan noktalar
  if (p.iz && p.iz.length > 1) {
    for (let i = 0; i < p.iz.length - 1; i++) {
      const k = (i + 1) / p.iz.length;
      ctx.globalAlpha = 0.18 + k * 0.35;
      ctx.fillStyle = p.gun === "lazer" ? "#fca5a5" : p.gun === "yesil" ? "#86efac" : p.gun === "bazuka" ? "#fdba74" : "#bae6fd";
      ctx.beginPath(); ctx.arc(p.iz[i].x, p.iz[i].y, 1 + k * 2.4, 0, Math.PI * 2); ctx.fill();
    }
  }
  // Yumuşak parlama (nabız); çok mermide bile ucuz kalsın diye küçük radyal
  const r = 10 + Math.sin(t * 10 + p.x * 0.05) * 2;
  const gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
  gr.addColorStop(0, "rgba(255,255,255,0.55)");
  gr.addColorStop(0.5, "rgba(125,211,252,0.28)");
  gr.addColorStop(1, "rgba(125,211,252,0)");
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = gr;
  ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
  // Veryi gücü: mermide kırmızı hale
  const pw = (typeof getActivePower === "function") ? getActivePower() : null;
  if (pw && pw.type === "veryi") {
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = "#ef4444";
    ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Kare ile çizilebilen mermiler. Çizdiyse true (mevcut kod çizimi atlanır).
function aeMermiKareCiz(ctx, p, ang) {
  if (!p) return false;
  const hos = typeof animHazir === "function";
  // Baloncuk tabancası
  if (p.gun === "baloncuk") {
    if (hos && animHazir("mermi-baloncuk")) {
      const kare = animDongu("mermi-baloncuk", performance.now() / 1000, 10);
      if (kare) { ctx.save(); ctx.rotate(ang); animCiz(ctx, "mermi-baloncuk", kare, -10, -10, 20, 20); ctx.restore(); return true; }
    }
    // Kod: hafifçe yalpalayan baloncuk
    const wob = aeAzHareket() ? 1 : 1 + Math.sin(performance.now() / 120 + p.x) * 0.12;
    ctx.save(); ctx.scale(wob, 1 / wob);
    const g = ctx.createRadialGradient(-2, -2, 0, 0, 0, 8);
    g.addColorStop(0, "#eff6ff"); g.addColorStop(0.55, "#60a5fa"); g.addColorStop(1, "rgba(37,99,235,0.3)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#1d4ed8"; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath(); ctx.arc(-2.6, -2.6, 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    return true;
  }
  // Dev bazuka: küçük roket (roket kareleri ya da kod)
  if (p.gun === "bazuka") {
    ctx.save(); ctx.rotate(ang);
    if (hos && animHazir("roket")) {
      const kare = animDongu("roket", performance.now() / 1000, 12);
      if (kare) animCiz(ctx, "roket", kare, -18, -12, 36, 24);
      else aeRoketKucukCiz(ctx);
    } else aeRoketKucukCiz(ctx);
    ctx.restore();
    return true;
  }
  // Varsayılan mermi: mermi-enerji kareleri varsa hıza göre döndürülür. Avcının kendi mermi resmi (mermi-<avcı>) varsa o çizilir
  // (game.js drawProjectile); enerji kareleri yalnız resmi olmayan avcıya yedektir (önceden Kent'in resmi hiç görünmüyordu).
  const kendiResmi = p.charKey && typeof gorsel === "function" && gorsel("mermi-" + p.charKey);
  if (!p.gun && p.charKey !== "bot" && !kendiResmi && hos && animHazir("mermi-enerji")) {
    const kare = animDongu("mermi-enerji", performance.now() / 1000, 12);
    if (kare) { ctx.save(); ctx.rotate(ang); animCiz(ctx, "mermi-enerji", kare, -10, -10, 20, 20); ctx.restore(); return true; }
  }
  return false;
}
function aeRoketKucukCiz(ctx) {
  const fl = 12 + Math.random() * 5;
  ctx.fillStyle = "#fb923c";
  ctx.beginPath(); ctx.moveTo(-fl, -3); ctx.lineTo(-4, 0); ctx.lineTo(-fl, 3); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#e5e7eb";
  ctx.beginPath(); ctx.moveTo(-5, -5); ctx.lineTo(6, -5); ctx.quadraticCurveTo(12, 0, 6, 5); ctx.lineTo(-5, 5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#dc2626";
  ctx.beginPath(); ctx.moveTo(6, -5); ctx.lineTo(13, 0); ctx.lineTo(6, 5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#64748b";
  ctx.beginPath(); ctx.moveTo(-5, -5); ctx.lineTo(-10, -9); ctx.lineTo(-1, -5); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-5, 5); ctx.lineTo(-10, 9); ctx.lineTo(-1, 5); ctx.closePath(); ctx.fill();
}

// ---- Cephane çubuğu: dokunma zıplaması, rozet popu, pasif görünüm ----
const _aeBarStok = {};
function aeDugmeZip(btn) {
  if (!btn) return;
  btn.classList.remove("ae-bas");
  void btn.offsetWidth; // animasyonu yeniden başlat
  btn.classList.add("ae-bas");
  setTimeout(() => btn.classList.remove("ae-bas"), 170);
}
function aeRozetPop(key, badge, count) {
  if (!badge) return;
  const once = _aeBarStok[key];
  _aeBarStok[key] = count;
  if (once === undefined || once === count) return;
  badge.classList.remove("ae-rozet-pop");
  void badge.offsetWidth;
  badge.classList.add("ae-rozet-pop");
}

// ---- HUD sayaçlarının zıplaması ----
const _aeHud = {};
function aeHudKontrol(g) {
  if (!g || !g.player) return;
  const zipla = (el, deger) => {
    if (!el) return;
    const once = _aeHud[el.id];
    _aeHud[el.id] = deger;
    if (once === undefined || deger <= once) return;
    el.classList.remove("ae-pop");
    void el.offsetWidth;
    el.classList.add("ae-pop");
  };
  zipla(document.getElementById("run-para"), g.runPara || 0);
  zipla(document.getElementById("ghost-count"), g.totalCaught || 0);
  zipla(document.getElementById("lives"), g.player.hp || 0);
}

// ---- Silah ve olay kancaları ----
function aeBombaVurus(px, py) { aeParlama(0.25); aeSarsinti(0.25, 6); }
function aeSimsekVur(g, sira) {
  aeEkle("simsek", g.x, g.y, { sure: 0.35, hedefX: g.x, hedefY: g.y, bas: performance.now() + Math.min(11, sira) * 40 });
  if (sira === 0) aeParlama(0.08);
}
function aeSifaEkle(px, py) {
  if (typeof animHazir === "function" && animHazir("sifa")) animEfektEkle("kare", px, py, { ad: "sifa", sure: 0.8, boyut: 90 });
  else aeEkle("sifa", px, py, { sure: 0.8 });
  if (typeof animEfektEkle === "function") animEfektEkle("topla", px, py - 20, { renk: "52, 211, 153" });
}
function aeGucPatlama(charKey, player) {
  if (!player) return;
  const renk = aeGucRengi(charKey);
  const kareVar = typeof animHazir === "function" && animHazir("guc-patlama");
  aeEkle("guc-patlama", player.x, player.y, { sure: kareVar ? 0.5 : 0.55, renk: aeRenkRgb(renk), ek: kareVar ? "kare" : null, boyut: 120 });
}
function aeRenkRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return "253, 224, 71";
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}
function aeHasarEkle(px, py) {
  // ChatGPT hasar patlaması (N11) varsa kare olarak; kod efekti geriye dönük kayıt olarak durur, resim varken çizilmez
  aeEkle("hasar", px, py, { sure: 0.35, renk: "239, 68, 68" });
  if (typeof animHazir === "function" && animHazir("hasar-patlama") && typeof animEfektEkle === "function")
    animEfektEkle("kare", px, py, { ad: "hasar-patlama", sure: 0.3, boyut: 90 });
  aeVinyet(0.3);
  aeSarsinti(0.2, 4);
}
function aeSeviyeEkle(player, level) {
  if (player) {
    aeEkle("seviye", player.x, player.y, { sure: 0.7 });
    // ChatGPT seviye atlama ışınları (N12) varsa kare olarak; kod halkası resim varken çizilmez
    if (typeof animHazir === "function" && animHazir("seviye-atla") && typeof animEfektEkle === "function")
      animEfektEkle("kare", player.x, player.y, { ad: "seviye-atla", sure: 0.6, boyut: 160 });
    aeEkle("guc-patlama", player.x, player.y, { sure: 0.5, renk: "253, 224, 71" });
  }
  aeBanner(t("Bölüm {n}", { n: level }), 1200);
}


// ---- GEC1: bölüm geçişi görselleri (kutlama, portal, iris, başlık) ----
// Yalnız çizim: oyun kuralları, hasar, hız ve çevrimiçi alanlar değişmez. Kare başına nesne üretilmez.
const GEC1_RENK = ["#fde047", "#fb7185", "#38bdf8", "#34d399", "#c084fc", "#fb923c"];

// Dünya uzayı: portal halkası ve kutlama konfetisi (oyuncunun çevresinde)
function gec1DunyaCiz(ctx, now = performance.now()) {
  const s = (typeof game === "object" && game && game.gec1) || null;
  if (!s || !s.aktif) return;
  // Portal yalnız yolculuk haritasında, kutlama bitince görünür
  if (s.yolculuk && (s.asama === "portal" || s.asama === "kapan" || s.asama === "fadeKapan")) {
    const px = s.portalX, py = s.portalY;
    const anahtar = s.portalAcik ? "gecit-acik" : "gecit-kapali";
    if (typeof gorselKutuya === "function" && gorselKutuya(ctx, anahtar, px - 45, py - 62, 90, 124, true)) {
      // resim çizildi
    } else {
      const tb = (now - s.portalBas) / 1000;
      ctx.save();
      ctx.translate(px, py);
      ctx.globalAlpha = s.portalAcik ? 0.95 : 0.45;
      ctx.lineWidth = s.portalAcik ? 7 : 4;
      ctx.strokeStyle = s.portalAcik ? "#a855f7" : "#64748b";
      ctx.beginPath(); ctx.ellipse(0, 0, 34, 52, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = s.portalAcik ? "#f0abfc" : "#94a3b8";
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        const a = tb * 2.4 + i * (Math.PI * 2 / 3);
        ctx.beginPath();
        ctx.ellipse(0, 0, 22 - i * 4, 42 - i * 6, a, 0, Math.PI * 1.2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
  // Konfeti: az hareket tercihinde hiç çizilmez
  if (s.asama === "kutlama" && s.mod !== "fade" && game.player) {
    const P = game.player;
    ctx.save();
    for (let i = 0; i < 26; i++) {
      const x = P.x + Math.cos(i * 2.399 + s.bas * 0.001) * (26 + (i % 5) * 20);
      const y = P.y - 96 + ((now * 0.09 + i * 47) % 250) - 40;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(now * 0.004 + i);
      ctx.fillStyle = GEC1_RENK[i % GEC1_RENK.length];
      ctx.fillRect(-3, -2, 6, 4);
      ctx.restore();
    }
    ctx.restore();
  }
}

// Ekran uzayı: kutlama şeridi resmi, iris/soluk perde ve bölüm başlık kartı
function gec1EkranCiz(ctx, now = performance.now()) {
  const s = (typeof game === "object" && game && game.gec1) || null;
  if (!s || !s.aktif) return;
  const W = game.W, H = game.H;
  if (s.asama === "kutlama") {
    if (typeof gorselKutuya === "function") gorselKutuya(ctx, "kutlama-serit", W / 2 - 150, 10, 300, 52);
    return;
  }
  const cx = s.wipeX - game.camera.x, cy = s.wipeY - game.camera.y;
  const maxR = Math.hypot(W, H) || 1;
  const kapali = s.asama === "kapan" || s.asama === "fadeKapan";
  const acik = s.asama === "kart" || s.asama === "fadeAc";
  if (kapali || acik) {
    const k = Math.max(0, Math.min(1, (now - s.wipeBas) / 600));
    ctx.save();
    if (s.mod === "fade") {
      ctx.globalAlpha = kapali ? k : 1 - k;
      ctx.fillStyle = "#080412";
      ctx.fillRect(0, 0, W, H);
    } else {
      // Dışı koyu, ortası oyuncuya daralan/açılan daire (evenodd: kare başına ayırma yok)
      const r = maxR * (kapali ? 1 - k : k);
      ctx.fillStyle = "rgba(8, 4, 18, 1)";
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.arc(cx, cy, Math.max(0, r), 0, Math.PI * 2, true);
      ctx.fill("evenodd");
    }
    ctx.restore();
  }
  if (acik) {
    const k = (now - s.kartBas) / 1400;
    if (k >= 0 && k < 1) {
      const giris = Math.min(1, k / 0.2), cikis = Math.max(0, (k - 0.8) / 0.2);
      const kay = s.mod === "fade" ? 0 : (1 - giris) * 70 - cikis * 70;
      ctx.save();
      ctx.globalAlpha = Math.min(1, giris * 1.6) * (1 - cikis);
      ctx.translate(W / 2 + kay, H * 0.45);
      ctx.fillStyle = "rgba(16, 9, 34, 0.84)";
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-Math.min(W * 0.42, 220), -62, Math.min(W * 0.84, 440), 124, 18);
      else ctx.rect(-Math.min(W * 0.42, 220), -62, Math.min(W * 0.84, 440), 124);
      ctx.fill();
      ctx.textAlign = "center";
      ctx.font = "900 38px Baloo 2, Nunito, sans-serif";
      ctx.lineWidth = 6; ctx.strokeStyle = "rgba(0,0,0,0.65)";
      const baslik = s.baslik || "";
      ctx.strokeText(baslik, 0, -6);
      const gr = ctx.createLinearGradient(0, -34, 0, 8);
      gr.addColorStop(0, "#fff7cc"); gr.addColorStop(1, "#fbbf24");
      ctx.fillStyle = gr;
      ctx.fillText(baslik, 0, -6);
      if (s.tema) {
        ctx.font = "800 18px Nunito, sans-serif";
        ctx.fillStyle = "#c4b5fd";
        ctx.fillText(s.tema, 0, 34);
      }
      ctx.restore();
    }
  }
}

function aeEkranda(x, y, pay = 80) {
  if (typeof game !== "object" || !game || !game.camera) return true;
  return x > game.camera.x - pay && x < game.camera.x + game.W + pay &&
         y > game.camera.y - pay && y < game.camera.y + game.H + pay;
}

// ====== AKI1: oyun hissi (yalnız görüntü; havuzlu, en çok sayıda sınırlı) ======
// Ölüm "pop"u: hayaletin son görüntüsü 0.18 sn içinde 1.35'e büyür ve solar.
const AE_POP_MAX = 24;
AE.poplar = [];
function aeOlumPopEkle(g) {
  if (!g) return;
  const e = AE.poplar.length >= AE_POP_MAX ? AE.poplar.shift() : {};
  e.g = g; e.bas = performance.now(); e.boyut = g.size || 40;
  AE.poplar.push(e);
}
function aeOlumPoplariCiz(ctx, now = performance.now()) {
  for (let i = AE.poplar.length - 1; i >= 0; i--) {
    const e = AE.poplar[i];
    const k = (now - e.bas) / 180;
    if (k >= 1) { AE.poplar.splice(i, 1); continue; }
    if (k < 0) continue;
    const g = e.g;
    if (!aeEkranda(g.x, g.y, 90)) continue; // yalnız ekrandaki efekt çizilir
    const sc = 1 + 0.35 * (1 - Math.pow(1 - k, 2));
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - k) * 0.9;
    // GOR4: ChatGPT ölüm pop'u (efekt-olum-pop) hayaletin son görüntüsünün yerine; hayalet boyunda, büyüyerek solar
    const popIm = typeof gorsel === "function" ? gorsel("efekt-olum-pop") : null;
    if (popIm) {
      const b = (g.size || 40) * 1.5 * sc;
      resmiKutuyaCiz(ctx, popIm, g.x - b / 2, g.y - b / 2, b, b);
      ctx.restore();
      continue;
    }
    ctx.translate(g.x, g.y);
    ctx.scale(sc, sc);
    ctx.translate(-g.x, -g.y);
    drawGhost(ctx, g);
    ctx.restore();
  }
}

// Uçan sayılar: hasar (beyaz), öldürme (altın). En çok 24; havuzdaki nesne yeniden kullanılır.
const AE_PUAN_MAX = 24;
AE.puanlar = [];
function aePuanEkle(x, y, text, renk) {
  const e = AE.puanlar.length >= AE_PUAN_MAX ? AE.puanlar.shift() : {};
  e.x = x; e.y = y; e.text = String(text); e.renk = renk || "#ffffff"; e.bas = performance.now();
  AE.puanlar.push(e);
}
function aePuanlariCiz(ctx, now = performance.now()) {
  for (let i = AE.puanlar.length - 1; i >= 0; i--) {
    const e = AE.puanlar[i];
    const k = (now - e.bas) / 600;
    if (k >= 1) { AE.puanlar.splice(i, 1); continue; }
    if (k < 0) continue;
    if (!aeEkranda(e.x, e.y, 60)) continue;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - k);
    ctx.textAlign = "center";
    ctx.font = "900 15px Nunito, sans-serif";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0,0,0,0.75)";
    const yy = e.y - 26 * k;
    ctx.strokeText(e.text, e.x, yy);
    ctx.fillStyle = e.renk;
    ctx.fillText(e.text, e.x, yy);
    ctx.restore();
  }
}

// Toplanan paranın HUD sayacına uçuşu (ekran uzayı; yay çizerek, hızlanarak).
const AE_UCUS_MAX = 20;
AE.ucuslar = [];
function aeUcusEkle(x, y, tip) {
  const el = document.getElementById(tip === "elmas" ? "run-elmas" : "run-para") || document.getElementById("run-para");
  const vs = (game && game.viewScale) || 1;
  const e = AE.ucuslar.length >= AE_UCUS_MAX ? AE.ucuslar.shift() : {};
  e.bas = performance.now(); e.sure = 450; e.tip = tip;
  e.sx = x - (game ? game.camera.x : 0); e.sy = y - (game ? game.camera.y : 0);
  if (el) {
    const r = el.getBoundingClientRect();
    e.hx = (r.left + r.width / 2) / vs; e.hy = (r.top + r.height / 2) / vs;
  } else { e.hx = (game ? game.W : 800) - 60; e.hy = 24; }
  AE.ucuslar.push(e);
}
function aeUcuslarCiz(ctx, now = performance.now()) {
  for (let i = AE.ucuslar.length - 1; i >= 0; i--) {
    const e = AE.ucuslar[i];
    const k = (now - e.bas) / e.sure;
    if (k >= 1) { AE.ucuslar.splice(i, 1); continue; }
    if (k < 0) continue;
    if (game && (e.sx < -60 || e.sx > game.W + 60 || e.sy < -60 || e.sy > game.H + 60)) continue;
    const t = k * k; // ease-in
    const x = e.sx + (e.hx - e.sx) * t;
    const y = e.sy + (e.hy - e.sy) * t - Math.sin(k * Math.PI) * 60;
    ctx.save();
    ctx.globalAlpha = Math.min(1, 1.2 - k);
    let resimli = false;
    if (e.tip === "elmas") {
      if (typeof gorsel === "function" && gorsel("esya-elmas") && typeof gorselKutuya === "function") {
        resimli = gorselKutuya(ctx, "esya-elmas", x - 8, y - 8, 16, 16);
      }
    } else if (typeof animHazir === "function" && animHazir("para") && typeof animDongu === "function" && typeof animCiz === "function") {
      const kare = animDongu("para", (typeof aeAzHareket === "function" && aeAzHareket()) ? 0 : now / 1000, 12);
      if (kare) resimli = animCiz(ctx, "para", kare, x - 8, y - 8, 16, 16);
    }
    if (!resimli) {
      ctx.fillStyle = e.tip === "elmas" ? "#60a5fa" : "#fbbf24";
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#fff7cc";
      ctx.beginPath(); ctx.arc(x - 1.6, y - 1.6, 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
}

// Avcının ayak tozları: yürürken 0.22 sn'de bir birkaç küçük yumuşak parçacık. Havuzlu.
const AE_TOZ_MAX = 48;
AE.tozlar = [];
function aeTozEkle(x, y) {
  const n = aeAzHareket() ? 1 : 2 + ((Math.random() * 2) | 0);
  for (let i = 0; i < n; i++) {
    const e = AE.tozlar.length >= AE_TOZ_MAX ? AE.tozlar.shift() : {};
    e.x = x + (Math.random() - 0.5) * 14;
    e.y = y + (Math.random() - 0.5) * 4;
    e.vx = (Math.random() - 0.5) * 18;
    e.vy = -6 - Math.random() * 10;
    e.bas = performance.now(); e.sure = 380 + Math.random() * 160;
    AE.tozlar.push(e);
  }
}
function aeTozlariCiz(ctx, now = performance.now()) {
  for (let i = AE.tozlar.length - 1; i >= 0; i--) {
    const e = AE.tozlar[i];
    const k = (now - e.bas) / e.sure;
    if (k >= 1) { AE.tozlar.splice(i, 1); continue; }
    if (k < 0) continue;
    if (!aeEkranda(e.x, e.y, 40)) continue;
    ctx.save();
    // GOR4: ChatGPT toz bulutu (efekt-toz); kod dairesinin yerine, aynı yolda ve büyüyerek solar
    const tozIm = typeof gorsel === "function" ? gorsel("efekt-toz") : null;
    if (tozIm) {
      ctx.globalAlpha = (1 - k) * 0.7;
      const d = 12 + k * 10;
      resmiKutuyaCiz(ctx, tozIm, e.x + e.vx * k - d / 2, e.y + e.vy * k - d / 2, d, d);
      ctx.restore();
      continue;
    }
    ctx.globalAlpha = (1 - k) * 0.35;
    ctx.fillStyle = "#e7e5e4";
    ctx.beginPath();
    ctx.arc(e.x + e.vx * k, e.y + e.vy * k, 2.5 + k * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ====== ANM1: hareketli her şeye hafif canlılık (yalnız GÖRÜNTÜ) ======
// Kullanıcı (28 Kasım 2026): "atışlara animasyon ekle, arkaya ışıldama bıraksın, bu tür hareketli her şeyde animasyonlar olmalı".
// Hiçbir oyun durumu, çarpışma, süre ya da çevrimiçi alan değişmez: yalnız nesneye "_" önekli görsel alanlar (_dg, _iz) yazılır
// (eşitlenmez) ve performance.now() kullanılır. Rastgelelik yok: kıvılcım fazı konumdan, deterministik sin ile gelir.
// Tüm yeni hareketler "hareketi azalt" tercihinde kapanır ya da en aza iner.
const _anmParlamaOnbellek = Object.create(null);
// Yumuşak radyal parıltı resmi (renk başına bir kez çizilir; karede yalnız drawImage)
function anmParlamaResmi(renk) {
  let c = _anmParlamaOnbellek[renk];
  if (c) return c;
  c = document.createElement("canvas"); c.width = c.height = 64;
  const x = c.getContext("2d");
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, `rgba(${renk},0.9)`); g.addColorStop(0.4, `rgba(${renk},0.32)`); g.addColorStop(1, `rgba(${renk},0)`);
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  _anmParlamaOnbellek[renk] = c;
  return c;
}
// Parıltıyı (x, y) merkezli çizer; çağıran "lighter" bileşimini kurar ve geri alır
function anmParlama(ctx, x, y, r, renk, alfa) {
  ctx.globalAlpha = alfa;
  ctx.drawImage(anmParlamaResmi(renk), x - r, y - r, r * 2, r * 2);
}
// Belirme "pop"u: nesne ilk çizildiğinde küçükten büyüyüp hafifçe aşar (ease-out back). Az harekette hep 1.
function anmAcilis(o, now, sure = 380) {
  if (o._dg === undefined) o._dg = now;
  if (aeAzHareket()) return 1;
  const k = (now - o._dg) / sure;
  if (k >= 1) return 1;
  if (k <= 0) return 0.05;
  const c = 1.9, e = 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2);
  return Math.max(0.05, e);
}
// Dört köşeli kıvılcım: ~1,4 sn'de bir kısa parlar (faz konumdan); az harekette çizilmez
function anmKivilcim(ctx, x, y, r, faz, now, renk = "#ffffff") {
  if (aeAzHareket()) return false;
  const k = (((now / 1000 + faz) / 1.4) % 1 + 1) % 1;
  if (k > 0.28) return false;
  const s = Math.sin((k / 0.28) * Math.PI);
  const a = r * s, b = a * 0.2;
  ctx.save();
  ctx.translate(x, y); ctx.rotate(k * 1.2);
  ctx.globalAlpha = 0.5 + 0.5 * s;
  ctx.fillStyle = renk;
  ctx.beginPath();
  ctx.moveTo(0, -a); ctx.lineTo(b, -b); ctx.lineTo(a, 0); ctx.lineTo(b, b);
  ctx.lineTo(0, a); ctx.lineTo(-b, b); ctx.lineTo(-a, 0); ctx.lineTo(-b, -b);
  ctx.closePath(); ctx.fill();
  ctx.restore();
  return true;
}
// Toplanabilirin yukarı-aşağı süzülmesi (game.js drawPickup ile aynı formül; az harekette durur)
function anmPickupBob(p, now) {
  return aeAzHareket() ? 0 : Math.sin(now / 200 + p.x) * 3;
}
const ANM_PICKUP_RENK = { para: "253,224,71", kalp: "252,165,165", guc: "253,224,71", elmas: "96,165,250", zumrut: "52,211,153" };
// Toplanabilir: yerde süzülmeyle birlikte daralıp genişleyen yumuşak gölge + renkli ışıltı; ardından (gövdenin üstüne) kıvılcım
function anmPickupAlti(ctx, p, now) {
  const bob = anmPickupBob(p, now);
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  const w = 9 * (1 + bob * 0.06);
  ctx.beginPath(); ctx.ellipse(p.x + 1, p.y + 13, w, w * 0.32, 0, 0, Math.PI * 2); ctx.fill();
  const renk = ANM_PICKUP_RENK[p.kind];
  if (renk && !aeAzHareket()) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const nabiz = 0.5 + 0.5 * Math.sin(now / 420 + p.x * 0.07);
    anmParlama(ctx, p.x, p.y + bob, 17 + nabiz * 3, renk, 0.22 + nabiz * 0.14);
    ctx.restore();
  }
}
function anmPickupUstu(ctx, p, now) {
  if (p.kind === "elmas" || p.kind === "zumrut") return; // mücevherin kendi parıltısı var (N07)
  const bob = anmPickupBob(p, now);
  const faz = p.x * 0.017 + p.y * 0.011;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  anmKivilcim(ctx, p.x + 6, p.y + bob - 7, p.kind === "guc" ? 8 : 6, faz, now, p.kind === "kalp" ? "#fecaca" : "#fff7cc");
  ctx.restore();
}
// Roket: arkasında solan turuncu ışık izi + titreyen kafa parıltısı (konum geçmişi mermi nesnesinde, durum değil)
function anmRoketIzi(ctx, e, now) {
  const az = aeAzHareket();
  const iz = e._iz || (e._iz = []);
  const son = iz[iz.length - 1];
  if (!son || Math.hypot(e.x - son.x, e.y - son.y) >= 6) { iz.push({ x: e.x, y: e.y }); if (iz.length > (az ? 3 : 9)) iz.shift(); }
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < iz.length - 1; i++) {
    const k = (i + 1) / iz.length;
    anmParlama(ctx, iz[i].x, iz[i].y, 5 + k * 9, "251,146,60", 0.1 + k * 0.28);
  }
  const titre = az ? 0 : Math.sin(now / 45 + e.x * 0.1) * 0.12;
  anmParlama(ctx, e.x, e.y, 20, "254,215,170", 0.42 + titre);
  ctx.restore();
}
// Yürüyen botun / petin hafif yalpalaması (radyan)
function anmYalpa(faz, genlik) {
  return aeAzHareket() ? 0 : Math.sin(faz) * genlik;
}
