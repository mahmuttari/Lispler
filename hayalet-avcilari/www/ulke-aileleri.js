/* ============================================================
   HAYALET AVCILARI — DÜNYA TURU: BÖLGE AİLELERİ (3.14.0)
   10 aile (spec §5.2): K Avrupa taş/tuğla kale, KS kervansaray, KP kerpiç kasaba, SH Sahel, SV savan, GA Güney Asya,
   GDA Güneydoğu Asya, DA Doğu Asya, KA Kuzey Amerika, LA Latin Amerika. Her aile:
   - bicim.duvar: iç duvar bloklarının 3.13.0 biçim ailesi ("kale" ya da "kutuk"; engeller.js engelOlustur)
   - palet: ülke paletinin altına birleşen aile renkleri (ülke üstün gelir; ulkeler.js ulkeEngelSeti)
   - duvar (iç duvar ve harita sınırı; sınırda B.yon), su (göl kıyısı; su her ülkede aynı mavi) ressamları:
     (ctx, w, h, r, p, B) -> canli[] (engel-temalari.js düzeni)
   - zemin(ctx, boyut, palet): Dünya Turu'nda ızgaranın yerine döşenen soluk desen (dunya-turu.js turZeminCiz)
   Eksik ressam yedek ressama, eksik zemin bugünkü ızgaraya düşer. Ressamlar Görev 5 ve 7–13'te eklenir.
   engel-temalari.js'ten sonra, ulkeler.js'ten önce yüklenir.
   ============================================================ */
(function () {
  window.ULKE_AILELERI = {
    K: { bicim: { duvar: "kale" } },
    KS: { bicim: { duvar: "kale" } },
    KP: { bicim: { duvar: "kale" } },
    SH: { bicim: { duvar: "kale" } },
    SV: { bicim: { duvar: "kutuk" } },
    GA: { bicim: { duvar: "kale" } },
    GDA: { bicim: { duvar: "kutuk" } },
    DA: { bicim: { duvar: "kale" } },
    KA: { bicim: { duvar: "kutuk" } },
    LA: { bicim: { duvar: "kale" } },
  };
})();
