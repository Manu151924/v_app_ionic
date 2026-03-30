package com.safexpress.associate.app;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import android.view.Window;
import android.view.View;
import android.graphics.Color;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        if (RootDetector.isDeviceRooted()) {
            finish();
            System.exit(0);
            return;
        }

        super.onCreate(savedInstanceState);

        Window window = getWindow();
        WindowCompat.setDecorFitsSystemWindows(window, false);
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);
        View decorView = window.getDecorView();
        decorView.setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
        );
WindowInsetsControllerCompat controller =
        new WindowInsetsControllerCompat(window, window.getDecorView());
controller.setAppearanceLightStatusBars(false);
    }
}