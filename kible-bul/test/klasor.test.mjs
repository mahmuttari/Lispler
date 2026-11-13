// Kıble Bul'un masaüstündeki geliştirme klasöründen (KibleBul/test, 1.1.1) gelen sınamalar, 1.2.0'da buraya taşındı:
// WMM (NOAA test değerleri), kıble hesabı, pusula yönü ve güveni (alan vektörü, eğim, hata tahmini, pusula düzeltmesi),
// biçimler, şehirler, cami veri tabanı (www/data/mosques.bin: dosya biçimi, arama, süreler, harita bağlantıları), diller,
// üyelik. Her dosya run({ ok, near }) dışa aktarır; burada her biri ayrı bir node:test sınaması olur.
import test from 'node:test';
import assert from 'node:assert/strict';

for (const m of ['wmm', 'qibla', 'quality', 'compass', 'fmt', 'cities', 'mosques', 'i18n', 'premium']) {
  test(`klasör sınamaları: ${m}`, async () => {
    const bad = [];
    let pass = 0;
    const ok = (cond, name, extra) => { if (cond) pass++; else bad.push(name + (extra ? '  ->  ' + extra : '')); };
    const near = (got, want, tol, name) => ok(Math.abs(got - want) <= tol, name, `got ${got} want ${want}`);
    const t = await import(`./klasor/${m}.mjs`);
    await t.run({ ok, near });
    assert.deepEqual(bad, []);
    assert.ok(pass > 0, `${m}: hiç denetim çalışmadı`);
  });
}
