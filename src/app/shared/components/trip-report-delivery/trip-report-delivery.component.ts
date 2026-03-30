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
  Injectable,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgxSpinnerService, NgxSpinnerModule } from 'ngx-spinner';
import { DateAdapter, NativeDateAdapter } from '@angular/material/core';

import { Api } from '../../services/api';
import { Auth } from '../../services/auth';
import { addIcons } from 'ionicons';
import { checkmarkCircle, locationSharp } from 'ionicons/icons';
import { Crashlytics } from '../../services/crashlytics';

interface TripStatusRow {
  vehicle: any;
  vehcleNoShort: any;
  manifestedWB: any;
  unloadedWB: any;
  lastUpdated: any;
  shortExcessCount: any;
  multipleTripStatus: any;
  manifestNumbers: any;
  lastLocation: string;
  showLocation: boolean;
  lat?: number;
  long?: number;
  address?: string;
}

@Injectable()
class InlineCalendarDateAdapter extends NativeDateAdapter {
  override getDayOfWeekNames(): string[] {
    return ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  }
}

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
  providers: [{ provide: DateAdapter, useClass: InlineCalendarDateAdapter }],
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
  selectedDateLabel = 'TODAY';

  minDate!: Date;
  maxDate!: Date;
  calendarKey = 0;
  showCalendar = false;
  showAll = false;

  tripStatusRows = signal<TripStatusRow[]>([]);
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
  public async refreshData(): Promise<void> {
    await this.fetchTripAndAbsentData(); 
  }

  // ---------------- API ----------------
  // token:any;

  async fetchTripAndAbsentData(): Promise<void> {
    // this.spinner.show();

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
          this.deliveryVendorId,
        )
        .subscribe({
          next: (res: any) => {
            this.zone.run(() => {
              this.spinner.hide();

              if (!res?.responseStatus || !res?.responseObject) {
                this.tripStatusRows.set([]);
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

              this.tripStatusRows.set(
                sortedTrips.map((t: any) => ({
                  vehicle: t.vehicleNo,
                  vehcleNoShort: t.vehicleNo?.slice(-4) || '-',
                  manifestedWB: t.ofd || 0,
                  unloadedWB: t.delivered || 0,
                  lastUpdated: this.formatTime(t.lastUpdatedDate),
                  shortExcessCount: Math.abs((t.ofd || 0) - (t.delivered || 0)),
                  multipleTripStatus: t.multipleTripStatus,
                  manifestNumbers: t.manifestNumbers || [],
                  lastLocation: t.lastLocation,
                  showLocation: false,
                  lat: t.lat,
                  long: t.longs,
                  address: '',
                })),
              );

              this.absentRows = (obj.absentVehicles || []).map((v: any) => ({
                vehicleNo: v.vehicleNo,
                vehicleNoShort: v.vehicleNo?.slice(-4) || '-',
                lastPickup: this.formatDisplayDate(v.lastTripDate),
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
  // toggleLocation(row: any) {
  //   this.tripStatusRows.forEach((r) => (r.showLocation = false));
  //   row.showLocation = !row.showLocation;

  // lastLocation = signal('');
  // lastLocationShow = signal(false);

  async toggleLocation(row: any) {
    try {
      const token = await this.auth.getAccessToken();
      if (!token) {
        this.spinner.hide();
        this.showToast('Session expired. Please login again.');
        return;
      }

      if (row.lat && row.long) {
        this.tripStatusRows.update((rows) =>
          rows.map((r) =>
            r.lat === row.lat &&
            r.long === row.long &&
            r.vehicle === row.vehicle
              ? {
                  ...r,
                  showLocation: !r.showLocation,
                  address: !r.showLocation ? 'Fetching location...' : r.address,
                }
              : { ...r, showLocation: false },
          ),
        );
      }

      if (row.showLocation) return;

      if (row.lat && row.long) {
        this.api.getTripStatusLocation(token, row.lat, row.long).subscribe({
          next: (res) => {
            this.tripStatusRows.update((rows) =>
              rows.map((r) =>
                r.vehicle === row.vehicle ? { ...r, address: res.address } : r,
              ),
            );
          },
          error: () => {
            this.tripStatusRows.update((rows) =>
              rows.map((r) =>
                r.vehicle === row.vehicle
                  ? { ...r, address: 'Unable to fetch location' }
                  : r,
              ),
            );
          },
        });
      }
    } catch (error) {
      this.showToast('Something went wrong.');
    }
  }

  @HostListener('document:click', ['$event'])
  @HostListener('document:touchstart', ['$event'])
  handleOutsideClick(event?: Event) {
    const target = event?.target as HTMLElement;

    if (
      target &&
      !target.closest('.calendar-popup') &&
      !target.closest('.today-btn')
    ) {
      this.showCalendar = false;
    }

    if (
      target &&
      !target.closest('.location-wrapper') &&
      !target.closest('.location-popup')
    ) {
      this.tripStatusRows.update((rows) =>
        rows.map((r) => ({ ...r, showLocation: false })),
      );
    }
  }

  // closeAllLocations() {
  //   this.tripStatusRows.forEach(r => r.showLocation = false);
  // }

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
        ? 'TODAY'
        : date
            .toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
            .toUpperCase();

    this.showCalendar = false;
    this.fetchTripAndAbsentData();
  }

  // @HostListener('document:click')
  // onDocumentClick() {
  //   this.showCalendar = false;
  //   this.tripStatusRows.forEach(r => (r.showLocation = false));
  // }

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
    return this.showAll
      ? this.tripStatusRows()
      : this.tripStatusRows().slice(0, 5);
  }

  get visibleAbsentRows() {
    return this.showAll ? this.absentRows : this.absentRows.slice(0, 5);
  }

  get isDisabled() {
    return this.tripStatusRows().length <= 5 && this.absentRows.length <= 5;
  }

  toggleShowAll() {
    this.showAll = !this.showAll;
  }
  isMatch(a: number, b: number) {
    return Number(a) === Number(b);
  }
  formatDisplayDate(dateStr: string): string {
    if (!dateStr) return '-';

    const date = new Date(dateStr.replace(' ', 'T'));
    if (isNaN(date.getTime())) return '-';

    const day = String(date.getDate()).padStart(2, '0');
    let month = date
      .toLocaleString('en-GB', { month: 'short' })
      .toUpperCase();
    const year = date.getFullYear();
    if (month === 'SEPT') month = 'SEP'; 

    return `${day}-${month}-${year}`;
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
