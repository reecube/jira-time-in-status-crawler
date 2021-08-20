import { Chart, ChartConfig } from '../model/Project';

export class _TemplateChart extends Chart {
  protected mapData(data: any): ChartConfig {
    const headerRow = Object.keys(data.shift());

    return {
      labels: Object.values(headerRow),
      datasets: [
        {
          label: 'TODO',
          data: [65, 59, 80, 81, 56, 55, 40],
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
        },
      ],
    };
  }
}
