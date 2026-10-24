package com.poyrazworkshop.izharitasi;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.graphics.Insets;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.GeolocationPermissions;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.window.OnBackInvokedDispatcher;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * İz Haritası (Google Play sürümü). Kaynak GENEL-KONULAR/airtag-harita/android'deki AirTag Harita'dır; farkı reklamdır
 * (Reklam.java: altta banner, dışa aktarımdan sonra geçiş reklamı). Ortak kısımdaki bir düzeltme iki depoya da işlenir.
 *
 * Tek ekran. Arayüz WebView'de çalışır: assets/www/index.html, web uygulamasının tek dosyalık derlemesidir
 * (GENEL-KONULAR'daki scripts/tek-dosya.mjs --ad "İz Haritası"; iz-haritasi/araclar/esitle.mjs kopyalar). Sayfa "güvenli bağlam" sayılsın diye (konum API'si bunu ister) dosyalar
 * https://appassets.androidplatform.net/ adresinden sunulur; Android bu adı bu iş için ayırmıştır, internette
 * çözülmez. Bluetooth işleri YerelKopru'dadır ve sayfaya "AirTagYerel" adıyla verilir.
 */
public class AnaEtkinlik extends Activity {
    static final String KOK_ALAN = "appassets.androidplatform.net";
    static final String KOK = "https://" + KOK_ALAN + "/";
    static final int ISTEK_DOSYA_SEC = 11;
    static final int ISTEK_DOSYA_KAYDET = 12;
    static final int ISTEK_IZIN = 21;

    private WebView web;
    private YerelKopru kopru;
    private Reklam reklam;
    private ValueCallback<Uri[]> dosyaGeriCagri;
    private Runnable izinTamam;
    private Runnable izinRed;
    private boolean izinEnAzBiri;
    // Uygulamanın kendi açtığı sistem penceresi (Kaydet, dosya seç) ekrandayken tarama durdurulmaz
    private boolean sistemPenceresi;

    // JavaScript gerekli; WebView yalnız uygulamanın içindeki sayfayı açar, dış bağlantılar tarayıcıya gider
    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle durum) {
        super.onCreate(durum);
        if ((getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
            WebView.setWebContentsDebuggingEnabled(true);
        }

        // Sayfa üstte, reklam bandı altta: bant sayfanın üstüne binmez
        LinearLayout kap = new LinearLayout(this);
        kap.setOrientation(LinearLayout.VERTICAL);
        web = new WebView(this);
        kap.addView(web, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f));
        FrameLayout bannerKap = new FrameLayout(this);
        bannerKap.setVisibility(View.GONE);
        kap.addView(bannerKap, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT));
        setContentView(kap);
        kenardanKenara(kap);

        WebSettings ayar = web.getSettings();
        ayar.setJavaScriptEnabled(true);
        ayar.setDomStorageEnabled(true);
        ayar.setGeolocationEnabled(true);
        ayar.setAllowFileAccess(false);
        ayar.setAllowContentAccess(false);
        ayar.setMediaPlaybackRequiresUserGesture(true);
        // Sayfa Chrome'daki gibi yerleşir: viewport etiketi (width=device-width) uygulanır. WebView'in metin
        // yakınlaştırması kapalıdır: varsayılanı sistemin yazı boyutunu izler ve sayfayı büyütürken yerleşim
        // genişliğini küçültmez, sayfa ekrandan taşar. Yazı boyutunu sayfa kendisi uygular (yaziOlcegi → CSS).
        ayar.setUseWideViewPort(true);
        ayar.setTextZoom(100);
        // OpenStreetMap karo kullanım kuralı: istek, uygulamayı adıyla tanıtan bir kullanıcı aracısıyla gelmeli
        // (iletişim adresi isteğe bağlı; operations.osmfoundation.org/policies/tiles). Önbellek varsayılan kalır:
        // WebView karoları sunucunun Cache-Control başlığına göre saklar, yeniden indirmez.
        ayar.setUserAgentString(ayar.getUserAgentString() + " IzHaritasi/" + surumAdi()
                + " (+https://mahmuttari.github.io/Lispler/iz-haritasi/)");

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest istek) {
                return varlik(istek.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest istek) {
                Uri adres = istek.getUrl();
                if (KOK_ALAN.equals(adres.getHost())) return false;
                // Dış bağlantılar (ör. OpenStreetMap telif sayfası) tarayıcıda açılır
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, adres));
                } catch (Exception e) {
                    // tarayıcı yok
                }
                return true;
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onGeolocationPermissionsShowPrompt(final String kaynak,
                    final GeolocationPermissions.Callback geri) {
                if (!KOK_ALAN.equals(Uri.parse(kaynak).getHost())) {
                    geri.invoke(kaynak, false, false);
                    return;
                }
                izinIste(new String[] {Manifest.permission.ACCESS_FINE_LOCATION,
                                Manifest.permission.ACCESS_COARSE_LOCATION},
                        true,
                        () -> geri.invoke(kaynak, true, false),
                        () -> geri.invoke(kaynak, false, false));
            }

            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> geri, FileChooserParams p) {
                if (dosyaGeriCagri != null) dosyaGeriCagri.onReceiveValue(null);
                dosyaGeriCagri = geri;
                // Items.data gibi uzantılar MIME türüne çevrilemediği için her dosya gösterilir
                Intent sec = new Intent(Intent.ACTION_GET_CONTENT)
                        .addCategory(Intent.CATEGORY_OPENABLE)
                        .setType("*/*");
                try {
                    sistemPenceresiAc(sec, ISTEK_DOSYA_SEC);
                } catch (Exception e) {
                    dosyaGeriCagri = null;
                    geri.onReceiveValue(null);
                }
                return true;
            }
        });

        kopru = new YerelKopru(this, web);
        reklam = new Reklam(this, bannerKap, kopru::taraniyor);
        reklam.baslat();
        web.addJavascriptInterface(kopru, "AirTagYerel");
        geriTusunuKur();
        web.loadUrl(KOK + "index.html");
    }

    /**
     * Android 15+ uygulamayı kenardan kenara çizer; sistem çubuklarının, kamera çentiğinin ve klavyenin payı kabın iç
     * boşluğu olur. Bu türler WebView'e sıfırlanarak geçer: geçmezse WebView (M144+) aynı payı sayfaya
     * env(safe-area-inset-*) olarak da verir ve boşluk iki kez bırakılır (Android belgesindeki "sıfırlama" yolu;
     * tüketmek yerine sıfırlamak WebView'in eski payı unutmasını sağlar).
     */
    @SuppressWarnings("deprecation")
    private void kenardanKenara(View kap) {
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
        } else {
            int bayrak = View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION;
            boolean acik = (getResources().getConfiguration().uiMode
                    & android.content.res.Configuration.UI_MODE_NIGHT_MASK)
                    != android.content.res.Configuration.UI_MODE_NIGHT_YES;
            if (acik) {
                bayrak |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                if (Build.VERSION.SDK_INT >= 26) bayrak |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            }
            getWindow().getDecorView().setSystemUiVisibility(bayrak);
        }
        kap.setOnApplyWindowInsetsListener((v, ic) -> {
            if (Build.VERSION.SDK_INT >= 30) {
                int turler = WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout()
                        | WindowInsets.Type.ime();
                Insets p = ic.getInsets(turler);
                v.setPadding(p.left, p.top, p.right, p.bottom);
                if (reklam != null) reklam.klavye(ic.isVisible(WindowInsets.Type.ime()));
                return new WindowInsets.Builder(ic).setInsets(turler, Insets.NONE).build();
            }
            v.setPadding(ic.getSystemWindowInsetLeft(), ic.getSystemWindowInsetTop(),
                    ic.getSystemWindowInsetRight(), ic.getSystemWindowInsetBottom());
            // Android 10 ve öncesi: alttaki pay ekranın beşte birinden büyükse klavye açıktır
            if (reklam != null) reklam.klavye(ic.getSystemWindowInsetBottom() > v.getRootView().getHeight() / 5);
            WindowInsets kalan = ic.replaceSystemWindowInsets(0, 0, 0, 0);
            return Build.VERSION.SDK_INT >= 28 ? kalan.consumeDisplayCutout() : kalan;
        });
    }

    private WebResourceResponse varlik(Uri adres) {
        if (!KOK_ALAN.equals(adres.getHost())) return null; // harita karoları ağdan gelir
        String yol = adres.getPath();
        if (yol == null || yol.isEmpty() || "/".equals(yol)) yol = "/index.html";
        if (yol.contains("..")) return bulunamadi();
        try {
            InputStream girdi = getAssets().open("www" + yol);
            WebResourceResponse y = new WebResourceResponse(tur(yol), "utf-8", girdi);
            Map<String, String> basliklar = new HashMap<>();
            basliklar.put("Cache-Control", "no-cache");
            y.setResponseHeaders(basliklar);
            return y;
        } catch (IOException e) {
            return bulunamadi();
        }
    }

    private static WebResourceResponse bulunamadi() {
        return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found",
                new HashMap<String, String>(), new ByteArrayInputStream(new byte[0]));
    }

    private static String tur(String yol) {
        if (yol.endsWith(".html")) return "text/html";
        if (yol.endsWith(".js")) return "text/javascript";
        if (yol.endsWith(".css")) return "text/css";
        if (yol.endsWith(".png")) return "image/png";
        if (yol.endsWith(".svg")) return "image/svg+xml";
        if (yol.endsWith(".json")) return "application/json";
        return "application/octet-stream";
    }

    private String surumAdi() {
        try {
            return getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
        } catch (PackageManager.NameNotFoundException e) {
            return "1";
        }
    }

    // ---------- İzinler ----------

    boolean izinliMi(String[] izinler, boolean enAzBiri) {
        int verilen = 0;
        for (String i : izinler) {
            if (checkSelfPermission(i) == PackageManager.PERMISSION_GRANTED) verilen++;
        }
        return enAzBiri ? (izinler.length == 0 || verilen > 0) : verilen == izinler.length;
    }

    /** İzin varsa hemen tamam çalışır; yoksa sistem penceresi açılır. enAzBiri: biri yeterli (yaklaşık konum gibi). */
    void izinIste(String[] izinler, boolean enAzBiri, Runnable tamam, Runnable red) {
        if (izinliMi(izinler, enAzBiri)) {
            tamam.run();
            return;
        }
        if (izinRed != null) izinRed.run(); // yanıtsız kalan önceki istek reddedilmiş sayılır
        izinTamam = tamam;
        izinRed = red;
        izinEnAzBiri = enAzBiri;
        requestPermissions(izinler, ISTEK_IZIN);
    }

    @Override
    public void onRequestPermissionsResult(int kod, String[] izinler, int[] sonuclar) {
        if (kod != ISTEK_IZIN) return;
        Runnable tamam = izinTamam;
        Runnable red = izinRed;
        izinTamam = null;
        izinRed = null;
        if (tamam == null) return;
        if (izinliMi(izinler, izinEnAzBiri)) tamam.run();
        else red.run();
    }

    // ---------- Dosya seçme ve kaydetme ----------

    void sistemPenceresiAc(Intent istek, int kod) {
        sistemPenceresi = true;
        try {
            startActivityForResult(istek, kod);
        } catch (RuntimeException e) {
            sistemPenceresi = false;
            throw e;
        }
    }

    @Override
    protected void onActivityResult(int kod, int sonuc, Intent veri) {
        sistemPenceresi = false;
        if (kod == ISTEK_DOSYA_SEC) {
            if (dosyaGeriCagri != null) {
                Uri[] secilen = null;
                if (sonuc == RESULT_OK && veri != null && veri.getData() != null) {
                    secilen = new Uri[] {veri.getData()};
                }
                dosyaGeriCagri.onReceiveValue(secilen);
                dosyaGeriCagri = null;
            }
        } else if (kod == ISTEK_DOSYA_KAYDET) {
            kopru.kayitSonucu(sonuc, veri);
        } else {
            super.onActivityResult(kod, sonuc, veri);
        }
    }

    // ---------- Geri tuşu: önce açık pencere kapanır ----------

    private void geriTusunuKur() {
        if (Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                    OnBackInvokedDispatcher.PRIORITY_DEFAULT, this::geri);
        }
    }

    // API 33+ geri hareketi yukarıdaki platform geri çağrısına gelir; bu yöntem yalnız Android 12 ve öncesi içindir
    @SuppressLint("GestureBackNavigation")
    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        geri();
    }

    private void geri() {
        web.evaluateJavascript(
                "(function(){var d=document.querySelectorAll('dialog[open]');"
                        + "if(d.length){d[d.length-1].close();return true}return false})()",
                sonuc -> {
                    if (!"true".equals(sonuc)) moveTaskToBack(true);
                });
    }

    // ---------- Reklam (köprüden) ----------

    void gecisReklami() {
        if (reklam != null) reklam.gecisFirsati();
    }

    boolean gizlilikSecenekleriGerekli() {
        return reklam != null && reklam.gizlilikSecenekleriGerekli();
    }

    void gizlilikSecenekleriAc() {
        if (reklam != null) reklam.gizlilikSecenekleriAc();
    }

    // ---------- Yaşam döngüsü ----------

    @Override
    protected void onResume() {
        super.onResume();
        if (reklam != null) reklam.surdur();
    }

    @Override
    protected void onPause() {
        if (reklam != null) reklam.duraklat();
        super.onPause();
    }

    @Override
    protected void onStart() {
        super.onStart();
        web.onResume();
    }

    @Override
    protected void onStop() {
        // Uygulama görünmez olunca tarama durur. İzin penceresi gibi yarı saydam ekranlar onStop çağırmaz;
        // uygulamanın kendi açtığı Kaydet ve dosya seç pencereleri de taramayı durdurmaz.
        if (!sistemPenceresi) kopru.arkaPlan();
        web.onPause();
        super.onStop();
    }

    @Override
    protected void onDestroy() {
        if (reklam != null) reklam.kapat();
        kopru.kapat();
        web.destroy();
        super.onDestroy();
    }
}
