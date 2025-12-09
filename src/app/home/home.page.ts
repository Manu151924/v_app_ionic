import { Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
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

  constructor(private router: Router) {}

  ngOnInit() {
    this.bookingVendorID = localStorage.getItem('bookingVendorId') || '';
    this.deliveryVendorID = localStorage.getItem('deliveryVendorId') || '';
    let stored = localStorage.getItem('vendorType');
    let vendorTypes: string[] = [];

    try {
      vendorTypes = JSON.parse(stored || '[]');
    } catch {
      if (stored) vendorTypes = [stored];
    }

    console.log("Parsed Vendor Types:", vendorTypes);
    console.log("Booking Vendor ID:", this.bookingVendorID);
    console.log("Delivery Vendor ID:", this.deliveryVendorID);

    // Default
    this.segment = 'booking';

    if (vendorTypes.includes('DELIVERY') && vendorTypes.includes('BOOKING')) {
      this.disableBooking = false;
      this.disableDelivery = false;
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
      localStorage.setItem("activeSegment", this.segment);

  }

  switchTab(tab: 'home' | 'task' | 'account') {
    this.activeTab = tab;
    this.router.navigate([`/${tab}`]);
  }
onSegmentChange(event: any) {
  this.segment = event?.detail?.value || this.segment;
  localStorage.setItem('activeSegment', this.segment);
  console.log('Segment changed to:', this.segment)

  this.bookingVendorID = localStorage.getItem('bookingVendorId') || '';
  this.deliveryVendorID = localStorage.getItem('deliveryVendorId') || '';
}

}
