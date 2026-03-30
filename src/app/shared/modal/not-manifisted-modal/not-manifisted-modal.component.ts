import { Component, Input, inject } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { close} from 'ionicons/icons';
import { WaybillFormatPipe } from "../../utilities/waybill-format-pipe";
import { AppDatePipe } from "../../utilities/app-date-pipe";

@Component({
  selector: 'app-BOOKED BUT NOT MANIFESTED-modal',
  templateUrl: './not-manifisted-modal.component.html',
  styleUrls: ['./not-manifisted-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, WaybillFormatPipe]
})
export class NotManifestedModalComponent {
  private modalCtrl = inject(ModalController);

  @Input() notManifestedData: {
    waybill: string,                         
    consignor: string,
    booked: number,
    manifested: number,
    remaining: number,
    pickupDate: string
  }[] = [];

    constructor() {
    addIcons({close})
  }

  close() {
    this.modalCtrl.dismiss();
  }
}
