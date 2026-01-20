import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, SimpleChange, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  Chart,
} from 'chart.js';

@Component({
  selector: 'app-pie-chart-delivery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pie-chart-delivery.component.html',
  styleUrls: ['./pie-chart-delivery.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PieChartDeliveryComponent implements AfterViewInit {

  @ViewChild('chartCanvasdelivery') canvas!: ElementRef<HTMLCanvasElement>;
  @Input() data: any = [];
  @Input() totalWaybillAndWeight: any = [];
  @Input() tab: string = '';
  @Input() totalWaybill: number = 0;
  label: any[] = [];
  labelValues: any[] = []
  chart!: Chart;
  arcWidth = 0.4;

  ngAfterViewInit() {
    setTimeout(() => {
      this.data.forEach((d: { name: 'string', value: 'number' }) => {
        this.label.push(d.name);
        this.labelValues.push(d.value)
      });
      this.createChart()
    }, 2000);
  }

  ngOnChanges(changes: SimpleChange) {
    if (this.chart) {
      this.labelValues = []
      console.log('data',this.data);
      console.log('datasdsad',this.tab);
      
      this.data.forEach((d: { name: string, value: number }) => {
        this.labelValues.push(d.value)
      });

      this.chart.data.datasets[0].data = this.labelValues;
      this.chart.data.datasets[0].backgroundColor = this.data[0]?.name === 'no-data' ? ['#9f9f9f'] : ['#FF8A0D', '#06B4A2'];
      this.chart.update();
    }
  }

  createChart() {
    this.chart = new Chart(this.canvas?.nativeElement, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: this.labelValues,
          backgroundColor: this.data[0]?.name === 'no-data' ? ['#9f9f9f'] : ['#FF8A0D', '#06B4A2'],
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,

        layout: {
          padding: {
            left: 0,
            right: 50,
            top: 0,
            bottom: 0
          }
        },
      },
    });
  }
}
