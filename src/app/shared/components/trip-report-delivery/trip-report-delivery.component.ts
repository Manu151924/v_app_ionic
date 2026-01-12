import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  HostListener,
  ChangeDetectorRef,
  NgZone,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgxSpinnerService, NgxSpinnerModule } from 'ngx-spinner';

import { Api } from '../../services/api';
import { Auth } from '../../services/auth';
import { addIcons } from 'ionicons';
import { checkmarkCircle, locationSharp } from 'ionicons/icons';
import { Crashlytics } from '../../services/crashlytics';

@Component({
  selector: 'app-trip-report-delivery',
  templateUrl: './trip-report-delivery.component.html',
  styleUrls: ['./trip-report-delivery.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    NgxSpinnerModule,
  ],
})
export class TripReportDeliveryComponent implements OnInit, OnChanges {
  @Input() deliveryBranchId!: number;
  @Input() deliveryVendorId!: number;

  private api = inject(Api);
  private auth = inject(Auth);
  private crashlytics = inject(Crashlytics);
  private toast = inject(ToastController);
  private spinner = inject(NgxSpinnerService);
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);

  today = new Date();
  selectedDate: Date = new Date();
  selectedDateLabel = 'Today';

  minDate!: Date;
  maxDate!: Date;
  calendarKey = 0;
  showCalendar = false;
  showAll = false;

  tripStatusRows: any[] = [];
  absentRows: any[] = [];
  totalDelAndUnDel: any = {};
  isPopoverOpen = false;
  popoverEvent: any;

  constructor() {
    addIcons({ checkmarkCircle, locationSharp });
  }

  ngOnInit() {
    this.setDateRange();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.deliveryBranchId && this.deliveryVendorId) {
      // this.crashlytics.logBusinessEvent('TRIP_REPORT_OPEN', {
      //   vendor: this.deliveryVendorId,
      //   branch: this.deliveryBranchId,
      //   date: this.formatApiDate(this.selectedDate),
      // });

      this.fetchTripAndAbsentData();
    }
  }

  async doRefresh(event: any) {
    await this.fetchTripAndAbsentData();
    event.target.complete();
  }

  // ---------------- API ----------------

  async fetchTripAndAbsentData(): Promise<void> {
    this.spinner.show();

    try {
      const token = await this.auth.getAccessToken();

      if (!token) {
        this.spinner.hide();
        this.showToast('Session expired. Please login again.');

        this.crashlytics.recordNonFatal('No token', 'TRIP_AUTH_MISSING', [
          {
            key: 'vendor',
            value: String(this.deliveryVendorId),
            type: 'string',
          },
          {
            key: 'branch',
            value: String(this.deliveryBranchId),
            type: 'string',
          },
        ]);
        return;
      }

      const apiDate = this.formatApiDate(this.selectedDate);

      this.api
        .getPanelDelivryTwoTable(
          this.deliveryBranchId,
          apiDate,
          token,
          this.deliveryVendorId
        )
        .subscribe({
          next: (res: any) => {
            this.zone.run(() => {
              this.spinner.hide();

              if (!res?.responseStatus || !res?.responseObject) {
                this.tripStatusRows = [];
                this.absentRows = [];
                this.totalDelAndUnDel = {};
                return;
              }

              const obj = res.responseObject;

              this.totalDelAndUnDel = {
                totalDelivered: obj.totalDelivered,
                totalOfd: obj.totalOfd,
                totalPackages: obj.totalPackages,
                totalUndelivered: obj.totalUndelivered,
                totalWeight: obj.totalWeight,
              };

              // Sort by last attempt
              const sortedTrips = (obj.trips || []).sort((a: any, b: any) => {
                return (
                  new Date(b.lastUpdatedDate || 0).getTime() -
                  new Date(a.lastUpdatedDate || 0).getTime()
                );
              });

              this.tripStatusRows = sortedTrips.map((t: any) => ({
                vehicle: t.vehicleNo,
                vehcleNoShort: t.vehicleNo?.slice(-4) || '-',
                manifestedWB: t.ofd || 0,
                unloadedWB: t.delivered || 0,
                lastUpdated: this.formatTime(t.lastUpdatedDate),
                shortExcessCount: Math.abs((t.ofd || 0) - (t.delivered || 0)),
                multipleTripStatus: t.multipleTripStatus,
                manifestNumbers: t.manifestNumbers || [],
                lastLocation: t.lastLocation,
              }));

              this.absentRows = (obj.absentVehicles || []).map((v: any) => ({
                vehicleNo: v.vehicleNo,
                vehicleNoShort: v.vehicleNo?.slice(-4) || '-',
                lastPickup: v.lastTripDate?.split('T')[0] || '-',
              }));

              this.cdr.markForCheck();
            });
          },

          error: (err) => {
            this.spinner.hide();
            this.showToast('Failed to fetch trip data.');
          },
        });
    } catch (e) {
      this.spinner.hide();
      this.showToast('Something went wrong.');
    }
  }

  // ---------------- Date ----------------

  formatApiDate(date: Date): string {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    return `${date.getFullYear()}-${mm}-${dd}`;
  }

  formatTime(dateStr: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  toggleCalendar(event: MouseEvent) {
    event.stopPropagation();
    this.showCalendar = !this.showCalendar;
  }

  onDateChange(date: Date) {
    this.selectedDate = date;
    this.selectedDateLabel =
      date.toDateString() === new Date().toDateString()
        ? 'Today'
        : date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });

    this.showCalendar = false;
    this.fetchTripAndAbsentData();
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.showCalendar = false;
  }

  private setDateRange() {
    const today = new Date();
    this.maxDate = new Date(today);
    const min = new Date(today);
    min.setMonth(today.getMonth() - 3);
    this.minDate = min;
    this.calendarKey++;
  }

  // ---------------- UI ----------------

  get visibleTripStatusRows() {
    return this.showAll ? this.tripStatusRows : this.tripStatusRows.slice(0, 5);
  }

  get visibleAbsentRows() {
    return this.showAll ? this.absentRows : this.absentRows.slice(0, 5);
  }

  toggleShowAll() {
    this.showAll = !this.showAll;
  }
  isMatch(a: number, b: number) {
    return Number(a) === Number(b);
  }

  async showToast(msg: string) {
    const t = await this.toast.create({
      message: msg,
      duration: 3000,
      color: 'medium',
      position: 'bottom',
    });
    t.present();
  }

  showPopover(ev: MouseEvent, lastLocation: any) {
    if (lastLocation !== null) {
      this.popoverEvent = ev;
      this.isPopoverOpen = true;
    }
  }

  hidePopover() {
    this.isPopoverOpen = false;
  }
  selectedManifestNumbers: string[] = [];
  isMfOpen = false;
  mfEvent: any;



showPopoverManifest(ev: MouseEvent, manifestNumbers: string[]) {
  if (!manifestNumbers || manifestNumbers.length === 0) return;

  ev.stopPropagation();

  this.selectedManifestNumbers = manifestNumbers;
  this.mfEvent = ev;
  this.isMfOpen = true;
}

hidePopoverManifest() {
  this.isMfOpen = false;
  this.selectedManifestNumbers = [];
}

}
