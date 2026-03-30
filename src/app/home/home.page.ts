import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonToolbar,
  IonBadge,
  IonContent,
  IonHeader,
  IonFooter,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/angular/standalone';
import { IonicModule } from '@ionic/angular';

import { Router, RouterModule } from '@angular/router';

import { BookingPage } from '../pages/booking/booking.page';
import { DeliveryPage } from '../pages/delivery/delivery.page';
import { AppStorageService } from '../shared/services/app-storage';
import { Crashlytics } from '../shared/services/crashlytics';
import { environment } from 'src/environments/environment';
import { FooterComponent } from '../shared/components/footer/footer.component';
import { StatusBarService } from '../shared/services/status-bar';
import { Api } from '../shared/services/api';

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
    FooterComponent,
    IonRefresher,
    IonRefresherContent,
    IonFooter
],
})
export class HomePage implements OnInit {
  private storage = inject(AppStorageService);
  private router = inject(Router);
  private crashlytics = inject(Crashlytics);
  private apiService = inject(Api);
  private statusBar = inject(StatusBarService);

  segment: 'booking' | 'delivery' | 'network' = 'booking';

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
    await this.refreshVendorContext();
  }

  /* ================= USER + VENDOR CONTEXT ================= */

  private async loadUserContext() {
    const user = await this.storage.getUserDetails();

    if (!user) {
      console.warn('No user found in storage');
      this.crashlytics.recordNonFatal(
        'User not found in storage',
        'HOME_CONTEXT_MISSING',
      );
      return;
    }
    const rawVendorTypes = user.vendorType as
      | string
      | string[]
      | null
      | undefined;

    const vendorTypes: string[] = Array.isArray(rawVendorTypes)
      ? rawVendorTypes
      : typeof rawVendorTypes === 'string'
        ? rawVendorTypes.split(',').map((v: string) => v.trim())
        : [];

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
        'INVALID_VENDOR_MAPPING',
      );
    }

    // Restore last segment
    const lastSegment = user.activeSegment as
      | 'booking'
      | 'delivery'
      | undefined;

    if (lastSegment && !this.isSegmentDisabled(lastSegment)) {
      this.segment = lastSegment;
    } else {
      if (
        vendorTypes.includes('DELIVERY') &&
        !vendorTypes.includes('BOOKING')
      ) {
        this.segment = 'delivery';
      } else {
        this.segment = 'booking';
      }
    }

    // Send vendor context to Crashlytics
    this.crashlytics.setUserContext({
      userId: String(this.bookingVendorID || this.deliveryVendorID || ''),
      role: vendorTypes.join(','),
      appVersion: environment.version,
    });

    // this.crashlytics.logBusinessEvent('VENDOR_CONTEXT', {
    //   bookingVendorId: this.bookingVendorID,
    //   deliveryVendorId: this.deliveryVendorID,
    //   activeSegment: this.segment
    // });

    console.log('Active Segment:', this.segment);
  }

  private async refreshVendorContext() {
    try {
      const token = await this.storage.getAccessToken();
      if (!token) return;

      const res = await this.apiService.getBranchDetails(token).toPromise();

      if (res?.responseObject?.length) {
        await this.storage.updateUserDetails({
          vendorType: res.responseObject.map((x: any) => x.vedorType),
          bookingVendorId:
            res.responseObject.find(
              (x: { vedorType: string }) => x.vedorType === 'BOOKING',
            )?.vendorId || null,
          deliveryVendorId:
            res.responseObject.find(
              (x: { vedorType: string }) => x.vedorType === 'DELIVERY',
            )?.vendorId || null,
        });
      }
    } catch (e) {
      console.error('Vendor refresh failed', e);
    }
  }

  private isSegmentDisabled(seg: 'booking' | 'delivery'): boolean {
    return (
      (seg === 'booking' && this.disableBooking) ||
      (seg === 'delivery' && this.disableDelivery)
    );
  }
  /* ================= SEGMENT CHANGE ================= */

  async onSegmentChange(event: any) {
    const newSegment = event?.detail?.value;

    if (!newSegment || this.isSegmentDisabled(newSegment)) return;

    this.segment = newSegment;

    this.crashlytics.logBusinessEvent('SEGMENT_CHANGED', {
      segment: this.segment,
      bookingVendor: this.bookingVendorID,
      deliveryVendor: this.deliveryVendorID,
    });

    console.log('Segment changed to:', this.segment);

    await this.storage.updateUserDetails({
      activeSegment: this.segment,
    });
  }
  async handleRefresh(event: any) {
    setTimeout(async () => {
      try {
        if (this.segment === 'booking' && this.bookingCmp) {
          await this.bookingCmp.refreshData();
        }

        if (this.segment === 'delivery' && this.deliveryCmp) {
          await this.deliveryCmp.doRefresh();
        }
      } catch (err) {
        console.error('Refresh failed', err);
      } finally {
        event.target.complete();
      }
    }, 2000); // 3 seconds delay
  }

  /* ================= TAB NAVIGATION ================= */

  switchTab(tab: 'home' | 'task' | 'account') {
    this.activeTab = tab;
    this.router.navigate([`/${tab}`]);
  }
}
