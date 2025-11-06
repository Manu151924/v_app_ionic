import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ModalController } from '@ionic/angular';
import { IonicModule } from '@ionic/angular';
import { IonCard, IonSelect,IonSelectOption } from "@ionic/angular/standalone";
import { WaybillListPopupComponent } from '../waybill-list-popup/waybill-list-popup.component';

@Component({
  selector: 'app-assign-sfx-card',
  templateUrl: './assign-sfx-card.component.html',
  styleUrls: ['./assign-sfx-card.component.scss'],
  imports:[IonCard,IonSelect,IonSelectOption,FormsModule,CommonModule,IonicModule]
})
export class AssignSfxCardComponent {
  private modalCtrl = inject(ModalController);

  selectedLocation = 'DELHI-11';
  locations = ['DELHI-11', 'MUMBAI-22', 'BANGALORE-33'];

  assignedSFX = 20;

  zeroPickupCount = 4;
  zeroPickupTotal = 20;
  zeroPickupPercent = (this.zeroPickupCount / this.zeroPickupTotal) * 100;

  notManifestedCount = 120;
  notManifestedTotal = 150;
  notManifestedPercent = (this.notManifestedCount / this.notManifestedTotal) * 100;

  draftWaybillsCount = 79;
  draftWaybillsTotal = 100;
  draftWaybillsPercent = (this.draftWaybillsCount / this.draftWaybillsTotal) * 100;


  openZeroPickupPopup() {
    this.openWaybillPopup('Zero Pickup SFX', [
      { waybillNo: 'WB12345', lastPickupDate: '2025-10-01', sfxCode: 'SFX01', consignorName: 'Consignor A' },
      { waybillNo: 'WB12346', lastPickupDate: '2025-10-01', sfxCode: 'SFX02', consignorName: 'Consignor B' }
    ]);
  }

  openNotManifestedPopup() {
    this.openWaybillPopup('Not Manifested', [
      { waybillNo: 'WB23456', pickupDate: '2025-09-30', consignorName: 'Consignor C', bookedPkgs: 10, manifestedPkgs: 7, remainingPkgs: 3 },
      { waybillNo: 'WB23457', pickupDate: '2025-09-30', consignorName: 'Consignor D', bookedPkgs: 5, manifestedPkgs: 5, remainingPkgs: 0 }
    ]);
  }

  openDraftWaybillsPopup() {
    this.openWaybillPopup('Draft Waybills', [
      { waybillNo: 'WB34567', consignorName: 'Consignor E', bookedPkgs: 3, totalPkgs: 5 }
    ]);
  }

  private async openWaybillPopup(title: string, waybills: any[]) {
    const modal = await this.modalCtrl.create({
      component: WaybillListPopupComponent,
      componentProps: {
        title,
        waybills
      }
    });
    await modal.present();
  }

}
