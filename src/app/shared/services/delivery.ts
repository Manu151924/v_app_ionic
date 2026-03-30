import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';
import { API_ENDPOINTS } from '../utilities/api-end-point';
import { environment } from 'src/environments/environment';


export interface TripVehicle {
  vehNo: string;
  ofdStatus: string;
  statusColor: 'green' | 'yellow' | 'red' | string;
  lastUpdated: string;
}

export interface AbsentVehicle {
  vehNo: string;
  lastTripDate: string; 
}

export interface PanelFourResponse {
  totalWaybills: number;
  deliveredWaybills: number;
  undeliveredWaybills: number;
  deliveredWeight: string;
  undeliveredWeight: string;
  safedropUsage: number;
  marketVehicleCount: number;
  vehicleAttendence: number;
}

@Injectable({ providedIn: 'root' })
export class Delivery {
    constructor(private http: HttpClient) {}
    private getHeaders(token?: string): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  private handleError(err: any) {
    if (err?.name === 'TimeoutError') {
      return throwError(() => ({
        error: { message: 'Server response timed out (20s). Please try again later.' }
      }));
    }

    if (err?.status === 0) {
      return throwError(() => ({
        error: { message: 'Unable to reach server. Check your internet connection.' }
      }));
    }

    return throwError(() => err);
  }

    private get(url: string, token?: string): Observable<any> {
      return this.http.get(url, { headers: this.getHeaders(token) }).pipe(
        timeout(environment.apiTimeout),
        catchError(err => this.handleError(err))
      );
    }
    getPanelThreeDeliveryData(
      propeliId: number,
      vendorId: number,
      token: string
    ): Observable<any> {
      const url = `${API_ENDPOINTS.DELIVERY.PANNELTHREE}?propeliId=${propeliId}&vendorId=${vendorId}`;
      return this.get(url, token);
    }
     getDeliveryPanelFourData(
    year: number,
    month: number,
    propeliId: number,
    vendorId: number,
    token: string
  ): Observable<any> {
    const url = `${API_ENDPOINTS.DELIVERY.PANEELFOUR}?year=${year}&month=${month}&propeliId=${propeliId}&vendorId=${vendorId}`;
    return this.get(url, token);
  }
}
