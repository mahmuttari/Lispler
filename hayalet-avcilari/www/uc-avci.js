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
  g.add(konturla(kutu(5, 44, 5, ahsap, 0, -16, 0), 1.05));        // sap
  g.add(kutu(6.5, 8, 6.5, "#4a2a10", 0, -1, 0));                  // tutamak sargısı
  g.add(konturla(kutu(28, 14, 14, celik, 0, -36, 0), 1.05));      // çelik baş
  g.add(kutu(30, 4, 15, "#c3ccd8", 0, -32, 0));                   // parlak üst şerit
  g.add(kutu(9, 16, 16, "#6b7280", 0, -36, 0));                   // merkez göbek
  g.add(kutu(10, 3, 7, "#b45309", 0, -36, 0));                    // bronz halka
  for (const x of [-11, -4, 4, 11]) {
    for (const z of [-7.5, 7.5]) g.add(kutu(3, 3, 3, "#3f4652", x, -36, z)); // çiviler
    g.add(kutu(3, 3, 3, "#3f4652", x, -43, 0));
  }
  const namlu = new THREE.Object3D();
  namlu.position.set(0, -45, 0);
  g.add(namlu);
  return { grup: g, namlu, dinlen: Math.PI * 0.94, nisan: 0.08 };
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
  g.add(konturla(kutu(4, 54, 4, "#8b5a2b", 0, -21, 0), 1.05));    // sap
  for (let i = 0; i < 8; i++) {
    const b = kutu(5, 2.4, 5, "#fbbf24", 0, -3 - i * 5.4, 0);     // sarmal bant
    b.rotation.y = i * 0.8;
    g.add(b);
  }
  g.add(konturla(kutu(3.4, 15, 3.4, "#eab308", 0, -55, 0)));      // orta diş
  for (const yon of [-1, 1]) {
    const p = kutu(3.4, 13, 3.4, "#eab308", yon * 7, -53, 0);
    p.rotation.z = yon * 0.3;                                      // yan dişler
    g.add(p);
  }
  const kristal = new THREE.Mesh(_kristalGeo, parlakMalzeme("#c026d3"));
  kristal.position.set(0, -51, 0);
  kristal.scale.set(1, 1.5, 1);
  g.add(kristal);
  g.add(kutu(2, 2, 2, "#f0abfc", 0, -51, 0, "#e879f9"));          // iç parlama
  const namlu = new THREE.Object3D();
  namlu.position.set(0, -64, 0);
  g.add(namlu);
  return { grup: g, namlu };
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
function bacakCiz(g, renk, K) {
  const boy = K.bacakBoy || 26;
  g.add(kutu(9, boy, 10, renk, 0, -boy / 2, 0));
  if (K.bot === false) {
    g.add(kutu(10, 6, 12, renk, 0, -boy - 1, 1));
  } else {
    g.add(kutu(10, 8, 13, "#374151", 0, -boy - 1, 1));   // koyu gri bot
    g.add(kutu(11, 3, 14, "#9ca3af", 0, -boy - 4.5, 1)); // açık taban
  }
}

// (karakter, kostüm) iskeleti: kok → kalca → govde → bas, govde → omuz → kol → el, kalca → bacak.
// Ortak gövde/baş/kol/bacak burada kurulur; karaktere özel saç, başlık, kıyafet ve silah KARAKTER_3D'den gelir.
function iskelet(charKey, costumeIdx) {
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
  const silah = K.silah ? K.silah(r, costumeIdx) : silahKur(charKey);
  elSag.add(silah.grup);

  const omuzSol = grup(-15, 24, 0); govde.add(omuzSol);
  const kolSol = grup(); omuzSol.add(kolSol);
  kolSol.add(konturla(kutu(8, 21, 8, kolRenk, 0, -10, 0), 1.05));
  const elSol = grup(0, -20, 0); kolSol.add(elSol);
  elSol.add(kutu(9, 9, 9, elRenk, 0, -2, 0)); // öbür yumruk

  const bacakSag = grup(7, 0, 0); kalca.add(bacakSag); bacakCiz(bacakSag, bacakRenk, K);
  const bacakSol = grup(-7, 0, 0); kalca.add(bacakSol); bacakCiz(bacakSol, bacakRenk, K);

  return {
    kok, kalca, govde, bas, gozler, namlu: silah.namlu,
    omuzSag, kolSag, elSag, omuzSol, kolSol, elSol, bacakSag, bacakSol,
    silahGrup: silah.grup,
    silahAci: silah.dinlen !== undefined ? { dinlen: silah.dinlen, nisan: silah.nisan || 0 } : null,
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
      const kureler = [[13, 14, 0, 1], [10, 6, 6, 0.9], [9, 23, -4, 0.88], [8, 8, -8, 0.94], [7, -1, 5, 0.86]];
      for (const [rad, y, z, oran] of kureler) {
        const m = kure(rad, oran < 1 ? koyu(b, 0.12) : b, 0, y, z);  // kabarık bulut gövde
        govde.add(konturla(m, 1.06));
      }
      for (const yon of [-1, 1]) govde.add(konturla(kure(7, acik(b, 0.12), yon * 10, 14, 2), 1.06));
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

function rigAl(charKey, costumeIdx) {
  const k = `${charKey}|${costumeIdx}`;
  let rig = rigler.get(k);
  if (!rig) { rig = iskelet(charKey, costumeIdx); rigler.set(k, rig); }
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
  const k = dt > 0 ? 1 - Math.exp(-10 * dt) : 1;
  for (const ad of ["govdeX", "bacakSagX", "bacakSolX", "omuzSolX", "omuzSagX", "elSagX"]) d[ad] += (hedef[ad] - d[ad]) * k;
  const nefes = Math.sin(simdi / 1000 * (2 * Math.PI / 1.6)) * 0.02;
  const zipla = yuru ? Math.abs(faz) * (kos ? 2.2 : 1.6) : 0;
  rig.kok.position.y = zipla;
  rig.kok.rotation.y = d.aci;
  rig.govde.rotation.x = d.govdeX;
  rig.govde.scale.y = 1 + nefes;
  rig.bacakSag.rotation.x = d.bacakSagX;
  rig.bacakSol.rotation.x = d.bacakSolX;
  rig.omuzSag.rotation.x = d.omuzSagX;
  rig.omuzSol.rotation.x = d.omuzSolX;
  rig.elSag.rotation.x = d.elSagX;
  // Çekici olan karakterde silah dinlenirken omuzda, nişanda önde: tutuş açısı yumuşak geçer.
  if (rig.silahGrup && rig.silahAci) {
    rig.silahGrup.rotation.x = rig.silahAci.dinlen + (rig.silahAci.nisan - rig.silahAci.dinlen) * d.nisan;
  }
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
  const rig = rigAl(charKey, costumeIdx);
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

const api = {
  hazir: false,
  ciz: () => false,
  namlu: () => null,
  destek: () => false,
  kapat,
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
