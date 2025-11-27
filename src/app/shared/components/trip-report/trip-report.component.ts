import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ShExModalComponent } from '../../modal/sh-ex-modal/sh-ex-modal.component';
import { Api } from '../../services/api';

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
    MatNativeDateModule
  ],
})
export class TripReportComponent implements OnInit {
  private modalController = inject(ModalController);
  private toastController = inject(ToastController);
  private api = inject(Api);

  today = new Date();
  selectedDate: Date = new Date();
  selectedDateISO = '';
  selectedDateLabel = 'Today';

  minDate!: Date;
  maxDate!: Date;

  showCalendar = false;
  showAll = false;

  branchId = 0;

  tripStatusRows: any[] = [];
  absentRows: any[] = [];

  ngOnInit() {
    this.branchId = this.getBranchId();

    // if (!this.branchId) {
    //   this.showToast('Branch ID not found. Please select a branch.');
    //   return;
    // }

    this.setDateRange();
    this.fetchTripAndAbsentData();
  }

  private getBranchId(): number {
    return Number(localStorage.getItem('branchId')) || 0;
  }
  normalize(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}


  // -------------------- API --------------------
  fetchTripAndAbsentData(): void {
    const token = localStorage.getItem('accessToken') ?? '';
    const apiDate = this.formatApiDate(this.selectedDate);

    this.api.getPanelTwoTable(this.branchId, apiDate, token).subscribe({
      next: (res: any) => {
        if (!res?.responseStatus || !res?.responseObject) {
          this.tripStatusRows = [];
          this.absentRows = [];
          this.showToast('No data found for selected date.');
          return;
        }

        const { tripStatusResponse, absentVehicleResponse } = res.responseObject;

        this.tripStatusRows = tripStatusResponse?.tripStatus || [];

        this.absentRows =
          absentVehicleResponse?.absentVehicles?.map((v: any) => ({
            vehicleNo: v.vehcleNo,
            lastPickup: v.lastPickupDate?.split(' ')[0] || '-',
          })) || [];
      },
      error: () => this.showToast('Failed to fetch trip data. Please try again.'),
    });
  }

  formatApiDate(date: Date): string {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    return `${date.getFullYear()}-${mm}-${dd}`;
  }

  // -------------------- VISIBLE ROWS --------------------
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

  // -------------------- CALENDAR --------------------
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

    this.maxDate = new Date(max.getFullYear(), max.getMonth(), max.getDate());
    this.minDate = new Date(min.getFullYear(), min.getMonth(), min.getDate());

    this.calendarKey++;
  }, 30);
}


  // -------------------- MODAL --------------------
async openShExModal(manifestNo: string) {
  if (!manifestNo) {
    this.showToast('Manifest number not found.');
    return;
  }

  await this.fetchShExDetails(manifestNo);

  const modal = await this.modalController.create({
    component: ShExModalComponent,
    componentProps: {
      shExDetails: this.shExDetails,
      vehicleNo: this.shExDetails?.[0]?.vehicleNo || '-'   // ✅ ADD THIS
    },
 cssClass: 'bottom-sheet-modal',
        backdropDismiss: true,
        breakpoints: [0, 0.65, 0.95],
        initialBreakpoint: 0.65  });

  await modal.present();
}




  selectedVehicle = '';
  shExDetails: any[] = [];

fetchShExDetails(manifestNo: string): Promise<void> {
  return new Promise((resolve) => {
    const token = localStorage.getItem('accessToken') ?? '';

    this.api.getPanelTwoShortExcessDetails(manifestNo, token).subscribe({
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
          vehicleNo: item.vehicleNo
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



  // -------------------- TOAST --------------------
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
