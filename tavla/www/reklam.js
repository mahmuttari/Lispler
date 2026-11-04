/* ============================================================
   TAVLA — REKLAMLAR (AdMob, yalnız Android uygulaması). Kelime Bilcek'in reklam.js düzeni.
   @capacitor-community/admob 8.2.1 eklentisi window.Capacitor.Plugins.AdMob olarak gelir. Web'de eklenti yoktur;
   buradaki her şey hiçbir şey yapmadan döner. Oyun (assets/index-*.js) yalnız window.TavlaReklam'ı çağırır.
   Kurallar (kullanıcı kararı, 4 Kasım 2026: "tavla da da reklam olacak"; sınırlar Kelime Bilcek'le aynı):
   - Oyun oynanırken HİÇ reklam yok (banner da gizlenir).
   - Geçiş reklamı yalnız MAÇ BİTİNCE, sonuç penceresinde "Yeni Maç / Tekrar Oyna / Ana Menü / Ayrıl"a basılınca.
   - İlk 3 maçta geçiş reklamı yok; iki geçiş reklamı arasında en az 5 dakika; saatte en çok 4.
   - Banner yalnız ana menünün altında (içeriğin üstüne binmez: --banner-h kadar boşluk).
   - AB/İngiltere/İsviçre: Google UMP onay formu ilk açılışta; tercih Hesap › Gizlilik ve hesap › Reklam tercihleri.
   - initialize({ maxAdContentRating: "General" }): yalnız genel izleyiciye uygun reklamlar.
   Sınama: test/reklam.test.mjs.
   ============================================================ */

const REKLAM = {
  // AdMob › Tavla (Android). Biçim ca-app-pub-<16 rakam>/<10 rakam>; kimlik girilmemişse reklam istenmez.
  gecisId: "ca-app-pub-2417242373034448/3470819523",
  bannerId: "ca-app-pub-2417242373034448/4041665164",
  ilkMaclar: 3,           // ilk N maçta geçiş reklamı yok
  araMs: 5 * 60 * 1000,   // iki geçiş reklamı arasında en az
  saatlikEnCok: 4,
  bannerEkranlari: ["menu"],
  kayitAnahtari: "tavla_reklam",
};

const reklam = {
  hazir: false,          // initialize + onay tamam, reklam istenebilir
  gecisYuklu: false,
  bannerAcik: false,     // showBanner bir kez çağrıldı mı (sonra hide/resume)
  bannerGorunur: false,
  ekran: null,           // son bildirilen ekran
  gizlilikGerekli: false,
};

function reklamKimligiGecerli(id) {
  return /^ca-app-pub-\d{16}\/\d{10}$/.test(String(id || ""));
}

function admobPlugin() {
  const w = typeof window !== "undefined" ? window : globalThis;
  return (w.Capacitor && w.Capacitor.Plugins && w.Capacitor.Plugins.AdMob) || null;
}

/* Kalıcı sayaçlar (localStorage tavla_reklam): biten maç sayısı ve son bir saatteki geçiş reklamlarının zamanı (ms).
   Anahtar "tavla_" ile başladığı için hesap silmede telefondaki ayarlarla birlikte temizlenir. */
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
    if (!bilgi.canRequestAds) return;
    reklam.hazir = true;
    ad.addListener("interstitialAdDismissed", () => { reklam.gecisYuklu = false; gecisYukle(); });
    ad.addListener("interstitialAdFailedToShow", () => { reklam.gecisYuklu = false; gecisYukle(); });
    ad.addListener("bannerAdSizeChanged", (boyut) => bannerBoslugu(reklam.bannerGorunur && boyut ? boyut.height : 0));
    gecisYukle();
    const ekran = reklam.ekran;
    reklam.ekran = null;
    reklamEkranDegisti(ekran); // açılışta menüdeyse banner hemen gelsin
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

/* Maç bitti ve oyuncu sonuç penceresinden ayrılıyor: sayaç bir artar, uygunsa ve yüklüyse bir geçiş reklamı.
   Dönüş değeri gösterildi mi. Oyun bu sözü beklemez (reklam açılırken sonraki ekran arkada hazırlanır). */
async function reklamMacSonu() {
  const k = reklamKaydiOku();
  k.mac++;
  const ad = admobPlugin();
  const simdi = Date.now();
  k.son = k.son.filter((z) => simdi - z < 3600e3);
  if (!ad || !reklam.hazir || !gecisUygunMu(k, simdi)) { reklamKaydiYaz(k); return false; }
  if (!reklam.gecisYuklu) { reklamKaydiYaz(k); gecisYukle(); return false; } // hazır değil: hak sonraki maça kalır
  k.son.push(simdi);
  reklamKaydiYaz(k);
  reklam.gecisYuklu = false;
  try { await ad.showInterstitial(); return true; }
  catch (e) { gecisYukle(); return false; }
}

/* Oyun her ekran değişiminde çağırır ("menu" ya da null): banner yalnız ana menüde */
async function reklamEkranDegisti(ekran) {
  if (ekran === reklam.ekran) return;
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

/* Banner içeriğin üstüne binmesin: sayfanın altında banner yüksekliği kadar boşluk (CSS --banner-h) */
function bannerBoslugu(px) {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty("--banner-h", (Number(px) > 0 ? Math.ceil(px) : 0) + "px");
  document.documentElement.classList.toggle("banner-var", Number(px) > 0); // index.html: menü kaydırılabilir, sıkışmaz
}

/* AB kullanıcıları onay tercihini her zaman değiştirebilmeli (UMP "privacy options") */
async function reklamGizlilikSecenekleri() {
  const ad = admobPlugin();
  if (!ad) return;
  try { await ad.showPrivacyOptionsForm(); } catch (e) { console.warn("AdMob gizlilik", e); }
}

if (typeof window !== "undefined" && typeof module === "undefined") {
  window.TavlaReklam = {
    ekran: reklamEkranDegisti,
    macSonu: reklamMacSonu,
    gizlilikSecenekleri: reklamGizlilikSecenekleri,
    get gizlilikGerekli() { return reklam.gizlilikGerekli; },
  };
  reklamBaslat();
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { REKLAM, reklam, reklamKimligiGecerli, reklamKaydiniTemizle, reklamKaydiOku, gecisUygunMu,
    reklamBaslat, reklamMacSonu, reklamEkranDegisti, reklamGizlilikSecenekleri };
}
