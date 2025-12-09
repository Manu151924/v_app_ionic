import { Component, OnInit, inject } from '@angular/core';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons,
  IonBackButton, IonCard, IonIcon, AlertController, NavController
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { personCircleOutline, powerOutline, busOutline } from 'ionicons/icons';

import { Api } from 'src/app/shared/services/api';
import { environment } from 'src/environments/environment';
import { Auth } from 'src/app/shared/services/auth';
import { AppStorageService } from 'src/app/shared/services/app-storage';

@Component({
  selector: 'app-account',
  templateUrl: './account.page.html',
  styleUrls: ['./account.page.scss'],
  standalone: true,
  imports: [
    IonIcon, IonCard, IonBackButton, IonButtons,
    IonContent, IonHeader, IonTitle, IonToolbar,
    CommonModule, FormsModule
  ]
})
export class AccountPage implements OnInit {

  private navCtrl = inject(NavController);
  private alertCtrl = inject(AlertController);
  private api = inject(Api);
  private auth = inject(Auth);
  private storage = inject(AppStorageService);

  vendorName: string = '';
  version = environment.version;

  constructor() {
    addIcons({ personCircleOutline, busOutline, powerOutline });
  }

  async ngOnInit() {
    const user = await this.storage.getUserDetails();
    this.vendorName = user?.vendorName ?? 'My Profile';
  }

 async openProfileDetails() {
    this.api.getVendorDetails().subscribe({
      next: async (res) => {
        console.log('Vendor Details:', res);

        if (!res?.responseStatus) return;

        await this.storage.updateUserDetails({
          vendorName: res.responseObject?.vendorName ?? '',
          vendorEmail: res.responseObject?.userEmail ?? '',
          vendorGstin: res.responseObject?.gstin ?? '',
          vendorPhone: res.responseObject?.userPhone ?? '',
          contactList: res.responseObject?.contactList ?? []
        });

        this.navCtrl.navigateForward('/profile-details');
      },
      error: (err) => {
        console.error('Vendor API Error:', err);
      }
    });
  }

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
          }
        }
      ],
    });

    await alert.present();
  }
}
