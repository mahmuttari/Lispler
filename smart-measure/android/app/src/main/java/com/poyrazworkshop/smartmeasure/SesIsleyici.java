package com.poyrazworkshop.smartmeasure;

/**
 * Ses düzeyi hesabı (Android'e bağımlı değil; JVM'de sınanabilir). www/js/olcum/ses.js › createProcessor ile birebir:
 * 16 bitlik örnekler A-ağırlık süzgecinden (üç ikinci dereceden bölüm, katsayılar sayfadan gelir) geçer, karesel değer
 * "hızlı" (F, 125 ms) zaman ağırlığıyla ortalanır. Sonuç tam ölçekli sinüse göre dBFS(A)'dır. Ses saklanmaz: her blok
 * işlenip atılır, yalnız düzeyler döner.
 */
public final class SesIsleyici {
    public static final double TAU_HIZLI = 0.125;
    public static final double KIRPMA = 0.99;
    public static final double TABAN_DB = -120;

    private final double[][] bolum; // [b0, b1, b2, a1, a2]
    private final double[][] durum; // her bölüm için iki durum değişkeni
    private final double alfa;
    private double hizli = 0;

    /** Bir bloğun sonucu. */
    public static final class Sonuc {
        public final double hizli, blok, tepe;
        public final boolean kirpma;
        Sonuc(double hizli, double blok, double tepe) {
            this.hizli = hizli; this.blok = blok; this.tepe = tepe; this.kirpma = tepe >= KIRPMA;
        }
    }

    public SesIsleyici(int ornekleme, double[][] bolumler) {
        if (bolumler == null || bolumler.length == 0) throw new IllegalArgumentException("süzgeç yok");
        this.bolum = bolumler;
        this.durum = new double[bolumler.length][2];
        this.alfa = 1 - Math.exp(-1.0 / (TAU_HIZLI * ornekleme));
    }

    private static double db(double karesel) {
        return karesel > 0 ? Math.max(TABAN_DB, 10 * Math.log10(2 * karesel)) : TABAN_DB;
    }

    public Sonuc blok(short[] ornek, int n) {
        double toplam = 0, tepe = 0;
        for (int i = 0; i < n; i++) {
            double x = ornek[i] / 32768.0;
            double ax = Math.abs(x);
            if (ax > tepe) tepe = ax;
            for (int j = 0; j < bolum.length; j++) {
                double[] c = bolum[j], s = durum[j];
                double y = c[0] * x + s[0];
                s[0] = c[1] * x - c[3] * y + s[1];
                s[1] = c[2] * x - c[4] * y;
                x = y;
            }
            double kare = x * x;
            toplam += kare;
            hizli += (kare - hizli) * alfa;
        }
        return new Sonuc(db(hizli), db(n > 0 ? toplam / n : 0), tepe);
    }
}
