package com.poyrazworkshop.smartmeasure;

import android.annotation.SuppressLint;
import android.content.Context;
import android.media.AudioFormat;
import android.media.AudioManager;
import android.media.AudioRecord;
import android.media.MediaRecorder;

/**
 * Mikrofondan ses düzeyi: AudioRecord, 16 bit tek kanal, 48 ya da 44,1 kHz. Kaynak, telefon destekliyorsa işlenmemiş
 * ses (UNPROCESSED: otomatik kazanç ve gürültü bastırma yok), değilse ses tanıma kaynağı (VOICE_RECOGNITION: Android
 * uyumluluk tanımı bu kaynakta otomatik kazancı kapalı ister). Örnekler yalnız bellekte, 100 ms'lik bloklar hâlinde
 * işlenir; hiçbir şey kaydedilmez, saklanmaz, gönderilmez.
 */
final class SesOlcer implements Runnable {
    interface Dinleyici {
        void olcum(SesIsleyici.Sonuc s, double saniye, String kaynak);
        void hata(String neden);
    }

    private final AudioRecord kayit;
    private final SesIsleyici isleyici;
    private final int ornekleme;
    final String kaynak;
    private final Dinleyici dinleyici;
    private volatile boolean calisiyor = true;
    private Thread is;

    private SesOlcer(AudioRecord kayit, int ornekleme, String kaynak, SesIsleyici isleyici, Dinleyici dinleyici) {
        this.kayit = kayit; this.ornekleme = ornekleme; this.kaynak = kaynak; this.isleyici = isleyici; this.dinleyici = dinleyici;
    }

    /** Uygun örnekleme hızıyla açar; açılamazsa null. suzgec(fs) o hızın süzgeç katsayılarını verir (yoksa null). */
    @SuppressLint("MissingPermission") // izin OlcerPlugin'de denetlenir
    static SesOlcer ac(Context ctx, java.util.function.IntFunction<double[][]> suzgec, Dinleyici d) {
        AudioManager am = (AudioManager) ctx.getSystemService(Context.AUDIO_SERVICE);
        boolean islenmemis = am != null && "true".equals(am.getProperty(AudioManager.PROPERTY_SUPPORT_AUDIO_SOURCE_UNPROCESSED));
        int[] kaynaklar = islenmemis
            ? new int[] { MediaRecorder.AudioSource.UNPROCESSED, MediaRecorder.AudioSource.VOICE_RECOGNITION }
            : new int[] { MediaRecorder.AudioSource.VOICE_RECOGNITION, MediaRecorder.AudioSource.MIC };
        for (int kaynak : kaynaklar) {
            for (int fs : new int[] { 48000, 44100 }) {
                double[][] k = suzgec.apply(fs);
                if (k == null) continue;
                int en = AudioRecord.getMinBufferSize(fs, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT);
                if (en <= 0) continue;
                AudioRecord r;
                try {
                    r = new AudioRecord(kaynak, fs, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT, Math.max(en, fs / 5 * 2));
                } catch (Exception e) {
                    continue;
                }
                if (r.getState() != AudioRecord.STATE_INITIALIZED) { r.release(); continue; }
                String ad = kaynak == MediaRecorder.AudioSource.UNPROCESSED ? "unprocessed"
                    : kaynak == MediaRecorder.AudioSource.VOICE_RECOGNITION ? "voice_recognition" : "mic";
                return new SesOlcer(r, fs, ad, new SesIsleyici(fs, k), d);
            }
        }
        return null;
    }

    void basla() {
        is = new Thread(this, "SesOlcer");
        is.start();
    }

    void dur() {
        calisiyor = false;
        if (is != null) {
            try { is.join(400); } catch (InterruptedException ignored) { Thread.currentThread().interrupt(); }
        }
    }

    @Override
    public void run() {
        short[] tampon = new short[ornekleme / 10];
        try {
            kayit.startRecording();
            if (kayit.getRecordingState() != AudioRecord.RECORDSTATE_RECORDING) { dinleyici.hata("failed"); return; }
            while (calisiyor) {
                int n = kayit.read(tampon, 0, tampon.length, AudioRecord.READ_BLOCKING);
                if (n < 0) { dinleyici.hata("failed"); break; }
                if (n == 0) continue;
                dinleyici.olcum(isleyici.blok(tampon, n), n / (double) ornekleme, kaynak);
            }
        } catch (Exception e) {
            if (calisiyor) dinleyici.hata("failed");
        } finally {
            try { kayit.stop(); } catch (Exception ignored) { /* zaten durmuş */ }
            kayit.release();
        }
    }
}
