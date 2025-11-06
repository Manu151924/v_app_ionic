import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {  IonicModule } from '@ionic/angular';


@Component({
  selector: 'app-trip-report-delivery',
  templateUrl: './trip-report-delivery.component.html',
  styleUrls: ['./trip-report-delivery.component.scss'],
  imports:[FormsModule,CommonModule,IonicModule]

})
export class TripReportDeliveryComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}
  showAll = false;

 tripStatusRows = [
    { vehicle: '1234', ofdStatus: 16, total: 20, lastUpdated: '12:00' },
    { vehicle: '4321', ofdStatus: 11, total: 17, lastUpdated: '14:00' },
    { vehicle: '7733', ofdStatus: 12, total: 22, lastUpdated: '10:00' },
    { vehicle: '8973', ofdStatus: 10, total: 23, lastUpdated: '09:00' },
    { vehicle: '1287', ofdStatus: 0, total: 24, lastUpdated: '05:00' },
    { vehicle: '1281', ofdStatus: 1, total: 25, lastUpdated: '04:00' },
  ];

  absentRows = [
    { vehicleNo: '1654', lastTripDate: '18-Aug-2024' },
    { vehicleNo: '1218', lastTripDate: '17-Aug-2024' }
  ];
    get visibleTripStatusRows() {
    return this.showAll ? this.tripStatusRows : this.tripStatusRows.slice(0, 5);
  }
   toggleShowAll() {
    this.showAll = !this.showAll;
  }
  getTextColorClass(val: number, expected: number) {
    return val === expected ? 'green' : 'red';
  }

}
