/* ============================================================
   HAYALET AVCILARI — DÜNYA TURU HİKÂYESİ (3.21.0)
   Şartname: HIKAYE.md. Metinler hikaye-veri.js'te; kurallar, hatıra, sahne,
   bilmece ve defter burada. Ağ verisi değişmez: hatıra ve bilmece yereldir.
   ============================================================ */

// Veriye tek kapı: sınama window.HIKAYE_TEST ile büyük bir sahte küme verebilir.
function hikayeVerisi() {
  if (window.HIKAYE_TEST) return Object.assign({ bilmecePara: 100, bilmeceElmas: 2 }, window.HIKAYE_TEST);
  return { avciSirasi: HIKAYE_AVCI_SIRASI, katilisUlke: HIKAYE_KATILIS_ULKE, katilis: HIKAYE_KATILIS, ulke: HIKAYE_ULKE, bilmece: HIKAYE_BILMECE, final: HIKAYE_FINAL, bilmecePara: HIKAYE_BILMECE_PARA, bilmeceElmas: HIKAYE_BILMECE_ELMAS };
}

// Kayıt: turKaydi() hikâye alanlarını doğrular; burada eksik alanlar tamamlanır.
function hikayeKayit() {
  const k = turKaydi();
  if (!k.hatiralar || typeof k.hatiralar !== "object") k.hatiralar = {};
  if (!k.bilmeceler || typeof k.bilmeceler !== "object") k.bilmeceler = {};
  if (!k.sahneler || typeof k.sahneler !== "object") k.sahneler = {};
  if (!k.katilanlar || typeof k.katilanlar !== "object") k.katilanlar = {};
  if (typeof k.gezgin !== "string") k.gezgin = "";
  if (!k.rozet) k.rozet = 0;
  return k;
}

// Gezgin dışındaki avcılar, katılış sırasıyla
function hikayeArkadaslar(v, k) {
  v = v || hikayeVerisi();
  const gezgin = (k || hikayeKayit()).gezgin;
  return (v.avciSirasi || []).filter((a) => a !== gezgin);
}

function hikayeSonArkadas(v, k) {
  v = v || hikayeVerisi();
  k = k || hikayeKayit();
  let ad = null, son = -1;
  for (const a in k.katilanlar) if (k.katilanlar[a] > son) { son = k.katilanlar[a]; ad = a; }
  return ad;
}

function hikayeAvciAdi(key) {
  return (typeof CHARACTERS !== "undefined" && CHARACTERS[key] && CHARACTERS[key].name) || key || "";
}

// ---------- Hatıra: yer, çizim, toplama ----------
// Basit tohumlu sayaç: ülke kodu + bölüm her cihazda aynı yeri verir.
function hikayeTohum(kod, bolum) {
  let h = 2166136261 >>> 0;
  const s = String(kod) + "|" + String(bolum);
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hikayeYerBosta(x, y) {
  const r = 18;
  return !collidesWalls(x, y, r) && !collidesWaters(x, y, r) && !collidesSpikes(x, y, r) && !collidesLavas(x, y, r);
}
function hikayeHatiraYeri(kod, veri) {
  const px = game.player ? game.player.x : game.worldW / 2;
  const py = game.player ? game.player.y : game.worldH / 2;
  const rng = mulberry32(hikayeTohum(kod, game.level));
  let minX = 60, maxX = game.worldW - 60, minY = 60, maxY = game.worldH - 60;
  // Yolculuk haritasında hatıra 1–4. bölgelerden birine (tohumlu) konur
  if (typeof yolculukAcik === "function" && yolculukAcik() && typeof yolculukDuzeni === "function") {
    const d = yolculukDuzeni();
    minX = d.zones[0].x0 + 40; maxX = d.zones[3].x1 - 40;
  }
  for (let i = 0; i < 800; i++) {
    const x = minX + rng() * (maxX - minX), y = minY + rng() * (maxY - minY);
    if (Math.hypot(x - px, y - py) < 300) continue;
    if (!hikayeYerBosta(x, y)) continue;
    return { x, y };
  }
  // Yedek: ızgarayı sabit sırayla tara (yine her cihazda aynı)
  for (let y = minY; y <= maxY; y += 40) {
    for (let x = minX; x <= maxX; x += 40) {
      if (Math.hypot(x - px, y - py) < 300) continue;
      if (hikayeYerBosta(x, y)) return { x, y };
    }
  }
  return { x: Math.min(maxX, px + 320), y: py };
}

let _hikayeParilti = null;
function hikayeParilti() {
  if (_hikayeParilti) return _hikayeParilti;
  const c = document.createElement("canvas");
  c.width = c.height = 96;
  const x = c.getContext("2d");
  const g = x.createRadialGradient(48, 48, 2, 48, 48, 46);
  g.addColorStop(0, "rgba(255, 246, 200, 0.95)");
  g.addColorStop(0.45, "rgba(255, 210, 102, 0.45)");
  g.addColorStop(1, "rgba(255, 210, 102, 0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 96, 96);
  _hikayeParilti = c;
  return c;
}

// Hatıra simgesi: resim varsa <img>, yoksa emoji (esyaSimgesiHTML gibi kaçışlı).
function hikayeHatiraSimgesiHTML(kod, emoji, ad = "") {
  const k = `hatira-${kod}`;
  if (kod && typeof GORSEL_LISTESI === "object" && GORSEL_LISTESI && GORSEL_LISTESI[k]) {
    const guvenliAd = String(ad).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    return `<img class="defter-hatira-resim" src="gorsel/${encodeURIComponent(k)}.webp" alt="${guvenliAd}" draggable="false">`;
  }
  return emoji;
}

// Emoji her karede yazı olarak çizilmez (renkli yazı tipi yazılımla çizilirken pahalı): bir kez küçük tuvale çizilir
const _hikayeSimgeler = new Map();
function hikayeSimgeResmi(simge) {
  let c = _hikayeSimgeler.get(simge);
  if (c) return c;
  c = document.createElement("canvas");
  c.width = c.height = 80;
  const x = c.getContext("2d");
  x.font = "56px serif";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText(simge, 40, 42);
  _hikayeSimgeler.set(simge, c);
  return c;
}

function hikayeCiz(ctx) {
  const h = game.hatira;
  if (!h) return;
  const sn = performance.now() / 1000;
  const bob = Math.sin(sn * 2 + h.x * 0.01) * 4;
  ctx.save();
  ctx.translate(h.x, h.y + bob);
  const g = 32 + Math.sin(sn * 2) * 2;
  ctx.globalAlpha = 0.85 + Math.sin(sn * 2.4) * 0.12;
  ctx.drawImage(hikayeParilti(), -g, -g, g * 2, g * 2);
  ctx.globalAlpha = 1;
  const hatiraResmi = (h.kod && typeof gorsel === "function") ? gorsel(`hatira-${h.kod}`) : null;
  if (hatiraResmi) ctx.drawImage(hatiraResmi, -20, -20, 40, 40);
  else ctx.drawImage(hikayeSimgeResmi(h.simge || "🎁"), -20, -20, 40, 40);
  const a = sn * 1.7;
  ctx.fillStyle = "#fff7cc";
  ctx.beginPath();
  ctx.arc(Math.cos(a) * 22, Math.sin(a) * 22, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function hikayeGuncelle() {
  const h = game.hatira;
  if (!h || !game.player || game.player.dead) return;
  if (Math.hypot(h.x - game.player.x, h.y - game.player.y) < game.player.r + 18) hikayeHatiraTopla();
}

function hikayeHatiraTopla() {
  const h = game.hatira;
  if (!h) return;
  const k = hikayeKayit();
  k.hatiralar[h.kod] = Date.now();
  persistSave();
  showToast(t("🎁 Hatıra: {ad}", { ad: h.ad }));
  if (typeof audio !== "undefined") {
    if (!(audio.hikayeSes && audio.hikayeSes("hatira"))) {
      if (typeof audio.yildiz === "function") audio.yildiz();
      else if (typeof audio.gem === "function") audio.gem();
    }
  }
  if (typeof animEfektEkle === "function") animEfektEkle("topla", h.x, h.y - 10, { renk: "255, 210, 102" });
  else if (typeof spawnHitParticles === "function") spawnHitParticles(h.x, h.y);
  game.hatira = null;
}

// ---------- Duraklatma (duraklatma ekranı göstermeden) ----------
function hikayeDuraklat() {
  if (!game.running || game.paused) return false;
  game.paused = true;
  game._duraklamaBas = performance.now();
  return true;
}
function hikayeDevam(durakladi) {
  if (durakladi) {
    if (game._duraklamaBas) { oyunSaatiniKaydir(performance.now() - game._duraklamaBas); game._duraklamaBas = 0; }
    game.paused = false;
    game.lastFrame = performance.now();
  }
}

// ---------- Sahne penceresi ----------
let _sahne = null;

// Daktilo: satır harf harf yazılır; ilk dokunuş satırı tamamlar, sonraki ilerletir.
let _sahneYazici = 0;
let _sahneYaziTam = "";
let _sahneYaziYaziyor = false;

function hikayeYaziDurdur() {
  if (_sahneYazici) { clearTimeout(_sahneYazici); _sahneYazici = 0; }
  _sahneYaziYaziyor = false;
}

function hikayeYaziTamamla() {
  if (!_sahneYaziYaziyor) return false;
  hikayeYaziDurdur();
  const el = document.querySelector("#hikaye-sahne .hikaye-metin");
  if (el) el.textContent = _sahneYaziTam;
  return true;
}

function hikayeYaziBasla(el, metin) {
  hikayeYaziDurdur();
  _sahneYaziTam = metin;
  if (!el) return;
  const az = typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (az || !metin) { el.textContent = metin; return; }
  _sahneYaziYaziyor = true;
  el.textContent = "";
  // Harf sayısı geçen süreden hesaplanır (28 ms/harf): 3D çizim zamanlayıcıyı geciktirse de yazı geride kalmaz
  const bas = performance.now();
  let i = 0;
  const adim = () => {
    const n = Math.min(metin.length, Math.max(i + 1, Math.floor((performance.now() - bas) / 28)));
    if (n !== i) { i = n; el.textContent = metin.slice(0, i); }
    if (i < metin.length) _sahneYazici = setTimeout(adim, 28);
    else { _sahneYazici = 0; _sahneYaziYaziyor = false; }
  };
  _sahneYazici = setTimeout(adim, 28);
}

// Sahnedeki bir avcı yuvasını doldurur; avcı değiştiyse true (kısa karşıdan karşıya geçiş için).
function hikayeSahneYuvasi(slot, key, ayna) {
  slot.classList.toggle("son", !!ayna);
  const eski = slot.getAttribute("data-avci") || "";
  if (eski === (key || "")) return false;
  if (typeof canliOnizlemeTemizle === "function") canliOnizlemeTemizle(slot);
  slot.textContent = "";
  slot.setAttribute("data-avci", key || "");
  if (key && typeof canliOnizleme === "function") {
    const idx = (typeof save !== "undefined" && save.selectedCostume && save.selectedCostume[key]) || 0;
    canliOnizleme(slot, key, idx, { atis: false });
  }
  return true;
}

function hikayeKonusan(rol, s) {
  const k = hikayeKayit();
  const gezgin = k.gezgin || (typeof save !== "undefined" ? save.selectedChar : "");
  if (rol === "anlatici") return { ad: t("Anlatıcı"), emoji: "📜", key: null };
  if (rol === "gezgin") return { ad: hikayeAvciAdi(gezgin), emoji: "📜", key: gezgin };
  if (rol === "katilan") {
    const a = s && s.katilan;
    return { ad: hikayeAvciAdi(a), emoji: "📜", key: a || null };
  }
  if (rol === "arkadas") {
    const a = hikayeSonArkadas(null, k) || gezgin;
    return { ad: hikayeAvciAdi(a), emoji: "📜", key: a };
  }
  return { ad: "", emoji: "📜", key: null };
}

// Avcı önizlemesi: Karakterler ekranındaki çizimin aynısı (drawCharacter; 3D hazırsa UcAvci, yoksa k3/kar).
// Karta bir kez çizilir (döngü yok); "uc-avci-hazir" gelince yeniden çizilir. 3D kapalıysa da aynı yedek çizim.
const HIKAYE_AVCI_BOY = 96;
function hikayeAvciTuvasiCiz(cv, key) {
  const boy = HIKAYE_AVCI_BOY;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const px = Math.round(boy * dpr);
  if (cv.width !== px || cv.height !== px) { cv.width = px; cv.height = px; }
  const ctx = cv.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, boy, boy);
  if (typeof drawCharacter !== "function") return false;
  const idx = (typeof save !== "undefined" && save.selectedCostume && save.selectedCostume[key]) || 0;
  drawCharacter(ctx, key, idx, boy / 2, boy * 0.62, boy * 0.8, 0);
  return true;
}
// .hikaye-avci[data-avci] yuvalarını tuvalle doldurur (drawCharacter yoksa son çare kart resmi).
function hikayeAvciDoldur(kap) {
  if (!kap || typeof kap.querySelectorAll !== "function") return;
  kap.querySelectorAll(".hikaye-avci[data-avci]").forEach((el) => {
    const key = el.getAttribute("data-avci");
    if (!key) return;
    const varOlan = el.querySelector("canvas.hikaye-avci-tuval");
    if (varOlan) { hikayeAvciTuvasiCiz(varOlan, key); return; }
    el.textContent = "";
    if (typeof drawCharacter === "function") {
      const cv = document.createElement("canvas");
      cv.className = "hikaye-avci-tuval";
      cv.setAttribute("data-avci", key);
      hikayeAvciTuvasiCiz(cv, key);
      el.appendChild(cv);
    } else {
      const im = document.createElement("img");
      im.className = "hikaye-avci-yedek";
      im.src = `gorsel/kart-${encodeURIComponent(key)}.webp`;
      im.alt = "";
      im.onerror = () => { im.style.display = "none"; };
      el.appendChild(im);
    }
  });
}
window.addEventListener("uc-avci-hazir", () => hikayeAvciDoldur(document));

function hikayeSahneGoster(satirlar, secenek) {
  secenek = secenek || {};
  if (!satirlar || !satirlar.length) { if (secenek.bitince) secenek.bitince(); return; }
  hikayeYaziDurdur();
  _sahne = { satirlar, i: 0, katilan: secenek.katilan, bitince: secenek.bitince, durakladi: hikayeDuraklat() };
  const el = document.getElementById("hikaye-sahne");
  if (!el) { hikayeDevam(_sahne.durakladi); _sahne = null; return; }
  if (!(typeof online !== "undefined" && online.mode) && typeof audio !== "undefined" && audio.hikayeSes) {
    audio.hikayeSes(secenek.katilan ? "arkadas" : "sahne");
  }
  el.classList.add("active");
  hikayeSahneCiz();
}

function hikayeSahneCiz() {
  const s = _sahne;
  if (!s) return;
  const el = document.getElementById("hikaye-sahne");
  if (!el) return;
  const satir = s.satirlar[s.i] || { k: "anlatici", m: "" };
  const kim = hikayeKonusan(satir.k, s);
  const gezginKey = hikayeKonusan("gezgin", s).key || "";
  // Sahnedeki ikinci avcı: önce katılan, yoksa son arkadaş, yoksa (varsa) o satırın konuşanı.
  let partner = s.katilan || hikayeSonArkadas(null, hikayeKayit()) || "";
  if (satir.k !== "anlatici" && kim.key && kim.key !== gezginKey) partner = kim.key;
  if (partner === gezginKey) partner = "";
  const anlatim = satir.k === "anlatici";
  const metin = String(satir.m || "");

  let kutu = el.querySelector(".hikaye-kutu");
  if (!kutu) {
    el.innerHTML = `<div class="hikaye-kutu"><div class="hikaye-ust"></div><div class="hikaye-sahne-alan"></div>` +
      `<button class="hikaye-ileri" type="button" aria-label="${escapeHtml(t("Devam"))}">▶</button></div>`;
    kutu = el.querySelector(".hikaye-kutu");
  }
  const ust = kutu.querySelector(".hikaye-ust");
  const alan = kutu.querySelector(".hikaye-sahne-alan");
  if (!ust || !alan) return;

  // Konuşma balonu (konuşan avcıya uzanan kuyruk) ya da anlatıcı parşömen kutusu.
  if (anlatim) {
    ust.innerHTML = `<div class="hikaye-anlatim"><span class="hikaye-anlatim-simge" aria-hidden="true">📜</span>` +
      `<p class="hikaye-metin" dir="auto" aria-hidden="true"></p>` +
      `<span class="hikaye-sr">${escapeHtml(metin)}</span></div>`;
  } else {
    const yon = kim.key === gezginKey ? "sol" : "sag";
    ust.innerHTML = `<div class="hikaye-balon ${yon}"><div class="hikaye-konusan" dir="auto"><bdi>${escapeHtml(kim.ad)}</bdi></div>` +
      `<p class="hikaye-metin" dir="auto" aria-hidden="true"></p>` +
      `<span class="hikaye-sr">${escapeHtml(metin)}</span></div>`;
  }

  // İki avcı yuvası: satır başı (gezgin) ve satır sonu (diğer avcı).
  let bas = alan.querySelector(".hikaye-sahne-avci.bas");
  if (!bas) { bas = document.createElement("div"); bas.className = "hikaye-sahne-avci bas"; alan.appendChild(bas); }
  let son = alan.querySelector(".hikaye-sahne-avci.son");
  hikayeSahneYuvasi(bas, gezginKey, false);
  if (partner) {
    if (!son) { son = document.createElement("div"); son.className = "hikaye-sahne-avci son"; alan.appendChild(son); }
    const degisti = hikayeSahneYuvasi(son, partner, true);
    if (degisti && !anlatim) {
      son.classList.add("degisiyor");
      requestAnimationFrame(() => requestAnimationFrame(() => son.classList.remove("degisiyor")));
    }
  } else if (son) {
    if (typeof canliOnizlemeTemizle === "function") canliOnizlemeTemizle(son);
    son.remove(); son = null;
  }
  alan.classList.toggle("yalniz", !partner);
  alan.classList.toggle("anlatim", anlatim);
  bas.classList.toggle("konusan", !anlatim && !!kim.key && kim.key === gezginKey);
  bas.classList.toggle("dinleyen", !anlatim && (!kim.key || kim.key !== gezginKey));
  if (son) {
    son.classList.toggle("konusan", !anlatim && !!kim.key && kim.key === partner);
    son.classList.toggle("dinleyen", !anlatim && (!kim.key || kim.key !== partner));
  }
  const konusan = anlatim ? null : (kim.key === gezginKey ? bas : (son && kim.key === partner ? son : null));
  if (konusan) {
    konusan.classList.remove("zipla");
    void konusan.offsetWidth;
    konusan.classList.add("zipla");
  }

  hikayeYaziBasla(ust.querySelector(".hikaye-metin"), metin);
}

function hikayeSahneIleri() {
  if (!_sahne) return;
  if (hikayeYaziTamamla()) return;
  if (_sahne.i < _sahne.satirlar.length - 1) { _sahne.i++; hikayeSahneCiz(); return; }
  hikayeSahneKapat();
}

function hikayeSahneKapat() {
  const s = _sahne;
  _sahne = null;
  hikayeYaziDurdur();
  const el = document.getElementById("hikaye-sahne");
  if (el) {
    if (typeof canliOnizlemeTemizle === "function") canliOnizlemeTemizle(el);
    el.classList.remove("active");
    el.innerHTML = "";
  }
  if (s) {
    hikayeDevam(s.durakladi);
    if (s.bitince) s.bitince();
  }
}

// Oyun biterken, menüye dönülürken ya da yeni oyun başlarken (turPerdeleriniKapat): açık sahne ve bilmece sessizce kapanır,
// devam işleri çağrılmaz (oyun zaten kapanıyor ya da baştan kuruluyor).
function hikayePencereleriKapat() {
  _sahne = null;
  _bilmece = null;
  hikayeYaziDurdur();
  for (const id of ["hikaye-sahne", "hikaye-bilmece"]) {
    const el = document.getElementById(id);
    if (el) {
      if (typeof canliOnizlemeTemizle === "function") canliOnizlemeTemizle(el);
      el.classList.remove("active");
      el.innerHTML = "";
    }
  }
}

// ---------- Bilmece ----------
let _bilmece = null;
const _bilmeceTeklif = {};

function hikayeBilmeceDurumu(n, k) {
  k = k || hikayeKayit();
  if (k.bilmeceler[String(n)]) return "solved";
  const bas = 5 * (n - 1) + 1, son = 5 * n;
  for (let s = bas; s <= son; s++) {
    if (s > (typeof ULKE_SAYISI === "number" ? ULKE_SAYISI : 51)) return "locked";
    const u = ulkeSirada(s);
    if (!u || !k.hatiralar[u.kod]) return "locked";
  }
  return "solvable";
}

function hikayeCozulebilirBilmece(k, teklifEt) {
  const v = hikayeVerisi();
  for (let n = 1; n <= (v.bilmece || []).length; n++) {
    if (hikayeBilmeceDurumu(n, k) !== "solvable") continue;
    if (teklifEt && _bilmeceTeklif[n]) continue;
    if (teklifEt) _bilmeceTeklif[n] = 1;
    return n;
  }
  return 0;
}

function hikayeBilmeceAc(n, bitince) {
  const v = hikayeVerisi();
  const b = (v.bilmece || [])[n - 1];
  if (!b) { if (bitince) bitince(); return; }
  _bilmece = { n, b, bitince: bitince || null, durakladi: hikayeDuraklat() };
  const el = document.getElementById("hikaye-bilmece");
  if (!el) { hikayeDevam(_bilmece.durakladi); _bilmece = null; return; }
  if (!(typeof online !== "undefined" && online.mode) && typeof audio !== "undefined" && audio.hikayeSes) audio.hikayeSes("harita");
  const secenekler = (b.secenek || []).map((s, i) =>
    `<button class="hikaye-secenek" type="button" data-i="${i}" dir="auto"><bdi>${escapeHtml(s)}</bdi></button>`).join("");
  el.innerHTML = `<div class="hikaye-kutu">` +
    `<div class="hikaye-konusan">🔎 ${escapeHtml(t("Bilmece"))}</div>` +
    `<p class="hikaye-metin hikaye-bilmece-soru" dir="auto">${escapeHtml(b.soru || "")}</p>` +
    `<div class="hikaye-secenekler">${secenekler}</div>` +
    `<button class="hikaye-sonra" type="button">${escapeHtml(t("Sonra"))}</button>` +
    `</div>`;
  el.classList.add("active");
  el.querySelectorAll(".hikaye-secenek").forEach((btn) => {
    btn.addEventListener("click", () => hikayeBilmeceSec(Number(btn.dataset.i), btn));
  });
  const sonra = el.querySelector(".hikaye-sonra");
  if (sonra) sonra.addEventListener("click", () => hikayeBilmeceKapat(true));
}

function hikayeBilmeceSec(i, btn) {
  if (!_bilmece) return false;
  const { n, b } = _bilmece;
  if (Number(i) === Number(b.dogru)) {
    if (!(typeof online !== "undefined" && online.mode) && typeof audio !== "undefined" && audio.hikayeSes) audio.hikayeSes("dogru");
    const k = hikayeKayit();
    k.bilmeceler[String(n)] = Date.now();
    const vv = hikayeVerisi();
    const para = vv.bilmecePara, elmas = vv.bilmeceElmas;
    save.para = (save.para || 0) + para;
    save.elmas = (save.elmas || 0) + elmas;
    persistSave();
    showToast(t("🎁 Ödül: {para} 💰 + {elmas} 💎", { para, elmas }));
    const v = vv;
    const hepsi = (v.bilmece || []).length > 0 && (v.bilmece || []).every((_, j) => k.bilmeceler[String(j + 1)]);
    if (hepsi && !k.rozet) {
      k.rozet = Date.now(); persistSave(); showToast(t("🧭 Gezgin rozeti!"));
      if (!(typeof online !== "undefined" && online.mode) && typeof audio !== "undefined" && audio.hikayeSes) setTimeout(() => audio.hikayeSes("rozet"), 700);
    }
    const bolum = (b.bolum || []).map((m) => ({ k: "anlatici", m }));
    const devam = _bilmece.bitince;
    hikayeBilmeceKapat(false);
    if (bolum.length) hikayeSahneGoster(bolum, { bitince: devam });
    else if (devam) devam();
    return true;
  }
  if (!(typeof online !== "undefined" && online.mode) && typeof audio !== "undefined" && audio.hikayeSes) audio.hikayeSes("yanlis");
  if (btn) {
    btn.classList.remove("salla");
    void btn.offsetWidth;
    btn.classList.add("salla");
  }
  return false;
}

function hikayeBilmeceKapat(devamEt) {
  const b = _bilmece;
  _bilmece = null;
  const el = document.getElementById("hikaye-bilmece");
  if (el) { el.classList.remove("active"); el.innerHTML = ""; }
  if (!b) return;
  hikayeDevam(b.durakladi);
  if (devamEt && b.bitince) b.bitince();
}

// ---------- Bölüm başlangıcı: hatıra, gezgin, katılış, sahneler ----------
let _hikayeOyuncu = null;

function hikayeAdimlariCalistir(adimlar, bitince) {
  let i = 0;
  const sonraki = () => {
    if (i >= adimlar.length) { if (bitince) bitince(); return; }
    const a = adimlar[i++];
    a(sonraki);
  };
  sonraki();
}

function hikayeBolumBasladi() {
  game.hatira = null;
  if (!game.dunyaTuru) return;
  const u = typeof turUlkesi === "function" ? turUlkesi() : null;
  if (!u) return;
  if (game.player !== _hikayeOyuncu) { _hikayeOyuncu = game.player; for (const a in _bilmeceTeklif) delete _bilmeceTeklif[a]; }
  const v = hikayeVerisi();
  const k = hikayeKayit();
  const secili = (typeof save !== "undefined" && save.selectedChar) || "";
  let degisti = false;
  if (!k.gezgin && secili) { k.gezgin = secili; degisti = true; }
  const arkadaslar = hikayeArkadaslar(v, k);
  let yeniKatilan = null;
  const j = (v.katilisUlke || []).indexOf(u.sira);
  if (j >= 0) {
    const a = arkadaslar[j];
    if (a && !k.katilanlar[a]) { k.katilanlar[a] = Date.now(); yeniKatilan = a; degisti = true; }
    else if (a) yeniKatilan = a;
  }
  if (degisti) persistSave();
  const veri = (v.ulke || {})[u.kod];
  if (veri && veri.hatira && !k.hatiralar[u.kod]) {
    const yer = hikayeHatiraYeri(u.kod, veri);
    game.hatira = { kod: u.kod, x: yer.x, y: yer.y, simge: veri.hatira.simge || "🎁", ad: veri.hatira.ad || "" };
  }
  if (online.mode) return;
  if (k.sahneler[u.kod]) return;
  // Geliştirici anahtarı: hikâyeyi denemeyen sınamalar sahneyi kendiliğinden açtırmaz (hatıra yine konur)
  try { if (localStorage.getItem("hayaletAvcilariHikayeSahnesiz") === "1") return; } catch (_) {}
  const adimlar = [];
  const n = hikayeCozulebilirBilmece(k, true);
  if (n) adimlar.push((devam) => hikayeBilmeceAc(n, devam));
  if (yeniKatilan && (v.katilis || {})[yeniKatilan]) {
    const satirlar = v.katilis[yeniKatilan];
    adimlar.push((devam) => hikayeSahneGoster(satirlar, { katilan: yeniKatilan, bitince: devam }));
  }
  if (veri && veri.sahne) {
    const satirlar = veri.sahne;
    adimlar.push((devam) => hikayeSahneGoster(satirlar, { bitince: devam }));
  }
  hikayeAdimlariCalistir(adimlar, () => { hikayeKayit().sahneler[u.kod] = 1; persistSave(); });
}

// ---------- Final ----------
function hikayeFinalHazir() {
  const v = hikayeVerisi(), k = hikayeKayit();
  if (!(v.final || []).length) return false;
  if (!k.hatiralar.AR) return false;
  return (v.bilmece || []).every((_, n) => k.bilmeceler[String(n + 1)]);
}

function hikayeFinalGoster(bitince) {
  const v = hikayeVerisi();
  if (!(typeof online !== "undefined" && online.mode) && typeof audio !== "undefined" && audio.hikayeSes) audio.hikayeSes("fener");
  const sar = bitince;
  hikayeSahneGoster(v.final, {
    bitince: () => {
      if (!(typeof online !== "undefined" && online.mode) && typeof audio !== "undefined" && audio.hikayeSes) audio.hikayeSes("eve-donus");
      if (sar) sar();
    },
  });
}

function hikayeFinalOku(bitince) {
  if (!hikayeFinalHazir()) return;
  hikayeFinalGoster(bitince || (() => {}));
}

// ---------- Defter ----------
function hikayeKartHtml(key, sinif) {
  const ad = hikayeAvciAdi(key) || key || "";
  return `<div class="defter-arkadas ${sinif || ""}"><span class="hikaye-avci defter-avci" data-avci="${escapeHtml(key)}"></span>` +
    `<small dir="auto"><bdi>${escapeHtml(ad)}</bdi></small></div>`;
}

function hikayeDefterCiz() {
  const el = document.getElementById("tur-defter");
  if (!el) return;
  const v = hikayeVerisi(), k = hikayeKayit();
  const arkadaslar = hikayeArkadaslar(v, k);
  const gezgin = k.gezgin || (save.selectedChar || "");
  let html = `<div class="defter-bolum"><h3>🧑‍🤝‍🧑 ${escapeHtml(t("Yol arkadaşları"))}</h3><div class="defter-arkadaslar">`;
  if (gezgin) html += hikayeKartHtml(gezgin, "gezgin");
  for (const a of arkadaslar) {
    if (k.katilanlar[a]) html += hikayeKartHtml(a);
    else html += `<div class="defter-arkadas kilit"><span aria-hidden="true">🔒</span><small>${escapeHtml(t("Yolda"))}</small></div>`;
  }
  html += `</div></div>`;
  // 51 hatıra yuvası
  html += `<div class="defter-bolum"><h3>🎁 ${escapeHtml(t("Hatıralar"))}</h3><div class="defter-izgara">`;
  for (let s = 1; s <= ULKE_SAYISI; s++) {
    const u = ulkeSirada(s), veri = u && (v.ulke || {})[u.kod];
    const kod = u ? u.kod : "";
    if (veri && k.hatiralar[kod]) {
      html += `<button class="defter-yuva dolu" type="button" onclick="hikayeHatiraTikla('${kod}')">` +
        `<span class="defter-simge" aria-hidden="true">${hikayeHatiraSimgesiHTML(kod, veri.hatira.simge || "🎁", veri.hatira.ad || "")}</span>` +
        `<bdi class="defter-ad">${escapeHtml(veri.hatira.ad || "")}</bdi></button>`;
    } else {
      html += `<button class="defter-yuva bos" type="button" onclick="hikayeHatiraTikla('${kod}')">` +
        `<span class="defter-simge" aria-hidden="true">❔</span><span class="defter-sira">${s}</span></button>`;
    }
  }
  html += `</div><div id="defter-tip" class="defter-tip" hidden></div></div>`;
  // Bilmeceler
  html += `<div class="defter-bolum"><h3>🔎 ${escapeHtml(t("Bilmeceler"))}</h3><div class="defter-bilmece-liste">`;
  for (let n = 1; n <= (v.bilmece || []).length; n++) {
    const dur = hikayeBilmeceDurumu(n, k);
    if (dur === "solved") html += `<button class="defter-bilmece cozuldu" type="button" onclick="hikayeBolumOku(${n})">✅ ${n}</button>`;
    else if (dur === "solvable") html += `<button class="defter-bilmece hazir" type="button" onclick="hikayeBilmeceAc(${n})">❓ ${n}</button>`;
    else html += `<span class="defter-bilmece kilit">🔒 ${n}</span>`;
  }
  html += `</div></div>`;
  // Final ve rozet
  if (hikayeFinalHazir()) html += `<button class="btn btn-play defter-final" type="button" onclick="hikayeFinalOku()">▶ ${escapeHtml(t("Final"))}</button>`;
  if (k.rozet) html += `<div class="defter-rozet" dir="auto">🧭 ${escapeHtml(t("Gezgin rozeti"))}</div>`;
  el.innerHTML = html;
  hikayeAvciDoldur(el);
}

function hikayeHatiraTikla(kod) {
  const tip = document.getElementById("defter-tip");
  if (!tip) return;
  const v = hikayeVerisi(), k = hikayeKayit();
  const u = kod ? ulkeKodla(kod) : null, veri = u && (v.ulke || {})[u.kod];
  if (!veri) { tip.hidden = true; tip.innerHTML = ""; return; }
  const varMi = !!k.hatiralar[kod];
  let html = varMi
    ? `<div class="defter-tip-simge">${hikayeHatiraSimgesiHTML(kod, veri.hatira.simge || "🎁", veri.hatira.ad || "")}</div>`
    : "";
  html += `<p dir="auto">${escapeHtml(varMi ? (veri.hatira.not || "") : t("Henüz bulunmadı."))}</p>`;
  if (varMi && k.sahneler[kod] && veri.sahne) {
    html += `<button class="btn-tiny" type="button" onclick="hikayeUlkeSahnesi('${kod}')">▶ ${escapeHtml(t("Sahne"))}</button>`;
  }
  tip.innerHTML = html;
  tip.hidden = false;
}

function hikayeUlkeSahnesi(kod) {
  const v = hikayeVerisi();
  const veri = (v.ulke || {})[kod];
  if (!veri || !veri.sahne) return;
  hikayeSahneGoster(veri.sahne, {});
}

function hikayeBolumOku(n) {
  const v = hikayeVerisi();
  const b = (v.bilmece || [])[n - 1];
  if (!b || !(b.bolum || []).length) return;
  hikayeSahneGoster(b.bolum.map((m) => ({ k: "anlatici", m })), {});
}

// Pencere olayları: sahne her yere dokununca ilerler
(function () {
  const el = document.getElementById("hikaye-sahne");
  if (el) el.addEventListener("click", hikayeSahneIleri);
})();
