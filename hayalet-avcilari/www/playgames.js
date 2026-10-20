/* ============================================================
   HAYALET AVCILARI — GOOGLE PLAY OYUN HİZMETLERİ (yalnız Android uygulaması)
   Yerel PlayGames eklentisi (android/.../PlayGamesPlugin.java) window.Capacitor.Plugins.PlayGames olarak gelir;
   web/PWA sürümünde yoktur ve bu dosyadaki her şey sessizce devre dışı kalır.
   - Giriş açılışta otomatik denenir (MainActivity › PlayGamesSdk.initialize); oturum yoksa skor/başarım gitmez.
   - Kimlikler: Play Console › Play Oyun Hizmetleri › Kaynakları al (oyun projesi 247289107945, "Ghost Hunters").
   ============================================================ */

const PLAY_GAMES = {
  skorTablosu: "CgkI6avRnJkHEAIQAg",              // Şampiyonlar: scoreFor(), üst sınır 9 999 999
  bolumBasarimlari: [                              // [bölüm, başarım]: Çırak, Usta, Hayalet Uzmanı, Efsane Avcı
    [5, "CgkI6avRnJkHEAIQBQ"],
    [10, "CgkI6avRnJkHEAIQBg"],
    [25, "CgkI6avRnJkHEAIQAw"],
    [50, "CgkI6avRnJkHEAIQBw"],
  ],
  hayaletFirtinasi: ["CgkI6avRnJkHEAIQBA", 500],   // tek oyunda 500 hayalet
};
const PGS_ACIK_KEY = "hayaletAvcilariPlayGamesAcik_v1"; // açıldığı Play Games'çe doğrulanan başarımlar

function playGamesPlugin() {
  return (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.PlayGames) || null;
}

const pgsAcik = (() => {
  try { return new Set(JSON.parse(localStorage.getItem(PGS_ACIK_KEY) || "[]")); } catch (_) { return new Set(); }
})();
const pgsIstenen = new Set(); // bu oturumda gönderilmiş (yanıt bekleyen ya da reddedilen) başarımlar

function pgsBasarim(id) {
  const p = playGamesPlugin();
  if (!p || pgsAcik.has(id) || pgsIstenen.has(id)) return;
  pgsIstenen.add(id);
  p.unlock({ id }).then(() => {
    pgsAcik.add(id);
    try { localStorage.setItem(PGS_ACIK_KEY, JSON.stringify([...pgsAcik])); } catch (_) {}
  }, () => {}); // oturum yok: sonraki oyunda yeniden denenir
}

function pgsBolum(level) {
  for (const [n, id] of PLAY_GAMES.bolumBasarimlari) if (level >= n) pgsBasarim(id);
}

function pgsHayalet(toplam) {
  const [id, n] = PLAY_GAMES.hayaletFirtinasi;
  if (toplam >= n) pgsBasarim(id);
}

// Oyun sonu: skor + o güne kadarki bölüm rekoru + bu oyunun hayaletleri. Oturum yoksa sessizce geçer.
function pgsOyunBitti(skor, enYuksekBolum, toplamHayalet) {
  const p = playGamesPlugin();
  if (!p) return;
  pgsIstenen.clear();
  if (skor > 0 && skor < 10000000) p.submitScore({ id: PLAY_GAMES.skorTablosu, score: skor }).catch(() => {});
  pgsBolum(enYuksekBolum);
  pgsHayalet(toplamHayalet);
}

async function pgsEkran(ac) {
  const p = playGamesPlugin();
  if (!p) return;
  try { await ac(p); } catch (_) { showToast(t("⚠ Google Play Games'e bağlanılamadı")); }
}
function pgsSkorTablosu() { pgsEkran((p) => p.showLeaderboard({ id: PLAY_GAMES.skorTablosu })); }
function pgsBasarimlar() { pgsEkran((p) => p.showAchievements()); }

// Düğmeler yalnız Android uygulamasında görünür
if (playGamesPlugin()) {
  document.querySelectorAll(".pgs-yalniz").forEach((el) => { el.style.display = ""; });
}
