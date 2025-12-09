import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

export interface UserDetails {
  vendorId?: number;
  vendorType?: any;
  vendorName?: string;
  vendorEmail?: string;
  vendorPhone?: string;
  vendorGstin?: string;
  branchId?: number;

  accessToken?: string;
  refreshToken?: string;

  cap_sec_access_token?: string;
  cap_sec_refresh_token?: string;

  viewportHeight?: number;
  viewportWidth?: number;
  devicePixelRatio?: number;

  lastSplashTime?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AppStorageService {

  private _storage!: Storage;
  private ready: Promise<void>;

  constructor(private storage: Storage) {
    this.ready = this.init();
  }

  /** Initialize Ionic Storage */
  private async init() {
    this._storage = await this.storage.create();
  }

  /** Ensure storage is fully initialized */
  async waitUntilReady() {
    await this.ready;
  }

  /** Generic SET */
  async set(key: string, value: any) {
    await this.waitUntilReady();
    return this._storage.set(key, value);
  }

  async get<T = any>(key: string): Promise<T> {
    await this.waitUntilReady();
    return this._storage.get(key);
  }

  async remove(key: string) {
    await this.waitUntilReady();
    return this._storage.remove(key);
  }

  async clear() {
    await this.waitUntilReady();
    return this._storage.clear();
  }

  async setUserDetails(details: UserDetails) {
    return this.set('userDetails', details);
  }

  async getUserDetails(): Promise<UserDetails> {
    return this.get('userDetails');
  }

  async updateUserDetails(update: Partial<UserDetails>) {
    const current = await this.getUserDetails() || {};
    const merged = { ...current, ...update };
    return this.set('userDetails', merged);
  }

  async clearUserDetails() {
    return this.remove('userDetails');
  }
}
