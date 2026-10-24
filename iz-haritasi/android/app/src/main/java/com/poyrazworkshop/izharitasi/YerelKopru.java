package com.poyrazworkshop.izharitasi;

import android.Manifest;
import android.app.Activity;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothManager;
import android.bluetooth.le.BluetoothLeScanner;
import android.bluetooth.le.ScanCallback;
import android.bluetooth.le.ScanFilter;
import android.bluetooth.le.ScanRecord;
import android.bluetooth.le.ScanResult;
import android.bluetooth.le.ScanSettings;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.location.LocationManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Sayfaya "AirTagYerel" adıyla verilen köprü. Sözleşme js/yerel.js dosyasının başında yazılıdır.
 * JavascriptInterface yöntemleri WebView'in kendi iş parçacığında çağrılır; bütün işler ana iş parçacığına aktarılır.
 */
public class YerelKopru {
    static final int APPLE = 0x004C;
    static final byte FINDMY = 0x12;

    private final AnaEtkinlik etkinlik;
    private final WebView web;
    private final Handler ana = new Handler(Looper.getMainLooper());
    private final List<JSONObject> tampon = new ArrayList<>();
    private boolean akisPlanli;
    private boolean kapali;

    private BluetoothLeScanner tarayici;
    private ScanCallback taramaGeriCagri;

    private int kayitNo = -1;
    private String kayitAd;
    private String kayitIcerik;

    private final BroadcastReceiver btAlici = new BroadcastReceiver() {
        @Override
        public void onReceive(Context c, Intent i) {
            int durum = i.getIntExtra(BluetoothAdapter.EXTRA_STATE, BluetoothAdapter.ERROR);
            if ((durum == BluetoothAdapter.STATE_TURNING_OFF || durum == BluetoothAdapter.STATE_OFF)
                    && taramaGeriCagri != null) {
                taramayiKapat();
                js("tarama-durdu", nesne("neden", "bluetooth-kapandi"));
            }
        }
    };

    YerelKopru(AnaEtkinlik etkinlik, WebView web) {
        this.etkinlik = etkinlik;
        this.web = web;
        IntentFilter f = new IntentFilter(BluetoothAdapter.ACTION_STATE_CHANGED);
        if (Build.VERSION.SDK_INT >= 33) etkinlik.registerReceiver(btAlici, f, Context.RECEIVER_NOT_EXPORTED);
        else etkinlik.registerReceiver(btAlici, f);
    }

    BluetoothAdapter adaptor() {
        BluetoothManager m = (BluetoothManager) etkinlik.getSystemService(Context.BLUETOOTH_SERVICE);
        return m == null ? null : m.getAdapter();
    }

    static String[] taramaIzinleri() {
        if (Build.VERSION.SDK_INT >= 31) {
            return new String[] {Manifest.permission.BLUETOOTH_SCAN, Manifest.permission.BLUETOOTH_CONNECT,
                    Manifest.permission.ACCESS_FINE_LOCATION};
        }
        return new String[] {Manifest.permission.ACCESS_FINE_LOCATION};
    }

    static String[] baglantiIzinleri() {
        if (Build.VERSION.SDK_INT >= 31) return new String[] {Manifest.permission.BLUETOOTH_CONNECT};
        return new String[0];
    }

    // ---------- JS'ye açık yöntemler ----------

    @JavascriptInterface
    public String surum() {
        return "1";
    }

    @JavascriptInterface
    public String bluetoothDurumu() {
        BluetoothAdapter a = adaptor();
        if (a == null || !etkinlik.getPackageManager().hasSystemFeature(PackageManager.FEATURE_BLUETOOTH_LE)) {
            return "yok";
        }
        try {
            return a.isEnabled() ? "acik" : "kapali";
        } catch (SecurityException e) {
            return "bilinmiyor";
        }
    }

    /** Sistemin yazı boyutu çarpanı (Ayarlar → Ekran → Yazı tipi boyutu). Sayfa bunu CSS ölçeği olarak uygular. */
    @JavascriptInterface
    public float yaziOlcegi() {
        return etkinlik.getResources().getConfiguration().fontScale;
    }

    // ---------- Reklam (yalnız Google Play sürümü; js/yerel.js "reklamVar") ----------

    /** Sayfa dışa aktarımdan sonra çağırır; süre sınırını ve taramayı Reklam sınıfı denetler. */
    @JavascriptInterface
    public void reklamGoster() {
        ana.post(etkinlik::gecisReklami);
    }

    /** AB/İngiltere kullanıcısında onayı değiştirme yeri gösterilmeli mi (Google UMP). */
    @JavascriptInterface
    public boolean gizlilikSecenekleriGerekli() {
        return etkinlik.gizlilikSecenekleriGerekli();
    }

    @JavascriptInterface
    public void gizlilikSecenekleriAc() {
        ana.post(etkinlik::gizlilikSecenekleriAc);
    }

    boolean taraniyor() {
        return taramaGeriCagri != null;
    }

    @JavascriptInterface
    public void taramaBaslat(final int no) {
        ana.post(() -> etkinlik.izinIste(taramaIzinleri(), false,
                () -> taramayiAc(no),
                () -> sonuc(no, false, "izin", null)));
    }

    @JavascriptInterface
    public void taramaDurdur() {
        ana.post(this::taramayiKapat);
    }

    @JavascriptInterface
    public void sesCal(final int no, final String adres, final int sureMs) {
        ana.post(() -> etkinlik.izinIste(baglantiIzinleri(), false,
                () -> new GattIsi(this, etkinlik, GattIsi.SES, no, adres, sureMs).baslat(),
                () -> sonuc(no, false, "izin", null)));
    }

    @JavascriptInterface
    public void adOku(final int no, final String adres) {
        ana.post(() -> etkinlik.izinIste(baglantiIzinleri(), false,
                () -> new GattIsi(this, etkinlik, GattIsi.AD, no, adres, 0).baslat(),
                () -> sonuc(no, false, "izin", null)));
    }

    /** Sistemin "Kaydet" penceresi (Storage Access Framework): izin istemez, yeri kullanıcı seçer. */
    @JavascriptInterface
    public void dosyaKaydet(final int no, final String ad, final String mime, final String icerik) {
        ana.post(() -> {
            if (kayitNo >= 0) sonuc(kayitNo, false, "iptal", null);
            kayitNo = no;
            kayitAd = ad;
            kayitIcerik = icerik;
            Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT)
                    .addCategory(Intent.CATEGORY_OPENABLE)
                    .setType(mime)
                    .putExtra(Intent.EXTRA_TITLE, ad);
            try {
                etkinlik.sistemPenceresiAc(i, AnaEtkinlik.ISTEK_DOSYA_KAYDET);
            } catch (Exception e) {
                kayitBitir(false, "desteklenmiyor");
            }
        });
    }

    @JavascriptInterface
    public void ekranAcik(final boolean acik) {
        ana.post(() -> {
            if (acik) etkinlik.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            else etkinlik.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        });
    }

    @JavascriptInterface
    @SuppressWarnings("deprecation")
    public void titret(final int ms) {
        Vibrator v = (Vibrator) etkinlik.getSystemService(Context.VIBRATOR_SERVICE);
        if (v == null || !v.hasVibrator()) return;
        int sure = Math.max(1, Math.min(ms, 2000));
        if (Build.VERSION.SDK_INT >= 26) {
            v.vibrate(VibrationEffect.createOneShot(sure, VibrationEffect.DEFAULT_AMPLITUDE));
        } else {
            v.vibrate(sure);
        }
    }

    // ---------- Tarama ----------

    private void taramayiAc(int no) {
        BluetoothAdapter a = adaptor();
        if (a == null) {
            sonuc(no, false, "bluetooth-yok", null);
            return;
        }
        if (!a.isEnabled()) {
            sonuc(no, false, "bluetooth-kapali", null);
            return;
        }
        taramayiKapat();
        tarayici = a.getBluetoothLeScanner();
        if (tarayici == null) {
            sonuc(no, false, "bluetooth-kapali", null);
            return;
        }
        // Yalnız Apple üretici verisinde Find My türü (0x12) ile başlayan yayınlar (AirGuard'daki süzgeçle aynı)
        ScanFilter suzgec = new ScanFilter.Builder()
                .setManufacturerData(APPLE, new byte[] {FINDMY}, new byte[] {(byte) 0xFF})
                .build();
        ScanSettings ayar = new ScanSettings.Builder()
                .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
                .build();
        taramaGeriCagri = new ScanCallback() {
            @Override
            public void onScanResult(int tur, ScanResult r) {
                yayinEkle(r);
            }

            @Override
            public void onBatchScanResults(List<ScanResult> liste) {
                for (ScanResult r : liste) yayinEkle(r);
            }

            @Override
            public void onScanFailed(final int kod) {
                ana.post(() -> {
                    taramaGeriCagri = null;
                    js("tarama-durdu", nesne("neden", "hata-" + kod));
                });
            }
        };
        try {
            tarayici.startScan(Collections.singletonList(suzgec), ayar, taramaGeriCagri);
        } catch (SecurityException e) {
            taramaGeriCagri = null;
            sonuc(no, false, "izin", null);
            return;
        }
        sonuc(no, true, null, konumAcik() ? null : "konum-kapali");
    }

    void taramayiKapat() {
        if (tarayici != null && taramaGeriCagri != null) {
            try {
                tarayici.stopScan(taramaGeriCagri);
            } catch (SecurityException | IllegalStateException e) {
                // izin geri alınmış ya da Bluetooth kapanmış
            }
        }
        taramaGeriCagri = null;
    }

    @SuppressWarnings("deprecation")
    private boolean konumAcik() {
        LocationManager lm = (LocationManager) etkinlik.getSystemService(Context.LOCATION_SERVICE);
        if (lm == null) return false;
        if (Build.VERSION.SDK_INT >= 28) return lm.isLocationEnabled();
        return lm.isProviderEnabled(LocationManager.GPS_PROVIDER)
                || lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER);
    }

    // Tarama geri çağrısı Bluetooth iş parçacığında gelir; yayınlar 250 ms'lik paketlerle sayfaya iletilir
    private void yayinEkle(ScanResult r) {
        ScanRecord kayit = r.getScanRecord();
        if (kayit == null) return;
        byte[] veri = kayit.getManufacturerSpecificData(APPLE);
        if (veri == null || veri.length < 3 || veri[0] != FINDMY) return;
        try {
            JSONObject o = new JSONObject();
            o.put("adres", r.getDevice().getAddress());
            o.put("rssi", r.getRssi());
            o.put("veri", onaltilik(veri));
            String ad = kayit.getDeviceName();
            if (ad != null) o.put("ad", ad);
            synchronized (tampon) {
                tampon.add(o);
                if (tampon.size() > 1000) tampon.remove(0);
                if (!akisPlanli) {
                    akisPlanli = true;
                    ana.postDelayed(this::akit, 250);
                }
            }
        } catch (JSONException e) {
            // olmaz: alanlar sabit türde
        }
    }

    private void akit() {
        JSONArray paket = new JSONArray();
        synchronized (tampon) {
            for (JSONObject o : tampon) paket.put(o);
            tampon.clear();
            akisPlanli = false;
        }
        if (paket.length() > 0) js("yayinlar", paket);
    }

    static String onaltilik(byte[] b) {
        StringBuilder s = new StringBuilder(b.length * 2);
        for (byte x : b) s.append(String.format("%02x", x & 0xff));
        return s.toString();
    }

    // ---------- Dosya kaydetme sonucu ----------

    void kayitSonucu(int sonuc, Intent veri) {
        if (kayitNo < 0) return;
        if (sonuc != Activity.RESULT_OK || veri == null || veri.getData() == null) {
            kayitBitir(false, "iptal");
            return;
        }
        final Uri hedef = veri.getData();
        final String icerik = kayitIcerik;
        new Thread(() -> {
            boolean yazildi;
            try (OutputStream cikis = etkinlik.getContentResolver().openOutputStream(hedef, "wt")) {
                if (cikis == null) throw new java.io.IOException("akış yok");
                cikis.write(icerik.getBytes(StandardCharsets.UTF_8));
                yazildi = true;
            } catch (Exception e) {
                yazildi = false;
            }
            final boolean tamam = yazildi;
            ana.post(() -> kayitBitir(tamam, tamam ? null : "yazilamadi"));
        }).start();
    }

    private void kayitBitir(boolean tamam, String kod) {
        if (kayitNo < 0) return;
        sonuc(kayitNo, tamam, kod, tamam ? kayitAd : null);
        kayitNo = -1;
        kayitAd = null;
        kayitIcerik = null;
    }

    // ---------- Yaşam döngüsü ----------

    void arkaPlan() {
        if (taramaGeriCagri != null) {
            taramayiKapat();
            js("tarama-durdu", nesne("neden", "arkaplan"));
        }
        etkinlik.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    void kapat() {
        taramayiKapat();
        kapali = true;
        try {
            etkinlik.unregisterReceiver(btAlici);
        } catch (IllegalArgumentException e) {
            // kayıtlı değil
        }
    }

    // ---------- JS'ye ileti ----------

    void sonuc(int no, boolean tamam, String kod, String deger) {
        JSONObject o = new JSONObject();
        try {
            o.put("no", no);
            o.put("tamam", tamam);
            if (kod != null) o.put("kod", kod);
            if (deger != null) o.put("deger", deger);
        } catch (JSONException e) {
            // olmaz
        }
        js("sonuc", o);
    }

    private static JSONObject nesne(String anahtar, String deger) {
        JSONObject o = new JSONObject();
        try {
            o.put(anahtar, deger);
        } catch (JSONException e) {
            // olmaz
        }
        return o;
    }

    private void js(String tur, Object veri) {
        final String betik = "window.__airtagYerel&&window.__airtagYerel(" + JSONObject.quote(tur) + "," + veri + ")";
        ana.post(() -> {
            if (!kapali) web.evaluateJavascript(betik, null);
        });
    }
}
