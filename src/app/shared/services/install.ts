import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { AppStorageService } from './app-storage';

@Injectable({ providedIn: 'root' })
export class Install {

  private readonly VERSION_KEY = 'APP_VERSION';

  constructor(private storage: AppStorageService) {}

  async checkFreshInstall() {

    if (!Capacitor.isNativePlatform()) return;

    try {
      const info = await App.getInfo();
      const currentVersion = info.version;

      const stored = await Preferences.get({ key: this.VERSION_KEY });

      console.log('APK Version:', currentVersion);
      console.log('Stored Version:', stored.value);

      if (!stored.value) {
        console.log('First install detected');
        await this.clearAll();
      }
      else if (stored.value !== currentVersion) {
        console.warn(' New APK installed – clearing old cache');
        await this.clearAll();
      }

      await Preferences.set({
        key: this.VERSION_KEY,
        value: currentVersion
      });

    } catch (e) {
      console.error('Install check failed', e);
    }
  }

  private async clearAll() {
    await this.storage.clearSession();       // Ionic Storage
    await Preferences.clear();               // Capacitor Preferences
    console.log('🧹 All app cache cleared');
  }
}
