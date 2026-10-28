/* ============================================================
   HAYALET AVCILARI — REKLAMLAR (AdMob, yalnız Android uygulaması)
   @capacitor-community/admob eklentisi window.Capacitor.Plugins.AdMob olarak gelir;
   web/PWA sürümünde eklenti yoktur ve bu dosyadaki her şey sessizce devre dışı kalır.
   - AB/İngiltere/İsviçre: Google UMP onay formu (AdMob › Gizlilik ve mesajlaşma) ilk açılışta sorulur.
   - Reklam içerik derecesi en çok G (genel izleyici, 3.13.1): PG, T ve MA dereceli reklamlar (müstehcen, kumar, alkol…)
     istenmez. Sınama: test/reklam.test.mjs.
   - Geçiş reklamı (3.14.0, "hiç sıkmayacak şekilde"): yalnız tek kişilik oyunun sonunda; oyun sırasında, çevrimiçi
     turdan sonra ve sevinç anında (yeni en yüksek bölüm, dünya turu bitişi) yok. Yeni oyuncuya ilk 5 oyun ve ilk
     10 dk oyun süresi boyunca yok; 45 sn'den kısa oyundan sonra yok; iki reklam arası en az 6 dk oyun süresi
     (menüde beklemek sayılmaz); saatte en çok 4. Sayaçlar save.reklam'da kalıcıdır. Dayanak: AdMob, geçiş
     reklamını doğal duraklarda ve aşırı sıklık olmadan önerir (sayı vermez). Sınama: test/reklam.test.mjs.
   - Ödüllü reklam: oyun bitti ekranındaki "Reklam izle" düğmesi, izleyene 10 💚 zümrüt (oyun başına bir kez).
   - Ödüllü reklamla devam (3.15.0): tek kişilik Dünya Turu'nda canlar bitince "Reklam izle, devam et"; sonuna kadar
     izleyenin canları dolar. Oyun başına en çok 3 kez (dunya-turu.js, TUR_DEVAM_HAKKI). Çevrimiçi turda hayalet olan
     oyuncu "Reklam izle, diril" ile aynı haklardan dirilir.
   ============================================================ */

const REKLAM = {
  gecisId: "ca-app-pub-2417242373034448/5331066264",
  odulluId: "ca-app-pub-2417242373034448/6612358344",
  ilkOyunlar: 5,       // hoş geldin: ilk N oyunda geçiş reklamı yok
  ilkSureSn: 600,      // hoş geldin: toplam oyun süresi bu kadar olmadan yok
  araSureSn: 360,      // iki geçiş reklamı arasında en az bu kadar oyun süresi
  enKisaOyunSn: 45,    // bundan kısa oyundan sonra yok (çabuk yenilen hemen yeniden oynamak ister)
  saatlikEnCok: 4,
  odulZumrut: 10,
};

const reklam = {
  hazir: false,          // initialize + onay tamam, reklam istenebilir
  gecisYuklu: false,
  odulluYuklu: false,
  odulKazanildi: false,
  odulKullanildi: false, // bu oyun bitti ekranında ödül alındı mı
  devamSonucu: null,     // reklamla devam bekleniyor: sonuç bu işleve gider (zümrüt ödülü verilmez)
  gizlilikGerekli: false,
};

function admobPlugin() {
  return (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob) || null;
}

async function reklamBaslat() {
  const ad = admobPlugin();
  if (!ad) return;
  try {
    // Derece bundan sonraki bütün reklam isteklerine uygulanır; eklenti yalnız tam "General" yazımını tanır
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

// Kalıcı sayaçlar (save.reklam): oyun bitiş sayısı, toplam oyun süresi, son reklamdan beri oyun süresi (sn),
// son bir saatteki reklamların zamanı (ms)
function reklamKaydiniTemizle(v) {
  const k = v && typeof v === "object" ? v : {};
  const sayi = (x) => (Number.isFinite(x) && x > 0 ? x : 0);
  return { oyun: sayi(k.oyun), toplam: sayi(k.toplam), sure: sayi(k.sure),
    son: Array.isArray(k.son) ? k.son.filter((z) => Number.isFinite(z)).slice(-REKLAM.saatlikEnCok) : [] };
}

// bilgi: {cevrimici, sureSn, kutlama}; kayit bu oyunun sayaçları eklenmiş hâlidir
function gecisUygunMu(bilgi, kayit, simdi) {
  if (bilgi.cevrimici || bilgi.kutlama) return false;
  if (!(bilgi.sureSn >= REKLAM.enKisaOyunSn)) return false;
  if (kayit.oyun <= REKLAM.ilkOyunlar || kayit.toplam < REKLAM.ilkSureSn) return false;
  if (kayit.sure < REKLAM.araSureSn) return false;
  return kayit.son.filter((z) => simdi - z < 3600e3).length < REKLAM.saatlikEnCok;
}

// oyunSonu() çağırır: ödül düğmesini sıfırlar, sayaçları günceller, uygunsa geçiş reklamını gösterir
function reklamOyunBitti(bilgi = {}) {
  reklam.odulKullanildi = false;
  odulDugmesiniGuncelle();
  const k = save.reklam = reklamKaydiniTemizle(save.reklam);
  const simdi = Date.now(), sn = Math.max(0, Number(bilgi.sureSn) || 0);
  k.oyun++; k.toplam += sn; k.sure += sn;
  k.son = k.son.filter((z) => simdi - z < 3600e3);
  const ad = admobPlugin();
  if (ad && reklam.hazir && gecisUygunMu(bilgi, k, simdi)) {
    if (!reklam.gecisYuklu) gecisYukle(); // hazır değil: sayaç sürer, sonraki oyun sonunda
    else {
      setTimeout(() => {
        // Bu arada yeni oyun başladıysa ("Tekrar Oyna") ya da ekrandan çıkıldıysa reklam gösterilmez: hak sonraki oyun sonuna
        if (game.running || !document.getElementById("screen-gameover").classList.contains("active")) return;
        const k2 = save.reklam; k2.sure = 0; k2.son.push(Date.now()); persistSave();
        ad.showInterstitial().catch(() => { reklam.gecisYuklu = false; gecisYukle(); });
      }, 800);
    }
  }
  persistSave();
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

// Dünya Turu'nda reklamla devam: sonuc(kazandi) reklam kapanınca bir kez çağrılır
function reklamDevamHazir() {
  return !!admobPlugin() && reklam.hazir && reklam.odulluYuklu;
}

async function reklamDevamIzle(sonuc) {
  const ad = admobPlugin();
  if (!ad || !reklam.hazir || !reklam.odulluYuklu || reklam.devamSonucu) return;
  reklam.devamSonucu = sonuc;
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
  if (reklam.devamSonucu) {
    const sonuc = reklam.devamSonucu, kazandi = reklam.odulKazanildi;
    reklam.devamSonucu = null;
    reklam.odulKazanildi = false;
    if (kazandi) {
      save.reklam = reklamKaydiniTemizle(save.reklam);
      save.reklam.sure = 0; // kendi isteğiyle reklam izleyene bir sonraki geçiş reklamı için yeniden 6 dk
      persistSave();
    }
    sonuc(kazandi);
    odulDugmesiniGuncelle();
    odulluYukle();
    return;
  }
  if (reklam.odulKazanildi && !reklam.odulKullanildi) {
    reklam.odulKazanildi = false;
    reklam.odulKullanildi = true;
    save.zumrut = (save.zumrut || 0) + REKLAM.odulZumrut;
    save.reklam = reklamKaydiniTemizle(save.reklam);
    save.reklam.sure = 0; // kendi isteğiyle reklam izleyene bir sonraki geçiş reklamı için yeniden 6 dk
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
  const devam = document.getElementById("btn-tur-devam");
  if (devam) devam.disabled = !(reklam.hazir && reklam.odulluYuklu) || !!reklam.devamSonucu; // yüklenene kadar bekler
  if (typeof turDirilTeklifi === "function" && typeof game !== "undefined" && game.player) turDirilTeklifi(); // çevrimiçi tur
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
