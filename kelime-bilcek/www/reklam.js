/* ============================================================
   KELİME BİLCEK — REKLAMLAR (AdMob, yalnız Android uygulaması)
   @capacitor-community/admob 8.2.1 eklentisi window.Capacitor.Plugins.AdMob olarak gelir. Web/PWA sürümünde eklenti
   yoktur; bu dosyadaki her şey hiçbir şey yapmadan döner.
   Kurallar (kullanıcı kararı, 4 Kasım 2026):
   - Geçiş reklamı yalnız MAÇ BİTİNCE, sonuç ekranından lobiye dönerken. Maç oynanırken hiç reklam yok
     (banner da gizlenir).
   - İlk 3 maçta geçiş reklamı yok; iki geçiş reklamı arasında en az 5 dakika; saatte en çok 4.
   - Banner yalnız lobi ve Şampiyonlar ekranlarının altında durur.
   - AB/İngiltere/İsviçre: Google UMP onay formu ilk açılışta sorulur; tercih profil menüsünden değiştirilebilir.
   - initialize({ maxAdContentRating: "General" }): yalnız genel izleyiciye uygun reklamlar (eklenti yalnız tam
     "General" yazımını tanır).
   Sınama: test/reklam.test.mjs (node --test).
   ============================================================ */

const REKLAM = {
  // AdMob › Kelime Bilcek (Android). Biçim ca-app-pub-<16 rakam>/<10 rakam>; kimlik girilmemişse reklam istenmez.
  gecisId: "ca-app-pub-2417242373034448/BEKLIYOR01",
  bannerId: "ca-app-pub-2417242373034448/BEKLIYOR02",
  ilkMaclar: 3,           // ilk N maçta geçiş reklamı yok
  araMs: 5 * 60 * 1000,   // iki geçiş reklamı arasında en az
  saatlikEnCok: 4,
  bannerEkranlari: ["lobbyScreen", "leaderboardScreen"],
  kayitAnahtari: "kb_reklam",
};

const reklam = {
  hazir: false,          // initialize + onay tamam, reklam istenebilir
  gecisYuklu: false,
  bannerAcik: false,     // showBanner bir kez çağrıldı mı (sonra hide/resume)
  bannerGorunur: false,
  ekran: null,           // son gösterilen ekran (show())
  gizlilikGerekli: false,
};

function reklamKimligiGecerli(id) {
  return /^ca-app-pub-\d{16}\/\d{10}$/.test(String(id || ""));
}

function admobPlugin() {
  const w = typeof window !== "undefined" ? window : globalThis;
  return (w.Capacitor && w.Capacitor.Plugins && w.Capacitor.Plugins.AdMob) || null;
}

/* Kalıcı sayaçlar (localStorage kb_reklam): biten maç sayısı ve son bir saatteki geçiş reklamlarının zamanı (ms) */
function reklamKaydiniTemizle(v) {
  const k = v && typeof v === "object" ? v : {};
  const mac = Number.isFinite(k.mac) && k.mac > 0 ? Math.floor(k.mac) : 0;
  const son = Array.isArray(k.son) ? k.son.filter((z) => Number.isFinite(z)).slice(-REKLAM.saatlikEnCok) : [];
  return { mac, son };
}
function reklamKaydiOku() {
  try { return reklamKaydiniTemizle(JSON.parse(localStorage.getItem(REKLAM.kayitAnahtari) || "{}")); }
  catch (e) { return reklamKaydiniTemizle(null); }
}
function reklamKaydiYaz(k) {
  try { localStorage.setItem(REKLAM.kayitAnahtari, JSON.stringify(k)); } catch (e) { /* depolama yoksa sayaç bellekte kalır */ }
}

/* Saf işlev: kayıt (bu maç eklenmiş hâli) ve şimdiki zamanla geçiş reklamı gösterilebilir mi? */
function gecisUygunMu(kayit, simdi) {
  const k = reklamKaydiniTemizle(kayit);
  if (k.mac <= REKLAM.ilkMaclar) return false;
  const saatlik = k.son.filter((z) => simdi - z < 3600e3 && z <= simdi);
  if (saatlik.length >= REKLAM.saatlikEnCok) return false;
  const enSon = k.son.length ? Math.max(...k.son) : -Infinity;
  return simdi - enSon >= REKLAM.araMs;
}

async function reklamBaslat() {
  const ad = admobPlugin();
  if (!ad) return;
  try {
    await ad.initialize({ maxAdContentRating: "General" });
    let bilgi = await ad.requestConsentInfo();
    if (!bilgi.canRequestAds && bilgi.isConsentFormAvailable && bilgi.status === "REQUIRED") {
      bilgi = await ad.showConsentForm();
    }
    reklam.gizlilikGerekli = bilgi.privacyOptionsRequirementStatus === "REQUIRED";
    gizlilikDugmesiniGuncelle();
    if (!bilgi.canRequestAds) return;
    reklam.hazir = true;
    ad.addListener("interstitialAdDismissed", () => { reklam.gecisYuklu = false; gecisYukle(); });
    ad.addListener("interstitialAdFailedToShow", () => { reklam.gecisYuklu = false; gecisYukle(); });
    ad.addListener("bannerAdSizeChanged", (boyut) => bannerBoslugu(reklam.bannerGorunur && boyut ? boyut.height : 0));
    gecisYukle();
    reklamEkranDegisti(reklam.ekran); // açılışta lobideyse banner hemen gelsin
  } catch (e) {
    console.warn("AdMob", e);
  }
}

async function gecisYukle() {
  const ad = admobPlugin();
  if (!ad || !reklam.hazir || reklam.gecisYuklu || !reklamKimligiGecerli(REKLAM.gecisId)) return;
  try {
    await ad.prepareInterstitial({ adId: REKLAM.gecisId });
    reklam.gecisYuklu = true;
  } catch (e) { reklam.gecisYuklu = false; }
}

/* Maç bitti (sonuç ekranı ilk kez çizildi): sayaç bir artar. Reklam burada gösterilmez. */
function reklamMacBitti() {
  const k = reklamKaydiOku();
  k.mac++;
  reklamKaydiYaz(k);
}

/* Sonuç ekranından lobiye dönülüyor: uygunsa ve yüklüyse bir geçiş reklamı. Dönüş değeri gösterildi mi. */
async function reklamLobiyeDonus() {
  const ad = admobPlugin();
  if (!ad || !reklam.hazir) return false;
  const simdi = Date.now();
  const k = reklamKaydiOku();
  k.son = k.son.filter((z) => simdi - z < 3600e3);
  if (!gecisUygunMu(k, simdi)) return false;
  if (!reklam.gecisYuklu) { gecisYukle(); return false; } // hazır değil: hak bir sonraki maç sonuna kalır
  k.son.push(simdi);
  reklamKaydiYaz(k);
  reklam.gecisYuklu = false;
  try { await ad.showInterstitial(); return true; }
  catch (e) { gecisYukle(); return false; }
}

/* show() her ekran değişiminde çağırır: banner yalnız lobi ve Şampiyonlar'da */
async function reklamEkranDegisti(ekran) {
  reklam.ekran = ekran;
  const ad = admobPlugin();
  if (!ad || !reklam.hazir || !reklamKimligiGecerli(REKLAM.bannerId)) return;
  const istenir = REKLAM.bannerEkranlari.includes(ekran);
  if (istenir === reklam.bannerGorunur) return;
  reklam.bannerGorunur = istenir;
  try {
    if (istenir && !reklam.bannerAcik) {
      reklam.bannerAcik = true;
      await ad.showBanner({ adId: REKLAM.bannerId, adSize: "ADAPTIVE_BANNER", position: "BOTTOM_CENTER", margin: 0 });
    } else if (istenir) {
      await ad.resumeBanner();
    } else {
      await ad.hideBanner();
      bannerBoslugu(0);
    }
  } catch (e) {
    if (istenir) reklam.bannerAcik = false;
    console.warn("AdMob banner", e);
  }
}

/* Banner içeriğin üstüne binmesin: sayfanın altında banner yüksekliği kadar boşluk */
function bannerBoslugu(px) {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty("--banner-h", (Number(px) > 0 ? Math.ceil(px) : 0) + "px");
}

/* AB kullanıcıları onay tercihini her zaman değiştirebilmeli (UMP "privacy options" girişi) */
function gizlilikDugmesiniGuncelle() {
  if (typeof document === "undefined") return;
  const btn = document.getElementById("adPrivacyBtn");
  if (btn) btn.classList.toggle("hidden", !reklam.gizlilikGerekli);
}

async function reklamGizlilikSecenekleri() {
  const ad = admobPlugin();
  if (!ad) return;
  try { await ad.showPrivacyOptionsForm(); } catch (e) { console.warn("AdMob gizlilik", e); }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { REKLAM, reklam, reklamKimligiGecerli, reklamKaydiniTemizle, reklamKaydiOku, gecisUygunMu,
    reklamBaslat, reklamMacBitti, reklamLobiyeDonus, reklamEkranDegisti, reklamGizlilikSecenekleri };
}
