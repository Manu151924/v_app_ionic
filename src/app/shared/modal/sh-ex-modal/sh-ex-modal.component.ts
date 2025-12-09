import { Component, Input, inject } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { close} from 'ionicons/icons';

@Component({
  selector: 'app-sh-ex-modal',
  templateUrl: './sh-ex-modal.component.html',
  styleUrls: ['./sh-ex-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class ShExModalComponent {
  private modalCtrl = inject(ModalController);

  @Input() shExDetails: any[] = [];
  @Input() vehcleNoFull: string = '';


  constructor() {
    addIcons({close})
  }

  close() {
    this.modalCtrl.dismiss();
  }
}
