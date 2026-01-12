import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  IonButton,
  IonCard,
  IonGrid,
  IonRow,
  IonCol,
  IonPopover,
  IonList,
  IonItem,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/angular/standalone';
import {
  MatDatepicker,
  MatDatepickerModule,
} from '@angular/material/datepicker';
import { BehaviorSubject, finalize } from 'rxjs';
import { NgxSpinnerService, NgxSpinnerModule } from 'ngx-spinner';
import { ToastController } from '@ionic/angular';

import { Delivery } from 'src/app/shared/services/delivery';
import { PieChartComponent } from 'src/app/shared/components/pie-chart/pie-chart.component';
import { ProgressSliderComponent } from 'src/app/shared/components/progress-slider/progress-slider.component';
import { TripReportDeliveryComponent } from 'src/app/shared/components/trip-report-delivery/trip-report-delivery.component';
import { InventoryCardComponent } from 'src/app/shared/components/inventory-card/inventory-card.component';
import {
  formatDisplayDate,
  formatMonthYearShort,
} from 'src/app/shared/utilities/date-utils';
import { MatNativeDateModule } from '@angular/material/core';
import { addIcons } from 'ionicons';
import { chevronDownOutline } from 'ionicons/icons';
import { Crashlytics } from 'src/app/shared/services/crashlytics';

@Component({
  selector: 'app-delivery',
  standalone: true,
  templateUrl: './delivery.page.html',
  styleUrls: ['./delivery.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonButton,
    IonCard,
    IonGrid,
    IonRow,
    IonCol,
    MatNativeDateModule,
    MatDatepickerModule,
    NgxSpinnerModule,
    PieChartComponent,
    IonRefresher,
    IonRefresherContent,
    ProgressSliderComponent,
    InventoryCardComponent,
    TripReportDeliveryComponent,
    IonPopover,
    IonList,
    IonItem,
  ],
})
export class DeliveryPage implements OnInit, OnChanges {
  @Input() vendorId!: any;
  private toastController = inject(ToastController);
  private crashlytics = inject(Crashlytics);

  deliveryVendorId!: number;
  deliveryBranchId: number | null = null;

  deliveryVendorId$ = new BehaviorSubject<number | null>(null);

  amount = 0;
  pending = 0;
  usage = 0;
  safe = 0;

  totalWaybill = 0;
  totalWaybillAndWeight = {}
  panelFourPieData: any[] = [];
  panelFourBars = [
    { label: 'Vehicle Attendance', value: 0, gradient: '' },
    { label: 'Safedrop Usage', value: 0, gradient: '' },
    { label: 'Market Vehicle Usage', value: 0, gradient: '' },
  ];

  // Month UI
  validMonths: string[] = [];
  selectedMonth = '';
  selectedDate!: Date;

  popoverOpen = false;
  popoverEvent: any;

  displayDate = formatDisplayDate(new Date());
  COMMON_GRADIENT =
    'linear-gradient(90deg, #DA2723 0%, #D2E241 40%, #41D844 100%)';
  GRADIENT = 'linear-gradient(90deg,#42D844 0%, #D2E241 48.2%, #DA2D24 100%)';

  @ViewChild('monthPicker') monthPicker!: MatDatepicker<Date>;
  @Input() active = false;
  private loaded = false;
  async doRefresh(event: any) {
    await Promise.all([this.loadPanelFourByDate(), this.loadPanelThreeData()]);
    event.target.complete();
  }

  constructor(
    private service: Delivery,
    private spinner: NgxSpinnerService,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({ chevronDownOutline });
  }

  ngOnInit() {
    this.buildMonthList();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['vendorId'] && this.vendorId) {
      this.deliveryVendorId = this.vendorId;
    }

    if (changes['active'] && this.active && !this.loaded) {
      console.log('📡 Delivery first load');
      this.loaded = true;
      this.crashlytics.logBusinessEvent('DELIVERY_PAGE_OPEN', {
        vendor: this.deliveryVendorId,
        branch: this.deliveryBranchId,
      });
      this.loadPanelThreeData();
      this.loadPanelFourByDate(this.selectedDate);
    }
  }
  async forceRefresh() {
    console.log('🔄 Delivery refresh');

    await Promise.all([
      this.loadPanelThreeData(),
      this.loadPanelFourByDate(this.selectedDate),
    ]);
  }

  // ----------------------- MONTH HANDLING -----------------------

  buildMonthList() {
    const today = new Date();
    this.validMonths = [];

    for (let i = 3; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      this.validMonths.push(this.formatMonth(d)); // Jan-25
    }

    this.selectedMonth = this.validMonths[this.validMonths.length - 1];
    this.selectedDate = this.convertMonthStringToDate(this.selectedMonth);
  }

  formatMonth(date: Date) {
    return formatMonthYearShort(date); // must return Jan-25
  }

  toggleMonthPopover(ev: any) {
    this.popoverEvent = ev;
    this.popoverOpen = true;
  }

  selectMonth(monthStr: string) {
    this.selectedMonth = monthStr;
    this.popoverOpen = false;

    this.selectedDate = this.convertMonthStringToDate(monthStr);
    this.loadPanelFourByDate(this.selectedDate);
  }

  convertMonthStringToDate(monthStr: string): Date {
    const [mon, yr] = monthStr.split('-');

    const map: any = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };

    return new Date(2000 + Number(yr), map[mon], 1);
  }

  // ----------------------- BRANCH CHANGE -----------------------

  onDeliveryBranchChange(branchId: number) {
    this.deliveryBranchId = branchId;
    // this.crashlytics.logBusinessEvent('DELIVERY_BRANCH_CHANGED', {
    //   vendor: this.deliveryVendorId,
    //   branch: branchId,
    // });

    this.loadPanelThreeData();
    this.loadPanelFourByDate(this.selectedDate);
  }

  // ----------------------- PANEL 3 -----------------------

  loadPanelThreeData() {
    if (!this.deliveryVendorId || !this.deliveryBranchId) return;

    this.spinner.show();

    this.service
      .getPanelThreeDeliveryData(
        this.deliveryBranchId,
        this.deliveryVendorId,
        'TOKEN'
      )
      .subscribe({
        next: (res) => {
          const d = res.responseObject || {};

          this.amount = Math.round(d.toBeCollected || 0);
          this.pending = d.pendingPods || 0;
          this.usage = d.marketVehicleUsage || 0;
          this.safe = Math.round(d.safeDropUsage || 0);

          this.spinner.hide();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.spinner.hide();

          this.crashlytics.recordNonFatal(err, 'DELIVERY_PANEL3_FAILED', [
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
        },
      });
  }

  // ----------------------- PANEL 4 -----------------------

  loadPanelFourByDate(date?: Date) {
    if (!date || !this.deliveryVendorId || !this.deliveryBranchId) {
      console.warn('Panel-4 skipped – missing date/vendor/branch', {
        date,
        vendor: this.deliveryVendorId,
        branch: this.deliveryBranchId,
      });
      return;
    }

    console.log(' Panel-4 loading for:', date);

    this.spinner.show();

    // this.crashlytics.logBusinessEvent('DELIVERY_PANEL4_LOAD', {
    //   vendor: this.deliveryVendorId,
    //   branch: this.deliveryBranchId,
    //   month: this.selectedMonth,
    // });

    this.service
      .getDeliveryPanelFourData(
        date.getFullYear(),
        date.getMonth() + 1,
        this.deliveryBranchId,
        this.deliveryVendorId,
        'TOKEN'
      )
      .pipe(
        finalize(() => {
          this.spinner.hide();
          this.cdr.detectChanges(); // required for OnPush
        })
      )
      .subscribe({
        next: (res) => {
          const d = res?.responseObject || {};

          this.totalWaybill = d.totalWaybills ?? 0;

          this.totalWaybillAndWeight = {
            deliveredWaybills: d.deliveredWaybills ?? 0,
            deliveredWeight: d.deliveredWeight ?? 0,
            undeliveredWaybills: d.undeliveredWaybills ?? 0,
            undeliveredWeight: d.undeliveredWeight ?? 0
          }


          this.panelFourPieData = [
            { name: 'Un-Delivered', value: d.undeliveredWaybills },
            { name: 'Delivered', value: d.deliveredWaybills },
          ];

          this.panelFourBars = [
            {
              label: 'Vehicle Attendance',
              value: d.vehicleAttendence ?? 0,
              gradient: this.COMMON_GRADIENT,
            },
            {
              label: 'Safedrop Usage',
              value: Math.round(d.safedropUsage ?? 0),
              gradient: this.COMMON_GRADIENT,
            },
            {
              label: 'Market Vehicle Usage',
              value: Math.round(d.marketVehicleCount ?? 0),
              gradient: this.GRADIENT,
            },
          ];

          this.calculateHappinessFromPanel4();
        },
        error: (err) => {
          console.error('Panel-4 API failed', err);

          this.crashlytics.recordNonFatal(err, 'DELIVERY_PANEL4_FAILED', [
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
            { key: 'month', value: this.selectedMonth, type: 'string' },
          ]);
        },
      });
  }

  progressValue = 0; // drives slider
  progressFace: 'ANGRY' | 'HAPPY' | 'GREAT' = 'ANGRY';
  progressGradient = '';

  calculateHappinessFromPanel4() {
    const colors = this.panelFourBars.map((b) =>
      this.getHeatColor(b.value, b.label)
    );

    const hasRed = colors.includes('RED');
    const hasAmber = colors.includes('AMBER');
    const allGreen = colors.every((c) => c === 'GREEN');

    if (hasRed) {
      this.progressFace = 'ANGRY';
      this.progressValue = 25;
    } else if (hasAmber) {
      this.progressFace = 'HAPPY';
      this.progressValue = 60;
    } else if (allGreen) {
      this.progressFace = 'GREAT';
      this.progressValue = 95;
    }

    console.log('Happiness →', this.progressFace, this.progressValue, colors);
  }

  getHeatColor(value: number, label: string): 'RED' | 'AMBER' | 'GREEN' {
    if (label === 'Market Vehicle Usage' && value === 0) {
      return 'GREEN';
    }
    if (value <= 25) return 'RED';
    if (value <= 70) return 'AMBER';
    return 'GREEN';
  }
}
