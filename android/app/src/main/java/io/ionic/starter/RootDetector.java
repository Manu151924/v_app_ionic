package com.safexpress.associate.app;

import android.os.Build;
import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;

public final class RootDetector {

    private RootDetector() {}

    public static boolean isDeviceRooted() {
        return hasTestKeys()
                || hasSuBinary()
                || canExecuteSu();
    }

    private static boolean hasTestKeys() {
        return Build.TAGS != null && Build.TAGS.contains("test-keys");
    }

    private static boolean hasSuBinary() {
        String[] paths = {
                "/system/bin/su",
                "/system/xbin/su",
                "/sbin/su",
                "/vendor/bin/su",
                "/data/local/bin/su",
                "/data/local/xbin/su"
        };

        for (String path : paths) {
            if (new File(path).exists()) return true;
        }
        return false;
    }

    private static boolean canExecuteSu() {
        try {
            Process process = Runtime.getRuntime().exec("su");
            BufferedReader in =
                    new BufferedReader(new InputStreamReader(process.getInputStream()));
            return in.readLine() != null;
        } catch (Exception e) {
            return false;
        }
    }
}
