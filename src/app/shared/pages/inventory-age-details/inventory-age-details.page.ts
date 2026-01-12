import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBack, locationOutline } from 'ionicons/icons';
import {
  NgxSpinnerService,
  NgxSpinnerComponent,
  NgxSpinnerModule,
} from 'ngx-spinner';

import { Api } from 'src/app/shared/services/api';
import { Auth } from 'src/app/shared/services/auth';

@Component({
  selector: 'app-inventory-age-details',
  templateUrl: './inventory-age-details.page.html',
  styleUrls: ['./inventory-age-details.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NgxSpinnerComponent,
    NgxSpinnerModule,
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

  constructor() {
    addIcons({ locationOutline, arrowBack });
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

      if (!this.ageType || !this.propeliBrId || !this.rteCd || !this.vendorId) {
        console.error('Invalid route params', params);
        return;
      }

      this.loadInventoryDetails();
    });
  }

  /* ---------------- Navigation ---------------- */

  goBack() {
    this.router.navigate(['/inventory-route-modal'], {
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
    this.spinner.show('inventorySpinner');

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
        token
      )
      .subscribe({
        next: (res: any) => {
          if (res?.responseStatus && Array.isArray(res.responseObject)) {
            this.processData(res.responseObject);
          }
          this.spinner.hide('inventorySpinner');
        },
        error: (err) => {
          console.error('Inventory API failed', err);
          this.spinner.hide('inventorySpinner');
        },
      });
  }

  /* ---------------- Data Processing ---------------- */

  private processData(apiList: any[]) {
    const filtered = apiList.filter((item) =>
      this.ageType === '<24' ? item.invAge < 24 : item.invAge >= 24
    );

    this.waybillList = filtered.map((item) => ({
      waybillNo: item.wayblNo,
      packages: item.avlPkgs,
      weight: item.actWt,
      arrivedOn: this.formatDate(item.arrivedOn),
      invAge: `${item.invAge} Day${item.invAge > 1 ? 's' : ''}`,
      consignee: item.cneeName,
      toPay: item.wbDlvChgdAmtOut,
      vas: item.vasValue ? item.vasValue.split(',') : [],
    }));

    this.summary = {
      waybills: this.waybillList.length,
      packages: this.waybillList.reduce((s, i) => s + i.packages, 0),
      weight: this.waybillList.reduce((s, i) => s + i.weight, 0),
    };
  }

  private formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}
