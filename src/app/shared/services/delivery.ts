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

  private tripVehicles$ = new BehaviorSubject<TripVehicle[]>([
    { vehNo: '1234', ofdStatus: '16/20', lastUpdated: '12:00', statusColor: 'green' },
    { vehNo: '4321', ofdStatus: '11/17', lastUpdated: '14:00', statusColor: 'green' },
    { vehNo: '7733*', ofdStatus: '12/22', lastUpdated: '10:00', statusColor: 'yellow' },
    { vehNo: '8973', ofdStatus: '10/23', lastUpdated: '09:00', statusColor: 'green' },
    { vehNo: '1287', ofdStatus: '00/24', lastUpdated: '05:00', statusColor: 'red' },
    { vehNo: '1283', ofdStatus: '00/24', lastUpdated: '05:00', statusColor: 'red' }
  ]);

  private absentVehicles$ = new BehaviorSubject<AbsentVehicle[]>([
    { vehNo: '1111', lastTripDate: '15-Aug-2025' },
    { vehNo: '9999', lastTripDate: '15-Aug-2024' },
  ]);

  getTripVehicles(): Observable<TripVehicle[]> {
    return this.tripVehicles$.asObservable();
  }

  getAbsentVehicles(): Observable<AbsentVehicle[]> {
    return this.absentVehicles$.asObservable();
  }

  getBarData() {
    return of([
      { name: 'DWARKA', value: Math.floor(Math.random() * (999 - 100 + 1)) + 100 },
      { name: 'KAROLBAGH', value: Math.floor(Math.random() * (999 - 100 + 1)) + 100 },
      { name: 'UTTAM NAGAR', value: Math.floor(Math.random() * (999 - 100 + 1)) + 100 },
      { name: 'MAHIPALPUR', value: Math.floor(Math.random() * (999 - 100 + 1)) + 100 },
      { name: 'VASANTKUNJ', value: Math.floor(Math.random() * (999 - 100 + 1)) + 100 }
    ]);
  }
  

  getPieChartData() {
    return of([
      { name: 'Delivered', value: 370 },
      { name: 'Un-Delivered', value: 180 }
    ]);
  }
  getPieChart(){
    return of([
      { name: 'Edited waybill', value: 30 },
      { name: 'waybill', value: 150 }
    ]);
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
