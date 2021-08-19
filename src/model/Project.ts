import { Dictionary } from '../support/Types';
import { GeneralHelper } from '../support/GeneralHelper';

export const PROJECT_VALUE_DEFAULT = null;
export const PROJECT_BOOLEAN_TRUE = 'true';
export const PROJECT_BOOLEAN_FALSE = 'false';

export type Issue = Dictionary<any>;
export type Row = Dictionary<any>;

export type CollectionMapper = (value: any, id: string) => any;

export interface ChartConfig {
  readonly labels: string[];
  readonly datasets: Dictionary<any>[];
}

export abstract class Chart {
  readonly title: string;

  readonly id: string;

  constructor(options: Dictionary<any> = {}) {
    this.title = options.title || '';
    this.id = options.id || GeneralHelper.makeId();
  }

  protected getChartType(): string {
    return 'line';
  }

  protected abstract mapData(data: any): ChartConfig

  protected getOptions(): Dictionary<any> {
    return {};
  }

  buildConfig(data: any): Dictionary<any> {
    return {
      type: this.getChartType(),
      data: this.mapData(data),
      options: this.getOptions(),
    };
  }
}

export interface Project {
  readonly name: string;
  readonly jql: string;
  readonly fields: string[];
  readonly collections: Dictionary<CollectionMapper>;
  readonly charts: Chart[];

  handleResponse(responseIssue: Issue, issue: Issue): void;

  extendHeaderRow(headerRow: Row): void;

  extendRow(row: Row, issue: Issue): void;
}
