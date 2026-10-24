# WebView'dan çağrılan köprü yöntemleri (AirTagYerel) silinmesin, adı değişmesin
-keepclassmembers class com.poyrazworkshop.izharitasi.YerelKopru {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
