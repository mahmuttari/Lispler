/* ============================================================
   HAYALET AVCILARI
   Kızımız için yapılmış basit ve eğlenceli bir oyun.
   ============================================================ */

// ====== SES SİSTEMİ ======
const HIKAYE_SESLERI = ["hatira", "sahne", "dogru", "yanlis", "kopru-ac", "kopru-kilit", "harita", "arkadas", "rozet", "fener", "eve-donus"];
// SES1: canlı ülke objeleri, yuva canlıları ve ortam sesleri
const CANLI_SESLERI = ["panda", "komodo", "ejder-alev", "leylek", "fil", "penguen", "lemur", "zurafa",
  "flamingo", "gelada", "deve", "tavus", "kaplan", "kunduz", "aksolotl", "lama", "papagan", "yavru-ejder", "fare-kac", "yarasa-kac",
  "fare-cik", "selale", "lav", "timsah"];
const audio = {
  ctx: null,
  enabled: true,
  samples: {},
  // Kategori ses seviyeleri (0..1). save.volumes ile değiştirilebilir
  volumes: { ghost: 1, fire: 1, sfx: 1, muzik: 0.6 },
  _preloaded: false,
  _lastSmallGhost: 0,
  _canliSon: {},        // SES1: canlı ses başına son çalma zamanı (ms)
  _canliAktif: 0,       // SES1: çalan canlı ses sayısı
  _ortam: { selale: null, lav: null }, // SES1: döngüsel ortam kaynakları
  _ortamBolum: 0,
  _canliRnd: 123456789, // SES1: tohumlu sayaç (Math.random yok)
  _v(cat) { const v = this.volumes && this.volumes[cat]; return v == null ? 1 : v; },
  init() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") this.ctx.resume();
      this.preloadSamples();
      return;
    }
    try {
      // Android'de varsayılan "interactive" tampon donanımınki kadar küçüktür (~4 ms): işlemci yüklüyken (tek oyunculu
      // oyun ve oda kurucusu bütün benzetimi yürütür) tampon zamanında dolmazsa ses kesilir, sürekli müzikte cızırtı
      // olur. "balanced" Android'de 20 ms; efektler ~16 ms geç duyulur, fark edilmez (3.14.2)
      this.ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: "balanced" });
      this.preloadSamples();
    } catch (e) {}
  },
  preloadSamples() {
    if (this._preloaded || !this.ctx) return;
    this._preloaded = true;
    this.loadSample("smallGhost", "sfx/kucuk-hayalet.m4a");
    this.loadSample("bigGhost", "sfx/buyuk-hayalet.m4a");
    for (const ad of HIKAYE_SESLERI) this.loadSample("h:" + ad, "sfx/hikaye/" + ad + ".m4a");
    // SES1: canlı sesler 4 sn sonra yüklenir; açılışta müzik girişinin çözülmesini geciktirmesin
    setTimeout(() => { for (const ad of CANLI_SESLERI) this.loadSample("c:" + ad, "sfx/canli/" + ad + ".m4a"); }, 4000);
  },
  async loadSample(key, url) {
    if (this.samples[key] || !this.ctx) return;
    try {
      const res = await fetch(url);
      const arr = await res.arrayBuffer();
      const buf = await this.ctx.decodeAudioData(arr);
      this.samples[key] = buf;
    } catch (e) {}
  },
  playSample(key, vol) {
    if (!this.enabled || !this.ctx) return false;
    const buf = this.samples[key];
    if (!buf) return false;
    vol = vol == null ? 0.7 : vol;
    const src = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    src.buffer = buf;
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    src.connect(gain).connect(this.ctx.destination);
    src.start();
    return true;
  },
  smallGhost() {
    // Aynı anda 20+ hayalet patlamamak için 250 ms global throttle
    const now = performance.now();
    if (now - this._lastSmallGhost < 250) return;
    this._lastSmallGhost = now;
    this.playSample("smallGhost", 0.45 * this._v("ghost"));
  },
  bigGhost() {
    if (!this.playSample("bigGhost", 0.8 * this._v("ghost"))) this.boss();
  },
  hikayeSes(ad, vol) {
    return this.playSample("h:" + ad, (vol == null ? 0.6 : vol) * this._v("sfx"));
  },
  // SES1: dünya noktasından canlı ses. En çok 450 ms'de bir aynı ses, aynı anda en çok 3 kaynak.
  canliSes(ad, x, y, temel = 0.55) {
    if (!this.enabled || !this.ctx) return false;
    if (typeof game === "undefined" || !game || !game.running || game.paused || game.menude) return false;
    const buf = this.samples["c:" + ad];
    if (!buf) return false;
    const W = game.W || 0, H = game.H || 0, cam = game.camera || { x: 0, y: 0 };
    const p = game.player && !game.player.dead ? game.player : null;
    const px = p ? p.x : cam.x + W / 2, py = p ? p.y : cam.y + H / 2;
    const d = Math.hypot(x - px, y - py);
    const vol = (temel == null ? 0.55 : temel) * this._v("sfx") * Math.max(0, Math.min(1, 1 - d / 700));
    if (vol < 0.04) return false;
    const now = performance.now();
    if (now - (this._canliSon[ad] || -1e9) < 450) return false;
    if (this._canliAktif >= 3) return false;
    this._canliSon[ad] = now;
    const src = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    src.buffer = buf;
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    src.connect(gain);
    let node = gain;
    if (this.ctx.createStereoPanner) {
      const pan = this.ctx.createStereoPanner();
      const panDeger = W ? Math.max(-1, Math.min(1, (x - (cam.x + W / 2)) / (W / 2))) * 0.6 : 0;
      pan.pan.setValueAtTime(panDeger, this.ctx.currentTime);
      gain.connect(pan);
      node = pan;
    }
    node.connect(this.ctx.destination);
    this._canliAktif++;
    let bitti = false;
    src.onended = () => { if (bitti) return; bitti = true; this._canliAktif = Math.max(0, this._canliAktif - 1); };
    try { src.start(); } catch (e) { src.onended(); return false; }
    return true;
  },
  // SES1: şelale/lav döngü kaynakları. En yakın kaynağa göre ses; 500 px içinde başlar, 560 px dışında durur.
  _ortamlariDurdur() {
    for (const tur of ["selale", "lav"]) {
      const O = this._ortam[tur];
      if (!O) continue;
      try { O.src.stop(); } catch (e) {}
      try { O.src.disconnect(); } catch (e) {}
      this._ortam[tur] = null;
    }
  },
  ortamDurdur() { this._ortamlariDurdur(); },
  _ortamKaynak(tur, d, x, y) {
    let O = this._ortam[tur];
    if (d > 560) { if (O) { try { O.src.stop(); } catch (e) {} try { O.src.disconnect(); } catch (e) {} this._ortam[tur] = null; } return; }
    if (d > 500 && !O) return;
    if (!O) {
      if (!this.ctx || !this.samples["c:" + tur]) return;
      const src = this.ctx.createBufferSource();
      const gain = this.ctx.createGain();
      src.buffer = this.samples["c:" + tur];
      src.loop = true;
      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      src.connect(gain).connect(this.ctx.destination);
      try { src.start(); } catch (e) { return; }
      O = this._ortam[tur] = { src, gain, x, y };
    }
    const hedef = 0.35 * this._v("sfx") * Math.max(0, Math.min(1, 1 - d / 500));
    O.x = x; O.y = y;
    if (O.gain.gain.setTargetAtTime) O.gain.gain.setTargetAtTime(hedef, this.ctx.currentTime, 0.25);
    else O.gain.gain.setValueAtTime(hedef, this.ctx.currentTime);
  },
  ortamGuncelle() {
    if (!this.enabled || !this.ctx) { this._ortamlariDurdur(); return; }
    if (typeof game === "undefined" || !game || !game.running || game.paused || game.menude) { this._ortamlariDurdur(); return; }
    if (this._ortamBolum !== game.level) { this._ortamlariDurdur(); this._ortamBolum = game.level; }
    const W = game.W || 0, H = game.H || 0, cam = game.camera || { x: 0, y: 0 };
    const p = game.player && !game.player.dead ? game.player : null;
    const px = p ? p.x : cam.x + W / 2, py = p ? p.y : cam.y + H / 2;
    const gor = (x, y) => x > cam.x - 600 && x < cam.x + W + 600 && y > cam.y - 600 && y < cam.y + H + 600;
    let enSelale = null, enSelaleD = Infinity, enLav = null, enLavD = Infinity;
    if (typeof yolculukAcik === "function" && yolculukAcik() && game._yolculukDuzen) {
      for (const z of game._yolculukDuzen.zones || []) {
        for (const dm of z._gecitDusmeler || []) {
          const x = dm.x, y = dm.y;
          if (!gor(x, y)) continue;
          const d = Math.hypot(x - px, y - py);
          if (d < enSelaleD) { enSelaleD = d; enSelale = { x, y }; }
        }
      }
    }
    for (const o of game.lavas || []) {
      const x = o.x + o.w / 2, y = o.y + o.h / 2;
      if (!gor(x, y)) continue;
      const d = Math.hypot(x - px, y - py);
      if (d < enLavD) { enLavD = d; enLav = { x, y }; }
    }
    if (enSelale) this._ortamKaynak("selale", enSelaleD, enSelale.x, enSelale.y);
    else this._ortamKaynak("selale", Infinity, 0, 0);
    if (enLav) this._ortamKaynak("lav", enLavD, enLav.x, enLav.y);
    else this._ortamKaynak("lav", Infinity, 0, 0);
  },
  beep(freq, dur, type, vol) {
    if (!this.enabled || !this.ctx) return;
    type = type || "sine";
    vol = vol == null ? 0.18 : vol;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  },
  slide(f1, f2, dur, type, vol) {
    if (!this.enabled || !this.ctx) return;
    type = type || "triangle";
    vol = vol == null ? 0.18 : vol;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f1, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, f2), t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  },
  noise(dur, vol) {
    if (!this.enabled || !this.ctx) return;
    vol = vol == null ? 0.15 : vol;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    src.buffer = buf;
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    src.connect(gain).connect(this.ctx.destination);
    src.start();
  },
  click()  { const v = this._v("sfx"); this.beep(900, 0.05, "square", 0.10 * v); },
  toast()  { const v = this._v("sfx"); this.beep(660, 0.07, "sine", 0.10 * v); },
  fire()   { const v = this._v("fire"); this.beep(820, 0.05, "triangle", 0.07 * v); },
  hit()    { const v = this._v("sfx"); this.beep(220, 0.06, "square", 0.10 * v); },
  zap()    { const v = this._v("sfx"); this.slide(1800, 2600, 0.10, "sawtooth", 0.12 * v); setTimeout(() => this.beep(3200, 0.06, "square", 0.10 * v), 70); setTimeout(() => this.beep(2400, 0.05, "square", 0.08 * v), 150); },
  kill()   { const v = this._v("sfx"); this.slide(700, 1100, 0.18, "triangle", 0.16 * v); },
  boss()   { const v = this._v("ghost"); this.slide(220, 90, 0.5, "sawtooth", 0.20 * v); },
  bossDie(){ const v = this._v("sfx"); this.slide(150, 800, 0.4, "sawtooth", 0.22 * v); setTimeout(() => this.beep(1000, 0.18, "triangle", 0.18 * v), 350); },
  damage() { const v = this._v("sfx"); this.slide(300, 90, 0.25, "sawtooth", 0.22 * v); },
  pickup() { const v = this._v("sfx"); this.beep(1100, 0.06, "sine", 0.12 * v); },
  gem()    { const v = this._v("sfx"); this.beep(1500, 0.10, "sine", 0.15 * v); setTimeout(() => this.beep(2000, 0.10, "sine", 0.13 * v), 60); },
  emerald(){ const v = this._v("sfx"); this.slide(800, 1600, 0.25, "sine", 0.16 * v); },
  win()    {
    const v = this._v("sfx");
    this.beep(523, 0.10, "triangle", 0.18 * v);
    setTimeout(() => this.beep(659, 0.10, "triangle", 0.18 * v), 110);
    setTimeout(() => this.beep(784, 0.18, "triangle", 0.18 * v), 220);
    setTimeout(() => this.beep(1047, 0.25, "triangle", 0.18 * v), 380);
  },
  lose()   {
    const v = this._v("sfx");
    this.slide(440, 220, 0.3, "sawtooth", 0.20 * v);
    setTimeout(() => this.slide(330, 110, 0.5, "sawtooth", 0.22 * v), 280);
  },
  buy()    { const v = this._v("sfx"); this.beep(700, 0.06, "square", 0.12 * v); setTimeout(() => this.beep(1100, 0.10, "triangle", 0.14 * v), 60); },
  unlock() {
    const v = this._v("sfx");
    this.beep(660, 0.08, "triangle", 0.16 * v);
    setTimeout(() => this.beep(880, 0.08, "triangle", 0.16 * v), 90);
    setTimeout(() => this.beep(1175, 0.16, "triangle", 0.18 * v), 180);
  },
  heart() {
    const v = this._v("sfx");
    this.beep(523, 0.08, "triangle", 0.20 * v);
    setTimeout(() => this.beep(659, 0.08, "triangle", 0.20 * v), 80);
    setTimeout(() => this.beep(880, 0.10, "triangle", 0.22 * v), 160);
    setTimeout(() => this.beep(1175, 0.18, "triangle", 0.24 * v), 260);
  },
  levelUp(){
    const v = this._v("sfx");
    this.beep(523, 0.08, "triangle", 0.16 * v);
    setTimeout(() => this.beep(784, 0.08, "triangle", 0.16 * v), 90);
    setTimeout(() => this.beep(1047, 0.18, "triangle", 0.18 * v), 180);
  },
};

// ====== ONLINE / MULTIPLAYER (Firebase JS SDK) ======
const RTDB_URL = "https://hayalet-avcilari-default-rtdb.europe-west1.firebasedatabase.app";
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCEEVvj49yaZBxAJe78EjeUZBlpJaFyouU",
  databaseURL: RTDB_URL,
  projectId: "hayalet-avcilari",
};
const ROOM_LIST_TTL_MS = 60000; // listener'lar real-time, sadece zombie temizlik için

// Firebase init
let _fbDb = null;
function fbDb() {
  if (_fbDb) return _fbDb;
  if (typeof firebase === "undefined") {
    console.error("Firebase SDK yüklenmedi");
    return null;
  }
  if (!firebase.apps || firebase.apps.length === 0) {
    firebase.initializeApp(FIREBASE_CONFIG);
  }
  _fbDb = firebase.database();
  return _fbDb;
}

// ====== FIREBASE AUTH (anonim giriş) ======
// Çevrimiçi oda, kodlu yedek ve şampiyonlar listesi kayıtları auth.uid'e bağlıdır (firebase/README.md).
// Oturum yoksa anonim giriş yapılır; Google ile girişte bu anonim hesap Google'a yükseltilir (uid aynı kalır).
function fbAuth() {
  try {
    if (!fbDb() || !firebase.auth) return null;
    return firebase.auth();
  } catch (_) { return null; }
}

// Kayıtlı oturum (anonim ya da Google) yüklenince çözülür; ondan önce anonim giriş Google oturumunu ezebilir
let _authIlkDurum = null;
function authIlkDurum(auth) {
  if (!_authIlkDurum) {
    _authIlkDurum = new Promise((resolve) => {
      let kapat = null, geldi = false;
      kapat = auth.onAuthStateChanged(() => { geldi = true; resolve(); if (kapat) kapat(); });
      if (geldi) kapat();
    });
  }
  return _authIlkDurum;
}

let _anonimGiris = null;
async function fbKullanici() {
  const auth = fbAuth(); if (!auth) return null;
  await authIlkDurum(auth);
  if (auth.currentUser) return auth.currentUser;
  if (!_anonimGiris) {
    _anonimGiris = auth.signInAnonymously()
      .then((r) => r.user, (e) => { console.error("signInAnonymously", e); return null; })
      .finally(() => { _anonimGiris = null; }); // başarısızsa sonraki çağrı yeniden dener
  }
  return _anonimGiris;
}

// Giriş en çok ms kadar beklenir (yavaş ağda ekran takılmasın); süre dolarsa null
function fbKullaniciBekle(ms) {
  return Promise.race([fbKullanici(), new Promise((r) => setTimeout(() => r(null), ms))]);
}

// Çevrimiçi oyuncu kimliği: auth.uid. Giriş olmazsa (internet yok, sağlayıcı kapalı) null: kurallar girişsiz
// yazımı reddeder, oda kurma/katılma "bağlanılamadı" der (3.10.2'deki eski "u_" kimliği yedeği 3.10.3'te kalktı).
async function onlineKimlik() {
  const u = await fbKullaniciBekle(10000);
  return (u && u.uid) || null;
}
function baglantiYok() {
  const msg = t("⚠ Firebase'e bağlanılamadı — internetini kontrol edip yeniden dene.");
  setOnlineStatus(msg);
  return msg;
}

// SDK helper — mevcut rtdb.X çağrıları için geri uyumlu wrapper
const rtdb = {
  get: async (path) => {
    try {
      const db = fbDb(); if (!db) return null;
      const snap = await db.ref(path).get();
      return snap.exists() ? snap.val() : null;
    } catch (e) { online.lastError = e.message; console.error("rtdb.get", path, e); return null; }
  },
  put: async (path, body) => {
    try {
      const db = fbDb(); if (!db) return null;
      await db.ref(path).set(body);
      return body;
    } catch (e) { online.lastError = e.message; console.error("rtdb.put", path, e); return null; }
  },
  patch: async (path, body) => {
    try {
      const db = fbDb(); if (!db) return null;
      await db.ref(path).update(body);
      return body;
    } catch (e) { online.lastError = e.message; console.error("rtdb.patch", path, e); return null; }
  },
  post: async (path, body) => {
    try {
      const db = fbDb(); if (!db) return null;
      const ref = await db.ref(path).push(body);
      return { name: ref.key };
    } catch (e) { online.lastError = e.message; console.error("rtdb.post", path, e); return null; }
  },
  remove: async (path) => {
    try {
      const db = fbDb(); if (!db) return null;
      await db.ref(path).remove();
      return null;
    } catch (e) { online.lastError = e.message; console.error("rtdb.remove", path, e); return null; }
  },
};

// Oturum durumu
const online = {
  uid: null,
  roomId: null,
  isHost: false,
  selectedMax: 6,        // Oda Kur'un varsayılanı: en büyük oda (3.12.2'den beri 6, kurallar 2–6)
  selectedKip: "normal", // Oda Kur: "normal" | "tur" (3.14.0 Dünya Turu odası)
  selectedUlke: 0,       // Oda Kur: Dünya Turu odasının ülkesi (açık ülkelerden; 0 = en ileri açık ülke)
  turSonUlke: null,      // istemci: son uygulanan ülke (damga için; ortadan katılanda ilk durumda null)
  ortadanKatildi: false, // oyun sürerken katıldı: müzik teaser'sız başlar
  cachedRoom: null,      // { name, maxPlayers, hostUid, hostName, status, players, tur, level, yj }
  // Oyun içi senkronizasyon
  mode: null,            // null | "host" | "client"
  pushTimer: null,       // MP_PUSH_MS'de bir mpPush
  remotePlayers: {},     // { uid: { name, charKey, costumeIdx, x, y, hp, maxHp, dead, … ara değerleme tamponu } }
  pendingEvents: [],     // istemci → host olay kuyruğu (vuruş, para alma, cephane)
  sonDurum: 0,           // istemci: host'tan son durumun geldiği an (performance.now)
  sunucuFarki: 0,        // .info/serverTimeOffset
  alinanlar: new Set(),  // istemci: aldığım paraların kimlikleri (host silene kadar yeniden görünmesin)
  _aldBekleyen: new Map(), // istemci: host onayı bekleyen değerli toplanabilirler (kimlik → ödül)
  _aldYok: false,        // kural "ald" alanını kabul etmiyor: durum yazımı onsuz sürer
  _yjYok: false,         // kural yolculuk (kp/bz/ab/aw) alanlarını kabul etmiyor: eski harita
  vuranlar: new Set(),   // istemci: bana çarpan / vurduğum düşman mermilerinin kimlikleri
  vurduklarim: new Map(),// istemci: hayalet kimliği → son vuruşum (yakalananı kendime saymak için)
  baslatiliyor: false,   // host BAŞLAT'a bastı, durum dinleyicisi oyunu ikinci kez açmasın
  ayriliyor: false,      // odadan çıkılıyor, dinleyici olayları yok sayılır
  // Firebase dinleyicileri
  _odaDinleyicileri: [],
  _durumDinleyici: null,
  _roomListRef: null,
  _roomListListener: null,
  _eventsRef: null,
  _eventsListener: null,
  _nabiz: null,
};

// Senk ayarları
const MP_PUSH_MS = 100;        // kendi kaydımı ve (host) oyun durumunu yazma aralığı (10 Hz)
const ARA_GECIKME_MS = 110;    // istemci görüntüleri bu kadar geriden ara değerler
const ILERI_KESTIRIM_MS = 160; // yeni görüntü gecikirse en çok bu kadar ileri kestirir
const ISINLA_MESAFE = 260;     // bundan uzun sıçrama ara değerlenmez, ışınlanır
const HOST_BEKLEME_MS = 2500;  // host'tan bu kadar durum gelmezse "Host bekleniyor"
let _mpPushInflight = false, _durumYolda = false;
let _sonPickupImza = "", _sonOyuncuKaydi = {}, _sonTamKayit = 0;
const AV_ARALIK_MS = 400;      // hayalet sayım (av) değişince en çok bu aralıkla yazılır (tur sonu sıralaması)
let _sonAv = -1, _avZamani = 0;

// ====== KAYIT SİSTEMİ ======
const SAVE_KEY = "hayaletAvcilariSave_v1";
const LEADERBOARD_KEY = "hayaletAvcilariLeaderboard_v1";
const LEADERBOARD_MAX = 500; // 3.16.1, kullanıcı: "Şampiyon listesi ilk 500 göstersin" (eskiden 10)
const VERSION_KEY = "hayaletAvcilariLastSeenVersion";

// ====== SÜRÜM NOTLARI ======
const APP_VERSION = "3.20.0";
const UPDATE_NOTES = {
  // Mağaza notu aynı satırlar; her dilde 500 karakterin altında kalsın diye Dünya Turu'nun satırları (3.14.0) yok
  // 3.15.0 incelemedeyken 3.15.1 gelebilir: 3.15.0'ın satırları ve düzeltme (mağaza notu aynı satırlar, ≤ 500)
  // 3.17.0 (kullanıcı: "Yarasalar uçuşsun ormanda. Arada şimşek çakan bulutlar gezinsin. Bosun üzerinde."): 3.16.2
  // gönderilmeden geldi, onun satırları da var; 🌉 ve 🌿 (3.15.0'dan beri yayında) 500 sınırı için çıktı
  // 3.18.0 (kullanıcı: "Animasyonlar ekleyebilirsin, statik olmak zorunda değil"; "tornado efekti çok güzel olsun,
  // hayaletleri savura savura yok etsin"): kod animasyonları (anim.js) ve yeni kasırga; 🎬 ve 🐊 (yayında) 500 sınırı
  // için çıktı
  // 3.19.0 (kullanıcı: "karakterleri mevcut görünümlerinden esinlenerek tamamen baştan oluşturt, 3D olsun, animasyonlu
  // duruş, hareket ve atış"): 3D görünümlü karakterler ve silahlar (ChatGPT; kod Evren); 🐾 (yayında) 500 sınırı için çıktı
  "3.20.0": [
    t("🧊 Avcılar artık gerçek 3D: her yöne dönüyor, yürüyor, koşuyor; silah hep elinde!"),
    t("👥 Yeni Karakterler ekranı: her avcının hikâyesi, gücü, yetenekleri ve kostümleri tek panelde."),
    t("⚡ Ek silahlar ve güçler animasyonlu: yıldırım, roket dumanı, buz bloğu, güç halesi!"),
    t("🔊 Bütün ses efektleri yenilendi; her mağaza silahının kendi atış sesi var."),
    t("⚙️ Ses ayarlarında yeni \"3D karakterler\" düğmesi; yavaş telefonda 3D kendiliğinden kapanır."),
  ],
  "3.19.0": [
    t("🎮 Avcılar 3D görünümle yepyeni: nefes alıyor, yürüyor, ateş edince geri tepiyor; silahlar da yenilendi!"),
    t("✨ Hayaletler canlandı: süzülüyor, göz kırpıyor, vurulunca parlıyor, puf diye dağılıyor; paralar dönüyor!"),
    t("🌪️ Kasırga yenilendi: hayaletleri içine çekip döndürüyor ve savuruyor!"),
    t("🎨 Hayaletler, petler ve eşyalar yepyeni çizimlerle; kare kare animasyonlar!"),
    t("🦇 Ormanda yarasalar uçuşuyor; boss'un tepesinde şimşek çakan bir fırtına bulutu dolaşıyor!"),
  ],
  "3.18.0": [
    t("✨ Hayaletler canlandı: süzülüyor, göz kırpıyor, vurulunca parlıyor, puf diye dağılıyor; paralar dönüyor!"),
    t("🌪️ Kasırga yenilendi: hayaletleri içine çekip döndürüyor ve savuruyor!"),
    t("🎨 Karakterler, hayaletler, petler ve eşyalar yepyeni çizimlerle; kare kare animasyonlar!"),
    t("🦇 Ormanda yarasalar uçuşuyor; boss'un tepesinde şimşek çakan bir fırtına bulutu dolaşıyor!"),
    t("🐾 Petler geldi: kedi, köpek ya da kuşunu yanına al! Hayaletler de onlara vurur; her petin 5 canı var."),
  ],
  "3.17.0": [
    t("🦇 Ormanda yarasalar uçuşuyor; boss'un tepesinde şimşek çakan bir fırtına bulutu dolaşıyor!"),
    t("🎨 Yeni görünüm ve 🏆 ilk 500 şampiyon listesi."),
    t("🎬 Reklam izle: Dünya Turu'nda kaldığın yerden devam et (3 kez) ya da oyun sonunda paranı 2 katına çıkar."),
    t("🐊 Sulardan timsah çıkıyor: kıyıda oyalananı ısırabilir!"),
    t("🐾 Petler geldi: kedi, köpek ya da kuşunu yanına al! Hayaletler de onlara vurur; her petin 5 canı var."),
  ],
  // 3.16.2 (kullanıcının seçimi "2 ve 3"): ödüllü 2× para ve biraz daha sık geçiş reklamı; 🎬 satırı reklamla devamı ve
  // 2× parayı birlikte söyler (500 karakter sınırı)
  "3.16.2": [
    t("🎨 Yeni görünüm ve 🏆 ilk 500 şampiyon listesi."),
    t("🎬 Reklam izle: Dünya Turu'nda kaldığın yerden devam et (3 kez) ya da oyun sonunda paranı 2 katına çıkar."),
    t("🐊 Sulardan timsah çıkıyor: kıyıda oyalananı ısırabilir!"),
    t("🌉 Göllerde sallanan ip köprüler: hızlı geç, ortada oyalanırsan suya düşersin!"),
    t("🐾 Petler geldi: kedi, köpek ya da kuşunu yanına al! Hayaletler de onlara vurur; her petin 5 canı var."),
    t("🌿 Çalıya saklan, hayaletler seni göremez; hayaletler artık dibinde doğmaz."),
  ],
  // 3.16.1 (kullanıcı: "Şampiyon listesi ilk 500 göstersin"): 3.16.0 incelemedeyken yerini alabilir; 🎨 satırı ikisini birlikte
  // söyler (500 karakter sınırı)
  "3.16.1": [
    t("🎨 Yeni görünüm ve 🏆 ilk 500 şampiyon listesi."),
    t("🎬 Dünya Turu'nda canların bitince reklam izle, kaldığın yerden devam et (oyun başına 3 kez)."),
    t("🐊 Sulardan timsah çıkıyor: kıyıda oyalananı ısırabilir!"),
    t("🌉 Göllerde sallanan ip köprüler: hızlı geç, ortada oyalanırsan suya düşersin!"),
    t("🐾 Petler geldi: kedi, köpek ya da kuşunu yanına al! Hayaletler de onlara vurur; her petin 5 canı var."),
    t("🌿 Çalıya saklan, hayaletler seni göremez; hayaletler artık dibinde doğmaz."),
  ],
  // 3.16.0 (kullanıcı: "Oyun arayüzünü, kontrolleri, tuşları, tüm arayüzü daha profesyonel hale getir"): yeni görünüm;
  // 3.15.1 Play incelemesindeyken yerini aldı, onun satırları da var (🛠️ satırı 500 karakter sınırı için çıktı)
  "3.16.0": [
    t("🎨 Yeni görünüm: düğmeler, kontroller ve göstergeler yenilendi."),
    t("🎬 Dünya Turu'nda canların bitince reklam izle, kaldığın yerden devam et (oyun başına 3 kez)."),
    t("🐊 Sulardan timsah çıkıyor: kıyıda oyalananı ısırabilir!"),
    t("🌉 Göllerde sallanan ip köprüler: hızlı geç, ortada oyalanırsan suya düşersin!"),
    t("🐾 Petler geldi: kedi, köpek ya da kuşunu yanına al! Hayaletler de onlara vurur; her petin 5 canı var."),
    t("🌿 Çalıya saklan, hayaletler seni göremez; hayaletler artık dibinde doğmaz."),
  ],
  "3.15.1": [
    t("🎬 Dünya Turu'nda canların bitince reklam izle, kaldığın yerden devam et (oyun başına 3 kez)."),
    t("🐊 Sulardan timsah çıkıyor: kıyıda oyalananı ısırabilir!"),
    t("🌉 Göllerde sallanan ip köprüler: hızlı geç, ortada oyalanırsan suya düşersin!"),
    t("🐾 Petler geldi: kedi, köpek ya da kuşunu yanına al! Hayaletler de onlara vurur; her petin 5 canı var."),
    t("🌿 Çalıya saklan, hayaletler seni göremez; hayaletler artık dibinde doğmaz."),
    t("🛠️ Ayarlardan dönünce oyun artık durmuyor."),
  ],
  "3.15.0": [
    t("🎬 Dünya Turu'nda canların bitince reklam izle, kaldığın yerden devam et (oyun başına 3 kez)."),
    t("🐊 Sulardan timsah çıkıyor: kıyıda oyalananı ısırabilir!"),
    t("🌉 Göllerde sallanan ip köprüler: hızlı geç, ortada oyalanırsan suya düşersin!"),
    t("🐾 Petler geldi: kedi, köpek ya da kuşunu yanına al, hayaletlere birlikte saldırın!"),
    t("🌿 Çalıya saklan, hayaletler seni göremez; hayaletler artık dibinde doğmaz."),
  ],
  // 3.13.0'dan doğrudan gelen oyuncu 3.14.0'ı görmemiş olabilir: 3.14.0'ın satırları önce, 3.14.1'in düzeltmeleri sonda.
  // Mağaza notu (aynı satırlar) her dilde 500 karakterin altında kalsın diye sığmayan eski satırlar yok
  "3.14.2": [
    t("🌍 Dünya Turu: en kalabalık 50 ülke ve Filistin, her ülke kendi görselleri ve geleneksel kıyafetli bossuyla."),
    t("🛂 Ülkeyi geç, pasaportuna damga bas; arkadaşlarınla birlikte gez."),
    t("🎵 Her ülkenin kendi kültüründen giriş ve fon müziği; Ses Ayarları'nda yeni Müzik kaydırıcısı."),
    t("✈️ Arkadaşlarla oynarken de damga ve uçak geçişi görünür."),
    t("🛠️ Ses cızırtısına karşı düzeltmeler; müzik ve ülke geçişi düzeltildi; oyun sonu reklamı yeni oyunun üstüne gelmez."),
  ],
  "3.14.1": [
    t("🌍 Dünya Turu: en kalabalık 50 ülke ve Filistin, her ülke kendi görselleri ve geleneksel kıyafetli bossuyla."),
    t("🛂 Ülkeyi geç, pasaportuna damga bas; arkadaşlarınla birlikte gez."),
    t("🎵 Her ülkenin kendi kültüründen giriş ve fon müziği; Ses Ayarları'nda yeni Müzik kaydırıcısı."),
    t("✈️ Arkadaşlarla oynarken de damga ve uçak geçişi görünür."),
    t("🛠️ Oda kurucusundaki cızırtı giderildi; müzik ve ülke geçişi düzeltildi; oyun sonu reklamı yeni oyunun üstüne gelmez."),
  ],
  // 3.13.1 Play'e çıkmadı (reklam düzeltmesi bu sürümle gider); 3.13.0 incelemedeyse oyuncular onu görmeden geçer.
  // Mağaza notu (aynı satırlar) her dilde 500 karakterin altında kalsın diye 3.13.0'ın sığmayan son satırları yok
  "3.14.0": [
    t("🌍 Dünya Turu: en kalabalık 50 ülke ve Filistin, her ülke kendi görselleri ve geleneksel kıyafetli bossuyla."),
    t("🛂 Ülkeyi geç, pasaportuna damga bas; arkadaşlarınla birlikte gez."),
    t("🎵 Her ülkenin kendi kültüründen giriş ve fon müziği; Ses Ayarları'nda yeni Müzik kaydırıcısı."),
    t("😌 Reklamlar seyrekleşti; yeni oyuncuya ve kısa oyunlardan sonra reklam yok."),
    t("🛡️ Artık yalnızca her yaşa uygun reklamlar gösterilir."),
    t("👫 Arkadaş ekle: kodunu paylaş ya da lobide oyuncunun yanındaki ➕'ya dokun."),
  ],
  // 3.13.0 incelemedeyken gönderilirse oyuncular 3.13.0'ı görmeden geçer: notlar onu da anlatır. Mağaza notu (aynı
  // satırlar) İspanyolcada 500 karakteri aşmasın diye 👥 satırı (3.12.2) bu sürümde yok
  "3.13.1": [
    t("👫 Arkadaş ekle: kodunu paylaş ya da lobide oyuncunun yanındaki ➕'ya dokun."),
    t("📨 Arkadaşını odana çağır; davet gelince üstteki şeritten Katıl."),
    t("🟢 Arkadaşın çevrimiçi mi, odada mı gör; istemediğin kişiyi engelle."),
    t("🏰 Engeller yenilendi: kaleler, eğri kıyılı göller ve her temaya özel ürkünç ama sevimli objeler."),
    t("🏆 Online tur sonunda herkes yakaladığı hayalete göre sıralanır, birinci kupa kazanır."),
    t("🛡️ Artık yalnızca her yaşa uygun reklamlar gösterilir."),
  ],
  // 3.12.2 incelemedeyken gönderilirse oyuncular 3.11.0'dan doğrudan geçer: 👥 satırı bu yüzden. Satırlar kısa: mağaza
  // notu (aynı satırlar) her dilde 500 karakterin altında kalsın
  "3.13.0": [
    t("👫 Arkadaş ekle: kodunu paylaş ya da lobide oyuncunun yanındaki ➕'ya dokun."),
    t("📨 Arkadaşını odana çağır; davet gelince üstteki şeritten Katıl."),
    t("🟢 Arkadaşın çevrimiçi mi, odada mı gör; istemediğin kişiyi engelle."),
    t("👥 Online odalar artık 6 kişilik."),
    t("🏰 Engeller yenilendi: kaleler, eğri kıyılı göller ve her temaya özel ürkünç ama sevimli objeler."),
    t("🏆 Online tur sonunda herkes yakaladığı hayalete göre sıralanır, birinci kupa kazanır."),
  ],
  // 3.12.1 incelemedeyken 3.12.2 geldi: notlar 3.12.x'i de anlatır (oyuncular 3.11.0'dan doğrudan geçebilir;
  // mağaza notu 500 karakteri aşmasın diye 👻 satırı bu sürümde yok)
  "3.12.2": [
    t("👥 Online odalar artık 6 kişilik: altı avcı aynı odada birlikte oynar."),
    t("🌐 Online oyun yenilendi: donma ve hayalet sıçraması bitti, biri hayalet olunca da oyun akıcı sürüyor."),
    t("🔑 Lobideki oda kodunu arkadaşına söyle: Oda Listesi › Kodla Katıl ile gelir, oyun başlamış olsa da katılır."),
    t("🏁 Herkes hayalet olunca tur biter, kazançlar kaydedilir ve lobiye dönülür. Host çıkarsa oyun kapanmaz, sürer."),
  ],
  // 3.12.0 Play'e çıkmadan 3.12.1 geldi: notlar 3.12.0'ı da anlatır (oyuncular 3.11.0'dan doğrudan geçer)
  "3.12.1": [
    t("🌐 Online oyun yenilendi: donma ve hayalet sıçraması bitti, biri hayalet olunca da oyun akıcı sürüyor."),
    t("🔑 Lobideki oda kodunu arkadaşına söyle: Oda Listesi › Kodla Katıl ile gelir, oyun başlamış olsa da katılır."),
    t("👻 Hayaletler artık herkesi kovalar; senin vurduğun hayalet sana sayılır. Hayalet olan arkadaş sonraki bölümde yeniden doğar."),
    t("🏁 Herkes hayalet olunca tur biter, kazançlar kaydedilir ve lobiye dönülür. Host çıkarsa oyun kapanmaz, sürer."),
  ],
  "3.12.0": [
    t("🌐 Online oyun yenilendi: donma ve hayaletlerin ekranda sıçraması bitti, herkes akıcı hareket ediyor."),
    t("🔑 Lobideki oda kodunu arkadaşına söyle: Oda Listesi › Kodla Katıl ile gelir, oyun başlamış olsa da katılır."),
    t("👻 Hayaletler artık herkesi kovalar; senin vurduğun hayalet sana sayılır. Hayalet olan arkadaş sonraki bölümde yeniden doğar."),
    t("🏁 Herkes hayalet olunca tur biter, kazançlar kaydedilir ve lobiye dönülür. Host çıkarsa oyun kapanmaz, sürer."),
  ],
  "3.11.0": [
    t("👧 Yeni karakterler: Silsen çiçek top atar, Serçin tüy fırlatır — Karakterler menüsünde."),
    t("🐱 Serçin'e kulaklı, kanatlı kostüm: Kanatlı Kedi (Mağaza › Kostümler)."),
    t("🎒 Envanter: Mağaza › 🔫 Silahlar'dan 5 yeni silah al, oyunda 🎒 düğmesiyle değiştir; karakterin kendi silahı envanterde kalır."),
    t("🤖 Bot: tek kişilik oyunda yanında savaşır. Ona dokunursan ona ateş edersin; yenilince içinden 1 kalp çıkar."),
  ],
  "3.10.4": [
    t("🎮 Google Play Games: puanın Play Games skor tablosuna gider, 5 başarımın kilidini açabilirsin (Şampiyonlar ekranı)."),
    t("🔒 Çevrimiçi oda, kodlu yedek ve şampiyonlar listesi artık hep oyuncu kimliğinle korunuyor; bağlanılamazsa yeniden dene."),
  ],
  "3.10.3": [
    t("🔒 Çevrimiçi oda, kodlu yedek ve şampiyonlar listesi artık hep oyuncu kimliğinle korunuyor; bağlanılamazsa yeniden dene."),
  ],
  "3.10.2": [
    t("🔒 Çevrimiçi odan ve kodlu yedeğin artık sana bağlı: odanı yalnız sen kapatabilir, yedeğinin üzerine yalnız sen yazabilirsin."),
    t("✏️ İsmini değiştirince bu sürümden sonraki skorların şampiyonlar listesinde de yeni adınla görünür."),
  ],
  "3.10.1": [
    t("🎬 Oyun bitti ekranında reklam izleyerek +10 💚 zümrüt kazanabilirsin."),
    t("📺 Oyunu ücretsiz tutmak için oyun bitişlerinde arada bir reklam gösterilir; oyun sırasında reklam yok."),
  ],
  "3.10.0": [
    t("🌍 Yeni diller: English, Español, 简体中文, हिन्दी, العربية — Menü › 🌐 Dil."),
    t("🐛 Hayaletler artık engellerin içinde doğmuyor; engele sıkışan hayalet kendiliğinden dışarı çıkıyor — bölüm takılmadan bitiyor."),
    t("🌐 Çevrimiçi oyunda herkes aynı haritayı görüyor (engeller oyuncuya göre değişmiyor)."),
    t("🗑 Hesap ekranına “Hesabı Sil” eklendi: Google bulut yedeğini ve hesabını siler."),
  ],
  "3.9.0": [
    "🔐 Google ile Giriş eklendi — hesap kurtarma ve cihazlar arası senkron için.",
    "☁️ Bulut yedekleme: Google hesabınla otomatik yedek/geri yükleme.",
    "🔑 Manuel hesap kodu sistemi: internetsiz ortamlar için yedek olarak duruyor.",
    "✏️ İsim değiştirme: 50 💚 zümrüt karşılığında — şampiyonlar listesindeki ismi de güncellenir.",
    "🎚 Kategori bazlı ses seviyesi: 👻 Hayalet, 🔫 Atış, ✨ Diğer efektler için ayrı kaydırıcılar.",
  ],
  "3.8.4": [
    "📱 Daha fazla tablet artık Play Store'da uyumlu görünüyor (Lenovo TB350FU ve benzeri cihazlar dahil).",
  ],
  "3.8.3": [
    "🔊 Ses açma/kapama ayarı: Menü ve duraklat ekranında 🔊/🔇 butonu (kalıcı kayıt).",
    "👻 Hayalet sayısı 2 katına çıktı, daha hızlı spawn — daha yoğun aksiyon.",
    "👑 Boss artık 5 minik hayalet spawn ediyor; hepsi öldükten 5 sn sonra yenilerini gönderir.",
    "⏱ Boss geliş süreleri 10 sn daha kısaldı (Bölüm 1-10 için 20→10 sn).",
    "🔫 Karakter silahı artık nişan alınca yukarı kalkar, hedef yokken aşağıda durur.",
    "💥 Atış geri tepme animasyonu: silah kısa süreliğine geri yaslanır.",
    "🚶 Yürürken vücut hafifçe sağa-sola eğilir — daha canlı animasyon.",
  ],
  "3.8.2": [
    "👻 Küçük hayaletler artık hayatta oldukları sürece her 10 sn'de bir seslenir (önceden sadece spawn'da).",
    "👑 Boss her 3 sn'de bir kükrer.",
    "🔊 Aynı anda kalabalık seste karışma olmasın diye 250 ms global throttle.",
  ],
  "3.8.1": [
    "👻 Küçük hayalet sesi: hayaletler spawn olduğunda korkutucu sesleri duyulur (3.5 sn cooldown).",
    "👑 Boss sesi: bölüm bossu çıkınca büyük hayalet sesi çalar.",
  ],
  "3.7": [
    "📱 Tablet desteği eklendi — joystick, cephane butonları ve HUD tablet ekranında büyüdü.",
    "🔍 Tablette gameplay kamerası yakınlaştı; karakter ve hayaletler daha büyük görünüyor (telefon hissi korunuyor).",
    "🔄 Tablette hem yatay hem dik kullanım sorunsuz.",
    "🅰️ Menü, butonlar ve karakter önizlemesi tabletlerde okunaklı boyuta geldi.",
  ],
  "3.6": [
    "💰 Online'da kazandığın para/elmas/zümrüt menüye dönerken save'e yazılıyor (eskiden kayboluyordu).",
    "💣 Cephane silahları (bomba/şimşek/dondurma/roket) artık client modunda da hayalete etki ediyor — host'a event ile bildirilir.",
    "👻 Client'ta hayalet ölüm anında fade efekti + parçacıklar görünür (eskiden ışınlanarak yok oluyordu).",
  ],
  "3.5": [
    "👑 Host transferi: host ayrılırsa kalan en eski oyuncu otomatik host olur, oyun durmaz.",
    "👻 Spectator modu: ölen oyuncu mavi hayalet karakter olarak izleyici kalır, etrafta uçabilir, hasar almaz.",
  ],
  "3.4": [
    "🌊 Interpolation/Entity Smoothing eklendi — diğer oyuncular ve hayaletler akıcı hareket ediyor.",
    "⚡ Senk hızı 10 Hz'e çıktı, düşman mermileri hız vektörüyle akıcı uçuyor.",
    "🎯 Mesafesi 200 px üzerinde olan snapshot ışınlanır (lerp yerine), bölüm geçişi smooth.",
  ],
  "3.3": [
    "⚡ Online mod Firebase JS SDK'ya geçti — WebSocket üzerinden gerçek zamanlı senkronizasyon.",
    "🚀 Polling kaldırıldı, listener push: daha düşük gecikme + daha akıcı oyun.",
    "🔌 onDisconnect: bir cihaz çıkınca otomatik odadan kaldırılır, zombie odalar yok.",
  ],
  "3.2": [
    "🐛 Düzeltme: Boş ekran sorunu çözüldü (pickup scope hatası).",
    "🛡 Hata yakalayıcı eklendi — beklenmedik bir hatada üstte kırmızı bant görünür.",
  ],
  "3.1": [
    "🐛 Düzeltme: Oyuna girince boş ekran kalıyordu (kritik scope hatası).",
    "🎮 Lobi butonu netleştirildi: 'HAZIR OL' / '✓ HAZIRIM'.",
  ],
  "3.0": [
    "🌐 ONLINE ÇOKLU OYUNCU eklendi! Ana menüden 'Online Oyna' ile 5 kişilik odalara katıl.",
    "🎮 Oda kur, oda listesinden katıl, lobi'de hazır ol → birlikte oyna.",
    "👥 Aynı bölümde aynı hayaletlere karşı savaşın; diğer oyuncuların ismi + can çubuğu görünür.",
    "💰 Pickup yarışı: para/elmas kim önce alırsa onun olur.",
    "📡 Firebase Realtime Database üzerinden 10 Hz senkronizasyon.",
  ],
  "2.9": [
    "🎯 Her karakterin kendi mermi modeli: enerji topu, taş yumru, büyü yıldızı, ok, dönen bıçak, kurşun, sapan taşı, şeker top, enerji yumruğu...",
  ],
  "2.8": [
    "🗡 Her karakterin eline kendine özel silah tasarımı eklendi (tabanca, çekiç, asa, yay, sapan, nunchaku...).",
    "👑 Boss artık ateş ediyor; bölüm 8+ olunca 3'lü koni atışa geçiyor.",
    "👻 Bölüm 5+ : ara sıra ateş edebilen mor 'shooter' hayaletler çıkıyor.",
    "🛡 Düşman mermilerini oyuncu mermisiyle havada vurarak yok edebilirsin.",
  ],
  "2.7": [
    "🚶 Karakterlere yürüme animasyonu eklendi: adım atma + hafif zıplama.",
    "💥 Bomba ve roket ile vurulan hayaletler patlama merkezinden dışa savruluyor.",
  ],
  "2.6": [
    "🔥 Lav görseli yenilendi: parlak glow, magma kabuğu, çatlaklar ve çift kenar — su ile karışmıyor.",
    "💧 Su artık tüm bölümlerde sabit mavi; tema rengine göre değişmiyor.",
  ],
  "2.5": [
    "🦔 Yeni tehlike: Dikenlik alanlar — dokununca 1 saniye donarsın.",
    "🔥 Yeni tehlike: Lav — temas edince 1 can kaybedersin (3. bölümden itibaren çıkar).",
    "🚀 Roket artık çarptığı yerde 110 px alan hasarı veriyor.",
    "⚡ Şimşek silahı vurduğu hayaletlerin üzerinde elektrik spark efekti bırakıyor.",
    "👻 Ölen hayalet izi 1 sn'ye indi, daha canlı yukarı süzülüyor.",
  ],
  "2.4": [
    "💣 Bomba artık büyüyen patlama halkasıyla görsel olarak patlıyor.",
    "🚀 Roket ateş kuyruğuyla hedefe uçuyor, çarpınca patlama efekti veriyor.",
    "👻 Ölen hayaletler 3 saniye boyunca solarak arkasında iz bırakıyor.",
    "⚔️ İlk bölümlerdeki hayalet sayısı ve spawn hızı arttı.",
  ],
  "2.3": [
    "🎯 Yeni: Cephane sistemi! Mağaza → Cephane sekmesinden tek kullanımlık silahlar al.",
    "💣 7 silah eklendi: Bomba, Dondurma, Şimşek, Kasırga, İlk Yardım, Roket, Görünmezlik.",
    "👥 Karakter başına bağımsız yükseltme — her karakteri ayrı seviyele.",
    "❤️ Boss kalpleri artık max canı arttırmıyor; sadece eksik canı dolduruyor.",
  ],
};

// ====== FIRESTORE (online şampiyon listesi) ======
const FIREBASE = {
  projectId: "hayalet-avcilari",
  apiKey: "AIzaSyCEEVvj49yaZBxAJe78EjeUZBlpJaFyouU",
  collection: "scores",
};
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE.projectId}/databases/(default)/documents`;

// Firestore REST oturumu: kimlik jetonu alınabilirse { uid, headers: Authorization }, yoksa { uid: null }
// (girişsiz skor yazımı kurallarca reddedilir; liste okumak için oturum gerekmez)
async function firestoreOturum() {
  const headers = { "Content-Type": "application/json" };
  const u = await fbKullaniciBekle(5000);
  if (u) {
    try { headers.Authorization = "Bearer " + await u.getIdToken(); return { uid: u.uid, headers }; } catch (_) {}
  }
  return { uid: null, headers };
}

async function submitOnlineScore(entry) {
  const doc = {
    fields: {
      name:   { stringValue:  entry.name },
      level:  { integerValue: String(entry.level) },
      ghosts: { integerValue: String(entry.ghosts) },
      para:   { integerValue: String(entry.para) },
      score:  { integerValue: String(scoreFor(entry)) },
      date:   { integerValue: String(entry.date) },
    }
  };
  try {
    const oturum = await firestoreOturum();
    if (!oturum.uid) return false;
    doc.fields.uid = { stringValue: oturum.uid }; // skorun sahibi; isim değişikliğinde yalnız kendi skorların
    const res = await fetch(`${FIRESTORE_BASE}/${FIREBASE.collection}?key=${FIREBASE.apiKey}`, {
      method: "POST",
      headers: oturum.headers,
      body: JSON.stringify(doc),
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

// 3.16.1: tüm zamanların en iyileri. Eskiden son 200 kayıt (tarihe göre) alınıp içinden ilk 10 seçiliyordu; eski yüksek
// skorlar listeye giremiyordu. Artık skora göre azalan sırayla sayfa sayfa okunur, her isimden en yüksek skor kalır;
// `limit` farklı avcıya ulaşınca ya da kayıt bitince durur. Okuma sınırı: en çok SAMPIYON_SAYFA_SAYISI × SAMPIYON_SAYFA belge.
const SAMPIYON_SAYFA = 300, SAMPIYON_SAYFA_SAYISI = 6;
async function fetchOnlineLeaderboard(limit) {
  limit = limit || LEADERBOARD_MAX;
  const tam = (f, ad, varsayilan) => (f[ad] ? parseInt(f[ad].integerValue) : varsayilan);
  const seen = new Set();
  const unique = [];
  let imlec = null;
  try {
    for (let sayfa = 0; sayfa < SAMPIYON_SAYFA_SAYISI && unique.length < limit; sayfa++) {
      const query = {
        structuredQuery: {
          from: [{ collectionId: FIREBASE.collection }],
          orderBy: [
            { field: { fieldPath: "score" }, direction: "DESCENDING" },
            { field: { fieldPath: "__name__" }, direction: "DESCENDING" },
          ],
          limit: SAMPIYON_SAYFA,
        },
      };
      if (imlec) query.structuredQuery.startAt = { values: imlec, before: false };
      const res = await fetch(`${FIRESTORE_BASE}:runQuery?key=${FIREBASE.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(query),
      });
      if (!res.ok) return sayfa === 0 ? null : unique.slice(0, limit);
      const belgeler = (await res.json()).filter((d) => d.document).map((d) => d.document);
      for (const b of belgeler) {
        const f = b.fields || {};
        const e = {
          name:   f.name ? f.name.stringValue : t("Avcı"),
          level:  tam(f, "level", 1),
          ghosts: tam(f, "ghosts", 0),
          para:   tam(f, "para", 0),
          score:  tam(f, "score", 0),
          date:   tam(f, "date", 0),
        };
        // Skor sıralı geldiği için bir ismin ilk görülen kaydı en yükseğidir
        if (!e.name || seen.has(e.name)) continue;
        seen.add(e.name);
        unique.push(e);
      }
      if (belgeler.length < SAMPIYON_SAYFA) break;
      const son = belgeler[belgeler.length - 1];
      imlec = [son.fields.score || { integerValue: "0" }, { referenceValue: son.name }];
    }
    return unique.slice(0, limit);
  } catch (e) {
    return unique.length ? unique.slice(0, limit) : null;
  }
}

// Silah anahtarları (WEAPONS'tan önce, loadSave sırasında da kullanılır)
const SILAH_ANAHTARLARI = ["bomba", "dondurma", "simsek", "kasirga", "ilkyrd", "roket", "gorunmez"];
function silahSeciminiTemizle(arr) {
  const out = [];
  if (Array.isArray(arr)) for (const k of arr) {
    if (SILAH_ANAHTARLARI.includes(k) && !out.includes(k) && out.length < 3) out.push(k);
  }
  return out;
}

const defaultSave = {
  playerName: "",
  para: 0,
  elmas: 0,
  zumrut: 0,
  kupa: 0,             // çevrimiçi turu birinci bitirince (3.13.0)
  selectedChar: "kinkin",
  selectedCostume: { kinkin: 0, veryi: 0, kornet: 0, mark: 0, kent: 0, ponko: 0, gul: 0, rani: 0, beti: 0, fanatik: 0, silsen: 0, sercin: 0 },
  unlockedChars: { kinkin: true, veryi: false, kornet: false, mark: false, kent: false, ponko: false, gul: false, rani: false, beti: false, fanatik: false, silsen: false, sercin: false },
  unlockedCostumes: { kinkin: [0], veryi: [0], kornet: [0], mark: [0], kent: [0], ponko: [0], gul: [0], rani: [0], beti: [0], fanatik: [0], silsen: [0], sercin: [0] },
  upgradesByChar: {
    kinkin:  { speed: 0, damage: 0, fireRate: 0, range: 0 },
    veryi:   { speed: 0, damage: 0, fireRate: 0, range: 0 },
    kornet:  { speed: 0, damage: 0, fireRate: 0, range: 0 },
    mark:    { speed: 0, damage: 0, fireRate: 0, range: 0 },
    kent:    { speed: 0, damage: 0, fireRate: 0, range: 0 },
    ponko:   { speed: 0, damage: 0, fireRate: 0, range: 0 },
    gul:     { speed: 0, damage: 0, fireRate: 0, range: 0 },
    rani:    { speed: 0, damage: 0, fireRate: 0, range: 0 },
    beti:    { speed: 0, damage: 0, fireRate: 0, range: 0 },
    fanatik: { speed: 0, damage: 0, fireRate: 0, range: 0 },
    silsen:  { speed: 0, damage: 0, fireRate: 0, range: 0 },
    sercin:  { speed: 0, damage: 0, fireRate: 0, range: 0 },
  },
  _charUpgradesIsolated: true,
  ammoByChar: {
    kinkin:  { bomba: 0, dondurma: 0, simsek: 0, kasirga: 0, ilkyrd: 0, roket: 0, gorunmez: 0 },
    veryi:   { bomba: 0, dondurma: 0, simsek: 0, kasirga: 0, ilkyrd: 0, roket: 0, gorunmez: 0 },
    kornet:  { bomba: 0, dondurma: 0, simsek: 0, kasirga: 0, ilkyrd: 0, roket: 0, gorunmez: 0 },
    mark:    { bomba: 0, dondurma: 0, simsek: 0, kasirga: 0, ilkyrd: 0, roket: 0, gorunmez: 0 },
    kent:    { bomba: 0, dondurma: 0, simsek: 0, kasirga: 0, ilkyrd: 0, roket: 0, gorunmez: 0 },
    ponko:   { bomba: 0, dondurma: 0, simsek: 0, kasirga: 0, ilkyrd: 0, roket: 0, gorunmez: 0 },
    gul:     { bomba: 0, dondurma: 0, simsek: 0, kasirga: 0, ilkyrd: 0, roket: 0, gorunmez: 0 },
    rani:    { bomba: 0, dondurma: 0, simsek: 0, kasirga: 0, ilkyrd: 0, roket: 0, gorunmez: 0 },
    beti:    { bomba: 0, dondurma: 0, simsek: 0, kasirga: 0, ilkyrd: 0, roket: 0, gorunmez: 0 },
    fanatik: { bomba: 0, dondurma: 0, simsek: 0, kasirga: 0, ilkyrd: 0, roket: 0, gorunmez: 0 },
    silsen:  { bomba: 0, dondurma: 0, simsek: 0, kasirga: 0, ilkyrd: 0, roket: 0, gorunmez: 0 },
    sercin:  { bomba: 0, dondurma: 0, simsek: 0, kasirga: 0, ilkyrd: 0, roket: 0, gorunmez: 0 },
  },
  // Envanter silahları (bütün karakterler ortak): sahip olunanlar ve takılı olan ("" = karakterin kendi silahı)
  ownedGuns: {},
  equippedGun: "",
  // Efsane özellikler: ikinci yardımcı bot ve +1 azami kalp
  extraBot: false,
  extraHeart: false,
  silahSecim: [], // silah çubuğunda gösterilecek en çok 3 tek kullanımlık silah
  // Petler (pet.js): sahip olunanlar ve yanına alınan ("" = petsiz)
  ownedPets: {},
  pet: "",
  highestLevel: 1,
  // Reklam sıklığı sayaçları (reklam.js › reklamOyunBitti)
  reklam: { oyun: 0, toplam: 0, sure: 0, son: [] },
  // Dünya Turu (dunya-turu.js): en ileri açık ülke, damgalar (ISO kodu → zaman), ilk tamamlanma zamanı
  dunyaTuru: { acik: 1, damgalar: {}, bitti: 0 },
  soundEnabled: true,
  ayar3d: true, // 3D avcılar açık (WebGL yoksa ya da başarım düşerse kapanır)
  ayar3dSifir: 0, // 3.20.0'da yavaşlık yüzünden kapanan 3D'nin bir kerelik yeniden açılması yapıldı mı
  volumes: { ghost: 1, fire: 1, sfx: 1, muzik: 0.6 }, // muzik: Dünya Turu müziği (muzik.js)
  accountCode: "",
};

let save = loadSave();

// 3.20.0 ısınma takılması 3D'yi birçok oyuncuda kalıcı kapatmıştı: bir kerelik yeniden aç.
try {
  if (save.ayar3d === false && !save.ayar3dSifir) save.ayar3d = true;
  save.ayar3dSifir = 1;
  persistSave();
} catch (_) { /* sessiz: depolama kapalıysa ayarlar yine de bellekte kalır */ }

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    const fresh = JSON.parse(JSON.stringify(defaultSave));
    if (!raw) return fresh;
    const data = JSON.parse(raw);
    const merged = Object.assign(fresh, data);
    // Sığ alt nesneler için derin birleştir
    ["selectedCostume", "unlockedChars", "unlockedCostumes", "volumes"].forEach((key) => {
      merged[key] = Object.assign(JSON.parse(JSON.stringify(defaultSave[key])), data[key] || {});
    });
    // upgradesByChar: her karakter bağımsız
    merged.upgradesByChar = JSON.parse(JSON.stringify(defaultSave.upgradesByChar));
    if (data.upgradesByChar) {
      Object.keys(data.upgradesByChar).forEach((ck) => {
        if (merged.upgradesByChar[ck]) {
          Object.assign(merged.upgradesByChar[ck], data.upgradesByChar[ck]);
        }
      });
    }
    // Eski tek-üst yapıdan ilk göç: sadece Kinkin'e ata.
    if (!data.upgradesByChar && data.upgrades) {
      Object.assign(merged.upgradesByChar.kinkin, data.upgrades);
    }
    // Bir kerelik izolasyon: önceki sürümde tüm karakterlere kopyalanmış olabilir → Kinkin hariç sıfırla.
    if (!data._charUpgradesIsolated) {
      Object.keys(merged.upgradesByChar).forEach((ck) => {
        if (ck !== "kinkin") {
          merged.upgradesByChar[ck] = { speed: 0, damage: 0, fireRate: 0, range: 0 };
        }
      });
      merged._charUpgradesIsolated = true;
    }
    delete merged.upgrades;
    merged.extraBot = !!data.extraBot;
    merged.extraHeart = !!data.extraHeart;
    merged.reklam = reklamKaydiniTemizle(data.reklam);
    merged.dunyaTuru = turKaydiniTemizle(data.dunyaTuru);
    // silahSecim: yalnız bilinen silahlar, en çok 3, tekrarsız
    merged.silahSecim = silahSeciminiTemizle(data.silahSecim);
    // ammoByChar göçü
    merged.ammoByChar = JSON.parse(JSON.stringify(defaultSave.ammoByChar));
    if (data.ammoByChar) {
      Object.keys(data.ammoByChar).forEach((ck) => {
        if (merged.ammoByChar[ck]) {
          Object.assign(merged.ammoByChar[ck], data.ammoByChar[ck]);
        }
      });
    }
    return merged;
  } catch (e) {
    return JSON.parse(JSON.stringify(defaultSave));
  }
}

function persistSave() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

function resetData() {
  if (confirm(t("Tüm ilerleme silinsin mi?"))) {
    save = JSON.parse(JSON.stringify(defaultSave));
    persistSave();
    refreshMenu();
    showToast(t("Sıfırlandı!"));
  }
}

// ====== KARAKTER TANIMLARI ======
const CHARACTERS = {
  kinkin: {
    name: "Kinkin",
    desc: t("Hızlı ve dengeli avcı."),
    cost: 0,
    baseSpeed: 3.2,
    baseDamage: 1,
    baseFireDelay: 600,
    baseRange: 165,
    color: { hair: "#7a3e1d", skin: "#f4d6b5", body: "#1d4ed8", legs: "#f4d6b5", weapon: "#e0e0e0" },
  },
  veryi: {
    name: "Veryi",
    desc: t("Güçlü vurucu."),
    cost: 5,
    baseSpeed: 2.6,
    baseDamage: 2,
    baseFireDelay: 700,
    baseRange: 135,
    color: { hair: "#3a1d0a", skin: "#f4d6b5", body: "#6b3410", legs: "#4a8c2a", weapon: "#7a7a7a" },
  },
  kornet: {
    name: "Kornet",
    desc: t("Uzun menzilli sihirbaz."),
    cost: 10,
    baseSpeed: 2.8,
    baseDamage: 1,
    baseFireDelay: 500,
    baseRange: 210,
    color: { hair: "#ffffff", skin: "#fafafa", body: "#9d4edd", legs: "#9d4edd", weapon: "#c026d3" },
  },
  mark: {
    name: "Marli",
    desc: t("Sırt çantalı maceracı."),
    cost: 25,
    baseSpeed: 3.0,
    baseDamage: 1,
    baseFireDelay: 580,
    baseRange: 175,
    color: { hair: "#5a3825", skin: "#f4d6b5", body: "#10b981", legs: "#374151", weapon: "#e0e0e0" },
  },
  kent: {
    name: "Kenit",
    desc: t("Karanlık hayalet pelerin, bıçaklı."),
    cost: 50,
    baseSpeed: 3.4,
    baseDamage: 2,
    baseFireDelay: 480,
    baseRange: 150,
    color: { hair: "#1f1f1f", skin: "#e8e8f0", body: "#1a1a2e", legs: "#0f0f1a", weapon: "#9ca3af" },
  },
  ponko: {
    name: "Ponko",
    desc: t("Büyük şapkalı küçük kahraman."),
    cost: 30,
    baseSpeed: 3.0,
    baseDamage: 1,
    baseFireDelay: 450,
    baseRange: 165,
    color: { hair: "#3a1d0a", skin: "#f4d6b5", body: "#ef4444", legs: "#1f2937", weapon: "#e0e0e0" },
  },
  gul: {
    name: "Güllu",
    desc: t("Şapkalı dengeli avcı."),
    cost: 15,
    baseSpeed: 3.2,
    baseDamage: 1,
    baseFireDelay: 580,
    baseRange: 180,
    color: { hair: "#3a1d0a", skin: "#f4d6b5", body: "#ec4899", legs: "#831843", weapon: "#e0e0e0" },
  },
  rani: {
    name: "Rani",
    desc: t("Sevimli minik avcı."),
    cost: 35,
    baseSpeed: 3.3,
    baseDamage: 1,
    baseFireDelay: 520,
    baseRange: 165,
    color: { hair: "#1f1f1f", skin: "#fce7d8", body: "#06b6d4", legs: "#0e7490", weapon: "#fde68a" },
  },
  beti: {
    name: "Beri",
    desc: t("Lolipop canavarı! Suyun içinden geçer."),
    cost: 20,
    baseSpeed: 3.0,
    baseDamage: 2,
    baseFireDelay: 550,
    baseRange: 190,
    color: { hair: "#9d4edd", skin: "#fef3c7", body: "#f43f5e", legs: "#7c3aed", weapon: "#ec4899" },
    waterImmune: true,
  },
  fanatik: {
    name: "Fanatik",
    desc: t("Yakışıklı efsanevi kunfucu, siyah kuşak."),
    cost: 200,
    baseSpeed: 3.6,
    baseDamage: 3,
    baseFireDelay: 350,
    baseRange: 210,
    color: { hair: "#0a0a0a", skin: "#f4d6b5", body: "#fafafa", legs: "#fafafa", weapon: "#dc2626" },
  },
  silsen: {
    name: "Silsen",
    desc: t("Çiçek bayraklı avcı, vurunca çiçek top atar."),
    cost: 25,
    baseSpeed: 3.1,
    baseDamage: 1,
    baseFireDelay: 520,
    baseRange: 180,
    color: { hair: "#4a2511", skin: "#f4d6b5", body: "#4ade80", legs: "#f4d6b5", weapon: "#fbbf24" },
  },
  sercin: {
    name: "Serçin",
    desc: t("Serçe gibi çevik, tüy fırlatır."),
    cost: 30,
    baseSpeed: 3.5,
    baseDamage: 1,
    baseFireDelay: 500,
    baseRange: 175,
    color: { hair: "#1f1f1f", skin: "#f4d6b5", body: "#a16207", legs: "#78350f", weapon: "#fef3c7" },
  },
};

// Kostümler: her karakter için (0 = orijinal, 1 = alternatif)
const EFSANE_KOSTUM = { name: t("💎 Efsane"), cost: 300, body: "#7c3aed", hair: "#fbbf24", efsane: true };
const COSTUMES = {
  kinkin: [
    { name: t("Mavi"), cost: 0, body: "#1d4ed8", hair: "#7a3e1d" },
    { name: t("Pembe Prenses"), cost: 5, body: "#ec4899", hair: "#fbbf24" },
    { name: t("✨ Altın Efsane"), cost: 80, body: "#f59e0b", hair: "#fef3c7" },
    EFSANE_KOSTUM,
  ],
  veryi: [
    { name: t("Klasik"), cost: 0, body: "#6b3410", hair: "#3a1d0a" },
    { name: t("Asker"), cost: 5, body: "#1f5e1a", hair: "#1f1f1f" },
    { name: t("✨ Bronz Şampiyon"), cost: 80, body: "#92400e", hair: "#fbbf24" },
    EFSANE_KOSTUM,
  ],
  kornet: [
    { name: t("Mor"), cost: 0, body: "#9d4edd", hair: "#ffffff" },
    { name: t("Şeker"), cost: 5, body: "#06d6a0", hair: "#fff7d6" },
    { name: t("✨ Galaksi Sihirbazı"), cost: 100, body: "#0ea5e9", hair: "#a78bfa" },
    EFSANE_KOSTUM,
  ],
  mark: [
    { name: t("Yeşil"), cost: 0, body: "#10b981", hair: "#5a3825" },
    { name: t("Mavi"), cost: 5, body: "#3b82f6", hair: "#1f2937" },
    { name: t("✨ Altın Maceracı"), cost: 80, body: "#fbbf24", hair: "#7c2d12" },
    EFSANE_KOSTUM,
  ],
  kent: [
    { name: t("Karanlık"), cost: 0, body: "#1a1a2e", hair: "#1f1f1f" },
    { name: t("Kanlı"), cost: 6, body: "#7f1d1d", hair: "#1f1f1f" },
    { name: t("✨ Hayalet Lordu"), cost: 120, body: "#3b0764", hair: "#0f172a" },
    EFSANE_KOSTUM,
  ],
  ponko: [
    { name: t("Kırmızı"), cost: 0, body: "#ef4444", hair: "#3a1d0a" },
    { name: t("Sarı"), cost: 5, body: "#f59e0b", hair: "#3a1d0a" },
    { name: t("✨ Altın Şapka"), cost: 80, body: "#fbbf24", hair: "#451a03" },
    EFSANE_KOSTUM,
  ],
  gul: [
    { name: t("Pembe"), cost: 0, body: "#ec4899", hair: "#3a1d0a" },
    { name: t("Mor"), cost: 5, body: "#8b5cf6", hair: "#3a1d0a" },
    { name: t("✨ Kraliçe"), cost: 100, body: "#f0abfc", hair: "#fbbf24" },
    EFSANE_KOSTUM,
  ],
  rani: [
    { name: t("Turkuaz"), cost: 0, body: "#06b6d4", hair: "#1f1f1f" },
    { name: t("Limon"), cost: 5, body: "#84cc16", hair: "#1f1f1f" },
    { name: t("✨ Pırıltı"), cost: 80, body: "#fde047", hair: "#7c3aed" },
    EFSANE_KOSTUM,
  ],
  beti: [
    { name: t("Şeker"), cost: 0, body: "#f43f5e", hair: "#9d4edd" },
    { name: t("Çikolata"), cost: 6, body: "#78350f", hair: "#fbbf24" },
    { name: t("✨ Gökkuşağı Lolipop"), cost: 100, body: "#22d3ee", hair: "#f472b6" },
    EFSANE_KOSTUM,
  ],
  fanatik: [
    { name: t("Beyaz Gi"), cost: 0, body: "#fafafa", hair: "#0a0a0a" },
    { name: t("Kırmızı Gi"), cost: 8, body: "#dc2626", hair: "#0a0a0a" },
    { name: t("✨ Ejder Ustası"), cost: 150, body: "#1e293b", hair: "#fbbf24" },
    EFSANE_KOSTUM,
  ],
  silsen: [
    { name: t("Bahar"), cost: 0, body: "#4ade80", hair: "#4a2511" },
    { name: t("Lale"), cost: 5, body: "#f43f5e", hair: "#1f1f1f" },
    { name: t("✨ Altın Lale"), cost: 80, body: "#fbbf24", hair: "#4a2511" },
    EFSANE_KOSTUM,
  ],
  sercin: [
    { name: t("Serçe"), cost: 0, body: "#a16207", hair: "#1f1f1f" },
    // Kulaklı ve kanatlı kostüm (çizim: Serçin'in kostümü)
    { name: t("Kanatlı Kedi"), cost: 8, body: "#fb923c", hair: "#7c2d12", ears: true, wings: true },
    { name: t("✨ Altın Kanat"), cost: 80, body: "#fbbf24", hair: "#7c2d12", ears: true, wings: true },
    EFSANE_KOSTUM,
  ],
};

// Bölüm temaları (sırayla döner)
const LEVEL_THEMES = [
  { name: t("Mor Şato"),     floor: "#1f1538", grid: "rgba(157, 78, 221, 0.10)", wall: "#5a3825", wallDark: "#3d2618", waterTop: "#1e7fd6", waterBot: "#0a3a8a" },
  { name: t("Yeşil Orman"),  floor: "#0f3d24", grid: "rgba(132, 204, 22, 0.12)", wall: "#365314", wallDark: "#1a2e0d", waterTop: "#22c55e", waterBot: "#15803d" },
  { name: t("Çöl"),          floor: "#3f2e0a", grid: "rgba(251, 191, 36, 0.12)", wall: "#92400e", wallDark: "#451a03", waterTop: "#06b6d4", waterBot: "#0c4a6e" },
  { name: t("Buz Mağarası"), floor: "#0c4a6e", grid: "rgba(186, 230, 253, 0.18)", wall: "#7dd3fc", wallDark: "#0369a1", waterTop: "#bae6fd", waterBot: "#0ea5e9" },
  { name: t("Volkan"),       floor: "#451a03", grid: "rgba(239, 68, 68, 0.12)",  wall: "#7f1d1d", wallDark: "#450a0a", waterTop: "#f97316", waterBot: "#dc2626" },
  { name: t("Uzay"),         floor: "#0c0a1e", grid: "rgba(192, 132, 252, 0.18)", wall: "#1e1b4b", wallDark: "#0f0a2e", waterTop: "#a855f7", waterBot: "#3b0764" },
];
function getTheme() {
  const u = turUlkesi(); // Dünya Turu'nda ülkenin teması (ulkeler.js ulkeTemasi)
  if (u) return ulkeTemasi(u);
  return LEVEL_THEMES[(game.level - 1) % LEVEL_THEMES.length];
}

// Boss bekleme süresi: 1-10 → 10sn, 11-20 → 15sn, 21-30 → 20sn ... her 10 bölümde +5sn
function getBossTimerForLevel(level) {
  return 10 + Math.floor((level - 1) / 10) * 5;
}

// Karakter başına özel güçler — süreler güç dengesine göre değişir
const CHAR_POWERS = {
  kinkin:  { name: t("Yıldırım Hızı"),     icon: "⚡", duration: 15000 }, // hız x2
  veryi:   { name: t("Süper Hasar"),       icon: "💥", duration: 12000 }, // hasar x3
  kornet:  { name: t("Üçlü Atış"),         icon: "🔱", duration: 15000 }, // 3 mermi koni
  mark:    { name: t("Dev Mıknatıs"),      icon: "🧲", duration: 20000 }, // tüm pickup çek (QoL)
  kent:    { name: t("Hayalet Modu"),      icon: "🌙", duration: 8000  }, // yenilmezlik (kısa, OP)
  ponko:   { name: t("Çabuk Ateş"),        icon: "🔥", duration: 12000 }, // fireDelay /3
  gul:     { name: t("Patlama Vuruşu"),    icon: "💣", duration: 15000 }, // öldürünce çevreye hasar
  rani:    { name: t("Şifa Kalbi"),        icon: "💖", duration: 18000 }, // 5 sn'de bir +1 can
  beti:    { name: t("Lolipop Yağmuru"),   icon: "🍭", duration: 15000 }, // 5 yöne mermi
  fanatik: { name: t("Tornado Tekme"),     icon: "🥋", duration: 12000 }, // 0.5 sn'de bir çevreye hasar
  silsen:  { name: t("Çiçek Halkası"),     icon: "🌸", duration: 12000 }, // 8 yöne çiçek
  sercin:  { name: t("Güdümlü Tüyler"),    icon: "🐦", duration: 15000 }, // tüyler hayaleti kovalar
};

function activatePower(charKey) {
  const def = CHAR_POWERS[charKey] || CHAR_POWERS.kinkin;
  const dur = def.duration || 15000;
  game.player.power = {
    type: charKey,
    expires: performance.now() + dur,
    duration: dur,
    name: def.name,
    icon: def.icon,
  };
  game.healTimer = 0;
  game.pulseTimer = 0;
  // BUF1: ad artık simgenin yanındaki 2 sn'lik hapta gösterilir (updateHUD → bufGuncelle); ayrıca bildirim yok
  if (typeof aeGucPatlama === "function" && game.player) aeGucPatlama(charKey, game.player); // renkli patlama
  if (typeof audio.guc === "function") audio.guc(); else audio.unlock();
}

function getActivePower() {
  if (!game.player || !game.player.power) return null;
  if (performance.now() > game.player.power.expires) {
    game.player.power = null;
    return null;
  }
  return game.player.power;
}

// Tek kullanımlık silahlar — karakter başına ayrı stok
const WEAPONS = {
  bomba:    { name: t("Bomba"),       icon: "💣", cost: 80,  desc: t("200 px alandaki tüm hayaletlere 10 hasar."), max: 9 },
  dondurma: { name: t("Dondurma"),    icon: "❄️", cost: 100, desc: t("Tüm hayaletleri 5 sn dondurur."),          max: 9 },
  simsek:   { name: t("Şimşek"),      icon: "⚡", cost: 60,  desc: t("Ekrandaki tüm hayaletlere 3 hasar."),       max: 9 },
  kasirga:  { name: t("Kasırga"),     icon: "🌪️", cost: 120, desc: t("8 sn kasırga: yakındaki hayaletleri içine çeker, döndürür, savurur."), max: 9 },
  ilkyrd:   { name: t("İlk Yardım"),  icon: "❤️", cost: 50,  desc: t("Anında 2 can yeniler (max'ı geçemez)."),   max: 9 },
  roket:    { name: t("Roket"),       icon: "🚀", cost: 90,  desc: t("En yakın hayalete 25 hasar."),              max: 9 },
  gorunmez: { name: t("Görünmezlik"), icon: "🕵", cost: 70,  desc: t("5 sn hayaletler seni göremez."),            max: 9 },
};

function ensureAmmoStock(charKey) {
  if (!save.ammoByChar) save.ammoByChar = {};
  if (!save.ammoByChar[charKey]) save.ammoByChar[charKey] = {};
  Object.keys(WEAPONS).forEach((k) => {
    if (typeof save.ammoByChar[charKey][k] !== "number") save.ammoByChar[charKey][k] = 0;
  });
  return save.ammoByChar[charKey];
}

// Envanter silahları — kalıcı, bütün karakterler ortak. Takılan silah karakterin kendi mermisinin yerine geçer;
// karakterin kendi silahı envanterde "Normal silah" olarak kalır (çizimler: 5 silah + envanter).
const GUNS = {
  baloncuk: { name: t("Baloncuk Tabancası"), cost: 200,  desc: t("Hızlı atar: mavi baloncuklar."),             delayMul: 0.65, dmgMul: 1, speed: 460 },
  lazer:    { name: t("Kırmızı Lazer"),      cost: 350,  desc: t("Çok hızlı ışın, iki hayaleti birden deler."), delayMul: 1,    dmgMul: 1, speed: 820, pierce: 1 },
  yesil:    { name: t("Yeşil Çiftli"),       cost: 500,  desc: t("Her atışta yan yana iki mermi."),             delayMul: 1,    dmgMul: 1, speed: 500, twin: true },
  pompali:  { name: t("Saçmalı Top"),        cost: 800,  desc: t("Bir atışta üç saçma, kısa menzil."),          delayMul: 1.15, dmgMul: 1, speed: 520, spread: [-0.22, 0, 0.22], life: 0.4 },
  bazuka:   { name: t("Dev Bazuka"),         cost: 1200, desc: t("Yavaş ama üç kat hasar."),                    delayMul: 1.3,  dmgMul: 3, speed: 400 },
  // Efsane silahlar: pahalı, görünür biçimde özel ama yalnızca hafif güçlü
  yildiz:    { name: t("⭐ Yıldız Tüfeği"),  cost: 25000, desc: t("Her 5. atış büyük bir yıldız fırlatır; küçük alanda iki kat hasar."), delayMul: 0.65, dmgMul: 1, speed: 460, efsane: true, emoji: "⭐" },
  ejder:     { name: t("🐉 Ejder Nefesi"),   cost: 60000, desc: t("Kısa menzilli alev konisi; hayaletleri 1,5 sn yakar."),           delayMul: 1,    dmgMul: 1.2, speed: 330, spread: [-0.2, 0, 0.2], life: 0.32, efsane: true, emoji: "🐉" },
  gokkusagi: { name: t("🌈 Gökkuşağı Işını"), cost: 150000, desc: t("Üç hayaleti delen gökkuşağı ışını."),                  delayMul: 0.9,  dmgMul: 1, speed: 720, pierce: 3, efsane: true, emoji: "🌈" },
};

// Takılı ve sahip olunan silahın anahtarı; yoksa "" (karakterin kendi silahı)
function equippedGun() {
  const k = save.equippedGun;
  return (k && GUNS[k] && save.ownedGuns && save.ownedGuns[k]) ? k : "";
}

function equipGun(key) {
  save.equippedGun = (key && GUNS[key] && save.ownedGuns[key]) ? key : "";
  persistSave();
  if (game.player) game.player.gun = save.equippedGun;
}

const _gunIconCache = {};
function gunIconUrl(key) {
  // ChatGPT silah resmi yüklüyse onun adresi (paketli denemede data URL); yoksa koddan çizilen simge
  const im = typeof gorsel === "function" ? gorsel(`silah-${key}`) : null;
  if (im) return im.src;
  if (_gunIconCache[key]) return _gunIconCache[key];
  const cv = document.createElement("canvas");
  cv.width = 96; cv.height = 72;
  const ctx = cv.getContext("2d");
  ctx.translate(36, 40);
  drawGunShape(ctx, key, 2.2);
  return (_gunIconCache[key] = cv.toDataURL());
}

function charIconUrl(charKey) {
  const cv = document.createElement("canvas");
  cv.width = 80; cv.height = 90;
  drawCharacter(cv.getContext("2d"), charKey, save.selectedCostume[charKey] || 0, 40, 60, 80);
  return cv.toDataURL();
}

// Oyun ekranındaki 🎒 düğmesi: takılı silahı gösterir; dokununca envanter açılır
function refreshInventoryButton() {
  const btn = document.getElementById("inv-btn");
  if (!btn || !game.player) return;
  const gun = game.player.gun;
  btn.style.backgroundImage = `url(${gun ? gunIconUrl(gun) : charIconUrl(game.player.charKey)})`;
}

function closeInventory() {
  const panel = document.getElementById("inv-panel");
  if (panel) panel.classList.remove("open");
  const bar = document.getElementById("weapon-bar");
  if (bar) bar.classList.remove("inv-acik");
}

function toggleInventory() {
  const panel = document.getElementById("inv-panel");
  if (!panel || !game.player) return;
  if (panel.classList.contains("open")) { closeInventory(); return; }
  panel.innerHTML = "";
  const slot = (key, ad, resim) => {
    const b = document.createElement("button");
    b.className = "inv-slot" + ((game.player.gun || "") === key ? " on" : "");
    b.innerHTML = `<span class="inv-img" style="background-image:url(${resim})"></span><span class="inv-name">${escapeHtml(ad)}</span>`;
    b.onclick = (e) => {
      e.stopPropagation();
      equipGun(key);
      closeInventory();
      refreshInventoryButton();
      showToast(`🎒 ${ad}`);
    };
    panel.appendChild(b);
  };
  slot("", t("Normal silah"), charIconUrl(game.player.charKey));
  const sahip = Object.keys(GUNS).filter((k) => save.ownedGuns[k]);
  sahip.forEach((k) => slot(k, GUNS[k].name, gunIconUrl(k)));
  if (sahip.length === 0) {
    const ipucu = document.createElement("div");
    ipucu.className = "inv-empty";
    ipucu.textContent = t("Mağaza › 🔫 Silahlar bölümünden silah alabilirsin.");
    panel.appendChild(ipucu);
  }
  panel.classList.add("open");
  const bar = document.getElementById("weapon-bar");
  if (bar) bar.classList.add("inv-acik");
}

// Silah çubuğu yerleşimi (KNT1): ana eylem düğmesi (#inv-btn) sağ altta; güç/eşya düğmeleri onun
// çevresinde yay (arc) biçiminde dizilir (sol-yukarı doğru, "⋯" yayın sonunda). Çubuk, ana düğmenin
// merkezinde sıfır boyutlu bir çapadır; düğmeler ona göre mutlak konumlanır. Arapçada x ekseni aynalanır.
const KNT_YAY_ACILAR = [180, 216, 252, 288]; // derece; saat yönünde, 0° sağ, 270° yukarı (ekran koordinatı)
function layoutWeaponBar() {
  const bar = document.getElementById("weapon-bar");
  const inv = document.getElementById("inv-btn");
  if (!bar || !inv) return;
  const invR = inv.getBoundingClientRect();
  if (invR.width === 0) return;
  const rtl = getComputedStyle(document.documentElement).direction === "rtl";
  const cx = invR.left + invR.width / 2, cy = invR.top + invR.height / 2;
  bar.style.left = Math.round(cx) + "px";
  bar.style.top = Math.round(cy) + "px";
  bar.style.right = "auto";
  bar.style.bottom = "auto";
  const cocuklar = [...bar.children];
  const boy = parseFloat(getComputedStyle(bar).getPropertyValue("--kn-slot")) || 56;
  const yaricap = Math.max(boy * 1.8, invR.width / 2 + boy / 2 + 10);
  cocuklar.forEach((c, i) => {
    const aci = (KNT_YAY_ACILAR[Math.min(i, KNT_YAY_ACILAR.length - 1)] * Math.PI) / 180;
    const dx = Math.cos(aci) * yaricap * (rtl ? -1 : 1), dy = Math.sin(aci) * yaricap;
    c.style.left = Math.round(dx - boy / 2) + "px";
    c.style.top = Math.round(dy - boy / 2) + "px";
  });
}

const SILAH_SECIM_MAX = 3;
let _silahSecDurakladi = false;

function silahSecimi() {
  save.silahSecim = silahSeciminiTemizle(save.silahSecim);
  return save.silahSecim;
}

// Görünen silahlar: önce seçilenler (stoğu olanlar), sonra boş slotlara WEAPONS sırasıyla diğerleri
function gorunurSilahlar(stock) {
  const sec = silahSecimi().filter((k) => (stock[k] || 0) > 0);
  const out = sec.slice(0, SILAH_SECIM_MAX);
  for (const k of SILAH_ANAHTARLARI) {
    if (out.length >= SILAH_SECIM_MAX) break;
    if ((stock[k] || 0) > 0 && !out.includes(k)) out.push(k);
  }
  return out;
}

function silahSecPanelAcikMi() {
  const p = document.getElementById("silah-sec-panel");
  return !!(p && p.classList.contains("open"));
}

function silahSecPanelKonumla() {
  const p = document.getElementById("silah-sec-panel");
  const inv = document.getElementById("inv-btn");
  if (!p || !inv) return;
  const h = window.innerHeight, w = window.innerWidth;
  const rtl = getComputedStyle(document.documentElement).direction === "rtl";
  const ir = inv.getBoundingClientRect();
  const bar = document.getElementById("weapon-bar");
  const boy = (bar && parseFloat(getComputedStyle(bar).getPropertyValue("--kn-slot"))) || 56;
  const yaricap = Math.max(boy * 1.8, ir.width / 2 + boy / 2 + 10);
  // Panel yayın üstünde açılır; ana düğmeyle aynı kenara yaslanır.
  const yayUst = ir.top + ir.height / 2 - yaricap - boy / 2;
  p.style.maxWidth = Math.max(0, w - 16) + "px";
  p.style.maxHeight = Math.max(44, yayUst - 16) + "px";
  p.style.top = "auto";
  p.style.bottom = Math.max(8, Math.round(h - yayUst + 8)) + "px";
  const pw = p.getBoundingClientRect().width;
  let left = rtl ? ir.left : ir.right - pw;
  left = Math.max(8, Math.min(left, w - pw - 8));
  p.style.left = Math.round(left) + "px";
  p.style.right = "auto";
}

function silahSecPanelCiz() {
  const p = document.getElementById("silah-sec-panel");
  if (!p || !game || !game.player) return;
  const stock = ensureAmmoStock(game.player.charKey);
  const sec = silahSecimi();
  p.innerHTML = "";
  const bas = document.createElement("div");
  bas.className = "silah-sec-bas";
  bas.textContent = t("En çok 3");
  p.appendChild(bas);
  const izgara = document.createElement("div");
  izgara.className = "silah-sec-izgara";
  p.appendChild(izgara);
  SILAH_ANAHTARLARI.forEach((key) => {
    const count = stock[key] || 0;
    if (count <= 0) return;
    const w = WEAPONS[key];
    const secili = sec.includes(key);
    const b = document.createElement("button");
    b.className = "weapon-slot silah-sec-slot" + (secili ? " secili" : "");
    b.dataset.weapon = key;
    b.title = `${w.name}: ${w.desc}`;
    b.setAttribute("aria-pressed", secili ? "true" : "false");
    b.innerHTML = `<span>${typeof esyaSimgesiHTML === "function" ? esyaSimgesiHTML(key, w.icon, w.name) : w.icon}</span><span class="badge">${count}</span>` + (secili ? `<span class="sec-tik">✓</span>` : "");
    b.onclick = (e) => {
      e.preventDefault(); e.stopPropagation();
      if (typeof aeDugmeZip === "function") aeDugmeZip(b);
      silahSecToggle(key);
    };
    izgara.appendChild(b);
  });
  const kapat = document.createElement("button");
  kapat.className = "silah-sec-kapat";
  kapat.textContent = "✓";
  kapat.setAttribute("aria-label", "✓");
  kapat.onclick = (e) => { e.preventDefault(); e.stopPropagation(); silahSecPanelKapat(); };
  p.appendChild(kapat);
}

function silahSecToggle(key) {
  if (!game || !game.player) return;
  const stock = ensureAmmoStock(game.player.charKey);
  if ((stock[key] || 0) <= 0) return;
  const sec = silahSecimi();
  const i = sec.indexOf(key);
  if (i >= 0) sec.splice(i, 1);
  else if (sec.length >= SILAH_SECIM_MAX) { sec.shift(); sec.push(key); }
  else sec.push(key);
  save.silahSecim = silahSeciminiTemizle(sec);
  persistSave();
  refreshWeaponBar();
}

function silahSecPanelAc() {
  const p = document.getElementById("silah-sec-panel");
  if (!p || !game || !game.player || !game.running || game.player.dead) return;
  p.classList.add("open");
  p.setAttribute("aria-label", t("Silah seç"));
  silahSecPanelCiz();
  silahSecPanelKonumla();
  if (!online.mode && typeof hikayeDuraklat === "function") _silahSecDurakladi = hikayeDuraklat();
  else _silahSecDurakladi = false;
}

function silahSecPanelKapat() {
  const p = document.getElementById("silah-sec-panel");
  if (p) p.classList.remove("open");
  if (_silahSecDurakladi) {
    if (typeof hikayeDevam === "function") hikayeDevam(true);
    _silahSecDurakladi = false;
  }
}

function refreshWeaponBar() {
  const bar = document.getElementById("weapon-bar");
  if (!bar) return;
  if (!game || !game.player || !game.running) { bar.innerHTML = ""; silahSecPanelKapat(); return; }
  const stock = ensureAmmoStock(game.player.charKey);
  const oldu = !!game.player.dead;
  if (oldu) silahSecPanelKapat();
  bar.innerHTML = "";
  const gorunur = gorunurSilahlar(stock);
  gorunur.forEach((key) => {
    const count = stock[key] || 0;
    const w = WEAPONS[key];
    const btn = document.createElement("button");
    const pasif = oldu;
    btn.className = "weapon-slot" + (pasif ? " ae-pasif" : "");
    btn.dataset.weapon = key;
    btn.setAttribute("aria-disabled", pasif ? "true" : "false");
    btn.title = `${w.name}: ${w.desc}`;
    btn.innerHTML = `<span>${typeof esyaSimgesiHTML === "function" ? esyaSimgesiHTML(key, w.icon, w.name) : w.icon}</span><span class="badge">${count}</span>`;
    if (typeof aeRozetPop === "function") aeRozetPop(key, btn.querySelector(".badge"), count); // stok değişince rozet zıplar
    const trigger = (e) => {
      e.preventDefault(); e.stopPropagation();
      if (typeof aeDugmeZip === "function") aeDugmeZip(btn); // dokunma zıplaması
      useWeapon(key);
    };
    btn.addEventListener("touchstart", trigger, { passive: false });
    btn.addEventListener("click", trigger);
    bar.appendChild(btn);
  });
  const stoklu = SILAH_ANAHTARLARI.filter((k) => (stock[k] || 0) > 0);
  if (!oldu && stoklu.length >= 2) { // silah seç düğmesi (en çok 3 gösterilir)
    const gizli = stoklu.length - gorunur.length;
    const b = document.createElement("button");
    b.className = "weapon-more";
    b.dataset.rol = "silah-sec";
    b.title = t("Silah seç");
    b.setAttribute("aria-label", t("Silah seç"));
    b.innerHTML = `<span>⋯</span>` + (gizli > 0 ? `<span class="badge">+${gizli}</span>` : "");
    b.onclick = (e) => {
      e.preventDefault(); e.stopPropagation();
      if (silahSecPanelAcikMi()) silahSecPanelKapat();
      else silahSecPanelAc();
    };
    bar.appendChild(b);
  }
  if (silahSecPanelAcikMi()) { silahSecPanelCiz(); silahSecPanelKonumla(); }
  layoutWeaponBar();
}

document.addEventListener("pointerdown", (e) => {
  if (!silahSecPanelAcikMi()) return;
  const p = document.getElementById("silah-sec-panel");
  const daha = document.querySelector("#weapon-bar .weapon-more");
  if (p.contains(e.target) || (daha && daha.contains(e.target))) return;
  silahSecPanelKapat();
}, true);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && silahSecPanelAcikMi()) { e.stopPropagation(); silahSecPanelKapat(); }
});

function useWeapon(key) {
  if (!game || !game.player || !game.running || game.paused) return;
  if (game.player.dead) return; // hayalet (seyirci) silah kullanamaz
  const w = WEAPONS[key];
  if (!w) return;
  const stock = ensureAmmoStock(game.player.charKey);
  if ((stock[key] || 0) <= 0) return;

  let consumed = true;
  const now = performance.now();
  const px = game.player.x, py = game.player.y;

  switch (key) {
    case "bomba": {
      const r = 200, r2 = r * r;
      let hit = 0;
      if (online.mode === "client") {
        // Hasarı host'a bildir
        online.pendingEvents.push({ type: "areaDmg", x: px, y: py, r, dmg: 10, by: online.uid });
        // Lokal görsel için hayaletlerin sayısını saymak yeter
        for (const g of game.ghosts) {
          const dx = g.x - px, dy = g.y - py;
          if (dx * dx + dy * dy < r2) { hit++; spawnHitParticles(g.x, g.y); online.vurduklarim.set(g._idx, performance.now()); }
        }
      } else {
        for (const g of game.ghosts) {
          const dx = g.x - px, dy = g.y - py;
          const d2 = dx * dx + dy * dy;
          if (d2 < r2) {
            g.hp -= 10;
            hit++;
            spawnHitParticles(g.x, g.y);
            const d = Math.sqrt(d2) || 1;
            const force = 320 * (1 - d / r);
            g.detourVx = (dx / d) * force;
            g.detourVy = (dy / d) * force;
            g.detourTime = 0.4;
          }
        }
      }
      // Patlama halkası (büyüyen)
      game.effects.push({ type: "boom", x: px, y: py, r: 0, rMax: r, life: 0.55, maxLife: 0.55 });
      if (typeof animEfektEkle === "function") animEfektEkle("kare", px, py, { ad: "patlama", sure: 0.6, boyut: 2 * r }); // N08
      if (typeof aeBombaVurus === "function") aeBombaVurus(px, py); // beyaz parlama + kısa sarsıntı
      for (let i = 0; i < 24; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 120 + Math.random() * 160;
        game.particles.push({ x: px, y: py, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.6, color: "#fb923c" });
      }
      showFloat(`💣 ${hit}`, px, py - 36);
      if (typeof audio.bomba === "function") audio.bomba(); else audio.bossDie();
      navigator.vibrate?.(80);
      break;
    }
    case "dondurma": {
      if (online.mode === "client") {
        online.pendingEvents.push({ type: "freezeAll", duration: 5000, by: online.uid });
      } else {
        const until = now + 5000;
        for (const g of game.ghosts) g.frozenUntil = until;
      }
      for (let i = 0; i < 18; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 60 + Math.random() * 100;
        game.particles.push({ x: px, y: py, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.8, color: "#bae6fd" });
      }
      showFloat(t("❄️ Donduruldu!"), px, py - 36);
      if (typeof animEfektEkle === "function") animEfektEkle("kare", px, py, { ad: "buz", sure: 0.6, boyut: 220 }); // N09
      // Her donan hayalete buz kaplaması: önce "donma", sonra blok, son 0,4 sn "cozulme" (anim-ek.js)
      if (typeof aeDonmaBasladi === "function") for (const g of game.ghosts) if ((g.frozenUntil || 0) > now) aeDonmaBasladi(g, g.frozenUntil);
      if (typeof audio.buz === "function") audio.buz(); else audio.unlock();
      break;
    }
    case "simsek": {
      const camX = game.camera.x, camY = game.camera.y;
      let hit = 0;
      const visible = (g) => g.x > camX - 40 && g.x < camX + game.W + 40 && g.y > camY - 40 && g.y < camY + game.H + 40;
      if (online.mode === "client") {
        // Ekrandaki her hayalete ayrı hit event (host gerçekten hp düşürür)
        for (let i = 0; i < game.ghosts.length; i++) {
          const g = game.ghosts[i];
          if (!visible(g)) continue;
          uzaktanVur(g, 3);
          spawnHitParticles(g.x, g.y);
          game.effects.push({ type: "spark", x: g.x, y: g.y, ghost: g, life: 0.5, maxLife: 0.5 });
          if (typeof aeSimsekVur === "function") aeSimsekVur(g, hit); // gökten inen yıldırım (40 ms arayla)
          hit++;
        }
      } else {
        for (const g of game.ghosts) {
          if (!visible(g)) continue;
          g.hp -= 3;
          spawnHitParticles(g.x, g.y);
          game.effects.push({ type: "spark", x: g.x, y: g.y, ghost: g, life: 0.5, maxLife: 0.5 });
          if (typeof aeSimsekVur === "function") aeSimsekVur(g, hit); // gökten inen yıldırım (40 ms arayla)
          hit++;
        }
      }
      showFloat(`⚡ ${hit}`, px, py - 36);
      if (typeof audio.simsek === "function") audio.simsek(); else audio.gem();
      navigator.vibrate?.(30);
      break;
    }
    case "kasirga": {
      game.player.kasirgaUntil = now + 8000;
      showFloat(t("🌪️ Kasırga!"), px, py - 36);
      if (typeof audio.kasirga === "function") audio.kasirga(); else audio.unlock();
      break;
    }
    case "ilkyrd": {
      const before = game.player.hp;
      game.player.hp = Math.min(game.player.maxHp, game.player.hp + 2);
      const heal = game.player.hp - before;
      if (heal <= 0) {
        showFloat(t("Can dolu"), px, py - 36);
        consumed = false; // can doluysa silahı yakma
      } else {
        showFloat(`+${heal} ❤️`, px, py - 36);
        if (typeof aeSifaEkle === "function") aeSifaEkle(px, py); // yeşil-pembe halka, kalpler, artılar
        if (typeof audio.sifa === "function") audio.sifa(); else audio.heart();
      }
      break;
    }
    case "roket": {
      const hedef = nearestGhost(99999); // "t" adı çeviri işlevini gölgeliyordu: hedef yokken "Hedef yok" yazılamıyordu
      if (hedef) {
        const dxr = hedef.x - px, dyr = hedef.y - py;
        const dist = Math.hypot(dxr, dyr) || 1;
        const speed = 720;
        if (online.mode === "client") {
          // Hasarı host hesaplasın (kendi roket effect'ini host kendi tarafında oynatır)
          online.pendingEvents.push({ type: "rocketShot", x: px, y: py, gi: hedef._idx, by: online.uid });
          online.vurduklarim.set(hedef._idx, performance.now());
          // Lokal görsel için kendi roket efektini de spawn et (sadece görsel, hasar yok)
          game.effects.push({
            type: "rocket",
            x: px, y: py,
            vx: (dxr / dist) * speed,
            vy: (dyr / dist) * speed,
            target: null, // hedef yok → hasar uygulanmaz, sadece görsel
            damage: 0,
            life: dist / speed + 0.5,
          });
        } else {
          game.effects.push({
            type: "rocket",
            x: px, y: py,
            vx: (dxr / dist) * speed,
            vy: (dyr / dist) * speed,
            target: hedef,
            damage: 25,
            life: dist / speed + 0.5,
            oyuncuSilahi: true,
          });
        }
        if (typeof audio.roket === "function") audio.roket(); else audio.unlock();
      } else {
        showToast(t("Hedef yok"));
        consumed = false;
      }
      break;
    }
    case "gorunmez": {
      game.player.invisibleUntil = now + 5000;
      showFloat(t("🕵 Görünmez!"), px, py - 36);
      if (typeof aeGorunmezBasla === "function") aeGorunmezBasla(px, py, 5000); // başta ve sonda parıltı
      if (typeof audio.gorunmez === "function") audio.gorunmez(); else audio.unlock();
      break;
    }
    default:
      consumed = false;
  }

  if (consumed) {
    stock[key] = Math.max(0, (stock[key] || 0) - 1);
    persistSave();
  }
  refreshWeaponBar();
}

function updateEffects(dt) {
  if (!game.effects) return;
  for (let i = game.effects.length - 1; i >= 0; i--) {
    const e = game.effects[i];
    e.life -= dt;
    if (e.type === "ghostFade") {
      // Ruh çıkıyor gibi yukarı süzül; kasırgada ölen dönerek dışarı savrulur ve yavaşlar
      e.y -= 45 * dt;
      if (e.savrul) {
        e.x += e.vx * dt; e.y += e.vy * dt;
        const sur = Math.max(0, 1 - 2.6 * dt); e.vx *= sur; e.vy *= sur;
        e.don += e.donHiz * dt;
      }
      if (e.life <= 0) game.effects.splice(i, 1);
    } else if (e.type === "spark") {
      // Hayalet hala canlıysa konumu takip et
      if (e.ghost && e.ghost.hp > 0 && game.ghosts.indexOf(e.ghost) !== -1) {
        e.x = e.ghost.x; e.y = e.ghost.y;
      }
      if (e.life <= 0) game.effects.splice(i, 1);
    } else if (e.type === "boom") {
      const t = 1 - Math.max(0, e.life / e.maxLife);
      e.r = e.rMax * (1 - Math.pow(1 - t, 2));
      if (e.life <= 0) game.effects.splice(i, 1);
    } else if (e.type === "efsane") {
      if (e.life <= 0) game.effects.splice(i, 1);
    } else if (e.type === "rocket") {
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      if (typeof aeRoketGuncelle === "function") aeRoketGuncelle(e, dt, performance.now()); // duman izi
      let exploded = false;
      const t = e.target;
      if (t && t.hp > 0 && game.ghosts.indexOf(t) !== -1) {
        if (!(e.oyuncuSilahi && gorunurPencereDisi(t.x, t.y)) &&
            Math.hypot(t.x - e.x, t.y - e.y) < (t.r || 22) + 14) {
          t.hp -= e.damage;
          if (e.uzak) t.uzakVurdu = true;
          showFloat("🚀 -" + e.damage, t.x, t.y - 30);
          exploded = true;
        }
      }
      // Duvara çarptı veya zaman doldu
      if (!exploded && (e.life <= 0 || collidesWalls(e.x, e.y, 4))) {
        exploded = true;
      }
      // Ateş kuyruğu parçacığı
      if (!exploded && Math.random() < 0.7) {
        game.particles.push({
          x: e.x - e.vx * 0.01, y: e.y - e.vy * 0.01,
          vx: -e.vx * 0.2 + (Math.random() - 0.5) * 40,
          vy: -e.vy * 0.2 + (Math.random() - 0.5) * 40,
          life: 0.35, color: Math.random() < 0.5 ? "#fbbf24" : "#fb923c",
        });
      }
      if (exploded) {
        const splashR = 110, splashR2 = splashR * splashR, splashDmg = 12;
        // Ana hedef knockback (yakın çarptığı için tam güç)
        if (t && game.ghosts.indexOf(t) !== -1) {
          const dxt = t.x - e.x, dyt = t.y - e.y;
          const distt = Math.hypot(dxt, dyt) || 1;
          t.detourVx = (dxt / distt) * 360;
          t.detourVy = (dyt / distt) * 360;
          t.detourTime = 0.45;
        }
        for (const og of game.ghosts) {
          if (og === t) continue; // ana hedef direct hit yedi
          if (e.oyuncuSilahi && gorunurPencereDisi(og.x, og.y)) continue; // görünüm dışına hasar yok
          const ddx = og.x - e.x, ddy = og.y - e.y;
          const dd2 = ddx * ddx + ddy * ddy;
          if (dd2 < splashR2) {
            og.hp -= splashDmg;
            if (e.uzak) og.uzakVurdu = true;
            spawnHitParticles(og.x, og.y);
            const dd = Math.sqrt(dd2) || 1;
            const force = 300 * (1 - dd / splashR);
            og.detourVx = (ddx / dd) * force;
            og.detourVy = (ddy / dd) * force;
            og.detourTime = 0.4;
          }
        }
        game.effects.push({ type: "boom", x: e.x, y: e.y, r: 0, rMax: splashR, life: 0.45, maxLife: 0.45 });
        spawnDeathParticles(e.x, e.y);
        if (typeof animEfektEkle === "function") animEfektEkle("kare", e.x, e.y, { ad: "patlama", sure: 0.6, boyut: 2 * splashR });
        if (typeof audio.bomba === "function") audio.bomba(); else audio.bossDie();
        navigator.vibrate?.(60);
        game.effects.splice(i, 1);
      }
    }
  }
}

function drawGhostFades(ctx) {
  if (!game.effects) return;
  for (const e of game.effects) {
    if (e.type !== "ghostFade") continue;
    const alpha = Math.max(0, e.life / e.maxLife);
    const k = 1 - alpha;
    if (typeof olumAnimCiz === "function" && olumAnimCiz(ctx, e, k)) continue; // ChatGPT "puf" kareleri (N02, N05)
    ctx.save();
    ctx.globalAlpha = alpha * 0.7;
    if (e.don) { ctx.translate(e.x, e.y); ctx.rotate(e.don); ctx.translate(-e.x, -e.y); } // kasırgada savrulan
    if (typeof olumDonusumu === "function") olumDonusumu(ctx, e, k); // uzayarak dumana dönüşür
    drawGhost(ctx, e);
    ctx.restore();
    if (typeof olumPufuCiz === "function") olumPufuCiz(ctx, e, k);
  }
}

// IZ1: düşman mermisinin arkasında solan ışık izi (yalnız görsel; konum geçmişi mermi nesnesinde, oyun durumuna girmez).
// Kullanıcı (28 Kasım 2026): "atışlara animasyon ekle, arkaya ışıldama bıraksın".
function dusmanMermiIzi(ctx, p) {
  const az = typeof aeAzHareket === "function" && aeAzHareket();
  const iz = p._iz || (p._iz = []);
  const son = iz[iz.length - 1];
  if (!son || Math.hypot(p.x - son.x, p.y - son.y) >= 4) { iz.push({ x: p.x, y: p.y }); if (iz.length > (az ? 4 : 12)) iz.shift(); }
  if (iz.length < 2) return;
  const renk = p.isBoss ? [251, 146, 60] : [192, 132, 252]; // boss turuncu, hayalet mor
  const r0 = p.isBoss ? 9 : 6, t = performance.now() / 1000;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < iz.length - 1; i++) {
    const k = (i + 1) / iz.length; // 0 eski → 1 yeni
    ctx.globalAlpha = 0.08 + k * 0.32;
    ctx.fillStyle = `rgb(${renk[0]},${renk[1]},${renk[2]})`;
    ctx.beginPath(); ctx.arc(iz[i].x, iz[i].y, r0 * (0.35 + k * 0.75), 0, Math.PI * 2); ctx.fill();
  }
  if (!az) { // izin içinde uçuşan iki kıvılcım
    for (let j = 0; j < 2; j++) {
      const q = iz[Math.max(0, iz.length - 3 - j * 3)];
      const s = Math.sin(t * 9 + j * 2.3 + (p.id || 0));
      ctx.globalAlpha = 0.5 + s * 0.3;
      ctx.fillStyle = "#fff7ed";
      ctx.beginPath(); ctx.arc(q.x + s * 4, q.y + Math.cos(t * 7 + j) * 4, 1.6, 0, Math.PI * 2); ctx.fill();
    }
  }
  // Başın çevresinde nabız gibi atan yumuşak parıltı
  const R = r0 * (2.4 + (az ? 0 : Math.sin(t * 8 + (p.id || 0)) * 0.35));
  const gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, R);
  gr.addColorStop(0, `rgba(${renk[0]},${renk[1]},${renk[2]},0.55)`);
  gr.addColorStop(1, `rgba(${renk[0]},${renk[1]},${renk[2]},0)`);
  ctx.globalAlpha = 0.9; ctx.fillStyle = gr;
  ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawEnemyProjectile(ctx, p) {
  dusmanMermiIzi(ctx, p);
  ctx.save();
  ctx.translate(p.x, p.y);
  if (typeof anmAcilis === "function") { const pop = anmAcilis(p, performance.now(), 180); if (pop !== 1) ctx.scale(pop, pop); } // ANM1: çıkışta pop
  const r = p.isBoss ? 9 : 6;
  if (typeof gorsel === "function" && typeof gorselKutuya === "function" && gorsel(p.isBoss ? "atis-boss" : "atis-hayalet")) {
    const boy = r * 5;
    const ang = Math.atan2(p.vy, p.vx);
    if (p.isBoss) {
      ctx.rotate(ang);
      gorselKutuya(ctx, "atis-boss", -boy / 2, -boy / 2, boy, boy);
    } else {
      // IZ1: resmin kuyruğu solda (sağa uçar): gidiş yönüne döndürülür, kuyruk hep arkada kalır. Sola giderken dikey
      // aynalanır ki yüz baş aşağı dönmesin. (Eskiden hiç döndürülmüyordu: kuyruk her yönde yatay duruyordu.)
      ctx.rotate(ang);
      if (Math.cos(ang) < 0) ctx.scale(1, -1);
      gorselKutuya(ctx, "atis-hayalet", -boy / 2, -boy / 2, boy, boy);
    }
    ctx.restore();
    return;
  }
  const color = p.isBoss ? "#dc2626" : "#a855f7";
  // Glow halo
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2.5);
  glow.addColorStop(0, color);
  glow.addColorStop(0.4, color);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(0, 0, r * 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  // Çekirdek
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  // Beyaz parıltı
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.3, r * 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawSparkBolt(ctx, x1, y1, x2, y2, segs) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  for (let s = 1; s < segs; s++) {
    const t = s / segs;
    const mx = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 12;
    const my = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 12;
    ctx.lineTo(mx, my);
  }
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawEffects(ctx) {
  if (!game.effects) return;
  for (const e of game.effects) {
    if (e.type === "efsane") {
      const a = Math.max(0, e.life / e.maxLife);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(e.x, e.y);
      const sc = 1.2 + (1 - a) * 0.8;
      ctx.scale(sc, sc);
      if (typeof gorselKutuya !== "function" || !gorselKutuya(ctx, "efsane-parilti", -60, -60, 120, 120)) {
        ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, 50, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
      continue;
    }
    if (e.type === "spark") {
      const alpha = Math.max(0, e.life / e.maxLife);
      ctx.save();
      // Mavi-beyaz parlama (haleyle çevre)
      const flashGrad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, 36);
      flashGrad.addColorStop(0,    `rgba(220, 240, 255, ${alpha * 0.7})`);
      flashGrad.addColorStop(0.5,  `rgba(125, 211, 252, ${alpha * 0.4})`);
      flashGrad.addColorStop(1,    "rgba(125, 211, 252, 0)");
      ctx.fillStyle = flashGrad;
      ctx.beginPath();
      ctx.arc(e.x, e.y, 36, 0, Math.PI * 2);
      ctx.fill();
      // Zigzag yıldırımlar (hayalet üzerinden 3 yöne)
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#ffffff";
      ctx.shadowColor = "#7dd3fc";
      ctx.shadowBlur = 8;
      const boltCount = 4;
      for (let b = 0; b < boltCount; b++) {
        const a = Math.random() * Math.PI * 2;
        const len = 18 + Math.random() * 14;
        drawSparkBolt(ctx, e.x, e.y - 6, e.x + Math.cos(a) * len, e.y - 6 + Math.sin(a) * len, 4);
      }
      // Parlak spark noktaları
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fde047";
      for (let s = 0; s < 5; s++) {
        const a = Math.random() * Math.PI * 2;
        const r = 10 + Math.random() * 18;
        ctx.beginPath();
        ctx.arc(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r, 1.5 + Math.random() * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else if (e.type === "boom") {
      if (typeof animHazir === "function" && animHazir("patlama")) continue; // ChatGPT kareleri çizilir
      const alpha = Math.max(0, e.life / e.maxLife);
      ctx.save();
      // İç dolgu (radyal gradient)
      const grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, Math.max(e.r, 1));
      grad.addColorStop(0,    `rgba(254, 240, 138, ${alpha * 0.85})`);
      grad.addColorStop(0.55, `rgba(251, 146, 60, ${alpha * 0.55})`);
      grad.addColorStop(1,    "rgba(220, 38, 38, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(e.x, e.y, Math.max(e.r, 1), 0, Math.PI * 2);
      ctx.fill();
      // Şok dalgası halkası
      ctx.globalAlpha = alpha * 0.9;
      ctx.strokeStyle = "#fde047";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (e.type === "rocket") {
      if (typeof anmRoketIzi === "function") anmRoketIzi(ctx, e, performance.now()); // ANM1: ışık izi
      if (typeof aeRoketCiz === "function" && aeRoketCiz(ctx, e)) continue; // kareler ya da kod roketi (anim-ek.js)
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(Math.atan2(e.vy, e.vx));
      // Ateş kuyruğu
      const flameLen = 22 + Math.random() * 6;
      const flameGrad = ctx.createLinearGradient(-flameLen, 0, -2, 0);
      flameGrad.addColorStop(0,   "rgba(254, 240, 138, 0)");
      flameGrad.addColorStop(0.5, "rgba(251, 146, 60, 0.85)");
      flameGrad.addColorStop(1,   "rgba(220, 38, 38, 1)");
      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(-flameLen, -4);
      ctx.lineTo(-2, -3);
      ctx.lineTo(-2,  3);
      ctx.lineTo(-flameLen,  4);
      ctx.closePath();
      ctx.fill();
      // Gövde
      ctx.fillStyle = "#e5e7eb";
      ctx.fillRect(-9, -5, 17, 10);
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 1;
      ctx.strokeRect(-9, -5, 17, 10);
      // Burun konisi
      ctx.fillStyle = "#dc2626";
      ctx.beginPath();
      ctx.moveTo(8, -5);
      ctx.lineTo(15, 0);
      ctx.lineTo(8, 5);
      ctx.closePath();
      ctx.fill();
      // Üst kanat
      ctx.fillStyle = "#64748b";
      ctx.beginPath();
      ctx.moveTo(-6, -5);
      ctx.lineTo(-12, -10);
      ctx.lineTo(-2, -5);
      ctx.closePath();
      ctx.fill();
      // Alt kanat
      ctx.beginPath();
      ctx.moveTo(-6, 5);
      ctx.lineTo(-12, 10);
      ctx.lineTo(-2, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
}

// Yükseltmeler: 10 seviye (geç seviyeler çok pahalı — para deposu)
const UPGRADES = {
  speed:    { name: t("Hız"),      icon: "👟", gorsel: "gel-hiz",    desc: t("Daha hızlı koş."),   max: 10, costs: [50,  100, 200, 400,  800,  1600, 3200, 6400,  12000, 24000] },
  damage:   { name: t("Hasar"),    icon: "💥", gorsel: "gel-hasar",  desc: t("Daha güçlü vur."),   max: 10, costs: [75,  150, 300, 600,  1200, 2400, 4800, 9600,  18000, 36000] },
  fireRate: { name: t("Atış Hızı"),icon: "⚡", gorsel: "gel-atis",   desc: t("Hızlı ateş et."),    max: 10, costs: [60,  120, 240, 480,  960,  1920, 3840, 7680,  15000, 30000] },
  range:    { name: t("Menzil"),   icon: "🎯", gorsel: "gel-menzil", desc: t("Uzaktan vur."),       max: 10, costs: [50,  100, 200, 400,  800,  1600, 3200, 6400,  12000, 24000] },
};

// ====== ÇİZİM YARDIMCILARI ======
// Önizleme tuvalleri için kalıcı kimlik (uc-avci.js animasyon durumunu buna göre saklar)
const _onizlemeKimlikleri = new WeakMap();
let _onizlemeKimlikSayac = 0;
function _onizlemeKimlik(ctx) {
  const cv = ctx && ctx.canvas;
  if (!cv) return "onizleme-" + (++_onizlemeKimlikSayac);
  let k = _onizlemeKimlikleri.get(cv);
  if (!k) { k = "onizleme-" + (++_onizlemeKimlikSayac); _onizlemeKimlikleri.set(cv, k); }
  return k;
}
// 3D çizimi ölçer: UcAvci.ciz süresi başarım korumasına bildirilir (45 ms ortalamada 3D kapanır).
function ucCizOlc(ctx, o) {
  const bas = performance.now();
  const sonuc = window.UcAvci.ciz(ctx, o);
  if (window.UcAvci.sureEkle) window.UcAvci.sureEkle(performance.now() - bas);
  return sonuc;
}
// GLG1: karakterin ayak çizgisi (yerel birim). 3D model ayakları y + kk.alt*s'te durur; 2D kod gövdesinin tabanı 45*s.
const AYAK_DUZELT_3D = 0; // ölçüldü: 3D ayak tabanı ile kk.alt farkı <= 2 px (gölge yine tabana oturur)
function ayakY(charKey, costumeIdx, s) {
  // _karKodla sırasında karakterKodKutusu kendini yeniden ölçmesin (sonsuz döngü)
  const kk = (typeof karakterKodKutusu === "function" && !(typeof _karKodla !== "undefined" && _karKodla))
    ? karakterKodKutusu(charKey, costumeIdx) : null;
  const duzelt = (window.UcAvci && UcAvci.hazir && typeof UcAvci.destek === "function" && UcAvci.destek()) ? AYAK_DUZELT_3D : 0;
  return (kk && Number.isFinite(kk.alt) ? kk.alt : 45) * s + duzelt;
}
// GLG1: yere oturan gölge. Önce yumuşak düşen gölge (hafif sağa/aşağı), sonra temas gölgesi (kaymasız, ayak tabanına yapışır).
function zeminGolgesi(ctx, x, y, s, yumusak = true) {
  if (yumusak) {
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath(); ctx.ellipse(x + 2, y + 1, 22 * s, 7 * s, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath(); ctx.ellipse(x, y, 17 * s, 5.5 * s, 0, 0, Math.PI * 2); ctx.fill();
}
function drawCharacter(ctx, charKey, costumeIdx, x, y, size, faceDir = 0, walkPhase = 0, aimRaise = 0, shootRecoil = 0, gunKey = "", bakisSol = null, aci3d = null, kimlik3d = null, ozel3d = null, sadeceOnbellek = false) {
  if (!CHARACTERS[charKey] || !COSTUMES[charKey]) charKey = "kinkin"; // yeni sürümden gelen oyuncunun karakteri bende yoksa
  const c = CHARACTERS[charKey];
  const cos = COSTUMES[charKey][costumeIdx] || COSTUMES[charKey][0];
  const hair = cos.hair;
  const body = cos.body;
  const skin = c.color.skin;
  const legs = c.color.legs;

  const s = size / 100;
  const isWalking = walkPhase > 0;
  const swing = isWalking ? Math.sin(walkPhase * 12) : 0;
  const bob = isWalking ? Math.abs(Math.sin(walkPhase * 12)) * 1.5 * s : 0;
  // Yürürken hafif vücut salınımı
  const torsoLean = swing * 0.04;

  ctx.save();
  ctx.translate(x, y);
  zeminGolgesi(ctx, 0, ayakY(charKey, costumeIdx, s), s); // GLG1: gölge yerde, sallanmadan
  ctx.translate(0, -bob);
  ctx.rotate(torsoLean);
  // Dururken hafif nefes (anim.js): ayak hizası sabit, gövde çok az uzayıp kısalır
  const nefes = typeof avciNefes === "function" ? avciNefes(performance.now(), isWalking) : 0;
  if (nefes) { ctx.translate(0, 45 * s); ctx.scale(1 - nefes * 0.5, 1 + nefes); ctx.translate(0, -45 * s); }

  // Gerçek 3D avcı (uc-avci.js): gölgeden sonra model; çizdiyse 2D gövdeye hiç girilmez. Ölçüm sırasında (_karKodla) kapalı.
  if (window.UcAvci && window.UcAvci.hazir && (typeof _karKodla === "undefined" || !_karKodla)) {
    const kimlik = kimlik3d || (aci3d !== null ? "ben" : _onizlemeKimlik(ctx));
    if (ucCizOlc(ctx, {
      charKey, costumeIdx, x: 0, y: 0, size, aci: aci3d,
      yuruyor: isWalking, kosuyor: false, walkPhase, shootRecoil,
      aimRaise, nisan: aimRaise > 0.4, gunKey, kimlik, ozel: ozel3d || undefined, sadeceOnbellek,
    })) { ctx.restore(); return; }
  }

  // ChatGPT 3D karakter kareleri (A paftaları, gorsel.js): gövde kare kare resimden, silah koddan (nişan, geri tepme)
  // Kareler yandan, sağa dönük çizildi: sola bakarken (bakisSol) karakter ve silah birlikte yatay aynalanır. bakisSol
  // null ise faceDir'den karar verilir (cos < 0). Aynalama karakter3dCiz çağrısından önce kurulmalı (karakter3dHazir ile
  // önceden sınanır); gölge bu bloktan önce çizildiği için aynalanmaz. KS resimleri ve kod çizimi önden, aynalanmaz.
  if (typeof karakter3dCiz === "function" && typeof karakter3dHazir === "function" && karakter3dHazir(charKey, costumeIdx)) {
    const solaBakar = bakisSol === null ? Math.cos(faceDir) < 0 : !!bakisSol;
    if (solaBakar) { ctx.save(); ctx.scale(-1, 1); }
    if (karakter3dCiz(ctx, charKey, costumeIdx, s, { yuruyor: isWalking, walkPhase, shootRecoil, zamanSn: performance.now() / 1000 })) {
      karakterSilahiCiz(ctx, charKey, c, s, swing, aimRaise, shootRecoil, gunKey);
      if (solaBakar) ctx.restore();
      ctx.restore();
      return;
    }
    if (solaBakar) ctx.restore();
  }

  // ChatGPT karakter resmi (elleri boş, KS paftaları; gorsel.js): gövde resimden, silah koddan (nişan, geri tepme)
  if (typeof karakterResmiCiz === "function" && karakterResmiCiz(ctx, charKey, costumeIdx, s, swing)) {
    karakterSilahiCiz(ctx, charKey, c, s, swing, aimRaise, shootRecoil, gunKey);
    ctx.restore();
    return;
  }

  // Mark için sırt çantası askıları (vücudun arkasında)
  if (charKey === "mark") {
    ctx.fillStyle = "#7c2d12";
    ctx.fillRect(-22 * s, -4 * s, 6 * s, 26 * s);
    ctx.fillRect(16 * s, -4 * s, 6 * s, 26 * s);
    // Çanta gövdesi (sağ arkaya doğru)
    ctx.fillStyle = "#92400e";
    ctx.fillRect(18 * s, 2 * s, 18 * s, 26 * s);
    ctx.strokeStyle = "#451a03";
    ctx.lineWidth = 1.5 * s;
    ctx.strokeRect(18 * s, 2 * s, 18 * s, 26 * s);
    ctx.fillStyle = "#fde68a";
    ctx.fillRect(22 * s, 8 * s, 10 * s, 4 * s);
  }

  // Kent için pelerin (her şeyin altında, geniş)
  if (charKey === "kent") {
    // Hayalet aurası
    const t = performance.now() / 400;
    const aura = ctx.createRadialGradient(0, 0, 0, 0, 0, 50 * s);
    aura.addColorStop(0, "rgba(120, 80, 200, 0.25)");
    aura.addColorStop(1, "rgba(120, 80, 200, 0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, 50 * s, 0, Math.PI * 2);
    ctx.fill();

    // Pelerinin alt kısmı dalgalı
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(-26 * s, -10 * s);
    ctx.lineTo(28 * s, -10 * s);
    ctx.lineTo(34 * s, 30 * s);
    // dalgalı alt kenar
    for (let i = 6; i >= 0; i--) {
      const wx = 34 * s - (i / 6) * 68 * s;
      const wy = 30 * s + (i % 2 === 0 ? 8 : 16) * s + Math.sin(t + i) * 2 * s;
      ctx.lineTo(wx, wy);
    }
    ctx.lineTo(-34 * s, 30 * s);
    ctx.closePath();
    ctx.fill();
  }

  // Bacaklar (Kent ve Beti hariç) — yürürken adım animasyonu
  if (charKey !== "kent" && charKey !== "beti") {
    ctx.fillStyle = legs;
    const liftL = Math.max(0,  swing) * 4 * s;
    const liftR = Math.max(0, -swing) * 4 * s;
    ctx.fillRect(-12 * s, 18 * s - liftL, 10 * s, 24 * s - liftL * 0.6);
    ctx.fillRect(2 * s,   18 * s - liftR, 10 * s, 24 * s - liftR * 0.6);
  }

  if (charKey === "kornet") {
    // Kornet: Mor kabarık vücut (üzüm/dikenli top)
    ctx.fillStyle = body;
    const bumps = 8;
    for (let i = 0; i < bumps; i++) {
      const ang = (i / bumps) * Math.PI * 2;
      const bx = Math.cos(ang) * 16 * s;
      const by = Math.sin(ang) * 14 * s + 5 * s;
      ctx.beginPath();
      ctx.arc(bx, by, 9 * s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, 5 * s, 18 * s, 0, Math.PI * 2);
    ctx.fill();

    // Beyaz dikişli kafa
    ctx.fillStyle = "#fafafa";
    ctx.beginPath();
    ctx.arc(0, -22 * s, 18 * s, 0, Math.PI * 2);
    ctx.fill();

    // Dikişler (ağız)
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(-10 * s, -15 * s);
    ctx.lineTo(10 * s, -15 * s);
    ctx.stroke();
    for (let i = -8; i <= 8; i += 4) {
      ctx.beginPath();
      ctx.moveTo(i * s, -18 * s);
      ctx.lineTo(i * s, -12 * s);
      ctx.stroke();
    }

    // Gözler
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(-7 * s, -25 * s, 2.5 * s, 0, Math.PI * 2);
    ctx.arc(7 * s, -25 * s, 2.5 * s, 0, Math.PI * 2);
    ctx.fill();

    // Kornet'in büyücü asası (envanterden silah takılıysa o)
    if (gunKey) drawGunInHand(ctx, gunKey, s, swing, aimRaise, shootRecoil);
    else drawCharWeapon(ctx, "kornet", s, swing, aimRaise, shootRecoil);
  } else if (charKey === "kent") {
    // Kapüşonun iç boşluğu (yüz)
    ctx.fillStyle = "#0a0a18";
    ctx.beginPath();
    ctx.arc(0, -20 * s, 20 * s, 0, Math.PI * 2);
    ctx.fill();

    // Solgun yüz (kapüşonun içinde küçük)
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, -20 * s, 14 * s, 0, Math.PI * 2);
    ctx.fill();

    // Kapüşon (üstten yarım daire, geniş)
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(0, -22 * s, 24 * s, Math.PI + 0.2, -0.2);
    ctx.lineTo(20 * s, -8 * s);
    ctx.lineTo(-20 * s, -8 * s);
    ctx.closePath();
    ctx.fill();

    // Parlayan kırmızı gözler
    const glow = ctx.createRadialGradient(-6 * s, -20 * s, 0, -6 * s, -20 * s, 6 * s);
    glow.addColorStop(0, "rgba(239,68,68,0.9)");
    glow.addColorStop(1, "rgba(239,68,68,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(-14 * s, -28 * s, 16 * s, 16 * s);
    const glow2 = ctx.createRadialGradient(6 * s, -20 * s, 0, 6 * s, -20 * s, 6 * s);
    glow2.addColorStop(0, "rgba(239,68,68,0.9)");
    glow2.addColorStop(1, "rgba(239,68,68,0)");
    ctx.fillStyle = glow2;
    ctx.fillRect(-2 * s, -28 * s, 16 * s, 16 * s);
    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.arc(-6 * s, -20 * s, 2.5 * s, 0, Math.PI * 2);
    ctx.arc(6 * s, -20 * s, 2.5 * s, 0, Math.PI * 2);
    ctx.fill();

    // Bıçak (sağda; envanterden silah takılıysa o)
    if (gunKey) {
      drawGunInHand(ctx, gunKey, s, swing, aimRaise, shootRecoil);
    } else {
      ctx.fillStyle = c.color.weapon;
      ctx.fillRect(28 * s, -6 * s, 4 * s, 22 * s);
      ctx.fillStyle = "#451a03";
      ctx.fillRect(26 * s, 14 * s, 8 * s, 6 * s);
    }
  } else if (charKey === "beti") {
    // Beti: lolipop kafalı, sevimli vücut
    // Vücut (kalpli elbise)
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(-20 * s, -4 * s);
    ctx.lineTo(20 * s, -4 * s);
    ctx.lineTo(24 * s, 28 * s);
    ctx.lineTo(-24 * s, 28 * s);
    ctx.closePath();
    ctx.fill();
    // Kollar
    ctx.fillRect(-30 * s, -2 * s, 8 * s, 18 * s);
    ctx.fillRect(22 * s, -2 * s, 8 * s, 18 * s);
    // Bacaklar (mor çizgili)
    ctx.fillStyle = legs;
    ctx.fillRect(-10 * s, 28 * s, 8 * s, 14 * s);
    ctx.fillRect(2 * s, 28 * s, 8 * s, 14 * s);
    // Elbisedeki kalpler
    ctx.fillStyle = "#fff";
    drawHeart(ctx, -10 * s, 8 * s, 4 * s);
    drawHeart(ctx, 10 * s, 8 * s, 4 * s);
    drawHeart(ctx, 0, 18 * s, 4 * s);

    // Lolipop sopası
    ctx.fillStyle = "#fafafa";
    ctx.fillRect(-2 * s, -22 * s, 4 * s, 18 * s);

    // Lolipop kafa (renkli sarmal)
    const lx = 0, ly = -34 * s, lr = 18 * s;
    ctx.save();
    ctx.translate(lx, ly);
    ctx.beginPath();
    ctx.arc(0, 0, lr, 0, Math.PI * 2);
    ctx.fillStyle = hair;
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 2; a += 0.4) {
      const r1 = lr * 0.2;
      const r2 = lr * 0.95;
      const x1 = Math.cos(a) * r1, y1 = Math.sin(a) * r1;
      const x2 = Math.cos(a + 0.6) * r2, y2 = Math.sin(a + 0.6) * r2;
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(0, 0, x2, y2);
    }
    ctx.stroke();
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.arc(0, 0, lr, 0, Math.PI * 2);
    ctx.stroke();
    // Sevimli yüz lolipopta
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(-5 * s, -2 * s, 2 * s, 0, Math.PI * 2);
    ctx.arc(5 * s, -2 * s, 2 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.arc(0, 3 * s, 4 * s, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.restore();
    if (gunKey) drawGunInHand(ctx, gunKey, s, swing, aimRaise, shootRecoil);
  } else {
    // Genel insan kahraman: Kinkin/Veryi/Mark/Ponko/Gül/Rani/Fanatik/Silsen/Serçin
    if (charKey === "silsen" || charKey === "sercin") {
      // Uzun saç: sırttan aşağı iner (Serçin'inki bele kadar)
      const boy = charKey === "sercin" ? 24 : 14;
      ctx.fillStyle = hair;
      ctx.beginPath();
      ctx.moveTo(-20 * s, -28 * s);
      ctx.lineTo(20 * s, -28 * s);
      ctx.lineTo(24 * s, boy * s);
      ctx.lineTo(-24 * s, boy * s);
      ctx.closePath();
      ctx.fill();
    }
    if (cos.wings) {
      // Tüylü kanatlar: kolların dışına açılan üçer tüy
      ctx.fillStyle = "#fff7ed";
      ctx.strokeStyle = "#9a3412";
      ctx.lineWidth = 1.2 * s;
      for (const yon of [-1, 1]) {
        for (let i = 0; i < 3; i++) {
          const yy = (4 + i * 7) * s;
          ctx.beginPath();
          ctx.moveTo(yon * 26 * s, yy - 4 * s);
          ctx.quadraticCurveTo(yon * (44 + i * 3) * s, yy - 2 * s, yon * (50 - i * 4) * s, yy + 8 * s);
          ctx.quadraticCurveTo(yon * 38 * s, yy + 4 * s, yon * 26 * s, yy + 3 * s);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }
    }
    // Vücut (tişört / gi)
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(-22 * s, -8 * s);
    ctx.lineTo(22 * s, -8 * s);
    ctx.lineTo(18 * s, 22 * s);
    ctx.lineTo(-18 * s, 22 * s);
    ctx.closePath();
    ctx.fill();

    // Kollar
    ctx.fillStyle = body;
    ctx.fillRect(-30 * s, -6 * s, 10 * s, 22 * s);
    ctx.fillRect(20 * s, -6 * s, 10 * s, 22 * s);

    // Fanatik için siyah kuşak
    if (charKey === "fanatik") {
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(-22 * s, 12 * s, 44 * s, 7 * s);
      // Kuşak ucu sarkık
      ctx.fillRect(-2 * s, 18 * s, 4 * s, 10 * s);
      // V yakası
      ctx.fillStyle = "#0a0a0a";
      ctx.beginPath();
      ctx.moveTo(-10 * s, -8 * s);
      ctx.lineTo(0, 4 * s);
      ctx.lineTo(10 * s, -8 * s);
      ctx.closePath();
      ctx.fill();
    }

    // Yüz
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, -22 * s, 18 * s, 0, Math.PI * 2);
    ctx.fill();

    // Saç
    ctx.fillStyle = hair;
    if (charKey === "kinkin") {
      for (let i = 0; i < 5; i++) {
        const angle = -Math.PI / 2 + (i - 2) * 0.4;
        const sx = Math.cos(angle) * 18 * s;
        const sy = Math.sin(angle) * 18 * s - 22 * s;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(angle + Math.PI / 2);
        ctx.fillRect(-3 * s, -2 * s, 14 * s, 5 * s);
        ctx.restore();
      }
      ctx.beginPath();
      ctx.arc(0, -32 * s, 14 * s, Math.PI, 0);
      ctx.fill();
    } else if (charKey === "mark") {
      // Mark: uzun saç (omuza kadar inen)
      ctx.beginPath();
      ctx.arc(0, -28 * s, 19 * s, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(-19 * s, -28 * s, 38 * s, 14 * s);
      ctx.fillRect(-22 * s, -22 * s, 8 * s, 22 * s);
      ctx.fillRect(14 * s, -22 * s, 8 * s, 22 * s);
    } else if (charKey === "gul") {
      // Gül: saç + üstte düz şapka (kepi)
      ctx.beginPath();
      ctx.arc(0, -28 * s, 18 * s, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(-18 * s, -28 * s, 36 * s, 14 * s);
      // Düz tepeli şapka
      ctx.fillStyle = "#1f2937";
      ctx.fillRect(-16 * s, -42 * s, 32 * s, 8 * s);
      ctx.fillRect(-12 * s, -52 * s, 24 * s, 12 * s);
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2 * s;
      ctx.strokeRect(-12 * s, -52 * s, 24 * s, 12 * s);
    } else if (charKey === "ponko") {
      // Ponko: küçük saç + DEV güneş şapkası
      ctx.beginPath();
      ctx.arc(0, -28 * s, 17 * s, Math.PI, 0);
      ctx.fill();
      // Şapka kenarı (geniş)
      ctx.fillStyle = "#7c2d12";
      ctx.beginPath();
      ctx.ellipse(0, -36 * s, 38 * s, 7 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      // Şapka tepesi
      ctx.fillStyle = "#92400e";
      ctx.beginPath();
      ctx.arc(0, -42 * s, 14 * s, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(-14 * s, -42 * s, 28 * s, 6 * s);
      // Şapka bandı
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(-14 * s, -38 * s, 28 * s, 3 * s);
    } else if (charKey === "rani") {
      // Rani: yuvarlak yüzlü, küçük tepe saç
      ctx.beginPath();
      ctx.arc(0, -32 * s, 14 * s, Math.PI, 0);
      ctx.fill();
      // İki küçük "kulak gibi" topuz
      ctx.beginPath();
      ctx.arc(-14 * s, -32 * s, 5 * s, 0, Math.PI * 2);
      ctx.arc(14 * s, -32 * s, 5 * s, 0, Math.PI * 2);
      ctx.fill();
    } else if (charKey === "fanatik") {
      // Fanatik: sade siyah saç + kırmızı kafa bandı
      ctx.beginPath();
      ctx.arc(0, -28 * s, 18 * s, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(-18 * s, -28 * s, 36 * s, 8 * s);
      // Kafa bandı (kırmızı)
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(-18 * s, -26 * s, 36 * s, 5 * s);
      // Bandın yanlardan sarkan ucu
      ctx.fillRect(-20 * s, -26 * s, 4 * s, 14 * s);
    } else if (charKey === "silsen") {
      // Silsen: tepede saç, alnında tırtıklı kahkül, yanlarda omuza inen perçemler
      ctx.beginPath();
      ctx.arc(0, -28 * s, 19 * s, Math.PI, 0);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-18 * s, -32 * s);
      ctx.lineTo(18 * s, -32 * s);
      for (let i = 0; i <= 8; i++) {
        ctx.lineTo((18 - i * 4.5) * s, (i % 2 === 0 ? -28 : -25) * s);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(-20 * s, -30 * s, 6 * s, 26 * s);
      ctx.fillRect(14 * s, -30 * s, 6 * s, 26 * s);
    } else if (charKey === "sercin") {
      // Serçin: ortadan ayrılmış düz saç, yüzün iki yanından uzun iner
      ctx.beginPath();
      ctx.arc(0, -27 * s, 19 * s, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(-20 * s, -28 * s, 7 * s, 34 * s);
      ctx.fillRect(13 * s, -28 * s, 7 * s, 34 * s);
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 1 * s;
      ctx.beginPath();
      ctx.moveTo(0, -46 * s);
      ctx.lineTo(0, -36 * s);
      ctx.stroke();
    } else {
      // Veryi: kısa düz saç
      ctx.beginPath();
      ctx.arc(0, -28 * s, 17 * s, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(-17 * s, -28 * s, 34 * s, 8 * s);
    }
    if (cos.ears) {
      // Sivri kedi kulakları (içi pembe)
      for (const yon of [-1, 1]) {
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.moveTo(yon * 6 * s, -42 * s);
        ctx.lineTo(yon * 13 * s, -60 * s);
        ctx.lineTo(yon * 19 * s, -38 * s);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#fda4af";
        ctx.beginPath();
        ctx.moveTo(yon * 9 * s, -42 * s);
        ctx.lineTo(yon * 13 * s, -54 * s);
        ctx.lineTo(yon * 16 * s, -41 * s);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Gözler (Rani için büyük)
    ctx.fillStyle = "#222";
    const eyeR = charKey === "rani" ? 3.5 * s : 2.5 * s;
    const eyeY = charKey === "rani" ? -22 * s : -22 * s;
    ctx.beginPath();
    ctx.arc(-6 * s, eyeY, eyeR, 0, Math.PI * 2);
    ctx.arc(6 * s, eyeY, eyeR, 0, Math.PI * 2);
    ctx.fill();
    if (charKey === "rani") {
      // Göz parıltısı
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(-5 * s, -23 * s, 1.2 * s, 0, Math.PI * 2);
      ctx.arc(7 * s, -23 * s, 1.2 * s, 0, Math.PI * 2);
      ctx.fill();
    }

    if (charKey === "sercin") {
      // Serçe gagası gibi üçgen burun
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.moveTo(-3.5 * s, -19 * s);
      ctx.lineTo(3.5 * s, -19 * s);
      ctx.lineTo(0, -13 * s);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#92400e";
      ctx.lineWidth = 1 * s;
      ctx.stroke();
    } else if (charKey === "silsen") {
      // Açık gülüş
      ctx.fillStyle = "#7f1d1d";
      ctx.beginPath();
      ctx.moveTo(-6 * s, -17 * s);
      ctx.lineTo(6 * s, -17 * s);
      ctx.arc(0, -17 * s, 6 * s, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillRect(-4 * s, -17 * s, 8 * s, 1.6 * s);
    } else {
      // Gülümseme
      ctx.strokeStyle = "#222";
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.arc(0, -16 * s, 6 * s, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }

    // Karaktere özel silah (envanterden silah takılıysa o)
    if (gunKey) drawGunInHand(ctx, gunKey, s, swing, aimRaise, shootRecoil);
    else drawCharWeapon(ctx, charKey, s, swing, aimRaise, shootRecoil);
  }

  ctx.restore();
}

// Resimli karakterde silah: kod çizimindeki gibi (envanter silahı, yoksa karakterin kendi silahı; Kenit'te bıçak,
// Beti'de yalnız envanter silahı)
function karakterSilahiCiz(ctx, charKey, c, s, swing, aimRaise, shootRecoil, gunKey) {
  if (gunKey) { drawGunInHand(ctx, gunKey, s, swing, aimRaise, shootRecoil); return; }
  if (charKey === "beti") return;
  if (charKey === "kent") {
    // 3D bıçak resmi (W2 paftası, gorsel.js) varsa omuz pivotuyla nişan da yapar; yoksa kod çizimindeki dik bıçak
    if (typeof silah3d === "function" && silah3d("kent")) { drawCharWeapon(ctx, "kent", s, swing, aimRaise, shootRecoil); return; }
    ctx.fillStyle = c.color.weapon;
    ctx.fillRect(28 * s, -6 * s, 4 * s, 22 * s);
    ctx.fillStyle = "#451a03";
    ctx.fillRect(26 * s, 14 * s, 8 * s, 6 * s);
    return;
  }
  drawCharWeapon(ctx, charKey, s, swing, aimRaise, shootRecoil);
}

// Hayalet olan oyuncunun görüntüsü (çevrimiçi oyunda ölen oyuncu): karakter bir kez ayrı bir tuvale çizilip mavi tonla
// boyanır, her karede tek drawImage ile süzülerek basılır. Eskiden ctx.filter (hue-rotate) kullanılıyordu; tuval
// filtresi karakterin onlarca çizim işleminin her birine ayrı uygulandığı için biri ölünce iki cihazda da kare
// 0,4–4 sn sürüyor, oyun donuyordu (test/cizim.test.mjs).
const _hayaletGorunumleri = {};
function hayaletGorunumu(charKey, costumeIdx) {
  const k = Math.min(window.devicePixelRatio || 1, 2) * (game.viewScale || 1); // ekran çözünürlüğünde, bulanık olmasın
  const anahtar = `${charKey}:${costumeIdx || 0}:${k.toFixed(2)}`;
  let g = _hayaletGorunumleri[anahtar];
  if (g) return g;
  const w = 140, h = 150, ox = 70, oy = 80;
  const cv = document.createElement("canvas");
  cv.width = Math.ceil(w * k); cv.height = Math.ceil(h * k);
  const c = cv.getContext("2d");
  c.scale(k, k);
  drawCharacter(c, charKey, costumeIdx || 0, ox, oy, 70);
  c.globalCompositeOperation = "source-atop"; // yalnız karakterin üstü boyanır
  c.fillStyle = "rgba(147, 197, 253, 0.6)";
  c.fillRect(0, 0, w, h);
  g = _hayaletGorunumleri[anahtar] = { cv, w, h, ox, oy };
  return g;
}
function hayaletOyuncuCiz(ctx, charKey, costumeIdx, x, y, alpha) {
  const g = hayaletGorunumu(charKey, costumeIdx);
  const suzul = Math.sin(performance.now() / 350 + x * 0.01) * 4; // hayalet gibi hafifçe süzülür
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(g.cv, x - g.ox, y - g.oy + suzul, g.w, g.h);
  ctx.restore();
}

// 3D silah resimlerinin uzunluğu (s birimi; W paftaları, gorsel.js): resim tutma yerinden namlu ucuna kadar bu uzunlukta.
// Güllu'nun yayı paftada dik durur (47 × 192): uzunluk resmin genişliğidir, boyu (49) kod yayınınki kadardır.
const SILAH3D_UZUNLUK = { kinkin: 20, veryi: 30, mark: 24, ponko: 20, gul: 12, rani: 20, fanatik: 24, kornet: 36, kent: 14, silsen: 30, sercin: 24 };

// Karaktere özel silah çizimleri — her biri sağ elin hizasında, walkPhase ile hafif sallanır.
// aimRaise (0..1): hedef yokken silah aşağıda, varken yukarıda. shootRecoil (0..1): atış geri tepmesi.
function drawCharWeapon(ctx, charKey, s, swing, aimRaise = 0, shootRecoil = 0) {
  const sway = swing * 0.06;
  // Omuz pivotu etrafında silahı çevir: aimRaise=0 → aşağı bakar, aimRaise=1 → yatay, recoil → geri tekme
  const lowerAngle = 0.85;
  const recoilKick = -0.35;
  const baseRot = lowerAngle * (1 - aimRaise) + recoilKick * shootRecoil;
  ctx.save();
  // Omuz noktası civarında dönüş (rough shoulder: 18, 2)
  ctx.translate(18 * s, 2 * s);
  ctx.rotate(baseRot);
  ctx.translate(-18 * s, -2 * s);
  // ChatGPT 3D silah resmi (W paftaları, gorsel.js): tutma yeri elde, namlu sağa; ateş anında namlu alevi.
  // _karKodla (gorsel.js) karakterKodKutusu ölçerken kod silahı çizilir: kutu silah resimleri yüklü olsa da değişmesin
  if (typeof silah3d === "function" && silah3d(charKey) && !_karKodla) {
    const uzunluk = SILAH3D_UZUNLUK[charKey] || 22;
    ctx.translate(26 * s, 8 * s);
    ctx.rotate(sway);
    silah3dCiz(ctx, charKey, s, uzunluk);
    namluAlevi(ctx, s, shootRecoil, uzunluk * s);
    ctx.restore();
    return;
  }
  switch (charKey) {
    case "kinkin": {
      // Enerji tabancası (gümüş gövde + camgöbeği çekirdek)
      ctx.translate(28 * s, 8 * s);
      ctx.rotate(sway);
      ctx.fillStyle = "#475569";
      ctx.fillRect(0, -3 * s, 14 * s, 7 * s);
      ctx.strokeStyle = "#0f172a"; ctx.lineWidth = 1 * s;
      ctx.strokeRect(0, -3 * s, 14 * s, 7 * s);
      ctx.fillStyle = "#1e3a8a";
      ctx.fillRect(12 * s, -2 * s, 7 * s, 5 * s);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(3 * s, 4 * s, 4 * s, 5 * s);
      // Enerji çekirdeği (parlayan halo)
      const glow = ctx.createRadialGradient(7 * s, 0, 0, 7 * s, 0, 4 * s);
      glow.addColorStop(0, "rgba(34, 211, 238, 0.95)");
      glow.addColorStop(1, "rgba(34, 211, 238, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(7 * s, 0, 4 * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#06b6d4";
      ctx.beginPath(); ctx.arc(7 * s, 0, 1.5 * s, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case "veryi": {
      // Devasa savaş çekici
      ctx.translate(26 * s, 6 * s);
      ctx.rotate(-0.35 + sway);
      // Sap (ahşap)
      ctx.fillStyle = "#7c2d12";
      ctx.fillRect(-2 * s, 0, 4 * s, 28 * s);
      ctx.strokeStyle = "#451a03"; ctx.lineWidth = 1 * s;
      ctx.strokeRect(-2 * s, 0, 4 * s, 28 * s);
      // Çekiç başlığı
      ctx.fillStyle = "#525252";
      ctx.fillRect(-13 * s, -10 * s, 26 * s, 14 * s);
      ctx.strokeStyle = "#1f1f1f"; ctx.lineWidth = 1.5 * s;
      ctx.strokeRect(-13 * s, -10 * s, 26 * s, 14 * s);
      // Metalik parıltı şeridi
      ctx.fillStyle = "#a3a3a3";
      ctx.fillRect(-11 * s, -8 * s, 22 * s, 2 * s);
      // Yan çiviler
      ctx.fillStyle = "#262626";
      ctx.beginPath(); ctx.arc(-9 * s, -3 * s, 1.5 * s, 0, Math.PI * 2);
      ctx.arc(9 * s, -3 * s, 1.5 * s, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case "mark": {
      // Tatar yayı (kompakt yay + yatay ok)
      ctx.translate(30 * s, 6 * s);
      ctx.rotate(sway);
      // Yay gövdesi (ahşap)
      ctx.strokeStyle = "#5a3825"; ctx.lineWidth = 3 * s;
      ctx.beginPath();
      ctx.moveTo(0, -10 * s);
      ctx.quadraticCurveTo(10 * s, 0, 0, 10 * s);
      ctx.stroke();
      // Yay teli
      ctx.strokeStyle = "#e5e7eb"; ctx.lineWidth = 1 * s;
      ctx.beginPath();
      ctx.moveTo(0, -10 * s);
      ctx.lineTo(0, 10 * s);
      ctx.stroke();
      // Ok
      ctx.fillStyle = "#92400e";
      ctx.fillRect(0, -1 * s, 16 * s, 2 * s);
      ctx.fillStyle = "#9ca3af";
      ctx.beginPath();
      ctx.moveTo(16 * s, -3 * s);
      ctx.lineTo(20 * s, 0);
      ctx.lineTo(16 * s, 3 * s);
      ctx.closePath(); ctx.fill();
      // Tüy
      ctx.fillStyle = "#dc2626";
      ctx.beginPath();
      ctx.moveTo(-2 * s, -2 * s);
      ctx.lineTo(2 * s, 0);
      ctx.lineTo(-2 * s, 2 * s);
      ctx.closePath(); ctx.fill();
      break;
    }
    case "ponko": {
      // Çift tabanca — biri sağda büyük, biri solda küçük
      // Sağ
      ctx.save();
      ctx.translate(28 * s, 8 * s);
      ctx.rotate(0.1 + sway);
      ctx.fillStyle = "#1f2937";
      ctx.fillRect(0, -3 * s, 14 * s, 6 * s);
      ctx.fillStyle = "#7c2d12";
      ctx.fillRect(2 * s, 3 * s, 5 * s, 7 * s); // kabza ahşap
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(13 * s, -1.5 * s, 5 * s, 3 * s); // namlu ucu
      ctx.fillStyle = "#fbbf24"; // tetik koruyucu
      ctx.beginPath(); ctx.arc(5 * s, 4 * s, 2 * s, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      // Sol
      ctx.save();
      ctx.translate(-28 * s, 8 * s);
      ctx.rotate(-0.15 - sway);
      ctx.fillStyle = "#1f2937";
      ctx.fillRect(-12 * s, -3 * s, 12 * s, 5 * s);
      ctx.fillStyle = "#7c2d12";
      ctx.fillRect(-7 * s, 2 * s, 4 * s, 6 * s);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(-16 * s, -1.5 * s, 4 * s, 3 * s);
      ctx.restore();
      break;
    }
    case "gul": {
      // Klasik yay (uzun, dik)
      ctx.translate(28 * s, 4 * s);
      ctx.rotate(sway);
      ctx.strokeStyle = "#7c2d12"; ctx.lineWidth = 3 * s;
      ctx.beginPath();
      ctx.moveTo(0, -22 * s);
      ctx.quadraticCurveTo(14 * s, 0, 0, 22 * s);
      ctx.stroke();
      // Tel
      ctx.strokeStyle = "#e5e7eb"; ctx.lineWidth = 1 * s;
      ctx.beginPath(); ctx.moveTo(0, -22 * s); ctx.lineTo(0, 22 * s); ctx.stroke();
      // Tutamak (orta sarı bant)
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(-2 * s, -3 * s, 4 * s, 8 * s);
      break;
    }
    case "rani": {
      // Y şeklinde sapan — taş yüklü
      ctx.translate(28 * s, 8 * s);
      ctx.rotate(sway);
      // Sap (Y'nin alt kolu)
      ctx.strokeStyle = "#7c2d12"; ctx.lineWidth = 3 * s;
      ctx.beginPath();
      ctx.moveTo(0, 10 * s);
      ctx.lineTo(0, 0);
      ctx.stroke();
      // Y'nin iki kolu
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-7 * s, -10 * s);
      ctx.moveTo(0, 0);
      ctx.lineTo(7 * s, -10 * s);
      ctx.stroke();
      // Lastik
      ctx.strokeStyle = "#451a03"; ctx.lineWidth = 1.5 * s;
      ctx.beginPath();
      ctx.moveTo(-7 * s, -10 * s);
      ctx.lineTo(0, -3 * s);
      ctx.lineTo(7 * s, -10 * s);
      ctx.stroke();
      // Taş
      ctx.fillStyle = "#fde68a";
      ctx.beginPath(); ctx.arc(0, -3 * s, 2 * s, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#a16207"; ctx.lineWidth = 0.5 * s;
      ctx.stroke();
      break;
    }
    case "fanatik": {
      // Nunchaku — iki kırmızı sopa zincirle bağlı
      ctx.translate(28 * s, 8 * s);
      ctx.rotate(0.4 + sway * 2);
      // Üst sopa (elinde)
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(-2 * s, -2 * s, 4 * s, 16 * s);
      ctx.strokeStyle = "#7f1d1d"; ctx.lineWidth = 1 * s;
      ctx.strokeRect(-2 * s, -2 * s, 4 * s, 16 * s);
      // Zincir (3 halka)
      ctx.fillStyle = "#9ca3af";
      ctx.beginPath();
      ctx.arc(0, 16 * s, 1.5 * s, 0, Math.PI * 2);
      ctx.arc(2 * s, 19 * s, 1.5 * s, 0, Math.PI * 2);
      ctx.arc(4 * s, 22 * s, 1.5 * s, 0, Math.PI * 2);
      ctx.fill();
      // Alt sopa (sallanan)
      ctx.save();
      ctx.translate(4 * s, 22 * s);
      ctx.rotate(0.6 + Math.sin(swing * 4) * 0.3);
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(-2 * s, 0, 4 * s, 16 * s);
      ctx.strokeStyle = "#7f1d1d"; ctx.lineWidth = 1 * s;
      ctx.strokeRect(-2 * s, 0, 4 * s, 16 * s);
      ctx.restore();
      break;
    }
    case "kornet": {
      // Büyücü asası — uzun ahşap, ucunda mor kristal
      ctx.translate(28 * s, -2 * s);
      ctx.rotate(-0.15 + sway);
      // Sap
      ctx.fillStyle = "#7c2d12";
      ctx.fillRect(-2 * s, 0, 4 * s, 32 * s);
      ctx.strokeStyle = "#451a03"; ctx.lineWidth = 1 * s;
      ctx.strokeRect(-2 * s, 0, 4 * s, 32 * s);
      // Sarmal sarı bant
      ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 1.2 * s;
      for (let i = 4; i < 30; i += 6) {
        ctx.beginPath();
        ctx.moveTo(-2 * s, i * s);
        ctx.lineTo(2 * s, (i + 3) * s);
        ctx.stroke();
      }
      // Çatal (3 uç)
      ctx.fillStyle = "#7c2d12";
      ctx.beginPath();
      ctx.moveTo(-6 * s, 0);
      ctx.lineTo(-3 * s, -8 * s);
      ctx.lineTo(0, 0);
      ctx.lineTo(3 * s, -8 * s);
      ctx.lineTo(6 * s, 0);
      ctx.closePath(); ctx.fill();
      // Kristal (mor parlayan)
      const cglow = ctx.createRadialGradient(0, -10 * s, 0, 0, -10 * s, 8 * s);
      cglow.addColorStop(0, "rgba(192, 132, 252, 0.95)");
      cglow.addColorStop(1, "rgba(192, 132, 252, 0)");
      ctx.fillStyle = cglow;
      ctx.beginPath(); ctx.arc(0, -10 * s, 8 * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#9d4edd";
      ctx.beginPath();
      ctx.moveTo(0, -16 * s);
      ctx.lineTo(4 * s, -10 * s);
      ctx.lineTo(0, -4 * s);
      ctx.lineTo(-4 * s, -10 * s);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#581c87"; ctx.lineWidth = 1 * s; ctx.stroke();
      break;
    }
    case "silsen": {
      // Çiçekli bayrak: sap, damalı bayrak, tepede papatya
      ctx.translate(28 * s, 4 * s);
      ctx.rotate(-0.2 + sway);
      ctx.fillStyle = "#7c2d12";
      ctx.fillRect(-1.5 * s, -18 * s, 3 * s, 30 * s);
      const kare = 4 * s;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 2; j++) {
          ctx.fillStyle = (i + j) % 2 === 0 ? "#111827" : "#fafafa";
          ctx.fillRect(1.5 * s + i * kare, -17 * s + j * kare, kare, kare);
        }
      }
      ctx.strokeStyle = "#111827"; ctx.lineWidth = 0.8 * s;
      ctx.strokeRect(1.5 * s, -17 * s, 3 * kare, 2 * kare);
      drawFlower(ctx, 0, -21 * s, 5 * s, performance.now() / 600);
      break;
    }
    case "sercin": {
      // Kocaman tüy (fırlatılacak tüylerden biri elinde)
      ctx.translate(28 * s, 6 * s);
      ctx.rotate(-0.5 + sway);
      drawFeather(ctx, 0, -6 * s, 22 * s);
      break;
    }
  }
  ctx.restore();
}

// Papatya: beyaz yapraklar, sarı göbek (Silsen'in bayrağı ve mermisi)
function drawFlower(ctx, x, y, r, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = "#fdf2f8";
  ctx.strokeStyle = "#db2777";
  ctx.lineWidth = Math.max(0.6, r * 0.12);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    ctx.beginPath();
    ctx.ellipse(Math.cos(a) * r * 0.75, Math.sin(a) * r * 0.75, r * 0.55, r * 0.3, a, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = "#facc15";
  ctx.beginPath(); ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#a16207";
  ctx.stroke();
  ctx.restore();
}

// Tüy: ucu sağa bakan, ortası çizgili (Serçin'in silahı ve mermisi)
function drawFeather(ctx, x, y, len) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#fef3c7";
  ctx.strokeStyle = "#92400e";
  ctx.lineWidth = Math.max(0.6, len * 0.05);
  ctx.beginPath();
  ctx.moveTo(-len / 2, 0);
  ctx.quadraticCurveTo(0, -len * 0.32, len / 2, 0);
  ctx.quadraticCurveTo(0, len * 0.32, -len / 2, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#b45309";
  ctx.beginPath();
  ctx.moveTo(len * 0.1, -len * 0.1);
  ctx.quadraticCurveTo(len * 0.3, -len * 0.08, len / 2, 0);
  ctx.quadraticCurveTo(len * 0.3, len * 0.08, len * 0.1, len * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-len * 0.6, 0);
  ctx.lineTo(len / 2, 0);
  ctx.stroke();
  ctx.restore();
}

// Envanter silahları: sapı aşağıda, namlusu sağa bakan "L" biçimi (çizimlerdeki gibi). Birim: s.
// Silahların kod çizimindeki kutusu (s birimi; x, y, w, h): resim bu kutuya sığdırılır
const SILAH_KUTU = { baloncuk: [-2, -6, 21, 15], lazer: [-2, -5, 25, 14], yesil: [-1, -5, 16, 13], pompali: [-4, -6, 28, 15], bazuka: [-6, -8, 30, 18] };

// Dükkân silahlarının 3D resim uzunluğu (s birimi; W3 paftası, gorsel.js)
const SILAH3D_DUKKAN = { baloncuk: 21, lazer: 25, yesil: 16, pompali: 28, bazuka: 30 };

function drawGunShape(ctx, gunKey, s) {
  // ChatGPT 3D silah resmi (W3 paftası, gorsel.js): tutma yeri (0, 0)'da, namlu sağa bakar
  if (typeof silah3d === "function" && silah3d(gunKey)) { silah3dCiz(ctx, gunKey, s, SILAH3D_DUKKAN[gunKey] || 22); return; }
  const kutuR = SILAH_KUTU[gunKey];
  if (kutuR && typeof gorselKutuya === "function" && gorselKutuya(ctx, `silah-${gunKey}`, kutuR[0] * s, kutuR[1] * s, kutuR[2] * s, kutuR[3] * s)) return;
  const kutu = (renk, x, y, w, h, kenar = "#0f172a") => {
    ctx.fillStyle = renk;
    ctx.fillRect(x * s, y * s, w * s, h * s);
    ctx.strokeStyle = kenar; ctx.lineWidth = 1 * s;
    ctx.strokeRect(x * s, y * s, w * s, h * s);
  };
  switch (gunKey) {
    case "baloncuk": // mavi, tıknaz
      kutu("#1e3a8a", 0, 0, 6, 9);
      kutu("#2563eb", -2, -6, 18, 8);
      kutu("#93c5fd", 16, -5, 3, 6);
      ctx.fillStyle = "#bfdbfe"; ctx.fillRect(1 * s, -4 * s, 10 * s, 1.5 * s);
      break;
    case "lazer": // kırmızı, ince uzun
      kutu("#7f1d1d", 0, 0, 5, 9);
      kutu("#dc2626", -2, -5, 22, 5);
      ctx.fillStyle = "#fecaca"; ctx.fillRect(20 * s, -4 * s, 3 * s, 3 * s);
      break;
    case "yesil": // küçük yeşil, siyah kabza
      kutu("#111827", 0, 0, 6, 8);
      kutu("#16a34a", -1, -5, 13, 6);
      kutu("#4ade80", 12, -4, 3, 4);
      break;
    case "pompali": // açık mavi gövde, uzun turuncu namlu
      kutu("#0c4a6e", 0, 1, 6, 8);
      kutu("#7dd3fc", -4, -6, 14, 9);
      kutu("#ea580c", 8, -5, 16, 5);
      break;
    case "bazuka": // siyah-beyaz çizgili kalın boru
      kutu("#111827", 2, 2, 6, 8);
      kutu("#111827", -6, -8, 30, 10);
      ctx.fillStyle = "#fafafa";
      for (let i = 0; i < 4; i++) ctx.fillRect((-3 + i * 7) * s, -8 * s, 3 * s, 10 * s);
      ctx.strokeStyle = "#0f172a"; ctx.lineWidth = 1 * s;
      ctx.strokeRect(-6 * s, -8 * s, 30 * s, 10 * s);
      break;
  }
}

// Takılı envanter silahı — drawCharWeapon ile aynı omuz pivotu ve nişan/geri tepme hareketi
function drawGunInHand(ctx, gunKey, s, swing, aimRaise = 0, shootRecoil = 0) {
  const baseRot = 0.85 * (1 - aimRaise) - 0.35 * shootRecoil;
  ctx.save();
  ctx.translate(18 * s, 2 * s);
  ctx.rotate(baseRot);
  ctx.translate(-18 * s, -2 * s);
  ctx.translate(26 * s, 8 * s);
  ctx.rotate(swing * 0.06);
  drawGunShape(ctx, gunKey, s * 0.9);
  // 3D dükkân silahının ateş alevi (W3 paftası, gorsel.js): namlu ucunda
  if (typeof silah3d === "function" && silah3d(gunKey)) namluAlevi(ctx, s * 0.9, shootRecoil, (SILAH3D_DUKKAN[gunKey] || 22) * s * 0.9);
  ctx.restore();
}

function drawHeart(ctx, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, r * 0.4);
  ctx.bezierCurveTo(r, -r * 0.5, r * 1.1, r * 0.3, 0, r);
  ctx.bezierCurveTo(-r * 1.1, r * 0.3, -r, -r * 0.5, 0, r * 0.4);
  ctx.fill();
  ctx.restore();
}

function drawGhost(ctx, g) {
  const size = g.size, hp = g.hp, maxHp = g.maxHp;
  ctx.save();
  ctx.translate(g.x, g.y);
  // Yuvadan belirme (KAY1): 0.6 sn içinde büyüyüp saydamdan tam görünür
  if (g.cikis > 0) {
    const k = Math.max(0, Math.min(1, 1 - g.cikis / 0.6));
    ctx.globalAlpha *= k;
    ctx.translate(0, (1 - k) * 16);
    const sc = 0.35 + 0.65 * k;
    ctx.scale(sc, sc);
  }
  const s = size / 40;
  // Kod animasyonu (anim.js): süzülme, doğuş, vurulma, göz kırpma; yalnız görüntü
  const animSimdi = performance.now();
  const an = typeof hayaletAnim === "function" ? hayaletAnim(g, animSimdi) : null;
  if (an && an.inis) {
    // Boss iniş dalgası: ChatGPT kareleri (N05) hazırsa onlar, değilse kod halkası
    if (typeof animHazir === "function" && animHazir("boss-inis"))
      animEfektEkle("kare", g.x, g.y + 20 * s, { ad: "boss-inis", sure: 0.45, boyut: 2.6 * size });
    else animEfektEkle("dalga", g.x, g.y + 22 * s, { renk: "248, 113, 113", olcek: s * 0.9 });
  }
  // Dünya Turu bossu ülkenin geleneksel kıyafetini giyer (kostumler.js); kayıt bozuksa bugünkü taçlı kırmızı boss
  const turUlke = g.isBoss && game.dunyaTuru ? turUlkesi() : null;
  const kostum = turUlke && kostumGecerliMi(turUlke.kostum) ? turUlke.kostum : null;
  const kostumZamani = performance.now() / 1000;

  // Boss için kırmızı aura
  if (g.isBoss) {
    const t = performance.now() / 300;
    const auraR = size * 0.95 + Math.sin(t) * 4;
    if (typeof gorselKutuya === "function" && typeof gorsel === "function" && gorsel("tehlike-halka")) {
      ctx.save();
      ctx.globalAlpha = 0.75 + 0.2 * Math.sin(t);
      gorselKutuya(ctx, "tehlike-halka", -auraR, -auraR, 2 * auraR, 2 * auraR);
      ctx.restore();
    } else {
      const auraGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, auraR);
      auraGrad.addColorStop(0, "rgba(255, 70, 70, 0.45)");
      auraGrad.addColorStop(1, "rgba(255, 70, 70, 0)");
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(0, 0, auraR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ANM1: ateş eden hayaletin çevresinde nabız gibi atan mor ışık (atışa hazır olduğunu sezdirir)
  if (g.isShooter && !g.isBoss && typeof anmParlama === "function" && !animAzHareket()) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    anmParlama(ctx, 0, -4 * s, size * 0.9, "192,132,252", 0.28 + 0.12 * Math.sin(animSimdi / 260 + (g.x || 0) * 0.05));
    ctx.restore();
  }
  // Gölge (hayaletler havada durur: temas gölgesi yok; sol üst ışık 2 px sağa, 1 px aşağı)
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.ellipse(2, 22 * s + 1, 18 * s, 5 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  if (an) {
    hayaletDogusGirdabi(ctx, g, s, animSimdi);
    ctx.translate(0, an.dy);
    if (an.alfa < 1) ctx.globalAlpha *= an.alfa;
    ctx.scale(an.sx, an.sy);
  }
  if (kasirgadaMi(g)) {
    // Kasırgaya kapılan hayalet havaya kalkar ve takla atarak döner
    ctx.translate(0, -7 * s);
    ctx.rotate(animSimdi / 1000 * 7 + (g.__faz || 0));
  }

  // Tonlama (HP'ye göre renk)
  let bodyColor;
  if (g.isBoss) bodyColor = kostum ? "#ede9fe" : "#dc2626";
  else if (maxHp >= 5) bodyColor = "#a78bfa";
  else if (maxHp >= 3) bodyColor = "#fda4af";
  else if (maxHp >= 2) bodyColor = "#fde68a";
  else bodyColor = "#ffffff";
  // Shooter (ateş eden) hayalet: kırmızımsı mor + parlayan kontur
  if (g.isShooter) bodyColor = "#c084fc";
  // Donmuş hayalet: buz mavisi tonu
  const isFrozen = (g.frozenUntil || 0) > performance.now();
  if (isFrozen) bodyColor = "#bae6fd";

  // ChatGPT görseli varsa (gorsel.js) gövde, yüz ve atış parıltısı resimden; yoksa kod çizimi. Dünya Turu bossu ülkesinin
  // kıyafetli resmiyle (U paftaları), o ülkenin resmi yoksa kıyafet kodla
  const resimli = typeof hayaletResmiCiz === "function" && hayaletResmiCiz(ctx, g, s, bodyColor, isFrozen, an, kostum ? turUlke.kod : null);
  if (!resimli) {
    // Vücut
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(0, -5 * s, 18 * s, Math.PI, 0);
    ctx.lineTo(18 * s, 18 * s);
    const wave = 4;
    for (let i = wave; i >= 0; i--) {
      const wx = -18 * s + (i / wave) * 36 * s;
      const wy = (i % 2 === 0 ? 14 : 22) * s + (an && an.dalga ? Math.sin(an.dalga + i * 1.3) * 1.6 * s : 0);
      ctx.lineTo(wx, wy);
    }
    ctx.lineTo(-18 * s, 18 * s);
    ctx.closePath();
    ctx.fill();
    if (an && an.beyaz > 0) {
      // Vurulma parlaması: gövde kısa bir an beyaza döner
      ctx.save();
      ctx.globalAlpha *= an.beyaz * 0.75;
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.restore();
    }
    if (kostum) bossKostumuCiz(ctx, s, kostum, kostumZamani, "govde");

    // Boss tacı (Dünya Turu'nda yerine ülkenin başlığı gelir)
    if (g.isBoss && !kostum) {
      ctx.save();
      if (an) ctx.translate(0, an.tacDy * s); // taç hafifçe sallanır
      ctx.fillStyle = "#ffd166";
      ctx.strokeStyle = "#a16207";
      ctx.lineWidth = 1.8 * s;
      ctx.beginPath();
      const cw = 20 * s;
      ctx.moveTo(-cw, -22 * s);
      ctx.lineTo(-cw + 2 * s, -34 * s);
      ctx.lineTo(-cw / 2, -28 * s);
      ctx.lineTo(0, -38 * s);
      ctx.lineTo(cw / 2, -28 * s);
      ctx.lineTo(cw - 2 * s, -34 * s);
      ctx.lineTo(cw, -22 * s);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Mücevher
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(0, -29 * s, 2.5 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Gözler (kırparken ince çizgi)
    ctx.fillStyle = g.isBoss ? "#fde047" : "#222";
    ctx.beginPath();
    if (an && an.kirp) {
      ctx.ellipse(-6 * s, -5 * s, 3.2 * s, 0.9 * s, 0, 0, Math.PI * 2);
      ctx.ellipse(6 * s, -5 * s, 3.2 * s, 0.9 * s, 0, 0, Math.PI * 2);
    } else {
      ctx.arc(-6 * s, -5 * s, 3 * s, 0, Math.PI * 2);
      ctx.arc(6 * s, -5 * s, 3 * s, 0, Math.PI * 2);
    }
    ctx.fill();

    // Ağız
    ctx.fillStyle = g.isBoss ? "#7f1d1d" : "#222";
    ctx.beginPath();
    ctx.ellipse(0, 3 * s, g.isBoss ? 5 * s : 3 * s, g.isBoss ? 5 * s : 4 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    if (an) hayaletSarjCiz(ctx, s, an.sarj, g.isBoss); // atıştan önce ağzın önünde büyüyen küre
    if (kostum) bossKostumuCiz(ctx, s, kostum, kostumZamani, "bas");
  }

  // HP barı
  if (hp < maxHp) {
    const w = (g.isBoss ? 60 : 32) * s;
    const hpY = g.isBoss ? -44 * s : -28 * s;
    const cerceve = typeof gorsel === "function" ? gorsel("ui-can-cubugu") : null;
    if (cerceve) {
      // GOR4: ChatGPT altın can çerçevesi (ui-can-cubugu, 256x64): iç boşluğu genişliğin %88'i, yüksekliğin %58'i;
      // dolgu bu boşluğa çizilir, çerçeve üstüne gelir (oranı korunur, esnetilmez)
      const wf = w / 0.88, hf = wf / 4, ic = hf * 0.58, cy = hpY + 2.5 * s;
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(-w / 2, cy - ic / 2, w, ic);
      ctx.fillStyle = g.isBoss ? "#ef4444" : "#06d6a0";
      ctx.fillRect(-w / 2, cy - ic / 2, w * (hp / maxHp), ic);
      ctx.drawImage(cerceve, -wf / 2, cy - hf * 0.48, wf, hf);
    } else {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(-w / 2, hpY, w, 5 * s);
      ctx.fillStyle = g.isBoss ? "#ef4444" : "#06d6a0";
      ctx.fillRect(-w / 2, hpY, w * (hp / maxHp), 5 * s);
    }
  }

  ctx.restore();
}

// Efsane kostüm aurası: avcının altında altın-mor halka + yükselen pırıltılar (2D, ucuz)
function efsaneAuraCiz(ctx, x, y, now = performance.now()) {
  const sn = now / 1000;
  if (typeof animHazir === "function" && animHazir("efsane-aura") && typeof animDongu === "function") {
    const kare = animDongu("efsane-aura", sn, 10);
    if (kare && typeof animCiz === "function") { animCiz(ctx, "efsane-aura", kare, x - 46, y - 24, 92, 56); return; }
  }
  ctx.save();
  ctx.translate(x, y + 14);
  const nabiz = 1 + Math.sin(sn * 3) * 0.08;
  ctx.scale(nabiz, nabiz);
  ctx.shadowColor = "#a855f7"; ctx.shadowBlur = 12;
  ctx.fillStyle = "rgba(168,85,247,0.16)";
  ctx.beginPath(); ctx.ellipse(0, 0, 32, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(251,191,36,0.9)"; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.ellipse(0, 0, 32, 12, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.shadowBlur = 0;
  for (let i = 0; i < 6; i++) {
    const a = sn * 1.6 + i * Math.PI / 3;
    const px = Math.cos(a) * 30;
    const py = -((sn * 22 + i * 11) % 30);
    ctx.globalAlpha = 0.55 + Math.sin(sn * 4 + i) * 0.3;
    ctx.fillStyle = i % 2 ? "#fde047" : "#c4b5fd";
    ctx.beginPath(); ctx.arc(px, py, 2.4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawProjectile(ctx, p) {
  if (typeof aeMermiIziCiz === "function") aeMermiIziCiz(ctx, p); // iz ve parlama (anim-ek.js)
  ctx.save();
  ctx.translate(p.x, p.y);
  const ang = Math.atan2(p.vy, p.vx);
  if (typeof aeMermiKareCiz === "function" && aeMermiKareCiz(ctx, p, ang)) { ctx.restore(); return; }
  if (!p.gun && p.charKey) {
    const yaricap = { kinkin: 8, veryi: 8, kornet: 9, mark: 13, gul: 13, kent: 9, ponko: 8, rani: 5.5, beti: 7, fanatik: 10, silsen: 7, sercin: 18 }[p.charKey];
    if (yaricap && typeof gorsel === "function" && gorsel("mermi-" + p.charKey) && typeof gorselKutuya === "function") {
      const boy = yaricap * 2.6;
      ctx.save();
      if (p.charKey === "kent" || p.charKey === "silsen") { if (typeof aeAzHareket !== "function" || !aeAzHareket()) ctx.rotate(performance.now() / 90); }
      else ctx.rotate(ang);
      gorselKutuya(ctx, "mermi-" + p.charKey, -boy / 2, -boy / 2, boy, boy);
      ctx.restore();
      ctx.restore(); return;
    }
  }
  if (p.gun === "yildiz") {
    const boy = p.buyukYildiz ? 22 : 12;
    if (typeof animHazir === "function" && animHazir("mermi-yildiz") && typeof animDongu === "function" && typeof animCiz === "function") {
      const kare = animDongu("mermi-yildiz", performance.now() / 1000, 10);
      if (kare) { animCiz(ctx, "mermi-yildiz", kare, -boy, -boy, boy * 2, boy * 2); ctx.restore(); return; }
    }
    ctx.save();
    ctx.shadowColor = "#fde047"; ctx.shadowBlur = 14;
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? boy * 0.45 : boy;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      ctx[i ? "lineTo" : "moveTo"](Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.restore(); return;
  }
  if (p.gun === "gokkusagi") {
    // GOR4: ChatGPT gökkuşağı ışını (yatay ışın; mermi yönüne döndürülür). Yoksa kod çizimi.
    if (typeof gorsel === "function" && gorsel("efekt-gokkusagi")) {
      ctx.save(); ctx.rotate(ang);
      resmiKutuyaCiz(ctx, gorsel("efekt-gokkusagi"), -22, -8, 44, 16);
      ctx.restore(); ctx.restore(); return;
    }
    const g = ctx.createLinearGradient(-12, 0, 12, 0);
    g.addColorStop(0, "#ef4444"); g.addColorStop(0.25, "#f59e0b"); g.addColorStop(0.5, "#22c55e");
    g.addColorStop(0.75, "#3b82f6"); g.addColorStop(1, "#a855f7");
    ctx.save(); ctx.rotate(ang);
    ctx.shadowColor = "#a855f7"; ctx.shadowBlur = 12;
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 0, 16, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.restore(); return;
  }
  if (p.gun === "ejder") {
    // GOR4: ChatGPT alev nefesi (dar ucu arkada, geniş ucu gidilen yönde); mermi yönüne döndürülür
    if (typeof gorsel === "function" && gorsel("efekt-ejder-alev")) {
      ctx.save(); ctx.rotate(ang);
      resmiKutuyaCiz(ctx, gorsel("efekt-ejder-alev"), -18, -10, 36, 20);
      ctx.restore(); ctx.restore(); return;
    }
    ctx.save(); ctx.rotate(ang);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 11);
    g.addColorStop(0, "#fef3c7"); g.addColorStop(0.45, "#fb923c"); g.addColorStop(1, "rgba(220,38,38,0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 0, 12, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.restore(); return;
  }
  if (p.gun) { drawGunProjectile(ctx, p.gun, ang); ctx.restore(); return; }
  switch (p.charKey) {
    case "kinkin": {
      // Camgöbeği enerji topu
      ctx.shadowColor = "#22d3ee"; ctx.shadowBlur = 14;
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 8);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.45, "#22d3ee");
      grad.addColorStop(1, "rgba(8, 145, 178, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case "veryi": {
      // Gri taş yumru — düzensiz şekil
      ctx.rotate(ang);
      ctx.fillStyle = "#525252";
      ctx.beginPath();
      ctx.moveTo(-7, -5); ctx.lineTo(6, -7); ctx.lineTo(8, 0);
      ctx.lineTo(6, 7);  ctx.lineTo(-7, 5); ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#1f1f1f"; ctx.lineWidth = 1; ctx.stroke();
      // Üst parıltı
      ctx.fillStyle = "#a3a3a3";
      ctx.fillRect(-3, -3, 4, 1.5);
      break;
    }
    case "kornet": {
      // Mor büyü topu + dönen sarı yıldız
      ctx.shadowColor = "#a855f7"; ctx.shadowBlur = 16;
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 9);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.4, "#c084fc");
      grad.addColorStop(1, "rgba(168, 85, 247, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fde047";
      ctx.rotate(performance.now() / 100);
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a1 = (i / 5) * Math.PI * 2;
        const a2 = a1 + Math.PI / 5;
        ctx.lineTo(Math.cos(a1) * 3.5, Math.sin(a1) * 3.5);
        ctx.lineTo(Math.cos(a2) * 1.6, Math.sin(a2) * 1.6);
      }
      ctx.closePath(); ctx.fill();
      break;
    }
    case "mark":
    case "gul": {
      // Tahta ok (Mark kırmızı tüy / Gül sarı tüy)
      ctx.rotate(ang);
      ctx.fillStyle = "#92400e";
      ctx.fillRect(-9, -1, 16, 2);
      ctx.fillStyle = "#9ca3af";
      ctx.beginPath();
      ctx.moveTo(7, -3.5); ctx.lineTo(12, 0); ctx.lineTo(7, 3.5); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = p.charKey === "mark" ? "#dc2626" : "#fbbf24";
      ctx.beginPath();
      ctx.moveTo(-9, -2.5); ctx.lineTo(-13, 0); ctx.lineTo(-9, 2.5); ctx.closePath();
      ctx.fill();
      break;
    }
    case "kent": {
      // Fırlatılan bıçak — hızla döner
      ctx.rotate(performance.now() / 50);
      ctx.fillStyle = "#cbd5e1";
      ctx.beginPath();
      ctx.moveTo(-1.5, -8); ctx.lineTo(1.5, -8); ctx.lineTo(2.5, 4); ctx.lineTo(-2.5, 4); ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#475569"; ctx.lineWidth = 0.5; ctx.stroke();
      // Sap (kahverengi)
      ctx.fillStyle = "#451a03";
      ctx.fillRect(-3, 4, 6, 5);
      // Metalik parıltı
      ctx.fillStyle = "#f1f5f9";
      ctx.fillRect(-0.5, -7, 1, 9);
      break;
    }
    case "ponko": {
      // Altın tabanca kurşunu (kapsül şekli)
      ctx.rotate(ang);
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.moveTo(-5, -3); ctx.lineTo(3, -3);
      ctx.quadraticCurveTo(8, 0, 3, 3);
      ctx.lineTo(-5, 3);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#92400e"; ctx.lineWidth = 0.8; ctx.stroke();
      // Kovan kuyruk (kırmızı)
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(-6, -2, 1.5, 4);
      ctx.shadowColor = "#fef3c7"; ctx.shadowBlur = 8;
      break;
    }
    case "rani": {
      // Yuvarlak taş — sapan mermisi
      ctx.fillStyle = "#a8a29e";
      ctx.beginPath(); ctx.arc(0, 0, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#44403c"; ctx.lineWidth = 1; ctx.stroke();
      // Çatlaklar
      ctx.strokeStyle = "#57534e"; ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(-2, -1); ctx.lineTo(0, 1); ctx.lineTo(2, -2);
      ctx.stroke();
      // Üst parıltı
      ctx.fillStyle = "#d6d3d1";
      ctx.beginPath(); ctx.arc(-1.5, -1.8, 1.2, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case "beti": {
      // Renkli şeker top (4 dilim, dönen)
      ctx.rotate(performance.now() / 200);
      const colors = ["#f43f5e", "#fbbf24", "#22d3ee", "#a855f7"];
      for (let i = 0; i < colors.length; i++) {
        ctx.fillStyle = colors[i];
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 7, (i / colors.length) * Math.PI * 2, ((i + 1) / colors.length) * Math.PI * 2);
        ctx.closePath(); ctx.fill();
      }
      ctx.strokeStyle = "#222"; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.stroke();
      // Beyaz parıltı
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(-2, -2, 1.5, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case "fanatik": {
      // Kırmızı-altın enerji yumruğu (yarım hilal)
      ctx.rotate(ang);
      ctx.shadowColor = "#dc2626"; ctx.shadowBlur = 12;
      const grad = ctx.createLinearGradient(-7, 0, 8, 0);
      grad.addColorStop(0, "rgba(220, 38, 38, 0)");
      grad.addColorStop(0.6, "#dc2626");
      grad.addColorStop(1, "#fde047");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-7, -5);
      ctx.quadraticCurveTo(0, 0, -7, 5);
      ctx.lineTo(7, 3);
      ctx.quadraticCurveTo(10, 0, 7, -3);
      ctx.closePath(); ctx.fill();
      // Sıcak çekirdek
      ctx.fillStyle = "#fde047";
      ctx.beginPath(); ctx.arc(4, 0, 2, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case "silsen": {
      // Dönen papatya top
      drawFlower(ctx, 0, 0, 7, performance.now() / 150);
      break;
    }
    case "sercin": {
      // Uçan tüy (gittiği yöne bakar)
      ctx.rotate(ang);
      drawFeather(ctx, 0, 0, 18);
      break;
    }
    case "bot": {
      // Bot'un camgöbeği kısa ışını
      ctx.rotate(ang);
      // GOR4: ChatGPT lazer ışını; uç başlıkları var, esnetilmez, bir kez çizilir (döşenmez)
      if (typeof gorsel === "function" && gorsel("efekt-bot-isin")) {
        resmiKutuyaCiz(ctx, gorsel("efekt-bot-isin"), -15, -4, 30, 8);
        break;
      }
      ctx.shadowColor = "#67e8f9"; ctx.shadowBlur = 10;
      ctx.fillStyle = "#a5f3fc";
      ctx.fillRect(-6, -2, 12, 4);
      break;
    }
    default: {
      // Fallback — eski sarı top
      ctx.fillStyle = "#ffd166";
      ctx.shadowColor = "#ffd166"; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

// Envanter silahlarının mermileri (çizimlerdeki gibi: baloncuk, lazer çizgisi, yeşil nokta, saçma, çizgili kapsül)
function drawGunProjectile(ctx, gunKey, ang) {
  switch (gunKey) {
    case "baloncuk": {
      const g = ctx.createRadialGradient(-2, -2, 0, 0, 0, 7);
      g.addColorStop(0, "#eff6ff");
      g.addColorStop(0.5, "#60a5fa");
      g.addColorStop(1, "rgba(37, 99, 235, 0.35)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#1d4ed8"; ctx.lineWidth = 1; ctx.stroke();
      break;
    }
    case "lazer":
      if (typeof gorsel === "function" && gorsel("mermi-lazer") && typeof gorselKutuya === "function") {
        ctx.save(); ctx.rotate(ang); gorselKutuya(ctx, "mermi-lazer", -10, -10, 20, 20); ctx.restore(); return;
      }
      ctx.rotate(ang);
      ctx.shadowColor = "#f87171"; ctx.shadowBlur = 12;
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(-10, -1.8, 20, 3.6);
      ctx.fillStyle = "#fee2e2";
      ctx.fillRect(-8, -0.6, 16, 1.2);
      break;
    case "yesil":
      if (typeof gorsel === "function" && gorsel("mermi-yesil") && typeof gorselKutuya === "function") {
        ctx.save(); ctx.rotate(ang); gorselKutuya(ctx, "mermi-yesil", -6.75, -6.75, 13.5, 13.5); ctx.restore(); return;
      }
      ctx.fillStyle = "#22c55e";
      ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#14532d"; ctx.lineWidth = 1; ctx.stroke();
      break;
    case "pompali":
      if (typeof gorsel === "function" && gorsel("mermi-pompali") && typeof gorselKutuya === "function") {
        ctx.save(); ctx.rotate(ang); gorselKutuya(ctx, "mermi-pompali", -6, -6, 12, 12); ctx.restore(); return;
      }
      ctx.fillStyle = "#1f2937";
      ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#9ca3af";
      ctx.beginPath(); ctx.arc(-1.2, -1.2, 1.2, 0, Math.PI * 2); ctx.fill();
      break;
    case "bazuka":
      ctx.rotate(ang);
      ctx.fillStyle = "#111827";
      ctx.beginPath();
      ctx.moveTo(-9, -5); ctx.lineTo(5, -5); ctx.quadraticCurveTo(12, 0, 5, 5); ctx.lineTo(-9, 5);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#fafafa";
      ctx.fillRect(-6, -5, 2.5, 10);
      ctx.fillRect(-1, -5, 2.5, 10);
      ctx.fillRect(4, -4.5, 2, 9);
      break;
  }
}

// ANM1: toplanabilire gölge, ışıltı, belirme pop'u ve kıvılcım (anim-ek.js); gövde drawPickupGovde'de (yalnız görüntü)
function drawPickup(ctx, p) {
  if (p.life !== undefined && p.life < 3 && Math.floor(p.life * 8) % 2 === 0) return;
  const cam = game.camera;
  if (cam && (p.x < cam.x - 40 || p.x > cam.x + game.W + 40 || p.y < cam.y - 40 || p.y > cam.y + game.H + 40)) return;
  if (typeof anmPickupAlti !== "function") { drawPickupGovde(ctx, p); return; }
  const now = performance.now();
  anmPickupAlti(ctx, p, now);
  const pop = anmAcilis(p, now);
  if (pop !== 1) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(pop, pop); ctx.translate(-p.x, -p.y);
    drawPickupGovde(ctx, p);
    ctx.restore();
  } else drawPickupGovde(ctx, p);
  anmPickupUstu(ctx, p, now);
}

function drawPickupGovde(ctx, p) {
  // Son 3 saniyede yanıp sön → bu kareyi atla
  if (p.life !== undefined && p.life < 3) {
    if (Math.floor(p.life * 8) % 2 === 0) return;
  }
  ctx.save();
  ctx.translate(p.x, p.y);
  const bob = typeof anmPickupBob === "function" ? anmPickupBob(p, performance.now()) : Math.sin(performance.now() / 200 + p.x) * 3;
  ctx.translate(0, bob);

  // Elmas/zümrüt üstünde dört köşeli parıltı (N07): ~1,6 sn'de bir, konuma göre faz; yalnız ekrandaki mücevherlerde
  if ((p.kind === "elmas" || p.kind === "zumrut") && typeof animHazir === "function" && animHazir("mucevher-parilti")) {
    const cam = game.camera, W = game.W, H = game.H;
    const gorunur = !cam || (p.x > cam.x - 20 && p.x < cam.x + W + 20 && p.y > cam.y - 20 && p.y < cam.y + H + 20);
    if (gorunur) {
      const faz = p.x * 0.017 + p.y * 0.011;
      const dongu = (((performance.now() / 1000 + faz) / 1.6) % 1 + 1) % 1;
      const az = typeof animAzHareket === "function" && animAzHareket();
      if (az || dongu < 0.25) { // 0,4 sn parıltı / 1,6 sn döngü; az harekette tek sabit kare
        const n = animHazir("mucevher-parilti");
        const kare = az ? 1 : 1 + Math.min(n - 1, Math.floor((dongu / 0.25) * n));
        animCiz(ctx, "mucevher-parilti", kare, -14, -14, 28, 28);
      }
    }
  }

  if (p.kind === "kalp") {
    // Pulsing kırmızı kalp — çok dikkat çekici
    const t = performance.now() / 180;
    const sc = 1 + Math.sin(t) * 0.18;
    ctx.scale(sc, sc);
    // Aura
    // ChatGPT kalp aurası varsa resim (nabız bugünkü gibi), yoksa kod ışıması
    const kalpAura = typeof gorsel === "function" ? gorsel("kalp-aura") : null;
    if (kalpAura) {
      ctx.save();
      ctx.globalAlpha = 0.55 + Math.sin(t) * 0.2;
      resmiKutuyaCiz(ctx, kalpAura, -24, -24, 48, 48);
      ctx.restore();
    } else {
      const aura = ctx.createRadialGradient(0, 0, 0, 0, 0, 22);
      aura.addColorStop(0, "rgba(252, 165, 165, 0.6)");
      aura.addColorStop(1, "rgba(252, 165, 165, 0)");
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();
    }
    // Kalp gövdesi
    if (!(typeof gorselKutuya === "function" && gorselKutuya(ctx, "kalp", -12, -13, 24, 22))) {
      ctx.shadowColor = "#fca5a5";
      ctx.shadowBlur = 14;
      ctx.fillStyle = "#ef4444";
      drawHeart(ctx, 0, -3, 11);
      // Parlama
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      drawHeart(ctx, -3, -5, 3);
    }
  } else if (p.kind === "guc") {
    // Dönen güç yıldızı + karakter ikonu
    const t = performance.now() / 300;
    ctx.save();
    if (typeof gorsel === "function" && gorsel("guc")) {
      ctx.rotate(Math.sin(t) * 0.35); // resim: sallanır (tam dönünce yıldızın şimşeği baş aşağı kalıyor)
      gorselKutuya(ctx, "guc", -17, -17, 34, 34);
    } else {
      ctx.rotate(t);
      ctx.fillStyle = "#fde047";
      ctx.shadowColor = "#fde047";
      ctx.shadowBlur = 18;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const a2 = a + Math.PI / 5;
        ctx.lineTo(Math.cos(a) * 14, Math.sin(a) * 14);
        ctx.lineTo(Math.cos(a2) * 6, Math.sin(a2) * 6);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    // İçinde aktif karakterin ikonu
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#7c2d12";
    ctx.font = "800 14px Nunito, \"Baloo Bhaijaan 2\", sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const ikon = (CHAR_POWERS[game.player && game.player.charKey] || CHAR_POWERS.kinkin).icon;
    ctx.fillText(ikon, 0, 1);
  } else if (p.kind === "para") {
    // Dönen para (anim.js): kenardan görünürken incelir, arka yüzde simge yok
    const don = typeof paraDonusu === "function" ? paraDonusu(performance.now(), p.x) : { sx: 1, on: true };
    ctx.scale(don.sx, 1);
    const paraKare = typeof animDongu === "function" ? animDongu("para", performance.now() / 1000 + p.x * 0.01, 10) : 0;
    if (paraKare) { // ChatGPT dönme kareleri (N06): ölçekle dönme yerine
      ctx.scale(1 / don.sx, 1);
      animGovdeCiz(ctx, "para", paraKare, -9.5, -9.5, 19, 19, false);
      ctx.restore();
      return;
    }
    if (typeof gorsel === "function" && gorsel("para")) {
      gorselKutuya(ctx, "para", -9.5, -9.5, 19, 19);
      if (!don.on) { ctx.fillStyle = "rgba(161, 98, 7, 0.35)"; ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill(); } // arka yüz
      ctx.restore();
      return;
    }
    ctx.fillStyle = don.on ? "#ffd166" : "#f2b84b";
    ctx.shadowColor = "#ffd166";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    if (don.on) {
      ctx.fillStyle = "#a16207";
      ctx.font = "800 11px Nunito, \"Baloo Bhaijaan 2\", sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("$", 0, 1);
    }
  } else if ((p.kind === "elmas" || p.kind === "zumrut") && typeof animDongu === "function" && animDongu(p.kind, 0, 1)) {
    // ChatGPT parıltı kareleri (N07)
    animGovdeCiz(ctx, p.kind, animDongu(p.kind, performance.now() / 1000 + p.x * 0.013, 5), -10, -12, 20, 24, false);
  } else if (p.kind === "elmas" && typeof gorselKutuya === "function" && gorselKutuya(ctx, "elmas", -10, -12, 20, 24)) {
    if (typeof mucevherParilti === "function") mucevherParilti(ctx, performance.now(), p.x);
  } else if (p.kind === "zumrut" && typeof gorselKutuya === "function" && gorselKutuya(ctx, "zumrut", -10, -12, 20, 24)) {
    if (typeof mucevherParilti === "function") mucevherParilti(ctx, performance.now(), p.x + 7);
  } else if (p.kind === "elmas") {
    ctx.fillStyle = "#60a5fa";
    ctx.shadowColor = "#60a5fa";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(8, 0);
    ctx.lineTo(0, 10);
    ctx.lineTo(-8, 0);
    ctx.closePath();
    ctx.fill();
    if (typeof mucevherParilti === "function") mucevherParilti(ctx, performance.now(), p.x);
  } else if (p.kind === "zumrut") {
    ctx.fillStyle = "#10b981";
    ctx.shadowColor = "#10b981";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(8, -3);
    ctx.lineTo(6, 10);
    ctx.lineTo(-6, 10);
    ctx.lineTo(-8, -3);
    ctx.closePath();
    ctx.fill();
    if (typeof mucevherParilti === "function") mucevherParilti(ctx, performance.now(), p.x + 7);
  }
  ctx.restore();
}

// ====== AKI2: canlı arayüz (hareket, sayaç, giriş) ======
// Az hareket tercihi her çağrıda yeniden okunur (sınama emülasyonu sayfa açıldıktan sonra da çalışsın).
function akiAzHareket() {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Liste ögelerine sırayla giriş: 220 ms, 35 ms arayla, en çok 12 öge (sonrası 12'nin gecikmesiyle).
function akiListeGiris(kap, secici) {
  if (!kap || akiAzHareket()) return;
  const ogeler = [...kap.querySelectorAll(secici)];
  ogeler.forEach((el, i) => {
    el.style.animationDelay = `${Math.min(i, 11) * 35}ms`;
    el.classList.add("aki-giris");
  });
}

// Para/elmas/zümrüt sayaçları eski değerden yenisine yumuşak geçer (350 ms).
const _akiSayac = new WeakMap();
function akiSayacYaz(el, deger) {
  if (!el) return;
  const hedef = Number(deger) || 0;
  const onceki = Number(String(el.textContent).replace(/[^\d.-]/g, "")) || 0;
  const eski = _akiSayac.get(el);
  if (eski) cancelAnimationFrame(eski.raf);
  if (akiAzHareket()) { el.textContent = hedef; _akiSayac.delete(el); return; }
  // Aynı hedefe ikinci çağrı (ekran yeniden tazelenince): beklemeden bitir; metin hemen doğru okunur.
  if (eski && eski.hedef === hedef) { el.textContent = hedef; _akiSayac.delete(el); return; }
  if (onceki === hedef || !el.isConnected) { el.textContent = hedef; return; }
  const fark = hedef - onceki, bas = performance.now();
  const kayit = { hedef, raf: 0 };
  _akiSayac.set(el, kayit);
  const adim = (an) => {
    const k = Math.min(1, (an - bas) / 350);
    const yum = 1 - Math.pow(1 - k, 3);
    el.textContent = Math.round(onceki + fark * yum);
    if (k < 1) kayit.raf = requestAnimationFrame(adim);
    else { el.textContent = hedef; _akiSayac.delete(el); }
  };
  kayit.raf = requestAnimationFrame(adim);
  if (hedef > onceki) { // artışta kısa bir "pop" (0.15 s)
    el.classList.remove("aki-sayi-pop");
    void el.offsetWidth;
    el.classList.add("aki-sayi-pop");
  }
}

// R49 menü-şeridi: dört sayaç hapının arkasına resim çerçeve (yüklenmemişse bugünkü görünüm kalır).
function menuSayacCercevesi() {
  const el = document.querySelector("#screen-menu .resources");
  if (!el) return;
  const im = typeof gorsel === "function" ? gorsel("menu-sayac") : null;
  if (!im) { el.classList.remove("aki-sayac-cerceve"); el.style.backgroundImage = ""; return; }
  el.classList.add("aki-sayac-cerceve");
  el.style.backgroundImage = `url("${im.src}")`;
}

// R49 konfeti: satın alma ve bölüm kutlamasında ortada bir kez patlar (resim yoksa sessizce atlanır).
function konfetiPatlat() {
  if (akiAzHareket()) return;
  const im = typeof gorsel === "function" ? gorsel("menu-konfeti") : null;
  if (!im) return;
  const kap = document.createElement("div");
  kap.className = "aki-konfeti";
  const resim = document.createElement("img");
  resim.src = im.src;
  resim.alt = "";
  kap.appendChild(resim);
  document.body.appendChild(kap);
  setTimeout(() => kap.remove(), 800);
}

// R49 parıltı: seçili karakter kartında ve sahip olunan efsane eşyalarda minik ışıltı.
function akiPariltiEkle(el) {
  if (!el) return;
  const im = typeof gorsel === "function" ? gorsel("menu-parilti") : null;
  if (!im || el.querySelector(".aki-parilti")) return;
  el.classList.add("aki-parilti-kap");
  const p = document.createElement("span");
  p.className = "aki-parilti";
  p.setAttribute("aria-hidden", "true");
  p.style.backgroundImage = `url("${im.src}")`;
  el.appendChild(p);
}

// ====== EKRAN YÖNETİMİ ======
function showScreen(id) {
  const yeni = document.getElementById(id);
  const az = akiAzHareket();
  document.querySelectorAll(".screen").forEach((s) => {
    if (s === yeni) return;
    const eskiAktif = s.classList.contains("active");
    s.classList.remove("active", "screen-giris");
    if (eskiAktif && !az) { // eski ekran 120 ms solarken altta kalır (yeni ekran üstte)
      s.classList.add("screen-cikis");
      clearTimeout(s._akiCikis);
      s._akiCikis = setTimeout(() => s.classList.remove("screen-cikis"), 130);
    } else s.classList.remove("screen-cikis");
  });
  if (!yeni) return;
  yeni.classList.remove("screen-cikis");
  yeni.classList.add("active"); // .active her zaman eşzamanlı (testler ve kod bunu bekler)
  if (!az) {
    yeni.classList.remove("screen-giris");
    void yeni.offsetWidth;
    yeni.classList.add("screen-giris");
    clearTimeout(yeni._akiGiris);
    yeni._akiGiris = setTimeout(() => yeni.classList.remove("screen-giris"), 200);
  }
  if (typeof menuDekorDurum === "function") menuDekorDurum(id === "screen-menu");
  eskiToastuKapat();
}

function goToMenu() {
  showScreen("screen-menu");
  if (typeof menuDekoruKur === "function") menuDekoruKur();
  refreshMenu();
  maybeShowUpdateNotes();
}

// ====== ONLINE / LOBİ ======
// 3.12.0'da yeniden yazıldı; veri düzeni ve Firebase kuralları aynı kaldı, eski sürümlerle aynı odada oynanır.
// - Oda tek bir "value" dinleyicisiyle değil hostUid / status / players / state için ayrı dinleyicilerle izlenir;
//   oda listesi dinleyicisi listeden çıkınca kapanır (eskiden oyun boyunca açık kalıyordu).
// - Hayalet, para ve düşman mermisi kimlikleri kalıcıdır: state'teki "i" alanı dizideki sıra değil kimliktir. Eski
//   istemciler bu sayıyı olaylarda (gi, pi) aynen geri gönderdiği için uyumludur. Eskiden bir hayalet ölünce
//   arkasındakilerin hepsi başka hayaletin yerine geçip ekranda yüzlerce piksel sıçrıyordu.
// - İstemci görüntüleri ARA_GECIKME_MS geriden ara değerler (akıcı hareket); host bir yazım bitmeden yenisini
//   göndermez (yavaş ağda kuyruk birikip gecikme büyümez); paralar yalnız değişince yazılır.
// - Herkes hayalet olunca tur biter (status "lobby"), kazançlar kaydedilir; ölen oyuncu sonraki bölümde doğar.
// - Host ayrılınca oda silinmez, en eski oyuncu host olur ve oyunu sürdürür.
// - Hayaletler yalnız host'u değil en yakın canlı oyuncuyu kovalar (update); istemcinin vurduğu hayalet ona sayılır.

function sunucuSimdi() { return Date.now() + (online.sunucuFarki || 0); }
function sunucuZamani() {
  return (window.firebase && firebase.database && firebase.database.ServerValue)
    ? firebase.database.ServerValue.TIMESTAMP : Date.now();
}

// Hayalet, para ve mermilerin kalıcı kimliği (host verir; state'te "i")
let _sonKimlik = 0;
function kimlik(o) {
  if (!o.id) o.id = ++_sonKimlik;
  return o.id;
}

// RTDB dizileri boşluklu dizi ya da nesne olarak gelebilir
function diziyeCevir(v) {
  if (!v) return [];
  return (Array.isArray(v) ? v : Object.values(v)).filter((x) => x && typeof x === "object");
}

let _sunucuSaatiDinleniyor = false;
function sunucuSaatiniDinle() {
  if (_sunucuSaatiDinleniyor) return;
  const db = fbDb(); if (!db) return;
  _sunucuSaatiDinleniyor = true;
  db.ref(".info/serverTimeOffset").on("value", (s) => { online.sunucuFarki = Number(s.val()) || 0; });
  // Bağlantı kopup gelince kopma temizliği yeniden kurulur; kayıt silindiyse yeniden yazılır
  db.ref(".info/connected").on("value", (s) => {
    if (s.val() === true && online.roomId && !online.ayriliyor) { setupOnDisconnect(); kaydimiTazele(true); }
  });
}

async function openOnline() {
  showScreen("screen-online");
  setOnlineStatus(t("Firebase'e bağlanıyor..."));
  online.uid = await onlineKimlik();
  if (online.uid) { setOnlineStatus(""); sunucuSaatiniDinle(); } else baglantiYok();
}
function leaveOnlineToOnline() {
  listeyiKapat();
  showScreen("screen-online");
  setOnlineStatus("");
}
function setOnlineStatus(msg) {
  const el = document.getElementById("online-status");
  if (el) el.textContent = msg || "";
}

function openCreateRoom() {
  showScreen("screen-create-room");
  const inp = document.getElementById("room-name-input");
  if (inp && !inp.value) inp.value = t("{ad}'in Odası", { ad: save.playerName || t("Avcı") });
  selectMaxPlayers(online.selectedMax || 6);
  odaKipiSec(online.selectedKip || "normal"); // dunya-turu.js
}
function selectMaxPlayers(n) {
  online.selectedMax = n;
  document.querySelectorAll(".max-btn").forEach((b) => {
    b.classList.toggle("active", parseInt(b.dataset.max, 10) === n);
  });
}

async function submitCreateRoom() {
  if (!save.playerName) { showToast(t("Önce avcı adını ayarla")); return; }
  const name = (document.getElementById("room-name-input").value || "").trim() || t("Oda");
  showToast(t("⏳ Oda kuruluyor..."));
  setOnlineStatus(t("Firebase'e bağlanıyor..."));
  online.uid = await onlineKimlik(); // giriş bu arada tamamlanmış olabilir
  if (!online.uid) { showToast(baglantiYok()); return; }
  sunucuSaatiniDinle();
  online.lastError = null;
  const uid = online.uid;
  const tur = online.selectedKip === "tur";
  if (tur) odaUlkesiSec(online.selectedUlke || turKaydi().acik); // açık ülkelere sınırlanır
  let roomId = null, room = null, turReddi = false;
  for (let deneme = 0; deneme < 3 && !roomId; deneme++) { // aynı kodlu oda varsa (çok nadir) yeni kodla dene
    const id = makeRoomId();
    room = {
      name,
      hostUid: uid,
      hostName: save.playerName,
      level: tur ? online.selectedUlke : 1,
      status: "lobby",
      maxPlayers: online.selectedMax || 6,
      createdAt: sunucuZamani(),
      lastSeen: sunucuZamani(),
      players: { [uid]: makePlayerEntry(true) },
    };
    if (tur) room.tur = true; // normal odada alan yok: 3.13.x kuralları da kabul eder
    room.yj = 1; // çevrimiçi yolculuk haritası (yeni kurallar)
    let yazildi = await rtdb.put(`rooms/${id}`, room);
    if (!yazildi && /permission/i.test(online.lastError || "")) {
      // Eski kurallar yj/sv alanlarını bilmiyor: onlarsız dene, eski haritayla sür
      delete room.yj;
      delete room.players[uid].sv;
      yazildi = await rtdb.put(`rooms/${id}`, room);
      if (yazildi && !online._yjUyariGosterildi) {
        online._yjUyariGosterildi = true;
        showToast(t("⚠ Çevrimiçi yolculuk için güncelleme bekleniyor"));
      }
    }
    if (yazildi) roomId = id;
    else if (tur && /permission/i.test(online.lastError || "")) { turReddi = true; break; } // kurallar tur alanını bilmiyor
    else if (room.maxPlayers > 5 && /permission/i.test(online.lastError || "")) {
      // Konsoldaki kurallar 3.12.2'den eskiyse (en çok 5 kişi) 6 kişilik oda reddedilir: oda 5 kişilik kurulur
      room.maxPlayers = 5;
      if (await rtdb.put(`rooms/${id}`, room)) roomId = id;
    }
  }
  if (turReddi) { // Dünya Turu odası kurulamaz; normal odaya dönülmez (oyuncu kipi kendisi değiştirir)
    setOnlineStatus(t("⚠ Dünya Turu odası şu an kurulamıyor"));
    showToast(t("⚠ Dünya Turu odası şu an kurulamıyor"));
    return;
  }
  if (!roomId) {
    const reason = online.lastError || t("bilinmeyen hata");
    setOnlineStatus(t("⚠ Oda kurulamadı: {neden}", { neden: reason }));
    showToast(`⚠ ${reason.slice(0, 60)}`);
    return;
  }
  setOnlineStatus("");
  online.roomId = roomId;
  online.isHost = true;
  enterLobby(room);
}

function makeRoomId() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // okunması kolay (I/L/O/0/1 yok)
  let id = "";
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function makePlayerEntry(ready, sv) {
  const kayit = {
    name: save.playerName || t("Avcı"),
    charKey: save.selectedChar || "kinkin",
    costumeIdx: (save.selectedCostume && save.selectedCostume[save.selectedChar]) || 0,
    ready: !!ready,
    joinedAt: sunucuZamani(),
    lastSeen: sunucuZamani(),
  };
  if (sv !== false) kayit.sv = 2; // yolculuk protokolü sürümü (eski kurallar reddederse sv'siz yeniden denenir)
  return kayit;
}

// --- Oda listesi: yalnız son dakikada lobisi açık odalar (oyundaki odaların lastSeen'i 0'dır) ---
let _listeYenile = null;
async function openRoomList() {
  showScreen("screen-room-list");
  odaListesiniDinle();
  clearInterval(_listeYenile);
  _listeYenile = setInterval(() => { // startAt sınırı ilerlesin diye ara ara yeniden sorulur
    if (document.getElementById("screen-room-list").classList.contains("active")) odaListesiniDinle();
    else listeyiKapat();
  }, 30000);
}

function odaListesiniDinle() {
  stopRoomListListener();
  const db = fbDb(); if (!db) return;
  sunucuSaatiniDinle();
  // Kurallarda rooms › .indexOn: lastSeen varsa süzme sunucuda yapılır; yoksa SDK listeyi indirip cihazda süzer
  online._roomListRef = db.ref("rooms").orderByChild("lastSeen").startAt(sunucuSimdi() - ROOM_LIST_TTL_MS).limitToLast(40);
  online._roomListListener = online._roomListRef.on("value", (snap) => {
    renderRoomList(snap.val());
  }, (err) => {
    console.error("rooms listener", err);
    setOnlineStatus(t("⚠ Bağlantı hatası: {hata}", { hata: err.message }));
  });
}

function stopRoomListListener() {
  if (online._roomListRef && online._roomListListener) {
    online._roomListRef.off("value", online._roomListListener);
  }
  online._roomListRef = null;
  online._roomListListener = null;
}

function listeyiKapat() {
  stopRoomListListener();
  clearInterval(_listeYenile);
  _listeYenile = null;
}

function refreshRoomList() {
  odaListesiniDinle();
}

function renderRoomList(all) {
  const list = document.getElementById("room-list");
  if (!list) return;
  const cutoff = sunucuSimdi() - ROOM_LIST_TTL_MS;
  const items = [];
  if (all) {
    Object.keys(all).forEach((id) => {
      const r = all[id];
      if (!r || !r.lastSeen || r.lastSeen < cutoff) return;
      if (r.status !== "lobby") return;
      const playerCount = r.players ? Object.keys(r.players).length : 0;
      if (!playerCount) return;
      items.push({ id, ...r, playerCount });
    });
  }
  items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  list.innerHTML = "";
  if (items.length === 0) {
    list.innerHTML = `<div class="room-list-empty">${t("Aktif oda yok. Sen kurar mısın?")}</div>`;
    return;
  }
  items.forEach((r) => {
    const card = document.createElement("div");
    card.className = "room-card";
    const full = r.playerCount >= r.maxPlayers;
    card.innerHTML = `
      <div class="room-info">
        <div class="room-name">${escapeHtml(r.name || t("Oda"))}</div>
        <div class="room-meta">👤 ${escapeHtml(r.hostName || "?")} · <b>${r.playerCount}/${r.maxPlayers}</b> ${t("oyuncu")}${turOdaUlkesi(r) ? ` · 🌍 <bdi>${escapeHtml(turOdaUlkesi(r).ad)}</bdi>` : ""}</div>
      </div>
      <button ${full ? "disabled" : ""}>${full ? t("DOLU") : t("KATIL")}</button>
    `;
    if (!full) {
      card.querySelector("button").onclick = () => joinRoom(r.id);
    }
    list.appendChild(card);
  });
}

// Lobideki 6 harfli kodla katılma (oyun başlamışsa da)
function kodlaKatil() {
  const inp = document.getElementById("room-code-input");
  const kod = ((inp && inp.value) || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (kod.length !== 6) { showToast(t("Oda kodu 6 haneli olmalı")); return; }
  joinRoom(kod);
}

async function joinRoom(roomId) {
  if (!save.playerName) { showToast(t("Önce avcı adını ayarla")); return; }
  setOnlineStatus("");
  const uid = online.uid = await onlineKimlik();
  if (!uid) { showToast(baglantiYok()); return; }
  sunucuSaatiniDinle();
  const room = await rtdb.get(`rooms/${roomId}`);
  if (!room || !room.hostUid) { showToast(t("Oda bulunamadı")); return; }
  const players = room.players || {};
  if (!players[uid] && Object.keys(players).length >= (room.maxPlayers || 5)) { showToast(t("Oda dolu")); return; }
  const giris = makePlayerEntry(room.status === "playing", !!room.yj); // yolculuk odasında sv yazılır
  if (players[uid] && players[uid].joinedAt) giris.joinedAt = players[uid].joinedAt;
  let katildi = await rtdb.put(`rooms/${roomId}/players/${uid}`, giris);
  if (!katildi && !room.yj && "sv" in giris && /permission/i.test(online.lastError || "")) {
    delete giris.sv; // eski kurallar sv alanını bilmiyor
    katildi = await rtdb.put(`rooms/${roomId}/players/${uid}`, giris);
  }
  if (!katildi) { showToast(t("Oda bulunamadı")); return; }
  if (room.status === "lobby") rtdb.patch(`rooms/${roomId}`, { lastSeen: sunucuZamani() });
  else showToast(t("🎮 Oyun sürüyor, hemen katılıyorsun!"));
  online.roomId = roomId;
  online.isHost = (room.hostUid === uid);
  online.ortadanKatildi = room.status === "playing";
  enterLobby(room);
}

function enterLobby(room) {
  listeyiKapat();
  online.ayriliyor = false;
  online.cachedRoom = {
    name: room.name, maxPlayers: room.maxPlayers || 5, hostUid: room.hostUid, hostName: room.hostName,
    status: room.status || "lobby", players: room.players || {}, tur: !!room.tur, level: room.level || 1,
    yj: room.yj ? 1 : 0,
  };
  online.alinanlar = new Set();
  online._aldBekleyen = new Map();
  online._aldYok = false;
  online._yjYok = false;
  online.vuranlar = new Set();
  online.vurduklarim = new Map();
  showScreen("screen-lobby");
  renderLobby();
  startRoomListener();
  setupOnDisconnect();
  odaNabziniBaslat();
  durumumuYaz(); // arkadaşlara 🎮 Odada (arkadaslar.js)
}

function lobidemi() {
  const el = document.getElementById("screen-lobby");
  return !!(el && el.classList.contains("active"));
}

// --- Oda dinleyicileri ---
function startRoomListener() {
  stopRoomListener();
  const yol = `rooms/${online.roomId}`;
  odaDinle(`${yol}/hostUid`, (v) => hostDegisti(v));
  odaDinle(`${yol}/status`, (v) => durumDegisti(v));
  odaDinle(`${yol}/players`, (v) => oyuncularDegisti(v || {}));
  if (online.cachedRoom && online.cachedRoom.tur) { // Dünya Turu odası: kalınan ülke (kurucu tur sonunda yazar)
    odaDinle(`${yol}/level`, (v) => {
      if (typeof v !== "number" || !online.cachedRoom) return;
      online.cachedRoom.level = v;
      if (lobidemi()) renderLobby();
    });
  }
}

function odaDinle(yol, fn) {
  const db = fbDb(); if (!db) return;
  const ref = db.ref(yol);
  const dinleyici = ref.on("value", (s) => {
    try { fn(s.val()); } catch (e) { console.error("oda", yol, e); }
  }, (err) => {
    console.error("room listener", yol, err);
    setOnlineStatus(t("⚠ Bağlantı: {hata}", { hata: err.message }));
  });
  online._odaDinleyicileri.push({ ref, fn: dinleyici });
}

function stopRoomListener() {
  for (const d of online._odaDinleyicileri) d.ref.off("value", d.fn);
  online._odaDinleyicileri = [];
  durumDinlemeyiBirak();
}

function hostDegisti(hostUid) {
  if (!online.roomId || online.ayriliyor) return;
  if (!hostUid) { odaKapandi(); return; } // hostUid zorunlu alan: yoksa oda silinmiştir
  const r = online.cachedRoom;
  const onceki = r.hostUid;
  r.hostUid = hostUid;
  const benim = hostUid === online.uid;
  online.isHost = benim;
  if (game.running && online.mode) {
    if (benim && online.mode !== "host") hostOl();
    else if (!benim && online.mode === "host") istemciOl();
  }
  if (onceki && onceki !== hostUid) {
    const p = r.players && r.players[hostUid];
    showToast(benim ? t("👑 Artık sen Host'sun!") : t("👑 Yeni host: {ad}", { ad: (p && p.name) || "?" }));
  }
  if (lobidemi()) renderLobby();
}

function durumDegisti(status) {
  if (!online.roomId || online.ayriliyor || !status) return;
  online.cachedRoom.status = status;
  if (status === "playing" && !game.running && !online.baslatiliyor) startMpGameClient();
  else if (status === "lobby" && game.running && online.mode) turSonu();
  if (lobidemi()) renderLobby();
}

function oyuncularDegisti(players) {
  if (!online.roomId || online.ayriliyor) return;
  const r = online.cachedRoom;
  const onceki = r.players || {};
  r.players = players;
  if (Object.keys(onceki).length) {
    for (const uid of Object.keys(players)) {
      if (!onceki[uid] && uid !== online.uid) showToast(t("👋 {ad} geldi", { ad: players[uid].name || "?" }));
    }
    for (const uid of Object.keys(onceki)) {
      if (!players[uid] && uid !== online.uid) showToast(t("👋 {ad} ayrıldı", { ad: onceki[uid].name || "?" }));
    }
  }
  // Kaydım silinmişse (bağlantı kopunca onDisconnect siler) yeniden yaz
  if (!players[online.uid]) kaydimiTazele(true);
  // Host odada değilse en eski oyuncu host olur
  if (r.hostUid && !players[r.hostUid] && Object.keys(players).length) maybeBecomeNewHost(players);
  uzakOyunculariGuncelle(players);
  if (lobidemi()) renderLobby();
  // Açıksa davet penceresi ("Bu odada", oda dolu) yalnız biri gelip gidince: oyunda her oyuncu saniyede 10 kez yazar,
  // her yazımda bütün listeyi yeniden kurmak kurucunun karesini düşürüyordu
  const uyeler = Object.keys(players);
  if (uyeler.length !== Object.keys(onceki).length || uyeler.some((uid) => !onceki[uid])) renderInviteModal();
}

let _tazeleZamani = 0;
function kaydimiTazele(zorla) {
  if (!online.roomId || online.ayriliyor || !online.uid) return;
  const r = online.cachedRoom;
  const benim = r && r.players && r.players[online.uid];
  if (benim && !zorla) return;
  const simdi = performance.now();
  if (simdi - _tazeleZamani < 2000) return;
  _tazeleZamani = simdi;
  const kayit = makePlayerEntry(benim ? !!benim.ready : (!!r && r.status === "playing"), !!(r && r.yj));
  if (benim && benim.joinedAt) kayit.joinedAt = benim.joinedAt;
  if (game.running && online.mode && game.player) Object.assign(kayit, oyuncuAnlik());
  _sonOyuncuKaydi = {}; // sonraki yazımda bütün alanlar yeniden gider
  _sonAv = -1;
  rtdb.patch(`rooms/${online.roomId}/players/${online.uid}`, kayit);
}

function setupOnDisconnect() {
  const db = fbDb(); if (!db || !online.roomId || !online.uid) return;
  // Kopunca yalnız kendi kaydım silinir; host da öyle — kalanlardan biri host olur
  db.ref(`rooms/${online.roomId}`).onDisconnect().cancel().catch(() => {});
  db.ref(`rooms/${online.roomId}/players/${online.uid}`).onDisconnect().cancel().catch(() => {});
  db.ref(`rooms/${online.roomId}/players/${online.uid}`).onDisconnect().remove()
    .catch((e) => console.error("onDisconnect", e));
}

// Host arka plana geçince oda donmasın: hostluğu en eski diğer oyuncuya bırak (ayrılma ile aynı biçimde)
function hostuDevret() {
  const r = online.cachedRoom;
  if (!r || !online.roomId || online.mode !== "host") return;
  const players = r.players || {};
  const adaylar = Object.keys(players).filter((u) => u !== online.uid);
  if (!adaylar.length) return;
  adaylar.sort((a, b) => {
    const ja = players[a].joinedAt || 0, jb = players[b].joinedAt || 0;
    if (ja !== jb) return ja - jb;
    return a < b ? -1 : 1;
  });
  const yeni = adaylar[0];
  rtdb.patch(`rooms/${online.roomId}`, { hostUid: yeni, hostName: (players[yeni] && players[yeni].name) || t("Avcı") });
}

// Mevcut host odada değilse deterministik olarak yeni host seç (herkes aynı kararı verir)
function maybeBecomeNewHost(players) {
  const r = online.cachedRoom;
  if (!players || !r || (r.hostUid && players[r.hostUid])) return;
  const uids = Object.keys(players).sort((a, b) => {
    const ja = players[a].joinedAt || 0, jb = players[b].joinedAt || 0;
    if (ja !== jb) return ja - jb;
    return a < b ? -1 : 1;
  });
  if (uids[0] === online.uid && r.hostUid !== online.uid) {
    rtdb.patch(`rooms/${online.roomId}`, { hostUid: online.uid, hostName: save.playerName || t("Avcı") });
  }
}

// Host lobideyken oda listede görünsün diye lastSeen'i yeniler
function odaNabziniBaslat() {
  odaNabziniDurdur();
  online._nabiz = setInterval(() => {
    const r = online.cachedRoom;
    if (online.roomId && online.isHost && r && r.status === "lobby") {
      rtdb.patch(`rooms/${online.roomId}`, { lastSeen: sunucuZamani() });
    }
  }, 15000);
}
function odaNabziniDurdur() {
  clearInterval(online._nabiz);
  online._nabiz = null;
}

// --- Lobi ---
const _simgeOnbellek = {};
function karakterSimgesi(charKey, costumeIdx) {
  const anahtar = `${charKey}:${costumeIdx || 0}`;
  if (_simgeOnbellek[anahtar]) return _simgeOnbellek[anahtar];
  const cv = document.createElement("canvas");
  cv.width = 80; cv.height = 90;
  drawCharacter(cv.getContext("2d"), charKey, costumeIdx || 0, 40, 60, 80);
  return (_simgeOnbellek[anahtar] = cv.toDataURL());
}

function renderLobby() {
  const room = online.cachedRoom;
  if (!room) return;
  document.getElementById("lobby-title").textContent = "🎮 " + (room.name || t("Lobi"));
  const players = room.players || {};
  const uids = Object.keys(players);
  const max = room.maxPlayers || 5;
  const host = players[room.hostUid];
  document.getElementById("lobby-subtitle").textContent =
    `${t("{a}/{b} oyuncu", { a: uids.length, b: max })} · ${online.isHost ? t("Sen Host'sun") : t("Host: {ad}", { ad: (host && host.name) || room.hostName || "?" })}`;
  const kodEl = document.getElementById("lobby-kod");
  if (kodEl) kodEl.textContent = online.roomId || "";
  const turEl = document.getElementById("lobby-tur"), turSatiri = odaTurSatiri(room);
  if (turEl) { turEl.textContent = turSatiri; turEl.style.display = turSatiri ? "" : "none"; }

  const list = document.getElementById("lobby-players");
  list.innerHTML = "";
  // Host önce, sonra katılma sırasına göre
  uids.sort((a, b) => {
    if (a === room.hostUid) return -1;
    if (b === room.hostUid) return 1;
    return (players[a].joinedAt || 0) - (players[b].joinedAt || 0);
  });
  uids.forEach((uid) => {
    const p = players[uid];
    if (!p) return;
    const row = document.createElement("div");
    row.className = "lobby-player";
    row.dataset.uid = uid;
    if (uid === room.hostUid) row.classList.add("is-host");
    if (uid === online.uid) row.classList.add("is-me");
    const charName = (CHARACTERS[p.charKey] || { name: "?" }).name;
    row.innerHTML = `
      <span class="lp-img" style="background-image:url(${karakterSimgesi(p.charKey, p.costumeIdx)})"></span>
      <span class="lp-name">${uid === room.hostUid ? "👑 " : ""}${escapeHtml(p.name || "?")}${uid === online.uid ? ` (${t("Sen")})` : ""}</span>
      <span class="lp-tag">${escapeHtml(charName)}</span>
      ${uid === online.uid ? "" : lobiArkadasDugmesi(uid, p.name)}
      <span class="lp-ready">${p.ready ? "✓" : "⏳"}</span>
    `;
    list.appendChild(row);
  });

  // Hazır düğmesi
  const me = players[online.uid];
  const readyBtn = document.getElementById("lobby-ready-btn");
  if (me) {
    readyBtn.classList.toggle("is-ready", !!me.ready);
    readyBtn.textContent = me.ready ? t("✓ HAZIRIM") : t("HAZIR OL");
  }
  // BAŞLAT yalnız host'ta ve herkes hazırsa
  const allReady = uids.length >= 2 && uids.every((u) => players[u] && players[u].ready);
  document.getElementById("lobby-start-btn").style.display = (online.isHost && allReady) ? "" : "none";
  document.getElementById("lobby-davet-btn").disabled = uids.length >= max; // oda doluyken davet yok
  const ipucu = document.getElementById("lobby-ipucu");
  if (ipucu) {
    ipucu.textContent = uids.length < 2
      ? (sosyalKullanilamaz() ? t("Arkadaşına oda kodunu söyle: Online Oyna › Oda Listesi › Kodla Katıl.") : t("Arkadaşını 📨 Davet et ile çağır ya da oda kodunu söyle."))
      : online.isHost ? (allReady ? "" : t("Herkes hazır olunca ▶ BAŞLAT çıkar."))
      : t("Host başlatınca oyun açılır.");
  }
}

function odaKodunuKopyala() {
  const kod = online.roomId;
  if (!kod) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(kod).then(() => showToast(t("📋 Kopyalandı: {kod}", { kod })), () => fallbackCopy(kod));
  } else {
    fallbackCopy(kod);
  }
}

async function toggleReady() {
  if (!online.roomId) return;
  const room = online.cachedRoom;
  const me = room && room.players && room.players[online.uid];
  await rtdb.patch(`rooms/${online.roomId}/players/${online.uid}`, { ready: !(me && me.ready), lastSeen: sunucuZamani() });
}

async function leaveRoom() {
  await odadanCik();
  showScreen("screen-online");
  setOnlineStatus(t("Odadan ayrıldın"));
}

// Odadan çık: host tek başınaysa oda silinir; başka oyuncu varsa yalnız kaydı silinir, en eski oyuncu host olur
async function odadanCik() {
  const roomId = online.roomId;
  if (!roomId) return;
  online.ayriliyor = true;
  if (game.running && online.mode) flushOnlineRewards();
  stopMpSync();
  stopRoomListener();
  odaNabziniDurdur();
  const uid = online.uid;
  const players = (online.cachedRoom && online.cachedRoom.players) || {};
  const tekBasina = Object.keys(players).every((u) => u === uid);
  const hostum = online.isHost;
  online.roomId = null;
  online.isHost = false;
  online.mode = null;
  online.remotePlayers = {};
  online.cachedRoom = null;
  const db = fbDb();
  if (db) db.ref(`rooms/${roomId}/players/${uid}`).onDisconnect().cancel().catch(() => {});
  if (hostum && tekBasina) await rtdb.remove(`rooms/${roomId}`);
  else await rtdb.remove(`rooms/${roomId}/players/${uid}`);
  online.ayriliyor = false;
  durumumuYaz(); // arkadaşlara yeniden 🟢
}

// Oda silindi (eski sürümlü host çıktı ya da oda kapandı): kazançlar kaydedilir
function odaKapandi() {
  if (game.running && online.mode) flushOnlineRewards();
  stopMpSync();
  stopRoomListener();
  odaNabziniDurdur();
  online.roomId = null;
  online.isHost = false;
  online.mode = null;
  online.remotePlayers = {};
  online.cachedRoom = null;
  hostBeklemeGostergesi(0);
  if (game.running) {
    game.running = false;
    const wb = document.getElementById("weapon-bar");
    if (wb) wb.innerHTML = "";
  }
  game.menude = false;
  document.getElementById("screen-pause").classList.remove("active");
  document.getElementById("screen-gameover").classList.remove("active");
  if (typeof turPerdeleriniKapat === "function") turPerdeleriniKapat();
  if (typeof turMuzigiSondur === "function") turMuzigiSondur();
  showToast(t("Oda kapandı"));
  showScreen("screen-online");
  durumumuYaz();
}

// --- Oyun başlatma ---
async function startMpGame() {
  if (!online.isHost || online.baslatiliyor || !online.roomId) return;
  online.baslatiliyor = true; // durum dinleyicisi oyunu ikinci kez açmasın
  try {
    await rtdb.put(`rooms/${online.roomId}/state`, null);
    await rtdb.put(`rooms/${online.roomId}/events`, null);
    // lastSeen 0: oyundaki oda listeye girmez (liste lastSeen'e göre sorulur)
    if (!await rtdb.patch(`rooms/${online.roomId}`, { status: "playing", lastSeen: 0 })) {
      showToast(t("⚠ Bağlantı: {hata}", { hata: online.lastError || t("bilinmeyen hata") }));
      return;
    }
    startMpGameClient();
  } finally {
    online.baslatiliyor = false;
  }
}

function startMpGameClient() {
  if (!online.roomId || (game.running && online.mode)) return; // zaten oyunda
  online.mode = online.isHost ? "host" : "client";
  online.remotePlayers = {};
  online.pendingEvents = [];
  online.alinanlar = new Set();
  online._aldBekleyen = new Map();
  online.vuranlar = new Set();
  online.vurduklarim = new Map();
  online.sonDurum = performance.now();
  game._alindi = [];
  document.getElementById("screen-gameover").classList.remove("active");
  showToast(online.isHost ? t("👑 Host olarak başlattın") : t("🌐 Bağlanıldı"));
  const turUlke = turOdaUlkesi(online.cachedRoom); // Dünya Turu odası: kalınan ülkeden
  online.turSonUlke = null;
  // Oyun sürerken katılan: ülkesini, müziğini (teaser'sız) ve tanıtımını kurucunun ilk durumu belirler (turDurumGeldi)
  startGame(turUlke ? { tur: true, ulke: turUlke.sira, ortadan: online.ortadanKatildi } : undefined);
  online.ortadanKatildi = false;
  uzakOyunculariGuncelle((online.cachedRoom && online.cachedRoom.players) || {});
  startMpSync();
}

function startMpSync() {
  stopMpSync();
  _sonOyuncuKaydi = {};
  _sonEk = {}; _ekBeklet = 0;
  _sonTamKayit = 0;
  _sonAv = -1;
  _sonPickupImza = "";
  online.pushTimer = setInterval(mpPush, MP_PUSH_MS);
  if (online.mode === "host") startEventsListener();
  else durumDinle();
}
function stopMpSync() {
  if (online.pushTimer) { clearInterval(online.pushTimer); online.pushTimer = null; }
  stopEventsListener();
  durumDinlemeyiBirak();
}

// Host: istemcilerden gelen olaylar (vuruş, para alma, cephane)
function startEventsListener() {
  stopEventsListener();
  const db = fbDb(); if (!db || !online.roomId) return;
  online._eventsRef = db.ref(`rooms/${online.roomId}/events`);
  online._eventsListener = online._eventsRef.on("child_added", (snap) => {
    const ev = snap.val();
    if (ev) applyHostEvent(ev);
    snap.ref.remove();
  });
}
function stopEventsListener() {
  if (online._eventsRef && online._eventsListener) {
    online._eventsRef.off("child_added", online._eventsListener);
  }
  online._eventsRef = null;
  online._eventsListener = null;
}

// İstemci: host'un yazdığı oyun durumu
function durumDinle() {
  durumDinlemeyiBirak();
  const db = fbDb(); if (!db || !online.roomId) return;
  const ref = db.ref(`rooms/${online.roomId}/state`);
  const fn = ref.on("value", (s) => {
    try { durumGeldi(s.val()); } catch (e) { console.error("state", e); }
  });
  online._durumDinleyici = { ref, fn };
  online.sonDurum = performance.now();
}
function durumDinlemeyiBirak() {
  const d = online._durumDinleyici;
  if (d) d.ref.off("value", d.fn);
  online._durumDinleyici = null;
}

// --- Senkron yazımı ---
async function mpPush() {
  if (!online.roomId || !game.player || !game.running || !online.mode) return;
  if (document.hidden) return; // arka plandayken yazılmaz; diğerleri "Host bekleniyor" görür
  if (!_mpPushInflight) {
    _mpPushInflight = true;
    kaydimiGonder().catch(() => {}).finally(() => { _mpPushInflight = false; });
  }
  if (online.mode === "host") {
    if (!_durumYolda) {
      _durumYolda = true;
      durumuGonder().catch((e) => console.error("state", e)).finally(() => { _durumYolda = false; });
    }
  } else if (online.pendingEvents.length) {
    olaylariGonder();
  }
}

function oyuncuAnlik() {
  const p = game.player;
  const simdi = performance.now();
  const say = (v) => (Number.isFinite(v) ? v : 0);
  return {
    x: Math.round(say(p.x)),
    y: Math.round(say(p.y)),
    facing: Math.round(say(p.facing) * 100) / 100,
    hp: say(p.hp),
    maxHp: say(p.maxHp) || 3,
    walk: Math.round(say(p.walkTimer) * 10) / 10,
    invuln: p.invuln > 0,
    invisible: ((p.invisibleUntil || 0) > simdi) ? 1 : 0,
    dead: p.dead ? 1 : 0,
  };
}

// Kendi kaydım: yalnız değişen alanlar (ad, karakter, kostüm odaya girerken yazıldı); 5 sn'de bir lastSeen
async function kaydimiGonder() {
  const anlik = oyuncuAnlik();
  const degisen = {};
  for (const k of Object.keys(anlik)) if (_sonOyuncuKaydi[k] !== anlik[k]) degisen[k] = anlik[k];
  const simdi = performance.now();
  if (simdi - _sonTamKayit > 5000) { degisen.lastSeen = sunucuZamani(); _sonTamKayit = simdi; }
  // Yakaladığım hayalet sayısı (tur sonu sıralaması): ayrı yazım — kural reddederse (eski kural) konum yazımı bozulmasın
  if (game.totalCaught !== _sonAv && simdi - _avZamani >= AV_ARALIK_MS) {
    _sonAv = game.totalCaught; _avZamani = simdi;
    rtdb.patch(`rooms/${online.roomId}/players/${online.uid}`, { av: _sonAv });
  }
  ekleriGonder();
  if (!Object.keys(degisen).length) return;
  Object.assign(_sonOyuncuKaydi, degisen);
  await rtdb.patch(`rooms/${online.roomId}/players/${online.uid}`, degisen);
}

// 3.15.0: pet (tür ve konum), çalıda saklanma ve timsahlarım ayrı yazımla — kural yayınlanmamış bir veritabanında
// reddedilirse konum yazımı bozulmasın; reddedilince 30 sn denenmez
let _sonEk = {}, _ekBeklet = 0, _ekYolda = false;
async function ekleriGonder() {
  const simdi = performance.now();
  if (_ekYolda || simdi < _ekBeklet || !online.roomId) return;
  const p = game.player, pet = game.pet, tm = timsahDizisi();
  const anlik = { pet: pet && !pet.baygin ? pet.tur : "", px: pet ? Math.round(pet.x) : 0, py: pet ? Math.round(pet.y) : 0, gz: p.gizli && !p.dead ? 1 : 0 };
  const degisen = {};
  for (const k of Object.keys(anlik)) if (_sonEk[k] !== anlik[k]) degisen[k] = anlik[k];
  if (_sonEk.tmImza !== tm.imza) degisen.tm = tm.metin;
  if (!Object.keys(degisen).length) return;
  _ekYolda = true;
  try {
    if (await rtdb.patch(`rooms/${online.roomId}/players/${online.uid}`, degisen)) {
      Object.assign(_sonEk, degisen);
      if ("tm" in degisen) _sonEk.tmImza = tm.imza;
    } else _ekBeklet = performance.now() + 30000;
  } finally { _ekYolda = false; }
}

// Host: hayaletler, düşman mermileri ve bölüm bilgisi her seferinde; paralar yalnız değişince
async function durumuGonder() {
  if (!online.roomId) return;
  const simdi = performance.now();
  const sayi = (v) => (Number.isFinite(v) ? Math.round(v * 100) / 100 : 0);
  const g = [];
  for (const h of game.ghosts) {
    if (!Number.isFinite(h.x) || !Number.isFinite(h.y)) continue;
    g.push({
      i: kimlik(h), x: Math.round(h.x), y: Math.round(h.y),
      hp: sayi(h.hp), maxHp: sayi(h.maxHp) || 1, size: sayi(h.size) || 40,
      isBoss: h.isBoss ? 1 : 0, isShooter: h.isShooter ? 1 : 0,
      frozen: ((h.frozenUntil || 0) > simdi) ? 1 : 0,
    });
  }
  const e = [];
  for (const p of game.enemyProjectiles) {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
    e.push({ i: kimlik(p), x: Math.round(p.x), y: Math.round(p.y), vx: Math.round(sayi(p.vx)), vy: Math.round(sayi(p.vy)), isBoss: p.isBoss ? 1 : 0 });
  }
  const govde = {
    g, e,
    lvl: game.dunyaTuru && game.turBitti ? ULKE_SAYISI + 1 : game.level, // tur bitti: 52 (istemciler turu tamamlar)
    bd: game.bossDefeated ? 1 : 0,
    bt: Math.round((game.bossSpawnTimer || 0) * 10) / 10,
    lt: game.levelTransitioning ? 1 : 0,
  };
  // Yolculuk: bölge durumu kurucuda (istemciler köprüleri ve etkin bölgeyi bundan alır)
  if (typeof yolculukAcik === "function" && yolculukAcik() && Array.isArray(game.kopruAcik)) {
    let kp = 0;
    for (let i = 0; i < game.kopruAcik.length; i++) if (game.kopruAcik[i]) kp |= (1 << i);
    govde.kp = kp;
    govde.bz = game.bolge || 1;
    govde.ab = game._arenaBossDurum || 0;
    govde.aw = Math.max(0, Math.round(game._arenaBekleme || 0));
  }
  const p = [];
  for (const q of game.pickups) {
    if (!Number.isFinite(q.x) || !Number.isFinite(q.y)) continue;
    const o = { i: kimlik(q), x: Math.round(q.x), y: Math.round(q.y), kind: q.kind };
    if (Number.isFinite(q.value)) o.value = q.value;
    p.push(o);
  }
  const imza = JSON.stringify(p);
  if (imza !== _sonPickupImza) govde.p = p;
  if (game._alindi && game._alindi.length && !online._aldYok) govde.ald = game._alindi;
  let oldu = await rtdb.patch(`rooms/${online.roomId}/state`, govde);
  if (!oldu && "kp" in govde && !online._yjYok) {
    // Kural yolculuk alanlarını bilmiyor: alansız yeniden dene; sonraki bölümde eski haritaya dön
    online._yjYok = true;
    delete govde.kp; delete govde.bz; delete govde.ab; delete govde.aw;
    oldu = await rtdb.patch(`rooms/${online.roomId}/state`, govde);
  }
  if (!oldu && govde.ald) {
    // Kural "ald" alanını henüz bilmiyor: alansız yeniden dene, bir daha gönderme (eski davranış)
    online._aldYok = true;
    delete govde.ald;
    oldu = await rtdb.patch(`rooms/${online.roomId}/state`, govde);
  }
  if (oldu && govde.p) _sonPickupImza = imza;
}

// İstemci: olaylar; aynı hayalete aynı aralıkta gelen vuruşlar tek olayda toplanır
function olaylariGonder() {
  const evs = online.pendingEvents.splice(0);
  const hasar = new Map();
  const yol = `rooms/${online.roomId}/events`;
  for (const ev of evs) {
    if (ev.type === "hit") {
      if (typeof ev.gi === "number") hasar.set(ev.gi, (hasar.get(ev.gi) || 0) + (ev.dmg || 1));
      continue;
    }
    if (Object.values(ev).some((v) => v === undefined || (typeof v === "number" && !Number.isFinite(v)))) continue;
    rtdb.post(yol, ev);
  }
  for (const [gi, dmg] of hasar) rtdb.post(yol, { type: "hit", gi, dmg: Math.round(dmg * 100) / 100, by: online.uid });
}

// --- İstemci: gelen durumu uygula ---
// Görüntü tamponu: o.x0,y0,t0 (o an ekrandaki yer) → o.x1,y1,t1 (yeni görüntü); ARA_GECIKME_MS geriden ara değerlenir
function goruntuEkle(o, x, y, simdi) {
  if (o.t1 === undefined || !Number.isFinite(o.x) || Math.hypot(x - o.x, y - o.y) > ISINLA_MESAFE) {
    o.x = o.x0 = o.x1 = x; o.y = o.y0 = o.y1 = y; o.t0 = simdi - ARA_GECIKME_MS; o.t1 = simdi;
    return;
  }
  o.x0 = o.x; o.y0 = o.y; o.t0 = simdi - ARA_GECIKME_MS;
  o.x1 = x; o.y1 = y; o.t1 = simdi;
}
function aradegerle(o, simdi) {
  if (o.t1 === undefined) return;
  const sure = Math.max(1, o.t1 - o.t0);
  let k = (simdi - ARA_GECIKME_MS - o.t0) / sure;
  if (k > 1) k = 1 + Math.min(k - 1, ILERI_KESTIRIM_MS / sure); // yeni görüntü gecikirse aynı hızla biraz ileri
  if (k < 0) k = 0;
  o.x = o.x0 + (o.x1 - o.x0) * k;
  o.y = o.y0 + (o.y1 - o.y0) * k;
}

function durumGeldi(st) {
  if (online.mode !== "client" || !game.running) return;
  const simdi = performance.now();
  online.sonDurum = simdi;
  if (!st) return;
  // Değerli toplama onayları: host yalnız ilk toplayanın kimliğini yazar
  const ald = st.ald ? (Array.isArray(st.ald) ? st.ald : Object.values(st.ald)) : [];
  for (const e of ald) {
    const d = Array.isArray(e) ? e : Object.values(e || {});
    const id = Number(d[0]);
    if (!online._aldBekleyen || !online._aldBekleyen.has(id)) continue;
    const b = online._aldBekleyen.get(id);
    online._aldBekleyen.delete(id);
    if (String(d[1]) === online.uid) collectPickup(b); // benim toplamam onaylandı
  }
  if (game.baslangicBolum == null && typeof st.lvl === "number") game.baslangicBolum = st.lvl; // ilk durum: katıldığı bölüm
  const turdaUygulandi = game.dunyaTuru && turDurumGeldi(st); // damga, tur sonu ve müzik (dunya-turu.js)
  if (!turdaUygulandi && typeof st.lvl === "number" && st.lvl !== game.level) clientApplyLevel(st.lvl);
  if (st.lt && !game.levelTransitioning && typeof gec1Basla === "function") gec1Basla(); // kurucu bölümü bitirdi: kutlama
  game.bossDefeated = !!st.bd;
  game.bossSpawnTimer = st.bt || 0;
  game.levelTransitioning = !!st.lt;

  // Yolculuk: kurucunun bölge durumu (köprüler bir kez açılır, etkin bölge sayacı bz'den)
  if (Number.isFinite(st.kp) && Array.isArray(game.kopruAcik) && typeof yolculukKopruAc === "function") {
    for (let i = 0; i < game.kopruAcik.length; i++) {
      if ((st.kp & (1 << i)) && !game.kopruAcik[i]) yolculukKopruAc(i);
    }
  }
  if (Number.isFinite(st.bz)) game.bolge = st.bz;
  // Arena: boss bekleme durumu ve geri sayım bildirimi (10/5/3 sn)
  if (Number.isFinite(st.ab)) game._arenaBossDurum = st.ab;
  if (Number.isFinite(st.aw)) game._arenaBekleme = st.aw;
  if (game._arenaBossDurum === 1 && typeof yolculukArenaToastKontrol === "function") yolculukArenaToastKontrol();

  // Hayaletler (kimliğe göre)
  const eski = new Map();
  for (const g of game.ghosts) eski.set(g._idx, g);
  const yeni = [];
  for (const s of diziyeCevir(st.g)) {
    let g = eski.get(s.i);
    if (g) eski.delete(s.i);
    else {
      g = { _idx: s.i, nextSound: simdi + Math.random() * 5000 };
      if (s.isBoss) { showToast(t("👑 BÖLÜM {n} BOSS!", { n: game.level })); audio.bigGhost(); }
    }
    g.hp = s.hp;
    g.maxHp = s.maxHp || 1;
    g.size = s.size || 40;
    g.isBoss = !!s.isBoss;
    g.isShooter = !!s.isShooter;
    g.r = g.isBoss ? 44 : (g.size <= 30 ? 14 : 22);
    g.frozenUntil = s.frozen ? simdi + 300 : 0;
    goruntuEkle(g, s.x, s.y, simdi);
    yeni.push(g);
  }
  for (const g of eski.values()) hayaletGitti(g);
  game.ghosts = yeni;

  // Düşman mermileri
  const eskiE = new Map();
  for (const p of game.enemyProjectiles) eskiE.set(p._idx, p);
  game.enemyProjectiles = diziyeCevir(st.e).filter((s) => !online.vuranlar.has(s.i)).map((s) => {
    const p = eskiE.get(s.i) || { _idx: s.i };
    p.vx = s.vx; p.vy = s.vy; p.isBoss = !!s.isBoss; p.life = 1;
    goruntuEkle(p, s.x, s.y, simdi);
    return p;
  });

  // Paralar ve güçler (aldıklarım tekrar görünmez)
  const eskiP = new Map();
  for (const p of game.pickups) eskiP.set(p._idx, p);
  game.pickups = diziyeCevir(st.p).filter((s) => !online.alinanlar.has(s.i)).map((s) => {
    let p = eskiP.get(s.i);
    if (!p) p = { _idx: s.i, x: s.x, y: s.y, life: s.kind === "guc" ? 18 : s.kind === "kalp" ? 4 : 12 };
    else if (!p.cekiliyor) { p.x = s.x; p.y = s.y; } // mıknatısıma kapılan parayı host geri çekmesin
    p.kind = s.kind; p.value = s.value;
    return p;
  });
}

// İstemci: hayalet durumdan düştü (öldü) — solma izi, parçacık; ben vurduysam yakaladıklarıma sayılır
function hayaletGitti(g) {
  const iz = { type: "ghostFade", x: g.x, y: g.y, size: g.size || 40, hp: 0, maxHp: g.maxHp || 1, isBoss: !!g.isBoss, life: 1, maxLife: 1 };
  kasirgaSavur(iz, g);
  game.effects.push(iz);
  spawnDeathParticles(g.x, g.y);
  if (typeof aeOlumPopEkle === "function") aeOlumPopEkle(g); // AKI1: istemcide de yerel ölüm popu
  if (g.isBoss) { showToast(t("👑 BOSS YENİLDİ! Kalan hayaletleri temizle!")); audio.bossDie(); }
  const vurus = online.vurduklarim.get(g._idx);
  online.vurduklarim.delete(g._idx);
  if (vurus && performance.now() - vurus < 3000) {
    // Güllü: benim vuruşumla ölen hayalet patlar; hasarı host uygular
    const cp = getActivePower();
    if (!g.isBoss && cp && cp.type === "gul") {
      online.pendingEvents.push({ type: "areaDmg", x: g.x, y: g.y, r: 90, dmg: Math.max(1, game.player.damage), by: online.uid });
    }
    game.totalCaught++;
    pgsHayalet(game.totalCaught);
    audio.kill();
  }
}

// --- Host olma / bırakma ---
// İstemcideki hayaletlerde yalnız görüntü var; host olunca yapay zekâ alanları (hız, atış, boss minyonları) kurulur
function hostOl() {
  online.mode = "host";
  durumDinlemeyiBirak();
  const lv = game.level, simdi = performance.now();
  for (const g of game.ghosts) {
    g.id = g._idx;
    if (Number.isFinite(g._idx)) _sonKimlik = Math.max(_sonKimlik, g._idx);
    if (!Number.isFinite(g.x) || !Number.isFinite(g.y)) { g.x = game.worldW / 2; g.y = game.worldH / 2; }
    if (!g.speed) {
      if (g.isBoss) {
        Object.assign(g, { r: 44, speed: 38 + lv * 5, canShoot: true, fireRate: Math.max(1500, 2600 - (lv - 1) * 80), nextShot: simdi + 1500, minionState: "waiting", minionTimer: 5 });
      } else if ((g.size || 40) <= 30) {
        Object.assign(g, { r: 14, speed: 90 + lv * 5, fromBoss: true });
      } else {
        g.r = 22;
        g.speed = (50 + lv * 6 + 10) * (g.isShooter ? 0.7 : 1);
        if (g.isShooter) Object.assign(g, { canShoot: true, fireRate: 2400, nextShot: simdi + 1500 });
      }
    }
  }
  for (const p of game.pickups) { p.id = p._idx; if (Number.isFinite(p._idx)) _sonKimlik = Math.max(_sonKimlik, p._idx); }
  for (const p of game.enemyProjectiles) { p.id = p._idx; p.life = 2; if (Number.isFinite(p._idx)) _sonKimlik = Math.max(_sonKimlik, p._idx); }
  game.spawnTimer = 0;
  game.levelTransitioning = false; // geçişin zamanlayıcısı eski host'taydı; bölüm temizse yeniden başlar
  game.gec1 = null; // istemciyken başlayan kutlama yeni host geçişini bastırmasın
  if (typeof gec1BannerKapat === "function") gec1BannerKapat();
  game._turGeciste = false; game._turJeton = null; // istemcinin Dünya Turu geçişi bırakılır; host akışı yeniden yürütür
  _sonPickupImza = "";
  startEventsListener();
}

function istemciOl() {
  online.mode = "client";
  stopEventsListener();
  game.gec1 = null; // host geçişi istemcide yarıda kalmasın
  if (typeof gec1BannerKapat === "function") gec1BannerKapat();
  for (const g of game.ghosts) g._idx = kimlik(g);
  for (const p of game.pickups) p._idx = kimlik(p);
  for (const p of game.enemyProjectiles) p._idx = kimlik(p);
  online.sonDurum = performance.now();
  durumDinle();
}

// --- Tur sonu: herkes hayalet olunca host turu bitirir ---
function herkesOlduMu() {
  if (!online.mode || !game.player || !game.player.dead) return false;
  return Object.values(online.remotePlayers).every((rp) => rp.dead);
}

async function turuBitir() {
  if (!online.roomId || online.mode !== "host") return;
  const yol = `rooms/${online.roomId}`, govde = { status: "lobby", lastSeen: sunucuZamani() };
  // Dünya Turu odası kalınan ülkeden sürer; tur tamamlandıysa baştan
  if (online.cachedRoom && online.cachedRoom.tur) govde.level = game.turBitti ? 1 : Math.min(game.level, ULKE_SAYISI);
  await rtdb.patch(yol, govde);
  rtdb.put(`${yol}/state`, null);
  rtdb.put(`${yol}/events`, null);
  turMuzigiSondur();
}

// --- Tur sıralaması: herkes kendi yakaladığı hayalete göre (oda kaydındaki av; benimki game.totalCaught) ---
// Eşitlikte sıra paylaşılır (1, 1, 3) ve kimliğe göre dizilir: her cihazda aynı liste. Sayısı gelmeyen oyuncu (eski
// sürüm) sıralamaya girmez, sonda "?" ile. Tur herkes hayalet olduktan 2,5 sn sonra biter: sayılar o an oturmuştur.
function turSiralamasi(oyuncular, benUid, benimAv, benimAd) {
  const satirlar = [];
  for (const [uid, p] of Object.entries(oyuncular || {})) {
    if (!p || uid === benUid) continue;
    satirlar.push({ uid, ad: String(p.name || "?"), av: Number.isFinite(p.av) ? p.av : null, ben: false });
  }
  const benim = oyuncular && oyuncular[benUid];
  satirlar.push({ uid: benUid, ad: String((benim && benim.name) || benimAd || "?"), av: benimAv, ben: true });
  const deger = (s) => (s.av === null ? -1 : s.av);
  satirlar.sort((a, c) => deger(c) - deger(a) || (a.uid < c.uid ? -1 : a.uid > c.uid ? 1 : 0));
  let onceki = null, sira = 0;
  satirlar.forEach((s, i) => {
    if (s.av === null) { s.sira = null; return; }
    if (s.av !== onceki) { sira = i + 1; onceki = s.av; }
    s.sira = sira;
  });
  return satirlar;
}
// Kupa: birinci (berabereyse hepsi), sayısı bilinen en az 2 oyuncu ve en az 1 hayalet (tek başına kupa toplanmasın)
function kupaSatiri(s, satirlar) {
  return !!s && s.sira === 1 && s.av >= 1 && satirlar.filter((x) => x.sira !== null).length >= 2;
}
function kupaKazandimMi(satirlar) {
  return !!satirlar && kupaSatiri(satirlar.find((s) => s.ben), satirlar);
}
function turSiraYazisi(satirlar, kupa) {
  const ben = (satirlar || []).find((s) => s.ben);
  if (!ben || ben.sira === null || satirlar.filter((s) => s.sira !== null).length < 2) return "";
  if (ben.sira === 1) return kupa ? t("🥇 Turu 1. bitirdin! 🏆 Kupa senin!") : ""; // hepsi 0 hayalet: yazı yok
  if (ben.sira === 2) return t("🥈 Turu 2. bitirdin!");
  if (ben.sira === 3) return t("🥉 Turu 3. bitirdin!");
  return t("🏅 Turu {n}. bitirdin!", { n: ben.sira });
}
// Sonuç ekranındaki sıralama listesi (satirlar null: tek kişilik oyun, liste gizli). Sayısı bilinen oyuncu 2'den azsa
// (kurallar yayınlanmamış ya da ötekiler eski sürüm) sıra yoktur: madalya gösterilmez, yalnız sayılar.
function turSiralamasiniGoster(satirlar) {
  const kutu = document.getElementById("tur-siralama");
  if (!satirlar) { kutu.style.display = "none"; return; }
  const siraVar = satirlar.filter((s) => s.sira !== null).length >= 2;
  const madalya = (sira) => (!siraVar || !sira ? "" : sira === 1 ? "🥇" : sira === 2 ? "🥈" : sira === 3 ? "🥉" : `${sira}.`);
  document.getElementById("tur-siralama-liste").innerHTML = satirlar.map((s) => `<li class="ts-satir${s.ben ? " ben" : ""}">` +
    `<span class="ts-sira">${madalya(s.sira)}</span><bdi class="ts-ad">${escapeHtml(s.ad)}</bdi>` +
    (s.ben ? `<span class="ts-sen">(${escapeHtml(t("Sen"))})</span>` : "") +
    `<span class="ts-av">${s.av === null ? "?" : `${s.av} 👻`}</span>` +
    (kupaSatiri(s, satirlar) ? `<span class="ts-kupa">🏆</span>` : "") + `</li>`).join("");
  document.getElementById("kupa-sayisi").textContent = t("🏆 Kupaların: {n}", { n: save.kupa || 0 });
  kutu.style.display = "";
}

// Herkeste (host dahil) status "lobby" olunca: ödüller, şampiyon listesi, sonuç ekranı; oda ve lobi sürer
function turSonu() {
  if (!game.running) return;
  const siralama = turSiralamasi((online.cachedRoom && online.cachedRoom.players) || {}, online.uid, game.totalCaught, save.playerName || t("Avcı"));
  stopMpSync();
  const hostum = online.isHost;
  online.mode = null;
  online.remotePlayers = {};
  hostBeklemeGostergesi(0);
  game.menude = false;
  document.getElementById("screen-pause").classList.remove("active");
  oyunSonu(false, true, false, siralama);
  if (online.roomId) {
    rtdb.patch(`rooms/${online.roomId}/players/${online.uid}`, { ready: hostum, dead: 0, hp: 3, maxHp: 3, lastSeen: sunucuZamani() });
  }
}

function lobiyeDon() {
  document.getElementById("screen-gameover").classList.remove("active");
  if (!online.roomId) { showScreen("screen-online"); return; }
  showScreen("screen-lobby");
  renderLobby();
}

// Host: istemciden gelen olayı uygula (gi/pi = kimlik)
function hayaletBul(id) {
  if (typeof id !== "number") return null;
  return game.ghosts.find((g) => g.id === id) || null;
}
function applyHostEvent(ev) {
  if (!ev || !ev.type) return;
  if (ev.type === "hit") {
    const g = hayaletBul(ev.gi);
    if (g) {
      g.hp -= (ev.dmg || 1);
      g.uzakVurdu = true; // ölürse host'un yakaladıklarına sayılmaz (vuran oyuncu kendine sayar)
      spawnHitParticles(g.x, g.y);
      // Vuruş sesini vuran oyuncunun cihazı çalar: kurucu da çalsaydı 6 kişilik odada saniyede ~25 kare dalga, olaylar
      // paketlerle geldiği için 2–3'ü aynı anda başlayıp cızırtı yapıyordu (3.14.1)
      if (g.hp <= 0) killGhost(g, game.ghosts.indexOf(g));
    }
  } else if (ev.type === "mermi") {
    // İstemci bir düşman mermisini vurdu ya da mermi ona çarptı: host'ta da biter
    const k = game.enemyProjectiles.findIndex((p) => p.id === ev.gi);
    if (k >= 0) game.enemyProjectiles.splice(k, 1);
  } else if (ev.type === "pickup") {
    const k = game.pickups.findIndex((p) => p.id === ev.pi);
    if (k >= 0) {
      const p = game.pickups[k];
      game.pickups.splice(k, 1);
      // Değerli toplama: yalnız ilk gelen olay onaylanır, istemci ödülü bu onayla alır
      if (p.kind === "elmas" || p.kind === "zumrut" || p.kind === "guc" || p.kind === "kalp") {
        game._alindi.push([ev.pi, String(ev.by || "")]);
        if (game._alindi.length > 20) game._alindi.splice(0, game._alindi.length - 20);
      }
    }
  } else if (ev.type === "stun") {
    // İstemcinin köpeği hayaleti sersemletti: host kendi peti gibi dondurur (süre kurallarda izinli "duration" alanında)
    const g = hayaletBul(ev.gi);
    if (g) g.frozenUntil = Math.max(g.frozenUntil || 0, performance.now() + Math.min(3000, ev.duration || 600));
  } else if (ev.type === "areaDmg") {
    // {x,y,r,dmg} — bomba
    const r2 = (ev.r || 100) * (ev.r || 100);
    for (let i = game.ghosts.length - 1; i >= 0; i--) {
      const g = game.ghosts[i];
      const dx = g.x - (ev.x || 0), dy = g.y - (ev.y || 0);
      if (dx * dx + dy * dy < r2) {
        g.hp -= (ev.dmg || 1);
        g.uzakVurdu = true;
        spawnHitParticles(g.x, g.y);
        if (g.hp <= 0) killGhost(g, i);
      }
    }
  } else if (ev.type === "freezeAll") {
    const until = performance.now() + (ev.duration || 5000);
    for (const g of game.ghosts) g.frozenUntil = until;
  } else if (ev.type === "rocketShot") {
    // İstemci roket attı — host hayata geçirir. Hedef host'ta ölmüşse en yakın hayalet (300 px içinde) seçilir.
    let hedef = hayaletBul(ev.gi);
    if (!hedef) {
      let enIyi = null, enIyiD2 = 300 * 300;
      for (const g of game.ghosts) {
        const dx = g.x - (ev.x || 0), dy = g.y - (ev.y || 0), d2 = dx * dx + dy * dy;
        if (d2 < enIyiD2) { enIyiD2 = d2; enIyi = g; }
      }
      hedef = enIyi;
    }
    if (hedef) {
      const dxr = hedef.x - (ev.x || 0), dyr = hedef.y - (ev.y || 0);
      const dist = Math.hypot(dxr, dyr) || 1;
      const sp = 720;
      game.effects.push({
        type: "rocket",
        x: ev.x, y: ev.y,
        vx: (dxr / dist) * sp,
        vy: (dyr / dist) * sp,
        target: hedef,
        damage: 25,
        life: dist / sp + 0.5,
        uzak: true,
      });
    } else {
      // Hedef yok: yalnız olay noktasındaki çarpma hasarı (yakında hayalet yoksa hiçbir şey olmaz)
      const sr = 110, sr2 = sr * sr;
      for (let i = game.ghosts.length - 1; i >= 0; i--) {
        const g = game.ghosts[i];
        const dx = g.x - (ev.x || 0), dy = g.y - (ev.y || 0);
        if (dx * dx + dy * dy < sr2) {
          g.hp -= 12;
          g.uzakVurdu = true;
          spawnHitParticles(g.x, g.y);
          if (g.hp <= 0) killGhost(g, i);
        }
      }
    }
  }
}

function clientApplyLevel(newLevel) {
  game.level = newLevel;
  game.levelTimer = 0;
  game.ghostsCaught = 0;
  // Engeller bölüme bağlı ve dünya merkezine göre kurulur: herkeste aynı harita
  buildWalls();
  buildWaters();
  buildHazards();
  // Yolculuk: yeni bölümde herkes (hayalet olanlar dahil) başlangıçtan başlar
  if (typeof yolculukAcik === "function" && yolculukAcik() && typeof yolculukBaslangic === "function" && game.player) {
    const b = yolculukBaslangic();
    game.player.x = b.x; game.player.y = b.y;
  }
  petKur(); // yanına alınan pet (pet.js): baygın pet yeni bölüme tam canla başlar
  havaKur(); // yarasalar ve fırtına bulutu (hava.js)
  ensurePlayerSafe();
  kameraAniKonumla();
  if (typeof zeminKatmaniKur === "function") zeminKatmaniKur();
  yenidenDog();
  showToast(bolumBildirimi());
  // Çevrimiçi istemci: kutlama gördüyse yeni bölümde başlık kartı (perde yok)
  if (game.gec1 && game.gec1.istemci) {
    const now = performance.now();
    game.gec1.asama = "kart"; game.gec1.wipeBas = now - 600; game.gec1.kartBas = now;
    game.gec1.n = game.level; game.gec1.baslik = t("Bölüm {n}", { n: game.level }); game.gec1.tema = getTheme().name;
  }
  if (typeof hikayeBolumBasladi === "function") hikayeBolumBasladi(); // hikâye: istemcide hatıra (sahne yok)
}

// Çevrimiçi oyunda hayalet olan oyuncu yeni bölümde doğar
function yenidenDog() {
  if (!game.player || !game.player.dead) return;
  game.player.dead = false;
  game.player.hp = game.player.maxHp;
  game.player.invuln = 2;
  turDirilTeklifi();
  showToast(t("💖 Yeniden doğdun!"));
  audio.heart();
}

// Oyun yarıda bırakılınca (odadan çıkma, oda kapanması) o ana kadarki kazançlar kaydedilir
function flushOnlineRewards() {
  if (game.runPara)   save.para   += game.runPara;
  if (game.runElmas)  save.elmas  += game.runElmas;
  if (game.runZumrut) save.zumrut += game.runZumrut;
  if (!game.dunyaTuru && game.baslangicBolum === 1 && game.level > save.highestLevel) save.highestLevel = game.level;
  game.runPara = 0; game.runElmas = 0; game.runZumrut = 0;
  persistSave();
}

// --- Oyun içi çevrimiçi yardımcılar ---
// İstemci: hayalete hasarı host'a bildirir; hayalet 3 sn içinde ölürse yakaladıklarıma sayılır
function uzaktanVur(g, dmg) {
  if (typeof g._idx !== "number") return;
  online.pendingEvents.push({ type: "hit", gi: g._idx, dmg, by: online.uid });
  online.vurduklarim.set(g._idx, performance.now());
}

// İstemci: düşman mermisi bana çarptı ya da onu vurdum; host'tan tekrar gelmesin, host'ta da bitsin
function mermiBitti(p) {
  if (typeof p._idx !== "number") return;
  online.vuranlar.add(p._idx);
  online.pendingEvents.push({ type: "mermi", gi: p._idx, by: online.uid });
}

// Uzaktaki oyuncuların kayıtları (ara değerleme tamponuyla)
function uzakOyunculariGuncelle(players) {
  const simdi = performance.now();
  const yeni = {};
  for (const [uid, np] of Object.entries(players || {})) {
    if (uid === online.uid || !np) continue;
    const rp = online.remotePlayers[uid] || {};
    rp.name = np.name;
    rp.charKey = np.charKey;
    rp.costumeIdx = np.costumeIdx || 0;
    rp.hp = typeof np.hp === "number" ? np.hp : 3;
    rp.maxHp = np.maxHp || 3;
    rp.dead = !!np.dead;
    rp.invisible = !!np.invisible;
    // 3.15.0: pet, çalıda saklanma ve timsahlar (pet.js, cali.js, timsah.js)
    rp.gizli = !!np.gz;
    rp.pet = typeof np.pet === "string" && PETLER[np.pet] ? np.pet : "";
    if (typeof np.px === "number" && typeof np.py === "number") { rp.petHx = np.px; rp.petHy = np.py; }
    if (typeof np.tm === "string" && np.tm !== rp.tmMetin) { rp.tmMetin = np.tm; rp.timsahlar = uzakTimsahlariAl(np.tm); }
    if (typeof np.facing === "number") rp.facing = np.facing;
    if (typeof np.x === "number" && typeof np.y === "number" && (np.x !== rp.sx || np.y !== rp.sy || np.walk !== rp.sw)) {
      rp.sx = np.x; rp.sy = np.y; rp.sw = np.walk;
      goruntuEkle(rp, np.x, np.y, simdi);
    }
    yeni[uid] = rp;
  }
  online.remotePlayers = yeni;
}

// Uzaktaki oyuncuların atışları yalnız görüntüdür (hasarı kendi cihazları host'a bildirir): en yakın hayalete
// karakterinin atış aralığıyla mermi uçar, silahı kalkar — arkadaşın savaştığı görülür
function uzaktakiAtislar(dt, simdi) {
  for (const rp of Object.values(online.remotePlayers)) {
    if (!rp || rp.dead || typeof rp.x !== "number") { if (rp) rp.aimRaise = 0; continue; }
    const c = CHARACTERS[rp.charKey] || CHARACTERS.kinkin;
    let hedef = null, en = c.baseRange * 1.25;
    for (const g of game.ghosts) {
      const d = Math.hypot(g.x - rp.x, g.y - rp.y);
      if (d < en) { en = d; hedef = g; }
    }
    rp.aimRaise = hedef ? Math.min(1, (rp.aimRaise || 0) + dt * 6) : Math.max(0, (rp.aimRaise || 0) - dt * 4);
    // 3D karelerin bakış yönü (yerel hesaplanır, ağa gitmez): hedef varsa hedefe bak; yoksa yürüme yönü,
    // yalnız belirgin yatay hareketle değişir (|cos| > 0.2), dururken son yön korunur
    if (hedef) rp.bakisSol = hedef.x < rp.x;
    else if (Math.abs(Math.cos(rp.facing || 0)) > 0.2) rp.bakisSol = Math.cos(rp.facing || 0) < 0;
    // 3D model dönüşü: hedefe, yoksa yürüme yönüne; veri yoksa bakisSol → ±π/2
    if (hedef) rp.aci3d = Math.atan2(hedef.x - rp.x, hedef.y - rp.y);
    else if ((rp.sw || 0) > 0 && typeof rp.facing === "number") rp.aci3d = Math.atan2(Math.cos(rp.facing), Math.sin(rp.facing));
    else if (typeof rp.aci3d !== "number") rp.aci3d = rp.bakisSol ? -Math.PI / 2 : Math.PI / 2;
    rp.recoil = Math.max(0, (rp.recoil || 0) - dt * 6);
    if (hedef && simdi - (rp.sonAtis || 0) >= c.baseFireDelay) {
      rp.sonAtis = simdi;
      rp.recoil = 1;
      const a = Math.atan2(hedef.y - rp.y, hedef.x - rp.x);
      game.projectiles.push({
        x: rp.x, y: rp.y, vx: Math.cos(a) * 480, vy: Math.sin(a) * 480,
        life: Math.min(1.5, en / 480 + 0.15), dmg: 0, charKey: rp.charKey, gorsel: true,
      });
    }
  }
}

// İstemci: host'tan bir süredir görüntü gelmiyorsa uyarı
let _beklemeAcik = false;
function hostBeklemeGostergesi(simdi) {
  const acik = online.mode === "client" && game.running && simdi - online.sonDurum > HOST_BEKLEME_MS;
  if (acik === _beklemeAcik) return;
  _beklemeAcik = acik;
  const el = document.getElementById("bekleme");
  if (el) el.classList.toggle("acik", acik);
}

// HUD'daki takım listesi: her oyuncunun adı ve canı (300 ms'de bir)
let _takimZamani = 0;
function takimCiz(simdi) {
  const el = document.getElementById("takim");
  if (!el) return;
  if (!online.mode) { if (el.innerHTML) el.innerHTML = ""; return; }
  if (simdi - _takimZamani < 300) return;
  _takimZamani = simdi;
  const hostUid = online.cachedRoom && online.cachedRoom.hostUid;
  const satir = (ad, hp, maxHp, olu, host) => {
    const can = olu ? "👻" : "❤️".repeat(Math.max(0, Math.min(hp, maxHp))) + "🖤".repeat(Math.max(0, maxHp - Math.max(0, hp)));
    return `<div class="takim-oyuncu${olu ? " olu" : ""}"><bdi>${host ? "👑 " : ""}${escapeHtml(String(ad || "?").slice(0, 10))}</bdi> <span>${can}</span></div>`;
  };
  let html = satir(save.playerName || t("Avcı"), game.player.hp, game.player.maxHp, game.player.dead, hostUid === online.uid);
  for (const [uid, rp] of Object.entries(online.remotePlayers)) html += satir(rp.name, rp.hp, rp.maxHp, rp.dead, uid === hostUid);
  el.innerHTML = html;
}

function maybeShowUpdateNotes() {
  let last;
  try { last = localStorage.getItem(VERSION_KEY); } catch (e) { return; }
  if (last === APP_VERSION) return;
  // Hiç oynamamış yeni kullanıcıya patch notes gösterme
  const hasSave = (() => { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } })();
  if (last === null && !hasSave) {
    try { localStorage.setItem(VERSION_KEY, APP_VERSION); } catch (e) {}
    return;
  }
  showUpdateModal(APP_VERSION, UPDATE_NOTES[APP_VERSION] || []);
}

function showUpdateModal(version, notes) {
  let modal = document.getElementById("screen-update");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "screen-update";
    modal.className = "screen modal";
    document.body.appendChild(modal);
  }
  const list = notes.length
    ? `<ul class="update-notes">${notes.map((n) => `<li>${n}</li>`).join("")}</ul>`
    : `<p>${t("Yeni sürüm yüklendi.")}</p>`;
  modal.innerHTML = `
    <div class="modal-content">
      <h2>${t("🎉 Güncelleme v{surum}", { surum: version })}</h2>
      ${list}
      <button class="btn btn-big" onclick="dismissUpdateModal()">${t("Tamam ▶")}</button>
    </div>
  `;
  modal.classList.add("active");
}

function dismissUpdateModal() {
  try { localStorage.setItem(VERSION_KEY, APP_VERSION); } catch (e) {}
  const modal = document.getElementById("screen-update");
  if (modal) modal.classList.remove("active");
}

function openCharacters() {
  showScreen("screen-characters");
  refreshCharacters();
}

function openShop() {
  showScreen("screen-shop");
  showShopTab("upgrades");
}

// ====== HESAP / İSİM ======
function welcomeContinue() {
  if (!save.playerName) openName(false);
  else goToMenu();
}

function openName(fromMenu) {
  showScreen("screen-name");
  const inp = document.getElementById("name-input");
  inp.value = save.playerName || "";
  inp.dataset.fromMenu = fromMenu ? "1" : "0";
  // İsim değişikliği maliyet ipucu (sadece zaten ismi varken)
  const hint = document.getElementById("name-cost-hint");
  const promptEl = document.getElementById("name-prompt");
  const zumLbl = document.getElementById("name-zumrut");
  if (save.playerName) {
    if (hint) hint.style.display = "";
    if (zumLbl) zumLbl.textContent = String(save.zumrut || 0);
    if (promptEl) promptEl.innerHTML = t("Yeni avcı adın ne olsun?");
  } else {
    if (hint) hint.style.display = "none";
    if (promptEl) promptEl.innerHTML = t("Avcımızın adı ne olsun?");
  }
  setTimeout(() => inp.focus(), 100);
}

function submitName() {
  const inp = document.getElementById("name-input");
  let name = (inp.value || "").trim();
  if (!name) { showToast(t("Bir isim yaz!")); return; }
  if (name.length > 14) name = name.slice(0, 14);
  const oldName = save.playerName || "";
  const isChange = oldName && oldName !== name;
  const NAME_CHANGE_COST = 50;
  if (isChange) {
    if ((save.zumrut || 0) < NAME_CHANGE_COST) {
      showToast(t("💚 {n} zümrüt gerekli (sende {var})", { n: NAME_CHANGE_COST, var: save.zumrut || 0 }));
      return;
    }
    save.zumrut -= NAME_CHANGE_COST;
  }
  save.playerName = name;
  persistSave();
  sosyalAdGuncelle(); // arkadaş kodundaki ve çevrimiçi durumdaki ad (arkadaslar.js)
  if (isChange) {
    showToast(t("✏️ İsim değişti: {ad} (−{n}💚)", { ad: name, n: NAME_CHANGE_COST }));
    renameInLeaderboard(oldName, name);
  } else {
    showToast(t("Hoş geldin, {ad}!", { ad: name }));
  }
  goToMenu();
}

async function renameInLeaderboard(oldName, newName) {
  // 1) Yerel şampiyon listesi
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      let changed = false;
      for (const e of list) {
        if (e && e.name === oldName) { e.name = newName; changed = true; }
      }
      if (changed) localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(list));
    }
  } catch (_) {}
  // 2) Online (Firestore): bu oyuncunun (uid) eski adlı skorlarının name alanını güncelle. Kural yalnız kendi
  //    uid'li skorun adını değiştirmeye izin verir; 3.10.2'den önceki uid'siz skorlar eski adla kalır.
  try {
    const oturum = await firestoreOturum();
    if (!oturum.uid) return;
    const query = {
      structuredQuery: {
        from: [{ collectionId: FIREBASE.collection }],
        where: {
          fieldFilter: {
            field: { fieldPath: "uid" },
            op: "EQUAL",
            value: { stringValue: oturum.uid },
          },
        },
        limit: 200,
      },
    };
    const res = await fetch(`${FIRESTORE_BASE}:runQuery?key=${FIREBASE.apiKey}`, {
      method: "POST",
      headers: oturum.headers,
      body: JSON.stringify(query),
    });
    if (!res.ok) return;
    const data = await res.json();
    const docs = (data || []).filter((d) => d.document && d.document.fields && d.document.fields.name
      && d.document.fields.name.stringValue === oldName);
    for (const d of docs) {
      const docUrl = `https://firestore.googleapis.com/v1/${d.document.name}?updateMask.fieldPaths=name&key=${FIREBASE.apiKey}`;
      try {
        await fetch(docUrl, {
          method: "PATCH",
          headers: oturum.headers,
          body: JSON.stringify({ fields: { name: { stringValue: newName } } }),
        });
      } catch (_) { /* tek tek hata yutulur */ }
    }
  } catch (_) { /* sessizce geç */ }
}

// ====== ŞAMPİYON LİSTESİ ======
function loadLeaderboard() {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) { return []; }
}

function saveLeaderboard(list) {
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(list));
}

function scoreFor(entry) {
  return entry.level * 1000 + entry.ghosts * 10 + entry.para;
}

function addLeaderboardEntry(entry) {
  const list = loadLeaderboard();
  // Aynı isim varsa onu güncelle (en son kayıt kalsın)
  const existingIdx = list.findIndex((e) => e.name === entry.name);
  if (existingIdx >= 0) list[existingIdx] = entry;
  else list.push(entry);
  list.sort((a, b) => scoreFor(b) - scoreFor(a));
  const trimmed = list.slice(0, LEADERBOARD_MAX);
  saveLeaderboard(trimmed);
  return trimmed.findIndex((e) => e === entry);
}

function openLeaderboard() {
  document.getElementById("screen-pause").classList.remove("active");
  document.getElementById("screen-gameover").classList.remove("active");
  showScreen("screen-leaderboard");
  refreshLeaderboard();
}

let leaderboardSource = "online"; // "online" | "local"

function setLeaderboardSource(src) {
  leaderboardSource = src;
  document.querySelectorAll(".lb-tab").forEach((b) => b.classList.toggle("active", b.dataset.src === src));
  refreshLeaderboard();
}

function renderLeaderboard(list, sourceLabel) {
  const container = document.getElementById("leaderboard-list");
  container.innerHTML = "";
  if (!list || list.length === 0) {
    const empty = document.createElement("div");
    empty.className = "leaderboard-empty";
    empty.textContent = sourceLabel === "online"
      ? t("Henüz online şampiyon yok. İlk sıraya geç! 🌟")
      : t("Bu cihazda kayıtlı şampiyon yok.");
    container.appendChild(empty);
    return;
  }
  list.forEach((entry, i) => {
    const row = document.createElement("div");
    row.className = "leaderboard-row";
    if (i === 0) row.classList.add("rank-gold");
    else if (i === 1) row.classList.add("rank-silver");
    else if (i === 2) row.classList.add("rank-bronze");
    if (entry.name === save.playerName) row.classList.add("is-me");

    const rank = document.createElement("div");
    rank.className = "lb-rank";
    rank.textContent = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
    row.appendChild(rank);

    const name = document.createElement("div");
    name.className = "lb-name";
    name.textContent = entry.name;
    row.appendChild(name);

    const stats = document.createElement("div");
    stats.className = "lb-stats";
    stats.innerHTML = `<span>📚 ${t("Bölüm {n}", { n: entry.level })}</span><span>👻 ${entry.ghosts}</span><span>💰 ${entry.para}</span>`;
    row.appendChild(stats);

    container.appendChild(row);
  });
  akiListeGiris(container, ".leaderboard-row");
  // Uzun listede kendi satırına git (ilk 10'da değilse)
  const ben = list.findIndex((e) => e.name === save.playerName);
  if (ben >= 10) {
    const git = document.createElement("button");
    git.className = "btn-tiny lb-ben";
    git.textContent = t("📍 Senin sıran: {n}", { n: ben + 1 });
    git.onclick = () => container.querySelectorAll(".leaderboard-row")[ben].scrollIntoView({ block: "center", behavior: "smooth" });
    container.prepend(git);
  }
}

let sampiyonIstegi = 0; // yalnız en son istenen liste çizilir (yüklenirken sekme değişirse eski yanıt yazmasın)
async function refreshLeaderboard() {
  const container = document.getElementById("leaderboard-list");
  const istek = ++sampiyonIstegi;
  if (leaderboardSource === "online") {
    container.innerHTML = `<div class="leaderboard-empty">${t("🌐 Yükleniyor...")}</div>`;
    const online = await fetchOnlineLeaderboard(LEADERBOARD_MAX);
    if (istek !== sampiyonIstegi) return;
    if (online === null) {
      // İnternet yok ya da hata — yerele düş
      container.innerHTML = `<div class="leaderboard-empty">${t("⚠ İnternete bağlanılamadı, yerel liste gösteriliyor.")}</div>`;
      setTimeout(() => { if (istek === sampiyonIstegi) renderLeaderboard(loadLeaderboard(), "local"); }, 600);
      return;
    }
    renderLeaderboard(online, "online");
  } else {
    renderLeaderboard(loadLeaderboard(), "local");
  }
}

function clearLeaderboard() {
  if (confirm(t("Şampiyon listesi temizlensin mi?"))) {
    saveLeaderboard([]);
    refreshLeaderboard();
    showToast(t("Liste temizlendi."));
  }
}

// ====== AÇILIŞ EKRANI KARAKTER ÇİZİMİ ======
// Açılışta 3D avcılardan bir grup (kullanıcı: "burada karakterlerin 3D görünümleri olmalı"): seçili avcı ortada ve
// büyük, dört arkadaşı iki yanında; her biri canlı önizleme (gorsel.js canliOnizleme; 3D hazır değilse 2D yedek).
// Atış kıpırtıları sırayla kaydırılır, hep birlikte ateş etmezler.
function drawGreeter() {
  welcomeAmblemiKur();
  const el = document.getElementById("kinkin-greeter");
  if (!el) return;
  canliOnizlemeTemizle(el);
  const secili = (typeof save !== "undefined" && save.selectedChar && CHARACTERS[save.selectedChar]) ? save.selectedChar : "kinkin";
  const diger = ["gul", "kornet", "fanatik", "rani", "kinkin", "veryi"].filter((k) => k !== secili && CHARACTERS[k]).slice(0, 4);
  const sira = [diger[0], diger[1], secili, diger[2], diger[3]];
  el.classList.add("greeter-grup");
  el.innerHTML = sira.map((k, i) => `<div class="greeter-avci${i === 2 ? " orta" : ""}" data-avci="${k}"></div>`).join("");
  const kutular = el.querySelectorAll(".greeter-avci");
  kutular.forEach((kutu, i) => {
    const k = sira[i];
    const kostum = (save.selectedCostume && save.selectedCostume[k]) || 0;
    const o = canliOnizleme(kutu, k, kostum);
    // Atış kıpırtısını kaydır: her avcı farklı anda ateş etsin
    const kayit = (typeof _onizlemeler !== "undefined") ? _onizlemeler.find((x) => x.el === kutu) : null;
    if (kayit) kayit.sonAtis = performance.now() - i * 520;
    return o;
  });
}

// ====== MENÜ ======
function refreshMenu() {
  document.getElementById("menu-player").textContent = save.playerName || t("Avcı");
  akiSayacYaz(document.getElementById("menu-para"), save.para);
  akiSayacYaz(document.getElementById("menu-elmas"), save.elmas);
  akiSayacYaz(document.getElementById("menu-zumrut"), save.zumrut);
  akiSayacYaz(document.getElementById("menu-kupa"), save.kupa || 0);
  menuSayacCercevesi();

  // Karakter önizleme: canlı (gorsel.js canliOnizleme); eskiden data URL'e bir kez çizilirdi
  const charKey = save.selectedChar;
  const c = CHARACTERS[charKey];
  const costumeIdx = save.selectedCostume[charKey];
  canliOnizleme(document.getElementById("character-preview"), charKey, costumeIdx);

  document.getElementById("character-name").textContent = c.name;
  const stats = computeStats(charKey);
  document.getElementById("character-stats").textContent =
    t("🏃 Hız {hiz} · 💥 Hasar {hasar} · 🎯 Menzil {menzil}", { hiz: stats.speed.toFixed(1), hasar: stats.damage, menzil: Math.round(stats.range) });
  rozetiGuncelle(); // 👫 düğmesindeki istek + davet sayısı (arkadaslar.js)
}

// Menü simgeleri (3.20.0): resmi GORSEL_LISTESI'nde olan [data-ui-simge] ögelerinin yalnız baştaki emojisini
// uiSimgeHTML ile değiştirir; çevrilmiş sözcükler olduğu gibi kalır. Uygulanan öge işaretlenir (idempotent).
function menuSimgeleriniUygula() {
  if (typeof GORSEL_LISTESI !== "object" || !GORSEL_LISTESI) return;
  for (const el of document.querySelectorAll("[data-ui-simge]")) {
    if (el.dataset.uiSimgeUygulandi === "1") continue;
    const key = el.dataset.uiSimge;
    if (!GORSEL_LISTESI[key]) continue;
    const dugum = [...el.childNodes].find((n) => n.nodeType === 3 && /\S/.test(n.textContent));
    if (!dugum) continue;
    const m = dugum.textContent.match(/^(\s*)([^\p{L}\s]+)(?:(\s+)([\s\S]*))?$/u);
    if (!m) { el.dataset.uiSimgeUygulandi = "1"; continue; }
    const emoji = m[2];
    const kalan = (m[3] || "") + (m[4] || "");
    const ad = (m[4] || "").trim() || emoji;
    const kap = document.createElement("span");
    kap.innerHTML = uiSimgeHTML(key, emoji, ad);
    const resim = kap.firstChild;
    el.insertBefore(resim, dugum);
    dugum.textContent = kalan;
    el.dataset.uiSimgeUygulandi = "1";
  }
}

// Oyun sonu ödül sandığı: data-ui-sandik kabı bir kez doldurulur (resim listede yoksa boş kalır)
function odulSandigiKur() {
  const el = document.querySelector("[data-ui-sandik]");
  if (!el) return;
  el.innerHTML = uiSimgeHTML("ui-sandik", "", "");
}

// Açılış ve isim ekranı amblemi (menu-amblem gibi): resim yoksa kap gizli kalır
function welcomeAmblemiKur() {
  const g = gorsel("amblem-hayalet");
  for (const am of document.querySelectorAll("[data-welcome-amblem]")) {
    am.hidden = !g;
    am.innerHTML = g ? `<img class="menu-resim" src="${g.src}" alt="" draggable="false">` : "";
  }
}

// Ana menü süsü (3.21.0): dekoratif katmanlar yalnız menü açıkken çalışır. Resim varsa gorsel() ile,
// yoksa emoji/hayalet-normal ile çizilir; hiçbiri dokunuşu engellemez (bakan hayalet dışında).
const _menuDekor = { kuruldu: false, acik: false, kareZamanlayici: 0 };
function _menuAzHareket() {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function _menuResimVeyaEmoji(k, emoji) {
  const im = gorsel(k); // yüklü resmin kendi adresi (paketli denemede data URL, uygulamada dosya)
  return im ? `<img class="menu-resim" src="${im.src}" alt="" draggable="false">` : emoji;
}
function _menuHayaletKareCiz() {
  const kutu = document.getElementById("dekor-hayaletler");
  if (!kutu) return;
  const sn = performance.now() / 1000;
  for (const c of kutu.querySelectorAll("canvas.dekor-hayalet-tuval")) {
    const ctx = c.getContext("2d");
    const n = animHazir("menu-hayalet");
    if (!ctx || !n) continue;
    ctx.clearRect(0, 0, c.width, c.height);
    animCiz(ctx, "menu-hayalet", 1 + (Math.floor(sn * 4 + (+c.dataset.faz || 0)) % n), 0, 0, c.width, c.height);
  }
}
function _menuHayaletleriKur() {
  const kutu = document.getElementById("dekor-hayaletler");
  if (!kutu) return;
  const kareVar = typeof animHazir === "function" && animHazir("menu-hayalet") > 0;
  if (kutu.dataset.kuruldu === "1") {
    // Resimler sonradan yüklendiyse yedeği (emoji / hayalet-normal) tazele
    if (kareVar && !kutu.querySelector("canvas.dekor-hayalet-tuval")) {
      kutu.innerHTML = ""; kutu.dataset.kuruldu = "0";
    } else if (!kareVar) {
      const kaynak = _menuResimVeyaEmoji("hayalet-normal", "👻");
      for (const h of kutu.querySelectorAll(".dekor-hayalet")) if (h.innerHTML !== kaynak) h.innerHTML = kaynak;
      return;
    } else return;
  }
  kutu.dataset.kuruldu = "1";
  for (let i = 0; i < 3; i++) {
    const h = document.createElement("div");
    h.className = "dekor-hayalet dekor-hayalet-" + (i + 1);
    if (kareVar) {
      const c = document.createElement("canvas");
      c.className = "dekor-hayalet-tuval";
      c.width = 66; c.height = 80; c.dataset.faz = String(i * 2);
      h.appendChild(c);
    } else {
      h.innerHTML = _menuResimVeyaEmoji("hayalet-normal", "👻");
    }
    kutu.appendChild(h);
  }
  if (kareVar && _menuDekor.acik && !_menuDekor.kareZamanlayici && !_menuAzHareket()) {
    _menuDekor.kareZamanlayici = setInterval(_menuHayaletKareCiz, 250);
  }
}
// Uzun menü düğmeleri: 3 parçalı (uç + orta + uç) resim, boyuta göre BİR KEZ tuvale çizilip arka plan yapılır.
// CSS border-image dilim sınırlarında bilineer örnekleme / kesirli piksel yüzünden ince koyu çizgi bırakıyordu (MEN3);
// tuvalde her parça tam sayı cihaz pikselinde ve kaynak dikdörtgenine kenetlenerek çizilir, dikiş oluşmaz.
// uc: kaynak resimde uç genişliği (px), ust: kaynakta çizilmeyen şeffaf üst pay (yeşil resimde 78 px).
const _MENU_DUGME_DILIM = { yesil: { uc: 60, ust: 78 }, mor: { uc: 56, ust: 0 }, turuncu: { uc: 56, ust: 0 }, camgobegi: { uc: 64, ust: 0 } };
const _menuDugmeOnbellek = new Map(); // "anahtar|G|Y|dpr" → data URL
let _menuDugmeGozlemci = null;
function _menuDugmeUcGenisligi(uc, ust, im, Y) { // hedefte uç genişliği: oran korunur (cihaz pikseli, tam sayı)
  return Math.max(1, Math.round(uc * Y / (im.naturalHeight - ust)));
}
function menuDugmeTuvaliCiz(anahtar, im, G, Y, dpr) {
  const dilim = _MENU_DUGME_DILIM[anahtar];
  if (!dilim || !im || G < 2 || Y < 2) return "";
  const kimlik = `${anahtar}|${G}|${Y}|${dpr}|${im.naturalWidth}`;
  if (_menuDugmeOnbellek.has(kimlik)) return _menuDugmeOnbellek.get(kimlik);
  const gw = Math.max(2, Math.round(G * dpr)), gh = Math.max(2, Math.round(Y * dpr));
  const iw = im.naturalWidth, sh = im.naturalHeight - dilim.ust, sy = dilim.ust;
  let uc = _menuDugmeUcGenisligi(dilim.uc, dilim.ust, im, gh);
  if (uc * 2 >= gw) uc = Math.max(1, Math.floor((gw - 1) / 2));
  const t = document.createElement("canvas");
  t.width = gw; t.height = gh;
  const c = t.getContext("2d");
  if (!c) return "";
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";
  c.drawImage(im, dilim.uc, sy, iw - 2 * dilim.uc, sh, uc, 0, gw - 2 * uc, gh); // orta (uçlar bittiği tam sayı sınırda)
  c.drawImage(im, 0, sy, dilim.uc, sh, 0, 0, uc, gh);                           // sol uç
  c.drawImage(im, iw - dilim.uc, sy, dilim.uc, sh, gw - uc, 0, uc, gh);          // sağ uç (resim simetrik, aynalama gerekmez)
  let url = "";
  try { url = t.toDataURL("image/png"); } catch (e) { url = ""; }
  if (_menuDugmeOnbellek.size > 48) _menuDugmeOnbellek.clear();
  _menuDugmeOnbellek.set(kimlik, url);
  return url;
}
function _menuDugmeyiCiz(el) {
  const anahtar = el.dataset.menuDugme, im = gorsel("menu-dugme-" + anahtar);
  if (!im || !el.classList.contains("menu-dugme-resim") || el.classList.contains("btn-small")) return;
  const G = el.offsetWidth, Y = el.offsetHeight;
  if (!G || !Y) return; // gizli ekran: görününce gözlemci yeniden çağırır
  const url = menuDugmeTuvaliCiz(anahtar, im, G, Y, window.devicePixelRatio || 1);
  if (url) { el.style.backgroundImage = `url("${url}")`; el.style.backgroundSize = "100% 100%"; el.style.backgroundOrigin = "border-box"; }
}
function _menuDekorDugmeleriKur() {
  if (!_menuDugmeGozlemci && typeof ResizeObserver === "function") {
    _menuDugmeGozlemci = new ResizeObserver((kayitlar) => { for (const k of kayitlar) _menuDugmeyiCiz(k.target); });
    window.addEventListener("resize", () => { for (const el of document.querySelectorAll(".menu-dugme-resim[data-menu-dugme]")) _menuDugmeyiCiz(el); });
  }
  for (const el of document.querySelectorAll("[data-menu-dugme]")) {
    const k = "menu-dugme-" + el.dataset.menuDugme;
    const uzun = !el.classList.contains("btn-small");
    if (gorsel(k)) {
      el.style.backgroundSize = "100% 100%";
      el.style.backgroundRepeat = "no-repeat";
      el.classList.add("menu-dugme-resim");
      if (uzun) {
        el.style.backgroundImage = ""; // tuval hazır olana dek CSS yedeği
        _menuDugmeyiCiz(el);
        if (_menuDugmeGozlemci) _menuDugmeGozlemci.observe(el);
        if (!el.style.backgroundImage) el.style.backgroundImage = `url("${gorsel(k).src}")`; // ölçü yoksa yedek: düz gerilmiş resim
      } else el.style.backgroundImage = `url("${gorsel(k).src}")`;
    } else {
      if (_menuDugmeGozlemci) _menuDugmeGozlemci.unobserve(el);
      el.style.backgroundImage = "";
      el.classList.remove("menu-dugme-resim");
    }
  }
}
function menuDekoruKur() {
  const em = document.getElementById("menu-amblem");
  if (em) {
    const g = gorsel("menu-amblem");
    em.hidden = !g;
    em.innerHTML = g ? `<img class="menu-resim" src="${g.src}" alt="" draggable="false">` : ""; // yüklü resmin adresi (denemede data URL)
  }
  const spot = document.getElementById("hunter-spot");
  if (spot) spot.innerHTML = gorsel("menu-spot") ? `<img class="menu-resim" src="${gorsel("menu-spot").src}" alt="" draggable="false">` : "";
  const kaide = document.getElementById("hunter-kaide");
  if (kaide) kaide.innerHTML = gorsel("menu-kaide") ? `<img class="menu-resim" src="${gorsel("menu-kaide").src}" alt="" draggable="false">` : "";
  const kayan = document.getElementById("dekor-kayan");
  if (kayan) kayan.innerHTML = _menuResimVeyaEmoji("menu-kayan", "✨");
  const yarasa = document.getElementById("dekor-yarasa");
  if (yarasa) yarasa.innerHTML = _menuResimVeyaEmoji("menu-yarasa", "🦇");
  const bakan = document.getElementById("dekor-bakan");
  if (bakan) bakan.innerHTML = _menuResimVeyaEmoji("menu-bakan", "👻");
  const fener = document.getElementById("dekor-fener");
  if (fener) fener.innerHTML = _menuResimVeyaEmoji("menu-fener", "");
  _menuHayaletleriKur();
  _menuDekorDugmeleriKur();
  if (!_menuDekor.kuruldu) {
    _menuDekor.kuruldu = true;
    if (bakan) bakan.addEventListener("click", () => {
      bakan.classList.add("gizli");
      setTimeout(() => { if (_menuDekor.acik) bakan.classList.remove("gizli"); }, 8000);
    });
  }
}
// Menü animasyonlarını açar/kapatır: oyun ekranı açılınca dekor katmanı durur (CSS play-state + JS sayacı).
function menuDekorDurum(acik) {
  const el = document.getElementById("screen-menu");
  if (!el) return;
  _menuDekor.acik = !!acik;
  el.classList.toggle("dekor-durgun", !acik);
  if (!acik && _menuDekor.kareZamanlayici) { clearInterval(_menuDekor.kareZamanlayici); _menuDekor.kareZamanlayici = 0; }
  if (acik && !_menuDekor.kareZamanlayici && !_menuAzHareket() &&
      typeof animHazir === "function" && animHazir("menu-hayalet") > 0) {
    _menuDekor.kareZamanlayici = setInterval(_menuHayaletKareCiz, 250);
  }
}

// ====== KARAKTERLER EKRANI (3.20.0) ======
// Kart ızgarası + ayrıntı paneli. Kart dokunuşu artık satın alma/seçme yapmaz; yalnız paneli açar.
// Satın alma ve seçme tek yerde: karakterAlVeyaSec (kart ve panel düğmesi buradan çağırır).
let charDetayKey = null;   // açık panelin karakteri; null ise panel kapalı
let charDetayKostum = 0;   // panelde önizlenen kostüm sırası

function karakterZorlukYildiz(n) {
  const d = Math.max(1, Math.min(3, n || 1));
  return "★".repeat(d) + "☆".repeat(3 - d);
}

function karakterZorlukAd(n) {
  return n === 1 ? t("Kolay") : n === 2 ? t("Orta") : t("Usta"); // anahtarlar.mjs düz t("…") çağrılarını toplar
}

// Stat çubuklarının ortak ölçeği: bütün karakterlerin en yüksek değeri (computeStats yükseltmeleri de içerir)
function karakterStatEnBuyuk() {
  const en = { speed: 0, damage: 0, fireRate: 0, range: 0 };
  Object.keys(CHARACTERS).forEach((k) => {
    const s = computeStats(k);
    en.speed = Math.max(en.speed, s.speed);
    en.damage = Math.max(en.damage, s.damage);
    en.fireRate = Math.max(en.fireRate, 1000 / s.fireDelay);
    en.range = Math.max(en.range, s.range);
  });
  return en;
}

// Kart resmi: canlı 3D avcı (gorsel.js canliOnizleme, yalniz3d). Altında yedek durur: GORSEL kart resmi yüklendiyse
// <img>, yoksa drawCharacter ile statik tuval; 3D çizilince kap "uc3d" sınıfını alır ve yedek gizlenir.
function karakterKartResmi(key) {
  const kap = document.createElement("div");
  kap.className = "char-kart-canli";
  const im = typeof gorsel === "function" ? gorsel(`kart-${key}`) : null;
  if (im) {
    const el = document.createElement("img");
    el.className = "char-kart-resim";
    el.src = im.src; // paketli denemede data URL, uygulamada dosya
    el.alt = "";
    el.draggable = false;
    kap.appendChild(el);
  } else {
    const cv = document.createElement("canvas");
    cv.className = "char-kart-tuval";
    cv.width = 160; cv.height = 180;
    drawCharacter(cv.getContext("2d"), key, save.selectedCostume[key] || 0, 80, 120, 160);
    kap.appendChild(cv);
  }
  return kap;
}

function refreshCharacters() {
  akiSayacYaz(document.getElementById("char-zumrut"), save.zumrut);
  const list = document.getElementById("character-list");
  canliOnizlemeTemizle(list);
  list.innerHTML = "";

  Object.keys(CHARACTERS).forEach((key) => {
    const c = CHARACTERS[key];
    const detay = (typeof KARAKTER_DETAY === "object" && KARAKTER_DETAY[key]) || {};
    const power = CHAR_POWERS[key] || { name: "", icon: "✨" };
    const unlocked = !!save.unlockedChars[key];
    const selected = save.selectedChar === key;

    const card = document.createElement("button");
    card.type = "button";
    card.className = "char-card" + (selected ? " selected" : "") + (unlocked ? "" : " locked");
    card.dataset.key = key;

    const img = document.createElement("div");
    img.className = "char-img";
    img.appendChild(karakterKartResmi(key));
    card.appendChild(img);

    const label = document.createElement("div");
    label.className = "char-ad";
    label.textContent = c.name;
    card.appendChild(label);

    const unvan = document.createElement("div");
    unvan.className = "char-unvan";
    // Çeviriler sonradan eklenecek: henüz çevrilmemiş Türkçe unvan yabancı dilde gösterilmez
    const unvanMetin = String(detay.unvan || c.desc || "");
    unvan.textContent = (typeof DIL !== "undefined" && DIL !== "tr" && /[ğışĞİŞ]/.test(unvanMetin)) ? "" : unvanMetin;
    card.appendChild(unvan);

    const rozet = document.createElement("div");
    rozet.className = "char-rozet";
    const guc = document.createElement("span");
    guc.className = "char-guc";
    guc.innerHTML = uiSimgeHTML(`guc-${key}`, power.icon, power.name);
    rozet.appendChild(guc);
    const yildiz = document.createElement("span");
    yildiz.className = "char-yildiz";
    yildiz.textContent = karakterZorlukYildiz(detay.zorluk);
    rozet.appendChild(yildiz);
    card.appendChild(rozet);

    const durum = document.createElement("div");
    durum.className = "char-durum";
    if (!unlocked) {
      durum.classList.add("kilit");
      durum.textContent = `💚 ${c.cost}`;
    } else if (selected) {
      durum.classList.add("secili");
      durum.textContent = t("✓ Seçili");
    }
    card.appendChild(durum);

    card.addEventListener("click", () => karakterDetayAc(key));
    if (selected) akiPariltiEkle(card); // R49: seçili kartta pırıltı
    list.appendChild(card);
    // Canlı 3D: atışsız, en çok 10 kare/sn; ekran dışındaki kart çizilmez
    canliOnizleme(img.firstChild, key, save.selectedCostume[key] || 0, { atis: false, yalniz3d: true, aralikMs: 100, olcek: 1.2, ayak: 0.56 });
  });
  akiListeGiris(list, ".char-card");

  // Panel açıksa yerinde tazelenir (satın alma, seçme, görsel yüklemesi sonrası)
  if (charDetayKey && CHARACTERS[charDetayKey]) karakterDetayCiz();
}

function karakterDetayAc(key) {
  if (!CHARACTERS[key]) return;
  charDetayKey = key;
  charDetayKostum = save.selectedCostume[key] || 0;
  const panel = document.getElementById("character-detail");
  if (panel) {
    panel.hidden = false;
    panel.classList.add("open");
  }
  karakterDetayCiz();
}

function karakterDetayKapat() {
  charDetayKey = null;
  const panel = document.getElementById("character-detail");
  if (panel) {
    panel.hidden = true;
    panel.classList.remove("open");
    canliOnizlemeTemizle(panel);
    panel.innerHTML = "";
  }
}

function karakterDetayGez(yon) {
  const anahtarlar = Object.keys(CHARACTERS);
  const i = anahtarlar.indexOf(charDetayKey);
  if (i < 0) return;
  const yeni = anahtarlar[(i + yon + anahtarlar.length) % anahtarlar.length];
  charDetayKey = yeni;
  charDetayKostum = save.selectedCostume[yeni] || 0;
  karakterDetayCiz();
}

// Mağazayı kostümler sekmesinde açar (paneldeki "Mağazada aç" bağlantısı)
function karakterMagazaKostum() {
  karakterDetayKapat();
  showScreen("screen-shop");
  showShopTab("costumes");
}

// Satın alma/seçme: eski kart davranışının tek yeri (aynı bildirim metinleri korunur)
function karakterAlVeyaSec(key) {
  const c = CHARACTERS[key];
  if (!c) return;
  if (!save.unlockedChars[key]) {
    if (save.zumrut >= c.cost) {
      if (confirm(t("{ad} {n} 💚 zümrüt karşılığında alınsın mı?", { ad: c.name, n: c.cost }))) {
        save.zumrut -= c.cost;
        save.unlockedChars[key] = true;
        save.selectedChar = key;
        persistSave();
        refreshCharacters();
        refreshMenu();
        konfetiPatlat();
        showToast(t("🎉 {ad} açıldı!", { ad: c.name }));
        audio.unlock();
      }
    } else {
      showToast(t("Yeterli zümrüt yok 💚"));
    }
    return;
  }
  if (save.selectedChar !== key) {
    save.selectedChar = key;
    persistSave();
    refreshCharacters();
    refreshMenu();
    showToast(t("{ad} seçildi!", { ad: c.name }));
  }
}

function karakterDetayCiz() {
  const panel = document.getElementById("character-detail");
  if (!panel || !charDetayKey || !CHARACTERS[charDetayKey]) return;
  const key = charDetayKey;
  const c = CHARACTERS[key];
  const detay = (typeof KARAKTER_DETAY === "object" && KARAKTER_DETAY[key]) || {};
  const power = CHAR_POWERS[key] || { name: "", icon: "✨", duration: 0 };
  const unlocked = !!save.unlockedChars[key];
  const selected = save.selectedChar === key;

  const s = computeStats(key);
  const en = karakterStatEnBuyuk();
  const atisHizi = 1000 / s.fireDelay;
  const statlar = [
    { k: "hiz", ad: t("Hız"), deger: s.speed, en: en.speed, metin: s.speed.toFixed(1) },
    { k: "hasar", ad: t("Hasar"), deger: s.damage, en: en.damage, metin: String(s.damage) },
    { k: "atis", ad: t("Atış hızı"), deger: atisHizi, en: en.fireRate, metin: atisHizi.toFixed(1) },
    { k: "menzil", ad: t("Menzil"), deger: s.range, en: en.range, metin: String(Math.round(s.range)) },
  ];
  const statHTML = statlar.map((st) => {
    const yuzde = st.en > 0 ? Math.max(0, Math.min(100, (st.deger / st.en) * 100)) : 0;
    return `<div class="stat-satir"><span class="stat-ad">${escapeHtml(st.ad)}</span>` +
      `<span class="stat-cubuk"><span class="stat-dolu" data-stat="${st.k}" style="width:${yuzde.toFixed(1)}%"></span></span>` +
      `<span class="stat-deger">${escapeHtml(st.metin)}</span></div>`;
  }).join("");

  canliOnizlemeTemizle(panel);
  panel.innerHTML =
    `<div class="char-detay-kart">` +
      `<button type="button" class="char-detay-kapat" aria-label="${escapeHtml(t("Kapat"))}">✕</button>` +
      `<div class="char-detay-ust">` +
        `<button type="button" class="char-detay-gezin char-detay-onceki" aria-label="${escapeHtml(t("Önceki karakter"))}">‹</button>` +
        `<div class="char-detay-onizleme"></div>` +
        `<button type="button" class="char-detay-gezin char-detay-sonraki" aria-label="${escapeHtml(t("Sonraki karakter"))}">›</button>` +
      `</div>` +
      `<h3 class="char-detay-ad" id="char-detay-ad">${escapeHtml(c.name)}</h3>` +
      `<p class="char-detay-unvan">${escapeHtml(detay.unvan || "")}</p>` +
      `<p class="char-detay-zorluk"><span>${escapeHtml(t("Zorluk"))}</span> ` +
        `<span class="char-yildiz">${karakterZorlukYildiz(detay.zorluk)}</span> ` +
        `<span>${escapeHtml(karakterZorlukAd(detay.zorluk))}</span></p>` +
      `<div class="char-kostumlar"></div>` +
      `<div class="char-statlar">${statHTML}</div>` +
      `<div class="char-guc-kutu"><div class="char-guc-baslik">` +
        `<span class="char-guc">${uiSimgeHTML(`guc-${key}`, power.icon, power.name)}</span>` +
        `<strong>${escapeHtml(power.name)}</strong>` +
        `<span class="char-guc-sure">${escapeHtml(t("{n} sn", { n: power.duration / 1000 }))}</span></div>` +
        `<p>${escapeHtml(detay.guc || "")}</p></div>` +
      `<div class="char-bilgi">` +
        `<p><strong>${escapeHtml(t("Silah"))}:</strong> ${escapeHtml(detay.silah || "")}</p>` +
        `<p class="char-hikaye">${escapeHtml(detay.hikaye || "")}</p>` +
        `<p class="char-ipucu">💡 ${escapeHtml(detay.ipucu || "")}</p></div>` +
      `<button type="button" class="btn btn-big char-eylem"></button>` +
    `</div>`;

  canliOnizleme(panel.querySelector(".char-detay-onizleme"), key, charDetayKostum);

  // Kostüm çipleri: sahip olunanlar önizlenir/seçilir, olmayanlar yalnız önizlenir
  const chipKap = panel.querySelector(".char-kostumlar");
  (COSTUMES[key] || []).forEach((cos, idx) => {
    const sahip = idx === 0 || (save.unlockedCostumes[key] || []).includes(idx);
    const giyili = (save.selectedCostume[key] || 0) === idx;
    const chip = document.createElement("div");
    chip.className = "char-kostum" + (charDetayKostum === idx ? " onizle" : "") +
      (giyili ? " giyili" : "") + (sahip ? "" : " kilitli");
    chip.dataset.costume = String(idx);
    chip.setAttribute("role", "button");
    chip.setAttribute("tabindex", "0");
    const cv = document.createElement("canvas");
    cv.width = 48; cv.height = 56;
    drawCharacter(cv.getContext("2d"), key, idx, 24, 38, 52);
    chip.appendChild(cv);
    const ad = document.createElement("span");
    ad.className = "char-kostum-ad";
    ad.textContent = cos.name;
    chip.appendChild(ad);
    if (cos.efsane) {
      const rozet = document.createElement("span");
      rozet.className = "efsane-rozet";
      rozet.style.color = "#fbbf24";
      rozet.textContent = t("✨ Efsane");
      chip.appendChild(rozet);
    }
    if (!sahip) {
      const fiyat = document.createElement("span");
      fiyat.className = "char-kostum-fiyat";
      fiyat.textContent = `💎 ${cos.cost}`; // mağaza kostümleri elmasla satılır
      chip.appendChild(fiyat);
      const bag = document.createElement("span");
      bag.className = "char-kostum-magaza";
      bag.setAttribute("role", "link");
      bag.setAttribute("tabindex", "0");
      bag.textContent = t("Mağazada aç");
      bag.addEventListener("click", (e) => { e.stopPropagation(); karakterMagazaKostum(); });
      bag.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); karakterMagazaKostum(); }
      });
      chip.appendChild(bag);
    }
    chip.addEventListener("click", () => {
      charDetayKostum = idx;
      if (sahip && unlocked) {
        save.selectedCostume[key] = idx;
        persistSave();
        refreshCharacters();
        refreshMenu();
      } else {
        karakterDetayCiz();
      }
    });
    chip.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); chip.click(); }
    });
    chipKap.appendChild(chip);
  });

  panel.querySelector(".char-detay-kapat").addEventListener("click", karakterDetayKapat);
  panel.querySelector(".char-detay-onceki").addEventListener("click", () => karakterDetayGez(-1));
  panel.querySelector(".char-detay-sonraki").addEventListener("click", () => karakterDetayGez(1));
  const eylem = panel.querySelector(".char-eylem");
  if (!unlocked) {
    eylem.textContent = t("💚 {n} ile aç", { n: c.cost });
    if (save.zumrut < c.cost) eylem.classList.add("yetersiz");
    eylem.addEventListener("click", () => karakterAlVeyaSec(key));
  } else if (!selected) {
    eylem.textContent = t("Seç");
    eylem.addEventListener("click", () => karakterAlVeyaSec(key));
  } else {
    eylem.textContent = t("✓ Seçili");
    eylem.disabled = true;
  }
}

// Escape paneli kapatır (masaüstü klavye); Android geri tuşu için oyunda ayrı bir işleyici yok.
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && charDetayKey) {
    e.stopPropagation();
    karakterDetayKapat();
  }
});

// Görseller yüklenince açık ekranın kartları (ve paneli) yeniden çizilir: kart-* resimleri <img> olur
window.addEventListener("gorsel-yuklendi", () => {
  ekranGorselleriKur();
  menuSimgeleriniUygula();
  menuSayacCercevesi();
  welcomeAmblemiKur();
  odulSandigiKur();
  if (typeof menuDekoruKur === "function") menuDekoruKur();
  const ekran = document.getElementById("screen-characters");
  if (ekran && ekran.classList.contains("active")) refreshCharacters();
});
// 3D avcı modülü hazır olunca açık karakter ekranındaki kartlar yeniden çizilir (önizlemeler 3D'ye geçer)
window.addEventListener("uc-avci-hazir", () => {
  if (save && save.ayar3d === false && window.UcAvci && window.UcAvci.kapat) window.UcAvci.kapat();
  refresh3dButton();
  const ekran = document.getElementById("screen-characters");
  if (ekran && ekran.classList.contains("active")) refreshCharacters();
});
// Başarım koruması 3D'yi kapattı: kullanıcıya söyle, seçimi kaydet.
window.addEventListener("uc-avci-yavas", () => {
  save.ayar3d = false;
  persistSave();
  refresh3dButton();
  if (typeof showToast === "function") showToast(t("3D karakterler yavaşladığı için kapatıldı"));
});

let currentShopTab = "upgrades";
function showShopTab(tab) {
  currentShopTab = tab;
  const buttons = document.querySelectorAll(".tab-btn");
  buttons.forEach((b) => b.classList.remove("active"));
  const idx = ({ upgrades: 0, costumes: 1, ammo: 2, guns: 3, pets: 4 })[tab] ?? 0;
  if (buttons[idx]) buttons[idx].classList.add("active");
  refreshShop();
}

function refreshShop() {
  akiSayacYaz(document.getElementById("shop-para"), save.para);
  akiSayacYaz(document.getElementById("shop-elmas"), save.elmas);
  const content = document.getElementById("shop-content");
  content.innerHTML = "";

  if (currentShopTab === "upgrades") {
    const activeChar = save.selectedChar;
    const charName = (CHARACTERS[activeChar] || { name: t("Avcı") }).name;
    const u4char = save.upgradesByChar[activeChar];

    // Karakter başlığı (yükseltmeler bu karaktere özel)
    const header = document.createElement("div");
    header.className = "upgrade-header";
    header.innerHTML = t("🛠 <b>{ad}</b> için yükseltmeler", { ad: charName }) + `<br><span class="hint">${t("(Karakter değiştirmek için Karakterler menüsüne git)")}</span>`;
    content.appendChild(header);

    Object.keys(UPGRADES).forEach((key) => {
      const u = UPGRADES[key];
      const lv = u4char[key];
      const item = document.createElement("div");
      item.className = "shop-item";

      const icon = document.createElement("div");
      icon.className = "item-icon";
      icon.innerHTML = uiSimgeHTML(u.gorsel, u.icon, u.name);
      item.appendChild(icon);

      const info = document.createElement("div");
      info.className = "item-info";
      info.innerHTML = `<div class="item-name">${u.name} (${t("Sv {a}/{b}", { a: lv, b: u.max })})</div>
                        <div class="item-desc">${u.desc}</div>`;
      item.appendChild(info);

      const btn = document.createElement("button");
      if (lv >= u.max) {
        btn.textContent = "MAX";
        btn.disabled = true;
      } else {
        const cost = u.costs[lv];
        btn.textContent = `💰 ${cost}`;
        btn.disabled = save.para < cost;
        btn.onclick = () => {
          if (save.para >= cost) {
            save.para -= cost;
            save.upgradesByChar[activeChar][key]++;
            persistSave();
            refreshShop();
            konfetiPatlat();
            showToast(t("{ad} {yukseltme} yükseltildi!", { ad: charName, yukseltme: u.name }));
            audio.buy();
          }
        };
      }
      item.appendChild(btn);

      content.appendChild(item);
    });

    // Efsane özellikler: pahalı, kalıcı (para ile)
    const efHeader = document.createElement("div");
    efHeader.className = "upgrade-header";
    efHeader.innerHTML = uiSimgeHTML("efsane-sandik", "", "") + t("✨ <b>Efsane Özellikler</b>");
    content.appendChild(efHeader);
    const ozellikler = [
      { key: "extraBot", ad: t("🤖 İkinci Bot"), desc: t("Yanında ikinci bir yardımcı bot savaşır."), cost: 100000 },
      { key: "extraHeart", ad: t("❤️ Fazladan Kalp"), desc: t("Bütün karakterlerde azami kalp 3 yerine 4 olur."), cost: 80000 },
    ];
    ozellikler.forEach((oz) => {
      const item = document.createElement("div");
      item.className = "shop-item";
      item.style.border = "2px solid #fbbf24";
      item.style.boxShadow = "0 0 10px rgba(251,191,36,0.35)";
      const icon = document.createElement("div");
      icon.className = "item-icon";
      icon.innerHTML = oz.key === "extraBot" ? uiSimgeHTML("bot", "🤖", t("İkinci Bot")) : uiSimgeHTML("gel-can", "❤️", t("Fazladan Kalp"));
      item.appendChild(icon);
      const info = document.createElement("div");
      info.className = "item-info";
      info.innerHTML = `<div class="item-name">${oz.ad} <span style="color:#fbbf24">${t("✨ Efsane")}</span></div><div class="item-desc">${oz.desc}</div>`;
      item.appendChild(info);
      const btn = document.createElement("button");
      if (oz.key === "extraBot" && online.mode) {
        btn.textContent = t("Yalnız tek kişilik");
        btn.disabled = true;
      } else if (save[oz.key]) {
        btn.textContent = t("✓ Alındı");
        btn.disabled = true;
      } else {
        btn.textContent = `💰 ${oz.cost}`;
        btn.disabled = save.para < oz.cost;
        btn.onclick = () => {
          if (save.para < oz.cost) return;
          save.para -= oz.cost;
          save[oz.key] = true;
          persistSave();
          refreshShop();
          efsaneKutlama();
          konfetiPatlat();
          showToast(t("✨ {ad} alındı!", { ad: oz.ad }));
          audio.buy();
        };
      }
      item.appendChild(btn);
      if (save[oz.key]) akiPariltiEkle(item);
      content.appendChild(item);
    });
  } else if (currentShopTab === "ammo") {
    const activeChar = save.selectedChar;
    const charName = (CHARACTERS[activeChar] || { name: t("Avcı") }).name;
    const stock = ensureAmmoStock(activeChar);

    const header = document.createElement("div");
    header.className = "upgrade-header";
    header.innerHTML = t("🎯 <b>{ad}</b> için cephane", { ad: charName }) + `<br><span class="hint">${t("(Tek kullanımlık · karakter başına ayrı stok · max 9)")}</span>`;
    content.appendChild(header);

    Object.keys(WEAPONS).forEach((key) => {
      const w = WEAPONS[key];
      const own = stock[key] || 0;
      const item = document.createElement("div");
      item.className = "shop-item";

      const icon = document.createElement("div");
      icon.className = "item-icon";
      if (typeof esyaSimgesiHTML === "function") icon.innerHTML = esyaSimgesiHTML(key, w.icon, w.name); // resim ya da emoji
      else icon.textContent = w.icon;
      item.appendChild(icon);

      const info = document.createElement("div");
      info.className = "item-info";
      info.innerHTML = `<div class="item-name">${w.name} <span style="opacity:0.7">x${own}/${w.max}</span></div>
                        <div class="item-desc">${w.desc}</div>`;
      item.appendChild(info);

      const btn = document.createElement("button");
      if (own >= w.max) {
        btn.textContent = t("DOLU");
        btn.disabled = true;
      } else {
        btn.textContent = `💰 ${w.cost}`;
        btn.disabled = save.para < w.cost;
        btn.onclick = () => {
          if (save.para >= w.cost) {
            save.para -= w.cost;
            stock[key] = (stock[key] || 0) + 1;
            persistSave();
            refreshShop();
            showToast(`${w.icon} ${w.name} +1`);
            audio.buy();
          }
        };
      }
      item.appendChild(btn);
      content.appendChild(item);
    });
  } else if (currentShopTab === "guns") {
    const header = document.createElement("div");
    header.className = "upgrade-header";
    header.innerHTML = t("🔫 <b>Silahlar</b> — bütün karakterler kullanır") + `<br><span class="hint">${t("(Oyunda 🎒 Envanter'e dokunup silah değiştir)")}</span>`;
    content.appendChild(header);

    const takili = equippedGun();
    const satir = (key, ad, aciklama, resim) => {
      const g = GUNS[key];
      const item = document.createElement("div");
      item.className = "shop-item";
      if (g && g.efsane) {
        item.style.border = "2px solid #fbbf24";
        item.style.boxShadow = "0 0 12px rgba(251,191,36,0.45)";
      }
      const icon = document.createElement("div");
      icon.className = "item-icon";
      if (g && g.efsane && !(typeof gorsel === "function" && gorsel(`silah-${key}`)) &&
          !(typeof silah3d === "function" && silah3d(key))) {
        icon.textContent = g.emoji || "✨";
        icon.style.fontSize = "26px";
        icon.style.display = "flex";
        icon.style.alignItems = "center";
        icon.style.justifyContent = "center";
      } else {
        icon.style.backgroundImage = `url(${resim})`;
        icon.style.backgroundSize = "contain";
        icon.style.backgroundRepeat = "no-repeat";
        icon.style.backgroundPosition = "center";
      }
      icon.style.height = "44px";
      item.appendChild(icon);
      const info = document.createElement("div");
      info.className = "item-info";
      const rozet = g && g.efsane ? ` <span style="color:#fbbf24">${t("✨ Efsane")}</span>` : "";
      info.innerHTML = `<div class="item-name">${ad}${rozet}</div><div class="item-desc">${aciklama}</div>`;
      item.appendChild(info);
      const btn = document.createElement("button");
      if (key && !save.ownedGuns[key]) {
        btn.textContent = `💰 ${g.cost}`;
        btn.disabled = save.para < g.cost;
        btn.onclick = () => {
          if (save.para < g.cost) return;
          save.para -= g.cost;
          save.ownedGuns[key] = true;
          equipGun(key);
          refreshShop();
          if (g.efsane) efsaneKutlama();
          konfetiPatlat();
          showToast(t("🔫 {ad} alındı ve takıldı!", { ad: g.name }));
          audio.buy();
        };
      } else if (takili === key) {
        btn.textContent = t("✓ Takılı");
        btn.disabled = true;
      } else {
        btn.textContent = t("Tak");
        btn.onclick = () => { equipGun(key); refreshShop(); showToast(`🎒 ${ad}`); };
      }
      item.appendChild(btn);
      if (g && g.efsane && save.ownedGuns[key]) akiPariltiEkle(item);
      content.appendChild(item);
    };
    satir("", t("Normal silah"), t("Karakterin kendi silahı ve mermisi."), charIconUrl(save.selectedChar));
    Object.keys(GUNS).forEach((key) => satir(key, GUNS[key].name, GUNS[key].desc, gunIconUrl(key)));
  } else if (currentShopTab === "pets") {
    // Petler (pet.js): biri yanına alınır, oyunda hayaletlere saldırır
    const header = document.createElement("div");
    header.className = "upgrade-header";
    header.innerHTML = t("🐾 <b>Petler</b> — yanında koşar, hayaletlere saldırır");
    content.appendChild(header);
    const secili = petSecili();
    const satir = (key) => {
      const item = document.createElement("div");
      item.className = "shop-item";
      const icon = document.createElement("div");
      icon.className = "item-icon";
      if (key) icon.appendChild(petSimgesi(key)); else icon.textContent = "🚫";
      item.appendChild(icon);
      const info = document.createElement("div");
      info.className = "item-info";
      const pt = PETLER[key];
      info.innerHTML = key ? `<div class="item-name">${pt.simge} ${pt.ad} · ❤️ ${pt.can}</div><div class="item-desc">${pt.desc}</div>`
        : `<div class="item-name">${t("Petsiz")}</div><div class="item-desc">${t("Yalnız savaş.")}</div>`;
      item.appendChild(info);
      const btn = document.createElement("button");
      if (key && !save.ownedPets[key]) {
        btn.textContent = `💰 ${pt.cost}`;
        btn.disabled = save.para < pt.cost;
        btn.onclick = () => {
          if (save.para < pt.cost) return;
          save.para -= pt.cost;
          save.ownedPets[key] = true;
          save.pet = key;
          persistSave();
          refreshShop();
          konfetiPatlat();
          showToast(t("🐾 {ad} artık yanında!", { ad: pt.ad }));
          audio.buy();
        };
      } else if (secili === key) {
        btn.textContent = t("✓ Yanında");
        btn.disabled = true;
      } else {
        btn.textContent = key ? t("Yanına al") : t("Bırak");
        btn.onclick = () => { save.pet = key; persistSave(); refreshShop(); if (key) showToast(`${pt.simge} ${pt.ad}`); };
      }
      item.appendChild(btn);
      content.appendChild(item);
    };
    satir("");
    Object.keys(PETLER).forEach(satir);
  } else {
    // Kostümler
    Object.keys(COSTUMES).forEach((charKey) => {
      COSTUMES[charKey].forEach((cos, idx) => {
        if (idx === 0) return; // ilk kostüm zaten ücretsiz
        const owned = save.unlockedCostumes[charKey].includes(idx);
        const item = document.createElement("div");
        item.className = "shop-item";
        if (cos.efsane) {
          item.style.border = "2px solid #fbbf24";
          item.style.boxShadow = "0 0 12px rgba(168,85,247,0.55)";
        }

        const cv = document.createElement("canvas");
        cv.width = 50; cv.height = 60;
        const ctx = cv.getContext("2d");
        drawCharacter(ctx, charKey, idx, 25, 40, 56);
        const icon = document.createElement("div");
        icon.className = "item-icon";
        icon.style.backgroundImage = `url(${cv.toDataURL()})`;
        icon.style.backgroundSize = "contain";
        icon.style.backgroundRepeat = "no-repeat";
        icon.style.backgroundPosition = "center";
        icon.style.height = "50px";
        item.appendChild(icon);

        const info = document.createElement("div");
        info.className = "item-info";
        const cosRozet = cos.efsane ? ` <span style="color:#fbbf24">${t("✨ Efsane")}</span>` : "";
        info.innerHTML = `<div class="item-name">${CHARACTERS[charKey].name} - ${cos.name}${cosRozet}</div>
                          <div class="item-desc">${t("Kostüm")}</div>`;
        item.appendChild(info);

        const btn = document.createElement("button");
        if (owned) {
          if (save.selectedCostume[charKey] === idx) {
            btn.textContent = t("✓ Aktif");
            btn.disabled = true;
          } else {
            btn.textContent = t("Giy");
            btn.onclick = () => {
              save.selectedCostume[charKey] = idx;
              persistSave();
              refreshShop();
              showToast(t("Kostüm değişti!"));
            };
          }
        } else {
          btn.textContent = `💎 ${cos.cost}`;
          btn.disabled = save.elmas < cos.cost;
          btn.onclick = () => {
            if (save.elmas >= cos.cost) {
              save.elmas -= cos.cost;
              save.unlockedCostumes[charKey].push(idx);
              save.selectedCostume[charKey] = idx;
              persistSave();
              refreshShop();
              if (cos.efsane) { efsaneKutlama(); audio.buy(); }
              konfetiPatlat();
              showToast(t("🎉 Yeni kostüm!"));
              audio.unlock();
            }
          };
        }
        item.appendChild(btn);
        if (owned && cos.efsane) akiPariltiEkle(item);

        content.appendChild(item);
      });
    });
  }
  akiListeGiris(content, ".shop-item");
}

// ====== STAT HESAPLAMA ======
function getCharUpgrades(charKey) {
  if (save.upgradesByChar && save.upgradesByChar[charKey]) return save.upgradesByChar[charKey];
  return { speed: 0, damage: 0, fireRate: 0, range: 0 };
}

function computeStats(charKey) {
  const c = CHARACTERS[charKey];
  const u = getCharUpgrades(charKey);
  return {
    speed: c.baseSpeed + u.speed * 0.4,
    damage: c.baseDamage + u.damage,
    fireDelay: Math.round(c.baseFireDelay - (c.baseFireDelay - 150) * Math.min(u.fireRate, 10) / 10),
    range: c.baseRange + u.range * 35,
  };
}

// ====== TOAST ======
let toastTimer, toastZamani = 0;
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  toastZamani = performance.now();
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
  audio.toast();
}

// 3.16.0: ekran ya da pencere değişince önceki ekranın bildirimi yeni ekranın üstünde kalmasın. Ekran değişmeden hemen
// önce gösterilen bildirim (ör. "kopyalandı", sonra geri dönüş) yeni ekranda kalır.
// BUF1: dar bildirim şeridi (ilerleme çubuğunun hemen altı, üst orta). Tıklamayı engellemez; ~1,9 sn.
let bnrZamanlayici = null;
function showBanner(metin, simgeAnahtari, emoji) {
  const el = document.getElementById("bnr-serit");
  if (!el) { showToast(`${emoji || ""} ${metin}`.trim()); return; }
  const simge = simgeAnahtari ? uiSimgeHTML(simgeAnahtari, emoji || "", "") : (emoji || "");
  el.innerHTML = `<span class="bnr-simge${simge.startsWith("<img") ? " bnr-resim" : ""}" aria-hidden="true">${simge}</span><span class="bnr-metin"></span>`;
  el.querySelector(".bnr-metin").textContent = metin;
  el.classList.remove("show");
  void el.offsetWidth;
  el.classList.add("show");
  document.body.classList.add("bnr-acik");
  clearTimeout(bnrZamanlayici);
  bnrZamanlayici = setTimeout(() => { el.classList.remove("show"); document.body.classList.remove("bnr-acik"); }, 1900);
  audio.toast();
}

// BUF1: aktif güç simgeleri. Süre/uzatma/duraklatma mantığı değişmez (power.expires); yalnız sunum.
function bufGuncelle(power) {
  const kap = document.getElementById("power-bar");
  if (!kap) return;
  if (!power) {
    if (kap.firstChild) kap.innerHTML = "";
    return;
  }
  let el = kap.querySelector(".buf");
  if (!el || el._power !== power) {
    kap.innerHTML = "";
    el = document.createElement("div");
    el.className = "buf";
    el._power = power;
    el.setAttribute("role", "img");
    el.setAttribute("aria-label", power.name);
    el.innerHTML =
      `<span class="buf-halka power-ring" aria-hidden="true"><span class="buf-ic">${uiSimgeHTML(`guc-${power.type}`, power.icon, "")}</span><span class="buf-sweep"></span></span>` +
      `<span class="buf-ad"></span>`;
    el.querySelector(".buf-ad").textContent = power.name;
    kap.appendChild(el);
  }
  const kalan = Math.max(0, power.expires - performance.now());
  const oran = Math.max(0, Math.min(1, kalan / (power.duration || 15000)));
  if (!(Math.abs((el._oran ?? -1) - oran) < 0.004)) {
    el._oran = oran;
    el.querySelector(".buf-halka").style.setProperty("--ae-p", String(oran));
  }
  el.classList.toggle("bitiyor", kalan < 2000);
}

function eskiToastuKapat() {
  if (performance.now() - toastZamani < 300) return;
  const el = document.getElementById("toast");
  if (el) el.classList.remove("show");
}

// ====== OYUN MOTORU ======
const game = {
  running: false,
  paused: false,
  canvas: null,
  ctx: null,
  W: 0, H: 0,
  worldW: 1600,
  worldH: 1200,
  camera: { x: 0, y: 0 },
  player: null,
  ghosts: [],
  projectiles: [],
  pickups: [],
  _alindi: [], // host: onaylanan değerli toplamalar [kimlik, oyuncu] (son 20)
  walls: [],
  waters: [],
  particles: [],
  effects: [],
  spikes: [],
  lavas: [],
  enemyProjectiles: [],
  boss: null,
  spawnTimer: 0,
  level: 1,
  dunyaTuru: false, // Dünya Turu kipi: bölüm = rota sırası, tema ve engeller ülkeden (dunya-turu.js)
  levelTimer: 0,
  levelDuration: 25, // saniye
  ghostsRequired: 8,
  ghostsCaught: 0,
  totalCaught: 0,
  runPara: 0,
  runElmas: 0,
  runZumrut: 0,
  lastFire: 0,
  inputDir: { x: 0, y: 0 },
  lastFrame: 0,
};

// Engellerin "oyuncuya yakın olmasın" merkezi. Çevrimiçi oyunda herkesin konumu farklı olduğundan dünya
// merkezi kullanılır; yoksa host ile katılanın haritası ayrışır ve katılanın ekranında hayalet duvarın
// içinde görünür, mermisi duvara çarpar. Oyun başında (startGame) önceki turun konumu da kullanılmaz.
function layoutCenter() {
  if (game.player && !online.mode) return { cx: game.player.x, cy: game.player.y };
  return { cx: game.worldW / 2, cy: game.worldH / 2 };
}

// (x, y) engel içindeyse en yakın boş noktayı bulur: halka halka dışa doğru arar.
// blocked(x, y, r) varsayılanı duvarlardır. Hiç yer yoksa dünya merkezine en yakın boş ızgara noktası.
function freeSpot(x, y, r, blocked) {
  blocked = blocked || collidesWalls;
  const minX = 30 + r, maxX = game.worldW - 30 - r;
  const minY = 30 + r, maxY = game.worldH - 30 - r;
  const clampX = (v) => Math.max(minX, Math.min(maxX, v));
  const clampY = (v) => Math.max(minY, Math.min(maxY, v));
  x = clampX(x); y = clampY(y);
  if (!blocked(x, y, r)) return { x, y };
  for (let d = 16; d <= 480; d += 16) {
    const steps = Math.max(8, Math.round((2 * Math.PI * d) / 24));
    const a0 = Math.random() * Math.PI * 2;
    for (let k = 0; k < steps; k++) {
      const a = a0 + (k / steps) * Math.PI * 2;
      const tx = clampX(x + Math.cos(a) * d), ty = clampY(y + Math.sin(a) * d);
      if (!blocked(tx, ty, r)) return { x: tx, y: ty };
    }
  }
  let best = { x: game.worldW / 2, y: game.worldH / 2 }, bestD = Infinity;
  for (let gx = minX; gx <= maxX; gx += 20) {
    for (let gy = minY; gy <= maxY; gy += 20) {
      if (blocked(gx, gy, r)) continue;
      const dd = Math.hypot(gx - x, gy - y);
      if (dd < bestD) { bestD = dd; best = { x: gx, y: gy }; }
    }
  }
  return best;
}

// FIX1: hayaletin çevresinde 8 yönde 24 px serbestlik var mı? (hareket kodu yalnız duvarları engel sayar)
function hayaletYolAcik(x, y, r) {
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    if (!collidesWalls(x + Math.cos(a) * 24, y + Math.sin(a) * 24, r)) return true;
  }
  return false;
}

// Sıkışan doğum noktası çevresinde (30-90 px) serbest yönü olan bir yer ara.
function hayaletYakinYer(x, y, r) {
  for (let i = 0; i < 12; i++) {
    const a = Math.random() * Math.PI * 2, rr = 30 + Math.random() * 60;
    const p = freeSpot(x + Math.cos(a) * rr, y + Math.sin(a) * rr, r);
    if (hayaletYolAcik(p.x, p.y, r)) return p;
  }
  return null;
}

// 20 px ızgarada BFS: hedefe doğru ilk ara nokta (yaklaşık 40 px ileride). Yol yoksa null.
function hayaletBfsYon(sx, sy, tx, ty, r) {
  const HUC = 20, x0 = 40, y0 = 40;
  const nx = Math.max(2, Math.ceil((game.worldW - 80) / HUC));
  const ny = Math.max(2, Math.ceil((game.worldH - 80) / HUC));
  const hucre = (i) => ({ x: x0 + (i % nx) * HUC, y: y0 + Math.floor(i / nx) * HUC });
  const bul = (x, y) => Math.max(0, Math.min(ny - 1, Math.round((y - y0) / HUC))) * nx + Math.max(0, Math.min(nx - 1, Math.round((x - x0) / HUC)));
  const bas = bul(sx, sy), hedef = bul(tx, ty);
  const ata = new Int32Array(nx * ny).fill(-1);
  ata[bas] = bas;
  const kuyruk = [bas];
  let en = bas, enD = Infinity;
  for (let q = 0; q < kuyruk.length && q < 12000; q++) {
    const c = kuyruk[q], hc = hucre(c), dd = Math.hypot(hc.x - tx, hc.y - ty);
    if (dd < enD) { enD = dd; en = c; }
    if (c === hedef) { en = c; break; }
    const ix = c % nx, iy = Math.floor(c / nx);
    for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const jx = ix + ox, jy = iy + oy;
      if (jx < 0 || jy < 0 || jx >= nx || jy >= ny) continue;
      const j = jy * nx + jx;
      if (ata[j] !== -1) continue;
      const hj = hucre(j);
      if (collidesWalls(hj.x, hj.y, r)) { ata[j] = -2; continue; }
      ata[j] = c; kuyruk.push(j);
    }
  }
  const yol = [];
  for (let c = en; c !== bas && ata[c] >= 0 && yol.length < 3000; c = ata[c]) yol.push(c);
  if (!yol.length) return null;
  yol.reverse();
  return { nokta: hucre(yol[Math.min(yol.length - 1, 2)]) };
}

// Sıkışan hayaleti 120 px içinde ızgarada ulaşılabilir, yolu açık en yakın hücreye taşımak için nokta arar.
function hayaletKurtarmaNoktasi(g) {
  const HUC = 20, x0 = 40, y0 = 40;
  const nx = Math.max(2, Math.ceil((game.worldW - 80) / HUC));
  const ny = Math.max(2, Math.ceil((game.worldH - 80) / HUC));
  const hucre = (i) => ({ x: x0 + (i % nx) * HUC, y: y0 + Math.floor(i / nx) * HUC });
  const bul = (x, y) => Math.max(0, Math.min(ny - 1, Math.round((y - y0) / HUC))) * nx + Math.max(0, Math.min(nx - 1, Math.round((x - x0) / HUC)));
  const bas = bul(g.x, g.y);
  const ata = new Int32Array(nx * ny).fill(-1);
  ata[bas] = bas;
  const kuyruk = [bas];
  let en = null, enD = Infinity;
  for (let q = 0; q < kuyruk.length; q++) {
    const c = kuyruk[q], hc = hucre(c), dd = Math.hypot(hc.x - g.x, hc.y - g.y);
    if (dd > 140) continue;
    if (dd > 1 && !collidesWalls(hc.x, hc.y, g.r) && hayaletYolAcik(hc.x, hc.y, g.r) && dd < enD) { enD = dd; en = hc; }
    const ix = c % nx, iy = Math.floor(c / nx);
    for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const jx = ix + ox, jy = iy + oy;
      if (jx < 0 || jy < 0 || jx >= nx || jy >= ny) continue;
      const j = jy * nx + jx;
      if (ata[j] !== -1) continue;
      const hj = hucre(j);
      if (collidesWalls(hj.x, hj.y, g.r)) { ata[j] = -2; continue; }
      ata[j] = c; kuyruk.push(j);
    }
  }
  return en;
}

function buildWalls() {
  if (typeof dunyaBoyutunuAyarla === "function") dunyaBoyutunuAyarla();
  if (typeof yolculukAcik === "function" && yolculukAcik() && typeof yolculukHaritaKur === "function") {
    yolculukHaritaKur();
    return;
  }
  game.yuvalar = [];
  const W = game.worldW, H = game.worldH;
  game.walls = [];
  // Dış sınır
  game.walls.push({ x: 0, y: 0, w: W, h: 30 });
  game.walls.push({ x: 0, y: H - 30, w: W, h: 30 });
  game.walls.push({ x: 0, y: 0, w: 30, h: H });
  game.walls.push({ x: W - 30, y: 0, w: 30, h: H });

  // İçerideki engeller — bölüme göre farklı seed
  const seed = 7 + game.level * 13;
  function rand(n) { return ((Math.sin((seed + n) * 99.123) + 1) / 2); }
  const blockCount = Math.min(10, 6 + Math.floor((game.level - 1) / 2));
  const { cx, cy } = layoutCenter();
  for (let i = 0; i < blockCount; i++) {
    const w = 80 + rand(i) * 100;
    const h = 80 + rand(i + 50) * 100;
    const x = 100 + rand(i * 3) * (W - 200 - w);
    const y = 100 + rand(i * 7) * (H - 200 - h);
    // Oyuncunun bulunduğu yere çok yakın olmasın
    if (Math.hypot(x + w/2 - cx, y + h/2 - cy) < 200) continue;
    game.walls.push({ x, y, w, h });
  }
  engelBicimleriniKur();
}

function buildWaters() {
  if (typeof yolculukAcik === "function" && yolculukAcik()) { if (typeof engelBicimleriniKur === "function") engelBicimleriniKur(); return; }
  const W = game.worldW, H = game.worldH;
  game.waters = [];
  const seed = 23 + game.level * 17;
  function rand(n) { return ((Math.sin((seed + n) * 77.456) + 1) / 2); }
  const count = 4;
  const { cx, cy } = layoutCenter();
  let placed = 0;
  for (let i = 0; i < 25 && placed < count; i++) {
    const w0 = 110 + rand(i) * 90;
    const h0 = 80 + rand(i + 31) * 80;
    // Göller ~1,6 kat alan (kenarlar ×1,25); büyük hâli kurallara sığmazsa o göl eski boyunda kalır.
    // Büyük boy için birkaç aday konum denenir (kurallar aynı), sonra eski boya dönülür.
    let eklendi = false;
    for (const [w, h] of [[w0 * 1.25, h0 * 1.25], [w0, h0]]) {
      const deneme = w > w0 ? 40 : 1;
      for (let t = 0; t < deneme; t++) {
        const x = 80 + rand(i * 5 + t * 97) * (W - 160 - w);
        const y = 80 + rand(i * 11 + t * 89) * (H - 160 - h);
        // Oyuncu spawn alanına yakın olmasın
        if (Math.hypot(x + w/2 - cx, y + h/2 - cy) < 200) continue;
        // Duvarlarla çakışmasın
        let overlap = false;
        for (const wall of game.walls) {
          if (x < wall.x + wall.w && x + w > wall.x && y < wall.y + wall.h && y + h > wall.y) {
            overlap = true; break;
          }
        }
        if (overlap) continue;
        game.waters.push({ x, y, w, h });
        placed++;
        eklendi = true;
        break;
      }
      if (eklendi) break;
    }
  }
  engelBicimleriniKur();
}

function collidesWaters(x, y, r) {
  return engelCarpisir(game.waters, x, y, r);
}

function buildHazards() {
  if (typeof yolculukAcik === "function" && yolculukAcik()) { if (typeof engelBicimleriniKur === "function") engelBicimleriniKur(); return; }
  const W = game.worldW, H = game.worldH;
  game.spikes = [];
  game.lavas  = [];
  const lvl = game.level;
  const spikeCount = Math.min(3, Math.floor((lvl - 1) / 2)); // L1-2:0, L3-4:1, L5-6:2, L7+:3
  const lavaCount  = Math.min(2, Math.floor((lvl - 2) / 3)); // L1-4:0, L5-7:1, L8+:2
  const seed = 41 + lvl * 29;
  function rand(n) { return ((Math.sin((seed + n) * 53.317) + 1) / 2); }
  const { cx, cy } = layoutCenter();

  function place(arr, w, h, gap) {
    for (let i = 0; i < 30; i++) {
      const rx = 100 + rand(arr.length * 9 + i * 3) * (W - 200 - w);
      const ry = 100 + rand(arr.length * 11 + i * 7) * (H - 200 - h);
      // Spawn alanına yakın olmasın
      if (Math.hypot(rx + w / 2 - cx, ry + h / 2 - cy) < 240) continue;
      // Duvar/su ile çakışmasın
      let overlap = false;
      const all = game.walls.concat(game.waters, game.spikes, game.lavas);
      for (const o of all) {
        if (rx < o.x + o.w + gap && rx + w + gap > o.x && ry < o.y + o.h + gap && ry + h + gap > o.y) {
          overlap = true; break;
        }
      }
      if (overlap) continue;
      arr.push({ x: rx, y: ry, w, h });
      return;
    }
  }

  for (let i = 0; i < spikeCount; i++) place(game.spikes, 90, 90, 18);
  for (let i = 0; i < lavaCount;  i++) place(game.lavas,  110, 90, 18);
  engelBicimleriniKur();
}

function collidesSpikes(x, y, r) {
  return engelCarpisir(game.spikes, x, y, r);
}

function collidesLavas(x, y, r) {
  return engelCarpisir(game.lavas, x, y, r);
}

let _donguNo = 0; // her startGame yeni döngü açar; eski döngü kendini bitirir (iki döngü aynı anda koşmasın)

// secenek: { tur: true, ulke: <rota sırası> } Dünya Turu'nu o ülkeden başlatır (bölüm = ülke sırası); verilmezse normal oyun
function startGame(secenek) {
  showScreen("screen-game");
  setupCanvas();

  game.running = true;
  game.paused = false;
  if (muzik.duraklatildi) muzikDuraklat(false); // duraklatılıp menüye dönülen oyunun kısıklığı yeni oyuna taşınmaz
  game.menude = false;   // çevrimiçi menü açık (oyun durmaz)
  game.turBitisi = 0;    // çevrimiçi: herkes hayalet olunca turun biteceği an
  game.inputDir.x = 0; game.inputDir.y = 0;
  game.ghosts = [];
  game.projectiles = [];
  game.enemyProjectiles = [];
  game.pickups = [];
  game.particles = [];
  game.effects = [];
  game.spawnTimer = 0;
  game.dunyaTuru = !!(secenek && secenek.tur);
  game.level = game.dunyaTuru ? ulkeSirada(secenek.ulke).sira : 1;
  game.baslangicBolum = online.mode === "client" ? null : 1; // ortadan katılan istemci: ilk gelen durumun bölümü
  game.turBaslangic = game.level; // Dünya Turu: tamamlanma ödülü bu oyunda geçilen ülkelerden
  game.turOrtadan = game.dunyaTuru && !!secenek.ortadan; // çevrimiçi turda ortadan katılan: tanıtım ve müzik ilk durumla
  game.turBitti = false;
  game.turDevamKalan = game.dunyaTuru ? TUR_DEVAM_HAKKI : 0; // reklamla devam hakkı (dunya-turu.js)
  game.devamBekliyor = false;
  document.getElementById("screen-tur-devam").classList.remove("active");
  document.getElementById("btn-tur-diril").style.display = "none";
  game._turGeciste = false;
  game._turSonraki = null;
  game._turJeton = null;          // önceki oyunun damga/uçak geçişi bu oyunu ilerletmez
  game._turDamgali = null;        // bu oyunda damgası basılmış son ülke (istemci geçişi ve host olma)
  turPerdeleriniKapat();
  game.levelTimer = 0;
  game.ghostsCaught = 0;
  game.totalCaught = 0;
  game.runPara = 0;
  game.runElmas = 0;
  game.runZumrut = 0;
  game.lastFire = 0;
  game.oynananSure = 0; // reklam sıklığı: bu oyunda geçen oyun süresi (sn; duraklatma sayılmaz)

  game.player = null; // önceki turun konumu yeni haritayı etkilemesin
  buildWalls();
  buildWaters();
  buildHazards();

  // Oyuncu - güvenli bir alana koy
  const charKey = save.selectedChar;
  const stats = computeStats(charKey);
  const baslangic = (typeof yolculukAcik === "function" && yolculukAcik() && typeof yolculukBaslangic === "function")
    ? yolculukBaslangic() : { x: game.worldW / 2, y: game.worldH / 2 };
  game.player = {
    x: baslangic.x,
    y: baslangic.y,
    r: 22,
    hp: save.extraHeart ? 4 : 3,
    maxHp: save.extraHeart ? 4 : 3,
    invuln: 0,
    speed: stats.speed * 60, // px / saniye yerine ölçek
    damage: stats.damage,
    fireDelay: stats.fireDelay,
    range: stats.range,
    charKey: charKey,
    costumeIdx: save.selectedCostume[charKey],
    facing: 0,
    bakisSol: false, // 3D kareler sağa dönük: sola bakarken yatay aynalanır (ateşte hedefe, yoksa yürüme yönüne bakar)
    aci3d: null, // 3D modelin dönüşü (atan2(dx, dy)); hedefe, yoksa hareket yönüne bakar, dururken korunur
    waterImmune: !!CHARACTERS[charKey].waterImmune,
    power: null,
    aimRaise: 0,
    shootRecoil: 0,
    gun: equippedGun(),
    botTargetUntil: 0,
  };
  game.healTimer = 0;
  game.pulseTimer = 0;
  // Oyuncu duvar/su içinde kalmasın
  ensurePlayerSafe();
  kameraAniKonumla();
  if (typeof zeminKatmaniKur === "function") zeminKatmaniKur();
  spawnBot();
  petKur(); // yanına alınan pet (pet.js)
  havaKur(); // yarasalar ve fırtına bulutu (hava.js)
  closeInventory();
  refreshInventoryButton();
  // Dünya Turu'nda önce ülkenin tanıtım satırı; bot bildirimi okunabilsin diye sonra gelir
  if (game.dunyaTuru && !game.turOrtadan) showToast(bolumBildirimi());
  if (game.bot) setTimeout(() => { if (game.running && game.bot) showToast(t("🤖 Bot seninle savaşıyor! Ona dokunursan ona ateş edersin.")); }, game.dunyaTuru ? 2000 : 600);

  setupJoystick();
  setupKeyboard();

  // Boss bölüm seviyesine göre belli bir süre sonra gelir
  game.bossSpawnTimer = getBossTimerForLevel(game.level);
  game.bossDefeated = false;
  game.levelTransitioning = false;
  game.gec1 = null; // yeni oyun önceki geçişin perdesini/kartını devralmaz
  if (typeof gec1BannerKapat === "function") gec1BannerKapat();

  updateHUD();
  refreshWeaponBar();
  // Dünya Turu'nda ülkenin teaser'ı ve döngüsü (muzik.js); normal oyunda müzik yok
  if (game.dunyaTuru && !game.turOrtadan) turMuzigiBaslat(turUlkesi().kod); else turMuzigiSondur(0);
  if (typeof hikayeBolumBasladi === "function") hikayeBolumBasladi(); // hikâye: hatıra, gezgin, sahne (hikaye.js)
  game.lastFrame = performance.now();
  const no = ++_donguNo;
  requestAnimationFrame((zaman) => gameLoop(zaman, no));
}

function setupCanvas() {
  game.canvas = document.getElementById("game-canvas");
  game.ctx = game.canvas.getContext("2d");
  if (!game.canvas._botaDokun) {
    game.canvas._botaDokun = true;
    game.canvas.addEventListener("pointerdown", (e) => { closeInventory(); botaDokun(e.clientX, e.clientY); });
  }
  applyTabletClass();
  resizeCanvas();
  if (game.canvas._boyutDinleniyor) return; // her oyunda yeniden eklenmesin
  game.canvas._boyutDinleniyor = true;
  window.addEventListener("resize", () => {
    applyTabletClass();
    resizeCanvas();
  });
  if (screen && screen.orientation && screen.orientation.addEventListener) {
    screen.orientation.addEventListener("change", () => {
      applyTabletClass();
      resizeCanvas();
    });
  }
}

// Kısa kenar >= 600 CSS px ise tablet sayılır (Android tablet tanımı)
function isTabletDevice() {
  return Math.min(window.innerWidth, window.innerHeight) >= 600;
}

function applyTabletClass() {
  if (!document.body) return;
  document.body.classList.toggle("is-tablet", isTabletDevice());
}

function resizeCanvas() {
  if (!game.canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  // Tablette gameplay görüş alanını telefon hissine yakın tut: kamerayı yakınlaştır
  const viewScale = isTabletDevice() ? 1.35 : 1.0;
  game.viewScale = viewScale;
  game.canvas.width = window.innerWidth * dpr;
  game.canvas.height = window.innerHeight * dpr;
  game.canvas.style.width = window.innerWidth + "px";
  game.canvas.style.height = window.innerHeight + "px";
  game.ctx.setTransform(dpr * viewScale, 0, 0, dpr * viewScale, 0, 0);
  // game.W/H artık "dünya birimi cinsinden görüş alanı" — kamera ve görünürlük testleri bunu kullanır
  game.W = window.innerWidth / viewScale;
  game.H = window.innerHeight / viewScale;
  if (game.running) layoutWeaponBar(); // ekran dönünce silah çubuğu HUD'a binmesin
}

// ====== EKRAN GÖRSELLERİ (GOR2) ======
// Menü dışı ekranların arka planı ve joystick resimleri: gorsel(k).src ile, görsel yoksa CSS bugünkü gibi kalır.
// Arka planın üstünde koyu katman var (metin okunurluğu); resim cover, ekranı taşırmaz (yatay taşma yok).
function ekranGorselleriKur() {
  if (typeof gorsel !== "function") return;
  const arka = (id, k) => {
    const kap = document.getElementById(id), bg = kap && kap.querySelector(".menu-bg");
    const im = gorsel(k);
    if (!bg || !im || !im.src) return;
    bg.style.background = `linear-gradient(rgba(10, 8, 30, 0.55), rgba(10, 8, 30, 0.55)), url("${im.src}") center / cover no-repeat`;
  };
  for (const id of ["screen-shop", "screen-characters", "screen-account"]) arka(id, "arka-gece");
  for (const id of ["screen-online", "screen-friends", "screen-room-list", "screen-create-room", "screen-lobby"]) arka(id, "arka-kasaba");
  const simge = (el, k) => {
    const im = gorsel(k);
    if (!el || !im || !im.src) return;
    el.style.backgroundImage = `url("${im.src}")`;
    el.style.backgroundSize = "cover";
    el.style.backgroundPosition = "center";
    el.style.backgroundRepeat = "no-repeat";
  };
  simge(document.getElementById("joystick"), "joystick-taban");
  simge(document.getElementById("joystick-knob"), "joystick-topuz");
}

// ====== JOYSTICK ======
function setupJoystick() {
  const stick = document.getElementById("joystick");
  const knob = document.getElementById("joystick-knob");
  if (stick._kuruldu) return; // her oyunda yeni dinleyici eklenirse bir dokunuş N kez işlenir
  stick._kuruldu = true;
  let touchId = null;
  let centerX = 0, centerY = 0;
  // maxR: knob'un merkezden uzaklaşabileceği max yarıçap. Joystick'in gerçek boyutuna göre dinamik.
  function getMaxR() {
    const rect = stick.getBoundingClientRect();
    // Joystick yarıçapının ~%38'i (knob yarıçapı kadar pay bırakır)
    return Math.max(40, Math.min(rect.width, rect.height) * 0.38);
  }

  function start(e) {
    e.preventDefault();
    const t = e.changedTouches ? e.changedTouches[0] : e;
    if (touchId !== null) return;
    touchId = e.changedTouches ? t.identifier : "mouse";
    const rect = stick.getBoundingClientRect();
    centerX = rect.left + rect.width / 2;
    centerY = rect.top + rect.height / 2;
    stick.classList.add("aktif");
    move(e);
  }

  function move(e) {
    if (touchId === null) return;
    e.preventDefault();
    let cx, cy;
    if (e.changedTouches) {
      let found = null;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) found = e.changedTouches[i];
      }
      if (!found) return;
      cx = found.clientX; cy = found.clientY;
    } else {
      cx = e.clientX; cy = e.clientY;
    }
    let dx = cx - centerX;
    let dy = cy - centerY;
    const dist = Math.hypot(dx, dy);
    const maxR = getMaxR();
    if (dist > maxR) { dx = (dx / dist) * maxR; dy = (dy / dist) * maxR; }
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    game.inputDir.x = dx / maxR;
    game.inputDir.y = dy / maxR;
  }

  function end(e) {
    if (touchId === null) return;
    if (e.changedTouches) {
      let found = false;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) found = true;
      }
      if (!found) return;
    }
    touchId = null;
    stick.classList.remove("aktif");
    knob.style.transform = "translate(-50%, -50%)";
    game.inputDir.x = 0;
    game.inputDir.y = 0;
  }

  stick.addEventListener("touchstart", start, { passive: false });
  stick.addEventListener("touchmove", move, { passive: false });
  stick.addEventListener("touchend", end, { passive: false });
  stick.addEventListener("touchcancel", end, { passive: false });
  stick.addEventListener("mousedown", start);
  document.addEventListener("mousemove", move);
  document.addEventListener("mouseup", end);
}

// ====== KLAVYE (masaüstü test için) ======
const keys = {};
function setupKeyboard() {
  if (window._kbInited) return;
  window._kbInited = true;
  window.addEventListener("keydown", (e) => { keys[e.key.toLowerCase()] = true; });
  window.addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });
}

function readKeyboardInput() {
  let dx = 0, dy = 0;
  if (keys["arrowleft"] || keys["a"]) dx -= 1;
  if (keys["arrowright"] || keys["d"]) dx += 1;
  if (keys["arrowup"] || keys["w"]) dy -= 1;
  if (keys["arrowdown"] || keys["s"]) dy += 1;
  if (dx === 0 && dy === 0) return null;
  const len = Math.hypot(dx, dy);
  return { x: dx / len, y: dy / len };
}

// ====== OYUN DÖNGÜSÜ ======
function gameLoop(now, no) {
  if (!game.running || no !== _donguNo) return;
  const kareBas = performance.now();
  const dt = Math.min(0.05, (now - game.lastFrame) / 1000);
  game.lastFrame = now;
  if (!game.paused && now >= (game._hitStopUntil || 0)) { // AKI1: kısa vuruş donması (yalnız tek kişilik)
    game.oynananSure = (game.oynananSure || 0) + dt;
    try { update(dt, now); }
    catch (e) {
      if (window.showErrBanner) window.showErrBanner("update@" + (e.stack || e.message));
      console.error("update", e);
    }
  }
  try { render(); }
  catch (e) {
    if (window.showErrBanner) window.showErrBanner("render@" + (e.stack || e.message));
    console.error("render", e);
  }
  // 3D başarım koruması: kare başına bir kez, tüm karenin süresi (3D payıyla birlikte) bildirilir.
  if (window.UcAvci && window.UcAvci.kareBitti) window.UcAvci.kareBitti(performance.now() - kareBas);
  requestAnimationFrame((zaman) => gameLoop(zaman, no));
}

// Hayaletin periyodik sesi (hayatta olduğu sürece): boss 3 sn, küçükler 10 sn arayla
function hayaletSesi(g, now) {
  if (!g.nextSound || now < g.nextSound) return;
  if (g.isBoss) {
    audio.bigGhost();
    g.nextSound = now + 3000;
  } else {
    audio.smallGhost();
    g.nextSound = now + 10000;
  }
}

// Hayaletin kovalayacağı en yakın hedef (çevrimiçi oyunda her canlı oyuncu avlanır)
function enYakinHedef(g, hedefler) {
  let en = null, enD = Infinity;
  for (const h of hedefler) {
    const d = (h.x - g.x) * (h.x - g.x) + (h.y - g.y) * (h.y - g.y);
    if (d < enD) { enD = d; en = h; }
  }
  return en;
}

const KASIRGA_R = 130;           // 3.18.0: 110'du; hayaletler biraz daha uzaktan içine çekilir
const KASIRGA_DPS = 8;           // boss'a (yakalanmaz, yerinde hasar alır)
const KASIRGA_YAKALA_DPS = 3;    // yakalanan hayalete: hemen ölmesin, birkaç tur dönüp savrulsun
const KASIRGA_DONUS = 3.4;       // rad/sn; yörüngede dönüş hızı (içe yaklaştıkça artar)
const KASIRGA_CEKIM = 2.4;       // yörünge yarıçapına yaklaşma hızı
const KASIRGA_YORUNGE = [58, 92]; // px; yakalanan hayaletin döndüğü yarıçap aralığı (oyuncuya değmez)

// Kasırga (3.18.0, kullanıcı: "hayaletleri savura savura yok etsin veya hasar versin"): yakalanan hayalet oyuncunun
// çevresinde döner, içe çekilir, hasar alır; temas hasarı veremez ve ateş edemez. Yalnız host ve tek kişilik oyunda
// konum değişir (çevrimiçi istemcide hasar host'a gider, dönme görüntüsü yerel çizilir).
function kasirgaDondur(g, dt) {
  const P = game.player;
  let y = g.kasirgaYorunge;
  if (!y) {
    y = g.kasirgaYorunge = { a: Math.atan2(g.y - P.y, g.x - P.x), r: Math.hypot(g.x - P.x, g.y - P.y) || 1,
      hedefR: KASIRGA_YORUNGE[0] + Math.random() * (KASIRGA_YORUNGE[1] - KASIRGA_YORUNGE[0]) };
  }
  y.a += KASIRGA_DONUS * dt * (1 + Math.max(0, KASIRGA_R - y.r) / KASIRGA_R);
  y.r += (y.hedefR - y.r) * Math.min(1, KASIRGA_CEKIM * dt);
  const nx = P.x + Math.cos(y.a) * y.r, ny = P.y + Math.sin(y.a) * y.r;
  if (!collidesWalls(nx, ny, g.r)) { g.x = nx; g.y = ny; }
  else { y.a = Math.atan2(g.y - P.y, g.x - P.x); y.r = Math.hypot(g.x - P.x, g.y - P.y) || 1; } // duvara takıldı: yerinden devam
}

// Bu hayalet yerel oyuncunun kasırgasında mı (çizim ve ölüm savrulması için; istemcide de çalışır)
function kasirgadaMi(g) {
  if (!g || g.isBoss || !game.player || game.player.dead) return false;
  if (g.kasirgaYorunge) return true;
  if (!((game.player.kasirgaUntil || 0) > performance.now())) return false;
  const dx = g.x - game.player.x, dy = g.y - game.player.y;
  return dx * dx + dy * dy < KASIRGA_R * KASIRGA_R;
}

// Kasırgada ölen hayaletin solan izi dönerek dışarı savrulur
function kasirgaSavur(e, g) {
  if (!kasirgadaMi(g)) return;
  const a = Math.atan2(g.y - game.player.y, g.x - game.player.x) + 0.6; // dışa ve dönüş yönüne
  e.vx = Math.cos(a) * 460; e.vy = Math.sin(a) * 460;
  e.don = 0; e.donHiz = 16; e.savrul = true;
}

// Engele değen adım yüzey boyunca kayar (3.13.0: engeller eğri; eksen eksen denemek eğride ve sınırın mazgal
// başlarında takılıyordu). Hedef engele girerse uzaklık alanının eğiminden (yüzey normali) batma kadar dışarı itilir;
// adım yalnız girdi yönünde ilerliyor ve uzamıyorsa kabul edilir, olmazsa eskisi gibi eksen eksen denenir.
// engel(x, y, r): çarpışma; mesafe(x, y, r): en yakın engelin işaretli uzaklığı (engelMesafesi). Yürüdüyse true.
function kayarakYuru(o, dx, dy, engel, mesafe) {
  const r = o.r, boy = Math.hypot(dx, dy);
  let qx = o.x + dx, qy = o.y + dy;
  if (!engel(qx, qy, r)) { o.x = qx; o.y = qy; return true; }
  for (let k = 0; k < 3; k++) {
    const d = mesafe(qx, qy, r + 2);
    if (!(d < r)) break;
    const gx = mesafe(qx + 1, qy, r + 2) - mesafe(qx - 1, qy, r + 2), gy = mesafe(qx, qy + 1, r + 2) - mesafe(qx, qy - 1, r + 2);
    const gl = Math.hypot(gx, gy);
    if (!(gl > 1e-6)) break;
    qx += (gx / gl) * (r - d + 0.05); qy += (gy / gl) * (r - d + 0.05);
    if (!engel(qx, qy, r)) {
      const ex = qx - o.x, ey = qy - o.y;
      if (ex * dx + ey * dy > 0 && Math.hypot(ex, ey) <= boy * 1.05 + 0.05) { o.x = qx; o.y = qy; return true; }
      break;
    }
  }
  let yurudu = false;
  if (!engel(o.x + dx, o.y, r)) { o.x += dx; yurudu = true; }
  if (!engel(o.x, o.y + dy, r)) { o.y += dy; yurudu = true; }
  return yurudu;
}

// ====== AKI1: yumuşak kamera (yalnız görüntü) ======
// Kamera hedefi: oyuncu merkezde + hareket yönünde küçük ileri bakış (en çok 36 px), dünyaya kenetli.
function kameraGuncelle(dt, ani) {
  const p = game.player;
  if (!p) return;
  const az = typeof aeAzHareket === "function" && aeAzHareket();
  let hedefBakX = 0, hedefBakY = 0;
  if (!ani && !az) {
    const dx = p.x - (game._kameraOyuncuX ?? p.x);
    const dy = p.y - (game._kameraOyuncuY ?? p.y);
    const d = Math.hypot(dx, dy);
    if (d > 0.01) { hedefBakX = (dx / d) * 36; hedefBakY = (dy / d) * 36; }
  }
  game._kameraOyuncuX = p.x; game._kameraOyuncuY = p.y;
  const kb = ani ? 1 : 1 - Math.exp(-dt * 4);
  game.kameraBakX = (game.kameraBakX || 0) + (hedefBakX - (game.kameraBakX || 0)) * kb;
  game.kameraBakY = (game.kameraBakY || 0) + (hedefBakY - (game.kameraBakY || 0)) * kb;
  let tx = p.x + (game.kameraBakX || 0) - game.W / 2;
  let ty = p.y + (game.kameraBakY || 0) - game.H / 2;
  tx = Math.max(0, Math.min(game.worldW - game.W, tx));
  ty = Math.max(0, Math.min(game.worldH - game.H, ty));
  if (ani) {
    game.camera.x = tx; game.camera.y = ty;
    game.kameraBakX = 0; game.kameraBakY = 0;
    return;
  }
  const k = 1 - Math.exp(-dt * 9);
  game.camera.x += (tx - game.camera.x) * k;
  game.camera.y += (ty - game.camera.y) * k;
}
// Bölüm başında/ışınlanmada kamerayı anında hedefe oturt (uçarak gelmesin)
function kameraAniKonumla() {
  if (game.player) { game._kameraOyuncuX = game.player.x; game._kameraOyuncuY = game.player.y; }
  kameraGuncelle(0, true);
}

// AKI1: yön ters dönüşünde kısa ezilme ile avcıyı çiz (yalnız görüntü).
function oyuncuCiz(...a) {
  const ctx = a[0];
  const bas = game.player && game.player.__aeDonus;
  let q = 0;
  if (bas) {
    q = 1 - Math.min(1, (performance.now() - bas) / 120);
    if (q > 0 && !(typeof aeAzHareket === "function" && aeAzHareket())) {
      const p = game.player;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(1 + 0.12 * q, 1 - 0.10 * q);
      ctx.translate(-p.x, -p.y);
    } else q = 0;
  }
  drawCharacter(...a);
  if (q > 0) ctx.restore();
}

function update(dt, now) {
  if (typeof audio !== "undefined" && audio.ortamGuncelle) audio.ortamGuncelle(); // SES1: şelale/lav döngüleri
  if (typeof yuvaCanlilariGuncelle === "function") yuvaCanlilariGuncelle(dt); // YUV1: yuva fareleri/yarasaları
  // Oyuncu hareketi
  let dirX = game.inputDir.x;
  let dirY = game.inputDir.y;
  const kb = readKeyboardInput();
  if (kb) { dirX = kb.x; dirY = kb.y; }
  if (game.menude) { dirX = 0; dirY = 0; } // çevrimiçi menü açıkken oyun sürer, oyuncu durur
  const mag = Math.hypot(dirX, dirY);
  const playerFrozen = (game.player.frozenUntil || 0) > now || !!game.player.dusus; // dusus: köprüden suya düştü (kopru.js)
  const isSpectator = !!game.player.dead;
  let movedThisFrame = false;
  if (mag > 0.15 && (isSpectator || !playerFrozen)) {
    let mx = dirX, my = dirY;
    if (mag > 1) { mx /= mag; my /= mag; }
    // AKI1: yön tersine dönünce kısa ezilme (yalnız görüntü)
    const yon = mx > 0.15 ? 1 : mx < -0.15 ? -1 : 0;
    if (yon && game._sonYonX && yon !== game._sonYonX) game.player.__aeDonus = performance.now();
    if (yon) game._sonYonX = yon;
    game.player.facing = Math.atan2(my, mx);
    // 3D karelerin bakış yönü: yalnız belirgin yatay hareketle değişsin (|cos| > 0.2), dururken son yön korunur
    if (Math.abs(Math.cos(game.player.facing)) > 0.2) game.player.bakisSol = Math.cos(game.player.facing) < 0;
    if (isSpectator) {
      // Hayalet: duvar/su/hazard collide yok, biraz hızlı uçar
      const sp = game.player.speed * 1.4;
      game.player.x += mx * sp * dt;
      game.player.y += my * sp * dt;
      game.player.x = Math.max(20, Math.min(game.worldW - 20, game.player.x));
      game.player.y = Math.max(20, Math.min(game.worldH - 20, game.player.y));
      movedThisFrame = true;
    } else {
      const power = getActivePower();
      const speedMul = (power && power.type === "kinkin") ? 2.0 : 1.0;
      const nx = game.player.x + mx * game.player.speed * speedMul * dt;
      const ny = game.player.y + my * game.player.speed * speedMul * dt;
      const waterBlock = !game.player.waterImmune;
      // KPR1: köprü yan kuleleri yürünemez; içeride kalan oyuncu hapsolmaz
      const yanAcik = typeof kopruYanEngel === "function" && !kopruYanEngel(game.player.x, game.player.y, game.player.r);
      // Köprünün şeridinde su engel değil (kopru.js)
      const engel = (x, y, r) => collidesWalls(x, y, r) || (waterBlock && kopruluSuCarpar(x, y, r)) || (yanAcik && kopruYanEngel(x, y, r));
      const mesafe = (x, y, r) => Math.min(engelMesafesi(game.walls, x, y, r), waterBlock ? kopruluSuMesafesi(x, y, r) : Infinity);
      if (kayarakYuru(game.player, nx - game.player.x, ny - game.player.y, engel, mesafe)) movedThisFrame = true;
      else if (typeof yolculukKopruKapaliNokta === "function" && yolculukKopruKapaliNokta(nx, ny, game.player.r)) {
        const simdi = performance.now();
        if (simdi - (game._kopruKilitSes || 0) > 1500) {
          game._kopruKilitSes = simdi;
          if (typeof audio !== "undefined" && audio.hikayeSes) audio.hikayeSes("kopru-kilit");
        }
      }
    }
  }
  // 3D bakış: hedef yokken hareket yönü (atan2(dx, dy)); dururken önceki yön korunur
  if (movedThisFrame) game.player.aci3d = Math.atan2(dirX, dirY);
  // Yürüme animasyonu fazı
  if (movedThisFrame) {
    game.player.walkTimer = (game.player.walkTimer || 0) + dt;
    // AKI1: yürürken ayak tozları (0.22 sn'de bir, havuzlu)
    game._tozZaman = (game._tozZaman || 0) + dt;
    if (game._tozZaman >= 0.22) {
      game._tozZaman = 0;
      if (typeof aeTozEkle === "function") aeTozEkle(game.player.x, game.player.y + 22);
    }
  } else {
    game.player.walkTimer = 0;
    game._tozZaman = 0;
  }

  // Tehlike temasları (spectator iken atla)
  if (!isSpectator && collidesSpikes(game.player.x, game.player.y, game.player.r)) {
    if (!game.player.spikeContact) {
      game.player.frozenUntil = now + 1000;
      showFloat(t("❄️ Donduruldu!"), game.player.x, game.player.y - 30);
      audio.hit();
      navigator.vibrate?.(40);
      game.player.spikeContact = true;
    }
  } else {
    game.player.spikeContact = false;
  }
  if (!isSpectator && game.player.invuln <= 0 && collidesLavas(game.player.x, game.player.y, game.player.r)) {
    damagePlayer();
    showFloat(t("🔥 Lav!"), game.player.x, game.player.y - 30);
  }
  kopruGuncelle(dt, movedThisFrame);
  if (typeof yolculukGuncelle === "function") yolculukGuncelle(dt);
  caliGuncelle(dt); // çalıda saklanma (cali.js) // sallanan ip köprü: suyun üstünde oyalanan düşer (kopru.js)
  timsahGuncelle(dt); // sudan çıkan timsahlar: kıyıda duranı bazen ısırır (timsah.js)

  // ========== HOST-ONLY blok (spawn, AI, transition, AOE güç efektleri) ==========
  // Client modunda bu blok atlanır — state host'tan snapshot olarak gelir
  if (online.mode !== "client") {

  // Bölüm zamanlayıcısı
  game.levelTimer += dt;

  const yolculuk = typeof yolculukAcik === "function" && yolculukAcik();
  // Boss zamanlayıcısı: 60 sn sonra boss gelir (yalnız eski harita; yolculukta boss arenada çıkar)
  if (!yolculuk && game.bossSpawnTimer > 0 && !game.bossDefeated) {
    game.bossSpawnTimer -= dt;
    if (game.bossSpawnTimer <= 0) {
      game.bossSpawnTimer = 0;
      spawnBoss();
    }
  }

  // Hayalet spawn — boss yenildikten sonra yeni hayalet gelmesin (2 katı: hem cap hem hız)
  // Yolculuk haritasında Y2 denge ölçümüne göre daha seyrek doğum ve daha az aynı anda hayalet (bölge kotaları
  // zaten uzun bir bölüm demek); eski harita ve çevrimiçi eski harita değişmez: 0.8 - 0.06·bölüm, 12 + 4·bölüm (en çok 40)
  const spawnInterval = yolculuk ? Math.max(0.3, 0.9 - game.level * 0.05) : Math.max(0.25, 0.8 - game.level * 0.06);
  const maxGhosts = yolculuk ? Math.min(15, 7 + game.level) : Math.min(40, 12 + game.level * 4);
  if (yolculuk) {
    if (!gec1SpawnKilit() && typeof yolculukSpawnGuncelle === "function") yolculukSpawnGuncelle(dt, spawnInterval, maxGhosts);
  } else {
    game.spawnTimer -= dt;
    if (!gec1SpawnKilit() && !game.bossDefeated && game.spawnTimer <= 0 && game.ghosts.length < maxGhosts) {
      spawnGhost();
      game.spawnTimer = spawnInterval;
    }
  }

  // Bölüm tamamlandı mı? Boss öldü VE diğer tüm hayaletler bitti
  if (game.bossDefeated && game.ghosts.length === 0 && !game.levelTransitioning) {
    game.levelTransitioning = true;
    if (typeof gec1Basla === "function") gec1Basla(); // kutlama her yolda önce gelir
    if (game.dunyaTuru) {
      if (typeof gec1Basla !== "function") turUlkesiBitti(); // damga, uçak geçişi, sıradaki ülke
    } else if (online.mode) {
      // Çevrimiçi: zamanlama ve lt eşitlemesi eskisi gibi (kutlama + başlık kartı)
      showToast(t("🌟 Bölüm temiz! Sıradaki bölüm geliyor..."));
      const no = _donguNo; // yeni oyun başlarsa eski geçiş onu ilerletmesin
      const gecis = () => {
        if (!game.running || no !== _donguNo) return;
        if (game.paused) { setTimeout(gecis, 200); return; } // duraklatma bitince devam
        nextLevel();
      };
      setTimeout(gecis, 1800);
    }
    // Tek kişilik normal oyun: gec1Guncelle kutlama → portal/perde → kart akışını yürütür
  }

  // Çevrimiçi: herkes hayalet olduysa tur 2,5 sn sonra biter (yazım tutmazsa 5 sn sonra yeniden denenir)
  if (online.mode === "host") {
    if (!herkesOlduMu()) game.turBitisi = 0;
    else if (!game.turBitisi) game.turBitisi = now + 2500;
    else if (now >= game.turBitisi) { game.turBitisi = now + 5000; turuBitir(); }
  }

  // Hayaletler hareket eder (duvardan dolaşma mantığı ile)
  const power = getActivePower();
  const ghostMode = power && power.type === "kent"; // Kenit: hayaletler hasar veremez
  const playerInvisible = (game.player.invisibleUntil || 0) > now || !!game.player.gizli; // gizli: çalıda (cali.js)
  const playerKasirga   = (game.player.kasirgaUntil   || 0) > now;
  // Boss minion durumu: kalan boss minion sayısı bir kere hesapla
  const bossMinionsAlive = game.ghosts.some(o => o.fromBoss);
  // Kovalanacaklar: ben (görünmez ya da hayalet değilsem) ve çevrimiçi oyunda canlı, görünür diğer oyuncular
  const hedefler = [];
  if (!game.player.dead && !playerInvisible) hedefler.push({ x: game.player.x, y: game.player.y, ben: true });
  if (online.mode === "host") {
    for (const rp of Object.values(online.remotePlayers)) {
      if (rp && !rp.dead && !rp.invisible && !rp.gizli && Number.isFinite(rp.x) && Number.isFinite(rp.y)) hedefler.push({ x: rp.x, y: rp.y, ben: false });
    }
  }

  for (const g of game.ghosts) {
    // Periyodik hayalet sesi (hayatta olduğu sürece)
    hayaletSesi(g, now);
    // Yuvadan belirme: süre boyunca hareket etmez, hasar vermez, vurulamaz
    if (g.cikis > 0) { g.cikis = Math.max(0, g.cikis - dt); continue; }

    // Ejder Nefesi yanması: 1,5 sn boyunca 0,5 sn'de bir 1 hasar + turuncu kıvılcım
    if (g.burnUntil > now) {
      if (Math.random() < dt * 12) {
        game.particles.push({ x: g.x + (Math.random() - 0.5) * g.r, y: g.y + (Math.random() - 0.5) * g.r, vx: 0, vy: -40, life: 0.35, color: Math.random() < 0.5 ? "#fb923c" : "#fde047" });
      }
      if (now >= (g.burnNext || 0)) {
        g.burnNext = now + 500;
        if (online.mode !== "client") {
          g.hp -= 1;
          if (g.hp <= 0) { killGhost(g, game.ghosts.indexOf(g)); continue; }
        }
      }
    }

    // Boss minion state machine
    if (g.isBoss && g.minionState) {
      if (g.minionState === "minions_alive") {
        if (!bossMinionsAlive) {
          // Tüm minion'lar öldü → 5 sn beklemeye başla
          g.minionState = "waiting";
          g.minionTimer = 5;
        }
      } else if (g.minionState === "waiting") {
        g.minionTimer -= dt;
        if (g.minionTimer <= 0) {
          // 5 minik hayaletçik spawn et
          for (let i = 0; i < 5; i++) spawnBossMinion(g);
          g.minionState = "minions_alive";
        }
      }
    }
    // Donmuş hayalet: hareket yok, hasar yok, kasırga + temas dışında her şey atlanır
    if ((g.frozenUntil || 0) > now) {
      // Kasırga donmuş hayaleti de ezsin (hayalet oyuncu kasırga kullanamaz)
      if (playerKasirga && !game.player.dead) {
        const ddx = g.x - game.player.x, ddy = g.y - game.player.y;
        if (ddx * ddx + ddy * ddy < KASIRGA_R * KASIRGA_R) g.hp -= (g.isBoss ? KASIRGA_DPS : KASIRGA_YAKALA_DPS) * dt;
      }
      continue;
    }

    // Kasırga: yakındaki hayaleti içine çeker ve döndürür (boss yakalanmaz, aşağıda yerinde hasar alır)
    if (playerKasirga && !g.isBoss && !game.player.dead) {
      const kx = g.x - game.player.x, ky = g.y - game.player.y;
      if (g.kasirgaYorunge || kx * kx + ky * ky < KASIRGA_R * KASIRGA_R) {
        kasirgaDondur(g, dt);
        g.hp -= KASIRGA_YAKALA_DPS * dt;
        continue; // yakalanan hayalet kovalamaz, değemez, ateş edemez
      }
    } else if (g.kasirgaYorunge) delete g.kasirgaYorunge; // kasırga bitti: kaldığı yerden kovalamaya döner

    // En yakın hedefi kovalar; hedef yoksa (görünmezlik, herkes hayalet) rastgele dolaşır
    const hedef = enYakinHedef(g, hedefler);
    let tx, ty;
    if (!hedef) {
      if (!g.wanderUntil || g.wanderUntil < now) {
        g.wanderAngle = Math.random() * Math.PI * 2;
        g.wanderUntil = now + 800 + Math.random() * 1400;
      }
      tx = g.x + Math.cos(g.wanderAngle) * 200;
      ty = g.y + Math.sin(g.wanderAngle) * 200;
    } else {
      tx = hedef.x; ty = hedef.y;
    }
    const dx = tx - g.x;
    const dy = ty - g.y;
    const d = Math.hypot(dx, dy) || 1;
    // Y2D: yuvadan yeni çıkan hayalet kısa süre yarı hızda yaklaşır
    let hiz = g.speed;
    if (g._yumusakBas > 0) {
      g._yumusakBas -= dt;
      hiz *= 0.5;
    }
    const seekVx = (dx / d) * hiz;
    const seekVy = (dy / d) * hiz;

    // FIX1: sıkışma ölçümü — son 1,5 sn'de 12 px'ten az ilerleyen hayalet kurtarma dizisine girer.
    if (g._sikisBasX === undefined) {
      g._sikisBasX = g.x; g._sikisBasY = g.y; g._sikisT = 0; g._sikisSay = 0;
      g._sikisUzunX = g.x; g._sikisUzunY = g.y; g._sikisUzunSay = 0;
    }
    g._sikisSay += dt; g._sikisUzunSay += dt;
    // Dar bir dairede dolanan hayalet de sıkışmış sayılır: 3 sn'de 40 px'ten az net ilerleme.
    let uzunDusuk = false;
    if (g._sikisUzunSay >= 3) {
      uzunDusuk = Math.hypot(g.x - g._sikisUzunX, g.y - g._sikisUzunY) < 40;
      g._sikisUzunX = g.x; g._sikisUzunY = g.y; g._sikisUzunSay = 0;
    }
    if (g._sikisSay >= 1.5) {
      const ilerleme = Math.hypot(g.x - g._sikisBasX, g.y - g._sikisBasY);
      g._sikisBasX = g.x; g._sikisBasY = g.y; g._sikisSay = 0;
      g._sikisT = (ilerleme < 12 || uzunDusuk) ? (g._sikisT || 0) + 1.5 : 0;
      if (g._sikisT >= 6) {
        // 3) 6 sn: 120 px içinde ızgarada ulaşılabilir, yolu açık en yakın hücreye taşı + küçük toz bulutu
        const yer = hayaletKurtarmaNoktasi(g);
        if (yer) {
          if (Array.isArray(game.particles)) {
            for (let i = 0; i < 6; i++) {
              const a = Math.random() * Math.PI * 2;
              game.particles.push({ x: g.x, y: g.y, vx: Math.cos(a) * 30, vy: Math.sin(a) * 30 - 12, life: 0.5, color: "#cbd5e1" });
            }
          }
          g.x = yer.x; g.y = yer.y;
        }
        g._sikisT = 0; g._kacisT = 0; g._bfsUntil = 0; g._bfsHedef = null;
        g._sikisBasX = g.x; g._sikisBasY = g.y;
        g._sikisUzunX = g.x; g._sikisUzunY = g.y; g._sikisUzunSay = 0;
      } else if (g._sikisT >= 3) {
        // 2) 3 sn: 20 px ızgarada BFS ile hedefe doğru ara nokta (2 sn)
        g._bfsUntil = now + 2000; g._bfsSonra = 0; g._kacisT = 0;
      } else if (g._sikisT >= 1.5) {
        // 1) 1,5 sn: 8 pusula yönünden en uzun açık olanı 0,6-1 sn izle
        let enIyiA = null, enIyiS = -1;
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2, cx = Math.cos(a), cy2 = Math.sin(a);
          let s = 0;
          for (const adim of [20, 40, 60]) { if (collidesWalls(g.x + cx * adim, g.y + cy2 * adim, g.r)) break; s += adim; }
          if (s > enIyiS) { enIyiS = s; enIyiA = { x: cx, y: cy2 }; }
        }
        if (enIyiA && enIyiS >= 20) {
          g._kacisVx = enIyiA.x * g.speed; g._kacisVy = enIyiA.y * g.speed;
          g._kacisT = 0.6 + Math.random() * 0.4;
        }
      }
    }

    let vx = seekVx, vy = seekVy;
    // Aktif detour varsa onu kullan
    if (g.detourTime && g.detourTime > 0) {
      vx = g.detourVx; vy = g.detourVy;
      g.detourTime -= dt;
    }
    // FIX1 kurtarma, detour'dan önce gelir: BFS ara noktası ya da kaçış yönü
    if (g._bfsUntil && now < g._bfsUntil) {
      if (now >= (g._bfsSonra || 0)) {
        g._bfsSonra = now + 350;
        g._bfsHedef = hayaletBfsYon(g.x, g.y, tx, ty, g.r);
      }
      const bp = g._bfsHedef && g._bfsHedef.nokta;
      if (bp) {
        const bdx = bp.x - g.x, bdy = bp.y - g.y, bd = Math.hypot(bdx, bdy) || 1;
        vx = (bdx / bd) * g.speed; vy = (bdy / bd) * g.speed;
      }
    } else if (g._kacisT > 0) {
      g._kacisT -= dt;
      vx = g._kacisVx; vy = g._kacisVy;
    }

    const nx = g.x + vx * dt;
    const ny = g.y + vy * dt;
    let movedX = false, movedY = false;
    if (!collidesWalls(nx, g.y, g.r)) { g.x = nx; movedX = true; }
    if (!collidesWalls(g.x, ny, g.r)) { g.y = ny; movedY = true; }

    // Asıl gidiş ekseni tıkalıyken öbür eksendeki küçük kayma "ilerleme" sayılmaz: hayalet duvarın (ör. çıktığı
    // yuvanın) dibinde yerinde saymasın, dolansın (Y2 sınama botunun bulduğu takılma)
    const istenen = Math.abs(vx) + Math.abs(vy);
    const giden = (movedX ? Math.abs(vx) : 0) + (movedY ? Math.abs(vy) : 0);
    const tikali = istenen > 0 && giden < istenen * 0.35;
    if (!movedX && !movedY && collidesWalls(g.x, g.y, g.r)) {
      // Duvarın içinde kalmış: hareket edemez, mermi duvara çarpar → en yakın boş yere çıkar
      ({ x: g.x, y: g.y } = freeSpot(g.x, g.y, g.r));
      g.detourTime = 0;
    } else if (tikali) {
      // Gidiş tıkalı (iki eksen ya da asıl eksen) → 90° döndür ve detour ata
      if (!g.detourTime || g.detourTime <= 0) {
        const side = Math.random() < 0.5 ? 1 : -1;
        // Oyuncu yönünün dik vektörü
        g.detourVx = -(dy / d) * g.speed * side;
        g.detourVy =  (dx / d) * g.speed * side;
        g.detourTime = 0.5 + Math.random() * 0.6;
        g.detourGeri = false;
      } else if (!g.detourGeri) {
        // Dolanma da tıkalı: önce duvardan geri çekil (her karede yön çevirip yerinde titremesin)
        g.detourVx = -(dx / d) * g.speed;
        g.detourVy = -(dy / d) * g.speed;
        g.detourTime = 0.35;
        g.detourGeri = true;
      } else {
        // Geri çekilme de tıkalı: rastgele bir yöne
        const a = Math.random() * Math.PI * 2;
        g.detourVx = Math.cos(a) * g.speed;
        g.detourVy = Math.sin(a) * g.speed;
        g.detourTime = 0.4;
        g.detourGeri = false;
      }
    } else if (movedX && movedY) {
      // İki eksen de açık → detour bitir
      if (g.detourTime > 0) g.detourTime = 0;
    }

    // Kasırga: oyuncuya yakın hayaletlere DPS (hayalet oyuncu kasırga kullanamaz)
    if (playerKasirga && !game.player.dead) {
      const ddx = g.x - game.player.x, ddy = g.y - game.player.y;
      if (ddx * ddx + ddy * ddy < KASIRGA_R * KASIRGA_R) g.hp -= KASIRGA_DPS * dt;
    }

    // Oyuncuya değme (görünmezken hasar yok, spectator iken yok)
    if (!game.player.dead && !ghostMode && !playerInvisible && game.player.invuln <= 0) {
      const d2 = Math.hypot(g.x - game.player.x, g.y - game.player.y);
      if (d2 < g.r + game.player.r) {
        damagePlayer();
      }
    }

    // Ateş edebilen hayaletler / boss: kovaladığı hedefe
    if (g.canShoot && (g.nextShot || 0) <= now && hedef) {
      const dxf = hedef.x - g.x;
      const dyf = hedef.y - g.y;
      const df = Math.hypot(dxf, dyf) || 1;
      // Sadece hedefin ekranı civarında ve yeterince yakınsa ateş et
      const benimEkranimda = g.x > game.camera.x - 80 && g.x < game.camera.x + game.W + 80 &&
                             g.y > game.camera.y - 80 && g.y < game.camera.y + game.H + 80;
      const onScreen = hedef.ben ? benimEkranimda
        : Math.abs(dxf) < game.W / 2 + 80 && Math.abs(dyf) < game.H / 2 + 80;
      if (onScreen && df < 700) {
        const projSpeed = g.isBoss ? 280 : 240;
        // Boss çoklu mermi (geç bölümlerde 3'lü)
        const offsets = (g.isBoss && game.level >= 8) ? [-0.18, 0, 0.18] : [0];
        for (const off of offsets) {
          const ang = Math.atan2(dyf, dxf) + off;
          game.enemyProjectiles.push({
            x: g.x, y: g.y,
            vx: Math.cos(ang) * projSpeed,
            vy: Math.sin(ang) * projSpeed,
            life: 3,
            isBoss: !!g.isBoss,
          });
        }
        if (benimEkranimda) audio.fire();
        g.nextShot = now + (g.fireRate || 2400);
      } else {
        // Görüş yoksa kısa beklet
        g.nextShot = now + 500;
      }
    }
  }
  if (game.player.invuln > 0) game.player.invuln -= dt;

  // Düşman mermileri
  for (let i = game.enemyProjectiles.length - 1; i >= 0; i--) {
    const p = game.enemyProjectiles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0 || collidesWalls(p.x, p.y, 4)) {
      game.enemyProjectiles.splice(i, 1);
      continue;
    }
    // Oyuncuya isabet
    if (!ghostMode && !playerInvisible && game.player.invuln <= 0) {
      const d = Math.hypot(p.x - game.player.x, p.y - game.player.y);
      if (d < game.player.r + 7) {
        damagePlayer();
        spawnHitParticles(p.x, p.y);
        game.enemyProjectiles.splice(i, 1);
      }
    }
  }

  // Aktif güç efektleri (timer'lar). Hayalet (ölü) oyuncunun Fanatik hortumu hasar vermez.
  if (power && power.type === "fanatik" && !game.player.dead) {
    game.pulseTimer = (game.pulseTimer || 0) + dt;
    if (game.pulseTimer >= 0.5) {
      game.pulseTimer = 0;
      let any = false;
      for (const g of game.ghosts) {
        if (g.cikis > 0) continue;
        if (Math.hypot(g.x - game.player.x, g.y - game.player.y) < 110) {
          g.hp -= game.player.damage;
          any = true;
          // Itme efekti
          const ax = g.x - game.player.x, ay = g.y - game.player.y;
          const al = Math.hypot(ax, ay) || 1;
          const pushX = g.x + (ax / al) * 25, pushY = g.y + (ay / al) * 25;
          if (!collidesWalls(pushX, g.y, g.r)) g.x = pushX;
          if (!collidesWalls(g.x, pushY, g.r)) g.y = pushY;
        }
      }
      // Tornado görseli
      for (let p = 0; p < 12; p++) {
        const a = Math.random() * Math.PI * 2;
        const r = 60 + Math.random() * 50;
        game.particles.push({
          x: game.player.x + Math.cos(a) * r,
          y: game.player.y + Math.sin(a) * r,
          vx: Math.cos(a + Math.PI/2) * 80, vy: Math.sin(a + Math.PI/2) * 80,
          life: 0.4, color: "#fde047",
        });
      }
      if (any) audio.hit();
      // Ölmüş hayaletleri temizle
      for (let i = game.ghosts.length - 1; i >= 0; i--) {
        if (game.ghosts[i].hp <= 0) killGhost(game.ghosts[i], i);
      }
    }
  }

  } // ========== HOST-ONLY blok bitiş ==========

  // ========== CLIENT-ONLY: ara değerleme + invuln + hayalet-temas + düşman mermisi temas + güç hasarları ==========
  if (online.mode === "client") {
    // Host'un görüntüleri ARA_GECIKME_MS geriden ara değerlenir (sıçramasız, akıcı hareket)
    for (const g of game.ghosts) {
      aradegerle(g, now);
      hayaletSesi(g, now);
    }
    for (const p of game.enemyProjectiles) aradegerle(p, now);
    if (game.player.invuln > 0) game.player.invuln -= dt;
    const cpower = getActivePower();
    const cghostMode = cpower && cpower.type === "kent";
    const cinvisible = (game.player.invisibleUntil || 0) > now || !!game.player.gizli; // çalıda saklanma: gizli gibi
    const ckasirga = (game.player.kasirgaUntil || 0) > now;
    if (!game.player.dead && !cghostMode && !cinvisible && game.player.invuln <= 0) {
      for (const g of game.ghosts) {
        if ((g.frozenUntil || 0) > now) continue; // donmuş hayalet değemez
        const dg = Math.hypot(g.x - game.player.x, g.y - game.player.y);
        if (ckasirga && !g.isBoss && dg < KASIRGA_R) continue; // kasırgaya yakalanan hayalet değemez
        if (dg < g.r + game.player.r) {
          damagePlayer();
          break;
        }
      }
    }
    for (let i = game.enemyProjectiles.length - 1; i >= 0; i--) {
      const p = game.enemyProjectiles[i];
      if (!game.player.dead && !cghostMode && !cinvisible && game.player.invuln <= 0) {
        const d = Math.hypot(p.x - game.player.x, p.y - game.player.y);
        if (d < game.player.r + 7) {
          damagePlayer();
          spawnHitParticles(p.x, p.y);
          mermiBitti(p);
          game.enemyProjectiles.splice(i, 1);
        }
      }
    }
    // Fanatik gücü ve kasırga: hasar yarım saniyede bir host'a vuruş olarak gider
    const fanatik = cpower && cpower.type === "fanatik";
    const kasirga = (game.player.kasirgaUntil || 0) > now;
    if (!game.player.dead && (fanatik || kasirga)) {
      game.pulseTimer = (game.pulseTimer || 0) + dt;
      if (game.pulseTimer >= 0.5) {
        game.pulseTimer = 0;
        let any = false;
        for (const g of game.ghosts) {
          const d = Math.hypot(g.x - game.player.x, g.y - game.player.y);
          let dmg = 0;
          if (fanatik && d < 110) dmg += game.player.damage;
          if (kasirga && d < KASIRGA_R) dmg += (g.isBoss ? KASIRGA_DPS : KASIRGA_YAKALA_DPS) * 0.5;
          if (dmg > 0) { uzaktanVur(g, dmg); spawnHitParticles(g.x, g.y); any = true; }
        }
        if (fanatik) {
          for (let k = 0; k < 12; k++) {
            const a = Math.random() * Math.PI * 2;
            const r = 60 + Math.random() * 50;
            game.particles.push({
              x: game.player.x + Math.cos(a) * r,
              y: game.player.y + Math.sin(a) * r,
              vx: Math.cos(a + Math.PI / 2) * 80, vy: Math.sin(a + Math.PI / 2) * 80,
              life: 0.4, color: "#fde047",
            });
          }
        }
        if (any) audio.hit();
      }
    }
  }

  // Rani gücü: 5 sn'de bir 1 can (her modda kendi canıma)
  const raniGucu = getActivePower();
  if (raniGucu && raniGucu.type === "rani" && !game.player.dead) {
    game.healTimer = (game.healTimer || 0) + dt;
    if (game.healTimer >= 5) {
      game.healTimer = 0;
      if (game.player.hp < game.player.maxHp) {
        game.player.hp++;
        audio.pickup();
        showFloat("+1 ❤️", game.player.x, game.player.y - 30);
      }
    }
  }

  // Diğer oyuncular: ara değerleme, yürüme adımı, görüntü atışları; "Host bekleniyor" şeridi ve takım listesi
  if (online.mode) {
    for (const rp of Object.values(online.remotePlayers)) {
      const ox = rp.x, oy = rp.y;
      aradegerle(rp, now);
      const yurudu = Number.isFinite(ox) && Math.hypot(rp.x - ox, rp.y - oy) > 20 * dt;
      rp.yurume = (yurudu && !rp.dead) ? (rp.yurume || 0) + dt : 0;
    }
    uzaktakiAtislar(dt, now);
  }
  hostBeklemeGostergesi(now);
  takimCiz(now);

  // Otomatik atış (en yakın hayalete) — güçle hızlanır (spectator atış yapamaz)
  const firePower = getActivePower();
  let fireDelay = game.player.fireDelay;
  // Güç ve silah hız çarpanları çarpılmaz, toplanır: Ponko (÷3) + Baloncuk (0.65) → /(1 + 2 + 0.538...)
  let hizCarpani = 1;
  if (firePower && firePower.type === "ponko") hizCarpani += 3 - 1;
  if (GUNS[game.player.gun]) hizCarpani += 1 / GUNS[game.player.gun].delayMul - 1;
  fireDelay = Math.max(60, fireDelay / hizCarpani);
  updateBot(dt, now);
  if (game.bot2) updateBot(dt, now, game.bot2);
  petGuncelle(dt, now); // pet: oyuncuyu izler, yakındaki hayalete saldırır (pet.js)
  botPetAyir(); // bot ile pet üst üste binmesin
  havaGuncelle(dt); // yarasalar ve fırtına bulutu: yalnız görsel (hava.js)
  if (online.mode) uzakPetleriGuncelle(dt);
  if (keys["b"] && game.bot) game.player.botTargetUntil = now + 300; // klavye: B'ye basılıyken Bot'a ateş
  let fireTarget = (!game.player.dead && !game.player.gizli) ? nearestGhost(game.player.range) : null; // çalıda ateş yok
  const bot = game.bot;
  if (bot && !game.player.dead && game.player.botTargetUntil > now &&
      Math.hypot(bot.x - game.player.x, bot.y - game.player.y) < game.player.range * 1.5) {
    fireTarget = bot;
  }
  if (fireTarget && now - game.lastFire >= fireDelay) {
    fireProjectile(fireTarget);
    game.lastFire = now;
  }
  // Silah yükseltme/indirme animasyonu: hedef varken yukarı çekilir, yoksa iner
  if (fireTarget) {
    game.player.bakisSol = fireTarget.x < game.player.x; // 3D kareler: ateş edilen hedefe bak
    game.player.aci3d = Math.atan2(fireTarget.x - game.player.x, fireTarget.y - game.player.y);
    game.player.aimRaise = Math.min(1, (game.player.aimRaise || 0) + dt * 6);
  } else {
    game.player.aimRaise = Math.max(0, (game.player.aimRaise || 0) - dt * 4);
  }
  // Geri tepme: atışta 1'e fırlar, hızlıca söner
  game.player.shootRecoil = Math.max(0, (game.player.shootRecoil || 0) - dt * 6);

  // Mermiler
  for (let i = game.projectiles.length - 1; i >= 0; i--) {
    const p = game.projectiles[i];
    if (p.homing) steerHoming(p, dt);
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (typeof aeMermiIziGuncelle === "function") aeMermiIziGuncelle(p); // kısa iz (en çok 4 nokta)
    // Oyuncu mermisi görünür alanın (24 px pay) dışına çıkınca silinir; ekran dışına hasar gitmez
    if (p.oyuncuMermisi && gorunurPencereDisi(p.x, p.y)) {
      game.projectiles.splice(i, 1);
      continue;
    }
    p.life -= dt;
    if (p.life <= 0 || collidesWalls(p.x, p.y, 4)) {
      game.projectiles.splice(i, 1);
      continue;
    }
    // Diğer oyuncunun atışı yalnız görüntüdür (hasarı kendi cihazı bildirir): hayalete değince söner
    if (p.gorsel) {
      for (const g of game.ghosts) {
        if (Math.hypot(p.x - g.x, p.y - g.y) < g.r + 6) {
          spawnHitParticles(p.x, p.y);
          game.projectiles.splice(i, 1);
          break;
        }
      }
      continue;
    }
    // Bot'a nişanlı mermi Bot'a değdi mi?
    if (p.atBot && game.bot && Math.hypot(p.x - game.bot.x, p.y - game.bot.y) < game.bot.r + 8) {
      game.projectiles.splice(i, 1);
      damageBot(p.dmg);
      continue;
    }
    // Düşman mermisini vurdu mu? (havada engelleme)
    let blockedEnemy = false;
    for (let k = game.enemyProjectiles.length - 1; k >= 0; k--) {
      const ep = game.enemyProjectiles[k];
      const hitR = (ep.isBoss ? 11 : 8) + 4;
      if (Math.hypot(p.x - ep.x, p.y - ep.y) < hitR) {
        spawnHitParticles(ep.x, ep.y);
        // Küçük kıvılcım patlaması
        for (let z = 0; z < 6; z++) {
          const a = Math.random() * Math.PI * 2;
          const sp = 60 + Math.random() * 80;
          game.particles.push({ x: ep.x, y: ep.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.3, color: ep.isBoss ? "#fb923c" : "#c4b5fd" });
        }
        if (online.mode === "client") mermiBitti(ep);
        game.enemyProjectiles.splice(k, 1);
        game.projectiles.splice(i, 1);
        audio.hit();
        blockedEnemy = true;
        break;
      }
    }
    if (blockedEnemy) continue;
    // Hayalete vurdu mu?
    for (let j = game.ghosts.length - 1; j >= 0; j--) {
      const g = game.ghosts[j];
      if (g.cikis > 0) continue; // yuvadan yeni çıkan hayalet kısa süre vurulamaz
      if (p.hits && p.hits.includes(g)) continue; // delen mermi aynı hayalete iki kez vurmaz
      if (p.oyuncuMermisi && gorunurPencereDisi(g.x, g.y)) continue; // görünüm dışındaki hayalete hasar yok
      if (Math.hypot(p.x - g.x, p.y - g.y) < g.r + 6) {
        spawnHitParticles(p.x, p.y);
        if (p.alan > 0) {
          // Büyük yıldız: küçük alanda iki kat hasar (görsel patlama)
          game.projectiles.splice(i, 1);
          const yildizlar = [];
          for (const g2 of game.ghosts) {
            if (g2.cikis > 0) continue;
            if (Math.hypot(p.x - g2.x, p.y - g2.y) < p.alan + g2.r) yildizlar.push(g2);
          }
          for (const g2 of yildizlar) {
            if (online.mode === "client") uzaktanVur(g2, p.dmg);
            else {
              g2.hp -= p.dmg;
              if (g2.hp <= 0) killGhost(g2, game.ghosts.indexOf(g2));
            }
          }
          for (let z = 0; z < 14; z++) {
            const a = Math.random() * Math.PI * 2;
            game.particles.push({ x: p.x, y: p.y, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, life: 0.45, color: "#fde047" });
          }
          audio.hit();
          break;
        }
        if (p.maksVurus > 0) {
          // Gökkuşağı: tam 3 hayaleti deler (pierce alanı yine 3 kalır)
          (p.hits || (p.hits = [])).push(g);
          if (p.hits.length >= p.maksVurus) game.projectiles.splice(i, 1);
        } else if (p.pierce > 0) { p.pierce--; (p.hits || (p.hits = [])).push(g); }
        else game.projectiles.splice(i, 1);
        if (online.mode === "client") {
          // Client: host'a hit event gönder
          uzaktanVur(g, p.dmg);
          audio.hit();
        } else {
          g.hp -= p.dmg;
          if (p.yaki) {
            g.burnUntil = Math.max(g.burnUntil || 0, now + 1500);
            if (!g.burnNext || g.burnNext < now) g.burnNext = now + 500;
          }
          g.uzakVurdu = false; // son vuruş benim: ölürse bana sayılır
          if (g.hp <= 0) {
            killGhost(g, j);
          } else {
            hasarPuani(g, p.dmg, false); // AKI1: uçan hasar sayısı
            vurusGeriIt(g, p.vx, p.vy);  // AKI1: mermi yönünde 6 px geri itme
            audio.hit();
          }
        }
        break;
      }
    }
  }

  // Toplanabilirler — ömür dolunca yokol, mıknatıs alanı değişir
  const pickPower = getActivePower();
  const magnetR = (pickPower && pickPower.type === "mark") ? 5000 : 80;
  const magnetSpeed = (pickPower && pickPower.type === "mark") ? 420 : 200;
  const istemci = online.mode === "client";
  for (let i = game.pickups.length - 1; i >= 0; i--) {
    const p = game.pickups[i];
    if (p.life === undefined) p.life = (p.kind === "guc") ? 18 : 12;
    if (istemci) {
      p.life = Math.max(0.05, p.life - dt); // ömrü host bilir: süresi dolanı host siler, burada yalnız yanıp söner
    } else {
      p.life -= dt;
      if (p.life <= 0) { game.pickups.splice(i, 1); continue; }
    }
    const d = Math.hypot(p.x - game.player.x, p.y - game.player.y);
    if (d < magnetR && !game.player.dead) {
      const dx = (game.player.x - p.x) / Math.max(d, 1);
      const dy = (game.player.y - p.y) / Math.max(d, 1);
      p.x += dx * magnetSpeed * dt;
      p.y += dy * magnetSpeed * dt;
      p.cekiliyor = true;
    }
    if (!game.player.dead && d < game.player.r + 8) {
      const degerli = istemci && degerliToplama(p.kind);
      if (degerli && typeof p._idx === "number") {
        // Değerli toplama: ödül hemen verilmez; host onayı (ald) gelince verilir
        online.alinanlar.add(p._idx);
        online.pendingEvents.push({ type: "pickup", pi: p._idx, by: online.uid });
        online._aldBekleyen.set(p._idx, { kind: p.kind, value: p.value, x: p.x, y: p.y, t: performance.now() });
      } else {
        collectPickup(p);
        if (!istemci && online.mode === "host" && degerliToplama(p.kind)) {
          game._alindi.push([kimlik(p), String(online.uid || "")]); // host kendi aldı: istemciler onaylansın
          if (game._alindi.length > 20) game._alindi.splice(0, game._alindi.length - 20);
        }
        if (istemci && typeof p._idx === "number") {
          // Client: lokal sil + host'a sildirme event'i gönder; host silene kadar yeniden görünmesin
          online.alinanlar.add(p._idx);
          online.pendingEvents.push({ type: "pickup", pi: p._idx, by: online.uid });
        }
      }
      game.pickups.splice(i, 1);
    }
  }
  aldBekleyenleriGuncelle(performance.now()); // host onayı gelmezse eski davranış: 1,5 sn sonra yerel ödül
  if (typeof hikayeGuncelle === "function") hikayeGuncelle(); // hatıraya değme (mıknatıs çekmez)

  // Parçacıklar
  for (let i = game.particles.length - 1; i >= 0; i--) {
    const p = game.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    p.vx *= 0.92;
    p.vy *= 0.92;
    if (p.life <= 0) game.particles.splice(i, 1);
  }

  // Efektler (bomba halkası, roket)
  updateEffects(dt);

  // Silah/kasırga ile düşen hp'leri toplu temizle
  for (let i = game.ghosts.length - 1; i >= 0; i--) {
    if (game.ghosts[i].hp <= 0) killGhost(game.ghosts[i], i);
  }

  // GEC1: bölüm geçişi (duraklatılmışken update çalışmaz, sayaçlar da durur)
  if (typeof gec1Guncelle === "function") gec1Guncelle(dt, now);

  // Kasırga görseli render'da çizilir (anim.js kasirgaCiz: dönen hortumlar, rüzgâr halkası, uçuşan yapraklar)

  // Kamera takibi: kare hızından bağımsız yumuşatma + ileri bakış (AKI1)
  kameraGuncelle(dt, false);

  updateHUD();
}

// ====== GEC1: bölüm geçişi (kutlama → portal → iris → başlık kartı) ======
function gec1Aktif() { return !!(game.gec1 && game.gec1.aktif); }
function gec1SpawnKilit() { return gec1Aktif(); }

function gec1BannerKapat() {
  const el = document.getElementById("gec1-banner");
  if (el) el.classList.remove("show");
}

// Kutlama şeridi: para/elmas sayaçları kutlama boyunca yukarı sayar
function gec1BannerYaz(now, zorla) {
  const s = game.gec1, el = document.getElementById("gec1-banner");
  if (!s || !el) return;
  if (!zorla && now - (s.sonYazi || 0) < 100) return;
  s.sonYazi = now;
  const k = Math.max(0, Math.min(1, (now - s.bas) / Math.max(1, s.kutlamaSure)));
  const para = Math.round(s.para0 + (game.runPara - s.para0) * k);
  const elmas = Math.round(s.elmas0 + (game.runElmas - s.elmas0) * k);
  el.textContent = t("🎉 Bölüm {n} tamam!", { n: s.n }) + `  💰 ${para}  💎 ${elmas}`;
  el.classList.add("show");
}

// Kutlama: havai fişek kareleri varsa animasyon, yoksa mevcut parçacık patlaması
function gec1Fisek(s, now) {
  if (s.mod === "fade" || !game.player) return;
  const gecen = (now - s.bas) / 1000;
  const ates = [0.25, 0.85, 1.45];
  const ofs = [[-70, -60], [70, -75], [0, 55]];
  while (s.fisekIdx < ates.length && gecen >= ates[s.fisekIdx]) {
    const i = s.fisekIdx++;
    const x = game.player.x + ofs[i][0], y = game.player.y + ofs[i][1];
    if (typeof animHazir === "function" && animHazir("havai-fisek") && typeof animEfektEkle === "function") {
      animEfektEkle("kare", x, y, { ad: "havai-fisek", sure: 0.8, boyut: 120 });
    } else {
      for (let j = 0; j < 18; j++) {
        const a = j * (Math.PI * 2 / 18), sp = 70 + Math.random() * 90;
        game.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.7, color: ["#fde047", "#fb7185", "#38bdf8", "#34d399", "#c084fc", "#fb923c"][j % 6] });
      }
      if (typeof aeParlama === "function") aeParlama(0.12);
    }
  }
}

// Haritada kalan toplanabilirler avcıya uçar ve toplanır (istemcide para host'a aittir)
function gec1Miknatis(dt) {
  const P = game.player;
  if (!P) return;
  for (let i = game.pickups.length - 1; i >= 0; i--) {
    const p = game.pickups[i];
    const dx = P.x - p.x, dy = P.y - p.y, d = Math.hypot(dx, dy);
    if (d < P.r + 14) {
      collectPickup(p);
      game.pickups.splice(i, 1);
      continue;
    }
    const adim = Math.max(700 * dt, d * Math.min(1, dt * 6));
    p.x += (dx / Math.max(d, 1)) * adim;
    p.y += (dy / Math.max(d, 1)) * adim;
  }
}

function gec1Basla() {
  if (game.gec1) return;
  const now = performance.now();
  const az = typeof aeAzHareket === "function" ? aeAzHareket() : false;
  const P = game.player;
  game.gec1 = {
    aktif: true, asama: "kutlama", mod: az ? "fade" : "iris",
    online: !!online.mode, istemci: online.mode === "client",
    dunya: !!game.dunyaTuru,
    yolculuk: !!(typeof yolculukAcik === "function" && yolculukAcik()),
    bas: now, kutlamaSure: online.mode ? 1600 : 2200,
    n: game.level, para0: game.runPara, elmas0: game.runElmas,
    portalX: Math.min(game.worldW - 60, (P ? P.x : game.worldW / 2) + 140),
    portalY: P ? P.y : game.worldH / 2,
    portalBas: 0, portalAcik: false, otoBas: 0,
    wipeX: P ? P.x : 0, wipeY: P ? P.y : 0,
    wipeBas: 0, kartBas: 0, fisekIdx: 0, sonYazi: 0, baslik: "", tema: "",
  };
  if (P && !P.dead) P.sevincUntil = now + 2200; // mevcut sevinç pozu
  konfetiPatlat();
  gec1BannerYaz(now, true);
  let caldi = false;
  try { if (typeof audio.hikayeSes === "function") caldi = !!audio.hikayeSes("rozet"); } catch (e) { caldi = false; }
  if (!caldi) { try { if (typeof audio.yildiz === "function") audio.yildiz(); else audio.levelUp(); } catch (e) { /* ses yoksa geçiş sürer */ } }
}

// Tek kişilik akışı ilerletir; çevrimiçi zamanlama (lt + 1,8 sn) eskisi gibi kalır
function gec1Guncelle(dt, now) {
  const s = game.gec1;
  if (!s || !s.aktif) return;
  if (s.asama === "kutlama") {
    if (!s.istemci) gec1Miknatis(dt);
    gec1Fisek(s, now);
    gec1BannerYaz(now);
    if (now - s.bas >= s.kutlamaSure) {
      gec1BannerKapat();
      if (s.dunya) {
        game.gec1 = null;
        if (!s.istemci && typeof turUlkesiBitti === "function") turUlkesiBitti(); // damga + uçak yolu korunur
        return;
      }
      if (s.online) { s.asama = "bekle"; return; }
      if (s.yolculuk) { s.asama = "portal"; s.portalBas = now; s.portalAcik = false; s.otoBas = now + 3000; return; }
      s.asama = s.mod === "fade" ? "fadeKapan" : "kapan";
      s.wipeX = game.player.x; s.wipeY = game.player.y; s.wipeBas = now;
    }
    return;
  }
  if (s.asama === "portal") {
    if (!s.portalAcik && now - s.portalBas > 400) s.portalAcik = true;
    if (game.player && !game.player.dead) {
      const d = Math.hypot(s.portalX - game.player.x, s.portalY - game.player.y);
      if (now >= s.otoBas && d > 6) { // 3 sn içinde girilmezse avcı kendiliğinden yürür (girdi yok sayılır)
        const adim = Math.min(d, 190 * dt);
        game.player.x += ((s.portalX - game.player.x) / (d || 1)) * adim;
        game.player.y += ((s.portalY - game.player.y) / (d || 1)) * adim;
        game.player.facing = Math.atan2(s.portalY - game.player.y, s.portalX - game.player.x);
        game.player.walkTimer = (game.player.walkTimer || 0) + dt;
      }
      if (s.portalAcik && d < 38) {
        s.asama = s.mod === "fade" ? "fadeKapan" : "kapan";
        s.wipeX = game.player.x; s.wipeY = game.player.y; s.wipeBas = now;
      }
    }
    return;
  }
  if (s.asama === "kapan" || s.asama === "fadeKapan") {
    if (now - s.wipeBas >= 600) {
      nextLevel(); // perde karanlıkken bölüm ilerler
      s.wipeX = game.player.x; s.wipeY = game.player.y; s.wipeBas = now; s.kartBas = now;
      s.n = game.level; s.baslik = t("Bölüm {n}", { n: game.level }); s.tema = getTheme().name;
      s.asama = s.mod === "fade" ? "fadeAc" : "kart";
    }
    return;
  }
  if (s.asama === "kart" || s.asama === "fadeAc") {
    if (now - s.kartBas >= 1400) { s.aktif = false; game.gec1 = null; } // kart bitince hayalet doğar
  }
  // "bekle": çevrimiçi kendi zamanlamasıyla nextLevel çağırır; kart nextLevel'de kurulur
}

function nextLevel() {
  game.level++;
  if (game.player && !game.player.dead) game.player.sevincUntil = performance.now() + 1400; // kısa sevinç pozu
  if (!game.dunyaTuru) pgsBolum(game.level); // Dünya Turu Play Games'e yazılmaz
  game.levelTimer = 0;
  game.ghostsCaught = 0;
  if (typeof aeSeviyeEkle === "function") aeSeviyeEkle(game.player, game.level); // seviye patlaması + "Bölüm n" yazısı
  if (typeof audio.yildiz === "function") audio.yildiz(); else audio.levelUp();
  // Sahneyi yeniden kur
  game.ghosts = [];
  game.projectiles = [];
  game.enemyProjectiles = [];
  game.effects = [];
  buildWalls();
  buildWaters();
  buildHazards();
  // Yolculuk haritası: yeni bölüm en soldan başlar (oyuncu önceki bölümün arenasında, kapalı köprülerin ardında kalmasın)
  if (typeof yolculukAcik === "function" && yolculukAcik() && typeof yolculukBaslangic === "function" && game.player) {
    const b = yolculukBaslangic();
    game.player.x = b.x; game.player.y = b.y;
  }
  ensurePlayerSafe();
  kameraAniKonumla();
  if (typeof zeminKatmaniKur === "function") zeminKatmaniKur();
  spawnBot();
  petKur(); // yanına alınan pet (pet.js)
  havaKur(); // yarasalar ve fırtına bulutu (hava.js)
  if (online.mode) yenidenDog();
  showToast(bolumBildirimi());
  // Boss bölüm seviyesine göre belli bir süre sonra
  game.bossSpawnTimer = getBossTimerForLevel(game.level);
  game.bossDefeated = false;
  game.levelTransitioning = false;
  game._turGeciste = false;
  game._turSonraki = null;
  // Çevrimiçi: geçiş zamanlaması korunur; bölüm yenilenince başlık kartı görünür (perde yok)
  if (game.gec1 && game.gec1.online) {
    const now = performance.now();
    game.gec1.asama = "kart"; game.gec1.wipeBas = now - 600; game.gec1.kartBas = now;
    game.gec1.n = game.level; game.gec1.baslik = t("Bölüm {n}", { n: game.level }); game.gec1.tema = getTheme().name;
  }
  if (typeof hikayeBolumBasladi === "function") hikayeBolumBasladi(); // hikâye: yeni ülkenin hatırası ve sahnesi
}

// Bölüm başı bildirimi: Dünya Turu'nda ülkenin tanıtım satırı ("✈️ 7. İtalya — Kolezyum ve …")
function bolumBildirimi() {
  const u = turUlkesi();
  return u ? ulkeTanitimi(u) : t("📚 Bölüm {n} — {tema}", { n: game.level, tema: getTheme().name });
}

function ensurePlayerSafe() {
  if (!game.player) return;
  const r = game.player.r;
  const safe = (x, y) => !collidesWalls(x, y, r) && (game.player.waterImmune || !collidesWaters(x, y, r)) && !collidesSpikes(x, y, r) && !collidesLavas(x, y, r);
  if (safe(game.player.x, game.player.y)) return;
  if (typeof yolculukAcik === "function" && yolculukAcik() && typeof yolculukBaslangic === "function") {
    const b = yolculukBaslangic();
    if (safe(b.x, b.y)) { game.player.x = b.x; game.player.y = b.y; return; }
  }
  for (let i = 0; i < 60; i++) {
    const x = 100 + Math.random() * (game.worldW - 200);
    const y = 100 + Math.random() * (game.worldH - 200);
    if (safe(x, y)) { game.player.x = x; game.player.y = y; return; }
  }
  game.player.x = game.worldW / 2;
  game.player.y = game.worldH / 2;
}

function spawnBoss() {
  let x = game.worldW / 2, y = 200;
  let placed = false;
  if (typeof yolculukAcik === "function" && yolculukAcik() && game._yolculukDuzen) {
    // Yolculuk: boss arenanın sağ tarafında çıkar
    const ar = game._yolculukDuzen.arena;
    x = ar.x1 - 220; y = game.worldH / 2;
    ({ x, y } = freeSpot(x, y, 60, (px, py, pr) => collidesWalls(px, py, pr) || collidesWaters(px, py, pr)));
    placed = true;
  }
  for (let attempts = 0; !placed && attempts < 30; attempts++) {
    const tx = 120 + Math.random() * (game.worldW - 240);
    const ty = 120 + Math.random() * (game.worldH - 240);
    if (oyunculardanUzaklik(tx, ty) < 380) continue;
    if (collidesWalls(tx, ty, 60)) continue;
    if (collidesWaters(tx, ty, 60)) continue;
    x = tx; y = ty; placed = true; break;
  }
  if (!placed) ({ x, y } = freeSpot(x, y, 60, (px, py, pr) => collidesWalls(px, py, pr) || collidesWaters(px, py, pr)));
  const hp = 8 + game.level * 4;
  const fireRate = Math.max(1500, 2600 - (game.level - 1) * 80);
  game.ghosts.push({
    x, y, r: 44,
    speed: 38 + game.level * 5,
    hp, maxHp: hp,
    size: 95,
    isBoss: true,
    canShoot: true,
    fireRate,
    nextShot: performance.now() + 2000,
    // İlk büyük hayalet sesi spawn anında, sonra her 3 sn'de bir
    nextSound: performance.now() + 3000,
    // Minion state machine: spawn'dan 1.5 sn sonra ilk parti gelir
    minionState: "waiting",
    minionTimer: 1.5,
  });
  const u = turUlkesi();
  showToast(u ? t("👻 {ad} geldi!", { ad: u.bossAd }) : t("👑 BÖLÜM {n} BOSS!", { n: game.level }));
  audio.bigGhost();
}

function spawnBossMinion(boss) {
  const angle = Math.random() * Math.PI * 2;
  const dist = 70 + Math.random() * 50;
  let x = boss.x + Math.cos(angle) * dist;
  let y = boss.y + Math.sin(angle) * dist;
  x = Math.max(40, Math.min(game.worldW - 40, x));
  y = Math.max(40, Math.min(game.worldH - 40, y));
  // Duvar/su içinde kalmasın
  ({ x, y } = freeSpot(x, y, 18, (px, py, pr) => collidesWalls(px, py, pr) || collidesWaters(px, py, pr)));
  // Y2D: yolculukta erken bölümlerin boss minyonları da yumuşak başlar (eski: 90 + game.level * 5)
  const minyonHiz = (typeof yolculukAcik === "function" && yolculukAcik() && game.level <= 3) ? 55 : 90 + game.level * 5;
  game.ghosts.push({
    x, y, r: 14,
    speed: minyonHiz,
    hp: 1, maxHp: 1,
    size: 26,
    fromBoss: true,
    nextSound: performance.now() + Math.random() * 5000,
  });
}

// Hayalet oyuncunun dibinde doğmasın (3.15.0, kullanıcı: "hayaletler üzerimize doğuyor, bir anda can gidiyor"):
// doğduğu yer bütün canlı oyunculara (çevrimiçinde kurucu öbürlerini de bilir) en az bu kadar uzak
const HAYALET_DOGUM_UZAKLIK = 320;
function oyunculardanUzaklik(x, y) {
  let m = Infinity;
  if (game.player && !game.player.dead) m = Math.hypot(x - game.player.x, y - game.player.y);
  if (online.mode === "host") {
    for (const rp of Object.values(online.remotePlayers)) {
      if (rp && !rp.dead && Number.isFinite(rp.x) && Number.isFinite(rp.y)) m = Math.min(m, Math.hypot(x - rp.x, y - rp.y));
    }
  }
  return m;
}

function spawnGhost(aralik) {
  // aralik: { x0, x1, bolge } — yolculukta bölgenin x aralığı ve bölge numarası (isteğe bağlı)
  const range = aralik && Number.isFinite(aralik.x0) && Number.isFinite(aralik.x1) ? aralik : null;
  const margin = 60;
  let x = 0, y = 0, enIyi = -1;
  // Yolculukta (KAY1) hayalet, bölgenin hayalet yuvalarından (bölge başına 4) çıkar. Oyunculardan yeterince uzak
  // yuvalardan rastgele biri seçilir, art arda aynı yuva seçilmez (kullanıcı: "hepsi tek yuvadan yığın hâlinde
  // çıkıyor"); uzak yuva yoksa en uzağı. Çıkış noktası yuvanın önünde bir yay üzerinde dağılır (üst üste binmez).
  // Çevrimdışı eski harita ve çevrimiçi oyun değişmez.
  let kaynak = null, kaynakAgiz = null;
  if (range && Number.isFinite(range.bolge) && Array.isArray(game.yuvalar) && game.yuvalar.length && typeof yolculukYuvaAgzi === "function") {
    let enIyiD = -1, enUzak = null;
    const uygun = [];
    for (const yv of game.yuvalar) {
      if (yv.bolge !== range.bolge || yv.ulasilir === false) continue; // ağzı kapalı cepteki yuvadan doğum yok
      const agiz = yolculukYuvaAgzi(yv);
      const d = oyunculardanUzaklik(agiz.x, agiz.y);
      if (d >= HAYALET_DOGUM_UZAKLIK) uygun.push(yv);
      if (d > enIyiD) { enIyiD = d; enUzak = yv; }
    }
    const secilebilir = uygun.length > 1 ? uygun.filter((yv) => yv !== game._sonYuva) : uygun;
    kaynak = secilebilir.length ? secilebilir[Math.floor(Math.random() * secilebilir.length)] : enUzak;
    if (kaynak) {
      game._sonYuva = kaynak;
      const r = kaynak.r || 32, aci = Math.PI / 2 + (Math.random() - 0.5) * 2.2, R = r + 16 + Math.random() * 12;
      kaynakAgiz = freeSpot(kaynak.x + Math.cos(aci) * R, kaynak.y + Math.sin(aci) * R, 24);
    }
  }
  if (kaynak) {
    // FIX1: ağzında hiçbir yöne çıkamayan (duvara sıkışmış) yuvadan doğum yapma.
    let yer = kaynakAgiz;
    if (!hayaletYolAcik(yer.x, yer.y, 24)) {
      const yakin = hayaletYakinYer(yer.x, yer.y, 24);
      if (yakin) yer = yakin;
      else {
        for (const yv of game.yuvalar) {
          if (yv === kaynak || yv.bolge !== range.bolge || yv.ulasilir === false) continue;
          const p = freeSpot(yolculukYuvaAgzi(yv).x, yolculukYuvaAgzi(yv).y, 24);
          if (!hayaletYolAcik(p.x, p.y, 24)) continue;
          kaynak = yv; game._sonYuva = yv;
          yer = hayaletYakinYer(p.x, p.y, 24) || p;
          break;
        }
      }
    }
    if (typeof yuvaCanlilariUrkut === "function") yuvaCanlilariUrkut(kaynak); // YUV1: yuvadan hayalet çıkınca kaçış
    kaynak._dogumAn = performance.now();
    kaynakAgiz = yer;
    x = yer.x; y = yer.y;
  } else {
    for (let deneme = 0; deneme < 16; deneme++) {
      let ax, ay;
      if (range) {
        // Bölgenin sol/sağ kenarından doğar
        const kirp = Math.min(80, Math.max(1, (range.x1 - range.x0) * 0.25));
        ax = Math.random() < 0.5 ? range.x0 + Math.random() * kirp : range.x1 - Math.random() * kirp;
        ay = margin + Math.random() * (game.worldH - margin * 2);
      } else {
        // Haritanın kenarlarından rastgele yerler denenir; oyunculara yeterince uzak ilk yer, yoksa en uzağı
        const side = Math.floor(Math.random() * 4);
        if (side === 0) { ax = margin; ay = margin + Math.random() * (game.worldH - margin * 2); }
        else if (side === 1) { ax = game.worldW - margin; ay = margin + Math.random() * (game.worldH - margin * 2); }
        else if (side === 2) { ax = margin + Math.random() * (game.worldW - margin * 2); ay = margin; }
        else { ax = margin + Math.random() * (game.worldW - margin * 2); ay = game.worldH - margin; }
      }
      const d = oyunculardanUzaklik(ax, ay);
      if (d > enIyi) { enIyi = d; x = ax; y = ay; }
      if (d >= HAYALET_DOGUM_UZAKLIK) break;
    }
    // Duvarın içinde doğmasın: en yakın boş noktaya al (yalnız seçilen yer için; her denemede aramak kare hızını düşürür)
    ({ x, y } = freeSpot(x, y, 24));
    // FIX1: doğduğu noktadan hiçbir yöne çıkamıyorsa çevresinde (30-90 px) açık bir yer ara.
    if (!hayaletYolAcik(x, y, 24)) {
      const p = hayaletYakinYer(x, y, 24);
      if (p) { x = p.x; y = p.y; }
    }
  }

  const tier = 1 + Math.floor(game.level / 3);
  // Y2D: yolculukta erken bölümler daha yumuşak başlar, 5. bölümde bugünkü hıza ulaşır.
  // eski: const speed = 50 + game.level * 6 + Math.random() * 20;
  let hizTaban = 50 + game.level * 6;
  if (typeof yolculukAcik === "function" && yolculukAcik()) {
    const erken = { 1: 32, 2: 30, 3: 26, 4: 44 }[game.level];
    if (erken) hizTaban = erken;
  }
  const speed = hizTaban + Math.random() * 20;
  const hp = tier;
  const bolge = range && Number.isFinite(range.bolge) ? range.bolge : null;
  const Z = YOLCULUK_AYAR && YOLCULUK_AYAR.zorluk;
  // Bölüm 5+: %18 ihtimalle ateş edebilen yavaş hayalet; yolculukta bölgeyle oran artar
  let atesSans = (game.level >= 5 ? 0.18 : 0) + (bolge && Z ? Z.ates(bolge) : 0);
  // Y2D: yolculukta 1-2. bölümlerde ateş eden hayalet yok (bölge çarpanı sonraki bölgelerde devreye girer)
  if (bolge && game.level <= 2) atesSans = 0;
  const isShooter = Math.random() < atesSans;
  const ghost = {
    x, y, r: 22,
    speed: isShooter ? speed * 0.7 : speed,
    hp: isShooter ? Math.max(2, tier) : hp,
    maxHp: isShooter ? Math.max(2, tier) : hp,
    size: 40 + (tier - 1) * 4,
  };
  if (bolge && Z) {
    ghost.hp += Z.can(bolge);
    ghost.maxHp = ghost.hp;
    ghost.speed *= Z.hiz(bolge);
    ghost.bolge = bolge;
  }
  if (isShooter) {
    ghost.isShooter = true;
    ghost.canShoot = true;
    ghost.fireRate = 2400;
    ghost.nextShot = performance.now() + 1500 + Math.random() * 1500;
  }
  // Y2D: yuvasından yeni çıkan hayalet ilk 1,5 sn yarı hızda (yalnız yolculuk)
  if (bolge) ghost._yumusakBas = 1.5;
  // İlk ses 0-5 sn arası rastgele zamanda, sonra her 10 sn'de bir
  ghost.nextSound = performance.now() + Math.random() * 5000;
  // Yuvalar: 0.6 sn belirme (vurulamaz, hasar veremez), birkaç toz/sis parçacığı
  if (kaynak) {
    ghost.cikis = 0.6;
    if (Array.isArray(game.particles)) {
      for (let i = 0; i < 6; i++) {
        const a = Math.random() * Math.PI * 2, s = 18 + Math.random() * 26;
        game.particles.push({ x: kaynakAgiz.x, y: kaynakAgiz.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 18, life: 0.6, color: "#cbd5e1" });
      }
    }
  }
  game.ghosts.push(ghost);
}

function killGhost(g, idx) {
  // Solan iz: ölen hayaletin silüeti 1 sn boyunca yavaş kaybolur (kasırgada ölen dönerek savrulur)
  const iz = {
    type: "ghostFade",
    x: g.x, y: g.y,
    size: g.size,
    hp: 0,
    maxHp: g.maxHp,
    isBoss: !!g.isBoss,
    life: 1, maxLife: 1,
  };
  kasirgaSavur(iz, g);
  game.effects.push(iz);
  game.ghosts.splice(idx, 1);
  spawnDeathParticles(g.x, g.y);
  // AKI1: ölüm popu + altın hasar sayısı + vuruş donması (tek kişilik)
  if (typeof aeOlumPopEkle === "function") aeOlumPopEkle(g);
  if (!g.uzakVurdu) hasarPuani(g, game.player ? game.player.damage : 1, true);
  if (!online.mode && !(typeof aeAzHareket === "function" && aeAzHareket())) {
    if (g.isBoss) hitStopBaslat();
    else {
      const sn = performance.now();
      game._olumler = game._olumler || [];
      game._olumler.push(sn);
      while (game._olumler.length && sn - game._olumler[0] > 200) game._olumler.shift();
      if (game._olumler.length >= 3) { game._olumler.length = 0; hitStopBaslat(); }
    }
  }
  const bana = !g.uzakVurdu; // son vuruş başka oyuncudansa o kendine sayar (hayaletGitti)

  if (g.isBoss) {
    if (bana) { game.totalCaught++; pgsHayalet(game.totalCaught); }
    game.bossDefeated = true;
    showToast(t("👑 BOSS YENİLDİ! Kalan hayaletleri temizle!"));
    audio.bossDie();
    navigator.vibrate?.([100, 50, 100, 50, 200]);

    // Çoklu para patlaması
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 30 + Math.random() * 50;
      game.pickups.push({
        x: g.x + Math.cos(a) * r,
        y: g.y + Math.sin(a) * r,
        kind: "para",
        value: 12 + game.level * 3,
      });
    }
    // Garantili elmaslar
    game.pickups.push({ x: g.x - 20, y: g.y - 30, kind: "elmas", value: 1 });
    game.pickups.push({ x: g.x + 20, y: g.y - 30, kind: "elmas", value: 1 });
    // Garantili zümrüt
    game.pickups.push({ x: g.x, y: g.y - 40, kind: "zumrut", value: 1 });
    // Boss her zaman güç yıldızı düşürür
    game.pickups.push({ x: g.x, y: g.y, kind: "guc" });
    // Her 5 bölümde bir KALP düşer (4 sn'lik kısa ömür)
    if (game.level % 5 === 0) {
      game.pickups.push({ x: g.x, y: g.y - 60, kind: "kalp", life: 4 });
      showToast(t("💖 KALP! 4 saniyede topla!"));
    }

    spawnDeathParticles(g.x + 30, g.y);
    spawnDeathParticles(g.x - 30, g.y);
    return;
  }

  game.ghostsCaught++;
  if (bana) { game.totalCaught++; pgsHayalet(game.totalCaught); }
  audio.kill();

  // Patlama gücü: çevreye AOE hasar (yalnız öldüren yerel oyuncunun Güllü gücü varsa)
  const patlasin = !g._explodedFrom;
  delete g._explodedFrom; // işaret yalnız aynı patlamada zinciri engeller, kalıcı değil
  const power = getActivePower();
  if (bana && power && power.type === "gul" && patlasin) {
    for (const other of game.ghosts) {
      if (other === g) continue;
      if (Math.hypot(other.x - g.x, other.y - g.y) < 90) {
        other.hp -= Math.max(1, game.player.damage);
        if (other.hp <= 0) other._explodedFrom = true; // yalnız bu patlamada ölen zincirlemesin
      }
    }
    // Patlama görseli
    for (let p = 0; p < 14; p++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 100 + Math.random() * 120;
      game.particles.push({ x: g.x, y: g.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.5, color: "#fde047" });
    }
    audio.bossDie();
  }

  // Para düşür
  game.pickups.push({ x: g.x, y: g.y, kind: "para", value: 5 + g.maxHp * 2 });
  // Bazen elmas
  if (Math.random() < 0.12) {
    game.pickups.push({ x: g.x + 10, y: g.y, kind: "elmas", value: 1 });
  }
  // Nadiren zümrüt
  if (Math.random() < 0.04 + game.level * 0.005) {
    game.pickups.push({ x: g.x - 10, y: g.y, kind: "zumrut", value: 1 });
  }
  // Bazen güç yıldızı (%4). Çevrimiçinde kurucunun kendi gücüne değil, yalnız şansa ve haritada başka
  // güç yıldızı olmamasına bakılır (tek kişilik oyunda eski kural korunur).
  const gucYerde = game.pickups.some((p) => p.kind === "guc");
  const gucDuser = online.mode ? (!gucYerde && Math.random() < 0.04) : (!getActivePower() && Math.random() < 0.04);
  if (gucDuser) {
    game.pickups.push({ x: g.x, y: g.y - 10, kind: "guc" });
  }
}

function degerliToplama(kind) {
  return kind === "elmas" || kind === "zumrut" || kind === "guc" || kind === "kalp";
}
// İstemci: host onayı gelmeyen değerli toplamalar 1,5 sn sonra eski davranışla yerel verilir
function aldBekleyenleriGuncelle(simdi) {
  if (!online._aldBekleyen || !online._aldBekleyen.size) return;
  for (const [id, b] of online._aldBekleyen) {
    if (simdi - b.t >= 1500) {
      online._aldBekleyen.delete(id);
      collectPickup(b);
    }
  }
}

function collectPickup(p) {
  if (typeof toplamaEfekti === "function") toplamaEfekti(p);
  if (p.kind === "para") {
    game.runPara += p.value;
    showFloat(`+${p.value} 💰`, p.x, p.y, "#fbbf24");
    if (typeof aeUcusEkle === "function") aeUcusEkle(p.x, p.y, "para"); // HUD sayacına uçuş (AKI1)
    audio.pickup();
  } else if (p.kind === "elmas") {
    game.runElmas += p.value;
    showFloat(`+${p.value} 💎`, p.x, p.y, "#93c5fd");
    if (typeof aeUcusEkle === "function") aeUcusEkle(p.x, p.y, "elmas");
    audio.gem();
  } else if (p.kind === "zumrut") {
    game.runZumrut += p.value;
    showFloat(`+${p.value} 💚`, p.x, p.y, "#34d399");
    if (typeof aeUcusEkle === "function") aeUcusEkle(p.x, p.y, "para");
    audio.emerald();
  } else if (p.kind === "guc") {
    activatePower(game.player.charKey);
  } else if (p.kind === "kalp") {
    // Sadece eksik canı doldur; max can sayısını artırma
    if (game.player.hp < game.player.maxHp) {
      game.player.hp += 1;
      showFloat("+1 ❤️", p.x, p.y);
      showToast(t("💖 Can yenilendi!"));
      audio.heart();
    } else {
      showFloat(t("Can dolu"), p.x, p.y);
      audio.pickup();
    }
  }
}

function showFloat(text, x, y, renk) {
  // Yalnız "+N" ödül sayıları kısa uçan sayı havuzuna (AKI1); uyarı yazıları ("🌿 Saklandın!" gibi) okunur kalsın diye eski yolda
  if (typeof aePuanEkle === "function" && /^[+-]?\d/.test(String(text))) { aePuanEkle(x, y, text, renk || "#ffd166"); return; }
  game.particles.push({ x, y, vx: 0, vy: -40, life: 0.8, text, color: renk || "#ffd166" });
}

// AKI1: vuruş donması — yalnız tek kişilik oyunda ve hareket azaltma kapalıyken 45 ms simülasyon durur.
function hitStopBaslat() {
  if (online.mode) return;
  if (typeof aeAzHareket === "function" && aeAzHareket()) return;
  game._hitStopUntil = performance.now() + 45;
}
// AKI1: mermi yönünde 6 px geri itme; hayaleti duvarın içine sokmaz.
function vurusGeriIt(g, dx, dy) {
  if (!g) return;
  const d = Math.hypot(dx, dy) || 1;
  const nx = g.x + (dx / d) * 6, ny = g.y + (dy / d) * 6;
  if (!collidesWalls(nx, g.y, g.r)) g.x = nx;
  if (!collidesWalls(g.x, ny, g.r)) g.y = ny;
}
// AKI1: uçan hasar sayısı (öldürmede altın).
function hasarPuani(g, dmg, oldu) {
  if (typeof aePuanEkle !== "function" || !g) return;
  aePuanEkle(g.x, g.y - (g.r || 20), String(Math.max(1, Math.round(dmg || 1))), oldu ? "#fde047" : "#ffffff");
}

function spawnHitParticles(x, y) {
  if (typeof animEfektEkle === "function") animEfektEkle("kare", x, y, { ad: "vurus", sure: 0.22, boyut: 26 }); // N08
  for (let i = 0; i < 5; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 50 + Math.random() * 80;
    game.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.3, color: "#ffd166" });
  }
}

function spawnDeathParticles(x, y) {
  for (let i = 0; i < 12; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 80 + Math.random() * 100;
    game.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.6, color: "#ffffff" });
  }
}

// Efsane alım kutlaması: kısa altın-mor pırıltı patlaması (resim varsa resim, yoksa kod parçacıkları)
function efsaneKutlama() {
  const x = game.player ? game.player.x : game.camera.x + game.W / 2;
  const y = game.player ? game.player.y : game.camera.y + game.H / 2;
  const renkler = ["#fde047", "#fbbf24", "#a855f7", "#e9d5ff"];
  for (let i = 0; i < 30; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 60 + Math.random() * 180;
    game.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: 0.8, color: renkler[i % renkler.length] });
  }
  if (typeof gorsel === "function" && gorsel("efsane-parilti")) {
    game.effects.push({ type: "efsane", x, y, life: 0.9, maxLife: 0.9 });
  }
  if (typeof animEfektEkle === "function") animEfektEkle("kare", x, y, { ad: "efsane-parilti", sure: 0.6, boyut: 90 });
}

function fireProjectile(target) {
  game.shotCount = (game.shotCount || 0) + 1;
  const yildizBuyuk = game.player.gun === "yildiz" && game.shotCount % 5 === 0;
  const dx = target.x - game.player.x;
  const dy = target.y - game.player.y;
  const d = Math.hypot(dx, dy) || 1;
  const gun = GUNS[game.player.gun];
  const speed = gun ? gun.speed : 480;
  const baseAng = Math.atan2(dy, dx);
  const power = getActivePower();
  // Güç ve silah hasar çarpanları çarpılmaz, toplanır: Veryi (×3) + Bazuka (×3) → ×5
  let dmgCarpani = 1;
  if (power && power.type === "veryi") dmgCarpani += 3 - 1;
  if (gun) dmgCarpani += gun.dmgMul - 1;
  let dmg = game.player.damage * dmgCarpani;

  // Mermi deseni
  let offsets = [0]; // tek mermi varsayılan
  if (power && power.type === "kornet") offsets = [-0.22, 0, 0.22]; // 3'lü koni
  else if (power && power.type === "beti") offsets = [-0.5, -0.25, 0, 0.25, 0.5]; // 5'li yayılım
  else if (power && power.type === "silsen") offsets = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (i * Math.PI) / 4); // 8 yöne çiçek
  const gunOffsets = (gun && gun.spread) || [0];
  const homing = !!(power && power.type === "sercin");

  for (const off of offsets) {
    for (const goff of gunOffsets) {
      const a = baseAng + off + goff;
      // Yeşil Çiftli: namlunun iki yanından paralel iki mermi
      const yanlar = (gun && gun.twin) ? [-6, 6] : [0];
      for (const yan of yanlar) {
        game.projectiles.push({
          x: game.player.x - Math.sin(a) * yan,
          y: game.player.y + Math.cos(a) * yan,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed,
          life: homing ? 2.2 : ((gun && gun.life) || 1.5),
          dmg: yildizBuyuk ? dmg * 2 : dmg,
          charKey: game.player.charKey,
          gun: game.player.gun || undefined,
          pierce: (gun && gun.pierce) || 0,
          maksVurus: game.player.gun === "gokkusagi" ? 3 : 0,
          homing,
          buyukYildiz: yildizBuyuk,
          alan: yildizBuyuk ? 85 : 0,
          yaki: game.player.gun === "ejder",
          atBot: target === game.bot,
          oyuncuMermisi: true,
        });
      }
    }
  }
  game.player.shootRecoil = 1;
  game.player.aimRaise = 1;
  // Takılı envanter silahı varsa sesine anahtarı verilir; yoksa eski çağrı aynen kalır
  const _aeSilah = typeof equippedGun === "function" ? equippedGun() : "";
  if (_aeSilah) audio.fire(_aeSilah); else audio.fire();
}

// Oyuncu mermisi kamera görünümünün 24 px dışına çıktı mı? (görünüm dışındaki hayaletlere hasar yok)
function gorunurPencereDisi(x, y, pay = 24) {
  const cam = game.camera;
  return x < cam.x - pay || x > cam.x + game.W + pay ||
         y < cam.y - pay || y > cam.y + game.H + pay;
}

function nearestGhost(maxR) {
  let best = null;
  let bestD = maxR;
  const cam = game.camera;
  const pad = 30;
  for (const g of game.ghosts) {
    // Sadece ekrana girmiş hayaletleri hedefle (kamera viewport)
    if (g.x < cam.x - pad || g.x > cam.x + game.W + pad ||
        g.y < cam.y - pad || g.y > cam.y + game.H + pad) continue;
    const d = Math.hypot(g.x - game.player.x, g.y - game.player.y);
    if (d < bestD) { best = g; bestD = d; }
  }
  return best;
}

// Serçin gücü: tüy en yakın hayalete doğru döner
function steerHoming(p, dt) {
  let best = null, bestD = 320;
  for (const g of game.ghosts) {
    const d = Math.hypot(g.x - p.x, g.y - p.y);
    if (d < bestD) { best = g; bestD = d; }
  }
  if (!best) return;
  const sp = Math.hypot(p.vx, p.vy);
  const cur = Math.atan2(p.vy, p.vx);
  let fark = Math.atan2(best.y - p.y, best.x - p.x) - cur;
  while (fark > Math.PI) fark -= Math.PI * 2;
  while (fark < -Math.PI) fark += Math.PI * 2;
  const a = cur + Math.max(-7 * dt, Math.min(7 * dt, fark));
  p.vx = Math.cos(a) * sp;
  p.vy = Math.sin(a) * sp;
}

// ====== BOT ======
// Tek kişilik oyunda oyuncunun yanında savaşan yardımcı (çizim: "Adı: Bot"). Hayaletler ona zarar vermez;
// oyuncu ona dokunursa (klavyede B) ona ateş eder, yenilince içinden 1 kalp çıkar. Her bölüm başında yeniden gelir.
// Çevrimiçi oyunda yok: konumu ve canı odaya senkronlanmaz.
const BOT_MAX_HP = 6;
// Bot için de köprünün yan kuleleri (yürünebilir şeridin dışı) kapalı; şeritte kalınca geçiş engellenmez
const botEngel = (x, y, r) => collidesWalls(x, y, r) || kopruluSuCarpar(x, y, r) || (typeof kopruYanEngel === "function" && kopruYanEngel(x, y, r));
const botMesafe = (x, y, r) => Math.min(engelMesafesi(game.walls, x, y, r), kopruluSuMesafesi(x, y, r));

// İki nokta arasındaki düz yol köprü dışında sudan geçiyor mu?
function suCizgisiKesiyor(x0, y0, x1, y1) {
  const d = Math.hypot(x1 - x0, y1 - y0);
  const n = Math.max(2, Math.ceil(d / 20));
  for (let i = 1; i < n; i++) {
    const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
    if (collidesWaters(x, y, 1) && !koprudeMi(x, y)) return true;
  }
  return false;
}

// Oyuncunun yanında, oyuncuya düz yolu köprü dışında sudan geçmeyen boş bir nokta
function suGecidiTemizYer(cx, cy, r, engel, tercih) {
  const adaylar = tercih ? [tercih] : [];
  adaylar.push([-50, 30], [50, 30], [-50, -30], [50, -30], [0, 55], [0, -55], [-70, 0], [70, 0]);
  let son = null;
  for (const [ox, oy] of adaylar) {
    const yer = freeSpot(cx + ox, cy + oy, r, engel);
    if (!suCizgisiKesiyor(yer.x, yer.y, cx, cy)) return yer;
    if (!son) son = yer;
  }
  return son || freeSpot(cx, cy, r, engel);
}

// Bot suyun öbür yanındaysa en yakın açık köprüden geçirecek ara hedef; yoksa null
function botKopruNoktasi(b, px, py) {
  if (!b.kopru || b.kopruAsama >= 2) {
    b.kopru = null; b.kopruAsama = 0;
    if (!suCizgisiKesiyor(b.x, b.y, px, py)) return null;
    const liste = (typeof koprulerHazir === "function" ? koprulerHazir() : []) || [];
    const mx = (b.x + px) / 2, my = (b.y + py) / 2;
    let en = Infinity, sec = null;
    for (const k of liste) {
      const kx = k.yatay ? (k.a + k.b) / 2 : k.c, ky = k.yatay ? k.c : (k.a + k.b) / 2;
      const dd = Math.hypot(kx - mx, ky - my);
      if (dd < en) { en = dd; sec = k; }
    }
    if (!sec) return null;
    // Giriş ucu botun bulunduğu yan, çıkış ucu oyuncunun bulunduğu yan (geçiş boyunca sabit)
    const uclar = kopruUclari(sec);
    const karsi = Math.hypot(uclar[0].x - px, uclar[0].y - py) <= Math.hypot(uclar[1].x - px, uclar[1].y - py) ? uclar[0] : uclar[1];
    b.kopru = sec; b.kopruAsama = 0;
    b.kopruKarsi = karsi;
    b.kopruKendi = karsi === uclar[0] ? uclar[1] : uclar[0];
  }
  const kendi = b.kopruKendi, karsi = b.kopruKarsi;
  if (!kendi || !karsi) { b.kopru = null; b.kopruAsama = 0; return null; }
  // Köprü ucuna varınca değil, şeride girince öteki uca yönel: uzaktan dönünce bot suya girmesin
  const seritte = Math.abs(b.kopru.yatay ? b.y - b.kopru.c : b.x - b.kopru.c) <= KOPRU.serbest - 6;
  if (b.kopruAsama === 0 && Math.hypot(b.x - kendi.x, b.y - kendi.y) < 24 && seritte) b.kopruAsama = 1;
  // Karşı uçtan ancak 10 px kalınca çık: 24 px erken bırakınca bot gölün çarpışmasına girip kilitleniyordu
  if (b.kopruAsama >= 1 && Math.hypot(b.x - karsi.x, b.y - karsi.y) < 10) {
    b.kopru = null; b.kopruAsama = 0; b.kopruKendi = null; b.kopruKarsi = null; return null;
  }
  return b.kopruAsama === 0 ? kendi : karsi;
}

// Bot ile pet üst üste binmesin: pet saldırırken yalnız bot itilir
function botPetAyir() {
  const b = game.bot, p = game.pet;
  if (!b || !p || online.mode) return;
  const dx = p.x - b.x, dy = p.y - b.y, d = Math.hypot(dx, dy);
  const min = b.r + p.r + 14;
  if (d >= min || d < 1e-6) return;
  const it = (min - d) / 2, ux = dx / d, uy = dy / d;
  kayarakYuru(b, -ux * it, -uy * it, botEngel, botMesafe);
  if (p.saldiriyor) return;
  if (PETLER[p.tur].ucar) { p.x += ux * it; p.y += uy * it; }
  else kayarakYuru(p, ux * it, uy * it, petEngel, petMesafe);
}

function spawnBot() {
  game.bot = null;
  game.bot2 = null;
  if (online.mode || !game.player) return;
  const yeniBot = (yer) => ({
    x: yer.x, y: yer.y, r: 18, hp: BOT_MAX_HP, maxHp: BOT_MAX_HP,
    walkTimer: 0, lastFire: 0, aimRaise: 0, shootRecoil: 0, hitFlash: 0, stuck: 0,
    sonMesafe: 1e9, ilerlemeSure: 0, kopru: null, kopruAsama: 0,
  });
  game.bot = yeniBot(freeSpot(game.player.x + 60, game.player.y + 10, 18, botEngel));
  if (save.extraBot) game.bot2 = yeniBot(freeSpot(game.player.x - 60, game.player.y + 10, 18, botEngel));
}

function updateBot(dt, now, b = game.bot) {
  if (!b || online.mode) return;
  if (b.hitFlash > 0) b.hitFlash -= dt;
  b.shootRecoil = Math.max(0, b.shootRecoil - dt * 6);
  // Suyun öbür yanındaysa köprü ara hedefi; yoksa doğrudan oyuncuya yürü
  const pk = botKopruNoktasi(b, game.player.x, game.player.y);
  const hedefX = pk ? pk.x : game.player.x, hedefY = pk ? pk.y : game.player.y;
  const dx = hedefX - b.x, dy = hedefY - b.y;
  const d = Math.hypot(dx, dy) || 1;
  const dp = Math.hypot(game.player.x - b.x, game.player.y - b.y) || 1;
  let yurudu = false;
  if (d > (pk ? 6 : 80)) {
    const adim = game.player.speed * 0.95 * dt;
    yurudu = kayarakYuru(b, (dx / d) * adim, (dy / d) * adim, botEngel, botMesafe);
  }
  // İlerleme: oyuncuya uzaklık 2,5 sn'de 20 px azalmadıysa oyuncunun yanına ışınlan
  if (b.sonMesafe === undefined) { b.sonMesafe = dp; b.ilerlemeSure = 0; }
  if (pk) {
    b.sonMesafe = Math.min(b.sonMesafe, dp);
    b.ilerlemeSure = 0;
  } else {
    if (dp <= 110) { b.sonMesafe = dp; b.ilerlemeSure = 0; } // izleme mesafesinde duruyor: takılma sayılmaz
    else b.ilerlemeSure += dt;
    if (dp <= b.sonMesafe - 20) { b.sonMesafe = dp; b.ilerlemeSure = 0; }
    if (dp > 650 || b.ilerlemeSure > 2.5) {
      const yer = suGecidiTemizYer(game.player.x, game.player.y, b.r, botEngel, [-50, 30]);
      b.x = yer.x; b.y = yer.y; b.ilerlemeSure = 0; b.sonMesafe = 1e9; b.kopru = null; b.kopruAsama = 0;
    }
  }
  b.walkTimer = yurudu ? b.walkTimer + dt : 0;
  // En yakın hayalete ateş
  let hedef = null, en = 240;
  for (const g of game.ghosts) {
    const gd = Math.hypot(g.x - b.x, g.y - b.y);
    if (gd < en) { en = gd; hedef = g; }
  }
  b.aimRaise = hedef ? Math.min(1, b.aimRaise + dt * 6) : Math.max(0, b.aimRaise - dt * 4);
  if (hedef && now - b.lastFire >= 750) {
    const a = Math.atan2(hedef.y - b.y, hedef.x - b.x);
    game.projectiles.push({
      x: b.x, y: b.y, vx: Math.cos(a) * 460, vy: Math.sin(a) * 460, life: 1.2,
      dmg: 1 + Math.floor(game.level / 5), charKey: "bot",
    });
    b.lastFire = now;
    b.shootRecoil = 1;
  }
}

function damageBot(dmg) {
  const b = game.bot;
  if (!b) return;
  b.hp -= dmg;
  b.hitFlash = 0.25;
  spawnHitParticles(b.x, b.y);
  audio.hit();
  if (b.hp > 0) {
    showFloat(t("Ay!"), b.x, b.y - 40);
    return;
  }
  spawnDeathParticles(b.x, b.y);
  game.pickups.push({ x: b.x, y: b.y, kind: "kalp" });
  showToast(t("💔 Bot yenildi! İçinden kalp çıktı."));
  game.bot = null;
  game.player.botTargetUntil = 0;
}

// Ekrana dokunuş Bot'un üstündeyse 2,5 sn boyunca ona ateş et
function botaDokun(clientX, clientY) {
  const b = game.bot;
  if (!game.running || game.paused || !b || !game.player || game.player.dead) return;
  const vs = game.viewScale || 1;
  const wx = clientX / vs + game.camera.x;
  const wy = clientY / vs + game.camera.y;
  if (Math.hypot(wx - b.x, wy - (b.y - 8)) > 46) return;
  game.player.botTargetUntil = performance.now() + 2500;
}

// Bot etiketi: isim, can çubuğu, hedef işareti (3D ve 2D çizimde ortak)
function botEtiketi(ctx, b) {
  ctx.save();
  ctx.font = "800 12px Nunito, \"Baloo Bhaijaan 2\", sans-serif";
  ctx.textAlign = "center";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#000";
  ctx.fillStyle = "#67e8f9";
  ctx.strokeText("🤖 Bot", b.x, b.y - 46);
  ctx.fillText("🤖 Bot", b.x, b.y - 46);
  if (b.hp < b.maxHp) {
    const w = 34, oran = Math.max(0, b.hp / b.maxHp);
    ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(b.x - w / 2 - 1, b.y - 41, w + 2, 6);
    ctx.fillStyle = "#dc2626"; ctx.fillRect(b.x - w / 2, b.y - 40, w, 4);
    ctx.fillStyle = "#10b981"; ctx.fillRect(b.x - w / 2, b.y - 40, w * oran, 4);
  }
  if (game.player && game.player.botTargetUntil > performance.now()) {
    ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(b.x, b.y - 8, 34, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

// Bot'un görünüşü (çizimdeki gibi): uzun saç, kocaman gözler, tırtıklı ağız, köşeli gövde ve eller
function drawBot(ctx, b) {
  const size = 62, s = size / 100;
  const walk = b.walkTimer > 0 ? Math.sin(b.walkTimer * 12) : 0;
  const bob = Math.abs(walk) * 1.5 * s;
  ctx.save();
  ctx.translate(b.x, b.y);
  zeminGolgesi(ctx, 0, 45 * s, s); // GLG1: gölge yerde, sallanmadan
  ctx.translate(0, -bob);
  if (b.walkTimer > 0 && typeof anmYalpa === "function") { // ANM1: yürürken hafif yalpa (ayak hizasından)
    ctx.translate(0, 45 * s); ctx.rotate(anmYalpa(b.walkTimer * 6, 0.045)); ctx.translate(0, -45 * s);
  }
  // 3D bot (uc-avci.js): hazırsa gövdeyi UcAvci çizer, etiket yine burada kalır.
  if (window.UcAvci && window.UcAvci.hazir) {
    const px = (game.player && Number.isFinite(game.player.x)) ? game.player.x : b.x;
    const py = (game.player && Number.isFinite(game.player.y)) ? game.player.y : b.y + 1;
    const aci = Math.atan2(px - b.x, py - b.y);
    if (ucCizOlc(ctx, {
      charKey: "bot", costumeIdx: 0, x: 0, y: 0, size, aci,
      yuruyor: b.walkTimer > 0, walkPhase: b.walkTimer,
      aimRaise: b.aimRaise || 0, nisan: (b.aimRaise || 0) > 0.4,
      shootRecoil: b.shootRecoil || 0, kimlik: "bot",
    })) { ctx.restore(); botEtiketi(ctx, b); return; }
  }
  // ChatGPT bot resmi: gövde resimden, etiket yine burada; vuruş parlaması resmin üstüne
  if (typeof gorselKutuya === "function" && typeof gorsel === "function" && gorsel("bot")) {
    gorselKutuya(ctx, "bot", -34 * s, -50 * s, 68 * s, 94 * s, true);
    if (b.hitFlash > 0) {
      ctx.globalAlpha = 0.55 * Math.min(1, b.hitFlash / 0.25);
      ctx.fillStyle = "#ffffff";
      ctx.beginPath(); ctx.ellipse(0, -4 * s, 34 * s, 46 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    botEtiketi(ctx, b);
    return;
  }
  // Sırttaki uzun saç
  ctx.fillStyle = "#27272a";
  ctx.fillRect(-21 * s, -30 * s, 42 * s, 38 * s);
  // Bacaklar
  ctx.fillStyle = "#475569";
  ctx.fillRect(-12 * s, 18 * s - Math.max(0, walk) * 4 * s, 10 * s, 24 * s);
  ctx.fillRect(2 * s, 18 * s - Math.max(0, -walk) * 4 * s, 10 * s, 24 * s);
  // Gövde + göğüs paneli
  ctx.fillStyle = "#64748b";
  ctx.fillRect(-18 * s, -8 * s, 36 * s, 30 * s);
  ctx.strokeStyle = "#1e293b"; ctx.lineWidth = 1.5 * s;
  ctx.strokeRect(-18 * s, -8 * s, 36 * s, 30 * s);
  ctx.fillStyle = "#94a3b8";
  ctx.fillRect(-9 * s, -2 * s, 18 * s, 12 * s);
  ctx.fillStyle = "#22d3ee";
  ctx.beginPath(); ctx.arc(-4 * s, 4 * s, 2 * s, 0, Math.PI * 2); ctx.arc(4 * s, 4 * s, 2 * s, 0, Math.PI * 2); ctx.fill();
  // Köşeli kollar ve kare eller
  ctx.fillStyle = "#64748b";
  ctx.fillRect(-28 * s, -6 * s, 10 * s, 18 * s);
  ctx.fillRect(18 * s, -6 * s, 10 * s, 18 * s);
  ctx.fillStyle = "#cbd5e1";
  ctx.fillRect(-30 * s, 12 * s, 13 * s, 11 * s);
  ctx.fillRect(17 * s, 12 * s, 13 * s, 11 * s);
  // Kafa
  ctx.fillStyle = "#e2e8f0";
  ctx.beginPath(); ctx.arc(0, -22 * s, 18 * s, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#475569"; ctx.lineWidth = 1.2 * s; ctx.stroke();
  // Saç: tepe + yüzün iki yanından inen perçemler
  ctx.fillStyle = "#27272a";
  ctx.beginPath(); ctx.arc(0, -28 * s, 19 * s, Math.PI, 0); ctx.fill();
  ctx.fillRect(-20 * s, -30 * s, 6 * s, 26 * s);
  ctx.fillRect(14 * s, -30 * s, 6 * s, 26 * s);
  // Kocaman gözler
  ctx.fillStyle = "#111827";
  ctx.beginPath(); ctx.arc(-6 * s, -24 * s, 3.6 * s, 0, Math.PI * 2); ctx.arc(6 * s, -24 * s, 3.6 * s, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(-5 * s, -25 * s, 1.2 * s, 0, Math.PI * 2); ctx.arc(7 * s, -25 * s, 1.2 * s, 0, Math.PI * 2); ctx.fill();
  // Tırtıklı (dişli) ağız
  ctx.fillStyle = "#fafafa";
  ctx.strokeStyle = "#111827"; ctx.lineWidth = 1.4 * s;
  ctx.beginPath();
  ctx.moveTo(-9 * s, -16 * s);
  for (let i = 0; i <= 6; i++) ctx.lineTo((-9 + i * 3) * s, (i % 2 === 0 ? -16 : -12) * s);
  for (let i = 6; i >= 0; i--) ctx.lineTo((-9 + i * 3) * s, (i % 2 === 0 ? -10 : -13) * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Sağ elde küçük blaster (nişan/geri tepme ile)
  ctx.save();
  ctx.translate(24 * s, 16 * s);
  ctx.rotate(0.85 * (1 - b.aimRaise) - 0.35 * b.shootRecoil);
  ctx.fillStyle = "#334155";
  ctx.fillRect(0, -3 * s, 16 * s, 6 * s);
  ctx.fillStyle = "#67e8f9";
  ctx.fillRect(15 * s, -2 * s, 3 * s, 4 * s);
  ctx.restore();
  // Vuruş parlaması: üstüne beyaz ışık (eskiden ctx.filter brightness idi; tuval filtresi her çizime ayrı uygulanıp
  // vurulurken oyunu donduruyordu — test/cizim.test.mjs)
  if (b.hitFlash > 0) {
    ctx.globalAlpha = 0.55 * Math.min(1, b.hitFlash / 0.25);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.ellipse(0, -4 * s, 34 * s, 46 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  botEtiketi(ctx, b);
}

function damagePlayer() {
  if (game.player.dead || game.devamBekliyor) return;
  if (game._turGeciste) return; // ülkeden ülkeye uçak geçişinde oyuncu güvende
  game.player.hp--;
  game.player.invuln = 1.2;
  if (typeof aeHasarEkle === "function") aeHasarEkle(game.player.x, game.player.y); // hasar patlaması, kırmızı vinyet, sarsıntı
  audio.damage();
  navigator.vibrate?.(120);
  if (game.player.hp <= 0) {
    if (online.mode) {
      becomeSpectator();
    } else if (!turDevamTeklifi()) { // Dünya Turu: "Reklam izle, devam et" (dunya-turu.js)
      endGame(false);
    }
  }
}

function becomeSpectator() {
  game.player.dead = true;
  game.player.hp = 0;
  game.player.invuln = 999999; // hasar almasın
  showToast(t("👻 Hayalet oldun! Takımın bölümü bitirince yeniden doğarsın."));
  audio.damage();
  turDirilTeklifi(); // Dünya Turu: "Reklam izle, diril" (dunya-turu.js)
}

function collidesWalls(x, y, r) {
  if (engelCarpisir(game.walls, x, y, r)) return true;
  return typeof yolculukKopruKapaliNokta === "function" && yolculukKopruKapaliNokta(x, y, r);
}

// ====== ÇİZİM ======
function render() {
  const ctx = game.ctx;
  ctx.clearRect(0, 0, game.W, game.H);

  // Arka plan grid
  ctx.save();
  const sars = typeof aeSarsintiOfset === "function" ? aeSarsintiOfset() : { x: 0, y: 0 };
  ctx.translate(-game.camera.x + sars.x, -game.camera.y + sars.y);

  // Zemin: Dünya Turu'nda ailenin deseni (dunya-turu.js turZeminCiz), değilse bölüm temasının rengi ve ızgara
  if (!(window.turZeminCiz && turZeminCiz(ctx))) {
    const th = getTheme();
    // ChatGPT zemin dokusu (gorsel.js temaZeminiCiz) varsa dikişsiz döşenir; yalnız ekranda görünen alan boyanır
    const zx = Math.max(0, Math.floor(game.camera.x)), zy = Math.max(0, Math.floor(game.camera.y));
    const zw = Math.min(game.worldW, Math.ceil(game.camera.x + game.W) + 2) - zx;
    const zh = Math.min(game.worldH, Math.ceil(game.camera.y + game.H) + 2) - zy;
    if (typeof temaZeminiCiz === "function" && temaZeminiCiz(ctx, LEVEL_THEMES.indexOf(th) + 1, zx, zy, zw, zh)) {
      // zemin çizildi
    } else {
    ctx.fillStyle = th.floor;
    ctx.fillRect(zx, zy, zw, zh);

    // Grid
    ctx.strokeStyle = th.grid;
    ctx.lineWidth = 1;
    const gridSize = 80;
    const gx0 = Math.max(0, Math.floor(game.camera.x / gridSize) * gridSize);
    const gx1 = Math.min(game.worldW, game.camera.x + game.W + gridSize);
    const gy0 = Math.max(0, Math.floor(game.camera.y / gridSize) * gridSize);
    const gy1 = Math.min(game.worldH, game.camera.y + game.H + gridSize);
    for (let x = gx0; x < gx1; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, gy0); ctx.lineTo(x, gy1); ctx.stroke();
    }
    for (let y = gy0; y < gy1; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(gx0, y); ctx.lineTo(gx1, y); ctx.stroke();
    }
    }
  }

  // Engeller: su, diken, lav, duvar ve objeler — eğri hatlı, temaya özel, önbellekli (engeller.js)
  if (typeof zeminKatmaniCiz === "function") zeminKatmaniCiz(ctx); // zemin yolları (zemin-katmani.js)
  engelleriCiz(ctx, "arka");
  if (typeof yolculukGecitCiz === "function") yolculukGecitCiz(ctx); // yolculuk geçit nehirleri (yolculuk.js)
  koprulerCiz(ctx);   // sallanan ip köprüler (kopru.js)
  if (typeof yolculukCiz === "function") yolculukCiz(ctx); // yolculuk geçitleri (yolculuk.js)
  if (typeof yolculukDonatilariCiz === "function") yolculukDonatilariCiz(ctx, "arka"); // yolculuk süs objeleri (yolculuk.js)
  if (typeof yolculukTemaParcalariCiz === "function") yolculukTemaParcalariCiz(ctx, "arka"); // tema parçaları (GOR1C)
  if (typeof yolculukYuvalariCiz === "function") yolculukYuvalariCiz(ctx, "arka"); // yolculuk hayalet yuvaları (yolculuk.js)
  if (typeof yuvaCanlilariCiz === "function") yuvaCanlilariCiz(ctx, "arka"); // YUV1: yuva fareleri (yolculuk.js)
  timsahlariCiz(ctx); // sudaki timsahlar (timsah.js)
  calilariCiz(ctx);   // saklanma çalıları (cali.js)

  // Toplanabilirler
  for (const p of game.pickups) drawPickup(ctx, p);
  if (typeof hikayeCiz === "function") hikayeCiz(ctx); // parlayan hatıra baloncuğu

  // Mermiler
  for (const p of game.projectiles) drawProjectile(ctx, p);

  // Düşman mermileri (boss + shooter ghost)
  for (const p of (game.enemyProjectiles || [])) drawEnemyProjectile(ctx, p);

  // Ölen hayaletlerin solan izleri (canlı hayaletlerin altında)
  drawGhostFades(ctx);
  if (typeof aeTozlariCiz === "function") aeTozlariCiz(ctx, performance.now()); // ayak tozları (AKI1)

  // Hayaletler (boss en üstte)
  for (const g of game.ghosts) if (!g.isBoss) drawGhost(ctx, g);
  for (const g of game.ghosts) if (g.isBoss) drawGhost(ctx, g);
  if (typeof aeOlumPoplariCiz === "function") aeOlumPoplariCiz(ctx, performance.now()); // ölüm popu (AKI1)
  // Donmuş hayaletlerin buz kaplaması (anim-ek.js)
  if (typeof aeBuzKaplamaCiz === "function") for (const g of game.ghosts) aeBuzKaplamaCiz(ctx, g, performance.now());

  // Bomba/roket görselleri (hayaletlerin üstünde)
  drawEffects(ctx);
  if (typeof animEfektleriCiz === "function") animEfektleriCiz(ctx); // toplama halkası, boss iniş dalgası (anim.js)
  if (typeof aeEfektleriCiz === "function") aeEfektleriCiz(ctx, performance.now()); // şifa, yıldırım, duman, hasar (anim-ek.js)
  if (typeof kasirgaCiz === "function" && !game.player.dead && (game.player.kasirgaUntil || 0) > performance.now()) {
    kasirgaCiz(ctx, game.player.x, game.player.y, performance.now(), game.player.kasirgaUntil);
  }

  // Diğer oyuncular (multiplayer)
  if (online.mode) {
    const rps = online.remotePlayers || {};
    const hostUid = online.cachedRoom && online.cachedRoom.hostUid;
    Object.keys(rps).forEach((uid, sira) => {
      const rp = rps[uid];
      if (!rp || !Number.isFinite(rp.x) || !Number.isFinite(rp.y)) return;
      const yuk = typeof kopruYukselti === "function" ? kopruYukselti(rp.x, rp.y) : 0; // KPR1: köprü kemeri (çizim)
      if (rp.gizli && !rp.dead) { caliGozleri(ctx, rp.x, rp.y, performance.now() / 1000); return; } // çalıda saklanıyor
      if (rp.dead) {
        hayaletOyuncuCiz(ctx, rp.charKey || "kinkin", rp.costumeIdx || 0, rp.x, rp.y, 0.45); // mavi hayalet
      } else {
        ctx.save();
        if (rp.invisible) ctx.globalAlpha = 0.4;
        if (yuk) ctx.translate(0, -yuk);
        drawCharacter(ctx, rp.charKey || "kinkin", rp.costumeIdx || 0, rp.x, rp.y, 70, rp.facing || 0, rp.yurume || 0,
          rp.aimRaise || 0, rp.recoil || 0, "", !!rp.bakisSol,
          typeof rp.aci3d === "number" ? rp.aci3d : null, uid, null, sira >= 3);
        ctx.restore();
      }
      // İsim etiketi (host'un adında taç)
      const etiket = (uid === hostUid ? "👑 " : "") + (rp.name || "?");
      ctx.save();
      if (yuk) ctx.translate(0, -yuk);
      ctx.fillStyle = "#fde047";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 3;
      ctx.font = "800 12px Nunito, \"Baloo Bhaijaan 2\", sans-serif";
      ctx.textAlign = "center";
      ctx.strokeText(etiket, rp.x, rp.y - 50);
      ctx.fillText(etiket, rp.x, rp.y - 50);
      // Mini can çubuğu
      const w = 36, h = 4;
      const ratio = Math.max(0, Math.min(1, (rp.hp || 0) / (rp.maxHp || 3)));
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(rp.x - w / 2 - 1, rp.y - 44, w + 2, h + 2);
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(rp.x - w / 2, rp.y - 43, w, h);
      ctx.fillStyle = "#10b981";
      ctx.fillRect(rp.x - w / 2, rp.y - 43, w * ratio, h);
      ctx.restore();
    });
  }

  // KPR1: botlar da köprü kemerinde yükselir (etiketleriyle birlikte)
  for (const _b of [game.bot, game.bot2]) {
    if (!_b) continue;
    const _yuk = typeof kopruYukselti === "function" ? kopruYukselti(_b.x, _b.y) : 0;
    ctx.save();
    if (_yuk) ctx.translate(0, -_yuk);
    drawBot(ctx, _b);
    ctx.restore();
  }
  petCiz(ctx, false); // kedi, köpek (pet.js)
  uzakPetleriCiz(ctx, false); // çevrimiçi: öbür oyuncuların petleri

  // Karakter gücü aurası (oyuncunun altında; anim-ek.js)
  const aktifGucAura = typeof getActivePower === "function" ? getActivePower() : null;
  if (typeof aeGucAuraCiz === "function" && !game.player.dead) aeGucAuraCiz(ctx, game.player, aktifGucAura, performance.now());

  // Oyuncu (yanıp sönme efekti yaralandığında, görünmez iken yarı saydam, ölü iken hayalet)
  const blink = !game.player.dead && game.player.invuln > 0 && Math.floor(game.player.invuln * 10) % 2 === 0;
  const batma = kopruBatma(); // köprüden suya düşen: belinden aşağısı suda (kopru.js)
  if (batma) {
    ctx.save();
    ctx.beginPath(); ctx.rect(game.player.x - 90, game.player.y - 160, 180, 168); ctx.clip();
    ctx.translate(0, batma);
  }
  // KPR1: oyuncu köprü kemerinde yükselir (düşerken/ölüyken değil)
  const yuk = (typeof kopruYukselti === "function" && !game.player.dusus && !game.player.dead) ? kopruYukselti(game.player.x, game.player.y) : 0;
  if (yuk) { ctx.save(); ctx.translate(0, -yuk); }
  const _cosEfs = !game.player.dead && (COSTUMES[game.player.charKey] || [])[game.player.costumeIdx];
  if (_cosEfs && _cosEfs.efsane) efsaneAuraCiz(ctx, game.player.x, game.player.y, performance.now());
  if (game.player.gizli && !game.player.dead) gizliCiz(ctx); // çalıda yalnız gözler (cali.js)
  else if (!blink) {
    const isInvisible = (game.player.invisibleUntil || 0) > performance.now();
    const wp = game.player.walkTimer || 0;
    // Spectator iken silah indirilmiş kalsın
    const ar = game.player.dead ? 0 : (game.player.aimRaise || 0);
    const rc = game.player.dead ? 0 : (game.player.shootRecoil || 0);
    const aktifGuc = typeof getActivePower === "function" ? getActivePower() : null;
    const ozel3d = (aktifGuc && aktifGuc.type === "fanatik") ? "tekme"
      : ((game.player.sevincUntil || 0) > performance.now() ? "sevinc" : null);
    if (game.player.dead) {
      hayaletOyuncuCiz(ctx, game.player.charKey, game.player.costumeIdx, game.player.x, game.player.y, 0.5);
    } else if (isInvisible) {
      if (typeof aeGorunmezParilti === "function") aeGorunmezParilti(ctx, game.player, performance.now());
      ctx.save();
      ctx.globalAlpha = typeof aeGorunmezAlfa === "function" ? aeGorunmezAlfa(performance.now()) : 0.4;
      oyuncuCiz(ctx, game.player.charKey, game.player.costumeIdx, game.player.x, game.player.y, 70, game.player.facing, wp, ar, rc, game.player.gun, !!game.player.bakisSol, game.player.aci3d, "ben", ozel3d);
      ctx.restore();
    } else {
      oyuncuCiz(ctx, game.player.charKey, game.player.costumeIdx, game.player.x, game.player.y, 70, game.player.facing, wp, ar, rc, game.player.gun, !!game.player.bakisSol, game.player.aci3d, "ben", ozel3d);
    }
  }
  if (yuk) ctx.restore();
  if (batma) ctx.restore();
  dususCiz(ctx);
  petCiz(ctx, true); // kuş oyuncunun üstünde uçar (pet.js)
  uzakPetleriCiz(ctx, true);

  // ZEM3A: oyuncunun önünde kalan yüksek nesneler (duvar/obje, yolculuk süsü, tema parçası, yuva) oyuncudan sonra
  engelleriCiz(ctx, "on");
  if (typeof yolculukDonatilariCiz === "function") yolculukDonatilariCiz(ctx, "on");
  if (typeof yolculukTemaParcalariCiz === "function") yolculukTemaParcalariCiz(ctx, "on");
  if (typeof yolculukYuvalariCiz === "function") yolculukYuvalariCiz(ctx, "on");
  if (typeof yuvaCanlilariCiz === "function") yuvaCanlilariCiz(ctx, "on"); // YUV1: yuva yarasaları her şeyin üstünde

  // Parçacıklar
  for (const p of game.particles) {
    ctx.save();
    if (p.text) {
      ctx.fillStyle = p.color;
      ctx.font = "800 14px Nunito, \"Baloo Bhaijaan 2\", sans-serif";
      ctx.textAlign = "center";
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillText(p.text, p.x, p.y);
    } else {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life * 1.5);
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    ctx.restore();
  }
  if (typeof aePuanlariCiz === "function") aePuanlariCiz(ctx, performance.now()); // uçan hasar/ödül sayıları (AKI1)
  havaCiz(ctx); // yarasalar, fırtına bulutu ve şimşek (hava.js)
  if (typeof gec1DunyaCiz === "function") gec1DunyaCiz(ctx, performance.now()); // portal + konfeti (GEC1)

  ctx.restore();
  // ZEM3B: oyuncu çevresinde ekran uzayında yumuşak ışık halkası (dünyanın üstünde, HUD'un altında)
  if (typeof isikHalkasiCiz === "function" && game.player) {
    isikHalkasiCiz(ctx, game.player.x - game.camera.x + sars.x, game.player.y - game.camera.y + sars.y);
  }
  if (typeof aeUcuslarCiz === "function") aeUcuslarCiz(ctx, performance.now()); // HUD'a para uçuşu (AKI1)
  if (typeof gec1EkranCiz === "function") gec1EkranCiz(ctx, performance.now()); // iris/soluk perde + başlık kartı
  if (typeof aeEkranEfektleriCiz === "function") aeEkranEfektleriCiz(ctx, performance.now());
  havaParlamaCiz(ctx); // şimşeğin ekran parlaması
}

// Yolculuk çubuğu simgesi: resim yüklüyse arka plan resmi, değilse bugünkü kod simgesi kalır
function ycSimge(el, key) {
  if (!el) return;
  if (typeof gorsel === "function" && gorsel(key)) {
    if (el.dataset.k !== key) {
      el.style.backgroundImage = `url("${gorsel(key).src}")`;
      el.classList.add("yc-resim");
      el.dataset.k = key;
    }
  } else if (el.dataset.k) {
    el.classList.remove("yc-resim");
    el.style.backgroundImage = "";
    delete el.dataset.k;
  }
}

function updateHUD() {
  let lives = "";
  for (let i = 0; i < game.player.maxHp; i++) {
    lives += i < game.player.hp ? "❤️" : "🖤";
  }
  document.getElementById("lives").textContent = lives;
  document.getElementById("level-num").textContent = game.level;
  document.getElementById("ghost-count").textContent = game.totalCaught;
  document.getElementById("run-para").textContent = game.runPara;
  if (typeof aeHudKontrol === "function") aeHudKontrol(game); // sayaçlar artınca kısa zıplama

  // Yolculuk çubuğu: harita, geçitler, etkin bölge, oyuncu noktası ve bölgede kalan hayalet
  const yHud = document.getElementById("yolculuk-hud");
  const yolculuk = typeof yolculukAcik === "function" && yolculukAcik();
  if (yHud) {
    yHud.style.display = yolculuk && game._yolculukDuzen ? "flex" : "none";
    if (yolculuk && game._yolculukDuzen) {
      const W = game.worldW || 1;
      const pct = (x) => Math.max(0, Math.min(100, (x / W) * 100));
      const d = game._yolculukDuzen;
      const kapilar = yHud.querySelectorAll(".yc-kapi");
      for (let i = 0; i < kapilar.length && i < d.zones.length; i++) {
        kapilar[i].style.left = pct(d.zones[i].gate.x1) + "%";
        ycSimge(kapilar[i], game.kopruAcik && game.kopruAcik[i] ? "yol-cubuk-kopru" : "yol-cubuk-kilit");
      }
      // Başlangıç simgesi bir kez çubuğa eklenir (mutlak konumlu, çubuğun kutusunu değiştirmez)
      const cubuk = document.getElementById("yc-cubuk");
      let basEl = cubuk && cubuk.querySelector(".yc-bas");
      if (cubuk && !basEl) {
        basEl = document.createElement("i"); basEl.className = "yc-bas";
        cubuk.insertBefore(basEl, document.getElementById("yc-nokta"));
      }
      ycSimge(basEl, "yol-cubuk-baslangic");
      ycSimge(yHud.querySelector(".yc-tac"), "yol-cubuk-boss");
      const nokta = document.getElementById("yc-nokta");
      if (nokta) nokta.style.left = pct(game.player ? game.player.x : 0) + "%";
      const aktif = game.bolge || 1;
      const bolgeEl = document.getElementById("yc-bolge");
      if (bolgeEl) {
        let b = null;
        if (aktif >= 1 && aktif <= 6) b = d.zones[aktif - 1];
        else if (aktif === 7) b = d.arena;
        if (b) {
          bolgeEl.style.display = "block";
          bolgeEl.style.left = pct(b.x0) + "%";
          bolgeEl.style.width = Math.max(0, pct(b.x1) - pct(b.x0)) + "%";
        } else bolgeEl.style.display = "none";
      }
      const kalanEl = document.getElementById("yc-kalan");
      if (kalanEl) {
        let kalan = 0;
        if (aktif >= 1 && aktif <= 6) {
          kalan = Math.max(0, (game.bolgeKota[aktif] || 0) - (game.bolgeDogan[aktif] || 0));
          for (const g of game.ghosts) if (!g.isBoss && g.bolge === aktif) kalan++;
        } else {
          for (const g of game.ghosts) if (!g.isBoss) kalan++;
        }
        // Sayaç yapısı bir kez kurulur: <i class="yc-hayalet">👻</i> <span id="yc-kalan-sayi">N</span>
        let hayEl = kalanEl.querySelector(".yc-hayalet");
        let sayiEl = kalanEl.querySelector("#yc-kalan-sayi");
        if (!hayEl || !sayiEl) {
          kalanEl.textContent = "";
          hayEl = document.createElement("i"); hayEl.className = "yc-hayalet"; hayEl.textContent = "👻";
          sayiEl = document.createElement("span"); sayiEl.id = "yc-kalan-sayi";
          kalanEl.appendChild(hayEl);
          kalanEl.appendChild(document.createTextNode(" "));
          kalanEl.appendChild(sayiEl);
        }
        ycSimge(hayEl, "yol-cubuk-hayalet");
        if (sayiEl.dataset.v !== String(kalan)) { sayiEl.textContent = kalan; sayiEl.dataset.v = String(kalan); }
      }
    }
  }

  // Boss durumu: innerHTML yalnız durum/yazı değişince kurulur (resim düğümü kareler arasında korunur)
  const bossEl = document.getElementById("boss-status");
  if (bossEl) {
    bossEl.style.display = yolculuk ? "none" : "";
    let metin, sinif;
    if (game.bossDefeated) {
      const remain = game.ghosts.length;
      metin = remain > 0 ? t("🧹 Kalan: {n}", { n: remain }) : t("✓ Bölüm temiz!");
      sinif = "boss-status boss-cleared";
    } else if (game.bossSpawnTimer > 0) {
      metin = t("⏳ Boss: {n}s", { n: Math.ceil(game.bossSpawnTimer) });
      sinif = "boss-status";
    } else {
      metin = t("👑 BOSS!");
      sinif = "boss-status boss-active";
    }
    bossEl.className = sinif;
    const imgeVar = !game.bossDefeated && !(game.bossSpawnTimer > 0)
      && typeof GORSEL_LISTESI === "object" && GORSEL_LISTESI && GORSEL_LISTESI["ui-boss"];
    if (imgeVar) {
      const imza = "boss|" + metin;
      if (bossEl.dataset.hudDurum !== imza) {
        bossEl.innerHTML = uiSimgeHTML("ui-boss", "👑", "BOSS") + " " + metin.replace(/^👑\s*/, "");
        bossEl.dataset.hudDurum = imza;
      }
    } else {
      const imza = "metin|" + metin;
      if (bossEl.dataset.hudDurum !== imza) {
        bossEl.textContent = metin;
        bossEl.dataset.hudDurum = imza;
      }
    }
  }

  // Aktif güç simgeleri (BUF1)
  bufGuncelle(getActivePower());
}

// ====== DURAKLAT / ÇIK ======
// Duraklatmada geçen gerçek süreyi mutlak zaman alanlarına ekler (oyun saati değil, küçük yama).
// Gelecekteki *Until alanları, oyuncu gücünün expires'ı ve hayaletlerin nextShot'ı kaydırılır.
function oyunSaatiniKaydir(ms) {
  if (!(ms > 0)) return;
  const simdi = performance.now();
  const kaydir = (o) => {
    if (!o) return;
    for (const k in o) {
      if (!k.endsWith("Until")) continue;
      if (typeof o[k] === "number" && o[k] > simdi) o[k] += ms;
    }
  };
  if (game.player) {
    kaydir(game.player);
    if (game.player.power && typeof game.player.power.expires === "number" && game.player.power.expires > simdi) game.player.power.expires += ms;
  }
  if (Array.isArray(game.ghosts)) {
    for (const g of game.ghosts) {
      kaydir(g);
      if (typeof g.nextShot === "number" && g.nextShot > simdi) g.nextShot += ms;
    }
  }
  if (game.activePower && typeof game.activePower.expires === "number" && game.activePower.expires > simdi) game.activePower.expires += ms;
}

// Çevrimiçi oyunda menü oyunu durdurmaz: host dursa herkesin oyunu donardı
function pauseGame() {
  if (!game.running) return;
  const cevrimici = !!online.mode;
  game.paused = !cevrimici;
  game.menude = cevrimici;
  if (!cevrimici) game._duraklamaBas = performance.now(); // tek kişilik: duraklama süresi sayaçlardan düşülür
  document.getElementById("pause-title").textContent = cevrimici ? t("⏸ Menü") : t("⏸ Duraklatıldı");
  const not = document.getElementById("pause-not");
  not.textContent = cevrimici ? t("Çevrimiçi oyun durmaz: hayaletler gelmeye devam eder.") : "";
  not.style.display = cevrimici ? "" : "none";
  const kod = document.getElementById("pause-kod");
  kod.textContent = (cevrimici && online.roomId) ? t("🔑 Oda kodu: {kod}", { kod: online.roomId }) : "";
  kod.style.display = (cevrimici && online.roomId) ? "" : "none";
  const davet = document.getElementById("pause-davet");
  davet.style.display = (cevrimici && online.roomId) ? "" : "none";
  davet.disabled = odaDolu();
  document.getElementById("screen-pause").classList.add("active");
  eskiToastuKapat();
  if (!cevrimici) { muzikDuraklat(true); if (typeof audio !== "undefined" && audio.ortamDurdur) audio.ortamDurdur(); }
}

function resumeGame() {
  if (game._duraklamaBas) { oyunSaatiniKaydir(performance.now() - game._duraklamaBas); game._duraklamaBas = 0; }
  document.getElementById("screen-pause").classList.remove("active");
  game.paused = false;
  game.menude = false;
  game.lastFrame = performance.now();
  muzikDuraklat(false);
}

function quitToMenu() {
  // Odadaysa (oyunda ya da tur sonu ekranında) odadan çık; kazançlar kaydedilir
  if (online.roomId) odadanCik();
  // Tek kişilikte yarıda bırakılan oyunun kazançları kaybolmasın (bölüm bonusu ve rekor değişmez)
  if (game.running && !online.mode) {
    save.para += game.runPara;
    save.elmas += game.runElmas;
    save.zumrut += game.runZumrut;
    game.runPara = 0; game.runElmas = 0; game.runZumrut = 0;
    persistSave();
  }
  game._duraklamaBas = 0;
  game.running = false;
  game.menude = false;
  turPerdeleriniKapat();
  turMuzigiSondur();
  turDevamKapat();
  document.getElementById("screen-pause").classList.remove("active");
  document.getElementById("screen-gameover").classList.remove("active");
  const wb = document.getElementById("weapon-bar");
  if (wb) wb.innerHTML = "";
  hostBeklemeGostergesi(0);
  goToMenu();
}

// Arka plana geçince tek kişilik oyun duraklatılır; dönüşte sayaçlar duraklama süresi kadar kaydırılır.
// Çevrimiçi oyun duraklatılmaz (diğerleri oynamaya devam eder).
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (game.running && !game.paused && !online.mode) pauseGame();
    hostuDevret(); // arka planda durum yazılamaz: hostluk kalan en eski oyuncuya geçer
  } else if (game._duraklamaBas) {
    oyunSaatiniKaydir(performance.now() - game._duraklamaBas);
    game._duraklamaBas = game.paused ? performance.now() : 0; // duraklatma ekranı açık kaldıysa süre yeniden sayılır
  }
});

// ====== OYUN BİTTİ ======
function endGame(won) {
  oyunSonu(won, false);
}

// Oyun sonu ödülleri (3.20.0): dört sayı 0'dan değerine ~0.8 sn'de sayılır. Az hareket tercihinde
// doğrudan son değer yazılır. Değerler yalnız gösterilir; kazanç hesabı ve kaydı değişmez.
let _odulSayacRaf = 0;
function odulSayaclariGoster(degerler) {
  const hedefler = [
    [document.getElementById("final-ghosts"), degerler.hayalet],
    [document.getElementById("final-para"), degerler.para],
    [document.getElementById("final-elmas"), degerler.elmas],
    [document.getElementById("final-zumrut"), degerler.zumrut],
  ];
  // Son değer data-son'da durur: reklam ödülü (reklam.js) ve sınamalar sayaç sürerken de doğru değeri okur
  for (const [el, hedef] of hedefler) if (el) el.dataset.son = String(hedef || 0);
  const yaz = (k) => { for (const [el, hedef] of hedefler) if (el) el.textContent = Math.round((hedef || 0) * k); };
  if (_odulSayacRaf) { cancelAnimationFrame(_odulSayacRaf); _odulSayacRaf = 0; }
  const azHareket = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (azHareket) { yaz(1); return; }
  const sure = 800, baslangic = performance.now();
  yaz(0);
  const adim = (an) => {
    const k = Math.min(1, (an - baslangic) / sure);
    yaz(k);
    if (k < 1) _odulSayacRaf = requestAnimationFrame(adim); else _odulSayacRaf = 0;
  };
  _odulSayacRaf = requestAnimationFrame(adim);
}

// Sayaç sürüyorsa durdurur ve dört ödülü son değerleriyle yazar (reklam ödülü eklemeden önce çağırır)
function odulSayaclariniBitir() {
  if (_odulSayacRaf) { cancelAnimationFrame(_odulSayacRaf); _odulSayacRaf = 0; }
  for (const id of ["final-ghosts", "final-para", "final-elmas", "final-zumrut"]) {
    const el = document.getElementById(id);
    if (el && el.dataset.son !== undefined) el.textContent = el.dataset.son;
  }
}

// Tek kişilik oyunun sonu ya da çevrimiçi turun sonu (turSonu): kazançlar kaydedilir, sonuç ekranı açılır.
// reklamsiz: arkadaşın davetiyle odaya geçerken (arkadaslar.js davetiKabulEt) oyun sonu reklamı gösterilmez
// siralama: çevrimiçi turun sıralaması (turSiralamasi); birinci kupa kazanır
function oyunSonu(won, cevrimici, reklamsiz = false, siralama = null) {
  game.running = false;
  game.menude = false;
  if (typeof audio !== "undefined" && audio.ortamDurdur) audio.ortamDurdur(); // SES1
  turPerdeleriniKapat(); // damga ya da uçak geçişi sırasında biten oyunda perde ekranda kalmasın
  turMuzigiSondur();
  // Dünya Turu skorları Şampiyonlar'a, buluta ve Play Games'e yazılmaz, bölüm rekorunu değiştirmez (spec §3)
  const tur = game.dunyaTuru, turBitti = tur && game.turBitti;

  // Bonus para: geçilen bölüm başına 50. Dünya Turu'nda bu oyunda geçilen ülkeler sayılır (ortadan başlayan oyuncu
  // geçmediği ülkelerin ödülünü almaz; son ülke bitince o da sayılır)
  // (eski sürümlü kurucuyla 52, 53… bölüm oynanabilir: ülke sayısı 51'de sınırlı)
  const gecilen = tur ? Math.max(0, Math.min(game.level, ULKE_SAYISI) - (game.turBaslangic || game.level) + (turBitti ? 1 : 0)) : Math.max(0, game.level - (game.baslangicBolum || 1));
  const completionBonus = gecilen * 50;
  const finalPara = game.runPara + completionBonus;

  // Yüksek bölüm rekoru (yeni rekor sevinç anıdır: geçiş reklamı gösterilmez). Ortadan katılan istemci rekor kırmaz.
  const rekorKirilir = game.baslangicBolum === 1;
  const yeniRekor = !tur && rekorKirilir && game.level > save.highestLevel;
  if (yeniRekor) save.highestLevel = game.level;

  save.para += finalPara;
  save.elmas += game.runElmas;
  save.zumrut += game.runZumrut;
  const kupa = cevrimici && kupaKazandimMi(siralama);
  if (kupa) save.kupa = (save.kupa || 0) + 1;
  persistSave();

  // Şampiyon listesine ekle (yerel + buluta). Ortadan katılan istemci kayıtlı seviyeden yukarı yazmaz.
  const entryLevel = rekorKirilir ? game.level : Math.max(1, save.highestLevel || 1);
  const entry = {
    name: save.playerName || t("Avcı"),
    level: entryLevel,
    ghosts: game.totalCaught,
    para: finalPara,
    date: Date.now(),
  };
  let rank = -1;
  if (!tur) {
    rank = addLeaderboardEntry(entry);
    submitOnlineScore(entry); // sessizce buluta yolla, sonucu beklemiyoruz
    pgsOyunBitti(scoreFor(entry), save.highestLevel, game.totalCaught); // Android: Play Games skor + başarımlar
  }
  const rankEl = document.getElementById("gameover-rank");
  if (cevrimici) {
    // Çevrimiçi turda odadaki sıra yazılır. Eskiden yerel Şampiyonlar sırası yazılıyordu: liste aynı adı tek kayıtta
    // tuttuğu için çoğu cihazda sıra 0 çıkıyor, herkese "1. SIRA! Şampiyonsun!" yazıyordu.
    rankEl.textContent = turSiraYazisi(siralama, kupa);
  } else if (rank >= 0) {
    if (rank === 0) rankEl.textContent = t("🥇 1. SIRA! Şampiyonsun!");
    else if (rank === 1) rankEl.textContent = t("🥈 2. sıraya girdin!");
    else if (rank === 2) rankEl.textContent = t("🥉 3. sıraya girdin!");
    else rankEl.textContent = t("🏆 Şampiyonlar listesinde {n}. sıradasın!", { n: rank + 1 });
  } else {
    rankEl.textContent = "";
  }

  turSiralamasiniGoster(cevrimici ? siralama : null);
  document.getElementById("gameover-title").textContent = cevrimici ? t("🏁 Tur bitti!") : turBitti ? t("🌍 Dünya turu tamamlandı!")
    : won ? t("🌟 Harika!") : t("👻 Yakalandın!");
  // Oyun sonu resmi: rekor > zafer > yenilgi. Resim listede yoksa başlık emojisi olduğu gibi kalır.
  const benSira = cevrimici && siralama ? siralama.find((s) => s.ben) : null;
  const birinci = !!(benSira && benSira.sira === 1);
  const goKey = yeniRekor ? "ui-rekor" : (won || turBitti || birinci) ? "ui-zafer" : "ui-yenilgi";
  const goResim = document.getElementById("gameover-resim");
  if (goResim) {
    const goImg = typeof GORSEL_LISTESI === "object" && GORSEL_LISTESI && GORSEL_LISTESI[goKey] && typeof gorsel === "function" ? gorsel(goKey) : null; // yüklü resmin adresi (paketli denemede de çalışır)
    if (goImg) {
      goResim.innerHTML = `<img src="${goImg.src}" alt="" draggable="false">`;
      goResim.hidden = false;
    } else { goResim.innerHTML = ""; goResim.hidden = true; }
  }
  odulSayaclariGoster({ hayalet: game.totalCaught, para: finalPara, elmas: game.runElmas, zumrut: game.runZumrut });
  // Kazançlar kaydedildi: odadan çıkarken (flushOnlineRewards) ikinci kez eklenmesin
  game.runPara = 0; game.runElmas = 0; game.runZumrut = 0;
  // Çevrimiçi turdan sonra "Tekrar Oyna" tek kişilik oyun açardı: yerine lobiye dönülür
  document.getElementById("btn-tekrar").style.display = cevrimici ? "none" : "";
  document.getElementById("btn-lobiye-don").style.display = cevrimici ? "" : "none";
  document.getElementById("screen-gameover").classList.add("active");
  if (won) audio.win(); else audio.lose();
  if (!reklamsiz) reklamOyunBitti({ cevrimici, sureSn: game.oynananSure || 0, kutlama: !cevrimici && (yeniRekor || turBitti), para: finalPara });
  else { reklam.oyunPara = 0; odulDugmesiniGuncelle(); } // önceki oyunun 2× parası bu ekranda sunulmasın
}

// ====== BAŞLAT ======
function init() {
  // Ses ayarlarını save'den uygula
  audio.enabled = save.soundEnabled !== false;
  audio.volumes = Object.assign({ ghost: 1, fire: 1, sfx: 1, muzik: 0.6 }, save.volumes || {});
  refreshSoundButtons();
  refreshSoundSliders();
  refresh3dButton();
  uc3dUygula(); // save.ayar3d kapalıysa 3D'yi kapat (modül sonra yüklenirse olayda uygulanır)
  // Firebase + auth state listener; oturum yoksa (ilk açılış, Google'dan çıkış, hesap silme) anonim giriş
  try {
    const auth = fbAuth();
    if (auth) {
      auth.onAuthStateChanged((u) => {
        refreshAccountScreen();
        if (!u) fbKullanici();
        // Arkadaşlar (arkadaslar.js): istek, davet ve çevrimiçi durum dinleyicileri bu kimlikle kurulur
        if (u) sosyalBaslat(); else sosyalDurdur();
      });
    }
    // Google Auth plugin'i arka planda hazırla (native)
    initGoogleAuth().catch(() => {});
  } catch (_) {}
  // AdMob (yalnız Android uygulamasında; web'de eklenti yok)
  reklamBaslat();
  drawGreeter();
  menuSimgeleriniUygula(); // dilUygula sonrası: resmi olan menü simgeleri emojinin yerine geçer
  odulSandigiKur(); // oyun sonu ödül sandığı (bir kez)
  menuDekoruKur(); // ana menü süsü (emblem, kaide, dekoratif katmanlar)
  ekranGorselleriKur(); // dükkân/karakter/hesap ve çevrimiçi ekranlarının arka planı, joystick resimleri
  // Hoşgeldin ekranında ismi varsa göster
  if (save.playerName) {
    document.getElementById("welcome-text").innerHTML =
      t("Merhaba <b>{ad}</b>! Ben <b>Kinkin</b>, hadi hayalet avına!", { ad: escapeHtml(save.playerName) });
  }
  // İsim ekranında Enter ile gönder
  const nameInput = document.getElementById("name-input");
  if (nameInput) {
    nameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submitName();
    });
  }
  // Tüm butonlarda tıklama sesi + ilk etkileşimde audio başlat
  document.addEventListener("click", (e) => {
    audio.init();
    const btn = e.target.closest("button");
    if (btn) audio.click();
  }, true);
  document.addEventListener("touchstart", () => { audio.init(); }, { once: true, passive: true });
  // Çift dokunmayla zoom engelle
  document.addEventListener("gesturestart", (e) => e.preventDefault());
  document.addEventListener("touchmove", (e) => {
    if (e.touches.length > 1) e.preventDefault();
  }, { passive: false });
}

// ====== GOOGLE SIGN-IN ======
const GOOGLE_WEB_CLIENT_ID = "247289107945-6lbcnt8bvn0u1cqi4dgod63coo0g9218.apps.googleusercontent.com";

function googleAuthPlugin() {
  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.GoogleAuth) {
    return window.Capacitor.Plugins.GoogleAuth;
  }
  return null;
}

let _googleAuthInited = false;
async function initGoogleAuth() {
  if (_googleAuthInited) return true;
  const ga = googleAuthPlugin();
  if (!ga) return false;
  try {
    await ga.initialize({
      clientId: GOOGLE_WEB_CLIENT_ID,
      scopes: ["profile", "email"],
      grantOfflineAccess: false,
    });
    _googleAuthInited = true;
    return true;
  } catch (e) {
    console.error("GoogleAuth.initialize", e);
    return false;
  }
}

async function signInWithGoogle() {
  try {
    const ok = await initGoogleAuth();
    if (!ok) { showToast(t("Google giriş bu cihazda kullanılamıyor")); return; }
    const ga = googleAuthPlugin();
    const guser = await ga.signIn();
    if (!guser || !guser.authentication || !guser.authentication.idToken) {
      showToast(t("Google girişi iptal"));
      return;
    }
    // Firebase Auth ile credential dönüştür
    const auth = fbAuth();
    if (!auth) { showToast(t("Firebase Auth SDK yok")); return; }
    const credential = firebase.auth.GoogleAuthProvider.credential(guser.authentication.idToken);
    await authIlkDurum(auth);
    const simdiki = auth.currentUser;
    let u;
    if (simdiki && simdiki.isAnonymous) {
      // Anonim hesabı Google'a yükselt: uid aynı kalır, oda/kodlu yedek/skor sahipliği korunur
      try {
        u = (await simdiki.linkWithCredential(credential)).user;
      } catch (e) {
        if (!e || e.code !== "auth/credential-already-in-use") throw e;
        // Bu Google hesabı daha önce kullanılmış (eski sürüm ya da başka cihaz): o hesaba geç,
        // accounts_google/{uid} yedeği oradadır
        u = (await auth.signInWithCredential(e.credential || credential)).user;
      }
    } else {
      u = (await auth.signInWithCredential(credential)).user;
    }
    if (u) {
      showToast(t("✅ Hoş geldin, {ad}", { ad: googleAdi(u) || googleEpostasi(u) }));
      refreshAccountScreen();
    }
  } catch (e) {
    console.error("signInWithGoogle", e);
    showToast(t("Google girişi hatası: {hata}", { hata: (e && e.message) || e }));
  }
}

async function signOutGoogle() {
  try {
    const ga = googleAuthPlugin();
    if (ga) { try { await ga.signOut(); } catch (_) {} }
    if (firebase && firebase.auth) { try { await firebase.auth().signOut(); } catch (_) {} }
    showToast(t("✓ Çıkış yapıldı"));
    refreshAccountScreen();
  } catch (e) { console.error("signOutGoogle", e); }
}

// Hesap silme (Google Play kuralı): Google bulut yedeği, kodlu yedek ve Firebase hesabı silinir.
async function deleteAccountGoogle() {
  const u = currentFirebaseUser();
  if (!u) { showToast(t("Önce Google ile giriş yap")); return; }
  if (!confirm(t("Google hesabına bağlı bulut yedeğin ve oyundaki hesabın kalıcı olarak silinecek.\nBu cihazdaki ilerleme kalır. Devam edilsin mi?"))) return;
  // Önce arkadaşlık verisi (arkadaslar.js): hesap silinince bu kayıtları kimse silemez. Silinemezse hesap da silinmez;
  // kurallar yayınlanmamışsa ("izin") arkadaşlık verisi hiç yazılamamıştır
  if (!(await arkadaslikVerisiniSil()) && sosyal.hata !== "izin") { showToast(t("⚠ Bağlanılamadı, yeniden dene")); return; }
  await rtdb.remove(`accounts_google/${u.uid}`);
  if (save.accountCode) {
    await rtdb.remove(`accounts/${save.accountCode.replace("-", "_")}`);
    save.accountCode = "";
    persistSave();
  }
  let tamam = true;
  try { await u.delete(); } catch (e) { tamam = false; console.error("deleteAccountGoogle", e); }
  const ga = googleAuthPlugin();
  if (ga) { try { await ga.signOut(); } catch (_) {} }
  // Silinen kullanıcı zaten çıkmış olur; ardından yeni anonim oturum açılır (init › onAuthStateChanged)
  if (!tamam) { try { await firebase.auth().signOut(); } catch (_) {} }
  showToast(tamam ? t("🗑 Hesabın silindi") : t("🗑 Yedeğin silindi; hesabı silmek için yeniden giriş yapıp tekrar dene"));
  refreshAccountScreen();
}

// Google ile girmiş Firebase kullanıcısı; anonim oturum sayılmaz
function currentFirebaseUser() {
  try {
    const u = firebase.auth().currentUser;
    return u && !u.isAnonymous ? u : null;
  } catch (_) { return null; }
}

// Anonimden yükseltilen hesapta ad/e-posta üst düzeyde boş kalabilir; Google sağlayıcı kaydına bakılır
function googleAdi(u) {
  const g = (u.providerData || []).find((p) => p && p.providerId === "google.com") || {};
  return u.displayName || g.displayName || "";
}
function googleEpostasi(u) {
  const g = (u.providerData || []).find((p) => p && p.providerId === "google.com") || {};
  return u.email || g.email || "";
}

async function backupAccountGoogle() {
  const u = currentFirebaseUser();
  if (!u) { showToast(t("Önce Google ile giriş yap")); return; }
  if (!save.playerName) { showToast(t("Önce avcı adını ayarla")); return; }
  const payload = {
    name: save.playerName,
    googleName: googleAdi(u),
    googleEmail: googleEpostasi(u),
    save: JSON.stringify(save),
    updatedAt: Date.now(),
  };
  const ok = await rtdb.put(`accounts_google/${u.uid}`, payload);
  if (ok) showToast(t("✅ Bulut yedeği güncellendi"));
  else showToast(t("❌ Yedekleme başarısız"));
  refreshAccountScreen();
}

async function restoreAccountGoogle() {
  const u = currentFirebaseUser();
  if (!u) { showToast(t("Önce Google ile giriş yap")); return; }
  showToast(t("📥 İndiriliyor..."));
  const data = await rtdb.get(`accounts_google/${u.uid}`);
  if (!data || !data.save) { showToast(t("Bu Google hesabı için yedek yok")); return; }
  const who = data.name || googleAdi(u) || "?";
  if (!confirm(t("Bu cihazdaki ilerleme silinip \"{ad}\" hesabıyla değiştirilecek.\nDevam edilsin mi?", { ad: who }))) return;
  try {
    const parsed = JSON.parse(data.save);
    for (const k of Object.keys(save)) delete save[k];
    Object.assign(save, parsed);
    persistSave();
    Object.assign(save, loadSave()); // eski yedekte olmayan karakter/silah alanlarını tamamla
    audio.enabled = save.soundEnabled !== false;
    audio.volumes = Object.assign({ ghost: 1, fire: 1, sfx: 1, muzik: 0.6 }, save.volumes || {});
    refreshSoundButtons();
    refreshSoundSliders();
    showToast(t("✅ Geri yüklendi: {ad}", { ad: who }));
    goToMenu();
  } catch (e) {
    showToast(t("❌ Veri bozuk"));
  }
}

// ====== HESAP YEDEKLEME ======
function genAccountCode() {
  // Karıştırılabilir karakterler yok (0/O, 1/I/L)
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code.slice(0, 3) + "-" + code.slice(3); // "ABC-D23"
}

function getOrCreateAccountCode() {
  if (!save.accountCode) {
    save.accountCode = genAccountCode();
    persistSave();
  }
  return save.accountCode;
}

function openAccount() {
  refreshAccountScreen();
  showScreen("screen-account");
}

function refreshAccountScreen() {
  const codeEl = document.getElementById("account-code");
  const code = save.accountCode || "—";
  if (codeEl) codeEl.textContent = code;
  const nameEl = document.getElementById("account-player");
  if (nameEl) nameEl.textContent = save.playerName || "—";
  const statsEl = document.getElementById("account-stats");
  if (statsEl) {
    statsEl.innerHTML =
      `💰 ${save.para || 0} &nbsp; 💎 ${save.elmas || 0} &nbsp; 💚 ${save.zumrut || 0} &nbsp; ⭐ ${t("En yüksek bölüm: {n}", { n: save.highestLevel || 1 })}`;
  }
  // Google sign-in durumu
  const u = currentFirebaseUser();
  const signedInPane  = document.getElementById("google-signed-in");
  const signedOutPane = document.getElementById("google-signed-out");
  const gNameEl  = document.getElementById("google-display-name");
  const gEmailEl = document.getElementById("google-email");
  if (u) {
    if (signedInPane)  signedInPane.style.display  = "";
    if (signedOutPane) signedOutPane.style.display = "none";
    if (gNameEl)  gNameEl.textContent  = googleAdi(u);
    if (gEmailEl) gEmailEl.textContent = googleEpostasi(u);
  } else {
    if (signedInPane)  signedInPane.style.display  = "none";
    if (signedOutPane) signedOutPane.style.display = "";
  }
}

async function backupAccount() {
  if (!save.playerName) {
    showToast(t("Önce avcı adını ayarla"));
    return;
  }
  const u = await fbKullaniciBekle(10000);
  if (!u) { showToast(t("❌ Yedekleme başarısız (internet?)")); return; }
  const uid = u.uid;
  let ok = await kodluYedekYaz(uid);
  if (!ok) {
    // Kodun sahibi başka bir kullanıcı (kod başka cihazdan geri yüklendi ya da Google hesabı değişti):
    // o yedeğin üzerine yalnız sahibi yazabilir, bu cihaz yeni bir kod alır
    const mevcut = await rtdb.get(`accounts/${save.accountCode.replace("-", "_")}`);
    if (mevcut && mevcut.ownerUid && mevcut.ownerUid !== uid) {
      save.accountCode = genAccountCode();
      persistSave();
      if (await kodluYedekYaz(uid)) {
        showToast(t("✅ Yedeklendi — bu cihazın yeni kodu: {kod}", { kod: save.accountCode }));
        refreshAccountScreen();
        return;
      }
    }
  }
  if (ok) {
    showToast(t("✅ Yedeklendi"));
    refreshAccountScreen();
  } else {
    showToast(t("❌ Yedekleme başarısız (internet?)"));
  }
}

// accounts/{kod}: ownerUid = auth.uid (zorunlu; sahipsiz kaydı ilk yedekleyen sahiplenir)
function kodluYedekYaz(uid) {
  const key = getOrCreateAccountCode().replace("-", "_");
  return rtdb.put(`accounts/${key}`, {
    name: save.playerName,
    save: JSON.stringify(save),
    updatedAt: Date.now(),
    ownerUid: uid,
  });
}

async function restoreAccount() {
  const inp = document.getElementById("restore-code-input");
  let raw = ((inp && inp.value) || "").trim().toUpperCase();
  if (!raw) { showToast(t("Hesap kodunu yaz")); return; }
  raw = raw.replace(/[^A-Z0-9]/g, "");
  if (raw.length !== 6) { showToast(t("Kod 6 karakter olmalı")); return; }
  const key = raw.slice(0, 3) + "_" + raw.slice(3);
  const display = raw.slice(0, 3) + "-" + raw.slice(3);
  showToast(t("📥 İndiriliyor..."));
  const data = await rtdb.get(`accounts/${key}`);
  if (!data || !data.save) { showToast(t("❌ Hesap bulunamadı")); return; }
  const who = data.name || "?";
  if (!confirm(t("Bu cihazdaki ilerleme silinip \"{ad}\" hesabıyla değiştirilecek.\nDevam edilsin mi?", { ad: who }))) return;
  try {
    const parsed = JSON.parse(data.save);
    // Sıfırdan yükle: parsed save'i mevcut save'in üzerine yaz, accountCode'u koru
    for (const k of Object.keys(save)) delete save[k];
    Object.assign(save, parsed);
    save.accountCode = display;
    persistSave();
    Object.assign(save, loadSave()); // eski yedekte olmayan karakter/silah alanlarını tamamla
    // Ses ayarlarını yeniden uygula
    audio.enabled = save.soundEnabled !== false;
    audio.volumes = Object.assign({ ghost: 1, fire: 1, sfx: 1, muzik: 0.6 }, save.volumes || {});
    refreshSoundButtons();
    refreshSoundSliders();
    showToast(t("✅ Geri yüklendi: {ad}", { ad: who }));
    goToMenu();
  } catch (e) {
    showToast(t("❌ Veri bozuk"));
  }
}

function copyAccountCode() {
  const code = save.accountCode || getOrCreateAccountCode();
  // Modern API → fallback
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code).then(
      () => showToast(t("📋 Kopyalandı: {kod}", { kod: code })),
      () => fallbackCopy(code)
    );
  } else {
    fallbackCopy(code);
  }
}

function fallbackCopy(text) {
  try {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    showToast(t("📋 Kopyalandı: {kod}", { kod: text }));
  } catch (_) {
    showToast(t("Kodun: {kod}", { kod: text }));
  }
}

function toggleSound() {
  save.soundEnabled = !audio.enabled;
  audio.enabled = save.soundEnabled;
  persistSave();
  refreshSoundButtons();
  // Açıldıysa kısa onay sesi
  if (audio.enabled) {
    audio.init();
    audio.toast();
  }
  // Dünya Turu müziği: kapanınca 0,2 sn'de söner; açılınca oyun sürüyorsa teaser'sız döngü (geçişte sıradaki ülkenin,
  // damga anında hiçbiri: dunya-turu.js turMuzikUlkesi)
  muzikSesiniUygula();
  const u = turMuzikUlkesi();
  if (!audio.enabled) turMuzigiSondur(0.2);
  else if (u) turMuzigiBaslat(u.kod, { giris: false });
}

function refreshSoundButtons() {
  const on = audio.enabled !== false;
  const label = on ? t("🔊 Ses Açık") : t("🔇 Ses Kapalı");
  document.querySelectorAll(".sound-toggle").forEach((el) => {
    el.textContent = label;
    el.classList.toggle("sound-off", !on);
  });
}

// 3D karakterler aç/kapa (Ayarlar). Kapalıyken eski 2D çizim kullanılır.
function refresh3dButton() {
  const el = document.getElementById("btn-ayar3d");
  if (!el) return;
  const on = save.ayar3d !== false;
  el.textContent = on ? t("Açık") : t("Kapalı");
  el.classList.toggle("sound-off", !on);
  const lbl = document.getElementById("lbl-ayar3d");
  if (lbl) lbl.textContent = t("3D karakterler");
}
function toggle3d(zorla) {
  save.ayar3d = typeof zorla === "boolean" ? zorla : save.ayar3d === false;
  persistSave();
  if (window.UcAvci) {
    if (save.ayar3d) { if (window.UcAvci.ac) window.UcAvci.ac(); }
    else if (window.UcAvci.kapat) window.UcAvci.kapat();
  }
  refresh3dButton();
}
function uc3dUygula() {
  if (!window.UcAvci) return;
  if (save.ayar3d === false) { if (window.UcAvci.kapat) window.UcAvci.kapat(); }
  else if (!window.UcAvci.hazir && window.UcAvci.ac) window.UcAvci.ac();
  refresh3dButton();
}

// Açılırken açık olan bütün ekranlar hatırlanır, kapanınca hepsine dönülür. Oyun içinde iki ekran açıktır (oyun +
// üstünde ⏸ menüsü); 3.15.0'a kadar yalnız ilki hatırlanıyordu: ⏸ menüsü kayboluyor, oyun duraklatılmış kalıyor,
// "Devam" görünmüyordu (3.15.1, test/ayarlar.test.mjs)
let _soundReturnScreens = ["screen-menu"];
function openSoundSettings() {
  const acik = [...document.querySelectorAll(".screen.active")].map((s) => s.id).filter((id) => id && id !== "screen-sound");
  _soundReturnScreens = acik.length ? acik : ["screen-menu"];
  refreshSoundButtons();
  refreshSoundSliders();
  refresh3dButton();
  showScreen("screen-sound");
}

function closeSoundSettings() {
  showScreen(_soundReturnScreens[0]);
  for (const id of _soundReturnScreens.slice(1)) document.getElementById(id).classList.add("active");
}

function setVolume(cat, valStr) {
  const v = Math.max(0, Math.min(1, parseFloat(valStr) / 100));
  audio.volumes = Object.assign({}, audio.volumes, { [cat]: v });
  save.volumes = Object.assign({}, save.volumes || {}, { [cat]: v });
  persistSave();
  // Slider yanındaki yüzde rakamını güncelle
  const pct = Math.round(v * 100) + "%";
  const lbl = document.getElementById("vol-label-" + cat);
  if (lbl) lbl.textContent = pct;
  audio.init();
  // Müzik çalıyorsa önizleme odur: kazanç anında ayarlanır
  if (cat === "muzik") { muzikSesiniUygula(); return; }
  // Kategoriye uygun anında önizleme sesi (throttled)
  const now = performance.now();
  if (!audio._lastPreview || now - audio._lastPreview > 200) {
    audio._lastPreview = now;
    if (cat === "fire") audio.fire();
    else if (cat === "ghost") audio.bigGhost();
    else audio.pickup();
  }
}

function refreshSoundSliders() {
  const cats = ["muzik", "ghost", "fire", "sfx"];
  for (const cat of cats) {
    const v = audio.volumes && audio.volumes[cat] != null ? audio.volumes[cat] : cat === "muzik" ? 0.6 : 1;
    const slider = document.getElementById("vol-slider-" + cat);
    if (slider) slider.value = Math.round(v * 100);
    const lbl = document.getElementById("vol-label-" + cat);
    if (lbl) lbl.textContent = Math.round(v * 100) + "%";
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

window.addEventListener("DOMContentLoaded", init);
