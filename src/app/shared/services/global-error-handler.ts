import { ErrorHandler, Injectable } from '@angular/core';
import { Crashlytics } from '../../shared/services/crashlytics';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {

  constructor(private crashlytics: Crashlytics) {}

handleError(error: any): void {
  console.error('Global Error:', error);
  this.crashlytics.recordFatal(error);
}

}
