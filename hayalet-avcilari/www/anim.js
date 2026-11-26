// Hayalet Avcıları: kodla çizilen animasyonlar (3.18.0).
// Kullanıcının isteği (22 Kasım 2026): "Animasyonlar ekleyebilirsin, statik olmak zorunda değil, kendin önerilerde de
// bulunabilirsin." Bu dosya yalnız GÖRÜNTÜYÜ değiştirir: hayaletlerin konumu, canı, çarpışma yarıçapı, oyun kuralları
// ve çevrimiçi eşitleme aynen kalır. Hayalet nesnesine yalnız "__" önekli görsel alanlar eklenir (eşitlenmez).
// ChatGPT'den gelecek kare kare animasyonlar (gorsel/CHATGPT-ISTEMI.md, N01–N13) geldikçe aynı noktalara bağlanacak;
// gelmeyen animasyonun yerine buradaki kod animasyonu çalışır.

const ANIM = {
  dogusSn: 0.45,          // normal hayaletin belirmesi
  bossInisSn: 0.8,        // boss'un yukarıdan inişi
  bossInisYukseklik: 140, // boss kaç piksel yukarıdan düşer
  vurulmaSn: 0.1,         // vurulunca beyaz parlama (AKI1: 0,1 sn)
  vurulmaEzilmeSn: 0.14,  // vurulunca basılma (AKI1: 0,14 sn, 1,18 / 0,84)
  vurulmaAra: 220,        // ms; sürekli hasarda (kasırga) parlama en çok bu sıklıkta
  kirpmaAra: [2.6, 5.2],  // sn; göz kırpma aralığı
  kirpmaSn: 0.13,
  suzulme: 2.5,           // px; aşağı-yukarı süzülme genliği
  sarjMs: 450,            // atıcı hayaletin atıştan önceki hazırlanması
  toplaSn: 0.38,          // toplanınca açılan halka
  pufSn: 1,               // ölüm efektinin süresi (ghostFade ile aynı)
  dalgaSn: 0.55,          // boss iniş dalgası
};

const animAzHareket = () => !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

// Görsel faz: her hayalet kendi ritminde süzülsün, hep birlikte değil (oyun durumuna girmez)
function animFaz(o) {
  if (o.__faz === undefined) o.__faz = Math.random() * Math.PI * 2;
  return o.__faz;
}

function animYumusak(k) { return 1 - Math.pow(1 - k, 3); }               // ease-out cubic
function animGeriTepme(k) { const c = 1.7; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); } // ease-out back

// Bir hayaletin bu karedeki animasyon durumu. now: performance.now() (testte elle verilir).
// Dönen değerler yalnız çizimde kullanılır: dy (px), sx/sy (ölçek), alfa, kirp (gözler kapalı mı), beyaz (0-1),
// dalga (alt kenar dalgası için zaman), sarj (0-1, atıştan önceki parıltı), tacDy (taç sallanması, px).
function hayaletAnim(g, now) {
  const durgun = { dy: 0, sx: 1, sy: 1, alfa: 1, kirp: false, beyaz: 0, dalga: 0, sarj: 0, tacDy: 0, inis: 0 };
  if (!g || g.maxLife !== undefined) return durgun; // solan iz (ghostFade) kendi animasyonunu drawGhostFades'te alır
  const az = animAzHareket();
  const faz = animFaz(g);
  const sn = now / 1000;
  const a = { ...durgun };

  // Doğuş: ilk çizildiği an
  if (g.__dogus === undefined) g.__dogus = now;
  const yas = (now - g.__dogus) / 1000;
  if (g.isBoss) {
    const k = Math.min(1, yas / ANIM.bossInisSn);
    if (k < 1) {
      a.alfa = Math.min(1, 0.25 + k * 1.5);
      if (!az) {
        const dus = Math.min(1, k / 0.75);           // ilk %75'te düşer
        a.dy = -ANIM.bossInisYukseklik * (1 - dus * dus);
        if (k > 0.75) { const e = (k - 0.75) / 0.25; a.sx = 1 + 0.18 * Math.sin(e * Math.PI); a.sy = 1 - 0.16 * Math.sin(e * Math.PI); }
      }
    }
    if (k >= 0.75 && !g.__indi) { g.__indi = true; a.inis = 1; }
  } else {
    const k = Math.min(1, yas / ANIM.dogusSn);
    if (k < 1) {
      a.alfa = k;
      const sc = az ? 1 : 0.2 + 0.8 * animGeriTepme(k);
      a.sx *= sc; a.sy *= sc;
    }
  }

  // Süzülme ve alt kenar dalgası
  if (!az) {
    a.dy += Math.sin(sn * 2.4 + faz) * ANIM.suzulme;
    a.dalga = sn * 5 + faz;
    const nefes = Math.sin(sn * 2.4 + faz) * 0.025;
    a.sx *= 1 + nefes; a.sy *= 1 - nefes;
    a.tacDy = Math.sin(sn * 3.1 + faz) * 1.5;
  }

  // Göz kırpma: her hayalet kendi aralığıyla; kırpma bitince bir sonraki zamanlanır
  const [en, ec] = ANIM.kirpmaAra;
  if (g.__kirp === undefined) g.__kirp = now + Math.random() * ec * 1000;
  else if (now >= g.__kirp + ANIM.kirpmaSn * 1000) g.__kirp = now + (en + Math.random() * (ec - en)) * 1000;
  a.kirp = now >= g.__kirp && now < g.__kirp + ANIM.kirpmaSn * 1000;

  // Vurulma: can azaldıysa (hangi silahla, hangi oyuncuda olursa olsun) kısa beyaz parlama ve basılma
  if (typeof g.hp === "number") {
    if (g.__sonHp !== undefined && g.hp < g.__sonHp - 0.001 && now - (g.__vurulma || -1e9) > ANIM.vurulmaAra) g.__vurulma = now;
    g.__sonHp = g.hp;
  }
  const vk = (now - (g.__vurulma || -1e9)) / (ANIM.vurulmaSn * 1000);
  if (vk >= 0 && vk < 1) a.beyaz = 1 - vk;
  const ek = (now - (g.__vurulma || -1e9)) / (ANIM.vurulmaEzilmeSn * 1000);
  if (ek >= 0 && ek < 1 && !az) {
    const b = Math.sin(ek * Math.PI) * (g.isBoss ? 0.09 : 0.18); // boss: yarım ezilme
    a.sx *= 1 + b; a.sy *= 1 - b;
  }

  // Atıcı hayalet ve boss: atıştan hemen önce hazırlanır (yalnız atış zamanını bilen cihazda; istemcide yok)
  if (g.canShoot && typeof g.nextShot === "number") {
    const kalan = g.nextShot - now;
    if (kalan > 0 && kalan < ANIM.sarjMs) {
      a.sarj = 1 - kalan / ANIM.sarjMs;
      if (!az) { a.sx *= 1 - 0.06 * a.sarj; a.sy *= 1 + 0.08 * a.sarj; }
    }
  }
  return a;
}

// Normal hayaletin doğarken altında dönen mor girdap
function hayaletDogusGirdabi(ctx, g, s, now) {
  if (g.isBoss || g.__dogus === undefined) return;
  const k = (now - g.__dogus) / 1000 / (ANIM.dogusSn * 1.3);
  if (k < 0 || k >= 1) return;
  ctx.save();
  ctx.globalAlpha = (1 - k) * 0.8;
  ctx.strokeStyle = "#c4b5fd";
  ctx.lineWidth = 2.2 * s;
  for (let i = 0; i < 3; i++) {
    const r = (8 + k * 20 + i * 5) * s;
    const bas = now / 180 + i * 2.1;
    ctx.beginPath();
    ctx.ellipse(0, 20 * s, r, r * 0.35, 0, bas, bas + Math.PI * 1.1);
    ctx.stroke();
  }
  ctx.restore();
}

// Atıştan önceki mor enerji küresi (ağzın önünde büyür)
function hayaletSarjCiz(ctx, s, sarj, boss) {
  if (!(sarj > 0)) return;
  const r = (2 + sarj * (boss ? 9 : 6)) * s;
  const y = 3 * s;
  ctx.save();
  const renk = boss ? "248, 113, 113" : "192, 132, 252";
  const gr = ctx.createRadialGradient(0, y, 0, 0, y, r * 2.2);
  gr.addColorStop(0, `rgba(255, 255, 255, ${0.9 * sarj})`);
  gr.addColorStop(0.35, `rgba(${renk}, ${0.85 * sarj})`);
  gr.addColorStop(1, `rgba(${renk}, 0)`);
  ctx.fillStyle = gr;
  ctx.beginPath();
  ctx.arc(0, y, r * 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ---- Ölüm: uzayıp dumana dönüşme ("puf") ----
// drawGhostFades her solan iz için çağırır; k: 0 (yeni öldü) → 1 (bitti)
function olumDonusumu(ctx, e, k) {
  if (animAzHareket()) return;
  const uz = animYumusak(Math.min(1, k * 1.6));
  ctx.translate(e.x, e.y);
  ctx.scale(1 - 0.35 * uz, 1 + 0.45 * uz);
  ctx.translate(-e.x, -e.y);
}

function olumPufuCiz(ctx, e, k) {
  if (k <= 0 || k >= 1) return;
  const s = (e.size || 40) / 40;
  const boss = !!e.isBoss;
  const az = animAzHareket();
  ctx.save();
  ctx.translate(e.x, e.y);
  // Duman topakları: halka biçiminde dışa açılır
  const n = boss ? 10 : 7;
  const renk = boss ? "252, 165, 165" : "221, 214, 254";
  for (let i = 0; i < n; i++) {
    const aci = (i / n) * Math.PI * 2 + (e.__pufFaz || (e.__pufFaz = Math.random() * 6));
    const yol = (az ? 10 : 6 + k * 26) * s * (boss ? 1.6 : 1);
    const r = (5 + 5 * Math.sin(k * Math.PI)) * s * (boss ? 1.5 : 1);
    ctx.fillStyle = `rgba(${renk}, ${0.55 * (1 - k)})`;
    ctx.beginPath();
    ctx.arc(Math.cos(aci) * yol, 8 * s + Math.sin(aci) * yol * 0.5, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Parıltılar: dört köşeli küçük yıldızlar
  if (k > 0.15) {
    const yk = (k - 0.15) / 0.85;
    ctx.fillStyle = boss ? `rgba(253, 224, 71, ${1 - yk})` : `rgba(255, 255, 255, ${1 - yk})`;
    for (let i = 0; i < 4; i++) {
      const aci = i * 1.7 + 0.6;
      const yol = (12 + yk * 22) * s * (boss ? 1.5 : 1);
      animYildiz(ctx, Math.cos(aci) * yol, -6 * s + Math.sin(aci) * yol * 0.7, (3 + 2 * Math.sin(yk * Math.PI)) * s);
    }
  }
  ctx.restore();
}

// Dört köşeli parıltı yıldızı
function animYildiz(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

// ---- Toplanabilirler ----
// Paranın dikey ekseni çevresinde dönmesi: yatay ölçek (en az 0,18; kenardan görünüş) ve yüzü önde mi
function paraDonusu(now, x) {
  if (animAzHareket()) return { sx: 1, on: true };
  const c = Math.cos(now / 260 + x * 0.05);
  return { sx: Math.max(0.18, Math.abs(c)), on: c >= 0 };
}

// Elmas ve zümrütün üstünde gezinen parıltı
function mucevherParilti(ctx, now, x) {
  const d = ((now / 900 + x * 0.013) % 1 + 1) % 1; // 0-1 döngü
  if (d > 0.45) return;                            // döngünün yarısından çoğunda parıltı yok (göz yormasın)
  const k = d / 0.45;
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.fillStyle = `rgba(255, 255, 255, ${Math.sin(k * Math.PI)})`;
  animYildiz(ctx, -5 + k * 10, -6 + k * 7, 3.5 * Math.sin(k * Math.PI) + 0.5);
  ctx.restore();
}

// ---- Kısa ömürlü görsel efektler (toplama halkası, boss iniş dalgası) ----
// Oyunun game.effects listesine karışmaz; süre gerçek zamanla ölçülür, süresi dolan çizimde silinir.
const animEfektleri = [];
const TOPLA_RENK = { para: "255, 209, 102", elmas: "96, 165, 250", zumrut: "16, 185, 129", kalp: "239, 68, 68", guc: "253, 224, 71" };

function animEfektEkle(tur, x, y, secenek = {}) {
  if (animEfektleri.length > 60) animEfektleri.shift(); // taşmasın
  animEfektleri.push({ tur, x, y, bas: secenek.now ?? performance.now(), renk: secenek.renk || "255, 255, 255", olcek: secenek.olcek || 1,
    ad: secenek.ad, sure: secenek.sure, boyut: secenek.boyut });
}

function toplamaEfekti(p) {
  if (!p) return;
  // Kalp ve güç yıldızı: ChatGPT toplama kareleri (N13) hazırsa onlar, değilse renkli halka
  const ad = p.kind === "kalp" ? "kalp-topla" : p.kind === "guc" ? "yildiz-topla" : null;
  if (ad && typeof animHazir === "function" && animHazir(ad)) { animEfektEkle("kare", p.x, p.y, { ad, sure: 0.45, boyut: 52 }); return; }
  animEfektEkle("topla", p.x, p.y, { renk: TOPLA_RENK[p.kind] || "255, 255, 255" });
}

function animEfektleriCiz(ctx, now = performance.now()) {
  for (let i = animEfektleri.length - 1; i >= 0; i--) {
    const e = animEfektleri[i];
    const sure = e.tur === "dalga" ? ANIM.dalgaSn : e.tur === "kare" ? (e.sure || 0.4) : ANIM.toplaSn;
    const k = (now - e.bas) / 1000 / sure;
    if (k >= 1 || k < -1) { animEfektleri.splice(i, 1); continue; }
    if (k < 0) continue;
    ctx.save();
    if (e.tur === "kare") {
      // ChatGPT efekt kareleri (vuruş, patlama, buz, toplama): kare hazır değilse hiç çizilmez
      const kare = typeof animBirKez === "function" ? animBirKez(e.ad, k) : 0;
      if (kare) { const b = e.boyut || 40; animCiz(ctx, e.ad, kare, e.x - b / 2, e.y - b / 2, b, b); }
    } else if (e.tur === "topla") {
      const r = 6 + animYumusak(k) * 18;
      ctx.globalAlpha = 1 - k;
      ctx.strokeStyle = `rgb(${e.renk})`;
      ctx.lineWidth = 3 * (1 - k) + 0.5;
      ctx.beginPath();
      ctx.arc(e.x, e.y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = `rgb(${e.renk})`;
      for (let j = 0; j < 6; j++) {
        const aci = j * (Math.PI / 3) + 0.3;
        const yol = 8 + animYumusak(k) * 22;
        animYildiz(ctx, e.x + Math.cos(aci) * yol, e.y + Math.sin(aci) * yol, 3.2 * (1 - k) + 0.4);
      }
    } else if (e.tur === "dalga") {
      const r = (20 + animYumusak(k) * 90) * e.olcek;
      ctx.globalAlpha = (1 - k) * 0.85;
      ctx.strokeStyle = `rgb(${e.renk})`;
      ctx.lineWidth = 6 * (1 - k) + 1;
      ctx.beginPath();
      ctx.ellipse(e.x, e.y, r, r * 0.4, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = (1 - k) * 0.35;
      ctx.beginPath();
      ctx.ellipse(e.x, e.y, r * 0.7, r * 0.28, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

// Avcının dururken hafifçe nefes alması (ayak hizası sabit kalır); yürürken 0
function avciNefes(now, yuruyor) {
  if (yuruyor || animAzHareket()) return 0;
  return Math.sin(now / 1000 * 2.2) * 0.018;
}

// ---- Kasırga (3.18.0) ----
// Kullanıcı: "tornado efekti çok güzel olsun, hayaletleri savura savura yok etsin". Oyuncunun çevresinde iki hortum
// döner; yerde rüzgâr halkası, havada yapraklar ve toz uçuşur. İlk 0,3 sn belirir, son 0,5 sn kaybolur.
const KASIRGA_SURE_MS = 8000;

// Tek hortum: tabandan yukarı genişleyen, kıvrılan halkalar ve yarı saydam gövde
function hortumCiz(ctx, x, y, t, olcek, alfa, az) {
  const boy = 64 * olcek, n = 10;
  // ChatGPT kasırga kareleri (N09 alt sıra) hazırsa onlar
  const kare = typeof animDongu === "function" ? animDongu("kasirga", az ? 0 : t + x * 0.001, 10) : 0;
  if (kare) {
    ctx.save();
    ctx.globalAlpha *= alfa;
    animGovdeCiz(ctx, "kasirga", kare, x - 34 * olcek, y - 66 * olcek, 68 * olcek, 70 * olcek, true);
    ctx.restore();
    return;
  }
  const kay = (k) => (az ? 0 : Math.sin(t * 5 + k * 4.2) * 7 * k * olcek);
  // Gövde: yarı saydam huni
  ctx.save();
  const gr = ctx.createLinearGradient(x, y, x, y - boy);
  gr.addColorStop(0, `rgba(196, 181, 253, ${0.10 * alfa})`);
  gr.addColorStop(1, `rgba(237, 233, 254, ${0.32 * alfa})`);
  ctx.fillStyle = gr;
  ctx.beginPath();
  for (let i = 0; i <= n; i++) { const k = i / n; ctx.lineTo(x + kay(k) - (4 + k * 22) * olcek, y - k * boy); }
  for (let i = n; i >= 0; i--) { const k = i / n; ctx.lineTo(x + kay(k) + (4 + k * 22) * olcek, y - k * boy); }
  ctx.closePath();
  ctx.fill();
  // Dönen halkalar (yarım yaylar, her biri farklı fazda)
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    const rx = (4 + k * 22) * olcek, ry = rx * 0.3;
    const bas = (az ? 0 : t * 10) + i * 0.9;
    ctx.globalAlpha = alfa * (0.45 + 0.45 * (1 - k * 0.6));
    ctx.strokeStyle = i % 2 ? "#f5f3ff" : "#c4b5fd";
    ctx.lineWidth = (1.6 + k * 1.8) * olcek;
    ctx.beginPath();
    ctx.ellipse(x + kay(k), y - k * boy, rx, ry, 0, bas, bas + Math.PI * 1.25);
    ctx.stroke();
  }
  // Tabanda toz
  ctx.globalAlpha = alfa * 0.35;
  ctx.fillStyle = "#ddd6fe";
  ctx.beginPath();
  ctx.ellipse(x, y + 2 * olcek, 14 * olcek, 4.5 * olcek, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function kasirgaCiz(ctx, px, py, now, bitis) {
  const az = animAzHareket();
  const bas = bitis - KASIRGA_SURE_MS;
  const alfa = Math.max(0, Math.min(1, (now - bas) / 300, (bitis - now) / 500));
  if (alfa <= 0) return;
  const t = now / 1000;
  ctx.save();
  // Yerde rüzgâr halkası: dönen kesik yaylar
  const R = (typeof KASIRGA_R === "number" ? KASIRGA_R : 130);
  for (let h = 0; h < 3; h++) {
    const r = R * (0.62 + h * 0.17);
    const don = az ? h : t * (3.2 - h * 0.6) + h * 2;
    ctx.globalAlpha = alfa * (0.38 - h * 0.08);
    ctx.strokeStyle = h === 1 ? "#ede9fe" : "#a78bfa";
    ctx.lineWidth = 3 - h * 0.6;
    for (let j = 0; j < 3; j++) {
      const a0 = don + j * (Math.PI * 2 / 3);
      ctx.beginPath();
      ctx.ellipse(px, py + 10, r, r * 0.42, 0, a0, a0 + 1.1);
      ctx.stroke();
    }
  }
  // Uçuşan yapraklar ve toz: farklı yarıçap ve yükseklikte döner
  for (let i = 0; i < 12; i++) {
    const a = (az ? 0 : t * (2.6 + (i % 3) * 0.7)) + i * 0.52;
    const r = R * (0.45 + ((i * 37) % 50) / 100);
    const yuk = 10 + ((i * 53) % 40);
    const x = px + Math.cos(a) * r, y = py + 10 + Math.sin(a) * r * 0.42 - yuk;
    ctx.globalAlpha = alfa * 0.85;
    if (i % 3 === 0) {
      ctx.fillStyle = i % 2 ? "#84cc16" : "#a16207";
      ctx.beginPath();
      ctx.ellipse(x, y, 4, 2, a * 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = "#f5f3ff";
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // İki hortum oyuncunun çevresinde karşılıklı döner
  const yorunge = az ? 0 : t * 2.2;
  const hortumlar = [0, Math.PI].map((f) => ({ x: px + Math.cos(yorunge + f) * R * 0.66, y: py + 12 + Math.sin(yorunge + f) * R * 0.66 * 0.42 }));
  hortumlar.sort((a, b) => a.y - b.y); // arkadaki önce
  for (const h of hortumlar) hortumCiz(ctx, h.x, h.y, t, 1, alfa, az);
  ctx.restore();
}
