/* ============================================================
   HAYALET AVCILARI — DÜNYA TURU: KİP, KAYIT VE EKRANLAR (3.14.0)
   Kayıt save.dunyaTuru = { acik, damgalar, bitti }:
   - acik: en ileri açık ülkenin rota sırası (1–51); bu sıraya kadar her ülke açıktır
   - damgalar: { "FR": <ilk damganın zamanı ms>, … } ISO koduyla (rota değişse de kaybolmaz)
   - bitti: dünya turunun ilk tamamlandığı zaman (ms); 0 = tamamlanmadı
   Yeni damga +3 💎 verir. Eski sürümün yedeğinde alan yoksa ya da yeni sürümün yedeğinde bilinmeyen kod varsa kayıt
   temizlenerek açılır. Tasarım: docs/superpowers/specs/2026-10-24-hayalet-ulkeler-design.md §3
   ulkeler.js'ten sonra, game.js'ten önce yüklenir (loadSave turKaydiniTemizle'yi çağırır).
   ============================================================ */

const TUR_DAMGA_ELMAS = 3;

function turKaydiniTemizle(v) {
  const k = v && typeof v === "object" ? v : {};
  const acik = Math.max(1, Math.min(ULKE_SAYISI, Math.floor(Number(k.acik)) || 1));
  const damgalar = {};
  if (k.damgalar && typeof k.damgalar === "object") {
    for (const [kod, zaman] of Object.entries(k.damgalar)) if (ulkeKodla(kod) && Number.isFinite(zaman)) damgalar[kod] = zaman;
  }
  const bitti = Number.isFinite(k.bitti) && k.bitti > 0 ? k.bitti : 0;
  return { acik, damgalar, bitti };
}

function turKaydi() {
  save.dunyaTuru = turKaydiniTemizle(save.dunyaTuru);
  return save.dunyaTuru;
}

// Ülkenin damgasını basar; ilk damgada +3 💎. Sıradaki ülke açılır (acik = max(acik, sıra + 1), en çok 51).
function damgaBas(kod) {
  const u = ulkeKodla(kod);
  if (!u) return { yeni: false };
  const k = turKaydi();
  const yeni = !k.damgalar[kod];
  if (yeni) {
    k.damgalar[kod] = Date.now();
    save.elmas = (save.elmas || 0) + TUR_DAMGA_ELMAS;
  }
  k.acik = Math.max(k.acik, Math.min(ULKE_SAYISI, u.sira + 1));
  persistSave();
  return { yeni };
}

// ---------- Kip ----------
// Dünya Turu'nda oynanan ülke (bölüm numarası = rota sırası); normal oyunda null
function turUlkesi() {
  return typeof game !== "undefined" && game.dunyaTuru ? ulkeSirada(game.level) : null;
}

// Dünya Turu zemini: ailenin zemin(ctx, boyut, palet) ressamı 96 px'lik desen tuvaline bir kez çizer (önbellek ülke kodu
// ve ölçekle). Tuval önce ülkenin zemin rengiyle dolar, ressam yalnız soluk deseni çizer. Desen dünya alanına tek dolguyla
// döşenir ve true döner. Ressam yoksa (ya da tuval kurulamazsa) false: render bugünkü zemini ve ızgarayı çizer.
// Desen tuvali çizilen tuvalin cihaz ölçeğinde kurulur (bir desen pikseli bir cihaz pikseli; döşemenin dünya boyu
// n / ölçek, 96'dan en çok yarım cihaz pikseli farklı) ve her karede cihaz pikseline hizalanır (engel resimlerindeki
// bas() gibi; en çok yarım cihaz pikseli kayar): kamera kesirli konumdayken desen süzgeçle taranmaz. Telefonda ölçek dpr,
// tablette dpr × 1,35 (1,35 ya da 2,7). Hizasız dolgu yazılımsal taramada ekranın tamamında karede birkaç ms tutar
// (kamera kayarken kare hızı yarıya iner). Tuval döndürülmüş ya da eşit ölçeksizse desen engelOlcegi()'nde, hizasız.
const TUR_ZEMIN_BOYUT = 96;
let _turZemini = null; // { anahtar, desen, k: desen tuvalinin birim başına pikseli, hizali }
function turZeminCiz(ctx) {
  const u = turUlkesi(), a = u && window.ULKE_AILELERI[u.aile];
  if (!a || typeof a.zemin !== "function") return false;
  // Desen dönüşümü olmayan tarayıcıda tuval ölçeksiz çizilir (döşeme 96 birimde kalsın)
  const donusum = typeof DOMMatrix === "function" && typeof CanvasPattern !== "undefined" && !!CanvasPattern.prototype.setTransform
    && typeof ctx.getTransform === "function";
  const m = donusum ? ctx.getTransform() : null;
  const hizali = !!m && m.b === 0 && m.c === 0 && m.a === m.d && m.a > 0;
  const s = !donusum ? 1 : hizali ? m.a : engelOlcegi(), anahtar = u.kod + "|" + s + "|" + hizali;
  if (!_turZemini || _turZemini.anahtar !== anahtar) {
    _turZemini = { anahtar, desen: null, k: 1, hizali };
    try {
      const n = Math.max(1, Math.round(TUR_ZEMIN_BOYUT * s)), c = document.createElement("canvas");
      c.width = n; c.height = n;
      const cx = c.getContext("2d"), palet = ulkeEngelSeti(u.kod).palet;
      cx.scale(n / TUR_ZEMIN_BOYUT, n / TUR_ZEMIN_BOYUT);
      cx.fillStyle = palet.zemin; cx.fillRect(0, 0, TUR_ZEMIN_BOYUT, TUR_ZEMIN_BOYUT);
      a.zemin(cx, TUR_ZEMIN_BOYUT, palet);
      _turZemini.k = hizali ? s : n / TUR_ZEMIN_BOYUT;
      _turZemini.desen = ctx.createPattern(c, "repeat");
    } catch (_) { _turZemini.desen = null; }
  }
  const desen = _turZemini.desen;
  if (!desen) return false;
  if (donusum) {
    const k = _turZemini.k;
    desen.setTransform(new DOMMatrix(hizali
      ? [1 / k, 0, 0, 1 / k, (Math.round(m.e) - m.e) / m.a, (Math.round(m.f) - m.f) / m.d]
      : [1 / k, 0, 0, 1 / k, 0, 0]));
  }
  ctx.fillStyle = desen;
  ctx.fillRect(0, 0, game.worldW, game.worldH);
  return true;
}

// ---------- Küçük resim ve damga ----------
// Ülkenin 1. objesi 96 birimlik kutuda 128 px tuvale çizilir (canlı süsler zaman 0'daki hâliyle); dataURL önbellekte.
// Ressamı henüz olmayan ülkede boş dize (kart yer tutucu gösterir).
const TUR_RESIM_BIRIM = 96, TUR_RESIM_PIKSEL = 128;
const _kucukResimler = new Map();
function ulkeKucukResmi(u) {
  if (!u) return "";
  if (_kucukResimler.has(u.kod)) return _kucukResimler.get(u.kod);
  let url = "";
  const set = ulkeEngelSeti(u.kod);
  if (set && typeof set.obje1 === "function") {
    try {
      const B = TUR_RESIM_BIRIM, o = engelOlustur({ x: 0, y: 0, w: B, h: B }, "obje1", u.kod, 1000 + u.sira);
      const c = document.createElement("canvas");
      c.width = c.height = TUR_RESIM_PIKSEL;
      const cx = c.getContext("2d");
      cx.scale(TUR_RESIM_PIKSEL / B, TUR_RESIM_PIKSEL / B);
      for (const k of engelBoya(cx, o)) { const f = ENGEL_CANLI[k.tur]; if (f) f(cx, k.x, k.y, 0, k.n || 0, k); }
      url = c.toDataURL("image/png");
    } catch (_) { url = ""; }
  }
  _kucukResimler.set(u.kod, url);
  return url;
}

// Damga (spec §4.4): mürekkep görünümlü, hafif eğik oval; üst yayda ülke adı, ortada küçük resim, altta rota sırası.
// Renk ve eğim rota sırasından gelir (her cihazda aynı). Mürekkep pürüzü index.html'deki #tur-murekkep süzgecidir.
const TUR_MUREKKEPLER = ["#b3261e", "#1d4ed8", "#047857", "#7c3aed", "#b45309", "#be185d"];
const damgaAcisi = (u) => ((u.sira * 37) % 15) - 7; // −7°…+7°
let _damgaNo = 0;
function damgaSvg(u) {
  const renk = TUR_MUREKKEPLER[u.sira % TUR_MUREKKEPLER.length];
  const yay = "tur-yay-" + (++_damgaNo), resim = ulkeKucukResmi(u);
  return `<svg class="damga-svg" viewBox="0 0 120 90" style="color:${renk};--aci:${damgaAcisi(u)}deg" role="img" aria-label="${escapeHtml(u.ad)}">` +
    `<g filter="url(#tur-murekkep)" fill="none" stroke="currentColor">` +
    `<ellipse cx="60" cy="45" rx="56" ry="41" stroke-width="3.2"/><ellipse cx="60" cy="45" rx="50" ry="35" stroke-width="1"/>` +
    `<path id="${yay}" d="M 20 47 A 40 28 0 0 1 100 47" stroke="none"/>` +
    `<text class="damga-ad" fill="currentColor" stroke="none"><textPath href="#${yay}" startOffset="50%" text-anchor="middle">${escapeHtml(u.ad)}</textPath></text>` +
    `<text class="damga-sira" x="60" y="77" text-anchor="middle" fill="currentColor" stroke="none">${u.sira}</text>` +
    `</g>` +
    (resim ? `<image href="${resim}" x="43" y="36" width="34" height="34"/>` : "") +
    `</svg>`;
}
// Uzun ad yaya sığmazsa sıkıştırılır (öğe görünür olmalı: gizliyken uzunluk 0 ölçülür)
function damgaYazilariniSigdir(kok) {
  kok.querySelectorAll(".damga-ad").forEach((tx) => {
    try {
      if (tx.getComputedTextLength() > 92) { tx.setAttribute("textLength", "92"); tx.setAttribute("lengthAdjust", "spacingAndGlyphs"); }
    } catch (_) {}
  });
}

// ---------- Perdeler: damga (0,9 sn) ve uçak geçişi (1,5 sn) ----------
// Perde dokunuşu geçirir (oyun sürer). Her açılış yeni numara alır; eski zamanlayıcı yeni perdeyi kapatmaz.
const TUR_DAMGA_MS = 900, TUR_BEKLE_MS = 1800, TUR_UCAK_MS = 1500;
let _perdeNo = 0;
function perdeAc(el) {
  turPerdeleriniKapat();
  el.classList.add("active");
  return _perdeNo;
}
function turPerdeleriniKapat() {
  _perdeNo++;
  document.querySelectorAll(".tur-perde").forEach((p) => p.classList.remove("active"));
}
function damgaGoster(u) {
  const el = document.getElementById("tur-damga");
  // Perdede kâğıt kutunun kendisi eğilir ve basılır (içindeki damga kutudan taşmasın)
  el.innerHTML = `<div class="tur-perde-kutu tur-damga-kutu" style="--aci:${damgaAcisi(u)}deg">${damgaSvg(u)}</div>`;
  const no = perdeAc(el);
  damgaYazilariniSigdir(el);
  setTimeout(() => { if (_perdeNo === no) el.classList.remove("active"); }, TUR_DAMGA_MS);
}
// İki ülke adı arasında kesikli çizgide uçak; bitince perde kapanır ve bitince() çağrılır
function ucakGecisi(onceki, sonraki, bitince) {
  const el = document.getElementById("tur-gecis");
  const ad = (u, sinif) => `<div class="tur-gecis-ad ${sinif}"><span class="tur-gecis-sira">${u.sira}</span> <bdi>${escapeHtml(u.ad)}</bdi></div>`;
  el.innerHTML = `<div class="tur-perde-kutu tur-gecis-kutu">${ad(onceki, "bas")}<div class="tur-gecis-yol"><span class="tur-ucak">✈️</span></div>${ad(sonraki, "son")}</div>`;
  const no = perdeAc(el);
  game._turSonraki = sonraki;
  turMuzigiBaslat(sonraki.kod); // teaser uçakla başlar, tanıtım bildirimine sarkar (muzik.js)
  setTimeout(() => {
    if (_perdeNo === no) el.classList.remove("active");
    if (bitince) bitince();
  }, TUR_UCAK_MS);
}

// Şu an müziği çalması gereken ülke (ses açılınca): geçişte uçaktaki sıradaki ülke, damga anında hiçbiri (biten ülkenin
// müziği damgayla söner); geçiş yoksa bulunulan ülke. Oyun yoksa ya da normal oyunda null.
function turMuzikUlkesi() {
  if (!game.running) return null;
  return game._turGeciste ? game._turSonraki || null : turUlkesi();
}

// ---------- Akış: ülke bitti → damga → uçak → sıradaki ülke ----------
// ms oyun süresi sonra fn (duraklatılan süre sayılmaz; süre dolsa da duraklatılmış oyunda devamı beklenir: uçak
// sırasında duraklatılan oyunda bölüm duraklatma ekranının arkasında değişmez). Oyun bittiyse ya da yeni oyun başladıysa
// (startGame jetonu siler) iptal: eski geçiş yeni oyunu ilerletmez. Perdeleri oyunSonu, quitToMenu ve startGame kapatır.
function turSonra(ms, jeton, fn) {
  let kalan = ms, once = performance.now();
  (function tik() {
    if (!game.running || game._turJeton !== jeton) return;
    const simdi = performance.now();
    if (!game.paused) kalan -= simdi - once;
    once = simdi;
    if (kalan <= 0 && !game.paused) fn(); else setTimeout(tik, Math.max(16, Math.min(kalan, 100)));
  })();
}
// Tek kişilik oyunda ve kurucuda boss ve hayaletler bitince (game.js döngüsü). Bir geçiş bir kez çalışır.
function turUlkesiBitti() {
  const u = turUlkesi();
  if (!u || game._turGeciste) return;
  game._turGeciste = true;
  game._turSonraki = null;
  const jeton = (game._turJeton = {});
  if (game._turDamgali !== u.kod) { // istemciyken damgası basılmış ülke (geçişin ortasında host olan) tekrar basılmaz
    game._turDamgali = u.kod;
    const { yeni } = damgaBas(u.kod);
    showToast(t("🛂 {ulke} damgası!", { ulke: u.ad }) + (yeni ? ` +${TUR_DAMGA_ELMAS} 💎` : ""));
    damgaGoster(u);
  }
  turMuzigiSondur(); // ülkenin müziği damgayla söner
  turSonra(TUR_BEKLE_MS, jeton, () => {
    if (u.sira >= ULKE_SAYISI) { turTamamlandi(); return; }
    ucakGecisi(u, ulkeSirada(u.sira + 1), () => turSonra(0, jeton, () => nextLevel()));
  });
}
// 51. ülke bitti. Tek kişilikte oyun sonu; çevrimiçi kurucu durumda bölümü 52 yazar (istemciler turu tamamlar) ve 2 sn
// sonra turu bitirir (oda level'i 1'e döner).
function turTamamlandi() {
  if (online.mode === "client") return;
  const k = turKaydi();
  if (!k.bitti) { k.bitti = Date.now(); persistSave(); }
  game.turBitti = true;
  if (online.mode === "host") {
    showToast(t("🌍 Dünya turu tamamlandı!"));
    setTimeout(() => { if (game.running && online.mode === "host") turuBitir(); }, 2000);
    return;
  }
  oyunSonu(true, false);
}
// Oyun sonundaki "🔁 Tekrar Oyna": Dünya Turu'nda kalınan ülkeden (tur bittiyse Dünya Turu ekranı), normal oyunda baştan
function tekrarOyna() {
  if (!game.dunyaTuru) { startGame(); return; }
  if (game.turBitti) { openDunyaTuru(); return; }
  startGame({ tur: true, ulke: Math.min(game.level, ULKE_SAYISI) });
}

// ---------- Ekran: rota ve pasaport (spec §3, §5.6) ----------
const TUR_DURUM_SIMGE = { kilitli: "🔒", acik: "✈️", damgali: "🛂" };
let _turSecili = 1;
function turDurumu(u, k) {
  return k.damgalar[u.kod] ? "damgali" : u.sira <= k.acik ? "acik" : "kilitli";
}
function openDunyaTuru() {
  _turSecili = turKaydi().acik;
  showScreen("screen-dunya-turu");
  renderDunyaTuru();
  turSekmesi("rota");
  const liste = document.getElementById("tur-liste"), kart = liste.querySelector(".tur-kart.secili");
  if (kart) liste.scrollTop = kart.offsetTop - (liste.clientHeight - kart.offsetHeight) / 2;
}
function renderDunyaTuru() {
  const k = turKaydi();
  document.getElementById("tur-sayac").textContent = `🛂 ${Object.keys(k.damgalar).length}/${ULKE_SAYISI}`;
  const kitalar = { avrupa: t("Avrupa"), afrika: t("Afrika"), asya: t("Asya"), amerika: t("Amerika") };
  let html = "", kita = null;
  for (const u of ULKELER) {
    if (u.kita !== kita) { kita = u.kita; html += `<h3 class="tur-kita">${kitalar[kita]}</h3>`; }
    const durum = turDurumu(u, k), resim = ulkeKucukResmi(u);
    html += `<button class="tur-kart ${durum}${u.sira === _turSecili ? " secili" : ""}" data-sira="${u.sira}" onclick="turUlkeSec(${u.sira})"` +
      `${durum === "kilitli" ? ' aria-disabled="true"' : ""}><span class="tur-sira">${u.sira}</span>` +
      (resim ? `<img class="tur-resim" src="${resim}" alt="">` : `<span class="tur-resim bos" aria-hidden="true"></span>`) +
      `<bdi class="tur-ad">${escapeHtml(u.ad)}</bdi><span class="tur-durum">${TUR_DURUM_SIMGE[durum]}</span></button>`;
  }
  document.getElementById("tur-liste").innerHTML = html;
}
function turSekmesi(ad) {
  const pasaport = ad === "pasaport";
  document.querySelectorAll("#screen-dunya-turu .lb-tab").forEach((b) => b.classList.toggle("active", b.dataset.sekme === (pasaport ? "pasaport" : "rota")));
  document.getElementById("tur-liste").style.display = pasaport ? "none" : "";
  const pp = document.getElementById("tur-pasaport");
  pp.style.display = pasaport ? "" : "none";
  if (pasaport) {
    const k = turKaydi();
    pp.innerHTML = ULKELER.map((u) => (k.damgalar[u.kod]
      ? `<div class="damga">${damgaSvg(u)}</div>`
      : `<div class="damga bos"><span>${u.sira}</span></div>`)).join("");
    damgaYazilariniSigdir(pp);
  }
}
// Kilitli kart seçilmez (kart kısa bir sallanmayla cevap verir)
function turUlkeSec(n) {
  const u = ulkeSirada(n);
  const kart = document.querySelector(`#tur-liste .tur-kart[data-sira="${u.sira}"]`);
  if (turDurumu(u, turKaydi()) === "kilitli") {
    if (kart) { kart.classList.remove("salla"); void kart.offsetWidth; kart.classList.add("salla"); }
    return;
  }
  _turSecili = u.sira;
  document.querySelectorAll("#tur-liste .tur-kart").forEach((el) => el.classList.toggle("secili", +el.dataset.sira === _turSecili));
}
function dunyaTuruBaslat() {
  const k = turKaydi();
  startGame({ tur: true, ulke: turDurumu(ulkeSirada(_turSecili), k) === "kilitli" ? k.acik : _turSecili });
}

// ---------- Çevrimiçi Dünya Turu odası (spec §6) ----------
// Oda kaydı { …, tur: true, level: ülke }: level kurucunun kalınan ülkesidir (turuBitir yazar). Eski sürüm tur alanını
// bilmez ve odayı normal oyun sanar; eski kurallar alanı reddeder (oda kurulamaz, normal odaya dönülmez).
// Odanın ülkesi (level 1–51'e sınırlanır); Dünya Turu odası değilse null
function turOdaUlkesi(room) {
  if (!room || !room.tur) return null;
  return ulkeSirada(Math.max(1, Math.min(ULKE_SAYISI, Math.floor(Number(room.level)) || 1)));
}
// Lobi satırı "🌍 {sıra}. {ülke}"; Dünya Turu odası değilse boş
function odaTurSatiri(room) {
  const u = turOdaUlkesi(room);
  return u ? `🌍 ${u.sira}. ${u.ad}` : "";
}
// Oda Kur: kip ("normal" | "tur") ve tur odasının ülkesi (açık ülkelerden; varsayılan en ileri açık ülke)
function odaKipiSec(kip) {
  online.selectedKip = kip === "tur" ? "tur" : "normal";
  document.querySelectorAll("#screen-create-room .kip-btn").forEach((b) => b.classList.toggle("active", b.dataset.kip === online.selectedKip));
  const secici = document.getElementById("oda-ulke-secici");
  if (secici) secici.style.display = online.selectedKip === "tur" ? "" : "none";
  if (online.selectedKip === "tur") odaUlkesiSec(online.selectedUlke || turKaydi().acik);
}
function odaUlkesiSec(n) {
  const acik = turKaydi().acik;
  online.selectedUlke = Math.max(1, Math.min(acik, Math.floor(Number(n)) || acik));
  const u = ulkeSirada(online.selectedUlke), ad = document.getElementById("oda-ulke-ad");
  if (ad) ad.textContent = `${u.sira}. ${u.ad}`;
  const geri = document.getElementById("oda-ulke-geri"), ileri = document.getElementById("oda-ulke-ileri");
  if (geri) geri.disabled = online.selectedUlke <= 1;
  if (ileri) ileri.disabled = online.selectedUlke >= acik;
}
function odaUlkesiKaydir(d) { odaUlkesiSec((online.selectedUlke || 1) + d); }

// İstemci: kurucunun durumu (st.lvl) Dünya Turu'nda. Ülke bir ilerleyince önceki ülkenin damgası basılır; ortadan katılan
// katıldığı ülkeden önceki ülkelerin damgasını almaz (online.turSonUlke ilk durumda null). İlk durumun ülkesi bu oyunun
// başlangıcıdır (tamamlanma ödülü ondan sayılır). Ortadan katılanda (game.turOrtadan) tanıtım ve müzik burada başlar,
// müzik teaser'sız (ek spec §3). 51'i geçen durum (eski sürümlü kurucu 52, 53… bölüme ilerler ya da yeni kurucu turu
// bitirmiştir) turu bir kez tamamlar; bölüm kurucununkini izler (aynı harita), ülke 51. ülkede (AR) kalır.
// true: bölüm burada uygulandı ya da uygulanmayacak (durumGeldi bölüm uygulamasını atlar)
function turDurumGeldi(st) {
  if (!st || typeof st.lvl !== "number" || !Number.isFinite(st.lvl)) return false;
  const lvl = Math.max(1, Math.floor(st.lvl)), onceki = online.turSonUlke, ilk = onceki === null || onceki === undefined;
  const ortadan = ilk && !!game.turOrtadan;
  game.turOrtadan = false;
  if (lvl > ULKE_SAYISI) {
    if (ilk) game.turBaslangic = ULKE_SAYISI + 1; // bitmiş tura katılan hiçbir ülkeyi geçmedi
    if (game.level !== lvl) clientApplyLevel(lvl); // harita kurucunun bölümüyle aynı; ülke AR kalır (ulkeSirada 51'e sınırlar)
    if (!game.turBitti) {
      game.turBitti = true;
      if (onceki === ULKE_SAYISI && game._turDamgali !== ulkeSirada(ULKE_SAYISI).kod) istemciDamgasi(ulkeSirada(ULKE_SAYISI));
      const k = turKaydi();
      if (!k.bitti) { k.bitti = Date.now(); persistSave(); }
      turMuzigiSondur();
      showToast(t("🌍 Dünya turu tamamlandı!"));
    }
    online.turSonUlke = ULKE_SAYISI;
    return true;
  }
  online.turSonUlke = lvl;
  if (ilk) game.turBaslangic = lvl;
  const muzikSecenegi = ortadan ? { giris: false } : undefined;
  if (lvl === game.level) {
    if (ortadan) { showToast(bolumBildirimi()); turMuzigiBaslat(ulkeSirada(lvl).kod, muzikSecenegi); }
    else if (!ilk && st.lt && !game.levelTransitioning) istemciGecisi(ulkeSirada(lvl)); // kurucu ülkeyi bitirdi (lt 0 → 1)
    return true;
  }
  const yeni = ulkeSirada(lvl);
  game._turGeciste = false; game._turSonraki = null; game._turJeton = null; // istemcinin geçişi burada biter
  clientApplyLevel(lvl);
  if (muzik.kod !== yeni.kod) turMuzigiBaslat(yeni.kod, muzikSecenegi); // uçakla başlamış müzik yeniden başlamaz
  // Geçiş görülmediyse (ortadan katılma, kaybolan durum) damga bölüm değişince basılır
  if (!ilk && lvl === onceki + 1 && game._turDamgali !== ulkeSirada(onceki).kod) istemciDamgasi(ulkeSirada(onceki), lvl);
  return true;
}
// İstemci: kurucudaki gibi damga (müzik söner) ve TUR_BEKLE_MS sonra uçak geçişi (sıradaki ülkenin teaser'ı). Bölüm
// kurucunun durumuyla değişir (turDurumGeldi); geçiş orada biter, bekleyen uçak iptal olur.
function istemciGecisi(u) {
  if (game._turGeciste) return;
  game._turGeciste = true;
  game._turSonraki = null;
  const jeton = (game._turJeton = {});
  istemciDamgasi(u);
  turMuzigiSondur();
  turSonra(TUR_BEKLE_MS, jeton, () => { if (u.sira < ULKE_SAYISI) ucakGecisi(u, ulkeSirada(u.sira + 1)); });
}
// İstemcinin damgası: kayıt, bildirim ve damga perdesi; perde kapanınca yeni ülkenin tanıtım satırı yeniden görünür
function istemciDamgasi(u, yeniBolum) {
  game._turDamgali = u.kod;
  const { yeni } = damgaBas(u.kod);
  showToast(t("🛂 {ulke} damgası!", { ulke: u.ad }) + (yeni ? ` +${TUR_DAMGA_ELMAS} 💎` : ""));
  damgaGoster(u);
  if (yeniBolum) setTimeout(() => { if (game.running && game.level === yeniBolum) showToast(bolumBildirimi()); }, TUR_DAMGA_MS);
}

// ====== REKLAMLA DEVAM (3.15.0) ======
// Tek kişilik turda canlar bitince oyun hemen bitmez: "Reklam izle, devam et" penceresi açılır. Ödüllü reklamı sonuna
// kadar izleyenin canları dolar, kaldığı ülkede kaldığı yerden sürdürür. Oyun başına en çok TUR_DEVAM_HAKKI kez; başka
// devam yolu (zümrütle, parayla) yoktur. Çevrimiçi turda yok (orada ölen hayalet olur). Reklam yüklü değilse pencere
// açılmaz, oyun her zamanki gibi biter. Çevrimiçi turda pencere yerine hayaletken "Reklam izle, diril" düğmesi
// (turDirilTeklifi, aşağıda). Sınama: test/reklam.test.mjs.
const TUR_DEVAM_HAKKI = 3;
const TUR_DEVAM_KORUMA_SN = 3; // dönüşte hasar almama süresi (hayaletlerden uzaklaşmaya yetsin)

// damagePlayer çağırır: true dönerse oyun bitmez, pencere açılmıştır
function turDevamTeklifi() {
  if (!game.dunyaTuru || online.mode || game.turBitti || !(game.turDevamKalan > 0) || !reklamDevamHazir()) return false;
  game.devamBekliyor = true;
  game.paused = true;
  game.inputDir.x = 0; game.inputDir.y = 0;
  muzikDuraklat(true);
  turDevamEkrani();
  return true;
}

function turDevamEkrani() {
  document.getElementById("tur-devam-kalan").textContent =
    t("Kalan hak: {n}/{toplam}", { n: game.turDevamKalan, toplam: TUR_DEVAM_HAKKI });
  odulDugmesiniGuncelle();
  document.getElementById("screen-tur-devam").classList.add("active");
}

function turDevamKapat() {
  document.getElementById("screen-tur-devam").classList.remove("active");
  game.devamBekliyor = false;
}

function turDevamIzle() {
  if (!game.devamBekliyor) return;
  reklamDevamIzle(turDevamSonucu);
}

// reklam.js çağırır: kazandi = reklam sonuna kadar izlendi
function turDevamSonucu(kazandi) {
  if (!game.devamBekliyor || !game.running) return;
  if (!kazandi) { turDevamEkrani(); return; } // yarıda kapandı ya da gösterilemedi: pencere yeniden, karar oyuncunun
  turDevamKapat();
  game.turDevamKalan--;
  game.player.hp = game.player.maxHp;
  game.player.invuln = TUR_DEVAM_KORUMA_SN;
  game.enemyProjectiles = [];
  game.paused = false;
  game.lastFrame = performance.now();
  muzikDuraklat(false);
  updateHUD();
  showToast(t("❤️ Canların yenilendi! Kalan hak: {n}", { n: game.turDevamKalan }));
}

function turDevamVazgec() {
  if (!game.devamBekliyor) return;
  turDevamKapat();
  game.paused = false;
  muzikDuraklat(false);
  endGame(false);
}

// Çevrimiçi turda oyun durmaz ve ölen hayalet olur: "Reklam izle, diril" düğmesi hayaletken görünür, aynı 3 hak.
// Ödül gelince oyuncu bulunduğu yere en yakın boş noktada canları dolu dirilir (oda kaydına dead: 0 gider).
function turDirilTeklifi() {
  const btn = document.getElementById("btn-tur-diril");
  if (!btn) return;
  const p = game.player;
  const uygun = !!(p && p.dead && online.mode && game.running && game.dunyaTuru && !game.turBitti && game.turDevamKalan > 0 && reklam.hazir);
  btn.style.display = uygun ? "" : "none";
  if (!uygun) return;
  btn.textContent = t("🎬 Reklam izle, diril ({n}/{toplam})", { n: game.turDevamKalan, toplam: TUR_DEVAM_HAKKI });
  btn.disabled = !reklamDevamHazir() || !!reklam.devamSonucu;
}

function turDirilIzle() {
  if (!game.player || !game.player.dead || !online.mode) return;
  reklamDevamIzle(turDirilSonucu);
  turDirilTeklifi();
}

function turDirilSonucu(kazandi) {
  const p = game.player;
  if (!kazandi || !p || !p.dead || !online.mode || !game.running || game.turBitti) { turDirilTeklifi(); return; }
  game.turDevamKalan--;
  const yer = freeSpot(p.x, p.y, p.r, (x, y, r) => collidesWalls(x, y, r) || collidesWaters(x, y, r) || collidesLavas(x, y, r));
  p.x = yer.x; p.y = yer.y;
  p.dead = false;
  p.hp = p.maxHp;
  p.invuln = TUR_DEVAM_KORUMA_SN;
  updateHUD();
  turDirilTeklifi();
  audio.heart();
  showToast(t("❤️ Canların yenilendi! Kalan hak: {n}", { n: game.turDevamKalan }));
}
