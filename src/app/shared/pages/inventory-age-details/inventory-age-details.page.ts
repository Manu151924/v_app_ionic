import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { WaybillFormatPipe } from '../../utilities/waybill-format-pipe';
import {
  chevronBackOutline,
  locationOutline,
  locationSharp,
} from 'ionicons/icons';
import {
  NgxSpinnerService,
  NgxSpinnerModule,
} from 'ngx-spinner';

import { Api } from 'src/app/shared/services/api';
import { Auth } from 'src/app/shared/services/auth';
import { FooterComponent } from "../../components/footer/footer.component";

@Component({
  selector: 'app-inventory-age-details',
  templateUrl: './inventory-age-details.page.html',
  styleUrls: ['./inventory-age-details.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NgxSpinnerModule,
    WaybillFormatPipe,
    FooterComponent
],
})
export class InventoryAgeDetailsPage implements OnInit {
  /* ---------------- Route Params ---------------- */
  ageType!: '<24' | '>=24';
  propeliBrId!: number;
  rteCd!: string;
  vendorId!: number;

  backVendorId!: number;

  backBranchId!: number;
  backBranchName!: string;
  backRteCd!: string;
  totalWaybills!: number;
  totalPackages!: number;
  totalWeight!: number;

  /* ---------------- UI State ---------------- */
  branch = '';
  location = '';

  summary = {
    waybills: 0,
    packages: 0,
    weight: 0,
  };

  waybillList: any[] = [];

  /* ---------------- Injected ---------------- */
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(Api);
  private auth = inject(Auth);
  private spinner = inject(NgxSpinnerService);
  private navCtrl = inject(NavController);

  constructor() {
    addIcons({ locationOutline, chevronBackOutline, locationSharp });
  }

  /* ---------------- Lifecycle ---------------- */

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.ageType = params['ageType'];
      this.propeliBrId = Number(params['propeliBrId']);
      this.rteCd = params['rteCd'];
      this.vendorId = Number(params['vendorId']);
      this.backVendorId = this.vendorId;

      this.backBranchId = Number(params['backBranchId']);
      this.backBranchName = params['backBranchName'];
      this.backRteCd = params['backRteCd'];
      this.totalWaybills = Number(params['totalWaybills']);
      this.totalPackages = Number(params['totalPackages']);
      this.totalWeight = Number(params['totalWeight']);

      if (!this.ageType || !this.propeliBrId || !this.rteCd || !this.vendorId) {
        console.error('Invalid route params', params);
        return;
      }

      this.loadInventoryDetails();
    });
  }
  

  /* ---------------- Navigation ---------------- */

  goBack() {
    this.navCtrl.navigateBack(['/inventory-route-modal'], {
      queryParams: {
        branchId: this.backBranchId,
        branchName: this.backBranchName,
        rteCd: this.backRteCd,
        vendorId: this.backVendorId,
      },
    });
  }

  /* ---------------- API ---------------- */

  private async loadInventoryDetails() {
    this.spinner.show();

    const token = await this.auth.getAccessToken();
    if (!token) {
      this.spinner.hide('inventorySpinner');
      return;
    }

    this.api
      .getPanelOneIntrenalDetails(
        this.propeliBrId,
        this.rteCd,
        this.vendorId,
        token,
      )
      .subscribe({
        next: (res: any) => {
          if (res?.responseStatus && Array.isArray(res.responseObject)) {
            this.processData(res.responseObject);
          }
          this.spinner.hide();
        },
        error: (err) => {
          console.error('Inventory API failed', err);
          this.spinner.hide('inventorySpinner');
        },
      });
  }

  /* ---------------- Data Processing ---------------- */

private processData(apiList: any[]) {
  if (!Array.isArray(apiList)) return;
  const filtered = apiList
    .filter((item) => {
      const hours = Number(item.invAge || 0);

      return this.ageType === '<24'
        ? hours < 24
        : hours >= 24;
    })
    .sort((a, b) => Number(b.invAge) - Number(a.invAge));

  this.waybillList = filtered.map((item) => {
    const hours = Number(item.invAge || 0);
    const days = Math.floor(hours / 24);

    return {
      waybillNo: item.wayblNo,
      packages: Number(item.avlPkgs || 0),
      weight: Number(item.actWt || 0),
      arrivedOn: this.formatDate(item.arrivedOn),
      invAge: this.formatDays(days),

      consignee: item.cneeName,
      toPay: item.wbDlvChgdAmtOut,
      vas: item.vasValue,
    };
  });
  let totalPackages = 0;
  let totalKg = 0;

  filtered.forEach((item) => {
    totalPackages += Number(item.avlPkgs || 0);
    totalKg += Number(item.actWt || 0);
  });

  this.summary = {
    waybills: filtered.length,
    packages: totalPackages,
    weight: Math.round((totalKg / 1000) * 1000) / 1000,
  };

  // ✅ DEBUG (will match exactly now)
  const green = apiList.filter(i => Number(i.invAge) < 24).length;
  const amber = apiList.filter(i => Number(i.invAge) >= 24).length;

  console.log('GREEN (<24):', green);
  console.log('AMBER (>=24):', amber);
}
  private formatDays(age: number): string {
    return `${age} ${age === 1 ? 'Day' : 'Days'}`;
  }
  private calculateInvAge(arrivedOn: string): number {
    if (!arrivedOn) return 0;

    const arrived = new Date(arrivedOn).getTime();
    const now = Date.now();

    const diffMs = now - arrived;

    // Prevent negative values
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return Math.max(0, days);
  }
  private formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const [datePart] = dateStr.split('T');
    const [year, month, day] = datePart.split('-');
    const monthName = new Date(`${year}-${month}-01`)
      .toLocaleString('en-GB', { month: 'short' })
      .toUpperCase();
    return `${day}-${monthName}-${year}`;
  }
  private calculateHours(arrivedOn: string): number {
    if (!arrivedOn) return 0;

    const arrived = new Date(arrivedOn).getTime();
    const now = Date.now();

    const diffMs = now - arrived;

    // convert to hours
    return diffMs / (1000 * 60 * 60);
  }
}