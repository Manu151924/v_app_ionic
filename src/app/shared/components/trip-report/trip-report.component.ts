import {
  Component,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  NgxSpinnerService,
  NgxSpinnerComponent,
  NgxSpinnerModule,
} from 'ngx-spinner';

import { ShExModalComponent } from '../../modal/sh-ex-modal/sh-ex-modal.component';
import { Api } from '../../services/api';
import { Auth } from '../../services/auth';
import { Crashlytics } from '../../services/crashlytics';

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
    MatNativeDateModule,
  ],
})
export class TripReportComponent implements OnInit, OnChanges {
  /* ---------------- Inputs ---------------- */
  @Input() branchId!: number;

  /* ---------------- Injected Services ---------------- */
  private modalController = inject(ModalController);
  private toastController = inject(ToastController);
  private api = inject(Api);
  private auth = inject(Auth);
  private spinner = inject(NgxSpinnerService);
  private crashlytics = inject(Crashlytics);

  /* ---------------- State ---------------- */

  today = new Date();
  selectedDate: Date = new Date();
  selectedDateLabel = 'Today';

  minDate!: Date;
  maxDate!: Date;

  showCalendar = false;
  showAll = false;

  tripStatusRows: any[] = [];
  absentRows: any[] = [];

  calendarKey = 0;

  ngOnInit() {
    this.setDateRange();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['branchId'] && changes['branchId'].currentValue) {
      // this.crashlytics.logBusinessEvent('BOOKING_TRIP_REPORT_OPEN', {
      //   branch: this.branchId,
      //   date: this.formatApiDate(this.selectedDate),
      // });

      this.fetchTripAndAbsentData();
    }
  }

  /* ---------------- API ---------------- */

async fetchTripAndAbsentData(): Promise<void> {
  this.spinner.show();

  const token = await this.auth.getAccessToken();

  if (!token) {
    this.spinner.hide();
    this.showToast('Session expired. Please login again.');
    return;
  }

  const apiDate = this.formatApiDate(this.selectedDate);

  this.api.getPanelTwoTable(this.branchId, apiDate, token).subscribe({
    next: (res: any) => {
      this.spinner.hide();

      if (!res?.responseStatus || !res?.responseObject) {
        this.tripStatusRows = [];
        this.absentRows = [];
        this.showToast('No data found for selected date.');
        return;
      }

      const { tripStatusResponse, absentVehicleResponse } =
        res.responseObject;

      /* ---------------- Trip Status Sorting ---------------- */
      this.tripStatusRows = (tripStatusResponse?.tripStatus || [])
        .map((row: any) => ({
          ...row,
          vehcleNoShort: row.vehcleNo?.slice(-4) || '-',
          manifestedPkgNum: Number(row.manifestedPkg || 0),
        }))
        // BA: Vehicle with maximum packages should come on top
        .sort((a: any, b: any) => b.manifestedPkgNum - a.manifestedPkgNum);

      /* ---------------- Absent Vehicle Sorting ---------------- */
      this.absentRows = (absentVehicleResponse?.absentVehicles || [])
        .map((v: any) => ({
          vehicleNo: v.vehcleNo,
          vehicleNoShort: v.vehcleNo?.slice(-4) || '-',
          lastPickupRaw: new Date(v.lastPickupDate),
          lastPickup: v.lastPickupDate?.split(' ')[0] || '-',
        }))
        // BA: Oldest last pickup date should come on top
        .sort(
          (a: any, b: any) =>
            a.lastPickupRaw.getTime() - b.lastPickupRaw.getTime()
        );
    },
    error: (err) => {
      this.spinner.hide();

      this.crashlytics.recordNonFatal(err, 'BOOKING_TRIP_API_FAILED', [
        { key: 'branch', value: String(this.branchId), type: 'string' },
        { key: 'date', value: apiDate, type: 'string' },
      ]);

      this.showToast('Failed to fetch trip data. Please try again.');
    },
  });
}


  /* ---------------- Date Helpers ---------------- */

  formatApiDate(date: Date): string {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    return `${date.getFullYear()}-${mm}-${dd}`;
  }

  toggleCalendar(event: MouseEvent) {
    event.stopPropagation();
    this.showCalendar = !this.showCalendar;
  }

  onDateChange(selected: Date) {
    this.selectedDate = selected;

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

  private setDateRange(): void {
    const today = new Date();

    setTimeout(() => {
      this.maxDate = new Date(today);
      const min = new Date(today);
      min.setMonth(today.getMonth() - 3);
      this.minDate = min;
      this.calendarKey++;
    }, 30);
  }

  /* ---------------- Visible Rows ---------------- */

  get visibleTripStatusRows() {
    return this.showAll ? this.tripStatusRows : this.tripStatusRows.slice(0, 5);
  }

  get visibleAbsentRows() {
    return this.showAll ? this.absentRows : this.absentRows.slice(0, 5);
  }

  toggleShowAll() {
    this.showAll = !this.showAll;
  }

  isMatch(mf: any, uld: any): boolean {
    if (mf == null || uld == null) return false;
    return Number(mf) === Number(uld);
  }

  getTextColorClass(val: number, expected: number) {
    return val === expected ? 'green' : 'red';
  }

  /* ---------------- Modal ---------------- */

  shExDetails: any[] = [];

  async openShExModal(manifestNo: string, vehicleNo: string) {
    if (!manifestNo) {
      this.showToast('Manifest number not found.');
      return;
    }

    await this.fetchShExDetails(manifestNo);
    // this.crashlytics.logBusinessEvent('SHORT_EXCESS_OPEN', {
    //   branch: this.branchId,
    //   manifest: manifestNo,
    //   vehicle: vehicleNo,
    // });

    const modal = await this.modalController.create({
      component: ShExModalComponent,
      componentProps: {
        shExDetails: this.shExDetails,
        vehcleNoFull: vehicleNo,
      },
      cssClass: 'bottom-sheet-modal',
      backdropDismiss: true,
      breakpoints: [0, 0.65, 0.95],
      initialBreakpoint: 0.65,
    });

    await modal.present();
  }

  private async fetchShExDetails(manifestNo: string): Promise<void> {
    const token = await this.auth.getAccessToken();
    if (!token) return;

    return new Promise((resolve) => {
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
            vehicleNo: item.vehcleNo,
          }));

          resolve();
        },
        error: (err) => {
          this.crashlytics.recordNonFatal(err, 'SHORT_EXCESS_API_FAILED', [
            { key: 'branch', value: String(this.branchId), type: 'string' },
            { key: 'manifest', value: manifestNo, type: 'string' },
          ]);
          this.shExDetails = [];
          resolve();
        },
      });
    });
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'medium',
      position: 'bottom',
    });
    await toast.present();
  }
  isPopoverOpen = false;
  popoverEvent: any;
  selectedManifestNo = '';

showPopover(ev: any, manifestNo: string) {
  if (!manifestNo) return;

  this.selectedManifestNo = manifestNo;
  this.popoverEvent = ev instanceof MouseEvent ? ev : ev?.detail?.event;
  this.isPopoverOpen = true;
}


  hidePopover() {
    this.isPopoverOpen = false;
  }
}
