import { Component, Input, inject } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { close} from 'ionicons/icons';

@Component({
  selector: 'app-draft-waybills-modal',
  templateUrl: './draft-waybill-modal.component.html',
  styleUrls:['./draft-waybill-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class DraftWaybillsModalComponent {
  private modalCtrl = inject(ModalController);

  @Input() draftWaybillsData: any[] = [];
  constructor() {
    addIcons({close})
  }

  close() {
    this.modalCtrl.dismiss();
  }
}
