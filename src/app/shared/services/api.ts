import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';
import { API_ENDPOINTS } from '../utilities/api-end-point';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class Api {
  constructor(private http: HttpClient) {}

  private getHeaders(token?: string): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return headers;
  }

  private handleError(err: any) {
    if (err.name === 'TimeoutError') {
      return throwError(() => ({
        error: { message: 'Server response timed out (20s). Please try again later.' },
      }));
    }
    if (err.status === 0) {
      return throwError(() => ({
        error: { message: 'Unable to reach server. Check your internet connection.' },
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

  sendOtp(mobileNo: string): Observable<any> {
    const body = { mobileNo };
    return this.post(API_ENDPOINTS.LOGIN.SENDOTP, body);
  }

  verifyOtp(otp: string, mobileNo: string): Observable<any> {
    const body = { otp, mobileNo };
    return this.post(API_ENDPOINTS.LOGIN.VERIFYOTP, body);
  }

  getPanelOneCount(branchId: number, token: string): Observable<any> {
    const url = `${API_ENDPOINTS.BOOKING.PANNELONECOUNT}?branchId=${branchId}`;
    return this.get(url, token);
  }
  getPanelTwoTable(branchId: number, date: string, token: string): Observable<any> {
    const url = `${API_ENDPOINTS.BOOKING.PANNELTWOTABLE}?branchId=${branchId}&date=${date}`;
    return this.get(url, token);
  }
  getPanelThreeData(branchId: number, token:string): Observable<any>{
    const url = `${API_ENDPOINTS.BOOKING.PANNELTHREEDATA}?branchId=${branchId}`;
    return this.get(url, token);
  }
  getPanelFourData(year: number, month: number, branchId: number, token: string): Observable<any>{
    const url = `${API_ENDPOINTS.BOOKING.PANNELFOUR}?year=${year}&month=${month}&branchId=${branchId}`;
    return this.get(url, token)
  }
  getBranchDetails(token: string){
    const vendorId = localStorage.getItem('bookingVendorId') ?? '0';
    const url = `${API_ENDPOINTS.BOOKING.LOCATIONDROPDOWN}?id=${vendorId}`;
     return this.get(url, token);
  }
  getAssignedSfxDetails(assignedBranchId: number, token: string): Observable<any> {
    const url = `${API_ENDPOINTS.BOOKING.ASSIGNEDSFXDETAILS}?assignedBranchId=${assignedBranchId}`;
    return this.get(url, token);
  }
  getZeroPickupDetails(assignedBranchId: number, token: string): Observable<any> {
    const url = `${API_ENDPOINTS.BOOKING.ZEROPICKUP}?assignedBranchId=${assignedBranchId}`;
    return this.get(url, token);
  }
  getNotManifestedDetails(branchId: number, token: string): Observable<any> {
    const url = `${API_ENDPOINTS.BOOKING.NOTMANIFISTED}?branchId=${branchId}`;
    return this.get(url, token);
  }
  getDraftWaybillDetails(branchId: number, token: string): Observable<any> {
    const url = `${API_ENDPOINTS.BOOKING.DRAFTWATBILL}?branchId=${branchId}`;
    return this.get(url, token);
  }
  getPanelTwoShortExcessDetails(manifestNo:string, token: string): Observable<any>{
    const url = `${API_ENDPOINTS.BOOKING.SHEXMODAL}?manifestNo=${manifestNo}`;
    return this.get(url, token)
  }
  getVendorDetails(bookingVendorId: string, token: string) {
    const url = `${API_ENDPOINTS.VENDOR.DETAILS}/${bookingVendorId}/details`;
    return this.get(url, token);
  }

}
