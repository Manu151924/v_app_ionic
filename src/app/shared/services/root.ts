import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { IsRoot } from '@capgo/capacitor-is-root';

@Injectable({
  providedIn: 'root'
})
export class Root {

  async isDeviceRooted(): Promise<boolean> {
    try {

      if (!Capacitor.isNativePlatform()) {
        return false;
      }

      const result: any = await IsRoot.isRooted();

      // Handle all plugin return types safely
      if (typeof result === 'boolean') {
        return result;
      }

      if (result?.rooted !== undefined) {
        return result.rooted;
      }

      if (result?.isRooted !== undefined) {
        return result.isRooted;
      }

      return false;

    } catch (error) {
      console.error('[Root Detection Error]', error);
      return false;
    }
  }
}
