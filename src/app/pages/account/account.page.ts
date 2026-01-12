import { Component, OnInit, inject } from '@angular/core';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonCard,
  IonIcon,
  NavController,
  AlertController
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { personCircleOutline, powerOutline, busOutline, person } from 'ionicons/icons';
import { environment } from 'src/environments/environment';

import { Api } from 'src/app/shared/services/api';
import { Auth } from 'src/app/shared/services/auth';
import { AppStorageService } from 'src/app/shared/services/app-storage';

@Component({
  selector: 'app-account',
  templateUrl: './account.page.html',
  styleUrls: ['./account.page.scss'],
  standalone: true,
  imports: [
    IonIcon,
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    IonCard
]
})
export class AccountPage implements OnInit {

  private navCtrl = inject(NavController);
  private alertCtrl = inject(AlertController);
  private api = inject(Api);
  private storage = inject(AppStorageService);
  private auth = inject(Auth);

  vendorName = 'My Profile';
  version = environment.version;

  constructor() {
    addIcons({person,powerOutline,personCircleOutline,busOutline});
  }

  /* ---------------- Lifecycle ---------------- */

  async ngOnInit() {
    const user = await this.storage.getUserDetails();
    this.vendorName = user?.vendorName || 'My Profile';
  }

  /* ---------------- Profile Details ---------------- */

  // async openProfileDetails() {
  //   const user = await this.storage.getUserDetails();

  //   if (!user) {
  //     console.error('User details missing');
  //     return;
  //   }

  //   // Decide vendor based on availability
  //   const vendorId =
  //     user.vendorType?.includes('BOOKING')
  //       ? user.bookingVendorId
  //       : user.deliveryVendorId;

  //   if (!vendorId) {
  //     console.error('VendorId not available');
  //     return;
  //   }

  //   const token = await this.auth.getAccessToken();
  //   if (!token) {
  //     console.error('Access token missing');
  //     return;
  //   }

  //   this.api.getVendorDetails(vendorId, token).subscribe({
  //     next: async (res) => {
  //       // Persist vendor details in Ionic Storage
  //       await this.storage.updateUserDetails({
  //         vendorName: res.vendorName ?? '',
  //         vendorEmail: res.userEmail ?? '',
  //         vendorGstin: res.gstin ?? '',
  //         vendorPhone: res.userPhone ?? ''
  //       });

  //       this.navCtrl.navigateForward('/profile-details');
  //     },
  //     error: (err) => {
  //       console.error('Vendor API Error:', err);
  //     }
  //   });
  // }
  async openProfileDetails() {
  const vendorId = await this.storage.getActiveVendorId();

  if (!vendorId) {
    console.error('VendorId not available');
    return;
  }

  const token = await this.auth.getAccessToken();
  if (!token) {
    console.error('Access token missing');
    return;
  }

  console.log('Calling Vendor API with VendorId:', vendorId);

  this.api.getVendorDetails(vendorId, token).subscribe({
    next: async (res) => {
      await this.storage.updateUserDetails({
        vendorName: res.vendorName ?? '',
        vendorEmail: res.userEmail ?? '',
        vendorGstin: res.gstin ?? '',
        vendorPhone: res.userPhone ?? ''
      });

      this.navCtrl.navigateForward('/profile-details');
    },
    error: (err) => {
      console.error('Vendor API Error:', err);
    }
  });
}


  /* ---------------- Logout ---------------- */

  async logout() {
    const alert = await this.alertCtrl.create({
      header: 'Logout',
      message: 'Are you sure you want to logout?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Logout',
          handler: async () => {
            await this.auth.logout();
            this.navCtrl.navigateRoot('/login');
          }
        }
      ],
    });

    await alert.present();
  }
}
