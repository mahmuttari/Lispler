package com.poyrazworkshop.kiblebul;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONException;

/**
 * The phone's compass for the web page: the rotation matrix of the device (east / north / up, MAGNETIC north) plus what a web page cannot see:
 * how accurate Android says the magnetometer is (0 unreliable ... 3 high) and the strength of the magnetic field in microtesla.
 * The page compares the strength with the Earth's field expected at the place (World Magnetic Model): a magnet, a steel frame or an electronic device
 * nearby shows up as a field that is too strong or too weak, and then the direction is not to be trusted.
 * Events "reading": { r: [9 numbers, row-major], b: [3 numbers: the calibrated field in the phone's own axes, microtesla], acc: 0..3 (-1 unknown), rotAcc,
 * hacc: the rotation vector's own estimate of its heading error in radians (-1 when the phone does not say), field: microtesla }, about 30 times a second.
 * The page splits b with gravity (the last row of r) into the horizontal and the vertical part of the field and the dip angle, and compares them with the Earth's values.
 * If no reading arrives for five seconds the sensors are registered again (a sensor service that lost the listener would otherwise leave the compass frozen).
 */
@CapacitorPlugin(name = "Compass")
public class CompassPlugin extends Plugin implements SensorEventListener {
    private static final long MIN_INTERVAL_MS = 33;

    private SensorManager sm;
    private Sensor rotation, magnetic, accelerometer;
    private static final long SILENCE_MS = 5000, WATCH_EVERY_MS = 2000;

    private volatile boolean wanted = false;
    private boolean haveGravity = false, haveMagnetic = false;
    private volatile boolean listening = false;
    private volatile long lastEvent = 0;                // the last event of the sensor that drives the readings (the rotation vector, or the magnetometer in the fallback)
    private long lastMagAt = 0;
    private float headingAccRad = -1f;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable watchdog = new Runnable() {
        @Override
        public void run() {
            synchronized (CompassPlugin.this) {
                if (!listening || sm == null) return;
                if (SystemClock.elapsedRealtime() - lastEvent > SILENCE_MS) {
                    sm.unregisterListener(CompassPlugin.this);
                    haveGravity = false;
                    haveMagnetic = false;
                    registerSensors();
                    lastEvent = SystemClock.elapsedRealtime();
                }
                handler.postDelayed(this, WATCH_EVERY_MS);
            }
        }
    };
    private final float[] matrix = new float[9];
    private final float[] gravity = new float[3], geomagnetic = new float[3];
    private int magAccuracy = -1, rotAccuracy = -1;
    private float fieldUt = 0;
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
        JSObject r = new JSObject();
        r.put("rotationVector", rotation != null);
        r.put("magnetometer", magnetic != null);
        r.put("available", rotation != null || (magnetic != null && accelerometer != null));
        call.resolve(r);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        wanted = false;
        unregister();
        call.resolve();
    }

    private synchronized void register() {
        if (listening || sm == null) return;
        registerSensors();
        listening = true;
        lastEvent = SystemClock.elapsedRealtime();
        handler.removeCallbacks(watchdog);
        handler.postDelayed(watchdog, WATCH_EVERY_MS);
    }

    private void registerSensors() {
        if (rotation != null) sm.registerListener(this, rotation, SensorManager.SENSOR_DELAY_GAME);
        else if (accelerometer != null && magnetic != null) sm.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_GAME);   // no fused sensor: gravity + magnetic field
        if (magnetic != null) sm.registerListener(this, magnetic, SensorManager.SENSOR_DELAY_GAME);
    }

    private synchronized void unregister() {
        handler.removeCallbacks(watchdog);
        if (!listening || sm == null) return;
        sm.unregisterListener(this);
        listening = false;
        haveGravity = false;
        haveMagnetic = false;
    }

    // the sensors are a drain on the battery: off whenever the app is not in front
    @Override
    protected void handleOnPause() { unregister(); }

    @Override
    protected void handleOnResume() { if (wanted) register(); }

    @Override
    protected void handleOnDestroy() { unregister(); }

    @Override
    public void onSensorChanged(SensorEvent e) {
        int type = e.sensor.getType();
        // only the sensor that drives the readings counts for the watchdog
        if (type == Sensor.TYPE_ROTATION_VECTOR || (rotation == null && type == Sensor.TYPE_MAGNETIC_FIELD)) lastEvent = SystemClock.elapsedRealtime();
        switch (e.sensor.getType()) {
            case Sensor.TYPE_ROTATION_VECTOR:
                rotAccuracy = e.accuracy;
                headingAccRad = e.values.length > 4 ? e.values[4] : -1f;      // the sensor's own estimate of its heading error, radians (-1 when it does not say)
                SensorManager.getRotationMatrixFromVector(matrix, e.values);
                send();
                break;
            case Sensor.TYPE_MAGNETIC_FIELD:
                geomagnetic[0] = e.values[0]; geomagnetic[1] = e.values[1]; geomagnetic[2] = e.values[2];
                haveMagnetic = true;
                lastMagAt = SystemClock.elapsedRealtime();
                magAccuracy = e.accuracy;                       // every event carries the sensor's current rating (onAccuracyChanged only tells about changes)
                fieldUt = (float) Math.sqrt(e.values[0] * e.values[0] + e.values[1] * e.values[1] + e.values[2] * e.values[2]);
                if (rotation == null && haveGravity && SensorManager.getRotationMatrix(matrix, null, gravity, geomagnetic)) send();
                break;
            case Sensor.TYPE_ACCELEROMETER:
                gravity[0] = e.values[0]; gravity[1] = e.values[1]; gravity[2] = e.values[2];
                haveGravity = true;
                break;
            default:
                break;
        }
    }

    @Override
    public void onAccuracyChanged(Sensor s, int accuracy) {
        if (s.getType() == Sensor.TYPE_MAGNETIC_FIELD) magAccuracy = accuracy;
        else if (s.getType() == Sensor.TYPE_ROTATION_VECTOR) rotAccuracy = accuracy;
    }

    private void send() {
        long now = SystemClock.elapsedRealtime();          // a clock that does not step back
        if (now - lastSent < MIN_INTERVAL_MS) return;
        lastSent = now;
        JSArray r = new JSArray();
        try {
            for (int i = 0; i < 9; i++) r.put((double) matrix[i]);   // JSONArray.put(double) declares a JSONException (only for NaN / infinity)
        } catch (JSONException e) {
            return;
        }
        JSObject o = new JSObject();
        o.put("r", r);
        if (haveMagnetic && now - lastMagAt < 500) {        // the field must be as young as the matrix it is split with
            JSArray b = new JSArray();
            try {
                for (int i = 0; i < 3; i++) b.put((double) geomagnetic[i]);
                o.put("b", b);
            } catch (JSONException ignored) {
                // not a number: the page works without the field
            }
        }
        o.put("hacc", headingAccRad);
        o.put("acc", magAccuracy);
        o.put("rotAcc", rotAccuracy);
        o.put("field", fieldUt);
        notifyListeners("reading", o);
    }
}
