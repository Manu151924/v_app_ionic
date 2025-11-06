import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Color, ScaleType } from '@swimlane/ngx-charts';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pie-chart',
  standalone: true,
  imports: [CommonModule, NgxChartsModule],
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PieChartComponent {
  @Input() data: { name: string; value: number }[] = [];
  @Input() arcWidth = 0.5;
  @Input() view: [number, number] = [180, 180];
  @Input() labels = false;

  colorScheme: Color = {
    name: 'pieScheme',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#06B4A2', '#FF8A0D'],
  };
  labelFormatting = (label: string, value: number): string => {
  if (this.data && this.data.length > 0 && label === this.data[0].name) {
    return '30'; 
  }
  return ''; 
};

}
