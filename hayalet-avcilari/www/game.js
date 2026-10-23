/* ============================================================
   HAYALET AVCILARI
   Kızımız için yapılmış basit ve eğlenceli bir oyun.
   ============================================================ */

// ====== SES SİSTEMİ ======
const audio = {
  ctx: null,
  enabled: true,
  samples: {},
  // Kategori ses seviyeleri (0..1). save.volumes ile değiştirilebilir
  volumes: { ghost: 1, fire: 1, sfx: 1 },
  _preloaded: false,
  _lastSmallGhost: 0,
  _v(cat) { const v = this.volumes && this.volumes[cat]; return v == null ? 1 : v; },
  init() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") this.ctx.resume();
      this.preloadSamples();
      return;
    }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.preloadSamples();
    } catch (e) {}
  },
  preloadSamples() {
    if (this._preloaded || !this.ctx) return;
    this._preloaded = true;
    this.loadSample("smallGhost", "sfx/kucuk-hayalet.m4a");
    this.loadSample("bigGhost", "sfx/buyuk-hayalet.m4a");
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
  cachedRoom: null,      // { name, maxPlayers, hostUid, hostName, status, players }
  // Oyun içi senkronizasyon
  mode: null,            // null | "host" | "client"
  pushTimer: null,       // MP_PUSH_MS'de bir mpPush
  remotePlayers: {},     // { uid: { name, charKey, costumeIdx, x, y, hp, maxHp, dead, … ara değerleme tamponu } }
  pendingEvents: [],     // istemci → host olay kuyruğu (vuruş, para alma, cephane)
  sonDurum: 0,           // istemci: host'tan son durumun geldiği an (performance.now)
  sunucuFarki: 0,        // .info/serverTimeOffset
  alinanlar: new Set(),  // istemci: aldığım paraların kimlikleri (host silene kadar yeniden görünmesin)
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

// ====== KAYIT SİSTEMİ ======
const SAVE_KEY = "hayaletAvcilariSave_v1";
const LEADERBOARD_KEY = "hayaletAvcilariLeaderboard_v1";
const LEADERBOARD_MAX = 10;
const VERSION_KEY = "hayaletAvcilariLastSeenVersion";

// ====== SÜRÜM NOTLARI ======
const APP_VERSION = "3.12.2";
const UPDATE_NOTES = {
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

async function fetchOnlineLeaderboard(limit) {
  limit = limit || LEADERBOARD_MAX;
  // Önce tarihe göre azalan sırayla çek, JS tarafında isme göre tekilleştirip skora göre sırala
  const query = {
    structuredQuery: {
      from: [{ collectionId: FIREBASE.collection }],
      orderBy: [{ field: { fieldPath: "date" }, direction: "DESCENDING" }],
      limit: 200,
    }
  };
  try {
    const res = await fetch(`${FIRESTORE_BASE}:runQuery?key=${FIREBASE.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const all = data
      .filter((d) => d.document)
      .map((d) => {
        const f = d.document.fields || {};
        return {
          name:   f.name   ? f.name.stringValue                : t("Avcı"),
          level:  f.level  ? parseInt(f.level.integerValue)    : 1,
          ghosts: f.ghosts ? parseInt(f.ghosts.integerValue)   : 0,
          para:   f.para   ? parseInt(f.para.integerValue)     : 0,
          score:  f.score  ? parseInt(f.score.integerValue)    : 0,
          date:   f.date   ? parseInt(f.date.integerValue)     : 0,
        };
      });
    // Aynı isimden tek (en son) kayıt kalsın — tarih sıralı geldiği için ilk görüleni tut
    const seen = new Set();
    const unique = [];
    for (const e of all) {
      if (!e.name || seen.has(e.name)) continue;
      seen.add(e.name);
      unique.push(e);
    }
    // Skora göre sırala, ilk N'i döndür
    unique.sort((a, b) => b.score - a.score);
    return unique.slice(0, limit);
  } catch (e) {
    return null;
  }
}

const defaultSave = {
  playerName: "",
  para: 0,
  elmas: 0,
  zumrut: 0,
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
  highestLevel: 1,
  soundEnabled: true,
  volumes: { ghost: 1, fire: 1, sfx: 1 },
  accountCode: "",
};

let save = loadSave();

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
    baseRange: 220,
    color: { hair: "#7a3e1d", skin: "#f4d6b5", body: "#1d4ed8", legs: "#f4d6b5", weapon: "#e0e0e0" },
  },
  veryi: {
    name: "Veryi",
    desc: t("Güçlü vurucu."),
    cost: 5,
    baseSpeed: 2.6,
    baseDamage: 2,
    baseFireDelay: 700,
    baseRange: 180,
    color: { hair: "#3a1d0a", skin: "#f4d6b5", body: "#6b3410", legs: "#4a8c2a", weapon: "#7a7a7a" },
  },
  kornet: {
    name: "Kornet",
    desc: t("Uzun menzilli sihirbaz."),
    cost: 10,
    baseSpeed: 2.8,
    baseDamage: 1,
    baseFireDelay: 500,
    baseRange: 280,
    color: { hair: "#ffffff", skin: "#fafafa", body: "#9d4edd", legs: "#9d4edd", weapon: "#c026d3" },
  },
  mark: {
    name: "Marli",
    desc: t("Sırt çantalı maceracı."),
    cost: 25,
    baseSpeed: 3.0,
    baseDamage: 1,
    baseFireDelay: 580,
    baseRange: 230,
    color: { hair: "#5a3825", skin: "#f4d6b5", body: "#10b981", legs: "#374151", weapon: "#e0e0e0" },
  },
  kent: {
    name: "Kenit",
    desc: t("Karanlık hayalet pelerin, bıçaklı."),
    cost: 50,
    baseSpeed: 3.4,
    baseDamage: 2,
    baseFireDelay: 480,
    baseRange: 200,
    color: { hair: "#1f1f1f", skin: "#e8e8f0", body: "#1a1a2e", legs: "#0f0f1a", weapon: "#9ca3af" },
  },
  ponko: {
    name: "Ponko",
    desc: t("Büyük şapkalı küçük kahraman."),
    cost: 30,
    baseSpeed: 3.0,
    baseDamage: 1,
    baseFireDelay: 450,
    baseRange: 220,
    color: { hair: "#3a1d0a", skin: "#f4d6b5", body: "#ef4444", legs: "#1f2937", weapon: "#e0e0e0" },
  },
  gul: {
    name: "Güllu",
    desc: t("Şapkalı dengeli avcı."),
    cost: 15,
    baseSpeed: 3.2,
    baseDamage: 1,
    baseFireDelay: 580,
    baseRange: 240,
    color: { hair: "#3a1d0a", skin: "#f4d6b5", body: "#ec4899", legs: "#831843", weapon: "#e0e0e0" },
  },
  rani: {
    name: "Rani",
    desc: t("Sevimli minik avcı."),
    cost: 35,
    baseSpeed: 3.3,
    baseDamage: 1,
    baseFireDelay: 520,
    baseRange: 220,
    color: { hair: "#1f1f1f", skin: "#fce7d8", body: "#06b6d4", legs: "#0e7490", weapon: "#fde68a" },
  },
  beti: {
    name: "Beri",
    desc: t("Lolipop canavarı! Suyun içinden geçer."),
    cost: 20,
    baseSpeed: 3.0,
    baseDamage: 2,
    baseFireDelay: 550,
    baseRange: 250,
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
    baseRange: 280,
    color: { hair: "#0a0a0a", skin: "#f4d6b5", body: "#fafafa", legs: "#fafafa", weapon: "#dc2626" },
  },
  silsen: {
    name: "Silsen",
    desc: t("Çiçek bayraklı avcı, vurunca çiçek top atar."),
    cost: 25,
    baseSpeed: 3.1,
    baseDamage: 1,
    baseFireDelay: 520,
    baseRange: 240,
    color: { hair: "#4a2511", skin: "#f4d6b5", body: "#4ade80", legs: "#f4d6b5", weapon: "#fbbf24" },
  },
  sercin: {
    name: "Serçin",
    desc: t("Serçe gibi çevik, tüy fırlatır."),
    cost: 30,
    baseSpeed: 3.5,
    baseDamage: 1,
    baseFireDelay: 500,
    baseRange: 230,
    color: { hair: "#1f1f1f", skin: "#f4d6b5", body: "#a16207", legs: "#78350f", weapon: "#fef3c7" },
  },
};

// Kostümler: her karakter için (0 = orijinal, 1 = alternatif)
const COSTUMES = {
  kinkin: [
    { name: t("Mavi"), cost: 0, body: "#1d4ed8", hair: "#7a3e1d" },
    { name: t("Pembe Prenses"), cost: 5, body: "#ec4899", hair: "#fbbf24" },
    { name: t("✨ Altın Efsane"), cost: 80, body: "#f59e0b", hair: "#fef3c7" },
  ],
  veryi: [
    { name: t("Klasik"), cost: 0, body: "#6b3410", hair: "#3a1d0a" },
    { name: t("Asker"), cost: 5, body: "#1f5e1a", hair: "#1f1f1f" },
    { name: t("✨ Bronz Şampiyon"), cost: 80, body: "#92400e", hair: "#fbbf24" },
  ],
  kornet: [
    { name: t("Mor"), cost: 0, body: "#9d4edd", hair: "#ffffff" },
    { name: t("Şeker"), cost: 5, body: "#06d6a0", hair: "#fff7d6" },
    { name: t("✨ Galaksi Sihirbazı"), cost: 100, body: "#0ea5e9", hair: "#a78bfa" },
  ],
  mark: [
    { name: t("Yeşil"), cost: 0, body: "#10b981", hair: "#5a3825" },
    { name: t("Mavi"), cost: 5, body: "#3b82f6", hair: "#1f2937" },
    { name: t("✨ Altın Maceracı"), cost: 80, body: "#fbbf24", hair: "#7c2d12" },
  ],
  kent: [
    { name: t("Karanlık"), cost: 0, body: "#1a1a2e", hair: "#1f1f1f" },
    { name: t("Kanlı"), cost: 6, body: "#7f1d1d", hair: "#1f1f1f" },
    { name: t("✨ Hayalet Lordu"), cost: 120, body: "#3b0764", hair: "#0f172a" },
  ],
  ponko: [
    { name: t("Kırmızı"), cost: 0, body: "#ef4444", hair: "#3a1d0a" },
    { name: t("Sarı"), cost: 5, body: "#f59e0b", hair: "#3a1d0a" },
    { name: t("✨ Altın Şapka"), cost: 80, body: "#fbbf24", hair: "#451a03" },
  ],
  gul: [
    { name: t("Pembe"), cost: 0, body: "#ec4899", hair: "#3a1d0a" },
    { name: t("Mor"), cost: 5, body: "#8b5cf6", hair: "#3a1d0a" },
    { name: t("✨ Kraliçe"), cost: 100, body: "#f0abfc", hair: "#fbbf24" },
  ],
  rani: [
    { name: t("Turkuaz"), cost: 0, body: "#06b6d4", hair: "#1f1f1f" },
    { name: t("Limon"), cost: 5, body: "#84cc16", hair: "#1f1f1f" },
    { name: t("✨ Pırıltı"), cost: 80, body: "#fde047", hair: "#7c3aed" },
  ],
  beti: [
    { name: t("Şeker"), cost: 0, body: "#f43f5e", hair: "#9d4edd" },
    { name: t("Çikolata"), cost: 6, body: "#78350f", hair: "#fbbf24" },
    { name: t("✨ Gökkuşağı Lolipop"), cost: 100, body: "#22d3ee", hair: "#f472b6" },
  ],
  fanatik: [
    { name: t("Beyaz Gi"), cost: 0, body: "#fafafa", hair: "#0a0a0a" },
    { name: t("Kırmızı Gi"), cost: 8, body: "#dc2626", hair: "#0a0a0a" },
    { name: t("✨ Ejder Ustası"), cost: 150, body: "#1e293b", hair: "#fbbf24" },
  ],
  silsen: [
    { name: t("Bahar"), cost: 0, body: "#4ade80", hair: "#4a2511" },
    { name: t("Lale"), cost: 5, body: "#f43f5e", hair: "#1f1f1f" },
  ],
  sercin: [
    { name: t("Serçe"), cost: 0, body: "#a16207", hair: "#1f1f1f" },
    // Kulaklı ve kanatlı kostüm (çizim: Serçin'in kostümü)
    { name: t("Kanatlı Kedi"), cost: 8, body: "#fb923c", hair: "#7c2d12", ears: true, wings: true },
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
  showToast(`${def.icon} ${def.name}!`);
  audio.unlock();
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
  kasirga:  { name: t("Kasırga"),     icon: "🌪️", cost: 120, desc: t("8 sn etrafında dönen kalkan, dokunan ölür."), max: 9 },
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
  pompali:  { name: t("Saçmalı Top"),        cost: 800,  desc: t("Bir atışta üç saçma, kısa menzil."),          delayMul: 1.15, dmgMul: 1, speed: 520, spread: [-0.22, 0, 0.22], life: 0.8 },
  bazuka:   { name: t("Dev Bazuka"),         cost: 1200, desc: t("Yavaş ama üç kat hasar."),                    delayMul: 1.7,  dmgMul: 3, speed: 400 },
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
}

function refreshWeaponBar() {
  const bar = document.getElementById("weapon-bar");
  if (!bar) return;
  if (!game || !game.player || !game.running) { bar.innerHTML = ""; return; }
  const stock = ensureAmmoStock(game.player.charKey);
  bar.innerHTML = "";
  Object.keys(WEAPONS).forEach((key) => {
    const count = stock[key] || 0;
    if (count <= 0) return;
    const w = WEAPONS[key];
    const btn = document.createElement("button");
    btn.className = "weapon-slot";
    btn.title = `${w.name}: ${w.desc}`;
    btn.innerHTML = `<span>${w.icon}</span><span class="badge">${count}</span>`;
    const trigger = (e) => { e.preventDefault(); e.stopPropagation(); useWeapon(key); };
    btn.addEventListener("touchstart", trigger, { passive: false });
    btn.addEventListener("click", trigger);
    bar.appendChild(btn);
  });
}

function useWeapon(key) {
  if (!game || !game.player || !game.running || game.paused) return;
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
      for (let i = 0; i < 24; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 120 + Math.random() * 160;
        game.particles.push({ x: px, y: py, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.6, color: "#fb923c" });
      }
      showFloat(`💣 ${hit}`, px, py - 36);
      audio.bossDie();
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
      audio.unlock();
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
          hit++;
        }
      } else {
        for (const g of game.ghosts) {
          if (!visible(g)) continue;
          g.hp -= 3;
          spawnHitParticles(g.x, g.y);
          game.effects.push({ type: "spark", x: g.x, y: g.y, ghost: g, life: 0.5, maxLife: 0.5 });
          hit++;
        }
      }
      showFloat(`⚡ ${hit}`, px, py - 36);
      audio.gem();
      navigator.vibrate?.(30);
      break;
    }
    case "kasirga": {
      game.player.kasirgaUntil = now + 8000;
      showFloat(t("🌪️ Kasırga!"), px, py - 36);
      audio.unlock();
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
        audio.heart();
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
          });
        }
        audio.unlock();
      } else {
        showToast(t("Hedef yok"));
        consumed = false;
      }
      break;
    }
    case "gorunmez": {
      game.player.invisibleUntil = now + 5000;
      showFloat(t("🕵 Görünmez!"), px, py - 36);
      audio.unlock();
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
      // Ruh çıkıyor gibi yukarı süzül
      e.y -= 45 * dt;
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
    } else if (e.type === "rocket") {
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      let exploded = false;
      const t = e.target;
      if (t && t.hp > 0 && game.ghosts.indexOf(t) !== -1) {
        if (Math.hypot(t.x - e.x, t.y - e.y) < (t.r || 22) + 14) {
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
        audio.bossDie();
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
    ctx.save();
    ctx.globalAlpha = alpha * 0.7;
    drawGhost(ctx, e);
    ctx.restore();
  }
}

function drawEnemyProjectile(ctx, p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  const r = p.isBoss ? 9 : 6;
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
  speed:    { name: t("Hız"),      icon: "👟", desc: t("Daha hızlı koş."),   max: 10, costs: [50,  100, 200, 400,  800,  1600, 3200, 6400,  12000, 24000] },
  damage:   { name: t("Hasar"),    icon: "💥", desc: t("Daha güçlü vur."),   max: 10, costs: [75,  150, 300, 600,  1200, 2400, 4800, 9600,  18000, 36000] },
  fireRate: { name: t("Atış Hızı"),icon: "⚡", desc: t("Hızlı ateş et."),    max: 10, costs: [60,  120, 240, 480,  960,  1920, 3840, 7680,  15000, 30000] },
  range:    { name: t("Menzil"),   icon: "🎯", desc: t("Uzaktan vur."),       max: 10, costs: [50,  100, 200, 400,  800,  1600, 3200, 6400,  12000, 24000] },
};

// ====== ÇİZİM YARDIMCILARI ======
function drawCharacter(ctx, charKey, costumeIdx, x, y, size, faceDir = 0, walkPhase = 0, aimRaise = 0, shootRecoil = 0, gunKey = "") {
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
  ctx.translate(x, y - bob);
  ctx.rotate(torsoLean);

  // Gölge
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.ellipse(0, 45 * s, 22 * s, 7 * s, 0, 0, Math.PI * 2);
  ctx.fill();

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
function drawGunShape(ctx, gunKey, s) {
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
  const s = size / 40;

  // Boss için kırmızı aura
  if (g.isBoss) {
    const t = performance.now() / 300;
    const auraR = size * 0.95 + Math.sin(t) * 4;
    const auraGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, auraR);
    auraGrad.addColorStop(0, "rgba(255, 70, 70, 0.45)");
    auraGrad.addColorStop(1, "rgba(255, 70, 70, 0)");
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, auraR, 0, Math.PI * 2);
    ctx.fill();
  }

  // Gölge
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.ellipse(0, 22 * s, 18 * s, 5 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tonlama (HP'ye göre renk)
  let bodyColor;
  if (g.isBoss) bodyColor = "#dc2626";
  else if (maxHp >= 5) bodyColor = "#a78bfa";
  else if (maxHp >= 3) bodyColor = "#fda4af";
  else if (maxHp >= 2) bodyColor = "#fde68a";
  else bodyColor = "#ffffff";
  // Shooter (ateş eden) hayalet: kırmızımsı mor + parlayan kontur
  if (g.isShooter) bodyColor = "#c084fc";
  // Donmuş hayalet: buz mavisi tonu
  const isFrozen = (g.frozenUntil || 0) > performance.now();
  if (isFrozen) bodyColor = "#bae6fd";

  // Vücut
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.arc(0, -5 * s, 18 * s, Math.PI, 0);
  ctx.lineTo(18 * s, 18 * s);
  const wave = 4;
  for (let i = wave; i >= 0; i--) {
    const wx = -18 * s + (i / wave) * 36 * s;
    const wy = (i % 2 === 0 ? 14 : 22) * s;
    ctx.lineTo(wx, wy);
  }
  ctx.lineTo(-18 * s, 18 * s);
  ctx.closePath();
  ctx.fill();

  // Boss tacı
  if (g.isBoss) {
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
  }

  // Gözler
  ctx.fillStyle = g.isBoss ? "#fde047" : "#222";
  ctx.beginPath();
  ctx.arc(-6 * s, -5 * s, 3 * s, 0, Math.PI * 2);
  ctx.arc(6 * s, -5 * s, 3 * s, 0, Math.PI * 2);
  ctx.fill();

  // Ağız
  ctx.fillStyle = g.isBoss ? "#7f1d1d" : "#222";
  ctx.beginPath();
  ctx.ellipse(0, 3 * s, g.isBoss ? 5 * s : 3 * s, g.isBoss ? 5 * s : 4 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // HP barı
  if (hp < maxHp) {
    const w = (g.isBoss ? 60 : 32) * s;
    const hpY = g.isBoss ? -44 * s : -28 * s;
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(-w / 2, hpY, w, 5 * s);
    ctx.fillStyle = g.isBoss ? "#ef4444" : "#06d6a0";
    ctx.fillRect(-w / 2, hpY, w * (hp / maxHp), 5 * s);
  }

  ctx.restore();
}

function drawWall(ctx, x, y, w, h) {
  const th = getTheme();
  ctx.fillStyle = th.wall;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = th.wallDark;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  // Tuğla deseni
  ctx.fillStyle = th.wallDark;
  for (let row = 0; row * 16 < h; row++) {
    const offsetX = row % 2 === 0 ? 0 : 16;
    for (let col = 0; col * 32 < w; col++) {
      const bx = x + col * 32 + offsetX;
      const by = y + row * 16;
      if (bx + 32 <= x + w && by + 16 <= y + h) {
        ctx.fillRect(bx + 30, by, 2, 16);
        ctx.fillRect(bx, by + 14, 32, 2);
      }
    }
  }
}

function drawWater(ctx, x, y, w, h) {
  // Sabit mavi gradient — bölüm temasından bağımsız
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, "#1e7fd6");
  grad.addColorStop(1, "#0a3a8a");
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  // Dalgalar
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 1.5;
  const t = performance.now() / 400;
  for (let row = 10; row < h - 4; row += 14) {
    ctx.beginPath();
    for (let col = 0; col <= w; col += 8) {
      const wy = y + row + Math.sin((col + t * 30) / 22) * 2.5;
      if (col === 0) ctx.moveTo(x + col, wy);
      else ctx.lineTo(x + col, wy);
    }
    ctx.stroke();
  }

  // Köpük (üst)
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  for (let col = 0; col < w; col += 24) {
    const sparkle = Math.sin((col + t * 60) / 18);
    if (sparkle > 0.6) {
      ctx.fillRect(x + col, y + 4, 8, 2);
    }
  }

  // Kenar
  ctx.strokeStyle = "#062a66";
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
}

function drawSpike(ctx, x, y, w, h) {
  // Koyu zemin
  ctx.fillStyle = "#1a0b14";
  ctx.fillRect(x, y, w, h);
  // Çapraz tarama deseni
  ctx.strokeStyle = "rgba(120, 80, 100, 0.25)";
  ctx.lineWidth = 1;
  for (let i = -h; i < w; i += 8) {
    ctx.beginPath(); ctx.moveTo(x + i, y); ctx.lineTo(x + i + h, y + h); ctx.stroke();
  }
  // Sivri uçlar (dik üçgenler)
  const spikeW = 12;
  const cols = Math.floor(w / spikeW);
  const rows = Math.floor(h / spikeW);
  ctx.fillStyle = "#cbd5e1";
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const sx = x + c * spikeW + spikeW / 2;
      const sy = y + r * spikeW + spikeW;
      ctx.beginPath();
      ctx.moveTo(sx - spikeW / 2 + 1, sy);
      ctx.lineTo(sx, sy - spikeW + 1);
      ctx.lineTo(sx + spikeW / 2 - 1, sy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }
  // Kenar
  ctx.strokeStyle = "#7f1d1d";
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
}

function drawLava(ctx, x, y, w, h) {
  const t = performance.now() / 300;
  // Dış glow (parlak halo) — tehlike olduğunu net göster
  const glowPulse = 0.6 + Math.sin(performance.now() / 220) * 0.25;
  ctx.save();
  ctx.shadowColor = "#fb923c";
  ctx.shadowBlur = 28 * glowPulse;
  ctx.fillStyle = "rgba(0,0,0,0)";
  ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
  ctx.restore();
  // Kontrastlı koyu zemin (lavın "magma kabuğu" hissi)
  ctx.fillStyle = "#1a0202";
  ctx.fillRect(x, y, w, h);
  // İç kısımda parlak gradient (kabukta çatlak gibi)
  const grad = ctx.createRadialGradient(x + w/2, y + h/2, 4, x + w/2, y + h/2, Math.max(w, h) * 0.7);
  grad.addColorStop(0,    "#fef3c7");
  grad.addColorStop(0.25, "#facc15");
  grad.addColorStop(0.55, "#f97316");
  grad.addColorStop(0.85, "#dc2626");
  grad.addColorStop(1,    "#450a0a");
  ctx.fillStyle = grad;
  ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
  // Magma çatlakları (zigzag kırmızı çizgiler)
  ctx.strokeStyle = "rgba(254, 240, 138, 0.85)";
  ctx.lineWidth = 1.8;
  for (let k = 0; k < 4; k++) {
    const cy = y + 12 + k * (h - 24) / 4;
    ctx.beginPath();
    for (let col = 4; col < w - 4; col += 6) {
      const wy = cy + Math.sin((col + t * 60 + k * 30) / 14) * 4;
      if (col === 4) ctx.moveTo(x + col, wy);
      else ctx.lineTo(x + col, wy);
    }
    ctx.stroke();
  }
  // Patlayan baloncuklar (parlak)
  ctx.fillStyle = "rgba(255, 250, 200, 0.95)";
  for (let i = 0; i < 9; i++) {
    const bx = x + 6 + ((i * 47 + t * 22) % (w - 12));
    const by = y + h - 10 - ((i * 31 + t * 18) % (h - 18));
    const br = 2.2 + ((i + Math.floor(t)) % 4) * 0.7;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();
    // Parlama halkası
    ctx.strokeStyle = "rgba(254, 215, 170, 0.7)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(bx, by, br + 2, 0, Math.PI * 2);
    ctx.stroke();
  }
  // 🔥 Sembolleri (her köşede sıcaklık göstergesi)
  const flameSize = Math.min(20, Math.min(w, h) / 4);
  ctx.font = `${flameSize}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const flicker = 1 + Math.sin(performance.now() / 120) * 0.08;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(flicker, flicker);
  ctx.fillText("🔥", 0, 0);
  ctx.restore();
  // Çift kenar (iç sarı + dış koyu kırmızı) — kontrast
  ctx.strokeStyle = "#fde047";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
  ctx.strokeStyle = "#7f1d1d";
  ctx.lineWidth = 5;
  ctx.strokeRect(x, y, w, h);
}

function drawProjectile(ctx, p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  const ang = Math.atan2(p.vy, p.vx);
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
      ctx.rotate(ang);
      ctx.shadowColor = "#f87171"; ctx.shadowBlur = 12;
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(-10, -1.8, 20, 3.6);
      ctx.fillStyle = "#fee2e2";
      ctx.fillRect(-8, -0.6, 16, 1.2);
      break;
    case "yesil":
      ctx.fillStyle = "#22c55e";
      ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#14532d"; ctx.lineWidth = 1; ctx.stroke();
      break;
    case "pompali":
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

function drawPickup(ctx, p) {
  // Son 3 saniyede yanıp sön → bu kareyi atla
  if (p.life !== undefined && p.life < 3) {
    if (Math.floor(p.life * 8) % 2 === 0) return;
  }
  ctx.save();
  ctx.translate(p.x, p.y);
  const bob = Math.sin(performance.now() / 200 + p.x) * 3;
  ctx.translate(0, bob);

  if (p.kind === "kalp") {
    // Pulsing kırmızı kalp — çok dikkat çekici
    const t = performance.now() / 180;
    const sc = 1 + Math.sin(t) * 0.18;
    ctx.scale(sc, sc);
    // Aura
    const aura = ctx.createRadialGradient(0, 0, 0, 0, 0, 22);
    aura.addColorStop(0, "rgba(252, 165, 165, 0.6)");
    aura.addColorStop(1, "rgba(252, 165, 165, 0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();
    // Kalp gövdesi
    ctx.shadowColor = "#fca5a5";
    ctx.shadowBlur = 14;
    ctx.fillStyle = "#ef4444";
    drawHeart(ctx, 0, -3, 11);
    // Parlama
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    drawHeart(ctx, -3, -5, 3);
  } else if (p.kind === "guc") {
    // Dönen güç yıldızı + karakter ikonu
    const t = performance.now() / 300;
    ctx.save();
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
    ctx.restore();
    // İçinde aktif karakterin ikonu
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#7c2d12";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const ikon = (CHAR_POWERS[game.player && game.player.charKey] || CHAR_POWERS.kinkin).icon;
    ctx.fillText(ikon, 0, 1);
  } else if (p.kind === "para") {
    ctx.fillStyle = "#ffd166";
    ctx.shadowColor = "#ffd166";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#a16207";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("$", 0, 1);
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
  }
  ctx.restore();
}

// ====== EKRAN YÖNETİMİ ======
function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function goToMenu() {
  showScreen("screen-menu");
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
  let roomId = null, room = null;
  for (let deneme = 0; deneme < 3 && !roomId; deneme++) { // aynı kodlu oda varsa (çok nadir) yeni kodla dene
    const id = makeRoomId();
    room = {
      name,
      hostUid: uid,
      hostName: save.playerName,
      level: 1,
      status: "lobby",
      maxPlayers: online.selectedMax || 6,
      createdAt: sunucuZamani(),
      lastSeen: sunucuZamani(),
      players: { [uid]: makePlayerEntry(true) },
    };
    if (await rtdb.put(`rooms/${id}`, room)) roomId = id;
    else if (room.maxPlayers > 5 && /permission/i.test(online.lastError || "")) {
      // Konsoldaki kurallar 3.12.2'den eskiyse (en çok 5 kişi) 6 kişilik oda reddedilir: oda 5 kişilik kurulur
      room.maxPlayers = 5;
      if (await rtdb.put(`rooms/${id}`, room)) roomId = id;
    }
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

function makePlayerEntry(ready) {
  return {
    name: save.playerName || t("Avcı"),
    charKey: save.selectedChar || "kinkin",
    costumeIdx: (save.selectedCostume && save.selectedCostume[save.selectedChar]) || 0,
    ready: !!ready,
    joinedAt: sunucuZamani(),
    lastSeen: sunucuZamani(),
  };
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
        <div class="room-meta">👤 ${escapeHtml(r.hostName || "?")} · <b>${r.playerCount}/${r.maxPlayers}</b> ${t("oyuncu")}</div>
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
  const giris = makePlayerEntry(room.status === "playing");
  if (players[uid] && players[uid].joinedAt) giris.joinedAt = players[uid].joinedAt;
  if (!await rtdb.put(`rooms/${roomId}/players/${uid}`, giris)) { showToast(t("Oda bulunamadı")); return; }
  if (room.status === "lobby") rtdb.patch(`rooms/${roomId}`, { lastSeen: sunucuZamani() });
  else showToast(t("🎮 Oyun sürüyor, hemen katılıyorsun!"));
  online.roomId = roomId;
  online.isHost = (room.hostUid === uid);
  enterLobby(room);
}

function enterLobby(room) {
  listeyiKapat();
  online.ayriliyor = false;
  online.cachedRoom = {
    name: room.name, maxPlayers: room.maxPlayers || 5, hostUid: room.hostUid, hostName: room.hostName,
    status: room.status || "lobby", players: room.players || {},
  };
  online.alinanlar = new Set();
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
  renderInviteModal(); // açıksa: "Bu odada" ve oda dolu durumu
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
  const kayit = makePlayerEntry(benim ? !!benim.ready : (!!r && r.status === "playing"));
  if (benim && benim.joinedAt) kayit.joinedAt = benim.joinedAt;
  if (game.running && online.mode && game.player) Object.assign(kayit, oyuncuAnlik());
  _sonOyuncuKaydi = {}; // sonraki yazımda bütün alanlar yeniden gider
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
  online.vuranlar = new Set();
  online.vurduklarim = new Map();
  online.sonDurum = performance.now();
  document.getElementById("screen-gameover").classList.remove("active");
  showToast(online.isHost ? t("👑 Host olarak başlattın") : t("🌐 Bağlanıldı"));
  startGame();
  uzakOyunculariGuncelle((online.cachedRoom && online.cachedRoom.players) || {});
  startMpSync();
}

function startMpSync() {
  stopMpSync();
  _sonOyuncuKaydi = {};
  _sonTamKayit = 0;
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
  if (!Object.keys(degisen).length) return;
  Object.assign(_sonOyuncuKaydi, degisen);
  await rtdb.patch(`rooms/${online.roomId}/players/${online.uid}`, degisen);
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
    lvl: game.level,
    bd: game.bossDefeated ? 1 : 0,
    bt: Math.round((game.bossSpawnTimer || 0) * 10) / 10,
    lt: game.levelTransitioning ? 1 : 0,
  };
  const p = [];
  for (const q of game.pickups) {
    if (!Number.isFinite(q.x) || !Number.isFinite(q.y)) continue;
    const o = { i: kimlik(q), x: Math.round(q.x), y: Math.round(q.y), kind: q.kind };
    if (Number.isFinite(q.value)) o.value = q.value;
    p.push(o);
  }
  const imza = JSON.stringify(p);
  if (imza !== _sonPickupImza) govde.p = p;
  if (await rtdb.patch(`rooms/${online.roomId}/state`, govde) && govde.p) _sonPickupImza = imza;
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
  if (typeof st.lvl === "number" && st.lvl !== game.level) clientApplyLevel(st.lvl);
  game.bossDefeated = !!st.bd;
  game.bossSpawnTimer = st.bt || 0;
  game.levelTransitioning = !!st.lt;

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
  game.effects.push({ type: "ghostFade", x: g.x, y: g.y, size: g.size || 40, hp: 0, maxHp: g.maxHp || 1, isBoss: !!g.isBoss, life: 1, maxLife: 1 });
  spawnDeathParticles(g.x, g.y);
  if (g.isBoss) { showToast(t("👑 BOSS YENİLDİ! Kalan hayaletleri temizle!")); audio.bossDie(); }
  const vurus = online.vurduklarim.get(g._idx);
  online.vurduklarim.delete(g._idx);
  if (vurus && performance.now() - vurus < 3000) {
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
  _sonPickupImza = "";
  startEventsListener();
}

function istemciOl() {
  online.mode = "client";
  stopEventsListener();
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
  const yol = `rooms/${online.roomId}`;
  await rtdb.patch(yol, { status: "lobby", lastSeen: sunucuZamani() });
  rtdb.put(`${yol}/state`, null);
  rtdb.put(`${yol}/events`, null);
}

// Herkeste (host dahil) status "lobby" olunca: ödüller, şampiyon listesi, sonuç ekranı; oda ve lobi sürer
function turSonu() {
  if (!game.running) return;
  stopMpSync();
  const hostum = online.isHost;
  online.mode = null;
  online.remotePlayers = {};
  hostBeklemeGostergesi(0);
  game.menude = false;
  document.getElementById("screen-pause").classList.remove("active");
  oyunSonu(false, true);
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
      if (g.hp <= 0) killGhost(g, game.ghosts.indexOf(g));
      else audio.hit();
    }
  } else if (ev.type === "mermi") {
    // İstemci bir düşman mermisini vurdu ya da mermi ona çarptı: host'ta da biter
    const k = game.enemyProjectiles.findIndex((p) => p.id === ev.gi);
    if (k >= 0) game.enemyProjectiles.splice(k, 1);
  } else if (ev.type === "pickup") {
    const k = game.pickups.findIndex((p) => p.id === ev.pi);
    if (k >= 0) game.pickups.splice(k, 1);
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
    // İstemci roket attı — host hayata geçirir
    const hedef = hayaletBul(ev.gi);
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
  ensurePlayerSafe();
  yenidenDog();
  showToast(t("📚 Bölüm {n} — {tema}", { n: game.level, tema: getTheme().name }));
}

// Çevrimiçi oyunda hayalet olan oyuncu yeni bölümde doğar
function yenidenDog() {
  if (!game.player || !game.player.dead) return;
  game.player.dead = false;
  game.player.hp = game.player.maxHp;
  game.player.invuln = 2;
  showToast(t("💖 Yeniden doğdun!"));
  audio.heart();
}

// Oyun yarıda bırakılınca (odadan çıkma, oda kapanması) o ana kadarki kazançlar kaydedilir
function flushOnlineRewards() {
  if (game.runPara)   save.para   += game.runPara;
  if (game.runElmas)  save.elmas  += game.runElmas;
  if (game.runZumrut) save.zumrut += game.runZumrut;
  if (game.level > save.highestLevel) save.highestLevel = game.level;
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
}

async function refreshLeaderboard() {
  const container = document.getElementById("leaderboard-list");
  if (leaderboardSource === "online") {
    container.innerHTML = `<div class="leaderboard-empty">${t("🌐 Yükleniyor...")}</div>`;
    const online = await fetchOnlineLeaderboard(LEADERBOARD_MAX);
    if (online === null) {
      // İnternet yok ya da hata — yerele düş
      container.innerHTML = `<div class="leaderboard-empty">${t("⚠ İnternete bağlanılamadı, yerel liste gösteriliyor.")}</div>`;
      setTimeout(() => renderLeaderboard(loadLeaderboard(), "local"), 600);
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
function drawGreeter() {
  const el = document.getElementById("kinkin-greeter");
  const cv = document.createElement("canvas");
  cv.width = 200; cv.height = 220;
  const ctx = cv.getContext("2d");
  drawCharacter(ctx, "kinkin", 0, 100, 130, 180);
  el.style.backgroundImage = `url(${cv.toDataURL()})`;
}

// ====== MENÜ ======
function refreshMenu() {
  document.getElementById("menu-player").textContent = save.playerName || t("Avcı");
  document.getElementById("menu-para").textContent = save.para;
  document.getElementById("menu-elmas").textContent = save.elmas;
  document.getElementById("menu-zumrut").textContent = save.zumrut;

  // Karakter önizleme
  const charKey = save.selectedChar;
  const c = CHARACTERS[charKey];
  const costumeIdx = save.selectedCostume[charKey];
  const cv = document.createElement("canvas");
  cv.width = 160; cv.height = 180;
  const ctx = cv.getContext("2d");
  drawCharacter(ctx, charKey, costumeIdx, 80, 110, 160);
  const preview = document.getElementById("character-preview");
  preview.style.backgroundImage = `url(${cv.toDataURL()})`;
  preview.style.backgroundSize = "contain";
  preview.style.backgroundRepeat = "no-repeat";
  preview.style.backgroundPosition = "center";

  document.getElementById("character-name").textContent = c.name;
  const stats = computeStats(charKey);
  document.getElementById("character-stats").textContent =
    t("🏃 Hız {hiz} · 💥 Hasar {hasar} · 🎯 Menzil {menzil}", { hiz: stats.speed.toFixed(1), hasar: stats.damage, menzil: Math.round(stats.range) });
  rozetiGuncelle(); // 👫 düğmesindeki istek + davet sayısı (arkadaslar.js)
}

function refreshCharacters() {
  document.getElementById("char-zumrut").textContent = save.zumrut;
  const list = document.getElementById("character-list");
  list.innerHTML = "";

  Object.keys(CHARACTERS).forEach((key) => {
    const c = CHARACTERS[key];
    const unlocked = save.unlockedChars[key];
    const selected = save.selectedChar === key;

    const card = document.createElement("div");
    card.className = "char-card" + (selected ? " selected" : "") + (!unlocked ? " locked" : "");

    const cv = document.createElement("canvas");
    cv.width = 80; cv.height = 90;
    const ctx = cv.getContext("2d");
    drawCharacter(ctx, key, save.selectedCostume[key] || 0, 40, 60, 80);
    const img = document.createElement("div");
    img.className = "char-img";
    img.style.backgroundImage = `url(${cv.toDataURL()})`;
    img.style.backgroundSize = "contain";
    img.style.backgroundRepeat = "no-repeat";
    img.style.backgroundPosition = "center";
    card.appendChild(img);

    const label = document.createElement("div");
    label.className = "char-label";
    label.textContent = c.name;
    card.appendChild(label);

    const info = document.createElement("div");
    info.className = "char-cost";
    if (!unlocked) info.textContent = `💚 ${c.cost}`;
    else if (selected) info.textContent = t("✓ Seçili");
    else info.textContent = t("Tıkla seç");
    card.appendChild(info);

    card.onclick = () => {
      if (unlocked) {
        save.selectedChar = key;
        persistSave();
        refreshCharacters();
        showToast(t("{ad} seçildi!", { ad: c.name }));
      } else {
        if (save.zumrut >= c.cost) {
          if (confirm(t("{ad} {n} 💚 zümrüt karşılığında alınsın mı?", { ad: c.name, n: c.cost }))) {
            save.zumrut -= c.cost;
            save.unlockedChars[key] = true;
            save.selectedChar = key;
            persistSave();
            refreshCharacters();
            showToast(t("🎉 {ad} açıldı!", { ad: c.name }));
            audio.unlock();
          }
        } else {
          showToast(t("Yeterli zümrüt yok 💚"));
        }
      }
    };

    list.appendChild(card);
  });
}

let currentShopTab = "upgrades";
function showShopTab(tab) {
  currentShopTab = tab;
  const buttons = document.querySelectorAll(".tab-btn");
  buttons.forEach((b) => b.classList.remove("active"));
  const idx = ({ upgrades: 0, costumes: 1, ammo: 2, guns: 3 })[tab] ?? 0;
  if (buttons[idx]) buttons[idx].classList.add("active");
  refreshShop();
}

function refreshShop() {
  document.getElementById("shop-para").textContent = save.para;
  document.getElementById("shop-elmas").textContent = save.elmas;
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
      icon.textContent = u.icon;
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
            showToast(t("{ad} {yukseltme} yükseltildi!", { ad: charName, yukseltme: u.name }));
            audio.buy();
          }
        };
      }
      item.appendChild(btn);

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
      icon.textContent = w.icon;
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
      const item = document.createElement("div");
      item.className = "shop-item";
      const icon = document.createElement("div");
      icon.className = "item-icon";
      icon.style.backgroundImage = `url(${resim})`;
      icon.style.backgroundSize = "contain";
      icon.style.backgroundRepeat = "no-repeat";
      icon.style.backgroundPosition = "center";
      icon.style.height = "44px";
      item.appendChild(icon);
      const info = document.createElement("div");
      info.className = "item-info";
      info.innerHTML = `<div class="item-name">${ad}</div><div class="item-desc">${aciklama}</div>`;
      item.appendChild(info);
      const btn = document.createElement("button");
      const g = GUNS[key];
      if (key && !save.ownedGuns[key]) {
        btn.textContent = `💰 ${g.cost}`;
        btn.disabled = save.para < g.cost;
        btn.onclick = () => {
          if (save.para < g.cost) return;
          save.para -= g.cost;
          save.ownedGuns[key] = true;
          equipGun(key);
          refreshShop();
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
      content.appendChild(item);
    };
    satir("", t("Normal silah"), t("Karakterin kendi silahı ve mermisi."), charIconUrl(save.selectedChar));
    Object.keys(GUNS).forEach((key) => satir(key, GUNS[key].name, GUNS[key].desc, gunIconUrl(key)));
  } else {
    // Kostümler
    Object.keys(COSTUMES).forEach((charKey) => {
      COSTUMES[charKey].forEach((cos, idx) => {
        if (idx === 0) return; // ilk kostüm zaten ücretsiz
        const owned = save.unlockedCostumes[charKey].includes(idx);
        const item = document.createElement("div");
        item.className = "shop-item";

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
        info.innerHTML = `<div class="item-name">${CHARACTERS[charKey].name} - ${cos.name}</div>
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
              showToast(t("🎉 Yeni kostüm!"));
              audio.unlock();
            }
          };
        }
        item.appendChild(btn);

        content.appendChild(item);
      });
    });
  }
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
    fireDelay: Math.max(150, c.baseFireDelay - u.fireRate * 90),
    range: c.baseRange + u.range * 35,
  };
}

// ====== TOAST ======
let toastTimer;
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
  audio.toast();
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

function buildWalls() {
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
  const W = game.worldW, H = game.worldH;
  game.waters = [];
  const seed = 23 + game.level * 17;
  function rand(n) { return ((Math.sin((seed + n) * 77.456) + 1) / 2); }
  const count = 4;
  const { cx, cy } = layoutCenter();
  let placed = 0;
  for (let i = 0; i < 25 && placed < count; i++) {
    const w = 110 + rand(i) * 90;
    const h = 80 + rand(i + 31) * 80;
    const x = 80 + rand(i * 5) * (W - 160 - w);
    const y = 80 + rand(i * 11) * (H - 160 - h);
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
  }
  engelBicimleriniKur();
}

function collidesWaters(x, y, r) {
  return engelCarpisir(game.waters, x, y, r);
}

function buildHazards() {
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

function startGame() {
  showScreen("screen-game");
  setupCanvas();

  game.running = true;
  game.paused = false;
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
  game.level = 1;
  game.levelTimer = 0;
  game.ghostsCaught = 0;
  game.totalCaught = 0;
  game.runPara = 0;
  game.runElmas = 0;
  game.runZumrut = 0;
  game.lastFire = 0;

  game.player = null; // önceki turun konumu yeni haritayı etkilemesin
  buildWalls();
  buildWaters();
  buildHazards();

  // Oyuncu - güvenli bir alana koy
  const charKey = save.selectedChar;
  const stats = computeStats(charKey);
  game.player = {
    x: game.worldW / 2,
    y: game.worldH / 2,
    r: 22,
    hp: 3,
    maxHp: 3,
    invuln: 0,
    speed: stats.speed * 60, // px / saniye yerine ölçek
    damage: stats.damage,
    fireDelay: stats.fireDelay,
    range: stats.range,
    charKey: charKey,
    costumeIdx: save.selectedCostume[charKey],
    facing: 0,
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
  spawnBot();
  closeInventory();
  refreshInventoryButton();
  if (game.bot) setTimeout(() => { if (game.running && game.bot) showToast(t("🤖 Bot seninle savaşıyor! Ona dokunursan ona ateş edersin.")); }, 600);

  setupJoystick();
  setupKeyboard();

  // Boss bölüm seviyesine göre belli bir süre sonra gelir
  game.bossSpawnTimer = getBossTimerForLevel(game.level);
  game.bossDefeated = false;
  game.levelTransitioning = false;

  updateHUD();
  refreshWeaponBar();
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
  const dt = Math.min(0.05, (now - game.lastFrame) / 1000);
  game.lastFrame = now;
  if (!game.paused) {
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

const KASIRGA_R = 110;
const KASIRGA_DPS = 8;

function update(dt, now) {
  // Oyuncu hareketi
  let dirX = game.inputDir.x;
  let dirY = game.inputDir.y;
  const kb = readKeyboardInput();
  if (kb) { dirX = kb.x; dirY = kb.y; }
  if (game.menude) { dirX = 0; dirY = 0; } // çevrimiçi menü açıkken oyun sürer, oyuncu durur
  const mag = Math.hypot(dirX, dirY);
  const playerFrozen = (game.player.frozenUntil || 0) > now;
  const isSpectator = !!game.player.dead;
  let movedThisFrame = false;
  if (mag > 0.15 && (isSpectator || !playerFrozen)) {
    let mx = dirX, my = dirY;
    if (mag > 1) { mx /= mag; my /= mag; }
    game.player.facing = Math.atan2(my, mx);
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
      if (!collidesWalls(nx, game.player.y, game.player.r) && !(waterBlock && collidesWaters(nx, game.player.y, game.player.r))) { game.player.x = nx; movedThisFrame = true; }
      if (!collidesWalls(game.player.x, ny, game.player.r) && !(waterBlock && collidesWaters(game.player.x, ny, game.player.r))) { game.player.y = ny; movedThisFrame = true; }
    }
  }
  // Yürüme animasyonu fazı
  if (movedThisFrame) {
    game.player.walkTimer = (game.player.walkTimer || 0) + dt;
  } else {
    game.player.walkTimer = 0;
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

  // ========== HOST-ONLY blok (spawn, AI, transition, AOE güç efektleri) ==========
  // Client modunda bu blok atlanır — state host'tan snapshot olarak gelir
  if (online.mode !== "client") {

  // Bölüm zamanlayıcısı
  game.levelTimer += dt;

  // Boss zamanlayıcısı: 60 sn sonra boss gelir
  if (game.bossSpawnTimer > 0 && !game.bossDefeated) {
    game.bossSpawnTimer -= dt;
    if (game.bossSpawnTimer <= 0) {
      game.bossSpawnTimer = 0;
      spawnBoss();
    }
  }

  // Hayalet spawn — boss yenildikten sonra yeni hayalet gelmesin (2 katı: hem cap hem hız)
  game.spawnTimer -= dt;
  const spawnInterval = Math.max(0.25, 0.8 - game.level * 0.06);
  const maxGhosts = Math.min(40, 12 + game.level * 4);
  if (!game.bossDefeated && game.spawnTimer <= 0 && game.ghosts.length < maxGhosts) {
    spawnGhost();
    game.spawnTimer = spawnInterval;
  }

  // Bölüm tamamlandı mı? Boss öldü VE diğer tüm hayaletler bitti
  if (game.bossDefeated && game.ghosts.length === 0 && !game.levelTransitioning) {
    game.levelTransitioning = true;
    showToast(t("🌟 Bölüm temiz! Sıradaki bölüm geliyor..."));
    setTimeout(() => { if (game.running) nextLevel(); }, 1800);
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
  const playerInvisible = (game.player.invisibleUntil || 0) > now;
  const playerKasirga   = (game.player.kasirgaUntil   || 0) > now;
  // Boss minion durumu: kalan boss minion sayısı bir kere hesapla
  const bossMinionsAlive = game.ghosts.some(o => o.fromBoss);
  // Kovalanacaklar: ben (görünmez ya da hayalet değilsem) ve çevrimiçi oyunda canlı, görünür diğer oyuncular
  const hedefler = [];
  if (!game.player.dead && !playerInvisible) hedefler.push({ x: game.player.x, y: game.player.y, ben: true });
  if (online.mode === "host") {
    for (const rp of Object.values(online.remotePlayers)) {
      if (rp && !rp.dead && !rp.invisible && Number.isFinite(rp.x) && Number.isFinite(rp.y)) hedefler.push({ x: rp.x, y: rp.y, ben: false });
    }
  }

  for (const g of game.ghosts) {
    // Periyodik hayalet sesi (hayatta olduğu sürece)
    hayaletSesi(g, now);

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
      // Kasırga donmuş hayaleti de ezsin
      if (playerKasirga) {
        const ddx = g.x - game.player.x, ddy = g.y - game.player.y;
        if (ddx * ddx + ddy * ddy < KASIRGA_R * KASIRGA_R) g.hp -= KASIRGA_DPS * dt;
      }
      continue;
    }

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
    const seekVx = (dx / d) * g.speed;
    const seekVy = (dy / d) * g.speed;

    let vx = seekVx, vy = seekVy;
    // Aktif detour varsa onu kullan
    if (g.detourTime && g.detourTime > 0) {
      vx = g.detourVx; vy = g.detourVy;
      g.detourTime -= dt;
    }

    const nx = g.x + vx * dt;
    const ny = g.y + vy * dt;
    let movedX = false, movedY = false;
    if (!collidesWalls(nx, g.y, g.r)) { g.x = nx; movedX = true; }
    if (!collidesWalls(g.x, ny, g.r)) { g.y = ny; movedY = true; }

    if (!movedX && !movedY && collidesWalls(g.x, g.y, g.r)) {
      // Duvarın içinde kalmış: hareket edemez, mermi duvara çarpar → en yakın boş yere çıkar
      ({ x: g.x, y: g.y } = freeSpot(g.x, g.y, g.r));
      g.detourTime = 0;
    } else if (!movedX && !movedY) {
      // İki eksen de tıkalı → 90° döndür ve detour ata
      if (!g.detourTime || g.detourTime <= 0) {
        const side = Math.random() < 0.5 ? 1 : -1;
        // Oyuncu yönünün dik vektörü
        g.detourVx = -(dy / d) * g.speed * side;
        g.detourVy =  (dx / d) * g.speed * side;
        g.detourTime = 0.5 + Math.random() * 0.6;
      } else {
        // Detour da tıkalı, ters yöne çevir
        g.detourVx = -g.detourVx;
        g.detourVy = -g.detourVy;
        g.detourTime = 0.4;
      }
    } else if (movedX && movedY) {
      // İki eksen de açık → detour bitir
      if (g.detourTime > 0) g.detourTime = 0;
    }

    // Kasırga: oyuncuya yakın hayaletlere DPS
    if (playerKasirga) {
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

  // Aktif güç efektleri (timer'lar)
  if (power && power.type === "fanatik") {
    game.pulseTimer = (game.pulseTimer || 0) + dt;
    if (game.pulseTimer >= 0.5) {
      game.pulseTimer = 0;
      let any = false;
      for (const g of game.ghosts) {
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
    const cinvisible = (game.player.invisibleUntil || 0) > now;
    if (!game.player.dead && !cghostMode && !cinvisible && game.player.invuln <= 0) {
      for (const g of game.ghosts) {
        if (Math.hypot(g.x - game.player.x, g.y - game.player.y) < g.r + game.player.r) {
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
          if (kasirga && d < KASIRGA_R) dmg += KASIRGA_DPS * 0.5;
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
  if (firePower && firePower.type === "ponko") fireDelay = fireDelay / 3;
  if (GUNS[game.player.gun]) fireDelay *= GUNS[game.player.gun].delayMul;
  updateBot(dt, now);
  if (keys["b"] && game.bot) game.player.botTargetUntil = now + 300; // klavye: B'ye basılıyken Bot'a ateş
  let fireTarget = (!game.player.dead) ? nearestGhost(game.player.range) : null;
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
      if (p.hits && p.hits.includes(g)) continue; // delen mermi aynı hayalete iki kez vurmaz
      if (Math.hypot(p.x - g.x, p.y - g.y) < g.r + 6) {
        spawnHitParticles(p.x, p.y);
        if (p.pierce > 0) { p.pierce--; (p.hits || (p.hits = [])).push(g); }
        else game.projectiles.splice(i, 1);
        if (online.mode === "client") {
          // Client: host'a hit event gönder
          uzaktanVur(g, p.dmg);
          audio.hit();
        } else {
          g.hp -= p.dmg;
          g.uzakVurdu = false; // son vuruş benim: ölürse bana sayılır
          if (g.hp <= 0) {
            killGhost(g, j);
          } else {
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
      collectPickup(p);
      if (istemci && typeof p._idx === "number") {
        // Client: lokal sil + host'a sildirme event'i gönder; host silene kadar yeniden görünmesin
        online.alinanlar.add(p._idx);
        online.pendingEvents.push({ type: "pickup", pi: p._idx, by: online.uid });
      }
      game.pickups.splice(i, 1);
    }
  }

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

  // Kasırga görseli (8 sn boyunca dönen halka parçacıkları)
  if ((game.player.kasirgaUntil || 0) > now) {
    if (Math.random() < 0.6) {
      const a = Math.random() * Math.PI * 2;
      const r = 95 + Math.random() * 25;
      game.particles.push({
        x: game.player.x + Math.cos(a) * r,
        y: game.player.y + Math.sin(a) * r,
        vx: Math.cos(a + Math.PI / 2) * 140,
        vy: Math.sin(a + Math.PI / 2) * 140,
        life: 0.35, color: "#a78bfa",
      });
    }
  }

  // Kamera takibi
  game.camera.x = game.player.x - game.W / 2;
  game.camera.y = game.player.y - game.H / 2;
  game.camera.x = Math.max(0, Math.min(game.worldW - game.W, game.camera.x));
  game.camera.y = Math.max(0, Math.min(game.worldH - game.H, game.camera.y));

  updateHUD();
}

function nextLevel() {
  game.level++;
  pgsBolum(game.level);
  game.levelTimer = 0;
  game.ghostsCaught = 0;
  audio.levelUp();
  // Sahneyi yeniden kur
  game.ghosts = [];
  game.projectiles = [];
  game.enemyProjectiles = [];
  game.effects = [];
  buildWalls();
  buildWaters();
  buildHazards();
  ensurePlayerSafe();
  spawnBot();
  if (online.mode) yenidenDog();
  showToast(t("📚 Bölüm {n} — {tema}", { n: game.level, tema: getTheme().name }));
  // Boss bölüm seviyesine göre belli bir süre sonra
  game.bossSpawnTimer = getBossTimerForLevel(game.level);
  game.bossDefeated = false;
  game.levelTransitioning = false;
}

function ensurePlayerSafe() {
  if (!game.player) return;
  const r = game.player.r;
  const safe = (x, y) => !collidesWalls(x, y, r) && (game.player.waterImmune || !collidesWaters(x, y, r)) && !collidesSpikes(x, y, r) && !collidesLavas(x, y, r);
  if (safe(game.player.x, game.player.y)) return;
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
  for (let attempts = 0; attempts < 30; attempts++) {
    const tx = 120 + Math.random() * (game.worldW - 240);
    const ty = 120 + Math.random() * (game.worldH - 240);
    if (Math.hypot(tx - game.player.x, ty - game.player.y) < 380) continue;
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
  showToast(t("👑 BÖLÜM {n} BOSS!", { n: game.level }));
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
  game.ghosts.push({
    x, y, r: 14,
    speed: 90 + game.level * 5,
    hp: 1, maxHp: 1,
    size: 26,
    fromBoss: true,
    nextSound: performance.now() + Math.random() * 5000,
  });
}

function spawnGhost() {
  const side = Math.floor(Math.random() * 4);
  let x, y;
  const margin = 60;
  if (side === 0) { x = margin; y = margin + Math.random() * (game.worldH - margin * 2); }
  else if (side === 1) { x = game.worldW - margin; y = margin + Math.random() * (game.worldH - margin * 2); }
  else if (side === 2) { x = margin + Math.random() * (game.worldW - margin * 2); y = margin; }
  else { x = margin + Math.random() * (game.worldW - margin * 2); y = game.worldH - margin; }

  // Duvarın içinde doğmasın: en yakın boş noktaya al
  ({ x, y } = freeSpot(x, y, 24));

  const tier = 1 + Math.floor(game.level / 3);
  const speed = 50 + game.level * 6 + Math.random() * 20;
  const hp = tier;
  // Bölüm 5+: %18 ihtimalle ateş edebilen yavaş hayalet
  const isShooter = game.level >= 5 && Math.random() < 0.18;
  const ghost = {
    x, y, r: 22,
    speed: isShooter ? speed * 0.7 : speed,
    hp: isShooter ? Math.max(2, tier) : hp,
    maxHp: isShooter ? Math.max(2, tier) : hp,
    size: 40 + (tier - 1) * 4,
  };
  if (isShooter) {
    ghost.isShooter = true;
    ghost.canShoot = true;
    ghost.fireRate = 2400;
    ghost.nextShot = performance.now() + 1500 + Math.random() * 1500;
  }
  // İlk ses 0-5 sn arası rastgele zamanda, sonra her 10 sn'de bir
  ghost.nextSound = performance.now() + Math.random() * 5000;
  game.ghosts.push(ghost);
}

function killGhost(g, idx) {
  // Solan iz: ölen hayaletin silüeti 1 sn boyunca yavaş kaybolur
  game.effects.push({
    type: "ghostFade",
    x: g.x, y: g.y,
    size: g.size,
    hp: 0,
    maxHp: g.maxHp,
    isBoss: !!g.isBoss,
    life: 1, maxLife: 1,
  });
  game.ghosts.splice(idx, 1);
  spawnDeathParticles(g.x, g.y);
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

  // Patlama gücü: çevreye AOE hasar
  const power = getActivePower();
  if (power && power.type === "gul" && !g._explodedFrom) {
    for (const other of game.ghosts) {
      if (other === g) continue;
      if (Math.hypot(other.x - g.x, other.y - g.y) < 90) {
        other.hp -= Math.max(1, game.player.damage);
        other._explodedFrom = true; // zincir patlama olmasın
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
  // Bazen güç yıldızı (%4)
  if (!getActivePower() && Math.random() < 0.04) {
    game.pickups.push({ x: g.x, y: g.y - 10, kind: "guc" });
  }
}

function collectPickup(p) {
  if (p.kind === "para") {
    game.runPara += p.value;
    showFloat(`+${p.value} 💰`, p.x, p.y);
    audio.pickup();
  } else if (p.kind === "elmas") {
    game.runElmas += p.value;
    showFloat(`+${p.value} 💎`, p.x, p.y);
    audio.gem();
  } else if (p.kind === "zumrut") {
    game.runZumrut += p.value;
    showFloat(`+${p.value} 💚`, p.x, p.y);
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

function showFloat(text, x, y) {
  game.particles.push({ x, y, vx: 0, vy: -40, life: 0.8, text, color: "#ffd166" });
}

function spawnHitParticles(x, y) {
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

function fireProjectile(target) {
  const dx = target.x - game.player.x;
  const dy = target.y - game.player.y;
  const d = Math.hypot(dx, dy) || 1;
  const gun = GUNS[game.player.gun];
  const speed = gun ? gun.speed : 480;
  const baseAng = Math.atan2(dy, dx);
  const power = getActivePower();
  let dmg = game.player.damage;
  if (power && power.type === "veryi") dmg *= 3;
  if (gun) dmg *= gun.dmgMul;

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
          dmg: dmg,
          charKey: game.player.charKey,
          gun: game.player.gun || undefined,
          pierce: (gun && gun.pierce) || 0,
          homing,
          atBot: target === game.bot,
        });
      }
    }
  }
  game.player.shootRecoil = 1;
  game.player.aimRaise = 1;
  audio.fire();
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
const botEngel = (x, y, r) => collidesWalls(x, y, r) || collidesWaters(x, y, r);

function spawnBot() {
  game.bot = null;
  if (online.mode || !game.player) return;
  const yer = freeSpot(game.player.x + 60, game.player.y + 10, 18, botEngel);
  game.bot = {
    x: yer.x, y: yer.y, r: 18, hp: BOT_MAX_HP, maxHp: BOT_MAX_HP,
    walkTimer: 0, lastFire: 0, aimRaise: 0, shootRecoil: 0, hitFlash: 0, stuck: 0,
  };
}

function updateBot(dt, now) {
  const b = game.bot;
  if (!b || online.mode) return;
  if (b.hitFlash > 0) b.hitFlash -= dt;
  b.shootRecoil = Math.max(0, b.shootRecoil - dt * 6);
  // Oyuncuyu ~80 px geriden izle; takılır ya da çok geride kalırsa yanına ışınlan
  const dx = game.player.x - b.x, dy = game.player.y - b.y;
  const d = Math.hypot(dx, dy) || 1;
  let yurudu = false;
  if (d > 80) {
    const adim = game.player.speed * 0.95 * dt;
    const nx = b.x + (dx / d) * adim, ny = b.y + (dy / d) * adim;
    if (!botEngel(nx, b.y, b.r)) { b.x = nx; yurudu = true; }
    if (!botEngel(b.x, ny, b.r)) { b.y = ny; yurudu = true; }
    b.stuck = yurudu ? 0 : b.stuck + dt;
    if (d > 650 || b.stuck > 2) {
      const yer = freeSpot(game.player.x - 50, game.player.y + 30, b.r, botEngel);
      b.x = yer.x; b.y = yer.y; b.stuck = 0;
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

// Bot'un görünüşü (çizimdeki gibi): uzun saç, kocaman gözler, tırtıklı ağız, köşeli gövde ve eller
function drawBot(ctx, b) {
  const size = 62, s = size / 100;
  const walk = b.walkTimer > 0 ? Math.sin(b.walkTimer * 12) : 0;
  ctx.save();
  ctx.translate(b.x, b.y - Math.abs(walk) * 1.5 * s);
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath(); ctx.ellipse(0, 45 * s, 20 * s, 6 * s, 0, 0, Math.PI * 2); ctx.fill();
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
  // İsim, can çubuğu ve hedef işareti
  ctx.save();
  ctx.font = "bold 12px sans-serif";
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

function damagePlayer() {
  if (game.player.dead) return;
  game.player.hp--;
  game.player.invuln = 1.2;
  audio.damage();
  navigator.vibrate?.(120);
  if (game.player.hp <= 0) {
    if (online.mode) {
      becomeSpectator();
    } else {
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
}

function collidesWalls(x, y, r) {
  return engelCarpisir(game.walls, x, y, r);
}

// ====== ÇİZİM ======
function render() {
  const ctx = game.ctx;
  ctx.clearRect(0, 0, game.W, game.H);

  // Arka plan grid
  ctx.save();
  ctx.translate(-game.camera.x, -game.camera.y);

  // Zemin (bölüm temasından)
  const th = getTheme();
  ctx.fillStyle = th.floor;
  ctx.fillRect(0, 0, game.worldW, game.worldH);

  // Grid
  ctx.strokeStyle = th.grid;
  ctx.lineWidth = 1;
  const gridSize = 80;
  for (let x = 0; x < game.worldW; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, game.worldH); ctx.stroke();
  }
  for (let y = 0; y < game.worldH; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(game.worldW, y); ctx.stroke();
  }

  // Su alanları
  for (const w of game.waters) drawWater(ctx, w.x, w.y, w.w, w.h);

  // Tehlikeler
  for (const l of (game.lavas || []))  drawLava(ctx,  l.x, l.y, l.w, l.h);
  for (const s of (game.spikes || [])) drawSpike(ctx, s.x, s.y, s.w, s.h);

  // Duvarlar
  for (const w of game.walls) drawWall(ctx, w.x, w.y, w.w, w.h);

  // Toplanabilirler
  for (const p of game.pickups) drawPickup(ctx, p);

  // Mermiler
  for (const p of game.projectiles) drawProjectile(ctx, p);

  // Düşman mermileri (boss + shooter ghost)
  for (const p of (game.enemyProjectiles || [])) drawEnemyProjectile(ctx, p);

  // Ölen hayaletlerin solan izleri (canlı hayaletlerin altında)
  drawGhostFades(ctx);

  // Hayaletler (boss en üstte)
  for (const g of game.ghosts) if (!g.isBoss) drawGhost(ctx, g);
  for (const g of game.ghosts) if (g.isBoss) drawGhost(ctx, g);

  // Bomba/roket görselleri (hayaletlerin üstünde)
  drawEffects(ctx);

  // Diğer oyuncular (multiplayer)
  if (online.mode) {
    const rps = online.remotePlayers || {};
    const hostUid = online.cachedRoom && online.cachedRoom.hostUid;
    Object.keys(rps).forEach((uid) => {
      const rp = rps[uid];
      if (!rp || !Number.isFinite(rp.x) || !Number.isFinite(rp.y)) return;
      if (rp.dead) {
        hayaletOyuncuCiz(ctx, rp.charKey || "kinkin", rp.costumeIdx || 0, rp.x, rp.y, 0.45); // mavi hayalet
      } else {
        ctx.save();
        if (rp.invisible) ctx.globalAlpha = 0.4;
        drawCharacter(ctx, rp.charKey || "kinkin", rp.costumeIdx || 0, rp.x, rp.y, 70, rp.facing || 0, rp.yurume || 0,
          rp.aimRaise || 0, rp.recoil || 0);
        ctx.restore();
      }
      // İsim etiketi (host'un adında taç)
      const etiket = (uid === hostUid ? "👑 " : "") + (rp.name || "?");
      ctx.save();
      ctx.fillStyle = "#fde047";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 3;
      ctx.font = "bold 12px sans-serif";
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

  if (game.bot) drawBot(ctx, game.bot);

  // Oyuncu (yanıp sönme efekti yaralandığında, görünmez iken yarı saydam, ölü iken hayalet)
  const blink = !game.player.dead && game.player.invuln > 0 && Math.floor(game.player.invuln * 10) % 2 === 0;
  if (!blink) {
    const isInvisible = (game.player.invisibleUntil || 0) > performance.now();
    const wp = game.player.walkTimer || 0;
    // Spectator iken silah indirilmiş kalsın
    const ar = game.player.dead ? 0 : (game.player.aimRaise || 0);
    const rc = game.player.dead ? 0 : (game.player.shootRecoil || 0);
    if (game.player.dead) {
      hayaletOyuncuCiz(ctx, game.player.charKey, game.player.costumeIdx, game.player.x, game.player.y, 0.5);
    } else if (isInvisible) {
      ctx.save();
      ctx.globalAlpha = 0.4;
      drawCharacter(ctx, game.player.charKey, game.player.costumeIdx, game.player.x, game.player.y, 70, game.player.facing, wp, ar, rc, game.player.gun);
      ctx.restore();
    } else {
      drawCharacter(ctx, game.player.charKey, game.player.costumeIdx, game.player.x, game.player.y, 70, game.player.facing, wp, ar, rc, game.player.gun);
    }
  }

  // Parçacıklar
  for (const p of game.particles) {
    ctx.save();
    if (p.text) {
      ctx.fillStyle = p.color;
      ctx.font = "bold 14px sans-serif";
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

  ctx.restore();
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

  // Boss durumu
  const bossEl = document.getElementById("boss-status");
  if (bossEl) {
    if (game.bossDefeated) {
      const remain = game.ghosts.length;
      bossEl.textContent = remain > 0 ? t("🧹 Kalan: {n}", { n: remain }) : t("✓ Bölüm temiz!");
      bossEl.className = "boss-status boss-cleared";
    } else if (game.bossSpawnTimer > 0) {
      bossEl.textContent = t("⏳ Boss: {n}s", { n: Math.ceil(game.bossSpawnTimer) });
      bossEl.className = "boss-status";
    } else {
      bossEl.textContent = t("👑 BOSS!");
      bossEl.className = "boss-status boss-active";
    }
  }

  // Aktif güç barı
  const power = getActivePower();
  const pwrEl = document.getElementById("power-bar");
  if (pwrEl) {
    if (power) {
      const remaining = Math.max(0, (power.expires - performance.now()) / 1000);
      const pct = Math.min(1, remaining / ((power.duration || 15000) / 1000));
      pwrEl.classList.add("active");
      pwrEl.innerHTML = `
        <span class="power-icon">${power.icon}</span>
        <span class="power-name">${power.name}</span>
        <span class="power-time">${remaining.toFixed(1)}s</span>
        <div class="power-fill" style="width:${pct * 100}%"></div>
      `;
    } else {
      pwrEl.classList.remove("active");
      pwrEl.innerHTML = "";
    }
  }
}

// ====== DURAKLAT / ÇIK ======
// Çevrimiçi oyunda menü oyunu durdurmaz: host dursa herkesin oyunu donardı
function pauseGame() {
  if (!game.running) return;
  const cevrimici = !!online.mode;
  game.paused = !cevrimici;
  game.menude = cevrimici;
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
}

function resumeGame() {
  document.getElementById("screen-pause").classList.remove("active");
  game.paused = false;
  game.menude = false;
  game.lastFrame = performance.now();
}

function quitToMenu() {
  // Odadaysa (oyunda ya da tur sonu ekranında) odadan çık; kazançlar kaydedilir
  if (online.roomId) odadanCik();
  game.running = false;
  game.menude = false;
  document.getElementById("screen-pause").classList.remove("active");
  document.getElementById("screen-gameover").classList.remove("active");
  const wb = document.getElementById("weapon-bar");
  if (wb) wb.innerHTML = "";
  hostBeklemeGostergesi(0);
  goToMenu();
}

// ====== OYUN BİTTİ ======
function endGame(won) {
  oyunSonu(won, false);
}

// Tek kişilik oyunun sonu ya da çevrimiçi turun sonu (turSonu): kazançlar kaydedilir, sonuç ekranı açılır.
// reklamsiz: arkadaşın davetiyle odaya geçerken (arkadaslar.js davetiKabulEt) oyun sonu reklamı gösterilmez
function oyunSonu(won, cevrimici, reklamsiz = false) {
  game.running = false;
  game.menude = false;

  // Bonus para (bölüm başı)
  const completionBonus = (game.level - 1) * 50;
  const finalPara = game.runPara + completionBonus;

  // Yüksek bölüm rekoru
  if (game.level > save.highestLevel) save.highestLevel = game.level;

  save.para += finalPara;
  save.elmas += game.runElmas;
  save.zumrut += game.runZumrut;
  persistSave();

  // Şampiyon listesine ekle (yerel + buluta)
  const entry = {
    name: save.playerName || t("Avcı"),
    level: game.level,
    ghosts: game.totalCaught,
    para: finalPara,
    date: Date.now(),
  };
  const rank = addLeaderboardEntry(entry);
  submitOnlineScore(entry); // sessizce buluta yolla, sonucu beklemiyoruz
  pgsOyunBitti(scoreFor(entry), save.highestLevel, game.totalCaught); // Android: Play Games skor + başarımlar
  const rankEl = document.getElementById("gameover-rank");
  if (rank >= 0) {
    if (rank === 0) rankEl.textContent = t("🥇 1. SIRA! Şampiyonsun!");
    else if (rank === 1) rankEl.textContent = t("🥈 2. sıraya girdin!");
    else if (rank === 2) rankEl.textContent = t("🥉 3. sıraya girdin!");
    else rankEl.textContent = t("🏆 Şampiyonlar listesinde {n}. sıradasın!", { n: rank + 1 });
  } else {
    rankEl.textContent = "";
  }

  document.getElementById("gameover-title").textContent = cevrimici ? t("🏁 Tur bitti!") : won ? t("🌟 Harika!") : t("👻 Yakalandın!");
  document.getElementById("final-ghosts").textContent = game.totalCaught;
  document.getElementById("final-para").textContent = finalPara;
  document.getElementById("final-elmas").textContent = game.runElmas;
  document.getElementById("final-zumrut").textContent = game.runZumrut;
  // Kazançlar kaydedildi: odadan çıkarken (flushOnlineRewards) ikinci kez eklenmesin
  game.runPara = 0; game.runElmas = 0; game.runZumrut = 0;
  // Çevrimiçi turdan sonra "Tekrar Oyna" tek kişilik oyun açardı: yerine lobiye dönülür
  document.getElementById("btn-tekrar").style.display = cevrimici ? "none" : "";
  document.getElementById("btn-lobiye-don").style.display = cevrimici ? "" : "none";
  document.getElementById("screen-gameover").classList.add("active");
  if (won) audio.win(); else audio.lose();
  if (!reklamsiz) reklamOyunBitti();
}

// ====== BAŞLAT ======
function init() {
  // Ses ayarlarını save'den uygula
  audio.enabled = save.soundEnabled !== false;
  audio.volumes = Object.assign({ ghost: 1, fire: 1, sfx: 1 }, save.volumes || {});
  refreshSoundButtons();
  refreshSoundSliders();
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
    audio.volumes = Object.assign({ ghost: 1, fire: 1, sfx: 1 }, save.volumes || {});
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
    audio.volumes = Object.assign({ ghost: 1, fire: 1, sfx: 1 }, save.volumes || {});
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
}

function refreshSoundButtons() {
  const on = audio.enabled !== false;
  const label = on ? t("🔊 Ses Açık") : t("🔇 Ses Kapalı");
  document.querySelectorAll(".sound-toggle").forEach((el) => {
    el.textContent = label;
    el.classList.toggle("sound-off", !on);
  });
}

let _soundReturnScreen = "screen-menu";
function openSoundSettings() {
  // Hangi ekrandan açıldığını hatırla; kapanınca oraya dönelim
  const active = document.querySelector(".screen.active");
  _soundReturnScreen = (active && active.id) || "screen-menu";
  refreshSoundButtons();
  refreshSoundSliders();
  showScreen("screen-sound");
}

function closeSoundSettings() {
  showScreen(_soundReturnScreen || "screen-menu");
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
  // Kategoriye uygun anında önizleme sesi (throttled)
  audio.init();
  const now = performance.now();
  if (!audio._lastPreview || now - audio._lastPreview > 200) {
    audio._lastPreview = now;
    if (cat === "fire") audio.fire();
    else if (cat === "ghost") audio.bigGhost();
    else audio.pickup();
  }
}

function refreshSoundSliders() {
  const cats = ["ghost", "fire", "sfx"];
  for (const cat of cats) {
    const v = audio.volumes && audio.volumes[cat] != null ? audio.volumes[cat] : 1;
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
