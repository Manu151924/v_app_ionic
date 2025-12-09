import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { timeout, catchError, switchMap } from 'rxjs/operators';
import { API_ENDPOINTS } from '../utilities/api-end-point';
import { environment } from 'src/environments/environment';
import { AppStorageService } from './app-storage';
@Injectable({ providedIn: 'root' })
export class Api {

  constructor(
    private http: HttpClient,
    private storage: AppStorageService
  ) {}

  private getHeaders(token?: string): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${String(token)}`);
    }

    return headers;
  }


  private handleError(err: any) {
    if (err.name === 'TimeoutError') {
      return throwError(() => ({
        error: { message: 'Server response timed out (20s).' },
      }));
    }
    if (err.status === 0) {
      return throwError(() => ({
        error: { message: 'Server not reachable, check internet' },
      }));
    }
    return throwError(() => err);
  }

  private post(url: string, body: any): Observable<any> {
    return this.http.post(url, body, { headers: this.getHeaders() }).pipe(
      timeout(environment.apiTimeout),
      catchError((err) => this.handleError(err))
    );
  }

  private get(url: string, token?: string): Observable<any> {
    return this.http.get(url, { headers: this.getHeaders(token) }).pipe(
      timeout(environment.apiTimeout),
      catchError((err) => this.handleError(err))
    );
  }

 private getUserField(field: string): Observable<any> {
  return new Observable((observer) => {
    this.storage.getUserDetails().then((user: any) => {
      if (!user || user[field] === undefined) {
        observer.error(`Missing ${field} in userDetails storage`);
      } else {
        observer.next(user[field]);
        observer.complete();
      }
    });
  });
}


  private getAccessData(): Observable<any> {
    return new Observable((observer) => {
      this.storage.getUserDetails().then((user: any) => {
        if (!user) return observer.error('User not logged in');

        observer.next({
          branchId: Number(user.branchId),
          vendorId: Number(user.vendorId),
          vendorType: user.vendorType || [],
          token: user.accessToken
        });

        observer.complete();
      });
    });
  }

  /** -------- AUTH APIs ---------- */

  sendOtp(mobileNo: string): Observable<any> {
    return this.post(API_ENDPOINTS.LOGIN.SENDOTP, { mobileNo });
  }

  verifyOtp(otp: string, mobileNo: string): Observable<any> {
    return this.post(API_ENDPOINTS.LOGIN.VERIFYOTP, { otp, mobileNo });
  }

  /** -------- BOOKING APIs (Always use userDetails) ---------- */

  getPanelOneCount(): Observable<any> {
    return this.getAccessData().pipe(
      switchMap(({ branchId, token }) => {
        const url = `${API_ENDPOINTS.BOOKING.PANNELONECOUNT}?branchId=${branchId}`;
        return this.get(url, token);
      })
    );
  }

  getPanelTwoTable(date: string): Observable<any> {
    return this.getAccessData().pipe(
      switchMap(({ branchId, token }) => {
        const url = `${API_ENDPOINTS.BOOKING.PANNELTWOTABLE}?branchId=${branchId}&date=${date}`;
        return this.get(url, token);
      })
    );
  }

  getPanelThreeData(): Observable<any> {
    return this.getAccessData().pipe(
      switchMap(({ branchId, token }) => {
        const url = `${API_ENDPOINTS.BOOKING.PANNELTHREEDATA}?branchId=${branchId}`;
        return this.get(url, token);
      })
    );
  }

  getPanelFourData(year: number, month: number): Observable<any> {
    return this.getAccessData().pipe(
      switchMap(({ branchId, token }) => {
        const url = `${API_ENDPOINTS.BOOKING.PANNELFOUR}?year=${year}&month=${month}&branchId=${branchId}`;
        return this.get(url, token);
      })
    );
  }

  getBranchDetails(): Observable<any> {
    return this.getAccessData().pipe(
      switchMap(({ vendorId, token }) => {
        const url = `${API_ENDPOINTS.BOOKING.LOCATIONDROPDOWN}?id=${vendorId}`;
        return this.get(url, token);
      })
    );
  }

  getAssignedSfxDetails(assignedBranchId: number): Observable<any> {
    return this.getAccessData().pipe(
      switchMap(({ token }) => {
        const url = `${API_ENDPOINTS.BOOKING.ASSIGNEDSFXDETAILS}?assignedBranchId=${assignedBranchId}`;
        return this.get(url, token);
      })
    );
  }

  getZeroPickupDetails(assignedBranchId: number): Observable<any> {
    return this.getAccessData().pipe(
      switchMap(({ token }) => {
        const url = `${API_ENDPOINTS.BOOKING.ZEROPICKUP}?assignedBranchId=${assignedBranchId}`;
        return this.get(url, token);
      })
    );
  }

  getNotManifestedDetails(): Observable<any> {
    return this.getAccessData().pipe(
      switchMap(({ branchId, token }) => {
        const url = `${API_ENDPOINTS.BOOKING.NOTMANIFISTED}?branchId=${branchId}`;
        return this.get(url, token);
      })
    );
  }

  getDraftWaybillDetails(): Observable<any> {
    return this.getAccessData().pipe(
      switchMap(({ branchId, token }) => {
        const url = `${API_ENDPOINTS.BOOKING.DRAFTWATBILL}?branchId=${branchId}`;
        return this.get(url, token);
      })
    );
  }

  getPanelTwoShortExcessDetails(manifestNo: string): Observable<any> {
    return this.getAccessData().pipe(
      switchMap(({ token }) => {
        const url = `${API_ENDPOINTS.BOOKING.SHEXMODAL}?manifestNo=${manifestNo}`;
        return this.get(url, token);
      })
    );
  }

  getVendorDetails(): Observable<any> {
    return this.getAccessData().pipe(
      switchMap(({ vendorId, token }) => {
        const url = `${API_ENDPOINTS.VENDOR.DETAILS}/${vendorId}/details`;
        return this.get(url, token);
      })
    );
  }

}
