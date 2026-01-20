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
      this.sessionActive = true; 
    this.hasSession = true;
    this.destroyed = false;

    await this.storage.setUserDetails(data);
    this.startTokenCountdown(data.accessToken, data.refreshToken);
  }
async forceLogout() {
  if (!this.sessionActive) return;   // 🔥 Login screen safe

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
  private sessionActive = false;


async restoreSession(): Promise<boolean> {
  const user = await this.storage.getUserDetails();

  // No stored session
  if (!user?.accessToken || !user?.refreshToken) {
    this.clearSessionRuntime();
    return false;
  }

  // Refresh expired → hard logout
  if (this.isRefreshTokenExpired(user.refreshToken)) {
    await this.storage.clearSession();
    this.clearSessionRuntime();
    return false;
  }

  // Valid session
  this.sessionActive = true;
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

private startTokenCountdown(accessToken: string, refreshToken: string) {
  this.stopTokenCountdown();

  try {
    const accessExp =
      JSON.parse(atob(accessToken.split('.')[1])).exp * 1000;

    const refreshExp =
      JSON.parse(atob(refreshToken.split('.')[1])).exp * 1000;

    // ---------------- ACCESS TOKEN WATCHER ----------------
    this.accessTimer = setInterval(() => {
      // Never run if session is not active
      if (!this.sessionActive) return;

      const now = Date.now();

      // If access token already expired
      if (accessExp <= now) {
        if (this.offline) {
          // Do NOT logout when offline
          this.sessionTimeout.set('NO_INTERNET');
          return;
        }

        // Token expired while online → interceptor will handle refresh
        // Do NOT force logout here
        return;
      }
    }, 1000);

    // ---------------- REFRESH TOKEN WATCHER ----------------
    this.refreshTimer = setInterval(() => {
      if (!this.sessionActive) return;

      const now = Date.now();

      if (refreshExp <= now) {
        if (this.offline) {
          this.sessionTimeout.set('NO_INTERNET');
          return;
        }

        // Refresh token expired → real session ended
        this.forceLogout();
      }
    }, 1000);
  } catch (e) {
    console.error('Invalid token format', e);
    this.forceLogout();
  }
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
