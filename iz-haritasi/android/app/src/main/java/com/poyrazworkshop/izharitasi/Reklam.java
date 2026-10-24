package com.poyrazworkshop.izharitasi;

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
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;
import com.google.android.ump.ConsentInformation;
import com.google.android.ump.ConsentRequestParameters;
import com.google.android.ump.UserMessagingPlatform;

import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Google AdMob reklamları (yalnız Google Play sürümü; GENEL-KONULAR'daki yan yükleme APK'sında reklam yoktur):
 * <ul>
 *   <li>ekranın altında uyarlanabilir banner; sayfanın üstüne binmez, klavye açıkken gizlenir;</li>
 *   <li>geçiş reklamı yalnız sayfa bir dışa aktarımdan sonra isteyince (AirTagYerel.reklamGoster) ve en sık
 *       3 dakikada bir. Sayfa tarama, Bul ve takip uyarısı sırasında istemez; tarama burada da denetlenir.</li>
 * </ul>
 * AB/İngiltere/İsviçre'de önce Google UMP onay formu gösterilir; onay olmadan reklam istenmez. Onayı değiştirme yeri
 * (gizlilik seçenekleri) gerekiyorsa sayfa Ayarlar'da düğme gösterir.
 */
final class Reklam {
    /** İki geçiş reklamı arasında en az bu süre geçer (kullanıcının kararı). */
    static final long GECIS_ARALIGI_MS = 3 * 60_000L;

    interface Tarama {
        boolean suruyor();
    }

    private final Activity etkinlik;
    private final FrameLayout bannerKap;
    private final Tarama tarama;
    private final AtomicBoolean basladi = new AtomicBoolean(false);
    private ConsentInformation onay;
    private volatile boolean gizlilikGerekli;
    private boolean hazir;
    private boolean klavyeAcik;
    private AdView banner;
    private InterstitialAd gecis;
    private boolean tamEkranda;
    private long sonGecis = -GECIS_ARALIGI_MS;

    Reklam(Activity etkinlik, FrameLayout bannerKap, Tarama tarama) {
        this.etkinlik = etkinlik;
        this.bannerKap = bannerKap;
        this.tarama = tarama;
    }

    /** Açılışta: önce onay bilgisi (gerekirse form), sonra reklam SDK'sı. Önceki onay geçerliyse hemen başlar. */
    void baslat() {
        onay = UserMessagingPlatform.getConsentInformation(etkinlik);
        onay.requestConsentInfoUpdate(etkinlik, new ConsentRequestParameters.Builder().build(),
                () -> UserMessagingPlatform.loadAndShowConsentFormIfRequired(etkinlik, hata -> onayDegisti()),
                hata -> onayDegisti());
        if (onay.canRequestAds()) sdkBaslat();
    }

    private void onayDegisti() {
        gizlilikGerekli = onay.getPrivacyOptionsRequirementStatus()
                == ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED;
        if (onay.canRequestAds()) sdkBaslat();
    }

    boolean gizlilikSecenekleriGerekli() {
        return gizlilikGerekli;
    }

    void gizlilikSecenekleriAc() {
        UserMessagingPlatform.showPrivacyOptionsForm(etkinlik, hata -> onayDegisti());
    }

    private void sdkBaslat() {
        if (basladi.getAndSet(true)) return;
        new Thread(() -> MobileAds.initialize(etkinlik, durum -> etkinlik.runOnUiThread(() -> {
            hazir = true;
            bannerYukle();
            gecisYukle();
        }))).start();
    }

    // ---------- Banner ----------

    // Uyarlanabilir sabit banner (ekran yüksekliğinin en çok %15'i, 50-90 dp). SDK 25.5.0'da bu yöntem "kullanımdan
    // kalktı" diye işaretli; önerilen getLargeAnchoredAdaptiveBannerAdSize bandı %20'ye ve 150 dp'ye kadar uzatıp
    // haritayı daraltır. Bilerek küçük bant seçildi; SDK yükseltilirken yeniden bakılır.
    @SuppressWarnings("deprecation")
    private void bannerYukle() {
        if (!hazir || banner != null) return;
        banner = new AdView(etkinlik);
        banner.setAdUnitId(BuildConfig.BANNER_ID);
        DisplayMetrics dm = etkinlik.getResources().getDisplayMetrics();
        int genislikDp = (int) (dm.widthPixels / dm.density);
        banner.setAdSize(AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize(etkinlik, genislikDp));
        bannerKap.removeAllViews();
        bannerKap.addView(banner);
        banner.loadAd(new AdRequest.Builder().build());
        bannerGorunurlugu();
    }

    /** Klavye açıkken banner gizlenir (yanlışlıkla dokunmayı önler; AdMob kuralı). */
    void klavye(boolean acik) {
        if (klavyeAcik == acik) return;
        klavyeAcik = acik;
        bannerGorunurlugu();
    }

    private void bannerGorunurlugu() {
        bannerKap.setVisibility(banner != null && !klavyeAcik ? View.VISIBLE : View.GONE);
    }

    void duraklat() {
        if (banner != null) banner.pause();
    }

    void surdur() {
        if (banner != null) banner.resume();
    }

    void kapat() {
        if (banner != null) banner.destroy();
    }

    // ---------- Geçiş reklamı ----------

    private void gecisYukle() {
        if (!hazir || gecis != null) return;
        InterstitialAd.load(etkinlik, BuildConfig.INTERSTITIAL_ID, new AdRequest.Builder().build(),
                new InterstitialAdLoadCallback() {
                    @Override
                    public void onAdLoaded(@NonNull InterstitialAd ad) {
                        gecis = ad;
                    }

                    @Override
                    public void onAdFailedToLoad(@NonNull LoadAdError hata) {
                        gecis = null;
                    }
                });
    }

    /** Dışa aktarımdan sonra: süre sınırı dolduysa, tarama yoksa ve reklam hazırsa geçiş reklamı gösterir. */
    void gecisFirsati() {
        if (!hazir || tamEkranda || tarama.suruyor()) return;
        if (SystemClock.elapsedRealtime() - sonGecis < GECIS_ARALIGI_MS) return;
        if (gecis == null) {
            gecisYukle();
            return;
        }
        InterstitialAd ad = gecis;
        gecis = null;
        ad.setFullScreenContentCallback(new FullScreenContentCallback() {
            @Override
            public void onAdDismissedFullScreenContent() {
                tamEkranda = false;
                sonGecis = SystemClock.elapsedRealtime();
                gecisYukle();
            }

            @Override
            public void onAdFailedToShowFullScreenContent(@NonNull AdError hata) {
                tamEkranda = false;
                gecisYukle();
            }
        });
        tamEkranda = true;
        sonGecis = SystemClock.elapsedRealtime();
        ad.show(etkinlik);
    }

    boolean tamEkranda() {
        return tamEkranda;
    }
}
