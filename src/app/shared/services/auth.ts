import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';
import { Api } from './api';

@Injectable({ providedIn: 'root' })
export class Auth {
  private api = inject(Api);
  private router = inject(Router);

  private _isAuthenticated = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this._isAuthenticated.asObservable();

  private userData: any = null;

async setUserData(data: any) {
  this.userData = data;
  this._isAuthenticated.next(true);

  localStorage.setItem('access_token', data.accessToken);
  localStorage.setItem('refresh_token', data.refreshToken);
  localStorage.setItem('vendor_type', JSON.stringify(data.vendorType));

  await SecureStoragePlugin.set({ key: 'access_token', value: data.accessToken });
  await SecureStoragePlugin.set({ key: 'refresh_token', value: data.refreshToken });
  await SecureStoragePlugin.set({ key: 'vendor_type', value: JSON.stringify(data.vendorType) });
}


  async getVendorType(): Promise<string[]> {
    const vendorType = await SecureStoragePlugin.get({ key: 'vendor_type' }).catch(() => null);
    return vendorType ? JSON.parse(vendorType.value) : [];
  }

  async logout() {
    await SecureStoragePlugin.clear();
    this._isAuthenticated.next(false);
    this.router.navigate(['/login']);
  }

  verifyOtp(mobile: string, otp: string) {
    return this.api.verifyOtp(otp, mobile);
  }

async isLoggedIn(): Promise<boolean> {
  // Fast check
  const localToken = localStorage.getItem('access_token');
  if (localToken) {
    this._isAuthenticated.next(true);
    return true;
  }

  // Fallback if secure storage is available
  const secureToken = await SecureStoragePlugin.get({ key: 'access_token' }).catch(() => null);

  const isAuth = !!secureToken?.value;
  this._isAuthenticated.next(isAuth);

  if (isAuth) {
    localStorage.setItem('access_token', secureToken.value);
  }

  return isAuth;
}

}
