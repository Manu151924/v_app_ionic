import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-inventory-card',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  templateUrl: './inventory-card.component.html',
  styleUrls: ['./inventory-card.component.scss'],
})
export class InventoryCardComponent implements OnInit {
  selectedBranch = 'DELHI-11';
  branches = ['DELHI-11', 'DELHI-12', 'DELHI-13'];

  mockData: Record<string, any[]> = {
    'DELHI-11': [
      { route: 'DWARKA', waybills: 120, packages: 240, weight: 2.4, lyingHours: 12 },
      { route: 'KAROLBAGH', waybills: 79, packages: 190, weight: 1.9, lyingHours: 30 },
      { route: 'UTTAMNAGAR', waybills: 16, packages: 60, weight: 0.9, lyingHours: 10 },
      { route: 'MAHIPALPUR', waybills: 11, packages: 45, weight: 0.6, lyingHours: 28 },
      { route: 'VASANTKUNJ', waybills: 9, packages: 40, weight: 0.5, lyingHours: 8 },
    ],
    'DELHI-12': [
      { route: 'ASHOK VIHAR', waybills: 95, packages: 260, weight: 2.8, lyingHours: 18 },
      { route: 'JANAKPURI', waybills: 33, packages: 100, weight: 1.2, lyingHours: 42 },
      { route: 'PATEL NAGAR', waybills: 44, packages: 120, weight: 1.6, lyingHours: 20 },
    ],
    'DELHI-13': [
      { route: 'OKHLA', waybills: 130, packages: 400, weight: 3.6, lyingHours: 14 },
      { route: 'SAKET', waybills: 78, packages: 190, weight: 2.1, lyingHours: 29 },
      { route: 'MEHRAULI', waybills: 65, packages: 170, weight: 1.9, lyingHours: 10 },
    ],
  };

  routesData: any[] = [];
  total = { waybills: 0, packages: 0, weight: 0 };

  ngOnInit() {
    this.loadBranchData();
  }

  loadBranchData() {
    const data = this.mockData[this.selectedBranch] || [];
    this.routesData = data.map((r) => ({
      ...r,
      color: r.lyingHours <= 24 ? '#36b37e' : '#f9b233',
    }));

    this.total = {
      waybills: data.reduce((a, b) => a + b.waybills, 0),
      packages: data.reduce((a, b) => a + b.packages, 0),
      weight: data.reduce((a, b) => a + b.weight, 0),
    };
  }

  onBranchChange() {
    this.loadBranchData();
  }
}
