import { Dictionary } from '../support/Types';
import { Chart } from './Chart';

export class ChartSite {

  readonly charts: Chart[];

  readonly name: string;

  readonly title: string;

  readonly layoutCols: number;

  readonly layoutRows: number;

  constructor(charts: Chart[], name: string, options: Dictionary<any> = {}) {
    this.charts = charts;
    this.name = name;
    this.title = options.title || '';
    this.layoutCols = options.layoutCols || 2;
    this.layoutRows = options.layoutRows || 2;
  }
}
