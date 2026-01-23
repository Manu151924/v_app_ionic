import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, SimpleChange, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  Chart,
  DoughnutController,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

let outsideLabel = {
  id: 'outsideLabel',
  afterDraw(chart: Chart) {
    const { ctx } = chart;
    const dataset = chart.data.datasets[0];
    const meta = chart.getDatasetMeta(0);

    if (!meta?.data?.length) return;

    ctx.save();

    meta.data.forEach((arc: any, index: number) => {
      const value = dataset.data[index] as number;
      if (!value) return;

      const arcColor = Array.isArray(dataset.backgroundColor)
        ? dataset.backgroundColor[index]
        : dataset.backgroundColor;

      if (arcColor === '#06B4A2') return;

      const angle = (arc.startAngle + arc.endAngle) / 2;
      const radius = arc.outerRadius;
      const cx = arc.x;
      const cy = arc.y;

      const x1 = cx + Math.cos(angle) * radius;
      const y1 = cy + Math.sin(angle) * radius;

      const x2 = cx + Math.cos(angle) * (radius + 10);
      const y2 = cy + Math.sin(angle) * (radius + 10);

      ctx.strokeStyle = arcColor as string;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      const isRight = x2 > cx;
      const textGap = 6;

      ctx.fillStyle = arcColor as string;
      ctx.font = '500 11px sans-serif';
      ctx.textAlign = isRight ? 'left' : 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        `${value}%`,
        isRight ? x2 + textGap : x2 - textGap,
        y2
      );
    });

    const centerArc: any = meta.data[0];
    const centerX = centerArc.x;
    const centerY = centerArc.y;

    const totalWaybill =
      (chart.options as any)?.plugins?.centerText?.value ?? '0';

    // BOOKED
    ctx.fillStyle = '#000000';
    ctx.font = '600 0.56em Roboto';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BOOKED', centerX, centerY - 10);

    // VALUE
    ctx.fillStyle = '#02834A';
    ctx.font = '700 1.1em Roboto';
    ctx.fillText(`${totalWaybill}`, centerX, centerY + 10);

    ctx.restore();
  }
};


Chart.register(
  DoughnutController,
  ArcElement,
  Tooltip,
  Legend,
);

@Component({
  selector: 'app-pie-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PieChartComponent implements AfterViewInit {

  @ViewChild('chartCanvas') canvas!: ElementRef<HTMLCanvasElement>;
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
      (this.chart.options.plugins as any).centerText.value = this.totalWaybill;
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
        responsive: false,
        maintainAspectRatio: true,

        layout: {
          padding: {
            left: 0,
            right: 55,
            top: 0,
            bottom: 0
          }
        },

        plugins: {
          legend: { display: false },
          centerText: {
            value: this.totalWaybill
          } as any
        }
      },
      plugins: [outsideLabel]
    });
  }
}
