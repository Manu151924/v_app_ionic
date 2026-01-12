import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonButtons, IonBackButton, IonCard,
  IonChip, IonLabel, IonIcon, IonButton, IonBadge
} from '@ionic/angular/standalone';
import { Clipboard } from '@capacitor/clipboard';
import { ToastController } from '@ionic/angular';

import {
  copyOutline,
  trashOutline,
  createOutline,
  addCircle,
  notificationsOutline, personCircleOutline, 
  checkmarkCircle} from 'ionicons/icons';

import { AppStorageService } from 'src/app/shared/services/app-storage';

@Component({
  selector: 'app-profile-details',
  standalone: true,
  templateUrl: './profile-details.page.html',
  styleUrls: ['./profile-details.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonCard,
    IonChip,
    IonLabel,
    IonIcon,
    IonButton,
    IonBadge
  ]
})
export class ProfileDetailsPage implements OnInit {

  private storage = inject(AppStorageService);

  vendorName = '';
  vendorEmail = '';
  vendorGstin = '';
  vendorPhone = '';
  notificationsCount: number = 0;

  contactList: Array<{
    empName: string;
    mobile: string;
    status: string;
  }> = [];

  constructor() {
    addIcons({personCircleOutline,createOutline,copyOutline,trashOutline,addCircle,notificationsOutline,checkmarkCircle});
  }
private toastCtrl = inject(ToastController);

  async ngOnInit() {
    const user = await this.storage.getUserDetails();
    if (!user) return;

    this.vendorName = user.vendorName ?? '';
    this.vendorEmail = user.vendorEmail ?? '';
    this.vendorGstin = user.vendorGstin ?? '';
    this.vendorPhone = user.vendorPhone ?? '';

    if (this.vendorName && this.vendorPhone) {
      this.contactList = [
        {
          empName: this.vendorName,
          mobile: this.vendorPhone,
          status: 'Active'
        }
      ];
    }
  }
  async copyText(value: string, label: string) {
  if (!value) return;

  try {
    await Clipboard.write({
      string: value
    });

    const toast = await this.toastCtrl.create({
      message: `${label} copied to clipboard`,
      duration: 1500,
      color: 'success',
      position: 'bottom',
      icon: 'checkmark-circle'
    });

    await toast.present();
  } catch (err) {
    const toast = await this.toastCtrl.create({
      message: `Failed to copy ${label}`,
      duration: 1500,
      color: 'danger'
    });

    await toast.present();
  }
}

}
