############################################
# Capacitor + Ionic
############################################
-keep class com.getcapacitor.** { *; }
-keep class com.ionicframework.** { *; }
-keep class org.apache.cordova.** { *; }

############################################
# Security classes — keep only methods
############################################
-keepclassmembers class com.safexpress.associate.app.security.** {
    *;
}

############################################
# OkHttp SSL pinning
############################################
-keep class okhttp3.CertificatePinner { *; }
-keep class okhttp3.CertificatePinner$Builder { *; }

############################################
# WebView bridge
############################################
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

############################################
# Remove logs
############################################
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}

############################################
# Aggressive obfuscation
############################################
-repackageclasses
-overloadaggressively
-flattenpackagehierarchy
-dontusemixedcaseclassnames

############################################
# Optimize
############################################
-optimizationpasses 5

############################################
# Ignore warnings
############################################
-dontwarn org.apache.cordova.**
-dontwarn com.getcapacitor.**
