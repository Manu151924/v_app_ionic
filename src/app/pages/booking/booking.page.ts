import {
  Component,
  inject,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
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
  IonButton, IonIcon } from '@ionic/angular/standalone';
import { ToastController, ModalController } from '@ionic/angular';
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
  imports: [IonIcon, 
    IonButton,

    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgxChartsModule,
    IonCard,
    IonSelect,
    IonSelectOption,
    IonGrid,
    IonRow,
    IonCol,
    IonPopover,
    IonItem,
    IonList,
    IonCardContent,
    NgxSpinnerComponent,
    TripReportComponent,
    PieChartComponent,
    NgxSpinnerModule,
    ProgressSliderComponent,
  ],
})
export class BookingPage implements OnInit, OnChanges {
  @Input() vendorId!: any;
  @Input() active = false;
  private loaded = false;

  private api = inject(Api);
  private spinner = inject(NgxSpinnerService);
  private toastController = inject(ToastController);
  private modalController = inject(ModalController);
  private storage = inject(AppStorageService);
  private auth = inject(Auth);
  private crashlytics = inject(Crashlytics);
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
    { label: 'ZERO PICKUP SFX', value: 0, color: '#a30101', percent: 0 },
    { label: 'NOT-MANIFESTED', value: 0, color: '#e53935', percent: 0 },
    { label: 'DRAFT WAYBILLS', value: 0, color: '#ffc107', percent: 0 },
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
    addIcons({location,arrowDownOutline});
  }
  ngOnInit() {
    this.generateValidMonths();
    this.selectedMonth = this.formatMonthYear(new Date());
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['vendorId'] && this.vendorId) {
      console.log('Booking vendorId received:', this.vendorId);
      this.loadBranchDetails();
    }

    if (changes['active'] && this.active && !this.loaded) {
      console.log('Booking first load');
      this.loaded = true;
      // this.crashlytics.logBusinessEvent('BOOKING_PAGE_OPEN', {
      //   vendor: this.vendorId,
      // });
      this.reloadAllPanels();
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
  async doRefresh(event: any) {
    await Promise.all([
      this.fetchPanelOneCount(this.selectedBranchId),
      this.fetchPanelThreeData(this.selectedBranchId),
      this.fetchPanelFourData(this.selectedBranchId),
    ]);
    event.target.complete();
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
              b.vedorType === 'BOOKING' && b.vendorId === this.vendorId
          );

          if (!this.branchList.length) {
            this.showToast('No Booking branches assigned');
            return;
          }

          this.cities = this.branchList.map((b) => b.branchName);

          const savedBranch = await this.storage.getBranchId();
          const defaultBranch =
            this.branchList.find((b) => b.branchId === savedBranch) ||
            this.branchList[0];

          this.selectedCityControl.setValue(defaultBranch.branchName);
          this.selectedBranchId = defaultBranch.branchId;

          await this.storage.updateUserDetails({
            branchId: this.selectedBranchId,
          });

          await this.reloadAllPanels();
        }
      },
      error: () => this.showToast('Unable to load Booking branches'),
    });
  }
  async reloadAllPanels() {
    this.spinner.show();

    try {
      await Promise.all([
        this.fetchPanelOneCount(this.selectedBranchId),
        this.fetchPanelThreeData(this.selectedBranchId),
        this.fetchPanelFourData(this.selectedBranchId),
      ]);
    } finally {
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
              label: 'ZERO PICKUP SFX',
              value: d.zeroPickupCount || 0,
              color: this.getBarColor(d.zeroPickupCount),
              percent: this.calcBarWidth(d.zeroPickupCount),
            },
            {
              label: 'NOT-MANIFESTED',
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
        this.showToast('Error fetching Panel-1 data');
      },
    });
  }
  getBarColor(value: number): string {
    if (!value || value === 0) return '#E8E8E8';
    return '#b00020'; // Red
  }

  getDraftColor(value: number): string {
    if (!value || value === 0) return '#E8E8E8';
    return '#ffbc00'; // Amber
  }
  calcBarWidth(value: number): number {
    return value > 0 ? 100 : 0;
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
        this.showToast('Error fetching Panel-3 data');
      },
    });
  }

  // -------------------------------- Panel 4: Pie Chart ---------------------------------

  async fetchPanelFourData(branchId: number) {
    const token = await this.getToken();

    let formattedMonth = this.selectedMonth;

    if (formattedMonth.includes(' ')) {
      const [m, y] = formattedMonth.split(' ');
      formattedMonth = `${m}-${y}`;
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
              (this.wbEditedPercent / 100) * this.waybill
            );
            const notEditedCount = this.waybill - editedCount;

            this.pieChartData$ = of([
              { name: 'Edited', value: this.wbEditedPercent },
              { name: 'Not Edited', value: 100 - this.wbEditedPercent },
            ]);

            this.weightVolume = d.weightVolume ?? 0;
            this.marketVehicleUsage = d.marketVehicleUsage ?? 0;
            this.interchangePackages = d.interchangePackages ?? 0;

            this.bars = [
              {
                label: 'Weight Volume',
                percent: this.weightVolume,
                gradient: this.COMMON_GRADIENT,
              },
              {
                label: 'Interchange Package`s',
                percent: this.interchangePackages,
                gradient: this.COMMON_GRADIENT,
              },
              {
                label: 'Market Vehicle Usage',
                percent: this.marketVehicleUsage,
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
          this.showToast('Error fetching Panel-4 snapshot');
        },
      });
  }

  // -------------------------------- Month Selection -------------------------------------

  selectMonth(month: string) {
    this.selectedMonth = month;
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

    for (let i = 3; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push(this.formatMonthYear(d));
    }
    this.validMonths = months;
  }

  formatMonthYear(date: Date): string {
    const options = { year: '2-digit', month: 'short' } as const;
    return date.toLocaleDateString('en-US', options).replace(',', '');
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
      Date.parse(mon + ' 1, ' + yearFull)
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

    this.crashlytics.logBusinessEvent('BOOKING_BRANCH_CHANGED', {
      vendor: this.vendorId,
      branch: br.branchId,
      city: br.branchName,
    });

    this.storage.updateUserDetails({
      branchId: br.branchId,
    });

    this.fetchPanelOneCount(br.branchId);
    this.fetchPanelThreeData(br.branchId);
    this.fetchPanelFourData(br.branchId);

    this.showToast(`Branch updated: ${city}`);
  }

  // ------------------------------ Modal Logic ------------------------------

  assignedSfxData: SfxData[] = [];
  zeroPickupData: ZeroPickupData[] = [];
  notManifestedData: NotManifestedData[] = [];
  draftWaybillsData: DraftWaybillsData[] = [];

  async openModal(name: string, event?: Event) {
    event?.stopPropagation();
    let modalComponent: any;
    let modalProps: any = {};
    this.crashlytics.logBusinessEvent('BOOKING_MODAL_OPEN', {
      vendor: this.vendorId,
      branch: this.selectedBranchId,
      modal: name,
    });

    switch (name) {
      case 'ZERO PICKUP SFX':
        modalComponent = ZeroPickupModalComponent;
        await this.loadZeroPickupData();
        modalProps = { zeroPickupData: this.zeroPickupData };
        break;

      case 'NOT-MANIFESTED':
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

    if (modalComponent) {
      const modal = await this.modalController.create({
        component: modalComponent,
        componentProps: modalProps,
        cssClass: 'bottom-sheet-modal',
        backdropDismiss: true,
        breakpoints: [0, 0.65, 0.95],
        initialBreakpoint: 0.65,
      });
      await modal.present();
    }
  }
  getBarWidth(value: number): string {
    if (!value || value === 0) return '5%';

    const max = 10;
    const percentage = (value / max) * 100;

    return Math.min(percentage, 100) + '%';
  }

  async openSfxModal() {
    const assignedSfxData = await this.getAssignedSfxData();

    const modal = await this.modalController.create({
      component: SfxModalComponent,
      componentProps: { assignedSfxData },
      cssClass: 'sfx-modal',
      backdropDismiss: true,
      breakpoints: [0, 0.7],
      initialBreakpoint: 0.7,
    });

    await modal.present();
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
      this.showToast('Branch not selected');
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
      this.showToast('Branch not selected');
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
          this.showToast('Unable to fetch NOT-MANIFESTED data');
          reject(err);
        },
      });
    });
  }
  async loadDraftWaybillsData() {
    const token = await this.getToken();
    const branchId = await this.storage.getBranchId();

    if (!branchId) {
      this.showToast('Branch not selected');
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
}
