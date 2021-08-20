import { Dictionary } from '../support/Types';
import { GeneralHelper } from '../support/GeneralHelper';
import { Issue } from './Issue';
import { ChartHelper, CustomIssuePreparation } from '../support/ChartHelper';

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

  protected readonly options: Dictionary<any>;

  protected readonly helper: ChartHelper;

  protected readonly customPreparation?: CustomIssuePreparation = undefined;

  constructor(options: Dictionary<any> = {}) {
    this.id = options.id || GeneralHelper.makeId();
    this.options = options;
    this.helper = new ChartHelper(this.options);
  }

  protected getChartType(): string {
    return 'line';
  }

  protected getTitle(): string {
    return '';
  }

  protected getOptions(): Dictionary<any> {
    const title = this.getTitle();

    return {
      responsive: false,
      aspectRatio: 1.5,
      plugins: {
        title: {
          display: !!title,
          text: title,
        },
      },
    };
  }

  protected getStateIds(): any[] {
    return [];
  }

  buildConfig(issues: Issue[]): Dictionary<any> {
    const grouped = this.helper.prepareIssues(issues, this.customPreparation);

    const groupedValues = this.helper.reduce(grouped, this.getStateIds());

    const chartConfig =  this.helper.makeOverviewChartConfig(
      this.helper.makeMonthLabels(groupedValues.length),
      groupedValues,
    );

    return {
      type: this.getChartType(),
      data: chartConfig,
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

  buildChartSites(issues: Issue[], options: Dictionary<any>): ChartSite[];

  handleResponse(responseIssue: ResponseIssue, issue: Issue): void;

  extendHeaderRow(headerRow: Row): void;

  extendRow(row: Row, issue: CustomIssue): void;
}
