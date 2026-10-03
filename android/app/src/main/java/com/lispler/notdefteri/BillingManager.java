package com.lispler.notdefteri;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;

import androidx.annotation.NonNull;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;

import org.json.JSONObject;

import java.util.Collections;
import java.util.List;

/**
 * Google Play aylık "Pro" aboneliği. Fiyat Play Console'da ülke ülke ayarlanır;
 * uygulama mağazanın verdiği yerel fiyat metnini (ör. "₺19,99") gösterir.
 */
class BillingManager implements PurchasesUpdatedListener {

    interface Listener {
        void onProChanged(boolean isPro);
    }

    interface Result {
        void done(JSONObject result);
    }

    private static final String PREFS = "pro";
    private static final String KEY_IS_PRO = "isPro";

    private final Context context;
    private final Listener listener;
    private final SharedPreferences prefs;
    private BillingClient client;
    private ProductDetails details;
    private boolean connected = false;
    private boolean isPro;
    private Result pendingBuy;

    BillingManager(Context context, Listener listener) {
        this.context = context.getApplicationContext();
        this.listener = listener;
        this.prefs = this.context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        // İnternet yokken de Pro reklamsız açılsın diye son bilinen durum saklanır
        this.isPro = prefs.getBoolean(KEY_IS_PRO, false);
    }

    boolean isPro() {
        return isPro;
    }

    void start() {
        client = BillingClient.newBuilder(context)
                .setListener(this)
                .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
                .enableAutoServiceReconnection()
                .build();
        connect(null);
    }

    private void connect(Runnable then) {
        client.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(@NonNull BillingResult result) {
                connected = result.getResponseCode() == BillingClient.BillingResponseCode.OK;
                if (connected) {
                    queryDetails(null);
                    refresh(null);
                }
                if (then != null) then.run();
            }

            @Override
            public void onBillingServiceDisconnected() {
                connected = false;
            }
        });
    }

    private void whenConnected(Runnable r) {
        if (connected) r.run();
        else connect(r);
    }

    private void queryDetails(Runnable then) {
        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                .setProductList(Collections.singletonList(QueryProductDetailsParams.Product.newBuilder()
                        .setProductId(BuildConfig.PRO_PRODUCT_ID)
                        .setProductType(BillingClient.ProductType.SUBS)
                        .build()))
                .build();
        client.queryProductDetailsAsync(params, (result, detailsResult) -> {
            List<ProductDetails> list = detailsResult.getProductDetailsList();
            if (result.getResponseCode() == BillingClient.BillingResponseCode.OK && !list.isEmpty()) {
                details = list.get(0);
            }
            if (then != null) then.run();
        });
    }

    /** Mağazadan güncel abonelik durumunu sorgular (geri yükleme de budur). */
    void refresh(Result cb) {
        whenConnected(() -> client.queryPurchasesAsync(
                QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.SUBS).build(),
                (result, purchases) -> {
                    if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                        boolean pro = false;
                        for (Purchase p : purchases) {
                            if (handlePurchase(p)) pro = true;
                        }
                        setPro(pro);
                    }
                    if (cb != null) cb.done(json("isPro", isPro));
                }));
    }

    /** Ürün bilgisi: fiyat metni ve durum. */
    void getInfo(Result cb) {
        whenConnected(() -> {
            Runnable reply = () -> {
                JSONObject o = json("isPro", isPro);
                try {
                    o.put("available", details != null);
                    String price = formattedPrice();
                    if (price != null) o.put("price", price);
                } catch (Exception ignored) {
                }
                cb.done(o);
            };
            if (details == null && connected) queryDetails(reply);
            else reply.run();
        });
    }

    private String formattedPrice() {
        if (details == null || details.getSubscriptionOfferDetails() == null
                || details.getSubscriptionOfferDetails().isEmpty()) return null;
        List<ProductDetails.PricingPhase> phases = details.getSubscriptionOfferDetails().get(0)
                .getPricingPhases().getPricingPhaseList();
        // Son aşama normal (tekrarlayan) fiyattır; öncesi deneme/indirim olabilir
        return phases.isEmpty() ? null : phases.get(phases.size() - 1).getFormattedPrice();
    }

    void buy(Activity activity, Result cb) {
        whenConnected(() -> {
            Runnable launch = () -> {
                if (details == null || details.getSubscriptionOfferDetails() == null
                        || details.getSubscriptionOfferDetails().isEmpty()) {
                    cb.done(json("error", "Abonelik şu an kullanılamıyor. Play Store'a giriş yaptığınızdan emin olun."));
                    return;
                }
                String offerToken = details.getSubscriptionOfferDetails().get(0).getOfferToken();
                BillingFlowParams flow = BillingFlowParams.newBuilder()
                        .setProductDetailsParamsList(Collections.singletonList(
                                BillingFlowParams.ProductDetailsParams.newBuilder()
                                        .setProductDetails(details)
                                        .setOfferToken(offerToken)
                                        .build()))
                        .build();
                pendingBuy = cb;
                BillingResult r = client.launchBillingFlow(activity, flow);
                if (r.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                    pendingBuy = null;
                    cb.done(json("error", "Satın alma başlatılamadı (" + r.getResponseCode() + ")"));
                }
            };
            if (details == null) queryDetails(() -> activity.runOnUiThread(launch));
            else activity.runOnUiThread(launch);
        });
    }

    @Override
    public void onPurchasesUpdated(@NonNull BillingResult result, List<Purchase> purchases) {
        Result cb = pendingBuy;
        pendingBuy = null;
        int code = result.getResponseCode();
        if (code == BillingClient.BillingResponseCode.OK && purchases != null) {
            boolean pro = false;
            for (Purchase p : purchases) {
                if (handlePurchase(p)) pro = true;
            }
            if (pro) setPro(true);
            if (cb != null) {
                JSONObject o = json("isPro", isPro);
                if (!pro) {
                    try {
                        o.put("pending", true);
                    } catch (Exception ignored) {
                    }
                }
                cb.done(o);
            }
        } else if (code == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) {
            refresh(cb);
        } else if (cb != null) {
            if (code == BillingClient.BillingResponseCode.USER_CANCELED) cb.done(json("cancelled", true));
            else cb.done(json("error", "Satın alma tamamlanamadı (" + code + ")"));
        }
    }

    /** Geçerli Pro satın alımıysa true döner; gerekirse onaylar (3 gün içinde onaylanmazsa iade edilir). */
    private boolean handlePurchase(Purchase p) {
        if (!p.getProducts().contains(BuildConfig.PRO_PRODUCT_ID)) return false;
        if (p.getPurchaseState() != Purchase.PurchaseState.PURCHASED) return false;
        if (!p.isAcknowledged()) {
            client.acknowledgePurchase(AcknowledgePurchaseParams.newBuilder()
                    .setPurchaseToken(p.getPurchaseToken()).build(), r -> { });
        }
        return true;
    }

    private void setPro(boolean pro) {
        boolean changed = pro != isPro;
        isPro = pro;
        prefs.edit().putBoolean(KEY_IS_PRO, pro).apply();
        if (changed) listener.onProChanged(pro);
    }

    String manageUrl() {
        return "https://play.google.com/store/account/subscriptions?sku=" + BuildConfig.PRO_PRODUCT_ID
                + "&package=" + context.getPackageName();
    }

    private static JSONObject json(String key, Object value) {
        JSONObject o = new JSONObject();
        try {
            o.put(key, value);
        } catch (Exception ignored) {
        }
        return o;
    }
}
