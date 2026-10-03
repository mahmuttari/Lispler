package com.lispler.notdefteri;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.OpenableColumns;
import android.graphics.Rect;
import android.os.SystemClock;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.window.OnBackInvokedDispatcher;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/**
 * Not Defteri arayüzü assets/index.html içindedir; bu etkinlik onu bir WebView'da
 * gösterir ve dosya aç/kaydet, pano ve paylaş için JavaScript'e "NativeApp" köprüsü sağlar.
 */
public class MainActivity extends Activity {

    private static final int REQ_OPEN = 1;
    private static final int REQ_SAVE = 2;
    private static final long MAX_FILE_SIZE = 20L * 1024 * 1024;

    private WebView webView;
    private LinearLayout root;
    private AdsManager ads;
    private BillingManager billing;
    private boolean pageReady = false;
    // Kendi açtığımız ekranlardan (dosya seçici, ödeme, paylaş) dönüşte açılış reklamı gösterilmesin
    private boolean expectingReturn = false;
    private long pausedAt = 0;
    private Intent pendingViewIntent;

    // Sistem dosya seçicisinden dönüşü beklenen istek
    private String pendingCallbackId;
    private String pendingSaveContent;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Düzen: üstte WebView (editör), altta reklam bandı
        root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.parseColor("#f3f3f3"));
        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#f3f3f3"));
        root.addView(webView, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));
        FrameLayout bannerContainer = new FrameLayout(this);
        bannerContainer.setVisibility(View.GONE);
        root.addView(bannerContainer, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        setContentView(root);
        setupInsets();
        setupBack();

        ads = new AdsManager(this, bannerContainer);
        billing = new BillingManager(this, isPro -> runOnUiThread(() -> {
            ads.setEnabled(!isPro);
            js("window.onProChanged && window.onProChanged(" + isPro + ")");
        }));
        billing.start();
        if (!billing.isPro()) ads.start();
        else ads.setEnabled(false);

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setTextZoom(100);
        s.setSupportMultipleWindows(false);

        webView.addJavascriptInterface(new Bridge(), "NativeApp");
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme();
                if ("file".equals(scheme) || "about".equals(scheme) || "data".equals(scheme) || "blob".equals(scheme)) {
                    return false;
                }
                // Çalıştırılan sayfadaki dış bağlantılar tarayıcıda açılsın, uygulama kaybolmasın
                if (request.isForMainFrame()) {
                    expectingReturn = true;
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, uri));
                    } catch (Exception ignored) {
                    }
                    return true;
                }
                return false;
            }
        });

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        }
        if (webView.getUrl() == null) {
            webView.loadUrl("file:///android_asset/index.html");
        }

        handleViewIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleViewIntent(intent);
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }

    @Override
    protected void onPause() {
        super.onPause();
        pausedAt = SystemClock.elapsedRealtime();
        ads.onPause();
        // Taslağı hemen kaydet (uygulama arka plana atılınca)
        webView.evaluateJavascript("window.dispatchEvent(new Event('beforeunload'))", null);
    }

    @Override
    protected void onResume() {
        super.onResume();
        ads.onResume();
        if (pausedAt > 0 && !expectingReturn && !ads.isShowingFullscreen()) {
            ads.onReturnFromBackground(SystemClock.elapsedRealtime() - pausedAt);
        }
        expectingReturn = false;
        // Abonelik başka cihazda iptal/yenilenmiş olabilir
        if (pausedAt > 0) billing.refresh(null);
    }

    @Override
    protected void onDestroy() {
        ads.onDestroy();
        super.onDestroy();
    }

    /* ---------- Geri tuşu ---------- */

    private void setupBack() {
        if (Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                    OnBackInvokedDispatcher.PRIORITY_DEFAULT, this::handleBack);
        }
    }

    private void handleBack() {
        webView.evaluateJavascript("window.handleBack ? window.handleBack() : false", value -> {
            if (!"true".equals(value)) {
                moveTaskToBack(true);
            }
        });
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        handleBack();
    }

    /* ---------- Kenardan kenara ekran ve klavye ---------- */

    private void setupInsets() {
        if (Build.VERSION.SDK_INT >= 30) {
            // Android 15+ kenardan kenara zorunlu: sistem çubukları ve klavye kadar boşluğu kendimiz bırakırız
            getWindow().setDecorFitsSystemWindows(false);
            root.setOnApplyWindowInsetsListener((v, insets) -> {
                android.graphics.Insets bars = insets.getInsets(
                        WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                android.graphics.Insets ime = insets.getInsets(WindowInsets.Type.ime());
                v.setPadding(bars.left, bars.top, bars.right, Math.max(bars.bottom, ime.bottom));
                if (ads != null) ads.setKeyboardVisible(ime.bottom > 0);
                return WindowInsets.CONSUMED;
            });
        } else {
            root.getViewTreeObserver().addOnGlobalLayoutListener(() -> {
                Rect r = new Rect();
                root.getWindowVisibleDisplayFrame(r);
                int full = root.getRootView().getHeight();
                if (ads != null) ads.setKeyboardVisible(full - r.bottom > full * 0.2);
            });
        }
    }

    /* ---------- "Birlikte aç" ile gelen dosya ---------- */

    private void handleViewIntent(Intent intent) {
        if (intent == null || intent.getData() == null) return;
        String action = intent.getAction();
        if (!Intent.ACTION_VIEW.equals(action) && !Intent.ACTION_EDIT.equals(action)) return;
        if (!pageReady) {
            pendingViewIntent = intent;
            return;
        }
        Uri uri = intent.getData();
        boolean canWrite = (intent.getFlags() & Intent.FLAG_GRANT_WRITE_URI_PERMISSION) != 0;
        if (canWrite) {
            try {
                getContentResolver().takePersistableUriPermission(uri,
                        Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            } catch (Exception ignored) {
            }
        }
        try {
            String content = readUri(uri);
            String name = displayName(uri);
            js("window.openExternalFile && window.openExternalFile(" + q(name) + "," + q(content) + ","
                    + (canWrite ? q(uri.toString()) : "null") + ")");
        } catch (Exception e) {
            js("alert(" + q("Dosya açılamadı: " + e.getMessage()) + ")");
        }
    }

    /* ---------- Sistem dosya seçicisi ---------- */

    @Override
    @SuppressWarnings("deprecation")
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        String cb = pendingCallbackId;
        String content = pendingSaveContent;
        pendingCallbackId = null;
        pendingSaveContent = null;
        if (cb == null) return;

        if (resultCode != RESULT_OK || data == null || data.getData() == null) {
            callback(cb, null);
            return;
        }
        Uri uri = data.getData();
        try {
            getContentResolver().takePersistableUriPermission(uri,
                    Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
        } catch (Exception ignored) {
            // Bazı sağlayıcılar kalıcı izin vermez; bu oturumda yine de çalışır.
        }

        JSONObject res = new JSONObject();
        try {
            if (requestCode == REQ_OPEN) {
                res.put("name", displayName(uri));
                res.put("content", readUri(uri));
                res.put("uri", uri.toString());
            } else if (requestCode == REQ_SAVE) {
                writeUri(uri, content == null ? "" : content);
                res.put("name", displayName(uri));
                res.put("uri", uri.toString());
            }
        } catch (Exception e) {
            res = new JSONObject();
            try {
                res.put("error", String.valueOf(e.getMessage()));
            } catch (Exception ignored) {
            }
        }
        callback(cb, res.toString());
    }

    /* ---------- Yardımcılar ---------- */

    private String readUri(Uri uri) throws Exception {
        try (InputStream in = getContentResolver().openInputStream(uri)) {
            if (in == null) throw new Exception("dosya okunamadı");
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[16384];
            int n;
            long total = 0;
            while ((n = in.read(buf)) > 0) {
                total += n;
                if (total > MAX_FILE_SIZE) throw new Exception("dosya çok büyük (en fazla 20 MB)");
                out.write(buf, 0, n);
            }
            String text = new String(out.toByteArray(), StandardCharsets.UTF_8);
            if (text.startsWith("﻿")) text = text.substring(1);  // UTF-8 BOM
            return text;
        }
    }

    private void writeUri(Uri uri, String content) throws Exception {
        OutputStream out;
        try {
            out = getContentResolver().openOutputStream(uri, "wt");
        } catch (Exception e) {
            out = getContentResolver().openOutputStream(uri, "w");
        }
        if (out == null) throw new Exception("dosyaya yazılamadı");
        try (OutputStream o = out) {
            o.write(content.getBytes(StandardCharsets.UTF_8));
            o.flush();
        }
    }

    private String displayName(Uri uri) {
        String name = null;
        if ("content".equals(uri.getScheme())) {
            try (Cursor c = getContentResolver().query(uri, new String[]{OpenableColumns.DISPLAY_NAME}, null, null, null)) {
                if (c != null && c.moveToFirst()) name = c.getString(0);
            } catch (Exception ignored) {
            }
        }
        if (name == null) name = uri.getLastPathSegment();
        if (name == null) name = "Adsız.txt";
        int slash = name.lastIndexOf('/');
        return slash >= 0 ? name.substring(slash + 1) : name;
    }

    private static String q(String s) {
        return s == null ? "null" : JSONObject.quote(s);
    }

    private void js(String code) {
        runOnUiThread(() -> webView.evaluateJavascript(code, null));
    }

    private void callback(String id, String json) {
        js("window.__nativeCb(" + q(id) + "," + (json == null ? "null" : json) + ")");
    }

    private static String mimeFor(String name) {
        String n = name == null ? "" : name.toLowerCase();
        if (n.endsWith(".html") || n.endsWith(".htm")) return "text/html";
        if (n.endsWith(".css")) return "text/css";
        if (n.endsWith(".js")) return "application/javascript";
        if (n.endsWith(".json")) return "application/json";
        if (n.endsWith(".xml")) return "text/xml";
        if (n.endsWith(".svg")) return "image/svg+xml";
        if (n.endsWith(".md")) return "text/markdown";
        if (n.endsWith(".csv")) return "text/csv";
        return "text/plain";
    }

    /* ---------- JavaScript köprüsü ---------- */

    private class Bridge {

        @JavascriptInterface
        public void ready() {
            runOnUiThread(() -> {
                pageReady = true;
                if (pendingViewIntent != null) {
                    Intent i = pendingViewIntent;
                    pendingViewIntent = null;
                    handleViewIntent(i);
                }
            });
        }

        @JavascriptInterface
        @SuppressWarnings("deprecation")
        public void openFile(String callbackId) {
            runOnUiThread(() -> {
                Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("*/*");
                i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION
                        | Intent.FLAG_GRANT_WRITE_URI_PERMISSION
                        | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
                pendingCallbackId = callbackId;
                expectingReturn = true;
                try {
                    startActivityForResult(i, REQ_OPEN);
                } catch (Exception e) {
                    pendingCallbackId = null;
                    callback(callbackId, "{\"error\":" + q("Dosya seçici açılamadı") + "}");
                }
            });
        }

        @JavascriptInterface
        @SuppressWarnings("deprecation")
        public void saveFileAs(String callbackId, String name, String content) {
            runOnUiThread(() -> {
                Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType(mimeFor(name));
                i.putExtra(Intent.EXTRA_TITLE, name);
                pendingCallbackId = callbackId;
                pendingSaveContent = content;
                expectingReturn = true;
                try {
                    startActivityForResult(i, REQ_SAVE);
                } catch (Exception e) {
                    pendingCallbackId = null;
                    pendingSaveContent = null;
                    callback(callbackId, "{\"error\":" + q("Dosya seçici açılamadı") + "}");
                }
            });
        }

        @JavascriptInterface
        public void writeFile(String callbackId, String uri, String content) {
            String res;
            try {
                writeUri(Uri.parse(uri), content);
                res = "{\"ok\":true}";
            } catch (Exception e) {
                res = "{\"error\":" + q(String.valueOf(e.getMessage())) + "}";
            }
            callback(callbackId, res);
        }

        @JavascriptInterface
        public void setClipboard(String text) {
            ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
            if (cm != null) cm.setPrimaryClip(ClipData.newPlainText("Not Defteri", text));
        }

        @JavascriptInterface
        public String getClipboard() {
            ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
            if (cm == null || !cm.hasPrimaryClip()) return "";
            ClipData clip = cm.getPrimaryClip();
            if (clip == null || clip.getItemCount() == 0) return "";
            CharSequence t = clip.getItemAt(0).coerceToText(MainActivity.this);
            return t == null ? "" : t.toString();
        }

        @JavascriptInterface
        public void share(String name, String content) {
            runOnUiThread(() -> {
                Intent i = new Intent(Intent.ACTION_SEND);
                i.setType("text/plain");
                i.putExtra(Intent.EXTRA_SUBJECT, name);
                i.putExtra(Intent.EXTRA_TEXT, content);
                expectingReturn = true;
                startActivity(Intent.createChooser(i, "Paylaş: " + name));
            });
        }

        /* ---- Pro abonelik ---- */

        @JavascriptInterface
        public void getProInfo(String callbackId) {
            billing.getInfo(r -> callback(callbackId, r.toString()));
        }

        @JavascriptInterface
        public void buyPro(String callbackId) {
            expectingReturn = true;
            billing.buy(MainActivity.this, r -> callback(callbackId, r.toString()));
        }

        @JavascriptInterface
        public void restorePro(String callbackId) {
            billing.refresh(r -> callback(callbackId, r.toString()));
        }

        @JavascriptInterface
        public void manageSubscription() {
            openUrl(billing.manageUrl());
        }

        @JavascriptInterface
        public void openUrl(String url) {
            runOnUiThread(() -> {
                expectingReturn = true;
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                } catch (Exception ignored) {
                }
            });
        }

        /* ---- Reklam ---- */

        /** JS doğal geçiş anlarını bildirir (önizlemeden çıkış, kaydet, aç, yeni). */
        @JavascriptInterface
        public void adBreak(String reason) {
            runOnUiThread(() -> {
                if (!billing.isPro()) ads.onNaturalBreak();
            });
        }

        @JavascriptInterface
        public String platform() {
            return "android";
        }

        @JavascriptInterface
        public void setBarColor(String color, boolean dark) {
            runOnUiThread(() -> {
                try {
                    int c = Color.parseColor(color);
                    Window w = getWindow();
                    root.setBackgroundColor(c);
                    webView.setBackgroundColor(c);
                    if (Build.VERSION.SDK_INT >= 30) {
                        WindowInsetsController ic = w.getInsetsController();
                        if (ic != null) {
                            int light = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                                    | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
                            ic.setSystemBarsAppearance(dark ? 0 : light, light);
                        }
                        if (Build.VERSION.SDK_INT < 35) {
                            w.setStatusBarColor(c);
                            w.setNavigationBarColor(c);
                        }
                        return;
                    }
                    w.setStatusBarColor(c);
                    w.setNavigationBarColor(c);
                    View d = w.getDecorView();
                    int flags = d.getSystemUiVisibility();
                    if (dark) {
                        flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                        if (Build.VERSION.SDK_INT >= 26) flags &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                    } else {
                        flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                        if (Build.VERSION.SDK_INT >= 26) flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                    }
                    d.setSystemUiVisibility(flags);
                } catch (Exception ignored) {
                }
            });
        }
    }
}
