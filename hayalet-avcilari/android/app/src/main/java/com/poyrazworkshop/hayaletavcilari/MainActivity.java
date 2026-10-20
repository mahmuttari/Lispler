package com.poyrazworkshop.hayaletavcilari;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.google.android.gms.games.PlayGamesSdk;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Play Oyun Hizmetleri v2: açılışta otomatik giriş denenir (oyuncunun Play Games hesabı varsa)
        PlayGamesSdk.initialize(this);
        registerPlugin(PlayGamesPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
