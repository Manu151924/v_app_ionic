import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  FirebaseCrashlytics,
  StackFrame,
  CustomKeyAndValue
} from '@capacitor-firebase/crashlytics';

@Injectable({
  providedIn: 'root'
})
export class Crashlytics {

  private isNative = Capacitor.isNativePlatform();

  async setUserContext(user: {
    userId: string;
    role?: string;
    appVersion?: string;
  }): Promise<void> {
    if (!this.isNative) return;

    await FirebaseCrashlytics.setUserId({
      userId: user.userId
    });

    if (user.role) {
      await FirebaseCrashlytics.setCustomKey({
        key: 'role',
        value: user.role,
        type: 'string'
      });
    }

    if (user.appVersion) {
      await FirebaseCrashlytics.setCustomKey({
        key: 'appVersion',
        value: user.appVersion,
        type: 'string'
      });
    }
  }

  async logBusinessEvent(event: string, data?: any): Promise<void> {
    if (!this.isNative) return;

    await FirebaseCrashlytics.log({
      message: `[BUSINESS] ${event} ${data ? JSON.stringify(data) : ''}`
    });
  }

  async recordNonFatal(
    error: any,
    context: string,
    keys?: CustomKeyAndValue[]
  ): Promise<void> {
    if (!this.isNative) return;

    await FirebaseCrashlytics.recordException({
      message: `[NON_FATAL] ${context} | ${this.safeMessage(error)}`,
      keysAndValues: keys
    });
  }

  async recordFatal(error: any): Promise<void> {
    if (!this.isNative) return;

    await FirebaseCrashlytics.recordException({
      message: `[FATAL] ${this.safeMessage(error)}`
    });
  }

  private safeMessage(error: any): string {
    if (!error) return 'Unknown error';
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    return JSON.stringify(error);
  }
}
