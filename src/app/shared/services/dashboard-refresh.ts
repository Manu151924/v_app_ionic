import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DashboardRefresh {

  private refreshSubject = new Subject<string>();
  private silentRefreshSubject = new Subject<void>();

  refresh$ = this.refreshSubject.asObservable();
  silentRefresh$ = this.silentRefreshSubject.asObservable();

  triggerRefresh(context: string) {
     this.refreshSubject.next(context);
  }

  triggerSilentRefresh() {
    this.silentRefreshSubject.next();
  }

}
