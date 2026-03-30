import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { AppStorageService, UserDetails } from './app-storage';
import { SessionTimeout } from './session-timeout';
import { Api } from './api';

@Injectable({ providedIn: 'root' })
export class Auth {
  private isAuthenticated$ = new BehaviorSubject<boolean>(false);
  private isLoggingOut = false;

  private accessTimer: any;
  private refreshTimer: any;

  private destroyed = false;
  private hasSession = false;
  private offline = !navigator.onLine;

  private logoutInProgress = false;

  private sessionActive = false;

  constructor(
    private storage: AppStorageService,
    private router: Router,
    private sessionTimeout: SessionTimeout,
    private api: Api,
  ) {
    window.addEventListener('offline', () => (this.offline = true));
    window.addEventListener('online', () => {
      this.offline = false;
      this.sessionTimeout.clear();
    });
  }

  private getTokenType(token: string): 'JWT' | 'JWE' | 'INVALID' {
    if (!token || typeof token !== 'string') return 'INVALID';
    const parts = token.split('.');
    if (parts.length === 3) return 'JWT';
    if (parts.length === 5) return 'JWE';
    return 'INVALID';
  }

  private decodeJwtPayload(token: string): any | null {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }

  isTokenExpired(token: string): boolean {
    if (this.getTokenType(token) !== 'JWT') return false;

    const payload = this.decodeJwtPayload(token);
    return !payload?.exp || payload.exp * 1000 < Date.now();
  }

  isRefreshTokenExpired(token: string): boolean {
    if (this.getTokenType(token) !== 'JWT') return false;

    const payload = this.decodeJwtPayload(token);
    return !payload?.exp || payload.exp * 1000 < Date.now();
  }

  async setUserData(data: any) {
    await this.storage.clearUserDetails();
    await this.storage.setUserDetails(data);
    this.sessionActive = true;
    this.hasSession = true;
    this.destroyed = false;

    await this.storage.setUserDetails(data);

    if (this.getTokenType(data.accessToken) === 'JWT') {
      this.startTokenCountdown(data.accessToken, data.refreshToken);
    }
  }

  /* =====================================================
     UPDATED: restoreSession
     ===================================================== */
  async restoreSession(): Promise<boolean> {
    const user = await this.storage.getUserDetails();

    if (!user?.accessToken || !user?.refreshToken) {
      this.clearSessionRuntime();
      return false;
    }

    // JWT refresh expiry check only
    if (
      this.getTokenType(user.refreshToken) === 'JWT' &&
      this.isRefreshTokenExpired(user.refreshToken)
    ) {
      await this.storage.clearSession();
      this.clearSessionRuntime();
      return false;
    }

    this.sessionActive = true;
    this.hasSession = true;
    this.destroyed = false;

    if (this.getTokenType(user.accessToken) === 'JWT') {
      this.startTokenCountdown(user.accessToken, user.refreshToken);
    }

    return true;
  }

  async forceLogout() {
    if (!this.sessionActive) return;

    this.sessionActive = false;
    this.clearSessionRuntime();

    await this.storage.clearSession();
    this.sessionTimeout.set('SESSION_EXPIRED');
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  private clearSessionRuntime() {
    this.stopTokenCountdown();
    this.sessionActive = false;
    this.hasSession = false;
    this.destroyed = true;
  }

  async getAccessToken(): Promise<string | null> {
    return (await this.storage.getUserDetails())?.accessToken ?? null;
  }

  async getRefreshToken(): Promise<string | null> {
    return (await this.storage.getUserDetails())?.refreshToken ?? null;
  }

  async updateAccessToken(token: string) {
    const user = await this.storage.getUserDetails();
    if (!user) return;

    await this.storage.updateUserDetails({ accessToken: token });
    this.isAuthenticated$.next(true);

    if (this.getTokenType(token) === 'JWT') {
      this.startTokenCountdown(token, user.refreshToken);
    }
  }

  get authState$(): Observable<boolean> {
    return this.isAuthenticated$.asObservable();
  }

  async logout() {
    if (this.isLoggingOut) return;
    this.isLoggingOut = true;
    this.isAuthenticated$.next(false);
    this.hasSession = false;
    this.destroyed = true;
    this.stopTokenCountdown();
    this.sessionTimeout.clear();

    await this.storage.clearSession();
    await this.router.navigateByUrl('/login', { replaceUrl: true });
    this.isLoggingOut = false;
  }

  private startTokenCountdown(accessToken: string, refreshToken: string) {
    this.stopTokenCountdown();

    if (this.getTokenType(accessToken) !== 'JWT') return;

    const accessPayload = this.decodeJwtPayload(accessToken);
    const refreshPayload = this.decodeJwtPayload(refreshToken);

    if (!accessPayload?.exp || !refreshPayload?.exp) return;

    const accessExp = accessPayload.exp * 1000;
    const refreshExp = refreshPayload.exp * 1000;

    this.accessTimer = setInterval(() => {
      if (!this.sessionActive) return;

      if (Date.now() >= accessExp && this.offline) {
        this.sessionTimeout.set('NO_INTERNET');
      }
    }, 1000);

    this.refreshTimer = setInterval(() => {
      if (!this.sessionActive) return;

      if (Date.now() >= refreshExp) {
        if (this.offline) {
          this.sessionTimeout.set('NO_INTERNET');
        } else {
          this.forceLogout();
        }
      }
    }, 1000);
  }

  private stopTokenCountdown() {
    clearInterval(this.accessTimer);
    clearInterval(this.refreshTimer);
  }

  async updateUserDetails(data: Partial<UserDetails>) {
    await this.storage.updateUserDetails(data);
  }

  async loadVendorContext(api: any) {
    try {
      const token = await this.getAccessToken();
      if (!token) return;

      const res = await api.getBranchDetails(token).toPromise();

      if (res?.responseStatus && res?.responseObject?.length) {
        const booking = res.responseObject.find(
          (x: any) => x.vedorType === 'BOOKING',
        );
        const delivery = res.responseObject.find(
          (x: any) => x.vedorType === 'DELIVERY',
        );

        await this.storage.updateUserDetails({
          bookingVendorId: booking?.vendorId || null,
          deliveryVendorId: delivery?.vendorId || null,
          bookingBranchId: booking?.branchId || null,
          deliveryBranchId: delivery?.branchId || null,
          vendorType: (res.responseObject as any[])
            .map((x) => x.vedorType)
            .filter((v): v is string => typeof v === 'string'),
        });
      }
    } catch (e) {
      console.error('Vendor context load failed', e);
    }
  }

  private formatTime(ms: number): string {
    const t = Math.floor(ms / 1000);
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;
    return `${h.toString().padStart(2, '0')}:${m
      .toString()
      .padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}
