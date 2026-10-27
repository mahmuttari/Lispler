package com.poyrazworkshop.kiblebul;

import android.content.pm.ApplicationInfo;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

/**
 * Kıble Bul'un tek etkinliği. Özgün uygulamadaki (Kıble Bul 1.0.1, KAYNAK.txt) MainActivity'nin aynısı:
 * açılış ekranı, kenardan kenara pencere (iç boşlukları Capacitor'ın SystemBars eklentisi "native" kipte verir),
 * yerel pusula eklentisi ve sıkılaştırılmış WebView ayarları. Ek olarak KibleYerelPlugin (derleme türü, abonelik
 * yönetim sayfası).
 */
public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        SplashScreen.installSplashScreen(this);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        registerPlugin(CompassPlugin.class);
        registerPlugin(KibleYerelPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    protected void load() {
        super.load();
        if (bridge == null || bridge.getWebView() == null) return;
        WebSettings s = bridge.getWebView().getSettings();
        // Yakınlaştırma yok, yazı ölçeği sabit (kadran ve kartlar tasarlandığı gibi kalır)
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setTextZoom(100);
        // Sayfa yalnız uygulamanın kendi dosyalarını Capacitor'ın yerel sunucusundan okur
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setAllowFileAccessFromFileURLs(false);
        s.setAllowUniversalAccessFromFileURLs(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        // Konumu yerel Geolocation eklentisi alır (yalnız yaklaşık konum); WebView'in kendi konum izni kapalı
        s.setGeolocationEnabled(false);
        WebView.setWebContentsDebuggingEnabled((getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0);
    }
}
