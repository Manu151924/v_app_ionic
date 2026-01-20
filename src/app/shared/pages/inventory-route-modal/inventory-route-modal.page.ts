import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import {
  NgxSpinnerService,
  NgxSpinnerComponent,
  NgxSpinnerModule,
} from 'ngx-spinner';

import { Api } from 'src/app/shared/services/api';
import { Auth } from 'src/app/shared/services/auth';
import { Crashlytics } from 'src/app/shared/services/crashlytics';

@Component({
  selector: 'app-inventory-route-modal',
  templateUrl: './inventory-route-modal.page.html',
  styleUrls: ['./inventory-route-modal.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    NgxSpinnerModule,
    NgxSpinnerComponent,
  ],
})
export class InventoryRouteModalPage implements OnInit {
  /* ---------------- Route Data ---------------- */
  branch = '';
  routeName = '';
  branchId!: number;
  rteCd!: string;
  vendorId!: number;

  /* ---------------- Summary ---------------- */
  totals = { waybills: 0, packages: 0, weight: 0 };
  less24 = { waybills: 0, packages: 0, weight: 0 };
  above24 = { waybills: 0, packages: 0, weight: 0 };

  /* ---------------- Injected ---------------- */
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(Api);
  private auth = inject(Auth);
  private spinner = inject(NgxSpinnerService);

  private cdr = inject(ChangeDetectorRef);
  private crashlytics = inject(Crashlytics);

  /* ---------------- Lifecycle ---------------- */

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.rteCd = params['rteCd']?.trim();
      this.branchId = Number(params['branchId']);
      this.branch = params['branchName'] || '';
      this.vendorId = Number(params['vendorId']);

      this.routeName = this.rteCd;

      if (!this.rteCd || !this.branchId || !this.vendorId) {
        console.error('Invalid params', params);

        this.crashlytics.recordNonFatal(
          'Invalid route modal params',
          'ROUTE_MODAL_INVALID_PARAMS',
          [
            { key: 'rteCd', value: String(params['rteCd']), type: 'string' },
            {
              key: 'branchId',
              value: String(params['branchId']),
              type: 'string',
            },
            {
              key: 'vendorId',
              value: String(params['vendorId']),
              type: 'string',
            },
          ],
        );
        return;
      }

      this.loadInventoryDetails();
    });
    // this.crashlytics.logBusinessEvent('ROUTE_INVENTORY_OPEN', {
    //   vendor: this.vendorId,
    //   branch: this.branchId,
    //   route: this.rteCd,
    // });
  }
  isLoading = false;

  /* ---------------- API ---------------- */

  private async loadInventoryDetails(): Promise<void> {
    const token = await this.auth.getAccessToken();
    if (!token) return;

    this.isLoading = true;
    this.spinner.show();

    this.api
      .getPanelOneInventoryDetails(
        this.vendorId,
        this.branchId,
        this.rteCd,
        token,
      )
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          this.spinner.hide();

          if (!res?.responseStatus) return;

          const data = res.responseObject ?? [];

          data.forEach((item: any) => {
            if (item.invAgeCategory === '<24') {
              this.less24 = {
                waybills: item.waybillCount ?? 0,
                packages: item.totalAvlPkgs ?? 0,
                weight: item.totalActWt ?? 0,
              };
            }

            if (item.invAgeCategory === '>=24') {
              this.above24 = {
                waybills: item.waybillCount ?? 0,
                packages: item.totalAvlPkgs ?? 0,
                weight: item.totalActWt ?? 0,
              };
            }
          });

          this.totals = {
            waybills: this.less24.waybills + this.above24.waybills,
            packages: this.less24.packages + this.above24.packages,
            weight: this.less24.weight + this.above24.weight,
          };

          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isLoading = false;
          this.spinner.hide();
          this.crashlytics.recordNonFatal(err, 'ROUTE_INVENTORY_API_FAILED');
        },
      });
  }

  /* ---------------- Navigation ---------------- */

  openAgeDetails(ageType: '<24' | '>=24'): void {
    // this.crashlytics.logBusinessEvent('ROUTE_INVENTORY_AGE_OPEN', {
    //   vendor: this.vendorId,
    //   branch: this.branchId,
    //   route: this.rteCd,
    //   age: ageType,
    // });

    this.router.navigate(['/inventory-age-details'], {
      queryParams: {
        ageType,
        vendorId: this.vendorId,
        propeliBrId: this.branchId,
        rteCd: this.rteCd,
        backBranchId: this.branchId,
        backBranchName: this.branch,
        backRteCd: this.rteCd,
      },
    });
  }
}
