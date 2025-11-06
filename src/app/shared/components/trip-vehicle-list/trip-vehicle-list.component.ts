import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonList, IonItem, IonNote, IonLabel } from "@ionic/angular/standalone";
import { TripVehicle } from '../../services/delivery';

@Component({
  selector: 'app-trip-vehicle-list',
  templateUrl: './trip-vehicle-list.component.html',
  styleUrls: ['./trip-vehicle-list.component.scss'],
  imports :[IonList,IonItem, IonNote, IonLabel,CommonModule,FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TripVehicleListComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}
  @Input() vehicles: TripVehicle[] = [];

}
