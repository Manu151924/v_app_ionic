import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonIcon } from "@ionic/angular/standalone";
import { addIcons } from 'ionicons';
import { checkboxOutline, location } from 'ionicons/icons';
import { TripVehicle } from '../../services/delivery';

@Component({
  selector: 'app-trip-status-table',
  templateUrl: './trip-status-table.component.html',
  styleUrls: ['./trip-status-table.component.scss'],
  imports:[IonIcon, FormsModule, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush

})
export class TripStatusTableComponent  implements OnInit {

  constructor() {
    addIcons({checkboxOutline,location})
  }

  ngOnInit() {}

  @Input() vehicles: TripVehicle[] = [];
  @Input() total = 0;

  trackByVeh(index: number, item: TripVehicle) {
    return item.vehNo;
  }

}
