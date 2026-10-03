package com.lispler.notdefteri;

import android.app.Activity;
import android.os.SystemClock;
import android.util.DisplayMetrics;
import android.view.View;
import android.widget.FrameLayout;

import androidx.annotation.NonNull;

import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.appopen.AppOpenAd;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;
import com.google.android.ump.ConsentInformation;
import com.google.android.ump.ConsentRequestParameters;
import com.google.android.ump.UserMessagingPlatform;

import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Ücretsiz sürümdeki reklamlar: alt banner, geçiş (interstitial) reklamı ve uygulama açılış reklamı.
 * Pro abonelerde hiçbiri yüklenmez.
 */
class AdsManager {

    /* ---- Reklam sıklığı ayarları ---- */
    // İki tam ekran reklam arasında en az bu kadar süre geçer.
    // Çok düşürmek AdMob politikasına aykırıdır ve hesabın kapatılmasına yol açabilir.
    static final long MIN_FULLSCREEN_INTERVAL_MS = 60_000;
    // Uygulama en az bu kadar arka planda kaldıysa dönüşte açılış reklamı gösterilir.
    static final long APP_OPEN_AFTER_BACKGROUND_MS = 30_000;
    // Soğuk açılışta açılış reklamı ancak bu süre içinde yüklendiyse gösterilir (geç gelirse rahatsız eder).
    static final long COLD_START_WINDOW_MS = 4_000;

    private final Activity activity;
    private final FrameLayout bannerContainer;
    private final AtomicBoolean sdkStarted = new AtomicBoolean(false);

    private boolean enabled = true;
    private boolean adsReady = false;
    private boolean keyboardVisible = false;
    private AdView banner;
    private InterstitialAd interstitial;
    private AppOpenAd appOpenAd;
    private boolean showingFullscreen = false;
    private long lastFullscreenAt = 0;
    private final long createdAt = SystemClock.elapsedRealtime();
    private boolean coldStartAdShown = false;

    AdsManager(Activity activity, FrameLayout bannerContainer) {
        this.activity = activity;
        this.bannerContainer = bannerContainer;
    }

    /** Uygulama açılınca: önce (AB/İngiltere için) izin formu, sonra reklamlar. */
    void start() {
        if (!enabled) return;
        ConsentInformation consent = UserMessagingPlatform.getConsentInformation(activity);
        consent.requestConsentInfoUpdate(activity, new ConsentRequestParameters.Builder().build(),
                () -> UserMessagingPlatform.loadAndShowConsentFormIfRequired(activity, error -> {
                    if (consent.canRequestAds()) startSdk();
                }),
                error -> {
                    if (consent.canRequestAds()) startSdk();
                });
        if (consent.canRequestAds()) startSdk();
    }

    private void startSdk() {
        if (!enabled || sdkStarted.getAndSet(true)) return;
        new Thread(() -> MobileAds.initialize(activity, status -> activity.runOnUiThread(() -> {
            adsReady = true;
            loadBanner();
            loadInterstitial();
            loadAppOpen();
        }))).start();
    }

    /** Pro olunca reklamları tamamen kapatır. */
    void setEnabled(boolean on) {
        enabled = on;
        if (!on) {
            if (banner != null) {
                bannerContainer.removeAllViews();
                banner.destroy();
                banner = null;
            }
            bannerContainer.setVisibility(View.GONE);
            interstitial = null;
            appOpenAd = null;
        } else if (sdkStarted.get()) {
            loadBanner();
            loadInterstitial();
            loadAppOpen();
        } else {
            start();
        }
    }

    /** Klavye açıkken banner gizlenir (yanlışlıkla tıklamayı önler, AdMob kuralı). */
    void setKeyboardVisible(boolean visible) {
        keyboardVisible = visible;
        updateBannerVisibility();
    }

    private void updateBannerVisibility() {
        bannerContainer.setVisibility(enabled && banner != null && !keyboardVisible ? View.VISIBLE : View.GONE);
    }

    /* ---------- Banner ---------- */

    private void loadBanner() {
        if (!enabled || !adsReady || banner != null) return;
        banner = new AdView(activity);
        banner.setAdUnitId(BuildConfig.BANNER_ID);
        DisplayMetrics dm = activity.getResources().getDisplayMetrics();
        int widthDp = (int) (dm.widthPixels / dm.density);
        banner.setAdSize(AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize(activity, widthDp));
        bannerContainer.removeAllViews();
        bannerContainer.addView(banner);
        banner.loadAd(new AdRequest.Builder().build());
        updateBannerVisibility();
    }

    void onPause() {
        if (banner != null) banner.pause();
    }

    void onResume() {
        if (banner != null) banner.resume();
    }

    void onDestroy() {
        if (banner != null) banner.destroy();
    }

    /* ---------- Geçiş reklamı ---------- */

    private void loadInterstitial() {
        if (!enabled || !adsReady || interstitial != null) return;
        InterstitialAd.load(activity, BuildConfig.INTERSTITIAL_ID, new AdRequest.Builder().build(),
                new InterstitialAdLoadCallback() {
                    @Override
                    public void onAdLoaded(@NonNull InterstitialAd ad) {
                        interstitial = ad;
                    }

                    @Override
                    public void onAdFailedToLoad(@NonNull LoadAdError error) {
                        interstitial = null;
                    }
                });
    }

    private boolean canShowFullscreen() {
        return enabled && !showingFullscreen
                && SystemClock.elapsedRealtime() - lastFullscreenAt >= MIN_FULLSCREEN_INTERVAL_MS;
    }

    /**
     * Doğal geçiş anlarında çağrılır (HTML önizlemeden çıkış, kaydetme, dosya açma, yeni belge).
     * Süre sınırı dolduysa ve reklam hazırsa geçiş reklamı gösterir.
     */
    void onNaturalBreak() {
        if (!canShowFullscreen()) return;
        if (interstitial == null) {
            loadInterstitial();
            return;
        }
        InterstitialAd ad = interstitial;
        interstitial = null;
        ad.setFullScreenContentCallback(new FullScreenContentCallback() {
            @Override
            public void onAdDismissedFullScreenContent() {
                showingFullscreen = false;
                lastFullscreenAt = SystemClock.elapsedRealtime();
                loadInterstitial();
            }

            @Override
            public void onAdFailedToShowFullScreenContent(@NonNull AdError error) {
                showingFullscreen = false;
                loadInterstitial();
            }
        });
        showingFullscreen = true;
        lastFullscreenAt = SystemClock.elapsedRealtime();
        ad.show(activity);
    }

    /* ---------- Uygulama açılış reklamı ---------- */

    private void loadAppOpen() {
        if (!enabled || !adsReady || appOpenAd != null) return;
        AppOpenAd.load(activity, BuildConfig.APP_OPEN_ID, new AdRequest.Builder().build(),
                new AppOpenAd.AppOpenAdLoadCallback() {
                    @Override
                    public void onAdLoaded(@NonNull AppOpenAd ad) {
                        appOpenAd = ad;
                        // Soğuk açılış: reklam hızlı geldiyse hemen göster
                        if (!coldStartAdShown && SystemClock.elapsedRealtime() - createdAt < COLD_START_WINDOW_MS) {
                            coldStartAdShown = true;
                            showAppOpen();
                        }
                    }

                    @Override
                    public void onAdFailedToLoad(@NonNull LoadAdError error) {
                        appOpenAd = null;
                    }
                });
    }

    /** Uygulama arka plandan döndüğünde çağrılır. */
    void onReturnFromBackground(long backgroundMs) {
        coldStartAdShown = true;
        if (backgroundMs >= APP_OPEN_AFTER_BACKGROUND_MS) showAppOpen();
    }

    private void showAppOpen() {
        if (!canShowFullscreen()) return;
        if (appOpenAd == null) {
            loadAppOpen();
            return;
        }
        AppOpenAd ad = appOpenAd;
        appOpenAd = null;
        ad.setFullScreenContentCallback(new FullScreenContentCallback() {
            @Override
            public void onAdDismissedFullScreenContent() {
                showingFullscreen = false;
                lastFullscreenAt = SystemClock.elapsedRealtime();
                loadAppOpen();
            }

            @Override
            public void onAdFailedToShowFullScreenContent(@NonNull AdError error) {
                showingFullscreen = false;
                loadAppOpen();
            }
        });
        showingFullscreen = true;
        lastFullscreenAt = SystemClock.elapsedRealtime();
        ad.show(activity);
    }

    boolean isShowingFullscreen() {
        return showingFullscreen;
    }
}
