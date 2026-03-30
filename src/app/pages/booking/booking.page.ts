import {
  Component,
  inject,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { LOCALE_ID } from '@angular/core';
import localeIn from '@angular/common/locales/en-IN';
import { registerLocaleData } from '@angular/common';
import { ViewChild } from '@angular/core';

import { CommonModule } from '@angular/common';
import { interval, Subscription, startWith, forkJoin } from 'rxjs';
import { OnDestroy } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  NgxSpinnerService,
  NgxSpinnerComponent,
  NgxSpinnerModule,
} from 'ngx-spinner';
import {
  IonCard,
  IonSelect,
  IonSelectOption,
  IonGrid,
  IonRow,
  IonCol,
  IonContent,
  IonPopover,
  IonItem,
  IonList,
  IonCardContent,
  IonRefresher,
  IonRefresherContent,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { ToastController, ModalController, IonicModule } from '@ionic/angular';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { addIcons } from 'ionicons';

import { TripReportComponent } from 'src/app/shared/components/trip-report/trip-report.component';
import { DraftWaybillsModalComponent } from 'src/app/shared/modal/draft-waybill-modal/draft-waybill-modal.component';
import { SfxModalComponent } from 'src/app/shared/modal/sfx-modal/sfx-modal.component';
import { ZeroPickupModalComponent } from 'src/app/shared/modal/zero-pickup-modal/zero-pickup-modal.component';
import { NotManifestedModalComponent } from 'src/app/shared/modal/not-manifisted-modal/not-manifisted-modal.component';
import { PieChartComponent } from 'src/app/shared/components/pie-chart/pie-chart.component';
import { ProgressSliderComponent } from 'src/app/shared/components/progress-slider/progress-slider.component';

import { Api } from 'src/app/shared/services/api';

import { Observable, of } from 'rxjs';
import { arrowDownOutline, location } from 'ionicons/icons';
import { Auth } from 'src/app/shared/services/auth';
import { AppStorageService } from 'src/app/shared/services/app-storage';
import { Crashlytics } from 'src/app/shared/services/crashlytics';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';

registerLocaleData(localeIn);

// ---------------------------------- Interfaces ----------------------------------
interface PieData {
  name: string;
  value: number;
}

interface SfxData {
  code: string;
  consignor: string;
  lastPickupDate: string;
}

interface ZeroPickupData {
  code: string;
  consignor: string;
  lastPickupDate: string;
}

interface NotManifestedData {
  waybill: string;
  booked: number;
  manifested: number;
  remaining: number;
  consignor: string;
  pickupDate: string;
}

interface DraftWaybillsData {
  waybill: string;
  consignor: string;
  pickupDate: string;
}

@Component({
  selector: 'app-booking',
  templateUrl: './booking.page.html',
  styleUrls: ['./booking.page.scss'],
  standalone: true,
  imports: [
    IonIcon,
    IonButton,
    CommonModule,
      IonSelect, 

    ReactiveFormsModule,
    FormsModule,
    NgxChartsModule,
    IonCard,
    MatInputModule,
    IonGrid,
    IonRow,
    IonCol,
    IonPopover,
    IonItem,
    IonList,
    NgxSpinnerComponent,
    TripReportComponent,
    PieChartComponent,
    NgxSpinnerModule,
    ProgressSliderComponent,
    MatSelectModule,
    MatFormFieldModule,
    IonSelectOption
],
  providers: [{ provide: LOCALE_ID, useValue: 'en-IN' }],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], 
})
export class BookingPage implements OnInit, OnChanges, OnDestroy {
  @Input() vendorId!: any;
  @Input() active = false;
  @ViewChild(TripReportComponent)
  tripReportComponent!: TripReportComponent;
  private loaded = false;

  private api = inject(Api);
  private spinner = inject(NgxSpinnerService);
  private toastController = inject(ToastController);
  private modalController = inject(ModalController);
  private storage = inject(AppStorageService);
  private auth = inject(Auth);
  private crashlytics = inject(Crashlytics);
  private autoRefreshSub?: Subscription;
  private readonly REFRESH_INTERVAL = 30 * 60 * 1000;
  pieChartData$: Observable<PieData[]> = of([]);

  selectedCityControl = new FormControl('');
  cities: string[] = [];
  branchList: any[] = [];
  selectedBranchId = 0;

  selectedMonth = '';
  validMonths: string[] = [];
  popoverOpen = false;
  popoverEvent: any;

  assignedSfx = 0;

  statusList = [
    { label: 'NO PICKUP SFX(Today)', value: 0, color: '#B00020', percent: 0 },
    {
      label: 'BOOKED BUT NOT MANIFESTED',
      value: 0,
      color: '#B00020',
      percent: 0,
    },
    { label: 'DRAFT WAYBILLS', value: 0, color: '#FFBC00', percent: 0 },
  ];

  interchangeWaybill = 0;
  paidOutstanding = 0;
  marketVehReq = 0;
  weightVolumePercent = 0;

  totalWaybill = 0;
  waybill = 0;
  wbEditedPercent = 0;
  weightVolume = 0;
  interchangePackages = 0;
  marketVehicleUsage = 0;
  vehicleAttendance = 0;

  bars: any[] = [];

  COMMON_GRADIENT =
    'linear-gradient(90deg, #DA2723 0%, #D2E241 40%, #41D844 100%)';
  GRADIENT = 'linear-gradient(90deg,#42D844 0%, #D2E241 48.2%, #DA2D24 100%)';

  monthMap: any = {
    Jan: 1,
    Feb: 2,
    Mar: 3,
    Apr: 4,
    May: 5,
    Jun: 6,
    Jul: 7,
    Aug: 8,
    Sep: 9,
    Oct: 10,
    Nov: 11,
    Dec: 12,
  };
  getPercent(index: number): number {
    const max = Math.max(...this.statusList.map((s) => s.value || 0));
    return max ? Math.max((this.statusList[index].value / max) * 100, 5) : 0;
  }

  constructor() {
    addIcons({ location, arrowDownOutline });
  }
  ngOnInit() {
    this.generateValidMonths();
    let month = this.formatMonthYear(new Date()).split('-');
    this.selectedMonth =
      month[0].charAt(0) + month[0].slice(1).toLowerCase() + '-' + month[1];
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['vendorId'] && this.vendorId) {
      console.log('Booking vendorId received:', this.vendorId);
      this.loadBranchDetails();
    }

    if (changes['active']) {
      if (this.active) {
        console.log('Booking Tab Activated');

        if (this.selectedBranchId) {
          this.startAutoRefresh();
        }
      } else {
        console.log('Booking Tab Deactivated');
        this.stopAutoRefresh();
      }
    }
  }

  // -------------------------------- Utility -------------------------------------

  private async getToken(): Promise<string> {
    return (await this.auth.getAccessToken()) || '';
  }

  private showToast = async (message: string) => {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color: 'warning',
      position: 'top',
    });
    toast.present();
  };

  // ------------------ START AUTO REFRESH ------------------
  private startAutoRefresh() {
    this.stopAutoRefresh();

    if (!this.selectedBranchId) {
      console.warn('AUTO REFRESH not started — Branch ID missing');
      return;
    }

    console.log('AUTO REFRESH INITIALIZED');
    console.log('Branch:', this.selectedBranchId);
    console.log('Interval (ms):', this.REFRESH_INTERVAL);

    this.autoRefreshSub = interval(this.REFRESH_INTERVAL)
      .pipe(startWith(0))
      .subscribe(() => {
        const startTime = new Date().toLocaleString();
        console.log(`[AUTO REFRESH] Started at: ${startTime}`);
        console.log(`Branch ID: ${this.selectedBranchId}`);

        const tokenPromise = this.getToken();

        tokenPromise.then((token) => {
          forkJoin({
            panel1: this.api.getPanelOneCount(this.selectedBranchId, token),
            panel3: this.api.getPanelThreeData(this.selectedBranchId, token),
            panel4: this.api.getPanelFourData(
              this.getFullYear(),
              this.getMonthNumber(),
              this.selectedBranchId,
              token,
            ),
          }).subscribe({
            next: () => {
              const endTime = new Date().toLocaleString();
              console.log(`[AUTO REFRESH] Completed at: ${endTime}`);
            },
            error: (err) => {
              console.error('[AUTO REFRESH] Failed:', err);
            },
          });
        });
      });
  }

  // ------------------ STOP AUTO REFRESH ------------------
  private stopAutoRefresh() {
    if (this.autoRefreshSub) {
      this.autoRefreshSub.unsubscribe();
      this.autoRefreshSub = undefined;
      console.log('AUTO REFRESH STOPPED');
    }
  }

  private getFullYear(): number {
    const [mon, yr] = this.selectedMonth.split('-');
    return 2000 + Number(yr);
  }

  private getMonthNumber(): number {
    const [mon] = this.selectedMonth.split('-');
    return this.monthMap[mon];
  }

  isRefreshing = false;
  isLoading = false;

  async refreshData() {
    if (!this.selectedBranchId) return;

    try {
      this.stopAutoRefresh();

      await Promise.all([
        this.fetchPanelOneCount(this.selectedBranchId),
        this.fetchPanelThreeData(this.selectedBranchId),
        this.fetchPanelFourData(this.selectedBranchId),
      ]);

      if (this.tripReportComponent) {
        await this.tripReportComponent.refreshData();
      }
    } finally {
      this.startAutoRefresh();
    }
  }

  // -------------------------------- Branch Load -------------------------------------

  async loadBranchDetails() {
    const token = await this.getToken();

    this.api.getBranchDetails(token).subscribe({
      next: async (res) => {
        if (res?.responseStatus && res.responseObject?.length) {
          // ONLY Booking branches of this vendor
          this.branchList = res.responseObject.filter(
            (b: any) =>
              b.vedorType === 'BOOKING' && b.vendorId === this.vendorId,
          );

          if (!this.branchList.length) {
            // this.showToast('No Booking branches assigned');
            return;
          }

          this.cities = this.branchList.map((b) => b.branchName);

          const savedBranch = await this.storage.getBranchId();
          const defaultBranch =
            this.branchList.find((b) => b.branchId === savedBranch) ||
            this.branchList[0];

          this.selectedCityControl.setValue(defaultBranch.branchName);
          this.selectedBranchId = defaultBranch.branchId;
          console.log('Branch Selected:', this.selectedBranchId);
          this.startAutoRefresh();

          await this.storage.updateUserDetails({
            branchId: this.selectedBranchId,
          });

          await this.reloadAllPanels();
        }
      },
      // error: () => this.showToast('Unable to load Booking branches'),
    });
  }
  async reloadAllPanels() {
    if (!this.isRefreshing) {
      this.isLoading = true;
      this.spinner.show();
    }
    try {
      await Promise.all([
        this.fetchPanelOneCount(this.selectedBranchId),
        this.fetchPanelThreeData(this.selectedBranchId),
        this.fetchPanelFourData(this.selectedBranchId),
      ]);
    } finally {
      this.isLoading = false;
      this.spinner.hide();
    }
  }

  // -------------------- Panel 1: Zero Pickup, Not Manifested, Draft --------------------

  async fetchPanelOneCount(branchId: number) {
    const token = await this.getToken();

    this.api.getPanelOneCount(branchId, token).subscribe({
      next: (res) => {
        if (res?.responseStatus && res.responseObject) {
          const d = res.responseObject;

          this.assignedSfx = d.assignedSfxCount || 0;

          const totalWaybills =
            (d.zeroPickupCount || 0) +
            (d.notManifestedCount || 0) +
            (d.draftWaybillCount || 0);
          this.statusList = [
            {
              label: 'NO PICKUP SFX(Today)',
              value: d.zeroPickupCount || 0,
              color: this.getBarColor(d.zeroPickupCount),
              percent: this.calcBarWidth(d.zeroPickupCount),
            },
            {
              label: 'BOOKED BUT NOT MANIFESTED',
              value: d.notManifestedCount || 0,
              color: this.getBarColor(d.notManifestedCount),
              percent: this.calcBarWidth(d.notManifestedCount),
            },
            {
              label: 'DRAFT WAYBILLS',
              value: d.draftWaybillCount || 0,
              color: this.getDraftColor(d.draftWaybillCount),
              percent: this.calcBarWidth(d.draftWaybillCount),
            },
          ];
        }
      },
      error: (err) => {
        this.crashlytics.recordNonFatal(err, 'BOOKING_PANEL1_FAILED', [
          { key: 'vendor', value: String(this.vendorId), type: 'string' },
          { key: 'branch', value: String(branchId), type: 'string' },
        ]);
        // this.showToast('Error fetching Panel-1 data');
      },
    });
  }
  getBarColor(value: number): string {
    if (!value || value === 0) return '#E8E8E8';
    return '#B00020'; // Red
  }

  getDraftColor(value: number): string {
    if (!value || value === 0) return '#E8E8E8';
    return '#FFBC00'; // Amber
  }
  calcBarWidth(value: number): number {
    return value > 0 ? 100 : 0;
  }
  @ViewChild('citySelect') citySelect!: IonSelect;

  openLocationDropdown() {
    this.citySelect.open();
  }
  // ---------------------------- Panel 3: Interchange / Outstanding --------------------

  async fetchPanelThreeData(branchId: number) {
    const token = await this.getToken();

    this.api.getPanelThreeData(branchId, token).subscribe({
      next: (res) => {
        if (res?.responseStatus && res.responseObject) {
          const data = res.responseObject;

          this.interchangeWaybill = data.interchangeWaybill ?? 0;
          this.paidOutstanding = data.paidOutstanding ?? 0;
          this.weightVolumePercent = data.weightVolumePercentage ?? 0;
          this.marketVehReq = data.marketVehReq ?? 0;
        }
      },
      error: (err) => {
        this.crashlytics.recordNonFatal(err, 'BOOKING_PANEL3_FAILED', [
          { key: 'vendor', value: String(this.vendorId), type: 'string' },
          { key: 'branch', value: String(branchId), type: 'string' },
        ]);
        // this.showToast('Error fetching Panel-3 data');
      },
    });
  }

  // -------------------------------- Panel 4: Pie Chart ---------------------------------

  async fetchPanelFourData(branchId: number) {
    const token = await this.getToken();

    let formattedMonth = this.selectedMonth.replace('-', ' ');

    if (formattedMonth.includes(' ')) {
      const [m, y] = formattedMonth.split(' ');
      formattedMonth = `${m.charAt(0).toUpperCase() + m.slice(1).toLowerCase()}-${y}`;
    }

    const [mon, yr] = formattedMonth.split('-');

    const fullYear = 2000 + Number(yr);
    const monthNumber = this.monthMap[mon];

    if (!fullYear || !monthNumber) {
      this.showToast('Invalid month format');
      return;
    }

    this.api
      .getPanelFourData(fullYear, monthNumber, branchId, token)
      .subscribe({
        next: (res) => {
          if (res?.responseStatus && res.responseObject) {
            const d = res.responseObject;

            this.totalWaybill = d.booked ?? 0;
            this.waybill = d.wb ?? 0;
            this.wbEditedPercent = d.wbEdited ?? 0;
            const editedCount = Math.round(
              (this.wbEditedPercent / 100) * this.waybill,
            );
            const notEditedCount = this.waybill - editedCount;

            this.pieChartData$ = of([
              { name: 'Edited', value: this.wbEditedPercent },
              { name: 'Not Edited', value: 100 - this.wbEditedPercent },
            ]);

            this.weightVolume = d.weightVolume ?? 0;
            this.marketVehicleUsage = d.marketVehicleUsage ?? 0;
            this.interchangePackages = d.interchangePackages ?? 0;
            this.vehicleAttendance = d.vehicleAttendance ?? 0;

            this.bars = [
              {
                label: 'Vehicle Attendance',
                percent: Math.round(this.vehicleAttendance),
                gradient: this.COMMON_GRADIENT,
              },
              {
                label: 'Weight Volume',
                percent: Math.round(this.weightVolume),
                gradient: this.COMMON_GRADIENT,
              },

              {
                label: 'Market Vehicle Usage',
                percent: Math.round(this.marketVehicleUsage),
                gradient: this.GRADIENT,
              },
            ];
          }
        },
        error: (err) => {
          this.crashlytics.recordNonFatal(err, 'BOOKING_PANEL4_FAILED', [
            { key: 'vendor', value: String(this.vendorId), type: 'string' },
            { key: 'branch', value: String(branchId), type: 'string' },
            { key: 'month', value: this.selectedMonth, type: 'string' },
          ]);
          // this.showToast('Error fetching Panel-4 snapshot');
        },
      });
  }

  // -------------------------------- Month Selection -------------------------------------

  selectMonth(month: string) {
    this.selectedMonth =
      month.split('-')[0].charAt(0) +
      month.split('-')[0].slice(1).toLowerCase() +
      '-' +
      month.split('-')[1];
    this.popoverOpen = false;

    this.fetchPanelFourData(this.selectedBranchId);
  }

  toggleMonthPopover(ev: any) {
    this.popoverEvent = ev;
    this.popoverOpen = true;
  }

  generateValidMonths() {
    const months = [];
    const today = new Date();

    for (let i = 0; i < 4; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push(this.formatMonthYear(d));
    }
    this.validMonths = months;
  }

  formatMonthYear(date: Date): string {
    const options = { year: '2-digit', month: 'short' } as const;
    let d = date
      .toLocaleDateString('en-US', options)
      .replace(',', '')
      .split(' ');
    return d[0].toUpperCase() + '-' + d[1];
  }
  getMonthDisplay(month: string): string {
    if (!month) return '';

    const [mon, yr] = month.split('-');
    const fullYear = 2000 + Number(yr);

    return `${mon.toUpperCase()}-${fullYear}`;
  }

  loadDataForMonth(month: string) {
    if (this.isFutureMonth(month)) {
      this.selectedMonth = this.formatMonthYear(new Date());
      this.showToast('Future months cannot be selected');
      return;
    }
  }

  isFutureMonth(monthStr: string): boolean {
    const [mon, yr] = monthStr.split('-');
    const yearFull = 2000 + parseInt(yr, 10);
    const monthNumber = new Date(
      Date.parse(mon + ' 1, ' + yearFull),
    ).getMonth();
    const monthDate = new Date(yearFull, monthNumber, 1);
    return monthDate > new Date();
  }

  // ------------------------- Branch Change Handler ----------------------------

  onCityChange(event: any) {
    const city = event.detail.value;
    const br = this.branchList.find((b) => b.branchName === city);
    if (!br) return;

    this.selectedBranchId = br.branchId;
    this.storage.updateUserDetails({
      branchId: br.branchId,
    });

    this.fetchPanelOneCount(br.branchId);
    this.fetchPanelThreeData(br.branchId);
    this.fetchPanelFourData(br.branchId);
  }

  // ------------------------------ Modal Logic ------------------------------

  assignedSfxData: SfxData[] = [];
  zeroPickupData: ZeroPickupData[] = [];
  notManifestedData: NotManifestedData[] = [];
  draftWaybillsData: DraftWaybillsData[] = [];

  private isModalOpen = false;
  async openModal(name: string, event?: Event) {
    event?.stopPropagation();
    if (this.isModalOpen) return;
    this.isModalOpen = true;

    try {
      let modalComponent: any;
      let modalProps: any = {};
      this.crashlytics.logBusinessEvent('BOOKING_MODAL_OPEN', {
        vendor: this.vendorId,
        branch: this.selectedBranchId,
        modal: name,
      });

      switch (name) {
        case 'NO PICKUP SFX(Today)':
          modalComponent = ZeroPickupModalComponent;
          await this.loadZeroPickupData();
          modalProps = { zeroPickupData: this.zeroPickupData };
          break;

        case 'BOOKED BUT NOT MANIFESTED':
          modalComponent = NotManifestedModalComponent;
          await this.loadNotManifestedData();
          modalProps = { notManifestedData: this.notManifestedData };
          break;

        case 'DRAFT WAYBILLS':
          modalComponent = DraftWaybillsModalComponent;
          await this.loadDraftWaybillsData();
          modalProps = { draftWaybillsData: this.draftWaybillsData };
          break;
      }

      if (!modalComponent) {
        this.isModalOpen = false;
        return;
      }

      const modal = await this.modalController.create({
        component: modalComponent,
        componentProps: modalProps,
        cssClass: 'bottom-sheet-modal',
        backdropDismiss: true,
        breakpoints: [0, 0.65, 1],
        initialBreakpoint: 0.65,
      });

      modal.onDidDismiss().then(() => {
        this.isModalOpen = false;
      });

      await modal.present();
    } catch (err) {
      this.isModalOpen = false;
      throw err;
    }
  }

  getBarWidth(value: number): string {
    if (!value || value === 0) return '5%';

    const max = 10;
    const percentage = (value / max) * 100;

    return Math.min(percentage, 100) + '%';
  }
  public isSfxModalOpen = false;

  async openSfxModal() {
    if (this.isSfxModalOpen) {
      return;
    }

    this.isSfxModalOpen = true;

    try {
      const assignedSfxData = await this.getAssignedSfxData();

      const modal = await this.modalController.create({
        component: SfxModalComponent,
        componentProps: { assignedSfxData },
        cssClass: 'sfx-modal',
        backdropDismiss: true,
        breakpoints: [0, 0.65, 1],
        initialBreakpoint: 0.65,
      });

      modal.onDidDismiss().then(() => {
        this.isSfxModalOpen = false;
      });

      await modal.present();
    } catch (err) {
      this.isSfxModalOpen = false;
    }
  }

  async getAssignedSfxData(): Promise<any[]> {
    return new Promise(async (resolve, reject) => {
      const branchId = await this.storage.getBranchId();
      const token = await this.getToken();

      if (!branchId) {
        reject('BranchId missing');
        return;
      }

      this.api.getAssignedSfxDetails(branchId, token).subscribe({
        next: (res) => resolve(res.responseObject || []),
        error: (err) => reject(err),
      });
    });
  }

  async loadZeroPickupData() {
    const token = await this.getToken();
    const assignedBranchId = await this.storage.getBranchId();

    if (!assignedBranchId) {
      // this.showToast('Branch not selected');
      return;
    }

    return new Promise((resolve, reject) => {
      this.api.getZeroPickupDetails(assignedBranchId, token).subscribe({
        next: (res) => {
          this.zeroPickupData = res.responseObject || [];
          resolve(true);
        },
        error: (err) => {
          this.showToast('Unable to fetch ZERO PICKUP data');
          reject(err);
        },
      });
    });
  }

  async loadNotManifestedData() {
    const token = await this.getToken();
    const branchId = await this.storage.getBranchId();

    if (!branchId) {
      // this.showToast('Branch not selected');
      return;
    }

    return new Promise((resolve, reject) => {
      this.api.getNotManifestedDetails(branchId, token).subscribe({
        next: (res) => {
          this.notManifestedData =
            res.responseObject?.map((item: any) => ({
              waybill: item.wayblNum,
              consignor: item.cnorName,
              pickupDate: item.pickupDate,
              booked: item.booked,
              manifested: item.manifested,
              remaining: item.notManifested,
            })) || [];
          resolve(true);
        },
        error: (err) => {
          this.showToast('Unable to fetch BOOKED BUT NOT MANIFESTED data');
          reject(err);
        },
      });
    });
  }
  async loadDraftWaybillsData() {
    const token = await this.getToken();
    const branchId = await this.storage.getBranchId();

    if (!branchId) {
      // this.showToast('Branch not selected');
      return;
    }

    return new Promise((resolve, reject) => {
      this.api.getDraftWaybillDetails(branchId, token).subscribe({
        next: (res) => {
          this.draftWaybillsData =
            res.responseObject?.map((item: any) => ({
              waybill: item.wayblNum,
              consignor: item.consignorName,
              pickupDate: item.pickupDate,
            })) || [];
          resolve(true);
        },
        error: (err) => {
          this.showToast('Unable to fetch DRAFT WAYBILLS data');
          reject(err);
        },
      });
    });
  }
  get formattedOutstanding() {
    const formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(this.paidOutstanding || 0);

    const [integer, decimal] = formatted.split('.');
    return { integer, decimal };
  }
  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }
}
