import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';

@Injectable({ providedIn: 'root' })
export class Auth {
  private router = inject(Router);

  private _isAuthenticated = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this._isAuthenticated.asObservable();

  private preloadDone = false;

  async setUserData(data: any) {
    await SecureStoragePlugin.set({ key: 'access_token', value: data.accessToken });
    await SecureStoragePlugin.set({ key: 'refresh_token', value: data.refreshToken });

    this._isAuthenticated.next(true);
  }

  async preloadAuth() {
    if (this.preloadDone) return;

    const token = await SecureStoragePlugin.get({ key: 'access_token' }).catch(() => null);

    this._isAuthenticated.next(!!token?.value);
    this.preloadDone = true;
  }

  async ensureAuthenticated(): Promise<boolean> {
    if (this._isAuthenticated.value) return true;

    const token = await SecureStoragePlugin.get({ key: 'access_token' }).catch(() => null);

    const isAuth = !!token?.value;
    this._isAuthenticated.next(isAuth);

    return isAuth;
  }
  async getAccessToken(): Promise<string> {
  const token = await SecureStoragePlugin.get({ key: 'access_token' }).catch(() => null);
  return token?.value ?? '';
}

  async logout() {
    await SecureStoragePlugin.clear();
    this._isAuthenticated.next(false);
    this.router.navigate(['/login']);
  }
}
