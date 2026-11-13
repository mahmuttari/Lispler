/* ============================================================
   KELİME BİLCEK — ARKADAŞINI DAVET ET + DEĞERLENDİRME (1.0.6)
   Paylaş: telefonun paylaşım menüsü (Capacitor Share) mağaza bağlantısıyla açılır; web'de navigator.share, o da yoksa
   panoya kopyalanır. Değerlendirme: Google Play'in kendi uygulama içi değerlendirme penceresi (In-App Review).
   Google'ın kuralları: pencereden önce "puan verir misin?" diye sorulmaz, düğmeye bağlanmaz, sık istenmez; pencerenin
   gerçekten gösterilip gösterilmeyeceğine Play karar verir. Bizim kurallarımız (TANITIM): kazanılan bir maçtan lobiye
   dönerken, en az 3 bitmiş maçtan sonra, o anda geçiş reklamı gösterilmediyse, iki istek arası ≥ 30 gün, toplam ≤ 3.
   Sınama: test/tanitim.test.mjs (kurallar), test/arayuz.test.mjs (düğmeler, akış).
   ============================================================ */

const TANITIM = {
  magazaAdresi: "https://play.google.com/store/apps/details?id=com.poyrazworkshop.kelimebilcek",
  ilkMac: 3,
  araGun: 30,
  enCok: 3,
  anahtar: "kb_tanitim_v1",
};

function tanitimEklentisi(ad) {
  const w = typeof window !== "undefined" ? window : globalThis;
  const c = w.Capacitor;
  if (!c || !c.Plugins || !c.Plugins[ad]) return null;
  if (typeof c.isNativePlatform === "function" && !c.isNativePlatform()) return null;
  return c.Plugins[ad];
}

function tanitimKaydiOku() {
  try {
    const k = JSON.parse(localStorage.getItem(TANITIM.anahtar) || "{}");
    return { mac: Number.isFinite(k.mac) ? k.mac : 0, istek: Array.isArray(k.istek) ? k.istek.filter(Number.isFinite) : [] };
  } catch (e) { return { mac: 0, istek: [] }; }
}
function tanitimKaydiYaz(k) { try { localStorage.setItem(TANITIM.anahtar, JSON.stringify(k)); } catch (e) {} }

/* Saf: değerlendirme istenebilir mi */
function degerlendirmeUygunMu(k, kazandi, simdi) {
  if (!kazandi || !k) return false;
  if ((k.mac || 0) < TANITIM.ilkMac) return false;
  const istek = k.istek || [];
  if (istek.length >= TANITIM.enCok) return false;
  const son = istek[istek.length - 1];
  return !(son && simdi - son < TANITIM.araGun * 864e5);
}

/* Maç bitince (oyun.js, sonuç ekranı) */
function tanitimMacBitti() {
  const k = tanitimKaydiOku();
  k.mac += 1;
  tanitimKaydiYaz(k);
}

/* Lobiye dönerken (oyun.js › againBtn): uygunsa Play'in değerlendirme penceresi. Dönüş: istendi mi */
async function degerlendirmeIste(kazandi) {
  const eklenti = tanitimEklentisi("InAppReview");
  if (!eklenti) return false;
  const k = tanitimKaydiOku();
  const simdi = Date.now();
  if (!degerlendirmeUygunMu(k, kazandi, simdi)) return false;
  k.istek.push(simdi);
  tanitimKaydiYaz(k);
  try { await eklenti.requestReview(); return true; } catch (e) { return false; }
}

/* Saf: paylaşım metni (kazanılan maçın skoru varsa onunla) */
function paylasimMetni(skor) {
  if (skor && Number.isFinite(skor.ben) && Number.isFinite(skor.rakip) && skor.ben > skor.rakip) {
    return `Kelime Bilcek'te ${skor.ben}-${skor.rakip} kazandım! Bakalım sen kaç kelime bileceksin? Gel kelime düellosu yapalım:`;
  }
  return "Kelime Bilcek'te benimle kelime düellosu yap! Kategori gelir, en çok kelimeyi bilen kazanır:";
}

/* Dönüş: "paylasildi" | "kopyalandi" | "iptal" */
async function oyunuPaylas(skor) {
  const metin = paylasimMetni(skor);
  const veri = { title: "Kelime Bilcek", text: metin, url: TANITIM.magazaAdresi };
  const eklenti = tanitimEklentisi("Share");
  try {
    if (eklenti) { await eklenti.share({ ...veri, dialogTitle: "Arkadaşını davet et" }); return "paylasildi"; }
    if (typeof navigator !== "undefined" && navigator.share) { await navigator.share(veri); return "paylasildi"; }
    await navigator.clipboard.writeText(`${metin} ${TANITIM.magazaAdresi}`);
    return "kopyalandi";
  } catch (e) { return "iptal"; }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { TANITIM, degerlendirmeUygunMu, paylasimMetni, tanitimKaydiOku, tanitimMacBitti, degerlendirmeIste, oyunuPaylas };
}
