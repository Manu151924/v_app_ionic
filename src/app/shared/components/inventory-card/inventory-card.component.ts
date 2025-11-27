import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';

interface RouteData {
  route: string;
  waybills: number;
  packages: number;
  weight: number;
  lyingHours: number;
}

@Component({
  selector: 'app-inventory-card',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  templateUrl: 'inventory-card.component.html', 
  styleUrls: [ 'inventory-card.component.scss'],
})
export class InventoryCardComponent implements OnInit {
  selectedBranch = 'DELHI-11';
  branches = ['DELHI-11', 'DELHI-12', 'DELHI-13'];
  
  routesData: (RouteData & { color: string })[] = [];
  totals = { waybills: 0, packages: 0, weight: 0 };
  maxWaybills = 0;

  private mockData: Record<string, RouteData[]> = {
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

  ngOnInit() {
    this.loadBranchData();
  }

  loadBranchData(): void {
    const data = this.mockData[this.selectedBranch] || [];
    
    this.maxWaybills = Math.max(...data.map(r => r.waybills), 0);
    
    this.routesData = data.map((r) => ({
      ...r,
      color: r.lyingHours > 24 ? '#ffb700' : '#22c55e', // yellow-500 : green-500
    })).sort((a,b) => b.waybills - a.waybills);

    this.totals = {
      waybills: data.reduce((sum, item) => sum + item.waybills, 0),
      packages: data.reduce((sum, item) => sum + item.packages, 0),
      weight: data.reduce((sum, item) => sum + item.weight, 0),
    };
  }

  onBranchChange(): void {
    this.loadBranchData();
  }

  handleRouteClick(routeData: RouteData): void {
    console.log('Clicked Route:', routeData);
    // In a real app, you might open a modal or navigate to a details page here.
  }
}
