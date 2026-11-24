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

// Malzeme: düz ve ucuz (Lambert). emisyon verilirse parlayan çekirdek/göz için.
function malzeme(renk, emisyon) {
  const m = new THREE.MeshLambertMaterial({ color: new THREE.Color(renk) });
  if (emisyon) { m.emissive = new THREE.Color(emisyon); m.emissiveIntensity = 1; }
  return m;
}
function kutu(w, h, d, renk, x = 0, y = 0, z = 0, emisyon) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), malzeme(renk, emisyon));
  m.position.set(x, y, z);
  return m;
}
function grup(x = 0, y = 0, z = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  return g;
}
// Top-level betiklerdeki sözlükler (game.js) pencere üzerinden okunur.
function renkler(charKey, costumeIdx) {
  const C = (typeof window !== "undefined" && window.CHARACTERS) || {};
  const K = (typeof window !== "undefined" && window.COSTUMES) || {};
  const c = C[charKey] || C.kinkin || { color: { skin: "#f4d6b5", legs: "#374151" } };
  const liste = K[charKey] || K.kinkin || [{ body: "#1d4ed8", hair: "#7a3e1d" }];
  const cos = liste[costumeIdx] || liste[0] || { body: "#1d4ed8", hair: "#7a3e1d" };
  return { c, cos, body: cos.body || "#1d4ed8", hair: cos.hair || "#7a3e1d", skin: (c.color && c.color.skin) || "#f4d6b5" };
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
// kol nişanda -Y'yi +Z'ye çevirdiği için silah ileri (baktığı yön) bakar.
function silahKur(charKey) {
  const g = grup();
  const kinkin = charKey === "kinkin" || !charKey;
  g.add(kutu(kinkin ? 5 : 4, 15, 7, "#cfd8e3", 0, -7, 0));      // gövde/namlu
  g.add(kutu(4, 6, 5, "#4b5563", 0, -1, 1));                     // kabza
  g.add(kutu(kinkin ? 2.6 : 2, 9, 2.6, "#22d3ee", 0, -8, 2, "#22d3ee")); // parlayan çekirdek
  const namlu = new THREE.Object3D();
  namlu.position.set(0, -17, 0);
  g.add(namlu);
  return { grup: g, namlu };
}

// (karakter, kostüm) iskeleti: kok → kalca → govde → bas, govde → omuz → kol → el, kalca → bacak.
function iskelet(charKey, costumeIdx) {
  const r = renkler(charKey, costumeIdx);
  const kinkin = charKey === "kinkin" || !r.c || charKey === undefined;
  const omuzRenk = kinkin ? "#e5e7eb" : r.body;
  const kok = grup();
  const kalca = grup(0, 32, 0); kok.add(kalca);
  const govde = grup(); kalca.add(govde);
  govde.add(kutu(26, 28, 16, r.body, 0, 14, 0));
  govde.add(kutu(14, 15, 1.5, kinkin ? "#e5e7eb" : r.body, 0, 14, 8.3)); // tulum göğsü
  govde.add(kutu(10, 7, 18, omuzRenk, 13, 24, 0));   // açık omuzluklar
  govde.add(kutu(10, 7, 18, omuzRenk, -13, 24, 0));
  govde.add(kutu(28, 4, 17, "#6b3f1d", 0, 1, 0));    // kahverengi kemer
  govde.add(kutu(9, 11, 7, "#7c4a1e", 12, 4, -8));   // yan çanta

  const bas = grup(0, 28, 0); govde.add(bas);
  bas.add(kutu(40, 40, 38, r.skin, 0, 20, 0));
  bas.add(kutu(42, 12, 40, r.hair, 0, 38, 0));       // saç tepesi
  bas.add(kutu(6, 15, 38, r.hair, -20, 30, 0));      // yan saçlar
  bas.add(kutu(6, 15, 38, r.hair, 20, 30, 0));
  bas.add(kutu(12, 8, 4, r.hair, -13, 32, 19.4));    // dağınık kahküller
  bas.add(kutu(10, 10, 4, r.hair, -2, 30, 20));
  bas.add(kutu(11, 7, 4, r.hair, 10, 33, 19.4));
  const gozler = [];
  for (const yon of [-1, 1]) {
    const goz = kutu(6, 8, 1.5, "#111827", yon * 8, 24, 19.4);
    bas.add(goz); gozler.push(goz);
    bas.add(kutu(1.8, 1.8, 0.8, "#ffffff", yon * 8 - 1.6, 26, 20.1)); // küçük parlama
  }
  bas.add(kutu(10, 1.6, 1.2, "#7c2d12", 0, 16, 19.5)); // gülümseme
  if (costumeIdx === 1) { // Pembe Prenses: küçük altın taç
    bas.add(kutu(14, 4, 14, "#fbbf24", 0, 44, 0));
    for (const x of [-5, 0, 5]) bas.add(kutu(3, 6, 3, "#fbbf24", x, 47, 0));
  }

  const omuzSag = grup(15, 24, 0); govde.add(omuzSag);
  const kolSag = grup(); omuzSag.add(kolSag);
  kolSag.add(kutu(8, 20, 8, r.body, 0, -10, 0));
  const elSag = grup(0, -20, 0); kolSag.add(elSag);
  elSag.add(kutu(8, 8, 8, r.skin, 0, -2, 0));
  const silah = silahKur(charKey);
  elSag.add(silah.grup);

  const omuzSol = grup(-15, 24, 0); govde.add(omuzSol);
  const kolSol = grup(); omuzSol.add(kolSol);
  kolSol.add(kutu(8, 20, 8, r.body, 0, -10, 0));
  const elSol = grup(0, -20, 0); kolSol.add(elSol);
  elSol.add(kutu(8, 8, 8, r.skin, 0, -2, 0));

  const bacakSag = grup(7, 0, 0); kalca.add(bacakSag);
  bacakSag.add(kutu(9, 26, 10, r.body, 0, -13, 0));
  bacakSag.add(kutu(10, 7, 12, "#374151", 0, -28.5, 1)); // koyu gri bot
  const bacakSol = grup(-7, 0, 0); kalca.add(bacakSol);
  bacakSol.add(kutu(9, 26, 10, r.body, 0, -13, 0));
  bacakSol.add(kutu(10, 7, 12, "#374151", 0, -28.5, 1));

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
  d.nisan += ((o.nisan || (o.aimRaise || 0) > 0.4 || rec > 0.05 ? 1 : 0) - d.nisan) * (dt > 0 ? 1 - Math.exp(-10 * dt) : 1);
  const hedef = {
    govdeX: (kos ? 0.17 : 0) - 0.08 * rec,
    bacakSagX: kos ? 0.87 * faz : yuru ? 0.52 * faz : 0,
    bacakSolX: kos ? -0.87 * faz : yuru ? -0.52 * faz : 0,
    omuzSolX: (kos ? -0.7 * faz : yuru ? -0.44 * faz : 0) + Math.sin(simdi / 900) * 0.04,
    omuzSagX: d.nisan > 0.5 ? -Math.PI / 2 - 0.35 * rec : (yuru ? -0.2 * faz : 0),
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
  canlandir(rig, d, { ...secenek, kimlik }, dt, simdi);
  const n = Math.max(16, Math.min(256, Math.round(size * (window.devicePixelRatio || 1) * 1.3)));
  boyutAyarla(n);
  renderer.render(sahne, kamera);
  // En alt nokta botların ön-alt köşeleridir (kamera eğik olduğu için derinlik de dikeyde kayar):
  // gerçek en alt pikseli ayak hizasına oturt ki gölge hariç alt kenar tam kk.alt*s olsun.
  let altPx = -Infinity;
  for (const bacak of [rig.bacakSag, rig.bacakSol]) {
    for (const z of [-5, 7]) {
      const v = new THREE.Vector3(0, -32, z); bacak.localToWorld(v); v.project(kamera);
      altPx = Math.max(altPx, (1 - v.y) / 2 * n);
    }
  }
  const tepe = new THREE.Vector3(0, 44, 0); rig.bas.localToWorld(tepe); tepe.project(kamera);
  const tepePx = (1 - tepe.y) / 2 * n;
  const ayak = new THREE.Vector3(0, 0, 0); rig.kok.localToWorld(ayak); ayak.project(kamera);
  const ayakX = (ayak.x + 1) / 2 * n;
  const izH = Math.max(1, Math.abs(altPx - tepePx));
  const hedefBoy = (kk.alt - kk.ust) * s * 1.06;
  const olcek = hedefBoy / izH;
  const dx = x - ayakX * olcek;
  const dy = y + kk.alt * s - altPx * olcek;
  ctx.drawImage(tuval, dx, dy, n * olcek, n * olcek);
  // Namlu ucunun yerel ve ekran (ctx dönüşümü uygulanmış) noktası
  const m = new THREE.Vector3(); rig.namlu.getWorldPosition(m); m.project(kamera);
  const mx = dx + ((m.x + 1) / 2 * n) * olcek;
  const my = dy + ((1 - m.y) / 2 * n) * olcek;
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
