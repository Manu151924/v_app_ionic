import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  NgxSpinnerService,
  NgxSpinnerComponent,
  NgxSpinnerModule
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
  IonRefresherContent
} from '@ionic/angular/standalone';

import { ToastController, ModalController } from '@ionic/angular';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { addIcons } from 'ionicons';
import { arrowDownOutline } from 'ionicons/icons';

import { TripReportComponent } from 'src/app/shared/components/trip-report/trip-report.component';
import { DraftWaybillsModalComponent } from 'src/app/shared/modal/draft-waybill-modal/draft-waybill-modal.component';
import { SfxModalComponent } from 'src/app/shared/modal/sfx-modal/sfx-modal.component';
import { ZeroPickupModalComponent } from 'src/app/shared/modal/zero-pickup-modal/zero-pickup-modal.component';
import { NotManifestedModalComponent } from 'src/app/shared/modal/not-manifisted-modal/not-manifisted-modal.component';
import { PieChartComponent } from 'src/app/shared/components/pie-chart/pie-chart.component';
import { ProgressSliderComponent } from 'src/app/shared/components/progress-slider/progress-slider.component';

import { Api } from 'src/app/shared/services/api';
import { Auth } from 'src/app/shared/services/auth';
import { AppStorageService } from 'src/app/shared/services/app-storage';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-booking',
  templateUrl: './booking.page.html',
  styleUrls: ['./booking.page.scss'],
  standalone: true,
  imports: [
    IonRefresherContent,
    IonRefresher,
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
    IonContent,
    IonPopover,
    IonItem,
    IonList,
    IonCardContent,
    NgxSpinnerComponent,
    TripReportComponent,
    PieChartComponent,
    NgxSpinnerModule,
    ProgressSliderComponent
  ]
})
export class BookingPage implements OnInit {

  @Input() vendorId!: string;

  private spinner = inject(NgxSpinnerService);
  private toastController = inject(ToastController);
  private api = inject(Api);
  private storage = inject(AppStorageService);
  private modalController = inject(ModalController);

  pieChartData$: Observable<any[]> = of([]);
  cities: string[] = [];
  selectedCityControl = new FormControl('');
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
    { label: 'DRAFT WAYBILLS', value: 0, color: '#ffc107', percent: 0 }
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
  zeroPickupData: any[] = [];
  notManifestedData: any[] = [];
  draftWaybillsData: any[] = [];

  COMMON_GRADIENT = 'linear-gradient(90deg, #DA2723 0%, #D2E241 40%, #41D844 100%)';
  GRADIENT = 'linear-gradient(90deg,#42D844 0%, #D2E241 48.2%, #DA2D24 100%)';

  monthMap: any = {
    'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
    'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
  };

  constructor() { addIcons({ arrowDownOutline }); }

  async ngOnInit() {
    this.generateValidMonths();
    this.selectedMonth = this.formatMonthYear(new Date());

    const user = await this.storage.getUserDetails();

    if (!user?.branchId) {
      this.showToast('No branch info found. Please re-login.');
      return;
    }

    this.selectedBranchId = user.branchId;

    await this.loadBranchDetails();
  }

  /** Utility Toast */
  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color: 'warning',
      position: 'bottom',
    });
    toast.present();
  }

  /** Refresh Handler */
  async doRefresh(event: any) {
    await Promise.all([
      this.fetchPanelOneCount(),
      this.fetchPanelThreeData(),
      this.fetchPanelFourData(),
    ]);
    event.target.complete();
  }

  /** Month Helpers */
  generateValidMonths() {
    const today = new Date();
    for (let i = 3; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      this.validMonths.push(this.formatMonthYear(d));
    }
  }

  formatMonthYear(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }).replace(',', '');
  }

  /** Branch Load */
  async loadBranchDetails() {
    this.api.getBranchDetails().subscribe({
      next: async (res) => {
        if (!res?.responseStatus || !res.responseObject.length) return;

        this.branchList = res.responseObject;
        this.selectedCityControl.setValue(this.branchList[0].branchName);
        this.selectedBranchId = this.branchList[0].branchId;

        await this.storage.updateUserDetails({ branchId: this.selectedBranchId });

        await this.fetchPanelOneCount();
        await this.fetchPanelThreeData();
        await this.fetchPanelFourData();
      }
    });
  }

  /** Panel 1 */
  async fetchPanelOneCount() {
    this.spinner.show();
    this.api.getPanelOneCount().subscribe({
      next: (res) => {
        this.spinner.hide();
        if (!res?.responseStatus) return;

        const d = res.responseObject;
        this.assignedSfx = d.assignedSfxCount ?? 0;

        this.statusList = [
          { label: 'ZERO PICKUP SFX', value: d.zeroPickupCount, color: '#a30101', percent: this.calcPercent(d.zeroPickupCount) },
          { label: 'NOT-MANIFESTED', value: d.notManifestedCount, color: '#e53935', percent: this.calcPercent(d.notManifestedCount) },
          { label: 'DRAFT WAYBILLS', value: d.draftWaybillCount, color: '#ffc107', percent: this.calcPercent(d.draftWaybillCount) }
        ];
      },
      error: () => {
        this.spinner.hide();
        this.showToast('Error fetching Panel-1 data');
      }
    });
  }

  calcPercent(value: number): number {
    return Math.min((value / 500) * 100, 100);
  }

  /** Panel 3 */
  async fetchPanelThreeData() {
    this.spinner.show();

    this.api.getPanelThreeData().subscribe({
      next: (res) => {
        this.spinner.hide();
        if (!res?.responseStatus) return;

        const d = res.responseObject;
        this.interchangeWaybill = d.interchangeWaybill ?? 0;
        this.paidOutstanding = d.paidOutstanding ?? 0;
        this.weightVolumePercent = d.weightVolumePercentage ?? 0;
        this.marketVehReq = d.marketVehReq ?? 0;
      },
      error: () => {
        this.spinner.hide();
        this.showToast('Error fetching Panel-3');
      }
    });
  }

  /** Panel 4 */
  async fetchPanelFourData() {
    this.spinner.show();

    const [mon, yr] = this.selectedMonth.split('-');
    const fullYear = 2000 + Number(yr);
    const monthNumber = this.monthMap[mon];

    this.api.getPanelFourData(fullYear, monthNumber).subscribe({
      next: (res) => {
        this.spinner.hide();
        if (!res?.responseStatus) return;

        const d = res.responseObject;

        this.totalWaybill = d.booked ?? 0;
        this.waybill = d.wb ?? 0;
        this.wbEditedPercent = d.wbEdited ?? 0;

        this.pieChartData$ = of([
          { name: 'Edited', value: this.wbEditedPercent },
          { name: 'Not Edited', value: 100 - this.wbEditedPercent }
        ]);

        this.weightVolume = d.weightVolume ?? 0;
        this.marketVehicleUsage = d.marketVehicleUsage ?? 0;
        this.interchangePackages = d.interchangePackages ?? 0;

        this.bars = [
          { label: 'Weight Volume', percent: this.weightVolume, gradient: this.COMMON_GRADIENT },
          { label: 'Interchange Package`s', percent: this.interchangePackages, gradient: this.COMMON_GRADIENT },
          { label: 'Market Vehicle Usage', percent: this.marketVehicleUsage, gradient: this.GRADIENT }
        ];
      },
      error: () => {
        this.spinner.hide();
        this.showToast('Panel-4 snapshot error');
      }
    });
  }

  /** Branch Change */
  selectMonth(month: string) {
    this.selectedMonth = month;
    this.popoverOpen = false;

    this.fetchPanelFourData();
  }

  toggleMonthPopover(ev: any) {
    this.popoverEvent = ev;
    this.popoverOpen = true;
  }  async onCityChange(event: any) {
    const city = event.detail.value;
    const br = this.branchList.find(b => b.branchName === city);
    if (!br) return;

    this.selectedBranchId = br.branchId;
    await this.storage.updateUserDetails({ branchId: br.branchId });

    await this.fetchPanelOneCount();
    await this.fetchPanelThreeData();
    await this.fetchPanelFourData();

    this.showToast(`Branch updated: ${city}`);
  }
  async openModal(name: string, event?: Event) {
    event?.stopPropagation();
    let modalComponent: any;
    let modalProps: any = {};

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
        initialBreakpoint: 0.65
      });
      await modal.present();
    }
  }
    async openSfxModal() {
    const assignedSfxData = await this.getAssignedSfxData();

    const modal = await this.modalController.create({
      component: SfxModalComponent,
      componentProps: { assignedSfxData },
      cssClass: 'sfx-modal',
      backdropDismiss: true,
      breakpoints: [0, 0.7],
      initialBreakpoint: 0.7
    });

    await modal.present();
  }

  /** Modal Logic */
  async getAssignedSfxData(): Promise<any[]> {
    const user = await this.storage.getUserDetails();
    return new Promise((resolve, reject) => {
      this.api.getAssignedSfxDetails(user?.branchId ?? 0).subscribe({
        next: (res) => resolve(res.responseObject || []),
        error: (err) => reject(err)
      });
    });
  }

  async loadZeroPickupData() {
    return new Promise((resolve, reject) => {
      this.api.getZeroPickupDetails(this.selectedBranchId).subscribe({
        next: (res) => {
          this.zeroPickupData = res.responseObject || [];
          resolve(true);
        },
        error: () => {
          this.showToast('ZERO PICKUP fetch failed');
          reject();
        }
      });
    });
  }

  async loadNotManifestedData() {
    return new Promise((resolve, reject) => {
      this.api.getNotManifestedDetails().subscribe({
        next: (res) => {
          this.notManifestedData = res.responseObject?.map((item: any) => ({
            waybill: item.wayblNum,
            consignor: item.cnorName,
            pickupDate: item.pickupDate,
            booked: item.booked,
            manifested: item.manifested,
            remaining: item.notManifested
          })) || [];
          resolve(true);
        },
        error: () => {
          this.showToast('NOT-MANIFESTED fetch failed');
          reject();
        }
      });
    });
  }

  async loadDraftWaybillsData() {
    return new Promise((resolve, reject) => {
      this.api.getDraftWaybillDetails().subscribe({
        next: (res) => {
          this.draftWaybillsData = res.responseObject?.map((item: any) => ({
            waybill: item.wayblNum,
            consignor: item.consignorName,
            pickupDate: item.pickupDate
          })) || [];
          resolve(true);
        },
        error: () => {
          this.showToast('DRAFT WAYBILLS fetch failed');
          reject();
        }
      });
    });
  }
}
