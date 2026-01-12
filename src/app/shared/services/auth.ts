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

  constructor(
    private storage: AppStorageService,
    private router: Router,
    private sessionTimeout: SessionTimeout,
    private api: Api
  ) {
    window.addEventListener('offline', () => (this.offline = true));
    window.addEventListener('online', () => {
      this.offline = false;
      this.sessionTimeout.clear();
    });
  }

  async setUserData(data: any) {
    this.hasSession = true;
    this.destroyed = false;

    await this.storage.setUserDetails(data);
    this.startTokenCountdown(data.accessToken, data.refreshToken);
  }
  async forceLogout() {
    if (this.logoutInProgress) return;
    this.logoutInProgress = true;

    this.hasSession = false;
    this.destroyed = true;
    this.stopTokenCountdown();
    await this.storage.clearSession();

    this.sessionTimeout.set('SESSION_EXPIRED');
    await this.router.navigateByUrl('/login', { replaceUrl: true });
    this.logoutInProgress = false;
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

    this.startTokenCountdown(token, user.refreshToken);
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  isRefreshTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  async restoreSession(): Promise<boolean> {
    const user = await this.storage.getUserDetails();
    if (!user?.accessToken || !user?.refreshToken) return false;

    if (this.isRefreshTokenExpired(user.refreshToken)) return false;

    this.hasSession = true;
    this.destroyed = false;
    this.startTokenCountdown(user.accessToken, user.refreshToken);
    return true;
  }

  get authState$(): Observable<boolean> {
    return this.isAuthenticated$.asObservable();
  }

  async logout() {
    if (this.isLoggingOut) return;
    this.isLoggingOut = true;

    this.hasSession = false;
    this.destroyed = true;
    this.stopTokenCountdown();
    this.sessionTimeout.clear();

    await this.storage.clearSession();
    await this.router.navigateByUrl('/login', { replaceUrl: true });
    this.isLoggingOut = false;
  }

  // ================= TOKEN TIMER =================
  private startTokenCountdown(access: string, refresh: string) {
    this.stopTokenCountdown();

    const accessExp = JSON.parse(atob(access.split('.')[1])).exp * 1000;
    const refreshExp = JSON.parse(atob(refresh.split('.')[1])).exp * 1000;

    // ---------------- ACCESS TOKEN TIMER ----------------
    this.accessTimer = setInterval(async () => {
      // Do nothing if user already logged out or app destroyed
      if (this.destroyed || !this.hasSession) return;

      const diff = accessExp - Date.now();

      // Try to refresh 30 seconds before access token expiry
      if (diff < 30000 && diff > 0) {
        try {
          const res: any = await this.api
            .generateAccessTokenFromRefreshToken(refresh)
            .toPromise();

          const newToken = res?.data?.accessToken;
          if (newToken) {
            await this.storage.updateUserDetails({ accessToken: newToken });
          }
        } catch {
          // Refresh failed
          if (this.offline) {
            this.sessionTimeout.set('NO_INTERNET'); // user has no network
            return;
          }
          this.sessionTimeout.set('SERVER_DOWN'); // server not reachable
        }
      }

      // Access token actually expired
      if (diff <= 0) {
        if (this.offline) {
          // Never logout while offline
          this.sessionTimeout.set('NO_INTERNET');
          return;
        }

        // Online + token expired → real session expired
        this.forceLogout();
      }
    }, 1000);

    // ---------------- REFRESH TOKEN TIMER ----------------
    this.refreshTimer = setInterval(() => {
      if (this.destroyed || !this.hasSession) return;

      const diff = refreshExp - Date.now();

      if (diff <= 0) {
        if (this.offline) {
          this.sessionTimeout.set('NO_INTERNET'); // do not logout
          return;
        }

        // Refresh token expired → real session expired
        this.forceLogout();
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
          (x: any) => x.vedorType === 'BOOKING'
        );
        const delivery = res.responseObject.find(
          (x: any) => x.vedorType === 'DELIVERY'
        );

        await this.storage.updateUserDetails({
          bookingVendorId: booking?.vendorId || null,
          deliveryVendorId: delivery?.vendorId || null,
          bookingBranchId: booking?.branchId || null,
          deliveryBranchId: delivery?.branchId || null,
          vendorType: res.responseObject.map((x: any) => x.vedorType),
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
