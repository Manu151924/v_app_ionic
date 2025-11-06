import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonToolbar, IonFooter, IonButtons, IonButton, IonLabel, IonBadge, IonContent, IonSegment, IonSegmentButton, IonHeader } from '@ionic/angular/standalone';

import { BookingPage } from '../pages/booking/booking.page';
import { DeliveryPage } from '../pages/delivery/delivery.page';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [IonHeader, IonSegmentButton, IonSegment, IonBadge,RouterModule, IonLabel, IonButton, IonFooter, IonToolbar, IonContent, DeliveryPage,BookingPage,FormsModule,CommonModule],
})
export class HomePage implements OnInit {
  segment: string = 'delivery';
  notificationsCount = 5;
  disableBooking = false;
  disableDelivery = false;
  activeTab: 'home' | 'task' | 'account' = 'home';

  tabRoutes: Record<string, string> = {
    home: '/home',
    task: '/task',
    account: '/account',
  };

  tabIcons: Record<string, string> = {
    home: 'assets/icon/home.png',
    task: 'assets/icon/task-icon.png',
    account: 'assets/icon/account.png',
  };

  constructor(private router: Router) {}

  ngOnInit() {
    // const vendorType = JSON.parse(localStorage.getItem('vendorType') || '[]');

    // if (vendorType.includes('DELIVERY')) {
    //   this.segment = 'delivery';
    //   this.disableBooking = true;
    //   this.disableDelivery = false;
    // } else if (vendorType.includes('BOOKING')) {
    //   this.segment = 'booking';
    //   this.disableBooking = false;
    //   this.disableDelivery = true;
    // } else {
    //   this.segment = 'booking';
    //   this.disableBooking = true;
    //   this.disableDelivery = true;
    // }
 }
  switchTab(tab: 'home' | 'task' | 'account') {
    this.activeTab = tab;
    this.router.navigate([this.tabRoutes[tab]]);
  }
}

