
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonCardContent, IonBadge, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronDown } from 'ionicons/icons';

interface StatusItem {
  label: string;
  value: number;
  color: string;
  percentage: number;
}

@Component({
  selector: 'app-status-card',
  templateUrl: './status-card.component.html',
  styleUrls: ['./status-card.component.scss'],
  standalone: true,
  imports: [CommonModule, IonCard, IonCardContent, IonBadge, IonIcon],
})
export class StatusCardComponent {
  @Input() location: string = 'DELHI-11';
  @Input() assignedSfx: number = 20;
  @Input() statusItems: StatusItem[] = [
    { label: 'ZERO PICKUP SFX', value: 4, color: '#ef4444', percentage: 20 },
    { label: 'NOT MANIFESTED', value: 120, color: '#f97316', percentage: 100 },
    { label: 'CANT MANIFEST', value: 0, color: '#fbbf24', percentage: 0 },
  ];

  constructor() {
    addIcons({ chevronDown });
  }

  getProgressWidth(percentage: number): string {
    return `${percentage}%`;
  }
}