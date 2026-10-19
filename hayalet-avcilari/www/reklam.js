/* ============================================================
   HAYALET AVCILARI — REKLAMLAR (AdMob, yalnız Android uygulaması)
   @capacitor-community/admob eklentisi window.Capacitor.Plugins.AdMob olarak gelir;
   web/PWA sürümünde eklenti yoktur ve bu dosyadaki her şey sessizce devre dışı kalır.
   - AB/İngiltere/İsviçre: Google UMP onay formu (AdMob › Gizlilik ve mesajlaşma) ilk açılışta sorulur.
   - Geçiş reklamı: oyun bitti ekranında, her 2 oyunda bir, en az 3 dakika arayla. Oyun sırasında reklam yok.
   - Ödüllü reklam: oyun bitti ekranındaki "Reklam izle" düğmesi, izleyene 10 💚 zümrüt (oyun başına bir kez).
   ============================================================ */

const REKLAM = {
  gecisId: "ca-app-pub-2417242373034448/5331066264",
  odulluId: "ca-app-pub-2417242373034448/6612358344",
  gecisAraOyun: 2,            // her N oyun bitişinde bir
  gecisAraMs: 3 * 60 * 1000,  // iki geçiş reklamı arasında en az
  odulZumrut: 10,
};

const reklam = {
  hazir: false,          // initialize + onay tamam, reklam istenebilir
  gecisYuklu: false,
  odulluYuklu: false,
  oyunSayac: 0,
  sonGecis: 0,
  odulKazanildi: false,
  odulKullanildi: false, // bu oyun bitti ekranında ödül alındı mı
  gizlilikGerekli: false,
};

function admobPlugin() {
  return (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob) || null;
}

async function reklamBaslat() {
  const ad = admobPlugin();
  if (!ad) return;
  try {
    await ad.initialize();
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
    ad.addListener("onRewardedVideoAdReward", () => { reklam.odulKazanildi = true; });
    ad.addListener("onRewardedVideoAdDismissed", () => { odulluKapandi(); });
    ad.addListener("onRewardedVideoAdFailedToShow", () => { odulluKapandi(); });
    gecisYukle();
    odulluYukle();
  } catch (e) {
    console.warn("AdMob", e);
  }
}

async function gecisYukle() {
  const ad = admobPlugin();
  if (!ad || !reklam.hazir || reklam.gecisYuklu) return;
  try {
    await ad.prepareInterstitial({ adId: REKLAM.gecisId });
    reklam.gecisYuklu = true;
  } catch (e) { reklam.gecisYuklu = false; }
}

async function odulluYukle() {
  const ad = admobPlugin();
  if (!ad || !reklam.hazir || reklam.odulluYuklu) return;
  try {
    await ad.prepareRewardVideoAd({ adId: REKLAM.odulluId });
    reklam.odulluYuklu = true;
  } catch (e) { reklam.odulluYuklu = false; }
  odulDugmesiniGuncelle();
}

// endGame() çağırır: ödül düğmesini sıfırlar, sırası geldiyse geçiş reklamını gösterir
function reklamOyunBitti() {
  reklam.odulKullanildi = false;
  odulDugmesiniGuncelle();
  const ad = admobPlugin();
  if (!ad || !reklam.hazir) return;
  reklam.oyunSayac++;
  const zamani = reklam.oyunSayac % REKLAM.gecisAraOyun === 0 && Date.now() - reklam.sonGecis >= REKLAM.gecisAraMs;
  if (!zamani) return;
  if (!reklam.gecisYuklu) { gecisYukle(); return; }
  reklam.sonGecis = Date.now();
  setTimeout(() => {
    ad.showInterstitial().catch(() => { reklam.gecisYuklu = false; gecisYukle(); });
  }, 800);
}

async function odulluIzle() {
  const ad = admobPlugin();
  if (!ad || !reklam.odulluYuklu || reklam.odulKullanildi) return;
  reklam.odulKazanildi = false;
  reklam.odulluYuklu = false;
  odulDugmesiniGuncelle();
  try {
    await ad.showRewardVideoAd();
  } catch (e) {
    odulluKapandi();
  }
}

function odulluKapandi() {
  if (reklam.odulKazanildi && !reklam.odulKullanildi) {
    reklam.odulKazanildi = false;
    reklam.odulKullanildi = true;
    save.zumrut = (save.zumrut || 0) + REKLAM.odulZumrut;
    persistSave();
    const el = document.getElementById("final-zumrut");
    if (el) el.textContent = String(Number(el.textContent || 0) + REKLAM.odulZumrut);
    showToast(t("💚 +{n} zümrüt kazandın!", { n: REKLAM.odulZumrut }));
  }
  odulDugmesiniGuncelle();
  odulluYukle();
}

function odulDugmesiniGuncelle() {
  const btn = document.getElementById("btn-reklam-odul");
  if (!btn) return;
  btn.style.display = reklam.hazir && reklam.odulluYuklu && !reklam.odulKullanildi ? "" : "none";
}

// AB kullanıcıları onay tercihini her zaman değiştirebilmeli (UMP "privacy options" girişi)
function gizlilikDugmesiniGuncelle() {
  const btn = document.getElementById("btn-reklam-gizlilik");
  if (btn) btn.style.display = reklam.gizlilikGerekli ? "" : "none";
}

async function reklamGizlilikSecenekleri() {
  const ad = admobPlugin();
  if (!ad) return;
  try {
    await ad.showPrivacyOptionsForm();
  } catch (e) {
    console.warn("AdMob gizlilik", e);
  }
}
