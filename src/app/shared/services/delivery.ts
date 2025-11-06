import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';

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

@Injectable({ providedIn: 'root' })
export class Delivery {
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
}
