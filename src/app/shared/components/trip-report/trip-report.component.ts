import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgxSpinnerService, NgxSpinnerComponent, NgxSpinnerModule } from 'ngx-spinner';

import { ShExModalComponent } from '../../modal/sh-ex-modal/sh-ex-modal.component';
import { Api } from '../../services/api';
import { Auth } from '../../services/auth';
import { AppStorageService } from '../../services/app-storage';
@Component({
  selector: 'app-trip-report',
  standalone: true,
  templateUrl: './trip-report.component.html',
  styleUrls: ['./trip-report.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    NgxSpinnerComponent,
    NgxSpinnerModule,
    MatNativeDateModule
  ],
})
export class TripReportComponent implements OnInit {

  private modalController = inject(ModalController);
  private toastController = inject(ToastController);
  private api = inject(Api);
  private spinner = inject(NgxSpinnerService);
  private auth = inject(Auth);
  private storage = inject(AppStorageService);

  today = new Date();
  selectedDate: Date = new Date();
  selectedDateISO = '';
  selectedDateLabel = 'Today';

  minDate!: Date;
  maxDate!: Date;

  showCalendar = false;
  showAll = false;

  branchId: number = 0;

  tripStatusRows: any[] = [];
  absentRows: any[] = [];

  async ngOnInit() {
    console.log("ngOnInit started");

    const user = await this.storage.getUserDetails();

    if (!user || !user.branchId) {
      console.error("No branchId stored!");
      this.showToast("Cannot fetch trip data. Branch info missing.");
      return;
    }

    this.branchId = user.branchId;
    console.log("Final branchId:", this.branchId);

    this.setDateRange();
    this.fetchTripAndAbsentData();
  }

  normalize(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

async fetchTripAndAbsentData(): Promise<void> {
  this.spinner.show();

  try {
    const apiDate = this.formatApiDate(this.selectedDate);

    this.api.getPanelTwoTable(apiDate).subscribe({
      next: (res: any) => {
        this.spinner.hide();

        if (!res?.responseStatus || !res?.responseObject) {
          this.tripStatusRows = [];
          this.absentRows = [];
          this.showToast('No data found for selected date.');
          return;
        }

        const { tripStatusResponse, absentVehicleResponse } = res.responseObject;

        this.tripStatusRows = (tripStatusResponse?.tripStatus || []).map((row: any) => ({
          ...row,
          vehcleNoShort: row.vehcleNo?.slice(-4) || '-'
        }));

        this.absentRows =
          absentVehicleResponse?.absentVehicles?.map((v: any) => ({
            vehicleNo: v.vehcleNo,
            vehicleNoShort: v.vehcleNo?.slice(-4) || '-',
            lastPickup: v.lastPickupDate?.split(' ')[0] || '-',
          })) || [];
      },
      error: () => {
        this.spinner.hide();
        this.showToast('Failed to fetch trip data. Try again.');
      },
    });

  } catch {
    this.spinner.hide();
    this.showToast("Authentication failed. Please re-login.");
  }
}


  formatApiDate(date: Date): string {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    return `${date.getFullYear()}-${mm}-${dd}`;
  }

  // -------- Visible Rows ----------
  get visibleTripStatusRows() {
    return this.showAll ? this.tripStatusRows : this.tripStatusRows.slice(0, 5);
  }

  get visibleAbsentRows() {
    return this.showAll ? this.absentRows : this.absentRows.slice(0, 5);
  }

  toggleShowAll() {
    this.showAll = !this.showAll;
  }

  getTextColorClass(val: number, expected: number) {
    return val === expected ? 'green' : 'red';
  }

  // -------- Calendar ----------
  toggleCalendar(event: MouseEvent) {
    event.stopPropagation();
    this.showCalendar = !this.showCalendar;
  }

  onDateChange(selected: Date) {
    this.selectedDate = selected;
    this.selectedDateISO = selected.toISOString();

    const today = new Date();
    this.selectedDateLabel =
      selected.toDateString() === today.toDateString()
        ? 'Today'
        : selected.toLocaleDateString('en-GB', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });

    this.showCalendar = false;
    this.fetchTripAndAbsentData();
  }

  @HostListener('document:click')
  onDocumentClick() {
    if (this.showCalendar) this.showCalendar = false;
  }

  calendarKey = 0;

  private setDateRange(): void {
    const today = new Date();

    setTimeout(() => {
      const max = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const min = new Date(today);
      min.setMonth(today.getMonth() - 3);

      this.maxDate = max;
      this.minDate = min;

      this.calendarKey++;
    }, 30);
  }

  // -------- Modal ----------
  selectedVehicle = '';
  shExDetails: any[] = [];

  async openShExModal(manifestNo: string, vehicleNo: string) {
    if (!manifestNo) {
      this.showToast('Manifest number not found.');
      return;
    }

    await this.fetchShExDetails(manifestNo);

    const modal = await this.modalController.create({
      component: ShExModalComponent,
      componentProps: {
        shExDetails: this.shExDetails,
        vehcleNoFull: vehicleNo
      },
      cssClass: 'bottom-sheet-modal',
      backdropDismiss: true,
      breakpoints: [0, 0.65, 0.95],
      initialBreakpoint: 0.65
    });

    await modal.present();
  }

  async fetchShExDetails(manifestNo: string): Promise<void> {
    const token = await this.auth.getAccessToken();

    return new Promise((resolve) => {
      this.api.getPanelTwoShortExcessDetails(manifestNo).subscribe({
        next: (res: any) => {
          if (!res?.responseStatus || !res?.responseObject) {
            this.shExDetails = [];
            resolve();
            return;
          }

          this.shExDetails = res.responseObject.map((item: any) => ({
            waybill: item.wayblNo,
            booked: item.booked,
            manifested: item.manifest,
            received: item.received,
            consignor: item.ccName,
            pickupDate: item.pickDt,
            status: item.status,
            vehicleNo: item.vehcleNo
          }));

          resolve();
        },
        error: () => {
          this.shExDetails = [];
          resolve();
        }
      });
    });
  }

  // -------- Toast ----------
  async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'medium',
      position: 'bottom',
    });
    toast.present();
  }
}
