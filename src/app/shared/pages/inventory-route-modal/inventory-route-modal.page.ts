import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from 'src/app/shared/services/api';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from "@ionic/angular";

@Component({
  selector: 'app-inventory-route-modal',
  templateUrl: './inventory-route-modal.page.html',
  styleUrls: ['./inventory-route-modal.page.scss'],
  standalone: true,
  imports: [IonicModule,CommonModule,FormsModule]
})
export class InventoryRouteModalPage implements OnInit {

  branch = '';
  routeName = '';
  branchId!: number;
  rteCd!: string; 
  totals = { waybills: 0, packages: 0, weight: 0 };
  less24 = { waybills: 0, packages: 0, weight: 0 };
  above24 = { waybills: 0, packages: 0, weight: 0 };

  constructor(
    private route: ActivatedRoute,
    private api: Api,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {}
ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.rteCd = params['rteCd'];                
      this.branchId = Number(params['branchId']); 
      this.branch = params['branchName'];
      this.routeName = this.rteCd;

      const vendorId = Number(localStorage.getItem('deliveryVendorId'));
      const token = localStorage.getItem('accessToken') ?? '';

      if (!this.branchId || !this.rteCd) {
        console.error('Invalid params', params);
        return;
      }

      this.loadInventoryDetails(vendorId, this.branchId, this.rteCd, token);
    });
  }
 loadInventoryDetails(
    vendorId: number,
    branchId: number,
    rteCd: string,
    token: string
  ) {
    this.api
      .getPanelOneInventoryDetails(vendorId, branchId, token, rteCd)
      .subscribe(res => {
        if (!res?.responseStatus) return;

        const data = res.responseObject || [];

        data.forEach((item: any) => {
          if (item.invAgeCategory === '<24') {
            this.less24 = {
              waybills: item.waybillCount,
              packages: item.totalAvlPkgs,
              weight: item.totalActWt
            };
          }

          if (item.invAgeCategory === '>=24') {
            this.above24 = {
              waybills: item.waybillCount,
              packages: item.totalAvlPkgs,
              weight: item.totalActWt
            };
          }
        });

        this.totals = {
          waybills: this.less24.waybills + this.above24.waybills,
          packages: this.less24.packages + this.above24.packages,
          weight: this.less24.weight + this.above24.weight
        };

        this.cdr.markForCheck();
      });
  }

  openAgeDetails(ageType: '<24' | '>=24') {
    this.router.navigate(['/inventory-age-details'], {
      queryParams: {
        propeliBrId: this.branchId, 
        rteCd: this.rteCd,
        ageType,
        backBranchId: this.branchId,
    backBranchName: this.branch,
    backRteCd: this.rteCd
      }
    });
  }




}
