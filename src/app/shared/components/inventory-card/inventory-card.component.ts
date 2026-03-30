import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
  inject,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { ToastController } from '@ionic/angular';
import { BarChartModule } from '@swimlane/ngx-charts';

import { Api } from '../../services/api';
import { Auth } from '../../services/auth';
import { addIcons } from 'ionicons';
import { Crashlytics } from '../../services/crashlytics';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatFormFieldModule} from '@angular/material/form-field';
import { location, locationOutline } from 'ionicons/icons';

/* ---------------- Interfaces ---------------- */

interface Branch {
  branchId: number;
  branchName: string;
  branchCode: string;
  vendorId: number;
  vedorType: string;
}

interface RouteData {
  rteCd: string;
  route: string;
  waybills: number;
  packages: number;
  weight: number;
  lyingHours: number;
  isGt24HourInventoryDominant: boolean;
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
    BarChartModule,
        MatSelectModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './inventory-card.component.html',
  styleUrls: ['./inventory-card.component.scss'],
})
export class InventoryCardComponent implements OnInit, OnChanges {
  @Input({ required: true }) deliveryVendorId!: number;
  @Output() branchChanged = new EventEmitter<number>();

  private api = inject(Api);
  private auth = inject(Auth);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private toastCtrl = inject(ToastController);
  private crashlytics = inject(Crashlytics);

  branches: Branch[] = [];
  selectedBranchId!: number;
  selectedBranchName = '';
  selectedBranchCode = '';

  routesData: RouteData[] = [];

  totals = {
    waybills: 0,
    packages: 0,
    weight: 0,
  };
  constructor() {
    addIcons({ location });
  }

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['deliveryVendorId'] && this.deliveryVendorId) {
      this.loadBranches();
    }
  }

  async doRefresh(event: any) {
    await this.loadPanelOneCard();
    event.target.complete();
  }
    public async refreshData(): Promise<void> {
    await this.loadPanelOneCard(); 
  }

  /* ---------------- Load Branches ---------------- */

  async loadBranches() {
    // this.spinner.show();
    const token = await this.auth.getAccessToken();

    this.api.getDeliveryBranchDetails(this.deliveryVendorId, token!).subscribe({
      next: (res) => {
        // this.spinner.hide();

        this.branches = res.responseObject.filter(
          (b: any) =>
            b.vedorType === 'DELIVERY' && b.vendorId === this.deliveryVendorId,
        );

        if (!this.branches.length) return;

        const first = this.branches[0];
        this.selectedBranchId = first.branchId;
        this.selectedBranchName = first.branchName;

        this.branchChanged.emit(this.selectedBranchId);
        this.loadPanelOneCard();
      },
      error: (err) => {
        // this.spinner.hide();
        this.crashlytics.recordNonFatal(err, 'DELIVERY_BRANCH_API_FAILED');
      },
    });
  }

  onBranchChange(e: any) {
    const branchId = e.detail.value;

    this.selectedBranchId = branchId;

    const selectedBranch = this.branches.find((b) => b.branchId === branchId);

    this.selectedBranchName = selectedBranch?.branchName ?? '';

    this.branchChanged.emit(this.selectedBranchId);
    this.loadPanelOneCard();
  }

  /* ---------------- Main API ---------------- */

  private async loadPanelOneCard(): Promise<void> {
    if (!this.deliveryVendorId || !this.selectedBranchId) return;

    // this.spinner.show();
    const token = await this.auth.getAccessToken();

    if (!token) {
      // this.spinner.hide();
      return;
    }

    this.api
      .getPanelOneDeliveryCount(
        this.deliveryVendorId,
        this.selectedBranchId,
        token,
      )
      .subscribe({
        next: (res) => {
          // this.spinner.hide();
          if (!res?.responseStatus || !res.responseObject) return;

          const obj = res.responseObject;

          /* ---------- Totals ---------- */
          this.totals = {
            waybills: obj.waybillCount ?? 0,
            packages: obj.totalPkgs ?? 0,
            weight: obj.totalWt ?? 0,
          };

          /* ---------- Routes ---------- */
          const routes = obj.routes ?? [];

          this.routesData = routes
            .map((r: any) => {
              const count = Number(r.inventoryCount) || 0;

              let color = '#13C15B';

              if (count === 0) {
                color = '#999999';
              } else if (count >= 75) {
                color = '#B00020';
              } else if (count > 50) {
                color = '#FFBC00';
              }

              return {
                rteCd: r.rteCd,
                route: r.rteCd,
                waybills: count,
                packages: r.totalPkgs ?? 0,
                weight: r.totalWt ?? 0,
                lyingHours: r.lyingHours ?? 0,
                isGt24HourInventoryDominant:
                  r.isGt24HourInventoryDominant === true,
                color,
              };
            })
            .sort(
              (a: { waybills: number }, b: { waybills: number }) =>
                b.waybills - a.waybills,
            );

          this.cdr.detectChanges();
        },
        error: (err) => {
          // this.spinner.hide();
          this.crashlytics.recordNonFatal(err, 'DELIVERY_PANEL1_FAILED');
        },
      });
  }
  isOverflow(element: HTMLElement): boolean {
    return element.scrollWidth > element.clientWidth;
  }

  /* ---------------- Click ---------------- */

  handleRouteClick(r: RouteData): void {
    this.router.navigate(['/inventory-route-modal'], {
      queryParams: {
        rteCd: r.route,
        branchId: this.selectedBranchId,
        branchName: this.selectedBranchName,
        vendorId: this.deliveryVendorId,
      },
    });
  }
  tooltipVisible = false;
  tooltipText = '';
  tooltipStyle: any = {};
  showTooltipIfOverflow(event: Event, value: any) {
    const target = event.target as HTMLElement;
    const rect = target.getBoundingClientRect();

    this.tooltipText = value.toString();

    this.tooltipStyle = {
      top: rect.top + target.offsetHeight + 'px',
      left: rect.left + rect.width / 2 + 'px',
    };

    this.tooltipVisible = true;

    setTimeout(() => (this.tooltipVisible = false), 2000);
  }
}
