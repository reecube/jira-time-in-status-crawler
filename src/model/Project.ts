import { Dictionary } from '../support/Types';
import { GeneralHelper } from '../support/GeneralHelper';
import { Issue } from './Issue';

export const PROJECT_VALUE_DEFAULT = null;
export const PROJECT_BOOLEAN_TRUE = 'true';
export const PROJECT_BOOLEAN_FALSE = 'false';

export type ResponseIssue = Dictionary<any>;
export type CustomIssue = Dictionary<any>;
export type Row = Dictionary<any>;

export type CollectionMapper = (value: any, id: string) => any;

export interface ChartConfig {
  readonly labels: string[];
  readonly datasets: Dictionary<any>[];
}

export abstract class Chart {
  readonly id: string;

  constructor(options: Dictionary<any> = {}) {
    this.id = options.id || GeneralHelper.makeId();
  }

  protected getChartType(): string {
    return 'line';
  }

  protected abstract mapData(data: any): ChartConfig

  protected getOptions(): Dictionary<any> {
    return {
      responsive: false,
    };
  }

  buildConfig(data: any): Dictionary<any> {
    return {
      type: this.getChartType(),
      data: this.mapData(data),
      options: this.getOptions(),
    };
  }
}

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

export interface Project {
  readonly name: string;
  readonly jql: string;
  readonly fields: string[];
  readonly collections: Dictionary<CollectionMapper>;

  buildChartSites(data: any): ChartSite[]

  handleResponse(responseIssue: ResponseIssue, issue: Issue): void;

  extendHeaderRow(headerRow: Row): void;

  extendRow(row: Row, issue: CustomIssue): void;
}
