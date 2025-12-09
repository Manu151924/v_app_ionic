import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonToolbar,
  IonFooter,
  IonButtons,
  IonButton,
  IonLabel,
  IonBadge,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonHeader
} from '@ionic/angular/standalone';

import { BookingPage } from '../pages/booking/booking.page';
import { DeliveryPage } from '../pages/delivery/delivery.page';
import { Router, RouterModule } from '@angular/router';
import { AppStorageService } from '../shared/services/app-storage';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonSegmentButton,
    IonSegment,
    IonBadge,
    RouterModule,
    IonLabel,
    IonButton,
    IonFooter,
    IonToolbar,
    IonContent,
    DeliveryPage,
    BookingPage,
    FormsModule,
    CommonModule
  ],
})
export class HomePage implements OnInit {

  segment: string = 'booking';

  bookingVendorID: string = '';
  deliveryVendorID: string = '';

  notificationsCount = 5;
  disableBooking = false;
  disableDelivery = false;

  activeTab: 'home' | 'task' | 'account' = 'home';

  private router = inject(Router);
  private storage = inject(AppStorageService);

  async ngOnInit() {
    const user = await this.storage.getUserDetails();

    if (!user) {
      console.warn('No userDetails found → redirecting to login');
      this.router.navigateByUrl('/login', { replaceUrl: true });
      return;
    }

    /** Extract IDs */
    this.bookingVendorID = user.bookingVendorId?.toString() || '';
    this.deliveryVendorID = user.deliveryVendorId?.toString() || '';

    let vendorTypes: string[] = [];
    if (Array.isArray(user.vendorType)) {
      vendorTypes = user.vendorType;
    } else if (typeof user.vendorType === 'string') {
      vendorTypes = [user.vendorType];
    }

    console.log("Parsed Vendor Types:", vendorTypes);
    console.log("Booking Vendor ID:", this.bookingVendorID);
    console.log("Delivery Vendor ID:", this.deliveryVendorID);

    /** Decide active segment */
    if (vendorTypes.includes('DELIVERY') && vendorTypes.includes('BOOKING')) {
      this.disableBooking = false;
      this.disableDelivery = false;
      this.segment = user.activeSegment || 'booking';
    }
    else if (vendorTypes.includes('DELIVERY')) {
      this.segment = 'delivery';
      this.disableBooking = true;
      this.disableDelivery = false;
    }
    else if (vendorTypes.includes('BOOKING')) {
      this.segment = 'booking';
      this.disableBooking = false;
      this.disableDelivery = true;
    }
    else {
      this.disableBooking = true;
      this.disableDelivery = true;
    }

    /** Persist the chosen active segment */
    await this.storage.updateUserDetails({ activeSegment: this.segment });
  }

  switchTab(tab: 'home' | 'task' | 'account') {
    this.activeTab = tab;
    this.router.navigate([`/${tab}`]);
  }

  async onSegmentChange(event: any) {
    this.segment = event?.detail?.value || this.segment;

    console.log('Segment changed to:', this.segment);

    /** Persist user's active segment */
    await this.storage.updateUserDetails({
      activeSegment: this.segment
    });

    /** Reload IDs if needed */
    const user = await this.storage.getUserDetails();
    this.bookingVendorID = user?.bookingVendorId?.toString() || '';
    this.deliveryVendorID = user?.deliveryVendorId?.toString() || '';
  }

}
