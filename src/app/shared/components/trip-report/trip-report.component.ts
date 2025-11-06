import { Component, HostListener, inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ModalController, IonicModule } from '@ionic/angular';
import { MatDatepicker } from '@angular/material/datepicker';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ShExModalComponent } from '../../modal/sh-ex-modal/sh-ex-modal.component';

@Component({
  selector: 'app-trip-report',
  templateUrl: './trip-report.component.html',
  styleUrls: ['./trip-report.component.scss'],
  imports:[FormsModule,CommonModule,IonicModule,MatInputModule,MatFormFieldModule,MatDatepickerModule]
})
export class TripReportComponent  implements OnInit {
    today = new Date();
   


  constructor() { }

  ngOnInit() {
    this.selectedMonths = this.today;
    this.setDateRange();
  }
    private modalController = inject(ModalController);
      showAll = false;

  get visibleTripStatusRows() {
    return this.showAll ? this.tripStatusRows : this.tripStatusRows.slice(0, 5);
  }
   toggleShowAll() {
    this.showAll = !this.showAll;
  }


  tripStatusRows = [
    { vehicle: '5555', mfVsUldWB: 16, mfManifestWB: 17, mfVsUldPkgs: 300, mfManifestPkgs: 296, shEx: 4, notUnloaded: false , mfNumber: 12345678},
    { vehicle: '4321', mfVsUldWB: 17, mfManifestWB: 17, mfVsUldPkgs: 222, mfManifestPkgs: 200, shEx: 0, notUnloaded: false , mfNumber: 12345678 },
    { vehicle: '7733', mfVsUldWB: 22, mfManifestWB: 22, mfVsUldPkgs: 122, mfManifestPkgs: 130, shEx: 1, notUnloaded: false , mfNumber: 12345678 },
    { vehicle: '1287', mfVsUldWB: 30, mfManifestWB: 24, mfVsUldPkgs: 90, mfManifestPkgs: 80, shEx: 6, notUnloaded: false  , mfNumber: 12345678},
    { vehicle: '8873', mfVsUldWB: 20, mfManifestWB: 20, mfVsUldPkgs: 108, mfManifestPkgs: 108, shEx: 0, notUnloaded: false , mfNumber: 12345678 },
    { vehicle: '5555', mfVsUldWB: 20, mfManifestWB: 2, mfVsUldPkgs: 110, mfManifestPkgs: 108, shEx: 0, notUnloaded: false , mfNumber: 12345678 }

  ];

  absentRows = [
    { vehicleNo: '1654', lastPickup: '18-Aug-2024' },
    { vehicleNo: '1218', lastPickup: '17-Aug-2024' }
  ];

  calendarOpen = false;
  // selectedDate!: Date;
  tempSelectedDate!: Date;
  displayDate: string = 'Today';
  selectedMonths: Date = new Date();
  minDate: string | undefined;
  maxDate: string | undefined;
 public selectedVehicle = '';
 public shExDetails: any[] = [];



getTextColorClass(val: number, expected: number) {
 return val === expected ? 'green' : 'red';}
  async openShExModal(vehicleNo: string) {
    console.log('Opening SH/EX Modal for', vehicleNo);
    this.selectedVehicle = vehicleNo;
    this.shExDetails = this.getShExDetails(vehicleNo);
    const modal = await this.modalController.create({
      component: ShExModalComponent,
      componentProps: { shExDetails: this.shExDetails, selectedVehicle: this.selectedVehicle },
      cssClass: 'sh-ex-modal'
    });
    await modal.present();
    await modal.onDidDismiss();
  }


getShExDetails(vehicleNo: string): any[] {
    if (vehicleNo === '5555') {
      return [
        { waybill: '1000 7474 8855', booked: 100, manifested: 100, received: 99, consignor: 'S.K. Electrical Pvt. Ltd.', pickupDate: '08-JUL-2025', status: 'Short' },
        { waybill: '1000 2020 2353', booked: 100, manifested: 100, received: 101, consignor: 'Sadashiv Electronics', pickupDate: '08-JUL-2025', status: 'Excess' },
        { waybill: '2000 9292 6754', booked: 100, manifested: 0, received: 2, consignor: 'J.S. Camicals', pickupDate: '08-JUL-2025', status: 'Excess' },
        { waybill: '2000 9633 9825', booked: 100, manifested: 100, received: 0, consignor: 'Samsung India Pvt. Ltd.', pickupDate: '08-JUL-2025', status: 'Short' }
      ];
    }
    return [
       { waybill: '1000 7474 8855', booked: 100, manifested: 100, received: 99, consignor: 'S.K. Electrical Pvt. Ltd.', pickupDate: '08-JUL-2025', status: 'Short' },
        { waybill: '1000 2020 2353', booked: 100, manifested: 100, received: 101, consignor: 'Sadashiv Electronics', pickupDate: '08-JUL-2025', status: 'Excess' },
        { waybill: '2000 9292 6754', booked: 100, manifested: 0, received: 2, consignor: 'J.S. Camicals', pickupDate: '08-JUL-2025', status: 'Excess' },
        { waybill: '2000 9633 9825', booked: 100, manifested: 100, received: 0, consignor: 'Samsung India Pvt. Ltd.', pickupDate: '08-JUL-2025', status: 'Short' }
    ];
  }

  formatDisplayDate(date?: Date): string {
  if (!date) return 'Today'; 

  const today = new Date();
  if (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  ) {
    return 'Today';
  }
  return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth()+1)
    .toString().padStart(2,'0')}-${date.getFullYear()}`;
}

private setDateRange(): void {
    const today = new Date();

    this.maxDate = today.toISOString();

    const min = new Date(today);
    min.setMonth(today.getMonth() - 3);
    this.minDate = min.toISOString();

    this.selectedDate = today.toISOString();
  }

  showCalendar = false;
  selectedDate: string = new Date().toISOString();
  selectedDateLabel = 'Today';

  toggleCalendar(event: MouseEvent) {
    event.stopPropagation();
    this.showCalendar = !this.showCalendar;
  }

  onDateChange(event: any) {
    this.selectedDate = event.detail.value;
    const selected = new Date(this.selectedDate);
    const today = new Date();

    if (
      selected.getDate() === today.getDate() &&
      selected.getMonth() === today.getMonth() &&
      selected.getFullYear() === today.getFullYear()
    ) {
      this.selectedDateLabel = 'Today';
    } else {
      this.selectedDateLabel = selected.toLocaleDateString('en-GB', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }

    this.showCalendar = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (this.showCalendar) {
      this.showCalendar = false;
      this.selectedDateLabel = 'Today'; 
    }
  }
}
