package com.poyrazworkshop.smartmeasure;

import android.Manifest;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.net.Uri;
import android.provider.Settings;
import android.util.DisplayMetrics;
import android.view.Window;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Smart Measure'ın telefon tarafı ("Olcer"): WebView'in güvenilir veremediği sensörler (yerçekimi / ivmeölçer,
 * dönme vektörü, ortam ışığı), mikrofonla ses düzeyi (SesOlcer), ekranın fiziksel piksel yoğunluğu (cetvel), kamera ve
 * mikrofon izinleri, pano, paylaşma, bağlantı açma, sistem çubukları ve ekranı açık tutma. Ağ kullanmaz.
 * Olaylar: "yercekimi" {x,y,z,t,kaynak}, "yonelim" {m: 9 sayı, t, kaynak}, "isik" {lux,t}, "ses" {hizli, blok, tepe,
 * kirpma, sure, kaynak}. Uygulama arka plana gidince hepsi durur; sayfa geri gelince yeniden başlatır.
 */
@CapacitorPlugin(
    name = "Olcer",
    permissions = {
        @Permission(alias = "camera", strings = { Manifest.permission.CAMERA }),
        @Permission(alias = "microphone", strings = { Manifest.permission.RECORD_AUDIO }),
    }
)
public class OlcerPlugin extends Plugin {
    private static final long YERCEKIMI_NS = 30_000_000L; // en sık ~33 olay/sn
    private static final long YONELIM_NS = 30_000_000L;
    private static final long ISIK_NS = 100_000_000L;

    private SensorManager sm;
    private SensorEventListener yercekimi, yonelim, isik;
    private SesOlcer ses;

    @Override
    public void load() {
        sm = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
    }

    private void olay(String ad, JSObject veri) {
        getBridge().executeOnMainThread(() -> notifyListeners(ad, veri));
    }

    private boolean var(int tur) {
        return sm != null && sm.getDefaultSensor(tur) != null;
    }

    // ---------------------------------------------------------------- bilgi
    @PluginMethod
    public void bilgi(PluginCall call) {
        JSObject r = new JSObject();
        r.put("debug", BuildConfig.DEBUG);
        r.put("versionName", BuildConfig.VERSION_NAME);
        r.put("versionCode", BuildConfig.VERSION_CODE);
        call.resolve(r);
    }

    @PluginMethod
    public void yetenekler(PluginCall call) {
        PackageManager pm = getContext().getPackageManager();
        JSObject s = new JSObject();
        s.put("accelerometer", var(Sensor.TYPE_ACCELEROMETER));
        s.put("gravity", var(Sensor.TYPE_GRAVITY));
        s.put("gyroscope", var(Sensor.TYPE_GYROSCOPE));
        s.put("rotationVector", var(Sensor.TYPE_ROTATION_VECTOR));
        s.put("gameRotationVector", var(Sensor.TYPE_GAME_ROTATION_VECTOR));
        s.put("light", var(Sensor.TYPE_LIGHT));
        JSObject r = new JSObject();
        r.put("sensors", s);
        r.put("microphone", pm.hasSystemFeature(PackageManager.FEATURE_MICROPHONE));
        r.put("rearCamera", pm.hasSystemFeature(PackageManager.FEATURE_CAMERA));
        r.put("flash", pm.hasSystemFeature(PackageManager.FEATURE_CAMERA_FLASH));
        boolean arcore;
        try {
            pm.getPackageInfo("com.google.ar.core", 0);
            arcore = true;
        } catch (PackageManager.NameNotFoundException e) {
            arcore = false;
        }
        r.put("arcore", arcore);
        DisplayMetrics dm = new DisplayMetrics();
        try {
            getActivity().getWindowManager().getDefaultDisplay().getRealMetrics(dm);
        } catch (Exception e) {
            dm = getContext().getResources().getDisplayMetrics();
        }
        DisplayMetrics dd = getContext().getResources().getDisplayMetrics();
        JSObject d = new JSObject();
        d.put("widthPx", dm.widthPixels);
        d.put("heightPx", dm.heightPixels);
        d.put("xdpi", (double) dd.xdpi);
        d.put("ydpi", (double) dd.ydpi);
        d.put("densityDpi", dd.densityDpi);
        d.put("density", (double) dd.density);
        r.put("display", d);
        call.resolve(r);
    }

    // ---------------------------------------------------------------- yerçekimi
    @PluginMethod
    public void yercekimiBaslat(PluginCall call) {
        yercekimiKapat();
        Sensor s = sm == null ? null : sm.getDefaultSensor(Sensor.TYPE_GRAVITY);
        final String kaynak = s != null ? "gravity" : "accelerometer";
        if (s == null && sm != null) s = sm.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        JSObject r = new JSObject();
        if (s == null) {
            r.put("var", false);
            call.resolve(r);
            return;
        }
        yercekimi = new SensorEventListener() {
            private long son = 0;
            private double tx, ty, tz;
            private int n;

            @Override
            public void onSensorChanged(SensorEvent e) {
                // Pencere ortalaması: ivmeölçerde örtüşme (aliasing) olmasın
                tx += e.values[0]; ty += e.values[1]; tz += e.values[2]; n++;
                if (e.timestamp - son < YERCEKIMI_NS) return;
                son = e.timestamp;
                JSObject o = new JSObject();
                o.put("x", tx / n); o.put("y", ty / n); o.put("z", tz / n);
                o.put("t", e.timestamp / 1e6);
                o.put("kaynak", kaynak);
                tx = ty = tz = 0; n = 0;
                notifyListeners("yercekimi", o);
            }

            @Override
            public void onAccuracyChanged(Sensor sensor, int accuracy) {}
        };
        sm.registerListener(yercekimi, s, SensorManager.SENSOR_DELAY_GAME);
        r.put("var", true);
        r.put("kaynak", kaynak);
        call.resolve(r);
    }

    @PluginMethod
    public void yercekimiDurdur(PluginCall call) {
        yercekimiKapat();
        call.resolve();
    }

    private void yercekimiKapat() {
        if (yercekimi != null && sm != null) sm.unregisterListener(yercekimi);
        yercekimi = null;
    }

    // ---------------------------------------------------------------- yönelim (kameranın yönü)
    @PluginMethod
    public void yonelimBaslat(PluginCall call) {
        yonelimKapat();
        // Oyun dönme vektörü pusula kullanmaz: içeride manyetik bozulmadan etkilenmez (göreli yön yeter)
        Sensor s = sm == null ? null : sm.getDefaultSensor(Sensor.TYPE_GAME_ROTATION_VECTOR);
        final String kaynak = s != null ? "game" : "rotation";
        if (s == null && sm != null) s = sm.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR);
        JSObject r = new JSObject();
        if (s == null) {
            r.put("var", false);
            call.resolve(r);
            return;
        }
        yonelim = new SensorEventListener() {
            private long son = 0;
            private final float[] m = new float[9];

            @Override
            public void onSensorChanged(SensorEvent e) {
                if (e.timestamp - son < YONELIM_NS) return;
                son = e.timestamp;
                SensorManager.getRotationMatrixFromVector(m, e.values);
                JSArray a = new JSArray();
                for (float v : m) {
                    try { a.put((double) v); } catch (Exception ignored) { /* sayı */ }
                }
                JSObject o = new JSObject();
                o.put("m", a);
                o.put("t", e.timestamp / 1e6);
                o.put("kaynak", kaynak);
                notifyListeners("yonelim", o);
            }

            @Override
            public void onAccuracyChanged(Sensor sensor, int accuracy) {}
        };
        sm.registerListener(yonelim, s, SensorManager.SENSOR_DELAY_GAME);
        r.put("var", true);
        r.put("kaynak", kaynak);
        call.resolve(r);
    }

    @PluginMethod
    public void yonelimDurdur(PluginCall call) {
        yonelimKapat();
        call.resolve();
    }

    private void yonelimKapat() {
        if (yonelim != null && sm != null) sm.unregisterListener(yonelim);
        yonelim = null;
    }

    // ---------------------------------------------------------------- ortam ışığı
    @PluginMethod
    public void isikBaslat(PluginCall call) {
        isikKapat();
        Sensor s = sm == null ? null : sm.getDefaultSensor(Sensor.TYPE_LIGHT);
        JSObject r = new JSObject();
        if (s == null) {
            r.put("var", false);
            call.resolve(r);
            return;
        }
        isik = new SensorEventListener() {
            private long son = 0;

            @Override
            public void onSensorChanged(SensorEvent e) {
                if (e.timestamp - son < ISIK_NS) return;
                son = e.timestamp;
                JSObject o = new JSObject();
                o.put("lux", (double) e.values[0]);
                o.put("t", e.timestamp / 1e6);
                notifyListeners("isik", o);
            }

            @Override
            public void onAccuracyChanged(Sensor sensor, int accuracy) {}
        };
        sm.registerListener(isik, s, SensorManager.SENSOR_DELAY_UI);
        r.put("var", true);
        call.resolve(r);
    }

    @PluginMethod
    public void isikDurdur(PluginCall call) {
        isikKapat();
        call.resolve();
    }

    private void isikKapat() {
        if (isik != null && sm != null) sm.unregisterListener(isik);
        isik = null;
    }

    // ---------------------------------------------------------------- ses düzeyi
    @PluginMethod
    public void sesBaslat(PluginCall call) {
        sesKapat();
        JSObject r = new JSObject();
        if (!getContext().getPackageManager().hasSystemFeature(PackageManager.FEATURE_MICROPHONE)) {
            r.put("var", false);
            r.put("neden", "missing");
            call.resolve(r);
            return;
        }
        if (getPermissionState("microphone") != PermissionState.GRANTED) {
            r.put("var", false);
            r.put("neden", "denied");
            call.resolve(r);
            return;
        }
        final JSONObject suzgecler = call.getObject("suzgecler", new JSObject());
        ses = SesOlcer.ac(getContext(), (fs) -> katsayilar(suzgecler, fs), new SesOlcer.Dinleyici() {
            @Override
            public void olcum(SesIsleyici.Sonuc s, double saniye, String kaynak) {
                JSObject o = new JSObject();
                o.put("hizli", s.hizli);
                o.put("blok", s.blok);
                o.put("tepe", s.tepe);
                o.put("kirpma", s.kirpma);
                o.put("sure", saniye);
                o.put("kaynak", kaynak);
                olay("ses", o);
            }

            @Override
            public void hata(String neden) {
                JSObject o = new JSObject();
                o.put("neden", neden);
                olay("sesHata", o);
            }
        });
        if (ses == null) {
            r.put("var", false);
            r.put("neden", "failed");
            call.resolve(r);
            return;
        }
        ses.basla();
        r.put("var", true);
        r.put("kaynak", ses.kaynak);
        call.resolve(r);
    }

    /** {"48000": [[b0,b1,b2,a1,a2], …], …} → fs için katsayılar. */
    private static double[][] katsayilar(JSONObject t, int fs) {
        try {
            JSONArray b = t.optJSONArray(String.valueOf(fs));
            if (b == null || b.length() == 0) return null;
            double[][] out = new double[b.length()][5];
            for (int i = 0; i < b.length(); i++) {
                JSONArray c = b.getJSONArray(i);
                for (int j = 0; j < 5; j++) out[i][j] = c.getDouble(j);
            }
            return out;
        } catch (Exception e) {
            return null;
        }
    }

    @PluginMethod
    public void sesDurdur(PluginCall call) {
        sesKapat();
        call.resolve();
    }

    private void sesKapat() {
        if (ses != null) ses.dur();
        ses = null;
    }

    // ---------------------------------------------------------------- yardımcılar
    @PluginMethod
    public void ayarlariAc(PluginCall call) {
        Intent i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.fromParts("package", getContext().getPackageName(), null));
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            getContext().startActivity(i);
        } catch (ActivityNotFoundException ignored) { /* yok */ }
        call.resolve();
    }

    /** https ve mailto bağlantıları: play.google.com Play Store'da, diğerleri tarayıcıda / e-posta uygulamasında açılır. */
    @PluginMethod
    public void baglantiAc(PluginCall call) {
        String url = call.getString("url", "");
        if (!url.startsWith("https://") && !url.startsWith("mailto:")) {
            call.reject("izin verilmeyen bağlantı");
            return;
        }
        Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            getContext().startActivity(i);
            call.resolve();
        } catch (ActivityNotFoundException e) {
            call.reject("açacak uygulama yok");
        }
    }

    @PluginMethod
    public void kopyala(PluginCall call) {
        String metin = call.getString("metin", "");
        getBridge().executeOnMainThread(() -> {
            ClipboardManager cb = (ClipboardManager) getContext().getSystemService(Context.CLIPBOARD_SERVICE);
            if (cb != null) cb.setPrimaryClip(ClipData.newPlainText("Smart Measure", metin));
            call.resolve();
        });
    }

    @PluginMethod
    public void paylas(PluginCall call) {
        Intent i = new Intent(Intent.ACTION_SEND);
        i.setType("text/plain");
        i.putExtra(Intent.EXTRA_TEXT, call.getString("metin", ""));
        Intent secici = Intent.createChooser(i, null);
        secici.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            getContext().startActivity(secici);
        } catch (ActivityNotFoundException ignored) { /* yok */ }
        call.resolve();
    }

    /** Sistem çubukları: koyu temada açık simgeler; renk: çubukların arkasında görünen pencere zemini. */
    @PluginMethod
    public void cubuklar(PluginCall call) {
        boolean koyu = Boolean.TRUE.equals(call.getBoolean("koyu", true));
        String renk = call.getString("renk", koyu ? "#000000" : "#F3F6FA");
        getBridge().executeOnMainThread(() -> {
            Window w = getActivity().getWindow();
            WindowInsetsControllerCompat c = WindowCompat.getInsetsController(w, w.getDecorView());
            c.setAppearanceLightStatusBars(!koyu);
            c.setAppearanceLightNavigationBars(!koyu);
            try {
                w.getDecorView().setBackgroundColor(Color.parseColor(renk));
            } catch (IllegalArgumentException ignored) { /* renk okunamadı */ }
            call.resolve();
        });
    }

    @PluginMethod
    public void ekranAcik(PluginCall call) {
        boolean acik = Boolean.TRUE.equals(call.getBoolean("acik", false));
        getBridge().executeOnMainThread(() -> {
            if (acik) getActivity().getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            else getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            call.resolve();
        });
    }

    // ---------------------------------------------------------------- yaşam döngüsü
    @Override
    protected void handleOnPause() {
        super.handleOnPause();
        yercekimiKapat();
        yonelimKapat();
        isikKapat();
        sesKapat();
    }

    @Override
    protected void handleOnDestroy() {
        yercekimiKapat();
        yonelimKapat();
        isikKapat();
        sesKapat();
        super.handleOnDestroy();
    }
}
