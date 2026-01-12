import { ErrorHandler, Injectable, NgZone } from '@angular/core';
import { Crashlytics } from '../../shared/services/crashlytics';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {

  constructor(
    private crashlytics: Crashlytics,
    private zone: NgZone
  ) {}

  handleError(error: any): void {
    this.zone.run(() => {
      console.error('GLOBAL ANGULAR ERROR', error);
      this.crashlytics.recordFatal(error);
    });
  }
}
