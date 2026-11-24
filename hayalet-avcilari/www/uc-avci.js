// Hayalet Avcıları: kodla kurulan gerçek 3D avcılar (three.js, UC-BOYUT.md).
// Tek gizli WebGL tuvali; her avcı sırayla buraya çizilir ve hemen ctx.drawImage ile 2D tuvale basılır.
import * as THREE from './lib/three.module.min.js';

const BOY = 100; // model dünya birimi: ayak 0, baş tepesi ~100 (kostüm tacı taşabilir)
let hazir = false;
let kapali = false;
let renderer = null;
let sahne = null;
let kamera = null;
let aktifRig = null;
let tuval = null;
let tuvalBoyut = 0;
const rigler = new Map();
const durumlar = new Map();

// Toon rampası: 3 kademeli (NearestFilter). Bütün gövde parçaları paylaşır.
let _rampa = null;
function rampaAl() {
  if (_rampa) return _rampa;
  _rampa = new THREE.DataTexture(new Uint8Array([70, 70, 70, 255, 165, 165, 165, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat);
  _rampa.minFilter = THREE.NearestFilter;
  _rampa.magFilter = THREE.NearestFilter;
  _rampa.generateMipmaps = false;
  _rampa.needsUpdate = true;
  return _rampa;
}
// Malzemeler renge göre önbellekte: toon gövde + dark kontur (ters kabuk). emisyon verilirse parlayan çekirdek/göz.
const _malzemeOnbellek = new Map();
function toonMalzeme(renk, emisyon) {
  const anahtar = `${renk}|${emisyon || ""}`;
  let m = _malzemeOnbellek.get(anahtar);
  if (m) return m;
  m = new THREE.MeshToonMaterial({ color: new THREE.Color(renk), gradientMap: rampaAl() });
  if (emisyon) { m.emissive = new THREE.Color(emisyon); m.emissiveIntensity = 1; }
  _malzemeOnbellek.set(anahtar, m);
  return m;
}
// Yuvarlatılmış kutu: BoxGeometry köşeleri iç kutuya çekilip yarıçap kadar dışa itilir; geometri önbellekte.
const _geoOnbellek = new Map();
function yuvarlakGeo(w, h, d, oran = 0.24, parca = 3) {
  const r = Math.max(0.02, Math.min(w, h, d) * Math.min(0.5, oran));
  const anahtar = `${w.toFixed(2)}|${h.toFixed(2)}|${d.toFixed(2)}|${r.toFixed(2)}|${parca}`;
  let g = _geoOnbellek.get(anahtar);
  if (g) return g;
  g = new THREE.BoxGeometry(w, h, d, parca, parca, parca);
  const konum = g.attributes.position;
  const ix = Math.max(0, w / 2 - r), iy = Math.max(0, h / 2 - r), iz = Math.max(0, d / 2 - r);
  const v = new THREE.Vector3(), c = new THREE.Vector3(), yon = new THREE.Vector3();
  for (let i = 0; i < konum.count; i++) {
    v.fromBufferAttribute(konum, i);
    c.set(
      Math.max(-ix, Math.min(ix, v.x)),
      Math.max(-iy, Math.min(iy, v.y)),
      Math.max(-iz, Math.min(iz, v.z)),
    );
    yon.copy(v).sub(c);
    const uzun = yon.length();
    if (uzun > 1e-6) {
      yon.multiplyScalar(r / uzun);
      konum.setXYZ(i, c.x + yon.x, c.y + yon.y, c.z + yon.z);
    }
  }
  g.computeVertexNormals();
  g.computeBoundingSphere();
  _geoOnbellek.set(anahtar, g);
  return g;
}
function kutu(w, h, d, renk, x = 0, y = 0, z = 0, emisyon) {
  const m = new THREE.Mesh(yuvarlakGeo(w, h, d), toonMalzeme(renk, emisyon));
  m.position.set(x, y, z);
  return m;
}
// Küre, silindir ve koni parçaları (Kornet'in bulut gövdesi, çivi başları, asa sarmalı, pelerin dili).
const _geoKure = new Map();
function kureGeo(r) {
  const k = r.toFixed(2);
  let g = _geoKure.get(k);
  if (!g) { g = new THREE.SphereGeometry(r, 16, 12); _geoKure.set(k, g); }
  return g;
}
function kure(r, renk, x = 0, y = 0, z = 0, emisyon) {
  const m = new THREE.Mesh(kureGeo(r), toonMalzeme(renk, emisyon));
  m.position.set(x, y, z);
  return m;
}
const _geoSilindir = new Map();
function silindirGeo(ust, alt, h, kenar = 12) {
  const k = `${ust.toFixed(2)}|${alt.toFixed(2)}|${h.toFixed(2)}|${kenar}`;
  let g = _geoSilindir.get(k);
  if (!g) { g = new THREE.CylinderGeometry(ust, alt, h, kenar); _geoSilindir.set(k, g); }
  return g;
}
function silindir(ust, alt, h, renk, x = 0, y = 0, z = 0, emisyon) {
  const m = new THREE.Mesh(silindirGeo(ust, alt, h), toonMalzeme(renk, emisyon));
  m.position.set(x, y, z);
  return m;
}
const _geoKoni = new Map();
function koniGeo(r, h, kenar = 8) {
  const k = `${r.toFixed(2)}|${h.toFixed(2)}|${kenar}`;
  let g = _geoKoni.get(k);
  if (!g) { g = new THREE.ConeGeometry(r, h, kenar); _geoKoni.set(k, g); }
  return g;
}
function koni(r, h, renk, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(koniGeo(r, h), toonMalzeme(renk));
  m.position.set(x, y, z);
  return m;
}
const _kristalGeo = new THREE.OctahedronGeometry(6, 0);
// Işık saçan malzeme (Kenit'in gözleri, Kornet'in kristali): toon gölgesi almaz, her zaman parlak kalır.
const _parlakOnbellek = new Map();
function parlakMalzeme(renk) {
  let m = _parlakOnbellek.get(renk);
  if (!m) { m = new THREE.MeshBasicMaterial({ color: new THREE.Color(renk) }); _parlakOnbellek.set(renk, m); }
  return m;
}
function parlak(w, h, d, renk, x = 0, y = 0, z = 0) {
  const g = new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(g, parlakMalzeme(renk));
  m.position.set(x, y, z);
  return m;
}
// Ters kabuk kontur: aynı geometri, arka yüz, hafif büyük ve koyu.
let _konturMalzeme = null;
function konturla(mesh, kalinlik = 1.06) {
  if (!_konturMalzeme) _konturMalzeme = new THREE.MeshBasicMaterial({ color: new THREE.Color("#1b1030"), side: THREE.BackSide });
  const k = new THREE.Mesh(mesh.geometry, _konturMalzeme);
  k.scale.setScalar(kalinlik);
  mesh.add(k);
  return mesh;
}
function grup(x = 0, y = 0, z = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  return g;
}
// Renk yardımcıları (açık omuzluk, koyu kol, açık taban)
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function karistir(a, b, t) {
  const x = hexRgb(a), y = hexRgb(b);
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
}
function acik(h, t = 0.45) { return karistir(h, "#ffffff", t); }
function koyu(h, t = 0.22) { return karistir(h, "#000000", t); }
// Top-level betiklerdeki sözlükler (game.js) pencere üzerinden okunur.
function renkler(charKey, costumeIdx) {
  // CHARACTERS ve COSTUMES game.js'te üst düzey const: window'un özelliği değiller ama modülden adıyla erişilir
  const C = (typeof CHARACTERS !== "undefined" && CHARACTERS) || {};
  const K = (typeof COSTUMES !== "undefined" && COSTUMES) || {};
  const c = C[charKey] || C.kinkin || { color: { skin: "#f4d6b5", legs: "#374151" } };
  const liste = K[charKey] || K.kinkin || [{ body: "#1d4ed8", hair: "#7a3e1d" }];
  const cos = liste[costumeIdx] || liste[0] || { body: "#1d4ed8", hair: "#7a3e1d" };
  return {
    c, cos, body: cos.body || "#1d4ed8", hair: cos.hair || "#7a3e1d",
    skin: (c.color && c.color.skin) || "#f4d6b5",
    legs: (c.color && c.color.legs) || "#374151",
    weapon: (c.color && c.color.weapon) || "#9ca3af",
  };
}

function kameraKur() {
  kamera = new THREE.OrthographicCamera(-52.5, 52.5, 52.5, -52.5, 0.1, 600);
  kamera.position.set(0, 110, 60); // yaklaşık 47° yukarıdan, önden (+Z)
  kamera.lookAt(0, 45, 0);
  kamera.updateProjectionMatrix();
}

function kur() {
  tuval = document.createElement("canvas");
  renderer = new THREE.WebGLRenderer({
    canvas: tuval, alpha: true, antialias: true, premultipliedAlpha: true, preserveDrawingBuffer: true,
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(1);
  renderer.setSize(16, 16, false);
  sahne = new THREE.Scene();
  sahne.add(new THREE.HemisphereLight(0xffffff, 0x6b7280, 2.0));
  const gunes = new THREE.DirectionalLight(0xffffff, 2.0);
  gunes.position.set(-80, 140, 90); // sol üstten yumuşak
  sahne.add(gunes);
  kameraKur();
  // WebGL gerçekten çalışıyor mu: küçük bir deneme çizimi
  renderer.render(sahne, kamera);
  if (!renderer.getContext()) throw new Error("WebGL yok");
}

// Kinkin'in enerji tabancası (gümüş gövde, camgöbeği parlayan çekirdek). Namlu yerel -Y yönünde;
// kol nişanda -Y'yi +Z'ye çevirdiği için silah ileri (baktığı yön) bakar. Boy yaklaşık baş genişliği.
function silahKur(charKey) {
  switch (charKey) {
    case "veryi": return veryiSilahKur();
    case "kornet": return kornetSilahKur();
    case "mark": return markSilahKur();
    case "kent": return kentSilahKur();
    case "ponko": return ponkoSilahKur();
    case "gul": return gulSilahKur();
    case "rani": return raniSilahKur();
    case "beti": return betiSilahKur();
    case "bot": return botSilahKur();
    default: return kinkinSilahKur();
  }
}
// Kinkin'in enerji tabancası (gümüş gövde, camgöbeği parlayan çekirdek). Namlu yerel -Y yönünde;
// kol nişanda -Y'yi +Z'ye çevirdiği için silah ileri (baktığı yön) bakar. Boy yaklaşık baş genişliği.
function kinkinSilahKur() {
  const g = grup();
  g.add(konturla(kutu(8, 28, 10, "#cfd8e3", 0, -15, 0)));        // gövde/namlu (baş kadar uzun)
  g.add(kutu(7, 10, 8, "#4b5563", 0, 1, -1));                    // kabza (el içinde)
  g.add(kutu(3, 20, 11, "#22d3ee", 0, -15, 0, "#22d3ee"));        // parlayan çekirdek şeridi
  g.add(kutu(2, 4, 12, "#e5e7eb", 0, -2, 0));                     // nişangâh
  g.add(kutu(9, 3, 5, "#94a3b8", 0, -28, 0));                     // namlu ağzı
  g.add(kutu(2.4, 2.4, 2.4, "#a5f3fc", 0, -27, 0, "#67e8f9"));
  const namlu = new THREE.Object3D();
  namlu.position.set(0, -31, 0);
  g.add(namlu);
  return { grup: g, namlu };
}
// Veryi'nin büyük savaş çekici: uzun tahta sap, çivili çelik baş. Dinlenirken ters (omuzda), nişanda öne bakar.
function veryiSilahKur() {
  const g = grup();
  const ahsap = "#6b3f1d", celik = "#9ca3af";
  g.add(konturla(kutu(5, 50, 5, ahsap, 0, -16, 0), 1.05));        // uzun sap
  g.add(kutu(6.5, 8, 6.5, "#4a2a10", 0, -1, 0));                  // tutamak sargısı
  // Çekiç başı ayrı bir grupta yana yatık: omzun üstünde, başın yanında okunur kalır.
  const bas = grup();
  bas.rotation.z = 0.3;
  bas.add(konturla(kutu(28, 14, 14, celik, 0, -38, 0), 1.05));    // çelik baş
  bas.add(kutu(30, 4, 15, "#c3ccd8", 0, -34, 0));                 // parlak üst şerit
  bas.add(kutu(9, 16, 16, "#6b7280", 0, -38, 0));                 // merkez göbek
  bas.add(kutu(10, 3, 7, "#b45309", 0, -38, 0));                  // bronz halka
  for (const x of [-11, -4, 4, 11]) {
    for (const z of [-7.5, 7.5]) bas.add(kutu(3, 3, 3, "#3f4652", x, -38, z)); // çiviler
    bas.add(kutu(3, 3, 3, "#3f4652", x, -45, 0));
  }
  g.add(bas);
  const namlu = new THREE.Object3D();
  namlu.position.set(0, -48, 0);
  g.add(namlu);
  // Dinlenirken sap dikey (baş omzun üstünde), nişanda öne-yukarı ~45°.
  return { grup: g, namlu, dinlen: Math.PI, nisan: -0.78 };
}
// Marli'nin küçük arbaleti: tahta gövde, yanlara açılan yay kolları, takılı ok.
function markSilahKur() {
  const g = grup();
  g.add(konturla(kutu(5, 30, 6, "#5a3825", 0, -12, 0), 1.05));    // gövde
  g.add(kutu(6, 9, 7, "#451a03", 0, -1, 0));                      // kabza
  g.add(kutu(24, 4, 4, "#7c4a1e", 0, -23, 0));                    // yay kirişi
  for (const yon of [-1, 1]) {
    const kol = kutu(4, 15, 4, "#7c4a1e", yon * 12, -17, 0);
    kol.rotation.z = yon * 0.55;
    g.add(kol);
  }
  g.add(kutu(1.6, 22, 1.6, "#e5e7eb", 0, -13, 2));                // tel
  g.add(kutu(2.6, 28, 2.6, "#92400e", 0, -26, 2));                // ok gövdesi
  g.add(kutu(4, 5, 4, "#9ca3af", 0, -41, 2));                     // ok ucu
  g.add(kutu(6, 4, 1.6, "#dc2626", 0, -12, 2));                   // tüy
  const namlu = new THREE.Object3D();
  namlu.position.set(0, -43, 2);
  g.add(namlu);
  return { grup: g, namlu };
}
// Kornet'in kristal asası: tahta sap, sarı sarmal bant, üç dişli uçta parlayan mor kristal.
function kornetSilahKur() {
  const g = grup();
  // Sap yerel +Y boyunca uzanır: dinlenirken dik, nişanda ~45° öne eğilir (silahDunya).
  // Asa yumruğun dış yanında tutulur (başın önüne gelip görünmez olmasın); kısa tahta boyun ele bağlar.
  const asa = grup(12, 0, 0);
  asa.add(konturla(kutu(4, 76, 4, "#8b5a2b", 0, 30, 0), 1.05));    // sap (el → yukarı)
  for (let i = 0; i < 9; i++) {
    const b = parlak(5, 2.4, 5, "#fbbf24", 0, 4 + i * 6.5, 0);     // sarı sarmal bant (düz parlak: ten rengine kaymaz)
    b.rotation.y = i * 0.8;
    asa.add(b);
  }
  asa.add(konturla(parlak(3.4, 16, 3.4, "#7e22ce", 0, 73, 0)));    // orta diş
  for (const yon of [-1, 1]) {
    const p = parlak(3.4, 13, 3.4, "#7e22ce", yon * 7, 70, 0);
    p.rotation.z = yon * 0.3;                                       // yan dişler
    asa.add(p);
  }
  const kristal = new THREE.Mesh(_kristalGeo, parlakMalzeme("#c026d3"));
  kristal.position.set(0, 84, 0);                                   // dişlerin üstünde, baştan yüksek
  kristal.scale.set(1, 1.5, 1);
  asa.add(kristal);
  asa.add(kutu(2, 2, 2, "#f0abfc", 0, 84, 0, "#e879f9"));          // iç parlama
  const namlu = new THREE.Object3D();
  namlu.position.set(0, 96, 0);
  asa.add(namlu);
  g.add(asa);
  g.add(kutu(9, 5, 5, "#8b5a2b", 7, 0, 0));                         // tahta boyun (yumruk → asa)
  g.add(kutu(5, 7, 6, "#fbbf24", 0, 0, 0));                         // kabza bandı (elin içinde)
  // Dünya açısı: dinlenirken dik (0), nişanda ~45° öne (0.78).
  return { grup: g, namlu, silahDunya: { dinlen: 0, nisan: 0.78 } };
}
// Kenit'in küçük hançeri: kısa kabza, balçak, sivri gümüş bıçak.
function kentSilahKur() {
  const g = grup();
  g.add(kutu(4.5, 11, 5, "#3b2a1a", 0, -2, 0));                   // kabza
  g.add(kutu(3, 3, 3, "#7c3aed", 0, -8, 0, "#7c3aed"));           // kabza taşı
  g.add(konturla(kutu(13, 3, 4, "#6b7280", 0, -10, 0), 1.05));    // balçak
  const bicak = koni(3, 21, "#d1d5db", 0, -22, 0);
  bicak.rotation.x = Math.PI;                                      // uç aşağı (sap yönü -Y)
  g.add(konturla(bicak, 1.05));
  g.add(kutu(1.6, 14, 1.6, "#f8fafc", 0, -20, 2));                // parlak sırt çizgisi
  const namlu = new THREE.Object3D();
  namlu.position.set(0, -33, 0);
  g.add(namlu);
  return { grup: g, namlu };
}
// Ponko'nun kovboy tabancası: koyu metal namlu, tahta kabza, altın tetik korkuluğu. Namlu yerel -Y'de.
function ponkoSilahKur() {
  const g = grup();
  const metal = "#374151", ahsap = "#7c2d12";
  g.add(konturla(kutu(6, 30, 7, metal, 0, -18, 0), 1.06));   // namlu/gövde
  g.add(kutu(9, 8, 9, "#4b5563", 0, -3, 0));                 // silindir (kovan)
  g.add(kutu(2.4, 7, 8.6, "#1f2937", 0, -3, 1.2));           // silindir yivi
  const kabza = kutu(6, 12, 6, ahsap, 0, 6, -3);             // tahta kabza (el içinde)
  kabza.rotation.x = -0.35;
  g.add(kabza);
  // Altın tetik korkuluğu: dört ince parçadan halka
  g.add(kutu(5, 1.8, 4.5, "#fbbf24", 0, -1, -5));            // üst kol
  g.add(kutu(1.8, 5, 4.5, "#fbbf24", -2.2, -4, -5));
  g.add(kutu(1.8, 5, 4.5, "#fbbf24", 2.2, -4, -5));
  g.add(kutu(5, 1.8, 4.5, "#fbbf24", 0, -7, -5));            // alt kol
  g.add(kutu(2, 2, 2, "#fbbf24", 0, -32, 0));                // altın arpacık
  const namlu = new THREE.Object3D();
  namlu.position.set(0, -36, 0);
  g.add(namlu);
  return { grup: g, namlu };
}
// Güllu'nun uzun yayı: elin önünde tek sürekli kavisli ahşap gövde (TubeGeometry), dik tutulur.
// Uçlar arasında ince açık kiriş, elin içinde sarı kabza bandı; ok yalnız ateşte görünür.
function gulSilahKur() {
  const g = grup();
  const ahsap = "#7c2d12";
  // Kavis elin içinden geçsin diye grup hafif geri alınır; yay yerel Y boyunca dikeydir.
  const yay = grup(0, 0, -6.6);
  const noktalar = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    noktalar.push(new THREE.Vector3(0, -24 + 76 * t, 8 * Math.sin(Math.PI * t))); // alt uç → üst uç, öne kavis
  }
  const egri = new THREE.CatmullRomCurve3(noktalar);
  const govde = new THREE.Mesh(new THREE.TubeGeometry(egri, 28, 2.2, 8, false), toonMalzeme(ahsap));
  yay.add(konturla(govde, 1.08));                                  // tek parça sürekli yay gövdesi
  yay.add(kutu(1.2, 76, 1.2, "#e5e7eb", 0, 14, 0));                // uçlar arası ince kiriş (arkada)
  yay.add(kutu(5, 11, 5, "#fbbf24", 0, 0, 6.6));                   // sarı kabza bandı (elin içinde)
  const ok = grup();
  ok.add(kutu(2, 2, 36, "#92400e", 0, 0, 14));                     // ok gövdesi (ileri)
  ok.add(kutu(4, 4, 5, "#9ca3af", 0, 0, 32));                      // ok ucu
  ok.add(kutu(6, 3, 1.4, "#dc2626", 0, 0, -4));                    // tüy
  ok.visible = false;
  yay.add(ok);
  const namlu = new THREE.Object3D();
  namlu.position.set(0, 0, 38);
  yay.add(namlu);
  g.add(yay);
  // Kol dönerken yay dünya ekseninde dikey kalsın: canlandir açıyı kola göre telafi eder.
  return { grup: g, namlu, ok, silahDunya: { dinlen: 0, nisan: 0 } };
}
// Rani'nin Y biçimli sapanı: tahta gövde, iki kol, lastik bantlar ve taş. Namlu yerel -Y'de.
function raniSilahKur() {
  const g = grup();
  const ahsap = "#7c2d12";
  g.add(konturla(kutu(4.5, 14, 4.5, ahsap, 0, -3, 0), 1.05));     // sap
  for (const yon of [-1, 1]) {
    const kol = kutu(3.6, 17, 3.6, ahsap, yon * 5, -17, 0);       // Y'nin iki kolu
    kol.rotation.z = yon * -0.42;
    g.add(kol);
    const bant = kutu(1.2, 14, 1.2, "#451a03", yon * 3, -21, 0);  // lastik bant
    bant.rotation.z = yon * 0.3;
    g.add(bant);
  }
  g.add(konturla(kure(5, "#fde68a", 0, -27, 0), 1.06));           // taş
  g.add(kure(2.2, "#fef3c7", -1.4, -29, 1.2));                    // parıltı
  const namlu = new THREE.Object3D();
  namlu.position.set(0, -33, 0);
  g.add(namlu);
  return { grup: g, namlu };
}
// Beri'nin sarmal lolipop asası: beyaz çubuk, disk şeker ve yüzünde beyaz sarmal şeritler.
function betiSilahKur(r) {
  const g = grup();
  const seker = (r && r.weapon) || "#ec4899";
  g.add(konturla(kutu(2.8, 26, 2.8, "#f8fafc", 0, -9, 0), 1.05)); // beyaz çubuk
  g.add(kutu(3.4, 4, 3.4, seker, 0, 3, 0));                       // tutamak halkası
  const disk = silindir(13, 13, 4, seker, 0, -28, 0);
  disk.rotation.z = Math.PI / 2;                                  // disk yüzü kameraya bakar
  g.add(konturla(disk, 1.06));
  for (let i = 0; i < 7; i++) {                                   // beyaz sarmal
    const rad = 2.5 + i * 1.5, aci = i * 1.25;
    const b = kutu(1.2, 2.4, 5, "#ffffff", -2.5, -28 + Math.cos(aci) * rad, Math.sin(aci) * rad);
    b.rotation.x = aci;
    g.add(b);
  }
  const namlu = new THREE.Object3D();
  namlu.position.set(0, -38, 0);
  g.add(namlu);
  return { grup: g, namlu };
}
// Fanatik'in kırmızı nunçakusu: elde bir çubuk, zincir ve sallanan ikinci çubuk. Namlu yerel -Y'de.
function fanatikSilahKur() {
  const g = grup();
  const cubuk = "#dc2626", ucu = "#7f1d1d";
  g.add(konturla(kutu(4.5, 17, 4.5, cubuk, 0, -9, 0), 1.06));      // eldeki çubuk
  g.add(kutu(5, 2.2, 5, ucu, 0, -1, 0));                           // üst halka
  g.add(kutu(5, 2.2, 5, ucu, 0, -17, 0));                          // alt halka
  for (let i = 0; i < 3; i++) g.add(kure(1.8, "#9ca3af", 0, -20 - i * 3, 0)); // zincir
  const alt = grup(0, -29, 0);                                     // sallanan ikinci çubuk
  alt.add(konturla(kutu(4.5, 16, 4.5, cubuk, 0, -8, 0), 1.06));
  alt.add(kutu(5, 2.2, 5, ucu, 0, 0, 0));
  alt.add(kutu(5, 2.2, 5, ucu, 0, -16, 0));
  g.add(alt);
  const namlu = new THREE.Object3D();
  namlu.position.set(0, -38, 0);
  g.add(namlu);
  return { grup: g, namlu };
}
// Silsen'in çiçekli bayrak asası: ince sap, damalı küçük bayrak, tepede papatya. Namlu yerel -Y'de.
function silsenSilahKur() {
  const g = grup();
  g.add(konturla(kutu(2.6, 46, 2.6, "#7c4a1e", 0, -18, 0), 1.05)); // ince sap
  g.add(kutu(3.6, 4, 3.6, "#fbbf24", 0, -40, 0));                  // altın bilezik
  const kare = 5, bx = 2.4, by = -31;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {        // damalı bayrak
    const renk = (i + j) % 2 === 0 ? "#111827" : "#fafafa";
    g.add(kutu(kare, kare, 1.4, renk, bx + i * kare, by + j * kare, 0));
  }
  g.add(kure(4.5, "#fdf2f8", 0, -47, 0));                          // papatya yaprakları
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2;
    g.add(kure(2.2, "#ffffff", Math.cos(a) * 5.2, -47 + Math.sin(a) * 5.2, 0));
  }
  g.add(kure(3, "#facc15", 0, -47, 1.8));                          // sarı göbek
  const namlu = new THREE.Object3D();
  namlu.position.set(0, -52, 0);
  g.add(namlu);
  return { grup: g, namlu };
}
// Serçin'in büyük çizgili tüyü: açık sap, yukarı genişleyen tüy gövdesi, koyu çizgiler. Namlu yerel -Y'de.
function sercinSilahKur(r) {
  const g = grup();
  const tuy = (r && r.weapon) || "#fef3c7";
  g.add(konturla(kutu(2.4, 40, 2.4, "#8a6a45", 0, -16, 0), 1.05)); // tüy sapı
  for (const [gen, boy, y] of [[6, 10, -20], [8.5, 12, -28], [8, 11, -36], [5, 8, -43]]) {
    g.add(konturla(kutu(gen, boy, 2.2, tuy, 0, y, 0), 1.05));      // tüy dilimleri
  }
  for (const [y, gen] of [[-24, 7], [-31, 9], [-38, 7]]) g.add(kutu(gen, 1.8, 2.6, "#78350f", 0, y, 1)); // çizgiler
  const namlu = new THREE.Object3D();
  namlu.position.set(0, -50, 0);
  g.add(namlu);
  return { grup: g, namlu };
}
// Mağaza silahları: avcının kendi silahının yerine sağ elde görünür; bazuka omuzda taşınır. Namlu hep yerel -Y'de.
function baloncukSilahKur() {
  const g = grup();
  g.add(konturla(kutu(9, 20, 11, "#2563eb", 0, -10, 0), 1.06));    // iri oyuncak gövde
  g.add(kutu(8, 11, 9, "#1e3a8a", 0, 1, -1));                      // kabza
  g.add(kutu(3, 16, 12, "#93c5fd", 0, -10, 0));                    // açık şerit
  const agiz = silindir(7.5, 7.5, 5, "#93c5fd", 0, -21, 0);        // baloncuk ağzı halkası
  agiz.rotation.x = Math.PI / 2;
  g.add(konturla(agiz, 1.05));
  g.add(kure(3.2, "#bfdbfe", 0, -26, 0));
  g.add(kure(2.2, "#dbeafe", 3.6, -29, 2));
  const namlu = new THREE.Object3D();
  namlu.position.set(0, -31, 0);
  g.add(namlu);
  return { grup: g, namlu };
}
function lazerSilahKur() {
  const g = grup();
  g.add(konturla(kutu(5, 25, 6, "#dc2626", 0, -12, 0), 1.05));     // ince uzun gövde
  g.add(kutu(6, 10, 7, "#7f1d1d", 0, 1, -1));                      // kabza
  g.add(kutu(2.4, 18, 2.4, "#fca5a5", 0, -12, 0));                 // parlak çizgi
  g.add(kutu(6, 3, 7, "#fecaca", 0, -24, 0));                      // namlu ucu
  const namlu = new THREE.Object3D();
  namlu.position.set(0, -27, 0);
  g.add(namlu);
  return { grup: g, namlu };
}
function yesilSilahKur() {
  const g = grup();
  g.add(konturla(kutu(11, 9, 9, "#166534", 0, -2, 0), 1.05));      // gövde
  g.add(kutu(6, 9, 6, "#111827", 0, 5, -1));                       // siyah kabza
  for (const x of [-3.2, 3.2]) g.add(konturla(silindir(2.6, 2.6, 20, "#16a34a", x, -14, 0), 1.05)); // çift namlu
  g.add(kutu(9, 2.4, 8, "#4ade80", 0, -8, 0));                     // parlak bant
  const namlu = new THREE.Object3D();
  namlu.position.set(0, -26, 0);
  g.add(namlu);
  return { grup: g, namlu };
}
function pompaliSilahKur() {
  const g = grup();
  g.add(konturla(kutu(10, 13, 9, "#7dd3fc", 0, -6, 0), 1.06));     // açık mavi kısa gövde
  g.add(kutu(7, 9, 8, "#0c4a6e", 0, 5, -1));                       // kabza
  g.add(konturla(kutu(5, 22, 5, "#ea580c", 0, -18, 0), 1.05));     // turuncu namlu
  g.add(kutu(9, 3, 8, "#bae6fd", 0, -11, 0));                      // pompa kolu
  const namlu = new THREE.Object3D();
  namlu.position.set(0, -30, 0);
  g.add(namlu);
  return { grup: g, namlu };
}
function bazukaSilahKur() {
  const ic = grup();
  ic.add(konturla(silindir(6.5, 8, 36, "#111827", 0, -12, 0), 1.04)); // kalın boru
  for (let i = 0; i < 4; i++) ic.add(silindir(7.4, 7.4, 2.6, "#fafafa", 0, -2 - i * 8, 0)); // beyaz çizgiler
  ic.add(kutu(6, 10, 7, "#111827", 0, 6, -5));                     // omuz kabzası
  ic.add(kutu(5, 6, 6, "#334155", 0, -1, 6));                      // alt tutamak
  ic.add(silindir(3, 8, 4, "#0f172a", 0, -31, 0));                 // namlu ağzı
  const namlu = new THREE.Object3D();
  namlu.position.set(0, -33, 0);
  ic.add(namlu);
  const g = grup();
  g.add(ic);
  g.position.set(0, 14, 0); // nişanda omuza yaslanır
  return { grup: g, namlu, dinlen: -1.35, nisan: 0, omuzda: true };
}
function silahDukkanKur(gunKey) {
  switch (gunKey) {
    case "baloncuk": return baloncukSilahKur();
    case "lazer": return lazerSilahKur();
    case "yesil": return yesilSilahKur();
    case "pompali": return pompaliSilahKur();
    case "bazuka": return bazukaSilahKur();
    default: return null;
  }
}
// Bot'un küçük blaster'ı: gövde, kabza ve camgöbeği uç. Namlu yerel -Y'de.
function botSilahKur() {
  const g = grup();
  g.add(konturla(kutu(6, 20, 8, "#334155", 0, -10, 0), 1.08));
  g.add(kutu(5, 8, 6, "#1e293b", 0, 1, -1));
  g.add(kutu(3, 3, 3, "#67e8f9", 0, -20, 0, "#67e8f9"));
  const namlu = new THREE.Object3D();
  namlu.position.set(0, -22, 0);
  g.add(namlu);
  return { grup: g, namlu };
}

// Karaktere özel parçalar: yalnız saç/başlık, kıyafet ve silah burada; gövde, yüz, eller ve bacaklar ortak.
const KARAKTER_3D = {
  kinkin: {
    govde(govde, r) {
      const omuzRenk = acik(r.body, 0.7);
      govde.add(kutu(15, 16, 1.8, acik(r.body, 0.35), 0, 15, 8.4)); // tulum göğsü
      for (const x of [-13, 13]) {                                   // açık omuzluklar
        govde.add(kutu(11, 8, 18, omuzRenk, x, 24, 0));
        govde.add(kutu(12, 2, 19, acik(omuzRenk, 0.25), x, 28, 0));
      }
      govde.add(kutu(28, 4.5, 17, "#6b3f1d", 0, 1, 0));   // kahverengi kemer
      govde.add(kutu(5, 3, 1.8, "#fbbf24", 0, 1, 8.7));   // altın toka
      govde.add(kutu(9, 11, 7, "#7c4a1e", 12, 3, -8));    // yan çanta
      govde.add(kutu(10, 2.5, 8, "#5c3a14", 12, 9, -8));  // çanta kapağı
    },
    sac(bas, r) {
      const sac = r.hair;
      bas.add(konturla(kutu(42, 13, 40, sac, 0, 37, 0)));  // saç tepesi
      bas.add(kutu(7, 17, 38, sac, -20, 29, 0));           // yan saçlar
      bas.add(kutu(7, 17, 38, sac, 20, 29, 0));
      // Dağınık saç tutamları: birkaç eğik kutu (düz tek kutu değil)
      const tutamlar = [[-14, -3, 0.35, 12, 11, 12], [-3, 3, -0.4, 14, 13, 14], [9, -4, 0.45, 12, 10, 12],
        [17, 6, -0.25, 8, 9, 10], [-18, 7, 0.2, 8, 9, 10], [4, 9, 0.15, 10, 10, 11]];
      for (const [x, z, egim, w, h, d] of tutamlar) {
        const t = kutu(w, h, d, sac, x, 43 + h * 0.25, z);
        t.rotation.z = egim; t.rotation.x = z * 0.012;
        bas.add(t);
      }
      // Alnın üstüne düşen kahküller
      for (const [x, y, egim, w, h] of [[-14, 33, -0.3, 9, 10], [-5, 31, 0.2, 10, 12], [4, 32, -0.25, 9, 11], [13, 34, 0.35, 8, 9]]) {
        const k = kutu(w, h, 5, sac, x, y, 19.6);
        k.rotation.z = egim;
        bas.add(k);
      }
    },
    basAksesuar(bas, r, costumeIdx) {
      if (costumeIdx === 1) { // Pembe Prenses: küçük altın taç
        bas.add(konturla(kutu(15, 4, 15, "#fbbf24", 0, 45, 0), 1.05));
        for (const x of [-5, 0, 5]) bas.add(kutu(3, 6, 3, "#fbbf24", x, 48.5, 0));
      }
    },
    silah() { return kinkinSilahKur(); },
  },
  veryi: {
    govde(govde, r, costumeIdx) {
      const yelek = koyu(r.body, 0.28), yaka = acik(r.body, 0.55);
      for (const x of [-8, 8]) govde.add(kutu(10, 24, 2, yelek, x, 14, 8.2)); // yelek ön panelleri
      govde.add(kutu(20, 6, 2.2, yaka, 0, 26, 8.4));                          // yaka
      govde.add(kutu(3, 3, 1.2, "#d4a017", 0, 18, 9.2));                      // düğme
      govde.add(kutu(3, 3, 1.2, "#d4a017", 0, 12, 9.2));
      govde.add(kutu(28, 4.5, 17, "#3f2712", 0, 1, 0));                       // kalın deri kemer
      govde.add(kutu(6, 4, 1.8, "#cbd5e1", 0, 1, 8.7));                       // gümüş toka
      if (costumeIdx === 1) {                                                 // Asker: göğüs cepleri
        for (const x of [-8, 8]) { govde.add(kutu(7, 7, 1.6, koyu(r.body, 0.3), x, 18, 8.5)); govde.add(kutu(7, 2, 1.8, "#d4a017", x, 21, 8.7)); }
      }
      if (costumeIdx === 2) govde.add(kutu(5, 5, 1.4, "#fbbf24", 8, 20, 8.8)); // Bronz Şampiyon madalyası
    },
    sac(bas, r) {
      const sac = r.hair;
      bas.add(konturla(kutu(42, 12, 40, sac, 0, 37, 0)));  // kısa saç tepesi
      bas.add(kutu(7, 14, 38, sac, -20, 31, 0));           // sol yan kısa
      const percem = kutu(9, 21, 36, sac, 17, 30, 1);      // yana taranmış sağ tutam
      percem.rotation.z = 0.2;
      bas.add(percem);
      for (const [x, y, egim, w, h] of [[-13, 34, -0.4, 11, 9], [-2, 33, 0.16, 12, 10], [8, 34, -0.22, 9, 8]]) {
        const k = kutu(w, h, 5, sac, x, y, 19.8);          // yana yatık kahküller
        k.rotation.z = egim;
        bas.add(k);
      }
    },
    basAksesuar(bas, r, costumeIdx) {
      if (costumeIdx === 1) { // Asker: küçük asker şapkası
        bas.add(konturla(kutu(30, 6, 30, "#143d14", 0, 45, 0), 1.05));
        bas.add(kutu(34, 3, 20, "#0f2d0f", 0, 41, 15));  // siperlik
        bas.add(kutu(6, 4, 6, "#d4a017", 0, 44, 16));    // ön arma
      }
      if (costumeIdx === 2) { // Bronz Şampiyon: altın çelenk
        for (const yon of [-1, 1]) {
          const c = kutu(8, 4, 8, "#fbbf24", yon * 17, 43, 4);
          c.rotation.z = yon * 0.4;
          bas.add(c);
        }
      }
    },
    silah() { return veryiSilahKur(); },
  },
};

// Ortak yüz (gözler, gülümseme, yanaklar). KARAKTER_3D.yuz === false olanlar kendi yüzünü kurar.
function yuzCiz(bas, r, gozler, gozRenk = "#111827") {
  const sac = r.hair;
  for (const yon of [-1, 1]) {
    bas.add(kutu(10, 12, 2.5, "#ffffff", yon * 9, 23, 19.2));           // beyaz göz
    const goz = kutu(5.4, 7, 2, gozRenk, yon * 9, 22.5, 20.4);          // bebek
    bas.add(goz); gozler.push(goz);
    bas.add(kutu(2.2, 2.2, 1, "#ffffff", yon * 9 - 1.8, 25.6, 21.2));   // parlak nokta
    bas.add(kutu(6, 1.8, 1.6, sac, yon * 9, 31, 19.8));                 // küçük kaş
  }
  bas.add(kutu(6, 1.6, 1.4, "#7c2d12", 0, 15.5, 19.7));                 // gülümseme ortası
  for (const yon of [-1, 1]) {
    const dudak = kutu(3.5, 1.5, 1.2, "#7c2d12", yon * 4.2, 16.3, 19.6);
    dudak.rotation.z = yon * 0.5;
    bas.add(dudak);
  }
  for (const yon of [-1, 1]) bas.add(kutu(6, 3.5, 1.4, "#f9a8d4", yon * 14, 16, 19.2)); // pembe yanaklar
}
// Ortak bacak: üst parça, bot ve taban. K.bot === false ise ayak da giysi renginde.
function bacakCiz(g, renk, K, r) {
  const boy = K.bacakBoy || 26;
  g.add(kutu(9, boy, 10, renk, 0, -boy / 2, 0));
  if (K.bot === false) {
    g.add(kutu(10, 6, 12, K.ayakRenk ? K.ayakRenk(r || {}) : renk, 0, -boy - 1, 1)); // yalınayak
  } else {
    g.add(kutu(10, 8, 13, K.botRenk || "#374151", 0, -boy - 1, 1));   // bot (varsayılan koyu gri)
    g.add(kutu(11, 3, 14, K.tabanRenk || "#9ca3af", 0, -boy - 4.5, 1)); // açık taban
  }
}

// (karakter, kostüm) iskeleti: kok → kalca → govde → bas, govde → omuz → kol → el, kalca → bacak.
// Ortak gövde/baş/kol/bacak burada kurulur; karaktere özel saç, başlık, kıyafet ve silah KARAKTER_3D'den gelir.
function iskelet(charKey, costumeIdx, gunKey) {
  if (charKey === "bot") return botIskelet();
  const r = renkler(charKey, costumeIdx);
  const K = KARAKTER_3D[charKey] || KARAKTER_3D.kinkin;
  const kolRenk = K.kolRenk ? K.kolRenk(r) : koyu(r.body, 0.2);   // kollar biraz koyu
  const elRenk = K.elRenk ? K.elRenk(r) : r.skin;
  const govdeRenk = K.govdeRenk ? K.govdeRenk(r) : r.body;
  const bacakRenk = K.bacakRenk ? K.bacakRenk(r) : r.body;
  const kalcaY = K.kalcaY || 32;
  const kok = grup();
  const kalca = grup(0, kalcaY, 0); kok.add(kalca);
  const govde = grup(); kalca.add(govde);
  if (K.govdeTemel !== false) govde.add(konturla(kutu(26, 28, 16, govdeRenk, 0, 14, 0)));
  if (K.govde) K.govde(govde, r, costumeIdx);

  const bas = grup(0, 28, 0); govde.add(bas);
  const basRenk = K.basRenk ? K.basRenk(r) : r.skin;
  bas.add(konturla(kutu(40, 40, 38, basRenk, 0, 20, 0)));
  if (K.kulak !== false) for (const yon of [-1, 1]) bas.add(kutu(6, 11, 9, basRenk, yon * 21, 20, 0)); // kulaklar
  const gozler = [];
  if (K.yuz !== false) yuzCiz(bas, r, gozler, K.gozRenk ? K.gozRenk(r) : "#111827");
  if (K.yuzEk) K.yuzEk(bas, r, gozler, costumeIdx);
  if (K.sac) K.sac(bas, r, costumeIdx);
  if (K.basAksesuar) K.basAksesuar(bas, r, costumeIdx);

  const omuzSag = grup(15, 24, 0); govde.add(omuzSag);
  const kolSag = grup(); omuzSag.add(kolSag);
  kolSag.add(konturla(kutu(8, 21, 8, kolRenk, 0, -10, 0), 1.05));
  const elSag = grup(0, -20, 0); kolSag.add(elSag);
  elSag.add(kutu(9, 9, 9, elRenk, 0, -2, 0)); // sağ yumruk (silah burada)
  const silah = (gunKey && silahDukkanKur(gunKey)) || (K.silah ? K.silah(r, costumeIdx) : silahKur(charKey));
  elSag.add(silah.grup);

  const omuzSol = grup(-15, 24, 0); govde.add(omuzSol);
  const kolSol = grup(); omuzSol.add(kolSol);
  kolSol.add(konturla(kutu(8, 21, 8, kolRenk, 0, -10, 0), 1.05));
  const elSol = grup(0, -20, 0); kolSol.add(elSol);
  elSol.add(kutu(9, 9, 9, elRenk, 0, -2, 0)); // öbür yumruk

  const bacakSag = grup(7, 0, 0); kalca.add(bacakSag); bacakCiz(bacakSag, bacakRenk, K, r);
  const bacakSol = grup(-7, 0, 0); kalca.add(bacakSol); bacakCiz(bacakSol, bacakRenk, K, r);

  return {
    kok, kalca, govde, bas, gozler, namlu: silah.namlu,
    omuzSag, kolSag, elSag, omuzSol, kolSol, elSol, bacakSag, bacakSol,
    silahGrup: silah.grup,
    silahOk: silah.ok || null,
    silahAci: silah.dinlen !== undefined ? { dinlen: silah.dinlen, nisan: silah.nisan || 0 } : null,
    silahDunya: silah.silahDunya || null, // dünya ekseninde istenen silah açısı (kol dönüşünü telafi eder)
  };
}

// Marli, Kenit ve Kornet'in kendi parçaları (ortak iskelete eklenir).
Object.assign(KARAKTER_3D, {
  mark: {
    bacakRenk: (r) => r.legs,
    govde(govde, r) {
      govde.add(kutu(15, 10, 1.8, acik(r.body, 0.4), 0, 21, 8.4));            // açık yaka
      govde.add(kutu(26, 4.5, 17, "#4a3521", 0, 1, 0));                        // kahverengi kemer
      govde.add(kutu(5, 3, 1.8, "#fbbf24", 0, 1, 8.7));                        // altın toka
      govde.add(kutu(8, 6, 1.4, koyu(r.body, 0.25), -7, 15, 8.6));             // göğüs cebi
      for (const x of [-11, 11]) govde.add(kutu(3, 26, 1.4, "#5c3a14", x, 14, 8.5)); // çanta askıları
      // Sırtta kahverengi çanta ve üstünde rulo
      govde.add(konturla(kutu(24, 24, 12, "#7c4a1e", 0, 14, -12), 1.04));
      govde.add(kutu(22, 8, 12, "#5c3a14", 0, 25, -12));
      for (const x of [-7, 7]) govde.add(kutu(3, 6, 1.6, "#d4a017", x, 8, -18.6));
      const rulo = silindir(5.5, 5.5, 26, "#c8a97e", 0, 30, -13);
      rulo.rotation.z = Math.PI / 2;
      govde.add(rulo);
      const bag = silindir(1.7, 1.7, 27, "#8a6a45", 0, 30, -13);
      bag.rotation.z = Math.PI / 2;
      govde.add(bag);
    },
    sac(bas, r) {
      const sac = r.hair;
      bas.add(konturla(kutu(43, 13, 41, sac, 0, 37, 0)));  // tepe
      bas.add(kutu(7, 26, 40, sac, -21, 26, 0));           // uzun yan saçlar
      bas.add(kutu(7, 26, 40, sac, 21, 26, 0));
      bas.add(kutu(38, 26, 8, sac, 0, 20, -19));           // arkaya inen saç
      const kuyruk = kutu(10, 30, 9, sac, 0, 14, -24);     // at kuyruğu
      kuyruk.rotation.x = -0.15;
      bas.add(kuyruk);
      bas.add(kutu(12, 4, 10, "#b45309", 0, 28, -24));     // saç bağı
      for (const [x, y, w, h] of [[-13, 33, 10, 10], [-2, 32, 11, 11], [8, 33, 9, 9]]) {
        const k = kutu(w, h, 5, sac, x, y, 19.8);          // kahküller
        bas.add(k);
      }
    },
    silah() { return markSilahKur(); },
  },
  kent: {
    basRenk: () => "#0b0b12",
    kulak: false,
    yuz: false,
    bot: false,
    bacakBoy: 20,
    bacakRenk: (r) => r.body,
    govde(govde, r) {
      const pel = r.body, koy = koyu(r.body, 0.4);
      govde.add(konturla(kutu(34, 12, 22, pel, 0, 22, 0), 1.04));  // omuz pelerini
      govde.add(kutu(36, 16, 22, pel, 0, 8, 0));
      govde.add(kutu(38, 20, 24, pel, 0, -8, 0));
      govde.add(kutu(3, 30, 3, acik(r.body, 0.16), 0, 10, 11.5));  // ön dikiş
      // Sivri dilimli etek ucu (aşağı bakan koniler)
      for (const [x, z] of [[-15, 10], [-5, 11], [5, 11], [15, 10], [-19, 0], [19, 0]]) {
        const p = koni(3.4, 10, koy, x, -20, z);
        p.rotation.x = Math.PI;
        govde.add(p);
      }
    },
    yuzEk(bas) {
      bas.add(kutu(34, 32, 1.2, "#05050a", 0, 20, 19.6));          // gölgedeki yüz
      for (const yon of [-1, 1]) {
        bas.add(kutu(11, 4, 1.4, "#1b1030", yon * 9, 19, 20.4));   // koyu göz çukuru
        bas.add(parlak(11, 5, 0.6, "#5b1010", yon * 9, 23.5, 20.2)); // kızıl hale
        bas.add(parlak(6, 3.2, 1.6, "#ff2b2b", yon * 9, 23.5, 20.7)); // parlayan kırmızı göz
      }
    },
    sac(bas, r) {
      const pel = r.body, trim = koyu(r.body, 0.45);
      bas.add(konturla(kutu(46, 14, 44, pel, 0, 39, -3), 1.05));    // kapüşon tepesi
      for (const yon of [-1, 1]) bas.add(konturla(kutu(11, 34, 44, pel, yon * 21, 24, -3), 1.05)); // yanlar
      bas.add(konturla(kutu(42, 34, 10, pel, 0, 24, -16), 1.05));   // arka
      bas.add(kutu(44, 5, 5, trim, 0, 39, 17));                     // yüz açıklığı çerçevesi
      for (const yon of [-1, 1]) bas.add(kutu(5, 30, 5, trim, yon * 20, 24, 17));
      bas.add(kutu(30, 4, 5, trim, 0, 7, 17));
      bas.add(koni(6, 14, pel, 0, 48, -6));                         // kapüşonun sivri ucu
    },
    silah() { return kentSilahKur(); },
  },
  kornet: {
    basRenk: () => "#f8fafc",
    kulak: false,
    yuz: false,
    govdeTemel: false,
    bot: false,
    bacakBoy: 16,
    kalcaY: 20,
    bacakRenk: (r) => r.body,
    elRenk: (r) => r.body,
    kolRenk: (r) => r.body,
    govde(govde, r) {
      const b = r.body;
      // İri ve yuvarlak bulut gövde: baş kadar geniş büyük küreler kümesi, altında kısa bacaklar görünür.
      const kureler = [
        [18, 15, 0, 0, 1], [14, 26, 0, 0, 0.95], [12, 15, 10, 0, 0.92],
        [12, 15, -10, 0, 0.92], [12, 6, 0, 7, 0.88], [11, 22, 0, -9, 0.9],
      ];
      for (const [rad, y, x, z, oran] of kureler) {
        const m = kure(rad, oran < 1 ? koyu(b, 0.12) : b, x, y, z);
        govde.add(konturla(m, 1.06));
      }
      for (const yon of [-1, 1]) govde.add(konturla(kure(11, acik(b, 0.1), yon * 13, 16, 2), 1.06)); // yan kabarıklıklar
    },
    yuzEk(bas) {
      for (const yon of [-1, 1]) bas.add(kutu(11, 13, 2, "#0b0b12", yon * 9, 24, 19.5)); // siyah göz oyukları
      for (const yon of [-1, 1]) bas.add(kutu(2, 2, 1, "#a78bfa", yon * 11, 27, 20.6)); // dostça parıltı
      const burun = koni(3, 5, "#0b0b12", 0, 16, 19.8);             // burun oyuğu
      burun.rotation.x = Math.PI;
      bas.add(burun);
      bas.add(kutu(24, 9, 1.6, "#0b0b12", 0, 11, 19.5));            // dişli gülüş
      for (const x of [-8, -3, 3, 8]) bas.add(kutu(1.6, 9, 1.8, "#f8fafc", x, 11, 19.9));
    },
    sac(bas, r) {
      const h = r.hair;
      for (const [x, z, rad] of [[-12, -3, 6], [0, 1, 7], [12, -2, 6], [-6, 5, 5], [6, 6, 5]]) {
        bas.add(konturla(kure(rad, h, x, 44, z), 1.06));            // başın üstü kabarık tüyler
      }
    },
    silah() { return kornetSilahKur(); },
  },
  // ---- 3D-2b: Ponko, Güllu, Rani, Beri ----
  ponko: {
    bacakRenk: (r) => r.legs,
    botRenk: "#4a2a10", tabanRenk: "#6b3f1d", // kahverengi kovboy botu
    govde(govde, r) {
      govde.add(kutu(16, 14, 1.8, acik(r.body, 0.35), 0, 16, 8.4)); // gömlek göğsü
      govde.add(kutu(20, 5, 2, koyu(r.body, 0.3), 0, 26, 8.3));      // yaka
      for (const x of [-7, 7]) govde.add(kutu(6, 6, 1.6, koyu(r.body, 0.2), x, 18, 8.5)); // göğüs cepleri
      govde.add(kutu(28, 5, 17, "#5c3a14", 0, 1, 0));                // deri kemer
      govde.add(kutu(7, 5, 1.9, "#fbbf24", 0, 1, 8.7));              // altın toka
    },
    sac(bas, r) {
      const sac = r.hair;
      bas.add(konturla(kutu(42, 10, 40, sac, 0, 36, 0)));            // şapka altı kısa saç
      for (const yon of [-1, 1]) bas.add(kutu(6, 12, 36, sac, yon * 20, 30, 0)); // yan saç
      for (const [x, y, w, h] of [[-12, 33, 9, 8], [-2, 32, 10, 9], [9, 33, 8, 8]]) {
        bas.add(kutu(w, h, 5, sac, x, y, 19.6));                     // kahküller
      }
    },
    basAksesuar(bas, r, costumeIdx) {
      const altin = costumeIdx === 2;
      const kenar = altin ? "#f59e0b" : "#5c3a14";
      const tepe = altin ? "#fbbf24" : "#7c2d12";
      const bant = altin ? "#7c2d12" : "#fbbf24";
      bas.add(konturla(silindir(35, 37, 4, kenar, 0, 41, 0), 1.04));  // geniş şapka kenarı
      bas.add(konturla(silindir(15, 18, 15, tepe, 0, 50, 0), 1.05));  // şapka tepesi
      bas.add(silindir(18, 18, 3.5, bant, 0, 45, 0));                 // şapka bandı
    },
    silah() { return ponkoSilahKur(); },
  },
  gul: {
    bacakRenk: (r) => r.legs,
    botRenk: "#4a2a10", tabanRenk: "#6b3f1d",
    govde(govde, r) {
      govde.add(kutu(27, 5, 17, koyu(r.body, 0.18), 0, 1, 0));       // tunik eteği
      govde.add(kutu(15, 12, 1.8, acik(r.body, 0.4), 0, 18, 8.4));   // göğüs
      govde.add(kutu(22, 4, 2, acik(r.body, 0.55), 0, 27, 8.3));     // yaka
    },
    sac(bas, r) {
      const sac = r.hair;
      bas.add(konturla(kutu(44, 12, 42, sac, 0, 37, 0)));            // tepe
      for (const yon of [-1, 1]) bas.add(konturla(kutu(8, 30, 42, sac, yon * 21, 25, 0), 1.04)); // omuza küt yanlar
      bas.add(konturla(kutu(40, 24, 9, sac, 0, 22, -18), 1.04));     // arka
      for (const [x, y, w, h] of [[-14, 33, 11, 10], [-3, 32, 12, 11], [8, 33, 10, 10], [16, 34, 7, 9]]) {
        bas.add(kutu(w, h, 5, sac, x, y, 19.8));                     // düz kahküller
      }
    },
    basAksesuar(bas) {
      // Gerçek taç: geniş altın halka, beş sivri diş, kırmızı-pembe taşlar; saçın üstünde yükselir.
      bas.add(konturla(silindir(18, 19, 5, "#fbbf24", 0, 44, 0), 1.05)); // altın halka
      bas.add(silindir(19, 19, 2, "#fde68a", 0, 46.5, 0));              // parlak halka üstü
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const x = Math.sin(a) * 15, z = Math.cos(a) * 15;
        const dik = koni(3.4, 14, "#fbbf24", x, 54, z);                  // beş sivri diş
        bas.add(konturla(dik, 1.05));
        bas.add(kure(1.8, i % 2 ? "#f472b6" : "#ef4444", x, 47.5, z * 1.05)); // diş dibinde taş
      }
      bas.add(kure(2.6, "#ef4444", 0, 47.5, 18));                       // ön mücevher
      bas.add(kure(1.4, "#fecaca", 0, 48.4, 19.4));                     // mücevher parıltısı
    },
    silah() { return gulSilahKur(); },
  },
  rani: {
    bacakRenk: (r) => r.legs,
    botRenk: "#f8fafc", tabanRenk: "#cbd5e1", // beyaz spor ayakkabı
    govde(govde, r) {
      govde.add(kutu(16, 14, 1.8, acik(r.body, 0.45), 0, 16, 8.4));  // üst göğüs
      govde.add(kutu(22, 4, 2, acik(r.body, 0.6), 0, 27, 8.3));      // yaka
      govde.add(kutu(26, 4, 17, koyu(r.body, 0.2), 0, 1, 0));        // bel bandı
      govde.add(kutu(5, 5, 1.4, "#fde047", 0, 17, 8.7));             // parıltı
    },
    sac(bas, r) {
      const sac = r.hair;
      bas.add(konturla(kutu(44, 12, 42, sac, 0, 37, 0)));            // tepe
      for (const yon of [-1, 1]) {
        bas.add(konturla(kure(12, sac, yon * 24, 37, -2), 1.06));    // iri yandaki topuzlar (başı belirgin genişletir)
        bas.add(kure(4.6, acik(sac, 0.25), yon * 25, 42, 5));        // topuz parıltısı
        bas.add(kutu(8, 18, 38, sac, yon * 21, 29, 0));              // yan saç
      }
      bas.add(konturla(kutu(40, 22, 9, sac, 0, 22, -18), 1.04));     // arka saç
      for (const [x, y, w, h] of [[-13, 33, 9, 9], [-3, 32, 11, 10], [7, 33, 9, 9]]) {
        bas.add(kutu(w, h, 5, sac, x, y, 19.8));                     // kahküller
      }
    },
    silah() { return raniSilahKur(); },
  },
  beti: {
    bacakRenk: (r) => r.legs, // mor pantolon
    botRenk: "#4c1d95", tabanRenk: "#7c3aed",
    govde(govde, r) {
      govde.add(kutu(16, 14, 1.8, acik(r.body, 0.4), 0, 16, 8.4));   // üst
      govde.add(kutu(22, 4, 2, acik(r.body, 0.6), 0, 27, 8.3));      // yaka
      const kalpRenk = "#f472b6";                                    // göğüste küçük kalp
      for (const yon of [-1, 1]) {
        const k = kutu(5, 5, 1.4, kalpRenk, yon * 2.6, 18, 8.7);
        k.rotation.z = Math.PI / 4;
        govde.add(k);
      }
      const uc = koni(3.2, 5, kalpRenk, 0, 14.5, 8.7);
      uc.rotation.x = Math.PI;
      govde.add(uc);
    },
    sac(bas, r) {
      const sac = r.hair;
      bas.add(konturla(kutu(44, 12, 42, sac, 0, 37, 0)));            // tepe
      for (const yon of [-1, 1]) {
        bas.add(konturla(kutu(8, 26, 40, sac, yon * 21, 26, 0), 1.04)); // uzun yan saç
        for (let i = 0; i < 4; i++) {                                // dalgalı tutamlar
          const t = kutu(9, 8, 10, i % 2 ? koyu(sac, 0.08) : sac, yon * (21 + (i % 2 ? 2 : -2)), 14 - i * 6, -6);
          t.rotation.z = yon * (i % 2 ? 0.25 : -0.2);
          bas.add(t);
        }
      }
      bas.add(konturla(kutu(40, 26, 9, sac, 0, 20, -18), 1.04));     // arka saç
      for (const [x, y, w, h] of [[-13, 33, 10, 10], [-2, 32, 11, 11], [8, 33, 9, 10]]) {
        bas.add(kutu(w, h, 5, sac, x, y, 19.8));                     // kahküller
      }
      // Lolipop gibi sarmal çizgili bere (saç rengi + beyaz)
      const bere = grup(0, 44, 0);
      bere.rotation.z = -0.16;
      bere.add(konturla(silindir(17, 18, 7, sac, 0, 0, 0), 1.04));
      for (let i = 0; i < 8; i++) {
        const b = kutu(3, 1.6, 32, i % 2 ? "#ffffff" : acik(sac, 0.15), 0, 3.6, 0);
        b.rotation.y = i * Math.PI / 8;
        bere.add(b);
      }
      bere.add(kure(3, sac, 0, 5, 0));                               // tepedeki düğme
      bas.add(bere);
    },
    silah(r) { return betiSilahKur(r); },
  },
  // ---- 3D-2c: Fanatik, Silsen, Serçin ----
  fanatik: {
    bacakRenk: (r) => r.body,
    bot: false,
    ayakRenk: (r) => r.skin, // yalınayak
    govde(govde, r) {
      const gi = r.body;
      for (const yon of [-1, 1]) {                                    // karate gi yakası (V)
        const p = kutu(6, 26, 2.2, acik(r.body, 0.14), yon * 6, 16, 8.4);
        p.rotation.z = yon * 0.22;
        govde.add(p);
      }
      govde.add(kutu(20, 3, 2, koyu(gi, 0.18), 0, 27, 8.3));          // yaka bandı
      govde.add(kutu(28, 5, 17, "#0a0a0a", 0, 1, 0));                 // siyah kuşak
      const dugum = kutu(7, 7, 2.4, "#0a0a0a", 0, 1, 8.6);            // kuşak düğümü
      dugum.rotation.z = 0.4;
      govde.add(dugum);
      govde.add(kutu(3, 10, 1.8, "#0a0a0a", -5, -5, 8.4));            // kuşak uçları
      govde.add(kutu(3, 9, 1.8, "#0a0a0a", -8, -4, 8.2));
    },
    sac(bas, r) {
      const sac = r.hair;
      bas.add(konturla(kutu(42, 12, 40, sac, 0, 37, 0)));             // saç tepesi
      for (const yon of [-1, 1]) bas.add(kutu(6, 14, 38, sac, yon * 20, 30, 0)); // yanlar
      for (const [x, z, egim] of [[-15, 4, 0.25], [-7, 7, -0.15], [0, 9, 0.05], [8, 7, -0.2], [15, 4, 0.3]]) {
        const sivri = koni(4.5, 16, sac, x, 46, z);                   // dikleşen sivri saçlar
        sivri.rotation.z = egim; sivri.rotation.x = z * 0.02;
        bas.add(konturla(sivri, 1.05));
      }
      bas.add(kutu(44, 4.5, 2, "#dc2626", 0, 33, 19.4));              // kırmızı alın bandı
      for (const yon of [-1, 1]) {                                    // arkada iki dalgalı uç
        const ucu = kutu(6, 16, 1.6, "#dc2626", yon * 16, 26, -21);
        ucu.rotation.z = yon * 0.35;
        bas.add(ucu);
        bas.add(kutu(6, 2.4, 1.8, "#7f1d1d", yon * 16, 18.5, -21));
      }
    },
    silah() { return fanatikSilahKur(); },
  },
  silsen: {
    bacakRenk: (r) => koyu(r.body, 0.5), // tayt
    botRenk: "#4a2a10", tabanRenk: "#6b3f1d",
    kolRenk: (r) => acik(r.body, 0.08),
    govde(govde, r) {
      const elbise = r.body;
      const etek = silindir(16, 23, 22, elbise, 0, -9, 0);            // diz boyu genişleyen etek
      govde.add(konturla(etek, 1.04));
      govde.add(kutu(33, 3, 19, acik(elbise, 0.15), 0, -20, 0));      // etek ucu
      govde.add(kutu(30, 4, 18, acik(elbise, 0.28), 0, 1, 0));        // bel kuşağı
      govde.add(kutu(15, 12, 1.8, acik(elbise, 0.22), 0, 18, 8.4));   // göğüs
      govde.add(kutu(21, 4, 2, acik(elbise, 0.4), 0, 27, 8.3));       // yaka
      for (let i = 0; i < 4; i++) govde.add(kutu(3, 3, 1.4, acik(elbise, 0.55), -6 + i * 4, 14, 8.8)); // düğmeler
    },
    sac(bas, r) {
      const sac = r.hair;
      bas.add(konturla(kutu(44, 13, 42, sac, 0, 37, 0)));             // tepe
      for (const yon of [-1, 1]) bas.add(konturla(kutu(8, 34, 42, sac, yon * 21, 23, 0), 1.04)); // uzun yanlar
      bas.add(konturla(kutu(40, 34, 9, sac, 0, 18, -18), 1.04));      // uzun arka
      for (const [x, y, w, h, e] of [[-14, 33, 10, 10, -0.15], [-3, 32, 12, 11, 0.1], [7, 33, 9, 10, 0.18]]) {
        const k = kutu(w, h, 5, sac, x, y, 19.8);
        k.rotation.z = e;
        bas.add(k);                                                   // kahküller
      }
    },
    silah() { return silsenSilahKur(); },
  },
  sercin: {
    bacakRenk: (r) => r.legs, // koyu kahverengi pantolon
    botRenk: "#4a2a10", tabanRenk: "#6b3f1d",
    govde(govde, r, costumeIdx) {
      govde.add(kutu(16, 14, 1.8, acik(r.body, 0.32), 0, 16, 8.4));   // hardal üst
      govde.add(kutu(21, 4, 2, koyu(r.body, 0.22), 0, 27, 8.3));      // yaka
      govde.add(kutu(26, 4.5, 17, "#4a2a10", 0, 1, 0));               // deri kemer
      govde.add(kutu(5, 4, 1.8, "#fbbf24", 0, 1, 8.7));               // kemer tokası
      if (costumeIdx === 1) {                                         // Kanatlı Kedi: sırtta iki küçük beyaz kanat
        for (const yon of [-1, 1]) {
          for (let i = 0; i < 3; i++) {
            const t = kutu(4, 12 - i * 2, 2, "#ffffff", yon * (10 + i * 3), 18 - i * 5, -10 - i * 2);
            t.rotation.z = yon * (0.5 + i * 0.22);
            govde.add(konturla(t, 1.05));
          }
        }
      }
    },
    yuzEk(bas, r, gozler, costumeIdx) {
      const gaga = koni(4.2, 9, "#fb923c", 0, 16, 21);                // küçük turuncu gaga maskesi
      gaga.rotation.x = Math.PI / 2;
      bas.add(konturla(gaga, 1.06));
      bas.add(kutu(13, 5, 2, "#fdba74", 0, 20, 19.4));                // maske bandı
      if (costumeIdx === 1) bas.add(kutu(5, 3, 2, "#f472b6", 0, 24.5, 19.8)); // kedi burnu
    },
    sac(bas, r) {
      const sac = r.hair;
      bas.add(konturla(kutu(44, 13, 42, sac, 0, 38, 0)));             // tepe
      for (const yon of [-1, 1]) bas.add(konturla(kutu(7, 32, 41, sac, yon * 21, 24, 0), 1.04)); // düz uzun yanlar
      bas.add(konturla(kutu(40, 32, 9, sac, 0, 19, -18), 1.04));      // düz uzun arka
      for (const [x, y, w, h] of [[-15, 33, 11, 11], [-5, 32, 12, 12], [5, 32, 11, 12], [14, 33, 9, 10]]) {
        bas.add(kutu(w, h, 5, sac, x, y, 19.8));                      // düz kahküller
      }
    },
    basAksesuar(bas, r, costumeIdx) {
      if (costumeIdx !== 1) return;
      for (const yon of [-1, 1]) {                                    // kedi kulakları
        const kulak = koni(5.5, 11, "#fb923c", yon * 13, 49, 0);
        kulak.rotation.z = yon * -0.18;
        bas.add(konturla(kulak, 1.05));
        bas.add(koni(2.6, 6, "#f9a8d4", yon * 13, 50, 1));
      }
    },
    silah(r) { return sercinSilahKur(r); },
  },
});

// Yardımcı robot (bot): gri metal gövde, iki mavi ışık, dişli ekran yüz, siyah saç tutamı, küçük blaster.
function botIskelet() {
  const metal = "#64748b", acikMetal = "#cbd5e1", koyuMetal = "#334155";
  const kok = grup();
  const kalca = grup(0, 30, 0); kok.add(kalca);
  const govde = grup(); kalca.add(govde);
  govde.add(konturla(kutu(30, 26, 18, metal, 0, 13, 0)));
  govde.add(kutu(16, 14, 1.8, acikMetal, 0, 13, 9.4)); // göğüs paneli
  govde.add(kutu(4, 4, 1.2, "#22d3ee", -4, 13, 10.4, "#22d3ee")); // iki mavi ışık
  govde.add(kutu(4, 4, 1.2, "#22d3ee", 4, 13, 10.4, "#22d3ee"));
  govde.add(kutu(32, 4, 19, koyuMetal, 0, 0, 0));      // bel halkası

  const bas = grup(0, 26, 0); govde.add(bas);
  bas.add(konturla(kutu(38, 34, 34, acikMetal, 0, 19, 0)));
  bas.add(kutu(28, 22, 2.2, "#0f172a", 0, 20, 17.4));  // ekran
  for (const yon of [-1, 1]) {
    bas.add(kutu(7, 8, 1.4, "#22d3ee", yon * 7, 24, 18.8, "#22d3ee")); // mavi gözler
  }
  // Dişli ekran ağzı: beyaz diş sırası + koyu aralıklar
  bas.add(kutu(17, 9, 1.4, "#f8fafc", 0, 13, 18.6));
  for (const x of [-6, -2, 2, 6]) bas.add(kutu(1.4, 9, 1.6, "#0f172a", x, 13, 19.0));
  // Siyah saç tutamı
  const sac = "#27272a";
  bas.add(konturla(kutu(30, 6, 28, sac, 0, 36, -1), 1.05));
  for (const [x, z, egim] of [[-9, -2, 0.4], [0, 2, -0.3], [9, -3, 0.5]]) {
    const t = kutu(8, 9, 8, sac, x, 40, z);
    t.rotation.z = egim;
    bas.add(t);
  }

  const omuzSag = grup(17, 22, 0); govde.add(omuzSag);
  const kolSag = grup(); omuzSag.add(kolSag);
  kolSag.add(konturla(kutu(8, 20, 8, metal, 0, -10, 0), 1.05));
  const elSag = grup(0, -20, 0); kolSag.add(elSag);
  elSag.add(kutu(10, 10, 10, acikMetal, 0, -2, 0));
  const silah = botSilahKur();
  elSag.add(silah.grup);

  const omuzSol = grup(-17, 22, 0); govde.add(omuzSol);
  const kolSol = grup(); omuzSol.add(kolSol);
  kolSol.add(konturla(kutu(8, 20, 8, metal, 0, -10, 0), 1.05));
  const elSol = grup(0, -20, 0); kolSol.add(elSol);
  elSol.add(kutu(10, 10, 10, acikMetal, 0, -2, 0));

  const bacakSag = grup(8, 0, 0); kalca.add(bacakSag);
  bacakSag.add(kutu(9, 22, 10, koyuMetal, 0, -11, 0));
  bacakSag.add(kutu(11, 6, 13, "#1e293b", 0, -24, 1)); // bot ayağı
  const bacakSol = grup(-8, 0, 0); kalca.add(bacakSol);
  bacakSol.add(kutu(9, 22, 10, koyuMetal, 0, -11, 0));
  bacakSol.add(kutu(11, 6, 13, "#1e293b", 0, -24, 1));

  const gozler = [];
  return {
    kok, kalca, govde, bas, gozler, namlu: silah.namlu,
    omuzSag, kolSag, elSag, omuzSol, kolSol, elSol, bacakSag, bacakSol,
  };
}

function rigAl(charKey, costumeIdx, gunKey) {
  const k = `${charKey}|${costumeIdx}|${gunKey || ""}`;
  let rig = rigler.get(k);
  if (!rig) { rig = iskelet(charKey, costumeIdx, gunKey); rigler.set(k, rig); }
  return rig;
}

function aciFarki(a) {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

function durumAl(kimlik) {
  let d = durumlar.get(kimlik);
  if (!d) {
    d = { aci: null, son: 0, govdeX: 0, bacakSagX: 0, bacakSolX: 0, omuzSagX: 0, omuzSolX: 0, elSagX: 0, nisan: 0 };
    durumlar.set(kimlik, d);
  }
  return d;
}

// Animasyon: yürü/koş bacak salınımı, boş kol, nişan ve geri tepme; eklem açıları ~10/sn ile yumuşatılır.
function canlandir(rig, d, o, dt, simdi) {
  const faz = Math.sin((o.walkPhase || 0) * 12);
  const kos = !!o.kosuyor;
  const yuru = !!o.yuruyor || (o.walkPhase || 0) > 0;
  const rec = Math.max(0, Math.min(1, o.shootRecoil || 0));
  const onizleme = !!o.onizleme; // önizlemeler her zaman nişanda, yavaş bir salınımla
  const yakin = o.charKey === "veryi" || o.charKey === "kent"; // çekiç/hançer: ateşte yay çizerek iner
  const tekme = o.ozel === "tekme"; // Fanatik'in Tornado Tekme gücü
  const sevinc = o.ozel === "sevinc"; // bölüm sonu kutlaması
  d.nisan += ((onizleme || o.nisan || (o.aimRaise || 0) > 0.4 || rec > 0.05 ? 1 : 0) - d.nisan) * (dt > 0 ? 1 - Math.exp(-10 * dt) : 1);
  const salinim = Math.sin(simdi / 1200);
  const hedef = {
    govdeX: (kos ? 0.17 : 0) - 0.08 * rec,
    bacakSagX: kos ? 0.87 * faz : yuru ? 0.52 * faz : 0,
    bacakSolX: kos ? -0.87 * faz : yuru ? -0.52 * faz : 0,
    omuzSolX: (kos ? -0.7 * faz : yuru ? -0.44 * faz : 0) + Math.sin(simdi / 900) * 0.04,
    // Nişanda ileri ve yere paralel; hedefsiz yürürken yarı kalkık (silah önde-aşağıda, gövde arkasında kalmaz).
    omuzSagX: d.nisan > 0.5 ? -Math.PI / 2 - 0.35 * rec + salinim * 0.03
      : (yuru ? -0.85 - 0.12 * faz : -0.45 + salinim * 0.05),
    elSagX: d.nisan > 0.5 ? -0.15 * rec : 0,
  };
  if (yakin && rec > 0.02) {
    // Yakın vuruş: kol yukarıdan aşağı yay çizer (geri tepme yerine). rec 1 → yukarı, 0 → dinlenme.
    hedef.omuzSagX = -0.45 - 2.4 * rec;
    hedef.elSagX = 0.5 * rec;
  }
  if (sevinc) { // iki kol havada, küçük zıplama
    hedef.omuzSagX = -2.85;
    hedef.omuzSolX = -2.85;
    hedef.elSagX = 0;
  }
  const k = dt > 0 ? 1 - Math.exp(-10 * dt) : 1;
  for (const ad of ["govdeX", "bacakSagX", "bacakSolX", "omuzSolX", "omuzSagX", "elSagX"]) d[ad] += (hedef[ad] - d[ad]) * k;
  const nefes = Math.sin(simdi / 1000 * (2 * Math.PI / 1.6)) * 0.02;
  let zipla = yuru ? Math.abs(faz) * (kos ? 2.2 : 1.6) : 0;
  if (sevinc) zipla = Math.abs(Math.sin(simdi / 140)) * 5;
  rig.kok.position.y = zipla;
  rig.kok.rotation.y = d.aci + (tekme ? simdi * 0.02 : 0); // tornado: kendi çevresinde hızla döner
  rig.govde.rotation.x = d.govdeX;
  rig.govde.scale.y = 1 + nefes;
  rig.bacakSag.rotation.x = d.bacakSagX;
  rig.bacakSol.rotation.x = d.bacakSolX;
  rig.bacakSag.rotation.z = tekme ? 1.15 : 0; // tekme: bir bacak yana açık
  rig.bacakSol.rotation.z = 0;
  rig.omuzSag.rotation.x = d.omuzSagX;
  rig.omuzSol.rotation.x = d.omuzSolX;
  rig.elSag.rotation.x = d.elSagX;
  // Çekici olan karakterde silah dinlenirken omuzda, nişanda önde: tutuş açısı yumuşak geçer.
  // Dünya açısı istenen silahlarda (Güllu'nun yayı, Kornet'in asası) kol dönüşü telafi edilir.
  if (rig.silahGrup && rig.silahDunya) {
    const istenen = rig.silahDunya.dinlen + (rig.silahDunya.nisan - rig.silahDunya.dinlen) * d.nisan;
    rig.silahGrup.rotation.x = istenen - (rig.omuzSag.rotation.x + rig.elSag.rotation.x);
  } else if (rig.silahGrup && rig.silahAci) {
    rig.silahGrup.rotation.x = rig.silahAci.dinlen + (rig.silahAci.nisan - rig.silahAci.dinlen) * d.nisan;
  }
  // Ok yalnız ateş ederken görünür (Güllu'nun yayı)
  if (rig.silahOk) rig.silahOk.visible = rec > 0.05;
  // Ara sıra göz kırpma (göz kutuları dikeyde kısalır)
  const dongu = (simdi / 1000 + (o.kimlik || "").length * 0.37) % 3.4;
  const kirp = dongu < 0.1 ? 0.12 : 1;
  for (const goz of rig.gozler) goz.scale.y = kirp;
}

function boyutAyarla(n) {
  if (tuvalBoyut === n) return;
  tuvalBoyut = n;
  renderer.setSize(n, n, false);
}

// 2D ctx'e çizer: ayaklar (x, y + kk.alt*s), boy (kk.alt-kk.ust)*s*1.06. Çizdiyse true.
function ciz(ctx, o) {
  if (!hazir || kapali) return false;
  const secenek = o || {};
  const charKey = secenek.charKey || "kinkin";
  const costumeIdx = secenek.costumeIdx || 0;
  const size = Number.isFinite(secenek.size) ? secenek.size : 70;
  const s = size / 100;
  const x = secenek.x || 0, y = secenek.y || 0;
  const kk = (typeof window.karakterKodKutusu === "function" && window.karakterKodKutusu(charKey, costumeIdx))
    || { ust: -40, alt: 46 };
  const kimlik = secenek.kimlik || "onizleme";
  const d = durumAl(kimlik);
  const simdi = performance.now();
  const dt = d.son ? Math.min(0.12, Math.max(0, (simdi - d.son) / 1000)) : 0;
  d.son = simdi;
  const hedefAci = (secenek.aci === null || secenek.aci === undefined) ? 0.5 : secenek.aci;
  if (d.aci === null || dt === 0) d.aci = hedefAci; // ilk kare / aynı anda ikinci çizim: yumuşatma yok
  else {
    const fark = aciFarki(hedefAci - d.aci);
    const adim = Math.min(Math.abs(fark), 12 * dt) * Math.sign(fark);
    d.aci += adim;
  }
  const gunKey = secenek.gunKey || "";
  const rig = rigAl(charKey, costumeIdx, gunKey);
  if (aktifRig !== rig) {
    if (aktifRig) sahne.remove(aktifRig.kok);
    sahne.add(rig.kok);
    aktifRig = rig;
  }
  canlandir(rig, d, { ...secenek, kimlik, onizleme: kimlik.indexOf("onizleme") === 0 }, dt, simdi);
  const n = Math.max(16, Math.min(256, Math.round(size * (window.devicePixelRatio || 1) * 1.3)));
  boyutAyarla(n);
  rig.kok.updateMatrixWorld(true);
  // Her parçanın kendi kutusunu kameraya yansıt: tüm modelin (saç, taç, silah) sınırı, kırpılmadan.
  kamera.zoom = 1;
  kamera.updateProjectionMatrix();
  kamera.updateMatrixWorld();
  const kose = new THREE.Vector3();
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  rig.kok.traverse((parca) => {
    if (!parca.isMesh || !parca.visible) return;
    const g = parca.geometry;
    if (!g.boundingBox) g.computeBoundingBox();
    const bb = g.boundingBox;
    if (!bb) return;
    for (const cx of [bb.min.x, bb.max.x]) for (const cy of [bb.min.y, bb.max.y]) for (const cz of [bb.min.z, bb.max.z]) {
      kose.set(cx, cy, cz).applyMatrix4(parca.matrixWorld).project(kamera);
      if (kose.x < minX) minX = kose.x; if (kose.x > maxX) maxX = kose.x;
      if (kose.y < minY) minY = kose.y; if (kose.y > maxY) maxY = kose.y;
    }
  });
  const yari = Math.max(Math.abs(minX), Math.abs(maxX), Math.abs(minY), Math.abs(maxY), 1e-3);
  kamera.zoom = Math.min(8, Math.max(0.05, 0.84 / yari)); // her yanda yaklaşık %8 pay
  kamera.updateProjectionMatrix();
  const z = kamera.zoom;
  const pxX = (vx) => (vx * z + 1) / 2 * n;
  const pxY = (vy) => (1 - vy * z) / 2 * n;
  const ustPx = pxY(maxY), altPx = pxY(minY);
  const ayak = new THREE.Vector3(); rig.kok.getWorldPosition(ayak); ayak.project(kamera);
  const ayakX = pxX(ayak.x);
  const hedefBoy = (kk.alt - kk.ust) * s * 1.06;
  const gorunum = hedefBoy * 0.92; // %8 üst pay: saç/silah tepeye yapışmaz
  const izH = Math.max(1, altPx - ustPx);
  const olcek = gorunum / izH;
  const dx = x - ayakX * olcek;
  const dy = y + kk.alt * s - altPx * olcek;
  renderer.render(sahne, kamera);
  ctx.drawImage(tuval, dx, dy, n * olcek, n * olcek);
  // Namlu ucunun yerel ve ekran (ctx dönüşümü uygulanmış) noktası
  const m = new THREE.Vector3(); rig.namlu.getWorldPosition(m); m.project(kamera);
  const mx = dx + pxX(m.x) * olcek;
  const my = dy + pxY(m.y) * olcek;
  d.namluYerel = { x: mx, y: my };
  try {
    const t = typeof ctx.getTransform === "function" ? ctx.getTransform() : null;
    const p = t && typeof t.transformPoint === "function" ? t.transformPoint(new DOMPoint(mx, my)) : { x: mx, y: my };
    d.namluEkran = { x: p.x, y: p.y };
  } catch (_) { d.namluEkran = { x: mx, y: my }; }
  return true;
}

function namlu(kimlik) {
  const d = durumlar.get(kimlik || "ben");
  return d && d.namluEkran ? { x: d.namluEkran.x, y: d.namluEkran.y } : null;
}

function kapat() {
  kapali = true;
  hazir = false;
  if (api) api.hazir = false;
  try { if (renderer) renderer.dispose(); } catch (_) { /* sessiz */ }
}

// 3D'yi yeniden açar (Ayarlar'da aç/kapa; kapat() sonrası).
function ac() {
  if (hazir && !kapali) return true;
  try {
    kur();
    hazir = true;
    kapali = false;
    aktifRig = null;
    _yavasPencere.length = 0;
    _yavasBildirildi = false;
    api.hazir = true;
    api.ciz = ciz;
    api.namlu = namlu;
    api.destek = () => hazir && !kapali;
    return true;
  } catch (_) {
    return false;
  }
}

// Başarım koruması: drawCharacter her UcAvci.ciz süresini buraya bildirir. Son 3 sn'nin ortalaması
// 45 ms'yi aşarsa 3D kendiliğinden kapanır; oyun 'uc-avci-yavas' olayını dinleyip bildirir ve kaydeder.
const _yavasPencere = [];
let _yavasBildirildi = false;
const _yavasAyar = { pencereMs: 3000, esikMs: 45, enAz: 8 };
function sureEkle(ms) {
  if (!hazir || kapali) return;
  const simdi = performance.now();
  _yavasPencere.push({ t: simdi, ms: Math.max(0, Number(ms) || 0) });
  while (_yavasPencere.length && simdi - _yavasPencere[0].t > _yavasAyar.pencereMs) _yavasPencere.shift();
  if (_yavasPencere.length < _yavasAyar.enAz) return;
  const ort = _yavasPencere.reduce((a, b) => a + b.ms, 0) / _yavasPencere.length;
  if (ort > _yavasAyar.esikMs && !_yavasBildirildi) {
    _yavasBildirildi = true;
    kapat();
    try { window.dispatchEvent(new CustomEvent("uc-avci-yavas", { detail: { ort } })); } catch (_) { /* sessiz */ }
  }
}

const api = {
  hazir: false,
  ciz: () => false,
  namlu: () => null,
  destek: () => false,
  kapat,
  ac,
  sureEkle,
  ayar: _yavasAyar,
};
window.UcAvci = api;
try {
  kur();
  hazir = true;
  api.hazir = true;
  api.ciz = ciz;
  api.namlu = namlu;
  api.destek = () => hazir && !kapali;
  window.dispatchEvent(new Event("uc-avci-hazir"));
} catch (_) {
  hazir = false;
  window.UcAvci = { hazir: false, ciz: () => false, namlu: () => null, destek: () => false, kapat: () => {} };
}
