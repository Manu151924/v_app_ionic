import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

export interface UserDetails {
  vendorType?: string[];

  vendorName?: string;
  vendorEmail?: string;
  vendorPhone?: string;
  vendorGstin?: string;

  accessToken?: any;
  refreshToken?: any;

  bookingVendorId?: number;
  deliveryVendorId?: number;
  bookingBranchId?: any;
  deliveryBranchId?: any;

  viewportHeight?: number;
  viewportWidth?: number;
  devicePixelRatio?: number;

  lastSplashTime?: number;
  branchId?: number;
  activeSegment?: any;

  otpResendState?: {
    resendCount: number;
    lastResendTime: number;
    cooldownActive: boolean;
  };

  contactList?: any[];
}

@Injectable({ providedIn: 'root' })
export class AppStorageService {
  private _storage!: Storage;
  private ready: Promise<void>;

  constructor(private storage: Storage) {
    this.ready = this.init();
  }

  private async init() {
    this._storage = await this.storage.create();
  }

  async wait() {
    await this.ready;
  }

  async set(key: string, value: any) {
    await this.wait();
    return this._storage.set(key, value);
  }

  async get<T>(key: string): Promise<T | null> {
    await this.wait();
    return this._storage.get(key);
  }

  async remove(key: string) {
    await this.wait();
    return this._storage.remove(key);
  }

  async clear() {
    await this.wait();
    return this._storage.clear();
  }

  async setUserDetails(data: UserDetails) {
    return this.set('userDetails', data);
  }

  async getUserDetails(): Promise<UserDetails | null> {
    return this.get('userDetails');
  }

  async updateUserDetails(update: Partial<UserDetails>) {
    const current = (await this.getUserDetails()) || {};
    return this.setUserDetails({ ...current, ...update });
  }
  async clearUserDetails(): Promise<void> {
    return this.remove('userDetails');
  }

  async getBranchId(): Promise<number | null> {
    const user = await this.getUserDetails();
    return user?.branchId ?? null;
  }

  async setBranchId(branchId: number): Promise<void> {
    return this.updateUserDetails({ branchId });
  }

  async getAccessToken(): Promise<string | null> {
    const user = await this.getUserDetails();
    return user?.accessToken ?? null;
  }
  async getActiveVendorId(): Promise<number | null> {
    const user = await this.getUserDetails();
    if (!user) return null;

    if (user.activeSegment === 'delivery') {
      return user.deliveryVendorId ?? null;
    }

    return user.bookingVendorId ?? null;
  }

  async clearSession() {
    await this.remove('userDetails');
    await this.clear();
  }
}
