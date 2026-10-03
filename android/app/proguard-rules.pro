# WebView'dan çağrılan köprü metotları silinmesin / adı değişmesin
-keepclassmembers class com.lispler.notdefteri.MainActivity$Bridge {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
