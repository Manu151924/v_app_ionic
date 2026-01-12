import { Component, OnInit, ViewChild, inject } from '@angular/core';
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
  IonHeader,
} from '@ionic/angular/standalone';
import { Router, RouterModule } from '@angular/router';

import { BookingPage } from '../pages/booking/booking.page';
import { DeliveryPage } from '../pages/delivery/delivery.page';
import { AppStorageService } from '../shared/services/app-storage';
import { Crashlytics } from '../shared/services/crashlytics';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonBadge,
    RouterModule,
    IonContent,
    DeliveryPage,
    BookingPage,
    FormsModule,
    CommonModule,
    IonToolbar,
    IonButton
],
})
export class HomePage implements OnInit {

  private storage = inject(AppStorageService);
  private router = inject(Router);
  private crashlytics = inject(Crashlytics);

  segment: 'booking' | 'delivery' |'network' = 'booking';

  bookingVendorID: number | null = null;
  deliveryVendorID: number | null = null;

  notificationsCount = 0;

  disableBooking = false;
  disableDelivery = false;

  activeTab: 'home' | 'task' | 'account' = 'home';

  @ViewChild(BookingPage) bookingCmp!: BookingPage;
  @ViewChild(DeliveryPage) deliveryCmp!: DeliveryPage;

  async ngOnInit() {
    await this.loadUserContext();
  }

  /* ================= USER + VENDOR CONTEXT ================= */

  private async loadUserContext() {
    const user = await this.storage.getUserDetails();

    if (!user) {
      console.warn('No user found in storage');
      this.crashlytics.recordNonFatal(
        'User not found in storage',
        'HOME_CONTEXT_MISSING'
      );
      return;
    }

    const vendorTypes = user.vendorType || [];

    this.bookingVendorID = user.bookingVendorId || null;
    this.deliveryVendorID = user.deliveryVendorId || null;

    // Vendor access logic
    if (vendorTypes.includes('BOOKING') && vendorTypes.includes('DELIVERY')) {
      this.disableBooking = false;
      this.disableDelivery = false;
    } else if (vendorTypes.includes('BOOKING')) {
      this.disableBooking = false;
      this.disableDelivery = true;
    } else if (vendorTypes.includes('DELIVERY')) {
      this.disableBooking = true;
      this.disableDelivery = false;
    } else {
      this.disableBooking = true;
      this.disableDelivery = true;

      // Invalid vendor mapping – very important to log
      this.crashlytics.recordNonFatal(
        'Vendor has no BOOKING or DELIVERY mapping',
        'INVALID_VENDOR_MAPPING'
      );
    }

    // Restore last segment
    const lastSegment = user.activeSegment as 'booking' | 'delivery' | undefined;

    if (lastSegment && !this.isSegmentDisabled(lastSegment)) {
      this.segment = lastSegment;
    } else {
      if (vendorTypes.includes('DELIVERY') && !vendorTypes.includes('BOOKING')) {
        this.segment = 'delivery';
      } else {
        this.segment = 'booking';
      }
    }

    // Send vendor context to Crashlytics
    this.crashlytics.setUserContext({
      userId: String(this.bookingVendorID || this.deliveryVendorID || ''),
      role: vendorTypes.join(','),
      appVersion: environment.version
    });

    // this.crashlytics.logBusinessEvent('VENDOR_CONTEXT', {
    //   bookingVendorId: this.bookingVendorID,
    //   deliveryVendorId: this.deliveryVendorID,
    //   activeSegment: this.segment
    // });

    console.log('Active Segment:', this.segment);
  }

  private isSegmentDisabled(seg: 'booking' | 'delivery'): boolean {
    return (
      (seg === 'booking' && this.disableBooking) ||
      (seg === 'delivery' && this.disableDelivery)
    );
  }

  /* ================= PULL TO REFRESH ================= */

  doRefresh(event: any) {
    console.log('Pull to refresh');

    if (this.segment === 'booking' && this.bookingCmp) {
      this.bookingCmp.doRefresh(event);
      return;
    }

    if (this.segment === 'delivery' && this.deliveryCmp) {
      this.deliveryCmp.forceRefresh().then(() => event.target.complete());
      return;
    }

    // Safety fallback
    event.target.complete();
  }

  /* ================= SEGMENT CHANGE ================= */

  async onSegmentChange(event: any) {
    const newSegment = event?.detail?.value;

    if (!newSegment || this.isSegmentDisabled(newSegment)) return;

    this.segment = newSegment;

    this.crashlytics.logBusinessEvent('SEGMENT_CHANGED', {
      segment: this.segment,
      bookingVendor: this.bookingVendorID,
      deliveryVendor: this.deliveryVendorID
    });

    console.log('Segment changed to:', this.segment);

    await this.storage.updateUserDetails({
      activeSegment: this.segment,
    });
  }

  /* ================= TAB NAVIGATION ================= */

  switchTab(tab: 'home' | 'task' | 'account') {
    this.activeTab = tab;
    this.router.navigate([`/${tab}`]);
  }
}
