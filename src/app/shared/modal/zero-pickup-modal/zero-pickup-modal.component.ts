import { Component, Input, inject } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { close} from 'ionicons/icons';


@Component({
  selector: 'app-zero-pickup-modal',
  templateUrl: './zero-pickup-modal.component.html',
  styleUrls: ['./zero-pickup-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class ZeroPickupModalComponent {
  private modalCtrl = inject(ModalController);

  @Input() zeroPickupData: any[] = [];

  constructor() {
    addIcons({close})
  }
  close() {
    this.modalCtrl.dismiss();
  }
}
