import {
  Component,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  inject,
} from '@angular/core';
import { Injectable } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DateAdapter, NativeDateAdapter } from '@angular/material/core';
import {
  NgxSpinnerService,
  NgxSpinnerComponent,
  NgxSpinnerModule,
} from 'ngx-spinner';

import { ShExModalComponent } from '../../modal/sh-ex-modal/sh-ex-modal.component';
import { Api } from '../../services/api';
import { Auth } from '../../services/auth';
import { Crashlytics } from '../../services/crashlytics';
@Injectable()
class InlineCalendarDateAdapter extends NativeDateAdapter {
  override getDayOfWeekNames(): string[] {
    return ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  }
}

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
  providers: [{ provide: DateAdapter, useClass: InlineCalendarDateAdapter }],
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
  selectedDateLabel = 'TODAY';

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

  public async refreshData(): Promise<void> {
  await this.fetchTripAndAbsentData();
}
  /* ---------------- API ---------------- */

  async fetchTripAndAbsentData(): Promise<void> {
    // this.spinner.show();

    const token = await this.auth.getAccessToken();

    if (!token) {
      // this.spinner.hide();
      this.showToast('Session expired. Please login again.');
      return;
    }

    const apiDate = this.formatApiDate(this.selectedDate);

    this.api.getPanelTwoTable(this.branchId, apiDate, token).subscribe({
      next: (res: any) => {
        // this.spinner.hide();

        if (!res?.responseStatus || !res?.responseObject) {
          this.tripStatusRows = [];
          this.absentRows = [];
          this.showToast('No data found for selected date.');
          return;
        }

        const { tripStatusResponse, absentVehicleResponse } =
          res.responseObject;

        this.tripStatusRows = (tripStatusResponse?.tripStatus || [])
          .map((row: any) => ({
            ...row,
            vehcleNoShort: row.vehcleNo?.slice(-4) || '-',
            manifestedPkgNum: Number(row.manifestedPkg || 0),
          }))
          .sort((a: any, b: any) => b.manifestedPkgNum - a.manifestedPkgNum);

        this.absentRows = (absentVehicleResponse?.absentVehicles || [])
          .map((v: any) => ({
            vehicleNo: v.vehcleNo,
            vehicleNoShort: v.vehcleNo?.slice(-4) || '-',
            lastPickupRaw: new Date(v.lastPickupDate),
            lastPickup: this.formatDisplayDate(v.lastPickupDate),
          }))
          .sort(
            (a: any, b: any) =>
              a.lastPickupRaw.getTime() - b.lastPickupRaw.getTime(),
          );
      },
      error: (err) => {
        // this.spinner.hide();

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
        ? 'TODAY'
        : selected.toLocaleDateString('en-GB', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }).toUpperCase();

    this.showCalendar = false;
    this.fetchTripAndAbsentData();
  }

  @HostListener('document:click', ['$event'])
  @HostListener('document:touchstart', ['$event'])
  handleOutsideInteraction(event: Event) {
    const target = event.target as HTMLElement;

    if (!target.closest('.calendar-popup') && !target.closest('.today-btn')) {
      this.showCalendar = false;
    }
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

  get isDisabled() {
  return this.tripStatusRows.length <= 5 && this.absentRows.length <= 5;
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
formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '-';

  const date = new Date(dateStr + 'Z'); 
  if (isNaN(date.getTime())) return '-';

  const day = String(date.getUTCDate()).padStart(2, '0');
  let month = date
    .toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' })
    .toUpperCase();
  const year = date.getUTCFullYear();

  if (month === 'SEPT') month = 'SEP'; 

  return `${day}-${month}-${year}`;
}

  /* ---------------- Modal ---------------- */

  shExDetails: any[] = [];
  public isSHEXModelOpen = false;

  async openShExModal(manifestNo: string, vehicleNo: string) {
    if (this.isSHEXModelOpen) {
      return;
    }

    if (!manifestNo) {
      this.showToast('Manifest number not found.');
      return;
    }

    this.isSHEXModelOpen = true;

    try {
      await this.fetchShExDetails(manifestNo);

      const modal = await this.modalController.create({
        component: ShExModalComponent,
        componentProps: {
          shExDetails: this.shExDetails,
          vehcleNoFull: vehicleNo,
        },
        cssClass: 'bottom-sheet-modal',
        backdropDismiss: true,
        breakpoints: [0, 0.65, 1],
        initialBreakpoint: 0.65,
      });

      modal.onDidDismiss().then(() => {
        this.isSHEXModelOpen = false;
      });

      await modal.present();
    } catch (err) {
      this.isSHEXModelOpen = false;
    }
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
