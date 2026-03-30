import { Injectable } from '@angular/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class StatusBarService {

  async setDarkBackground() {
    if (!Capacitor.isNativePlatform()) return;

    await StatusBar.setBackgroundColor({ color: '#1a1b1b' });
    await StatusBar.setStyle({ style: Style.Light }); // white icons
  }

  async setLightBackground() {
    if (!Capacitor.isNativePlatform()) return;

    await StatusBar.setBackgroundColor({ color: '#ffffff' });
    await StatusBar.setStyle({ style: Style.Dark }); // dark icons
  }

  async setCustom(color: string, lightIcons: boolean = true) {
    if (!Capacitor.isNativePlatform()) return;

    await StatusBar.setBackgroundColor({ color });
    await StatusBar.setStyle({
      style: lightIcons ? Style.Light : Style.Dark
    });
  }
async setDark() {
  await StatusBar.setStyle({ style: Style.Light }); // white icons
}

async setLight() {
  await StatusBar.setStyle({ style: Style.Dark }); // black icons
}
}