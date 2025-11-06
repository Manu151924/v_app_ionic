import { Component, HostListener, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgxSpinnerService, NgxSpinnerComponent } from 'ngx-spinner';


import { IonCard, IonSelect, IonSelectOption, IonGrid, IonRow, IonCol, IonItem, IonContent, IonPopover, IonList, IonCardContent, IonIcon, IonBadge } from '@ionic/angular/standalone';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';
import { ToastController, ModalController, IonicModule } from '@ionic/angular';
import { TripReportComponent } from 'src/app/shared/components/trip-report/trip-report.component';
import { DraftWaybillsModalComponent } from 'src/app/shared/modal/draft-waybill-modal/draft-waybill-modal.component';
import { SfxModalComponent } from 'src/app/shared/modal/sfx-modal/sfx-modal.component';
import { ZeroPickupModalComponent } from 'src/app/shared/modal/zero-pickup-modal/zero-pickup-modal.component';
import { PieChartComponent } from "src/app/shared/components/pie-chart/pie-chart.component";
import { Delivery } from 'src/app/shared/services/delivery';
import { NotManifestedModalComponent } from 'src/app/shared/modal/not-manifisted-modal/not-manifisted-modal.component';
import { StatusCardComponent } from 'src/app/shared/components/status-card/status-card.component';
import { ProgressSliderComponent } from 'src/app/shared/components/progress-slider/progress-slider.component';


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

interface ShExDetails {
  waybill: string;
  booked: number;
  manifested: number;
  received: number;
  consignor: string;
  pickupDate: string;
  status: 'Short' | 'Excess' | string;
}


@Component({
  selector: 'app-booking',
  templateUrl: './booking.page.html',
  styleUrls: ['./booking.page.scss'],
  standalone: true,
  imports: [ IonList, IonPopover, IonItem, ReactiveFormsModule, IonCol, IonRow, IonGrid, IonCard, CommonModule, FormsModule, NgxChartsModule, TripReportComponent, PieChartComponent, IonContent, NgxSpinnerComponent, IonCardContent, IonSelectOption,IonSelect, ProgressSliderComponent]
})
export class BookingPage implements OnInit {
 constructor(
    private service: Delivery,
    private spinner: NgxSpinnerService,
    private toastController: ToastController
  ) {}

  private modalController = inject(ModalController);

  cities: string[] = ['DELHI-11', 'MUMBAI-22', 'CHENNAI-33', 'HYDERABAD-44'];
  selectedCityControl = new FormControl(this.cities[0]);

    progressValue = 0;

  assignedSfx = 20;

  statusList = [
    { label: 'ZERO PICKUP SFX', value: 4, color: '#a30101', percent: 20 },
    { label: 'NOT-MANIFESTED', value: 120, color: '#e53935', percent: 80 },
    { label: 'DRAFT WAYBILLS', value: 79, color: '#ffc107', percent: 50 },
  ];

  interchangeWaybill = 3;
  marketVehicleReq = 3;
  paidOutstanding = 2350000; // integer value for easier formatting
  weightVolumePercent = 62;

  // Month Wise Snapshot properties
  selectedMonth: string = '';
  validMonths: string[] = [];
  pieChartData$ = this.service.getPieChart();

  totalWaybill = 500;
  waybill = 150;
  public assignedSfxData: SfxData[] = [];
  public zeroPickupData: ZeroPickupData[] = [];
  public notManifestedData: NotManifestedData[] = [];
  public draftWaybillsData: DraftWaybillsData[] = [];

  bars = [
    {
      label: 'Weight Volume',
      percent: 75,
      gradient: 'linear-gradient(90deg, #DA2723 0%, #D2E241 19.1%, #41D844 100%);',
    },
    {
      label: 'Interchange Package\'s',
      percent: 40,
      gradient: 'linear-gradient(90deg, #DA2723 0%, #D2E241 17.7%, #41D844 100%)',
    },
    {
      label: 'Market Vehicle Usage',
      percent: 20,
      color: '#ff4545',
      gradient: ' linear-gradient(90deg, #42D844 0%, #D2E241 48.2%, #DA2D24 100%)',
    },
  ];
  

  popoverOpen = false;
  popoverEvent: any;

  ngOnInit() {
    this.generateValidMonths();
    this.selectedMonth = this.formatMonthYear(new Date());
    this.loadDataForMonth(this.selectedMonth);
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color: 'warning',
      position: 'top',
    });
    toast.present();
  }

  onCityChange(event: any) {
    const newCity = event.detail.value;

    this.spinner.show();

    setTimeout(() => {
      this.selectedCityControl.setValue(newCity);
      this.updateDataForCity(newCity);
      this.spinner.hide();

      this.showToast(`Data updated for ${newCity}`);
    }, 1500);
  }

  updateDataForCity(city: string) {
    if (city === 'HYDERABAD-44') {
      this.assignedSfx = 35;

      this.statusList = [
        { label: 'ZERO PICKUP SFX', value: 7, color: '#a30101', percent: 30 },
        { label: 'NOT-MANIFESTED', value: 100, color: '#e53935', percent: 60 },
        { label: 'DRAFT WAYBILLS', value: 65, color: '#ffc107', percent: 40 },
      ];

      this.interchangeWaybill = 8;
      this.marketVehicleReq = 7;
      this.paidOutstanding = 3200000;
      this.weightVolumePercent = 70;

      this.totalWaybill = 520;
      this.waybill = 160;
      this.bars = [
        {
          label: 'Weight Volume',
          percent: 80,
          color: '#52d066',
          gradient: 'linear-gradient(90deg, #ff4545 0%, #52d066 100%)',
        },
        {
          label: 'Interchange Package\'s',
          percent: 50,
          color: '#52d066',
          gradient: 'linear-gradient(90deg, #ffb401 0%, #52d066 100%)',
        },
        {
          label: 'Market Vehicle Usage',
          percent: 40,
          color: '#ff4545',
          gradient: 'linear-gradient(90deg, #ff4545 0%, #ffb401 100%)',
        },
      ];
    } else if (city === 'DELHI-11') {
      this.assignedSfx = 20;

      this.statusList = [
        { label: 'ZERO PICKUP SFX', value: 4, color: '#a30101', percent: 20 },
        { label: 'NOT-MANIFESTED', value: 120, color: '#e53935', percent: 80 },
        { label: 'DRAFT WAYBILLS', value: 79, color: '#ffc107', percent: 50 },
      ];

      this.interchangeWaybill = 3;
      this.marketVehicleReq = 3;
      this.paidOutstanding = 2350000;
      this.weightVolumePercent = 62;

      this.totalWaybill = 500;
      this.waybill = 150;
      this.bars = [
        {
          label: 'Weight Volume',
          percent: 75,
          color: '#52d066',
          gradient: 'linear-gradient(90deg, #ff4545 0%, #52d066 100%)',
        },
        {
          label: 'Interchange Package\'s',
          percent: 40,
          color: '#52d066',
          gradient: 'linear-gradient(90deg, #ffb401 0%, #52d066 100%)',
        },
        {
          label: 'Market Vehicle Usage',
          percent: 20,
          color: '#ff4545',
          gradient: 'linear-gradient(90deg, #ff4545 0%, #ffb401 100%)',
        },
      ];
    }
  }

  generateValidMonths() {
    const months = [];
    const today = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push(this.formatMonthYear(d));
    }
    this.validMonths = months;
  }

  formatMonthYear(date: Date): string {
    const options = { year: '2-digit', month: 'short' } as const;
    return date.toLocaleDateString('en-US', options).replace(',', '');
  }

  toggleMonthPopover(ev: any) {
    this.popoverEvent = ev;
    this.popoverOpen = true;
  }

  selectMonth(month: string) {
    this.selectedMonth = month;
    this.popoverOpen = false;
    this.loadDataForMonth(month);
  }

  loadDataForMonth(month: string) {
    if (this.isFutureMonth(month)) {
      this.selectedMonth = this.formatMonthYear(new Date());
      this.showToast('Future months cannot be selected');
      return;
    }
    // For demonstration: update pieChartData$ and related data here if applicable
    // e.g., this.pieChartData$ = this.service.getPieChartForMonth(month);
  }

  isFutureMonth(monthStr: string): boolean {
    const [mon, yr] = monthStr.split('-');
    const yearFull = 2000 + parseInt(yr, 10);
    const monthNumber = new Date(Date.parse(mon + " 1, " + yearFull)).getMonth();
    const monthDate = new Date(yearFull, monthNumber, 1);
    return monthDate > new Date();
  }
  async openModal(name: string, event?: Event) {
    event?.stopPropagation();
    let modalComponent: any;
    switch (name) {
      case 'ZERO PICKUP SFX':
        modalComponent = ZeroPickupModalComponent;
        this.zeroPickupData = this.getZeroPickupData();
        break;

      case 'NOT-MANIFESTED':
        modalComponent = NotManifestedModalComponent;
        this.notManifestedData = this.getNotManifestedData();
        break;

      case 'DRAFT WAYBILLS':
        modalComponent = DraftWaybillsModalComponent;
        this.draftWaybillsData = this.getDraftWaybillsData();
        break;
    }

    if (modalComponent) {
      let dataProp: any[] = [];
      if (name === 'ZERO PICKUP SFX') {
        dataProp = this.zeroPickupData;
      } else if (name === 'NOT-MANIFESTED') {
        dataProp = this.notManifestedData;
      } else if (name === 'DRAFT WAYBILLS') {
        dataProp = this.draftWaybillsData;
      }

      const modal = await this.modalController.create({
        component: modalComponent,
        componentProps:
          name === 'ZERO PICKUP SFX'
            ? { zeroPickupData: dataProp }
            : name === 'NOT-MANIFESTED'
            ? { notManifestedData: dataProp }
            : { draftWaybillsData: dataProp },
      });

      await modal.present();
    }
  }

    async openSfxModal() {
        console.log('Opening SFX Modal');
        this.assignedSfxData = this.getAssignedSfxData();
        const modal = await this.modalController.create({
          component: SfxModalComponent,
          componentProps: { assignedSfxData: this.assignedSfxData },
          cssClass: 'sfx-modal'
        });
        await modal.present();
        await   modal.onDidDismiss();
    }

  async openZeroPickupModal() {
  console.log('Opening ZERO PICKUP Modal');
  this.zeroPickupData = this.getZeroPickupData();
  console.log('Zero Pickup Data:', this.zeroPickupData);
  const modal = await this.modalController.create({
    component: ZeroPickupModalComponent,
    componentProps: { zeroPickupData: this.zeroPickupData },
    showBackdrop: false,
    backdropDismiss: false,
    canDismiss: true,
    breakpoints: [0, 0.6, 0.95],
    initialBreakpoint: 0.6,
    handle: true, // 👈 adds the draggable handle bar at the top
    //cssClass: 'zero-pickup-sheet'
  presentingElement: await this.modalController.getTop(),
});
  await modal.present();
  await modal.onDidDismiss();
}


  async openNotManifestedModal() {
  console.log('Opening NOT MANIFESTED Modal');
    this.notManifestedData = this.getNotManifestedData();
    const modal = await this.modalController.create({
      component: NotManifestedModalComponent,
      componentProps: { notManifestedData: this.notManifestedData },
      cssClass: 'not-manifested-modal'
    });
    await modal.present();
    await modal.onDidDismiss();
  }

  async openDraftWaybillsModal() {
  console.log('Opening DRAFT WAYBILLS Modal');
    this.draftWaybillsData = this.getDraftWaybillsData();
    const modal = await this.modalController.create({
      component: DraftWaybillsModalComponent,
      componentProps: { draftWaybillsData: this.draftWaybillsData },
      cssClass: 'draft-waybills-modal'
    });
    await modal.present();
    await modal.onDidDismiss();
  }

  closeSfxModal() { this.modalController.dismiss(); }
  closeZeroPickupModal() { this.modalController.dismiss(); }
  closeNotManifestedModal() { this.modalController.dismiss(); }
  closeDraftWaybillsModal() { this.modalController.dismiss(); }

    onProgressChange(newVal: number) {
    this.progressValue = newVal;
  }
  getAssignedSfxData(): any[] {
    return [
      { code: 'SFX0001234333', consignor: 'S.K. Electrical Pvt. Ltd.', lastPickupDate: '07-JUL-2025' },
      { code: 'SFX0004567437', consignor: 'Gama Solutions Pvt. Ltd.', lastPickupDate: '07-JUL-2025' },
      { code: 'SFX00027254783', consignor: 'Samsung India Pvt. Ltd.', lastPickupDate: '07-JUL-2025' },
      { code: 'SFX000263409877', consignor: 'Khurana Garments', lastPickupDate: '07-JUL-2025' },
      { code: 'SFX0001234222', consignor: 'Unknown', lastPickupDate: '07-JUL-2025' }
    ];
  }

  getZeroPickupData(): any[] {
    return [
      { code: 'SFX00027254783', consignor: 'Samsung India Pvt. Ltd.', lastPickupDate: '07-JUL-2025' },
      { code: 'SFX000263409877', consignor: 'Khurana Garments', lastPickupDate: '07-JUL-2025' },
      { code: 'SFX0001234333', consignor: 'S.K. Electrical Pvt. Ltd.', lastPickupDate: '07-JUL-2025' },
      { code: 'SFX0004567437', consignor: 'Gama Solutions Pvt. Ltd.', lastPickupDate: '07-JUL-2025' }
    ];
  }

  getNotManifestedData(): any[] {
    return [
      { waybill: '4083 3650 7803', booked: 100, manifested: 80, remaining: 20, consignor: 'S.K. Electrical Pvt. Ltd.', pickupDate: '07-JUL-2025' },
      { waybill: '2279 7354 3382', booked: 100, manifested: 75, remaining: 25, consignor: 'Gama Solutions Pvt. Ltd.', pickupDate: '07-JUL-2025' },
      { waybill: '1300 6454 7775', booked: 100, manifested: 75, remaining: 25, consignor: 'Samsung India Pvt. Ltd.', pickupDate: '07-JUL-2025' },
      { waybill: '2000 9390 2222', booked: 100, manifested: 75, remaining: 25, consignor: 'Khurana Garments', pickupDate: '07-JUL-2025' },
      { waybill: '2100 AAAA 4565', booked: 100, manifested: 75, remaining: 25, consignor: 'Unknown', pickupDate: '07-JUL-2025' }
    ];
  }

  getDraftWaybillsData(): any[] {
    return [
      { waybill: '4083 3650 7803', consignor: 'S.K. Electrical Pvt. Ltd.', pickupDate: '07-JUL-2025' },
      { waybill: '2279 7354 3382', consignor: 'Gama Solutions Pvt. Ltd.', pickupDate: '07-JUL-2025' },
      { waybill: '1300 6454 7775', consignor: 'Samsung India Pvt. Ltd.', pickupDate: '07-JUL-2025' },
      { waybill: '2000 9390 2222', consignor: 'Khurana Garments', pickupDate: '07-JUL-2025' },
      { waybill: '2100 AAAA 4565', consignor: 'Unknown', pickupDate: '07-JUL-2025' }
    ];
  }

  getShExDetails(vehicleNo: string): any[] {
    if (vehicleNo === '5555') {
      return [
        { waybill: '1000 7474 8855', booked: 100, manifested: 100, received: 99, consignor: 'S.K. Electrical Pvt. Ltd.', pickupDate: '08-JUL-2025', status: 'Short' },
        { waybill: '1000 2020 2353', booked: 100, manifested: 100, received: 101, consignor: 'Sadashiv Electronics', pickupDate: '08-JUL-2025', status: 'Excess' },
        { waybill: '2000 9292 6754', booked: 100, manifested: 0, received: 2, consignor: 'J.S. Camicals', pickupDate: '08-JUL-2025', status: 'Excess' },
        { waybill: '2000 9633 9825', booked: 100, manifested: 100, received: 0, consignor: 'Samsung India Pvt. Ltd.', pickupDate: '08-JUL-2025', status: 'Short' }
      ];
    }
    return [];
  }

  getGradient(value: number): string {
  if (value >= 0 && value <= 33) {
    // Dominantly red
    return 'linear-gradient(90deg, #DA2D24 0%, #D2E241 60%, #42D844 100%)';
  } else if (value >= 34 && value <= 66) {
    // Mid range: yellow center dominant
    return 'linear-gradient(90deg, #D2E241 0%, #42D844 80%, #DA2D24 100%)';
  } else {
    // High: mostly green
    return 'linear-gradient(90deg, #42D844 0%, #D2E241 60%, #DA2D24 100%)';
  }
}

}
