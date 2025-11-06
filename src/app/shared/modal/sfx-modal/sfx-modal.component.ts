import { Component, Input, inject } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';

@Component({
  selector: 'app-sfx-modal',
  templateUrl: './sfx-modal.component.html',
  styleUrls: ['./sfx-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class SfxModalComponent {
  private modalCtrl = inject(ModalController);
  constructor(){
    addIcons({close})
  }

  @Input() assignedSfxData: {
    code: string;
    consignor: string;
    lastPickupDate: string;
  }[] = [];
  close() {
    this.modalCtrl.dismiss();
  }
}
