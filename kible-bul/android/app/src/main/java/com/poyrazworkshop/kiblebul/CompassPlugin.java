package com.poyrazworkshop.kiblebul;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONException;

/**
 * Yerel pusula: telefonun dönme matrisini, manyetik algılayıcının Android doğruluk derecesini ve ölçülen alan şiddetini
 * sayfaya verir (www/js/compass.js). Özgün uygulamadaki CompassPlugin'in (Kıble Bul 1.0.1, KAYNAK.txt) birebir yeniden
 * yazımıdır; sayfa arayüzü aynıdır:
 *
 *   Compass.start()  → { available, rotationVector, magnetometer }   algılayıcıları açar
 *   Compass.stop()                                                   kapatır
 *   "reading" olayı  → { r: [9 sayı, satır sırası; cihaz eksenleri → doğu/kuzey/yukarı, MANYETİK kuzey],
 *                        acc: manyetometre doğruluğu (0 güvenilmez … 3 yüksek, -1 bilinmiyor),
 *                        rotAcc: dönme vektörü doğruluğu, field: ölçülen alan şiddeti (mikrotesla, 0 bilinmiyor) }
 *
 * Algılayıcılar: varsa TYPE_ROTATION_VECTOR (ivmeölçer + manyetometre + jiroskop füzyonu), yoksa ivmeölçer +
 * manyetometreden SensorManager.getRotationMatrix. Manyetometre her durumda dinlenir: doğruluk ve alan şiddeti
 * (kalibrasyon ve parazit uyarısı) ondan gelir. SENSOR_DELAY_GAME, sayfaya en sık 33 ms'de bir (≈30/sn) gönderilir.
 * Yumuşatma, sapma (manyetik → coğrafi kuzey, WMM 2025) ve kalite kararı sayfadadır (qibla.js, wmm.js, quality.js).
 * Uygulama arka plana geçince algılayıcılar kapanır, öne gelince (sayfa istiyorsa) yeniden açılır.
 */
@CapacitorPlugin(name = "Compass")
public class CompassPlugin extends Plugin implements SensorEventListener {

    private static final long MIN_INTERVAL_MS = 33;

    private SensorManager sm;
    private Sensor rotation;
    private Sensor magnetic;
    private Sensor accelerometer;

    private boolean wanted = false;
    private boolean listening = false;
    private boolean haveGravity = false;
    private boolean haveMagnetic = false;
    private final float[] matrix = new float[9];
    private final float[] gravity = new float[3];
    private final float[] geomagnetic = new float[3];
    private int magAccuracy = -1;
    private int rotAccuracy = -1;
    private float fieldUt = 0f;
    private long lastSent = 0;

    @Override
    public void load() {
        sm = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
        if (sm != null) {
            rotation = sm.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR);
            magnetic = sm.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD);
            accelerometer = sm.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        }
    }

    @PluginMethod
    public void start(PluginCall call) {
        wanted = true;
        register();
        JSObject ret = new JSObject();
        ret.put("rotationVector", rotation != null);
        ret.put("magnetometer", magnetic != null);
        ret.put("available", rotation != null || (magnetic != null && accelerometer != null));
        call.resolve(ret);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        wanted = false;
        unregister();
        call.resolve();
    }

    private void register() {
        if (listening || sm == null) return;
        if (rotation != null) {
            sm.registerListener(this, rotation, SensorManager.SENSOR_DELAY_GAME);
        } else if (accelerometer != null && magnetic != null) {
            sm.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_GAME);
        }
        if (magnetic != null) {
            sm.registerListener(this, magnetic, SensorManager.SENSOR_DELAY_GAME);
        }
        listening = true;
    }

    private void unregister() {
        if (!listening || sm == null) return;
        sm.unregisterListener(this);
        listening = false;
        haveGravity = false;
        haveMagnetic = false;
    }

    @Override
    protected void handleOnPause() {
        unregister();
    }

    @Override
    protected void handleOnResume() {
        if (wanted) register();
    }

    @Override
    protected void handleOnDestroy() {
        unregister();
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        int type = event.sensor.getType();
        if (type == Sensor.TYPE_ACCELEROMETER) {
            gravity[0] = event.values[0];
            gravity[1] = event.values[1];
            gravity[2] = event.values[2];
            haveGravity = true;
        } else if (type == Sensor.TYPE_MAGNETIC_FIELD) {
            float x = event.values[0], y = event.values[1], z = event.values[2];
            geomagnetic[0] = x;
            geomagnetic[1] = y;
            geomagnetic[2] = z;
            haveMagnetic = true;
            magAccuracy = event.accuracy;
            fieldUt = (float) Math.sqrt(x * x + y * y + z * z);
            // Dönme vektörü yoksa yön ivmeölçer + manyetometreden çıkar
            if (rotation == null && haveGravity && SensorManager.getRotationMatrix(matrix, null, gravity, geomagnetic)) {
                send();
            }
        } else if (type == Sensor.TYPE_ROTATION_VECTOR) {
            rotAccuracy = event.accuracy;
            SensorManager.getRotationMatrixFromVector(matrix, event.values);
            send();
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        if (sensor.getType() == Sensor.TYPE_MAGNETIC_FIELD) magAccuracy = accuracy;
        else if (sensor.getType() == Sensor.TYPE_ROTATION_VECTOR) rotAccuracy = accuracy;
    }

    private void send() {
        long now = System.currentTimeMillis();
        if (now - lastSent < MIN_INTERVAL_MS) return;
        lastSent = now;
        try {
            JSArray r = new JSArray();
            for (int i = 0; i < 9; i++) r.put((double) matrix[i]);
            JSObject ret = new JSObject();
            ret.put("r", r);
            ret.put("acc", magAccuracy);
            ret.put("rotAcc", rotAccuracy);
            ret.put("field", (double) fieldUt);
            notifyListeners("reading", ret);
        } catch (JSONException e) {
            // 9 sayı her zaman yazılır; olmazsa bu okuma atlanır
        }
    }
}
