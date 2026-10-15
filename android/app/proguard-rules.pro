# WebView'dan çağrılan köprü metotları silinmesin / adı değişmesin
-keepclassmembers class com.poyrazworkshop.notdefteri.MainActivity$Bridge {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
