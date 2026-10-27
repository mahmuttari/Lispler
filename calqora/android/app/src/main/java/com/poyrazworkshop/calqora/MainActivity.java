package com.poyrazworkshop.calqora;

import android.content.pm.ApplicationInfo;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

/**
 * Calqora'nın tek etkinliği. Özgün APK'daki MainActivity'nin aynısı (androguard ile okundu): açılış ekranı API'si,
 * kenardan kenara pencere (sistem çubuklarının payını SystemBars "native" kipi ve CSS env() verir) ve WebView'in
 * sıkılaştırılması (yakınlaştırma yok, yazı boyutu sabit, dosya erişimi yok, karışık içerik yok, konum yok).
 */
public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen.installSplashScreen(this);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        super.onCreate(savedInstanceState);
    }

    @Override
    protected void load() {
        super.load();
        if (bridge == null) return;
        WebView webView = bridge.getWebView();
        if (webView == null) return;
        WebSettings s = webView.getSettings();
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setTextZoom(100);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setAllowFileAccessFromFileURLs(false);
        s.setAllowUniversalAccessFromFileURLs(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setGeolocationEnabled(false);
        WebView.setWebContentsDebuggingEnabled((getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0);
    }
}
