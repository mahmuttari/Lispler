// Hayalet Avcıları — Google Ads App kampanyası için oynanabilir reklam.
// Saf HTML5 Canvas 2D. Dış kaynak yok; yalnız oyunun kendi WebP görselleri.
(function () {
  'use strict';

  var DIL = (navigator.language || '').toLowerCase().indexOf('tr') === 0 ? 'tr' : 'en';
  var METIN = {
    tr: {
      ipucu: 'Parmağını sürükle, hayaletleri avla!',
      indir: 'İNDİR',
      baslik: 'Hayalet Avcıları',
      kazan: 'Harika! Daha fazla hayalet seni bekliyor.',
      kayip: 'Az kaldı! Tekrar dene.',
      oyna: 'ÜCRETSİZ OYNA',
      tekrar: 'Tekrar',
      kasirga: 'KASIRGA!',
      boss: '👑 BOSS!'
    },
    en: {
      ipucu: 'Drag to move, hunt the ghosts!',
      indir: 'INSTALL',
      baslik: 'Ghost Hunters',
      kazan: 'Awesome! More ghosts are waiting.',
      kayip: 'So close! Try again.',
      oyna: 'PLAY FREE',
      tekrar: 'Retry',
      kasirga: 'TORNADO!',
      boss: '👑 BOSS!'
    }
  };
  var T = METIN[DIL];
  document.documentElement.lang = DIL;

  // Paketlenen görsel anahtarları.
  var ANAHTARLAR = ['kinkin-dur', 'kinkin-kos', 'tema2-zemin'];
  var i;
  for (i = 1; i <= 6; i++) ANAHTARLAR.push('an-hayalet-suzul-' + i);
  for (i = 1; i <= 6; i++) ANAHTARLAR.push('an-hayalet-puf-' + i);
  for (i = 1; i <= 6; i++) ANAHTARLAR.push('an-atici-saldiri-' + i);
  for (i = 1; i <= 3; i++) ANAHTARLAR.push('an-boss-bekle-' + i);
  for (i = 1; i <= 6; i++) ANAHTARLAR.push('an-para-' + i);
  for (i = 1; i <= 3; i++) ANAHTARLAR.push('an-vurus-' + i);
  for (i = 1; i <= 3; i++) ANAHTARLAR.push('an-kasirga-' + i);
  ANAHTARLAR.push('simge');

  var GORSEL = {};
  window.__gorseller = GORSEL;
  for (i = 0; i < ANAHTARLAR.length; i++) {
    (function (anahtar) {
      var im = new Image();
      im.src = 'gorsel/' + (anahtar === 'simge' ? 'simge.png' : anahtar + '.webp');
      im.onload = function () { im.__hazir = true; };
      im.onerror = function () { im.__hata = true; };
      GORSEL[anahtar] = im;
    })(ANAHTARLAR[i]);
  }

  var tuval = document.getElementById('oyun-tuvali');
  var ctx = tuval.getContext('2d');
  var G = { w: 320, h: 480, dpr: 1 };
  var zeminDesen = null;
  var HUD_ALT = 56;

  var canlarEl = document.getElementById('canlar');
  var paraEl = document.getElementById('para');
  var ipucuEl = document.getElementById('ipucu');
  var ipucuYaziEl = document.getElementById('ipucu-yazi');
  var buyukYaziEl = document.getElementById('buyuk-yazi');
  var bitisEl = document.getElementById('bitis');
  var bitisBaslikEl = document.getElementById('bitis-baslik');
  var bitisAltEl = document.getElementById('bitis-alt');
  var bitisParaEl = document.getElementById('bitis-para');
  var ctaEl = document.getElementById('cta');
  var tekrarEl = document.getElementById('tekrar');
  var indirEl = document.getElementById('indir');

  ipucuYaziEl.textContent = T.ipucu;
  indirEl.textContent = T.indir;
  bitisBaslikEl.textContent = T.baslik;
  ctaEl.textContent = T.oyna;
  tekrarEl.textContent = T.tekrar;

  var ZAMAN = { carpani: 1 };

  var O = {
    evre: 'giris',
    can: 3,
    para: 0,
    olen: 0,
    bossCan: 0,
    bitis: null,
    saat: 0,
    basladi: false,
    girisBaslangic: 0,
    sonSallama: 0,
    tekrarKullanildi: false,
    yaziKalan: 0,
    dogumSayac: 0.6,
    oyuncu: {
      x: 160, y: 300, yuz: 1, yurume: 0,
      atesKalan: 0, geriTepme: 0, olumsuz: 0, atesSayac: 0, namlu: 0
    },
    joystick: { aktif: false, id: null, x0: 0, y0: 0, dx: 0, dy: 0 },
    hayaletler: [],
    mermiler: [],
    paralar: [],
    puflar: [],
    kasirga: { aktif: 0, esya: null, aci: 0 },
    boss: null,
    bossGeldi: false
  };

  // ---------- Yardımcılar ----------
  function sinirla(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function mesafe(x1, y1, x2, y2) { var dx = x2 - x1, dy = y2 - y1; return Math.sqrt(dx * dx + dy * dy); }

  // Bir doğru parçasının noktaya en kısa uzaklığı (hızlı mermilerde ıska önler).
  function parcaMesafe(x1, y1, x2, y2, px, py) {
    var dx = x2 - x1, dy = y2 - y1;
    var uzun = dx * dx + dy * dy;
    var t = uzun > 0 ? ((px - x1) * dx + (py - y1) * dy) / uzun : 0;
    t = sinirla(t, 0, 1);
    return mesafe(x1 + dx * t, y1 + dy * t, px, py);
  }

  function resimHazir(anahtar) {
    var im = GORSEL[anahtar];
    return im && im.complete && im.naturalWidth > 0;
  }

  function yuvarlakDikdortgen(x, y, w, h, r) {
    var rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }

  function oyuncuBoy() {
    return sinirla(Math.min(G.w * 0.34, G.h * 0.18), 58, 360);
  }
  // Kinkin'in çizilecek karesi: koşarken tabanca çekilmiş koşu, dururken bekleme.
  function spriteBilgi() {
    var kos = O.oyuncu.yurume > 0;
    var anahtar = kos ? 'kinkin-kos' : 'kinkin-dur';
    var im = GORSEL[anahtar];
    var oran = (im && im.naturalWidth > 0 && im.naturalHeight > 0) ? im.naturalWidth / im.naturalHeight : 0.5;
    return {
      kos: kos,
      anahtar: anahtar,
      oran: oran,
      ayakX: kos ? 0.47 : 0.42,
      tipX: kos ? 0.95 : 0.99,
      tipY: kos ? 0.34 : 0.305
    };
  }
  function oyuncuYariGenislik() {
    return oyuncuBoy() * spriteBilgi().oran * 0.5;
  }
  function hayaletBoy() {
    return sinirla(Math.min(G.w * 0.20, G.h * 0.115), 40, 230);
  }
  function bossBoy() { return oyuncuBoy() * 2; }

  // ---------- Boyutlandırma ----------
  function boyutlandir() {
    G.w = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 320);
    G.h = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 480);
    G.dpr = Math.min(2, window.devicePixelRatio || 1);
    tuval.width = Math.round(G.w * G.dpr);
    tuval.height = Math.round(G.h * G.dpr);
    tuval.style.width = G.w + 'px';
    tuval.style.height = G.h + 'px';
    var ustEl = document.getElementById('ust');
    if (ustEl) {
      var ud = ustEl.getBoundingClientRect();
      if (ud && isFinite(ud.bottom) && ud.bottom > 0) HUD_ALT = ud.bottom;
    }
    if (!O.basladi) {
      O.oyuncu.x = G.w * 0.5;
      O.oyuncu.y = G.h * 0.56;
    }
    O.oyuncu.x = sinirla(O.oyuncu.x, oyuncuYariGenislik(), G.w - oyuncuYariGenislik());
    O.oyuncu.y = sinirla(O.oyuncu.y, HUD_ALT + oyuncuBoy() + 6, G.h - 8);
    zeminDesen = null;
  }
  window.addEventListener('resize', boyutlandir);
  window.addEventListener('orientationchange', function () { setTimeout(boyutlandir, 50); });

  // ---------- Arayüz ----------
  function canlariYaz() {
    var s = '';
    var k;
    for (k = 0; k < 3; k++) s += k < O.can ? '❤️' : '🖤';
    canlarEl.textContent = s;
  }
  function parayiYaz() { paraEl.textContent = '💰 ' + O.para; }

  function yaziGoster(yazi, sure) {
    buyukYaziEl.textContent = yazi;
    buyukYaziEl.classList.add('gorunur');
    O.yaziKalan = sure;
  }
  function yaziGizle() {
    buyukYaziEl.classList.remove('gorunur');
    O.yaziKalan = 0;
  }

  // ---------- Çıkış (yalnız CTA dokunuşunda) ----------
  function cikisYap() {
    if (window.ExitApi && typeof window.ExitApi.exit === 'function') {
      window.ExitApi.exit();
    } else {
      window.open('https://play.google.com/store/apps/details?id=com.poyrazworkshop.hayaletavcilari', '_blank');
    }
  }
  indirEl.addEventListener('click', function (e) { e.preventDefault(); cikisYap(); });
  ctaEl.addEventListener('click', function (e) { e.preventDefault(); cikisYap(); });

  // ---------- Oyun akışı ----------
  function oyunuBaslat() {
    if (O.evre !== 'giris') return;
    O.evre = 'oyun';
    O.basladi = true;
    O.girisBaslangic = O.saat;
    O.dogumSayac = 0.45;
    ipucuEl.classList.add('gizli');
  }

  function bitir(sonuc) {
    if (O.evre === 'bitis') return;
    O.evre = 'bitis';
    O.bitis = sonuc;
    O.bossCan = O.boss ? O.boss.hp : 0;
    yaziGizle();
    ciz();
    bitisBaslikEl.textContent = T.baslik;
    bitisAltEl.textContent = sonuc === 'kazan' ? T.kazan : T.kayip;
    bitisParaEl.textContent = '💰 ' + O.para;
    tekrarEl.hidden = !(sonuc === 'kayip' && !O.tekrarKullanildi);
    bitisEl.hidden = false;
    durdu = true;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function tekrarBaslat() {
    if (O.tekrarKullanildi || O.evre !== 'bitis') return;
    O.tekrarKullanildi = true;
    O.can = 3;
    O.para = 0;
    O.olen = 0;
    O.bossCan = 0;
    O.bitis = null;
    O.hayaletler = [];
    O.mermiler = [];
    O.paralar = [];
    O.puflar = [];
    O.kasirga = { aktif: 0, esya: null, aci: 0 };
    O.boss = null;
    O.bossGeldi = false;
    O.yaziKalan = 0;
    O.dogumSayac = 0.5;
    O.oyuncu.x = G.w * 0.5;
    O.oyuncu.y = G.h * 0.56;
    O.oyuncu.olumsuz = 0;
    O.oyuncu.atesKalan = 0;
    O.oyuncu.atesSayac = 0;
    O.oyuncu.yuz = 1;
    O.evre = 'oyun';
    O.basladi = true;
    bitisEl.hidden = true;
    ipucuEl.classList.add('gizli');
    canlariYaz();
    parayiYaz();
    durdu = false;
    sonZaman = 0;
    rafId = requestAnimationFrame(dongu);
  }
  tekrarEl.addEventListener('click', function (e) { e.preventDefault(); tekrarBaslat(); });

  // ---------- Girdi ----------
  function joystickBirak() {
    O.joystick.aktif = false;
    O.joystick.id = null;
    O.joystick.dx = 0;
    O.joystick.dy = 0;
  }

  tuval.addEventListener('pointerdown', function (e) {
    if (O.evre === 'bitis') return;
    oyunuBaslat();
    O.joystick.aktif = true;
    O.joystick.id = e.pointerId;
    O.joystick.x0 = e.clientX;
    O.joystick.y0 = e.clientY;
    O.joystick.dx = 0;
    O.joystick.dy = 0;
    try { tuval.setPointerCapture(e.pointerId); } catch (hata) { /* yoksay */ }
    e.preventDefault();
  });

  tuval.addEventListener('pointermove', function (e) {
    if (!O.joystick.aktif || e.pointerId !== O.joystick.id) return;
    var dx = e.clientX - O.joystick.x0;
    var dy = e.clientY - O.joystick.y0;
    var d = Math.sqrt(dx * dx + dy * dy);
    if (d > 60) { dx = dx / d * 60; dy = dy / d * 60; }
    O.joystick.dx = dx;
    O.joystick.dy = dy;
    e.preventDefault();
  });

  function birakHandler(e) {
    if (O.joystick.aktif && e.pointerId === O.joystick.id) joystickBirak();
  }
  tuval.addEventListener('pointerup', birakHandler);
  tuval.addEventListener('pointercancel', birakHandler);
  window.addEventListener('pointerup', birakHandler);

  // ---------- Güncelleme ----------
  function hedefBul(menzilli) {
    var enIyi = null;
    var enIyiD = Infinity;
    var menzil = G.w * 0.45;
    var j;
    for (j = 0; j < O.hayaletler.length; j++) {
      var h = O.hayaletler[j];
      if (h.oluyor) continue;
      var d = mesafe(O.oyuncu.x, O.oyuncu.y, h.x, h.y);
      if (menzilli && d > menzil) continue;
      if (d < enIyiD) { enIyiD = d; enIyi = h; }
    }
    if (O.boss && O.boss.hp > 0 && !O.boss.oluyor) {
      var bd = mesafe(O.oyuncu.x, O.oyuncu.y, O.boss.x, O.boss.y);
      var bossMenzil = G.w * 0.7 + bossBoy() * 0.3;
      if ((!menzilli || bd <= bossMenzil) && bd < enIyiD) {
        enIyiD = bd;
        enIyi = O.boss;
      }
    }
    return enIyi;
  }

  function oyuncuGuncelle(dt) {
    var p = O.oyuncu;
    var hareket = 0;
    if (O.joystick.aktif && O.evre !== 'giris') {
      var jx = O.joystick.dx / 60;
      var jy = O.joystick.dy / 60;
      var jd = Math.sqrt(jx * jx + jy * jy);
      if (jd > 1) { jx /= jd; jy /= jd; jd = 1; }
      if (jd > 0.12) {
        hareket = 1;
        var hiz = Math.min(G.w, G.h) * 0.55;
        p.x += jx * hiz * dt;
        p.y += jy * hiz * dt;
      }
    }
    var yari = oyuncuYariGenislik();
    p.x = sinirla(p.x, yari, G.w - yari);
    p.y = sinirla(p.y, HUD_ALT + oyuncuBoy() + 6, G.h - 8);

    if (hareket) {
      p.yurume += dt * 8;
      if (Math.abs(O.joystick.dx) > 6) p.yuz = O.joystick.dx > 0 ? 1 : -1;
    } else {
      p.yurume = 0;
    }

    var hedef = hedefBul(false);
    if (hedef) {
      var fark = hedef.x - p.x;
      if (Math.abs(fark) > 3) p.yuz = fark > 0 ? 1 : -1;
    }

    if (p.olumsuz > 0) p.olumsuz = Math.max(0, p.olumsuz - dt);
    if (p.atesKalan > 0) p.atesKalan = Math.max(0, p.atesKalan - dt);
    if (p.namlu > 0) p.namlu = Math.max(0, p.namlu - dt);
    if (p.geriTepme > 0) p.geriTepme = Math.max(0, p.geriTepme - dt);

    if (O.evre === 'oyun' || O.evre === 'boss') {
      p.atesSayac -= dt;
      var nisan = hedefBul(true);
      if (nisan && p.atesSayac <= 0) {
        atesEt(nisan);
        p.atesSayac = 0.32;
      }
      if (p.atesSayac < 0) p.atesSayac = 0;
    }
  }

  // Silahın ucu: sprite'ın ayak çapasına göre verilen oran; sola bakışta x aynalanır.
  function namluKonumu() {
    var p = O.oyuncu;
    var boy = oyuncuBoy();
    var s = spriteBilgi();
    var en = boy * s.oran;
    return {
      x: p.x + p.yuz * (s.tipX - s.ayakX) * en,
      y: p.y - (1 - s.tipY) * boy
    };
  }

  function atesEt(hedef) {
    var p = O.oyuncu;
    var n = namluKonumu();
    var aci = Math.atan2(hedef.y - n.y, hedef.x - n.x);
    var hiz = Math.max(G.w, G.h) * 1.55;
    O.mermiler.push({
      x: n.x + Math.cos(aci) * 14,
      y: n.y + Math.sin(aci) * 14,
      ex: n.x,
      ey: n.y,
      vx: Math.cos(aci) * hiz,
      vy: Math.sin(aci) * hiz,
      yas: 0,
      aci: aci
    });
    p.atesKalan = 0.18;
    p.geriTepme = 0.1;
    p.namlu = 0.22;
    if (Math.abs(hedef.x - p.x) > 3) p.yuz = hedef.x > p.x ? 1 : -1;
  }

  function hasarAl() {
    if (O.oyuncu.olumsuz > 0 || O.evre === 'bitis') return;
    O.can -= 1;
    O.oyuncu.olumsuz = 1.6;
    canlariYaz();
    if (O.can <= 0) {
      O.can = 0;
      canlariYaz();
      bitir('kayip');
    }
  }

  function pufEkle(x, y, boy, olcek) {
    O.puflar.push({ x: x, y: y, boy: boy, olcek: olcek || 1, t: 0 });
  }

  function paraEkle(x, y, hizli) {
    var aci = Math.random() * Math.PI * 2;
    var hiz = hizli ? 60 + Math.random() * 90 : 20 + Math.random() * 50;
    O.paralar.push({
      x: x, y: y,
      vx: Math.cos(aci) * hiz,
      vy: Math.sin(aci) * hiz - (hizli ? 80 : 30),
      t: 0, yas: 0
    });
  }

  function hayaletOldur(h) {
    if (h.oluyor) return;
    h.oluyor = true;
    pufEkle(h.x, h.y, h.boy * 1.15, h.boy / hayaletBoy());
    O.olen += 1;
    paraEkle(h.x, h.y, false);
    if (O.olen === 8 && !O.kasirga.esya && O.kasirga.aktif <= 0) {
      O.kasirga.esya = { x: G.w * 0.5, y: G.h * 0.46, t: 0, yukari: 0 };
    }
    var k = O.hayaletler.indexOf(h);
    if (k >= 0) O.hayaletler.splice(k, 1);
    if (!O.bossGeldi && O.olen >= 14) bossBaslat();
  }

  function hayaletDogur() {
    var kenar = Math.floor(Math.random() * 4);
    var pay = 24;
    var x, y;
    if (kenar === 0) { x = Math.random() * G.w; y = -pay; }
    else if (kenar === 1) { x = G.w + pay; y = Math.random() * G.h; }
    else if (kenar === 2) { x = Math.random() * G.w; y = G.h + pay; }
    else { x = -pay; y = Math.random() * G.h; }
    var boy = hayaletBoy() * (0.9 + Math.random() * 0.2);
    O.hayaletler.push({
      x: x, y: y, boy: boy, hp: 2,
      t: Math.random() * 3,
      flash: 0,
      oluyor: false,
      kapildi: -1,
      aci: 0,
      donus: (Math.random() - 0.5) * 0.7
    });
  }

  function bossBaslat() {
    if (O.bossGeldi) return;
    O.bossGeldi = true;
    O.evre = 'boss';
    O.boss = {
      x: G.w * 0.5,
      y: -bossBoy() * 0.7,
      hedefY: G.h * 0.24,
      hp: 12,
      maxHp: 12,
      t: 0,
      giris: true,
      oluyor: false,
      olumSure: 0,
      dokunmaBekle: 0
    };
    O.bossCan = O.boss.hp;
    yaziGoster(T.boss, 2.2);
  }

  function bossVur() {
    if (!O.boss || O.boss.oluyor) return;
    O.boss.hp -= 1;
    O.bossCan = O.boss.hp;
    if (O.boss.hp <= 0) {
      O.boss.hp = 0;
      O.bossCan = 0;
      O.boss.oluyor = true;
      O.boss.olumSure = 1.15;
      pufEkle(O.boss.x, O.boss.y, bossBoy() * 1.5, 2.4);
      var kk;
      for (kk = 0; kk < 12; kk++) {
        paraEkle(O.boss.x + (Math.random() - 0.5) * bossBoy() * 0.8, O.boss.y + (Math.random() - 0.5) * bossBoy() * 0.5, true);
      }
    }
  }

  function kasirgaEtkinlestir() {
    O.kasirga.esya = null;
    O.kasirga.aktif = 4;
    O.kasirga.aci = 0;
    yaziGoster(T.kasirga, 1.4);
  }

  function guncelle(dt) {
    if (O.evre === 'bitis') return;
    if (O.yaziKalan > 0) {
      O.yaziKalan -= dt;
      if (O.yaziKalan <= 0) yaziGizle();
    }
    O.saat += dt;
    if (O.saat >= 45) {
      bitir(O.boss && O.boss.oluyor ? 'kazan' : 'kayip');
      return;
    }

    if (O.evre === 'giris') {
      oyuncuGuncelle(dt);
      if (O.saat - O.sonSallama > 4 && O.saat - O.girisBaslangic > 0.5) {
        O.sonSallama = O.saat;
        ipucuEl.classList.remove('salla');
        // Yeniden başlatmak için sınıfı sıfırla.
        void ipucuEl.offsetWidth;
        ipucuEl.classList.add('salla');
      }
      return;
    }

    oyuncuGuncelle(dt);

    // Hayalet doğumu
    if (O.evre === 'oyun') {
      O.dogumSayac -= dt;
      if (O.dogumSayac <= 0 && O.hayaletler.length < 7) {
        hayaletDogur();
        var hizlan = Math.min(1, O.saat / 40);
        O.dogumSayac = 0.85 - hizlan * 0.35 + Math.random() * 0.35;
      }
      if (!O.bossGeldi && O.saat >= 25) bossBaslat();
    }

    // Hayaletler
    var j;
    for (j = O.hayaletler.length - 1; j >= 0; j--) {
      var h = O.hayaletler[j];
      h.t += dt;
      if (h.flash > 0) h.flash = Math.max(0, h.flash - dt);

      if (O.kasirga.aktif > 0) {
        var kd = mesafe(O.oyuncu.x, O.oyuncu.y, h.x, h.y);
        if (h.kapildi < 0 && kd < G.w * 0.34) h.kapildi = 0;
        if (h.kapildi >= 0) {
          h.kapildi += dt;
          h.aci += dt * 9;
          var yaricap = G.w * 0.16 + Math.sin(h.kapildi * 7) * 8;
          h.x = O.oyuncu.x + Math.cos(h.aci + h.t * 2) * yaricap;
          h.y = O.oyuncu.y + Math.sin(h.aci + h.t * 2) * yaricap - oyuncuBoy() * 0.3;
          if (h.kapildi > 0.34) { hayaletOldur(h); continue; }
        }
      }

      if (h.kapildi < 0) {
        var dx = O.oyuncu.x - h.x;
        var dy = O.oyuncu.y - h.y;
        var d = Math.sqrt(dx * dx + dy * dy) || 1;
        var hiz = G.h * 0.12;
        h.x += dx / d * hiz * dt;
        h.y += dy / d * hiz * dt;
        h.x += Math.cos(h.t * 1.8 + h.donus) * 12 * dt;
      }

      var dokunma = mesafe(O.oyuncu.x, O.oyuncu.y - oyuncuBoy() * 0.45, h.x, h.y);
      if (dokunma < oyuncuBoy() * 0.30) {
        pufEkle(h.x, h.y, h.boy, 0.8);
        O.hayaletler.splice(j, 1);
        hasarAl();
      }
    }

    // Mermiler
    for (j = O.mermiler.length - 1; j >= 0; j--) {
      var m = O.mermiler[j];
      m.ex = m.x;
      m.ey = m.y;
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.yas += dt;

      var vurdu = false;
      var q;
      for (q = 0; q < O.hayaletler.length; q++) {
        var gh = O.hayaletler[q];
        if (gh.oluyor) continue;
        if (parcaMesafe(m.ex, m.ey, m.x, m.y, gh.x, gh.y) <= gh.boy * 0.32 + 5) {
          gh.hp -= 1;
          gh.flash = 0.14;
          vurdu = true;
          if (gh.hp <= 0) hayaletOldur(gh);
          break;
        }
      }
      if (!vurdu && O.boss && O.boss.hp > 0 && !O.boss.oluyor) {
        if (parcaMesafe(m.ex, m.ey, m.x, m.y, O.boss.x, O.boss.y) <= bossBoy() * 0.34 + 6) {
          bossVur();
          vurdu = true;
        }
      }
      if (vurdu || m.x < -80 || m.x > G.w + 80 || m.y < -80 || m.y > G.h + 80 || m.yas > 3) {
        O.mermiler.splice(j, 1);
      }
    }

    // Paralar
    for (j = O.paralar.length - 1; j >= 0; j--) {
      var pa = O.paralar[j];
      pa.yas += dt;
      pa.t += dt;
      var pd = mesafe(pa.x, pa.y, O.oyuncu.x, O.oyuncu.y - oyuncuBoy() * 0.25);
      if (pa.yas > 0.15 && pd < G.w * 0.62) {
        var pdx = O.oyuncu.x - pa.x;
        var pdy = (O.oyuncu.y - oyuncuBoy() * 0.25) - pa.y;
        var pdd = Math.sqrt(pdx * pdx + pdy * pdy) || 1;
        var cekim = 900 + (1 - Math.min(1, pd / (G.w * 0.62))) * 1700;
        pa.vx += pdx / pdd * cekim * dt;
        pa.vy += pdy / pdd * cekim * dt;
        pa.vx *= 0.94;
        pa.vy *= 0.94;
      } else {
        pa.vy += 360 * dt;
        pa.vx *= 0.98;
      }
      pa.x += pa.vx * dt;
      pa.y += pa.vy * dt;
      if (pd < oyuncuBoy() * 0.3 + 14) {
        O.para += 10;
        parayiYaz();
        O.paralar.splice(j, 1);
        continue;
      }
      if (pa.yas > 20) O.paralar.splice(j, 1);
    }

    // Puflar
    for (j = O.puflar.length - 1; j >= 0; j--) {
      O.puflar[j].t += dt;
      if (O.puflar[j].t >= 0.6) O.puflar.splice(j, 1);
    }

    // Kasırga eşyası
    if (O.kasirga.esya) {
      O.kasirga.esya.t += dt;
      var ke = O.kasirga.esya;
      ke.yukari = Math.sin(ke.t * 3) * 6;
      if (mesafe(ke.x, ke.y, O.oyuncu.x, O.oyuncu.y - oyuncuBoy() * 0.3) < oyuncuBoy() * 0.42) {
        kasirgaEtkinlestir();
      }
    }
    if (O.kasirga.aktif > 0) {
      O.kasirga.aktif = Math.max(0, O.kasirga.aktif - dt);
      O.kasirga.aci += dt * 5;
    }

    // Boss
    if (O.boss) {
      var b = O.boss;
      b.t += dt;
      if (b.oluyor) {
        b.olumSure -= dt;
        if (b.olumSure <= 0) {
          O.boss = null;
          bitir('kazan');
          return;
        }
      } else {
        if (b.giris) {
          b.y += (b.hedefY - b.y) * Math.min(1, dt * 2.2);
          if (Math.abs(b.y - b.hedefY) < 6) { b.giris = false; b.y = b.hedefY; }
        } else {
          var bdx = O.oyuncu.x - b.x;
          var bdy = O.oyuncu.y - oyuncuBoy() * 0.25 - b.y;
          var bd = Math.sqrt(bdx * bdx + bdy * bdy) || 1;
          var bhiz = G.h * 0.045;
          b.x += bdx / bd * bhiz * dt;
          b.y += bdy / bd * bhiz * dt;
        }
        b.dokunmaBekle -= dt;
        var bdok = mesafe(O.oyuncu.x, O.oyuncu.y - oyuncuBoy() * 0.3, b.x, b.y);
        if (bdok < oyuncuBoy() * 0.3 + bossBoy() * 0.3 && b.dokunmaBekle <= 0) {
          b.dokunmaBekle = 1;
          hasarAl();
        }
      }
    }

    if (!O.bossGeldi && O.olen >= 14) bossBaslat();
  }

  // ---------- Çizim ----------
  function zeminCiz() {
    if (!zeminDesen && resimHazir('tema2-zemin')) {
      var kucuk = document.createElement('canvas');
      kucuk.width = 256;
      kucuk.height = 256;
      var kctx = kucuk.getContext('2d');
      kctx.drawImage(GORSEL['tema2-zemin'], 0, 0, 256, 256);
      zeminDesen = ctx.createPattern(kucuk, 'repeat');
    }
    ctx.fillStyle = zeminDesen || '#1d2a44';
    ctx.fillRect(0, 0, G.w, G.h);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
    ctx.fillRect(0, 0, G.w, G.h);
  }

  function resimCiz(anahtar, x, y, boy, dikeyCevir, aci) {
    if (!resimHazir(anahtar)) return false;
    var im = GORSEL[anahtar];
    var en = boy * im.naturalWidth / im.naturalHeight;
    ctx.save();
    ctx.translate(x, y);
    if (aci) ctx.rotate(aci);
    if (dikeyCevir) ctx.scale(-1, 1);
    ctx.drawImage(im, -en / 2, -boy / 2, en, boy);
    ctx.restore();
    return true;
  }

  function oyuncuCiz() {
    var p = O.oyuncu;
    var boy = oyuncuBoy();
    var s = spriteBilgi();
    var en = boy * s.oran;
    var kos = s.kos;
    var geri = p.geriTepme > 0 ? boy * 0.03 : 0;
    var bob = kos ? Math.abs(Math.sin(O.saat * 14)) * boy * 0.04 : 0;
    var egim = kos ? 0.05 : 0;
    var nefes = kos ? 1 : 1 + Math.sin(O.saat * 3) * 0.015;
    var gozuken = !(p.olumsuz > 0 && Math.floor(p.olumsuz * 12) % 2 === 0);
    var x0 = p.x - p.yuz * geri;

    // Gölge
    ctx.save();
    if (!gozuken) ctx.globalAlpha = 0.35;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 2, boy * 0.28, boy * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Kinkin silahıyla birlikte tek parça; ayak çapası sabit.
    if (resimHazir(s.anahtar)) {
      ctx.save();
      if (!gozuken) ctx.globalAlpha = 0.35;
      ctx.translate(x0, p.y - bob);
      ctx.scale(p.yuz, nefes);
      if (egim) ctx.rotate(egim);
      ctx.drawImage(GORSEL[s.anahtar], -s.ayakX * en, -boy, en, boy);
      ctx.restore();
    } else {
      ctx.save();
      if (!gozuken) ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#7dd3fc';
      ctx.beginPath();
      ctx.arc(p.x, p.y - boy * 0.4, boy * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Namlu kıvılcımı, silahın ucunda.
    if (p.namlu > 0) {
      var n = namluKonumu();
      var oran = 1 - p.namlu / 0.22;
      var vkare = sinirla(Math.floor(oran * 3) + 1, 1, 3);
      resimCiz('an-vurus-' + vkare, n.x, n.y, boy * 0.18, false, 0);
    }
  }

  function hayaletCiz(h) {
    var kare = 1 + (Math.floor(h.t * 7) % 6);
    var salinim = Math.sin(h.t * 2.2 + h.donus * 4) * h.boy * 0.05;
    var aci = h.kapildi >= 0 ? h.aci * 0.9 : 0;
    ctx.save();
    if (h.kapildi >= 0) ctx.globalAlpha = 0.9;
    resimCiz('an-hayalet-suzul-' + kare, h.x, h.y + salinim, h.boy, false, aci);
    if (h.flash > 0) {
      ctx.globalCompositeOperation = 'lighter';
      var isik = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, h.boy * 0.55);
      isik.addColorStop(0, 'rgba(255,255,255,' + (0.85 * (h.flash / 0.14)) + ')');
      isik.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = isik;
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.boy * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  function bossCiz() {
    var b = O.boss;
    if (!b) return;
    var boy = bossBoy();
    var kare = 1 + (Math.floor(b.t * 5) % 3);
    var salinim = Math.sin(b.t * 1.6) * boy * 0.02;
    ctx.save();
    if (b.oluyor) ctx.globalAlpha = Math.max(0.2, b.olumSure / 1.15);
    resimCiz('an-boss-bekle-' + kare, b.x, b.y + salinim, boy, false, 0);
    ctx.restore();

    if (!b.oluyor) {
      // Can çubuğu
      var bw = Math.min(G.w * 0.72, 430);
      var bx = (G.w - bw) / 2;
      var by = Math.max(56, G.h * 0.09);
      ctx.save();
      ctx.fillStyle = 'rgba(3, 7, 18, 0.75)';
      yuvarlakDikdortgen(bx - 3, by - 3, bw + 6, 16, 8);
      ctx.fill();
      ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
      yuvarlakDikdortgen(bx, by, bw, 10, 5);
      ctx.fill();
      var oran = b.maxHp > 0 ? Math.max(0, b.hp / b.maxHp) : 0;
      var renk = ctx.createLinearGradient(bx, 0, bx + bw, 0);
      renk.addColorStop(0, '#f87171');
      renk.addColorStop(1, '#fb923c');
      ctx.fillStyle = renk;
      yuvarlakDikdortgen(bx, by, bw * oran, 10, 5);
      ctx.fill();
      ctx.restore();
    }
  }

  function mermiCiz(m) {
    ctx.save();
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.45)';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(m.ex, m.ey);
    ctx.lineTo(m.x, m.y);
    ctx.stroke();
    ctx.shadowColor = 'rgba(34, 211, 238, 0.95)';
    ctx.shadowBlur = 14;
    var renk = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 9);
    renk.addColorStop(0, '#f0fdff');
    renk.addColorStop(0.45, '#67e8f9');
    renk.addColorStop(1, 'rgba(8, 145, 178, 0)');
    ctx.fillStyle = renk;
    ctx.beginPath();
    ctx.arc(m.x, m.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function paraCiz(pa) {
    var boy = sinirla(Math.min(G.w, G.h) * 0.06, 16, 42);
    var kare = 1 + (Math.floor(pa.t * 10) % 6);
    resimCiz('an-para-' + kare, pa.x, pa.y, boy, false, 0);
  }

  function pufCiz(pf) {
    var kare = sinirla(Math.floor(pf.t / 0.1) + 1, 1, 6);
    var boy = pf.boy * pf.olcek;
    ctx.save();
    ctx.globalAlpha = 1 - pf.t / 0.6 * 0.35;
    resimCiz('an-hayalet-puf-' + kare, pf.x, pf.y, boy, false, 0);
    ctx.restore();
  }

  function kasirgaEsyaCiz() {
    var e = O.kasirga.esya;
    if (!e) return;
    var boy = sinirla(Math.min(G.w, G.h) * 0.12, 34, 96);
    var kare = 1 + (Math.floor(e.t * 12) % 3);
    ctx.save();
    ctx.shadowColor = 'rgba(56, 189, 248, 0.8)';
    ctx.shadowBlur = 18;
    resimCiz('an-kasirga-' + kare, e.x, e.y + (e.yukari || 0), boy, false, 0);
    ctx.restore();
  }

  function kasirgaAktifCiz() {
    if (O.kasirga.aktif <= 0) return;
    var boy = sinirla(Math.min(G.w, G.h) * 0.2, 50, 150);
    var yaricap = G.w * 0.14;
    var k;
    for (k = 0; k < 2; k++) {
      var aci = O.kasirga.aci + k * Math.PI;
      var x = O.oyuncu.x + Math.cos(aci) * yaricap;
      var y = O.oyuncu.y - oyuncuBoy() * 0.25 + Math.sin(aci) * yaricap * 0.5;
      var kare = 1 + (Math.floor(O.saat * 12 + k) % 3);
      ctx.save();
      ctx.globalAlpha = 0.95;
      ctx.shadowColor = 'rgba(125, 211, 252, 0.8)';
      ctx.shadowBlur = 16;
      resimCiz('an-kasirga-' + kare, x, y, boy, false, aci * 0.6);
      ctx.restore();
    }
  }

  function joystickCiz() {
    if (!O.joystick.aktif || O.evre === 'giris' || O.evre === 'bitis') return;
    var j = O.joystick;
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(j.x0, j.y0, 54, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.beginPath();
    ctx.arc(j.x0 + j.dx, j.y0 + j.dy, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(240, 249, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  function ciz() {
    ctx.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);
    ctx.clearRect(0, 0, G.w, G.h);
    zeminCiz();

    kasirgaEsyaCiz();

    var j;
    for (j = 0; j < O.paralar.length; j++) paraCiz(O.paralar[j]);
    for (j = 0; j < O.hayaletler.length; j++) hayaletCiz(O.hayaletler[j]);
    bossCiz();
    kasirgaAktifCiz();
    for (j = 0; j < O.puflar.length; j++) pufCiz(O.puflar[j]);
    for (j = 0; j < O.mermiler.length; j++) mermiCiz(O.mermiler[j]);
    oyuncuCiz();
    joystickCiz();
  }

  // ---------- Döngü ----------
  var rafId = null;
  var sonZaman = 0;
  var durdu = false;

  function dongu(simdi) {
    if (durdu) return;
    rafId = requestAnimationFrame(dongu);
    if (!sonZaman) sonZaman = simdi;
    var ham = (simdi - sonZaman) / 1000;
    sonZaman = simdi;
    if (!isFinite(ham) || ham < 0) ham = 0;
    ham = Math.min(0.05, ham);
    var dt = ham * ZAMAN.carpani;
    guncelle(dt);
    ciz();
  }

  // ---------- Test kancası ----------
  window.__playable = {
    durum: function () {
      return {
        evre: O.evre,
        can: O.can,
        para: O.para,
        olen: O.olen,
        bossCan: O.bossCan,
        bitis: O.bitis
      };
    },
    hizlandir: function (k) {
      var n = Number(k);
      ZAMAN.carpani = isFinite(n) && n > 0 ? n : 1;
    },
    konum: function () {
      return { x: O.oyuncu.x, y: O.oyuncu.y };
    },
    oyuncuBoy: function () { return oyuncuBoy(); },
    hudAlt: function () { return HUD_ALT; }
  };

  // ---------- Açılış ----------
  boyutlandir();
  canlariYaz();
  parayiYaz();
  rafId = requestAnimationFrame(dongu);
})();
