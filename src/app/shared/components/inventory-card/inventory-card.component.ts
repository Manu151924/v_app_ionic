import {
  Component,
  Input,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { BarChartModule } from '@swimlane/ngx-charts';
import { Api } from '../../services/api';

interface Branch {
  branchId: number;
  branchName: string;
  branchCode: string;
}

interface RouteData {
  route: string;
  waybills: number;
  packages: number;
  weight: number;
  lyingHours: number;
  color: string;
}

@Component({
  selector: 'app-inventory-card',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    NgxSpinnerModule,
    BarChartModule
  ],
  templateUrl: './inventory-card.component.html',
  styleUrls: ['./inventory-card.component.scss']
})
export class InventoryCardComponent implements OnInit {

  @Input() deliveryVendorId!: number;

  token = localStorage.getItem('accessToken') ?? '';

  branches: Branch[] = [];
  selectedBranchId!: number;
  selectedBranchName = '';
  selectedBranchCode = '';

  routesData: RouteData[] = [];
  axisData: { name: string; value: number }[] = [];

  totals = {
    waybills: 0,
    packages: 0,
    weight: 0
  };

  constructor(
    private api: Api,
    private router: Router,
    private spinner: NgxSpinnerService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log(' VendorId received:', this.deliveryVendorId);
    this.loadBranches();
  }

  loadBranches(): void {
    this.spinner.show();

    this.api.getDeliveryBranchDetails(this.token).subscribe({
      next: res => {
        if (res?.responseStatus && res.responseObject?.length) {
          this.branches = res.responseObject;

          const first = this.branches[0];
          this.selectedBranchId = first.branchId;
          this.selectedBranchName = first.branchName;
          this.selectedBranchCode = first.branchCode;

          localStorage.setItem('deliveryBranchId', String(first.branchId));

          this.loadPanelOneCard();
        } else {
          this.spinner.hide();
        }
      },
      error: err => {
        this.spinner.hide();
        console.error('Branch API error', err);
      }
    });
  }

  onBranchChange(event: any): void {
    const branchId = event.detail.value;
    const branch = this.branches.find(b => b.branchId === branchId);
    if (!branch) return;

    this.selectedBranchId = branch.branchId;
    this.selectedBranchName = branch.branchName;
    this.selectedBranchCode = branch.branchCode;

    localStorage.setItem('deliveryBranchId', String(branch.branchId));

    this.loadPanelOneCard();
  }

  loadPanelOneCard(): void {
    if (!this.deliveryVendorId || !this.selectedBranchId) {
      this.spinner.hide();
      return;
    }

    this.spinner.show();

    this.api
      .getPanelOneDeliveryCount(
        this.deliveryVendorId,
        this.selectedBranchId,
        this.token
      )
      .subscribe({
        next: res => {
          this.spinner.hide();
          if (!res?.responseStatus) return;

          const obj = res.responseObject;

          this.totals = {
            waybills: obj.waybillCount ?? 0,
            packages: obj.totalPkgs ?? 0,
            weight: obj.totalWt ?? 0
          };

          const routes = obj.routes ?? [];

          this.routesData = routes
            .map((r: any) => ({
              route: r.rteCd,
              waybills: Number(r.inventoryCount) || 0,
              packages: r.totalPkgs ?? 0,
              weight: r.totalWt ?? 0,
              lyingHours: r.lyingHours ?? 0,
              color: r.inventoryCount > 100 ? '#ffb700' : '#22c55e'
            }))
            .sort((a: { waybills: number; }, b: { waybills: number; }) => b.waybills - a.waybills);
          this.axisData = this.routesData.map(r => ({
            name: r.route,
            value: r.waybills
          }));

          this.cdr.detectChanges();
        },
        error: err => {
          this.spinner.hide();
          console.error('PanelOne API error', err);
        }
      });
  }

  getBarWidth(r: RouteData): number {
    const max = Math.max(...this.routesData.map(x => x.waybills), 1);
    return (r.waybills / max) * 100;
  }

  handleRouteClick(r: RouteData): void {
    this.router.navigate(['/inventory-route-modal'], {
      queryParams: {
        rteCd: r.route,
        branchId: this.selectedBranchId,
        branchName: this.selectedBranchName
      }
    });
  }
}
