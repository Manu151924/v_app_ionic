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
    addIcons({ close });
  }

  close() {
    this.modalCtrl.dismiss();
  }

  // 🔥 Format: HP933363 → HP 93 3363
  get formattedVehicleNo(): string {
    if (!this.vehcleNoFull) return '';

    const value = this.vehcleNoFull.replace(/\s+/g, '');

    const match = value.match(/^([A-Z]{2})(\d{2})(\d+)$/);

    if (!match) return this.vehcleNoFull; // fallback if pattern doesn't match

    return `${match[1]} ${match[2]} ${match[3]}`;
  }
}

