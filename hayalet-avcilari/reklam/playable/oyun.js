// Hayalet Avcıları — Google Ads App kampanyası için oynanabilir reklam.
// Saf HTML5 Canvas 2D. Dış kaynak yok; yalnız oyunun kendi WebP görselleri.
// Bugünkü oyunun dikey yolculuğunun ~35 saniyelik mini hâli:
// başlangıç -> yuvalardan hayaletler -> nehir ve inen köprü -> ikinci bölge -> boss -> kutlama.
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
      kopru: '🌉',
      zafer: '🎉',
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
      kopru: '🌉',
      zafer: '🎉',
      boss: '👑 BOSS!'
    }
  };
  var T = METIN[DIL];
  document.documentElement.lang = DIL;

  // Paketlenen görsel anahtarları (paketle.py ile aynı liste).
  var ANAHTARLAR = ['tema2-zemin', 'tema2-su'];
  var i;
  ['yuva-mezarlik', 'yuva-magara', 'yuva-izbe'].forEach(function (k) { ANAHTARLAR.push(k); });
  for (i = 1; i <= 3; i++) ANAHTARLAR.push('an-yuva-sis-' + i);
  for (i = 1; i <= 2; i++) ANAHTARLAR.push('an-yuva-duman-' + i);
  for (i = 1; i <= 2; i++) ANAHTARLAR.push('dere-sus-' + i);
  for (i = 1; i <= 6; i++) ANAHTARLAR.push('an-timsah-' + i);
  for (i = 1; i <= 6; i++) ANAHTARLAR.push('an-hayalet-suzul-' + i);
  for (i = 1; i <= 6; i++) ANAHTARLAR.push('an-hayalet-puf-' + i);
  ANAHTARLAR.push('hayalet-atici');
  ANAHTARLAR.push('boss-TR');
  ANAHTARLAR.push('hayalet-boss');
  for (i = 1; i <= 8; i++) ANAHTARLAR.push('k3-kinkin-0-' + i);
  ANAHTARLAR.push('kart-kinkin');
  for (i = 1; i <= 6; i++) ANAHTARLAR.push('an-para-' + i);
  for (i = 1; i <= 3; i++) ANAHTARLAR.push('an-elmas-' + i);
  for (i = 1; i <= 3; i++) ANAHTARLAR.push('an-vurus-' + i);
  ANAHTARLAR.push('menu-amblem');
  ANAHTARLAR.push('menu-dugme-yesil');
  ANAHTARLAR.push('menu-konfeti');
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
  var HUD_ALT = 56;
  var zeminDesen = null;
  var suDesen = null;

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
  var AZ_HAREKET = false;
  try {
    AZ_HAREKET = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch (hata) { AZ_HAREKET = false; }

  // Dünya: y büyüdükçe aşağı. Kamera yukarı (negatif y) ilerler.
  var DUNYA = {
    yuva1: 150,
    yuva2: 310,
    nehirUst: -200,
    nehirAlt: 20,
    yuva3: -500,
    bossY: -900
  };
  var YUVALAR = [
    { anahtar: 'yuva-mezarlik', x: 0.27, y: DUNYA.yuva1, tur: 'normal' },
    { anahtar: 'yuva-magara', x: 0.73, y: DUNYA.yuva2, tur: 'normal' },
    { anahtar: 'yuva-izbe', x: 0.5, y: DUNYA.yuva3, tur: 'atici' }
  ];
  var KAMERA_HEDEF = {
    baslangic: 0,
    bolge1: 0,
    kopru: -250,
    bolge2: -600,
    boss: -1070,
    kutlama: -1150
  };

  var O = {
    evre: 'giris',
    faz: 'baslangic',
    bolge: 0,
    can: 3,
    para: 0,
    elmas: 0,
    olen: 0,
    olenBolge: 0,
    dogduBolge: 0,
    hedefBolge: 7,
    bitis: null,
    saat: 0,
    basladi: false,
    girisBaslangic: 0,
    yaziKalan: 0,
    dogumSayac: 0.7,
    sarsinti: 0,
    beyaz: 0,
    kopru: 'kapali',
    kopruInme: 0,
    kopruBekle: 0,
    bossGeldi: false,
    bossZaman: 0,
    kutlamaZaman: 0,
    sonDogumUzaklik: -1,
    tekrarKullanildi: false,
    oyuncu: {
      x: 160, sy: 300, yuz: 1, yurume: 0,
      atesKalan: 0, geriTepme: 0, olumsuz: 0, atesSayac: 0, namlu: 0
    },
    joystick: { aktif: false, id: null, x0: 0, y0: 0, dx: 0, dy: 0 },
    kamera: { y: 0, hedef: 0 },
    hayaletler: [],
    mermiler: [],
    izler: [],
    paralar: [],
    puflar: [],
    yazilar: [],
    konfeti: [],
    boss: null
  };

  // ---------- Yardımcılar ----------
  function sinirla(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function mesafe(x1, y1, x2, y2) { var dx = x2 - x1, dy = y2 - y1; return Math.sqrt(dx * dx + dy * dy); }
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
  function sY(worldY) { return worldY - O.kamera.y; }
  function oyuncuBoy() { return sinirla(Math.min(G.w * 0.34, G.h * 0.18), 58, 360); }
  function hayaletBoy() { return sinirla(Math.min(G.w * 0.20, G.h * 0.115), 40, 230); }
  function bossBoy() { return sinirla(Math.min(G.w * 0.58, G.h * 0.32), 110, 420); }
  function oyuncuDunyaY() { return O.kamera.y + O.oyuncu.sy; }

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
      O.oyuncu.sy = G.h * 0.62;
    }
    O.oyuncu.x = sinirla(O.oyuncu.x, oyuncuBoy() * 0.32, G.w - oyuncuBoy() * 0.32);
    O.oyuncu.sy = sinirla(O.oyuncu.sy, HUD_ALT + oyuncuBoy() + 6, G.h - 8);
    zeminDesen = null;
    suDesen = null;
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
  function paraPop() {
    if (!paraEl) return;
    paraEl.classList.remove('pop');
    void paraEl.offsetWidth;
    paraEl.classList.add('pop');
  }
  function yaziGoster(yazi, sure) {
    buyukYaziEl.textContent = yazi;
    buyukYaziEl.classList.add('gorunur');
    O.yaziKalan = sure;
  }
  function yaziGizle() {
    buyukYaziEl.classList.remove('gorunur');
    O.yaziKalan = 0;
  }

  // ---------- Çıkış (yalnız CTA / İNDİR dokunuşunda) ----------
  function cikisYap() {
    if (window.ExitApi && typeof window.ExitApi.exit === 'function') {
      window.ExitApi.exit();
    } else {
      window.open('https://play.google.com/store/apps/details?id=com.poyrazworkshop.hayaletavcilari', '_blank');
    }
  }
  indirEl.addEventListener('click', function (e) { e.preventDefault(); cikisYap(); });
  ctaEl.addEventListener('click', function (e) { e.preventDefault(); cikisYap(); });
  tekrarEl.addEventListener('click', function (e) { e.preventDefault(); tekrarBaslat(); });

  // ---------- Oyun akışı ----------
  function oyunuBaslat() {
    if (O.evre !== 'giris') return;
    O.evre = 'oyun';
    O.basladi = true;
    O.girisBaslangic = O.saat;
    O.faz = 'bolge1';
    O.bolge = 1;
    O.kamera.hedef = KAMERA_HEDEF.bolge1;
    O.kopru = 'kapali';
    O.kopruInme = 0;
    O.hedefBolge = 7;
    O.dogumSayac = 0.5;
    ipucuEl.classList.add('gizli');
  }

  function bitir(sonuc) {
    if (O.evre === 'bitis') return;
    O.evre = 'bitis';
    O.bitis = sonuc;
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

  function durumuSifirla() {
    O.can = 3;
    O.para = 0;
    O.elmas = 0;
    O.olen = 0;
    O.olenBolge = 0;
    O.dogduBolge = 0;
    O.bitis = null;
    O.faz = 'bolge1';
    O.bolge = 1;
    O.hayaletler = [];
    O.mermiler = [];
    O.izler = [];
    O.paralar = [];
    O.puflar = [];
    O.yazilar = [];
    O.konfeti = [];
    O.boss = null;
    O.bossGeldi = false;
    O.bossZaman = 0;
    O.kutlamaZaman = 0;
    O.kopru = 'kapali';
    O.kopruInme = 0;
    O.kopruBekle = 0;
    O.sarsinti = 0;
    O.beyaz = 0;
    O.yaziKalan = 0;
    O.dogumSayac = 0.5;
    O.sonDogumUzaklik = -1;
    O.hedefBolge = 7;
    O.kamera.y = KAMERA_HEDEF.baslangic;
    O.kamera.hedef = KAMERA_HEDEF.bolge1;
    O.oyuncu.x = G.w * 0.5;
    O.oyuncu.sy = G.h * 0.62;
    O.oyuncu.yuz = 1;
    O.oyuncu.yurume = 0;
    O.oyuncu.olumsuz = 0;
    O.oyuncu.atesKalan = 0;
    O.oyuncu.atesSayac = 0;
    O.oyuncu.namlu = 0;
    O.oyuncu.geriTepme = 0;
    joystickBirak();
    canlariYaz();
    parayiYaz();
    yaziGizle();
  }

  function tekrarBaslat() {
    if (O.tekrarKullanildi || O.evre !== 'bitis') return;
    O.tekrarKullanildi = true;
    durumuSifirla();
    O.evre = 'oyun';
    O.basladi = true;
    bitisEl.hidden = true;
    ipucuEl.classList.add('gizli');
    durdu = false;
    sonZaman = 0;
    rafId = requestAnimationFrame(dongu);
  }

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

  // ---------- Hedef ve ateş ----------
  function hedefBul(menzilli) {
    var enIyi = null;
    var enIyiD = Infinity;
    var menzil = Math.max(G.w, G.h) * 0.75;
    var oy = oyuncuDunyaY();
    var j;
    for (j = 0; j < O.hayaletler.length; j++) {
      var h = O.hayaletler[j];
      if (h.oluyor) continue;
      var d = mesafe(O.oyuncu.x, oy, h.x, h.y);
      if (menzilli && d > menzil) continue;
      if (d < enIyiD) { enIyiD = d; enIyi = h; }
    }
    if (O.boss && O.boss.hp > 0 && !O.boss.oluyor) {
      var bd = mesafe(O.oyuncu.x, oy, O.boss.x, O.boss.y);
      if ((!menzilli || bd <= menzil) && bd < enIyiD) { enIyiD = bd; enIyi = O.boss; }
    }
    return enIyi;
  }

  function namluKonumu() {
    var p = O.oyuncu;
    var boy = oyuncuBoy();
    return {
      x: p.x + p.yuz * boy * 0.22,
      y: p.sy - boy * 0.56
    };
  }

  function atesEt(hedef) {
    var p = O.oyuncu;
    var n = namluKonumu();
    var hedefY = hedef.y - O.kamera.y;
    var aci = Math.atan2(hedefY - n.y, hedef.x - n.x);
    var hiz = Math.max(G.w, G.h) * 1.7;
    O.mermiler.push({
      x: n.x, y: n.y,
      ex: n.x, ey: n.y,
      vx: Math.cos(aci) * hiz,
      vy: Math.sin(aci) * hiz,
      yas: 0
    });
    p.atesKalan = 0.16;
    p.geriTepme = 0.14;
    p.namlu = 0.22;
    if (Math.abs(hedef.x - p.x) > 3) p.yuz = hedef.x > p.x ? 1 : -1;
  }

  function hasarAl() {
    if (O.oyuncu.olumsuz > 0 || O.evre === 'bitis') return;
    O.can -= 1;
    O.oyuncu.olumsuz = 2;
    canlariYaz();
    if (O.can <= 0) {
      O.can = 0;
      canlariYaz();
      bitir('kayip');
    }
  }

  function pufEkle(x, y, boy, olcek, anahtar) {
    O.puflar.push({ x: x, y: y, boy: boy, olcek: olcek || 1, t: 0, anahtar: anahtar || 'an-hayalet-puf' });
  }

  function yaziEkle(x, sy, metin) {
    O.yazilar.push({ x: x, y: sy, t: 0, metin: metin });
  }

  function paraEkle(x, y, elmas) {
    var aci = Math.random() * Math.PI * 2;
    var hiz = 40 + Math.random() * 80;
    O.paralar.push({
      x: x, y: y,
      vx: Math.cos(aci) * hiz,
      vy: Math.sin(aci) * hiz - 60,
      t: 0, yas: 0, elmas: !!elmas
    });
  }

  function konfetiBaslat() {
    var k;
    var adet = AZ_HAREKET ? 10 : 22;
    for (k = 0; k < adet; k++) {
      O.konfeti.push({
        x: G.w * 0.5 + (Math.random() - 0.5) * G.w * 0.3,
        y: G.h * 0.35 + (Math.random() - 0.5) * G.h * 0.1,
        vx: (Math.random() - 0.5) * G.w * 0.9,
        vy: -G.h * (0.25 + Math.random() * 0.35),
        aci: Math.random() * Math.PI * 2,
        donus: (Math.random() - 0.5) * 8,
        boy: sinirla(Math.min(G.w, G.h) * 0.07, 18, 46),
        t: 0
      });
    }
  }

  // ---------- Hayaletler ----------
  function yuvaBul(bolge) {
    var uygun = [];
    var j;
    for (j = 0; j < YUVALAR.length; j++) {
      var y = YUVALAR[j];
      if (bolge === 1 && (y.anahtar === 'yuva-mezarlik' || y.anahtar === 'yuva-magara')) uygun.push(y);
      if (bolge === 2 && y.anahtar === 'yuva-izbe') uygun.push(y);
    }
    if (!uygun.length) uygun = YUVALAR;
    return uygun[Math.floor(Math.random() * uygun.length)];
  }

  function hayaletDogur() {
    var y = yuvaBul(O.bolge);
    var lx = G.w * y.x;
    var x = lx + (Math.random() - 0.5) * 46;
    var wy = y.y + (Math.random() - 0.5) * 26;
    var atici = (O.bolge === 2 && (O.dogduBolge === 1 || O.dogduBolge === 4));
    var boy = hayaletBoy() * (0.9 + Math.random() * 0.2);
    O.hayaletler.push({
      x: x, y: wy, boy: boy,
      hp: atici ? 3 : 2,
      tur: atici ? 'atici' : 'normal',
      yas: 0,
      t: Math.random() * 3,
      flash: 0,
      oluyor: false,
      donus: (Math.random() - 0.5) * 0.7,
      atesSayac: 1 + Math.random()
    });
    O.sonDogumUzaklik = Math.round(mesafe(x, wy, lx, y.y));
    pufEkle(lx, y.y, boy * 1.1, boy / hayaletBoy(), 'an-yuva-duman');
    O.dogduBolge += 1;
  }

  function hayaletOldur(h) {
    if (h.oluyor) return;
    h.oluyor = true;
    pufEkle(h.x, h.y, h.boy * 1.15, h.boy / hayaletBoy(), 'an-hayalet-puf');
    O.olen += 1;
    O.olenBolge += 1;
    var elmas = O.olen % 3 === 0;
    paraEkle(h.x, h.y, elmas);
    if (elmas) paraEkle(h.x, h.y, true);
    var k = O.hayaletler.indexOf(h);
    if (k >= 0) O.hayaletler.splice(k, 1);
  }

  function bolgeTemiz() {
    if (O.faz === 'bolge1') {
      O.faz = 'kopru';
      O.kopru = 'acik';
      O.kopruBekle = 0;
      O.kamera.hedef = KAMERA_HEDEF.kopru;
      yaziGoster(T.kopru, 2);
    } else if (O.faz === 'bolge2') {
      O.faz = 'boss';
      O.bolge = 3;
      O.kamera.hedef = KAMERA_HEDEF.boss;
      O.bossZaman = 0;
      yaziGoster(T.boss, 1.8);
    }
  }

  function bolge2Basla() {
    if (O.faz !== 'kopru') return;
    O.faz = 'bolge2';
    O.bolge = 2;
    O.olenBolge = 0;
    O.dogduBolge = 0;
    O.hedefBolge = 6;
    O.dogumSayac = 0.4;
    O.kamera.hedef = KAMERA_HEDEF.bolge2;
  }

  function bossBaslat() {
    if (O.bossGeldi) return;
    O.bossGeldi = true;
    O.boss = {
      x: G.w * 0.5,
      y: O.kamera.hedef + 30,
      hedefY: DUNYA.bossY,
      hp: 12,
      maxHp: 12,
      t: 0,
      giris: true,
      oluyor: false,
      olumSure: 0,
      dokunmaBekle: 0,
      buyume: 0
    };
  }

  function bossVur() {
    if (!O.boss || O.boss.oluyor) return;
    O.boss.hp -= 1;
    if (!AZ_HAREKET) O.sarsinti = Math.max(O.sarsinti, 0.26);
    if (O.boss.hp <= 0) {
      O.boss.hp = 0;
      O.boss.oluyor = true;
      O.boss.olumSure = 1.1;
      pufEkle(O.boss.x, O.boss.y, bossBoy() * 1.5, 2.4, 'an-hayalet-puf');
      var kk;
      for (kk = 0; kk < 14; kk++) {
        paraEkle(O.boss.x + (Math.random() - 0.5) * bossBoy() * 0.7, O.boss.y + (Math.random() - 0.5) * bossBoy() * 0.5, kk % 2 === 0);
      }
      konfetiBaslat();
      yaziGoster(T.zafer, 2.2);
      O.faz = 'kutlama';
      O.kutlamaZaman = 0;
      O.kamera.hedef = KAMERA_HEDEF.kutlama;
    }
  }

  // ---------- Güncelleme ----------
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
        var hiz = Math.min(G.w, G.h) * 0.62;
        p.x += jx * hiz * dt;
        p.sy += jy * hiz * dt;
      }
    }
    p.x = sinirla(p.x, oyuncuBoy() * 0.32, G.w - oyuncuBoy() * 0.32);
    p.sy = sinirla(p.sy, HUD_ALT + oyuncuBoy() + 6, G.h - 8);

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

    if (O.evre === 'oyun') {
      p.atesSayac -= dt;
      var nisan = hedefBul(true);
      if (nisan && p.atesSayac <= 0) {
        atesEt(nisan);
        p.atesSayac = 0.32;
      }
      if (p.atesSayac < 0) p.atesSayac = 0;
    }
  }

  function kameraGuncelle(dt) {
    var fark = O.kamera.hedef - O.kamera.y;
    if (Math.abs(fark) < 0.5) {
      O.kamera.y = O.kamera.hedef;
    } else {
      O.kamera.y += fark * Math.min(1, dt * (AZ_HAREKET ? 8 : 3.2));
      var adim = Math.min(Math.abs(fark), Math.max(G.h, 300) * dt * 0.9);
      O.kamera.y += (fark > 0 ? 1 : -1) * adim * 0.25;
    }
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

    if (O.sarsinti > 0) O.sarsinti = Math.max(0, O.sarsinti - dt);
    if (O.beyaz > 0) O.beyaz = Math.max(0, O.beyaz - dt * 4);

    if (O.evre === 'giris') {
      oyuncuGuncelle(dt);
      return;
    }

    kameraGuncelle(dt);
    oyuncuGuncelle(dt);

    var j;

    // Köprü inme animasyonu ve ikinci bölgeye geçiş.
    if (O.faz === 'kopru') {
      O.kopruInme = Math.min(1, O.kopruInme + dt / 1.4);
      if (O.kopruInme >= 1) {
        O.kopruBekle += dt;
        if (O.kopruBekle >= 1) bolge2Basla();
      }
    }

    // Bölge doğumu.
    if ((O.faz === 'bolge1' || O.faz === 'bolge2') && O.evre === 'oyun') {
      O.dogumSayac -= dt;
      if (O.dogumSayac <= 0 && O.dogduBolge < O.hedefBolge && O.hayaletler.length < 6) {
        hayaletDogur();
        O.dogumSayac = 0.9 + Math.random() * 0.35;
      }
      if (O.dogduBolge >= O.hedefBolge && O.hayaletler.length === 0) {
        bolgeTemiz();
      }
    }

    // Boss çağrısı.
    if (O.faz === 'boss' && !O.bossGeldi) {
      O.bossZaman += dt;
      if (O.bossZaman > 1) bossBaslat();
    }

    var oy = oyuncuDunyaY();

    // Hayaletler.
    for (j = O.hayaletler.length - 1; j >= 0; j--) {
      var h = O.hayaletler[j];
      h.t += dt;
      h.yas += dt;
      if (h.flash > 0) h.flash = Math.max(0, h.flash - dt);
      var dx = O.oyuncu.x - h.x;
      var dy = oy - h.y;
      var d = Math.sqrt(dx * dx + dy * dy) || 1;
      var hiz = G.h * (h.tur === 'atici' ? 0.07 : 0.11);
      if (h.tur === 'atici' && d < G.w * 0.42) hiz = -G.h * 0.03;
      h.x += dx / d * hiz * dt;
      h.y += dy / d * hiz * dt;
      h.x += Math.cos(h.t * 1.8 + h.donus) * 12 * dt;

      if (h.tur === 'atici') {
        h.atesSayac -= dt;
        if (h.atesSayac <= 0 && d < G.w * 0.8) {
          h.atesSayac = 2.4 + Math.random();
          var aci = Math.atan2((oy - O.kamera.y) - (h.y - O.kamera.y), O.oyuncu.x - h.x);
          var hx = h.x, hy = h.y - O.kamera.y;
          O.izler.push({
            x1: hx, y1: hy,
            x2: hx + Math.cos(aci) * G.h * 0.35,
            y2: hy + Math.sin(aci) * G.h * 0.35,
            t: 0
          });
        }
      }

      var dokunma = mesafe(O.oyuncu.x, oy, h.x, h.y);
      if (h.yas > 1.4 && dokunma < oyuncuBoy() * 0.42 + h.boy * 0.2) {
        pufEkle(h.x, h.y, h.boy, 0.8, 'an-hayalet-puf');
        O.hayaletler.splice(j, 1);
        hasarAl();
      }
    }

    // Mermiler.
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
        var gy = gh.y - O.kamera.y;
        if (parcaMesafe(m.ex, m.ey, m.x, m.y, gh.x, gy) <= gh.boy * 0.32 + 5) {
          gh.hp -= 1;
          gh.flash = 0.14;
          O.beyaz = Math.max(O.beyaz, 0.2);
          vurdu = true;
          if (gh.hp <= 0) hayaletOldur(gh);
          break;
        }
      }
      if (!vurdu && O.boss && O.boss.hp > 0 && !O.boss.oluyor) {
        var by = O.boss.y - O.kamera.y;
        if (parcaMesafe(m.ex, m.ey, m.x, m.y, O.boss.x, by) <= bossBoy() * 0.32 + 6) {
          bossVur();
          vurdu = true;
        }
      }
      if (vurdu || m.x < -80 || m.x > G.w + 80 || m.y < -80 || m.y > G.h + 80 || m.yas > 3) {
        O.mermiler.splice(j, 1);
      }
    }

    // Atıcı izleri (hasar vermez; yalnız görsel).
    for (j = O.izler.length - 1; j >= 0; j--) {
      O.izler[j].t += dt;
      if (O.izler[j].t >= 0.3) O.izler.splice(j, 1);
    }

    // Paralar: önce saçılır, sonra HUD sayacına uçar.
    var hedefX = G.w - 58;
    var hedefWy = O.kamera.y + HUD_ALT * 0.5;
    for (j = O.paralar.length - 1; j >= 0; j--) {
      var pa = O.paralar[j];
      pa.yas += dt;
      pa.t += dt;
      if (pa.yas > 0.2) {
        var pdx = hedefX - pa.x;
        var pdy = hedefWy - pa.y;
        var pdd = Math.sqrt(pdx * pdx + pdy * pdy) || 1;
        var cekim = 1200;
        pa.vx += pdx / pdd * cekim * dt;
        pa.vy += pdy / pdd * cekim * dt;
        pa.vx *= 0.9;
        pa.vy *= 0.9;
      } else {
        pa.vy += 360 * dt;
        pa.vx *= 0.98;
      }
      pa.x += pa.vx * dt;
      pa.y += pa.vy * dt;
      if (mesafe(pa.x, pa.y, hedefX, hedefWy) < 18) {
        O.para += 10;
        if (pa.elmas) O.elmas += 1;
        parayiYaz();
        paraPop();
        yaziEkle(O.oyuncu.x, O.oyuncu.sy - oyuncuBoy() * 0.8, '+10');
        O.paralar.splice(j, 1);
        continue;
      }
      if (pa.yas > 6) O.paralar.splice(j, 1);
    }

    // Puflar.
    for (j = O.puflar.length - 1; j >= 0; j--) {
      O.puflar[j].t += dt;
      if (O.puflar[j].t >= 0.6) O.puflar.splice(j, 1);
    }
    // Yazılar.
    for (j = O.yazilar.length - 1; j >= 0; j--) {
      O.yazilar[j].t += dt;
      if (O.yazilar[j].t >= 0.9) O.yazilar.splice(j, 1);
    }
    // Konfeti.
    for (j = O.konfeti.length - 1; j >= 0; j--) {
      var kf = O.konfeti[j];
      kf.t += dt;
      kf.vy += G.h * 0.55 * dt;
      kf.x += kf.vx * dt;
      kf.y += kf.vy * dt;
      kf.aci += kf.donus * dt;
      if (kf.t >= 2.2 || kf.y > G.h + 60) O.konfeti.splice(j, 1);
    }

    // Boss.
    if (O.boss) {
      var b = O.boss;
      b.t += dt;
      if (b.oluyor) {
        b.olumSure -= dt;
        if (b.olumSure <= 0) {
          O.boss = null;
        }
      } else {
        if (b.giris) {
          b.y += (b.hedefY - b.y) * Math.min(1, dt * 2.2);
          if (Math.abs(b.y - b.hedefY) < 6) { b.giris = false; b.y = b.hedefY; }
        } else {
          b.buyume += dt;
          b.x = G.w * 0.5 + Math.sin(b.buyume * 1.3) * G.w * 0.2;
          b.y = b.hedefY + Math.sin(b.buyume * 2.1) * 10;
        }
        b.dokunmaBekle -= dt;
        var bdok = mesafe(O.oyuncu.x, oy, b.x, b.y);
        if (bdok < oyuncuBoy() * 0.3 + bossBoy() * 0.26 && b.dokunmaBekle <= 0) {
          b.dokunmaBekle = 1.6;
          hasarAl();
        }
      }
    }
    if (O.faz === 'kutlama') {
      O.kutlamaZaman += dt;
      if (O.kutlamaZaman >= 2.4 && !O.boss) {
        bitir('kazan');
      }
    }
  }

  // ---------- Çizim ----------
  function desenYap(anahtar, boyut) {
    if (!resimHazir(anahtar)) return null;
    var kucuk = document.createElement('canvas');
    kucuk.width = boyut;
    kucuk.height = boyut;
    var kctx = kucuk.getContext('2d');
    kctx.drawImage(GORSEL[anahtar], 0, 0, boyut, boyut);
    return ctx.createPattern(kucuk, 'repeat');
  }

  function zeminCiz() {
    if (!zeminDesen) zeminDesen = desenYap('tema2-zemin', 512);
    ctx.save();
    if (zeminDesen) {
      var off = ((-O.kamera.y) % 512 + 512) % 512;
      ctx.translate(0, off);
      ctx.fillStyle = zeminDesen;
      ctx.fillRect(0, -off, G.w, G.h + 512);
    } else {
      ctx.fillStyle = '#1d2a44';
      ctx.fillRect(0, 0, G.w, G.h);
    }
    ctx.restore();
    ctx.fillStyle = 'rgba(5, 10, 26, 0.20)';
    ctx.fillRect(0, 0, G.w, G.h);
  }

  function nehirCiz() {
    var ust = sY(DUNYA.nehirUst);
    var alt = sY(DUNYA.nehirAlt);
    if (alt < -40 || ust > G.h + 40) return;
    if (!suDesen) suDesen = desenYap('tema2-su', 512);
    ctx.save();
    ctx.translate(0, -O.kamera.y);
    if (suDesen) {
      ctx.fillStyle = suDesen;
      ctx.fillRect(0, DUNYA.nehirUst, G.w, DUNYA.nehirAlt - DUNYA.nehirUst);
    } else {
      ctx.fillStyle = '#0e4f6e';
      ctx.fillRect(0, DUNYA.nehirUst, G.w, DUNYA.nehirAlt - DUNYA.nehirUst);
    }
    ctx.restore();
    ctx.fillStyle = 'rgba(8, 40, 60, 0.22)';
    ctx.fillRect(0, ust, G.w, Math.min(G.h, alt) - Math.max(0, ust));

    // Dalgalar.
    ctx.save();
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.30)';
    ctx.lineWidth = 2;
    var k;
    for (k = 0; k < 5; k++) {
      var wy = ust + (alt - ust) * ((k + 1) / 6);
      if (wy < -20 || wy > G.h + 20) continue;
      ctx.beginPath();
      var x;
      for (x = 0; x <= G.w; x += 12) {
        var yy = wy + Math.sin((x * 0.035) + O.saat * 1.7 + k) * 4;
        if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    ctx.restore();

    // Kıyı süsleri.
    var suslar = [
      { anahtar: 'dere-sus-1', x: 0.12, y: DUNYA.nehirUst - 8, yon: 1 },
      { anahtar: 'dere-sus-2', x: 0.88, y: DUNYA.nehirUst - 8, yon: -1 },
      { anahtar: 'dere-sus-1', x: 0.22, y: DUNYA.nehirAlt + 8, yon: -1 },
      { anahtar: 'dere-sus-2', x: 0.78, y: DUNYA.nehirAlt + 8, yon: 1 }
    ];
    for (k = 0; k < suslar.length; k++) {
      var s = suslar[k];
      var sy = sY(s.y);
      if (sy < -60 || sy > G.h + 60) continue;
      resimCiz(s.anahtar, G.w * s.x, sy, Math.min(G.w * 0.16, 70), s.yon < 0, 0);
    }
  }

  function timsahCiz() {
    var ust = sY(DUNYA.nehirUst);
    var alt = sY(DUNYA.nehirAlt);
    if (alt < -60 || ust > G.h + 60) return;
    var orta = (ust + alt) / 2;
    var x = G.w * 0.5 + Math.sin(O.saat * 0.55) * G.w * 0.28;
    var yon = Math.cos(O.saat * 0.55) < 0;
    var kare = 1 + (Math.floor(O.saat * 5) % 6);
    resimCiz('an-timsah-' + kare, x, orta, Math.min(G.h * 0.13, 78), yon, 0);
  }

  function kopruCiz() {
    var ust = sY(DUNYA.nehirUst);
    var alt = sY(DUNYA.nehirAlt);
    if (alt < -80 || ust > G.h + 80) return;
    var bw = Math.min(G.w * 0.30, 132);
    var bx = G.w * 0.5;
    var band = alt - ust;
    var p = O.kopruInme;
    var adet = 7;
    var k;
    ctx.save();
    // Direkler.
    ctx.fillStyle = '#5b3a1e';
    ctx.fillRect(bx - bw / 2 - 5, ust - 8, 8, band + 16);
    ctx.fillRect(bx + bw / 2 - 3, ust - 8, 8, band + 16);
    // Halatlar.
    ctx.strokeStyle = 'rgba(234, 200, 128, 0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx - bw / 2, ust - 4);
    ctx.lineTo(bx + bw / 2, ust - 4);
    ctx.stroke();
    // Tahtalar: kapalıyken yukarıda ve eğik, açılırken yatağa iner.
    for (k = 0; k < adet; k++) {
      var kapaliY = ust + 8 + k * 3 - 14;
      var acikY = ust + (k + 0.5) * band / adet;
      var py = kapaliY + (acikY - kapaliY) * p;
      var aci = (1 - p) * (-1.05 + k * 0.02);
      var pw = bw - 8;
      ctx.save();
      ctx.translate(bx, py);
      ctx.rotate(aci);
      var renk = k % 2 === 0 ? '#a86b32' : '#8f5728';
      ctx.fillStyle = renk;
      yuvarlakDikdortgen(-pw / 2, -5, pw, 10, 4);
      ctx.fill();
      ctx.strokeStyle = 'rgba(61, 34, 12, 0.55)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
    // Kapalıyken parlayan bariyer.
    if (p < 1) {
      var alfa = 1 - p;
      ctx.globalAlpha = alfa;
      var orta = (ust + alt) / 2;
      var isik = ctx.createLinearGradient(0, orta - 26, 0, orta + 26);
      isik.addColorStop(0, 'rgba(125, 211, 252, 0)');
      isik.addColorStop(0.5, 'rgba(125, 211, 252, ' + (0.55 + 0.25 * Math.sin(O.saat * 5)) + ')');
      isik.addColorStop(1, 'rgba(125, 211, 252, 0)');
      ctx.fillStyle = isik;
      ctx.fillRect(0, orta - 26, G.w, 52);
      ctx.strokeStyle = 'rgba(224, 242, 254, ' + (0.7 + 0.2 * Math.sin(O.saat * 7)) + ')';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, orta);
      ctx.lineTo(G.w, orta);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function yuvalarCiz() {
    var j;
    for (j = 0; j < YUVALAR.length; j++) {
      var y = YUVALAR[j];
      var sy = sY(y.y);
      if (sy < -160 || sy > G.h + 120) continue;
      var lx = G.w * y.x;
      var boy = Math.min(G.w * 0.30, G.h * 0.17);
      // Sürekli sürüklenen sis.
      if (resimHazir('an-yuva-sis-1')) {
        var sisKare = 1 + (Math.floor(O.saat * 3 + j) % 3);
        ctx.save();
        ctx.globalAlpha = 0.30;
        var salk = Math.sin(O.saat * 1.2 + j) * 10;
        resimCiz('an-yuva-sis-' + sisKare, lx + salk, sy - boy * 0.18, boy * 1.7, false, 0);
        ctx.restore();
      }
      var res = resimCiz(y.anahtar, lx, sy - boy * 0.42, boy, false, 0);
      if (!res) {
        ctx.save();
        ctx.fillStyle = '#334155';
        yuvarlakDikdortgen(lx - boy * 0.4, sy - boy * 0.7, boy * 0.8, boy * 0.7, 16);
        ctx.fill();
        ctx.restore();
      }
    }
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

  function oyuncuKare(hareket) {
    if (O.oyuncu.namlu > 0) return O.oyuncu.geriTepme > 0.08 ? 7 : 8;
    if (hareket) {
      return 1 + (((Math.floor(O.oyuncu.yurume) % 4) + 4) % 4);
    }
    return 5 + (Math.floor(O.saat / 0.55) % 2);
  }

  function oyuncuCiz() {
    var p = O.oyuncu;
    var boy = oyuncuBoy();
    var anahtar = 'k3-kinkin-0-' + oyuncuKare(p.yurume > 0);
    var im = GORSEL[anahtar];
    var oran = (im && im.naturalWidth > 0 && im.naturalHeight > 0) ? im.naturalWidth / im.naturalHeight : 0.566;
    // Yedek: kart-kinkin.
    if (!resimHazir(anahtar)) {
      anahtar = 'kart-kinkin';
      im = GORSEL[anahtar];
      oran = (im && im.naturalWidth > 0 && im.naturalHeight > 0) ? im.naturalWidth / im.naturalHeight : 1;
    }
    var en = boy * oran;
    var geri = p.geriTepme > 0 ? boy * 0.03 : 0;
    var bob = p.yurume > 0 ? Math.abs(Math.sin(O.saat * 14)) * boy * 0.04 : Math.sin(O.saat * 3) * boy * 0.01;
    var gozuken = !(p.olumsuz > 0 && Math.floor(p.olumsuz * 12) % 2 === 0);
    var x0 = p.x - p.yuz * geri;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.sy + 2, boy * 0.28, boy * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    if (!gozuken) ctx.globalAlpha = 0.35;
    ctx.translate(x0, p.sy - bob);
    ctx.scale(p.yuz, 1);
    if (resimHazir(anahtar)) {
      ctx.drawImage(GORSEL[anahtar], -en / 2, -boy, en, boy);
    } else {
      ctx.fillStyle = '#7dd3fc';
      ctx.beginPath();
      ctx.arc(0, -boy * 0.45, boy * 0.28, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    if (p.namlu > 0) {
      var n = namluKonumu();
      var oran2 = 1 - p.namlu / 0.22;
      var kare = sinirla(Math.floor(oran2 * 3) + 1, 1, 3);
      resimCiz('an-vurus-' + kare, n.x, n.y, boy * 0.18, false, 0);
    }
  }

  function hayaletCiz(h) {
    var sy = h.y - O.kamera.y;
    var salinim = Math.sin(h.t * 2.2 + h.donus * 4) * h.boy * 0.05;
    if (h.tur === 'atici') {
      var yon = O.oyuncu.x < h.x;
      ctx.save();
      if (h.flash > 0) ctx.globalAlpha = 0.75;
      resimCiz('hayalet-atici', h.x, sy + salinim, h.boy * 1.05, yon, 0);
      ctx.restore();
    } else {
      var kare = 1 + (Math.floor(h.t * 7) % 6);
      resimCiz('an-hayalet-suzul-' + kare, h.x, sy + salinim, h.boy, false, 0);
    }
    if (h.flash > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      var isik = ctx.createRadialGradient(h.x, sy, 0, h.x, sy, h.boy * 0.55);
      isik.addColorStop(0, 'rgba(255,255,255,' + (0.85 * (h.flash / 0.14)) + ')');
      isik.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = isik;
      ctx.beginPath();
      ctx.arc(h.x, sy, h.boy * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function bossCiz() {
    var b = O.boss;
    if (!b) return;
    var boy = bossBoy();
    var sy = b.y - O.kamera.y;
    var kare = 1 + (Math.floor(b.t * 5) % 3);
    ctx.save();
    if (b.oluyor) ctx.globalAlpha = Math.max(0.2, b.olumSure / 1.1);
    var cizildi = resimCiz('boss-TR', b.x, sy + Math.sin(b.t * 1.6) * boy * 0.02, boy, false, 0);
    if (!cizildi) resimCiz('hayalet-boss', b.x, sy, boy, false, 0);
    ctx.restore();

    if (!b.oluyor) {
      var bw = Math.min(G.w * 0.72, 430);
      var bx = (G.w - bw) / 2;
      var by = Math.max(HUD_ALT + 10, G.h * 0.09);
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
      ctx.font = '800 11px system-ui, sans-serif';
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'right';
      ctx.fillText('👑 ' + b.hp + '/' + b.maxHp, bx + bw, by + 24);
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

  function izCiz(z) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, 0.65 * (1 - z.t / 0.3));
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(z.x1, z.y1);
    ctx.lineTo(z.x2, z.y2);
    ctx.stroke();
    ctx.restore();
  }

  function paraCiz(pa) {
    var boy = sinirla(Math.min(G.w, G.h) * 0.06, 16, 42);
    var kare;
    if (pa.elmas) kare = 1 + (Math.floor(pa.t * 10) % 3);
    else kare = 1 + (Math.floor(pa.t * 10) % 6);
    var anahtar = pa.elmas ? 'an-elmas-' + kare : 'an-para-' + kare;
    resimCiz(anahtar, pa.x, pa.y - O.kamera.y, boy, false, 0);
  }

  function pufCiz(pf) {
    var kare;
    if (pf.anahtar === 'an-yuva-duman') {
      kare = 1 + (Math.floor(pf.t / 0.3) % 2);
      ctx.save();
      ctx.globalAlpha = 1 - pf.t / 0.6 * 0.5;
      resimCiz('an-yuva-duman-' + kare, pf.x, pf.y - O.kamera.y, pf.boy * pf.olcek, false, 0);
      ctx.restore();
      return;
    }
    kare = sinirla(Math.floor(pf.t / 0.1) + 1, 1, 6);
    ctx.save();
    ctx.globalAlpha = 1 - pf.t / 0.6 * 0.35;
    resimCiz('an-hayalet-puf-' + kare, pf.x, pf.y - O.kamera.y, pf.boy * pf.olcek, false, 0);
    ctx.restore();
  }

  function yazilarCiz() {
    var j;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '800 20px system-ui, sans-serif';
    for (j = 0; j < O.yazilar.length; j++) {
      var y = O.yazilar[j];
      var oran = y.t / 0.9;
      ctx.globalAlpha = 1 - oran;
      ctx.fillStyle = '#fde047';
      ctx.strokeStyle = 'rgba(30, 20, 0, 0.65)';
      ctx.lineWidth = 4;
      ctx.strokeText(y.metin, y.x, y.y - 30 - oran * 36);
      ctx.fillText(y.metin, y.x, y.y - 30 - oran * 36);
    }
    ctx.restore();
  }

  function konfetiCiz() {
    var j;
    for (j = 0; j < O.konfeti.length; j++) {
      var k = O.konfeti[j];
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - k.t / 2.2);
      ctx.translate(k.x, k.y);
      ctx.rotate(k.aci);
      if (resimHazir('menu-konfeti')) {
        var im = GORSEL['menu-konfeti'];
        var en = k.boy * im.naturalWidth / im.naturalHeight;
        ctx.drawImage(im, -en / 2, -k.boy / 2, en, k.boy);
      } else {
        ctx.fillStyle = j % 2 ? '#fde047' : '#4ade80';
        ctx.fillRect(-k.boy / 2, -k.boy / 4, k.boy, k.boy / 2);
      }
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

    var sars = 0;
    if (!AZ_HAREKET && O.sarsinti > 0) sars = Math.min(6, O.sarsinti * 26);
    ctx.save();
    if (sars > 0) ctx.translate((Math.random() - 0.5) * sars, (Math.random() - 0.5) * sars);

    zeminCiz();
    nehirCiz();
    yuvalarCiz();
    kopruCiz();
    timsahCiz();

    var j;
    for (j = 0; j < O.paralar.length; j++) paraCiz(O.paralar[j]);
    for (j = 0; j < O.hayaletler.length; j++) hayaletCiz(O.hayaletler[j]);
    bossCiz();
    for (j = 0; j < O.puflar.length; j++) pufCiz(O.puflar[j]);
    for (j = 0; j < O.mermiler.length; j++) mermiCiz(O.mermiler[j]);
    for (j = 0; j < O.izler.length; j++) izCiz(O.izler[j]);
    oyuncuCiz();
    joystickCiz();
    yazilarCiz();
    konfetiCiz();

    ctx.restore();

    if (O.beyaz > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.5, O.beyaz);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, G.w, G.h);
      ctx.restore();
    }
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
        faz: O.faz,
        bolge: O.bolge,
        kopru: O.kopru,
        kopruInme: O.kopruInme,
        kameraY: Math.round(O.kamera.y),
        can: O.can,
        para: O.para,
        elmas: O.elmas,
        olen: O.olen,
        bossCan: O.boss ? O.boss.hp : 0,
        boss: !!(O.boss && O.boss.hp > 0 && !O.boss.oluyor),
        bitis: O.bitis,
        sonDogumUzaklik: O.sonDogumUzaklik
      };
    },
    hizlandir: function (k) {
      var n = Number(k);
      ZAMAN.carpani = isFinite(n) && n > 0 ? n : 1;
    },
    konum: function () {
      return { x: O.oyuncu.x, y: O.oyuncu.sy };
    },
    oyuncuBoy: function () { return oyuncuBoy(); },
    hudAlt: function () { return HUD_ALT; },
    yuvalar: function () {
      return YUVALAR.map(function (y) { return { x: Math.round(G.w * y.x), y: y.y, anahtar: y.anahtar }; });
    }
  };

  // ---------- Açılış ----------
  boyutlandir();
  canlariYaz();
  parayiYaz();
  rafId = requestAnimationFrame(dongu);
})();
