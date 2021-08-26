import { ChartHelper, CustomIssuePreparation } from '../support/ChartHelper';
import { Dictionary } from '../support/Types';
import { GeneralHelper } from '../support/GeneralHelper';
import { Issue } from './Issue';
import { ChartConfig } from './ChartConfig';

export const CHARTTYPE_BAR = 'bar';
export const CHARTTYPE_LINE = 'line';
export const CHARTTYPE_BUBBLE = 'bubble';
export const CHARTTYPE_SCATTER = 'scatter';
export const CHARTTYPE_DOUGHNUT = 'doughnut';
export const CHARTTYPE_PIE = 'pie';
export const CHARTTYPE_POLAR_AREA = 'polarArea';
export const CHARTTYPE_RADAR = 'radar';

export const CHARTTYPES = [
  CHARTTYPE_BAR,
  CHARTTYPE_LINE,
  CHARTTYPE_BUBBLE,
  CHARTTYPE_SCATTER,
  CHARTTYPE_DOUGHNUT,
  CHARTTYPE_PIE,
  CHARTTYPE_POLAR_AREA,
  CHARTTYPE_RADAR,
];

export const ANNOTATED_CHARTTYPES = [
  CHARTTYPE_BAR,
  CHARTTYPE_LINE,
  CHARTTYPE_BUBBLE,
  CHARTTYPE_SCATTER,
];

export abstract class Chart implements CustomIssuePreparation {
  readonly id: string;

  protected readonly options: Dictionary<any>;

  protected readonly helper: ChartHelper;

  protected customizeOptions(): void {
    this.options.showAnnotations = this.options.showAnnotations
      ?? ANNOTATED_CHARTTYPES.includes(this.getChartType());
  }

  constructor(options: Dictionary<any> = {}) {
    this.options = options;

    this.customizeOptions();

    this.id = this.options.id || GeneralHelper.makeId();
    this.helper = new ChartHelper(this.options);
  }

  protected getChartType(): string {
    return CHARTTYPE_LINE;
  }

  protected getTitle(): string {
    return '';
  }

  protected getOptions(): Dictionary<any> {
    const title = this.options.title ?? this.getTitle();

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

  filter(issue: Issue): boolean {
    return true;
  }

  protected mapIssueDate(issue: Issue): Date {
    return issue.resolved;
  }

  protected filterTimeRange(issues: Issue[]): Issue[] {
    return this.helper.filterTimeRange(
      issues,
      this.mapIssueDate.bind(this),
      this.filter.bind(this),
    );
  }

  protected prepareIssues(issues: Issue[]): Dictionary<Issue[]> {
    return this.helper.prepareIssues(issues, this);
  }

  protected makeChartConfig(grouped: Dictionary<Issue[]>): ChartConfig {
    const labels = this.helper.makeGroupLabels();

    const stateIds = this.options.stateIds || [];

    const datasets = labels.map((groupLabel): number[] => {
      const values = grouped[groupLabel] ?? [];

      return values.map((issue: Issue) => {
        return this.helper.reduceByStates(issue, stateIds);
      });
    });

    return this.helper.makeOverviewChartConfig(
      labels,
      datasets,
    );
  }

  buildConfig(issues: Issue[]): Dictionary<any> {
    const filteredIssues = this.filterTimeRange(issues);

    const grouped = this.prepareIssues(filteredIssues);

    const chartConfig = this.makeChartConfig(grouped);

    const options = this.getOptions();

    if (this.options.showAnnotations ?? true)
      this.helper.addAnnotations(options, chartConfig);

    return {
      type: this.options.chartType ?? this.getChartType(),
      data: chartConfig,
      options: options,
    };
  }
}
