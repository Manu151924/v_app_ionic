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
  AlertController,
  IonBadge,
  IonButton, IonFooter } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import {
  personCircleOutline,
  powerOutline,
  busOutline,
  person,
  chevronBackOutline,
  carOutline,
  cashOutline,
  businessOutline,
} from 'ionicons/icons';
import { environment } from 'src/environments/environment';

import { Api } from 'src/app/shared/services/api';
import { Auth } from 'src/app/shared/services/auth';
import { AppStorageService } from 'src/app/shared/services/app-storage';
import { FooterComponent } from "src/app/shared/components/footer/footer.component";

@Component({
  selector: 'app-account',
  templateUrl: './account.page.html',
  styleUrls: ['./account.page.scss'],
  standalone: true,
  imports: [IonFooter,
    IonButton,
    IonIcon,
    IonContent,
    IonHeader,
    IonToolbar,
    CommonModule,
    FormsModule,
    IonCard, FooterComponent],
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
    addIcons({
      chevronBackOutline,
      personCircleOutline,
      carOutline,
      cashOutline,
      businessOutline,
      person,
      powerOutline,
      busOutline,
    });
  }

  /* ---------------- Lifecycle ---------------- */

  async ngOnInit() {
    const user = await this.storage.getUserDetails();
    this.vendorName = user?.vendorName || 'My Profile';
  }

  /* ---------------- Profile Details ---------------- */

  async openProfileDetails(): Promise<void> {
    try {
      const token = await this.auth.getAccessToken();
      if (!token) {
        console.error('Access token missing');
        return;
      }

      this.api.getVendorDetails(token).subscribe({
        next: async (vendors: any[]) => {
          if (!Array.isArray(vendors) || vendors.length === 0) {
            console.error('Vendor list empty');
            return;
          }

          const defaultVendor =
            vendors.find((v) => v.vendorType === 'BOOKING') || vendors[0];

          await this.storage.updateUserDetails({
            vendorName: defaultVendor.vendorName ?? '',
            vendorEmail: defaultVendor.userEmail ?? '',
            vendorGstin: defaultVendor.gstin ?? '',
            vendorPhone: defaultVendor.userPhone ?? '',
            vendorType: defaultVendor.vendorType,
            vendorList: vendors,
          });

          this.navCtrl.navigateForward('/profile-details');
        },
        error: (err) => {
          console.error('Vendor API Error:', err);
        },
      });
    } catch (error) {
      console.error('openProfileDetails error:', error);
    }
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
            window.location.href = '/login';
          },
        },
      ],
    });

    await alert.present();
  }
  goBack() {
    this.navCtrl.navigateBack(['./home']);
  }
}
