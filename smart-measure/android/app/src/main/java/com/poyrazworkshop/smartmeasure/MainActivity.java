package com.poyrazworkshop.smartmeasure;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Bu uygulamanın kendi eklentisi: sensörler, ses düzeyi, ekran ölçüsü, izinler (OlcerPlugin.java)
        registerPlugin(OlcerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
