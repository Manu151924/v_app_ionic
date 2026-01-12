import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type SessionState =
  | 'ACTIVE'
  | 'REFRESHING'
  | 'NO_INTERNET'
  | 'SERVER_DOWN'
  | 'SESSION_EXPIRED';

@Injectable({ providedIn: 'root' })
export class SessionTimeout {
  private state$ = new BehaviorSubject<SessionState>('ACTIVE');

  set(state: SessionState) {
    console.warn('SESSION STATE →', state);
    this.state$.next(state);
  }

  clear() {
    this.state$.next('ACTIVE');
  }

  getState() {
    return this.state$.asObservable();
  }
}
