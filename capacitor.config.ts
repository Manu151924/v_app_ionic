import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'vendor',
  webDir: 'www',
  plugins: {
    SplashScreen: {
      launchShowDuration: 0, 
      backgroundColor: '#ffffff', 
      androidScaleType: 'CENTER_CROP',
      showSpinner: false, 
    },
  },
};

export default config;
