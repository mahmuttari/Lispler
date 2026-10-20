package com.poyrazworkshop.hayaletavcilari;

import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.games.GamesSignInClient;
import com.google.android.gms.games.PlayGames;
import com.google.android.gms.tasks.Task;

/**
 * Google Play Oyun Hizmetleri v2 köprüsü (www/playgames.js → window.Capacitor.Plugins.PlayGames).
 * Giriş açılışta otomatik denenir (MainActivity › PlayGamesSdk.initialize); skor ve başarım oturum yoksa reddedilir,
 * skor tablosu/başarım ekranı oturum yoksa önce girişi ister.
 */
@CapacitorPlugin(name = "PlayGames")
public class PlayGamesPlugin extends Plugin {

    @PluginMethod
    public void isAuthenticated(PluginCall call) {
        PlayGames.getGamesSignInClient(getActivity()).isAuthenticated().addOnCompleteListener(t -> {
            JSObject r = new JSObject();
            r.put("authenticated", t.isSuccessful() && t.getResult().isAuthenticated());
            call.resolve(r);
        });
    }

    @PluginMethod
    public void signIn(PluginCall call) {
        girisliyse(call, () -> {
            JSObject r = new JSObject();
            r.put("authenticated", true);
            call.resolve(r);
        });
    }

    @PluginMethod
    public void submitScore(PluginCall call) {
        String id = call.getString("id");
        Double skor = call.getDouble("score");
        if (id == null || skor == null) { call.reject("id ve score gerekli"); return; }
        bitir(call, PlayGames.getLeaderboardsClient(getActivity()).submitScoreImmediate(id, skor.longValue()));
    }

    @PluginMethod
    public void unlock(PluginCall call) {
        String id = call.getString("id");
        if (id == null) { call.reject("id gerekli"); return; }
        bitir(call, PlayGames.getAchievementsClient(getActivity()).unlockImmediate(id));
    }

    @PluginMethod
    public void showLeaderboard(PluginCall call) {
        String id = call.getString("id");
        if (id == null) { call.reject("id gerekli"); return; }
        girisliyse(call, () -> PlayGames.getLeaderboardsClient(getActivity()).getLeaderboardIntent(id)
            .addOnSuccessListener(i -> startActivityForResult(call, i, "ekranKapandi"))
            .addOnFailureListener(e -> call.reject(e.getMessage())));
    }

    @PluginMethod
    public void showAchievements(PluginCall call) {
        girisliyse(call, () -> PlayGames.getAchievementsClient(getActivity()).getAchievementsIntent()
            .addOnSuccessListener(i -> startActivityForResult(call, i, "ekranKapandi"))
            .addOnFailureListener(e -> call.reject(e.getMessage())));
    }

    @ActivityCallback
    private void ekranKapandi(PluginCall call, ActivityResult result) {
        if (call != null) call.resolve();
    }

    // Oturum varsa devam eder; yoksa Play Games giriş penceresini açar, oyuncu vazgeçerse reddeder
    private void girisliyse(PluginCall call, Runnable devam) {
        GamesSignInClient c = PlayGames.getGamesSignInClient(getActivity());
        c.isAuthenticated().addOnCompleteListener(t -> {
            if (t.isSuccessful() && t.getResult().isAuthenticated()) { devam.run(); return; }
            c.signIn().addOnCompleteListener(g -> {
                if (g.isSuccessful() && g.getResult().isAuthenticated()) devam.run();
                else call.reject("Play Games oturumu açılamadı");
            });
        });
    }

    private void bitir(PluginCall call, Task<?> is) {
        is.addOnCompleteListener(t -> {
            if (t.isSuccessful()) call.resolve();
            else call.reject(t.getException() != null ? t.getException().getMessage() : "Play Games hatası");
        });
    }
}
