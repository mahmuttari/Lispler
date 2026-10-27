package com.poyrazworkshop.kiblebul;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.net.Uri;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Uygulamaya özgü iki küçük yerel iş (sayfa: www/js/native.js):
 *
 *   KibleYerel.bilgi()                          → { hataAyiklama, surum }   hata ayıklama derlemesinde reklamlar test
 *                                                                          reklamıdır (www/js/reklam.js)
 *   KibleYerel.abonelikleriYonet({ sku })       Google Play'in bu uygulamanın aboneliğine ait yönetim sayfası
 *                                                (play.google.com/store/account/subscriptions?sku=…&package=…;
 *                                                Play Store uygulaması açar). NativePurchases.manageSubscriptions
 *                                                sku vermediği için genel abonelik listesini açar.
 */
@CapacitorPlugin(name = "KibleYerel")
public class KibleYerelPlugin extends Plugin {

    @PluginMethod
    public void bilgi(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("hataAyiklama", (getContext().getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0);
        ret.put("surum", BuildConfig.VERSION_NAME);
        call.resolve(ret);
    }

    @PluginMethod
    public void abonelikleriYonet(PluginCall call) {
        String sku = call.getString("sku", "");
        String paket = getContext().getPackageName();
        String adres = "https://play.google.com/store/account/subscriptions?"
            + (sku == null || sku.isEmpty() ? "" : "sku=" + Uri.encode(sku) + "&")
            + "package=" + Uri.encode(paket);
        Intent niyet = new Intent(Intent.ACTION_VIEW, Uri.parse(adres));
        niyet.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            getContext().startActivity(niyet);
            call.resolve();
        } catch (ActivityNotFoundException e) {
            call.reject("Abonelik sayfası açılamadı", e);
        }
    }
}
