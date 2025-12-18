import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'vendor',
  webDir: 'www',
  ios: {
    contentInset: 'always',
    scrollEnabled: true,
  },
  plugins: {
    StatusBar: {
        overlaysWebView: false   
    },
    SplashScreen: {
      launchShowDuration: 0,
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    Keyboard: {
      resize: KeyboardResize.Ionic,
      resizeOnFullScreen: true,
    },
  },
};
export default config;