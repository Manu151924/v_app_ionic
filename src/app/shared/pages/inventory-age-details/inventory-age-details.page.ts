import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from 'src/app/shared/services/api';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBack, locationOutline } from 'ionicons/icons';
import { NgxSpinnerService, NgxSpinnerComponent, NgxSpinnerModule } from 'ngx-spinner';


@Component({
  selector: 'app-inventory-age-details',
  templateUrl: './inventory-age-details.page.html',
  styleUrls: ['./inventory-age-details.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule,NgxSpinnerComponent, NgxSpinnerModule]
})
export class InventoryAgeDetailsPage implements OnInit {

  ageType!: '<24' | '>=24';
  propeliBrId!: number;   
  rteCd!: string;      
  token!: any;
  vendorId!: any ;
  backBranchId!: number;
backBranchName!: string;
backRteCd!: string;

  branch = '';
  location = '';

  summary = {
    waybills: 0,
    packages: 0,
    weight: 0
  };

  waybillList: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private api: Api,
    private router: Router,
    private spinner: NgxSpinnerService
  ) {addIcons({locationOutline,arrowBack})}

ngOnInit() {
  this.route.queryParams.subscribe(params => {
    this.ageType = params['ageType'];
    this.propeliBrId = Number(params['propeliBrId']);
    this.rteCd = params['rteCd'];
    this.backBranchId = Number(params['backBranchId']);
    this.backBranchName = params['backBranchName'];
    this.backRteCd = params['backRteCd'];

    this.token = localStorage.getItem('accessToken') ?? '';
    this.vendorId = localStorage.getItem('deliveryVendorId');

    if (!this.propeliBrId || !this.rteCd || !this.ageType) {
      console.error('Invalid route params', params);
      return;
    }

    this.loadInventoryDetails();
  });
}

goBack() {
  this.router.navigate(['/inventory-route-modal'], {
    queryParams: {
      branchId: this.backBranchId,
      branchName: this.backBranchName,
      rteCd: this.backRteCd
    }
  });
}

loadInventoryDetails() {
    this.spinner.show('inventorySpinner');

    this.api
      .getPanelOneIntrenalDetails(
        this.propeliBrId,
        this.rteCd,
        this.vendorId,
        this.token   
      )
      .subscribe({
        next: (res: any) => {
          if (res?.responseStatus && Array.isArray(res.responseObject)) {
            this.processData(res.responseObject);
          }
          this.spinner.hide('inventorySpinner');
        },
        error: err => {
          console.error('Inventory API failed', err);
          this.spinner.hide('inventorySpinner');
        }
      });
  }

  private processData(apiList: any[]) {
    const filtered = apiList.filter(item =>
      this.ageType === '<24'
        ? item.invAge < 24
        : item.invAge >= 24
    );

    this.waybillList = filtered.map(item => ({
      waybillNo: item.wayblNo,
      packages: item.avlPkgs,
      weight: item.actWt,
      arrivedOn: this.formatDate(item.arrivedOn),
      invAge: `${item.invAge} Day${item.invAge > 1 ? 's' : ''}`,
      consignee: item.cneeName,
      toPay: item.wbDlvChgdAmtOut,
      vas: item.vasValue ? item.vasValue.split(',') : []
    }));

    this.summary = {
      waybills: this.waybillList.length,
      packages: this.waybillList.reduce((s, i) => s + i.packages, 0),
      weight: this.waybillList.reduce((s, i) => s + i.weight, 0)
    };
  }

  private formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}
