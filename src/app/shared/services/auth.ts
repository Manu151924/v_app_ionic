import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { AppStorageService, UserDetails } from './app-storage';
@Injectable({ providedIn: 'root' })
export class Auth {

  private _isAuthenticated = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this._isAuthenticated.asObservable();

  constructor(
    private storage: AppStorageService,
    private router: Router
  ) {}


  async setUserData(res: any): Promise<void> {
    const data = res?.data ?? res;

    if (!data?.accessToken) {
      throw new Error('Access token missing');
    }

    const userDetails: UserDetails = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      vendorType: data.vendors?.map((v: any) => v.vendorType),
      vendorId: data.vendors?.[0]?.vendorId
    };

    await this.storage.setUserDetails(userDetails);

    this._isAuthenticated.next(true);
  }

  async getAccessToken(): Promise<string | null> {
    const user = await this.storage.getUserDetails();
    return user?.accessToken ?? null;
  }

  async getRefreshToken(): Promise<string | null> {
    const user = await this.storage.getUserDetails();
    return user?.refreshToken ?? null;
  }

  async updateAccessToken(token: string): Promise<void> {
    await this.storage.updateUserDetails({ accessToken: token });
    this._isAuthenticated.next(true);
  }

isAuthenticatedSnapshot(): boolean {
  return this._isAuthenticated.value;
}

async restoreSession(): Promise<void> {
  const token = await this.getAccessToken();
  this._isAuthenticated.next(!!token);
}

  /* ================= LOGOUT ================= */

  async logout(): Promise<void> {
    await this.storage.clearUserDetails();
    this._isAuthenticated.next(false);
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
