import { Chart } from 'chart.js';

export const outsideLabel = {
  id: 'outsideLabel',
  afterDraw(chart: Chart) {
    const { ctx } = chart;
    const dataset = chart.data.datasets[0];
    const meta = chart.getDatasetMeta(0);

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

    ctx.restore();
  }
};

