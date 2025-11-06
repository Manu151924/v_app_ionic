import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class Api {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  private handleError(err: any) {
    if (err.name === 'TimeoutError') {
      return throwError(() => ({
        error: { message: 'Server response timed out (10s). Please try again later.' }
      }));
    }
    if (err.status === 0) {
      return throwError(() => ({
        error: { message: 'Unable to reach server. Check your network connection.' }
      }));
    }
    return throwError(() => err);
  }

  sendOtp(mobileNo: string): Observable<any> {
    const url = `${this.baseUrl}sendOtpSmsAndWhatsApp`;
    const body = { mobileNo };
    return this.http.post(url, body, { headers: this.getHeaders() }).pipe(
      timeout(20000), 
      catchError((err) => this.handleError(err))
    );
  }

  verifyOtp(otp: string, mobileNo: string): Observable<any> {
    const url = `${this.baseUrl}verifyotp`;
    const body = { otp, mobileNo };
    return this.http.post(url, body, { headers: this.getHeaders() }).pipe(
      timeout(20000), 
      catchError((err) => this.handleError(err))
    );
  }
}
