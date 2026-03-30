import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
   IonContent, IonHeader, IonTitle, IonToolbar,
  IonButtons, IonBackButton, IonCard,
  IonChip, IonLabel, IonIcon, IonButton, IonBadge, IonFab, IonFabButton } from '@ionic/angular/standalone';
import { Clipboard } from '@capacitor/clipboard';
import { ToastController } from '@ionic/angular';
import { NavController } from '@ionic/angular';

import { addIcons } from 'ionicons';
import {
  personCircleOutline,
  copyOutline,
  checkmarkCircle,
  briefcaseOutline,
  carOutline, chevronBackOutline, 
  arrowBack, createOutline, add, trashOutline, personOutline, notificationsOutline, addOutline } from 'ionicons/icons';

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
    IonCard,
    IonChip,
    IonIcon,
    IonBadge,
    IonButton,
]
})
export class ProfileDetailsPage implements OnInit {

  private storage = inject(AppStorageService);
  private toastCtrl = inject(ToastController);
    private navCtrl = inject(NavController);

    notificationsCount: number = 0;
      contactList: Array<{
    empName: string;
    mobile: string;
    status: string;
  }> = [];

vendorList: Array<{
  vendorType: 'BOOKING' | 'DELIVERY';
  vendorName: string;
  vendorEmail: string;
  vendorGstin: string;
  vendorPhone: string;
  contactList: Array<{
    empName: string;
    mobile: string;
    status: string;
  }>;
}> = [];


  constructor() {
    addIcons({chevronBackOutline,notificationsOutline,personOutline,createOutline,copyOutline,addOutline,trashOutline,add,personCircleOutline,checkmarkCircle,});
  }
async ngOnInit() {
  const user = await this.storage.getUserDetails();
  if (!user) return;

  if (Array.isArray(user.vendorList) && user.vendorList.length > 0) {
    this.vendorList = user.vendorList.map(v => ({
      vendorType: this.normalizeVendorType(v.vendorType),
      vendorName: v.vendorName ?? '',
      vendorEmail: v.userEmail ?? '',
      vendorGstin: v.gstin ?? '',
      vendorPhone: v.userPhone ?? '',
      contactList: [
        {
          empName: v.vendorName ?? '',
          mobile: v.userPhone ?? '',
          status: this.mapStatus(v.status)
        }
      ]
    })).sort((a, b) => a.vendorType.localeCompare(b.vendorType));;
  } else {
    this.vendorList = [{
      vendorType: this.normalizeVendorType(user.vendorType),
      vendorName: user.vendorName ?? '',
      vendorEmail: user.vendorEmail ?? '',
      vendorGstin: user.vendorGstin ?? '',
      vendorPhone: user.vendorPhone ?? '',
      contactList: [
        {
          empName: user.vendorName ?? '',
          mobile: user.vendorPhone ?? '',
          status: 'Active'
        }
      ]
    }];
  }
}


private normalizeVendorType(type: any): 'BOOKING' | 'DELIVERY' {
  return type === 'DELIVERY' ? 'DELIVERY' : 'BOOKING';
}

private mapStatus(status: string): string {
  switch (status) {
    case 'A': return 'Active';
    case 'I': return 'Inactive';
    default: return 'Unknown';
  }
}



  async copyText(value: string, label: string) {
    if (!value) return;

    await Clipboard.write({ string: value });

    const toast = await this.toastCtrl.create({
      message: `${label} copied to clipboard`,
      duration: 1500,
      color: 'success',
      position: 'bottom',
      icon: 'checkmark-circle'
    });

    await toast.present();
  }
   goBack(){
    this.navCtrl.navigateBack(['./account'])
  }
}
