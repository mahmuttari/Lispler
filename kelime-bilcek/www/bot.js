/* ============================================================
   KELİME BİLCEK — YAPAY ZEKÂYA KARŞI (1.0.2)
   Rakip "Bilcek" telefonda oynar: kelimelerini cihazdaki kategori sözlüğünden (kelime.js) seçer. Bot için ne yapay
   zekâ ne veritabanı kullanılır; maliyet yalnız oyuncunun listede olmayan kelimelerinin denetimidir (DENETIM.md › 1.0.2).
   Maç, çok oyunculu motorla (oyun.js) aynen oynanır: Firebase odası yerine bellekte çalışan YerelOda kullanılır.
   Sınama: test/bot.test.mjs (node --test) ve test/arayuz.test.mjs (tarayıcıda bot maçı).
   ============================================================ */

const BOT = {
  ad: { kolay: "🤖 Bilcek (Kolay)", orta: "🤖 Bilcek (Orta)", zor: "🤖 Bilcek (Zor)" },
  // Hızlı mod: iki kelime arası bekleme (ms) ve kategori listesinin bildiği oranı
  hizli: { kolay: [5000, 8000, 0.45], orta: [3000, 5500, 0.7], zor: [1800, 3200, 1] },
  // Tenis ve Zincir: sırası gelince yazma süresi (ms) ve o sırada takılma olasılığı
  sira: { kolay: [4000, 9000, 0.18], orta: [2500, 6000, 0.08], zor: [1500, 3500, 0.03] },
};

/* Tekrarlanabilir rastgelelik (testlerde sabit tohum) */
function botRastgele(tohum) {
  let s = (Number(tohum) >>> 0) || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

/* Zincir sözlüğü: bütün kategorilerdeki tek kelimelik girişler (normalleştirilmiş, tekrarsız) */
let _zincirSozlugu = null;
function zincirSozlugu() {
  if (_zincirSozlugu) return _zincirSozlugu;
  const set = new Set();
  Object.values(CATEGORY_WORDS).forEach((liste) => liste.forEach((w) => {
    const n = normalizeWord(w);
    if (!/[\s-]/.test(n) && n.length >= 2) set.add(n);
  }));
  _zincirSozlugu = [...set];
  return _zincirSozlugu;
}

/* Kategori kelimesi: kullanılmamış, botun "bildiği" kısımdan (zorluk). Yoksa null. */
function botKategoriKelimesi(kategori, kullanilan, zorluk, rnd) {
  const liste = (CATEGORY_WORDS[kategori] || []).map(normalizeWord);
  const oran = (BOT.hizli[zorluk] || BOT.hizli.orta)[2];
  const bildigi = liste.slice(0, Math.max(3, Math.ceil(liste.length * oran)));
  const aday = bildigi.filter((w) => !kullanilan.has(w));
  if (!aday.length) return null;
  return aday[Math.floor(rnd() * aday.length)];
}

/* Zincir kelimesi: istenen harfle başlayan, kullanılmamış (harf null ise herhangi biri). Yoksa null. */
function botZincirKelimesi(harf, kullanilan, rnd) {
  const aday = zincirSozlugu().filter((w) => !kullanilan.has(w) && (!harf || turkishFirstLetter(w) === harf)
    && chainLetterFor(w) !== "ğ");
  if (!aday.length) return null;
  return aday[Math.floor(rnd() * aday.length)];
}

function botGecikme(tur, zorluk, rnd) {
  const [en, ust] = (BOT[tur][zorluk] || BOT[tur].orta);
  return Math.round(en + (ust - en) * rnd());
}

/* ---------- Bellekte çalışan oda (Firebase Realtime Database başvurusunun oyunun kullandığı kısmı) ---------- */
function yerelKopya(v) { return v === undefined || v === null ? null : JSON.parse(JSON.stringify(v)); }
function yerelZaman(v) {
  // ServerValue.TIMESTAMP ({".sv":"timestamp"}) → sunucu saati yerine cihaz saati (oyun nowServer() ile ölçer)
  if (v && typeof v === "object" && v[".sv"] === "timestamp") return typeof nowServer === "function" ? nowServer() : Date.now();
  if (v && typeof v === "object") { const o = Array.isArray(v) ? [] : {}; Object.keys(v).forEach((k) => { o[k] = yerelZaman(v[k]); }); return o; }
  return v;
}
let _yerelSayac = 0;
class YerelOda {
  constructor(anahtar, veri) {
    this.key = anahtar;
    this._veri = yerelKopya(veri);
    this._dinleyiciler = [];
  }
  _anlik() { const v = yerelKopya(this._veri); return { val: () => yerelKopya(v), exists: () => v !== null, key: this.key }; }
  _bildir() { const s = this._anlik(); this._dinleyiciler.slice().forEach((fn) => setTimeout(() => fn(s), 0)); }
  on(olay, fn) { if (olay === "value") { this._dinleyiciler.push(fn); setTimeout(() => fn(this._anlik()), 0); } return fn; }
  off(olay, fn) { this._dinleyiciler = fn ? this._dinleyiciler.filter((x) => x !== fn) : []; }
  once() { return Promise.resolve(this._anlik()); }
  async transaction(fn) {
    const sonuc = fn(yerelKopya(this._veri));
    if (sonuc === undefined) return { committed: false, snapshot: this._anlik() };
    this._veri = yerelKopya(yerelZaman(sonuc));
    this._bildir();
    return { committed: true, snapshot: this._anlik() };
  }
  async remove() { this._veri = null; this._bildir(); }
  _yaz(yol, deger) {
    const parca = yol.split("/").filter(Boolean);
    if (this._veri === null || typeof this._veri !== "object") this._veri = {};
    let d = this._veri;
    for (let i = 0; i < parca.length - 1; i++) {
      if (d[parca[i]] === null || typeof d[parca[i]] !== "object") d[parca[i]] = {};
      d = d[parca[i]];
    }
    const son = parca[parca.length - 1];
    if (deger === null || deger === undefined) delete d[son]; else d[son] = yerelKopya(yerelZaman(deger));
    this._bildir();
  }
  child(yol) {
    const oda = this;
    return {
      key: yol.split("/").pop(),
      set: async (v) => oda._yaz(yol, v),
      remove: async () => oda._yaz(yol, null),
      push: () => {
        const k = "y" + Date.now().toString(36) + (++_yerelSayac).toString(36);
        return { key: k, set: async (v) => oda._yaz(`${yol}/${k}`, v) };
      },
    };
  }
}

/* ---------- Botun hamle döngüsü ---------- */
const bot = { oda: null, zorluk: "orta", zamanlayici: null, bekleyen: null, rnd: Math.random, slot: "p2" };

function botKullanilanlar(words) {
  return new Set(Object.values(words || {}).filter((w) => w && w.valid !== false).map((w) => normalizeWord(w.text)));
}

async function botKelimeYaz(metin) {
  const oda = bot.oda;
  if (!oda) return;
  const zaman = typeof nowServer === "function" ? nowServer() : Date.now();
  await oda.child("round/words").push().set({ text: metin, by: bot.slot, valid: true, ts: zaman });
}

async function botSiraVer() {
  const oda = bot.oda;
  if (!oda) return;
  await oda.transaction((c) => {
    if (!c || !c.round || c.round.phase !== "active" || c.round.turn !== bot.slot) return c;
    c.round.turn = bot.slot === "p1" ? "p2" : "p1";
    c.round.turnStart = typeof nowServer === "function" ? nowServer() : Date.now();
    return c;
  });
}

/* Oda her değiştiğinde (ve zamanlayıcıyla) çağrılır: botun sırası/fırsatı varsa bir hamle planlar */
function botDurumuIzle(d) {
  if (!bot.oda || !d || d.status !== "playing" || !d.round) { clearTimeout(bot.bekleyen); bot.bekleyen = null; return; }
  const r = d.round, mode = (d.match && d.match.mode) || "sim";
  if (r.phase !== "active") { clearTimeout(bot.bekleyen); bot.bekleyen = null; return; }
  if (bot.bekleyen) return; // bir hamle zaten planlı
  const turAnahtari = `${r.number}|${r.turn || ""}|${Object.keys(r.words || {}).length}`;
  if (mode === "sim") {
    bot.bekleyen = setTimeout(async () => {
      bot.bekleyen = null;
      const c = (await bot.oda?.once("value"))?.val();
      if (!c || c.status !== "playing" || !c.round || c.round.phase !== "active") return;
      const benim = new Set(Object.values(c.round.words || {}).filter((w) => w.by === bot.slot).map((w) => normalizeWord(w.text)));
      const w = botKategoriKelimesi(c.round.category, benim, bot.zorluk, bot.rnd);
      if (w) await botKelimeYaz(w);
    }, botGecikme("hizli", bot.zorluk, bot.rnd));
    return;
  }
  if (r.turn !== bot.slot) return;
  const [, , takilma] = BOT.sira[bot.zorluk] || BOT.sira.orta;
  const takildi = bot.rnd() < takilma;
  bot.bekleyen = setTimeout(async () => {
    bot.bekleyen = null;
    const c = (await bot.oda?.once("value"))?.val();
    if (!c || c.status !== "playing" || !c.round || c.round.phase !== "active" || c.round.turn !== bot.slot) return;
    if (`${c.round.number}|${c.round.turn || ""}|${Object.keys(c.round.words || {}).length}` !== turAnahtari) return;
    if (takildi) return; // bu sırada yazamaz: süre dolunca roundu (Zincir'de maçı) kaybeder
    const kullanilan = botKullanilanlar(c.round.words);
    const w = mode === "chain"
      ? botZincirKelimesi(getChainNextLetter(c.round.words), kullanilan, bot.rnd)
      : botKategoriKelimesi(c.round.category, kullanilan, bot.zorluk, bot.rnd);
    if (!w) return; // bildiği kelime bitti
    await botKelimeYaz(w);
    await botSiraVer();
  }, botGecikme("sira", bot.zorluk, bot.rnd));
}

function botBaslat(oda, zorluk, rnd) {
  botDurdur();
  bot.oda = oda;
  bot.zorluk = BOT.ad[zorluk] ? zorluk : "orta";
  bot.rnd = rnd || Math.random;
  bot.izleyici = oda.on("value", (s) => botDurumuIzle(s.val()));
  // Oda değişmese de (ör. düşünme süresi bitip "active" olunca) hamleyi kaçırmamak için düzenli bakış
  bot.zamanlayici = setInterval(async () => { if (bot.oda) botDurumuIzle((await bot.oda.once("value")).val()); }, 700);
}

function botDurdur() {
  if (bot.oda && bot.izleyici) bot.oda.off("value", bot.izleyici);
  clearInterval(bot.zamanlayici); clearTimeout(bot.bekleyen);
  bot.oda = null; bot.izleyici = null; bot.zamanlayici = null; bot.bekleyen = null;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { BOT, bot, botRastgele, zincirSozlugu, botKategoriKelimesi, botZincirKelimesi, botGecikme, YerelOda,
    botBaslat, botDurdur, botDurumuIzle, botKullanilanlar };
}
