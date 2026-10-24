/* ============================================================
   HAYALET AVCILARI — DÜNYA TURU MÜZİĞİ (3.14.0)
   Ülkeye varışta kısa teaser, ardından bölüm boyunca başa saran döngü (Web Audio: loop, loopStart, loopEnd; ek yeri
   kesim hattında hazırlanmıştır). game.js'teki audio motorunu kullanır: audio.ctx, audio.enabled, audio.volumes.muzik.
   Ses grafiği: her kaynak kendi kazancıyla (açılış, söndürme) tek ana kazanca girer; ana kazanç = ses kapalı ya da
   duraklatıldıysa 0, değilse Müzik kaydırıcısı. Çözülmüş tamponlar ülke koduyla, en çok iki ülke önbellekte.
   Tasarım: docs/superpowers/specs/2026-10-24-hayalet-ulke-muzikleri-design.md §3, §8
   ulke-muzikleri.js'ten sonra, game.js'ten önce yüklenir.
   ============================================================ */

const MUZIK_KESME = 0.05;        // yeni müzik başlarken eskisi bu kadar sürede kesilir
const MUZIK_DONGU_ONCE = 0.2;    // döngü teaser bitmeden bu kadar önce başlar…
const MUZIK_DONGU_ACILIS = 0.4;  // …ve bu sürede açılır
const MUZIK_YEDEK_ACILIS = 1;    // teaser yoksa (ya da 1,5 sn'de çözülemediyse) döngünün açılışı
const MUZIK_GIRIS_BEKLE = 1500;  // teaser'ın çözülmesi için en çok beklenen süre (ms)
const MUZIK_ONCEDEN_MS = 5000;   // bölüm başladıktan sonra sıradaki ülkenin teaser'ı çözülür
const MUZIK_ONBELLEK = 2;        // en çok iki ülkenin tamponları

const muzik = {
  ana: null,               // ana kazanç düğümü
  onbellek: new Map(),     // kod → { giris: { url, soz }, dongu: { url, soz } } (soz: Promise<AudioBuffer>)
  kaynaklar: new Set(),    // çalan (ya da başlaması planlanmış) { src, kazanc }
  no: 0,                   // her başlatma ve söndürme yeni numara alır: geç biten çözme eski müziği başlatmaz
  kod: null,
  calan: null,             // "giris" | "dongu" | null
  donguBas: null,          // döngünün başlayacağı ses bağlamı zamanı (teaser'dan geçiş)
  dongu: null,             // döngü kaynağı
  duraklatildi: false,
  onceden: 0,              // sıradaki ülkeyi hazırlama zamanlayıcısı
  uyarilan: new Set(),     // dosya hatası her kod için bir kez yazılır
};

const muzikHedefKazanc = () => (muzik.duraklatildi || !audio.enabled ? 0 : audio._v("muzik"));

function muzikAna() {
  if (!audio.ctx) return null;
  if (!muzik.ana || muzik.ana.context !== audio.ctx) {
    muzik.ana = audio.ctx.createGain();
    muzik.ana.gain.value = muzikHedefKazanc();
    muzik.ana.connect(audio.ctx.destination);
  }
  return muzik.ana;
}

// ---------- tamponlar ----------
async function muzikTamponu(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return audio.ctx.decodeAudioData(await r.arrayBuffer());
}
// Ülkenin "giris" ya da "dongu" tamponu (Promise). Önbellek kaydı kodla tutulur, adres değişmişse yeniden getirilir;
// kullanılan ülke sona alınır, ikiden fazlası en eskiden atılır. Hata olursa kayıt silinir (sonra yeniden denenebilir).
function muzikParcasi(kod, tur) {
  const url = ULKE_MUZIKLERI[kod][tur];
  let k = muzik.onbellek.get(kod);
  if (k) muzik.onbellek.delete(kod); else k = {};
  muzik.onbellek.set(kod, k);
  while (muzik.onbellek.size > MUZIK_ONBELLEK) muzik.onbellek.delete(muzik.onbellek.keys().next().value);
  if (!k[tur] || k[tur].url !== url) {
    const soz = muzikTamponu(url).catch((e) => { if (k[tur] && k[tur].soz === soz) delete k[tur]; throw e; });
    k[tur] = { url, soz };
  }
  return k[tur].soz;
}
function muzikUyar(kod, e) {
  if (muzik.uyarilan.has(kod)) return;
  muzik.uyarilan.add(kod);
  console.warn(`Dünya Turu müziği çalınamadı (${kod}):`, e && e.message ? e.message : e);
}

// Dosyaları getirir ve çözer (yalnizGiris: yalnız teaser). Kayıt yoksa ya da hata olursa false.
async function muzikHazirla(kod, { yalnizGiris } = {}) {
  if (!window.ULKE_MUZIKLERI || !ULKE_MUZIKLERI[kod] || !audio.ctx) return false;
  try {
    await Promise.all(yalnizGiris ? [muzikParcasi(kod, "giris")] : [muzikParcasi(kod, "giris"), muzikParcasi(kod, "dongu")]);
    return true;
  } catch (e) { muzikUyar(kod, e); return false; }
}

// ---------- çalma ----------
function muzikKaynagi(tampon, kazancBas) {
  const src = audio.ctx.createBufferSource(), kazanc = audio.ctx.createGain();
  src.buffer = tampon;
  kazanc.gain.value = kazancBas;
  src.connect(kazanc).connect(muzikAna());
  const k = { src, kazanc };
  muzik.kaynaklar.add(k);
  src.onended = () => { muzik.kaynaklar.delete(k); try { kazanc.disconnect(); } catch (_) {} };
  return k;
}
// Döngüyü t anında (ses bağlamı zamanı) başlatır, acilis saniyede açar
function donguyuBaslat(kod, tampon, t, acilis) {
  const e = ULKE_MUZIKLERI[kod], k = muzikKaynagi(tampon, 0);
  k.src.loop = true;
  k.src.loopStart = e.bas;
  k.src.loopEnd = e.son;
  k.kazanc.gain.setValueAtTime(0, t);
  k.kazanc.gain.linearRampToValueAtTime(1, t + acilis);
  k.src.start(t, e.bas);
  muzik.dongu = k;
  muzik.donguBas = t;
}

// Ülkenin müziğini başlatır (§3): teaser şimdi, döngü teaser bitmeden 0,2 sn önce 0,4 sn'de açılarak. Teaser yoksa
// (giris: false ya da 1,5 sn içinde çözülemediyse) döngü hazır olunca 1 sn'de açılır. Önce çalan müzik 0,05 sn'de
// kesilir. Ses kapalıysa ya da kayıt yoksa hiçbir şey çalmaz. 5 sn sonra rotadaki sıradaki ülkenin teaser'ı çözülür.
function turMuzigiBaslat(kod, { giris = true } = {}) {
  turMuzigiSondur(MUZIK_KESME);
  const e = window.ULKE_MUZIKLERI && ULKE_MUZIKLERI[kod];
  if (!e || !audio.enabled) return;
  audio.init();
  if (!muzikAna()) return;
  const no = muzik.no;
  muzik.kod = kod;
  const gecerli = () => no === muzik.no && audio.enabled;
  const dongu = muzikParcasi(kod, "dongu");
  dongu.catch(() => {}); // hata aşağıda yakalanır; işlenmemiş ret olmasın
  (async () => {
    let teaser = null;
    if (giris) {
      const bekle = new Promise((r) => setTimeout(() => r(null), MUZIK_GIRIS_BEKLE));
      teaser = await Promise.race([muzikParcasi(kod, "giris"), bekle]).catch(() => null);
      if (!gecerli()) return;
    }
    if (teaser) {
      const t0 = audio.ctx.currentTime;
      muzikKaynagi(teaser, 1).src.start(t0);
      muzik.calan = "giris";
      const tampon = await dongu;
      if (!gecerli()) return;
      const t = Math.max(t0 + e.girisSure - MUZIK_DONGU_ONCE, audio.ctx.currentTime);
      donguyuBaslat(kod, tampon, t, t > audio.ctx.currentTime ? MUZIK_DONGU_ACILIS : MUZIK_YEDEK_ACILIS);
    } else {
      const tampon = await dongu;
      if (!gecerli()) return;
      donguyuBaslat(kod, tampon, audio.ctx.currentTime, MUZIK_YEDEK_ACILIS);
      muzik.calan = "dongu";
    }
  })().catch((err) => { if (no === muzik.no) { muzikUyar(kod, err); turMuzigiSondur(0); } });
  const u = ulkeKodla(kod);
  if (u && u.sira < ULKE_SAYISI) {
    muzik.onceden = setTimeout(() => { if (no === muzik.no) muzikHazirla(ulkeSirada(u.sira + 1).kod, { yalnizGiris: true }); }, MUZIK_ONCEDEN_MS);
  }
}

// Müziği sure saniyede söndürür ve kaynakları durdurur; bekleyen başlatma iptal olur. Sönen kaynak durana kadar
// muzikDurumu().kaynak'ta sayılır (iki müziğin üst üste çalmadığı böyle görülür).
function turMuzigiSondur(sure = 0.8) {
  muzik.no++;
  clearTimeout(muzik.onceden);
  muzik.kod = null; muzik.calan = null; muzik.dongu = null; muzik.donguBas = null;
  if (!audio.ctx) return;
  const t = audio.ctx.currentTime, son = t + Math.max(0.01, sure);
  for (const k of muzik.kaynaklar) {
    if (k.sonuyor) continue;
    k.sonuyor = true;
    try {
      const g = k.kazanc.gain;
      g.cancelScheduledValues(t);
      g.setValueAtTime(g.value, t);
      g.linearRampToValueAtTime(0, son);
      k.src.stop(son + 0.02);
    } catch (_) { muzik.kaynaklar.delete(k); }
  }
}

// Ana kazancı hedefe sure saniyede götürür (kaydırıcı, ses düğmesi, duraklatma)
function muzikSesiniUygula(sure = 0.05) {
  const ana = muzik.ana;
  if (!ana || !audio.ctx) return;
  const t = audio.ctx.currentTime, g = ana.gain;
  g.cancelScheduledValues(t);
  g.setValueAtTime(g.value, t);
  g.linearRampToValueAtTime(muzikHedefKazanc(), t + sure);
}
// Tek oyunculu duraklatma: 0,2 sn'de kısılır, devamda 0,3 sn'de geri gelir; döngü sessizce sürer
function muzikDuraklat(evet) {
  muzik.duraklatildi = !!evet;
  muzikSesiniUygula(evet ? 0.2 : 0.3);
}

// Sınamalar için durum: calan teaser'dan döngüye ses bağlamı zamanıyla geçer
function muzikDurumu() {
  const ctx = audio.ctx;
  let calan = muzik.calan;
  if (calan === "giris" && muzik.donguBas != null && ctx && ctx.currentTime >= muzik.donguBas) calan = "dongu";
  const d = calan === "dongu" && muzik.dongu ? muzik.dongu.src : null;
  return {
    calan, kod: calan ? muzik.kod : null,
    loopStart: d ? d.loopStart : null, loopEnd: d ? d.loopEnd : null,
    kazanc: muzik.ana ? Math.round(muzik.ana.gain.value * 1000) / 1000 : 0,
    kaynak: muzik.kaynaklar.size,
  };
}

// Arka planda bütün ses susar (sürekli müzikte gerekli), dönünce sürer
document.addEventListener("visibilitychange", () => {
  if (!audio.ctx) return;
  try { (document.hidden ? audio.ctx.suspend() : audio.ctx.resume()).catch(() => {}); } catch (_) {}
});
