import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, SimpleChange, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  Chart,
} from 'chart.js';

const middleText = {
  id: 'middleText',
  afterDraw(chart: Chart) {
    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);
    if (!meta?.data?.length) return;

    const arc: any = meta.data[0];
    const centerX = arc.x;
    const centerY = arc.y;

    const totalWaybill =
      (chart.options as any)?.plugins?.centerText?.value ?? 0;

    ctx.save();

    ctx.fillStyle = '#000000';
    ctx.font = '600 0.56em Roboto';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Total', centerX, centerY - 12);

    ctx.fillStyle = '#02834A';
    ctx.font = '700 1em Roboto';
    ctx.fillText(`${totalWaybill}`, centerX, centerY + 10);

    ctx.restore();
  }
};

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
      this.data.forEach((d: { name: string, value: number }) => {
        this.labelValues.push(d.value)
      });

      this.chart.data.datasets[0].data = this.labelValues;
      this.chart.data.datasets[0].backgroundColor = this.data[0]?.name === 'no-data' ? ['#9f9f9f'] : ['#FF8A0D', '#06B4A2'];
      (this.chart.options.plugins as any).centerText.value = this.totalWaybill;
      this.chart.update();
    }
  }

  createChart() {
  this.chart = new Chart(this.canvas.nativeElement, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: this.labelValues,
        backgroundColor:
          this.data[0]?.name === 'no-data'
            ? ['#9f9f9f']
            : ['#FF8A0D', '#06B4A2'],
        borderWidth: 0,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: { enabled: false },
        legend: { display: false },
        centerText: {
          value: this.totalWaybill
        } as any
      },
      layout: {
        padding: {
          right: 50
        }
      }
    },
    plugins: [middleText]
  });
}

}
