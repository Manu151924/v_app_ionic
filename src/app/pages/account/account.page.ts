import { Component, OnInit } from '@angular/core';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons,
  IonBackButton, IonCard, IonIcon, IonButton, NavController, AlertController
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { personCircleOutline, powerOutline, busOutline } from 'ionicons/icons';
import { Api } from 'src/app/shared/services/api';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-account',
  templateUrl: './account.page.html',
  styleUrls: ['./account.page.scss'],
  standalone: true,
  imports: [
    IonIcon, IonCard, IonBackButton, IonButtons,
    IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule
  ]
})
export class AccountPage implements OnInit {

  vendorName: string = '';

  constructor(
    private navCtrl: NavController,
    private alertCtrl: AlertController,
    private api: Api
  ) {
    addIcons({personCircleOutline,busOutline,powerOutline});
  }

  ngOnInit() {
    this.vendorName = localStorage.getItem("vendorName") ?? "My Profile";
  }
    version = environment.version;
  

openProfileDetails() {

  const segment = localStorage.getItem("activeSegment") || "booking";

  const vendorId =
    segment === "booking"
      ? localStorage.getItem("bookingVendorId")
      : localStorage.getItem("deliveryVendorId");

  const token = localStorage.getItem("accessToken");

  if (!vendorId || !token) {
    console.error("Missing vendorId or token");
    return;
  }

  this.api.getVendorDetails(vendorId, token).subscribe({
    next: (res) => {
      console.log("Vendor Details:", res);

      localStorage.setItem("vendorName", res.vendorName ?? "");
      localStorage.setItem("vendorEmail", res.userEmail ?? "");
      localStorage.setItem("vendorGstin", res.gstin ?? "");
      localStorage.setItem("vendorPhone", res.userPhone ?? "");
      localStorage.setItem("contactList", JSON.stringify(res.contactList ?? []));

      this.navCtrl.navigateForward('/profile-details');
    },
    error: (err) => {
      console.error("Vendor API Error:", err);
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
          handler: () => {
            localStorage.clear();
            this.navCtrl.navigateRoot('/login');
          }
        }
      ],
    });

    await alert.present();
  }

}
